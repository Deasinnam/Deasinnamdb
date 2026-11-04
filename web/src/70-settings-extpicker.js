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
  beep(k){try{if(k==='takeoff'&&typeof sndTakeoff==='function')sndTakeoff();else if(typeof sndRoger==='function')sndRoger()}catch(e){}}
};
/* 태블릿 가로모드(tablet.js) 연결 창구: 읽기·호출만 하고 기존 동작은 바꾸지 않음 */
/* 블랙박스 화면 반전(좌우·상하): 거꾸로 달린 카메라·후방 카메라용, 이 기기에 기억 */
(function(){const img=$('#camImg'),bh=$('#camFlipH'),bv=$('#camFlipV');if(!img||!bh)return;
  const apply=()=>{const h=!!store.get('camFlipH',false),v=!!store.get('camFlipV',false);img.style.setProperty('--cfx',h?-1:1);img.style.setProperty('--cfy',v?-1:1);
    bh.classList.toggle('on',h);bh.setAttribute('aria-pressed',String(h));bv.classList.toggle('on',v);bv.setAttribute('aria-pressed',String(v))};
  bh.onclick=()=>{store.set('camFlipH',!store.get('camFlipH',false));apply()};bv.onclick=()=>{store.set('camFlipV',!store.get('camFlipV',false));apply()};apply()})();
