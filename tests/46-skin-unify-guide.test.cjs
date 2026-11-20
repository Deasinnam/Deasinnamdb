const {run, assert} = require('./lib/harness.cjs');

// 1.85 대신남 원 계열: 위 [스킨] 버튼 대신 스피드미터 고르기에 활주로 스킨 3종 + [초기 세팅 방법] 설명서
run('One apps: skins in the speedometer picker, setup guide', async ({context, origin, errors}) => {
  for (const dist of ['noradio', 'noradio,lite']) {
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(dist + ': ' + e.message));
    await p.addInitScript(d => { window.__build = 'special'; window.__dist = d; if (sessionStorage.getItem('d') !== d) { sessionStorage.setItem('d', d); localStorage.clear(); } }, dist);
    await p.setViewportSize({width: 900, height: 1000});
    await p.goto(origin); await p.waitForTimeout(1500);
    assert.equal(await p.locator('#skinBtn').isVisible(), false, 'skin button removed');
    const opts = await p.evaluate(() => [...document.querySelectorAll('#gStyleBar option')].map(o => o.value + '=' + o.textContent));
    assert.deepEqual(opts.slice(0, 3), ['sk:carnival=에어포스원 자동차 모드', 'sk:carnival7=에어포스원 에어라인', 'sk:carnival8=에어포스원 3D 맵']);
    assert.ok(opts.includes('neon=네온 링') && !opts.some(o => o.startsWith('cockpit=')), 'gauge designs follow, no separate cockpit entry');
    assert.equal(await p.locator('#gStyleBar').inputValue(), 'sk:carnival7');
    await p.locator('#gStyleBar').selectOption('sk:carnival8'); await p.waitForTimeout(500);
    assert.deepEqual(await p.evaluate(() => [document.documentElement.hasAttribute('data-sk3d'), JSON.parse(localStorage.dna_skin2), document.getElementById('gStyle').value]), [true, 'carnival8', 'sk:carnival8']);
    await p.locator('#gStyleBar').selectOption('neon'); await p.waitForTimeout(400);
    assert.deepEqual(await p.evaluate(() => [document.getElementById('gStyleBar').value, JSON.parse(localStorage.dna_skin2)]), ['neon', 'carnival8'], 'gauge design keeps the skin');
    await p.evaluate(() => AmpSkinUni.pick('sk:carnival7')); await p.waitForTimeout(400);
    assert.equal(await p.locator('#gStyleBar').inputValue(), 'sk:carnival7', 'runway skin brings back the cockpit PFD');
    // 설명서
    assert.equal(await p.locator('#guideBtn').isVisible(), true);
    await p.locator('#guideBtn').click(); await p.waitForTimeout(300);
    assert.equal(await p.locator('#guide').isVisible(), true);
    const steps = await p.evaluate(() => AmpGuide.steps());
    assert.equal(steps.includes('ext'), dist === 'noradio', 'lite has no external-app step');
    assert.ok(!(await p.locator('#guide').textContent()).includes('라디오'), 'no radio talk');
    const imgOk = await p.evaluate(() => new Promise(r => { const im = document.querySelector('#guide .gd-m img'); if (im.complete) r(im.naturalWidth); else im.onload = () => r(im.naturalWidth); im.onerror = () => r(0); }));
    assert.ok(imgOk > 500, 'step picture loads');
    for (let i = 1; i < steps.length; i++) await p.locator('#guide .gd-nx').click();
    assert.equal(await p.locator('#guide .gd-nx').textContent(), '완료');
    assert.equal(await p.locator('#guide video').count(), 2, 'last step has two clips');
    await p.locator('#guide .gd-nx').click();
    assert.equal(await p.locator('#guide').isVisible(), false);
    await p.close();
  }
});
