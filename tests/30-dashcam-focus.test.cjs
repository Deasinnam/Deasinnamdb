const {run, assert} = require('./lib/harness.cjs');

// 1.58 DASHCAM 보기: 영상 칸이 창 대부분, 연결 정보·와이파이·호환 기종은 [정보 ▾]로 접힘
run('Dashcam focus: big video, info folded', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => { localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 900, height: 1000});
  await p.goto(origin); await p.waitForTimeout(1200);
  await p.locator('#ckRail button[data-f=cam]').click(); await p.waitForTimeout(600);
  const m = () => p.evaluate(() => { const v = document.getElementById('camView').getBoundingClientRect(), w = document.getElementById('wCam').getBoundingClientRect(), vis = s => { const e = document.querySelector(s); return !!(e && e.offsetParent); };
    return {ratio: v.height / w.height, net: vis('#camNet'), set: vis('#camSetBox'), compat: vis('.camcompat'), info: vis('#camInfo'), rows: new Set([...document.querySelectorAll('#wCam .mapctl>.pill')].map(b => Math.round(b.getBoundingClientRect().top))).size}; });
  let s = await m();
  assert.ok(s.ratio > 0.6, 'video fills most of the window: ' + s.ratio.toFixed(2));
  assert.deepEqual([s.net, s.set, s.compat, s.info, s.rows], [false, false, false, true, 1], 'extras folded, one row of buttons');
  await p.locator('#camInfo').click(); await p.waitForTimeout(200);
  s = await m();
  assert.deepEqual([s.set, s.compat], [true, true], 'info opens');
  await p.locator('#camInfo').click();
  await p.locator('#ckRail button[data-f=all]').click(); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => !!document.getElementById('camInfo').offsetParent), false, 'info button only in DASHCAM view');
  await p.close();
});
