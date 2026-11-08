/* 자동 생성 파일 — 고치지 마세요. 원본: web/src/*.js, 묶기: node tools/build-web.cjs */
(()=>{
/* ===== 00-core.js ===== */
// 공통: 도우미($·store), 앱 연결(NB), 스킨·배치
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
const $=s=>document.querySelector(s);
const NB=window.__AmpNB||window.AndroidBridge||null;
/* 갤럭시 Z 폴드8 전용판(보라색은 앱 아이콘·실행 화면만, 앱 안 색은 일반판과 같음): 앱이 알려 주거나, 미리보기에서는 주소에 ?fold8 */
const IS_FOLD=(()=>{try{if(NB&&NB.buildDevice&&NB.buildDevice()==='fold8')return true}catch(e){}return /[?&#]fold8\b/.test(location.href)})();
if(IS_FOLD)document.documentElement.dataset.fold='1';
const HAS_EXT=!!(NB&&NB.extStatus);
const BANDS=[60,170,310,600,1000,3000,6000,12000,14000,16000];
const LBL=['60','170','310','600','1K','3K','6K','12K','14K','16K'];
const PRESETS={
  'Flat':[0,0,0,0,0,0,0,0,0,0],
  'Rock':[5,3,-3,-5,-2,2,5,6,6,6],
  'Pop':[-1,3,5,5,3,0,-1,-1,-1,-1],
  'Dance':[7,5,2,0,0,-3,-4,-4,0,0],
  'Bass Boost':[8,7,5,2,0,0,0,0,0,0],
  'Vocal':[-3,-2,0,3,5,5,3,1,0,-2],
  'Classical':[0,0,0,0,0,0,-5,-5,-5,-7],
  'Treble Boost':[-2,-2,-1,0,1,3,6,8,9,9],
  'Live':[-3,0,3,4,4,4,3,2,2,2]
};
const SKINS=[['blue','대신남 블루'],['amber','클래식 앰버'],['base','베이스 그린'],['neon','네온 시티'],['ice','아이스 크롬'],['red','레드 라인'],['wood','우드 하이파이'],['carnival','대신남 자동차 모드'],['carnival5','대신남 자동차 모드 · 콕핏'],['carnival4','대신남 자동차 모드 · 콕핏 그레이'],['carnival6','대신남 자동차 모드 · 콕핏 스페셜'],['carnival7','대신남 자동차 모드 · 콕핏 스페셜 2'],['tablet','대신남 태블릿 가로모드'],['tablet2','대신남 태블릿 가로모드 2']];
const CAR_SKINS=['carnival','carnival2','carnival3','carnival4','carnival5','carnival6','carnival7','drive','tablet','tablet2'];const isTab=()=>skin==='tablet'||skin==='tablet2';const isCk2=()=>skin==='carnival3'||skin==='carnival4'||skin==='carnival5'||skin==='carnival6'||skin==='carnival7';/* 원형 계기 색: 콕핏 스페셜 2는 황동 베젤·황동 나사·짙은 올리브 판 */
const DIAL=()=>document.documentElement.hasAttribute('data-cp')?{pl:['#2f3424','#12150d'],bz:['#f3d99c','#9a7638','#2e2210'],sc:['#fbe7b5','#7a5a2c'],ink:'#efe6cf'}:{pl:['#3a4236','#151a14'],bz:['#6b7468','#22281f','#0b0e0a'],sc:['#d9dee3','#4c535b'],ink:'#e7e9df'};
const isCks=()=>skin==='carnival6'||skin==='carnival7';const isCp=()=>skin==='carnival2'||isCk2();const isCk=()=>isCp()||isTab();const isCar=()=>CAR_SKINS.includes(skin);
const store={get(k,d){try{const v=localStorage.getItem('dna_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('dna_'+k,JSON.stringify(v))}catch(e){}}};

let gains=store.get('gains',PRESETS.Flat.slice()), pre=store.get('pre',0), eqOn=store.get('eqOn',true);
let vol=store.get('vol',80), bal=store.get('bal',0), shuffle=store.get('shuf',false), repeat=store.get('rep','all'), visMode=store.get('vis',0);
let skin=store.get('skin2',IS_FOLD?'carnival7':'carnival5'), layoutMode=store.get('layout','auto'), mode=HAS_EXT?store.get('mode','local'):'local'; // 처음 설치: 콕핏 2(전체 보기·콕핏 PFD·아날로그 시계)
// 1.18: 스킨 정리 — 콕핏·콕핏 2는 콕핏(예전 콕핏 수정판)으로, 드라이브는 자동차 모드로
{const M={carnival2:'carnival5',carnival3:'carnival5',drive:'carnival'};if(M[skin]){skin=M[skin];store.set('skin2',skin);window.__skinNote=skin}}store.set('ckrSwitched',true);
let list=[], cur=-1, showRemain=false, seeking=false, volDrag=false, wake=null;

/* ---------- skin & layout ---------- */
let C={};
function readSkin(){const cs=getComputedStyle(document.documentElement);const g=k=>cs.getPropertyValue(k).trim();
  C={bg:g('--lcd')||'#000',text:g('--lcd-text'),glow:g('--lcd-glow'),l1:g('--led1'),l2:g('--led2'),l3:g('--led3'),l4:g('--led4'),peak:g('--peak'),off:g('--led-off'),grid:g('--grid'),dim:g('--lcd-dim'),fg:g('--lcd-fg'),edge:g('--lcd-edge'),cp:g('--copper')||'#e0803a',cphi:g('--copper-hi')||'#ffb27a',cplo:g('--hot-c')||'#8a4316'}}
function setSkin(k){setSkin0(k);try{pwrApply()}catch(e){}}
function setSkin0(k){if(!SKINS.some(s=>s[0]===k))k='blue';skin=k;document.documentElement.dataset.skin=(k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')?'carnival2':k;if(k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')document.documentElement.dataset.ck2='1';else delete document.documentElement.dataset.ck2;if(k==='carnival4'||k==='carnival6')document.documentElement.dataset.ck3='1';else delete document.documentElement.dataset.ck3;if(k==='carnival6'||k==='carnival7')document.documentElement.dataset.cks='1';else delete document.documentElement.dataset.cks;if(k==='carnival7')document.documentElement.dataset.cp='1';else delete document.documentElement.dataset.cp;if(k==='carnival5'||k==='carnival7')document.documentElement.dataset.ckr='1';else delete document.documentElement.dataset.ckr;if(k==='tablet2'){document.documentElement.dataset.tk2='1';document.documentElement.dataset.skin='tablet'}else delete document.documentElement.dataset.tk2;if(CAR_SKINS.includes(k))document.documentElement.dataset.car='1';else delete document.documentElement.dataset.car;const nm=k==='carnival'?'Daesinnam Car Mode':(k==='carnival2'||k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')?'Daesinnam One':'Daesinnam Amp';document.querySelector('.brand').setAttribute('aria-label',nm);$('#mainTitle').textContent=nm;if(typeof layout==='function'&&appEl)layout();if(typeof gpsSkinChanged==='function')gpsSkinChanged();if(typeof cockpitSkin==='function')cockpitSkin();try{applySizes()}catch(e){}if(typeof ckFocus==='function')ckFocus((k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')?store.get('ckFocus','all'):'all',true);store.set('skin2',k);$('#skin').value=k;readSkin();drawCurve()}
SKINS.forEach(([k,n])=>{const o=document.createElement('option');o.value=k;o.textContent=n;$('#skin').appendChild(o)});
$('#skin').onchange=e=>{const k=e.target.value;setSkin(k);if((k==='carnival2'||k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')&&typeof setGStyle==='function')setGStyle('cockpit')};
const appEl=$('#app');
function layout(){const w=window.innerWidth;let n=layoutMode==='auto'?(w>=1500?3:w>=900?2:1):+layoutMode;appEl.classList.remove('L2','L3');if(n>1)appEl.classList.add('L'+n);appEl.classList.toggle('G',isCar());appEl.classList.toggle('K',isCp());if(typeof applyWinOrder==='function')try{applyWinOrder()}catch(e){}}
$('#layout').value=layoutMode;$('#layout').onchange=e=>{layoutMode=e.target.value;store.set('layout',layoutMode);layout()};
window.addEventListener('resize',layout);
/* ===== 10-audio-ext.js ===== */
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
  if(s.artV!==extArtV){extArtV=s.artV;let a='';try{a=NB.extArt()}catch(e){}setCover(a)}extBrand(s);
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

function setCover(u){const c=$('#cover');c.style.backgroundImage=u?`url("${u}")`:'';c.classList.toggle('empty',!u);if(u||mode!=='ext')delete c.dataset.brand}
/* 외부 앱 곡에 앨범 그림이 안 들어오면 어느 앱인지 글자로 표시(상표 로고는 쓰지 않음) */
const EXT_BRAND={'com.google.android.apps.youtube.music':['ytm','YouTube Music'],'com.spotify.music':['spotify','Spotify']};
function extBrand(s){const c=$('#cover');if(mode!=='ext'||!c.classList.contains('empty')){delete c.dataset.brand;return}
  let b=EXT_BRAND[s&&s.pkg];if(!b&&s&&s.app){const a=String(s.app);b=/youtube/i.test(a)?EXT_BRAND['com.google.android.apps.youtube.music']:/spotify/i.test(a)?EXT_BRAND['com.spotify.music']:null}
  if(b){c.dataset.brand=b[0];c.dataset.label=b[1]}else if(s&&s.app){c.dataset.brand='app';c.dataset.label=String(s.app)}else delete c.dataset.brand}
/* ===== 20-player.js ===== */
// 플레이어: 표시 형식, 데모 곡, 재생목록, 재생 버튼, 안드로이드 표준 플레이어
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- formatting ---------- */
const fmt=s=>{if(!isFinite(s)||s<0)s=0;s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
const lcdFmt=s=>{if(!isFinite(s)||s<0)s=0;s=Math.floor(s);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
const setP=el=>{const mn=+el.min,mx=+el.max;el.style.setProperty('--p',((el.value-mn)/(mx-mn)*100)+'%')};

/* ---------- demo track (synthesized) ---------- */
async function renderDemo(){
  const sr=44100,bpm=112,b=60/bpm,bars=16,dur=bars*4*b+2;
  const oc=new OfflineAudioContext(2,Math.ceil(sr*dur),sr);
  const master=oc.createGain();master.gain.value=.6;
  const comp=oc.createDynamicsCompressor();master.connect(comp);comp.connect(oc.destination);
  const delay=oc.createDelay(2);delay.delayTime.value=b*.75;const fb=oc.createGain();fb.gain.value=.32;const send=oc.createGain();send.gain.value=.3;
  send.connect(delay);delay.connect(fb);fb.connect(delay);delay.connect(master);
  const mtof=m=>440*2**((m-69)/12);
  const prog=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
  const nb=oc.createBuffer(1,sr*.3,sr);const nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
  const kick=t=>{const o=oc.createOscillator(),g=oc.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);g.gain.setValueAtTime(.95,t);g.gain.exponentialRampToValueAtTime(.001,t+.38);o.connect(g);g.connect(master);o.start(t);o.stop(t+.4)};
  const noise=(t,len,hp,amp,bp)=>{const s=oc.createBufferSource();s.buffer=nb;const f=oc.createBiquadFilter();f.type=bp?'bandpass':'highpass';f.frequency.value=hp;const g=oc.createGain();g.gain.setValueAtTime(amp,t);g.gain.exponentialRampToValueAtTime(.001,t+len);s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+len+.01)};
  const snare=t=>{noise(t,.18,1800,.35,true);const o=oc.createOscillator(),g=oc.createGain();o.frequency.value=190;g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(g);g.connect(master);o.start(t);o.stop(t+.12)};
  const bass=(m,t,l)=>{const o=oc.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);const f=oc.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(180,t+l);const g=oc.createGain();g.gain.setValueAtTime(.32,t);g.gain.exponentialRampToValueAtTime(.001,t+l);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+l+.02)};
  let pan=-1;
  const pluck=(m,t)=>{const o=oc.createOscillator();o.type='square';o.frequency.value=mtof(m);const f=oc.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(3500,t);f.frequency.exponentialRampToValueAtTime(500,t+.2);const g=oc.createGain();g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);const p=oc.createStereoPanner();p.pan.value=(pan=-pan)*.5;o.connect(f);f.connect(g);g.connect(p);p.connect(master);p.connect(send);o.start(t);o.stop(t+.25)};
  for(let bar=0;bar<bars;bar++){
    const ch=prog[Math.floor(bar/2)%4],t0=bar*4*b;
    if(bar%2===0) ch.forEach(m=>[-9,9].forEach(dt=>{const o=oc.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=dt;const f=oc.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(500,t0);f.frequency.linearRampToValueAtTime(2200,t0+4*b);f.frequency.linearRampToValueAtTime(700,t0+8*b);const g=oc.createGain();g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.045,t0+.5);g.gain.setValueAtTime(.045,t0+8*b-.4);g.gain.linearRampToValueAtTime(0,t0+8*b);o.connect(f);f.connect(g);g.connect(master);g.connect(send);o.start(t0);o.stop(t0+8*b+.05)}));
    for(let bt=0;bt<4;bt++){const t=t0+bt*b;
      if(bar>=2&&bar<15) kick(t);
      if(bar>=1) noise(t+b/2,.06,7000,.16);
      if(bar>=4){noise(t+b/4,.03,9000,.06);noise(t+3*b/4,.03,9000,.06)}
      if(bar>=4&&bar<15&&(bt===1||bt===3)) snare(t);
      if(bar>=2&&bar<15) for(let e=0;e<2;e++) bass(ch[0]-24+(e&&bt===3?12:0),t+e*b/2,b/2*.9);
    }
    if(bar>=6) for(let s=0;s<16;s++){const nn=[ch[0],ch[1],ch[2],ch[0]+12];pluck(nn[(s*3)%4]+12,t0+s*b/4)}
  }
  return oc.startRendering();
}
function toWav(buf){
  const ch=buf.numberOfChannels,len=buf.length,sr=buf.sampleRate,ab=new ArrayBuffer(44+len*ch*2),v=new DataView(ab);let p=0;
  const ws=s=>{for(const c of s)v.setUint8(p++,c.charCodeAt(0))},u32=x=>{v.setUint32(p,x,true);p+=4},u16=x=>{v.setUint16(p,x,true);p+=2};
  ws('RIFF');u32(36+len*ch*2);ws('WAVE');ws('fmt ');u32(16);u16(1);u16(ch);u32(sr);u32(sr*ch*2);u16(ch*2);u16(16);ws('data');u32(len*ch*2);
  const d=[...Array(ch)].map((_,i)=>buf.getChannelData(i));
  for(let i=0;i<len;i++)for(let c=0;c<ch;c++){const s=Math.max(-1,Math.min(1,d[c][i]));v.setInt16(p,s<0?s*32768:s*32767,true);p+=2}
  return new Blob([ab],{type:'audio/wav'});
}
function demoArt(){
  const c=document.createElement('canvas');c.width=c.height=320;const g=c.getContext('2d');
  const sky=g.createLinearGradient(0,0,0,320);sky.addColorStop(0,'#03050c');sky.addColorStop(.55,'#0c1d55');sky.addColorStop(.78,'#2f5bff');sky.addColorStop(1,'#03050c');
  g.fillStyle=sky;g.fillRect(0,0,320,320);
  const sun=g.createLinearGradient(0,110,0,230);sun.addColorStop(0,'#ffffff');sun.addColorStop(1,'#7d9bff');
  g.fillStyle=sun;g.beginPath();g.arc(160,200,72,Math.PI,0);g.fill();
  g.fillStyle='#0c1d55';for(let i=0;i<6;i++)g.fillRect(80,150+i*10+i*i,160,2+i*.8);
  g.fillStyle='#0b0710';let x=0;while(x<320){const w=10+Math.random()*22,h=20+Math.random()*70;g.fillRect(x,230-h,w,h+90);x+=w+2}
  g.fillStyle='#86a3ff';for(let i=0;i<70;i++)if(Math.random()<.6)g.fillRect(Math.random()*320,170+Math.random()*60,2,2);
  g.textAlign='center';g.font='900 30px Montserrat,sans-serif';g.fillStyle='#ffffff';g.fillText('DAESINNAM',138,284);
  g.fillStyle='#2f5bff';g.fillText('AMP',262,284);
  g.font='500 11px Montserrat,sans-serif';g.fillStyle='#ffffffb0';g.fillText('M U S I C   L A B',160,304);
  return c.toDataURL('image/jpeg',.85);
}

/* ---------- playlist ---------- */
function splitName(n){const b=n.replace(/\.[^.]+$/,'').replace(/_/g,' ');const m=b.match(/^\s*(?:\d+[\s.\-_]+)?(.+?)\s+-\s+(.+)$/);return m?{artist:m[1],title:m[2]}:{artist:'',title:b.trim()}}
function addFiles(files){
  if(mode==='ext')setMode('local');
  const start=list.length;
  [...files].filter(f=>/^audio\//.test(f.type)||/\.(mp3|m4a|aac|ogg|oga|wav|flac|opus)$/i.test(f.name)).forEach(f=>{
    const it={...splitName(f.name),url:URL.createObjectURL(f),size:f.size,duration:0,art:null,file:f};
    list.push(it);
    const probe=new Audio();probe.preload='metadata';probe.src=it.url;probe.onloadedmetadata=()=>{it.duration=probe.duration;renderList();if(list[cur]===it)updateMeta()};
    if(window.jsmediatags) try{window.jsmediatags.read(f,{onSuccess:tag=>{const t=tag.tags||{};if(t.title)it.title=t.title;if(t.artist)it.artist=t.artist;if(t.picture){const p=t.picture;it.art=URL.createObjectURL(new Blob([new Uint8Array(p.data)],{type:p.format}))}renderList();if(list[cur]===it){updateMeta();lastArtSent=null;bridgeState(true)}},onError:()=>{}})}catch(e){}
  });
  renderList();
  if(list.length>start&&(cur<0||audio.paused)) playIndex(start);
}
function renderList(){
  const ul=$('#pl');ul.innerHTML='';
  if(!list.length){ul.innerHTML='<li class="empty" style="display:block;cursor:default">재생 목록이 비어 있어요.<br>“+ 추가”로 음악 파일을, “+ 폴더”로 폴더 전체를 불러오세요.</li>'}
  list.forEach((it,i)=>{
    const li=document.createElement('li');if(i===cur)li.className='cur';
    li.innerHTML=`<span class="n">${i+1}</span><span class="nm"></span><span class="d">${it.duration?fmt(it.duration):'--:--'}</span><button class="x" aria-label="목록에서 제거"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.8"/></svg></button>`;
    li.querySelector('.nm').textContent=(it.missing?'⚠ ':'')+(it.artist?it.artist+' - ':'')+it.title;
    li.onclick=e=>{if(e.target.closest('.x'))return;playIndex(i)};
    li.querySelector('.x').onclick=()=>removeAt(i);
    ul.appendChild(li);
  });
  const tot=list.reduce((a,b)=>a+(b.duration||0),0);
  $('#sum').textContent=`${list.length}곡 · ${fmt(tot)}`;
}
function removeAt(i){
  const it=list[i];
  if(natList()){const was=!!nat.playing,pos=nat.pos||0;list.splice(i,1);
    if(i===cur){cur=list.length?Math.min(i,list.length-1):-1;natSync(was&&cur>=0,cur,0)}else{if(i<cur)cur--;natSync(was,cur,pos)}
    savePlaylist();renderList();updateMeta();return}
  if(i===cur){audio.pause();audio.removeAttribute('src');audio.load();cur=-1}
  else if(i<cur)cur--;
  list.splice(i,1);if(it.file)URL.revokeObjectURL(it.url);
  savePlaylist();renderList();updateMeta();
}
function playIndex(i){
  if(i<0||i>=list.length)return;
  try{store.set('lastSrc',mode==='ext'?'ext':'local');radioStop()}catch(e){}
  if(mode==='ext')setMode('local');
  if(natList()){cur=i;N1('index',i);renderList();updateMeta();const l=$('#pl').children[i];if(l)l.scrollIntoView({block:'nearest'});return}
  initAudio();ctx.resume();
  cur=i;audio.src=list[i].url;audio.play().catch(()=>{});
  lastBridge='';renderList();updateMeta();
  const li=$('#pl').children[i];if(li)li.scrollIntoView({block:'nearest'});
}
function nextIdx(dir=1,auto=false){
  if(!list.length)return -1;
  if(shuffle&&list.length>1){let r;do r=Math.floor(Math.random()*list.length);while(r===cur);return r}
  let n=cur+dir;
  if(n>=list.length){if(auto&&repeat==='off')return -1;n=0}
  if(n<0)n=list.length-1;
  return n;
}
function setMarquee(txt){const el=$('#marqText');if(el.textContent!==txt){el.textContent=txt;$('#marq').classList.toggle('static',txt.length<26)}}
function updateMeta(){
  if(mode==='ext'){
    const has=!!ext.title;
    setMarquee(has?`${ext.artist?ext.artist+' - ':''}${ext.title}${ext.app?'  ['+ext.app+']':''}`:(ext.playing?'외부 앱에서 재생 중':(ext.notif||ext.notifSupported===false?'YouTube Music이나 Spotify에서 음악을 재생하세요':'외부 앱 연동: 아래에서 알림 접근을 허용하세요')));
    $('#npTitle').textContent=has?ext.title:'—';
    $('#npArtist').textContent=has?(ext.artist||ext.app||''):(ext.app||'');
    $('#stereo').classList.add('lit');$('#mono').classList.remove('lit');
    return;
  }
  const it=list[cur];
  setMarquee(it?`${cur+1}. ${it.artist?it.artist+' - ':''}${it.title}  (${fmt(it.duration)})`:'재생할 곡을 선택하세요');
  $('#npTitle').textContent=it?it.title:'—';
  $('#npArtist').textContent=it?(it.artist||'알 수 없는 아티스트'):'';
  setCover(it&&it.art);
  const kb=it&&it.duration?Math.round(it.size*8/it.duration/1000):0;
  $('#kbps').textContent=(kb?kb:'---')+' kbps';$('#kbps').classList.toggle('lit',!!kb);
  $('#stereo').classList.add('lit');$('#mono').classList.remove('lit');
  if('mediaSession' in navigator&&it){try{navigator.mediaSession.metadata=new MediaMetadata({title:it.title,artist:it.artist||'',album:'Daesinnam Amp',artwork:it.art?[{src:it.art,sizes:'320x320'}]:[]})}catch(e){}}
}

/* ---------- transport ---------- */
const X=(c,a)=>{try{NB.extCmd(c,a||0)}catch(e){};setTimeout(pollExt,120)};
/* ---------- 내 음악 표준 플레이어(앱): 저장된 곡은 안드로이드 표준 플레이어가 재생 ---------- */
const NAT=!!(NB&&NB.natAvailable);
let nat={connected:false},natT=0,natReady=false;
function natList(){return NAT&&list.length>0&&list.every(it=>it.lib)}
function natL(){return mode!=='ext'&&natList()}
function natPos(){let p=(nat.pos||0)/1000;if(nat.playing)p+=(performance.now()-natT)/1000;const d=(nat.dur||0)/1000;return d?Math.min(p,d):p}
function natSync(play,idx,posMs){if(!NAT)return;try{NB.npSetQueue(JSON.stringify(list.filter(it=>it.lib).map(it=>({uri:it.uri,title:it.title,artist:it.artist,album:it.album}))),Math.max(0,idx||0),posMs||0,!!play)}catch(e){}}
const N1=(c,a)=>{try{NB.npCmd(c,a||0)}catch(e){}};
// 라디오를 고른 상태(마지막 음원이 라디오)면 플레이어 버튼이 라디오를 조작: 재생/일시정지/정지/이전·다음 방송
function rdSel(){try{return store.get('lastSrc','')==='radio'&&!!(rdCur||rdPlaying)}catch(e){return false}}
function play(){if(rdSel()){if(!rdPlaying)rdResume();return}try{radioStop()}catch(e){}if(mode==='ext')return X('play');if(natL()){if(cur<0){playIndex(0);return}N1('play');return}if(cur<0&&list.length)return playIndex(0);initAudio();ctx.resume();audio.play().catch(()=>{})}
function pauseMusic(){if(mode==='ext')return X('pause');if(natL())return N1('pause');audio.pause()}
function pause(){if(rdSel())return radioStop();pauseMusic()}
function toggle(){if(rdSel())return rdPlaying?radioStop():rdResume();if(mode==='ext')return X(ext.playing?'pause':'play');if(natL()){if(cur<0)return play();return N1('toggle')}audio.paused?play():pause()}
function stop(){if(rdSel())return radioStop();if(mode==='ext')return X('stop');if(natL())return N1('stop');audio.pause();audio.currentTime=0;state()}
function next(){if(rdSel())return rdStep(1);if(mode==='ext')return X('next');if(natL())return N1('next');const n=nextIdx(1);if(n>=0)playIndex(n)}
function prev(){if(rdSel())return rdStep(-1);if(mode==='ext')return X('prev');if(natL())return N1('prev');if(audio.currentTime>3){audio.currentTime=0;return}const n=shuffle?nextIdx(1):nextIdx(-1);if(n>=0)playIndex(n)}
$('#npPrev').onclick=()=>prev();$('#npPlay').onclick=()=>toggle();$('#npNext').onclick=()=>next(); // NOW PLAYING 창의 재생 조작(라디오·외부 앱도 같은 버튼으로)
$('#bPlay').onclick=play;$('#bPause').onclick=toggle;$('#bStop').onclick=stop;$('#bNext').onclick=next;$('#bPrev').onclick=prev;
$('#bEject').onclick=()=>pickMusic(false);$('#add').onclick=()=>pickMusic(false);$('#addTop').onclick=()=>pickMusic(false);$('#addDir').onclick=()=>pickMusic(true);
$('#file').onchange=e=>{addFiles(e.target.files);e.target.value=''};
let clearArm=0;
$('#clear').onclick=()=>{
  if(performance.now()-clearArm>3000){clearArm=performance.now();$('#clear').textContent='한 번 더 누르면 비워요';setTimeout(()=>{$('#clear').textContent='비우기'},3000);return}
  clearArm=0;$('#clear').textContent='비우기';
  audio.pause();audio.removeAttribute('src');audio.load();list.forEach(it=>it.file&&URL.revokeObjectURL(it.url));list=[];cur=-1;savePlaylist();store.set('resume',null);natSync(false,0,0);renderList();updateMeta();state()};
audio.addEventListener('ended',()=>{if(repeat==='one'){audio.currentTime=0;audio.play();return}const n=nextIdx(1,true);if(n>=0)playIndex(n);else state()});
['play','pause','playing'].forEach(ev=>audio.addEventListener(ev,state));
audio.addEventListener('seeked',()=>bridgeState(true));
audio.addEventListener('loadedmetadata',()=>bridgeState(true));
let lastBridge='';
function state(){
  const nl=natL(),rs=rdSel();
  const playing=rs?rdPlaying:mode==='ext'?!!ext.playing:nl?!!nat.playing:(!audio.paused&&cur>=0);
  const paused=rs?!rdPlaying:mode==='ext'?(!ext.playing&&!!ext.title):nl?(!nat.playing&&(nat.pos||0)>0):(!playing&&audio.currentTime>0&&cur>=0);
  $('#bPlay').classList.toggle('hot',playing);$('#bPause').classList.toggle('hot',paused);
  {const n=$('#npPlay');n.classList.toggle('hot',playing);n.setAttribute('aria-label',playing?'일시정지':'재생')}
  $('#stPlay').classList.toggle('on',playing);$('#stPause').classList.toggle('on',paused);
  if(mode==='ext'||nl)return; // 표준 플레이어가 잠금 화면·알림·핸들 버튼을 직접 처리
  if('mediaSession' in navigator)navigator.mediaSession.playbackState=playing?'playing':'paused';
  if(playing&&navigator.wakeLock&&!wake){navigator.wakeLock.request('screen').then(w=>{wake=w;w.addEventListener('release',()=>wake=null)}).catch(()=>{})}
  if(!playing&&wake){wake.release().catch(()=>{});wake=null}
  bridgeState(false);
}
/* 차량 핸들·블루투스·잠금 화면 조작을 위해 앱의 미디어 세션에 곡 정보를 보냅니다. */
let lastArtSent=null;
function bridgeState(force){
  if(!NB||!NB.onPlayState||mode==='ext'||natL())return;
  const it=list[cur];const playing=!audio.paused&&cur>=0;
  const st=playing?'playing':(cur>=0&&audio.currentTime>0?'paused':'stopped');
  const key=st+'|'+cur+'|'+(it?it.title+it.artist:'');
  if(!force&&key===lastBridge)return;lastBridge=key;
  const dur=Math.round((audio.duration||(it&&it.duration)||0)*1000),pos=Math.round(audio.currentTime*1000);
  try{if(NB.onNowPlaying)NB.onNowPlaying(st,it?it.title:'',it?(it.artist||''):'',dur,pos);else NB.onPlayState(st,it?it.title:'',it?(it.artist||''):'')}catch(e){}
  if(it&&NB.onArt&&lastArtSent!==it){lastArtSent=it;sendArt(it)}
}
async function sendArt(it){
  let d='';
  try{
    if(it.artData)d=it.artData;
    else if(it.art&&it.art.startsWith('data:'))d=it.art;
    else if(it.art){const b=await (await fetch(it.art)).blob();d=await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.onerror=()=>r('');f.readAsDataURL(b)})}
    it.artData=d;
  }catch(e){}
  if(list[cur]===it){try{NB.onArt(d)}catch(e){}}
}
window.__ctl=c=>{
  if(c==='prev')prev();else if(c==='next')next();else if(c==='toggle')toggle();
  else if(c==='play')play();else if(c==='pause')pause();else if(c==='stop')stop();
  else if(c==='ff'||c==='rw'){if(mode==='ext')return;audio.currentTime=Math.max(0,Math.min((audio.duration||0)-1,audio.currentTime+(c==='ff'?15:-15)))}
  else if(c.startsWith('seek:')){if(mode==='ext')X('seek',+c.slice(5));else audio.currentTime=+c.slice(5)/1000}
};
if('mediaSession' in navigator){const ms=navigator.mediaSession;try{ms.setActionHandler('play',play);ms.setActionHandler('pause',pause);ms.setActionHandler('stop',stop);ms.setActionHandler('nexttrack',next);ms.setActionHandler('previoustrack',prev);ms.setActionHandler('seekto',d=>{audio.currentTime=d.seekTime})}catch(e){}}
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;if(e.code==='Space'){e.preventDefault();toggle()}else if(e.code==='ArrowRight')next();else if(e.code==='ArrowLeft')prev()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')state()});

const seek=$('#seek');
const curDur=()=>mode==='ext'?(ext.dur||0)/1000:natL()?((nat.dur||0)/1000||(list[cur]&&list[cur].duration)||0):(audio.duration||(list[cur]&&list[cur].duration)||0);
seek.addEventListener('input',()=>{seeking=true;setP(seek);$('#tCur').textContent=fmt(seek.value/1000*curDur())});
seek.addEventListener('change',()=>{const d=curDur();if(d){if(mode==='ext')X('seek',seek.value/1000*d*1000);else if(natL()){N1('seek',seek.value/1000*d*1000);nat.pos=seek.value/1000*d*1000;natT=performance.now()}else audio.currentTime=seek.value/1000*d}seeking=false});
$('#timebox').onclick=()=>showRemain=!showRemain;

const volEl=$('#vol'),balEl=$('#bal');volEl.value=vol;balEl.value=bal;setP(volEl);setP(balEl);
volEl.oninput=()=>{setP(volEl);if(mode==='ext'){volDrag=true;try{NB.setSystemVolume(+volEl.value)}catch(e){}return}vol=+volEl.value;applyVol();store.set('vol',vol)};
volEl.onchange=()=>{volDrag=false};
balEl.oninput=()=>{bal=Math.abs(+balEl.value)<6?0:+balEl.value;setP(balEl);applyVol();store.set('bal',bal)};
balEl.ondblclick=()=>{balEl.value=0;balEl.oninput()};
function flags(){
  if(NAT&&NB.npMode){try{NB.npMode(shuffle,repeat)}catch(e){}}
  $('#tShuf').classList.toggle('on',shuffle);$('#fShuf').classList.toggle('lit',shuffle);
  $('#tRep').classList.toggle('on',repeat!=='off');$('#fRep').classList.toggle('lit',repeat!=='off');
  $('#repTxt').textContent='반복: '+({off:'끔',all:'전체',one:'한 곡'})[repeat];
  $('#fEq').classList.toggle('lit',eqOn);
}
$('#tShuf').onclick=()=>{shuffle=!shuffle;store.set('shuf',shuffle);flags()};
$('#tRep').onclick=()=>{repeat={off:'all',all:'one',one:'off'}[repeat];store.set('rep',repeat);flags()};
document.querySelectorAll('.wbtn[data-col]').forEach(b=>b.onclick=()=>{$('#'+b.dataset.col).classList.toggle('collapsed')});

document.addEventListener('dragover',e=>{e.preventDefault();$('#pl').classList.add('drop')});
document.addEventListener('dragleave',e=>{if(e.target===document.documentElement)$('#pl').classList.remove('drop')});
document.addEventListener('drop',e=>{e.preventDefault();$('#pl').classList.remove('drop');if(e.dataTransfer.files.length)addFiles(e.dataTransfer.files)});
/* ===== 30-eq-visual.js ===== */
// EQ와 화면 그리기(음악 효과 30종, 프레임 루프)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- EQ UI ---------- */
const grid=$('#eqgrid');const eqInputs=[];
function mkBand(label,val,cls,on){
  const d=document.createElement('div');d.className='band '+(cls||'');
  d.innerHTML=`<div class="slot"><input type="range" min="-12" max="12" step="0.5" aria-label="${label} 게인"></div><span>${label}</span>`;
  const inp=d.querySelector('input'),slot=d.querySelector('.slot');inp.value=val;setP(inp);inp.oninput=()=>{setP(inp);on(+inp.value)};
  const set=v=>{v=Math.max(-12,Math.min(12,Math.round(v*2)/2));if(+inp.value!==v){inp.value=v;setP(inp);on(v)}};
  /* 손가락 위치(세로)를 바로 값으로: 위 +12dB, 아래 -12dB */
  const fromY=y=>{const r=slot.getBoundingClientRect(),pad=5,h=Math.max(1,r.height-pad*2);return 12-((y-r.top-pad)/h)*24};
  let pid=null,lastTap=0;
  slot.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;slot.setPointerCapture(pid);slot.classList.add('drag');
    const now=performance.now();if(now-lastTap<300){set(0);lastTap=0;return}lastTap=now;set(fromY(e.clientY))});
  slot.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;e.preventDefault();set(fromY(e.clientY))});
  const end=e=>{if(e.pointerId!==pid)return;pid=null;slot.classList.remove('drag')};
  slot.addEventListener('pointerup',end);slot.addEventListener('pointercancel',end);
  slot.addEventListener('touchmove',e=>e.preventDefault(),{passive:false}); // 일부 기기의 스크롤 가로채기 방지
  grid.appendChild(d);return inp;
}
const preInp=mkBand('PRE',pre,'pre',v=>{pre=v;store.set('pre',pre);applyEq();drawCurve()});
BANDS.forEach((f,i)=>eqInputs.push(mkBand(LBL[i],gains[i],'',v=>{gains[i]=v;store.set('gains',gains);$('#preset').value='';applyEq();drawCurve()})));
const presetSel=$('#preset');Object.keys(PRESETS).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;presetSel.appendChild(o)});
presetSel.onchange=()=>{const p=PRESETS[presetSel.value];if(!p)return;gains=p.slice();eqInputs.forEach((x,i)=>{x.value=gains[i];setP(x)});store.set('gains',gains);applyEq();drawCurve()};
$('#eqReset').onclick=()=>{gains=PRESETS.Flat.slice();pre=0;eqInputs.forEach(x=>{x.value=0;setP(x)});preInp.value=0;setP(preInp);presetSel.value='';store.set('gains',gains);store.set('pre',0);applyEq();drawCurve()};
const eqOnBtn=$('#eqOn');const syncOn=()=>{eqOnBtn.classList.toggle('on',eqOn);eqOnBtn.textContent=eqOn?'ON':'OFF';flags()};
eqOnBtn.onclick=()=>{eqOn=!eqOn;store.set('eqOn',eqOn);syncOn();applyEq();drawCurve()};

/* ---------- canvases ---------- */
const cv={vis:$('#vis'),mini:$('#mini'),eqled:$('#eqled'),curve:$('#curve'),gauge:$('#gauge'),tape:$('#tape')};const cx={};
function size(c){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,Math.round(r.width*d));c.height=Math.max(1,Math.round(r.height*d));cx[c.id]=c.getContext('2d')}
const ro=new ResizeObserver(es=>{es.forEach(e=>size(e.target));drawCurve()});
Object.values(cv).forEach(c=>{size(c);ro.observe(c)});

function drawCurve(){
  const c=cv.curve,g=cx.curve;if(!g||!C.text)return;const w=c.width,h=c.height;g.clearRect(0,0,w,h);
  g.strokeStyle=C.edge;g.lineWidth=1;g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();
  const pts=gains.map((v,i)=>[(i+.5)/10*w,h/2-(eqOn?v:0)/12*(h/2-3)]);
  g.strokeStyle=eqOn?C.text:C.dim;g.lineWidth=Math.max(1.5,h/18);g.shadowColor=C.text;g.shadowBlur=eqOn?6:0;
  g.beginPath();g.moveTo(0,pts[0][1]);pts.forEach((p,i)=>{if(i===0){g.lineTo(p[0],p[1]);return}const q=pts[i-1],mx=(q[0]+p[0])/2;g.bezierCurveTo(mx,q[1],mx,p[1],p[0],p[1])});g.lineTo(w,pts[9][1]);g.stroke();g.shadowBlur=0;
}

const N=48;let bars=new Float32Array(N),peaks=new Float32Array(N),pv=new Float32Array(N);
let miniB=new Float32Array(19),miniP=new Float32Array(19);
let eqLv=new Float32Array(11);
let F=null,W=null,R=44100;
const binOf=f=>Math.min(F.length-1,Math.max(1,Math.round(f/(R/2)*F.length)));
function band(lo,hi){const a=binOf(lo),b=Math.max(a,binOf(hi));let s=0,m=0;for(let i=a;i<=b;i++){s+=F[i];if(F[i]>m)m=F[i]}return((s/(b-a+1))*.55+m*.45)/255}
function computeBars(arr,count,lo,hi,live){
  for(let i=0;i<count;i++){
    let v=0;if(live){const f0=lo*(hi/lo)**(i/count),f1=lo*(hi/lo)**((i+1)/count);v=Math.pow(band(f0,f1),1.35)*(1+i/count*.35)}
    arr[i]=Math.max(v,arr[i]*.86);
  }
}
const ledColor=r=>r<.5?C.l1:r<.72?C.l2:r<.88?C.l3:C.l4;
function ledColumn(g,x,w,yb,h,v,segH,gap,peak,dim){
  const S=Math.max(1,Math.floor(h/(segH+gap))),lit=Math.round(Math.min(1,v)*S),pk=Math.round(Math.min(1,peak||0)*S);
  for(let s=0;s<S;s++){const y=yb-(s+1)*(segH+gap)+gap;
    if(s<lit){g.fillStyle=ledColor(s/S)}else if(peak!=null&&s===pk-1&&pk>0){g.fillStyle=C.peak}else{if(!dim)continue;g.fillStyle=dim}
    g.fillRect(x,y,w,segH)}
}
function pullData(){
  if(rdPlaying&&RD_NATIVE&&NB.radioFft){
    let fs='',ws='';try{fs=NB.radioFft();ws=NB.radioWave()}catch(e){}
    for(let i=0;i<extF.length;i++)extF[i]=i<fs.length?fs.charCodeAt(i)-32:0;
    for(let i=0;i<extW.length;i++)extW[i]=i<ws.length?ws.charCodeAt(i)-32:128;
    F=extF;W=extW;try{R=NB.radioRate()||44100}catch(e){R=44100}
    return fs.length>0;
  }
  if(natL()){
    let fs='',ws='';try{fs=NB.npFft();ws=NB.npWave()}catch(e){}
    for(let i=0;i<extF.length;i++)extF[i]=i<fs.length?fs.charCodeAt(i)-32:0;
    for(let i=0;i<extW.length;i++)extW[i]=i<ws.length?ws.charCodeAt(i)-32:128;
    F=extF;W=extW;R=nat.rate||44100;
    return !!nat.playing&&fs.length>0;
  }
  if(mode==='ext'){
    let fs='',ws='';try{fs=NB.extFft();ws=NB.extWave()}catch(e){}
    for(let i=0;i<extF.length;i++)extF[i]=i<fs.length?fs.charCodeAt(i)-32:0;
    for(let i=0;i<extW.length;i++)extW[i]=i<ws.length?ws.charCodeAt(i)-32:128;
    F=extF;W=extW;R=ext.rate||44100;
    return !!ext.playing&&fs.length>0;
  }
  if(!ctx){F=null;W=null;return false}
  analyser.getByteFrequencyData(freq);analyser.getByteTimeDomainData(wave);F=freq;W=wave;R=ctx.sampleRate;
  return !audio.paused&&cur>=0;
}
let idle=0,frT=0,pwrSaver=false;
// 배터리: 화면 주사율(폴드7 120Hz)마다 다 그리지 않고, 소리가 없으면 초당 4번, 재생 중엔 최대 60번(절전 모드 20번)만 그림
function frame(now){
  requestAnimationFrame(frame);now=now||performance.now();
  const busy=!audio.paused||(natL()&&nat.playing)||(mode==='ext'&&ext.playing)||rdPlaying||driveOn||gpsOn;
  const gap=pwrSaver?(busy?50:500):(busy?15.5:250);if(now-frT<gap)return;const dt=Math.min(.25,(now-frT)/1000);frT=now;
  const live=pullData();
  computeBars(bars,N,40,16000,live);computeBars(miniB,19,50,16000,live);
  for(let i=0;i<N;i++){if(bars[i]>=peaks[i]){peaks[i]=bars[i];pv[i]=0}else{pv[i]+=.0009;peaks[i]=Math.max(0,peaks[i]-pv[i])}}
  for(let i=0;i<19;i++)miniP[i]=Math.max(miniB[i],miniP[i]-.012);
  for(let i=0;i<11;i++){let v=0;if(live){if(i===0){let s=0;for(let k=0;k<W.length;k+=2){const d=(W[k]-128)/128;s+=d*d}v=Math.min(1,Math.sqrt(s/(W.length/2))*2.6)}else{const f=BANDS[i-1];v=Math.pow(band(f/1.3,f*1.3),1.25)*1.08}}eqLv[i]=Math.max(v,eqLv[i]*.88)}
  drawVis(live);drawMini();drawEqLed();drawGps();
  let d=0,t=0,has=false;
  if((rdPlaying||rdSel())&&rdCur)rdLcd();
  else if(mode==='ext'){has=!!ext.title;d=(ext.dur||0)/1000;t=extPos()}
  else if(natL()&&cur>=0){has=true;d=(nat.dur||0)/1000||list[cur].duration||0;t=natPos()}
  else if(cur>=0){has=true;d=audio.duration||list[cur].duration||0;t=audio.currentTime}
  if((rdPlaying||rdSel())&&rdCur){}
  else if(has){$('#time').textContent=showRemain&&d?'-'+lcdFmt(d-t):lcdFmt(t);
    if(!seeking){seek.value=d?t/d*1000:0;setP(seek);$('#tCur').textContent=fmt(t);$('#tDur').textContent=fmt(d)}}
  else{$('#time').textContent='00:00';if(!seeking){seek.value=0;setP(seek)}$('#tCur').textContent='0:00';$('#tDur').textContent='0:00'}
  if(driveOn)driveUi();
  idle+=busy?dt:.016;
}
// 누르거나 바꾸면 바로 다시 그림(쉬는 중에도 반응이 늦지 않게)
for(const ev of ['pointerdown','pointerup','keydown','change','input','click'])addEventListener(ev,()=>{frT=0},true);
function drawVis(live){
  const c=cv.vis,g=cx.vis,w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  if(mode==='ext'&&ext.notif!==undefined&&!ext.mic){
    g.fillStyle=C.dim;g.font=`${14*d}px "Noto Sans KR",sans-serif`;g.textAlign='center';
    g.fillText('사운드 시각화를 보려면 외부 앱 창에서 [허용]을 누르세요',w/2,h/2);return;
  }
  if(visMode===2){
    g.strokeStyle=C.grid;g.lineWidth=1;for(let i=1;i<8;i++){g.beginPath();g.moveTo(i*w/8,0);g.lineTo(i*w/8,h);g.stroke()}for(let i=1;i<4;i++){g.beginPath();g.moveTo(0,i*h/4);g.lineTo(w,i*h/4);g.stroke()}
    g.lineWidth=2.2*d;g.strokeStyle=C.l3;g.shadowColor=C.text;g.shadowBlur=12*d;g.beginPath();
    const L=live?W.length:256;for(let i=0;i<L;i+=2){const x=i/L*w;const v=live?(W[i]-128)/128:Math.sin(i/14+idle*3)*.04;const y=h/2+v*h*.45;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();g.shadowBlur=0;return;
  }

  if(visMode>=3){drawVisFx(g,w,h,d,live);return}
  const cols=w/d>1100?72:N;
  const pad=10*d,gap=Math.max(2,3*d),bw=(w-pad*2-gap*(cols-1))/cols,segH=Math.max(2,4*d),sg=Math.max(1,2*d);
  const val=i=>{const p=i/(cols-1)*(N-1),a=Math.floor(p),b=Math.min(N-1,a+1),f=p-a;return[bars[a]*(1-f)+bars[b]*f,peaks[a]*(1-f)+peaks[b]*f]};
  if(visMode===0){
    for(let i=0;i<cols;i++){const[v,p]=val(i);ledColumn(g,pad+i*(bw+gap),bw,h-pad,h-pad*2,v,segH,sg,p,C.off)}
  }else{
    const mid=h*.62;
    for(let i=0;i<cols;i++){const[v,p]=val(i);ledColumn(g,pad+i*(bw+gap),bw,mid,mid-pad,v,segH,sg,p,C.off)}
    g.save();g.globalAlpha=.28;g.translate(0,mid*2+sg);g.scale(1,-1);
    for(let i=0;i<cols;i++){const[v]=val(i);ledColumn(g,pad+i*(bw+gap),bw,mid,(h-mid)-pad/2,v*(mid-pad)/((h-mid)-pad/2)*.6,segH,sg,null,null)}
    g.restore();
  }
}

/* 시각화 효과 3~9: AREA · RING · RADAR · WAVES · DOTS · PULSE · VU METER (색은 스킨 팔레트) */
const vfx={rad:0,blips:[],pulse:[],vuL:0,vuR:0,lastBass:0};
function visLevel(lo,hi){let s=0,n=0;for(let i=Math.floor(lo*N);i<Math.ceil(hi*N);i++){s+=bars[i]||0;n++}return n?s/n:0}
function drawVisFx(g,w,h,d,live){
  const t=performance.now()/1000,cx=w/2,cy=h/2,L1=C.l1,L2=C.l2,L3=C.l3,L4=C.l4;
  const wv=i=>live&&W?(W[Math.floor(i)%W.length]-128)/128:Math.sin(i/14+idle*3)*.05;
  if(visMode===3){ // AREA: 부드러운 스펙트럼 곡선 + 그라디언트 면
    const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,L1);gr.addColorStop(.55,L3);gr.addColorStop(1,L4);
    g.beginPath();g.moveTo(0,h);for(let i=0;i<=N;i++){const v=bars[Math.min(N-1,i)];const x=i/N*w,y=h-v*h*.9-2*d;if(i===0)g.lineTo(x,y);else{const px=(i-.5)/N*w;g.quadraticCurveTo(px,h-bars[i-1]*h*.9-2*d,x,y)}}
    g.lineTo(w,h);g.closePath();g.globalAlpha=.55;g.fillStyle=gr;g.fill();g.globalAlpha=1;g.lineWidth=2*d;g.strokeStyle=L4;g.shadowColor=C.glow;g.shadowBlur=10*d;g.stroke();g.shadowBlur=0;return}
  if(visMode===4){ // RING: 원형 스펙트럼
    const r0=Math.min(w,h)*.22,rM=Math.min(w,h)*.26;g.lineCap='round';
    for(let i=0;i<N*2;i++){const k=i<N?i:N*2-1-i,v=bars[k],a=i/(N*2)*Math.PI*2-Math.PI/2+t*.15,r1=r0,r2=r0+4*d+v*rM;
      g.strokeStyle=v>.75?L4:v>.5?L3:v>.25?L2:L1;g.lineWidth=Math.max(2*d,Math.PI*2*r0/(N*2)*.55);g.beginPath();g.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);g.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);g.stroke()}
    const b=visLevel(0,.12);g.fillStyle=C.grid;g.beginPath();g.arc(cx,cy,r0*.85,0,7);g.fill();g.strokeStyle=L3;g.lineWidth=2*d;g.globalAlpha=.4+b*.6;g.beginPath();g.arc(cx,cy,r0*(.55+b*.3),0,7);g.stroke();g.globalAlpha=1;g.lineCap='butt';return}
  if(visMode===5){ // RADAR: 회전하는 레이더, 음량이 큰 대역이 점으로 남음
    const R=Math.min(w,h)*.46;vfx.rad=(vfx.rad+.035)%(Math.PI*2);
    g.strokeStyle=C.grid;g.lineWidth=1*d;for(let k=1;k<=4;k++){g.beginPath();g.arc(cx,cy,R*k/4,0,7);g.stroke()}g.beginPath();g.moveTo(cx-R,cy);g.lineTo(cx+R,cy);g.moveTo(cx,cy-R);g.lineTo(cx,cy+R);g.stroke();
    for(let k=0;k<26;k++){const a=vfx.rad-k*.03;g.globalAlpha=(1-k/26)*.35;g.strokeStyle=L3;g.lineWidth=3*d;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);g.stroke()}g.globalAlpha=1;
    if(Math.random()<.5){const i=Math.floor(Math.random()*N);if(bars[i]>.25)vfx.blips.push({a:vfx.rad,r:(1-i/N)*R*.95,life:1,v:bars[i]})}
    vfx.blips=vfx.blips.filter(b=>(b.life-=.012)>0);for(const b of vfx.blips){g.globalAlpha=b.life;g.fillStyle=b.v>.6?L4:L3;g.shadowColor=L3;g.shadowBlur=8*d;g.beginPath();g.arc(cx+Math.cos(b.a)*b.r,cy+Math.sin(b.a)*b.r,(2+b.v*4)*d,0,7);g.fill()}
    g.shadowBlur=0;g.globalAlpha=1;return}
  if(visMode===6){ // WAVES: 겹친 파형 세 줄
    const cols=[L1,L2,L3];for(let k=0;k<3;k++){g.beginPath();g.lineWidth=(1.5+k*.6)*d;g.strokeStyle=cols[k];g.globalAlpha=.45+k*.25;const off=k*37,amp=h*(.16+k*.08);
      for(let x=0;x<=w;x+=3*d){const i=x/w*512+off,y=cy+(k-1)*h*.12+wv(i)*amp*2.2+Math.sin(x/w*6+t*(1+k*.4))*h*.03;x?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}g.globalAlpha=1;return}
  if(visMode===7){ // DOTS: 점 매트릭스
    const cols=Math.max(16,Math.floor(w/(14*d))),rows=Math.max(6,Math.floor(h/(14*d))),sx=w/cols,sy=h/rows;
    for(let c=0;c<cols;c++){const v=bars[Math.floor(c/cols*N)];const lit=Math.round(v*rows);for(let r=0;r<rows;r++){const on=rows-1-r<lit,y=(r+.5)*sy,x=(c+.5)*sx,q=1-r/rows;
      g.fillStyle=on?(q>.8?L4:q>.55?L3:q>.3?L2:L1):C.off;g.beginPath();g.arc(x,y,Math.min(sx,sy)*(on?.34:.22),0,7);g.fill()}}return}
  if(visMode===8){ // PULSE: 저음에 맞춰 퍼지는 동심원
    const b=visLevel(0,.1);if(b>.45&&b-vfx.lastBass>.06||Math.random()<.02)vfx.pulse.push({r:0,a:1,c:b>.7?L4:L3});vfx.lastBass=b;
    const R=Math.hypot(w,h)/2;vfx.pulse=vfx.pulse.filter(p=>(p.r+=R*.012*(1+b),p.a-=.012)>0&&p.r<R);
    for(const p of vfx.pulse){g.globalAlpha=p.a;g.strokeStyle=p.c;g.lineWidth=(2+p.a*4)*d;g.beginPath();g.arc(cx,cy,p.r,0,7);g.stroke()}
    g.globalAlpha=1;const gr=g.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*.3);gr.addColorStop(0,L4);gr.addColorStop(.4,L3);gr.addColorStop(1,'transparent');g.globalAlpha=.25+b*.6;g.fillStyle=gr;g.beginPath();g.arc(cx,cy,Math.min(w,h)*(.12+b*.18),0,7);g.fill();g.globalAlpha=1;return}
  if(visMode>=30){drawVisFx4(g,w,h,d,live,t,wv);return}
  if(visMode>=20){drawVisFx3(g,w,h,d,live,t,wv);return}
  if(visMode>=10){drawVisFx2(g,w,h,d,live,t,wv);return}
  // 9. VU METER: 좌우 아날로그 바늘
  let l=0,r=0;if(live&&W){for(let i=0;i<W.length;i++){const v=Math.abs(W[i]-128)/128;if(i%2)r+=v*v;else l+=v*v}l=Math.min(1,Math.sqrt(l/(W.length/2))*3.2);r=Math.min(1,Math.sqrt(r/(W.length/2))*3.2)}
  vfx.vuL+=(l-vfx.vuL)*(l>vfx.vuL?.35:.08);vfx.vuR+=(r-vfx.vuR)*(r>vfx.vuR?.35:.08);
  const mw=Math.min(w/2-16*d,h*1.5),mh=mw*.62;
  [[w/4,'L',vfx.vuL],[w*3/4,'R',vfx.vuR]].forEach(([mx,lab,v])=>{const x0=mx-mw/2,y0=cy-mh/2;g.fillStyle=C.grid;g.strokeStyle=C.edge;g.lineWidth=2*d;g.beginPath();g.roundRect?g.roundRect(x0,y0,mw,mh,6*d):g.rect(x0,y0,mw,mh);g.fill();g.stroke();
    const px=mx,py=y0+mh*.95,R=mh*.78,A0=-Math.PI*.78,A1=-Math.PI*.22;
    for(let k=0;k<=10;k++){const a=A0+(A1-A0)*k/10;g.strokeStyle=k>=8?C.l4:C.fg;g.lineWidth=(k%5?1:2)*d;g.beginPath();g.moveTo(px+Math.cos(a)*R*.86,py+Math.sin(a)*R*.86);g.lineTo(px+Math.cos(a)*R,py+Math.sin(a)*R);g.stroke()}
    g.strokeStyle=C.peak;g.lineWidth=3*d;g.beginPath();g.arc(px,py,R*.93,A0+(A1-A0)*.8,A1);g.stroke();
    const a=A0+(A1-A0)*v;g.strokeStyle=L4;g.lineWidth=2*d;g.shadowColor=L3;g.shadowBlur=6*d;g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(a)*R*.95,py+Math.sin(a)*R*.95);g.stroke();g.shadowBlur=0;
    g.fillStyle=C.fg;g.font=`600 ${Math.max(10,mh*.13)}px ${RJ}`;g.textAlign='left';g.textBaseline='top';g.fillText('VU · '+lab,x0+10*d,y0+8*d)})
}
/* 시각화 효과 10~19 */
const vfx2={stars:[],hist:[],ecg:[],ecgX:0,lastB:0,beat:0};
function drawVisFx2(g,w,h,d,live,t,wv){
  const cx=w/2,cy=h/2,L1=C.l1,L2=C.l2,L3=C.l3,L4=C.l4,lv=visLevel(0,1),bass=visLevel(0,.12),col=v=>v>.75?L4:v>.5?L3:v>.25?L2:L1;
  if(visMode===10){ // CITY: 막대가 빌딩, 창문 불빛이 소리에 맞춰 켜짐
    const n=Math.max(14,Math.floor(w/(26*d))),bw=w/n;g.fillStyle=C.grid;g.fillRect(0,h-3*d,w,3*d);
    for(let i=0;i<n;i++){const k=Math.floor(i/n*N),base=.18+((i*37)%11)/30,v=Math.max(base,bars[k]),bh=v*h*.9,x=i*bw+1*d,y=h-3*d-bh;
      g.fillStyle=C.off;g.fillRect(x,y,bw-2*d,bh);g.strokeStyle=C.edge;g.lineWidth=1;g.strokeRect(x,y,bw-2*d,bh);
      const rows=Math.floor(bh/(9*d)),lit=Math.round(bars[k]*rows);for(let r=0;r<rows;r++)for(let c=0;c<2;c++){g.fillStyle=r<lit?col(r/rows):(((i+r+c)%5)?'transparent':L1);g.fillRect(x+3*d+c*(bw-2*d)/2.2,h-3*d-(r+1)*9*d+3*d,Math.max(2,(bw-2*d)/3.2),4*d)}}
    g.fillStyle=L4;g.globalAlpha=.8;g.beginPath();g.arc(w*.86,h*.18,Math.min(w,h)*.06*(1+bass*.4),0,7);g.fill();g.globalAlpha=1;return}
  if(visMode===11){ // FLAME: 아래에서 위로 타오르는 불꽃 기둥
    const n=Math.max(20,Math.floor(w/(10*d))),bw=w/n;
    for(let i=0;i<n;i++){const k=Math.floor(i/n*N),v=Math.max(.12+Math.sin(t*6+i)*.05,bars[k]),fh=v*h*.95,x=i*bw;
      const gr=g.createLinearGradient(0,h,0,h-fh);gr.addColorStop(0,L4);gr.addColorStop(.35,L3);gr.addColorStop(.7,L2);gr.addColorStop(1,'transparent');g.fillStyle=gr;
      g.beginPath();g.moveTo(x,h);g.quadraticCurveTo(x+bw*.1,h-fh*.6,x+bw/2+Math.sin(t*9+i*1.7)*bw*.6,h-fh);g.quadraticCurveTo(x+bw*.9,h-fh*.6,x+bw,h);g.fill()}return}
  if(visMode===12){ // STARS: 가운데서 날아오는 별, 소리가 크면 빨라짐
    while(vfx2.stars.length<160)vfx2.stars.push({x:(Math.random()-.5)*2,y:(Math.random()-.5)*2,z:Math.random()*1+.05});
    const sp=.006+lv*.05+bass*.03;g.fillStyle=C.off;g.globalAlpha=.25;g.fillRect(0,0,w,h);g.globalAlpha=1;
    for(const st of vfx2.stars){const pz=st.z;st.z-=sp;if(st.z<=.02){st.x=(Math.random()-.5)*2;st.y=(Math.random()-.5)*2;st.z=1;continue}
      const sx=cx+st.x/st.z*w*.25,sy=cy+st.y/st.z*h*.25,px=cx+st.x/pz*w*.25,py=cy+st.y/pz*h*.25;g.strokeStyle=col(1-st.z);g.lineWidth=(1.2+(1-st.z)*2.4)*d;g.beginPath();g.moveTo(px,py);g.lineTo(sx,sy);g.stroke()}
    g.fillStyle=L3;g.beginPath();g.arc(cx,cy,(2+bass*6)*d,0,7);g.fill();return}
  if(visMode===13){ // SPIRAL: 스펙트럼이 회전하는 나선
    const R=Math.min(w,h)*.48;g.lineCap='round';
    for(let i=0;i<N*3;i++){const k=i%N,v=bars[k],a=i*.21+t*.6,r=R*(i/(N*3))*.9+4*d;g.fillStyle=col(v);g.globalAlpha=.35+v*.65;g.beginPath();g.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.8,(1.5+v*5)*d,0,7);g.fill()}
    g.globalAlpha=1;g.lineCap='butt';return}
  if(visMode===14){ // WATERFALL: 시간에 따라 흘러내리는 스펙트럼(위가 지금)
    const n=Math.max(24,Math.floor(w/(8*d)));const row=[];for(let i=0;i<n;i++)row.push(bars[Math.floor(i/n*N)]||0);vfx2.hist.unshift(row);
    const rows=Math.max(10,Math.floor(h/(5*d)));if(vfx2.hist.length>rows)vfx2.hist.length=rows;const cw=w/n,rh=h/rows;
    for(let r=0;r<rows;r++){const R=vfx2.hist[r];for(let i=0;i<n;i++){const v=R?R[i]:0;g.fillStyle=v>.06?col(v):C.off;g.globalAlpha=R?Math.max(.15,1-r/rows):.3;g.fillRect(i*cw,r*rh,cw-1,rh-1)}}g.globalAlpha=1;return}
  if(visMode===15){ // TUNNEL: 저음에 맞춰 다가오는 사각 터널
    const k=12,ph=(t*(.4+bass*1.6))%1;g.lineWidth=2*d;
    for(let i=k;i>=0;i--){const z=(i+1-ph)/k,s=Math.pow(1-z,2)*.98+.02,ww=w*s,hh=h*s,v=bars[Math.floor((i/k)*(N-1))];g.strokeStyle=col(Math.max(v,1-z));g.globalAlpha=Math.min(1,.2+(1-z));
      g.strokeRect(cx-ww/2,cy-hh/2,ww,hh)}
    g.globalAlpha=1;g.strokeStyle=C.grid;g.lineWidth=1*d;for(const [a,b] of [[0,0],[w,0],[0,h],[w,h]]){g.beginPath();g.moveTo(cx,cy);g.lineTo(a,b);g.stroke()}return}
  if(visMode===16){ // FLOWER: 꽃잎처럼 피는 방사형 스펙트럼
    const R=Math.min(w,h)*.46,pet=8;for(let L=3;L>=1;L--){g.beginPath();for(let i=0;i<=360;i+=3){const a=i*Math.PI/180+t*.2*L,k=Math.floor((i%(360/pet))/(360/pet)*N),v=bars[k]||0,r=R*(.18+.22*L/3+v*.45*L/3)*(1+.12*Math.sin(a*pet));
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.globalAlpha=.25+L*.18;g.fillStyle=[L1,L2,L3][L-1];g.fill();g.globalAlpha=1;g.strokeStyle=L4;g.lineWidth=1*d;g.stroke()}
    g.fillStyle=L4;g.beginPath();g.arc(cx,cy,R*(.06+bass*.08),0,7);g.fill();return}
  if(visMode===17){ // BLOCKS 3D: 비스듬히 본 입체 막대
    const n=16,bw=w/(n+3),dep=bw*.45;for(let i=0;i<n;i++){const v=Math.max(.04,bars[Math.floor(i/n*N)]),bh=v*h*.78,x=bw*(i+1),y=h-8*d-bh;
      g.fillStyle=col(v);g.globalAlpha=.95;g.fillRect(x,y,bw*.8,bh);g.globalAlpha=.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+dep,y-dep);g.lineTo(x+bw*.8+dep,y-dep);g.lineTo(x+bw*.8,y);g.fill();
      g.globalAlpha=.35;g.beginPath();g.moveTo(x+bw*.8,y);g.lineTo(x+bw*.8+dep,y-dep);g.lineTo(x+bw*.8+dep,h-8*d-dep);g.lineTo(x+bw*.8,h-8*d);g.fill()}
    g.globalAlpha=1;g.strokeStyle=C.edge;g.lineWidth=1*d;g.beginPath();g.moveTo(0,h-8*d);g.lineTo(w,h-8*d);g.stroke();return}
  if(visMode===18){ // LISSAJOUS: 좌우 채널 X-Y 스코프
    g.strokeStyle=C.grid;g.lineWidth=1*d;g.beginPath();g.moveTo(cx,0);g.lineTo(cx,h);g.moveTo(0,cy);g.lineTo(w,cy);g.stroke();
    const R=Math.min(w,h)*.44;g.strokeStyle=L3;g.shadowColor=L4;g.shadowBlur=10*d;g.lineWidth=1.6*d;g.beginPath();
    for(let i=0;i<256;i++){let x,y;if(live&&W){x=(W[(i*2)%W.length]-128)/128;y=(W[(i*2+1)%W.length]-128)/128}else{const a=i/256*Math.PI*2;x=Math.sin(a*3+t)*.6;y=Math.sin(a*2)*.6}
      const px=cx+x*R*1.4,py=cy+y*R;i?g.lineTo(px,py):g.moveTo(px,py)}g.stroke();g.shadowBlur=0;return}
  // 19. ECG: 심전도처럼 흐르는 박동선, 저음이 들어오면 큰 파형
  const step=3*d;if(bass-vfx2.lastB>.08&&bass>.3)vfx2.beat=1;vfx2.lastB=bass;
  for(let k=0;k<2;k++){vfx2.ecgX=(vfx2.ecgX+step)%w;const b=vfx2.beat,ph=1-b;let y=cy+Math.sin(t*2+vfx2.ecgX/40)*2*d;
    if(b>0){y=cy-Math.sin(ph*Math.PI*3)*(h*.38)*b;vfx2.beat=Math.max(0,b-.08)}else if(Math.random()<.004)vfx2.beat=.6;vfx2.ecg[Math.floor(vfx2.ecgX/step)]=y}
  g.strokeStyle=C.grid;g.lineWidth=1;for(let x=0;x<w;x+=20*d){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let y=0;y<h;y+=20*d){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
  g.strokeStyle=L4;g.shadowColor=L3;g.shadowBlur=8*d;g.lineWidth=2*d;g.beginPath();let first=true;const head=Math.floor(vfx2.ecgX/step);
  for(let i=0;i<Math.ceil(w/step);i++){if(Math.abs(i-head)<4){first=true;continue}const y=vfx2.ecg[i];if(y==null){first=true;continue}const x=i*step;first?g.moveTo(x,y):g.lineTo(x,y);first=false}
  g.stroke();g.shadowBlur=0}
/* 시각화 효과 20~29 */
const vfx3={rain:[],balls:[],fw:[],lastB:0};
function drawVisFx3(g,w,h,d,live,t,wv){
  const cx=w/2,cy=h/2,L1=C.l1,L2=C.l2,L3=C.l3,L4=C.l4,lv=visLevel(0,1),bass=visLevel(0,.12),col=v=>v>.75?L4:v>.5?L3:v>.25?L2:L1,R=Math.min(w,h);
  if(visMode===20){ // PLASMA: 소리에 따라 커지는 빛 덩어리
    g.globalCompositeOperation='lighter';for(let k=0;k<6;k++){const v=visLevel(k/6,(k+1)/6),x=cx+Math.sin(t*(.5+k*.13)+k*2)*w*.32,y=cy+Math.cos(t*(.4+k*.11)+k)*h*.3,r=R*(.18+v*.35+.04*Math.sin(t*2+k));
      const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,[L4,L3,L2,L3,L4,L2][k]);gr.addColorStop(1,'transparent');g.globalAlpha=.35+v*.4;g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
    g.globalCompositeOperation='source-over';g.globalAlpha=1;return}
  if(visMode===21){ // HELIX: 두 가닥 나선, 가로대 길이가 소리
    const n=Math.max(24,Math.floor(w/(14*d)));for(let i=0;i<n;i++){const x=(i+.5)/n*w,ph=i*.42+t*2,a=Math.sin(ph),b=Math.sin(ph+Math.PI),v=bars[Math.floor(i/n*N)]||0,amp=h*(.18+v*.22);
      g.strokeStyle=col(v);g.globalAlpha=.35+v*.6;g.lineWidth=1.5*d;g.beginPath();g.moveTo(x,cy+a*amp);g.lineTo(x,cy+b*amp);g.stroke();g.globalAlpha=1;
      g.fillStyle=a>0?L4:L2;g.beginPath();g.arc(x,cy+a*amp,(2+Math.abs(Math.cos(ph))*2)*d,0,7);g.fill();g.fillStyle=b>0?L3:L1;g.beginPath();g.arc(x,cy+b*amp,(2+Math.abs(Math.cos(ph))*2)*d,0,7);g.fill()}return}
  if(visMode===22){ // CODE RAIN: 떨어지는 숫자 줄기
    const cw=12*d,cols=Math.floor(w/cw);while(vfx3.rain.length<cols)vfx3.rain.push({y:Math.random()*h,s:.6+Math.random()});g.font=`600 ${11*d}px "Share Tech Mono",monospace`;g.textAlign='center';
    for(let i=0;i<cols;i++){const r=vfx3.rain[i],v=bars[Math.floor(i/cols*N)]||0;r.y+=(1.6+v*7+lv*3)*d*r.s;if(r.y>h+60*d){r.y=-Math.random()*h*.5;r.s=.6+Math.random()}
      for(let k=0;k<8;k++){const y=r.y-k*13*d;if(y<0||y>h)continue;g.globalAlpha=(1-k/8)*(.35+v*.65);g.fillStyle=k===0?L4:col(v*.8+.1);g.fillText(String.fromCharCode(48+((i*7+k*3+Math.floor(t*6))%42)),i*cw+cw/2,y)}}
    g.globalAlpha=1;return}
  if(visMode===23){ // SUNBURST: 회전하는 빛살
    const n=36,r0=R*.1;g.save();g.translate(cx,cy);g.rotate(t*.25);for(let i=0;i<n;i++){const v=bars[Math.floor(i/n*N)]||0,a=i/n*Math.PI*2,r1=r0+R*(.12+v*.42);g.fillStyle=col(v);g.globalAlpha=.4+v*.6;
      g.beginPath();g.moveTo(Math.cos(a-.05)*r0,Math.sin(a-.05)*r0);g.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);g.lineTo(Math.cos(a+.05)*r0,Math.sin(a+.05)*r0);g.fill()}g.restore();g.globalAlpha=1;
    g.fillStyle=L4;g.beginPath();g.arc(cx,cy,r0*(.8+bass*.5),0,7);g.fill();return}
  if(visMode===24){ // MOUNTAINS: 겹겹이 산등성이
    for(let L=0;L<4;L++){const base=h*(.45+L*.15),ofs=t*(8+L*10)*d;g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=6*d){const k=Math.floor(((x+ofs)/w*N*1.5)%N),v=bars[Math.abs(k)]||0;
        g.lineTo(x,base-(Math.sin((x+ofs)/(60*d)+L)*.5+.5)*h*.12-v*h*(.3-L*.05))}g.lineTo(w,h);g.closePath();g.fillStyle=[L1,L2,L3,L4][3-L];g.globalAlpha=.35+L*.18;g.fill()}g.globalAlpha=1;return}
  if(visMode===25){ // KALEIDO: 거울 조각 8개
    g.save();g.translate(cx,cy);for(let k=0;k<8;k++){g.save();g.rotate(k*Math.PI/4+t*.15);if(k%2)g.scale(1,-1);
      for(let i=0;i<12;i++){const v=bars[Math.floor(i/12*N)]||0,rr=R*(.08+i*.035),a=.2+Math.sin(t+i)*.1;g.fillStyle=col(v);g.globalAlpha=.25+v*.6;g.beginPath();g.arc(Math.cos(a)*rr,Math.sin(a)*rr,(2+v*8)*d,0,7);g.fill()}g.restore()}
    g.restore();g.globalAlpha=1;return}
  if(visMode===26){ // BOUNCE: 대역마다 공이 튀어 오름
    const n=12;while(vfx3.balls.length<n)vfx3.balls.push({y:0,v:0});const bw=w/n,fl=h-6*d;g.fillStyle=C.grid;g.fillRect(0,fl,w,2*d);
    for(let i=0;i<n;i++){const b=vfx3.balls[i],e=visLevel(i/n,(i+1)/n);if(b.y<=0&&(e>.3||Math.random()<.01))b.v=(6+e*16+Math.random()*2)*d;b.v-=.55*d;b.y=Math.max(0,b.y+b.v);if(b.y===0)b.v=0;
      const x=(i+.5)*bw,r=Math.min(bw*.3,14*d);g.fillStyle=col(Math.min(1,b.y/(h*.6)+e*.4));g.beginPath();g.arc(x,fl-r-b.y,r,0,7);g.fill();g.globalAlpha=.25;g.beginPath();g.ellipse(x,fl,r*(1-Math.min(.7,b.y/h)),r*.25,0,0,7);g.fill();g.globalAlpha=1}return}
  if(visMode===27){ // GRID WARP: 파형으로 일렁이는 격자
    g.strokeStyle=L2;g.lineWidth=1*d;const st=22*d;for(let y=st/2;y<h;y+=st){g.beginPath();for(let x=0;x<=w;x+=8*d){const yy=y+wv(x/w*512+y)*h*.18+Math.sin(x/(50*d)+t*2+y)*3*d;x?g.lineTo(x,yy):g.moveTo(x,yy)}g.globalAlpha=.6;g.stroke()}
    g.strokeStyle=L3;for(let x=st/2;x<w;x+=st){g.beginPath();for(let y=0;y<=h;y+=8*d){const xx=x+wv(y/h*512+x)*w*.06+Math.cos(y/(50*d)+t*2)*3*d;y?g.lineTo(xx,y):g.moveTo(xx,y)}g.globalAlpha=.45;g.stroke()}g.globalAlpha=1;return}
  if(visMode===28){ // FIREWORKS: 저음이 들어오면 터짐
    if((bass-vfx3.lastB>.08&&bass>.3)||Math.random()<.025){const x=w*(.15+Math.random()*.7),y=h*(.15+Math.random()*.45),c0=[L2,L3,L4][Math.floor(Math.random()*3)];for(let k=0;k<36;k++){const a=k/36*Math.PI*2,sp=(1.5+Math.random()*2.5)*d*(1+bass);vfx3.fw.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:1,c:c0})}}
    vfx3.lastB=bass;vfx3.fw=vfx3.fw.filter(p=>(p.l-=.016)>0).slice(-700);for(const p of vfx3.fw){p.x+=p.vx;p.y+=p.vy;p.vy+=.04*d;p.vx*=.985;g.globalAlpha=p.l;g.fillStyle=p.c;g.fillRect(p.x,p.y,2.2*d,2.2*d)}g.globalAlpha=1;return}
  // 29. ORBIT: 대역마다 행성이 다른 궤도를 돎
  g.fillStyle=L4;g.beginPath();g.arc(cx,cy,R*(.05+bass*.06),0,7);g.fill();
  for(let i=0;i<8;i++){const v=visLevel(i/8,(i+1)/8),rr=R*(.1+i*.05),a=t*(1.2-i*.12)+i;g.strokeStyle=C.grid;g.lineWidth=1;g.beginPath();g.ellipse(cx,cy,rr*1.4,rr*.9,0,0,7);g.stroke();
    g.fillStyle=col(v);g.beginPath();g.arc(cx+Math.cos(a)*rr*1.4,cy+Math.sin(a)*rr*.9,(2.5+v*7)*d,0,7);g.fill()}}
/* 시각화 효과 30~39 */
const vfx4={ridge:[],bub:[],rip:[],sw:[],lastB:0};
function drawVisFx4(g,w,h,d,live,t,wv){
  const cx=w/2,cy=h/2,L1=C.l1,L2=C.l2,L3=C.l3,L4=C.l4,lv=visLevel(0,1),bass=visLevel(0,.12),col=v=>v>.75?L4:v>.5?L3:v>.25?L2:L1,R=Math.min(w,h);
  if(visMode===30){ // FAN: 아래 가운데서 부채꼴로 펼쳐지는 막대
    const n=40,r0=R*.12,oy=h-4*d;for(let i=0;i<n;i++){const v=bars[Math.floor(i/n*N)]||0,a=Math.PI+(i+.5)/n*Math.PI,r1=r0+v*(Math.min(h*.92,w*.48)-r0);
      g.strokeStyle=col(v);g.lineWidth=Math.max(2*d,Math.PI*r0/n*1.4);g.lineCap='round';g.beginPath();g.moveTo(cx+Math.cos(a)*r0,oy+Math.sin(a)*r0);g.lineTo(cx+Math.cos(a)*r1,oy+Math.sin(a)*r1);g.stroke()}
    g.lineCap='butt';g.fillStyle=L4;g.beginPath();g.arc(cx,oy,r0*(.6+bass*.4),Math.PI,0);g.fill();return}
  if(visMode===31){ // RIDGES: 지나간 스펙트럼이 겹겹이 쌓인 능선
    const rows=24;vfx4.ridge.unshift(Array.from({length:48},(_,i)=>bars[Math.floor(i/48*N)]||0));vfx4.ridge.length=Math.min(vfx4.ridge.length,rows);
    for(let r=vfx4.ridge.length-1;r>=0;r--){const row=vfx4.ridge[r],base=h*.96-r*(h*.72/rows),sc=1-r/rows*.45,x0=cx-w*.45*sc,ww=w*.9*sc;
      g.beginPath();g.moveTo(x0,base);row.forEach((v,i)=>{const mid=1-Math.abs(i/47-.5)*2;g.lineTo(x0+i/47*ww,base-v*h*.42*sc*(.35+mid*.65))});g.lineTo(x0+ww,base);
      g.fillStyle=C.bg||'#000';g.fill();g.strokeStyle=r?col(.2+.6*(1-r/rows)):L4;g.lineWidth=(r?1.2:2)*d;g.globalAlpha=1-r/rows*.7;g.stroke()}g.globalAlpha=1;return}
  if(visMode===32){ // BUBBLES: 대역마다 거품이 떠오름
    if(vfx4.bub.length<140)for(let k=0;k<3;k++){const b=Math.floor(Math.random()*N),v=bars[b]||0;if(v>.2||Math.random()<.05)vfx4.bub.push({x:(b+.5)/N*w,y:h+10*d,r:(3+v*14)*d,s:(.8+v*2.5)*d,c:col(v),p:Math.random()*6})}
    vfx4.bub=vfx4.bub.filter(b=>(b.y-=b.s*(1+lv))>-30*d);for(const b of vfx4.bub){const x=b.x+Math.sin(t*2+b.p)*6*d;g.strokeStyle=b.c;g.lineWidth=1.5*d;g.globalAlpha=.75;g.beginPath();g.arc(x,b.y,b.r,0,7);g.stroke();
      g.globalAlpha=.35;g.fillStyle=b.c;g.beginPath();g.arc(x-b.r*.35,b.y-b.r*.35,b.r*.25,0,7);g.fill()}g.globalAlpha=1;return}
  if(visMode===33){ // LASER: 아래에서 쏘아 올리는 레이저 빔
    g.globalCompositeOperation='lighter';const n=14;for(let i=0;i<n;i++){const v=visLevel(i/n,(i+1)/n),a=-Math.PI/2+Math.sin(t*(.6+i*.07)+i)*.9,len=h*(.25+v*1.1);
      g.strokeStyle=col(v);g.globalAlpha=.25+v*.6;g.lineWidth=(1+v*3)*d;g.shadowColor=col(v);g.shadowBlur=12*d;g.beginPath();g.moveTo(cx,h);g.lineTo(cx+Math.cos(a)*len,h+Math.sin(a)*len);g.stroke()}
    g.shadowBlur=0;g.globalCompositeOperation='source-over';g.globalAlpha=1;g.fillStyle=L4;g.beginPath();g.arc(cx,h,R*(.04+bass*.05),Math.PI,0);g.fill();return}
  if(visMode===34){ // HONEYCOMB: 벌집 칸이 소리에 따라 밝아짐
    const s=Math.max(14*d,R/9),hh=s*Math.sqrt(3);let k=0;for(let y=-hh/2,row=0;y<h+hh;y+=hh/2,row++)for(let x=(row%2)*s*1.5;x<w+s*2;x+=s*3,k++){
      const v=bars[(k*7)%N]||0;g.beginPath();for(let j=0;j<6;j++){const a=j*Math.PI/3;g.lineTo(x+Math.cos(a)*s*.92,y+Math.sin(a)*s*.92)}g.closePath();
      g.globalAlpha=.08+v*.85;g.fillStyle=col(v);g.fill();g.globalAlpha=.4;g.strokeStyle=C.grid;g.lineWidth=1;g.stroke()}g.globalAlpha=1;return}
  if(visMode===35){ // POLAR: 원을 따라 감긴 파형
    for(let k=0;k<3;k++){const r0=R*(.22+k*.08+bass*.05);g.strokeStyle=[L4,L3,L2][k];g.globalAlpha=1-k*.28;g.lineWidth=(2-k*.4)*d;g.beginPath();
      for(let i=0;i<=180;i++){const a=i/180*Math.PI*2+t*(k%2?-.3:.3),r=r0+wv(i*2.8+k*40)*R*.22;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}g.globalAlpha=1;return}
  if(visMode===36){ // TILES: 격자 타일이 대역별로 깜빡임
    const cols=16,rows=Math.max(4,Math.round(cols*h/w)),tw=w/cols,th=h/rows;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const v=bars[Math.floor(x/cols*N)]||0,on=(rows-y)/rows<=v+.02;
      g.globalAlpha=on?.5+v*.5:.06;g.fillStyle=on?col((rows-y)/rows):L1;g.fillRect(x*tw+1.5*d,y*th+1.5*d,tw-3*d,th-3*d)}g.globalAlpha=1;return}
  if(visMode===37){ // SWARM: 저음이 오면 퍼졌다 모이는 입자 떼
    while(vfx4.sw.length<220)vfx4.sw.push({a:Math.random()*7,r:Math.random(),s:.3+Math.random()*.9});const kick=Math.max(0,bass-vfx4.lastB)*6;vfx4.lastB=bass;
    for(const p of vfx4.sw){p.a+=.01*p.s*(1+lv*3);p.r+=(.25+bass*.7-p.r)*.04+kick*(Math.random()-.3)*.3;p.r=Math.max(.05,Math.min(1.2,p.r));const x=cx+Math.cos(p.a)*p.r*R*.62+Math.sin(t*3+p.s*9)*4*d,y=cy+Math.sin(p.a)*p.r*R*.42+Math.cos(t*2.6+p.s*7)*4*d;
      g.fillStyle=col(Math.min(1,p.r));g.globalAlpha=.4+p.s*.5;g.fillRect(x,y,2*d,2*d)}g.globalAlpha=1;return}
  if(visMode===38){ // RIPPLES: 물결이 소리에 맞춰 퍼짐
    if((bass-vfx4.lastB>.05&&bass>.25)||Math.random()<.04+lv*.08)vfx4.rip.push({x:Math.random()*w,y:Math.random()*h,r:0,v:.6+lv,c:col(.4+lv*.6)});vfx4.lastB=bass;
    vfx4.rip=vfx4.rip.filter(o=>(o.r+=(1.4+o.v*2)*d)<R*.6).slice(-40);for(const o of vfx4.rip){const a=1-o.r/(R*.6);g.strokeStyle=o.c;g.globalAlpha=a*.85;g.lineWidth=2*d*a+.5;
      g.beginPath();g.ellipse(o.x,o.y,o.r,o.r*.55,0,0,7);g.stroke();g.globalAlpha=a*.4;g.beginPath();g.ellipse(o.x,o.y,o.r*.6,o.r*.33,0,0,7);g.stroke()}g.globalAlpha=1;return}
  // 39. SYNTHWAVE: 지는 해와 다가오는 격자 길, 스펙트럼 스카이라인
  const hz=h*.58,sr=R*.26;const sg=g.createLinearGradient(0,hz-sr,0,hz);sg.addColorStop(0,L4);sg.addColorStop(1,L2);g.fillStyle=sg;g.save();g.beginPath();g.arc(cx,hz,sr*(.9+bass*.15),Math.PI,0);g.clip();
  g.fillRect(cx-sr*1.2,hz-sr*1.3,sr*2.4,sr*1.3);g.globalCompositeOperation='destination-out';for(let k=0;k<6;k++){const yy=hz-sr*(.1+k*.13);g.fillRect(cx-sr*1.2,yy,sr*2.4,(1.5+k*.6)*d)}g.globalCompositeOperation='source-over';g.restore();
  const n=48,bw=w/n;for(let i=0;i<n;i++){const v=bars[Math.floor(Math.abs(i-n/2)/(n/2)*(N-1))]||0;g.fillStyle=col(v);g.globalAlpha=.85;g.fillRect(i*bw+1,hz-v*h*.3,bw-2,v*h*.3)}g.globalAlpha=1;
  g.strokeStyle=L3;g.lineWidth=1*d;g.globalAlpha=.7;g.beginPath();g.moveTo(0,hz);g.lineTo(w,hz);g.stroke();
  for(let i=-12;i<=12;i++){g.beginPath();g.moveTo(cx+i*w*.02,hz);g.lineTo(cx+i*w*.16,h);g.stroke()}
  const sp=(t*(.6+lv*1.5))%1;for(let k=0;k<8;k++){const f=(k+sp)/8,y=hz+(h-hz)*f*f;g.globalAlpha=.25+f*.6;g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}g.globalAlpha=1}
function drawMini(){
  const c=cv.mini,g=cx.mini,w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  const n=19,gap=Math.max(1,2*d),bw=(w-gap*(n-1))/n;
  for(let i=0;i<n;i++)ledColumn(g,i*(bw+gap),bw,h,h,miniB[i],Math.max(2,2*d),Math.max(1,1*d),miniP[i],C.off);
}
function drawEqLed(){
  const c=cv.eqled,g=cx.eqled,w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  const cw=w/11,bw=Math.min(cw*.32,14*d);
  for(let i=0;i<11;i++){const x=i*cw+cw/2-bw/2;ledColumn(g,x,bw,h-4*d,h-8*d,eqLv[i],Math.max(3,5*d),Math.max(1,2*d),null,C.off)}
  g.fillStyle=C.edge;g.fillRect(cw*.12,h/2,w-cw*.24,1);
}
/* 효과 40개 + 즐겨찾기(★): ★를 누르면 등록/해제, 즐겨찾기가 2개 이상이고 [★만]을 켜면 ◀ ▶·화면 탭이 즐겨찾기 안에서만 넘어감 */
const VIS_NAMES=['SPECTRUM','MIRROR','SCOPE','AREA','RING','RADAR','WAVES','DOTS','PULSE','VU METER','CITY','FLAME','STARS','SPIRAL','WATERFALL','TUNNEL','FLOWER','BLOCKS 3D','LISSAJOUS','ECG',
  'PLASMA','HELIX','CODE RAIN','SUNBURST','MOUNTAINS','KALEIDO','BOUNCE','GRID WARP','FIREWORKS','ORBIT','FAN','RIDGES','BUBBLES','LASER','HONEYCOMB','POLAR','TILES','SWARM','RIPPLES','SYNTHWAVE'];
const VIS_N=VIS_NAMES.length;if(!(visMode>=0&&visMode<VIS_N))visMode=0;
let visFav=(()=>{const a=store.get('visFav',[]);return Array.isArray(a)?[...new Set(a.filter(i=>i>=0&&i<VIS_N))]:[]})(),visFavOnly=store.get('visFavOnly',true);
const visNum=i=>String(i+1).padStart(2,'0');
function visBuild(){const sel=$('#visSel');sel.innerHTML='';
  if(visFav.length){const og=document.createElement('optgroup');og.label='★ 즐겨찾기';visFav.slice().sort((a,b)=>a-b).forEach(i=>og.append(new Option('★ '+VIS_NAMES[i],String(i))));sel.append(og)}
  const og=document.createElement('optgroup');og.label='전체 효과 '+VIS_N+'개';VIS_NAMES.forEach((n,i)=>og.append(new Option(visNum(i)+' '+n+(visFav.includes(i)?' ★':''),String(i))));sel.append(og)}
const syncVis=()=>{$('#visSel').value=String(visMode);const f=visFav.includes(visMode),b=$('#visFav'),o=$('#visFavOnly');
  if(b){b.textContent=f?'★':'☆';b.classList.toggle('on',f);b.setAttribute('aria-pressed',String(f));b.title=f?'즐겨찾기에서 빼기':'즐겨찾기에 등록'}
  if(o){o.hidden=visFav.length<2;o.classList.toggle('on',visFavOnly);o.setAttribute('aria-pressed',String(visFavOnly))}};
const setVis=m=>{visMode=((m%VIS_N)+VIS_N)%VIS_N;store.set('vis',visMode);syncVis()};
function visStep(dir){if(visFavOnly&&visFav.length>=2){const f=visFav.slice().sort((a,b)=>a-b);let k=f.indexOf(visMode);
    if(k<0){k=dir>0?f.findIndex(i=>i>visMode):f.length-1-f.slice().reverse().findIndex(i=>i<visMode);if(k<0||k>=f.length)k=dir>0?0:f.length-1;setVis(f[k]);return}
    setVis(f[(k+dir+f.length)%f.length]);return}
  setVis(visMode+dir)}
function visFavToggle(){const i=visFav.indexOf(visMode);if(i>=0)visFav.splice(i,1);else visFav.push(visMode);store.set('visFav',visFav);visBuild();syncVis();
  try{toast(i>=0?VIS_NAMES[visMode]+' 즐겨찾기에서 뺐어요':'★ '+VIS_NAMES[visMode]+' 즐겨찾기에 등록했어요')}catch(e){}}
{const vm=document.querySelector('#wVis .vmode');if(vm&&!$('#visFav')){const fb=document.createElement('button');fb.type='button';fb.className='vfav';fb.id='visFav';fb.textContent='☆';
  const ob=document.createElement('button');ob.type='button';ob.className='vfavonly';ob.id='visFavOnly';ob.textContent='★만';ob.title='즐겨찾기만 넘기기';vm.append(fb,ob);
  fb.onclick=e=>{e.stopPropagation();visFavToggle()};ob.onclick=e=>{e.stopPropagation();visFavOnly=!visFavOnly;store.set('visFavOnly',visFavOnly);syncVis()}}}
visBuild();syncVis();
$('#visSel').onchange=e=>setVis(+e.target.value);$('#visSel').onclick=e=>e.stopPropagation();
document.querySelectorAll('.vmode .vstep').forEach(b=>b.onclick=e=>{e.stopPropagation();visStep(+b.dataset.d)});
cv.vis.onclick=()=>visStep(1);
window.AmpVis={level:()=>visLevel(0,1),names:VIS_NAMES,set:setVis,fav:()=>visFav.slice(),toggleFav:visFavToggle};
/* ===== 40-gps-speedo.js ===== */
// GPS 속도계, 속도계 디자인, 콕핏 PFD(센서·구름·밤하늘)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- GPS 속도계 (자동차 스킨) ---------- */
const HAS_GPS=!!(NB&&NB.gpsStatus);
let gpsOn=false,gs={},gpsTimer=0,lastFix=null,spdNow=0,spdDisp=0,hdgNow=-1,hdgDisp=0,hudOn=false;
let trip=store.get('trip',{dist:0,time:0,max:0}),gLimit=+store.get('gLimit',0);
const DIRS=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const DIRK={N:'북',NE:'북동',E:'동',SE:'남동',S:'남',SW:'남서',W:'서',NW:'북서'};
const dirName=d=>DIRS[Math.round(((d%360)+360)%360/22.5)%16];
function hav(a,b,c,d){const R=6371000,t=Math.PI/180,x=(c-a)*t,y=(d-b)*t;const h=Math.sin(x/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function gpsStart(){if(!HAS_GPS)return;try{NB.startGps()}catch(e){}gpsOn=true;store.set('gpsOn',true);clearInterval(gpsTimer);gpsTimer=setInterval(pollGps,250);gpsUi()}
function gpsStop(user){if(HAS_GPS){try{NB.stopGps()}catch(e){}}gpsOn=false;if(user)store.set('gpsOn',false);clearInterval(gpsTimer);spdNow=0;gpsUi()}
function gpsSkinChanged(){const ckOpt=$('#gStyle option[value="cockpit"]');if(ckOpt){ckOpt.hidden=ckOpt.disabled=!isCp()}try{if(isCp())setGStyle(store.get('gStyleCk','cockpit'));else if(gStyle==='cockpit')setGStyle(store.get('gStyleCar','carbon'))}catch(e){/* 시작 중에는 아래 boot에서 처리 */}if(isCar()){if(store.get('gpsOn',false)&&!gpsOn)gpsStart()}else if(gpsOn)gpsStop(false);if(hudOn&&!isCar())hud(false);if(typeof mapSkinChanged==='function')mapSkinChanged()}
function pollGps(){
  if(!gpsOn)return;let s;try{s=JSON.parse(NB.gpsStatus())}catch(e){return}gs=s;
  if(s.fix){
    let v=s.speed;
    if(lastFix&&s.ts!==lastFix.ts){
      const dt=(s.ts-lastFix.ts)/1000,dd=hav(lastFix.lat,lastFix.lon,s.lat,s.lon);
      if(v<0&&dt>0)v=dd/dt;
      if(dt>0&&dt<10&&s.acc<35&&v>0.8){trip.dist+=dd;trip.time+=dt}
      if(s.acc<35&&v*3.6>trip.max&&v*3.6<400)trip.max=v*3.6;
      store.set('trip',trip);
    }
    if(!lastFix||s.ts!==lastFix.ts)lastFix=s;
    spdNow=v>0.5?v*3.6:0;
    hdgNow=(s.bearing>=0&&v>2.5)?s.bearing:(s.azimuth>=0?s.azimuth:hdgNow);
  }else{spdNow=0;hdgNow=s.azimuth>=0?s.azimuth:hdgNow}
  if(typeof att!=='undefined'&&att.on&&att.hdg>=0)hdgNow=att.hdg;
  try{if(s.fix)revAutoTick(s,spdNow/3.6)}catch(e){}
  gpsUi();mapUpdate(false);driveAutoTick();
}
function gpsUi(){
  $('#gOn').textContent=gpsOn?'GPS 끄기':'GPS 켜기';$('#gOn').classList.toggle('on',!gpsOn);
  const avg=trip.time>0?trip.dist/trip.time*3.6:0;
  $('#gMax').innerHTML=Math.round(trip.max)+'<i>km/h</i>';$('#gAvg').innerHTML=Math.round(avg)+'<i>km/h</i>';
  $('#gDist').innerHTML=(trip.dist/1000).toFixed(trip.dist<100000?1:0)+'<i>km</i>';
  const t=Math.round(trip.time);$('#gTime').textContent=Math.floor(t/3600)+':'+String(Math.floor(t%3600/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
  $('#gAlt').innerHTML=(gs.fix&&gs.alt>-9000?Math.round(gs.alt):'-')+'<i>m</i>';
  $('#gAcc').innerHTML=gs.fix?`±${Math.round(gs.acc)}<i>m · ${gs.satsUsed||0}/${gs.satsSeen||0}</i>`:`-<i>${gs.satsSeen?gs.satsUsed+'/'+gs.satsSeen:''}</i>`;
  const m=$('#gMsg');let msg='',btn='';
  if(!HAS_GPS)msg='GPS 속도계는 Android 앱에서 동작해요. 웹 버전에서는 표시만 볼 수 있어요.';
  else if(!gpsOn)msg='GPS 켜기를 누르면 실시간 속도와 진행 방향이 표시돼요. 위치는 화면 표시에만 쓰고 저장하거나 보내지 않아요.';
  else if(gs.perm===false){msg='위치 권한이 필요해요.';btn='<button class="pill on" id="gPerm">권한 허용</button>'}
  else if(gs.enabled===false){msg='휴대폰의 위치(GPS)가 꺼져 있어요.';btn='<button class="pill on" id="gLoc">위치 설정 열기</button>'}
  else if(!gs.fix)msg=`GPS 신호를 찾는 중이에요${gs.satsSeen?` · 위성 ${gs.satsSeen}개 보임`:''}. 하늘이 트인 곳에서 더 빨리 잡혀요.`;
  else msg=gs.provider==='gps'?'':'네트워크 위치를 쓰는 중이라 속도가 부정확할 수 있어요.';
  if(m.dataset.k!==msg+btn){m.dataset.k=msg+btn;m.innerHTML='';m.append(msg);if(btn){m.insertAdjacentHTML('beforeend',btn);const p=$('#gPerm'),l=$('#gLoc');if(p)p.onclick=()=>{try{NB.startGps()}catch(e){}};if(l)l.onclick=()=>{try{NB.openLocationSettings()}catch(e){}}}}
  $('#gSrc').textContent=gpsOn&&gs.fix?'· GPS 수신':'';
}
function hud(on){hudOn=on;$('#hud').hidden=!on;if(NB&&NB.keepScreenOn){try{NB.keepScreenOn(on)}catch(e){}}if(on&&navigator.wakeLock){navigator.wakeLock.request('screen').catch(()=>{})}}
$('#gOn').onclick=()=>gpsOn?gpsStop(true):gpsStart();
$('#gReset').onclick=()=>{trip={dist:0,time:0,max:0};store.set('trip',trip);gpsUi()};
$('#gHudBtn').onclick=()=>hud(true);
$('#hudClose').onclick=()=>hud(false);
$('#hudMir').onclick=()=>{const m=$('#hud').classList.toggle('mirror');store.set('hudMirror',m)};
$('#hud').classList.toggle('mirror',store.get('hudMirror',true));
$('#gLimit').value=String(gLimit);$('#gLimit').onchange=e=>{gLimit=+e.target.value;store.set('gLimit',gLimit)};
const angDiff=(a,b)=>((b-a+540)%360)-180;
function drawGps(){
  const gv=isCar()&&!$('#wGps').classList.contains('collapsed')&&!document.hidden;attWant(gv&&isCk()); // 자세·나침반 센서는 콕핏·태블릿 스킨에서만
  if(!gv)return;
  attPoll();if(att.on&&att.hdg>=0)hdgNow=att.hdg;
  if(typeof atcSpeedTick==='function')atcSpeedTick(spdNow);
  const AP=window.AmpPfd;if(isCk()&&(isTab()?!window.__tkGauge:gStyle==='cockpit')&&AP&&AP.ready){spdDisp=spdNow;if(hdgNow>=0)hdgDisp=hdgNow;AP.feed();return}
  spdDisp+=(spdNow-spdDisp)*.18;if(Math.abs(spdNow-spdDisp)<.05)spdDisp=spdNow;
  if(hdgNow>=0)hdgDisp=(hdgDisp+angDiff(hdgDisp,hdgNow)*.15+360)%360;
  const hasFix=gpsOn&&gs.fix,over=gLimit>0&&spdDisp>gLimit;
  const sp=hasFix?String(Math.round(spdDisp)):'--';
  $('#gSpd').textContent=sp;$('#wGps').classList.toggle('over',over);
  const hd=hdgNow>=0?`${String(Math.round(hdgDisp)%360).padStart(3,'0')}° ${dirName(hdgDisp)}`:'---° --';$('#gHdg').textContent=hd;
  if(hudOn){$('#hSpd').textContent=sp;$('#hHdg').textContent=hdgNow>=0?(DIRK[dirName(hdgDisp)]||dirName(hdgDisp))+' '+Math.round(hdgDisp)+'°':'';$('#hud').classList.toggle('over',over)}
  drawGauge(over);drawTape();
}
/* ----- 속도계 그리기: 디자인 5종 ----- */
const GMAX=200,GA0=Math.PI*.75,GA1=Math.PI*2.25;
const gA=v=>GA0+(GA1-GA0)*Math.max(0,Math.min(1,v/GMAX));
let gStyle=store.get('gStyle','carbon');
function setGStyle(k){if(!['carbon','neon','classic','minimal','tactical','cockpit','walk'].includes(k))k='carbon';if(k==='cockpit'&&!isCp())k=store.get('gStyleCar','carbon');if(isCp())store.set('gStyleCk',k);else if(k!=='cockpit')store.set('gStyleCar',k);{const gb=$('#gStyleBar');if(gb)gb.value=k}setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}try{if(appEl.classList.contains('FX'))ckFocus(store.get('ckFocus','all'),true)}catch(e){}window.dispatchEvent(new Event('resize'))},60);gStyle=k;$('#wGps').dataset.gs=k;if(k!=='cockpit'){const b=$('#spdBox');b.style.left='';b.style.width=''}$('#gStyle').value=k;store.set('gStyle',k)}
$('#gStyle').onchange=e=>setGStyle(e.target.value);$('#gStyleBar').onchange=e=>setGStyle(e.target.value);
const RJ='Rajdhani,"Barlow Condensed",sans-serif';
function ring(g,x,y,r,lw,col){g.lineWidth=lw;g.strokeStyle=col;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke()}
function tick(g,x,y,a,r1,r2,lw,col){g.lineWidth=lw;g.strokeStyle=col;g.beginPath();g.moveTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);g.lineTo(x+Math.cos(a)*r2,y+Math.sin(a)*r2);g.stroke()}
function label(g,x,y,a,r,txt,font,col){g.font=font;g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,x+Math.cos(a)*r,y+Math.sin(a)*r)}
function wedge(g,x,y,r1,r2,a1,a2){g.beginPath();g.arc(x,y,r2,a1,a2);g.arc(x,y,r1,a2,a1,true);g.closePath()}
function needle(g,x,y,a,r1,r2,w,col,glow){g.save();g.translate(x,y);g.rotate(a);g.shadowColor=glow||col;g.shadowBlur=glow?12:4;g.fillStyle=col;g.beginPath();g.moveTo(r1,-w);g.lineTo(r2,-w*.25);g.lineTo(r2+w*.6,0);g.lineTo(r2,w*.25);g.lineTo(r1,w);g.closePath();g.fill();g.restore()}
function drawGauge(over){
  const c=cv.gauge,g=cx.gauge;if(!g)return;const w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  const v=spdDisp,RED='#ff3b30',box=$('#spdBox'),dial=$('#dial');
  if(gStyle==='cockpit'){drawPFD(g,w,h,d,v,over,box,dial);return}
  if(gStyle==='walk')return; // 뚜벅이 모드는 47-walk.js가 따로 그림
  box.style.left='';box.style.width='';
  if(gStyle==='minimal'){
    dial.style.setProperty('--g',(Math.min(h,w*.5)/d)+'px');box.style.top=(h*.34/d)+'px';
    const x1=w*.06,x2=w*.94,y=h*.66,bh=h*.085,N=34,gw=(x2-x1)/N;
    for(let i=0;i<N;i++){const on=(i+.5)/N*GMAX<=v;g.fillStyle=on?(over?RED:C.cp):'#24252a';g.shadowBlur=on?12*d:0;g.shadowColor=over?RED:C.cp;g.fillRect(x1+i*gw+1*d,y,gw-2*d,bh)}
    g.shadowBlur=0;
    for(let t=0;t<=GMAX;t+=5){const x=x1+(x2-x1)*t/GMAX,maj=t%20===0,mid=t%10===0;g.fillStyle='#d6d2cc';g.globalAlpha=maj?.9:mid?.55:.3;g.fillRect(x-(maj?1:.5)*d,y+bh+5*d,(maj?2:1)*d,(maj?12:mid?8:5)*d)}
    g.globalAlpha=1;g.font=`600 ${h*.065}px ${RJ}`;g.fillStyle='#d6d2cc';g.textAlign='center';g.textBaseline='top';
    for(let t=0;t<=GMAX;t+=20)g.fillText(t,x1+(x2-x1)*t/GMAX,y+bh+20*d);
    return;
  }
  const full=gStyle==='classic'||gStyle==='tactical',r=Math.min(w*.46,full?h/2.16:h/1.82),x0=w/2,y0=full?h/2:h/2+r*.14;
  dial.style.setProperty('--g',(r*2/d)+'px');
  box.style.top=((gStyle==='classic'?y0+r*.47:y0+r*.02)/d)+'px';
  if(gStyle==='carbon'){
    const N=36,seg=(GA1-GA0)/N;
    for(let i=0;i<N;i++){const on=(i+.5)/N*GMAX<=v,a1=GA0+i*seg+seg*.08,a2=GA0+(i+1)*seg-seg*.08;
      wedge(g,x0,y0,r*.83,r*.99,a1,a2);
      if(on){const gr=g.createRadialGradient(x0,y0,r*.83,x0,y0,r);gr.addColorStop(0,over?'#a01810':C.cplo);gr.addColorStop(1,over?RED:C.cphi);g.fillStyle=gr;g.shadowBlur=14*d;g.shadowColor=over?RED:C.cp}
      else{const gr=g.createRadialGradient(x0,y0,r*.83,x0,y0,r);gr.addColorStop(0,'#1c1d20');gr.addColorStop(1,'#3d3f44');g.fillStyle=gr;g.shadowBlur=0}
      g.fill();g.shadowBlur=0;g.lineWidth=1*d;g.strokeStyle=on?'#ffd2a866':'#5a5d6366';g.stroke()}
    for(let t=0;t<=GMAX;t+=5){const a=gA(t),maj=t%20===0,mid=t%10===0;tick(g,x0,y0,a,r*(maj?.69:mid?.73:.76),r*.79,(maj?3:1.2)*d,maj?'#f2f2f2':'#bfc2c7'+(mid?'':'99'))}
    for(let t=0;t<=GMAX;t+=20)label(g,x0,y0,gA(t),r*.6,t,`600 ${r*.09}px ${RJ}`,'#e6e6e6');
    g.save();g.translate(x0,y0);g.beginPath();for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4;g.lineTo(Math.cos(a)*r*.47,Math.sin(a)*r*.47)}g.closePath();
    g.fillStyle='#0d0d0f';g.fill();g.lineWidth=1.5*d;g.globalAlpha=.55;g.strokeStyle=C.cp;g.stroke();g.globalAlpha=1;g.restore();
    tick(g,x0,y0,gA(GMAX),r*.83,r*1.02,3*d,C.cp);
  }else if(gStyle==='neon'){
    g.shadowColor=C.cp;g.shadowBlur=10*d;g.globalAlpha=.6;ring(g,x0,y0,r*1.0,1.2*d,C.cp);g.globalAlpha=1;g.shadowBlur=0;ring(g,x0,y0,r*.965,1*d,'#ffffff1a');
    const steps=Math.round(v/GMAX*120);
    for(let i=0;i<steps;i++){const a=GA0+(GA1-GA0)*i/120,t=i/120;g.shadowBlur=10*d;g.shadowColor=over?RED:C.cp;g.globalAlpha=.55+t*.45;tick(g,x0,y0,a,r*.8,r*.93,2.6*d,over?RED:(t>.7?C.cphi:C.cp))}
    g.globalAlpha=1;
    g.shadowBlur=0;
    for(let t=0;t<=GMAX;t+=2){const a=gA(t),maj=t%20===0,mid=t%10===0;tick(g,x0,y0,a,r*(maj?.8:mid?.85:.88),r*.95,(maj?3.2:mid?1.6:1)*d,maj?'#ffffff':mid?'#ffffffaa':'#ffffff44')}
    for(let t=0;t<=GMAX;t+=20)label(g,x0,y0,gA(t),r*.7,t,`600 ${r*.085}px ${RJ}`,'#f1ece6');
    g.fillStyle='#ffffff40';for(let k=0;k<72;k++){const a=k/72*Math.PI*2;g.beginPath();g.arc(x0+Math.cos(a)*r*.56,y0+Math.sin(a)*r*.56,1.1*d,0,Math.PI*2);g.fill()}
    ring(g,x0,y0,r*.5,1*d,'#ffffff12');
    g.shadowBlur=16*d;g.shadowColor=over?RED:C.cp;tick(g,x0,y0,gA(v),r*.62,r*.97,4*d,over?RED:C.cphi);g.shadowBlur=0;
  }else if(gStyle==='classic'){
    let gr=g.createLinearGradient(0,y0-r,0,y0+r);gr.addColorStop(0,'#f2b57e');gr.addColorStop(.5,'#8a4a1e');gr.addColorStop(1,'#d9884a');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*1.04,0,Math.PI*2);g.fill();
    gr=g.createLinearGradient(0,y0-r,0,y0+r);gr.addColorStop(0,'#f6f3ee');gr.addColorStop(.5,'#8d8a85');gr.addColorStop(1,'#e2ded8');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*.985,0,Math.PI*2);g.fill();
    gr=g.createRadialGradient(x0,y0-r*.2,r*.1,x0,y0,r*.95);gr.addColorStop(0,'#fbf6ea');gr.addColorStop(.75,'#ece2cc');gr.addColorStop(1,'#cbbd9f');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*.95,0,Math.PI*2);g.fill();
    for(let t=0;t<=GMAX;t+=2){const a=gA(t),maj=t%20===0,mid=t%10===0;tick(g,x0,y0,a,r*(maj?.76:mid?.8:.84),r*.9,(maj?3.4:mid?2:1)*d,maj?'#b4471a':'#3a2a1c')}
    for(let t=0;t<=GMAX;t+=20)label(g,x0,y0,gA(t),r*.64,t,`700 ${r*.11}px ${RJ}`,'#2e2318');
    needle(g,x0,y0,gA(v),-r*.12,r*.84,r*.035,over?RED:'#d4501c');
    gr=g.createRadialGradient(x0-r*.03,y0-r*.03,1,x0,y0,r*.11);gr.addColorStop(0,'#ffffff');gr.addColorStop(.5,'#9a958e');gr.addColorStop(1,'#2a2420');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*.11,0,Math.PI*2);g.fill();ring(g,x0,y0,r*.11,2*d,'#1a1410');
  }else{ // tactical
    let gr=g.createLinearGradient(0,y0-r,0,y0+r);gr.addColorStop(0,'#4a5045');gr.addColorStop(.5,'#1d201b');gr.addColorStop(1,'#3a3f35');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*1.06,0,Math.PI*2);g.fill();
    for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4,px=x0+Math.cos(a)*r*1.0,py=y0+Math.sin(a)*r*1.0;const rg=g.createRadialGradient(px-1,py-1,0,px,py,r*.03);rg.addColorStop(0,'#9aa092');rg.addColorStop(1,'#1a1c17');g.fillStyle=rg;g.beginPath();g.arc(px,py,r*.026,0,Math.PI*2);g.fill()}
    gr=g.createRadialGradient(x0,y0,0,x0,y0,r*.93);gr.addColorStop(0,'#0e1a0e');gr.addColorStop(1,'#050905');g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*.93,0,Math.PI*2);g.fill();
    g.strokeStyle='#3cff5a22';g.lineWidth=1*d;g.beginPath();g.moveTo(x0-r*.85,y0);g.lineTo(x0+r*.85,y0);g.moveTo(x0,y0-r*.85);g.lineTo(x0,y0+r*.85);g.stroke();ring(g,x0,y0,r*.42,1*d,'#3cff5a22');
    for(let t=0;t<=GMAX;t+=2){const a=gA(t),maj=t%20===0,mid=t%10===0,on=t<=v;
      g.shadowBlur=on?8*d:0;g.shadowColor=over?RED:'#3cff5a';
      tick(g,x0,y0,a,r*(maj?.72:mid?.78:.82),r*.9,(maj?3:mid?2:1.4)*d,on?(over?RED:(t/GMAX<.6?'#3cff5a':'#b8ff3c')):(maj?'#9dff8a':'#2e5a2e'))}
    g.shadowBlur=0;
    for(let t=0;t<=GMAX;t+=20)label(g,x0,y0,gA(t),r*.6,t,`600 ${r*.085}px ${RJ}`,'#d8ffd0');
    g.shadowBlur=12*d;g.shadowColor='#ffb43a';tick(g,x0,y0,gA(v),r*.48,r*.92,4*d,over?RED:'#ffc23a');g.shadowBlur=0;
  }
}
/* 콕핏 PFD: 왼쪽 속도 테이프 · 가운데 자세계(선회하면 기울고 가속하면 기수가 듦) · 오른쪽 고도 테이프 */
/* ----- 콕핏 PFD: 나침반·기울기 센서, 구름, 밤하늘 ----- */
const att={ok:false,u:null,ref:store.get('attRef',null),acc:[],bank:0,pitch:0,hdg:-1,web:null,t:0,on:false};
window.__att=att;
const HAS_ATT=!!(NB&&NB.attitude);
function attWant(on){if(on===att.on)return;att.on=on;if(HAS_ATT){try{on?NB.attStart():NB.attStop()}catch(e){}}else if(on)webOrient()}
function webOrient(){if(webOrient.done)return;webOrient.done=true;const h=e=>{if(e.beta==null)return;att.web={a:e.alpha||0,b:e.beta,g:e.gamma||0,abs:!!e.absolute||e.webkitCompassHeading!=null,ch:e.webkitCompassHeading,t:performance.now()}};
  addEventListener('deviceorientationabsolute',h);addEventListener('deviceorientation',h)}
// W3C 기기 방향 → 회전 행렬(기기→지구, 안드로이드와 같은 형식)
function eulerR(al,be,ga){const r=Math.PI/180,cX=Math.cos(be*r),cY=Math.cos(ga*r),cZ=Math.cos(al*r),sX=Math.sin(be*r),sY=Math.sin(ga*r),sZ=Math.sin(al*r);
  return [cZ*cY-sZ*sX*sY,-cX*sZ,cY*sZ*sX+cZ*sY, cY*sZ+cZ*sX*sY,cZ*cX,sZ*sY-cZ*cY*sX, -cX*sY,sX,cX*cY]}
const SCR=[[[1,0,0],[0,1,0]],[[0,1,0],[-1,0,0]],[[-1,0,0],[0,-1,0]],[[0,-1,0],[1,0,0]]]; // 화면 회전별 [오른쪽, 위] 축
const v3={dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l]}};
const DEG=180/Math.PI;
function attPoll(){
  const now=performance.now();if(now-att.t<30)return;att.t=now;
  let R=null,srot=0,decl=0,compass=false;
  if(HAS_ATT){try{const o=JSON.parse(NB.attitude());if(o.ok&&o.r&&o.r.length===9){R=o.r;srot=(o.srot|0)&3;decl=+o.decl||0;compass=!!o.compass}}catch(e){}}
  else if(att.web&&now-att.web.t<2000){const w=att.web;R=eulerR(w.a,w.b,w.g);srot=((Math.round(((screen.orientation&&screen.orientation.angle)||window.orientation||0)/90)%4)+4)%4;compass=w.abs}
  att.ok=!!R;if(!R){att.hdg=-1;return}
  const [rt,up]=SCR[srot],gv=[R[6],R[7],R[8]],u=v3.nrm([v3.dot(gv,rt),v3.dot(gv,up),gv[2]]);att.u=u;
  // 처음 1초 남짓의 자세를 "수평"으로 삼습니다(거치대 각도 보정). 수평 맞춤 버튼으로 다시 정할 수 있어요.
  if(!att.ref){att.acc.push(u);if(att.acc.length<20)return;const s=att.acc.reduce((p,q)=>[p[0]+q[0],p[1]+q[1],p[2]+q[2]],[0,0,0]);att.ref=v3.nrm(s);att.acc=[];store.set('attRef',att.ref)}
  const u0=att.ref,r0=v3.nrm([1-u0[0]*u0[0],-u0[0]*u0[1],-u0[0]*u0[2]]),f0=v3.cross(u0,r0);
  const a=v3.dot(u,r0),b=v3.dot(u,f0),c=v3.dot(u,u0);
  att.bank=Math.max(-75,Math.min(75,Math.atan2(-a,c)*DEG));att.pitch=Math.max(-40,Math.min(40,Math.atan2(-b,c)*DEG));
  // 나침반: 거치된 기기의 "앞"(수평일 때 화면 위쪽, 세웠을 때 뒷면 카메라 쪽)이 가리키는 방위
  const fd=[0,1,2].map(i=>f0[0]*rt[i]+f0[1]*up[i]+(i===2?f0[2]:0));
  const fe=R[0]*fd[0]+R[1]*fd[1]+R[2]*fd[2],fn=R[3]*fd[0]+R[4]*fd[1]+R[5]*fd[2];
  att.hdg=compass&&Math.hypot(fe,fn)>.3?((Math.atan2(fe,fn)*DEG+decl)%360+360)%360:-1;
  if(!HAS_ATT&&att.web&&att.web.ch!=null)att.hdg=att.web.ch;
}
function attLevel(){try{if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().catch(()=>{})}catch(e){}
  if(att.u){att.ref=att.u.slice();store.set('attRef',att.ref);toast('지금 자세를 수평으로 맞췄어요.')}else{att.ref=null;att.acc=[];store.set('attRef',null);toast('기울기 센서를 기다리는 중이에요. 잡히면 그 자세를 수평으로 삼아요.')}}

// 하늘: 구름은 진행 방향 앞쪽에서 다가오고(속도가 빠를수록 빨리), 방향을 틀면 옆으로 흘러감
let skyMode=store.get('gSky','auto');
const isNight=()=>skyMode==='night'||(skyMode==='auto'&&(()=>{const h=new Date().getHours();return h>=19||h<6})());
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const sky={cl:[],stars:[],spr:{},h:null};
function cloudNew(init){const f=init?60+Math.random()*940:780+Math.random()*260;return {f,l:(Math.random()*2-1)*f*.95,hgt:12+Math.random()*80,s:.7+Math.random()*.9,k:Math.random()*4|0}}
(()=>{for(let i=0;i<16;i++)sky.cl.push(cloudNew(true));const r=rng(7);for(let i=0;i<160;i++)sky.stars.push({az:r()*360,el:1+Math.pow(r(),.75)*55,m:r(),tw:r()*6.3})})();
function cloudSprite(k,night){const key=k+(night?'n':'d');if(sky.spr[key])return sky.spr[key];
  const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d'),r=rng(k*31+3);
  const puffs=[];for(let i=0;i<10;i++)puffs.push([44+r()*168,70+r()*22-(i%3)*10,20+r()*26]);
  puffs.sort((p,q)=>q[1]-p[1]);
  for(const [px,py,pr] of puffs){const gr=x.createRadialGradient(px,py-pr*.4,pr*.1,px,py,pr);
    if(night){gr.addColorStop(0,'rgba(132,146,182,.62)');gr.addColorStop(.6,'rgba(70,80,108,.5)');gr.addColorStop(1,'rgba(30,36,54,0)')}
    else{gr.addColorStop(0,'rgba(255,255,255,.98)');gr.addColorStop(.62,'rgba(236,241,248,.85)');gr.addColorStop(1,'rgba(196,208,226,0)')}
    x.fillStyle=gr;x.beginPath();x.arc(px,py,pr,0,Math.PI*2);x.fill()}
  return sky.spr[key]=c}
let moonSpr=null;
function moonSprite(){if(moonSpr)return moonSpr;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  let gr=x.createRadialGradient(64,64,10,64,64,64);gr.addColorStop(0,'rgba(255,248,220,.35)');gr.addColorStop(1,'rgba(255,248,220,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  gr=x.createRadialGradient(56,56,4,64,64,24);gr.addColorStop(0,'#fffdf0');gr.addColorStop(1,'#e2dcc4');x.fillStyle=gr;x.beginPath();x.arc(64,64,24,0,Math.PI*2);x.fill();
  x.fillStyle='rgba(150,145,125,.35)';for(const [a,b,r] of [[56,58,5],[71,70,4],[62,75,3],[73,55,3]]){x.beginPath();x.arc(a,b,r,0,Math.PI*2);x.fill()}
  return moonSpr=c}
// 회전된 자세계 좌표(수평선이 y=0, 진행 방향이 x=0)에서 하늘 그리기
function drawSky(g,w,h,d,ppd,adiW,v,dt,night){
  const W=w*2,H=h*2,F=adiW*.75,pxDeg=adiW/70;
  let gr=g.createLinearGradient(0,-h*1.2,0,0);
  if(night){gr.addColorStop(0,'#01030a');gr.addColorStop(.7,'#061230');gr.addColorStop(1,'#123064')}else{gr.addColorStop(0,'#0b3a7a');gr.addColorStop(1,'#2e7fe0')}
  g.fillStyle=gr;g.fillRect(-W,-H,W*2,H);
  // 방향을 틀면 하늘 전체가 옆으로
  const dH=sky.h==null?0:angDiff(sky.h,hdgDisp);sky.h=hdgDisp;
  if(night){const t=performance.now()/1000;
    for(const s of sky.stars){let x=angDiff(hdgDisp,s.az)*pxDeg;if(Math.abs(x)>W)continue;const y=-s.el*ppd;
      g.globalAlpha=(.35+.65*Math.abs(Math.sin(t*1.3+s.tw)))*(.4+.6*s.m);g.fillStyle='#fff';g.beginPath();g.arc(x,y,(.8+s.m*1.6)*d,0,Math.PI*2);g.fill()}
    g.globalAlpha=1;if(sky.moonAz==null)sky.moonAz=(hdgDisp+22)%360;{const off=angDiff(sky.moonAz,(hdgDisp+18)%360);if(Math.abs(off)>30)sky.moonAz=(sky.moonAz+Math.sign(off)*Math.min(Math.abs(off)-30,40*dt)+360)%360}const mx=angDiff(hdgDisp,sky.moonAz)*pxDeg,my=-16*ppd,ms=Math.min(adiW*.26,130*d);
    if(Math.abs(mx)<W)g.drawImage(moonSprite(),mx-ms/2,my-ms/2,ms,ms)}
  // 구름: 앞으로 다가오고, 선회하면 옆으로 회전
  const step=(6+v*2.2)*dt,cs=Math.cos(dH/DEG),sn=Math.sin(dH/DEG);
  for(const c of sky.cl){const f=c.f*cs+c.l*sn,l=-c.f*sn+c.l*cs;c.f=f-step;c.l=l;
    if(c.f<22||Math.abs(c.l)/Math.max(c.f,1)>2.4)Object.assign(c,cloudNew(false))}
  sky.cl.sort((p,q)=>q.f-p.f);
  for(const c of sky.cl){const x=c.l/c.f*F,y=-c.hgt/c.f*F,cw=150*c.s/c.f*F,ch=cw/2;if(Math.abs(x)-cw>W||cw<2)continue;
    g.globalAlpha=Math.max(0,Math.min(1,(1040-c.f)/240,(c.f-22)/40))*(night?.85:.95);g.drawImage(cloudSprite(c.k,night),x-cw/2,y-ch*.75,cw,ch)}
  g.globalAlpha=1;
}
$('#gLevel').onclick=attLevel;
$('#gSky').value=skyMode;$('#gSky').onchange=e=>{skyMode=e.target.value;store.set('gSky',skyMode)};
let pfd={bank:0,pitch:0,h:null,v:null,t:0};
function drawPFD(g,w,h,d,v,over,box,dial){
  const now=performance.now(),dt=pfd.t?Math.min(.5,(now-pfd.t)/1000):0;pfd.t=now;
  let tb=0,tp=0;
  if(dt>0&&pfd.h!=null&&gs.fix&&v>3)tb=Math.max(-30,Math.min(30,angDiff(pfd.h,hdgDisp)/dt*1.2));
  if(dt>0&&pfd.v!=null&&gs.fix)tp=Math.max(-8,Math.min(8,(v-pfd.v)/dt*.9));
  pfd.h=hdgDisp;pfd.v=v;
  // 센서가 있으면 기기·차량 기울기, 없으면 GPS 선회·가속으로 흉내
  const useAtt=att.ok&&!!att.ref,tB=useAtt?att.bank+tb*.25:tb,tP=useAtt?att.pitch:tp;
  pfd.bank+=(tB-pfd.bank)*(useAtt?.22:.06);pfd.pitch+=(tP-pfd.pitch)*(useAtt?.22:.05);
  const night=isNight();
  const RED='#ff3b30',W='#ffffff',MAG='#f3bc65',GRN='#a8f08f',CY='#a7e29a',AMB='#f3bc65',YEL='#f3c623';
  const nar=w/d<420,sw=w*(nar?.22:.17),aw=w*(nar?.2:.15),x1=w*.015,x2=w-w*.015-aw,cx=(x1+sw+x2)/2,at=Math.min(h*.1,36*d),ah=h-at-Math.min(h*.08,30*d),cy=at+ah/2,K=Math.min(h,520*d,w*.9);
  const fnt=(px,wt=600)=>`${wt} ${px}px "Barlow Condensed",Rajdhani,sans-serif`;
  dial.style.setProperty('--g',(K/d)+'px');box.style.top=(cy/d)+'px';box.style.left=(x1/d)+'px';box.style.width=(sw*.82/d)+'px';
  // 자세계
  g.save();g.beginPath();g.rect(x1+sw,at,x2-x1-sw,ah);g.clip();
  g.translate(cx,cy);g.rotate(-pfd.bank*Math.PI/180);const ppd=ah*.018;g.translate(0,pfd.pitch*ppd);
  drawSky(g,w,h,d,ppd,x2-x1-sw,v,dt,night);
  let gr=g.createLinearGradient(0,0,0,h);if(night){gr.addColorStop(0,'#2e1f10');gr.addColorStop(1,'#0e0905')}else{gr.addColorStop(0,'#8a5a2b');gr.addColorStop(1,'#4a2e14')}g.fillStyle=gr;g.fillRect(-w*2,0,w*4,h*2);
  g.strokeStyle=night?'#cfd8e6':W;g.lineWidth=2*d;g.beginPath();g.moveTo(-w,0);g.lineTo(w,0);g.stroke();
  g.lineWidth=1.4*d;g.fillStyle=W;g.font=fnt(K*.045);g.textBaseline='middle';
  for(let p=-20;p<=20;p+=5){if(!p)continue;const y=-p*ppd,L=(p%10?.06:.13)*w;g.beginPath();g.moveTo(-L/2,y);g.lineTo(L/2,y);g.stroke();
    if(p%10===0){g.textAlign='right';g.fillText(Math.abs(p),-L/2-6*d,y);g.textAlign='left';g.fillText(Math.abs(p),L/2+6*d,y)}}
  g.restore();
  // 선회계 눈금(위쪽 호)
  const br=Math.min((x2-x1-sw)*.45,ah*.45);g.save();g.translate(cx,cy);g.strokeStyle=W;g.lineWidth=2*d;
  g.beginPath();g.arc(0,0,br,Math.PI*1.33,Math.PI*1.67);g.stroke();
  for(const a of [-60,-45,-30,-20,-10,10,20,30,45,60]){const r=(a-90)*Math.PI/180,L=Math.abs(a)%30===0?14:8;tick(g,0,0,r,br,br+L*d,2*d,W)}
  g.fillStyle=W;g.beginPath();g.moveTo(0,-br-2*d);g.lineTo(-7*d,-br-14*d);g.lineTo(7*d,-br-14*d);g.closePath();g.fill();
  g.rotate(-pfd.bank*Math.PI/180);g.fillStyle=YEL;g.beginPath();g.moveTo(0,-br+2*d);g.lineTo(-8*d,-br+15*d);g.lineTo(8*d,-br+15*d);g.closePath();g.fill();g.restore();
  // 항공기 심볼
  g.save();g.translate(cx,cy);const s=Math.min(x2-x1-sw,ah)*.2;g.lineWidth=2*d;g.strokeStyle='#000';g.fillStyle=YEL;
  for(const k of [-1,1]){g.beginPath();g.rect(k>0?s*.35:-s*1.35,-3*d,s,6*d);g.rect(k>0?s*.35:-s*.35-6*d,-3*d,6*d,s*.35);g.fill();g.stroke()}
  g.beginPath();g.rect(-4*d,-4*d,8*d,8*d);g.fill();g.stroke();g.restore();
  // 모드 표시줄
  const col=(w-2*x1)/3,mx=i=>x1+col*(i+.5);
  g.fillStyle='#000';g.fillRect(x1,0,w-2*x1,at);g.font=fnt(Math.min(at*.62,col*.17,22*d));g.textBaseline='middle';g.textAlign='center';
  g.fillStyle=gs.fix?GRN:AMB;g.fillText(gpsOn?(gs.fix?'GPS':'NO FIX'):'GPS OFF',mx(0),at/2);
  g.fillStyle=GRN;g.fillText(hdgNow>=0?'TRK '+String(Math.round(hdgDisp)%360).padStart(3,'0'):'TRK ---',mx(1),at/2);
  g.fillStyle=gLimit>0?MAG:'#5f6a74';g.fillText(gLimit>0?'LIM '+gLimit:'LIM OFF',mx(2),at/2);
  g.strokeStyle='#ffffff30';g.lineWidth=1*d;for(const i of [1,2]){g.beginPath();g.moveTo(x1+col*i,at*.2);g.lineTo(x1+col*i,at*.8);g.stroke()}
  // 테이프 공통
  const tape=(x,tw,val,span,step,lab,fmt,left,lim)=>{
    g.save();g.fillStyle='#2b3328ee';g.fillRect(x,at,tw,ah);g.beginPath();g.rect(x,at,tw,ah);g.clip();
    const pp=ah/span,y=u=>cy-(u-val)*pp;
    if(lim>0){const yl=y(lim);g.save();g.beginPath();g.rect(left?x+tw-8*d:x,at,8*d,Math.max(0,yl-at));g.clip();
      for(let k=-ah;k<ah*2;k+=12*d){g.fillStyle=k/12/d%2?'#fff':RED;g.fillRect(left?x+tw-8*d:x,k,8*d,6*d)}g.restore()}
    g.strokeStyle=W;g.fillStyle=W;g.font=fnt(Math.min(K*.05,tw*.34));g.textBaseline='middle';g.textAlign=left?'right':'left';
    const lo=Math.floor((val-span/2)/step)*step;
    for(let u=lo;u<=val+span/2;u+=step){if(u<0&&left)continue;const yy=y(u),maj=Math.round(u/step)%lab===0;
      g.lineWidth=(maj?2:1.2)*d;const L=(maj?14:8)*d;g.beginPath();if(left){g.moveTo(x+tw,yy);g.lineTo(x+tw-L,yy)}else{g.moveTo(x,yy);g.lineTo(x+L,yy)}g.stroke();
      if(maj&&Math.abs(yy-cy)>K*.09)g.fillText(fmt(u),left?x+tw-L-5*d:x+L+5*d,yy)}
    g.restore();g.strokeStyle='#000';g.lineWidth=2*d;g.strokeRect(x,at,tw,ah);
  };
  tape(x1,sw,v,120,10,2,u=>u,true,gLimit);
  const alt=gs.fix&&gs.alt>-9000?gs.alt:0;tape(x2,aw,alt,400,20,5,u=>Math.round(u),false,0);
  // 속도 읽음 상자(숫자는 DOM이 그림)
  const bh=K*.15,bw=sw*.86;g.fillStyle='#000';g.strokeStyle=over?RED:W;g.lineWidth=2*d;g.beginPath();
  g.moveTo(x1+2*d,cy-bh/2);g.lineTo(x1+bw,cy-bh/2);g.lineTo(x1+bw,cy-bh*.18);g.lineTo(x1+sw-2*d,cy);g.lineTo(x1+bw,cy+bh*.18);g.lineTo(x1+bw,cy+bh/2);g.lineTo(x1+2*d,cy+bh/2);g.closePath();g.fill();g.stroke();
  // 고도 읽음 상자
  const ab=aw*.9;g.beginPath();g.moveTo(x2+2*d,cy);g.lineTo(x2+aw-ab+2*d,cy-bh*.38);g.lineTo(x2+aw-2*d,cy-bh*.38);g.lineTo(x2+aw-2*d,cy+bh*.38);g.lineTo(x2+aw-ab+2*d,cy+bh*.38);g.closePath();
  g.fillStyle='#000';g.fill();g.strokeStyle=W;g.stroke();
  g.fillStyle=gs.fix&&gs.alt>-9000?GRN:AMB;g.font=fnt(Math.min(bh*.5,aw*.3),700);g.textAlign='center';g.textBaseline='middle';
  g.fillText(gs.fix&&gs.alt>-9000?Math.round(gs.alt):'----',x2+aw-ab/2,cy+1*d);
  // 라벨
  g.font=fnt(Math.min(K*.042,at*.6));g.textBaseline='bottom';g.fillStyle=MAG;g.textAlign='center';g.fillText('GS km/h',x1+sw/2,h-2*d);
  g.fillStyle=CY;g.fillText('ALT m',x2+aw/2,h-2*d);
}
function drawTape(){
  const c=cv.tape,g=cx.tape;if(!g)return;const w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  const P={walk:['#efe6d8','#b7a991','#ff9a3c'],carbon:['#e6e3de','#9fa2a7',C.cp],neon:['#f1ece6','#a19c96',C.cphi],classic:['#efe6d8','#b7a991','#ff9a3c'],minimal:['#ece8e2','#8e9196',C.cp],tactical:['#c9f5bf','#7fa878','#ffb43a'],cockpit:['#ffffff','#9fb3c8','#f3bc65']}[gStyle];
  const ppd=w/150,ctr=hdgDisp,boxW=110*d;g.textAlign='center';g.textBaseline='alphabetic';
  for(let deg=Math.floor((ctr-80)/5)*5;deg<=ctr+80;deg+=5){
    const x=w/2+(deg-ctr)*ppd,n=((deg%360)+360)%360,card=n%45===0,mid=n%15===0;
    g.strokeStyle=P[0];g.globalAlpha=card?.95:mid?.6:.3;g.lineWidth=(card?2:1)*d;
    g.beginPath();g.moveTo(x,3*d);g.lineTo(x,(card?18:mid?13:8)*d);g.stroke();
    if(Math.abs(x-w/2)<boxW/2+8*d)continue;
    g.globalAlpha=1;
    if(card){g.fillStyle=n===0?P[2]:P[0];g.font=`700 ${20*d}px ${RJ}`;g.fillText(DIRS[n/22.5],x,h-8*d)}
    else if(mid){g.fillStyle=P[1];g.font=`600 ${13*d}px ${RJ}`;g.fillText(String(n).padStart(3,'0'),x,h-9*d)}
  }
  g.globalAlpha=1;g.fillStyle=P[2];g.shadowBlur=8*d;g.shadowColor=P[2];
  g.beginPath();g.moveTo(w/2-8*d,0);g.lineTo(w/2+8*d,0);g.lineTo(w/2,12*d);g.closePath();g.fill();g.shadowBlur=0;
}
/* ===== 45-devcaps.js ===== */
// 스피드미터 [GPS 켜기] 줄 아래: 기기 지원 표시(GPS · 방향 센서 · LTE · 5G · Wi-Fi · 블루투스) 자동 확인
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 상태: on(지원·사용 중) off(지원·꺼짐) yes(지원) no(없음) unk(확인 불가). 앱이 아닌 미리보기에서는 '앱에서 확인' */
const DEVCAPS=[['gps','GPS'],['compass','방향 센서'],['lte','LTE'],['nr','5G'],['wifi','Wi-Fi'],['bt','블루투스']];
const devCapsEl=(()=>{const d=document.createElement('div');d.className='devcaps';d.id='devCaps';d.setAttribute('role','list');d.setAttribute('aria-label','기기 지원');
  d.innerHTML='<button type="button" class="dc-h" aria-expanded="true">기기 지원<span class="dc-sum"></span><i class="dc-car" aria-hidden="true">▾</i></button>'+DEVCAPS.map(([k,n])=>`<span class="dc" role="listitem" data-k="${k}" data-s="unk"><i aria-hidden="true"></i><em>${n}</em><small>…</small></span>`).join('');return d})();
/* 접기: 콕핏 스페셜은 기본 접힘(누르면 펼침), 사용자가 바꾼 상태는 기억 */
function devCapsFolded(){const v=store.get('devCapsFold',null);return v===null?isCks():!!v}
function devCapsFoldUi(){const f=devCapsFolded();devCapsEl.classList.toggle('fold',f);devCapsEl.querySelector('.dc-h').setAttribute('aria-expanded',String(!f))}
devCapsEl.querySelector('.dc-h').onclick=()=>{store.set('devCapsFold',!devCapsFolded());devCapsFoldUi()};
function devCapsRead(){let r=null;try{if(NB&&NB.deviceCaps)r=JSON.parse(NB.deviceCaps()||'{}')}catch(e){r=null}return r}
function devCapsRender(){const r=devCapsRead();
  for(const [k,n] of DEVCAPS){const el=devCapsEl.querySelector(`[data-k="${k}"]`),c=r&&r[k],s=c&&c.s||'unk',t=c&&c.t||(r?'확인 불가':'앱에서 확인');
    el.dataset.s=s;el.querySelector('small').textContent=t;el.title=`${n}: ${t}`}
  const all=[...devCapsEl.querySelectorAll('.dc')].map(e=>e.dataset.s),ok=all.filter(x=>x==='on'||x==='off'||x==='yes').length,no=all.filter(x=>x==='no').length;
  devCapsEl.querySelector('.dc-sum').textContent=r?` · 지원 ${ok}`+(no?` · 없음 ${no}`:'')+(all.length-ok-no?` · 확인 불가 ${all.length-ok-no}`:''):' · 앱에서 확인';devCapsFoldUi()}
/* 콕핏 스페셜: 스피드미터의 [GPS 켜기] 버튼 줄도 조종 패널 아래로(패널이 안 보이면 제자리) */
let pfdToolsHome=null;
function pfdToolsPlace(deckVis){const t=document.querySelector('.pfd-tools');if(!t)return false;
  if(isCks()&&deckVis){if(!pfdToolsHome){pfdToolsHome=document.createComment('pfdTools');t.before(pfdToolsHome)}const deck=$('#dkControlDeck');if(deck.nextElementSibling!==t)deck.after(t);t.classList.add('in-ctl');return true}
  if(pfdToolsHome&&pfdToolsHome.nextSibling!==t)pfdToolsHome.after(t);t.classList.remove('in-ctl');return false}
/* 자리: 조종 패널(COCKPIT CONTROL)이 보이면 그 버튼들 아래, 아니면 스피드미터 [GPS 켜기] 줄 아래 */
function devCapsPlace(){const deck=$('#dkControlDeck'),vis=!!(deck&&deck.offsetParent),moved=pfdToolsPlace(vis);
  if(vis){const a=moved?document.querySelector('.pfd-tools'):deck;if(a.nextElementSibling!==devCapsEl)a.after(devCapsEl);return}
  const w=$('#wGps');if(!w)return;const tools=w.dataset.gs==='cockpit'&&w.querySelector('#pfdHost .pfd-tools');
  const after=tools||w.querySelector('.gctl');if(after&&after.nextElementSibling!==devCapsEl)after.after(devCapsEl)}
devCapsPlace();devCapsRender();
{let q=0;const mo=new MutationObserver(()=>{if(!q)q=setTimeout(()=>{q=0;devCapsPlace()},60)});mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-skin','data-ck2','data-split','data-cks']});if($('#app'))mo.observe($('#app'),{attributes:true,attributeFilter:['class','hidden'],subtree:true});mo.observe($('#wGps'),{attributes:true,attributeFilter:['data-gs']});if($('#pfdHost'))mo.observe($('#pfdHost'),{childList:true})}
setInterval(()=>{if(!document.hidden){devCapsPlace();devCapsRender()}},15000);addEventListener('load',()=>setTimeout(devCapsPlace,300));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)devCapsRender()});
window.AmpDevCaps={render:devCapsRender};
/* ===== 47-walk.js ===== */
// 스피드미터 "뚜벅이 모드": 탐험용 나침반 — 앤틱 황동 테, 짙은 녹색 다이얼, 붉은 북쪽 바늘, 은은한 지형 등고선
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
const WK={hd:0,shown:-999,bg:null,bgKey:'',theme:store.get('wkTheme','auto'),last:''};
const WK_TH={auto:'테마 자동',day:'테마 주간',night:'테마 야간'};
function wkNight(){const t=WK.theme;if(t==='night')return true;if(t==='day')return false;const h=new Date().getHours();return h>=19||h<6}
/* 등고선 배경: 몇 개의 언덕을 겹친 높이 지도에서 같은 높이 선만 그림(크기가 바뀔 때만 다시 만듦) */
function wkContours(W,H,night){const key=W+'x'+H+(night?'n':'d');if(WK.bgKey===key)return WK.bg;
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const bg=g.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7);bg.addColorStop(0,night?'#0f1a12':'#1c2e20');bg.addColorStop(1,night?'#060b07':'#0d1710');g.fillStyle=bg;g.fillRect(0,0,W,H);
  const hills=[];for(let k=0;k<7;k++)hills.push({x:(Math.sin(k*91.7)*.5+.5)*W,y:(Math.sin(k*47.3+1)*.5+.5)*H,r:(.18+((k*37)%10)/40)*Math.max(W,H),a:k%3?1:-.7});
  const S=6,cols=Math.ceil(W/S)+1,rows=Math.ceil(H/S)+1,f=new Float32Array(cols*rows);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=i*S,y=j*S;let v=0;for(const p of hills){const dx=x-p.x,dy=y-p.y;v+=p.a*Math.exp(-(dx*dx+dy*dy)/(p.r*p.r))}v+=.08*Math.sin(x*.013+y*.007)+.05*Math.cos(x*.004-y*.011);f[j*cols+i]=v}
  g.lineWidth=1;
  for(let L=-1;L<=1.6;L+=.12){g.strokeStyle=Math.abs((L*100|0)%48)<6?(night?'#3d5a4066':'#7fa58055'):(night?'#2c463233':'#5f8a6438');g.beginPath();
    for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){const a=f[j*cols+i]-L,b=f[j*cols+i+1]-L,cc=f[(j+1)*cols+i+1]-L,d=f[(j+1)*cols+i]-L,x=i*S,y=j*S,pts=[];
      if(a*b<0)pts.push([x+S*a/(a-b),y]);if(b*cc<0)pts.push([x+S,y+S*b/(b-cc)]);if(cc*d<0)pts.push([x+S*d/(d-cc),y+S]);if(d*a<0)pts.push([x,y+S*a/(a-d)]);
      if(pts.length>=2){g.moveTo(pts[0][0],pts[0][1]);g.lineTo(pts[1][0],pts[1][1])}if(pts.length===4){g.moveTo(pts[2][0],pts[2][1]);g.lineTo(pts[3][0],pts[3][1])}}
    g.stroke()}
  WK.bg=c;WK.bgKey=key;return c}
/* 나침반: 카드(눈금·방위 글자·장미)가 진행 방향만큼 돌고, 위쪽 고정 표시가 지금 향한 방향 */
function drawWalk(){const cv=$('#wkDial');if(!cv||!cv.offsetWidth)return;const d=Math.min(2,devicePixelRatio||1),W=Math.round(cv.offsetWidth*d),H=Math.round(cv.offsetHeight*d);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}const g=cv.getContext('2d'),night=wkNight(),on=hdgNow>=0,hd=WK.hd;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
  const R=Math.min(W,H)*.47,cx=W/2,cy=H/2,BR=['#f6dfa6','#c9a565','#8a6a35','#4a3519'];
  // 황동 테(두 겹) + 볼트
  let gr=g.createLinearGradient(cx-R,cy-R,cx+R,cy+R);gr.addColorStop(0,BR[0]);gr.addColorStop(.35,BR[1]);gr.addColorStop(.7,BR[3]);gr.addColorStop(1,BR[1]);
  g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1.5*d;g.stroke();
  g.fillStyle='#0b0805';g.beginPath();g.arc(cx,cy,R*.93,0,7);g.fill();
  gr=g.createLinearGradient(cx,cy-R,cx,cy+R);gr.addColorStop(0,'#e7cb8f');gr.addColorStop(.5,'#7a5a2c');gr.addColorStop(1,'#d8b878');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R*.915,0,7);g.fill();
  // 다이얼 면: 짙은 녹색
  const face=g.createRadialGradient(cx,cy-R*.2,R*.1,cx,cy,R*.86);face.addColorStop(0,night?'#16241a':'#20362a');face.addColorStop(1,night?'#070d09':'#0c1a12');
  g.fillStyle=face;g.beginPath();g.arc(cx,cy,R*.86,0,7);g.fill();
  g.save();g.translate(cx,cy);g.rotate(-hd*Math.PI/180);
  // 눈금(5°마다, 30°마다 숫자)
  const ink=night?'#c9b98f':'#efe2bf';g.textAlign='center';g.textBaseline='middle';
  for(let a=0;a<360;a+=5){const big=a%30===0,mid=a%10===0,r1=R*.84,r2=R*(big?.75:mid?.785:.805),t=(a-90)*Math.PI/180;g.strokeStyle=big?'#e7cb8f':ink;g.globalAlpha=big?1:.75;g.lineWidth=(big?2.2:1)*d;
    g.beginPath();g.moveTo(Math.cos(t)*r1,Math.sin(t)*r1);g.lineTo(Math.cos(t)*r2,Math.sin(t)*r2);g.stroke();
    if(big&&a%90){g.globalAlpha=1;g.save();g.rotate(a*Math.PI/180);g.fillStyle=ink;g.font=`600 ${R*.07}px Georgia,serif`;g.fillText(String(a),0,-R*.68);g.restore()}}
  g.globalAlpha=1;
  // 방위 글자
  for(const [k,a,s] of [['N',0,.15],['E',90,.13],['S',180,.13],['W',270,.13],['NE',45,.065],['SE',135,.065],['SW',225,.065],['NW',315,.065]]){
    g.save();g.rotate(a*Math.PI/180);g.fillStyle=k==='N'?'#e9cf92':ink;g.font=`700 ${R*s}px Georgia,"Times New Roman",serif`;g.shadowColor='#000';g.shadowBlur=4*d;g.fillText(k,0,k.length>1?-R*.56:-R*.6);g.restore()}
  // 안쪽 원
  g.strokeStyle='#c9a56566';g.lineWidth=1*d;for(const r of [.5,.32]){g.beginPath();g.arc(0,0,R*r,0,7);g.stroke()}
  // 나침반 장미(8방향 별): 황동 양면 그림자
  const star=(len,wd,a,c1,c2)=>{g.save();g.rotate(a);g.fillStyle=c1;g.beginPath();g.moveTo(0,-len);g.lineTo(wd,0);g.lineTo(0,0);g.closePath();g.fill();g.fillStyle=c2;g.beginPath();g.moveTo(0,-len);g.lineTo(-wd,0);g.lineTo(0,0);g.closePath();g.fill();g.restore()};
  for(let k=0;k<4;k++)star(R*.36,R*.06,(45+k*90)*Math.PI/180,'#a8854a','#e8cf95');
  for(let k=1;k<4;k++)star(R*.48,R*.085,k*90*Math.PI/180,'#b8935a','#f3dca6');
  // 북쪽 바늘: 붉은색, 남쪽: 아이보리
  g.shadowColor='#000';g.shadowBlur=6*d;star(R*.5,R*.085,0,'#8f1d14','#d23a2a');g.shadowBlur=0;
  g.restore();
  // 가운데 황동 축
  gr=g.createRadialGradient(cx-R*.02,cy-R*.03,0,cx,cy,R*.07);gr.addColorStop(0,'#fff1c8');gr.addColorStop(.5,'#c9a565');gr.addColorStop(1,'#4a3519');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R*.065,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1*d;g.stroke();
  // 위쪽 고정 표시(지금 향한 방향)
  g.fillStyle='#f3dca6';g.beginPath();g.moveTo(cx,cy-R*.87);g.lineTo(cx-R*.035,cy-R*.95);g.lineTo(cx+R*.035,cy-R*.95);g.closePath();g.fill();g.strokeStyle='#000';g.stroke();
  // 유리 반사
  const gl=g.createLinearGradient(cx-R,cy-R,cx+R*.2,cy+R*.2);gl.addColorStop(0,'#ffffff1c');gl.addColorStop(.45,'#ffffff06');gl.addColorStop(.46,'#ffffff00');g.fillStyle=gl;g.beginPath();g.arc(cx,cy,R*.86,0,7);g.fill();
  if(!on){g.fillStyle='#00000055';g.beginPath();g.arc(cx,cy,R*.86,0,7);g.fill()}}
function wkTick(){const host=$('#walkHost');if(document.hidden||!host||!host.offsetParent)return;
  const host2=$('#wGps');const night=wkNight();host2.classList.toggle('wk-night',night);
  const bg=wkContours(Math.round(host.offsetWidth),Math.round(host.offsetHeight),night);if(host.dataset.bg!==WK.bgKey){host.style.backgroundImage=`url(${bg.toDataURL('image/png')})`;host.dataset.bg=WK.bgKey}
  const on=hdgNow>=0,tgt=on?hdgNow:0;let df=((tgt-WK.hd+540)%360)-180;WK.hd=(WK.hd+df*.18+360)%360;
  const key=Math.round(WK.hd*4)+'|'+on+'|'+night+'|'+$('#wkDial').offsetWidth;if(key!==WK.last){WK.last=key;drawWalk()}
  $('#wkSpd').textContent=(gpsOn&&gs.fix?Math.max(0,spdNow):0).toFixed(1);
  $('#wkAlt').textContent=gpsOn&&gs.fix&&gs.alt>-9000?Math.round(gs.alt):'—';
  $('#wkBrg').textContent=on?Math.round(tgt)%360+'° '+CMP_KO[Math.round(tgt/45)%8]:'—°';
  $('#wkStat').textContent=on?'방향 센서 연결됨':gpsOn?'방향 찾는 중 — 몇 걸음 걸어 보세요':'방향 센서 연결 대기 · GPS를 켜면 더 정확해요'}
setInterval(wkTick,50);
$('#wkTheme').textContent=WK_TH[WK.theme]||'테마 자동';
$('#wkTheme').onclick=()=>{WK.theme={auto:'day',day:'night',night:'auto'}[WK.theme]||'auto';store.set('wkTheme',WK.theme);$('#wkTheme').textContent=WK_TH[WK.theme];WK.last=''};
$('#wkCal').onclick=()=>{try{toast('방위 보정: 기기를 8자 모양으로 천천히 2~3번 돌려 주세요. 자석·스피커 가까이에서는 방향이 틀릴 수 있어요.')}catch(e){}
  WK.last=''};
/* ===== 50-map.js ===== */
// 지도(기본 지도·네이버·카카오·TMAP, TMAP 앱 열기)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 지도 (자동차 스킨: 속도계 아래) ---------- */
const TMAP_PKG='com.skt.tmap.ku',NMAP_PKG='com.nhn.android.nmap';
// 내비 앱(TMAP·네이버 지도)을 화면 위쪽/아래쪽 분할 창·옆 창으로 열기 — 지도 창 버튼과 콕핏 2 측면 버튼 공통
const NAV={tmap:{pkg:TMAP_PKG,name:'TMAP',josa:'을'},nmap:{pkg:NMAP_PKG,name:'네이버 지도',josa:'를'}};
function navOpen(id,at){const a=NAV[id];if(!a)return;
  if(!NB||!NB.openApp){toast(a.name+' 켜기는 안드로이드 앱에서 동작해요.');return}
  try{
    if(at==='open'){NB.openApp(a.pkg);return 'open'}
    if(at==='side'){if(!NB.openAppSide){NB.openApp(a.pkg);return}const r=NB.openAppSide(a.pkg);
      if(r==='missing')toast(a.name+'이 설치되어 있지 않아 설치 화면을 열어요.');
      else toast(r==='rotated'?'옆 창은 가로 화면에서만 좌우로 나뉘어서, 화면을 가로로 돌린 뒤 '+a.name+a.josa+' 오른쪽에 붙여요. 분할을 끝내면 원래대로 돌아가요.':a.name+a.josa+' 오른쪽 옆 창으로 띄웠어요. 가운데 막대를 끌어 크기를 바꿀 수 있어요.');return r}
    const top=at==='top';
    const r=NB.openAppSplit?NB.openAppSplit(a.pkg,top):(top?(NB.openApp(a.pkg),'open'):NB.openAppBottom(a.pkg));
    if(r==='missing')toast(a.name+'이 설치되어 있지 않아 설치 화면을 열어요.');
    else if(r==='landscape')toast(a.name+a.josa+' 함께 띄웠어요. 가로 화면에서는 안드로이드가 옆에 붙여요. 세로로 돌리면 위아래로 나뉘어요.');
    else if(r!=='open')toast(a.name+a.josa+' 화면 '+(top?'위쪽':'아래쪽')+'(약 60%)에 띄웠어요. 이 앱은 '+(top?'아래':'위')+' 칸에 맞춰 정리돼요. 가운데 막대를 끌어 비율을 바꿀 수 있어요.');
    return r}catch(e){}}
let mapPref=store.get('mapPref',null),mapObj=null,mapMarker=null,mapEngine=null,tmapFrame=null,mapFollow=true,mapLastPush=0,mapLoading=false;
let mapNight=store.get('mapNight',true);
function loadLeaflet(){
  if(window.L)return Promise.resolve();
  const add=(tag,attrs)=>new Promise((res,rej)=>{const e=document.createElement(tag);Object.assign(e,attrs);e.onload=res;e.onerror=rej;document.head.appendChild(e)});
  const css=(href)=>add('link',{rel:'stylesheet',href});
  const js=(src)=>add('script',{src});
  return css('leaflet/leaflet.css').then(()=>js('leaflet/leaflet.js')); // 앱에 함께 넣은 파일만(외부 코드 실행 안 함)
}
function mapMsg(t){const m=$('#mapMsg');m.textContent=t||'';m.hidden=!t}
const PROV={osm:'기본 지도',naver:'네이버 지도',kakao:'카카오맵',tmap:'TMAP 지도'};
const APP_HOST='https://appassets.androidplatform.net';
// 외부 지도 SDK는 지도 키에 등록한 위 주소의 map.html(앱 화면과 다른 출처)에서만 돌아 앱 기능에 손댈 수 없습니다.
const MAP_PAGE=location.hostname==='app.daesinnam.invalid'?APP_HOST+'/assets/map.html':'map.html';
const KEYHELP={
  naver:`네이버 클라우드 플랫폼 콘솔 → Maps → Application 등록에서 Dynamic Map을 고르고, Web 서비스 URL에 ${APP_HOST} 을 등록한 뒤 받은 Client ID를 넣으세요.`,
  kakao:`Kakao Developers에서 앱을 만들고 [앱 → 플랫폼 → Web] 사이트 도메인에 ${APP_HOST} 을 등록, [카카오맵] 사용 설정을 켠 뒤 JavaScript 키를 넣으세요.`,
  tmap:'SK open API에서 받은 TMAP 앱 키를 넣으세요.'};
let mapKeys=store.get('mapKeys',null);
if(!mapKeys){mapKeys={};const t=store.get('tmapKey','');if(t)mapKeys.tmap=t;store.set('mapKeys',mapKeys);store.set('mapProv',t&&store.get('mapEngine','tmap')!=='osm'?'tmap':'osm')}
let mapProv=store.get('mapProv','osm'),lastProv=store.get('mapLastProv',mapKeys.tmap?'tmap':'naver');
if(mapProv!=='osm'&&!mapKeys[mapProv])mapProv='osm';
window.addEventListener('message',e=>{const d=e.data;if(!d||d.t!=='map'||!tmapFrame||e.source!==tmapFrame.contentWindow)return;if(typeof d.p!=='string'||!PROV[d.p])return;d.err=typeof d.err==='string'?d.err.slice(0,300):'';
  if(d.ok){mapMsg('');$('#mSrc').textContent='· '+PROV[d.p];return}
  mapMsg((d.err||'지도를 불러오지 못했어요.')+' [기본 지도로]를 누르면 바로 기본 지도로 볼 수 있어요.')});
async function mapInit(){
  if(mapLoading||mapEngine)return;mapLoading=true;
  const box=$('#mapbox'),key=mapKeys[mapProv];
  if(NB&&mapProv!=='osm'&&key){
    tmapFrame=document.createElement('iframe');tmapFrame.className='tmapframe';tmapFrame.title=PROV[mapProv];
    tmapFrame.src=`${MAP_PAGE}?p=${mapProv}&k=${encodeURIComponent(key)}`;tmapFrame.referrerPolicy='no-referrer';
    box.appendChild(tmapFrame);mapEngine='frame';rtSync();mapMsg(PROV[mapProv]+'를 불러오는 중…');mapLoading=false;mapUpdate(true);return;
  }
  mapMsg('지도를 불러오는 중…');
  try{await loadLeaflet()}catch(e){mapLoading=false;mapMsg('지도를 불러오지 못했어요. 인터넷 연결을 확인한 뒤 지도 끄기 → 지도 켜기를 눌러 주세요.');return}
  const holder=document.createElement('div');holder.className='leafhold';box.appendChild(holder);
  mapObj=L.map(holder,{zoomControl:false,attributionControl:true}).setView([37.5665,126.978],16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(mapObj);
  L.control.zoom({position:'bottomright'}).addTo(mapObj);
  mapMarker=L.marker([37.5665,126.978],{icon:L.divIcon({className:'me',html:'<i></i>',iconSize:[34,34],iconAnchor:[17,17]})}).addTo(mapObj);
  mapObj.on('dragstart',()=>{mapFollow=false;syncMapBtns()});
  new ResizeObserver(()=>mapObj&&mapObj.invalidateSize()).observe(box);
  mapEngine='osm';mapLoading=false;$('#mSrc').textContent='· OpenStreetMap';mapMsg('');rtSync();mapUpdate(true);
}
function mapDestroy(){if(mapObj){mapObj.remove();mapObj=null;mapMarker=null}if(tmapFrame){tmapFrame.remove();tmapFrame=null}$('#mapbox').querySelectorAll('.leafhold').forEach(e=>e.remove());mapEngine=null;$('#mSrc').textContent='';RT.layer=null;RT.destMk=null;rtSync()}
function mapUpdate(force){
  if(mapPref!=='on'||!isCar()||!mapEngine)return;
  if(!gpsOn){mapMsg('속도계에서 GPS 켜기를 누르면 현재 위치를 따라가요.');return}
  if(!gs.fix){mapMsg('GPS 신호를 찾는 중이에요…');return}
  const now=performance.now();if(!force&&now-mapLastPush<900)return;mapLastPush=now;
  const mm=$('#mapMsg').textContent;if(!(mapEngine==='frame'&&/못했어요|실패/.test(mm)))mapMsg('');
  const lat=gs.lat,lon=gs.lon;
  if(mapEngine==='osm')rtTick(lat,lon); // 길찾기 안내
  if(mapEngine==='osm'&&mapObj){mapMarker.setLatLng([lat,lon]);const el=mapMarker.getElement();if(el){const i=el.querySelector('i');if(i)i.style.transform=`rotate(${Math.round(hdgDisp)}deg)`}
    if(mapFollow){const z=spdNow>90?15:spdNow>40?16:17;mapObj.setView([lat,lon],force?z:mapObj.getZoom(),{animate:!force})}}
  if(mapEngine==='frame'&&tmapFrame&&tmapFrame.contentWindow)tmapFrame.contentWindow.postMessage({t:'pos',lat,lon,follow:mapFollow},'*');
}
function syncMapBtns(){const alt=mapProv==='osm'?lastProv:'osm';$('#mapSwap').hidden=!(NB&&(mapProv!=='osm'||mapKeys[lastProv]));$('#mapSwap').textContent=alt==='osm'?'기본 지도로':PROV[alt]+'로';$('#mapFollow').classList.toggle('on',mapFollow);$('#mapNight').classList.toggle('on',mapNight);$('#mapbox').classList.toggle('night',mapNight)}
function mapApply(){
  const w=$('#wMap');
  $('#mapAsk').hidden=mapPref!==null;$('#mapWrap').hidden=mapPref!=='on';$('#mapOffMsg').hidden=mapPref!=='off';
  appEl.classList.toggle('MO',mapPref==='off');
  if(mapPref==='off')w.classList.add('collapsed');
  if(mapPref==='on'&&isCar()){w.classList.remove('collapsed');mapInit()}else if(mapPref!=='on')mapDestroy();
  syncMapBtns();
}
function setMapPref(v){mapPref=v;store.set('mapPref',v);mapApply()}
function mapSkinChanged(){if(isCar()&&mapPref==='on')mapInit()}
$('#mapYes').onclick=()=>setMapPref('on');
$('#mapNo').onclick=()=>setMapPref('off');
$('#mapOff').onclick=()=>setMapPref('off');
$('#mapOn2').onclick=()=>setMapPref('on');
$('#mapFollow').onclick=()=>{mapFollow=true;syncMapBtns();mapUpdate(true)};
function mapZoom(d){if(mapEngine==='osm'&&mapObj){d>0?mapObj.zoomIn():mapObj.zoomOut();return true}
  if(mapEngine==='frame'&&tmapFrame&&tmapFrame.contentWindow){tmapFrame.contentWindow.postMessage({t:'zoom',d},'*');return true}return false}
$('#mapZoomIn').onclick=()=>mapZoom(1);$('#mapZoomOut').onclick=()=>mapZoom(-1);
$('#mapNight').onclick=()=>{mapNight=!mapNight;store.set('mapNight',mapNight);syncMapBtns()};
function setProv(p){mapProv=p;store.set('mapProv',p);if(p!=='osm'){lastProv=p;store.set('mapLastProv',p)}syncKeyUi();syncMapBtns();mapDestroy();if(mapPref==='on')mapInit()}
$('#mapSwap').onclick=()=>setProv(mapProv==='osm'?lastProv:'osm');
/* 저장한 키는 화면에 다시 보이지 않게 하고, 입력란은 접어 둡니다. */
function syncKeyUi(){const sel=$('#mapProvSel').value||lastProv,has=!!mapKeys[sel],i=$('#tmapKey');i.value='';
  i.placeholder=has?'키가 저장되어 있어요. 바꾸려면 새 키를 넣으세요':(sel==='naver'?'Client ID':sel==='kakao'?'JavaScript 키':'TMAP 앱 키');
  $('#tmapKeyDel').hidden=!has;$('#mapKeyHelp').textContent=KEYHELP[sel];
  $('#mapKeySum').textContent=PROV[mapProv]+' 사용 중'+(mapProv!=='osm'?' · 키 저장됨':'')}
$('#mapProvSel').value=lastProv;
$('#mapProvSel').onchange=syncKeyUi;
$('#tmapKeySave').onclick=()=>{const k=$('#tmapKey').value.trim(),sel=$('#mapProvSel').value;if(!k){$('#tmapKey').focus();return}mapKeys[sel]=k;store.set('mapKeys',mapKeys);$('#mapKeyBox').open=false;setProv(sel)};
$('#tmapKey').addEventListener('keydown',e=>{if(e.key==='Enter')$('#tmapKeySave').click()});
$('#tmapKeyDel').onclick=()=>{const sel=$('#mapProvSel').value;delete mapKeys[sel];store.set('mapKeys',mapKeys);$('#mapKeyBox').open=false;setProv(mapProv===sel?'osm':mapProv)};
if(!NB)$('#mapKeyBox').hidden=true;
syncKeyUi();
// 지도 아래 [TMAP]: 누르면 바로 화면 아래쪽에 TMAP(측면 버튼이 있는 콕핏 스킨에서는 측면 버튼으로)
$('#mapTmap').onclick=()=>{const r=navOpen('tmap','bottom');if(r&&r!=='missing')setTimeout(()=>{const w=$('#wMap');if(w&&!w.classList.contains('collapsed'))w.scrollIntoView({block:'start',behavior:'smooth'})},900)};
/* ===== 55-route.js ===== */
// 무료 지도(OpenStreetMap) 길찾기: 목적지 검색(Nominatim, 안 되면 Photon) → 경로(OSRM) → 다음 회전 안내·음성·경로 이탈 시 다시 찾기
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 길찾기 (키 없음, 공개 서버) ---------- */
const RT_GEO=['https://nominatim.openstreetmap.org/search','https://photon.komoot.io/api/'];
const RT_OSRM=['https://routing.openstreetmap.de/routed-car/route/v1/driving/','https://router.project-osrm.org/route/v1/driving/'];
const RT={dest:null,route:null,coords:[],cum:[],steps:[],idx:0,step:0,off:0,lastRoute:0,said:{},layer:null,destMk:null,busy:false,last:null,arrived:false};
let rtVoice=store.get('rtVoice',true)!==false;
const rtDist=m=>m>=1000?(m/1000).toFixed(m>=10000?0:1)+'km':Math.max(0,Math.round(m/10)*10)+'m';
const rtTime=s=>{const m=Math.max(1,Math.round(s/60));return m>=60?Math.floor(m/60)+'시간 '+(m%60)+'분':m+'분'};
function rtHav(a,b,c,d){const R=6371000,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
// 점과 선분 사이 거리(미터, 짧은 구간이라 평면 근사)
function rtSeg(p,a,b){const k=Math.cos(p[0]*Math.PI/180)*111320,m=110540,ax=(a[1]-p[1])*k,ay=(a[0]-p[0])*m,bx=(b[1]-p[1])*k,by=(b[0]-p[0])*m,dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;
  let t=l?-(ax*dx+ay*dy)/l:0;t=Math.max(0,Math.min(1,t));const x=ax+dx*t,y=ay+dy*t;return {d:Math.hypot(x,y),t}}
const RT_DIR={uturn:'유턴','sharp right':'오른쪽으로 크게 회전',right:'우회전','slight right':'오른쪽 방향',straight:'직진','slight left':'왼쪽 방향',left:'좌회전','sharp left':'왼쪽으로 크게 회전'};
const RT_ARROW={uturn:'↶','sharp right':'↘',right:'→','slight right':'↗',straight:'↑','slight left':'↖',left:'←','sharp left':'↙'};
function rtText(s){const m=s.maneuver||{},mod=m.modifier||'straight',t=m.type,side=/left/.test(mod)?'왼쪽':/right/.test(mod)?'오른쪽':'';
  const road=(s.name||'').trim(),to=road?' · '+road:'';
  if(t==='depart')return '출발'+to;
  if(t==='arrive')return '목적지 도착';
  if(t==='roundabout'||t==='rotary'||t==='roundabout turn')return '회전교차로에서 '+(m.exit?m.exit+'번째 출구':RT_DIR[mod]||'진행')+to;
  if(t==='exit roundabout'||t==='exit rotary')return '회전교차로에서 나가기'+to;
  if(t==='on ramp')return (side?side+' ':'')+'진입로로 진입'+to;
  if(t==='off ramp')return (side?side+' ':'')+'출구로 나가기'+to;
  if(t==='fork')return '갈림길에서 '+(side||'직진')+to;
  if(t==='merge')return (side?side+'으로 ':'')+'합류'+to;
  if(t==='end of road')return '길 끝에서 '+(RT_DIR[mod]||'진행')+to;
  if((t==='continue'||t==='new name')&&(mod==='straight'||!m.modifier))return '직진'+to;
  return (RT_DIR[mod]||'진행')+to}
function rtArrow(s){const m=s.maneuver||{};if(m.type==='arrive')return '⚑';if(/roundabout|rotary/.test(m.type))return '⟳';return RT_ARROW[m.modifier||'straight']||'↑'}
function rtHere(){if(gpsOn&&gs.fix&&isFinite(gs.lat))return [gs.lat,gs.lon,true];if(mapObj){const c=mapObj.getCenter();return [c.lat,c.lng,false]}const l=store.get('wxLoc',null);return l?[l[0],l[1],false]:[37.5665,126.978,false]}
async function rtJson(url,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||9000);try{const r=await fetch(url,{signal:c.signal,headers:{'Accept':'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
async function rtSearch(q){const [lat,lon]=rtHere();const out=[];
  try{const u=RT_GEO[0]+'?'+new URLSearchParams({format:'jsonv2',q,countrycodes:'kr',limit:'6','accept-language':'ko',viewbox:[lon-.6,lat+.45,lon+.6,lat-.45].join(','),bounded:'0'});
    for(const r of await rtJson(u))out.push({name:(r.name||r.display_name.split(',')[0]).trim(),addr:r.display_name,lat:+r.lat,lon:+r.lon})}catch(e){}
  if(!out.length){try{const u=RT_GEO[1]+'?'+new URLSearchParams({q,limit:'6',lat:String(lat),lon:String(lon)});
    for(const f of (await rtJson(u)).features||[]){const p=f.properties||{},c=f.geometry.coordinates;out.push({name:p.name||p.street||q,addr:[p.city,p.district,p.street,p.housenumber].filter(Boolean).join(' '),lat:c[1],lon:c[0]})}}catch(e){}}
  for(const r of out)r.d=rtHav(lat,lon,r.lat,r.lon);
  return out}
async function rtFetchRoute(a,b){let last;
  for(const base of RT_OSRM){try{const j=await rtJson(base+a[1]+','+a[0]+';'+b[1]+','+b[0]+'?overview=full&geometries=geojson&steps=true&alternatives=false',12000);
    if(j.code==='Ok'&&j.routes&&j.routes[0])return j.routes[0];last=new Error(j.code||'NoRoute')}catch(e){last=e}}
  throw last||new Error('route')}
function rtUi(){const on=!!RT.route;$('#rtInfo').hidden=!on;$('#rtSearch').hidden=on;$('#rtVoice').classList.toggle('on',rtVoice);$('#rtVoice').textContent=rtVoice?'🔊 음성':'🔇 음성'}
function rtSay(t){if(!rtVoice)return;try{if(NB&&NB.speak){NB.speak(t);return}}catch(e){}try{const u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
function rtDraw(){if(!mapObj||!window.L)return;
  if(RT.layer){RT.layer.remove();RT.layer=null}if(RT.destMk){RT.destMk.remove();RT.destMk=null}
  if(!RT.route)return;
  RT.layer=L.layerGroup([L.polyline(RT.coords,{color:'#0b2a14',weight:11,opacity:.85}),L.polyline(RT.coords,{color:'#a8f08f',weight:6,opacity:.95})]).addTo(mapObj);
  RT.destMk=L.marker([RT.dest.lat,RT.dest.lon],{icon:L.divIcon({className:'rtdest',html:'<i>⚑</i>',iconSize:[30,30],iconAnchor:[8,28]})}).addTo(mapObj)}
async function rtStart(dest,reroute){if(RT.busy)return;RT.busy=true;const from=rtHere();
  if(!reroute){$('#rtMsg').textContent='경로를 찾는 중…';$('#rtMsg').hidden=false}
  try{const r=await rtFetchRoute(from,[dest.lat,dest.lon]);
    RT.dest=dest;RT.route=r;RT.coords=r.geometry.coordinates.map(c=>[c[1],c[0]]);RT.cum=[0];
    for(let i=1;i<RT.coords.length;i++)RT.cum.push(RT.cum[i-1]+rtHav(RT.coords[i-1][0],RT.coords[i-1][1],RT.coords[i][0],RT.coords[i][1]));
    RT.steps=[];let k=0;for(const leg of r.legs)for(const s of leg.steps){const loc=s.maneuver.location;let bi=k,bd=1e12;
      for(let i=k;i<RT.coords.length;i++){const d=Math.abs(RT.coords[i][0]-loc[1])+Math.abs(RT.coords[i][1]-loc[0]);if(d<bd){bd=d;bi=i}if(bd<1e-7)break}
      k=bi;RT.steps.push({s,i:bi,at:RT.cum[bi]})}
    RT.idx=0;RT.step=1;RT.off=0;RT.lastRoute=Date.now();RT.said={};RT.arrived=false;
    store.set('rtDest',{...dest,t:Date.now()});
    if(!reroute){const rec=(store.get('rtRecent',[])||[]).filter(x=>Math.abs(x.lat-dest.lat)+Math.abs(x.lon-dest.lon)>1e-4);rec.unshift({name:dest.name,addr:dest.addr,lat:dest.lat,lon:dest.lon});store.set('rtRecent',rec.slice(0,6))}
    $('#rtMsg').hidden=true;$('#rtRes').hidden=true;rtUi();rtDraw();
    if(mapObj&&!reroute){try{mapObj.fitBounds(L.latLngBounds(RT.coords),{padding:[30,30]})}catch(e){}mapFollow=false;syncMapBtns();
      if(from[2])setTimeout(()=>{if(RT.route){mapFollow=true;syncMapBtns();mapUpdate(true)}},3500)}
    if(!from[2]&&!reroute)toast('GPS가 꺼져 있어 지도 가운데에서 출발하는 경로예요. 속도계에서 GPS를 켜면 실제 위치로 안내해요.');
    rtShow(from[0],from[1]);
    if(reroute)rtSay('경로를 다시 찾았어요');else rtSay(dest.name+'까지 안내를 시작합니다. '+rtDist(r.distance)+', 약 '+rtTime(r.duration));
  }catch(e){if(!reroute){$('#rtMsg').textContent='경로를 찾지 못했어요. 인터넷 연결을 확인하거나 다른 목적지를 골라 주세요.';$('#rtMsg').hidden=false}}
  finally{RT.busy=false}}
function rtStop(){$('#rtQ').value='';$('#rtRes').hidden=true;RT.route=null;RT.dest=null;RT.coords=[];RT.steps=[];store.set('rtDest',null);rtDraw();rtUi();try{speechSynthesis.cancel()}catch(e){}}
// 지금 위치로 진행 상황 계산 → 다음 회전·남은 거리·음성
function rtShow(lat,lon){if(!RT.route)return;
  const p=[lat,lon];let best=RT.idx,bd=1e12,bt=0;const lo=Math.max(0,RT.idx-5),hi=Math.min(RT.coords.length-1,RT.idx+400);
  for(let i=lo;i<hi;i++){const r=rtSeg(p,RT.coords[i],RT.coords[i+1]);if(r.d<bd){bd=r.d;best=i;bt=r.t}}
  if(RT.coords.length<2){bd=0}
  RT.idx=best;const along=RT.cum[best]+(RT.cum[best+1]!=null?(RT.cum[best+1]-RT.cum[best])*bt:0);RT.offD=bd;
  while(RT.step<RT.steps.length-1&&RT.steps[RT.step].at<=along+8)RT.step++;
  const st=RT.steps[Math.min(RT.step,RT.steps.length-1)],toTurn=Math.max(0,st.at-along),left=Math.max(0,RT.cum[RT.cum.length-1]-along);
  const frac=RT.cum[RT.cum.length-1]?left/RT.cum[RT.cum.length-1]:0;
  $('#rtTurn').textContent=rtArrow(st.s);$('#rtStep').textContent=rtText(st.s);$('#rtStepD').textContent=rtDist(toTurn);
  const eta=new Date(Date.now()+RT.route.duration*frac*1000);
  $('#rtSum').textContent=RT.dest.name+' · '+rtDist(left)+' · '+rtTime(RT.route.duration*frac)+' (도착 '+String(eta.getHours()).padStart(2,'0')+':'+String(eta.getMinutes()).padStart(2,'0')+')';
  return {toTurn,left,st}}
function rtTick(lat,lon){if(!RT.route||RT.busy)return;const r=rtShow(lat,lon);if(!r)return;
  if(r.left<30&&RT.offD<60&&!RT.arrived){RT.arrived=true;rtSay('목적지에 도착했습니다. 안내를 마칩니다.');toast(RT.dest.name+'에 도착했어요.');setTimeout(rtStop,4000);return}
  const key=RT.step;const say=(lv,t)=>{if(!RT.said[key+':'+lv]){RT.said[key+':'+lv]=1;rtSay(t)}};
  const txt=r.st.s.maneuver.type==='arrive'?'목적지':rtText(r.st.s).split(' · ')[0];
  if(r.toTurn<=60)say(0,txt==='목적지'?'곧 목적지입니다':txt+'하세요');else if(r.toTurn<=300)say(1,rtDist(r.toTurn)+' 앞에서 '+txt);else if(r.toTurn<=1000&&spdNow>60)say(2,rtDist(r.toTurn)+' 앞에서 '+txt);
  // 경로 이탈: 70m 넘게 벗어난 상태가 3번 이어지면 지금 위치에서 다시 찾기(20초에 한 번까지)
  if(RT.offD>70){if(++RT.off>=3&&Date.now()-RT.lastRoute>20000){RT.off=0;rtStart(RT.dest,true)}}else RT.off=0}
function rtRender(list,title){const ul=$('#rtRes');ul.innerHTML='';
  if(title){const h=document.createElement('li');h.className='rthead';h.textContent=title;ul.appendChild(h)}
  if(!list.length){const li=document.createElement('li');li.className='rthead';li.textContent='찾는 곳이 없어요. 다른 이름이나 주소로 찾아 주세요.';ul.appendChild(li)}
  list.forEach((r,i)=>{const li=document.createElement('li');li.dataset.i=i;const b=document.createElement('b'),s=document.createElement('small');
    b.textContent=r.name;s.textContent=(r.d!=null?rtDist(r.d)+' · ':'')+(r.addr||'');li.append(b,s);ul.appendChild(li)});
  ul.hidden=false;ul.__list=list}
async function rtFind(){const q=$('#rtQ').value.trim();if(!q){rtRender(store.get('rtRecent',[])||[],'최근 목적지');return}
  $('#rtMsg').textContent='찾는 중…';$('#rtMsg').hidden=false;
  const r=await rtSearch(q);$('#rtMsg').hidden=true;rtRender(r,null)}
$('#rtGo').onclick=rtFind;
$('#rtQ').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();rtFind()}});
$('#rtQ').addEventListener('focus',()=>{if(!$('#rtQ').value.trim()&&(store.get('rtRecent',[])||[]).length)rtRender(store.get('rtRecent',[]),'최근 목적지')});
$('#rtRes').addEventListener('click',e=>{const li=e.target.closest('li[data-i]');if(!li)return;const r=$('#rtRes').__list[+li.dataset.i];if(r){$('#rtQ').blur();rtStart(r,false)}});
$('#rtStop').onclick=rtStop;
$('#rtVoice').onclick=()=>{rtVoice=!rtVoice;store.set('rtVoice',rtVoice);rtUi()};
$('#rtAll').onclick=()=>{if(mapObj&&RT.coords.length){mapFollow=false;syncMapBtns();try{mapObj.fitBounds(L.latLngBounds(RT.coords),{padding:[30,30]})}catch(e){}}};
// 앱을 다시 켜면 6시간 안의 안내는 이어서
{const d=store.get('rtDest',null);if(d&&Date.now()-(d.t||0)<6*3600e3){let n=0;const t=setInterval(()=>{if(RT.route||++n>60){clearInterval(t);return}if(gpsOn&&gs.fix){clearInterval(t);rtStart(d,true)}},2000)}}
function rtSync(){const free=mapEngine==='osm';$('#rtBar').hidden=!free;if(free)rtDraw()}
window.AmpRoute={get state(){return {on:!!RT.route,dest:RT.dest,step:RT.step,idx:RT.idx,off:RT.offD,text:$('#rtStep').textContent,dist:$('#rtStepD').textContent,sum:$('#rtSum').textContent}},start:rtStart,stop:rtStop,tick:rtTick,search:rtSearch};
rtUi();
/* ===== 60-playlist-car-drive.js ===== */
// 저장되는 재생목록, 알림, 차 연결 자동 재생, 주행 중 간편 모드
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 저장되는 플레이리스트 (앱) ---------- */
const LIB=!!(NB&&NB.pickAudio);
const mediaUrl=u=>'/media?u='+encodeURIComponent(u), artUrl=u=>'/art?u='+encodeURIComponent(u);
function libItem(o){const nm=splitName(o.name||'');return{uri:o.uri,lib:true,url:mediaUrl(o.uri),title:o.title||nm.title||'제목 없음',artist:o.artist||nm.artist||'',album:o.album||'',duration:o.duration||0,size:o.size||0,hasArt:!!o.hasArt,art:o.hasArt?artUrl(o.uri):null,name:o.name||''}}
function savePlaylist(){if(!LIB)return;store.set('playlist',list.filter(it=>it.lib).map(it=>({uri:it.uri,name:it.name,title:it.title,artist:it.artist,album:it.album,duration:it.duration,size:it.size,hasArt:it.hasArt})))}
let resumeSaveT=0;
function saveResume(force){if(!LIB)return;const it=list[cur];if(!it||!it.lib)return;const now=performance.now();if(!force&&now-resumeSaveT<5000)return;resumeSaveT=now;store.set('resume',{uri:it.uri,t:Math.floor(audio.currentTime||0)})}
audio.addEventListener('timeupdate',()=>saveResume(false));
audio.addEventListener('pause',()=>saveResume(true));
audio.addEventListener('error',()=>{const it=list[cur];if(!it||!it.lib)return;it.missing=true;renderList();setMarquee('파일을 열 수 없어요: '+it.title+' (옮겨졌거나 지워졌을 수 있어요)')});
window.__onPickStart=()=>{setMarquee('음악을 불러오는 중…');$('#sum').textContent='불러오는 중…'};
window.__onPicked=arr=>{
  if(!arr){renderList();updateMeta();return}
  if(mode==='ext')setMode('local');
  if(list.some(it=>!it.lib)){audio.pause();audio.removeAttribute('src');audio.load();list=list.filter(it=>it.lib);cur=list.length?0:-1} // 데모 곡은 빼고 내 곡만
  const have=new Set(list.filter(it=>it.lib).map(it=>it.uri)),start=list.length;let added=0;
  arr.forEach(o=>{if(o&&o.uri&&!have.has(o.uri)){list.push(libItem(o));have.add(o.uri);added++}});
  savePlaylist();renderList();
  if(!added){setMarquee(arr.length?'이미 목록에 있는 곡이에요':'음악 파일을 찾지 못했어요');return}
  toast(`${added}곡을 추가했어요. 앱을 다시 켜도 목록이 유지돼요.`);
  if(NAT){if(cur<0||!nat.playing){cur=start;natSync(true,start,0)}else natSync(true,cur,nat.pos||0);renderList();updateMeta();return}
  if(cur<0||audio.paused)playIndex(start);else updateMeta();
};
function restorePlaylist(){
  if(!LIB)return false;const saved=store.get('playlist',[]);if(!saved.length)return false;
  list=saved.map(libItem);const r=store.get('resume',null);let idx=r?list.findIndex(it=>it.uri===r.uri):-1;if(idx<0)idx=0;
  cur=idx;
  if(NAT){renderList();updateMeta();return true} // 표준 플레이어와 연결되면 pollNat이 이어서 맞춥니다
  audio.src=list[cur].url;
  if(r&&r.uri===list[cur].uri&&r.t>2){const seekOnce=()=>{audio.removeEventListener('loadedmetadata',seekOnce);try{audio.currentTime=Math.max(0,r.t-2)}catch(e){}};audio.addEventListener('loadedmetadata',seekOnce)}
  renderList();updateMeta();return true;
}
function pollNat(){
  if(!NAT)return;let s;try{s=JSON.parse(NB.npState())}catch(e){return}
  nat=s;natT=performance.now();if(!s.connected)return;
  if(!natReady){natReady=true;
    if(natList()){
      const same=s.count===list.length&&list[s.index]&&list[s.index].uri===s.mid;
      if(same){cur=s.index;renderList();updateMeta()} // 앱을 다시 열었을 때 재생 중인 곡을 그대로 이어받음
      else{const r=store.get('resume',null);const i=cur<0?0:cur;natSync(false,i,r&&list[i]&&r.uri===list[i].uri?r.t*1000:0)}
    }
    flags();applyVol();pushExtEq();
  }
  balEl.disabled=natL()||mode==='ext';
  if(!natL())return;
  if(s.count===list.length&&s.index>=0&&s.index!==cur){cur=s.index;renderList();updateMeta()}
  if(s.err&&s.errIndex>=0&&list[s.errIndex]&&!list[s.errIndex].missing){list[s.errIndex].missing=true;renderList()}
  if(performance.now()-resumeSaveT>5000&&list[cur]){resumeSaveT=performance.now();store.set('resume',{uri:list[cur].uri,t:Math.floor((s.pos||0)/1000)})}
  state();
}
let natHidT=0;if(NAT)setInterval(()=>{if(document.hidden&&performance.now()-natHidT<1500)return;natHidT=performance.now();pollNat()},250);
function pickMusic(folder){if(LIB){try{NB.pickAudio(!!folder)}catch(e){}}else $('#file').click()}

/* ---------- 알림 토스트 ---------- */
let toastT=0;
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,3200)}

/* ---------- 차 연결 시 이어서 재생 ---------- */
const HAS_CAR=!!(NB&&NB.carStatus);
window.__carConnected=name=>{
  try{NB.takeCarAutoplay&&NB.takeCarAutoplay()}catch(e){}
  toast('차량에 연결됐어요'+(name?' · '+name:'')+' · 이어서 재생해요');
  // 고른 음원(또는 마지막에 듣던 음원)을 이어서 재생 — YouTube Music·Spotify는 화면 전환 없이
  let src=store.get('carSrc','auto');if(src==='auto')src=store.get('lastSrc',mode==='ext'?'ext':'local');
  const PKX={ytm:'com.google.android.apps.youtube.music',spotify:'com.spotify.music'};
  if(src==='radio'&&window.AmpRadio)window.AmpRadio.resume();
  else if(src==='ext'||PKX[src]){if(mode!=='ext')setMode('ext');try{NB.mediaPlay(PKX[src]||store.get('extPkg',''))}catch(e){X('play')}}
  else{if(mode==='ext')setMode('local');if(cur<0&&list.length)cur=0;if(cur>=0)play()}
  if(isCar()&&store.get('carGps',true)&&!gpsOn)gpsStart();
  const da=store.get('driveAuto','car');if(da==='car'||da==='both')drive(true);
  return true;
};

/* ---------- 주행 중 간편 모드 ---------- */
let driveOn=false,driveSuppress=false,stillSince=0;
function drive(on){
  driveOn=on;$('#drive').hidden=!on;document.documentElement.classList.toggle('driving',on);
  if(NB&&NB.keepScreenOn){try{NB.keepScreenOn(on||hudOn)}catch(e){}}
  if(on)driveUi();
  if(typeof dk!=='undefined'&&isCp())dk.render();
}
function driveUi(){
  if(!driveOn)return;
  const playing=mode==='ext'?!!ext.playing:(!audio.paused&&cur>=0);
  $('#dvTitle').textContent=$('#npTitle').textContent||'—';
  $('#dvArtist').textContent=$('#npArtist').textContent||'';
  $('#dvArt').style.backgroundImage=$('#cover').style.backgroundImage||'';
  $('#dvArt').classList.toggle('empty',$('#cover').classList.contains('empty'));
  $('#dvPlay').classList.toggle('on',playing);$('#dvPlay').setAttribute('aria-label',playing?'일시정지':'재생');
  $('#dvPlayIco').innerHTML=playing?'<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>':'<path d="M7 4l13 8-13 8z"/>';
  let d=0,t=0;if(mode==='ext'){d=(ext.dur||0)/1000;t=extPos()}else if(cur>=0){d=audio.duration||(list[cur]&&list[cur].duration)||0;t=audio.currentTime}
  $('#dvBar').style.width=(d?Math.min(100,t/d*100):0)+'%';$('#dvCur').textContent=fmt(t);$('#dvDur').textContent=fmt(d);
  const now=new Date();$('#dvClock').textContent=now.getHours()+':'+String(now.getMinutes()).padStart(2,'0');
  const showSpd=isCar()&&gpsOn;$('#dvSpdBox').hidden=!showSpd;
  if(showSpd){$('#dvSpd').textContent=gs.fix?Math.round(spdDisp):'--';$('#dvSpdBox').classList.toggle('over',gLimit>0&&spdDisp>gLimit)}
  $('#dvSrc').textContent=mode==='ext'?(ext.app||'외부 앱'):'내 음악';
}
function driveAutoTick(){
  const da=store.get('driveAuto','car');if(!(da==='speed'||da==='both')||!gpsOn||!gs.fix)return;
  if(spdNow<1){if(!stillSince)stillSince=performance.now();if(performance.now()-stillSince>60000)driveSuppress=false}else stillSince=0;
  if(!driveOn&&!driveSuppress&&spdNow>=10)drive(true);
}
$('#dvClose').onclick=()=>{drive(false);driveSuppress=true};
$('#dvPrev').onclick=()=>prev();$('#dvNext').onclick=()=>next();$('#dvPlay').onclick=()=>toggle();
const vol1=dir=>{if(NB&&NB.adjustVolume){try{NB.adjustVolume(dir)}catch(e){}}else{volEl.value=Math.max(0,Math.min(100,+volEl.value+dir*10));volEl.oninput()}};
$('#dvVolDn').onclick=()=>vol1(-1);$('#dvVolUp').onclick=()=>vol1(1);
$('#dvSrc').onclick=()=>{if(HAS_EXT)setMode(mode==='ext'?'local':'ext')};
$('#driveBtn').onclick=()=>{drive(true);driveSuppress=false};
/* ===== 70-settings-extpicker.js ===== */
// 설정 창, PFD 연결 창구, 외부 음악 앱 선곡
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 설정 창 ---------- */

/* ---------- 콕핏 스킨 PFD 연결용 창구: pfd-amp.js가 이 값만 읽고 씁니다 ---------- */
window.AmpHost={
  get skin(){return skin},get gStyle(){return gStyle},get gpsOn(){return gpsOn},get gs(){return gs},get spdNow(){return spdNow},get hdgNow(){return hdgNow},
  get trip(){return trip},get att(){return att},get gLimit(){return gLimit},
  setLimit(v){gLimit=v|0;store.set('gLimit',gLimit);const sel=$('#gLimit');if([...sel.options].some(o=>+o.value===gLimit))sel.value=String(gLimit)},
  resetTrip(){trip={dist:0,time:0,max:0};store.set('trip',trip);gpsUi()},
  gpsStart(){gpsStart()},gpsStop(){gpsStop(true)},
  load(k,d){return store.get(k,d)},save(k,v){store.set(k,v)},
  get atcDone(){return typeof atcDone!=='undefined'&&atcDone},
  speedTick(v){try{atcSpeedTick(v,true)}catch(e){}},
  atcSay(t){try{if(typeof atcSpeak==='function')atcSpeak(t)}catch(e){}},
  beep(k){try{if(k==='tireUp'||k==='tireDown'){sndTire(k==='tireDown');return}if(k==='takeoff'&&typeof sndTakeoff==='function')sndTakeoff();else if(typeof sndRoger==='function')sndRoger()}catch(e){}}
};
/* 태블릿 가로모드(tablet.js) 연결 창구: 읽기·호출만 하고 기존 동작은 바꾸지 않음 */
/* 블랙박스 화면 반전(좌우·상하): 거꾸로 달린 카메라·후방 카메라용, 이 기기에 기억 */
(function(){const img=$('#camImg'),bh=$('#camFlipH'),bv=$('#camFlipV');if(!img||!bh)return;
  const apply=()=>{const h=!!store.get('camFlipH',false),v=!!store.get('camFlipV',false);img.style.setProperty('--cfx',h?-1:1);img.style.setProperty('--cfy',v?-1:1);
    bh.classList.toggle('on',h);bh.setAttribute('aria-pressed',String(h));bv.classList.toggle('on',v);bv.setAttribute('aria-pressed',String(v))};
  bh.onclick=()=>{store.set('camFlipH',!store.get('camFlipH',false));apply()};bv.onclick=()=>{store.set('camFlipV',!store.get('camFlipV',false));apply()};apply()})();
/* ---------- 외부 음악 앱(YouTube Music·Spotify): 누르면 그 앱으로 전환해 곡을 고르고, 재생·정지·곡 넘김은 이 앱 플레이어로 ---------- */
window.AmpExt=(()=>{
  const PK={ytm:'com.google.android.apps.youtube.music',spotify:'com.spotify.music'},NAME={[PK.ytm]:'YouTube Music',[PK.spotify]:'Spotify'};
  const subs=new Set();
  const curPkg=()=>(ext&&ext.pkg&&NAME[ext.pkg]?ext.pkg:null)||store.get('extPkg',PK.ytm);
  const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function start(pkg){store.set('extPkg',pkg);store.set('lastSrc','ext');
    try{radioStop()}catch(e){} // 라디오는 완전히 멈춰서 그 앱의 소리를 다시 빼앗지 않게
    if(mode!=='ext')setMode('ext');
    if(!NB||!NB.openApp){toast((NAME[pkg]||'음악 앱')+' 전환은 안드로이드 앱에서 동작해요.');return}
    try{NB.openApp(pkg)}catch(e){}
    toast((NAME[pkg]||'음악 앱')+'(으)로 전환해요. 곡을 고른 뒤 돌아오면 여기서 재생·정지·곡 넘김을 할 수 있어요.')}
  function render(ul){if(!ul)return;const pk=curPkg(),has=!!(ext&&ext.title);
    let h='<li class="xp-head"><span class="xp-apps">'+Object.values(PK).map(p=>'<button data-xapp="'+p+'" class="'+(p===pk?'on':'')+'">'+NAME[p]+' 열기</button>').join('')+'</span></li>';
    h+=has?'<li class="xp-now"><small>지금 재생 · '+esc(ext.app||NAME[pk]||'')+'</small><b>'+esc(ext.title)+'</b><span>'+esc(ext.artist||'')+'</span></li>'
      :'<li class="xp-empty">위 버튼을 누르면 그 앱으로 넘어가요. 곡을 고른 뒤 이 앱으로 돌아오면 재생·정지·곡 넘김을 여기서 할 수 있어요.</li>';
    if(ul.__h!==h){ul.__h=h;ul.innerHTML=h}}
  function bind(ul){if(!ul||ul.__xp)return;ul.__xp=1;ul.addEventListener('click',e=>{const b=e.target.closest('[data-xapp]');if(!b)return;e.stopPropagation();start(b.dataset.xapp);setTimeout(()=>render(ul),60)});subs.add(()=>render(ul))}
  return {PK,NAME,start,render,bind,view:'now'};
})();
// 외부 앱 창: 앱 버튼을 누르면 그 앱으로 전환해 선곡
document.querySelectorAll('[data-xstart]').forEach(b=>b.onclick=()=>{AmpExt.start(b.dataset.xstart);AmpExt.render($('#xPick'))});
AmpExt.bind($('#xPick'));
setInterval(()=>{const w=$('#wExt');if(mode==='ext'&&w&&!w.hidden&&!w.classList.contains('collapsed')&&!document.hidden)AmpExt.render($('#xPick'))},2000);
window.AmpTk={
  get gs(){return gs},get gpsOn(){return gpsOn},get spdNow(){return spdNow},get hdgNow(){return hdgNow},get gLimit(){return gLimit},
  get trip(){return trip},get att(){return att},get mode(){return mode},get list(){return list},get cur(){return cur},
  get driveOn(){return driveOn},get sos(){return sos},get ext(){return ext},get hudOn(){return hudOn},get wave(){return typeof W!=='undefined'?W:null},
  appMap:true,appClock:true,appPfd:true,
  gpsStart(){gpsStart()},gpsStop(u){gpsStop(u)},attWant(o){attWant(o)},attPoll(){attPoll()},attLevel(){attLevel()},
  setSkin(k){setSkin(k)},playIndex(i){playIndex(i)},toggle(){toggle()},prev(){prev()},next(){next()},setMode(m){setMode(m)},
  drive(o){drive(o);if(!o)driveSuppress=true},sndPress(o){sndPress(o)},sndAlarm(){sndAlarm()},openSettings(){openSettings()},toast(t){toast(t)},
  mapRefresh(){try{if(mapObj)mapObj.invalidateSize();mapUpdate(true)}catch(e){}},
  mapZoom(d){return mapZoom(d)},
  gaugeStyle(k){gStyle=k;$('#wGps').dataset.gs=k;const b=$('#spdBox');b.style.left='';b.style.width=''},gaugeRestore(){setGStyle(isCp()?store.get('gStyleCk','cockpit'):store.get('gStyle','carbon'))},
  get mapNight(){return mapNight},mapNightToggle(){$('#mapNight').click()}
};
/* ===== 75-dashcam.js ===== */
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
/* ===== 80-clock-windows.js ===== */
// 로고 옆 시계, 창 순서, 창 높이 조절
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 로고 옆 시계 ---------- */
const WORLD=[['','사용 안 함'],['America/New_York','뉴욕'],['America/Los_Angeles','로스앤젤레스'],['America/Chicago','시카고'],['America/Toronto','토론토'],['America/Vancouver','밴쿠버'],['Pacific/Honolulu','하와이'],['America/Sao_Paulo','상파울루'],['Europe/London','런던'],['Europe/Paris','파리'],['Europe/Berlin','베를린'],['Europe/Rome','로마'],['Europe/Madrid','마드리드'],['Europe/Istanbul','이스탄불'],['Asia/Dubai','두바이'],['Asia/Kolkata','인도'],['Asia/Bangkok','방콕'],['Asia/Ho_Chi_Minh','호찌민·하노이'],['Asia/Singapore','싱가포르'],['Asia/Manila','마닐라'],['Asia/Shanghai','베이징·상하이'],['Asia/Hong_Kong','홍콩'],['Asia/Taipei','타이베이'],['Asia/Tokyo','도쿄'],['Australia/Sydney','시드니'],['Pacific/Auckland','오클랜드'],['Pacific/Guam','괌']];
const HOME_TZ='Asia/Seoul';
let worldTz=store.get('worldTz','');
(function(){const sel=$('#sWorld');WORLD.forEach(([z,n])=>{const o=document.createElement('option');o.value=z;o.textContent=n;sel.appendChild(o)});sel.value=worldTz;
  sel.onchange=e=>{worldTz=e.target.value;store.set('worldTz',worldTz);clockTick()}})();
function tzParts(d,tz){const f=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'});
  const o={};f.formatToParts(d).forEach(p=>o[p.type]=p.value);return o}
const WD={Sun:'일',Mon:'월',Tue:'화',Wed:'수',Thu:'목',Fri:'금',Sat:'토'};
function clockTick(){const d=new Date();let h;try{h=tzParts(d,HOME_TZ)}catch(e){return}
  $('#clkTime').textContent=h.hour+':'+h.minute;$('#clkDate').textContent=(+h.month)+'.'+(+h.day)+' ('+WD[h.weekday]+')';
  const wb=$('#clkWorld');wb.classList.toggle('off',!worldTz);
  if(!worldTz){$('#clkCity').textContent='해외 시간';$('#clkWTime').textContent='+ 추가';$('#clkDiff').textContent='';return}
  let w;try{w=tzParts(d,worldTz)}catch(e){return}
  const name=(WORLD.find(x=>x[0]===worldTz)||[,worldTz])[1];
  const toMin=o=>Date.UTC(+o.year,+o.month-1,+o.day,+o.hour,+o.minute)/60000,diff=(toMin(w)-toMin(h))/60;
  const dd=Date.UTC(+w.year,+w.month-1,+w.day)-Date.UTC(+h.year,+h.month-1,+h.day);
  $('#clkCity').textContent=name+(dd>0?' · 다음날':dd<0?' · 전날':'');$('#clkWTime').textContent=w.hour+':'+w.minute;
  $('#clkDiff').textContent=diff===0?'시차 없음':(diff>0?'+':'−')+(Math.abs(diff)%1?Math.abs(diff).toFixed(1):Math.abs(diff))+'h'}
/* 아날로그(콕핏 계기) 시계 */
let clockStyle=store.get('clockStyle','analog');
function setClockStyle(v){clockStyle=v==='analog'?'analog':'digital';store.set('clockStyle',clockStyle);document.documentElement.dataset.clock=clockStyle;$('#sClockStyle').value=clockStyle;drawDials(true)}
$('#sClockStyle').onchange=e=>setClockStyle(e.target.value);
$('#clkNow').onclick=()=>{if(isCk())setClockStyle(clockStyle==='analog'?'digital':'analog')};
function tzHMS(d,tz){const f=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});const o={};f.formatToParts(d).forEach(p=>o[p.type]=p.value);return {h:+o.hour,m:+o.minute,s:+o.second+d.getMilliseconds()/1000}}
const CITY3={'Asia/Seoul':'SEL','America/New_York':'NYC','America/Los_Angeles':'LAX','America/Chicago':'CHI','America/Toronto':'YYZ','America/Vancouver':'YVR','Pacific/Honolulu':'HNL','America/Sao_Paulo':'SAO','Europe/London':'LON','Europe/Paris':'PAR','Europe/Berlin':'BER','Europe/Rome':'ROM','Europe/Madrid':'MAD','Europe/Istanbul':'IST','Asia/Dubai':'DXB','Asia/Kolkata':'DEL','Asia/Bangkok':'BKK','Asia/Ho_Chi_Minh':'SGN','Asia/Singapore':'SIN','Asia/Manila':'MNL','Asia/Shanghai':'PEK','Asia/Hong_Kong':'HKG','Asia/Taipei':'TPE','Asia/Tokyo':'TYO','Australia/Sydney':'SYD','Pacific/Auckland':'AKL','Pacific/Guam':'GUM'};
function drawDial(cv,t,code,night){if(CPX())return antClock(cv,t);const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  // 계기 장착판(모서리 나사)
  const pl=ctx.createLinearGradient(-R,-R,R,R);pl.addColorStop(0,DIAL().pl[0]);pl.addColorStop(1,DIAL().pl[1]);ctx.fillStyle=pl;ctx.beginPath();ctx.roundRect(-R+1,-R+1,S-2,S-2,S*.12);ctx.fill();
  ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const sx=x*R*.8,sy=y*R*.8,r=S*.035;const g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,0,sx,sy,r);g.addColorStop(0,DIAL().sc[0]);g.addColorStop(1,DIAL().sc[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();ctx.strokeStyle='#1a1d20';ctx.lineWidth=S*.008;ctx.beginPath();ctx.moveTo(sx-r*.7,sy-r*.7*(x*y));ctx.lineTo(sx+r*.7,sy+r*.7*(x*y));ctx.stroke()}
  // 베젤
  const bz=ctx.createLinearGradient(0,-R,0,R);bz.addColorStop(0,DIAL().bz[0]);bz.addColorStop(.5,DIAL().bz[1]);bz.addColorStop(1,DIAL().bz[2]);ctx.fillStyle=bz;ctx.beginPath();ctx.arc(0,0,R*.9,0,7);ctx.fill();
  ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  // 눈금
  for(let i=0;i<60;i++){const a=i/60*Math.PI*2,big=i%5===0,r1=R*.77,r2=big?R*.64:R*.71;ctx.strokeStyle=big?'#eef2e6':'#9fa99a';ctx.lineWidth=big?S*.022:S*.009;ctx.beginPath();ctx.moveTo(Math.sin(a)*r1,-Math.cos(a)*r1);ctx.lineTo(Math.sin(a)*r2,-Math.cos(a)*r2);ctx.stroke()}
  ctx.fillStyle='#eef2e6';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let n=1;n<=12;n++){const a=n/12*Math.PI*2,big=n%3===0;ctx.font=`700 ${big?S*.13:S*.085}px "Barlow Condensed","Rajdhani",sans-serif`;ctx.fillText(String(n),Math.sin(a)*R*.5,-Math.cos(a)*R*.5+S*.004)}
  ctx.font=`600 ${S*.07}px "Share Tech Mono",monospace`;ctx.fillStyle='#a8f08f';ctx.fillText(code,0,-R*.22);
  ctx.font=`600 ${S*.05}px "Barlow Condensed",sans-serif`;ctx.fillStyle='#9fa99a';ctx.fillText(night?'NIGHT':'DAY',0,R*.27);
  if(!t)return;
  const hand=(ang,len,wid,col,tail,lume)=>{ctx.save();ctx.rotate(ang);ctx.fillStyle='#000a';ctx.beginPath();ctx.moveTo(-wid/2+S*.01,tail+S*.01);ctx.lineTo(-wid/2+S*.01,-len+wid+S*.01);ctx.lineTo(S*.01,-len+S*.01);ctx.lineTo(wid/2+S*.01,-len+wid+S*.01);ctx.lineTo(wid/2+S*.01,tail+S*.01);ctx.fill();
    ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-wid/2,tail);ctx.lineTo(-wid/2,-len+wid);ctx.lineTo(0,-len);ctx.lineTo(wid/2,-len+wid);ctx.lineTo(wid/2,tail);ctx.closePath();ctx.fill();
    if(lume){ctx.fillStyle='#a8f08f';ctx.fillRect(-wid*.22,-len*.86,wid*.44,len*.5)}ctx.restore()};
  const sec=t.s,min=t.m+sec/60,hr=(t.h%12)+min/60;
  hand(hr/12*Math.PI*2,R*.42,S*.05,'#e7e9df',R*.1,true);
  hand(min/60*Math.PI*2,R*.66,S*.036,'#e7e9df',R*.12,true);
  ctx.save();ctx.rotate(sec/60*Math.PI*2);ctx.strokeStyle='#f3bc65';ctx.lineWidth=S*.012;ctx.beginPath();ctx.moveTo(0,R*.2);ctx.lineTo(0,-R*.72);ctx.stroke();ctx.fillStyle='#f3bc65';ctx.beginPath();ctx.arc(0,R*.16,S*.025,0,7);ctx.fill();ctx.restore();
  ctx.fillStyle='#1a1d20';ctx.beginPath();ctx.arc(0,0,S*.04,0,7);ctx.fill();ctx.fillStyle='#f3bc65';ctx.beginPath();ctx.arc(0,0,S*.018,0,7);ctx.fill();
  // 유리 반사
  const gl=ctx.createLinearGradient(-R*.6,-R*.8,R*.3,R*.2);gl.addColorStop(0,'#ffffff1f');gl.addColorStop(.45,'#ffffff05');gl.addColorStop(.46,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
let dialT=0;
function drawDials(force){const on=isCk()&&clockStyle==='analog'&&!document.hidden;if(!on&&!force)return;if(!on)return;
  const d=new Date();let a,b=null;try{a=tzHMS(d,HOME_TZ);if(worldTz)b=tzHMS(d,worldTz)}catch(e){return}
  drawDial($('#clkDialNow'),a,'SEL',a.h>=19||a.h<6);drawDial($('#clkDialW'),b,worldTz?(CITY3[worldTz]||'UTC'):'— — —',b?(b.h>=19||b.h<6):false)}
(function dialLoop(){drawDials();dialT=setTimeout(dialLoop,isCk()&&clockStyle==='analog'&&!pwrSaver?200:1000)})();
setClockStyle(clockStyle);
$('#clkWorld').onclick=()=>{openSettings();const r=$('#secClock');if(r){r.scrollIntoView({block:'center'});$('#sWorld').focus()}};
clockTick();setInterval(clockTick,1000);
/* ---------- 창 순서(설정) ---------- */
const WIN_NAME={wGps:'속도계',wCtl:'조종 패널',wAtc:'관제탑',wCam:'블랙박스',wMap:'지도',wMain:'플레이어',wVis:'재생 화면',wRadio:'라디오',wEq:'이퀄라이저',wPl:'재생 목록'};
function winKind(){return isCp()?'K':isCar()?'G':'N'}
function winDefault(){return {K:['wGps','wCtl','wAtc','wMap','wMain','wVis','wRadio','wEq','wPl','wCam'],G:['wGps','wMap','wMain','wVis','wRadio','wEq','wPl'],N:['wMain','wVis','wRadio','wEq','wPl']}[winKind()]}
function winOrder(){const d=winDefault(),o=store.get('winOrder_'+winKind(),null);if(!Array.isArray(o))return null;const f=o.filter(id=>d.includes(id));d.forEach(id=>{if(!f.includes(id))f.push(id)});return f}
function applyWinOrder(){const o=winOrder();appEl.classList.toggle('CO',!!o);
  document.querySelectorAll('#app>.win').forEach(w=>w.style.order='');
  if(o)o.forEach((id,i)=>{$('#'+id).style.order=i;if(id==='wPl')$('#wExt').style.order=i})}
function renderWinOrder(){const o=winOrder()||winDefault(),ul=$('#ordList');ul.innerHTML='';
  o.forEach((id,i)=>{const li=document.createElement('li');li.innerHTML=`<em>${i+1}</em><b>${WIN_NAME[id]}</b><button class="pill" data-d="-1" aria-label="${WIN_NAME[id]} 위로">▲</button><button class="pill" data-d="1" aria-label="${WIN_NAME[id]} 아래로">▼</button>`;
    li.dataset.id=id;li.children[2].disabled=i===0;li.children[3].disabled=i===o.length-1;ul.appendChild(li)});
  $('#ordReset').disabled=!winOrder()}
$('#ordList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.closest('li').dataset.id,o=(winOrder()||winDefault()).slice(),i=o.indexOf(id),j=i+ +b.dataset.d;
  if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];store.set('winOrder_'+winKind(),o);applyWinOrder();renderWinOrder();
  const nb=$('#ordList').querySelector(`li[data-id="${id}"] button[data-d="${b.dataset.d}"]`);if(nb&&!nb.disabled)nb.focus()};
$('#ordReset').onclick=()=>{store.set('winOrder_'+winKind(),null);applyWinOrder();renderWinOrder();toast('창 배치를 기본으로 되돌렸어요.')};
function openSettings(){renderWinOrder();$('#settings').hidden=false;syncSettings();clearInterval(setTimer);setTimer=setInterval(syncSettings,1000)}
function closeSettings(){$('#settings').hidden=true;clearInterval(setTimer)}
let setTimer=0;
function syncSettings(){
  $('#sDriveAuto').value=store.get('driveAuto','car');
  $('#sCarGps').checked=store.get('carGps',true);
  $('#secCar').hidden=!HAS_CAR;$('#secKey').hidden=!HAS_CAR;
  $('#sLib').textContent=LIB?`저장된 곡 ${list.filter(it=>it.lib).length}곡 · 마지막 곡과 위치를 기억해요`:'웹 버전에서는 목록이 저장되지 않아요. 앱에서 사용하세요.';
  if(!HAS_CAR)return;
  let c={};try{c=JSON.parse(NB.carStatus())}catch(e){}
  $('#sCarAuto').checked=!!c.autoplay;
  const sel=$('#sCarName'),names=[...new Set([...(c.connected||[]),c.carName].filter(Boolean))];
  const want=['',...names].join('|');if(sel.dataset.k!==want){sel.dataset.k=want;sel.innerHTML='<option value="">모든 블루투스 오디오 기기</option>'+names.map(n=>`<option></option>`).join('');[...sel.options].slice(1).forEach((o,i)=>{o.value=names[i];o.textContent=names[i]+((c.connected||[]).includes(names[i])?' (지금 연결됨)':'')})}
  sel.value=c.carName||'';
  $('#sBt').textContent=c.btPerm?'허용됨':'허용 필요';$('#sBt').classList.toggle('ok',!!c.btPerm);
  $('#sLaunch').textContent=c.autoLaunch?'허용됨':'허용하기';$('#sLaunch').classList.toggle('on',!c.autoLaunch);
  const k=$('#sKey');
  if(c.lastKey){const t=new Date(c.lastKeyAt);k.textContent=`${c.lastKey} · ${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;k.classList.add('ok')}
  else{k.textContent='아직 받은 신호가 없어요';k.classList.remove('ok')}
}
$('#setBtn').onclick=openSettings;$('#setClose').onclick=closeSettings;
$('#settings').addEventListener('click',e=>{if(e.target.id==='settings')closeSettings()});
$('#sDriveAuto').onchange=e=>store.set('driveAuto',e.target.value);
$('#sCarGps').onchange=e=>store.set('carGps',e.target.checked);
$('#sCarSrc').value=store.get('carSrc','auto');$('#sCarSrc').onchange=e=>store.set('carSrc',e.target.value);
$('#sCarAuto').onchange=e=>{try{NB.setCarAutoplay(e.target.checked)}catch(x){}};
$('#sCarName').onchange=e=>{try{NB.setCarName(e.target.value)}catch(x){}};
$('#sLaunch').onclick=()=>{try{NB.requestAutoLaunch()}catch(e){}};
$('#sBt').onclick=()=>{try{NB.setCarAutoplay($('#sCarAuto').checked||true);$('#sCarAuto').checked=true}catch(e){}};
$('#sDriveNow').onclick=()=>{closeSettings();drive(true);driveSuppress=false};

/* ---------- 창 높이 조절 ---------- */
// 자동차·드라이브·콕핏 스킨은 기존처럼 손잡이로 바로 조절, 나머지 스킨은 기본 크기로 고정하고 창 위쪽 버튼을 눌렀을 때만 조절
let winH=store.get('winH',{}),winHN=store.get('winHN',{});
const sizeMap=()=>isCar()?winH:winHN;
function saveSizes(){store.set('winH',winH);store.set('winHN',winHN)}
const needRz=w=>w.id==='wGps'||!isCar();
function applySizes(){const lock=isCp(),m=sizeMap();document.querySelectorAll('.win').forEach(w=>{const h=lock&&w.id!=='wGps'?0:m[w.id];w.style.height=h?h+'px':'';w.classList.toggle('sized',!!h);w.classList.toggle('rzw',needRz(w));if(!needRz(w)&&w.classList.contains('rz'))winRz(w,false)})}
document.querySelectorAll('.win').forEach(w=>{
  const gr=document.createElement('div');gr.className='grip';gr.title='끌어서 창 높이 조절 · 두 번 누르면 원래 높이';gr.setAttribute('role','separator');gr.setAttribute('aria-orientation','horizontal');w.appendChild(gr);
  let y0=0,h0=0,pid=null;
  gr.addEventListener('pointerdown',e=>{if(needRz(w)&&!w.classList.contains('rz'))return;e.preventDefault();pid=e.pointerId;gr.setPointerCapture(pid);y0=e.clientY;h0=w.getBoundingClientRect().height;w.classList.add('sizing')});
  gr.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;const h=Math.max(90,Math.round(h0+e.clientY-y0));if(fxOn(w)){fxSetH(h,true);return}w.style.height=h+'px';w.classList.add('sized')});
  const end=e=>{if(e.pointerId!==pid)return;pid=null;w.classList.remove('sizing');if(fxOn(w)){fxSetH(Math.round(w.getBoundingClientRect().height));return}if(w.classList.contains('sized')){sizeMap()[w.id]=Math.round(w.getBoundingClientRect().height);saveSizes()}};
  gr.addEventListener('pointerup',end);gr.addEventListener('pointercancel',end);
  gr.addEventListener('dblclick',()=>{if(fxOn(w)){if(w.classList.contains('rz'))fxSetH(0);return}if(needRz(w)&&!w.classList.contains('rz'))return;delete sizeMap()[w.id];saveSizes();applySizes()});
  // 창 위쪽 크기 조절 버튼 (속도계 창은 원래 있음)
  const bar=w.querySelector(':scope>.bar'),col=bar&&bar.querySelector('[data-col]');
  if(bar&&col&&!bar.querySelector('.rzbtn')){const b=document.createElement('button');b.className='wbtn rzbtn';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','창 크기 조절 켜기');b.title='창 크기 조절';b.innerHTML='<svg viewBox="0 0 10 10"><path d="M5 0 8 3H6v4h2l-3 3-3-3h2V3H2z"/></svg>';bar.insertBefore(b,col)}
  const rb=bar&&bar.querySelector('.rzbtn');if(rb)rb.addEventListener('click',e=>{e.stopPropagation();winRz(w,!w.classList.contains('rz'))});
  w.addEventListener('pointerup',()=>{if(w.classList.contains('rz')){clearTimeout(rzT[w.id]);rzT[w.id]=setTimeout(()=>winRz(w,false),15000)}});
});
const rzT={};
// 콕핏 2 바로가기 화면 높이(모든 보기 공통). 0이면 화면에 꽉 차게
const fxOn=w=>appEl.classList.contains('FX')&&w.classList.contains('fx');
function fxSetH(h,live){const r=document.documentElement;h=h?Math.max(200,Math.min(2400,Math.round(h))):0;if(h)r.style.setProperty('--fxH',h+'px');else r.style.removeProperty('--fxH');
  if(!live)store.set('fxH',h);clearTimeout(fxSetH.t);fxSetH.t=setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}try{if(mapObj)mapObj.invalidateSize()}catch(e){}window.dispatchEvent(new Event('resize'))},live?120:40)}
{const h=store.get('fxH',0);if(h)document.documentElement.style.setProperty('--fxH',h+'px')}
function rzStep(w,d){if(fxOn(w)){fxSetH(d===0?0:w.getBoundingClientRect().height+d);clearTimeout(rzT[w.id]);rzT[w.id]=setTimeout(()=>winRz(w,false),15000);return}
  const r=w.getBoundingClientRect();let h=d===0?0:Math.max(140,Math.round(r.height+d));
  if(!h){delete sizeMap()[w.id];saveSizes();applySizes()}else{w.style.height=h+'px';w.classList.add('sized');sizeMap()[w.id]=h;saveSizes()}
  if(w.id==='wGps'){try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}}
  clearTimeout(rzT[w.id]);rzT[w.id]=setTimeout(()=>winRz(w,false),15000)}
function winRz(w,on){const b=w.querySelector(':scope>.bar .rzbtn');w.classList.toggle('rz',on);
  let st=w.querySelector(':scope>.bar .rzsteps');
  if(!st&&b){st=document.createElement('span');st.className='rzsteps';st.innerHTML='<button class="wbtn" data-d="-80" aria-label="창 낮게">−</button><button class="wbtn" data-d="80" aria-label="창 높게">+</button><button class="wbtn wide" data-d="0" aria-label="원래 높이">원래</button>';
    st.addEventListener('click',e=>{const x=e.target.closest('button');if(!x)return;e.stopPropagation();rzStep(w,+x.dataset.d)});b.parentNode.insertBefore(st,b)}if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'창 크기 조절 끄기':'창 크기 조절 켜기')}
  clearTimeout(rzT[w.id]);if(on){toast('위쪽 − / + 버튼이나 창 아래 손잡이로 높이를 바꾸세요. 다 되면 ↕를 다시 누르세요.');rzT[w.id]=setTimeout(()=>winRz(w,false),15000)}}
function gpsRz(on){winRz($('#wGps'),on)}
const eqgridEl=$('#eqgrid');
new ResizeObserver(()=>{const sl=eqgridEl.querySelector('.slot');if(sl)eqgridEl.style.setProperty('--slot-h',sl.clientHeight+'px')}).observe(eqgridEl);
/* ===== 81-win-reorder.js ===== */
// 창 순서 바꾸기: 창 제목줄을 3초 누르고 있으면 창이 들려서, 끌어 놓은 자리로 옮김(설정 → 창 순서와 같은 저장)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 창 길게 눌러 옮기기 ---------- */
const WR={t:0,w:null,pid:null,x:0,y:0,lx:0,ly:0,on:false,order:null,before:'',raf:0,lastKey:'',lastAt:0};
const WR_HOLD=3000;
function wrCan(){return !appEl.classList.contains('FX')&&!document.documentElement.hasAttribute('data-split')&&!isTab()}
function wrBar(e){const bar=e.target&&e.target.closest&&e.target.closest('#app>.win>.bar');if(!bar||e.target.closest('button,select,input,a,label,.rzsteps'))return null;return bar}
function wrCancel(){clearTimeout(WR.t);if(WR.w)WR.w.classList.remove('lp');if(!WR.on){WR.w=null;WR.pid=null}}
function wrStart(){const w=WR.w;if(!w||!wrCan()){wrCancel();return}
  w.classList.remove('lp');WR.on=true;WR.order=(winOrder()||winDefault()).slice();WR.before=WR.order.join();WR.lastKey='';
  w.classList.add('wmove');appEl.classList.add('WR');try{navigator.vibrate&&navigator.vibrate(40)}catch(e){}
  toast('끌어서 놓을 자리로 옮기세요. 손을 떼면 저장돼요.');
  cancelAnimationFrame(WR.raf);WR.raf=requestAnimationFrame(wrLoop)}
// 화면 위·아래 끝에 손가락이 있으면 천천히 스크롤
function wrLoop(){if(!WR.on)return;const m=70,y=WR.ly;
  if(y<m)window.scrollBy(0,-Math.ceil((m-y)/5));else if(y>innerHeight-m)window.scrollBy(0,Math.ceil((y-innerHeight+m)/5));
  wrMove(WR.lx,WR.ly);WR.raf=requestAnimationFrame(wrLoop)}
function wrMove(x,y){const el=document.elementFromPoint(x,y),t=el&&el.closest('#app>.win');
  if(!t||t===WR.w||!WR.order.includes(t.id))return;
  const r=t.getBoundingClientRect(),wide=r.width>appEl.getBoundingClientRect().width*.6;
  const after=wide?y>r.top+r.height/2:x>r.left+r.width/2;
  const key=t.id+(after?'+':'-'),now=performance.now();
  if(key===WR.lastKey||now-WR.lastAt<280)return; // 자리가 바뀐 직후엔 잠깐 기다려 왔다 갔다 하지 않게
  const o=WR.order.filter(id=>id!==WR.w.id);let i=o.indexOf(t.id);if(after)i++;o.splice(i,0,WR.w.id);
  WR.lastKey=key;WR.lastAt=now;
  if(o.join()===WR.order.join())return;
  WR.order=o;store.set('winOrder_'+winKind(),o);applyWinOrder()}
function wrEnd(){const w=WR.w;WR.on=false;cancelAnimationFrame(WR.raf);clearTimeout(WR.t);
  if(w)w.classList.remove('wmove','lp');appEl.classList.remove('WR');WR.w=null;WR.pid=null;
  if(WR.order&&WR.order.join()!==WR.before){toast((WIN_NAME[w.id]||'창')+' 자리를 옮겼어요. 설정 → 창 순서에서 되돌릴 수 있어요.');if(!$('#settings').hidden)renderWinOrder()}
  WR.order=null}
document.addEventListener('pointerdown',e=>{if(e.button>0||WR.on)return;const bar=wrBar(e);if(!bar||!wrCan())return;const w=bar.parentElement;if(!winDefault().includes(w.id))return;
  wrCancel();WR.w=w;WR.pid=e.pointerId;WR.x=WR.lx=e.clientX;WR.y=WR.ly=e.clientY;w.classList.add('lp');WR.t=setTimeout(wrStart,WR_HOLD)},true);
document.addEventListener('pointermove',e=>{if(e.pointerId!==WR.pid)return;WR.lx=e.clientX;WR.ly=e.clientY;
  if(!WR.on&&Math.hypot(e.clientX-WR.x,e.clientY-WR.y)>12)wrCancel()},true); // 누르는 동안 움직이면(스크롤) 취소
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,e=>{if(e.pointerId!==WR.pid)return;if(WR.on)wrEnd();else wrCancel()},true));
document.addEventListener('touchmove',e=>{if(WR.on&&e.cancelable)e.preventDefault()},{passive:false}); // 옮기는 동안 화면이 같이 스크롤되지 않게
document.addEventListener('contextmenu',e=>{if(WR.w||wrBar(e))e.preventDefault()},true);
window.addEventListener('blur',()=>{if(WR.on)wrEnd();else wrCancel()});
/* ===== 85-cockpit-panel.js ===== */
// 콕핏 스킨 조종 패널
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- boot ---------- */
/* ---------- 콕핏 스킨: 조종 패널 · 관제탑 ---------- */
let fxc=null;
function fx(){try{if(!fxc)fxc=new (window.AudioContext||window.webkitAudioContext)();if(fxc.state==='suspended')fxc.resume();return fxc}catch(e){return null}}
function fxNoise(a,dur){const b=a.createBuffer(1,Math.ceil(a.sampleRate*dur),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=a.createBufferSource();s.buffer=b;return s}
function fxEnv(a,t,peak,att,dec){const g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec);return g}
// 버튼: 켜면 묵직하게 "철컥", 끄면 가볍게 "팅"
function sndPress(on){const a=fx();if(!a)return;const t=a.currentTime;
  const o=a.createOscillator();o.type='sine';o.frequency.setValueAtTime(on?110:220,t);o.frequency.exponentialRampToValueAtTime(on?42:130,t+.12);
  const g=fxEnv(a,t,on?.55:.3,.003,on?.16:.08);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.25);
  const n=fxNoise(a,.05),hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=on?1800:3200;const gn=fxEnv(a,t,on?.35:.25,.001,.03);n.connect(hp).connect(gn).connect(a.destination);n.start(t)}
// 무전 스퀠치("치익")
/* 관제탑 신호음: 잡음(직직) 없이 둥근 사인파로 — 점검 시작은 짧은 '똑', 확인은 작은 '띵' */
function sndSquelch(at=0,len=.14){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime+at,o=a.createOscillator();o.type='sine';o.frequency.setValueAtTime(1320,t);o.frequency.exponentialRampToValueAtTime(990,t+.06);
  const g=fxEnv(a,t,.05,.004,.08);o.connect(g).connect(a.destination);o.start(t);o.stop(t+.12)}
function sndRoger(at=0){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime+at,o=a.createOscillator(),o2=a.createOscillator();o.type='sine';o2.type='sine';o.frequency.value=1568;o2.frequency.value=3136;
  const g=fxEnv(a,t,.07,.005,.14),g2=a.createGain();g2.gain.value=.1;o.connect(g);o2.connect(g2).connect(g);g.connect(a.destination);o.start(t);o2.start(t);o.stop(t+.2);o2.stop(t+.2)}
/* 타이어 마찰음: 착륙은 바퀴가 닿는 순간 '끼익' 두 번(좌·우 바퀴) + 쿵, 이륙은 바퀴가 떨어질 때 짧은 마찰음과 굴러가던 소리가 잦아듦 */
function sndTire(down){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime;
  const screech=(at,dur,f0,f1,amp)=>{const n=fxNoise(a,dur+.05),bp=a.createBiquadFilter();bp.type='bandpass';bp.Q.value=7;bp.frequency.setValueAtTime(f0,t+at);bp.frequency.exponentialRampToValueAtTime(f1,t+at+dur);
    const g=a.createGain();g.gain.setValueAtTime(.0001,t+at);g.gain.linearRampToValueAtTime(amp,t+at+.015);g.gain.exponentialRampToValueAtTime(.0001,t+at+dur);n.connect(bp).connect(g).connect(a.destination);n.start(t+at);
    const o=a.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f0*.42,t+at);o.frequency.exponentialRampToValueAtTime(f1*.42,t+at+dur);const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
    const g2=a.createGain();g2.gain.setValueAtTime(.0001,t+at);g2.gain.linearRampToValueAtTime(amp*.18,t+at+.02);g2.gain.exponentialRampToValueAtTime(.0001,t+at+dur*.8);o.connect(lp).connect(g2).connect(a.destination);o.start(t+at);o.stop(t+at+dur)};
  const thump=(at,amp)=>{const o=a.createOscillator();o.type='sine';o.frequency.setValueAtTime(95,t+at);o.frequency.exponentialRampToValueAtTime(42,t+at+.18);const g=fxEnv(a,t+at,amp,.004,.2);o.connect(g).connect(a.destination);o.start(t+at);o.stop(t+at+.25)};
  const rumble=(at,dur,amp)=>{const n=fxNoise(a,dur+.05),lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;const g=a.createGain();g.gain.setValueAtTime(amp,t+at);g.gain.exponentialRampToValueAtTime(.0001,t+at+dur);n.connect(lp).connect(g).connect(a.destination);n.start(t+at)};
  if(down){screech(0,.42,2600,1300,.2);thump(0,.3);screech(.09,.36,2300,1200,.16);thump(.09,.22);rumble(.05,1.6,.12)}
  else{rumble(0,.7,.1);screech(.02,.18,1900,1500,.07)}}
// 이륙 허가: 무전 → 두 음 차임 → 엔진 스풀업
function sndTakeoff(){if(!atcOn())return;const a=fx();if(!a)return;const t=a.currentTime;
  [[784,.25],[659,.75]].forEach(([f,dt])=>{const o=a.createOscillator(),o2=a.createOscillator();o.frequency.value=f;o2.frequency.value=f*2;const g=fxEnv(a,t+dt,.22,.01,1.2),g2=fxEnv(a,t+dt,.05,.01,.6);o.connect(g).connect(a.destination);o2.connect(g2).connect(a.destination);o.start(t+dt);o2.start(t+dt);o.stop(t+dt+1.4);o2.stop(t+dt+1.4)});
  const s=t+1.6,L=6.5,n=fxNoise(a,L),lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(180,s);lp.frequency.exponentialRampToValueAtTime(3200,s+4);lp.frequency.exponentialRampToValueAtTime(900,s+L);
  const gn=a.createGain();gn.gain.setValueAtTime(.0001,s);gn.gain.exponentialRampToValueAtTime(.32,s+3.6);gn.gain.exponentialRampToValueAtTime(.0001,s+L);n.connect(lp).connect(gn).connect(a.destination);n.start(s);
  const w=a.createOscillator();w.type='sawtooth';w.frequency.setValueAtTime(160,s);w.frequency.exponentialRampToValueAtTime(2100,s+4.2);const bp=a.createBiquadFilter();bp.type='bandpass';bp.Q.value=6;bp.frequency.setValueAtTime(320,s);bp.frequency.exponentialRampToValueAtTime(4200,s+4.2);
  const gw=a.createGain();gw.gain.setValueAtTime(.0001,s);gw.gain.exponentialRampToValueAtTime(.05,s+3.4);gw.gain.exponentialRampToValueAtTime(.0001,s+L);w.connect(bp).connect(gw).connect(a.destination);w.start(s);w.stop(s+L)}
function atcOn(){return store.get('atcSound',true)!==false}
// 조종 패널 한 줄: 설계 너비(860px)보다 좁으면 모듈 줄을 통째로 줄임(다섯 칸 그대로)
(function(){const d=document.querySelector('#dkControlDeck');if(!d)return;const BASE=860;
  const fit=()=>{const w=d.parentElement?d.parentElement.clientWidth:0;if(!w)return;const z=w<BASE?Math.max(.38,w/BASE):1;const v=z===1?'':z.toFixed(3);if(d.style.zoom!==v)d.style.zoom=v};
  new ResizeObserver(fit).observe(d.parentElement);fit()})();
/* ===== 86-reverse-atc.js ===== */
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
  {me:1,t:'관제탑, 대신남 원. 출발 전 점검을 요청합니다.'},
  {t:'대신남 원, 관제탑. 출발 전 점검을 시작합니다.'},
  {t:'좌석 위치와 안전벨트 착용 확인',c:'CHECK'},
  {t:'브레이크 페달 작동 확인',c:'CHECK'},
  {t:'사이드미러 · 룸미러 각도 확인',c:'CHECK'},
  {t:'연료 · 배터리 잔량 확인',c:'CHECK'},
  {t:'전조등 · 계기판 조명 확인',c:'CHECK'},
  {t:'GPS 위성 수신 확인',c:()=>gpsOn&&gs.fix?['위성 '+(gs.satsUsed||'-'),'ok']:[gpsOn?'수신 대기':'GPS 꺼짐','warn']},
  {t:'오디오 시스템 확인',c:()=>{const v=dk.state.volumeKnown?dk.state.volume:-1;return v===0?['MUTE','warn']:[v<0?'VOL ON':'VOL '+v,'ok']}},
  {t:'휴대폰 거치 · 내비게이션 경로 확인',c:'CHECK'},
  {me:1,t:'관제탑, 대신남 원. 출발 준비 완료.'},
  {t:'대신남 원, 활주로 진입 허가. 바람 잔잔, 이륙을 허가합니다.',fin:1}];
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
    if(it.fin){await sleep(900);if(!live())return;log.innerHTML='';$('#atcClr').hidden=false;$('#atcSt').textContent='· 이륙 허가';atcDone=true;sndTakeoff();setTimeout(()=>{if(live())atcSpeak('대신남 원, 이륙을 허가합니다. 안전 운행하십시오.')},1300);return}
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
  w.querySelector('span').textContent='대신남 원, 시속 '+m+'km를 넘었습니다. '+(m>=120?'즉시 감속하십시오.':'속도에 주의하십시오.');
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
  atcSpeak('슬로우 다운. 슬로우 다운. 대신남 원, 시속 '+m+'킬로미터를 넘었습니다. 감속하십시오.');
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
/* ===== 88-bench.js ===== */
// 설정 › 그래픽 성능 테스트: 이 앱이 실제로 그리는 것과 비슷한 장면(하늘·구름·활주로 원근·등화 빛 번짐·글자·스펙트럼)을
// 3단계로 무겁게 그려 초당 프레임을 재고, 계산 속도·기기 정보와 함께 점수와 추천 설정을 보여 줍니다.
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
(function(){
  const STAGES=[['가벼움 · 계기',1],['보통 · 비행 화면',2],['무거움 · 비행+날씨+시각화',4]],DUR=4500;
  let run=0;
  const spr=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'#fff');r.addColorStop(.15,'#ffd28acc');r.addColorStop(1,'#ffd28a00');g.fillStyle=r;g.fillRect(0,0,64,64);return c})();
  const cloud=(()=>{const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d');for(let i=0;i<14;i++){const x=30+i*14,y=50-Math.sin(i/13*Math.PI)*22,r=26+((i*37)%13),gr=g.createRadialGradient(x,y-6,2,x,y,r);gr.addColorStop(0,'#fff');gr.addColorStop(.7,'#e3e9f0');gr.addColorStop(1,'#cfd8e200');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill()}return c})();
  function frame(g,W,H,k,t){
    const hz=H*.45;let gr=g.createLinearGradient(0,0,0,hz);gr.addColorStop(0,'#2d5f9a');gr.addColorStop(1,'#a9c8e6');g.fillStyle=gr;g.fillRect(0,0,W,hz);
    for(let i=0;i<10*k;i++){const x=((i*173+t*.02*(1+i%3))%(W+300))-150,y=hz*(.15+(i*37%60)/100);g.globalAlpha=.85;g.drawImage(cloud,x,y,200+i%5*40,75+i%4*12)}g.globalAlpha=1;
    gr=g.createLinearGradient(0,hz,0,H);gr.addColorStop(0,'#6f8a55');gr.addColorStop(1,'#2f4520');g.fillStyle=gr;g.fillRect(0,hz,W,H-hz);
    g.fillStyle='#55595e';g.beginPath();g.moveTo(W*.48,hz);g.lineTo(W*.52,hz);g.lineTo(W*.95,H);g.lineTo(W*.05,H);g.closePath();g.fill();
    for(let z=0;z<60*k;z++){const f=((z*.05+t*.0006)%1),y=hz+(H-hz)*f*f,w=W*.45*f*f;g.fillStyle='#f3f2ec';g.globalAlpha=.9;g.fillRect(W/2-w*.02,y,w*.04+1,2+f*8)}
    g.globalCompositeOperation='lighter';for(let i=0;i<80*k;i++){const f=((i/(80*k))+t*.0003)%1,y=hz+(H-hz)*f*f,x=W/2+(i%2?1:-1)*W*.45*f*f,s=6+f*40;g.globalAlpha=.8;g.drawImage(spr,x-s/2,y-s/2,s,s)}
    g.globalCompositeOperation='source-over';g.globalAlpha=1;
    if(k>=4){for(let i=0;i<300;i++){const x=(i*97+t*.3)%W,y=(i*53+t*.9)%H;g.fillStyle='#bcd6ff88';g.fillRect(x,y,1.5,12)}
      const n=64,bw=W/n;for(let i=0;i<n;i++){const v=(Math.sin(t*.006+i*.4)*.5+.5)*(.3+.7*Math.abs(Math.sin(i*1.7)));const hh=H*.25*v;gr=g.createLinearGradient(0,H-hh,0,H);gr.addColorStop(0,'#ffe2a6');gr.addColorStop(1,'#a8f08f');g.fillStyle=gr;g.fillRect(i*bw+1,H-hh,bw-2,hh)}}
    g.font=`700 ${Math.round(Math.min(H*.04,W*.05))}px "Share Tech Mono",monospace`;g.fillStyle='#f4ecd2';for(let i=0;i<6*k;i++)g.fillText(String((t/10+i*13|0)%300),W*.05+(i%6)*W*.15,H*.08+Math.floor(i/6)*H*.06);
  }
  function cpuScore(){const t0=performance.now();let x=0;for(let i=0;i<3e6;i++)x+=Math.sin(i)*Math.sqrt(i%97+1);const ms=performance.now()-t0;return {ms:Math.round(ms),x}}
  function gpuName(){try{const c=document.createElement('canvas'),gl=c.getContext('webgl');if(!gl)return '—';const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}catch(e){return '—'}}
  async function start(){const id=++run,ov=$('#bench'),cv=$('#benchCv'),res=$('#bnRes');ov.hidden=false;res.hidden=true;
    const d=Math.min(2,devicePixelRatio||1),W=cv.width=Math.round(cv.offsetWidth*d),H=cv.height=Math.round(cv.offsetHeight*d),g=cv.getContext('2d');
    const out=[];
    for(const [name,k] of STAGES){$('#bnStage').textContent=name;let n=0,worst=0,last=performance.now();const t0=last;
      await new Promise(done=>{const step=now=>{if(id!==run)return done();frame(g,W,H,k,now);n++;const dt=now-last;last=now;if(n>3)worst=Math.max(worst,dt);
        const el=now-t0;if(n%10===0)$('#bnFps').textContent=Math.round(n/(el/1000))+' fps';if(el<DUR)requestAnimationFrame(step);else done()};requestAnimationFrame(step)});
      if(id!==run)return;out.push({name,fps:n/(DUR/1000),worst})}
    $('#bnStage').textContent='계산 속도 측정';await new Promise(r=>setTimeout(r,50));const cpu=cpuScore();
    const fps=out.map(o=>Math.min(60,o.fps)),score=Math.round(fps[0]/60*200+fps[1]/60*400+fps[2]/60*300+Math.max(0,Math.min(100,(600-cpu.ms)/5)));
    const lv=score>=820?'good':score>=560?'mid':'low';
    $('#bnScore').textContent=score;const vd=$('#bnVerdict');vd.className=lv;vd.textContent={good:'충분해요 — 모든 효과를 부드럽게 쓸 수 있어요',mid:'보통 — 대부분 괜찮지만 무거운 장면에서 끊길 수 있어요',low:'부족해요 — 절전 모드를 권장해요'}[lv];
    const rows=[...out.map(o=>[o.name,Math.round(o.fps)+' fps · 가장 긴 멈춤 '+Math.round(o.worst)+' ms']),['계산 속도',cpu.ms+' ms'],['화면',`${screen.width}×${screen.height} · 배율 ${(devicePixelRatio||1).toFixed(2)}`],['CPU 코어',navigator.hardwareConcurrency||'—'],['메모리',navigator.deviceMemory?navigator.deviceMemory+' GB 이상':'—'],['그래픽',gpuName()]];
    const tb=$('#bnTable');tb.innerHTML='';for(const [k,v] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;tb.append(dt,dd)}
    $('#bnAdvice').textContent={good:'추천: 절전 모드 "자동", 비행 장면 품질 "높음". 지금 설정 그대로 쓰면 돼요.',mid:'추천: 절전 모드 "자동", 비행 장면 품질 "균형"(그림자·질감 일부 생략). 무거운 날씨 효과에서 끊기면 절전 모드를 켜세요.',low:'추천: 절전 모드 "항상 켜기"(화면 갱신을 줄임), 비행 장면 품질 "균형". 시각화 효과는 가벼운 것(SPECTRUM 등)을 쓰세요.'}[lv];
    $('#bnApply').dataset.lv=lv;store.set('benchLast',{score,lv,at:Date.now()});$('#sBench').textContent='그래픽 테스트 (최근 '+score+'점)';
    res.hidden=false}
  function apply(lv){const ps=store.get('pfdSet',{})||{};ps.sceneQuality=lv==='good'?'high':'balanced';store.set('pfdSet',ps);
    try{window.AmpPfd&&AmpPfd.panel&&AmpPfd.panel.setSettings({sceneQuality:ps.sceneQuality})}catch(e){}
    store.set('pwrMode',lv==='low'?'on':'auto');try{pwrApply()}catch(e){}toast('추천 설정을 적용했어요.')}
  function close(){run++;$('#bench').hidden=true}
  $('#sBench').onclick=()=>{try{closeSettings&&closeSettings()}catch(e){}start()};
  $('#bnAgain').onclick=start;$('#bnClose').onclick=close;$('#bnApply').onclick=()=>{apply($('#bnApply').dataset.lv);close()};
  {const l=store.get('benchLast',null);if(l&&l.score)$('#sBench').textContent='그래픽 테스트 (최근 '+l.score+'점)'}
  window.AmpBench={start,close};
})();
/* ===== 89-speedcam.js ===== */
// 과속 카메라 안내: 지도 자료(OpenStreetMap, 주변 자동) + 공공데이터 CSV(전국, 직접 불러오기)
// 진행 방향 앞쪽 카메라를 찾아 짧은 음성("500미터 앞 단속 카메라, 50이에요")과 화면 전체 빨간 제한 속도로 알림.
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
(function(){
  const camOn=()=>store.get('camOn',true)!==false;
  let osm=[],osmAt=null,osmBusy=false,osmT=0,db=null;           // [lat,lon,limit]
  const loadDb=()=>{if(db)return db;try{db=JSON.parse(localStorage.getItem('dna_camDb')||'null')||[]}catch(e){db=[]}return db};
  const R=6371000,rad=x=>x*Math.PI/180;
  const dist=(a,b,c,d)=>{const p=rad(c-a),q=rad(d-b),h=Math.sin(p/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(q/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
  const brg=(a,b,c,d)=>{const y=Math.sin(rad(d-b))*Math.cos(rad(c)),x=Math.cos(rad(a))*Math.sin(rad(c))-Math.sin(rad(a))*Math.cos(rad(c))*Math.cos(rad(d-b));return (Math.atan2(y,x)*180/Math.PI+360)%360};
  const limOf=v=>{const m=String(v||'').match(/\d{2,3}/);const n=m?+m[0]:0;return n>=20&&n<=130?n:0};
  /* 1) OpenStreetMap: 지금 위치 반경 8km의 과속 카메라(highway=speed_camera) — 3km 넘게 움직이면 다시 받음 */
  async function osmFetch(lat,lon){if(osmBusy||Date.now()-osmT<90e3)return;osmBusy=true;osmT=Date.now();
    const q=`[out:json][timeout:20];(node["highway"="speed_camera"](around:8000,${lat.toFixed(5)},${lon.toFixed(5)});node["enforcement"="maxspeed"](around:8000,${lat.toFixed(5)},${lon.toFixed(5)}););out body;`;
    for(const ep of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
      try{const r=await fetch(ep,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});if(!r.ok)continue;const j=await r.json();
        osm=(j.elements||[]).filter(e=>e.lat&&e.lon).map(e=>[e.lat,e.lon,limOf(e.tags&&(e.tags.maxspeed||e.tags['maxspeed:forward']))]);osmAt=[lat,lon];break}catch(e){}}
    osmBusy=false;statUi()}
  /* 2) 공공데이터 CSV(전국무인교통단속카메라표준데이터): 위도·경도·제한속도 열을 찾아 압축 저장 */
  function parseCsv(text){const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2)return [];
    const split=l=>{const o=[];let cur='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q){o.push(cur);cur=''}else cur+=ch}o.push(cur);return o.map(x=>x.trim())};
    const h=split(lines[0]),fi=re=>h.findIndex(x=>re.test(x));const iLat=fi(/위도|lat/i),iLon=fi(/경도|lon|lng/i),iLim=fi(/제한속도|maxspeed|limit/i),iKind=fi(/단속구분|구분/);
    if(iLat<0||iLon<0)return null;const out=[];
    for(let i=1;i<lines.length;i++){const c=split(lines[i]),la=+c[iLat],lo=+c[iLon];if(!(la>32&&la<39.5&&lo>124&&lo<132))continue;
      const kind=iKind>=0?c[iKind]:'';if(kind&&/신호|주정차|버스|안전띠/.test(kind)&&!/과속/.test(kind))continue;out.push([+la.toFixed(6),+lo.toFixed(6),iLim>=0?limOf(c[iLim]):0])}
    return out}
  async function importFile(f){const buf=await f.arrayBuffer();let t=new TextDecoder('utf-8').decode(buf);if(/\uFFFD/.test(t.slice(0,2000))){try{t=new TextDecoder('euc-kr').decode(buf)}catch(e){}}
    const rows=parseCsv(t);if(!rows){toast('위도·경도 열을 찾지 못했어요. 공공데이터 "전국무인교통단속카메라표준데이터" CSV인지 확인해 주세요.');return}
    try{localStorage.setItem('dna_camDb',JSON.stringify(rows));db=rows;toast('과속 카메라 '+rows.length.toLocaleString()+'곳을 불러왔어요.')}catch(e){toast('저장 공간이 부족해 불러오지 못했어요.')}statUi()}
  function statUi(){const el=$('#sCamStat');if(!el)return;const a=loadDb().length;el.textContent=(a?'공공데이터 '+a.toLocaleString()+'곳':'공공데이터 없음')+' · 지도 자료 주변 '+osm.length+'곳'+(osmAt?'':' (GPS·인터넷 연결 후 받음)')}
  /* 안내: 진행 방향 ±35° 안, 1.2km 이내에서 가장 가까운 카메라 */
  const told=new Map();let cur=null,lastSay=0;
  // 말은 짧게, 사람이 옆에서 알려 주듯: "500미터 앞 단속 카메라, 50이에요." / "속도 줄이세요."
  const sayFar=(m,lim)=>m+'미터 앞 단속 카메라'+(lim?', '+lim+'이에요.':'예요.'),SAY_NEAR='속도 줄이세요.';
  function say(t){try{if(NB&&NB.speakCam){NB.speakCam(t);return}if(NB&&NB.speak){NB.speak(t);return}}catch(e){}
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';u.rate=1.08;u.pitch=1.02;
      const v=(speechSynthesis.getVoices()||[]).filter(x=>/^ko/i.test(x.lang));const nat=v.find(x=>/natural|neural|online|google/i.test(x.name))||v[0];if(nat)u.voice=nat;speechSynthesis.speak(u)}catch(e){}}
  function ding(){try{const a=fx();if(!a)return;const t=a.currentTime;[0,.16].forEach((dt,i)=>{const o=a.createOscillator();o.type='sine';o.frequency.value=i?1320:990;const g=fxEnv(a,t+dt,.16,.005,.18);o.connect(g).connect(a.destination);o.start(t+dt);o.stop(t+dt+.25)})}catch(e){}}
  function nearAll(lat,lon){const out=[];for(const src of [loadDb(),osm])for(const c of src){if(Math.abs(c[0]-lat)>.012||Math.abs(c[1]-lon)>.016)continue;const d=dist(lat,lon,c[0],c[1]);if(d<1300)out.push({c,d})}
    out.sort((a,b)=>a.d-b.d);const uniq=[];for(const o of out)if(!uniq.some(u=>dist(u.c[0],u.c[1],o.c[0],o.c[1])<35))uniq.push(o);return uniq}
  function check(lat,lon,spd,hdg){if(!camOn()){show(null);return}
    if(!osmAt||dist(lat,lon,osmAt[0],osmAt[1])>3000)osmFetch(lat,lon);
    let best=null;if(spd>=12&&hdg>=0)for(const o of nearAll(lat,lon)){const b=brg(lat,lon,o.c[0],o.c[1]),df=Math.abs(((b-hdg+540)%360)-180);if(df<=35&&o.d<=1200){best=o;break}}
    show(best?{lim:best.c[2],d:best.d,over:best.c[2]&&spd>best.c[2]+2}:null,spd);
    if(!best)return;const key=best.c[0].toFixed(5)+','+best.c[1].toFixed(5),st=told.get(key)||{};
    const lim=best.c[2],m=Math.max(100,Math.round(best.d/100)*100);
    if(!st.far&&best.d<=650){st.far=true;ding();say(sayFar(m,lim))}
    if(!st.near&&best.d<=180&&lim&&spd>lim+2){st.near=true;say(SAY_NEAR)}
    st.t=Date.now();told.set(key,st);if(told.size>200)for(const [k,v] of told)if(Date.now()-v.t>6e5)told.delete(k)}
  function show(o,spd){const el=$('#camSign');if(!o){el.hidden=true;document.documentElement.removeAttribute('data-cam');return}
    el.hidden=false;document.documentElement.setAttribute('data-cam','1');$('#camLim').textContent=o.lim||'!';$('#camDist').textContent='전방 '+(o.d>=1000?(o.d/1000).toFixed(1)+'km':Math.round(o.d/10)*10+'m');el.classList.toggle('over',!!o.over)}
  setInterval(()=>{if(demoOn)return;if(!gpsOn||!gs||!gs.fix||!isFinite(gs.lat)){show(null);return}check(+gs.lat,+gs.lon,spdNow,hdgNow)},1000);
  $('#sCam').checked=camOn();$('#sCam').onchange=e=>{store.set('camOn',e.target.checked);if(!e.target.checked)show(null)};
  $('#sCamCsv').onclick=()=>$('#sCamFile').click();$('#sCamFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)importFile(f);e.target.value=''};
  $('#sCamClr').onclick=()=>{try{localStorage.removeItem('dna_camDb')}catch(e){}db=[];statUi();toast('불러온 과속 카메라 자료를 지웠어요.')};
  /* 예시: 실제 안내와 같은 소리·음성·표지판을 약 8초 동안 보여 줌(50km 구간을 70km/h로 다가가는 상황) */
  document.body.appendChild($('#camSign')); // 어느 창·설정 위에도 보이게 맨 위층으로
  let demoT=[],demoOn=false;
  function demo(){demoT.forEach(clearTimeout);demoT=[];const el=$('#camSign');el.classList.add('demo');demoOn=true;
    const steps=[[0,600,false],[1200,500,false],[2400,400,false],[3600,300,true],[4800,200,true],[5800,150,true],[6800,80,true]];
    steps.forEach(([t,d,over])=>demoT.push(setTimeout(()=>show({lim:50,d,over},70),t)));
    demoT.push(setTimeout(()=>{ding();say(sayFar(600,50))},0));
    demoT.push(setTimeout(()=>{try{sndAlarm()}catch(e){}say(SAY_NEAR)},5800));
    demoT.push(setTimeout(()=>{demoOn=false;show(null);el.classList.remove('demo')},8600))}
  $('#sCamDemo').onclick=e=>{e.preventDefault();e.stopPropagation();demo()};
  statUi();
  window.AmpCam={demo,check,parseCsv,set osm(a){osm=a;osmAt=[0,0];osmT=Date.now()},get osm(){return osm},show,statUi};
})();
/* ===== 90-radio.js ===== */
// 인터넷 라디오
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 인터넷 라디오: 공개 목록(radio-browser.info)에서 찾고, 즐겨찾기·다이얼로 맞춰 듣기 ---------- */
const RD_SERVERS=['https://de1.api.radio-browser.info','https://de2.api.radio-browser.info','https://fi1.api.radio-browser.info','https://all.api.radio-browser.info'];
// 서울 FM 주파수(방송 이름으로 찾기)
const RD_FREQ=[[/cool\s*fm|kbs\s*2\s*fm|쿨\s*fm/i,89.1],[/happy\s*fm|kbs\s*2\s*(radio|라디오)|해피/i,106.1],[/kbs\s*1\s*fm|클래식\s*fm|classic\s*fm/i,93.1],[/kbs\s*1\s*(radio|라디오)|kbs\s*1r/i,97.3],
  [/fm\s*4\s*u|mbc\s*fm4u/i,91.9],[/mbc\s*(표준|standard)|mbc\s*radio|mbc\s*sfm/i,95.9],[/mbc\s*fm(?!\s*4)|mbc\s*mfm/i,91.9],[/power\s*fm|파워\s*fm/i,107.7],[/love\s*fm|러브\s*fm/i,103.5],[/cbs\s*(music|음악)/i,93.9],[/cbs\s*(표준|standard)/i,98.1],
  [/ebs/i,104.5],[/tbs\s*eFM|tbs\s*efm/i,101.3],[/tbs/i,95.1],[/bbs|불교방송/i,101.9],[/pbc|평화방송/i,105.3],[/febc|극동방송/i,106.9],[/ytn/i,94.5],[/ifm|경인/i,90.7],[/국방|kfn/i,100.5],[/afn|eagle/i,102.7]];
const rdFreqOf=st=>{if(st&&st.ofc)return st.freq;const n=(st.name||'')+' '+(st.tags||'');for(const [re,f] of RD_FREQ)if(re.test(n))return f;return st.freq||null};
// 방송사 공식 주소(서울). api: 는 재생할 때마다 임시 주소를 새로 받아 옴 — 안 되면 공개 목록의 다른 주소로 자동 전환
const RD_KR=[
  ['kbs1r','KBS 1라디오',97.3,'api:https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/21','KBS 1Radio'],
  ['kbs2r','KBS 해피FM',106.1,'api:https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/22','KBS Happy FM'],
  ['kbs1fm','KBS 클래식FM',93.1,'api:https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/24','KBS Classic FM'],
  ['kbs2fm','KBS 쿨FM',89.1,'api:https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/25','KBS Cool FM'],
  ['mbcsfm','MBC 표준FM',95.9,'api:https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=sfm|https://sminiplay.imbc.com/aacplay.ashx?agent=android&channel=sfm&protocol=M3U8|https://miniplay.imbc.com/WebHLS.ashx?channel=sfm&protocol=M3U8&agent=android&androidversion=24','MBC Standard FM'],
  ['mbcfm4u','MBC FM4U',91.9,'api:https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=mfm|https://sminiplay.imbc.com/aacplay.ashx?agent=android&channel=mfm&protocol=M3U8|https://miniplay.imbc.com/WebHLS.ashx?channel=mfm&protocol=M3U8&agent=android&androidversion=24','MBC FM4U'],
  ['sbslove','SBS 러브FM',103.5,'api:https://apis.sbs.co.kr/play-api/1.0/livestream/lovepc/lovefm?protocol=hls&ssl=Y','SBS Love FM'],
  ['sbspower','SBS 파워FM',107.7,'api:https://apis.sbs.co.kr/play-api/1.0/livestream/powerpc/powerfm?protocol=hls&ssl=Y','SBS Power FM'],
  ['cbsmusic','CBS 음악FM',93.9,'https://m-aac.cbs.co.kr/mweb_cbs939/_definst_/cbs939.stream/playlist.m3u8','CBS Music FM'],
  ['cbsstd','CBS 표준FM',98.1,'https://m-aac.cbs.co.kr/mweb_cbs981/_definst_/cbs981.stream/playlist.m3u8','CBS Standard FM'],
  ['ebsfm','EBS FM',104.5,'https://ebsonair.ebs.co.kr/fmradiofamilypc/familypc1m/playlist.m3u8','EBS FM']
].map(([id,name,freq,url,q])=>({id:'kr-'+id,name,freq,url,q,tags:'방송사 공식',codec:'',br:0,cc:'KR',fav:'',ofc:true}));
// 공식 주소가 없는 서울 FM: 공개 목록에서 찾을 이름
const RD_Q={95.1:'TBS',101.3:'TBS eFM',101.9:'BBS',105.3:'PBC',106.9:'FEBC',94.5:'YTN',90.7:'iFM',100.5:'국군방송',102.7:'AFN'};
const RD_BLOCK=/평양|pyongyang|조선중앙|조선의\s*소리|voice\s*of\s*korea|dprk|north\s*korea|kcbs|kctv|朝鮮/i;
let rdFavs=(store.get('rdFavs',[])||[]).filter(x=>!RD_BLOCK.test(x.name||'')),rdList=[],rdCur=store.get('rdLast',null),rdPlaying=false,rdTune=null;
const rdAudio=new Audio();rdAudio.preload='none';rdAudio.volume=store.get('rdVol',80)/100;
const RD_SAY={'ON AIR':['on','연결됨','방송 수신 중'],'대기':['idle','대기','']};
function rdSay(t){rdSt0=t;const m=RD_SAY[t]||[/할 수 없|끊김/.test(t)?'err':/중…$/.test(t)?'busy':'idle',t,t];$('#wRadio').dataset.st=m[0];$('#rdSt').textContent=m[1];
  const el=$('#rdStat');if(el)el.textContent=m[2]||(rdCur?'일시정지됨':'아래 목록에서 고르거나 다이얼을 돌려 맞추세요');if(typeof rdLamps==='function')rdLamps()}
async function rdApi(path){let last;for(const s of RD_SERVERS){try{const r=await fetch(s+path,{headers:{'Accept':'application/json'}});if(r.ok)return await r.json();last=r.status}catch(e){last=e}}throw last}
function rdOk(o){return o&&o.url&&(o.cc||'').toUpperCase()!=='KP'&&!RD_BLOCK.test((o.name||'')+' '+(o.tags||''))}
function rdNorm(o){return {id:o.stationuuid||o.id||o.url,name:(o.name||'').trim()||'이름 없음',url:o.url_resolved||o.url,fav:o.favicon||o.fav||'',tags:(o.tags||'').split(',').slice(0,3).join(' · '),codec:o.codec||'',br:o.bitrate||0,cc:o.countrycode||o.cc||''}}
async function rdSearch(q){const cc=$('#rdCountry').value,ul=$('#rdList');ul.innerHTML='<li class="msg">찾는 중…</li>';
  const qs=new URLSearchParams({hidebroken:'true',order:'votes',reverse:'true',limit:'80'});if(cc)qs.set('countrycode',cc);if(q)qs.set('name',q);
  try{rdList=(await rdApi('/json/stations/search?'+qs)).map(rdNorm).filter(rdOk);rdRenderList()}
  catch(e){rdList=[];rdRenderList();const m=ul.querySelector('.msg');if(m)m.textContent='공개 목록을 불러오지 못했어요. 위 공식 방송은 들을 수 있어요.'}}
function rdOfcShown(){const q=($('#rdQ').value||'').trim().toLowerCase(),cc=$('#rdCountry').value;if(cc&&cc!=='KR')return [];return RD_KR.filter(s=>!q||(s.name+' '+s.q).toLowerCase().includes(q))}
function rdRenderList(){const ul=$('#rdList');ul.innerHTML='';
  rdOfcShown().forEach(st=>{const li=document.createElement('li');li.dataset.o=st.id;li.className='off'+(rdCur&&rdCur.id===st.id?' on':'');
    li.innerHTML='<i>📻</i><div><b></b><small></small></div><em></em><button aria-label="즐겨찾기"></button>';li.querySelector('b').textContent=st.name;
    const o=document.createElement('span');o.className='ofc';o.textContent='공식';li.querySelector('b').appendChild(o);li.querySelector('small').textContent='방송사 공식 스트림 · 안 되면 다른 주소로 자동 전환';
    li.querySelector('em').textContent=st.freq.toFixed(1);li.querySelector('button').textContent=rdFavs.some(x=>x.id===st.id)?'★':'☆';ul.appendChild(li)});
  if(!rdList.length){const m=document.createElement('li');m.className='msg';m.textContent=rdOfcShown().length?'공개 목록에서 더 찾은 방송이 없어요.':'찾은 방송이 없어요.';ul.appendChild(m);return}
  rdList.forEach((st,i)=>{const li=document.createElement('li');li.dataset.i=i;if(rdCur&&rdCur.id===st.id)li.className='on';const f=rdFreqOf(st);
    li.innerHTML='<i>📻</i><div><b></b><small></small></div><em></em><button aria-label="즐겨찾기"></button>';
    if(st.fav){const im=new Image();im.alt='';im.referrerPolicy='no-referrer';im.onload=()=>li.firstChild.replaceWith(im);im.src=st.fav}
    li.querySelector('b').textContent=st.name;li.querySelector('small').textContent=[st.tags,st.codec&&(st.codec+(st.br?' '+st.br+'k':''))].filter(Boolean).join(' · ');
    li.querySelector('em').textContent=f?f.toFixed(1):'';li.querySelector('button').textContent=rdFavs.some(x=>x.id===st.id)?'★':'☆';ul.appendChild(li)})}
/* 키캡 누르는 소리: 짧은 딸깍(고음 클릭) + 바닥에 닿는 낮은 톡 */
function sndKey(){if(!document.documentElement.hasAttribute('data-cp'))return;const a=fx();if(!a)return;const t=a.currentTime;
  const n=fxNoise(a,.03),hp=a.createBiquadFilter();hp.type='bandpass';hp.frequency.value=3200;hp.Q.value=1.2;const g=fxEnv(a,t,.22,.001,.025);n.connect(hp).connect(g).connect(a.destination);n.start(t);
  const o=a.createOscillator();o.type='sine';o.frequency.setValueAtTime(190,t+.012);o.frequency.exponentialRampToValueAtTime(90,t+.07);const g2=fxEnv(a,t+.012,.18,.002,.06);o.connect(g2).connect(a.destination);o.start(t+.012);o.stop(t+.1)}
function rdRenderFavs(){const box=$('#rdPresets');box.innerHTML='';const n=Math.max(6,Math.ceil((rdFavs.length+1)/6)*6);
  for(let i=0;i<n;i++){const st=rdFavs[i],b=document.createElement('button');b.type='button';b.dataset.p=i;b.dataset.n=i+1;if(st)b.title=st.name;b.addEventListener('pointerdown',()=>{try{sndKey()}catch(e){}});
    if(!st){b.className='blank';b.innerHTML='<em>P'+(i+1)+'</em><b>+</b>저장';b.setAttribute('aria-label','P'+(i+1)+' 비어 있음 · 지금 방송 저장');
      b.onclick=()=>{if(!rdCur)return toast('먼저 방송을 고른 뒤 저장하세요.');if(rdFavs.some(x=>x.id===rdCur.id))return toast('이미 저장된 방송이에요.');rdFavs.push(rdCur);store.set('rdFavs',rdFavs);rdShow();rdRenderList()};box.appendChild(b);continue}
    const f=rdFreqOf(st);b.className='set'+(rdCur&&rdCur.id===st.id?' on':'');b.innerHTML='<em></em><span></span><small></small>';
    b.children[0].textContent='P'+(i+1);b.children[1].textContent=st.name;b.children[2].textContent=f?f.toFixed(1):'NET';
    let t=0;b.addEventListener('pointerdown',()=>{t=setTimeout(()=>{t=-1;rdFavs.splice(i,1);store.set('rdFavs',rdFavs);rdShow();rdRenderList();toast('즐겨찾기에서 지웠어요.')},700)});
    b.addEventListener('pointerup',()=>{if(t!==-1){clearTimeout(t);rdPlay(st)}});b.addEventListener('pointerleave',()=>{if(t>0)clearTimeout(t)});box.appendChild(b)}}
// 7세그먼트 주파수 표시(꺼진 칸은 희미하게)
const RD_SEGS={'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg','-':'g',' ':''};
/* 콕핏 스페셜 2: 7세그 대신 전구빛 비치는 숫자 드럼(돌아가는 숫자판) */
function rdDrums(txt){const [ip,fp]=txt.split('.');let o='';for(const ch of ip.trim()||'-')o+=`<b class="drum">${ch==='-'?'–':ch}</b>`;
  o+='<i class="drum-dot">.</i>'+`<b class="drum">${fp?fp:'–'}</b>`;return `<span class="rd-drums" aria-hidden="true">${o}</span><span class="sr">${fp?txt+' MHz':'--.-'}</span>`}
function rdSegSvg(txt){if(document.documentElement.hasAttribute('data-cp'))return rdDrums(txt);const t=7,hz=(x1,x2,cy)=>`${x1},${cy} ${x1+t/2},${cy-t/2} ${x2-t/2},${cy-t/2} ${x2},${cy} ${x2-t/2},${cy+t/2} ${x1+t/2},${cy+t/2}`,
    vt=(cx,y1,y2)=>`${cx},${y1} ${cx+t/2},${y1+t/2} ${cx+t/2},${y2-t/2} ${cx},${y2} ${cx-t/2},${y2-t/2} ${cx-t/2},${y1+t/2}`,
    P={a:hz(5,35,3.5),g:hz(5,35,36),d:hz(5,35,68.5),f:vt(3.5,5,34),b:vt(36.5,5,34),e:vt(3.5,38,67),c:vt(36.5,38,67)};
  const [ip,fp]=txt.split('.'),ds=(ip.padStart(3,' ')+(fp||'-')).split(''),xs=[0,50,100,162];let o='';
  ds.forEach((ch,k)=>{const on=RD_SEGS[ch]||'';o+=`<g transform="translate(${xs[k]} 0)">`;for(const s in P)o+=`<polygon class="${on.includes(s)?'l':'g'}" points="${P[s]}"/>`;o+='</g>'});
  o+=`<circle class="${fp?'l':'g'}" cx="147" cy="68" r="4.6"/>`;
  return `<svg viewBox="-4 -1 210 74" aria-hidden="true"><g transform="skewX(-6)">${o}</g></svg><span class="sr">${fp?txt+' MHz':'--.-'}</span>`}
function rdNextSt(){const pool=rdFavs.length?rdFavs:rdList;if(!pool.length)return null;const i=pool.findIndex(s=>rdCur&&s.id===rdCur.id);const n=pool[(i+1)%pool.length];return n&&(!rdCur||n.id!==rdCur.id)?n:null}
function rdShow(){const st=rdCur,f=rdTune!=null?rdTune:(rdNoSig!=null?rdNoSig:(st&&rdFreqOf(st)));
  $('#rdFreq').innerHTML=rdSegSvg(f?f.toFixed(1):(st?'---':'--'));$('#wRadio').querySelector('.rd-band').textContent=f||!st?'FM':'NET';
  $('#rdName').textContent=rdTune!=null?'주파수 맞추는 중':rdNoSig!=null?'수신 없음':st?st.name:'방송국을 고르세요';
  $('#rdInfo').textContent=st&&rdTune==null&&rdNoSig==null?(rdNow?'♪ '+rdNow:[st.tags,st.codec&&(st.codec+(st.br?' '+st.br+'kbps':''))].filter(Boolean).join(' · ')):'';
  const pb=$('#rdPlay');pb.innerHTML=rdPlaying?'<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg><span class="kt">일시정지</span>':'<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg><span class="kt">재생</span>';pb.setAttribute('aria-label',rdPlaying?'일시정지':'재생');pb.classList.toggle('hot',rdPlaying);
  $('#rdFav').classList.toggle('fav',!!(st&&rdFavs.some(x=>x.id===st.id)));
  const ns=rdNextSt(),nf=ns&&rdFreqOf(ns);$('#rdStbyF').textContent=ns?(nf?nf.toFixed(1):'NET'):'--.-';$('#rdStby').disabled=!ns;$('#rdStby').title=ns?ns.name:'';
  const k=$('#rdKnob');k.setAttribute('aria-valuenow',f?f.toFixed(1):'');k.style.setProperty('--rot',((f||87.5)*120%360)+'deg');
  rdLamps();rdRenderFavs();rdDraw()}
function rdBridge(st){try{if(NB&&NB.onPlayState)NB.onPlayState(st?'playing':'stopped',st?(rdNow||st.name):'',st?(rdNow?'RADIO · '+st.name:'RADIO'):'')}catch(e){}}
// 앱에서는 안드로이드 표준 플레이어(HLS·http·재생목록 지원)로, 웹 미리보기에서는 audio 태그로 재생
const RD_NATIVE=!!(NB&&NB.radioPlay);let rdPoll=0,rdSt0='';
function rdFail(){const why=rdTry&&rdTry.err;rdPlaying=false;rdTry=null;clearInterval(rdPoll);try{updateMeta();state()}catch(e){}rdSay('재생할 수 없어요');toast('이 방송은 지금 재생할 수 없어요'+(why?' ('+why+')':'')+'. 다른 방송을 골라 주세요.');rdShow();rdRenderList()}
// 재생: 같은 방송의 다른 주소(공식 → 공개 목록)를 차례로 시도, 모두 안 될 때만 실패 안내
let rdTry=null,rdT0=0,rdNow='';
function rdCands(st){const out=[],seen=new Set(),f=rdFreqOf(st),add=s=>{if(s&&s.url&&!seen.has(s.url)&&rdOk(s)){seen.add(s.url);out.push(s)}};
  add(st);if(f)for(const s of [...RD_KR,...rdFavs,...rdList])if(rdFreqOf(s)===f)add(s);return out}
async function rdMore(){const t=rdTry;if(!t||t.searched)return false;t.searched=true;const base=t.base,f=rdFreqOf(base);
  const q=base.q||RD_Q[f]||(base.name||'').replace(/\s*(fm|라디오|radio)\s*$/i,'').trim();if(!q)return false;
  try{const r=(await rdApi('/json/stations/search?'+new URLSearchParams({name:q,hidebroken:'true',order:'votes',reverse:'true',limit:'8'}))).map(rdNorm).filter(rdOk);
    if(t!==rdTry)return false;const toks=q.toLowerCase().split(/\s+/).filter(Boolean),same=x=>{const n=(x.name||'').toLowerCase().replace(/\s+/g,'');return toks.every(k=>n.includes(k))};const seen=new Set(t.list.map(s=>s.url));let n=0;for(const s of r)if(!seen.has(s.url)&&same(s)){t.list.push(s);n++}return n>0}catch(e){return false}}
async function rdNextCand(){const t=rdTry;if(!t||!rdPlaying)return;t.i++;if(t.i>=t.list.length&&!(await rdMore()))return rdFail();if(t!==rdTry)return;
  rdSay('다른 주소로 연결 중…');rdStart(t.list[t.i])}
function rdStart(s){const t=rdTry;if(RD_NATIVE){try{NB.radioVolume(rdVolV());NB.radioPlay(s.url)}catch(e){return rdNextCand()}
    const t0=Date.now();clearInterval(rdPoll);rdPoll=setInterval(()=>{if(t!==rdTry)return clearInterval(rdPoll);let o={};try{o=JSON.parse(NB.radioState())}catch(e){}
      if(o.state==='playing'){if(rdSt0!=='ON AIR'){rdSay('ON AIR');rdT0=rdT0||Date.now();rdBridge(rdCur)}const ti=(o.title||'').trim();if(ti!==rdNow){rdNow=ti;rdShow();rdBridge(rdCur)}}
      else if(o.state==='yielded'){clearInterval(rdPoll);rdYield(o.err)}
      else if(o.state==='buffering'||o.state==='resolving')rdSay(o.retry?'다시 연결 중…':'버퍼링…');
      else if(o.state==='error'||(o.state==='idle'&&rdPlaying&&Date.now()-t0>20000)){clearInterval(rdPoll);if(t)t.err=(o.err==='API'?'방송사 주소 받기 실패':o.err?'재생 오류 '+o.err:'응답 없음')+(/^api:/.test(s.url)?' · 공식 주소':' · 공개 목록 주소');rdNextCand()}},500);return}
  if(/^api:/.test(s.url))return rdNextCand(); // 웹 미리보기는 방송사 주소를 직접 받을 수 없어 공개 목록 주소로
  rdAudio.src=s.url;rdAudio.play().then(()=>{if(t!==rdTry)return;rdSay('ON AIR');rdT0=rdT0||Date.now();setTimeout(()=>rdBridge(rdCur),250);rdShow()}).catch(()=>{if(t===rdTry)rdNextCand()})}
function rdPlay(st){if(!st)return;store.set('lastSrc','radio');rdNoSig=null;rdCur=st;store.set('rdLast',st);try{pauseMusic()}catch(e){}
  rdTry={base:st,list:rdCands(st),i:0,searched:false};rdT0=0;rdNow='';
  rdSay('연결 중…');rdPlaying=true;rdShow();rdRenderList();try{state()}catch(e){}rdStart(rdTry.list[0])}
// 플레이어 화면(LCD)에 지금 듣는 라디오 표시
function rdLcd(){const f=rdFreqOf(rdCur);$('#time').textContent=lcdFmt(rdPlaying&&rdT0?(Date.now()-rdT0)/1000:0);
  setMarquee('📻 '+(f?'FM '+f.toFixed(1)+' · ':'')+rdCur.name+(!rdPlaying?'  · 정지 (▶ 누르면 다시 들어요)':rdNow?'  ♪ '+rdNow:(rdSt0==='ON AIR'?'  · ON AIR':'  · 연결 중')));
  if(!seeking){seek.value=0;setP(seek)}$('#tCur').textContent='LIVE';$('#tDur').textContent='RADIO';
  const k=$('#kbps');const kb=(rdCur.br?rdCur.br+' kbps':'LIVE kbps');if(k.textContent!==kb)k.textContent=kb}
// 다른 앱(YouTube Music·Spotify 등)이 소리를 가져감: 라디오는 멈춤으로 두고 다시 잇지 않음. 플레이어 버튼은 그 앱을 조작
function rdYield(why){if(!rdPlaying)return;radioStop();
  try{if(why!=='noisy'&&HAS_EXT){store.set('lastSrc','ext');if(mode!=='ext')setMode('ext')}}catch(e){}
  try{state()}catch(e){}
  toast(why==='noisy'?'이어폰·블루투스가 끊겨 라디오를 멈췄어요.':'다른 앱이 음악을 재생해서 라디오를 멈췄어요. 다시 들으려면 라디오 창의 재생을 누르세요.')}
function radioStop(){if(!rdPlaying&&rdAudio.paused&&!RD_NATIVE)return;rdTry=null;clearInterval(rdPoll);if(RD_NATIVE){try{NB.radioStop()}catch(e){}}rdAudio.pause();rdAudio.removeAttribute('src');try{rdAudio.load()}catch(e){}if(!rdPlaying)return;rdPlaying=false;rdNow='';rdSay('대기');rdBridge(null);rdShow();rdRenderList();try{updateMeta();state()}catch(e){}}
const rdVolV=()=>(+$('#rdVol').value||80)/100;
rdAudio.addEventListener('error',()=>{if(rdPlaying&&rdTry&&!RD_NATIVE)rdNextCand()}); // 끊기면 같은 방송의 다른 주소로
rdAudio.addEventListener('waiting',()=>rdPlaying&&rdSay('버퍼링…'));rdAudio.addEventListener('playing',()=>rdSay('ON AIR'));
function rdPool(){const seen=new Set(),out=[];for(const s of [...rdFavs,...RD_KR,...rdList])if(!seen.has(s.id)){seen.add(s.id);out.push(s)}return out}
function rdStep(d){const pool=rdFavs.length?rdFavs:rdList;if(!pool.length)return;let i=pool.findIndex(s=>rdCur&&s.id===rdCur.id);i=(i+d+pool.length)%pool.length;rdPlay(pool[i])}
// FM 다이얼: 87.5~108MHz, 저장·목록의 방송 표시, 끌어서 맞추면 가장 가까운 방송으로
const rdCols=()=>{const cs=getComputedStyle($('#wRadio')),v=(n,d)=>cs.getPropertyValue(n).trim()||d;return {g:v('--rg','#a8f08f'),a:v('--ra','#f3bc65'),bg:v('--rbg','#0d1a0b'),d:v('--rdot','#5f8f55')}};
function rdDraw(){const RC=rdCols();const cv=$('#rdScale');if(!cv||!cv.offsetWidth)return;const d=Math.min(2,devicePixelRatio||1),W=cv.width=Math.round(cv.offsetWidth*d),H=cv.height=Math.round(cv.offsetHeight*d),g=cv.getContext('2d');
  if(document.documentElement.hasAttribute('data-cp')){rdDrawWarm(g,W,H,d);return}
  const x=f=>W*.035+(f-87.5)/(108-87.5)*W*.93;g.clearRect(0,0,W,H);
  g.strokeStyle='#3b4439';g.lineWidth=d;g.beginPath();g.moveTo(x(87.5),H*.62);g.lineTo(x(108),H*.62);g.stroke();
  g.textAlign='center';g.font=`600 ${11*d}px "Share Tech Mono",monospace`;g.fillStyle='#c9d0c4';
  for(let k=0;k<=102;k++){const f=87.6+k*.2;const big=Math.abs(f-Math.round(f/2)*2)<.01,mid=!big&&Math.abs(f-Math.round(f))<.01;
    g.strokeStyle=big?'#c9d0c4':mid?'#7d877a':'#454e43';g.lineWidth=(big?1.5:1)*d;g.beginPath();g.moveTo(x(f),H*.62);g.lineTo(x(f),H*(big?.32:mid?.42:.5));g.stroke();
    if(big)g.fillText(String(Math.round(f)),x(f),H*.93)}
  for(const st of rdPool()){const f=rdFreqOf(st);if(!f)continue;const fav=rdFavs.some(s=>s.id===st.id);g.fillStyle=fav?RC.a:RC.d;g.beginPath();g.arc(x(f),H*.72,(fav?3.2:2.4)*d,0,7);g.fill()}
  const cf=rdTune!=null?rdTune:(rdCur&&rdFreqOf(rdCur));if(cf){const cx=x(cf);g.strokeStyle=RC.g;g.fillStyle=RC.g;g.lineWidth=2.2*d;g.shadowColor=RC.g;g.shadowBlur=8*d;
    g.beginPath();g.moveTo(cx,H*.27);g.lineTo(cx,H*.68);g.stroke();g.shadowBlur=0;
    g.font=`700 ${12*d}px "Share Tech Mono",monospace`;const lb=cf.toFixed(1),tw=g.measureText(lb).width+8*d,bx=Math.max(1,Math.min(W-tw-1,cx-tw/2));
    g.fillStyle=RC.bg;g.fillRect(bx,1,tw,H*.22);g.strokeRect(bx,1,tw,H*.22);g.fillStyle=RC.g;g.textBaseline='middle';g.fillText(lb,bx+tw/2,1+H*.11);g.textBaseline='alphabetic'}}
/* 콕핏 스페셜 2 눈금창: 따뜻한 전구빛 크림색 판, 갈색 눈금, 빨간 튜닝 바늘 */
function rdDrawWarm(g,W,H,d){const x=f=>W*.05+(f-87.5)/(108-87.5)*W*.9;g.clearRect(0,0,W,H);
  let bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#f6dc9a');bg.addColorStop(.55,'#efd08a');bg.addColorStop(1,'#d9b468');g.fillStyle=bg;g.fillRect(0,0,W,H);
  let gl=g.createRadialGradient(W/2,H*.2,H*.1,W/2,H*.4,W*.6);gl.addColorStop(0,'#fff6d855');gl.addColorStop(1,'#00000000');g.fillStyle=gl;g.fillRect(0,0,W,H);
  let vg=g.createLinearGradient(0,0,W,0);vg.addColorStop(0,'#5a3a1066');vg.addColorStop(.08,'#5a3a1000');vg.addColorStop(.92,'#5a3a1000');vg.addColorStop(1,'#5a3a1066');g.fillStyle=vg;g.fillRect(0,0,W,H);
  const base=H*.6;g.strokeStyle='#3b2a12';g.lineWidth=1.2*d;g.beginPath();g.moveTo(x(87.5),base);g.lineTo(x(108),base);g.stroke();
  g.textAlign='center';g.font=`700 ${14*d}px Georgia,"Times New Roman",serif`;g.fillStyle="#2c1e0c";
  for(let k=0;k<=102;k++){const f=87.6+k*.2,big=Math.abs(f-Math.round(f/2)*2)<.01,mid=!big&&Math.abs(f-Math.round(f))<.01;
    g.strokeStyle=big?'#2c1e0c':mid?'#5a4325':'#7d6644';g.lineWidth=(big?1.6:1)*d;g.beginPath();g.moveTo(x(f),base);g.lineTo(x(f),H*(big?.3:mid?.4:.48));g.stroke();
    if(big)g.fillText(String(Math.round(f)),x(f),H*.9)}
  for(const st of rdPool()){const f=rdFreqOf(st);if(!f)continue;const fav=rdFavs.some(s=>s.id===st.id);g.fillStyle=fav?'#b8741c':'#4f6b2c';g.beginPath();g.arc(x(f),H*.69,(fav?3.4:2.6)*d,0,7);g.fill()}
  const cf=rdTune!=null?rdTune:(rdCur&&rdFreqOf(rdCur));if(cf){const cx=x(cf);
    g.strokeStyle='#00000040';g.lineWidth=3*d;g.beginPath();g.moveTo(cx+1.5*d,H*.24);g.lineTo(cx+1.5*d,H*.74);g.stroke();
    g.strokeStyle='#d22b1a';g.lineWidth=2.6*d;g.beginPath();g.moveTo(cx,H*.22);g.lineTo(cx,H*.74);g.stroke();
    g.font=`700 ${12*d}px Georgia,"Times New Roman",serif`;const lb=cf.toFixed(1),tw=g.measureText(lb).width+12*d,bx=Math.max(1,Math.min(W-tw-1,cx-tw/2)),bh=H*.22;
    g.fillStyle='#fbecc4';g.fillRect(bx,1,tw,bh);g.strokeStyle='#2c1e0c';g.lineWidth=1.2*d;g.strokeRect(bx,1,tw,bh);g.fillStyle='#2c1e0c';g.textBaseline='middle';g.fillText(lb,bx+tw/2,1+bh/2);g.textBaseline='alphabetic'}}
new MutationObserver(()=>{try{rdShow();rdDraw()}catch(e){}}).observe(document.documentElement,{attributes:true,attributeFilter:['data-cp']});
// 신호 세기 계기(바늘 + 막대) — 재생 상태를 보여 주는 표시
let rdLvl=0,rdLvlT=0,rdSigOn=false,rdSigTm=0;
function rdLamps(){const on=rdPlaying&&rdSt0==='ON AIR';$('#rdStereo').classList.toggle('on',on);$('#rdRds').classList.toggle('on',on&&!!rdCur)}
function rdSigDraw(){const RC=rdCols();const cv=$('#rdSig');if(!cv||!cv.offsetWidth)return;const d=Math.min(2,devicePixelRatio||1),W=cv.width=Math.round(cv.offsetWidth*d),H=cv.height=Math.round(cv.offsetHeight*d),g=cv.getContext('2d');
  const cx=W/2,cy=H*.6,r=Math.min(W*.42,H*.5),a=v=>Math.PI*(1+v/100);g.lineCap='butt';
  g.lineWidth=3*d;g.strokeStyle='#4d5a49';g.beginPath();g.arc(cx,cy,r,a(0),a(80));g.stroke();g.strokeStyle=RC.a;g.beginPath();g.arc(cx,cy,r,a(80),a(100));g.stroke();
  g.textAlign='center';g.textBaseline='middle';g.font=`600 ${9.5*d}px "Share Tech Mono",monospace`;
  const small=r<46*d;if(small)g.font=`600 ${8.5*d}px "Share Tech Mono",monospace`;
  for(let v=0;v<=100;v+=10){const an=a(v),big=small?v%50===0:v%20===0;g.strokeStyle=v>=80?RC.a:'#9da69d';g.lineWidth=(big?1.6:1)*d;g.beginPath();g.moveTo(cx+Math.cos(an)*(r-(big?9:6)*d),cy+Math.sin(an)*(r-(big?9:6)*d));g.lineTo(cx+Math.cos(an)*r,cy+Math.sin(an)*r);g.stroke();
    if(big){g.fillStyle=v>=80?RC.a:'#c9d0c4';g.fillText(String(v),cx+Math.cos(an)*(r-(small?12:19)*d),cy+Math.sin(an)*(r-(small?12:19)*d))}}
  const na=a(rdLvl);g.strokeStyle='#e7e9df';g.lineWidth=2*d;g.shadowColor=RC.g;g.shadowBlur=6*d;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(na)*(r-4*d),cy+Math.sin(na)*(r-4*d));g.stroke();g.shadowBlur=0;
  g.fillStyle='#2b3328';g.beginPath();g.arc(cx,cy,4.5*d,0,7);g.fill();
  const n=12,bw=W*.8/n,lit=Math.round(rdLvl/100*n);for(let i=0;i<n;i++){const h=(4+i*1.4)*d,x0=W*.1+i*bw,y0=H-2*d-h;g.fillStyle=i<lit?(i>=10?RC.a:RC.g):'#232a22';g.fillRect(x0,y0,bw*.62,h)}}
function rdSigTick(){if(document.hidden)return;const st=rdPlaying?(rdSt0==='ON AIR'?'on':'busy'):'off';rdLvlT=st==='on'?70+Math.sin(Date.now()/900)*6+Math.random()*7:st==='busy'?18+Math.random()*16:0;
  const nv=rdLvl+(rdLvlT-rdLvl)*.25;if(Math.abs(nv-rdLvl)>.05||rdLvl>0){rdLvl=Math.abs(nv)<.05?0:nv;rdSigDraw()}}
function rdSigRun(on){rdSigOn=on;clearInterval(rdSigTm);if(on){rdSigDraw();rdSigTm=setInterval(rdSigTick,110)}}
// 주파수 맞추기: 다이얼·노브·± 버튼 공통(가장 가까운 저장/목록 방송, 없으면 서울 FM 표로 찾아봄)
let rdTuneTm=0;
async function rdTuneTo(f){rdTune=null;let best=null,bd=.35;
  for(const st of rdPool()){const sf=rdFreqOf(st);if(sf&&Math.abs(sf-f)<bd){bd=Math.abs(sf-f);best=st}}
  if(!best){const k=Object.keys(RD_Q).map(Number).find(ff=>Math.abs(ff-f)<.3);if(k){rdSay('방송을 찾는 중…');try{const r=(await rdApi('/json/stations/search?'+new URLSearchParams({name:RD_Q[k],countrycode:'KR',hidebroken:'true',order:'votes',reverse:'true',limit:'5'}))).map(rdNorm).filter(rdOk);if(r[0]){best=r[0];best.freq=k}}catch(x){}}}
  store.set('rdDialF',Math.round(f*10)/10);
  if(best){rdNoSig=null;rdPlay(best)}else{if(rdPlaying)radioStop();rdNoSig=Math.round(f*10)/10;rdSay('대기');rdShow();$('#rdStat').textContent='이 주파수에는 인터넷 방송이 없어요 · 다이얼을 더 돌려 보세요'}}
let rdNoSig=null;
function rdNudge(n){const base=rdTune!=null?rdTune:(rdNoSig!=null?rdNoSig:((rdCur&&rdFreqOf(rdCur))||store.get('rdDialF',89.1)));rdTune=Math.max(87.5,Math.min(108,Math.round((base+n*.1)*10)/10));rdShow();
  clearTimeout(rdTuneTm);rdTuneTm=setTimeout(()=>rdTuneTo(rdTune),750)}
(function(){const cv=$('#rdScale');let pid=null;const fAt=cx=>{const r=cv.getBoundingClientRect();return Math.max(87.5,Math.min(108,87.5+((cx-r.left)/r.width-.035)/.93*20.5))};
  cv.addEventListener('pointerdown',e=>{pid=e.pointerId;cv.setPointerCapture(pid);clearTimeout(rdTuneTm);rdTune=fAt(e.clientX);rdShow()});
  cv.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;rdTune=fAt(e.clientX);rdShow()});
  cv.addEventListener('pointerup',e=>{if(e.pointerId!==pid)return;pid=null;rdTuneTo(rdTune)});cv.addEventListener('pointercancel',e=>{pid=null;rdTune=null;rdShow()});
  cv.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){rdStep(1);e.preventDefault()}if(e.key==='ArrowLeft'){rdStep(-1);e.preventDefault()}});
  // 노브: 12°마다 0.1MHz
  const k=$('#rdKnob');let kp=null,ka=0,acc=0;const ang=e=>{const r=k.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI};
  k.addEventListener('pointerdown',e=>{kp=e.pointerId;k.setPointerCapture(kp);ka=ang(e);acc=0;e.preventDefault()});
  k.addEventListener('pointermove',e=>{if(e.pointerId!==kp)return;let a=ang(e),da=a-ka;if(da>180)da-=360;if(da<-180)da+=360;ka=a;acc+=da;while(Math.abs(acc)>=12){const s=Math.sign(acc);acc-=s*12;rdNudge(s)}});
  const ke=e=>{if(e.pointerId===kp)kp=null};k.addEventListener('pointerup',ke);k.addEventListener('pointercancel',ke);
  k.addEventListener('wheel',e=>{e.preventDefault();rdNudge(e.deltaY<0?1:-1)},{passive:false});
  k.addEventListener('keydown',e=>{const s={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1}[e.key];if(s){rdNudge(s);e.preventDefault()}});
  $('#rdUp').onclick=()=>rdNudge(1);$('#rdDn').onclick=()=>rdNudge(-1);$('#rdStby').onclick=()=>{const n=rdNextSt();if(n)rdPlay(n)}})();
$('#rdList').addEventListener('click',e=>{const li=e.target.closest('li[data-i],li[data-o]');if(!li)return;const st=li.dataset.o?RD_KR.find(x=>x.id===li.dataset.o):rdList[+li.dataset.i];if(!st)return;
  if(e.target.closest('button')){const k=rdFavs.findIndex(x=>x.id===st.id);if(k>=0)rdFavs.splice(k,1);else rdFavs.push(st);store.set('rdFavs',rdFavs);rdRenderList();rdShow();return}rdPlay(st)});
$('#rdPlay').onclick=()=>{if(rdPlaying)radioStop();else if(rdCur)rdPlay(rdCur);else if(rdFavs[0])rdPlay(rdFavs[0]);else if(rdList[0])rdPlay(rdList[0])};
$('#rdPrev').onclick=()=>rdStep(-1);$('#rdNext').onclick=()=>rdStep(1);
$('#rdFav').onclick=()=>{if(!rdCur)return;const k=rdFavs.findIndex(x=>x.id===rdCur.id);if(k>=0)rdFavs.splice(k,1);else rdFavs.push(rdCur);store.set('rdFavs',rdFavs);rdShow();rdRenderList()};
$('#rdVol').value=String(Math.round(rdAudio.volume*100));$('#rdVol').value=String(store.get('rdVol',80));$('#rdVolN').textContent=$('#rdVol').value;$('#rdVol').oninput=e=>{$('#rdVolN').textContent=e.target.value;rdAudio.volume=e.target.value/100;store.set('rdVol',+e.target.value);if(RD_NATIVE)try{NB.radioVolume(e.target.value/100)}catch(x){}};
$('#rdGo').onclick=()=>rdSearch($('#rdQ').value.trim());$('#rdQ').addEventListener('keydown',e=>{if(e.key==='Enter')rdSearch(e.target.value.trim())});
$('#rdCountry').onchange=()=>rdSearch($('#rdQ').value.trim());
function rdFold(tg,box,key,def){const b=$('#'+tg),x=$('#'+box),set=o=>{x.hidden=!o;b.setAttribute('aria-expanded',String(o))};set(store.get(key,def));
  b.onclick=()=>{const o=x.hidden;set(o);store.set(key,o);if(o&&box==='rdListBox')rdEnsure()}}
rdFold('rdPresetTg','rdPresetBox','rdPresetOpen',true);rdFold('rdListTg','rdListBox','rdListOpen',!rdFavs.length);
let rdLoaded=false;function rdEnsure(){rdShow();if(!rdLoaded){rdLoaded=true;rdSearch('')}requestAnimationFrame(rdDraw)}
function openRadio(){const w=$('#wRadio');w.classList.remove('collapsed');if(isCk2()){ckFocus('radio')}else w.scrollIntoView({block:'start',behavior:'smooth'});rdEnsure()}
new IntersectionObserver(es=>{const v=es.some(e=>e.isIntersecting);if(v)rdEnsure();rdSigRun(v)}).observe($('#wRadio'));
$('#radioBtn').onclick=openRadio;
window.addEventListener('resize',rdDraw);{const ro=new ResizeObserver(()=>{rdDraw();rdSigDraw()});ro.observe($('#rdScale'));ro.observe($('#rdSig'))}
// 핸들·이어폰 버튼: 라디오를 듣는 중이면 재생/정지·이전/다음 방송
{const o=window.__ctl;window.__ctl=c=>{if(rdPlaying||rdSel()){if(c==='next')rdStep(1);else if(c==='prev')rdStep(-1);else if(c==='play'||(c==='toggle'&&!rdPlaying))rdResume();else if(rdPlaying)radioStop();return}return o&&o(c)}}
rdShow();rdSay('대기'); // 처음부터 프리셋 칸·표시를 그려 두어 나중에 화면이 밀리지 않게
function rdResume(){rdPlay(rdCur||rdFavs[0]||RD_KR.find(x=>x.id==='kr-mbcfm4u')||RD_KR[0])}
window.AmpRadio={open:openRadio,play:rdPlay,stop:radioStop,resume:rdResume,step:rdStep,toggle(){if(rdPlaying)radioStop();else rdResume()},
  get state(){const f=rdCur&&rdFreqOf(rdCur);return {playing:rdPlaying,cur:rdCur,favs:rdFavs.length,list:rdList.length,now:rdNow,freq:f||null,onAir:rdSt0==='ON AIR',t0:rdT0,status:rdSt0}}};

// 재생 버튼 6개도 키캡 소리(스페셜 2)
document.querySelectorAll('#wMain .transport .tb').forEach(b=>b.addEventListener('pointerdown',()=>{try{sndKey()}catch(e){}}));
/* ===== 91-swap.js ===== */
/* 1.34 [전환] 키: 라디오를 듣다가 누르면 듣던 음악 앱(YouTube Music·Spotify)으로, 음악 앱을 듣다가 누르면 라디오로 */
(function(){const b=$('#bSwap'),t=$('#bSwapT');if(!b)return;
  const PK={'com.google.android.apps.youtube.music':'YT Music','com.spotify.music':'Spotify'};
  const onRadio=()=>{try{return rdPlaying||rdSel()}catch(e){return false}};
  const appPkg=()=>store.get('extPkg','')||(ext&&ext.pkg&&PK[ext.pkg]?ext.pkg:'');
  function label(){const r=onRadio(),pk=appPkg(),to=r?(PK[pk]||'음악 앱'):'라디오';
    if(t.textContent!==to)t.textContent=to;const al=to+'(으)로 전환';if(b.getAttribute('aria-label')!==al){b.setAttribute('aria-label',al);b.dataset.to=r?'app':'radio'}}
  function toApp(){const pk=appPkg();try{radioStop()}catch(e){}store.set('lastSrc','ext');
    if(HAS_EXT&&mode!=='ext')setMode('ext');
    if(!pk){if(HAS_EXT){setMode('ext');toast('YouTube Music 또는 Spotify를 한 번 골라 주세요. 다음부터는 이 버튼으로 바로 돌아가요.')}else toast('음악 앱 전환은 안드로이드 앱에서 동작해요.');return}
    let ok=false;try{if(NB&&NB.mediaPlay){NB.mediaPlay(pk);ok=true}}catch(e){}
    if(!ok){try{X('play');ok=HAS_EXT}catch(e){}}
    toast(ok?(PK[pk]||'음악 앱')+'(으)로 돌아왔어요. 듣던 곡을 이어서 재생해요.':'음악 앱 전환은 안드로이드 앱에서 동작해요.')}
  function toRadio(){try{if(mode==='ext'&&ext&&ext.playing)X('pause')}catch(e){}try{AmpRadio.resume();toast('라디오로 전환해요.')}catch(e){}}
  b.addEventListener('click',()=>{onRadio()?toApp():toRadio();setTimeout(label,120);setTimeout(label,900)});
  label();setInterval(label,1000);
  window.AmpSwap={label,toApp,toRadio,get to(){return b.dataset.to}};
})();
/* ===== 92-cockpit2-rail.js ===== */
// 콕핏 2 세로 바로가기
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 콕핏 2: 세로 바로가기(고른 창만 꽉 차게, 전체로 돌아가기) ---------- */
// 콕핏 2 바로가기: 모두 한 창씩, 스피드미터와 같은 크기(바꿔도 화면 크기가 그대로)
const FX_GROUPS={gps:['wGps'],map:['wMap'],cam:['wCam'],radio:['wRadio'],vis:['wVis']};
const ckRailHome=document.createComment('ckRail');$('#ckRail').before(ckRailHome);
const ckRailEl=$('#ckRail'); // 스피드미터 화면이 다시 만들어져도 잃지 않게 붙잡아 둠
/* 콕핏: 바로가기는 가로 한 줄 — 스피드미터 창에서는 계기 화면 바로 아래, 다른 창에서는 제목줄 아래 */
function ckRailPlace(hostId,span){const r=ckRailEl;ckRailPlace.last=[hostId,span];document.querySelectorAll('.win.hasrail').forEach(w=>w.classList.remove('hasrail'));appEl.classList.remove('RL');r.classList.remove('inapp');
  if(!isCk2()||!hostId){ckRailHome.after(r);return}
  if(span){appEl.prepend(r);r.classList.add('inapp');appEl.classList.add('RL');return} // 위아래로 나눈 화면: 두 창 옆에 세로로 길게
  const h=$('#'+hostId);if(!h)return;h.classList.add('hasrail');
  if(hostId==='wGps'){const glass=h.dataset.gs==='cockpit'&&h.querySelector('#pfdHost .pfd-glass'),gauge=h.querySelector('.body>.gps'),walk=h.dataset.gs==='walk'&&h.querySelector('#walkHost');
    const at=glass||walk||gauge;if(at){if(at.nextElementSibling!==r)at.after(r);return}}
  if(isCks()){const g=h.querySelector(':scope>.grip');if(g)h.insertBefore(r,g);else if(h.lastElementChild!==r)h.append(r);return} // 콕핏 스페셜: 어느 창이든 맨 아래 고정
  const bar=h.querySelector(':scope>.bar');h.insertBefore(r,bar?bar.nextSibling:h.firstChild)}
// 스피드미터 화면(PFD)이 늦게 만들어지거나 디자인이 바뀌면 자리를 다시 잡음
{const mo=new MutationObserver(()=>{const l=ckRailPlace.last;if(l&&l[0]==='wGps'&&!l[1])ckRailPlace('wGps',false)});
  mo.observe($('#wGps'),{attributes:true,attributeFilter:['data-gs']});if($('#pfdHost'))mo.observe($('#pfdHost'),{childList:true})}
function ckFocus(f,quiet){if(!FX_GROUPS[f])f='all';const split=document.documentElement.getAttribute('data-split')==='ck';if(split&&quiet&&!SPLIT.set)f=SPLIT.f; /* 분할 중 자동 복원은 지금 보기 유지 */if(split&&f==='all')f='gps';if(split)SPLIT.f=f; // 화면 분할 중엔 한 창씩(전체 = 속도계), 고른 보기는 저장하지 않고 끝나면 원래 보기로
  const on=isCk2()&&f!=='all';
  appEl.classList.toggle('FX',on);if(on)document.documentElement.style.setProperty('--fxN',String(FX_GROUPS[f].length));
  document.querySelectorAll('#app>.win').forEach(w=>{const sel=on&&FX_GROUPS[f].includes(w.id);w.classList.toggle('fx',sel);if(sel)w.classList.remove('collapsed')});
  ckRailPlace(isCk2()?(on?FX_GROUPS[f][0]:'wGps'):null,on&&FX_GROUPS[f].length>1); // 창이 보인 뒤에 위치를 재야 제목줄 높이가 맞음
  document.querySelectorAll('#ckRail button[data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f===(on?f:'all')));
  if(isCk2()&&!split)store.set('ckFocus',f);
  if(on){let top=0;for(let e=appEl;e;e=e.offsetParent)top+=e.offsetTop; /* 스크롤과 무관한 화면 위치 */document.documentElement.style.setProperty('--fxTop',Math.round(top+28)+'px');if(!quiet)window.scrollTo({top:0,behavior:'smooth'});
    setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}try{if(mapObj)mapObj.invalidateSize()}catch(e){}if(f==='map'&&mapPref==='on')mapUpdate(true)},120)}}
$('#ckRail').addEventListener('click',e=>{const o=e.target.closest('button[data-open]');if(o){if(o.__long){o.__long=false;return}navPick(o);return}const b=e.target.closest('button[data-f]');if(!b)return;if(b.dataset.f==='set'){openSettings();return}ckFocus(b.dataset.f)});
window.addEventListener('resize',()=>{if(appEl.classList.contains('FX'))ckFocus(document.documentElement.getAttribute('data-split')==='ck'?SPLIT.f:store.get('ckFocus','all'),true)});


// 콕핏 2 측면 [T맵]·[네이버지도]: 누르면 위/아래 고르기, 길게 누르면 마지막 위치로 바로 열기(가로 화면은 안드로이드가 옆에 붙임)
const navAt=id=>store.get('navAt_'+id,'bottom');
function navLabels(){document.querySelectorAll('#ckRail button[data-open]').forEach(b=>{const em=b.querySelector('em');if(em)em.textContent=navAt(b.dataset.open)==='top'?'▲ 위':'▼ 아래'})}
function navGo(id,at){store.set('navAt_'+id,at);navLabels();navPickClose();navOpen(id,at)}
function navPickClose(){const p=$('#navPick');if(p){p.hidden=true;p.dataset.id=''}clearTimeout(navPickClose.t)}
function navPick(btn){const id=btn.dataset.open,a=NAV[id],p=$('#navPick');
  if(p.dataset.id===id&&!p.hidden){navPickClose();return}
  if(innerWidth>innerHeight&&NB&&NB.openApp){navGo(id,navAt(id));return} // 가로 화면: 위/아래 구분이 없어 바로 엶
  p.dataset.id=id;p.querySelector('b').textContent=a.name+' 열 위치';
  p.querySelectorAll('button[data-at]').forEach(x=>x.classList.toggle('on',x.dataset.at===navAt(id)));
  p.hidden=false;const r=btn.getBoundingClientRect(),pr=p.getBoundingClientRect();
  p.style.left=Math.min(innerWidth-pr.width-8,r.right+8)+'px';p.style.top=Math.max(8,Math.min(innerHeight-pr.height-8,r.top+r.height/2-pr.height/2))+'px';
  clearTimeout(navPickClose.t);navPickClose.t=setTimeout(navPickClose,8000)}
$('#navPick').addEventListener('click',e=>{const b=e.target.closest('button[data-at]');if(b)navGo($('#navPick').dataset.id,b.dataset.at)});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#navPick,#ckRail button[data-open]'))navPickClose()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')navPickClose()});
document.querySelectorAll('#ckRail button[data-open]').forEach(b=>{let t=0,x0=0,y0=0;
  b.addEventListener('pointerdown',e=>{clearTimeout(t);b.__long=false;x0=e.clientX;y0=e.clientY;t=setTimeout(()=>{b.__long=true;navPickClose();navGo(b.dataset.open,navAt(b.dataset.open));try{navigator.vibrate&&navigator.vibrate(30)}catch(x){}},550)});
  b.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-x0,e.clientY-y0)>12)clearTimeout(t)}); // 손가락이 움직이면(스크롤) 취소
  ['pointerup','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>clearTimeout(t)));
  b.addEventListener('contextmenu',e=>e.preventDefault())});
navLabels();
/* ===== 93-split.js ===== */
// 화면 분할(TMAP·네이버 지도 위·아래): 이 앱은 남은 칸(약 40%)에 맞게 스크롤 없이 따로 배치
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 분할 화면 배치: 넓으면 [속도계 | 플레이어], 좁으면 [속도계] + 아래 조작 줄 ---------- */
const SPLIT={on:false,ratio:1,f:'gps'};
function splitWanted(){return SPLIT.on&&SPLIT.ratio<.8&&store.get('splitLayout',true)!==false&&!isTab()}
// 콕핏 2(측면 버튼): 속도계 창 하나만 남은 칸에 꽉 차게, 측면 버튼으로 다른 보기로 바꿈("ck")
// 그 밖의 스킨: [속도계 | 플레이어] 또는 [속도계] + 아래 조작 줄("grid")
function splitApply(){const root=document.documentElement,want=splitWanted()?(isCk2()?'ck':'grid'):'',cur=root.getAttribute('data-split')||'';
  if(want===cur)return;
  if(want)root.setAttribute('data-split',want);else root.removeAttribute('data-split');
  if(want==='ck'){SPLIT.set=true;SPLIT.f='gps';try{ckFocus('gps',true)}finally{SPLIT.set=false}window.scrollTo(0,0)} // 분할 첫 화면은 속도계 창
  else if(cur==='ck'&&isCk2())ckFocus(store.get('ckFocus','all'),true); // 분할이 끝나면 원래 보기
  if(want==='grid')window.scrollTo(0,0);
  setTimeout(()=>{window.dispatchEvent(new Event('resize'));try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}},80)}
new MutationObserver(()=>splitApply()).observe(document.documentElement,{attributes:true,attributeFilter:['data-ck2']});
window.__split=o=>{o=o||{};SPLIT.on=!!o.on;SPLIT.ratio=+o.ratio||1;splitApply()};
window.AmpSplit={get on(){return document.documentElement.hasAttribute('data-split')},set:(on,ratio)=>window.__split({on,ratio:ratio==null?.4:ratio}),apply:splitApply};
$('#sSplit').checked=store.get('splitLayout',true)!==false;
$('#sSplit').onchange=e=>{store.set('splitLayout',e.target.checked);splitApply()};
try{if(NB&&NB.splitState)window.__split(JSON.parse(NB.splitState()))}catch(e){}
/* ===== 94-weather.js ===== */
// 오늘의 날씨
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 오늘의 날씨(Open-Meteo, 키 없음) → 시계 옆 표시 + 속도계 비·눈·흐림 효과 ---------- */
const WX={kind:'clear',code:null,temp:null,hi:null,lo:null,at:0,place:''};
window.AmpWx={get kind(){const f=store.get('wxForce','auto');return f==='auto'?WX.kind:f==='off'?'off':f},get data(){return WX}};
function wxKind(c){if(c==null)return 'clear';if([71,73,75,77,85,86].includes(c))return 'snow';if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(c))return 'rain';if([45,48].includes(c))return 'fog';if([2,3].includes(c))return 'cloudy';return 'clear'}
function wxText(c){const m={0:'맑음',1:'대체로 맑음',2:'구름 조금',3:'흐림',45:'안개',48:'안개',51:'이슬비',53:'이슬비',55:'이슬비',56:'어는 이슬비',57:'어는 이슬비',61:'비',63:'비',65:'강한 비',66:'어는 비',67:'어는 비',71:'눈',73:'눈',75:'많은 눈',77:'싸락눈',80:'소나기',81:'소나기',82:'강한 소나기',85:'눈 소나기',86:'눈 소나기',95:'뇌우',96:'뇌우·우박',99:'뇌우·우박'};return m[c]||'—'}
function wxIcon(k,day){return {snow:'❄️',rain:'🌧️',fog:'🌫️',cloudy:'☁️',clear:day===false?'🌙':'☀️'}[k]||'·'}
function drawWxDial(cv,k,temp,night){if(CPX())return antWx(cv,k,temp,night);const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  const pl=ctx.createLinearGradient(-R,-R,R,R);pl.addColorStop(0,DIAL().pl[0]);pl.addColorStop(1,DIAL().pl[1]);ctx.fillStyle=pl;ctx.beginPath();ctx.roundRect(-R+1,-R+1,S-2,S-2,S*.12);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const sx=x*R*.8,sy=y*R*.8,r=S*.035,g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,0,sx,sy,r);g.addColorStop(0,DIAL().sc[0]);g.addColorStop(1,DIAL().sc[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();ctx.strokeStyle='#1a1d20';ctx.lineWidth=S*.008;ctx.beginPath();ctx.moveTo(sx-r*.7,sy-r*.7*(x*y));ctx.lineTo(sx+r*.7,sy+r*.7*(x*y));ctx.stroke()}
  const bz=ctx.createLinearGradient(0,-R,0,R);bz.addColorStop(0,DIAL().bz[0]);bz.addColorStop(.5,DIAL().bz[1]);bz.addColorStop(1,DIAL().bz[2]);ctx.fillStyle=bz;ctx.beginPath();ctx.arc(0,0,R*.9,0,7);ctx.fill();
  ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  // 기온 눈금 -20~40℃ (240°)
  const A=v=>(-120+(Math.max(-20,Math.min(40,v))+20)/60*240)*Math.PI/180;
  for(const [a0,a1,c] of [[-20,0,'#5aa9ff'],[0,25,'#a8f08f'],[25,40,'#f3bc65']]){ctx.strokeStyle=c;ctx.lineWidth=S*.03;ctx.beginPath();ctx.arc(0,0,R*.72,A(a0)-Math.PI/2,A(a1)-Math.PI/2);ctx.stroke()}
  for(let v=-20;v<=40;v+=5){const a=A(v),big=v%20===0;ctx.strokeStyle=big?'#eef2e6':'#9fa99a';ctx.lineWidth=big?S*.018:S*.008;ctx.beginPath();ctx.moveTo(Math.sin(a)*R*.66,-Math.cos(a)*R*.66);ctx.lineTo(Math.sin(a)*R*(big?.56:.61),-Math.cos(a)*R*(big?.56:.61));ctx.stroke()
    if(big){ctx.fillStyle='#eef2e6';ctx.font=`700 ${S*.07}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(v),Math.sin(a)*R*.46,-Math.cos(a)*R*.46)}}
  // 날씨 그림(가운데 위)
  ctx.save();ctx.translate(0,-R*.12);const u=S*.07;ctx.lineWidth=S*.014;ctx.lineCap='round';
  const cloud=(col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(-u*1.1,u*.2,u*.9,0,7);ctx.arc(0,-u*.35,u*1.2,0,7);ctx.arc(u*1.2,u*.25,u*.85,0,7);ctx.rect(-u*1.9,u*.2,u*3.9,u*.95);ctx.fill()};
  if(k==='clear'){if(night){ctx.fillStyle='#e8eef7';ctx.beginPath();ctx.arc(0,0,u*1.3,0,7);ctx.fill();ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(u*.6,-u*.45,u*1.15,0,7);ctx.fill()}
    else{ctx.fillStyle='#f3bc65';ctx.strokeStyle='#f3bc65';ctx.beginPath();ctx.arc(0,0,u*.95,0,7);ctx.fill();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*u*1.35,Math.sin(a)*u*1.35);ctx.lineTo(Math.cos(a)*u*1.9,Math.sin(a)*u*1.9);ctx.stroke()}}}
  else if(k==='cloudy'||k==='fog'){cloud('#c9d0d7');if(k==='fog'){ctx.strokeStyle='#9fa99a';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-u*1.8,u*1.5+i*u*.45);ctx.lineTo(u*1.8,u*1.5+i*u*.45);ctx.stroke()}}}
  else if(k==='rain'){cloud('#aab3bd');ctx.strokeStyle='#5aa9ff';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*u*.9,u*1.45);ctx.lineTo(i*u*.9-u*.35,u*2.2);ctx.stroke()}}
  else if(k==='snow'){cloud('#d6dde4');ctx.strokeStyle='#ffffff';for(let i=-1;i<=1;i++){const x=i*u*.95,y=u*1.85;for(let j=0;j<3;j++){const a=j*Math.PI/3;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*u*.32,y-Math.sin(a)*u*.32);ctx.lineTo(x+Math.cos(a)*u*.32,y+Math.sin(a)*u*.32);ctx.stroke()}}}
  ctx.restore();
  ctx.fillStyle='#e7e9df';ctx.font=`600 ${S*.15}px "Share Tech Mono",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(temp==null?'--°':Math.round(temp)+'°',0,R*.4);
  ctx.fillStyle='#a8f08f';ctx.font=`600 ${S*.055}px "Barlow Condensed",sans-serif`;ctx.fillText('TEMP °C',0,R*.62);
  if(temp!=null){const a=A(temp);ctx.save();ctx.rotate(a);ctx.fillStyle='#f3bc65';ctx.beginPath();ctx.moveTo(-S*.018,-R*.5);ctx.lineTo(S*.018,-R*.5);ctx.lineTo(0,-R*.77);ctx.closePath();ctx.fill();ctx.restore()}
  const gl=ctx.createLinearGradient(-R*.6,-R*.8,R*.3,R*.2);gl.addColorStop(0,'#ffffff1f');gl.addColorStop(.45,'#ffffff05');gl.addColorStop(.46,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
function wxRender(){const f=store.get('wxForce','auto'),k=window.AmpWx.kind;
  try{drawWxDial($('#wxDial'),k==='off'?WX.kind:k,WX.temp,WX.day===false)}catch(e){}
  $('#wxIco').textContent=wxIcon(k==='off'?WX.kind:k,WX.day);$('#wxT').textContent=WX.temp==null?'--°':Math.round(WX.temp)+'°';
  $('#wxS').textContent=(f!=='auto'&&f!=='off'?'시험: ':'')+(f==='auto'||f==='off'?wxText(WX.code):{clear:'맑음',cloudy:'흐림',rain:'비',snow:'눈'}[f])+(WX.hi!=null?' · '+Math.round(WX.hi)+'/'+Math.round(WX.lo)+'°':'');
  $('#sWxNow').textContent=WX.code==null?'날씨를 아직 불러오지 못했어요 (인터넷·위치 확인)':(WX.place?WX.place+' · ':'')+wxText(WX.code)+' '+Math.round(WX.temp)+'° (최고 '+Math.round(WX.hi)+'° · 최저 '+Math.round(WX.lo)+'°)';
  $('#sWxForce').value=f}
async function wxFetch(){let lat=37.5665,lon=126.978,place='서울';
  if(gs&&gs.fix&&isFinite(gs.lat)){lat=gs.lat;lon=gs.lon;place='현재 위치';store.set('wxLoc',[lat,lon])}else{const l=store.get('wxLoc',null);if(l){lat=l[0];lon=l[1];place='마지막 위치'}}
  try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`);
    if(!r.ok)throw 0;const j=await r.json();const c=j.current||{};WX.code=c.weather_code;WX.temp=c.temperature_2m;WX.day=c.is_day!==0;WX.hi=j.daily.temperature_2m_max[0];WX.lo=j.daily.temperature_2m_min[0];WX.kind=wxKind(WX.code);WX.at=Date.now();WX.place=place;store.set('wxLast',{...WX})}
  catch(e){const o=store.get('wxLast',null);if(o&&Date.now()-o.at<6*3600e3)Object.assign(WX,o)}
  wxRender()}
{const o=store.get('wxLast',null);if(o&&Date.now()-o.at<6*3600e3)Object.assign(WX,o)}
$('#clkWx').onclick=()=>{openSettings();const r=$('#secWx');if(r)r.scrollIntoView({block:'center'})};
$('#sWxRefresh').onclick=()=>{$('#sWxNow').textContent='불러오는 중…';wxFetch()};
$('#sWxForce').onchange=e=>{store.set('wxForce',e.target.value);wxRender()};
wxRender();setTimeout(wxFetch,1500);setInterval(wxFetch,20*60e3);
/* ===== 95-deck.js ===== */
/* 1.35 몬스타덱(USB 단축키 패드) — 폴드에 꽂으면 앱이 직접 읽어 키마다 대신남 원 기능을 실행
 * 장치가 보내는 보고서(16진수)를 받아 키를 알아보고, 설정 › 몬스타덱에서 키마다 기능을 정함(키 배우기).
 * 보고서가 "ACK … OK" 형식이면 9번째 바이트를 키 번호로 쓰고(1~15 기본 배치), 아니면 보고서 모양 자체를 키로 기억함. */
(function(){
  const ACTS=[
    ['play','재생 · 일시정지',()=>AmpTk.toggle()],['prev','이전 곡',()=>AmpTk.prev()],['next','다음 곡',()=>AmpTk.next()],
    ['swap','라디오 ↔ 음악 앱',()=>$('#bSwap').click()],['mute','음소거',()=>$('#dkMuteSwitch')?.click()],
    ['gps','스피드미터',()=>ckFocus('gps')],['map','지도',()=>ckFocus('map')],['radio','라디오 화면',()=>ckFocus('radio')],
    ['vis','NOW PLAYING',()=>ckFocus('vis')],['all','전체 보기',()=>ckFocus('all')],['cam','DASHCAM 화면',()=>ckFocus('cam')],
    ['rec','주행 녹화 켜기/끄기',()=>$('#dkRecSwitch')?.click()],['day','주간 ↔ 야간',()=>$('#dkDaySwitch')?.click()],
    ['tmap','T맵 열기',()=>navOpen('tmap')],['nmap','네이버지도 열기',()=>navOpen('nmap')],
    ['land','착륙',()=>{if(window.AmpFlight&&!AmpFlight.land())toast('착륙은 순항 중에만 할 수 있어요.')}],
    ['briUp','화면 밝게',()=>briSet(briBase()+10)],['briDn','화면 어둡게',()=>briSet(briBase()-10)],
    ['camDemo','과속 경고 예시',()=>AmpCam.demo()],['set','설정 열기',()=>openSettings()],['none','(없음)',()=>{}]];
  const ACT=Object.fromEntries(ACTS.map(a=>[a[0],a]));
  // 키 번호(1~15)가 보이는 장치의 기본 배치: 윗줄 재생 조작, 가운데 화면, 아랫줄 운전 기능
  const DEF={k1:'prev',k2:'play',k3:'next',k4:'swap',k5:'mute',k6:'gps',k7:'map',k8:'radio',k9:'vis',k10:'all',k11:'rec',k12:'day',k13:'tmap',k14:'nmap',k15:'land'};
  let map=Object.assign({},store.get('deckMap',null)||DEF),learn=null,last={id:'',t:0},st={},raw=[];
  const save=()=>store.set('deckMap',map);
  function parse(hex){const b=[];for(let i=0;i<hex.length;i+=2)b.push(parseInt(hex.substr(i,2),16));
    if(b[0]===0x41&&b[1]===0x43&&b[2]===0x4b){                     // "ACK"
      if(b[5]===0x54&&b[6]===0x46)return null;                        // 펌웨어 정보 응답
      if(b[5]===0x43&&b[6]===0x42)return null;                        // 명령 확인 응답
      const k=b[9],down=b[10]!==0;if(k>0&&k<64)return {id:'k'+k,down,label:k+'번 키'};}
    if(b[0]===0x48&&b[1]===0x41&&b[2]===0x4e)return null;             // 장치가 인사를 다시 청함(앱이 처리)
    return {id:'r'+hex.slice(0,24),down:true,label:'키('+hex.slice(0,8)+'…)'}}
  function onReport(hex){raw.unshift(hex);raw.length=Math.min(raw.length,6);ui();
    const k=parse(hex);if(!k||!k.down)return;const now=Date.now();if(k.id===last.id&&now-last.t<220)return;last={id:k.id,t:now};
    if(learn){for(const x in map)if(map[x]===learn)delete map[x];map[k.id]=learn;save();toast(k.label+' → '+ACT[learn][1]);learn=null;ui();return}
    const a=ACT[map[k.id]];if(!a){toast('몬스타덱 '+k.label+': 설정 › 몬스타덱에서 기능을 정해 주세요.');return}
    try{sndKey()}catch(e){}try{a[2]()}catch(e){}flash(a[1])}
  let flT=0;function flash(t){const el=$('#deckFlash');if(!el)return;el.textContent=t;el.hidden=false;clearTimeout(flT);flT=setTimeout(()=>el.hidden=true,900)}
  window.__deck=onReport;
  window.__deckState=s=>{st=s||{};ui()};
  function stateNow(){try{if(NB&&NB.deckState)st=JSON.parse(NB.deckState()||'{}')}catch(e){}}
  function ui(){const sec=$('#secDeck');if(!sec)return;
    const s=$('#deckStat');s.textContent=!NB||!NB.deckState?'안드로이드 앱에서 동작해요(폴드에 USB-C로 꽂아 쓰세요).':st.open?'연결됨 · 키를 누르면 바로 동작해요':st.present?(st.err||'꽂혀 있어요 · [연결]을 눌러 주세요'):(st.err||'몬스타덱이 연결되어 있지 않아요');
    s.dataset.ok=st.open?'1':'';
    const al=$('#deckAll');if(al){const L=st.all||[];al.textContent=!NB||!NB.deckState?'':L.length?'폴드에 꽂힌 USB 장치: '+L.join(' / '):'폴드에 꽂힌 USB 장치 없음 — 폴드가 몬스타덱을 USB 장치로 인식하지 못했어요(OTG 젠더로 연결해 보세요)'}
    $('#deckRaw').textContent=raw.length?'받은 신호: '+raw.slice(0,3).join(' · '):'받은 신호 없음';
    const ul=$('#deckMap');const rows=ACTS.filter(a=>a[0]!=='none').map(a=>{const keys=Object.keys(map).filter(k=>map[k]===a[0]).map(k=>k[0]==='k'?k.slice(1)+'번':'키');
      return '<li data-a="'+a[0]+'" class="'+(learn===a[0]?'learn':'')+'"><span>'+a[1]+'</span><em>'+(learn===a[0]?'몬스타덱 키를 누르세요…':keys.length?keys.join(', '):'—')+'</em><button type="button" class="pill" data-learn="'+a[0]+'">'+(learn===a[0]?'취소':'키 지정')+'</button></li>'}).join('');
    if(ul.__h!==rows){ul.__h=rows;ul.innerHTML=rows}}
  $('#deckMap').addEventListener('click',e=>{const b=e.target.closest('[data-learn]');if(!b)return;e.preventDefault();learn=learn===b.dataset.learn?null:b.dataset.learn;ui()});
  $('#deckConn').onclick=e=>{e.preventDefault();try{if(NB&&NB.deckConnect){NB.deckConnect();setTimeout(()=>{stateNow();ui()},800)}else toast('몬스타덱 연결은 안드로이드 앱에서 동작해요.')}catch(x){}};
  $('#deckReset').onclick=e=>{e.preventDefault();map=Object.assign({},DEF);save();learn=null;ui();toast('기본 배치로 되돌렸어요.')};
  $('#deckBri').oninput=e=>{try{NB&&NB.deckBright&&NB.deckBright(+e.target.value)}catch(x){}store.set('deckBri',+e.target.value)};
  $('#deckBri').value=store.get('deckBri',70);
  stateNow();ui();setInterval(()=>{if(!$('#settings').hidden){stateNow();ui()}},1500);
  window.AmpDeck={report:onReport,get map(){return map},learn(a){learn=a;ui()},parse,ACTS:ACTS.map(a=>a[0])};
})();
/* ===== 96-skin-compass-notif.js ===== */
// 상단 스킨 버튼(콕핏 수정판), 나침반 계기(해외 시간 대신), 알림 접근 "제한된 설정" 단계별 안내
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 스킨 바꾸기 버튼 ---------- */
function skinPickClose(){$('#skinPick').hidden=true}
function skinPickOpen(){const p=$('#skinPick'),l=$('#skinPickList');l.innerHTML='';
  for(const [k,n] of SKINS){const b=document.createElement('button');b.className='pill'+(k===skin?' on':'');b.dataset.k=k;b.textContent=n.replace('대신남 자동차 모드 · ','자동차 · ');l.appendChild(b)}
  p.hidden=false;const r=$('#skinBtn').getBoundingClientRect(),pr=p.getBoundingClientRect();
  p.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,r.left))+'px';p.style.top=Math.min(innerHeight-pr.height-8,r.bottom+6)+'px'}
$('#skinBtn').onclick=e=>{e.stopPropagation();if($('#skinPick').hidden)skinPickOpen();else skinPickClose()};
$('#skinPickList').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;const s=$('#skin');s.value=b.dataset.k;s.dispatchEvent(new Event('change'));skinPickClose()});
document.addEventListener('pointerdown',e=>{if(!$('#skinPick').hidden&&!e.target.closest('#skinPick,#skinBtn'))skinPickClose()},true);
window.addEventListener('scroll',()=>{if(!$('#skinPick').hidden)skinPickClose()},{passive:true});

/* ---------- 나침반 계기(날씨 계기와 같은 장착판·베젤) ---------- */
const CMP_KO=['북','북동','동','남동','남','남서','서','북서'];
function drawCmpDial(cv,hdg,on){if(CPX())return antCmp(cv,hdg,on);const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  const pl=ctx.createLinearGradient(-R,-R,R,R);pl.addColorStop(0,DIAL().pl[0]);pl.addColorStop(1,DIAL().pl[1]);ctx.fillStyle=pl;ctx.beginPath();ctx.roundRect(-R+1,-R+1,S-2,S-2,S*.12);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const sx=x*R*.8,sy=y*R*.8,r=S*.035,g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,0,sx,sy,r);g.addColorStop(0,DIAL().sc[0]);g.addColorStop(1,DIAL().sc[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();ctx.strokeStyle='#1a1d20';ctx.lineWidth=S*.008;ctx.beginPath();ctx.moveTo(sx-r*.7,sy+r*.7);ctx.lineTo(sx+r*.7,sy-r*.7);ctx.stroke()}
  const bz=ctx.createLinearGradient(0,-R,0,R);bz.addColorStop(0,DIAL().bz[0]);bz.addColorStop(.5,DIAL().bz[1]);bz.addColorStop(1,DIAL().bz[2]);ctx.fillStyle=bz;ctx.beginPath();ctx.arc(0,0,R*.9,0,7);ctx.fill();
  ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  // 돌아가는 방위판: 위쪽이 지금 진행 방향
  ctx.save();ctx.rotate(-(on?hdg:0)*Math.PI/180);
  for(let d=0;d<360;d+=5){const a=d*Math.PI/180,big=d%30===0,mid=d%10===0,r1=R*.77,r2=big?R*.63:mid?R*.68:R*.72;
    ctx.strokeStyle=big?'#eef2e6':'#9fa99a';ctx.lineWidth=big?S*.018:S*.008;ctx.beginPath();ctx.moveTo(Math.sin(a)*r1,-Math.cos(a)*r1);ctx.lineTo(Math.sin(a)*r2,-Math.cos(a)*r2);ctx.stroke()}
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(let d=0;d<360;d+=30){const a=d*Math.PI/180,card={0:'N',90:'E',180:'S',270:'W'}[d],t=card||String(d/10);
    ctx.save();ctx.rotate(a);ctx.translate(0,-R*.52);ctx.fillStyle=card==='N'?'#ff6a4d':card?'#eef2e6':'#a8f08f';
    ctx.font=`700 ${card?S*.11:S*.075}px "Barlow Condensed","Rajdhani",sans-serif`;ctx.fillText(t,0,0);ctx.restore()}
  ctx.restore();
  // 고정 표시: 위쪽 기준선(호박색)과 가운데 비행기
  ctx.fillStyle='#f3bc65';ctx.beginPath();ctx.moveTo(0,-R*.79);ctx.lineTo(-S*.035,-R*.92);ctx.lineTo(S*.035,-R*.92);ctx.closePath();ctx.fill();
  ctx.strokeStyle=on?'#f3bc65':'#6b7468';ctx.lineWidth=S*.022;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(0,-R*.22);ctx.lineTo(0,R*.2);ctx.moveTo(-R*.2,-R*.02);ctx.lineTo(R*.2,-R*.02);ctx.moveTo(-R*.09,R*.17);ctx.lineTo(R*.09,R*.17);ctx.stroke();
  ctx.fillStyle='#e7e9df';ctx.font=`600 ${S*.1}px "Share Tech Mono",monospace`;ctx.fillText(on?String(Math.round(hdg)%360).padStart(3,'0'):'---',0,R*.42);
  const gl=ctx.createLinearGradient(-R*.6,-R*.8,R*.3,R*.2);gl.addColorStop(0,'#ffffff1f');gl.addColorStop(.45,'#ffffff05');gl.addColorStop(.46,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
let cmpLast='';
function cmpTick(){if(document.hidden||!document.documentElement.hasAttribute('data-ck2'))return;
  const on=gpsOn&&hdgNow>=0,h=on?((hdgDisp%360)+360)%360:0,key=on?(Math.round(h*2)/2)+'':gpsOn?'wait':'off';if(key===cmpLast)return;cmpLast=key;
  try{drawCmpDial($('#cmpDial'),h,on)}catch(e){}
  $('#cmpB').textContent=on?Math.round(h)%360+'°':'---°';
  $('#cmpE').textContent=on?CMP_KO[Math.round(h/45)%8]+'쪽':gpsOn?'방향 찾는 중':'GPS 꺼짐 · 눌러서 켜기'}
setInterval(cmpTick,150);cmpTick();
/* 나침반을 누르면 자세한 정보 창(방향·출처·GPS 상태·정확도·위성·속도·고도·좌표), 창 안에서 GPS 켜고 끄기 */
const CMP16=['북','북북동','북동','동북동','동','동남동','남동','남남동','남','남남서','남서','서남서','서','서북서','북서','북북서'];
let cpT=0;
function cpFill(){const fix=gpsOn&&gs&&gs.fix,on=hdgNow>=0,h=on?((hdgNow%360)+360)%360:0,v=(x,u,d=0)=>x==null||!isFinite(x)?'—':(+x).toFixed(d)+u;
  $('#cpDeg').textContent=on?String(Math.round(h)%360).padStart(3,'0')+'°':'---°';$('#cpDir').textContent=on?CMP16[Math.round(h/22.5)%16]+'쪽':'방향 없음';
  const moving=fix&&spdNow>9;$('#cpSrc').textContent=!on?'없음':(typeof att!=='undefined'&&att.on&&att.hdg>=0)?'방향 센서(나침반)':moving?'GPS 진행 방향':'방향 센서(나침반)';
  $('#cpGps').textContent=!gpsOn?'꺼짐':fix?'위치 잡힘':'위치 찾는 중';
  $('#cpAcc').textContent=fix&&gs.acc>=0?'±'+Math.round(gs.acc)+' m':'—';
  $('#cpSat').textContent=gs&&gs.satsUsed>=0?gs.satsUsed+' / '+(gs.satsSeen>=0?gs.satsSeen:'?')+' 개':'—';
  $('#cpSpd').textContent=fix?v(spdNow,' km/h',1):'—';$('#cpAlt').textContent=fix&&gs.alt>-9000?v(gs.alt,' m'):'—';
  $('#cpLat').textContent=fix&&isFinite(gs.lat)?(+gs.lat).toFixed(5)+'°':'—';$('#cpLon').textContent=fix&&isFinite(gs.lon)?(+gs.lon).toFixed(5)+'°':'—';
  $('#cpGpsBtn').textContent=gpsOn?'GPS 끄기':'GPS 켜기';$('#cpGpsBtn').classList.toggle('on',!gpsOn)}
function cpClose(){$('#cmpPick').hidden=true;clearInterval(cpT)}
function cpOpen(){const p=$('#cmpPick');p.hidden=false;cpFill();clearInterval(cpT);cpT=setInterval(cpFill,500);
  const r=$('#clkCmp').getBoundingClientRect(),pr=p.getBoundingClientRect();p.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,r.left))+'px';p.style.top=Math.max(8,Math.min(innerHeight-pr.height-8,r.bottom+6))+'px'}
$('#clkCmp').onclick=()=>{if($('#cmpPick').hidden)cpOpen();else cpClose()};
$('#cpClose').onclick=cpClose;
$('#cpGpsBtn').onclick=()=>{try{if(gpsOn)gpsStop(true);else{gpsStart();toast('GPS를 켰어요. 움직이거나 나침반이 잡히면 방향이 나와요.')}}catch(e){}cpFill()};
document.addEventListener('pointerdown',e=>{if(!$('#cmpPick').hidden&&!e.target.closest('#cmpPick,#clkCmp'))cpClose()},true);
window.addEventListener('scroll',()=>{if(!$('#cmpPick').hidden)cpClose()},{passive:true});

/* ---------- 알림 접근: "제한된 설정" 단계별 안내 ---------- */
function notifGranted(){try{return !!JSON.parse(NB.extStatus()).notif}catch(e){return false}}
function nhOpen(step){const h=$('#notifHelp');h.hidden=false;h.querySelectorAll('li[data-s]').forEach(li=>li.classList.toggle('now',+li.dataset.s===step))}
let nhTry=0,nhStep=0;
if(HAS_EXT){
  $('#xNotif').onclick=()=>{nhTry=Date.now();nhStep=1;try{NB.openNotificationAccess()}catch(e){}};
  $('#xNotifHelp').onclick=()=>nhOpen(notifGranted()?3:1);
  $('#nh1').onclick=()=>{nhTry=Date.now();nhStep=1;try{NB.openNotificationAccess()}catch(e){}};
  $('#nh2').onclick=()=>{nhTry=Date.now();nhStep=2;try{NB.openAppInfo()}catch(e){toast('설정 → 애플리케이션에서 "대신남 원 Ver1"을 찾아 주세요.')}};
  $('#nh3').onclick=()=>{nhTry=Date.now();nhStep=3;try{NB.openNotificationAccess()}catch(e){}};
  // 설정에서 돌아왔는데 아직 허용되지 않았으면 다음 단계를 보여 줌
  document.addEventListener('visibilitychange',()=>{if(document.hidden||!nhTry||Date.now()-nhTry>5*60e3)return;
    setTimeout(()=>{if(notifGranted()){nhTry=0;$('#notifHelp').hidden=true;toast('알림 접근이 허용됐어요. 이제 곡 정보가 보여요.');return}nhOpen(nhStep>=3?2:nhStep+1)},600)});
}
$('#nhClose').onclick=()=>{$('#notifHelp').hidden=true;nhTry=0};
$('#notifHelp').addEventListener('click',e=>{if(e.target.id==='notifHelp'){$('#notifHelp').hidden=true;nhTry=0}});
/* ===== 97-brightness.js ===== */
// 상단 밝기 카드(해외 시간 자리 · 콕핏은 나침반 옆): 이 앱 화면 밝기를 바로 조절
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 값: 10~100(%) 또는 -1(자동 = 시스템 밝기). 저장 키 scrBri. 태블릿 스킨은 자기 밝기 손잡이(bri)를 따로 씀 */
const BRI_MIN=10,BRI_MAX=100,BRI_STEP=10;
let scrBri=(()=>{const v=+store.get('scrBri',-1);return v>=BRI_MIN&&v<=BRI_MAX?v:-1})();
function briNative(v){try{NB&&NB.setScreenBrightness&&NB.setScreenBrightness(v)}catch(e){}}
function briSet(v,save=true){v=v<0?-1:Math.max(BRI_MIN,Math.min(BRI_MAX,Math.round(v/5)*5));scrBri=v;
  if(!isTab())briNative(v);if(save)store.set('scrBri',v);briUi()}
function briBase(){return scrBri<0?60:scrBri} // 자동에서 −/＋를 누르면 60%에서 시작
function briUi(){const t=scrBri<0?'자동':scrBri+'%';$('#briV').textContent=t;$('#briPV').textContent=scrBri<0?'자동 (시스템 밝기)':scrBri+'%';
  $('#briRange').value=briBase();$('#briDn').disabled=scrBri===BRI_MIN;$('#briUp').disabled=scrBri===BRI_MAX;
  document.querySelectorAll('#briPre button').forEach(b=>b.classList.toggle('on',+b.dataset.v===scrBri));
  try{drawBriDial($('#briDial'),scrBri)}catch(e){}}
/* 계기: 날씨·나침반과 같은 장착판·베젤, 270° 눈금 호에 지금 밝기 */
function drawBriDial(cv,v){if(CPX())return antBri(cv,v);const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  const pl=ctx.createLinearGradient(-R,-R,R,R);pl.addColorStop(0,DIAL().pl[0]);pl.addColorStop(1,DIAL().pl[1]);ctx.fillStyle=pl;ctx.beginPath();ctx.roundRect(-R+1,-R+1,S-2,S-2,S*.12);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const sx=x*R*.8,sy=y*R*.8,r=S*.035,g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,0,sx,sy,r);g.addColorStop(0,DIAL().sc[0]);g.addColorStop(1,DIAL().sc[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();ctx.strokeStyle='#1a1d20';ctx.lineWidth=S*.008;ctx.beginPath();ctx.moveTo(sx-r*.7,sy+r*.7);ctx.lineTo(sx+r*.7,sy-r*.7);ctx.stroke()}
  const bz=ctx.createLinearGradient(0,-R,0,R);bz.addColorStop(0,DIAL().bz[0]);bz.addColorStop(.5,DIAL().bz[1]);bz.addColorStop(1,DIAL().bz[2]);ctx.fillStyle=bz;ctx.beginPath();ctx.arc(0,0,R*.9,0,7);ctx.fill();
  ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  const a0=Math.PI*.75,sw=Math.PI*1.5,auto=v<0,f=auto?0:(v-BRI_MIN)/(BRI_MAX-BRI_MIN);
  for(let i=0;i<=18;i++){const a=a0+sw*i/18,big=i%2===0,r1=R*.74,r2=big?R*.62:R*.68;ctx.strokeStyle=!auto&&i/18<=f+1e-6?'#f3bc65':'#4f584b';ctx.lineWidth=big?S*.02:S*.01;
    ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke()}
  // 가운데 해 모양(밝을수록 환하게)
  const k=auto?.55:.35+f*.65,sr=R*.16;ctx.fillStyle=`rgba(243,188,101,${k})`;ctx.beginPath();ctx.arc(0,-R*.08,sr,0,7);ctx.fill();
  ctx.strokeStyle=`rgba(243,188,101,${k})`;ctx.lineWidth=S*.016;ctx.lineCap='round';
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*sr*1.45,-R*.08+Math.sin(a)*sr*1.45);ctx.lineTo(Math.cos(a)*sr*1.95,-R*.08+Math.sin(a)*sr*1.95);ctx.stroke()}
  if(!auto){const a=a0+sw*f;ctx.strokeStyle='#eef2e6';ctx.lineWidth=S*.022;ctx.beginPath();ctx.moveTo(Math.cos(a)*R*.5,Math.sin(a)*R*.5);ctx.lineTo(Math.cos(a)*R*.76,Math.sin(a)*R*.76);ctx.stroke()}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e7e9df';ctx.font=`600 ${S*(auto?.1:.12)}px "Share Tech Mono",monospace`;ctx.fillText(auto?'AUTO':v+'%',0,R*.4);
  const gl=ctx.createLinearGradient(-R*.6,-R*.8,R*.3,R*.2);gl.addColorStop(0,'#ffffff1f');gl.addColorStop(.45,'#ffffff05');gl.addColorStop(.46,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
function briPickClose(){$('#briPick').hidden=true}
function briPickOpen(){const p=$('#briPick');p.hidden=false;briUi();const r=$('#clkBri').getBoundingClientRect(),pr=p.getBoundingClientRect();
  p.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,r.left))+'px';p.style.top=Math.max(8,Math.min(innerHeight-pr.height-8,r.bottom+6))+'px'}
$('#briDn').onclick=e=>{e.stopPropagation();briSet(briBase()-BRI_STEP)};
$('#briUp').onclick=e=>{e.stopPropagation();briSet(briBase()+BRI_STEP)};
$('#clkBri').onclick=e=>{if(e.target.closest('.bri-b'))return;if($('#briPick').hidden)briPickOpen();else briPickClose()};
$('#briRange').oninput=e=>briSet(+e.target.value);
$('#briPDn').onclick=()=>briSet(briBase()-BRI_STEP);$('#briPUp').onclick=()=>briSet(briBase()+BRI_STEP);
$('#briPre').onclick=e=>{const b=e.target.closest('button[data-v]');if(b)briSet(+b.dataset.v)};
document.addEventListener('pointerdown',e=>{if(!$('#briPick').hidden&&!e.target.closest('#briPick,#clkBri'))briPickClose()},true);
window.addEventListener('scroll',()=>{if(!$('#briPick').hidden)briPickClose()},{passive:true});
// 태블릿 스킨을 나오면 태블릿 쪽이 시스템 밝기로 되돌리므로, 스킨이 바뀔 때마다 이 설정을 다시 적용
new MutationObserver(()=>setTimeout(()=>{if(!isTab())briNative(scrBri)},60)).observe(document.documentElement,{attributes:true,attributeFilter:['data-skin']});
briSet(scrBri,false);window.AmpBri={set:briSet,get:()=>scrBri};
/* ===== 98-cockpit-special.js ===== */
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
/* ===== 99-power-boot.js ===== */
// 배터리 절전, 후진 설정, 시작(boot)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 배터리: 절전 모드(자동/항상/끄기)와 재생 중 화면 켜 두기 ---------- */
let pwrBat=null;
function pwrRead(){try{if(NB&&NB.battery){pwrBat=JSON.parse(NB.battery());return pwrApply()}}catch(e){}
  try{navigator.getBattery&&navigator.getBattery().then(b=>{pwrBat={pct:Math.round(b.level*100),chg:b.charging};pwrApply()})}catch(e){}}
function pwrApply(){const m=store.get('pwrMode','auto'),low=!!(pwrBat&&!pwrBat.chg&&pwrBat.pct<=30);pwrSaver=m==='on'||(m==='auto'&&low);
  window.AmpPwr={saver:pwrSaver};document.documentElement.toggleAttribute('data-saver',pwrSaver);
  const n=$('#sPwrNow');if(n)n.textContent=(pwrBat?'배터리 '+pwrBat.pct+'%'+(pwrBat.chg?' · 충전 중':'')+' · ':'')+(pwrSaver?'지금 절전 모드 켜짐':'지금 절전 모드 꺼짐');
  document.querySelectorAll('#sPwr button').forEach(b=>b.classList.toggle('on',b.dataset.v===m));
  const sm=scrMode();document.querySelectorAll('#sScr button').forEach(b=>b.classList.toggle('on',b.dataset.v===sm));
  try{NB&&NB.setScreenAlways&&NB.setScreenAlways(sm==='always')}catch(e){}
  try{NB&&NB.setScreenOnPlay&&NB.setScreenOnPlay(sm!=='off')}catch(e){}}
/* 화면 켜 두기: always(기본, 앱이 켜진 동안 수면 모드 없음) · play(재생 중만) · off. 예전 값(auto/on)은 '항상'으로 */
function scrMode(){const v=store.get('scrMode2',null);return v==='play'||v==='off'?v:'always'}
$('#sPwr').onclick=e=>{const b=e.target.closest('button');if(!b)return;store.set('pwrMode',b.dataset.v);pwrApply()};
$('#sScr').onclick=e=>{const b=e.target.closest('button');if(!b)return;store.set('scrMode2',b.dataset.v);pwrApply()};
$('#revBtn').onclick=()=>window.AmpRev.toggle();
$('#sRevOn').checked=store.get('revOn',true)!==false;$('#sRevOn').onchange=e=>{store.set('revOn',e.target.checked);if(!e.target.checked)revSet(false)};
$('#sRevAuto').checked=!!store.get('revAuto',false);$('#sRevAuto').onchange=e=>{store.set('revAuto',e.target.checked);if(e.target.checked){try{attWant(true)}catch(x){}toast('자동 감지를 켰어요. 휴대폰이 차 앞쪽을 보게 거치돼 있어야 해요.')}};
function revVolUi(){const v=revVol();document.querySelectorAll('#sRevVol button[data-v]').forEach(b=>b.classList.toggle('on',Math.abs(+b.dataset.v-v)<.01))}revVolUi();
$('#sRevVol').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='sRevTest'){if(rev.on)revSet(false);else revSet(true,'test');return}store.set('revVol',+b.dataset.v);revVolUi()};
pwrRead();setInterval(pwrRead,60e3);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pwrRead()});
applySizes();setGStyle(isCp()?store.get('gStyleCk','cockpit'):gStyle);setSkin(skin);mapApply();layout();gpsUi();flags();syncOn();syncVis();renderList();setMode(mode,true);requestAnimationFrame(frame);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{readSkin();drawCurve()});
if(LIB){$('#addDir').hidden=false;$('#plHint').textContent='음악 파일이나 폴더를 고르면 목록이 저장돼서, 앱을 다시 켜도 그대로 남고 마지막 곡과 위치부터 이어서 들을 수 있어요. 폴더로 추가하면 새로 넣은 곡도 다시 추가하기 쉬워요.'}
const restored=restorePlaylist();
if(NB&&NB.takeCarAutoplay){try{if(NB.takeCarAutoplay())setTimeout(()=>window.__carConnected(''),1200)}catch(e){}}
if(!restored)(async()=>{
  try{
    const buf=await renderDemo();
    const art=demoArt();
    if(list.length)return; // 데모를 만드는 사이에 사용자가 곡을 추가했으면 데모는 넣지 않음
    list.unshift({title:'Neon Harbor (데모)',artist:'Daesinnam',url:URL.createObjectURL(toWav(buf)),size:buf.length*buf.numberOfChannels*2,duration:buf.duration,art});
    if(cur>=0)cur++;else cur=0;
    renderList();if(mode==='local'){updateMeta();audio.src=list[cur].url}
  }catch(e){if(mode==='local')setMarquee('“+ 음악 추가”를 눌러 파일을 불러오세요')}
})();
// 설정의 스킨·화면 배치(위 도구 줄과 같은 값) — 콕핏 수정판은 도구 줄에서 이 둘을 숨기고 설정에서 고름
(function(){const pairs=[['#sSkinSel','#skin'],['#sLayoutSel','#layout']];
  for(const [a,b] of pairs){const s=$(a),o=$(b);if(!s||!o)continue;s.innerHTML=o.innerHTML;s.value=o.value;
    s.onchange=()=>{o.value=s.value;o.dispatchEvent(new Event('change'))};o.addEventListener('change',()=>{s.value=o.value})}})();
// NOW PLAYING 빈 화면: 곡·라디오·외부 앱이 없으면 안내와 버튼
$('#npAdd').onclick=()=>pickMusic(false);$('#npRadio').onclick=()=>{try{openRadio()}catch(e){}};
function npEmptySync(){const has=(cur>=0&&list[cur])||rdPlaying||(mode==='ext'&&ext&&ext.title);$('#wVis').classList.toggle('np-empty',!has)}
npEmptySync();setInterval(npEmptySync,1000);
if(window.__skinNote)setTimeout(()=>{const n=(SKINS.find(x=>x[0]===window.__skinNote)||[,''])[1];toast('스킨을 정리했어요. 지금은 "'+n+'" 스킨이에요. 위 [🎨 스킨]에서 바꿀 수 있어요.')},1800);
})();
