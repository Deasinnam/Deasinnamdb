// 인터넷 라디오
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 인터넷 라디오: 공개 목록(radio-browser.info)에서 찾고, 즐겨찾기·다이얼로 맞춰 듣기 ---------- */
const RD_SERVERS=['https://de1.api.radio-browser.info','https://de2.api.radio-browser.info','https://fi1.api.radio-browser.info','https://all.api.radio-browser.info'];
// 서울 FM 주파수(방송 이름으로 찾기)
const RD_FREQ=[[/cool\s*fm|kbs\s*2\s*fm|쿨\s*fm/i,89.1],[/happy\s*fm|kbs\s*2\s*(radio|라디오)|해피/i,106.1],[/kbs\s*1\s*fm|클래식\s*fm|classic\s*fm/i,93.1],[/kbs\s*1\s*(radio|라디오)|kbs\s*1r/i,97.3],
  [/fm\s*4\s*u|mbc\s*fm4u/i,91.9],[/mbc\s*(표준|standard)|mbc\s*radio|mbc\s*sfm/i,95.9],[/mbc\s*fm(?!\s*4)|mbc\s*mfm/i,91.9],[/power\s*fm|파워\s*fm/i,107.7],[/love\s*fm|러브\s*fm/i,103.5],[/cbs\s*(music|음악)/i,93.9],[/cbs\s*(표준|standard)/i,98.1],
  [/ebs/i,104.5],[/tbs\s*eFM|tbs\s*efm/i,101.3],[/tbs/i,95.1],[/bbs|불교방송/i,101.9],[/pbc|평화방송/i,105.3],[/febc|극동방송/i,106.9],[/ytn/i,94.5],[/ifm|경인/i,90.7],[/국방|kfn/i,100.5],[/afn|eagle/i,102.7]];
const rdFreqOf=st=>{if(st&&st.ofc)return st.freq;const n=(st.name||'')+' '+(st.tags||'');for(const [re,f] of RD_FREQ)if(re.test(n))return f;return st.freq||null};
// 방송사 공식 주소(서울). api: 는 재생할 때마다 임시 주소를 새로 받아 옴 — 안 되면 공개 목록의 다른 주소로 자동 전환
const RD_KR=[
  ['kbs1r','KBS 1라디오',97.3,'api:https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/21','KBS 1Radio'],
  ['kbs2r','KBS 해피FM',106.1,'api:https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/22','KBS Happy FM'],
  ['kbs1fm','KBS 클래식FM',93.1,'api:https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/24','KBS Classic FM'],
  ['kbs2fm','KBS 쿨FM',89.1,'api:https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/25','KBS Cool FM'],
  ['mbcsfm','MBC 표준FM',95.9,'api:https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=sfm|https://sminiplay.imbc.com/aacplay.ashx?agent=android&channel=sfm&protocol=M3U8|https://miniplay.imbc.com/WebHLS.ashx?channel=sfm&protocol=M3U8&agent=android&androidversion=24','MBC Standard FM'],
  ['mbcfm4u','MBC FM4U',91.9,'api:https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=mfm|https://sminiplay.imbc.com/aacplay.ashx?agent=android&channel=mfm&protocol=M3U8|https://miniplay.imbc.com/WebHLS.ashx?channel=mfm&protocol=M3U8&agent=android&androidversion=24','MBC FM4U'],
  ['sbslove','SBS 러브FM',103.5,'api:https://apis.sbs.co.kr/play-api/1.0/livestream/lovepc/lovefm?protocol=hls&ssl=Y','SBS Love FM'],
  ['sbspower','SBS 파워FM',107.7,'api:https://apis.sbs.co.kr/play-api/1.0/livestream/powerpc/powerfm?protocol=hls&ssl=Y','SBS Power FM'],
  ['cbsmusic','CBS 음악FM',93.9,'https://m-aac.cbs.co.kr/mweb_cbs939/_definst_/cbs939.stream/playlist.m3u8','CBS Music FM'],
  ['cbsstd','CBS 표준FM',98.1,'https://m-aac.cbs.co.kr/mweb_cbs981/_definst_/cbs981.stream/playlist.m3u8','CBS Standard FM'],
  ['ebsfm','EBS FM',104.5,'https://ebsonair.ebs.co.kr/fmradiofamilypc/familypc1m/playlist.m3u8','EBS FM']
].map(([id,name,freq,url,q])=>({id:'kr-'+id,name,freq,url,q,tags:'방송사 공식',codec:'',br:0,cc:'KR',fav:'',ofc:true}));
// 공식 주소가 없는 서울 FM: 공개 목록에서 찾을 이름
const RD_Q={95.1:'TBS',101.3:'TBS eFM',101.9:'BBS',105.3:'PBC',106.9:'FEBC',94.5:'YTN',90.7:'iFM',100.5:'국군방송',102.7:'AFN'};
const RD_BLOCK=/평양|pyongyang|조선중앙|조선의\s*소리|voice\s*of\s*korea|dprk|north\s*korea|kcbs|kctv|朝鮮/i;
let rdFavs=(store.get('rdFavs',[])||[]).filter(x=>!RD_BLOCK.test(x.name||'')),rdList=[],rdCur=store.get('rdLast',null),rdPlaying=false,rdTune=null;
const rdAudio=new Audio();rdAudio.preload='none';rdAudio.volume=store.get('rdVol',80)/100;
const RD_SAY={'ON AIR':['on','연결됨','방송 수신 중'],'대기':['idle','대기','']};
function rdSay(t){rdSt0=t;const m=RD_SAY[t]||[/할 수 없|끊김/.test(t)?'err':/중…$/.test(t)?'busy':'idle',t,t];$('#wRadio').dataset.st=m[0];$('#rdSt').textContent=m[1];
  const el=$('#rdStat');if(el)el.textContent=m[2]||(rdCur?'일시정지됨':'아래 목록에서 고르거나 다이얼을 돌려 맞추세요');if(typeof rdLamps==='function')rdLamps()}
