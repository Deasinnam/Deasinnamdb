// 1.85 초기 세팅 방법(사용 설명서): 위 도구 줄 [📖] 버튼 · 설정 창 맨 위 버튼 → 그림·짧은 영상과 함께 단계별 안내
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* 그림은 assets/guide/*.jpg(실제 화면을 찍어 번호를 붙인 것), 영상은 assets/guide/*.mp4(사용자가 찍은 주행 영상에서 자른 것)
 * 배포판 차이: 라디오 없는 판은 라디오 이야기를 하지 않고, 라이트판(외부 앱 없음)은 '외부 앱' 단계를 뺌 */
const Guide=(()=>{
  const flags=()=>{const d=window.AmpDist||{};return {lite:!!d.lite,noRadio:!!d.noRadio}};
  const click=sel=>{const e=$(sel);if(e){e.scrollIntoView({block:'center'});e.click();return true}return false};
  const STEPS=[
    {k:'gps',t:'위치(GPS) 켜기',m:'guide/g-gps.jpg',l:[
      '처음 켜면 위치 권한을 물어요. <b>앱 사용 중에만 허용</b>을 눌러 주세요.',
      '① 스피드미터 제목줄에 <b>GPS 수신</b>이 보이면 준비 끝이에요.',
      '② 안 보이면 콕핏 컨트롤의 <b>GPS 켜기</b>를 눌러요. 터널·지하 주차장에서는 잠깐 끊길 수 있어요.'],
      a:['GPS 켜기',()=>{const b=$('#gOn');if(b&&/켜기/.test(b.textContent))b.click();toast('GPS를 켰어요')}]},
    {k:'skin',t:'스킨 고르기 — 활주로 3종',m:'guide/g-skin.jpg',l:[
      '① 스피드미터 제목줄의 고르기를 누르면 맨 위에 <b>활주로 스킨</b> 3가지가 있어요.',
      '<b>자동차 모드</b>: 차량용 계기판 화면 · <b>에어라인</b>: 손으로 칠한 듯한 하늘과 활주로 · <b>3D 맵</b>: 실제 지도와 산 높이로 그린 3D 풍경(데이터를 조금 더 써요).',
      '② 아래 <b>계기판 디자인</b>에서 카본·네온·아날로그 같은 다른 계기판도 고를 수 있어요. 콕핏 컨트롤의 같은 고르기도 똑같이 바뀌어요.'],
      a:['스킨 고르기 열기',()=>{const s=$('#gStyleBar');if(!s)return;s.scrollIntoView({block:'center'});s.focus();try{s.showPicker()}catch(e){}}]},
    {k:'level',t:'수평 맞춤',m:'guide/g-level.jpg',l:[
      '휴대폰을 거치대에 단단히 고정해요.',
      '① 차가 <b>평평한 곳에 멈춰 있을 때</b> <b>수평 맞춤</b>을 눌러요. 그때 자세가 수평이 돼요.',
      '거치 각도를 바꿨거나 화면의 하늘이 기울어 보이면 다시 눌러요. 폴드는 펼친 화면·접은 화면에서 각각 한 번씩 맞춰 주세요.'],
      a:['지금 수평 맞추기',()=>{if(!click('#pfdLevelQuick'))click('#gLevel');toast('지금 자세를 수평으로 맞췄어요')}]},
    {k:'sky',t:'하늘 — 주간 · 야간',m:'guide/g-sky.jpg',l:[
      '① 스피드미터 왼쪽의 <b>하늘</b> 버튼을 누르면 하늘(주간·야간) 설정이 열려요. <b>자동</b>이면 실제 해 뜨고 지는 시각에 맞춰 낮 하늘·밤하늘로 바뀌어요.',
      '② 콕핏 컨트롤의 <b>주간 · 야간</b> 스위치와 같이 움직여요. 야간이면 눈부시지 않게 화면 밝기를 10%로 낮춰요.',
      '직접 고른 주간·야간은 실제 낮밤이 바뀌면 다시 자동으로 돌아가요.']},
    {k:'odo',t:'누적 주행거리 · 엔진오일',m:'guide/g-odo.jpg',l:[
      '① 스피드미터의 <b>누적 주행거리</b> 칸을 <b>길게 눌러</b> 차 계기판에 보이는 km를 넣어요. 그다음부터는 GPS로 달린 만큼 늘어나요.',
      '② 한 번 누르면 <b>엔진오일 교체까지 남은 거리</b>로 바뀌어요. 다시 누르면 누적 주행거리로 돌아와요.',
      '차계부 창에 오일 교체 기록·주기를 적어 두면 남은 거리가 정확해져요.']},
    {k:'music',t:'내 음악 넣기',m:'guide/g-music.jpg',l:[
      '① 위 도구 줄 맨 오른쪽 <b>음악 추가</b>로 휴대폰의 음악 파일이나 폴더를 골라요.',
      '② 플레이어에서 재생·곡 넘김·셔플·반복을 하고, EQUALIZER로 소리를 맞춰요.',
      '재생 중인 곡 제목은 스피드미터 아래쪽에 초록 글씨로 보여요.'],
      a:['음악 추가',()=>click('#addTop')]},
    {k:'ext',t:'외부 앱 소리 (YouTube Music · Spotify)',m:'guide/g-ext.jpg',full:1,l:[
      '① 위 도구 줄의 <b>외부 앱</b>을 누르고, EXTERNAL APPS 창에서 <b>열기</b>로 앱을 띄워 곡을 틀어요.',
      '② 곡 제목과 재생 조작을 받으려면 <b>권한 설정 → 설정 열기</b>를 눌러요.',
      '③ 휴대폰의 <b>알림 접근 허용</b> 목록에서 <b>대신남 원</b> 스위치를 켜요. 켜지지 않고 \'제한된 설정\'이 뜨면 <b>단계별 안내</b>를 따라 하세요.',
      '④ <b>사운드 시각화</b>도 <b>허용</b>을 누르면 외부 앱 소리에 맞춰 화면이 움직여요.'],
      a:['알림 접근 설정 열기',()=>{try{NB.openNotificationAccess()}catch(e){toast('휴대폰 설정 → 알림 → 알림 접근에서 켜 주세요')}}]},
    {k:'car',t:'차에 타면 자동으로',m:'guide/g-car.jpg',l:[
      '① 위 도구 줄의 <b>설정(⚙)</b>을 눌러요.',
      '② <b>자동 재생할 기기</b>에서 차 블루투스를 고르면 그 차에 연결될 때만 동작해요.',
      '③ <b>차에 연결되면 틀 음원</b>을 고르면 시동을 걸고 연결되자마자 음악이 이어서 나와요.'],
      a:['설정 열기',()=>click('#setBtn')]},
    {k:'taxi',t:'택시 미터기',m:'guide/g-taxi.jpg',noradio:1,l:[
      '① 버튼 줄의 <b>택시</b>를 누르면 택시 미터기가 열려요.',
      '② 분홍 <b>주행</b>을 누르면(화면을 눌러도 돼요) 기본요금부터 시작하고, 말이 달리면서 <b>GPS로 실제 달린 거리만큼</b> 요금이 올라가요. 느리게 가거나 서 있으면 30초마다 시간 요금이 붙어요.',
      '③ <b>서울 밖</b>으로 나가면 <b>시외 할증 20%</b>가 저절로 붙고(화면에 "시외", 경계는 대략이라 조금 다를 수 있어요) 서울로 돌아오면 꺼져요. <b>할증</b>은 손으로 켜는 20%, <b>복합</b>은 40%예요. 밤 10시~새벽 4시 심야 할증은 시간에 맞춰 저절로 붙어요.',
      '④ 도착하면 초록 <b>지불</b>로 낼 돈(100원 단위)을 보고, 흰 <b>빈차</b>로 처음으로 돌려요.',
      '⚠ <b>재미로만</b> 즐겨 주세요. 표시된 금액으로 실제 요금을 받거나 돈을 주고받으면 자가용 유상운송(「여객자동차 운수사업법」 제81조) 위반이 될 수 있어요.']},
    {k:'fly',t:'이륙 · 순항 · 착륙',v:'guide/v-flight.mp4',l:[
      '차가 서 있으면 활주로에서 대기(LINE UP)하고, 출발하면 <b>이륙</b>, 달리는 동안 <b>순항</b>, 멈추면 <b>착륙</b>해요.',
      '착륙하면 <b>평균 속도</b>와 <b>운전 평점</b>이 잠깐 보여요. 급가속·급제동·과속이 적을수록 점수가 높아요.',
      '<b>시연</b>을 누르면 서 있어도 이륙부터 착륙까지 미리 볼 수 있어요.'],
      a:['시연 보기',()=>{const b=document.querySelector('.flt-sim');if(b){if(!b.classList.contains('on'))b.click()}else toast('스피드미터를 에어라인 스킨으로 바꾸면 볼 수 있어요')}]},
    {k:'cam',t:'과속 카메라 · 원형 지도',v:'guide/v-cam.mp4',l:[
      '과속 카메라가 <b>500m 앞</b>에 오면 제한 속도와 남은 거리가 경고음과 함께 떠요.',
      '왼쪽 아래 <b>원형 지도</b>는 진행 방향이 위로 오게 돌아가요. ×로 끄고, 설정 → 스피드미터에 원형 지도로 다시 켜요.',
      '<b>3D 맵</b> 스킨에서는 실제 지형 위로 날아가요.'],v2:'guide/v-3d.mp4'}];
  // 1.86 배포판(대신남 스피드미터): 스킨은 에어라인 하나, 알림 접근 목록의 이름도 '대신남 스피드미터'
  const AIRLINE_SKIN={m:'guide/g-skin-d.jpg',t:'스킨 · 계기판 디자인',l:[
      '① 스피드미터 제목줄의 고르기를 누르면 맨 위에 <b>에어라인</b> 스킨이 있어요. 손으로 칠한 듯한 하늘과 활주로 위로 달려요.',
      '② 아래 <b>계기판 디자인</b>에서 카본·네온·아날로그 같은 다른 계기판도 고를 수 있어요. 다시 <b>에어라인</b>을 고르면 활주로 화면으로 돌아와요.',
      '콕핏 컨트롤의 같은 고르기도 똑같이 바뀌어요.']};
  const steps=()=>{const f=flags(),d=window.AmpDist||{},nm=d.dsp?'대신남 스피드미터':null;
    return STEPS.filter(s=>!(s.full&&f.lite)&&!(s.noradio&&!f.noRadio)).map(s=>{
      if(d.airline&&s.k==='skin')return Object.assign({},s,AIRLINE_SKIN);
      if(d.airline&&s.k==='cam')return Object.assign({},s,{v2:null,l:s.l.filter(x=>!/3D 맵/.test(x))});
      if(nm&&s.k==='ext')return Object.assign({},s,{m:'guide/g-ext-d.jpg',l:s.l.map(x=>x.replace('<b>대신남 원</b>','<b>'+nm+'</b>'))});
      return s})};
  let el=null,i=0,list=[],sx=null;const BLOB={};
  function build(){if(el)return;el=document.createElement('div');el.id='guide';el.className='gd';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','초기 세팅 방법');
    el.innerHTML='<div class="gd-card"><div class="gd-hd"><b>초기 세팅 방법</b><span class="gd-n"></span><button type="button" class="gd-x" aria-label="닫기">×</button></div>'
      +'<div class="gd-tabs"></div><div class="gd-bd"><div class="gd-m"></div><div class="gd-tx"><h3></h3><ol></ol><button type="button" class="pill on gd-a" hidden></button></div></div>'
      +'<div class="gd-ft"><button type="button" class="pill gd-p">이전</button><div class="gd-dots"></div><button type="button" class="pill on gd-nx">다음</button></div></div>';
    document.body.appendChild(el);
    el.querySelector('.gd-x').onclick=close;el.addEventListener('click',e=>{if(e.target===el)close()});
    el.querySelector('.gd-p').onclick=()=>go(i-1);el.querySelector('.gd-nx').onclick=()=>i>=list.length-1?close():go(i+1);
    el.querySelector('.gd-tabs').onclick=e=>{const b=e.target.closest('button[data-i]');if(b)go(+b.dataset.i)};
    el.querySelector('.gd-a').onclick=()=>{const s=list[i];if(!s||!s.a)return;if(s.k!=='ext')close();setTimeout(()=>{try{s.a[1]()}catch(e){}},s.k==='ext'?0:250)};
    const bd=el.querySelector('.gd-bd');
    bd.addEventListener('touchstart',e=>{sx=e.touches[0].clientX},{passive:true});
    bd.addEventListener('touchend',e=>{if(sx==null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>60)go(i+(dx<0?1:-1))},{passive:true});
    document.addEventListener('keydown',e=>{if(el.hidden)return;if(e.key==='Escape')close();else if(e.key==='ArrowRight')go(i+1);else if(e.key==='ArrowLeft')go(i-1)})}
  function media(s){const m=el.querySelector('.gd-m');m.textContent='';
    // 영상은 통째로 받아 blob으로 재생(앱 안 파일 응답은 구간 요청을 못 받아도 되게), 안 되면 정지 그림
    const add=src=>{if(/\.mp4$/.test(src)){const v=document.createElement('video');v.muted=true;v.loop=true;v.autoplay=true;v.playsInline=true;v.setAttribute('playsinline','');v.poster=src.replace(/\.mp4$/,'.jpg');m.appendChild(v);
        const go=u=>{v.src=u;v.play().catch(()=>{})};if(BLOB[src])go(BLOB[src]);else fetch(src).then(r=>{if(!r.ok)throw 0;return r.blob()}).then(b=>go(BLOB[src]=URL.createObjectURL(new Blob([b],{type:'video/mp4'})))).catch(()=>go(src))}
      else{const im=new Image();im.src=src;im.alt=s.t;im.loading='lazy';m.appendChild(im)}};
    add(s.m||s.v);if(s.v2)add(s.v2);m.classList.toggle('two',!!s.v2)}
  function go(n){list=steps();i=Math.max(0,Math.min(list.length-1,n));const s=list[i];
    el.querySelector('.gd-n').textContent=(i+1)+' / '+list.length;
    el.querySelector('h3').textContent=(i+1)+'. '+s.t;
    el.querySelector('ol').innerHTML=s.l.map(x=>'<li>'+x+'</li>').join('');
    const a=el.querySelector('.gd-a');a.hidden=!s.a;if(s.a)a.textContent=s.a[0];
    media(s);
    el.querySelector('.gd-tabs').innerHTML=list.map((x,j)=>'<button type="button" data-i="'+j+'"'+(j===i?' class="on"':'')+'>'+(j+1)+'. '+x.t.replace(/ —.*| \(.*/,'')+'</button>').join('');
    const on=el.querySelector('.gd-tabs .on');if(on)on.scrollIntoView({block:'nearest',inline:'center'});
    el.querySelector('.gd-dots').innerHTML=list.map((x,j)=>'<i'+(j===i?' class="on"':'')+'></i>').join('');
    el.querySelector('.gd-p').disabled=i===0;el.querySelector('.gd-nx').textContent=i>=list.length-1?'완료':'다음';
    el.querySelector('.gd-bd').scrollTop=0}
  function open(n){build();el.hidden=false;document.documentElement.setAttribute('data-guide','');store.set('guideSeen',true);$('#guideBtn')&&$('#guideBtn').classList.remove('gd-new');go(typeof n==='string'?Math.max(0,steps().findIndex(s=>s.k===n)):n||0)}
  function close(){if(!el)return;el.hidden=true;document.documentElement.removeAttribute('data-guide');el.querySelectorAll('video').forEach(v=>v.pause())}
  const gb=$('#guideBtn');if(gb){gb.onclick=e=>{e.stopPropagation();open(0)};if(!store.get('guideSeen',false))gb.classList.add('gd-new')}
  const sg=$('#sGuide');if(sg)sg.onclick=()=>{try{$('#setClose')&&$('#setClose').click()}catch(e){}open(0)};
  // 처음 설치: 한 번만 버튼 위치를 알려 줌(창을 저절로 띄우지는 않음)
  if(APP!=='amp'&&!store.get('guideHint',false)){store.set('guideHint',true);setTimeout(()=>toast('처음이세요? 위 도구 줄의 [📖 초기 세팅 방법]에서 설정 순서를 그림으로 볼 수 있어요.'),4200)}
  return {open,close,steps:()=>steps().map(s=>s.k),get index(){return i}}})();
window.AmpGuide=Guide;
