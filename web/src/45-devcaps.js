// 스피드미터 [GPS 켜기] 줄 아래: 기기 지원 표시(GPS · 방향 센서 · LTE · 5G · Wi-Fi · 블루투스) 자동 확인
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 상태: on(지원·사용 중) off(지원·꺼짐) yes(지원) no(없음) unk(확인 불가). 앱이 아닌 미리보기에서는 '앱에서 확인' */
const DEVCAPS=[['gps','GPS'],['compass','방향 센서'],['lte','LTE'],['nr','5G'],['wifi','Wi-Fi'],['bt','블루투스']];
const devCapsEl=(()=>{const d=document.createElement('div');d.className='devcaps';d.id='devCaps';d.setAttribute('role','list');d.setAttribute('aria-label','기기 지원');
  d.innerHTML='<button type="button" class="dc-h" aria-expanded="true">기기 지원<span class="dc-sum"></span><i class="dc-car" aria-hidden="true">▾</i></button>'+DEVCAPS.map(([k,n])=>`<span class="dc" role="listitem" data-k="${k}" data-s="unk"><i aria-hidden="true"></i><em>${n}</em><small>…</small></span>`).join('');return d})();
/* 접기: 콕핏 스페셜은 기본 접힘(누르면 펼침), 사용자가 바꾼 상태는 기억 */
function devCapsFolded(){const v=store.get('devCapsFold',null);return v===null?isCks():!!v}
function devCapsFoldUi(){const f=devCapsFolded();devCapsEl.classList.toggle('fold',f);devCapsEl.querySelector('.dc-h').setAttribute('aria-expanded',String(!f))}
devCapsEl.querySelector('.dc-h').onclick=()=>{store.set('devCapsFold',!devCapsFolded());devCapsFoldUi()};
function devCapsRead(){let r=null;try{if(NB&&NB.deviceCaps)r=JSON.parse(NB.deviceCaps()||'{}')}catch(e){r=null}return r}
function devCapsRender(){const r=devCapsRead();
  for(const [k,n] of DEVCAPS){const el=devCapsEl.querySelector(`[data-k="${k}"]`),c=r&&r[k],s=c&&c.s||'unk',t=c&&c.t||(r?'확인 불가':'앱에서 확인');
    el.dataset.s=s;el.querySelector('small').textContent=t;el.title=`${n}: ${t}`}
  const all=[...devCapsEl.querySelectorAll('.dc')].map(e=>e.dataset.s),ok=all.filter(x=>x==='on'||x==='off'||x==='yes').length,no=all.filter(x=>x==='no').length;
  devCapsEl.querySelector('.dc-sum').textContent=r?` · 지원 ${ok}`+(no?` · 없음 ${no}`:'')+(all.length-ok-no?` · 확인 불가 ${all.length-ok-no}`:''):' · 앱에서 확인';devCapsFoldUi()}
/* 콕핏 스페셜: 스피드미터의 [GPS 켜기] 버튼 줄도 조종 패널 아래로(패널이 안 보이면 제자리) */
let pfdToolsHome=null;
function pfdToolsPlace(deckVis){const t=document.querySelector('.pfd-tools');if(!t)return false;
  if(isCks()&&deckVis){if(!pfdToolsHome){pfdToolsHome=document.createComment('pfdTools');t.before(pfdToolsHome)}const deck=$('#dkControlDeck');if(deck.nextElementSibling!==t)deck.after(t);t.classList.add('in-ctl');return true}
  if(pfdToolsHome&&pfdToolsHome.nextSibling!==t)pfdToolsHome.after(t);t.classList.remove('in-ctl');return false}
/* 자리: 조종 패널(COCKPIT CONTROL)이 보이면 그 버튼들 아래, 아니면 스피드미터 [GPS 켜기] 줄 아래 */
function devCapsPlace(){const deck=$('#dkControlDeck'),vis=!!(deck&&deck.offsetParent),moved=pfdToolsPlace(vis);
  if(vis){const a=moved?document.querySelector('.pfd-tools'):deck;if(a.nextElementSibling!==devCapsEl)a.after(devCapsEl);return}
  const w=$('#wGps');if(!w)return;const tools=w.dataset.gs==='cockpit'&&w.querySelector('#pfdHost .pfd-tools');
  const after=tools||w.querySelector('.gctl');if(after&&after.nextElementSibling!==devCapsEl)after.after(devCapsEl)}
devCapsPlace();devCapsRender();
{let q=0;const mo=new MutationObserver(()=>{if(!q)q=setTimeout(()=>{q=0;devCapsPlace()},60)});mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-skin','data-ck2','data-split','data-cks']});if($('#app'))mo.observe($('#app'),{attributes:true,attributeFilter:['class','hidden'],subtree:true});mo.observe($('#wGps'),{attributes:true,attributeFilter:['data-gs']});if($('#pfdHost'))mo.observe($('#pfdHost'),{childList:true})}
setInterval(()=>{if(!document.hidden){devCapsPlace();devCapsRender()}},15000);addEventListener('load',()=>setTimeout(devCapsPlace,300));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)devCapsRender()});
window.AmpDevCaps={render:devCapsRender};
