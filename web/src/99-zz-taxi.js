// 1.88 택시 미터기(라디오가 빠진 판 = noradio): 라디오 자리(위 도구 줄 버튼·왼쪽 레일·라디오 창)에 넣음
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 요금: 서울 중형택시 신고요금(2023.2.1~, 서울시 교통 누리집 기준)
 *  주간  기본 4,800원(1.6km) · 131m당 100원 · 30초당 100원
 *  심야  22~23시·02~04시: 기본 5,800원 · 131m/30초당 120원 / 23~02시: 기본 6,700원 · 131m/30초당 140원
 *  15.72km/h 미만이면 시간만, 이상이면 거리만 셈(시간 30초 = 거리 131m로 바꿔 기본거리에서 먼저 뺌)
 *  내는 돈 = 미터 금액을 십원 단위에서 반올림(100원 단위)
 * 거리는 GPS 속도계가 쌓는 trip.dist(정확도 35m 미만·0.8m/s 넘을 때만)를 그대로 씀 → 실제 달린 거리만큼 오름 */
/* 말(직접 그린 단순한 옆모습, 오른쪽으로 달림): 다리 네 개를 따로 흔들어 달리는 모양 */
const HORSE=`<svg viewBox="0 0 140 100" class="tx-hsvg"><g class="tx-hb">
<path class="tx-tail" d="M31 40C20 38 10 46 4 62c10-8 18-12 28-14z"/>
<g class="tx-leg tx-lb1"><path d="M38 56l-4 20 2 18h5l-1-18 4-18z"/></g>
<g class="tx-leg tx-lb2"><path d="M47 57l-1 20 4 17h5l-3-17 1-19z"/></g>
<g class="tx-leg tx-lf1"><path d="M84 56l2 20-2 18h5l2-18-1-20z"/></g>
<g class="tx-leg tx-lf2"><path d="M92 54l4 20 1 20h5l-1-20-3-21z"/></g>
<path class="tx-body" d="M30 42c0-9 10-12 22-11h28c6 0 10-3 14-9l10-12c3-4 8-5 12-3l15 12c3 3 2 7-2 7l-8-1c-3 0-5 2-7 5l-8 10c-4 6-6 12-10 16-4 4-10 5-16 5H46c-8 0-15-4-16-11z"/>
<path class="tx-ear" d="M110 7l3-7 3 7z"/>
<path class="tx-mane" d="M104 9c-6 5-10 13-16 21l5 1c5-6 8-13 15-19z"/>
<circle class="tx-eye" cx="118" cy="13" r="1.8"/></g></svg>`;
const TAXI_ICON='<path d="M7 4h10l1 3h1.5A2.5 2.5 0 0 1 22 9.5V17a1 1 0 0 1-1 1h-1.2a2.5 2.5 0 0 1-4.6 0H8.8a2.5 2.5 0 0 1-4.6 0H3a1 1 0 0 1-1-1V9.5A2.5 2.5 0 0 1 4.5 7H6zm1.4 1.6L7.8 7h8.4l-.6-1.4zM5 10v3h4v-3zm10 0v3h4v-3zM9.5 2h5v1.6h-5z"/>';
const Taxi=(()=>{
  if(!/noradio/.test(DISTF))return null;
  const R=document.documentElement,W=$('#wRadio');if(!W)return null;
  R.setAttribute('data-taxi','');
  const UNIT_M=131,UNIT_S=30,BASE_M=1600,SLOW=15.72;
  const rate=d=>{const h=(d||new Date()).getHours();return h===23||h<2?{base:6700,step:140,tag:'심야 40%'}:h===22||(h>=2&&h<4)?{base:5800,step:120,tag:'심야 20%'}:{base:4800,step:100,tag:''}};
  // 상태: on(주행 중) · paid(지불 화면) · fare · eqM(기본거리 이후 쌓인 환산 거리) · km · sec
  let S=Object.assign({on:false,paid:false,fare:0,eqM:0,used:0,km:0,sec:0,t0:0,base:0},store.get('taxi',{}));
  let lastD=null,lastT=0,tickAnim=0;
  const save=()=>store.set('taxi',S);
  // ---- 화면 ----
  const bar=W.querySelector('.bar .t');if(bar)bar.innerHTML='<span class="rd-tt">Taxi Meter</span><span class="rd-t2">Taxi</span>';
  const st=W.querySelector('#rdSt');if(st)st.textContent='빈차';
  const com=W.querySelector('.rd-com');if(com)com.textContent='SEOUL';
  const body=document.createElement('div');body.className='body tx-body';
  // 생김새: 실제 미터기처럼 검은 테 + 연두빛 LCD(말·속도·요금·할증) + 아래 색 단추(빈차·주행·할증·복합·지불) + 오른쪽 숫자 키(장식)
  body.innerHTML=`<div class="tx-panel"><div class="tx-dev">
    <div class="tx-face">
      <button type="button" class="tx-meter tx-lcd" aria-label="미터기 켜기·끄기">
        <div class="tx-l1"><span class="tx-mode">빈차</span><span class="tx-spdl"><b class="tx-spd">0.0</b> Km/h</span></div>
        <div class="tx-l2"><div class="tx-pct"><b class="tx-surp">0%</b><small class="tx-night">주간</small></div><span class="tx-fare">0</span><span class="tx-won">원</span></div>
        <div class="tx-track" aria-hidden="true"><div class="tx-ground"></div><div class="tx-horse">${HORSE}</div></div>
        <div class="tx-l3"><span><b class="tx-km">0.00</b>km</span><span><b class="tx-time">00:00</b></span><span>다음 <b class="tx-next">—</b></span></div>
      </button>
      <div class="tx-keys"><button type="button" class="tx-k tx-reset">빈차</button><button type="button" class="tx-k tx-go">주행</button><button type="button" class="tx-k tx-sur">할증</button><button type="button" class="tx-k tx-mix">복합</button><button type="button" class="tx-k tx-stop">지불</button></div>
    </div>
    <div class="tx-pad" aria-hidden="true"><div class="tx-brand">ELECTRONIC TAXIMETER</div><div class="tx-grid">${['구분','1','2','3','회송','4','5','6','시외','7','8','9','휴무','설정','0','취소'].map(k=>'<i>'+k+'</i>').join('')}</div></div>
  </div>
  <div class="tx-warn" role="note"><b>재미로만 즐겨 주세요</b> · 이 택시 미터기는 놀이용 기능이에요. 표시된 금액으로 실제 요금을 받거나 돈을 주고받으면 안 돼요. 자가용으로 돈을 받고 사람을 태우는 것은 「여객자동차 운수사업법」 제81조(자가용 자동차의 유상운송 금지) 위반이에요. 금액은 서울 중형택시 요금으로 계산한 참고값이라 실제 택시 요금과 다를 수 있어요.</div>
  <div class="tx-ack" hidden><div class="tx-ackc"><b>🐎 택시 미터기는 재미용이에요</b><p>표시되는 금액은 서울 중형택시 요금으로 계산한 <b>참고값</b>이에요. 이 금액으로 동승자에게 <b>실제 요금을 받거나 돈을 주고받으면</b> 자가용 유상운송(「여객자동차 운수사업법」 제81조) 위반이 될 수 있어요.</p><button type="button" class="pill on tx-ackok">알겠어요, 재미로만 쓸게요</button></div></div>
  </div>`;
  W.appendChild(body);
  const q=s=>body.querySelector(s);
  const won=n=>Math.round(n).toLocaleString('ko-KR');
  function nextLeft(){if(!S.on)return '—';const r=rate();if(S.used<BASE_M)return Math.max(0,Math.ceil(BASE_M-S.used))+'m';return Math.max(1,Math.ceil(UNIT_M-(S.eqM%UNIT_M)))+'m'}
  function ui(){
    const r=rate(),fare=S.paid?Math.round(S.fare/100)*100:S.fare;
    q('.tx-fare').textContent=S.on||S.paid?won(fare):'0';
    q('.tx-km').textContent=(S.km).toFixed(2);
    const m=Math.floor(S.sec/60),s=Math.floor(S.sec%60);q('.tx-time').textContent=(m>99?m:String(m).padStart(2,'0'))+':'+String(s).padStart(2,'0');
    q('.tx-spd').textContent=(spdNow||0).toFixed(1);q('.tx-mode').textContent=S.paid?'지불':S.on?'주행':'빈차';q('.tx-next').textContent=nextLeft();
    W.dataset.tx=S.paid?'paid':S.on?'run':'idle';
    const sp=surPct(r);q('.tx-surp').textContent=sp+'%';q('.tx-night').textContent=r.tag?r.tag.replace(' ',' '):'주간';q('.tx-sur').classList.toggle('on',S.sur===20);q('.tx-mix').classList.toggle('on',S.sur===40);
    q('.tx-go').classList.toggle('on',S.on);q('.tx-reset').classList.toggle('on',!S.on&&!S.paid);q('.tx-stop').classList.toggle('on',S.paid);
    if(st)st.textContent=S.paid?'지불 '+won(fare)+'원':S.on?'주행 '+won(S.fare)+'원':'빈차';
    // 말: 주행 중이면 달림(빠를수록 빨리), 멈춰 있으면 제자리 걸음, 빈차면 섬
    const v=spdNow||0,h=q('.tx-horse');
    h.style.setProperty('--gait',(S.on?(v>3?Math.max(.28,.9-v/160):1.4):0)+'s');
    W.style.setProperty('--gnd',(v>3?Math.max(.12,1.2-v/90):.9)+'s');W.classList.toggle('tx-going',S.on);W.classList.toggle('tx-fast',S.on&&v>3);
    const prog=S.on?(S.used<BASE_M?S.used/BASE_M:(S.eqM%UNIT_M)/UNIT_M):S.paid?1:0;
    h.style.left='calc((100% - '+(h.offsetWidth+16)+'px) * '+prog.toFixed(3)+' + 8px)';
  }
  function surPct(r){const nt=/40/.test(r.tag)?40:/20/.test(r.tag)?20:0;return Math.min(60,nt+(S.sur||0))}
  function add(n){S.fare+=n;W.classList.remove('tx-tick');void W.offsetWidth;W.classList.add('tx-tick')}
  function tick(){
    const now=Date.now(),d=trip.dist;
    if(lastD==null||d<lastD)lastD=d;
    const dd=Math.max(0,Math.min(200,d-lastD)),dt=lastT?Math.min(5,(now-lastT)/1000):0;lastD=d;lastT=now;
    if(S.on&&!S.paid){
      const r=rate(),slow=(spdNow||0)<SLOW;
      S.km+=dd/1000;S.sec+=dt;
      // 느리면 시간을 거리로 환산(30초=131m), 빠르면 거리만
      const eq=slow?dt*UNIT_M/UNIT_S:dd;
      if(S.used<BASE_M){S.used+=eq;if(S.used>BASE_M){S.eqM+=S.used-BASE_M;S.used=BASE_M}}else S.eqM+=eq;
      while(S.eqM>=UNIT_M*(S.n||0)+UNIT_M){S.n=(S.n||0)+1;add(Math.round(r.step*(1+(S.sur||0)/100)/10)*10)}
      save()}
    ui()}
  function start(){if(!store.get('taxiAck',false)){q('.tx-ack').hidden=false;return}
    start0()}
  function start0(){if(S.paid||!S.fare){const r=rate();S={on:true,paid:false,fare:r.base,eqM:0,used:0,n:0,km:0,sec:0,t0:Date.now(),base:r.base,sur:S.sur||0}}else S.on=true;lastD=trip.dist;lastT=Date.now();save();ui();
    try{if(!gpsOn)gpsStart(true)}catch(e){}}
  function pause(){S.on=false;save();ui()}
  function pay(){if(!S.fare)return;S.on=false;S.paid=true;save();ui();toast('지불 요금 '+won(Math.round(S.fare/100)*100)+'원 · '+S.km.toFixed(2)+'km')}
  function reset(){S={on:false,paid:false,fare:0,eqM:0,used:0,n:0,km:0,sec:0,t0:0,base:0,sur:0};save();ui()}
  q('.tx-go').onclick=()=>S.on?pause():start();
  q('.tx-meter').onclick=()=>S.on?pause():start();
  q('.tx-ackok').onclick=e=>{e.stopPropagation();store.set('taxiAck',true);q('.tx-ack').hidden=true;start0()};
  q('.tx-stop').onclick=pay;q('.tx-reset').onclick=reset;
  const setSur=v=>{S.sur=S.sur===v?0:v;save();ui();toast(S.sur?'시계외 할증 '+S.sur+'% (다음 요금부터)':'할증 끔')};q('.tx-sur').onclick=()=>setSur(20);q('.tx-mix').onclick=()=>setSur(40);
  // 라디오 자리 되살리기: 위 버튼·레일·창을 택시 미터기로
  try{openRadio=function(){W.classList.remove('collapsed');if(isCk2())ckFocus('radio');else W.scrollIntoView({block:'start',behavior:'smooth'})}}catch(e){}
  try{rdEnsure=function(){};rdSigRun=function(){}}catch(e){}
  const rb=$('#radioBtn');if(rb){rb.onclick=openRadio;rb.title='택시 미터기';rb.setAttribute('aria-label','택시 미터기');const e=rb.querySelector('.emo');if(e)e.textContent='🚕 ';const ic=rb.querySelector('svg.ico');if(ic)ic.innerHTML=TAXI_ICON;
    [...rb.childNodes].forEach(n=>{if(n.nodeType===3&&n.textContent.trim())n.textContent='택시'});const tl=rb.querySelector('.tl');if(tl)tl.textContent='택시'}
  const rl=document.querySelector('#ckRail [data-f="radio"]');if(rl){const sv=rl.querySelector('svg');if(sv)sv.innerHTML=TAXI_ICON;const sp=rl.querySelector('span');if(sp)sp.textContent='택시'}
  try{WIN_NAME.wRadio='택시 미터기'}catch(e){}
  const ren=()=>document.querySelectorAll('select option[value="radio"]').forEach(o=>{if(o.closest('#sCarSrc'))o.remove();else if(!/택시/.test(o.textContent))o.textContent='택시 미터기'});ren();setInterval(ren,2000);
  setInterval(tick,500);ui();
  return {start,pause,pay,reset,get state(){return Object.assign({},S)},rate,_tick:tick};
})();
window.AmpTaxi=Taxi;
