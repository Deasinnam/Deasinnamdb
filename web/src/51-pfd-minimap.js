/* 1.50 스피드미터(콕핏 PFD) 왼쪽 아래 원형 지도: 기본 지도(OpenStreetMap)를 진행 방향이 위로 오게 돌려 실시간으로 따라감
 *  - 가운데 화살표가 내 차, 테두리의 N이 북쪽. GPS가 없으면 흐리게 "GPS" 표시
 *  - 원 위 작은 × 로 끄고, 끈 자리의 [지도] 버튼으로 다시 켬(설정 > 화면 · 스킨에도 같은 스위치) */
const PfdMap=(()=>{
  // 1.51 지도 모양: GTA 모드(어두운 바탕 주황 지도) / 일반 지도(스피드미터가 주간이면 주간 지도, 야간이면 야간 지도 자동)
  let style=store.get('pfdMapStyle','gta'),odo=null;
  let on=store.get('pfdMap',true),host=null,map=null,inner=null,me=null,nEl=null,lastSet=0,rot=0,wrap=null;
  const ui=()=>{const s=$('#sPfdMap');if(s)s.checked=on;const ss=$('#sPfdMapStyle');if(ss)ss.value=style;if(host){host.classList.toggle('off',!on);host.querySelector('.pm-x').setAttribute('aria-label',on?'원형 지도 끄기':'원형 지도 켜기');host.querySelector('.pm-x').textContent=on?'×':'지도'}};
  function setStyle(v){style=v==='normal'||v==='day'?v:'gta';store.set('pfdMapStyle',style);ui();paint()}
  const isDay=()=>{try{return !!window.AmpPfd.panel.day}catch(e){return true}};
  function paint(){if(!host)return;const pn=!isDay(),k=style==='gta'?'gta':style==='day'||!pn?'day':'night';nightFx(k==='night');
    {const b=host.querySelector('.pm-sun');host.classList.toggle('pnight',pn);const t=style==='day'?'☾ 야간 지도':'☀ 주간 지도';if(b.textContent!==t){b.textContent=t;b.setAttribute('aria-label',style==='day'?'야간 지도로 보기':'야간에도 밝은 주간 지도로 보기')}}if(host.dataset.look!==k){host.dataset.look=k;host.querySelector('.pm-ring').setAttribute('aria-label','지도 모양: '+(k==='gta'?'GTA 모드':k==='day'?'일반 주간':'일반 야간')+' (누르면 바꿈)')}}
  /* 1.57 야간 지도: 바탕은 어둡게 뒤집되 강·호수는 주간처럼 파랗게 살리고, 강가를 따라 주황 가로등 불빛(SVG 필터).
   *  OSM 물 색(#aad3df)은 파랑−빨강 차이가 커서 그것만 골라냄 */
  function nightFx(on){if(!on||document.getElementById('pmNightFx'))return;const d=document.createElement('div');d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';d.setAttribute('aria-hidden','true');
    d.innerHTML='<svg width="0" height="0"><filter id="pmNightFx" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
      +'<feColorMatrix in="SourceGraphic" type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" result="inv"/>'
      +'<feColorMatrix in="inv" type="hueRotate" values="180" result="hr"/>'
      +'<feColorMatrix in="hr" type="matrix" values=".74 0 0 0 0  0 .76 0 0 0  0 0 .8 0 0  0 0 0 1 0" result="base"/>'
      +'<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 .09  0 0 0 0 .30  0 0 0 0 .58  -9 0 9 0 -.75" result="water"/>'
      +'<feMorphology in="water" operator="dilate" radius="2" result="wd"/>'
      +'<feComposite in="wd" in2="water" operator="out" result="bank"/>'
      +'<feColorMatrix in="bank" type="matrix" values="0 0 0 0 1  0 0 0 0 .78  0 0 0 0 .38  0 0 0 1 0" result="lamp"/>'
      +'<feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="1" seed="7" result="nz"/>'
      +'<feColorMatrix in="nz" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 9 -4.2" result="dots"/>'
      +'<feComposite in="lamp" in2="dots" operator="in" result="lampDots"/>'
      +'<feGaussianBlur in="lamp" stdDeviation="2.2" result="glow"/>'
      +'<feComponentTransfer in="glow" result="glow2"><feFuncA type="linear" slope="1.4"/></feComponentTransfer>'
      +'<feMerge><feMergeNode in="base"/><feMergeNode in="water"/><feMergeNode in="glow2"/><feMergeNode in="lamp"/><feMergeNode in="lampDots"/></feMerge>'
      +'</filter></svg>';document.body.appendChild(d)}
  function set(v){on=!!v;store.set('pfdMap',on);if(!on&&map){map.remove();map=null;if(inner)inner.innerHTML=''}ui();if(on)attach(true)}
  function build(w){wrap=w;host=document.createElement('div');host.className='pfd-mini';host.innerHTML='<div class="pm-ring"><div class="pm-map"></div><i class="pm-me" aria-hidden="true"></i><b class="pm-n" aria-hidden="true">N</b><span class="pm-msg">GPS</span></div><button type="button" class="pm-x"></button><button type="button" class="pm-sun"></button>';
    host.setAttribute('role','img');host.setAttribute('aria-label','진행 방향 지도');w.appendChild(host);inner=host.querySelector('.pm-map');me=host.querySelector('.pm-me');nEl=host.querySelector('.pm-n');
    host.querySelector('.pm-x').onclick=e=>{e.stopPropagation();set(!on)};
    // 1.59 야간 계기에서 바로 [☀ 주간 지도] ↔ [☾ 야간 지도] (설정을 열지 않아도)
    host.querySelector('.pm-sun').onclick=e=>{e.stopPropagation();setStyle(style==='day'?'normal':'day');toast(style==='day'?'원형 지도: 야간에도 밝은 주간 지도':'원형 지도: 야간 지도(강줄기·불빛)')};
    // 지도 원을 누르면 GTA 모드 ↔ 일반 지도
    const ring=host.querySelector('.pm-ring');ring.setAttribute('role','button');ring.tabIndex=0;ring.onclick=e=>{e.stopPropagation();setStyle(style==='gta'?'normal':style==='normal'?'day':'gta');toast(style==='gta'?'원형 지도: GTA 모드':style==='day'?'원형 지도: 항상 주간 지도':'원형 지도: 일반 지도(주간·야간 자동)')};
    // 오른쪽 아래 총 주행거리(차계부 누적 거리, GPS로 자동 증가). 누르면 차계부 열기
    odo=document.createElement('button');odo.type='button';odo.className='pfd-odo';odo.innerHTML='<small>총 주행</small><b>—</b><i>km</i>';w.appendChild(odo);
    odo.onclick=e=>{e.stopPropagation();const l=$('#wLog');if(l){l.classList.remove('collapsed');l.scrollIntoView({block:'start',behavior:'smooth'})}};
    ui();paint()}
  async function attach(force){
    const w=document.querySelector('#pfdHost .pfd-canvas-wrap');if(!w)return;
    if(!host||!w.contains(host)){if(map){map.remove();map=null}build(w)}
    if(!on||map||(!force&&!gpsOn&&BUILD!=='special'))return; // 1.62.1 스페셜: GPS를 켜기 전에도 지도를 띄움(마지막 위치)
    try{await loadLeaflet()}catch(e){return}if(map||!on)return;
    map=L.map(inner,{zoomControl:false,attributionControl:false,dragging:false,touchZoom:false,doubleClickZoom:false,scrollWheelZoom:false,boxZoom:false,keyboard:false,tap:false,inertia:false,fadeAnimation:false,zoomAnimation:true}).setView([gs.lat||37.5665,gs.lon||126.978],16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,keepBuffer:4,updateWhenIdle:false,updateWhenZooming:false}).addTo(map);
    host.title='지도 © OpenStreetMap contributors'}
  function tick(){
    const w=document.querySelector('#pfdHost .pfd-canvas-wrap');if(!w||w.offsetParent===null){return}
    if(!host||!w.contains(host)||(on&&!map&&(gpsOn||BUILD==='special')))attach();if(!host)return;
    paint();
    if(odo){let km=null;try{km=window.AmpLog&&AmpLog.state?AmpLog.state.odo:null}catch(e){}const t=km==null?'—':(Math.floor(km)).toLocaleString('ko-KR');const b=odo.querySelector('b');if(b.textContent!==t)b.textContent=t;odo.setAttribute('aria-label','총 주행거리 '+t+' 킬로미터. 누르면 차계부')}
    const fix=gpsOn&&gs&&gs.fix&&isFinite(gs.lat);host.classList.toggle('nofix',!fix);
    const small=w.clientHeight<230||w.clientWidth<300;host.classList.toggle('tiny',small);
    if(odo)odo.hidden=true; // 1.70 오른쪽 아래 총 주행거리는 뺌(사용자 요청 — 계기 위를 덜 가리게, 에어포스원은 위쪽 누적 주행거리 칩으로)
    // 1.59 원형 지도 잘림: 작게(또는 숨긴 채) 만들어진 뒤 커지면 Leaflet이 예전 크기만큼만 타일을 깔아 원의 일부가 비었음 → 크기가 바뀌면 다시 잼
    if(map&&inner.clientWidth>0){const sz=map.getSize();if(Math.abs(sz.x-inner.clientWidth)>1||Math.abs(sz.y-inner.clientHeight)>1){map.invalidateSize({pan:false,animate:false});if(fix)map.setView([gs.lat,gs.lon],map.getZoom(),{animate:false})}}
    // 1.62.1 스페셜: 수신 전(시연·GPS 대기)에도 까만 원 대신 마지막 위치(마지막 수신 → 날씨에 쓴 위치 → 서울) 지도를 보여 줌
    if(BUILD==='special'&&on&&map&&!fix){const now=performance.now();if(now-lastSet>5000){lastSet=now;const l=lastFix&&isFinite(lastFix.lat)?[lastFix.lat,lastFix.lon]:(store.get('wxLoc',null)||[37.5665,126.978]);map.setView(l,15,{animate:false})}}
    if(!on||!map||!fix)return;
    const now=performance.now();if(now-lastSet>900){lastSet=now;let z=spdNow>90?14:spdNow>40?15:16;{const v=window.AmpCam&&AmpCam.view,c=v&&Date.now()-v.t<4000&&v.cams[0];if(c&&c[3]<800)z=Math.min(z,c[3]>300?14:15)} /* 1.61 앞 카메라가 원 안에 들어오게 넓혀 봄 */map.setView([gs.lat,gs.lon],z,{animate:true,duration:.8});}
    // 진행 방향이 위: 지도를 반대로 돌리고, N 표시는 테두리를 따라 돎(359→0도 매끄럽게)
    if(hdgNow>=0&&spdNow>=3){const want=-hdgDisp;let d=((want-rot)%360+540)%360-180;rot+=d}
    overlay();host.style.setProperty('--pm-rot',rot+'deg');
    inner.style.transform=`translate(-50%,-50%) rotate(${rot}deg)`;nEl.style.transform=`rotate(${rot}deg) translateY(calc(var(--pm-d) / -2 + 9px)) rotate(${-rot}deg)`}
  /* 1.61 원형 지도 위에 과속 카메라 안내가 예상한 앞길(점선)과 그 길 위 카메라(제한속도 표지, 가장 가까운 것은 깜빡임) */
  let pathLine=null,camLayer=null,lastV=0;
  function overlay(){const v=window.AmpCam&&AmpCam.view;if(!map||!v)return;
    if(!pathLine){pathLine=L.polyline([],{color:'#ffd23f',weight:5,opacity:.9,dashArray:'2 10',lineCap:'round',interactive:false}).addTo(map);camLayer=L.layerGroup().addTo(map)}
    const fresh=Date.now()-v.t<4000;if(v.t===lastV&&fresh)return;lastV=v.t;
    pathLine.setLatLngs(fresh&&v.path?v.path:[]);camLayer.clearLayers();
    if(fresh)v.cams.slice(0,6).forEach((c,i)=>camLayer.addLayer(L.marker([c[0],c[1]],{interactive:false,keyboard:false,icon:L.divIcon({className:'pm-cam'+(i?'':' next'),html:'<b>'+(c[2]||'!')+'</b>',iconSize:null})})))}
  setInterval(()=>{if(!document.hidden&&isCar())tick()},250);
  const s=$('#sPfdMap');if(s)s.onchange=e=>set(e.target.checked);const ss=$('#sPfdMapStyle');if(ss)ss.onchange=e=>setStyle(e.target.value);ui();
  return {set,setStyle,get style(){return style},get look(){return host&&host.dataset.look},get on(){return on},get host(){return host},get map(){return map}};
})();
window.PfdMap=PfdMap;
