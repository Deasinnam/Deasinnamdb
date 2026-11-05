// 창 순서 바꾸기: 창 제목줄을 3초 누르고 있으면 창이 들려서, 끌어 놓은 자리로 옮김(설정 → 창 순서와 같은 저장)
// 이 파일들은 tools/build-web.cjs가 순서대로 이어 붙여 하나의 함수 범위(app.js)로 만듭니다.
/* ---------- 창 길게 눌러 옮기기 ---------- */
const WR={t:0,w:null,pid:null,x:0,y:0,lx:0,ly:0,on:false,order:null,before:'',raf:0,lastKey:'',lastAt:0};
const WR_HOLD=3000;
function wrCan(){return !appEl.classList.contains('FX')&&!document.documentElement.hasAttribute('data-split')&&!isTab()}
function wrBar(e){const bar=e.target&&e.target.closest&&e.target.closest('#app>.win>.bar');if(!bar||e.target.closest('button,select,input,a,label,.rzsteps'))return null;return bar}
function wrCancel(){clearTimeout(WR.t);if(WR.w)WR.w.classList.remove('lp');if(!WR.on){WR.w=null;WR.pid=null}}
function wrStart(){const w=WR.w;if(!w||!wrCan()){wrCancel();return}
  w.classList.remove('lp');WR.on=true;WR.order=(winOrder()||winDefault()).slice();WR.before=WR.order.join();WR.lastKey='';
  w.classList.add('wmove');appEl.classList.add('WR');try{navigator.vibrate&&navigator.vibrate(40)}catch(e){}
  toast('끌어서 놓을 자리로 옮기세요. 손을 떼면 저장돼요.');
  cancelAnimationFrame(WR.raf);WR.raf=requestAnimationFrame(wrLoop)}
// 화면 위·아래 끝에 손가락이 있으면 천천히 스크롤
function wrLoop(){if(!WR.on)return;const m=70,y=WR.ly;
  if(y<m)window.scrollBy(0,-Math.ceil((m-y)/5));else if(y>innerHeight-m)window.scrollBy(0,Math.ceil((y-innerHeight+m)/5));
  wrMove(WR.lx,WR.ly);WR.raf=requestAnimationFrame(wrLoop)}
function wrMove(x,y){const el=document.elementFromPoint(x,y),t=el&&el.closest('#app>.win');
  if(!t||t===WR.w||!WR.order.includes(t.id))return;
  const r=t.getBoundingClientRect(),wide=r.width>appEl.getBoundingClientRect().width*.6;
  const after=wide?y>r.top+r.height/2:x>r.left+r.width/2;
  const key=t.id+(after?'+':'-'),now=performance.now();
  if(key===WR.lastKey||now-WR.lastAt<280)return; // 자리가 바뀐 직후엔 잠깐 기다려 왔다 갔다 하지 않게
  const o=WR.order.filter(id=>id!==WR.w.id);let i=o.indexOf(t.id);if(after)i++;o.splice(i,0,WR.w.id);
  WR.lastKey=key;WR.lastAt=now;
  if(o.join()===WR.order.join())return;
  WR.order=o;store.set('winOrder_'+winKind(),o);applyWinOrder()}
function wrEnd(){const w=WR.w;WR.on=false;cancelAnimationFrame(WR.raf);clearTimeout(WR.t);
  if(w)w.classList.remove('wmove','lp');appEl.classList.remove('WR');WR.w=null;WR.pid=null;
  if(WR.order&&WR.order.join()!==WR.before){toast((WIN_NAME[w.id]||'창')+' 자리를 옮겼어요. 설정 → 창 순서에서 되돌릴 수 있어요.');if(!$('#settings').hidden)renderWinOrder()}
  WR.order=null}
document.addEventListener('pointerdown',e=>{if(e.button>0||WR.on)return;const bar=wrBar(e);if(!bar||!wrCan())return;const w=bar.parentElement;if(!winDefault().includes(w.id))return;
  wrCancel();WR.w=w;WR.pid=e.pointerId;WR.x=WR.lx=e.clientX;WR.y=WR.ly=e.clientY;w.classList.add('lp');WR.t=setTimeout(wrStart,WR_HOLD)},true);
document.addEventListener('pointermove',e=>{if(e.pointerId!==WR.pid)return;WR.lx=e.clientX;WR.ly=e.clientY;
  if(!WR.on&&Math.hypot(e.clientX-WR.x,e.clientY-WR.y)>12)wrCancel()},true); // 누르는 동안 움직이면(스크롤) 취소
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,e=>{if(e.pointerId!==WR.pid)return;if(WR.on)wrEnd();else wrCancel()},true));
document.addEventListener('touchmove',e=>{if(WR.on&&e.cancelable)e.preventDefault()},{passive:false}); // 옮기는 동안 화면이 같이 스크롤되지 않게
document.addEventListener('contextmenu',e=>{if(WR.w||wrBar(e))e.preventDefault()},true);
window.addEventListener('blur',()=>{if(WR.on)wrEnd();else wrCancel()});
