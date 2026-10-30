/* 대신남 원 Ver1 — PFD 비행 장면: 활주로 대기 → 이륙 활주 → 이륙·상승 → 순항 → (착륙 버튼) 접근 → 플레어 → 접지 → 감속 → 도착
 *
 * pfd/pfd.js(패키지 원본)는 고치지 않습니다. 패키지의 장면 객체(scene.drawGround)와 패널(drawHorizon)을 덧씌워
 * 공항(활주로·유도로·표지·등화·PAPI·진입등·관제탑·터미널·격납고)을 원근에 맞춰 그리고,
 * 비행 단계에 따라 눈높이(고도)·기수 각도·뱅크를 바꿉니다. 실제 위치·고도와는 관계없는 시각 효과입니다.
 *
 *  - 앱을 켜면(관제탑 점검·이륙 허가 받는 동안) 활주로 위에 서 있음
 *  - 속도를 내면 활주로를 달리다가 40km/h 이상(활주 180m 이상) 또는 70km/h 이상에서 이륙
 *  - 순항 중 [착륙]을 누르면 멀리 활주로가 나타나고, 차 속도에 맞춰 3° 활공으로 내려가 접지
 *    (차가 멈추면 몇 초 안에 자동으로 마저 착륙), [복행]을 누르면 다시 상승
 */
