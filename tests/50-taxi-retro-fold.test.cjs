const {run, assert} = require('./lib/harness.cjs');

// 1.90 택시 미터기: 스킨 단추 줄, '레트로' 스킨(숫자 드럼·같은 상태), 폴드7 안쪽·바깥 화면(가로·세로)에서 넘치지 않음
run('Taxi meter: retro skin, skin buttons, Fold7 fit', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => {
    window.__build = 'special'; window.__dist = 'noradio,airline,dsp';
    if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.clear(); localStorage.setItem('dna_taxiAck', 'true'); }
  });
  await p.setViewportSize({width: 876, height: 970});
  await p.goto(origin); await p.waitForTimeout(1500);
  await p.click('#ckRail [data-f="radio"]'); await p.waitForTimeout(300);
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#wRadio .tx-sb[data-sk]')].map(b => b.textContent)), ['실물 전자식', '레트로', 'LCD 클래식']);
  // 운행 시작 → 레트로로 바꿔도 이어짐, 레트로 단추로 지불
  await p.click('#wRadio .tx-dev .tx-go');
  const fare = await p.evaluate(() => AmpTaxi.state.fare);
  await p.click('#wRadio .tx-sb[data-sk="retro"]'); await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => [AmpTaxi.skin, JSON.parse(localStorage.dna_taxiSkin)].join()), 'retro,retro');
  assert.equal(await p.locator('#wRadio .rt-dev').isVisible(), true);
  assert.equal(await p.locator('#wRadio .tx-dev').isVisible(), false);
  assert.equal(await p.evaluate(() => document.querySelector('#wRadio .rt-keys .tx-go').classList.contains('on')), true, 'run key stays down');
  const drums = () => p.evaluate(() => [...document.querySelectorAll('#wRadio .rt-big .rt-dr b')].map(b => Math.round(-parseFloat(b.style.transform.replace('translateY(', '')) / 10)).join(''));
  await p.waitForTimeout(700);
  assert.equal(await drums(), String(fare).padStart(6, '0'), 'fare on the drums');
  await p.click('#wRadio .rt-keys .tx-stop'); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => AmpTaxi.state.paid), true, 'retro pay key works');
  // 1.91 빈차 단추 → 동그란 빈차판이 승차요금을 가림, 주행하면 걷힘
  await p.click('#wRadio .rt-keys .tx-reset'); await p.waitForTimeout(900);
  assert.equal(await p.evaluate(() => [document.getElementById('wRadio').dataset.txvac, getComputedStyle(document.querySelector('#wRadio .rt-vac')).visibility].join()), '1,visible', 'vacant disc covers');
  // 1.91 레트로에서 요금이 오르면 동전 소리
  await p.evaluate(() => AmpTaxi.coin());
  await p.click('#wRadio .rt-keys .tx-go'); await p.waitForTimeout(900);
  assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector('#wRadio .rt-vac')).visibility), 'hidden', 'disc swings away when running');
  await p.click('#wRadio .rt-keys .tx-reset'); await p.waitForTimeout(200);
  await p.click('#wRadio .tx-sbnext'); await p.waitForTimeout(200);
  assert.equal(await p.evaluate(() => AmpTaxi.skin), 'lcd', '⇄ cycles');
  // 폴드7 네 가지 화면 × 세 스킨: 미터기가 창 안에 다 들어감
  for (const [w, h] of [[876, 970], [970, 876], [411, 960], [960, 411]]) {
    await p.setViewportSize({width: w, height: h});
    for (const k of ['pro', 'retro', 'lcd']) {
      await p.evaluate(k => { AmpTaxi.setSkin(k); AmpTaxi._preview({fare: 123456, spd: 32, km: 12.3, time: '15:46', next: 87}) }, k); await p.waitForTimeout(250);
      const g = await p.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(), W = r('#wRadio'), st = r('#wRadio .tx-stage');
        const d = AmpTaxi.skin === 'retro' ? r('#wRadio .rt-dev') : r('#wRadio .tx-dev'), keys = [...document.querySelectorAll(AmpTaxi.skin === 'retro' ? '#wRadio .rt-keys .tx-k' : '#wRadio .tx-dev .tx-keys .tx-k')].map(b => b.getBoundingClientRect());
        const f = document.querySelector('#wRadio .tx-fare');
        return {devW: d.width, stW: st.width, top: d.top, bottom: d.bottom, stTop: st.top, stBottom: st.bottom + 30, winR: W.right, devR: d.right, keyB: Math.max(...keys.map(b => b.bottom)), clip: AmpTaxi.skin !== 'retro' && f.scrollWidth > f.clientWidth + 1}; });
      assert.ok(g.devR <= g.winR + 1 && g.keyB <= g.stBottom && !g.clip, w + 'x' + h + ' ' + k + ' ' + JSON.stringify(g));
      assert.ok(g.devW >= g.stW * 0.35, w + 'x' + h + ' ' + k + ' not tiny ' + JSON.stringify(g));
    }
  }
  // 1.92 길쭉한 바깥 화면: 미터기 + 오디오 + '세계는 서울로', 안쪽 세로: 세 스킨 모두 그림이 나옴
  for (const [w, h, dockOn] of [[411, 960, true], [876, 970, false]]) {
    await p.setViewportSize({width: w, height: h});
    for (const k of ['pro', 'retro', 'lcd']) {
      await p.evaluate(k => AmpTaxi.setSkin(k), k); await p.waitForTimeout(300);
      const g = await p.evaluate(() => { const W = document.getElementById('wRadio'), v = s => { const e = W.querySelector(s); return e && e.offsetParent ? Math.round(e.getBoundingClientRect().height) : 0 };
        return {dock: v('.tx-dock'), b88: v('.tx-88'), u: parseFloat(W.style.getPropertyValue('--u'))}; });
      assert.ok(g.b88 >= 90 && (!!g.dock === dockOn), w + 'x' + h + ' ' + k + ' ' + JSON.stringify(g));
    }
  }
  // 오디오 리모컨이 원래 플레이어 단추를 누름
  await p.setViewportSize({width: 411, height: 960}); await p.waitForTimeout(300);
  const sh = await p.evaluate(() => document.getElementById('tShuf').classList.contains('on'));
  await p.click('#wRadio .dk-tog[data-t="tShuf"]'); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(() => document.getElementById('tShuf').classList.contains('on')), !sh, 'dock shuffle toggles the player');
  assert.equal(await p.evaluate(() => document.querySelector('#wRadio .dk-tog[data-t="tShuf"]').classList.contains('hot')), !sh, 'dock mirrors state');
  // 전체 모드(창이 여러 개): 세 스킨 모두 미터기가 보임
  await p.setViewportSize({width: 970, height: 876}); await p.click('#ckRail [data-f="all"]'); await p.waitForTimeout(500);
  for (const k of ['pro', 'retro', 'lcd']) {
    await p.evaluate(k => AmpTaxi.setSkin(k), k); await p.waitForTimeout(300);
    const hgt = await p.evaluate(() => { const W = document.getElementById('wRadio'); return Math.round(W.querySelector(AmpTaxi.skin === 'retro' ? '.rt-dev' : '.tx-dev').getBoundingClientRect().height) + '/' + Math.round(W.querySelector('.tx-stage').getBoundingClientRect().height); });
    const [dv, sg] = hgt.split('/').map(Number);
    assert.ok(dv > 150 && sg >= dv, 'all view ' + k + ' ' + hgt);
  }
});
