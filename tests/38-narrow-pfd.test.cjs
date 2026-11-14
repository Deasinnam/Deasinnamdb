const {run, assert} = require('./lib/harness.cjs');

// 1.72 좁은 화면(반 가르기·바깥 화면): 좌우 속도·고도 띠는 유리 밖으로 감추고 속도는 가운데 크게. 펼친 화면은 그대로
run('Narrow speedometer: tapes hidden, speed in the middle; wide unchanged', async ({newPage, origin}) => {
  for (const [w, h, narrow] of [[385, 900, true], [840, 900, false]]) {
    const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
    await p.setViewportSize({width: w, height: h}); await p.goto(origin); await p.waitForFunction(() => window.AmpNarrow);
    await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { const g = document.querySelector('#pfdHost .pfd-glass').getBoundingClientRect(), c = document.querySelector('#pfdHost canvas').getBoundingClientRect(), s = document.querySelector('#pfdHost .nar-spd');
      const tape = Math.max(67, Math.min(175, c.width * .12));
      return {gl: g.left, gr: g.right, cl: c.left, cr: c.right, tape, spd: !!(s && s.offsetParent), sx: s && s.offsetParent ? (s.getBoundingClientRect().left + s.getBoundingClientRect().right) / 2 : 0}; });
    if (narrow) {
      assert.ok(Math.abs((r.cl + r.tape) - r.gl) < 4 && Math.abs((r.cr - r.tape) - r.gr) < 4, 'tapes sit just outside the glass ' + JSON.stringify(r));
      assert.ok(r.spd && Math.abs(r.sx - (r.gl + r.gr) / 2) < (r.gr - r.gl) * .3, 'speed shown in the middle ' + JSON.stringify(r));
    } else {
      assert.ok(r.cl >= r.gl - 2 && r.cr <= r.gr + 2, 'wide: tapes inside as before'); assert.equal(r.spd, false, 'wide: no extra speed readout');
    }
    await p.close();
  }
});
