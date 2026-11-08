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
    if(window.jsmediatags) try{window.jsmediatags.read(f,{onSuccess:tag=>{const t=tag.tags||{};if(t.title)it.title=t.title;if(t.artist)it.artist=t.artist;{const L=t.lyrics;const s=L&&(typeof L==='string'?L:L.lyrics||(L.data&&L.data.lyrics));if(s&&String(s).trim())it.lyrics=String(s)}if(t.picture){const p=t.picture;it.art=URL.createObjectURL(new Blob([new Uint8Array(p.data)],{type:p.format}))}renderList();if(list[cur]===it){updateMeta();lastArtSent=null;bridgeState(true)}},onError:()=>{}})}catch(e){}
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

