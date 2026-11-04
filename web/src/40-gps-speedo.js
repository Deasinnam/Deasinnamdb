// GPS 속도계, 속도계 디자인, 콕핏 PFD(센서·구름·밤하늘)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- GPS 속도계 (자동차 스킨) ---------- */
const HAS_GPS=!!(NB&&NB.gpsStatus);
let gpsOn=false,gs={},gpsTimer=0,lastFix=null,spdNow=0,spdDisp=0,hdgNow=-1,hdgDisp=0,hudOn=false;
let trip=store.get('trip',{dist:0,time:0,max:0}),gLimit=+store.get('gLimit',0);
const DIRS=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const DIRK={N:'북',NE:'북동',E:'동',SE:'남동',S:'남',SW:'남서',W:'서',NW:'북서'};
const dirName=d=>DIRS[Math.round(((d%360)+360)%360/22.5)%16];
function hav(a,b,c,d){const R=6371000,t=Math.PI/180,x=(c-a)*t,y=(d-b)*t;const h=Math.sin(x/2)**2+Math.cos(a*t)*Math.cos(c*t)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function gpsStart(){if(!HAS_GPS)return;try{NB.startGps()}catch(e){}gpsOn=true;store.set('gpsOn',true);clearInterval(gpsTimer);gpsTimer=setInterval(pollGps,250);gpsUi()}
function gpsStop(user){if(HAS_GPS){try{NB.stopGps()}catch(e){}}gpsOn=false;if(user)store.set('gpsOn',false);clearInterval(gpsTimer);spdNow=0;gpsUi()}
function gpsSkinChanged(){const ckOpt=$('#gStyle option[value="cockpit"]');if(ckOpt){ckOpt.hidden=ckOpt.disabled=!isCp()}try{if(isCp())setGStyle(store.get('gStyleCk','cockpit'));else if(gStyle==='cockpit')setGStyle(store.get('gStyleCar','carbon'))}catch(e){/* 시작 중에는 아래 boot에서 처리 */}if(isCar()){if(store.get('gpsOn',false)&&!gpsOn)gpsStart()}else if(gpsOn)gpsStop(false);if(hudOn&&!isCar())hud(false);if(typeof mapSkinChanged==='function')mapSkinChanged()}
function pollGps(){
  if(!gpsOn)return;let s;try{s=JSON.parse(NB.gpsStatus())}catch(e){return}gs=s;
  if(s.fix){
    let v=s.speed;
    if(lastFix&&s.ts!==lastFix.ts){
      const dt=(s.ts-lastFix.ts)/1000,dd=hav(lastFix.lat,lastFix.lon,s.lat,s.lon);
      if(v<0&&dt>0)v=dd/dt;
      if(dt>0&&dt<10&&s.acc<35&&v>0.8){trip.dist+=dd;trip.time+=dt}
      if(s.acc<35&&v*3.6>trip.max&&v*3.6<400)trip.max=v*3.6;
      store.set('trip',trip);
    }
    if(!lastFix||s.ts!==lastFix.ts)lastFix=s;
    spdNow=v>0.5?v*3.6:0;
    hdgNow=(s.bearing>=0&&v>2.5)?s.bearing:(s.azimuth>=0?s.azimuth:hdgNow);
  }else{spdNow=0;hdgNow=s.azimuth>=0?s.azimuth:hdgNow}
  if(typeof att!=='undefined'&&att.on&&att.hdg>=0)hdgNow=att.hdg;
  try{if(s.fix)revAutoTick(s,spdNow/3.6)}catch(e){}
  gpsUi();mapUpdate(false);driveAutoTick();
}
function gpsUi(){
  $('#gOn').textContent=gpsOn?'GPS 끄기':'GPS 켜기';$('#gOn').classList.toggle('on',!gpsOn);
  const avg=trip.time>0?trip.dist/trip.time*3.6:0;
  $('#gMax').innerHTML=Math.round(trip.max)+'<i>km/h</i>';$('#gAvg').innerHTML=Math.round(avg)+'<i>km/h</i>';
  $('#gDist').innerHTML=(trip.dist/1000).toFixed(trip.dist<100000?1:0)+'<i>km</i>';
  const t=Math.round(trip.time);$('#gTime').textContent=Math.floor(t/3600)+':'+String(Math.floor(t%3600/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
  $('#gAlt').innerHTML=(gs.fix&&gs.alt>-9000?Math.round(gs.alt):'-')+'<i>m</i>';
  $('#gAcc').innerHTML=gs.fix?`±${Math.round(gs.acc)}<i>m · ${gs.satsUsed||0}/${gs.satsSeen||0}</i>`:`-<i>${gs.satsSeen?gs.satsUsed+'/'+gs.satsSeen:''}</i>`;
  const m=$('#gMsg');let msg='',btn='';
  if(!HAS_GPS)msg='GPS 속도계는 Android 앱에서 동작해요. 웹 버전에서는 표시만 볼 수 있어요.';
  else if(!gpsOn)msg='GPS 켜기를 누르면 실시간 속도와 진행 방향이 표시돼요. 위치는 화면 표시에만 쓰고 저장하거나 보내지 않아요.';
  else if(gs.perm===false){msg='위치 권한이 필요해요.';btn='<button class="pill on" id="gPerm">권한 허용</button>'}
  else if(gs.enabled===false){msg='휴대폰의 위치(GPS)가 꺼져 있어요.';btn='<button class="pill on" id="gLoc">위치 설정 열기</button>'}
  else if(!gs.fix)msg=`GPS 신호를 찾는 중이에요${gs.satsSeen?` · 위성 ${gs.satsSeen}개 보임`:''}. 하늘이 트인 곳에서 더 빨리 잡혀요.`;
  else msg=gs.provider==='gps'?'':'네트워크 위치를 쓰는 중이라 속도가 부정확할 수 있어요.';
  if(m.dataset.k!==msg+btn){m.dataset.k=msg+btn;m.innerHTML='';m.append(msg);if(btn){m.insertAdjacentHTML('beforeend',btn);const p=$('#gPerm'),l=$('#gLoc');if(p)p.onclick=()=>{try{NB.startGps()}catch(e){}};if(l)l.onclick=()=>{try{NB.openLocationSettings()}catch(e){}}}}
  $('#gSrc').textContent=gpsOn&&gs.fix?'· GPS 수신':'';
}
function hud(on){hudOn=on;$('#hud').hidden=!on;if(NB&&NB.keepScreenOn){try{NB.keepScreenOn(on)}catch(e){}}if(on&&navigator.wakeLock){navigator.wakeLock.request('screen').catch(()=>{})}}
$('#gOn').onclick=()=>gpsOn?gpsStop(true):gpsStart();
$('#gReset').onclick=()=>{trip={dist:0,time:0,max:0};store.set('trip',trip);gpsUi()};
$('#gHudBtn').onclick=()=>hud(true);
$('#hudClose').onclick=()=>hud(false);
$('#hudMir').onclick=()=>{const m=$('#hud').classList.toggle('mirror');store.set('hudMirror',m)};
$('#hud').classList.toggle('mirror',store.get('hudMirror',true));
$('#gLimit').value=String(gLimit);$('#gLimit').onchange=e=>{gLimit=+e.target.value;store.set('gLimit',gLimit)};
const angDiff=(a,b)=>((b-a+540)%360)-180;
function drawGps(){
  const gv=isCar()&&!$('#wGps').classList.contains('collapsed')&&!document.hidden;attWant(gv&&isCk()); // 자세·나침반 센서는 콕핏·태블릿 스킨에서만
  if(!gv)return;
  attPoll();if(att.on&&att.hdg>=0)hdgNow=att.hdg;
  if(typeof atcSpeedTick==='function')atcSpeedTick(spdNow);
  const AP=window.AmpPfd;if(isCk()&&(isTab()?!window.__tkGauge:gStyle==='cockpit')&&AP&&AP.ready){spdDisp=spdNow;if(hdgNow>=0)hdgDisp=hdgNow;AP.feed();return}
  spdDisp+=(spdNow-spdDisp)*.18;if(Math.abs(spdNow-spdDisp)<.05)spdDisp=spdNow;
  if(hdgNow>=0)hdgDisp=(hdgDisp+angDiff(hdgDisp,hdgNow)*.15+360)%360;
  const hasFix=gpsOn&&gs.fix,over=gLimit>0&&spdDisp>gLimit;
  const sp=hasFix?String(Math.round(spdDisp)):'--';
  $('#gSpd').textContent=sp;$('#wGps').classList.toggle('over',over);
  const hd=hdgNow>=0?`${String(Math.round(hdgDisp)%360).padStart(3,'0')}° ${dirName(hdgDisp)}`:'---° --';$('#gHdg').textContent=hd;
  if(hudOn){$('#hSpd').textContent=sp;$('#hHdg').textContent=hdgNow>=0?(DIRK[dirName(hdgDisp)]||dirName(hdgDisp))+' '+Math.round(hdgDisp)+'°':'';$('#hud').classList.toggle('over',over)}
  drawGauge(over);drawTape();
}
/* ----- 속도계 그리기: 디자인 5종 ----- */
const GMAX=200,GA0=Math.PI*.75,GA1=Math.PI*2.25;
const gA=v=>GA0+(GA1-GA0)*Math.max(0,Math.min(1,v/GMAX));
let gStyle=store.get('gStyle','carbon');
function setGStyle(k){if(!['carbon','neon','classic','minimal','tactical','cockpit'].includes(k))k='carbon';if(k==='cockpit'&&!isCp())k=store.get('gStyleCar','carbon');if(isCp())store.set('gStyleCk',k);else if(k!=='cockpit')store.set('gStyleCar',k);{const gb=$('#gStyleBar');if(gb)gb.value=k}setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}try{if(appEl.classList.contains('FX'))ckFocus(store.get('ckFocus','all'),true)}catch(e){}window.dispatchEvent(new Event('resize'))},60);gStyle=k;$('#wGps').dataset.gs=k;if(k!=='cockpit'){const b=$('#spdBox');b.style.left='';b.style.width=''}$('#gStyle').value=k;store.set('gStyle',k)}
$('#gStyle').onchange=e=>setGStyle(e.target.value);$('#gStyleBar').onchange=e=>setGStyle(e.target.value);
const RJ='Rajdhani,"Barlow Condensed",sans-serif';
function ring(g,x,y,r,lw,col){g.lineWidth=lw;g.strokeStyle=col;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.stroke()}
function tick(g,x,y,a,r1,r2,lw,col){g.lineWidth=lw;g.strokeStyle=col;g.beginPath();g.moveTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);g.lineTo(x+Math.cos(a)*r2,y+Math.sin(a)*r2);g.stroke()}
function label(g,x,y,a,r,txt,font,col){g.font=font;g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,x+Math.cos(a)*r,y+Math.sin(a)*r)}
function wedge(g,x,y,r1,r2,a1,a2){g.beginPath();g.arc(x,y,r2,a1,a2);g.arc(x,y,r1,a2,a1,true);g.closePath()}
function needle(g,x,y,a,r1,r2,w,col,glow){g.save();g.translate(x,y);g.rotate(a);g.shadowColor=glow||col;g.shadowBlur=glow?12:4;g.fillStyle=col;g.beginPath();g.moveTo(r1,-w);g.lineTo(r2,-w*.25);g.lineTo(r2+w*.6,0);g.lineTo(r2,w*.25);g.lineTo(r1,w);g.closePath();g.fill();g.restore()}
function drawGauge(over){
  const c=cv.gauge,g=cx.gauge;if(!g)return;const w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  const v=spdDisp,RED='#ff3b30',box=$('#spdBox'),dial=$('#dial');
  if(gStyle==='cockpit'){drawPFD(g,w,h,d,v,over,box,dial);return}
  box.style.left='';box.style.width='';
  if(gStyle==='minimal'){
    dial.style.setProperty('--g',(Math.min(h,w*.5)/d)+'px');box.style.top=(h*.34/d)+'px';
    const x1=w*.06,x2=w*.94,y=h*.66,bh=h*.085,N=34,gw=(x2-x1)/N;
    for(let i=0;i<N;i++){const on=(i+.5)/N*GMAX<=v;g.fillStyle=on?(over?RED:C.cp):'#24252a';g.shadowBlur=on?12*d:0;g.shadowColor=over?RED:C.cp;g.fillRect(x1+i*gw+1*d,y,gw-2*d,bh)}
    g.shadowBlur=0;
    for(let t=0;t<=GMAX;t+=5){const x=x1+(x2-x1)*t/GMAX,maj=t%20===0,mid=t%10===0;g.fillStyle='#d6d2cc';g.globalAlpha=maj?.9:mid?.55:.3;g.fillRect(x-(maj?1:.5)*d,y+bh+5*d,(maj?2:1)*d,(maj?12:mid?8:5)*d)}
    g.globalAlpha=1;g.font=`600 ${h*.065}px ${RJ}`;g.fillStyle='#d6d2cc';g.textAlign='center';g.textBaseline='top';
    for(let t=0;t<=GMAX;t+=20)g.fillText(t,x1+(x2-x1)*t/GMAX,y+bh+20*d);
    return;
  }
  const full=gStyle==='classic'||gStyle==='tactical',r=Math.min(w*.46,full?h/2.16:h/1.82),x0=w/2,y0=full?h/2:h/2+r*.14;
  dial.style.setProperty('--g',(r*2/d)+'px');
  box.style.top=((gStyle==='classic'?y0+r*.47:y0+r*.02)/d)+'px';
  if(gStyle==='carbon'){
    const N=36,seg=(GA1-GA0)/N;
    for(let i=0;i<N;i++){const on=(i+.5)/N*GMAX<=v,a1=GA0+i*seg+seg*.08,a2=GA0+(i+1)*seg-seg*.08;
      wedge(g,x0,y0,r*.83,r*.99,a1,a2);
      if(on){const gr=g.createRadialGradient(x0,y0,r*.83,x0,y0,r);gr.addColorStop(0,over?'#a01810':C.cplo);gr.addColorStop(1,over?RED:C.cphi);g.fillStyle=gr;g.shadowBlur=14*d;g.shadowColor=over?RED:C.cp}
      else{const gr=g.createRadialGradient(x0,y0,r*.83,x0,y0,r);gr.addColorStop(0,'#1c1d20');gr.addColorStop(1,'#3d3f44');g.fillStyle=gr;g.shadowBlur=0}
      g.fill();g.shadowBlur=0;g.lineWidth=1*d;g.strokeStyle=on?'#ffd2a866':'#5a5d6366';g.stroke()}
    for(let t=0;t<=GMAX;t+=5){const a=gA(t),maj=t%20===0,mid=t%10===0;tick(g,x0,y0,a,r*(maj?.69:mid?.73:.76),r*.79,(maj?3:1.2)*d,maj?'#f2f2f2':'#bfc2c7'+(mid?'':'99'))}
    for(let t=0;t<=GMAX;t+=20)label(g,x0,y0,gA(t),r*.6,t,`600 ${r*.09}px ${RJ}`,'#e6e6e6');
    g.save();g.translate(x0,y0);g.beginPath();for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4;g.lineTo(Math.cos(a)*r*.47,Math.sin(a)*r*.47)}g.closePath();
    g.fillStyle='#0d0d0f';g.fill();g.lineWidth=1.5*d;g.globalAlpha=.55;g.strokeStyle=C.cp;g.stroke();g.globalAlpha=1;g.restore();
    tick(g,x0,y0,gA(GMAX),r*.83,r*1.02,3*d,C.cp);
  }else if(gStyle==='neon'){
    g.shadowColor=C.cp;g.shadowBlur=10*d;g.globalAlpha=.6;ring(g,x0,y0,r*1.0,1.2*d,C.cp);g.globalAlpha=1;g.shadowBlur=0;ring(g,x0,y0,r*.965,1*d,'#ffffff1a');
    const steps=Math.round(v/GMAX*120);
    for(let i=0;i<steps;i++){const a=GA0+(GA1-GA0)*i/120,t=i/120;g.shadowBlur=10*d;g.shadowColor=over?RED:C.cp;g.globalAlpha=.55+t*.45;tick(g,x0,y0,a,r*.8,r*.93,2.6*d,over?RED:(t>.7?C.cphi:C.cp))}
    g.globalAlpha=1;
    g.shadowBlur=0;
    for(let t=0;t<=GMAX;t+=2){const a=gA(t),maj=t%20===0,mid=t%10===0;tick(g,x0,y0,a,r*(maj?.8:mid?.85:.88),r*.95,(maj?3.2:mid?1.6:1)*d,maj?'#ffffff':mid?'#ffffffaa':'#ffffff44')}
    for(let t=0;t<=GMAX;t+=20)label(g,x0,y0,gA(t),r*.7,t,`600 ${r*.085}px ${RJ}`,'#f1ece6');
    g.fillStyle='#ffffff40';for(let k=0;k<72;k++){const a=k/72*Math.PI*2;g.beginPath();g.arc(x0+Math.cos(a)*r*.56,y0+Math.sin(a)*r*.56,1.1*d,0,Math.PI*2);g.fill()}
    ring(g,x0,y0,r*.5,1*d,'#ffffff12');
    g.shadowBlur=16*d;g.shadowColor=over?RED:C.cp;tick(g,x0,y0,gA(v),r*.62,r*.97,4*d,over?RED:C.cphi);g.shadowBlur=0;
  }else if(gStyle==='classic'){
    let gr=g.createLinearGradient(0,y0-r,0,y0+r);gr.addColorStop(0,'#f2b57e');gr.addColorStop(.5,'#8a4a1e');gr.addColorStop(1,'#d9884a');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*1.04,0,Math.PI*2);g.fill();
    gr=g.createLinearGradient(0,y0-r,0,y0+r);gr.addColorStop(0,'#f6f3ee');gr.addColorStop(.5,'#8d8a85');gr.addColorStop(1,'#e2ded8');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*.985,0,Math.PI*2);g.fill();
    gr=g.createRadialGradient(x0,y0-r*.2,r*.1,x0,y0,r*.95);gr.addColorStop(0,'#fbf6ea');gr.addColorStop(.75,'#ece2cc');gr.addColorStop(1,'#cbbd9f');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*.95,0,Math.PI*2);g.fill();
    for(let t=0;t<=GMAX;t+=2){const a=gA(t),maj=t%20===0,mid=t%10===0;tick(g,x0,y0,a,r*(maj?.76:mid?.8:.84),r*.9,(maj?3.4:mid?2:1)*d,maj?'#b4471a':'#3a2a1c')}
    for(let t=0;t<=GMAX;t+=20)label(g,x0,y0,gA(t),r*.64,t,`700 ${r*.11}px ${RJ}`,'#2e2318');
    needle(g,x0,y0,gA(v),-r*.12,r*.84,r*.035,over?RED:'#d4501c');
    gr=g.createRadialGradient(x0-r*.03,y0-r*.03,1,x0,y0,r*.11);gr.addColorStop(0,'#ffffff');gr.addColorStop(.5,'#9a958e');gr.addColorStop(1,'#2a2420');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*.11,0,Math.PI*2);g.fill();ring(g,x0,y0,r*.11,2*d,'#1a1410');
  }else{ // tactical
    let gr=g.createLinearGradient(0,y0-r,0,y0+r);gr.addColorStop(0,'#4a5045');gr.addColorStop(.5,'#1d201b');gr.addColorStop(1,'#3a3f35');
    g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*1.06,0,Math.PI*2);g.fill();
    for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4,px=x0+Math.cos(a)*r*1.0,py=y0+Math.sin(a)*r*1.0;const rg=g.createRadialGradient(px-1,py-1,0,px,py,r*.03);rg.addColorStop(0,'#9aa092');rg.addColorStop(1,'#1a1c17');g.fillStyle=rg;g.beginPath();g.arc(px,py,r*.026,0,Math.PI*2);g.fill()}
    gr=g.createRadialGradient(x0,y0,0,x0,y0,r*.93);gr.addColorStop(0,'#0e1a0e');gr.addColorStop(1,'#050905');g.fillStyle=gr;g.beginPath();g.arc(x0,y0,r*.93,0,Math.PI*2);g.fill();
    g.strokeStyle='#3cff5a22';g.lineWidth=1*d;g.beginPath();g.moveTo(x0-r*.85,y0);g.lineTo(x0+r*.85,y0);g.moveTo(x0,y0-r*.85);g.lineTo(x0,y0+r*.85);g.stroke();ring(g,x0,y0,r*.42,1*d,'#3cff5a22');
    for(let t=0;t<=GMAX;t+=2){const a=gA(t),maj=t%20===0,mid=t%10===0,on=t<=v;
      g.shadowBlur=on?8*d:0;g.shadowColor=over?RED:'#3cff5a';
      tick(g,x0,y0,a,r*(maj?.72:mid?.78:.82),r*.9,(maj?3:mid?2:1.4)*d,on?(over?RED:(t/GMAX<.6?'#3cff5a':'#b8ff3c')):(maj?'#9dff8a':'#2e5a2e'))}
    g.shadowBlur=0;
    for(let t=0;t<=GMAX;t+=20)label(g,x0,y0,gA(t),r*.6,t,`600 ${r*.085}px ${RJ}`,'#d8ffd0');
    g.shadowBlur=12*d;g.shadowColor='#ffb43a';tick(g,x0,y0,gA(v),r*.48,r*.92,4*d,over?RED:'#ffc23a');g.shadowBlur=0;
  }
}
/* 콕핏 PFD: 왼쪽 속도 테이프 · 가운데 자세계(선회하면 기울고 가속하면 기수가 듦) · 오른쪽 고도 테이프 */
/* ----- 콕핏 PFD: 나침반·기울기 센서, 구름, 밤하늘 ----- */
const att={ok:false,u:null,ref:store.get('attRef',null),acc:[],bank:0,pitch:0,hdg:-1,web:null,t:0,on:false};
window.__att=att;
const HAS_ATT=!!(NB&&NB.attitude);
function attWant(on){if(on===att.on)return;att.on=on;if(HAS_ATT){try{on?NB.attStart():NB.attStop()}catch(e){}}else if(on)webOrient()}
function webOrient(){if(webOrient.done)return;webOrient.done=true;const h=e=>{if(e.beta==null)return;att.web={a:e.alpha||0,b:e.beta,g:e.gamma||0,abs:!!e.absolute||e.webkitCompassHeading!=null,ch:e.webkitCompassHeading,t:performance.now()}};
  addEventListener('deviceorientationabsolute',h);addEventListener('deviceorientation',h)}
