// 좁은 화면(폴드7 좌우 반 가르기·바깥 화면·폰 세로) 정리
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 1.67 data-narrow ----------
 *  - 앱 창 폭이 520px 이하면 :root[data-narrow] — CSS가 창 머리줄 한 줄·라디오 표시창·플레이어 버튼 줄 등을 좁게 맞춤
 *  - 속도계 위 정보(최고 속도·주행 거리 등 6칸)는 좁은 화면에서 접어 두어 활주로 화면을 크게.
 *    계기 위 상태 줄(GPS · TRK, LIM 버튼 빼고)을 누르면 펼치기/접기(기억함) */
const Narrow=(()=>{const r=document.documentElement;
  let apply=function(){const n=innerWidth<=520;if(n!==r.hasAttribute('data-narrow')){r.toggleAttribute('data-narrow',n);setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}},60)}};
  r.toggleAttribute('data-metrics-open',!!store.get('narrowMetrics',false));
  document.addEventListener('click',e=>{const s=e.target.closest&&e.target.closest('#pfdHost .pfd-flight-meta');if(!s||e.target.closest('button')||!r.hasAttribute('data-narrow'))return;
    r.toggleAttribute('data-metrics-open');store.set('narrowMetrics',r.hasAttribute('data-metrics-open'));
    setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(x){}window.dispatchEvent(new Event('resize'))},40)});
  /* 1.72 좁은 화면: 좌우 속도·고도 띠는 감추고(계기 그림을 띠 폭만큼 넓게 그려 띠는 창 밖으로), 속도는 가운데 크게.
   *  띠 폭은 PFD 패키지 규칙 그대로: clamp(그림 폭×0.12, 67, 175) — 보이는 폭 V면 그림 폭 W = V + 2×띠 */
  let spd=null,spdT=0;
  function tape(){const g=document.querySelector('#pfdHost .pfd-glass');if(!g)return;const V=g.clientWidth;if(!V)return;
    let t=67;if((V+134)*.12>67)t=Math.min(175,V*.12/.76);const nv=Math.round(t)+'px';if(r.style.getPropertyValue('--nar-tape')!==nv){r.style.setProperty('--nar-tape',nv);setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}},30)}}
  function speed(){if(!r.hasAttribute('data-narrow'))return;const wrap=document.querySelector('#pfdHost [data-role="canvasWrap"]');if(!wrap)return;
    if(!spd||spd.parentNode!==wrap){spd=document.createElement('div');spd.className='nar-spd';spd.setAttribute('aria-live','off');spd.innerHTML='<b>—</b><small>km/h</small>';wrap.appendChild(spd)}
    let v=null;try{const P=window.AmpPfd&&AmpPfd.panel;if(P&&P.display&&isFinite(P.display.speedKmh)&&P.effective&&P.effective().valid)v=P.display.speedKmh}catch(e){}
    const t=v==null?'—':String(Math.round(v));if(spd.firstChild.textContent!==t)spd.firstChild.textContent=t;
    // 자리: 조준 기호(그림 높이의 53%, 아래 나침반 띠 제외) 바로 아래 가운데. 원형 지도와 겹치면 지도 오른쪽 빈자리 가운데로
    const g=document.querySelector('#pfdHost .pfd-glass'),wr=wrap.getBoundingClientRect(),gr=g?g.getBoundingClientRect():wr,H=wr.height;if(!H)return;
    const cmp=Math.max(43,Math.min(66,H*.145)),top=(H-cmp)*.53+28,bh=spd.offsetHeight||60,bw=spd.offsetWidth||120;
    let cx=(gr.left+gr.right)/2-wr.left;const m=wrap.querySelector('.pfd-mini');
    if(m&&m.offsetParent){const mr=m.getBoundingClientRect();if(wr.top+top+bh>mr.top-30&&cx-bw/2<mr.right-wr.left+30)cx=(mr.right+gr.right)/2-wr.left}
    spd.style.top=Math.round(top)+'px';spd.style.left=Math.round(cx)+'px'}
  function tick(){speed();spdT=setTimeout(tick,200)}
  const _apply=apply;apply=function(){_apply();tape()};
  setInterval(tape,1500);tick();
  apply();addEventListener('resize',apply);
  return {apply,get on(){return r.hasAttribute('data-narrow')}}})();
window.AmpNarrow=Narrow;
