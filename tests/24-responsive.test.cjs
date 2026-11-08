const {run, assert} = require('./lib/harness.cjs');

// 1.47 반응형: 좁은 화면(320·360px)과 넓은 화면에서 버튼이 화면 밖으로 밀리거나 서로 겹치지 않고, 주요 버튼은 48px 이상
run('Responsive layout: nothing off-screen or overlapping, 48px targets', async ({browser, origin, routeLocal}) => {
  for (const [skin, w, h] of [['carnival7', 320, 568], ['carnival7', 360, 800], ['blue', 320, 568], ['carnival5', 412, 915], ['carnival7', 1280, 720], ['tablet', 600, 960]]) {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, hasTouch: true}); await routeLocal(ctx);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(k => { localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify(k)); }, skin);
    await p.goto(origin); await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let x = e; x; x = x.parentElement) { if (x.hidden || getComputedStyle(x).display === 'none') return false; } return getComputedStyle(e).visibility !== 'hidden'; };
      const inScrollX = e => { for (let x = e.parentElement; x && x !== document.body; x = x.parentElement) { const c = getComputedStyle(x); if (/(auto|scroll)/.test(c.overflowX) && x.scrollWidth > x.clientWidth + 1) return true; } return false; };
      const btn = [...document.querySelectorAll('#app button,.top button,.top select,#app select')].filter(vis).filter(e => getComputedStyle(e).pointerEvents !== 'none');
      const off = btn.filter(e => { const r = e.getBoundingClientRect(); return (r.right > innerWidth + 1 || r.left < -1) && !inScrollX(e); }).map(e => e.id || e.className);
      const main = [...document.querySelectorAll('#wMain .transport .tb,.top .tools .pill')].filter(vis).map(e => [e, e.getBoundingClientRect()]);
      const ov = []; for (let i = 0; i < main.length; i++) for (let j = i + 1; j < main.length; j++) { const a = main[i][1], b = main[j][1]; const x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (x > 4 && y > 4) ov.push(main[i][0].id + '/' + main[j][0].id); }
      const small = main.map(m => m[1]).filter(r => r.height < 47.5).length;
      return {off, ov, small, skin: document.documentElement.dataset.skin, tabfold: document.documentElement.hasAttribute('data-tabfold')};
    });
    assert.deepEqual(r.off, [], `${skin} ${w}x${h}: buttons off-screen ${r.off}`);
    assert.deepEqual(r.ov, [], `${skin} ${w}x${h}: overlapping buttons`);
    assert.equal(r.small, 0, `${skin} ${w}x${h}: main buttons at least 48px`);
    if (skin === 'tablet') assert.ok(r.tabfold, 'Tablet landscape layout falls back to the cockpit layout on a tall narrow screen');
    assert.deepEqual(errs, []);
    await ctx.close();
  }
});
