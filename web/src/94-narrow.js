// 좁은 화면(폴드7 좌우 반 가르기·바깥 화면·폰 세로) 정리
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 1.67 data-narrow ----------
 *  - 앱 창 폭이 520px 이하면 :root[data-narrow] — CSS가 창 머리줄 한 줄·라디오 표시창·플레이어 버튼 줄 등을 좁게 맞춤
 *  - 속도계 위 정보(최고 속도·주행 거리 등 6칸)는 좁은 화면에서 접어 두어 활주로 화면을 크게.
 *    계기 위 상태 줄(GPS · TRK, LIM 버튼 빼고)을 누르면 펼치기/접기(기억함) */
const Narrow=(()=>{const r=document.documentElement;
  function apply(){const n=innerWidth<=520;if(n!==r.hasAttribute('data-narrow')){r.toggleAttribute('data-narrow',n);setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}},60)}}
  r.toggleAttribute('data-metrics-open',!!store.get('narrowMetrics',false));
  document.addEventListener('click',e=>{const s=e.target.closest&&e.target.closest('#pfdHost .pfd-flight-meta');if(!s||e.target.closest('button')||!r.hasAttribute('data-narrow'))return;
    r.toggleAttribute('data-metrics-open');store.set('narrowMetrics',r.hasAttribute('data-metrics-open'));
    setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(x){}window.dispatchEvent(new Event('resize'))},40)});
  apply();addEventListener('resize',apply);
  return {apply,get on(){return r.hasAttribute('data-narrow')}}})();
window.AmpNarrow=Narrow;
