const {run, assert} = require('./lib/harness.cjs');

// 1.76 스피드미터 오른쪽 아래 재생 중인 노래 제목(녹색 글자, 상자 없음), 멈추면 사라짐
run('PFD shows the playing song title', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 900, height: 1000}); await p.goto(origin); await p.waitForFunction(() => window.AmpPfd && window.PfdSong);
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { document.getElementById('npTitle').textContent = '밤양갱'; document.getElementById('bPlay').classList.add('hot'); PfdSong.tick();
    const e = document.querySelector('#pfdHost .pfd-song'), cs = getComputedStyle(e), b = e.getBoundingClientRect(), w = document.querySelector('#pfdHost .pfd-canvas-wrap').getBoundingClientRect();
    return {t: e.textContent, vis: !e.hidden && b.width > 0, color: cs.color, bg: cs.backgroundColor, border: cs.borderTopWidth, right: w.right - b.right, low: b.bottom > w.top + w.height * .6}; });
  assert.equal(r.t, '♪ 밤양갱'); assert.ok(r.vis, 'shown'); assert.equal(r.color, 'rgb(109, 255, 122)', 'green text');
  assert.equal(r.bg, 'rgba(0, 0, 0, 0)', 'no box'); assert.equal(r.border, '0px'); assert.ok(r.low && r.right > 40, 'lower right inside the sky: ' + JSON.stringify(r));
  await p.evaluate(() => { document.getElementById('bPlay').classList.remove('hot'); PfdSong.tick(); });
  assert.equal(await p.evaluate(() => document.querySelector('#pfdHost .pfd-song').hidden), true, 'hidden when stopped');
  await p.close();
});

// 1.76 누적 주행거리 칩을 한 번 더 누르면 엔진오일 교체까지 남은 거리, 또 누르면 다시 누적 주행거리
run('Odometer chip toggles to engine-oil distance', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7'));
    localStorage.setItem('dna_carlog', JSON.stringify({fuel: 'gas', odo: 102061, auto: true, items: {'gas:oil': {hist: [{km: 95000, date: '2026-08-01'}]}}, custom: [], fills: []})); });
  await p.setViewportSize({width: 900, height: 1000}); await p.goto(origin); await p.waitForFunction(() => window.AmpSpecialOdo);
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(600);
  assert.match(await p.locator('.sp-odo').textContent(), /누적 주행거리102,061/);
  await p.locator('.sp-odo').click();
  assert.match(await p.locator('.sp-odo').textContent(), /엔진오일 교체까지2,939km/);
  await p.locator('.sp-odo').click();
  assert.match(await p.locator('.sp-odo').textContent(), /누적 주행거리/);
  // 지난 경우
  await p.evaluate(() => AmpLog.setOdo(106000, true)); await p.locator('.sp-odo').click();
  assert.match(await p.locator('.sp-odo').textContent(), /엔진오일 교체 필요1,000km 지남/);
  await p.close();
});

// 1.95 노래 제목 위 음악 효과: 재생 중에만 보이고, 누르면 효과가 바뀜(막대 → 거울 → 파형 → 점 → 원)
run('PFD music effect above the song title', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 900, height: 1000}); await p.goto(origin); await p.waitForFunction(() => window.PfdSongFx);
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(600);
  await p.evaluate(() => { document.getElementById('npTitle').textContent = '만약에'; document.getElementById('bPlay').classList.add('hot'); PfdSong.tick(); PfdSongFx._feed(x => .5 + .4 * Math.sin(x * 9)); });
  await p.waitForTimeout(400);
  const fx = p.locator('#pfdHost .pfd-songfx');
  assert.equal(await fx.isVisible(), true, 'effect shows while playing');
  const m0 = await p.evaluate(() => PfdSongFx.mode);
  await fx.click(); await p.waitForTimeout(300);
  assert.notEqual(await p.evaluate(() => PfdSongFx.mode), m0, 'tap changes the effect');
  assert.ok(await p.evaluate(() => { const c = document.querySelector('#pfdHost .pfd-songfx'), ps = c.querySelectorAll('path'); return c.tagName.toLowerCase() === 'svg' && (ps[0].getAttribute('d') || '').length + (ps[1].getAttribute('d') || '').length > 50 && getComputedStyle(c).backgroundColor === 'rgba(0, 0, 0, 0)'; }), 'drawn without a background');
  assert.equal(await p.locator('#pfdHost canvas').count(), 1, 'only the PFD canvas');
  await p.evaluate(() => { document.getElementById('bPlay').classList.remove('hot'); PfdSong.tick(); }); await p.waitForTimeout(300);
  assert.equal(await fx.isVisible(), false, 'hidden when stopped');
  await p.close();
});
