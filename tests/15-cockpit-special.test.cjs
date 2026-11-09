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
    assert.ok(b.x - c.x < 12 && b.y > c.y + c.height * .55, 'Sits on the left speed tape, below the readout ' + JSON.stringify([b, c])); }
  // 스페셜 2: 같은 배치 + 전투기 콕핏 외관, 원래 위 버튼 줄 컨트롤 모두 유지
  await p.evaluate(() => { const s = document.getElementById('skin'); s.value = 'carnival7'; s.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(300);
  assert.equal(await p.evaluate(() => [document.documentElement.dataset.cks, document.documentElement.dataset.cp, document.documentElement.dataset.ck3].join()), '1,1,');
  assert.ok((await p.locator('#skin option').allTextContents()).includes('대신남 에어라인'));
  assert.ok(await p.evaluate(() => { const b = getComputedStyle(document.body); return b.backgroundColor === 'rgb(16, 23, 20)' || b.backgroundImage.includes('25, 27, 20'); }), 'Dark antique background');
  for (const sel of ['#layout', '#skinBtn', '#driveBtn', '#setBtn', '#radioBtn', '#revBtn', '#addTop']) assert.equal(await p.locator(sel).isVisible(), true, sel + ' kept');
  assert.equal(await p.locator('#skinBtn .ico').isVisible(), true, 'Vector icon instead of emoji');
  assert.equal(await p.locator('#skinBtn .emo').isVisible(), false);
  assert.equal(await p.locator('#revBtn b').isVisible(), true, 'R badge kept');
  assert.equal(await p.locator('#pfdLevelQuick').isVisible(), true);
  assert.equal(await p.locator('#wVis').isVisible(), false, 'Merged player like special');
  // 상단 계기 4칸: 같은 크기 한 줄, 나침반 옆 글자·밝기 −/＋ 없음, 누르면 자세한 창
  { const bs = await p.evaluate(() => ['clkNow', 'clkWx', 'clkCmp', 'clkBri'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return [Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }));
    assert.equal(new Set(bs.map(b => b.join())).size, 1, 'Four equal gauge cards in one row ' + JSON.stringify(bs)); }
  assert.equal(await p.locator('#cmpE').isVisible(), false);
  assert.equal(await p.locator('#briUp').isVisible(), false);
  await p.locator('#clkCmp').click();
  assert.equal(await p.locator('#cmpPick').isVisible(), true, 'Compass details');
  assert.equal(await p.locator('#cpGps').textContent(), '꺼짐');
  await p.locator('#cpClose').click();
  assert.equal(await p.locator('#cmpPick').isVisible(), false);
  await p.locator('#clkBri').click();
  assert.equal(await p.locator('#briPick').isVisible(), true, 'Brightness details');
  await p.mouse.click(5, 1250);
  assert.equal(await p.locator('#pfdThemeQuick').isVisible(), true, 'Theme button under the level button');
  { const l = await p.locator('#pfdLevelQuick').boundingBox(), t = await p.locator('#pfdThemeQuick').boundingBox(); assert.ok(t.y > l.y + l.height - 2 && Math.abs(t.x - l.x) < 2, 'Stacked below'); }
  assert.equal(await p.locator('#pfdThemeQuick').textContent(), '테마 자동');
  await p.locator('#pfdThemeQuick').click();
  assert.ok(await p.evaluate(() => !!document.querySelector('#pfdHost dialog[open], .dsn-pfd dialog[open]')), 'Opens the theme settings');
  await p.keyboard.press('Escape');
  // 즐겨찾기 키캡: 숫자 1~6만, 재생 버튼 키캡(일시정지 골드)
  assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#rdPresets button')].slice(0, 6).map(b => getComputedStyle(b, '::before').content)), ['"1"','"2"','"3"','"4"','"5"','"6"']);
  assert.ok(await p.evaluate(() => getComputedStyle(document.getElementById('bPause')).backgroundImage.includes('233, 191, 98')), 'Gold pause key');
  // 라디오: 전구빛 숫자 드럼 + 크림색 눈금창
  await p.locator('#ckRail button[data-f="radio"]').click();
  await p.locator('#rdUp').click();
  assert.ok(await p.locator('#rdFreq .rd-drums .drum').count() >= 3, 'Drum digits');
  assert.equal(await p.locator('#wRadio .rd-sig').isVisible(), false);
  assert.ok(await p.evaluate(() => { const c = document.getElementById('rdScale'), g = c.getContext('2d'), d = g.getImageData(Math.round(c.width * .3), Math.round(c.height * .1), 1, 1).data; window.__px = [...d]; return d[0] > 200 && d[1] > 170 && d[2] < 190; }), 'Warm cream dial');
  await p.locator('#ckRail button[data-f="all"]').click();
  assert.ok(await p.evaluate(() => getComputedStyle(document.querySelector('#ckRail button.on')).boxShadow.includes('255, 195, 92')), 'Selected key uses the amber indicator');
  await p.close();
});

