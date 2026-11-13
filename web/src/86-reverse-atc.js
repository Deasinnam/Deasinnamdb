// 후진 멜로디, 관제탑(점검·음성·속도 주의)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 후진 멜로디: "엘리제를 위하여"(베토벤, 저작권 만료 곡)를 앱이 직접 연주 ---------- */
const REV_SONG=(()=>{const N={C4:261.63,E4:329.63,'G#4':415.3,A4:440,B4:493.88,C5:523.25,D5:587.33,'D#5':622.25,E5:659.25};
  const a=[['E5',1],['D#5',1],['E5',1],['D#5',1],['E5',1],['B4',1],['D5',1],['C5',1],['A4',2],[0,1],['C4',1],['E4',1],['A4',1],['B4',2],[0,1],['E4',1],['G#4',1],['B4',1],['C5',2],[0,1],['E4',1]];
  const b=[['E5',1],['D#5',1],['E5',1],['D#5',1],['E5',1],['B4',1],['D5',1],['C5',1],['A4',2],[0,1],['C4',1],['E4',1],['A4',1],['B4',2],[0,1],['E4',1],['C5',1],['B4',1],['A4',3],[0,4]];
  return [...a,...b].map(([n,d])=>[n?N[n]:0,d])})();
const rev={on:false,t0:0,tm:0,src:'',autoT:0,offT:0};
let revNodes=[];
function revVol(){return +store.get('revVol',0.5)||0.5}
function revPlayOnce(){const a=fx();if(!a)return 0;const U=.17,v=revVol();let t=a.currentTime+.05;const out=a.createGain();out.gain.value=v;out.connect(a.destination);revNodes.push(out);
  for(const [f,d] of REV_SONG){if(f){for(const [mul,type,g] of [[1,'triangle',.55],[2,'sine',.18],[3,'sine',.06]]){const o=a.createOscillator(),e=a.createGain();o.type=type;o.frequency.value=f*mul;
        e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+.012);e.gain.exponentialRampToValueAtTime(.0008,t+Math.max(.32,d*U*1.6));o.connect(e);e.connect(out);o.start(t);o.stop(t+Math.max(.36,d*U*1.7))}}
    t+=d*U}
  return (t-a.currentTime)*1000}
function revLoop(){if(!rev.on)return;const ms=revPlayOnce();rev.tm=setTimeout(revLoop,Math.max(1200,ms+600))}
function revSet(on,src){on=!!on;if(on&&store.get('revOn',true)===false)return;if(on===rev.on)return;rev.on=on;rev.src=src||'';clearTimeout(rev.tm);
  let el=document.getElementById('revFx');if(!el){el=document.createElement('div');el.id='revFx';el.setAttribute('role','alert');el.innerHTML='<i>R</i><div>후진 중<small>누르면 멈춰요</small></div>';el.onclick=()=>revSet(false);document.body.appendChild(el)}
  el.hidden=!on;$('#revBtn').classList.toggle('on',on);$('#revBtn').setAttribute('aria-pressed',String(on));
  if(on){rev.t0=Date.now();revLoop();{const ci=document.getElementById('camImg');if(isCk2()&&ci&&!ci.hidden)ckFocus('cam')}} // 블랙박스 화면이 켜져 있으면 그 화면으로
  else{for(const n of revNodes){try{n.gain.cancelScheduledValues(0);n.gain.setValueAtTime(0,fx().currentTime);n.disconnect()}catch(e){}}revNodes=[]}}
