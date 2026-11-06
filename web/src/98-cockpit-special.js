// 콕핏 스페셜 스킨(carnival6) 전용 배치: 플레이어+NOW PLAYING 한 창, 관제탑은 스피드미터 제목줄의 작은 표시, 블랙박스는 기본 접힘
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* NOW PLAYING(앨범·시각화)을 플레이어 창 안으로 옮기고, 스킨을 바꾸면 원래 창으로 되돌림 */
function cksNp(on){const art=document.querySelector('#wVis .art,#npMerge .art'),vb=document.querySelector('#wVis .visbox,#npMerge .visbox');
  if(on){let m=$('#npMerge');if(!m){m=document.createElement('div');m.id='npMerge';m.className='npmerge';$('#wMain .body').append(m)}
    if(art&&art.parentElement!==m)m.append(art);if(vb&&vb.parentElement!==m)m.append(vb)}
  else{const b=$('#wVis .body');if(b){if(art&&art.parentElement!==b)b.append(art);if(vb&&vb.parentElement!==b)b.append(vb)}}
  FX_GROUPS.vis=on?['wMain']:['wVis']}
/* 관제탑: 아래 창 대신 스피드미터 제목줄 옆 작은 표시(누르면 다시 점검) */
const atcMini=(()=>{const b=document.createElement('button');b.type='button';b.id='atcMini';b.className='atcmini';b.title='관제탑 — 누르면 다시 점검';
  b.innerHTML='<b>TWR</b><span>대기</span>';const bar=$('#wGps>.bar'),g=bar&&bar.querySelector('.groove');if(bar)bar.insertBefore(b,g||null);
  b.onclick=e=>{e.stopPropagation();const r=$('#atcRun');if(r)r.click()};return b})();
function atcMiniSync(){const w=$('#atcWarn'),c=$('#atcClr'),li=[...document.querySelectorAll('#atcLog li')].pop();let t,k='';
  if(w&&!w.hidden){t=(w.querySelector('b')||w).textContent.replace(/^⚠\s*/,'');k='warn'}
  else if(c&&!c.hidden){t='이륙 허가';k='ok'}
  else if(li){t=li.textContent.replace(/\s+/g,' ').trim().replace(/^TWR\s*/,'');k='run'}
  else t=($('#atcSt')&&$('#atcSt').textContent.replace(/^·\s*/,''))||'대기';
  atcMini.querySelector('span').textContent=t;atcMini.dataset.k=k}
if($('#wAtc'))new MutationObserver(()=>atcMiniSync()).observe($('#wAtc'),{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
atcMiniSync();
let cksWas=false;
function cksApply(){const on=isCks();cksNp(on);
  if(on&&!cksWas){const c=$('#wCam');if(c)c.classList.add('collapsed')} // 블랙박스는 처음엔 접어 둠(− 버튼으로 펴고 접기)
  cksWas=on;try{devCapsPlace();devCapsRender()}catch(e){}
  if(typeof ckFocus==='function'&&appEl.classList.contains('FX'))ckFocus(store.get('ckFocus','all'),true)}
new MutationObserver(cksApply).observe(document.documentElement,{attributes:true,attributeFilter:['data-cks']});
cksApply();
