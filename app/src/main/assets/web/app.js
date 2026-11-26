/* Chat DNR Ai(구 덜누름 로컬 AI) — 화면. 앱(Kotlin)과는 window.LA(부르기) · LAe(알림 받기)로 이야기함 */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var DEMO=(location.search.match(/demo=([a-z]+)/)||[])[1];
if(!window.LA||DEMO)window.LA=mockLA(DEMO||"chat");

var S=null,CUR=null,ATT=[],BUSY=false,LIVE=null,DL=null,SEL=null,DRAW=false,DOC=null;
var DRAWRE=/(그려|그림\s*(을|좀)?\s*(그|만들|생성)|이미지\s*(를|좀)?\s*(만들|생성)|일러스트|\bdraw\b|generate an image)/i;
var DOCRE=/(문서|워드|엑셀|보고서|회의록|기획서|계획서|제안서|견적서|표로|시트).{0,12}(만들|작성|써|정리|뽑아)/;
function chatModels(){return S.models.filter(function(m){return (m.kind||"chat")==="chat"})}

function J(s){try{return JSON.parse(s)}catch(e){return null}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function gb(b){return (b/1e9).toFixed(1)}
function toast(t){var e=$("toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(function(){e.classList.remove("on")},2200)}
function state(){S=J(LA.state())||S;return S}

// ---------- 시작 ----------
function boot(){
  state();
  var ready=chatModels().some(function(m){return m.ready});
  if(!ready){showSetup();return}
  showMain();
}

// ---------- 처음: 모델 고르기 · 내려받기 ----------
function showSetup(){
  $("setup").classList.remove("hide");$("main").classList.add("hide");
  if(!SEL)SEL=S.dl&&S.dl.id||(S.ram&&S.ram<7?"gemma4-e2b":"gemma4-e4b");
  drawSetup();
}
function modelCard(m,mode){
  var low=S.ram&&S.ram<m.minRam-0.5;
  var h='<button class="mcard'+(mode==="pick"&&SEL===m.id?" on":"")+'" data-id="'+m.id+'">'+(mode==="pick"?'<span class="rad"></span>':"")+
    '<span class="mt"><span class="mn">'+(m.kind==="image"?"🎨 ":"")+esc(m.name)+' <span class="bdg'+(m.id==="gemma4-e4b"?" rec":"")+'">'+esc(m.badge)+'</span>'+
    (mode==="set"&&m.ready?(S.active===m.id||m.kind==="image"?' <span class="tag use">'+(m.kind==="image"?"그림 준비됨":"쓰는 중")+'</span>':' <span class="tag ok">받음</span>'):"")+'</span>'+
    '<span class="md">'+esc(m.desc)+'</span><span class="ms">'+gb(m.bytes)+'GB · 메모리 '+m.minRam+'GB 이상 권장'+(low?" · 이 기기에는 무거울 수 있어요":"")+'</span>';
  if(mode==="set"){
    h+='<span class="mact">';
    if(m.ready){if(S.active!==m.id&&m.kind!=="image")h+='<span class="btn pri" data-act="use">이 모델 쓰기</span>';h+='<span class="btn bad" data-act="del">지우기</span>'}
    else if(!(DL&&DL.id===m.id&&!DL.done&&!DL.error))h+='<span class="btn" data-act="get">'+(m.partial>0?"이어받기":"내려받기")+' · '+gb(m.bytes)+'GB</span>';
    h+='</span>';
  }
  return h+'</span></button>';
}
function drawSetup(){
  $("suModels").innerHTML=chatModels().map(function(m){return modelCard(m,"pick")}).join("");
  [].forEach.call($("suModels").querySelectorAll(".mcard"),function(b){b.onclick=function(){if(dlActive())return;SEL=b.getAttribute("data-id");drawSetup()}});
  var m=S.models.filter(function(x){return x.id===SEL})[0];
  var need=m.bytes-m.partial+2e8,info="저장 공간 "+gb(S.free)+"GB 남음"+(S.ram?" · 메모리 "+S.ram+"GB":"");
  if(S.free<need)info='<span class="warn">저장 공간이 모자라요. '+gb(need-S.free)+'GB 더 비워 주세요 ('+info+')</span>';
  else if(!S.online)info='<span class="warn">인터넷에 연결되어 있지 않아요. 처음 한 번은 내려받기가 필요해요</span>';
  $("suInfo").innerHTML=info;
  var act=dlActive();
  $("suDl").classList.toggle("hide",!(DL&&DL.id===SEL&&(act||DL.error)));
  $("suGo").textContent=act?"멈추기":(m.partial>0?"이어받기":"내려받기 시작 · "+gb(m.bytes)+"GB");
  $("suGo").classList.toggle("pri",!act);
  $("suGo").disabled=!act&&S.free<need;
  drawDl("dl");
}
function dlActive(){return !!(DL&&DL.id&&!DL.done&&!DL.error)}
function drawDl(pre){
  if(!DL||!DL.id)return;
  var m=S.models.filter(function(x){return x.id===DL.id})[0]||{name:""};
  var tot=DL.total||m.bytes,pct=tot?Math.floor(DL.got/tot*100):0;
  var P=pre==="dl"?{n:"dlName",p:"dlPct",b:"dlBar",g:"dlGot",e:"dlErr"}:{n:"sdName",p:"sdPct",b:"sdBar",g:"sdGot",e:"sdErr"};
  $(P.n).textContent=m.name+(DL.done?" · 다 받았어요":DL.error?"":" 받는 중");
  $(P.p).textContent=pct+"%";$(P.b).style.width=pct+"%";
  $(P.g).textContent=gb(DL.got)+" / "+gb(tot)+"GB"+(DL.speed>0?" · "+(DL.speed/1e6).toFixed(1)+"MB/s":"");
  if(pre==="dl")$("dlEta").textContent=DL.speed>0?"약 "+Math.max(1,Math.ceil((tot-DL.got)/DL.speed/60))+"분 남음":"";
  $(P.e).classList.toggle("hide",!DL.error);$(P.e).textContent=DL.error||"";
}
$("suGo").onclick=function(){
  if(dlActive()){LA.stopDownload();return}
  LA.download(SEL);DL={id:SEL,got:(S.models.filter(function(x){return x.id===SEL})[0]||{}).partial||0,total:0,speed:0};drawSetup();
};

// ---------- 대화 화면 ----------
function showMain(){
  $("setup").classList.add("hide");$("main").classList.remove("hide");
  drawList();drawPill();
  var list=J(LA.chats())||[];
  if(!CUR){if(list.length&&list[0].count===0)openChat(list[0].id);else newChat()}
  LA.preload();
  if(window.innerWidth>=720)$("inp").focus();
}
function newChat(){
  var list=J(LA.chats())||[];
  var empty=list.filter(function(c){return c.count===0})[0];
  var c=empty?J(LA.chat(empty.id)):J(LA.newChat());
  CUR=c;drawChat();drawList();closeDrawer();
}
function openChat(id){var c=J(LA.chat(id));if(!c)return;CUR=c;drawChat();drawList();closeDrawer()}
function drawList(){
  var list=J(LA.chats())||[],now=new Date(),t0=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),grp="",h="";
  list=list.filter(function(c){return c.count>0||(CUR&&c.id===CUR.id)});
  if(!list.length){$("chatList").innerHTML='<div class="cempty">아직 대화가 없어요</div>';return}
  list.forEach(function(c){
    var g=c.updated>=t0?"오늘":c.updated>=t0-864e5?"어제":c.updated>=t0-7*864e5?"지난 7일":"이전";
    if(g!==grp){grp=g;h+='<div class="cgrp">'+g+'</div>'}
    h+='<div class="citem'+(CUR&&CUR.id===c.id?" on":"")+'" data-id="'+c.id+'"><span class="ct">'+esc(c.title)+'</span>'+
      '<button class="cdel" data-del="'+c.id+'" aria-label="지우기"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button></div>';
  });
  $("chatList").innerHTML=h;
  [].forEach.call($("chatList").querySelectorAll(".citem"),function(e){e.onclick=function(ev){
    var d=ev.target.closest("[data-del]");
    if(d){ev.stopPropagation();if(BUSY){toast("답을 만드는 중이에요");return}if(!confirm("이 대화를 지울까요?"))return;var id=d.getAttribute("data-del");LA.deleteChat(id);if(CUR&&CUR.id===id){CUR=null;newChat()}else drawList();return}
    if(BUSY){toast("답을 다 만든 뒤에 바꿀 수 있어요");return}
    openChat(e.getAttribute("data-id"));
  }});
}
var SUGS=[
  ["📷 이 사진 설명해 줘","영수증 · 메뉴판 · 문서 사진을 읽어요","photo"],
  ["✍️ 정중한 메일 초안","거래처에 납품 일정 미뤄 달라는 메일을 써 줘",""],
  ["🌐 번역","\"다음 주 화요일 오후 3시에 회의 가능할까요?\"를 영어와 일본어로",""],
  ["🎨 그림 그리기","노을 진 바닷가 방파제에 앉아 있는 고양이를 그려 줘","draw"],
  ["🧮 계산 · 정리","월 매출 1,240만 원, 재료비 38%, 인건비 25%면 남는 돈은?",""],
  ["🧑‍💻 코드","안드로이드에서 화면이 펼쳐졌는지 확인하는 코틀린 코드",""]
];
function drawChat(){
  $("chatTitle").textContent=CUR?CUR.title:"새 대화";
  var msgs=CUR&&CUR.messages||[];
  $("welcome").classList.toggle("hide",msgs.length>0);
  $("thread").innerHTML=msgs.map(msgHtml).join("");
  if(!msgs.length){
    $("sugs").innerHTML=SUGS.map(function(s,i){return '<button class="sug" data-i="'+i+'"><b>'+s[0]+'</b><span>'+esc(s[1])+'</span></button>'}).join("");
    [].forEach.call($("sugs").querySelectorAll(".sug"),function(b){b.onclick=function(){var s=SUGS[+b.getAttribute("data-i")];if(s[2]==="photo"){$("attMenu").classList.remove("hide");return}if(s[2]==="draw")setDraw(true);$("inp").value=s[1];autoH();$("inp").focus()}});
  }
  wireMsgs();scrollEnd(true);
}
var AV='<div class="av"><svg viewBox="0 0 364 365"><use href="#dnr"/></svg></div>';
function msgHtml(m,i){
  if(m.role==="user"){
    var im=(m.images||[]).map(function(p){return '<img src="file://'+esc(p)+'" alt="보낸 사진">'}).join("");
    return '<div class="m user">'+(im?'<div class="imgs">'+im+'</div>':"")+(m.text?'<div class="bub">'+esc(m.text)+'</div>':"")+'</div>';
  }
  var meta=m.ms?(m.ms/1000).toFixed(1)+"초":"";
  if(m.image){
    return '<div class="m ai">'+AV+'<div class="body"><img class="gen" src="file://'+esc(m.image)+'" alt="그린 그림">'+
      (m.prompt?'<details class="gen-prompt"><summary>그림 설명(영어)</summary><div>'+esc(m.prompt)+'</div></details>':"")+
      '<div class="acts"><button data-save-img="'+i+'" aria-label="갤러리에 저장"><svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg></button>'+
      '<button data-share-img="'+i+'" aria-label="공유"><svg viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/></svg></button>'+
      (i===(CUR.messages.length-1)?'<button data-retry aria-label="다시 그리기"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg></button>':"")+
      '<span class="meta">'+meta+' · 기기 안에서 그림</span></div></div></div>';
  }
  var prevU=null;for(var k=i-1;k>=0;k--)if(CUR.messages[k].role==="user"){prevU=CUR.messages[k];break}
  var docCard=(i===CUR.messages.length-1&&m.text&&!m.error&&prevU&&DOCRE.test(prevU.text||""))?
    '<div class="doc-card"><b>📄 이 답을 DNR 워크에서 문서로 열까요?</b><button class="btn pri" data-doc-kind="docx" data-i="'+i+'">Word 문서</button>'+(/\n\s*\|/.test("\n"+m.text)?'<button class="btn" data-doc-kind="xlsx" data-i="'+i+'">Excel 표</button>':"")+'</div>':"";
  return '<div class="m ai">'+AV+'<div class="body">'+
    (m.thought?'<details class="think"><summary>생각한 과정</summary><div>'+esc(m.thought)+'</div></details>':"")+
    '<div class="md">'+mdRender(m.text||"")+'</div>'+
    (m.error?'<div class="err">'+esc(m.error)+'</div>':"")+docCard+
    '<div class="acts"><button data-copy-msg="'+i+'" aria-label="복사"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>'+
    '<button data-share-msg="'+i+'" aria-label="공유"><svg viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13"/></svg></button>'+
    (m.text?'<button data-doc="'+i+'" aria-label="DNR 워크에서 문서로"><svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg></button>':"")+
    (i===(CUR.messages.length-1)?'<button data-retry aria-label="다시 답하기"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg></button>':"")+
    '<span class="meta">'+meta+'</span></div></div></div>';
}
function wireMsgs(){
  var t=$("thread");
  [].forEach.call(t.querySelectorAll("[data-copy-msg]"),function(b){b.onclick=function(){LA.copy(CUR.messages[+b.getAttribute("data-copy-msg")].text||"");toast("복사했어요")}});
  [].forEach.call(t.querySelectorAll("[data-share-msg]"),function(b){b.onclick=function(){LA.share(CUR.messages[+b.getAttribute("data-share-msg")].text||"")}});
  [].forEach.call(t.querySelectorAll("[data-retry]"),function(b){b.onclick=retry});
  [].forEach.call(t.querySelectorAll("[data-save-img]"),function(b){b.onclick=function(){toast(LA.saveImage(CUR.messages[+b.getAttribute("data-save-img")].image)==="ok"?"갤러리(사진/Chat DNR Ai)에 저장했어요":"저장하지 못했어요")}});
  [].forEach.call(t.querySelectorAll("[data-share-img]"),function(b){b.onclick=function(){LA.shareImage(CUR.messages[+b.getAttribute("data-share-img")].image)}});
  [].forEach.call(t.querySelectorAll("[data-doc]"),function(b){b.onclick=function(){openDoc(+b.getAttribute("data-doc"))}});
  [].forEach.call(t.querySelectorAll("[data-doc-kind]"),function(b){b.onclick=function(){DOC=docOf(+b.getAttribute("data-i"));makeDoc(b.getAttribute("data-doc-kind"))}});
}
document.addEventListener("click",function(e){
  var c=e.target.closest("[data-copy]");if(c){var code=c.closest("pre").querySelector("code").textContent;LA.copy(code);toast("코드를 복사했어요");return}
  var a=e.target.closest("a[data-url]");if(a){e.preventDefault();LA.openUrl(a.getAttribute("data-url"))}
});
function scrollEnd(force){var m=$("msgs");if(force||m.scrollHeight-m.scrollTop-m.clientHeight<160)m.scrollTop=m.scrollHeight}

// ---------- 보내기 · 받기 ----------
function send(text,images){
  if(BUSY)return;
  if(!S.active){toast("먼저 AI 모델을 내려받아 주세요");openSettings();return}
  text=(text||"").trim();images=images||[];
  if(!text&&!images.length)return;
  var r=LA.send(CUR.id,text,JSON.stringify(images));
  if(r!=="ok"){toast(r==="busy"?"답을 만드는 중이에요":"보내지 못했어요");return}
  CUR=J(LA.chat(CUR.id));
  $("inp").value="";autoH();ATT=[];drawAtts();
  BUSY=true;setSend();
  drawChat();drawList();
  LIVE=document.createElement("div");LIVE.className="m ai";
  LIVE.innerHTML=AV+'<div class="body"><div class="think hide"></div><div class="md"><span class="typing"><i></i><i></i><i></i></span></div></div>';
  $("thread").appendChild(LIVE);scrollEnd(true);
}
function retry(){
  if(BUSY||!CUR)return;
  var ms=CUR.messages,last=null;
  for(var i=ms.length-1;i>=0;i--)if(ms[i].role==="user"){last=ms[i];break}
  if(!last)return;
  if(last.draw){doDraw(last.text);return}
  send(last.text,(last.images||[]).filter(Boolean));
}
var pendingDelta=null,raf=0;
function onDelta(d){
  if(!LIVE||!CUR||d.chat!==CUR.id)return;
  pendingDelta=d;if(raf)return;
  raf=requestAnimationFrame(function(){raf=0;var x=pendingDelta;if(!x||!LIVE)return;
    var md=LIVE.querySelector(".md");md.innerHTML=mdRender(x.text);md.classList.add("cursor");
    if(x.thought){var th=LIVE.querySelector(".think");th.classList.remove("hide");th.innerHTML='<b>생각하는 중…</b><div>'+esc(x.thought.slice(-600))+'</div>'}
    scrollEnd(false);
  });
}
function onFinish(d){
  if(CUR&&d.chat===CUR.id){CUR=J(LA.chat(CUR.id));LIVE=null;drawChat()}
  BUSY=false;setSend();drawList();
  if(d.error)toast(d.error);
}
function setSend(){
  var b=$("sendBtn");b.classList.toggle("stop",BUSY);
  b.innerHTML=BUSY?'<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>':'<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  b.setAttribute("aria-label",BUSY?"멈추기":"보내기");
  b.disabled=!BUSY&&!$("inp").value.trim()&&!ATT.length;
}
$("sendBtn").onclick=function(){if(BUSY){LA.stop();return}go($("inp").value,ATT.slice())};
function go(text,images){
  var t=(text||"").trim();
  if(t&&!images.length&&(DRAW||DRAWRE.test(t)))doDraw(t);else send(text,images);
}
function setDraw(on){DRAW=on;$("drawBtn").classList.toggle("on",on);$("drawBtn").setAttribute("aria-pressed",on?"true":"false");$("inp").placeholder=on?"무엇을 그릴까요? 예: 비 오는 밤 네온 거리의 고양이":(ATT.length?"사진에 대해 물어보세요 (비우면 설명해 줘요)":"무엇이든 물어보세요");$("inp").focus()}
$("drawBtn").onclick=function(){if(ATT.length&&!DRAW){toast("사진을 넣은 채로는 그림을 그릴 수 없어요");return}setDraw(!DRAW)};
function doDraw(text){
  if(BUSY)return;
  state();
  if(!S.imageReady){
    if(!S.imageEngine){toast("이 기기에서는 그림 엔진을 쓸 수 없어요");return}
    var im=S.models.filter(function(m){return m.kind==="image"})[0];
    if(DL&&DL.id===im.id&&dlActive()){toast("그림 모델을 받는 중이에요 · "+Math.floor(DL.got/(DL.total||im.bytes)*100)+"%");return}
    if(confirm("그림을 그리려면 그림 모델("+gb(im.bytes)+"GB)을 한 번 내려받아야 해요. 지금 받을까요?\n(와이파이 권장 · 다 받으면 다시 말해 주세요)")){LA.download(im.id);DL={id:im.id,got:im.partial,total:0,speed:0};toast("그림 모델을 받기 시작했어요. 설정에서 진행을 볼 수 있어요")}
    return;
  }
  var r=LA.draw(CUR.id,text);
  if(r!=="ok"){toast(r==="busy"?"답을 만드는 중이에요":"그리지 못했어요");return}
  CUR=J(LA.chat(CUR.id));
  $("inp").value="";autoH();
  BUSY=true;setSend();drawChat();drawList();
  LIVE=document.createElement("div");LIVE.className="m ai";
  LIVE.innerHTML=AV+'<div class="body"><div class="gen-prog"><span class="gp-t">무엇을 그릴지 정리하는 중…</span><div class="bar"><i style="width:4%"></i></div></div></div>';
  $("thread").appendChild(LIVE);scrollEnd(true);
}
function onDrawStage(d){
  if(!LIVE||!CUR||d.chat!==CUR.id)return;
  var t=LIVE.querySelector(".gp-t"),b=LIVE.querySelector(".gen-prog .bar i");if(!t)return;
  if(d.stage==="prompt"){t.textContent="무엇을 그릴지 정리하는 중…";b.style.width="5%"}
  else if(d.stage==="load"){t.textContent="그림 엔진을 준비하는 중… (처음엔 조금 걸려요)";b.style.width="12%"}
  else if(d.stage==="draw"){var p=d.steps?d.step/d.steps:0;t.textContent="그리는 중 "+d.step+" / "+d.steps;b.style.width=Math.round(15+p*80)+"%"}
}
$("inp").addEventListener("input",function(){autoH();setSend()});
$("inp").addEventListener("keydown",function(e){
  // 키보드(덱스 · 블루투스)에서 Enter = 보내기, Shift+Enter = 줄바꿈
  if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing&&window.innerWidth>=720){e.preventDefault();$("sendBtn").click()}
});
function autoH(){var t=$("inp");t.style.height="auto";t.style.height=Math.min(t.scrollHeight,180)+"px"}

// 사진
$("attBtn").onclick=function(){if(ATT.length>=4){toast("사진은 한 번에 4장까지예요");return}$("attMenu").classList.remove("hide")};
$("aNo").onclick=function(){$("attMenu").classList.add("hide")};
$("attMenu").onclick=function(e){if(e.target===this)this.classList.add("hide")};
$("aGal").onclick=function(){$("attMenu").classList.add("hide");LA.pickImages()};
$("aCam").onclick=function(){$("attMenu").classList.add("hide");LA.camera()};
function drawAtts(){
  $("atts").innerHTML=ATT.map(function(p,i){return '<div class="att-i"><img src="file://'+esc(p)+'"><button data-i="'+i+'" aria-label="빼기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'}).join("");
  [].forEach.call($("atts").querySelectorAll("button"),function(b){b.onclick=function(){var i=+b.getAttribute("data-i");LA.dropImage(ATT[i]);ATT.splice(i,1);drawAtts();setSend()}});
  $("inp").placeholder=ATT.length?"사진에 대해 물어보세요 (비우면 설명해 줘요)":"무엇이든 물어보세요";
}

// AI 상태 표시
function drawPill(){
  var a=S.ai||{},m=(S.models.filter(function(x){return x.id===S.active})[0]||{}).name||"모델 없음";
  var st=a.state==="ready"?"ready":a.state==="loading"?"loading":a.state==="error"?"error":"";
  $("aiPill").className="pill "+st;
  $("aiPill").innerHTML="<i></i>"+esc(m)+(a.backend&&st==="ready"?" · "+a.backend:"");
  $("sideModel").textContent=m+(a.backend?" · "+a.backend:"")+" · 오프라인 OK";
  $("loadBar").classList.toggle("hide",st!=="loading");
  $("loadTxt").textContent="AI를 깨우는 중… "+(a.backend==="CPU"?"(CPU로 다시 시도 중)":"(처음엔 10초쯤 걸려요)");
  if(st==="error"&&a.error&&!drawPill.shown){drawPill.shown=1;toast(a.error)}
  if(st!=="error")drawPill.shown=0;
}

// 서랍(좁은 화면)
$("menuBtn").onclick=function(){$("main").classList.add("drawer")};
$("scrim").onclick=closeDrawer;
function closeDrawer(){$("main").classList.remove("drawer")}
$("newChat").onclick=$("newChat2").onclick=function(){if(BUSY){toast("답을 다 만든 뒤에 새 대화를 열 수 있어요");return}newChat();$("inp").focus()};

// ---------- DNR 워크로 문서 만들기 ----------
function docOf(i){var m=CUR.messages[i],u=null;for(var k=i-1;k>=0;k--)if(CUR.messages[k].role==="user"){u=CUR.messages[k];break}
  var h=/^#{1,3}\s+(.+)$/m.exec(m.text||"");return {text:m.text||"",title:(h?h[1]:(u&&u.text)||CUR.title||"Chat DNR Ai").replace(/[*`#]/g,"").trim().slice(0,40)}}
function openDoc(i){DOC=docOf(i);$("docX").classList.toggle("hide",!LA.hasTable(DOC.text));$("docSheet").classList.remove("hide")}
[].forEach.call($("docSheet").querySelectorAll("[data-kind]"),function(b){b.onclick=function(){$("docSheet").classList.add("hide");makeDoc(b.getAttribute("data-kind"))}});
$("docNo").onclick=function(){$("docSheet").classList.add("hide")};
$("docSheet").onclick=function(e){if(e.target===this)this.classList.add("hide")};
var DOCKIND="docx";
function makeDoc(kind){
  if(!DOC)return;DOCKIND=kind;
  var r=LA.toWork(DOC.text,DOC.title,kind);
  if(r==="ok"){toast("DNR 워크에서 열었어요 · 문서/Chat DNR Ai 폴더에 저장");return}
  if(r==="consent"){$("workAsk").classList.remove("hide");return}
  if(r==="nowork"){if(confirm("DNR 워크(덜누름 워크)가 설치되어 있지 않아요. DNR 앱센터(deolnureum.com)에서 받을까요?"))LA.openUrl("https://deolnureum.com/work/");return}
  toast(r.indexOf("fail:")===0?r.slice(5):"문서를 만들지 못했어요");
}
$("workYes").onclick=function(){LA.setSettings(JSON.stringify({work:true}));state();$("workAsk").classList.add("hide");makeDoc(DOCKIND)};
$("workNo").onclick=function(){$("workAsk").classList.add("hide")};
$("workAsk").onclick=function(e){if(e.target===this)this.classList.add("hide")};

// ---------- 설정 ----------
$("openSet").onclick=openSettings;
$("setClose").onclick=function(){$("setSheet").classList.add("hide")};
$("setSheet").onclick=function(e){if(e.target===this)this.classList.add("hide")};
function openSettings(){state();closeDrawer();drawSettings();$("setSheet").classList.remove("hide")}
function drawSettings(){
  $("setModels").innerHTML=S.models.map(function(m){return modelCard(m,"set")}).join("");
  [].forEach.call($("setModels").querySelectorAll("[data-act]"),function(b){b.onclick=function(e){
    e.stopPropagation();var id=b.closest(".mcard").getAttribute("data-id"),act=b.getAttribute("data-act");
    if(act==="use"){if(BUSY){toast("답을 다 만든 뒤에 바꿀 수 있어요");return}LA.useModel(id);setTimeout(function(){state();drawSettings();drawPill()},200);toast("모델을 바꿨어요")}
    if(act==="del"){if(!confirm("이 모델 파일을 지울까요? 다시 쓰려면 다시 내려받아야 해요."))return;LA.deleteModel(id)}
    if(act==="get"){var m=S.models.filter(function(x){return x.id===id})[0];if(S.free<m.bytes-m.partial+2e8){toast("저장 공간이 모자라요");return}LA.download(id);DL={id:id,got:m.partial,total:0,speed:0};drawSettings()}
  }});
  $("setDl").classList.toggle("hide",!(DL&&DL.id&&(dlActive()||DL.error)));drawDl("sd");
  $("setSpace").textContent="저장 공간 "+gb(S.free)+"GB 남음 · 메모리 "+S.ram+"GB · "+(S.device||"");
  var st=S.settings||{};
  $("temp").value=st.temperature;$("tVal").textContent=tLabel(st.temperature);
  $("think").checked=!!st.thinking;$("mtp").checked=st.mtp!==false;
  [].forEach.call($("backend").querySelectorAll("button"),function(b){b.classList.toggle("on",b.getAttribute("data-v")===st.backend)});
  $("sys").value=st.system||"";
  [].forEach.call($("imgSize").querySelectorAll("button"),function(b){b.classList.toggle("on",+b.getAttribute("data-v")===(st.imgSize||512))});
  $("work").checked=!!st.work;
  var wi=J(LA.workInfo())||{};$("workState").textContent=wi.installed?"DNR 워크가 설치되어 있어요":"DNR 워크가 설치되어 있지 않아요 · deolnureum.com에서 받을 수 있어요";
  $("imgInfo").textContent=S.imageEngine===false?"이 기기에서는 그림 엔진을 불러오지 못했어요":S.imageReady?"\"고양이 그려줘\"처럼 말하거나 입력창의 🎨를 누르면 폰 안에서 그림을 그려요":"그림을 그리려면 위 목록에서 🎨 그림 모델을 먼저 내려받아 주세요";
  $("about").textContent="Chat DNR Ai "+S.version+" · 갤럭시 Z 폴드8 울트라 기준 · 만든 곳 DNR(덜누름)";
}
function tLabel(v){v=+v;return v<=0.3?"정확하게":v<=0.9?"균형":"창의적으로"}
$("sdStop").onclick=function(){LA.stopDownload()};
$("temp").oninput=function(){$("tVal").textContent=tLabel(this.value)};
$("temp").onchange=function(){LA.setSettings(JSON.stringify({temperature:+this.value}));state()};
$("think").onchange=function(){LA.setSettings(JSON.stringify({thinking:this.checked}));state()};
$("mtp").onchange=function(){LA.setSettings(JSON.stringify({mtp:this.checked}));state()};
[].forEach.call($("backend").querySelectorAll("button"),function(b){b.onclick=function(){if(BUSY){toast("답을 다 만든 뒤에 바꿀 수 있어요");return}LA.setSettings(JSON.stringify({backend:b.getAttribute("data-v")}));state();drawSettings();toast("다음 질문부터 적용돼요")}});
[].forEach.call($("imgSize").querySelectorAll("button"),function(b){b.onclick=function(){LA.setSettings(JSON.stringify({imgSize:+b.getAttribute("data-v")}));state();drawSettings()}});
$("work").onchange=function(){LA.setSettings(JSON.stringify({work:this.checked}));state();toast(this.checked?"DNR 워크 연동을 허용했어요":"DNR 워크 연동을 껐어요")};
$("sys").onchange=function(){LA.setSettings(JSON.stringify({system:this.value}));state();toast("저장했어요. 새 질문부터 적용돼요")};
$("delAll").onclick=function(){if(BUSY)return;if(!confirm("모든 대화를 지울까요? 되돌릴 수 없어요."))return;LA.deleteAllChats();CUR=null;newChat();toast("모두 지웠어요")};

// ---------- 앱에서 오는 알림 ----------
window.LAe=function(type,d){
  if(type==="delta")onDelta(d);
  else if(type==="drawstage")onDrawStage(d);
  else if(type==="done"||type==="error")onFinish(d);
  else if(type==="ai"){if(S){S.ai=d;drawPill()}}
  else if(type==="dl"){
    var was=dlActive();DL=d&&d.id?d:null;
    if(DL&&DL.done){state();DL=null;if(!$("setup").classList.contains("hide")){toast("다 받았어요! 이제 인터넷 없이 쓸 수 있어요");showMain()}else{drawSettings();drawPill()}return}
    if(!DL&&was){state()}
    if(!$("setup").classList.contains("hide")){state();drawSetup()}
    else if(!$("setSheet").classList.contains("hide"))drawSettings();
  }
  else if(type==="models"){S=d;if(!chatModels().some(function(m){return m.ready})){$("setSheet").classList.add("hide");showSetup()}else{drawSettings();drawPill()}}
  else if(type==="picked"){(d.images||[]).forEach(function(p){if(ATT.length<4)ATT.push(p)});drawAtts();setSend();$("inp").focus()}
  else if(type==="shared"){if($("main").classList.contains("hide"))return;if(BUSY)return;newChat();(d.images||[]).forEach(function(p){ATT.push(p)});$("inp").value=d.text||"";autoH();drawAtts();setSend()}
  else if(type==="toast")toast(d.text);
  else if(type==="ask"){if(!$("main").classList.contains("hide")&&!BUSY){$("inp").value=d.text;autoH();setSend();go(d.text,[])}}
  else if(type==="resume"){if(S){S.online=d.online;if(!$("setup").classList.contains("hide"))drawSetup()}}
};
window.onBack=function(){
  if(!$("docSheet").classList.contains("hide")){$("docSheet").classList.add("hide");return true}
  if(!$("workAsk").classList.contains("hide")){$("workAsk").classList.add("hide");return true}
  if(!$("attMenu").classList.contains("hide")){$("attMenu").classList.add("hide");return true}
  if(!$("setSheet").classList.contains("hide")){$("setSheet").classList.add("hide");return true}
  if($("main").classList.contains("drawer")){closeDrawer();return true}
  return false;
};

// ---------- 화면 확인용 가짜 앱(demo) ----------
function mockLA(mode){
  var now=Date.now(),models=[
    {id:"gemma4-e4b",name:"Gemma 4 E4B",badge:"추천 · 더 똑똑함",desc:"대화 · 글쓰기 · 사진 이해를 더 정확하게. 폴드8 울트라에 맞춘 기본 모델",bytes:3.66e9,minRam:8,ready:mode!=="setup"&&mode!=="dl",partial:mode==="dl"?1.52e9:0},
    {id:"gemma4-e2b",name:"Gemma 4 E2B",badge:"가볍고 빠름",desc:"답이 두 배 이상 빠름. 배터리 · 공간을 아끼고 싶을 때",bytes:2.59e9,minRam:6,ready:false,partial:0},
    {id:"dreamshaper7-lcm",name:"DreamShaper 7 LCM",badge:"그림 그리기",desc:"\"고양이 그려줘\"처럼 말하면 폰 안에서 그림을 그려요(512×512)",bytes:2.13e9,minRam:8,ready:mode!=="setup"&&mode!=="dl",partial:0,kind:"image"}];
  var chat={id:"c1",title:"카페 신메뉴 가격 정하기",updated:now,messages:[
    {role:"user",text:"아메리카노 원가가 800원, 라떼 원가가 1,300원이야. 원가율 30%로 맞추면 판매가는 얼마로 하면 좋을까? 표로 정리해 줘",images:[]},
    {role:"model",ms:6400,text:"원가율 30%로 맞추려면 **판매가 = 원가 ÷ 0.3** 으로 계산하면 됩니다.\n\n| 메뉴 | 원가 | 계산값 | 추천 판매가 |\n|---|---|---|---|\n| 아메리카노 | 800원 | 2,667원 | **2,700원** |\n| 카페라떼 | 1,300원 | 4,333원 | **4,300~4,500원** |\n\n- 가격 끝자리는 **00원 단위**로 맞추면 계산이 편해요.\n- 주변 카페 가격도 함께 보세요. 상권에 따라 아메리카노 3,000원도 무리가 없어요.\n\n```text\n아메리카노 2,700원 → 원가율 29.6%\n카페라떼   4,500원 → 원가율 28.9%\n```"},
    {role:"user",text:"노을 진 바닷가 방파제에 앉아 있는 고양이를 그려 줘",draw:true},
    {role:"model",ms:21400,text:"",image:"__demogen__",prompt:"a cat sitting on a seawall at sunset, golden hour, ocean waves, warm light, cinematic, detailed fur"},
    {role:"user",text:"이 영수증 사진 내용을 엑셀 표로 정리해 줘",images:["__demo__"]},
    {role:"model",ms:9100,text:"영수증에서 읽은 내용이에요.\n\n- **날짜**: 2026년 11월 24일 (월)\n- **합계**: 58,400원\n\n| 품목 | 금액 |\n|---|---|\n| 원두 2kg | 46,000원 |\n| 우유 | 12,400원 |\n| **합계** | **58,400원** |"}]};
  var chats=mode==="empty"?[]:[{id:"c1",title:chat.title,updated:now,count:4},{id:"c2",title:"거래처에 납품 연기 메일",updated:now-3600e3,count:2},{id:"c3",title:"폴드 펼침 감지 코틀린 코드",updated:now-864e5,count:6},{id:"c4",title:"일본 출장 일정 영어 번역",updated:now-4*864e5,count:4},{id:"c5",title:"유튜브 영상 주제 아이디어",updated:now-20*864e5,count:2}];
  var empty={id:"c0",title:"새 대화",updated:now,messages:[]};
  var st={temperature:0.8,thinking:false,backend:"auto",system:"",mtp:true};
  setTimeout(function(){
    if(mode==="dl")LAe("dl",{id:"gemma4-e4b",got:1.52e9,total:3.66e9,speed:31e6,done:false,error:null});
    if(mode==="settings")openSettings();
    if(mode==="stream"){CUR=J(LA.chat("c1"));drawChat();LIVE=document.createElement("div");LIVE.className="m ai";LIVE.innerHTML=AV+'<div class="body"><div class="think hide"></div><div class="md"></div></div>';$("thread").appendChild(LIVE);BUSY=true;setSend();
      onDelta({chat:"c1",text:"좋아요! 장부에 넣을 수 있게 정리하면\n\n1. **날짜**: 11월 24일\n2. **분류**: 재료\n3. **금액**: 58,"});}
    [].forEach.call(document.querySelectorAll('img[src="file://__demogen__"]'),function(i){i.src="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1a4a"/><stop offset=".55" stop-color="#f28c38"/><stop offset="1" stop-color="#ffd27a"/></linearGradient></defs><rect width="512" height="512" fill="url(#s)"/><circle cx="256" cy="300" r="70" fill="#ffe2a0"/><rect y="330" width="512" height="182" fill="#1d3b5a"/><rect y="380" width="512" height="40" fill="#3a3530"/><path d="M300 380c-6-40 10-62 28-70l6-22 12 18c14 0 22 6 26 14l16-12-2 24c10 20 6 40-6 48z" fill="#111"/></svg>')});
    if(mode==="drawing"){CUR=J(LA.chat("c1"));drawChat();LIVE=document.createElement("div");LIVE.className="m ai";LIVE.innerHTML=AV+'<div class="body"><div class="gen-prog"><span class="gp-t"></span><div class="bar"><i></i></div></div></div>';$("thread").appendChild(LIVE);BUSY=true;setSend();onDrawStage({chat:"c1",stage:"draw",step:4,steps:6});scrollEnd(true)}
    if(mode==="work"){$("workAsk").classList.remove("hide")}
    [].forEach.call(document.querySelectorAll('img[src="file://__demo__"]'),function(i){i.src="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#f4f1ea"/><g fill="#999"><rect x="25" y="20" width="100" height="8"/><rect x="25" y="40" width="70" height="6"/><rect x="25" y="55" width="90" height="6"/><rect x="25" y="70" width="60" height="6"/><rect x="25" y="100" width="100" height="10"/></g></svg>')});
  },60);
  return {
    state:function(){return JSON.stringify({imageReady:mode!=="setup",imageEngine:true,models:models,active:mode==="setup"||mode==="dl"?null:"gemma4-e4b",free:121e9,ram:16,online:true,version:"0.1.0",device:"SM-F976N",settings:st,busy:false,ai:{state:"ready",model:"Gemma 4 E4B",backend:"GPU",loadMs:4200}})},
    chats:function(){return JSON.stringify(chats)},
    chat:function(id){return JSON.stringify(id==="c1"&&mode!=="empty"?chat:empty)},
    newChat:function(){return JSON.stringify(empty)},
    deleteChat:function(){},deleteAllChats:function(){},renameChat:function(){},
    send:function(){return "ok"},stop:function(){},preload:function(){},
    download:function(){},stopDownload:function(){},deleteModel:function(){},useModel:function(){},
    pickImages:function(){},camera:function(){},dropImage:function(){},
    settings:function(){return JSON.stringify(st)},setSettings:function(){},
    copy:function(){},share:function(){},openUrl:function(){},wifiSettings:function(){},
    draw:function(){return "ok"},saveImage:function(){return "ok"},shareImage:function(){},workInfo:function(){return '{"installed":true,"allowed":false}'},
    toWork:function(){return mode==="doc"?"ok":"consent"},hasTable:function(t){return /\n\s*\|/.test("\n"+t)}
  };
}

boot();
if(DEMO==="chat"||DEMO==="stream"||DEMO==="settings"||DEMO==="drawing"||DEMO==="work"){var first=J(LA.chats());if(first&&first[0]){openChat(first[0].id)}}
})();
