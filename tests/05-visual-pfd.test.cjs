const {run, assert} = require('./lib/harness.cjs');

run('Visual effects, PFD v1.1/v1.2, tower speed cautions, car skins without PFD, Ver1 takeoff/landing', async ({browser, context, origin, errors}) => {
    // 시각화 효과 10종: 고를 때마다 다른 화면, 다시 열어도 유지, 캔버스를 누르면 다음 효과
    const p9 = await context.newPage();
    p9.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    await p9.addInitScript(() => {if(sessionStorage.getItem('p9'))return;sessionStorage.setItem('p9','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival5'));});
    await p9.goto(origin);
    assert.equal(await p9.locator('#visSel option').count(), 40);
    const visImgs = new Set();
    for (let m = 0; m < 40; m++) {await p9.locator('#visSel').selectOption(String(m));await p9.waitForTimeout(120);visImgs.add(await p9.locator('#vis').evaluate(c => c.toDataURL()))}
    assert.ok(visImgs.size >= 36, `Effects render differently (${visImgs.size}/40)`);
    await p9.locator('#visSel').selectOption('39');
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
    await p8.addInitScript(() => {if(!sessionStorage.getItem('p8')){sessionStorage.setItem('p8','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival5'))}
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
    for (const sk of ['carnival']) {
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
    // 대신남 원 Ver1: 처음엔 콕핏 스킨·아날로그 시계, PFD는 활주로 대기 → 이륙 → 순항 → 착륙 → 도착
    {
      const pf = await context.newPage();
      pf.on('pageerror', error => errors.push(error.message));
      await pf.addInitScript(() => {if(!sessionStorage.getItem('pf')){sessionStorage.setItem('pf','1');localStorage.clear();}
        window.__said=[];window.AndroidBridge={gpsStatus:()=>JSON.stringify({fix:false,perm:true,enabled:true}),startGps:()=>{},stopGps:()=>{},keepScreenOn:()=>{},speak:t=>window.__said.push(t)};});
      await pf.goto(origin);
      await pf.waitForFunction(() => window.AmpFlight);
      assert.equal(await pf.evaluate(() => document.documentElement.dataset.skin), 'carnival2', 'Ver1 opens in the cockpit skin');
      assert.equal(await pf.locator('#skin').inputValue(), 'carnival7', 'First run opens in the airline skin');
      // 아래는 예전 콕핏(시험용으로만 남김) 동작 확인
      await pf.evaluate(() => localStorage.setItem('dna_skin2', JSON.stringify('carnival5'))); await pf.reload(); await pf.waitForFunction(() => window.AmpFlight);
      assert.equal(await pf.evaluate(() => document.documentElement.dataset.ckr), '1');
      assert.equal(await pf.evaluate(() => document.documentElement.dataset.ck2), '1');
      assert.equal(await pf.locator('#ckRail button[data-f="all"]').evaluate(b => b.classList.contains('on')), true, 'All views by default');
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
      assert.equal(await pf.locator('.flt-badge').textContent(), 'CLIMB · 상승 중', 'Climb shows only the stage');
      await pf.evaluate(() => AmpFlight.step(30, 80));
      assert.equal(await ph(), 'cruise');
      assert.equal(await pf.locator('.flt-badge').textContent(), 'CRUISE · 순항');
      assert.ok(Math.abs(await pf.evaluate(() => AmpFlight.state.bank)) <= 6.6, 'Gentle bank only');
      await pf.evaluate(() => AmpFlight.step(6, 0));
      assert.ok(await pf.evaluate(() => AmpFlight.state.vs) < 5, 'Ground flow slows down when the car stops');
      assert.equal(await pf.locator('.flt-badge').textContent(), '순항 중 · 정차');
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
      assert.ok(await pf.evaluate(() => AmpFlight.state.snow) > .2, 'Snow builds up on the runway (light cover)');
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
});
