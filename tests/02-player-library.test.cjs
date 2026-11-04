const {run, assert} = require('./lib/harness.cjs');

run('Permissions fold, saved playlist, settings, car connect, native player, touch EQ', async ({browser, context, origin, errors}) => {
    // 외부 앱 권한이 모두 허용되면 권한 안내가 접힘
    const p2 = await context.newPage();
    await p2.addInitScript(() => {
      localStorage.setItem('dna_mode', JSON.stringify('ext'));
      window.AndroidBridge = {extStatus:() => JSON.stringify({notif:true,mic:true,notifSupported:true,eq:'꺼짐',vol:50,artV:0}),
        extArt:() => '', extFft:() => '', extWave:() => '', setExternalMode(){}, setExtEq(){}, onPlayState(){}};
    });
    await p2.goto(origin);
    await p2.waitForFunction(() => document.querySelector('#xPermSum').textContent === '모두 허용됨');
    assert.equal(await p2.locator('#xPerm').evaluate(d => d.open), false, 'Granted permissions fold away');
    await p2.close();
    // 저장되는 플레이리스트 · 설정 · 간편 모드 · 차 연결
    const p3 = await context.newPage();
    p3.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await p3.addInitScript(() => {
      window.AndroidBridge = {pickAudio(){}, takeCarAutoplay:() => false, adjustVolume(){window.__vol=(window.__vol||0)+1}, keepScreenOn(){}, onPlayState(){}, onNowPlaying(){}, onArt(){},
        carStatus:() => JSON.stringify({autoplay:false,carName:'',btPerm:true,autoLaunch:false,connected:['MY CAR'],lastKey:'다음 곡',lastKeyAt:Date.now()}),
        setCarAutoplay(v){window.__ap=v}, setCarName(n){window.__cn=n}, requestAutoLaunch(){}};
    });
    await p3.setViewportSize({width:390,height:844});
    await p3.goto(origin);
    await p3.evaluate(() => window.__onPicked([
      {uri:'content://a/1',name:'Song One.mp3',title:'Song One',artist:'Artist A',duration:200,size:1,hasArt:false},
      {uri:'content://a/2',name:'Artist B - Song Two.mp3',duration:180,size:1,hasArt:false}]));
    assert.equal(await p3.locator('#pl li').count(), 2);
    await p3.reload({timeout:90000});
    assert.equal(await p3.locator('#pl li').count(), 2, 'Playlist survives an app restart');
    assert.match(await p3.locator('#pl li').nth(1).textContent(), /Artist B - Song Two/);
    assert.equal(await p3.locator('#addDir').isVisible(), true, 'Folder add is offered in the app');
    await p3.locator('#setBtn').click();
    await p3.waitForFunction(() => document.querySelector('#sKey').textContent.startsWith('다음 곡'));
    await p3.locator('#sCarName').selectOption('MY CAR');
    assert.equal(await p3.evaluate(() => window.__cn), 'MY CAR');
    await p3.locator('#sCarAuto').check();
    assert.equal(await p3.evaluate(() => window.__ap), true);
    await p3.locator('#setClose').click();
    await p3.locator('#driveBtn').click();
    assert.equal(await p3.locator('#drive').isVisible(), true);
    await p3.waitForFunction(() => document.querySelector('#dvTitle').textContent === 'Song One');
    assert.ok((await p3.locator('#dvNext').boundingBox()).width >= 90, 'Drive mode buttons are large');
    assert.equal(await p3.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await p3.locator('#dvVolUp').click();
    assert.equal(await p3.evaluate(() => window.__vol), 1);
    await p3.locator('#dvClose').click();
    assert.equal(await p3.locator('#drive').isVisible(), false);
    await p3.evaluate(() => window.__carConnected('MY CAR'));
    assert.equal(await p3.locator('#toast').isVisible(), true);
    assert.equal(await p3.locator('#drive').isVisible(), true, 'Drive mode opens when the car connects');
    await p3.close();
    // 저장된 곡은 안드로이드 표준 플레이어(Media3)로 재생: 큐 전달·버튼 명령·현재 곡 동기화
    const p4 = await context.newPage();
    p4.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await p4.addInitScript(() => {
      window.__nat = {connected:true,count:0,index:-1,mid:'',playing:false,pos:0,dur:0}; window.__cmds = [];
      window.AndroidBridge = {natAvailable:() => true, npState:() => JSON.stringify(window.__nat),
        npSetQueue(j,i,pos,play){window.__q={items:JSON.parse(j),i,pos,play}}, npCmd(c){window.__cmds.push(c)},
        npMode(sh,rep){window.__mode=[sh,rep]}, npVolume(v){window.__nv=v}, npFft:() => '', npWave:() => '',
        pickAudio(){}, takeCarAutoplay:() => false, onPlayState(st){if(st==='playing')window.__webBridge=1}, onNowPlaying(st){if(st==='playing')window.__webBridge=1}, onArt(){}};
    });
    await p4.goto(origin);
    await p4.waitForFunction(() => window.__q && window.__q.items.length === 2);
    assert.equal(await p4.evaluate(() => window.__q.play), false, 'Restored queue is handed over without autoplay');
    await p4.locator('#bNext').click();
    await p4.locator('#bPlay').click();
    await p4.locator('#pl li').nth(1).click();
    assert.deepEqual(await p4.evaluate(() => window.__cmds), ['next','play','index']);
    await p4.evaluate(() => { window.__nat = {connected:true,count:2,index:1,mid:'content://a/2',playing:true,pos:5000,dur:180000,rate:44100}; });
    await p4.waitForFunction(() => document.querySelectorAll('#pl li')[1].classList.contains('cur'));
    await p4.waitForFunction(() => document.querySelector('#bPlay').classList.contains('hot'));
    assert.equal(await p4.evaluate(() => window.__webBridge), undefined, 'Web player session stays off when the native player is used');
    await p4.close();
    // EQ 슬라이더를 손가락으로 위아래로 끌면 값만 바뀌고 화면은 스크롤되지 않아야 함
    const tctx = await browser.newContext({viewport:{width:820,height:1180}, hasTouch:true, isMobile:true});
    await tctx.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const p5 = await tctx.newPage();
    p5.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await p5.addInitScript(() => { localStorage.setItem('dna_skin2', JSON.stringify('carnival')); localStorage.setItem('dna_layout', JSON.stringify('1')); });
    await p5.goto(origin);
    await p5.locator('#eqgrid').scrollIntoViewIfNeeded();
    const slot = p5.locator('#eqgrid .band').nth(3).locator('.slot');
    const box = await slot.boundingBox();
    const cdp = await tctx.newCDPSession(p5);
    const before = await p5.evaluate(() => ({y: scrollY, g: JSON.parse(localStorage.getItem('dna_gains') || '[0,0,0,0,0,0,0,0,0,0]')[2]}));
    const x = box.x + box.width / 2, y0 = box.y + box.height * 0.6;
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x, y:y0}]});
    for (let k = 1; k <= 8; k++) await cdp.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x, y:y0 - k * 12}]});
    await cdp.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
    await p5.waitForTimeout(200);
    const after = await p5.evaluate(() => ({y: scrollY, g: JSON.parse(localStorage.getItem('dna_gains'))[2]}));
    assert.equal(after.y, before.y, 'Dragging an EQ slider must not scroll the page');
    assert.ok(after.g > before.g, `EQ band follows the finger upward (${before.g} -> ${after.g})`);
    await tctx.close();
});
