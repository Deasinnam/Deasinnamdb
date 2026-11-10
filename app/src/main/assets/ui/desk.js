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
      if (m.push) return onPush(m.push);
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
  let toastTimer = 0;
  function toast(text) {
    const t = $("toast");
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- 저장되는 설정 ----------
  const DEFAULTS = { pins: null, desktop: null, openMode: "window", wallpaper: 0, theme: "dark", notes: "", wins: {} };
  let S = Object.assign({}, DEFAULTS);
  try { Object.assign(S, JSON.parse(localStorage.getItem("desk_state") || "{}")); } catch (_) {}
  const save = () => { try { localStorage.setItem("desk_state", JSON.stringify(S)); } catch (_) {} };

  // ---------- 앱 목록 ----------
  // 내부 앱(이 화면 안에서 창으로 열리는 작은 도구)
  const BUILTIN = [
    { key: "in:notes", label: "메모", glyph: "메", color: 0 },
    { key: "in:calc", label: "계산기", glyph: "계", color: 1 },
    { key: "in:cal", label: "달력", glyph: "달", color: 2 },
    { key: "in:settings", label: "데스크 설정", glyph: "설", color: 3 },
  ];
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
    for (const b of BUILTIN) byKey.set(b.key, b);
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
    const pins = (S.pins || []).map((k) => byKey.get(k)).filter(Boolean);
    if (pins.length) body.append(h("h3", { text: "고정한 앱" }), h("div", { class: "grid" }, pins.map((a) => gridItem(a, "gitem"))));
    body.append(h("h3", { text: "덜누름 데스크 도구" }), h("div", { class: "grid" }, BUILTIN.map((a) => gridItem(a, "gitem"))));
    body.append(h("h3", { text: "모든 앱 " + apps.length + "개" }));
    body.append(apps.length ? h("div", { class: "list" }, apps.map((a) => gridItem(a, "litem"))) : h("div", { class: "empty", text: "앱 목록을 불러오는 중입니다…" }));
  }
  function toggleStart(open) {
    const s = $("start");
    const want = open == null ? s.hidden : open;
    closePanels();
    if (!want) return;
    s.hidden = false;
    $("start-btn").classList.add("on");
    $("search").value = "";
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
    const netName = { wifi: "와이파이 연결됨", cell: "모바일 데이터", wired: "유선 연결", other: "연결됨", none: "인터넷 연결 없음" }[status.net] || "";
    q.append(h("div", { class: "qinfo" }, h("span", { text: netName }), h("span", { text: status.battery >= 0 ? "배터리 " + status.battery + "%" + (status.charging ? " · 충전 중" : "") : "" })));
    const btn = (label, kind) => h("button", { class: "qbtn", onclick: () => { closePanels(); call("openSettings", kind); } }, label);
    q.append(h("div", { class: "qgrid" }, btn("와이파이", "wifi"), btn("블루투스", "bluetooth"), btn("디스플레이", "display"), btn("소리", "sound"), btn("배터리", "battery"), btn("전체 설정", "all")));
    q.append(h("div", { class: "qgrid" },
      h("button", { class: "qbtn", onclick: () => openApp("in:cal") }, "달력"),
      h("button", { class: "qbtn", onclick: () => openApp("in:settings") }, "데스크 설정"),
      h("button", { class: "qbtn", onclick: () => { closePanels(); showDesktop(); } }, "바탕화면 보기")));
    q.hidden = false;
    $("tray").classList.add("on");
  }
  function closePanels() {
    $("start").hidden = true; $("quick").hidden = true; $("ctx").hidden = true;
    $("start-btn").classList.remove("on"); $("tray").classList.remove("on");
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
    w.maxBtn = h("button", { class: "win-ctl", onclick: () => { w.max = !w.max; applyRect(w); remember(w); } });
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
      const s = snapAt(e), a2 = area();
      if (s === "max") w.max = true;
      else if (s === "left") Object.assign(w, { x: 0, y: 0, w: Math.round(a2.w / 2), h: a2.h });
      else if (s === "right") Object.assign(w, { x: Math.round(a2.w / 2), y: 0, w: Math.round(a2.w / 2), h: a2.h });
      applyRect(w); remember(w);
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
    document.body.className = (custom ? "wp-custom" : "wp-" + (S.wallpaper === "custom" ? 0 : S.wallpaper | 0)) + (S.theme === "light" ? " light" : "");
    document.body.style.backgroundImage = custom ? customUrl() : "";
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
        h("h4", { text: "색" }),
        seg(S.theme, [["dark", "어둡게"], ["light", "밝게"]], (v) => { S.theme = v; }),
        h("h4", { text: "홈 앱" }),
        h("p", { text: status.isDefault ? "덜누름 데스크가 기본 홈 앱입니다. 홈 버튼을 누르면 이 화면으로 옵니다." : "기본 홈 앱으로 정하면 홈 버튼을 누를 때 이 화면이 나옵니다. 언제든 기기 설정에서 원래 홈으로 되돌릴 수 있습니다." }),
        h("div", null,
          status.isDefault ? null : h("button", { class: "btn primary", onclick: () => call("makeDefault") }, "기본 홈 앱으로 정하기"),
          h("button", { class: "btn", onclick: () => call("openSettings", "home") }, "홈 앱 설정 열기")),
        h("h4", { text: "정보" }),
        h("p", { text: "덜누름 데스크 " + (status.version || "") + " · 인터넷 권한 없이 기기 안에서만 동작합니다." })));
    };
    draw();
    body._redraw = draw;
  }

  // ---------- 이벤트 ----------
  function redrawSettings() {
    const w = wins.find((x) => x.key === "in:settings");
    if (w) w.el.querySelector(".win-body")._redraw();
  }
  function onPush(what) {
    if (what === "apps") loadApps();
    else if (what === "wallpaper") {
      S.wallpaper = "custom"; save();
      refreshStatus().then(() => { applyLook(); redrawSettings(); toast("배경을 바꿨습니다"); });
    }
    else if (what === "wallpaper-failed") toast("이 사진은 읽지 못했습니다. 다른 사진을 골라 주세요.");
    else if (what === "status") refreshStatus().then(() => { applyLook(); redrawSettings(); });
    else if (what === "home") { closePanels(); }
    else if (what === "back") {
      if (!$("ctx").hidden) { $("ctx").hidden = true; return; }
      if (!$("start").hidden || !$("quick").hidden) return closePanels();
      const t = topWin();
      if (t) { t.min = true; t.el.hidden = true; const n = topWin(); if (n) focusWin(n); else renderTaskbar(); }
    }
  }
  $("start-btn").addEventListener("click", () => toggleStart());
  $("tray").addEventListener("click", toggleQuick);
  $("search").addEventListener("input", renderStart);
  $("search").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { const first = $("start-body").querySelector(".litem, .gitem"); if (first) first.click(); }
    if (e.key === "Escape") closePanels();
  });
  $("btn-desk-settings").addEventListener("click", () => openApp("in:settings"));
  $("btn-sys-settings").addEventListener("click", () => { closePanels(); call("openSettings", "all"); });
  document.addEventListener("pointerdown", (e) => {
    const t = e.target;
    if (!$("ctx").hidden && !$("ctx").contains(t)) $("ctx").hidden = true;
    if (!$("start").hidden && !$("start").contains(t) && !$("start-btn").contains(t) && !$("ctx").contains(t)) { $("start").hidden = true; $("start-btn").classList.remove("on"); }
    if (!$("quick").hidden && !$("quick").contains(t) && !$("tray").contains(t)) { $("quick").hidden = true; $("tray").classList.remove("on"); }
  }, true);
  $("desk").addEventListener("contextmenu", (e) => {
    if (e.target !== $("desk")) return;
    e.preventDefault();
    const c = $("ctx");
    c.textContent = "";
    const item = (label, fn) => h("button", { role: "menuitem", onclick: () => { c.hidden = true; fn(); } }, label);
    c.append(item("내 사진으로 배경 바꾸기", pickWallpaper), item("기본 배경 넘겨 보기", () => { S.wallpaper = (S.wallpaper === "custom" ? 0 : ((S.wallpaper | 0) + 1) % 5); save(); applyLook(); }), item("데스크 설정", () => openApp("in:settings")), item("모든 창 내리기", showDesktop));
    c.hidden = false;
    const r = c.getBoundingClientRect();
    c.style.left = Math.max(6, Math.min(e.clientX, innerWidth - r.width - 6)) + "px";
    c.style.top = Math.max(6, Math.min(e.clientY, innerHeight - r.height - 6)) + "px";
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Meta" || (e.key === "Escape" && (!$("start").hidden || !$("quick").hidden))) { e.preventDefault(); if (e.key === "Meta") toggleStart(); else closePanels(); }
  });
  addEventListener("resize", () => { for (const w of wins) applyRect(w); });

  // ---------- 시작 ----------
  applyLook();
  for (const b of BUILTIN) byKey.set(b.key, b);
  if (!S.desktop) S.desktop = BUILTIN.map((b) => b.key);
  renderDesk(); renderTaskbar(); renderTray(); tick();
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
    try {
      log("apps count=" + apps.length + " status=" + JSON.stringify(status));
      toggleStart(true);
      await wait(600);
      const shown = $("start-body").querySelectorAll(".litem").length;
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
      const bg = getComputedStyle(document.body).backgroundImage;
      log((wpOk && document.body.classList.contains("wp-custom") && bg.includes("/wallpaper/current.jpg") ? "PASS" : "FAIL") + " custom wallpaper loaded=" + wpOk + " bg=" + bg.slice(0, 80));
      for (const x of wins) { x.max = false; x.min = true; x.el.hidden = true; }
      renderTaskbar();
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
