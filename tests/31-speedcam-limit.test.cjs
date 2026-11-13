const {run, assert} = require('./lib/harness.cjs');

// 1.59 과속 카메라 제한속도 오인(시속 60 도로에서 30으로 안내) 줄이기
run('Speed camera: side-street 30 cameras do not override the main road', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('cam: ' + e.message));
  await p.addInitScript(() => { window.__said = []; window.AndroidBridge = {speak: t => window.__said.push(t)};
    if (!sessionStorage.getItem('c')) { sessionStorage.setItem('c', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 900});
  await p.goto(origin); await p.waitForTimeout(500);
  // 북쪽으로 달리며 500m 앞 두 번 확인(가까워지는 중이어야 안내)
  const drive = (cams, lat0, spd) => p.evaluate(([cams, lat0, spd]) => { __said.length = 0; AmpCam.osm = cams; AmpCam.check(lat0 - 0.0047, 125.0, spd, 0); AmpCam.check(lat0 - 0.0045, 125.0, spd, 0); return {said: __said.slice(), lim: document.getElementById('camSign').hidden ? null : document.getElementById('camLim').textContent}; }, [cams, lat0, spd]);
  // ① 같은 교차로: 진행선 위 60 카메라 + 옆길(25m 옆) 30 카메라, 시속 60 → 60으로 안내
  let r = await drive([[35.9999, 125.0003, 30], [36.0, 125.0, 60]], 36.0, 60);
  assert.equal(r.lim, '60', 'main-road 60 wins over the side-street 30: ' + JSON.stringify(r));
  assert.match(r.said.join(' '), /60이에요/);
  // ② 30 카메라만 옆길(30m 옆)에 있음, 시속 60 → 안내 안 함
  r = await drive([[36.3, 125.00033, 30]], 36.3, 60);
  assert.equal(r.lim, null, 'side-street 30 camera ignored: ' + JSON.stringify(r));
  // ③ 진행선 위 어린이보호구역 30 카메라(3m 옆), 시속 40 → 30으로 안내
  r = await drive([[36.6, 125.00003, 30]], 36.6, 40);
  assert.equal(r.lim, '30', 'school-zone camera on our road still alerts: ' + JSON.stringify(r));
  // ④ 넓은 길 건너편 60 카메라(45m 옆)는 여전히 안내(1.54 동작 유지)
  r = await drive([[36.9, 125.0005, 60]], 36.9, 60);
  assert.equal(r.lim, '60', 'far-side 60 camera on a wide road: ' + JSON.stringify(r));
  await p.close();
});

// 1.60 길 이름 맞추기: 지금 길(OpenStreetMap)과 카메라 자료의 도로노선명이 다르면 그 카메라는 안내하지 않음
run('Speed camera: road-name match from the official data', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('cam2: ' + e.message));
  await p.addInitScript(() => { window.__said = []; window.AndroidBridge = {speak: t => window.__said.push(t)};
    if (!sessionStorage.getItem('c')) { sessionStorage.setItem('c', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 900});
  await p.goto(origin); await p.waitForTimeout(800);
  assert.ok(await p.evaluate(() => AmpCam.builtin) > 30000, 'built-in data loaded');
  const drive = (cams, lat0, spd, roadName) => p.evaluate(([cams, lat0, spd, roadName]) => { __said.length = 0; AmpCam.osm = cams;
    Object.assign(AmpCam.road, {name: roadName, ref: '', ok: !!roadName, at: [lat0 - 0.0046, 125.0], t: Date.now(), busy: false});
    AmpCam.check(lat0 - 0.0047, 125.0, spd, 0); AmpCam.check(lat0 - 0.0045, 125.0, spd, 0);
    return {said: __said.slice(), lim: document.getElementById('camSign').hidden ? null : document.getElementById('camLim').textContent}; }, [cams, lat0, spd, roadName]);
  // ① 진행선 바로 위(3m)라도 다른 길(학교 앞 이면도로) 이름의 30 카메라 → 안내 안 함
  let r = await drive([[36.0, 125.00003, 30, 2, '학교길', '']], 36.0, 50, '중앙로');
  assert.equal(r.lim, null, 'other-road 30 camera ignored: ' + JSON.stringify(r));
  // ② 같은 길 이름이면 보호구역 30도 넓은 허용 거리(20m 옆)로 안내
  r = await drive([[36.3, 125.00022, 30, 2, '중앙로', '']], 36.3, 58, '중앙로');
  assert.equal(r.lim, '30', 'same-road school zone alerts: ' + JSON.stringify(r));
  // ③ 같은 교차로의 같은 길 60 + 다른 길 30 → 60
  r = await drive([[35.9999, 125.0001, 30, 2, '학교길', ''], [36.6, 125.0004, 60, 0, '중앙로', '']].map((c, i) => i ? c : [36.5999, 125.0001, 30, 2, '학교길', '']), 36.6, 60, '중앙로');
  assert.equal(r.lim, '60', 'same-road 60 wins: ' + JSON.stringify(r));
  // ④ 노선번호로도 맞춤(국도 46호 = OSM ref 46)
  r = await drive([[36.9, 125.0002, 80, 0, '순환대로', '46']], 36.9, 80, '');
  assert.equal(r.lim, '80', 'unknown road name falls back to geometry: ' + JSON.stringify(r));
  assert.equal(await p.evaluate(() => { Object.assign(AmpCam.road, {name: '', ref: '46', ok: true, t: Date.now()}); return AmpCam.sameRoad([0, 0, 80, 0, '순환대로', '46']); }), true);
  await p.close();
});

