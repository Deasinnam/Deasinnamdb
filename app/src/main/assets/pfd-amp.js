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
  let theme = 'auto', fromDialog = false, P = null, lastFeed = 0;
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
  applyTheme();
  setInterval(applyTheme, 60000);

  /* ---------- 2. 앱 데이터 → 패키지 ---------- */
  function feed() {
    if (!(H.skin === 'carnival2' || H.skin === 'tablet')) return;
    const now = performance.now();
    if (now - lastFeed < 100) return;
    lastFeed = now;
    if (!!P.nativeGpsRequested !== H.gpsOn) { P.nativeGpsRequested = H.gpsOn; P.renderText(); }
    const patch = {}, gs = H.gs || {}, trip = H.trip, att = H.att;
    if (H.gpsOn) {
      const fix = !!gs.fix, num = v => finite(v) ? v : null;
      Object.assign(patch, {
        source: 'gps', fixValid: fix, speedKmh: fix ? Math.max(0, H.spdNow) : null,
        altitudeM: fix && gs.alt > -9000 ? gs.alt : null, headingDeg: H.hdgNow >= 0 ? H.hdgNow : null,
        accuracyM: fix && gs.acc >= 0 ? gs.acc : null, satellitesUsed: num(gs.satsUsed), satellitesVisible: num(gs.satsSeen),
        maxSpeedKmh: Math.max(0, trip.max), avgSpeedKmh: trip.time > 0 ? trip.dist / trip.time * 3.6 : 0,
        distanceKm: trip.dist / 1000, durationSeconds: trip.time,
        timestampMs: fix ? Date.now() - (gs.age > 0 ? gs.age : 0) : (P.data.timestampMs || Date.now())
      });
    } else if (P.data.source !== 'none') patch.source = 'none';
    if (att && att.ok) { patch.pitchDeg = att.pitch; patch.rollDeg = att.bank; }
    if (Object.keys(patch).length) try { P.updateTelemetry(patch, { touchTimestamp: false }); } catch (e) {}
  }

  window.AmpPfd = { ready: true, panel: P, feed };
})();
