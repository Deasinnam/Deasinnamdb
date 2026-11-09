const {run, assert} = require('./lib/harness.cjs');

// 1.52 플레이 출시 정리: 고를 수 있는 스킨은 오디오 스킨 7개 + 자동차 모드 + 대신남 에어라인, 예전 스킨은 대신남 에어라인으로
run('Store skins: retired skins hidden, airline rename, button colors', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('sk: ' + e.message));
  await p.addInitScript(() => { window.__allSkins = false; if (!sessionStorage.getItem('sk')) { sessionStorage.setItem('sk', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('tablet2')); } });
  await p.setViewportSize({width: 1036, height: 900});
  await p.goto(origin); await p.waitForTimeout(600);
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_skin2'))), 'carnival7', 'Retired skin moves to the airline skin');
  const opts = await p.evaluate(() => [...document.querySelectorAll('#skin option')].map(o => o.value + ':' + o.textContent));
  assert.deepEqual(opts.map(o => o.split(':')[0]), ['blue', 'amber', 'base', 'neon', 'ice', 'red', 'wood', 'carnival', 'carnival7']);
  assert.ok(opts.includes('carnival7:대신남 에어라인'));
  await p.locator('#skinBtn').click();
  const cols = await p.evaluate(() => [...document.querySelectorAll('#skinPickList .pill')].map(b => [b.dataset.k, getComputedStyle(b).backgroundImage]));
  for (const [k, bg] of cols) {
    if (['blue', 'amber', 'base', 'neon', 'ice', 'red', 'wood'].includes(k)) assert.match(bg, /rgb\(31, 63, 120\)/, k + ' dark blue ' + bg);
    if (k === 'carnival7') assert.match(bg, /rgb\(143, 211, 255\)/, 'airline sky blue ' + bg);
  }
  assert.equal(await p.locator('#skinPickList .pill[data-k="carnival7"]').textContent(), '대신남 에어라인');
  await p.close();
});
