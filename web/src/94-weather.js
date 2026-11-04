// 오늘의 날씨
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 오늘의 날씨(Open-Meteo, 키 없음) → 시계 옆 표시 + 속도계 비·눈·흐림 효과 ---------- */
const WX={kind:'clear',code:null,temp:null,hi:null,lo:null,at:0,place:''};
window.AmpWx={get kind(){const f=store.get('wxForce','auto');return f==='auto'?WX.kind:f==='off'?'off':f},get data(){return WX}};
function wxKind(c){if(c==null)return 'clear';if([71,73,75,77,85,86].includes(c))return 'snow';if([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(c))return 'rain';if([45,48].includes(c))return 'fog';if([2,3].includes(c))return 'cloudy';return 'clear'}
function wxText(c){const m={0:'맑음',1:'대체로 맑음',2:'구름 조금',3:'흐림',45:'안개',48:'안개',51:'이슬비',53:'이슬비',55:'이슬비',56:'어는 이슬비',57:'어는 이슬비',61:'비',63:'비',65:'강한 비',66:'어는 비',67:'어는 비',71:'눈',73:'눈',75:'많은 눈',77:'싸락눈',80:'소나기',81:'소나기',82:'강한 소나기',85:'눈 소나기',86:'눈 소나기',95:'뇌우',96:'뇌우·우박',99:'뇌우·우박'};return m[c]||'—'}
function wxIcon(k,day){return {snow:'❄️',rain:'🌧️',fog:'🌫️',cloudy:'☁️',clear:day===false?'🌙':'☀️'}[k]||'·'}
function drawWxDial(cv,k,temp,night){const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  const pl=ctx.createLinearGradient(-R,-R,R,R);pl.addColorStop(0,'#3a4236');pl.addColorStop(1,'#151a14');ctx.fillStyle=pl;ctx.beginPath();ctx.roundRect(-R+1,-R+1,S-2,S-2,S*.12);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const sx=x*R*.8,sy=y*R*.8,r=S*.035,g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,0,sx,sy,r);g.addColorStop(0,'#d9dee3');g.addColorStop(1,'#4c535b');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();ctx.strokeStyle='#1a1d20';ctx.lineWidth=S*.008;ctx.beginPath();ctx.moveTo(sx-r*.7,sy-r*.7*(x*y));ctx.lineTo(sx+r*.7,sy+r*.7*(x*y));ctx.stroke()}
  const bz=ctx.createLinearGradient(0,-R,0,R);bz.addColorStop(0,'#6b7468');bz.addColorStop(.5,'#22281f');bz.addColorStop(1,'#0b0e0a');ctx.fillStyle=bz;ctx.beginPath();ctx.arc(0,0,R*.9,0,7);ctx.fill();
  ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  // 기온 눈금 -20~40℃ (240°)
  const A=v=>(-120+(Math.max(-20,Math.min(40,v))+20)/60*240)*Math.PI/180;
  for(const [a0,a1,c] of [[-20,0,'#5aa9ff'],[0,25,'#a8f08f'],[25,40,'#f3bc65']]){ctx.strokeStyle=c;ctx.lineWidth=S*.03;ctx.beginPath();ctx.arc(0,0,R*.72,A(a0)-Math.PI/2,A(a1)-Math.PI/2);ctx.stroke()}
  for(let v=-20;v<=40;v+=5){const a=A(v),big=v%20===0;ctx.strokeStyle=big?'#eef2e6':'#9fa99a';ctx.lineWidth=big?S*.018:S*.008;ctx.beginPath();ctx.moveTo(Math.sin(a)*R*.66,-Math.cos(a)*R*.66);ctx.lineTo(Math.sin(a)*R*(big?.56:.61),-Math.cos(a)*R*(big?.56:.61));ctx.stroke()
    if(big){ctx.fillStyle='#eef2e6';ctx.font=`700 ${S*.07}px "Barlow Condensed",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(v),Math.sin(a)*R*.46,-Math.cos(a)*R*.46)}}
  // 날씨 그림(가운데 위)
  ctx.save();ctx.translate(0,-R*.12);const u=S*.07;ctx.lineWidth=S*.014;ctx.lineCap='round';
  const cloud=(col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(-u*1.1,u*.2,u*.9,0,7);ctx.arc(0,-u*.35,u*1.2,0,7);ctx.arc(u*1.2,u*.25,u*.85,0,7);ctx.rect(-u*1.9,u*.2,u*3.9,u*.95);ctx.fill()};
  if(k==='clear'){if(night){ctx.fillStyle='#e8eef7';ctx.beginPath();ctx.arc(0,0,u*1.3,0,7);ctx.fill();ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(u*.6,-u*.45,u*1.15,0,7);ctx.fill()}
    else{ctx.fillStyle='#f3bc65';ctx.strokeStyle='#f3bc65';ctx.beginPath();ctx.arc(0,0,u*.95,0,7);ctx.fill();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*u*1.35,Math.sin(a)*u*1.35);ctx.lineTo(Math.cos(a)*u*1.9,Math.sin(a)*u*1.9);ctx.stroke()}}}
  else if(k==='cloudy'||k==='fog'){cloud('#c9d0d7');if(k==='fog'){ctx.strokeStyle='#9fa99a';for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-u*1.8,u*1.5+i*u*.45);ctx.lineTo(u*1.8,u*1.5+i*u*.45);ctx.stroke()}}}
  else if(k==='rain'){cloud('#aab3bd');ctx.strokeStyle='#5aa9ff';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*u*.9,u*1.45);ctx.lineTo(i*u*.9-u*.35,u*2.2);ctx.stroke()}}
  else if(k==='snow'){cloud('#d6dde4');ctx.strokeStyle='#ffffff';for(let i=-1;i<=1;i++){const x=i*u*.95,y=u*1.85;for(let j=0;j<3;j++){const a=j*Math.PI/3;ctx.beginPath();ctx.moveTo(x-Math.cos(a)*u*.32,y-Math.sin(a)*u*.32);ctx.lineTo(x+Math.cos(a)*u*.32,y+Math.sin(a)*u*.32);ctx.stroke()}}}
  ctx.restore();
  ctx.fillStyle='#e7e9df';ctx.font=`600 ${S*.15}px "Share Tech Mono",monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(temp==null?'--°':Math.round(temp)+'°',0,R*.4);
  ctx.fillStyle='#a8f08f';ctx.font=`600 ${S*.055}px "Barlow Condensed",sans-serif`;ctx.fillText('TEMP °C',0,R*.62);
  if(temp!=null){const a=A(temp);ctx.save();ctx.rotate(a);ctx.fillStyle='#f3bc65';ctx.beginPath();ctx.moveTo(-S*.018,-R*.5);ctx.lineTo(S*.018,-R*.5);ctx.lineTo(0,-R*.77);ctx.closePath();ctx.fill();ctx.restore()}
  const gl=ctx.createLinearGradient(-R*.6,-R*.8,R*.3,R*.2);gl.addColorStop(0,'#ffffff1f');gl.addColorStop(.45,'#ffffff05');gl.addColorStop(.46,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
function wxRender(){const f=store.get('wxForce','auto'),k=window.AmpWx.kind;
  try{drawWxDial($('#wxDial'),k==='off'?WX.kind:k,WX.temp,WX.day===false)}catch(e){}
  $('#wxIco').textContent=wxIcon(k==='off'?WX.kind:k,WX.day);$('#wxT').textContent=WX.temp==null?'--°':Math.round(WX.temp)+'°';
  $('#wxS').textContent=(f!=='auto'&&f!=='off'?'시험: ':'')+(f==='auto'||f==='off'?wxText(WX.code):{clear:'맑음',cloudy:'흐림',rain:'비',snow:'눈'}[f])+(WX.hi!=null?' · '+Math.round(WX.hi)+'/'+Math.round(WX.lo)+'°':'');
  $('#sWxNow').textContent=WX.code==null?'날씨를 아직 불러오지 못했어요 (인터넷·위치 확인)':(WX.place?WX.place+' · ':'')+wxText(WX.code)+' '+Math.round(WX.temp)+'° (최고 '+Math.round(WX.hi)+'° · 최저 '+Math.round(WX.lo)+'°)';
  $('#sWxForce').value=f}
async function wxFetch(){let lat=37.5665,lon=126.978,place='서울';
  if(gs&&gs.fix&&isFinite(gs.lat)){lat=gs.lat;lon=gs.lon;place='현재 위치';store.set('wxLoc',[lat,lon])}else{const l=store.get('wxLoc',null);if(l){lat=l[0];lon=l[1];place='마지막 위치'}}
  try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`);
    if(!r.ok)throw 0;const j=await r.json();const c=j.current||{};WX.code=c.weather_code;WX.temp=c.temperature_2m;WX.day=c.is_day!==0;WX.hi=j.daily.temperature_2m_max[0];WX.lo=j.daily.temperature_2m_min[0];WX.kind=wxKind(WX.code);WX.at=Date.now();WX.place=place;store.set('wxLast',{...WX})}
  catch(e){const o=store.get('wxLast',null);if(o&&Date.now()-o.at<6*3600e3)Object.assign(WX,o)}
  wxRender()}
{const o=store.get('wxLast',null);if(o&&Date.now()-o.at<6*3600e3)Object.assign(WX,o)}
$('#clkWx').onclick=()=>{openSettings();const r=$('#secWx');if(r)r.scrollIntoView({block:'center'})};
$('#sWxRefresh').onclick=()=>{$('#sWxNow').textContent='불러오는 중…';wxFetch()};
$('#sWxForce').onchange=e=>{store.set('wxForce',e.target.value);wxRender()};
wxRender();setTimeout(wxFetch,1500);setInterval(wxFetch,20*60e3);
