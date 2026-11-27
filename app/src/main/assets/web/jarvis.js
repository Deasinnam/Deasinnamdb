/* 자비스 — DNR AI 음성 모드 화면. 앱(Kotlin JarvisActivity)과는 window.LA · LAe로 이야기함 */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var B=document.body;
var DEMO=(location.search.match(/demo=(\w+)/)||[])[1];
if(DEMO||!window.LA)window.LA=mockLA(DEMO||"idle");

var INFO=JSON.parse(LA.info()), ST=INFO.settings||{};
var MODE="idle";        // idle | listen | think | speak
var SESSION=false;      // 자비스 온 상태(대화 중)
var WAKE=false;         // "자비스 온" 대기 중
var LAST="", ANS_ID=0, SPK=null, toastT=0;
var RE_ON=/자비스|쟈비스|자비즈|jarvis/i;
var RE_OFF=/(자비스|쟈비스|jarvis)?\s*(오프|꺼\s*줘|꺼|종료|그만|잘\s*자|off)\s*[.!?。]*$/i;
var RE_WEB=/(인터넷|웹|네이버)\s*(에서|으로|로)?\s*(좀\s*)?(찾아|검색|알아)|검색해\s*(줘|봐)/;
var RE_ONLY_ON=/^\s*(헤이\s*)?(자비스|쟈비스|자비즈|jarvis)\s*(온|on|야|아)?\s*[.!?,。]*\s*$/i;

function prefWake(){return ST.jarvisWake!==false}
function prefRead(){return ST.voiceRead!==false}

function set(mode){
  MODE=mode;
  B.classList.remove("listen","think","speak");
  if(mode!=="idle")B.classList.add(mode==="listen"?"listen":mode==="think"?"think":"speak");
  var pill=$("pill"),t=$("pillT");pill.className="pill";
  if(mode==="listen"){pill.classList.add("rec");t.textContent="LISTENING"}
  else if(mode==="think"){t.textContent="THINKING · 기기 안"}
  else if(mode==="speak"){pill.classList.add("spk");t.textContent="SPEAKING"}
  else t.textContent=WAKE?"WAKE · 대기 중":"OFFLINE · 기기 안";
  $("hudTag").textContent=mode==="listen"?"REC ●":mode==="think"?"AI · RUN":mode==="speak"?"VOICE ▶":(WAKE?"WAKE · ON":"STANDBY");
  var h=$("title"),s=$("sub"),hint=$("hint");
  if(mode==="listen"){h.textContent="듣고 있어요";s.textContent="편하게 말씀하세요. 말을 멈추면 자동으로 물어볼게요";hint.textContent="다시 누르면 다 말한 걸로 · “자비스 오프”로 끝내기"}
  else if(mode==="think"){h.textContent="생각하는 중";s.textContent="기기 안 AI가 답을 만들고 있어요";hint.textContent="누르면 멈춰요"}
  else if(mode==="speak"){h.textContent="답하는 중";s.textContent="다 읽으면 이어서 들을게요";hint.textContent="누르면 읽기를 멈추고 바로 말할 수 있어요"}
  else{
    h.textContent="자비스";
    s.textContent=!INFO.ready?"AI 모델이 있어야 자비스가 답할 수 있어요":(WAKE?"“자비스 온”이라고 부르면 들을게요":"마이크를 누르면 들을게요");
    hint.textContent="누르거나 “자비스 온” · 끝낼 땐 “자비스 오프”";
  }
  B.classList.toggle("talk",SESSION||!$("you").classList.contains("hide"));
}

function toast(t){var e=$("toast");e.textContent=t;e.classList.add("on");clearTimeout(toastT);toastT=setTimeout(function(){e.classList.remove("on")},2600)}

function drawInfo(){
  INFO=JSON.parse(LA.info());ST=INFO.settings||{};
  $("stModel").textContent=INFO.model?INFO.model.replace(/^Gemma 4 /,"Gemma "):"없음";
  $("noModel").classList.toggle("hide",!!INFO.ready);
  $("stNet").textContent=ST.webKey?"필요할 때만":"사용 안 함";
  $("stats").classList.toggle("hide",!INFO.ready);
}

// ---------- 부르기 대기("자비스 온") ----------
function arm(){
  if(!prefWake()||!INFO.ready||MODE!=="idle"||document.hidden){if(WAKE){WAKE=false;LA.stopWake()}return}
  if(!LA.micOk()){WAKE=false;set("idle");return}
  var r=LA.wake();
  if(r==="ok"){WAKE=true}else WAKE=false;
  set(MODE);
}
function disarm(){if(WAKE){WAKE=false;LA.stopWake()}}

function onWake(d){
  if(d.state==="level"){if(MODE==="idle")level(d.level*0.5);return}
  if(d.state==="off"){WAKE=false;ST.jarvisWake=false;set("idle");toast("이 모델은 소리를 직접 못 들어요. 마이크를 눌러 주세요");return}
  if(d.state==="armed"||!WAKE)return;
  if(d.state==="idle"){WAKE=false;setTimeout(arm,200);return}
  if(d.state==="heard"){
    WAKE=false;
    var t=(d.text||"").trim();
    if(RE_ON.test(t)){
      var rest=t.replace(/^.*?(자비스|쟈비스|자비즈|jarvis)\s*(온|on)?\s*[,.!?]?\s*/i,"").trim();
      SESSION=true;
      if(rest.length>=2&&!RE_ONLY_ON.test(t))ask(rest);
      else{LA.speak("네, 말씀하세요.","hi")}
    }else setTimeout(arm,150);
  }
}

