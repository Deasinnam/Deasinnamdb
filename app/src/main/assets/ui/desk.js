/* 덜누름 데스크 — 바탕화면 셸 (바탕화면 아이콘, 작업 표시줄, 시작 메뉴, 내부 창) */
(function () {
  "use strict";

  // ---------- 앱(안드로이드)과 주고받기 ----------
  const A = window.DeskAndroid || null;
  let seq = 0;
  const waiting = new Map();
  function call(method, ...args) {
    if (!A) return mock(method, args);
    return new Promise((resolve) => {
      const id = ++seq;
      waiting.set(id, resolve);
      A.postMessage(JSON.stringify({ id, method, args }));
    });
  }
  const log = (m) => { if (A) A.postMessage(JSON.stringify({ log: String(m) })); else console.log(m); };
  if (A) {
    A.onmessage = (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch (_) { return; }
      if (m.push) return onPush(m.push, m.data);
      const r = waiting.get(m.id);
      if (r) { waiting.delete(m.id); r(m.result); }
    };
  }
  // 브라우저에서 미리 볼 때 쓰는 가짜 응답
  function mock(method, args) {
    if (method === "apps") {
      const names = ["갤러리", "계산기 앱", "날씨", "메시지", "브라우저", "설정", "시계", "연락처", "음악", "전화", "지도", "카메라", "캘린더", "파일", "Play 스토어", "YouTube"];
      return Promise.resolve(names.map((label, i) => ({ pkg: "demo.app" + i, cls: "Main", label, glyph: label[0], color: i % 4 })));
    }
    if (method === "status") return Promise.resolve({ battery: 82, charging: false, net: "wifi", freeform: true, isDefault: false, wallpaper: 0, version: "미리보기" });
    if (method === "launch") return Promise.resolve({ ok: true, mode: args[2], freeform: true });
    if (method === "widgetProviders") return Promise.resolve([
      { i: 0, app: "시계", label: "디지털 시계", pkg: "demo.clock", w: 180, h: 80 },
      { i: 1, app: "날씨", label: "오늘 날씨", pkg: "demo.weather", w: 250, h: 110 },
      { i: 2, app: "캘린더", label: "일정", pkg: "demo.cal", w: 250, h: 250 }]);
    if (method === "addWidget") {
      const names = ["디지털 시계", "오늘 날씨", "일정"], sizes = [[180, 80], [250, 110], [250, 250]];
      setTimeout(() => onPush("widget-added", { id: Date.now() % 100000, label: names[args[0]], w: sizes[args[0]][0], h: sizes[args[0]][1] }), 200);
      return Promise.resolve(true);
    }
    return Promise.resolve(true);
  }

  // ---------- 도우미 ----------
  const $ = (id) => document.getElementById(id);
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
    return el;
  }
  function svg(d, box) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", box || "0 0 24 24");
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "2"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round");
    for (const part of [].concat(d)) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", part);
      s.append(p);
    }
    return s;
  }
  // 선 그림 아이콘 (직접 그린 것)
  const IC = {
    search: ["M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z", "M20 20l-4.8-4.8"],
    right: "M4 2l4 4-4 4", left: "M8 2L4 6l4 4",
    widgets: ["M4 4h7v7H4z", "M13 4h7v7h-7z", "M4 13h7v7H4z", "M16.5 13v7", "M13 16.5h7"],
    gear: ["M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"],
    device: ["M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z", "M11 18h2"],
    bt: "M7 7l10 10-5 5V2l5 5L7 17",
    sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2", "M12 20v2", "M4.9 4.9l1.4 1.4", "M17.7 17.7l1.4 1.4", "M2 12h2", "M20 12h2", "M4.9 19.1l1.4-1.4", "M17.7 6.3l1.4-1.4"],
    sound: ["M11 5L6 9H2v6h4l5 4V5z", "M15.5 8.5a5 5 0 0 1 0 7", "M19 5a10 10 0 0 1 0 14"],
    batt: ["M3 7h15a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z", "M22 11v2", "M6 10v4", "M9 10v4"],
    cal: ["M4 5h16v15H4z", "M4 10h16", "M8 3v4", "M16 3v4"],
    desktop: ["M3 4h18v12H3z", "M8 20h8", "M12 16v4"],
  };
  let toastTimer = 0;
  function toast(text) {
    const t = $("toast");
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- 저장되는 설정 ----------
  const DEFAULTS = { pins: null, desktop: null, openMode: "window", wallpaper: 0, theme: "dark", notes: "", wins: {}, widgets: [], lately: [], tbAlign: "center", tbStyle: "dock" };
  let S = Object.assign({}, DEFAULTS);
  try { Object.assign(S, JSON.parse(localStorage.getItem("desk_state") || "{}")); } catch (_) {}
  if (!Array.isArray(S.widgets)) S.widgets = [];
  if (A) document.documentElement.classList.add("native"); // 앱 안: 배경은 아래 층이 그림
  const save = () => { try { localStorage.setItem("desk_state", JSON.stringify(S)); } catch (_) {} };

  // ---------- 앱 목록 ----------
  // 내부 앱(이 화면 안에서 창으로 열리는 작은 도구)
  const BUILTIN = [
    { key: "in:notes", label: "메모", glyph: "메", color: 0 },
    { key: "in:calc", label: "계산기", glyph: "계", color: 1 },
    { key: "in:cal", label: "달력", glyph: "달", color: 2 },
    { key: "in:settings", label: "데스크 설정", glyph: "설", color: 3 },
  ];
  const HIDDEN = [{ key: "in:wlog", label: "위젯 자리 기록", glyph: "기", color: 3 }]; // 목록에는 안 나오는 내부 창
  let apps = [];                 // 설치된 앱 {key, pkg, cls, label}
  const byKey = new Map();
  let status = { battery: -1, charging: false, net: "none", freeform: false, isDefault: false, version: "" };
  const recent = [];             // 이번에 켠 뒤 연 바깥 앱 (작업 표시줄에 점으로 표시)

  function iconOf(app, extra) {
    if (app.glyph) return h("span", { class: "ico tile c" + app.color + (extra ? " " + extra : ""), text: app.glyph });
    return h("img", { class: "ico" + (extra ? " " + extra : ""), src: "/appicon/" + app.pkg + "/" + app.cls, alt: "", draggable: "false", loading: "lazy" });
  }

  async function loadApps() {
    const list = (await call("apps")) || [];
    apps = Array.isArray(list) ? list.map((a) => Object.assign({ key: a.pkg + "/" + a.cls }, a)) : [];
    byKey.clear();
    for (const b of BUILTIN.concat(HIDDEN)) byKey.set(b.key, b);
    for (const a of apps) byKey.set(a.key, a);
    if (!S.pins) {
      // 처음 한 번: 흔히 쓰는 앱을 작업 표시줄에 올려 둠
      const want = ["com.android.chrome", "com.sec.android.app.sbrowser", "com.sec.android.app.myfiles", "com.google.android.apps.messaging", "com.samsung.android.messaging", "com.sec.android.gallery3d", "com.android.settings"];
      S.pins = [];
      for (const pkg of want) { const a = apps.find((x) => x.pkg === pkg); if (a && S.pins.length < 5) S.pins.push(a.key); }
      S.pins.push("in:notes");
    }
    if (!S.desktop) S.desktop = BUILTIN.map((b) => b.key);
    save();
    renderDesk(); renderTaskbar();
    if (!$("start").hidden) renderStart();
  }

  // ---------- 열기 ----------
  async function openApp(key, mode) {
    const app = byKey.get(key);
    if (!app) return toast("앱을 찾지 못했습니다. 제거된 앱일 수 있습니다.");
    closePanels();
    S.lately = [key].concat((S.lately || []).filter((k) => k !== key)).slice(0, 8); save();
    if (key.startsWith("in:")) return openBuiltin(key);
    const r = await call("launch", app.pkg, app.cls, mode || S.openMode);
    if (r && r.error) return toast("열지 못했습니다: " + r.error);
    const i = recent.indexOf(key);
    if (i >= 0) recent.splice(i, 1);
    recent.unshift(key);
    if (recent.length > 8) recent.pop();
    renderTaskbar();
    return r;
  }

  // ---------- 누름 처리: 짧게 누르면 열기, 길게·오른쪽 누르면 메뉴 ----------
  function bindItem(el, key, where) {
    let timer = 0, long = false, sx = 0, sy = 0;
    el.addEventListener("pointerdown", (e) => {
      if (e.button === 2) return;
      long = false; sx = e.clientX; sy = e.clientY;
      clearTimeout(timer);
      timer = setTimeout(() => { long = true; showCtx(key, where, sx, sy); }, 520);
    });
    el.addEventListener("pointermove", (e) => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 10) clearTimeout(timer); });
    const cancel = () => clearTimeout(timer);
    el.addEventListener("pointerup", cancel); el.addEventListener("pointercancel", cancel); el.addEventListener("pointerleave", cancel);
    el.addEventListener("contextmenu", (e) => { e.preventDefault(); clearTimeout(timer); if (!long) { long = true; showCtx(key, where, e.clientX, e.clientY); } });
    el.addEventListener("click", (e) => {
      if (long) { long = false; e.preventDefault(); return; }
      if (where === "task") return taskClick(key);
      openApp(key);
    });
  }

  function showCtx(key, where, x, y) {
    const app = byKey.get(key);
    if (!app) return;
    const c = $("ctx");
    c.textContent = "";
    const item = (label, fn, cls) => h("button", { class: cls || null, role: "menuitem", onclick: () => { c.hidden = true; fn(); } }, label);
    c.append(h("div", { class: "ctx-title", text: app.label }));
    const ext = !key.startsWith("in:");
    if (ext) {
      c.append(item("창으로 열기", () => openApp(key, "window")));
      c.append(item("왼쪽 반에 열기", () => openApp(key, "left")));
      c.append(item("오른쪽 반에 열기", () => openApp(key, "right")));
      c.append(item("전체 화면으로 열기", () => openApp(key, "full")));
    } else {
      c.append(item("열기", () => openApp(key)));
    }
    const pinned = S.pins.includes(key), onDesk = S.desktop.includes(key);
    c.append(item(pinned ? "작업 표시줄에서 떼기" : "작업 표시줄에 고정", () => {
      if (pinned) S.pins = S.pins.filter((k) => k !== key); else S.pins.push(key);
      save(); renderTaskbar(); if (!$("start").hidden) renderStart();
    }));
    c.append(item(onDesk ? "바탕화면에서 빼기" : "바탕화면에 추가", () => {
      if (onDesk) S.desktop = S.desktop.filter((k) => k !== key); else S.desktop.push(key);
      save(); renderDesk();
    }));
    if (where === "task" && !pinned && recent.includes(key)) c.append(item("작업 표시줄에서 지우기", () => { recent.splice(recent.indexOf(key), 1); renderTaskbar(); }));
    if (ext) {
      c.append(item("앱 정보", () => call("appInfo", app.pkg)));
      c.append(item("제거", () => call("uninstall", app.pkg), "danger"));
    }
    c.hidden = false;
    const W = innerWidth, H = innerHeight, r = c.getBoundingClientRect();
    c.style.left = Math.max(6, Math.min(x, W - r.width - 6)) + "px";
    c.style.top = Math.max(6, Math.min(y, H - r.height - 6)) + "px";
  }

  // ---------- 바탕화면 ----------
  function renderDesk() {
    const d = $("desk");
    d.textContent = "";
    for (const key of S.desktop || []) {
      const app = byKey.get(key);
      if (!app) continue;
      const el = h("button", { class: "dicon", title: app.label }, iconOf(app), h("span", { text: app.label }));
      bindItem(el, key, "desk");
      d.append(el);
    }
  }

  // ---------- 작업 표시줄 ----------
  function taskKeys() {
    const keys = (S.pins || []).filter((k) => byKey.has(k));
    const extra = [];
    for (const w of wins) if (!keys.includes(w.key) && !extra.includes(w.key)) extra.push(w.key);
    for (const k of recent) if (!keys.includes(k) && !extra.includes(k) && byKey.has(k)) extra.push(k);
    return { keys, extra };
  }
  function renderTaskbar() {
    const box = $("task-items");
    box.textContent = "";
    const { keys, extra } = taskKeys();
    const add = (key) => {
      const app = byKey.get(key);
      const w = wins.find((x) => x.key === key);
      const running = !!w || recent.includes(key);
      const active = !!w && !w.min && w === topWin();
      const el = h("button", { class: "titem" + (running ? " run" : "") + (active ? " active" : ""), title: app.label, "aria-label": app.label }, iconOf(app));
      bindItem(el, key, "task");
      box.append(el);
    };
    keys.forEach(add);
    if (extra.length && keys.length) box.append(h("span", { class: "tsep" }));
    extra.forEach(add);
  }
  function taskClick(key) {
    const w = wins.find((x) => x.key === key);
    if (!w) return openApp(key);
    closePanels();
    if (w.min) { w.min = false; w.el.hidden = false; focusWin(w); }
    else if (w === topWin()) { w.min = true; w.el.hidden = true; renderTaskbar(); }
    else focusWin(w);
  }

  const NET_ICON = {
    wifi: ["M2 8.5a15 15 0 0 1 20 0", "M5.5 12.5a10 10 0 0 1 13 0", "M9 16.2a5 5 0 0 1 6 0", "M12 20h.01"],
    cell: ["M4 20v-3", "M9 20v-7", "M14 20v-11", "M19 20V4"],
    wired: ["M4 6h16v9H4z", "M9 20h6", "M12 15v5"],
    other: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M3 12h18"],
    none: ["M2 8.5a15 15 0 0 1 20 0", "M9 16.2a5 5 0 0 1 6 0", "M4 4l16 16"],
  };
  function renderTray() {
    const n = $("tray-net");
    n.textContent = "";
    n.append(svg(NET_ICON[status.net] || NET_ICON.none));
    const b = $("tray-batt");
    b.hidden = status.battery < 0;
    b.className = (status.charging ? "chg" : status.battery <= 15 ? "low" : "");
    b.querySelector("i").style.setProperty("--lv", Math.max(6, status.battery) + "%");
    b.querySelector("b").textContent = status.battery + "%";
  }
  function tick() {
    const now = new Date();
    $("clock-time").textContent = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
    $("clock-date").textContent = (now.getMonth() + 1) + "월 " + now.getDate() + "일 " + "일월화수목금토"[now.getDay()];
  }
  async function refreshStatus() {
    const r = await call("status");
    if (r && !r.error) { status = r; renderTray(); }
  }

  // ---------- 시작 메뉴 ----------
  function gridItem(app, cls) {
    const el = h("button", { class: cls, title: app.label }, iconOf(app), h("span", { text: app.label }));
    bindItem(el, app.key, "start");
    return el;
  }
  // 앱 이름의 첫 소리로 묶기 (ㄱ·ㄴ·… / A·B·… / #)
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ", CHO1 = "ㄱㄱㄴㄷㄷㄹㅁㅂㅂㅅㅅㅇㅈㅈㅊㅋㅌㅍㅎ";
  function letterOf(label) {
    const c = (label || "").trim().charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) return CHO1[Math.floor((c - 0xac00) / 588)];
    const ch = (label || "").trim().charAt(0).toUpperCase();
    if (/[A-Z]/.test(ch)) return ch;
    if (CHO.includes(ch)) return CHO1[CHO.indexOf(ch)];
    return "#";
  }
  let startView = "home";
  function recItem(app) {
    const el = h("button", { class: "ritem", title: app.label }, iconOf(app), h("span", null, h("b", { text: app.label }), h("small", { text: app.key.startsWith("in:") ? "덜누름 데스크 도구" : "최근에 연 앱" })));
    bindItem(el, app.key, "start");
    return el;
  }
  function renderStart() {
    const body = $("start-body");
    const q = $("search").value.trim().toLowerCase();
    body.textContent = "";
    const all = BUILTIN.concat(apps);
    if (q) {
      const hit = all.filter((a) => a.label.toLowerCase().includes(q));
      if (!hit.length) return body.append(h("div", { class: "empty", text: "'" + $("search").value.trim() + "'에 맞는 앱이 없습니다." }));
      body.append(h("h3", { text: "찾은 앱 " + hit.length + "개" }), h("div", { class: "list" }, hit.map((a) => gridItem(a, "litem"))));
      return;
    }
    if (startView === "all") {
      body.append(h("div", { class: "shead" }, h("h3", { text: "모든 앱" }),
        h("button", { class: "pill", id: "back-home", onclick: () => { startView = "home"; renderStart(); body.scrollTop = 0; } }, svg(IC.left, "0 0 12 12"), "뒤로")));
      if (!apps.length) return body.append(h("div", { class: "empty", text: "앱 목록을 불러오는 중입니다…" }));
      const sorted = all.slice().sort((a, b) => a.label.localeCompare(b.label, "ko"));
      const order = (l) => (l === "#" ? 2 : /[A-Z]/.test(l) ? 1 : 0);
      sorted.sort((a, b) => order(letterOf(a.label)) - order(letterOf(b.label)) || a.label.localeCompare(b.label, "ko"));
      const list = h("div", { class: "list" });
      let cur = null;
      for (const a of sorted) {
        const l = letterOf(a.label);
        if (l !== cur) { cur = l; list.append(h("div", { class: "letter", text: l })); }
        list.append(gridItem(a, "litem"));
      }
      body.append(list);
      return;
    }
    // 처음 화면: 고정됨 + 추천
    const seen = new Set();
    const pinned = [];
    for (const k of (S.pins || []).concat(BUILTIN.map((b) => b.key))) { const a = byKey.get(k); if (a && !seen.has(k)) { seen.add(k); pinned.push(a); } }
    body.append(h("div", { class: "shead" }, h("h3", { text: "고정됨" }),
      h("button", { class: "pill", id: "all-apps", onclick: () => { startView = "all"; renderStart(); body.scrollTop = 0; } }, "모든 앱", svg(IC.right, "0 0 12 12"))));
    body.append(h("div", { class: "grid" }, pinned.map((a) => gridItem(a, "gitem"))));
    body.append(h("div", { class: "shead" }, h("h3", { text: "추천" })));
    const lately = (S.lately || []).map((k) => byKey.get(k)).filter(Boolean).slice(0, 6);
    if (lately.length) body.append(h("div", { class: "rec" }, lately.map(recItem)));
    else body.append(h("div", { class: "hint", text: "앱을 열면 최근에 연 앱이 여기에 나옵니다." }));
  }
  function toggleStart(open) {
    const s = $("start");
    const want = open == null ? s.hidden : open;
    closePanels();
    if (!want) return;
    s.hidden = false;
    $("start-btn").classList.add("on");
    $("search").value = "";
    startView = "home";
    renderStart();
    $("start-body").scrollTop = 0;
  }

  // ---------- 빠른 설정 ----------
  function toggleQuick() {
    const q = $("quick");
    const want = q.hidden;
    closePanels();
    if (!want) return;
    q.textContent = "";
    const netName = { wifi: "와이파이", cell: "모바일 데이터", wired: "유선 연결", other: "연결됨", none: "연결 안 됨" }[status.net] || "인터넷";
    // 누르면 해당 기기 설정 화면이 열립니다 (직접 켜고 끄지는 않음)
    const tile = (icon, label, fn, on) => h("button", { class: "qtile" + (on ? " on" : ""), title: label, onclick: () => { closePanels(); fn(); } }, h("span", null, svg(icon)), h("span", { text: label }));
    q.append(h("div", { class: "qgrid" },
      tile(NET_ICON[status.net] || NET_ICON.none, netName, () => call("openSettings", "wifi"), status.net === "wifi"),
      tile(IC.bt, "블루투스", () => call("openSettings", "bluetooth")),
      tile(IC.sun, "화면", () => call("openSettings", "display")),
      tile(IC.sound, "소리", () => call("openSettings", "sound")),
      tile(IC.batt, "배터리", () => call("openSettings", "battery"), status.charging),
      tile(IC.desktop, "바탕화면 보기", showDesktop),
      tile(IC.cal, "달력", () => openApp("in:cal")),
      tile(IC.widgets, "위젯 추가", openWidgetPicker),
      tile(IC.device, "기기 설정", () => call("openSettings", "all"))));
    q.append(h("div", { class: "qfoot" },
      h("span", { text: status.battery >= 0 ? "배터리 " + status.battery + "%" + (status.charging ? " · 충전 중" : "") : "" }),
      h("button", { title: "데스크 설정", "aria-label": "데스크 설정", onclick: () => openApp("in:settings") }, svg(IC.gear))));
    q.hidden = false;
    $("tray").classList.add("on");
  }
  function toggleCal() {
    const c = $("calfly");
    const want = c.hidden;
    closePanels();
    if (!want) return;
    c.textContent = "";
    const now = new Date();
    c.append(h("div", { class: "calfly-head", text: (now.getMonth() + 1) + "월 " + now.getDate() + "일 " + "일월화수목금토"[now.getDay()] + "요일" }));
    const body = h("div");
    buildCal(body);
    c.append(body.firstChild);
    c.hidden = false;
    $("tray-clock").classList.add("on");
  }
  function closePanels() {
    $("start").hidden = true; $("quick").hidden = true; $("ctx").hidden = true; $("wpick").hidden = true; $("calfly").hidden = true; $("snapfly").hidden = true;
    $("start-btn").classList.remove("on"); $("tray").classList.remove("on"); $("tray-clock").classList.remove("on");
  }
  function showDesktop() {
    for (const w of wins) { w.min = true; w.el.hidden = true; }
    renderTaskbar();
  }

  // ---------- 창 관리 ----------
  const wins = [];
  let z = 10;
  const layer = () => $("windows");
  const topWin = () => wins.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0] || null;
  const area = () => { const r = layer().getBoundingClientRect(); return { w: r.width, h: r.height }; };
  const CTL = { min: "M2 6h8", max: "M2.5 2.5h7v7h-7z", restore: ["M4 4V2.5h5.5V8H8", "M2.5 4H8v5.5H2.5z"], close: ["M2.5 2.5l7 7", "M9.5 2.5l-7 7"] };

  function focusWin(w) {
    w.z = ++z; w.el.style.zIndex = w.z;
    for (const x of wins) x.el.classList.toggle("focus", x === w);
    renderTaskbar();
  }
  function applyRect(w) {
    const a = area();
    if (w.max) { Object.assign(w.el.style, { left: "0px", top: "0px", width: a.w + "px", height: a.h + "px" }); }
    else {
      w.w = Math.max(240, Math.min(w.w, a.w)); w.h = Math.max(180, Math.min(w.h, a.h));
      w.x = Math.max(-w.w + 80, Math.min(w.x, a.w - 80)); w.y = Math.max(0, Math.min(w.y, a.h - 40));
      Object.assign(w.el.style, { left: w.x + "px", top: w.y + "px", width: w.w + "px", height: w.h + "px" });
    }
    w.el.classList.toggle("max", !!w.max);
    w.maxBtn.textContent = ""; w.maxBtn.append(svg(w.max ? CTL.restore : CTL.max, "0 0 12 12"));
    w.maxBtn.setAttribute("aria-label", w.max ? "이전 크기로" : "최대화");
  }
  function remember(w) { S.wins[w.key] = { x: w.x, y: w.y, w: w.w, h: w.h, max: !!w.max }; save(); }
  function closeWin(w) {
    if (w.onclose) w.onclose();
    w.el.remove();
    wins.splice(wins.indexOf(w), 1);
    const t = topWin();
    if (t) focusWin(t); else renderTaskbar();
  }

  function openWindow(key, size, build) {
    const exist = wins.find((x) => x.key === key);
    if (exist) { exist.min = false; exist.el.hidden = false; focusWin(exist); return exist; }
    const app = byKey.get(key);
    const a = area();
    const saved = S.wins[key];
    const n = wins.length % 5;
    const w = { key, min: false, max: false, z: 0, w: size.w, h: size.h, x: 0, y: 0 };
    w.x = Math.max(8, Math.round((a.w - w.w) / 2) + (n - 2) * 26);
    w.y = Math.max(8, Math.round((a.h - w.h) / 3) + n * 22);
    if (saved) Object.assign(w, saved);
    if (a.w < 560) w.max = true; // 좁은 화면(접은 화면)에서는 꽉 채워 엽니다

    const bar = h("div", { class: "win-bar" }, iconOf(app), h("div", { class: "win-title", text: app.label }));
    const minBtn = h("button", { class: "win-ctl", "aria-label": "최소화", onclick: () => { w.min = true; w.el.hidden = true; const t = topWin(); if (t) focusWin(t); else renderTaskbar(); } }, svg(CTL.min, "0 0 12 12"));
    let snapTimer = 0, snapShown = false;
    w.maxBtn = h("button", { class: "win-ctl", onclick: () => { if (snapShown) { snapShown = false; return; } w.max = !w.max; applyRect(w); remember(w); } });
    // 최대화 단추: 마우스를 잠깐 올려 두거나 길게 누르면(오른쪽 누름) 창 배치 고르기
    w.maxBtn.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { clearTimeout(snapTimer); snapTimer = setTimeout(() => showSnap(w), 600); } });
    w.maxBtn.addEventListener("pointerleave", () => clearTimeout(snapTimer));
    w.maxBtn.addEventListener("pointerdown", (e) => { snapShown = false; if (e.pointerType !== "mouse") { clearTimeout(snapTimer); snapTimer = setTimeout(() => { snapShown = true; showSnap(w); }, 450); } });
    w.maxBtn.addEventListener("pointerup", () => { if (!snapShown) clearTimeout(snapTimer); });
    w.maxBtn.addEventListener("contextmenu", (e) => { e.preventDefault(); clearTimeout(snapTimer); snapShown = true; showSnap(w); });
    const closeBtn = h("button", { class: "win-ctl close", "aria-label": "닫기", onclick: () => closeWin(w) }, svg(CTL.close, "0 0 12 12"));
    bar.append(minBtn, w.maxBtn, closeBtn);
    const body = h("div", { class: "win-body" });
    w.el = h("div", { class: "win", role: "dialog", "aria-label": app.label }, bar, body, h("div", { class: "rz r" }), h("div", { class: "rz b" }), h("div", { class: "rz rb" }));
    w.el.addEventListener("pointerdown", () => { if (topWin() !== w) focusWin(w); }, true);
    for (const b of [minBtn, w.maxBtn, closeBtn]) b.addEventListener("pointerdown", (e) => e.stopPropagation());

    // 제목 줄 끌기: 옮기기 + 가장자리에 붙이기(왼쪽·오른쪽 반, 위 = 최대화)
    let drag = null, lastTap = 0;
    const preview = $("snap-preview");
    const snapAt = (e) => {
      const r = layer().getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (y < 10) return "max";
      if (x < 14) return "left";
      if (x > r.width - 14) return "right";
      return null;
    };
    bar.addEventListener("pointerdown", (e) => {
      const now = Date.now();
      if (now - lastTap < 320) { w.max = !w.max; applyRect(w); remember(w); lastTap = 0; return; }
      lastTap = now;
      bar.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: w.x, oy: w.y, moved: false };
    });
    bar.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        if (w.max) { // 최대화된 창을 끌면 원래 크기로 돌아오며 손가락 아래에 놓임
          const a2 = area();
          w.max = false;
          w.x = Math.round(e.clientX - layer().getBoundingClientRect().left - w.w / 2); w.y = 0;
          drag.ox = w.x; drag.oy = w.y; drag.sx = e.clientX; drag.sy = e.clientY;
          w.x = Math.max(0, Math.min(w.x, a2.w - w.w));
          drag.ox = w.x;
        }
      }
      w.x = drag.ox + (e.clientX - drag.sx); w.y = drag.oy + (e.clientY - drag.sy);
      applyRect(w);
      const s = snapAt(e), a2 = area();
      preview.hidden = !s;
      if (s) Object.assign(preview.style, { top: "6px", height: a2.h - 12 + "px", left: (s === "right" ? a2.w / 2 + 3 : 6) + "px", width: (s === "max" ? a2.w - 12 : a2.w / 2 - 9) + "px" });
    });
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const moved = drag.moved;
      drag = null; preview.hidden = true;
      if (!moved) return;
      const s = snapAt(e);
      if (s) snapTo(w, s); else { applyRect(w); remember(w); }
    };
    bar.addEventListener("pointerup", endDrag); bar.addEventListener("pointercancel", endDrag);

    // 크기 바꾸기
    for (const edge of w.el.querySelectorAll(".rz")) {
      let rs = null;
      edge.addEventListener("pointerdown", (e) => { e.stopPropagation(); edge.setPointerCapture(e.pointerId); rs = { id: e.pointerId, sx: e.clientX, sy: e.clientY, w: w.w, h: w.h }; focusWin(w); });
      edge.addEventListener("pointermove", (e) => {
        if (!rs || e.pointerId !== rs.id) return;
        if (!edge.classList.contains("b")) w.w = rs.w + (e.clientX - rs.sx);
        if (!edge.classList.contains("r")) w.h = rs.h + (e.clientY - rs.sy);
        applyRect(w);
      });
      const end = (e) => { if (rs && e.pointerId === rs.id) { rs = null; remember(w); } };
      edge.addEventListener("pointerup", end); edge.addEventListener("pointercancel", end);
    }

    layer().append(w.el);
    wins.push(w);
    build(body, w);
    applyRect(w);
    focusWin(w);
    return w;
  }

  // 창 배치: 화면을 나눠 붙이기 (반·반, ⅔·⅓, ⅓·⅔, 전체)
  const ZONES = { left: [0, .5], right: [.5, 1], left2: [0, 2 / 3], right1: [2 / 3, 1], left1: [0, 1 / 3], right2: [1 / 3, 1] };
  function snapTo(w, kind) {
    closePanels();
    if (kind === "max") w.max = true;
    else {
      const a = area(), z = ZONES[kind];
      w.max = false;
      Object.assign(w, { x: Math.round(a.w * z[0]), y: 0, w: Math.round(a.w * (z[1] - z[0])), h: Math.round(a.h) });
    }
    w.min = false; w.el.hidden = false;
    applyRect(w); remember(w); focusWin(w);
  }
  function showSnap(w) {
    const f = $("snapfly");
    f.textContent = "";
    const zone = (kind, grow) => h("button", { class: grow, "aria-label": { left: "왼쪽 반", right: "오른쪽 반", left2: "왼쪽 넓게", right1: "오른쪽 좁게", left1: "왼쪽 좁게", right2: "오른쪽 넓게", max: "전체" }[kind], onclick: (e) => { e.stopPropagation(); snapTo(w, kind); } });
    f.append(
      h("div", { class: "sl" }, zone("left", "f1"), zone("right", "f1")),
      h("div", { class: "sl" }, zone("left2", "f2"), zone("right1", "f1")),
      h("div", { class: "sl" }, zone("left1", "f1"), zone("right2", "f2")),
      h("div", { class: "sl" }, zone("max", "f1")));
    f.hidden = false;
    const b = w.maxBtn.getBoundingClientRect(), r = f.getBoundingClientRect();
    f.style.left = Math.max(6, Math.min(b.left + b.width / 2 - r.width / 2, innerWidth - r.width - 6)) + "px";
    f.style.top = Math.min(b.bottom + 6, innerHeight - r.height - 6) + "px";
  }

  // ---------- 내부 앱 ----------
  function openBuiltin(key) {
    if (key === "in:notes") return openWindow(key, { w: 420, h: 360 }, (body) => {
      const t = h("textarea", { class: "notes", placeholder: "여기에 적으면 저절로 저장됩니다.", spellcheck: "false" });
      t.value = S.notes || "";
      t.addEventListener("input", () => { S.notes = t.value; save(); });
      body.append(t);
    });
    if (key === "in:calc") return openWindow(key, { w: 300, h: 420 }, buildCalc);
    if (key === "in:cal") return openWindow(key, { w: 340, h: 380 }, buildCal);
    if (key === "in:settings") return openWindow(key, { w: 460, h: 520 }, buildSettings);
    if (key === "in:wlog") return openWindow(key, { w: 560, h: 420 }, (body) => {
      let L = [];
      try { L = JSON.parse(localStorage.getItem("desk_wlog") || "[]"); } catch (_) {}
      const t = h("textarea", { class: "notes mono", readonly: "", spellcheck: "false" });
      t.value = "시각 | 일 | 위젯 넓이 | 화면(CSS)@비율 | 위젯 번호:x,y 너비x높이\n" + (L.length ? L.slice().reverse().map((r) => r.join(" | ")).join("\n") : "(기록 없음)");
      body.append(t);
    });
  }

  function buildCalc(body) {
    let cur = "0", acc = null, op = null, fresh = true, trail = "";
    const out = h("b", { text: "0" }), hist = h("small");
    const fmt = (n) => {
      if (!isFinite(n)) return "계산할 수 없음";
      const r = Math.round(n * 1e10) / 1e10;
      return String(Math.abs(r) >= 1e15 ? r.toExponential(8) : r);
    };
    const pretty = (t) => {
      if (!/^-?\d+(\.\d*)?$/.test(t)) return t;
      const parts = t.split(".");
      return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts.length > 1 ? "." + parts[1] : "");
    };
    const show = () => { out.textContent = pretty(cur); hist.textContent = trail; };
    const calc = (a, b, o) => (o === "+" ? a + b : o === "−" ? a - b : o === "×" ? a * b : b === 0 ? NaN : a / b);
    const press = (k) => {
      if (cur === "계산할 수 없음") { cur = "0"; acc = null; op = null; trail = ""; fresh = true; }
      if (/^\d$/.test(k)) { cur = fresh || cur === "0" ? k : cur.length < 15 ? cur + k : cur; fresh = false; }
      else if (k === ".") { if (fresh) { cur = "0."; fresh = false; } else if (!cur.includes(".")) cur += "."; }
      else if (k === "C") { cur = "0"; acc = null; op = null; trail = ""; fresh = true; }
      else if (k === "⌫") { if (!fresh) cur = cur.length > 1 ? cur.slice(0, -1) : "0"; if (cur === "-") cur = "0"; }
      else if (k === "±") { if (cur !== "0") cur = cur.startsWith("-") ? cur.slice(1) : "-" + cur; }
      else if (k === "%") { cur = fmt(parseFloat(cur) / 100); fresh = true; }
      else if (k === "=") {
        if (op != null && acc != null) { const b = parseFloat(cur); trail = fmt(acc) + " " + op + " " + fmt(b) + " ="; cur = fmt(calc(acc, b, op)); acc = null; op = null; fresh = true; }
      } else { // 연산자
        const v = parseFloat(cur);
        if (op != null && acc != null && !fresh) acc = calc(acc, v, op); else if (acc == null || !fresh) acc = v;
        if (!isFinite(acc)) { cur = "계산할 수 없음"; acc = null; op = null; trail = ""; fresh = true; return show(); }
        op = k; trail = fmt(acc) + " " + op; cur = fmt(acc); fresh = true;
      }
      show();
    };
    const keys = ["C", "⌫", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "±", "0", ".", "="];
    const pad = h("div", { class: "calc-keys" }, keys.map((k) => h("button", { class: "÷×−+".includes(k) ? "op" : k === "=" ? "eq" : null, "data-k": k, onclick: () => press(k) }, k)));
    body.append(h("div", { class: "calc" }, h("div", { class: "calc-out" }, hist, out), pad));
    body._press = press; body._value = () => cur;
  }

  function buildCal(body) {
    const today = new Date();
    let y = today.getFullYear(), m = today.getMonth();
    const title = h("b"), grid = h("div", { class: "cal-grid" });
    const draw = () => {
      title.textContent = y + "년 " + (m + 1) + "월";
      grid.textContent = "";
      "일월화수목금토".split("").forEach((d, i) => grid.append(h("span", { class: "dow" + (i === 0 ? " sun" : ""), text: d })));
      const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), prevDays = new Date(y, m, 0).getDate();
      for (let i = 0; i < 42; i++) {
        const d = i - first + 1;
        const out = d < 1 || d > days;
        const label = d < 1 ? prevDays + d : d > days ? d - days : d;
        const isToday = !out && y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
        grid.append(h("span", { class: (out ? "out" : "") + (i % 7 === 0 && !out ? " sun" : "") + (isToday ? " today" : ""), text: label }));
      }
    };
    const move = (n) => { m += n; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw(); };
    body.append(h("div", { class: "cal" },
      h("div", { class: "cal-head" }, h("button", { "aria-label": "이전 달", onclick: () => move(-1) }, "‹"), title, h("button", { "aria-label": "다음 달", onclick: () => move(1) }, "›")),
      grid,
      h("button", { class: "btn", onclick: () => { y = today.getFullYear(); m = today.getMonth(); draw(); } }, "오늘")));
    draw();
  }

  const customUrl = () => 'url("/wallpaper/current.jpg?v=' + (status.wallpaper || 0) + '")';
  function applyLook() {
    const custom = S.wallpaper === "custom" && status.wallpaper > 0;
    const wp = custom ? "wp-custom" : "wp-" + (S.wallpaper === "custom" ? 0 : S.wallpaper | 0);
    document.body.className = wp + (S.theme === "light" ? " light" : "");
    document.documentElement.classList.toggle("tb-left", S.tbAlign === "left");
    document.documentElement.classList.toggle("tb-float", S.tbStyle === "float");
    // 작업 표시줄 모양이 바뀌면 바탕화면 넓이가 달라지므로 창·위젯 자리를 다시 맞춤
    for (const w of wins) applyRect(w);
    layoutWidgets(); renderWidgetShells(); syncNative();
    if (A) call("look", wp, custom ? customUrl() : "");   // 앱 안: 맨 아래 배경 층에 걸기
    else document.body.style.backgroundImage = custom ? customUrl() : "";
  }
  const pickWallpaper = () => { closePanels(); call("pickWallpaper"); };
  function buildSettings(body) {
    const draw = () => {
      body.textContent = "";
      const seg = (cur, options, set) => h("div", { class: "seg" }, options.map(([v, label]) => h("button", { class: cur === v ? "on" : null, onclick: () => { set(v); save(); applyLook(); draw(); } }, label)));
      const sw = h("div", { class: "swatches" }, [0, 1, 2, 3, 4].map((i) => h("button", { class: "wp-" + i + (S.wallpaper === i ? " on" : ""), "aria-label": "배경 " + (i + 1), onclick: () => { S.wallpaper = i; save(); applyLook(); draw(); } })));
      if (status.wallpaper > 0) {
        const mine = h("button", { class: "photo" + (S.wallpaper === "custom" ? " on" : ""), "aria-label": "내 사진 배경", onclick: () => { S.wallpaper = "custom"; save(); applyLook(); draw(); } });
        mine.style.backgroundImage = customUrl();
        sw.append(mine);
      }
      body.append(h("div", { class: "set" },
        h("h4", { text: "앱을 누르면" }),
        seg(S.openMode, [["window", "창으로 열기"], ["full", "전체 화면으로 열기"]], (v) => { S.openMode = v; }),
        h("p", { text: "앱을 길게 누르면(마우스는 오른쪽 누름) 창·왼쪽 반·오른쪽 반·전체 화면을 골라 열 수 있습니다." }),
        status.freeform ? null : h("div", { class: "note" },
          "이 기기는 '자유 창'을 지원한다고 알려 오지 않았습니다. 창으로 열어도 전체 화면으로 뜨면, 개발자 옵션에서 '자유 형식 창 사용'(freeform windows)을 켠 뒤 기기를 다시 시작해 보세요. ",
          h("button", { class: "btn", onclick: () => call("openSettings", "developer") }, "개발자 옵션 열기")),
        h("h4", { text: "배경" }), sw,
        h("div", null,
          h("button", { class: "btn primary", onclick: pickWallpaper }, status.wallpaper > 0 ? "다른 사진으로 바꾸기" : "내 사진으로 배경 바꾸기"),
          status.wallpaper > 0 ? h("button", { class: "btn", onclick: async () => { await call("clearWallpaper"); if (S.wallpaper === "custom") S.wallpaper = 0; save(); await refreshStatus(); applyLook(); draw(); } }, "내 사진 지우기") : null),
        h("p", { text: "고른 사진은 이 기기 안에만 복사해 두며, 화면에 꽉 차게 맞춥니다." }),
        h("h4", { text: "위젯" }),
        h("div", null,
          h("button", { class: "btn primary", onclick: openWidgetPicker }, "위젯 추가"),
          S.widgets.length ? h("button", { class: "btn", onclick: () => enterWidgetEdit() }, "위젯 옮기기·크기 바꾸기") : null),
        h("p", { text: "다른 앱의 위젯(시계·날씨·일정 등)을 바탕화면에 올립니다. 올린 위젯을 길게 누르면(마우스는 오른쪽 누름) 옮기거나 크기를 바꾸고 지울 수 있습니다." }),
        h("h4", { text: "색" }),
        seg(S.theme, [["dark", "어둡게"], ["light", "밝게"]], (v) => { S.theme = v; }),
        h("h4", { text: "작업 표시줄" }),
        seg(S.tbAlign, [["center", "아이콘 가운데"], ["left", "아이콘 왼쪽"]], (v) => { S.tbAlign = v; }),
        seg(S.tbStyle, [["dock", "화면 아래에 붙임"], ["float", "떠 있는 둥근 모양"]], (v) => { S.tbStyle = v; }),
        h("h4", { text: "홈 앱" }),
        h("p", { text: status.isDefault ? "덜누름 데스크가 기본 홈 앱입니다. 홈 버튼을 누르면 이 화면으로 옵니다." : "기본 홈 앱으로 정하면 홈 버튼을 누를 때 이 화면이 나옵니다. 언제든 기기 설정에서 원래 홈으로 되돌릴 수 있습니다." }),
        h("div", null,
          status.isDefault ? null : h("button", { class: "btn primary", onclick: () => call("makeDefault") }, "기본 홈 앱으로 정하기"),
          h("button", { class: "btn", onclick: () => call("openSettings", "home") }, "홈 앱 설정 열기")),
        h("h4", { text: "정보" }),
        h("p", { text: "덜누름 데스크 " + (status.version || "") + " · 인터넷 권한 없이 기기 안에서만 동작합니다." }),
        S.widgets.length ? h("div", null, h("button", { class: "btn", onclick: () => openBuiltin("in:wlog") }, "위젯 자리 기록 보기")) : null,
        S.widgets.length ? h("p", { text: "위젯이 엉뚱한 자리로 가면, 그 직후 이 기록을 찍어 보내 주세요. 화면 크기와 위젯 자리가 바뀐 때가 적혀 있습니다." }) : null));
    };
    draw();
    body._redraw = draw;
  }


  // ---------- 위젯 ----------
  // 실제 위젯(안드로이드 뷰)은 이 화면 아래 층에 놓입니다. 여기서는 자리(x·y·크기)를 정해 앱에 알려 주고,
  // 위젯을 덮는 것(창·아이콘·메뉴)도 알려 줘서 드러난 곳을 누를 때만 위젯이 받게 합니다.
  let wEdit = false, wSel = null, wDragging = false;
  let lastSync = "", syncQueued = false;
  const wMissing = new Set();
  const wArea = () => { const r = $("wlayer").getBoundingClientRect(); return { w: r.width, h: r.height }; };
  const snap = (v) => Math.round(v / 8) * 8;

  // 위젯 자리는 "화면 크기별로" 따로 기억합니다 (d.pos[화면 크기 구분] = 사용자가 놓은 자리).
  // 화면이 잠깐 작아지거나(키보드, 켜지는 도중) 다른 화면(접은 화면·펼친 화면·DeX)에서 열려도
  // 저장해 둔 자리는 건드리지 않고, 보여 줄 때만 그 화면에 맞춰 계산합니다. 원래 화면으로 돌아오면 원래 자리 그대로입니다.
  const classKey = (a) => Math.round(a.w / 80) + "x" + Math.round(a.h / 80);
  // 너무 작은 화면(창을 내리는 중, 켜지는 도중)에서는 자리를 새로 계산하지 않고 그대로 둡니다
  const tooSmall = (a) => a.w < 160 || a.h < 120;
  function clampRect(r, a) {
    const w = Math.max(56, Math.min(r.w, a.w - 8)), ht = Math.max(40, Math.min(r.h, a.h - 8));
    return { x: Math.max(4, Math.min(r.x, a.w - w - 4)), y: Math.max(4, Math.min(r.y, a.h - ht - 4)), w, h: ht };
  }
  /** 저장해 둔 자리 p(그때 화면 aw×ah)를 지금 화면 a에 맞춤.
   *  가까운 가장자리에서의 거리를 지킵니다 — 오른쪽 위에 놓은 위젯은 화면 너비가 달라져도 오른쪽 위에 남습니다. */
  function fitFrom(p, a) {
    if (p.aw === Math.round(a.w) && p.ah === Math.round(a.h)) return clampRect(p, a);
    const right = p.x + p.w / 2 > p.aw / 2, bottom = p.y + p.h / 2 > p.ah / 2;
    if (Math.abs(p.aw - a.w) <= p.aw * 0.12 && Math.abs(p.ah - a.h) <= p.ah * 0.12) {
      const x = right ? a.w - (p.aw - p.x - p.w) - p.w : p.x;
      const y = bottom ? a.h - (p.ah - p.y - p.h) - p.h : p.y;
      return clampRect({ x, y, w: p.w, h: p.h }, a);
    }
    // 크기가 많이 다른 화면(접은 화면 등): 크기는 유지하고, 가장자리에서 떨어진 비율로 자리를 옮김
    const c = clampRect({ x: 0, y: 0, w: p.w, h: p.h }, a);
    const fx = right ? 1 - Math.min(1, (p.aw - p.x - p.w) / Math.max(1, p.aw - p.w)) : Math.min(1, p.x / Math.max(1, p.aw - p.w));
    const fy = bottom ? 1 - Math.min(1, (p.ah - p.y - p.h) / Math.max(1, p.ah - p.h)) : Math.min(1, p.y / Math.max(1, p.ah - p.h));
    return clampRect({ x: Math.round((a.w - c.w) * fx), y: Math.round((a.h - c.h) * fy), w: c.w, h: c.h }, a);
  }
  function rectFor(d, a) {
    const pos = d.pos || {};
    // 이 화면 크기에서 놓은 자리, 없으면 가장 비슷한 화면에서 놓은 자리를 바탕으로
    let best = pos[classKey(a)] || null, score = best ? Math.abs(best.aw - a.w) + Math.abs(best.ah - a.h) : Infinity;
    for (const k in pos) {
      const sc = Math.abs(pos[k].aw - a.w) + Math.abs(pos[k].ah - a.h);
      if (sc < score) { score = sc; best = pos[k]; }
    }
    if (!best) return clampRect({ x: d.x || 16, y: d.y || 16, w: d.w || 160, h: d.h || 80 }, a);
    return fitFrom(best, a);
  }
  /** 지금 화면에 맞춰 보여 줄 자리를 계산 (저장된 자리는 바꾸지 않음) */
  function layoutWidgets(area, why) {
    const a = area || wArea();
    if (tooSmall(a)) { if (!area && S.widgets.length) wlog("skip-small " + (why || ""), a); return; }
    const before = S.widgets.map((d) => [d.x, d.y, d.w, d.h].join()).join("|");
    for (const d of S.widgets) {
      if (!d.pos || !Object.keys(d.pos).length) { // 예전 버전에서 올린 위젯: 지금 자리를 이 화면의 자리로
        d.pos = {};
        if (!area) d.pos[classKey(a)] = { x: d.x || 16, y: d.y || 16, w: d.w || 160, h: d.h || 80, aw: Math.round(a.w), ah: Math.round(a.h), t: Date.now() };
      }
      Object.assign(d, rectFor(d, a));
    }
    if (!area && S.widgets.length && before !== S.widgets.map((d) => [d.x, d.y, d.w, d.h].join()).join("|")) wlog("layout " + (why || ""), a);
  }
  /** 사용자가 놓은 자리를 지금 화면 크기의 자리로 기억 (옮긴 위젯 하나만) */
  function commitWidget(d) {
    const a = wArea();
    if (tooSmall(a) || !d) return;
    const k = classKey(a), t = Date.now();
    d.pos = d.pos || {};
    d.pos[k] = { x: d.x, y: d.y, w: d.w, h: d.h, aw: Math.round(a.w), ah: Math.round(a.h), t };
    const keys = Object.keys(d.pos);
    if (keys.length > 6) { keys.sort((p, q) => (d.pos[p].t || 0) - (d.pos[q].t || 0)); for (const old of keys.slice(0, keys.length - 6)) delete d.pos[old]; }
    save();
    wlog("commit " + d.id, a);
  }
  // 위젯 자리 기록 (문제가 생기면 설정 > 정보에서 볼 수 있음). 최근 80건만 이 기기에 둡니다.
  function wlog(ev, a) {
    try {
      const L = JSON.parse(localStorage.getItem("desk_wlog") || "[]");
      const t = new Date();
      L.push([String(t.getHours()).padStart(2, "0") + ":" + String(t.getMinutes()).padStart(2, "0") + ":" + String(t.getSeconds()).padStart(2, "0"), ev,
        a ? Math.round(a.w) + "x" + Math.round(a.h) : "", innerWidth + "x" + innerHeight + "@" + devicePixelRatio,
        S.widgets.map((d) => d.id + ":" + Math.round(d.x) + "," + Math.round(d.y) + " " + Math.round(d.w) + "x" + Math.round(d.h)).join(" ")]);
      localStorage.setItem("desk_wlog", JSON.stringify(L.slice(-80)));
    } catch (_) {}
  }
  // 화면 크기가 바뀐 직후에는 크기 값이 늦게 따라오는 기기가 있어, 조금 뒤에 한 번 더 맞춥니다
  let relayoutTimers = [];
  function relayout(why) {
    const run = (w) => { for (const x of wins) applyRect(x); layoutWidgets(null, w); renderWidgetShells(); lastSync = ""; syncNative(); };
    run(why);
    for (const t of relayoutTimers) clearTimeout(t);
    relayoutTimers = [250, 900].map((ms) => setTimeout(() => run(why + "+" + ms), ms));
  }
  let staleTries = 0;
  function syncNative() {
    if (!A || syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(async () => {
      syncQueued = false;
      const layout = S.widgets.map((d) => ({ id: d.id, x: d.x, y: d.y, w: d.w, h: d.h }));
      const blockers = [];
      const add = (el) => {
        if (!el || el.hidden) return;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) blockers.push([Math.floor(r.left), Math.floor(r.top), Math.ceil(r.right), Math.ceil(r.bottom)]);
      };
      if (layout.length) { document.querySelectorAll(".win, .dicon").forEach(add); add($("taskbar")); add($("toast")); }
      const blockAll = wEdit || !$("start").hidden || !$("quick").hidden || !$("ctx").hidden || !$("wpick").hidden || !$("calfly").hidden || !$("snapfly").hidden;
      const key = JSON.stringify([layout, blockers, innerWidth, innerHeight, devicePixelRatio, blockAll, wDragging]);
      if (key === lastSync) return;
      lastSync = key;
      const r = await call("widgetSync", layout, blockers, innerWidth, blockAll, wDragging, devicePixelRatio, innerHeight);
      if (r && r.stale) {
        // 앱 쪽 화면 크기와 이 화면이 아는 크기가 아직 다름(크기가 바뀌는 중) → 잠시 뒤 다시 계산해서 알려 줌
        wlog("stale view=" + r.view + " " + r.stale);
        if (staleTries++ < 12) setTimeout(() => { layoutWidgets(null, "stale"); renderWidgetShells(); lastSync = ""; syncNative(); }, 200);
      } else if (r) staleTries = 0;
      if (r && Array.isArray(r.missing)) {
        const before = [...wMissing].join();
        wMissing.clear();
        for (const id of r.missing) wMissing.add(id);
        if (before !== [...wMissing].join()) renderWidgetShells();
      }
    });
  }
  const place = (el, d) => Object.assign(el.style, { left: d.x + "px", top: d.y + "px", width: d.w + "px", height: d.h + "px" });

  function renderWidgetShells() {
    const layer = $("wlayer");
    layer.textContent = "";
    layer.classList.toggle("edit", wEdit);
    $("wbar").hidden = !wEdit;
    for (const d of S.widgets) {
      if (!A) { const m = h("div", { class: "wshell mock", text: d.label || "위젯" }); place(m, d); layer.append(m); }
      else if (wMissing.has(d.id)) { const m = h("div", { class: "wshell miss", text: (d.label || "위젯") + " — 불러올 수 없습니다 (앱이 지워졌을 수 있음)" }); place(m, d); layer.append(m); }
      if (wEdit) layer.append(widgetFrame(d));
    }
  }
  function widgetFrame(d) {
    const size = h("span", { class: "wsize", hidden: "" });
    const del = h("button", { class: "wdel", "aria-label": (d.label || "위젯") + " 지우기", onclick: () => removeWidget(d.id) }, "✕");
    const rz = h("div", { class: "wrz", "aria-label": "크기 바꾸기" });
    const f = h("div", { class: "wframe" + (wSel === d.id ? " sel" : "") }, h("span", { class: "wname", text: d.label || "위젯" }), size, del, rz);
    place(f, d);
    del.addEventListener("pointerdown", (e) => e.stopPropagation());
    const track = (el, resize) => {
      let g = null;
      el.addEventListener("pointerdown", (e) => {
        if (e.button === 2) return;
        e.stopPropagation();
        el.setPointerCapture(e.pointerId);
        g = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: d.x, y: d.y, w: d.w, h: d.h, moved: false };
        wSel = d.id;
        for (const x of $("wlayer").querySelectorAll(".wframe")) x.classList.toggle("sel", x === f);
      });
      el.addEventListener("pointermove", (e) => {
        if (!g || e.pointerId !== g.id) return;
        const dx = e.clientX - g.sx, dy = e.clientY - g.sy, a = wArea();
        if (resize) {
          d.w = Math.max(56, Math.min(snap(g.w + dx), a.w - d.x - 4)); d.h = Math.max(40, Math.min(snap(g.h + dy), a.h - d.y - 4));
          size.hidden = false; size.textContent = Math.round(d.w) + " × " + Math.round(d.h);
        } else {
          d.x = Math.max(4, Math.min(snap(g.x + dx), a.w - d.w - 4)); d.y = Math.max(4, Math.min(snap(g.y + dy), a.h - d.h - 4));
        }
        place(f, d);
        g.moved = true;
        wDragging = true;
        syncNative();
      });
      const end = (e) => {
        if (!g || e.pointerId !== g.id) return;
        const moved = g.moved;
        g = null; size.hidden = true;
        wDragging = false;
        if (moved) commitWidget(d);
        syncNative();
        if (!A) renderWidgetShells();
      };
      el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
    };
    track(f, false); track(rz, true);
    return f;
  }
  function enterWidgetEdit(id) {
    if (!S.widgets.length) return openWidgetPicker();
    closePanels();
    for (const w of wins) { w.min = true; w.el.hidden = true; }   // 위젯이 보이게 창은 내려 둠
    renderTaskbar();
    wEdit = true; wSel = id == null ? null : id;
    renderWidgetShells(); syncNative();
  }
  function exitWidgetEdit() {
    if (!wEdit) return;
    wEdit = false; wSel = null; wDragging = false;
    save(); renderWidgetShells(); syncNative();
  }
  function removeWidget(id) {
    S.widgets = S.widgets.filter((d) => d.id !== id);
    wMissing.delete(id);
    save();
    if (!S.widgets.length) wEdit = false;
    renderWidgetShells(); syncNative(); redrawSettings();
  }
  function onWidgetAdded(info) {
    if (info.id == null || S.widgets.some((d) => d.id === info.id)) return;
    const a = wArea();
    // 크기: 위젯이 바라는 칸 수(있으면) 또는 최소 크기에서 시작
    let w = Math.max(info.w || 0, (info.cw || 0) * 76, 120), ht = Math.max(info.h || 0, (info.ch || 0) * 88, 72);
    w = Math.min(snap(w), a.w - 16); ht = Math.min(snap(ht), a.h - 16);
    // 자리: 오른쪽 위부터, 다른 위젯과 겹치지 않는 곳
    const hit = (x, y) => S.widgets.some((d) => x < d.x + d.w + 8 && x + w + 8 > d.x && y < d.y + d.h + 8 && y + ht + 8 > d.y);
    let x = Math.max(8, a.w - w - 16), y = 16, found = false;
    for (let cx = x; cx >= 8 && !found; cx -= 48) for (let cy = 16; cy + ht <= a.h - 8; cy += 16) if (!hit(cx, cy)) { x = cx; y = cy; found = true; break; }
    S.widgets.push({ id: info.id, x: snap(x), y: snap(y), w, h: ht, label: info.label || "", pos: {} });
    Object.assign(S.widgets[S.widgets.length - 1], clampRect(S.widgets[S.widgets.length - 1], a));
    commitWidget(S.widgets[S.widgets.length - 1]);
    renderWidgetShells(); syncNative(); redrawSettings();
    toast("위젯을 올렸습니다. 길게 누르면 옮기거나 크기를 바꿀 수 있습니다.");
  }

  // 위젯 고르기
  let wProviders = [];
  async function openWidgetPicker() {
    closePanels();
    $("wpick").hidden = false;
    $("wsearch").value = "";
    $("wpick-body").textContent = "";
    $("wpick-body").append(h("div", { class: "empty", text: "위젯 목록을 불러오는 중입니다…" }));
    const list = await call("widgetProviders");
    wProviders = Array.isArray(list) ? list : [];
    renderWidgetPicker();
  }
  function renderWidgetPicker() {
    const body = $("wpick-body");
    const q = $("wsearch").value.trim().toLowerCase();
    body.textContent = "";
    const list = q ? wProviders.filter((p) => (p.label + " " + p.app).toLowerCase().includes(q)) : wProviders;
    if (!list.length) return body.append(h("div", { class: "empty", text: wProviders.length ? "찾는 위젯이 없습니다." : "이 기기에 올릴 수 있는 위젯이 없습니다." }));
    let app = null, grid = null;
    for (const p of list) {
      if (p.app !== app) { app = p.app; grid = h("div", { class: "wlist" }); body.append(h("h3", { text: app }), grid); }
      const sizeText = p.cw && p.ch ? p.cw + " × " + p.ch + "칸" : p.w + " × " + p.h;
      grid.append(h("button", { class: "witem", title: p.label, onclick: () => pickWidget(p) },
        A ? h("img", { src: "/widgetpreview/" + p.i, alt: "", loading: "lazy", draggable: "false" }) : h("span", { class: "ico tile c" + (p.i % 4), text: p.label[0] }),
        h("b", { text: p.label }), h("small", { text: sizeText })));
    }
  }
  async function pickWidget(p) {
    $("wpick").hidden = true;
    const r = await call("addWidget", p.i);
    if (r && r.error) toast("올리지 못했습니다: " + r.error);
  }
  // 창을 옮기거나 메뉴가 열리고 닫힐 때마다 위젯을 덮는 것이 달라지므로, 화면이 바뀌면 다시 알려 줍니다
  if (A) new MutationObserver(syncNative).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden", "style", "class"] });

  // ---------- 이벤트 ----------
  function redrawSettings() {
    const w = wins.find((x) => x.key === "in:settings");
    if (w) w.el.querySelector(".win-body")._redraw();
  }
  function onPush(what, data) {
    if (what === "apps") { loadApps(); lastSync = ""; syncNative(); }
    else if (what === "layout") relayout("view-size");
    else if (what === "widget-added") onWidgetAdded(data || {});
    else if (what === "widget-failed") toast(data && data.reason === "denied" ? "위젯을 올리려면 확인 창에서 '허용'을 눌러 주세요." : data && data.reason === "canceled" ? "위젯 설정을 마치지 않아 올리지 않았습니다." : "이 위젯은 올리지 못했습니다.");
    else if (what === "widget-edit") enterWidgetEdit(data && data.id);
    else if (what === "wallpaper") {
      S.wallpaper = "custom"; save();
      refreshStatus().then(() => { applyLook(); redrawSettings(); toast("배경을 바꿨습니다"); });
    }
    else if (what === "wallpaper-failed") toast("이 사진은 읽지 못했습니다. 다른 사진을 골라 주세요.");
    else if (what === "status") refreshStatus().then(() => { applyLook(); redrawSettings(); });
    else if (what === "resume") relayout("resume");
    else if (what === "home") { closePanels(); exitWidgetEdit(); }
    else if (what === "back") {
      if (!$("ctx").hidden) { $("ctx").hidden = true; return; }
      if (!$("wpick").hidden) { $("wpick").hidden = true; return; }
      if (wEdit) return exitWidgetEdit();
      if (!$("snapfly").hidden) { $("snapfly").hidden = true; return; }
      if (!$("start").hidden || !$("quick").hidden || !$("calfly").hidden) return closePanels();
      const t = topWin();
      if (t) { t.min = true; t.el.hidden = true; const n = topWin(); if (n) focusWin(n); else renderTaskbar(); }
    }
  }
  $("start-btn").addEventListener("click", () => toggleStart());
  $("tray").addEventListener("click", toggleQuick);
  $("tray-clock").addEventListener("click", toggleCal);
  $("peek").addEventListener("click", () => { closePanels(); showDesktop(); });
  $("search-icon").append(svg(IC.search)); $("wsearch-icon").append(svg(IC.search));
  $("btn-widgets").append(svg(IC.widgets)); $("btn-desk-settings").append(svg(IC.gear)); $("btn-sys-settings").append(svg(IC.device));
  $("search").addEventListener("input", renderStart);
  $("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = $("start-body").querySelector(".litem, .gitem"); if (first) first.click(); }
    if (e.key === "Escape") closePanels();
  });
  $("btn-desk-settings").addEventListener("click", () => openApp("in:settings"));
  $("btn-widgets").addEventListener("click", openWidgetPicker);
  $("wpick-close").addEventListener("click", () => { $("wpick").hidden = true; });
  $("wsearch").addEventListener("input", renderWidgetPicker);
  $("wbar-add").addEventListener("click", openWidgetPicker);
  $("wbar-done").addEventListener("click", exitWidgetEdit);
  $("btn-sys-settings").addEventListener("click", () => { closePanels(); call("openSettings", "all"); });
  document.addEventListener("pointerdown", (e) => {
    const t = e.target;
    if (!$("ctx").hidden && !$("ctx").contains(t)) $("ctx").hidden = true;
    if (!$("start").hidden && !$("start").contains(t) && !$("start-btn").contains(t) && !$("ctx").contains(t)) { $("start").hidden = true; $("start-btn").classList.remove("on"); }
    if (!$("quick").hidden && !$("quick").contains(t) && !$("tray").contains(t)) { $("quick").hidden = true; $("tray").classList.remove("on"); }
    if (!$("calfly").hidden && !$("calfly").contains(t) && !$("tray-clock").contains(t)) { $("calfly").hidden = true; $("tray-clock").classList.remove("on"); }
    if (!$("snapfly").hidden && !$("snapfly").contains(t)) $("snapfly").hidden = true;
    if (!$("wpick").hidden && !$("wpick").contains(t)) $("wpick").hidden = true;
  }, true);
  $("desk").addEventListener("contextmenu", (e) => {
    if (e.target !== $("desk")) return;
    e.preventDefault();
    const c = $("ctx");
    c.textContent = "";
    const item = (label, fn) => h("button", { role: "menuitem", onclick: () => { c.hidden = true; fn(); } }, label);
    c.append(item("위젯 추가", openWidgetPicker));
    if (S.widgets.length) c.append(item("위젯 옮기기·크기 바꾸기", () => enterWidgetEdit()));
    c.append(item("내 사진으로 배경 바꾸기", pickWallpaper), item("기본 배경 넘겨 보기", () => { S.wallpaper = (S.wallpaper === "custom" ? 0 : ((S.wallpaper | 0) + 1) % 5); save(); applyLook(); }), item("데스크 설정", () => openApp("in:settings")), item("모든 창 내리기", showDesktop));
    c.hidden = false;
    const r = c.getBoundingClientRect();
    c.style.left = Math.max(6, Math.min(e.clientX, innerWidth - r.width - 6)) + "px";
    c.style.top = Math.max(6, Math.min(e.clientY, innerHeight - r.height - 6)) + "px";
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("wpick").hidden) { $("wpick").hidden = true; return; }
    if (e.key === "Escape" && wEdit && $("start").hidden && $("quick").hidden && $("calfly").hidden) return exitWidgetEdit();
    if (e.key === "Meta" || (e.key === "Escape" && (!$("start").hidden || !$("quick").hidden || !$("calfly").hidden || !$("snapfly").hidden))) { e.preventDefault(); if (e.key === "Meta") toggleStart(); else closePanels(); }
  });
  addEventListener("resize", () => relayout("resize"));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) relayout("shown"); });

  // ---------- 시작 ----------
  applyLook();
  for (const b of BUILTIN.concat(HIDDEN)) byKey.set(b.key, b);
  if (!S.desktop) S.desktop = BUILTIN.map((b) => b.key);
  renderDesk(); renderTaskbar(); renderTray(); tick();
  layoutWidgets(); renderWidgetShells(); syncNative();
  setInterval(tick, 10000);
  setInterval(refreshStatus, 60000);
  refreshStatus().then(applyLook);
  loadApps().then(selftest);

  // ---------- 자동 점검 (시험용 빌드, ?selftest) ----------
  async function selftest() {
    if (!/[?&]selftest\b/.test(location.search)) return;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const errors = [];
    addEventListener("error", (e) => errors.push(String(e.message)));
    if (/[?&]selftest=2/.test(location.search)) {
      // 2단계: 앱을 완전히 껐다 켠 뒤 — 위젯이 놓아 둔 자리에 그대로 있는지
      try {
        await wait(3000);
        const was = JSON.parse(localStorage.getItem("desk_test_probe") || "null");
        const probe = await call("widgetProbe");
        const v = Array.isArray(probe) ? probe[0] : null;
        const same = !!(was && v && v.id === was.id && v.sx === was.sx && v.sy === was.sy && v.w === was.w && v.h === was.h && v.shown && v.kids > 0);
        log((same ? "PASS" : "FAIL") + " widget kept place after restart before=" + JSON.stringify(was) + " after=" + JSON.stringify(v));
        log("SHOT2");
        await wait(4000);
        if (S.widgets[0]) removeWidget(S.widgets[0].id);
        await wait(1000);
        const left = await call("widgetProbe");
        log((Array.isArray(left) && left.length === 0 && S.widgets.length === 0 ? "PASS" : "FAIL") + " widget removed native=" + JSON.stringify(left));
      } catch (e) {
        log("FAIL exception " + (e && e.stack || e));
      }
      log("errors=" + errors.length + " " + errors.slice(0, 3).join(" | "));
      log("DONE2");
      return;
    }
    try {
      log("apps count=" + apps.length + " status=" + JSON.stringify(status));
      toggleStart(true);
      await wait(400);
      const pinnedShown = $("start-body").querySelectorAll(".gitem").length;
      $("all-apps").click();
      await wait(400);
      const shown = $("start-body").querySelectorAll(".litem").length - BUILTIN.length;
      log((pinnedShown >= BUILTIN.length && Math.abs(($("start").getBoundingClientRect().left + $("start").getBoundingClientRect().right) / 2 - innerWidth / 2) <= 2 ? "PASS" : "FAIL") + " start home pinned=" + pinnedShown + " centered left=" + Math.round($("start").getBoundingClientRect().left));
      // 목록의 아이콘은 보일 때 읽으므로(lazy), 점검은 첫 앱 아이콘을 직접 읽어 봄
      const iconOk = apps.length > 0 && await new Promise((r) => { const im = new Image(); im.onload = () => r(im.naturalWidth > 0); im.onerror = () => r(false); im.src = "/appicon/" + apps[0].pkg + "/" + apps[0].cls; setTimeout(() => r(false), 6000); });
      log((shown > 0 && shown === apps.length && iconOk ? "PASS" : "FAIL") + " start menu items=" + shown + " iconLoaded=" + iconOk);
      $("search").value = "계산"; renderStart();
      const found = $("start-body").querySelectorAll(".litem").length;
      log((found >= 1 ? "PASS" : "FAIL") + " search '계산' found=" + found);
      closePanels();
      const w = openBuiltin("in:calc");
      const body = w.el.querySelector(".win-body");
      for (const k of ["1", "2", "×", "3", "+", "4", "="]) body._press(k);
      log((body._value() === "40" ? "PASS" : "FAIL") + " calculator 12×3+4=" + body._value());
      w.max = false; Object.assign(w, { x: 20, y: 20, w: 300, h: 400 }); applyRect(w);
      const before = w.el.getBoundingClientRect();
      w.maxBtn.click();
      const after = w.el.getBoundingClientRect();
      log((after.width > before.width && w.max ? "PASS" : "FAIL") + " window maximize " + Math.round(before.width) + "→" + Math.round(after.width));
      w.maxBtn.click();
      openBuiltin("in:notes");
      const tb = $("task-items").querySelectorAll(".titem.run").length;
      log((tb >= 2 && wins.length === 2 ? "PASS" : "FAIL") + " taskbar running=" + tb + " windows=" + wins.length);
      // 내 사진 배경: 사진 고르기 대신 점검용 그림을 같은 길로 저장 → 화면에 걸리는지
      await call("testWallpaper");
      onPush("wallpaper");
      await wait(1200);
      const wpOk = await new Promise((r) => { const im = new Image(); im.onload = () => r(im.naturalWidth === 900); im.onerror = () => r(false); im.src = "/wallpaper/current.jpg?t=" + Date.now(); });
      const bg = A ? String(await call("lookProbe")) : getComputedStyle(document.body).backgroundImage;
      log((wpOk && document.body.classList.contains("wp-custom") && bg.includes("/wallpaper/current.jpg") ? "PASS" : "FAIL") + " custom wallpaper loaded=" + wpOk + " bg=" + bg.slice(0, 80));
      for (const x of wins) { x.max = false; x.min = true; x.el.hidden = true; }
      renderTaskbar();
      // 위젯: 시험용 위젯을 고르기 → 올리기 → 실제 뷰가 놓였는지 → 누르면 위젯이 받는지 → 메뉴가 열려 있으면 받지 않는지
      const provs = await call("widgetProviders");
      const mine = Array.isArray(provs) ? provs.find((p) => p.pkg === status.pkg) : null;
      let wd = null;
      if (!mine) log("FAIL widget: 시험용 위젯이 목록에 없음 (목록 " + (Array.isArray(provs) ? provs.length : provs) + "개)");
      else {
        await call("addWidget", mine.i);
        for (let i = 0; i < 40 && !S.widgets.length; i++) await wait(250);
        await wait(1500);
        let probe = await call("widgetProbe");
        let v = Array.isArray(probe) ? probe[0] : null;
        wd = S.widgets[0] || null;
        const ok = !!(v && wd && v.id === wd.id && v.shown && v.kids > 0 && v.w > 50);
        log((ok ? "PASS" : "FAIL") + " widget added probe=" + JSON.stringify(probe) + " state=" + JSON.stringify(S.widgets) + " providers=" + provs.length);
        if (ok) {
          log("WIDGET-AT " + Math.round(v.sx + v.w / 2) + " " + Math.round(v.sy + v.h / 2));   // 점검 스크립트가 여기를 누름 → 위젯이 받아야 함
          await wait(9000);
          toggleQuick();
          await wait(600);
          log("WIDGET-BLOCKED-AT " + Math.round(v.sx + v.w / 2) + " " + Math.round(v.sy + v.h / 2)); // 메뉴가 열려 있을 때는 위젯이 받지 않아야 함
          await wait(9000);
          closePanels();
          enterWidgetEdit(wd.id);
          const frames = $("wlayer").querySelectorAll(".wframe").length;
          wd.w += 24; wd.x -= 32;
          commitWidget(wd); renderWidgetShells(); syncNative();
          await wait(1000);
          probe = await call("widgetProbe");
          const v2 = Array.isArray(probe) ? probe[0] : null;
          log((frames === 1 && v2 && v2.w > v.w && v2.sx < v.sx ? "PASS" : "FAIL") + " widget edit frames=" + frames + " width " + v.w + "→" + (v2 && v2.w) + " x " + v.sx + "→" + (v2 && v2.sx));
          exitWidgetEdit();
          // 화면이 잠깐 작아져도(키보드·켜지는 도중) 놓아 둔 자리가 바뀌지 않는지
          const a0 = wArea(), keep = { x: wd.x, y: wd.y, w: wd.w, h: wd.h }, saved = JSON.stringify(wd.pos);
          wd.pos[classKey(a0)].y = a0.h - wd.h - 12; layoutWidgets();      // 맨 아래에 놓았다고 치고
          const low = wd.y;
          layoutWidgets({ w: a0.w, h: 220 });                             // 화면 높이가 220으로 줄었다가
          const squeezed = wd.y;
          layoutWidgets();                                                // 원래대로 돌아옴
          const back = wd.y === low && squeezed < low && squeezed + wd.h <= 220;
          wd.pos = JSON.parse(saved); layoutWidgets();
          const restored = wd.x === keep.x && wd.y === keep.y && wd.w === keep.w && wd.h === keep.h;
          log((back && restored ? "PASS" : "FAIL") + " widget place survives small screen low=" + low + " squeezed=" + squeezed + " back=" + wd.y + " restored=" + restored);
          // 오른쪽 위에 놓은 위젯: 화면이 조금 넓어지거나(+70) 많이 좁아져도(접은 화면) 오른쪽에 붙어 있는지
          const gapR = a0.w - wd.x - wd.w;
          layoutWidgets({ w: a0.w + 70, h: a0.h - 30 }); const gapWide = a0.w + 70 - wd.x - wd.w;
          layoutWidgets({ w: Math.round(a0.w * 0.45), h: Math.round(a0.h * 1.6) }); const narrowRight = wd.x + wd.w / 2 > a0.w * 0.45 / 2;
          layoutWidgets();
          log((gapWide === gapR && narrowRight && wd.x === keep.x ? "PASS" : "FAIL") + " widget stays on right edge gap=" + gapR + " wider=" + gapWide + " narrowRight=" + narrowRight);
          save(); renderWidgetShells(); lastSync = ""; syncNative();
          await wait(800);
          // 실제로 화면이 작아졌다가(접은 화면·팝업 창) 다시 커져도 위젯 뷰가 같은 자리에 있는지
          // 점검 스크립트가 RESIZE-n 을 보면 화면 크기를 줄였다가 되돌립니다 (2번째는 다른 앱을 띄운 채로)
          for (const n of [1, 2]) {
            const pb = await call("widgetProbe");
            const vb = Array.isArray(pb) ? pb[0] : null;
            log("RESIZE-" + n);
            await wait(22000);
            const pa = await call("widgetProbe");
            const va = Array.isArray(pa) ? pa[0] : null;
            const same = !!(vb && va && Math.abs(va.sx - vb.sx) <= 2 && Math.abs(va.sy - vb.sy) <= 2 && va.w === vb.w && va.h === vb.h && va.shown);
            log((same ? "PASS" : "FAIL") + " widget kept place after screen shrink " + n + " before=" + JSON.stringify(vb) + " after=" + JSON.stringify(va) + " js=" + JSON.stringify({ x: wd.x, y: wd.y, w: wd.w, h: wd.h, area: wArea(), iw: innerWidth, dpr: devicePixelRatio, pos: wd.pos }));
          }
          const pv = await call("widgetProbe");
          localStorage.setItem("desk_test_probe", JSON.stringify(Array.isArray(pv) ? pv[0] : null));
        }
      }
      await wait(600);
      log("SHOT");            // 여기서 화면을 찍음
      await wait(4000);
      const settings = apps.find((a) => a.pkg === "com.android.settings") || apps[0];
      const r = settings ? await openApp(settings.key, "window") : null;
      log((r && r.ok ? "PASS" : "FAIL") + " launch " + (settings && settings.pkg) + " → " + JSON.stringify(r));

    } catch (e) {
      log("FAIL exception " + (e && e.stack || e));
    }
    log("errors=" + errors.length + " " + errors.slice(0, 3).join(" | "));
    log("DONE");
  }
})();
