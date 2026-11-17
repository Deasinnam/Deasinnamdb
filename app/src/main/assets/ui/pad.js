/*
 * 덜누름 패드 화면: 버튼 판(탭) · 버튼(앱 열기) · 편집.
 * 앱(Java)은 window.Pad 로 앱 목록·아이콘·앱 열기·저장을 맡습니다. 브라우저에서 열면 가짜 Pad로 화면만 시험할 수 있습니다.
 */
(function () {
  "use strict";

  // ---------- 앱과 연결 (브라우저 시험용 가짜 포함) ----------
  var P = window.Pad || (function () {
    var mem = "";
    var fake = [["com.daesinnam.work", "덜누름 워크", "productivity"], ["com.android.chrome", "Chrome", ""], ["com.sec.android.app.myfiles", "내 파일", ""],
      ["com.samsung.android.app.notes", "Samsung Notes", "productivity"], ["com.kakao.talk", "카카오톡", "social"], ["com.google.android.youtube", "YouTube", "video"],
      ["com.android.settings", "설정", ""], ["com.spotify.music", "Spotify", "audio"], ["com.microsoft.office.word", "Word", "productivity"]];
    return {
      apps: function () { return JSON.stringify(fake.map(function (a) { return { pkg: a[0], cls: a[0] + ".Main", label: a[1], cat: a[2], system: false }; })); },
      icon: function () { return ""; },
      launch: function (p) { return JSON.stringify({ ok: true, external: true, display: 2 }); },
      displays: function () { return JSON.stringify({ here: 0, onPhone: true, external: true, targetId: 2, targetName: "DeX" }); },
      moveToPhone: function () {}, load: function () { return mem; }, save: function (s) { mem = s; },
      tap: function () {}, keepScreenOn: function () {}, version: function () { return "dev"; }, report: function (l) { console.log("REPORT " + l); }
    };
  })();
  var SELFTEST = /[?&]selftest\b/.test(location.search);
  function report(s) { try { P.report(s); } catch (e) {} }

  // ---------- 색 ----------
  var COLORS = {
    white:  { k: "#f4f4f5", ks: "#a1a1aa", kt: "#18181b", name: "흰색" },
    orange: { k: "#ff7a00", ks: "#c75a00", kt: "#ffffff", name: "주황" },
    blue:   { k: "#3b82f6", ks: "#1d4ed8", kt: "#ffffff", name: "파랑" },
    green:  { k: "#22c55e", ks: "#15803d", kt: "#ffffff", name: "초록" },
    purple: { k: "#8b5cf6", ks: "#6d28d9", kt: "#ffffff", name: "보라" },
    red:    { k: "#ef4444", ks: "#b91c1c", kt: "#ffffff", name: "빨강" },
    dark:   { k: "#3f3f46", ks: "#18181b", kt: "#f4f4f5", name: "검정" }
  };

  // ---------- 기본 판 ----------
  var BROWSERS = ["com.daesinnam.browser", "com.sec.android.app.sbrowser", "com.android.chrome", "com.naver.whale", "org.mozilla.firefox", "com.microsoft.emmx"];
  var DEFAULT_BOARDS = [
    { name: "자주 쓰는 앱", color: "white", pkgs: ["com.daesinnam.work", "com.daesinnam.browser", "com.sec.android.app.sbrowser", "com.android.chrome", "com.sec.android.app.myfiles",
      "com.samsung.android.app.notes", "com.sec.android.gallery3d", "com.samsung.android.calendar", "com.sec.android.app.popupcalculator", "com.kakao.talk",
      "com.google.android.youtube", "com.android.settings"], cats: [] },
    { name: "문서 · 업무", color: "blue", pkgs: ["com.daesinnam.work", "com.microsoft.office.officehubrow", "com.microsoft.office.word", "com.microsoft.office.excel",
      "com.microsoft.office.powerpoint", "com.microsoft.office.outlook", "com.microsoft.teams", "com.google.android.apps.docs.editors.docs",
      "com.google.android.apps.docs.editors.sheets", "com.google.android.apps.docs.editors.slides", "com.google.android.apps.docs", "notion.id", "com.Slack",
      "com.google.android.gm", "com.samsung.android.email.provider", "com.samsung.android.app.notes", "com.google.android.keep"], cats: ["productivity"] },
    { name: "인터넷 · 소통", color: "green", pkgs: BROWSERS.concat(["com.nhn.android.search", "com.kakao.talk", "com.samsung.android.messaging", "com.google.android.apps.messaging",
      "com.discord", "org.telegram.messenger", "com.instagram.android", "com.facebook.katana", "com.twitter.android", "jp.naver.line.android"]), cats: ["social", "news"] },
    { name: "미디어 · 게임", color: "purple", pkgs: ["com.google.android.youtube", "com.google.android.apps.youtube.music", "com.netflix.mediaclient", "com.spotify.music",
      "com.iloen.melon", "com.daesinnam.amp", "com.sec.android.gallery3d", "com.google.android.apps.photos", "com.daesinnam.game", "com.valvesoftware.steamlink"],
      cats: ["video", "audio", "image", "game"] }
  ];
  var MAX_DEFAULT = 12;

  var apps = [], appByKey = {}, appsByPkg = {};
  function loadApps() {
    try { apps = JSON.parse(P.apps()) || []; } catch (e) { apps = []; }
    apps.sort(function (a, b) { return a.label.localeCompare(b.label, "ko"); });
    appByKey = {}; appsByPkg = {};
    apps.forEach(function (a) { appByKey[a.pkg + "/" + a.cls] = a; if (!appsByPkg[a.pkg]) appsByPkg[a.pkg] = a; });
  }
  function findApp(k) { return appByKey[k.pkg + "/" + k.cls] || appsByPkg[k.pkg] || null; }

  var seq = Date.now();
  function uid(p) { seq += 1; return p + seq.toString(36); }

  function defaultState() {
    var boards = [];
    DEFAULT_BOARDS.forEach(function (d, bi) {
      var keys = [], used = {};
      function add(a) { if (!a || used[a.pkg] || keys.length >= MAX_DEFAULT) return; used[a.pkg] = 1; keys.push({ id: uid("k"), pkg: a.pkg, cls: a.cls, label: a.label, color: d.color }); }
      d.pkgs.forEach(function (p) { add(appsByPkg[p]); });
      if (d.cats.length) apps.forEach(function (a) { if (d.cats.indexOf(a.cat) >= 0) add(a); });
      if (bi === 0 && keys.length < 6) apps.forEach(function (a) { if (!a.system) add(a); });
      if (bi === 0 && keys.length < 6) apps.forEach(function (a) { add(a); });
      if (keys.length || bi === 0) boards.push({ id: uid("b"), name: d.name, keys: keys });
    });
    if (boards[0] && boards[0].keys[0]) boards[0].keys[0].color = "orange";
    return { v: 1, cur: 0, keepOn: true, boards: boards };
  }

  var state;
  function load() {
    var raw = "";
    try { raw = P.load(); } catch (e) {}
    try { state = raw ? JSON.parse(raw) : null; } catch (e) { state = null; }
    if (!state || !Array.isArray(state.boards) || !state.boards.length) state = defaultState();
    if (state.cur >= state.boards.length || state.cur < 0) state.cur = 0;
    if (typeof state.keepOn !== "boolean") state.keepOn = true;
  }
  function save() { try { P.save(JSON.stringify(state)); } catch (e) {} }

  // ---------- 아이콘 (한 번 받은 것은 기억) ----------
  var icons = {};
  function iconOf(pkg, cls) {
    var key = pkg + "/" + cls;
    if (icons[key] === undefined) { try { icons[key] = P.icon(pkg, cls) || ""; } catch (e) { icons[key] = ""; } }
    return icons[key];
  }
  function iconEl(pkg, cls) {
    var src = iconOf(pkg, cls);
    if (!src) { var d = document.createElement("div"); d.className = "ph"; return d; }
    var img = document.createElement("img"); img.alt = ""; img.src = src; return img;
  }

  // ---------- 화면 ----------
  var $ = function (id) { return document.getElementById(id); };
  var editing = false, disp = { external: false, onPhone: true };

  function toast(text) {
    var t = $("toast"); t.textContent = text; t.classList.add("show");
    clearTimeout(toast.tm); toast.tm = setTimeout(function () { t.classList.remove("show"); }, 2000);
  }

  function board() { return state.boards[state.cur]; }

  function renderTabs() {
    var tabs = $("tabs"); tabs.textContent = "";
    state.boards.forEach(function (b, i) {
      var t = document.createElement("button");
      t.type = "button"; t.className = "tab" + (i === state.cur ? " cur" : ""); t.textContent = b.name;
      t.addEventListener("click", function () {
        if (i === state.cur && editing) { openBoardSheet(i); return; }
        state.cur = i; save(); render();
      });
      tabs.appendChild(t);
    });
    if (editing) {
      var a = document.createElement("button");
      a.type = "button"; a.className = "tab add"; a.textContent = "+ 판";
      a.addEventListener("click", addBoard);
      tabs.appendChild(a);
    }
  }

  function keyStyle(el, color) {
    var c = COLORS[color] || COLORS.white;
    el.style.setProperty("--k", c.k); el.style.setProperty("--ks", c.ks); el.style.setProperty("--kt", c.kt);
  }

  function renderGrid() {
    var grid = $("grid"); grid.textContent = "";
    var b = board();
    b.keys.forEach(function (k, i) {
      var el = document.createElement("button");
      el.type = "button"; el.className = "key";
      var app = findApp(k);
      if (!app) el.classList.add("missing");
      keyStyle(el, k.color);
      el.appendChild(iconEl(k.pkg, app ? app.cls : k.cls));
      var s = document.createElement("span"); s.textContent = k.label || (app && app.label) || k.pkg; el.appendChild(s);
      bindKey(el, i);
      grid.appendChild(el);
    });
    if (editing || !b.keys.length) {
      var p = document.createElement("button");
      p.type = "button"; p.className = "key plus";
      p.innerHTML = "+<span>버튼 추가</span>";
      p.addEventListener("click", function () { pickApp(null, function (a) { addKey(a); }); });
      grid.appendChild(p);
    }
    $("hint").textContent = editing ? "버튼을 눌러 바꾸고, 판 이름을 눌러 판을 고칩니다." :
      (b.keys.length ? "버튼을 길게 누르면 바로 고칠 수 있습니다." : "");
  }

  function bindKey(el, i) {
    var timer = 0, longDone = false;
    el.addEventListener("pointerdown", function () {
      longDone = false; el.classList.add("down");
      timer = setTimeout(function () { longDone = true; el.classList.remove("down"); P.tap(); openKeySheet(i); }, 550);
    });
    function up() { clearTimeout(timer); el.classList.remove("down"); }
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    el.addEventListener("click", function () {
      if (longDone) return;
      if (editing) { openKeySheet(i); return; }
      press(board().keys[i]);
    });
  }

  function press(k) {
    try { P.tap(); } catch (e) {}
    var app = findApp(k);
    if (!app) { toast("이 앱이 설치되어 있지 않습니다. 길게 눌러 바꿔 주세요."); return; }
    var r = {};
    try { r = JSON.parse(P.launch(app.pkg, app.cls)); } catch (e) { r = { ok: false, error: String(e) }; }
    var name = k.label || app.label;
    if (!r.ok) toast(r.error || "열지 못했습니다");
    else if (r.external) toast("큰 화면에서 열었습니다 · " + name);
    else toast("열었습니다 · " + name);
    return r;
  }

  function renderStatus() {
    var st = $("status");
    st.className = "status" + (disp.external ? " on" : "");
    st.textContent = disp.external ? "큰 화면에 연결됨" : "이 화면에서 열림";
    $("moveBar").hidden = !!disp.onPhone || !disp.external;
  }

  function render() {
    document.body.classList.toggle("editing", editing);
    $("editBtn").textContent = editing ? "완료" : "편집";
    $("editBtn").classList.toggle("on", editing);
    renderTabs(); renderGrid(); renderStatus();
    $("keepState").textContent = state.keepOn ? "켬" : "끔";
  }

  // ---------- 고치기 ----------
  function addKey(a) {
    var b = board();
    b.keys.push({ id: uid("k"), pkg: a.pkg, cls: a.cls, label: a.label, color: "white" });
    save(); render(); toast("버튼을 넣었습니다 · " + a.label);
  }

  function moveItem(list, i, d) {
    var j = i + d;
    if (j < 0 || j >= list.length) return i;
    var t = list[i]; list[i] = list[j]; list[j] = t;
    return j;
  }

  function openSheet(build) {
    var box = $("sheetBox"); box.textContent = "";
    build(box);
    $("sheet").hidden = false;
    document.body.classList.add("sheet-open");
  }
  function closeSheet() { $("sheet").hidden = true; $("sheetBox").textContent = ""; document.body.classList.remove("sheet-open"); }
  $("sheet").addEventListener("click", function (e) { if (e.target === $("sheet")) closeSheet(); });

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function btn(text, cls, fn) { var b = el("button", "btn" + (cls ? " " + cls : ""), text); b.type = "button"; b.addEventListener("click", fn); return b; }

  function openKeySheet(i) {
    var b = board(), k = b.keys[i];
    if (!k) return;
    openSheet(function (box) {
      box.appendChild(el("h2", "", "버튼 고치기"));
      var row = el("div", "row");
      var app = findApp(k);
      row.appendChild(iconEl(k.pkg, app ? app.cls : k.cls));
      var info = el("div", "grow");
      info.appendChild(el("div", "", app ? app.label : "설치되지 않은 앱"));
      info.appendChild(el("div", "muted", k.pkg));
      row.appendChild(info);
      row.appendChild(btn("앱 바꾸기", "", function () {
        pickApp(k, function (a) { k.pkg = a.pkg; k.cls = a.cls; k.label = a.label; save(); render(); openKeySheet(i); });
      }));
      box.appendChild(row);

      box.appendChild(el("p", "lbl", "이름"));
      var name = el("input"); name.type = "text"; name.value = k.label || ""; name.maxLength = 20;
      name.addEventListener("input", function () { k.label = name.value.trim(); save(); renderGrid(); });
      box.appendChild(name);

      box.appendChild(el("p", "lbl", "색"));
      var sws = el("div", "swatches");
      Object.keys(COLORS).forEach(function (c) {
        var s = el("button", "sw" + ((k.color || "white") === c ? " cur" : "")); s.type = "button"; s.setAttribute("aria-label", COLORS[c].name);
        keyStyle(s, c);
        s.addEventListener("click", function () { k.color = c; save(); renderGrid(); openKeySheet(i); });
        sws.appendChild(s);
      });
      box.appendChild(sws);

      var bs = el("div", "btns");
      bs.appendChild(btn("← 앞으로", "", function () { var j = moveItem(b.keys, i, -1); save(); render(); openKeySheet(j); }));
      bs.appendChild(btn("뒤로 →", "", function () { var j = moveItem(b.keys, i, 1); save(); render(); openKeySheet(j); }));
      bs.appendChild(btn("지우기", "danger", function () { b.keys.splice(i, 1); save(); render(); closeSheet(); toast("버튼을 지웠습니다"); }));
      bs.appendChild(btn("완료", "main", closeSheet));
      box.appendChild(bs);
    });
  }

  function openBoardSheet(i) {
    var b = state.boards[i];
    openSheet(function (box) {
      box.appendChild(el("h2", "", "판 고치기"));
      box.appendChild(el("p", "lbl", "판 이름"));
      var name = el("input"); name.type = "text"; name.value = b.name; name.maxLength = 16;
      name.addEventListener("input", function () { b.name = name.value.trim() || "이름 없는 판"; save(); renderTabs(); });
      box.appendChild(name);
      box.appendChild(el("p", "lbl", " "));
      var bs = el("div", "btns");
      bs.appendChild(btn("← 앞으로", "", function () { state.cur = moveItem(state.boards, i, -1); save(); render(); openBoardSheet(state.cur); }));
      bs.appendChild(btn("뒤로 →", "", function () { state.cur = moveItem(state.boards, i, 1); save(); render(); openBoardSheet(state.cur); }));
      bs.appendChild(btn("판 지우기", "danger", function () {
        if (state.boards.length <= 1) { toast("판이 하나뿐이라 지울 수 없습니다"); return; }
        state.boards.splice(i, 1); state.cur = Math.max(0, i - 1); save(); render(); closeSheet(); toast("판을 지웠습니다");
      }));
      bs.appendChild(btn("완료", "main", closeSheet));
      box.appendChild(bs);
    });
  }

  function addBoard() {
    state.boards.push({ id: uid("b"), name: "내 판 " + (state.boards.length + 1), keys: [] });
    state.cur = state.boards.length - 1;
    if (!editing) editing = true;
    save(); render(); openBoardSheet(state.cur);
  }

  function pickApp(cur, done) {
    openSheet(function (box) {
      box.appendChild(el("h2", "", "앱 고르기"));
      var q = el("input"); q.type = "search"; q.placeholder = "앱 이름으로 찾기";
      box.appendChild(q);
      var list = el("div", "applist");
      box.appendChild(list);
      var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var row = e.target; io.unobserve(row);
          var ph = row.querySelector(".ph");
          if (ph) ph.replaceWith(iconEl(row.dataset.pkg, row.dataset.cls));
        });
      }, { root: $("sheetBox") }) : null;
      function draw() {
        list.textContent = "";
        var s = q.value.trim().toLowerCase();
        apps.filter(function (a) { return !s || a.label.toLowerCase().indexOf(s) >= 0 || a.pkg.indexOf(s) >= 0; }).forEach(function (a) {
          var r = el("button", "app" + (cur && cur.pkg === a.pkg ? " cur" : "")); r.type = "button";
          r.dataset.pkg = a.pkg; r.dataset.cls = a.cls;
          r.appendChild(el("div", "ph"));
          r.appendChild(el("span", "", a.label));
          r.addEventListener("click", function () { closeSheet(); done(a); });
          list.appendChild(r);
          if (io) io.observe(r); else r.querySelector(".ph").replaceWith(iconEl(a.pkg, a.cls));
        });
        if (!list.firstChild) list.appendChild(el("p", "muted", "찾는 앱이 없습니다."));
      }
      q.addEventListener("input", draw);
      draw();
    });
  }

  // ---------- 메뉴 ----------
  function showMenu(on) { $("menu").hidden = !on; }
  $("menuBtn").addEventListener("click", function (e) { e.stopPropagation(); showMenu($("menu").hidden); });
  document.addEventListener("click", function (e) { if (!$("menu").hidden && !$("menu").contains(e.target)) showMenu(false); });
  $("menu").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var act = b.dataset.act; showMenu(false);
    if (act === "keepon") { state.keepOn = !state.keepOn; save(); applyKeepOn(); render(); toast(state.keepOn ? "패드를 보는 동안 화면이 꺼지지 않습니다" : "화면 켜 두기를 껐습니다"); }
    else if (act === "addboard") addBoard();
    else if (act === "reset") {
      openSheet(function (box) {
        box.appendChild(el("h2", "", "기본 판으로 되돌릴까요?"));
        box.appendChild(el("p", "muted", "직접 만든 판과 버튼이 지워지고, 설치된 앱으로 기본 판을 다시 만듭니다."));
        var bs = el("div", "btns");
        bs.appendChild(btn("취소", "", closeSheet));
        bs.appendChild(btn("되돌리기", "danger", function () { loadApps(); state = defaultState(); save(); editing = false; render(); closeSheet(); toast("기본 판으로 되돌렸습니다"); }));
        box.appendChild(bs);
      });
    } else if (act === "about") {
      openSheet(function (box) {
        box.appendChild(el("h2", "", "덜누름 패드 " + P.version()));
        box.appendChild(el("p", "muted", "DeX나 외부 화면에 연결한 동안 휴대폰 화면을 버튼 판으로 씁니다. 버튼을 누르면 고른 앱이 큰 화면에서 열립니다. 큰 화면이 연결되어 있지 않으면 이 화면에서 엽니다."));
        box.appendChild(el("p", "muted", "버튼 판은 이 기기 안에만 저장되고, 인터넷을 쓰지 않습니다."));
        var bs = el("div", "btns"); bs.appendChild(btn("닫기", "main", closeSheet)); box.appendChild(bs);
      });
    }
  });
  $("editBtn").addEventListener("click", function () { editing = !editing; render(); });
  $("moveBtn").addEventListener("click", function () { P.moveToPhone(); });

  function applyKeepOn() { try { P.keepScreenOn(!!state.keepOn && !!disp.external); } catch (e) {} }

  // 앱(Java)에서 부름: 화면(디스플레이) 연결이 바뀌었을 때
  window.padDisplays = function (json) {
    try { disp = JSON.parse(json); } catch (e) { return; }
    renderStatus(); applyKeepOn();
  };
  // 앱(Java)에서 부름: 뒤로 가기. 열린 창을 닫았으면 true
  window.padBack = function () {
    if (!$("sheet").hidden) { closeSheet(); return true; }
    if (!$("menu").hidden) { showMenu(false); return true; }
    if (editing) { editing = false; render(); return true; }
    return false;
  };

  // ---------- 시작 ----------
  loadApps();
  load();
  save();
  try { disp = JSON.parse(P.displays()); } catch (e) {}
  render();
  applyKeepOn();
  // 다른 앱을 설치·삭제하고 돌아오면 목록을 다시 읽음
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { loadApps(); render(); } });

  // ---------- 자동 점검 (에뮬레이터) ----------
  if (SELFTEST) {
    setTimeout(function () {
      report("APPS " + apps.length);
      report("BOARDS " + state.boards.map(function (b) { return b.name + ":" + b.keys.length; }).join(","));
      report("DISPLAYS " + JSON.stringify(disp));
      report("KEYS-SHOWN " + document.querySelectorAll(".key:not(.plus)").length);
      // 편집 저장: 버튼 하나를 넣었다가 다시 읽어 확인
      var before = board().keys.length, settings = appsByPkg["com.android.settings"];
      if (settings) {
        addKey(settings);
        var again = JSON.parse(P.load());
        report("SAVE " + (again.boards[again.cur].keys.length === before + 1 ? "ok" : "fail"));
        var r = press(board().keys[board().keys.length - 1]);
        report("LAUNCH " + JSON.stringify(r));
      } else report("SAVE skip (설정 앱 없음)");
      report("DONE");
    }, 2500);
  }
})();
