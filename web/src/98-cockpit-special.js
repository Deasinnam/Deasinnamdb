// 콕핏 스페셜 스킨(carnival6) 전용 배치: 플레이어+NOW PLAYING 한 창, 관제탑은 스피드미터 제목줄의 작은 표시, 블랙박스는 기본 접힘
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* NOW PLAYING(앨범·시각화)을 플레이어 창 안으로 옮기고, 스킨을 바꾸면 원래 창으로 되돌림 */
function cksNp(on){const art=document.querySelector('#wVis .art,#npMerge .art'),vb=document.querySelector('#wVis .visbox,#npMerge .visbox');
  if(on){let m=$('#npMerge');if(!m){m=document.createElement('div');m.id='npMerge';m.className='npmerge';$('#wMain .body').append(m)}
    if(art&&art.parentElement!==m)m.append(art);if(vb&&vb.parentElement!==m)m.append(vb)}
  else{const b=$('#wVis .body');if(b){if(art&&art.parentElement!==b)b.append(art);if(vb&&vb.parentElement!==b)b.append(vb)}}
  FX_GROUPS.vis=on?['wMain']:['wVis']}
/* 관제탑: 아래 창 대신 스피드미터 제목줄 옆 작은 표시(누르면 다시 점검) */
const atcMini=(()=>{const b=document.createElement('button');b.type='button';b.id='atcMini';b.className='atcmini';b.title='관제탑 — 누르면 다시 점검';
  b.innerHTML='<b>TWR</b><span>대기</span>';const bar=$('#wGps>.bar'),g=bar&&bar.querySelector('.groove');if(bar)bar.insertBefore(b,g||null);
  b.onclick=e=>{e.stopPropagation();const r=$('#atcRun');if(r)r.click()};return b})();
function atcMiniSync(){const w=$('#atcWarn'),c=$('#atcClr'),li=[...document.querySelectorAll('#atcLog li')].pop();let t,k='';
  if(w&&!w.hidden){t=(w.querySelector('b')||w).textContent.replace(/^⚠\s*/,'');k='warn'}
  else if(c&&!c.hidden){t='이륙 허가';k='ok'}
  else if(li){t=li.textContent.replace(/\s+/g,' ').trim().replace(/^TWR\s*/,'');k='run'}
  else t=($('#atcSt')&&$('#atcSt').textContent.replace(/^·\s*/,''))||'대기';
  atcMini.querySelector('span').textContent=t;atcMini.dataset.k=k}
