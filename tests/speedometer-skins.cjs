const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const assets = path.resolve(__dirname, '../app/src/main/assets');
const themes = ['carbon', 'neon', 'classic', 'minimal', 'tactical'];

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
    page.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
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
    assert.equal(await page.locator('#gStyle option:not([disabled])').count(), themes.length, 'Car mode offers the five car designs only');
    assert.equal(await page.locator('#gStyle option[value="cockpit"]').evaluate(o => o.disabled), true, 'Cockpit PFD is not offered in car mode');
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
    // 대신남 자동차 모드 · 콕핏: 자동차 스킨으로 동작하고, 고르면 속도계가 콕핏 PFD로 바뀜
    await page.locator('#skin').selectOption('carnival2');
    assert.equal(await page.locator('html').getAttribute('data-car'), '1');
    assert.equal(await page.locator('#wGps').isVisible(), true);
    assert.equal(await page.locator('#gStyle').inputValue(), 'cockpit');
    assert.equal(await page.locator('#mainTitle').textContent(), 'Daesinnam One');
    assert.equal(await page.locator('.brand .logo-img').count(), 0, 'No third-party car-maker logo in the app');
    assert.equal(await page.evaluate(() => /카니발|KIA|Carnival/i.test(document.body.innerText + [...document.querySelectorAll('#skin option')].map(o=>o.textContent).join(''))), false, 'No Kia/Carnival names on screen');
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#skin option')].filter(o=>/^carnival/.test(o.value)).map(o=>o.textContent)), ['대신남 자동차 모드','대신남 자동차 모드 · 콕핏','대신남 자동차 모드 · 콕핏 2','대신남 자동차 모드 · 콕핏 3']);
    // 설정 → 오픈소스 라이선스
    await page.locator('#setBtn').click();
    assert.match(await page.locator('#secOss').textContent(), /Apache License 2\.0[\s\S]*Leaflet[\s\S]*jsmediatags[\s\S]*OpenStreetMap contributors/);
    assert.equal(await page.locator('#secOss details pre').count(), 4, 'Full license texts included');
    assert.match(await page.locator('#secOss details pre').first().textContent(), /TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION/);
    await page.locator('#setClose').click();
    assert.equal(await page.locator('.brand .af-img').isVisible(), true, 'Cockpit shows the Daesinnam One Air Force logo');
    assert.ok(await page.locator('.brand .af-img').evaluate(i => i.complete && i.naturalWidth > 0), 'Logo image decodes');
    // 콕핏 스킨: 속도계 창만 높이 조절(조절 버튼이 있음)
    assert.equal(await page.locator('#gRz').isVisible(), true);
    for (const id of ['#wCtl','#wAtc','#wMain','#wEq','#wPl','#wVis']) assert.equal(await page.locator(id+' > .grip').isVisible(), false, id+' has no resize grip');
    assert.equal(await page.locator('#wMain').evaluate(el => getComputedStyle(el).clipPath), 'none', 'Cockpit panels are square-cornered plates, not cut corners');
    const r = sel => page.locator(sel).evaluate(el => {const b=el.getBoundingClientRect();return {top:b.top,bottom:b.bottom,width:b.width}});
    assert.equal(await page.locator('#pfdHost .dsn-pfd').isVisible(), true, 'Cockpit uses the Daesinnam PFD package');
    assert.equal(await page.locator('#wGps .body > .gps').isVisible(), false, 'Old cockpit gauge hidden');
    assert.equal(await page.locator('#pfdHost .pfd-header').isVisible(), false, 'App window bar is the only title bar');
    const st = await r('#pfdHost .pfd-metrics'), dl = await r('#pfdHost .pfd-canvas-wrap'), body = await r('#pfdHost .pfd-glass');
    assert.ok(st.bottom <= dl.top, 'Cockpit: trip stats sit in one strip above the speedometer');
    assert.ok(dl.width >= body.width - 2, 'Cockpit: speedometer fills the window width');
    // 속도계 크기 조절은 조절 버튼을 켰을 때만
    assert.equal(await page.locator('#wGps > .grip').isVisible(), false, 'Grip hidden until resize mode');
    await page.locator('#gRz').click();
    assert.equal(await page.locator('#wGps > .grip').isVisible(), true);
    const g0 = await page.locator('#wGps').evaluate(el => el.getBoundingClientRect().height);
    await page.locator('#wGps > .grip').scrollIntoViewIfNeeded();
    const gb = await page.locator('#wGps > .grip').boundingBox();
    await page.mouse.move(gb.x+gb.width/2, gb.y+gb.height/2);await page.mouse.down();await page.mouse.move(gb.x+gb.width/2, gb.y+gb.height/2-120,{steps:6});await page.mouse.up();
    const g1 = await page.locator('#wGps').evaluate(el => el.getBoundingClientRect().height);
    assert.ok(g1 < g0 - 80, `Dragging in resize mode shrinks the window (${g0} -> ${g1})`);
    await page.locator('#wGps > .grip').dblclick();
    await page.locator('#gRz').click();
    assert.equal(await page.locator('#wGps > .grip').isVisible(), false, 'Turning resize off hides the grip again');
    assert.equal(await page.locator('#gRz').getAttribute('aria-pressed'), 'false');
    // 콕핏 창을 줄이면 속도계도 함께 작아지고, 늘리면 커짐
    const dialH = () => page.locator('#pfdHost .pfd-canvas-wrap').evaluate(el => el.getBoundingClientRect().height);
    const fullH = await dialH();
    await page.evaluate(() => {const w=document.querySelector('#wGps');w.style.height=(w.getBoundingClientRect().height-220)+'px';w.classList.add('sized')});
    await page.waitForTimeout(150);
    const smallH = await dialH();
    assert.ok(smallH < fullH - 150, `Shrinking the cockpit window shrinks the PFD (${fullH} -> ${smallH})`);
    assert.equal(await page.locator('#wGps .body').evaluate(el => el.scrollHeight <= el.clientHeight + 1), true, 'Shrunk cockpit fits without scrolling');
    await page.waitForTimeout(150);
    const cw = await page.locator('#pfdHost canvas').evaluate(c => c.width / c.height);
    assert.ok(cw > 3, `PFD canvas follows the new aspect ratio (${cw})`);
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
    assert.deepEqual(mods, ['미디어 볼륨','와이파이','EMERGENCY','블루투스','간편 모드'], 'Korean titles, EMERGENCY stays English');
    assert.equal(await page.locator('#dkConsole .subline').count(), 0, 'No sublines');
    assert.equal(await page.locator('#dkConsole .console-footer').isVisible(), false, 'No footer message/usage line');
    assert.equal(await page.evaluate(() => document.querySelector('#dkMuteButton').parentElement.className), 'volume-strip', 'MUTE sits next to +');
    assert.ok((await page.locator('#wCtl').boundingBox()).height < 340, 'Control panel stays compact');
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
    await page.locator('#skin').selectOption('carnival');
    assert.notEqual(await page.locator('#wGps').getAttribute('data-gs'), 'cockpit', 'Leaving the cockpit skin drops the PFD');
    assert.equal(await page.locator('#gStyle option[value="cockpit"]').evaluate(o => o.disabled), true);
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
    // 조종 패널 + 앱 연결: 기기 상태가 기준(거짓 ON 없음), 볼륨은 기기 단계로 반올림된 값을 다시 읽음, SOS는 바로 전화
    const p7 = await context.newPage();
    p7.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await p7.addInitScript(() => {
      localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival2'));localStorage.setItem('dna_sos', JSON.stringify({name:'가족',number:'01000000000'}));
      window.dev = {steps:15,level:6,wifi:false,hasBt:true,bt:null};window.log=[];
      window.AndroidBridge = {gpsStatus:()=>JSON.stringify({fix:false,perm:true,enabled:true}),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{},
        cockpitState:()=>JSON.stringify({volume:Math.round(dev.level*100/dev.steps),wifiSupported:true,wifi:dev.wifi,hasBt:dev.hasBt,...(dev.bt===null?{}:{bt:dev.bt})}),
        setSystemVolume:p=>{dev.level=Math.round(p*dev.steps/100);log.push('vol:'+p)},
        setWifi:w=>{log.push('wifi:'+w);return 'panel'},openApp:k=>log.push('open:'+k),openAppSide:k=>{log.push('side:'+k);return 'rotated'},openAppBottom:k=>{log.push('bottom:'+k);return 'bottom'},setBluetooth:w=>{log.push('bt:'+w);return 'ask'},sosCall:n=>{log.push('call:'+n);return 'call'}};
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
    // 지도: TMAP 켜기 / 하단에 켜기(위아래 반씩) / 옆 창
    await p7.locator('#mapYes').click();
    assert.deepEqual(await p7.locator('#wMap [data-tmap]').allTextContents(), ['TMAP 켜기','TMAP 하단에 켜기','TMAP 옆 창']);
    await p7.locator('#wMap [data-tmap="bottom"]').click();
    await p7.locator('#wMap [data-tmap="open"]').click();
    const tl = await p7.evaluate(() => log.filter(x => /^(open|bottom|side):/.test(x)));
    assert.deepEqual(tl, ['bottom:com.skt.tmap.ku','open:com.skt.tmap.ku']);
    assert.match(await p7.locator('#toast').textContent(), /아래쪽/);
    // 옆 창: 세로 화면이면 가로로 돌린 뒤 좌우로 붙인다고 안내
    await p7.locator('#wMap [data-tmap="side"]').click();
    assert.ok((await p7.evaluate(() => log)).includes('side:com.skt.tmap.ku'), 'Side launch requested');
    assert.match(await p7.locator('#toast').textContent(), /가로/);
    await p7.close();
    // 창 순서: 설정에서 바꾸고 되돌리기
    const pa = await context.newPage();
    pa.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await pa.addInitScript(() => {if(sessionStorage.getItem('pa'))return;sessionStorage.setItem('pa','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival2'));});
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
    await pa.locator('#skin').selectOption('blue');
    assert.ok(await ty('#wMain') < await ty('#wPl'), 'Other skins keep their own order');
    await pa.locator('#skin').selectOption('carnival2');
    await pa.locator('#setBtn').click();
    await pa.locator('#ordReset').click();
    await pa.locator('#setClose').click();
    assert.ok(await ty('#wGps') < await ty('#wAtc'), 'Reset restores the default layout');
    await pa.close();
    // D1 DASHCAM: 자동차 스킨에만 보이고, 연결 → 실시간 화면(/cam/frame.jpg) → 카메라 찾기 결과, 인터넷은 모바일 데이터 표시
    const pc = await context.newPage();
    pc.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    const jpg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDhKKKK4DzD/9k=','base64');
    let camHits = 0;
    await pc.route('**/cam/frame.jpg*', route => { camHits++; route.fulfill({status:200, contentType:'image/jpeg', body:jpg}); });
    await pc.addInitScript(() => {if(!sessionStorage.getItem('pc')){sessionStorage.setItem('pc','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival2'));localStorage.setItem('dna_layout', JSON.stringify('1'))}
      const c={state:'idle',internet:true,defaultNet:'mobile',live:false,frames:0,probe:[],probing:false,fps:0,packets:0};window.__cam=c;window.__camCalls=[];
      window.AndroidBridge={gpsStatus:()=>JSON.stringify({fix:false,perm:true,enabled:true}),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{},
        camState:()=>JSON.stringify(c),
        camConnect:(s,p)=>{window.__camCalls.push(['connect',s,p]);Object.assign(c,{state:'connected',via:'request',camIp:'192.168.29.1',gateway:'192.168.29.1',localIp:'192.168.29.2'});setTimeout(()=>window.__camConnect&&window.__camConnect('request'),10)},
        camDisconnect:()=>{window.__camCalls.push(['disconnect']);Object.assign(c,{state:'idle',live:false,frames:0})},
        camLive:on=>{window.__camCalls.push(['live',on]);c.live=on;if(on){c.frames=0;c.proto='jhcmd';let n=0;clearInterval(window.__ci);window.__ci=setInterval(()=>{if(!c.live)return;c.frames=++n;c.fps=15},80)}},
        camProbe:()=>{c.probe=[{what:'JHCMD (UDP 20000 → 10900)',ip:'192.168.29.1',ok:true,note:'영상 조각 42개 수신'},{what:'RTSP (TCP 554)',ip:'192.168.29.1',ok:false,note:'닫힘'}]}};});
    await pc.goto(origin);
    const camTop = await pc.locator('#wCam').evaluate(el => el.getBoundingClientRect().top);
    const lastTop = await pc.evaluate(() => Math.max(...[...document.querySelectorAll('#app>.win')].filter(w=>w.offsetParent&&w.id!=='wCam').map(w=>w.getBoundingClientRect().top)));
    assert.ok(camTop > lastTop, 'Dashcam sits at the very bottom');
    assert.match(await pc.locator('#wCam .camcompat').textContent(), /호환 기종/);
    assert.equal(await pc.locator('#wCam .bar .t').textContent(), 'D1 Dashcam');
    assert.match(await pc.locator('#camNet').textContent(), /인터넷\s*모바일 데이터/);
    assert.ok(await pc.locator('#camLiveBtn').isDisabled());
    await pc.locator('#camConn').click();
    await pc.waitForFunction(() => document.querySelector('#camImg') && !document.querySelector('#camImg').hidden, null, {timeout:5000});
    const calls = await pc.evaluate(() => window.__camCalls);
    assert.deepEqual(calls[0], ['connect','Car-Cam*',''], 'Default SSID pattern Car-Cam*');
    assert.ok(calls.some(c => c[0]==='live' && c[1]===true), 'Connect starts live view');
    await pc.waitForFunction(() => document.querySelector('#camImg').naturalWidth > 0);
    assert.ok(camHits >= 1, 'Frames requested from /cam/frame.jpg');
    assert.equal(await pc.locator('#camSt').textContent(), 'LIVE');
    assert.match(await pc.locator('#camNet').textContent(), /192\.168\.29\.1/);
    assert.match(await pc.locator('#camNet').textContent(), /JHCMD/);
    await pc.locator('#camProbeBtn').click();
    await pc.waitForFunction(() => document.querySelectorAll('#camProbeList li').length === 2);
    assert.ok(await pc.locator('#camSetBox').evaluate(el => el.open));
    await pc.locator('#camFull').click();
    assert.ok(await pc.locator('#wCam').evaluate(el => el.classList.contains('full')));
    await pc.locator('#camView').click();
    assert.ok(!(await pc.locator('#wCam').evaluate(el => el.classList.contains('full'))));
    await pc.locator('#camSsid').fill('Car-Cam c9e710');
    await pc.locator('#camSave').click();
    assert.equal(await pc.locator('#camSsidSum').textContent(), 'Car-Cam c9e710');
    await pc.locator('#camConn').click();
    assert.ok((await pc.evaluate(() => window.__camCalls)).some(c => c[0]==='disconnect'));
    await pc.waitForFunction(() => document.querySelector('#camImg').hidden);
    await pc.locator('#camConn').click();
    assert.deepEqual((await pc.evaluate(() => window.__camCalls)).filter(c=>c[0]==='connect').pop(), ['connect','Car-Cam c9e710',''], 'Saved SSID used');
    // 폴드7처럼 휴대폰 전체가 블랙박스 와이파이에 붙은 경우: 이 앱은 모바일 데이터로 우회, 다른 앱 막힘 안내
    await pc.evaluate(() => Object.assign(__cam,{via:'existing',sysCam:true,sysInternet:false,cellBound:true,internet:true,defaultNet:'mobile'}));
    await pc.waitForFunction(() => /모바일 데이터로 우회/.test(document.querySelector('#camNet').textContent), null, {timeout:3000});
    assert.match(await pc.locator('#camNet').textContent(), /다른 앱 인터넷\s*막힘/);
    assert.equal(await pc.locator('#camNet .camwarn').isVisible(), true, 'Warns that the phone joined the dashcam Wi-Fi system-wide');
    assert.match(await pc.locator('#camNet .camwarn').textContent(), /삭제/);
    await pc.evaluate(() => Object.assign(__cam,{via:'request',sysCam:false,sysInternet:true,cellBound:false}));
    await pc.waitForFunction(() => !document.querySelector('#camNet .camwarn'), null, {timeout:3000});
    await pc.locator('#skin').selectOption('blue');
    assert.ok(!(await pc.locator('#wCam').isVisible()), 'Dashcam hidden outside car skins');
    await pc.close();
    // 시각화 효과 10종: 고를 때마다 다른 화면, 다시 열어도 유지, 캔버스를 누르면 다음 효과
    const p9 = await context.newPage();
    p9.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await p9.addInitScript(() => {if(sessionStorage.getItem('p9'))return;sessionStorage.setItem('p9','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival2'));});
    await p9.goto(origin);
    assert.equal(await p9.locator('#visSel option').count(), 20);
    const visImgs = new Set();
    for (let m = 0; m < 20; m++) {await p9.locator('#visSel').selectOption(String(m));await p9.waitForTimeout(120);visImgs.add(await p9.locator('#vis').evaluate(c => c.toDataURL()))}
    assert.ok(visImgs.size >= 18, `Effects render differently (${visImgs.size}/20)`);
    await p9.locator('#visSel').selectOption('19');
    await p9.locator('#wVis .vstep[data-d="1"]').click();
    assert.equal(await p9.locator('#visSel').inputValue(), '0', 'Next wraps around');
    await p9.locator('#visSel').selectOption('5');
    await p9.reload();
    assert.equal(await p9.locator('#visSel').inputValue(), '5', 'Chosen effect survives reload');
    const sc = await p9.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--led3').trim());
    assert.equal(sc, '#a8f08f', 'Cockpit scope uses the green from the reference gauge');
    await p9.close();
    // 관제탑 속도 주의: 50/100/120/150/180/200km/h 도달 시 빨간 글자
    const p8 = await context.newPage();
    p8.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await p8.addInitScript(() => {if(!sessionStorage.getItem('p8')){sessionStorage.setItem('p8','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival2'))}
      window.g8={fix:true,perm:true,enabled:true,provider:'gps',speed:5,bearing:0,azimuth:-1,acc:3,alt:10,satsUsed:9,satsSeen:12,lat:37,lon:127,ts:1000};
      window.AndroidBridge={gpsStatus:()=>JSON.stringify(g8),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{}};});
    await p8.goto(origin);
    await p8.locator('#pfdHost [data-role="gps"]').click();
    await p8.waitForFunction(() => window.pfd.getState().valid && document.querySelector('#pfdHost [data-role="signalText"]').textContent === 'GPS LIVE', null, {timeout:3000});
    assert.equal(Math.round(await p8.evaluate(() => pfd.getState().telemetry.speedKmh)), 18, 'PFD gets the app GPS speed in km/h');
    assert.equal(await p8.locator('#pfdHost [data-role="gpsText"]').textContent(), 'GPS 끄기');
    assert.equal(await p8.locator('#pfdHost [data-role="satellites"]').textContent(), '위성 9/12');
    // PFD v1.1: 배경(구름·도심)이 실제 속도에 맞춰 움직이고, 테마는 앱이 낮·밤을 넘김, 배경 이동 설정 저장
    const v0 = await p8.evaluate(() => pfd.getVisualState().distanceMeters);
    await p8.waitForTimeout(800);
    const v1 = await p8.evaluate(() => pfd.getVisualState());
    assert.ok(v1.moving && v1.distanceMeters > v0, 'Scene moves with the GPS speed');
    // 좌우 선회: 방위가 바뀌면 배경이 옆으로 흐름
    const yaw0 = await p8.evaluate(() => pfd.scene.yawAcc || 0);
    await p8.evaluate(() => {g8.bearing=40;g8.ts+=1000});
    await p8.waitForFunction(y0 => Math.abs((pfd.scene.yawAcc||0) - y0 - 40) < 2, yaw0, {timeout:3000});
    await p8.evaluate(() => {g8.bearing=0;g8.ts+=1000});
    await p8.waitForFunction(y0 => Math.abs((pfd.scene.yawAcc||0) - y0) < 2, yaw0, {timeout:3000});
    await p8.locator('#pfdHost [data-role="settings"]').click();
    await p8.locator('#pfdHost [data-role="theme"]').selectOption('night');
    await p8.locator('#pfdHost .pfd-save').click();
    assert.equal(await p8.evaluate(() => pfd.getVisualState().theme), 'night');
    assert.equal(await p8.evaluate(() => JSON.parse(localStorage.getItem('dna_pfdSet')).theme), 'night');
    await p8.locator('#pfdHost [data-role="settings"]').click();
    assert.equal(await p8.locator('#pfdHost [data-role="theme"]').inputValue(), 'night');
    await p8.locator('#pfdHost [data-role="theme"]').selectOption('auto');
    await p8.locator('#pfdHost .pfd-save').click();
    const hr = await p8.evaluate(() => new Date().getHours());
    assert.equal(await p8.evaluate(() => pfd.getVisualState().theme), (hr>=19||hr<6)?'night':'day', 'Auto follows the app night hours');
    assert.equal(await p8.locator('#pfdHost [data-role="themeText"]').textContent(), '테마 자동');
    assert.equal(await p8.evaluate(() => JSON.parse(localStorage.getItem('dna_pfdSet')).sceneMotion), true);
    // PFD v1.2 에어포스: 하단 목록에서 고르면 디자인만 바뀌고(주야간·기록 유지), 저장되고, 콕핏으로 되돌림
    assert.deepEqual(await p8.locator('#pfdHost [data-role="mode"] option').allTextContents(), ['콕핏 PFD','에어포스','심플 HUD']);
    const d0 = await p8.evaluate(() => pfd.getVisualState().distanceMeters);
    await p8.locator('#pfdHost [data-role="mode"]').selectOption('airforce');
    assert.equal(await p8.evaluate(() => pfd.root.classList.contains('pfd-airforce')), true);
    assert.equal(await p8.locator('#pfdHost .pfd-header').isVisible(), true, 'Air force shows the DAESINNAM ONE header');
    assert.equal(await p8.evaluate(() => JSON.parse(localStorage.getItem('dna_pfdSet')).skin), 'airforce');
    assert.equal(await p8.evaluate(() => JSON.parse(localStorage.getItem('dna_pfdSet')).theme), 'auto', 'Design switch keeps the day/night choice');
    assert.ok(await p8.evaluate(() => pfd.getVisualState().distanceMeters) >= d0, 'Scene keeps going');
    await p8.reload();
    await p8.waitForFunction(() => window.pfd && pfd.settings.skin === 'airforce', null, {timeout:3000});
    await p8.locator('#pfdHost [data-role="mode"]').selectOption('pfd');
    assert.equal(await p8.evaluate(() => pfd.settings.skin), 'cockpit');
    assert.equal(await p8.locator('#pfdHost .pfd-header').isVisible(), false);
    await p8.waitForFunction(() => pfd.getState().valid, null, {timeout:3000});
    await p8.evaluate(() => {g8.speed=0;g8.ts+=1000});
    await p8.waitForFunction(() => !pfd.getVisualState().moving, null, {timeout:3000});
    await p8.evaluate(() => {g8.speed=5;g8.ts+=1000});
    await p8.waitForTimeout(500);
    assert.equal(await p8.locator('#atcWarn').isVisible(), false);
    await p8.evaluate(() => {g8.speed=14.2;g8.ts+=1000});
    await p8.waitForTimeout(500);
    assert.equal(await p8.locator('#atcWarn').isVisible(), false, 'No tower warning at 50 km/h any more');
    assert.equal(await p8.locator('#atcWarn b').evaluate(el => getComputedStyle(el).color), 'rgb(255, 59, 48)', 'Warning is red');
    await p8.evaluate(() => {g8.speed=34;g8.ts+=1000});
    await p8.waitForFunction(() => /120 km/.test(document.querySelector('#atcWarn').textContent), null, {timeout:3000});
    assert.match(await p8.locator('#atcWarn').textContent(), /속도 주의 · 120 km\/h/);
    await p8.waitForFunction(() => pfd.getState().telemetry.maxSpeedKmh > 100, null, {timeout:3000});
    await p8.locator('#pfdHost [data-role="reset"]').click();
    assert.equal(await p8.evaluate(() => JSON.parse(localStorage.getItem('dna_trip')).max), 0, 'PFD reset clears the app trip record');
    await p8.locator('#pfdHost [data-role="settings"]').click();
    await p8.locator('#pfdHost [data-role="limitInput"]').fill('80');
    await p8.locator('#pfdHost .pfd-save').click();
    assert.equal(await p8.evaluate(() => JSON.parse(localStorage.getItem('dna_gLimit'))), 80, 'PFD speed limit is the app speed warning');
    await p8.locator('#pfdHost [data-role="gps"]').click();
    await p8.waitForFunction(() => document.querySelector('#pfdHost [data-role="signalText"]').textContent === 'GPS OFF', null, {timeout:3000});
    await p8.close();
    // 자동차·드라이브 스킨: 저장된 콕핏 PFD가 있어도 일반 속도계로, 자세 센서도 켜지 않음
    for (const sk of ['carnival','drive']) {
      const p6 = await context.newPage();
      p6.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
      await p6.addInitScript(k => {
        localStorage.clear();
        localStorage.setItem('dna_skin2', JSON.stringify(k));localStorage.setItem('dna_gStyle', JSON.stringify('cockpit'));
        window.attCalls={start:0,stop:0};
        window.AndroidBridge = {gpsStatus:()=>JSON.stringify({fix:false,perm:true,enabled:true}),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{},
          attStart:()=>attCalls.start++,attStop:()=>attCalls.stop++,attitude:()=>JSON.stringify({ok:false})};
      }, sk);
      await p6.goto(origin);
      await p6.locator('#gStyle').waitFor();
      await p6.waitForTimeout(400);
      assert.equal(await p6.locator('#wGps').getAttribute('data-gs'), 'carbon', sk+': stored cockpit PFD falls back to the car gauge');
      assert.equal(await p6.locator('#gStyle option[value="cockpit"]').evaluate(o => o.disabled), true, sk+': no cockpit PFD option');
      assert.equal(await p6.locator('#gLevel').isVisible(), false, sk+': no PFD level control');
      assert.equal(await p6.locator('#wCtl').isVisible(), false, sk+': no cockpit control panel');
      assert.equal(await p6.locator('#wAtc').isVisible(), false, sk+': no tower window');
      assert.equal(await p6.evaluate(() => attCalls.start), 0, sk+': attitude sensors stay off');
      await p6.close();
    }
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
      await p7.locator('#skin').selectOption('carnival');
      assert.equal(await p7.locator('#wPl > .bar .rzbtn').isVisible(), false, 'Car mode keeps its own resizing (no button)');
      assert.equal(await p7.locator('#wPl > .grip').isVisible(), true, 'Car mode grip stays direct');
      await p7.close();
    }
    // 로고 옆 시계: 서울 시간 + 해외 시간 하나
    {
      const p9 = await context.newPage();
      p9.on('pageerror', error => errors.push(error.message));
      await p9.addInitScript(() => {if(sessionStorage.getItem('once'))return;sessionStorage.setItem('once','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival2'));});
      await p9.clock.install({time: new Date('2026-10-30T13:05:00Z')});
      await p9.goto(origin);
      await p9.locator('#clkTime').waitFor({state:'attached'});
      await p9.clock.runFor(1500);
      assert.equal(await p9.locator('#clkTime').textContent(), '22:05');
      assert.match(await p9.locator('#clkDate').textContent(), /10\.30 \(금\)/);
      const cb = await p9.locator('#clock').boundingBox(), bb = await p9.locator('.brand').boundingBox();
      assert.ok(cb.x >= bb.x + bb.width - 2 && Math.abs((cb.y+cb.height/2)-(bb.y+bb.height/2)) < bb.height/2, 'Clock sits next to the logo');
      assert.equal(await p9.locator('#clkWTime').textContent(), '+ 추가');
      await p9.locator('#clkWorld').click();
      assert.equal(await p9.locator('#settings').isVisible(), true, 'Tapping the world clock opens settings');
      await p9.locator('#sWorld').selectOption('America/New_York');
      await p9.clock.runFor(1100);
      assert.equal(await p9.locator('#clkWTime').textContent(), '09:05');
      assert.equal(await p9.locator('#clkDiff').textContent(), '−13h');
      await p9.reload();await p9.clock.runFor(1500);
      assert.match(await p9.locator('#clkCity').textContent(), /뉴욕/, 'World city remembered');
      await p9.close();
    }
    // 대신남 원 Ver1: 처음엔 콕핏 스킨·아날로그 시계, PFD는 활주로 대기 → 이륙 → 순항 → 착륙 → 도착
    {
      const pf = await context.newPage();
      pf.on('pageerror', error => errors.push(error.message));
      await pf.addInitScript(() => {if(sessionStorage.getItem('pf'))return;sessionStorage.setItem('pf','1');localStorage.clear();
        window.__said=[];window.AndroidBridge={gpsStatus:()=>JSON.stringify({fix:false,perm:true,enabled:true}),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{},speak:t=>window.__said.push(t)};});
      await pf.goto(origin);
      await pf.waitForFunction(() => window.AmpFlight);
      assert.equal(await pf.evaluate(() => document.documentElement.dataset.skin), 'carnival2', 'Ver1 opens in the cockpit skin');
      assert.equal(await pf.locator('#clkDialNow').isVisible(), true, 'Cockpit shows the round analog clock by default');
      assert.equal(await pf.locator('#clkTime').isVisible(), false);
      await pf.locator('#clkNow').click();
      assert.equal(await pf.locator('#clkTime').isVisible(), true, 'Tapping the clock switches to digital');
      await pf.locator('#clkNow').click();
      assert.equal(await pf.evaluate(() => JSON.parse(localStorage.getItem('dna_clockStyle'))), 'analog');
      const ph = () => pf.evaluate(() => AmpFlight.state.phase);
      assert.equal(await ph(), 'hold', 'Stands on the runway at start');
      assert.match(await pf.locator('.flt-badge').textContent(), /RWY/);
      const img0 = await pf.evaluate(() => {AmpFlight.redraw();return document.querySelector('#pfdHost canvas').toDataURL()});
      await pf.evaluate(() => AmpFlight.step(2, 30));
      assert.equal(await ph(), 'roll', 'Accelerating starts the takeoff roll');
      await pf.evaluate(() => AmpFlight.step(4, 6));
      assert.equal(await ph(), 'climb', 'Lifts off once moving at 5 km/h');
      await pf.evaluate(() => AmpFlight.step(1.5, 30));
      assert.ok(await pf.evaluate(() => AmpFlight.state.pitch) > 3, 'Nose up while climbing '+JSON.stringify(await pf.evaluate(() => AmpFlight.state)));
      assert.equal(await pf.locator('.flt-land').isVisible(), true, 'Land button while airborne');
      await pf.evaluate(() => AmpFlight.step(30, 80));
      assert.equal(await ph(), 'cruise');
      const img1 = await pf.evaluate(() => {AmpFlight.redraw();return document.querySelector('#pfdHost canvas').toDataURL()});
      assert.notEqual(img0, img1, 'Runway view differs from cruise view');
      await pf.locator('.flt-land').click();
      assert.equal(await ph(), 'approach');
      assert.equal(await pf.locator('.flt-ga').isVisible(), true, 'Go-around offered during approach');
      const a0 = await pf.evaluate(() => AmpFlight.state.alt);
      await pf.evaluate(() => AmpFlight.step(10, 70));
      const s1 = await pf.evaluate(() => AmpFlight.state);
      assert.ok(s1.rem > 0 && s1.alt < a0, 'Descends toward the runway with speed');
      await pf.evaluate(() => AmpFlight.step(5, 0));
      assert.equal(await pf.evaluate(() => AmpFlight.state.auto), true, 'Stopping the car finishes the landing automatically');
      await pf.evaluate(() => AmpFlight.step(20, 0));
      assert.equal(await ph(), 'landed', 'Touches down, rolls out and arrives');
      assert.match(await pf.locator('.flt-badge').textContent(), /ARRIVED/);
      await pf.evaluate(() => AmpFlight.step(2, 20));
      assert.equal(await ph(), 'roll', 'Driving again starts a new departure');
      // 과속 경고: 기본 120·150km/h만(50km/h는 없음). 120을 넘으면 SLOW DOWN 빨간 경고 3번 + 음성
      await pf.evaluate(() => {window.__said=[];AmpHost.speedTick(30);AmpHost.speedTick(55)});
      assert.equal(await pf.locator('#wGps').evaluate(el => el.classList.contains('slowing')), false, 'No warning at 50 km/h');
      await pf.evaluate(() => {window.__said=[];AmpHost.speedTick(110);AmpHost.speedTick(125)});
      assert.equal(await pf.locator('#wGps .slowfx').isVisible(), true, 'Red SLOW DOWN overlay over the flight window');
      assert.match(await pf.locator('#wGps .slowfx').textContent(), /SLOW DOWN/);
      assert.equal(await pf.locator('#wGps .slowfx').evaluate(el => getComputedStyle(el).animationIterationCount), '3', 'Flashes three times');
      assert.match((await pf.evaluate(() => __said)).join(' '), /슬로우 다운/);
      await pf.waitForFunction(() => !document.querySelector('#wGps').classList.contains('slowing'), null, {timeout:6000});
      await pf.evaluate(() => {__said=[];AmpHost.speedTick(155)});
      assert.equal(await pf.locator('#wGps').evaluate(el => el.classList.contains('slowing')), true, '150 km/h also warns');
      await pf.waitForFunction(() => !document.querySelector('#wGps').classList.contains('slowing'), null, {timeout:6000});
      // 설정: 경고 속도 고르기, 관제탑 소리 끄기
      await pf.locator('#setBtn').click();
      assert.deepEqual(await pf.locator('#sSpdMarks .pill.on').allTextContents(), ['120km','150km']);
      await pf.locator('#sSpdMarks .pill:text-is("80km")').click();
      await pf.locator('#sSpdMarks .pill:text-is("150km")').click();
      assert.deepEqual(await pf.evaluate(() => JSON.parse(localStorage.getItem('dna_spdMarks'))), [80,120]);
      await pf.locator('#sAtcSound').uncheck();
      await pf.locator('#setClose').click();
      await pf.evaluate(() => {__said=[];AmpHost.speedTick(60);AmpHost.speedTick(85)});
      assert.equal(await pf.locator('#wGps').evaluate(el => el.classList.contains('slowing')), true, 'User-chosen 80 km/h warns');
      assert.deepEqual(await pf.evaluate(() => __said), [], 'Tower voice off');
      // 날씨 효과: 눈 → 활주로에 쌓임, 비·흐림
      await pf.evaluate(() => {localStorage.setItem('dna_wxForce', JSON.stringify('snow'))});
      assert.equal(await pf.evaluate(() => AmpWx.kind), 'snow');
      const before = await pf.evaluate(() => {AmpFlight.redraw();return document.querySelector('#pfdHost canvas').toDataURL()});
      await pf.evaluate(() => AmpFlight.step(3, 0));
      assert.ok(await pf.evaluate(() => AmpFlight.state.snow) > .5, 'Snow builds up on the runway');
      const snowy = await pf.evaluate(() => {AmpFlight.redraw();return document.querySelector('#pfdHost canvas').toDataURL()});
      assert.notEqual(before, snowy);
      for (const k of ['rain','cloudy']) { await pf.evaluate(k2 => localStorage.setItem('dna_wxForce', JSON.stringify(k2)), k); assert.equal(await pf.evaluate(() => AmpWx.kind), k); await pf.evaluate(() => AmpFlight.redraw()); }
      assert.match(await pf.locator('#clkWx').textContent(), /°/);
      // 속도계 높이: − / + 버튼으로 조절(끌지 않아도 됨)
      await pf.locator('#gRz').click();
      const h0 = await pf.locator('#wGps').evaluate(el => el.getBoundingClientRect().height);
      await pf.locator('#wGps .rzsteps [data-d="-80"]').click();await pf.locator('#wGps .rzsteps [data-d="-80"]').click();
      const h1 = await pf.locator('#wGps').evaluate(el => el.getBoundingClientRect().height);
      assert.ok(h1 < h0 - 120, `Speedometer shrinks with the − button (${h0} -> ${h1})`);
      await pf.locator('#wGps .rzsteps [data-d="0"]').click();
      await pf.close();
    }
    // 콕핏 2: 왼쪽 세로 바로가기로 창만 골라 꽉 차게
    {
      const pc2 = await context.newPage();
      pc2.on('pageerror', error => errors.push('ck2: '+error.message));
      await pc2.setViewportSize({width:1280,height:800});
      await pc2.addInitScript(() => {if(sessionStorage.getItem('c2'))return;sessionStorage.setItem('c2','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival3'));localStorage.setItem('dna_mapPref', JSON.stringify('on'));});
      await pc2.goto(origin);
      await pc2.locator('#ckRail').waitFor();
      assert.equal(await pc2.evaluate(() => document.documentElement.dataset.skin), 'carnival2', 'Cockpit 2 reuses the cockpit look');
      assert.equal(await pc2.evaluate(() => document.documentElement.dataset.ck2), '1');
      assert.equal(await pc2.locator('#ckRail').isVisible(), true);
      assert.equal(await pc2.locator('#wGps > #ckRail').count(), 1, 'Rail sits inside the speedometer window');
      assert.equal(await pc2.locator('#wGps #pfdHost canvas').isVisible(), true, 'Cockpit PFD in cockpit 2');
      assert.deepEqual(await pc2.locator('#ckRail button').evaluateAll(bs => bs.map(b => b.dataset.f)), ['all','gps','map','cam','radio'], 'Five rail buttons');
      const sizes = [];
      for (const [f, ids] of [['gps',['wGps']],['cam',['wCam']],['map',['wMap']],['radio',['wRadio']]]) {
        await pc2.locator(`#ckRail [data-f="${f}"]`).click();
        const vis = await pc2.evaluate(() => [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id));
        assert.deepEqual(vis.sort(), ids.slice().sort(), f+' shows only its windows');
        const fit = await pc2.evaluate(id => {const r=document.getElementById(id).getBoundingClientRect();return r.bottom<=innerHeight+2&&r.top>=0}, ids[0]);
        assert.ok(fit, f+' fits the screen without scrolling');
        assert.equal(await pc2.locator(`#${ids[0]} > #ckRail`).count(), 1, 'Rail inside the window');
        sizes.push(await pc2.evaluate(id => {const r=document.getElementById(id).getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}, ids[0]));
      }
      for (const z of sizes) assert.deepEqual(z, sizes[0], 'Every rail view has the same size as the speedometer view');
      // 높이 조절: 제목줄 ↕ 버튼을 눌렀을 때만, 모든 보기에 같이 적용
      await pc2.locator('#ckRail [data-f="gps"]').click();
      assert.equal(await pc2.locator('#wGps > .grip').isVisible(), false, 'No resize handle until the ↕ button is pressed');
      const fh0 = await pc2.locator('#wGps').evaluate(el => el.getBoundingClientRect().height);
      await pc2.locator('#wGps > .bar .rzbtn').click();
      await pc2.locator('#wGps .rzsteps [data-d="-80"]').click();
      const fh1 = await pc2.locator('#wGps').evaluate(el => el.getBoundingClientRect().height);
      assert.ok(Math.abs(fh1 - (fh0 - 80)) < 3, `Focus view shrinks by one step (${fh0} -> ${fh1})`);
      await pc2.locator('#ckRail [data-f="radio"]').click();
      assert.ok(Math.abs(await pc2.locator('#wRadio').evaluate(el => el.getBoundingClientRect().height) - fh1) < 3, 'Same height in every rail view');
      await pc2.locator('#wRadio > .bar .rzbtn').click();
      await pc2.locator('#wRadio .rzsteps [data-d="0"]').click();
      assert.ok(Math.abs(await pc2.locator('#wRadio').evaluate(el => el.getBoundingClientRect().height) - fh0) < 3, 'Back to full screen height');
      await pc2.locator('#wRadio > .bar .rzbtn').click();
      await pc2.locator('#ckRail [data-f="map"]').click();
      assert.equal(await pc2.locator('#mapZoomIn').isVisible(), true, 'Map zoom-in button'); assert.equal(await pc2.locator('#mapZoomOut').isVisible(), true);
      await pc2.locator('#ckRail [data-f="all"]').click();
      assert.equal(await pc2.locator('#wEq').isVisible(), true, 'All windows back');
      await pc2.locator('#setBtn').click();
      assert.equal(await pc2.locator('#settings').isVisible(), true);
      await pc2.locator('#setClose').click();
      await pc2.locator('#ckRail [data-f="gps"]').click();
      await pc2.reload();await pc2.locator('#ckRail').waitFor();
      assert.equal(await pc2.locator('#wEq').isVisible(), false, 'Chosen view remembered');
      // 후진 멜로디: R 버튼 → 후진 표시 + 연주, 다시 누르면 멈춤
      await pc2.locator('#revBtn').click();
      assert.equal(await pc2.evaluate(() => window.AmpRev.on), true, 'Reverse melody on');
      assert.equal(await pc2.locator('#revFx').isVisible(), true, 'Reverse banner shown');
      await pc2.locator('#revFx').click();
      assert.equal(await pc2.evaluate(() => window.AmpRev.on), false, 'Tap the banner to stop');
      assert.equal(await pc2.locator('#revFx').isVisible(), false);
      // 콕핏 3: 콕핏 2와 같은 기능, 밝은 우주선 조종석 색
      await pc2.locator('#skin').selectOption('carnival4');
      assert.equal(await pc2.evaluate(() => [document.documentElement.dataset.skin, document.documentElement.dataset.ck2, document.documentElement.dataset.ck3].join()), 'carnival2,1,1');
      assert.equal(await pc2.locator('#ckRail').isVisible(), true, 'Cockpit 3 has the side rail');
      await pc2.locator('#ckRail [data-f="radio"]').click();
      assert.deepEqual(await pc2.evaluate(() => [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id)), ['wRadio'], 'Cockpit 3 rail focuses one window');
      assert.equal(await pc2.evaluate(() => getComputedStyle(document.getElementById('wRadio')).getPropertyValue('--rg').trim()), '#ffb14d', 'Cockpit 3 colours');
      await pc2.locator('#ckRail [data-f="all"]').click();
      await pc2.locator('#skin').selectOption('carnival2');
      assert.equal(await pc2.locator('#ckRail').isVisible(), false, 'Rail only in cockpit 2');
      assert.equal(await pc2.locator('#wEq').isVisible(), true, 'Cockpit 1 shows all windows');
      await pc2.close();
    }
    // 태블릿 가로모드 2: 같은 기능 + 금속 조종석 디자인, 가운데는 SPEED MATE(PFD 대신)
    {
      const pt2 = await context.newPage();
      pt2.on('pageerror', error => errors.push('tablet2: '+error.message));
      await pt2.setViewportSize({width:1600,height:1000});
      await pt2.addInitScript(() => {if(sessionStorage.getItem('pt2'))return;sessionStorage.setItem('pt2','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('tablet2'));});
      await pt2.goto(origin);
      await pt2.locator('#tabCk').waitFor();
      assert.equal(await pt2.evaluate(() => [document.documentElement.dataset.skin, document.documentElement.dataset.tk2, document.getElementById('tabCk').classList.contains('v2')].join()), 'tablet,1,true');
      assert.equal(await pt2.locator('#app').isVisible(), false, 'App windows hidden');
      assert.equal(await pt2.locator('#tabCk #pfdHost').count(), 0, 'Tablet 2 draws its own speed display, not the PFD');
      assert.equal(await pt2.locator('#tkPfd').isVisible(), true, 'SPEED MATE canvas shown');
      assert.equal(await pt2.locator('#tabCk .tk-emb').isVisible(), true);
      assert.equal(await pt2.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No sideways scroll');
      await pt2.setViewportSize({width:960,height:600}); await pt2.waitForTimeout(300);
      assert.ok(await pt2.evaluate(() => {const t=document.getElementById('tabCk'),r=document.querySelector('#tabCk .tk-tabs').getBoundingClientRect(),c=document.querySelector('#tabCk .tk-ctrl').getBoundingClientRect();
        return t.classList.contains('fit')&&r.bottom<=innerHeight+1&&c.bottom<=r.top+1&&t.scrollHeight<=t.clientHeight+1}), 'Small tablet screen: whole design scaled to fit, controls above the tabs');
      await pt2.setViewportSize({width:1600,height:1000}); await pt2.waitForTimeout(200);
      // 지도는 통으로(지도 아래 버튼 없음), 음원 연동 버튼 4개
      assert.equal(await pt2.locator('#tabCk #wMap .mapctl').isVisible(), false, 'No buttons under the tablet map');
      assert.deepEqual(await pt2.locator('#tkSrcBar button').allTextContents(), ['내 음악','YouTube Music','Spotify','라디오']);
      await pt2.evaluate(() => { HTMLMediaElement.prototype.play = function(){ window.__tkRd = this.src; return Promise.resolve(); }; });
      await pt2.evaluate(() => window.AmpRadio.play({id:'c',name:'CBS 음악FM',freq:93.9,ofc:true,url:'https://stream.example/cbs'}));
      await pt2.evaluate(() => window.AmpRadio.stop());
      await pt2.locator('#tkSrcBar [data-src="radio"]').click();
      await pt2.waitForFunction(() => window.AmpRadio.state.playing && /CBS/.test(document.getElementById('tkTt').textContent), null, {timeout:3000});
      assert.equal(await pt2.locator('#tkSrcBar [data-src="radio"]').evaluate(b => b.classList.contains('on')), true, 'Radio source lit');
      await pt2.locator('#tkSrcBar [data-src="local"]').click();
      assert.equal(await pt2.evaluate(() => window.AmpRadio.state.playing), false, 'Choosing my music stops the radio');
      await pt2.locator('#tabCk [data-k="setup"]').click();
      assert.equal(await pt2.locator('#tkSys').isVisible(), true, 'SETUP opens system settings');
      await pt2.locator('#tabCk [data-k="list"]').click();
      assert.equal(await pt2.locator('#tkList').isVisible(), true, 'LIST opens the playlist');
      await pt2.locator('#tabCk .tk-tabs [data-t="nav"]').click();
      await pt2.locator('#tkSkin').selectOption('tablet');
      assert.equal(await pt2.evaluate(() => document.getElementById('tabCk').classList.contains('v2')), false, 'Back to tablet 1');
      await pt2.locator('#tkSkin').selectOption('tablet2');
      assert.equal(await pt2.evaluate(() => document.getElementById('tabCk').classList.contains('v2')), true);
      await pt2.locator('#tkSkin').selectOption('carnival2');
      assert.equal(await pt2.locator('#tabCk').isVisible(), false, 'Leaves the tablet screen');
      assert.equal(await pt2.locator('#wGps #pfdHost').count(), 1, 'PFD back in the speedometer window');
      await pt2.close();
    }
    // 태블릿 가로모드(독립 스킨): 기존 화면은 숨기고 조종석 화면, 다른 스킨으로 가면 원래대로
    {
      const pt = await context.newPage();
      pt.on('pageerror', error => errors.push('tablet: '+error.message));
      await pt.setViewportSize({width:1280,height:800});
      await pt.addInitScript(() => {if(sessionStorage.getItem('pt'))return;sessionStorage.setItem('pt','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('tablet'));});
      await pt.goto(origin);
      await pt.locator('#tabCk').waitFor();
      assert.equal(await pt.locator('#tabCk').isVisible(), true, 'Tablet cockpit shown');
      assert.equal(await pt.locator('header.top').isVisible(), false); assert.equal(await pt.locator('#app').isVisible(), false);
      const fits = await pt.evaluate(() => {const r=document.querySelector('.tk-tabs').getBoundingClientRect();const t=document.querySelector('#tabCk');return r.bottom<=innerHeight+1&&t.scrollHeight<=t.clientHeight+1&&t.getBoundingClientRect().right<=innerWidth+1});
      assert.ok(fits, 'Landscape tablet layout fits one screen');
      // 대신남 원 Ver1 기능을 그대로: 콕핏 PFD(비행 장면)·지도 창·아날로그 시계가 이 화면 안으로
      assert.equal(await pt.locator('#tabCk .tk-pfd #pfdHost').count(), 1, 'Ver1 PFD shown in the center panel');
      assert.equal(await pt.locator('#tabCk #pfdHost canvas').isVisible(), true);
      assert.equal(await pt.locator('#tkPfd').isVisible(), false);
      assert.equal(await pt.locator('#tabCk #tkAppMap #wMap').count(), 1, 'Full Ver1 map window in the MAP panel');
      assert.equal(await pt.locator('#tabCk #mapAsk, #tabCk #mapWrap').first().isVisible(), true);
      assert.equal(await pt.locator('#tabCk .tk-right #clock').count(), 1, 'Cockpit clock in the top bar');
      assert.equal(await pt.locator('#clkDialNow').isVisible(), true, 'Analog cockpit clock');
      assert.match(await pt.locator('#tabCk .flt-badge').textContent(), /RWY/, 'Runway hold scene');
      await pt.locator('.tk-tabs [data-t="audio"]').click();
      assert.equal(await pt.locator('#tkList').isVisible(), true); assert.match(await pt.locator('#tkList').textContent(), /비어|01/);
      await pt.locator('.tk-tabs [data-t="system"]').click();
      assert.equal(await pt.locator('#tkSys').isVisible(), true);
      await pt.locator('.tk-tabs [data-t="nav"]').click();
      // 볼륨 손잡이(웹: 플레이어 볼륨)
      const kb = await pt.locator('#tkVol').boundingBox();
      await pt.mouse.move(kb.x+kb.width*.2, kb.y+kb.height*.8);await pt.mouse.down();
      await pt.mouse.move(kb.x+kb.width*.15, kb.y+kb.height*.5,{steps:4});await pt.mouse.move(kb.x+kb.width*.3, kb.y+kb.height*.15,{steps:4});await pt.mouse.up();
      await pt.waitForTimeout(150);
      const v = +(await pt.locator('#vol').inputValue());
      assert.ok(v < 70 && v > 5, 'Volume knob drives the player volume ('+v+')');
      assert.equal(await pt.locator('#tkVolV').textContent(), String(v));
      // SOS: 덮개를 올려야 누를 수 있음
      await pt.evaluate(() => document.querySelector('#tkSos').click());
      assert.equal(await pt.locator('#tkSosW').evaluate(el => el.classList.contains('open')), false);
      await pt.locator('#tkCover').click();
      assert.equal(await pt.locator('#tkSosW').evaluate(el => el.classList.contains('open')), true, 'Cover lifts');
      await pt.locator('#tkSos').click();
      assert.equal(await pt.locator('#settings').isVisible(), true, 'No SOS number -> opens settings');
      await pt.locator('#setClose').click();
      // 와이파이 스위치(웹: 시연), 주행 모드
      const w0 = await pt.locator('#tkWifi').getAttribute('aria-checked');
      await pt.locator('#tkWifi').click();await pt.waitForTimeout(400);
      assert.notEqual(await pt.locator('#tkWifi').getAttribute('aria-checked'), w0, 'WiFi lever toggles');
      await pt.locator('#tkDm').click();
      assert.equal(await pt.locator('#drive').isVisible(), true, 'Drive mode opens easy mode');
      await pt.evaluate(() => AmpTk.drive(false));
      // 밝기 손잡이(웹: 화면 어둡게)
      await pt.locator('#tkBri').focus();for(let i=0;i<4;i++)await pt.keyboard.press('ArrowDown');
      assert.match(await pt.locator('#tkBriV').textContent(), /^(7[0-9]|8[0-9])%$/);
      // 다른 스킨으로 돌아가면 기존 화면 그대로
      await pt.locator('#tkSkin').selectOption('blue');
      assert.equal(await pt.locator('#tabCk').isVisible(), false);
      assert.equal(await pt.locator('#app').isVisible(), true, 'Existing skins unaffected');
      assert.equal(await pt.locator('#wMain').isVisible(), true);
      assert.equal(await pt.locator('#wGps #pfdHost').count(), 1, 'PFD returned to the speedometer window');
      assert.equal(await pt.locator('#app > #wMap').count(), 1, 'Map window returned');
      assert.equal(await pt.locator('header.top #clock').count(), 1, 'Clock returned to the header');
      await pt.locator('#skin').selectOption('carnival2');
      assert.equal(await pt.locator('#wGps #pfdHost canvas').isVisible(), true, 'Cockpit skin still shows its PFD');
      // 콕핏 스킨에서도 기존 속도계 디자인 선택 가능
      await pt.locator('#gStyleBar').selectOption('neon');
      assert.equal(await pt.locator('#wGps #pfdHost').isVisible(), false, 'PFD hidden when a classic design is chosen');
      assert.equal(await pt.locator('#wGps #gauge').isVisible(), true, 'Classic speedometer shown in the cockpit skin');
      await pt.locator('#gStyleBar').selectOption('cockpit');
      assert.equal(await pt.locator('#wGps #pfdHost canvas').isVisible(), true, 'Back to the PFD');
      await pt.close();
    }
    // 2단 화면(태블릿 세로): 플레이어와 라디오는 각각 한 줄 전체
    {
      const pl2 = await context.newPage();
      await pl2.addInitScript(() => {localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('blue'));});
      await pl2.goto(origin);
      const r = await pl2.evaluate(() => ['wMain','wRadio','wEq'].map(id => {const q=document.getElementById(id).getBoundingClientRect();return [Math.round(q.x),Math.round(q.width),Math.round(q.y)]}));
      assert.ok(await pl2.evaluate(() => document.getElementById('app').classList.contains('L2')), 'Two-column layout at 1470px');
      assert.equal(r[0][0], r[1][0], 'Player and radio start at the same column');
      assert.equal(r[0][1], r[1][1], 'Player and radio span the same full width');
      assert.ok(r[1][2] > r[0][2] && r[2][2] > r[1][2], 'Player, then radio, then EQ');
      await pl2.close();
    }
    // 인터넷 라디오: 목록 검색·재생·즐겨찾기·다이얼
    {
      const pr = await context.newPage();
      pr.on('pageerror', error => errors.push('radio: '+error.message));
      await pr.route('**/json/stations/search**', route => route.fulfill({status:200, contentType:'application/json', headers:{'Access-Control-Allow-Origin':'*'},
        body: JSON.stringify([{stationuuid:'a1',name:'KBS Cool FM',url_resolved:'https://stream.example/cool',tags:'pop',codec:'AAC',bitrate:128,countrycode:'KR'},{stationuuid:'b2',name:'SBS Power FM',url_resolved:'https://stream.example/power',tags:'talk',codec:'MP3',bitrate:128,countrycode:'KR'},{stationuuid:'m4',name:'MBC FM4U',url_resolved:'https://stream.example/mbc',tags:'pop',codec:'AAC',bitrate:128,countrycode:'KR'}])}));
      await pr.addInitScript(() => {HTMLMediaElement.prototype.play = function(){window.__rdSrc=this.src;return Promise.resolve()};if(sessionStorage.getItem('pr'))return;sessionStorage.setItem('pr','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival3'));});
      await pr.goto(origin);
      await pr.locator('#radioBtn').click();
      await pr.waitForFunction(() => document.querySelectorAll('#rdList li[data-i]').length === 3);
      assert.equal(await pr.locator('#rdListBox').isVisible(), true, 'Station list open when there are no favourites');
      assert.ok(await pr.locator('#rdList li[data-o]').count() >= 10, 'Official Korean stations listed');
      assert.match(await pr.locator('#rdList').textContent(), /89\.1/, 'Seoul FM frequency shown');
      await pr.locator('#rdList li[data-i="0"]').click();
      await pr.waitForFunction(() => AmpRadio.state.playing);
      assert.equal(await pr.evaluate(() => window.__rdSrc), 'https://stream.example/cool');
      assert.match(await pr.locator('#rdFreq').textContent(), /89\.1/);
      await pr.locator('#rdFav').click();
      await pr.locator('#rdList li[data-i="1"] button').click();
      assert.equal(await pr.locator('#rdPresets button.set').count(), 2, 'Two favourites as presets');
      await pr.locator('#rdNext').click();
      await pr.waitForFunction(() => AmpRadio.state.cur && AmpRadio.state.cur.id === 'b2');
      // 다이얼을 89.1 근처로 끌면 그 방송으로
      const sb = await pr.locator('#rdScale').boundingBox();
      const xf = f => sb.x + sb.width*(.035 + (f-87.5)/20.5*.93);
      await pr.mouse.move(xf(100), sb.y+sb.height/2);await pr.mouse.down();await pr.mouse.move(xf(89.2), sb.y+sb.height/2,{steps:5});await pr.mouse.up();
      await pr.waitForFunction(() => AmpRadio.state.cur && AmpRadio.state.cur.id === 'a1');
      await pr.locator('#rdPlay').click();
      assert.equal(await pr.evaluate(() => AmpRadio.state.playing), false, 'Stop');
      await pr.reload();
      await pr.locator('#ckRail [data-f="radio"]').click();
      assert.equal(await pr.locator('#rdPresets button.set').count(), 2, 'Favourites remembered');
      await pr.locator('#rdPresetTg').click();
      assert.equal(await pr.locator('#rdPresetBox').isVisible(), false, 'Favourites fold away');
      await pr.locator('#rdPresetTg').click();
      assert.equal(await pr.locator('#rdPresetBox').isVisible(), true);
      // 주파수만 맞춰도 공식 방송(MBC FM4U 91.9)을 찾음
      await pr.evaluate(() => AmpRadio.stop());
      await pr.evaluate(() => { const b=document.getElementById('rdKnob'); b.focus(); });
      for (let k = 0; k < 28; k++) await pr.keyboard.press('ArrowUp'); // 89.1 → 91.9
      await pr.waitForFunction(() => AmpRadio.state.cur && AmpRadio.state.cur.id === 'kr-mbcfm4u', null, {timeout:5000});
      await pr.waitForFunction(() => window.__rdSrc === 'https://stream.example/mbc', null, {timeout:5000}); // 웹에선 공식 주소 대신 같은 방송의 다른 주소로
      await pr.waitForFunction(() => /MBC FM4U/.test(document.getElementById('marqText').textContent), null, {timeout:3000});
      assert.equal(await pr.locator('#tCur').textContent(), 'LIVE', 'Player display shows the radio station');
      // 배터리 설정: 절전 모드 항상 켜기/끄기
      await pr.evaluate(() => { document.getElementById('settings').hidden = false; });
      await pr.locator('#sPwr button[data-v="on"]').click();
      assert.equal(await pr.evaluate(() => window.AmpPwr.saver), true, 'Battery saver on');
      await pr.locator('#sPwr button[data-v="off"]').click();
      assert.equal(await pr.evaluate(() => window.AmpPwr.saver), false, 'Battery saver off');
      await pr.evaluate(() => { document.getElementById('settings').hidden = true; });
      await pr.close();
    }
    assert.deepEqual(errors, []);
    console.log('PASS: D1 Dashcam live/probe/full screen · Daesinnam PFD v1.2 (air force design, clouds/city, night, heading yaw) in cockpit, five car themes, no cockpit PFD in car/drive skins, fixed normal-skin sizes with resize buttons, logo clock + world time, internet radio, stacked cockpit-2 views, tablet landscape cockpit skin with Ver1 PFD/map/clock, Ver1 analog cockpit clock + PFD takeoff/landing, cockpit skin, cockpit resize, package control console, SOS guard+call, two-line tower, tower speed cautions, 10 visualizer effects, window order settings, TMAP bottom split, GPS continuity, HUD/limit, no-fix state, persistence, 3 responsive sizes, map placement, drive skin, permission folding, saved playlist, settings, drive mode, car connect, native player hand-off and touch EQ drag');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {console.error(error);process.exitCode=1;});
