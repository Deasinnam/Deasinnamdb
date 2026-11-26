/* DNR AI 통로 — 다른 덜누름 앱에서 부르는 질문 창 */
"use strict";
var $=function(id){return document.getElementById(id)};
function J(s){try{return JSON.parse(s)}catch(e){return null}}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function toast(t){var e=$("toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(function(){e.classList.remove("on")},2400)}
var DEMO=(location.search.match(/demo=(\w+)/)||[])[1];
if(!window.LA)window.LA=mockLA(DEMO||"text");

var TASKS=[
  ["summary","요약","다음 글을 핵심만 3~5줄로 요약해 줘. 요약한 글만 써."],
  ["fix","맞춤법 · 다듬기","다음 글의 맞춤법과 띄어쓰기를 고치고 문장을 자연스럽게 다듬어 줘. 뜻은 바꾸지 말고, 고친 글만 써."],
  ["easy","쉽게 풀어 쓰기","다음 글을 누구나 이해하기 쉬운 말로 다시 써 줘. 다시 쓴 글만 써."],
  ["en","영어로","다음 글을 자연스러운 영어로 번역해 줘. 번역한 글만 써."],
  ["ko","한국어로","다음 글을 자연스러운 한국어로 번역해 줘. 번역한 글만 써."],
  ["table","표로 정리","다음 글의 내용을 마크다운 표로 정리해 줘. 표만 써."],
  ["continue","이어 쓰기","다음 글에 자연스럽게 이어질 내용을 같은 말투로 한두 문단 써 줘. 이어 쓸 글만 써."]
];
var I=J(LA.info())||{},BUSY=false,LAST=null,ANSWER="",VOICE=false,VOICEQ=false,SPEAKING=false,pend=null,raf=0;

function init(){
  $("askT").textContent=I.title||"DNR AI";
  $("askFrom").textContent=(I.caller?I.caller+"에서 · ":"")+"기기 안에서만"+(I.model?" · "+I.model:"");
  $("noModel").classList.toggle("hide",!!I.ready);
  if(I.text){
    $("mat").classList.remove("hide");
    $("matT").textContent="보낸 글 · "+I.textLen.toLocaleString()+"자"+(I.textLen>I.max?" (앞 "+I.max.toLocaleString()+"자만)":"");
    $("matX").textContent=I.text;
    $("tasks").innerHTML=TASKS.map(function(t){return '<button data-t="'+t[0]+'">'+t[1]+'</button>'}).join("");
    [].forEach.call($("tasks").children,function(b){b.onclick=function(){runTask(b.getAttribute("data-t"))}});
    $("inp").placeholder="이 글로 무엇을 할까요? 예: 메일 답장 써 줘";
  }else{
    $("tasks").classList.add("hide");
    $("inp").placeholder="무엇이든 물어보세요";
  }
  $("aIns").textContent=I.insertLabel||"넣기";
  $("aIns").classList.toggle("hide",!I.insertLabel);
  setSend();
  if(!I.ready)return;
  var t=I.task||"";
  if(t){if(TASKS.some(function(x){return x[0]===t}))runTask(t);else ask(t)}
  else if(I.voice)setTimeout(startVoice,250);
  else if(!I.text)$("inp").focus();
}
function runTask(id){var t=TASKS.filter(function(x){return x[0]===id})[0];if(!t)return;
  [].forEach.call($("tasks").children,function(b){b.classList.toggle("on",b.getAttribute("data-t")===id)});
  go(t[2],t[1]);
}
function ask(q){q=(q||"").trim();if(!q)return;go(q,q)}
function go(instr,label){
  if(BUSY)return;
  if(!I.ready){toast("Chat DNR Ai에서 AI 모델을 먼저 내려받아 주세요");return}
  var prompt=I.text?instr+"\n\n[글]\n"+I.text:instr;
  var title=(I.caller?I.caller+" · ":"")+label;
  var r=LA.run(prompt,title);
  if(r!=="ok"){toast(r==="busy"?"Chat DNR Ai가 다른 답을 만드는 중이에요":r==="nomodel"?"AI 모델을 먼저 내려받아 주세요":"보내지 못했어요");return}
  LAST=[instr,label];ANSWER="";BUSY=true;setSend();
  $("inp").value="";autoH();
  $("ans").classList.remove("hide");$("ansErr").classList.add("hide");$("acts").classList.add("hide");
  $("ansMd").innerHTML='<span class="typing"><i></i><i></i><i></i></span>';
  if(I.text)$("mat").open=false;
}
function onDelta(d){pend=d;if(raf)return;raf=requestAnimationFrame(function(){raf=0;if(!pend)return;var m=$("ansMd");m.innerHTML=mdRender(pend.text);m.classList.add("cursor");var b=$("askBody");b.scrollTop=b.scrollHeight})}
function onFinish(d){
  BUSY=false;setSend();pend=null;
  ANSWER=d.text||"";var m=$("ansMd");m.classList.remove("cursor");m.innerHTML=mdRender(ANSWER);
  if(d.error){$("ansErr").textContent=d.error;$("ansErr").classList.remove("hide")}
  $("acts").classList.toggle("hide",!ANSWER);
  if(VOICEQ){VOICEQ=false;var st=I.settings||{};if(st.voiceRead!==false&&ANSWER&&!d.error){SPEAKING=true;mark();LA.speak(ANSWER,"ask")}}
}
function setSend(){
  var b=$("sendBtn");b.classList.toggle("stop",BUSY);
  b.innerHTML=BUSY?'<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>':'<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  b.disabled=!BUSY&&!$("inp").value.trim();
}
function autoH(){var t=$("inp");t.style.height="auto";t.style.height=Math.min(t.scrollHeight,140)+"px"}
$("inp").oninput=function(){autoH();setSend()};
$("inp").onkeydown=function(e){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing&&window.innerWidth>=720){e.preventDefault();$("sendBtn").click()}};
$("sendBtn").onclick=function(){if(BUSY){LA.stop();return}ask($("inp").value)};
$("askClose").onclick=function(){LA.close()};
$("dim").onclick=function(){if(!BUSY&&!ANSWER)LA.close()};
$("goApp1").onclick=function(){LA.openApp()};
$("aApp").onclick=function(){LA.openApp()};
$("aIns").onclick=function(){if(ANSWER){LA.stopSpeak();LA.finish(ANSWER)}};
$("aCopy").onclick=function(){LA.copy(ANSWER);toast("복사했어요")};
$("aRetry").onclick=function(){if(LAST&&!BUSY)go(LAST[0],LAST[1])};
function mark(){$("aSpeak").classList.toggle("speaking",SPEAKING)}
$("aSpeak").onclick=function(){if(SPEAKING){LA.stopSpeak();SPEAKING=false;mark();return}SPEAKING=true;mark();LA.speak(ANSWER,"ask")};

// ---------- DNR 음성 엔진 ----------
function vShow(t,x,think){var p=$("voicePanel");p.classList.remove("hide");p.classList.toggle("think",!!think);$("vTitle").textContent=t;$("vText").textContent=x||"";$("micBtn").classList.add("on")}
function vHide(){VOICE=false;$("voicePanel").classList.add("hide");$("micBtn").classList.remove("on")}
function startVoice(){
  if(BUSY){toast("답을 다 만든 뒤에 말해 주세요");return}
  if(!I.ready){toast("AI 모델을 먼저 내려받아 주세요");return}
  if(!LA.micOk()){LA.askMic();return}
  if(SPEAKING){LA.stopSpeak();SPEAKING=false;mark()}
  var r=LA.listen();if(r!=="ok"){toast("마이크를 쓸 수 없어요");return}
  VOICE=true;vShow("듣고 있어요","말이 끝나면 저절로 멈춰요");
}
$("micBtn").onclick=function(){if(VOICE){LA.stopListen();return}startVoice()};
$("vDone").onclick=function(){LA.stopListen()};
$("vCancel").onclick=function(){LA.cancelListen();vHide()};
function onVoice(d){
  if(d.state==="listening")vShow("듣고 있어요","말이 끝나면 저절로 멈춰요");
  else if(d.state==="level"){var bars=$("vBars").children,lv=d.level||0;for(var k=0;k<bars.length;k++)bars[k].style.height=(6+Math.round(26*Math.min(1,lv*[.6,.85,1,.85,.6][k]*2.2)))+"px"}
  else if(d.state==="partial")$("vText").textContent=d.text;
  else if(d.state==="thinking")vShow("받아 적는 중","기기 안 AI가 듣고 있어요",true);
  else if(d.state==="done"){vHide();if(d.text){VOICEQ=true;ask(d.text)}}
  else if(d.state==="error"){vHide();if(d.error)toast(d.error)}
}
window.LAe=function(type,d){
  if(type==="delta")onDelta(d);
  else if(type==="done"||type==="error")onFinish(d);
  else if(type==="voice")onVoice(d);
  else if(type==="speak"){if(d.state!=="start"){SPEAKING=false;mark();if(d.error)toast(d.error)}}
  else if(type==="mic"){if(d.granted)startVoice();else toast("말로 물으려면 마이크 권한이 필요해요")}
};
window.onBack=function(){if(VOICE){LA.cancelListen();vHide();return true}if(BUSY){LA.stop();return true}return false};

function mockLA(mode){
  var txt="2026년 3분기 매출은 전년 같은 기간보다 18% 늘어난 42억 원을 기록했습니다. 온라인 판매가 크게 늘었고, 특히 폴드 전용 액세서리 매출이 두 배가 되었습니다. 다만 물류비가 12% 오르면서 영업이익률은 9.1%로 소폭 낮아졌습니다. 4분기에는 연말 할인 행사와 신제품 출시로 매출 50억 원을 목표로 합니다.";
  var ans="- 3분기 매출 **42억 원**, 전년보다 18% 증가\n- 온라인 판매 증가, 폴드 액세서리 매출 **2배**\n- 물류비 12% 상승으로 영업이익률 **9.1%**로 소폭 하락\n- 4분기 목표: 연말 할인 · 신제품으로 매출 **50억 원**";
  return {
    info:function(){return JSON.stringify({caller:mode==="desk"?"덜누름 데스크탑앱":"덜누름 워크",text:mode==="desk"?"":txt,textLen:mode==="desk"?0:txt.length,max:7000,task:mode==="answer"?"summary":"",title:mode==="desk"?"DNR AI":"워크 문서 · DNR AI",insertLabel:mode==="desk"?"":"문서에 넣기",voice:mode==="voice",ready:true,model:"Gemma 4 E4B",settings:{voiceRead:true}})},
    run:function(){var i=0,iv=setInterval(function(){i+=9;if(i>=ans.length){clearInterval(iv);LAe("done",{text:ans})}else LAe("delta",{text:ans.slice(0,i)})},30);return "ok"},
    stop:function(){},finish:function(){},close:function(){},openApp:function(){},copy:function(){},
    micOk:function(){return true},askMic:function(){},listen:function(){setTimeout(function(){LAe("voice",{state:"listening"});LAe("voice",{state:"level",level:.6})},50);return "ok"},stopListen:function(){},cancelListen:function(){},speak:function(){},stopSpeak:function(){}
  };
}
init();
