/* 반응형 점검: 스킨 × 논리 화면 크기(CSS px) × 글자 배율 × 화면(메인·설정·선택 창·간편 모드)
 * 가로 넘침, 화면 밖 요소, 잘린 글자, 겹친 버튼, 작은 터치 영역(48px 미만)을 재서 JSON으로 출력
 *   node tools/rwd-audit.cjs [out.json] [shotDir]
 * 글자 배율은 Android WebView의 textZoom(시스템 글자 크기)처럼 모든 글자 크기만 키워서 흉내 냄 */
'use strict';
const {chromium} = require('playwright');
const {startServer} = require('../tests/lib/harness.cjs');
const fs = require('node:fs');
const OUT = process.argv[2] || 'rwd-audit.json', SHOT = process.argv[3] || '';
const SKINS = (process.env.SKINS || 'carnival7,carnival5,tablet,blue').split(',');
const SIZES = (process.env.SIZES || '320x568,360x800,412x915,600x960,800x1280,1280x720,1920x720,568x320,915x412').split(',').map(s => s.split('x').map(Number));
const ZOOMS = (process.env.ZOOMS || '1,1.5,2').split(',').map(Number);
const SCREENS = (process.env.SCREENS || 'main,settings,skin,drive').split(',');

function inPage(zoom) {
  // 글자 배율 흉내: 요소마다 계산된 글자 크기 × zoom(물려받은 크기는 한 번만)
  window.__zoomAll = () => {
    if (zoom === 1) return;
    const els = [...document.querySelectorAll('body *')].filter(e => !e.dataset.fz && !(e instanceof SVGElement));
    const sizes = els.map(e => [e, parseFloat(getComputedStyle(e).fontSize), e.parentElement && e.parentElement.dataset.fz ? parseFloat(getComputedStyle(e.parentElement).fontSize) : 0]);
    for (const [e, fs, pfs] of sizes) { e.dataset.fz = '1'; if (pfs && Math.abs(fs - pfs) < .01) continue; e.style.setProperty('font-size', (fs * zoom).toFixed(2) + 'px', 'important'); }
  };
  const vis = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || +cs.opacity === 0) return false; for (let p = e; p; p = p.parentElement) { if (p.hidden) return false; const c = getComputedStyle(p); if (c.display === 'none') return false; } return true; };
  const name = e => { const p = []; for (let x = e; x && x !== document.body && p.length < 3; x = x.parentElement) { if (x.id) { p.unshift('#' + x.id); break; } p.unshift(x.tagName.toLowerCase() + (x.classList.length ? '.' + [...x.classList].slice(0, 2).join('.') : '')); } return p.join('>') + (e.textContent ? ' "' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 24) + '"' : ''); };
  // 가로로 의도해서 넘기는 상자(가로 스크롤 목록)는 넘침으로 치지 않음
  const scrollerX = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const c = getComputedStyle(p); if (/(auto|scroll)/.test(c.overflowX) && p.scrollWidth > p.clientWidth + 1) return p; } return null; };
  const clipAnc = e => { const r = e.getBoundingClientRect(); for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const c = getComputedStyle(p); if (c.overflowX !== 'visible' || c.overflowY !== 'visible') { const q = p.getBoundingClientRect(); if (r.right > q.right + 2 || r.left < q.left - 2 || (c.overflowY === 'hidden' && (r.bottom > q.bottom + 2 || r.top < q.top - 2))) return p; } } return null; };
  window.__audit = (scope) => {
    const root = scope ? document.querySelector(scope) : document.body, W = innerWidth;
    const out = {hOverflow: Math.max(0, document.scrollingElement.scrollWidth - W), offscreen: [], clipped: [], small: [], overlap: [], cut: []};
    const inter = [...root.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[role=button],summary,label.row,.pill')].filter(vis);
    const hit = e => { const r = e.getBoundingClientRect(), a = getComputedStyle(e, '::after'); if (a.content === 'none' || a.position !== 'absolute') return r;
      const px = v => parseFloat(v) || 0; return {left: r.left + Math.min(0, px(a.left)), right: r.right - Math.min(0, px(a.right)), top: r.top + Math.min(0, px(a.top)), bottom: r.bottom - Math.min(0, px(a.bottom)), get width() { return this.right - this.left; }, get height() { return this.bottom - this.top; }}; };
    for (const e of inter) {
      if (getComputedStyle(e).pointerEvents === 'none') continue;
      const r0 = e.getBoundingClientRect(), r = hit(e);
      if (e.matches('input[type=range]')) { if (r.height < 40 && r.width < 40) out.small.push([name(e), Math.round(r.width), Math.round(r.height)]); }
      else if (!e.matches('label.row') && (r.width < 47.5 || r.height < 47.5)) { const lab = e.matches('input,select') && e.closest('label'); const lr = lab && lab.getBoundingClientRect(); if (!(lr && lr.height >= 47.5 && lr.width >= 47.5)) out.small.push([name(e), Math.round(r.width), Math.round(r.height)]); }
      if ((r0.right > W + 1 || r0.left < -1) && !scrollerX(e)) out.offscreen.push([name(e), Math.round(r.left), Math.round(r.right)]);
      const ca = clipAnc(e); if (ca && !scrollerX(e) && !/(auto|scroll)/.test(getComputedStyle(ca).overflowY)) out.cut.push([name(e), name(ca)]);
    }
    // 잘린 글자: 글자가 든 말단 요소가 자기 상자보다 넓음(말줄임·숨김)
    for (const e of [...root.querySelectorAll('*')]) {
      if (!e.childNodes.length || [...e.childNodes].every(n => n.nodeType !== 3 || !n.textContent.trim())) continue;
      if (!vis(e) || e.closest('svg,canvas,select,option,pre,.lyr-scroll,.pl,#xPick,.marquee,.sr,.sr-only')) continue;
      const cs = getComputedStyle(e);
      if (cs.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 2) out.clipped.push([name(e), e.clientWidth, e.scrollWidth, cs.textOverflow === 'ellipsis' ? '…' : 'cut']);
      if (cs.overflowY === 'hidden' && e.scrollHeight > e.clientHeight + 3 && cs.webkitLineClamp === 'none') out.clipped.push([name(e), 'h', e.clientHeight, e.scrollHeight]);
    }
    // 겹친 버튼(부모·자식 관계 제외)
    const rs = inter.filter(e => !e.matches('label.row') && getComputedStyle(e).pointerEvents !== 'none' && !e.matches('#dkSosButton,#dkGuardCover,#tkSos')).map(e => [e, e.getBoundingClientRect()]);
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const [a, ra] = rs[i], [b, rb] = rs[j]; if (a.contains(b) || b.contains(a)) continue;
      const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (x > 4 && y > 4 && x * y > .2 * Math.min(ra.width * ra.height, rb.width * rb.height)) out.overlap.push([name(a), name(b)]);
    }
    return out;
  };
}

