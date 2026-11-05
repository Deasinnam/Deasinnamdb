const {run, assert} = require('./lib/harness.cjs');

run('Cockpit 2 rail, tablet skins 1 and 2, two-column portrait', async ({browser, context, origin, errors}) => {
    // 콕핏 2: 왼쪽 세로 바로가기로 창만 골라 꽉 차게
    {
      const pc2 = await context.newPage();
      pc2.on('pageerror', error => errors.push('ck2: '+error.message));
      await pc2.setViewportSize({width:1280,height:800});
      await pc2.addInitScript(() => {if(sessionStorage.getItem('c2'))return;sessionStorage.setItem('c2','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival5'));localStorage.setItem('dna_mapPref', JSON.stringify('on'));});
      await pc2.goto(origin);
      await pc2.locator('#ckRail').waitFor();
      assert.equal(await pc2.evaluate(() => document.documentElement.dataset.skin), 'carnival2', 'Cockpit 2 reuses the cockpit look');
      assert.equal(await pc2.evaluate(() => document.documentElement.dataset.ck2), '1');
      assert.equal(await pc2.locator('#ckRail').isVisible(), true);
      assert.equal(await pc2.locator('#wGps > #ckRail').count(), 1, 'Rail sits inside the speedometer window');
      assert.equal(await pc2.locator('#wGps #pfdHost canvas').isVisible(), true, 'Cockpit PFD in cockpit 2');
      assert.deepEqual(await pc2.locator('#ckRail button[data-f]').evaluateAll(bs => bs.map(b => b.dataset.f)), ['all','gps','map','cam','radio','vis'], 'Six view buttons (with NOW PLAYING)');
      assert.deepEqual(await pc2.locator('#ckRail button[data-open]').evaluateAll(bs => bs.map(b => b.dataset.open)), ['tmap','nmap'], 'TMAP / Naver Map open-below buttons');
      for (const sel of ['#ckRail [data-open="tmap"]', '#ckRail [data-open="nmap"]']) {
        const b = await pc2.locator(sel).boundingBox(), r = await pc2.locator('#ckRail').boundingBox();
        assert.ok(b && b.height >= 24 && b.y + b.height <= r.y + r.height + 1, sel + ' fits inside the rail');
      }
      await pc2.locator('#ckRail [data-open="nmap"]').click();
      assert.equal(await pc2.locator('#navPick').isVisible(), true, 'Chooser opens');
      await pc2.locator('#navPick [data-at="bottom"]').click();
      assert.match(await pc2.locator('#toast').textContent(), /네이버 지도 켜기는 안드로이드 앱에서/, 'Web preview explains the app-only action');
      const sizes = [];
      for (const [f, ids] of [['gps',['wGps']],['cam',['wCam']],['map',['wMap']],['radio',['wRadio']],['vis',['wVis']]]) {
        await pc2.locator(`#ckRail [data-f="${f}"]`).click();
        const vis = await pc2.evaluate(() => [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id));
        assert.deepEqual(vis.sort(), ids.slice().sort(), f+' shows only its windows');
        const fit = await pc2.evaluate(id => {const r=document.getElementById(id).getBoundingClientRect();return r.bottom<=innerHeight+2&&r.top>=0}, ids[0]);
        assert.ok(fit, f+' fits the screen without scrolling');
        assert.equal(await pc2.locator(`#${ids[0]} > #ckRail`).count(), 1, 'Rail inside the window');
        sizes.push(await pc2.evaluate(id => {const r=document.getElementById(id).getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}, ids[0]));
      }
      for (const z of sizes) assert.deepEqual(z, sizes[0], 'Every rail view has the same size as the speedometer view');
      assert.match(await pc2.evaluate(() => document.documentElement.style.getPropertyValue('--fxTop')), /^\d+px$/, 'Focus view measures its top offset');
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
      { const hb = await pc2.locator('#wRadio').evaluate(el => el.getBoundingClientRect().height); assert.ok(Math.abs(hb - fh0) < 3, `Back to full screen height (${fh0} -> ${hb})`); }
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
      await pc2.locator('#skin').selectOption('carnival4', {force: true});
      assert.equal(await pc2.evaluate(() => [document.documentElement.dataset.skin, document.documentElement.dataset.ck2, document.documentElement.dataset.ck3].join()), 'carnival2,1,1');
      assert.equal(await pc2.locator('#ckRail').isVisible(), true, 'Cockpit 3 has the side rail');
      await pc2.locator('#ckRail [data-f="radio"]').click();
      assert.deepEqual(await pc2.evaluate(() => [...document.querySelectorAll('#app>.win')].filter(w => w.offsetParent).map(w => w.id)), ['wRadio'], 'Cockpit 3 rail focuses one window');
      assert.equal(await pc2.evaluate(() => getComputedStyle(document.getElementById('wRadio')).getPropertyValue('--rg').trim()), '#ffb14d', 'Cockpit 3 colours');
      await pc2.locator('#ckRail [data-f="all"]').click();
      await pc2.locator('#skin').selectOption('carnival', {force: true});
      assert.equal(await pc2.locator('#ckRail').isVisible(), false, 'Rail only in the cockpit skins');
      assert.equal(await pc2.locator('#wEq').isVisible(), true, 'Car mode shows all windows');
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
      // 가운데 속도계: 기존 디자인 모두 선택 가능, 음악 효과 20종, 지도 주간·야간
      assert.equal(await pt2.locator('#tkSpd option').count(), 7, 'SPEED MATE + PFD + 5 classic designs');
      await pt2.locator('#tkSpd').selectOption('neon');
      assert.equal(await pt2.locator('#tabCk .tk-pfd #wGps #gauge').isVisible(), true, 'Classic neon gauge in the centre');
      assert.equal(await pt2.evaluate(() => document.getElementById('wGps').dataset.gs), 'neon');
      await pt2.locator('#tkSpd').selectOption('mate');
      assert.equal(await pt2.locator('#tkPfd').isVisible(), true, 'Back to SPEED MATE');
      assert.equal(await pt2.locator('#tabCk #tkVisW #vis').isVisible(), true, 'App visualizer in the audio panel');
      assert.equal(await pt2.locator('#tabCk #visSel option').count(), 30, 'All 30 effects');
      const dn0 = await pt2.locator('#tkDN').textContent(); await pt2.locator('#tkDN').click();
      assert.notEqual(await pt2.locator('#tkDN').textContent(), dn0, 'Map day/night switch');
      await pt2.locator('#tabCk [data-k="setup"]').click();
      assert.equal(await pt2.locator('#tkSys').isVisible(), true, 'SETUP opens system settings');
      await pt2.locator('#tabCk [data-k="list"]').click();
      assert.equal(await pt2.locator('#tkList').isVisible(), true, 'LIST opens the playlist');
      await pt2.locator('#tabCk .tk-tabs [data-t="nav"]').click();
      await pt2.locator('#tkSkin').selectOption('tablet');
      assert.equal(await pt2.evaluate(() => document.getElementById('tabCk').classList.contains('v2')), false, 'Back to tablet 1');
      await pt2.locator('#tkSkin').selectOption('tablet2');
      assert.equal(await pt2.evaluate(() => document.getElementById('tabCk').classList.contains('v2')), true);
      await pt2.locator('#tkSkin').selectOption('carnival5');
      assert.equal(await pt2.locator('#tabCk').isVisible(), false, 'Leaves the tablet screen');
      assert.equal(await pt2.locator('#wGps #pfdHost').count(), 1, 'PFD back in the speedometer window');
      assert.equal(await pt2.locator('#app > #wGps').count(), 1, 'Speedometer window back in the app');
      assert.equal(await pt2.locator('#wVis .visbox').count(), 1, 'Visualizer back in the app');
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
      await pt.locator('#skin').selectOption('carnival5', {force: true});
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
});
