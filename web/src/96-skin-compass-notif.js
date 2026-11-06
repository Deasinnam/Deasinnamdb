// 상단 스킨 버튼(콕핏 수정판), 나침반 계기(해외 시간 대신), 알림 접근 "제한된 설정" 단계별 안내
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 스킨 바꾸기 버튼 ---------- */
function skinPickClose(){$('#skinPick').hidden=true}
function skinPickOpen(){const p=$('#skinPick'),l=$('#skinPickList');l.innerHTML='';
  for(const [k,n] of SKINS){const b=document.createElement('button');b.className='pill'+(k===skin?' on':'');b.dataset.k=k;b.textContent=n.replace('대신남 자동차 모드 · ','자동차 · ');l.appendChild(b)}
  p.hidden=false;const r=$('#skinBtn').getBoundingClientRect(),pr=p.getBoundingClientRect();
  p.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,r.left))+'px';p.style.top=Math.min(innerHeight-pr.height-8,r.bottom+6)+'px'}
$('#skinBtn').onclick=e=>{e.stopPropagation();if($('#skinPick').hidden)skinPickOpen();else skinPickClose()};
$('#skinPickList').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;const s=$('#skin');s.value=b.dataset.k;s.dispatchEvent(new Event('change'));skinPickClose()});
document.addEventListener('pointerdown',e=>{if(!$('#skinPick').hidden&&!e.target.closest('#skinPick,#skinBtn'))skinPickClose()},true);
window.addEventListener('scroll',()=>{if(!$('#skinPick').hidden)skinPickClose()},{passive:true});

/* ---------- 나침반 계기(날씨 계기와 같은 장착판·베젤) ---------- */
const CMP_KO=['북','북동','동','남동','남','남서','서','북서'];
function drawCmpDial(cv,hdg,on){if(CPX())return antCmp(cv,hdg,on);const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  const pl=ctx.createLinearGradient(-R,-R,R,R);pl.addColorStop(0,DIAL().pl[0]);pl.addColorStop(1,DIAL().pl[1]);ctx.fillStyle=pl;ctx.beginPath();ctx.roundRect(-R+1,-R+1,S-2,S-2,S*.12);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const sx=x*R*.8,sy=y*R*.8,r=S*.035,g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,0,sx,sy,r);g.addColorStop(0,DIAL().sc[0]);g.addColorStop(1,DIAL().sc[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();ctx.strokeStyle='#1a1d20';ctx.lineWidth=S*.008;ctx.beginPath();ctx.moveTo(sx-r*.7,sy+r*.7);ctx.lineTo(sx+r*.7,sy-r*.7);ctx.stroke()}
  const bz=ctx.createLinearGradient(0,-R,0,R);bz.addColorStop(0,DIAL().bz[0]);bz.addColorStop(.5,DIAL().bz[1]);bz.addColorStop(1,DIAL().bz[2]);ctx.fillStyle=bz;ctx.beginPath();ctx.arc(0,0,R*.9,0,7);ctx.fill();
  ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  // 돌아가는 방위판: 위쪽이 지금 진행 방향
  ctx.save();ctx.rotate(-(on?hdg:0)*Math.PI/180);
  for(let d=0;d<360;d+=5){const a=d*Math.PI/180,big=d%30===0,mid=d%10===0,r1=R*.77,r2=big?R*.63:mid?R*.68:R*.72;
    ctx.strokeStyle=big?'#eef2e6':'#9fa99a';ctx.lineWidth=big?S*.018:S*.008;ctx.beginPath();ctx.moveTo(Math.sin(a)*r1,-Math.cos(a)*r1);ctx.lineTo(Math.sin(a)*r2,-Math.cos(a)*r2);ctx.stroke()}
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(let d=0;d<360;d+=30){const a=d*Math.PI/180,card={0:'N',90:'E',180:'S',270:'W'}[d],t=card||String(d/10);
    ctx.save();ctx.rotate(a);ctx.translate(0,-R*.52);ctx.fillStyle=card==='N'?'#ff6a4d':card?'#eef2e6':'#a8f08f';
    ctx.font=`700 ${card?S*.11:S*.075}px "Barlow Condensed","Rajdhani",sans-serif`;ctx.fillText(t,0,0);ctx.restore()}
  ctx.restore();
  // 고정 표시: 위쪽 기준선(호박색)과 가운데 비행기
  ctx.fillStyle='#f3bc65';ctx.beginPath();ctx.moveTo(0,-R*.79);ctx.lineTo(-S*.035,-R*.92);ctx.lineTo(S*.035,-R*.92);ctx.closePath();ctx.fill();
  ctx.strokeStyle=on?'#f3bc65':'#6b7468';ctx.lineWidth=S*.022;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(0,-R*.22);ctx.lineTo(0,R*.2);ctx.moveTo(-R*.2,-R*.02);ctx.lineTo(R*.2,-R*.02);ctx.moveTo(-R*.09,R*.17);ctx.lineTo(R*.09,R*.17);ctx.stroke();
  ctx.fillStyle='#e7e9df';ctx.font=`600 ${S*.1}px "Share Tech Mono",monospace`;ctx.fillText(on?String(Math.round(hdg)%360).padStart(3,'0'):'---',0,R*.42);
  const gl=ctx.createLinearGradient(-R*.6,-R*.8,R*.3,R*.2);gl.addColorStop(0,'#ffffff1f');gl.addColorStop(.45,'#ffffff05');gl.addColorStop(.46,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
let cmpLast='';
function cmpTick(){if(document.hidden||!document.documentElement.hasAttribute('data-ck2'))return;
  const on=gpsOn&&hdgNow>=0,h=on?((hdgDisp%360)+360)%360:0,key=on?(Math.round(h*2)/2)+'':gpsOn?'wait':'off';if(key===cmpLast)return;cmpLast=key;
  try{drawCmpDial($('#cmpDial'),h,on)}catch(e){}
  $('#cmpB').textContent=on?Math.round(h)%360+'°':'---°';
  $('#cmpE').textContent=on?CMP_KO[Math.round(h/45)%8]+'쪽':gpsOn?'방향 찾는 중':'GPS 꺼짐 · 눌러서 켜기'}
setInterval(cmpTick,150);cmpTick();
/* 나침반을 누르면 자세한 정보 창(방향·출처·GPS 상태·정확도·위성·속도·고도·좌표), 창 안에서 GPS 켜고 끄기 */
const CMP16=['북','북북동','북동','동북동','동','동남동','남동','남남동','남','남남서','남서','서남서','서','서북서','북서','북북서'];
let cpT=0;
function cpFill(){const fix=gpsOn&&gs&&gs.fix,on=hdgNow>=0,h=on?((hdgNow%360)+360)%360:0,v=(x,u,d=0)=>x==null||!isFinite(x)?'—':(+x).toFixed(d)+u;
  $('#cpDeg').textContent=on?String(Math.round(h)%360).padStart(3,'0')+'°':'---°';$('#cpDir').textContent=on?CMP16[Math.round(h/22.5)%16]+'쪽':'방향 없음';
  const moving=fix&&spdNow>9;$('#cpSrc').textContent=!on?'없음':(typeof att!=='undefined'&&att.on&&att.hdg>=0)?'방향 센서(나침반)':moving?'GPS 진행 방향':'방향 센서(나침반)';
  $('#cpGps').textContent=!gpsOn?'꺼짐':fix?'위치 잡힘':'위치 찾는 중';
  $('#cpAcc').textContent=fix&&gs.acc>=0?'±'+Math.round(gs.acc)+' m':'—';
  $('#cpSat').textContent=gs&&gs.satsUsed>=0?gs.satsUsed+' / '+(gs.satsSeen>=0?gs.satsSeen:'?')+' 개':'—';
  $('#cpSpd').textContent=fix?v(spdNow,' km/h',1):'—';$('#cpAlt').textContent=fix&&gs.alt>-9000?v(gs.alt,' m'):'—';
  $('#cpLat').textContent=fix&&isFinite(gs.lat)?(+gs.lat).toFixed(5)+'°':'—';$('#cpLon').textContent=fix&&isFinite(gs.lon)?(+gs.lon).toFixed(5)+'°':'—';
  $('#cpGpsBtn').textContent=gpsOn?'GPS 끄기':'GPS 켜기';$('#cpGpsBtn').classList.toggle('on',!gpsOn)}
function cpClose(){$('#cmpPick').hidden=true;clearInterval(cpT)}
function cpOpen(){const p=$('#cmpPick');p.hidden=false;cpFill();clearInterval(cpT);cpT=setInterval(cpFill,500);
  const r=$('#clkCmp').getBoundingClientRect(),pr=p.getBoundingClientRect();p.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,r.left))+'px';p.style.top=Math.max(8,Math.min(innerHeight-pr.height-8,r.bottom+6))+'px'}
