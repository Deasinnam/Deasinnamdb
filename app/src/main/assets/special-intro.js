/* 에어포스원(스페셜판) — 켤 때 여는 화면(약 8초, 화면을 누르면 건너뜀)
 *
 *  0.0s  노을빛이 번지고 속도선이 지나감(휙)
 *  0.4s  늑대 엠블럼: 면 조각들이 하나씩 튀어나와 맞물림(스프링) → 맞물리는 순간 '쿵' + 충격파, 눈에 불이 켜짐
 *  2.6s  "AIR FORCE ONE" 글자가 하나씩 떨어져 자리 잡고 "에어포스원"·날개 밑줄(딩—). 늑대 로고는 점으로 켜지고 5.3s부터 점으로 흩어짐
 *  3.8s  엠블럼에서 뻗어 나가는 항로 + 하는 일 세 가지(GPS 스피드미터 · PFD 비행 화면 · 마일리지 적립)가 차례로 뜸(톡)
 *  5.6s  활주로 등이 앞으로 달려오고 엔진이 돌기 시작(우우웅) → 7.2s 빛이 번지며 실제 PFD 활주로 화면으로 넘어감
 *
 * 그림·소리는 모두 코드로 만듦(그림 파일·녹음 없음). 늑대는 이 앱을 위해 그린 기하학 엠블럼.
 * 소리는 관제탑 소리 설정(atcSound)을 따름. 자동 시험(webdriver)에서는 건너뜀. 미리보기에서 강제로 보려면 window.__forceIntro=true
 */
