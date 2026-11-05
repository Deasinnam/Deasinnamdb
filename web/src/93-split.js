// 화면 분할(TMAP·네이버 지도 위·아래): 이 앱은 남은 칸(약 40%)에 맞게 스크롤 없이 따로 배치
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 분할 화면 배치: 넓으면 [속도계 | 플레이어], 좁으면 [속도계] + 아래 조작 줄 ---------- */
const SPLIT={on:false,ratio:1,prevFocus:null};
function splitWanted(){return SPLIT.on&&SPLIT.ratio<.8&&store.get('splitLayout',true)!==false&&!isTab()}
function splitApply(){const want=splitWanted(),root=document.documentElement;
  if(want===root.hasAttribute('data-split'))return;
  root.toggleAttribute('data-split',want);
  if(want){if(appEl.classList.contains('FX')||(isCk2()&&store.get('ckFocus','all')!=='all')){SPLIT.prevFocus=store.get('ckFocus','all');ckFocus('all',true)}
    window.scrollTo(0,0)}
  else if(SPLIT.prevFocus){const f=SPLIT.prevFocus;SPLIT.prevFocus=null;ckFocus(f,true)}
  setTimeout(()=>{window.dispatchEvent(new Event('resize'));try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}},80)}
window.__split=o=>{o=o||{};SPLIT.on=!!o.on;SPLIT.ratio=+o.ratio||1;splitApply()};
window.AmpSplit={get on(){return document.documentElement.hasAttribute('data-split')},set:(on,ratio)=>window.__split({on,ratio:ratio==null?.4:ratio}),apply:splitApply};
$('#sSplit').checked=store.get('splitLayout',true)!==false;
$('#sSplit').onchange=e=>{store.set('splitLayout',e.target.checked);splitApply()};
try{if(NB&&NB.splitState)window.__split(JSON.parse(NB.splitState()))}catch(e){}