// 앞으로 시속 15km 넘게 달리거나 1분이 지나면 자동으로 끔
setInterval(()=>{if(!rev.on)return;if(Date.now()-rev.t0>60000||(spdNow>15&&rev.src!=='test'))revSet(false)},1000);
// 자동 감지(실험): GPS 진행 방향과 휴대폰(차 앞) 방향이 반대 → 후진
function revAutoTick(s,v){if(!store.get('revAuto',false)||!store.get('revOn',true))return;const kmh=v*3.6,now=Date.now();
  const dev=(typeof att!=='undefined'&&att.on&&att.hdg>=0)?att.hdg:(s.azimuth>=0?s.azimuth:-1);
  if(!(s.fix&&s.bearing>=0&&dev>=0&&kmh>=1.5&&kmh<=15)){rev.autoT=0;if(rev.on&&rev.src==='auto'&&(kmh>15||kmh<.5)){if(!rev.offT)rev.offT=now;if(now-rev.offT>2500)revSet(false)}return}
  const diff=Math.abs(((s.bearing-dev)%360+540)%360-180);
  if(diff>140){rev.offT=0;if(!rev.autoT)rev.autoT=now;if(!rev.on&&now-rev.autoT>2500)revSet(true,'auto')}
  else{rev.autoT=0;if(rev.on&&rev.src==='auto'&&diff<60){if(!rev.offT)rev.offT=now;if(now-rev.offT>2000)revSet(false)}}}
window.AmpRev={toggle(){revSet(!rev.on,'button')},set:revSet,get on(){return rev.on}};
// 관제탑 무전: 앱에서는 TTS를 파일로 받아 무전기 느낌(300~3000Hz 대역)으로 재생. 잡음·찌그러짐·스퀠치(직직) 없이, 말 앞뒤에 부드러운 '띠릭'
/* 띠릭: 둥근 사인파 두 음(올라가면 시작, 내려가면 끝), 짧고 작게 */
function sndChime(at,up=true){const a=fx();if(!a)return;const t=a.currentTime+at,notes=up?[1046.5,1568]:[1568,1174.7];
  notes.forEach((f,i)=>{const o=a.createOscillator(),o2=a.createOscillator();o.type='sine';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*2;
    const g=fxEnv(a,t+i*.085,.12,.006,.16),g2=a.createGain();g2.gain.value=.12;o.connect(g);o2.connect(g2).connect(g);g.connect(a.destination);
    o.start(t+i*.085);o2.start(t+i*.085);o.stop(t+i*.085+.22);o2.stop(t+i*.085+.22)})}
const ttsWait={};let radioSrc=null;
window.__ttsFile=(id,ok)=>{const f=ttsWait[id];if(f){delete ttsWait[id];f(!!ok)}};
async function radioSay(text){
  const a=fx();if(!a||!NB||!NB.ttsToFile)return false;
  const id='rd'+Date.now().toString(36);
  const ok=await new Promise(res=>{ttsWait[id]=res;setTimeout(()=>{if(ttsWait[id]){delete ttsWait[id];res(false)}},6000);try{if(!NB.ttsToFile(text,id))res(false)}catch(e){res(false)}});
  if(!ok)return false;
  let buf;try{const r=await fetch('/tts/'+id+'.wav');if(!r.ok)return false;buf=await a.decodeAudioData(await r.arrayBuffer())}catch(e){return false}
  try{if(radioSrc)radioSrc.stop()}catch(e){}
  const t=a.currentTime+.18,src=a.createBufferSource();src.buffer=buf;src.playbackRate.value=1.04;radioSrc=src;
  const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=330;hp.Q.value=.9;
  const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2900;lp.Q.value=1.1;
  const pk=a.createBiquadFilter();pk.type='peaking';pk.frequency.value=1750;pk.gain.value=4;pk.Q.value=1.2;
  const cmp=a.createDynamicsCompressor();cmp.threshold.value=-22;cmp.ratio.value=4;cmp.attack.value=.003;cmp.release.value=.12;
  const out=a.createGain();out.gain.value=.95;
  src.connect(hp).connect(pk).connect(lp).connect(cmp).connect(out).connect(a.destination);
  const dur=buf.duration/1.04;
  sndChime(0,true);src.start(t+.12);sndChime(dur+.42,false);
  return true}
function atcSpeak(text){if(!atcOn())return;
  if(NB&&NB.ttsToFile){radioSay(text).then(ok=>{if(!ok&&NB.speak)try{NB.speak(text)}catch(e){}});return}
  try{if(NB&&NB.speak){NB.speak(text);return}}catch(e){}
  try{if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=1.02;u.pitch=.95;speechSynthesis.cancel();sndChime(0,true);setTimeout(()=>speechSynthesis.speak(u),220)}}catch(e){}}

