// EQ와 화면 그리기(음악 효과 30종, 프레임 루프)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- EQ UI ---------- */
const grid=$('#eqgrid');const eqInputs=[];
function mkBand(label,val,cls,on){
  const d=document.createElement('div');d.className='band '+(cls||'');
  d.innerHTML=`<div class="slot"><input type="range" min="-12" max="12" step="0.5" aria-label="${label} 게인"></div><span>${label}</span>`;
  const inp=d.querySelector('input'),slot=d.querySelector('.slot');inp.value=val;setP(inp);inp.oninput=()=>{setP(inp);on(+inp.value)};
  const set=v=>{v=Math.max(-12,Math.min(12,Math.round(v*2)/2));if(+inp.value!==v){inp.value=v;setP(inp);on(v)}};
  /* 손가락 위치(세로)를 바로 값으로: 위 +12dB, 아래 -12dB */
  const fromY=y=>{const r=slot.getBoundingClientRect(),pad=5,h=Math.max(1,r.height-pad*2);return 12-((y-r.top-pad)/h)*24};
  let pid=null,lastTap=0;
  slot.addEventListener('pointerdown',e=>{e.preventDefault();pid=e.pointerId;slot.setPointerCapture(pid);slot.classList.add('drag');
    const now=performance.now();if(now-lastTap<300){set(0);lastTap=0;return}lastTap=now;set(fromY(e.clientY))});
  slot.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;e.preventDefault();set(fromY(e.clientY))});
  const end=e=>{if(e.pointerId!==pid)return;pid=null;slot.classList.remove('drag')};
  slot.addEventListener('pointerup',end);slot.addEventListener('pointercancel',end);
  slot.addEventListener('touchmove',e=>e.preventDefault(),{passive:false}); // 일부 기기의 스크롤 가로채기 방지
  grid.appendChild(d);return inp;
}
const preInp=mkBand('PRE',pre,'pre',v=>{pre=v;store.set('pre',pre);applyEq();drawCurve()});
BANDS.forEach((f,i)=>eqInputs.push(mkBand(LBL[i],gains[i],'',v=>{gains[i]=v;store.set('gains',gains);$('#preset').value='';applyEq();drawCurve()})));
const presetSel=$('#preset');Object.keys(PRESETS).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=k;presetSel.appendChild(o)});
presetSel.onchange=()=>{const p=PRESETS[presetSel.value];if(!p)return;gains=p.slice();eqInputs.forEach((x,i)=>{x.value=gains[i];setP(x)});store.set('gains',gains);applyEq();drawCurve()};
$('#eqReset').onclick=()=>{gains=PRESETS.Flat.slice();pre=0;eqInputs.forEach(x=>{x.value=0;setP(x)});preInp.value=0;setP(preInp);presetSel.value='';store.set('gains',gains);store.set('pre',0);applyEq();drawCurve()};
const eqOnBtn=$('#eqOn');const syncOn=()=>{eqOnBtn.classList.toggle('on',eqOn);eqOnBtn.textContent=eqOn?'ON':'OFF';flags()};
eqOnBtn.onclick=()=>{eqOn=!eqOn;store.set('eqOn',eqOn);syncOn();applyEq();drawCurve()};

/* ---------- canvases ---------- */
const cv={vis:$('#vis'),mini:$('#mini'),eqled:$('#eqled'),curve:$('#curve'),gauge:$('#gauge'),tape:$('#tape')};const cx={};
function size(c){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);c.width=Math.max(1,Math.round(r.width*d));c.height=Math.max(1,Math.round(r.height*d));cx[c.id]=c.getContext('2d')}
const ro=new ResizeObserver(es=>{es.forEach(e=>size(e.target));drawCurve()});
Object.values(cv).forEach(c=>{size(c);ro.observe(c)});

function drawCurve(){
  const c=cv.curve,g=cx.curve;if(!g||!C.text)return;const w=c.width,h=c.height;g.clearRect(0,0,w,h);
  g.strokeStyle=C.edge;g.lineWidth=1;g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();
  const pts=gains.map((v,i)=>[(i+.5)/10*w,h/2-(eqOn?v:0)/12*(h/2-3)]);
  g.strokeStyle=eqOn?C.text:C.dim;g.lineWidth=Math.max(1.5,h/18);g.shadowColor=C.text;g.shadowBlur=eqOn?6:0;
  g.beginPath();g.moveTo(0,pts[0][1]);pts.forEach((p,i)=>{if(i===0){g.lineTo(p[0],p[1]);return}const q=pts[i-1],mx=(q[0]+p[0])/2;g.bezierCurveTo(mx,q[1],mx,p[1],p[0],p[1])});g.lineTo(w,pts[9][1]);g.stroke();g.shadowBlur=0;
}

