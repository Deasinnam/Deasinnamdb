// 설정 › 그래픽 성능 테스트: 이 앱이 실제로 그리는 것과 비슷한 장면(하늘·구름·활주로 원근·등화 빛 번짐·글자·스펙트럼)을
// 3단계로 무겁게 그려 초당 프레임을 재고, 계산 속도·기기 정보와 함께 점수와 추천 설정을 보여 줍니다.
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
(function(){
  const STAGES=[['가벼움 · 계기',1],['보통 · 비행 화면',2],['무거움 · 비행+날씨+시각화',4]],DUR=4500;
  let run=0;
  const spr=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'#fff');r.addColorStop(.15,'#ffd28acc');r.addColorStop(1,'#ffd28a00');g.fillStyle=r;g.fillRect(0,0,64,64);return c})();
  const cloud=(()=>{const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d');for(let i=0;i<14;i++){const x=30+i*14,y=50-Math.sin(i/13*Math.PI)*22,r=26+((i*37)%13),gr=g.createRadialGradient(x,y-6,2,x,y,r);gr.addColorStop(0,'#fff');gr.addColorStop(.7,'#e3e9f0');gr.addColorStop(1,'#cfd8e200');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill()}return c})();
  function frame(g,W,H,k,t){
    const hz=H*.45;let gr=g.createLinearGradient(0,0,0,hz);gr.addColorStop(0,'#2d5f9a');gr.addColorStop(1,'#a9c8e6');g.fillStyle=gr;g.fillRect(0,0,W,hz);
    for(let i=0;i<10*k;i++){const x=((i*173+t*.02*(1+i%3))%(W+300))-150,y=hz*(.15+(i*37%60)/100);g.globalAlpha=.85;g.drawImage(cloud,x,y,200+i%5*40,75+i%4*12)}g.globalAlpha=1;
    gr=g.createLinearGradient(0,hz,0,H);gr.addColorStop(0,'#6f8a55');gr.addColorStop(1,'#2f4520');g.fillStyle=gr;g.fillRect(0,hz,W,H-hz);
    g.fillStyle='#55595e';g.beginPath();g.moveTo(W*.48,hz);g.lineTo(W*.52,hz);g.lineTo(W*.95,H);g.lineTo(W*.05,H);g.closePath();g.fill();
    for(let z=0;z<60*k;z++){const f=((z*.05+t*.0006)%1),y=hz+(H-hz)*f*f,w=W*.45*f*f;g.fillStyle='#f3f2ec';g.globalAlpha=.9;g.fillRect(W/2-w*.02,y,w*.04+1,2+f*8)}
    g.globalCompositeOperation='lighter';for(let i=0;i<80*k;i++){const f=((i/(80*k))+t*.0003)%1,y=hz+(H-hz)*f*f,x=W/2+(i%2?1:-1)*W*.45*f*f,s=6+f*40;g.globalAlpha=.8;g.drawImage(spr,x-s/2,y-s/2,s,s)}
    g.globalCompositeOperation='source-over';g.globalAlpha=1;
    if(k>=4){for(let i=0;i<300;i++){const x=(i*97+t*.3)%W,y=(i*53+t*.9)%H;g.fillStyle='#bcd6ff88';g.fillRect(x,y,1.5,12)}
      const n=64,bw=W/n;for(let i=0;i<n;i++){const v=(Math.sin(t*.006+i*.4)*.5+.5)*(.3+.7*Math.abs(Math.sin(i*1.7)));const hh=H*.25*v;gr=g.createLinearGradient(0,H-hh,0,H);gr.addColorStop(0,'#ffe2a6');gr.addColorStop(1,'#a8f08f');g.fillStyle=gr;g.fillRect(i*bw+1,H-hh,bw-2,hh)}}
    g.font=`700 ${Math.round(Math.min(H*.04,W*.05))}px "Share Tech Mono",monospace`;g.fillStyle='#f4ecd2';for(let i=0;i<6*k;i++)g.fillText(String((t/10+i*13|0)%300),W*.05+(i%6)*W*.15,H*.08+Math.floor(i/6)*H*.06);
  }
  function cpuScore(){const t0=performance.now();let x=0;for(let i=0;i<3e6;i++)x+=Math.sin(i)*Math.sqrt(i%97+1);const ms=performance.now()-t0;return {ms:Math.round(ms),x}}
  function gpuName(){try{const c=document.createElement('canvas'),gl=c.getContext('webgl');if(!gl)return '—';const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}catch(e){return '—'}}
  async function start(){const id=++run,ov=$('#bench'),cv=$('#benchCv'),res=$('#bnRes');ov.hidden=false;res.hidden=true;
    const d=Math.min(2,devicePixelRatio||1),W=cv.width=Math.round(cv.offsetWidth*d),H=cv.height=Math.round(cv.offsetHeight*d),g=cv.getContext('2d');
    const out=[];
    for(const [name,k] of STAGES){$('#bnStage').textContent=name;let n=0,worst=0,last=performance.now();const t0=last;
      await new Promise(done=>{const step=now=>{if(id!==run)return done();frame(g,W,H,k,now);n++;const dt=now-last;last=now;if(n>3)worst=Math.max(worst,dt);
        const el=now-t0;if(n%10===0)$('#bnFps').textContent=Math.round(n/(el/1000))+' fps';if(el<DUR)requestAnimationFrame(step);else done()};requestAnimationFrame(step)});
      if(id!==run)return;out.push({name,fps:n/(DUR/1000),worst})}
    $('#bnStage').textContent='계산 속도 측정';await new Promise(r=>setTimeout(r,50));const cpu=cpuScore();
    const fps=out.map(o=>Math.min(60,o.fps)),score=Math.round(fps[0]/60*200+fps[1]/60*400+fps[2]/60*300+Math.max(0,Math.min(100,(600-cpu.ms)/5)));
    const lv=score>=820?'good':score>=560?'mid':'low';
    $('#bnScore').textContent=score;const vd=$('#bnVerdict');vd.className=lv;vd.textContent={good:'충분해요 — 모든 효과를 부드럽게 쓸 수 있어요',mid:'보통 — 대부분 괜찮지만 무거운 장면에서 끊길 수 있어요',low:'부족해요 — 절전 모드를 권장해요'}[lv];
    const rows=[...out.map(o=>[o.name,Math.round(o.fps)+' fps · 가장 긴 멈춤 '+Math.round(o.worst)+' ms']),['계산 속도',cpu.ms+' ms'],['화면',`${screen.width}×${screen.height} · 배율 ${(devicePixelRatio||1).toFixed(2)}`],['CPU 코어',navigator.hardwareConcurrency||'—'],['메모리',navigator.deviceMemory?navigator.deviceMemory+' GB 이상':'—'],['그래픽',gpuName()]];
    const tb=$('#bnTable');tb.innerHTML='';for(const [k,v] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;tb.append(dt,dd)}
    $('#bnAdvice').textContent={good:'추천: 절전 모드 "자동", 비행 장면 품질 "높음". 지금 설정 그대로 쓰면 돼요.',mid:'추천: 절전 모드 "자동", 비행 장면 품질 "균형"(그림자·질감 일부 생략). 무거운 날씨 효과에서 끊기면 절전 모드를 켜세요.',low:'추천: 절전 모드 "항상 켜기"(화면 갱신을 줄임), 비행 장면 품질 "균형". 시각화 효과는 가벼운 것(SPECTRUM 등)을 쓰세요.'}[lv];
    $('#bnApply').dataset.lv=lv;store.set('benchLast',{score,lv,at:Date.now()});$('#sBench').textContent='그래픽 테스트 (최근 '+score+'점)';
    res.hidden=false}
  function apply(lv){const ps=store.get('pfdSet',{})||{};ps.sceneQuality=lv==='good'?'high':'balanced';store.set('pfdSet',ps);
    try{window.AmpPfd&&AmpPfd.panel&&AmpPfd.panel.setSettings({sceneQuality:ps.sceneQuality})}catch(e){}
    store.set('pwrMode',lv==='low'?'on':'auto');try{pwrApply()}catch(e){}toast('추천 설정을 적용했어요.')}
  function close(){run++;$('#bench').hidden=true}
  $('#sBench').onclick=()=>{try{closeSettings&&closeSettings()}catch(e){}start()};
  $('#bnAgain').onclick=start;$('#bnClose').onclick=close;$('#bnApply').onclick=()=>{apply($('#bnApply').dataset.lv);close()};
  {const l=store.get('benchLast',null);if(l&&l.score)$('#sBench').textContent='그래픽 테스트 (최근 '+l.score+'점)'}
  window.AmpBench={start,close};
})();
