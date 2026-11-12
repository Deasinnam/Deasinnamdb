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
  await p.evaluate(() => PfdMap.setStyle('day')); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => PfdMap.look), 'day', 'always-day map stays day at night');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#sPfdMapStyle option')].map(o => o.value)), ['gta', 'normal', 'day']);
  await p.close();
});