const N=48;let bars=new Float32Array(N),peaks=new Float32Array(N),pv=new Float32Array(N);
let miniB=new Float32Array(19),miniP=new Float32Array(19);
let eqLv=new Float32Array(11);
let F=null,W=null,R=44100;
const binOf=f=>Math.min(F.length-1,Math.max(1,Math.round(f/(R/2)*F.length)));
function band(lo,hi){const a=binOf(lo),b=Math.max(a,binOf(hi));let s=0,m=0;for(let i=a;i<=b;i++){s+=F[i];if(F[i]>m)m=F[i]}return((s/(b-a+1))*.55+m*.45)/255}
function computeBars(arr,count,lo,hi,live){
  for(let i=0;i<count;i++){
    let v=0;if(live){const f0=lo*(hi/lo)**(i/count),f1=lo*(hi/lo)**((i+1)/count);v=Math.pow(band(f0,f1),1.35)*(1+i/count*.35)}
    arr[i]=Math.max(v,arr[i]*.86);
  }
}
const ledColor=r=>r<.5?C.l1:r<.72?C.l2:r<.88?C.l3:C.l4;
function ledColumn(g,x,w,yb,h,v,segH,gap,peak,dim){
  const S=Math.max(1,Math.floor(h/(segH+gap))),lit=Math.round(Math.min(1,v)*S),pk=Math.round(Math.min(1,peak||0)*S);
  for(let s=0;s<S;s++){const y=yb-(s+1)*(segH+gap)+gap;
    if(s<lit){g.fillStyle=ledColor(s/S)}else if(peak!=null&&s===pk-1&&pk>0){g.fillStyle=C.peak}else{if(!dim)continue;g.fillStyle=dim}
    g.fillRect(x,y,w,segH)}
}
function pullData(){
  if(rdPlaying&&RD_NATIVE&&NB.radioFft){
    let fs='',ws='';try{fs=NB.radioFft();ws=NB.radioWave()}catch(e){}
    for(let i=0;i<extF.length;i++)extF[i]=i<fs.length?fs.charCodeAt(i)-32:0;
    for(let i=0;i<extW.length;i++)extW[i]=i<ws.length?ws.charCodeAt(i)-32:128;
    F=extF;W=extW;try{R=NB.radioRate()||44100}catch(e){R=44100}
    return fs.length>0;
  }
  if(natL()){
    let fs='',ws='';try{fs=NB.npFft();ws=NB.npWave()}catch(e){}
    for(let i=0;i<extF.length;i++)extF[i]=i<fs.length?fs.charCodeAt(i)-32:0;
    for(let i=0;i<extW.length;i++)extW[i]=i<ws.length?ws.charCodeAt(i)-32:128;
    F=extF;W=extW;R=nat.rate||44100;
    return !!nat.playing&&fs.length>0;
  }
  if(mode==='ext'){
    let fs='',ws='';try{fs=NB.extFft();ws=NB.extWave()}catch(e){}
    for(let i=0;i<extF.length;i++)extF[i]=i<fs.length?fs.charCodeAt(i)-32:0;
    for(let i=0;i<extW.length;i++)extW[i]=i<ws.length?ws.charCodeAt(i)-32:128;
    F=extF;W=extW;R=ext.rate||44100;
    return !!ext.playing&&fs.length>0;
  }
  if(!ctx){F=null;W=null;return false}
  analyser.getByteFrequencyData(freq);analyser.getByteTimeDomainData(wave);F=freq;W=wave;R=ctx.sampleRate;
  return !audio.paused&&cur>=0;
}
let idle=0,frT=0,pwrSaver=false;
// 배터리: 화면 주사율(폴드7 120Hz)마다 다 그리지 않고, 소리가 없으면 초당 4번, 재생 중엔 최대 60번(절전 모드 20번)만 그림
function frame(now){
  requestAnimationFrame(frame);now=now||performance.now();
  const busy=!audio.paused||(natL()&&nat.playing)||(mode==='ext'&&ext.playing)||rdPlaying||driveOn||gpsOn;
  const gap=pwrSaver?(busy?50:500):(busy?15.5:250);if(now-frT<gap)return;const dt=Math.min(.25,(now-frT)/1000);frT=now;
  const live=pullData();
  computeBars(bars,N,40,16000,live);computeBars(miniB,19,50,16000,live);
  for(let i=0;i<N;i++){if(bars[i]>=peaks[i]){peaks[i]=bars[i];pv[i]=0}else{pv[i]+=.0009;peaks[i]=Math.max(0,peaks[i]-pv[i])}}
  for(let i=0;i<19;i++)miniP[i]=Math.max(miniB[i],miniP[i]-.012);
  for(let i=0;i<11;i++){let v=0;if(live){if(i===0){let s=0;for(let k=0;k<W.length;k+=2){const d=(W[k]-128)/128;s+=d*d}v=Math.min(1,Math.sqrt(s/(W.length/2))*2.6)}else{const f=BANDS[i-1];v=Math.pow(band(f/1.3,f*1.3),1.25)*1.08}}eqLv[i]=Math.max(v,eqLv[i]*.88)}
  drawVis(live);drawMini();drawEqLed();drawGps();
  let d=0,t=0,has=false;
  if((rdPlaying||rdSel())&&rdCur)rdLcd();
  else if(mode==='ext'){has=!!ext.title;d=(ext.dur||0)/1000;t=extPos()}
  else if(natL()&&cur>=0){has=true;d=(nat.dur||0)/1000||list[cur].duration||0;t=natPos()}
  else if(cur>=0){has=true;d=audio.duration||list[cur].duration||0;t=audio.currentTime}
  if((rdPlaying||rdSel())&&rdCur){}
  else if(has){$('#time').textContent=showRemain&&d?'-'+lcdFmt(d-t):lcdFmt(t);
    if(!seeking){seek.value=d?t/d*1000:0;setP(seek);$('#tCur').textContent=fmt(t);$('#tDur').textContent=fmt(d)}}
  else{$('#time').textContent='00:00';if(!seeking){seek.value=0;setP(seek)}$('#tCur').textContent='0:00';$('#tDur').textContent='0:00'}
  if(driveOn)driveUi();
  idle+=busy?dt:.016;
}
// 누르거나 바꾸면 바로 다시 그림(쉬는 중에도 반응이 늦지 않게)
for(const ev of ['pointerdown','pointerup','keydown','change','input','click'])addEventListener(ev,()=>{frT=0},true);
function drawVis(live){
  const c=cv.vis,g=cx.vis,w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  if(mode==='ext'&&ext.notif!==undefined&&!ext.mic){
    g.fillStyle=C.dim;g.font=`${14*d}px "Noto Sans KR",sans-serif`;g.textAlign='center';
    g.fillText('사운드 시각화를 보려면 외부 앱 창에서 [허용]을 누르세요',w/2,h/2);return;
  }
  if(visMode===2){
    g.strokeStyle=C.grid;g.lineWidth=1;for(let i=1;i<8;i++){g.beginPath();g.moveTo(i*w/8,0);g.lineTo(i*w/8,h);g.stroke()}for(let i=1;i<4;i++){g.beginPath();g.moveTo(0,i*h/4);g.lineTo(w,i*h/4);g.stroke()}
    g.lineWidth=2.2*d;g.strokeStyle=C.l3;g.shadowColor=C.text;g.shadowBlur=12*d;g.beginPath();
    const L=live?W.length:256;for(let i=0;i<L;i+=2){const x=i/L*w;const v=live?(W[i]-128)/128:Math.sin(i/14+idle*3)*.04;const y=h/2+v*h*.45;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();g.shadowBlur=0;return;
  }

  if(visMode>=3){drawVisFx(g,w,h,d,live);return}
  const cols=w/d>1100?72:N;
  const pad=10*d,gap=Math.max(2,3*d),bw=(w-pad*2-gap*(cols-1))/cols,segH=Math.max(2,4*d),sg=Math.max(1,2*d);
  const val=i=>{const p=i/(cols-1)*(N-1),a=Math.floor(p),b=Math.min(N-1,a+1),f=p-a;return[bars[a]*(1-f)+bars[b]*f,peaks[a]*(1-f)+peaks[b]*f]};
  if(visMode===0){
    for(let i=0;i<cols;i++){const[v,p]=val(i);ledColumn(g,pad+i*(bw+gap),bw,h-pad,h-pad*2,v,segH,sg,p,C.off)}
  }else{
    const mid=h*.62;
    for(let i=0;i<cols;i++){const[v,p]=val(i);ledColumn(g,pad+i*(bw+gap),bw,mid,mid-pad,v,segH,sg,p,C.off)}
    g.save();g.globalAlpha=.28;g.translate(0,mid*2+sg);g.scale(1,-1);
    for(let i=0;i<cols;i++){const[v]=val(i);ledColumn(g,pad+i*(bw+gap),bw,mid,(h-mid)-pad/2,v*(mid-pad)/((h-mid)-pad/2)*.6,segH,sg,null,null)}
    g.restore();
  }
}

/* 시각화 효과 3~9: AREA · RING · RADAR · WAVES · DOTS · PULSE · VU METER (색은 스킨 팔레트) */
const vfx={rad:0,blips:[],pulse:[],vuL:0,vuR:0,lastBass:0};
function visLevel(lo,hi){let s=0,n=0;for(let i=Math.floor(lo*N);i<Math.ceil(hi*N);i++){s+=bars[i]||0;n++}return n?s/n:0}
function drawVisFx(g,w,h,d,live){
  const t=performance.now()/1000,cx=w/2,cy=h/2,L1=C.l1,L2=C.l2,L3=C.l3,L4=C.l4;
  const wv=i=>live&&W?(W[Math.floor(i)%W.length]-128)/128:Math.sin(i/14+idle*3)*.05;
  if(visMode===3){ // AREA: 부드러운 스펙트럼 곡선 + 그라디언트 면
    const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,L1);gr.addColorStop(.55,L3);gr.addColorStop(1,L4);
    g.beginPath();g.moveTo(0,h);for(let i=0;i<=N;i++){const v=bars[Math.min(N-1,i)];const x=i/N*w,y=h-v*h*.9-2*d;if(i===0)g.lineTo(x,y);else{const px=(i-.5)/N*w;g.quadraticCurveTo(px,h-bars[i-1]*h*.9-2*d,x,y)}}
    g.lineTo(w,h);g.closePath();g.globalAlpha=.55;g.fillStyle=gr;g.fill();g.globalAlpha=1;g.lineWidth=2*d;g.strokeStyle=L4;g.shadowColor=C.glow;g.shadowBlur=10*d;g.stroke();g.shadowBlur=0;return}
  if(visMode===4){ // RING: 원형 스펙트럼
    const r0=Math.min(w,h)*.22,rM=Math.min(w,h)*.26;g.lineCap='round';
    for(let i=0;i<N*2;i++){const k=i<N?i:N*2-1-i,v=bars[k],a=i/(N*2)*Math.PI*2-Math.PI/2+t*.15,r1=r0,r2=r0+4*d+v*rM;
      g.strokeStyle=v>.75?L4:v>.5?L3:v>.25?L2:L1;g.lineWidth=Math.max(2*d,Math.PI*2*r0/(N*2)*.55);g.beginPath();g.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);g.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);g.stroke()}
    const b=visLevel(0,.12);g.fillStyle=C.grid;g.beginPath();g.arc(cx,cy,r0*.85,0,7);g.fill();g.strokeStyle=L3;g.lineWidth=2*d;g.globalAlpha=.4+b*.6;g.beginPath();g.arc(cx,cy,r0*(.55+b*.3),0,7);g.stroke();g.globalAlpha=1;g.lineCap='butt';return}
  if(visMode===5){ // RADAR: 회전하는 레이더, 음량이 큰 대역이 점으로 남음
    const R=Math.min(w,h)*.46;vfx.rad=(vfx.rad+.035)%(Math.PI*2);
    g.strokeStyle=C.grid;g.lineWidth=1*d;for(let k=1;k<=4;k++){g.beginPath();g.arc(cx,cy,R*k/4,0,7);g.stroke()}g.beginPath();g.moveTo(cx-R,cy);g.lineTo(cx+R,cy);g.moveTo(cx,cy-R);g.lineTo(cx,cy+R);g.stroke();
    for(let k=0;k<26;k++){const a=vfx.rad-k*.03;g.globalAlpha=(1-k/26)*.35;g.strokeStyle=L3;g.lineWidth=3*d;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);g.stroke()}g.globalAlpha=1;
    if(Math.random()<.5){const i=Math.floor(Math.random()*N);if(bars[i]>.25)vfx.blips.push({a:vfx.rad,r:(1-i/N)*R*.95,life:1,v:bars[i]})}
    vfx.blips=vfx.blips.filter(b=>(b.life-=.012)>0);for(const b of vfx.blips){g.globalAlpha=b.life;g.fillStyle=b.v>.6?L4:L3;g.shadowColor=L3;g.shadowBlur=8*d;g.beginPath();g.arc(cx+Math.cos(b.a)*b.r,cy+Math.sin(b.a)*b.r,(2+b.v*4)*d,0,7);g.fill()}
    g.shadowBlur=0;g.globalAlpha=1;return}
  if(visMode===6){ // WAVES: 겹친 파형 세 줄
    const cols=[L1,L2,L3];for(let k=0;k<3;k++){g.beginPath();g.lineWidth=(1.5+k*.6)*d;g.strokeStyle=cols[k];g.globalAlpha=.45+k*.25;const off=k*37,amp=h*(.16+k*.08);
      for(let x=0;x<=w;x+=3*d){const i=x/w*512+off,y=cy+(k-1)*h*.12+wv(i)*amp*2.2+Math.sin(x/w*6+t*(1+k*.4))*h*.03;x?g.lineTo(x,y):g.moveTo(x,y)}g.stroke()}g.globalAlpha=1;return}
  if(visMode===7){ // DOTS: 점 매트릭스
    const cols=Math.max(16,Math.floor(w/(14*d))),rows=Math.max(6,Math.floor(h/(14*d))),sx=w/cols,sy=h/rows;
    for(let c=0;c<cols;c++){const v=bars[Math.floor(c/cols*N)];const lit=Math.round(v*rows);for(let r=0;r<rows;r++){const on=rows-1-r<lit,y=(r+.5)*sy,x=(c+.5)*sx,q=1-r/rows;
      g.fillStyle=on?(q>.8?L4:q>.55?L3:q>.3?L2:L1):C.off;g.beginPath();g.arc(x,y,Math.min(sx,sy)*(on?.34:.22),0,7);g.fill()}}return}
  if(visMode===8){ // PULSE: 저음에 맞춰 퍼지는 동심원
    const b=visLevel(0,.1);if(b>.45&&b-vfx.lastBass>.06||Math.random()<.02)vfx.pulse.push({r:0,a:1,c:b>.7?L4:L3});vfx.lastBass=b;
    const R=Math.hypot(w,h)/2;vfx.pulse=vfx.pulse.filter(p=>(p.r+=R*.012*(1+b),p.a-=.012)>0&&p.r<R);
    for(const p of vfx.pulse){g.globalAlpha=p.a;g.strokeStyle=p.c;g.lineWidth=(2+p.a*4)*d;g.beginPath();g.arc(cx,cy,p.r,0,7);g.stroke()}
    g.globalAlpha=1;const gr=g.createRadialGradient(cx,cy,0,cx,cy,Math.min(w,h)*.3);gr.addColorStop(0,L4);gr.addColorStop(.4,L3);gr.addColorStop(1,'transparent');g.globalAlpha=.25+b*.6;g.fillStyle=gr;g.beginPath();g.arc(cx,cy,Math.min(w,h)*(.12+b*.18),0,7);g.fill();g.globalAlpha=1;return}
  if(visMode>=20){drawVisFx3(g,w,h,d,live,t,wv);return}
  if(visMode>=10){drawVisFx2(g,w,h,d,live,t,wv);return}
  // 9. VU METER: 좌우 아날로그 바늘
  let l=0,r=0;if(live&&W){for(let i=0;i<W.length;i++){const v=Math.abs(W[i]-128)/128;if(i%2)r+=v*v;else l+=v*v}l=Math.min(1,Math.sqrt(l/(W.length/2))*3.2);r=Math.min(1,Math.sqrt(r/(W.length/2))*3.2)}
  vfx.vuL+=(l-vfx.vuL)*(l>vfx.vuL?.35:.08);vfx.vuR+=(r-vfx.vuR)*(r>vfx.vuR?.35:.08);
  const mw=Math.min(w/2-16*d,h*1.5),mh=mw*.62;
  [[w/4,'L',vfx.vuL],[w*3/4,'R',vfx.vuR]].forEach(([mx,lab,v])=>{const x0=mx-mw/2,y0=cy-mh/2;g.fillStyle=C.grid;g.strokeStyle=C.edge;g.lineWidth=2*d;g.beginPath();g.roundRect?g.roundRect(x0,y0,mw,mh,6*d):g.rect(x0,y0,mw,mh);g.fill();g.stroke();
    const px=mx,py=y0+mh*.95,R=mh*.78,A0=-Math.PI*.78,A1=-Math.PI*.22;
    for(let k=0;k<=10;k++){const a=A0+(A1-A0)*k/10;g.strokeStyle=k>=8?C.l4:C.fg;g.lineWidth=(k%5?1:2)*d;g.beginPath();g.moveTo(px+Math.cos(a)*R*.86,py+Math.sin(a)*R*.86);g.lineTo(px+Math.cos(a)*R,py+Math.sin(a)*R);g.stroke()}
    g.strokeStyle=C.peak;g.lineWidth=3*d;g.beginPath();g.arc(px,py,R*.93,A0+(A1-A0)*.8,A1);g.stroke();
    const a=A0+(A1-A0)*v;g.strokeStyle=L4;g.lineWidth=2*d;g.shadowColor=L3;g.shadowBlur=6*d;g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(a)*R*.95,py+Math.sin(a)*R*.95);g.stroke();g.shadowBlur=0;
    g.fillStyle=C.fg;g.font=`600 ${Math.max(10,mh*.13)}px ${RJ}`;g.textAlign='left';g.textBaseline='top';g.fillText('VU · '+lab,x0+10*d,y0+8*d)})
}
/* 시각화 효과 10~19 */
const vfx2={stars:[],hist:[],ecg:[],ecgX:0,lastB:0,beat:0};
function drawVisFx2(g,w,h,d,live,t,wv){
  const cx=w/2,cy=h/2,L1=C.l1,L2=C.l2,L3=C.l3,L4=C.l4,lv=visLevel(0,1),bass=visLevel(0,.12),col=v=>v>.75?L4:v>.5?L3:v>.25?L2:L1;
  if(visMode===10){ // CITY: 막대가 빌딩, 창문 불빛이 소리에 맞춰 켜짐
    const n=Math.max(14,Math.floor(w/(26*d))),bw=w/n;g.fillStyle=C.grid;g.fillRect(0,h-3*d,w,3*d);
    for(let i=0;i<n;i++){const k=Math.floor(i/n*N),base=.18+((i*37)%11)/30,v=Math.max(base,bars[k]),bh=v*h*.9,x=i*bw+1*d,y=h-3*d-bh;
      g.fillStyle=C.off;g.fillRect(x,y,bw-2*d,bh);g.strokeStyle=C.edge;g.lineWidth=1;g.strokeRect(x,y,bw-2*d,bh);
      const rows=Math.floor(bh/(9*d)),lit=Math.round(bars[k]*rows);for(let r=0;r<rows;r++)for(let c=0;c<2;c++){g.fillStyle=r<lit?col(r/rows):(((i+r+c)%5)?'transparent':L1);g.fillRect(x+3*d+c*(bw-2*d)/2.2,h-3*d-(r+1)*9*d+3*d,Math.max(2,(bw-2*d)/3.2),4*d)}}
    g.fillStyle=L4;g.globalAlpha=.8;g.beginPath();g.arc(w*.86,h*.18,Math.min(w,h)*.06*(1+bass*.4),0,7);g.fill();g.globalAlpha=1;return}
  if(visMode===11){ // FLAME: 아래에서 위로 타오르는 불꽃 기둥
    const n=Math.max(20,Math.floor(w/(10*d))),bw=w/n;
    for(let i=0;i<n;i++){const k=Math.floor(i/n*N),v=Math.max(.12+Math.sin(t*6+i)*.05,bars[k]),fh=v*h*.95,x=i*bw;
      const gr=g.createLinearGradient(0,h,0,h-fh);gr.addColorStop(0,L4);gr.addColorStop(.35,L3);gr.addColorStop(.7,L2);gr.addColorStop(1,'transparent');g.fillStyle=gr;
      g.beginPath();g.moveTo(x,h);g.quadraticCurveTo(x+bw*.1,h-fh*.6,x+bw/2+Math.sin(t*9+i*1.7)*bw*.6,h-fh);g.quadraticCurveTo(x+bw*.9,h-fh*.6,x+bw,h);g.fill()}return}
  if(visMode===12){ // STARS: 가운데서 날아오는 별, 소리가 크면 빨라짐
    while(vfx2.stars.length<160)vfx2.stars.push({x:(Math.random()-.5)*2,y:(Math.random()-.5)*2,z:Math.random()*1+.05});
    const sp=.006+lv*.05+bass*.03;g.fillStyle=C.off;g.globalAlpha=.25;g.fillRect(0,0,w,h);g.globalAlpha=1;
    for(const st of vfx2.stars){const pz=st.z;st.z-=sp;if(st.z<=.02){st.x=(Math.random()-.5)*2;st.y=(Math.random()-.5)*2;st.z=1;continue}
      const sx=cx+st.x/st.z*w*.25,sy=cy+st.y/st.z*h*.25,px=cx+st.x/pz*w*.25,py=cy+st.y/pz*h*.25;g.strokeStyle=col(1-st.z);g.lineWidth=(1.2+(1-st.z)*2.4)*d;g.beginPath();g.moveTo(px,py);g.lineTo(sx,sy);g.stroke()}
    g.fillStyle=L3;g.beginPath();g.arc(cx,cy,(2+bass*6)*d,0,7);g.fill();return}
  if(visMode===13){ // SPIRAL: 스펙트럼이 회전하는 나선
    const R=Math.min(w,h)*.48;g.lineCap='round';
    for(let i=0;i<N*3;i++){const k=i%N,v=bars[k],a=i*.21+t*.6,r=R*(i/(N*3))*.9+4*d;g.fillStyle=col(v);g.globalAlpha=.35+v*.65;g.beginPath();g.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.8,(1.5+v*5)*d,0,7);g.fill()}
    g.globalAlpha=1;g.lineCap='butt';return}
  if(visMode===14){ // WATERFALL: 시간에 따라 흘러내리는 스펙트럼(위가 지금)
    const n=Math.max(24,Math.floor(w/(8*d)));const row=[];for(let i=0;i<n;i++)row.push(bars[Math.floor(i/n*N)]||0);vfx2.hist.unshift(row);
    const rows=Math.max(10,Math.floor(h/(5*d)));if(vfx2.hist.length>rows)vfx2.hist.length=rows;const cw=w/n,rh=h/rows;
    for(let r=0;r<rows;r++){const R=vfx2.hist[r];for(let i=0;i<n;i++){const v=R?R[i]:0;g.fillStyle=v>.06?col(v):C.off;g.globalAlpha=R?Math.max(.15,1-r/rows):.3;g.fillRect(i*cw,r*rh,cw-1,rh-1)}}g.globalAlpha=1;return}
  if(visMode===15){ // TUNNEL: 저음에 맞춰 다가오는 사각 터널
    const k=12,ph=(t*(.4+bass*1.6))%1;g.lineWidth=2*d;
    for(let i=k;i>=0;i--){const z=(i+1-ph)/k,s=Math.pow(1-z,2)*.98+.02,ww=w*s,hh=h*s,v=bars[Math.floor((i/k)*(N-1))];g.strokeStyle=col(Math.max(v,1-z));g.globalAlpha=Math.min(1,.2+(1-z));
      g.strokeRect(cx-ww/2,cy-hh/2,ww,hh)}
    g.globalAlpha=1;g.strokeStyle=C.grid;g.lineWidth=1*d;for(const [a,b] of [[0,0],[w,0],[0,h],[w,h]]){g.beginPath();g.moveTo(cx,cy);g.lineTo(a,b);g.stroke()}return}
  if(visMode===16){ // FLOWER: 꽃잎처럼 피는 방사형 스펙트럼
    const R=Math.min(w,h)*.46,pet=8;for(let L=3;L>=1;L--){g.beginPath();for(let i=0;i<=360;i+=3){const a=i*Math.PI/180+t*.2*L,k=Math.floor((i%(360/pet))/(360/pet)*N),v=bars[k]||0,r=R*(.18+.22*L/3+v*.45*L/3)*(1+.12*Math.sin(a*pet));
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y)}g.closePath();g.globalAlpha=.25+L*.18;g.fillStyle=[L1,L2,L3][L-1];g.fill();g.globalAlpha=1;g.strokeStyle=L4;g.lineWidth=1*d;g.stroke()}
    g.fillStyle=L4;g.beginPath();g.arc(cx,cy,R*(.06+bass*.08),0,7);g.fill();return}
  if(visMode===17){ // BLOCKS 3D: 비스듬히 본 입체 막대
    const n=16,bw=w/(n+3),dep=bw*.45;for(let i=0;i<n;i++){const v=Math.max(.04,bars[Math.floor(i/n*N)]),bh=v*h*.78,x=bw*(i+1),y=h-8*d-bh;
      g.fillStyle=col(v);g.globalAlpha=.95;g.fillRect(x,y,bw*.8,bh);g.globalAlpha=.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+dep,y-dep);g.lineTo(x+bw*.8+dep,y-dep);g.lineTo(x+bw*.8,y);g.fill();
      g.globalAlpha=.35;g.beginPath();g.moveTo(x+bw*.8,y);g.lineTo(x+bw*.8+dep,y-dep);g.lineTo(x+bw*.8+dep,h-8*d-dep);g.lineTo(x+bw*.8,h-8*d);g.fill()}
    g.globalAlpha=1;g.strokeStyle=C.edge;g.lineWidth=1*d;g.beginPath();g.moveTo(0,h-8*d);g.lineTo(w,h-8*d);g.stroke();return}
  if(visMode===18){ // LISSAJOUS: 좌우 채널 X-Y 스코프
    g.strokeStyle=C.grid;g.lineWidth=1*d;g.beginPath();g.moveTo(cx,0);g.lineTo(cx,h);g.moveTo(0,cy);g.lineTo(w,cy);g.stroke();
    const R=Math.min(w,h)*.44;g.strokeStyle=L3;g.shadowColor=L4;g.shadowBlur=10*d;g.lineWidth=1.6*d;g.beginPath();
    for(let i=0;i<256;i++){let x,y;if(live&&W){x=(W[(i*2)%W.length]-128)/128;y=(W[(i*2+1)%W.length]-128)/128}else{const a=i/256*Math.PI*2;x=Math.sin(a*3+t)*.6;y=Math.sin(a*2)*.6}
      const px=cx+x*R*1.4,py=cy+y*R;i?g.lineTo(px,py):g.moveTo(px,py)}g.stroke();g.shadowBlur=0;return}
  // 19. ECG: 심전도처럼 흐르는 박동선, 저음이 들어오면 큰 파형
  const step=3*d;if(bass-vfx2.lastB>.08&&bass>.3)vfx2.beat=1;vfx2.lastB=bass;
  for(let k=0;k<2;k++){vfx2.ecgX=(vfx2.ecgX+step)%w;const b=vfx2.beat,ph=1-b;let y=cy+Math.sin(t*2+vfx2.ecgX/40)*2*d;
    if(b>0){y=cy-Math.sin(ph*Math.PI*3)*(h*.38)*b;vfx2.beat=Math.max(0,b-.08)}else if(Math.random()<.004)vfx2.beat=.6;vfx2.ecg[Math.floor(vfx2.ecgX/step)]=y}
  g.strokeStyle=C.grid;g.lineWidth=1;for(let x=0;x<w;x+=20*d){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let y=0;y<h;y+=20*d){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
  g.strokeStyle=L4;g.shadowColor=L3;g.shadowBlur=8*d;g.lineWidth=2*d;g.beginPath();let first=true;const head=Math.floor(vfx2.ecgX/step);
  for(let i=0;i<Math.ceil(w/step);i++){if(Math.abs(i-head)<4){first=true;continue}const y=vfx2.ecg[i];if(y==null){first=true;continue}const x=i*step;first?g.moveTo(x,y):g.lineTo(x,y);first=false}
  g.stroke();g.shadowBlur=0}
