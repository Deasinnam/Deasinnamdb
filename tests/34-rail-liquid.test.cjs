const {run, assert} = require('./lib/harness.cjs');

// 1.63 아래 버튼 줄 액체 탭 표시: 누르면 틀 하나가 늘어났다 모이며 새 버튼으로 옮겨 감(두 끝이 다른 스프링)
run('Bottom rail liquid tab indicator', async ({newPage, origin}) => {
  const p = await newPage(() => { localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 900, height: 1000});
  await p.goto(origin); await p.waitForFunction(() => window.AmpRailLiquid);
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(1200);
  const box = () => p.evaluate(() => { const i = document.querySelector('#ckRail .ck-liq').getBoundingClientRect(), b = document.querySelector('#ckRail button[data-f].on').getBoundingClientRect(); return {il: i.left, ir: i.right, bl: b.left, br: b.right, w: b.width, op: getComputedStyle(document.querySelector('#ckRail .ck-liq')).opacity}; });
  let b = await box();
  assert.ok(b.op === '1' && Math.abs(b.il - b.bl) < 2 && Math.abs(b.ir - b.br) < 2, 'indicator sits on the chosen button: ' + JSON.stringify(b));
  // 시간을 멈춰 놓고 눌러서 중간 모습 보기
  const T = await p.evaluate(() => (window.__liqNow = 1000));
  await p.locator('#ckRail button[data-f="radio"]').click(); await p.waitForTimeout(200);
  await p.evaluate(t => { window.__liqNow = t + 0.09; AmpRailLiquid.paint(); }, T);
  b = await box();
  assert.ok(b.ir - b.il > b.w * 1.4, 'stretched while moving: ' + JSON.stringify(b));
  await p.evaluate(t => { window.__liqNow = t + 1.2; AmpRailLiquid.paint(); }, T);
  b = await box();
  assert.ok(Math.abs(b.il - b.bl) < 2 && Math.abs(b.ir - b.br) < 2, 'settles on the new button: ' + JSON.stringify(b));
  await p.close();
});
