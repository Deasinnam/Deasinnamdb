/* 1.34 [전환] 키: 라디오를 듣다가 누르면 듣던 음악 앱(YouTube Music·Spotify)으로, 음악 앱을 듣다가 누르면 라디오로 */
(function(){const b=$('#bSwap'),t=$('#bSwapT');if(!b)return;
  const PK={'com.google.android.apps.youtube.music':'YT Music','com.spotify.music':'Spotify'};
  const onRadio=()=>{try{return rdPlaying||rdSel()}catch(e){return false}};
  const appPkg=()=>store.get('extPkg','')||(ext&&ext.pkg&&PK[ext.pkg]?ext.pkg:'');
  function label(){const r=onRadio(),pk=appPkg(),to=r?(PK[pk]||'음악 앱'):'라디오';
    if(t.textContent!==to)t.textContent=to;const al=to+'(으)로 전환';if(b.getAttribute('aria-label')!==al){b.setAttribute('aria-label',al);b.dataset.to=r?'app':'radio'}}
  function toApp(){const pk=appPkg();try{radioStop()}catch(e){}store.set('lastSrc','ext');
    if(HAS_EXT&&mode!=='ext')setMode('ext');
    if(!pk){if(HAS_EXT){setMode('ext');toast('YouTube Music 또는 Spotify를 한 번 골라 주세요. 다음부터는 이 버튼으로 바로 돌아가요.')}else toast('음악 앱 전환은 안드로이드 앱에서 동작해요.');return}
    let ok=false;try{if(NB&&NB.mediaPlay){NB.mediaPlay(pk);ok=true}}catch(e){}
    if(!ok){try{X('play');ok=HAS_EXT}catch(e){}}
    toast(ok?(PK[pk]||'음악 앱')+'(으)로 돌아왔어요. 듣던 곡을 이어서 재생해요.':'음악 앱 전환은 안드로이드 앱에서 동작해요.')}
  function toRadio(){try{if(mode==='ext'&&ext&&ext.playing)X('pause')}catch(e){}try{AmpRadio.resume();toast('라디오로 전환해요.')}catch(e){}}
  b.addEventListener('click',()=>{onRadio()?toApp():toRadio();setTimeout(label,120);setTimeout(label,900)});
  label();setInterval(label,1000);
  window.AmpSwap={label,toApp,toRadio,get to(){return b.dataset.to}};
})();