// W3C 기기 방향 → 회전 행렬(기기→지구, 안드로이드와 같은 형식)
function eulerR(al,be,ga){const r=Math.PI/180,cX=Math.cos(be*r),cY=Math.cos(ga*r),cZ=Math.cos(al*r),sX=Math.sin(be*r),sY=Math.sin(ga*r),sZ=Math.sin(al*r);
  return [cZ*cY-sZ*sX*sY,-cX*sZ,cY*sZ*sX+cZ*sY, cY*sZ+cZ*sX*sY,cZ*cX,sZ*sY-cZ*cY*sX, -cX*sY,sX,cX*cY]}
const SCR=[[[1,0,0],[0,1,0]],[[0,1,0],[-1,0,0]],[[-1,0,0],[0,-1,0]],[[0,-1,0],[1,0,0]]]; // 화면 회전별 [오른쪽, 위] 축
const v3={dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm:a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l]}};
const DEG=180/Math.PI;
function attPoll(){
  const now=performance.now();if(now-att.t<30)return;att.t=now;
  let R=null,srot=0,decl=0,compass=false;
  if(HAS_ATT){try{const o=JSON.parse(NB.attitude());if(o.ok&&o.r&&o.r.length===9){R=o.r;srot=(o.srot|0)&3;decl=+o.decl||0;compass=!!o.compass}}catch(e){}}
  else if(att.web&&now-att.web.t<2000){const w=att.web;R=eulerR(w.a,w.b,w.g);srot=((Math.round(((screen.orientation&&screen.orientation.angle)||window.orientation||0)/90)%4)+4)%4;compass=w.abs}
  att.ok=!!R;if(!R){att.hdg=-1;return}
  const [rt,up]=SCR[srot],gv=[R[6],R[7],R[8]],u=v3.nrm([v3.dot(gv,rt),v3.dot(gv,up),gv[2]]);att.u=u;
  // 처음 1초 남짓의 자세를 "수평"으로 삼습니다(거치대 각도 보정). 수평 맞춤 버튼으로 다시 정할 수 있어요.
  if(!att.ref){att.acc.push(u);if(att.acc.length<20)return;const s=att.acc.reduce((p,q)=>[p[0]+q[0],p[1]+q[1],p[2]+q[2]],[0,0,0]);att.ref=v3.nrm(s);att.acc=[];store.set('attRef',att.ref)}
  const u0=att.ref,r0=v3.nrm([1-u0[0]*u0[0],-u0[0]*u0[1],-u0[0]*u0[2]]),f0=v3.cross(u0,r0);
  const a=v3.dot(u,r0),b=v3.dot(u,f0),c=v3.dot(u,u0);
  att.bank=Math.max(-75,Math.min(75,Math.atan2(-a,c)*DEG));att.pitch=Math.max(-40,Math.min(40,Math.atan2(-b,c)*DEG));
  // 나침반: 거치된 기기의 "앞"(수평일 때 화면 위쪽, 세웠을 때 뒷면 카메라 쪽)이 가리키는 방위
  const fd=[0,1,2].map(i=>f0[0]*rt[i]+f0[1]*up[i]+(i===2?f0[2]:0));
  const fe=R[0]*fd[0]+R[1]*fd[1]+R[2]*fd[2],fn=R[3]*fd[0]+R[4]*fd[1]+R[5]*fd[2];
  att.hdg=compass&&Math.hypot(fe,fn)>.3?((Math.atan2(fe,fn)*DEG+decl)%360+360)%360:-1;
  if(!HAS_ATT&&att.web&&att.web.ch!=null)att.hdg=att.web.ch;
}
function attLevel(){try{if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission)DeviceOrientationEvent.requestPermission().catch(()=>{})}catch(e){}
  if(att.u){att.ref=att.u.slice();store.set('attRef',att.ref);toast('지금 자세를 수평으로 맞췄어요.')}else{att.ref=null;att.acc=[];store.set('attRef',null);toast('기울기 센서를 기다리는 중이에요. 잡히면 그 자세를 수평으로 삼아요.')}}

