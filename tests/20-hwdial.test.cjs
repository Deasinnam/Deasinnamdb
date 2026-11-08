const {run, assert} = require('./lib/harness.cjs');

// 1.37 블루투스 다이얼(울란지 D100H 등): 정한 키만 앱이 가로채고, 다이얼 돌리기도 키 배우기로 기능에 붙임
run('Bluetooth dial keys and rotation map to app functions', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('hw: ' + e.message));
  await p.addInitScript(() => { window.__hw = []; window.AndroidBridge = {hwKeys: (j, l) => window.__hw.push([JSON.parse(j), l]), hwDevices: () => JSON.stringify(['Ulanzi Dial'])};
    if (!sessionStorage.getItem('hw')) { sessionStorage.setItem('hw', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 900});
  await p.goto(origin); await p.waitForTimeout(500);
  const bound = await p.evaluate(() => __hw[__hw.length - 1][0]);
  assert.ok(['MEDIA_NEXT', 'MEDIA_PLAY_PAUSE', 'MEDIA_PREVIOUS', 'Ctrl+V@ulanzi', 'Meta+C@ulanzi', 'Ctrl+Z@ulanzi'].every(k => bound.includes(k)), 'Tells the app which keys to take (side buttons only from the dial)');
  // 측면 버튼(붙여넣기) → 라디오↔음악 앱 전환 키를 누른 것과 같음 / 다른 키보드의 Ctrl+V는 무시
  assert.equal(await p.evaluate(() => { let n = 0; const b = document.getElementById('bSwap'); b.addEventListener('click', () => n++); __hwKey('Ctrl+V', 'Ulanzi Dial'); __hwKey('Ctrl+V', 'Samsung Keyboard'); return n; }), 1, 'Side button works, other keyboards keep paste');
  await p.locator('#setBtn').click(); await p.locator('#secHw').scrollIntoViewIfNeeded();
  assert.match(await p.locator('#hwStat').textContent(), /Ulanzi Dial/);
  // 다이얼 오른쪽 돌리기 → 지도 확대로 배우기
  await p.locator('#hwMap [data-hwlearn="zoomIn"]').click();
  assert.equal(await p.evaluate(() => __hw[__hw.length - 1][1]), true, 'Learning mode takes every external key');
  await p.evaluate(() => __hwKey('WHEEL_UP', 'Ulanzi Dial'));
  assert.match(await p.locator('#hwMap li[data-a="zoomIn"] em').textContent(), /다이얼/);
  const last = await p.evaluate(() => __hw[__hw.length - 1]);
  assert.ok(last[0].includes('WHEEL_UP') && last[1] === false, 'Learned and back to normal');
  // 단축키(Ctrl+V)도 배울 수 있음
  await p.locator('#hwMap [data-hwlearn="land"]').click();
  await p.evaluate(() => __hwKey('Ctrl+V', 'Ulanzi Dial'));
  assert.match(await p.locator('#hwMap li[data-a="land"] em').textContent(), /측면 붙여넣기/);
  await p.close();
});
