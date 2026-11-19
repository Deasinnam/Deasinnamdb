const {run, assert} = require('./lib/harness.cjs');

// 1.77 땅·바다도 진행 방향을 따라 옆으로(하늘·구름처럼): 오른쪽으로 돌면 땅이 왼쪽으로 밀리고, 곧게 달리면 천천히 가운데로
run('Ground and sea slide sideways with heading', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('g42: ' + e.message));
  await p.addInitScript(() => {
    window.__build = 'special';
    window.__fix = {fix: true, lat: 37.5, lon: 127, speed: 16, bearing: 90, azimuth: -1, alt: 133, acc: 4, satsUsed: 12, satsSeen: 20, ts: 1};
    window.AndroidBridge = {startGps: () => {}, stopGps: () => {}, gpsStatus: () => JSON.stringify(Object.assign({}, window.__fix, {ts: ++window.__fix.ts}))};
    localStorage.setItem('dna_skin2', JSON.stringify('carnival7'));
  });
  await p.setViewportSize({width: 1036, height: 1000}); await p.goto(origin);
  await p.waitForFunction(() => window.AmpFlight && window.AmpPfd);
  await p.locator('#ckRail button[data-f="gps"]').click();
  await p.evaluate(() => AmpTk.gpsStart());
  const tick = async () => { await p.waitForTimeout(320); await p.evaluate(() => AmpPfd.feed()); await p.waitForTimeout(120); await p.evaluate(() => AmpPfd.feed()); };
  await tick(); await p.evaluate(() => { AmpFlight.step(1, 30); AmpFlight.step(5, 40); AmpFlight.step(14, 60); });
  const F = () => p.evaluate(() => AmpFlight.geo.F.lo || 0);
  const a = await F();
  await p.evaluate(() => Object.assign(__fix, {bearing: 120})); await tick(); for (let i = 0; i < 6; i++) { await p.evaluate(() => { AmpPfd.feed(); AmpFlight.step(.3, 60); }); }
  const b = await F();
  assert.ok(b < a - 150, 'right turn pushes the ground left: ' + [a, b]);
  // 그림이 실제로 옆으로 옮겨짐
  const shot = () => p.evaluate(() => { pfd.draw(); const cv = document.querySelector('#pfdHost canvas'), x = cv.getContext('2d'), d = x.getImageData(0, Math.round(cv.height * .8), cv.width, 4).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] * (i % 997); return s; });
  await p.evaluate(() => { AmpFlight.geo.F.lo = 0; }); const s0 = await shot();
  await p.evaluate(() => { AmpFlight.geo.F.lo = 900; }); const s1 = await shot();
  assert.notEqual(s0, s1, 'ground moved');
  // 곧게 달리면 가운데로 돌아옴
  await p.evaluate(() => { AmpFlight.geo.F.lo = -1000; for (let i = 0; i < 20; i++) AmpFlight.step(1, 80); });
  assert.ok(Math.abs(await F()) < 700, 'recentres while driving straight');
  await p.close();
});
