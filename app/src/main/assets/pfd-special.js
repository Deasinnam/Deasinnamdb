/* 대신남 원 스페셜 — PFD 풍경을 손으로 칠한 듯한 지브리풍으로
 *
 * 스페셜판(빌드 special, 미리보기는 주소에 ?special)에서만 켜집니다. pfd/pfd.js(패키지 원본)는 고치지 않고,
 * pfd-flight.js가 열어 둔 자리(AmpFlight.ext)와 장면 객체(scene.drawSky·drawGround)를 덧씌웁니다.
 *
 *  하늘  : 시각에 따라 낮(깊은 파랑) → 노을(남보라·분홍·호박색) → 밤(남색, 해 진 뒤 한 시간은 지평선 잔광).
 *          붓결 같은 옅은 새털구름 띠, 낮게 걸린 해와 은은한 햇무리(노을 때만 크게)
 *  구름  : 공 여러 개를 겹친 뭉게구름을 코드로 빚어, 해 쪽은 밝고 그늘은 보랏빛, 가장자리는 역광으로 빛나게.
 *          멀수록 하늘빛에 묻힘(대기 원근). 지평선에는 큰 적운 무리가 방향을 틀면 천천히 옆으로 흐름
 *  땅    : 먼 산 능선을 겹겹이(멀수록 옅게, 노을이면 능선 끝이 붉게), 들판에 붓 터치 질감, 지평선 쪽 안개
 *  강    : 하늘을 비추는 물(먼 곳은 지평선빛, 가까울수록 위쪽 하늘빛), 잔물결 붓결, 해 아래 반짝이는 윤슬 기둥
 *
 * 무거운 그림(구름 모양·질감)은 처음 한 번만 만들고, 색은 시각이 바뀔 때(몇 분에 한 번)만 다시 입힙니다.
 * 무작위 값은 모두 고정 시드 — 같은 시각·같은 위치면 늘 같은 그림입니다.
 */