async function rdApi(path){let last;for(const s of RD_SERVERS){try{const r=await fetch(s+path,{headers:{'Accept':'application/json'}});if(r.ok)return await r.json();last=r.status}catch(e){last=e}}throw last}
function rdOk(o){return o&&o.url&&(o.cc||'').toUpperCase()!=='KP'&&!RD_BLOCK.test((o.name||'')+' '+(o.tags||''))}
function rdNorm(o){return {id:o.stationuuid||o.id||o.url,name:(o.name||'').trim()||'이름 없음',url:o.url_resolved||o.url,fav:o.favicon||o.fav||'',tags:(o.tags||'').split(',').slice(0,3).join(' · '),codec:o.codec||'',br:o.bitrate||0,cc:o.countrycode||o.cc||''}}
async function rdSearch(q){const cc=$('#rdCountry').value,ul=$('#rdList');ul.innerHTML='<li class="msg">찾는 중…</li>';
  const qs=new URLSearchParams({hidebroken:'true',order:'votes',reverse:'true',limit:'80'});if(cc)qs.set('countrycode',cc);if(q)qs.set('name',q);
  try{rdList=(await rdApi('/json/stations/search?'+qs)).map(rdNorm).filter(rdOk);rdRenderList()}
  catch(e){rdList=[];rdRenderList();const m=ul.querySelector('.msg');if(m)m.textContent='공개 목록을 불러오지 못했어요. 위 공식 방송은 들을 수 있어요.'}}
function rdOfcShown(){const q=($('#rdQ').value||'').trim().toLowerCase(),cc=$('#rdCountry').value;if(cc&&cc!=='KR')return [];return RD_KR.filter(s=>!q||(s.name+' '+s.q).toLowerCase().includes(q))}
function rdRenderList(){const ul=$('#rdList');ul.innerHTML='';
  rdOfcShown().forEach(st=>{const li=document.createElement('li');li.dataset.o=st.id;li.className='off'+(rdCur&&rdCur.id===st.id?' on':'');
    li.innerHTML='<i>📻</i><div><b></b><small></small></div><em></em><button aria-label="즐겨찾기"></button>';li.querySelector('b').textContent=st.name;
    const o=document.createElement('span');o.className='ofc';o.textContent='공식';li.querySelector('b').appendChild(o);li.querySelector('small').textContent='방송사 공식 스트림 · 안 되면 다른 주소로 자동 전환';
    li.querySelector('em').textContent=st.freq.toFixed(1);li.querySelector('button').textContent=rdFavs.some(x=>x.id===st.id)?'★':'☆';ul.appendChild(li)});
  if(!rdList.length){const m=document.createElement('li');m.className='msg';m.textContent=rdOfcShown().length?'공개 목록에서 더 찾은 방송이 없어요.':'찾은 방송이 없어요.';ul.appendChild(m);return}
  rdList.forEach((st,i)=>{const li=document.createElement('li');li.dataset.i=i;if(rdCur&&rdCur.id===st.id)li.className='on';const f=rdFreqOf(st);
    li.innerHTML='<i>📻</i><div><b></b><small></small></div><em></em><button aria-label="즐겨찾기"></button>';
    if(st.fav){const im=new Image();im.alt='';im.referrerPolicy='no-referrer';im.onload=()=>li.firstChild.replaceWith(im);im.src=st.fav}
    li.querySelector('b').textContent=st.name;li.querySelector('small').textContent=[st.tags,st.codec&&(st.codec+(st.br?' '+st.br+'k':''))].filter(Boolean).join(' · ');
    li.querySelector('em').textContent=f?f.toFixed(1):'';li.querySelector('button').textContent=rdFavs.some(x=>x.id===st.id)?'★':'☆';ul.appendChild(li)})}
