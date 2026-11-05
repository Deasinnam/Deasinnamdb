// 내 음악 소리 연결(Web Audio)과 외부 앱(YouTube Music·Spotify) 연동
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- local audio graph ---------- */
const audio=new Audio(); audio.preload='metadata';
let ctx,src,filters=[],preGain,analyser,panner,outGain,freq,wave;
function initAudio(){
  if(ctx) return;
  ctx=new (window.AudioContext||window.webkitAudioContext)();
  src=ctx.createMediaElementSource(audio);
  preGain=ctx.createGain();
  filters=BANDS.map((f,i)=>{const b=ctx.createBiquadFilter();b.type=i===0?'lowshelf':i===9?'highshelf':'peaking';b.frequency.value=f;b.Q.value=1.2;return b});
  analyser=ctx.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=.72;
  panner=ctx.createStereoPanner();outGain=ctx.createGain();
  src.connect(preGain);let n=preGain;filters.forEach(f=>{n.connect(f);n=f});
  n.connect(analyser);analyser.connect(panner);panner.connect(outGain);outGain.connect(ctx.destination);
  freq=new Uint8Array(analyser.frequencyBinCount);wave=new Uint8Array(analyser.fftSize);
  applyEq();applyVol();
}
function applyEq(){
  pushExtEq();
  if(!ctx) return;
  const t=ctx.currentTime;
  filters.forEach((f,i)=>f.gain.setTargetAtTime(eqOn?gains[i]:0,t,.02));
  preGain.gain.setTargetAtTime(eqOn?Math.pow(10,pre/20):1,t,.02);
}
function applyVol(){
  audio.volume=1;
  if(NAT&&NB.npVolume){try{NB.npVolume((vol/100)**1.6)}catch(e){}}
  if(ctx){outGain.gain.setTargetAtTime((vol/100)**1.6,ctx.currentTime,.02);panner.pan.setTargetAtTime(bal/100,ctx.currentTime,.02)}
}

