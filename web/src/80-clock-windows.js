// 로고 옆 시계, 창 순서, 창 높이 조절
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 로고 옆 시계 ---------- */
const WORLD=[['','사용 안 함'],['America/New_York','뉴욕'],['America/Los_Angeles','로스앤젤레스'],['America/Chicago','시카고'],['America/Toronto','토론토'],['America/Vancouver','밴쿠버'],['Pacific/Honolulu','하와이'],['America/Sao_Paulo','상파울루'],['Europe/London','런던'],['Europe/Paris','파리'],['Europe/Berlin','베를린'],['Europe/Rome','로마'],['Europe/Madrid','마드리드'],['Europe/Istanbul','이스탄불'],['Asia/Dubai','두바이'],['Asia/Kolkata','인도'],['Asia/Bangkok','방콕'],['Asia/Ho_Chi_Minh','호찌민·하노이'],['Asia/Singapore','싱가포르'],['Asia/Manila','마닐라'],['Asia/Shanghai','베이징·상하이'],['Asia/Hong_Kong','홍콩'],['Asia/Taipei','타이베이'],['Asia/Tokyo','도쿄'],['Australia/Sydney','시드니'],['Pacific/Auckland','오클랜드'],['Pacific/Guam','괌']];
const HOME_TZ='Asia/Seoul';
let worldTz=store.get('worldTz','');
(function(){const sel=$('#sWorld');WORLD.forEach(([z,n])=>{const o=document.createElement('option');o.value=z;o.textContent=n;sel.appendChild(o)});sel.value=worldTz;
  sel.onchange=e=>{worldTz=e.target.value;store.set('worldTz',worldTz);clockTick()}})();
function tzParts(d,tz){const f=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'});
  const o={};f.formatToParts(d).forEach(p=>o[p.type]=p.value);return o}
const WD={Sun:'일',Mon:'월',Tue:'화',Wed:'수',Thu:'목',Fri:'금',Sat:'토'};
function clockTick(){const d=new Date();let h;try{h=tzParts(d,HOME_TZ)}catch(e){return}
  $('#clkTime').textContent=h.hour+':'+h.minute;$('#clkDate').textContent=(+h.month)+'.'+(+h.day)+' ('+WD[h.weekday]+')';
  const wb=$('#clkWorld');wb.classList.toggle('off',!worldTz);
  if(!worldTz){$('#clkCity').textContent='해외 시간';$('#clkWTime').textContent='+ 추가';$('#clkDiff').textContent='';return}
  let w;try{w=tzParts(d,worldTz)}catch(e){return}
  const name=(WORLD.find(x=>x[0]===worldTz)||[,worldTz])[1];
  const toMin=o=>Date.UTC(+o.year,+o.month-1,+o.day,+o.hour,+o.minute)/60000,diff=(toMin(w)-toMin(h))/60;
  const dd=Date.UTC(+w.year,+w.month-1,+w.day)-Date.UTC(+h.year,+h.month-1,+h.day);
  $('#clkCity').textContent=name+(dd>0?' · 다음날':dd<0?' · 전날':'');$('#clkWTime').textContent=w.hour+':'+w.minute;
  $('#clkDiff').textContent=diff===0?'시차 없음':(diff>0?'+':'−')+(Math.abs(diff)%1?Math.abs(diff).toFixed(1):Math.abs(diff))+'h'}
