// 과속 카메라 안내: 지도 자료(OpenStreetMap, 주변 자동) + 공공데이터 CSV(전국, 직접 불러오기)
// 진행 방향 앞쪽 카메라를 찾아 500m·100m 앞에서 두 번, 제한 속도 표지판과 짧은 음성으로 알리고 사라짐.
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
(function(){
  const camOn=()=>store.get('camOn',true)!==false;
  let osm=[],osmAt=null,osmBusy=false,osmT=0,db=null;           // [lat,lon,limit]
  const loadUser=()=>{if(db)return db;try{db=JSON.parse(localStorage.getItem('dna_camDb')||'null')||[]}catch(e){db=[]}return db};
  // 1.38 기본 내장 자료: 공공데이터포털 전국무인교통단속카메라표준데이터(2026-06-19 수정본)에서 제한속도가 있는 카메라만(assets/data/kr-speedcams.txt)
  // 직접 불러온 CSV가 있으면 그것을, 없으면 내장 자료를 씀
  let builtin=[],builtinInfo='';
  // 1.60 자료에 보호구역·도로 이름도 담음: 위도,경도,제한속도,보호구역,도로순번 + '#roads:' 목록("도로노선명|노선번호")
  fetch('data/kr-speedcams.txt').then(r=>r.ok?r.text():'').then(t=>{const out=[];let roads=[];for(const l of t.split('\n')){if(!l)continue;
      if(l.startsWith('#roads:')){try{roads=JSON.parse(l.slice(7))}catch(e){}continue}
      if(l[0]==='#'){const m=l.match(/기준일 ([\d-]+)~([\d-]+)/);builtinInfo=m?m[2].slice(0,7):'';continue}
      const c=l.split(',');if(c.length<3)continue;const rd=c[4]!==undefined&&c[4]!==''?String(roads[+c[4]]||'').split('|'):['',''];
      out.push([+c[0],+c[1],+c[2],+(c[3]||0),rd[0]||'',rd[1]||''])}builtin=out;statUi()}).catch(()=>{});
  const loadDb=()=>{const u=loadUser();return u.length?u:builtin};
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
    const h=split(lines[0]),fi=re=>h.findIndex(x=>re.test(x));const iLat=fi(/위도|lat/i),iLon=fi(/경도|lon|lng/i),iLim=fi(/제한속도|maxspeed|limit/i),iKind=fi(/단속구분/),iZone=fi(/보호구역/),iRn=fi(/도로노선명/),iRr=fi(/도로노선번호/);
    if(iLat<0||iLon<0)return null;const out=[];
    for(let i=1;i<lines.length;i++){const c=split(lines[i]),la=+c[iLat],lo=+c[iLon];if(!(la>32&&la<39.5&&lo>124&&lo<132))continue;
      const kind=iKind>=0?c[iKind]:'';if(kind&&/신호|주정차|버스|안전띠/.test(kind)&&!/과속/.test(kind))continue;if(iLim>=0&&!limOf(c[iLim]))continue; /* 1.60 제한속도 없는 신호 전용 카메라는 뺌(내장 자료와 같게) */const z=iZone>=0?parseInt(c[iZone],10):0;out.push([+la.toFixed(6),+lo.toFixed(6),iLim>=0?limOf(c[iLim]):0,z>0&&z<99?z:0,iRn>=0?c[iRn]:'',iRr>=0?String(c[iRr]||'').replace(/^0+/,''):''])}
    return out}
  async function importFile(f){const buf=await f.arrayBuffer();let t=new TextDecoder('utf-8').decode(buf);if(/\uFFFD/.test(t.slice(0,2000))){try{t=new TextDecoder('euc-kr').decode(buf)}catch(e){}}
    const rows=parseCsv(t);if(!rows){toast('위도·경도 열을 찾지 못했어요. 공공데이터 "전국무인교통단속카메라표준데이터" CSV인지 확인해 주세요.');return}
    try{localStorage.setItem('dna_camDb',JSON.stringify(rows));db=rows;toast('과속 카메라 '+rows.length.toLocaleString()+'곳을 불러왔어요.')}catch(e){toast('저장 공간이 부족해 불러오지 못했어요.')}statUi()}
  function statUi(){const el=$('#sCamStat');if(!el)return;const u=loadUser().length,b=builtin.length;el.textContent=(u?'불러온 공공데이터 '+u.toLocaleString()+'곳':b?'기본 내장 전국 자료 '+b.toLocaleString()+'곳'+(builtinInfo?' ('+builtinInfo+' 기준)':''):'공공데이터 없음')+' · 지도 자료 주변 '+osm.length+'곳'+(osmAt?'':' (GPS·인터넷 연결 후 받음)')}
  /* 안내: 진행 방향 ±35° 안, 1.2km 이내에서 가장 가까운 카메라 */
  const told=new Map();let cur=null,lastSay=0;
  // 말은 짧게, 사람이 옆에서 알려 주듯: "500미터 앞 단속 카메라, 50이에요." / "속도 줄이세요."
  // 1.44 안내는 두 번만: 500m 앞(표지판 + 음성) → 100m 앞(표지판 + 음성), 각각 몇 초 보이고 사라짐
  const sayFar=(m,lim)=>m+'미터 앞 단속 카메라'+(lim?', '+lim+'이에요.':'예요.'),SAY_NEAR='속도 줄이세요.';
  const sayNear=(lim,over)=>'100미터 앞'+(over?', 속도 줄이세요.':lim?', '+lim+'이에요.':' 단속 카메라예요.');
  const SHOW_MS=7000,FAR_M=520,NEAR_M=130;
  function say(t){try{if(NB&&NB.speakCam){NB.speakCam(t);return}if(NB&&NB.speak){NB.speak(t);return}}catch(e){}
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ko-KR';u.rate=1.08;u.pitch=1.02;
      const v=(speechSynthesis.getVoices()||[]).filter(x=>/^ko/i.test(x.lang));const nat=v.find(x=>/natural|neural|online|google/i.test(x.name))||v[0];if(nat)u.voice=nat;speechSynthesis.speak(u)}catch(e){}}
  function ding(){try{const a=fx();if(!a)return;const t=a.currentTime;[0,.16].forEach((dt,i)=>{const o=a.createOscillator();o.type='sine';o.frequency.value=i?1320:990;const g=fxEnv(a,t+dt,.16,.005,.18);o.connect(g).connect(a.destination);o.start(t+dt);o.stop(t+dt+.25)})}catch(e){}}
  function nearAll(lat,lon){const out=[];for(const src of [loadDb(),osm])for(const c of src){if(Math.abs(c[0]-lat)>.012||Math.abs(c[1]-lon)>.016)continue;const d=dist(lat,lon,c[0],c[1]);if(d<1300)out.push({c,d})}
    out.sort((a,b)=>a.d-b.d);return out} // 1.59 같은 자리 중복도 모두 넘김(가장 가까운 것 하나만 남기면 교차로의 30 카메라가 60 카메라를 가리는 일이 있었음)
  /* 1.60 지금 달리는 길 이름(OpenStreetMap): 카메라 자료의 도로노선명·노선번호와 맞춰 옆길·교차 도로 카메라를 걸러냄.
   *  앞쪽 1.2km 안에 카메라 후보가 있을 때만, 150m 움직였거나 15초 지났을 때 다시 물어봄. 인터넷이 없거나 길 이름을 모르면 예전 방식(위치·방향)으로만 판단 */
  const road={name:'',ref:'',at:null,t:0,busy:false,ok:false};
  const normRd=v=>String(v||'').replace(/\(.*?\)/g,'').replace(/\s+/g,'').replace(/(일반국도|국도|지방도|고속국도|고속도로)/g,'').trim();
  async function roadFetch(lat,lon,hdg){const now=Date.now();if(road.busy||(road.at&&now-road.t<15000&&dist(lat,lon,road.at[0],road.at[1])<150))return;road.busy=true;
    const q=`[out:json][timeout:10];way(around:30,${lat.toFixed(6)},${lon.toFixed(6)})[highway~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|road)$"];out tags geom;`;
    let got=null;
    for(const ep of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
      try{const r=await fetch(ep,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});if(!r.ok)continue;got=await r.json();break}catch(e){}}
    road.busy=false;road.t=now;road.at=[lat,lon];if(!got){road.ok=false;return}
    const kx=111320*Math.cos(rad(lat)),ky=110540;let best=null;
    for(const w of got.elements||[]){const g=w.geometry||[];for(let i=1;i<g.length;i++){
      const ax=(g[i-1].lon-lon)*kx,ay=(g[i-1].lat-lat)*ky,bx=(g[i].lon-lon)*kx,by=(g[i].lat-lat)*ky,dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/L2));
      const d=Math.hypot(ax+dx*t,ay+dy*t),sb=(Math.atan2(dx,dy)*180/Math.PI+360)%360,da=Math.abs(((sb-hdg+540)%360)-180),dd=Math.min(da,180-da); // 길은 양방향
      const sc=d+(hdg>=0?dd*.6:0);if(dd<=40&&(!best||sc<best.sc))best={sc,d,tags:w.tags||{},w}}}
    if(best&&best.d<=30){const pn=road.name,pr=road.ref;road.name=best.tags.name||best.tags['name:ko']||'';road.ref=String(best.tags.ref||'').split(';')[0].replace(/^0+/,'');road.ok=!!(road.name||road.ref);
      // 1.61 앞길 예측용: 같은 이름(또는 노선번호)의 길 조각을 1.6km 안에서 모아 둠(길이 바뀌었거나 700m 넘게 움직였을 때만 다시)
      const near=(got.elements||[]).map(wayOf);
      if(road.ok&&(pn!==road.name||pr!==road.ref||!road.waysAt||dist(lat,lon,road.waysAt[0],road.waysAt[1])>700))waysFetch(lat,lon,near);
      else if(!road.ok){road.ways=near;road.waysAt=[lat,lon];road.waysT=now}}
    else road.ok=false}
  const wayOf=w=>({id:w.id,g:(w.geometry||[]).map(p=>[p.lat,p.lon]),ow:String((w.tags||{}).oneway||''),name:(w.tags||{}).name||'',ref:String((w.tags||{}).ref||'')});
  async function waysFetch(lat,lon,near){if(road.wbusy)return;road.wbusy=true;try{await waysFetch0(lat,lon,near)}finally{road.wbusy=false}}
  async function waysFetch0(lat,lon,near){const esc=v=>String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
    const parts=[];if(road.name)parts.push(`way(around:1600,${lat.toFixed(6)},${lon.toFixed(6)})[highway][name="${esc(road.name)}"];`);
    if(road.ref)parts.push(`way(around:1600,${lat.toFixed(6)},${lon.toFixed(6)})[highway][ref~"(^|;)0*${esc(road.ref)}(;|$)"];`);
    const q=`[out:json][timeout:15];(${parts.join('')});out tags geom;`;let got=null;
    for(const ep of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
      try{const r=await fetch(ep,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});if(!r.ok)continue;got=await r.json();break}catch(e){}}
    const ws=got?(got.elements||[]).map(wayOf):[];const ids=new Set(ws.map(w=>w.id));for(const w of near)if(!ids.has(w.id))ws.push(w);
    road.ways=ws;road.waysAt=[lat,lon];road.waysT=Date.now()}
  /* 1.61 앞길 예측: 지금 길(같은 이름 길 조각들)을 진행 방향으로 따라가며 최대 1.3km 앞까지 선을 이음.
   *  일방통행 반대 방향은 안 탐. 이어지는 조각이 여럿이면 지금 방향과 가장 덜 꺾이는 쪽. 반환: 로컬 좌표(m) 점들 */
  function buildPath(ways,lat,lon,hdg,maxLen){maxLen=maxLen||1300;if(!ways||!ways.length||!(hdg>=0))return null;
    const kx=111320*Math.cos(rad(lat)),ky=110540,P=ll=>[(ll[1]-lon)*kx,(ll[0]-lat)*ky];
    const W=ways.map(w=>({id:w.id,ow:w.ow,pts:w.g.map(P)})).filter(w=>w.pts.length>1);
    const bear=(a,b)=>(Math.atan2(b[0]-a[0],b[1]-a[1])*180/Math.PI+360)%360,ad=(a,b)=>Math.abs(((a-b+540)%360)-180);
    const okDir=(w,fwd)=>!(fwd&&w.ow==='-1')&&!(!fwd&&(w.ow==='yes'||w.ow==='1'||w.ow==='true'));
    let st=null;
    for(const w of W)for(let i=1;i<w.pts.length;i++){const a=w.pts[i-1],b=w.pts[i],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,-(a[0]*dx+a[1]*dy)/L2)),px=a[0]+dx*t,py=a[1]+dy*t,d=Math.hypot(px,py),sb=bear(a,b);
      for(const fwd of [true,false]){if(!okDir(w,fwd))continue;const dd=ad(fwd?sb:(sb+180)%360,hdg);if(dd>60||d>35)continue;const sc=d+dd*.5;if(!st||sc<st.sc)st={sc,w,i,fwd,p:[px,py]}}}
    if(!st)return null;
    const out=[st.p];let len=0,used=new Set([st.w.id]);
    const walk=(w,i,fwd)=>{const seq=fwd?w.pts.slice(i):w.pts.slice(0,i).reverse();for(const q of seq){const l=out[out.length-1];len+=Math.hypot(q[0]-l[0],q[1]-l[1]);out.push(q);if(len>=maxLen)return true}return false};
    if(walk(st.w,st.i,st.fwd))return {pts:out,len,lat,lon,kx,ky};
    for(let step=0;step<40;step++){const e=out[out.length-1],pv=out[out.length-2]||out[0],hb=bear(pv,e);let nx=null;
      for(const w of W){if(used.has(w.id))continue;for(let i=0;i<w.pts.length;i++){if(Math.hypot(w.pts[i][0]-e[0],w.pts[i][1]-e[1])>12)continue;
        for(const fwd of [true,false]){if(!okDir(w,fwd))continue;const j=fwd?i+1:i-1;if(j<0||j>=w.pts.length)continue;const dd=ad(bear(w.pts[i],w.pts[j]),hb);if(dd>110)continue; /* 같은 이름 길이 직각으로 꺾여 이어지는 곳도 따라감 */if(!nx||dd<nx.dd)nx={dd,w,i,fwd}}}}
      if(!nx)break;used.add(nx.w.id);if(walk(nx.w,nx.fwd?nx.i+1:nx.i,nx.fwd))break}
    return {pts:out,len,lat,lon,kx,ky}}
  // 카메라를 앞길 위로 내려 봄: cross 길에서 옆으로 떨어진 거리, along 길 따라 남은 거리
  function onPath(path,la,lo){const x=(lo-path.lon)*path.kx,y=(la-path.lat)*path.ky;let best=null,cum=0;const p=path.pts;
    for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1e-6,t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(L*L))),d=Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);
      if(!best||d<best.cross)best={cross:d,along:cum+t*L,end:i===p.length-1&&t>=.999};cum+=L}
    return best}
  const view={path:null,cams:[],t:0}; // 원형 지도에 그릴 앞길·카메라
  // 카메라의 도로와 지금 길이 같은지: true 같음 · false 다름 · null 모름(자료나 길 이름이 없음)
  function sameRoad(c){if(!road.ok||!road.at||Date.now()-road.t>45000)return null;const cn=normRd(c[4]),cr=String(c[5]||''),rn=normRd(road.name),rr=road.ref;
    if(!cn&&!cr)return null;if(cr&&rr&&cr===rr)return true;if(cn&&rn&&(cn===rn||(cn.length>=2&&rn.length>=2&&(cn.includes(rn)||rn.includes(cn)))))return true;
    if(!rn&&!(rr&&cr))return null;return false}
  const seen=new Map(); // 카메라별 직전 거리(가까워지는지 확인)
  function check(lat,lon,spd,hdg){if(!camOn()){show(null);return}
    if(!osmAt||dist(lat,lon,osmAt[0],osmAt[1])>3000)osmFetch(lat,lon);
    // 1.49 진행 방향 앞, 같은 길 위의 카메라만: ① 방향 차이 50° 이내 ② 진행선에서 옆으로 벗어난 거리가 속도에 맞춘 허용치 이내(옆길·평행 도로 제외)
    //       ③ 1초 전보다 실제로 가까워지는 중(교차로·건너편 도로의 카메라 제외). 세 가지를 모두 만족해야 안내
    let best=null;const now=Date.now(),seenNow=new Map();
    // 1.59 제한속도 오인 줄이기(예: 시속 60 도로에서 30으로 안내):
    //  · 30 이하 카메라(어린이·노인 보호구역)는 대부분 좁은 이면도로에 있어, 옆으로 벗어난 허용 거리를 좁게(18~28m)
    //  · 시속 55 이상으로 달리는데 30 이하 카메라가 진행선에서 12m 넘게 벗어나 있으면 옆길 카메라로 보고 제외
    //  · 같은 지점(앞뒤 60m)에 제한속도가 다른 카메라가 여럿이면, 진행선에 더 가깝고 지금 속도에 더 맞는 것을 고름
    const cand=[];if(spd>=12&&hdg>=0&&nearAll(lat,lon).length)roadFetch(lat,lon,hdg); // 1.60 근처에 카메라가 있을 때만 지금 길 이름 확인
    // 1.61 앞길을 예측할 수 있으면(같은 길 조각을 받아 둔 경우) 직선 대신 그 길을 따라: 굽은 길 너머 카메라도 잡고, 길 밖 카메라는 뺌. 거리도 길 따라 잰 거리
    const path=road.ways&&road.waysAt&&Date.now()-(road.waysT||0)<180000&&dist(lat,lon,road.waysAt[0],road.waysAt[1])<1400?buildPath(road.ways,lat,lon,hdg):null,usePath=!!(path&&path.len>=250);
    view.path=usePath?path.pts.map(q=>[path.lat+q[1]/path.ky,path.lon+q[0]/path.kx]):null;view.cams=[];view.t=now;
    if(spd>=12&&hdg>=0)for(const o of nearAll(lat,lon)){if(o.d>1300)break;const k=o.c[0].toFixed(5)+','+o.c[1].toFixed(5);seenNow.set(k,o.d);
      let along,cross,df;
      if(usePath){const pr=onPath(path,o.c[0],o.c[1]);if(!pr||pr.end||pr.along<=3||pr.along>1200)continue;along=pr.along;cross=pr.cross;df=0}
      else{const b=brg(lat,lon,o.c[0],o.c[1]);df=Math.abs(((b-hdg+540)%360)-180)*Math.PI/180;along=o.d*Math.cos(df);cross=Math.abs(o.d*Math.sin(df))}
      const same=sameRoad(o.c),lim=o.c[2];
      if(same===false&&(lim<=30||cross>15))continue; // 1.60 다른 길(옆길·교차 도로) 카메라. 진행선 바로 위(15m 안)의 40 이상 카메라는 이름 표기가 달라도 남김
      const low=lim>0&&lim<=30&&same!==true; // 같은 길로 확인되면 보호구역 카메라도 넓은 허용 거리
      // 1.54 넓은 간선도로는 카메라가 길 건너편 기둥에 있고 좌표도 수십 m 어긋나는 일이 많아 속도에 맞춰 넓힘(시속 30 → 42m, 60 → 54m, 80 이상 → 62~70m)
      // 앞길(길 가운데 선) 기준이면 좌표 오차만 보면 되므로 더 좁게: 보호구역 20m, 그 밖 30~45m
      const tol=usePath?(low?20:Math.max(30,Math.min(45,25+spd*.25))):low?Math.max(18,Math.min(28,15+spd*.15)):Math.max(35,Math.min(70,30+spd*.4));
      if(df>50*Math.PI/180||along<=0||cross>(usePath?tol:Math.max(tol,along*(low?.05:.1))))continue;
      if(low&&spd>=55&&cross>12)continue;
      const pd=seen.get(k);if(!(pd&&pd.t>now-3000&&pd.d-o.d>=2))continue;
      cand.push({o:usePath?{c:o.c,d:along}:o,along,cross,same,score:cross+(lim?Math.abs(lim-spd)*.5:15)-(same===true?25:0)})}
    cand.sort((a,b)=>a.along-b.along);
    if(cand.length){const a0=cand[0].along;const grp=cand.filter(c=>c.along-a0<60);grp.sort((x,y)=>x.score-y.score);best=grp[0].o}
    view.cams=cand.map(c=>[c.o.c[0],c.o.c[1],c.o.c[2],Math.round(c.along)]);
    seen.clear();for(const [k,d] of seenNow)seen.set(k,{d,t:now});
    if(!best){show(null);return}let key=best.c[0].toFixed(5)+','+best.c[1].toFixed(5);
    if(!told.has(key))for(const k of told.keys()){const [a,b]=k.split(',').map(Number);if(dist(a,b,best.c[0],best.c[1])<80){key=k;break}} // 같은 지점 카메라끼리 바뀌어도 두 번 안내하지 않게
    const st=told.get(key)||{};
    const lim=best.c[2],over=!!(lim&&spd>lim+2);
    if(!st.far&&!st.near&&best.d<=FAR_M&&best.d>NEAR_M+60){st.far=true;st.until=now+SHOW_MS;ding();say(sayFar(500,lim))}
    if(!st.near&&best.d<=NEAR_M){st.near=true;st.far=true;st.until=now+SHOW_MS;ding();say(sayNear(lim,over))}
    show(now<(st.until||0)?{lim,d:best.d,over}:null,spd);
    st.t=now;told.set(key,st);if(told.size>200)for(const [k,v] of told)if(now-v.t>6e5)told.delete(k)}
  function show(o,spd){const el=$('#camSign');if(!o){el.hidden=true;document.documentElement.removeAttribute('data-cam');return}
    el.hidden=false;document.documentElement.setAttribute('data-cam','1');$('#camLim').textContent=o.lim||'!';$('#camDist').textContent='전방 '+(o.d>=1000?(o.d/1000).toFixed(1)+'km':Math.round(o.d/10)*10+'m');el.classList.toggle('over',!!o.over)}
  let manualT=0; // 시험·외부에서 직접 부른 직후에는 자동 확인이 덮어쓰지 않게
  setInterval(()=>{if(demoOn||Date.now()-manualT<3000)return;if(!gpsOn||!gs||!gs.fix||!isFinite(gs.lat)){show(null);return}check(+gs.lat,+gs.lon,spdNow,hdgNow)},1000);
  $('#sCam').checked=camOn();$('#sCam').onchange=e=>{store.set('camOn',e.target.checked);if(!e.target.checked)show(null)};
  $('#sCamCsv').onclick=()=>$('#sCamFile').click();$('#sCamFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)importFile(f);e.target.value=''};
  $('#sCamClr').onclick=()=>{try{localStorage.removeItem('dna_camDb')}catch(e){}db=[];statUi();toast('불러온 자료를 지웠어요. 기본 내장 전국 자료로 안내해요.')};
  /* 예시: 실제 안내와 같은 소리·음성·표지판을 약 8초 동안 보여 줌(50km 구간을 70km/h로 다가가는 상황) */
  document.body.appendChild($('#camSign')); // 어느 창·설정 위에도 보이게 맨 위층으로
  let demoT=[],demoOn=false;
  function demo(){demoT.forEach(clearTimeout);demoT=[];const el=$('#camSign');el.classList.add('demo');demoOn=true;
    // 500m 앞 안내(약 4초) → 사라짐 → 100m 앞 안내(과속이면 깜빡임 + "속도 줄이세요")
    [[0,500,false],[1300,460,false],[2600,420,false]].forEach(([t,d,over])=>demoT.push(setTimeout(()=>show({lim:50,d,over},70),t)));
    demoT.push(setTimeout(()=>{ding();say(sayFar(500,50))},0));
    demoT.push(setTimeout(()=>show(null),4000));
    [[5200,100,true],[6400,70,true],[7600,40,true]].forEach(([t,d,over])=>demoT.push(setTimeout(()=>show({lim:50,d,over},70),t)));
    demoT.push(setTimeout(()=>{ding();say(sayNear(50,true))},5200));
    demoT.push(setTimeout(()=>{demoOn=false;show(null);el.classList.remove('demo')},9000))}
  $('#sCamDemo').onclick=e=>{e.preventDefault();e.stopPropagation();demo()};
  statUi();
  window.AmpCam={road,sameRoad,buildPath,onPath,view,get builtin(){return builtin.length},demo,check:(...a)=>{manualT=Date.now();check(...a)},parseCsv,set osm(a){osm=a;osmAt=[0,0];osmT=Date.now()},get osm(){return osm},show,statUi};
})();