// SOS 연락처: 앱 설정(SOS 긴급 연락처)과 조종 패널 설정이 같은 저장소를 씀
let sos=store.get('sos',{name:'',number:''});
if(sos.number)sos.number=String(sos.number).replace(/[\s().-]/g,'');
function sndAlarm(){const a=fx();if(!a)return;const t=a.currentTime;[0,.22,.44].forEach((dt,i)=>{const o=a.createOscillator();o.type='square';o.frequency.value=i%2?660:880;const g=fxEnv(a,t+dt,.12,.005,.18);o.connect(g).connect(a.destination);o.start(t+dt);o.stop(t+dt+.22)})}
function sosStore(name,number){const n=String(number||'').replace(/[\s().-]/g,'');if(n&&!/^\+?[0-9]{3,15}$/.test(n)){$('#sSosSt').textContent='전화번호는 숫자 3~15자리로 입력해 주세요.';return false}
  sos={name:String(name||'').trim().slice(0,24),number:n};store.set('sos',sos);$('#sSosName').value=sos.name;$('#sSosNum').value=sos.number;$('#sSosSt').textContent=n?'저장했어요. SOS 버튼이 이 번호로 전화해요.':'SOS 연락처를 지웠어요.';if(typeof dk!=='undefined')dk.render();return true}
