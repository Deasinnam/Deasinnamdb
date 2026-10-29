const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const assets = path.resolve(__dirname, '../app/src/main/assets');
const themes = ['carbon', 'neon', 'classic', 'minimal', 'tactical', 'cockpit'];

async function main() {
  const server = http.createServer(async (req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    const target = path.resolve(assets, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(assets + path.sep)) {res.writeHead(403).end(); return;}
    try {
      res.setHeader('Content-Type', target.endsWith('.js') ? 'text/javascript' : target.endsWith('.css') ? 'text/css' : 'text/html');
      res.end(await fs.readFile(target));
    } catch {res.writeHead(404).end();}
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({headless:true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})});
    const context = await browser.newContext({viewport:{width:1470,height:1000}});
    await context.route('**/*', route => {
      const url = route.request().url();
      if (!url.startsWith(origin)) return route.abort();
      // 앱에서는 /media, /art를 네이티브가 기기 파일로 응답합니다. 테스트에서는 빈 응답으로 대신합니다.
      if (/\/(media|art)\?/.test(url)) return route.fulfill({status:404, body:''});
      return route.continue();
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('dna_skin2', JSON.stringify('carnival'));
      window.gpsCalls = {starts:0,stops:0};
      window.gpsFixture = {fix:true,perm:true,enabled:true,provider:'gps',speed:20,bearing:45,azimuth:45,acc:3,alt:52,satsUsed:12,satsSeen:15,lat:37,lon:127,ts:1000};
      window.AndroidBridge = {
        gpsStatus:() => JSON.stringify(window.gpsFixture),
        startGps:() => window.gpsCalls.starts++,
        stopGps:() => window.gpsCalls.stops++,
        keepScreenOn:() => {}
      };
    });
    await page.goto(origin);
    await page.locator('#gStyle').waitFor();
    assert.equal(await page.locator('#gStyle option').count(), themes.length);
    assert.equal(await page.locator('#gStyle').inputValue(), 'carbon');
    const top = sel => page.locator(sel).evaluate(el => el.getBoundingClientRect().top);
    assert.ok(await top('#wGps') < await top('#wMain'), 'Speedometer sits above the main player window');
    await page.locator('#gOn').click();
    await page.waitForFunction(() => document.querySelector('#gSpd').textContent === '72');
    await page.evaluate(() => {gpsFixture.ts+=1000;gpsFixture.lat+=.0001;});
    await page.waitForFunction(() => document.querySelector('#gMax').textContent.startsWith('72'));
    const hashes = [];
    for (const key of themes) {
      await page.locator('#gStyle').selectOption(key);
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#wGps').getAttribute('data-gs'), key);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dna_gStyle'))), key);
      assert.equal(await page.locator('#gSpd').textContent(), '72');
      assert.match(await page.locator('#gAcc').textContent(), /12\/15/);
      hashes.push(await page.locator('#gauge').evaluate(canvas => canvas.toDataURL()));
      if (process.env.AMP_SCREENSHOTS) {
        await fs.mkdir(process.env.AMP_SCREENSHOTS, {recursive:true});
        await page.locator('#wGps').screenshot({path:path.join(process.env.AMP_SCREENSHOTS,key+'.png')});
      }
    }
    assert.equal(new Set(hashes).size, themes.length, 'Each theme must render a distinct live gauge');
    assert.deepEqual(await page.evaluate(() => gpsCalls), {starts:1,stops:0}, 'Changing visual themes must not restart GPS');
    await page.evaluate(() => {gpsFixture.speed=10;gpsFixture.bearing=359;});
    await page.waitForFunction(() => document.querySelector('#gSpd').textContent === '36');
    await page.locator('#gLimit').selectOption('30');
    await page.waitForFunction(() => document.querySelector('#wGps').classList.contains('over'));
    await page.locator('#gHudBtn').click();
    assert.equal(await page.locator('#hud').isVisible(), true);
    await page.waitForFunction(() => document.querySelector('#hSpd').textContent === '36');
    assert.equal(await page.locator('#hSpd').textContent(), '36');
    await page.locator('#hudClose').click();
    for (const [width,height] of [[390,844],[1024,768],[1920,1080]]) {
      await page.setViewportSize({width,height});
      for (const key of themes) {
        await page.locator('#gStyle').selectOption(key);
        await page.waitForTimeout(80);
        assert.equal(await page.locator('#wGps .body').evaluate(el=>el.scrollWidth<=el.clientWidth+2), true, `${key} overflow at ${width}px`);
        assert.ok((await page.locator('#gStyle').boundingBox()).height>=40);
        assert.ok((await page.locator('#gOn').boundingBox()).height>=40);
        if (process.env.AMP_SCREENSHOTS && width===390) await page.locator('#wGps').screenshot({path:path.join(process.env.AMP_SCREENSHOTS,key+'-phone.png')});
      }
    }
    await page.locator('#skin').selectOption('blue');
    assert.equal(await page.locator('#wGps').isVisible(), false);
    assert.equal(await page.locator('#wCtl').isVisible(), false);
    assert.equal(await page.locator('#wAtc').isVisible(), false);
    assert.deepEqual(await page.evaluate(() => gpsCalls), {starts:1,stops:1});
    await page.locator('#skin').selectOption('carnival');
    assert.equal(await page.locator('#gStyle').inputValue(), themes.at(-1));
    assert.deepEqual(await page.evaluate(() => gpsCalls), {starts:2,stops:1});
    await page.reload();
    await page.locator('#gStyle').waitFor();
    assert.equal(await page.locator('#gStyle').inputValue(), themes.at(-1), 'Theme survives app reload');
    await page.evaluate(() => {gpsFixture.fix=false;});
    await page.waitForFunction(() => document.querySelector('#gSpd').textContent === '--');
    await page.evaluate(() => localStorage.setItem('dna_gStyle', JSON.stringify('invalid-theme')));
    await page.reload();
    assert.equal(await page.locator('#gStyle').inputValue(), 'carbon', 'Invalid saved theme has a safe fallback');
    // 사이버 카니발 2 · 콕핏: 자동차 스킨으로 동작하고, 고르면 속도계가 콕핏 PFD로 바뀜
    await page.locator('#skin').selectOption('carnival2');
    assert.equal(await page.locator('html').getAttribute('data-car'), '1');
    assert.equal(await page.locator('#wGps').isVisible(), true);
    assert.equal(await page.locator('#gStyle').inputValue(), 'cockpit');
    assert.equal(await page.locator('#mainTitle').textContent(), 'Daesinnam One');
    assert.equal(await page.locator('.brand .logo-img').isVisible(), false, 'Cockpit drops the KIA logo');
    assert.equal(await page.locator('.brand .af-img').isVisible(), true, 'Cockpit shows the Daesinnam One Air Force logo');
    assert.ok(await page.locator('.brand .af-img').evaluate(i => i.complete && i.naturalWidth > 0), 'Logo image decodes');
    // 콕핏 스킨: 속도계 창만 높이 조절
    assert.equal(await page.locator('#wGps > .grip').isVisible(), true);
    for (const id of ['#wCtl','#wAtc','#wMain','#wEq','#wPl','#wVis']) assert.equal(await page.locator(id+' > .grip').isVisible(), false, id+' has no resize grip');
    assert.equal(await page.locator('#wMain').evaluate(el => getComputedStyle(el).clipPath), 'none', 'Cockpit panels are square-cornered plates, not cut corners');
    const r = sel => page.locator(sel).evaluate(el => {const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,width:b.width}});
    const st = await r('#wGps .gstats'), dl = await r('#dial'), body = await r('#wGps .gps');
    assert.ok(st.bottom <= dl.top, 'Cockpit: trip stats sit in one strip above the speedometer');
    assert.ok(dl.width >= body.width - 2, 'Cockpit: speedometer fills the window width');
    // 콕핏 창을 줄이면 속도계도 함께 작아지고, 늘리면 커짐
    const dialH = () => page.locator('#dial').evaluate(el => el.getBoundingClientRect().height);
    const fullH = await dialH();
    await page.evaluate(() => {const w=document.querySelector('#wGps');w.style.height=(w.getBoundingClientRect().height-220)+'px';w.classList.add('sized')});
    await page.waitForTimeout(150);
    const smallH = await dialH();
    assert.ok(smallH < fullH - 150, `Shrinking the cockpit window shrinks the PFD (${fullH} -> ${smallH})`);
    assert.equal(await page.locator('#wGps .body').evaluate(el => el.scrollHeight <= el.clientHeight + 1), true, 'Shrunk cockpit fits without scrolling');
    const cw = await page.locator('#gauge').evaluate(c => c.width / c.height);
    assert.ok(cw > 2, 'Gauge canvas follows the new aspect ratio');
    await page.evaluate(() => {const w=document.querySelector('#wGps');w.style.height='';w.classList.remove('sized')});
    // 조종 패널(패키지 콘솔): 웹 시연에서는 레버가 바로 바뀌고, 볼륨 노브·+/−·음소거, DRIVE MODE는 앱의 간편 모드
    assert.equal(await page.locator('#wCtl').isVisible(), true);
    assert.equal(await page.locator('#wAtc').isVisible(), true);
    assert.ok((await top('#wGps')) < (await top('#wCtl')) && (await top('#wCtl')) < (await top('#wAtc')), 'Control panel under the speedometer, tower under the panel');
    assert.equal(await page.locator('#dkPlatformText').textContent(), 'WEB DEMO');
    for (const id of ['#dkWifiSwitch','#dkBtSwitch']) {
      const was = await page.locator(id).getAttribute('aria-checked');
      await page.locator(id).click();
      assert.notEqual(await page.locator(id).getAttribute('aria-checked'), was, id+' toggles in the demo');
      await page.locator(id).click();
    }
    await page.locator('#dkVolumeUp').click();
    assert.equal(await page.locator('#dkVolumeValue').textContent(), '47');
    await page.locator('#dkMuteButton').click();
    assert.equal(await page.locator('#dkVolumeValue').textContent(), '0');
    assert.equal(await page.locator('#dkMuteButton').textContent(), 'MUTED');
    await page.locator('#dkMuteButton').click();
    assert.equal(await page.locator('#dkVolumeValue').textContent(), '47', 'Unmute restores the last volume');
    const kb = await page.locator('#dkVolumeKnob').boundingBox();
    await page.mouse.move(kb.x+kb.width/2, kb.y+kb.height/2);await page.mouse.down();await page.mouse.move(kb.x+kb.width/2, kb.y+kb.height/2-30,{steps:5});await page.mouse.up();
    assert.ok(+(await page.locator('#dkVolumeValue').textContent()) > 47, 'Dragging the knob up raises the volume');
    await page.locator('#dkModeSwitch').click();
    await page.waitForFunction(() => !document.querySelector('#drive').hidden);
    await page.locator('#dvClose').click();
    await page.waitForFunction(() => document.querySelector('#dkModeSwitch').getAttribute('aria-checked') === 'false');
    // 관제탑: 점검 문구가 차례로 나오고 끝나면 이륙 허가
    // 두 줄만 보이고, 두 줄 단위로 바뀌며 진행
    await page.evaluate(() => {window.__atcMax=0;window.__atcSeen='';new MutationObserver(()=>{const l=document.querySelector('#atcLog');__atcMax=Math.max(__atcMax,l.children.length);__atcSeen+=l.textContent}).observe(document.querySelector('#atcLog'),{childList:true,subtree:true,characterData:true})});
    await page.waitForFunction(() => /안전벨트/.test(window.__atcSeen) && document.querySelectorAll('#atcLog li').length===2 && /브레이크/.test(window.__atcSeen), null, {timeout:20000});
    assert.equal(await page.evaluate(() => __atcMax), 2, 'Tower shows two lines at a time');
    assert.ok((await page.locator('#wAtc .atcscreen').boundingBox()).height < 70, 'Tower screen is two lines tall');
    await page.locator('#atcSkip').click();
    assert.equal(await page.locator('#atcClr').isVisible(), true);
    assert.equal(await page.locator('#atcLog li').count(), 0, 'Only the takeoff clearance remains');
    await page.locator('#atcRun').click();
    assert.equal(await page.locator('#atcClr').isVisible(), false, 'Re-running the checklist starts over');
    await page.evaluate(() => {window.__spoke=[];window.AndroidBridge.speak=t=>__spoke.push(t)});
    await page.waitForFunction(() => window.__spoke.length > 0 && !document.querySelector('#atcClr').hidden, null, {timeout:40000});
    assert.equal(await page.locator('#atcLog li').count(), 0, 'After the run only the clearance is left');
    // SOS: 가운데 EMERGENCY, 닫힌 덮개에서는 누를 수 없고 덮개를 연 뒤 SOS로 등록 번호에 전화
    const mods = await page.locator('#dkConsole .module h2').allTextContents();
    assert.deepEqual(mods, ['MASTER VOL','DATA LINK','EMERGENCY','COMMS','DRIVE MODE'], 'Panel order from the package');
    assert.equal(await page.locator('#dkSosButton').isDisabled(), true, 'Closed guard disables SOS');
    await page.locator('#dkGuardCover').click();
    assert.equal(await page.locator('#dkSosButton').isEnabled(), true, 'Lifting the guard arms SOS');
    await page.locator('#dkSosButton').click();
    assert.equal(await page.locator('#dkSettingsDialog').isVisible(), true, 'No contact yet: opens panel setup');
    await page.locator('#dkContactPhone').fill('12');
    await page.locator('#dkSettingsForm .save-btn').click();
    assert.equal(await page.locator('#dkFormError').isVisible(), true, 'Invalid number is rejected');
    await page.locator('#dkContactName').fill('가족');
    await page.locator('#dkContactPhone').fill('010-0000-0000');
    await page.locator('#dkSettingsForm .save-btn').click();
    assert.equal(await page.locator('#dkSettingsDialog').isVisible(), false);
    assert.match(await page.locator('#dkContactSummary').textContent(), /가족 · 010···0000/);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dna_sos')).number), '01000000000', 'Shares the app SOS contact store');
    await page.evaluate(() => {window.__calls=[];window.AndroidBridge.sosCall=n=>{__calls.push(n);return 'call'}});
    await page.locator('#dkGuardCover').click();
    await page.locator('#dkSosButton').click();
    assert.equal(await page.locator('#dkSosButton').isDisabled(), true, 'Guard closes again after the call');
    assert.match(await page.locator('#dkSystemMessage').textContent(), /가족|시연/);
    await page.locator('#dkGuardCover').click();
    await page.locator('#dkCollapseButton').click();
    assert.equal(await page.locator('#dkGuardFrame').evaluate(el => el.classList.contains('open')), false, 'Collapsing closes the guard');
    assert.equal(await page.locator('#dkControlDeck').isVisible(), false);
    await page.locator('#dkCollapseButton').click();
    await page.locator('#gStyle').selectOption('carbon');
    assert.equal(await page.locator('#spdBox').evaluate(el => el.style.left), '', 'Leaving the PFD resets the readout position');
    // 지도 창: 처음엔 사용 여부를 묻고 속도계 바로 아래, 사용 안 함이면 접혀서 맨 아래로
    await page.setViewportSize({width:1024,height:768});
    await page.locator('#skin').selectOption('carnival');
    assert.equal(await page.locator('#mapAsk').isVisible(), true);
    const y = sel => page.locator(sel).evaluate(el => el.getBoundingClientRect().top);
    assert.ok(await y('#wGps') < await y('#wMap') && await y('#wMap') < await y('#wMain'), 'Map sits between speedometer and player');
    // TMAP 키: 저장하면 입력란이 접히고 키가 다시 보이지 않음
    await page.locator('#mapYes').click();
    await page.locator('#mapKeyBox summary').click();
    assert.equal(await page.locator('#mapProvSel option').count(), 3, 'Naver, Kakao and TMAP are offered');
    await page.locator('#mapProvSel').selectOption('naver');
    assert.match(await page.locator('#mapKeyHelp').textContent(), /appassets\.androidplatform\.net/);
    await page.locator('#tmapKey').fill('test-key-123');
    assert.equal(await page.locator('#tmapKey').getAttribute('type'), 'password');
    await page.locator('#tmapKeySave').click();
    assert.equal(await page.locator('#mapKeyBox').evaluate(d => d.open), false, 'Key box folds after saving');
    assert.equal(await page.locator('#tmapKey').inputValue(), '', 'Saved key is not shown again');
    assert.match(await page.locator('#mapKeySum').textContent(), /네이버 지도 사용 중 · 키 저장됨/);
    assert.match(await page.locator('#mapbox iframe').getAttribute('src'), /^map\.html\?p=naver&k=test-key-123$/);
    await page.locator('#mapKeyBox summary').click();
    await page.locator('#tmapKeyDel').click();
    assert.match(await page.locator('#mapKeySum').textContent(), /기본 지도/);
    await page.locator('#mapOff').click();
    assert.equal(await page.locator('#wMap').evaluate(el => el.classList.contains('collapsed')), true, 'Unused map is folded');
    assert.equal(await page.locator('#mapOffMsg').count(), 1);
    assert.ok(await y('#wMap') > await y('#wPl'), 'Unused map moves to the bottom');
    // 두 번째 자동차 스킨: 같은 구성, 다른 색, 대신남 로고
    await page.locator('#skin').selectOption('drive');
    assert.equal(await page.locator('#wGps').isVisible(), true, 'Drive skin keeps the speedometer');
    assert.equal(await page.locator('.brand .wm').isVisible(), true, 'Drive skin shows the Daesinnam logo');
    assert.equal(await page.locator('.brand .logo-img').isVisible(), false);
    assert.notEqual(await page.locator('#gauge').evaluate(c => c.toDataURL()), hashes[0], 'Drive skin recolors the gauge');
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
    p3.on('pageerror', error => errors.push(error.message));
    await p3.addInitScript(() => {
      window.AndroidBridge = {pickAudio(){}, takeCarAutoplay:() => false, adjustVolume(){window.__vol=(window.__vol||0)+1}, keepScreenOn(){}, onPlayState(){}, onNowPlaying(){}, onArt(){},
        carStatus:() => JSON.stringify({autoplay:false,carName:'',btPerm:true,autoLaunch:false,connected:['KIA CARNIVAL'],lastKey:'다음 곡',lastKeyAt:Date.now()}),
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
    await p3.locator('#sCarName').selectOption('KIA CARNIVAL');
    assert.equal(await p3.evaluate(() => window.__cn), 'KIA CARNIVAL');
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
    await p3.evaluate(() => window.__carConnected('KIA CARNIVAL'));
    assert.equal(await p3.locator('#toast').isVisible(), true);
    assert.equal(await p3.locator('#drive').isVisible(), true, 'Drive mode opens when the car connects');
    await p3.close();
    // 저장된 곡은 안드로이드 표준 플레이어(Media3)로 재생: 큐 전달·버튼 명령·현재 곡 동기화
    const p4 = await context.newPage();
    p4.on('pageerror', error => errors.push(error.message));
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
    p5.on('pageerror', error => errors.push(error.message));
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
    // 조종 패널 + 앱 연결: 기기 상태가 기준(거짓 ON 없음), 볼륨은 기기 단계로 반올림된 값을 다시 읽음, SOS는 바로 전화
    const p7 = await context.newPage();
    p7.on('pageerror', error => errors.push(error.message));
    await p7.addInitScript(() => {
      localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival2'));localStorage.setItem('dna_sos', JSON.stringify({name:'가족',number:'01000000000'}));
      window.dev = {steps:15,level:6,wifi:false,hasBt:true,bt:null};window.log=[];
      window.AndroidBridge = {gpsStatus:()=>JSON.stringify({fix:false,perm:true,enabled:true}),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{},
        cockpitState:()=>JSON.stringify({volume:Math.round(dev.level*100/dev.steps),wifiSupported:true,wifi:dev.wifi,hasBt:dev.hasBt,...(dev.bt===null?{}:{bt:dev.bt})}),
        setSystemVolume:p=>{dev.level=Math.round(p*dev.steps/100);log.push('vol:'+p)},
        setWifi:w=>{log.push('wifi:'+w);return 'panel'},setBluetooth:w=>{log.push('bt:'+w);return 'ask'},sosCall:n=>{log.push('call:'+n);return 'call'}};
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
    await p7.locator('#dkVolumeUp').click();
    await p7.waitForFunction(() => log.includes('vol:45'));
    await p7.waitForFunction(() => document.querySelector('#dkVolumeValue').textContent === '47', null, {timeout:4000});
    await p7.locator('#dkGuardCover').click();await p7.locator('#dkSosButton').click();
    assert.ok((await p7.evaluate(() => log)).includes('call:01000000000'));
    await p7.close();
    // 콕핏 PFD: 기울기·나침반 센서, 구름, 야간 하늘
    const p6 = await context.newPage();
    p6.on('pageerror', error => errors.push(error.message));
    await p6.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('dna_skin2', JSON.stringify('carnival2'));localStorage.setItem('dna_gStyle', JSON.stringify('cockpit'));localStorage.setItem('dna_gSky', JSON.stringify('day'));
      window.attF = {ok:true,r:[1,0,0,0,1,0,0,0,1],srot:0,decl:0,compass:true};window.attCalls={start:0,stop:0};
      window.AndroidBridge = {gpsStatus:()=>JSON.stringify({fix:false,perm:true,enabled:true}),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{},
        attStart:()=>attCalls.start++,attStop:()=>attCalls.stop++,attitude:()=>JSON.stringify(attF)};
    });
    await p6.goto(origin);
    await p6.waitForFunction(() => window.__att && __att.ref && attCalls.start === 1, null, {timeout:5000});
    // 오른쪽으로 20° 기울이고 동쪽(90°)을 향함
    await p6.evaluate(() => {const t=20/180*Math.PI,c=Math.cos(t),s=Math.sin(t),y=Math.PI/2,cy=Math.cos(y),sy=Math.sin(y);
      const Ry=[c,0,s,0,1,0,-s,0,c],Rz=[cy,sy,0,-sy,cy,0,0,0,1],m=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++){let v=0;for(let k=0;k<3;k++)v+=Rz[i*3+k]*Ry[k*3+j];m.push(v)}attF.r=m});
    await p6.waitForFunction(() => Math.abs(__att.bank-20) < 1 && Math.abs(__att.hdg-90) < 1);
    await p6.waitForFunction(() => /^09\d° E/.test(document.querySelector('#gHdg').textContent), null, {timeout:5000});
    const dayImg = await p6.locator('#gauge').evaluate(c => c.toDataURL());
    await p6.locator('#gLevel').click();
    await p6.waitForFunction(() => Math.abs(__att.bank) < 1, null, {timeout:3000});
    await p6.locator('#gSky').selectOption('night');
    await p6.waitForTimeout(300);
    const px = await p6.locator('#gauge').evaluate(c => {const d=c.getContext('2d').getImageData(Math.round(c.width*.5),Math.round(c.height*.2),1,1).data;return d[0]+d[1]+d[2]});
    assert.ok(px < 260, `Night sky is dark (${px})`);
    assert.notEqual(await p6.locator('#gauge').evaluate(c => c.toDataURL()), dayImg);
    assert.equal(await p6.locator('#gLevel').isVisible(), true);
    await p6.locator('#gStyle').selectOption('carbon');
    assert.equal(await p6.locator('#gLevel').isVisible(), false, 'Level/sky controls only for the PFD');
    await p6.locator('#skin').selectOption('blue');
    await p6.waitForFunction(() => attCalls.stop === 1, null, {timeout:3000});
    await p6.close();
    assert.deepEqual(errors, []);
    console.log('PASS: six live themes, PFD tilt/compass/clouds/night, cockpit skin, cockpit resize, package control console, SOS guard+call, two-line tower, GPS continuity, HUD/limit, no-fix state, persistence, 3 responsive sizes, map placement, drive skin, permission folding, saved playlist, settings, drive mode, car connect, native player hand-off and touch EQ drag');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {console.error(error);process.exitCode=1;});