function rdRenderFavs(){const box=$('#rdPresets');box.innerHTML='';const n=Math.max(6,Math.ceil((rdFavs.length+1)/6)*6);
  for(let i=0;i<n;i++){const st=rdFavs[i],b=document.createElement('button');b.type='button';b.dataset.p=i;
    if(!st){b.className='blank';b.innerHTML='<em>P'+(i+1)+'</em><b>+</b>저장';b.setAttribute('aria-label','P'+(i+1)+' 비어 있음 · 지금 방송 저장');
      b.onclick=()=>{if(!rdCur)return toast('먼저 방송을 고른 뒤 저장하세요.');if(rdFavs.some(x=>x.id===rdCur.id))return toast('이미 저장된 방송이에요.');rdFavs.push(rdCur);store.set('rdFavs',rdFavs);rdShow();rdRenderList()};box.appendChild(b);continue}
    const f=rdFreqOf(st);b.className='set'+(rdCur&&rdCur.id===st.id?' on':'');b.innerHTML='<em></em><span></span><small></small>';
    b.children[0].textContent='P'+(i+1);b.children[1].textContent=st.name;b.children[2].textContent=f?f.toFixed(1):'NET';
    let t=0;b.addEventListener('pointerdown',()=>{t=setTimeout(()=>{t=-1;rdFavs.splice(i,1);store.set('rdFavs',rdFavs);rdShow();rdRenderList();toast('즐겨찾기에서 지웠어요.')},700)});
    b.addEventListener('pointerup',()=>{if(t!==-1){clearTimeout(t);rdPlay(st)}});b.addEventListener('pointerleave',()=>{if(t>0)clearTimeout(t)});box.appendChild(b)}}
// 7세그먼트 주파수 표시(꺼진 칸은 희미하게)
const RD_SEGS={'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg','-':'g',' ':''};
function rdSegSvg(txt){const t=7,hz=(x1,x2,cy)=>`${x1},${cy} ${x1+t/2},${cy-t/2} ${x2-t/2},${cy-t/2} ${x2},${cy} ${x2-t/2},${cy+t/2} ${x1+t/2},${cy+t/2}`,
    vt=(cx,y1,y2)=>`${cx},${y1} ${cx+t/2},${y1+t/2} ${cx+t/2},${y2-t/2} ${cx},${y2} ${cx-t/2},${y2-t/2} ${cx-t/2},${y1+t/2}`,
    P={a:hz(5,35,3.5),g:hz(5,35,36),d:hz(5,35,68.5),f:vt(3.5,5,34),b:vt(36.5,5,34),e:vt(3.5,38,67),c:vt(36.5,38,67)};
  const [ip,fp]=txt.split('.'),ds=(ip.padStart(3,' ')+(fp||'-')).split(''),xs=[0,50,100,162];let o='';
  ds.forEach((ch,k)=>{const on=RD_SEGS[ch]||'';o+=`<g transform="translate(${xs[k]} 0)">`;for(const s in P)o+=`<polygon class="${on.includes(s)?'l':'g'}" points="${P[s]}"/>`;o+='</g>'});
  o+=`<circle class="${fp?'l':'g'}" cx="147" cy="68" r="4.6"/>`;
  return `<svg viewBox="-4 -1 210 74" aria-hidden="true"><g transform="skewX(-6)">${o}</g></svg><span class="sr">${fp?txt+' MHz':'--.-'}</span>`}
