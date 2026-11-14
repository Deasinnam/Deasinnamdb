// NOW PLAYING 외부 입력 버튼
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 1.71 [⏏] 외부 입력: 라디오 전환 버튼 옆, 글자 없이 꺼내기(⏏) 모양.
 *  누르면 YouTube Music·Spotify 고르기 → 고른 앱으로 전환(AmpExt.start). 지금 쓰는 앱은 표시 ---------- */
const ExtInput=(()=>{const b=$('#bInput'),pk=$('#xinPick');if(!b||!pk)return null;
  function close(){pk.hidden=true;b.setAttribute('aria-expanded','false')}
  function open(){const cur=store.get('extPkg','');pk.querySelectorAll('[data-xin]').forEach(x=>x.classList.toggle('on',x.dataset.xin===cur&&mode==='ext'));
    pk.hidden=false;b.setAttribute('aria-expanded','true');
    const r=b.getBoundingClientRect(),pr=pk.getBoundingClientRect();
    pk.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,r.left+r.width/2-pr.width/2))+'px';pk.style.top=Math.max(8,r.top-pr.height-10)+'px';
    clearTimeout(close.t);close.t=setTimeout(close,10000)}
  b.addEventListener('click',e=>{e.stopPropagation();pk.hidden?open():close()});
  pk.addEventListener('click',e=>{const x=e.target.closest('[data-xin]');if(!x)return;e.stopPropagation();close();try{AmpExt.start(x.dataset.xin)}catch(er){}});
  document.addEventListener('pointerdown',e=>{if(!pk.hidden&&!e.target.closest('#xinPick,#bInput'))close()},true);
  return {open,close}})();
window.AmpExtInput=ExtInput;