/* 아날로그(콕핏 계기) 시계 */
let clockStyle=store.get('clockStyle','analog');
function setClockStyle(v){clockStyle=v==='analog'?'analog':'digital';store.set('clockStyle',clockStyle);document.documentElement.dataset.clock=clockStyle;$('#sClockStyle').value=clockStyle;drawDials(true)}
$('#sClockStyle').onchange=e=>setClockStyle(e.target.value);
$('#clkNow').onclick=()=>{if(isCk())setClockStyle(clockStyle==='analog'?'digital':'analog')};
function tzHMS(d,tz){const f=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});const o={};f.formatToParts(d).forEach(p=>o[p.type]=p.value);return {h:+o.hour,m:+o.minute,s:+o.second+d.getMilliseconds()/1000}}
const CITY3={'Asia/Seoul':'SEL','America/New_York':'NYC','America/Los_Angeles':'LAX','America/Chicago':'CHI','America/Toronto':'YYZ','America/Vancouver':'YVR','Pacific/Honolulu':'HNL','America/Sao_Paulo':'SAO','Europe/London':'LON','Europe/Paris':'PAR','Europe/Berlin':'BER','Europe/Rome':'ROM','Europe/Madrid':'MAD','Europe/Istanbul':'IST','Asia/Dubai':'DXB','Asia/Kolkata':'DEL','Asia/Bangkok':'BKK','Asia/Ho_Chi_Minh':'SGN','Asia/Singapore':'SIN','Asia/Manila':'MNL','Asia/Shanghai':'PEK','Asia/Hong_Kong':'HKG','Asia/Taipei':'TPE','Asia/Tokyo':'TYO','Australia/Sydney':'SYD','Pacific/Auckland':'AKL','Pacific/Guam':'GUM'};
function drawDial(cv,t,code,night){const ctx=cv.getContext('2d'),S=cv.width,R=S/2;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,S,S);ctx.translate(R,R);
  // 계기 장착판(모서리 나사)
  const pl=ctx.createLinearGradient(-R,-R,R,R);pl.addColorStop(0,DIAL().pl[0]);pl.addColorStop(1,DIAL().pl[1]);ctx.fillStyle=pl;ctx.beginPath();ctx.roundRect(-R+1,-R+1,S-2,S-2,S*.12);ctx.fill();
  ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  for(const [x,y] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const sx=x*R*.8,sy=y*R*.8,r=S*.035;const g=ctx.createRadialGradient(sx-r*.3,sy-r*.3,0,sx,sy,r);g.addColorStop(0,DIAL().sc[0]);g.addColorStop(1,DIAL().sc[1]);ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();ctx.strokeStyle='#1a1d20';ctx.lineWidth=S*.008;ctx.beginPath();ctx.moveTo(sx-r*.7,sy-r*.7*(x*y));ctx.lineTo(sx+r*.7,sy+r*.7*(x*y));ctx.stroke()}
  // 베젤
  const bz=ctx.createLinearGradient(0,-R,0,R);bz.addColorStop(0,DIAL().bz[0]);bz.addColorStop(.5,DIAL().bz[1]);bz.addColorStop(1,DIAL().bz[2]);ctx.fillStyle=bz;ctx.beginPath();ctx.arc(0,0,R*.9,0,7);ctx.fill();
  ctx.fillStyle='#050705';ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill();
  // 눈금
  for(let i=0;i<60;i++){const a=i/60*Math.PI*2,big=i%5===0,r1=R*.77,r2=big?R*.64:R*.71;ctx.strokeStyle=big?'#eef2e6':'#9fa99a';ctx.lineWidth=big?S*.022:S*.009;ctx.beginPath();ctx.moveTo(Math.sin(a)*r1,-Math.cos(a)*r1);ctx.lineTo(Math.sin(a)*r2,-Math.cos(a)*r2);ctx.stroke()}
  ctx.fillStyle='#eef2e6';ctx.textAlign='center';ctx.textBaseline='middle';
  for(let n=1;n<=12;n++){const a=n/12*Math.PI*2,big=n%3===0;ctx.font=`700 ${big?S*.13:S*.085}px "Barlow Condensed","Rajdhani",sans-serif`;ctx.fillText(String(n),Math.sin(a)*R*.5,-Math.cos(a)*R*.5+S*.004)}
  ctx.font=`600 ${S*.07}px "Share Tech Mono",monospace`;ctx.fillStyle='#a8f08f';ctx.fillText(code,0,-R*.22);
  ctx.font=`600 ${S*.05}px "Barlow Condensed",sans-serif`;ctx.fillStyle='#9fa99a';ctx.fillText(night?'NIGHT':'DAY',0,R*.27);
  if(!t)return;
  const hand=(ang,len,wid,col,tail,lume)=>{ctx.save();ctx.rotate(ang);ctx.fillStyle='#000a';ctx.beginPath();ctx.moveTo(-wid/2+S*.01,tail+S*.01);ctx.lineTo(-wid/2+S*.01,-len+wid+S*.01);ctx.lineTo(S*.01,-len+S*.01);ctx.lineTo(wid/2+S*.01,-len+wid+S*.01);ctx.lineTo(wid/2+S*.01,tail+S*.01);ctx.fill();
    ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(-wid/2,tail);ctx.lineTo(-wid/2,-len+wid);ctx.lineTo(0,-len);ctx.lineTo(wid/2,-len+wid);ctx.lineTo(wid/2,tail);ctx.closePath();ctx.fill();
    if(lume){ctx.fillStyle='#a8f08f';ctx.fillRect(-wid*.22,-len*.86,wid*.44,len*.5)}ctx.restore()};
  const sec=t.s,min=t.m+sec/60,hr=(t.h%12)+min/60;
  hand(hr/12*Math.PI*2,R*.42,S*.05,'#e7e9df',R*.1,true);
  hand(min/60*Math.PI*2,R*.66,S*.036,'#e7e9df',R*.12,true);
  ctx.save();ctx.rotate(sec/60*Math.PI*2);ctx.strokeStyle='#f3bc65';ctx.lineWidth=S*.012;ctx.beginPath();ctx.moveTo(0,R*.2);ctx.lineTo(0,-R*.72);ctx.stroke();ctx.fillStyle='#f3bc65';ctx.beginPath();ctx.arc(0,R*.16,S*.025,0,7);ctx.fill();ctx.restore();
  ctx.fillStyle='#1a1d20';ctx.beginPath();ctx.arc(0,0,S*.04,0,7);ctx.fill();ctx.fillStyle='#f3bc65';ctx.beginPath();ctx.arc(0,0,S*.018,0,7);ctx.fill();
  // 유리 반사
  const gl=ctx.createLinearGradient(-R*.6,-R*.8,R*.3,R*.2);gl.addColorStop(0,'#ffffff1f');gl.addColorStop(.45,'#ffffff05');gl.addColorStop(.46,'#ffffff00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(0,0,R*.8,0,7);ctx.fill()}
let dialT=0;
function drawDials(force){const on=isCk()&&clockStyle==='analog'&&!document.hidden;if(!on&&!force)return;if(!on)return;
  const d=new Date();let a,b=null;try{a=tzHMS(d,HOME_TZ);if(worldTz)b=tzHMS(d,worldTz)}catch(e){return}
  drawDial($('#clkDialNow'),a,'SEL',a.h>=19||a.h<6);drawDial($('#clkDialW'),b,worldTz?(CITY3[worldTz]||'UTC'):'— — —',b?(b.h>=19||b.h<6):false)}
(function dialLoop(){drawDials();dialT=setTimeout(dialLoop,isCk()&&clockStyle==='analog'&&!pwrSaver?200:1000)})();
setClockStyle(clockStyle);
$('#clkWorld').onclick=()=>{openSettings();const r=$('#secClock');if(r){r.scrollIntoView({block:'center'});$('#sWorld').focus()}};
clockTick();setInterval(clockTick,1000);
/* ---------- 창 순서(설정) ---------- */
const WIN_NAME={wGps:'속도계',wCtl:'조종 패널',wAtc:'관제탑',wCam:'블랙박스',wMap:'지도',wMain:'플레이어',wVis:'재생 화면',wRadio:'라디오',wEq:'이퀄라이저',wPl:'재생 목록'};
function winKind(){return isCp()?'K':isCar()?'G':'N'}
function winDefault(){return {K:['wGps','wCtl','wAtc','wMap','wMain','wVis','wRadio','wEq','wPl','wCam'],G:['wGps','wMap','wMain','wVis','wRadio','wEq','wPl'],N:['wMain','wVis','wRadio','wEq','wPl']}[winKind()]}
function winOrder(){const d=winDefault(),o=store.get('winOrder_'+winKind(),null);if(!Array.isArray(o))return null;const f=o.filter(id=>d.includes(id));d.forEach(id=>{if(!f.includes(id))f.push(id)});return f}
function applyWinOrder(){const o=winOrder();appEl.classList.toggle('CO',!!o);
  document.querySelectorAll('#app>.win').forEach(w=>w.style.order='');
  if(o)o.forEach((id,i)=>{$('#'+id).style.order=i;if(id==='wPl')$('#wExt').style.order=i})}
function renderWinOrder(){const o=winOrder()||winDefault(),ul=$('#ordList');ul.innerHTML='';
  o.forEach((id,i)=>{const li=document.createElement('li');li.innerHTML=`<em>${i+1}</em><b>${WIN_NAME[id]}</b><button class="pill" data-d="-1" aria-label="${WIN_NAME[id]} 위로">▲</button><button class="pill" data-d="1" aria-label="${WIN_NAME[id]} 아래로">▼</button>`;
    li.dataset.id=id;li.children[2].disabled=i===0;li.children[3].disabled=i===o.length-1;ul.appendChild(li)});
  $('#ordReset').disabled=!winOrder()}
$('#ordList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.closest('li').dataset.id,o=(winOrder()||winDefault()).slice(),i=o.indexOf(id),j=i+ +b.dataset.d;
  if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];store.set('winOrder_'+winKind(),o);applyWinOrder();renderWinOrder();
  const nb=$('#ordList').querySelector(`li[data-id="${id}"] button[data-d="${b.dataset.d}"]`);if(nb&&!nb.disabled)nb.focus()};
