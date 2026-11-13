// 아래 버튼 줄 액체 탭 표시(1.63 시안 3)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 고른 보기 표시가 버튼 사이를 흐르듯 이동 ----------
 *  - 켜진 버튼 위에 테두리·밑줄·옅은 빛 틀 하나를 덮고, 다른 보기를 누르면 그 틀이 옮겨 감
 *  - 틀의 두 끝이 서로 다른 스프링: 가는 쪽 끝은 빠르게(3.4 Hz), 남는 쪽 끝은 느리게(2.0 Hz) → 잠깐 늘어났다 모임
 *  - 여러 번 연달아 눌러도 끊기지 않게, 바뀔 때마다 스프링을 하나씩 더함(시간만으로 위치가 정해짐)
 *  - 넘침 1% 안팎, 0.3초 안에 거의 멈춤. 튀는 탄성·빛번짐 없음 */
const RailLiquid=(()=>{
  const rail=$('#ckRail');if(!rail)return null;
  const S=(t,f,z)=>{if(t<=0)return 0;const w=2*Math.PI*f,wd=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*t)*(Math.cos(wd*t)+(z*w/wd)*Math.sin(wd*t))};
  const now=()=>window.__liqNow!=null?window.__liqNow:performance.now()/1000;
  const ind=document.createElement('i');ind.className='ck-liq';ind.setAttribute('aria-hidden','true');rail.appendChild(ind);
  let ch=[],raf=0,lastOn=null,skinKey='';
  const onBtn=()=>rail.querySelector('button[data-f].on');
  const rectOf=b=>{const r=b.getBoundingClientRect(),q=rail.getBoundingClientRect();return [r.left-q.left+rail.scrollLeft,r.right-q.left+rail.scrollLeft,r.top-q.top,r.height]};
  // 스킨마다 켜진 버튼의 색을 읽어 틀 색으로(켜진 버튼 자체의 바탕·그림자는 다른 버튼과 같게)
  function skin(){const b=onBtn(),o=rail.querySelector('button[data-f]:not(.on)');if(!b||!o)return;
    const cs=getComputedStyle(b),os=getComputedStyle(o);
    const k=cs.color+os.backgroundImage+os.boxShadow+cs.borderRadius;if(k===skinKey)return;skinKey=k;
    rail.style.setProperty('--liq-acc',cs.color);rail.style.setProperty('--liq-r',cs.borderRadius);
    rail.style.setProperty('--liq-bg',os.backgroundImage!=='none'?os.backgroundImage:os.backgroundColor);rail.style.setProperty('--liq-bs',os.boxShadow);rail.style.setProperty('--liq-bc',os.borderColor);
    if(!rail.classList.contains('liq'))rail.classList.add('liq')}
  // 자리는 그릴 때마다 지금 배치에서 버튼을 재서 씀(줄이 다른 창으로 옮겨 가 크기가 바뀌어도 어긋나지 않게)
  function edges(t){if(!ch.length)return null;const g=ch.map(c=>c.b.isConnected?rectOf(c.b):null);if(g.some(x=>!x))return null;let l=g[0][0],r=g[0][1];
    for(let k=1;k<ch.length;k++){const a=g[k-1],b=g[k],right=b[0]>a[0],dt=t-ch[k].t;l+=(b[0]-a[0])*S(dt,right?2.0:3.4,.86);r+=(b[1]-a[1])*S(dt,right?3.4:2.0,.86)}return [l,r]}
  function paint(){const b=onBtn();if(!b||!rail.offsetParent){ind.style.opacity='0';return false}
    const t=now();if(!ch.length)ch=[{t:-99,b}];const last=ch[ch.length-1];
    let e=edges(t);if(!e){ch=[{t:-99,b}];e=edges(t)}const g=rectOf(b),y=g[2],h=g[3];
    ind.style.cssText='opacity:1;left:'+e[0].toFixed(1)+'px;width:'+Math.max(8,e[1]-e[0]).toFixed(1)+'px;top:'+y.toFixed(1)+'px;height:'+h.toFixed(1)+'px';
    return t-last.t<0.9}
  function loop(){raf=0;if(paint())raf=requestAnimationFrame(loop)}
  function kick(){if(!raf)raf=requestAnimationFrame(loop)}
  // 고른 보기가 바뀌면 그 버튼 자리로 스프링 하나 더함
  function sync(){const b=onBtn();if(!b){ind.style.opacity='0';lastOn=null;return}skin();
    if(b!==lastOn&&lastOn&&ch.length&&rail.offsetParent){ch.push({t:now(),b});if(ch.length>8)ch=ch.slice(-2)} // 너무 쌓이면 마지막 두 개만(앞 것은 이미 멈춤)
    else if(b!==lastOn||!ch.length)ch=[{t:-99,b}]; // 처음은 바로 그 자리
    lastOn=b;kick()}
  // 줄이 다른 창으로 옮겨 가도(전용 보기마다 그 창 아래로) 줄 안의 버튼 자리는 같으므로 그대로 이어서 움직임
  new MutationObserver(ms=>{if(ms.some(m=>m.target!==rail&&m.target!==ind))sync()}).observe(rail,{subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',()=>setTimeout(kick,60));
  setTimeout(sync,300);
  return {sync,paint,get edges(){return edges(now())}}})();
window.AmpRailLiquid=RailLiquid;
