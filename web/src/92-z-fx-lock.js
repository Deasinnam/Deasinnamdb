// 전용 보기 고정(1.62.2)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 전용 보기(스피드미터·지도·라디오·NOW PLAYING·DASHCAM 등, '전체' 제외)는 최적화된 화면에 고정 ----------
 *  - 들어가면 고른 창이 위아래 잘리지 않게 화면에 딱 맞는 자리로 맞추고, 페이지가 위아래로 움직이지 않음
 *  - 위아래로 끌면 고무줄처럼 조금 늘어났다가 놓으면 스프링처럼 튕기며 제자리(같은 자리)에 멈춤
 *  - 창 안의 목록처럼 스스로 스크롤되는 곳은 끝에 닿을 때까지 그대로 스크롤, 지도·슬라이더·다이얼·크기 조절 손잡이는 건드리지 않음 */
const FxLock=(()=>{
  let lockY=null,anim=0,off=0,vel=0,touch=null,settleT=0;
  const active=()=>appEl.classList.contains('FX')&&isCk2();
  const target=()=>appEl;
  const SKIP='.leaflet-container,input,select,textarea,.rd-knob,.grip,.rzbtn,[data-nolock],.sp-sky,dialog';
  function fitY(){ // 고른 창의 아래 끝이 화면 아래에 닿는 스크롤 위치(창이 화면보다 작으면 0 쪽으로)
    const w=appEl.querySelector(':scope>.win.fx');if(!w)return 0;
    const r=w.getBoundingClientRect(),y=window.scrollY+r.bottom-window.innerHeight+4,max=document.documentElement.scrollHeight-window.innerHeight;
    return Math.max(0,Math.min(max,Math.round(y)))}
  function settle(delay){clearTimeout(settleT);settleT=setTimeout(()=>{if(!active()){release();return}lockY=fitY();if(Math.abs(window.scrollY-lockY)>1)window.scrollTo({top:lockY,behavior:'instant'});document.documentElement.classList.add('fxlock')},delay==null?450:delay)}
  function release(){lockY=null;document.documentElement.classList.remove('fxlock');stopAnim();setOff(0)}
  function setOff(v){off=v;const t=target();t.style.transform=Math.abs(v)<.3?'':'translate3d(0,'+v.toFixed(1)+'px,0)'}
  function stopAnim(){if(anim)cancelAnimationFrame(anim);anim=0}
  // 스프링(살짝 넘쳤다가 멈춤): k 강성, c 감쇠
  function spring(){stopAnim();let last=performance.now();const k=240,c=17;
    const step=t=>{const dt=Math.min(.032,(t-last)/1000);last=t;const a=-k*off-c*vel;vel+=a*dt;let n=off+vel*dt;
      if(Math.abs(n)<.3&&Math.abs(vel)<4){setOff(0);vel=0;anim=0;return}setOff(n);anim=requestAnimationFrame(step)};anim=requestAnimationFrame(step)}
  function bump(dir){vel+=dir*-260;if(!anim)spring()} // 휠·키보드: 밀려는 쪽으로 살짝 튕김
  // 손가락 아래에 스스로 스크롤되는 곳이 있고 그 방향으로 더 갈 수 있으면 그쪽에 맡김
  function canScroll(el,dy){for(let e=el;e&&e!==document.body&&e!==document.documentElement;e=e.parentElement){const cs=getComputedStyle(e);
    if(/(auto|scroll)/.test(cs.overflowY)&&e.scrollHeight>e.clientHeight+1){if(dy>0&&e.scrollTop>0)return true;if(dy<0&&e.scrollTop+e.clientHeight<e.scrollHeight-1)return true}}return false}
  document.addEventListener('touchstart',e=>{if(lockY==null||e.touches.length!==1)return;const t=e.touches[0];touch={x:t.clientX,y:t.clientY,mode:null,el:e.target,base:off};stopAnim();vel=0},{passive:true});
  document.addEventListener('touchmove',e=>{if(lockY==null||!touch||e.touches.length!==1)return;const t=e.touches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;
    if(!touch.mode){if(Math.abs(dx)<6&&Math.abs(dy)<6)return;touch.mode=(Math.abs(dy)>Math.abs(dx)&&!(touch.el.closest&&touch.el.closest(SKIP))&&!canScroll(touch.el,dy))?'band':'pass'}
    if(touch.mode!=='band')return;e.preventDefault();
    const d=touch.base+dy,res=d/(1+Math.abs(d)/(window.innerHeight*.35)); // 끌수록 덜 늘어나는 고무줄
    setOff(res*.55)},{passive:false});
  const end=()=>{if(!touch)return;const was=touch.mode==='band';touch=null;if(was||Math.abs(off)>.3){vel=0;spring()}};
  document.addEventListener('touchend',end,{passive:true});document.addEventListener('touchcancel',end,{passive:true});
  window.addEventListener('wheel',e=>{if(lockY==null||Math.abs(e.deltaY)<Math.abs(e.deltaX))return;if(e.target.closest&&e.target.closest(SKIP))return;if(canScroll(e.target,-e.deltaY))return;e.preventDefault();bump(Math.sign(e.deltaY))},{passive:false});
  // 그래도 페이지가 움직이면(키보드·주소창 변화 등) 제자리로
  window.addEventListener('scroll',()=>{if(lockY==null||touch)return;if(Math.abs(window.scrollY-lockY)>1){const dir=Math.sign(window.scrollY-lockY);window.scrollTo({top:lockY,behavior:'instant'});bump(dir)}},{passive:true});
  // 보기 바뀜·화면 크기 바뀜(접고 펴기)·창 크기 조절이 끝나면 다시 맞춤
  let wasFx=active();
  new MutationObserver(()=>{const now=active();if(now===wasFx&&lockY!=null)return;wasFx=now;lockY=null;if(now)settle();else release()}).observe(appEl,{attributes:true,attributeFilter:['class']});
  // 같은 FX 안에서 다른 보기로 바꿀 때(스피드미터 → 라디오)
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#ckRail button[data-f]')){lockY=null;settle()}},true);
  window.addEventListener('resize',()=>{if(active())settle(300)});
  document.addEventListener('pointerup',e=>{if(lockY!=null&&e.target.closest&&e.target.closest('.grip,.rzbtn'))settle(300)},true);
  if(active())settle(800);
  return {get y(){return lockY},get off(){return off},settle,release}})();
window.AmpFxLock=FxLock;
