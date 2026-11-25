const {run, assert} = require('./lib/harness.cjs');

// 1.88 택시 미터기(라디오 빠진 판): GPS로 달린 거리만큼 서울 중형택시 요금이 오름
run('Taxi meter counts Seoul fares from GPS distance', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => {
    window.__build = 'special'; window.__dist = 'noradio,airline,dsp';
    window.G = {fix: true, perm: true, enabled: true, provider: 'gps', speed: 0, bearing: 0, azimuth: 0, acc: 4, alt: 50, satsUsed: 12, satsSeen: 15, lat: 37.5, lon: 127.0, ts: 1000};
    window.AndroidBridge = {gpsStatus: () => JSON.stringify(G), startGps: () => {}, stopGps: () => {}, keepScreenOn: () => {}, buildKind: () => 'special', distFlags: () => 'noradio,airline,dsp'};
    // 낮 요금으로 고정
    const D = Date; window.Date = class extends D { constructor(...a) { if (a.length) super(...a); else { super(); this.setHours(14); } } static now() { return D.now(); } };
  });
  await p.setViewportSize({width: 900, height: 1000});
  await p.goto(origin); await p.waitForTimeout(1500);
  await p.click('#ckRail [data-f="radio"]'); await p.waitForTimeout(300);
  assert.equal(await p.locator('#wRadio .tx-fare').isVisible(), true);
  assert.equal(await p.locator('#wRadio .tx-fare').textContent(), '0');
  await p.click('#wRadio .tx-go');
  // 처음 한 번: 재미용(실제 요금 거래 금지) 안내를 확인해야 시작
  assert.equal(await p.locator('#wRadio .tx-ack').isVisible(), true, 'fun-only notice first');
  assert.ok((await p.locator('#wRadio .tx-ack').textContent()).includes('제81조'));
  assert.equal(await p.locator('#wRadio .tx-fare').textContent(), '0');
  await p.click('#wRadio .tx-ackok');
  assert.equal(await p.locator('#wRadio .tx-ack').isVisible(), false);
  assert.equal(await p.locator('#wRadio .tx-fare').textContent(), '4,800', 'day base fare');
  assert.ok((await p.locator('#wRadio .tx-warn').textContent()).includes('재미로만'));
  assert.equal(await p.evaluate(() => document.getElementById('wRadio').classList.contains('tx-going')), true, 'horse runs');
  // 108km/h(30m/s)로 약 2.1km 달리기(GPS 한 번 받을 때마다 1초씩)
  for (let i = 0; i < 70; i++) { await p.evaluate(() => { G.speed = 30; G.ts += 1000; G.lat += 30 / 111320; }); await p.waitForTimeout(260); }
  await p.waitForTimeout(300);
  await p.evaluate(() => AmpTaxi.pause());
  const st = await p.evaluate(() => AmpTaxi.state);
  assert.ok(st.km > 2.05 && st.km < 2.2, 'distance ' + st.km);
  assert.equal(st.fare, 4800 + 100 * Math.floor((st.km * 1000 - 1600) / 131), 'fare follows distance ' + JSON.stringify(st));
  const f0 = st.fare;
  await p.evaluate(() => { G.speed = 0; });
  await p.click('#wRadio .tx-stop');
  const paid = await p.locator('#wRadio .tx-fare').textContent();
  assert.equal(paid, (Math.round(f0 / 100) * 100).toLocaleString('ko-KR'));
  assert.equal(await p.evaluate(() => document.getElementById('wRadio').dataset.tx), 'paid');
  await p.click('#wRadio .tx-reset');
  assert.equal(await p.locator('#wRadio .tx-fare').textContent(), '0');
  assert.deepEqual(await p.evaluate(() => [AmpTaxi.rate(new Date(2026, 0, 1, 23, 30)).base, AmpTaxi.rate(new Date(2026, 0, 1, 22, 10)).step, AmpTaxi.rate(new Date(2026, 0, 1, 9)).base]), [6700, 120, 4800]);
});
