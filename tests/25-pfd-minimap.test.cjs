const {run, assert} = require('./lib/harness.cjs');
const fs = require('node:fs'), path = require('node:path');
const SHOT = process.env.SHOT_DIR;
const TILE = fs.readFileSync(path.join(__dirname, 'lib/fake-tile.png'));

// 1.50 스피드미터(콕핏 PFD) 왼쪽 아래 원형 지도: GPS 따라 실시간, 진행 방향이 위, 켜고 끄기(저장), 분할 화면에서는 숨김
run('Round map on the speedometer PFD', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('pm: ' + e.message));
  let tiles = 0;
  await context.route('https://tile.openstreetmap.org/**', r => { tiles++; r.fulfill({status: 200, contentType: 'image/png', body: TILE}); });
  await p.addInitScript(() => {
    window.__fix = {fix: true, lat: 37.5, lon: 127, speed: 0, bearing: -1, azimuth: -1, alt: 40, acc: 4, satsUsed: 12, satsSeen: 20, ts: 1};
    window.AndroidBridge = {startGps: () => {}, stopGps: () => {}, gpsStatus: () => JSON.stringify(Object.assign({}, window.__fix, {ts: ++window.__fix.ts}))};
    if (!sessionStorage.getItem('pm')) { sessionStorage.setItem('pm', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); }
  });
  await p.setViewportSize({width: 1036, height: 1000});
  await p.goto(origin);
  await p.waitForFunction(() => window.AmpPfd && window.PfdMap);
  await p.evaluate(() => AmpTk.gpsStart());
  await p.evaluate(() => Object.assign(__fix, {speed: 50 / 3.6, bearing: 90}));
  await p.waitForFunction(() => PfdMap.map && document.querySelector('.pfd-mini:not(.nofix)'), null, {timeout: 8000});
  // 위치: 속도 칸 오른쪽, 나침반 위(왼쪽 아래), 원형
  const g = await p.evaluate(() => { const w = document.querySelector('#pfdHost .pfd-canvas-wrap').getBoundingClientRect(), m = document.querySelector('.pfd-mini .pm-ring').getBoundingClientRect(); return {w: [w.x, w.y, w.width, w.height], m: [m.x, m.y, m.width, m.height], r: getComputedStyle(document.querySelector('.pfd-mini .pm-ring')).borderRadius}; });
  assert.ok(g.m[0] > g.w[0] + 60 && g.m[0] < g.w[0] + g.w[2] * .4, 'Left side, right of the speed tape: ' + JSON.stringify(g));
  assert.ok(g.m[1] + g.m[3] > g.w[1] + g.w[3] * .6 && g.m[1] + g.m[3] < g.w[1] + g.w[3] - 30, 'Lower part, above the compass');
  assert.ok(g.m[2] >= 96 && Math.abs(g.m[2] - g.m[3]) < 1 && g.r === '50%', 'Round');
  assert.ok(tiles > 0, 'Uses the basic map tiles');
  // 실시간: 위치·방향 따라감(동쪽으로 가면 지도는 -90° 돌아 진행 방향이 위)
  await p.waitForTimeout(1600);
  const c1 = await p.evaluate(() => PfdMap.map.getCenter());
  assert.ok(Math.abs(c1.lat - 37.5) < 1e-3 && Math.abs(c1.lng - 127) < 1e-3, 'Centered on the car');
  assert.match(await p.evaluate(() => document.querySelector('.pfd-mini .pm-map').style.transform), /rotate\(-(8\d|9\d)(\.\d+)?deg\)/, 'Heading up');
  await p.evaluate(() => Object.assign(__fix, {lat: 37.501, lon: 127.002}));
  await p.waitForTimeout(1800);
  const c2 = await p.evaluate(() => PfdMap.map.getCenter());
  assert.ok(Math.abs(c2.lat - 37.501) < 2e-4 && Math.abs(c2.lng - 127.002) < 2e-4, 'Follows GPS in real time ' + JSON.stringify(c2));
  if (SHOT) await p.locator('#pfdHost').screenshot({path: SHOT + '/pfdmap.png'});
  // 1.51 지도 모양: 기본 GTA → 원 누르면 일반 지도, 스피드미터 주간·야간 따라 자동
  assert.equal(await p.evaluate(() => PfdMap.look), 'gta');
  await p.locator('.pfd-mini .pm-ring').click();
  await p.evaluate(() => AmpPfd.setTheme('day')); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => [PfdMap.style, PfdMap.look, document.getElementById('sPfdMapStyle').value].join()), 'normal,day,normal');
  if (SHOT) await p.locator('#pfdHost').screenshot({path: SHOT + '/pfdmap_day.png'});
  await p.evaluate(() => AmpPfd.setTheme('night')); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => PfdMap.look), 'night', 'Night map with the night speedometer');
  if (SHOT) await p.locator('#pfdHost').screenshot({path: SHOT + '/pfdmap_night.png'});
  await p.evaluate(() => { const s = document.getElementById('sPfdMapStyle'); s.value = 'gta'; s.dispatchEvent(new Event('change')); }); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => PfdMap.look), 'gta');
  // 오른쪽 아래 총 주행거리 = 차계부 누적 거리
  await p.evaluate(() => AmpLog.setOdo(62345.6)); await p.waitForTimeout(400);
  assert.match((await p.locator('.pfd-odo b').textContent()).trim(), /^62,34\d$/);
  assert.equal(await p.locator('.pfd-odo').isVisible(), false, '1.70 lower-right total distance removed from the speedometer');
  // GPS 끊김: 흐리게 GPS 표시
  await p.evaluate(() => Object.assign(__fix, {fix: false}));
  await p.waitForFunction(() => document.querySelector('.pfd-mini.nofix'), null, {timeout: 4000});
  await p.evaluate(() => Object.assign(__fix, {fix: true}));
  // 끄기(×) → [지도] 버튼만, 다시 열어도 유지, 설정 스위치와 같이
  await p.locator('.pfd-mini .pm-x').click();
  assert.equal(await p.evaluate(() => [PfdMap.on, !!PfdMap.map, document.querySelector('.pfd-mini').classList.contains('off'), document.getElementById('sPfdMap').checked].join()), 'false,false,true,false');
  await p.reload(); await p.waitForFunction(() => window.PfdMap && document.querySelector('.pfd-mini'), null, {timeout: 6000});
  assert.equal(await p.evaluate(() => PfdMap.on), false, 'Off is kept');
  await p.evaluate(() => { document.getElementById('sPfdMap').checked = true; document.getElementById('sPfdMap').dispatchEvent(new Event('change')); });
  assert.equal(await p.evaluate(() => PfdMap.on), true);
  await p.close();
});
