const {run, assert} = require('./lib/harness.cjs');

// 라디오를 고르면 플레이어 버튼(재생·일시정지·이전·다음)이 라디오를 조작하고, 음악 효과가 라디오 소리로 움직임
run('Radio through the main player buttons and visualizer', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('radio-player: ' + e.message));
  await p.addInitScript(() => {
    if (!sessionStorage.getItem('rp')) {
      sessionStorage.setItem('rp', '1'); localStorage.clear();
      localStorage.setItem('dna_skin2', JSON.stringify('blue'));
      localStorage.setItem('dna_rdFavs', JSON.stringify([{id: 'a1', name: 'Alpha FM', url: 'https://s.example/a', freq: 89.1}, {id: 'a2', name: 'Beta FM', url: 'https://s.example/b', freq: 95.1}]));
    }
    window.rl = []; window.__fft = 0;
    const fft = String.fromCharCode(...Array.from({length: 512}, (_, i) => 32 + Math.max(0, 220 - i)));
    const wave = String.fromCharCode(...Array.from({length: 512}, (_, i) => 32 + 128 + Math.round(Math.sin(i / 8) * 90)));
    window.AndroidBridge = {
      radioPlay: u => rl.push('play:' + u), radioStop: () => rl.push('stop'), radioVolume: () => {},
      radioState: () => JSON.stringify({state: 'playing', title: 'Morning Show'}),
      radioFft: () => { window.__fft++; return fft; }, radioWave: () => wave, radioRate: () => 48000,
      takeCarAutoplay: () => false, setCallReturn: v => rl.push('callRet:' + v)
    };
  });
  await p.goto(origin);
  // 설정: 통화가 끝나면 앱으로 돌아오기(기본 켜짐) — 앱에 값 전달
  assert.ok((await p.evaluate(() => rl)).includes('callRet:true'), 'Call-return default sent to the app');
  await p.evaluate(() => AmpRadio.play({id: 'a1', name: 'Alpha FM', url: 'https://s.example/a', freq: 89.1}));
  await p.waitForFunction(() => AmpRadio.state.onAir);
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_lastSrc'))), 'radio');
  await p.waitForFunction(() => document.querySelector('#bPlay').classList.contains('hot'), null, {timeout: 3000});
  await p.waitForFunction(() => /Alpha FM/.test(document.getElementById('marqText').textContent) && /Morning Show/.test(document.getElementById('marqText').textContent));
  // 음악 효과: 라디오 소리 데이터를 읽어 그림
  await p.waitForFunction(() => window.__fft > 3, null, {timeout: 3000});
  // 플레이어 일시정지 버튼 → 라디오 정지(고른 방송은 그대로)
  await p.locator('#bPause').click();
  assert.equal(await p.evaluate(() => AmpRadio.state.playing), false, 'Pause stops the radio');
  assert.ok((await p.evaluate(() => rl)).includes('stop'));
  await p.waitForFunction(() => /정지/.test(document.getElementById('marqText').textContent), null, {timeout: 3000});
  assert.equal(await p.locator('#bPause').evaluate(b => b.classList.contains('hot')), true, 'Pause lamp lit for radio');
  // 재생 버튼 → 같은 방송 다시
  await p.evaluate(() => { rl.length = 0; });
  await p.locator('#bPlay').click();
  await p.waitForFunction(() => AmpRadio.state.playing && AmpRadio.state.cur.id === 'a1');
  assert.ok((await p.evaluate(() => rl)).includes('play:https://s.example/a'), 'Play resumes the same station');
  // 다음·이전 → 즐겨찾기 다음·이전 방송
  await p.locator('#bNext').click();
  await p.waitForFunction(() => AmpRadio.state.cur.id === 'a2');
  await p.locator('#bPrev').click();
  await p.waitForFunction(() => AmpRadio.state.cur.id === 'a1');
  // 핸들 버튼(재생/일시정지)도 라디오
  await p.evaluate(() => window.__ctl('toggle'));
  assert.equal(await p.evaluate(() => AmpRadio.state.playing), false, 'Steering toggle stops radio');
  await p.evaluate(() => window.__ctl('toggle'));
  assert.equal(await p.evaluate(() => AmpRadio.state.playing), true, 'Steering toggle resumes radio');
  // 내 음악 곡을 고르면 라디오는 멈추고 플레이어는 다시 내 음악
  await p.waitForFunction(() => document.querySelectorAll('#pl li:not(.empty)').length > 0, null, {timeout: 30000});
  await p.evaluate(() => window.AmpTk.playIndex(0));
  assert.equal(await p.evaluate(() => AmpRadio.state.playing), false, 'Local track stops the radio');
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_lastSrc'))), 'local');
  // 설정: 통화가 끝나면 앱으로 돌아오기(기본 켜짐) — 앱에 값 전달
  await p.evaluate(() => { document.getElementById('settings').hidden = false; });
  await p.locator('#sCallRow').click();
  assert.ok((await p.evaluate(() => rl)).includes('callRet:false'), 'Turning it off reaches the app');
  await p.evaluate(() => { document.getElementById('settings').hidden = true; });
  await p.close();
});
