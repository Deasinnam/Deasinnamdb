/* 덜누름 PC 런처 — 폰 화면: 연결 도우미 + 터치패드 */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  // 브라우저에서 미리 볼 때(안드로이드 밖)는 견본 값
  const A = window.Android || {
    status: () => JSON.stringify({ connected: true, id: 2, name: "HDMI 모니터", width: 1920, height: 1080, dpi: 160, hz: 60, decorated: false, desktopSetting: 0, freeformSetting: 0, desktopOn: -1, pointerSupported: true, pointerEnabled: false, pointerReady: false, shizukuInstalled: false, shizukuRunning: false, shizukuGranted: false, autoOpen: true, watching: true, overlay: false, speed: 1.6, version: "미리보기" }),
    openDesktop: () => "ok", setAutoOpen() {}, setSpeed() {}, shizukuConnect() {}, enableDesktopMode: () => "devopts", reboot: () => "noshizuku",
    openDevOptions() {}, openAbout() {}, openAccessibility() {}, openOverlay() {}, padOpen: () => "off",
    move() {}, click() {}, rightClick() {}, scroll() {}, dragStart() {}, dragEnd() {}, back() {}, position: () => "[]", type: () => "off", log() {}
  };
  const selftest = location.search.includes("selftest");
  const log = (s) => { try { A.log(s); } catch (e) {} };
  const parse = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
  let st = {};

  let toastTimer = 0;
  window.toast = (msg) => {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 2600);
  };

  // ---------- 연결 도우미 ----------
  function pill(el, text, kind) { el.textContent = text || ""; el.className = "pill" + (kind ? " " + kind : ""); }

  function render() {
    st = parse(A.status(), {});
    $("ver").textContent = st.version ? "v" + st.version : "";
    const on = !!st.connected;
    $("monCard").classList.toggle("on", on);
    $("monTitle").textContent = on ? "모니터 연결됨" : "모니터 연결 안 됨";
    $("monSub").textContent = on
      ? `${st.name || "외부 화면"} · ${st.width}×${st.height}${st.hz ? " · " + st.hz + "Hz" : ""}`
      : "USB-C 케이블(또는 허브)로 모니터를 꽂아 주세요.";
    const desk = st.decorated || st.desktopSetting === 1;
    if (!on) pill($("modeBadge"), "");
    else if (st.decorated) pill($("modeBadge"), "데스크톱 모드", "ok");
    else if (st.desktopSetting === 1) pill($("modeBadge"), "데스크톱 모드 켜짐 · 다시 시작 필요", "warn");
    else pill($("modeBadge"), "미러링 상태 · 데스크톱 모드 꺼짐", "warn");
    $("openBadge").hidden = !(on && st.desktopOn === st.id);
    $("openBtn").disabled = !on;

    pill($("p1"), on ? "확인됨" : "모니터를 꽂으면 확인", on ? "ok" : "");
    pill($("p2"), desk ? (st.decorated || !on ? "켜짐" : "켜짐 · 다시 시작") : st.desktopSetting === -1 ? "확인 못 함" : "꺼짐", desk ? "ok" : "warn");
    $("dmBtn").textContent = st.shizukuGranted ? "Shizuku로 바로 켜기" : !st.shizukuInstalled ? "Shizuku로 켜기 (설치 안내)" : !st.shizukuRunning ? "Shizuku 열어서 시작" : "Shizuku 허용하기";
    $("rebootBtn").hidden = !(st.shizukuGranted && st.desktopSetting === 1 && !st.decorated);

    if (!st.pointerSupported) pill($("p3"), "안드로이드 11 이상", "warn");
    else pill($("p3"), st.pointerEnabled ? "켜짐" : "꺼짐", st.pointerEnabled ? "ok" : "warn");
    $("a11yBtn").hidden = !st.pointerSupported;

    $("autoChk").checked = !!st.autoOpen;
    const instant = st.pointerEnabled || st.overlay;
    $("autoNote").textContent = !st.autoOpen
      ? "꺼 두면 모니터를 꽂은 뒤 위의 \"모니터에 PC 화면 열기\"를 눌러요."
      : instant ? "모니터를 꽂으면 PC 화면을 모니터에 바로 열어요. 알림에 \"모니터 연결\"이 떠 있어요."
        : "모니터를 꽂으면 알림의 \"모니터에 열기\"를 눌러 열어요. 바로 열리게 하려면 터치패드(3번)를 켜거나 아래를 허용하세요.";
    $("ovBtn").hidden = !st.autoOpen || instant;
    return st;
  }

  $("openBtn").onclick = () => {
    const r = A.openDesktop();
    toast(r === "ok" ? "모니터에 PC 화면을 열었어요" : r === "none" ? "모니터를 찾지 못했어요" : "열지 못했어요. 데스크톱 모드를 켜고 다시 시작해 보세요");
    setTimeout(render, 1500);
  };
  $("padBtn").onclick = () => openPad();
  $("dmBtn").onclick = () => {
    if (!st.shizukuGranted) {
      if (window.ShizukuGuide && (!st.shizukuInstalled || !st.shizukuRunning)) ShizukuGuide.open("pc", render);
      A.shizukuConnect();
      return;
    }
    const r = A.enableDesktopMode();
    toast(r === "ok" ? "켰어요. 휴대폰을 다시 시작하면 적용돼요" : "켜지 못했어요. 개발자 옵션에서 직접 켜 주세요");
    render();
  };
  $("devBtn").onclick = () => { if (!A.openDevOptions()) toast("먼저 빌드 번호를 7번 눌러 개발자 옵션을 켜 주세요"); };
  $("aboutLink").onclick = (e) => { e.preventDefault(); A.openAbout(); };
  $("rebootBtn").onclick = () => {
    if (!confirm("휴대폰을 지금 다시 시작할까요? 열려 있는 앱이 모두 닫혀요.")) return;
    const r = A.reboot();
    if (r !== "ok") toast("다시 시작하지 못했어요. 전원 단추로 다시 시작해 주세요");
  };
  $("a11yBtn").onclick = () => { A.openAccessibility(); toast("설치된 앱 › 덜누름 PC 런처 터치패드를 켜 주세요"); };
  $("autoChk").onchange = (e) => { A.setAutoOpen(e.target.checked); render(); };
  $("ovBtn").onclick = () => A.openOverlay();

  window.onNative = (what) => { if (what === "refresh") render(); };
  setInterval(() => { if ($("pad").hidden && !document.hidden) render(); }, 2500);

  // ---------- 터치패드 ----------
  const pad = $("padArea");
  let speed = 1.6;

  function padMessage(r) {
    const m = $("padMsg");
    const text = {
      off: "접근성에서 '덜누름 PC 런처 터치패드'를 켜야 쓸 수 있어요.",
      starting: "터치패드를 준비하는 중이에요. 잠시 후 다시 열어 주세요.",
      old: "터치패드는 안드로이드 11 이상에서 쓸 수 있어요.",
      nomonitor: "모니터가 연결되지 않았어요."
    }[r];
    m.hidden = !text;
    m.textContent = text || "";
  }

  function openPad() {
    $("home").hidden = true;
    $("pad").hidden = false;
    speed = st.speed || 1.6;
    $("speed").value = speed;
    const r = A.padOpen(true);
    padMessage(r);
    if (r === "off") A.openAccessibility();
    history.pushState({ pad: 1 }, "");
    return r;
  }
  function closePad() {
    if (dragLocked) toggleDragLock();
    A.padOpen(false);
    $("pad").hidden = true;
    $("home").hidden = false;
    $("kbd").hidden = true;
    $("bKbd").setAttribute("aria-pressed", "false");
    render();
  }
  $("padBack").onclick = () => history.back();
  window.addEventListener("popstate", () => { if (!$("pad").hidden) closePad(); });
  $("speed").oninput = (e) => { speed = parseFloat(e.target.value); A.setSpeed(speed); };

  // 손가락 움직임을 화면 그리기 박자마다 묶어 보냄
  let accX = 0, accY = 0, scX = 0, scY = 0, rafOn = false, lastScroll = 0;
  function flush() {
    rafOn = false;
    if (accX || accY) { A.move(accX, accY); accX = accY = 0; }
    const now = performance.now();
    if ((scX || scY) && now - lastScroll > 70) { A.scroll(scX, scY); scX = scY = 0; lastScroll = now; }
    if (scX || scY) kick();
  }
  function kick() { if (!rafOn) { rafOn = true; requestAnimationFrame(flush); } }

  const pts = new Map();
  let downAt = 0, moved = false, longFired = false, longTimer = 0, lastTapAt = 0, dragCandidate = false, dragging = false, two = false;
  const dpr = window.devicePixelRatio || 1;
  const mid = () => { let x = 0, y = 0; pts.forEach((p) => { x += p.x; y += p.y; }); return [x / pts.size, y / pts.size]; };
  let lastMid = null;

  pad.addEventListener("pointerdown", (e) => {
    pad.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    pad.classList.add("touching");
    $("padHint").hidden = true;
    if (pts.size === 1) {
      downAt = performance.now(); moved = false; longFired = false; two = false;
      dragCandidate = downAt - lastTapAt < 320;
      clearTimeout(longTimer);
      longTimer = setTimeout(() => {
        if (!moved && !dragCandidate && pts.size === 1) { longFired = true; A.rightClick(); if (navigator.vibrate) navigator.vibrate(18); }
      }, 550);
    } else if (pts.size === 2) {
      two = true; clearTimeout(longTimer); lastMid = mid();
    }
  });
  pad.addEventListener("pointermove", (e) => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size >= 2) {
      const m = mid();
      if (lastMid) { scX += (m[0] - lastMid[0]) * dpr * 2.4; scY += (m[1] - lastMid[1]) * dpr * 2.4; kick(); }
      lastMid = m;
      return;
    }
    if (two) return; // 두 손가락에서 한 손가락이 남은 경우 무시
    if (Math.abs(p.x - p.sx) + Math.abs(p.y - p.sy) > 8) {
      if (!moved) clearTimeout(longTimer);
      moved = true;
      if (dragCandidate && !dragging && !dragLocked) { dragging = true; A.dragStart(); }
    }
    // 빠르게 움직이면 더 멀리 (가속)
    const v = Math.hypot(dx, dy);
    const k = speed * dpr * (1 + Math.min(1.6, v / 18));
    accX += dx * k; accY += dy * k;
    kick();
  });
  function up(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size >= 1) { lastMid = pts.size >= 2 ? mid() : null; return; }
    pad.classList.remove("touching");
    clearTimeout(longTimer);
    const now = performance.now();
    if (dragging) { dragging = false; A.dragEnd(); lastTapAt = 0; return; }
    if (!two && !moved && !longFired && now - downAt < 350) {
      A.click();
      lastTapAt = dragCandidate ? 0 : now;
    }
    two = false;
  }
  pad.addEventListener("pointerup", up);
  pad.addEventListener("pointercancel", up);

  let dragLocked = false;
  function toggleDragLock() {
    dragLocked = !dragLocked;
    $("bDrag").setAttribute("aria-pressed", String(dragLocked));
    if (dragLocked) { A.dragStart(); toast("끄는 중이에요. 다시 누르면 놓아요"); }
    else A.dragEnd();
  }
  $("bLeft").onclick = () => A.click();
  $("bRight").onclick = () => A.rightClick();
  $("bDrag").onclick = toggleDragLock;
  $("bBack").onclick = () => A.back();
  $("bHome").onclick = () => { const r = A.openDesktop(); if (r !== "ok") toast("모니터를 찾지 못했어요"); };
  $("bKbd").onclick = () => {
    const k = $("kbd"), show = k.hidden;
    k.hidden = !show;
    $("bKbd").setAttribute("aria-pressed", String(show));
    if (show) setTimeout(() => $("kbdIn").focus(), 50);
  };
  function typeResult(r) {
    if (r === "none") toast("모니터에서 입력 칸을 먼저 클릭해 주세요");
    else if (r === "off") toast("접근성에서 터치패드를 켜 주세요");
    else if (r !== "ok") toast("넣지 못했어요");
    return r;
  }
  function send() {
    const v = $("kbdIn").value;
    if (!v) return;
    if (typeResult(A.type("text", v)) === "ok") $("kbdIn").value = "";
  }
  $("kSend").onclick = send;
  $("kbdIn").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); send(); } });
  $("kBs").onclick = () => typeResult(A.type("backspace", ""));
  $("kEnter").onclick = () => typeResult(A.type("enter", ""));

  render();

  // ---------- 자동 점검 (시험용 빌드) ----------
  if (selftest) {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await wait(1500);
      let s = render();
      log(`STATUS connected ${s.connected} id ${s.id} size ${s.width}x${s.height} decorated ${s.decorated} desktopSetting ${s.desktopSetting} pointer ${s.pointerEnabled}/${s.pointerReady} sdk ${s.sdk}`);
      log("SHOT-HOME");
      await wait(2500);
      const r = A.openDesktop();
      log(`OPEN ${r}`);
      let ok = false;
      for (let i = 0; i < 20 && !ok; i++) { await wait(500); s = parse(A.status(), {}); ok = s.desktopOn === s.id; }
      log(`DESKTOP-ON ${ok} display ${s.desktopOn}`);
      await wait(6000); // 모니터 바탕화면이 설정 앱을 창으로 띄우는 동안
      log("SHOT-MONITOR");
      await wait(2500);
      // 스크립트가 모니터에 점검 입력 칸 화면을 띄워 줌 → 거기에 누르기 · 끌기 · 넘기기 · 글자 넣기
      log("INPUT-READY");
      await wait(4000);
      const pr = openPad();
      log(`PAD ${pr}`);
      await wait(1200);
      const p0 = parse(A.position(), []);
      A.move(-5000, -5000);
      await wait(300);
      A.move(300, 200);
      await wait(400);
      const p1 = parse(A.position(), []);
      log(`POS from ${p0.join(",")} to ${p1.join(",")}`);
      A.click();
      await wait(1000);
      A.scroll(0, -200);
      await wait(800);
      A.dragStart();
      await wait(300);
      for (let i = 0; i < 6; i++) { A.move(25, 10); await wait(120); }
      A.dragEnd();
      await wait(1000);
      log("SHOT-PAD");
      await wait(2500);
      let tr = "none";
      for (let i = 0; i < 8 && tr !== "ok"; i++) { tr = A.type("text", "안녕 PC"); if (tr !== "ok") await wait(1000); }
      log(`TYPE text ${tr}`);
      log(`TYPE backspace ${A.type("backspace", "")}`);
      log(`TYPE text2 ${A.type("text", "!")}`);
      await wait(800);
      log("SHOT-TYPE");
      await wait(2500);
      closePad();
      log("DONE");
    })();
  }
})();