(function () {
  'use strict';
  const on = document.documentElement.dataset.build === 'special' || /[?&#]special\b/.test(location.href);
  const A = window.AmpPfd, FL = window.AmpFlight;
  if (!on || !A || !A.panel || !FL || !FL.ext) return;
  document.documentElement.dataset.special = '1';
  const P = A.panel, sc = P.scene, X = FL.ext, G = FL.geo, F = G.F, srand = G.srand;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const fin = v => typeof v === 'number' && Number.isFinite(v);
  const angleDelta = (a, b) => ((b - a + 540) % 360) - 180;
  const FOV = 72.5;
  // 고정 시드 난수(시각과 무관)
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const hash2 = (x, y) => hash(x * 57.13 + y * 113.7);
  // 값 잡음(타일 반복) + 여러 겹(fbm)
  function vnoise(x, y, per) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const m = k => ((k % per) + per) % per;
    const a = hash2(m(xi), m(yi)), b = hash2(m(xi + 1), m(yi)), c = hash2(m(xi), m(yi + 1)), d = hash2(m(xi + 1), m(yi + 1));
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  function fbm(x, y, per, oct) { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, per * f); n += a; a *= .5; f *= 2; } return s / n; }

  /* ---------- 색: 낮 / 노을 / 밤을 섞어 씀 ---------- */
  const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const css = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : +a.toFixed(3)) + ')';
  const PAL = {
    day: { top: '#2a63a8', mid: '#5f9ed3', low: '#bcd9e8', hz: '#e9f1ee', sun: '#fffbe9', cLit: '#fffdf8', cMid: '#e2e6f2', cSh: '#8f9cc4', cRim: '#ffffff', ridge: ['#9fb3c6', '#7d97ad', '#5f7d8d'], fog: '#dfe9ec', water: '#3d6f93', sand: '#cdbf95', grade: '#fff3d6' },
    gold: { top: '#323a78', mid: '#a3709f', low: '#f2a273', hz: '#ffd99a', sun: '#ffe2a0', cLit: '#ffd7a4', cMid: '#d9929e', cSh: '#5f4d86', cRim: '#fff0c8', ridge: ['#a78296', '#7d5f80', '#4f4566'], fog: '#f0b48d', water: '#4b3f6e', sand: '#d69a74', grade: '#ff9a52' },
    twi: { top: '#1d2552', mid: '#4d4a83', low: '#b8707e', hz: '#f09a72', sun: '#ffb070', cLit: '#eba08e', cMid: '#a26f8e', cSh: '#3a3664', cRim: '#ffc89a', ridge: ['#6b5878', '#4c4060', '#2f2a45'], fog: '#a4708a', water: '#2c2c58', sand: '#8a6a70', grade: '#c86a6a' },
    night: { top: '#0b1532', mid: '#1c3160', low: '#34507e', hz: '#4c668e', sun: '#dfe8ff', cLit: '#9eadd0', cMid: '#5f6e96', cSh: '#2a3456', cRim: '#d3e0f8', ridge: ['#33445f', '#26354d', '#1b273b'], fog: '#3a4d70', water: '#1f3a5c', sand: '#25303c', grade: '#3a4a7a' }
  };
  for (const k in PAL) for (const q in PAL[k]) PAL[k][q] = Array.isArray(PAL[k][q]) ? PAL[k][q].map(hex) : hex(PAL[k][q]);

  /* ---------- 해의 실제 위치: 날짜·시각·위치(마지막 GPS, 없으면 서울)로 계산 → 높이(°)·방위(°) ----------
   *  해 높이로 장면이 이어짐: 한낮(16° 위) → 노을(16°~3°) → 해가 수평선 아래로 → 푸른 시간(−5°까지) → 밤(잔광은 −16°까지)
   *  새벽은 거꾸로. 시험·미리보기: window.__spTime(ms) 또는 window.__spHour(오늘 몇 시) */
  function loc() { try { const l = JSON.parse(localStorage.getItem('dna_wxLoc')); if (l && fin(l[0]) && fin(l[1])) return l; } catch (e) {} return [37.5665, 126.978]; }
  function when() { if (fin(window.__spTime)) return new Date(window.__spTime); const d = new Date(); if (fin(window.__spHour)) d.setHours(Math.floor(window.__spHour), Math.round((window.__spHour % 1) * 60), 0, 0); return d; }
  function solar(d, lat, lon) {
    const rad = Math.PI / 180, n = d.getTime() / 86400000 + 2440587.5 - 2451545;
    const g = (357.529 + .98560028 * n) * rad, q = 280.459 + .98564736 * n, L = (q + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * rad, e = (23.439 - .00000036 * n) * rad;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = ((18.697374558 + 24.06570982441908 * n) % 24 + 24) % 24, ha = (gmst * 15 + lon) * rad - ra, la = lat * rad;
    const el = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
    const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha));
    return { el: el / rad, az: ((az / rad) % 360 + 360) % 360 };
  }
  let sunC = null, sunT = 0;
  function clock() {
    const d = when(), t = d.getTime(); if (sunC && Math.abs(t - sunT) < 15000) return sunC;
    const [lat, lon] = loc(), s = solar(d, lat, lon);
    sunT = t; sunC = { el: s.el, az: s.az, hr: d.getHours() + d.getMinutes() / 60 }; return sunC;
  }
  // 낮·밤 자동(테마 '자동'일 때): 해가 수평선 아래 5°보다 낮으면 밤
  window.AmpAutoNight = () => clock().el < -5;
  try { window.AmpApplyTheme && window.AmpApplyTheme(); } catch (e) {}
  let M = null, mKey = '';
  function mood(night) {
    const k = clock(), el = k.el;
    const g = Math.round((1 - sstep(3, 16, el)) * 20) / 20, tw = Math.round((1 - sstep(-5, 1.5, el)) * 12) / 12, dusk = Math.round((1 - sstep(-16, -5, el)) * 12) / 12;
    const key = night ? 'n' + dusk : 'd' + g + 't' + tw;
    if (key === mKey && M) return M;
    const a = PAL.day, b = PAL.gold, t = PAL.twi, n = PAL.night, o = {};
    for (const q in a) {
      if (night) { o[q] = n[q]; continue; }
      o[q] = Array.isArray(a[q][0]) ? a[q].map((c, i) => mixc(mixc(c, b[q][i], g), t[q][i], tw)) : mixc(mixc(a[q], b[q], g), t[q], tw);
    }
    if (night && dusk > 0) { o.low = mixc(o.low, hex('#5a3d5c'), dusk * .7); o.hz = mixc(o.hz, hex('#b0646a'), dusk * .75); o.fog = mixc(o.fog, hex('#4a3550'), dusk * .5); o.mid = mixc(o.mid, hex('#2c2c5a'), dusk * .5); }
    o.night = night; o.gold = night ? 0 : g; o.tw = night ? 0 : tw; o.dusk = night ? dusk : 0; o.el = el; o.hr = k.hr;
    M = o; mKey = key; skyCv = null; tintKey = ''; return o;
  }

  // 진행 방향(미리보기에서는 window.__spHdg로 고정 가능)
  const heading = () => fin(window.__spHdg) ? window.__spHdg : fin(P.display && P.display.headingDeg) ? P.display.headingDeg : (fin(sc.heading) ? sc.heading : 0);
  // 해 화면 위치: 방위는 지금 진행 방향 기준, 높이는 PFD 눈금(1° = 화면 높이/58) 그대로 → 해가 실제로 지평선 아래로 내려감
  function sunScreen(w, h, m) {
    const s = clock(), hd = heading();
    const dx = angleDelta(hd, s.az) / FOV * w, y = -s.el * h / 58;
    return { x: dx, y, vis: !m.night && s.el > -1.2 && y > -h * 1.6 && Math.abs(dx) < w * .9, side: dx < 0 ? -1 : 1 };
  }

  /* ---------- 하늘 바탕(색 띠 + 붓결) : 시각이 바뀔 때만 다시 칠함 ---------- */
  let skyCv = null, skyKey = '';
  function skyCanvas(w, h, m) {
    const key = (w | 0) + 'x' + (h | 0);
    if (skyCv && skyKey === key) return skyCv;
    const W = 192, H = 384, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 0, H);
    // 위(지평선 위 1.9h)부터 지평선까지. 노을은 아래쪽에 띠가 몰림
    g.addColorStop(0, css(m.top)); g.addColorStop(.38, css(mixc(m.top, m.mid, .55))); g.addColorStop(.7, css(m.mid));
    g.addColorStop(.88, css(mixc(m.mid, m.low, .7))); g.addColorStop(.965, css(m.low)); g.addColorStop(1, css(m.hz));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // 붓결: 가로로 길게 눌린 얼룩(색 띠 사이를 손으로 펴 바른 느낌)
    const id = x.getImageData(0, 0, W, H), d = id.data;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const n = fbm(xx / 48, yy / 6, 4, 4) - .5, k = (yy * W + xx) * 4, s = 1 + n * .07;
      d[k] = clamp(d[k] * s, 0, 255); d[k + 1] = clamp(d[k + 1] * s, 0, 255); d[k + 2] = clamp(d[k + 2] * (1 + n * .05), 0, 255);
    }
    x.putImageData(id, 0, 0);
    skyCv = cv; skyKey = key; return cv;
  }
  // 새털구름 띠(가로로 반복, 방향을 틀면 흐름) — 흰 결만 있는 회색조, 색은 그릴 때 입힘
  const CIRRUS = (() => {
    const W = 512, H = 160, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d'), id = x.createImageData(W, H), d = id.data;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
      const band = Math.exp(-Math.pow((yy / H - .5) / .28, 2)), n = fbm(xx / 64, yy / 7, 8, 5), s = sstep(.52, .78, n) * band, k = (yy * W + xx) * 4;
      d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = s * 150;
    }
    x.putImageData(id, 0, 0); return cv;
  })();
  const cirrusTint = {};
  function tintedCirrus(m) {
    const key = mKey; if (cirrusTint.key === key) return cirrusTint.cv;
    const cv = document.createElement('canvas'); cv.width = CIRRUS.width; cv.height = CIRRUS.height; const x = cv.getContext('2d');
    x.drawImage(CIRRUS, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = css(m.night ? mixc(m.cMid, m.cRim, .2) : mixc(m.cLit, m.low, .3)); x.fillRect(0, 0, cv.width, cv.height);
    cirrusTint.key = key; cirrusTint.cv = cv; return cv;
  }

  /* ---------- 뭉게구름 빚기: 공(구) 여러 개의 합 → 표면 방향(법선)을 그대로 얻음 ---------- */
  const CW = 320, CH = 200;
  function sculpt(seed, tall) {
    const balls = [], base = CH * (tall ? .86 : .8), r0 = CW * (tall ? .1 : .11);
    const nb = 4 + Math.floor(hash(seed) * 3), span = CW * .8;
    for (let i = 0; i < nb; i++) { const t = (i + .5) / nb, r = r0 * (.75 + hash(seed + i * 3.1) * .5); balls.push([CW * .1 + t * span + (hash(seed + i) - .5) * r * .4, base - r * .55, r]); }
    const tiers = tall ? 4 : 2 + Math.floor(hash(seed + 9) * 2);
    let width = span * .62, cy = base - r0 * 1.1;
    for (let tr = 0; tr < tiers; tr++) {
      const n = Math.max(1, Math.round(3 - tr * .6 + hash(seed + tr * 7) * 1.4)), rr = r0 * (tall ? 1.15 - tr * .12 : 1.05 - tr * .2) * (.9 + hash(seed + tr) * .3);
      const cx0 = CW * (.42 + (hash(seed + tr * 5.3) - .5) * .22);
      for (let i = 0; i < n; i++) { const t = n === 1 ? .5 : i / (n - 1); balls.push([cx0 + (t - .5) * width + (hash(seed + tr * 11 + i) - .5) * rr * .5, cy - (hash(seed + i * 2 + tr) - .3) * rr * .4, rr * (.85 + hash(seed + i + tr * 3) * .3)]); }
      cy -= rr * (tall ? 1.05 : .95); width *= .62;
    }
    // 공 표면들을 부드럽게 이어 붙인 높이(smooth max) → 살짝 흐리게 → 기울기에서 표면 방향(법선)
    const N = CW * CH, Hf = new Float32Array(N), kk = r0 * .45;
    const smax = (a, b) => { const q = Math.max(kk - Math.abs(a - b), 0) / kk; return Math.max(a, b) + q * q * kk * .25; };
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      let hv = -kk;
      for (const [cx, cy2, r] of balls) { const dx = x - cx, dy = y - cy2, q = r * r - dx * dx - dy * dy; const zz = q > 0 ? Math.sqrt(q) : -Math.sqrt(-q) * .35; hv = smax(hv, zz); }
      Hf[y * CW + x] = hv;
    }
    const blur = (src) => { const o = new Float32Array(N); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { let s2 = 0, n = 0; for (let j = -2; j <= 2; j++) for (let i2 = -2; i2 <= 2; i2++) { const xx = x + i2, yy = y + j; if (xx < 0 || yy < 0 || xx >= CW || yy >= CH) continue; s2 += src[yy * CW + xx]; n++; } o[y * CW + x] = s2 / n; } return o; };
    const Hs = blur(blur(Hf));
    const nx = new Float32Array(N), ny = new Float32Array(N), nz = new Float32Array(N), al = new Float32Array(N), yy0 = new Float32Array(N);
    for (let y = 1; y < CH - 1; y++) for (let x = 1; x < CW - 1; x++) {
      const i = y * CW + x, hv = Hs[i]; if (hv <= -2) continue;
      const gx = (Hs[i + 1] - Hs[i - 1]) / 2, gy = (Hs[i + CW] - Hs[i - CW]) / 2, l = Math.hypot(gx, gy, 1);
      nx[i] = -gx / l; ny[i] = -gy / l; nz[i] = 1 / l;
      const edge = fbm(x / 9 + seed, y / 9, 64, 3);            // 가장자리를 붓끝처럼 들쭉날쭉
      const bottom = 1 - sstep(base - 4, base + 6, y + (edge - .5) * 7); // 아랫면은 평평하게
      al[i] = sstep(-1, r0 * .22 + (edge - .5) * r0 * .18, hv) * bottom;
      yy0[i] = clamp((y - (base - r0 * 3.2)) / (r0 * 3.4), 0, 1);
    }
    return { nx, ny, nz, al, yy0, seed };
  }
  const SHAPES = [sculpt(11, false), sculpt(23, false), sculpt(37, true), sculpt(41, false), sculpt(59, true), sculpt(67, false)];
  // 색 입히기: 해 쪽 빛(lambert) → 띠 셋(그늘 보라·중간·밝음)으로 부드럽게 끊고, 아랫면 그늘, 역광 테두리, 붓 얼룩
  let tintKey = '', CLOUDS = null; const TINT = {};
  function tintClouds(m, side) {
    if (tintKey !== mKey) { TINT[-1] = TINT[1] = null; tintKey = mKey; }
    if (TINT[side]) return TINT[side];
    const low = Math.max(m.gold, m.tw), L = [side * lerp(.55, .85, low), lerp(lerp(-.7, -.32, m.gold), .2, m.tw), lerp(.45, .4, low)], ln = Math.hypot(L[0], L[1], L[2]); L[0] /= ln; L[1] /= ln; L[2] /= ln;
    const sh = m.cSh, mid = m.cMid, lit = m.cLit, rim = m.cRim, far = mixc(m.low, m.hz, .4);
    CLOUDS = SHAPES.map(S => {
      const out = {};
      for (const kind of ['near', 'far']) {
        const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; const x = cv.getContext('2d'), id = x.createImageData(CW, CH), d = id.data;
        for (let i = 0; i < CW * CH; i++) {
          const a = S.al[i]; if (a <= 0) continue;
          const px = i % CW, py = (i / CW) | 0, br = fbm(px / 14 + S.seed * 3, py / 10, 64, 3) - .5;
          let l = S.nx[i] * L[0] + S.ny[i] * L[1] + S.nz[i] * L[2] + br * .22;
          const s1 = sstep(-.25, .2, l), s2 = sstep(.38, .7, l);
          let c = mixc(sh, mid, s1); c = mixc(c, lit, s2);
          const under = S.yy0[i] * (1 - s2) * .55; c = mixc(c, mixc(sh, m.low, .25), under);        // 아랫면 그늘(땅빛·노을빛이 비쳐 따뜻하게)
          const edge = Math.pow(1 - S.nz[i], 2.2), face = Math.max(0, S.nx[i] * L[0] + S.ny[i] * L[1] * .6 + .35);
          c = mixc(c, rim, clamp(edge * face * (1.1 + low * .9), 0, .9));                             // 해 쪽 가장자리 빛(노을일수록 강하게)
          if (kind === 'far') c = mixc(c, far, .5);
          const k = i * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = a * 255;
        }
        x.putImageData(id, 0, 0); out[kind] = cv;
      }
      return out;
    });
    TINT[side] = CLOUDS; return CLOUDS;
  }

  // 지평선 큰 적운 무리(세상 방위에 고정, 방향을 틀면 옆으로)
  const BANK = Array.from({ length: 8 }, (_, i) => ({ az: i * 45 + hash(i + 700) * 20, w: .2 + hash(i + 720) * .22, s: i % SHAPES.length, lift: hash(i + 740) * .02 }));

  const blank = (() => { const c = document.createElement('canvas'); c.width = c.height = 1; return c; })();
  const BLANK_SPRITES = Array.from({ length: 8 }, () => ({ day: blank, night: blank }));
  const idleT = () => performance.now() / 1000;

  /* ---------- 하늘 ---------- */
  const oSky = sc.drawSky;
  sc.drawSky = function (c, w, h, night, quality) {
    if (!FL.active()) return oSky.call(this, c, w, h, night, quality);
    const m = mood(night), hq = quality !== 'balanced', sun = sunScreen(w, h, m);
    const hd = heading();
    c.save(); c.beginPath(); c.rect(-w * 2, -h * 3, w * 4, h * 3); c.clip();
    // 1) 바탕 색 띠: 지평선~1.9h는 칠한 그림, 그 위는 꼭대기 색
    c.fillStyle = css(m.top); c.fillRect(-w * 2, -h * 3, w * 4, h * 1.2);
    c.imageSmoothingEnabled = true; c.drawImage(skyCanvas(w, h, m), -w * 2, -h * 1.9, w * 4, h * 1.9 + 1);
    // 2) 해 쪽 하늘이 더 밝고 따뜻하게(노을) / 밤 잔광
    const OFF = window.__spOff || {};
    if ((!night || m.dusk > 0) && !OFF.glow) {
      const gx = clamp(sun.x, -w * 1.6, w * 1.6), k = night ? m.dusk * .55 : Math.max(lerp(.22, .7, m.gold), m.tw * .8), R = w * lerp(.7, 1.1, m.gold);
      const g = c.createRadialGradient(gx, 0, 0, gx, 0, R); g.addColorStop(0, css(m.night ? hex('#c8707a') : m.hz, k)); g.addColorStop(.45, css(m.night ? hex('#7a4a64') : m.low, k * .45)); g.addColorStop(1, css(m.low, 0));
      c.fillStyle = g; c.fillRect(gx - R, -R, R * 2, R);
    }
    // 3) 별·달(밤) — 기존 그리기를 그대로 쓰되 구름 그림만 비워 둠(선회 효과·구름 위치 갱신은 그대로 돌아감)
    const spr = this.sprites; this.sprites = BLANK_SPRITES;
    try { oSky.call(this, c, w, h, night, quality); } finally { this.sprites = spr; }
    // 4) 새털구름 띠
    if (hq && !OFF.cirrus) {
      const ci = tintedCirrus(m), span = w * 2.4, off = (((hd / FOV) * w * .92) % span + span) % span, y0 = -h * lerp(.62, .42, m.gold);
      c.globalAlpha = night ? .22 : lerp(.55, .75, m.gold);
      for (let k2 = -1; k2 < 2; k2++) c.drawImage(ci, -w * 1.2 - off + k2 * span, y0 - h * .1, span, h * .2);
      c.globalAlpha = 1;
    }
    // 5) 해: 원반 + 햇무리 하나(노을 때 크게). 지평선 구름 뒤에 걸리도록 먼저 그림
    if (sun.vis) {
      const r = clamp(w * .022, 10, 26) * lerp(1, 1.35, m.gold);
      const hal = c.createRadialGradient(sun.x, sun.y, r * .6, sun.x, sun.y, r * lerp(7, 14, m.gold));
      hal.addColorStop(0, css(m.sun, lerp(.35, .55, m.gold))); hal.addColorStop(.25, css(mixc(m.sun, m.low, .4), lerp(.12, .3, m.gold))); hal.addColorStop(1, css(m.low, 0));
      c.fillStyle = hal; c.beginPath(); c.arc(sun.x, sun.y, r * lerp(7, 14, m.gold), 0, Math.PI * 2); c.fill();
      const disc = c.createRadialGradient(sun.x - r * .2, sun.y - r * .2, 0, sun.x, sun.y, r);
      disc.addColorStop(0, css(mixc(m.sun, hex('#ffffff'), .6))); disc.addColorStop(.8, css(m.sun)); disc.addColorStop(1, css(m.sun, .0));
      c.fillStyle = disc; c.beginPath(); c.arc(sun.x, sun.y, r, 0, Math.PI * 2); c.fill();
    }
    // 6) 지평선 적운 무리 + 떠 있는 뭉게구름(멀수록 하늘빛에 묻힘)
    const CL = tintClouds(m, sun.side), alt = F.alt || 0, lift = clamp(1 - alt / 1600, .45, 1);
    for (const b of OFF.bank ? [] : BANK) {
      if (!hq && b.s % 2) continue;
      const bx = angleDelta(hd, b.az) / FOV * w; if (Math.abs(bx) > w * 1.4) continue;
      const bw = w * b.w; if (sun.vis && m.gold > .3 && Math.abs(bx - sun.x) < bw * .62) continue; // 해 앞은 비워 둠
      const bh = bw * CH / CW, y = -h * (b.lift + .004) * lift;
      c.globalAlpha = night ? .55 : .92; c.drawImage(CL[b.s].far, bx - bw / 2, y - bh * .86, bw, bh);
    }
    c.globalAlpha = 1;
    const focal = w * .79, dist = this.distanceMeters + idleT() * 3.2;
    const list = this.clouds.map(cl => ({ cl, depth: 160 + (((cl.z - 160 - dist * cl.layer) % 1520) + 1520) % 1520 })).sort((a, b) => b.depth - a.depth);
    for (const { cl, depth } of list) {
      if (cl.id % 4 === 1 || (!hq && cl.id % 3 === 0)) continue;
      const fade = clamp((1680 - depth) / 170, 0, 1) * clamp((depth - 160) / 95, 0, 1); if (fade < .01) continue;
      const s = focal / depth, cx = cl.x * s, cy = -cl.height * s, cw = cl.width * s * 1.2, ch = cw * CH / CW;
      if (cx + cw * .55 < -w * .9 || cx - cw * .55 > w * .9) continue;
      const fog = clamp((depth - 300) / 1300, 0, 1), sp = CL[cl.shape % CL.length], a = fade * (night ? .7 : .97);
      if (sun.vis && m.gold > .3 && Math.abs(cx - sun.x) < cw * .45 && sun.y > cy - ch * .8 && sun.y < cy + ch * .2) continue; // 해를 가리는 구름은 건너뜀
      c.globalAlpha = a; c.drawImage(sp.far, cx - cw / 2, cy - ch * .8, cw, ch);
      if (fog < .98) { c.globalAlpha = a * (1 - fog); c.drawImage(sp.near, cx - cw / 2, cy - ch * .8, cw, ch); }
    }
    c.globalAlpha = 1;
    // 7) 지평선 바로 위 옅은 안개(땅과 하늘의 이음새를 부드럽게)
    const hz = c.createLinearGradient(0, -h * .07, 0, 0); hz.addColorStop(0, css(m.fog, 0)); hz.addColorStop(1, css(m.fog, night ? .35 : .55));
    c.fillStyle = hz; c.fillRect(-w * 2, -h * .07, w * 4, h * .07);
    c.restore();
  };

  /* ---------- 먼 산: 겹겹이, 멀수록 옅게(대기 원근), 노을이면 능선 끝에 붉은 빛 ---------- */
  const RID = [0, 1, 2].map(k => { const a = [], n = 3 + k * 2, p1 = hash(k + 31) * 6.28, p2 = hash(k + 37) * 6.28, p3 = hash(k + 41) * 6.28;
    for (let i = 0; i <= 512; i++) { const t = i / 512 * Math.PI * 2; a.push(clamp(.5 + .5 * (.55 * Math.sin(t * n + p1) + .3 * Math.sin(t * n * 2.3 + p2) + .15 * Math.sin(t * n * 5.1 + p3)) + (fbm(i / 512 * 40, k * 7.3 + .5, 40, 3) - .5) * .12, 0, 1)); } return a; });
  X.horizon = function (c, w, h, night, quality, f) {
    if (night && preDone) return true;                                    // 밤에는 앞단(nightGround)에서 이미 그림
    const m = mood(night), hd = heading(), lift = clamp(1 - (F.alt || 0) / 1500, .3, 1), sun = sunScreen(w, h, m);
    const layers = [[.075, .5, m.ridge[0], 1], [.052, .75, m.ridge[1], 1], [.032, 1, m.ridge[2], 1]];
    c.save();
    layers.forEach(([hk, par, col, a], k) => {
      const span = w * 4, off = (((hd / FOV) * w * par) % span + span) % span, hh = h * hk * lift, ridge = RID[k], pts = [];
      for (let i = 0; i <= 120; i++) { const x = -w * 1.6 + i / 120 * w * 3.2, u = ((x + off) / span % 1 + 1) % 1, v = ridge[Math.floor(u * 512)]; const pk = v * v, open = sun.vis ? 1 - (1 - sstep(w * .12, w * .55, Math.abs(x - sun.x))) * clamp(m.gold * 1.4, 0, 1) : 1; pts.push([x, -hh * (.12 + pk * 1.1) * open]); }
      const top = Math.min(...pts.map(p => p[1]));
      const g = c.createLinearGradient(0, top, 0, 2);
      const c0 = mixc(col, m.fog, [.5, .28, .12][k]), c1 = mixc(col, m.fog, [.8, .6, .45][k]);
      g.addColorStop(0, css(c0)); g.addColorStop(1, css(c1));
      c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.moveTo(-w * 1.6, 2); for (const p of pts) c.lineTo(p[0], p[1]); c.lineTo(w * 1.6, 2); c.closePath(); c.fill();
      // 능선 끝 빛(해 쪽일수록 밝게)
      if (!night && quality !== 'balanced' && k > 0) {
        c.globalAlpha = a * lerp(.18, .6, m.gold); c.strokeStyle = css(mixc(m.low, m.sun, .5)); c.lineWidth = Math.max(1, w / 900);
        c.beginPath(); pts.forEach((p, i) => { const near = 1 - clamp(Math.abs(p[0] - sun.x) / (w * 1.2), 0, 1); if (near < .05) return; i ? c.lineTo(p[0], p[1] + .5) : c.moveTo(p[0], p[1] + .5); }); c.stroke();
      }
    });
    c.restore(); return true;
  };

  /* ---------- 들판 붓 터치 질감(원근에 맞춰 띠마다 크기를 바꿔 깖) ---------- */
  const GTEX = (() => {
    const W = 256, cv = document.createElement('canvas'); cv.width = cv.height = W; const x = cv.getContext('2d'), id = x.createImageData(W, W), d = id.data;
    for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) {
      const a = fbm(xx / 32, yy / 9, 8, 4), b = fbm(xx / 7 + 50, yy / 3, 36, 2), v = 128 + (a - .5) * 120 + (b - .5) * 50, k = (yy * W + xx) * 4;
      d[k] = d[k + 1] = d[k + 2] = clamp(v, 0, 255); d[k + 3] = 255;
    }
    x.putImageData(id, 0, 0); return cv;
  })();
  let gPat = null, rPat = null;
  // 잔물결: 가로로 짧은 밝고 어두운 붓질
  const RTEX = (() => {
    const W = 256, cv = document.createElement('canvas'); cv.width = cv.height = W; const x = cv.getContext('2d');
    for (let i = 0; i < 420; i++) {
      const px = hash(i + 1) * W, py = hash(i + 2) * W, len = 6 + hash(i + 3) * 22, lt = hash(i + 4) > .45;
      x.fillStyle = lt ? 'rgba(255,255,255,' + (.18 + hash(i + 5) * .3).toFixed(2) + ')' : 'rgba(0,10,30,' + (.12 + hash(i + 6) * .2).toFixed(2) + ')';
      for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) { x.beginPath(); x.ellipse(px + ox, py + oy, len / 2, .9 + hash(i + 7) * 1.1, 0, 0, Math.PI * 2); x.fill(); }
    }
    return cv;
  })();
  function slices(c, Hc, f, py, zn, zEnd, step, pat, scaleK, flow, draw) {
    let z = Math.max(zn, 2);
    while (z < zEnd) {
      const z2 = Math.min(zEnd, z * step + 3), zm = (z + z2) / 2, k = f / zm * scaleK, ky = k * Hc / zm * 1.5;
      pat.setTransform(new DOMMatrix([k, 0, 0, ky, 0, py(zm) - ((zm + flow) * 4 % 256) * ky]));
      draw(z, z2); z = z2;
    }
  }
  // 먼 바다: 지평선 앞에 굽은 해안선(방향을 틀면 해안 모양이 따라 바뀜). 노을이면 해 아래로 윤슬 길
  const coastZ = ang => 3400 + 900 * Math.sin(ang * 2.1 + 1) + 520 * Math.sin(ang * 5.3) + 240 * Math.sin(ang * 11 + 2);
  function drawSea(c, w, h, night, quality, g, m) {
    const hd = heading() * Math.PI / 180, pts = [];
    for (let i = 0; i <= 96; i++) { const x = -w * 2 + i / 96 * w * 4, y = g.py(coastZ(Math.atan(x / g.f) + hd)); pts.push([x, y]); }
    const sea = new Path2D(); sea.moveTo(-w * 2, -1); sea.lineTo(w * 2, -1); for (let i = pts.length - 1; i >= 0; i--) sea.lineTo(pts[i][0], pts[i][1]); sea.closePath();
    const ymax = Math.max(4, ...pts.map(p => p[1]));
    c.save();
    // 모래톱(해안선을 따라 밝은 띠)
    c.globalAlpha = night ? .5 : .85; c.strokeStyle = css(night ? m.sand : mixc(m.sand, m.hz, .35)); c.lineWidth = clamp(ymax * .06, 1, 5); c.lineJoin = 'round';
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    const sg = c.createLinearGradient(0, 0, 0, Math.max(ymax, h * .08));
    sg.addColorStop(0, css(night ? mixc(m.hz, m.water, .3) : m.hz)); sg.addColorStop(.35, css(night ? m.water : mixc(m.low, m.water, .25))); sg.addColorStop(1, css(night ? mixc(m.water, m.top, .5) : mixc(m.mid, m.water, .55)));
    c.globalAlpha = 1; c.fillStyle = sg; c.fill(sea); c.clip(sea);
    if (quality !== 'balanced' && window.DOMMatrix) {
      if (!rPat) try { rPat = c.createPattern(RTEX, 'repeat'); } catch (e) {}
      if (rPat && rPat.setTransform) { const t = idleT(); rPat.setTransform(new DOMMatrix([.9, 0, 0, .16, (-hd * 300 - t * 4) % 256, 0])); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = night ? .4 : .85; c.fillStyle = rPat; c.fillRect(-w * 2, 0, w * 4, ymax + 2); c.globalCompositeOperation = 'source-over'; }
    }
    const sun = sunScreen(w, h, m);
    if (sun.vis) {
      const t = idleT(), gk = lerp(.3, 1, m.gold), r = clamp(w * .022, 10, 26);
      c.globalCompositeOperation = 'lighter';
      const sh = c.createRadialGradient(sun.x, 0, 0, sun.x, 0, r * 7); sh.addColorStop(0, css(m.sun, .5 * gk)); sh.addColorStop(1, css(m.sun, 0));
      c.save(); c.translate(sun.x, 0); c.scale(1, Math.max(.25, ymax / (r * 7))); c.translate(-sun.x, 0); c.fillStyle = sh; c.fillRect(sun.x - r * 7, 0, r * 14, r * 7); c.restore();
      c.fillStyle = css(mixc(m.sun, m.low, .55));
      for (let i = 0; i < 90; i++) {
        const yy = Math.pow(hash(i + 1200), 1.3) * ymax, spread = r * (.6 + yy / Math.max(ymax, 1) * 2.2), xx = sun.x + (hash(i + 1250) - .5) * 2 * spread;
        const a = gk * Math.max(0, Math.sin(t * (1.8 + hash(i + 1300) * 3) + i * 2.1)) * .6; if (a < .04) continue;
        c.globalAlpha = a; const lw = 2 + hash(i + 1350) * (4 + yy * .2); c.fillRect(xx - lw / 2, yy, lw, Math.max(.7, yy * .03));
      }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore(); c.globalAlpha = 1;
  }
  X.afterCountry = function (c, w, h, night, quality, g) {
    const m = mood(night);
    if (!night && quality !== 'balanced' && window.DOMMatrix) {
      if (!gPat) try { gPat = c.createPattern(GTEX, 'repeat'); } catch (e) {}
      if (gPat && gPat.setTransform) {
        c.save(); c.globalCompositeOperation = 'soft-light';
        slices(c, g.Hc, g.f, g.py, g.zn, 9000, 1.22, gPat, .9, F.wz || 0, (z1, z2) => g.quad(-4200, 4200, z1, z2, gPat, .75));
        c.restore(); c.globalAlpha = 1;
      }
    }
    if (!(night && preDone)) drawSea(c, w, h, night, quality, g, m);
  };

  /* ---------- 강: 하늘을 비추는 물 + 잔물결 + 윤슬 ---------- */
  X.river = function (c, w, h, night, quality, g) {
    if (night) return false;                                              // 밤 강(달빛·가로등)은 1.59 그대로
    const m = mood(night), { zn, zEnd, py, px, wr, k, riverX } = g;
    const edge = half => { const L = [], R = []; for (let z = Math.max(zn, 2); z < zEnd; z = z * 1.07 + 6) { const X0 = riverX(z + wr), y = py(z); L.push([px(X0 - half, z), y]); R.push([px(X0 + half, z), y]); } return [L, R]; };
    const path = half => { const [L, R] = edge(half), p = new Path2D(); if (L.length < 2) return null; p.moveTo(L[0][0], L[0][1]); for (const q of L) p.lineTo(q[0], q[1]); for (let i = R.length - 1; i >= 0; i--) p.lineTo(R[i][0], R[i][1]); p.closePath(); return p; };
    const bank = path(112), water = path(78); if (!water) return true;
    c.save();
    c.globalAlpha = .7 * k; c.fillStyle = css(mixc(m.sand, m.fog, .15)); c.fill(bank);
    c.globalAlpha = .45 * k; c.fillStyle = css(mixc(m.sand, hex('#3d5a2c'), .45)); c.fill(path(96));           // 물가 풀·젖은 흙
    // 물: 먼 곳은 지평선빛, 가까울수록 위쪽 하늘빛(아래를 내려다보면 높은 하늘이 비침)
    const wg = c.createLinearGradient(0, 0, 0, h * .7);
    wg.addColorStop(0, css(m.hz)); wg.addColorStop(.12, css(m.low)); wg.addColorStop(.45, css(mixc(m.low, m.water, .55))); wg.addColorStop(1, css(mixc(m.mid, m.water, .7)));
    c.globalAlpha = .97 * k; c.fillStyle = wg; c.fill(water);
    c.clip(water);
    // 잔물결 붓결(원근)
    if (quality !== 'balanced' && window.DOMMatrix) {
      if (!rPat) try { rPat = c.createPattern(RTEX, 'repeat'); } catch (e) {}
      if (rPat && rPat.setTransform) {
        c.globalCompositeOperation = 'soft-light';
        const t = idleT();
        slices(c, g.Hc, g.f, py, zn, 6000, 1.25, rPat, .5, (F.wz || 0) * .55 + t * 6, (z1, z2) => { c.globalAlpha = .9 * k; c.fillStyle = rPat; c.fillRect(-w * 2, py(z2), w * 4, py(z1) - py(z2) + 1); });
        c.globalCompositeOperation = 'source-over';
      }
    }
    // 윤슬: 해 바로 아래로 길게 늘어선 반짝임(멀수록 촘촘·가늘게). 시각만으로 정해지는 깜빡임
    const sun = sunScreen(w, h, m);
    if (sun.vis) {
      const t = idleT(), flow = (F.wz || 0) * .55, gk = lerp(.35, 1, m.gold) * k;
      c.globalCompositeOperation = 'lighter'; c.fillStyle = css(m.sun);
      for (let i = 0; i < 140; i++) {
        const u = hash(i + 900), yy = Math.pow(u, 1.8) * h * .62 + 1, spread = (8 + yy * .55) * lerp(.7, 1.2, m.gold), xx = sun.x + (hash(i + 950) - .5) * 2 * spread * (.4 + hash(i + 990) * .6);
        const tw = Math.max(0, Math.sin(t * (2.2 + hash(i + 1010) * 3.5) + i * 1.7 + flow * .01)), a = gk * tw * clamp(1 - yy / (h * .62), .15, 1) * .75;
        if (a < .03) continue;
        c.globalAlpha = a; const lw = 2 + yy * .07 + hash(i + 1050) * 6; c.fillRect(xx - lw / 2, yy, lw, Math.max(.8, yy * .012));
      }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore(); c.globalAlpha = 1;
    return true;
  };

  /* ---------- 밤 땅: 달빛 받은 들판 + 가로등 켜진 도로 + 오가는 차 불빛 + 마을 불빛 + 강·바다 ----------
   *  (너무 캄캄하지 않게 들판·물빛을 은은히 밝힘) 순항 중에도 보이도록 장면 앞단에서 먼저 깔고, 그 위에 기존 도심 불빛·활주로가 그려짐 */
  const NFIELD = ['#1f2f2b', '#24332e', '#283830', '#1c2b28', '#2c3a34', '#222f30'].map(hex);
  const lampCache = {};
  function lamp(rgb) {
    if (lampCache[rgb]) return lampCache[rgb];
    const t = document.createElement('canvas'); t.width = t.height = 48; const g = t.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(255,250,235,1)'); gr.addColorStop(.12, 'rgba(' + rgb + ',.9)'); gr.addColorStop(.35, 'rgba(' + rgb + ',.28)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return (lampCache[rgb] = t);
  }
  const AMBER = '255,176,82', WARM = '255,222,165', COOL = '214,230,255', HEAD = '235,242,255', TAIL = '255,70,60';
  const ROADS_X = [-1310, 870, 2590], VIL_P = 3600;
  let preDone = false;
  function nightGround(c, w, h, quality) {
    const m = mood(true), hq = quality !== 'balanced', f = w * .79, Hc = 4 + (F.alt || 0), zn = Math.max(1.2, Hc * f / (h * 2.6)), wz = F.wz || 0, t = idleT();
    const py = Z => Hc * f / Z, px = (X, Z) => X * f / Z;
    const quad = (x1, x2, z1, z2, style, alpha) => {
      z1 = Math.max(z1, zn); z2 = Math.min(z2, 16000); if (z2 <= z1) return;
      const y1 = py(z1), y2 = py(z2); if (y1 - y2 < .25 && (x2 - x1) * f / z2 < .25) return;
      c.globalAlpha = alpha === undefined ? 1 : alpha; c.fillStyle = style;
      c.beginPath(); c.moveTo(px(x1, z1), y1); c.lineTo(px(x2, z1), y1); c.lineTo(px(x2, z2), y2); c.lineTo(px(x1, z2), y2); c.closePath(); c.fill();
    };
    const k = clamp(((F.alt || 0) - 40) / 110, 0, 1);
    c.save(); c.beginPath(); c.rect(-w * 2, 0, w * 4, h * 3); c.clip();
    // 바탕: 달빛 땅(멀수록 안개빛)
    const bg = c.createLinearGradient(0, 0, 0, h * .9); bg.addColorStop(0, css(mixc(m.fog, hex('#26342f'), .45))); bg.addColorStop(.25, css(hex('#1c2826'))); bg.addColorStop(1, css(hex('#121b1b')));
    c.globalAlpha = 1; c.fillStyle = bg; c.fillRect(-w * 2, 0, w * 4, h * 3);
    // 들판 조각보(낮 무늬를 달빛 색으로)
    const cell = 320, j0 = Math.floor((zn + wz) / cell);
    for (let j = j0; j < j0 + (hq ? 30 : 18); j++) { const z1 = j * cell - wz, z2 = z1 + cell; if (z1 > 11000) break;
      for (let i = -10; i < 10; i++) { const hs = Math.abs(Math.sin(i * 127.1 + j * 311.7) * 43758.5453) % 1; quad(i * cell + 5, (i + 1) * cell - 5, z1 + 5, z2 - 5, css(NFIELD[Math.floor(hs * NFIELD.length)]), .9); } }
    // 강(달빛 받은 물) — 강가 가로등은 아래 불빛 단계에서
    const wr = wz * G.RK, rX = G.riverX;
    if (k > .01) {
      const L = [], R = []; for (let z = Math.max(zn, 2); z < 9000; z = z * 1.07 + 6) { const X0 = rX(z + wr), y = py(z); L.push([px(X0 - 78, z), y]); R.push([px(X0 + 78, z), y]); }
      if (L.length > 1) { const p = new Path2D(); p.moveTo(L[0][0], L[0][1]); for (const q of L) p.lineTo(q[0], q[1]); for (let i = R.length - 1; i >= 0; i--) p.lineTo(R[i][0], R[i][1]); p.closePath();
        const g = c.createLinearGradient(0, 0, 0, h * .8); g.addColorStop(0, css(mixc(m.hz, m.water, .3))); g.addColorStop(.2, css(mixc(m.low, m.water, .5))); g.addColorStop(1, css(m.water));
        c.globalAlpha = .95 * k; c.fillStyle = g; c.fill(p); }
    }
    // 도로: 세로 3줄 + 가로 띠(낮과 같은 자리), 노면은 짙은 회색
    for (const rx of ROADS_X) quad(rx - 7, rx + 7, zn, 11000, '#3a3f45', .85);
    const hj0 = Math.floor((zn + wz) / 2240);
    for (let j = hj0; j < hj0 + 6; j++) { const z = j * 2240 - wz + 1100; quad(-3800, 3800, z - 6, z + 6, '#3a3f45', .8); }
    // 지평선 쪽 안개(밤에도 은은히)
    const fz = c.createLinearGradient(0, 0, 0, h * .1); fz.addColorStop(0, css(m.fog, .7)); fz.addColorStop(1, css(m.fog, 0)); c.globalAlpha = 1; c.fillStyle = fz; c.fillRect(-w * 2, 0, w * 4, h * .1);
    // 바다(해안선은 낮과 같은 모양)
    drawSea(c, w, h, true, quality, { f, Hc, zn, py, px }, m);
    c.restore();

    // ---- 불빛(더해지는 빛) ----
    c.save(); c.globalCompositeOperation = 'lighter';
    const dot = (X, Z, rgb, sizeM, a) => {
      if (Z < zn * 1.1 || Z > 12000) return; const x = px(X, Z); if (x < -w * 1.3 || x > w * 1.3) return;
      const y = py(Z), s = clamp(sizeM * f / Z, 1.4, 30), tw = Z > 1500 ? .82 + .18 * Math.sin(t * (2 + (X * 7.3 + Z) % 3) + X * .37 + Z * .11) : 1, fade = a * tw * clamp(1.3 - Z / 12000, .25, 1);
      c.globalAlpha = fade;
      if (s < 2.6) { c.fillStyle = 'rgb(' + rgb + ')'; c.fillRect(x - .7, y - .7, 1.4, 1.4); } else c.drawImage(lamp(rgb), x - s / 2, y - s / 2, s, s);
    };
    // 가로등: 도로 전체가 아니라 마을 근처·교차로 구간만 켜져 있고, 간격·색·밝기가 제각각
    const SEG = 420, s0 = Math.floor((zn + wz) / SEG);
    for (const rx of ROADS_X) for (let s = s0; s < s0 + 26; s++) {
      if (srand(s * 3.7 + rx * .01) < .42) continue;                       // 꺼진(불 없는) 구간
      const col = srand(s + rx) < .7 ? AMBER : COOL;
      for (let zw = s * SEG + srand(s + 9) * 40; zw < (s + 1) * SEG; zw += 38 + srand(zw * .13) * 30) {
        if (srand(zw * .71 + rx) < .12) continue; const z = zw - wz; dot(rx + (srand(zw) < .5 ? 9 : -9), z, col, 5 + srand(zw * 1.3) * 4, .5 + srand(zw * 2.1) * .45);
      }
    }
    for (let j = hj0; j < hj0 + 6; j++) { const zr = j * 2240 + 1100, z = zr - wz;
      for (let X = -3780; X <= 3780; X += 46 + srand(X * .37 + j) * 60) { if (srand(Math.floor(X / 380) * 5.1 + j) < .45) continue; dot(X, z + (srand(X + j) - .5) * 14, srand(X * .9 + j) < .75 ? AMBER : COOL, 5 + srand(X) * 3, .45 + srand(X * 1.7) * .45); } }
    // 마을·동네: 세상에 고정된 칸(700m)마다 있을 수도 없을 수도. 크기·밀도가 다르고 가운데가 촘촘, 가장자리는 듬성듬성,
    // 가운데서 뻗은 구불구불한 길을 따라 불빛 줄. 색은 나트륨등 주황·따뜻한 흰빛·차가운 LED가 섞임
    const CS = 700, zc0 = Math.floor((zn + wz) / CS), maxZ = hq ? 9500 : 6000;
    for (let j = zc0 + Math.ceil(maxZ / CS); j >= zc0; j--) for (let i = -9; i <= 9; i++) {
      const hs = srand(i * 91.7 + j * 13.3); if (hs > .5) continue;
      const big = Math.pow(srand(i * 7.1 + j * 3.9), 2.2), n = Math.round(6 + big * 90), cx = i * CS + (srand(i + j * 5.5) - .5) * CS * .7, cz = j * CS + (srand(i * 2.2 + j) - .5) * CS * .7;
      const zc = cz - wz; if (zc < zn * 1.2 || zc > maxZ + 400) continue;
      const far = zc > 5000, R = 90 + big * 330;
      if (big > .25 && k > .01) { // 큰 동네는 하늘로 번지는 옅은 빛
        const x = px(cx, zc), y = py(zc), RR = clamp(R * 2.2 * f / zc, 4, w * .4);
        if (Math.abs(x) < w * 1.3) { const hg = c.createRadialGradient(x, y, 0, x, y, RR); hg.addColorStop(0, 'rgba(255,180,105,' + (.15 * big).toFixed(3) + ')'); hg.addColorStop(1, 'rgba(255,180,105,0)');
          c.globalAlpha = 1; c.fillStyle = hg; c.save(); c.translate(x, y); c.scale(1, clamp(Hc / zc * 3, .12, 1)); c.translate(-x, -y); c.fillRect(x - RR, y - RR, RR * 2, RR * 2); c.restore(); }
      }
      for (let q = 0; q < n; q++) {
        if (far && q % 2) continue;
        const a = srand(q * 1.31 + hs * 97) * 6.283, r = R * Math.pow(srand(q * 2.17 + hs * 31), 1.6), sub = srand(q * .7 + hs) < .3 ? R * .6 : 0, sa = srand(Math.floor(q / 6) + hs * 13) * 6.283;
        const X = cx + Math.cos(a) * r + Math.cos(sa) * sub, Z = cz + Math.sin(a) * r * .8 + Math.sin(sa) * sub;
        const u = srand(q * 3.9 + hs * 7), col = u < .5 ? AMBER : u < .82 ? WARM : COOL;
        dot(X, Z - wz, col, 3 + srand(q + hs) * 4, .35 + srand(q * 5.3 + hs) * .6);
      }
      // 구불구불한 길 1~3개(가운데에서 바깥으로)
      const ns = 1 + Math.floor(srand(hs * 41) * (big > .3 ? 3 : 1.6));
      for (let s = 0; s < ns; s++) { let a = srand(s * 9.1 + hs * 3) * 6.283, X = cx, Z = cz; const len = 150 + srand(s + hs * 5) * (300 + big * 500);
        for (let d = 0; d < len; d += 30 + srand(d + s) * 25) { a += (srand(d * .3 + s + hs) - .5) * .5; X += Math.cos(a) * 34; Z += Math.sin(a) * 34; if (far && (d / 30 | 0) % 2) continue; if (srand(d + s * 3 + hs) < .15) continue; dot(X, Z - wz, srand(s + hs * 2) < .7 ? AMBER : COOL, 4 + srand(d) * 2, .45 + srand(d * 1.9 + s) * .4); } }
    }
    // 외딴집: 들판에 드문드문, 밝기·색 제각각
    for (let j = j0; j < j0 + (hq ? 26 : 14); j++) { const z1 = j * cell - wz; if (z1 > 9000) break;
      for (let i = -12; i < 12; i++) { const hs = srand(i * 13.1 + j * 7.7); if (hs > .3) continue; const nn = 1 + (hs < .08 ? 2 : 0);
        for (let q = 0; q < nn; q++) dot(i * cell + srand(i + j + q) * cell, z1 + srand(i * 3 + j + q) * cell, srand(i + q + j * 3) < .6 ? WARM : AMBER, 3 + srand(q + i) * 2, .3 + srand(i * j + q) * .5); } }
    // 오가는 차: 다가오는 전조등(흰빛) / 멀어지는 후미등(빨강) — 각자 제 속도로
    for (const rx of ROADS_X) for (let i = 0; i < 7; i++) {
      const sp = 14 + srand(i + rx) * 10, base = srand(i * 3.3 + rx) * 6000, zA = ((base - wz - t * sp) % 6000 + 6000) % 6000 + 60, zB = ((base * 1.7 - wz + t * sp) % 6000 + 6000) % 6000 + 60;
      dot(rx - 3.5 - .9, zA, HEAD, 4.5, .9); dot(rx - 3.5 + .9, zA, HEAD, 4.5, .9);
      dot(rx + 3.5 - .9, zB, TAIL, 3.2, .8); dot(rx + 3.5 + .9, zB, TAIL, 3.2, .8);
    }
    // 강가 가로등(물가를 따라 군데군데)
    if (k > .01) { const RS = 70, r0 = Math.floor((zn + wr) / RS);
      for (let n = r0; n < r0 + 120; n++) { const zw = n * RS, z = zw - wr; if (z > 8000) break; if (srand(Math.floor(n / 6) * 2.9) < .5 || srand(n * 1.3) < .2) continue; const side = srand(n * .7) < .5 ? -1 : 1; dot(rX(zw) + side * (88 + srand(n) * 14), z, AMBER, 5 + srand(n * 2) * 3, .5 + srand(n * 3) * .4); } }
    c.restore(); c.globalAlpha = 1;
    // 먼 산(밤 색)
    X.horizon(c, w, h, true, quality, f);
    preDone = true;
  }

  /* ---------- 땅 전체 빛 고르기: 지평선 안개 + 노을빛(먼 곳은 따뜻하게, 발밑은 보랏빛 그늘) ---------- */
  const oGround = sc.drawGround;
  sc.drawGround = function (c, w, h, night, speed, quality) {
    preDone = false;
    if (night && FL.active()) nightGround(c, w, h, quality);
    try { oGround.call(this, c, w, h, night, speed, quality); } finally { preDone = false; }
    if (!FL.active()) return;
    const m = mood(night);
    c.save(); c.beginPath(); c.rect(-w * 2, 0, w * 4, h * 3); c.clip();
    if (!night) {
      c.globalCompositeOperation = 'soft-light';
      const g = c.createLinearGradient(0, 0, 0, h * .9); g.addColorStop(0, css(m.grade, lerp(.35, .75, m.gold))); g.addColorStop(.5, css(mixc(m.grade, m.cSh, .5), lerp(.15, .45, m.gold))); g.addColorStop(1, css(m.cSh, lerp(.1, .5, m.gold)));
      c.fillStyle = g; c.fillRect(-w * 2, 0, w * 4, h * 3);
      c.globalCompositeOperation = 'source-over';
    }
    const fz = c.createLinearGradient(0, 0, 0, h * lerp(.1, .06, clamp((F.alt || 0) / 380, 0, 1)));
    fz.addColorStop(0, css(m.fog, night ? .45 : .75)); fz.addColorStop(1, css(m.fog, 0));
    c.fillStyle = fz; c.fillRect(-w * 2, 0, w * 4, h * .12);
    c.restore();
  };

  window.AmpSpecial = { get mood() { return M; }, clock, solarAt(t) { const l = loc(); return solar(new Date(t), l[0], l[1]); }, sun() { const c = document.querySelector('#pfdHost canvas'); return M && sunScreen(c.width, c.height, M); }, redraw() { mKey = ''; try { P.draw(); } catch (e) {} } };
})();
