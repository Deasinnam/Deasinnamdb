/* 덜씀 (갤럭시) 화면. 안드로이드 쪽 기능은 window.S (MainActivity.Bridge) */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var SELFTEST = /selftest/.test(location.search);

  // 미리보기(브라우저)용 가짜 연결
  var P = window.S || (function () {
    var fake = { avail: 4.1e9 }, bat = { level: 82, plugged: false, saverOn: false, auto: false, saver: true, dim: true, bright: 35, applied: false };
    function later(k, o, ms) { setTimeout(function () { window.done(k, o); }, ms || 600); }
    return {
      mem: function () { fake.avail += (Math.random() - .5) * 1e8; var t = 12e9; return JSON.stringify({ total: t, avail: fake.avail, used: t - fake.avail, pct: Math.round((1 - fake.avail / t) * 100), level: "정상" }); },
      perms: function () { return JSON.stringify({ usage: true, write: false, shzInstalled: true, shzRunning: true, shizuku: false, notif: true, media: false }); },
      openUsage: function () {}, openWrite: function () {}, openStorage: function () {}, openSaver: function () {}, openReleases: function () {},
      shizukuConnect: function () { return "asked"; }, askNotif: function () {}, askMedia: function () {},
      idle: function () { later("idle", [{ pkg: "com.a", label: "인스타그램", ago: 95 }, { pkg: "com.b", label: "쿠팡", ago: 240 }, { pkg: "com.c", label: "네이버 지도", ago: 42 }]); },
      memClean: function () { fake.avail += 9e8; later("memDone", { stopped: 3, freed: 9.1e8, full: false }, 1500); },
      storage: function () { later("storage", { free: 203.4e9, total: 512e9, cache: 2.31e9, apks: [], apkBytes: -1, trashCount: -1, trashBytes: -1 }, 900); },
      storageClean: function () { later("storageDone", { cache: -1 }, 900); },
      battery: function () { return JSON.stringify(bat); }, setBattery: function (j) { var o = JSON.parse(j); for (var k in o) bat[k] = o[k]; },
      batteryNow: function () { later("batDone", { did: "밝기 35%" }); }, batteryRestore: function () { later("batDone", { restored: true }); },
      old: function () { return JSON.stringify({ animLight: false, autoClean: false, autoLast: 0 }); }, setAnim: function (l) { later("animDone", { ok: false, light: l }); }, setAutoClean: function () {},
      version: function () { return "미리보기"; }, report: function (s) { console.log("SELFTEST", s); }, tap: function () {}
    };
  })();

  function J(s, d) { try { return JSON.parse(s); } catch (e) { return d || {}; } }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function gb(b) { if (b == null || b < 0) return "–"; if (b >= 1e9) return (b / 1e9).toFixed(b >= 1e11 ? 0 : 1) + " GB"; if (b >= 1e6) return Math.round(b / 1e6) + " MB"; return Math.round(b / 1e3) + " KB"; }
  var tt;
  function toast(t) { var e = $("toast"); e.textContent = t; e.hidden = false; clearTimeout(tt); tt = setTimeout(function () { e.hidden = true; }, 2600); }

  // ---------- 메모리 카드 + 최근 2분 그래프 ----------
  var hist = [];
  function drawMem() {
    var m = J(P.mem());
    $("memPct").textContent = m.pct + "%";
    $("memUsed").textContent = gb(m.used) + " 사용 중";
    $("memTotal").textContent = "총 " + gb(m.total) + " · 여유 " + gb(m.avail);
    $("barUsed").style.width = m.pct + "%";
    $("barUsed").parentNode.className = "membar" + (m.level === "주의" ? " warn" : m.level === "위험" ? " bad" : "");
    var pill = $("memPill"); pill.textContent = m.level; pill.className = "pill" + (m.level === "주의" ? " warn" : m.level === "위험" ? " bad" : "");
    hist.push(m.pct); if (hist.length > 60) hist.shift();
    var c = $("graph"), w = c.clientWidth, h = c.clientHeight, r = window.devicePixelRatio || 1;
    if (c.width !== w * r) { c.width = w * r; c.height = h * r; }
    var g = c.getContext("2d"); g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h);
    if (hist.length < 2) return m;
    var step = w / 59, x0 = w - (hist.length - 1) * step;
    function y(v) { return h - 4 - (v / 100) * (h - 10); }
    g.beginPath(); g.moveTo(x0, h);
    hist.forEach(function (v, i) { g.lineTo(x0 + i * step, y(v)); });
    g.lineTo(w, h); g.closePath();
    var grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "rgba(47,184,90,.28)"); grd.addColorStop(1, "rgba(47,184,90,.04)");
    g.fillStyle = grd; g.fill();
    g.beginPath(); hist.forEach(function (v, i) { var X = x0 + i * step; if (i) g.lineTo(X, y(v)); else g.moveTo(X, y(v)); });
    g.strokeStyle = "#2fb85a"; g.lineWidth = 2; g.stroke();
    return m;
  }

  // ---------- 권한 ----------
  var perm = {};
  function readPerms() { perm = J(P.perms()); return perm; }
  function needBtn(label, fn) { var b = el("button", "need", label); b.type = "button"; b.onclick = function (e) { e.preventDefault(); e.stopPropagation(); fn(); }; return b; }
  function guide() { if (window.ShizukuGuide) ShizukuGuide.open("sseum", function () { readPerms(); if (cur) show(cur); }); }
  function shz() {
    if (!perm.shzRunning) { guide(); return; } // 아직 켜지 않았으면 그림 안내부터
    var r = P.shizukuConnect();
    toast(r === "install" ? "Shizuku를 설치한 뒤 무선 디버깅으로 시작해 주세요" : r === "start" ? "Shizuku 앱에서 '시작'을 누른 뒤 돌아와 주세요" : r === "ok" ? "Shizuku가 연결돼 있습니다" : "허락 창에서 '허용'을 눌러 주세요");
  }

  // ---------- 패널 ----------
  var cur = "", res = {};
  function opt(box, o) {
    var row = el("label", "opt" + (o.off ? " off" : ""));
    var cb = el("input"); cb.type = "checkbox"; cb.checked = !!o.on && !o.off; cb.disabled = !!o.off;
    row.appendChild(cb); row.appendChild(el("b", null, o.title));
    if (o.need) row.appendChild(o.need);
    var sp = el("span", null, o.sub); row.appendChild(sp);
    box.appendChild(row);
    return { row: row, cb: cb, sub: sp };
  }
  function sw(box, title, sub, on, onChange) {
    var row = el("div", "opt sw-row"); row.appendChild(el("b", null, title));
    var s = el("label", "sw"), i = el("input"); i.type = "checkbox"; i.checked = !!on; s.appendChild(i); s.appendChild(el("i"));
    i.onchange = function () { P.tap(); onChange(i.checked, i); };
    row.appendChild(s); row.appendChild(el("span", null, sub)); box.appendChild(row);
    return i;
  }
  function runBtn(box, cls, label, fn) { var b = el("button", "run " + cls, label); b.type = "button"; b.onclick = function () { P.tap(); fn(b); }; box.appendChild(b); return b; }

  function show(p) {
    cur = p; res = {};
    Array.prototype.forEach.call(document.querySelectorAll(".dbtn"), function (b) { b.classList.toggle("on", b.dataset.p === p); });
    readPerms();
    var box = $("panel"); box.textContent = "";
    ({ mem: memPanel, sto: stoPanel, bat: batPanel, old: oldPanel, perm: permPanel })[p](box);
    if (!SELFTEST) setTimeout(function () { box.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 30);
  }

  // 메모리 덜씀
  var idleSel = {};
  function memPanel(box) {
    box.appendChild(el("p", "p-lead", "쓰지 않는 앱과 화면에 없는 앱의 남은 메모리를 정리해 여유 메모리를 늘립니다."));
    var a = opt(box, { title: "안 쓰는 앱 종료", sub: perm.usage ? "30분 이상 쓰지 않은 앱을 찾는 중…" : "'사용 기록 접근'을 켜면 30분 넘게 안 쓴 앱을 찾아 자동으로 체크합니다",
      on: true, off: !perm.usage, need: perm.usage ? null : needBtn("켜기", P.openUsage) });
    var chips = el("div", "chips"); a.row.appendChild(chips);
    var b = opt(box, { title: "남은 메모리 정리", sub: "화면에 없는 앱이 붙잡고 있는 메모리를 비웁니다", on: true });
    if (!perm.shizuku) { var hint = el("p", "p-lead hint", "지금은 안드로이드가 허락하는 만큼만 정리합니다. Shizuku를 연결하면 고른 앱을 완전히 끕니다. "); hint.appendChild(needBtn("Shizuku 연결", shz)); box.appendChild(hint); }
    var out = el("div", "result");
    runBtn(box, "mem", "메모리 덜씀 실행", function (btn) {
      var pk = Object.keys(idleSel).filter(function (k) { return idleSel[k] && a.cb.checked; });
      btn.classList.add("busy"); btn.textContent = "정리하는 중…";
      res.mem = function (r) {
        btn.classList.remove("busy"); btn.textContent = "메모리 덜씀 실행";
        out.textContent = "여유 메모리 +" + gb(r.freed) + (r.stopped ? " · 앱 " + r.stopped + "개 " + (r.full ? "종료" : "정리") : "");
        drawMem(); if (perm.usage) P.idle(30);
      };
      P.memClean(JSON.stringify({ pkgs: pk, bg: b.cb.checked }));
    });
    box.appendChild(out);
    res.idle = function (list) {
      chips.textContent = ""; idleSel = {};
      a.sub.textContent = list.length ? "30분 이상 쓰지 않은 앱 " + list.length + "개가 자동으로 체크됩니다" : "30분 넘게 안 쓴 앱이 없습니다";
      list.slice(0, 24).forEach(function (x) {
        idleSel[x.pkg] = true;
        var l = el("label"), c = el("input"); c.type = "checkbox"; c.checked = true; c.onchange = function () { idleSel[x.pkg] = c.checked; };
        l.appendChild(c); l.appendChild(document.createTextNode(x.label + " ")); l.appendChild(el("em", null, x.ago >= 60 ? Math.floor(x.ago / 60) + "시간" : x.ago + "분"));
        chips.appendChild(l);
      });
    };
    if (perm.usage) P.idle(30);
  }

  // 저장공간 덜씀
  function stoPanel(box) {
    var lead = el("p", "p-lead", "여유 공간을 확인하는 중… · 지워도 되는 것만 골라 정리합니다."); box.appendChild(lead);
    var c = opt(box, { title: "앱 캐시 파일 삭제", sub: "크기 확인 중…", on: true, off: !perm.shizuku, need: perm.shizuku ? null : needBtn("Shizuku 연결", shz) });
    var k = opt(box, { title: "다운로드 폴더의 설치 파일(APK)", sub: perm.shizuku ? "찾는 중…" : "설치하고 남은 APK 파일 찾기 · Shizuku 연결 필요", on: true, off: !perm.shizuku });
    var t = opt(box, { title: "휴지통 비우기", sub: perm.media ? "확인 중…" : "사진 · 동영상 휴지통 · 볼 권한이 필요합니다", on: false, off: !perm.media, need: perm.media ? null : needBtn("허용", P.askMedia) });
    var out = el("div", "result"), info = {};
    var run = runBtn(box, "sto", "저장공간 덜씀 실행", function (btn) {
      if (!perm.shizuku && !t.cb.checked) { P.openStorage(); toast("Shizuku 없이 캐시를 지우려면 설정 › 저장공간에서 정리하세요"); return; }
      btn.classList.add("busy"); btn.textContent = "정리하는 중…";
      P.storageClean(JSON.stringify({ cache: c.cb.checked, apks: k.cb.checked ? info.apks : null, trash: t.cb.checked }));
    });
    box.appendChild(out);
    if (!perm.shizuku) { var g = el("button", "run lite", "설정 › 저장공간 열기"); g.type = "button"; g.onclick = P.openStorage; box.insertBefore(g, out); }
    res.storage = function (s) {
      info = s;
      lead.textContent = "현재 여유 공간 " + gb(s.free) + " · 지워도 되는 것만 골라 정리합니다.";
      c.sub.textContent = s.cache >= 0 ? "앱들이 다시 만들 수 있는 임시 파일 " + gb(s.cache) + (perm.shizuku ? "" : " · 지우려면 Shizuku 연결") : (perm.usage ? "크기를 알 수 없음" : "크기를 보려면 '사용 기록 접근'을 켜세요");
      if (perm.shizuku) { var n = (s.apks || []).length; k.sub.textContent = n ? n + "개 · " + gb(s.apkBytes) + " — 이미 설치한 앱은 그대로 남습니다" : "남은 설치 파일이 없습니다"; if (!n) k.cb.checked = false; }
      if (perm.media && s.trashCount < 0) { t.sub.textContent = "휴지통 비우기는 안드로이드 11 이상에서 쓸 수 있습니다"; t.cb.checked = false; t.cb.disabled = true; }
      else if (perm.media) { t.sub.textContent = s.trashCount > 0 ? s.trashCount + "개 · " + gb(s.trashBytes) + " — 비운 파일은 되돌릴 수 없습니다" : "휴지통이 비어 있습니다"; if (!(s.trashCount > 0)) { t.cb.checked = false; t.cb.disabled = true; } }
    };
    res.storageDone = function (r) {
      run.classList.remove("busy"); run.textContent = "저장공간 덜씀 실행";
      var parts = [];
      if (r.cache > 0) parts.push("캐시 " + gb(r.cache)); else if (r.cache === 0) parts.push("캐시 정리 완료");
      if (r.apk > 0) parts.push("설치 파일 " + gb(r.apk));
      out.textContent = parts.length ? parts.join(" · ") + " 정리" : (r.trashAsked ? "" : "정리할 것이 없었습니다");
      if (r.trashAsked) toast("휴지통 비우기를 확인하는 창에서 '허용'을 눌러 주세요");
      P.storage();
    };
    res.trashDone = function (r) { out.textContent = (out.textContent ? out.textContent + " · " : "") + (r.ok ? "휴지통 비움" : "휴지통은 그대로 둠"); P.storage(); };
    P.storage();
  }

  // 배터리 덜씀
  function batPanel(box) {
    var b = J(P.battery());
    var st = el("div", "status");
    st.appendChild(el("span", null, "배터리 " + b.level + "% · " + (b.plugged ? "충전 중" : "배터리 사용 중")));
    st.appendChild(el("span", null, "절전 모드 " + (b.saverOn ? "켜짐" : "꺼짐")));
    if (b.applied) st.appendChild(el("span", null, "배터리 덜씀 적용 중"));
    box.appendChild(st);
    sw(box, "전원을 뽑으면 자동으로", "충전기를 빼면 아래대로 바꾸고, 다시 꽂으면 원래대로 돌아옵니다. 켜 두는 동안 '덜씀 지킴이' 알림이 보입니다.", b.auto, function (on) {
      P.setBattery(JSON.stringify({ auto: on })); if (on && !perm.notif) P.askNotif();
      toast(on ? "전원을 뽑으면 배터리 덜씀이 켜집니다" : "자동 배터리 덜씀을 껐습니다");
    });
    var s = opt(box, { title: "절전 모드 켜기", sub: perm.shizuku ? "배경 작업 · 성능을 줄여 배터리를 아낍니다" : "자동으로 켜려면 Shizuku 연결이 필요합니다 (없으면 절전 설정을 엽니다)", on: b.saver, need: perm.shizuku ? null : needBtn("Shizuku 연결", shz) });
    s.cb.onchange = function () { P.setBattery(JSON.stringify({ saver: s.cb.checked })); };
    var d = opt(box, { title: "화면 밝기 낮추기", sub: perm.write ? "배터리일 때 이 밝기로 (원래 밝기는 기억해 두고 되돌림)" : "'시스템 설정 변경'을 허락하면 밝기를 바꿀 수 있습니다", on: b.dim, off: !perm.write, need: perm.write ? null : needBtn("허락", P.openWrite) });
    d.cb.onchange = function () { P.setBattery(JSON.stringify({ dim: d.cb.checked })); };
    var sl = el("div", "slider"), r = el("input"), v = el("b", null, b.bright + "%");
    r.type = "range"; r.min = 10; r.max = 80; r.value = b.bright;
    r.oninput = function () { v.textContent = r.value + "%"; }; r.onchange = function () { P.setBattery(JSON.stringify({ bright: +r.value })); };
    sl.appendChild(el("small", null, "밝기")); sl.appendChild(r); sl.appendChild(v); d.row.appendChild(sl);
    var out = el("div", "result"), row = el("div", "row2"); box.appendChild(row);
    runBtn(row, "bat", "지금 바로 적용", function () {
      if (!perm.shizuku && s.cb.checked) P.openSaver();
      P.batteryNow();
    });
    runBtn(row, "lite", "원래대로", function () { P.batteryRestore(); });
    box.appendChild(out);
    res.batDone = function (r) { out.textContent = r.restored ? "원래 설정으로 돌렸습니다" : r.did ? r.did + " 적용" : "바꿀 수 있는 설정이 없습니다 — 위 권한을 확인하세요"; };
  }

  // 오래된 갤럭시 가볍게
  function oldPanel(box) {
    var o = J(P.old());
    box.appendChild(el("p", "p-lead", "오래되거나 메모리가 적은 갤럭시에서 화면 효과를 줄이고, 메모리가 모자라면 알아서 정리합니다."));
    var a = sw(box, "화면 효과 줄이기", perm.shizuku ? "창 · 화면 전환 애니메이션을 절반으로 줄여 더 빠르게 느껴지게 합니다 (끄면 원래대로)" : "애니메이션을 바꾸려면 Shizuku 연결이 필요합니다", o.animLight, function (on, i) {
      if (!perm.shizuku) { i.checked = false; shz(); return; }
      P.setAnim(on);
    });
    var last = o.autoLast ? " · 마지막 자동 정리 " + new Date(o.autoLast).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) + (o.autoLastN ? " (앱 " + o.autoLastN + "개)" : "") : "";
    sw(box, "메모리 부족하면 자동 정리", "메모리가 '주의'로 오르면 1시간 넘게 안 쓴 앱을 정리합니다. 3분마다 확인하고, 켜 두는 동안 '덜씀 지킴이' 알림이 보입니다" + last + (perm.usage ? "" : " · '사용 기록 접근'이 필요합니다"), o.autoClean, function (on, i) {
      if (on && !perm.usage) { i.checked = false; P.openUsage(); toast("덜씀의 '사용 기록 접근'을 켠 뒤 다시 눌러 주세요"); return; }
      P.setAutoClean(on); if (on && !perm.notif) P.askNotif();
      toast(on ? "메모리가 부족하면 자동으로 정리합니다" : "자동 정리를 껐습니다");
    });
    res.animDone = function (r) { if (!r.ok) { a.checked = false; toast("Shizuku 연결을 확인해 주세요"); } else toast(r.light ? "화면 효과를 줄였습니다" : "화면 효과를 원래대로 돌렸습니다"); };
  }

  // 권한
  function permPanel(box) {
    box.appendChild(el("p", "p-lead", "덜씀은 인터넷 권한이 없고, 정리는 모두 휴대폰 안에서만 합니다. 아래를 켤수록 더 깊게 정리합니다. 모두 선택 사항입니다."));
    var w = el("div", "perm"); box.appendChild(w);
    var gb2 = el("button", "run lite", "Shizuku 설정 방법 · 왜 필요한지 (그림 안내)"); gb2.type = "button"; gb2.onclick = guide; gb2.style.marginTop = "0"; gb2.style.marginBottom = "10px"; box.insertBefore(gb2, w);
    [["사용 기록 접근", "30분 넘게 안 쓴 앱 찾기 · 앱 캐시 크기", perm.usage, P.openUsage, "켜기"],
     ["Shizuku (고급 기능)", "앱 완전 종료 · 모든 앱 캐시 정리 · 설치 파일 정리 · 절전 모드 · 화면 효과. 처음이면 위 그림 안내를 따라 하세요", perm.shizuku, shz, perm.shzInstalled ? (perm.shzRunning ? "허락" : "방법 보기") : "방법 보기"],
     ["시스템 설정 변경", "배터리 덜씀의 화면 밝기", perm.write, P.openWrite, "허락"],
     ["사진 · 동영상", "휴지통 비우기", perm.media, P.askMedia, "허용"],
     ["알림", "덜씀 지킴이(자동 기능)가 도는 동안 표시", perm.notif, P.askNotif, "허용"]].forEach(function (p) {
      var row = el("div", "opt"); row.appendChild(el("b", null, p[0]));
      row.appendChild(p[2] ? el("em", "ok", "✓ 켜짐") : needBtn(p[4], p[3]));
      row.appendChild(el("span", null, p[1])); w.appendChild(row);
    });
  }

  // ---------- 안드로이드에서 오는 결과 ----------
  window.done = function (kind, data) {
    if (kind === "resume" || kind === "perms") { var was = JSON.stringify(perm); readPerms(); if (cur && JSON.stringify(perm) !== was) show(cur); return; }
    if (kind === "memDone") kind = "mem";
    if (res[kind]) res[kind](data);
  };
  window.goBack = function () { if (window.ShizukuGuide && ShizukuGuide.isOpen()) { ShizukuGuide.close(); return true; } if (cur) { cur = ""; $("panel").textContent = ""; Array.prototype.forEach.call(document.querySelectorAll(".dbtn"), function (b) { b.classList.remove("on"); }); return true; } return false; };

  Array.prototype.forEach.call(document.querySelectorAll(".dbtn"), function (b) { b.onclick = function () { P.tap(); show(b.dataset.p); }; });
  $("permBtn").onclick = function () { show("perm"); };
  $("relBtn").onclick = function () { P.openReleases(); };
  $("ver").textContent = "버전 " + P.version();

  readPerms();
  var m = drawMem();
  setInterval(drawMem, 2000);
  show("mem");

  if (SELFTEST) {
    // 점검: 메모리 표시 → 네 패널 열기 → 메모리 덜씀 실행
    var steps = ["sto", "bat", "old", "perm", "mem"], i = 0;
    P.report("MEM " + (m && m.pct > 0 && m.total > 0 ? "OK " + m.pct + "%" : "FAIL"));
    var t = setInterval(function () {
      if (i < steps.length) { show(steps[i]); P.report("PANEL " + steps[i] + " " + ($("panel").children.length ? "OK" : "FAIL")); i++; return; }
      clearInterval(t);
      res.mem = function (r) { P.report("CLEAN " + (r && r.freed != null ? "OK" : "FAIL")); P.report("DONE"); };
      P.memClean(JSON.stringify({ pkgs: [], bg: true }));
    }, 1200);
  }
})();
