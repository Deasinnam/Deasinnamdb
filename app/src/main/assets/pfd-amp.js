/* 대신남 AMP ↔ 대신남 PFD 패키지 연결
 *
 * pfd/pfd.js, pfd/pfd.css는 받은 패키지 파일 그대로입니다(수정 금지).
 * 패키지 새 버전을 받으면 pfd/ 폴더의 파일만 덮어쓰면 되고, 앱에 맞춘 연결·추가 효과는 모두 이 파일에 있습니다.
 *
 * 하는 일
 *  1. 콕핏 스킨 속도계 자리(#pfdHost)에 패키지를 붙임
 *  2. 앱의 GPS·나침반·기울기·주행 기록을 10Hz로 updateTelemetry에 넣음
 *  3. GPS 켜기/끄기·기록 초기화·속도 경고·디자인(콕핏/에어포스)·주야간·배경 설정을 앱 저장소와 맞춤
 *  4. 선회 효과: 진행 방향이 바뀌면 구름·도심이 관찰자 둘레로 돌고 별·달·지평선이 옆으로 흐름
 *
 * 앱 쪽 값은 index.html이 만든 window.AmpHost로만 읽고 씁니다.
 */
(function () {
  'use strict';
  const H = window.AmpHost;
  const host = document.getElementById('pfdHost');
  if (!H || !host || !window.DaesinnamPFD) return;

  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const wrap = (v, n) => ((v % n) + n) % n;
  const angleDelta = (a, b) => ((b - a + 540) % 360) - 180;

  /* ---------- 4. 선회 효과(패키지 코드를 고치지 않고 장면 객체에 덧붙임) ---------- */
  // 패키지 v1.1~1.2의 장면 값: 구름 z 160~1680(주기 1520) x ±800, 도심 z 35~1100(주기 1065) x ±490,
  // 별 x는 화면 너비 비율(±1.35), 달은 너비의 31% 지점, 화면 가로 시야는 약 72.5°.
  const FOV = 72.5;
  function patchScene(panel) {
    const sc = panel.scene;
    if (!sc || sc.__ampYaw) return;
    sc.__ampYaw = true;
    sc.yawAcc = 0;
    sc.heading = null;
    sc.turn = function (headingDeg) {
      if (!finite(headingDeg)) return;
      if (this.heading === null) { this.heading = headingDeg; return; }
      const d = angleDelta(this.heading, headingDeg);
      this.heading = headingDeg;
      if (Math.abs(d) < 1e-4) return;
      this.yawAcc += d;
      const r = d * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r);
      for (const cl of this.clouds || []) {
        const d0 = 160 + wrap(cl.z - 160 - this.distanceMeters * cl.layer, 1520);
        const x1 = cl.x * cs - d0 * sn, d1 = cl.x * sn + d0 * cs;
        cl.x = wrap(x1 + 800, 1600) - 800; cl.z += d1 - d0;
      }
      for (const p of this.city || []) {
        const d0 = 35 + wrap(p.z - 35 - this.distanceMeters, 1065);
        const x1 = p.x * cs - d0 * sn, d1 = p.x * sn + d0 * cs;
        p.x = wrap(x1 + 490, 980) - 490; p.z += d1 - d0;
      }
      for (const s of this.stars || []) s.x = wrap(s.x - d / FOV + 1.35, 2.7) - 1.35;
    };

    // 달: 방위를 따라 옆으로 움직이고, 시야 밖으로 많이 나가면 천천히 다시 들어옴
    const drawSky = sc.drawSky;
    sc.drawSky = function (c, w, h, night, quality) {
      const st = panel.effective ? panel.effective() : { valid: false };
      if (st.valid && finite(panel.data.headingDeg)) this.turn(panel.display.headingDeg);
      if (!night) return drawSky.call(this, c, w, h, night, quality);
      if (this.moonYaw === undefined) this.moonYaw = this.yawAcc;
      const off = this.moonYaw - this.yawAcc;
      if (Math.abs(off) > 35) this.moonYaw -= Math.sign(off) * Math.min(Math.abs(off) - 35, .6);
      const dx = (this.moonYaw - this.yawAcc) * w / FOV, mx = w * .31, moon = this.moon;
      const oImg = c.drawImage, oGrad = c.createRadialGradient, oRect = c.fillRect, glows = new Set();
      c.drawImage = function (img, x, ...rest) { return oImg.call(this, img, img === moon ? x + dx : x, ...rest); };
      c.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
        const hit = Math.abs(x0 - mx) < .5 && x0 === x1 && y0 === y1;
        const g = oGrad.call(this, hit ? x0 + dx : x0, y0, r0, hit ? x1 + dx : x1, y1, r1);
        if (hit) glows.add(g);
        return g;
      };
      c.fillRect = function (x, ...rest) { return oRect.call(this, glows.has(this.fillStyle) ? x + dx : x, ...rest); };
      try { return drawSky.call(this, c, w, h, night, quality); }
      finally { c.drawImage = oImg; c.createRadialGradient = oGrad; c.fillRect = oRect; }
    };

    // 지평선 건물: 방위만큼 옆으로(도심 불빛은 turn에서 이미 돌렸으므로 그대로 유지)
    const drawGround = sc.drawGround;
    sc.drawGround = function (c, w, h, night, speed, quality) {
      if (!night || !this.yawAcc) return drawGround.call(this, c, w, h, night, speed, quality);
      const delta = this.yawAcc * w / FOV / .028;
      this.distanceMeters += delta;
      for (const p of this.city || []) p.z += delta;
      try { return drawGround.call(this, c, w, h, night, speed, quality); }
      finally { this.distanceMeters -= delta; for (const p of this.city || []) p.z -= delta; }
    };
  }

  /* ---------- 1·3. 붙이기와 설정 동기화 ---------- */
  let theme = 'auto', fromDialog = false, P = null, lastFeed = 0, lastHdg = null;
  // 앱의 야간 기준: "자동"이면 오후 7시~오전 6시를 야간으로
  function applyTheme() {
    if (!P) return;
    const hr = new Date().getHours();
    const t = theme === 'auto' ? (hr >= 19 || hr < 6 ? 'night' : 'day') : theme;
    if (P.settings.theme !== t) P.setSettings({ theme: t }); else P.renderText();
  }
  try {
    P = DaesinnamPFD.mount(host, {
      demo: false,
      nativeBridge: { startGps() { H.gpsStart(); }, stopGps() { H.gpsStop(); } },
      onCommand(e) {
        if (e.type === 'trip:reset') H.resetTrip();
        else if (e.type === 'settings:change') {
          if (fromDialog) theme = e.theme;
          fromDialog = false;
          H.save('pfdSet', {
            skin: e.skin === 'airforce' ? 'airforce' : 'cockpit', theme, mirrorHud: !!e.mirrorHud,
            sceneMotion: e.sceneMotion !== false, sceneQuality: e.sceneQuality === 'balanced' ? 'balanced' : 'high'
          });
          applyTheme();
          H.setLimit(e.limitKmh);
        }
      }
    });
  } catch (e) { P = null; }
  if (!P) return;
  window.pfd = P;
  patchScene(P);
  const ps = H.load('pfdSet', {}) || {};
  theme = ['auto', 'day', 'night'].includes(ps.theme) ? ps.theme : 'auto';
  P.setSettings({
    skin: ps.skin === 'airforce' ? 'airforce' : 'cockpit', mirrorHud: !!ps.mirrorHud,
    limitKmh: Math.max(0, Math.min(300, H.gLimit | 0)),
    sceneMotion: ps.sceneMotion !== false, sceneQuality: ps.sceneQuality === 'balanced' ? 'balanced' : 'high'
  });
  // 패키지 화면에는 사용자가 고른 값(자동/주간/야간)을, 실제 그리기에는 앱이 정한 낮·밤을
  const oOpen = P.openSettings.bind(P), oText = P.renderText.bind(P);
  P.openSettings = function () { oOpen(); this.els.theme.value = theme; };
  // 설정 창에서 저장할 때만 주야간 선택을 바꿈(하단 디자인 목록 변경은 건드리지 않음)
  P.els.form.addEventListener('submit', () => { fromDialog = true; }, true);
  P.renderText = function () {
    oText();
    if (this.els && this.els.themeText) this.els.themeText.textContent = '테마 ' + ({ auto: '자동', day: '주간', night: '야간' }[theme]);
  };
  // 콕핏 스페셜 스킨: 속도·고도 칸을 더 크게 덧그려 숫자가 돋보기로 본 듯 커 보이게(패키지 그리기는 그대로 두고 위에 덧그림)
  // 1.39 조종석 패널: 속도·고도 칸과 아래 나침반 띠를 짙은 올리브 + 얇은 앤틱 황동 테로(패키지 그리기의 바탕색만 바꿔 끼움)
  const olive = (c, x, w, horiz, y0, h0) => { const g = horiz ? c.createLinearGradient(0, y0, 0, y0 + h0) : c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#2b2d1f'); g.addColorStop(.5, '#22251a'); g.addColorStop(1, '#1a1c13'); return g; };
  const brassFrame = (c, x, y, w, h) => { c.save(); c.strokeStyle = '#00000099'; c.lineWidth = 3; c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); c.strokeStyle = '#b08d4c'; c.lineWidth = 1.2; c.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5); c.strokeStyle = '#e9cf8a55'; c.lineWidth = .6; c.strokeRect(x + 3.6, y + 3.6, w - 7.2, h - 7.2); c.restore(); };
  const oliveOn = () => !(P.settings && P.settings.skin === 'airforce');
  // 1.43 계기 스킨: 에어라인(기본, 1.39의 밝은 하늘·흰 눈금·노란 날개) / 에어포스(1.41 HUD: 청회색 저녁·녹색 눈금·황동 테)
  P.__look = H.load('pfdLook', 'airline') === 'airforce' ? 'airforce' : 'airline';
  const isAf = () => P.__look === 'airforce';
  const lookApply = () => { document.documentElement.setAttribute('data-pfdlook', P.__look); };
  lookApply();
  window.AmpPfdLook = { get: () => P.__look, set(v) { P.__look = v === 'airforce' ? 'airforce' : 'airline'; H.save('pfdLook', P.__look); lookApply(); try { lkSync(); } catch (e) {} try { P.render && P.render(); } catch (e) {} } };
  let lkSync = () => {};
  const oTape0 = P.drawTape.bind(P);
  const oTape = function (c, x, y, w, h, kind, value, known) {
    if (!oliveOn()) return oTape0(c, x, y, w, h, kind, value, known);
    const oG = c.createLinearGradient; let first = true;
    c.createLinearGradient = function (...a) { if (first) { first = false; return olive(this, x, w, false); } return oG.apply(this, a); };
    try { oTape0(c, x, y, w, h, kind, value, known); } finally { c.createLinearGradient = oG; }
    brassFrame(c, x, y, w, h);
  };
  const oComp = P.drawCompass.bind(P);
  P.drawCompass = function (c, x, y, w, h, value) {
    if (!oliveOn()) return oComp(c, x, y, w, h, value);
    const oF = c.fillRect; let first = true, sk = this.settings.skin; if (isAf()) this.settings.skin = 'airforce';   // 1.41 나침반 눈금·숫자·방향 상자도 HUD 녹색
    c.fillRect = function (fx, fy, fw, fh) { if (first) { first = false; const s0 = this.fillStyle; this.fillStyle = olive(this, x, w, true, y, h); oF.call(this, fx, fy, fw, fh); this.fillStyle = s0; return; } return oF.call(this, fx, fy, fw, fh); };
    try { oComp(c, x, y, w, h, value); } finally { c.fillRect = oF; this.settings.skin = sk; }
    brassFrame(c, x, y, w, h);
  };
  P.drawTape = function (c, x, y, w, h, kind, value, known) {
    oTape(c, x, y, w, h, kind, value, known);
    { // 칸 이름: 실제 주행 정보임을 분명히(왼쪽 '주행 속도', 오른쪽 'GPS 고도') — 비행 연출 고도와 구분
      const af0 = this.settings.skin === 'airforce'; let g0; if (af0) { g0 = c.createLinearGradient(x, 0, x + w, 0); g0.addColorStop(0, '#03140d'); g0.addColorStop(1, '#061e13'); } else g0 = olive(c, x, w, false);
      c.save(); c.fillStyle = g0; c.fillRect(x + 4, y + 4, w - 8, 24); let fs0 = Math.max(10, Math.min(15, w * .15)); c.font = '700 ' + fs0 + 'px "Noto Sans KR",Arial,sans-serif';
      const lb = kind === 'speed' ? '주행 속도' : 'GPS 고도', tw0 = c.measureText(lb).width; if (tw0 > w - 6) { fs0 *= (w - 6) / tw0; c.font = '700 ' + fs0 + 'px "Noto Sans KR",Arial,sans-serif'; }
      c.fillStyle = '#b4f49f'; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText(lb, x + w / 2, 9); c.restore();
    }
    if (!document.documentElement.hasAttribute('data-cks')) return;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), af = this.settings.skin === 'airforce', isSpeed = kind === 'speed', cy = h * .53;
    const boxH = clamp(h * .26, 78, 124), inset = 3, tip = 14;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.beginPath();
    if (isSpeed) { c.moveTo(x + inset, cy - boxH / 2); c.lineTo(x + w - tip, cy - boxH / 2); c.lineTo(x + w, cy); c.lineTo(x + w - tip, cy + boxH / 2); c.lineTo(x + inset, cy + boxH / 2); }
    else { c.moveTo(x + w - inset, cy - boxH / 2); c.lineTo(x + tip, cy - boxH / 2); c.lineTo(x, cy); c.lineTo(x + tip, cy + boxH / 2); c.lineTo(x + w - inset, cy + boxH / 2); }
    c.closePath(); c.fillStyle = '#000603'; c.fill(); c.strokeStyle = af ? '#a7fa98' : '#e1e8d7'; c.lineWidth = 1.5; c.stroke();
    const warn = isSpeed && known && this.settings.limitKmh > 0 && value > this.settings.limitKmh, txt = known ? String(Math.round(value)) : '—', tx = x + w / 2 + (isSpeed ? -5 : 5);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = warn ? '#ffd16a' : isAf() ? '#c9ffbd' : af ? '#c6ffb6' : isSpeed ? '#f7fbef' : '#b8f3a7';   // 에어포스: 가장 크고 선명한 HUD 녹색
    let fs = clamp(boxH * .62, 40, 84); c.font = '800 ' + fs + 'px Arial'; const mw = w - tip - 10, tw = c.measureText(txt).width;
    if (tw > mw) { fs *= mw / tw; c.font = '800 ' + fs + 'px Arial'; }
    c.save(); c.shadowColor = warn ? '#ffd16a99' : isAf() ? 'rgba(110,255,130,.45)' : '#ffffff55'; c.shadowBlur = isAf() ? 6 : 12; c.fillText(txt, tx, cy - boxH * .08); c.restore();
    c.font = '700 ' + clamp(w * .13, 10, 16) + 'px Arial'; c.fillStyle = af ? '#c0ffad' : '#e4eddd'; c.fillText(isSpeed ? 'km/h' : 'm', tx, cy + boxH * .34);
    const lg = c.createRadialGradient(tx - w * .15, cy - boxH * .3, 2, tx, cy, boxH * .75); lg.addColorStop(0, '#ffffff30'); lg.addColorStop(.45, '#ffffff0c'); lg.addColorStop(1, '#ffffff00');
    c.fillStyle = lg; c.fill();
    c.strokeStyle = '#ffffff26'; c.lineWidth = 1; c.beginPath(); c.ellipse(tx, cy - boxH * .3, w * .32, boxH * .12, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.fillStyle = af ? '#a9ff99' : '#ffd15a'; const edge = isSpeed ? x + w : x, dir = isSpeed ? -1 : 1;
    c.beginPath(); c.moveTo(edge, cy); c.lineTo(edge + dir * 12, cy - 10); c.lineTo(edge + dir * 12, cy + 10); c.closePath(); c.fill();
    c.restore();
  };
  // 콕핏 스페셜: [수평 맞춤]을 속도 칸 바로 아래로(아래 버튼 줄의 같은 버튼은 화면에서 숨김, 기능은 같은 calibrate)
  const wrapEl = host.querySelector('[data-role="canvasWrap"]');
  if (wrapEl) {
    const lv = document.createElement('button');
    lv.type = 'button'; lv.className = 'pfd-levelq'; lv.id = 'pfdLevelQuick'; lv.textContent = '수평 맞춤'; lv.title = '지금 자세를 수평으로 맞춤';
    lv.addEventListener('click', e => { e.stopPropagation(); try { P.calibrate(); } catch (_) {} });
    wrapEl.appendChild(lv);
    // 그 아래 [테마 설정]: 아래 버튼 줄의 테마 버튼과 같은 설정 창을 열고, 글자(테마 자동/주간/야간)도 같이 보여 줌
    const th = document.createElement('button');
    th.type = 'button'; th.className = 'pfd-levelq pfd-themeq'; th.id = 'pfdThemeQuick'; th.title = '테마 설정';
    const thSrc = () => P.root.querySelector('.pfd-tool[data-role="settings"]');
    const thSync = () => { const t = P.els && P.els.themeText; th.textContent = (t && t.textContent) || '테마 설정'; };
    th.addEventListener('click', e => { e.stopPropagation(); const b = thSrc(); if (b) b.click(); else try { P.openSettings(); } catch (_) {} });
    wrapEl.appendChild(th); thSync();
    // 그 아래 [에어라인 / 에어포스] 계기 스킨 바꾸기
    const lk = document.createElement('button');
    lk.type = 'button'; lk.className = 'pfd-levelq pfd-lookq'; lk.id = 'pfdLookQuick'; lk.title = '계기 스킨 바꾸기(에어라인 ↔ 에어포스)';
    lkSync = () => { lk.textContent = isAf() ? '에어포스' : '에어라인'; lk.setAttribute('aria-label', '계기 스킨: ' + lk.textContent + ' (누르면 바꿈)'); };
    lk.addEventListener('click', e => { e.stopPropagation(); window.AmpPfdLook.set(isAf() ? 'airline' : 'airforce'); });
    wrapEl.appendChild(lk); lkSync();
    if (P.els && P.els.themeText && window.MutationObserver) new MutationObserver(thSync).observe(P.els.themeText, { childList: true, characterData: true, subtree: true });
    const place = () => {
      const r = wrapEl.getBoundingClientRect(), w = r.width, h = r.height; if (!w || !h) return;
      const cl = (v, a, b) => Math.max(a, Math.min(b, v)), fh = h - cl(h * .145, 43, 66), tape = cl(w * .12, 67, 175), boxH = cl(fh * .26, 78, 124);
      const top = Math.min(fh - 120, fh * .53 + boxH / 2 + 10);
      for (const [b, dy] of [[lv, 0], [th, 40], [lk, 80]]) { b.style.left = '4px'; b.style.width = (tape - 8) + 'px'; b.style.top = (top + dy) + 'px'; }
    };
    if (window.ResizeObserver) new ResizeObserver(place).observe(wrapEl); place();
  }
  applyTheme();
  setInterval(applyTheme, 60000);
  // 절전 모드: 비행 계기를 30fps로(사용자가 고른 품질은 그대로 저장)
  setInterval(() => {
    if (!P || !P.settings) return;
    const want = (window.AmpPwr && window.AmpPwr.saver) ? 'balanced' : ((H.load('pfdSet', {}) || {}).sceneQuality === 'balanced' ? 'balanced' : 'high');
    if (P.settings.sceneQuality !== want) P.settings.sceneQuality = want;
  }, 2000);

  /* ---------- 2. 앱 데이터 → 패키지 ---------- */
  function feed() {
    if (!['carnival2', 'carnival3', 'carnival4', 'carnival5', 'carnival6', 'carnival7', 'tablet'].includes(H.skin)) return;
    const now = performance.now();
    if (now - lastFeed < 100) return;
    lastFeed = now;
    if (!!P.nativeGpsRequested !== H.gpsOn) { P.nativeGpsRequested = H.gpsOn; P.renderText(); }
    const patch = {}, gs = H.gs || {}, trip = H.trip, att = H.att;
    if (H.gpsOn) {
      const fix = !!gs.fix, num = v => finite(v) ? v : null;
      // 진행 방향: 움직이는 동안(5km/h 이상, GPS 수신)의 값만 믿고, 저속·정차·수신 끊김에는 마지막 유효 방향을 유지(359°→0°는 패키지가 짧은 쪽으로 보간)
      const rawH = H.hdgNow >= 0 ? H.hdgNow : null, moving = fix && H.spdNow >= 5;
      if (moving && rawH !== null) lastHdg = rawH;
      const hdg = moving ? rawH : (lastHdg !== null ? lastHdg : rawH);
      Object.assign(patch, {
        source: 'gps', fixValid: fix, speedKmh: fix ? Math.max(0, H.spdNow) : null,
        altitudeM: fix && finite(gs.alt) && gs.alt > -9000 ? gs.alt : null, headingDeg: hdg,
        accuracyM: fix && gs.acc >= 0 ? gs.acc : null, satellitesUsed: num(gs.satsUsed), satellitesVisible: num(gs.satsSeen),
        maxSpeedKmh: Math.max(0, trip.max), avgSpeedKmh: trip.time > 0 ? trip.dist / trip.time * 3.6 : 0,
        distanceKm: trip.dist / 1000, durationSeconds: trip.time,
        timestampMs: fix ? Date.now() - (gs.age > 0 ? gs.age : 0) : (P.data.timestampMs || Date.now())
      });
    } else if (P.data.source !== 'none') patch.source = 'none';
    if (att && att.ok) { patch.pitchDeg = att.pitch; patch.rollDeg = att.bank; }
    if (Object.keys(patch).length) try { P.updateTelemetry(patch, { touchTimestamp: false }); } catch (e) {}
  }

  // 앱에서 주간/야간/자동 바꾸기(조종 패널 주간·야간 스위치)
  function setTheme(t) {
    if (!['auto', 'day', 'night'].includes(t)) return;
    theme = t; H.save('pfdSet', Object.assign({}, H.load('pfdSet', {}) || {}, { theme: t }));
    applyTheme(); try { P.renderText(); } catch (_) {}
  }
  window.AmpPfd = { ready: true, panel: P, feed, setTheme, get theme() { return theme; } };
})();
