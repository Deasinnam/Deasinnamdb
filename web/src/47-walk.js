// 스피드미터 "뚜벅이 모드": 탐험용 나침반 — 앤틱 황동 테, 짙은 녹색 다이얼, 붉은 북쪽 바늘, 은은한 지형 등고선
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
const WK={hd:0,shown:-999,bg:null,bgKey:'',theme:store.get('wkTheme','auto'),last:''};
const WK_TH={auto:'테마 자동',day:'테마 주간',night:'테마 야간'};
function wkNight(){const t=WK.theme;if(t==='night')return true;if(t==='day')return false;const h=new Date().getHours();return h>=19||h<6}
/* 등고선 배경: 몇 개의 언덕을 겹친 높이 지도에서 같은 높이 선만 그림(크기가 바뀔 때만 다시 만듦) */
function wkContours(W,H,night){const key=W+'x'+H+(night?'n':'d');if(WK.bgKey===key)return WK.bg;
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const bg=g.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7);bg.addColorStop(0,night?'#0f1a12':'#1c2e20');bg.addColorStop(1,night?'#060b07':'#0d1710');g.fillStyle=bg;g.fillRect(0,0,W,H);
  const hills=[];for(let k=0;k<7;k++)hills.push({x:(Math.sin(k*91.7)*.5+.5)*W,y:(Math.sin(k*47.3+1)*.5+.5)*H,r:(.18+((k*37)%10)/40)*Math.max(W,H),a:k%3?1:-.7});
  const S=6,cols=Math.ceil(W/S)+1,rows=Math.ceil(H/S)+1,f=new Float32Array(cols*rows);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=i*S,y=j*S;let v=0;for(const p of hills){const dx=x-p.x,dy=y-p.y;v+=p.a*Math.exp(-(dx*dx+dy*dy)/(p.r*p.r))}v+=.08*Math.sin(x*.013+y*.007)+.05*Math.cos(x*.004-y*.011);f[j*cols+i]=v}
  g.lineWidth=1;
  for(let L=-1;L<=1.6;L+=.12){g.strokeStyle=Math.abs((L*100|0)%48)<6?(night?'#3d5a4066':'#7fa58055'):(night?'#2c463233':'#5f8a6438');g.beginPath();
    for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){const a=f[j*cols+i]-L,b=f[j*cols+i+1]-L,cc=f[(j+1)*cols+i+1]-L,d=f[(j+1)*cols+i]-L,x=i*S,y=j*S,pts=[];
      if(a*b<0)pts.push([x+S*a/(a-b),y]);if(b*cc<0)pts.push([x+S,y+S*b/(b-cc)]);if(cc*d<0)pts.push([x+S*d/(d-cc),y+S]);if(d*a<0)pts.push([x,y+S*a/(a-d)]);
      if(pts.length>=2){g.moveTo(pts[0][0],pts[0][1]);g.lineTo(pts[1][0],pts[1][1])}if(pts.length===4){g.moveTo(pts[2][0],pts[2][1]);g.lineTo(pts[3][0],pts[3][1])}}
    g.stroke()}
  WK.bg=c;WK.bgKey=key;return c}
