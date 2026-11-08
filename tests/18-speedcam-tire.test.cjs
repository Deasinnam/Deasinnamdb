const {run, assert} = require('./lib/harness.cjs');

// 1.33 과속 카메라 안내(음성 + 빨간 제한 속도 표지판), 공공데이터 CSV, 이륙·착륙 타이어 마찰음
run('Speed camera alerts and tire sounds', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('cam: ' + e.message));
  await p.addInitScript(() => { window.__said = []; window.AndroidBridge = {speak: t => window.__said.push(t)};
    if (!sessionStorage.getItem('cam')) { sessionStorage.setItem('cam', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 900});
  await p.goto(origin);
  await p.waitForTimeout(500);
  // 카메라: (37.5000, 127.0000) 제한 50, 남쪽 500m에서 북쪽으로 70km/h
  await p.evaluate(() => { AmpCam.osm = [[37.5, 127.0, 50]]; AmpCam.check(37.5 - 0.0045, 127.0, 70, 0); });
  assert.equal(await p.locator('#camSign').isVisible(), true, 'Red speed-limit sign');
  assert.equal(await p.locator('#camLim').textContent(), '50');
  // 1.34: 화면 전체를 붉게 덮고 가운데 큰 숫자
  const cov = await p.evaluate(() => { const r = document.getElementById('camSign').getBoundingClientRect(), n = document.getElementById('camLim').getBoundingClientRect(); return {w: r.width, h: r.height, fs: parseFloat(getComputedStyle(document.getElementById('camLim')).fontSize), cx: n.left + n.width / 2}; });
  assert.ok(cov.w >= 1036 - 1 && cov.h >= 900 - 1, 'Covers the whole screen');
  assert.ok(cov.fs >= 140 && Math.abs(cov.cx - 518) < 30, 'Big limit number in the middle');
  assert.match(await p.locator('#camDist').textContent(), /전방 5\d0m/);
  assert.equal(await p.evaluate(() => __said[0]), '500미터 앞 단속 카메라, 50이에요.', 'Short, natural voice');
  assert.equal(await p.locator('#camSign').evaluate(e => e.classList.contains('over')), true, 'Flashes when over the limit');
  await p.evaluate(() => AmpCam.check(37.5 - 0.0012, 127.0, 70, 0));
  assert.equal(await p.evaluate(() => __said[1] || ''), '속도 줄이세요.', 'Second warning when close and still fast');
  // 카메라가 뒤쪽이면 표시 없음
  await p.evaluate(() => AmpCam.check(37.5 + 0.003, 127.0, 70, 0));
  assert.equal(await p.locator('#camSign').isVisible(), false, 'Nothing when the camera is behind');
  // 공공데이터 CSV 형식
  const rows = await p.evaluate(() => AmpCam.parseCsv('무인교통단속카메라관리번호,시도명,단속구분,제한속도,위도,경도\nA1,서울,과속단속,60,37.51,127.01\nA2,서울,신호단속,0,37.52,127.02\nA3,부산,과속단속,"80",35.1,129.0'));
  assert.deepEqual(rows, [[37.51, 127.01, 60], [35.1, 129, 80]]);
  assert.equal(await p.locator('#sCam').isChecked(), true);
  // 설정의 [예시 보기]: 표지판·소리·음성이 실제처럼
  await p.evaluate(() => { __said.length = 0; });
  await p.locator('#setBtn').click(); await p.locator('#sCamDemo').scrollIntoViewIfNeeded(); await p.locator('#sCamDemo').click();
  await p.waitForTimeout(1500);
  assert.equal(await p.locator('#camSign').isVisible(), true, 'Demo shows the sign above settings');
  assert.equal(await p.evaluate(() => __said[0]), '600미터 앞 단속 카메라, 50이에요.');
  await p.waitForTimeout(5000);
  assert.equal(await p.locator('#camSign').evaluate(e => e.classList.contains('over')), true);
  assert.match(await p.evaluate(() => __said[1] || ''), /줄이세요/);
  await p.waitForTimeout(2600);
  assert.equal(await p.locator('#camSign').isVisible(), false, 'Demo ends by itself');
  // 타이어 마찰음(오류 없이 재생)
  await p.evaluate(() => { AmpHost.beep('tireDown'); AmpHost.beep('tireUp'); });
  // 1.34: 다음 곡 옆 [전환] 키, DASHCAM은 네이버지도 옆
  await p.keyboard.press('Escape'); await p.evaluate(() => { const s = document.getElementById('settings'); if (s && !s.hidden) document.getElementById('setClose')?.click(); }); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => document.getElementById('bNext').nextElementSibling.id), 'bSwap');
  assert.equal(await p.locator('#bSwapT').textContent(), '라디오', 'Goes to radio while on music');
  await p.evaluate(() => localStorage.setItem('dna_extPkg', JSON.stringify('com.spotify.music')));
  await p.locator('#bSwap').click(); await p.waitForTimeout(1000);
  assert.equal(await p.locator('#bSwapT').textContent(), 'Spotify', 'On radio: offers going back to the last music app');
  await p.locator('#bSwap').click(); await p.waitForTimeout(1000);
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_lastSrc'))), 'ext', 'Back to the music app');
  assert.equal(await p.locator('#bSwapT').textContent(), '라디오');
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#ckRail > button')].slice(-2).map(b => b.dataset.open || b.dataset.f)), ['nmap', 'cam']);
  await p.close();
});
