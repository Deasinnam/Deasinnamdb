const {run, assert} = require('./lib/harness.cjs');

// 1.71 NOW PLAYING: 라디오 전환 옆 [⏏] 외부 입력(글자 없음) — 누르면 YouTube Music·Spotify 고르기, 고르면 외부 앱 모드로
run('External input button next to the radio swap', async ({newPage, origin}) => {
  for (const [w, h] of [[812, 900], [344, 740]]) {
    const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
    await p.setViewportSize({width: w, height: h}); await p.goto(origin); await p.waitForFunction(() => window.AmpExtInput);
    await p.locator('#ckRail button[data-f="vis"]').click(); await p.waitForTimeout(700);
    const r = await p.evaluate(() => { const bs = [...document.querySelectorAll('#wMain .transport>.tb')].filter(b => b.offsetParent), i = bs.findIndex(b => b.id === 'bInput'), x = document.getElementById('bInput');
      return {after: bs[i - 1] && bs[i - 1].id, text: x.textContent.trim(), rows: new Set(bs.map(b => Math.round(b.getBoundingClientRect().top))).size, h: x.getBoundingClientRect().height}; });
    assert.equal(r.after, 'bSwap', w + ': right after the radio swap'); assert.equal(r.text, '', 'no label'); assert.equal(r.rows, 1, w + ': player buttons in one row'); assert.ok(r.h >= 47.5);
    await p.locator('#bInput').click(); await p.waitForTimeout(200);
    assert.equal(await p.locator('#xinPick').isVisible(), true, 'picker opens');
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#xinPick [data-xin]')].map(b => b.textContent)), ['YouTube Music', 'Spotify']);
    await p.locator('#xinPick [data-xin="com.spotify.music"]').click(); await p.waitForTimeout(300);
    assert.equal(await p.locator('#xinPick').isVisible(), false);
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_extPkg'))), 'com.spotify.music', 'switches to the chosen app');
    await p.close();
  }
});
