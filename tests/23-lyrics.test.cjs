const {run, assert} = require('./lib/harness.cjs');
const SHOT = process.env.SHOT_DIR;

// 1.46 가사 보기: 설정·[가사] 버튼으로 시각화 대신 가사, LRCLIB 시간 맞춘 가사는 지금 줄 강조, 못 찾으면 안내
run('Lyrics instead of the visualizer', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('lyr: ' + e.message));
  const asked = [];
  await p.route('https://lrclib.net/**', r => { const u = new URL(r.request().url()); asked.push(u.pathname + '?' + u.searchParams.get('track_name') + '|' + u.searchParams.get('artist_name'));
    if (u.searchParams.get('track_name') === '테스트 노래') return r.fulfill({status: 200, contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: JSON.stringify({trackName: '테스트 노래', artistName: '가수', duration: 200, instrumental: false,
      plainLyrics: '첫째 줄\n둘째 줄\n셋째 줄', syncedLyrics: '[00:01.00] 첫째 줄\n[00:10.50] 둘째 줄\n[00:20.00] 셋째 줄'})});
    return r.fulfill({status: 404, contentType: 'application/json', headers: {'access-control-allow-origin': '*'}, body: u.pathname.endsWith('search') ? '[]' : '{}'}); });
  await p.addInitScript(() => { if (!sessionStorage.getItem('ly')) { sessionStorage.setItem('ly', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 1100});
  await p.goto(origin); await p.waitForTimeout(500);
  assert.equal(await p.locator('#lyr').isVisible(), false, 'Visualizer by default');
  // 설정에서 켜기
  await p.locator('#setBtn').click(); await p.locator('#sLyrics').scrollIntoViewIfNeeded();
  await p.locator('#sLyrics').check(); await p.locator('#setClose').click();
  assert.equal(await p.evaluate(() => AmpLyrics.on), true);
  await p.evaluate(() => { AmpLyrics.hold = true; document.getElementById('npTitle').textContent = '테스트 노래 (Official Audio)'; document.getElementById('npArtist').textContent = '가수, 다른 가수'; });
  await p.waitForFunction(() => document.querySelectorAll('#lyrLines p').length === 3, null, {timeout: 4000});
  assert.ok(asked.some(a => a.includes('테스트 노래|가수')), 'Searches by clean title and first artist: ' + asked);
  assert.match(await p.locator('#lyrSrc').textContent(), /LRCLIB · 시간 맞춤/);
  await p.evaluate(() => AmpLyrics.follow(12));
  assert.equal(await p.locator('#lyrLines p.on').textContent(), '둘째 줄', 'Current line highlighted');
  await p.evaluate(() => AmpLyrics.follow(25));
  assert.equal(await p.locator('#lyrLines p.on').textContent(), '셋째 줄');
  if (SHOT) { await p.evaluate(() => document.getElementById('wMain').scrollIntoView()); await p.waitForTimeout(500); await p.screenshot({path: SHOT + '/lyr.png'}); }
  // 못 찾는 곡
  await p.evaluate(() => { document.getElementById('npTitle').textContent = '없는 노래'; document.getElementById('npArtist').textContent = '누군가'; });
  await p.waitForFunction(() => /찾지 못했어요/.test(document.getElementById('lyrMsg').textContent), null, {timeout: 4000});
  // [효과] 버튼으로 시각화로 돌아감, 설정과 같이 움직임
  await p.evaluate(() => document.getElementById('lyrBtn').click());
  assert.equal(await p.locator('#lyr').isVisible(), false);
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_visLyrics'))), false);
  // LRC 해석
  assert.deepEqual(await p.evaluate(() => AmpLyrics.parseLrc('[01:02.50]가\n[00:03]나').map(r => [r.t, r.txt])), [[3, '나'], [62.5, '가']]);
  await p.close();
});
