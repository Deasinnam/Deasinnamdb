// 1.76 스피드미터(PFD) 오른쪽 아래에 지금 재생 중인 노래 제목 — 상자 없이 녹색 글자만(계기 글씨처럼)
//  재생 중일 때만 보임(재생 버튼 불 = 내 음악·외부 앱·라디오 모두), 멈추면 사라짐
const PfdSong=(()=>{let el=null;
  function tick(){const w=document.querySelector('#pfdHost .pfd-canvas-wrap');if(!w||w.offsetParent===null)return;
    if(!el||!w.contains(el)){el=document.createElement('div');el.className='pfd-song';el.setAttribute('aria-live','polite');w.appendChild(el)}
    const t=(($('#npTitle')||{}).textContent||'').trim(),on=$('#bPlay')&&$('#bPlay').classList.contains('hot')&&t&&t!=='—';
    const txt=on?'♪ '+t:'';if(el.textContent!==txt)el.textContent=txt;el.hidden=!on}
  setInterval(()=>{if(!document.hidden)tick()},1000);
  return {tick,get text(){return el?el.textContent:''}}})();
window.PfdSong=PfdSong;
