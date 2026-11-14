// 콕핏 2 세로 바로가기
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 콕핏 2: 세로 바로가기(고른 창만 꽉 차게, 전체로 돌아가기) ---------- */
// 콕핏 2 바로가기: 모두 한 창씩, 스피드미터와 같은 크기(바꿔도 화면 크기가 그대로)
const FX_GROUPS={gps:['wGps'],map:['wMap'],cam:['wCam'],radio:['wRadio'],vis:['wVis']};
const ckRailHome=document.createComment('ckRail');$('#ckRail').before(ckRailHome);
const ckRailEl=$('#ckRail'); // 스피드미터 화면이 다시 만들어져도 잃지 않게 붙잡아 둠
/* 콕핏: 바로가기는 가로 한 줄 — 스피드미터 창에서는 계기 화면 바로 아래, 다른 창에서는 제목줄 아래 */
function ckRailPlace(hostId,span){const r=ckRailEl;ckRailPlace.last=[hostId,span];document.querySelectorAll('.win.hasrail').forEach(w=>w.classList.remove('hasrail'));appEl.classList.remove('RL');r.classList.remove('inapp');
  if(!isCk2()||!hostId){ckRailHome.after(r);return}
  if(span){appEl.prepend(r);r.classList.add('inapp');appEl.classList.add('RL');return} // 위아래로 나눈 화면: 두 창 옆에 세로로 길게
  const h=$('#'+hostId);if(!h)return;h.classList.add('hasrail');
  if(hostId==='wGps'&&!isCks()){const glass=h.dataset.gs==='cockpit'&&h.querySelector('#pfdHost .pfd-glass'),gauge=h.querySelector('.body>.gps'),walk=h.dataset.gs==='walk'&&h.querySelector('#walkHost');
    const at=glass||walk||gauge;if(at){if(at.nextElementSibling!==r)at.after(r);return}}
  // 1.68 콕핏 스페셜: 속도계 창도 다른 보기처럼 창 맨 아래(계기 틀 밖) — 버튼 줄 높이·폭이 보기마다 같게
  if(isCks()){const g=h.querySelector(':scope>.grip');if(g)h.insertBefore(r,g);else if(h.lastElementChild!==r)h.append(r);return} // 콕핏 스페셜: 어느 창이든 맨 아래 고정
  const bar=h.querySelector(':scope>.bar');h.insertBefore(r,bar?bar.nextSibling:h.firstChild)}
// 스피드미터 화면(PFD)이 늦게 만들어지거나 디자인이 바뀌면 자리를 다시 잡음
{const mo=new MutationObserver(()=>{const l=ckRailPlace.last;if(l&&l[0]==='wGps'&&!l[1])ckRailPlace('wGps',false)});
  mo.observe($('#wGps'),{attributes:true,attributeFilter:['data-gs']});if($('#pfdHost'))mo.observe($('#pfdHost'),{childList:true})}
function ckFocus(f,quiet){if(!FX_GROUPS[f])f='all';const split=document.documentElement.getAttribute('data-split')==='ck';if(split&&quiet&&!SPLIT.set)f=SPLIT.f; /* 분할 중 자동 복원은 지금 보기 유지 */if(split&&f==='all')f='gps';if(split)SPLIT.f=f; // 화면 분할 중엔 한 창씩(전체 = 속도계), 고른 보기는 저장하지 않고 끝나면 원래 보기로
  const on=isCk2()&&f!=='all';
  appEl.classList.toggle('FX',on);if(on)document.documentElement.style.setProperty('--fxN',String(FX_GROUPS[f].length));
  document.querySelectorAll('#app>.win').forEach(w=>{const sel=on&&FX_GROUPS[f].includes(w.id);w.classList.toggle('fx',sel);if(sel)w.classList.remove('collapsed')});
  ckRailPlace(isCk2()?(on?FX_GROUPS[f][0]:'wGps'):null,on&&FX_GROUPS[f].length>1); // 창이 보인 뒤에 위치를 재야 제목줄 높이가 맞음
  document.querySelectorAll('#ckRail button[data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f===(on?f:'all')));
  if(isCk2()&&!split)store.set('ckFocus',f);
  if(on){let top=0;for(let e=appEl;e;e=e.offsetParent)top+=e.offsetTop; /* 스크롤과 무관한 화면 위치 */document.documentElement.style.setProperty('--fxTop',Math.round(top+28)+'px');if(!quiet)window.scrollTo({top:0,behavior:'smooth'});
    setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}try{if(mapObj)mapObj.invalidateSize()}catch(e){}if(f==='map'&&mapPref==='on')mapUpdate(true)},120)}}