(async () => {
  const {server, origin} = await startServer();
  const browser = await chromium.launch({headless: true});
  const report = [];
  for (const skin of SKINS) for (const [w, h] of SIZES) for (const z of ZOOMS) {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, deviceScaleFactor: 1, hasTouch: true, isMobile: false});
    await ctx.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(([skin]) => { localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify(skin)); localStorage.setItem('dna_ckFocus', JSON.stringify('all')); }, [skin]);
    await p.addInitScript(inPage, z);
    await p.goto(origin); await p.waitForTimeout(700);
    await p.evaluate(() => { const l = document.getElementById('wLog'); if (l) l.classList.remove('collapsed'); });
    await p.evaluate(() => __zoomAll()); await p.waitForTimeout(250);
    for (const sc of SCREENS) {
      let scope = null;
      try {
        if (sc === 'settings') { await p.evaluate(() => document.getElementById('setBtn').click()); await p.evaluate(() => __zoomAll()); scope = '#settings'; }
        if (sc === 'skin') { await p.evaluate(() => document.getElementById('skinBtn').click()); await p.evaluate(() => __zoomAll()); scope = '#skinPick'; }
        if (sc === 'drive') { await p.evaluate(() => document.getElementById('driveBtn').click()); await p.waitForTimeout(300); await p.evaluate(() => __zoomAll()); scope = '#drive'; }
        await p.waitForTimeout(200);
        const a = await p.evaluate(s => __audit(s), scope);
        report.push({skin, w, h, z, sc, ...a, errs: errs.slice()});
        if (SHOT && (z === 1 || z === 2)) await p.screenshot({path: `${SHOT}/${skin}_${w}x${h}_${z}_${sc}.png`, fullPage: sc === 'main'});
      } catch (e) { report.push({skin, w, h, z, sc, error: e.message}); }
      // 다음 화면 전에 닫기
      await p.evaluate(() => { const c = document.getElementById('setClose'); if (c && !document.getElementById('settings').hidden) c.click(); const b = document.getElementById('skinPick'); if (b) b.hidden = true; const d = document.getElementById('drive'); if (d && !d.hidden) { const x = d.querySelector('#dvExit,#dvClose,[data-act=exit]'); if (x) x.click(); else d.hidden = true; } });
    }
    await ctx.close();
  }
  await browser.close(); server.close();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  console.log('rows', report.length);
})();