$('#clkCmp').onclick=()=>{if($('#cmpPick').hidden)cpOpen();else cpClose()};
$('#cpClose').onclick=cpClose;
$('#cpGpsBtn').onclick=()=>{try{if(gpsOn)gpsStop(true);else{gpsStart();toast('GPS를 켰어요. 움직이거나 나침반이 잡히면 방향이 나와요.')}}catch(e){}cpFill()};
document.addEventListener('pointerdown',e=>{if(!$('#cmpPick').hidden&&!e.target.closest('#cmpPick,#clkCmp'))cpClose()},true);
window.addEventListener('scroll',()=>{if(!$('#cmpPick').hidden)cpClose()},{passive:true});

/* ---------- 알림 접근: "제한된 설정" 단계별 안내 ---------- */
function notifGranted(){try{return !!JSON.parse(NB.extStatus()).notif}catch(e){return false}}
function nhOpen(step){const h=$('#notifHelp');h.hidden=false;h.querySelectorAll('li[data-s]').forEach(li=>li.classList.toggle('now',+li.dataset.s===step))}
let nhTry=0,nhStep=0;
if(HAS_EXT){
  $('#xNotif').onclick=()=>{nhTry=Date.now();nhStep=1;try{NB.openNotificationAccess()}catch(e){}};
  $('#xNotifHelp').onclick=()=>nhOpen(notifGranted()?3:1);
  $('#nh1').onclick=()=>{nhTry=Date.now();nhStep=1;try{NB.openNotificationAccess()}catch(e){}};
  $('#nh2').onclick=()=>{nhTry=Date.now();nhStep=2;try{NB.openAppInfo()}catch(e){toast('설정 → 애플리케이션에서 "대신남 원 Ver1"을 찾아 주세요.')}};
  $('#nh3').onclick=()=>{nhTry=Date.now();nhStep=3;try{NB.openNotificationAccess()}catch(e){}};
  // 설정에서 돌아왔는데 아직 허용되지 않았으면 다음 단계를 보여 줌
  document.addEventListener('visibilitychange',()=>{if(document.hidden||!nhTry||Date.now()-nhTry>5*60e3)return;
    setTimeout(()=>{if(notifGranted()){nhTry=0;$('#notifHelp').hidden=true;toast('알림 접근이 허용됐어요. 이제 곡 정보가 보여요.');return}nhOpen(nhStep>=3?2:nhStep+1)},600)});
}
$('#nhClose').onclick=()=>{$('#notifHelp').hidden=true;nhTry=0};
$('#notifHelp').addEventListener('click',e=>{if(e.target.id==='notifHelp'){$('#notifHelp').hidden=true;nhTry=0}});
