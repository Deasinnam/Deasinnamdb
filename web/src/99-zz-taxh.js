// 1.89 택시 미터기 '실물 전자식' 스킨의 달리는 말 — 초록 도트 윤곽선, 갤럽 한 주기를 연속 자세로 계산
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 그리는 법: 작은 격자(가로 약 80점) 마스크 두 장에 몸·머리·꼬리·가까운 다리(밝게)와 먼 다리(한 톤 어둡게)를 칠한 뒤,
 * 가장자리 점만 초록 도트로 찍음. 말 위치와 바닥선은 고정, 몸통만 보폭에 맞춰 조금 오르내림.
 * 갤럽(가로질러 달리기) 발 순서: 먼 뒷발 → 가까운 뒷발 → 먼 앞발 → 가까운 앞발 → 네 발이 몸 아래로 모이는 공중 구간 → 다시 먼 뒷발.
 * 모든 움직임이 위상(0~1)의 주기 함수라 마지막 자세에서 첫 자세로 넘어갈 때 튀지 않음.
 * 속도는 애니메이션용으로만 부드럽게 보정(요금 계산과 무관): 평균 내고, 출발은 시속 5km 넘게 1초, 정차는 시속 2.5km 밑으로 1초 있어야 바뀜. */
function TaxiHorse(cv,opt){opt=opt||{};   // opt.style: 'dots'(실물 전자식, 초록 도트 윤곽) · 'fill'(레트로, 크림색 실루엣)
  const G=62;                                   // 바닥선(말 좌표, 가로 0~100 · 세로 0~66)
  const LEGS=[                                   // 뿌리(어깨·엉덩이), 마디 길이, 무릎 굽는 방향, 위상 차, 가까운 다리 여부
    {k:'hf',root:[31,31],a:15,b:15,bend:-1,off:0.00,near:false,reach:11,lift:9, x0:3},   // 먼 뒷다리(먼저 착지)
    {k:'hn',root:[34,32],a:15,b:15,bend:-1,off:0.08,near:true, reach:11,lift:9, x0:4},   // 가까운 뒷다리
    {k:'ff',root:[64,33],a:14,b:15,bend: 1,off:0.30,near:false,reach:12,lift:15,x0:2},   // 먼 앞다리
    {k:'fn',root:[67,34],a:14,b:15,bend: 1,off:0.40,near:true, reach:12,lift:15,x0:3}];  // 가까운 앞다리(마지막에 떨어짐)
  const D=0.30,PAST=5;                         // 디딤 비율, 발목~발굽 길이
  const TAU=Math.PI*2,sm=t=>t*t*(3-2*t),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  let ctx=cv.getContext('2d'),mk=document.createElement('canvas'),mf=document.createElement('canvas'),gw=80,gh=53;
  const st={phase:0,amp:0,vs:0,moving:false,since:0,run:false,raf:0,last:0,fixed:null};
  // 발 목표점(발목) 계산: 디딤 구간엔 바닥에서 뒤로 밀리고, 뜬 구간엔 접혔다가 앞으로 뻗음
  function foot(L,ph,amp){
    const u=((ph-L.off)%1+1)%1,x0=L.root[0]+L.x0,r=L.reach*amp;
    if(u<D){const t=u/D;return {x:x0+r*(1-2*t),y:G-PAST*0.8,pa:0.62-0.5*t,down:true}}
    const t=(u-D)/(1-D),e=sm(t),fold=Math.sin(Math.PI*Math.min(1,t*1.15));
    return {x:x0-r+2*r*e-(L.bend>0?5*amp*Math.sin(Math.PI*t)*(1-t):0),y:G-PAST*0.8-L.lift*amp*fold,pa:0.12+(L.bend>0?1.6:0.9)*amp*fold*(1-t*0.35),down:false}}
  // 두 마디 역기구학(무릎 방향 고정)
  function ik(R,T,a,b,bend){
    let dx=T.x-R[0],dy=T.y-R[1],d=Math.hypot(dx,dy);const dm=Math.min(d,a+b-0.01);if(d>dm){dx*=dm/d;dy*=dm/d;d=dm}
    const c=cl((a*a+d*d-b*b)/(2*a*d),-1,1),base=Math.atan2(dy,dx),ang=base-bend*Math.acos(c);
    const K=[R[0]+a*Math.cos(ang),R[1]+a*Math.sin(ang)];return {K,F:[R[0]+dx,R[1]+dy]}}
  function pose(ph,amp){
    const bob=-amp*1.9*Math.cos(TAU*(ph-0.85)),pitch=amp*0.05*Math.sin(TAU*(ph-0.2));
    const lag=(o,k)=>Math.sin(TAU*(ph-0.85-o))*amp*k;
    return {bob,pitch,neck:-0.95+lag(0.07,0.14),head:1.55+lag(0.10,0.10),tail:0.75+lag(0.13,0.3),
      legs:LEGS.map(L=>{const R=[L.root[0],L.root[1]+bob+(L.root[0]-50)*pitch*0.5],f=foot(L,ph,amp),j=ik(R,f,L.a,L.b,L.bend);
        const pa=Math.PI/2-f.pa*(L.bend>0?1:0.9);return {L,R,K:j.K,F:j.F,H:[j.F[0]+PAST*Math.cos(pa)*(f.down?1:0.95),j.F[1]+PAST*Math.sin(pa)]}})}}
  function limb(c,P,w1,w2,w3){c.lineCap='round';c.lineJoin='round';
    c.lineWidth=w1;c.beginPath();c.moveTo(P.R[0],P.R[1]);c.lineTo(P.K[0],P.K[1]);c.stroke();
    c.lineWidth=w2;c.beginPath();c.moveTo(P.K[0],P.K[1]);c.lineTo(P.F[0],P.F[1]);c.stroke();
    c.lineWidth=w3;c.beginPath();c.moveTo(P.F[0],P.F[1]);c.lineTo(P.H[0],P.H[1]);c.stroke();
    c.beginPath();c.arc(P.H[0],P.H[1],1.5,0,TAU);c.fill()}
  function body(c,p){const y=p.bob;c.save();c.translate(50,34+y);c.rotate(p.pitch);c.translate(-50,-34);
    c.lineCap='round';c.lineJoin='round';
    // 꼬리: 엉덩이 위에서 뒤로 흘러내림(몸보다 늦게 흔들림)
    const ta=p.tail,tx=8-6*Math.cos(ta),ty=34+12*Math.sin(ta);
    c.lineWidth=4.2;c.beginPath();c.moveTo(24,23);c.quadraticCurveTo(14,22+5*Math.sin(ta),tx,ty);c.stroke();
    c.lineWidth=2.2;c.beginPath();c.moveTo(23,25);c.quadraticCurveTo(15,28+5*Math.sin(ta),tx+2,ty+6);c.stroke();
    // 몸통: 둥근 엉덩이 → 등 → 기갑 → 가슴 → 배
    c.beginPath();c.moveTo(22,30);c.bezierCurveTo(21,20,30,17,38,19);c.quadraticCurveTo(50,22,60,19);c.quadraticCurveTo(70,17,74,26);
    c.bezierCurveTo(78,34,74,42,66,43);c.quadraticCurveTo(52,46,38,43);c.bezierCurveTo(26,42,22,38,22,30);c.fill();
    c.beginPath();c.ellipse(31,30,10.5,10,0.2,0,TAU);c.fill();          // 엉덩이·넓적다리
    c.beginPath();c.ellipse(67,35,6.5,8.5,-0.25,0,TAU);c.fill();        // 어깨·팔뚝 위
    // 목: 기갑과 가슴에서 굵게 올라가 머리 쪽으로 가늘어짐(몸보다 늦게 따라옴)
    const na=p.neck,top=[63,20],brs=[75,33],nl=17,poll=[top[0]+6+nl*Math.cos(na),top[1]+nl*Math.sin(na)];
    const thr=[poll[0]+3.5,poll[1]+5.5];
    c.beginPath();c.moveTo(top[0],top[1]);c.quadraticCurveTo((top[0]+poll[0])/2-1,(top[1]+poll[1])/2-2,poll[0],poll[1]);
    c.lineTo(thr[0],thr[1]);c.quadraticCurveTo((thr[0]+brs[0])/2+2,(thr[1]+brs[1])/2,brs[0],brs[1]);c.lineTo(66,34);c.closePath();c.fill();
    // 갈기: 목 윗선을 따라 작은 털 뭉치(가장자리가 들쭉날쭉)
    c.lineWidth=2.4;c.beginPath();c.moveTo(top[0]+1,top[1]-1.2);c.quadraticCurveTo((top[0]+poll[0])/2-2.5,(top[1]+poll[1])/2-3,poll[0]-1,poll[1]-1.2);c.stroke();
    for(let k=0;k<3;k++){const t=0.25+k*0.25,mx=top[0]+(poll[0]-top[0])*t-1.5,my=top[1]+(poll[1]-top[1])*t-2.2,fl=3+Math.sin(TAU*k*0.33+ta*2)*0.9;
      c.lineWidth=1.7;c.beginPath();c.moveTo(mx,my);c.quadraticCurveTo(mx-fl*0.6,my-0.4,mx-fl,my+1.6);c.stroke()}
    // 머리: 이마에서 주둥이로 길게, 턱은 넓게
    const ha=na+p.head,hl=15,mz=[poll[0]+hl*Math.cos(ha),poll[1]+hl*Math.sin(ha)],nx=-Math.sin(ha),ny=Math.cos(ha);
    c.beginPath();c.moveTo(poll[0]-nx*1.2,poll[1]-ny*1.2);c.lineTo(mz[0]-nx*1.6,mz[1]-ny*1.6);
    c.quadraticCurveTo(mz[0]+Math.cos(ha)*1.8,mz[1]+Math.sin(ha)*1.8,mz[0]+nx*2,mz[1]+ny*2);
    c.lineTo(poll[0]+nx*4.2+Math.cos(ha)*4,poll[1]+ny*4.2+Math.sin(ha)*4);c.lineTo(thr[0],thr[1]);c.closePath();c.fill();
    // 귀
    c.beginPath();c.moveTo(poll[0]-1,poll[1]);c.lineTo(poll[0]-2.2,poll[1]-5);c.lineTo(poll[0]+1.6,poll[1]-0.6);c.fill();
    c.restore()}
  function sizeGrid(){const r=cv.getBoundingClientRect(),dpr=Math.min(3,window.devicePixelRatio||1);
    const W=Math.max(40,Math.round(r.width*dpr)),H=Math.max(30,Math.round(r.height*dpr));
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
    gw=cl(Math.round(r.width/1.7),56,96);gh=Math.round(gw*0.66);mk.width=mf.width=gw;mk.height=mf.height=gh}
  function drawFill(ph,amp){
    const r=cv.getBoundingClientRect(),dpr=Math.min(3,window.devicePixelRatio||1),W=Math.max(40,Math.round(r.width*dpr)),H=Math.max(30,Math.round(r.height*dpr));
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}
    const s=Math.min(W/100,H/68),ox=(W-100*s)/2,oy=H-66*s,p=pose(ph,amp);
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.setTransform(s,0,0,s,ox,oy);
    // 땅에 스치는 흙 자국(달릴 때만, 말 아래 고정)
    if(amp>0.05){ctx.strokeStyle=opt.near||'#efe3c2';ctx.globalAlpha=0.55*amp;ctx.lineWidth=0.9;ctx.lineCap='round';
      for(let k=0;k<5;k++){const x=18+k*15+((ph*30+k*7)%6),w=4+((k*5)%4);ctx.beginPath();ctx.moveTo(x,G+2+(k%2));ctx.lineTo(x+w,G+2+(k%2));ctx.stroke()}ctx.globalAlpha=1}
    ctx.fillStyle=ctx.strokeStyle=opt.far||'#b7ab8c';p.legs.filter(l=>!l.L.near).forEach(l=>limb(ctx,l,l.L.bend>0?4.4:6,2.8,2.2));
    ctx.fillStyle=ctx.strokeStyle=opt.near||'#efe3c2';body(ctx,p);p.legs.filter(l=>l.L.near).forEach(l=>limb(ctx,l,l.L.bend>0?4.8:6.6,3,2.4));
    ctx.fillStyle=opt.eye||'#23352c';const nb=[70,24];ctx.setTransform(1,0,0,1,0,0)}
  function draw(ph,amp){
    if(!cv.isConnected)return;if(opt.style==='fill')return drawFill(ph,amp);sizeGrid();
    const s=gw/100,cn=mk.getContext('2d'),cfr=mf.getContext('2d'),p=pose(ph,amp);
    for(const c of [cn,cfr]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,gw,gh);c.setTransform(s,0,0,s,0,0);c.fillStyle=c.strokeStyle='#fff'}
    p.legs.filter(l=>!l.L.near).forEach(l=>limb(cfr,l,l.L.bend>0?4.4:6,2.8,2.2));
    body(cn,p);p.legs.filter(l=>l.L.near).forEach(l=>limb(cn,l,l.L.bend>0?4.8:6.6,3,2.4));
    const A=cn.getImageData(0,0,gw,gh).data,B=cfr.getImageData(0,0,gw,gh).data,on=(d,x,y)=>x>=0&&y>=0&&x<gw&&y<gh&&d[(y*gw+x)*4+3]>110;
    const W=cv.width,H=cv.height,px=Math.min(W/gw,H/gh),ox=(W-gw*px)/2,oy=H-gh*px,rad=px*0.42;
    ctx.clearRect(0,0,W,H);
    const dot=(x,y,col,r)=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(ox+(x+.5)*px,oy+(y+.5)*px,r,0,TAU);ctx.fill()};
    // 바닥선(고정)
    const gy=Math.round(G*s);for(let x=2;x<gw-2;x+=2)dot(x,gy+1,'rgba(64,255,120,.22)',rad*0.7);
    for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
      const n=on(A,x,y),f=on(B,x,y);
      if(n){const edge=!on(A,x-1,y)||!on(A,x+1,y)||!on(A,x,y-1)||!on(A,x,y+1);
        if(edge){dot(x,y,'rgba(70,255,120,.26)',rad*1.9);dot(x,y,'#6dff8f',rad)}else dot(x,y,'rgba(60,220,110,.07)',rad*0.8)}
      else if(f){const edge=!on(B,x-1,y)||!on(B,x+1,y)||!on(B,x,y-1)||!on(B,x,y+1);if(edge)dot(x,y,'#2a9c47',rad*0.92)}}}
  // 속도 보정(애니메이션 전용)
  function step(t){
    const dt=st.last?Math.min(0.1,(t-st.last)/1000):0;st.last=t;
    const v=st.run?Math.max(0,st.speed||0):0;st.vs+=(v-st.vs)*(1-Math.exp(-dt/0.8));
    // 1.93: 주행 중이면 서 있어도 제자리에서 달림(보폭은 천천히 커지고, 속도가 붙으면 더 크고 빠르게). 빈차·지불이면 네 발로 섬
    st.moving=!!st.run;
    const target=st.moving?cl(0.55+st.vs/90,0.55,1):0;
    st.amp+=(target-st.amp)*(1-Math.exp(-dt/(target>st.amp?1.6:0.55)));   // 출발은 천천히 보폭을 키우고, 정차는 조금 빨리 네 발로
    if(st.amp<0.02&&!st.moving)st.amp=0;
    const hz=st.amp>0?0.9+cl(st.vs,0,130)/60:0;st.phase=(st.phase+hz*dt)%1;
    // 서 있을 땐 다음 출발이 먼 뒷발부터 시작되도록 위상을 공중 구간 끝으로 천천히 맞춤
    if(st.amp===0)st.phase=0.9;
    draw(st.phase,st.amp)}
  function loop(t){st.raf=0;if(st.fixed){draw(st.fixed.ph,st.fixed.amp);return}
    const vis=cv.offsetParent!==null&&!document.hidden;if(vis)step(t);else st.last=0;
    st.raf=requestAnimationFrame(loop)}
  function kick(){if(!st.raf)st.raf=requestAnimationFrame(loop)}
  return {
    set(run,speed){st.run=!!run;st.speed=speed;kick()},
    pose(ph,amp){st.fixed={ph,amp};if(st.raf){cancelAnimationFrame(st.raf);st.raf=0}draw(ph,amp)},
    live(){st.fixed=null;kick()},
    get state(){return {phase:st.phase,amp:st.amp,moving:st.moving,vs:st.vs}},
    _step:step,
    footDown:(ph,amp)=>pose(ph,amp).legs.map(l=>foot(l.L,ph,amp).down)}}
