/* 대신남 태블릿 가로모드 — 조종석 콘셉트 스킨 (독립 모듈)
 *
 * 스킨 값 'tablet'일 때만 동작합니다. 기존 창(.top, #app)은 숨기고 이 파일이 만든 #tabCk 화면을 보여 줍니다.
 * 재생·GPS·지도·장치 제어는 기존 앱 기능(전역 함수·AndroidBridge)을 그대로 불러 쓰고, 기존 코드는 바꾸지 않습니다.
 * 빼려면 tablet.js, tablet.css, index.html의 스킨 목록 한 줄과 두 태그만 지우면 됩니다.
 */
(function () {
  'use strict';
  const NBx = window.AndroidBridge || null;
  const H = window.AmpTk || {};                       // index.html이 내준 읽기·호출 창구
  const has = n => typeof H[n] === 'function';
  const G = expr => { try { return expr(); } catch (e) { return undefined; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), fin = v => typeof v === 'number' && Number.isFinite(v);
  const store = { get(k, d) { try { const v = localStorage.getItem('dna_tk_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('dna_tk_' + k, JSON.stringify(v)); } catch (e) {} } };
  const say = t => { if (has('toast')) H.toast(t); };
  const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const CARD = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const card = h => CARD[Math.round(((h % 360) + 360) % 360 / 45) % 8];
  // 앱 시각화가 매 프레임 채우는 파형(전역 W) — 지역 이름과 겹치지 않게 전역에서 직접 읽음
  const readWave = () => { const w = G(() => H.wave); return w && w.length ? w : null; };
  const svg = (p, vb = '0 0 24 24') => `<svg viewBox="${vb}" aria-hidden="true"><path d="${p}"/></svg>`;
  const native = !!(NBx && NBx.cockpitState);

  /* ---------- 화면 만들기 ---------- */
  const root = document.createElement('div');
  root.id = 'tabCk';
  root.setAttribute('aria-label', '대신남 태블릿 가로모드');
  root.innerHTML = `
  <header class="tk-top sc">
    <div class="tk-brand">DAESINNAM ONE</div>
    <div class="tk-stat" role="status"><span data-s="gps"><i></i>GPS</span><span data-s="audio"><i></i>AUDIO</span><span data-s="bt"><i></i>BT</span><span data-s="wifi"><i></i>WIFI</span></div>
    <div class="tk-right"><span class="tk-time" id="tkTime">--:--<small></small></span><select class="tk-skin" id="tkSkin" aria-label="스킨"></select></div>
  </header>
  <main class="tk-main">
    <nav class="tk-side L" aria-label="지도 조작">
      <button class="tk-key on" data-k="map">MAP</button><button class="tk-key" data-k="dest">DEST</button>
      <button class="tk-key" data-k="zin">ZOOM<small>+</small></button><button class="tk-key" data-k="zout">ZOOM<small>−</small></button>
    </nav>
    <section class="tk-panel tk-left sc"><div class="tk-h"><span id="tkLeftT">MAP</span><em id="tkLeftS"></em></div>
      <div class="tk-glass">
        <div id="tkMap"></div>
        <div class="tk-card tk-c1" id="tkC1"><svg class="ar" viewBox="0 0 24 24"><path fill="#fff" d="M12 2 20 21 12 16.5 4 21z"/></svg><div><b id="tkC1v">— km/h</b><span id="tkC1s">위치를 찾는 중</span></div></div>
        <div class="tk-north" id="tkNorth" title="북쪽 위로"><svg viewBox="0 0 24 24"><path fill="#fff" d="M12 2 18 20 12 16 6 20z"/></svg></div>
        <div class="tk-card tk-c2" id="tkC2"><div><b id="tkTripT">0 min</b><b id="tkTripD">0.0 km</b></div><span id="tkTripS">주행 기록</span></div>
        <button class="tk-card tk-c3" id="tkMenu" aria-label="내비 앱 열기">${svg('M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z')}</button>
        <div class="tk-appmap" id="tkAppMap" hidden></div>
        <ul class="tk-list" id="tkList" hidden></ul>
        <div class="tk-sys" id="tkSys" hidden></div>
      </div>
    </section>
    <section class="tk-panel tk-pfd sc"><div class="tk-glass"><canvas id="tkPfd" role="img" aria-label="속도·고도·방향 계기"></canvas></div></section>
    <nav class="tk-side R" aria-label="오디오 조작">
      <button class="tk-key" data-k="audio">AUDIO</button><button class="tk-key" data-k="source">SOURCE</button>
      <button class="tk-key" data-k="list">LIST</button><button class="tk-key" data-k="setup">SETUP</button>
    </nav>
    <section class="tk-panel tk-audio sc"><div class="tk-h"><span>AUDIO</span><em id="tkAuSt"></em></div>
      <div class="tk-glass">
        <div class="tk-src" id="tkSrc">LOCAL AUDIO</div>
        <div class="tk-cov" id="tkCov"></div>
        <canvas id="tkWave"></canvas>
        <div class="tk-tt" id="tkTt">—</div><div class="tk-ar" id="tkAr">&nbsp;</div>
        <div class="tk-seek" id="tkSeek" role="slider" aria-label="재생 위치" tabindex="0"><i></i><b></b></div>
        <div class="tk-times"><span id="tkCur">0:00</span><span id="tkDur">0:00</span></div>
        <div class="tk-tr"><button data-a="prev" aria-label="이전 곡">${svg('M6 5h3v14H6zM20 5v14L10 12z')}</button><button class="pp" data-a="toggle" aria-label="재생/일시정지" id="tkPP">${svg('M7 4l13 8-13 8z')}</button><button data-a="next" aria-label="다음 곡">${svg('M15 5h3v14h-3zM4 5v14l10-7z')}</button></div>
      </div>
    </section>
  </main>
  <div class="tk-check sc" id="tkCheck"><b>PRE-DRIVE CHECK</b><span data-c="gps"><i></i>GPS READY</span><span data-c="audio"><i></i>AUDIO READY</span><span data-c="bt"><i></i>BT CONNECTED</span><em id="tkCheckNote"></em></div>
  <div class="tk-ctrl">
    <div class="tk-mod sc"><h4>VOLUME</h4><div class="row"><div class="tk-knob" id="tkVol" style="--ks:clamp(92px,13vh,130px)" role="slider" aria-label="볼륨" aria-valuemin="0" aria-valuemax="100" tabindex="0"><svg class="ring" viewBox="0 0 100 100"></svg><div class="cap"></div></div><span class="tk-val" id="tkVolV">—</span></div></div>
    <div class="tk-mod sc"><h4>WIFI</h4><div class="row"><svg class="tk-ico" id="tkWifiI" viewBox="0 0 24 24"><path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1.2" fill="currentColor"/></svg><button class="tk-tog" id="tkWifi" role="switch" aria-checked="false" aria-label="와이파이"></button><div class="tk-lab"><span data-on>ON</span><span data-off>OFF</span></div></div><div class="tk-note" id="tkWifiN"></div></div>
    <div class="tk-mod sc"><div class="tk-sosw" id="tkSosW"><button class="tk-sosb" id="tkSos" aria-label="SOS 전화">SOS</button><button class="tk-cover" id="tkCover" aria-label="SOS 덮개 열기"><b>LIFT</b></button></div><div class="cap2" id="tkSosN">LIFT TO OPEN</div></div>
    <div class="tk-mod sc"><h4>BT</h4><div class="row"><div class="tk-lab"><span data-on>ON</span><span data-off>OFF</span></div><button class="tk-tog" id="tkBt" role="switch" aria-checked="false" aria-label="블루투스"></button><svg class="tk-ico" id="tkBtI" viewBox="0 0 24 24"><path d="M7 7l10 10-5 4V3l5 4L7 17"/></svg></div><div class="tk-note" id="tkBtN"></div></div>
    <div class="tk-mod sc"><h4>DRIVE MODE</h4><button class="tk-dm" id="tkDm">${svg('M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zm2.2-1h9.6l-1-3H8.2zM7.5 15a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm9 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z')}<span id="tkDmT">NORMAL</span></button></div>
    <div class="tk-mod sc"><h4>BRIGHTNESS</h4><div class="row"><div class="tk-knob" id="tkBri" style="--ks:clamp(70px,10vh,96px)" role="slider" aria-label="화면 밝기" aria-valuemin="10" aria-valuemax="100" tabindex="0"><svg class="ring" viewBox="0 0 100 100"></svg><div class="cap"></div></div></div><div class="cap2" id="tkBriV">100%</div></div>
  </div>
  <footer class="tk-tabs" role="tablist">
    <button class="on" data-t="nav" role="tab">${svg('M12 2 20 21 12 16.5 4 21z')}NAV</button>
    <button data-t="audio" role="tab">${svg('M10 3v11.6A4 4 0 1 0 12 18V8h6V3z')}AUDIO</button>
    <button data-t="system" role="tab">${svg('M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.7a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.7h4l.4-2.7a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z')}SYSTEM</button>
    <div class="ver" id="tkVer">TABLET LANDSCAPE · CONCEPT 01</div>
  </footer>`;
  document.body.appendChild(root);
  const $ = s => root.querySelector(s);

  /* ---------- 앱 기능 빌려 쓰기: 대신남 원의 지도 창·PFD·콕핏 시계를 이 화면으로 옮겼다가 나갈 때 제자리로 ---------- */
  const borrowed = [];
  function borrow(el, into, before) {
    if (!el || !into || el.parentNode === into) return false;
    borrowed.push({ el, parent: el.parentNode, next: el.nextSibling });
    into.insertBefore(el, before || null); return true;
  }
  function giveBack() {
    while (borrowed.length) { const b = borrowed.pop(); b.parent.insertBefore(b.el, b.next && b.next.parentNode === b.parent ? b.next : null); }
  }
  const appPfd = () => !!(H.appPfd && window.AmpPfd && window.AmpPfd.ready && document.getElementById('pfdHost'));
  const appMap = () => !!(H.appMap && document.getElementById('wMap'));
  const appClock = () => !!(H.appClock && document.getElementById('clock'));
  let useMap = false, usePfd = false;
  function borrowAll() {
    usePfd = appPfd() && borrow(document.getElementById('pfdHost'), root.querySelector('.tk-pfd .tk-glass'));
    if (usePfd) { $('#tkPfd').hidden = true; setTimeout(() => { try { window.AmpPfd.panel.resize(); } catch (e) {} }, 60); }
    useMap = appMap() && borrow(document.getElementById('wMap'), $('#tkAppMap'));
    if (appClock() && borrow(document.getElementById('clock'), root.querySelector('.tk-right'), $('#tkSkin'))) $('#tkTime').hidden = true;
    root.classList.toggle('appmap', useMap); root.classList.toggle('apppfd', usePfd);
  }
  function returnAll() {
    giveBack(); $('#tkTime').hidden = false; $('#tkPfd').hidden = false;
    if (usePfd) setTimeout(() => { try { window.AmpPfd.panel.resize(); } catch (e) {} }, 60);
    useMap = usePfd = false; root.classList.remove('appmap', 'apppfd');
  }

  /* ---------- 스킨 켜고 끄기 ---------- */
  let on = false;
  const isOn = () => document.documentElement.dataset.skin === 'tablet';
  function activate(v) {
    if (v === on) return;
    on = v;
    if (on) {
      fillSkinSelect();
      borrowAll();
      if (store.get('gps', true) && has('gpsStart') && G(() => H.gpsOn) === false) try { H.gpsStart(); } catch (e) {}
      if (has('attWant')) try { H.attWant(true); } catch (e) {}
      if (NBx && NBx.keepScreenOn) try { NBx.keepScreenOn(true); } catch (e) {}
      applyBri(bri, false);
      setTab(tab);
      loop();
    } else {
      returnAll();
      if (has('attWant') && !H.appPfd) try { H.attWant(false); } catch (e) {}
      if (NBx && NBx.setScreenBrightness) try { NBx.setScreenBrightness(-1); } catch (e) {}
      if (NBx && NBx.keepScreenOn) try { NBx.keepScreenOn(!!G(() => H.hudOn)); } catch (e) {}
    }
  }
  new MutationObserver(() => activate(isOn())).observe(document.documentElement, { attributes: true, attributeFilter: ['data-skin'] });

  function fillSkinSelect() {
    const sel = $('#tkSkin'), src = document.getElementById('skin');
    if (!src) return;
    sel.innerHTML = src.innerHTML; sel.value = 'tablet';
  }
  $('#tkSkin').onchange = e => { const v = e.target.value; if (has('setSkin')) H.setSkin(v); };

  /* ---------- 탭: NAV(지도) · AUDIO(재생 목록) · SYSTEM ---------- */
  let tab = store.get('tab', 'nav');
  function setTab(t) {
    tab = ['nav', 'audio', 'system'].includes(t) ? t : 'nav'; store.set('tab', tab);
    root.querySelectorAll('.tk-tabs button').forEach(b => { const o = b.dataset.t === tab; b.classList.toggle('on', o); b.setAttribute('aria-selected', String(o)); });
    const nav = tab === 'nav';
    ['#tkMap', '#tkC1', '#tkC2', '#tkMenu', '#tkNorth'].forEach(s => { const v = nav && !useMap; $(s).hidden = !v; $(s).style.display = v ? '' : 'none'; });
    $('#tkAppMap').hidden = !(nav && useMap);
    $('#tkList').hidden = tab !== 'audio'; $('#tkSys').hidden = tab !== 'system';
    $('#tkLeftT').textContent = nav ? 'MAP' : tab === 'audio' ? 'PLAYLIST' : 'SYSTEM';
    root.querySelector('[data-k="map"]').classList.toggle('on', nav);
    root.querySelector('[data-k="list"]').classList.toggle('on', tab === 'audio');
    root.querySelector('[data-k="setup"]').classList.toggle('on', tab === 'system');
    if (nav && useMap) setTimeout(() => has('mapRefresh') && H.mapRefresh(), 80); else if (nav) mapInit(); else if (tab === 'audio') renderList(true); else renderSys();
    if (map) setTimeout(() => map.invalidateSize(), 60);
  }
  root.querySelector('.tk-tabs').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) setTab(b.dataset.t); });

  /* ---------- 지도(Leaflet, OpenStreetMap) ---------- */
  let map = null, me = null, trail = null, follow = true, mapLoading = false;
  const pts = [];
  function loadCss(href) { return new Promise((ok, no) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = ok; l.onerror = no; document.head.appendChild(l); }); }
  function loadJs(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function leaflet() {
    if (window.L && window.L.map) return Promise.resolve();
    const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/';
    return loadCss('leaflet/leaflet.css').catch(() => loadCss(CDN + 'leaflet.min.css'))
      .then(() => loadJs('leaflet/leaflet.js').catch(() => loadJs(CDN + 'leaflet.min.js')));
  }
  function mapInit() {
    if (map || mapLoading) return;
    mapLoading = true;
    leaflet().then(() => {
      mapLoading = false;
      const p = pos();
      map = L.map($('#tkMap'), { zoomControl: false, attributionControl: true }).setView(p ? [p.lat, p.lon] : [37.5444, 127.0374], 16);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
      me = L.marker(p ? [p.lat, p.lon] : [37.5444, 127.0374], { icon: L.divIcon({ className: 'tk-me', html: '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#4be38a22" stroke="#4be38a" stroke-width="1.5"/><path d="M22 6 32 34 22 28 12 34z" fill="#4be38a" stroke="#06140c" stroke-width="1.5"/></svg>', iconSize: [44, 44] }), interactive: false }).addTo(map);
      trail = L.polyline([], { color: '#4be38a', weight: 6, opacity: .85 }).addTo(map);
      map.on('dragstart', () => { follow = false; root.querySelector('[data-k="map"]').classList.remove('on'); });
      setTimeout(() => map.invalidateSize(), 80);
    }).catch(() => { mapLoading = false; $('#tkC1s').textContent = '지도를 불러오지 못했어요 (인터넷 확인)'; });
  }
  new ResizeObserver(() => { if (map) map.invalidateSize(); }).observe($('#tkMap'));

  /* ---------- 데이터: 앱의 GPS·자세·재생 상태 ---------- */
  const DEMO = !(NBx && NBx.gpsStatus);           // 웹 미리보기: 시연 값
  let demo = { t0: performance.now(), lat: 37.5444, lon: 127.0374 };
  function pos() {
    const g = G(() => H.gs) || {};
    if (g.fix && fin(g.lat) && fin(g.lon)) return { lat: g.lat, lon: g.lon };
    return DEMO ? { lat: demo.lat, lon: demo.lon } : null;
  }
  function tele() {
    const g = G(() => H.gs) || {}, gpsOnNow = !!G(() => H.gpsOn);
    if (DEMO) {
      const t = (performance.now() - demo.t0) / 1000;
      const spd = 62 + Math.sin(t / 7) * 22 + Math.sin(t / 2.3) * 3, hdg = (285 + Math.sin(t / 11) * 25 + 360) % 360;
      return { demo: true, fix: true, spd, hdg, alt: 126 + Math.sin(t / 9) * 18, pitch: Math.sin(t / 3) * 3, bank: Math.sin(t / 4.5) * 9, acc: 4, sats: '12/15' };
    }
    const a = G(() => H.att) || {};
    if (has('attPoll') && a.on) try { H.attPoll(); } catch (e) {}
    const spd = gpsOnNow && g.fix ? Math.max(0, G(() => H.spdNow) || 0) : null;
    const h = G(() => H.hdgNow);
    return {
      demo: false, gps: gpsOnNow, fix: !!g.fix, spd, hdg: fin(h) && h >= 0 ? h : null, alt: g.fix && g.alt > -9000 ? g.alt : null,
      pitch: a.ok ? a.pitch : 0, bank: a.ok ? a.bank : 0, att: !!a.ok, acc: g.acc, sats: fin(g.satsUsed) ? g.satsUsed + '/' + (g.satsSeen || 0) : '—'
    };
  }

  /* ---------- PFD 계기 ---------- */
  const pfd = $('#tkPfd'), pg = pfd.getContext('2d');
  let disp = { spd: 0, alt: 0, hdg: 0, pitch: 0, bank: 0 };
  function sizeCanvas(cv) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return { w, h, d };
  }
  function drawPfd(T) {
    const { w: W, h: H, d } = sizeCanvas(pfd), c = pg;
    const k = .18;
    if (T.spd != null) disp.spd += (T.spd - disp.spd) * k;
    if (T.alt != null) disp.alt += (T.alt - disp.alt) * k;
    if (T.hdg != null) disp.hdg = (disp.hdg + ((T.hdg - disp.hdg + 540) % 360 - 180) * k + 360) % 360;
    disp.pitch += ((T.pitch || 0) - disp.pitch) * k; disp.bank += ((T.bank || 0) - disp.bank) * k;
    const known = T.spd != null, hk = T.hdg != null;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * .52, S = Math.min(H, W * .85), ppd = S / 62, f = (s, wt = 600) => `${wt} ${Math.round(s * d)}px "Barlow Condensed","Rajdhani",Arial,sans-serif`;
    // 자세계(하늘·땅)
    c.save(); c.translate(cx, cy); c.rotate(-disp.bank * Math.PI / 180); c.translate(0, disp.pitch * ppd);
    let g = c.createLinearGradient(0, -H, 0, 0); g.addColorStop(0, '#08203f'); g.addColorStop(.75, '#1d5a9c'); g.addColorStop(1, '#4a8fd0');
    c.fillStyle = g; c.fillRect(-W * 2, -H * 2, W * 4, H * 2);
    g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6b4a2a'); g.addColorStop(.5, '#4a321c'); g.addColorStop(1, '#2a1c10');
    c.fillStyle = g; c.fillRect(-W * 2, 0, W * 4, H * 2);
    // 지평선 산
    c.fillStyle = '#1b2f4a';
    c.beginPath(); c.moveTo(-W * 2, 0);
    for (let i = -40; i <= 40; i++) { const x = i * W / 30, y = -(Math.abs(Math.sin(i * .7 + 1) * Math.sin(i * .23)) * S * .05 + S * .006); c.lineTo(x, y); }
    c.lineTo(W * 2, 0); c.closePath(); c.fill();
    c.strokeStyle = '#d6f5e1'; c.lineWidth = 2 * d; c.beginPath(); c.moveTo(-W * 2, 0); c.lineTo(W * 2, 0); c.stroke();
    // 피치 눈금(방향 테이프·아래 숫자와 겹치지 않게 가운데 구역만)
    c.restore(); c.save(); c.beginPath(); c.rect(0, H * .14, W, H * .7); c.clip();
    c.translate(cx, cy); c.rotate(-disp.bank * Math.PI / 180); c.translate(0, disp.pitch * ppd);
    c.strokeStyle = '#7dffb0'; c.fillStyle = '#7dffb0'; c.lineWidth = 1.6 * d; c.font = f(15); c.textBaseline = 'middle';
    for (let a = -20; a <= 20; a += 5) {
      if (!a) continue; const y = -a * ppd, len = a % 10 ? W * .045 : W * .11;
      c.beginPath(); c.moveTo(-len, y); c.lineTo(len, y); c.stroke();
      if (a % 10 === 0) { c.textAlign = 'right'; c.fillText(String(a), -len - 10 * d, y); c.textAlign = 'left'; c.fillText(String(a), len + 10 * d, y); }
    }
    c.restore();
    // 비행기 기준표
    c.strokeStyle = '#7dffb0'; c.lineWidth = 3 * d; c.beginPath();
    c.moveTo(cx - W * .19, cy); c.lineTo(cx - W * .06, cy); c.moveTo(cx + W * .06, cy); c.lineTo(cx + W * .19, cy); c.stroke();
    c.fillStyle = '#7dffb0'; c.beginPath(); c.moveTo(cx, cy - 12 * d); c.lineTo(cx + 22 * d, cy + 8 * d); c.lineTo(cx - 22 * d, cy + 8 * d); c.closePath(); c.fill();
    c.fillStyle = '#06140c'; c.beginPath(); c.moveTo(cx, cy - 5 * d); c.lineTo(cx + 11 * d, cy + 4 * d); c.lineTo(cx - 11 * d, cy + 4 * d); c.closePath(); c.fill();
    // 위쪽 방향 테이프
    const tt = H * .085, tw = W * .5, tx = cx - tw / 2, hppd = tw / 60;
    c.save(); c.beginPath(); c.rect(tx, tt * .2, tw, tt * 1.1); c.clip();
    c.strokeStyle = '#e6ebe8'; c.fillStyle = '#e6ebe8'; c.lineWidth = 1.5 * d; c.font = f(19); c.textAlign = 'center'; c.textBaseline = 'bottom';
    if (hk) for (let n = Math.floor((disp.hdg - 35) / 5) * 5; n <= disp.hdg + 35; n += 5) {
      const x = cx + (n - disp.hdg) * hppd, m = ((n % 360) + 360) % 360, big = m % 15 === 0;
      c.beginPath(); c.moveTo(x, tt * 1.25); c.lineTo(x, tt * (big ? .78 : 1)); c.stroke();
      if (big) c.fillText(String(m).padStart(3, '0'), x, tt * .74);
    }
    c.restore();
    c.strokeStyle = '#e6ebe8'; c.lineWidth = 1.2 * d; c.beginPath(); c.moveTo(tx, tt * 1.3); c.lineTo(tx + tw, tt * 1.3); c.stroke();
    c.fillStyle = '#7dffb0'; c.beginPath(); c.moveTo(cx, tt * .5); c.lineTo(cx - 9 * d, tt * .5 - 12 * d); c.lineTo(cx + 9 * d, tt * .5 - 12 * d); c.closePath(); c.fill();
    // 속도(왼쪽)·고도(오른쪽) 큰 숫자 + 테이프
    const tapeTop = H * .27, tapeBot = H * .82, tapeH = tapeBot - tapeTop, mid = (tapeTop + tapeBot) / 2;
    const tape = (x, val, step, lab, pxPer, right, known) => {
      c.save(); c.beginPath(); c.rect(x - 60 * d, tapeTop, 120 * d, tapeH); c.clip();
      c.strokeStyle = '#4be38a'; c.fillStyle = '#e6ebe8'; c.lineWidth = 1.5 * d; c.font = f(16); c.textBaseline = 'middle'; c.textAlign = right ? 'left' : 'right';
      c.beginPath(); c.moveTo(x, tapeTop); c.lineTo(x, tapeBot); c.stroke();
      if (known) for (let n = Math.floor((val - tapeH / 2 / pxPer) / step) * step; n <= val + tapeH / 2 / pxPer; n += step) {
        const y = mid - (n - val) * pxPer, big = n % lab === 0;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + (right ? 1 : -1) * (big ? 14 : 8) * d, y); c.stroke();
        if (big) c.fillText(String(n), x + (right ? 20 : -20) * d, y);
      }
      c.restore();
      c.fillStyle = '#4be38a'; c.beginPath();
      if (right) { c.moveTo(x - 2 * d, mid); c.lineTo(x - 14 * d, mid - 9 * d); c.lineTo(x - 14 * d, mid + 9 * d); }
      else { c.moveTo(x + 2 * d, mid); c.lineTo(x + 14 * d, mid - 9 * d); c.lineTo(x + 14 * d, mid + 9 * d); }
      c.closePath(); c.fill();
    };
    const lx = W * .11, rx = W * .89;
    tape(lx, disp.spd, 10, 20, tapeH / 120, false, known);
    tape(rx, disp.alt, 50, 100, tapeH / 400, true, T.alt != null);
    const over = known && disp.spd > (G(() => H.gLimit) || 0) && (G(() => H.gLimit) || 0) > 0;
    c.textBaseline = 'alphabetic';
    c.font = f(Math.min(W * .075, 72), 600); c.fillStyle = over ? '#ff5b4b' : '#fff';
    c.textAlign = 'left'; c.fillText(known ? String(Math.round(disp.spd)) : '—', W * .07, H * .2);
    c.font = f(17); c.fillStyle = '#e6ebe8'; c.fillText('km/h', W * .07 + 2 * d, H * .245);
    c.font = f(Math.min(W * .075, 72), 600); c.fillStyle = '#fff'; c.textAlign = 'right';
    c.fillText(T.alt != null ? String(Math.round(disp.alt)) : '—', W * .93, H * .2);
    c.font = f(17); c.fillStyle = '#e6ebe8'; c.fillText('m', W * .93 - 2 * d, H * .245);
    // 아래 방향 숫자
    const by = H * .9;
    c.strokeStyle = '#e6ebe8'; c.lineWidth = 1.4 * d;
    for (let i = -6; i <= 6; i++) { const x = cx + i * 9 * d; c.beginPath(); c.moveTo(x, by - (i % 3 ? 6 : 12) * d); c.lineTo(x, by); c.stroke(); }
    c.fillStyle = '#7dffb0'; c.beginPath(); c.moveTo(cx, by - 20 * d); c.lineTo(cx - 6 * d, by - 12 * d); c.lineTo(cx + 6 * d, by - 12 * d); c.closePath(); c.fill();
    c.font = f(Math.min(W * .045, 40), 600); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(hk ? Math.round(disp.hdg) % 360 + '°' : '—', cx, H * .985);
    c.font = f(13); c.fillStyle = '#9fb3a8'; c.textAlign = 'right';
    c.fillText(T.demo ? 'SENSOR DEMO' : !T.gps ? 'GPS OFF' : !T.fix ? 'NO FIX' : T.att ? 'GPS · ATT' : 'GPS', W * .97, H * .975);
    if (hk) { c.textAlign = 'left'; c.fillText(card(disp.hdg), W * .03, H * .975); }
  }

  /* ---------- 오디오 ---------- */
  const wv = $('#tkWave'), wg = wv.getContext('2d'), WN = 96, wbars = new Float32Array(WN);
  function audioState() {
    const el = id => document.getElementById(id);
    const title = (el('npTitle') && el('npTitle').textContent.trim()) || '—';
    const artist = (el('npArtist') && el('npArtist').textContent.trim()) || '';
    const seek = el('seek'), cur = el('tCur'), dur = el('tDur');
    const playing = !!(el('stPlay') && el('stPlay').classList.contains('on'));
    return { title, artist, frac: seek ? (+seek.value || 0) / (+seek.max || 1000) : 0, cur: cur ? cur.textContent : '0:00', dur: dur ? dur.textContent : '0:00', playing, mode: G(() => H.mode) || 'local' };
  }
  function drawWave(A) {
    const { w: W, h: H, d } = sizeCanvas(wv), c = wg;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    const live = A.playing, wave = readWave();
    for (let i = 0; i < WN; i++) {
      let v = 0;
      if (live && wave && wave.length) {
        const seg = Math.floor(wave.length / WN), s0 = i * seg; let s = 0;
        for (let k = 0; k < seg; k += 2) { const x = (wave[s0 + k] - 128) / 128; s += x * x; }
        v = Math.min(1, Math.sqrt(s / Math.max(1, seg / 2)) * 3.2);
      } else if (live) v = .15 + .1 * Math.sin(performance.now() / 160 + i * .6);
      wbars[i] = Math.max(v, wbars[i] * .82);
    }
    const bw = W / WN, mid = H / 2;
    for (let i = 0; i < WN; i++) {
      const v = Math.max(.03, wbars[i]), h = v * H * .46, x = i * bw + bw * .25, past = i / WN <= A.frac;
      c.fillStyle = past ? '#4be38a' : '#2b6b45';
      c.fillRect(x, mid - h, Math.max(1, bw * .5), h * 2);
    }
  }
  let lastAu = '';
  function renderAudio() {
    const A = audioState();
    const key = A.title + '|' + A.artist + '|' + A.cur + '|' + A.dur + '|' + A.playing + '|' + A.mode;
    $('#tkSeek i').style.width = (A.frac * 100) + '%'; $('#tkSeek b').style.left = (A.frac * 100) + '%';
    if (key !== lastAu) {
      lastAu = key;
      $('#tkTt').textContent = A.title; $('#tkAr').textContent = A.artist || ' ';
      $('#tkCur').textContent = A.cur; $('#tkDur').textContent = A.dur;
      $('#tkSrc').textContent = A.mode === 'ext' ? 'EXTERNAL APP' : 'LOCAL AUDIO';
      $('#tkAuSt').textContent = A.playing ? 'PLAYING' : 'PAUSED';
      $('#tkPP').innerHTML = A.playing ? svg('M6 4h4v16H6zM14 4h4v16h-4z') : svg('M7 4l13 8-13 8z');
      root.querySelector('[data-k="audio"]').classList.toggle('on', A.playing);
      const cv = document.getElementById('cover'), bg = cv ? cv.style.backgroundImage : '';
      $('#tkCov').style.backgroundImage = bg || ''; $('#tkCov').classList.toggle('empty', !bg || bg === 'none');
      if (tab === 'audio') renderList();
    }
    drawWave(A);
    return A;
  }
  root.querySelector('.tk-tr').addEventListener('click', e => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const fn = b.dataset.a; if (has(fn)) try { H[fn](); } catch (x) {}
    setTimeout(() => { lastAu = ''; }, 150);
  });
  // 재생 위치: 기존 seek 슬라이더에 값 넣고 이벤트 보내기
  (function () {
    const el = $('#tkSeek'); let pid = null;
    const setAt = (x, commit) => {
      const r = el.getBoundingClientRect(), f = clamp((x - r.left) / r.width, 0, 1), s = document.getElementById('seek'); if (!s) return;
      s.value = String(Math.round(f * (+s.max || 1000)));
      s.dispatchEvent(new Event('input', { bubbles: true }));
      if (commit) s.dispatchEvent(new Event('change', { bubbles: true }));
      $('#tkSeek i').style.width = (f * 100) + '%'; $('#tkSeek b').style.left = (f * 100) + '%';
    };
    el.addEventListener('pointerdown', e => { pid = e.pointerId; el.setPointerCapture(pid); setAt(e.clientX, false); });
    el.addEventListener('pointermove', e => { if (e.pointerId === pid) setAt(e.clientX, false); });
    const end = e => { if (e.pointerId !== pid) return; pid = null; setAt(e.clientX, true); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', e => { pid = null; });
  })();

  /* ---------- 재생 목록(AUDIO 탭) ---------- */
  let lastList = '';
  function renderList(force) {
    const L0 = G(() => H.list) || [], ci = G(() => H.cur);
    const key = L0.length + ':' + ci + ':' + (L0[0] && L0[0].title);
    if (!force && key === lastList) return; lastList = key;
    const ul = $('#tkList'); ul.innerHTML = '';
    $('#tkLeftS').textContent = tab === 'audio' ? L0.length + '곡' : '';
    if (!L0.length) {
      ul.innerHTML = '<li class="empty">재생 목록이 비어 있어요.<br><button class="tk-btn on" data-add>+ 음악 추가</button></li>';
      return;
    }
    L0.forEach((it, i) => {
      const li = document.createElement('li'); if (i === ci) li.className = 'cur'; li.dataset.i = i;
      li.innerHTML = '<span class="n"></span><span class="nm"></span><span class="n d"></span>';
      li.children[0].textContent = String(i + 1).padStart(2, '0');
      li.children[1].textContent = (it.artist ? it.artist + ' - ' : '') + (it.title || '');
      li.children[2].textContent = it.duration ? fmt(it.duration) : '';
      ul.appendChild(li);
    });
  }
  $('#tkList').addEventListener('click', e => {
    if (e.target.closest('[data-add]')) { const b = document.getElementById('addTop'); if (b) b.click(); return; }
    const li = e.target.closest('li[data-i]'); if (li && has('playIndex')) try { H.playIndex(+li.dataset.i); lastList = ''; } catch (x) {}
  });

  /* ---------- SYSTEM 탭 ---------- */
  function renderSys() {
    const T = tele(), gpsOnNow = !!G(() => H.gpsOn);
    $('#tkLeftS').textContent = '';
    $('#tkSys').innerHTML = `
      <div class="row"><span><b>GPS</b><small>${T.demo ? '웹 미리보기: 시연 값' : gpsOnNow ? (T.fix ? '수신 중 · 위성 ' + T.sats + (fin(T.acc) ? ' · ±' + Math.round(T.acc) + 'm' : '') : '위성을 찾는 중') : '꺼짐'}</small></span><button class="tk-btn ${gpsOnNow ? '' : 'on'}" data-sys="gps">${gpsOnNow ? 'GPS 끄기' : 'GPS 켜기'}</button></div>
      <div class="row"><span><b>기울기·나침반 센서</b><small>${T.att ? '자세계에 반영 중' : '센서 없음 또는 대기'}</small></span><button class="tk-btn" data-sys="level">수평 맞춤</button></div>
      <div class="row"><span><b>음악 불러오기</b><small>파일이나 폴더를 재생 목록에 추가해요.</small></span><button class="tk-btn" data-sys="add">+ 음악 추가</button></div>
      <div class="row"><span><b>설정</b><small>차량 연결·SOS 연락처·시계·창 순서</small></span><button class="tk-btn" data-sys="settings">설정 열기</button></div>
      <div class="row"><span><b>다른 스킨으로</b><small>기존 화면으로 돌아가요. 이 스킨을 지워도 다른 스킨은 그대로예요.</small></span><button class="tk-btn" data-sys="back">대신남 블루</button></div>`;
  }
  $('#tkSys').addEventListener('click', e => {
    const b = e.target.closest('[data-sys]'); if (!b) return; const a = b.dataset.sys;
    if (a === 'gps') { if (G(() => H.gpsOn)) { if (has('gpsStop')) H.gpsStop(true); store.set('gps', false); } else { if (has('gpsStart')) H.gpsStart(); store.set('gps', true); } setTimeout(renderSys, 200); }
    else if (a === 'level') { if (has('attLevel')) try { H.attLevel(); say('지금 자세를 수평으로 맞췄어요.'); } catch (x) {} else say('수평 맞춤을 쓸 수 없어요.'); }
    else if (a === 'add') { const x = document.getElementById('addTop'); if (x) x.click(); }
    else if (a === 'settings') { if (has('openSettings')) H.openSettings(); }
    else if (a === 'back') { if (has('setSkin')) H.setSkin('blue'); }
  });

  /* ---------- 왼쪽·오른쪽 키 ---------- */
  root.querySelector('.tk-main').addEventListener('click', e => {
    const b = e.target.closest('.tk-key'); if (!b) return; const k = b.dataset.k;
    if (useMap && (k === 'map' || k === 'zin' || k === 'zout' || k === 'dest')) {
      setTab('nav');
      if (k === 'map') { const f = document.getElementById('mapFollow'); if (f) f.click(); }
      else if (k === 'dest') { const t = document.querySelector('#wMap [data-tmap="open"]'); if (t && !t.closest('[hidden]')) t.click(); else openNavi(); }
      else if (!(has('mapZoom') && H.mapZoom(k === 'zin' ? 1 : -1))) say('이 지도는 두 손가락으로 벌리거나 오므려 확대·축소하세요.');
      return;
    }
    if (k === 'map') { setTab('nav'); follow = true; b.classList.add('on'); const p = pos(); if (map && p) map.setView([p.lat, p.lon], Math.max(map.getZoom(), 15)); }
    else if (k === 'zin' || k === 'zout') { setTab('nav'); if (map) k === 'zin' ? map.zoomIn() : map.zoomOut(); }
    else if (k === 'dest') openNavi();
    else if (k === 'audio') { if (has('toggle')) H.toggle(); setTimeout(() => { lastAu = ''; }, 150); }
    else if (k === 'source') {
      const m = G(() => H.mode), hasExt = !!(NBx && NBx.extStatus);
      if (!hasExt) { say('외부 앱 연동은 휴대폰 앱에서 쓸 수 있어요.'); return; }
      if (has('setMode')) H.setMode(m === 'ext' ? 'local' : 'ext'); lastAu = '';
    } else if (k === 'list') setTab(tab === 'audio' ? 'nav' : 'audio');
    else if (k === 'setup') setTab(tab === 'system' ? 'nav' : 'system');
  });
  function openNavi() {
    if (NBx && NBx.openApp) { try { NBx.openAppSide ? NBx.openAppSide('com.skt.tmap.ku') : NBx.openApp('com.skt.tmap.ku'); } catch (e) {} }
    else say('내비 앱(TMAP) 열기는 휴대폰 앱에서 쓸 수 있어요.');
  }
  $('#tkMenu').onclick = openNavi;
  $('#tkNorth').onclick = () => { follow = true; const p = pos(); if (map && p) map.setView([p.lat, p.lon]); };

  /* ---------- 손잡이(볼륨·밝기) ---------- */
  function knob(el, min, max, get, set) {
    const ring = el.querySelector('svg.ring');
    let ticks = '';
    for (let i = 0; i <= 30; i++) { const a = (-135 + i * 9) * Math.PI / 180, r1 = 46, r2 = i % 5 ? 42 : 39; ticks += `<line data-i="${i}" x1="${50 + Math.sin(a) * r1}" y1="${50 - Math.cos(a) * r1}" x2="${50 + Math.sin(a) * r2}" y2="${50 - Math.cos(a) * r2}" stroke-width="${i % 5 ? 1.6 : 2.6}" stroke-linecap="round"/>`; }
    ring.innerHTML = ticks;
    const lines = [...ring.querySelectorAll('line')];
    const draw = v => {
      const f = (v - min) / (max - min); el.style.setProperty('--a', (-135 + f * 270) + 'deg'); el.setAttribute('aria-valuenow', String(Math.round(v)));
      lines.forEach((l, i) => l.setAttribute('stroke', v == null ? '#3a4441' : i / 30 <= f + 1e-6 ? '#4be38a' : '#3a4441'));
    };
    let pid = null, last = 0;
    const fromPt = (x, y) => { const r = el.getBoundingClientRect(), a = Math.atan2(x - (r.left + r.width / 2), -(y - (r.top + r.height / 2))) * 180 / Math.PI; return clamp(a, -135, 135); };
    el.addEventListener('pointerdown', e => { pid = e.pointerId; el.setPointerCapture(pid); last = fromPt(e.clientX, e.clientY); e.preventDefault(); });
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== pid) return; const a = fromPt(e.clientX, e.clientY);
      if (Math.abs(a - last) > 120) return; // 아래쪽 빈 구간을 건너뛰지 않음
      last = a; const v = min + (a + 135) / 270 * (max - min); set(Math.round(v)); draw(get());
    });
    const end = e => { if (e.pointerId === pid) pid = null; };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', e => { const s = (max - min) / 20; if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { set(clamp(get() + s, min, max)); draw(get()); e.preventDefault(); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { set(clamp(get() - s, min, max)); draw(get()); e.preventDefault(); } });
    el.addEventListener('wheel', e => { e.preventDefault(); set(clamp(get() + (e.deltaY < 0 ? 2 : -2), min, max)); draw(get()); }, { passive: false });
    return draw;
  }
  // 볼륨: 앱에서는 기기 미디어 볼륨, 웹 미리보기는 플레이어 볼륨
  let vol = null, volT = 0, volBusy = 0;
  function readDev() { if (!native) return null; try { return JSON.parse(NBx.cockpitState()); } catch (e) { return null; } }
  const drawVol = knob($('#tkVol'), 0, 100, () => vol == null ? 0 : vol, v => {
    vol = clamp(v, 0, 100); volBusy = performance.now(); $('#tkVolV').textContent = String(vol);
    clearTimeout(volT);
    volT = setTimeout(() => {
      if (native && NBx.setSystemVolume) { try { NBx.setSystemVolume(vol); } catch (e) {} }
      else { const r = document.getElementById('vol'); if (r) { r.value = String(vol); r.dispatchEvent(new Event('input', { bubbles: true })); } }
    }, 60);
  });
  // 밝기: 앱에서는 이 창 화면 밝기, 웹에서는 화면 어둡게
  let bri = store.get('bri', 100);
  function applyBri(v, save = true) {
    bri = clamp(Math.round(v), 10, 100); $('#tkBriV').textContent = bri + '%';
    if (NBx && NBx.setScreenBrightness) { try { if (on) NBx.setScreenBrightness(bri); } catch (e) {} root.style.removeProperty('--tk-dim'); }
    else root.style.setProperty('--tk-dim', String(.45 + bri / 100 * .55));
    if (save) store.set('bri', bri);
  }
  const drawBri = knob($('#tkBri'), 10, 100, () => bri, v => applyBri(v));
  drawBri(bri); $('#tkBriV').textContent = bri + '%';

  /* ---------- 와이파이·블루투스 스위치 ---------- */
  let demoRadio = store.get('radio', { wifi: true, bt: true });
  function radio(name) {
    const btn = $(name === 'wifi' ? '#tkWifi' : '#tkBt');
    btn.addEventListener('click', () => {
      if (native) {
        const want = btn.getAttribute('aria-checked') !== 'true';
        try { name === 'wifi' ? NBx.setWifi(want) : NBx.setBluetooth(want); } catch (e) {}
        $(name === 'wifi' ? '#tkWifiN' : '#tkBtN').textContent = '설정에서 바꾸고 돌아오세요';
        if (has('sndPress')) try { H.sndPress(want); } catch (e) {}
      } else {
        demoRadio[name] = !demoRadio[name]; store.set('radio', demoRadio);
        if (has('sndPress')) try { H.sndPress(demoRadio[name]); } catch (e) {}
      }
      lastDev = 0;
    });
  }
  radio('wifi'); radio('bt');
  function radioView(name, v, sup) {
    const btn = $(name === 'wifi' ? '#tkWifi' : '#tkBt'), mod = btn.closest('.tk-mod'), ico = $(name === 'wifi' ? '#tkWifiI' : '#tkBtI');
    btn.setAttribute('aria-checked', String(v === true)); btn.dataset.unknown = String(v == null); btn.disabled = sup === false;
    mod.querySelector('[data-on]').className = v === true ? 'on' : ''; mod.querySelector('[data-off]').className = v === false ? 'on' : '';
    ico.classList.toggle('off', v !== true);
    const n = $(name === 'wifi' ? '#tkWifiN' : '#tkBtN');
    if (!native) n.textContent = 'DEMO'; else if (sup === false) n.textContent = '지원하지 않음'; else if (n.textContent !== '설정에서 바꾸고 돌아오세요' || v != null) n.textContent = '';
  }

  /* ---------- SOS(덮개를 올려야 누를 수 있음) ---------- */
  let coverT = 0;
  function sosNum() { const s = G(() => H.sos) || {}; return s.number || ''; }
  $('#tkCover').onclick = () => {
    $('#tkSosW').classList.add('open'); $('#tkSosN').textContent = sosNum() ? 'PRESS TO CALL' : '연락처 없음';
    if (has('sndPress')) try { H.sndPress(true); } catch (e) {}
    clearTimeout(coverT); coverT = setTimeout(closeCover, 5000);
  };
  function closeCover() { $('#tkSosW').classList.remove('open'); $('#tkSosN').textContent = 'LIFT TO OPEN'; }
  $('#tkSos').onclick = () => {
    if (!$('#tkSosW').classList.contains('open')) return;
    const n = sosNum();
    if (!n) { say('설정 → SOS 긴급 연락처에서 번호를 먼저 등록해 주세요.'); if (has('openSettings')) H.openSettings(); closeCover(); return; }
    if (has('sndAlarm')) try { H.sndAlarm(); } catch (e) {}
    if (native && NBx.sosCall) { try { NBx.sosCall(n); } catch (e) {} }
    else say('시연: ' + n + ' 번호로 전화를 겁니다.');
    closeCover();
  };

  /* ---------- 주행 모드 ---------- */
  $('#tkDm').onclick = () => { if (has('drive')) { const now = !!G(() => H.driveOn); H.drive(!now); if (now === false) 0; } };

  /* ---------- 상태 갱신 ---------- */
  let lastDev = 0, dev = null, car = null;
  function status(T, A) {
    const now = performance.now();
    if (now - lastDev > 1500) {
      lastDev = now; dev = readDev();
      if (NBx && NBx.carStatus) { try { car = JSON.parse(NBx.carStatus()); } catch (e) { car = null; } }
    }
    const wifi = native ? (dev ? dev.wifi : null) : demoRadio.wifi, bt = native ? (dev ? (dev.hasBt === false ? false : dev.bt) : null) : demoRadio.bt;
    radioView('wifi', typeof wifi === 'boolean' ? wifi : null, dev ? dev.wifiSupported !== false : true);
 radioView('bt', typeof bt === 'boolean' ? bt : null, dev ? dev.hasBt !== false : true);
    if (native && dev && typeof dev.volume === 'number' && now - volBusy > 1500) vol = Math.round(dev.volume);
    if (!native && vol == null) { const r = document.getElementById('vol'); vol = r ? +r.value : 80; }
    $('#tkVolV').textContent = vol == null ? '—' : String(vol); drawVol(vol);
    const btConn = !!(car && car.connected && car.connected.length);
    const set = (s, v, warn) => { const el = root.querySelector('.tk-stat [data-s="' + s + '"]'); el.classList.toggle('on', !!v); el.classList.toggle('warn', !v && !!warn); };
    set('gps', T.demo || T.fix, T.gps && !T.fix); set('audio', A.playing); set('bt', T.demo ? demoRadio.bt : (btConn || bt === true)); set('wifi', T.demo ? demoRadio.wifi : wifi === true);
    const L0 = G(() => H.list) || [];
    const chk = (c, v) => root.querySelector('.tk-check [data-c="' + c + '"]').classList.toggle('ok', !!v);
    chk('gps', T.demo || T.fix); chk('audio', L0.length > 0 || A.mode === 'ext'); chk('bt', T.demo ? demoRadio.bt : btConn);
    $('#tkCheckNote').textContent = T.demo ? 'DEMO VALUES' : btConn ? car.connected[0] : 'LIVE';
    const dv = !!G(() => H.driveOn); $('#tkDm').classList.toggle('easy', dv); $('#tkDmT').textContent = dv ? 'EASY' : 'NORMAL';
    const d = new Date(); $('#tkTime').firstChild.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    $('#tkTime small').textContent = (d.getMonth() + 1) + '.' + d.getDate();
  }
  function mapTick(T) {
    $('#tkC1v').textContent = (T.spd != null ? Math.round(T.spd) : '—') + ' km/h';
    $('#tkC1s').textContent = T.hdg != null ? Math.round(T.hdg) + '° ' + card(T.hdg) + (T.demo ? ' · 시연' : '') : T.demo ? '시연' : !T.gps ? 'GPS 꺼짐 · SETUP에서 켜기' : '위치를 찾는 중';
    $('#tkC1 .ar').style.transform = 'rotate(' + (T.hdg || 0) + 'deg)';
    const tr = G(() => H.trip) || { dist: 0, time: 0 };
    $('#tkTripT').textContent = Math.round((tr.time || 0) / 60) + ' min'; $('#tkTripD').textContent = ((tr.dist || 0) / 1000).toFixed(1) + ' km';
    $('#tkTripS').textContent = '주행 기록 · ' + (T.alt != null ? '고도 ' + Math.round(T.alt) + ' m' : '고도 —');
    if (!map || !me) return;
    if (T.demo) { const dt = .25; demo.lat += Math.cos(T.hdg * Math.PI / 180) * T.spd / 3.6 * dt / 111320; demo.lon += Math.sin(T.hdg * Math.PI / 180) * T.spd / 3.6 * dt / (111320 * Math.cos(demo.lat * Math.PI / 180)); }
    const p = pos(); if (!p) return;
    me.setLatLng([p.lat, p.lon]);
    const ic = me.getElement(); if (ic) { const s = ic.querySelector('svg'); if (s) s.style.transform = 'rotate(' + (T.hdg || 0) + 'deg)'; }
    const lastP = pts[pts.length - 1];
    if (!lastP || Math.abs(lastP[0] - p.lat) + Math.abs(lastP[1] - p.lon) > 2e-5) { pts.push([p.lat, p.lon]); if (pts.length > 600) pts.shift(); trail.setLatLngs(pts); }
    if (follow) map.panTo([p.lat, p.lon], { animate: true, duration: .25 });
  }

  /* ---------- 반복 ---------- */
  let raf = 0, slowAt = 0;
  function loop() {
    cancelAnimationFrame(raf);
    if (!on) return;
    raf = requestAnimationFrame(t => {
      if (!on) return;
      if (!document.hidden) {
        const T = tele();
        if (!usePfd) drawPfd(T);
        const A = renderAudio();
        if (t - slowAt > 250) { slowAt = t; status(T, A); if (tab === 'nav' && !useMap) mapTick(T); else if (tab === 'audio') renderList(); }
      }
      loop();
    });
  }
  window.AmpTablet = { get on() { return on; }, setTab, get tab() { return tab; }, tele, get map() { return map; } };
  activate(isOn());
})();
