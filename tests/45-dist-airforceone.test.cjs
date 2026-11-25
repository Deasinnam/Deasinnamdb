const {run, assert} = require('./lib/harness.cjs');

// 1.84 배포용 에어포스원: 라디오 없음(full·lite 모두), lite는 외부 앱 소리(YouTube Music·Spotify)도 없음. 그 밖은 스페셜과 같음
for (const flags of ['noradio', 'noradio,lite']) {
  run('Distribution build without radio (' + flags + ')', async ({newPage, origin}) => {
    const p = await newPage(f => { window.__build = 'special'; window.__dist = f; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); localStorage.setItem('dna_lastSrc', JSON.stringify('radio')); }, flags);
    await p.setViewportSize({width: 900, height: 1000}); await p.goto(origin); await p.waitForFunction(() => window.AmpDist && window.AmpPfd);
    const lite = flags.includes('lite');
    const r = await p.evaluate(() => {
      const vis = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; };
      return {railRadio: vis('#ckRail [data-f="radio"]'), radioBtn: vis('#radioBtn'), wRadio: vis('#wRadio'), swap: vis('#bSwap'), input: vis('#bInput'),
        rail: [...document.querySelectorAll('#ckRail button')].filter(b => getComputedStyle(b).display !== 'none').length,
        carRadio: !!document.querySelector('#sCarSrc option[value="radio"]'), carYtm: !!document.querySelector('#sCarSrc option[value="ytm"]'),
        last: JSON.parse(localStorage.getItem('dna_lastSrc')), special: document.documentElement.dataset.cks};
    });
    // 1.88: 라디오 자리(레일·위 버튼·창)는 택시 미터기 — 라디오 화면·전환 버튼·차 연결 음원에는 라디오 없음
    assert.deepEqual([r.railRadio, r.radioBtn, r.swap, r.carRadio], [true, true, false, false], 'radio slot is the taxi meter ' + JSON.stringify(r));
    assert.equal(await p.evaluate(() => [getComputedStyle(document.querySelector('#wRadio .rd-body')).display, document.querySelector('#ckRail [data-f="radio"] span').textContent].join()), 'none,택시');
    assert.equal(r.input, !lite, 'external input only in full'); assert.equal(r.carYtm, !lite);
    assert.equal(r.last, 'local'); assert.equal(r.special, '1', 'same airline special skin');
    // 라디오 재생은 아무 일도 안 함
    await p.evaluate(() => { AmpDist.focus('radio'); AmpRadio.play({id: 'x', url: 'http://x'}); }); await p.waitForTimeout(300);
    assert.equal(await p.locator('#wRadio .tx-lcd').isVisible(), true, 'radio focus shows the taxi meter');
    assert.equal(await p.evaluate(() => window.AmpRadioT.playing), false);
    // 스피드미터·스페셜 풍경은 그대로
    await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(400);
    assert.ok(await p.evaluate(() => !!window.AmpSpecialSky && !!document.querySelector('#pfdHost canvas')));
    await p.close();
  });
}
// 일반 판에는 라디오 그대로
run('Regular builds keep radio', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.goto(origin); await p.waitForFunction(() => window.AmpPfd);
  assert.equal(await p.evaluate(() => !!window.AmpDist || document.documentElement.hasAttribute('data-noradio')), false);
  assert.ok(await p.evaluate(() => !!document.querySelector('#ckRail [data-f="radio"]').getClientRects().length));
  await p.close();
});
