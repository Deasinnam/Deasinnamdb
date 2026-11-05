// 콕핏 2 세로 바로가기
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 콕핏 2: 세로 바로가기(고른 창만 꽉 차게, 전체로 돌아가기) ---------- */
// 콕핏 2 바로가기: 모두 한 창씩, 스피드미터와 같은 크기(바꿔도 화면 크기가 그대로)
const FX_GROUPS={gps:['wGps'],map:['wMap'],cam:['wCam'],radio:['wRadio']};
const ckRailHome=document.createComment('ckRail');$('#ckRail').before(ckRailHome);
function ckRailPlace(hostId,span){const r=$('#ckRail');document.querySelectorAll('.win.hasrail').forEach(w=>w.classList.remove('hasrail'));appEl.classList.remove('RL');r.classList.remove('inapp');
  if(!isCk2()||!hostId){ckRailHome.after(r);return}
  if(span){appEl.prepend(r);r.classList.add('inapp');appEl.classList.add('RL');return} // 위아래로 나눈 화면: 두 창 옆에 세로로 길게
  const h=$('#'+hostId);if(!h)return;const bar=h.querySelector(':scope>.bar');h.insertBefore(r,bar?bar.nextSibling:h.firstChild);h.classList.add('hasrail');
  h.style.setProperty('--rail-top',(bar?bar.offsetHeight+8:10)+'px')}
function ckFocus(f,quiet){if(!FX_GROUPS[f])f='all';const split=document.documentElement.hasAttribute('data-split');if(split&&f!=='all'){SPLIT.prevFocus=f;f='all'} // 화면 분할 중엔 보기 전환을 미뤘다가 끝나면 되돌림
  const on=isCk2()&&f!=='all';
  appEl.classList.toggle('FX',on);if(on)document.documentElement.style.setProperty('--fxN',String(FX_GROUPS[f].length));
  document.querySelectorAll('#app>.win').forEach(w=>{const sel=on&&FX_GROUPS[f].includes(w.id);w.classList.toggle('fx',sel);if(sel)w.classList.remove('collapsed')});
  ckRailPlace(isCk2()?(on?FX_GROUPS[f][0]:'wGps'):null,on&&FX_GROUPS[f].length>1); // 창이 보인 뒤에 위치를 재야 제목줄 높이가 맞음
  document.querySelectorAll('#ckRail button[data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f===(on?f:'all')));
  if(isCk2()&&!split)store.set('ckFocus',f);
  if(on){let top=0;for(let e=appEl;e;e=e.offsetParent)top+=e.offsetTop; /* 스크롤과 무관한 화면 위치 */document.documentElement.style.setProperty('--fxTop',Math.round(top+28)+'px');if(!quiet)window.scrollTo({top:0,behavior:'smooth'});
    setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}try{if(mapObj)mapObj.invalidateSize()}catch(e){}if(f==='map'&&mapPref==='on')mapUpdate(true)},120)}}
$('#ckRail').addEventListener('click',e=>{const o=e.target.closest('button[data-open]');if(o){if(o.__long){o.__long=false;return}navPick(o);return}const b=e.target.closest('button[data-f]');if(!b)return;if(b.dataset.f==='set'){openSettings();return}ckFocus(b.dataset.f)});
window.addEventListener('resize',()=>{if(appEl.classList.contains('FX'))ckFocus(store.get('ckFocus','all'),true)});


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
