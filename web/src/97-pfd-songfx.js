// 1.95 스피드미터(PFD) 노래 제목 위 음악 효과 — 제목과 같은 녹색, 배경 없이 선·점만. 누르면 효과가 바뀜(막대 → 거울 → 파형 → 점 → 원)
//  노래 제목이 보일 때(재생 중)만 그림. 소리 데이터는 시각화(30-eq-visual)의 bars·W를 그대로 씀
const PfdSongFx=(()=>{
  const FX=[['bars','막대'],['mirror','거울 막대'],['wave','파형'],['dots','점'],['ring','원']];
  let cv=null,ctx=null,mode=Math.max(0,FX.findIndex(f=>f[0]===store.get('pfdFx','bars'))),last=0,ph=0;
  const sm=new Float32Array(32);
  function ensure(){const w=document.querySelector('#pfdHost .pfd-canvas-wrap');if(!w||w.offsetParent===null)return null;
    if(!cv||!w.contains(cv)){cv=document.createElement('canvas');cv.className='pfd-songfx';cv.setAttribute('role','button');cv.setAttribute('aria-label','음악 효과 바꾸기');
      const stop=e=>e.stopPropagation();['pointerdown','pointerup','touchstart','touchend','mousedown'].forEach(t=>cv.addEventListener(t,stop));
      cv.addEventListener('click',e=>{e.stopPropagation();mode=(mode+1)%FX.length;store.set('pfdFx',FX[mode][0]);try{toast('음악 효과: '+FX[mode][1])}catch(_){}});
      w.appendChild(cv);ctx=cv.getContext('2d')}
    return cv}
  let feed=null;   // 시험용: 소리 대신 넣는 값(0~1을 돌려주는 함수)
  function level(i,n){// bars(48칸)를 n칸으로 묶어 0~1
    if(feed)return feed(i/n);const B=typeof bars!=='undefined'?bars:null;if(!B)return 0;const a=Math.floor(i*B.length/n),b=Math.max(a+1,Math.floor((i+1)*B.length/n));let s=0;for(let k=a;k<b;k++)s=Math.max(s,B[k]);return s}
  function draw(now){
    requestAnimationFrame(draw);if(now-last<33)return;const dt=Math.min(.1,(now-last)/1000);last=now;
    const song=document.querySelector('#pfdHost .pfd-song');
    if(!ensure()||!song||song.hidden||document.hidden){if(cv)cv.hidden=true;return}
    cv.hidden=false;const d=devicePixelRatio||1,W0=cv.clientWidth,H0=cv.clientHeight;if(!W0||!H0)return;
    if(cv.width!==Math.round(W0*d)||cv.height!==Math.round(H0*d)){cv.width=Math.round(W0*d);cv.height=Math.round(H0*d)}
    const c=ctx,w=cv.width,h=cv.height,col=getComputedStyle(song).color||'#6dff7a';
    c.clearRect(0,0,w,h);c.save();c.fillStyle=c.strokeStyle=col;c.shadowColor='rgba(0,0,0,.85)';c.shadowBlur=3*d;
    const n=sm.length;for(let i=0;i<n;i++){const v=level(i,n);sm[i]=v>sm[i]?v:sm[i]*Math.pow(.02,dt)+v*(1-Math.pow(.02,dt))}
    ph+=dt;const f=FX[mode][0];
    if(f==='bars'||f==='mirror'){const n2=24,gap=w/n2,bw=gap*.62;
      for(let i=0;i<n2;i++){const v=Math.max(.03,sm[Math.floor(i*n/n2)]),x=i*gap+(gap-bw)/2;
        if(f==='bars'){const bh=v*h*.96;c.fillRect(x,h-bh,bw,bh)}
        else{const bh=v*h*.48;c.fillRect(x,h/2-bh,bw,bh*2)}}}
    else if(f==='wave'){const Wv=typeof W!=='undefined'&&W&&W.length?W:null;c.lineWidth=2.2*d;c.lineJoin='round';c.beginPath();
      const k=96;for(let i=0;i<=k;i++){let y;if(Wv){const s=(Wv[Math.floor(i*(Wv.length-1)/k)]-128)/128;y=h/2+s*h*.46}else{y=h/2+Math.sin(i/k*Math.PI*4+ph*3)*sm[i%n]*h*.4}
        const x=i/k*w;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}
    else if(f==='dots'){const cols=16,rows=7,gx=w/cols,gy=h/rows,r=Math.min(gx,gy)*.3;
      for(let i=0;i<cols;i++){const v=sm[Math.floor(i*n/cols)],lit=Math.round(v*rows);for(let j=0;j<rows;j++){c.globalAlpha=j<lit?1:.13;c.beginPath();c.arc(i*gx+gx/2,h-j*gy-gy/2,r,0,7);c.fill()}}c.globalAlpha=1}
    else{const cx=w-h/2,cy=h/2,R0=h*.2;c.lineWidth=2*d;c.lineCap='round';
      for(let i=0;i<n;i++){const a=i/n*Math.PI*2+ph*.4,v=sm[i];c.beginPath();c.moveTo(cx+Math.cos(a)*R0,cy+Math.sin(a)*R0);c.lineTo(cx+Math.cos(a)*(R0+.02*h+v*h*.28),cy+Math.sin(a)*(R0+.02*h+v*h*.28));c.stroke()}
      c.beginPath();c.arc(cx,cy,R0*.8,0,7);c.stroke()}
    c.restore()}
  requestAnimationFrame(draw);
  return {_feed(f){feed=f||null},get mode(){return FX[mode][0]},set(m){const i=FX.findIndex(f=>f[0]===m);if(i>=0){mode=i;store.set('pfdFx',m)}}};
})();
window.PfdSongFx=PfdSongFx;
