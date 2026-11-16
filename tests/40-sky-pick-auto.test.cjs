const {run, assert} = require('./lib/harness.cjs');

// 1.74 하늘(한낮 등)을 골라 두면 시계가 멈춰 낮·밤이 안 바뀌던 문제 — 다시 켜면 자동, 야간 밝기 10%
run('Picked sky does not survive restart; night brightness 10%', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); localStorage.setItem('dna_spSky', JSON.stringify('noon')); });
  await p.setViewportSize({width: 840, height: 900}); await p.goto(origin); await p.waitForFunction(() => window.AmpSpecialSky);
  assert.equal(await p.evaluate(() => AmpSpecialSky.mode), 'auto', 'saved sky pick is not restored');
  assert.equal(await p.evaluate(() => window.__spTime), undefined, 'clock is real time');
  await p.close();
});