// ---------- 듣기 → 묻기 → 읽기 ----------
function start(){
  if(!INFO.ready){$("noModel").classList.remove("hide");toast("먼저 AI 모델을 받아 주세요");return}
  if(!LA.micOk()){LA.askMic();return}
  disarm();SESSION=true;
  var r=LA.listen();
  if(r==="busy"){toast("아직 답을 만드는 중이에요");return}
  if(r==="nomic"){LA.askMic();return}
}

function end(say){
  SESSION=false;LA.cancelListen();LA.stopSpeak();LA.endChat();
  set("idle");
  if(say)LA.speak("자비스를 끌게요.","bye");
  else setTimeout(arm,400);
}

function onVoice(d){
  if(d.state==="listening"){set("listen");return}
  if(d.state==="level"){level(d.level);return}
  if(d.state==="thinking"){set("think");$("sub").textContent="받아 적는 중이에요";return}
  if(d.state==="partial"){showYou(d.text);return}
  if(d.state==="error"){
    if(SESSION&&MODE==="listen"&&!d.noAudio){end(false);toast("말소리가 없어서 자비스를 쉬게 했어요");return}
    set("idle");toast(d.error||"잘 못 들었어요");setTimeout(arm,600);return}
  if(d.state==="done"){
    var t=(d.text||"").trim();
    if(!t){set("idle");toast("잘 못 들었어요. 다시 말씀해 주세요");setTimeout(arm,600);return}
    if(RE_OFF.test(t)&&t.length<=14){showYou(t);end(true);return}
    if(RE_ONLY_ON.test(t)){LA.speak("네, 말씀하세요.","hi");return}
    ask(t.replace(/^(헤이\s*)?(자비스|쟈비스|jarvis)\s*(온|on)?\s*[,.!?]?\s*/i,"")||t);
  }
}

function showYou(t){$("you").classList.remove("hide");$("youT").textContent=t;B.classList.add("talk")}

function ask(text){
  showYou(text);LAST="";
  $("ans").classList.remove("hide");$("ansMd").innerHTML='<span class="cursor"></span>';
  $("acts").classList.add("hide");
  set("think");
  var web=RE_WEB.test(text);
  var r=web?LA.runWeb(text):LA.run(text);
  if(r==="nokey"){r=LA.run(text);toast("검색 키가 없어 기기 안에서 답할게요 · Chat DNR Ai 설정에서 넣을 수 있어요")}
  if(r==="nomodel"){set("idle");drawInfo();return}
  if(r==="busy"){set("idle");toast("아직 답을 만드는 중이에요")}
}

function onDelta(d){LAST=d.text||"";$("ansMd").innerHTML=render(LAST,true)}
function onDone(d){
  LAST=d.text||LAST;
  $("ansMd").innerHTML=render(LAST,false)||'<p>답을 못 만들었어요.</p>';
  $("acts").classList.remove("hide");
  if(d.error){set("idle");toast(d.error);return}
  if(prefRead()&&LAST){SPK="a"+(++ANS_ID);LA.speak(LAST,SPK);set("speak")}
  else afterAnswer();
}
function afterAnswer(){
  set("idle");
  if(SESSION&&!document.hidden)setTimeout(function(){if(SESSION&&MODE==="idle")LA.listen()},350);
  else setTimeout(arm,400);
}
function onSpeak(d){
  if(d.state==="start"){if(d.id!=="bye")set("speak");return}
  if(d.state==="done"||d.state==="error"){
    if(d.id==="bye"){set("idle");setTimeout(arm,500);return}
    if(MODE==="speak"||d.id==="hi")afterAnswer();
  }
}

function render(t,streaming){
  try{return window.mdRender?mdRender(t,streaming)+(streaming?'<span class="cursor"></span>':""):esc(t)}catch(e){return esc(t)}
}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]}).replace(/\n/g,"<br>")}

var bars=[].slice.call(document.querySelectorAll("#wave i"));
function level(lv){
  lv=Math.max(0,Math.min(1,lv||0));
  bars.forEach(function(b,i){var k=1-Math.abs(i-3)/4;b.style.height=(10+lv*70*k*(0.6+Math.random()*0.4))+"px"});
  var r=$("lvRing");r.style.strokeOpacity=(0.3+lv*0.6).toFixed(2);r.style.strokeWidth=(10+lv*10).toFixed(1);
}

