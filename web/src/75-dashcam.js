// D1 DASHCAM 블랙박스 실시간 화면
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- D1 DASHCAM: 블랙박스 실시간 화면 ---------- */
(function(){
  const HAS_CAM=!!(NB&&NB.camState);
  const img=$('#camImg'),msg=$('#camMsg'),w=$('#wCam');
  let cs={},liveWant=false,loading=false,lastFrames=-1,pollT=0;
  const ssid=()=>store.get('camSsid','Car-Cam*'),pass=()=>store.get('camPass','');
  $('#camSsid').value=store.get('camSsid','');$('#camSsidSum').textContent=ssid().replace(/\*$/,'')||'Car-Cam';
  function say(title,sub){msg.hidden=false;msg.innerHTML='<b></b><span></span>';msg.children[0].textContent=title;msg.children[1].textContent=sub||''}
  function render(){
    const st=cs.state||'idle',on=st==='connected';
    $('#camConn').textContent=on||st==='requesting'?'연결 끊기':'연결';$('#camConn').classList.toggle('on',!(on||st==='requesting'));
    $('#camLiveBtn').disabled=!on;$('#camProbeBtn').disabled=!on||cs.probing;$('#camFull').disabled=!cs.live;
    $('#camLiveBtn').textContent=cs.live?'실시간 끄기':'실시간 보기';$('#camLiveBtn').classList.toggle('on',!!cs.live);
    $('#camProbeBtn').textContent=cs.probing?'찾는 중…':'카메라 찾기';
    $('#camSt').textContent={idle:'',requesting:'연결 중',connected:cs.live?'LIVE':'연결됨',lost:'끊김',unavailable:'연결 실패'}[st]||'';
    $('#camLiveTag').hidden=!(cs.live&&cs.frames>0);
    $('#camFps').hidden=!(cs.live&&cs.frames>0);$('#camFps').textContent=(cs.fps||0)+' FPS';
    const net=$('#camNet');net.innerHTML='';
    const add=(k,v,c)=>{const s=document.createElement('span');s.innerHTML='<b></b> ';s.firstChild.textContent=k;s.append(v);if(c)s.className=c;net.appendChild(s)};
    if(on){add('카메라',cs.camIp||cs.gateway||'-');if(cs.localIp)add('내 주소',cs.localIp);if(cs.proto)add('방식',cs.proto==='jhcmd'?'JHCMD 실시간':cs.proto)}
    if(cs.cellBound){add('이 앱 인터넷','모바일 데이터로 우회','ok');add('다른 앱 인터넷',cs.sysInternet?'정상':'막힘',cs.sysInternet?'ok':'bad')}
    else add('인터넷',cs.internet?(cs.defaultNet==='mobile'?'모바일 데이터':cs.defaultNet==='wifi'?'와이파이':'연결됨'):'없음',cs.internet?'ok':'bad');
    if(on&&cs.sysCam&&cs.sysInternet===false){const d=document.createElement('div');d.className='camwarn';
      d.innerHTML='<b>휴대폰 전체가 블랙박스 와이파이에 연결돼 있어요</b><span>그래서 다른 앱(티맵·음악 앱 등)의 인터넷이 막혀요. 이 앱은 모바일 데이터로 우회하고 있어요. 다른 앱까지 해결하려면: ① 와이파이 설정에서 블랙박스 와이파이를 <b>삭제(저장 안 함)</b> ② 여기서 <b>연결 끊기 → 연결</b>을 누르면 이 앱만 블랙박스에 붙고 휴대폰은 모바일 데이터를 그대로 써요.</span><button class="pill on">와이파이 설정 열기</button>';
      d.querySelector('button').onclick=()=>$('#camWifi').click();net.appendChild(d)}
    const ul=$('#camProbeList');ul.innerHTML='';
    (cs.probe||[]).forEach(r=>{const li=document.createElement('li');li.className=r.ok?'ok':'';li.innerHTML='<i></i><span></span><em></em>';li.children[0].textContent=r.ok?'●':'○';li.children[1].textContent=r.what;li.children[2].textContent=r.note||'';ul.appendChild(li)});
    if(!HAS_CAM){img.hidden=true;say('앱에서만 쓸 수 있어요','휴대폰 앱에서 블랙박스 와이파이에 연결해 실시간 화면을 볼 수 있어요.');return}
    if(cs.live&&cs.frames>0){msg.hidden=true;img.hidden=false;return}
    img.hidden=true;
    if(st==='requesting')say('블랙박스 와이파이를 찾는 중…','휴대폰에 연결 확인 창이 뜨면 블랙박스 와이파이를 골라 주세요.');
    else if(st==='unavailable')say('연결하지 못했어요',cs.err||'블랙박스 전원과 와이파이 이름을 확인해 주세요.');
    else if(st==='lost')say('연결이 끊겼어요','블랙박스 전원이 꺼졌거나 너무 멀어졌어요. 다시 연결해 주세요.');
    else if(on&&cs.live)say('화면을 기다리는 중…',cs.packets>0?'영상 조각을 받고 있어요 ('+cs.packets+')':'카메라가 응답하지 않으면 카메라 찾기로 통신 방식을 확인해 보세요.');
    else if(on)say('블랙박스에 연결됐어요','실시간 보기를 누르면 화면이 나와요.');
    else say('블랙박스에 연결하지 않았어요','연결을 누르면 블랙박스 와이파이에 이 앱만 연결해요. 인터넷(지도·음악 정보)은 모바일 데이터를 그대로 씁니다.');
  }
  function pull(){
    if(HAS_CAM)try{cs=JSON.parse(NB.camState())||{}}catch(e){cs={}}
    if(liveWant&&cs.state==='connected'&&!cs.live&&HAS_CAM){try{NB.camLive(true)}catch(e){}}
    if(cs.live&&cs.frames!==lastFrames&&cs.frames>0&&!loading){loading=true;lastFrames=cs.frames;img.src='/cam/frame.jpg?n='+cs.frames}
    render();
  }
  img.onload=img.onerror=()=>{loading=false};
  function loop(){clearTimeout(pollT);const vis=isCar()&&!w.classList.contains('collapsed')&&!document.hidden;
    if(vis||cs.state==='requesting')pull();pollT=setTimeout(loop,cs.live?66:600)}
  window.__camConnect=r=>{if(r==='old')toast('휴대폰 와이파이 설정에서 블랙박스 와이파이에 먼저 연결해 주세요.');pull()};
  $('#camConn').onclick=()=>{if(!HAS_CAM){toast('휴대폰 앱에서 쓸 수 있어요.');return}
    const st=cs.state;if(st==='connected'||st==='requesting'){liveWant=false;try{NB.camDisconnect()}catch(e){}pull();return}
    liveWant=true;try{NB.camConnect(ssid(),pass())}catch(e){}setTimeout(pull,300)};
  $('#camLiveBtn').onclick=()=>{liveWant=!cs.live;try{NB.camLive(liveWant)}catch(e){}if(!liveWant){lastFrames=-1;$('#wCam').classList.remove('full')}setTimeout(pull,200)};
  $('#camProbeBtn').onclick=()=>{try{NB.camProbe()}catch(e){}$('#camSetBox').open=true;setTimeout(pull,200)};
  $('#camFull').onclick=()=>w.classList.toggle('full');
  $('#camView').onclick=()=>{if(w.classList.contains('full'))w.classList.remove('full')};
  $('#camWifi').onclick=()=>{if(NB&&NB.openWifiSettings)try{NB.openWifiSettings()}catch(e){}else toast('휴대폰 앱에서 쓸 수 있어요.')};
  $('#camSave').onclick=()=>{const v=$('#camSsid').value.trim();store.set('camSsid',v||'Car-Cam*');const pw=$('#camPass').value;if(pw)store.set('camPass',pw);$('#camPass').value='';
    $('#camSsidSum').textContent=ssid().replace(/\*$/,'')||'Car-Cam';toast('블랙박스 와이파이를 저장했어요.')};
  document.addEventListener('visibilitychange',loop);
  window.AmpCam={pull,state:()=>cs};
  render();loop();
})();