function rdNextSt(){const pool=rdFavs.length?rdFavs:rdList;if(!pool.length)return null;const i=pool.findIndex(s=>rdCur&&s.id===rdCur.id);const n=pool[(i+1)%pool.length];return n&&(!rdCur||n.id!==rdCur.id)?n:null}
function rdShow(){const st=rdCur,f=rdTune!=null?rdTune:(rdNoSig!=null?rdNoSig:(st&&rdFreqOf(st)));
  $('#rdFreq').innerHTML=rdSegSvg(f?f.toFixed(1):(st?'---':'--'));$('#wRadio').querySelector('.rd-band').textContent=f||!st?'FM':'NET';
  $('#rdName').textContent=rdTune!=null?'주파수 맞추는 중':rdNoSig!=null?'수신 없음':st?st.name:'방송국을 고르세요';
  $('#rdInfo').textContent=st&&rdTune==null&&rdNoSig==null?(rdNow?'♪ '+rdNow:[st.tags,st.codec&&(st.codec+(st.br?' '+st.br+'kbps':''))].filter(Boolean).join(' · ')):'';
  const pb=$('#rdPlay');pb.innerHTML=rdPlaying?'<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg><span class="kt">일시정지</span>':'<svg viewBox="0 0 24 24"><path d="M7 5l12 7-12 7z"/></svg><span class="kt">재생</span>';pb.setAttribute('aria-label',rdPlaying?'일시정지':'재생');pb.classList.toggle('hot',rdPlaying);
  $('#rdFav').classList.toggle('fav',!!(st&&rdFavs.some(x=>x.id===st.id)));
  const ns=rdNextSt(),nf=ns&&rdFreqOf(ns);$('#rdStbyF').textContent=ns?(nf?nf.toFixed(1):'NET'):'--.-';$('#rdStby').disabled=!ns;$('#rdStby').title=ns?ns.name:'';
  const k=$('#rdKnob');k.setAttribute('aria-valuenow',f?f.toFixed(1):'');k.style.setProperty('--rot',((f||87.5)*120%360)+'deg');
  rdLamps();rdRenderFavs();rdDraw()}
function rdBridge(st){try{if(NB&&NB.onPlayState)NB.onPlayState(st?'playing':'stopped',st?(rdNow||st.name):'',st?(rdNow?'RADIO · '+st.name:'RADIO'):'')}catch(e){}}
// 앱에서는 안드로이드 표준 플레이어(HLS·http·재생목록 지원)로, 웹 미리보기에서는 audio 태그로 재생
const RD_NATIVE=!!(NB&&NB.radioPlay);let rdPoll=0,rdSt0='';
function rdFail(){const why=rdTry&&rdTry.err;rdPlaying=false;rdTry=null;clearInterval(rdPoll);try{updateMeta();state()}catch(e){}rdSay('재생할 수 없어요');toast('이 방송은 지금 재생할 수 없어요'+(why?' ('+why+')':'')+'. 다른 방송을 골라 주세요.');rdShow();rdRenderList()}
// 재생: 같은 방송의 다른 주소(공식 → 공개 목록)를 차례로 시도, 모두 안 될 때만 실패 안내
let rdTry=null,rdT0=0,rdNow='';
function rdCands(st){const out=[],seen=new Set(),f=rdFreqOf(st),add=s=>{if(s&&s.url&&!seen.has(s.url)&&rdOk(s)){seen.add(s.url);out.push(s)}};
  add(st);if(f)for(const s of [...RD_KR,...rdFavs,...rdList])if(rdFreqOf(s)===f)add(s);return out}
async function rdMore(){const t=rdTry;if(!t||t.searched)return false;t.searched=true;const base=t.base,f=rdFreqOf(base);
  const q=base.q||RD_Q[f]||(base.name||'').replace(/\s*(fm|라디오|radio)\s*$/i,'').trim();if(!q)return false;
  try{const r=(await rdApi('/json/stations/search?'+new URLSearchParams({name:q,hidebroken:'true',order:'votes',reverse:'true',limit:'8'}))).map(rdNorm).filter(rdOk);
    if(t!==rdTry)return false;const toks=q.toLowerCase().split(/\s+/).filter(Boolean),same=x=>{const n=(x.name||'').toLowerCase().replace(/\s+/g,'');return toks.every(k=>n.includes(k))};const seen=new Set(t.list.map(s=>s.url));let n=0;for(const s of r)if(!seen.has(s.url)&&same(s)){t.list.push(s);n++}return n>0}catch(e){return false}}
async function rdNextCand(){const t=rdTry;if(!t||!rdPlaying)return;t.i++;if(t.i>=t.list.length&&!(await rdMore()))return rdFail();if(t!==rdTry)return;
  rdSay('다른 주소로 연결 중…');rdStart(t.list[t.i])}
