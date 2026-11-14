// AI 음성 대화(ChatGPT·Claude 앱 불러오기)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 1.64 아래 버튼 줄 [AI] ----------
 *  - 누르면 고른 AI 앱(ChatGPT·Claude)을 화면 아래(또는 위)에 엶 — YT Music·Spotify처럼 그 앱을 그대로 씀(구독 그대로, API 키 없음)
 *  - 길게 누르면(또는 처음엔) 앱·열 위치 고르기
 *  - 대화가 이어지는 동안 스피드미터 아래쪽(원형 지도 오른쪽, 나침반 띠 위)에 'AI 아일랜드': 듣는 중·말하는 중·대화 중 + 알림에 뜬 답 한 줄
 *    판단 재료(네이티브 aiInfo): 그 두 앱의 알림, 기기의 통화 모드·마이크 사용·음성 재생(어느 앱인지는 모름) — 실제 목소리 파형은 다른 앱에서 가져올 수 없어
 *    막대 움직임은 상태에 맞춘 효과
 *  - 시험·미리보기: window.__ai = {on, pkg, text, ongoing, comm, rec, voice, notif} */
const AI_APPS={chatgpt:{pkg:'com.openai.chatgpt',name:'ChatGPT'},claude:{pkg:'com.anthropic.claude',name:'Claude'}};
const AiTalk=(()=>{
  const btn=$('#ckRail button[data-ai]'),pick=$('#aiPick');if(!btn||!pick)return null;
  const app=()=>AI_APPS[store.get('aiApp','')]||null,at=()=>store.get('aiAt','bottom');
  let launchAt=0;
  function label(){const a=app(),em=btn.querySelector('em');if(em)em.textContent=a?a.name:'고르기'}
  function close(){pick.hidden=true;clearTimeout(close.t)}
  function open(){const a=app();if(!a){show();return}
    launchAt=Date.now();
    if(!NB||!NB.openApp){toast(a.name+' 열기는 안드로이드 앱에서 동작해요.');return}
    try{const r=NB.openAppSplit?NB.openAppSplit(a.pkg,at()==='top'):(NB.openApp(a.pkg),'open');
      if(r==='missing')toast(a.name+' 앱이 없어 설치 화면을 열어요.');else toast(a.name+'에서 음성 대화 버튼을 누르면 시작해요.')}catch(e){try{NB.openApp(a.pkg)}catch(x){}}}
  function show(){const a=store.get('aiApp','');
    pick.querySelectorAll('[data-app]').forEach(b=>b.classList.toggle('on',b.dataset.app===a));
    pick.querySelectorAll('[data-at]').forEach(b=>b.classList.toggle('on',b.dataset.at===at()));
    pick.hidden=false;const r=btn.getBoundingClientRect(),pr=pick.getBoundingClientRect();
    pick.style.left=Math.max(8,Math.min(innerWidth-pr.width-8,r.left+r.width/2-pr.width/2))+'px';pick.style.top=Math.max(8,r.top-pr.height-10)+'px';
    clearTimeout(close.t);close.t=setTimeout(close,12000)}
  pick.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.app){store.set('aiApp',b.dataset.app);label();close();open();return}
    if(b.dataset.at){store.set('aiAt',b.dataset.at);show()}});
  document.addEventListener('pointerdown',e=>{if(!pick.hidden&&!e.target.closest('#aiPick,#ckRail button[data-ai]'))close()},true);
  // 누르기 = 열기, 길게 누르기 = 고르기
  {let t=0,long=false,x0=0,y0=0;
    btn.addEventListener('pointerdown',e=>{long=false;x0=e.clientX;y0=e.clientY;clearTimeout(t);t=setTimeout(()=>{long=true;show();try{navigator.vibrate&&navigator.vibrate(30)}catch(x){}},550)});
    btn.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-x0,e.clientY-y0)>12)clearTimeout(t)});
    ['pointerup','pointercancel'].forEach(ev=>btn.addEventListener(ev,()=>clearTimeout(t)));
    btn.addEventListener('contextmenu',e=>e.preventDefault());
    btn.addEventListener('click',e=>{e.stopPropagation();if(long){long=false;return}if(!pick.hidden){close();return}open()})}
  label();

  /* ----- 스피드미터 위 AI 아일랜드 ----- */
  const isl=document.createElement('div');isl.className='ai-isl';isl.setAttribute('role','status');isl.setAttribute('aria-live','polite');
  isl.innerHTML='<span class="ai-w" aria-hidden="true">'+'<i></i>'.repeat(7)+'</span><b><span class="ai-n"></span><em class="ai-s"></em></b><small class="ai-t"></small>';
  const bars=[...isl.querySelectorAll('.ai-w i')],nEl=isl.querySelector('.ai-n'),sEl=isl.querySelector('.ai-s'),tEl=isl.querySelector('.ai-t');
  let st={on:false,phase:'live',name:'',text:''},offAt=0,lastText='',textAt=0,raf=0,lv=[0,0,0,0,0,0,0];
  function host(){return document.querySelector('#pfdHost [data-role="canvasWrap"]')}
  function info(){if(window.__ai)return window.__ai;try{return NB&&NB.aiInfo?JSON.parse(NB.aiInfo()):null}catch(e){return null}}
  function judge(){const i=info()||{},now=Date.now(),launched=now-launchAt<30*60e3||!!window.__ai;
    const sig=!!(i.comm||i.rec||i.voice);
    const on=(!!i.on&&(i.ongoing||sig||launched))||(launched&&sig);
    const phase=i.voice&&!i.rec?'speak':i.rec&&!i.voice?'listen':'live';
    const a=i.pkg?Object.values(AI_APPS).find(x=>x.pkg===i.pkg):app();
    if(i.text&&i.text!==lastText){lastText=i.text;textAt=now}
    return {on,phase,name:a?a.name:'AI',text:now-textAt<60e3?lastText:'',hint:launched&&i.notif===false}}
  function render(){const h=host();if(h&&isl.parentNode!==h)h.appendChild(isl);
    const j=judge(),now=Date.now();if(j.on)offAt=0;else if(!offAt)offAt=now;
    const vis=j.on||(st.on&&now-offAt<3000);
    isl.classList.toggle('show',vis);isl.dataset.phase=j.on?j.phase:st.phase;
    if(j.on){nEl.textContent=j.name.toUpperCase();sEl.textContent=j.phase==='speak'?'말하는 중':j.phase==='listen'?'듣는 중':'대화 중';
      const t=j.text||(j.hint?'알림 접근을 켜면 AI 답이 여기 보여요':'');tEl.textContent=t;isl.classList.toggle('txt',!!t);st=j}
    else st.on=vis;
    if(vis)place(h);
    if(vis&&!raf)raf=requestAnimationFrame(draw)}
  // 원형 지도와 오른쪽 아래 칩을 피해 그 사이 빈자리 가운데에(화면 크기마다 다시 잼)
  function place(h){const op=isl.offsetParent;if(!h||!op)return;const w=h.getBoundingClientRect(),o=op.getBoundingClientRect(),m=h.querySelector('.pfd-mini');
    const tape=w.width*.122; // 좌우 속도·고도 띠(캔버스에 그려짐) 안쪽만
    let L=w.left+tape+8,R=w.right-tape-8;const mr=m&&m.offsetParent?m.getBoundingClientRect():null;if(mr&&mr.width&&mr.right<w.left+w.width*.6)L=Math.max(L,mr.right+10);
    const mw=Math.max(200,Math.min(460,R-L));isl.style.maxWidth=mw+'px';isl.style.left=((L+R)/2-o.left)+'px'}
  // 막대 7개: 말할 때는 크게 출렁, 들을 때는 가운데가 숨쉬듯, 대화 중엔 잔잔하게(스프링처럼 따라감, 튀지 않게)
  function draw(ts){raf=0;if(!isl.classList.contains('show'))return;const t=ts/1000,ph=isl.dataset.phase;
    for(let k=0;k<7;k++){const c=Math.abs(k-3)/3;let g;
      if(ph==='speak')g=.22+.78*Math.abs(Math.sin(t*7.3+k*1.7)*Math.sin(t*3.1+k*.9))*(1-c*.35);
      else if(ph==='listen')g=.16+.34*(1-c)*(.5+.5*Math.sin(t*3.2-c*1.6));
      else g=.12+.1*(.5+.5*Math.sin(t*1.6+k*.8));
      lv[k]+=(g-lv[k])*.28;bars[k].style.transform='scaleY('+Math.max(.15,lv[k]).toFixed(3)+')';bars[k].style.opacity=(.55+.45*(1-c)).toFixed(2)}
    raf=requestAnimationFrame(draw)}
  setInterval(render,500);setTimeout(render,400);
  return {open,show,close,render,get state(){return judge()}}})();
window.AmpAiTalk=AiTalk;
