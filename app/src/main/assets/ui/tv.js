/* 덜누름 TV — 화면.
   window.TV(안드로이드)가 앱 목록 · 아이콘 · 앱 열기 · 볼륨을 줍니다. 브라우저에서 열면 가짜 TV로 화면만 시험합니다. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var SELFTEST = /selftest/.test(location.search);

  // ---------- 안드로이드 연결 (브라우저에서는 가짜) ----------
  var P = window.TV || (function () {
    var mem = "", vol = { cur: 9, max: 15, muted: false };
    var fake = [
      ["com.netflix.mediaclient", "Netflix", "video"], ["com.google.android.youtube", "YouTube", "video"], ["com.spotify.music", "Spotify", "audio"],
      ["kr.co.captv.pooqV2", "wavve", "video"], ["com.coupang.mobile.play", "쿠팡플레이", "video"], ["com.google.android.apps.youtube.music", "YouTube Music", "audio"],
      ["com.sec.android.gallery3d", "갤러리", "image"], ["com.android.chrome", "Chrome", ""], ["com.daesinnam.work", "덜누름 워크", "productivity"],
      ["com.android.settings", "설정", ""], ["com.daesinnam.game", "덜누름 게임", "game"]
    ];
    return {
      apps: function () { return JSON.stringify(fake.map(function (a) { return { pkg: a[0], cls: a[0] + ".Main", label: a[1], cat: a[2], system: false }; })); },
      icon: function () { return ""; },
      launch: function (p) { return JSON.stringify({ ok: true, pkg: p }); },
      store: function () { return true; }, screen: function () { return JSON.stringify({ windowed: false, dex: true, immersive: true }); },
      setImmersive: function () {}, goFullscreen: function () {}, load: function () { return mem; }, save: function (j) { mem = j; },
      tap: function () {}, keepScreenOn: function () {}, version: function () { return "dev"; }, report: function (l) { console.log("REPORT " + l); },
      volume: function () { return JSON.stringify(vol); },
      setVolume: function (n) { vol.cur = Math.max(0, Math.min(vol.max, n)); vol.muted = false; return JSON.stringify(vol); },
      toggleMute: function () { vol.muted = !vol.muted; return JSON.stringify(vol); },
      homeButton: function () { return JSON.stringify({ on: true, allowed: false }); }, setHomeButton: function () {}, askOverlay: function () {},
      shizuku: function () { return JSON.stringify({ installed: false, running: false, granted: false }); }, shizukuConnect: function () { return "install"; },
      openBluetooth: function () {}, setKeyTest: function () {}, takeOpen: function () { return -1; },
      rmGet: function () { return JSON.stringify(fakeRm); }, rmSet: function (j) { var o = JSON.parse(j); for (var k in o) fakeRm[k] = o[k]; if (o.reset) { delete fakeRm.reset; fakeRm.custom = false; } else if (o.map) fakeRm.custom = true; return JSON.stringify(fakeRm); },
      setLearn: function () {},
      kbGlobal: function () { return JSON.stringify({ on: false, shizuku: false }); }, kbEnable: function () { return "settings"; }, openAppInfo: function () {},
      rcState: function () { return JSON.stringify({ bt: true, on: true, perm: true }); },
      rcScan: function () {
        setTimeout(function () { window.rcFound(JSON.stringify({ addr: "AA:01", name: "Samsung Smart Control", remote: true, samsung: true, bonded: false })); }, 700);
        setTimeout(function () { window.rcFound(JSON.stringify({ addr: "AA:02", name: "Galaxy Buds2", remote: false, samsung: true, bonded: false })); }, 1100);
        setTimeout(function () { window.rcScanDone("ok"); }, 2500);
      },
      rcStop: function () {}, rcPair: function (a) { setTimeout(function () { window.rcBond(JSON.stringify({ addr: a, state: "bonding" })); }, 300); setTimeout(function () { window.rcBond(JSON.stringify({ addr: a, state: "bonded" })); }, 1600); }, remotes: function () { return JSON.stringify([{ name: "Bluetooth Remote", kind: "remote" }]); }
    };
  })();

  // ---------- 서비스 목록 (패키지 이름 · 대표 색) ----------
  var CATALOG = [
    { pkg: "com.netflix.mediaclient", name: "넷플릭스", kind: "영화 · 시리즈", desc: "오리지널 시리즈와 영화를 큰 화면으로.", c: "#E50914", d: "#3a0306" },
    { pkg: "kr.co.captv.pooqV2", name: "웨이브", kind: "방송 · 드라마 · 예능", desc: "지상파 방송과 드라마 · 예능 다시 보기.", c: "#1F4FFF", d: "#081650" },
    { pkg: "net.cj.cjhv.gs.tving", name: "티빙", kind: "드라마 · 예능 · 스포츠", desc: "tvN · JTBC 드라마와 예능, 스포츠 중계.", c: "#FF1F45", d: "#4a0612" },
    { pkg: "com.google.android.youtube", name: "유튜브", kind: "영상 · 라이브", desc: "구독 채널과 라이브를 소파에서.", c: "#FF0033", d: "#3d0009" },
    { pkg: "com.spotify.music", name: "스포티파이", kind: "음악 · 팟캐스트", desc: "거실 가득 음악과 팟캐스트.", c: "#1ED760", d: "#06381a" },
    { pkg: "com.coupang.mobile.play", name: "쿠팡플레이", kind: "영화 · 스포츠", desc: "영화 · 시리즈와 스포츠 생중계.", c: "#5B4BFF", d: "#160f4a" },
    { pkg: "com.disney.disneyplus", name: "디즈니+", kind: "영화 · 시리즈", desc: "디즈니 · 마블 · 픽사 작품.", c: "#1B48E0", d: "#05123d" },
    { pkg: "com.frograms.wplay", name: "왓챠", kind: "영화 · 시리즈", desc: "취향에 맞춘 영화와 시리즈.", c: "#FF0558", d: "#440018" },
    { pkg: "com.google.android.apps.youtube.music", name: "유튜브 뮤직", kind: "음악", desc: "뮤직비디오와 음악.", c: "#FF0000", d: "#3a0000" },
    { pkg: "com.iloen.melon", name: "멜론", kind: "음악", desc: "차트와 내 플레이리스트.", c: "#00CD3C", d: "#033d14" },
    { pkg: "com.ktmusic.geniemusic", name: "지니", kind: "음악", desc: "차트와 내 플레이리스트.", c: "#2C7BFF", d: "#0a2350" }
  ];
  var DEFAULT_MY = CATALOG.slice(0, 5).map(function (s) { return s.pkg; });
  var CAT = {}; CATALOG.forEach(function (s) { CAT[s.pkg] = s; });

  // ---------- 상태 ----------
  var fakeRm = { on: true, dev: "miter", home: true, connected: "MITER BTR2nd", custom: false, map: { KEYCODE_DPAD_LEFT: "left", KEYCODE_DPAD_RIGHT: "right", KEYCODE_PAGE_UP: "left", KEYCODE_PAGE_DOWN: "right", KEYCODE_MEDIA_PREVIOUS: "prev", KEYCODE_MEDIA_NEXT: "next", KEYCODE_VOLUME_UP: "upVol", KEYCODE_VOLUME_DOWN: "downVol", KEYCODE_DPAD_UP: "up", KEYCODE_DPAD_DOWN: "down", KEYCODE_MEDIA_PLAY_PAUSE: "ok", KEYCODE_F5: "mode", KEYCODE_BACK: "back" } };
  var state = { v: 1, my: DEFAULT_MY.slice(), fullOpen: true, saver: 10, recent: [] };
  try { var saved = JSON.parse(P.load() || "null"); if (saved && saved.v === 1) state = Object.assign(state, saved); } catch (e) {}
  function save() { try { P.save(JSON.stringify(state)); } catch (e) {} }

  var apps = [], byPkg = {}, icons = {};
  function loadApps() {
    try { apps = JSON.parse(P.apps()) || []; } catch (e) { apps = []; }
    byPkg = {};
    apps.forEach(function (a) { if (!byPkg[a.pkg]) byPkg[a.pkg] = a; });
    apps.sort(function (a, b) { return a.label.localeCompare(b.label, "ko"); });
  }
  function iconOf(pkg) {
    if (icons[pkg] != null) return icons[pkg];
    var a = byPkg[pkg]; var u = "";
    try { u = a ? P.icon(a.pkg, a.cls) : ""; } catch (e) {}
    icons[pkg] = u || "";
    return icons[pkg];
  }
  function nameOf(pkg) { return CAT[pkg] ? CAT[pkg].name : byPkg[pkg] ? byPkg[pkg].label : pkg; }
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function pic(pkg) {
    var u = iconOf(pkg);
    if (u) { var i = el("img"); i.src = u; i.alt = ""; return i; }
    return el("span", "ph", nameOf(pkg).slice(0, 1));
  }
  var toastT = 0;
  function toast(t) { var x = $("toast"); x.textContent = t; x.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { x.classList.remove("show"); }, 2600); }
  function tap() { try { P.tap(); } catch (e) {} }

  // ---------- 배너 ----------
  var heroIdx = 0, heroT = 0;
  function myList() { return state.my.filter(function (p) { return CAT[p] || byPkg[p]; }); }
  function setHero(i, user) {
    var list = myList(); if (!list.length) return;
    heroIdx = (i + list.length) % list.length;
    var pkg = list[heroIdx], s = CAT[pkg] || { name: nameOf(pkg), kind: "앱", desc: "", c: "#444", d: "#111" };
    var hero = $("hero");
    hero.style.setProperty("--hbg", "radial-gradient(120% 140% at 85% 30%, " + s.c + " 0%, " + s.d + " 45%, #0a0a0d 80%)");
    hero.style.setProperty("--hc", lum(s.c) > 0.6 ? "#fff" : s.c);
    $("heroKind").textContent = s.kind;
    $("heroName").textContent = s.name;
    $("heroDesc").textContent = s.desc || "";
    var inst = !!byPkg[pkg];
    $("heroOpen").querySelector("span").textContent = inst ? "열기" : "설치하기";
    $("heroNote").textContent = inst ? (state.fullOpen ? "전체 화면으로 열립니다" : "창으로 열립니다") : "Play 스토어에서 설치";
    $("heroOpen").dataset.pkg = pkg;
    var art = $("heroArt"); art.textContent = ""; art.appendChild(pic(pkg));
    var dots = $("heroDots"); dots.textContent = "";
    list.forEach(function (_, k) { dots.appendChild(el("i", k === heroIdx ? "on" : "")); });
    clearTimeout(heroT);
    heroT = setTimeout(function () { if (!document.hidden && $("sheet").hidden && $("saver").hidden && !$("home").hidden) setHero(heroIdx + 1); }, user ? 14000 : 9000);
  }

  // ---------- 타일 ----------
  function tile(pkg, big) {
    var t = el("button", "tile" + (byPkg[pkg] ? "" : " missing"));
    t.type = "button"; t.dataset.pkg = pkg; t.setAttribute("data-nav", "");
    var s = CAT[pkg];
    if (big && s) { t.style.setProperty("--tc", s.c); t.style.setProperty("--td", s.d); t.style.setProperty("--tt", lum(s.c) > 0.62 ? "#06210f" : "#fff"); }
    t.appendChild(pic(pkg));
    t.appendChild(el("b", null, nameOf(pkg)));
    if (!byPkg[pkg]) t.appendChild(el("span", "badge", "설치"));
    t.setAttribute("aria-label", nameOf(pkg) + (byPkg[pkg] ? "" : " (설치 안 됨)"));
    bindPress(t, function () { openApp(pkg); }, function () { tileSheet(pkg); });
    if (big) {
      t.addEventListener("focus", function () { var i = myList().indexOf(pkg); if (i >= 0) setHero(i, true); });
      t.addEventListener("mouseenter", function () { var i = myList().indexOf(pkg); if (i >= 0 && i !== heroIdx) setHero(i, true); });
    }
    return t;
  }
  // 누르기 · 길게 누르기 (터치 · 마우스)
  function bindPress(node, onTap, onLong) {
    var timer = 0, long = false, sx = 0, sy = 0;
    node.addEventListener("pointerdown", function (e) {
      long = false; sx = e.clientX; sy = e.clientY;
      timer = setTimeout(function () { long = true; tap(); onLong(); }, 600);
    });
    node.addEventListener("pointermove", function (e) { if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 12) clearTimeout(timer); });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { node.addEventListener(ev, function () { clearTimeout(timer); }); });
    node.addEventListener("click", function (e) { if (long) { e.preventDefault(); return; } onTap(); });
    node.addEventListener("contextmenu", function (e) { e.preventDefault(); clearTimeout(timer); if (!long) { long = true; onLong(); } });
  }

  function renderHome() {
    var row = $("myRow"); row.textContent = "";
    myList().forEach(function (p) { row.appendChild(tile(p, true)); });
    var add = el("button", "tile add"); add.type = "button"; add.setAttribute("data-nav", "");
    add.appendChild(el("span", null, "+")); add.appendChild(document.createTextNode("서비스 추가"));
    add.addEventListener("click", addSheet);
    row.appendChild(add);
    // 다른 영상 · 음악 앱: 최근 연 앱 → 알려진 서비스 → 영상 · 음악 분류 앱
    var more = [], seen = {};
    state.my.forEach(function (p) { seen[p] = 1; });
    function push(p) { if (!seen[p] && byPkg[p]) { seen[p] = 1; more.push(p); } }
    state.recent.forEach(push);
    CATALOG.forEach(function (s) { push(s.pkg); });
    apps.forEach(function (a) { if (a.cat === "video" || a.cat === "audio") push(a.pkg); });
    apps.forEach(function (a) { if (a.cat === "game") push(a.pkg); });
    var mr = $("moreRow"); mr.textContent = "";
    more.slice(0, 16).forEach(function (p) { mr.appendChild(tile(p, false)); });
    $("moreSec").hidden = !more.length;
    setHero(Math.min(heroIdx, Math.max(0, myList().length - 1)));
  }

  function renderApps() {
    var q = $("search").value.trim().toLowerCase();
    var g = $("allGrid"); g.textContent = "";
    apps.filter(function (a) { return !q || a.label.toLowerCase().indexOf(q) >= 0; }).forEach(function (a) {
      var b = el("button", "gitem"); b.type = "button"; b.setAttribute("data-nav", ""); b.dataset.pkg = a.pkg;
      b.appendChild(pic(a.pkg)); b.appendChild(el("span", null, a.label));
      bindPress(b, function () { openApp(a.pkg); }, function () { tileSheet(a.pkg); });
      g.appendChild(b);
    });
    if (!g.children.length) g.appendChild(el("p", "muted", "찾는 앱이 없습니다."));
  }

  function showTab(t) {
    [].forEach.call(document.querySelectorAll(".tab"), function (b) { b.classList.toggle("cur", b.dataset.tab === t); });
    $("home").hidden = t !== "home"; $("appsView").hidden = t !== "apps";
    if (t === "apps") renderApps(); else setHero(heroIdx);
  }

  // ---------- 앱 열기 ----------
  function homeInfo() { try { return JSON.parse(P.homeButton()) || {}; } catch (e) { return {}; } }
  function shzInfo() { try { return JSON.parse(P.shizuku()) || {}; } catch (e) { return {}; } }
  /** 처음 앱을 열 때 한 번: 돌아오는 홈 단추에 필요한 권한 안내 */
  function askHome(then) {
    sheetBack = cur;
    openSheet(function (box) {
      box.appendChild(el("h3", null, "앱에서 덜누름 TV로 돌아오기"));
      box.appendChild(el("p", null, "앱을 전체 화면으로 여는 동안, 화면 가장자리에 작은 홈 단추를 띄워 두면 한 번에 덜누름 TV로 돌아옵니다(끌어서 옮길 수 있음). 이 단추를 띄우려면 '다른 앱 위에 표시'를 허락해 주세요."));
      var g = el("div", "sbtns");
      g.appendChild(sbtn("허락하러 가기", "설정에서 덜누름 TV 켜기", function () { state.askedHome = true; save(); closeSheet(); P.askOverlay(); toast("허락한 뒤 돌아와서 다시 눌러 주세요"); }));
      g.appendChild(sbtn("이번엔 그냥 열기", "뒤로 단추로도 돌아올 수 있음", function () { state.askedHome = true; save(); closeSheet(); then(); }));
      box.appendChild(g);
    });
  }
  /** DeX에서 확실한 전체 화면은 Shizuku가 있어야 함: 연결 안내 (한 번, 설정에서 다시 볼 수 있음) */
  function askShizuku(then) {
    var z = shzInfo();
    sheetBack = cur;
    openSheet(function (box) {
      box.appendChild(el("h3", null, "DeX에서 전체 화면으로 열기"));
      box.appendChild(el("p", null, "DeX는 다른 앱이 정한 창 크기를 따르지 않고 스스로 창으로 띄웁니다. 전체 화면으로 확실히 열려면 Shizuku(무료 공개 앱)를 한 번 연결해 주세요. 무선 디버깅으로 켜 두면 덜누름 TV가 안드로이드 기본 명령으로 앱을 전체 화면에 엽니다."));
      var g = el("div", "sbtns");
      var step = !z.installed ? "1. Shizuku 받기" : !z.running ? "2. Shizuku 켜기 (무선 디버깅 → 시작)" : "3. 덜누름 TV 허락하기";
      g.appendChild(sbtn(step, z.installed ? (z.running ? "허락 창이 뜹니다" : "Shizuku 앱이 열립니다") : "Play 스토어", function () {
        state.askedShz = true; save(); var r = P.shizukuConnect(); closeSheet();
        toast(r === "start" ? "Shizuku에서 무선 디버깅으로 '시작'을 누른 뒤 돌아와 주세요" : r === "request" ? "허락을 누르면 바로 전체 화면으로 열립니다" : r === "ok" ? "연결되었습니다" : "Shizuku를 설치한 뒤 돌아와 주세요");
      }));
      g.appendChild(sbtn("지금은 창으로 열기", "설정에서 언제든 연결", function () { state.askedShz = true; save(); closeSheet(); then(); }));
      box.appendChild(g);
    });
  }
  function openApp(pkg) {
    tap();
    if (byPkg[pkg] && state.fullOpen && scr.dex && !shzInfo().granted && !state.askedShz) return askShizuku(function () { openApp(pkg); });
    var hb = homeInfo();
    if (byPkg[pkg] && hb.on && !hb.allowed && !state.askedHome) return askHome(function () { openApp(pkg); });
    var a = byPkg[pkg];
    if (!a) {
      if (CAT[pkg]) { P.store(pkg); toast(nameOf(pkg) + " — Play 스토어에서 설치해 주세요"); }
      else toast("이 앱은 설치되어 있지 않습니다");
      return;
    }
    var s = CAT[pkg];
    var sp = $("splash");
    sp.style.setProperty("--sbg", s ? "radial-gradient(circle at 50% 45%, " + s.c + ", " + s.d + " 60%, #000)" : "#000");
    $("splashIcon").src = iconOf(pkg) || ""; $("splashIcon").hidden = !iconOf(pkg);
    $("splashName").textContent = nameOf(pkg);
    sp.hidden = false;
    state.recent = [pkg].concat(state.recent.filter(function (p) { return p !== pkg; })).slice(0, 8); save();
    setTimeout(function () {
      var r = {}; try { r = JSON.parse(P.launch(a.pkg, a.cls, !!state.fullOpen)); } catch (e) {}
      if (!r.ok) { sp.hidden = true; toast("열지 못했습니다" + (r.error ? ": " + r.error : "")); }
      setTimeout(function () { sp.hidden = true; }, 2500);
    }, 380);
  }

  // ---------- 고르기 창 ----------
  var sheetBack = null;
  function openSheet(build, wide) {
    var box = $("sheetBox"); box.textContent = ""; box.className = "sheet" + (wide ? " wide" : "");
    build(box); $("sheet").hidden = false;
    var first = box.querySelector("[data-nav]"); if (first) focusEl(first);
  }
  function closeSheet() { if (learn) { learn = null; if (P.setLearn) P.setLearn(false); } if (remoteTest && P.setKeyTest) P.setKeyTest(false); remoteTest = null; rcOpen = null; if (P.rcStop) P.rcStop(); $("sheet").hidden = true; if (sheetBack) { var b = sheetBack; sheetBack = null; if (document.body.contains(b)) focusEl(b); } }
  $("sheet").addEventListener("click", function (e) { if (e.target.id === "sheet") closeSheet(); });
  function sbtn(label, sub, fn, cls) {
    var b = el("button", "sbtn" + (cls ? " " + cls : "")); b.type = "button"; b.setAttribute("data-nav", "");
    b.appendChild(el("span", null, label)); if (sub != null) b.appendChild(el("small", null, sub));
    b.addEventListener("click", function () { tap(); fn(); });
    return b;
  }

  function tileSheet(pkg) {
    sheetBack = cur;
    var mine = state.my.indexOf(pkg);
    openSheet(function (box) {
      box.appendChild(el("h3", null, nameOf(pkg)));
      box.appendChild(el("p", null, byPkg[pkg] ? (CAT[pkg] ? CAT[pkg].kind : "설치된 앱") : "설치되어 있지 않습니다"));
      var g = el("div", "sbtns");
      g.appendChild(sbtn(byPkg[pkg] ? "열기" : "Play 스토어에서 설치", null, function () { closeSheet(); openApp(pkg); }));
      if (mine >= 0) {
        if (mine > 0) g.appendChild(sbtn("앞으로 옮기기", "◀", function () { move(pkg, -1); }));
        if (mine < state.my.length - 1) g.appendChild(sbtn("뒤로 옮기기", "▶", function () { move(pkg, 1); }));
        g.appendChild(sbtn("내 서비스에서 빼기", null, function () { state.my.splice(state.my.indexOf(pkg), 1); save(); closeSheet(); renderHome(); toast(nameOf(pkg) + "을(를) 뺐습니다"); }, "danger"));
      } else {
        g.appendChild(sbtn("내 서비스에 넣기", null, function () { state.my.push(pkg); save(); closeSheet(); renderHome(); toast(nameOf(pkg) + "을(를) 내 서비스에 넣었습니다"); }));
      }
      g.appendChild(sbtn("닫기", null, closeSheet));
      box.appendChild(g);
    });
  }
  function move(pkg, d) {
    var i = state.my.indexOf(pkg), j = i + d; if (j < 0 || j >= state.my.length) return;
    state.my.splice(i, 1); state.my.splice(j, 0, pkg); save(); renderHome(); closeSheet();
    var t = document.querySelector('#myRow .tile[data-pkg="' + pkg + '"]'); if (t) focusEl(t);
  }

  function addSheet() {
    sheetBack = cur;
    openSheet(function (box) {
      box.appendChild(el("h3", null, "서비스 추가"));
      box.appendChild(el("p", null, "누르면 내 서비스에 넣거나 뺍니다. 설치 안 된 서비스도 넣어 두면 누를 때 Play 스토어로 갑니다."));
      var list = CATALOG.map(function (s) { return s.pkg; });
      apps.forEach(function (a) { if (list.indexOf(a.pkg) < 0 && (a.cat === "video" || a.cat === "audio" || a.cat === "game")) list.push(a.pkg); });
      apps.forEach(function (a) { if (list.indexOf(a.pkg) < 0) list.push(a.pkg); });
      var g = el("div", "pick");
      list.forEach(function (p) {
        var b = el("button", "gitem" + (state.my.indexOf(p) >= 0 ? " on" : "")); b.type = "button"; b.setAttribute("data-nav", "");
        b.appendChild(pic(p)); b.appendChild(el("span", null, nameOf(p)));
        b.appendChild(el("small", null, state.my.indexOf(p) >= 0 ? "내 서비스" : byPkg[p] ? "설치됨" : "설치 안 됨"));
        b.addEventListener("click", function () {
          tap();
          var i = state.my.indexOf(p);
          if (i >= 0) state.my.splice(i, 1); else state.my.push(p);
          save(); b.classList.toggle("on", i < 0); b.lastChild.textContent = i < 0 ? "내 서비스" : byPkg[p] ? "설치됨" : "설치 안 됨";
          renderHome();
        });
        g.appendChild(b);
      });
      box.appendChild(g);
      var done = el("div", "sbtns"); done.style.marginTop = "14px"; done.appendChild(sbtn("다 했어요", null, closeSheet)); box.appendChild(done);
    }, true);
  }

  // ---------- 리모컨 연결 · 안내 · 단추 시험 ----------
  var remoteTest = null; // 시험 중이면 눌린 단추를 보여 주는 칸
  var KEYNAME = {
    ArrowUp: ["▲ 위", "위로 고르기"], ArrowDown: ["▼ 아래", "아래로 고르기"], ArrowLeft: ["◀ 왼쪽", "왼쪽으로 고르기"], ArrowRight: ["▶ 오른쪽", "오른쪽으로 고르기"],
    Enter: ["확인 (OK)", "고른 것 열기"], " ": ["확인 (OK)", "고른 것 열기"], play: ["재생 / 일시정지", "고른 서비스 열기"], chUp: ["CH ▲", "앞 서비스로"], chDown: ["CH ▼", "다음 서비스로"],
    menu: ["메뉴", "설정 열기"], red: ["빨강", "설정 열기"], green: ["초록", "홈"], yellow: ["노랑", "모든 앱"], blue: ["파랑", "서비스 추가"], home: ["TV · 가이드", "홈"],
    AudioVolumeUp: ["볼륨 +", "소리 키우기"], AudioVolumeDown: ["볼륨 −", "소리 줄이기"]
  };
  function showKey(k) {
    if (!remoteTest) return;
    var n = KEYNAME[k] || (k.indexOf("raw:") === 0 ? [k.slice(4).replace("KEYCODE_", ""), "덜누름 TV에서는 쓰지 않는 단추 (다른 앱에서는 쓰일 수 있음)"] : null) || (k.charAt(0) === "n" && k.length === 2 ? ["숫자 " + k.slice(1), "내 서비스 " + k.slice(1) + "번째 열기"] : [k, "덜누름 TV에서는 쓰지 않는 단추"]);
    remoteTest.querySelector("b").textContent = n[0]; remoteTest.querySelector("span").textContent = n[1];
    remoteTest.classList.remove("hit"); void remoteTest.offsetWidth; remoteTest.classList.add("hit");
  }
  // ---------- 미테르 블루투스 리모컨 (MIT_BTR02 / RM1) 최적화 ----------
  var ACT = { left: "왼쪽으로 고르기", right: "오른쪽으로 고르기", up: "위 줄로", down: "아래 줄로", ok: "고른 것 열기", back: "뒤로", play: "재생 (고른 서비스 열기)",
    prev: "이전 서비스", next: "다음 서비스", upVol: "위로 (볼륨 모드: 소리 키우기)", downVol: "아래로 (볼륨 모드: 소리 줄이기)", mode: "＋ − 상하 ↔ 볼륨 바꾸기", volUp: "소리 키우기", volDown: "소리 줄이기", mute: "음소거", settings: "설정 열기", tvhome: "덜누름 TV 홈", apps: "모든 앱", sys: "그대로 (안드로이드 기본)" };
  var ACT_ORDER = ["left", "right", "up", "down", "ok", "back", "prev", "next", "volUp", "volDown", "mute", "settings", "apps", "tvhome", "sys"];
  // 미테르 앞면 단추 (위→아래)와 추천 기능
  var MITER_BTN = [["＋", "upVol"], ["−", "downVol"], ["〈", "left"], ["▶/II", "ok"], ["〉", "right"], ["홈 ⌂", "tvhome"], ["•", "mode"], ["뒤로 ↩", "back"]];
  var learn = null; // { step, got:{} }
  function rmGet() { try { return JSON.parse(P.rmGet()) || {}; } catch (e) { return {}; } }
  function keyLabel(k) { return k.replace("KEYCODE_", ""); }
  function miterSheet() {
    sheetBack = cur;
    var rm = rmGet();
    openSheet(function (box) {
      box.appendChild(el("h3", null, "미테르 리모컨 최적화"));
      box.appendChild(el("p", "rc-lead", "미테르(MITER) 블루투스 리모컨 MIT_BTR02 · RM1 단추 8개를 덜누름 TV에 맞게 바꿉니다. 이 리모컨에서 온 키만 바꾸고, 다른 키보드 · 리모컨은 그대로 둡니다."));
      var st = el("div", "rc-state" + (rm.connected ? " on" : ""));
      st.appendChild(el("b", null, rm.connected ? "연결됨 · " + rm.connected : "미테르 리모컨이 연결되지 않았습니다"));
      st.appendChild(el("span", null, rm.connected ? (rm.on ? "최적화 적용 중" + (rm.custom ? " (직접 맞춘 단추)" : " (기본 설정)") : "최적화 꺼짐") : "아래 '연결하기'대로 먼저 휴대폰에 연결하세요"));
      box.appendChild(st);

      var g = el("div", "sbtns"); g.style.marginTop = "10px";
      var onb = sbtn("최적화 사용", rm.on ? "켬" : "끔", function () { rm = JSON.parse(P.rmSet(JSON.stringify({ on: !rm.on }))); onb.lastChild.textContent = rm.on ? "켬" : "끔"; onb.classList.toggle("on", rm.on); }, rm.on ? "on" : "");
      g.appendChild(onb);
      g.appendChild(sbtn("단추 맞추기", "단추를 하나씩 눌러 정확히 맞추기 (추천)", function () { learnSheet(); }));
      box.appendChild(g);

      box.appendChild(el("h4", "rc-h", "단추마다 하는 일"));
      var tb = el("div", "rc-map");
      [["＋  −", "위 · 아래로 고르기 (줄 바꾸기 · 설정 창 안에서도)"], ["•", "＋ − 를 볼륨으로 바꾸기 · 한 번 더 누르면 다시 위 · 아래"], ["〈  〉", "타일 왼쪽 · 오른쪽으로 고르기"], ["〈  〉 길게", "이전 · 다음 서비스"], ["▶/II", "고른 것 열기"], ["뒤로 ↩", "창 닫기 · 홈으로"], ["홈 ⌂", "덜누름 TV 홈 (다른 앱을 보는 중에도)"]].forEach(function (r) {
        tb.appendChild(el("b", null, r[0])); tb.appendChild(el("span", null, r[1]));
      });
      box.appendChild(tb);

      box.appendChild(el("h4", "rc-h", "홈 단추로 덜누름 TV 부르기"));
      var kbg = {}; try { kbg = JSON.parse(P.kbGlobal()); } catch (e) {}
      var g4 = el("div", "sbtns");
      var hb = sbtn("홈 단추 → 덜누름 TV 홈", !rm.home ? "끔 (DeX 바탕화면으로)" : kbg.on ? "켬" : "켬 · 아래 단축키 기능을 켜야 동작", function () {
        rm = JSON.parse(P.rmSet(JSON.stringify({ home: !rm.home }))); hb.lastChild.textContent = rm.home ? (kbg.on ? "켬" : "켬 · 아래 단축키 기능을 켜야 동작") : "끔 (DeX 바탕화면으로)"; hb.classList.toggle("on", rm.home && kbg.on);
      }, rm.home && kbg.on ? "on" : "");
      g4.appendChild(hb);
      if (!kbg.on) g4.appendChild(sbtn("다른 앱에서도 단축키 쓰기 켜기", "넷플릭스 등을 보다가도 홈 단추로 돌아오기", function () {
        var r = P.kbEnable(); if (r === "on") { toast("켜졌습니다. 이제 홈 단추로 덜누름 TV에 돌아옵니다"); closeSheet(); miterSheet(); } else toast("접근성 › 설치된 앱 › 덜누름 TV 키보드 단축키를 켜 주세요");
      }));
      box.appendChild(g4);

      box.appendChild(el("h4", "rc-h", "연결하기"));
      var ol = el("ol", "rc-steps");
      ["옆면 스위치를 위로 밀어 켭니다. LED가 파란색이어야 블루투스 모드입니다 (빨간색이면 B를 짧게 눌러 바꿈)",
       "B 단추를 3초 이상 눌러 파란 LED가 계속 깜빡이게 합니다 (연결 모드)",
       "아래 [블루투스 설정 열기] → 새 기기 연결 → 목록의 MITER 이름을 누릅니다",
       "연결되면 파란 불이 10초 켜집니다. 덜누름 TV로 돌아오면 자동으로 최적화가 적용됩니다"].forEach(function (t) { ol.appendChild(el("li", null, t)); });
      box.appendChild(ol);

      box.appendChild(el("h4", "rc-h", "알아 두세요"));
      var ul = el("ul", "rc-notes");
      ["리모컨이 '키보드'로 연결되어 휴대폰 화면 키보드가 안 뜰 수 있습니다. 앱 찾기 등에 글자를 칠 때는 설정 › 일반 › 키보드 › 실제 키보드 › '화면 키보드 표시'를 켜 두세요.",
       "넷플릭스 등 다른 앱 안에서는 단추가 그 앱으로 갑니다 (〈 〉 = 앞뒤, ▶/II = 재생 · 멈춤, ＋ − = 소리). 홈 단추만 덜누름 TV로 돌아옵니다.",
       "빨간 LED(2.4GHz 모드)는 USB 동글이 있을 때만 씁니다. 휴대폰 · DeX에서는 파란색(블루투스)으로 두세요.",
       "단추가 생각과 다르게 움직이면 [단추 맞추기]로 한 번 맞춰 주세요. 리모컨 판매 시기에 따라 보내는 키가 다를 수 있습니다."].forEach(function (t) { ul.appendChild(el("li", null, t)); });
      box.appendChild(ul);
      var g2 = el("div", "sbtns"); g2.style.marginTop = "12px";
      g2.appendChild(sbtn("블루투스 설정 열기", "새 기기 연결", function () { P.openBluetooth(); }));
      if (rm.custom) g2.appendChild(sbtn("기본값으로 되돌리기", "직접 맞춘 단추 지우기", function () { P.rmSet(JSON.stringify({ reset: true })); toast("기본 설정으로 되돌렸습니다"); closeSheet(); miterSheet(); }));
      g2.appendChild(sbtn("닫기", null, closeSheet));
      box.appendChild(g2);
    }, true);
    setTimeout(function () { $("sheetBox").scrollTop = 0; }, 0);
  }

  // 단추 맞추기: 미테르 단추를 하나씩 누르면 그 키를 기억하고 추천 기능을 붙임
  function learnSheet() {
    learn = { step: 0, got: {}, dev: "" };
    if (P.setLearn) P.setLearn(true);
    sheetBack = cur;
    openSheet(function (box) {
      box.appendChild(el("h3", null, "단추 맞추기"));
      box.appendChild(el("p", "rc-lead", "화면에 나온 단추를 미테르 리모컨에서 한 번 누르세요. 8개를 차례로 맞춥니다. 홈 단추는 안드로이드가 먼저 가져가면 [건너뛰기]를 누르세요."));
      var big = el("div", "rc-test lrn"); big.appendChild(el("b")); big.appendChild(el("span")); box.appendChild(big);
      var prog = el("div", "lrn-dots"); MITER_BTN.forEach(function () { prog.appendChild(el("i")); }); box.appendChild(prog);
      var g = el("div", "sbtns"); g.style.marginTop = "12px";
      g.appendChild(sbtn("건너뛰기", "이 단추는 그대로 두기", function () { learnNext(null); }));
      g.appendChild(sbtn("그만두기", "저장하지 않고 닫기", function () { learnEnd(false); }));
      box.appendChild(g);
      learn.big = big; learn.prog = prog;
      learnShow();
    }, true);
  }
  function learnShow() {
    if (!learn || !learn.big) return;
    var b = MITER_BTN[learn.step];
    learn.big.querySelector("b").textContent = b[0] + " 단추를 누르세요";
    learn.big.querySelector("span").textContent = (learn.step + 1) + " / " + MITER_BTN.length + " · 맞추면: " + ACT[b[1]];
    [].forEach.call(learn.prog.children, function (d, i) { d.className = i < learn.step ? "done" : i === learn.step ? "now" : ""; });
  }
  window.rmLearn = function (j) {
    if (!learn) return; var d; try { d = JSON.parse(j); } catch (e) { return; }
    if (learn.got[d.key]) { toast("이미 맞춘 단추와 같은 키(" + keyLabel(d.key) + ")입니다"); return; }
    if (d.dev) learn.dev = d.dev;
    learn.big.classList.remove("hit"); void learn.big.offsetWidth; learn.big.classList.add("hit");
    learnNext(d.key);
  };
  function learnNext(key) {
    if (!learn) return;
    var act = MITER_BTN[learn.step][1];
    if (key) learn.got[key] = act === "tvhome" && key !== "KEYCODE_HOME" ? "tvhome" : act;
    learn.step++;
    if (learn.step >= MITER_BTN.length) learnEnd(true); else learnShow();
  }
  function learnEnd(saveIt) {
    if (P.setLearn) P.setLearn(false);
    var l = learn; learn = null;
    if (saveIt && l) {
      var keys = Object.keys(l.got);
      if (!keys.length) { toast("맞춘 단추가 없어 그대로 둡니다"); closeSheet(); miterSheet(); return; }
      // 기본값 위에 맞춘 키를 덮어써서, 길게 누름(이전/다음 곡) 같은 다른 키는 계속 동작
      var rm = rmGet(), map = {}, k;
      for (k in (rm.map || {})) map[k] = rm.map[k];
      keys.forEach(function (k) { map[k] = l.got[k]; });
      var save = { map: map, on: true };
      // 맞춘 키를 보낸 장치 이름으로 자동 인식 (MITER가 안 들어간 이름이어도)
      if (l.dev && l.dev.toLowerCase().indexOf((rm.dev || "miter").toLowerCase()) < 0) save.dev = l.dev;
      P.rmSet(JSON.stringify(save));
      toast("단추 " + keys.length + "개를 맞췄습니다");
    }
    closeSheet(); miterSheet();
  }

  // 미테르 리모컨이 새로 연결되면 한 번 알려 주기
  var rmSeen = "";
  function rmCheck() {
    var rm = rmGet();
    if (rm.connected && rm.connected !== rmSeen && rm.on) toast(rm.connected + " 연결됨 · 미테르 최적화 적용");
    rmSeen = rm.connected || "";
  }

  // ---------- 삼성 스마트 리모컨 바로 연결 ----------
  var rcOpen = null; // { list, btn, msg, rows:{addr:el} }
  function samsungSheet() {
    sheetBack = cur;
    openSheet(function (box) {
      box.appendChild(el("h3", null, "삼성 스마트 리모컨 바로 연결"));
      box.appendChild(el("p", "rc-lead", "삼성 TV 리모컨(스마트 리모컨 · 원리모컨 · 스마트 컨트롤)을 휴대폰에 블루투스로 짝지어 덜누름 TV를 조작합니다."));

      var warn = el("div", "rc-warn");
      warn.appendChild(el("b", null, "먼저 알아 두세요"));
      warn.appendChild(el("span", null, "삼성 리모컨은 한 번에 한 기기만 연결됩니다. 휴대폰에 연결하면 TV와의 연결이 풀리고, TV에서 다시 쓰려면 리모컨을 TV에 다시 연결해야 합니다 (TV를 향해 뒤로 + 재생/일시정지 3초)."));
      box.appendChild(warn);

      box.appendChild(el("h4", "rc-h", "1. 리모컨을 연결 모드로"));
      var ol = el("ol", "rc-steps");
      ["TV가 리모컨을 다시 잡아가지 않도록 TV 전원을 끄거나 TV에서 멀리 떨어집니다",
       "요즘 모델(스마트 리모컨 · 원리모컨): 뒤로(↩) + 재생/일시정지(⏯)를 3초 이상 함께 누릅니다",
       "예전 모델(스마트 컨트롤 · 터치 리모컨): RETURN + GUIDE를 함께 누릅니다",
       "누른 뒤 바로 아래 [리모컨 찾기]를 누르세요. 연결 모드는 잠깐만 유지됩니다"].forEach(function (t) { ol.appendChild(el("li", null, t)); });
      box.appendChild(ol);

      box.appendChild(el("h4", "rc-h", "2. 찾아서 연결"));
      var g = el("div", "sbtns"); var btn = sbtn("리모컨 찾기", "20초 동안 주변 검색", function () { rcStartScan(); }); g.appendChild(btn); box.appendChild(g);
      var msg = el("div", "rc-msg", ""); box.appendChild(msg);
      var list = el("div", "rc-list"); box.appendChild(list);

      box.appendChild(el("h4", "rc-h", "3. 단추 확인"));
      var g3 = el("div", "sbtns");
      g3.appendChild(sbtn("단추 눌러 보기", "연결된 리모컨 단추 시험", function () { closeSheet(); remoteSheet(); }));
      box.appendChild(g3);

      box.appendChild(el("h4", "rc-h", "안 될 때"));
      var ul = el("ul", "rc-notes");
      ["목록에 안 보이면 1번을 다시 하고 곧바로 [리모컨 찾기]를 누르세요. 리모컨 LED가 깜빡이는 동안만 찾을 수 있습니다.",
       "모델에 따라 휴대폰과 짝지어지지 않거나 일부 단추만 동작할 수 있습니다. 음성(마이크) 단추는 쓸 수 없습니다.",
       "리모컨의 홈 단추는 안드로이드가 처리해 DeX 바탕화면으로 갑니다.",
       "휴대폰에서 지우려면 블루투스 설정에서 리모컨 → 연결 해제(등록 해제)를 누르세요."].forEach(function (t) { ul.appendChild(el("li", null, t)); });
      box.appendChild(ul);
      var g2 = el("div", "sbtns"); g2.style.marginTop = "14px";
      g2.appendChild(sbtn("블루투스 설정 열기", null, function () { P.openBluetooth(); }));
      g2.appendChild(sbtn("닫기", null, closeSheet)); box.appendChild(g2);

      rcOpen = { list: list, btn: btn, msg: msg, rows: {} };
      var st = {}; try { st = JSON.parse(P.rcState()); } catch (e) {}
      if (st.bt === false) rcSay("이 휴대폰에는 블루투스가 없습니다.");
    }, true);
  }
  function rcSay(t) { if (rcOpen) rcOpen.msg.textContent = t; }
  function rcStartScan() {
    if (!rcOpen) return;
    rcOpen.list.innerHTML = ""; rcOpen.rows = {};
    rcOpen.btn.classList.add("busy"); rcOpen.btn.querySelector("small") && (rcOpen.btn.querySelector("small").textContent = "찾는 중…");
    rcSay("찾는 중… 리모컨이 연결 모드인지 확인하세요 (권한이나 블루투스 켜기를 물으면 허용)");
    P.rcScan();
  }
  window.rcFound = function (j) {
    if (!rcOpen) return; var d; try { d = JSON.parse(j); } catch (e) { return; }
    if (rcOpen.rows[d.addr]) return;
    var sub = (d.bonded ? "짝지어짐 · " : "") + (d.remote ? (d.samsung ? "삼성 리모컨으로 보임" : "리모컨으로 보임") : "다른 블루투스 장치");
    var b = sbtn(d.name, sub, function () { rcSay(d.name + " 연결 중… 휴대폰에 확인 창이 뜨면 [연결]을 누르세요"); P.rcPair(d.addr); }, d.remote ? "rc-hot" : "rc-other");
    rcOpen.rows[d.addr] = b;
    if (d.remote) rcOpen.list.insertBefore(b, rcOpen.list.firstChild); else rcOpen.list.appendChild(b);
  };
  window.rcScanDone = function (why) {
    if (!rcOpen) return;
    rcOpen.btn.classList.remove("busy"); var sm = rcOpen.btn.querySelector("small"); if (sm) sm.textContent = "20초 동안 주변 검색";
    var n = Object.keys(rcOpen.rows).length;
    rcSay(why === "perm" ? "근처 기기 권한이 없어 찾을 수 없습니다. 다시 누르고 허용해 주세요."
      : why === "off" ? "블루투스가 꺼져 있습니다. 켠 뒤 다시 찾아 주세요."
      : why === "nobt" ? "이 휴대폰에는 블루투스가 없습니다."
      : n ? "리모컨 이름을 눌러 연결하세요. 목록에 없으면 연결 모드로 다시 두고 찾기를 누르세요."
      : "찾은 장치가 없습니다. 리모컨을 연결 모드로 두고 바로 다시 찾아 주세요.");
  };
  window.rcBond = function (j) {
    var d; try { d = JSON.parse(j); } catch (e) { return; }
    var row = rcOpen && rcOpen.rows[d.addr]; var sm = row && row.querySelector("small");
    if (d.state === "bonding") { if (sm) sm.textContent = "연결 중…"; }
    else if (d.state === "bonded") { if (sm) sm.textContent = "연결됨 ✓"; if (row) row.classList.add("on"); rcSay("연결됐습니다. [단추 눌러 보기]에서 단추를 확인하세요."); toast("리모컨이 연결됐습니다"); }
    else if (d.state === "fail") { if (sm) sm.textContent = "연결 실패 · 다시 누르기"; rcSay("연결하지 못했습니다. 리모컨을 연결 모드로 다시 두고 이름을 다시 눌러 주세요."); }
  };
  window.rcChanged = function () { rmCheck(); };

  function remoteSheet() {
    sheetBack = cur;
    openSheet(function (box) {
      box.appendChild(el("h3", null, "리모컨 연결"));
      var rc = []; try { rc = JSON.parse(P.remotes()) || []; } catch (e) {}
      var kinds = { remote: "리모컨", keyboard: "키보드", mouse: "마우스 · 에어마우스", gamepad: "게임패드", keys: "단추 장치" };
      var st = el("div", "rc-state" + (rc.length ? " on" : ""));
      st.appendChild(el("b", null, rc.length ? "연결됨" : "연결된 리모컨이 없습니다"));
      st.appendChild(el("span", null, rc.length ? rc.map(function (d) { return d.name + " (" + (kinds[d.kind] || "장치") + ")"; }).join(" · ") : "블루투스 리모컨 · 에어마우스 · 무선 키보드를 휴대폰에 연결하면 바로 씁니다"));
      box.appendChild(st);

      box.appendChild(el("h4", "rc-h", "등록하는 방법"));
      var ol = el("ol", "rc-steps");
      ["리모컨을 연결(페어링) 모드로: 보통 확인 + 홈, 또는 뒤로 + 홈을 LED가 깜빡일 때까지 3~5초 함께 누릅니다 (제품 설명서 기준)",
       "아래 [블루투스 설정 열기] → 새 기기 연결(스캔) → 목록에 뜬 리모컨 이름을 누릅니다",
       "덜누름 TV로 돌아와 [단추 눌러 보기]에서 리모컨 단추를 눌러 이름이 뜨면 끝입니다",
       "USB 동글이 있는 에어마우스 · 리모컨은 동글을 DeX 독(또는 USB-C 허브)에 꽂기만 하면 됩니다"].forEach(function (t) { ol.appendChild(el("li", null, t)); });
      box.appendChild(ol);
      var g = el("div", "sbtns");
      g.appendChild(sbtn("블루투스 설정 열기", "새 기기 연결", function () { P.openBluetooth(); toast("연결한 뒤 덜누름 TV로 돌아와 주세요"); }));
      g.appendChild(sbtn("삼성 스마트 리모컨 바로 연결", "TV 리모컨을 휴대폰에", function () { closeSheet(); samsungSheet(); }));
      box.appendChild(g);

      box.appendChild(el("h4", "rc-h", "단추 눌러 보기"));
      var test = el("div", "rc-test"); test.appendChild(el("b", null, "리모컨 단추를 눌러 보세요")); test.appendChild(el("span", null, "누른 단추와 덜누름 TV에서 하는 일이 여기 뜹니다 · 뒤로 단추는 이 창을 닫습니다"));
      box.appendChild(test); remoteTest = test; if (P.setKeyTest) P.setKeyTest(true);

      box.appendChild(el("h4", "rc-h", "단추마다 하는 일"));
      var tb = el("div", "rc-map");
      [["방향 · 확인", "타일 고르기 · 열기"], ["뒤로", "창 닫기 · 홈으로"], ["재생 / 일시정지", "고른 서비스 열기"], ["CH ▲▼", "서비스 하나씩 넘기기"], ["숫자 1~9", "내 서비스 그 번째 바로 열기"], ["메뉴 · 빨강", "설정"], ["초록 · 노랑 · 파랑", "홈 · 모든 앱 · 서비스 추가"], ["볼륨 · 음소거", "미디어 소리"]].forEach(function (r) {
        tb.appendChild(el("b", null, r[0])); tb.appendChild(el("span", null, r[1]));
      });
      box.appendChild(tb);

      box.appendChild(el("h4", "rc-h", "알아 두세요"));
      var ul = el("ul", "rc-notes");
      ["TV에 딸려 온 적외선(IR) 리모컨은 휴대폰이 신호를 받지 못해 쓸 수 없습니다. 블루투스 또는 USB 동글 방식 리모컨을 쓰세요.",
       "넷플릭스 등 다른 앱을 보는 동안 방향 · 확인 · 뒤로 · 재생 단추는 그 앱이 받습니다.",
       "리모컨의 홈 단추는 안드로이드가 처리해 DeX 바탕화면으로 갑니다. 덜누름 TV로는 화면 가장자리의 떠 있는 홈 단추나 뒤로 단추로 돌아오세요."].forEach(function (t) { ul.appendChild(el("li", null, t)); });
      box.appendChild(ul);
      var g2 = el("div", "sbtns"); g2.style.marginTop = "14px"; g2.appendChild(sbtn("닫기", null, closeSheet)); box.appendChild(g2);
    }, true);
  }

  var scr = {};
  function refreshScreen() { try { scr = JSON.parse(P.screen()) || {}; } catch (e) { scr = {}; } $("fullBtn").hidden = !scr.windowed; }
  function settingsSheet() {
    sheetBack = cur;
    var saverName = function () { return state.saver ? state.saver + "분 뒤" : "끄기"; };
    openSheet(function (box) {
      box.appendChild(el("h3", null, "설정"));
      box.appendChild(el("p", null, "덜누름 TV " + P.version() + (scr.dex ? " · DeX에서 실행 중" : "")));
      var g = el("div", "sbtns");
      var rc = []; try { rc = JSON.parse(P.remotes()) || []; } catch (e) {}
      var kbg = {}; try { kbg = JSON.parse(P.kbGlobal()); } catch (e) {}
      g.appendChild(sbtn("키보드로 조작 · 단축키", kbg.on ? "다른 앱에서도 켜짐" : "? 를 누르면 언제든 보기", function () { kbSheet(); }, kbg.on ? "on" : ""));
      var rm = {}; try { rm = JSON.parse(P.rmGet()); } catch (e) {}
      g.appendChild(sbtn("미테르 리모컨 최적화", rm.connected ? (rm.on ? "연결됨 · 적용 중" : "연결됨 · 꺼짐") : (rm.on ? "켬 · 리모컨 연결 안 됨" : "끔"), function () { miterSheet(); }, rm.connected && rm.on ? "on" : ""));
      g.appendChild(sbtn("삼성 스마트 리모컨 바로 연결", "TV 리모컨을 휴대폰에 연결", function () { samsungSheet(); }));
      g.appendChild(sbtn("리모컨 연결 · 단추 안내", rc.length ? rc.length + "개 연결됨" : "연결 안 됨", function () { remoteSheet(); }, rc.length ? "on" : ""));
      var full = sbtn("앱을 전체 화면으로 열기", state.fullOpen ? "켬" : "끔", function () { state.fullOpen = !state.fullOpen; save(); full.lastChild.textContent = state.fullOpen ? "켬" : "끔"; full.classList.toggle("on", state.fullOpen); setHero(heroIdx); }, state.fullOpen ? "on" : "");
      var imm = sbtn("시스템 막대 숨기기", scr.immersive === false ? "끔" : "켬", function () { var on = scr.immersive === false; P.setImmersive(on); scr.immersive = on; imm.lastChild.textContent = on ? "켬" : "끔"; imm.classList.toggle("on", on); }, scr.immersive === false ? "" : "on");
      var sv = sbtn("화면 보호기", saverName(), function () { var o = [0, 3, 10, 30], i = o.indexOf(state.saver); state.saver = o[(i + 1) % o.length]; save(); sv.lastChild.textContent = saverName(); idle(); });
      g.appendChild(full); g.appendChild(imm); g.appendChild(sv);
      var hb = homeInfo();
      var home = sbtn("홈 단추 (앱 위에 떠 있는)", !hb.on ? "끔" : hb.allowed ? "켬" : "권한 필요", function () {
        var h = homeInfo();
        if (h.on && !h.allowed) { P.askOverlay(); return; }
        P.setHomeButton(!h.on); home.lastChild.textContent = !h.on ? (h.allowed ? "켬" : "권한 필요") : "끔"; home.classList.toggle("on", !h.on && h.allowed);
      }, hb.on && hb.allowed ? "on" : "");
      g.appendChild(home);
      var z = shzInfo();
      g.appendChild(sbtn("확실한 전체 화면 (고급 기능 Shizuku)", z.granted ? "연결됨" : !z.installed ? "Shizuku 받기" : !z.running ? "Shizuku 켜기" : "허락하기", function () {
        if (shzInfo().granted) return toast("연결되어 있습니다. 앱이 DeX에서도 전체 화면으로 열립니다.");
        var r = P.shizukuConnect(); toast(r === "start" ? "Shizuku에서 '시작'을 누른 뒤 돌아와 주세요" : r === "request" ? "허락을 눌러 주세요" : "Shizuku를 설치한 뒤 무선 디버깅으로 한 번 켜 주세요");
      }, z.granted ? "on" : ""));
      if (scr.windowed) g.appendChild(sbtn("이 앱을 전체 화면으로", null, function () { P.goFullscreen(); }));
      g.appendChild(sbtn("기본 서비스로 되돌리기", "넷플릭스 · 웨이브 · 티빙 · 유튜브 · 스포티파이", function () { state.my = DEFAULT_MY.slice(); save(); renderHome(); closeSheet(); toast("기본 서비스로 되돌렸습니다"); }));
      g.appendChild(sbtn("닫기", null, closeSheet));
      box.appendChild(g);
      box.appendChild(el("p", null, "DeX는 앱이 창으로 뜨도록 정할 때가 있습니다. 화면 전체 크기로 열도록 요청하고, 고급 기능(Shizuku)을 연결하면 확실히 전체 화면으로 엽니다. 앱 이름과 아이콘은 각 회사의 것입니다. 덜누름 TV는 설치된 앱을 열어 줄 뿐, 영상은 각 앱이 재생합니다."));
    });
  }

  // ---------- 볼륨 ----------
  var vol = { cur: 0, max: 15, muted: false };
  function applyVol(j) { try { var v = typeof j === "string" ? JSON.parse(j) : j; if (v && typeof v.cur === "number") vol = v; } catch (e) {} drawVol(); }
  function drawVol() {
    $("vfill").style.width = (vol.max ? (vol.muted ? 0 : vol.cur / vol.max) * 100 : 0) + "%";
    $("vol").classList.toggle("muted", !!vol.muted || vol.cur === 0);
    $("vbar").setAttribute("aria-valuenow", vol.cur);
  }
  window.tvVolume = function (j) { if (!dragging) applyVol(j); };
  $("muteBtn").addEventListener("click", function () { tap(); applyVol(P.toggleMute()); });
  $("volUp").addEventListener("click", function () { tap(); applyVol(P.setVolume(vol.cur + 1)); });
  $("volDown").addEventListener("click", function () { tap(); applyVol(P.setVolume(vol.cur - 1)); });
  var dragging = false;
  function volAt(e) { var r = $("vbar").getBoundingClientRect(); var n = Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * vol.max); if (n !== vol.cur || vol.muted) applyVol(P.setVolume(n)); }
  $("vbar").addEventListener("pointerdown", function (e) { dragging = true; $("vbar").setPointerCapture(e.pointerId); volAt(e); });
  $("vbar").addEventListener("pointermove", function (e) { if (dragging) volAt(e); });
  $("vbar").addEventListener("pointerup", function () { dragging = false; });
  $("vbar").addEventListener("wheel", function (e) { e.preventDefault(); applyVol(P.setVolume(vol.cur + (e.deltaY < 0 ? 1 : -1))); }, { passive: false });

  // ---------- 시계 · 화면 보호기 ----------
  function hm(d) { return d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2); }
  function tick() {
    var d = new Date();
    $("clock").textContent = hm(d);
    $("saverTime").textContent = hm(d);
    $("saverDate").textContent = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  }
  setInterval(tick, 5000); tick();
  var idleT = 0, driftT = 0;
  function idle() {
    clearTimeout(idleT);
    if (state.saver) idleT = setTimeout(showSaver, state.saver * 60000);
  }
  function drift() {
    var s = $("saverIn"), w = innerWidth - s.offsetWidth - 40, h = innerHeight - s.offsetHeight - 40;
    s.style.left = 20 + Math.random() * Math.max(0, w) + "px"; s.style.top = 20 + Math.random() * Math.max(0, h) + "px";
  }
  function showSaver() { if (!$("sheet").hidden) return idle(); $("saver").hidden = false; tick(); drift(); clearInterval(driftT); driftT = setInterval(drift, 20000); }
  function hideSaver() { $("saver").hidden = true; clearInterval(driftT); idle(); }
  $("saver").addEventListener("pointerdown", function (e) { e.preventDefault(); e.stopPropagation(); hideSaver(); }, true);
  ["pointerdown", "keydown", "wheel"].forEach(function (ev) { document.addEventListener(ev, function () { if ($("saver").hidden) idle(); }, true); });

  // ---------- 리모컨 · 키보드: 방향키로 포커스 옮기기 ----------
  var cur = null;
  function focusEl(e) {
    if (cur) cur.classList.remove("focus");
    cur = e; if (!e) return;
    e.classList.add("focus");
    try { e.focus({ preventScroll: true }); } catch (x) { e.focus(); }
    e.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }
  function candidates() {
    var scope = !$("sheet").hidden ? $("sheetBox") : document;
    return [].filter.call(scope.querySelectorAll("[data-nav]"), function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.closest("[hidden]"); });
  }
  function moveFocus(dir) {
    var list = candidates(); if (!list.length) return;
    if (!cur || list.indexOf(cur) < 0) { focusEl(list.find(function (e) { return e.classList.contains("tile"); }) || list[0]); return; }
    var a = cur.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, best = null, bd = Infinity;
    list.forEach(function (e) {
      if (e === cur) return;
      var r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, dx = x - ax, dy = y - ay;
      var main = dir === "left" ? -dx : dir === "right" ? dx : dir === "up" ? -dy : dy;
      var side = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
      if (main <= 4) return;
      var d = main + side * 2.2;
      if (d < bd) { bd = d; best = e; }
    });
    if (best) focusEl(best);
  }
  document.addEventListener("keydown", function (e) {
    if (remoteTest && !$("sheet").hidden && e.key !== "Escape" && e.key !== "Backspace" && e.key !== "Tab") {
      var m = { MediaPlayPause: "play", ChannelUp: "chUp", ChannelDown: "chDown", PageUp: "chUp", PageDown: "chDown" };
      showKey(m[e.key] || (/^[1-9]$/.test(e.key) ? "n" + e.key : e.key)); e.preventDefault(); e.stopImmediatePropagation(); return;
    }
    if (!$("saver").hidden) { hideSaver(); e.preventDefault(); return; }
    var typing = document.activeElement && document.activeElement.id === "search";
    var k = e.key;
    if (typing && (k === "ArrowLeft" || k === "ArrowRight")) return;
    if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") { e.preventDefault(); moveFocus(k.slice(5).toLowerCase()); }
    else if ((k === "Enter" || k === " ") && cur && !typing) { e.preventDefault(); cur.click(); }
    else if (k === "Escape" || (k === "Backspace" && !typing)) { if (window.tvBack()) e.preventDefault(); }
    else if (k === "ContextMenu" && cur && cur.dataset.pkg) { e.preventDefault(); tileSheet(cur.dataset.pkg); }
    else if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && kbShortcut(k)) { e.preventDefault(); }
  });
  document.addEventListener("pointerdown", function (e) { var t = e.target.closest && e.target.closest("[data-nav]"); if (t) focusEl(t); else if (cur) { cur.classList.remove("focus"); cur = null; } }, true);

  // ---------- 블루투스 키보드 ----------
  function typingNow() { return document.activeElement && document.activeElement.id === "search"; }
  var KB = [
    ["방향키", "고르기"], ["Enter · Space", "고른 것 열기"], ["Esc · Backspace", "뒤로 · 창 닫기"],
    ["1 ~ 9", "내 서비스 그 번째 바로 열기"], ["N · ]", "다음 서비스"], ["P · [", "이전 서비스"], ["H", "홈"], ["A", "모든 앱"],
    ["/", "앱 찾기 (이름 입력)"], ["S", "설정"], ["+ · −", "소리 키우기 · 줄이기"], ["M", "음소거"], ["F", "전체 화면"], ["?", "이 단축키 안내"]
  ];
  function kbShortcut(k) {
    if (k.length === 1) k = k.toLowerCase();
    var sheetOpen = !$("sheet").hidden;
    if (k === "?" || k === "F1") { if (sheetOpen) closeSheet(); kbSheet(); return true; }
    if (sheetOpen) return false; // 창이 열려 있으면 방향 · 확인 · 뒤로만
    kbHint();
    switch (k) {
      case "h": showTab("home"); return true;
      case "a": showTab("apps"); return true;
      case "/": showTab("apps"); setTimeout(function () { $("search").focus(); }, 30); return true;
      case "s": settingsSheet(); return true;
      case "n": case "]": window.tvKey("chDown"); return true;
      case "p": case "[": window.tvKey("chUp"); return true;
      case "m": applyVol(P.toggleMute()); toast(vol.muted ? "음소거" : "소리 켬"); return true;
      case "=": case "+": applyVol(P.setVolume(vol.cur + 1)); return true;
      case "-": case "_": applyVol(P.setVolume(vol.cur - 1)); return true;
      case "f": P.goFullscreen(); return true;
    }
    return false;
  }
  function kbHint() { if (state.kbHint) return; state.kbHint = 1; save(); toast("키보드 단축키 안내는 ? 키"); }
  function kbSheet() {
    sheetBack = cur;
    openSheet(function (box) {
      box.appendChild(el("h3", null, "키보드로 조작"));
      box.appendChild(el("p", "rc-lead", "블루투스 키보드를 휴대폰(또는 DeX)에 연결하면 바로 씁니다. 연결은 블루투스 설정 › 새 기기 연결에서 키보드를 고르면 됩니다."));
      box.appendChild(el("h4", "rc-h", "덜누름 TV 화면에서"));
      var tb = el("div", "rc-map kb-map");
      KB.forEach(function (r) { var b = el("b"); r[0].split(" · ").forEach(function (x, i) { if (i) b.appendChild(document.createTextNode(" · ")); b.appendChild(el("kbd", null, x)); }); tb.appendChild(b); tb.appendChild(el("span", null, r[1])); });
      box.appendChild(tb);

      box.appendChild(el("h4", "rc-h", "넷플릭스 등 다른 앱을 보는 중에도"));
      var tb2 = el("div", "rc-map kb-map");
      [["F12", "덜누름 TV 홈으로 돌아오기"], ["Alt + H", "덜누름 TV 홈으로 돌아오기"], ["Alt + 1 ~ 9", "내 서비스 그 번째로 바로 바꾸기"]].forEach(function (r) {
        var b = el("b"); r[0].split(" + ").forEach(function (x, i) { if (i) b.appendChild(document.createTextNode(" + ")); b.appendChild(el("kbd", null, x)); }); tb2.appendChild(b); tb2.appendChild(el("span", null, r[1]));
      });
      box.appendChild(tb2);
      var kbg = {}; try { kbg = JSON.parse(P.kbGlobal()); } catch (e) {}
      var g = el("div", "sbtns"); g.style.marginTop = "10px";
      var onb = sbtn("다른 앱에서도 단축키 쓰기", kbg.on ? "켜짐" : "꺼짐 · 눌러서 켜기", function () {
        var r = P.kbEnable();
        if (r === "on") { onb.lastChild.textContent = "켜짐"; onb.classList.add("on"); toast("이제 다른 앱에서도 F12 · Alt+H로 돌아옵니다"); }
        else toast("접근성 › 설치된 앱 › 덜누름 TV 키보드 단축키를 켜 주세요");
      }, kbg.on ? "on" : "");
      g.appendChild(onb);
      box.appendChild(g);
      var ul = el("ul", "rc-notes");
      [kbg.shizuku ? "Shizuku가 연결돼 있어 누르면 바로 켜집니다." : "누르면 접근성 설정이 열립니다. 설치된 앱(또는 설치된 서비스) › 덜누름 TV 키보드 단축키 › 켜기. (Shizuku를 연결해 두면 한 번에 켜집니다)",
       "켤 수 없게 회색으로 막혀 있으면: 아래 [앱 정보 열기] › 오른쪽 위 ⋮ › 제한된 설정 허용 뒤 다시 켜세요. 파일로 설치한 앱에 안드로이드가 거는 제한입니다.",
       "이 기능은 위 단축키만 가로채고, 나머지 키는 그대로 보고 있는 앱에 갑니다. 화면 내용이나 입력한 글자는 읽거나 저장하지 않습니다.",
       "다른 앱 안에서의 재생 · 멈춤(Space), 앞뒤로 넘기기(방향키), 전체 화면(F)은 그 앱의 키보드 기능을 따릅니다."].forEach(function (t) { ul.appendChild(el("li", null, t)); });
      box.appendChild(ul);
      var g2 = el("div", "sbtns"); g2.style.marginTop = "12px";
      g2.appendChild(sbtn("앱 정보 열기", "제한된 설정 허용", function () { P.openAppInfo(); }));
      g2.appendChild(sbtn("블루투스 설정 열기", "키보드 연결", function () { P.openBluetooth(); }));
      g2.appendChild(sbtn("닫기", null, closeSheet));
      box.appendChild(g2);
    }, true);
    setTimeout(function () { $("sheetBox").scrollTop = 0; }, 0);
  }

  // 리모컨 단추 (안드로이드에서 넘겨줌): CH ± = 서비스 넘기기, 재생 = 배너 서비스 열기, 숫자 = n번째 서비스, 메뉴 = 설정
  window.tvKey = function (k) {
    if (remoteTest && !$("sheet").hidden) { showKey(k); return; }
    if (!$("saver").hidden) { hideSaver(); return; }
    var list = myList();
    if (k === "mode:vol" || k === "mode:nav") {
      var vm = k === "mode:vol"; document.body.classList.toggle("rm-vol", vm);
      $("rmMode").textContent = vm ? "＋ − 볼륨 · • 로 되돌리기" : "";
      toast(vm ? "＋ − 볼륨 조절 (• 를 다시 누르면 위 · 아래)" : "＋ − 위 · 아래 고르기"); return;
    }
    if (k === "left" || k === "right" || k === "up" || k === "down") { moveFocus(k); return; }
    if (k === "ok") { if (cur) cur.click(); else if (list.length && $("sheet").hidden) openApp(list[heroIdx]); return; }
    if (k === "back") { window.tvBack(); return; }
    if (k === "settings") { if ($("sheet").hidden) settingsSheet(); else closeSheet(); return; }
    if (k === "apps") { if (!$("sheet").hidden) closeSheet(); showTab("apps"); return; }
    if (k === "tvhome") k = "home";
    if (k === "prev") k = "chUp"; else if (k === "next") k = "chDown";
    if (k === "chUp" || k === "chDown") {
      if (!$("home").hidden) { setHero(heroIdx + (k === "chUp" ? -1 : 1), true); var t = document.querySelector('#myRow .tile[data-pkg="' + list[heroIdx] + '"]'); if (t) focusEl(t); }
    } else if (k === "play") {
      if (cur && cur.dataset.pkg && $("sheet").hidden) openApp(cur.dataset.pkg); else if (list.length) openApp(list[heroIdx]);
    } else if (k.charAt(0) === "n" && typingNow()) {
      var sch = $("search"); sch.value += k.slice(1); renderApps();
    } else if (k.charAt(0) === "n") {
      var i = parseInt(k.slice(1), 10) - 1; if (list[i]) { showTab("home"); setHero(i, true); openApp(list[i]); }
    } else if (k === "menu" || k === "red") { if ($("sheet").hidden) settingsSheet(); else closeSheet(); }
    else if (k === "green") { showTab("home"); }
    else if (k === "yellow") { showTab("apps"); }
    else if (k === "blue") { if ($("sheet").hidden) addSheet(); }
    else if (k === "home") { if (!$("sheet").hidden) closeSheet(); showTab("home"); }
  };
  document.addEventListener("keydown", function (e) {
    var map = { MediaPlayPause: "play", ChannelUp: "chUp", ChannelDown: "chDown", PageUp: "chUp", PageDown: "chDown", ContextMenu: null };
    if (map[e.key]) { e.preventDefault(); window.tvKey(map[e.key]); }
    else if (/^[1-9]$/.test(e.key) && !(document.activeElement && document.activeElement.id === "search")) { e.preventDefault(); window.tvKey("n" + e.key); }
  });

  // 뒤로 (안드로이드 뒤로 단추 · Esc)
  window.tvBack = function () {
    if (!$("saver").hidden) { hideSaver(); return true; }
    if (!$("splash").hidden) { $("splash").hidden = true; return true; }
    if (!$("sheet").hidden) { closeSheet(); return true; }
    if (!$("appsView").hidden) { showTab("home"); focusEl(document.querySelector('.tab[data-tab="home"]')); return true; }
    return false;
  };
  window.tvPush = function (what) {
    if (what === "apps") { icons = {}; loadApps(); renderHome(); if (!$("appsView").hidden) renderApps(); }
    else if (what === "resume") { $("splash").hidden = true; refreshScreen(); idle(); rmCheck(); }
    else if (what === "window") refreshScreen();
  };

  // ---------- 연결 ----------
  [].forEach.call(document.querySelectorAll(".tab"), function (b) { b.addEventListener("click", function () { tap(); showTab(b.dataset.tab); }); });
  $("heroOpen").addEventListener("click", function () { openApp($("heroOpen").dataset.pkg); });
  $("setBtn").addEventListener("click", function () { tap(); settingsSheet(); });
  $("fullBtn").addEventListener("click", function () { tap(); P.goFullscreen(); });
  $("search").addEventListener("input", renderApps);
  // 배너를 옆으로 밀면 다음 서비스
  (function () {
    var sx = 0, sy = 0, on = false;
    $("hero").addEventListener("pointerdown", function (e) { on = true; sx = e.clientX; sy = e.clientY; });
    $("hero").addEventListener("pointerup", function (e) { if (!on) return; on = false; var dx = e.clientX - sx; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - sy)) setHero(heroIdx + (dx < 0 ? 1 : -1), true); });
  })();

  loadApps();
  renderHome();
  (function () { var b = document.createElement("div"); b.id = "rmMode"; document.body.appendChild(b); })();
  setTimeout(rmCheck, 800);
  setTimeout(function () { var n = -1; try { n = P.takeOpen(); } catch (e) {} if (n === 0) window.tvKey("home"); else if (n > 0) window.tvKey("n" + n); }, 300);
  refreshScreen();
  try { applyVol(P.volume()); } catch (e) {}
  idle();

  // ---------- 자동 점검 (에뮬레이터) ----------
  if (SELFTEST) setTimeout(function () {
    var report = function (l) { try { P.report(l); } catch (e) {} };
    report("APPS " + apps.length);
    report("TILES " + document.querySelectorAll("#myRow .tile:not(.add)").length + " MISSING " + document.querySelectorAll("#myRow .tile.missing").length);
    report("HERO " + $("heroName").textContent);
    var before = P.load(); state.recent = ["com.android.settings"]; save(); var after = P.load();
    report("SAVE " + (after && after !== before ? "ok" : "fail"));
    moveFocus("right"); moveFocus("right");
    report("FOCUS " + (cur ? (cur.dataset.pkg || cur.textContent.trim()) : "none"));
    try { report("VOLUME " + JSON.parse(P.volume()).max); } catch (e) { report("VOLUME fail"); }
    setTimeout(function () {
      // 설정 앱은 다른 앱의 떠 있는 단추를 가리므로(안드로이드 12+) 시계 · 캘린더 등으로 시험
      var t = ["com.google.android.deskclock", "com.android.deskclock", "com.google.android.calendar", "com.android.chrome"].filter(function (p) { return byPkg[p]; })[0] || "com.android.settings";
      report("LAUNCH-PKG " + t);
      report("LAUNCH " + P.launch(t, "", true));
      setTimeout(function () { report("DONE"); }, 1500);
    }, 1500);
  }, 1500);
})();
