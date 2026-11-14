// 위쪽 도구 줄 아이콘만 + 로고 아래 날짜 띠
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 1.69 콕핏 스킨(:root[data-ck2]) 위쪽 ----------
 *  - 도구 줄 버튼(내 음악·외부 앱·화면·스킨·간편 모드·설정·라디오·후진·음악 추가)은 글자 없이 아이콘만, 작게.
 *    글자는 span.tl로 감싸 CSS로 숨기고 이름은 aria-label·title로(읽어 주기·길게 누르기)
 *  - 계기 4개(시계·날씨·나침반·밝기) 아래 글자는 숨겨 높이를 맞추고, 날짜·요일은 로고 아래 얇은 띠(#dStrip)에 */
const IconBar=(()=>{
  const ICO={
    local:'<path d="M17 3v11.2A3.5 3.5 0 1 1 15 11V6.5L9 8v8.2A3.5 3.5 0 1 1 7 13V5.5z"/>',
    ext:'<path d="M4 4h7v2H6v12h12v-5h2v7H4zM14 4h6v6h-2V7.4l-6.3 6.3-1.4-1.4L16.6 6H14z"/>',
    layout:'<path d="M3 4h18v14H3zm2 2v10h6V6zm8 0v4h6V6zm0 6v4h6v-4zM8 20h8v2H8z"/>',
    drive:'<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 0 1 7.7 6H15a3 3 0 0 0-6 0H4.3A8 8 0 0 1 12 4zM4.1 12h4.4l2.3 7.9A8 8 0 0 1 4.1 12zm9.1 7.9 2.3-7.9h4.4a8 8 0 0 1-6.7 7.9zM12 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>',
    add:'<path d="M15 3v9.2A3.5 3.5 0 1 1 13 9V3zM19 13h2v3h3v2h-3v3h-2v-3h-3v-2h3z"/>'};
  const svg=k=>'<svg class="ico tb-ico" viewBox="0 0 24 24" aria-hidden="true">'+ICO[k]+'</svg>';
  const tidy=s=>s.replace(/\s+/g,' ').trim();
  // 버튼 안의 글자(텍스트 노드)를 span.tl로 감싸고 이름표를 붙임
  function wrap(b,name){if(!b||b.dataset.ib)return;b.dataset.ib='1';
    const txt=tidy([...b.childNodes].filter(n=>n.nodeType===3||(n.nodeType===1&&!n.matches('svg,b,.emo,.tl'))).map(n=>n.textContent).join(' '));
    [...b.childNodes].forEach(n=>{if(n.nodeType===3&&n.textContent.trim()){const s=document.createElement('span');s.className='tl';s.textContent=n.textContent;b.replaceChild(s,n)}});
    const nm=name||txt;if(nm){if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',nm);if(!b.title)b.title=nm}}
  function addIco(b,k){if(b&&!b.querySelector('.tb-ico'))b.insertAdjacentHTML('afterbegin',svg(k))}
  const sl=$('#srcSeg button[data-src="local"]'),se=$('#srcSeg button[data-src="ext"]');
  addIco(sl,'local');wrap(sl,'내 음악');addIco(se,'ext');wrap(se,'외부 앱');
  addIco($('#driveBtn'),'drive');wrap($('#driveBtn'),'간편 모드');
  addIco($('#addTop'),'add');wrap($('#addTop'),'음악 추가');
  wrap($('#skinBtn'),'스킨 바꾸기');wrap($('#setBtn'),'설정');wrap($('#radioBtn'),'라디오');wrap($('#revBtn'),'후진 카메라');
  // 화면(배치) 고르기: '화면' 글자 대신 화면 아이콘
  const lw=$('label.selw[for="layout"]');if(lw&&!lw.dataset.ib){lw.dataset.ib='1';[...lw.childNodes].forEach(n=>{if(n.nodeType===3&&n.textContent.trim()){const s=document.createElement('span');s.className='tl';s.textContent=n.textContent;lw.replaceChild(s,n)}});lw.insertAdjacentHTML('afterbegin',svg('layout'));const sel=$('#layout');if(sel&&!sel.getAttribute('aria-label'))sel.setAttribute('aria-label','화면 배치')}
  // 로고 아래 날짜 띠
  const brand=$('header.top .brand');let strip=null;
  let inner=null;
  // 띠는 로고 칸(.brand)과 한 덩어리로 묶어 바로 아래에 — 넓은 화면에서 시계·도구 줄이 한 줄로 이어지는 배치를 깨지 않게
  if(brand){const wrapEl=document.createElement('div');wrapEl.className='brandwrap';brand.before(wrapEl);wrapEl.appendChild(brand);
    strip=document.createElement('div');strip.id='dStrip';strip.className='dstrip';inner=document.createElement('span');inner.className='dsi';strip.appendChild(inner);wrapEl.appendChild(strip)}
  function fit(){}
  const W=['일','월','화','수','목','금','토'];
  function tick(){if(!inner)return;const d=new Date(),t=d.getFullYear()+'. '+(d.getMonth()+1)+'. '+d.getDate()+'. ('+W[d.getDay()]+')';if(inner.textContent!==t)inner.textContent=t;fit()}
  tick();setInterval(tick,30000);
  return {tick,fit}})();
window.AmpIconBar=IconBar;