/* 시각화 효과 20~29 */
const vfx3={rain:[],balls:[],fw:[],lastB:0};
function drawVisFx3(g,w,h,d,live,t,wv){
  const cx=w/2,cy=h/2,L1=C.l1,L2=C.l2,L3=C.l3,L4=C.l4,lv=visLevel(0,1),bass=visLevel(0,.12),col=v=>v>.75?L4:v>.5?L3:v>.25?L2:L1,R=Math.min(w,h);
  if(visMode===20){ // PLASMA: 소리에 따라 커지는 빛 덩어리
    g.globalCompositeOperation='lighter';for(let k=0;k<6;k++){const v=visLevel(k/6,(k+1)/6),x=cx+Math.sin(t*(.5+k*.13)+k*2)*w*.32,y=cy+Math.cos(t*(.4+k*.11)+k)*h*.3,r=R*(.18+v*.35+.04*Math.sin(t*2+k));
      const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,[L4,L3,L2,L3,L4,L2][k]);gr.addColorStop(1,'transparent');g.globalAlpha=.35+v*.4;g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
    g.globalCompositeOperation='source-over';g.globalAlpha=1;return}
  if(visMode===21){ // HELIX: 두 가닥 나선, 가로대 길이가 소리
    const n=Math.max(24,Math.floor(w/(14*d)));for(let i=0;i<n;i++){const x=(i+.5)/n*w,ph=i*.42+t*2,a=Math.sin(ph),b=Math.sin(ph+Math.PI),v=bars[Math.floor(i/n*N)]||0,amp=h*(.18+v*.22);
      g.strokeStyle=col(v);g.globalAlpha=.35+v*.6;g.lineWidth=1.5*d;g.beginPath();g.moveTo(x,cy+a*amp);g.lineTo(x,cy+b*amp);g.stroke();g.globalAlpha=1;
      g.fillStyle=a>0?L4:L2;g.beginPath();g.arc(x,cy+a*amp,(2+Math.abs(Math.cos(ph))*2)*d,0,7);g.fill();g.fillStyle=b>0?L3:L1;g.beginPath();g.arc(x,cy+b*amp,(2+Math.abs(Math.cos(ph))*2)*d,0,7);g.fill()}return}
  if(visMode===22){ // CODE RAIN: 떨어지는 숫자 줄기
    const cw=12*d,cols=Math.floor(w/cw);while(vfx3.rain.length<cols)vfx3.rain.push({y:Math.random()*h,s:.6+Math.random()});g.font=`600 ${11*d}px "Share Tech Mono",monospace`;g.textAlign='center';
    for(let i=0;i<cols;i++){const r=vfx3.rain[i],v=bars[Math.floor(i/cols*N)]||0;r.y+=(1.6+v*7+lv*3)*d*r.s;if(r.y>h+60*d){r.y=-Math.random()*h*.5;r.s=.6+Math.random()}
      for(let k=0;k<8;k++){const y=r.y-k*13*d;if(y<0||y>h)continue;g.globalAlpha=(1-k/8)*(.35+v*.65);g.fillStyle=k===0?L4:col(v*.8+.1);g.fillText(String.fromCharCode(48+((i*7+k*3+Math.floor(t*6))%42)),i*cw+cw/2,y)}}
    g.globalAlpha=1;return}
  if(visMode===23){ // SUNBURST: 회전하는 빛살
    const n=36,r0=R*.1;g.save();g.translate(cx,cy);g.rotate(t*.25);for(let i=0;i<n;i++){const v=bars[Math.floor(i/n*N)]||0,a=i/n*Math.PI*2,r1=r0+R*(.12+v*.42);g.fillStyle=col(v);g.globalAlpha=.4+v*.6;
      g.beginPath();g.moveTo(Math.cos(a-.05)*r0,Math.sin(a-.05)*r0);g.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);g.lineTo(Math.cos(a+.05)*r0,Math.sin(a+.05)*r0);g.fill()}g.restore();g.globalAlpha=1;
    g.fillStyle=L4;g.beginPath();g.arc(cx,cy,r0*(.8+bass*.5),0,7);g.fill();return}
  if(visMode===24){ // MOUNTAINS: 겹겹이 산등성이
    for(let L=0;L<4;L++){const base=h*(.45+L*.15),ofs=t*(8+L*10)*d;g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=6*d){const k=Math.floor(((x+ofs)/w*N*1.5)%N),v=bars[Math.abs(k)]||0;
        g.lineTo(x,base-(Math.sin((x+ofs)/(60*d)+L)*.5+.5)*h*.12-v*h*(.3-L*.05))}g.lineTo(w,h);g.closePath();g.fillStyle=[L1,L2,L3,L4][3-L];g.globalAlpha=.35+L*.18;g.fill()}g.globalAlpha=1;return}
  if(visMode===25){ // KALEIDO: 거울 조각 8개
    g.save();g.translate(cx,cy);for(let k=0;k<8;k++){g.save();g.rotate(k*Math.PI/4+t*.15);if(k%2)g.scale(1,-1);
      for(let i=0;i<12;i++){const v=bars[Math.floor(i/12*N)]||0,rr=R*(.08+i*.035),a=.2+Math.sin(t+i)*.1;g.fillStyle=col(v);g.globalAlpha=.25+v*.6;g.beginPath();g.arc(Math.cos(a)*rr,Math.sin(a)*rr,(2+v*8)*d,0,7);g.fill()}g.restore()}
    g.restore();g.globalAlpha=1;return}
  if(visMode===26){ // BOUNCE: 대역마다 공이 튀어 오름
    const n=12;while(vfx3.balls.length<n)vfx3.balls.push({y:0,v:0});const bw=w/n,fl=h-6*d;g.fillStyle=C.grid;g.fillRect(0,fl,w,2*d);
    for(let i=0;i<n;i++){const b=vfx3.balls[i],e=visLevel(i/n,(i+1)/n);if(b.y<=0&&(e>.3||Math.random()<.01))b.v=(6+e*16+Math.random()*2)*d;b.v-=.55*d;b.y=Math.max(0,b.y+b.v);if(b.y===0)b.v=0;
      const x=(i+.5)*bw,r=Math.min(bw*.3,14*d);g.fillStyle=col(Math.min(1,b.y/(h*.6)+e*.4));g.beginPath();g.arc(x,fl-r-b.y,r,0,7);g.fill();g.globalAlpha=.25;g.beginPath();g.ellipse(x,fl,r*(1-Math.min(.7,b.y/h)),r*.25,0,0,7);g.fill();g.globalAlpha=1}return}
  if(visMode===27){ // GRID WARP: 파형으로 일렁이는 격자
    g.strokeStyle=L2;g.lineWidth=1*d;const st=22*d;for(let y=st/2;y<h;y+=st){g.beginPath();for(let x=0;x<=w;x+=8*d){const yy=y+wv(x/w*512+y)*h*.18+Math.sin(x/(50*d)+t*2+y)*3*d;x?g.lineTo(x,yy):g.moveTo(x,yy)}g.globalAlpha=.6;g.stroke()}
    g.strokeStyle=L3;for(let x=st/2;x<w;x+=st){g.beginPath();for(let y=0;y<=h;y+=8*d){const xx=x+wv(y/h*512+x)*w*.06+Math.cos(y/(50*d)+t*2)*3*d;y?g.lineTo(xx,y):g.moveTo(xx,y)}g.globalAlpha=.45;g.stroke()}g.globalAlpha=1;return}
  if(visMode===28){ // FIREWORKS: 저음이 들어오면 터짐
    if((bass-vfx3.lastB>.08&&bass>.3)||Math.random()<.025){const x=w*(.15+Math.random()*.7),y=h*(.15+Math.random()*.45),c0=[L2,L3,L4][Math.floor(Math.random()*3)];for(let k=0;k<36;k++){const a=k/36*Math.PI*2,sp=(1.5+Math.random()*2.5)*d*(1+bass);vfx3.fw.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:1,c:c0})}}
    vfx3.lastB=bass;vfx3.fw=vfx3.fw.filter(p=>(p.l-=.016)>0).slice(-700);for(const p of vfx3.fw){p.x+=p.vx;p.y+=p.vy;p.vy+=.04*d;p.vx*=.985;g.globalAlpha=p.l;g.fillStyle=p.c;g.fillRect(p.x,p.y,2.2*d,2.2*d)}g.globalAlpha=1;return}
  // 29. ORBIT: 대역마다 행성이 다른 궤도를 돎
  g.fillStyle=L4;g.beginPath();g.arc(cx,cy,R*(.05+bass*.06),0,7);g.fill();
  for(let i=0;i<8;i++){const v=visLevel(i/8,(i+1)/8),rr=R*(.1+i*.05),a=t*(1.2-i*.12)+i;g.strokeStyle=C.grid;g.lineWidth=1;g.beginPath();g.ellipse(cx,cy,rr*1.4,rr*.9,0,0,7);g.stroke();
    g.fillStyle=col(v);g.beginPath();g.arc(cx+Math.cos(a)*rr*1.4,cy+Math.sin(a)*rr*.9,(2.5+v*7)*d,0,7);g.fill()}}
