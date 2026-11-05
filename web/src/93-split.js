// 화면 분할(TMAP·네이버 지도 위·아래): 이 앱은 남은 칸(약 40%)에 맞게 스크롤 없이 따로 배치
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 분할 화면 배치: 넓으면 [속도계 | 플레이어], 좁으면 [속도계] + 아래 조작 줄 ---------- */
const SPLIT={on:false,ratio:1,f:'gps'};
function splitWanted(){return SPLIT.on&&SPLIT.ratio<.8&&store.get('splitLayout',true)!==false&&!isTab()}
// 콕핏 2(측면 버튼): 속도계 창 하나만 남은 칸에 꽉 차게, 측면 버튼으로 다른 보기로 바꿈("ck")
// 그 밖의 스킨: [속도계 | 플레이어] 또는 [속도계] + 아래 조작 줄("grid")
function splitApply(){const root=document.documentElement,want=splitWanted()?(isCk2()?'ck':'grid'):'',cur=root.getAttribute('data-split')||'';
  if(want===cur)return;
  if(want)root.setAttribute('data-split',want);else root.removeAttribute('data-split');
  if(want==='ck'){SPLIT.set=true;SPLIT.f='gps';try{ckFocus('gps',true)}finally{SPLIT.set=false}window.scrollTo(0,0)} // 분할 첫 화면은 속도계 창
  else if(cur==='ck'&&isCk2())ckFocus(store.get('ckFocus','all'),true); // 분할이 끝나면 원래 보기
  if(want==='grid')window.scrollTo(0,0);
  setTimeout(()=>{window.dispatchEvent(new Event('resize'));try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}},80)}
new MutationObserver(()=>splitApply()).observe(document.documentElement,{attributes:true,attributeFilter:['data-ck2']});
window.__split=o=>{o=o||{};SPLIT.on=!!o.on;SPLIT.ratio=+o.ratio||1;splitApply()};
window.AmpSplit={get on(){return document.documentElement.hasAttribute('data-split')},set:(on,ratio)=>window.__split({on,ratio:ratio==null?.4:ratio}),apply:splitApply};
$('#sSplit').checked=store.get('splitLayout',true)!==false;
$('#sSplit').onchange=e=>{store.set('splitLayout',e.target.checked);splitApply()};
try{if(NB&&NB.splitState)window.__split(JSON.parse(NB.splitState()))}catch(e){}
