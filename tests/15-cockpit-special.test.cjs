const {run, assert} = require('./lib/harness.cjs');

// 1.20 콕핏 스페셜 스킨: 기존 스킨은 그대로, 이 스킨에서만 배치가 바뀜
run('Cockpit special skin layout', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('cks: ' + e.message));
  await p.addInitScript(() => {
    window.AndroidBridge = {deviceCaps: () => JSON.stringify({gps: {s: 'on', t: '켜짐'}, compass: {s: 'yes', t: '있음'}, lte: {s: 'yes', t: '지원'}, nr: {s: 'unk', t: '확인 불가'}, wifi: {s: 'off', t: '꺼짐'}, bt: {s: 'no', t: '없음'}})};
    if (!sessionStorage.getItem('cks')) { sessionStorage.setItem('cks', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival6')); }
  });
  await p.setViewportSize({width: 730, height: 1300});
  await p.goto(origin);
  await p.waitForFunction(() => document.querySelector('#dkControlDeck + .pfd-tools'), null, {timeout: 6000});
  assert.equal(await p.evaluate(() => [document.documentElement.dataset.skin, document.documentElement.dataset.ck3, document.documentElement.dataset.cks].join()), 'carnival2,1,1');
  assert.ok((await p.locator('#skin option').allTextContents()).includes('대신남 자동차 모드 · 콕핏 스페셜'));
  // 위 버튼 줄: 한 줄, 이모티콘 없음
  const tb = await p.evaluate(() => { const els = [...document.querySelectorAll('.tools>*')].filter(e => e.offsetParent); return {rows: new Set(els.map(e => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2))).size, txt: els.map(e => e.innerText).join(' ')}; });
  assert.equal(tb.rows, 1, 'Top buttons in one row');
  assert.ok(!/[🎨📻]/u.test(tb.txt), 'No emoji');
  assert.equal(await p.locator('#setBtn svg').isVisible(), false);
  // 관제탑: 창은 없고 스피드미터 제목줄의 작은 표시
  assert.equal(await p.locator('#wAtc').isVisible(), false, 'Tower window removed');
  assert.equal(await p.locator('#wGps > .bar #atcMini').isVisible(), true, 'Tower chip next to the speedometer');
  // GPS 켜기 줄: 조종 패널 아래, 기기 지원은 접힘
  assert.ok(await p.evaluate(() => document.querySelector('#dkControlDeck').nextElementSibling.classList.contains('pfd-tools')), 'GPS buttons under the control deck');
  assert.ok(await p.evaluate(() => document.querySelector('#wCtl .pfd-tools').nextElementSibling.id === 'devCaps'));
  assert.equal(await p.locator('#devCaps .dc').first().isVisible(), false, 'Device support folded');
  await p.locator('#devCaps .dc-h').click();
  assert.equal(await p.locator('#devCaps .dc').first().isVisible(), true, 'Tap to open');
  await p.locator('#devCaps .dc-h').click();
  // 플레이어 + NOW PLAYING 한 창, 블랙박스는 접힘
  assert.equal(await p.locator('#wVis').isVisible(), false);
  assert.equal(await p.locator('#wMain #npMerge #vis').count(), 1, 'Visualizer inside the player');
  assert.equal(await p.locator('#wCam').evaluate(w => w.classList.contains('collapsed')), true, 'Dashcam folded by default');
  assert.equal(await p.locator('#camView').isVisible(), false);
  await p.locator('#wCam .wbtn[data-col]').click();
  assert.equal(await p.locator('#camView').isVisible(), true, 'User can open the dashcam');
  await p.locator('#wCam .wbtn[data-col]').click();
  // 바로가기: 지도 창에서도 맨 아래
  await p.locator('#ckRail button[data-f="map"]').click();
  assert.ok(await p.evaluate(() => { const w = document.getElementById('wMap'), r = document.getElementById('ckRail'); return r.parentElement === w && w.getBoundingClientRect().bottom - r.getBoundingClientRect().bottom < 16; }), 'Rail at the bottom of the map window');
  await p.locator('#ckRail button[data-f="vis"]').click();
  assert.equal(await p.evaluate(() => document.getElementById('ckRail').parentElement.id), 'wMain', 'NOW PLAYING opens the merged player');
  await p.locator('#ckRail button[data-f="all"]').click();
  // 다른 스킨으로 바꾸면 원래대로
  await p.evaluate(() => { const s = document.getElementById('skin'); s.value = 'carnival4'; s.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => document.documentElement.dataset.cks), undefined);
  assert.equal(await p.locator('#wVis #vis').count(), 1, 'Visualizer back in NOW PLAYING');
  assert.equal(await p.locator('#wAtc').isVisible(), true, 'Tower window back');
  assert.equal(await p.locator('#atcMini').isVisible(), false);
  assert.ok(await p.evaluate(() => document.querySelector('#pfdHost .pfd-tools') !== null), 'GPS buttons back in the speedometer');
  // 속도 칸 아래 [수평 맞춤], 아래 줄의 수평 맞춤은 숨김
  await p.evaluate(() => { const s = document.getElementById('skin'); s.value = 'carnival6'; s.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(300);
  assert.equal(await p.locator('#pfdLevelQuick').isVisible(), true, 'Level button under the speed readout');
  assert.equal(await p.locator('.pfd-tool[data-role="level"]').isVisible(), false, 'Level button removed from the GPS row');
  { const b = await p.locator('#pfdLevelQuick').boundingBox(), c = await p.locator('#pfdHost .pfd-canvas-wrap').boundingBox();
    assert.ok(b.x - c.x < 12 && b.y > c.y + c.height * .55, 'Sits on the left speed tape, below the readout'); }
  // 스페셜 2: 같은 배치 + 전투기 콕핏 외관, 원래 위 버튼 줄 컨트롤 모두 유지
  await p.evaluate(() => { const s = document.getElementById('skin'); s.value = 'carnival7'; s.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => [document.documentElement.dataset.cks, document.documentElement.dataset.cp, document.documentElement.dataset.ck3].join()), '1,1,');
  assert.ok((await p.locator('#skin option').allTextContents()).includes('대신남 자동차 모드 · 콕핏 스페셜 2'));
  assert.equal(await p.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(16, 23, 20)', 'Charcoal background');
  for (const sel of ['#layout', '#skinBtn', '#driveBtn', '#setBtn', '#radioBtn', '#revBtn', '#addTop']) assert.equal(await p.locator(sel).isVisible(), true, sel + ' kept');
  assert.equal(await p.locator('#skinBtn .ico').isVisible(), true, 'Vector icon instead of emoji');
  assert.equal(await p.locator('#skinBtn .emo').isVisible(), false);
  assert.equal(await p.locator('#revBtn b').isVisible(), true, 'R badge kept');
  assert.equal(await p.locator('#pfdLevelQuick').isVisible(), true);
  assert.equal(await p.locator('#wVis').isVisible(), false, 'Merged player like special');
  assert.ok(await p.evaluate(() => getComputedStyle(document.querySelector('#ckRail button.on')).boxShadow.includes('246, 190, 98')), 'Selected key uses the amber indicator');
  await p.close();
});
