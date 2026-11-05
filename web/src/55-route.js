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
