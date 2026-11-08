// 과속 카메라 안내: 지도 자료(OpenStreetMap, 주변 자동) + 공공데이터 CSV(전국, 직접 불러오기)
// 진행 방향 앞쪽 카메라를 찾아 음성("전방 500미터 앞에 50킬로 과속 카메라가 있습니다")과 빨간 제한 속도 표지판으로 알림.
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
  function say(t){try{if(NB&&NB.speak){NB.speak(t);return}}catch(e){}try{const u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';speechSynthesis.speak(u)}catch(e){}}
  function ding(){try{const a=fx();if(!a)return;const t=a.currentTime;[0,.16].forEach((dt,i)=>{const o=a.createOscillator();o.type='sine';o.frequency.value=i?1320:990;const g=fxEnv(a,t+dt,.16,.005,.18);o.connect(g).connect(a.destination);o.start(t+dt);o.stop(t+dt+.25)})}catch(e){}}
  function nearAll(lat,lon){const out=[];for(const src of [loadDb(),osm])for(const c of src){if(Math.abs(c[0]-lat)>.012||Math.abs(c[1]-lon)>.016)continue;const d=dist(lat,lon,c[0],c[1]);if(d<1300)out.push({c,d})}
    out.sort((a,b)=>a.d-b.d);const uniq=[];for(const o of out)if(!uniq.some(u=>dist(u.c[0],u.c[1],o.c[0],o.c[1])<35))uniq.push(o);return uniq}
  function check(lat,lon,spd,hdg){if(!camOn()){show(null);return}
    if(!osmAt||dist(lat,lon,osmAt[0],osmAt[1])>3000)osmFetch(lat,lon);
    let best=null;if(spd>=12&&hdg>=0)for(const o of nearAll(lat,lon)){const b=brg(lat,lon,o.c[0],o.c[1]),df=Math.abs(((b-hdg+540)%360)-180);if(df<=35&&o.d<=1200){best=o;break}}
    show(best?{lim:best.c[2],d:best.d,over:best.c[2]&&spd>best.c[2]+2}:null,spd);
    if(!best)return;const key=best.c[0].toFixed(5)+','+best.c[1].toFixed(5),st=told.get(key)||{};
    const lim=best.c[2],m=Math.max(100,Math.round(best.d/100)*100);
    if(!st.far&&best.d<=650){st.far=true;ding();say('전방 '+m+'미터 앞에 '+(lim?lim+'킬로 ':'')+'과속 카메라가 있습니다.')}
    if(!st.near&&best.d<=180&&lim&&spd>lim+2){st.near=true;say('과속 카메라 앞입니다. 속도를 '+lim+'킬로 이하로 줄이세요.')}
    st.t=Date.now();told.set(key,st);if(told.size>200)for(const [k,v] of told)if(Date.now()-v.t>6e5)told.delete(k)}
  function show(o,spd){const el=$('#camSign');if(!o){el.hidden=true;document.documentElement.removeAttribute('data-cam');return}
    el.hidden=false;document.documentElement.setAttribute('data-cam','1');$('#camLim').textContent=o.lim||'!';$('#camDist').textContent='전방 '+(o.d>=1000?(o.d/1000).toFixed(1)+'km':Math.round(o.d/10)*10+'m');el.classList.toggle('over',!!o.over)}
  setInterval(()=>{if(!gpsOn||!gs||!gs.fix||!isFinite(gs.lat)){show(null);return}check(+gs.lat,+gs.lon,spdNow,hdgNow)},1000);
  $('#sCam').checked=camOn();$('#sCam').onchange=e=>{store.set('camOn',e.target.checked);if(!e.target.checked)show(null)};
  $('#sCamCsv').onclick=()=>$('#sCamFile').click();$('#sCamFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)importFile(f);e.target.value=''};
  $('#sCamClr').onclick=()=>{try{localStorage.removeItem('dna_camDb')}catch(e){}db=[];statUi();toast('불러온 과속 카메라 자료를 지웠어요.')};
  statUi();
  window.AmpCam={check,parseCsv,set osm(a){osm=a;osmAt=[0,0];osmT=Date.now()},get osm(){return osm},show,statUi};
})();
