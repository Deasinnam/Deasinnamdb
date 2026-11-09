const {run, assert} = require('./lib/harness.cjs');

// 1.53 시험판(배포용·안드로이드 등록용): 처음 실행 안내, 라디오는 공식 앱·웹으로, 가사는 파일 것만, 등록용은 자동 열기 숨김
run('Test builds: notice, official radio, file-only lyrics', async ({context, origin, errors}) => {
  for (const kind of ['comm', 'play']) {
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(kind + ': ' + e.message));
    const opened = [], net = [];
    await p.route('https://lrclib.net/**', r => { net.push(r.request().url()); r.fulfill({status: 404, body: '{}'}); });
    await p.addInitScript(k => { window.__build = k; window.__opened = []; window.AndroidBridge = {openUrl: u => window.__opened.push(u), buildKind: () => k};
      if (sessionStorage.getItem('tb') !== k) { sessionStorage.setItem('tb', k); localStorage.clear(); } }, kind);
    await p.setViewportSize({width: 412, height: 915});
    await p.goto(origin); await p.waitForTimeout(800);
    assert.equal(await p.locator('#buildNotice').isVisible(), true, kind + ': first-run notice');
    assert.match(await p.locator('#buildNotice').textContent(), kind === 'play' ? /대신남 원 안드로이드 테스트용/ : /대신남 배포용 테스트/);
    assert.match(await p.locator('#buildNotice').textContent(), /위치\(정밀\)[\s\S]*마이크[\s\S]*카메라/);
    await p.locator('#bnOk').click();
    assert.equal(await p.locator('#buildNotice').isVisible(), false);
    await p.reload(); await p.waitForTimeout(700);
    assert.equal(await p.locator('#buildNotice').isVisible(), false, 'Shown once');
    // 라디오: 직접 재생하지 않고 방송사 공식 웹으로
    await p.evaluate(() => AmpRadioT.play(AmpRadioT.list.find(s => /kbs/.test(s.id))));
    assert.equal(await p.evaluate(() => AmpRadioT.playing), false, 'No direct stream');
    assert.deepEqual(await p.evaluate(() => __opened), ['https://onair.kbs.co.kr']);
    // 가사: 인터넷에서 찾지 않음
    await p.evaluate(() => { AmpLyrics.set(true); document.getElementById('npTitle').textContent = '테스트 노래'; document.getElementById('npArtist').textContent = '가수'; });
    await p.waitForTimeout(800);
    assert.match(await p.locator('#lyrMsg').textContent(), /곡 파일에 들어 있는 가사만/);
    assert.equal(net.length, 0, 'No online lyrics lookup');
    // 설정: 시험판 정보, 등록용은 자동 열기 줄 숨김
    assert.equal(await p.evaluate(() => !document.getElementById('secPub').hidden), true);
    assert.equal(await p.evaluate(() => document.getElementById('sLaunch').closest('.row').hidden), kind === 'play');
    await p.close();
  }
  // 기존 대신남 원(std)은 그대로: 안내 없음
  const q = await context.newPage();
  await q.addInitScript(() => { localStorage.clear(); });
  await q.goto(origin); await q.waitForTimeout(700);
  assert.equal(await q.locator('#buildNotice').count(), 0, 'Regular app has no test notice');
  await q.close();
});