/* ---------- 외부 음악 앱 선곡: 앱을 열지 않고 이 앱 안에서 대기열·둘러보기 ---------- */
window.AmpExt=(()=>{
  const PK={ytm:'com.google.android.apps.youtube.music',spotify:'com.spotify.music'},NAME={[PK.ytm]:'YouTube Music',[PK.spotify]:'Spotify'};
  const ok=!!(NB&&NB.extQueue);let view=store.get('xpView','queue'),crumbs=[],bitems=null,bok=null,bpkg='',loading=false;const subs=new Set();
  window.__extBrowse=s=>{let o={};try{o=JSON.parse(s)}catch(e){}loading=false;bok=!!o.ok;bitems=o.items||[];bpkg=o.pkg||bpkg;if(o.ok&&o.parent&&!crumbs.length)crumbs=[{id:o.parent,t:'처음'}];subs.forEach(f=>{try{f()}catch(e){}})};
  const curPkg=()=>(ext&&ext.pkg&&NAME[ext.pkg]?ext.pkg:null)||store.get('extPkg',PK.ytm);
  const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function start(pkg){store.set('extPkg',pkg);store.set('lastSrc','ext');try{if(window.AmpRadio&&AmpRadio.state.playing)AmpRadio.stop()}catch(e){}
    if(mode!=='ext')setMode('ext');try{NB.mediaPlay(pkg)}catch(e){}if(bpkg!==pkg){bitems=null;crumbs=[]}toast((NAME[pkg]||'음악 앱')+'을 이 앱 안에서 재생해요. 아래 목록에서 곡을 고르세요.')}
  function queue(){try{return JSON.parse(NB.extQueue())}catch(e){return {items:[]}}}
  function render(ul){if(!ul)return;const st=ul.scrollTop,pk=curPkg(),nm=NAME[pk]||'외부 앱';let h='<li class="xp-head"><span class="xp-apps">'+
      Object.values(PK).map(p=>'<button data-xapp="'+p+'" class="'+(p===pk?'on':'')+'">'+NAME[p]+'</button>').join('')+'</span><span class="xp-tabs"><button data-xv="queue" class="'+(view==='queue'?'on':'')+'">대기열</button><button data-xv="browse" class="'+(view==='browse'?'on':'')+'">둘러보기</button></span></li>';
    if(!ok)h+='<li class="xp-empty">YouTube Music·Spotify 선곡은 휴대폰 앱에서 쓸 수 있어요.</li>';
    else if(view==='queue'){const q=queue(),it=q.items||[];
      if(!it.length)h+='<li class="xp-empty">'+esc(nm)+'에서 받은 재생 목록이 없어요. 위에서 앱을 눌러 재생을 시작하거나 [둘러보기]를 써 보세요.<br><small>곡 정보는 알림 접근 권한이 있어야 받아요.</small></li>';
      else it.forEach((x,i)=>{h+='<li class="xp-it'+(x.cur?' cur':'')+'" data-q="'+x.id+'"><span class="n">'+String(i+1).padStart(2,'0')+'</span><span class="nm"><b>'+esc(x.title)+'</b><small>'+esc(x.sub)+'</small></span></li>'})}
    else{if(bitems===null||bpkg!==pk){if(!loading){loading=true;bpkg=pk;bitems=null;crumbs=[];try{NB.extBrowse(pk,'')}catch(e){loading=false;bok=false;bitems=[]}}h+='<li class="xp-empty">'+esc(nm)+' 목록을 불러오는 중…</li>'}
      else if(!bok)h+='<li class="xp-empty">'+esc(nm)+'은(는) 다른 앱에서 둘러보기를 막아 두었어요. [대기열]에서 고르거나 앱을 열어 고르세요.<br><button class="xp-open" data-xopen="'+pk+'">'+esc(nm)+' 열기</button></li>';
      else{if(crumbs.length>1)h+='<li class="xp-it back" data-xback="1"><span class="n">◀</span><span class="nm"><b>'+esc(crumbs[crumbs.length-1].t)+'</b><small>위로</small></span></li>';
        if(!bitems.length)h+='<li class="xp-empty">비어 있어요.</li>';
        bitems.forEach(x=>{h+='<li class="xp-it'+(x.folder?' dir':'')+'" '+(x.folder?'data-xf':'data-xm')+'="'+esc(x.id)+'" data-t="'+esc(x.title)+'"><span class="n">'+(x.folder?'▸':'♪')+'</span><span class="nm"><b>'+esc(x.title)+'</b><small>'+esc(x.sub)+'</small></span></li>'})}}
    ul.innerHTML=h;ul.scrollTop=st}
  function bind(ul){if(!ul||ul.__xp)return;ul.__xp=1;ul.addEventListener('click',e=>{const b=e.target.closest('[data-xv],[data-xapp],[data-q],[data-xf],[data-xm],[data-xback],[data-xopen]');if(!b)return;e.stopPropagation();
      if(b.dataset.xv){view=b.dataset.xv;store.set('xpView',view)}
      else if(b.dataset.xapp)start(b.dataset.xapp);
      else if(b.dataset.q!=null){try{NB.extPlayQueue(+b.dataset.q)}catch(x){}}
      else if(b.dataset.xf!=null){crumbs.push({id:b.dataset.xf,t:b.dataset.t||''});loading=true;bitems=[];try{NB.extBrowse(curPkg(),b.dataset.xf)}catch(x){}}
      else if(b.dataset.xback){crumbs.pop();const c=crumbs[crumbs.length-1];loading=true;try{NB.extBrowse(curPkg(),c?c.id:'')}catch(x){}}
      else if(b.dataset.xm!=null){try{NB.extBrowsePlay(curPkg(),b.dataset.xm)}catch(x){}toast('선택한 곡을 틀어요.')}
      else if(b.dataset.xopen){try{NB.openApp(b.dataset.xopen)}catch(x){}}
      setTimeout(()=>render(ul),60)});subs.add(()=>render(ul))}
  return {PK,NAME,start,render,bind,ok,get view(){return view}};
})();
// 큰 화면(외부 앱 창): 앱 버튼은 앱을 열지 않고 이 앱 안에서 선곡
document.querySelectorAll('[data-xstart]').forEach(b=>b.onclick=()=>{AmpExt.start(b.dataset.xstart);AmpExt.render($('#xPick'))});
AmpExt.bind($('#xPick'));
setInterval(()=>{const w=$('#wExt');if(mode==='ext'&&w&&!w.hidden&&!w.classList.contains('collapsed')&&!document.hidden&&AmpExt.view==='queue')AmpExt.render($('#xPick'))},2000);
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
