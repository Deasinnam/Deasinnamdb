const {run, assert} = require('./lib/harness.cjs');

// TMAP·네이버 지도를 위·아래에 켜면 이 앱은 남은 칸(약 40%)에 스크롤 없이 따로 배치
run('Split screen layout next to TMAP / Naver Map', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('split: ' + e.message));
  await p.addInitScript(() => {
    if (!sessionStorage.getItem('sp')) { sessionStorage.setItem('sp', '1'); localStorage.clear(); localStorage.setItem('dna_ckFocus', JSON.stringify('radio')); }
    window.__splitBoot = {on: true, ratio: .4};
    window.AndroidBridge = {gpsStatus: () => '{}', startGps() {}, stopGps() {}, keepScreenOn() {}, takeCarAutoplay: () => false, splitState: () => JSON.stringify(window.__splitBoot)};
  });
  await p.setViewportSize({width: 900, height: 420});
  await p.goto(origin);
  await p.waitForFunction(() => window.AmpSplit && AmpSplit.on, null, {timeout: 5000});
  // 콕핏 2: 속도계 창 하나만(측면 버튼·기록 칸·아래 버튼 그대로), 남은 칸에 꽉 차게
  const lay = await p.evaluate(() => ({
    mode: document.documentElement.dataset.split,
    vis: [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id),
    scroll: document.scrollingElement.scrollHeight - innerHeight, h: innerHeight,
    g: document.getElementById('wGps').getBoundingClientRect(),
    rail: !!document.querySelector('#wGps > #ckRail') && !!document.getElementById('ckRail').offsetParent,
    metrics: !!document.querySelector('#pfdHost .pfd-metrics').offsetParent, tools: !!document.querySelector('#pfdHost .pfd-tools').offsetParent,
    canvas: document.querySelector('#pfdHost .pfd-canvas-wrap').getBoundingClientRect().height, top: getComputedStyle(document.querySelector('.top')).display}));
  assert.equal(lay.mode, 'ck');
  assert.deepEqual(lay.vis, ['wGps'], 'Only the speedometer window');
  assert.equal(lay.scroll, 0, 'No scrolling in the split half');
  assert.ok(lay.g.bottom <= lay.h && lay.g.bottom > lay.h - 14 && lay.g.top < 10, 'Fills the half');
  assert.ok(lay.rail && lay.metrics && lay.tools, 'Side buttons, record tiles and tool buttons stay');
  assert.ok(lay.canvas > lay.h * .4, 'Flight display stays large (' + lay.canvas + ')');
  assert.equal(lay.top, 'none', 'Header hidden in split view');
  // 측면 버튼으로 다른 보기(같은 칸), 저장된 보기는 그대로
  await p.locator('#ckRail [data-f="vis"]').click();
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id)), ['wVis'], 'NOW PLAYING in the split half');
  assert.ok(await p.evaluate(() => document.getElementById('wVis').getBoundingClientRect().bottom <= innerHeight));
  await p.setViewportSize({width: 900, height: 430}); await p.waitForTimeout(250);
  assert.equal(await p.locator('#ckRail [data-f="vis"]').evaluate(b => b.classList.contains('on')), true, 'View kept when the divider moves');
  await p.locator('#ckRail [data-f="all"]').click();
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id)), ['wGps'], 'All = speedometer in split');
  // 좁은 화면(휴대폰): 측면 버튼은 위 한 줄, 기록 칸 숨김
  await p.setViewportSize({width: 412, height: 350}); await p.waitForTimeout(300);
  const nar = await p.evaluate(() => ({g: document.getElementById('wGps').getBoundingClientRect().bottom, h: innerHeight, metrics: !!document.querySelector('#pfdHost .pfd-metrics').offsetParent, canvas: document.querySelector('#pfdHost .pfd-canvas-wrap').getBoundingClientRect().height}));
  assert.ok(nar.g <= nar.h + 1 && !nar.metrics && nar.canvas > 60, 'Phone split fits');
  // 분할이 끝나면 원래 화면(콕핏 2 라디오 보기)으로
  await p.setViewportSize({width: 900, height: 1200});
  await p.evaluate(() => window.__split({on: false, ratio: 1}));
  assert.equal(await p.evaluate(() => AmpSplit.on), false);
  assert.equal(await p.locator('#ckRail [data-f="radio"]').evaluate(b => b.classList.contains('on')), true, 'Saved focus view restored');
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_ckFocus'))), 'radio');
  // 가로로 나뉜 경우(높이 그대로)는 바꾸지 않음
  await p.evaluate(() => window.__split({on: true, ratio: 1}));
  assert.equal(await p.evaluate(() => AmpSplit.on), false, 'Side-by-side split keeps the normal layout');
  // 측면 버튼이 없는 스킨: [속도계 | 플레이어]
  await p.evaluate(() => window.__split({on: false, ratio: 1}));
  await p.locator('#skin').selectOption('carnival');
  await p.setViewportSize({width: 900, height: 420});
  await p.evaluate(() => window.__split({on: true, ratio: .4}));
  assert.equal(await p.evaluate(() => document.documentElement.dataset.split), 'grid');
  assert.deepEqual((await p.evaluate(() => [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id))).sort(), ['wGps', 'wMain']);
  assert.equal(await p.evaluate(() => document.scrollingElement.scrollHeight - innerHeight), 0);
  // 설정에서 끄기
  await p.evaluate(() => { document.getElementById('settings').hidden = false; });
  await p.locator('#sSplitRow').click();
  await p.evaluate(() => { document.getElementById('settings').hidden = true; });
  assert.equal(await p.evaluate(() => AmpSplit.on), false, 'Setting turns the split layout off');
  await p.close();
});
