const {run, assert} = require('./lib/harness.cjs');

run('D1 Dashcam live/probe/full screen, mobile data note', async ({browser, context, origin, errors}) => {
    // D1 DASHCAM: 자동차 스킨에만 보이고, 연결 → 실시간 화면(/cam/frame.jpg) → 카메라 찾기 결과, 인터넷은 모바일 데이터 표시
    const pc = await context.newPage();
    pc.on('pageerror', error => errors.push(error.message+' @ '+(error.stack||'').split('\n').slice(1,3).join(' | ')));
    const jpg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAJABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDhKKKK4DzD/9k=','base64');
    let camHits = 0;
    await pc.route('**/cam/frame.jpg*', route => { camHits++; route.fulfill({status:200, contentType:'image/jpeg', body:jpg}); });
    await pc.addInitScript(() => {if(!sessionStorage.getItem('pc')){sessionStorage.setItem('pc','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival5'));localStorage.setItem('dna_layout', JSON.stringify('1'))}
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
    await pc.locator('#skin').selectOption('blue', {force: true});
    assert.ok(!(await pc.locator('#wCam').isVisible()), 'Dashcam hidden outside car skins');
    await pc.close();
});
