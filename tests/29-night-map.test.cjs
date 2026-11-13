const {run, assert} = require('./lib/harness.cjs');

// 1.57 야간: 화면 밝기 20%(주간 되면 되돌림), 원형 지도 야간 필터(강줄기·강가 불빛), 항상 주간 지도 선택
run('Night: brightness 20%, river night map, day map option', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { if (!sessionStorage.getItem('n')) { sessionStorage.setItem('n', 1); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); localStorage.setItem('dna_scrBri', '70'); } });
  await p.setViewportSize({width: 900, height: 1000});
  await p.goto(origin); await p.waitForTimeout(1500);
  const theme = async t => { await p.evaluate(t => { const P = window.AmpPfd.panel; P.settings.theme = t; P.applyTheme(); }, t); await p.waitForTimeout(1300); };
  await theme('day');
  assert.equal(await p.evaluate(() => AmpBri.get()), 70, 'day keeps the chosen brightness');
  await theme('night');
  assert.equal(await p.evaluate(() => AmpBri.get()), 20, 'night sets 20%');
  await theme('day');
  assert.equal(await p.evaluate(() => AmpBri.get()), 70, 'back to day restores 70%');
  await theme('night');
  await p.evaluate(() => PfdMap.setStyle('normal')); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => PfdMap.look), 'night');
  assert.ok(await p.evaluate(() => !!document.getElementById('pmNightFx') && getComputedStyle(document.querySelector('.pfd-mini .pm-map')).filter.includes('pmNightFx')), 'night map uses the river filter');
  // 1.59 야간 계기에서 원형 지도 왼쪽 위 [☀ 주간 지도] 버튼으로 바로 주간 지도
  assert.equal(await p.locator('.pfd-mini .pm-sun').isVisible(), true, 'day-map quick button at night');
  await p.locator('.pfd-mini .pm-sun').click(); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => PfdMap.style), 'day');
  await p.locator('.pfd-mini .pm-sun').click(); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => PfdMap.style), 'normal');
  await p.evaluate(() => PfdMap.setStyle('day')); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => PfdMap.look), 'day', 'always-day map stays day at night');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#sPfdMapStyle option')].map(o => o.value)), ['gta', 'normal', 'day']);
  // 1.59 원형 지도 잘림: 창 크기가 바뀌면 지도 크기를 다시 잼
  await p.evaluate(() => PfdMap.set(true)); await p.waitForTimeout(1500);
  if (await p.evaluate(() => !!PfdMap.map)) {
    await p.setViewportSize({width: 600, height: 700}); await p.waitForTimeout(800); await p.setViewportSize({width: 900, height: 1000}); await p.waitForTimeout(1200);
    const sz = await p.evaluate(() => { const m = PfdMap.map, el = document.querySelector('.pfd-mini .pm-map'); return [m.getSize().x, el.clientWidth]; });
    assert.ok(Math.abs(sz[0] - sz[1]) <= 1, 'map size follows the ring: ' + sz);
  }
  await p.close();
});
