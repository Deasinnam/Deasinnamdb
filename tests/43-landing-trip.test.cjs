const {run, assert} = require('./lib/harness.cjs');

// 1.78 이륙→주행→착륙하면 평균 속도와 운전 평점을 글자로(상자 없이), 다음 출발하면 사라짐
run('Landing shows average speed and driving score', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 1036, height: 1000}); await p.goto(origin); await p.waitForFunction(() => window.AmpFlight && window.PfdTrip);
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(500);
  // 이륙 활주 → 순항 60km/h → 급가속 한 번(60→100 1초) → 착륙
  await p.evaluate(() => { AmpFlight.step(1, 30); AmpFlight.step(5, 40); AmpFlight.step(60, 60); AmpFlight.step(1.2, 100); AmpFlight.step(20, 100); AmpFlight.step(30, 60); });
  await p.locator('.flt-land').click();
  await p.evaluate(() => { AmpFlight.step(10, 60); AmpFlight.step(30, 0); PfdTrip.tick(); });
  assert.equal(await p.evaluate(() => AmpFlight.state.phase), 'landed');
  const tr = await p.evaluate(() => AmpFlight.state.trip);
  assert.ok(tr && tr.avg > 30 && tr.avg < 90, 'average ' + JSON.stringify(tr));
  assert.ok(tr.acc >= 1, 'jumps counted ' + JSON.stringify(tr)); assert.equal(tr.score, 100 - tr.acc * 4 - tr.brk * 5);
  const r = await p.evaluate(() => { const e = document.querySelector('#pfdHost .pfd-trip'), cs = getComputedStyle(e); return {t: e.textContent, hid: e.hidden, bg: cs.backgroundColor, col: cs.color}; });
  assert.ok(!r.hid); assert.match(r.t, /평균 속도 \d+ km\/h/); assert.ok(r.t.includes('운전 평점 ' + tr.score + '점 · ' + tr.grade), r.t);
  assert.equal(r.bg, 'rgba(0, 0, 0, 0)', 'no box'); assert.equal(r.col, 'rgb(109, 255, 122)');
  await p.evaluate(() => { AmpFlight.step(2, 20); PfdTrip.tick(); });
  assert.equal(await p.evaluate(() => document.querySelector('#pfdHost .pfd-trip').hidden), true, 'hidden on next departure');
  await p.close();
});