$('#sSosSave').onclick=()=>sosStore($('#sSosName').value,$('#sSosNum').value);
$('#sSosPick').onclick=()=>{if(NB&&NB.pickContact)NB.pickContact();else $('#sSosSt').textContent='연락처에서 고르기는 앱에서 쓸 수 있어요. 아래에 직접 입력해 주세요.'};
window.__sosPicked=o=>{if(o&&o.number)sosStore(o.name,o.number)};
$('#sSosName').value=sos.name||'';$('#sSosNum').value=sos.number||'';
// 조종 패널(대신남 원 Cockpit Control 패키지 이식): 앱에서는 실제 기기 상태가 기준, 웹 미리보기는 시연
const dk=(()=>{
  const $i=id=>document.getElementById(id);
  // 패키지의 CockpitNative 계약을 기존 AndroidBridge 위에 맞춤
  const native=(NB&&NB.cockpitState)?{
    getState(){const o=JSON.parse(NB.cockpitState());return {volume:typeof o.volume==='number'?o.volume:null,wifi:typeof o.wifi==='boolean'?o.wifi:null,bluetooth:o.hasBt===false?false:(typeof o.bt==='boolean'?o.bt:null),wifiSupported:o.wifiSupported!==false,bluetoothSupported:o.hasBt!==false}},
    setVolume(p){NB.setSystemVolume(p)},
    wifi(want){return NB.setWifi(want)},bt(want){return NB.setBluetooth(want)},
    call(phone){return NB.sosCall(phone)}}:null;
  const isNative=!!native,KEY='daesinnam.cockpit.v1',clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,Math.round(Number(n)||0)));
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){}
  const st={volume:isNative?0:clamp(saved.volume??42),volumeKnown:!isNative,lastVolume:42,wifi:isNative?null:(typeof saved.wifi==='boolean'?saved.wifi:true),bluetooth:isNative?null:(typeof saved.bluetooth==='boolean'?saved.bluetooth:true),
    brightness:clamp(saved.brightness??100,60,100),guardOpen:false,wifiSupported:true,bluetoothSupported:true,pending:{}};
  if(st.volume>0)st.lastVolume=st.volume;
  let guardT,volT,dragging=false;
  const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({brightness:st.brightness,volume:st.volume,wifi:st.wifi,bluetooth:st.bluetooth}))}catch(_){}};
  let msgLive=false;const msg=t=>{$i('dkSystemMessage').textContent=t;if(msgLive)toast(t)};
  function radioView(name,value,sup){const k=name==='wifi'?'Wifi':'Bt',label=name==='wifi'?'와이파이':'블루투스',b=$i('dk'+k+'Switch'),r=$i('dk'+k+'Readout');
    b.disabled=!sup;b.setAttribute('aria-checked',String(value===true));b.dataset.unknown=String(value===null);b.setAttribute('aria-label',label+(isNative?' 켜기/끄기 (설정 열기)':', 시연 모드'));
    r.className='readout'+(!sup||value===null?' unknown':value?'':' off');r.lastElementChild.textContent=!sup?'NOT FITTED':value===null?'CHECK STATE':value?'POWER ON':'POWER OFF';
    $i('dk'+k+'Note').textContent=!sup?'이 기기에서 지원하지 않음':isNative?(st.pending[name]?'설정에서 바꾸고 돌아오세요':value===null?'탭하여 권한·설정 확인':'탭하여 켜기/끄기'):'데모 스위치'}
  function render(){
    const v=st.volumeKnown?String(st.volume):'—';$i('dkVolumeValue').value=v;$i('dkVolumeValue').textContent=v;
    for(const id of ['dkVolumeRange','dkVolumeDown','dkVolumeUp','dkMuteButton'])$i(id).disabled=!st.volumeKnown;
    const kn=$i('dkVolumeKnob');kn.setAttribute('aria-disabled',String(!st.volumeKnown));kn.setAttribute('aria-valuenow',String(st.volume));kn.setAttribute('aria-valuetext',st.volume+' 퍼센트');kn.style.setProperty('--knob-angle',(st.volume*2.7-135)+'deg');
    $i('dkVolumeRange').value=String(st.volume);$i('dkVolumeRange').style.setProperty('--p',st.volume+'%');
    $i('dkMuteButton').setAttribute('aria-pressed',String(st.volume===0));$i('dkMuteButton').textContent=st.volume===0?'MUTED':'MUTE';
    radioView('wifi',st.wifi,st.wifiSupported);radioView('bluetooth',st.bluetooth,st.bluetoothSupported);
    const easy=typeof driveOn!=='undefined'&&driveOn;$i('dkModeSwitch').setAttribute('aria-checked',String(easy));$i('dkModeReadout').className='readout'+(easy?'':' off');$i('dkModeReadout').lastElementChild.textContent=easy?'EASY':'NORMAL';
    $i('dkConsole').style.setProperty('--brightness',st.brightness/100);
    $i('dkContactSummary').textContent=sos.number?(sos.name||'SOS 연락처')+' · '+sos.number.slice(0,3)+'···'+sos.number.slice(-4):'연락처 등록 필요'}
  function refresh(){if(!isNative||!isCp())return render();
    try{const o=native.getState();if(o.volume!=null){st.volumeKnown=true;if(!dragging)st.volume=clamp(o.volume)}
      for(const k of ['wifi','bluetooth']){if(st.pending[k]!=null&&o[k]===st.pending[k])delete st.pending[k];if(o[k]!==st[k]&&st[k]!==null&&o[k]!==null)sndPress(!!o[k]);st[k]=o[k]}
      st.wifiSupported=o.wifiSupported;st.bluetoothSupported=o.bluetoothSupported;
      $i('dkReadyText').textContent='SYSTEM READY';$i('dkPlatformText').textContent='ANDROID LINK';$i('dkPlatformTag').style.color='var(--green)';render()}
    catch(_){$i('dkReadyText').textContent='LINK ERROR';msg('기기 상태를 읽을 수 없습니다. 앱 연결을 확인하세요.')}}
  function setVolume(v){if(!st.volumeKnown)return;st.volume=clamp(v);if(st.volume>0)st.lastVolume=st.volume;render();persist();
    if(isNative){clearTimeout(volT);volT=setTimeout(()=>{try{native.setVolume(st.volume)}catch(_){}setTimeout(refresh,160)},80)}else audio.muted=st.volume===0}
  $i('dkVolumeRange').addEventListener('input',e=>setVolume(e.target.value));
  $i('dkVolumeDown').onclick=()=>setVolume(st.volume-5);$i('dkVolumeUp').onclick=()=>setVolume(st.volume+5);
  $i('dkMuteButton').onclick=()=>{sndPress(st.volume!==0);setVolume(st.volume===0?st.lastVolume||42:0)};
  let dragY=0,dragV=0;const kn=$i('dkVolumeKnob');
  kn.addEventListener('pointerdown',e=>{if(!st.volumeKnown)return;dragging=true;dragY=e.clientY;dragV=st.volume;kn.setPointerCapture(e.pointerId)});
  kn.addEventListener('pointermove',e=>{if(dragging)setVolume(dragV+(dragY-e.clientY)*.65)});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])kn.addEventListener(ev,()=>{dragging=false});
  kn.addEventListener('keydown',e=>{let v=st.volume;if(['ArrowUp','ArrowRight'].includes(e.key))v+=5;else if(['ArrowDown','ArrowLeft'].includes(e.key))v-=5;else if(e.key==='Home')v=0;else if(e.key==='End')v=100;else return;e.preventDefault();setVolume(v)});
  // 와이파이·블루투스: 클릭했다고 바로 ON으로 바꾸지 않고, 기기에서 다시 읽은 상태를 표시
  function radio(key){const label=key==='wifi'?'와이파이':'블루투스',want=!(st[key]===true);
    if(!isNative){st[key]=want;sndPress(want);persist();render();msg('시연: '+label+' '+(want?'ON':'OFF')+' · 실제 기기 설정은 변경되지 않습니다.');return}
    let r='';try{r=key==='wifi'?native.wifi(want):native.bt(want)}catch(_){}
    if(r==='done'){msg(label+'를 '+(want?'켰습니다.':'껐습니다.'));setTimeout(refresh,400)}
    else if(r==='perm')msg('블루투스 상태를 바꾸려면 "근처 기기" 권한이 필요합니다. 허용한 뒤 다시 누르세요.');
    else if(r==='none')msg('이 기기에는 블루투스가 없습니다.');
    else{st.pending[key]=want;sndPress(false);msg(r==='ask'?label+' 켜기 요청 창에서 허용을 누르세요. 돌아오면 실제 상태를 다시 읽습니다.':label+' 시스템 설정을 엽니다. 바꾸고 돌아오면 실제 상태를 다시 읽습니다.');setTimeout(()=>{delete st.pending[key];render()},30000)}
    render()}
  $i('dkWifiSwitch').onclick=()=>radio('wifi');$i('dkBtSwitch').onclick=()=>radio('bluetooth');
  // DRIVE MODE = 앱의 간편 모드(큰 버튼 운전 화면). 차량 주행 기능이 아님
  $i('dkModeSwitch').onclick=()=>{const want=!driveOn;sndPress(want);$i('dkModeSwitch').setAttribute('aria-checked',String(want));msg(want?'간편 화면을 켭니다.':'일반 화면으로 돌아왔습니다.');setTimeout(()=>{drive(want);if(want)driveSuppress=false;render()},want?220:0)};
  // SOS: 닫힌 덮개 → 열기 → SOS를 누르면 등록한 번호로 바로 전화. 10초 미조작·화면 이탈·접기 시 닫힘
  function setGuard(open){st.guardOpen=!!open;const f=$i('dkGuardFrame');const was=f.classList.contains('open');f.classList.toggle('open',st.guardOpen);
    $i('dkGuardCover').setAttribute('aria-expanded',String(st.guardOpen));$i('dkGuardCover').setAttribute('aria-label',st.guardOpen?'SOS 보호 덮개 닫기':'SOS 보호 덮개 열기');
    $i('dkSosButton').disabled=!st.guardOpen;$i('dkGuardClose').hidden=!st.guardOpen;$i('dkSosNote').hidden=st.guardOpen;clearTimeout(guardT);
    if(was!==st.guardOpen)sndPress(st.guardOpen);
    if(st.guardOpen){msg(sos.number?`SOS 덮개가 열렸습니다. SOS를 누르면 ${sos.name||'등록한 연락처'}에게 바로 전화합니다.`:'SOS 덮개가 열렸습니다. 먼저 연락처를 등록하세요.');guardT=setTimeout(()=>{setGuard(false);msg('SOS 보호 덮개를 자동으로 닫았습니다.')},10000)}
    else if(was)msg('SOS 보호 덮개가 닫혔습니다.')}
  $i('dkGuardCover').onclick=()=>setGuard(!st.guardOpen);$i('dkGuardClose').onclick=()=>setGuard(false);
  $i('dkSosButton').onclick=()=>{if(!st.guardOpen)return;setGuard(false);
    if(!/^\+?[0-9]{3,15}$/.test(sos.number)){openSettings();toast('먼저 SOS 연락처를 등록하세요.');return}
    sndAlarm();let r='demo';try{if(isNative)r=native.call(sos.number)}catch(_){}
    msg(r==='call'?`${sos.name||sos.number}에게 전화를 걸고 있습니다.`:r==='perm'?'전화 권한을 허용하면 바로 전화를 겁니다.':r==='dial'?'이 기기는 전화를 걸 수 없어 전화 앱에 번호를 띄웠습니다.':'웹 시연입니다. 앱에서는 등록한 번호로 바로 전화합니다.');
    if(r==='demo')toast('시연: '+(sos.name||'등록 연락처')+'에게 전화 · 실제 통화 없음');
    window.dispatchEvent(new CustomEvent('cockpit:command',{detail:{method:'call',args:[sos.number],demo:r==='demo'}}))};
  function openSettings(){setGuard(false);$i('dkContactName').value=sos.name||'';$i('dkContactPhone').value=sos.number||'';$i('dkBrightnessRange').value=String(st.brightness);$i('dkFormError').hidden=true;$i('dkSettingsDialog').showModal()}
  $i('dkSettingsButton').onclick=openSettings;$i('dkCloseSettings').onclick=()=>$i('dkSettingsDialog').close();
  $i('dkSettingsDialog').addEventListener('close',()=>$i('dkConsole').style.setProperty('--brightness',st.brightness/100));
  $i('dkBrightnessRange').addEventListener('input',e=>$i('dkConsole').style.setProperty('--brightness',clamp(e.target.value,60,100)/100));
  $i('dkSettingsForm').addEventListener('submit',e=>{e.preventDefault();const phone=$i('dkContactPhone').value.replace(/[\s().-]/g,'');
    if(phone&&!/^\+?[0-9]{3,15}$/.test(phone)){$i('dkFormError').textContent='전화번호는 숫자 3~15자리로 입력하세요. 국가번호 +를 사용할 수 있습니다.';$i('dkFormError').hidden=false;return}
    st.brightness=clamp($i('dkBrightnessRange').value,60,100);persist();sosStore($i('dkContactName').value,phone);$i('dkSettingsDialog').close();toast('설정을 저장했습니다.')});
  $i('dkCollapseButton').onclick=()=>{setGuard(false);const c=$i('dkConsole').classList.toggle('collapsed');$i('dkCollapseButton').setAttribute('aria-expanded',String(!c));$i('dkCollapseButton').setAttribute('aria-label',c?'제어 패널 펼치기':'제어 패널 접기');$i('dkCollapseButton').firstElementChild.textContent=c?'+':'−'};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)setGuard(false);else refresh()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&st.guardOpen)setGuard(false)});
  if(isNative){$i('dkPlatformHelp').textContent='Android 기기 연결 모드입니다. 볼륨은 실제 기기 볼륨을 조절합니다. 와이파이·블루투스는 기기 상태를 읽어 표시하고, 직접 바꿀 수 없으면 시스템 설정을 엽니다.';msg('기기에 연결되었습니다. 설정 화면에서 돌아오면 상태를 갱신합니다.')}
  else msg('브라우저 시연 모드입니다. 스위치를 눌러 작동을 확인하세요.');
  msgLive=true;
  setInterval(()=>{if(!document.hidden&&isCp())refresh()},2000);
  return {refresh,render,setGuard,openSettings,state:st};
})();
window.Cockpit={version:1,refresh:dk.refresh,notify:t=>toast(t),getState:()=>({...dk.state,easy:driveOn,contactName:sos.name,contactPhone:sos.number,platform:NB&&NB.cockpitState?'android':'demo'})};
// 관제탑 출발 전 점검
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let atcRun=0,atcDone=false;
const ATC=[
  {me:1,t:'관제탑, '+CALLSIGN+'. 출발 전 점검을 요청합니다.'},
  {t:''+CALLSIGN+', 관제탑. 출발 전 점검을 시작합니다.'},
  {t:'좌석 위치와 안전벨트 착용 확인',c:'CHECK'},
  {t:'브레이크 페달 작동 확인',c:'CHECK'},
  {t:'사이드미러 · 룸미러 각도 확인',c:'CHECK'},
  {t:'연료 · 배터리 잔량 확인',c:'CHECK'},
  {t:'전조등 · 계기판 조명 확인',c:'CHECK'},
  {t:'GPS 위성 수신 확인',c:()=>gpsOn&&gs.fix?['위성 '+(gs.satsUsed||'-'),'ok']:[gpsOn?'수신 대기':'GPS 꺼짐','warn']},
  {t:'오디오 시스템 확인',c:()=>{const v=dk.state.volumeKnown?dk.state.volume:-1;return v===0?['MUTE','warn']:[v<0?'VOL ON':'VOL '+v,'ok']}},
  {t:'휴대폰 거치 · 내비게이션 경로 확인',c:'CHECK'},
  {me:1,t:'관제탑, '+CALLSIGN+'. 출발 준비 완료.'},
  {t:''+CALLSIGN+', 활주로 진입 허가. 바람 잔잔, 이륙을 허가합니다.',fin:1}];
