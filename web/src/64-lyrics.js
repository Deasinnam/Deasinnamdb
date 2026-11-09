/* 1.46 가사 보기: 재생 화면에서 시각화 효과 대신 지금 곡의 가사
 *  - 순서: 곡 파일에 든 가사(ID3 USLT) → LRCLIB(무료 공개 가사 DB, 시간 맞춘 가사 우선)
 *  - 시간 맞춘 가사(LRC)는 지금 줄을 밝게 하고 가운데로 부드럽게 스크롤, 일반 가사는 재생 위치에 맞춰 천천히 스크롤
 *  - 손으로 넘기면 6초 동안 자동 스크롤을 멈춤. 라디오는 가사 없음 */
const AmpLyrics=(()=>{
  const box=$('#lyr'),sc=$('#lyrScroll'),lines=$('#lyrLines'),msg=$('#lyrMsg'),src=$('#lyrSrc');
  let on=store.get('visLyrics',false),key='',curL=null,busy=0,lastIdx=-2,userT=0;
  const cache=new Map(Object.entries(store.get('lyrCache',{})||{}));
  const saveCache=()=>{const o={};[...cache.entries()].slice(-40).forEach(([k,v])=>o[k]=v);store.set('lyrCache',o)};
  const clean=s=>String(s||'').replace(/\s*[\(\[【](?:official|offical|mv|m\/v|audio|lyrics?|live|feat\.?|ft\.?|가사|공식)[^\)\]】]*[\)\]】]/ig,'').replace(/\s*-\s*topic$/i,'').replace(/\s+/g,' ').trim();
  const firstArtist=s=>clean(s).split(/\s*(?:,|&|\/| x | X |feat\.?|ft\.?)\s*/)[0];
  function parseLrc(t){const out=[];for(const l of String(t).split(/\r?\n/)){const ts=[...l.matchAll(/\[(\d{1,2}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];if(!ts.length)continue;
      const txt=l.replace(/\[[^\]]*\]/g,'').trim();for(const m of ts)out.push({t:+m[1]*60+parseFloat(m[2].replace(':','.')),txt})}
    return out.sort((a,b)=>a.t-b.t)}
  function render(L){curL=L;lastIdx=-2;lines.innerHTML='';sc.scrollTop=0;
    if(!L){return}
    if(L.synced){L.rows=parseLrc(L.synced);L.rows.forEach((r,i)=>{const p=document.createElement('p');p.textContent=r.txt||'♪';p.dataset.i=i;lines.appendChild(p)})}
    else String(L.plain||'').split(/\r?\n/).forEach(l=>{const p=document.createElement('p');p.textContent=l||' ';lines.appendChild(p)});
    src.textContent=L.from==='file'?'가사: 곡 파일':'가사: LRCLIB'+(L.synced?' · 시간 맞춤':'')}
  function say(t){msg.textContent=t;msg.hidden=!t}
  async function lrclib(title,artist,dur){
    const q=new URLSearchParams({track_name:title,artist_name:artist});if(dur>0)q.set('duration',String(Math.round(dur)));
    try{const r=await fetch('https://lrclib.net/api/get?'+q);if(r.ok){const j=await r.json();if(j&&(j.syncedLyrics||j.plainLyrics)&&!j.instrumental)return j}}catch(e){}
    try{const r=await fetch('https://lrclib.net/api/search?'+new URLSearchParams({track_name:title,artist_name:artist}));if(r.ok){const a=(await r.json()||[]).filter(x=>x&&(x.syncedLyrics||x.plainLyrics)&&!x.instrumental);
      if(a.length){a.sort((x,y)=>(!!y.syncedLyrics-!!x.syncedLyrics)||(dur>0?Math.abs((x.duration||0)-dur)-Math.abs((y.duration||0)-dur):0));if(!(dur>0)||Math.abs((a[0].duration||dur)-dur)<15)return a[0]}}}catch(e){}
    return null}
  async function load(){
    const title=($('#npTitle').textContent||'').trim(),artist=($('#npArtist').textContent||'').trim();
    const radio=(typeof rdPlaying!=='undefined'&&rdPlaying)||(typeof rdSel==='function'&&rdSel());
    const k=radio?'radio':(title&&title!=='—'?clean(title)+'|'+firstArtist(artist):'');
    if(k===key)return;key=k;render(null);
    if(!k){say('재생 중인 곡이 없어요');src.textContent='';return}
    if(radio){say('라디오는 가사를 보여 줄 수 없어요');src.textContent='';return}
    // 1) 곡 파일에 든 가사
    try{const it=(typeof mode!=='undefined'&&mode!=='ext'&&cur>=0)?list[cur]:null;if(it&&it.lyrics){const s=it.lyrics;render(/\[\d{1,2}:\d{2}/.test(s)?{synced:s,from:'file'}:{plain:s,from:'file'});say('');return}}catch(e){}
    if(PUB){say('시험판에서는 곡 파일에 들어 있는 가사만 보여 줘요');src.textContent='';return}
    if(cache.has(k)){const L=cache.get(k);if(L){render(L);say('')}else say('이 곡의 가사를 찾지 못했어요');return}
    say('가사를 찾는 중…');const my=++busy;
    const j=await lrclib(clean(title),firstArtist(artist),npD)||(artist.includes(',')||/feat|&/i.test(artist)?null:await lrclib(clean(title),'',npD));
    if(my!==busy||k!==key)return;
    const L=j?{synced:j.syncedLyrics||'',plain:j.plainLyrics||'',from:'lrclib'}:null;if(L&&!L.synced)delete L.synced;
    cache.set(k,L);saveCache();
    if(L){render(L);say('')}else{say(navigator.onLine===false?'인터넷에 연결되면 가사를 찾아요':'이 곡의 가사를 찾지 못했어요');if(navigator.onLine===false){cache.delete(k);key=''}}}
  function follow(tt){if(!on||!curL||Date.now()-userT<6000)return;const t=tt==null?npT:tt;
    if(curL.rows){let i=-1;for(let a=0,b=curL.rows.length-1;a<=b;){const m=(a+b)>>1;if(curL.rows[m].t<=t+.25){i=m;a=m+1}else b=m-1}
      if(i!==lastIdx){const ps=lines.children;if(ps[lastIdx])ps[lastIdx].classList.remove('on');if(ps[i])ps[i].classList.add('on');lastIdx=i;
        const p=ps[Math.max(0,i)];if(p)sc.scrollTo({top:p.offsetTop-sc.clientHeight/2+p.offsetHeight/2,behavior:'smooth'})}}
    else if(npD>0){const max=sc.scrollHeight-sc.clientHeight;if(max>0){const want=Math.max(0,Math.min(1,(t-8)/(npD-20)))*max;if(Math.abs(sc.scrollTop-want)>2)sc.scrollTop+=(want-sc.scrollTop)*.08}}}
  ['touchstart','wheel','pointerdown'].forEach(ev=>sc.addEventListener(ev,()=>{userT=Date.now()},{passive:true}));
  function apply(){lyrOn=on;box.hidden=!on;$('#vis').style.visibility=on?'hidden':'';document.querySelectorAll('.vmode .vstep,#visSel,#visFav,#visFavOnly').forEach(e=>{e.classList.toggle('lyrhide',on);e.style.setProperty('display',on?'none':'',on?'important':'')});
    const b=$('#lyrBtn');if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.textContent=on?'효과':'가사';b.title=on?'시각화 효과로 돌아가기':'가사 보기'}
    const s=$('#sLyrics');if(s)s.checked=on;if(on){key='';load()}}
  function set(v){on=!!v;store.set('visLyrics',on);apply()}
  {const vm=document.querySelector('.vmode');if(vm&&!$('#lyrBtn')){const b=document.createElement('button');b.type='button';b.className='vlyr';b.id='lyrBtn';vm.prepend(b);b.onclick=e=>{e.stopPropagation();set(!on)}}}
  $('#sLyrics').onchange=e=>set(e.target.checked);
  // 곡이 바뀌면 다시 찾기
  const mo=new MutationObserver(()=>{if(on)load()});['#npTitle','#npArtist'].forEach(s=>mo.observe($(s),{childList:true,characterData:true,subtree:true}));
  setInterval(()=>{if(on&&!document.hidden&&!AmpLyrics.hold){if(!key||key==='radio')load();follow()}},250);
  apply();
  return {hold:false,follow,set,get on(){return on},load,parseLrc,clean,get state(){return {key,cur:curL,lastIdx}}};
})();
window.AmpLyrics=AmpLyrics;