$('#ordReset').onclick=()=>{store.set('winOrder_'+winKind(),null);applyWinOrder();renderWinOrder();toast('창 배치를 기본으로 되돌렸어요.')};
function openSettings(){renderWinOrder();$('#settings').hidden=false;syncSettings();clearInterval(setTimer);setTimer=setInterval(syncSettings,1000)}
function closeSettings(){$('#settings').hidden=true;clearInterval(setTimer)}
let setTimer=0;
function syncSettings(){
  $('#sDriveAuto').value=store.get('driveAuto','car');
  $('#sCarGps').checked=store.get('carGps',true);
  $('#secCar').hidden=!HAS_CAR;$('#secKey').hidden=!HAS_CAR;
  $('#sLib').textContent=LIB?`저장된 곡 ${list.filter(it=>it.lib).length}곡 · 마지막 곡과 위치를 기억해요`:'웹 버전에서는 목록이 저장되지 않아요. 앱에서 사용하세요.';
  if(!HAS_CAR)return;
  let c={};try{c=JSON.parse(NB.carStatus())}catch(e){}
  $('#sCarAuto').checked=!!c.autoplay;
  const sel=$('#sCarName'),names=[...new Set([...(c.connected||[]),c.carName].filter(Boolean))];
  const want=['',...names].join('|');if(sel.dataset.k!==want){sel.dataset.k=want;sel.innerHTML='<option value="">모든 블루투스 오디오 기기</option>'+names.map(n=>`<option></option>`).join('');[...sel.options].slice(1).forEach((o,i)=>{o.value=names[i];o.textContent=names[i]+((c.connected||[]).includes(names[i])?' (지금 연결됨)':'')})}
  sel.value=c.carName||'';
  $('#sBt').textContent=c.btPerm?'허용됨':'허용 필요';$('#sBt').classList.toggle('ok',!!c.btPerm);
  $('#sLaunch').textContent=c.autoLaunch?'허용됨':'허용하기';$('#sLaunch').classList.toggle('on',!c.autoLaunch);
  const k=$('#sKey');
  if(c.lastKey){const t=new Date(c.lastKeyAt);k.textContent=`${c.lastKey} · ${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;k.classList.add('ok')}
  else{k.textContent='아직 받은 신호가 없어요';k.classList.remove('ok')}
}
$('#setBtn').onclick=openSettings;$('#setClose').onclick=closeSettings;
$('#settings').addEventListener('click',e=>{if(e.target.id==='settings')closeSettings()});
$('#sDriveAuto').onchange=e=>store.set('driveAuto',e.target.value);
$('#sCarGps').onchange=e=>store.set('carGps',e.target.checked);
$('#sCarSrc').value=store.get('carSrc','auto');$('#sCarSrc').onchange=e=>store.set('carSrc',e.target.value);
$('#sCarAuto').onchange=e=>{try{NB.setCarAutoplay(e.target.checked)}catch(x){}};
$('#sCarName').onchange=e=>{try{NB.setCarName(e.target.value)}catch(x){}};
$('#sLaunch').onclick=()=>{try{NB.requestAutoLaunch()}catch(e){}};
$('#sBt').onclick=()=>{try{NB.setCarAutoplay($('#sCarAuto').checked||true);$('#sCarAuto').checked=true}catch(e){}};
$('#sDriveNow').onclick=()=>{closeSettings();drive(true);driveSuppress=false};

/* ---------- 창 높이 조절 ---------- */
// 자동차·드라이브·콕핏 스킨은 기존처럼 손잡이로 바로 조절, 나머지 스킨은 기본 크기로 고정하고 창 위쪽 버튼을 눌렀을 때만 조절
let winH=store.get('winH',{}),winHN=store.get('winHN',{});
const sizeMap=()=>isCar()?winH:winHN;
function saveSizes(){store.set('winH',winH);store.set('winHN',winHN)}
const needRz=w=>w.id==='wGps'||!isCar();
function applySizes(){const lock=isCp(),m=sizeMap();document.querySelectorAll('.win').forEach(w=>{const h=lock&&w.id!=='wGps'?0:m[w.id];w.style.height=h?h+'px':'';w.classList.toggle('sized',!!h);w.classList.toggle('rzw',needRz(w));if(!needRz(w)&&w.classList.contains('rz'))winRz(w,false)})}
document.querySelectorAll('.win').forEach(w=>{
  const gr=document.createElement('div');gr.className='grip';gr.title='끌어서 창 높이 조절 · 두 번 누르면 원래 높이';gr.setAttribute('role','separator');gr.setAttribute('aria-orientation','horizontal');w.appendChild(gr);
  let y0=0,h0=0,pid=null;
  gr.addEventListener('pointerdown',e=>{if(needRz(w)&&!w.classList.contains('rz'))return;e.preventDefault();pid=e.pointerId;gr.setPointerCapture(pid);y0=e.clientY;h0=w.getBoundingClientRect().height;w.classList.add('sizing')});
  gr.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;const h=Math.max(90,Math.round(h0+e.clientY-y0));if(fxOn(w)){fxSetH(h,true);return}w.style.height=h+'px';w.classList.add('sized')});
  const end=e=>{if(e.pointerId!==pid)return;pid=null;w.classList.remove('sizing');if(fxOn(w)){fxSetH(Math.round(w.getBoundingClientRect().height));return}if(w.classList.contains('sized')){sizeMap()[w.id]=Math.round(w.getBoundingClientRect().height);saveSizes()}};
  gr.addEventListener('pointerup',end);gr.addEventListener('pointercancel',end);
  gr.addEventListener('dblclick',()=>{if(fxOn(w)){if(w.classList.contains('rz'))fxSetH(0);return}if(needRz(w)&&!w.classList.contains('rz'))return;delete sizeMap()[w.id];saveSizes();applySizes()});
  // 창 위쪽 크기 조절 버튼 (속도계 창은 원래 있음)
  const bar=w.querySelector(':scope>.bar'),col=bar&&bar.querySelector('[data-col]');
  if(bar&&col&&!bar.querySelector('.rzbtn')){const b=document.createElement('button');b.className='wbtn rzbtn';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','창 크기 조절 켜기');b.title='창 크기 조절';b.innerHTML='<svg viewBox="0 0 10 10"><path d="M5 0 8 3H6v4h2l-3 3-3-3h2V3H2z"/></svg>';bar.insertBefore(b,col)}
  const rb=bar&&bar.querySelector('.rzbtn');if(rb)rb.addEventListener('click',e=>{e.stopPropagation();winRz(w,!w.classList.contains('rz'))});
  w.addEventListener('pointerup',()=>{if(w.classList.contains('rz')){clearTimeout(rzT[w.id]);rzT[w.id]=setTimeout(()=>winRz(w,false),15000)}});
});
const rzT={};
// 콕핏 2 바로가기 화면 높이(모든 보기 공통). 0이면 화면에 꽉 차게
const fxOn=w=>appEl.classList.contains('FX')&&w.classList.contains('fx');
function fxSetH(h,live){const r=document.documentElement;h=h?Math.max(200,Math.min(2400,Math.round(h))):0;if(h)r.style.setProperty('--fxH',h+'px');else r.style.removeProperty('--fxH');
  if(!live)store.set('fxH',h);clearTimeout(fxSetH.t);fxSetH.t=setTimeout(()=>{try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}try{if(mapObj)mapObj.invalidateSize()}catch(e){}window.dispatchEvent(new Event('resize'))},live?120:40)}
{const h=store.get('fxH',0);if(h)document.documentElement.style.setProperty('--fxH',h+'px')}
function rzStep(w,d){if(fxOn(w)){fxSetH(d===0?0:w.getBoundingClientRect().height+d);clearTimeout(rzT[w.id]);rzT[w.id]=setTimeout(()=>winRz(w,false),15000);return}
  const r=w.getBoundingClientRect();let h=d===0?0:Math.max(140,Math.round(r.height+d));
  if(!h){delete sizeMap()[w.id];saveSizes();applySizes()}else{w.style.height=h+'px';w.classList.add('sized');sizeMap()[w.id]=h;saveSizes()}
  if(w.id==='wGps'){try{window.AmpPfd&&AmpPfd.panel.resize()}catch(e){}}
  clearTimeout(rzT[w.id]);rzT[w.id]=setTimeout(()=>winRz(w,false),15000)}
function winRz(w,on){const b=w.querySelector(':scope>.bar .rzbtn');w.classList.toggle('rz',on);
  let st=w.querySelector(':scope>.bar .rzsteps');
  if(!st&&b){st=document.createElement('span');st.className='rzsteps';st.innerHTML='<button class="wbtn" data-d="-80" aria-label="창 낮게">−</button><button class="wbtn" data-d="80" aria-label="창 높게">+</button><button class="wbtn wide" data-d="0" aria-label="원래 높이">원래</button>';
    st.addEventListener('click',e=>{const x=e.target.closest('button');if(!x)return;e.stopPropagation();rzStep(w,+x.dataset.d)});b.parentNode.insertBefore(st,b)}if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'창 크기 조절 끄기':'창 크기 조절 켜기')}
  clearTimeout(rzT[w.id]);if(on){toast('위쪽 − / + 버튼이나 창 아래 손잡이로 높이를 바꾸세요. 다 되면 ↕를 다시 누르세요.');rzT[w.id]=setTimeout(()=>winRz(w,false),15000)}}
function gpsRz(on){winRz($('#wGps'),on)}
const eqgridEl=$('#eqgrid');
new ResizeObserver(()=>{const sl=eqgridEl.querySelector('.slot');if(sl)eqgridEl.style.setProperty('--slot-h',sl.clientHeight+'px')}).observe(eqgridEl);

