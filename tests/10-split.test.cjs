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
  const lay = await p.evaluate(() => {
    const vis = [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id);
    const r = id => document.getElementById(id).getBoundingClientRect();
    return {vis, scroll: document.scrollingElement.scrollHeight - innerHeight, gB: r('wGps').bottom, mB: r('wMain').bottom, gR: r('wGps').right, mL: r('wMain').left, h: innerHeight,
      canvas: document.querySelector('#pfdHost .pfd-canvas-wrap').getBoundingClientRect().height, top: getComputedStyle(document.querySelector('.top')).display};
  });
  assert.deepEqual(lay.vis.sort(), ['wGps', 'wMain'], 'Speedometer and player only');
  assert.equal(lay.scroll, 0, 'No scrolling in the split half');
  assert.ok(lay.gB <= lay.h && lay.mB <= lay.h && lay.gB > lay.h - 20, 'Windows fill the half');
  assert.ok(lay.gR <= lay.mL, 'Side by side on a wide screen');
  assert.ok(lay.canvas > lay.h * .55, 'Flight display gets most of the height');
  assert.equal(lay.top, 'none', 'Header hidden in split view');
  assert.equal(await p.evaluate(() => document.getElementById('app').classList.contains('FX')), false, 'Cockpit 2 focus view paused');
  // 좁은 화면: 속도계 위, 조작 줄 아래
  await p.setViewportSize({width: 412, height: 350});
  await p.waitForTimeout(300);
  const nar = await p.evaluate(() => ({g: document.getElementById('wGps').getBoundingClientRect(), m: document.getElementById('wMain').getBoundingClientRect(), play: !!document.getElementById('bPlay').offsetParent, h: innerHeight}));
  assert.ok(nar.g.bottom <= nar.m.top + 1 && nar.m.bottom <= nar.h + 1, 'Phone: speedometer above, controls below');
  assert.equal(nar.play, true);
  // 분할이 끝나면 원래 화면(콕핏 2 라디오 보기)으로
  await p.evaluate(() => window.__split({on: false, ratio: 1}));
  assert.equal(await p.evaluate(() => AmpSplit.on), false);
  assert.equal(await p.evaluate(() => document.getElementById('app').classList.contains('FX')), true, 'Focus view restored');
  assert.equal(await p.locator('#ckRail [data-f="radio"]').evaluate(b => b.classList.contains('on')), true);
  // 가로로 나뉜 경우(높이 그대로)는 바꾸지 않음, 설정에서 끌 수 있음
  await p.evaluate(() => window.__split({on: true, ratio: 1}));
  assert.equal(await p.evaluate(() => AmpSplit.on), false, 'Side-by-side split keeps the normal layout');
  await p.evaluate(() => { document.getElementById('settings').hidden = false; });
  await p.locator('#sSplitRow').click();
  await p.evaluate(() => { document.getElementById('settings').hidden = true; window.__split({on: true, ratio: .4}); });
  assert.equal(await p.evaluate(() => AmpSplit.on), false, 'Setting turns the split layout off');
  await p.close();
});