function atcClock(){const d=new Date();$('#atcClock').textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0')}
setInterval(atcClock,1000);atcClock();
async function atcStart(){
  const id=++atcRun,live=()=>id===atcRun&&isCk(),sleep=ms=>new Promise(r=>setTimeout(r,ms/(window.__atcSpeed||1))); // __atcSpeed: 테스트에서만 빠르게
  const log=$('#atcLog');log.innerHTML='';$('#atcClr').hidden=true;atcDone=false;$('#atcSt').textContent='· 점검 중';
  const nChk=ATC.filter(x=>x.c).length;let k=0;$('#atcBar').style.width='0';
  for(const it of ATC){if(!live())return;
    if(log.children.length>=2){await sleep(250);if(!live())return;log.innerHTML=''}
    const li=document.createElement('li');li.className=it.me?'me':'';li.innerHTML=`<b>${it.me?'D1':'TWR'}</b><span class="cur"></span><em></em>`;log.appendChild(li);
    const sp=li.querySelector('span'),em=li.querySelector('em');sndSquelch();
    for(const ch of it.t){if(!live())return;sp.textContent+=ch;await sleep(26)}
    sp.classList.remove('cur');
    if(it.c){em.textContent='· · ·';em.className='run';await sleep(650);if(!live())return;
      const [txt,cls]=typeof it.c==='function'?it.c():[it.c,'ok'];em.textContent=txt;em.className=cls;sndRoger();k++;$('#atcBar').style.width=(k/nChk*100)+'%'}
    else sndSquelch(0,.1);
    if(it.fin){await sleep(900);if(!live())return;log.innerHTML='';$('#atcClr').hidden=false;$('#atcSt').textContent='· 이륙 허가';atcDone=true;sndTakeoff();setTimeout(()=>{if(live())atcSpeak(''+CALLSIGN+', 이륙을 허가합니다. 안전 운행하십시오.')},1300);return}
    await sleep(it.c?350:550)}
}
function atcSkip(){atcRun++;$('#atcLog').innerHTML='';
  $('#atcBar').style.width='100%';$('#atcClr').hidden=false;$('#atcSt').textContent='· 이륙 허가';atcDone=true}

// 관제탑 속도 주의: 50·100·120·150·180·200km/h에 처음 도달하면 빨간 글자로 경고(5km/h 아래로 내려가면 다시 경고 가능)
const SPD_ALL=[50,60,80,100,110,120,130,150,180];
let SPD_MARKS=(store.get('spdMarks',[120,150])||[]).filter(n=>SPD_ALL.includes(n)).sort((a,b)=>a-b),spdArmed=new Set(SPD_MARKS);let atcWarnT=0;
function setSpdMarks(a){SPD_MARKS=[...new Set(a)].filter(n=>SPD_ALL.includes(n)).sort((x,y)=>x-y);store.set('spdMarks',SPD_MARKS);spdArmed=new Set(SPD_MARKS);renderSpdMarks()}
function renderSpdMarks(){const box=$('#sSpdMarks');if(!box)return;box.innerHTML='';SPD_ALL.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='pill'+(SPD_MARKS.includes(n)?' on':'');b.textContent=n+'km';b.setAttribute('aria-pressed',String(SPD_MARKS.includes(n)));b.onclick=()=>setSpdMarks(SPD_MARKS.includes(n)?SPD_MARKS.filter(x=>x!==n):[...SPD_MARKS,n]);box.appendChild(b)})}
function atcSpeedTick(v,sim){if(!isCk()||(!sim&&(!gpsOn||!gs.fix)))return;let hit=0;
  for(const m of SPD_MARKS){if(v>=m&&spdArmed.has(m)){spdArmed.delete(m);hit=m}else if(v<m-5)spdArmed.add(m)}
  if(hit)atcWarn(hit)}
