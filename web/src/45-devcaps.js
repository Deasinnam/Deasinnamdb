// 스피드미터 [GPS 켜기] 줄 아래: 기기 지원 표시(GPS · 방향 센서 · LTE · 5G · Wi-Fi · 블루투스) 자동 확인
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 상태: on(지원·사용 중) off(지원·꺼짐) yes(지원) no(없음) unk(확인 불가). 앱이 아닌 미리보기에서는 '앱에서 확인' */
const DEVCAPS=[['gps','GPS'],['compass','방향 센서'],['lte','LTE'],['nr','5G'],['wifi','Wi-Fi'],['bt','블루투스']];
const devCapsEl=(()=>{const d=document.createElement('div');d.className='devcaps';d.id='devCaps';d.setAttribute('role','list');d.setAttribute('aria-label','기기 지원');
  d.innerHTML='<b class="dc-h">기기 지원</b>'+DEVCAPS.map(([k,n])=>`<span class="dc" role="listitem" data-k="${k}" data-s="unk"><i aria-hidden="true"></i><em>${n}</em><small>…</small></span>`).join('');return d})();
function devCapsRead(){let r=null;try{if(NB&&NB.deviceCaps)r=JSON.parse(NB.deviceCaps()||'{}')}catch(e){r=null}return r}
function devCapsRender(){const r=devCapsRead();
  for(const [k,n] of DEVCAPS){const el=devCapsEl.querySelector(`[data-k="${k}"]`),c=r&&r[k],s=c&&c.s||'unk',t=c&&c.t||(r?'확인 불가':'앱에서 확인');
    el.dataset.s=s;el.querySelector('small').textContent=t;el.title=`${n}: ${t}`}}
function devCapsPlace(){const w=$('#wGps');if(!w)return;const tools=w.dataset.gs==='cockpit'&&w.querySelector('#pfdHost .pfd-tools');
  const after=tools||w.querySelector('.gctl');if(after&&after.nextElementSibling!==devCapsEl)after.after(devCapsEl)}
devCapsPlace();devCapsRender();
{const mo=new MutationObserver(()=>devCapsPlace());mo.observe($('#wGps'),{attributes:true,attributeFilter:['data-gs']});if($('#pfdHost'))mo.observe($('#pfdHost'),{childList:true})}
setInterval(()=>{if(!document.hidden)devCapsRender()},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)devCapsRender()});
window.AmpDevCaps={render:devCapsRender};
