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
  const EYE = 4, CRUISE = 380, CLIMB_ALT = 240, CLIMB_PITCH = 6.5, CRUISE_PITCH = 1.4, BANK_MAX = 6.5, TAN_G = Math.tan(3 * Math.PI / 180), VR = 5, VR_HI = 70, RW_W = 45, TD = 300;

  /* ---------- 활주로 아스팔트 질감·타이어 자국, 구름 입체감(한 번 만들어 두고 재사용) ---------- */
  const srand = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // 아스팔트: 골재 알갱이·잔금·얼룩이 섞인 회색 결(바둑판 반복이 안 보이게 256px)
  const ASPH = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'), id = x.createImageData(256, 256), d = id.data;
    for (let i = 0; i < 256 * 256; i++) {
      const px = i & 255, py = i >> 8, n = srand(i * 1.37), m = srand(((px >> 3) + (py >> 3) * 97) * 3.1), blot = srand(((px >> 5) + (py >> 5) * 13) * 7.7);
      let v = 0; if (n > .985) v = 34; else if (n > .93) v = 16; else if (n < .05) v = -26; else v = (n - .5) * 10;
      v += (m - .5) * 9 + (blot - .5) * 12; const k = i * 4;
      d[k] = d[k + 1] = d[k + 2] = 128 + v * 1.4; d[k + 3] = n > .93 || n < .05 ? 105 : 58;
    }
    x.putImageData(id, 0, 0);
    x.strokeStyle = '#00000038'; x.lineWidth = .8; // 실금(크랙 실링)
    for (let k = 0; k < 7; k++) { x.beginPath(); let cx = srand(k + 50) * 256, cy = srand(k + 70) * 256; x.moveTo(cx, cy); for (let s2 = 0; s2 < 8; s2++) { cx += (srand(k * 9 + s2) - .5) * 40; cy += srand(k * 7 + s2 + 3) * 22; x.lineTo(cx, cy); } x.stroke(); }
    return cv;
  })();
  let asphPat = null, grassPat = null;
  const GRASS = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'), id = x.createImageData(256, 256), d = id.data;
    for (let i = 0; i < 256 * 256; i++) { const px = i & 255, py = i >> 8, n = srand(i * 2.13), m = srand(((px >> 4) + (py >> 4) * 31) * 5.3), b = srand(((px >> 6) + (py >> 6) * 7) * 9.1), k = i * 4;
      const v = (n - .5) * 40 + (m - .5) * 34 + (b - .5) * 26; d[k] = 70 + v * .6; d[k + 1] = 104 + v; d[k + 2] = 44 + v * .4; d[k + 3] = 46 + Math.abs(v) * .9; }
    x.putImageData(id, 0, 0); return cv; })();
  // 타이어 고무 자국: 접지 구역(양쪽 끝)에 진하고 가운데로 갈수록 옅어지는 가는 줄 여러 개
  const SKIDS = (() => {
    const a = [];
    for (let k = 0; k < 220; k++) {
      const end = k % 2, side = srand(k + 1) < .5 ? -1 : 1, x = side * (3.2 + srand(k + 2) * 6.5), w = .12 + srand(k + 3) * .38;
      const d0 = 120 + Math.pow(srand(k + 4), 1.6) * 1100, len = 18 + srand(k + 5) * 160, al = (.1 + srand(k + 6) * .26) * (1 - Math.min(1, (d0 - 120) / 1300) * .7);
      a.push({ end, x, w, d0, len, al });
    }
    return a;
  })();
  // 구름: 위는 햇빛에 밝고 아래·안쪽은 그늘진 입체감(원본 구름 그림에 명암만 덧입힘)
  function shadeClouds(sprites) {
    if (!sprites || sprites.__shaded) return; sprites.__shaded = true;
    for (const sp of sprites) {
      const cv = sp.day; if (!cv) continue; const x = cv.getContext('2d'), W = cv.width, Hh = cv.height; let id; try { id = x.getImageData(0, 0, W, Hh); } catch (e) { continue; }
      const d = id.data, acc = new Float32Array(W);
      for (let yy = 0; yy < Hh; yy++) for (let xx = 0; xx < W; xx++) {
        const k = (yy * W + xx) * 4, a = d[k + 3] / 255; acc[xx] = acc[xx] * .982 + a; if (a < .01) continue;
        const L = d[k] / 249, depth = Math.min(1, Math.max(0, (acc[xx] - 3) / 34)), rim = Math.max(0, 1 - acc[xx] / 5), base = Math.min(1, Math.max(0, (yy / Hh - .45) / .4));
        const sh = Math.min(1, Math.pow(depth, .8) * .8 + base * .4);
        let r = 255 - sh * 118, g = 254 - sh * 102, b = 252 - sh * 74;                    // 밝은 흰색 → 푸른 회색 그늘
        r += rim * 10; g += rim * 6; b -= rim * 10;                                          // 위쪽 가장자리 햇빛
        const f = .8 + L * .2; d[k] = Math.min(255, r * f); d[k + 1] = Math.min(255, g * f); d[k + 2] = Math.min(255, b * f);
        d[k + 3] = Math.min(255, d[k + 3] * (1.04 + depth * .08));
      }
      x.putImageData(id, 0, 0);
    }
  }
  try { shadeClouds(sc.sprites); } catch (e) {}

  // 스페셜판(pfd-special.js)이 먼 산·강·땅 질감을 바꿔 그릴 수 있게 열어 둔 자리(없으면 기존 그대로)
  const X = {};
  const F = {
    phase: 'hold', alt: 0, pitch: 0, bank: 0, rwS: -120, rwLen: 3200, rwNum: 33, rolled: 0,
    rem: 0, D0: 0, K: 10, auto: false, autoRate: 0, vAuto: 0, slowT: 0, stopT: 0, tdAt: 0, liftAt: 0,
    hdgPrev: null, lastT: 0, sim: null, v: 0, wz: 0, off: 0, rollT: 0, snow: 0, snowInit: false, vs: 0, stillT: 0
  };
  const rwNumFor = hdg => { if (!fin(hdg)) return 33; const n = Math.round(((hdg % 360) + 360) % 360 / 10) % 36; return n === 0 ? 36 : n; };
  const pad2 = n => String(n).padStart(2, '0');
  const recip = n => { const r = (n + 18) % 36; return r === 0 ? 36 : r; };
  const wxKind = () => { const W = window.AmpWx; const k = W ? W.kind : 'clear'; return k || 'clear'; };
  const active = () => ['carnival2', 'carnival3', 'carnival4', 'carnival5', 'carnival6', 'carnival7', 'tablet'].includes(H.skin) && (H.skin === 'tablet' || !H.gStyle || H.gStyle === 'cockpit'); // 콕핏 스킨에서 기존 속도계를 고르면 비행 화면은 쉼

  /* 효과음: 앱의 AmpHost.sfx(없으면 예전 beep) — 활주 소리는 속도에 맞춰 0.2초마다만 갱신 */
  let sfxT = 0;
  function sfx(k, v, fallback) { if (H.sfx) H.sfx(k, v); else if (fallback) fallback(); }
  function sfxRoll(v) { const t = performance.now(); if (t - sfxT < 200) return; sfxT = t; sfx('roll', v); }
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
    H.beep('roger'); sfx('approach');
    H.atcSay('대신남 원, 활주로 ' + pad2(F.rwNum) + ' 착륙을 허가합니다.');
    kick(); renderBadge(true); return true;
  }
  function goAround() {
    if (F.phase !== 'approach') return false;
    F.phase = 'climb'; F.auto = false; F.liftAt = performance.now() + F.off; sfx('goAround');
    H.atcSay('대신남 원, 복행합니다. 다시 상승하세요.');
    kick(); renderBadge(true); return true;
  }

  function update(now, vIn) {
    const dt = F.lastT ? clamp((now - F.lastT) / 1000, 0, 0.1) : 0;
    F.lastT = now;
    const v = fin(vIn) ? vIn : 0;
    let vEff = F.auto ? F.vAuto : v;
    F.v = vEff;
    F.vs += (vEff - F.vs) * clamp(dt * (vEff < F.vs ? .8 : 1.6), 0, 1); // 지면이 흐르는 빠르기: 멈출 때는 1~2초에 걸쳐 부드럽게 감속
    const rw0 = F.rwS;
    switch (F.phase) {
      case 'hold':
      case 'landed':
        F.alt = 0;
        if (v > 3) { if (F.phase === 'landed') newDeparture(); F.phase = 'roll'; F.stopT = 0; F.rollT = 0; F.rolled = 0; sfx('rollStart'); }
        break;
      case 'roll': {
        // 5km/h만 넘으면 이륙: 활주는 실제 비행기처럼 몇 초 만에 빨라지는 모습으로 보여 줌
        F.rollT += vEff >= 3 ? dt : 0;
        const vis = vEff >= 3 ? Math.max(vEff, Math.min(150, 30 + F.rollT * 26)) : vEff;
        const adv = vis / 3.6 * 1.6 * dt;
        F.rwS -= adv; F.rolled += adv; F.v = vis; sfxRoll(vis);
        if (F.rwS + F.rwLen < 900) F.rwLen += 1500;
        if ((vEff >= VR && F.rolled >= 150) || vEff >= VR_HI) {
          F.phase = 'climb'; F.liftAt = now; sfx('liftoff', null, () => { H.beep('takeoff'); H.beep('tireUp'); });
        }
        if (vEff < 1) { F.stopT += dt; if (F.stopT > 2.5) { F.phase = 'hold'; sfx('rollStop'); } } else F.stopT = 0;
        break;
      }
      case 'climb': {
        // 이륙 후 10초 연출: 0~2초 기수 들기 → 2~6초 활주로가 빠르게 작아져 화면 아래로 빠짐(가까운 들판·길은 빠르게) → 6~10초 수평 회복, 지평선 안정 → CRUISE
        const s = (now - F.liftAt) / 1000;
        F.alt = Math.max(F.alt, CLIMB_ALT * (1 - Math.pow(1 - clamp(s / 9, 0, 1), 2)));
        const boost = s < 1.4 ? 0 : s < 3 ? (s - 1.4) / 1.6 : s < 5.6 ? 1 : s < 7.2 ? 1 - (s - 5.6) / 1.6 : 0;
        F.rwS -= (F.vs / 3.6 * 4 + boost * 950) * dt;
        if (s >= 12 || (s >= 7.6 && F.rwS + F.rwLen < 0 && Math.abs(F.pitch - CRUISE_PITCH) < .9)) { F.phase = 'cruise'; F.stillT = 0; }
        break;
      }
      case 'cruise':
        F.alt += (CRUISE - F.alt) * clamp(dt * .05, 0, 1);       // 순항 중 아주 천천히 남은 높이까지
        F.rwS -= F.vs / 3.6 * 4 * dt;                              // 차가 멈추면 지면 흐름도 서서히 멈춤
        if (vEff < 2) F.stillT += dt; else F.stillT = 0;
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
          F.phase = 'rollout'; F.alt = 0; F.tdAt = now; sfx('touchdown', null, () => H.beep('tireDown'));
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
        if ((now - F.tdAt) > 900 && vEff > 6) { sfx('rollStart'); sfxRoll(vEff); }                 // 접지 뒤 감속 활주: 바퀴 진동이 속도와 함께 잦아듦
        if (vEff < 6) { F.stopT += dt; if (F.stopT > 1.2) { F.phase = 'landed'; F.auto = false; F.stopT = 0; sfx('rollStop'); } } else F.stopT = 0;
        break;
      }
    }
    { const moved = rw0 - F.rwS; if (moved > 0 && moved < 800) F.wz += moved; }
    { const k = wxKind(); if (k === 'snow') { if (!F.snowInit) { F.snowInit = true; F.snow = Math.max(F.snow, .25); } F.snow = Math.min(.4, F.snow + dt * .02); } else { F.snowInit = false; F.snow = Math.max(0, F.snow - dt * .01); } }
    // 기수 각도(시각 효과)
    let tp = 0;
    const sinceLift = (now - F.liftAt) / 1000;
    if (F.phase === 'climb') { const s = sinceLift, e = t => 1 - Math.pow(1 - clamp(t, 0, 1), 2);
      tp = s < 1.8 ? lerp(0, CLIMB_PITCH, e(s / 1.5)) : s < 6 ? CLIMB_PITCH - (s - 1.8) * .12 : lerp(CLIMB_PITCH - .5, CRUISE_PITCH, e((s - 6) / 3.2)); }
    else if (F.phase === 'cruise') tp = CRUISE_PITCH;
    else if (F.phase === 'approach') tp = F.alt > 14 ? -2.4 : lerp(3.6, -2.4, F.alt / 14);
    else if (F.phase === 'rollout') { const s = (now - F.tdAt) / 1000; tp = s < .35 ? -1.6 : s < 1.6 ? lerp(2.2, 0, (s - .35) / 1.25) : 0; }
    else if (F.phase === 'roll' && vEff > VR - 6) tp = 1.2;
    F.pitch += (tp - F.pitch) * clamp(dt * 2.4, 0, 1);
    // 선회하면 날개가 기움(공중에서만)
    const hd = P.display && fin(P.display.headingDeg) && P.effective().valid ? P.display.headingDeg : null;
    let tb = 0;
    if (hd !== null && F.hdgPrev !== null && dt > 0) { const inst = clamp(angleDelta(F.hdgPrev, hd) / dt, -40, 40); F.hRate = (F.hRate || 0) + (inst - (F.hRate || 0)) * clamp(dt / 1.1, 0, 1); } // 선회 속도도 1초쯤 걸러서 GPS 방향 튐에 흔들리지 않게
    if (hd !== null && ['climb', 'cruise', 'approach'].includes(F.phase) && Math.abs(F.hRate || 0) > 1.5) tb = clamp((F.hRate - Math.sign(F.hRate) * 1.5) * 1.6, -BANK_MAX, BANK_MAX);
    F.hdgPrev = hd;
    F.bank += (tb - F.bank) * clamp(dt * .9, 0, 1);               // 배경과 피치 눈금이 함께 최대 6.5°까지 부드럽게 기울어 숫자는 읽기 편하게
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

  /* ---------- 순항 풍경: 굽은 강 하나 + 작은 마을 하나(공항을 벗어나면 나타남). 들판보다 천천히 흘러 깊이감 ---------- */
  const RK = .55;                                                   // 강·마을이 흐르는 빠르기(들판 대비)
  const riverX = Zw => -120 + 900 * Math.sin(Zw / 2100) + 380 * Math.sin(Zw / 700 + 1.3);
  const VIL_P = 3600, HOUSES = Array.from({ length: 30 }, (_, i) => ({ dx: (srand(i + 300) - .5) * 520, dz: (srand(i + 340) - .5) * 460, w: 18 + srand(i + 380) * 16, d: 14 + srand(i + 420) * 12, hh: 9 + srand(i + 460) * 7, r: Math.floor(srand(i + 500) * 4) }));
  const ROOF = [['#a4503f', '#7d3a2e'], ['#5f7486', '#455766'], ['#8f6343', '#6d4a31'], ['#b9b2a2', '#8f897b']];
  function drawCountry(c, w, h, night, quality, f, Hc, zn, py, px, quad) {
    const k = clamp((F.alt - 40) / 110, 0, 1); if (k < .01) return;
    const wr = F.wz * RK, zEnd = 9000;
    // 강: 모래 둑 → 물(먼 곳은 하늘빛을 받아 밝게) → 가운데 반짝임
    const strip = (half, fill, a) => {
      const L = [], R = []; for (let z = Math.max(zn, 2); z < zEnd; z = z * 1.07 + 6) { const X = riverX(z + wr), y = py(z); L.push([px(X - half, z), y]); R.push([px(X + half, z), y]); }
      if (L.length < 2) return; c.globalAlpha = a; c.fillStyle = fill; c.beginPath(); c.moveTo(L[0][0], L[0][1]);
      for (const p of L) c.lineTo(p[0], p[1]); for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); c.fill();
    };
    if (X.river && X.river(c, w, h, night, quality, { f, Hc, zn, py, px, wr, zEnd, k, riverX })) { /* 스페셜판이 그림 */ }
    else if (!night) {
      strip(110, '#b7ad86', .55 * k);
      const g = c.createLinearGradient(0, 0, 0, h * .9); g.addColorStop(0, '#b9d0dc'); g.addColorStop(.12, '#7fa6bd'); g.addColorStop(1, '#3f6f8f'); strip(78, g, .95 * k);
      strip(3.5, '#e4f0f6', .22 * k);
    } else {
      // 1.59 야간 강: 주간처럼 굽은 강줄기가 또렷이 보이게(달빛 받은 짙은 파랑) + 강가를 따라 주황 가로등과 물에 비친 불빛
      strip(104, '#1b2431', .8 * k);
      const g = c.createLinearGradient(0, 0, 0, h * .9); g.addColorStop(0, '#46698d'); g.addColorStop(.14, '#24476a'); g.addColorStop(1, '#0f2a45'); strip(78, g, .95 * k);
      strip(3.5, '#a9cdf2', .3 * k);
      const LS = 120, l0 = Math.floor((zn + wr) / LS), tw = performance.now() / 1000, lamp = glow(C.amber);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let j = l0; j < l0 + 80; j++) {
        const Zw = j * LS, z = Zw - wr; if (z < zn * 1.15) continue; if (z > 7500) break;
        for (const side of [-1, 1]) {
          const hsh = srand(j * 2.3 + side * 7); if (hsh > .9) continue;                 // 군데군데 빈 곳
          const X = riverX(Zw) + side * 90, x = px(X, z), y = py(z); if (x < -w * .9 || x > w * .9) continue;
          const s = clamp(46 * f / z, 2.2, 26), fade = k * clamp(1.25 - z / 7500, .3, 1) * (.82 + .18 * Math.sin(tw * 1.7 + j + side));
          c.globalAlpha = fade; c.drawImage(lamp, x - s / 2, y - s * .8, s, s);
          // 물 위에 길게 비친 불빛(강 가운데 쪽으로)
          const xr = px(X - side * 34, z), rw = Math.max(1.2, s * .28), rh = Math.max(2, s * 1.5);
          c.globalAlpha = fade * .45; c.drawImage(lamp, xr - rw / 2, y - rh * .15, rw, rh);
        }
      }
      c.restore(); c.globalAlpha = 1;
    }
    // 1.39 나무: 강둑을 따라 늘어선 숲 + 들판 경계의 나무 무리(가까운 것은 크고 빠르게, 먼 것은 작고 천천히 — 지면 레이어와 함께 흐름)
    if (!night && quality !== 'balanced') {
      const trees = [];
      const RS = 110, r0 = Math.floor((zn + wr) / RS);                      // 강둑 숲(강과 같은 빠르기)
      for (let j = r0; j < r0 + 70; j++) { const Zw = j * RS, z = Zw - wr; if (z < zn * 1.3) continue; if (z > 6500) break;
        for (const side of [-1, 1]) { const h = srand(j * 3.1 + side), X = riverX(Zw) + side * (96 + h * 70); if (h > .82) continue; trees.push([X, z, 9 + h * 9]); } }
      const FC = 320, f0 = Math.floor((zn + F.wz) / FC);                     // 들판 경계 나무 무리(들판과 같은 빠르기)
      for (let j = f0; j < f0 + 16; j++) { const z0 = j * FC - F.wz; if (z0 > 5200) break;
        for (let i = -8; i < 8; i++) { const h = srand(i * 17.3 + j * 5.7); if (h > .32) continue;
          const n = 2 + Math.floor(h * 12); for (let q = 0; q < n; q++) { const X = i * FC + (srand(q + i * 3 + j) - .5) * 90, z = z0 + (srand(q * 7 + j + i) - .5) * 60; if (z > zn * 1.3) trees.push([X, z, 7 + srand(q + j) * 7]); } } }
      trees.sort((a, b) => b[1] - a[1]);
      for (const [X, z, r] of trees) {
        const sR = r * f / z; if (sR < .6) continue; const x = px(X, z), y = py(z); if (x < -w * .8 || x > w * .8) continue;
        const sh = Math.max(.5, sR * Hc / z * 1.2);                                  // 위에서 내려다볼수록 둥글게
        c.globalAlpha = k * clamp(1.2 - z / 7000, .35, 1);
        c.fillStyle = '#1f3418'; c.beginPath(); c.ellipse(x, y - sh * .4, sR, Math.max(sh, sR * .55), 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#3c5e2a'; c.beginPath(); c.ellipse(x - sR * .25, y - sh * .65, sR * .6, Math.max(sh, sR * .55) * .55, 0, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    }
    // 마을: 강가에 지붕 스무 채 남짓 + 작은 종탑, 먼 것부터
    const j0 = Math.floor((zn + wr - 1600) / VIL_P);
    for (let j = j0 + 2; j >= j0; j--) {
      const Zw = j * VIL_P + 1600, zc = Zw - wr; if (zc < zn * 1.5 || zc > 6500) continue;
      const side = (j & 1) ? 1 : -1, xc = riverX(Zw) + side * 380;
      const list = HOUSES.map(o => ({ ...o, z: zc + o.dz, x: xc + o.dx * (1 + srand(j) * .3) })).filter(o => o.z > zn * 1.2).sort((a, b) => b.z - a.z);
      if (!night) { { const r0 = riverX(Zw); quad(Math.min(r0, xc), Math.max(r0, xc), zc - 3, zc + 3, '#d8d2bf', .8 * k); } quad(xc - 3, xc + 3, zc - 160, zc + 160, '#d8d2bf', .7 * k); }
      for (const o of list) {
        const s = f / o.z, gy = py(o.z), X0 = px(o.x - o.w / 2, o.z), Wd = o.w * s, Hh = o.hh * s; if (Wd < .6) continue;
        if (night) { c.globalAlpha = .85 * k; c.fillStyle = '#ffc874'; c.fillRect(X0 + Wd * .35, gy - Hh * .7, Math.max(1, Wd * .25), Math.max(1, Hh * .3)); continue; }
        const [r1, r2] = ROOF[o.r];
        c.globalAlpha = k; c.fillStyle = '#00000030'; c.fillRect(X0 + Wd * .15, gy - 1, Wd, Math.max(1, Hh * .25));      // 그림자
        c.fillStyle = '#e9e2d2'; c.fillRect(X0, gy - Hh, Wd, Hh);                                                            // 벽
        quad(o.x - o.w / 2 - .6, o.x, o.z - o.d, o.z, r1, k); quad(o.x, o.x + o.w / 2 + .6, o.z - o.d, o.z, r2, k);           // 지붕(위에서 내려다본 두 쪽)
        c.fillStyle = r2; c.beginPath(); c.moveTo(X0 - .6 * s, gy - Hh); c.lineTo(X0 + Wd / 2, gy - Hh - o.w * .35 * s); c.lineTo(X0 + Wd + .6 * s, gy - Hh); c.closePath(); c.fill();
      }
      if (!night) { const zt = zc + 20, s = f / zt, gy = py(zt), X = px(xc + 10, zt); if (zt > zn * 1.2 && s > .02) { c.globalAlpha = k; c.fillStyle = '#efe9da'; c.fillRect(X - 6 * s, gy - 40 * s, 12 * s, 40 * s); c.fillStyle = '#6a3a2c'; c.beginPath(); c.moveTo(X - 8 * s, gy - 40 * s); c.lineTo(X, gy - 58 * s); c.lineTo(X + 8 * s, gy - 40 * s); c.closePath(); c.fill(); } }
    }
    c.globalAlpha = 1;
  }

  /* ---------- 공항 그리기(지평선 기준 좌표, 아래가 +) ---------- */
  function drawAirport(c, w, h, night, quality) {
    const f = w * .79, Hc = EYE + F.alt, zn = Math.max(1.2, Hc * f / (h * 2.6)), zf = 16000, now = performance.now() / 1000;
    const py = Z => Hc * f / Z, px = (X, Z) => X * f / Z;
    const gA = clamp(1 - F.alt / 260, 0, 1);
    const rwE = F.rwS + F.rwLen;
    const showRw = rwE > zn && F.rwS < zf;
    if (gA < .01 && !showRw && night) return;
    if (!(X.horizon && X.horizon(c, w, h, night, quality, f))) drawHorizon(c, w, h, night, quality, f);
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
    drawCountry(c, w, h, night, quality, f, Hc, zn, py, px, quad);
    if (X.afterCountry) X.afterCountry(c, w, h, night, quality, { f, Hc, zn, py, px, quad, k: clamp((F.alt - 40) / 110, 0, 1) });
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
        // 잔디 결: 짙고 옅은 풀 얼룩이 원근에 맞춰 작아짐
        if (quality !== 'balanced') { if (!grassPat) try { grassPat = c.createPattern(GRASS, 'repeat'); } catch (e) {}
          if (grassPat && grassPat.setTransform && window.DOMMatrix) { let z = Math.max(zn, F.rwS - 500); const z1e = Math.min(rwE + 500, 3000);
            while (z < z1e) { const z2 = Math.min(z1e, z * 1.2 + 2), zm = (z + z2) / 2, k = f / zm * .16;
              grassPat.setTransform(new DOMMatrix([k, 0, 0, k * Hc / zm * 1.4, 0, py(zm) - ((zm + F.wz) * 6 % 256) * k * Hc / zm * 1.4]));
              quad(-760, -26, z, z2, grassPat, .8); quad(26, 820, z, z2, grassPat, .8); z = z2; } } }
      }
      c.globalAlpha = 1;
    }
    if (!night) { // 지평선 아지랑이
      c.globalAlpha = .55; const g = c.createLinearGradient(0, 0, 0, h * .07); g.addColorStop(0, '#c9d6de'); g.addColorStop(1, '#c9d6de00'); c.fillStyle = g; c.fillRect(-w * 2, 0, w * 4, h * .07); c.globalAlpha = 1;
    }
    if (F.snow > .01) { // 쌓인 눈: 땅 전체가 하얗게
      c.globalAlpha = F.snow * (night ? .55 : .85); c.fillStyle = night ? '#6a7686' : '#eef2f6'; c.fillRect(-w * 2, 0, w * 4, h * 3); c.globalAlpha = 1;
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
    // 아스팔트 결: 가까운 곳은 크게, 먼 곳은 작게 보이도록 띠마다 무늬 크기를 바꿔 깔고, 달리면 함께 흘러감
    if (!night || quality !== 'balanced') {
      if (!asphPat) try { asphPat = c.createPattern(ASPH, 'repeat'); } catch (e) {}
      if (asphPat && asphPat.setTransform && window.DOMMatrix) {
        const z0 = Math.max(F.rwS, zn), z1 = Math.min(rwE, 2600); let z = z0;
        while (z < z1) { const z2 = Math.min(z1, z * 1.18 + 2), zm = (z + z2) / 2, sc2 = f / zm * .09;
          asphPat.setTransform(new DOMMatrix([sc2, 0, 0, sc2 * Hc / zm * 1.6, 0, py(zm) - ((zm - F.rwS) * 11 % 256) * sc2 * Hc / zm * 1.6]));
          quad(-RW_W / 2, RW_W / 2, z, z2, asphPat, night ? .35 : .9); z = z2; }
      }
      // 이음 줄(포장 패널 경계)
      for (let z = F.rwS + 25; z < Math.min(rwE, 1800); z += 25) quad(-RW_W / 2, RW_W / 2, z, z + .12, night ? '#000' : '#2c2f33', night ? .25 : .3);
    }
    // 타이어 고무 자국: 접지 구역은 진한 줄이 겹겹이, 멀어질수록 옅게
    if (!night) for (const t of SKIDS) {
      const za = t.end ? rwE - t.d0 - t.len : F.rwS + t.d0; quad(t.x - t.w / 2, t.x + t.w / 2, za, za + t.len, '#17181a', t.al);
    } else for (const x of [-6, 6]) { quad(x - 2.5, x + 2.5, F.rwS + 250, F.rwS + 1000, '#000', .3); quad(x - 2.5, x + 2.5, rwE - 1000, rwE - 250, '#000', .3); }
    if (!night) { quad(-1.4, 1.4, F.rwS + 60, rwE - 60, '#1c1e21', .12); } // 가운데 기름 얼룩 띠
    // 노면 광택: 먼 쪽은 하늘빛이 비쳐 밝고 가까울수록 짙어짐(젖은 듯한 반사), 가장자리는 살짝 어둡게
    if (quality !== 'balanced') {
      const zs = Math.max(F.rwS, zn), ze = Math.min(rwE, 4000);
      if (ze > zs) { const sh = c.createLinearGradient(0, py(ze), 0, Math.min(py(zs), h * .62)); sh.addColorStop(0, night ? '#9fb4ff30' : '#eef4fa50'); sh.addColorStop(.18, night ? '#9fb4ff10' : '#eef4fa14'); sh.addColorStop(.45, '#00000000'); sh.addColorStop(1, night ? '#00000030' : '#0000004a');
        quad(-RW_W / 2, RW_W / 2, zs, ze, sh, 1); }
      quad(-RW_W / 2, -RW_W / 2 + 4, F.rwS, rwE, '#000', .14); quad(RW_W / 2 - 4, RW_W / 2, F.rwS, rwE, '#000', .14);
    }

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


    if (F.snow > .01) { // 활주로·유도로에 쌓인 눈, 바퀴 자국만 드러남
      const sn = night ? '#7c8899' : '#f4f7fa';
      quad(-RW_W / 2 - 8, RW_W / 2 + 8, F.rwS, rwE, sn, Math.min(.92, F.snow * 1.05));
      quad(173.5, 196.5, F.rwS + 180, rwE - 180, sn, F.snow * .8);
      for (const x of [-7, 7]) quad(x - 2.2, x + 2.2, F.rwS, rwE, night ? '#2a2f36' : '#6b7077', F.snow * .55);
    }
    // 5) 건물(먼 것부터) — 지평선 위로 솟으므로 땅 클립 밖에서 그림
    c.restore(); c.save();
    const bld = [{ z: F.rwS + 1150, kind: 'tower' }, { z: F.rwS + 660, kind: 'terminal' }, { z: F.rwS + 1900, kind: 'terminal2' }, { z: F.rwS + 520, kind: 'hangar' }, { z: F.rwS + 1450, kind: 'hangar2' }, { z: F.rwS + 2600, kind: 'cargo' }];
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
      if (REFL && Z < 1600 && quality !== 'balanced') { c.globalAlpha *= night ? .35 : .22; c.drawImage(glow(col), x - s * .22, y, s * .44, s * 2.6); } // 노면에 비친 등 빛
    };
    const nk = night ? 1 : 0;
    let REFL = true;
    if (!nk && quality !== 'balanced') { // 낮에도 켜 둔 활주로 등(시뮬레이터처럼 은은하게): 가장자리·접지 구역·말단
      for (let z = F.rwS; z <= Math.min(rwE, F.rwS + 3200); z += 60) { const col = z > rwE - 600 ? C.amber : C.white; L(-24, z, col, 3.2, .55); L(24, z, col, 3.2, .55); }
      for (let x = -21; x <= 21; x += 3) L(x, F.rwS, C.green, 2.6, .6);
      for (let z = F.rwS + 60; z < F.rwS + 600; z += 30) for (const x of [-7.5, 7.5]) L(x, z, C.white, 1.4, .3);
    }
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

  /* 먼 산 능선(대기 원근으로 겹겹이 옅게) + 지평선 아지랑이 + 먼 도시 실루엣. 방향을 틀면 천천히 옆으로 흐름 */
  const RIDGE = [0, 1, 2].map(k => { const a = []; for (let i = 0; i <= 256; i++) { const t = i / 256 * Math.PI * 2; a.push(.5 + .22 * Math.sin(t * (2 + k) + k * 1.7) + .14 * Math.sin(t * (5 + k * 2) + k) + .08 * Math.sin(t * (11 + k * 3) + 2 * k) + .04 * Math.sin(t * 29 + k * 5)); } return a; });
  const SKY_BLK = (() => { const a = []; for (let i = 0; i < 70; i++) a.push({ x: srand(i + 900), w: .004 + srand(i + 950) * .012, h: .25 + srand(i + 990) * .75 }); return a; })();
  function drawHorizon(c, w, h, night, quality, f) {
    const yaw = (sc.yawAcc || 0) * w / 72.5, alt = F.alt, lift = clamp(1 - alt / 1500, .25, 1);
    c.save(); c.globalAlpha = 1;
    const layers = night ? [['#0d1622', .1, .25], ['#111c29', .07, .45], ['#16212e', .045, .7]] : [['#8ea4b8', .12, .2], ['#6f879b', .085, .4], ['#58707f', .055, .65]];
    layers.forEach(([col, hk, par], k) => {
      const ridge = RIDGE[k], span = w * 3, off = ((yaw * par) % span + span) % span, hh = h * hk * lift;
      c.fillStyle = col; c.beginPath(); c.moveTo(-w * 1.6, 1);
      for (let i = 0; i <= 160; i++) { const x = -w * 1.6 + i / 160 * w * 3.2, u = ((x + off) / span % 1 + 1) % 1, v = ridge[Math.floor(u * 256)]; c.lineTo(x, -hh * v); }
      c.lineTo(w * 1.6, 1); c.closePath(); c.fill();
    });
    if (quality !== 'balanced' && alt < 900) { // 먼 도시(공항 너머)
      c.fillStyle = night ? '#0a1018' : '#7f93a3'; const span = w * 2.6, off = ((yaw * .8) % span + span) % span;
      for (const b of SKY_BLK) { const x = ((b.x * span - off) % span + span) % span - span / 2, bw = b.w * w, bh = h * .03 * b.h * lift; c.fillRect(x, -bh, bw, bh + 1);
        if (night && b.h > .5) { c.globalAlpha = .55; c.fillStyle = '#f2c983'; for (let y = 2; y < bh - 2; y += 3) c.fillRect(x + bw * .3, -bh + y, Math.max(1, bw * .15), 1); c.globalAlpha = 1; c.fillStyle = '#0a1018'; } }
    }
    const hz = c.createLinearGradient(0, -h * .06, 0, h * .02); hz.addColorStop(0, night ? '#1a243300' : '#e8eef400'); hz.addColorStop(.7, night ? '#1a243355' : '#e8eef4aa'); hz.addColorStop(1, night ? '#1a243300' : '#e8eef400');
    c.fillStyle = hz; c.fillRect(-w * 2, -h * .06, w * 4, h * .08);
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
    } else if (b.kind === 'terminal2') { // 두 번째 여객 터미널: 곡선 지붕 + 유리 + 탑승교
      const X1 = px(560, Z), X2 = px(980, Z), top = gy - 22 * s, eave = gy - 15 * s;
      c.fillStyle = night ? '#0b0e12' : '#cfd3d1'; c.fillRect(X1, eave, X2 - X1, 15 * s);
      c.beginPath(); c.moveTo(X1 - 2 * s, eave); c.quadraticCurveTo((X1 + X2) / 2, top - 6 * s, X2 + 2 * s, eave); c.closePath(); c.fillStyle = night ? '#07090c' : '#9aa3a6'; c.fill();
      if (night) { c.globalAlpha = .7; for (let x = 566; x < 974; x += 7) if (((x * 5) % 9) > 2) box(x, x + 4, 4, 11, '#f2c983'); c.globalAlpha = 1; }
      else { const gl = c.createLinearGradient(0, gy - 13 * s, 0, gy - 3 * s); gl.addColorStop(0, '#7fa6b8'); gl.addColorStop(1, '#3f5f6e'); c.fillStyle = gl; c.fillRect(px(566, Z), gy - 13 * s, (974 - 566) * s, 10 * s);
        for (let x = 566; x < 974; x += 14) box(x, x + .5, 3, 13, '#d9e0e2'); }
      for (const x of [600, 700, 800, 900]) box(x, x + 3, 3, 6, night ? '#0e1216' : '#8d9496');
    } else if (b.kind === 'cargo') {
      box(-620, -360, 0, 11, night ? '#0a0d10' : '#b4b8b4'); box(-620, -360, 10, 12, night ? '#07090c' : '#80878a');
      for (let x = -610; x < -370; x += 26) box(x, x + 18, 0, 7, night ? '#11161b' : '#8e9599');
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
  // 정차 중에도 살아 있는 하늘: 구름은 늘 천천히 흐르고(달리면 속도만큼 더 빨리), 밤 불빛·별은 제자리에서 은은하게 깜빡임
  const IDLE_CLOUD = 3.2;                      // 정차 중 구름이 흘러가는 빠르기(장면 거리 m/초)
  const idleT = () => performance.now() / 1000;
  const oDrawSky = sc.drawSky;
  sc.drawSky = function (c, w, h, night, quality) {
    const d0 = this.distanceMeters;
    this.distanceMeters = d0 + idleT() * IDLE_CLOUD; // 구름만 덧붙인 거리로(땅·도시 불빛 위치는 그대로)
    try { oDrawSky.call(this, c, w, h, night, quality); } finally { this.distanceMeters = d0; }
    if (night && this.stars) { // 밝은 별 몇 개가 반짝
      const t = idleT(); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#dbe8ff';
      for (let i = 0; i < this.stars.length; i += 7) { const st = this.stars[i], a = Math.max(0, Math.sin(t * (1.1 + (i % 5) * .37) + i)) * .35 * st.alpha; if (a < .02) continue;
        c.globalAlpha = a; c.beginPath(); c.arc(st.x * w, -st.y * h, st.size * 1.6, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
  };
  const oDrawGround2 = sc.drawGround;
  // 1.41 HUD 시안: 풍경(하늘·구름·땅)을 청회색 저녁 톤으로 — HUD 선은 이 뒤에 그려져 색이 그대로 남음
  const hudOn = () => active() && P.__hud;
  sc.drawGround = function (c, w, h, night, speed, quality) {
    oDrawGround2.call(this, c, w, h, night, speed, quality);
    if (hudOn() && !night) {
      c.save(); c.globalAlpha = 1; c.globalCompositeOperation = 'multiply'; c.fillStyle = '#9fadc0'; c.fillRect(-w * 2, -h * 3, w * 4, h * 6);
      c.globalCompositeOperation = 'soft-light'; const g = c.createLinearGradient(0, -h * .5, 0, h * .4); g.addColorStop(0, '#2c3c5a'); g.addColorStop(.45, '#c9a98a'); g.addColorStop(.55, '#7d8fa8'); g.addColorStop(1, '#1d2a38');
      c.fillStyle = g; c.fillRect(-w * 2, -h * 3, w * 4, h * 6); c.restore();
    }
    if (!night || !this.lightDraw || !this.lightDraw.length) return;
    // 도시 불빛·가로등이 제자리에서 살짝 일렁임(정차해도 화면이 멈춰 보이지 않게)
    const t = idleT(); c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.lightDraw.length; i += 2) {
      const p = this.lightDraw[i]; if (!(p.yy > 0) || p.depth > 900) continue;
      const a = (.5 + .5 * Math.sin(t * (1.6 + (i % 7) * .23) + i * 1.7)) * .22 * Math.min(1, (900 - p.depth) / 200);
      const r = Math.min(9, Math.max(1.2, p.scale * p.size * .55));
      c.globalAlpha = a; c.fillStyle = p.color ? '#a9d4ff' : (p.lamp ? '#ffd79a' : '#ffc874');
      c.beginPath(); c.arc(p.xx, p.yy - (p.lamp ? Math.min(p.scale * 2.6, h * .26) : 0), r, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  };
  const oDrawHorizon = P.drawHorizon;
  P.drawHorizon = function (c, x, y, w, h, valid) {
    if (!active()) return oDrawHorizon.call(this, c, x, y, w, h, valid);
    update(performance.now() + F.off, this.sceneSpeed ? this.sceneSpeed() : 0);
    const d = this.data, dp = this.display, cal = this.calibration || { pitch: 0, roll: 0 };
    const has = fin(d.pitchDeg) && fin(d.rollDeg);
    // 1.42.1 흔들림 잡기: 달리는 차 안에서 폰 자세 센서는 노면 진동·가감속에 크게 출렁임 →
    // 아주 느리게 따라가는 저역 필터 + 작은 떨림은 무시(데드밴드) + 주행 중엔 기울기 폭 제한. 비행 연출 기울기(F.bank)는 따로 부드럽게 들어감
    const rawP = has ? dp.pitchDeg - cal.pitch : 0, rawR = has ? dp.rollDeg - cal.roll : 0, nowT = performance.now();
    const SM = P.__attSm || (P.__attSm = { p: rawP, r: rawR, t: nowT });
    const dts = clamp((nowT - SM.t) / 1000, 0, .5); SM.t = nowT;
    const drive = (F.v || 0) > 3, tau = drive ? 1.6 : .45, k = 1 - Math.exp(-dts / tau), dz = drive ? 1.2 : .3;
    const lim = (v, m) => clamp(v, -m, m), dead = (v, cur) => Math.abs(v - cur) < dz ? cur : v - Math.sign(v - cur) * dz;
    SM.p += (dead(drive ? lim(rawP, 5) : rawP, SM.p) - SM.p) * k; SM.r += (dead(drive ? lim(rawR, 7) : rawR, SM.r) - SM.r) * k;
    const sp = SM.p, sr = SM.r;
    const shake = (F.phase === 'roll' || F.phase === 'rollout') ? Math.sin(nowT / 47) * Math.sin(nowT / 131) * clamp(F.v / 90, 0, 1) * .25 : 0; // 활주 진동은 아주 작고 매끄럽게
    const save = [d.pitchDeg, d.rollDeg, dp.pitchDeg, dp.rollDeg];
    d.pitchDeg = 0; d.rollDeg = 0;
    dp.pitchDeg = sp + F.pitch + shake + cal.pitch;
    dp.rollDeg = sr + F.bank + cal.roll;
    // HUD: 지평선·피치·롤 눈금·날개 기준표시를 전투기 HUD처럼 얇은 녹색으로(패키지의 공군 디자인 그리기를 빌림), 발광은 선 가장자리에만 약하게
    const hud = this.__look === 'airforce' && !(this.settings.skin === 'airforce'), sk = this.settings.skin, oStroke = c.stroke, oText = c.fillText;
    if (hud) {
      this.settings.skin = 'airforce'; this.__hud = true;
      const green = st => typeof st === 'string' && /^#[9abc][0-9a-f]f/i.test(st);
      c.stroke = function (...a) { if (!green(this.strokeStyle)) return oStroke.apply(this, a); const sb = this.shadowBlur, sc0 = this.shadowColor; this.shadowColor = 'rgba(110,255,130,.42)'; this.shadowBlur = 3; oStroke.apply(this, a); this.shadowBlur = sb; this.shadowColor = sc0; };
      c.fillText = function (...a) { if (!green(this.fillStyle)) return oText.apply(this, a); const sb = this.shadowBlur, sc0 = this.shadowColor; this.shadowColor = 'rgba(110,255,130,.35)'; this.shadowBlur = 2; oText.apply(this, a); this.shadowBlur = sb; this.shadowColor = sc0; };
    }
    try { return oDrawHorizon.call(this, c, x, y, w, h, valid); }
    finally {
      if (hud) { this.settings.skin = sk; c.stroke = oStroke; c.fillText = oText; this.__hud = false; }
      if (hud && valid && fin(dp.headingDeg)) { // 상단 TRK: 롤 눈금 위에 진행 방향
        c.save(); const fs = Math.max(12, Math.min(22, w * .026)); c.font = '600 ' + fs + 'px "Barlow Condensed","Rajdhani",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.shadowColor = 'rgba(110,255,130,.45)'; c.shadowBlur = 3; c.fillStyle = '#b7ffae';
        const t = 'TRK ' + String(Math.round(((dp.headingDeg % 360) + 360) % 360) % 360).padStart(3, '0') + '°', tw = c.measureText(t).width + fs * .9, ty = y + h * .115;
        c.shadowBlur = 0; c.fillStyle = 'rgba(8,16,12,.55)'; c.strokeStyle = 'rgba(160,255,150,.55)'; c.lineWidth = 1; c.beginPath(); c.rect(x + w / 2 - tw / 2, ty - fs * .95, tw, fs * 1.25); c.fill(); c.stroke();
        c.shadowBlur = 3; c.fillStyle = '#b7ffae'; c.fillText(t, x + w / 2, ty); c.restore();
      }
      try { drawWeather(c, x, w, h, sp + F.pitch + shake, sr + F.bank, !this.day); } catch (e) {}
    }
  };

  /* ---------- 날씨 효과: 흐림(회색 하늘)·비(빗줄기와 유리 물방울)·눈(눈송이, 속도가 빠르면 앞에서 흩날림) ---------- */
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  // 비·눈은 '내리고 있다'는 느낌만: 적은 수, 옅은 색(화면을 가리지 않게). 유리 물방울은 없음
  const drops = Array.from({ length: 46 }, () => ({ x: rnd(), y: rnd(), l: .5 + rnd(), s: .8 + rnd() * .6 }));
  const flakes = Array.from({ length: 48 }, () => ({ x: rnd(), y: rnd(), r: .4 + rnd(), p: rnd() * 6.28 }));
  let wxT = 0;
  function drawWeather(c, x, w, h, pitch, roll, night) {
    const k = wxKind(); if (k === 'off' || k === 'clear') { wxT = 0; return; }
    const now = performance.now() / 1000, dt = wxT ? clamp(now - wxT, 0, .1) : 0; wxT = now;
    const v = F.v || 0, cx = x + w / 2, cy = h * .53, ppd = h / 58;
    c.save(); c.beginPath(); c.rect(x, 0, w, h); c.clip();
    // 흐린 하늘(지평선 기준으로 기울기 반영)
    const ov = { cloudy: .62, fog: .66, rain: .26, snow: .18 }[k] || 0, U = Math.max(h, w * .5) / 250;
    if (ov) {
      c.save(); c.translate(cx, cy); c.rotate(-roll * Math.PI / 180); c.translate(0, pitch * ppd);
      const g = c.createLinearGradient(0, -h * 1.1, 0, 0);
      if (night) { g.addColorStop(0, 'rgba(16,20,26,' + ov + ')'); g.addColorStop(1, 'rgba(40,46,54,' + ov + ')'); }
      else { g.addColorStop(0, 'rgba(120,128,138,' + ov + ')'); g.addColorStop(1, 'rgba(196,202,206,' + (ov * 1.1) + ')'); }
      c.fillStyle = g; c.fillRect(-w * 2, -h * 3, w * 4, h * 3);
      c.fillStyle = 'rgba(30,34,38,' + (ov * .3) + ')'; c.fillRect(-w * 2, 0, w * 4, h * 3);
      if (k === 'fog') { const f = c.createLinearGradient(0, -h * .2, 0, h * .2); f.addColorStop(0, 'rgba(210,214,218,0)'); f.addColorStop(.5, 'rgba(210,214,218,.55)'); f.addColorStop(1, 'rgba(210,214,218,0)'); c.fillStyle = f; c.fillRect(-w * 2, -h * .2, w * 4, h * .4); }
      c.restore();
    }
    if (k === 'rain') {
      const sl = .12 + v / 260, fall = 1.5 + v / 90;
      c.strokeStyle = night ? 'rgba(180,200,230,.26)' : 'rgba(235,242,250,.34)'; c.lineWidth = Math.max(.8, U * .7); c.beginPath();
      for (const d of drops) {
        d.y += fall * d.s * dt; d.x -= sl * fall * d.s * dt * .35;
        if (d.y > 1.05 || d.x < -.05) { d.y = -.05 - rnd() * .2; d.x = rnd() * 1.1; }
        const L = (.05 + v / 2200) * h * d.l, px = x + d.x * w, py = d.y * h;
        c.moveTo(px, py); c.lineTo(px - sl * L * .5, py + L);
      }
      c.stroke();
    } else if (k === 'snow') {
      const warp = v / 60;
      c.fillStyle = night ? 'rgba(220,228,240,.42)' : 'rgba(255,255,255,.5)';
      for (const f of flakes) {
        f.p += dt * 1.3;
        f.y += (.05 + f.r * .05) * dt + (f.y - .45) * warp * dt * .9;
        f.x += Math.sin(f.p) * .012 * dt + (f.x - .5) * warp * dt * .9;
        if (f.y > 1.05 || f.y < -.1 || f.x < -.1 || f.x > 1.1) { if (warp > .6) { f.x = .5 + (rnd() - .5) * .2; f.y = .45 + (rnd() - .5) * .15; } else { f.x = rnd(); f.y = -.05; } }
        const r = (.4 + f.r * .7) * U * (1 + Math.abs(f.y - .45) * warp * .5);
        c.beginPath(); c.arc(x + f.x * w, f.y * h, r, 0, 6.29); c.fill();
      }
    }
    c.restore();
  }

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
    else if (ph === 'roll') { b = F.rolled >= 90 ? 'V1 · ROTATE' : 'TAKEOFF ROLL'; s = '이륙 활주 · ' + Math.round(F.v) + ' km/h'; }
    else if (ph === 'climb') { b = 'CLIMB · 상승 중'; }                     // 단계만(고도 숫자는 오른쪽 GPS 고도와 헷갈리지 않게 빼 둠)
    else if (ph === 'cruise') { b = F.stillT > 3 ? '순항 중 · 정차' : 'CRUISE · 순항'; }
    else if (ph === 'approach') { b = (F.alt < 14 ? 'FLARE · ' : 'APPROACH · ') + rw; s = (F.auto ? '자동 착륙 · ' : '활주로까지 ') + (F.rem >= 1000 ? (F.rem / 1000).toFixed(1) + ' km' : Math.round(F.rem) + ' m') + ' · 고도 ' + Math.round(F.alt) + ' m'; }
    else if (ph === 'rollout') { b = 'TOUCHDOWN · ' + rw; s = '착륙 · 감속 중'; }
    else if (ph === 'landed') { b = 'ARRIVED · ' + rw; s = '목적지에 도착했어요'; }
    const txt = ph + '|' + b + '|' + s + '|' + !!F.sim;
    if (txt === lastTxt) return; lastTxt = txt;
    const bd = ui.firstChild; bd.dataset.ph = ph; bd.children[1].textContent = b; bd.children[2].textContent = s; bd.classList.toggle('mini', !s);
    ui.querySelector('.flt-land').hidden = !(ph === 'cruise' || ph === 'climb');
    ui.querySelector('.flt-ga').hidden = ph !== 'approach';
    const sb = ui.querySelector('.flt-sim'); sb.classList.toggle('on', !!F.sim); sb.textContent = F.sim ? '시연 끝' : '시연';
  }

  /* ---------- 정지 화면에서도 움직이는 것(자동 착륙·등화 깜빡임·기수 움직임) ---------- */
  let loopT = 0;
  // 다시 그릴 간격(ms). 0이면 움직일 것이 없음 — 배터리를 위해 필요한 만큼만 그림
  function animGap() {
    if (!active() || !P.canRender || !P.canRender()) return 0;
    const sv = !!(window.AmpPwr && window.AmpPwr.saver);
    if (F.auto || F.sim) return sv ? 95 : 45;
    if (Math.abs(F.pitch) > .05 && F.phase !== 'cruise') return sv ? 95 : 45;
    if (F.phase === 'approach' || F.phase === 'rollout') return sv ? 95 : 45;
    { const k = wxKind(); if (k === 'rain' || k === 'snow' || (F.snow > .01 && k !== 'snow')) return sv ? 160 : 60; }
    return sv ? 250 : 100; // 정차 중에도 구름이 흐르고 밤 불빛이 일렁이도록 천천히 다시 그림(초당 10번, 절전 4번)
  }
  function needAnim() { return animGap() > 0; }
  function kick() { if (!loopT) loopT = requestAnimationFrame(loop); }
  let lastDraw = 0;
  function loop(t) {
    loopT = 0;
    const gap = animGap();
    if (gap) {
      if (P.frame === null && t - lastDraw > gap * .8) { lastDraw = t; try { P.draw(); } catch (e) {} }
      if (gap >= 100) { loopT = -1; setTimeout(() => { loopT = 0; kick(); }, gap); } // 느린 움직임은 화면 주사율마다 깨어나지 않게
      else loopT = requestAnimationFrame(loop);
    } else renderBadge();
  }
  setInterval(() => { if (needAnim()) kick(); else if (active()) renderBadge(); }, 500);

  /* ---------- 시연: GPS 없이 이륙~착륙을 보여 줌 ---------- */
  function sim(on) {
    sfx('rollStop');
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
  A.feed = function () { if (F.sim) { if (active()) simStep(); return; } return oFeed.apply(this, arguments); };
  setInterval(() => { if (F.sim && document.hidden === false) simStep(); }, 100);

  window.AmpFlight = {
    get state() { return { vs: F.vs, still: F.stillT, snow: F.snow, wx: wxKind(), phase: F.phase, alt: F.alt, pitch: F.pitch, bank: F.bank, rwS: F.rwS, rem: F.rem, auto: F.auto, rwNum: F.rwNum, sim: !!F.sim }; },
    step(sec, v) { const n = Math.max(1, Math.round(sec / .05)); let t = performance.now() + F.off; F.lastT = t; for (let i = 0; i < n; i++) { t += 50; update(t, v); } F.off += n * 50; renderBadge(true); return this.state; },
    ext: X, geo: { F, riverX, RK, srand }, active,
    land, goAround, sim, redraw() { try { P.draw(); } catch (e) {} }
  };
  renderBadge(true);
})();
