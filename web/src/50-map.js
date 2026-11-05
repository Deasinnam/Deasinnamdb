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
document.querySelectorAll('#wMap [data-nav]').forEach(b=>b.onclick=()=>{const r=navOpen(b.dataset.nav,b.dataset.at);
  if((b.dataset.at==='top'||b.dataset.at==='bottom')&&r&&r!=='missing')setTimeout(()=>{const w=$('#wMap');if(w&&!w.classList.contains('collapsed'))w.scrollIntoView({block:'start',behavior:'smooth'})},900)});
if(!HAS_EXT&&!(NB&&NB.openApp)){document.querySelectorAll('#wMap .navrow').forEach(b=>b.hidden=true)}