// 하늘: 구름은 진행 방향 앞쪽에서 다가오고(속도가 빠를수록 빨리), 방향을 틀면 옆으로 흘러감
let skyMode=store.get('gSky','auto');
const isNight=()=>skyMode==='night'||(skyMode==='auto'&&(()=>{const h=new Date().getHours();return h>=19||h<6})());
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const sky={cl:[],stars:[],spr:{},h:null};
function cloudNew(init){const f=init?60+Math.random()*940:780+Math.random()*260;return {f,l:(Math.random()*2-1)*f*.95,hgt:12+Math.random()*80,s:.7+Math.random()*.9,k:Math.random()*4|0}}
(()=>{for(let i=0;i<16;i++)sky.cl.push(cloudNew(true));const r=rng(7);for(let i=0;i<160;i++)sky.stars.push({az:r()*360,el:1+Math.pow(r(),.75)*55,m:r(),tw:r()*6.3})})();
function cloudSprite(k,night){const key=k+(night?'n':'d');if(sky.spr[key])return sky.spr[key];
  const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d'),r=rng(k*31+3);
  const puffs=[];for(let i=0;i<10;i++)puffs.push([44+r()*168,70+r()*22-(i%3)*10,20+r()*26]);
  puffs.sort((p,q)=>q[1]-p[1]);
  for(const [px,py,pr] of puffs){const gr=x.createRadialGradient(px,py-pr*.4,pr*.1,px,py,pr);
    if(night){gr.addColorStop(0,'rgba(132,146,182,.62)');gr.addColorStop(.6,'rgba(70,80,108,.5)');gr.addColorStop(1,'rgba(30,36,54,0)')}
    else{gr.addColorStop(0,'rgba(255,255,255,.98)');gr.addColorStop(.62,'rgba(236,241,248,.85)');gr.addColorStop(1,'rgba(196,208,226,0)')}
    x.fillStyle=gr;x.beginPath();x.arc(px,py,pr,0,Math.PI*2);x.fill()}
  return sky.spr[key]=c}
