/* 덜누름 덱스 화면: 바탕화면 아이콘 · 작업 표시줄 · 앱 서랍 · 메뉴 · 덱스 설정.
 * 기기 일(앱 띄우기 · 창 목록 · 시스템 설정)은 Android.* (MainActivity.Bridge) 가 맡습니다. */
(function () {
  "use strict";
  var A = window.Android || null;
  var $ = function (id) { return document.getElementById(id); };
  var BAR0 = 52;                                 // 작업 표시줄 높이(CSS 픽셀) — 창 자리 계산에 씀
  var SELFTEST = /selftest=1/.test(location.search);
  function log(s) { if (A) A.log(s); else console.log(s); }
  function J(s, d) { try { return JSON.parse(s); } catch (e) { return d; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function icon(a) { return "https://dex.local/icon?p=" + encodeURIComponent(a.pkg) + "&c=" + encodeURIComponent(a.cls || ""); }
  function key(a) { return a.pkg + "/" + a.cls; }
  function load(k, d) { var v = A ? A.load(k) : localStorage.getItem(k); return v ? J(v, d) : d; }
  function save(k, v) { var s = JSON.stringify(v); if (A) A.save(k, s); else localStorage.setItem(k, s); }

  window.Dex = window.Dex || {};
  var waits = {}, seq = 0;
  /** 뒤에서 끝나는 일(Shizuku 명령)을 기다림 */
  function call(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (resolve) {
      if (!A) { resolve(null); return; }
      var id = "r" + (++seq);
      waits[id] = resolve;
      A[fn].apply(A, [id].concat(args));
      setTimeout(function () { if (waits[id]) { delete waits[id]; resolve(null); } }, 8000);
    });
  }
  Dex.reply = function (id, json) { var w = waits[id]; delete waits[id]; if (w) w(J(json, null)); };

  var info = {}, apps = [], byKey = {}, running = [];
  var pins = { bar: null, desk: null };
  var wall = load("wall", "w1");
  var zoom = +load("zoom", 1) || 1;               // 덱스 화면 크기 (Shizuku 없이)
  var dens = null;                                // 화면 해상도 정보 (Shizuku)
  function barPx() { return Math.round(BAR0 * zoom); }
  function applyZoom() { document.documentElement.style.zoom = zoom === 1 ? "" : String(zoom); }

  function toast(t) { var e = $("toast"); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { e.hidden = true; }, 2800); }

  /* ───────── 처음 고정할 앱 (있는 것만) ───────── */
  var PREFER = [
    ["com.android.settings"],
    ["com.android.chrome", "com.daesinnam.browser", "org.mozilla.firefox", "com.microsoft.emmx", "com.sec.android.app.sbrowser", "com.android.browser"],
    ["com.google.android.documentsui", "com.google.android.apps.nbu.files", "com.android.fileexplorer", "com.mi.android.globalFileexplorer", "com.coloros.filemanager", "com.huawei.filemanager", "com.lenovo.FileBrowser2"],
    ["com.google.android.apps.photos", "com.android.gallery3d", "com.miui.gallery", "com.coloros.gallery3d"],
    ["com.google.android.youtube"], ["com.google.android.gm"], ["com.google.android.calendar", "com.android.calendar"],
    ["com.daesinnam.work"], ["com.daesinnam.localai"], ["com.daesinnam.game"]
  ];
  function defaults(n) {
    var out = [];
    PREFER.forEach(function (group) {
      for (var i = 0; i < group.length; i++) {
        var a = apps.filter(function (x) { return x.pkg === group[i]; })[0];
        if (a) { out.push(key(a)); break; }
      }
    });
    for (var i = 0; out.length < n && i < apps.length; i++) if (out.indexOf(key(apps[i])) < 0) out.push(key(apps[i]));
    return out.slice(0, n);
  }

  /* ───────── 그리기 ───────── */
  function loadAll() {
    info = A ? J(A.info(), {}) : { display: 0, displays: [{ id: 0, main: true, here: true, w: 2560, h: 1600 }], freeform: false, settings: {}, shizuku: {}, sdk: 34 };
    apps = A ? J(A.apps(), []) : [];
    byKey = {}; apps.forEach(function (a) { byKey[key(a)] = a; });
    pins.bar = load("pinsBar", null) || defaults(6);
    pins.desk = load("pinsDesk", null) || defaults(10);
    pins.bar = pins.bar.filter(function (k) { return byKey[k]; });
    pins.desk = pins.desk.filter(function (k) { return byKey[k]; });
    $("wall").className = wall === "w1" ? "" : wall;
    renderDesk(); renderBar(); renderDrawer(); renderMonitor(); renderHint(); status();
  }
  function renderDesk() {
    $("icons").innerHTML = pins.desk.map(function (k, i) {
      var a = byKey[k];
      return '<li><button type="button" data-k="' + esc(k) + '" data-src="desk"><img src="' + icon(a) + '" alt=""><span>' + esc(a.label) + "</span></button></li>";
    }).join("");
  }
  function renderBar() {
    var html = [];
    var runKeys = {};
    running.forEach(function (t) { runKeys[t.pkg] = t; });
    pins.bar.forEach(function (k) {
      var a = byKey[k], t = runKeys[a.pkg];
      html.push('<li><button type="button" class="' + (t ? "run" + (t.visible ? " front" : "") : "") + '" data-k="' + esc(k) + '" data-src="bar"' + (t ? ' data-task="' + t.task + '"' : "") + ' aria-label="' + esc(a.label) + (t ? " (열림)" : "") + '"><img src="' + icon(a) + '" alt=""></button></li>');
    });
    running.forEach(function (t) {
      if (pins.bar.some(function (k) { return byKey[k] && byKey[k].pkg === t.pkg; })) return;
      var a = { pkg: t.pkg, cls: t.cls, label: t.label };
      html.push('<li><button type="button" class="run' + (t.visible ? " front" : "") + '" data-k="' + esc(key(a)) + '" data-src="task" data-task="' + t.task + '" aria-label="' + esc(t.label) + ' (열림)"><img src="' + icon(a) + '" alt=""></button></li>');
    });
    $("tasks").innerHTML = html.join("");
  }
  function renderDrawer() {
    var q = $("search").value.trim().toLowerCase();
    var list = apps.filter(function (a) { return !q || a.label.toLowerCase().indexOf(q) >= 0 || a.pkg.indexOf(q) >= 0; });
    $("appGrid").innerHTML = list.map(function (a) {
      return '<li><button type="button" data-k="' + esc(key(a)) + '" data-src="drawer"><img src="' + icon(a) + '" alt="" loading="lazy"><span>' + esc(a.label) + "</span></button></li>";
    }).join("");
    $("appCount").textContent = "앱 " + list.length + "개" + (q ? " · '" + q + "' 검색" : "");
  }
  function others() { return (info.displays || []).filter(function (d) { return !d.here; }); }
  function renderMonitor() {
    var o = others();
    $("monitorBtn").hidden = !o.length;
    $("monitorLabel").textContent = info.monitor ? "모니터 화면" : "모니터 연결됨";
  }
  function renderHint() {
    var h = $("hint");
    var need = !info.freeform || (!info.monitor && !info.defaultHome);
    if (!need || load("hintOff", false) || info.monitor) { h.hidden = true; return; }
    h.hidden = false;
    h.innerHTML = "<b>덱스를 켜 볼까요?</b><br>" + (!info.freeform ? "이 태블릿은 아직 앱을 <b>창</b>으로 띄울 수 없어요. " : "") +
      (!info.defaultHome ? "덜누름 덱스를 <b>홈 앱</b>으로 고르면 홈 단추를 눌렀을 때 바로 이 화면이 나와요. " : "") +
      '<div class="btns" style="margin-top:10px"><button type="button" class="btn primary" data-act="setup">덱스 설정 열기</button><button type="button" class="btn" data-act="hintOff">다음에</button></div>';
  }
  function clock() {
    var d = new Date();
    $("time").textContent = d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
    $("date").textContent = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  }
  function status() {
    var s = A ? J(A.status(), {}) : { battery: 76, wifi: true, online: true };
    var p = s.battery == null ? -1 : s.battery;
    $("batIcon").innerHTML = '<i style="width:' + Math.max(0, Math.min(100, p)) * 0.17 + 'px"></i>';
    $("batIcon").className = "bat" + (s.charging ? " chg" : "");
    $("batText").textContent = p >= 0 ? p + "%" : "";
    $("netIcon").innerHTML = s.wifi ? '<svg viewBox="0 0 24 24"><path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/></svg>'
      : s.online ? '<svg viewBox="0 0 24 24"><path d="M4 20h3v-4H4zM10 20h3v-8h-3zM16 20h3V8h-3z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M4 4l16 16M2 9a15 15 0 0 1 6-3.3M22 9a15 15 0 0 0-9.5-3.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  /* ───────── 열린 창 (Shizuku가 허락됐을 때) ───────── */
  var polling = false;
  async function pollTasks() {
    if (polling || !(info.shizuku && info.shizuku.granted) || document.hidden) return;
    polling = true;
    var t = await call("tasks");
    polling = false;
    if (t) { running = t; renderBar(); }
  }

  /* ───────── 앱 열기 ───────── */
  function openApp(a, mode, where) {
    mode = mode || (info.freeform ? "window" : "full");
    var r = A ? J(A.launch(a.pkg, a.cls, mode, where || "here", barPx()), {}) : { ok: true };
    log("LAUNCH " + a.pkg + " " + JSON.stringify(r));
    if (r && r.ok === false) toast("열지 못했어요: " + a.label);
    else if (mode !== "full" && r && !r.freeform && !load("ffWarned", false)) {
      toast("창 모드가 꺼져 있어 전체 화면으로 열었어요 · 덱스 설정에서 켤 수 있어요");
      save("ffWarned", true);
    }
    closeAll();
    setTimeout(pollTasks, 1200);
  }

  /* ───────── 메뉴 ───────── */
  function menu(x, y, title, items) {
    var m = $("menu");
    m.innerHTML = (title ? '<div class="mt">' + esc(title) + "</div>" : "") + items.map(function (it, i) {
      if (it === "-") return "<hr>";
      return '<button type="button" role="menuitem" data-i="' + i + '"' + (it.off ? " disabled" : "") + "><i>" + (it.ic || "") + "</i>" + esc(it.t) + "</button>";
    }).join("");
    m.hidden = false;
    var w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.max(6, Math.min(x, innerWidth - w - 6)) + "px";
    m.style.top = Math.max(6, Math.min(y, innerHeight - h - 6)) + "px";
    m.onclick = function (e) {
      var b = e.target.closest("button[data-i]"); if (!b) return;
      var it = items[+b.getAttribute("data-i")]; m.hidden = true; if (it && it.fn) it.fn();
    };
    var f = m.querySelector("button:not([disabled])"); if (f) f.focus();
  }
  function appMenu(k, src, x, y, task) {
    var a = byKey[k] || (function () { var p = k.split("/"); return { pkg: p[0], cls: p[1], label: p[0] }; })();
    var onBar = pins.bar.indexOf(k) >= 0, onDesk = pins.desk.indexOf(k) >= 0, other = others()[0];
    var ff = info.freeform;
    var items = [
      { t: "창으로 열기", ic: "▢", off: !ff, fn: function () { openApp(a, "window"); } },
      { t: "전체 화면으로 열기", ic: "⛶", fn: function () { openApp(a, "full"); } },
      { t: "왼쪽 절반에", ic: "◧", off: !ff, fn: function () { openApp(a, "left"); } },
      { t: "오른쪽 절반에", ic: "◨", off: !ff, fn: function () { openApp(a, "right"); } }
    ];
    if (other) items.push({ t: info.monitor ? "태블릿 화면에서 열기" : "모니터에서 열기", ic: "⇱", fn: function () { openApp(a, ff ? "max" : "full", "other"); } });
    if (task != null && info.shizuku && info.shizuku.granted) {
      items.push("-");
      items.push({ t: "이 창: 왼쪽 절반", ic: "◧", fn: function () { taskDo(task, "left"); } });
      items.push({ t: "이 창: 오른쪽 절반", ic: "◨", fn: function () { taskDo(task, "right"); } });
      items.push({ t: "이 창: 크게", ic: "□", fn: function () { taskDo(task, "max"); } });
      items.push({ t: "이 창: 가운데 창으로", ic: "▢", fn: function () { taskDo(task, "window"); } });
      items.push({ t: "이 창 닫기", ic: "✕", fn: function () { taskDo(task, "close"); } });
    }
    if (byKey[k]) {
      items.push("-");
      items.push({ t: onBar ? "작업 표시줄에서 고정 해제" : "작업 표시줄에 고정", ic: "•", fn: function () { toggle("bar", k); } });
      items.push({ t: onDesk ? "바탕화면에서 빼기" : "바탕화면에 추가", ic: "•", fn: function () { toggle("desk", k); } });
      items.push({ t: "앱 정보", ic: "i", fn: function () { if (A) A.appInfo(a.pkg); } });
      if (!a.sys) items.push({ t: "제거", ic: "⌫", fn: function () { if (A) A.uninstall(a.pkg); } });
    }
    menu(x, y, a.label, items);
  }
  async function taskDo(task, action) {
    var r = await call("taskAction", task, action, barPx());
    if (!r || !r.ok) toast("창을 옮기지 못했어요" + (r && r.need === "shizuku" ? " · Shizuku 연결이 필요해요" : ""));
    setTimeout(pollTasks, 600);
  }
  function toggle(where, k) {
    var list = pins[where], i = list.indexOf(k);
    if (i >= 0) list.splice(i, 1); else list.push(k);
    save(where === "bar" ? "pinsBar" : "pinsDesk", list);
    renderDesk(); renderBar();
  }
  function deskMenu(x, y) {
    menu(x, y, "바탕화면", [
      { t: "배경: 남색", ic: wall === "w1" ? "✓" : "", fn: function () { setWall("w1"); } },
      { t: "배경: 노을", ic: wall === "w2" ? "✓" : "", fn: function () { setWall("w2"); } },
      { t: "배경: 숲", ic: wall === "w3" ? "✓" : "", fn: function () { setWall("w3"); } },
      { t: "배경: 회색", ic: wall === "w4" ? "✓" : "", fn: function () { setWall("w4"); } },
      "-",
      { t: "덱스 설정", ic: "⚙", fn: openSetup },
      { t: "안드로이드 설정", ic: "⚙", fn: function () { if (A) A.openSettings(); } }
    ]);
  }
  function setWall(w) { wall = w; save("wall", w); $("wall").className = w === "w1" ? "" : w; }

  /* ───────── 패널 열고 닫기 ───────── */
  function closeAll() { $("drawer").hidden = true; $("menu").hidden = true; $("drawerBtn").classList.remove("on"); }
  function toggleDrawer(force) {
    var open = force != null ? force : $("drawer").hidden;
    $("menu").hidden = true;
    $("drawer").hidden = !open;
    $("drawerBtn").classList.toggle("on", open);
    if (open) { $("search").value = ""; renderDrawer(); setTimeout(function () { $("search").focus(); }, 50); }
  }
  Dex.back = function () {
    if (!$("menu").hidden) { $("menu").hidden = true; return; }
    if (!$("setup").hidden) { $("setup").hidden = true; return; }
    closeAll();
  };
  Dex.event = function (e) {
    if (e === "key:meta") toggleDrawer();
    else if (e === "home") { closeAll(); $("setup").hidden = true; }
    else if (e === "apps") loadAll();
    else if (e === "displays" || e === "resume" || e === "setup") {
      var keepSetup = !$("setup").hidden;
      info = A ? J(A.info(), info) : info;
      renderMonitor(); renderHint(); status();
      if (keepSetup) renderSetup();
      pollTasks();
    }
  };

  /* ───────── 누르기 · 길게 누르기 · 오른쪽 클릭 ───────── */
  var pressT = null, longFired = false;
  function target(e) { return e.target.closest("button[data-k]"); }
  document.addEventListener("pointerdown", function (e) {
    var b = target(e); longFired = false;
    if (!b || e.pointerType === "mouse") return;
    pressT = setTimeout(function () {
      longFired = true;
      var r = b.getBoundingClientRect();
      appMenu(b.getAttribute("data-k"), b.getAttribute("data-src"), r.left, r.top - 8 - 260 < 0 ? r.bottom : r.top - 260, b.getAttribute("data-task") ? +b.getAttribute("data-task") : null);
    }, 480);
  });
  ["pointerup", "pointercancel", "pointermove"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (ev !== "pointermove" || Math.abs(e.movementX) + Math.abs(e.movementY) > 6) clearTimeout(pressT); });
  });
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    var b = target(e);
    if (b) appMenu(b.getAttribute("data-k"), b.getAttribute("data-src"), e.clientX, e.clientY, b.getAttribute("data-task") ? +b.getAttribute("data-task") : null);
    else if (e.target.closest("#desk")) deskMenu(e.clientX, e.clientY);
  });
  document.addEventListener("click", function (e) {
    if (longFired) { longFired = false; return; }
    if (!e.target.closest("#menu")) $("menu").hidden = true;
    var act = e.target.closest("[data-act]");
    if (act) {
      var a0 = act.getAttribute("data-act");
      if (a0 === "setup") openSetup();
      else if (a0 === "hintOff") { save("hintOff", true); renderHint(); }
      return;
    }
    var b = target(e);
    if (b) {
      var k = b.getAttribute("data-k"), a = byKey[k];
      if (!a) { var p = k.split("/"); a = { pkg: p[0], cls: p[1], label: p[0] }; }
      openApp(a);
      return;
    }
    if (!e.target.closest("#drawer") && !e.target.closest("#drawerBtn")) toggleDrawer(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") Dex.back();
    if (e.key === "Enter" && !$("drawer").hidden) { var f = $("appGrid").querySelector("button"); if (f) f.click(); }
  });
  $("drawerBtn").addEventListener("click", function (e) { e.stopPropagation(); toggleDrawer(); });
  $("search").addEventListener("input", renderDrawer);
  $("recentsBtn").addEventListener("click", function () {
    if (info.shizuku && info.shizuku.granted) A.recents(); else toast("최근 앱 단추는 Shizuku 연결이 필요해요 (덱스 설정)");
  });
  $("notiBtn").addEventListener("click", function () { if (A) A.notifications(); });
  $("qsBtn").addEventListener("click", function () { if (A) A.quickSettings(); });
  $("setupBtn").addEventListener("click", openSetup);
  $("drawerSetup").addEventListener("click", function () { closeAll(); openSetup(); });
  $("drawerSettings").addEventListener("click", function () { closeAll(); if (A) A.openSettings(); });
  $("monitorBtn").addEventListener("click", function () {
    var o = others()[0];
    toast(o ? (info.monitor ? "태블릿 화면이 따로 있어요 · 앱 메뉴에서 '태블릿 화면에서 열기'" : "모니터 " + o.w + "×" + o.h + " 연결됨 · 앱 메뉴에서 '모니터에서 열기'") : "연결된 모니터 없음");
  });
  $("setupClose").addEventListener("click", function () { $("setup").hidden = true; });

  /* ───────── 덱스 설정 ───────── */
  function openSetup() {
    closeAll(); info = A ? J(A.info(), info) : info; renderSetup(); $("setup").hidden = false;
    if (info.shizuku && info.shizuku.granted) call("densityInfo").then(function (d) { if (d) { dens = d; renderSetup(); } });
  }
  function densBase() { return (dens && dens.physical) || info.dpiBase || (dens && dens.current) || info.dpi || 320; }
  var RES = [["기본", 1], ["넓게", 0.85], ["더 넓게", 0.75], ["가장 넓게", 0.65]];
  function resCard(canCmd) {
    var cur = (dens && dens.current) || info.dpi, base = densBase();
    var zs = [["작게", 0.85], ["보통", 1], ["크게", 1.15]];
    var h = '<div class="card"><div class="row"><h3>해상도 · 화면 크기</h3><span class="state ok">' + cur + ' dpi</span></div>' +
      "<p><b>화면 해상도</b>를 넓히면 PC처럼 글자와 아이콘이 작아지고 한 화면에 창을 더 많이 띄울 수 있어요. 모든 앱에 적용되고, 다시 시작하지 않아도 바로 바뀌어요.</p>";
    if (canCmd) {
      h += '<div class="btns">' + RES.map(function (r) {
        var dpi = Math.round(base * r[1] / 4) * 4, on = Math.abs(cur - dpi) <= 4;
        return '<button type="button" class="btn' + (on ? " primary" : "") + '" data-res="' + (r[1] === 1 ? 0 : dpi) + '">' + r[0] + " · " + dpi + "</button>";
      }).join("") + "</div>" + (others().length ? '<p class="small">지금 보고 있는 화면(' + (info.monitor ? "모니터" : "태블릿") + ")에만 적용돼요. 모니터는 모니터 화면의 덱스 설정에서 따로 바꿔요.</p>" : "");
    } else {
      h += "<ol><li>설정 → 디스플레이 → <b>화면 크기</b>(디스플레이 크기)를 가장 작게</li><li>더 넓게 쓰려면 개발자 옵션 → <b>최소 너비</b> 값을 키우기 (예: 800 → 1100)</li></ol>" +
        '<p class="small">Shizuku를 연결하면 이 카드에서 단추 하나로 바꿀 수 있어요.</p>';
    }
    h += '<p style="margin-top:12px"><b>덱스 화면 크기</b> — 바탕화면 · 작업 표시줄만 키우거나 줄여요 (Shizuku 없이도 됨)</p><div class="btns">' +
      zs.map(function (z) { return '<button type="button" class="btn' + (zoom === z[1] ? " primary" : "") + '" data-zoom="' + z[1] + '">' + z[0] + "</button>"; }).join("") + "</div></div>";
    return h;
  }
  function st(ok, wait) { return '<span class="state ' + (ok ? "ok" : wait ? "wait" : "no") + '">' + (ok ? "켜짐" : wait ? "다시 시작 필요" : "꺼짐") + "</span>"; }
  var pendingRestart = load("pendingRestart", {});
  function renderSetup() {
    var s = info.settings || {}, sh = info.shizuku || {}, canCmd = !!sh.granted;
    $("setupSub").textContent = (info.model || "") + " · 안드로이드 " + (info.android || "") + " · " + (info.monitor ? "모니터 화면 #" + info.display : "태블릿 화면");
    var ff = !!info.freeform, ffSet = s.enable_freeform_support === 1;
    var mon = s.force_desktop_mode_on_external_displays === 1;
    var html = [];
    html.push('<div class="card"><div class="row"><h3>Shizuku 연결</h3>' + (sh.granted ? st(true) : '<span class="state no">' + (sh.running ? "허락 필요" : sh.installed ? "꺼져 있음" : "설치 안 됨") + "</span>") + "</div>" +
      "<p>Shizuku는 무료 공개 앱입니다. 무선 디버깅으로 한 번 켜 두면 덜누름 덱스가 숨은 창 설정을 켜고, 열린 창을 옮기고, 최근 앱 · 알림을 열 수 있어요. 루팅은 필요 없어요.</p>" +
      (sh.granted ? "" : '<div class="btns"><button type="button" class="btn primary" data-s="shizuku">' + (sh.running ? "덜누름 덱스 허락하기" : sh.installed ? "Shizuku 열기" : "Shizuku 설치하기") + "</button></div>") + "</div>");
    html.push(resCard(canCmd));
    html.push('<div class="card"><div class="row"><h3>① 앱을 창으로 띄우기 (자유 창)</h3>' + st(ff, ffSet && !ff || pendingRestart.ff) + "</div>" +
      "<p>덱스처럼 앱을 크기 조절되는 창으로 띄우고, 왼쪽 · 오른쪽 절반에 나란히 놓을 수 있어요.</p>" +
      (canCmd ? '<div class="btns"><button type="button" class="btn primary" data-s="ff-on">' + (ffSet ? "다시 켜기" : "켜기") + '</button>' + (ffSet ? '<button type="button" class="btn" data-s="ff-off">끄기</button>' : "") + "</div>"
        : "<ol><li>설정 → 휴대전화(태블릿) 정보 → <b>빌드 번호</b>를 일곱 번 눌러 개발자 옵션 켜기</li><li>개발자 옵션 → <b>자유 형식 창 사용</b>(Enable freeform windows) 켜기</li><li>개발자 옵션 → <b>앱 크기 조정 강제 허용</b>(Force activities to be resizable) 켜기</li><li>태블릿 다시 시작</li></ol>" +
          '<div class="btns"><button type="button" class="btn" data-s="dev">개발자 옵션 열기</button></div>') + "</div>");
    html.push('<div class="card"><div class="row"><h3>② 외부 모니터를 따로 쓰는 데스크톱</h3>' + st(mon && !pendingRestart.mon, pendingRestart.mon) + "</div>" +
      "<p>USB-C 케이블로 모니터를 연결하면 태블릿 화면은 그대로 두고 모니터에 덜누름 덱스 데스크톱이 따로 떠요. 키보드 · 마우스를 연결해 PC처럼 쓰세요. <b>태블릿이 USB-C 영상 출력(DP Alt 모드)을 지원해야</b> 합니다.</p>" +
      (canCmd ? '<div class="btns"><button type="button" class="btn primary" data-s="mon-on">' + (mon ? "다시 켜기" : "켜기") + '</button>' + (mon ? '<button type="button" class="btn" data-s="mon-off">끄기</button>' : "") + "</div>"
        : "<ol><li>개발자 옵션 → <b>보조 디스플레이에서 데스크톱 모드 강제 사용</b>(Force desktop mode) 켜기</li><li>태블릿 다시 시작 → 모니터 연결</li><li>모니터에 '홈 앱 고르기'가 뜨면 덜누름 덱스 고르기</li></ol>" +
          '<div class="btns"><button type="button" class="btn" data-s="dev">개발자 옵션 열기</button></div>') + "</div>");
    if (pendingRestart.ff || pendingRestart.mon || (ffSet && !ff)) {
      html.push('<div class="card"><div class="row"><h3>다시 시작하면 적용돼요</h3></div><p>창 설정은 태블릿을 다시 시작해야 켜지는 경우가 많아요.</p><div class="btns">' +
        (canCmd ? '<button type="button" class="btn primary" data-s="reboot">지금 다시 시작</button>' : "") + "</div></div>");
    }
    html.push('<div class="card"><div class="row"><h3>③ 홈 앱으로 쓰기</h3>' + st(!!info.defaultHome) + "</div><p>홈 단추를 누르면 덜누름 덱스 바탕화면이 나와요. 원래 홈으로 돌아가려면 같은 곳에서 다시 고르면 돼요.</p>" +
      (info.defaultHome ? "" : '<div class="btns"><button type="button" class="btn" data-s="home">홈 앱 고르기</button></div>') + "</div>");
    html.push('<div class="card"><div class="row"><h3>연결된 화면</h3></div><div class="displays">' + (info.displays || []).map(function (d) {
      return '<span class="disp">' + (d.main ? "태블릿" : "화면 #" + d.id) + " · " + d.w + "×" + d.h + (d.here ? " · <b>지금 여기</b>" : "") + "</span>";
    }).join("") + "</div><p class=\"small\">덜누름 덱스 " + esc(info.version || "") + " · 인터넷 권한 없음 · 설정은 이 기기 안에만 저장</p></div>");
    $("setupBody").innerHTML = html.join("");
  }
  $("setupBody").addEventListener("click", async function (e) {
    var z = e.target.closest("[data-zoom]");
    if (z) { zoom = +z.getAttribute("data-zoom"); save("zoom", zoom); applyZoom(); renderSetup(); return; }
    var rb = e.target.closest("[data-res]");
    if (rb && A) {
      toast("해상도를 바꾸는 중…");
      var d = await call("density", +rb.getAttribute("data-res"));
      if (d) { dens = d; toast(d.ok ? "해상도를 " + d.current + " dpi로 바꿨어요" : "해상도를 바꾸지 못했어요"); }
      renderSetup(); return;
    }
    var b = e.target.closest("[data-s]"); if (!b || !A) return;
    var s = b.getAttribute("data-s");
    if (s === "shizuku") A.requestShizuku();
    else if (s === "dev") A.openDevOptions();
    else if (s === "home") A.openHomeSettings();
    else if (s === "reboot") { toast("다시 시작합니다"); A.reboot(); }
    else if (s === "ff-on" || s === "ff-off") {
      var on = s === "ff-on", ok = true;
      var keys = ["enable_freeform_support", "force_resizable_activities"].concat(info.sdk >= 31 ? ["enable_non_resizable_multi_window"] : []);
      for (var i = 0; i < keys.length; i++) { var r = await call("setting", keys[i], on); ok = ok && r && r.ok; }
      pendingRestart.ff = true; save("pendingRestart", pendingRestart);
      toast(ok ? (on ? "자유 창을 켰어요 · 다시 시작하면 적용돼요" : "자유 창을 껐어요") : "설정을 바꾸지 못했어요");
    } else if (s === "mon-on" || s === "mon-off") {
      var r2 = await call("setting", "force_desktop_mode_on_external_displays", s === "mon-on");
      pendingRestart.mon = true; save("pendingRestart", pendingRestart);
      toast(r2 && r2.ok ? "모니터 데스크톱 모드를 바꿨어요 · 다시 시작하면 적용돼요" : "설정을 바꾸지 못했어요");
    }
    info = J(A.info(), info); renderSetup();
  });

  /* ───────── 시작 ───────── */
  // 다시 시작해서 설정이 실제로 켜졌으면 "다시 시작 필요" 표시를 지움
  applyZoom();
  loadAll();
  if (info.freeform) { pendingRestart.ff = false; }
  if ((info.settings || {}).force_desktop_mode_on_external_displays === 1 && others().length && info.monitor) pendingRestart.mon = false;
  save("pendingRestart", pendingRestart);
  clock(); setInterval(clock, 15000);
  setInterval(status, 30000);
  setInterval(pollTasks, 2500);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { status(); pollTasks(); } });

  if (SELFTEST) {
    log("READY " + JSON.stringify(info) + " apps=" + apps.length);
    setTimeout(function () {
      log("SHOT-DESK");
      setTimeout(function () {
        toggleDrawer(true); log("SHOT-DRAWER");
        setTimeout(function () {
          closeAll(); openSetup(); log("SHOT-SETUP");
          setTimeout(function () {
            $("setup").hidden = true;
            var st0 = apps.filter(function (a) { return a.pkg === "com.android.settings"; })[0] || apps[0];
            var b = document.querySelector('#icons button'); if (b) { var r = b.getBoundingClientRect(); appMenu(b.getAttribute("data-k"), "desk", r.right, r.top, null); log("SHOT-MENU"); }
            setTimeout(function () {
              $("menu").hidden = true;
              if (st0) openApp(st0, "window");
              setTimeout(async function () {
                var o = others()[0];
                var cal = apps.filter(function (a) { return a.pkg !== (st0 && st0.pkg); })[0];
                if (o && cal) openApp(cal, "max", "other");
                log("SHOT-WINDOW");
                var t = await call("tasks"); log("TASKS " + JSON.stringify(t));
                setTimeout(function () { log("DONE"); }, 3000);
              }, 4000);
            }, 2500);
          }, 2500);
        }, 2500);
      }, 1500);
    }, 1500);
  }
})();
