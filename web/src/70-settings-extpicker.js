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
  sfx(k,v){try{const S=AmpSfx;if(k==='roll')S.rollSpeed(v);else if(S[k])S[k]()}catch(e){}},
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