function drawMini(){
  const c=cv.mini,g=cx.mini,w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  const n=19,gap=Math.max(1,2*d),bw=(w-gap*(n-1))/n;
  for(let i=0;i<n;i++)ledColumn(g,i*(bw+gap),bw,h,h,miniB[i],Math.max(2,2*d),Math.max(1,1*d),miniP[i],C.off);
}
function drawEqLed(){
  const c=cv.eqled,g=cx.eqled,w=c.width,h=c.height,d=Math.min(devicePixelRatio||1,2);g.clearRect(0,0,w,h);
  const cw=w/11,bw=Math.min(cw*.32,14*d);
  for(let i=0;i<11;i++){const x=i*cw+cw/2-bw/2;ledColumn(g,x,bw,h-4*d,h-8*d,eqLv[i],Math.max(3,5*d),Math.max(1,2*d),null,C.off)}
  g.fillStyle=C.edge;g.fillRect(cw*.12,h/2,w-cw*.24,1);
}
const VIS_N=30;if(!(visMode>=0&&visMode<VIS_N))visMode=0;
const syncVis=()=>{$('#visSel').value=String(visMode)};
const setVis=m=>{visMode=((m%VIS_N)+VIS_N)%VIS_N;store.set('vis',visMode);syncVis()};
$('#visSel').onchange=e=>setVis(+e.target.value);$('#visSel').onclick=e=>e.stopPropagation();
document.querySelectorAll('.vmode .vstep').forEach(b=>b.onclick=e=>{e.stopPropagation();setVis(visMode+ +b.dataset.d)});
cv.vis.onclick=()=>setVis(visMode+1);