function rdStart(s){const t=rdTry;if(RD_NATIVE){try{NB.radioVolume(rdVolV());NB.radioPlay(s.url)}catch(e){return rdNextCand()}
    const t0=Date.now();clearInterval(rdPoll);rdPoll=setInterval(()=>{if(t!==rdTry)return clearInterval(rdPoll);let o={};try{o=JSON.parse(NB.radioState())}catch(e){}
      if(o.state==='playing'){if(rdSt0!=='ON AIR'){rdSay('ON AIR');rdT0=rdT0||Date.now();rdBridge(rdCur)}const ti=(o.title||'').trim();if(ti!==rdNow){rdNow=ti;rdShow();rdBridge(rdCur)}}
      else if(o.state==='buffering'||o.state==='resolving')rdSay(o.retry?'다시 연결 중…':'버퍼링…');
      else if(o.state==='error'||(o.state==='idle'&&rdPlaying&&Date.now()-t0>20000)){clearInterval(rdPoll);if(t)t.err=(o.err==='API'?'방송사 주소 받기 실패':o.err?'재생 오류 '+o.err:'응답 없음')+(/^api:/.test(s.url)?' · 공식 주소':' · 공개 목록 주소');rdNextCand()}},500);return}
  if(/^api:/.test(s.url))return rdNextCand(); // 웹 미리보기는 방송사 주소를 직접 받을 수 없어 공개 목록 주소로
  rdAudio.src=s.url;rdAudio.play().then(()=>{if(t!==rdTry)return;rdSay('ON AIR');rdT0=rdT0||Date.now();setTimeout(()=>rdBridge(rdCur),250);rdShow()}).catch(()=>{if(t===rdTry)rdNextCand()})}
function rdPlay(st){if(!st)return;store.set('lastSrc','radio');rdNoSig=null;rdCur=st;store.set('rdLast',st);try{pauseMusic()}catch(e){}
  rdTry={base:st,list:rdCands(st),i:0,searched:false};rdT0=0;rdNow='';
  rdSay('연결 중…');rdPlaying=true;rdShow();rdRenderList();try{state()}catch(e){}rdStart(rdTry.list[0])}
// 플레이어 화면(LCD)에 지금 듣는 라디오 표시
function rdLcd(){const f=rdFreqOf(rdCur);$('#time').textContent=lcdFmt(rdPlaying&&rdT0?(Date.now()-rdT0)/1000:0);
  setMarquee('📻 '+(f?'FM '+f.toFixed(1)+' · ':'')+rdCur.name+(!rdPlaying?'  · 정지 (▶ 누르면 다시 들어요)':rdNow?'  ♪ '+rdNow:(rdSt0==='ON AIR'?'  · ON AIR':'  · 연결 중')));
  if(!seeking){seek.value=0;setP(seek)}$('#tCur').textContent='LIVE';$('#tDur').textContent='RADIO';
  const k=$('#kbps');const kb=(rdCur.br?rdCur.br+' kbps':'LIVE kbps');if(k.textContent!==kb)k.textContent=kb}
function radioStop(){if(!rdPlaying&&rdAudio.paused&&!RD_NATIVE)return;rdTry=null;clearInterval(rdPoll);if(RD_NATIVE){try{NB.radioStop()}catch(e){}}rdAudio.pause();rdAudio.removeAttribute('src');try{rdAudio.load()}catch(e){}if(!rdPlaying)return;rdPlaying=false;rdNow='';rdSay('대기');rdBridge(null);rdShow();rdRenderList();try{updateMeta();state()}catch(e){}}
const rdVolV=()=>(+$('#rdVol').value||80)/100;
rdAudio.addEventListener('error',()=>{if(rdPlaying&&rdTry&&!RD_NATIVE)rdNextCand()}); // 끊기면 같은 방송의 다른 주소로
rdAudio.addEventListener('waiting',()=>rdPlaying&&rdSay('버퍼링…'));rdAudio.addEventListener('playing',()=>rdSay('ON AIR'));
function rdPool(){const seen=new Set(),out=[];for(const s of [...rdFavs,...RD_KR,...rdList])if(!seen.has(s.id)){seen.add(s.id);out.push(s)}return out}
function rdStep(d){const pool=rdFavs.length?rdFavs:rdList;if(!pool.length)return;let i=pool.findIndex(s=>rdCur&&s.id===rdCur.id);i=(i+d+pool.length)%pool.length;rdPlay(pool[i])}
// FM 다이얼: 87.5~108MHz, 저장·목록의 방송 표시, 끌어서 맞추면 가장 가까운 방송으로
const rdCols=()=>{const cs=getComputedStyle($('#wRadio')),v=(n,d)=>cs.getPropertyValue(n).trim()||d;return {g:v('--rg','#a8f08f'),a:v('--ra','#f3bc65'),bg:v('--rbg','#0d1a0b'),d:v('--rdot','#5f8f55')}};
function rdDraw(){const RC=rdCols();const cv=$('#rdScale');if(!cv||!cv.offsetWidth)return;const d=Math.min(2,devicePixelRatio||1),W=cv.width=Math.round(cv.offsetWidth*d),H=cv.height=Math.round(cv.offsetHeight*d),g=cv.getContext('2d');
  const x=f=>W*.035+(f-87.5)/(108-87.5)*W*.93;g.clearRect(0,0,W,H);
  g.strokeStyle='#3b4439';g.lineWidth=d;g.beginPath();g.moveTo(x(87.5),H*.62);g.lineTo(x(108),H*.62);g.stroke();
  g.textAlign='center';g.font=`600 ${11*d}px "Share Tech Mono",monospace`;g.fillStyle='#c9d0c4';
  for(let k=0;k<=102;k++){const f=87.6+k*.2;const big=Math.abs(f-Math.round(f/2)*2)<.01,mid=!big&&Math.abs(f-Math.round(f))<.01;
    g.strokeStyle=big?'#c9d0c4':mid?'#7d877a':'#454e43';g.lineWidth=(big?1.5:1)*d;g.beginPath();g.moveTo(x(f),H*.62);g.lineTo(x(f),H*(big?.32:mid?.42:.5));g.stroke();
    if(big)g.fillText(String(Math.round(f)),x(f),H*.93)}
  for(const st of rdPool()){const f=rdFreqOf(st);if(!f)continue;const fav=rdFavs.some(s=>s.id===st.id);g.fillStyle=fav?RC.a:RC.d;g.beginPath();g.arc(x(f),H*.72,(fav?3.2:2.4)*d,0,7);g.fill()}
  const cf=rdTune!=null?rdTune:(rdCur&&rdFreqOf(rdCur));if(cf){const cx=x(cf);g.strokeStyle=RC.g;g.fillStyle=RC.g;g.lineWidth=2.2*d;g.shadowColor=RC.g;g.shadowBlur=8*d;
    g.beginPath();g.moveTo(cx,H*.27);g.lineTo(cx,H*.68);g.stroke();g.shadowBlur=0;
    g.font=`700 ${12*d}px "Share Tech Mono",monospace`;const lb=cf.toFixed(1),tw=g.measureText(lb).width+8*d,bx=Math.max(1,Math.min(W-tw-1,cx-tw/2));
    g.fillStyle=RC.bg;g.fillRect(bx,1,tw,H*.22);g.strokeRect(bx,1,tw,H*.22);g.fillStyle=RC.g;g.textBaseline='middle';g.fillText(lb,bx+tw/2,1+H*.11);g.textBaseline='alphabetic'}}
