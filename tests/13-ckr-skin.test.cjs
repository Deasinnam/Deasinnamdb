const {run, assert} = require('./lib/harness.cjs');

// 콕핏 수정판: 콕핏 2를 쓰던 기기는 한 번 바뀌고, 스킨·화면 배치는 설정에서, 버튼·글씨는 크게, 좁은 화면에서도 넘치지 않음
run('Revised cockpit skin', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('ckr: ' + e.message));
  await p.setViewportSize({width: 412, height: 900});
  await p.addInitScript(() => { if (!sessionStorage.getItem('ck')) { sessionStorage.setItem('ck', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival3')); } });
  await p.goto(origin);
  await p.waitForFunction(() => document.documentElement.dataset.ckr === '1', null, {timeout: 5000});
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_skin2'))), 'carnival5', 'Cockpit 2 users switch once');
  await p.waitForFunction(() => /콕핏 수정판/.test(document.getElementById('toast').textContent), null, {timeout: 4000});
  assert.equal(await p.evaluate(() => document.documentElement.dataset.ck2), '1', 'Same cockpit 2 features');
  // 좁은 화면에서 옆으로 넘치지 않음
  assert.ok(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1), 'No sideways overflow on a phone');
  // 도구 줄: 스킨·화면 고르기는 숨기고 큰 버튼만
  assert.equal(await p.locator('.tools label[for="skin"]').isVisible(), false);
  assert.ok((await p.locator('#driveBtn').boundingBox()).height >= 46, 'Big toolbar buttons');
  assert.ok((await p.locator('#wGps > .bar .wbtn').last().boundingBox()).width >= 44, 'Window buttons are finger-sized');
  assert.equal(await p.locator('#dkMuteButton').evaluate(b => b.scrollWidth <= b.clientWidth + 1), true, 'MUTE fits');
  // 설정에서 스킨 바꾸기 → 콕핏 2로 되돌림, 다시 켜도 다시 바뀌지 않음
  await p.locator('#setBtn').click();
  await p.locator('#sSkinSel').selectOption('carnival3');
  assert.equal(await p.evaluate(() => document.documentElement.dataset.ckr), undefined);
  assert.equal(await p.locator('#skin').inputValue(), 'carnival3');
  await p.locator('#setClose').click();
  await p.reload();
  await p.waitForFunction(() => window.AmpRadio);
  assert.equal(await p.locator('#skin').inputValue(), 'carnival3', 'Choice kept (no second switch)');
  await p.close();
});
