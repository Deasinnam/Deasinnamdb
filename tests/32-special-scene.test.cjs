const {run, assert} = require('./lib/harness.cjs');

// 1.62 대신남 원 스페셜: 스페셜판에서만 지브리풍 PFD 풍경(노을 하늘·뭉게구름·먼 바다 윤슬·들판 질감)이 켜지고, 다른 앱은 그대로
// 장면은 실제 해 높이(날짜·시각·위치)를 따름 — 시험은 2026-11-13 서울(일몰 약 17:20) 고정 시각으로
run('Special edition: painted PFD scenery only in the special app', async ({newPage, origin}) => {
  const open = async (kind, hm, hdg) => {
    const time = new Date('2026-11-13T' + hm + ':00+09:00').getTime();
    const p = await newPage((a) => {
      window.__build = a.kind; window.__spTime = a.time; localStorage.setItem('dna_skin2', JSON.stringify('carnival7'));
      window.__fix = {fix: true, lat: 37.5, lon: 127, speed: 22, bearing: a.hdg, azimuth: -1, alt: 133, acc: 4, satsUsed: 12, satsSeen: 20, ts: 1};
      window.AndroidBridge = {buildKind: () => a.kind, startGps() {}, stopGps() {}, gpsStatus: () => JSON.stringify(Object.assign({}, window.__fix, {ts: ++window.__fix.ts}))};
    }, {kind, time, hdg});
    await p.setViewportSize({width: 1036, height: 1000});
    await p.goto(origin);
    await p.waitForFunction(() => window.AmpFlight && window.AmpPfd);
    await p.evaluate(() => { window.AmpApplyTheme && AmpApplyTheme(); AmpTk.gpsStart(); AmpFlight.step(1, 30); AmpFlight.step(5, 40); AmpFlight.step(16, 80); AmpPfd.feed(); });
    await p.waitForTimeout(700); await p.evaluate(() => AmpPfd.feed()); await p.waitForTimeout(500);
    return p;
  };
  // 그린 화면에서 지평선 기준 색 뽑기(지평선 위 하늘, 해 쪽 바다)
  const sample = p => p.evaluate(() => {
    pfd.draw(); const cv = document.querySelector('#pfdHost canvas'), x = cv.getContext('2d'), px = (fx, fy) => [...x.getImageData(cv.width * fx | 0, cv.height * fy | 0, 1, 1).data].slice(0, 3);
    return {skyHi: px(.5, .2), skyLow: px(.62, .45)};
  });

  // 스페셜·노을·서쪽: 하늘이 따뜻한 색, 해·윤슬 계산이 화면 안
  let p = await open('special', '16:55', 245);
  assert.equal(await p.evaluate(() => document.documentElement.dataset.special), '1');
  assert.equal(await p.evaluate(() => document.documentElement.dataset.app), 'one', 'special keeps the car-app setup');
  const m = await p.evaluate(() => ({gold: AmpSpecial.mood.gold, sun: AmpSpecial.sun(), phase: AmpFlight.state.phase}));
  assert.equal(m.phase, 'cruise');
  assert.ok(m.gold > .9, 'golden hour at 16:55: ' + m.gold);
  assert.equal(await p.evaluate(() => pfd.day), true, 'still day before sunset');
  assert.ok(m.sun.vis && Math.abs(m.sun.x) < 120 && m.sun.y < 0, 'low sun ahead when heading west: ' + JSON.stringify(m.sun));
  const s = await sample(p);
  assert.ok(s.skyLow[0] > s.skyLow[2] + 25, 'warm sunset sky near the horizon: ' + s.skyLow);
  // 한 번 그리는 데 드는 시간(구름 색 입히기는 시각이 바뀔 때만)
  const ms = await p.evaluate(() => { const t0 = performance.now(); for (let i = 0; i < 20; i++) pfd.draw(); return (performance.now() - t0) / 20; });
  assert.ok(ms < 45, 'draws fast: ' + ms.toFixed(1) + 'ms');
  // 해가 정면을 지나 좌우로 오가도 색을 다시 입히지 않음(양쪽 다 미리 만들어 둠)
  await p.evaluate(() => { const o = pfd.display.headingDeg; for (const d of [-3, 3, -3, 3]) { pfd.display.headingDeg = o + d; pfd.draw(); } pfd.display.headingDeg = o; });
  const ms2 = await p.evaluate(() => { const o = pfd.display.headingDeg, t0 = performance.now(); for (let i = 0; i < 20; i++) { pfd.display.headingDeg = o + (i % 2 ? 3 : -3); pfd.draw(); } pfd.display.headingDeg = o; return (performance.now() - t0) / 20; });
  assert.ok(ms2 < 45, 'no re-tint when the sun crosses the centre: ' + ms2.toFixed(1) + 'ms');
  // 1.62.1 마일리지: 실제 GPS로 달리면 쌓이고(저장), 화면에 '대신남 마일리지' 칩
  const m0 = await p.evaluate(() => AmpSpecial.miles);
  await p.evaluate(() => { const t0 = Date.now(); window.__milesTick = setInterval(() => AmpPfd.feed(), 200); });
  await p.waitForTimeout(3300);
  const mi = await p.evaluate(() => ({ m: AmpSpecial.miles, chip: document.querySelector('.sp-miles') && document.querySelector('.sp-miles').textContent, src: pfd.data.source, v: pfd.data.speedKmh }));
  assert.ok(mi.m > m0, 'miles accrue while driving with GPS: ' + JSON.stringify([m0, mi]));
  assert.ok(/대신남 마일리지/.test(mi.chip) && /마일/.test(mi.chip), 'mileage chip shown: ' + mi.chip);
  await p.close();

  // 1.62.1 새벽: 아침 쪽 해(방위 < 180°)면 구름을 적게
  p = await open('special', '06:58', 110);
  assert.equal(await p.evaluate(() => AmpSpecial.mood.morning), true, 'dawn is morning');
  await p.close();

  // 스페셜·한낮: 파란 하늘
  p = await open('special', '12:20', 180);
  const d = await sample(p);
  assert.ok(d.skyHi[2] > d.skyHi[0] + 40, 'blue midday sky: ' + d.skyHi);
  assert.ok((await p.evaluate(() => AmpSpecial.mood.gold)) < .05);
  await p.close();

  // 해가 수평선 아래로: 17:35 푸른 시간(아직 주간 테마, 해 원반은 안 보임) → 18:00 자동으로 밤
  p = await open('special', '17:35', 250);
  const tw = await p.evaluate(() => ({day: pfd.day, tw: AmpSpecial.mood.tw, vis: AmpSpecial.sun().vis, el: AmpSpecial.mood.el}));
  assert.ok(tw.day && tw.tw > .5 && !tw.vis && tw.el < 0, 'blue hour after sunset: ' + JSON.stringify(tw));
  await p.close();

  // 스페셜·밤: 남색 하늘(너무 캄캄하지 않게), 땅에 도로·마을 불빛, 화면 밝기 35%
  p = await open('special', '21:30', 20);
  assert.equal(await p.evaluate(() => pfd.day), false, 'auto night from the sun');
  const n = await sample(p);
  assert.ok(n.skyHi[2] > n.skyHi[0] && n.skyHi[2] > 40 && n.skyHi[0] < 90, 'night sky navy, not black: ' + n.skyHi);
  const g = await p.evaluate(() => { pfd.draw(); const cv = document.querySelector('#pfdHost canvas'), x = cv.getContext('2d'), d = x.getImageData(0, cv.height * .58 | 0, cv.width, cv.height * .3 | 0).data;
    let sum = 0, lit = 0, n = 0; for (let i = 0; i < d.length; i += 16) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; sum += v; n++; if (d[i] > 200 && d[i + 1] > 150) lit++; } return {avg: sum / n, lit}; });
  assert.ok(g.avg > 18, 'moonlit ground is not pitch black: ' + g.avg.toFixed(1));
  assert.ok(g.lit > 8, 'road and town lights on the ground: ' + g.lit);
  await p.waitForTimeout(1300);
  assert.equal(await p.evaluate(() => AmpBri.get()), 35, 'special night brightness 35%');
  await p.close();

  // 다른 앱(대신남 원): 스페셜 풍경이 켜지지 않음
  p = await open('one', '16:55', 245);
  assert.deepEqual(await p.evaluate(() => [document.documentElement.dataset.special, typeof window.AmpSpecial]), [undefined, 'undefined']);
  await p.close();
});
