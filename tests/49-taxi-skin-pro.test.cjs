const {run, assert} = require('./lib/harness.cjs');

// 1.89 택시 미터기 '실물 전자식' 스킨: 고르기 저장, 운행 중 바꿔도 상태 유지, 여섯 자리 요금 겹침 없음, 말 정차→출발→주행→정차
run('Taxi meter: real electronic skin', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => {
    window.__build = 'special'; window.__dist = 'noradio,airline,dsp';
    if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('dna_taxiAck', 'true'); }
  });
  await p.setViewportSize({width: 1280, height: 760});
  await p.goto(origin); await p.waitForTimeout(1500);
  await p.click('#ckRail [data-f="radio"]'); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => AmpTaxi.skin), 'pro', 'default skin is the real electronic one');
  assert.equal(await p.locator('#wRadio .tx-pad2, #wRadio .tx-pad, #wRadio .tx-pk').count(), 0, '1.93: no electronic-taximeter keypads');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#wRadio .tx-dev .tx-keys .tx-k')].map(b => b.textContent)), ['빈차', '주행', '할증', '복합', '지불']);
  // 운행 시작 후 스킨을 바꿔도 금액·상태 그대로
  await p.click('#wRadio .tx-go');
  const before = await p.evaluate(() => [AmpTaxi.state.fare, AmpTaxi.state.on, document.querySelector('#wRadio .tx-fare').textContent]);
  await p.locator('#wRadio .tx-skinsel').selectOption('lcd'); await p.waitForTimeout(200);
  assert.deepEqual(await p.evaluate(() => [AmpTaxi.state.fare, AmpTaxi.state.on, document.querySelector('#wRadio .tx-fare').textContent]), before);
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.dna_taxiSkin)), 'lcd', 'saved');
  await p.evaluate(() => AmpTaxi.setSkin('pro')); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => document.querySelector('#wRadio .tx-go').classList.contains('on')), true, 'selected state stays');
  await p.reload(); await p.waitForTimeout(1500); await p.click('#ckRail [data-f="radio"]'); await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(() => [AmpTaxi.skin, AmpTaxi.state.on, AmpTaxi.state.fare]), ['pro', true, before[0]], 'skin and trip survive reload');
  // 여섯 자리 요금: 숫자가 말·'원'과 겹치지 않음
  for (const fare of [7500, 123456]) {
    await p.evaluate(f => AmpTaxi._preview({fare: f, spd: 32, km: 2.61, time: '15:46', next: 87}), fare); await p.waitForTimeout(150);
    const g = await p.evaluate(() => { const f = document.querySelector('#wRadio .tx-fare'), rg = document.createRange(); rg.selectNodeContents(f); const t = rg.getBoundingClientRect();
      return {L: t.left, R: t.right, horse: document.querySelector('#wRadio .tx-hcv').getBoundingClientRect().right, won: document.querySelector('#wRadio .tx-won').getBoundingClientRect().left, clip: f.scrollWidth > f.clientWidth + 1}; });
    assert.ok(g.L > g.horse && g.R <= g.won && !g.clip, fare + ' fits ' + JSON.stringify(g));
  }
  await p.evaluate(() => AmpTaxi._preview(null));
  // 말: 정차(GPS 흔들림)엔 서 있고, 출발하면 보폭이 커지고, 멈추면 다시 섬
  const seq = await p.evaluate(() => { const h = TaxiHorseTest(document.createElement('canvas')); let T = 1000, out = {};
    const run = (sec, v, on = true) => { for (let i = 0; i < sec * 30; i++) { h.set(on, typeof v === 'function' ? v(i / 30) : v); h._step(T); T += 1000 / 30; } return h.state; };
    out.idle = run(3, 0, false); out.start = run(2, 0); out.inplace = run(6, 0); out.cruise = run(10, 60); out.stop = run(6, 0, false);
    out.feet = [0, .06, .12, .18, .25, .31, .37, .43, .5, .56, .62, .68, .75, .81, .87, .93].map(ph => h.footDown(ph, 1).filter(Boolean).length);
    out.stand = h.footDown(.5, 0); return out; });
  assert.ok(!seq.idle.moving && seq.idle.amp === 0, 'vacant: stands');
  assert.ok(seq.start.moving && seq.start.amp < 0.5, 'starts with a short stride ' + JSON.stringify(seq.start));
  assert.ok(seq.inplace.moving && seq.inplace.amp > 0.45, '1.93: gallops in place while running at 0 km/h ' + JSON.stringify(seq.inplace));
  assert.ok(seq.cruise.amp > 0.9, 'full stride at speed');
  assert.ok(!seq.stop.moving && seq.stop.amp === 0, 'stands again');
  assert.ok(seq.feet.includes(0), 'airborne gathered phase exists ' + seq.feet);
  assert.ok(seq.feet.every(n => n <= 2), 'never more than two feet down in the gallop');
  assert.equal(seq.stand.length, 4);
});
