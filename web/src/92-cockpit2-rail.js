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
function ckFocus(f,quiet){if(!FX_GROUPS[f])f='all';const on=isCk2()&&f!=='all';
  appEl.classList.toggle('FX',on);if(on)document.documentElement.style.setProperty('--fxN',String(FX_GROUPS[f].length));
  document.querySelectorAll('#app>.win').forEach(w=>{const sel=on&&FX_GROUPS[f].includes(w.id);w.classList.toggle('fx',sel);if(sel)w.classList.remove('collapsed')});
  ckRailPlace(isCk2()?(on?FX_GROUPS[f][0]:'wGps'):null,on&&FX_GROUPS[f].length>1); // 창이 보인 뒤에 위치를 재야 제목줄 높이가 맞음
  document.querySelectorAll('#ckRail button[data-f]').forEach(b=>b.classList.toggle('on',b.dataset.f===(on?f:'all')));
  if(isCk2())store.set('ckFocus',f);
  if(on){let top=0;for(let e=appEl;e;e=e.offsetParent)top+=e.offsetTop; // 스크롤과 무관한 화면 위치document.documentElement.style.setProperty('--fxTop',Math.round(top+28)+'px');if(!quiet)window.scrollTo({top:0,behavior:'smooth'});
    setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}try{if(mapObj)mapObj.invalidateSize()}catch(e){}if(f==='map'&&mapPref==='on')mapUpdate(true)},120)}}
$('#ckRail').addEventListener('click',e=>{const o=e.target.closest('button[data-open]');if(o){o.dataset.open==='nmap'?appBelow(NMAP_PKG,'네이버 지도'):appBelow(TMAP_PKG,'TMAP');return}const b=e.target.closest('button[data-f]');if(!b)return;if(b.dataset.f==='set'){openSettings();return}ckFocus(b.dataset.f)});
window.addEventListener('resize',()=>{if(appEl.classList.contains('FX'))ckFocus(store.get('ckFocus','all'),true)});

