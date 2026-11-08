const {run, assert} = require('./lib/harness.cjs');
const SHOT = process.env.SHOT_DIR;

// 1.42 차계부(기본 접힘, 연료별 소모품 교환 체크, 주유·충전 기록) + 황동 이퀄라이저(좁은 화면은 가로 넘김)
run('Car log checklist by fuel type, and brass equalizer', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('log: ' + e.message));
  await p.addInitScript(() => { if (!sessionStorage.getItem('lg')) { sessionStorage.setItem('lg', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 900});
  await p.goto(origin); await p.waitForTimeout(500);
  assert.ok(await p.evaluate(() => document.getElementById('wLog').classList.contains('collapsed')), 'Car log starts folded');
  assert.equal(await p.locator('#wLog .body').isVisible(), false);
  await p.evaluate(() => { const w = document.getElementById('wLog'); w.style.order = -1; });
  await p.locator('#wLog .wbtn[data-col]').click();
  assert.equal(await p.locator('#wLog .body').isVisible(), true, 'Opens on tap');
  // 휘발유 기본 항목
  let names = await p.locator('#logItems li b').allTextContents();
  assert.ok(names.some(n => /엔진오일/.test(n)) && names.some(n => /점화플러그/.test(n)), 'Gasoline items');
  await p.fill('#logOdo', '50000'); await p.locator('#logOdo').dispatchEvent('change');
  // 엔진오일 교환 체크 → 1만 km 남음
  const oil = p.locator('#logItems li[data-k="gas:oil"]');
  await oil.locator('input[type=checkbox]').check();
  assert.match(await oil.locator('.lst').textContent(), /10,000 km 남음/);
  // 1만 2천 km 더 달리면 → 교환 필요, 체크 자동 해제
  await p.evaluate(() => AmpLog.setOdo(62000));
  assert.match(await oil.locator('.lst').textContent(), /교환 필요/);
  assert.equal(await oil.locator('input[type=checkbox]').isChecked(), false);
  assert.match(await p.locator('#logSum').textContent(), /교환 필요/);
  // GPS 거리 자동 더하기
  await p.evaluate(() => { for (let i = 0; i < 20; i++) AmpLog.addDist(100); });
  assert.equal(await p.locator('#logOdo').inputValue(), '62002');
  // 경유 → 요소수·연료필터 / 전기차 → 고전압 배터리, 엔진오일 없음, 단위 kWh
  await p.selectOption('#logFuel', 'diesel');
  names = await p.locator('#logItems li b').allTextContents();
  assert.ok(names.some(n => /요소수/.test(n)) && names.some(n => /연료필터/.test(n)), 'Diesel items');
  await p.selectOption('#logFuel', 'ev');
  names = await p.locator('#logItems li b').allTextContents();
  assert.ok(names.some(n => /고전압/.test(n)) && !names.some(n => /엔진오일/.test(n)), 'EV items');
  assert.match(await p.locator('#logFillT').textContent(), /충전/);
  assert.match(await p.locator('#logAmtL').textContent(), /kWh/);
  // 충전 두 번 → 전비
  for (const [km, amt] of [[62002, 40], [62302, 50]]) { await p.fill('#logFillKm', String(km)); await p.fill('#logAmt', String(amt)); await p.fill('#logWon', '15000'); await p.locator('#logFillAdd').click(); }
  assert.match(await p.locator('#logEff').textContent(), /전비 6\.0 km\/kWh/);
  // 저장 유지
  await p.reload(); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => AmpLog.state.fuel), 'ev');
  assert.equal(await p.evaluate(() => AmpLog.state.fills.length), 2);
  await p.selectOption('#logFuel', 'gas').catch(() => {});
  if (SHOT) { await p.setViewportSize({width: 1036, height: 1900}); await p.evaluate(() => { const w = document.getElementById('wLog'); w.classList.remove('collapsed'); w.style.order = -1; w.scrollIntoView(); }); await p.waitForTimeout(200); await p.locator('#wLog').screenshot({path: SHOT + '/log.png'}); }
  await p.setViewportSize({width: 1036, height: 900});
  // 황동 EQ: 넓은 화면 11대역 한 줄, 좁은 화면은 가로 넘김
  await p.evaluate(() => { const w = document.getElementById('wEq'); w.classList.remove('collapsed'); w.style.order = -2; w.scrollIntoView(); }); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => { const w = document.getElementById('wEq'); return w.classList.contains('eqn') === (w.getBoundingClientRect().width < 480); }), true, 'Wide/narrow by width');
  console.log('eq width', await p.evaluate(() => document.getElementById('wEq').getBoundingClientRect().width));
  if (SHOT) await p.locator('#wEq').screenshot({path: SHOT + '/eqw.png'});
  await p.setViewportSize({width: 430, height: 900}); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => document.getElementById('wEq').classList.contains('eqn')), true, 'Narrow EQ scrolls sideways');
  assert.ok(await p.evaluate(() => { const g = document.getElementById('eqgrid'); return g.scrollWidth > g.clientWidth * 1.8; }), 'Bands wider than the view');
  if (SHOT) { await p.evaluate(() => document.getElementById('wEq').scrollIntoView()); await p.locator('#wEq').screenshot({path: SHOT + '/eqn.png'}); }
  // 1.43 계기 스킨: 기본 에어라인, 버튼으로 에어포스(HUD) ↔ 에어라인, 다시 열어도 유지
  await p.setViewportSize({width: 1036, height: 900});
  await p.evaluate(() => document.getElementById('wGps').scrollIntoView());
  const lk = p.locator('#pfdLookQuick');
  if (await lk.count()) {
    assert.equal((await lk.textContent()).trim(), '에어라인', 'Default instrument skin is airline');
    assert.equal(await p.evaluate(() => document.documentElement.getAttribute('data-pfdlook')), 'airline');
    await p.evaluate(() => document.getElementById('pfdLookQuick').click());
    assert.equal((await lk.textContent()).trim(), '에어포스');
    assert.equal(await p.evaluate(() => [document.documentElement.getAttribute('data-pfdlook'), AmpPfdLook.get()].join()), 'airforce,airforce');
    await p.reload(); await p.waitForTimeout(600);
    assert.equal(await p.evaluate(() => AmpPfdLook.get()), 'airforce', 'Choice is kept');
  } else assert.fail('Look button missing');
  await p.close();
});