// 신호 세기 계기(바늘 + 막대) — 재생 상태를 보여 주는 표시
let rdLvl=0,rdLvlT=0,rdSigOn=false,rdSigTm=0;
function rdLamps(){const on=rdPlaying&&rdSt0==='ON AIR';$('#rdStereo').classList.toggle('on',on);$('#rdRds').classList.toggle('on',on&&!!rdCur)}
function rdSigDraw(){const RC=rdCols();const cv=$('#rdSig');if(!cv||!cv.offsetWidth)return;const d=Math.min(2,devicePixelRatio||1),W=cv.width=Math.round(cv.offsetWidth*d),H=cv.height=Math.round(cv.offsetHeight*d),g=cv.getContext('2d');
  const cx=W/2,cy=H*.6,r=Math.min(W*.42,H*.5),a=v=>Math.PI*(1+v/100);g.lineCap='butt';
  g.lineWidth=3*d;g.strokeStyle='#4d5a49';g.beginPath();g.arc(cx,cy,r,a(0),a(80));g.stroke();g.strokeStyle=RC.a;g.beginPath();g.arc(cx,cy,r,a(80),a(100));g.stroke();
  g.textAlign='center';g.textBaseline='middle';g.font=`600 ${9.5*d}px "Share Tech Mono",monospace`;
  const small=r<46*d;if(small)g.font=`600 ${8.5*d}px "Share Tech Mono",monospace`;
  for(let v=0;v<=100;v+=10){const an=a(v),big=small?v%50===0:v%20===0;g.strokeStyle=v>=80?RC.a:'#9da69d';g.lineWidth=(big?1.6:1)*d;g.beginPath();g.moveTo(cx+Math.cos(an)*(r-(big?9:6)*d),cy+Math.sin(an)*(r-(big?9:6)*d));g.lineTo(cx+Math.cos(an)*r,cy+Math.sin(an)*r);g.stroke();
    if(big){g.fillStyle=v>=80?RC.a:'#c9d0c4';g.fillText(String(v),cx+Math.cos(an)*(r-(small?12:19)*d),cy+Math.sin(an)*(r-(small?12:19)*d))}}
  const na=a(rdLvl);g.strokeStyle='#e7e9df';g.lineWidth=2*d;g.shadowColor=RC.g;g.shadowBlur=6*d;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(na)*(r-4*d),cy+Math.sin(na)*(r-4*d));g.stroke();g.shadowBlur=0;
  g.fillStyle='#2b3328';g.beginPath();g.arc(cx,cy,4.5*d,0,7);g.fill();
  const n=12,bw=W*.8/n,lit=Math.round(rdLvl/100*n);for(let i=0;i<n;i++){const h=(4+i*1.4)*d,x0=W*.1+i*bw,y0=H-2*d-h;g.fillStyle=i<lit?(i>=10?RC.a:RC.g):'#232a22';g.fillRect(x0,y0,bw*.62,h)}}
