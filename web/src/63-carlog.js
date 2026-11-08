/* 1.42 차계부: 기본은 접힌 창. 펼치면 연료 종류(휘발유·경유·전기차)에 맞는 소모품 교환 목록을 체크하고, 주유·충전 기록과 연비·전비를 봄.
 *  - 체크 = 이번 주기에 교환함(그때의 누적 주행거리·날짜 기록). 주기가 지나면 저절로 풀리고 "교환 필요"로 바뀜. 체크를 풀면 마지막 기록을 되돌림
 *  - 누적 주행거리는 직접 입력하고, 원하면 GPS로 달린 거리를 자동으로 더함
 *  - 주기는 일반적인 권장값이며 항목마다 고칠 수 있음(제조사 정비 안내가 우선) */
const AmpLog=(()=>{
  const COMMON=[['ac','에어컨 필터',10000,6],['bfl','브레이크 오일',40000,24],['bpad','브레이크 패드',40000,0],['rot','타이어 위치 교환',10000,0],['tire','타이어 교체',50000,48],['wiper','와이퍼 블레이드',0,12],['b12','배터리(12V)',0,48]];
  const DEF={
    gas:[['oil','엔진오일 · 오일필터',10000,12],['air','에어클리너 필터',20000,24],['plug','점화플러그',80000,0],['atf','미션오일',60000,0],['cool','냉각수(부동액)',60000,48],...COMMON],
    diesel:[['oil','엔진오일 · 오일필터',10000,12],['fuelf','연료필터',30000,24],['air','에어클리너 필터',20000,24],['urea','요소수 보충',8000,0],['atf','미션오일',60000,0],['cool','냉각수(부동액)',60000,48],['glow','글로우 플러그',100000,0],...COMMON],
    ev:[['hv','고전압 배터리 점검',20000,12],['red','감속기 오일 점검',60000,0],['evcool','전장 냉각수',100000,60],...COMMON.map(r=>r[0]==='bpad'?['bpad','브레이크 패드(회생제동)',60000,0]:r[0]==='tire'?['tire','타이어 교체',40000,48]:r)]};
  const FUEL={gas:{n:'휘발유',u:'L',fill:'주유',eff:'연비',effU:'km/L'},diesel:{n:'경유',u:'L',fill:'주유',eff:'연비',effU:'km/L'},ev:{n:'전기차',u:'kWh',fill:'충전',eff:'전비',effU:'km/kWh'}};
  let S=Object.assign({fuel:'gas',odo:0,auto:true,items:{},custom:[],fills:[]},store.get('carlog',{}));
  const save=()=>store.set('carlog',S);
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const fmt=n=>Math.round(n).toLocaleString('ko-KR');
  const kmT=n=>n>=10000&&n%10000===0?(n/10000)+'만 km':fmt(n)+' km';
  const months=(a,b)=>{const x=new Date(a),y=new Date(b);return (y-x)/(1000*60*60*24*30.44)};
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function list(){return DEF[S.fuel].map(([id,name,ikm,imo])=>{const o=S.items[S.fuel+':'+id]||{};return {key:S.fuel+':'+id,name,ikm:o.ikm??ikm,imo:o.imo??imo,hist:o.hist||[]}})
    .concat(S.custom.filter(c=>!c.fuel||c.fuel===S.fuel).map(c=>{const o=S.items['c:'+c.id]||{};return {key:'c:'+c.id,name:c.name,ikm:o.ikm??c.ikm,imo:o.imo??c.imo,hist:o.hist||[],custom:c.id}}))}
  /* 남은 비율(0~1, 0 이하면 교환 필요)과 안내 글 */
  function status(it){const last=it.hist[it.hist.length-1];if(!last)return {r:null,due:false,txt:'기록 없음'};
    let r=1,parts=[];
    if(it.ikm){const left=it.ikm-(S.odo-last.km);r=Math.min(r,left/it.ikm);parts.push(left>0?fmt(left)+' km 남음':fmt(-left)+' km 지남')}
    if(it.imo){const left=it.imo-months(last.date,today());r=Math.min(r,left/it.imo);if(!it.ikm||left<1)parts.push(left>0?Math.max(0,Math.round(left))+'개월 남음':Math.round(-left)+'개월 지남')}
    return {r,due:r<=0,soon:r>0&&r<.12,txt:r<=0?'교환 필요 · '+parts.join(' · '):parts.join(' · ')}}
  function setOdo(v,quiet){v=Math.max(0,Math.round(v));if(!isFinite(v))return;S.odo=v;save();if(!quiet)render();else{const o=$('#logOdo');if(o&&document.activeElement!==o)o.value=v;summary()}}
  let gpsAcc=0;
  function addDist(m){if(!S.auto||!(m>0)||m>2000)return;gpsAcc+=m;if(gpsAcc>=100){const k=gpsAcc/1000;gpsAcc=0;S.odo=Math.round((S.odo+k)*10)/10;save();const o=$('#logOdo');if(o&&document.activeElement!==o)o.value=Math.round(S.odo);summary()}}
  function summary(){const due=list().filter(i=>status(i).due).length,el=$('#logSum');if(el){el.textContent=due?'교환 필요 '+due:FUEL[S.fuel].n;el.classList.toggle('due',!!due)}}
  function eff(){const f=S.fills.filter(x=>x.km>0).sort((a,b)=>a.km-b.km);if(f.length<2)return null;const dist=f[f.length-1].km-f[0].km,amt=f.slice(1).reduce((s,x)=>s+(+x.amt||0),0);return dist>0&&amt>0?dist/amt:null}
  function render(){
    const F=FUEL[S.fuel];$('#logFuel').value=S.fuel;const o=$('#logOdo');if(document.activeElement!==o)o.value=Math.round(S.odo)||'';$('#logAuto').checked=!!S.auto;
    const ul=$('#logItems');ul.innerHTML='';
    list().forEach(it=>{const st=status(it),last=it.hist[it.hist.length-1],li=document.createElement('li');li.dataset.k=it.key;li.className=st.due?'due':st.soon?'soon':'';
      const per=[it.ikm?kmT(it.ikm):'',it.imo?it.imo+'개월':''].filter(Boolean).join(' · ')||'주기 없음';
      li.innerHTML=`<label class="lchk"><input type="checkbox" ${last&&!st.due?'checked':''} aria-label="${esc(it.name)} 교환함"><i></i></label>
        <div class="lmain"><b>${esc(it.name)}</b><small>${per}${last?` · 마지막 ${last.date} · ${fmt(last.km)} km`:''}</small>
        <div class="lbar"><i style="width:${st.r==null?0:Math.max(0,Math.min(1,st.r))*100}%"></i></div></div>
        <em class="lst">${st.txt}</em><button class="pill ledit" aria-label="${esc(it.name)} 고치기">✎</button>
        <div class="led" hidden><label>주기 km<input type="number" inputmode="numeric" data-f="ikm" value="${it.ikm||''}" placeholder="없음"></label><label>주기 개월<input type="number" inputmode="numeric" data-f="imo" value="${it.imo||''}" placeholder="없음"></label>
        <label>마지막 교환 km<input type="number" inputmode="numeric" data-f="km" value="${last?last.km:''}"></label><label>날짜<input type="date" data-f="date" value="${last?last.date:''}"></label>
        <span><button class="pill on" data-act="save">저장</button>${it.custom?'<button class="pill" data-act="del">항목 삭제</button>':''}</span></div>`;
      ul.appendChild(li)});
    // 주유·충전 기록
    $('#logFillT').textContent=F.fill+' 기록';$('#logAmtL').firstChild.textContent=F.fill+'량('+F.u+')';
    const fl=$('#logFills');fl.innerHTML='';S.fills.slice(-6).reverse().forEach(x=>{const li=document.createElement('li');li.innerHTML=`<span>${x.d}</span><span>${fmt(x.km)} km</span><span>${x.amt} ${F.u}</span><span>${x.won?fmt(x.won)+'원':''}</span><button class="pill" aria-label="기록 지우기">×</button>`;li.dataset.i=S.fills.indexOf(x);fl.appendChild(li)});
    const e=eff(),m=today().slice(0,7),won=S.fills.filter(x=>(x.d||'').startsWith(m)).reduce((s,x)=>s+(+x.won||0),0);
    $('#logEff').textContent=`평균 ${F.eff} ${e?e.toFixed(1)+' '+F.effU:'—'} · 이번 달 ${F.fill} ${fmt(won)}원`;
    summary()}
  function mark(key,on){const it=S.items[key]=S.items[key]||{};it.hist=it.hist||[];if(on)it.hist.push({km:Math.round(S.odo),date:today()});else it.hist.pop();it.hist=it.hist.slice(-12);save();render()}
  function bind(){
    $('#logFuel').onchange=e=>{S.fuel=e.target.value;save();render()};
    $('#logOdo').onchange=e=>setOdo(+e.target.value||0);
    $('#logAuto').onchange=e=>{S.auto=e.target.checked;save()};
    $('#logItems').addEventListener('change',e=>{const c=e.target;if(c.type!=='checkbox')return;const k=c.closest('li').dataset.k;mark(k,c.checked)});
    $('#logItems').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const li=b.closest('li'),k=li.dataset.k;
      if(b.classList.contains('ledit')){li.querySelector('.led').hidden=!li.querySelector('.led').hidden;return}
      if(b.dataset.act==='save'){const g=f=>li.querySelector(`[data-f="${f}"]`).value,it=S.items[k]=S.items[k]||{};it.hist=it.hist||[];it.ikm=+g('ikm')||0;it.imo=+g('imo')||0;
        const km=g('km'),dt=g('date');if(km!==''||dt){const rec={km:+km||0,date:dt||today()};if(it.hist.length)it.hist[it.hist.length-1]=rec;else it.hist.push(rec)}save();render()}
      if(b.dataset.act==='del'){const id=k.slice(2);S.custom=S.custom.filter(c=>c.id!==id);delete S.items[k];save();render()}});
    $('#logAdd').onclick=()=>{const n=$('#logNewName').value.trim();if(!n)return;S.custom.push({id:Date.now().toString(36),name:n,ikm:+$('#logNewKm').value||0,imo:+$('#logNewMo').value||0,fuel:S.fuel});$('#logNewName').value=$('#logNewKm').value=$('#logNewMo').value='';save();render()};
    $('#logFillAdd').onclick=()=>{const amt=+$('#logAmt').value,won=+$('#logWon').value||0,km=+$('#logFillKm').value||Math.round(S.odo),d=$('#logFillD').value||today();if(!(amt>0))return;
      S.fills.push({d,km,amt,won});S.fills.sort((a,b)=>a.km-b.km||(a.d<b.d?-1:1));S.fills=S.fills.slice(-200);if(km>S.odo)S.odo=km;$('#logAmt').value=$('#logWon').value=$('#logFillKm').value='';save();render()};
    $('#logFills').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.fills.splice(+b.closest('li').dataset.i,1);save();render()});
    $('#logFillD').value=today()}
  bind();render();
  return {render,addDist,setOdo,get state(){return S},status:()=>list().map(i=>({key:i.key,name:i.name,...status(i)}))};
})();
window.AmpLog=AmpLog;
