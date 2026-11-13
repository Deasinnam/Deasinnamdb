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
  fetch('data/kr-speedcams.txt').then(r=>r.ok?r.text():'').then(t=>{const out=[];for(const l of t.split('\n')){if(!l)continue;if(l[0]==='#'){const m=l.match(/기준일 ([\d-]+)~([\d-]+)/);builtinInfo=m?m[2].slice(0,7):'';continue}
    const c=l.split(',');if(c.length>=3)out.push([+c[0],+c[1],+c[2]])}builtin=out;statUi()}).catch(()=>{});
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
    const h=split(lines[0]),fi=re=>h.findIndex(x=>re.test(x));const iLat=fi(/위도|lat/i),iLon=fi(/경도|lon|lng/i),iLim=fi(/제한속도|maxspeed|limit/i),iKind=fi(/단속구분|구분/);
    if(iLat<0||iLon<0)return null;const out=[];
    for(let i=1;i<lines.length;i++){const c=split(lines[i]),la=+c[iLat],lo=+c[iLon];if(!(la>32&&la<39.5&&lo>124&&lo<132))continue;
      const kind=iKind>=0?c[iKind]:'';if(kind&&/신호|주정차|버스|안전띠/.test(kind)&&!/과속/.test(kind))continue;out.push([+la.toFixed(6),+lo.toFixed(6),iLim>=0?limOf(c[iLim]):0])}
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
    const cand=[];
    if(spd>=12&&hdg>=0)for(const o of nearAll(lat,lon)){if(o.d>1200)break;const k=o.c[0].toFixed(5)+','+o.c[1].toFixed(5);seenNow.set(k,o.d);
      const b=brg(lat,lon,o.c[0],o.c[1]),df=Math.abs(((b-hdg+540)%360)-180)*Math.PI/180,along=o.d*Math.cos(df),cross=Math.abs(o.d*Math.sin(df));
      const lim=o.c[2],low=lim>0&&lim<=30;
      // 1.54 넓은 간선도로는 카메라가 길 건너편 기둥에 있고 좌표도 수십 m 어긋나는 일이 많아 속도에 맞춰 넓힘(시속 30 → 42m, 60 → 54m, 80 이상 → 62~70m)
      const tol=low?Math.max(18,Math.min(28,15+spd*.15)):Math.max(35,Math.min(70,30+spd*.4));
      if(df>50*Math.PI/180||along<=0||cross>Math.max(tol,along*(low?.05:.1)))continue;
      if(low&&spd>=55&&cross>12)continue;
      const pd=seen.get(k);if(!(pd&&pd.t>now-3000&&pd.d-o.d>=2))continue;
      cand.push({o,along,cross,score:cross+(lim?Math.abs(lim-spd)*.5:15)})}
    if(cand.length){const a0=cand[0].along;const grp=cand.filter(c=>c.along-a0<60);grp.sort((x,y)=>x.score-y.score);best=grp[0].o}
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
  window.AmpCam={get builtin(){return builtin.length},demo,check:(...a)=>{manualT=Date.now();check(...a)},parseCsv,set osm(a){osm=a;osmAt=[0,0];osmT=Date.now()},get osm(){return osm},show,statUi};
})();
