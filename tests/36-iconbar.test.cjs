const {run, assert} = require('./lib/harness.cjs');

// 1.69 콕핏 스킨 위쪽: 도구 줄 아이콘만(이름은 aria-label), 계기 4개 같은 높이·글자 없음, 날짜·요일은 로고 아래 띠
run('Cockpit header: icon-only toolbar, equal gauges, date strip under the logo', async ({newPage, origin}) => {
  for (const w of [411, 840]) {
    const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
    await p.setViewportSize({width: w, height: 900}); await p.goto(origin); await p.waitForFunction(() => window.AmpIconBar);
    await p.evaluate(() => { document.getElementById('srcSeg').hidden = false; });
    await p.locator('#ckRail button[data-f="all"]').click(); await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const vis = e => e && e.offsetParent && getComputedStyle(e).display !== 'none';
      const bs = [...document.querySelectorAll('header.top .tools button')].filter(vis);
      const text = bs.filter(b => [...b.querySelectorAll('.tl,.emo')].some(vis) || [...b.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
      const g = ['#clkNow', '#clkWx', '#clkCmp', '#clkBri'].map(s => Math.round(document.querySelector(s).getBoundingClientRect().height));
      const cap = ['#clkWx', '#clkCmp', '#clkBri'].map(s => getComputedStyle(document.querySelector(s), '::after').content).filter(c => c && c !== 'none' && c !== 'normal');
      const st = document.querySelector('#dStrip .dsi'), sr = st.getBoundingClientRect(), br = document.querySelector('header.top .brand').getBoundingClientRect();
      return {n: bs.length, text: text.map(b => b.id || b.textContent), named: bs.every(b => b.getAttribute('aria-label')), g, cap, date: vis(document.getElementById('clkDate')), strip: st.textContent, below: sr.top >= br.bottom - 2 && sr.top - br.bottom < 14, dx: Math.abs(sr.left - br.left), dw: Math.abs(sr.width - br.width), h: Math.max(...bs.map(b => b.getBoundingClientRect().height))};
    });
    assert.ok(r.n >= 8 && r.text.length === 0 && r.named, w + ': icon-only toolbar buttons ' + JSON.stringify(r));
    assert.ok(r.h <= 50, w + ': small toolbar buttons');
    assert.equal(new Set(r.g).size, 1, w + ': the four gauges are the same height ' + r.g);
    assert.equal(r.cap.length + (r.date ? 1 : 0), 0, w + ': no captions under the gauges');
    assert.match(r.strip, /^\d{4}\. \d{1,2}\. \d{1,2}\. \([일월화수목금토]\)$/, 'date with weekday');
    assert.ok(r.below && r.dx < 3 && r.dw < 3, w + ': strip right under the logo, same width ' + JSON.stringify(r));
    await p.close();
  }
});
