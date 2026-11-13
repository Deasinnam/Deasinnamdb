const {run, assert} = require('./lib/harness.cjs');

// 1.62.2 전용 보기(전체 제외)는 최적화된 화면에 고정: 위아래로 끌어도 스프링처럼 튕기고 같은 자리, 전체 보기에서는 평소처럼 스크롤
run('Dedicated views stay fitted; drag springs back', async ({newPage, origin}) => {
  const p = await newPage(() => { localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 820, height: 1000});
  await p.goto(origin);
  await p.waitForFunction(() => window.AmpFxLock);
  await p.locator('#ckRail button[data-f="radio"]').click();
  await p.waitForTimeout(1300);
  const y0 = await p.evaluate(() => AmpFxLock.y);
  assert.ok(typeof y0 === 'number', 'locked in a dedicated view: ' + y0);
  const fit = await p.evaluate(() => { const r = document.querySelector('#app>.win.fx').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: innerHeight }; });
  assert.ok(fit.bottom <= fit.h + 1 && fit.bottom > fit.h - 40, 'window fits the screen bottom: ' + JSON.stringify(fit));
  // 휠로 내려도 같은 자리
  await p.mouse.move(400, 300); await p.mouse.wheel(0, 600); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(() => Math.round(scrollY)), y0, 'wheel does not move the page');
  // 스크립트로 밀어도 제자리로 돌아오고 살짝 튕김
  await p.evaluate(() => scrollTo(0, scrollY + 300)); await p.waitForTimeout(60);
  assert.equal(await p.evaluate(() => Math.round(scrollY)), y0, 'snaps back');
  await p.waitForTimeout(1200);
  assert.equal(await p.evaluate(() => document.getElementById('app').style.transform), '', 'spring settles at rest');
  // 손가락으로 끌기(CDP 터치): 끄는 동안 늘어나고, 놓으면 0으로
  const cdp = await p.context().newCDPSession(p);
  const tp = (type, y) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: type === 'touchEnd' ? [] : [{x: 420, y}]});
  await tp('touchStart', 300); for (let y = 310; y <= 520; y += 30) await tp('touchMove', y);
  const mid = await p.evaluate(() => AmpFxLock.off);
  await tp('touchEnd', 520);
  assert.ok(mid > 20, 'rubber band while dragging: ' + mid);
  await p.waitForTimeout(1300);
  assert.ok(Math.abs(await p.evaluate(() => AmpFxLock.off)) < 1 && await p.evaluate(() => Math.round(scrollY)) === y0, 'back to the same place');
  // 전체 보기: 고정 풀림
  await p.locator('#ckRail button[data-f="all"]').click(); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(() => AmpFxLock.y), null, 'all view scrolls normally');
  await p.close();

  // 1.62.4 라디오 즐겨찾기 칸: 기본 6칸, 저장한 방송이 늘면 한 줄씩
  for (const [count, want] of [[0, 6], [6, 6], [7, 9]]) {
    const q = await newPage(c => { localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); localStorage.setItem('dna_rdFavs', JSON.stringify(Array.from({length: c}, (_, i) => ({id: 'f' + i, name: 'FM ' + i, url: 'https://s.example/' + i, freq: 88 + i})))); }, count);
    await q.setViewportSize({width: 820, height: 1000});
    await q.goto(origin); await q.waitForTimeout(800);
    await q.locator('#ckRail button[data-f="radio"]').click(); await q.waitForTimeout(600);
    const n = await q.evaluate(() => document.querySelectorAll('#rdPresets button').length);
    const cols = await q.evaluate(() => getComputedStyle(document.getElementById('rdPresets')).gridTemplateColumns.split(' ').length);
    assert.equal(n, cols === 3 ? want : Math.max(6, Math.ceil(count / cols) * cols), count + ' favourites → ' + n + ' slots (' + cols + ' columns)');
    await q.close();
  }
});
