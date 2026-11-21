const {run, assert} = require('./lib/harness.cjs');

// 1.86 출시판 '대신남 스피드미터'(airdist full = noradio,airline,dsp): 스킨은 에어라인 하나, 이름은 대신남 그대로
run('Release build: Daesinnam Speedometer has only the airline skin', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { window.__build = 'special'; window.__dist = 'noradio,airline,dsp'; if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival8')); } });
  await p.setViewportSize({width: 900, height: 1000});
  await p.goto(origin); await p.waitForTimeout(1800);
  const r = await p.evaluate(() => ({
    sk: [...document.querySelectorAll('#gStyleBar optgroup:first-child option')].map(o => o.value + '=' + o.textContent),
    skin: document.getElementById('skin').value, sk3d: document.documentElement.hasAttribute('data-sk3d'),
    skinOpts: [...document.querySelectorAll('#skin option')].map(o => o.value),
    renamed: document.body.innerText.includes('에어포스원 에어라인')}));
  assert.deepEqual(r.sk, ['sk:carnival7=대신남 에어라인'], 'only the airline skin, not renamed');
  assert.equal(r.skin, 'carnival7', 'stored 3D map falls back to airline');
  assert.equal(r.sk3d, false);
  assert.deepEqual(r.skinOpts, ['carnival7']);
  assert.equal(r.renamed, false);
  await p.evaluate(() => AmpGuide.open('ext'));
  const t = await p.locator('#guide').textContent();
  assert.ok(t.includes('대신남 스피드미터') && !t.includes('3D 맵'), 'guide uses the release name and no 3D map');
  assert.ok(await p.evaluate(() => document.querySelector('#guide .gd-m img').src.includes('g-ext-d.jpg')));
  await p.evaluate(() => AmpGuide.open('skin'));
  assert.ok(!(await p.locator('#guide').textContent()).includes('자동차 모드'));
  await p.evaluate(() => AmpGuide.open('cam'));
  assert.equal(await p.locator('#guide video').count(), 1, 'no 3D map clip');
});