let moonSpr=null;
function moonSprite(){if(moonSpr)return moonSpr;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
  let gr=x.createRadialGradient(64,64,10,64,64,64);gr.addColorStop(0,'rgba(255,248,220,.35)');gr.addColorStop(1,'rgba(255,248,220,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  gr=x.createRadialGradient(56,56,4,64,64,24);gr.addColorStop(0,'#fffdf0');gr.addColorStop(1,'#e2dcc4');x.fillStyle=gr;x.beginPath();x.arc(64,64,24,0,Math.PI*2);x.fill();
  x.fillStyle='rgba(150,145,125,.35)';for(const [a,b,r] of [[56,58,5],[71,70,4],[62,75,3],[73,55,3]]){x.beginPath();x.arc(a,b,r,0,Math.PI*2);x.fill()}
  return moonSpr=c}
// 회전된 자세계 좌표(수평선이 y=0, 진행 방향이 x=0)에서 하늘 그리기
function drawSky(g,w,h,d,ppd,adiW,v,dt,night){
  const W=w*2,H=h*2,F=adiW*.75,pxDeg=adiW/70;
  let gr=g.createLinearGradient(0,-h*1.2,0,0);
  if(night){gr.addColorStop(0,'#01030a');gr.addColorStop(.7,'#061230');gr.addColorStop(1,'#123064')}else{gr.addColorStop(0,'#0b3a7a');gr.addColorStop(1,'#2e7fe0')}
  g.fillStyle=gr;g.fillRect(-W,-H,W*2,H);
  // 방향을 틀면 하늘 전체가 옆으로
  const dH=sky.h==null?0:angDiff(sky.h,hdgDisp);sky.h=hdgDisp;
  if(night){const t=performance.now()/1000;
    for(const s of sky.stars){let x=angDiff(hdgDisp,s.az)*pxDeg;if(Math.abs(x)>W)continue;const y=-s.el*ppd;
      g.globalAlpha=(.35+.65*Math.abs(Math.sin(t*1.3+s.tw)))*(.4+.6*s.m);g.fillStyle='#fff';g.beginPath();g.arc(x,y,(.8+s.m*1.6)*d,0,Math.PI*2);g.fill()}
    g.globalAlpha=1;if(sky.moonAz==null)sky.moonAz=(hdgDisp+22)%360;{const off=angDiff(sky.moonAz,(hdgDisp+18)%360);if(Math.abs(off)>30)sky.moonAz=(sky.moonAz+Math.sign(off)*Math.min(Math.abs(off)-30,40*dt)+360)%360}const mx=angDiff(hdgDisp,sky.moonAz)*pxDeg,my=-16*ppd,ms=Math.min(adiW*.26,130*d);
    if(Math.abs(mx)<W)g.drawImage(moonSprite(),mx-ms/2,my-ms/2,ms,ms)}
  // 구름: 앞으로 다가오고, 선회하면 옆으로 회전
  const step=(6+v*2.2)*dt,cs=Math.cos(dH/DEG),sn=Math.sin(dH/DEG);
  for(const c of sky.cl){const f=c.f*cs+c.l*sn,l=-c.f*sn+c.l*cs;c.f=f-step;c.l=l;
    if(c.f<22||Math.abs(c.l)/Math.max(c.f,1)>2.4)Object.assign(c,cloudNew(false))}
  sky.cl.sort((p,q)=>q.f-p.f);
  for(const c of sky.cl){const x=c.l/c.f*F,y=-c.hgt/c.f*F,cw=150*c.s/c.f*F,ch=cw/2;if(Math.abs(x)-cw>W||cw<2)continue;
    g.globalAlpha=Math.max(0,Math.min(1,(1040-c.f)/240,(c.f-22)/40))*(night?.85:.95);g.drawImage(cloudSprite(c.k,night),x-cw/2,y-ch*.75,cw,ch)}
  g.globalAlpha=1;
}
$('#gLevel').onclick=attLevel;
$('#gSky').value=skyMode;$('#gSky').onchange=e=>{skyMode=e.target.value;store.set('gSky',skyMode)};
let pfd={bank:0,pitch:0,h:null,v:null,t:0};
function drawPFD(g,w,h,d,v,over,box,dial){
  const now=performance.now(),dt=pfd.t?Math.min(.5,(now-pfd.t)/1000):0;pfd.t=now;
  let tb=0,tp=0;
  if(dt>0&&pfd.h!=null&&gs.fix&&v>3)tb=Math.max(-30,Math.min(30,angDiff(pfd.h,hdgDisp)/dt*1.2));
  if(dt>0&&pfd.v!=null&&gs.fix)tp=Math.max(-8,Math.min(8,(v-pfd.v)/dt*.9));
  pfd.h=hdgDisp;pfd.v=v;
  // 센서가 있으면 기기·차량 기울기, 없으면 GPS 선회·가속으로 흉내
  const useAtt=att.ok&&!!att.ref,tB=useAtt?att.bank+tb*.25:tb,tP=useAtt?att.pitch:tp;
  pfd.bank+=(tB-pfd.bank)*(useAtt?.22:.06);pfd.pitch+=(tP-pfd.pitch)*(useAtt?.22:.05);
  const night=isNight();
  const RED='#ff3b30',W='#ffffff',MAG='#f3bc65',GRN='#a8f08f',CY='#a7e29a',AMB='#f3bc65',YEL='#f3c623';
  const nar=w/d<420,sw=w*(nar?.22:.17),aw=w*(nar?.2:.15),x1=w*.015,x2=w-w*.015-aw,cx=(x1+sw+x2)/2,at=Math.min(h*.1,36*d),ah=h-at-Math.min(h*.08,30*d),cy=at+ah/2,K=Math.min(h,520*d,w*.9);
  const fnt=(px,wt=600)=>`${wt} ${px}px "Barlow Condensed",Rajdhani,sans-serif`;
  dial.style.setProperty('--g',(K/d)+'px');box.style.top=(cy/d)+'px';box.style.left=(x1/d)+'px';box.style.width=(sw*.82/d)+'px';
  // 자세계
  g.save();g.beginPath();g.rect(x1+sw,at,x2-x1-sw,ah);g.clip();
  g.translate(cx,cy);g.rotate(-pfd.bank*Math.PI/180);const ppd=ah*.018;g.translate(0,pfd.pitch*ppd);
  drawSky(g,w,h,d,ppd,x2-x1-sw,v,dt,night);
  let gr=g.createLinearGradient(0,0,0,h);if(night){gr.addColorStop(0,'#2e1f10');gr.addColorStop(1,'#0e0905')}else{gr.addColorStop(0,'#8a5a2b');gr.addColorStop(1,'#4a2e14')}g.fillStyle=gr;g.fillRect(-w*2,0,w*4,h*2);
  g.strokeStyle=night?'#cfd8e6':W;g.lineWidth=2*d;g.beginPath();g.moveTo(-w,0);g.lineTo(w,0);g.stroke();
  g.lineWidth=1.4*d;g.fillStyle=W;g.font=fnt(K*.045);g.textBaseline='middle';
  for(let p=-20;p<=20;p+=5){if(!p)continue;const y=-p*ppd,L=(p%10?.06:.13)*w;g.beginPath();g.moveTo(-L/2,y);g.lineTo(L/2,y);g.stroke();
    if(p%10===0){g.textAlign='right';g.fillText(Math.abs(p),-L/2-6*d,y);g.textAlign='left';g.fillText(Math.abs(p),L/2+6*d,y)}}
  g.restore();
  // 선회계 눈금(위쪽 호)
  const br=Math.min((x2-x1-sw)*.45,ah*.45);g.save();g.translate(cx,cy);g.strokeStyle=W;g.lineWidth=2*d;
  g.beginPath();g.arc(0,0,br,Math.PI*1.33,Math.PI*1.67);g.stroke();
  for(const a of [-60,-45,-30,-20,-10,10,20,30,45,60]){const r=(a-90)*Math.PI/180,L=Math.abs(a)%30===0?14:8;tick(g,0,0,r,br,br+L*d,2*d,W)}
  g.fillStyle=W;g.beginPath();g.moveTo(0,-br-2*d);g.lineTo(-7*d,-br-14*d);g.lineTo(7*d,-br-14*d);g.closePath();g.fill();
  g.rotate(-pfd.bank*Math.PI/180);g.fillStyle=YEL;g.beginPath();g.moveTo(0,-br+2*d);g.lineTo(-8*d,-br+15*d);g.lineTo(8*d,-br+15*d);g.closePath();g.fill();g.restore();
  // 항공기 심볼
  g.save();g.translate(cx,cy);const s=Math.min(x2-x1-sw,ah)*.2;g.lineWidth=2*d;g.strokeStyle='#000';g.fillStyle=YEL;
  for(const k of [-1,1]){g.beginPath();g.rect(k>0?s*.35:-s*1.35,-3*d,s,6*d);g.rect(k>0?s*.35:-s*.35-6*d,-3*d,6*d,s*.35);g.fill();g.stroke()}
  g.beginPath();g.rect(-4*d,-4*d,8*d,8*d);g.fill();g.stroke();g.restore();
  // 모드 표시줄
  const col=(w-2*x1)/3,mx=i=>x1+col*(i+.5);
  g.fillStyle='#000';g.fillRect(x1,0,w-2*x1,at);g.font=fnt(Math.min(at*.62,col*.17,22*d));g.textBaseline='middle';g.textAlign='center';
  g.fillStyle=gs.fix?GRN:AMB;g.fillText(gpsOn?(gs.fix?'GPS':'NO FIX'):'GPS OFF',mx(0),at/2);
  g.fillStyle=GRN;g.fillText(hdgNow>=0?'TRK '+String(Math.round(hdgDisp)%360).padStart(3,'0'):'TRK ---',mx(1),at/2);
  g.fillStyle=gLimit>0?MAG:'#5f6a74';g.fillText(gLimit>0?'LIM '+gLimit:'LIM OFF',mx(2),at/2);
  g.strokeStyle='#ffffff30';g.lineWidth=1*d;for(const i of [1,2]){g.beginPath();g.moveTo(x1+col*i,at*.2);g.lineTo(x1+col*i,at*.8);g.stroke()}
  // 테이프 공통
  const tape=(x,tw,val,span,step,lab,fmt,left,lim)=>{
    g.save();g.fillStyle='#2b3328ee';g.fillRect(x,at,tw,ah);g.beginPath();g.rect(x,at,tw,ah);g.clip();
    const pp=ah/span,y=u=>cy-(u-val)*pp;
    if(lim>0){const yl=y(lim);g.save();g.beginPath();g.rect(left?x+tw-8*d:x,at,8*d,Math.max(0,yl-at));g.clip();
      for(let k=-ah;k<ah*2;k+=12*d){g.fillStyle=k/12/d%2?'#fff':RED;g.fillRect(left?x+tw-8*d:x,k,8*d,6*d)}g.restore()}
    g.strokeStyle=W;g.fillStyle=W;g.font=fnt(Math.min(K*.05,tw*.34));g.textBaseline='middle';g.textAlign=left?'right':'left';
    const lo=Math.floor((val-span/2)/step)*step;
    for(let u=lo;u<=val+span/2;u+=step){if(u<0&&left)continue;const yy=y(u),maj=Math.round(u/step)%lab===0;
      g.lineWidth=(maj?2:1.2)*d;const L=(maj?14:8)*d;g.beginPath();if(left){g.moveTo(x+tw,yy);g.lineTo(x+tw-L,yy)}else{g.moveTo(x,yy);g.lineTo(x+L,yy)}g.stroke();
      if(maj&&Math.abs(yy-cy)>K*.09)g.fillText(fmt(u),left?x+tw-L-5*d:x+L+5*d,yy)}
    g.restore();g.strokeStyle='#000';g.lineWidth=2*d;g.strokeRect(x,at,tw,ah);
  };
  tape(x1,sw,v,120,10,2,u=>u,true,gLimit);
  const alt=gs.fix&&gs.alt>-9000?gs.alt:0;tape(x2,aw,alt,400,20,5,u=>Math.round(u),false,0);
  // 속도 읽음 상자(숫자는 DOM이 그림)
  const bh=K*.15,bw=sw*.86;g.fillStyle='#000';g.strokeStyle=over?RED:W;g.lineWidth=2*d;g.beginPath();
  g.moveTo(x1+2*d,cy-bh/2);g.lineTo(x1+bw,cy-bh/2);g.lineTo(x1+bw,cy-bh*.18);g.lineTo(x1+sw-2*d,cy);g.lineTo(x1+bw,cy+bh*.18);g.lineTo(x1+bw,cy+bh/2);g.lineTo(x1+2*d,cy+bh/2);g.closePath();g.fill();g.stroke();
  // 고도 읽음 상자
  const ab=aw*.9;g.beginPath();g.moveTo(x2+2*d,cy);g.lineTo(x2+aw-ab+2*d,cy-bh*.38);g.lineTo(x2+aw-2*d,cy-bh*.38);g.lineTo(x2+aw-2*d,cy+bh*.38);g.lineTo(x2+aw-ab+2*d,cy+bh*.38);g.closePath();
  g.fillStyle='#000';g.fill();g.strokeStyle=W;g.stroke();
  g.fillStyle=gs.fix&&gs.alt>-9000?GRN:AMB;g.font=fnt(Math.min(bh*.5,aw*.3),700);g.textAlign='center';g.textBaseline='middle';
  g.fillText(gs.fix&&gs.alt>-9000?Math.round(gs.alt):'----',x2+aw-ab/2,cy+1*d);
  // 라벨
  g.font=fnt(Math.min(K*.042,at*.6));g.textBaseline='bottom';g.fillStyle=MAG;g.textAlign='center';g.fillText('GS km/h',x1+sw/2,h-2*d);
  g.fillStyle=CY;g.fillText('ALT m',x2+aw/2,h-2*d);
}
function drawTape(){
  const c=cv.tape,g=cx.tape;if(!g)return;const w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  const P={carbon:['#e6e3de','#9fa2a7',C.cp],neon:['#f1ece6','#a19c96',C.cphi],classic:['#efe6d8','#b7a991','#ff9a3c'],minimal:['#ece8e2','#8e9196',C.cp],tactical:['#c9f5bf','#7fa878','#ffb43a'],cockpit:['#ffffff','#9fb3c8','#f3bc65']}[gStyle];
  const ppd=w/150,ctr=hdgDisp,boxW=110*d;g.textAlign='center';g.textBaseline='alphabetic';
  for(let deg=Math.floor((ctr-80)/5)*5;deg<=ctr+80;deg+=5){
    const x=w/2+(deg-ctr)*ppd,n=((deg%360)+360)%360,card=n%45===0,mid=n%15===0;
    g.strokeStyle=P[0];g.globalAlpha=card?.95:mid?.6:.3;g.lineWidth=(card?2:1)*d;
    g.beginPath();g.moveTo(x,3*d);g.lineTo(x,(card?18:mid?13:8)*d);g.stroke();
    if(Math.abs(x-w/2)<boxW/2+8*d)continue;
    g.globalAlpha=1;
    if(card){g.fillStyle=n===0?P[2]:P[0];g.font=`700 ${20*d}px ${RJ}`;g.fillText(DIRS[n/22.5],x,h-8*d)}
    else if(mid){g.fillStyle=P[1];g.font=`600 ${13*d}px ${RJ}`;g.fillText(String(n).padStart(3,'0'),x,h-9*d)}
  }
  g.globalAlpha=1;g.fillStyle=P[2];g.shadowBlur=8*d;g.shadowColor=P[2];
  g.beginPath();g.moveTo(w/2-8*d,0);g.lineTo(w/2+8*d,0);g.lineTo(w/2,12*d);g.closePath();g.fill();g.shadowBlur=0;
}