(function () {
  'use strict';
  const A = window.AmpPfd, H = window.AmpHost;
  if (!A || !A.panel || !H) return;
  const P = A.panel, sc = P.scene;
  if (!sc || typeof P.drawHorizon !== 'function') return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const fin = v => typeof v === 'number' && Number.isFinite(v);
  const angleDelta = (a, b) => ((b - a + 540) % 360) - 180;
  const EYE = 4, CRUISE = 380, TAN_G = Math.tan(3 * Math.PI / 180), VR = 40, VR_HI = 70, RW_W = 45, TD = 300;

  const F = {
    phase: 'hold', alt: 0, pitch: 0, bank: 0, rwS: -120, rwLen: 3200, rwNum: 33, rolled: 0,
    rem: 0, D0: 0, K: 10, auto: false, autoRate: 0, vAuto: 0, slowT: 0, stopT: 0, tdAt: 0, liftAt: 0,
    hdgPrev: null, lastT: 0, sim: null, v: 0, wz: 0, off: 0
  };
  const rwNumFor = hdg => { if (!fin(hdg)) return 33; const n = Math.round(((hdg % 360) + 360) % 360 / 10) % 36; return n === 0 ? 36 : n; };
  const pad2 = n => String(n).padStart(2, '0');
  const recip = n => { const r = (n + 18) % 36; return r === 0 ? 36 : r; };
  const active = () => H.skin === 'carnival2';

  function newDeparture() { F.rwS = -120; F.rwLen = 3200; F.rolled = 0; F.rwNum = rwNumFor(P.display && P.display.headingDeg); }

  /* ---------- 단계 전환 ---------- */
  function land() {
    if (F.phase !== 'cruise' && F.phase !== 'climb') return false;
    F.rwNum = rwNumFor(P.display && P.display.headingDeg);
    F.rwLen = 3200;
    F.D0 = Math.max(F.alt, 60) / TAN_G;            // 3° 활공 시작 지점
    F.rem = F.D0 + 900;                              // 수평 비행 900m 뒤 활공 진입
    F.altStart = F.alt;
    F.K = F.sim ? (F.rem / 18) / (70 / 3.6) : (F.rem / 45) / (60 / 3.6); // 60km/h면 약 45초
    F.auto = false; F.slowT = 0;
    F.phase = 'approach';
    H.beep('roger');
    H.atcSay('대신남 원, 활주로 ' + pad2(F.rwNum) + ' 착륙을 허가합니다.');
    kick(); renderBadge(true); return true;
  }
  function goAround() {
    if (F.phase !== 'approach') return false;
    F.phase = 'climb'; F.auto = false; F.liftAt = performance.now() + F.off;
    H.atcSay('대신남 원, 복행합니다. 다시 상승하세요.');
    kick(); renderBadge(true); return true;
  }

  function update(now, vIn) {
    const dt = F.lastT ? clamp((now - F.lastT) / 1000, 0, 0.1) : 0;
    F.lastT = now;
    const v = fin(vIn) ? vIn : 0;
    let vEff = F.auto ? F.vAuto : v;
    F.v = vEff;
    const rw0 = F.rwS;
    switch (F.phase) {
      case 'hold':
      case 'landed':
        F.alt = 0;
        if (v > 3) { if (F.phase === 'landed') newDeparture(); F.phase = 'roll'; F.stopT = 0; }
        break;
      case 'roll': {
        const adv = vEff / 3.6 * (1.4 + vEff / 45) * dt;
        F.rwS -= adv; F.rolled += adv;
        if (F.rwS + F.rwLen < 900) F.rwLen += 1500;
        if ((vEff >= VR && F.rolled >= 180) || vEff >= VR_HI) {
          F.phase = 'climb'; F.liftAt = now; H.beep('takeoff');
        }
        if (vEff < 1) { F.stopT += dt; if (F.stopT > 2.5) F.phase = 'hold'; } else F.stopT = 0;
        break;
      }
      case 'climb': {
        const rate = vEff > 3 ? clamp(4 + vEff * 0.33, 7, 40) : 0;
        F.alt = Math.min(CRUISE, F.alt + rate * dt);
        F.rwS -= vEff / 3.6 * 4 * dt;
        if (F.alt >= CRUISE) F.phase = 'cruise';
        break;
      }
      case 'cruise':
        F.rwS -= vEff / 3.6 * 4 * dt;
        break;
      case 'approach': {
        if (!F.auto && v < 5) { F.slowT += dt; if (F.slowT > 3) { F.auto = true; F.autoRate = Math.max(F.rem / 8, 60); } }
        else if (v >= 5) { F.slowT = 0; if (F.auto) F.auto = false; }
        const step = F.auto ? F.autoRate * dt : vEff / 3.6 * F.K * dt;
        F.rem = Math.max(0, F.rem - step);
        F.rwS = F.rem - TD;
        let a = Math.min(F.altStart, F.rem * TAN_G);
        if (a < 14) a = 14 * Math.pow(a / 14, 1.55);     // 플레어: 바닥 가까이에서 내려가는 속도를 줄임
        F.alt = a;
        if (F.rem <= 0.5) {
          F.phase = 'rollout'; F.alt = 0; F.tdAt = now;
          if (F.auto) F.vAuto = 140;
          H.beep('roger');
          H.atcSay('대신남 원, 착륙을 확인했습니다. 목적지에 도착했습니다.');
        }
        break;
      }
      case 'rollout': {
        if (F.auto) { F.vAuto = Math.max(0, F.vAuto - 26 * dt); vEff = F.vAuto; F.v = vEff; }
        F.rwS -= vEff / 3.6 * 2.2 * dt;
        if (F.rwS + F.rwLen < 900) F.rwLen += 1200;
        if (vEff < 6) { F.stopT += dt; if (F.stopT > 1.2) { F.phase = 'landed'; F.auto = false; F.stopT = 0; } } else F.stopT = 0;
        break;
      }
    }
    { const moved = rw0 - F.rwS; if (moved > 0 && moved < 800) F.wz += moved; }
    // 기수 각도(시각 효과)
    let tp = 0;
    const sinceLift = (now - F.liftAt) / 1000;
    if (F.phase === 'climb') tp = sinceLift < 3 ? lerp(0, 11, clamp(sinceLift / 2.2, 0, 1)) : lerp(10, 3, clamp(F.alt / CRUISE, 0, 1));
    else if (F.phase === 'cruise') tp = 1.2;
    else if (F.phase === 'approach') tp = F.alt > 14 ? -2.4 : lerp(3.6, -2.4, F.alt / 14);
    else if (F.phase === 'rollout') { const s = (now - F.tdAt) / 1000; tp = s < .35 ? -1.6 : s < 1.6 ? lerp(2.2, 0, (s - .35) / 1.25) : 0; }
    else if (F.phase === 'roll' && vEff > VR - 6) tp = 1.2;
    F.pitch += (tp - F.pitch) * clamp(dt * 2.4, 0, 1);
    // 선회하면 날개가 기움(공중에서만)
    const hd = P.display && fin(P.display.headingDeg) && P.effective().valid ? P.display.headingDeg : null;
    let tb = 0;
    if (hd !== null && F.hdgPrev !== null && dt > 0 && ['climb', 'cruise', 'approach'].includes(F.phase)) tb = clamp(angleDelta(F.hdgPrev, hd) / dt * 2.2, -25, 25);
    F.hdgPrev = hd;
    F.bank += (tb - F.bank) * clamp(dt * 1.4, 0, 1);
    renderBadge();
  }

  /* ---------- 빛 번짐 그림 ---------- */
  const glowCache = {};
  function glow(rgb) {
    if (glowCache[rgb]) return glowCache[rgb];
    const t = document.createElement('canvas'); t.width = t.height = 64;
    const g = t.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.08, 'rgba(' + rgb + ',.95)'); gr.addColorStop(.25, 'rgba(' + rgb + ',.35)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (glowCache[rgb] = t);
  }
  const FIELD = ['#5f7d3c', '#6c8644', '#7f8f4b', '#53703a', '#8d9157', '#68824b', '#9a9a5e', '#4d6a36'];
  const C = { white: '255,240,210', amber: '255,184,80', green: '110,255,150', red: '255,64,52', blue: '80,140,255', strobe: '220,235,255' };

  /* ---------- 공항 그리기(지평선 기준 좌표, 아래가 +) ---------- */
  function drawAirport(c, w, h, night, quality) {
    const f = w * .79, Hc = EYE + F.alt, zn = Math.max(1.2, Hc * f / (h * 2.6)), zf = 16000, now = performance.now() / 1000;
    const py = Z => Hc * f / Z, px = (X, Z) => X * f / Z;
    const gA = clamp(1 - F.alt / 260, 0, 1);
    const rwE = F.rwS + F.rwLen;
    const showRw = rwE > zn && F.rwS < zf;
    if (gA < .01 && !showRw && night) return;
    c.save();
    c.beginPath(); c.rect(-w * 2, 0, w * 4, h * 3); c.clip();

    const quad = (x1, x2, z1, z2, style, alpha) => {
      z1 = Math.max(z1, zn); z2 = Math.min(z2, zf); if (z2 <= z1) return;
      const y1 = py(z1), y2 = py(z2); if (y1 - y2 < .25 && (x2 - x1) * f / z2 < .25) return;
      c.globalAlpha = alpha === undefined ? 1 : alpha; c.fillStyle = style;
      c.beginPath(); c.moveTo(px(x1, z1), y1); c.lineTo(px(x2, z1), y1); c.lineTo(px(x2, z2), y2); c.lineTo(px(x1, z2), y2); c.closePath(); c.fill();
    };
    // 1) 땅: 낮에는 논밭 조각보 + 길(세상 거리 F.wz에 붙어 흐름), 공항 구역은 잔디와 깎은 띠
    if (!night) {
      const hq = quality !== 'balanced', fA = clamp(.92 - F.alt / 1800, .62, .92), cell = 320, j0 = Math.floor((zn + F.wz) / cell), tones = FIELD, ni = hq ? 12 : 8;
      for (let j = j0; j < j0 + (hq ? 34 : 20); j++) {
        const z1 = j * cell - F.wz, z2 = z1 + cell; if (z1 > 11000) break;
        for (let i = -ni; i < ni; i++) {
          const hsh = Math.abs(Math.sin(i * 127.1 + j * 311.7) * 43758.5453) % 1;
          quad(i * cell + 4, (i + 1) * cell - 4, z1 + 4, z2 - 4, tones[Math.floor(hsh * tones.length)], fA);
        }
      }
      for (const rx of [-1310, 870, 2590]) quad(rx - 6, rx + 6, zn, 11000, '#8b8b84', fA * .9);
      for (let j = Math.floor((zn + F.wz) / 2240); j < Math.floor((zn + F.wz) / 2240) + 6; j++) { const z = j * 2240 - F.wz + 1100; quad(-3800, 3800, z - 5, z + 5, '#8b8b84', fA * .8); }
    }
    if (gA > .01) {
      let g = c.createLinearGradient(0, 0, 0, h * 2.6);
      if (night) {
        g.addColorStop(0, '#0c1720'); g.addColorStop(.04, '#071009'); g.addColorStop(1, '#020502');
        c.globalAlpha = gA; c.fillStyle = g; c.fillRect(-w * 2, 0, w * 4, h * 3);
      } else {
        g.addColorStop(0, '#93a487'); g.addColorStop(.035, '#73875a'); g.addColorStop(.25, '#5a773d'); g.addColorStop(1, '#3f5c29');
        if (rwE + 500 > zn) quad(-760, 820, F.rwS - 500, rwE + 500, g, Math.max(gA, .85));
        const n0 = Math.ceil((zn - F.rwS) / 70) - 1;
        for (let n = n0; n < n0 + 60; n++) { const z1 = F.rwS - 500 + n * 70; if (z1 > rwE + 500) break; if (n % 2) continue; quad(-760, 820, z1, z1 + 70, '#20330f', .12); }
      }
      c.globalAlpha = 1;
    }
    if (!night) { // 지평선 아지랑이
      c.globalAlpha = .55; const g = c.createLinearGradient(0, 0, 0, h * .07); g.addColorStop(0, '#c9d6de'); g.addColorStop(1, '#c9d6de00'); c.fillStyle = g; c.fillRect(-w * 2, 0, w * 4, h * .07); c.globalAlpha = 1;
    }
    if (!showRw) { c.restore(); return; }

    const ink = night ? '#c7cfd6' : '#f3f2ec', inkA = night ? .42 : .93;

    // 2) 계류장·유도로·연결 유도로
    const apron = night ? '#14181c' : '#8d9192', taxi = night ? '#101317' : '#5d6266';
    quad(200, 600, F.rwS + 560, F.rwS + 1060, apron, .95);
    quad(173.5, 196.5, F.rwS + 180, rwE - 180, taxi);
    for (const zc of [F.rwS + 420, F.rwS + 1000, F.rwS + 1700, F.rwS + 2400, rwE - 320]) quad(22.5, 185, zc - 11.5, zc + 11.5, taxi);
    if (!night) {
      quad(184.6, 185.4, F.rwS + 180, rwE - 180, '#e8c33a', .9);
      for (const zc of [F.rwS + 420, F.rwS + 1000, F.rwS + 1700, F.rwS + 2400, rwE - 320]) quad(30, 185, zc - .4, zc + .4, '#e8c33a', .9);
    }

    // 3) 활주로 바닥
    let g = c.createLinearGradient(0, 0, 0, h * 2);
    if (night) { g.addColorStop(0, '#1d2228'); g.addColorStop(1, '#0b0d10'); } else { g.addColorStop(0, '#9a9ea3'); g.addColorStop(.18, '#5c6066'); g.addColorStop(1, '#3a3e43'); }
    quad(-30, -RW_W / 2, F.rwS, rwE, night ? '#0e1013' : '#6d6c60');
    quad(RW_W / 2, 30, F.rwS, rwE, night ? '#0e1013' : '#6d6c60');
    quad(-RW_W / 2, RW_W / 2, F.rwS, rwE, g);
    // 바퀴 자국(접지 구역이 진함)
    if (!night) for (const x of [-6, 6]) { quad(x - 2.5, x + 2.5, F.rwS + 250, F.rwS + 1000, '#2b2d30', .35); quad(x - 2.5, x + 2.5, rwE - 1000, rwE - 250, '#2b2d30', .35); }

    // 4) 표지(흰색)
    quad(-RW_W / 2 + .5, -RW_W / 2 + 1.4, F.rwS, rwE, ink, inkA);
    quad(RW_W / 2 - 1.4, RW_W / 2 - .5, F.rwS, rwE, ink, inkA);
    const keys = z0 => { for (let i = 0; i < 8; i++) { const x = 2.4 + i * 2.5; quad(x, x + 1.6, z0, z0 + 30, ink, inkA); quad(-x - 1.6, -x, z0, z0 + 30, ink, inkA); } };
    keys(F.rwS + 6); keys(rwE - 36);
    quad(-RW_W / 2, RW_W / 2, F.rwS, F.rwS + 1, ink, inkA); quad(-RW_W / 2, RW_W / 2, rwE - 1, rwE, ink, inkA);
    for (let z = F.rwS + 80; z < rwE - 80; z += 50) quad(-.45, .45, z, z + 30, ink, inkA);
    const tdz = (z0, dir) => {
      const set = [[150, 3], [450, 2], [600, 2], [750, 1], [900, 1]];
      for (const [d, n] of set) { const za = dir > 0 ? z0 + d : z0 - d - 22.5; for (let k = 0; k < n; k++) { const x = 3 + k * 3; quad(x, x + 1.8, za, za + 22.5, ink, inkA); quad(-x - 1.8, -x, za, za + 22.5, ink, inkA); } }
      const za = dir > 0 ? z0 + 300 : z0 - 345; quad(9, 15, za, za + 45, ink, inkA); quad(-15, -9, za, za + 45, ink, inkA);
    };
    tdz(F.rwS, 1); tdz(rwE, -1);
    const gtext = (t, Zc, flip) => {
      if (Zc < zn * 1.4 || Zc > 5000) return;
      const sx = f / Zc, sy = Hc * f / (Zc * Zc); if (sy * 9 < 1.5) return;
      c.save(); c.globalAlpha = inkA; c.fillStyle = ink; c.translate(0, py(Zc)); c.scale(sx, sy); if (flip) c.rotate(Math.PI);
      c.font = '700 100px "Barlow Condensed","Rajdhani",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.scale(.075, .095); c.fillText(t, 0, 0); c.restore();
    };
    gtext(pad2(F.rwNum), F.rwS + 50, false);
    gtext(pad2(recip(F.rwNum)), rwE - 50, true);


    // 5) 건물(먼 것부터) — 지평선 위로 솟으므로 땅 클립 밖에서 그림
    c.restore(); c.save();
    const bld = [{ z: F.rwS + 1150, kind: 'tower' }, { z: F.rwS + 660, kind: 'terminal' }, { z: F.rwS + 520, kind: 'hangar' }, { z: F.rwS + 1450, kind: 'hangar2' }];
    bld.sort((a, b) => b.z - a.z);
    for (const b of bld) drawBuilding(c, b, f, Hc, zn, zf, night, now, py, px);

    // 6) 등화
    c.globalCompositeOperation = 'lighter';
    const L = (X, Z, col, sizeM, k) => {
      if (Z < zn || Z > zf) return;
      const s = clamp(sizeM * f / Z, night ? 1.6 : 1.1, 46), y = py(Z), x = px(X, Z);
      if (y < -2 || y > h * 2.6 || Math.abs(x) > w * 1.3) return;
      c.globalAlpha = clamp(k, 0, 1) * (Z > 6000 ? clamp(1 - (Z - 6000) / 10000, .25, 1) : 1);
      c.drawImage(glow(col), x - s / 2, y - s / 2, s, s);
    };
    const nk = night ? 1 : 0;
    if (nk) {
      for (let z = F.rwS; z <= rwE; z += 60) { const col = z > rwE - 600 ? C.amber : C.white; L(-24, z, col, 4.2, .95); L(24, z, col, 4.2, .95); }
      for (let z = F.rwS + 15; z < rwE; z += 30) { const left = rwE - z, col = left < 300 ? C.red : left < 900 ? ((Math.round(z / 30) % 2) ? C.red : C.white) : C.white; L(0, z, col, 2.2, .7); }
      for (let x = -21; x <= 21; x += 3) { L(x, F.rwS, C.green, 3.2, .95); L(x, rwE, C.red, 3.2, .85); }
      if (quality !== 'balanced') for (let z = F.rwS + 60; z < F.rwS + 900; z += 30) for (const x of [-9, -7.5, -6, 6, 7.5, 9]) L(x, z, C.white, 1.6, .45);
      for (let z = F.rwS + 180; z < rwE - 180; z += 60) { L(173, z, C.blue, 3, .8); L(197, z, C.blue, 3, .8); }
      for (let z = F.rwS + 180; z < rwE - 180; z += 30) L(185, z, C.green, 1.8, .55);
      for (let x = 210; x < 600; x += 45) L(x, F.rwS + 1062, C.amber, 6, .5);
    }
    // 진입등(접근 중): 900m 중심선 + 300m 가로등 + 빠르게 달려오는 섬광
    if (F.phase === 'approach' || F.phase === 'cruise' || F.phase === 'climb') {
      if (F.rwS > zn) {
        const k0 = night ? .9 : .55;
        for (let k = 1; k <= 30; k++) { const z = F.rwS - k * 30; for (let x = -2; x <= 2; x++) L(x * 1.1, z, C.white, 2.2, k0); }
        for (let x = -15; x <= 15; x += 1.5) L(x, F.rwS - 300, C.white, 2.2, k0);
        const ph = (now % .5) / .5, kk = 30 - Math.floor(ph * 30); L(0, F.rwS - kk * 30, C.strobe, 10, 1);
      }
    }
    // PAPI(활주로 왼쪽 4개): 3°에서 흰색 2·빨강 2
    { const zp = F.rwS + TD; if (zp > zn && zp < 9000) { const ang = Math.atan2(Hc, zp) * 180 / Math.PI, thr = [2.5, 2.83, 3.17, 3.5];
      for (let i = 0; i < 4; i++) L(-(32 + i * 9), zp, ang > thr[i] ? C.white : C.red, night ? 5 : 4, night ? 1 : .85); } }
    // 관제탑 회전 경광등
    if (nk) { const zt = F.rwS + 1150, on = (now % 2) < .18 || ((now + 1) % 2) < .18; if (on) L(259, zt, (now % 2) < 1 ? C.green : C.white, 9, 1); }
    // 활주 중 빛줄기(속도감)
    c.globalCompositeOperation = 'source-over';
    c.restore();
  }

  function drawBuilding(c, b, f, Hc, zn, zf, night, now, py, px) {
    const Z = b.z; if (Z < zn * 2 || Z > zf) return;
    const s = f / Z, gy = py(Z);
    const box = (x1, x2, h1, h2, fill) => { c.fillStyle = fill; c.fillRect(px(x1, Z), gy - h2 * s, (x2 - x1) * s, (h2 - h1) * s); };
    c.globalAlpha = 1;
    if (b.kind === 'tower') {
      box(255, 263, 0, 38, night ? '#0b0f14' : '#c9ccc8');
      box(253, 265, 36, 39, night ? '#11161b' : '#9ea3a3');
      box(249, 269, 39, 46, night ? '#0e2a22' : '#3f6f7a');
      if (night) { c.globalAlpha = .75; box(250, 268, 40.5, 44.5, '#58d6a0'); c.globalAlpha = 1; }
      else { box(250, 268, 40.5, 44.5, '#6fa7b4'); box(250, 268, 43.5, 44.5, '#d8e6ea'); }
      box(248, 270, 46, 48, night ? '#090c10' : '#7f8586');
      box(258.6, 259.4, 48, 56, night ? '#090c10' : '#6a6f70');
    } else if (b.kind === 'terminal') {
      box(300, 540, 0, 16, night ? '#0b0e12' : '#d6d8d4');
      box(300, 540, 14, 17, night ? '#07090c' : '#8e9394');
      if (night) { c.globalAlpha = .7; for (let r = 0; r < 2; r++) for (let x = 304; x < 536; x += 6) if (((x * 7 + r * 13) % 11) > 3) box(x, x + 3.6, 4 + r * 5, 7 + r * 5, '#f2c983'); c.globalAlpha = 1; }
      else { box(304, 536, 4, 12, '#5f8796'); for (let x = 304; x < 536; x += 12) box(x, x + .6, 4, 12, '#c9d0d2'); }
    } else {
      const x0 = b.kind === 'hangar' ? -340 : -300, x1 = b.kind === 'hangar' ? -170 : -200, hh = b.kind === 'hangar' ? 20 : 15;
      const X1 = px(x0, Z), X2 = px(x1, Z), top = gy - hh * s, mid = gy - hh * .7 * s;
      c.fillStyle = night ? '#0a0d10' : '#b9bdbc';
      c.beginPath(); c.moveTo(X1, gy); c.lineTo(X1, mid); c.quadraticCurveTo((X1 + X2) / 2, top - (top - mid) * .9, X2, mid); c.lineTo(X2, gy); c.closePath(); c.fill();
      c.fillStyle = night ? '#141a1f' : '#7c8384'; c.fillRect(X1 + (X2 - X1) * .12, gy - hh * .55 * s, (X2 - X1) * .76, hh * .55 * s);
      if (night) { c.globalAlpha = .55; c.fillStyle = '#f5d9a0'; c.fillRect(X1 + (X2 - X1) * .14, gy - hh * .53 * s, (X2 - X1) * .72, hh * .08 * s); c.globalAlpha = 1; }
    }
  }

  /* ---------- 패키지에 덧씌우기 ---------- */
  const oDrawGround = sc.drawGround;
  sc.drawGround = function (c, w, h, night, speed, quality) {
    if (!active()) return oDrawGround.call(this, c, w, h, night, speed, quality);
    oDrawGround.call(this, c, w, h, night, speed, quality);
    drawAirport(c, w, h, night, quality);
  };
  const oDrawHorizon = P.drawHorizon;
  P.drawHorizon = function (c, x, y, w, h, valid) {
    if (!active()) return oDrawHorizon.call(this, c, x, y, w, h, valid);
    update(performance.now() + F.off, this.sceneSpeed ? this.sceneSpeed() : 0);
    const d = this.data, dp = this.display, cal = this.calibration || { pitch: 0, roll: 0 };
    const has = fin(d.pitchDeg) && fin(d.rollDeg);
    const sp = has ? dp.pitchDeg - cal.pitch : 0, sr = has ? dp.rollDeg - cal.roll : 0;
    const shake = (F.phase === 'roll' || F.phase === 'rollout') ? (Math.random() - .5) * clamp(F.v / 90, 0, 1) * .5 : 0;
    const save = [d.pitchDeg, d.rollDeg, dp.pitchDeg, dp.rollDeg];
    d.pitchDeg = 0; d.rollDeg = 0;
    dp.pitchDeg = sp + F.pitch + shake + cal.pitch;
    dp.rollDeg = sr + F.bank + cal.roll;
    try { return oDrawHorizon.call(this, c, x, y, w, h, valid); }
    finally { d.pitchDeg = save[0]; d.rollDeg = save[1]; dp.pitchDeg = save[2]; dp.rollDeg = save[3]; }
  };

  /* ---------- 화면 위 안내·버튼 ---------- */
  const wrap = P.els && P.els.canvasWrap;
  let ui = null;
  if (wrap) {
    ui = document.createElement('div');
    ui.className = 'flt';
    ui.innerHTML = '<div class="flt-badge" data-ph="hold"><i></i><b></b><span></span></div>' +
      '<div class="flt-btns"><button type="button" class="flt-land" data-a="land">착륙</button><button type="button" class="flt-ga" data-a="ga">복행</button><button type="button" class="flt-sim" data-a="sim" title="속도를 흉내 내어 이륙부터 착륙까지 보여 줘요">시연</button></div>';
    wrap.appendChild(ui);
    ui.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      if (b.dataset.a === 'land') land(); else if (b.dataset.a === 'ga') goAround(); else sim(!F.sim);
    });
  }
  let badgeAt = 0, lastTxt = '';
  function renderBadge(force) {
    if (!ui) return;
    const now = performance.now(); if (!force && now - badgeAt < 220) return; badgeAt = now;
    const rw = 'RWY ' + pad2(F.rwNum), ph = F.phase;
    let b = '', s = '';
    if (ph === 'hold') { if (H.atcDone) { b = 'LINE UP · ' + rw; s = '이륙 허가 · 속도를 내면 이륙해요'; } else { b = 'HOLD · ' + rw; s = '관제탑 이륙 허가 대기 중'; } }
    else if (ph === 'roll') { b = F.v >= VR - 8 ? 'V1 · ROTATE' : 'TAKEOFF ROLL'; s = '이륙 활주 · ' + Math.round(F.v) + ' km/h'; }
    else if (ph === 'climb') { b = 'CLIMB'; s = '상승 중 · ' + Math.round(F.alt) + ' m'; }
    else if (ph === 'cruise') { b = 'CRUISE'; s = '순항 · 도착이 가까우면 착륙을 누르세요'; }
    else if (ph === 'approach') { b = (F.alt < 14 ? 'FLARE · ' : 'APPROACH · ') + rw; s = (F.auto ? '자동 착륙 · ' : '활주로까지 ') + (F.rem >= 1000 ? (F.rem / 1000).toFixed(1) + ' km' : Math.round(F.rem) + ' m') + ' · 고도 ' + Math.round(F.alt) + ' m'; }
    else if (ph === 'rollout') { b = 'TOUCHDOWN · ' + rw; s = '착륙 · 감속 중'; }
    else if (ph === 'landed') { b = 'ARRIVED · ' + rw; s = '목적지에 도착했어요'; }
    const txt = ph + '|' + b + '|' + s + '|' + !!F.sim;
    if (txt === lastTxt) return; lastTxt = txt;
    const bd = ui.firstChild; bd.dataset.ph = ph; bd.children[1].textContent = b; bd.children[2].textContent = s;
    ui.querySelector('.flt-land').hidden = !(ph === 'cruise' || ph === 'climb');
    ui.querySelector('.flt-ga').hidden = ph !== 'approach';
    const sb = ui.querySelector('.flt-sim'); sb.classList.toggle('on', !!F.sim); sb.textContent = F.sim ? '시연 끝' : '시연';
  }

  /* ---------- 정지 화면에서도 움직이는 것(자동 착륙·등화 깜빡임·기수 움직임) ---------- */
  let loopT = 0;
  function needAnim() {
    if (!active() || !P.canRender || !P.canRender()) return false;
    if (F.auto || F.sim) return true;
    if (Math.abs(F.pitch) > .05 && F.phase !== 'cruise') return true;
    if (F.phase === 'approach' || F.phase === 'rollout') return true;
    return !P.day && F.alt < 260;
  }
  function kick() { if (!loopT) loopT = requestAnimationFrame(loop); }
  let lastDraw = 0;
  function loop(t) {
    loopT = 0;
    if (needAnim()) {
      if (P.frame === null && t - lastDraw > 45) { lastDraw = t; try { P.draw(); } catch (e) {} }
      loopT = requestAnimationFrame(loop);
    } else renderBadge();
  }
  setInterval(() => { if (needAnim()) kick(); else if (active()) renderBadge(); }, 500);

  /* ---------- 시연: GPS 없이 이륙~착륙을 보여 줌 ---------- */
  function sim(on) {
    if (!on) { F.sim = null; try { P.updateTelemetry({ source: H.gpsOn ? 'gps' : 'none' }); } catch (e) {} renderBadge(true); return; }
    F.phase = 'hold'; F.alt = 0; F.pitch = 0; F.bank = 0; F.auto = false; newDeparture();
    F.sim = { t0: performance.now(), v: 0, hdg: fin(P.display && P.display.headingDeg) ? P.display.headingDeg : 330, landed: 0 };
    kick(); renderBadge(true);
  }
  function simStep() {
    const S = F.sim; if (!S) return;
    const t = (performance.now() - S.t0) / 1000;
    let v;
    if (t < 4) v = 0;
    else if (F.phase === 'hold' || F.phase === 'roll') v = Math.min(95, (t - 4) * 9);
    else if (F.phase === 'climb' || F.phase === 'cruise') { v = 95; if (F.phase === 'cruise' && !S.cruiseAt) S.cruiseAt = t; if (S.cruiseAt && t - S.cruiseAt > 6) land(); }
    else if (F.phase === 'approach') v = Math.max(70, 95 - (t - (S.appAt || (S.appAt = t))) * 3);
    else if (F.phase === 'rollout') { S.ro = S.ro || t; v = Math.max(0, 70 - (t - S.ro) * 12); }
    else { v = 0; S.landed = S.landed || t; if (t - S.landed > 4) { sim(false); return; } }
    if (H.speedTick) H.speedTick(v);
    S.v = v; S.hdg = (S.hdg + (F.phase === 'cruise' ? .08 : 0)) % 360;
    try { P.updateTelemetry({ source: 'demo', fixValid: true, speedKmh: v, headingDeg: S.hdg, altitudeM: 32 + F.alt, accuracyM: 3, timestampMs: Date.now() }); } catch (e) {}
  }
  const oFeed = A.feed;
  A.feed = function () { if (F.sim) { if (H.skin === 'carnival2') simStep(); return; } return oFeed.apply(this, arguments); };
  setInterval(() => { if (F.sim && document.hidden === false) simStep(); }, 100);

  window.AmpFlight = {
    get state() { return { phase: F.phase, alt: F.alt, pitch: F.pitch, bank: F.bank, rwS: F.rwS, rem: F.rem, auto: F.auto, rwNum: F.rwNum, sim: !!F.sim }; },
    step(sec, v) { const n = Math.max(1, Math.round(sec / .05)); let t = performance.now() + F.off; F.lastT = t; for (let i = 0; i < n; i++) { t += 50; update(t, v); } F.off += n * 50; renderBadge(true); return this.state; },
    land, goAround, sim, redraw() { try { P.draw(); } catch (e) {} }
  };
  renderBadge(true);
})();
