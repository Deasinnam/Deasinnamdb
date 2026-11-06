const {run, assert} = require('./lib/harness.cjs');

// 1.32 폴드8 전용판: 보라색, 콕핏 스페셜 2로 시작, 외부(10:16)·내부(4:3) 화면 배치
run('Fold8 edition layout, same in-app colours', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('fold8: ' + e.message));
  await p.addInitScript(() => {
    window.AndroidBridge = {buildDevice: () => 'fold8'};
    if (!sessionStorage.getItem('f8')) { sessionStorage.setItem('f8', '1'); localStorage.clear(); }
  });
  for (const [w, h, name] of [[416, 657, 'cover'], [940, 705, 'inner'], [705, 940, 'inner portrait']]) {
    await p.setViewportSize({width: w, height: h});
    await p.goto(origin);
    await p.waitForTimeout(900);
    assert.equal(await p.evaluate(() => document.documentElement.dataset.fold), '1');
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_skin2') || '"carnival7"')), 'carnival7', 'Starts in cockpit special 2');
    assert.ok(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1), 'No sideways overflow on the ' + name + ' screen');
    const bs = await p.evaluate(() => ['clkNow', 'clkWx', 'clkCmp', 'clkBri'].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top)));
    assert.equal(new Set(bs).size, 1, 'Gauges in one row on the ' + name + ' screen');
    assert.equal(await p.locator('#gStyleBar').isVisible(), true, 'Design select on the ' + name + ' screen');
  }
  // 내부 화면 가로: 스피드미터와 플레이어가 나란히
  await p.setViewportSize({width: 940, height: 705}); await p.waitForTimeout(300);
  const g = await p.locator('#wGps').boundingBox(), m = await p.locator('#wMain').boundingBox();
  assert.ok(m.x > g.x + g.width - 4 && Math.abs(m.y - g.y) < 4, 'Speedometer and player side by side on the inner screen');
  // 앱 안 색은 일반판과 같음(보라색은 아이콘·실행 화면만)
  assert.ok(await p.evaluate(() => getComputedStyle(document.querySelector('#ckRail button.on')).boxShadow.includes('255, 195, 92')), 'Same amber accents as the standard app');
  await p.close();
  // 일반판은 그대로(보라색 아님)
  const q = await context.newPage();
  await q.addInitScript(() => { localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await q.goto(origin); await q.waitForTimeout(600);
  assert.equal(await q.evaluate(() => document.documentElement.dataset.fold), undefined);
  await q.close();
});
