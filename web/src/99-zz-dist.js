/* 1.84 배포용 에어포스원(airdist) 제한 — 네이티브 distFlags()(시험은 window.__dist):
 *  noradio: 인터넷 라디오를 모두 뺌(저작권). 라디오 화면·버튼·레일·전환 버튼·자동 재생 음원에서 사라지고, 라디오로 가려던 곳은 다른 화면으로
 *  1.87: 라디오 자리(버튼·레일·창·포커스 'radio')는 택시 미터기(99-zz-taxi.js)가 씀
 *  lite: 외부 앱 소리(YouTube Music·Spotify) 가져오기도 뺌 — 내 음악만. full판은 외부 앱 그대로 */
const DIST=DISTF;
(function(){
  const R=document.documentElement,noRadio=/noradio/.test(DIST),lite=/lite/.test(DIST);
  if(!noRadio&&!lite)return;
  if(noRadio){
    R.setAttribute('data-noradio','');
    try{rdPlay=function(){}}catch(e){}
    if(window.AmpRadio)Object.assign(window.AmpRadio,{open(){},play(){},resume(){},step(){},toggle(){}});
    try{if(store.get('lastSrc','')==='radio')store.set('lastSrc','local');if(store.get('carSrc','')==='radio')store.set('carSrc','auto')}catch(e){}
    document.querySelectorAll('#sCarSrc option[value="radio"]').forEach(o=>o.remove());
    const e=document.querySelector('#npEmpty span');if(e)e.textContent=lite?'음악을 추가해 보세요.':'음악을 추가하거나 YouTube Music·Spotify를 틀어 보세요.';
    const cs=document.querySelector('#sCarSrc')?.closest('label')?.querySelector('small');if(cs)cs.textContent=cs.textContent.replace('·라디오','');
  }
  if(lite){
    R.setAttribute('data-noext','');
    if(window.AmpExt)try{window.AmpExt.start=function(){}}catch(e){}
    document.querySelectorAll('#sCarSrc option[value="ytm"],#sCarSrc option[value="spotify"]').forEach(o=>o.remove());
    try{const m=store.get('lastSrc','');if(m==='ytm'||m==='spotify'||m==='ext')store.set('lastSrc','local')}catch(e){}
  }
  window.AmpDist={noRadio,lite,airline:/airline/.test(DIST),dsp:/dsp/.test(DIST),flags:DIST,focus:f=>ckFocus(f)};
})();
