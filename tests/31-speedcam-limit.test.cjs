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