/* ---------- external apps (Android app only) ---------- */
let permState=null,ext={}, extT=0, extTimer=0, extArtV=-1, eqPushQueued=false;
const extF=new Uint8Array(512), extW=new Uint8Array(512).fill(128);
function pushExtEq(){
  if(!HAS_EXT||eqPushQueued) return; // 외부 앱 EQ와 표준 플레이어 EQ에 같은 값이 적용됩니다
  eqPushQueued=true;
  requestAnimationFrame(()=>{eqPushQueued=false;try{NB.setExtEq(JSON.stringify({on:eqOn,pre:pre,gains:gains}))}catch(e){}});
}
function pollExt(){
  if(mode!=='ext') return;
  let s;try{s=JSON.parse(NB.extStatus())}catch(e){return}
  ext=s;extT=performance.now();
  if(s.artV!==extArtV){extArtV=s.artV;let a='';try{a=NB.extArt()}catch(e){}setCover(a)}
  if(!volDrag&&typeof s.vol==='number'){volEl.value=s.vol;setP(volEl)}
  $('#xApp').textContent=s.app||'재생 중인 앱 없음';
  $('#xEq').textContent='EQ: '+(s.eq||'꺼짐');
  $('#eqSrc').textContent=s.eq?'· '+s.eq:'';
  const ns=s.notifSupported!==false;$('#rowNotif').hidden=!ns;$('#hintNotif').hidden=!ns;$('#rowSpotify').hidden=ns&&!!s.notif;
  $('#rowFull').hidden=ns;$('#hintFull').hidden=ns;
  $('#xVer').textContent=s.version?`앱 버전 ${s.version} · ${ns?'full 판':'기본판'}`:'';
  $('#xSrc').textContent='곡 정보: '+(s.notif?'알림 접근으로 모든 앱에서 받는 중':(s.spotifyRx?'Spotify 방송으로 받는 중':(ns?'알림 접근이 꺼져 있어 받을 수 없어요':'기본판이라 Spotify 방송만 받을 수 있어요(아직 수신 없음)')));
  seek.disabled=!s.seekable;
  $('#xSpRx').textContent=s.spotifyRx?'· 수신 중':'· 아직 수신 안 됨';$('#xSpRx').style.color=s.spotifyRx?'var(--led1)':'var(--led4)';
  const n=$('#xNotif');n.textContent=s.notif?'허용됨':'설정 열기';n.classList.toggle('ok',!!s.notif);n.classList.toggle('on',!s.notif);$('#xAppInfo').hidden=!!s.notif;
  const m=$('#xMic');m.textContent=s.mic?'허용됨':'허용';m.classList.toggle('ok',!!s.mic);m.classList.toggle('on',!s.mic);
  /* 필요한 권한이 모두 허용되면 권한 안내를 접어 둡니다(사용자가 다시 펼칠 수 있음). */
  const allOk=!!s.mic&&(s.notifSupported===false||!!s.notif),pb=$('#xPerm'),ps=$('#xPermSum');
  ps.textContent=allOk?'모두 허용됨':'허용이 필요해요';ps.classList.toggle('ok',allOk);
  if(allOk!==permState){permState=allOk;pb.open=!allOk}
  $('#khz').textContent=(s.rate?Math.round(s.rate/1000):44)+' kHz';
  updateMeta();state();
}
const extPos=()=>{let p=ext.pos||0;if(ext.playing)p+=performance.now()-extT;return Math.min(p,ext.dur||p)/1000};
function setMode(m,boot){if(!boot)try{store.set('lastSrc',m==='ext'?'ext':'local')}catch(e){}
  if(m==='ext'&&!HAS_EXT)m='local';
  mode=m;store.set('mode',m);
  document.querySelectorAll('#srcSeg button').forEach(b=>b.classList.toggle('on',b.dataset.src===m));
  const isExt=m==='ext';
  $('#wPl').hidden=isExt;$('#wExt').hidden=!isExt;$('#addTop').hidden=isExt;$('#bEject').hidden=isExt;
  balEl.disabled=isExt;$('#tShuf').disabled=isExt;$('#tRep').disabled=isExt;
  clearInterval(extTimer);
  if(isExt){
    audio.pause();if(NAT&&natList())N1('pause');
    if(NB&&NB.onPlayState){try{NB.onPlayState('stopped','','')}catch(e){}lastBridge='ext'}
    try{NB.setExternalMode(true)}catch(e){}
    extArtV=-1;pollExt();extTimer=setInterval(pollExt,300);pushExtEq();
    $('#kbps').textContent='--- kbps';$('#kbps').classList.remove('lit');
  }else{
    if(HAS_EXT){try{NB.setExternalMode(false)}catch(e){}}
    seek.disabled=false;
    $('#eqSrc').textContent='';volEl.value=vol;setP(volEl);
    $('#khz').textContent=(ctx?Math.round(ctx.sampleRate/1000):44)+' kHz';
  }
  updateMeta();state();
}
if(HAS_EXT){
  $('#srcSeg').hidden=false;
  document.querySelectorAll('#srcSeg button').forEach(b=>b.onclick=()=>setMode(b.dataset.src));
  document.querySelectorAll('[data-pkg]').forEach(b=>b.onclick=()=>{try{NB.openApp(b.dataset.pkg)}catch(e){}});
  $('#xNotif').onclick=()=>{try{NB.openNotificationAccess()}catch(e){}}; // 96-skin-compass-notif.js에서 단계별 안내와 함께 다시 정함$('#xAppInfo').onclick=()=>{try{NB.openAppInfo()}catch(e){toast('설정 → 애플리케이션에서 이 앱을 찾아 주세요.')}};
  $('#xMic').onclick=()=>{try{NB.requestMic()}catch(e){}};
  $('#xFull').onclick=()=>{try{NB.openUrl('https://github.com/Deasinnam/Deasinnamdb/releases/download/latest/DaesinnamAmp-full.apk')}catch(e){}};
}

function setCover(u){const c=$('#cover');c.style.backgroundImage=u?`url("${u}")`:'';c.classList.toggle('empty',!u)}