function rdSigTick(){if(document.hidden)return;const st=rdPlaying?(rdSt0==='ON AIR'?'on':'busy'):'off';rdLvlT=st==='on'?70+Math.sin(Date.now()/900)*6+Math.random()*7:st==='busy'?18+Math.random()*16:0;
  const nv=rdLvl+(rdLvlT-rdLvl)*.25;if(Math.abs(nv-rdLvl)>.05||rdLvl>0){rdLvl=Math.abs(nv)<.05?0:nv;rdSigDraw()}}
function rdSigRun(on){rdSigOn=on;clearInterval(rdSigTm);if(on){rdSigDraw();rdSigTm=setInterval(rdSigTick,110)}}
// 주파수 맞추기: 다이얼·노브·± 버튼 공통(가장 가까운 저장/목록 방송, 없으면 서울 FM 표로 찾아봄)
let rdTuneTm=0;
async function rdTuneTo(f){rdTune=null;let best=null,bd=.35;
  for(const st of rdPool()){const sf=rdFreqOf(st);if(sf&&Math.abs(sf-f)<bd){bd=Math.abs(sf-f);best=st}}
  if(!best){const k=Object.keys(RD_Q).map(Number).find(ff=>Math.abs(ff-f)<.3);if(k){rdSay('방송을 찾는 중…');try{const r=(await rdApi('/json/stations/search?'+new URLSearchParams({name:RD_Q[k],countrycode:'KR',hidebroken:'true',order:'votes',reverse:'true',limit:'5'}))).map(rdNorm).filter(rdOk);if(r[0]){best=r[0];best.freq=k}}catch(x){}}}
  store.set('rdDialF',Math.round(f*10)/10);
  if(best){rdNoSig=null;rdPlay(best)}else{if(rdPlaying)radioStop();rdNoSig=Math.round(f*10)/10;rdSay('대기');rdShow();$('#rdStat').textContent='이 주파수에는 인터넷 방송이 없어요 · 다이얼을 더 돌려 보세요'}}
let rdNoSig=null;
function rdNudge(n){const base=rdTune!=null?rdTune:(rdNoSig!=null?rdNoSig:((rdCur&&rdFreqOf(rdCur))||store.get('rdDialF',89.1)));rdTune=Math.max(87.5,Math.min(108,Math.round((base+n*.1)*10)/10));rdShow();
  clearTimeout(rdTuneTm);rdTuneTm=setTimeout(()=>rdTuneTo(rdTune),750)}
(function(){const cv=$('#rdScale');let pid=null;const fAt=cx=>{const r=cv.getBoundingClientRect();return Math.max(87.5,Math.min(108,87.5+((cx-r.left)/r.width-.035)/.93*20.5))};
  cv.addEventListener('pointerdown',e=>{pid=e.pointerId;cv.setPointerCapture(pid);clearTimeout(rdTuneTm);rdTune=fAt(e.clientX);rdShow()});
  cv.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;rdTune=fAt(e.clientX);rdShow()});
  cv.addEventListener('pointerup',e=>{if(e.pointerId!==pid)return;pid=null;rdTuneTo(rdTune)});cv.addEventListener('pointercancel',e=>{pid=null;rdTune=null;rdShow()});
  cv.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){rdStep(1);e.preventDefault()}if(e.key==='ArrowLeft'){rdStep(-1);e.preventDefault()}});
  // 노브: 12°마다 0.1MHz
  const k=$('#rdKnob');let kp=null,ka=0,acc=0;const ang=e=>{const r=k.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI};
  k.addEventListener('pointerdown',e=>{kp=e.pointerId;k.setPointerCapture(kp);ka=ang(e);acc=0;e.preventDefault()});
  k.addEventListener('pointermove',e=>{if(e.pointerId!==kp)return;let a=ang(e),da=a-ka;if(da>180)da-=360;if(da<-180)da+=360;ka=a;acc+=da;while(Math.abs(acc)>=12){const s=Math.sign(acc);acc-=s*12;rdNudge(s)}});
  const ke=e=>{if(e.pointerId===kp)kp=null};k.addEventListener('pointerup',ke);k.addEventListener('pointercancel',ke);
  k.addEventListener('wheel',e=>{e.preventDefault();rdNudge(e.deltaY<0?1:-1)},{passive:false});
  k.addEventListener('keydown',e=>{const s={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1}[e.key];if(s){rdNudge(s);e.preventDefault()}});
  $('#rdUp').onclick=()=>rdNudge(1);$('#rdDn').onclick=()=>rdNudge(-1);$('#rdStby').onclick=()=>{const n=rdNextSt();if(n)rdPlay(n)}})();