// ---------- 버튼 ----------
$("mic").onclick=function(){
  if(MODE==="listen"){LA.stopListen();return}
  if(MODE==="think"){LA.stop();set("idle");return}
  if(MODE==="speak"){LA.stopSpeak();set("idle");start();return}
  start();
};
$("closeBtn").onclick=function(){end(false);LA.close()};
$("aCopy").onclick=function(){if(LAST){LA.copy(LAST);toast("복사했어요")}};
$("aApp").onclick=function(){LA.stopSpeak();LA.openApp()};
$("aStopRead").onclick=function(){LA.stopSpeak();set("idle");SESSION=false;setTimeout(arm,400)};
$("goApp").onclick=function(){LA.openApp()};
$("setBtn").onclick=function(){drawSheet();$("sheet").classList.remove("hide")};
$("sClose").onclick=function(){$("sheet").classList.add("hide")};
$("sheet").onclick=function(e){if(e.target===this)this.classList.add("hide")};
$("sAssist").onclick=function(){LA.assistantSettings()};
$("sWake").onchange=function(){LA.setSettings(JSON.stringify({jarvisWake:this.checked}));ST.jarvisWake=this.checked;if(this.checked)arm();else{disarm();set("idle")}};
$("sRead").onchange=function(){LA.setSettings(JSON.stringify({voiceRead:this.checked}));ST.voiceRead=this.checked};
[].forEach.call($("sRate").querySelectorAll("button"),function(b){b.onclick=function(){var v=+b.getAttribute("data-v");LA.setSettings(JSON.stringify({ttsRate:v}));ST.ttsRate=v;drawSheet();LA.speak("이 속도로 읽어 드릴게요.","rate")}});
function drawSheet(){
  $("sWake").checked=prefWake();$("sRead").checked=prefRead();
  var r=ST.ttsRate||1;[].forEach.call($("sRate").querySelectorAll("button"),function(b){b.classList.toggle("on",Math.abs(+b.getAttribute("data-v")-r)<0.01)});
}

// ---------- 앱에서 오는 알림 ----------
window.LAe=function(type,d){
  if(type==="voice")onVoice(d);
  else if(type==="wake")onWake(d);
  else if(type==="delta")onDelta(d);
  else if(type==="websearch"){if(d.state==="searching"){$("sub").textContent="인터넷에서 찾는 중이에요 · 네이버";$("pillT").textContent="NET · 검색 중"}else if(d.state==="found"){$("sub").textContent=d.count+"곳에서 찾았어요. 기기 안 AI가 읽는 중";$("pillT").textContent="THINKING · 기기 안"}else{$("sub").textContent="검색하지 못해 기기 안에서 답할게요"}}
  else if(type==="done"||type==="error")onDone(d);
  else if(type==="speak")onSpeak(d);
  else if(type==="voiceask"){SESSION=true;disarm();set("think");$("sub").textContent="받아 적는 중이에요"}
  else if(type==="mic"){if(d.granted)start();else toast("자비스와 말하려면 마이크 권한이 필요해요")}
  else if(type==="start"){drawInfo();if(d.how==="assist"&&INFO.ready)start();else{set("idle");setTimeout(arm,600)}}
  else if(type==="resume"){drawInfo();if(MODE==="idle"&&!SESSION)setTimeout(arm,400)}
  else if(type==="pause"){WAKE=false;if(MODE==="listen")set("idle")}
};
window.onBack=function(){
  if(!$("sheet").classList.contains("hide")){$("sheet").classList.add("hide");return true}
  if(SESSION||MODE!=="idle"){end(false);return true}
  return false;
};

drawInfo();set("idle");

// ---------- 화면 확인용 가짜 앱(demo) ----------
function mockLA(mode){
  var st={voiceRead:true,ttsRate:1,jarvisWake:true};
  var ans="파리는 프랑스의 수도예요. 센강을 따라 에펠탑과 루브르 박물관이 있고, 인구는 약 210만 명이에요. 여행을 계획 중이라면 봄이나 가을이 가장 좋아요.";
  function e(t,d,ms){setTimeout(function(){LAe(t,d)},ms||30)}
  if(mode==="listen")setTimeout(function(){SESSION=true;showYou("프랑스의 수도가 어디야?");LAe("voice",{state:"listening"});var n=0,iv=setInterval(function(){LAe("voice",{state:"level",level:0.35+Math.random()*0.6});if(++n>400)clearInterval(iv)},110)},80);
  if(mode==="idle")e("start",{how:"open"},60);
  if(mode==="answer")setTimeout(function(){SESSION=true;ask("프랑스의 수도가 어디야?");e("done",{text:ans},120);},80);
  return{
    info:function(){return JSON.stringify({ready:mode!=="nomodel",model:"Gemma 4 E4B",settings:st,debug:true})},
    run:function(){return "ok"},runWeb:function(){return "ok"},endChat:function(){},stop:function(){},busy:function(){return false},
    micOk:function(){return true},askMic:function(){},
    listen:function(){e("voice",{state:"listening"});return "ok"},stopListen:function(){},cancelListen:function(){},
    wake:function(){e("wake",{state:"armed"});return "ok"},stopWake:function(){},
    speak:function(t,id){e("speak",{state:"start",id:id})},stopSpeak:function(){},
    setSettings:function(j){var o=JSON.parse(j);for(var k in o)st[k]=o[k]},
    copy:function(){},openApp:function(){},assistantSettings:function(){},close:function(){}
  };
}
})();