// 1.26 뚜벅이 모드(탐험용 나침반) + 스피드미터만 볼 때 GPS 줄·기기 지원 없음
run('Walk compass mode and speedometer focus', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('walk: ' + e.message));
  await p.addInitScript(() => { if (!sessionStorage.getItem('wk')) { sessionStorage.setItem('wk', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 1036, height: 1200});
  await p.goto(origin);
  await p.waitForTimeout(800);
  await p.locator('#ckRail button[data-f="gps"]').click();
  await p.waitForTimeout(300);
  assert.equal(await p.locator('#wGps .pfd-tools').isVisible(), false, 'No GPS row inside the speedometer');
  assert.equal(await p.locator('#devCaps').isVisible(), false, 'No device support row');
  assert.equal(await p.locator('#wGps .gctl').isVisible(), false);
  await p.locator('#ckRail button[data-f="all"]').click();
  assert.ok((await p.locator('#gStyleBar option').allTextContents()).includes('뚜벅이 모드'));
  await p.evaluate(() => { const s = document.getElementById('gStyle'); s.value = 'walk'; s.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(500);
  assert.equal(await p.locator('#walkHost').isVisible(), true, 'Compass shown');
  assert.equal(await p.locator('#pfdHost').isVisible(), false);
  assert.ok(await p.evaluate(() => { const c = document.getElementById('wkDial'); return c.width > 100 && c.getContext('2d').getImageData(c.width / 2, Math.round(c.height * .04), 1, 1).data[3] > 0; }), 'Dial drawn');
  assert.ok(await p.evaluate(() => /url\(/.test(document.getElementById('walkHost').style.backgroundImage)), 'Contour background');
  assert.equal(await p.locator('#wkTheme').textContent(), '테마 자동');
  await p.locator('#wkTheme').click();
  assert.equal(await p.locator('#wkTheme').textContent(), '테마 주간');
  await p.reload(); await p.waitForTimeout(400);
  assert.equal(await p.evaluate(() => document.getElementById('wGps').dataset.gs), 'walk', 'Remembered');
  await p.evaluate(() => { const s = document.getElementById('gStyle'); s.value = 'cockpit'; s.dispatchEvent(new Event('change')); });
  await p.close();
});

// 1.31 좁은 화면에서도 스피드미터 디자인 선택창, 설정 › 그래픽 성능 테스트
run('Narrow speedometer select and graphics benchmark', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('bench: ' + e.message));
  await p.addInitScript(() => { if (!sessionStorage.getItem('bn')) { sessionStorage.setItem('bn', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); } });
  await p.setViewportSize({width: 412, height: 900});
  await p.goto(origin);
  await p.waitForTimeout(600);
  assert.equal(await p.locator('#gStyleBar').isVisible(), true, 'Design select visible on a phone');
  assert.ok((await p.locator('#gStyleBar').boundingBox()).width >= 90);
  await p.locator('#setBtn').click();
  await p.locator('#sBench').scrollIntoViewIfNeeded();
  await p.locator('#sBench').click();
  assert.equal(await p.locator('#bench').isVisible(), true);
  await p.waitForSelector('#bnRes:not([hidden])', {timeout: 40000});
  assert.ok(+(await p.locator('#bnScore').textContent()) > 0, 'Score shown');
  assert.ok(await p.locator('#bnTable dt').count() >= 7);
  await p.locator('#bnApply').click();
  assert.equal(await p.locator('#bench').isVisible(), false);
  assert.match(await p.locator('#sBench').textContent(), /최근 \d+점/);
  await p.close();
});