if($('#wAtc'))new MutationObserver(()=>atcMiniSync()).observe($('#wAtc'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
atcMiniSync();
let cksWas=false;
function cksApply(){const on=isCks();cksNp(on);
  if(on&&!cksWas){const c=$('#wCam');if(c)c.classList.add('collapsed')} // 블랙박스는 처음엔 접어 둠(− 버튼으로 펴고 접기)
  cksWas=on;try{devCapsPlace();devCapsRender()}catch(e){}
  if(typeof ckFocus==='function'&&appEl.classList.contains('FX'))ckFocus(store.get('ckFocus','all'),true)}
new MutationObserver(cksApply).observe(document.documentElement,{attributes:true,attributeFilter:['data-cks']});
cksApply();
/* ===== 콕핏 스페셜 조종 패널: 와이파이 → 주행 녹화, 블루투스 → 미디어 음소거, 간편 모드 → 주간·야간 ===== */
(function(){
  const $i=id=>document.getElementById(id),lever=(id,on)=>$i(id).setAttribute('aria-checked',on?'true':'false');
  const ro=(id,txt,on,cls)=>{const r=$i(id);r.classList.toggle('off',!on);r.classList.toggle('rec',cls==='rec');r.lastElementChild.textContent=txt};
  const note=(id,t)=>{$i(id).textContent=t};
  const press=on=>{try{sndPress(on)}catch(e){}};
  /* 주행 녹화: 이 기기의 뒤쪽 카메라로 찍어(소리 없음) 2초마다 앱에 넘겨 동영상 폴더에 저장 */
  const REC={stream:null,mr:null,t0:0,tick:0,busy:false,q:Promise.resolve()};
  const hms=s=>[s/3600|0,(s/60|0)%60,s%60|0].map(n=>String(n).padStart(2,'0')).join(':');
  const recName=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `D1_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.webm`};
  const b64=buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
  function recUi(){const on=!!REC.mr;lever('dkRecSwitch',on);document.documentElement.toggleAttribute('data-rec',on);
    const el=$('#recBadge');if(el)el.hidden=!on;
    if(on){const t=hms((Date.now()-REC.t0)/1000);ro('dkRecReadout','REC '+t,true,'rec');if(el)el.lastElementChild.textContent=t;note('dkRecNote','내리면 저장 후 종료')}
    else{ro('dkRecReadout','STANDBY',false);note('dkRecNote','올리면 녹화 시작')}}
  async function recStart(){if(REC.mr||REC.busy)return;REC.busy=true;lever('dkRecSwitch',true);ro('dkRecReadout','카메라 여는 중…',true);
    try{
      if(!NB||!NB.recOpen)throw new Error('앱에서만 녹화할 수 있어요');
      if(!navigator.mediaDevices||!window.MediaRecorder)throw new Error('이 기기는 녹화를 지원하지 않아요');
      REC.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30}},audio:false});
      const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||'';
      if(!NB.recOpen(recName()))throw new Error('저장 파일을 만들지 못했어요');
      const mr=new MediaRecorder(REC.stream,mime?{mimeType:mime,videoBitsPerSecond:2500000}:{videoBitsPerSecond:2500000});
      mr.ondataavailable=e=>{if(e.data&&e.data.size)REC.q=REC.q.then(()=>e.data.arrayBuffer()).then(b=>{try{NB.recWrite(b64(b))}catch(_){}})};
      mr.onstop=()=>{REC.q.then(()=>{let where='';try{where=NB.recClose()}catch(_){}try{toast(where?'주행 영상을 저장했어요: '+where:'영상을 저장하지 못했어요')}catch(_){}})};
      mr.start(2000);REC.mr=mr;REC.t0=Date.now();clearInterval(REC.tick);REC.tick=setInterval(recUi,1000);press(true);
    }catch(e){recStopTracks();lever('dkRecSwitch',false);ro('dkRecReadout','STANDBY',false);
      try{toast(e&&e.name==='NotAllowedError'?'카메라 권한이 필요해요. 허용한 뒤 다시 올려 주세요.':(e&&e.message)||'녹화를 시작하지 못했어요')}catch(_){}}
    REC.busy=false;recUi()}
  function recStopTracks(){try{REC.stream&&REC.stream.getTracks().forEach(t=>t.stop())}catch(e){}REC.stream=null}
  function recStop(){clearInterval(REC.tick);const mr=REC.mr;REC.mr=null;if(mr&&mr.state!=='inactive'){try{mr.stop()}catch(e){}}recStopTracks();press(false);recUi()}
  $i('dkRecSwitch').onclick=()=>{if(REC.mr)recStop();else recStart()};
  // 화면을 벗어나면(다른 앱으로 전환 등) 카메라가 끊기므로 그때까지 찍은 것을 저장
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&REC.mr)recStop()});
  window.AmpRec={get on(){return !!REC.mr},start:recStart,stop:recStop};
  /* 미디어 음소거: 조종 패널 볼륨과 같은 기능(원래 MUTE 버튼을 대신 눌러 줌) */
  function muteUi(){const v=$i('dkVolumeValue'),m=v&&v.textContent.trim()==='0';lever('dkMuteSwitch',m);ro('dkMuteReadout',m?'MUTED':'SOUND ON',!m);note('dkMuteNote',m?'내리면 소리 켬':'올리면 소리 끔')}
  $i('dkMuteSwitch').onclick=()=>{const b=$i('dkMuteButton');if(b&&!b.disabled)b.click();setTimeout(muteUi,30)};
  if($i('dkVolumeValue'))new MutationObserver(muteUi).observe($i('dkVolumeValue'),{childList:true,characterData:true,subtree:true});muteUi();
  /* 주간·야간: 주간 = 밝기 100% + 주간 활주로, 야간 = 밝기 50% + 야간 활주로 */
  let dayMode=store.get('cksDay',null);
  function dayUi(){const d=dayMode!=='night';lever('dkDaySwitch',d);ro('dkDayReadout',d?'DAY':'NIGHT',true);note('dkDayNote',d?'주간 밝기 100%':'야간 밝기 50%');$i('dkDayReadout').classList.toggle('night',!d)}
  function dayApply(m,save=true){dayMode=m;if(save)store.set('cksDay',m);try{window.AmpBri&&window.AmpBri.set(m==='night'?50:100)}catch(e){}
    try{window.AmpPfd&&window.AmpPfd.setTheme&&window.AmpPfd.setTheme(m)}catch(e){}dayUi()}
  $i('dkDaySwitch').onclick=()=>{const m=dayMode==='night'?'day':'night';press(m==='day');dayApply(m)};
  dayUi();
  window.AmpDay={get mode(){return dayMode},set:dayApply};
})();
