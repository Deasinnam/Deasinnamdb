// 1.85 스킨 하나로(대신남 원 계열 — 대신남원·대신남 원·에어포스원·배포용 에어포스원)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 위 도구 줄 [스킨] 버튼은 없애고, 스피드미터 디자인 고르기(제목줄 #gStyleBar · 콕핏 컨트롤 #gStyle)에
 * '활주로 스킨' 3종(자동차 모드·에어라인·3D 맵)을 계기판 디자인과 함께 넣음.
 *  - 값 'sk:<스킨>' = 스킨 바꾸기(에어라인·3D 맵은 콕핏 PFD로), 나머지 값 = 계기판 디자인 그대로
 *  - 보이는 값: 콕핏 PFD를 쓰는 중이면 지금 스킨, 아니면 지금 계기판 디자인 */
const SKU=APP==='one';
function skuVal(){return gStyle==='cockpit'&&isCp()?'sk:'+(skinPref||skin):gStyle}
function skuSync(){if(!SKU)return;const v=skuVal();for(const id of ['#gStyleBar','#gStyle']){const s=$(id);if(s&&[...s.options].some(o=>o.value===v)&&s.value!==v)s.value=v}}
function skuPick(v){if(String(v).startsWith('sk:')){const k=v.slice(3),s=$('#skin');s.value=k;s.dispatchEvent(new Event('change'));if(k!=='carnival'&&isCp())setGStyle('cockpit');skuSync()}else setGStyle(v)}
if(SKU){document.documentElement.setAttribute('data-skuni','');
  for(const id of ['#gStyleBar','#gStyle']){const s=$(id);if(!s)continue;
    const gauges=[...s.options].filter(o=>o.value!=='cockpit');s.textContent='';
    const g1=document.createElement('optgroup');g1.label='활주로 스킨';
    for(const k of ONE_SKINS){const nm=(SKINS.find(x=>x[0]===k)||[,k])[1];g1.appendChild(new Option(nm,'sk:'+k))}
    const g2=document.createElement('optgroup');g2.label='계기판 디자인';gauges.forEach(o=>g2.appendChild(o));
    s.append(g1,g2);s.setAttribute('aria-label','스킨 · 계기판 디자인');s.onchange=e=>skuPick(e.target.value)}
  const _sg=setGStyle;setGStyle=function(k){_sg(k);skuSync()};
  const _ss=setSkin0;setSkin0=function(k){_ss(k);skuSync()};
  // 설정 창의 '스킨' 줄은 같은 고르기가 스피드미터에 있으니 숨김
  {const r=$('#sSkinSel');const row=r&&r.closest('.row');if(row)row.hidden=true}
  window.AmpSkinUni={pick:skuPick,value:skuVal};
  skuSync()}
