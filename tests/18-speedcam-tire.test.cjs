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
  // 카메라: (36.0000, 125.0000) 제한 50, 남쪽 500m에서 북쪽으로 70km/h
  await p.evaluate(() => { AmpCam.osm = [[36.0, 125.0, 50]]; AmpCam.check(36.0 - 0.0047, 125.0, 70, 0); AmpCam.check(36.0 - 0.0045, 125.0, 70, 0); });
  assert.equal(await p.locator('#camSign').isVisible(), true, 'Red speed-limit sign');
  assert.equal(await p.locator('#camLim').textContent(), '50');
  // 1.44: 화면 전체가 아니라 제한 속도 표지판 카드(위쪽 가운데), 500m·100m 앞 두 번만 안내하고 사라짐
  const cov = await p.evaluate(() => { const r = document.getElementById('camSign').querySelector('.cs-in').getBoundingClientRect(), g = document.querySelector('#camSign .cs-sign').getBoundingClientRect(); return {w: r.width, h: r.height, round: getComputedStyle(document.querySelector('#camSign .cs-sign')).borderRadius, gw: g.width}; });
  assert.ok(cov.w < 1036 * .7 && cov.h < 900 * .3, 'Sign card, not the whole screen: ' + JSON.stringify(cov));
  assert.ok(cov.gw >= 90 && cov.round === '50%', 'Round speed-limit sign');
  assert.match(await p.locator('#camDist').textContent(), /전방 5\d0m/);
  assert.equal(await p.evaluate(() => __said[0]), '500미터 앞 단속 카메라, 50이에요.', 'First call 500 m ahead');
  assert.equal(await p.locator('#camSign').evaluate(e => e.classList.contains('over')), true, 'Flashes when over the limit');
  // 몇 초 지나면 사라짐(같은 카메라를 계속 다가가도 다시 말하지 않음)
  await p.evaluate(() => { const n = Date.now; Date.now = () => n() + 8000; AmpCam.check(36.0 - 0.0032, 125.0, 70, 0); AmpCam.check(36.0 - 0.0030, 125.0, 70, 0); Date.now = n; });
  assert.equal(await p.locator('#camSign').isVisible(), false, 'Hides after a few seconds');
  assert.equal(await p.evaluate(() => __said.length), 1, 'No extra talking between 500 m and 100 m');
  // 100m 앞: 두 번째(마지막) 안내, 과속이면 "속도 줄이세요"
  await p.evaluate(() => { const n = Date.now; Date.now = () => n() + 8000; AmpCam.check(36.0 - 0.0011, 125.0, 70, 0); Date.now = n; AmpCam.check(36.0 - 0.0009, 125.0, 70, 0); });
  assert.equal(await p.locator('#camSign').isVisible(), true, 'Shows again 100 m ahead');
  assert.equal(await p.evaluate(() => __said[1] || ''), '100미터 앞, 속도 줄이세요.', 'Second call 100 m ahead');
  await p.evaluate(() => AmpCam.check(36.0 - 0.0004, 125.0, 70, 0));
  assert.equal(await p.evaluate(() => __said.length), 2, 'Only two calls per camera');
  // 카메라가 뒤쪽이면 표시 없음
  await p.evaluate(() => AmpCam.check(36.0 + 0.003, 125.0, 70, 0));
  assert.equal(await p.locator('#camSign').isVisible(), false, 'Nothing when the camera is behind');
  // 1.49 옆길·평행 도로(진행선에서 80m 옆) 카메라는 앞쪽이어도 안내 없음
  await p.evaluate(() => { __said.length = 0; AmpCam.osm = [[36.0, 125.0009, 50]]; AmpCam.check(36.0 - 0.0040, 125.0, 70, 0); AmpCam.check(36.0 - 0.0038, 125.0, 70, 0); });
  assert.equal(await p.locator('#camSign').isVisible(), false, 'Ignores a camera on a parallel road');
  assert.equal(await p.evaluate(() => __said.length), 0);
  // 가까워지지 않는 카메라(정차·멀어짐)는 안내 없음, 같은 길에서 다가가면 안내
  await p.evaluate(() => { AmpCam.osm = [[36.1, 125.0, 60]]; AmpCam.check(36.1 - 0.0044, 125.0, 70, 0); AmpCam.check(36.1 - 0.0044, 125.0, 70, 0); });
  assert.equal(await p.evaluate(() => __said.length), 0, 'Needs to be getting closer');
  await p.evaluate(() => AmpCam.check(36.1 - 0.0042, 125.0, 70, 0));
  assert.equal(await p.evaluate(() => __said[0]), '500미터 앞 단속 카메라, 60이에요.', 'Same road, approaching');
  // 1.54 넓은 간선도로: 길 건너편(진행선에서 50m 옆) 60km/h 카메라도 500m·100m 앞에서 안내
  await p.evaluate(() => { __said.length = 0; AmpCam.osm = [[36.2, 125.00056, 60]]; AmpCam.check(36.2 - 0.0047, 125.0, 65, 0); AmpCam.check(36.2 - 0.0045, 125.0, 65, 0); });
  assert.equal(await p.evaluate(() => __said[0]), '500미터 앞 단속 카메라, 60이에요.', 'Wide arterial road camera (50 m to the side)');
  await p.evaluate(() => { const n = Date.now; Date.now = () => n() + 8000; AmpCam.check(36.2 - 0.0011, 125.0, 65, 0); Date.now = n; AmpCam.check(36.2 - 0.0009, 125.0, 65, 0); });
  assert.match(await p.evaluate(() => __said[1] || ''), /^100미터 앞/, 'Second call near the camera even with the side offset');
  // 공공데이터 CSV 형식
  const rows = await p.evaluate(() => AmpCam.parseCsv('무인교통단속카메라관리번호,시도명,단속구분,제한속도,위도,경도\nA1,서울,과속단속,60,37.51,127.01\nA2,서울,신호단속,0,37.52,127.02\nA3,부산,과속단속,"80",35.1,129.0'));
  assert.deepEqual(rows, [[37.51, 127.01, 60], [35.1, 129, 80]]);
  assert.equal(await p.locator('#sCam').isChecked(), true);
  // 1.38 기본 내장 전국 자료(공공데이터): 3만 곳 이상, 설정에 표시
  await p.waitForFunction(() => AmpCam.builtin > 30000, null, {timeout: 5000});
  await p.evaluate(() => AmpCam.statUi());
  assert.match(await p.locator('#sCamStat').textContent(), /기본 내장 전국 자료 3\d,\d{3}곳/);
  // 설정의 [예시 보기]: 표지판·소리·음성이 실제처럼
  await p.evaluate(() => { __said.length = 0; });
  await p.locator('#setBtn').click(); await p.locator('#sCamDemo').scrollIntoViewIfNeeded(); await p.locator('#sCamDemo').click();
  await p.waitForTimeout(1500);
  assert.equal(await p.locator('#camSign').isVisible(), true, 'Demo shows the sign above settings');
  assert.equal(await p.evaluate(() => __said[0]), '500미터 앞 단속 카메라, 50이에요.');
  await p.waitForTimeout(3000);
  assert.equal(await p.locator('#camSign').isVisible(), false, 'Demo hides between the two calls');
  await p.waitForTimeout(1500);
  assert.equal(await p.locator('#camSign').evaluate(e => e.classList.contains('over')), true);
  assert.match(await p.evaluate(() => __said[1] || ''), /100미터 앞, 속도 줄이세요/);
  await p.waitForTimeout(3500);
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
