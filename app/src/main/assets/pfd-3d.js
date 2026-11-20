/* 1.80 대신남 3D 맵 스킨 연결: :root[data-sk3d]일 때 PFD 풍경(하늘·땅)을 3D 엔진(pfd3d.js, 필요할 때만 불러옴) 그림으로 바꿈.
 *  계기(속도·고도 띠, 피치 사다리, 나침반)와 다른 기능은 에어라인 스킨과 그대로. 엔진을 못 쓰면(WebGL 없음 등) 원래 풍경 */
(function () {
  'use strict';
  const A = window.AmpPfd; if (!A || !A.panel) return;
  const P = A.panel, sc = P.scene, H = window.AmpHost, FL = window.AmpFlight;
  const on = () => document.documentElement.hasAttribute('data-sk3d');
  let eng = null, state = 'idle', credit = null;
  function load() {
    if (state !== 'idle') return; state = 'loading';
    const s = document.createElement('script'); s.src = 'pfd3d.js';
    s.onload = () => { try { eng = window.Amp3D.create(); state = 'ready'; } catch (e) { state = 'failed'; window.__3dErr = String(e && e.message || e); } try { P.draw(); } catch (e) {} };
    s.onerror = () => { state = 'failed'; };
    document.head.appendChild(s);
  }
  const ready = () => on() && state === 'ready' && eng;
  const oSky = sc.drawSky, oGround = sc.drawGround;
  sc.drawSky = function (c, w, h, night, q) { if (on()) { load(); if (ready()) return; } return oSky.apply(this, arguments); };
  sc.drawGround = function (c, w, h, night, speed, q) {
    if (!ready()) return oGround.apply(this, arguments);
    try {
      const F = FL && FL.geo ? FL.geo.F : {}, d = P.data || {}, dp = P.display || {}, cal = P.calibration || { pitch: 0, roll: 0 };
      const att = isFinite(d.pitchDeg) && isFinite(d.rollDeg), pitch = att ? dp.pitchDeg - cal.pitch : 0, roll = att ? dp.rollDeg - cal.roll : 0;
      const valid = P.effective && P.effective().valid, hd = valid && isFinite(dp.headingDeg) ? dp.headingDeg : null;
      const gs = H && H.gs, gps = gs && gs.fix && (d.source === 'gps' || d.source === 'external') ? gs : null;
      const prm = window.__3dLast = { w, h, dpr: window.devicePixelRatio || 1, hd, pitch, roll, alt: F.alt || 0, wz: F.wz || 0, phase: F.phase, rwS: F.rwS, rwLen: F.rwLen, night, quality: q,
        time: window.__spTime || Date.now(), gps, speed: valid ? d.speedKmh : 0 }, img = eng.render(prm);
      // 지금 좌표계는 수평선 가운데·기울어진 상태 → 피치·롤을 되돌려 화면에 똑바로 깔기(3D 카메라가 같은 피치·롤로 찍었음)
      c.save(); c.translate(0, -pitch * h / 58); c.rotate(roll * Math.PI / 180);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(img, -w / 2, -h * .53, w, h); c.restore();
      if (!credit && P.els && P.els.canvasWrap) { credit = document.createElement('div'); credit.className = 'p3d-credit'; credit.textContent = '© OpenStreetMap'; P.els.canvasWrap.appendChild(credit); }
    } catch (e) { window.__3dErr = String(e && e.message || e); state = 'failed'; return oGround.apply(this, arguments); }
  };
  // 3D는 정차 중에도 구름·물결이 움직이므로 계속 다시 그림(화면이 보일 때만)
  let raf = 0, last = 0; const loop = t => { raf = 0; const gap = (P.settings && P.settings.sceneQuality) === 'balanced' ? 31 : 0;   // 가볍게: 초당 30번, 고화질: 화면 주사율대로
    if (ready() && !window.__3dPause && !document.hidden && P.frame == null && t - last >= gap && P.els && P.els.canvasWrap && P.els.canvasWrap.offsetParent !== null) { last = t; const dp = P.display, d = P.data, sv = [dp.pitchDeg, dp.rollDeg, d.pitchDeg, d.rollDeg];   // 비행 연출이 그릴 때마다 자세 값에 기울기를 더하므로, 이 추가 그리기 뒤엔 되돌려 쌓이지 않게
      try { P.draw(); } catch (e) {} [dp.pitchDeg, dp.rollDeg, d.pitchDeg, d.rollDeg] = sv; } if (on()) raf = requestAnimationFrame(loop); };
  setInterval(() => { if (credit) credit.hidden = !ready(); if (on() && !raf) raf = requestAnimationFrame(loop); }, 500);
  window.Amp3DHook = { get state() { return state; }, get engine() { return eng; }, load };
})();
