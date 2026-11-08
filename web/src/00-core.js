// 공통: 도우미($·store), 앱 연결(NB), 스킨·배치
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
const $=s=>document.querySelector(s);
const NB=window.__AmpNB||window.AndroidBridge||null;
/* 갤럭시 Z 폴드8 전용판(보라색은 앱 아이콘·실행 화면만, 앱 안 색은 일반판과 같음): 앱이 알려 주거나, 미리보기에서는 주소에 ?fold8 */
const IS_FOLD=(()=>{try{if(NB&&NB.buildDevice&&NB.buildDevice()==='fold8')return true}catch(e){}return /[?&#]fold8\b/.test(location.href)})();
if(IS_FOLD)document.documentElement.dataset.fold='1';
const HAS_EXT=!!(NB&&NB.extStatus);
const BANDS=[60,170,310,600,1000,3000,6000,12000,14000,16000];
const LBL=['60','170','310','600','1K','3K','6K','12K','14K','16K'];
const PRESETS={
  'Flat':[0,0,0,0,0,0,0,0,0,0],
  'Rock':[5,3,-3,-5,-2,2,5,6,6,6],
  'Pop':[-1,3,5,5,3,0,-1,-1,-1,-1],
  'Dance':[7,5,2,0,0,-3,-4,-4,0,0],
  'Bass Boost':[8,7,5,2,0,0,0,0,0,0],
  'Vocal':[-3,-2,0,3,5,5,3,1,0,-2],
  'Classical':[0,0,0,0,0,0,-5,-5,-5,-7],
  'Treble Boost':[-2,-2,-1,0,1,3,6,8,9,9],
  'Live':[-3,0,3,4,4,4,3,2,2,2]
};
const SKINS=[['blue','대신남 블루'],['amber','클래식 앰버'],['base','베이스 그린'],['neon','네온 시티'],['ice','아이스 크롬'],['red','레드 라인'],['wood','우드 하이파이'],['carnival','대신남 자동차 모드'],['carnival5','대신남 자동차 모드 · 콕핏'],['carnival4','대신남 자동차 모드 · 콕핏 그레이'],['carnival6','대신남 자동차 모드 · 콕핏 스페셜'],['carnival7','대신남 자동차 모드 · 콕핏 스페셜 2'],['tablet','대신남 태블릿 가로모드'],['tablet2','대신남 태블릿 가로모드 2']];
const CAR_SKINS=['carnival','carnival2','carnival3','carnival4','carnival5','carnival6','carnival7','drive','tablet','tablet2'];const isTab=()=>skin==='tablet'||skin==='tablet2';const isCk2=()=>skin==='carnival3'||skin==='carnival4'||skin==='carnival5'||skin==='carnival6'||skin==='carnival7';/* 원형 계기 색: 콕핏 스페셜 2는 황동 베젤·황동 나사·짙은 올리브 판 */
const DIAL=()=>document.documentElement.hasAttribute('data-cp')?{pl:['#2f3424','#12150d'],bz:['#f3d99c','#9a7638','#2e2210'],sc:['#fbe7b5','#7a5a2c'],ink:'#efe6cf'}:{pl:['#3a4236','#151a14'],bz:['#6b7468','#22281f','#0b0e0a'],sc:['#d9dee3','#4c535b'],ink:'#e7e9df'};
const isCks=()=>skin==='carnival6'||skin==='carnival7';const isCp=()=>skin==='carnival2'||isCk2();const isCk=()=>isCp()||isTab();const isCar=()=>CAR_SKINS.includes(skin);
const store={get(k,d){try{const v=localStorage.getItem('dna_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('dna_'+k,JSON.stringify(v))}catch(e){}}};

let gains=store.get('gains',PRESETS.Flat.slice()), pre=store.get('pre',0), eqOn=store.get('eqOn',true);
let vol=store.get('vol',80), bal=store.get('bal',0), shuffle=store.get('shuf',false), repeat=store.get('rep','all'), visMode=store.get('vis',0);
let skin=store.get('skin2',IS_FOLD?'carnival7':'carnival5'), layoutMode=store.get('layout','auto'), mode=HAS_EXT?store.get('mode','local'):'local'; // 처음 설치: 콕핏 2(전체 보기·콕핏 PFD·아날로그 시계)
// 1.18: 스킨 정리 — 콕핏·콕핏 2는 콕핏(예전 콕핏 수정판)으로, 드라이브는 자동차 모드로
{const M={carnival2:'carnival5',carnival3:'carnival5',drive:'carnival'};if(M[skin]){skin=M[skin];store.set('skin2',skin);window.__skinNote=skin}}store.set('ckrSwitched',true);
let list=[], cur=-1, showRemain=false, seeking=false, volDrag=false, wake=null;

/* ---------- skin & layout ---------- */
let C={};
function readSkin(){const cs=getComputedStyle(document.documentElement);const g=k=>cs.getPropertyValue(k).trim();
  C={bg:g('--lcd')||'#000',text:g('--lcd-text'),glow:g('--lcd-glow'),l1:g('--led1'),l2:g('--led2'),l3:g('--led3'),l4:g('--led4'),peak:g('--peak'),off:g('--led-off'),grid:g('--grid'),dim:g('--lcd-dim'),fg:g('--lcd-fg'),edge:g('--lcd-edge'),cp:g('--copper')||'#e0803a',cphi:g('--copper-hi')||'#ffb27a',cplo:g('--hot-c')||'#8a4316'}}
function setSkin(k){setSkin0(k);try{pwrApply()}catch(e){}}
/* 1.47 태블릿 가로 배치는 가로가 넓은 화면(폭 760px 이상·높이 400px 이상·가로가 더 긴 화면)에서만 — 그보다 작거나 세로 화면이면 같은 기능의 콕핏 배치로 보여 줌(고른 스킨은 그대로 저장) */
let skinPref=null;const tabFits=()=>innerWidth>=760&&innerHeight>=400&&innerWidth>innerHeight*1.15;
function setSkin0(k){if(!SKINS.some(s=>s[0]===k))k='blue';skinPref=k;if((k==='tablet'||k==='tablet2')&&!tabFits())k='carnival5';skin=k;document.documentElement.dataset.skin=(k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')?'carnival2':k;if(k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')document.documentElement.dataset.ck2='1';else delete document.documentElement.dataset.ck2;if(k==='carnival4'||k==='carnival6')document.documentElement.dataset.ck3='1';else delete document.documentElement.dataset.ck3;if(k==='carnival6'||k==='carnival7')document.documentElement.dataset.cks='1';else delete document.documentElement.dataset.cks;if(k==='carnival7')document.documentElement.dataset.cp='1';else delete document.documentElement.dataset.cp;if(k==='carnival5'||k==='carnival7')document.documentElement.dataset.ckr='1';else delete document.documentElement.dataset.ckr;if(k==='tablet2'){document.documentElement.dataset.tk2='1';document.documentElement.dataset.skin='tablet'}else delete document.documentElement.dataset.tk2;if(CAR_SKINS.includes(k))document.documentElement.dataset.car='1';else delete document.documentElement.dataset.car;const nm=k==='carnival'?'Daesinnam Car Mode':(k==='carnival2'||k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')?'Daesinnam One':'Daesinnam Amp';document.querySelector('.brand').setAttribute('aria-label',nm);$('#mainTitle').textContent=nm;if(typeof layout==='function'&&appEl)layout();if(typeof gpsSkinChanged==='function')gpsSkinChanged();if(typeof cockpitSkin==='function')cockpitSkin();try{applySizes()}catch(e){}if(typeof ckFocus==='function')ckFocus((k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')?store.get('ckFocus','all'):'all',true);store.set('skin2',skinPref);$('#skin').value=skinPref;document.documentElement.toggleAttribute('data-tabfold',skinPref!==k);readSkin();drawCurve()}
SKINS.forEach(([k,n])=>{const o=document.createElement('option');o.value=k;o.textContent=n;$('#skin').appendChild(o)});
$('#skin').onchange=e=>{const k=e.target.value;setSkin(k);if((k==='carnival2'||k==='carnival3'||k==='carnival4'||k==='carnival5'||k==='carnival6'||k==='carnival7')&&typeof setGStyle==='function')setGStyle('cockpit')};
const appEl=$('#app');
function layout(){const w=window.innerWidth;let n=layoutMode==='auto'?(w>=1500?3:w>=900?2:1):+layoutMode;appEl.classList.remove('L2','L3');if(n>1)appEl.classList.add('L'+n);appEl.classList.toggle('G',isCar());appEl.classList.toggle('K',isCp());if(typeof applyWinOrder==='function')try{applyWinOrder()}catch(e){}}
$('#layout').value=layoutMode;$('#layout').onchange=e=>{layoutMode=e.target.value;store.set('layout',layoutMode);layout()};
window.addEventListener('resize',layout);
window.addEventListener('resize',()=>{if((skinPref==='tablet'||skinPref==='tablet2')&&((skin===skinPref)!==tabFits())){clearTimeout(window.__tabT);window.__tabT=setTimeout(()=>setSkin0(skinPref),150)}});