function atcWarn(m){const w=$('#atcWarn');w.querySelector('b').textContent='⚠ 속도 주의 · '+m+' km/h';
  w.querySelector('span').textContent=''+CALLSIGN+', 시속 '+m+'km를 넘었습니다. '+(m>=120?'즉시 감속하십시오.':'속도에 주의하십시오.');
  w.hidden=false;w.style.animation='none';void w.offsetWidth;w.style.animation='';
  $('#atcSt').textContent='· 속도 주의';sndSquelch(0,.16);sndRoger(.2);sndRoger(.42);
  clearTimeout(atcWarnT);atcWarnT=setTimeout(()=>{w.hidden=true;$('#atcSt').textContent=atcDone?'· 이륙 허가':'· 점검 중'},6000);
  slowDown(m)}
// 설정한 과속 경고 속도(기본 120·150km/h): 관제탑 "슬로우 다운" 음성 + 비행창(속도계) 전체가 빨갛게 세 번 깜빡임
function slowDown(m){const w=isTab()?(document.querySelector('#tabCk .tk-pfd')||$('#wGps')):$('#wGps');if(!w)return;
  let o=w.querySelector(':scope>.slowfx');if(!o){o=document.createElement('div');o.className='slowfx';o.setAttribute('role','alert');o.innerHTML='<b>SLOW DOWN</b><span></span>';w.appendChild(o)}
  o.querySelector('span').textContent='관제탑 · 시속 '+m+'km 초과 · 감속하십시오';
  w.classList.remove('slowing');void w.offsetWidth;w.classList.add('slowing');
  [0,.62,1.24].forEach(t=>{sndRoger(t);sndRoger(t+.16)});
  atcSpeak('슬로우 다운. 슬로우 다운. '+CALLSIGN+', 시속 '+m+'킬로미터를 넘었습니다. 감속하십시오.');
  clearTimeout(slowDown.t);slowDown.t=setTimeout(()=>w.classList.remove('slowing'),2000)}