/* 나침반: 카드(눈금·방위 글자·장미)가 진행 방향만큼 돌고, 위쪽 고정 표시가 지금 향한 방향 */
function drawWalk(){const cv=$('#wkDial');if(!cv||!cv.offsetWidth)return;const d=Math.min(2,devicePixelRatio||1),W=Math.round(cv.offsetWidth*d),H=Math.round(cv.offsetHeight*d);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}const g=cv.getContext('2d'),night=wkNight(),on=hdgNow>=0,hd=WK.hd;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);
  const R=Math.min(W,H)*.47,cx=W/2,cy=H/2,BR=['#f6dfa6','#c9a565','#8a6a35','#4a3519'];
  // 황동 테(두 겹) + 볼트
  let gr=g.createLinearGradient(cx-R,cy-R,cx+R,cy+R);gr.addColorStop(0,BR[0]);gr.addColorStop(.35,BR[1]);gr.addColorStop(.7,BR[3]);gr.addColorStop(1,BR[1]);
  g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1.5*d;g.stroke();
  g.fillStyle='#0b0805';g.beginPath();g.arc(cx,cy,R*.93,0,7);g.fill();
  gr=g.createLinearGradient(cx,cy-R,cx,cy+R);gr.addColorStop(0,'#e7cb8f');gr.addColorStop(.5,'#7a5a2c');gr.addColorStop(1,'#d8b878');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R*.915,0,7);g.fill();
  // 다이얼 면: 짙은 녹색
  const face=g.createRadialGradient(cx,cy-R*.2,R*.1,cx,cy,R*.86);face.addColorStop(0,night?'#16241a':'#20362a');face.addColorStop(1,night?'#070d09':'#0c1a12');
  g.fillStyle=face;g.beginPath();g.arc(cx,cy,R*.86,0,7);g.fill();
  g.save();g.translate(cx,cy);g.rotate(-hd*Math.PI/180);
  // 눈금(5°마다, 30°마다 숫자)
  const ink=night?'#c9b98f':'#efe2bf';g.textAlign='center';g.textBaseline='middle';
  for(let a=0;a<360;a+=5){const big=a%30===0,mid=a%10===0,r1=R*.84,r2=R*(big?.75:mid?.785:.805),t=(a-90)*Math.PI/180;g.strokeStyle=big?'#e7cb8f':ink;g.globalAlpha=big?1:.75;g.lineWidth=(big?2.2:1)*d;
    g.beginPath();g.moveTo(Math.cos(t)*r1,Math.sin(t)*r1);g.lineTo(Math.cos(t)*r2,Math.sin(t)*r2);g.stroke();
    if(big&&a%90){g.globalAlpha=1;g.save();g.rotate(a*Math.PI/180);g.fillStyle=ink;g.font=`600 ${R*.07}px Georgia,serif`;g.fillText(String(a),0,-R*.68);g.restore()}}
  g.globalAlpha=1;
  // 방위 글자
  for(const [k,a,s] of [['N',0,.15],['E',90,.13],['S',180,.13],['W',270,.13],['NE',45,.065],['SE',135,.065],['SW',225,.065],['NW',315,.065]]){
    g.save();g.rotate(a*Math.PI/180);g.fillStyle=k==='N'?'#e9cf92':ink;g.font=`700 ${R*s}px Georgia,"Times New Roman",serif`;g.shadowColor='#000';g.shadowBlur=4*d;g.fillText(k,0,k.length>1?-R*.56:-R*.6);g.restore()}
  // 안쪽 원
  g.strokeStyle='#c9a56566';g.lineWidth=1*d;for(const r of [.5,.32]){g.beginPath();g.arc(0,0,R*r,0,7);g.stroke()}
  // 나침반 장미(8방향 별): 황동 양면 그림자
  const star=(len,wd,a,c1,c2)=>{g.save();g.rotate(a);g.fillStyle=c1;g.beginPath();g.moveTo(0,-len);g.lineTo(wd,0);g.lineTo(0,0);g.closePath();g.fill();g.fillStyle=c2;g.beginPath();g.moveTo(0,-len);g.lineTo(-wd,0);g.lineTo(0,0);g.closePath();g.fill();g.restore()};
  for(let k=0;k<4;k++)star(R*.36,R*.06,(45+k*90)*Math.PI/180,'#a8854a','#e8cf95');
  for(let k=1;k<4;k++)star(R*.48,R*.085,k*90*Math.PI/180,'#b8935a','#f3dca6');
  // 북쪽 바늘: 붉은색, 남쪽: 아이보리
  g.shadowColor='#000';g.shadowBlur=6*d;star(R*.5,R*.085,0,'#8f1d14','#d23a2a');g.shadowBlur=0;
  g.restore();
  // 가운데 황동 축
  gr=g.createRadialGradient(cx-R*.02,cy-R*.03,0,cx,cy,R*.07);gr.addColorStop(0,'#fff1c8');gr.addColorStop(.5,'#c9a565');gr.addColorStop(1,'#4a3519');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R*.065,0,7);g.fill();g.strokeStyle='#000';g.lineWidth=1*d;g.stroke();
  // 위쪽 고정 표시(지금 향한 방향)
  g.fillStyle='#f3dca6';g.beginPath();g.moveTo(cx,cy-R*.87);g.lineTo(cx-R*.035,cy-R*.95);g.lineTo(cx+R*.035,cy-R*.95);g.closePath();g.fill();g.strokeStyle='#000';g.stroke();
  // 유리 반사
  const gl=g.createLinearGradient(cx-R,cy-R,cx+R*.2,cy+R*.2);gl.addColorStop(0,'#ffffff1c');gl.addColorStop(.45,'#ffffff06');gl.addColorStop(.46,'#ffffff00');g.fillStyle=gl;g.beginPath();g.arc(cx,cy,R*.86,0,7);g.fill();
  if(!on){g.fillStyle='#00000055';g.beginPath();g.arc(cx,cy,R*.86,0,7);g.fill()}}
function wkTick(){const host=$('#walkHost');if(document.hidden||!host||!host.offsetParent)return;
  const host2=$('#wGps');const night=wkNight();host2.classList.toggle('wk-night',night);
  const bg=wkContours(Math.round(host.offsetWidth),Math.round(host.offsetHeight),night);if(host.dataset.bg!==WK.bgKey){host.style.backgroundImage=`url(${bg.toDataURL('image/png')})`;host.dataset.bg=WK.bgKey}
  const on=hdgNow>=0,tgt=on?hdgNow:0;let df=((tgt-WK.hd+540)%360)-180;WK.hd=(WK.hd+df*.18+360)%360;
  const key=Math.round(WK.hd*4)+'|'+on+'|'+night+'|'+$('#wkDial').offsetWidth;if(key!==WK.last){WK.last=key;drawWalk()}
  $('#wkSpd').textContent=(gpsOn&&gs.fix?Math.max(0,spdNow):0).toFixed(1);
  $('#wkAlt').textContent=gpsOn&&gs.fix&&gs.alt>-9000?Math.round(gs.alt):'—';
  $('#wkBrg').textContent=on?Math.round(tgt)%360+'° '+CMP_KO[Math.round(tgt/45)%8]:'—°';
  $('#wkStat').textContent=on?'방향 센서 연결됨':gpsOn?'방향 찾는 중 — 몇 걸음 걸어 보세요':'방향 센서 연결 대기 · GPS를 켜면 더 정확해요'}
setInterval(wkTick,50);
$('#wkTheme').textContent=WK_TH[WK.theme]||'테마 자동';
$('#wkTheme').onclick=()=>{WK.theme={auto:'day',day:'night',night:'auto'}[WK.theme]||'auto';store.set('wkTheme',WK.theme);$('#wkTheme').textContent=WK_TH[WK.theme];WK.last=''};
$('#wkCal').onclick=()=>{try{toast('방위 보정: 기기를 8자 모양으로 천천히 2~3번 돌려 주세요. 자석·스피커 가까이에서는 방향이 틀릴 수 있어요.')}catch(e){}
  WK.last=''};
