// 배터리 절전, 후진 설정, 시작(boot)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 배터리: 절전 모드(자동/항상/끄기)와 재생 중 화면 켜 두기 ---------- */
let pwrBat=null;
function pwrRead(){try{if(NB&&NB.battery){pwrBat=JSON.parse(NB.battery());return pwrApply()}}catch(e){}
  try{navigator.getBattery&&navigator.getBattery().then(b=>{pwrBat={pct:Math.round(b.level*100),chg:b.charging};pwrApply()})}catch(e){}}
function pwrApply(){const m=store.get('pwrMode','auto'),low=!!(pwrBat&&!pwrBat.chg&&pwrBat.pct<=30);pwrSaver=m==='on'||(m==='auto'&&low);
  window.AmpPwr={saver:pwrSaver};document.documentElement.toggleAttribute('data-saver',pwrSaver);
  const n=$('#sPwrNow');if(n)n.textContent=(pwrBat?'배터리 '+pwrBat.pct+'%'+(pwrBat.chg?' · 충전 중':'')+' · ':'')+(pwrSaver?'지금 절전 모드 켜짐':'지금 절전 모드 꺼짐');
  document.querySelectorAll('#sPwr button').forEach(b=>b.classList.toggle('on',b.dataset.v===m));
  const sm=scrMode();document.querySelectorAll('#sScr button').forEach(b=>b.classList.toggle('on',b.dataset.v===sm));
  try{NB&&NB.setScreenAlways&&NB.setScreenAlways(sm==='always')}catch(e){}
  try{NB&&NB.setScreenOnPlay&&NB.setScreenOnPlay(sm!=='off')}catch(e){}}
/* 화면 켜 두기: always(기본, 앱이 켜진 동안 수면 모드 없음) · play(재생 중만) · off. 예전 값(auto/on)은 '항상'으로 */
function scrMode(){const v=store.get('scrMode2',null);return v==='play'||v==='off'?v:'always'}
$('#sPwr').onclick=e=>{const b=e.target.closest('button');if(!b)return;store.set('pwrMode',b.dataset.v);pwrApply()};
$('#sScr').onclick=e=>{const b=e.target.closest('button');if(!b)return;store.set('scrMode2',b.dataset.v);pwrApply()};
$('#revBtn').onclick=()=>window.AmpRev.toggle();
$('#sRevOn').checked=store.get('revOn',true)!==false;$('#sRevOn').onchange=e=>{store.set('revOn',e.target.checked);if(!e.target.checked)revSet(false)};
$('#sRevAuto').checked=!!store.get('revAuto',false);$('#sRevAuto').onchange=e=>{store.set('revAuto',e.target.checked);if(e.target.checked){try{attWant(true)}catch(x){}toast('자동 감지를 켰어요. 휴대폰이 차 앞쪽을 보게 거치돼 있어야 해요.')}};
function revVolUi(){const v=revVol();document.querySelectorAll('#sRevVol button[data-v]').forEach(b=>b.classList.toggle('on',Math.abs(+b.dataset.v-v)<.01))}revVolUi();
$('#sRevVol').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='sRevTest'){if(rev.on)revSet(false);else revSet(true,'test');return}store.set('revVol',+b.dataset.v);revVolUi()};
pwrRead();setInterval(pwrRead,60e3);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pwrRead()});
applySizes();setGStyle(isCp()?store.get('gStyleCk','cockpit'):gStyle);setSkin(skin);mapApply();layout();gpsUi();flags();syncOn();syncVis();renderList();setMode(mode,true);requestAnimationFrame(frame);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{readSkin();drawCurve()});
if(LIB){$('#addDir').hidden=false;$('#plHint').textContent='음악 파일이나 폴더를 고르면 목록이 저장돼서, 앱을 다시 켜도 그대로 남고 마지막 곡과 위치부터 이어서 들을 수 있어요. 폴더로 추가하면 새로 넣은 곡도 다시 추가하기 쉬워요.'}
const restored=restorePlaylist();
if(NB&&NB.takeCarAutoplay){try{if(NB.takeCarAutoplay())setTimeout(()=>window.__carConnected(''),1200)}catch(e){}}
if(!restored)(async()=>{
  try{
    const buf=await renderDemo();
    const art=demoArt();
    if(list.length)return; // 데모를 만드는 사이에 사용자가 곡을 추가했으면 데모는 넣지 않음
    list.unshift({title:'Neon Harbor (데모)',artist:'Daesinnam',url:URL.createObjectURL(toWav(buf)),size:buf.length*buf.numberOfChannels*2,duration:buf.duration,art});
    if(cur>=0)cur++;else cur=0;
    renderList();if(mode==='local'){updateMeta();audio.src=list[cur].url}
  }catch(e){if(mode==='local')setMarquee('“+ 음악 추가”를 눌러 파일을 불러오세요')}
})();
// 설정의 스킨·화면 배치(위 도구 줄과 같은 값) — 콕핏 수정판은 도구 줄에서 이 둘을 숨기고 설정에서 고름
(function(){const pairs=[['#sSkinSel','#skin'],['#sLayoutSel','#layout']];
  for(const [a,b] of pairs){const s=$(a),o=$(b);if(!s||!o)continue;s.innerHTML=o.innerHTML;s.value=o.value;
    s.onchange=()=>{o.value=s.value;o.dispatchEvent(new Event('change'))};o.addEventListener('change',()=>{s.value=o.value})}})();
// NOW PLAYING 빈 화면: 곡·라디오·외부 앱이 없으면 안내와 버튼
$('#npAdd').onclick=()=>pickMusic(false);$('#npRadio').onclick=()=>{try{openRadio()}catch(e){}};
function npEmptySync(){const has=(cur>=0&&list[cur])||rdPlaying||(mode==='ext'&&ext&&ext.title);$('#wVis').classList.toggle('np-empty',!has)}
npEmptySync();setInterval(npEmptySync,1000);
if(window.__skinNote)setTimeout(()=>{const n=(SKINS.find(x=>x[0]===window.__skinNote)||[,''])[1];toast('스킨을 정리했어요. 지금은 "'+n+'" 스킨이에요. 위 [🎨 스킨]에서 바꿀 수 있어요.')},1800);

/* 1.53 시험판: 처음 실행 안내, 설정의 시험판 정보, 안드로이드 등록용은 '앱이 꺼져 있어도 자동으로 열기'(다른 앱 위에 표시) 숨김 */
if(PUB){$('#secPub').hidden=false;$('#secPubH').hidden=false;$('#pubName').textContent=BUILD==='play'?'대신남 원 안드로이드 테스트용':'대신남 배포용 테스트';$('#pubNotice').onclick=()=>BuildNotice.show(true);setTimeout(()=>BuildNotice.show(false),400);
  try{$('#rdQ').placeholder='방송 이름 (KBS, MBC, SBS, CBS, EBS)';$('#rdCountry').closest('.rd-search').classList.add('pub')}catch(e){}}
if(PLAY){const r=$('#sLaunch');if(r){const row=r.closest('.row');if(row)row.hidden=true}}
