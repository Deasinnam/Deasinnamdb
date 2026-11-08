const {run, assert} = require('./lib/harness.cjs');

// 1.19: 콕핏 바로가기는 스피드미터 화면 아래 가로 한 줄, [GPS 켜기] 줄 아래 기기 지원 표시, NOW PLAYING 효과 40개 + 즐겨찾기
run('Cockpit rail row, device support, 40 effects with favorites', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('r19: ' + e.message));
  await p.addInitScript(() => {
    window.__capsCalls = 0;
    window.AndroidBridge = {deviceCaps: () => { window.__capsCalls++; return JSON.stringify({gps: {s: 'on', t: '켜짐'}, compass: {s: 'yes', t: '있음'}, lte: {s: 'yes', t: '지원'}, nr: {s: 'unk', t: '확인 불가'}, wifi: {s: 'off', t: '꺼짐'}, bt: {s: 'no', t: '없음'}}); }};
    if (!sessionStorage.getItem('r19')) { sessionStorage.setItem('r19', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival5')); }
  });
  for (const [w, h] of [[552, 1000], [400, 860], [1280, 800]]) {
    await p.setViewportSize({width: w, height: h});
    await p.goto(origin);
    await p.waitForFunction(() => document.querySelector('#pfdHost .pfd-glass + #ckRail'), null, {timeout: 6000});
    const r = await p.evaluate(() => {
      const rail = document.getElementById('ckRail'), glass = document.querySelector('#pfdHost .pfd-glass').getBoundingClientRect();
      const bs = [...rail.querySelectorAll('button')].map(b => b.getBoundingClientRect());
      return {rows: new Set(bs.map(b => Math.round(b.top))).size, below: rail.getBoundingClientRect().top >= glass.bottom - 1, maxH: Math.max(...bs.map(b => b.height)),
        fits: rail.scrollWidth <= rail.clientWidth + 1, glassW: glass.width, winW: document.getElementById('wGps').getBoundingClientRect().width,
        clipped: [...rail.querySelectorAll('button[data-f] span')].some(s => getComputedStyle(s).fontSize !== '0px' && s.scrollWidth > s.clientWidth + 1)};
    });
    // 1.47 좁은 화면(540px 이하)은 글자가 잘리지 않게 4칸씩 두 줄, 넓으면 한 줄
    assert.equal(r.rows, w <= 540 ? 2 : 1, `Shortcut rows at ${w}px`);
    assert.ok(r.below, 'Shortcuts sit right under the speedometer view');
    assert.ok(r.maxH <= (w <= 540 ? 64 : 48), 'Compact buttons');
    assert.ok(r.fits && !r.clipped, `Labels fit at ${w}px`);
    assert.ok(r.glassW > r.winW - 70, 'Speedometer view uses the full width (no side rail)');
    assert.ok(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1), 'No sideways overflow');
  }
  // 기기 지원: 조종 패널 버튼 아래(패널이 안 보이면 [GPS 켜기] 줄 아래), 6가지 자동 확인
  assert.ok(await p.evaluate(() => document.getElementById('dkControlDeck').nextElementSibling?.id === 'devCaps'), 'Device support row under the control buttons');
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(300);
  assert.ok(await p.evaluate(() => document.querySelector('#pfdHost .pfd-tools').nextElementSibling?.id === 'devCaps'), 'Falls back under the GPS controls when the control panel is hidden');
  await p.locator('#ckRail button[data-f="all"]').click(); await p.waitForTimeout(300);
  assert.ok(await p.evaluate(() => document.getElementById('dkControlDeck').nextElementSibling?.id === 'devCaps'), 'Back under the control buttons');
  // 기록 칸은 낮게, 조종 패널도 낮게
  assert.ok((await p.locator('#pfdHost .pfd-metric').first().boundingBox()).height <= 54, 'Low record tiles');
  assert.ok(await p.evaluate(() => { const m = document.querySelector('#dkControlDeck .wifi-module').getBoundingClientRect().height; return m < 150; }), 'Low control modules');
  const caps = await p.evaluate(() => [...document.querySelectorAll('#devCaps .dc')].map(e => [e.dataset.k, e.dataset.s, e.querySelector('small').textContent]));
  assert.deepEqual(caps.map(c => c[0]), ['gps', 'compass', 'lte', 'nr', 'wifi', 'bt']);
  assert.deepEqual(caps.map(c => c[1]), ['on', 'yes', 'yes', 'unk', 'off', 'no']);
  assert.equal(caps[0][2], '켜짐');
  assert.ok(await p.evaluate(() => window.__capsCalls >= 1), 'Asked the app');
  // 다른 창(지도)에 초점: 바로가기는 그 창 제목 아래 한 줄
  await p.locator('#ckRail button[data-f="map"]').click();
  assert.ok(await p.evaluate(() => document.getElementById('ckRail').parentElement.id === 'wMap'), 'Rail follows the focused window');
  await p.locator('#ckRail button[data-f="gps"]').click();
  assert.ok(await p.evaluate(() => document.querySelector('#pfdHost .pfd-glass + #ckRail') !== null), 'Back under the speedometer');
  // NOW PLAYING: 효과 40개, 즐겨찾기
  await p.locator('#ckRail button[data-f="vis"]').click();
  assert.equal(await p.evaluate(() => AmpVis.names.length), 40);
  assert.equal(await p.locator('#visSel option').count(), 40);
  for (let i = 0; i < 40; i++) { await p.evaluate(i => AmpVis.set(i), i); await p.waitForTimeout(40); }
  assert.equal(await p.locator('#visFavOnly').isVisible(), false, 'Favorites-only appears with 2+ favorites');
  await p.evaluate(() => AmpVis.set(33)); await p.locator('#visFav').click();
  assert.equal(await p.locator('#visFav').textContent(), '★');
  await p.evaluate(() => AmpVis.set(4)); await p.locator('#visFav').click();
  assert.equal(await p.locator('#visFavOnly').isVisible(), true);
  assert.equal(await p.locator('#visSel optgroup').first().getAttribute('label'), '★ 즐겨찾기');
  assert.equal(await p.locator('#visSel optgroup').first().locator('option').count(), 2);
  await p.locator('.vmode .vstep[data-d="1"]').click();
  assert.equal(await p.locator('#visSel').inputValue(), '33', 'Next skips to the next favorite');
  await p.locator('.vmode .vstep[data-d="1"]').click();
  assert.equal(await p.locator('#visSel').inputValue(), '4', 'Wraps within favorites');
  await p.locator('#visFavOnly').click();
  await p.locator('.vmode .vstep[data-d="1"]').click();
  assert.equal(await p.locator('#visSel').inputValue(), '5', 'All effects when favorites-only is off');
  await p.reload();
  assert.deepEqual(await p.evaluate(() => AmpVis.fav().sort((a, b) => a - b)), [4, 33], 'Favorites remembered');
  await p.close();
});
