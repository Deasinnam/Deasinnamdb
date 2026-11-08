const {run, assert} = require('./lib/harness.cjs');

// 1.35 몬스타덱(USB 단축키): 장치 보고서 → 키 → 기능, 설정에서 키 배우기
run('Monstar Deck keys run app functions', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('deck: ' + e.message));
  await p.addInitScript(() => { window.__conn = 0; window.AndroidBridge = {deckState: () => JSON.stringify({present: true, open: true, vid: '0400', pid: '1000'}), deckConnect: () => { window.__conn++; return true; }, deckBright: () => {}, deckImages: j => { window.__imgs = JSON.parse(j); }};
    if (!sessionStorage.getItem('dk')) { sessionStorage.setItem('dk', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 900});
  await p.goto(origin); await p.waitForTimeout(500);
  const ack = (k, s) => '41434b00004f4b0000' + k.toString(16).padStart(2, '0') + s.toString(16).padStart(2, '0');
  // 화면 위치 7번(가운데 줄 둘째 = 장치 번호 11, 누를 때만 신호) → 기본: 지도
  await p.evaluate(h => __deck(h), ack(11, 0));
  assert.equal(await p.evaluate(() => document.getElementById('ckRail').parentElement.id), 'wMap', 'Key 7 opens the map view');
  assert.equal(await p.locator('#deckFlash').textContent(), '지도');
  assert.equal(await p.evaluate(() => AmpDeck.parse('41434b00004f4b00000d00').id), 'k1', 'Device key 13 is the top-left key');
  await p.waitForTimeout(400);
  assert.deepEqual(await p.evaluate(() => __imgs.slice(0, 5)), ['prev', 'play', 'next', 'swap', 'mute'], 'Key pictures follow the layout');
  // 설정: 연결됨 표시, 키 배우기(낯선 형식의 보고서도 키로 기억)
  await p.locator('#setBtn').click();
  await p.locator('#secDeck').scrollIntoViewIfNeeded();
  assert.match(await p.locator('#deckStat').textContent(), /연결됨/);
  await p.locator('#deckMap [data-learn="camDemo"]').click();
  assert.match(await p.locator('#deckMap li[data-a="camDemo"] em').textContent(), /누르세요/);
  await p.evaluate(() => __deck('0102030405'));
  assert.match(await p.locator('#deckMap li[data-a="camDemo"] em').textContent(), /키/, 'Learned');
  await p.locator('#setClose').click();
  await p.waitForTimeout(300);
  await p.evaluate(() => __deck('0102030405'));
  await p.waitForTimeout(400);
  assert.equal(await p.locator('#camSign').isVisible(), true, 'Learned key runs the speed-camera demo');
  await p.locator('#setBtn').click();
  await p.locator('#deckConn').click();
  assert.equal(await p.evaluate(() => __conn), 1);
  await p.close();
});
