const {run, assert} = require('./lib/harness.cjs');

// 테스트 환경엔 Leaflet 파일이 없어서 아주 작은 대역(L)을 넣고, 검색·경로 서버 응답은 가짜로 돌려줌
const LEAFLET_STUB = `window.L=(()=>{const ev=()=>({on(){return this},addTo(){return this},remove(){},getElement(){return null}});
  const map=()=>{const m={...ev(),c:{lat:37.5,lng:127},z:16,setView(c,z){m.c={lat:c[0],lng:c[1]};m.z=z;return m},getCenter(){return m.c},getZoom(){return m.z},zoomIn(){},zoomOut(){},invalidateSize(){},fitBounds(){window.__fit=(window.__fit||0)+1;return m}};return m};
  return {map,tileLayer:()=>ev(),control:{zoom:()=>ev()},marker:()=>({...ev(),setLatLng(){}}),divIcon:()=>({}),polyline:()=>ev(),layerGroup:a=>({...ev(),n:a.length}),latLngBounds:a=>a}})();`;
// 출발 (37.5000,127.0000) → 북쪽 1km → 우회전 → 동쪽 1km 도착
const ROUTE = {code: 'Ok', routes: [{distance: 2000, duration: 240, geometry: {coordinates: [[127, 37.5], [127, 37.5045], [127, 37.509], [127.0057, 37.509], [127.0113, 37.509]]},
  legs: [{steps: [
    {name: '테스트로', maneuver: {type: 'depart', location: [127, 37.5]}},
    {name: '도착길', maneuver: {type: 'turn', modifier: 'right', location: [127, 37.509]}},
    {name: '', maneuver: {type: 'arrive', location: [127.0113, 37.509]}}]}]}]};

run('Free map route finding', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('route: ' + e.message));
  const hits = [];
  await p.route('**/leaflet/leaflet.css', r => r.fulfill({status: 200, contentType: 'text/css', body: ''}));
  await p.route('**/leaflet/leaflet.js', r => r.fulfill({status: 200, contentType: 'text/javascript', body: LEAFLET_STUB}));
  await p.route('https://nominatim.openstreetmap.org/**', r => { hits.push('geo'); r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify([{name: '테스트역', display_name: '테스트역, 서울', lat: '37.509', lon: '127.0113'}])}); });
  await p.route('https://routing.openstreetmap.de/**', r => { hits.push('route'); r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(ROUTE)}); });
  await p.addInitScript(() => {
    if (!sessionStorage.getItem('rt')) { sessionStorage.setItem('rt', '1'); localStorage.clear(); localStorage.setItem('dna_mapPref', JSON.stringify('on')); localStorage.setItem('dna_ckFocus', JSON.stringify('map')); }
    window.__said = []; window.gfx = {fix: true, perm: true, enabled: true, provider: 'gps', speed: 10, bearing: 0, acc: 5, lat: 37.5, lon: 127, ts: 1000, satsUsed: 9};
    window.AndroidBridge = {gpsStatus: () => JSON.stringify(window.gfx), startGps() {}, stopGps() {}, keepScreenOn() {}, takeCarAutoplay: () => false, speak: t => window.__said.push(t), openApp() {}};
  });
  await p.goto(origin);
  await p.waitForFunction(() => !document.getElementById('rtBar').hidden, null, {timeout: 8000});
  // 콕핏 2에서는 지도 아래 TMAP·네이버 지도 줄이 없음(측면 버튼으로)
  assert.equal(await p.locator('#mapTmap').isVisible(), false, 'TMAP button hidden in the cockpit skin (side buttons)');
  await p.evaluate(() => { if (!AmpHost.gpsOn) AmpHost.gpsStart(); });
  await p.waitForFunction(() => AmpHost.gs.fix && Math.abs(AmpHost.gs.lat - 37.5) < 1e-6, null, {timeout: 8000}); // GPS 수신
  // 검색 → 결과 → 경로
  await p.locator('#rtQ').fill('테스트역');
  await p.locator('#rtGo').click();
  await p.waitForFunction(() => document.querySelectorAll('#rtRes li[data-i]').length === 1);
  assert.match(await p.locator('#rtRes li[data-i] b').textContent(), /테스트역/);
  await p.locator('#rtRes li[data-i]').click();
  await p.waitForFunction(() => AmpRoute.state.on, null, {timeout: 5000});
  assert.deepEqual(hits, ['geo', 'route']);
  assert.equal(await p.locator('#rtSearch').isVisible(), false, 'Search box folds while guiding');
  assert.match(await p.locator('#rtSum').textContent(), /테스트역 · 2\.0km · 4분/);
  assert.ok(await p.evaluate(() => window.__fit > 0), 'Whole route shown first');
  assert.ok((await p.evaluate(() => __said)).some(t => /테스트역까지 안내를 시작/.test(t)), 'Voice start');
  // 북쪽으로 달리면 다음 안내는 우회전, 거리 줄어듦
  await p.evaluate(() => AmpRoute.tick(37.506, 127));
  let st = await p.evaluate(() => AmpRoute.state);
  assert.match(st.text, /우회전 · 도착길/);
  assert.equal(st.dist, '330m');
  assert.equal(await p.locator('#rtTurn').textContent(), '→');
  if (process.env.AMP_SCREENSHOTS) await p.locator('#wMap').screenshot({path: require('node:path').join(process.env.AMP_SCREENSHOTS, 'route.png')});
  await p.evaluate(() => AmpRoute.tick(37.5085, 127));
  assert.ok((await p.evaluate(() => __said)).some(t => /우회전하세요/.test(t)), 'Turn now prompt');
  // 회전 후엔 도착 안내
  await p.evaluate(() => AmpRoute.tick(37.509, 127.004));
  st = await p.evaluate(() => AmpRoute.state);
  assert.match(st.text, /목적지 도착/);
  // 경로에서 벗어나면 다시 찾기(3번 연속)
  await p.evaluate(() => { for (let i = 0; i < 3; i++) AmpRoute.tick(37.52, 127.03); });
  assert.ok(await p.evaluate(() => AmpRoute.state.off) > 70, 'Off-route distance tracked');
  assert.ok(!(await p.evaluate(() => __said)).some(t => /도착했습니다/.test(t)), 'Far off the route is not an arrival');
  // 최근 목적지
  await p.locator('#rtStop').click();
  assert.equal(await p.evaluate(() => AmpRoute.state.on), false);
  await p.locator('#rtQ').focus();
  await p.waitForFunction(() => /최근 목적지/.test(document.getElementById('rtRes').textContent));
  if (process.env.AMP_SCREENSHOTS) await p.locator('#wMap').screenshot({path: require('node:path').join(process.env.AMP_SCREENSHOTS, 'route-recent.png')});
  // 도착하면 안내 끝
  await p.locator('#rtRes li[data-i]').click();
  await p.waitForFunction(() => AmpRoute.state.on);
  await p.evaluate(() => AmpRoute.tick(37.509, 127.0112));
  assert.ok((await p.evaluate(() => __said)).some(t => /도착했습니다/.test(t)), 'Arrival');
  await p.waitForFunction(() => !AmpRoute.state.on, null, {timeout: 6000});
  await p.close();
});
