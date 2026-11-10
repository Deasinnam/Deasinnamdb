const {run, assert} = require('./lib/harness.cjs');

// 1.55 앱 나누기: 대신남 AMP = 오디오 스킨 7개(차량 기능 숨김), 대신남 원 = 자동차 모드·에어라인
run('App split: AMP audio skins only, One car skins only', async ({context, origin, errors}) => {
  for (const [kind, skins, def] of [['amp', ['blue', 'amber', 'base', 'neon', 'ice', 'red', 'wood'], 'blue'], ['one', ['carnival', 'carnival7'], 'carnival7']]) {
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(kind + ': ' + e.message));
    await p.addInitScript(k => { window.__build = k; window.AndroidBridge = {buildKind: () => k}; if (sessionStorage.getItem('as') !== k) { sessionStorage.setItem('as', k); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify(k === 'amp' ? 'carnival7' : 'neon')); } }, kind);
    await p.setViewportSize({width: 900, height: 1000});
    await p.goto(origin); await p.waitForTimeout(700);
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_skin2'))), def, kind + ': a skin from the other app falls back to the default');
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#skin option')].map(o => o.value)), skins, kind + ' skins');
    await p.locator('#skinBtn').click();
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#skinPickList .pill')].map(b => b.dataset.k)), skins);
    await p.evaluate(() => document.getElementById('skinPick').hidden = true);
    const vis = await p.evaluate(() => ['#driveBtn', '#revBtn', '#wGps', '#wLog'].map(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && !e.hidden; }));
    if (kind === 'amp') assert.deepEqual(vis, [false, false, false, false], 'AMP hides car features');
    else assert.deepEqual(vis.slice(0, 3), [true, true, true], 'One keeps car features');
    assert.equal(await p.evaluate(() => document.documentElement.dataset.app), kind);
    await p.close();
  }
});
