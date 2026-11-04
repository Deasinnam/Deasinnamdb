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