(function () {
  'use strict';
  const special = document.documentElement.dataset.build === 'special' || /[?&#]special\b/.test(location.href);
  if (!special) return;
  if (navigator.webdriver && !window.__forceIntro) return;
  if (window.__noIntro) return;

  const TOTAL = 8.0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const outCubic = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  // 감쇠 스프링(살짝 넘쳤다가 자리 잡음): 0 → 1
  const spring = (t, w = 13, z = .42) => { if (t <= 0) return 0; const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + z * w / wd * Math.sin(wd * t)); };
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  // 노을 팔레트(스페셜 PFD와 같은 색)
  const NAVY = hex('#10142e'), INDIGO = hex('#1d2552'), VIOLET = hex('#4d4a83'), MAUVE = hex('#a3709f'), ROSE = hex('#d9929e'), PEACH = hex('#f2a273'), AMBER = hex('#ffd99a'), CREAM = hex('#fff3df');
  const RAMP = [hex('#191d44'), VIOLET, MAUVE, PEACH, AMBER];
  const tone = t => { t = clamp(t, 0, 1) * (RAMP.length - 1); const i = Math.min(RAMP.length - 2, Math.floor(t)); return mix(RAMP[i], RAMP[i + 1], t - i); };

  /* ---------- 늑대 로고(사용자 로고 special-logo.png)를 도트로: 점이 켜지며 나타나고, 점이 흩어지며 사라짐 ----------
   *  로고 그림을 격자로 줄여 칸마다 켜짐/꺼짐을 정함. 윤곽 칸은 더 밝게. 나타날 때는 가운데서 바깥으로, 사라질 때는 칸마다 제각각 위로 흩어짐 */
  let DOTS = null, GW = 66, GH = 72;
  const logo = new Image();
  logo.onload = () => {
    GH = Math.round(GW * logo.naturalHeight / logo.naturalWidth);
    const cvs = document.createElement('canvas'); cvs.width = GW; cvs.height = GH; const x = cvs.getContext('2d');
    x.drawImage(logo, 0, 0, GW, GH);
    let d; try { d = x.getImageData(0, 0, GW, GH).data; } catch (e) { return; }
    const on = (i, j) => i >= 0 && j >= 0 && i < GW && j < GH && d[(j * GW + i) * 4 + 3] > 110, out = [];
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      if (!on(i, j)) continue;
      const edge = !on(i - 1, j) || !on(i + 1, j) || !on(i, j - 1) || !on(i, j + 1);
      const r = Math.hypot(i / GW - .55, j / GH - .45);
      out.push({ i, j, b: edge ? 1 : .78 + hash(i * 7.1 + j * 3.3) * .12, d: .4 + r * 1.9 + hash(i * 3.7 + j * 9.1) * .25, o: 5.25 + hash(i * 5.3 + j * 1.9) * .9, dx: (hash(i + j * 7) - .5) * 2 });
    }
    DOTS = out;
  };
  logo.src = 'special-logo.png';
  /* ---------- 소리(Web Audio 합성) ---------- */
  let AC = null, master = null;
  const soundOn = () => { try { const v = localStorage.getItem('dna_atcSound'); return v === null ? true : JSON.parse(v) !== false; } catch (e) { return true; } };
  function audio() {
    if (AC || !soundOn()) return AC;
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .8; master.connect(AC.destination); } catch (e) { AC = null; }
    return AC;
  }
  let noiseBuf = null;
  function noise(sec) {
    if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const n = AC.createBufferSource(); n.buffer = noiseBuf; n.loop = sec > 2; return n;
  }
  const env = (t, peak, a, d) => { const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); g.connect(master); return g; };
  const SFX = {
    whoosh(t, dur = .9, f0 = 300, f1 = 3200, amp = .35) { const n = noise(dur + .1), f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur * .7); n.connect(f).connect(env(t, amp, dur * .45, dur * .55)); n.start(t); n.stop(t + dur + .1); },
    impact(t) {
      const o = AC.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(38, t + .7); o.connect(env(t, .7, .005, .9)); o.start(t); o.stop(t + 1);
      const n = noise(.5), lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(200, t + .4); n.connect(lp).connect(env(t, .4, .003, .45)); n.start(t); n.stop(t + .5);
    },
    chime(t) { [[659.3, 0], [987.8, .14], [1318.5, .3]].forEach(([fq, dt]) => [1, 2.01, 3.98].forEach((m, i) => { const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = fq * m; o.connect(env(t + dt, [.16, .05, .02][i], .006, 1.6 - i * .4)); o.start(t + dt); o.stop(t + dt + 1.8); })); },
    pop(t, f = 1100) { const o = AC.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + .06); o.connect(env(t, .14, .004, .12)); o.start(t); o.stop(t + .2); },
    tick(t) { const o = AC.createOscillator(); o.type = 'square'; o.frequency.value = 2400; const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; o.connect(bp).connect(env(t, .05, .002, .04)); o.start(t); o.stop(t + .06); },
    spool(t, dur) {
      const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(520, t + dur);
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(2600, t + dur);
      const g = AC.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .6); o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + dur + .7);
      const n = noise(dur + 1), lp2 = AC.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.setValueAtTime(200, t); lp2.frequency.exponentialRampToValueAtTime(1800, t + dur);
      const g2 = AC.createGain(); g2.gain.setValueAtTime(.0001, t); g2.gain.exponentialRampToValueAtTime(.22, t + dur); g2.gain.exponentialRampToValueAtTime(.0001, t + dur + .8); n.connect(lp2).connect(g2).connect(master); n.start(t); n.stop(t + dur + .9);
    }
  };
  // 시간표(초): 소리를 한 번에 예약
  function schedule() {
    const a = audio(); if (!a) return;
    const go = () => {
      const t0 = a.currentTime - elapsed();
      const at = s => t0 + s, cue = (s, fn) => { if (at(s) >= a.currentTime - .02) fn(Math.max(a.currentTime, at(s))); };
      cue(0.05, t => SFX.whoosh(t, 1.1, 200, 2600, .3));
      for (let k = 0; k < 14; k++) cue(0.4 + k * .1, t => SFX.tick(t));
      cue(2.3, t => SFX.impact(t));
      cue(2.7, t => SFX.whoosh(t, .5, 900, 4000, .16));
      cue(3.0, t => SFX.chime(t));
      [4.4, 4.75, 5.1].forEach((s, i) => cue(s, t => SFX.pop(t, 900 + i * 220)));
      cue(5.4, t => SFX.spool(t, 2.2));
      cue(7.1, t => SFX.whoosh(t, 1, 400, 5000, .3));
    };
    if (a.state === 'suspended') { a.resume().then(go, () => {}); } else go();
  }

  /* ---------- 화면 ---------- */
  const st = document.createElement('style');
  st.textContent = '#spIntro{position:fixed;inset:0;z-index:2147483000;background:#10142e;touch-action:none;cursor:pointer}#spIntro canvas{display:block;width:100%;height:100%}'
    + '#spIntro .skip{position:absolute;right:calc(14px + env(safe-area-inset-right));bottom:calc(14px + env(safe-area-inset-bottom));padding:8px 14px;border-radius:99px;font:600 13px "Noto Sans KR",sans-serif;color:#fff3df;background:rgba(16,20,46,.55);border:1px solid rgba(255,217,154,.35);opacity:.8}';
  document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'spIntro'; root.setAttribute('role', 'img'); root.setAttribute('aria-label', '에어포스원 여는 화면 — 누르면 건너뜀');
  const cv = document.createElement('canvas'); root.appendChild(cv);
  const skip = document.createElement('span'); skip.className = 'skip'; skip.textContent = '눌러서 건너뛰기'; root.appendChild(skip);
  document.body.appendChild(root);
  const c = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  function size() { DPR = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); c.setTransform(DPR, 0, 0, DPR, 0, 0); }
  size(); window.addEventListener('resize', size);

  const start = performance.now(); let endAt = TOTAL, closing = false, raf = 0;
  const elapsed = () => (performance.now() - start) / 1000;
  const STARS = Array.from({ length: 90 }, (_, i) => ({ x: hash(i), y: hash(i + 99) * .6, s: .5 + hash(i + 7) * 1.3, p: hash(i + 3) * 6.28 }));
  const STREAKS = Array.from({ length: 26 }, (_, i) => ({ y: .08 + hash(i + 300) * .84, l: .12 + hash(i + 330) * .3, v: .9 + hash(i + 360) * 1.6, d: hash(i + 390) * 1.2 }));

  function poly(pts, s, ox, oy) { c.beginPath(); pts.forEach(([x, y], i) => { const X = ox + x * s, Y = oy + y * s; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); }
  function text(str, x, y, font, color, spacing) {
    c.font = font; c.fillStyle = color; c.textBaseline = 'alphabetic';
    if (!spacing) { c.textAlign = 'center'; c.fillText(str, x, y); return; }
    c.textAlign = 'left'; const chars = [...str], ws = chars.map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
    let cx = x - tot / 2; chars.forEach((ch, i) => { c.fillText(ch, cx, y); cx += ws[i] + spacing; });
  }

  function frame() {
    const t = elapsed(), m = Math.min(W, H), cx = W / 2, cy = H * (W > H ? .36 : .34), R = m * (W > H ? .2 : .24);
    // 바탕: 남색에서 노을로 번짐
    const bloom = ease(t / 1.6);
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, rgba(NAVY, 1)); bg.addColorStop(.45, rgba(mix(NAVY, INDIGO, bloom), 1)); bg.addColorStop(.75, rgba(mix(NAVY, VIOLET, bloom), 1)); bg.addColorStop(1, rgba(mix(NAVY, MAUVE, bloom * .9), 1));
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const sun = c.createRadialGradient(cx, H * .98, 0, cx, H * .98, Math.max(W, H) * .75);
    sun.addColorStop(0, rgba(AMBER, .55 * bloom)); sun.addColorStop(.3, rgba(PEACH, .32 * bloom)); sun.addColorStop(.6, rgba(ROSE, .12 * bloom)); sun.addColorStop(1, rgba(ROSE, 0));
    c.fillStyle = sun; c.fillRect(0, 0, W, H);
    // 별
    for (const s of STARS) { c.globalAlpha = (.25 + .5 * Math.max(0, Math.sin(t * 2 + s.p))) * (1 - bloom * .5); c.fillStyle = '#e8eeff'; c.fillRect(s.x * W, s.y * H, s.s, s.s); }
    c.globalAlpha = 1;
    // 속도선(처음과 끝에 세게)
    const sk = Math.max(1 - clamp(t / 1.4, 0, 1), clamp((t - 5.3) / 1.2, 0, 1)) ;
    if (sk > .01) { c.lineCap = 'round';
      for (const s of STREAKS) { const p = ((t * s.v + s.d) % 1.4) / 1.4, x1 = W * (1.2 - p * 1.6), len = W * s.l; const g = c.createLinearGradient(x1, 0, x1 + len, 0); g.addColorStop(0, rgba(CREAM, 0)); g.addColorStop(1, rgba(AMBER, .55 * sk)); c.strokeStyle = g; c.lineWidth = 1 + s.v; c.beginPath(); c.moveTo(x1, s.y * H); c.lineTo(x1 + len, s.y * H); c.stroke(); } }

    // 활주로(5.6s~): 소실점으로부터 등이 달려옴
    const rw = ease((t - 5.4) / .9);
    if (rw > 0) {
      const vy = H * .5, f = H * .9, camH = 1.6, run = Math.max(0, t - 5.4);
      const gnd = c.createLinearGradient(0, vy, 0, H); gnd.addColorStop(0, rgba(mix(VIOLET, NAVY, .4), rw)); gnd.addColorStop(1, rgba(NAVY, rw)); c.fillStyle = gnd; c.fillRect(0, vy, W, H - vy);
      c.globalAlpha = rw; c.fillStyle = rgba(mix(INDIGO, NAVY, .5), 1); c.beginPath(); c.moveTo(cx - 2, vy); c.lineTo(cx + 2, vy); c.lineTo(cx + W * .9, H); c.lineTo(cx - W * .9, H); c.closePath(); c.fill();
      const speed = 6 + run * run * 22;
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 40; i++) {
        const z = ((i * 1.2 - run * speed) % 48 + 48) % 48 + .6, y = vy + camH * f / z, sx = 1.25 * f / z; if (y > H + 20) continue;
        const r = clamp(2.4 * f / z / 40, .8, 14), a = rw * clamp(1.3 - z / 48, .2, 1);
        for (const side of [-1, 1]) { const x = cx + side * sx; const g = c.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, rgba(i % 6 > 3 ? AMBER : CREAM, a)); g.addColorStop(1, rgba(PEACH, 0)); c.fillStyle = g; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
        if (i % 2 === 0) { c.fillStyle = rgba(CREAM, a * .8); const h2 = Math.max(1, .5 * f / z / 6); c.fillRect(cx - Math.max(.6, f / z * .05), y - h2, Math.max(1.2, f / z * .1), h2 * 2); }
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }

    // 엠블럼(0.4s~): 면 조각이 차례로 튀어나와 맞물림, 활주로가 오면 위로 올라가며 작아짐
    const lift = 0, es = 1, ey = cy, ea = 1 - ease((t - 6.3) / .4);
    if (t > .35 && ea > 0) {
      const s = R / 100 * es;
      c.save(); c.globalAlpha = ea;
      // 맞물리는 순간의 충격파
      const sw = t - 2.3; if (sw > 0 && sw < 1.2) { c.strokeStyle = rgba(AMBER, (1 - sw / 1.2) * .7); c.lineWidth = 3 * (1 - sw / 1.2) + .5; c.beginPath(); c.arc(cx, ey, R * (1 + sw * 1.6), 0, Math.PI * 2); c.stroke(); }
      // 뒤 빛 원
      const halo = c.createRadialGradient(cx, ey, R * .2, cx, ey, R * 1.6); halo.addColorStop(0, rgba(PEACH, .28 * ease((t - 1.6) / 1))); halo.addColorStop(1, rgba(PEACH, 0)); c.fillStyle = halo; c.fillRect(cx - R * 2, ey - R * 2, R * 4, R * 4);
      // 도트: 켜지는 순간 번쩍(1.6배) 했다가 제 밝기로 — 2.3s '쿵'에 한 번 더 번쩍 — 5.3s부터 점마다 위로 흩어지며 꺼짐
      if (DOTS) {
        const cs = R * 1.9 / GH * es, ds = cs * .8, x0 = cx - GW * cs / 2, y0 = ey - GH * cs / 2 - R * .05;
        const hit = Math.max(0, 1 - Math.abs(t - 2.32) / .18);
        for (const D of DOTS) {
          const lt = t - D.d; if (lt <= 0) continue;
          const q = clamp((t - D.o) / .45, 0, 1); if (q >= 1) continue;
          const flash = lt < .18 ? 1.6 - lt / .18 * .6 : 1, flick = .94 + .06 * Math.sin(t * 9 + D.i * 1.3 + D.j * .7);
          const b = clamp(D.b * flash * flick + hit * .5 + q * .6, 0, 1.6);
          const col = b > 1 ? mix(AMBER, CREAM, clamp(b - 1, 0, 1)) : mix(hex('#5a3c12'), hex('#ffcf3f'), b);
          const sz = ds * (1 - q * .6), px = x0 + D.i * cs + D.dx * q * cs * 6, py = y0 + D.j * cs - q * q * cs * 14;
          c.fillStyle = rgba(col, clamp(lt * 8, 0, 1) * (1 - q)); c.fillRect(px + (ds - sz) / 2, py + (ds - sz) / 2, sz, sz);
        }
      }
      c.restore();
    }

    // 글자(2.6s~): "AIR FORCE ONE" 한 글자씩 떨어져 자리 잡고, 아래 "에어포스원"
    const ta = 1 - ease((t - 5.45) / .6);
    if (t > 2.55 && ta > 0) {
      const ty = ey + R * 1.12 * es + m * .03, big = Math.max(24, m * .085) * es, sub = Math.max(14, m * .04) * es;
      c.save(); c.globalAlpha = ta;
      const eng = [...'AIR FORCE ONE'], EF = big => '900 ' + big + 'px "Montserrat","Barlow Condensed","Noto Sans KR",sans-serif', sp = big * .06;
      c.font = EF(big); const ew = eng.map(ch => c.measureText(ch).width), total = ew.reduce((a, b) => a + b, 0) + sp * (eng.length - 1);
      let x = cx - total / 2;
      eng.forEach((ch, i) => { const k = spring(t - 2.6 - i * .055, 14, .5), y = ty + (1 - k) * -big * 1.1; c.save(); c.translate(x + ew[i] / 2, y); c.rotate((1 - k) * .3); c.font = EF(big); c.textAlign = 'center';
        const g = c.createLinearGradient(0, -big, 0, 0); g.addColorStop(0, rgba(CREAM, 1)); g.addColorStop(1, rgba(AMBER, 1)); c.fillStyle = g; c.globalAlpha = ta * clamp((t - 2.6 - i * .055) * 5, 0, 1); c.fillText(ch, 0, 0); c.restore(); x += ew[i] + sp; });
      // 한글 이름(작게, 자간 넓게)
      const ka = clamp((t - 3.4) / .5, 0, 1);
      if (ka > 0) { c.globalAlpha = ta * ka; text('에어포스원', cx, ty + big * .78 + (1 - ka) * 8, '700 ' + sub + 'px "Noto Sans KR",sans-serif', rgba(PEACH, 1), sub * (.9 - ka * .4)); c.globalAlpha = ta; }
      // 날개 밑줄
      const u = outCubic((t - 3.35) / .7);
      if (u > 0) { const ux = cx - total / 2, uy = ty + big * .26, uw = total * u; c.globalAlpha = ta; const g = c.createLinearGradient(ux, 0, ux + total, 0); g.addColorStop(0, rgba(PEACH, 0)); g.addColorStop(.4, rgba(AMBER, .95)); g.addColorStop(1, rgba(ROSE, .2));
        c.fillStyle = g; c.beginPath(); c.moveTo(ux, uy); c.quadraticCurveTo(ux + uw * .55, uy - big * .1, ux + uw, uy - big * .2); c.lineTo(ux + uw, uy - big * .13); c.quadraticCurveTo(ux + uw * .5, uy + big * .02, ux, uy + big * .04); c.closePath(); c.fill(); }
      // 하는 일 세 가지(4.4s~)
      const pills = ['GPS 스피드미터', 'PFD 비행 화면', '마일리지 적립'], pf = Math.max(12, m * .034) * es;
      c.font = '700 ' + pf + 'px "Noto Sans KR",sans-serif';
      const pw = pills.map(p => c.measureText(p).width + pf * 1.6), ptot = pw.reduce((a, b) => a + b, 0) + pf * .8 * 2; let px = cx - ptot / 2; const py = ty + big * 1.45;
      pills.forEach((p, i) => { const k = spring(t - 4.4 - i * .35, 14, .5); if (k <= 0) { px += pw[i] + pf * .8; return; }
        c.save(); c.translate(px + pw[i] / 2, py); c.scale(k, k); c.globalAlpha = ta * clamp(k, 0, 1);
        const hgt = pf * 2; c.fillStyle = rgba(NAVY, .55); c.strokeStyle = rgba(AMBER, .55); c.lineWidth = 1; c.beginPath(); if (c.roundRect) c.roundRect(-pw[i] / 2, -hgt / 2, pw[i], hgt, hgt / 2); else c.rect(-pw[i] / 2, -hgt / 2, pw[i], hgt); c.fill(); c.stroke();
        c.fillStyle = rgba(CREAM, 1); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p, 0, 1); c.restore(); px += pw[i] + pf * .8; });
      c.restore();
    }
    // 항로(3.8s~): 엠블럼에서 바깥으로 뻗는 점선 호 + 비행기 점
    const ra = ease((t - 3.8) / .6) * (1 - ease((t - 5.8) / .6));
    if (ra > 0) {
      c.save(); c.globalAlpha = ra; c.setLineDash([4, 7]); c.lineWidth = 1.4;
      [[-1, -.35], [1, -.2], [-1, .25], [1, .4]].forEach(([dir, dy], i) => {
        const x0 = cx + dir * R * .9, y0 = ey + dy * R, x1 = cx + dir * W * .55, y1 = ey + dy * R * 2.2 - R * .6, qx = (x0 + x1) / 2, qy = Math.min(y0, y1) - R * .9;
        const p = outCubic((t - 3.8 - i * .12) / 1.3);
        c.strokeStyle = rgba(i % 2 ? AMBER : ROSE, .7); c.lineDashOffset = -t * 30; c.beginPath(); c.moveTo(x0, y0);
        const N = 30; for (let n = 1; n <= N * p; n++) { const u = n / N, bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * qx + u * u * x1, by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * qy + u * u * y1; c.lineTo(bx, by); } c.stroke();
        const u = p, bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * qx + u * u * x1, by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * qy + u * u * y1;
        c.setLineDash([]); c.fillStyle = rgba(CREAM, 1); c.beginPath(); c.arc(bx, by, 2.6, 0, Math.PI * 2); c.fill(); c.setLineDash([4, 7]);
      });
      c.restore();
    }
    // 끝: 빛이 번지며 실제 화면으로
    const fl = clamp((t - 7.0) / .45, 0, 1), out = clamp((t - (endAt - .55)) / .55, 0, 1);
    if (fl > 0) { c.fillStyle = rgba(mix(AMBER, CREAM, .5), Math.sin(fl * Math.PI) * .85); c.fillRect(0, 0, W, H); }
    root.style.opacity = String(1 - out);
    if (t < endAt) raf = requestAnimationFrame(frame); else finish();
  }
  function finish() {
    cancelAnimationFrame(raf); window.removeEventListener('resize', size); root.remove(); st.remove();
    try { if (AC) setTimeout(() => { try { AC.close(); } catch (e) {} }, 1500); } catch (e) {}
    try { window.pfd && window.pfd.draw(); } catch (e) {}
    window.AmpSpecialIntro = { done: true };
  }
  root.addEventListener('pointerdown', () => {
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    if (closing) return; closing = true; const t = elapsed(); endAt = Math.min(endAt, t + .55);
    try { if (master) master.gain.setTargetAtTime(.0001, AC.currentTime, .12); } catch (e) {}
  });
  window.AmpSpecialIntro = { done: false, get t() { return elapsed(); } };
  schedule();
  raf = requestAnimationFrame(frame);
})();
