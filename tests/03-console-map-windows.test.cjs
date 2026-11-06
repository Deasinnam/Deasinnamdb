const {run, assert} = require('./lib/harness.cjs');

run('Console with app state, TMAP split/side, window order, resize buttons, clock', async ({browser, context, origin, errors}) => {
    // 조종 패널 + 앱 연결: 기기 상태가 기준(거짓 ON 없음), 볼륨은 기기 단계로 반올림된 값을 다시 읽음, SOS는 바로 전화
    const p7 = await context.newPage();
    p7.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await p7.addInitScript(() => {
      localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival5'));localStorage.setItem('dna_sos', JSON.stringify({name:'가족',number:'01000000000'}));
      window.dev = {steps:15,level:6,wifi:false,hasBt:true,bt:null};window.log=[];
      window.AndroidBridge = {gpsStatus:()=>JSON.stringify({fix:false,perm:true,enabled:true}),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{},
        cockpitState:()=>JSON.stringify({volume:Math.round(dev.level*100/dev.steps),wifiSupported:true,wifi:dev.wifi,hasBt:dev.hasBt,...(dev.bt===null?{}:{bt:dev.bt})}),
        setSystemVolume:p=>{dev.level=Math.round(p*dev.steps/100);log.push('vol:'+p)},
        setWifi:w=>{log.push('wifi:'+w);return 'panel'},openApp:k=>log.push('open:'+k),openAppSide:k=>{log.push('side:'+k);return 'rotated'},openAppBottom:k=>{log.push('bottom:'+k);return 'bottom'},openAppSplit:(k,top)=>{log.push((top?'top:':'bottom:')+k);return top?'top':'bottom'},setBluetooth:w=>{log.push('bt:'+w);return 'ask'},sosCall:n=>{log.push('call:'+n);return 'call'}};
    });
    await p7.goto(origin);
    await p7.waitForFunction(() => document.querySelector('#dkPlatformText').textContent === 'ANDROID LINK');
    assert.equal(await p7.locator('#dkVolumeValue').textContent(), '40');
    assert.equal(await p7.locator('#dkWifiReadout').textContent(), 'POWER OFF');
    assert.equal(await p7.locator('#dkBtReadout').textContent(), 'CHECK STATE', 'Unreadable Bluetooth is not shown as ON');
    await p7.locator('#dkWifiSwitch').click();
    assert.equal(await p7.locator('#dkWifiSwitch').getAttribute('aria-checked'), 'false', 'Tapping does not fake ON before the device confirms');
    await p7.evaluate(() => {dev.wifi=true});
    await p7.waitForFunction(() => document.querySelector('#dkWifiSwitch').getAttribute('aria-checked') === 'true', null, {timeout:4000});
    await p7.locator('#dkVolumeRange').fill('47');
    await p7.waitForFunction(() => log.includes('vol:47'));
    await p7.waitForFunction(() => document.querySelector('#dkVolumeValue').textContent === '47', null, {timeout:4000});
    await p7.locator('#dkGuardCover').click();await p7.locator('#dkSosButton').click();
    assert.ok((await p7.evaluate(() => log)).includes('call:01000000000'));
    // 지도: TMAP 켜기 / 하단에 켜기(위아래 반씩) / 옆 창
    await p7.locator('#mapYes').click();
    await p7.locator('#skin').selectOption('carnival', {force: true}); // 측면 버튼이 없는 스킨에서 지도 아래 버튼 줄
    // 자동차 모드: 확대·축소·내 위치·야간 지도·지도 끄기·TMAP 한 줄, TMAP은 바로 하단에 켜기
    assert.deepEqual((await p7.locator('#wMap .mapctl > .pill:visible').allInnerTexts()).map(t => t.trim()), ['＋ 확대','－ 축소','내 위치','야간 지도','지도 끄기','TMAP']);
    const tops = await p7.locator('#wMap .mapctl > .pill:visible').evaluateAll(bs => bs.map(b => Math.round(b.getBoundingClientRect().top)));
    assert.equal(new Set(tops).size, 1, 'Map buttons in one row');
    assert.equal(await p7.locator('#wMap [data-nav]').count(), 0, 'No Naver Map / open / top / side buttons');
    await p7.locator('#mapTmap').click();
    const tl = await p7.evaluate(() => log.filter(x => /^(open|bottom|top|side):/.test(x)));
    assert.equal(tl[tl.length - 1], 'bottom:com.skt.tmap.ku', 'TMAP opens at the bottom');
    assert.match(await p7.locator('#toast').textContent(), /아래쪽/);
    await p7.setViewportSize({width:900,height:1400}); // 세로 화면에서 위/아래 고르기
    let nl;
    // 측면 버튼: 누르면 위/아래 고르기, 고른 위치를 기억해 표시, 길게 누르면 바로 열기
    await p7.locator('#skin').selectOption('carnival5', {force: true});
    assert.equal(await p7.locator('#mapTmap').isVisible(), false, 'Cockpit: TMAP from the side buttons');
    assert.equal(await p7.locator('#ckRail [data-open="tmap"] em').textContent(), '▼ 아래');
    await p7.locator('#ckRail [data-open="tmap"]').click();
    assert.equal(await p7.locator('#navPick').isVisible(), true, 'Tap shows the top/bottom chooser');
    assert.match(await p7.locator('#navPick b').textContent(), /TMAP/);
    await p7.locator('#navPick [data-at="top"]').click();
    assert.equal(await p7.locator('#navPick').isVisible(), false);
    assert.equal(await p7.locator('#ckRail [data-open="tmap"] em').textContent(), '▲ 위', 'Remembers the chosen position');
    nl = await p7.evaluate(() => log.filter(x => /^(top|bottom):/.test(x)));
    assert.equal(nl[nl.length-1], 'top:com.skt.tmap.ku', 'Rail opens TMAP on top');
    await p7.locator('#ckRail [data-open="nmap"]').scrollIntoViewIfNeeded();
    const nb = await p7.locator('#ckRail [data-open="nmap"]').boundingBox();
    await p7.mouse.move(nb.x+nb.width/2, nb.y+nb.height/2);await p7.mouse.down();await p7.waitForTimeout(800);await p7.mouse.up();
    assert.equal(await p7.locator('#navPick').isVisible(), false, 'Long press skips the chooser');
    nl = await p7.evaluate(() => log.filter(x => /^(top|bottom):/.test(x)));
    assert.equal(nl[nl.length-1], 'bottom:com.nhn.android.nmap', 'Long press opens Naver Map at its last position');
    // 가로 화면: 위/아래 구분이 없어 고르기 없이 바로 엶
    await p7.setViewportSize({width:1470,height:1000});
    await p7.locator('#ckRail [data-open="tmap"]').click();
    assert.equal(await p7.locator('#navPick').isVisible(), false, 'Landscape opens directly');
    assert.match(await p7.locator('#toast').textContent(), /TMAP을 화면 위쪽|옆에 붙여요/);
    await p7.close();
    // 창 순서: 설정에서 바꾸고 되돌리기
    const pa = await context.newPage();
    pa.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await pa.addInitScript(() => {if(sessionStorage.getItem('pa'))return;sessionStorage.setItem('pa','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival5'));});
    await pa.goto(origin);
    const ty = sel => pa.locator(sel).evaluate(el => el.getBoundingClientRect().top);
    assert.ok(await ty('#wGps') < await ty('#wAtc'));
    await pa.locator('#setBtn').click();
    assert.deepEqual(await pa.locator('#ordList li b').allTextContents(), ['속도계','조종 패널','관제탑','지도','플레이어','재생 화면','라디오','이퀄라이저','재생 목록','블랙박스']);
    await pa.locator('#ordList li[data-id="wAtc"] button[data-d="-1"]').click();
    await pa.locator('#ordList li[data-id="wAtc"] button[data-d="-1"]').click();
    assert.deepEqual((await pa.locator('#ordList li b').allTextContents()).slice(0,3), ['관제탑','속도계','조종 패널']);
    await pa.locator('#setClose').click();
    assert.ok(await ty('#wAtc') < await ty('#wGps'), 'Tower now above the speedometer');
    await pa.reload();
    assert.ok(await ty('#wAtc') < await ty('#wGps'), 'Order survives reload');
    await pa.locator('#skin').selectOption('blue', {force: true});
    assert.ok(await ty('#wMain') < await ty('#wPl'), 'Other skins keep their own order');
    await pa.locator('#skin').selectOption('carnival5', {force: true});
    await pa.locator('#setBtn').click();
    await pa.locator('#ordReset').click();
    await pa.locator('#setClose').click();
    assert.ok(await ty('#wGps') < await ty('#wAtc'), 'Reset restores the default layout');
    await pa.close();
    // 일반 스킨: 기본 크기 고정, 창 위쪽 버튼을 눌러야 크기 조절
    {
      const p7 = await context.newPage();
      p7.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
      await p7.addInitScript(() => {if(sessionStorage.getItem('once'))return;sessionStorage.setItem('once','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('blue'));
        localStorage.setItem('dna_winH', JSON.stringify({wPl:150}));});
      await p7.setViewportSize({width:1024,height:900});
      await p7.goto(origin);
      await p7.locator('#wPl .rzbtn').waitFor();
      assert.equal(await p7.locator('#wPl').evaluate(el => el.style.height), '', 'Car-mode sizes do not leak into normal skins');
      for (const id of ['#wMain','#wVis','#wEq','#wPl']) {
        assert.equal(await p7.locator(id+' > .grip').isVisible(), false, id+' grip hidden until resize button');
        assert.equal(await p7.locator(id+' > .bar .rzbtn').isVisible(), true, id+' has a resize button on top');
      }
      const h0 = await p7.locator('#wPl').evaluate(el => el.getBoundingClientRect().height);
      await p7.locator('#wPl .rzbtn').click();
      assert.equal(await p7.locator('#wPl .rzbtn').getAttribute('aria-pressed'), 'true');
      const g = p7.locator('#wPl > .grip');await g.scrollIntoViewIfNeeded();
      const gb = await g.boundingBox();
      await p7.mouse.move(gb.x+gb.width/2, gb.y+gb.height/2);await p7.mouse.down();
      await p7.mouse.move(gb.x+gb.width/2, gb.y+gb.height/2+120, {steps:6});await p7.mouse.up();
      const h1 = await p7.locator('#wPl').evaluate(el => el.getBoundingClientRect().height);
      assert.ok(h1 > h0 + 80, `Resize mode grows the playlist (${h0} -> ${h1})`);
      await p7.locator('#wPl .rzbtn').click();
      assert.equal(await p7.locator('#wPl > .grip').isVisible(), false, 'Resize off hides the grip');
      assert.equal(await p7.evaluate(() => JSON.parse(localStorage.getItem('dna_winHN')).wPl > 0), true, 'Normal-skin size is saved');
      await p7.reload();await p7.locator('#wPl .rzbtn').waitFor();
      assert.ok(Math.abs(await p7.locator('#wPl').evaluate(el => el.getBoundingClientRect().height) - h1) < 4, 'Size kept after reopening');
      await p7.locator('#skin').selectOption('carnival', {force: true});
      assert.equal(await p7.locator('#wPl > .bar .rzbtn').isVisible(), false, 'Car mode keeps its own resizing (no button)');
      assert.equal(await p7.locator('#wPl > .grip').isVisible(), true, 'Car mode grip stays direct');
      await p7.close();
    }
    // 로고 옆: 서울 시간 · 날씨 · 밝기(해외 시간 카드는 없음), 앱이 켜진 동안 화면 항상 켜 둠
    {
      const p9 = await context.newPage();
      p9.on('pageerror', error => errors.push(error.message));
      await p9.addInitScript(() => {
        window.__briCalls = []; window.__scrCalls = [];
        window.AndroidBridge = {setScreenBrightness: v => window.__briCalls.push(v), setScreenAlways: v => window.__scrCalls.push(['always', v]), setScreenOnPlay: v => window.__scrCalls.push(['play', v])};
        if(sessionStorage.getItem('once'))return;sessionStorage.setItem('once','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival'));});
      await p9.clock.install({time: new Date('2026-10-30T13:05:00Z')});
      await p9.goto(origin);
      await p9.locator('#clkTime').waitFor({state:'attached'});
      await p9.clock.runFor(1500);
      assert.equal(await p9.locator('#clkTime').textContent(), '22:05');
      assert.match(await p9.locator('#clkDate').textContent(), /10\.30 \(금\)/);
      const cb = await p9.locator('#clock').boundingBox(), bb = await p9.locator('.brand').boundingBox();
      assert.ok(cb.x >= bb.x + bb.width - 2 && Math.abs((cb.y+cb.height/2)-(bb.y+bb.height/2)) < bb.height/2, 'Clock sits next to the logo');
      assert.equal(await p9.locator('#clkWorld').isVisible(), false, 'No world-time card');
      assert.equal(await p9.locator('#clkWx').isVisible(), true, 'Weather stays');
      assert.equal(await p9.locator('#clkBri').isVisible(), true, 'Brightness card in its place');
      assert.equal(await p9.locator('#clkCmp').isVisible(), false, 'Compass only in cockpit skins');
      assert.deepEqual(await p9.evaluate(() => window.__scrCalls.filter(c => c[0] === 'always').pop()), ['always', true], 'Screen stays on while the app is open (default)');
      assert.equal(await p9.locator('#briV').textContent(), '자동');
      await p9.locator('#briUp').click();
      assert.equal(await p9.locator('#briV').textContent(), '70%', '+ from auto starts at 60%');
      assert.equal(await p9.evaluate(() => window.__briCalls.pop()), 70);
      await p9.locator('#briDn').click(); await p9.locator('#briDn').click();
      assert.equal(await p9.locator('#briV').textContent(), '50%');
      assert.equal(await p9.locator('#briPick').isVisible(), false, 'Quick buttons do not open the panel');
      await p9.locator('#clkBri small').click();
      assert.equal(await p9.locator('#briPick').isVisible(), true, 'Tapping the card opens the brightness panel');
      await p9.locator('#briPre button[data-v="20"]').click();
      assert.equal(await p9.locator('#briV').textContent(), '20%');
      await p9.locator('#briRange').fill('85');
      assert.equal(await p9.locator('#briPV').textContent(), '85%');
      assert.equal(await p9.evaluate(() => window.__briCalls.pop()), 85);
      await p9.reload(); await p9.clock.runFor(800);
      assert.equal(await p9.locator('#briV').textContent(), '85%', 'Brightness remembered');
      assert.equal(await p9.evaluate(() => window.__briCalls.includes(85)), true, 'Re-applied at start');
      await p9.locator('#clkBri small').click();
      await p9.locator('#briPre button[data-v="-1"]').click();
      assert.equal(await p9.locator('#briV').textContent(), '자동');
      assert.equal(await p9.evaluate(() => window.__briCalls.pop()), -1, 'Auto returns to system brightness');
      await p9.mouse.click(5, 880);
      assert.equal(await p9.locator('#briPick').isVisible(), false, 'Tap outside closes');
      // 설정: 재생 중만으로 바꾸면 항상 켜기를 끔
      await p9.evaluate(() => document.querySelector('#sScr button[data-v="play"]').click());
      assert.deepEqual(await p9.evaluate(() => window.__scrCalls.filter(c => c[0] === 'always').pop()), ['always', false]);
      await p9.close();
    }
});
