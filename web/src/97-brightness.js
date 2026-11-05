// 상단 밝기 카드(해외 시간 자리 · 콕핏은 나침반 옆): 이 앱 화면 밝기를 바로 조절
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 값: 10~100(%) 또는 -1(자동 = 시스템 밝기). 저장 키 scrBri. 태블릿 스킨은 자기 밝기 손잡이(bri)를 따로 씀 */
const BRI_MIN=10,BRI_MAX=100,BRI_STEP=10;
let scrBri=(()=>{const v=+store.get('scrBri',-1);return v>=BRI_MIN&&v<=BRI_MAX?v:-1})();
function briNative(v){try{NB&&NB.setScreenBrightness&&NB.setScreenBrightness(v)}catch(e){}}
function briSet(v,save=true){v=v<0?-1:Math.max(BRI_MIN,Math.min(BRI_MAX,Math.round(v/5)*5));scrBri=v;
  if(!isTab())briNative(v);if(save)store.set('scrBri',v);briUi()}
function briBase(){return scrBri<0?60:scrBri} // 자동에서 −/＋를 누르면 60%에서 시작
function briUi(){const t=scrBri<0?'자동':scrBri+'%';$('#briV').textContent=t;$('#briPV').textContent=scrBri<0?'자동 (시스템 밝기)':scrBri+'%';
  $('#briRange').value=briBase();$('#briDn').disabled=scrBri===BRI_MIN;$('#briUp').disabled=scrBri===BRI_MAX;
  document.querySelectorAll('#briPre button').forEach(b=>b.classList.toggle('on',+b.dataset.v===scrBri));
  try{drawBriDial($('#briDial'),scrBri)}catch(e){}}
/* 계기: 날씨·나침반과 같은 장착판·베젤, 270° 눈금 호에 지금 밝기 */
function drawBriDial(cv,v){const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  const pl=ctx.createLinearGradient(-R,-R,R,R);pl.addColorStop(0,'#3a4236');pl.addColorStop(1,'#151a14');ctx.fillStyle=pl;ctx.beginPath();ctx.roundRect(-R+1,-R+1,S-2,S-2,S*.12);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const sx=x*R*.8,sy=y*R*.8,r=S*.035,g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,0,sx,sy,r);g.addColorStop(0,'#d9dee3');g.addColorStop(1,'#4c535b');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();ctx.strokeStyle='#1a1d20';ctx.lineWidth=S*.008;ctx.beginPath();ctx.moveTo(sx-r*.7,sy+r*.7);ctx.lineTo(sx+r*.7,sy-r*.7);ctx.stroke()}
  const bz=ctx.createLinearGradient(0,-R,0,R);bz.addColorStop(0,'#6b7468');bz.addColorStop(.5,'#22281f');bz.addColorStop(1,'#0b0e0a');ctx.fillStyle=bz;ctx.beginPath();ctx.arc(0,0,R*.9,0,7);ctx.fill();
  ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  const a0=Math.PI*.75,sw=Math.PI*1.5,auto=v<0,f=auto?0:(v-BRI_MIN)/(BRI_MAX-BRI_MIN);
  for(let i=0;i<=18;i++){const a=a0+sw*i/18,big=i%2===0,r1=R*.74,r2=big?R*.62:R*.68;ctx.strokeStyle=!auto&&i/18<=f+1e-6?'#f3bc65':'#4f584b';ctx.lineWidth=big?S*.02:S*.01;
    ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke()}
  // 가운데 해 모양(밝을수록 환하게)
  const k=auto?.55:.35+f*.65,sr=R*.16;ctx.fillStyle=`rgba(243,188,101,${k})`;ctx.beginPath();ctx.arc(0,-R*.08,sr,0,7);ctx.fill();
  ctx.strokeStyle=`rgba(243,188,101,${k})`;ctx.lineWidth=S*.016;ctx.lineCap='round';
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*sr*1.45,-R*.08+Math.sin(a)*sr*1.45);ctx.lineTo(Math.cos(a)*sr*1.95,-R*.08+Math.sin(a)*sr*1.95);ctx.stroke()}
  if(!auto){const a=a0+sw*f;ctx.strokeStyle='#eef2e6';ctx.lineWidth=S*.022;ctx.beginPath();ctx.moveTo(Math.cos(a)*R*.5,Math.sin(a)*R*.5);ctx.lineTo(Math.cos(a)*R*.76,Math.sin(a)*R*.76);ctx.stroke()}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e7e9df';ctx.font=`600 ${S*(auto?.1:.12)}px "Share Tech Mono",monospace`;ctx.fillText(auto?'AUTO':v+'%',0,R*.4);
  const gl=ctx.createLinearGradient(-R*.6,-R*.8,R*.3,R*.2);gl.addColorStop(0,'#ffffff1f');gl.addColorStop(.45,'#ffffff05');gl.addColorStop(.46,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
function briPickClose(){$('#briPick').hidden=true}
function briPickOpen(){const p=$('#briPick');p.hidden=false;briUi();const r=$('#clkBri').getBoundingClientRect(),pr=p.getBoundingClientRect();
  p.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,r.left))+'px';p.style.top=Math.max(8,Math.min(innerHeight-pr.height-8,r.bottom+6))+'px'}
$('#briDn').onclick=e=>{e.stopPropagation();briSet(briBase()-BRI_STEP)};
$('#briUp').onclick=e=>{e.stopPropagation();briSet(briBase()+BRI_STEP)};
$('#clkBri').onclick=e=>{if(e.target.closest('.bri-b'))return;if($('#briPick').hidden)briPickOpen();else briPickClose()};
$('#briRange').oninput=e=>briSet(+e.target.value);
$('#briPDn').onclick=()=>briSet(briBase()-BRI_STEP);$('#briPUp').onclick=()=>briSet(briBase()+BRI_STEP);
$('#briPre').onclick=e=>{const b=e.target.closest('button[data-v]');if(b)briSet(+b.dataset.v)};
document.addEventListener('pointerdown',e=>{if(!$('#briPick').hidden&&!e.target.closest('#briPick,#clkBri'))briPickClose()},true);
window.addEventListener('scroll',()=>{if(!$('#briPick').hidden)briPickClose()},{passive:true});
// 태블릿 스킨을 나오면 태블릿 쪽이 시스템 밝기로 되돌리므로, 스킨이 바뀔 때마다 이 설정을 다시 적용
new MutationObserver(()=>setTimeout(()=>{if(!isTab())briNative(scrBri)},60)).observe(document.documentElement,{attributes:true,attributeFilter:['data-skin']});
briSet(scrBri,false);window.AmpBri={set:briSet,get:()=>scrBri};
