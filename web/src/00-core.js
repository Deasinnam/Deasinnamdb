// 공통: 도우미($·store), 앱 연결(NB), 스킨·배치
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
const $=s=>document.querySelector(s);
const NB=window.__AmpNB||window.AndroidBridge||null;
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
const SKINS=[['blue','대신남 블루'],['amber','클래식 앰버'],['base','베이스 그린'],['neon','네온 시티'],['ice','아이스 크롬'],['red','레드 라인'],['wood','우드 하이파이'],['carnival','대신남 자동차 모드'],['carnival2','대신남 자동차 모드 · 콕핏'],['carnival3','대신남 자동차 모드 · 콕핏 2'],['carnival4','대신남 자동차 모드 · 콕핏 3'],['carnival5','대신남 자동차 모드 · 콕핏 수정판'],['drive','대신남 드라이브'],['tablet','대신남 태블릿 가로모드'],['tablet2','대신남 태블릿 가로모드 2']];
const CAR_SKINS=['carnival','carnival2','carnival3','carnival4','carnival5','drive','tablet','tablet2'];const isTab=()=>skin==='tablet'||skin==='tablet2';const isCk2=()=>skin==='carnival3'||skin==='carnival4'||skin==='carnival5';const isCp=()=>skin==='carnival2'||isCk2();const isCk=()=>isCp()||isTab();const isCar=()=>CAR_SKINS.includes(skin);
const store={get(k,d){try{const v=localStorage.getItem('dna_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('dna_'+k,JSON.stringify(v))}catch(e){}}};

let gains=store.get('gains',PRESETS.Flat.slice()), pre=store.get('pre',0), eqOn=store.get('eqOn',true);
let vol=store.get('vol',80), bal=store.get('bal',0), shuffle=store.get('shuf',false), repeat=store.get('rep','all'), visMode=store.get('vis',0);
let skin=store.get('skin2','carnival5'), layoutMode=store.get('layout','auto'), mode=HAS_EXT?store.get('mode','local'):'local'; // 처음 설치: 콕핏 2(전체 보기·콕핏 PFD·아날로그 시계)
// 1.17: 콕핏 2를 쓰던 기기는 한 번 '콕핏 수정판'으로 바꿈(스킨에서 언제든 콕핏 2로 되돌릴 수 있음)
if(skin==='carnival3'&&!store.get('ckrSwitched',false)){skin='carnival5';store.set('skin2',skin);window.__ckrNote=1}store.set('ckrSwitched',true);
let list=[], cur=-1, showRemain=false, seeking=false, volDrag=false, wake=null;

/* ---------- skin & layout ---------- */
let C={};
function readSkin(){const cs=getComputedStyle(document.documentElement);const g=k=>cs.getPropertyValue(k).trim();
  C={text:g('--lcd-text'),glow:g('--lcd-glow'),l1:g('--led1'),l2:g('--led2'),l3:g('--led3'),l4:g('--led4'),peak:g('--peak'),off:g('--led-off'),grid:g('--grid'),dim:g('--lcd-dim'),fg:g('--lcd-fg'),edge:g('--lcd-edge'),cp:g('--copper')||'#e0803a',cphi:g('--copper-hi')||'#ffb27a',cplo:g('--hot-c')||'#8a4316'}}
function setSkin(k){setSkin0(k);try{pwrApply()}catch(e){}}
function setSkin0(k){if(!SKINS.some(s=>s[0]===k))k='blue';skin=k;document.documentElement.dataset.skin=(k==='carnival3'||k==='carnival4'||k==='carnival5')?'carnival2':k;if(k==='carnival3'||k==='carnival4'||k==='carnival5')document.documentElement.dataset.ck2='1';else delete document.documentElement.dataset.ck2;if(k==='carnival4')document.documentElement.dataset.ck3='1';else delete document.documentElement.dataset.ck3;if(k==='carnival5')document.documentElement.dataset.ckr='1';else delete document.documentElement.dataset.ckr;if(k==='tablet2'){document.documentElement.dataset.tk2='1';document.documentElement.dataset.skin='tablet'}else delete document.documentElement.dataset.tk2;if(CAR_SKINS.includes(k))document.documentElement.dataset.car='1';else delete document.documentElement.dataset.car;const nm=k==='carnival'?'Daesinnam Car Mode':(k==='carnival2'||k==='carnival3'||k==='carnival4'||k==='carnival5')?'Daesinnam One':'Daesinnam Amp';document.querySelector('.brand').setAttribute('aria-label',nm);$('#mainTitle').textContent=nm;if(typeof layout==='function'&&appEl)layout();if(typeof gpsSkinChanged==='function')gpsSkinChanged();if(typeof cockpitSkin==='function')cockpitSkin();try{applySizes()}catch(e){}if(typeof ckFocus==='function')ckFocus((k==='carnival3'||k==='carnival4'||k==='carnival5')?store.get('ckFocus','all'):'all',true);store.set('skin2',k);$('#skin').value=k;readSkin();drawCurve()}
SKINS.forEach(([k,n])=>{const o=document.createElement('option');o.value=k;o.textContent=n;$('#skin').appendChild(o)});
$('#skin').onchange=e=>{const k=e.target.value;setSkin(k);if((k==='carnival2'||k==='carnival3'||k==='carnival4'||k==='carnival5')&&typeof setGStyle==='function')setGStyle('cockpit')};
const appEl=$('#app');
function layout(){const w=window.innerWidth;let n=layoutMode==='auto'?(w>=1500?3:w>=900?2:1):+layoutMode;appEl.classList.remove('L2','L3');if(n>1)appEl.classList.add('L'+n);appEl.classList.toggle('G',isCar());appEl.classList.toggle('K',isCp());if(typeof applyWinOrder==='function')try{applyWinOrder()}catch(e){}}
$('#layout').value=layoutMode;$('#layout').onchange=e=>{layoutMode=e.target.value;store.set('layout',layoutMode);layout()};
window.addEventListener('resize',layout);

