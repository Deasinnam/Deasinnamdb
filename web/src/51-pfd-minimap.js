/* 1.50 스피드미터(콕핏 PFD) 왼쪽 아래 원형 지도: 기본 지도(OpenStreetMap)를 진행 방향이 위로 오게 돌려 실시간으로 따라감
 *  - 가운데 화살표가 내 차, 테두리의 N이 북쪽. GPS가 없으면 흐리게 "GPS" 표시
 *  - 원 위 작은 × 로 끄고, 끈 자리의 [지도] 버튼으로 다시 켬(설정 > 화면 · 스킨에도 같은 스위치) */
const PfdMap=(()=>{
  let on=store.get('pfdMap',true),host=null,map=null,inner=null,me=null,nEl=null,lastSet=0,rot=0,wrap=null;
  const ui=()=>{const s=$('#sPfdMap');if(s)s.checked=on;if(host){host.classList.toggle('off',!on);host.querySelector('.pm-x').setAttribute('aria-label',on?'원형 지도 끄기':'원형 지도 켜기');host.querySelector('.pm-x').textContent=on?'×':'지도'}};
  function set(v){on=!!v;store.set('pfdMap',on);if(!on&&map){map.remove();map=null;if(inner)inner.innerHTML=''}ui();if(on)attach(true)}
  function build(w){wrap=w;host=document.createElement('div');host.className='pfd-mini';host.innerHTML='<div class="pm-ring"><div class="pm-map"></div><i class="pm-me" aria-hidden="true"></i><b class="pm-n" aria-hidden="true">N</b><span class="pm-msg">GPS</span></div><button type="button" class="pm-x"></button>';
    host.setAttribute('role','img');host.setAttribute('aria-label','진행 방향 지도');w.appendChild(host);inner=host.querySelector('.pm-map');me=host.querySelector('.pm-me');nEl=host.querySelector('.pm-n');
    host.querySelector('.pm-x').onclick=e=>{e.stopPropagation();set(!on)};ui()}
  async function attach(force){
    const w=document.querySelector('#pfdHost .pfd-canvas-wrap');if(!w)return;
    if(!host||!w.contains(host)){if(map){map.remove();map=null}build(w)}
    if(!on||map||(!force&&!gpsOn))return;
    try{await loadLeaflet()}catch(e){return}if(map||!on)return;
    map=L.map(inner,{zoomControl:false,attributionControl:false,dragging:false,touchZoom:false,doubleClickZoom:false,scrollWheelZoom:false,boxZoom:false,keyboard:false,tap:false,inertia:false,fadeAnimation:false,zoomAnimation:true}).setView([gs.lat||37.5665,gs.lon||126.978],16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,keepBuffer:3}).addTo(map);
    host.title='지도 © OpenStreetMap contributors'}
  function tick(){
    const w=document.querySelector('#pfdHost .pfd-canvas-wrap');if(!w||w.offsetParent===null){return}
    if(!host||!w.contains(host)||(on&&!map&&gpsOn))attach();if(!host)return;
    const fix=gpsOn&&gs&&gs.fix&&isFinite(gs.lat);host.classList.toggle('nofix',!fix);
    const small=w.clientHeight<230||w.clientWidth<300;host.classList.toggle('tiny',small);
    if(!on||!map||!fix)return;
    const now=performance.now();if(now-lastSet>900){lastSet=now;const z=spdNow>90?14:spdNow>40?15:16;map.setView([gs.lat,gs.lon],z,{animate:true,duration:.8});}
    // 진행 방향이 위: 지도를 반대로 돌리고, N 표시는 테두리를 따라 돎(359→0도 매끄럽게)
    if(hdgNow>=0&&spdNow>=3){const want=-hdgDisp;let d=((want-rot)%360+540)%360-180;rot+=d}
    inner.style.transform=`translate(-50%,-50%) rotate(${rot}deg)`;nEl.style.transform=`rotate(${rot}deg) translateY(calc(var(--pm-d) / -2 + 9px)) rotate(${-rot}deg)`}
  setInterval(()=>{if(!document.hidden&&isCar())tick()},250);
  const s=$('#sPfdMap');if(s)s.onchange=e=>set(e.target.checked);ui();
  return {set,get on(){return on},get host(){return host},get map(){return map}};
})();
window.PfdMap=PfdMap;