$('#ckRail').addEventListener('click',e=>{const o=e.target.closest('button[data-open]');if(o){if(o.__long){o.__long=false;return}navPick(o);return}const b=e.target.closest('button[data-f]');if(!b)return;if(b.dataset.f==='set'){openSettings();return}ckFocus(b.dataset.f)});
window.addEventListener('resize',()=>{if(appEl.classList.contains('FX'))ckFocus(document.documentElement.getAttribute('data-split')==='ck'?SPLIT.f:store.get('ckFocus','all'),true)});


// 콕핏 2 측면 [T맵]·[네이버지도]: 누르면 위/아래 고르기, 길게 누르면 마지막 위치로 바로 열기(가로 화면은 안드로이드가 옆에 붙임)
const navAt=id=>store.get('navAt_'+id,'bottom');
function navLabels(){document.querySelectorAll('#ckRail button[data-open]').forEach(b=>{const em=b.querySelector('em');if(em)em.textContent=navAt(b.dataset.open)==='top'?'▲ 위':'▼ 아래'})}
function navGo(id,at){store.set('navAt_'+id,at);navLabels();navPickClose();navOpen(id,at)}
function navPickClose(){const p=$('#navPick');if(p){p.hidden=true;p.dataset.id=''}clearTimeout(navPickClose.t)}
function navPick(btn){const id=btn.dataset.open,a=NAV[id],p=$('#navPick');
  if(p.dataset.id===id&&!p.hidden){navPickClose();return}
  if(innerWidth>innerHeight&&NB&&NB.openApp){navGo(id,navAt(id));return} // 가로 화면: 위/아래 구분이 없어 바로 엶
  p.dataset.id=id;p.querySelector('b').textContent=a.name+' 열 위치';
  p.querySelectorAll('button[data-at]').forEach(x=>x.classList.toggle('on',x.dataset.at===navAt(id)));
  p.hidden=false;const r=btn.getBoundingClientRect(),pr=p.getBoundingClientRect();
  p.style.left=Math.min(innerWidth-pr.width-8,r.right+8)+'px';p.style.top=Math.max(8,Math.min(innerHeight-pr.height-8,r.top+r.height/2-pr.height/2))+'px';
  clearTimeout(navPickClose.t);navPickClose.t=setTimeout(navPickClose,8000)}
$('#navPick').addEventListener('click',e=>{const b=e.target.closest('button[data-at]');if(b)navGo($('#navPick').dataset.id,b.dataset.at)});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#navPick,#ckRail button[data-open]'))navPickClose()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')navPickClose()});
document.querySelectorAll('#ckRail button[data-open]').forEach(b=>{let t=0,x0=0,y0=0;
  b.addEventListener('pointerdown',e=>{clearTimeout(t);b.__long=false;x0=e.clientX;y0=e.clientY;t=setTimeout(()=>{b.__long=true;navPickClose();navGo(b.dataset.open,navAt(b.dataset.open));try{navigator.vibrate&&navigator.vibrate(30)}catch(x){}},550)});
  b.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-x0,e.clientY-y0)>12)clearTimeout(t)}); // 손가락이 움직이면(스크롤) 취소
  ['pointerup','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>clearTimeout(t)));
  b.addEventListener('contextmenu',e=>e.preventDefault())});
navLabels();
