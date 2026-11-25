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
// 1.93 아래 간판 '대신남 운수'(노란 택시 간판 · TAXI 지붕등 · 체크 띠 · 둥근 기사 사진). 사진은 동그라미를 누르면 고름(기기에만 저장)
const DSN_SIGN=`<div class="ds" role="img" aria-label="대신남 운수">
<div class="ds-main"><svg class="ds-roof" viewBox="0 0 220 70" aria-hidden="true"><path d="M58 8 H162 L176 44 H44Z" fill="#111"/><path d="M24 46 H196 Q204 46 206 54 L208 62 H12 L14 54 Q16 46 24 46Z" fill="#111"/><text x="110" y="38" text-anchor="middle" font-family="'Barlow Condensed','Noto Sans KR',sans-serif" font-weight="900" font-size="34" fill="#ffd21f" letter-spacing="2">TAXI</text></svg>
<b class="ds-name">대신남 운수</b></div>
<button type="button" class="ds-photo" aria-label="기사 사진 넣기·바꾸기"><i class="ds-img"></i><svg class="ds-def" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="38" r="17" fill="#9a9a9a"/><path d="M16 86 Q18 58 50 58 Q82 58 84 86Z" fill="#9a9a9a"/></svg><em class="ds-ring"></em></button>
<i class="ds-check" aria-hidden="true"></i></div>`;
// 1.92 오디오(긴 바깥 화면): 원래 플레이어(#wMain)의 단추·슬라이더를 그대로 눌러 주는 리모컨 — 상태는 원래 플레이어에서 읽어 옴
const DOCK_KEYS=[['bPrev','M5 5h3v14H5zM20 5v14L9 12z','이전 곡'],['bPlay','M7 4l13 8-13 8z','재생'],['bPause','M6 4h4v16H6zM14 4h4v16h-4z','일시정지'],['bStop','M5 5h14v14H5z','정지'],['bNext','M16 5h3v14h-3zM4 5v14l11-7z','다음 곡']];
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
  </div>
  <div class="rt-dev" aria-label="레트로 택시 미터기">
    <div class="rt-glass">
      <div class="rt-vac" aria-hidden="true"><i class="rt-arm"></i><div class="rt-disc"><b>빈차</b><small>EMPTY</small></div></div>
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
  <div class="tx-dock" aria-label="오디오">
    <div class="dk-lcd"><span class="dk-st"></span><span class="dk-title">음악</span><span class="dk-time">00:00</span></div>
    <input type="range" class="dk-seek" min="0" max="1000" value="0" aria-label="재생 위치">
    <div class="dk-keys">${DOCK_KEYS.map(k=>'<button type="button" class="dk-k" data-t="'+k[0]+'" aria-label="'+k[2]+'"><svg viewBox="0 0 24 24"><path d="'+k[1]+'"/></svg></button>').join('')}</div>
    <div class="dk-sub"><button type="button" class="dk-tog" data-t="tShuf">셔플</button><button type="button" class="dk-tog" data-t="tRep">반복</button>
      <label class="dk-sl"><span>VOL</span><input type="range" class="dk-r" data-t="vol" min="0" max="100"></label><label class="dk-sl"><span>BAL</span><input type="range" class="dk-r" data-t="bal" min="-100" max="100"></label></div>
  </div>
  <div class="tx-88">${DSN_SIGN}<div class="s88i" role="img" aria-label="세계는 서울로 서울은 세계로 · SEOUL 1988"><i class="s88i-full"></i><i class="s88i-text"></i><i class="s88i-city"></i></div>
    <button type="button" class="tx-signsw" aria-label="간판 바꾸기 — 대신남 운수 ↔ 세계는 서울로">⇄ 간판</button></div>
  <input type="file" class="ds-file" accept="image/*" hidden>
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
    each('.tx-sb[data-sk]',b=>b.classList.toggle('on',b.dataset.sk===k));try{signNow()}catch(e){}fit();if(k==='pro')horse.live();if(k==='retro')horse2.live()}
  const nextSkin=()=>{const i=SKINS.findIndex(x=>x[0]===W.dataset.txskin);setSkin(SKINS[(i+1)%SKINS.length][0]);toast('미터기 스킨: '+SKINS.find(x=>x[0]===W.dataset.txskin)[1])};
  ss.onchange=()=>setSkin(ss.value);
  each('.tx-sb[data-sk]',b=>b.onclick=()=>setSkin(b.dataset.sk));q('.tx-sbnext').onclick=nextSkin;
  /* 화면 맞춤(폴드7 안쪽·바깥 화면, 가로·세로): 미터기를 '설계 폭 1000' 단위(--u)로 그리고, 쓸 수 있는 칸의 폭과 높이에 맞춰 --u를 정함.
   * 실물 전자식: 넓으면 액정|키패드 가로 배치(가로:세로 2.55), 좁거나 세로면 위아래 배치(1.12). 레트로: 거의 정사각(0.92) */
  const stage=q('.tx-stage'),panel=q('.tx-panel');
  /* 화면 맞춤(폴드7 안쪽·바깥 화면, 가로·세로): 미터기를 --u(설계 폭의 1칸) 단위로 그리고, 실제로 그려진 크기를 재서 칸 폭·높이에 꼭 맞게 --u를 다시 정함(어림 비율로 넘치던 문제 1.91).
   * 세로로 남는 자리가 넉넉하면 미터기 아래에 '세계는 서울로' 그림(.tx-88)을 보임 */
  let fitting=false,fitT=0;
  const dock=q('.tx-dock');
  // 미터기를 폭 pw·높이 H 안에 맞춤(실제 그려진 크기를 재서 --u를 고침). 최소 글자 크기가 있는 웹뷰에서도 무너지지 않게 줄이는 폭에 바닥을 둠
  function fitMeter(k,pw,H){
    let base=1000,cap=1600,lay='wide';
    if(k==='pro')lay=pw/H>2.2?'wide':'tall'   // 1.93 키패드 없이 한 덩어리 — 아주 낮고 넓은 칸(바깥 화면 가로)만 글자를 덜 키움
    else if(k==='retro'){if(pw/H>1.7){lay='rwide';base=1800;cap=1500}else{lay='sq';cap=980}}
    else lay=H<300?'short':'wide';
    W.dataset.txlay=lay;W.style.setProperty('--ah',Math.round(H)+'px');
    const dev=k==='retro'?q('.rt-dev'):q('.tx-dev'),extra=u=>k==='retro'?Math.round(u*30):0;
    const u0=Math.min(pw,cap)/base,floor=u0*0.3;let u=u0;
    if(k==='lcd'){W.style.setProperty('--u','1px');return dev.offsetHeight}
    for(let n=0;n<4;n++){W.style.setProperty('--u',u.toFixed(4)+'px');
      const w=dev.offsetWidth,h=dev.offsetHeight+extra(u);if(!w||!h)break;
      const f=Math.min(pw/w,H/h);if(Math.abs(f-1)<0.01)break;u=Math.max(floor,Math.min(u*f,cap/base))}
    W.style.setProperty('--u',u.toFixed(4)+'px');
    return dev.offsetHeight+extra(u)}
  /* 화면 맞춤(1.92): 창이 화면을 꽉 채우면 — 미터기 + (길쭉한 바깥 화면이면 오디오) + '세계는 서울로' 그림이 위아래를 빈틈없이 채움.
   * 전체 모드처럼 창이 여러 개 쌓이면 — 미터기 높이만큼만 차지(스킨 3개 모두 보임) */
  function fit(){
    if(fitting)return;fitting=true;
    try{
    const k=W.dataset.txskin;stage.style.flex='';stage.style.height='';W.dataset.tx88='';W.dataset.txdock='';
    const pw=stage.clientWidth;if(!pw)return;
    const fill=W.getBoundingClientRect().height>=innerHeight*0.8;
    let ah=fill?stage.clientHeight:Math.min(innerHeight*0.6,760);
    if(fill&&ah<200){clearTimeout(fitT);fitT=setTimeout(fit,300);ah=Math.max(ah,150)}   // 창이 펼쳐지는 중: 잠시 뒤 다시
    let dh,res=0;
    if(fill){
      const long=ah>pw*1.45;
      if(long){W.dataset.txdock='on';res=dock.offsetHeight+8}
      const bmin=Math.max(130,ah*0.24);
      const H1=ah-res-bmin;
      dh=H1>=150?fitMeter(k,pw,H1):0;
      const dev=k==='retro'?q('.rt-dev'):q('.tx-dev');
      if(!dh||dev.offsetWidth<pw*0.55){dh=fitMeter(k,pw,ah-res)}   // 그림 자리를 주면 미터기가 너무 작아질 때는 미터기 먼저
      if(ah-res-dh>=90)W.dataset.tx88='on';
      else if(res&&ah-dh<res+40){W.dataset.txdock='';res=0;dh=fitMeter(k,pw,ah)}
    }else dh=fitMeter(k,pw,ah);
    stage.style.flex='0 0 auto';stage.style.height=(dh+6)+'px';
    {const dv=k==='retro'?q('.rt-dev'):q('.tx-dev');if(dv.offsetWidth<Math.min(pw,300)*0.5||dh<60){clearTimeout(fitT);fitT=setTimeout(fit,350)}}
    fitFare();setTimeout(dockSync,0);fitSign()}finally{fitting=false}}
  new ResizeObserver(()=>fit()).observe(panel);document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(fit,200)});addEventListener('focus',()=>setTimeout(fit,200));addEventListener('resize',()=>{fit();clearTimeout(fitT);fitT=setTimeout(fit,400)});
  // 1.93 기사 사진: 동그라미를 누르면 사진을 고르고, 가운데를 정사각형으로 잘라 360px로 줄여 기기(localStorage)에 저장
  const dsFile=q('.ds-file'),dsImg=q('.ds-img');
  const showPhoto=()=>{const u=store.get('taxiPhoto','');dsImg.style.backgroundImage=u?'url("'+u+'")':'';W.classList.toggle('tx-hasph',!!u)};
  q('.ds-photo').onclick=e=>{e.stopPropagation();dsFile.value='';dsFile.click()};
  dsFile.onchange=()=>{const f=dsFile.files&&dsFile.files[0];if(!f)return;const rd=new FileReader();
    rd.onload=()=>{const im=new Image();im.onload=()=>cropEditor(im);im.onerror=()=>toast('이 사진은 열 수 없어요');im.src=rd.result};rd.readAsDataURL(f)};
  /* 1.94 사진 위치 맞추기: 동그라미 안에 보일 곳을 끌어서 옮기고, 두 손가락(또는 막대·휠)으로 키우고 줄임 → 동그라미 부분만 360px로 저장 */
  function cropEditor(src){
    // 큰 사진은 먼저 1600px로 줄여 메모리를 아낌
    let img=src;{const m=Math.max(src.width,src.height);if(m>1600){const c=document.createElement('canvas'),k=1600/m;c.width=Math.round(src.width*k);c.height=Math.round(src.height*k);c.getContext('2d').drawImage(src,0,0,c.width,c.height);img=c}}
    const iw=img.width,ih=img.height,ov=document.createElement('div');ov.className='tx-crop';
    ov.innerHTML='<div class="tc-box"><b>사진 위치 맞추기</b><div class="tc-view"><canvas></canvas><i class="tc-ring"></i></div><label class="tc-zl"><span>－</span><input type="range" class="tc-zoom" min="1" max="5" step="0.01" value="1" aria-label="확대"><span>＋</span></label><small>끌어서 옮기고, 두 손가락이나 막대로 크기를 바꿔요</small><div class="tc-btns"><button type="button" class="pill tc-no">취소</button><button type="button" class="pill on tc-ok">넣기</button></div></div>';
    document.body.appendChild(ov);
    const view=ov.querySelector('.tc-view'),cv=ov.querySelector('canvas'),zr=ov.querySelector('.tc-zoom');
    let V=0,z=1,ox=0,oy=0;const s0=()=>V/Math.min(iw,ih);
    function clampO(){const sc=s0()*z,mx=Math.max(0,iw*sc/2-V/2),my=Math.max(0,ih*sc/2-V/2);ox=Math.max(-mx,Math.min(mx,ox));oy=Math.max(-my,Math.min(my,oy))}
    function paint(ctx,size){const k=size/V,sc=s0()*z*k;ctx.fillStyle='#ddd';ctx.fillRect(0,0,size,size);ctx.drawImage(img,size/2+ox*k-iw*sc/2,size/2+oy*k-ih*sc/2,iw*sc,ih*sc)}
    function draw(){const d=devicePixelRatio||1;V=view.clientWidth;cv.width=cv.height=Math.round(V*d);clampO();paint(cv.getContext('2d'),cv.width)}
    const setZ=(nz,cx,cy)=>{nz=Math.max(1,Math.min(5,nz));// 손가락 사이(또는 가운데)를 기준으로 확대
      const px=(cx==null?0:cx-V/2),py=(cy==null?0:cy-V/2);ox=px-(px-ox)*nz/z;oy=py-(py-oy)*nz/z;z=nz;zr.value=z;draw()};
    const P=new Map();let pinch=0,pz=1;
    view.addEventListener('pointerdown',e=>{view.setPointerCapture(e.pointerId);P.set(e.pointerId,{x:e.clientX,y:e.clientY});if(P.size===2){const [a,b]=[...P.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);pz=z}});
    view.addEventListener('pointermove',e=>{const o=P.get(e.pointerId);if(!o)return;const r=view.getBoundingClientRect();
      if(P.size===1){ox+=e.clientX-o.x;oy+=e.clientY-o.y;P.set(e.pointerId,{x:e.clientX,y:e.clientY});draw()}
      else{P.set(e.pointerId,{x:e.clientX,y:e.clientY});const [a,b]=[...P.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch>0)setZ(pz*d/pinch,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top)}});
    const up=e=>{P.delete(e.pointerId);if(P.size<2)pinch=0};view.addEventListener('pointerup',up);view.addEventListener('pointercancel',up);
    view.addEventListener('wheel',e=>{e.preventDefault();const r=view.getBoundingClientRect();setZ(z*(e.deltaY<0?1.1:1/1.1),e.clientX-r.left,e.clientY-r.top)},{passive:false});
    zr.oninput=()=>setZ(+zr.value);
    const close=()=>{ov.remove();removeEventListener('resize',draw)};addEventListener('resize',draw);
    ov.querySelector('.tc-no').onclick=close;
    ov.querySelector('.tc-ok').onclick=()=>{const c=document.createElement('canvas');c.width=c.height=360;paint(c.getContext('2d'),360);
      try{store.set('taxiPhoto',c.toDataURL('image/jpeg',0.86));showPhoto();toast('기사 사진을 넣었어요')}catch(e){toast('사진을 저장하지 못했어요')}close()};
    requestAnimationFrame(draw);
    window.__taxiCrop=ov;}
  showPhoto();
  // 1.94 간판: 레트로는 늘 '세계는 서울로'(사용자가 준 그림), 실물 전자식·LCD 클래식은 '대신남 운수' ↔ '세계는 서울로'를 ⇄ 간판 단추로
  const signNow=()=>{W.dataset.txsign=W.dataset.txskin==='retro'?'s88':store.get('taxiSign','dsn')};
  q('.tx-signsw').onclick=e=>{e.stopPropagation();store.set('taxiSign',store.get('taxiSign','dsn')==='dsn'?'s88':'dsn');signNow();fitSign();toast(W.dataset.txsign==='s88'?'간판: 세계는 서울로':'간판: 대신남 운수')};
  signNow();
  // 오디오 리모컨: 누르면 원래 플레이어 단추를 누름, 상태는 0.5초마다 원래 플레이어에서 가져옴
  dock.querySelectorAll('[data-t]').forEach(el=>{const t=()=>document.getElementById(el.dataset.t);
    if(el.tagName==='BUTTON')el.onclick=e=>{e.stopPropagation();const o=t();if(o&&!o.disabled)o.click();setTimeout(dockSync,60)};
    else el.oninput=()=>{const o=t();if(!o)return;o.value=el.value;o.dispatchEvent(new Event('input'))}});
  const dseek=q('.dk-seek');dseek.oninput=()=>{const o=$('#seek');if(o){o.value=dseek.value;o.dispatchEvent(new Event('input'))}};
  dseek.onchange=()=>{const o=$('#seek');if(o){o.value=dseek.value;o.dispatchEvent(new Event('change'))}};
  function dockSync(){if(W.dataset.txdock!=='on')return;
    const tx=id=>{const e=document.getElementById(id);return e?e.textContent.trim():''};
    q('.dk-title').textContent=tx('marqText')||'음악';q('.dk-time').textContent=tx('time')||'00:00';
    dock.querySelectorAll('[data-t]').forEach(el=>{const o=document.getElementById(el.dataset.t);if(!o)return;
      if(el.tagName==='BUTTON'){el.classList.toggle('hot',o.classList.contains('hot')||o.classList.contains('on'));el.disabled=!!o.disabled;if(el.dataset.t==='tRep'){const r=$('#repTxt');if(r)el.textContent=r.textContent}}
      else if(document.activeElement!==el){el.value=o.value;el.disabled=!!o.disabled}});
    const sk=$('#seek');if(sk&&document.activeElement!==dseek)dseek.value=sk.value;
    const pl=$('#bPlay');q('.dk-st').className='dk-st'+(pl&&pl.classList.contains('hot')?' on':'')}
  setInterval(dockSync,500);
  // 1.95 간판 글자 맞춤: 폰의 글자 크기 설정(웹뷰 글자 확대) 때문에 '대신남 운수'가 칸을 넘으면 넘지 않을 때까지 줄임
  function fitSign(){const nm=q('.ds-name'),ds=q('.ds'),ph=q('.ds-photo');if(!nm)return;nm.style.fontSize='';if(!nm.offsetParent)return;
    const bad=()=>{const N=nm.getBoundingClientRect(),S=ds.getBoundingClientRect(),P=ph.getBoundingClientRect(),pad=S.width*0.03;
      const sameRow=P.top<N.bottom&&P.bottom>N.top;return N.left<S.left+pad-1||N.right>(sameRow?P.left-pad*1.5:S.right-pad)+1};
    let i=0;while(bad()&&i++<30)nm.style.fontSize=(parseFloat(getComputedStyle(nm).fontSize)*0.93)+'px'}
  new ResizeObserver(()=>fitSign()).observe(q('.tx-88'));
  function fitFare(){const f=q('.tx-fare');f.style.fontSize='';let i=0;while(f.scrollWidth>f.clientWidth+1&&i++<12){const cur=parseFloat(getComputedStyle(f).fontSize);f.style.fontSize=(cur*0.92)+'px'}}
  // 레트로 숫자 드럼: 자리마다 0~9 띠를 위아래로 굴림
  function setDrums(sel,str){const ds=qa(sel+' .rt-dr');const t=str.padStart(ds.length,'0').slice(-ds.length);ds.forEach((d,i)=>{d.firstChild.style.transform='translateY('+(-10*(+t[i]||0))+'%)'})}
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
    W.dataset.tx=PV?'run':S.paid?'paid':S.on?'run':'idle';W.dataset.txvac=!PV&&!S.on&&!S.paid&&!S.fare?'1':'';
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
  /* 레트로: 요금이 오를 때 동전 떨어지는 소리(웹오디오로 합성 — 금속성 '찰랑' 두 번) */
  function coin(){try{const a=fx();if(!a)return;const t0=a.currentTime;
    [[0,1],[0.085,.55]].forEach(([d,v])=>{const t=t0+d;[[2637,.5],[3951,.32],[5274,.18],[6890,.1]].forEach(([f,g])=>{const o=a.createOscillator();o.type='sine';o.frequency.setValueAtTime(f*(1+d*.04),t);
      const e=fxEnv(a,t,g*v*.35,.002,d?.25:.42);o.connect(e).connect(a.destination);o.start(t);o.stop(t+.5)})});
    const nz=fxNoise(a,.03),ng=fxEnv(a,t0,.12,.001,.03);nz.connect(ng).connect(a.destination);nz.start(t0)}catch(e){}}
  function surPct(r){const nt=/40/.test(r.tag)?40:/20/.test(r.tag)?20:0;return Math.min(60,nt+(S.sur||0))}
  function add(n){S.fare+=n;if(W.dataset.txskin==='retro')coin();W.classList.remove('tx-tick');void W.offsetWidth;W.classList.add('tx-tick')}
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
  return {start,pause,pay,reset,setSkin,fit,coin,showPhoto,get skin(){return W.dataset.txskin},get state(){return Object.assign({},S)},rate,_tick:tick,horse,horse2,
    _preview(v){PV=v||null;ui()}};
})();
window.AmpTaxi=Taxi;window.TaxiHorseTest=TaxiHorse;   // 시험(테스트 49)에서 말만 따로 그려 볼 때