$('#rdList').addEventListener('click',e=>{const li=e.target.closest('li[data-i],li[data-o]');if(!li)return;const st=li.dataset.o?RD_KR.find(x=>x.id===li.dataset.o):rdList[+li.dataset.i];if(!st)return;
  if(e.target.closest('button')){const k=rdFavs.findIndex(x=>x.id===st.id);if(k>=0)rdFavs.splice(k,1);else rdFavs.push(st);store.set('rdFavs',rdFavs);rdRenderList();rdShow();return}rdPlay(st)});
$('#rdPlay').onclick=()=>{if(rdPlaying)radioStop();else if(rdCur)rdPlay(rdCur);else if(rdFavs[0])rdPlay(rdFavs[0]);else if(rdList[0])rdPlay(rdList[0])};
$('#rdPrev').onclick=()=>rdStep(-1);$('#rdNext').onclick=()=>rdStep(1);
$('#rdFav').onclick=()=>{if(!rdCur)return;const k=rdFavs.findIndex(x=>x.id===rdCur.id);if(k>=0)rdFavs.splice(k,1);else rdFavs.push(rdCur);store.set('rdFavs',rdFavs);rdShow();rdRenderList()};
$('#rdVol').value=String(Math.round(rdAudio.volume*100));$('#rdVol').value=String(store.get('rdVol',80));$('#rdVolN').textContent=$('#rdVol').value;$('#rdVol').oninput=e=>{$('#rdVolN').textContent=e.target.value;rdAudio.volume=e.target.value/100;store.set('rdVol',+e.target.value);if(RD_NATIVE)try{NB.radioVolume(e.target.value/100)}catch(x){}};
$('#rdGo').onclick=()=>rdSearch($('#rdQ').value.trim());$('#rdQ').addEventListener('keydown',e=>{if(e.key==='Enter')rdSearch(e.target.value.trim())});
$('#rdCountry').onchange=()=>rdSearch($('#rdQ').value.trim());
function rdFold(tg,box,key,def){const b=$('#'+tg),x=$('#'+box),set=o=>{x.hidden=!o;b.setAttribute('aria-expanded',String(o))};set(store.get(key,def));
  b.onclick=()=>{const o=x.hidden;set(o);store.set(key,o);if(o&&box==='rdListBox')rdEnsure()}}
rdFold('rdPresetTg','rdPresetBox','rdPresetOpen',true);rdFold('rdListTg','rdListBox','rdListOpen',!rdFavs.length);
let rdLoaded=false;function rdEnsure(){rdShow();if(!rdLoaded){rdLoaded=true;rdSearch('')}requestAnimationFrame(rdDraw)}
function openRadio(){const w=$('#wRadio');w.classList.remove('collapsed');if(isCk2()){ckFocus('radio')}else w.scrollIntoView({block:'start',behavior:'smooth'});rdEnsure()}
new IntersectionObserver(es=>{const v=es.some(e=>e.isIntersecting);if(v)rdEnsure();rdSigRun(v)}).observe($('#wRadio'));
$('#radioBtn').onclick=openRadio;
window.addEventListener('resize',rdDraw);{const ro=new ResizeObserver(()=>{rdDraw();rdSigDraw()});ro.observe($('#rdScale'));ro.observe($('#rdSig'))}
// 핸들·이어폰 버튼: 라디오를 듣는 중이면 재생/정지·이전/다음 방송
{const o=window.__ctl;window.__ctl=c=>{if(rdPlaying||rdSel()){if(c==='next')rdStep(1);else if(c==='prev')rdStep(-1);else if(c==='play'||(c==='toggle'&&!rdPlaying))rdResume();else if(rdPlaying)radioStop();return}return o&&o(c)}}
rdShow();rdSay('대기'); // 처음부터 프리셋 칸·표시를 그려 두어 나중에 화면이 밀리지 않게
function rdResume(){rdPlay(rdCur||rdFavs[0]||RD_KR.find(x=>x.id==='kr-mbcfm4u')||RD_KR[0])}
window.AmpRadio={open:openRadio,play:rdPlay,stop:radioStop,resume:rdResume,step:rdStep,toggle(){if(rdPlaying)radioStop();else rdResume()},
  get state(){const f=rdCur&&rdFreqOf(rdCur);return {playing:rdPlaying,cur:rdCur,favs:rdFavs.length,list:rdList.length,now:rdNow,freq:f||null,onAir:rdSt0==='ON AIR',t0:rdT0,status:rdSt0}}};

