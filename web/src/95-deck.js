/* 1.35 몬스타덱(USB 단축키 패드) — 폴드에 꽂으면 앱이 직접 읽어 키마다 대신남 원 기능을 실행
 * 장치가 보내는 보고서(16진수)를 받아 키를 알아보고, 설정 › 몬스타덱에서 키마다 기능을 정함(키 배우기).
 * 보고서가 "ACK … OK" 형식이면 9번째 바이트를 키 번호로 쓰고(1~15 기본 배치), 아니면 보고서 모양 자체를 키로 기억함. */
(function(){
  const ACTS=[
    ['play','재생 · 일시정지',()=>AmpTk.toggle()],['prev','이전 곡',()=>AmpTk.prev()],['next','다음 곡',()=>AmpTk.next()],
    ['swap','라디오 ↔ 음악 앱',()=>$('#bSwap').click()],['mute','음소거',()=>$('#dkMuteSwitch')?.click()],
    ['gps','스피드미터',()=>ckFocus('gps')],['map','지도',()=>ckFocus('map')],['radio','라디오 화면',()=>ckFocus('radio')],
    ['vis','NOW PLAYING',()=>ckFocus('vis')],['all','전체 보기',()=>ckFocus('all')],['cam','DASHCAM 화면',()=>ckFocus('cam')],
    ['rec','주행 녹화 켜기/끄기',()=>$('#dkRecSwitch')?.click()],['day','주간 ↔ 야간',()=>$('#dkDaySwitch')?.click()],
    ['tmap','T맵 열기',()=>navOpen('tmap')],['nmap','네이버지도 열기',()=>navOpen('nmap')],
    ['land','착륙',()=>{if(window.AmpFlight&&!AmpFlight.land())toast('착륙은 순항 중에만 할 수 있어요.')}],
    ['briUp','화면 밝게',()=>briSet(briBase()+10)],['briDn','화면 어둡게',()=>briSet(briBase()-10)],
    ['camDemo','과속 경고 예시',()=>AmpCam.demo()],['set','설정 열기',()=>openSettings()],['none','(없음)',()=>{}]];
  const ACT=Object.fromEntries(ACTS.map(a=>[a[0],a]));
  // 키 번호(1~15)가 보이는 장치의 기본 배치: 윗줄 재생 조작, 가운데 화면, 아랫줄 운전 기능
  const DEF={k1:'prev',k2:'play',k3:'next',k4:'swap',k5:'mute',k6:'gps',k7:'map',k8:'radio',k9:'vis',k10:'all',k11:'rec',k12:'day',k13:'tmap',k14:'nmap',k15:'land'};
  let map=Object.assign({},store.get('deckMap',null)||DEF),learn=null,last={id:'',t:0},st={},raw=[];
  const save=()=>store.set('deckMap',map);
  function parse(hex){const b=[];for(let i=0;i<hex.length;i+=2)b.push(parseInt(hex.substr(i,2),16));
    if(b[0]===0x41&&b[1]===0x43&&b[2]===0x4b){                     // "ACK"
      if(b[5]===0x54&&b[6]===0x46)return null;                        // 펌웨어 정보 응답
      if(b[5]===0x43&&b[6]===0x42)return null;                        // 명령 확인 응답
      const k=b[9],down=b[10]!==0;if(k>0&&k<64)return {id:'k'+k,down,label:k+'번 키'};}
    if(b[0]===0x48&&b[1]===0x41&&b[2]===0x4e)return null;             // 장치가 인사를 다시 청함(앱이 처리)
    return {id:'r'+hex.slice(0,24),down:true,label:'키('+hex.slice(0,8)+'…)'}}
  function onReport(hex){raw.unshift(hex);raw.length=Math.min(raw.length,6);ui();
    const k=parse(hex);if(!k||!k.down)return;const now=Date.now();if(k.id===last.id&&now-last.t<220)return;last={id:k.id,t:now};
    if(learn){for(const x in map)if(map[x]===learn)delete map[x];map[k.id]=learn;save();toast(k.label+' → '+ACT[learn][1]);learn=null;ui();return}
    const a=ACT[map[k.id]];if(!a){toast('몬스타덱 '+k.label+': 설정 › 몬스타덱에서 기능을 정해 주세요.');return}
    try{sndKey()}catch(e){}try{a[2]()}catch(e){}flash(a[1])}
  let flT=0;function flash(t){const el=$('#deckFlash');if(!el)return;el.textContent=t;el.hidden=false;clearTimeout(flT);flT=setTimeout(()=>el.hidden=true,900)}
  window.__deck=onReport;
  window.__deckState=s=>{st=s||{};ui()};
  function stateNow(){try{if(NB&&NB.deckState)st=JSON.parse(NB.deckState()||'{}')}catch(e){}}
  function ui(){const sec=$('#secDeck');if(!sec)return;
    const s=$('#deckStat');s.textContent=!NB||!NB.deckState?'안드로이드 앱에서 동작해요(폴드에 USB-C로 꽂아 쓰세요).':st.open?'연결됨 · 키를 누르면 바로 동작해요':st.present?(st.err||'꽂혀 있어요 · [연결]을 눌러 주세요'):(st.err||'몬스타덱이 연결되어 있지 않아요');
    s.dataset.ok=st.open?'1':'';
    $('#deckRaw').textContent=raw.length?'받은 신호: '+raw.slice(0,3).join(' · '):'받은 신호 없음';
    const ul=$('#deckMap');const rows=ACTS.filter(a=>a[0]!=='none').map(a=>{const keys=Object.keys(map).filter(k=>map[k]===a[0]).map(k=>k[0]==='k'?k.slice(1)+'번':'키');
      return '<li data-a="'+a[0]+'" class="'+(learn===a[0]?'learn':'')+'"><span>'+a[1]+'</span><em>'+(learn===a[0]?'몬스타덱 키를 누르세요…':keys.length?keys.join(', '):'—')+'</em><button type="button" class="pill" data-learn="'+a[0]+'">'+(learn===a[0]?'취소':'키 지정')+'</button></li>'}).join('');
    if(ul.__h!==rows){ul.__h=rows;ul.innerHTML=rows}}
  $('#deckMap').addEventListener('click',e=>{const b=e.target.closest('[data-learn]');if(!b)return;e.preventDefault();learn=learn===b.dataset.learn?null:b.dataset.learn;ui()});
  $('#deckConn').onclick=e=>{e.preventDefault();try{if(NB&&NB.deckConnect){NB.deckConnect();setTimeout(()=>{stateNow();ui()},800)}else toast('몬스타덱 연결은 안드로이드 앱에서 동작해요.')}catch(x){}};
  $('#deckReset').onclick=e=>{e.preventDefault();map=Object.assign({},DEF);save();learn=null;ui();toast('기본 배치로 되돌렸어요.')};
  $('#deckBri').oninput=e=>{try{NB&&NB.deckBright&&NB.deckBright(+e.target.value)}catch(x){}store.set('deckBri',+e.target.value)};
  $('#deckBri').value=store.get('deckBri',70);
  stateNow();ui();setInterval(()=>{if(!$('#settings').hidden){stateNow();ui()}},1500);
  window.AmpDeck={report:onReport,get map(){return map},learn(a){learn=a;ui()},parse,ACTS:ACTS.map(a=>a[0])};
})();