// 1.61 앞길 예측: 지금 길 조각을 따라 앞길을 이어, 굽은 길 너머 카메라는 잡고 평행한 옆길 카메라는 뺌. 원형 지도에 앞길·카메라 표시
run('Speed camera: follows the predicted road ahead', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('cam3: ' + e.message));
  await p.addInitScript(() => { window.__said = []; window.AndroidBridge = {speak: t => window.__said.push(t)};
    if (!sessionStorage.getItem('c')) { sessionStorage.setItem('c', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 900});
  await p.goto(origin); await p.waitForTimeout(800);
  const run1 = (cams, ways, y1, y2, spd) => p.evaluate(([cams, ways, y1, y2, spd]) => {
    const KY = 110540, KX = 111320 * Math.cos(36 * Math.PI / 180), LL = (x, y) => [36 + y / KY, 125 + x / KX];
    __said.length = 0; AmpCam.osm = cams.map(c => [...LL(c[0], c[1]), c[2], 0, '', '']);
    const [la1, lo1] = LL(0, y1), [la2, lo2] = LL(0, y2);
    Object.assign(AmpCam.road, {name: '중앙로', ref: '', ok: true, at: [la2, lo2], t: Date.now(), busy: false,
      ways: ways.map((w, i) => ({id: i + 1, ow: '', g: w.map(q => LL(q[0], q[1]))})), waysAt: [la2, lo2], waysT: Date.now()});
    AmpCam.check(la1, lo1, spd, 0); AmpCam.check(la2, lo2, spd, 0);
    return {lim: document.getElementById('camSign').hidden ? null : document.getElementById('camLim').textContent, dist: document.getElementById('camDist').textContent, view: {path: (AmpCam.view.path || []).length, cams: AmpCam.view.cams.length}};
  }, [cams, ways, y1, y2, spd]);
  // 북쪽으로 400m 가다 동쪽으로 꺾이는 길(두 조각). 카메라는 꺾인 뒤 350m — 직선으로 보면 오른쪽 67°라 예전엔 놓침
  const bend = [[[0, -300], [0, 0], [0, 200], [0, 400]], [[0, 400], [300, 400], [900, 400]]];
  let r = await run1([[350, 400, 50]], bend, 228, 250, 60);
  assert.equal(r.lim, '50', 'camera past the bend is found along the road: ' + JSON.stringify(r));
  assert.match(r.dist, /전방 500m/, 'distance measured along the road');
  assert.ok(r.view.path > 3 && r.view.cams === 1, 'minimap gets the path and camera');
  // 곧은 길, 55m 옆 평행 도로의 카메라(시속 80) → 예전엔 안내(허용 62m), 앞길 기준이면 제외
  const straight = [[[0, -300], [0, 0], [0, 1500]]];
  r = await run1([[55, 700, 80]], straight, 228, 250, 80);
  assert.equal(r.lim, null, 'parallel-road camera ignored: ' + JSON.stringify(r));
  // 같은 길 위 건너편(25m 옆) 카메라는 그대로
  r = await run1([[25, 700, 80]], straight, 228, 250, 80);
  assert.equal(r.lim, '80', 'same-road far-side camera kept: ' + JSON.stringify(r));
  await p.close();
});
