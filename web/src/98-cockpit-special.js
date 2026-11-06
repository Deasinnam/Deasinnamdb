// 콕핏 스페셜 스킨(carnival6) 전용 배치: 플레이어+NOW PLAYING 한 창, 관제탑은 스피드미터 제목줄의 작은 표시, 블랙박스는 기본 접힘
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* NOW PLAYING(앨범·시각화)을 플레이어 창 안으로 옮기고, 스킨을 바꾸면 원래 창으로 되돌림 */
/* 스페셜 2: 위(재생 표시창)·아래(앨범·스펙트럼) 표시창을 하나로 — 앨범 · 곡 정보 · 재생 시간 · 스펙트럼을 한 창에 */
let lcdHome=null;
function cksNp(on){const art=document.querySelector('#wVis .art,#npMerge .art'),vb=document.querySelector('#wVis .visbox,#npMerge .visbox'),lcd=document.querySelector('#wMain .lcd'),body=$('#wMain .body');
  const one=on&&document.documentElement.hasAttribute('data-cp');
  if(on){let m=$('#npMerge');if(!m){m=document.createElement('div');m.id='npMerge';m.className='npmerge';body.append(m)}
    if(art&&art.parentElement!==m)m.append(art);
    if(one){if(!lcdHome&&lcd){lcdHome=document.createComment('lcd');lcd.before(lcdHome)}if(lcd&&lcd.parentElement!==m)m.append(lcd);if(body.firstElementChild!==m)body.prepend(m);m.classList.add('one')}
    else{if(lcdHome&&lcd&&lcd.parentElement===m)lcdHome.after(lcd);if(body.lastElementChild!==m)body.append(m);m.classList.remove('one')}
    if(vb&&vb.parentElement!==m)m.append(vb)}
  else{if(lcdHome&&lcd&&lcd.parentElement!==body)lcdHome.after(lcd);const m=$('#npMerge');if(m)m.classList.remove('one');
    const b=$('#wVis .body');if(b){if(art&&art.parentElement!==b)b.append(art);if(vb&&vb.parentElement!==b)b.append(vb)}}
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
new MutationObserver(cksApply).observe(document.documentElement,{attributes:true,attributeFilter:['data-cks','data-cp']});
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

// 스페셜 2로 바뀌면 원형 계기(시계·날씨·나침반·밝기)를 황동 베젤로 바로 다시 그림
new MutationObserver(()=>{try{briUi()}catch(e){}try{drawWxDial($('#wxDial'),WX.kind,WX.temp,WX.day===false)}catch(e){}}).observe(document.documentElement,{attributes:true,attributeFilter:['data-cp']});
/* ===== 콕핏 스페셜 2 상단 계기: 앤틱 황동 테 + 검은 다이얼 + 밝은 아이보리 큰 숫자·방위·아이콘 ===== */
function CPX(){return document.documentElement.hasAttribute('data-cp')}
const IVO='#f6edd4',BRS=['#fbe3a6','#d6ae62','#8a6427','#3e2a0e'];
function antBase(cv){const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  // 황동 두 겹 테
  let g=ctx.createLinearGradient(-R,-R,R,R);g.addColorStop(0,BRS[0]);g.addColorStop(.3,BRS[1]);g.addColorStop(.65,BRS[3]);g.addColorStop(1,BRS[1]);
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*.97,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=S*.01;ctx.stroke();
  ctx.fillStyle='#120d06';ctx.beginPath();ctx.arc(0,0,R*.87,0,7);ctx.fill();
  g=ctx.createLinearGradient(0,-R,0,R);g.addColorStop(0,BRS[0]);g.addColorStop(.5,BRS[2]);g.addColorStop(1,BRS[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*.85,0,7);ctx.fill();
  // 검은 다이얼
  g=ctx.createRadialGradient(-R*.15,-R*.2,R*.05,0,0,R*.8);g.addColorStop(0,'#1d1a15');g.addColorStop(1,'#050403');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  return {ctx,S,R}}
function antGlass(ctx,R){const gl=ctx.createLinearGradient(-R*.7,-R*.8,R*.3,R*.25);gl.addColorStop(0,'#ffffff22');gl.addColorStop(.42,'#ffffff06');gl.addColorStop(.43,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
function antCap(ctx,S){const g=ctx.createRadialGradient(-S*.012,-S*.015,0,0,0,S*.05);g.addColorStop(0,'#fff1c8');g.addColorStop(.55,BRS[1]);g.addColorStop(1,BRS[3]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,S*.045,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=S*.006;ctx.stroke()}
function antSun(ctx,S,y,sz){ctx.save();ctx.translate(0,y);const g=ctx.createRadialGradient(-sz*.3,-sz*.3,0,0,0,sz);g.addColorStop(0,'#fff0c2');g.addColorStop(.5,BRS[1]);g.addColorStop(1,BRS[2]);ctx.fillStyle=g;
  for(let k=0;k<8;k++){ctx.save();ctx.rotate(k*Math.PI/4);ctx.beginPath();ctx.moveTo(-sz*.17,-sz*1.25);ctx.lineTo(0,-sz*1.95);ctx.lineTo(sz*.17,-sz*1.25);ctx.closePath();ctx.fill();ctx.restore()}
  ctx.beginPath();ctx.arc(0,0,sz,0,7);ctx.fill();ctx.strokeStyle='#3e2a0e';ctx.lineWidth=S*.008;ctx.stroke();ctx.restore()}
function antClock(cv,t){const {ctx,S,R}=antBase(cv);ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<12;i++){if(i%3===0)continue;const a=i/12*Math.PI*2;ctx.strokeStyle=IVO;ctx.lineWidth=S*.03;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(Math.sin(a)*R*.7,-Math.cos(a)*R*.7);ctx.lineTo(Math.sin(a)*R*.58,-Math.cos(a)*R*.58);ctx.stroke()}
  ctx.lineCap='butt';ctx.fillStyle=IVO;ctx.font=`800 ${S*.2}px "Noto Sans KR",Arial,sans-serif`;
  for(const [n,a] of [[12,0],[3,90],[6,180],[9,270]]){const r=a*Math.PI/180;ctx.fillText(String(n),Math.sin(r)*R*.56,-Math.cos(r)*R*.56+S*.01)}
  if(t){const sec=t.s,min=t.m+sec/60,hr=(t.h%12)+min/60,hand=(ang,len,wid,tail)=>{ctx.save();ctx.rotate(ang);ctx.shadowColor='#000';ctx.shadowBlur=S*.02;ctx.fillStyle=IVO;ctx.beginPath();
      ctx.moveTo(-wid/2,tail);ctx.lineTo(-wid*.42,-len+wid);ctx.lineTo(0,-len);ctx.lineTo(wid*.42,-len+wid);ctx.lineTo(wid/2,tail);ctx.closePath();ctx.fill();ctx.restore()};
    hand(hr/12*Math.PI*2,R*.42,S*.07,R*.08);hand(min/60*Math.PI*2,R*.66,S*.05,R*.1);
    ctx.save();ctx.rotate(sec/60*Math.PI*2);ctx.strokeStyle='#d8432e';ctx.lineWidth=S*.012;ctx.beginPath();ctx.moveTo(0,R*.18);ctx.lineTo(0,-R*.72);ctx.stroke();ctx.restore()}
  antCap(ctx,S);antGlass(ctx,R)}
function antWx(cv,k,temp,night){const {ctx,S,R}=antBase(cv);ctx.textAlign='center';ctx.textBaseline='middle';
  const kind=k||'off';
  if(kind==='clear'||kind==='off'){if(night){ctx.fillStyle=IVO;ctx.beginPath();ctx.arc(0,-R*.2,R*.24,0,7);ctx.fill();ctx.fillStyle='#050403';ctx.beginPath();ctx.arc(R*.11,-R*.27,R*.21,0,7);ctx.fill()}else antSun(ctx,S,-R*.16,R*.2)}
  else{if(!night&&kind==='cloudy')antSun(ctx,S,-R*.3,R*.12);
    ctx.fillStyle=IVO;ctx.beginPath();ctx.arc(-R*.18,-R*.12,R*.15,0,7);ctx.arc(R*.04,-R*.22,R*.2,0,7);ctx.arc(R*.24,-R*.1,R*.13,0,7);ctx.rect(-R*.33,-R*.12,R*.7,R*.14);ctx.fill();
    if(kind==='rain'){ctx.strokeStyle='#9fd0ff';ctx.lineWidth=S*.018;ctx.lineCap='round';for(const x of [-.18,0,.18]){ctx.beginPath();ctx.moveTo(R*x,R*.08);ctx.lineTo(R*(x-.05),R*.2);ctx.stroke()}ctx.lineCap='butt'}
    if(kind==='snow'){ctx.fillStyle=IVO;for(const x of [-.18,0,.18]){ctx.beginPath();ctx.arc(R*x,R*.14,S*.018,0,7);ctx.fill()}}
    if(kind==='fog'){ctx.fillStyle='#cfc6ad';for(const y of [.08,.16])ctx.fillRect(-R*.32,R*y,R*.64,S*.018)}}
  ctx.fillStyle=IVO;ctx.font=`800 ${S*.2}px "Noto Sans KR",Arial,sans-serif`;ctx.fillText(temp==null||!isFinite(temp)?'—°':Math.round(temp)+'°',0,R*.42);
  antGlass(ctx,R)}
function antCmp(cv,h,on){const {ctx,S,R}=antBase(cv);ctx.textAlign='center';ctx.textBaseline='middle';
  for(let i=0;i<8;i++){if(i%2===0)continue;const a=i/8*Math.PI*2;ctx.strokeStyle=IVO;ctx.lineWidth=S*.022;ctx.beginPath();ctx.moveTo(Math.sin(a)*R*.72,-Math.cos(a)*R*.72);ctx.lineTo(Math.sin(a)*R*.62,-Math.cos(a)*R*.62);ctx.stroke()}
  ctx.font=`800 ${S*.2}px "Noto Sans KR",Arial,sans-serif`;
  for(const [t,a] of [['N',0],['E',90],['S',180],['W',270]]){const r=a*Math.PI/180;ctx.fillStyle=t==='N'?'#e2412c':IVO;ctx.fillText(t,Math.sin(r)*R*.56,-Math.cos(r)*R*.56+S*.01)}
  const ang=on?-(h||0)*Math.PI/180:Math.PI*.17;ctx.save();ctx.rotate(ang);ctx.shadowColor='#000';ctx.shadowBlur=S*.025;
  ctx.fillStyle='#d8432e';ctx.beginPath();ctx.moveTo(0,-R*.62);ctx.lineTo(S*.045,0);ctx.lineTo(-S*.045,0);ctx.closePath();ctx.fill();
  ctx.fillStyle=IVO;ctx.beginPath();ctx.moveTo(0,R*.62);ctx.lineTo(S*.045,0);ctx.lineTo(-S*.045,0);ctx.closePath();ctx.fill();ctx.restore();
  if(!on){ctx.fillStyle='#00000040';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
  antCap(ctx,S);antGlass(ctx,R)}
function antBri(cv,v){const {ctx,S,R}=antBase(cv);ctx.textAlign='center';ctx.textBaseline='middle';
  antSun(ctx,S,-R*.16,R*(v<0?.17:.1+.1*(v-10)/90));
  ctx.fillStyle=IVO;ctx.font=`800 ${S*(v<0?.17:.2)}px "Noto Sans KR",Arial,sans-serif`;ctx.fillText(v<0?'AUTO':v+'%',0,R*.42);antGlass(ctx,R)}
// 나침반 옆 글자: 스페셜 2는 'GPS OFF' 같은 짧은 표시판
setInterval(()=>{if(!CPX())return;const e=$('#cmpE');if(!e)return;const on=gpsOn&&hdgNow>=0;const t=on?(Math.round(hdgDisp%360+360)%360)+'° '+CMP_KO[Math.round(((hdgDisp%360)+360)%360/45)%8]:gpsOn?'방향 찾는 중':'GPS OFF';if(e.textContent!==t)e.textContent=t;e.dataset.st=on?'on':gpsOn?'wait':'off'},500);
new MutationObserver(()=>{try{cmpLast='';cmpTick()}catch(e){}try{drawDials(true)}catch(e){}}).observe(document.documentElement,{attributes:true,attributeFilter:['data-cp']});