$('#atcRun').onclick=()=>{fx();atcStart()};
renderSpdMarks();
$('#sAtcSound').checked=atcOn();$('#sAtcSound').onchange=e=>{store.set('atcSound',e.target.checked);if(!e.target.checked){try{window.speechSynthesis&&speechSynthesis.cancel()}catch(x){}}toast(e.target.checked?'관제탑 소리를 켰어요.':'관제탑 소리를 껐어요.')};
// 앱을 닫으면(최근 앱에서 밀어 닫기) 음악·GPS까지 끄기 — 기본. 켜 두면 음악은 계속
$('#sKeepPlay').checked=store.get('keepPlay',false);
function syncKeepPlay(){try{if(NB&&NB.setKeepPlaying)NB.setKeepPlaying(!!store.get('keepPlay',false))}catch(e){}}
$('#sKeepPlay').onchange=e=>{store.set('keepPlay',e.target.checked);syncKeepPlay()};syncKeepPlay();
$('#sCallRet').checked=store.get('callRet',true);
function syncCallRet(){try{if(NB&&NB.setCallReturn)NB.setCallReturn(!!store.get('callRet',true))}catch(e){}}
$('#sCallRet').onchange=e=>{store.set('callRet',e.target.checked);syncCallRet()};syncCallRet();
$('#atcSkip').onclick=atcSkip;
// 콕핏 스킨에 들어올 때마다(앱 시작 포함) 점검을 한 번 진행
let ckWasOn=false;
function cockpitSkin(){const on=isCk();if(on&&!ckWasOn){dk.refresh();setTimeout(()=>{if(isCk())atcStart()},500)}if(!on){atcRun++;dk.setGuard(false)}ckWasOn=on}
