const {run, assert} = require('./lib/harness.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const themes = ['carbon', 'neon', 'classic', 'minimal', 'tactical'];

run('Car mode, cockpit skin, console, tower, SOS, map ask, drive skin', async ({browser, context, origin, errors}) => {
    const page = await context.newPage();
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
    await page.evaluate(() => {window.__atcSpeed=2.5;document.getElementById('atcRun').click()}); // 관제탑 점검을 빠르게 처음부터(테스트 시간 단축)
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
});
