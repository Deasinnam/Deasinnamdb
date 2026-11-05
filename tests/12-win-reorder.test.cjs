const {run, assert} = require('./lib/harness.cjs');

// 창 제목줄을 3초 누르고 있으면 들려서 끌어 놓은 자리로 옮겨짐(설정 → 창 순서와 같은 저장)
run('Long-press a window title to reorder', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('reorder: ' + e.message));
  await p.setViewportSize({width: 700, height: 1500});
  await p.addInitScript(() => { if (!sessionStorage.getItem('wr')) { sessionStorage.setItem('wr', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival')); localStorage.setItem('dna_mapPref', JSON.stringify('off')); } });
  await p.goto(origin);
  await p.locator('#wMain > .bar .t').waitFor();
  const top = id => p.evaluate(i => document.getElementById(i).getBoundingClientRect().top, id);
  assert.ok(await top('wGps') < await top('wMain'), 'Default: speedometer above the player');
  const t = await p.locator('#wMain > .bar .t').boundingBox();
  const cx = t.x + t.width / 2, cy = t.y + t.height / 2;
  // 짧게 누르면 아무 일 없음
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.waitForTimeout(1200); await p.mouse.up();
  assert.equal(await p.evaluate(() => document.getElementById('app').classList.contains('WR')), false, 'Short press does nothing');
  // 누른 채 크게 움직이면(스크롤) 취소
  await p.mouse.down(); await p.mouse.move(cx, cy + 40, {steps: 3}); await p.waitForTimeout(3300);
  assert.equal(await p.evaluate(() => document.getElementById('app').classList.contains('WR')), false, 'Moving while holding cancels');
  await p.mouse.up();
  // 3초 누르기 → 들림 → 속도계 위쪽으로 끌기 → 놓으면 저장
  await p.mouse.move(cx, cy); await p.mouse.down();
  await p.waitForTimeout(1500);
  assert.equal(await p.locator('#wMain').evaluate(w => w.classList.contains('lp')), true, 'Hold progress shown');
  await p.waitForTimeout(1700);
  assert.equal(await p.locator('#wMain').evaluate(w => w.classList.contains('wmove')), true, 'Window lifted after 3 s');
  const g = await p.locator('#wGps').boundingBox();
  await p.mouse.move(g.x + g.width / 2, g.y + 30, {steps: 8});
  await p.waitForTimeout(400);
  await p.mouse.up();
  assert.equal(await p.evaluate(() => document.getElementById('app').classList.contains('WR')), false);
  const order = await p.evaluate(() => JSON.parse(localStorage.getItem('dna_winOrder_G')));
  assert.ok(order.indexOf('wMain') < order.indexOf('wGps'), 'Player moved above the speedometer: ' + order.join(','));
  assert.ok(await top('wMain') < await top('wGps'), 'Layout follows the new order');
  assert.match(await p.locator('#toast').textContent(), /플레이어 자리를 옮겼어요/);
  // 다시 켜도 유지, 설정의 창 순서에도 반영 → 되돌리기
  await p.reload(); await p.locator('#wMain > .bar .t').waitFor();
  assert.ok(await top('wMain') < await top('wGps'), 'Order kept after restart');
  await p.locator('#setBtn').click();
  assert.equal(await p.locator('#ordList li').first().getAttribute('data-id'), 'wMain', 'Settings list shows the same order');
  await p.locator('#ordReset').click();
  await p.locator('#setClose').click();
  assert.ok(await top('wGps') < await top('wMain'), 'Reset restores the default');
  await p.close();
});
