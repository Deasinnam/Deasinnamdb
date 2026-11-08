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
    ['volUp','소리 크게',()=>vol1(1)],['volDn','소리 작게',()=>vol1(-1)],['zoomIn','지도 확대',()=>AmpTk.mapZoom(1)],['zoomOut','지도 축소',()=>AmpTk.mapZoom(-1)],
    ['camDemo','과속 경고 예시',()=>AmpCam.demo()],['set','설정 열기',()=>openSettings()],['none','(없음)',()=>{}]];
  // 장치 키 번호 → 화면 위치(5칸×3줄, 왼쪽 위부터 1~15): 장치 번호 = (4-열)*3 + 줄 + 1
  const POS={};for(let r=0;r<3;r++)for(let c=0;c<5;c++)POS[(4-c)*3+r+1]=r*5+c+1;
  const ACT=Object.fromEntries(ACTS.map(a=>[a[0],a]));
  // 키 번호(1~15)가 보이는 장치의 기본 배치: 윗줄 재생 조작, 가운데 화면, 아랫줄 운전 기능
  const DEF={k1:'prev',k2:'play',k3:'next',k4:'swap',k5:'mute',k6:'gps',k7:'map',k8:'radio',k9:'vis',k10:'all',k11:'rec',k12:'day',k13:'tmap',k14:'nmap',k15:'land'};
  let map=Object.assign({},store.get('deckMap',null)||DEF),learn=null,last={id:'',t:0},st={},raw=[];
  const save=()=>{store.set('deckMap',map);try{pushImages()}catch(e){}};
  function parse(hex){const b=[];for(let i=0;i<hex.length;i+=2)b.push(parseInt(hex.substr(i,2),16));
    if(b[0]===0x41&&b[1]===0x43&&b[2]===0x4b){                     // "ACK"
      if(b[5]===0x54&&b[6]===0x46)return null;                        // 펌웨어 정보 응답
      if(b[5]===0x43&&b[6]===0x42)return null;                        // 명령 확인 응답
      // TS115(293S 펌웨어): 누를 때만 "ACK··OK··<키>" 한 번(뗄 때 신호 없음). 장치 번호는 세로 줄 순서라 화면 위치 번호(왼쪽 위 1 → 오른쪽 아래 15)로 바꿈
      const raw=b[9];if(raw>0&&raw<=15&&!b[10]){const k=POS[raw];return {id:'k'+k,down:true,label:k+'번 키'}}
      const k=raw,down=b[10]!==0;if(k>0&&k<64)return {id:'k'+k,down,label:k+'번 키'};}
    if(b[0]===0x48&&b[1]===0x41&&b[2]===0x4e)return null;             // 장치가 인사를 다시 청함(앱이 처리)
    return {id:'r'+hex.slice(0,24),down:true,label:'키('+hex.slice(0,8)+'…)'}}
  function onReport(hex){raw.unshift(hex);raw.length=Math.min(raw.length,6);ui();
    const k=parse(hex);if(!k||!k.down)return;const now=Date.now();if(k.id===last.id&&now-last.t<220)return;last={id:k.id,t:now};
    if(learn){for(const x in map)if(map[x]===learn)delete map[x];map[k.id]=learn;save();toast(k.label+' → '+ACT[learn][1]);learn=null;ui();return}
    const a=ACT[map[k.id]];if(!a){toast('몬스타덱 '+k.label+': 설정 › 몬스타덱에서 기능을 정해 주세요.');return}
    try{sndKey()}catch(e){}try{a[2]()}catch(e){}flash(a[1])}
  let flT=0;function flash(t){const el=$('#deckFlash');if(!el)return;el.textContent=t;el.hidden=false;clearTimeout(flT);flT=setTimeout(()=>el.hidden=true,900)}
  window.__deck=onReport;
  // 키 화면 그림: 연결될 때와 배치를 바꿀 때 화면 위치 1~15의 기능 아이콘 + 오른쪽 로고를 장치에 넣음
  let imgT=0,wasOpen=false;
  function pushImages(){clearTimeout(imgT);imgT=setTimeout(()=>{try{if(NB&&NB.deckImages&&st.open)NB.deckImages(JSON.stringify(Array.from({length:15},(_,i)=>map['k'+(i+1)]||'none')))}catch(e){}},300)}
  window.__deckState=s=>{st=s||{};if(st.open&&!wasOpen)pushImages();wasOpen=!!st.open;ui()};
  function stateNow(){try{if(NB&&NB.deckState){st=JSON.parse(NB.deckState()||'{}');if(st.open&&!wasOpen)pushImages();wasOpen=!!st.open}}catch(e){}}
  function ui(){const sec=$('#secDeck');if(!sec)return;
    const s=$('#deckStat');s.textContent=!NB||!NB.deckState?'안드로이드 앱에서 동작해요(폴드에 USB-C로 꽂아 쓰세요).':st.open?'연결됨 · 키를 누르면 바로 동작해요':st.present?(st.err||'꽂혀 있어요 · [연결]을 눌러 주세요'):(st.err||'몬스타덱이 연결되어 있지 않아요');
    s.dataset.ok=st.open?'1':'';
    const al=$('#deckAll');if(al){const L=st.all||[];al.textContent=!NB||!NB.deckState?'':L.length?'폴드에 꽂힌 USB 장치: '+L.join(' / '):'폴드에 꽂힌 USB 장치 없음 — 폴드가 몬스타덱을 USB 장치로 인식하지 못했어요(OTG 젠더로 연결해 보세요)'}
    $('#deckRaw').textContent=raw.length?raw.slice(0,3).join(' · '):'아직 없음 — 몬스타덱 키를 눌러 보세요';
    const ul=$('#deckMap');const rows=ACTS.filter(a=>a[0]!=='none').map(a=>{const keys=Object.keys(map).filter(k=>map[k]===a[0]).map(k=>k[0]==='k'?k.slice(1)+'번':'키');
      return '<li data-a="'+a[0]+'" class="'+(learn===a[0]?'learn':'')+'"><span>'+a[1]+'</span><em>'+(learn===a[0]?'몬스타덱 키를 누르세요…':keys.length?keys.join(', '):'—')+'</em><button type="button" class="pill" data-learn="'+a[0]+'">'+(learn===a[0]?'취소':'키 지정')+'</button></li>'}).join('');
    if(ul.__h!==rows){ul.__h=rows;ul.innerHTML=rows}}
  $('#deckMap').addEventListener('click',e=>{const b=e.target.closest('[data-learn]');if(!b)return;e.preventDefault();learn=learn===b.dataset.learn?null:b.dataset.learn;ui()});
  $('#deckConn').onclick=e=>{e.preventDefault();try{if(NB&&NB.deckConnect){NB.deckConnect();setTimeout(()=>{stateNow();ui()},800)}else toast('몬스타덱 연결은 안드로이드 앱에서 동작해요.')}catch(x){}};
  $('#deckReset').onclick=e=>{e.preventDefault();map=Object.assign({},DEF);save();learn=null;ui();toast('기본 배치로 되돌렸어요.')};
  $('#deckBri').oninput=e=>{try{NB&&NB.deckBright&&NB.deckBright(+e.target.value)}catch(x){}store.set('deckBri',+e.target.value)};
  $('#deckBri').value=store.get('deckBri',70);
  stateNow();ui();setInterval(()=>{if(!$('#settings').hidden){stateNow();ui()}},1500);
  /* 1.37 블루투스 다이얼·키패드(울란지 D100H 등): 폴드와 블루투스로 짝을 맺으면 버튼·단축키·다이얼 돌리기를 키처럼 배워서 기능에 붙임.
   * 앱이 정한 키만 가로채고(나머지 키·휠은 원래대로), 배우는 동안에는 모든 외부 키를 받음. */
  // 측면 버튼 4개(기본 모드: 붙여넣기·복사·실행 취소·다시 실행 — 윈도우 모드 Ctrl, 맥 모드 ⌘)는 '@ulanzi'로 그 다이얼에서 온 것만 받음
  const SIDE={'Ctrl+V':'swap','Ctrl+C':'map','Ctrl+Z':'gps','Ctrl+Y':'day','Ctrl+Shift+Z':'day','Meta+V':'swap','Meta+C':'map','Meta+Z':'gps','Meta+Shift+Z':'day','Meta+Y':'day'};
  const HW_DEF=Object.assign({MEDIA_PREVIOUS:'prev',MEDIA_PLAY_PAUSE:'play',MEDIA_NEXT:'next'},Object.fromEntries(Object.entries(SIDE).map(([k,v])=>[k+'@ulanzi',v])));
  let hw=Object.assign({},HW_DEF,store.get('hwMap',null)||{}),hwLearn=null,hwLast={id:'',t:0},hwRaw=[];
  const HWN={WHEEL_UP:'다이얼 ↻(위)',WHEEL_DOWN:'다이얼 ↺(아래)',VOLUME_UP:'다이얼 ↻(소리+)',VOLUME_DOWN:'다이얼 ↺(소리−)',MEDIA_PREVIOUS:'이전 버튼',MEDIA_PLAY_PAUSE:'재생 버튼',MEDIA_NEXT:'다음 버튼',
    V:'측면 붙여넣기',C:'측면 복사',Z:'측면 실행 취소',Y:'측면 다시 실행','Shift+Z':'측면 다시 실행'};
  const hwName=id=>{const k=id.replace(/@.*/,''),side=k.replace(/^(Ctrl|Meta)\+/,'');return HWN[k]||(k!==side&&HWN[side])||k.replace(/_/g,' ')};
  function hwSync(){try{NB&&NB.hwKeys&&NB.hwKeys(JSON.stringify(Object.keys(hw)),!!hwLearn)}catch(e){}}
  window.__hwKey=(id,dev)=>{hwRaw.unshift(id+(dev?' · '+dev:''));hwRaw.length=Math.min(hwRaw.length,4);
    const now=Date.now();const wheel=/^WHEEL|^VOLUME/.test(id);if(!wheel&&id===hwLast.id&&now-hwLast.t<200)return;hwLast={id,t:now};
    const key=/^(Ctrl|Meta|Alt)\+/.test(id)&&/ulanzi/i.test(dev||'')?id+'@ulanzi':id;
    if(hwLearn){for(const x in hw)if(hw[x]===hwLearn)delete hw[x];delete hw[id];delete hw[id+'@ulanzi'];hw[key]=hwLearn;store.set('hwMap',hw);toast(hwName(id)+' → '+ACT[hwLearn][1]);hwLearn=null;hwSync();hwUi();return}
    hwUi();const a=ACT[hw[id]]||(/ulanzi/i.test(dev||'')&&ACT[hw[id+'@ulanzi']]);if(!a)return;try{if(!wheel)sndKey()}catch(e){}try{a[2]()}catch(e){}if(!wheel)flash(a[1])};
  function hwUi(){const ul=$('#hwMap');if(!ul)return;
    let devs=[];try{devs=[...new Set(JSON.parse(NB&&NB.hwDevices?NB.hwDevices():'[]'))]}catch(e){}
    $('#hwStat').textContent=!NB||!NB.hwKeys?'안드로이드 앱에서 동작해요(폴드와 블루투스로 짝을 맺어 쓰세요).':devs.length?'연결된 장치: '+devs.join(', '):'외부 장치가 없어요 — 폴드 설정 › 연결 › 블루투스에서 다이얼과 짝을 맺어 주세요';
    $('#hwRaw').textContent=hwRaw.length?hwRaw.slice(0,3).join(' · '):'아직 없음 — 다이얼 버튼을 누르거나 돌려 보세요';
    const rows=ACTS.filter(a=>a[0]!=='none').map(a=>{const keys=[...new Set(Object.keys(hw).filter(k=>hw[k]===a[0]).map(hwName))];
      return '<li data-a="'+a[0]+'" class="'+(hwLearn===a[0]?'learn':'')+'"><span>'+a[1]+'</span><em>'+(hwLearn===a[0]?'다이얼 버튼을 누르거나 돌리세요…':keys.length?keys.join(', '):'—')+'</em><button type="button" class="pill" data-hwlearn="'+a[0]+'">'+(hwLearn===a[0]?'취소':'키 지정')+'</button></li>'}).join('');
    if(ul.__h!==rows){ul.__h=rows;ul.innerHTML=rows}}
  $('#hwMap').addEventListener('click',e=>{const b=e.target.closest('[data-hwlearn]');if(!b)return;e.preventDefault();hwLearn=hwLearn===b.dataset.hwlearn?null:b.dataset.hwlearn;hwSync();hwUi()});
  $('#hwReset').onclick=e=>{e.preventDefault();hw=Object.assign({},HW_DEF);store.set('hwMap',hw);hwLearn=null;hwSync();hwUi();toast('기본 배치로 되돌렸어요.')};
  hwSync();hwUi();setInterval(()=>{if(!$('#settings').hidden)hwUi()},2000);
  window.AmpHw={get map(){return hw},learn(a){hwLearn=a;hwSync();hwUi()},key:(id,dev)=>window.__hwKey(id,dev||'')};
  window.AmpDeck={images:()=>pushImages(),report:onReport,get map(){return map},learn(a){learn=a;ui()},parse,ACTS:ACTS.map(a=>a[0])};
})();
