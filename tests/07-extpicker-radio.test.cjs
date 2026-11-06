const {run, assert} = require('./lib/harness.cjs');

run('External music picker, car source, dashcam flip, internet radio, battery saver', async ({browser, context, origin, errors}) => {
    // 외부 음악 앱 선곡(앱을 열지 않고) · 차 연결 시 고른 음원 재생 · 블랙박스 화면 반전
    {
      const px = await context.newPage();
      px.on('pageerror', error => errors.push('extpick: '+error.message));
      await px.addInitScript(() => {if(!sessionStorage.getItem('px')){sessionStorage.setItem('px','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival'));}
        window.xl=[];
        window.AndroidBridge={extStatus:()=>JSON.stringify({notif:true,notifSupported:true,mic:true,pkg:'com.spotify.music',app:'Spotify',title:'Song A',artist:'Band',playing:true,dur:200000,pos:1000,eq:{}}),
          extCmd:(c)=>xl.push('cmd:'+c),setExtEq:()=>{},mediaPlay:p=>xl.push('play:'+p),openApp:p=>xl.push('open:'+p),
          extQueue:()=>JSON.stringify({pkg:'com.spotify.music',items:[{id:11,title:'Song A',sub:'Band',cur:true},{id:12,title:'Song B',sub:'Band'}]}),
          extPlayQueue:id=>xl.push('q:'+id),extBrowse:(pkg,par)=>{xl.push('browse:'+pkg+':'+par);setTimeout(()=>window.__extBrowse(JSON.stringify({pkg,ok:true,parent:par||'root',items:par?[{id:'t1',title:'Track 1',sub:'',play:true}]:[{id:'pl',title:'My Playlist',sub:'',folder:true}]})),10)},
          extBrowsePlay:(pkg,id)=>xl.push('bplay:'+id),takeCarAutoplay:()=>false,carStatus:()=>'{}'};});
      await px.goto(origin);
      await px.evaluate(() => document.querySelector('#srcSeg button[data-src="ext"]').click());
      await px.locator('#wExt [data-xstart="com.spotify.music"]').click();
      // 누르면 그 앱으로 전환(목록을 이 앱 안에 넣지 않음)
      assert.ok((await px.evaluate(() => xl)).includes('open:com.spotify.music'), 'Switches to the Spotify app');
      assert.ok(!(await px.evaluate(() => xl)).some(x => /^(play|q|bplay|browse):/.test(x)), 'No in-app queue or background start');
      assert.equal(await px.locator('#xPick [data-q], #xPick [data-xv]').count(), 0, 'No in-app song list');
      await px.waitForFunction(() => /Song A/.test(document.getElementById('xPick').textContent), null, {timeout: 4000});
      await px.locator('#xPick [data-xapp="com.google.android.apps.youtube.music"]').click();
      assert.ok((await px.evaluate(() => xl)).includes('open:com.google.android.apps.youtube.music'), 'YouTube Music button switches app');
      // 앨범 그림이 안 들어오면 어느 앱인지 글자로(로고 대신)
      await px.waitForFunction(() => document.getElementById('cover').dataset.brand === 'spotify', null, {timeout: 4000});
      assert.equal(await px.locator('#cover').getAttribute('data-label'), 'Spotify');
      assert.equal(await px.locator('#cover').evaluate(c => getComputedStyle(c, '::after').content), '"Spotify"', 'App name shown on the empty cover');
      // 알림 접근 단계별 안내(제한된 설정 풀기)
      await px.evaluate(() => document.getElementById('xNotifHelp').click());
      assert.equal(await px.locator('#notifHelp').isVisible(), true, 'Restricted-settings guide opens');
      assert.equal(await px.locator('#notifHelp li').count(), 3);
      await px.locator('#nhClose').click();
      assert.equal(await px.locator('#notifHelp').isVisible(), false);
      // 차 연결: 고른 음원(YouTube Music)을 화면 전환 없이 재생
      await px.evaluate(() => { localStorage.setItem('dna_carSrc', JSON.stringify('ytm')); window.__carConnected('MyCar'); });
      assert.ok((await px.evaluate(() => xl)).includes('play:com.google.android.apps.youtube.music'), 'Car connect plays YouTube Music');
      // 블랙박스 화면 반전
      await px.evaluate(() => document.getElementById('camFlipH').click());
      assert.equal(await px.evaluate(() => getComputedStyle(document.getElementById('camImg')).getPropertyValue('--cfx').trim()), '-1', 'Mirror left-right');
      await px.evaluate(() => document.getElementById('camFlipV').click());
      assert.equal(await px.evaluate(() => getComputedStyle(document.getElementById('camImg')).getPropertyValue('--cfy').trim()), '-1', 'Flip upside down');
      await px.close();
    }
    // 인터넷 라디오: 목록 검색·재생·즐겨찾기·다이얼
    {
      const pr = await context.newPage();
      pr.on('pageerror', error => errors.push('radio: '+error.message));
      await pr.route('**/json/stations/search**', route => route.fulfill({status:200, contentType:'application/json', headers:{'Access-Control-Allow-Origin':'*'},
        body: JSON.stringify([{stationuuid:'a1',name:'KBS Cool FM',url_resolved:'https://stream.example/cool',tags:'pop',codec:'AAC',bitrate:128,countrycode:'KR'},{stationuuid:'b2',name:'SBS Power FM',url_resolved:'https://stream.example/power',tags:'talk',codec:'MP3',bitrate:128,countrycode:'KR'},{stationuuid:'m4',name:'MBC FM4U',url_resolved:'https://stream.example/mbc',tags:'pop',codec:'AAC',bitrate:128,countrycode:'KR'}])}));
      await pr.addInitScript(() => {HTMLMediaElement.prototype.play = function(){window.__rdSrc=this.src;return Promise.resolve()};if(sessionStorage.getItem('pr'))return;sessionStorage.setItem('pr','1');localStorage.clear();localStorage.setItem('dna_skin2', JSON.stringify('carnival5'));});
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
});
