const {run, assert} = require('./lib/harness.cjs');

// 1.73 주간·야간을 직접 골라 두어도 다음 해 짐·해 뜸에는 다시 자동으로(시간대가 저절로 안 바뀌던 문제)
run('Manual day/night returns to auto at the next sunset/sunrise', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'special'; window.__spTime = new Date('2026-11-15T12:00:00+09:00').getTime(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 840, height: 900}); await p.goto(origin); await p.waitForFunction(() => window.AmpPfd && AmpPfd.panel);
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(800);
  await p.evaluate(() => AmpPfd.setTheme('day'));
  assert.equal(await p.evaluate(() => AmpPfd.theme), 'day');
  await p.evaluate(() => AmpApplyTheme()); // 낮인 동안은 고른 대로
  assert.equal(await p.evaluate(() => AmpPfd.theme), 'day');
  await p.evaluate(() => { window.__spTime = new Date('2026-11-15T21:00:00+09:00').getTime(); AmpApplyTheme(); });
  assert.equal(await p.evaluate(() => AmpPfd.theme), 'auto', 'back to auto after sunset');
  assert.equal(await p.evaluate(() => AmpPfd.panel.settings.theme), 'night', 'and the instrument turns to night');
  await p.close();
});
