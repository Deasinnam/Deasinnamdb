// 1.95 스피드미터(PFD) 노래 제목 위 음악 효과 — 제목과 같은 녹색, 배경 없이 선·점만. 누르면 효과가 바뀜(막대 → 거울 → 파형 → 점 → 원)
//  노래 제목이 보일 때(재생 중)만 그림. 소리 값은 시각화(30-eq-visual)의 bars·W를 그대로 씀
//  svg 경로로 그림(PFD 캔버스 #pfdHost canvas 와 헷갈리지 않게 canvas는 쓰지 않음)
const PfdSongFx=(()=>{
  const FX=[['bars','막대'],['mirror','거울 막대'],['wave','파형'],['dots','점'],['ring','원']];
  const NS='http://www.w3.org/2000/svg',sm=new Float32Array(32);
  let el=null,pf=null,ps=null,mode=Math.max(0,FX.findIndex(f=>f[0]===store.get('pfdFx','bars'))),last=0,ph=0,feed=null;
  function ensure(){const w=document.querySelector('#pfdHost .pfd-canvas-wrap');if(!w||w.offsetParent===null)return null;
    if(!el||!w.contains(el)){el=document.createElementNS(NS,'svg');el.setAttribute('class','pfd-songfx');el.setAttribute('role','button');el.setAttribute('aria-label','음악 효과 바꾸기');
      pf=document.createElementNS(NS,'path');ps=document.createElementNS(NS,'path');pf.setAttribute('fill','currentColor');
      ps.setAttribute('fill','none');ps.setAttribute('stroke','currentColor');ps.setAttribute('stroke-linecap','round');ps.setAttribute('stroke-linejoin','round');
      el.appendChild(pf);el.appendChild(ps);
      const stop=e=>e.stopPropagation();['pointerdown','pointerup','touchstart','touchend','mousedown'].forEach(t=>el.addEventListener(t,stop));
      el.addEventListener('click',e=>{e.stopPropagation();mode=(mode+1)%FX.length;store.set('pfdFx',FX[mode][0]);try{toast('음악 효과: '+FX[mode][1])}catch(_){}});
      w.appendChild(el)}
    return el}
  function level(i,n){// bars(48칸)를 n칸으로 묶어 0~1
    if(feed)return feed(i/n);const B=typeof bars!=='undefined'?bars:null;if(!B)return 0;
    const a=Math.floor(i*B.length/n),b=Math.max(a+1,Math.floor((i+1)*B.length/n));let s=0;for(let k=a;k<b;k++)s=Math.max(s,B[k]);return s}
  const r1=v=>Math.round(v*10)/10;
  const circ=(cx,cy,r)=>'M'+r1(cx-r)+' '+r1(cy)+'a'+r1(r)+' '+r1(r)+' 0 1 0 '+r1(2*r)+' 0a'+r1(r)+' '+r1(r)+' 0 1 0 '+r1(-2*r)+' 0';
  function draw(now){
    requestAnimationFrame(draw);if(now-last<33)return;const dt=Math.min(.1,(now-last)/1000);last=now;
    const song=document.querySelector('#pfdHost .pfd-song');
    if(!ensure()||!song||song.hidden||document.hidden){if(el)el.style.display='none';return}
    el.style.display='';const b=el.getBoundingClientRect(),w=b.width,h=b.height;if(!w||!h)return;
    el.setAttribute('viewBox','0 0 '+r1(w)+' '+r1(h));el.style.color=getComputedStyle(song).color||'#6dff7a';
    const n=sm.length,k=Math.pow(.02,dt);for(let i=0;i<n;i++){const v=level(i,n);sm[i]=v>sm[i]?v:sm[i]*k+v*(1-k)}
    ph+=dt;const f=FX[mode][0];let F='',S='',sw=2.2,so=1;
    if(f==='bars'||f==='mirror'){const n2=24,gap=w/n2,bw=gap*.62;
      for(let i=0;i<n2;i++){const v=Math.max(.03,sm[Math.floor(i*n/n2)]),x=i*gap+(gap-bw)/2,bh=v*h*.96,y=f==='bars'?h-bh:h/2-bh/2;
        F+='M'+r1(x)+' '+r1(y)+'h'+r1(bw)+'v'+r1(bh)+'h'+r1(-bw)+'z'}}
    else if(f==='wave'){const Wv=!feed&&typeof W!=='undefined'&&W&&W.length?W:null,K=96;
      for(let i=0;i<=K;i++){let y;if(Wv){const s=(Wv[Math.floor(i*(Wv.length-1)/K)]-128)/128;y=h/2+s*h*.46}else y=h/2+Math.sin(i/K*Math.PI*4+ph*3)*sm[i%n]*h*.4;
        S+=(i?'L':'M')+r1(i/K*w)+' '+r1(y)}}
    else if(f==='dots'){const cols=16,rows=7,gx=w/cols,gy=h/rows,r=Math.min(gx,gy)*.3;
      for(let i=0;i<cols;i++){const lit=Math.round(sm[Math.floor(i*n/cols)]*rows);for(let j=0;j<rows;j++){const c=circ(i*gx+gx/2,h-j*gy-gy/2,r);if(j<lit)F+=c;else S+=c}}
      sw=1.2;so=.25}
    else{const cx=w-h/2,cy=h/2,R0=h*.2;
      for(let i=0;i<n;i++){const a=i/n*Math.PI*2+ph*.4,L=R0+.02*h+sm[i]*h*.28;S+='M'+r1(cx+Math.cos(a)*R0)+' '+r1(cy+Math.sin(a)*R0)+'L'+r1(cx+Math.cos(a)*L)+' '+r1(cy+Math.sin(a)*L)}
      S+=circ(cx,cy,R0*.8)}
    pf.setAttribute('d',F);ps.setAttribute('d',S);ps.setAttribute('stroke-width',sw);ps.setAttribute('stroke-opacity',so)}
  requestAnimationFrame(draw);
  return {_feed(f){feed=f||null},get el(){return el},get mode(){return FX[mode][0]},set(m){const i=FX.findIndex(f=>f[0]===m);if(i>=0){mode=i;store.set('pfdFx',m)}}};
})();
window.PfdSongFx=PfdSongFx;
