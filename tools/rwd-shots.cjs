/* 반응형 점검용 창별 캡처: node tools/rwd-shots.cjs 스킨 폭x높이 배율 출력폴더 [창id,...] */
'use strict';
const {chromium} = require('playwright');
const {startServer} = require('../tests/lib/harness.cjs');
const [skin, size, zs, dir, only] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number), z = +zs || 1;
(async () => {
  const {server, origin} = await startServer();
  const b = await chromium.launch({headless: true});
  const ctx = await b.newContext({viewport: {width: w, height: h}, deviceScaleFactor: 1, hasTouch: true});
  await ctx.route('**/*', r => r.request().url().startsWith(origin) ? r.continue() : r.abort());
  const p = await ctx.newPage();
  await p.addInitScript(([skin]) => { localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify(skin)); }, [skin]);
  await p.addInitScript(zoom => { window.__zoomAll = () => { if (zoom === 1) return; const els = [...document.querySelectorAll('body *')].filter(e => !e.dataset.fz && !(e instanceof SVGElement)); const sizes = els.map(e => [e, parseFloat(getComputedStyle(e).fontSize), e.parentElement && e.parentElement.dataset.fz ? parseFloat(getComputedStyle(e.parentElement).fontSize) : 0]); for (const [e, fs, pfs] of sizes) { e.dataset.fz = '1'; if (pfs && Math.abs(fs - pfs) < .01) continue; e.style.setProperty('font-size', (fs * zoom).toFixed(2) + 'px', 'important'); } }; }, z);
  await p.goto(origin); await p.waitForTimeout(800);
  await p.evaluate(() => { const l = document.getElementById('wLog'); if (l) l.classList.remove('collapsed'); });
  await p.evaluate(() => __zoomAll()); await p.waitForTimeout(300);
  await p.screenshot({path: `${dir}/${skin}_${size}_${z}_top.png`});
  const ids = only ? only.split(',') : await p.evaluate(() => [...document.querySelectorAll('#app>.win')].filter(e => e.offsetParent && !e.hidden).map(e => e.id));
  for (const id of ids) { try { await p.locator('#' + id).screenshot({path: `${dir}/${skin}_${size}_${z}_${id}.png`}); } catch (e) { console.log('skip', id, e.message.slice(0, 80)); } }
  if (process.env.SET) { await p.evaluate(() => document.getElementById('setBtn').click()); await p.evaluate(() => __zoomAll()); await p.waitForTimeout(200); await p.screenshot({path: `${dir}/${skin}_${size}_${z}_settings.png`}); }
  await b.close(); server.close();
})();
