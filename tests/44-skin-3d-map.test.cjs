const {run, assert} = require('./lib/harness.cjs');
const fs = require('node:fs'), path = require('node:path');

// 1.80 대신남 3D 맵 스킨: 기능은 에어라인과 같고(안에서는 carnival7), 스피드미터 풍경만 3D 엔진(pfd3d.js). 지도 타일·고도는 가짜 타일로
run('3D map skin renders the speedometer scene in 3D', async ({newPage, origin}) => {
  const osm = fs.readFileSync(path.join(__dirname, 'fixtures', 'osm-tile.png')), dem = fs.readFileSync(path.join(__dirname, 'fixtures', 'dem-tile.png'));
  const p = await newPage(() => { window.__build = 'special'; window.__3dPause = 1; window.addEventListener('error', e => console.log('PAGEERR', e.message)); localStorage.setItem('dna_skin2', JSON.stringify('carnival8')); });
  await p.route(/^https:\/\//, r => { const u = r.request().url();
    if (u.includes('openstreetmap.org/')) return r.fulfill({body: osm, contentType: 'image/png', headers: {'access-control-allow-origin': '*'}});
    if (u.includes('terrarium')) return r.fulfill({body: dem, contentType: 'image/png', headers: {'access-control-allow-origin': '*'}}); return r.abort(); });
  await p.setViewportSize({width: 840, height: 900}); await p.goto(origin, {waitUntil: 'domcontentloaded', timeout: 60000}); await p.waitForFunction(() => window.AmpPfd && window.Amp3DHook, null, {timeout: 60000});
  // 에어라인과 같은 기능: 콕핏 스페셜 표시·레일·스킨 버튼 표시
  const r0 = await p.evaluate(() => ({sk3d: document.documentElement.hasAttribute('data-sk3d'), cks: document.documentElement.dataset.cks, cp: document.documentElement.dataset.cp, sel: document.getElementById('skin').value, rail: !!document.querySelector('#ckRail button[data-f="gps"]')}));
  assert.deepEqual(r0, {sk3d: true, cks: '1', cp: '1', sel: 'carnival8', rail: true});
  await p.locator('#ckRail button[data-f="gps"]').click();
  const gl = await p.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
  await p.waitForFunction(() => Amp3DHook.state === 'ready' || Amp3DHook.state === 'failed', null, {timeout: 60000});
  if (!gl) { assert.equal(await p.evaluate(() => Amp3DHook.state), 'failed', 'no WebGL → original scene'); await p.close(); return; }
  assert.equal(await p.evaluate(() => Amp3DHook.state), 'ready', 'engine ' + await p.evaluate(() => window.__3dErr || ''));
  await p.evaluate(() => { AmpSpecialSky.set('noon'); AmpFlight.step(1, 30); AmpFlight.step(5, 40); AmpFlight.step(14, 60); pfd.draw(); });
  await p.waitForFunction(() => Amp3DHook.engine.loaded > 40, null, {timeout: 30000}).catch(() => {}); await p.evaluate(() => pfd.draw());
  const st = await p.evaluate(() => { const e = Amp3DHook.engine, L = window.__3dLast; return {loaded: e.loaded, src: e.source, rwTop: e.runway.renderOrder >= 1000 && e.runway.material.depthTest === true && (e.render(Object.assign({}, L, {phase: 'roll', alt: 0})), !e.runway.material.depthTest), tiles: e.tiles, inst: e.scene.children.filter(o => o.isInstancedMesh).length, pitch: L.pitch, credit: !document.querySelector('#pfdHost .p3d-credit').hidden}; });
  assert.ok(st.tiles >= 75, 'map tiles around me: ' + st.tiles);
  assert.ok(st.loaded > 20 && st.src === 1, 'falls back to OSM tiles: ' + JSON.stringify(st));
  assert.ok(st.rwTop, 'runway never hidden while taking off/landing, normal once airborne');
  assert.ok(st.inst >= 1, 'buildings/trees raised from the map: ' + st.inst);
  assert.ok(Math.abs(st.pitch) < 8, 'horizon pitch stays sane: ' + st.pitch);
  assert.ok(st.credit, 'map attribution shown');
  // 그림: 위는 밝은 하늘, 아래는 땅
  const px = await p.evaluate(() => { const cv = document.querySelector('#pfdHost canvas'), x = cv.getContext('2d'), w = cv.width, h = cv.height, g = (yy) => { const d = x.getImageData(Math.round(w * .5), Math.round(h * yy), 1, 1).data; return [d[0], d[1], d[2]]; }; return {top: g(.18), bot: g(.75)}; });
  const lum = c => c[0] + c[1] + c[2]; assert.ok(lum(px.top) > lum(px.bot) + 60, 'bright sky above, ground below ' + JSON.stringify(px));
  // 다른 스킨으로 바꾸면 원래 풍경
  await p.evaluate(() => { const s = document.getElementById('skin'); s.value = 'carnival7'; s.dispatchEvent(new Event('change')); });
  assert.equal(await p.evaluate(() => document.documentElement.hasAttribute('data-sk3d')), false);
  await p.close();
});
