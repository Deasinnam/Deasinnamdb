/* 1.53 시험판 안내: 처음 실행할 때 한 번, 쓰는 권한과 데이터 처리를 먼저 알려 주고 동의를 받음(권한 요청 전에)
 *  - 배포용 테스트·안드로이드 테스트용에서만. 설정 맨 아래에 다시 보기 */
const BuildNotice=(()=>{
  const PRIV='https://github.com/Deasinnam/Deasinnamdb/blob/daesinnam-one-v1/docs/privacy.md';
  const NAME=BUILD==='play'?'대신남 원 안드로이드 테스트용':'대신남 배포용 테스트';
  function html(){return `<div class="bn-card" role="document"><b class="bn-t">${NAME}</b><span class="bn-tag">시험판</span>
    <p>시험용으로 배포하는 앱이에요. 기능과 화면이 바뀔 수 있고, 기존 대신남 원과 따로 설치돼요.</p>
    <h4>이 앱이 쓰는 권한과 데이터</h4><ul>
    <li><b>위치(정밀)</b> — 속도계·지도·과속 카메라 안내·날씨. 위치는 폰 안에서만 쓰고 개발자에게 보내지 않아요. 지도·날씨·과속 카메라 정보를 받을 때 그 지역 좌표가 지도(OpenStreetMap)·날씨 제공처로 전달돼요.</li>
    <li><b>마이크</b> — 재생 화면 시각화(소리 크기만 읽고 녹음·저장하지 않음). 켤 때만 요청해요.</li>
    <li><b>카메라</b> — 블랙박스 녹화를 켤 때만. 영상은 폰 안에만 저장돼요.</li>
    <li><b>블루투스·근처 기기</b> — 차에 연결되면 이어서 재생.</li>
    <li><b>SOS 연락처</b> — 고른 번호 하나만 이 폰에 저장${BUILD==='play'?', 전화는 다이얼 화면을 열어 직접 걸어요':''}.</li></ul>
    <p class="bn-s">라디오는 방송사 공식 앱·웹으로 연결하고, 가사는 곡 파일에 들어 있는 것만 보여 줘요. 과속 카메라 자료: 공공데이터포털(경찰청 전국무인교통단속카메라표준데이터, 공공누리 제1유형). 지도 © OpenStreetMap 기여자.</p>
    <div class="bn-act"><button class="pill" id="bnPriv">개인정보처리방침</button><button class="pill on" id="bnOk">확인하고 시작</button></div></div>`}
  function show(force){if(!PUB)return;if(!force&&store.get('pubNotice',0)>=1)return;
    let el=$('#buildNotice');if(!el){el=document.createElement('div');el.id='buildNotice';el.className='bn-wrap';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',NAME+' 안내');document.body.appendChild(el)}
    el.innerHTML=html();el.hidden=false;
    $('#bnOk').onclick=()=>{store.set('pubNotice',1);el.hidden=true};
    $('#bnPriv').onclick=()=>{try{if(NB&&NB.openUrl)NB.openUrl(PRIV);else window.open(PRIV,'_blank','noopener')}catch(e){}}}
  return {show,get accepted(){return store.get('pubNotice',0)>=1},PRIV};
})();
