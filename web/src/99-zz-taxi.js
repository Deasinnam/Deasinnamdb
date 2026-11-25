// 1.88 택시 미터기 (1.89 '실물 전자식' 스킨, 1.90 '레트로' 스킨·스킨 단추·폴드7 맞춤)(라디오가 빠진 판 = noradio): 라디오 자리(위 도구 줄 버튼·왼쪽 레일·라디오 창)에 넣음
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
  // 상태: on(주행 중) · paid(지불 화면) · fare · eqM(기본거리 이후 쌓인 환산 거리) · km · sec · sur(할증 %)
  let S=Object.assign({on:false,paid:false,fare:0,eqM:0,used:0,km:0,sec:0,t0:0,base:0},store.get('taxi',{}));
  let lastD=null,lastT=0;
  const save=()=>store.set('taxi',S);
  /* 스킨 3가지(store 'taxiSkin'): pro 실물 전자식 · retro 레트로(은색 기계식) · lcd LCD 클래식.
   * 세 스킨이 같은 상태(S)와 같은 단추 처리를 써서, 운행 중에 바꿔도 금액·거리·시간·선택 상태가 그대로 이어짐 */
  const SKINS=[['pro','실물 전자식'],['retro','레트로'],['lcd','LCD 클래식']];
  const FN=[['gps','GPS','GPS 켜기·끄기'],['level','수평','지금 자세를 수평으로'],['sky','하늘','하늘(주간·야간) 설정'],['guide','안내','택시 미터기 설명'],['skin','스킨','미터기 스킨 바꾸기'],['rcpt','영수','이번 운행 요약']];
  const KEYS='<button type="button" class="tx-k tx-reset">빈차</button><button type="button" class="tx-k tx-go">주행</button><button type="button" class="tx-k tx-sur">할증</button><button type="button" class="tx-k tx-mix">복합</button><button type="button" class="tx-k tx-stop">지불</button>';
  const drum=(n,cls)=>'<span class="rt-drums '+cls+'">'+Array.from({length:n},()=>'<i class="rt-dr"><b>'+'0123456789'.split('').map(d=>'<em>'+d+'</em>').join('')+'</b></i>').join('')+'</span>';
  // ---- 화면 ----
  const bar=W.querySelector('.bar .t');if(bar)bar.innerHTML='<span class="rd-tt">Taxi Meter</span><span class="rd-t2">Taxi</span>';
  const st=W.querySelector('#rdSt');if(st)st.textContent='빈차';
  const com=W.querySelector('.rd-com');if(com)com.textContent='SEOUL';
  const body=document.createElement('div');body.className='body tx-body';
  body.innerHTML=`<div class="tx-panel">
  <div class="tx-skinbar" role="group" aria-label="미터기 스킨"><span>스킨</span>${SKINS.map(k=>'<button type="button" class="tx-sb" data-sk="'+k[0]+'">'+k[1]+'</button>').join('')}<button type="button" class="tx-sb tx-sbnext" aria-label="다음 스킨">⇄</button></div>
  <div class="tx-stage">
  <div class="tx-dev">
    <div class="tx-face">
      <button type="button" class="tx-meter tx-lcd" aria-label="미터기 켜기·끄기">
        <div class="tx-cap">서울 · 중형</div>
        <div class="tx-l1"><span class="tx-mode">빈차</span><span class="tx-spdl"><b class="tx-spd">0.0</b> Km/h</span></div>
        <div class="tx-l2"><div class="tx-lcol"><canvas class="tx-hcv" aria-hidden="true"></canvas><div class="tx-pct"><b class="tx-surp">0%</b><small class="tx-night">주간</small></div></div><span class="tx-fare">0</span><span class="tx-won">원</span></div>
        <div class="tx-track" aria-hidden="true"><div class="tx-ground"></div><div class="tx-horse">${HORSE}</div></div>
        <div class="tx-l3"><span><b class="tx-km">0.00</b>km</span><span><b class="tx-time">00:00</b></span><span>다음 <b class="tx-next">—</b></span></div>
      </button>
      <div class="tx-keys">${KEYS}</div>
    </div>
    <div class="tx-pad2"><div class="tx-ptitle"><b>전자택시미터</b><span>ELECTRONIC TAXIMETER</span></div>
      <div class="tx-pkeys"><div class="tx-fn">${FN.map(f=>'<button type="button" class="tx-pk" data-fn="'+f[0]+'" title="'+f[2]+'">'+f[1]+'</button>').join('')}</div>
      <div class="tx-num">${['1','2','3','4','5','6','7','8','9','설정/변경','0','취소'].map(k=>'<button type="button" class="tx-pk'+(k.length>1?' tx-pks':'')+'" data-fn="'+(k==='설정/변경'?'set':k==='취소'?'cancel':'n')+'">'+k+'</button>').join('')}</div></div>
      <div class="tx-slot" aria-hidden="true"><i></i><b></b></div></div>
    <div class="tx-pad" aria-hidden="true"><div class="tx-brand">ELECTRONIC TAXIMETER</div><div class="tx-grid">${['구분','1','2','3','회송','4','5','6','시외','7','8','9','휴무','설정','0','취소'].map(k=>'<i>'+k+'</i>').join('')}</div></div>
  </div>
  <div class="rt-dev" aria-label="레트로 택시 미터기">
    <div class="rt-glass">
      <i class="rt-screw s1"></i><i class="rt-screw s2"></i><i class="rt-screw s3"></i><i class="rt-screw s4"></i>
      <div class="rt-top"><span class="rt-flag tx-mode">빈차</span><h4>승 차 요 금</h4>
        <button type="button" class="rt-fare tx-meter" aria-label="미터기 켜기·끄기">${drum(6,'rt-big')}<span class="rt-won">원</span></button></div>
      <div class="rt-low"><div class="rt-meter"><small>거 리 <em>km</em></small>${drum(3,'rt-sm rt-km')}</div>
        <canvas class="rt-hcv" aria-hidden="true"></canvas>
        <div class="rt-meter"><small>시 간 <em>분</em></small>${drum(3,'rt-sm rt-min')}</div>
        <div class="rt-keys">${KEYS}</div></div>
    </div>
    <div class="rt-latch" aria-hidden="true"></div>
  </div>
  </div>
  <div class="tx-warn" role="note"><b>재미로만</b> 즐기는 기능이에요 · 표시된 금액으로 실제 요금을 받거나 돈을 주고받으면 「여객자동차 운수사업법」 제81조(자가용 자동차의 유상운송 금지) 위반이에요. <span class="tx-wmore">금액은 서울 중형택시 요금으로 계산한 참고값이라 실제 택시 요금과 다를 수 있어요.</span></div>
  <div class="tx-ack" hidden><div class="tx-ackc"><b>🐎 택시 미터기는 재미용이에요</b><p>표시되는 금액은 서울 중형택시 요금으로 계산한 <b>참고값</b>이에요. 이 금액으로 동승자에게 <b>실제 요금을 받거나 돈을 주고받으면</b> 자가용 유상운송(「여객자동차 운수사업법」 제81조) 위반이 될 수 있어요.</p><button type="button" class="pill on tx-ackok">알겠어요, 재미로만 쓸게요</button></div></div>
  </div>`;
  W.appendChild(body);
  const q=s=>body.querySelector(s),qa=s=>body.querySelectorAll(s),each=(s,f)=>qa(s).forEach(f);
  const horse=TaxiHorse(q('.tx-hcv')),horse2=TaxiHorse(q('.rt-hcv'),{style:'fill',near:'#efe4c4',far:'#a99d7e'});
  let PV=null;   // 미리보기 값(시안 확인용, AmpTaxi._preview) — 실제 상태는 건드리지 않음
  const ss=document.createElement('select');ss.className='sel gsbar tx-skinsel';ss.setAttribute('aria-label','택시 미터기 스킨');
  ss.innerHTML=SKINS.map(k=>'<option value="'+k[0]+'">'+k[1]+'</option>').join('');
  {const bb=W.querySelector('.bar'),gr=bb&&bb.querySelector('.groove');if(bb)bb.insertBefore(ss,gr?gr.nextSibling:null)}
  function setSkin(k){if(!SKINS.some(x=>x[0]===k))k='pro';W.dataset.txskin=k;ss.value=k;store.set('taxiSkin',k);
    each('.tx-sb[data-sk]',b=>b.classList.toggle('on',b.dataset.sk===k));fit();if(k==='pro')horse.live();if(k==='retro')horse2.live()}
  const nextSkin=()=>{const i=SKINS.findIndex(x=>x[0]===W.dataset.txskin);setSkin(SKINS[(i+1)%SKINS.length][0]);toast('미터기 스킨: '+SKINS.find(x=>x[0]===W.dataset.txskin)[1])};
  ss.onchange=()=>setSkin(ss.value);
  each('.tx-sb[data-sk]',b=>b.onclick=()=>setSkin(b.dataset.sk));q('.tx-sbnext').onclick=nextSkin;
  /* 화면 맞춤(폴드7 안쪽·바깥 화면, 가로·세로): 미터기를 '설계 폭 1000' 단위(--u)로 그리고, 쓸 수 있는 칸의 폭과 높이에 맞춰 --u를 정함.
   * 실물 전자식: 넓으면 액정|키패드 가로 배치(가로:세로 2.55), 좁거나 세로면 위아래 배치(1.12). 레트로: 거의 정사각(0.92) */
  const stage=q('.tx-stage');
  function fit(){
    const k=W.dataset.txskin,pw=stage.clientWidth;if(!pw)return;
    const fill=W.getBoundingClientRect().height>=innerHeight*0.8;
    const ah=Math.max(150,fill?stage.clientHeight:Math.min(innerHeight*0.72,900));
    let lay='wide',asp=2.55,base=1000;
    if(k==='pro'){if(pw/ah<1.5){lay='tall';asp=1.12}}
    else if(k==='retro'){if(pw/ah>1.7){lay='rwide';asp=3.3;base=1800}else{lay='sq';asp=0.92}}
    else{asp=pw/ah;lay=ah<300?'short':'wide'}
    const dw=Math.min(pw,ah*asp,k==='retro'?(base===1800?1500:980):1600);
    W.style.setProperty('--u',(dw/base).toFixed(4)+'px');W.style.setProperty('--ah',Math.round(ah)+'px');W.dataset.txlay=lay;
    fitFare()}
  new ResizeObserver(()=>fit()).observe(stage);addEventListener('resize',fit);
  function fitFare(){const f=q('.tx-fare');f.style.fontSize='';let i=0;while(f.scrollWidth>f.clientWidth+1&&i++<12){const cur=parseFloat(getComputedStyle(f).fontSize);f.style.fontSize=(cur*0.92)+'px'}}
  // 레트로 숫자 드럼: 자리마다 0~9 띠를 위아래로 굴림
  function setDrums(sel,str){const ds=qa(sel+' .rt-dr');const t=str.padStart(ds.length,'0').slice(-ds.length);ds.forEach((d,i)=>{d.firstChild.style.transform='translateY('+(-10*(+t[i]||0))+'%)'})}
  // 키패드: 실제 앱 기능
  each('.tx-pk',b=>b.onclick=e=>{e.stopPropagation();const f=b.dataset.fn;
    if(f==='gps'){const g=$('#gOn');if(g)g.click()}
    else if(f==='level'){const l=$('#pfdLevelQuick');if(l)l.click();toast('지금 자세를 수평으로 맞췄어요')}
    else if(f==='sky'){const t=$('#pfdThemeQuick');if(t)t.click()}
    else if(f==='guide'){try{AmpGuide.open('taxi')}catch(e){}}
    else if(f==='skin')nextSkin();
    else if(f==='rcpt'){const m=Math.floor(S.sec/60);toast(S.fare?('이번 운행 '+won(S.paid?Math.round(S.fare/100)*100:S.fare)+'원 · '+S.km.toFixed(2)+'km · '+m+'분'):'운행 기록이 없어요')}
    else if(f==='set'){const s=$('#setBtn');if(s)s.click()}
    else if(f==='cancel'){if(S.sur){S.sur=0;save();ui();toast('할증 끔')}}});
  const won=n=>Math.round(n).toLocaleString('ko-KR');
  function nextLeft(){if(!S.on)return '—';if(S.used<BASE_M)return Math.max(0,Math.ceil(BASE_M-S.used))+' m';return Math.max(1,Math.ceil(UNIT_M-(S.eqM%UNIT_M)))+' m'}
  const setT=(s,v)=>each(s,e=>{if(e.textContent!==v)e.textContent=v});
  const tog=(s,c,v)=>each(s,e=>e.classList.toggle(c,v));
  function ui(){
    const r=rate(),fare=S.paid?Math.round(S.fare/100)*100:S.fare;
    const fv=PV?PV.fare:S.on||S.paid?fare:0,fs=fv?won(fv):'0';
    if(q('.tx-fare').textContent!==fs){q('.tx-fare').textContent=fs;fitFare()}
    setDrums('.rt-big',String(Math.round(fv)));
    const km=PV?PV.km:S.km,sec=PV?(PV.min||0)*60:S.sec;
    setT('.tx-km',km.toFixed(2));
    setDrums('.rt-km',String(Math.round(Math.min(99.9,km)*10)));setDrums('.rt-min',String(Math.min(999,Math.floor(sec/60))));
    const m=Math.floor(S.sec/60),s=Math.floor(S.sec%60);setT('.tx-time',PV?PV.time:(m>99?m:String(m).padStart(2,'0'))+':'+String(s).padStart(2,'0'));
    setT('.tx-spd',(PV?PV.spd:(spdNow||0)).toFixed(1));
    const mode=PV?(PV.mode||'주행'):S.paid?'지불':S.on?'주행':'빈차';setT('.tx-mode',mode);setT('.tx-next',PV?PV.next+' m':nextLeft());
    W.dataset.tx=PV?'run':S.paid?'paid':S.on?'run':'idle';
    const sp=surPct(r);setT('.tx-surp',sp+'%');setT('.tx-night',r.tag||'주간');tog('.tx-sur','on',S.sur===20);tog('.tx-mix','on',S.sur===40);
    const on=PV?true:S.on;tog('.tx-go','on',on);tog('.tx-reset','on',!on&&!S.paid);tog('.tx-stop','on',!PV&&S.paid);
    horse.set(on,PV?PV.spd:(spdNow||0));horse2.set(on,PV?PV.spd:(spdNow||0));
    if(st)st.textContent=S.paid?'지불 '+won(fare)+'원':S.on?'주행 '+won(S.fare)+'원':'빈차';
    // LCD 클래식의 말(svg): 주행 중이면 달림, 진행 막대 = 다음 요금까지
    const v=spdNow||0,h=q('.tx-horse');
    h.style.setProperty('--gait',(S.on?(v>3?Math.max(.28,.9-v/160):1.4):0)+'s');
    W.style.setProperty('--gnd',(v>3?Math.max(.12,1.2-v/90):.9)+'s');W.classList.toggle('tx-going',S.on);W.classList.toggle('tx-fast',S.on&&v>3);
    const prog=S.on?(S.used<BASE_M?S.used/BASE_M:(S.eqM%UNIT_M)/UNIT_M):S.paid?1:0;
    if(h.offsetWidth)h.style.left='calc((100% - '+(h.offsetWidth+16)+'px) * '+prog.toFixed(3)+' + 8px)';
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
  const toggle=()=>S.on?pause():start();
  each('.tx-go',b=>b.onclick=e=>{e.stopPropagation();toggle()});
  each('.tx-meter',b=>b.onclick=toggle);
  q('.tx-ackok').onclick=e=>{e.stopPropagation();store.set('taxiAck',true);q('.tx-ack').hidden=true;start0()};
  each('.tx-stop',b=>b.onclick=e=>{e.stopPropagation();pay()});each('.tx-reset',b=>b.onclick=e=>{e.stopPropagation();reset()});
  const setSur=v=>{S.sur=S.sur===v?0:v;save();ui();toast(S.sur?'시계외 할증 '+S.sur+'% (다음 요금부터)':'할증 끔')};
  each('.tx-sur',b=>b.onclick=e=>{e.stopPropagation();setSur(20)});each('.tx-mix',b=>b.onclick=e=>{e.stopPropagation();setSur(40)});
  // 라디오 자리 되살리기: 위 버튼·레일·창을 택시 미터기로
  try{openRadio=function(){W.classList.remove('collapsed');if(isCk2())ckFocus('radio');else W.scrollIntoView({block:'start',behavior:'smooth'})}}catch(e){}
  try{rdEnsure=function(){};rdSigRun=function(){}}catch(e){}
  const rb=$('#radioBtn');if(rb){rb.onclick=openRadio;rb.title='택시 미터기';rb.setAttribute('aria-label','택시 미터기');const e=rb.querySelector('.emo');if(e)e.textContent='🚕 ';const ic=rb.querySelector('svg.ico');if(ic)ic.innerHTML=TAXI_ICON;
    [...rb.childNodes].forEach(n=>{if(n.nodeType===3&&n.textContent.trim())n.textContent='택시'});const tl=rb.querySelector('.tl');if(tl)tl.textContent='택시'}
  const rl=document.querySelector('#ckRail [data-f="radio"]');if(rl){const sv=rl.querySelector('svg');if(sv)sv.innerHTML=TAXI_ICON;const sp=rl.querySelector('span');if(sp)sp.textContent='택시'}
  try{WIN_NAME.wRadio='택시 미터기'}catch(e){}
  const ren=()=>document.querySelectorAll('select option[value="radio"]').forEach(o=>{if(o.closest('#sCarSrc'))o.remove();else if(!/택시/.test(o.textContent))o.textContent='택시 미터기'});ren();setInterval(ren,2000);
  setSkin(store.get('taxiSkin','pro'));document.addEventListener('touchstart',()=>{},{passive:true});   // 안드로이드 웹뷰에서 :active(키캡 눌림)가 보이게
  setInterval(tick,500);ui();
  return {start,pause,pay,reset,setSkin,fit,get skin(){return W.dataset.txskin},get state(){return Object.assign({},S)},rate,_tick:tick,horse,horse2,
    _preview(v){PV=v||null;ui()}};
})();
window.AmpTaxi=Taxi;window.TaxiHorseTest=TaxiHorse;   // 시험(테스트 49)에서 말만 따로 그려 볼 때
