const {run, assert} = require('./lib/harness.cjs');

// 1.39 콕핏 PFD: 이륙→상승→순항→착륙 효과음 순서, 가속·감속·정차, 방향 359°→0°, 저속 방향 유지, GPS 끊김·복구, 시연 진입·종료
run('PFD flight phases, sounds, heading wrap, GPS loss and demo', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('pfd39: ' + e.message));
  await p.addInitScript(() => {
    window.__fix = {fix: true, lat: 37.5, lon: 127, speed: 0, bearing: -1, azimuth: -1, alt: 133, acc: 4, satsUsed: 12, satsSeen: 20, ts: 1};
    window.AndroidBridge = {startGps: () => {}, stopGps: () => {}, gpsStatus: () => JSON.stringify(Object.assign({}, window.__fix, {ts: ++window.__fix.ts}))};
    if (!sessionStorage.getItem('p39')) { sessionStorage.setItem('p39', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); }
  });
  await p.setViewportSize({width: 1036, height: 1000});
  await p.goto(origin);
  await p.waitForFunction(() => window.AmpFlight && window.AmpPfd);
  await p.evaluate(() => { window.__sfx = []; const o = AmpHost.sfx; AmpHost.sfx = (k, v) => { if (k !== 'roll') __sfx.push(k); o(k, v); }; AmpTk.gpsStart(); });
  const fix = (o) => p.evaluate(o => { Object.assign(__fix, o); }, o);
  const tick = async () => { await p.waitForTimeout(320); await p.evaluate(() => { AmpPfd.feed(); }); await p.waitForTimeout(120); await p.evaluate(() => AmpPfd.feed()); };
  const data = () => p.evaluate(() => ({h: pfd.data.headingDeg, dh: pfd.display.headingDeg, alt: pfd.data.altitudeM, valid: pfd.effective().valid, spd: pfd.data.speedKmh}));

  // 이륙 → 상승 → 순항 → 착륙: 단계마다 효과음
  await p.evaluate(() => { AmpFlight.step(1, 30); AmpFlight.step(5, 40); });
  assert.equal(await p.evaluate(() => AmpFlight.state.phase), 'climb');
  await p.evaluate(() => AmpFlight.step(14, 60));
  assert.equal(await p.evaluate(() => AmpFlight.state.phase), 'cruise');
  assert.equal(await p.locator('.flt-badge').textContent(), 'CRUISE · 순항');
  // 가속·감속·정차: 지면 흐름(vs)이 따라감
  await p.evaluate(() => AmpFlight.step(3, 100)); const fast = await p.evaluate(() => AmpFlight.state.vs);
  await p.evaluate(() => AmpFlight.step(3, 30)); const slow = await p.evaluate(() => AmpFlight.state.vs);
  await p.evaluate(() => AmpFlight.step(8, 0)); const stop = await p.evaluate(() => AmpFlight.state.vs);
  assert.ok(fast > 80 && slow < 50 && stop < 1, 'Ground flow follows speed ' + [fast, slow, stop]);
  assert.equal(await p.locator('.flt-badge').textContent(), '순항 중 · 정차');
  await p.locator('.flt-land').click();
  await p.evaluate(() => { AmpFlight.step(10, 70); AmpFlight.step(30, 0); });
  assert.equal(await p.evaluate(() => AmpFlight.state.phase), 'landed');
  const order = await p.evaluate(() => __sfx.filter(k => ['rollStart', 'liftoff', 'approach', 'touchdown', 'rollStop'].includes(k)));
  for (const k of ['rollStart', 'liftoff', 'approach', 'touchdown']) assert.ok(order.includes(k), 'Sound ' + k + ' ' + order);
  assert.ok(order.indexOf('rollStart') < order.indexOf('liftoff') && order.indexOf('liftoff') < order.indexOf('approach') && order.indexOf('approach') < order.indexOf('touchdown'), 'Sounds in flight order ' + order);
  assert.equal(order[order.length - 1], 'rollStop', 'Engine sound stops after arrival');

  // 방향 359° → 0°: 짧은 쪽으로 넘어가고 뱅크는 완만
  await fix({speed: 15, bearing: 359}); await tick();
  assert.equal((await data()).h, 359);
  await fix({bearing: 1}); await tick(); await p.waitForTimeout(150);
  const d1 = await data(); assert.equal(d1.h, 1);
  assert.ok(d1.dh > 350 || d1.dh < 10, 'Display heading wraps through north, not around: ' + d1.dh);
  assert.ok(Math.abs(await p.evaluate(() => AmpFlight.state.bank)) <= 6.6, 'Gentle bank');
  // 저속·정차: 흔들리는 방향값 대신 마지막 유효 방향 유지
  await fix({speed: .3, bearing: 200, azimuth: 120}); await tick();
  assert.equal((await data()).h, 1, 'Holds the last valid heading at low speed');
  // GPS 끊김 → 고도·속도 —, 복구 → 실제 GPS 고도
  await fix({fix: false}); await tick();
  let d = await data(); assert.equal(d.valid, false); assert.equal(d.alt, null, 'Altitude unknown while GPS is lost');
  await fix({fix: true, speed: 12, bearing: 90, alt: 129}); await tick();
  d = await data(); assert.equal(d.valid, true); assert.equal(d.alt, 129, 'Real GPS altitude after recovery'); assert.equal(d.h, 90);
  // 시연 모드 진입·종료
  await p.locator('.flt-sim').click();
  assert.equal(await p.evaluate(() => AmpFlight.state.sim), true);
  assert.equal(await p.evaluate(() => pfd.data.source), 'demo');
  await p.locator('.flt-sim').click();
  assert.equal(await p.evaluate(() => AmpFlight.state.sim), false);
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => pfd.data.source), 'gps', 'Back to real GPS after the demo');
  // 과속 카메라 경고는 그대로
  await p.evaluate(() => AmpCam.demo()); await p.waitForTimeout(300);
  assert.equal(await p.locator('#camSign').isVisible(), true);
  await p.close();
});
