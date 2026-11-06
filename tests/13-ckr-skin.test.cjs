const {run, assert} = require('./lib/harness.cjs');

// 콕핏 수정판: 콕핏 2를 쓰던 기기는 한 번 바뀌고, 스킨·화면 배치는 설정에서, 버튼·글씨는 크게, 좁은 화면에서도 넘치지 않음
run('Revised cockpit skin', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('ckr: ' + e.message));
  await p.setViewportSize({width: 412, height: 900});
  await p.addInitScript(() => { if (!sessionStorage.getItem('ck')) { sessionStorage.setItem('ck', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival3')); } }); // 예전 콕핏 2 → 콕핏으로 옮겨지는지
  await p.goto(origin);
  await p.waitForFunction(() => document.documentElement.dataset.ckr === '1', null, {timeout: 5000});
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_skin2'))), 'carnival5', 'Old cockpit 2 users move to the cockpit skin');
  await p.waitForFunction(() => /스킨을 정리했어요/.test(document.getElementById('toast').textContent), null, {timeout: 4000});
  assert.equal(await p.evaluate(() => document.documentElement.dataset.ck2), '1', 'Same cockpit 2 features');
  // 좁은 화면에서 옆으로 넘치지 않음
  assert.ok(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1 && document.body.scrollWidth <= innerWidth + 1), 'No sideways overflow on a phone');
  // 도구 줄: 스킨·화면 고르기는 숨기고 큰 버튼만
  assert.equal(await p.locator('.tools label[for="skin"]').isVisible(), false);
  assert.ok((await p.locator('#driveBtn').boundingBox()).height >= 46, 'Big toolbar buttons');
  assert.ok((await p.locator('#wGps > .bar .wbtn').last().boundingBox()).width >= 44, 'Window buttons are finger-sized');
  // 조종 패널은 너비와 관계없이 다섯 칸 한 줄
  for (const w of [412, 600, 1000]) {
    await p.setViewportSize({width: w, height: 900}); await p.waitForTimeout(300);
    const tops = await p.evaluate(() => [...document.querySelectorAll('.dsn .modules>.module')].filter(m => m.offsetParent).map(m => Math.round(m.getBoundingClientRect().top)));
    assert.equal(new Set(tops).size, 1, 'Cockpit control in one row at ' + w + 'px');
  }
  await p.setViewportSize({width: 600, height: 900});
  // 속도계 아래 버튼 글자가 칸 밖으로 나가지 않음
  assert.ok((await p.evaluate(() => [...document.querySelectorAll('#pfdHost .pfd-tool')].filter(b => b.offsetParent).every(b => b.scrollWidth <= b.clientWidth + 1))), 'PFD buttons fit at 600px');
  // 상단: 해외 시간 대신 나침반
  assert.equal(await p.locator('#clkWorld').isVisible(), false);
  assert.equal(await p.locator('#clkCmp').isVisible(), true, 'Compass dial in the clock row');
  assert.equal(await p.locator('#clkBri').isVisible(), true, 'Brightness next to the compass');
  { const c = await p.locator('#clkCmp').boundingBox(), b = await p.locator('#clkBri').boundingBox(); assert.ok(b.x > c.x && Math.abs(b.y - c.y) < 4, 'Brightness right after the compass'); }
  assert.ok((await p.locator('#briUp').boundingBox()).height >= 30, 'Brightness buttons are tappable');
  assert.ok(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1), 'Clock row with brightness still fits a phone');
  // 상단 스킨 버튼
  await p.locator('#skinBtn').click();
  assert.equal(await p.locator('#skinPick').isVisible(), true);
  assert.equal(await p.locator('#skinPick button.on').getAttribute('data-k'), 'carnival5');
  await p.locator('#skinPick button[data-k="carnival4"]').click();
  assert.equal(await p.locator('#skin').inputValue(), 'carnival4', 'Skin changed from the top button');
  assert.equal(await p.locator('#clkCmp').isVisible(), true, 'Cockpit grey also has the compass');
  assert.equal(await p.locator('#clkBri').isVisible(), true, 'Cockpit grey also has brightness');
  assert.equal(await p.locator('#skinBtn').isVisible(), true, 'Skin button in every skin');
  await p.evaluate(() => { const s = document.getElementById('skin'); s.value = 'carnival5'; s.dispatchEvent(new Event('change')); });
  // 설정에서 스킨 바꾸기 → 콕핏 2로 되돌림, 다시 켜도 다시 바뀌지 않음
  await p.locator('#setBtn').click();
  await p.locator('#sSkinSel').selectOption('carnival4');
  assert.equal(await p.evaluate(() => document.documentElement.dataset.ckr), undefined);
  assert.equal(await p.locator('#skin').inputValue(), 'carnival4');
  await p.locator('#setClose').click();
  await p.reload();
  await p.waitForFunction(() => window.AmpRadio);
  assert.equal(await p.locator('#skin').inputValue(), 'carnival4', 'Choice kept');
  await p.close();
});
