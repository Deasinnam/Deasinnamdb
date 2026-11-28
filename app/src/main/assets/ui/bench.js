/* 덜누름 벤치 화면 · 웹 측정 · 점수 계산.
 * 기기 측정(Java)은 Android.run(id) → Bench.nativeDone(결과)로 돌아옵니다.
 * 점수: 항목마다 "기준값(최신 플래그십 수준)" 대비 비율로 0~1000점 → 분야 평균 → 비중을 곱해 10,000점 만점. */
(function () {
  "use strict";
  var A = window.Android || null;
  var $ = function (id) { return document.getElementById(id); };
  var VERSION = A ? A.version() : "dev";
  var SELFTEST = A ? A.selftest() : /selftest=1/.test(location.search);
  function log(s) { if (A) A.log(s); else console.log(s); }

  /* ───────── 기준표 (v0.1 임시 기준값: 여러 기기 결과로 다듬을 예정) ─────────
   * dir up: 클수록 좋음 / down: 작을수록 좋음. target = 1000점 기준, ok 이상(이하) ✓, mid 이상(이하) △, 그 밖 ✕ */
  var ITEMS = {
    "doc.pdf":       { label: "PDF 50쪽 만들기", unit: "ms", dir: "down", target: 400, ok: 1500, mid: 4000 },
    "doc.table":     { label: "표 1만 행 정렬 · 합계 4번", unit: "ms", dir: "down", target: 150, ok: 500, mid: 1500 },
    "doc.layout":    { label: "100쪽 문서 줄 나누기 (화면 폭 3가지)", unit: "ms", dir: "down", target: 400, ok: 1500, mid: 4000 },
    "photo.adjust":  { label: "2400만 화소 노출 · 대비 · 채도 보정", unit: "ms", dir: "down", target: 500, ok: 1500, mid: 4000 },
    "photo.jpeg":    { label: "2400만 화소 JPEG 저장", unit: "ms", dir: "down", target: 600, ok: 1500, mid: 4000 },
    "photo.thumbs":  { label: "보관함 미리보기 1장 만들기", unit: "ms", dir: "down", target: 2, ok: 10, mid: 40 },
    "audio.tracks":  { label: "실시간으로 섞는 트랙 (EQ · 압축 포함)", unit: "tracks", dir: "up", target: 128, ok: 24, mid: 8 },
    "audio.latency": { label: "소리 출력 지연 (추정)", unit: "ms", dir: "down", target: 8, ok: 15, mid: 40 },
    "desk.fps":      { label: "창 12개 · 위젯이 움직일 때", unit: "fps", dir: "up", target: 60, ok: 50, mid: 30 },
    "desk.low":      { label: "가장 버벅일 때 (하위 5%)", unit: "fps", dir: "up", target: 55, ok: 40, mid: 24 },
    "video.enc1080": { label: "1080p 영상 내보내기", unit: "xfps", dir: "up", target: 240, ok: 60, mid: 30 },
    "video.enc4k":   { label: "4K 영상 내보내기", unit: "xfps", dir: "up", target: 90, ok: 30, mid: 15 },
    "video.dec4k":   { label: "4K 영상 재생 · 미리보기 (하드웨어)", unit: "dec", dir: "up", target: 60, ok: 60, mid: 30 },
    "web.suite":     { label: "웹 앱 작업 묶음 (화면 만들기 · JSON · 검색 · 정렬)", unit: "ms", dir: "down", target: 200, ok: 600, mid: 1500 },
    "web.tabs":      { label: "탭을 더 열어 둘 여유 (추정)", unit: "tabs", dir: "up", target: 20, ok: 10, mid: 4 },
    "game.fps":      { label: "3D 그래픽 · 사각형 2만 개", unit: "fps", dir: "up", target: 60, ok: 50, mid: 30 },
    "game.heavy":    { label: "3D 그래픽 · 사각형 8만 개", unit: "fps", dir: "up", target: 60, ok: 40, mid: 25 },
    "ai.gflops":     { label: "AI 연산 속도 (행렬 곱)", unit: "gflops", dir: "up", target: 60, ok: 20, mid: 6 },
    "ai.speech":     { label: "음성 명령 알아듣기", unit: "speech", dir: "up", target: 2, ok: 2, mid: 1 },
    "ai.tts":        { label: "한국어 음성 합성 준비", unit: "ms", dir: "down", target: 600, ok: 2000, mid: 5000 },
    "ai.ram":        { label: "기기 안 AI 모델을 올릴 메모리", unit: "gb", dir: "up", target: 12, ok: 11, mid: 7.5 },
    "speed.gauge":   { label: "계기판 화면 부드러움", unit: "fps", dir: "up", target: 60, ok: 55, mid: 40 },
    "speed.accel":   { label: "가속도 센서 속도", unit: "hz", dir: "up", target: 400, ok: 100, mid: 50 },
    "speed.gyro":    { label: "자이로 센서 속도", unit: "hz", dir: "up", target: 400, ok: 100, mid: 50 },
    "speed.gps":     { label: "GPS (위성 수신기)", unit: "bool", dir: "up", target: 1, ok: 1, mid: 1 }
  };

  /* 분야: 비중(%) · 아이콘 · 대표 앱 · 측정 순서 */
  var CATS = [
    { id: "doc",   name: "문서",       full: "문서 · 워크",       w: 15, icon: "work", app: "com.daesinnam.work", run: [["native", "doc"]] },
    { id: "photo", name: "사진",       full: "사진 편집",         w: 10, icon: "work", app: "com.daesinnam.work", run: [["native", "photo"]] },
    { id: "audio", name: "오디오",     full: "오디오 편집",       w: 10, icon: "work", app: "com.daesinnam.work", run: [["native", "audio"]] },
    { id: "desk",  name: "데스크탑",   full: "데스크탑 · 창 여러 개", w: 10, icon: "desk", app: "com.daesinnam.desk", run: [["web", "desk"]] },
    { id: "video", name: "영상",       full: "영상 편집",         w: 15, icon: "work", app: "com.daesinnam.work", run: [["native", "video"]] },
    { id: "web",   name: "브라우저",   full: "브라우저",          w: 10, icon: "web",  app: "com.daesinnam.browser", run: [["web", "suite"], ["native", "memory"]] },
    { id: "game",  name: "게임",       full: "게임",              w: 10, icon: "game", app: "com.daesinnam.game", run: [["web", "gl"]] },
    { id: "ai",    name: "자비스",     full: "AI 보이스 자비스",  w: 10, icon: "ai",   app: null, run: [["native", "ai"]] },
    { id: "speed", name: "스피드미터", full: "스피드미터",        w: 10, icon: "speed", app: "speed", run: [["web", "gauge"], ["native", "sensors"]] }
  ];
  var SPEED_ICON = '<svg class="ico" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#1f2a33"/><path d="M12 31a12 12 0 1 1 24 0" fill="none" stroke="#7dd3fc" stroke-width="3" stroke-linecap="round"/><path d="M24 31l6-8" stroke="#ffc21a" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="31" r="2.5" fill="#ffc21a"/></svg>';
  function iconHtml(icon, cls) { return icon === "speed" ? SPEED_ICON : '<img class="' + (cls || "") + '" src="icons/' + icon + '.png" alt="">'; }

  var GRADES = [
    [9000, "S", "PC를 대신해요"], [8000, "A", "PC처럼 쓸 수 있어요"], [6500, "B", "가벼운 PC 작업은 충분해요"],
    [5000, "C", "문서 · 웹 위주로 좋아요"], [0, "D", "휴대폰 용도에 맞아요"]
  ];

  /* ───────── 점수 ───────── */
  function itemScore(k, v) {
    var d = ITEMS[k];
    if (!d || v == null || isNaN(v)) return null;
    var r = d.dir === "up" ? v / d.target : (v <= 0 ? 1 : d.target / v);
    return Math.round(1000 * Math.pow(Math.max(0, Math.min(1, r)), 0.6));
  }
  function verdict(k, v) {
    var d = ITEMS[k];
    if (v == null) return "na";
    if (d.dir === "up") return v >= d.ok ? "ok" : v >= d.mid ? "mid" : "no";
    return v <= d.ok ? "ok" : v <= d.mid ? "mid" : "no";
  }
  function fmt(k, v) {
    var d = ITEMS[k];
    if (v == null) return "";
    switch (d.unit) {
      case "ms": return v >= 1000 ? (v / 1000).toFixed(1) + "초" : Math.round(v) + "ms";
      case "fps": return Math.round(v) + "fps";
      case "xfps": return Math.round(v) + "fps · 실시간 " + (v / 30).toFixed(1) + "배";
      case "dec": return v >= 60 ? "60fps 됨" : v >= 30 ? "30fps까지" : "안 됨";
      case "tracks": return Math.round(v) + (v >= 256 ? "개 이상" : "개");
      case "tabs": return "약 " + Math.round(v) + "개";
      case "gflops": return v.toFixed(1) + " GFLOPS";
      case "speech": return v >= 2 ? "인터넷 없이 됨" : v >= 1 ? "인터넷 필요" : "없음";
      case "gb": return Math.round(v) + "GB";
      case "hz": return Math.round(v) + "Hz";
      case "bool": return v ? "있음" : "없음";
    }
    return String(v);
  }
  function computeTotal(cats) {
    var sum = 0, wsum = 0;
    CATS.forEach(function (c) {
      var r = cats[c.id];
      if (r && r.score != null) { sum += r.score * c.w; wsum += c.w; }
    });
    var total = wsum ? Math.round(sum / wsum * 10) : 0;
    var g = GRADES.filter(function (x) { return total >= x[0]; })[0];
    return { total: total, grade: g[1], verdict: g[2] };
  }
  function catScore(items) {
    var s = 0, n = 0;
    items.forEach(function (it) { if (it.score != null) { s += it.score; n++; } });
    return n ? Math.round(s / n) : null;
  }

  /* ───────── 화면 전환 ───────── */
  var current = "home", stack = [];
  function show(id, push) {
    ["home", "run", "result", "detail", "history"].forEach(function (s) { $(s).hidden = s !== id; });
    if (push !== false && current !== id) stack.push(current);
    current = id;
    window.scrollTo(0, 0);
  }
  var running = false;
  window.Bench = window.Bench || {};
  Bench.back = function () {
    if (running) return true;                         // 측정 중엔 뒤로 가기로 나가지 않음 (그만두기 단추로)
    if (current === "home") return false;
    var prev = stack.pop() || "home";
    if (prev === "run") prev = "home";
    show(prev, false);
    return true;
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-back]"), function (b) { b.addEventListener("click", Bench.back); });
  function toast(t) { var e = $("toast"); e.textContent = t; e.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { e.hidden = true; }, 2600); }

  /* ───────── 시작 화면 ───────── */
  var device = {}, installed = [];
  function readJSON(s, d) { try { return JSON.parse(s); } catch (e) { return d; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function renderHome() {
    $("ver").textContent = "v" + VERSION;
    device = A ? readJSON(A.device(), {}) : { name: "브라우저 미리보기", soc: "-", ramGB: 0, screen: "-", android: "-", hz: 60 };
    installed = A ? readJSON(A.apps(), []) : [];
    $("devName").textContent = device.name || "알 수 없는 기기";
    $("devSpec").innerHTML =
      "<span><b>칩</b>" + esc(device.soc) + "</span><span><b>메모리</b>" + esc(device.ramGB) + "GB</span>" +
      "<span><b>화면</b>" + esc(device.screen) + " · " + esc(device.maxHz || device.hz) + "Hz</span><span><b>안드로이드</b>" + esc(device.android) + "</span>";
    var list = [
      ["work", "워크", "com.daesinnam.work"], ["desk", "데스크탑", "com.daesinnam.desk"], ["web", "브라우저", "com.daesinnam.browser"],
      ["game", "게임", "com.daesinnam.game"], ["speed", "스피드", "speed"], ["ai", "자비스", null]
    ];
    var n = 0;
    $("apps").innerHTML = list.map(function (a) {
      var app = findApp(a[2]);
      var cls = a[2] === null ? "soon off" : app ? "" : "off";
      if (app) n++;
      var em = a[2] === null ? "제작 중" : app ? "v" + esc(app.version || "") : "미설치";
      return '<div class="app ' + cls + '">' + iconHtml(a[0]) + "<span>" + a[1] + "</span><em>" + em + "</em></div>";
    }).join("");
    $("appCount").textContent = "5개 중 " + n + "개";
    var hist = loadHistory();
    $("historyBtn").hidden = !hist.length;
    renderCond();
  }
  function findApp(pkg) {
    if (!pkg) return null;
    for (var i = 0; i < installed.length; i++) {
      var a = installed[i];
      if (pkg === "speed" ? /스피드/.test(a.label || "") : a.pkg === pkg) return a;
    }
    return null;
  }
  function renderCond() {
    var b = A ? readJSON(A.battery(), {}) : {};
    var out = [];
    if (b.charging) out.push("충전기를 빼 주세요. 충전 중에는 발열 · 성능이 달라져요.");
    if (b.pct >= 0 && b.pct < 30) out.push("배터리가 " + b.pct + "%예요. 30% 이상에서 재는 게 좋아요.");
    if (b.tempC > 35) out.push("기기가 " + b.tempC.toFixed(1) + "°C로 따뜻해요. 식은 뒤 재면 더 정확해요.");
    $("cond").innerHTML = out.length ? out.map(function (t) { return "<p>" + t + "</p>"; }).join("")
      : '<p class="okc">측정 조건 좋음 · 다른 앱을 닫고 시작해 주세요</p>';
  }
  function syncModes() { Array.prototype.forEach.call(document.querySelectorAll(".mode"), function (m) { m.classList.toggle("on", m.querySelector("input").checked); }); }
  Array.prototype.forEach.call(document.querySelectorAll(".mode input"), function (inp) { inp.addEventListener("change", syncModes); });
  syncModes();

  /* ───────── 측정 진행 ───────── */
  var pendingNative = null, invalid = false, stopFlag = false;
  Bench.nativeDone = function (json) { var r = readJSON(json, {}); var p = pendingNative; pendingNative = null; if (p) p(r); };
  Bench.progress = function (json) {
    var m = readJSON(json, {});
    if (m.step) $("runStep").textContent = m.step;
    if (m.perf != null) { $("statNow").textContent = m.perf + "%"; pushGraph(m.perf, 100); }
    if (m.tempC) $("statTemp").textContent = m.tempC.toFixed(1) + "°C";
  };
  Bench.paused = function () { if (running) invalid = true; };
  function runNative(id, mode) {
    return new Promise(function (resolve) {
      if (!A) { resolve({ id: id, items: [] }); return; }
      pendingNative = resolve;
      A.run(id, mode || "");
    });
  }
  var graphPts = [];
  function resetGraph() { graphPts = []; $("graphLine").setAttribute("points", ""); }
  function pushGraph(v, max) {
    graphPts.push(v); if (graphPts.length > 60) graphPts.shift();
    var n = graphPts.length;
    $("graphLine").setAttribute("points", graphPts.map(function (p, i) {
      return (n < 2 ? 0 : i * 320 / (n - 1)).toFixed(1) + "," + (66 - Math.min(1, p / max) * 60).toFixed(1);
    }).join(" "));
  }
  function updateBattery() {
    var b = A ? readJSON(A.battery(), {}) : {};
    if (b.tempC) $("statTemp").textContent = b.tempC.toFixed(1) + "°C";
    if (startBattery && b.pct >= 0) $("statBat").textContent = (b.pct - startBattery.pct > 0 ? "+" : b.pct === startBattery.pct ? "" : "−") + Math.abs(b.pct - startBattery.pct) + "%";
  }
  var startBattery = null;

  function renderSteps(doneMap, nowId, full) {
    var rows = CATS.map(function (c, i) {
      var r = doneMap[c.id];
      var cls = r ? "done" : c.id === nowId ? "now" : "";
      var right = r ? "<b>" + (r.score == null ? "—" : r.score) + "</b>" : c.id === nowId ? "측정 중" : "대기";
      return '<li class="' + cls + '"><span>' + String(i + 1).padStart(2, "0") + " " + c.full + "</span>" + right + "</li>";
    });
    if (full) rows.push('<li class="' + (nowId === "sustain" ? "now" : doneMap.sustain ? "done" : "") + '"><span>10 연속 부하 · 10분</span>' + (doneMap.sustain ? "<b>" + doneMap.sustain.keep + "%</b>" : nowId === "sustain" ? "측정 중" : "대기") + "</li>");
    $("steps").innerHTML = rows.join("");
  }

  async function startRun(mode) {
    running = true; invalid = false; stopFlag = false;
    if (A) A.testMode(true);
    startBattery = A ? readJSON(A.battery(), {}) : null;
    show("run");
    $("runMode").textContent = (mode === "full" ? "전체 측정" : "빠른 측정") + " · " + (device.name || "");
    var total = CATS.length + (mode === "full" ? 1 : 0);
    var done = {};
    var batTimer = setInterval(updateBattery, 2000);
    updateBattery();
    try {
      for (var i = 0; i < CATS.length; i++) {
        if (stopFlag) break;
        var c = CATS[i];
        $("runCount").textContent = (i + 1) + " / " + total;
        $("runBar").style.width = Math.round(i / total * 100) + "%";
        $("runCat").textContent = String(i + 1).padStart(2, "0") + " · " + c.full + (c.app === null ? " · 기본 측정" : "");
        $("runIcon").outerHTML = c.icon === "speed" ? '<span id="runIcon">' + SPEED_ICON + "</span>" : '<img id="runIcon" src="icons/' + c.icon + '.png" alt="" width="40" height="40">';
        $("statNow").textContent = "—";
        resetGraph();
        renderSteps(done, c.id, mode === "full");
        var items = [];
        for (var j = 0; j < c.run.length; j++) {
          var kind = c.run[j][0], id = c.run[j][1];
          var r = kind === "native" ? await runNative(id) : await WEB[id]();
          (r.items || []).forEach(function (it) { items.push(it); });
          if (r.error) log("ERROR " + id + " " + r.error);
        }
        items.forEach(function (it) { it.score = it.na ? null : itemScore(it.k, it.v); it.verdict = it.na ? "na" : verdict(it.k, it.v); });
        done[c.id] = { score: catScore(items), items: items };
        log("CAT " + c.id + " " + done[c.id].score + " " + JSON.stringify(items));
        await sleep(300);
      }
      if (mode === "full" && !stopFlag) {
        $("runCount").textContent = total + " / " + total;
        $("runBar").style.width = Math.round((total - 1) / total * 100) + "%";
        $("runCat").textContent = "10 · 연속 부하 (발열 · 배터리)";
        $("runStep").textContent = "10분 동안 계속 계산하며 성능이 얼마나 유지되는지 봅니다";
        resetGraph();
        renderSteps(done, "sustain", true);
        var s = await runNative("sustain", "full");
        done.sustain = s;
        log("SUSTAIN " + JSON.stringify(s));
      }
    } finally {
      clearInterval(batTimer);
      if (A) A.testMode(false);
      running = false;
    }
    if (stopFlag) { renderHome(); show("home", false); stack = []; toast("측정을 그만뒀어요"); return; }
    $("runBar").style.width = "100%";
    var t = computeTotal(done);
    var res = {
      ts: Date.now(), mode: mode, version: VERSION, device: device, cats: {}, sustain: done.sustain || null,
      total: t.total, grade: t.grade, verdict: t.verdict, invalid: invalid,
      apps: installed.map(function (a) { return a.pkg + "@" + (a.version || ""); })
    };
    CATS.forEach(function (c) { res.cats[c.id] = done[c.id]; });
    saveHistory(res);
    log("TOTAL " + t.total + " " + t.grade + (invalid ? " invalid" : ""));
    renderResult(res);
    stack = ["home"];
    show("result", false);
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  $("startBtn").addEventListener("click", function () {
    var m = document.querySelector('input[name="mode"]:checked').value;
    startRun(m);
  });
  $("stopBtn").addEventListener("click", function () { stopFlag = true; if (A) A.stop(); });

  /* ───────── 웹 측정 (화면 · 웹 · 그래픽) ───────── */
  function stageOn(on) { var s = $("stage"); s.innerHTML = ""; s.classList.toggle("on", !!on); return s; }
  /** dur 동안 매 화면마다 draw(t)를 부르고 초당 프레임 · 하위 5% 프레임을 잽니다 */
  function frames(dur, draw, label) {
    return new Promise(function (resolve) {
      var t0 = 0, last = 0, deltas = [], lastShow = 0, count = 0;
      function tick(t) {
        if (!t0) { t0 = last = lastShow = t; }
        else { deltas.push(t - last); last = t; count++; }
        try { draw(t - t0); } catch (e) { log("draw error " + e); }
        if (t - lastShow > 250 && deltas.length) {
          var recent = deltas.slice(-15), avg = recent.reduce(function (a, b) { return a + b; }, 0) / recent.length;
          var f = 1000 / avg; $("statNow").textContent = Math.round(f) + " fps"; pushGraph(f, 120); lastShow = t;
        }
        if (t - t0 < dur && !stopFlag) requestAnimationFrame(tick);
        else {
          var el = (last - t0) / 1000;
          var sorted = deltas.slice().sort(function (a, b) { return b - a; });
          var worst = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.05)));
          var w = worst.reduce(function (a, b) { return a + b; }, 0) / worst.length;
          resolve({ fps: el > 0 ? count / el : 0, low: w > 0 ? 1000 / w : 0 });
        }
      }
      $("runStep").textContent = label;
      requestAnimationFrame(tick);
    });
  }

  var WEB = {
    /* 04 데스크탑: 그림자 · 둥근 모서리 창 12개가 움직이고, 창 안 그래프가 매번 바뀜 */
    desk: async function () {
      var st = stageOn(true);
      var W = st.clientWidth, H = st.clientHeight, wins = [];
      for (var i = 0; i < 12; i++) {
        var d = document.createElement("div");
        d.className = "win";
        d.innerHTML = "<i></i><p>창 " + (i + 1) + " · 문서 · 사진 · 표</p><u>" + "<s></s>".repeat(8) + "</u>";
        st.appendChild(d);
        wins.push({ el: d, bars: d.querySelectorAll("s"), ph: i * 0.7 });
      }
      await sleep(200);
      var r = await frames(5000, function (t) {
        for (var i = 0; i < wins.length; i++) {
          var w = wins[i], a = t / 1000 + w.ph;
          var x = (W - 140) * (0.5 + 0.5 * Math.sin(a * 0.9 + i)), y = (H - 100) * (0.5 + 0.5 * Math.cos(a * 1.3 + i * 0.5));
          var s = 0.9 + 0.12 * Math.sin(a * 2);
          w.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + s.toFixed(3) + ")";
          var b = w.bars[(Math.floor(t / 16) + i) % 8];
          b.style.height = (20 + 80 * Math.abs(Math.sin(a * 3 + i))).toFixed(0) + "%";
        }
      }, "창 12개 · 위젯 움직이기");
      stageOn(false);
      return { items: [{ k: "desk.fps", v: r.fps }, { k: "desk.low", v: r.low }] };
    },

    /* 06 브라우저: 웹 앱이 흔히 하는 일 묶음을 세 번 돌려 가운데 값 */
    suite: async function () {
      $("runStep").textContent = "웹 앱 작업 묶음 (화면 만들기 · JSON · 검색 · 정렬)";
      var st = stageOn(true);
      await sleep(100);
      var times = [];
      for (var rep = 0; rep < 3 && !stopFlag; rep++) {
        var t0 = performance.now();
        var box = document.createElement("ul");
        box.style.cssText = "margin:0;padding:8px;font-size:11px;color:#a1a1aa;columns:3";
        var html = [];
        for (var i = 0; i < 3000; i++) html.push("<li><b>" + i + "</b> 상품 " + i + " <i>" + (i * 7 % 100) + "%</i></li>");
        box.innerHTML = html.join("");
        st.appendChild(box);
        void box.offsetHeight;
        var lis = box.children;
        for (i = 0; i < lis.length; i += 3) lis[i].lastChild.textContent = ((i * 13) % 100) + "%";
        void box.offsetHeight;
        st.removeChild(box);
        var arr = [];
        for (i = 0; i < 20000; i++) arr.push({ id: i, name: "상품 " + i, price: i * 37 % 9999, tags: ["a", "b", i % 7] });
        for (i = 0; i < 3; i++) arr = JSON.parse(JSON.stringify(arr));
        var text = "덜누름 벤치 hello world 12345 브라우저 시험 ".repeat(25000);
        var m1 = text.match(/\b\w{5}\b/g), m2 = text.match(/[가-힣]+/g);
        var nums = new Array(200000);
        for (i = 0; i < nums.length; i++) nums[i] = Math.random();
        nums.sort(function (a, b) { return a - b; });
        if (!m1 || !m2 || arr.length !== 20000) log("suite check failed");
        times.push(performance.now() - t0);
        $("statNow").textContent = Math.round(times[times.length - 1]) + " ms";
        await sleep(150);
      }
      stageOn(false);
      times.sort(function (a, b) { return a - b; });
      return { items: [{ k: "web.suite", v: times[Math.floor(times.length / 2)] }] };
    },

    /* 07 게임: WebGL로 돌아가는 사각형 2만 개 → 8만 개, 픽셀마다 무늬 계산 */
    gl: async function () {
      var st = stageOn(true);
      var cv = document.createElement("canvas");
      st.appendChild(cv);
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(st.clientWidth * dpr); cv.height = Math.round(st.clientHeight * dpr);
      var gl = cv.getContext("webgl", { antialias: false, powerPreference: "high-performance" });
      if (!gl) { stageOn(false); return { items: [{ k: "game.fps", na: "WebGL 안 됨" }, { k: "game.heavy", na: "WebGL 안 됨" }] }; }
      var vs = "attribute vec2 c;attribute vec2 p;attribute float h;uniform float t;uniform float asp;varying vec3 col;varying vec2 uv;" +
        "void main(){float a=t*1.5+h*6.283;mat2 r=mat2(cos(a),-sin(a),sin(a),cos(a));vec2 q=r*c*0.018;q.x/=asp;" +
        "vec2 o=p+vec2(sin(t*0.7+h*20.0),cos(t*0.9+h*13.0))*0.05;gl_Position=vec4(o+q,0.0,1.0);" +
        "col=vec3(0.5+0.5*sin(h*40.0),0.5+0.5*sin(h*40.0+2.0),0.5+0.5*sin(h*40.0+4.0));uv=c;}";
      var fs = "precision mediump float;varying vec3 col;varying vec2 uv;uniform float tf;" +
        "void main(){float v=0.0;vec2 z=uv*3.0;for(int i=0;i<6;i++){z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)*0.5+vec2(sin(tf),cos(tf))*0.3;v+=length(z);}" +
        "gl_FragColor=vec4(col*(0.6+0.4*sin(v)),1.0);}";
      function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
      var pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { log("GL link " + gl.getProgramInfoLog(pr)); stageOn(false); return { items: [{ k: "game.fps", na: "그래픽 준비 실패" }, { k: "game.heavy", na: "그래픽 준비 실패" }] }; }
      gl.useProgram(pr);
      var uT = gl.getUniformLocation(pr, "t"), uTf = gl.getUniformLocation(pr, "tf"), uA = gl.getUniformLocation(pr, "asp");
      gl.uniform1f(uA, cv.width / cv.height);
      gl.viewport(0, 0, cv.width, cv.height);
      var buf = gl.createBuffer();
      function build(n) {
        var d = new Float32Array(n * 6 * 5), k = 0, C = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
        for (var i = 0; i < n; i++) {
          var px = Math.random() * 2 - 1, py = Math.random() * 2 - 1, h = Math.random();
          for (var j = 0; j < 6; j++) { d[k++] = C[j][0]; d[k++] = C[j][1]; d[k++] = px; d[k++] = py; d[k++] = h; }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
        var lc = gl.getAttribLocation(pr, "c"), lp = gl.getAttribLocation(pr, "p"), lh = gl.getAttribLocation(pr, "h");
        gl.enableVertexAttribArray(lc); gl.vertexAttribPointer(lc, 2, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 20, 8);
        gl.enableVertexAttribArray(lh); gl.vertexAttribPointer(lh, 1, gl.FLOAT, false, 20, 16);
      }
      var out = [];
      var loads = [[20000, "game.fps", "3D 그래픽 · 사각형 2만 개"], [80000, "game.heavy", "3D 그래픽 · 사각형 8만 개"]];
      for (var s = 0; s < loads.length; s++) {
        var n = loads[s][0];
        build(n);
        var r = await frames(4000, function (t) {
          gl.clearColor(0.05, 0.05, 0.07, 1); gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform1f(uT, t / 1000); gl.uniform1f(uTf, (t / 1000) % 6.2832);
          gl.drawArrays(gl.TRIANGLES, 0, n * 6);
        }, loads[s][2]);
        out.push({ k: loads[s][1], v: r.fps });
      }
      var lose = gl.getExtension("WEBGL_lose_context"); if (lose) lose.loseContext();
      stageOn(false);
      return { items: out };
    },

    /* 09 스피드미터: 바늘 · 눈금 · 숫자 · 작은 지도까지 매 화면 다시 그리는 계기판 */
    gauge: async function () {
      var st = stageOn(true);
      var cv = document.createElement("canvas");
      st.appendChild(cv);
      var dpr = Math.min(3, window.devicePixelRatio || 1);
      var W = st.clientWidth, H = st.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var g = cv.getContext("2d");
      g.scale(dpr, dpr);
      var road = [];
      for (var i = 0; i < 160; i++) road.push([Math.random() * 400 - 200, Math.random() * 400 - 200]);
      var r = await frames(4000, function (t) {
        var s = t / 1000, spd = 120 + 100 * Math.sin(s * 1.3), cx = W * 0.36, cy = H * 0.56, R = Math.min(W * 0.32, H * 0.45);
        var bg = g.createRadialGradient(cx, cy, 10, cx, cy, R * 1.6);
        bg.addColorStop(0, "#1c2430"); bg.addColorStop(1, "#08090c");
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.lineCap = "round";
        for (var k = 0; k < 3; k++) {
          g.beginPath(); g.lineWidth = 10 - k * 3;
          g.strokeStyle = ["#1f2937", "#7dd3fc", "#ffc21a"][k];
          g.arc(cx, cy, R - k * 14, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * (k === 0 ? 1 : spd / 240)));
          g.stroke();
        }
        g.strokeStyle = "#9ca3af"; g.lineWidth = 1.5;
        for (k = 0; k <= 120; k++) {
          var a = Math.PI * (0.75 + 1.5 * k / 120), l = k % 10 === 0 ? 14 : 6;
          g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22));
          g.lineTo(cx + Math.cos(a) * (R - 22 - l), cy + Math.sin(a) * (R - 22 - l)); g.stroke();
        }
        g.fillStyle = "#d4d4d8"; g.font = "11px sans-serif"; g.textAlign = "center";
        for (k = 0; k <= 12; k++) {
          a = Math.PI * (0.75 + 1.5 * k / 12);
          g.fillText(String(k * 20), cx + Math.cos(a) * (R - 48), cy + Math.sin(a) * (R - 48) + 4);
        }
        a = Math.PI * (0.75 + 1.5 * spd / 240);
        g.save(); g.shadowColor = "#ffc21a"; g.shadowBlur = 12; g.strokeStyle = "#ffc21a"; g.lineWidth = 4;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30)); g.stroke(); g.restore();
        g.fillStyle = "#fff"; g.font = "bold 34px sans-serif"; g.fillText(String(Math.round(spd)), cx, cy + R * 0.55);
        var mx = W * 0.8, my = H * 0.5, mr = Math.min(W * 0.16, H * 0.4);
        g.save(); g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.clip();
        g.fillStyle = "#0f1a14"; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
        g.strokeStyle = "#3f6f52"; g.lineWidth = 2; g.beginPath();
        for (k = 0; k < road.length; k++) {
          var px = mx + road[k][0] - (s * 30) % 400 + 200 * Math.sin(k), py = my + road[k][1] * 0.8;
          if (k % 4 === 0) g.moveTo(px, py); else g.lineTo(px, py);
        }
        g.stroke(); g.restore();
        g.strokeStyle = "#7dd3fc"; g.lineWidth = 2; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.stroke();
      }, "계기판 화면 다시 그리기");
      stageOn(false);
      return { items: [{ k: "speed.gauge", v: r.fps }] };
    }
  };

  /* ───────── 결과 · 기록 ───────── */
  function loadHistory() { return A ? readJSON(A.load("history"), []) || [] : []; }
  function saveHistory(res) {
    var h = loadHistory(); h.unshift(res); if (h.length > 20) h.length = 20;
    if (A) A.save("history", JSON.stringify(h));
  }
  var shown = null;
  function color(s) { return s == null ? "#3f3f46" : s >= 800 ? "#86efac" : s >= 600 ? "#fbbf24" : "#fca5a5"; }

  function renderResult(res) {
    shown = res;
    $("resDev").textContent = (res.device && res.device.name || "") + " · " + new Date(res.ts).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
    $("resMode").textContent = res.mode === "full" ? "전체 측정" : "빠른 측정";
    $("resTotal").textContent = res.total.toLocaleString("ko-KR");
    $("resGrade").textContent = res.grade;
    $("resVerdict").textContent = res.verdict;
    var good = [], meh = [];
    CATS.forEach(function (c) { var r = res.cats[c.id]; if (!r || r.score == null) return; (r.score >= 800 ? good : meh).push(c.name); });
    $("resSummary").textContent = (good.length ? good.join(" · ") + "은 충분" : "") + (good.length && meh.length ? ", " : "") + (meh.length ? meh.join(" · ") + "은 아쉬워요" : "");
    var warn = [];
    if (res.invalid) warn.push("측정 중 다른 앱으로 나갔다 와서 점수가 낮게 나왔을 수 있어요.");
    if (res.device && res.device.emulator) warn.push("에뮬레이터에서 잰 결과예요.");
    if (res.sustain && res.sustain.charging) warn.push("충전 중에 잰 결과예요.");
    $("resWarn").hidden = !warn.length; $("resWarn").textContent = warn.join(" ");
    $("resCats").innerHTML = CATS.map(function (c) {
      var r = res.cats[c.id], s = r ? r.score : null;
      return '<div class="cat"><span>' + c.name + "</span><strong>" + (s == null ? "—" : s) + '</strong><i><b style="width:' + ((s || 0) / 10) + "%;background:" + color(s) + '"></b></i></div>';
    }).join("");
    var su = res.sustain;
    $("resSustain").textContent = su && su.keep ? "10분 연속 부하 뒤 성능 유지 " + su.keep + "% · 최고 배터리 온도 " + su.maxTempC + "°C · 배터리 −" + Math.max(0, su.batteryDrop) + "%"
      : "연속 부하(발열 · 배터리)는 전체 측정에서 잽니다";
    drawRadar(res);
  }
  function drawRadar(res) {
    var cx = 160, cy = 116, R = 82, n = CATS.length, svg = [];
    function pt(i, r) { var a = -Math.PI / 2 + 2 * Math.PI * i / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    function poly(f) { var p = []; for (var i = 0; i < n; i++) p.push(f(i).map(function (v) { return v.toFixed(1); }).join(",")); return p.join(" "); }
    svg.push('<polygon points="' + poly(function (i) { return pt(i, R); }) + '" fill="#131316" stroke="#2f2f35"/>');
    svg.push('<polygon points="' + poly(function (i) { return pt(i, R / 2); }) + '" fill="none" stroke="#2f2f35"/>');
    svg.push('<polygon points="' + poly(function (i) { var r = res.cats[CATS[i].id]; return pt(i, R * ((r && r.score) || 0) / 1000); }) + '" fill="rgba(255,194,26,.22)" stroke="#ffc21a" stroke-width="2" stroke-linejoin="round"/>');
    for (var i = 0; i < n; i++) {
      var p = pt(i, R + 18);
      svg.push('<text x="' + p[0].toFixed(0) + '" y="' + (p[1] + 4).toFixed(0) + '" text-anchor="middle" font-size="11" fill="#c4c4cc">' + CATS[i].name + "</text>");
    }
    $("radar").innerHTML = svg.join("");
  }
  function renderDetail(res) {
    $("detailList").innerHTML = CATS.map(function (c, i) {
      var r = res.cats[c.id] || { items: [] };
      var rows = (r.items || []).filter(function (it) { return ITEMS[it.k]; }).map(function (it) {
        var v = it.verdict || "na", sym = { ok: "✓", mid: "△", no: "✕", na: "–" }[v];
        var val = it.na ? it.na : fmt(it.k, it.v);
        return '<li><em class="' + v + '" aria-label="' + ({ ok: "충분", mid: "느림", no: "어려움", na: "잴 수 없음" }[v]) + '">' + sym + "</em><span>" + ITEMS[it.k].label + '</span><b class="' + v + '">' + esc(val) + "</b></li>";
      }).join("");
      var note = c.app === null ? '<li><em class="na">i</em><span>자비스가 나오기 전이라 벤치 안에서 같은 작업으로 잽니다</span><b class="na">기본 측정</b></li>' : "";
      return '<section class="dsec"><header>' + iconHtml(c.icon) + "<strong>" + String(i + 1).padStart(2, "0") + " " + c.full + "</strong><b>" + (r.score == null ? "—" : r.score) + "</b></header><ul>" + rows + note + "</ul></section>";
    }).join("");
  }
  $("detailBtn").addEventListener("click", function () { if (shown) { renderDetail(shown); show("detail"); } });
  $("homeBtn").addEventListener("click", function () { renderHome(); stack = []; show("home", false); });
  $("historyBtn").addEventListener("click", function () {
    var h = loadHistory();
    $("histList").innerHTML = h.map(function (r, i) {
      return '<li><button type="button" data-i="' + i + '"><span>' + esc(r.device && r.device.name) + "<em>" + new Date(r.ts).toLocaleString("ko-KR") + " · " + (r.mode === "full" ? "전체" : "빠른") + " 측정 · " + r.grade + "</em></span><b>" + r.total.toLocaleString("ko-KR") + "</b></button></li>";
    }).join("");
    show("history");
  });
  $("histList").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-i]"); if (!b) return;
    renderResult(loadHistory()[+b.getAttribute("data-i")]); show("result");
  });
  $("shareBtn").addEventListener("click", function () {
    if (!shown) return;
    var lines = ["덜누름 벤치 " + (shown.mode === "full" ? "전체" : "빠른") + " 측정", (shown.device && shown.device.name) + " · " + shown.total.toLocaleString("ko-KR") + " / 10,000 · " + shown.grade + " " + shown.verdict];
    lines.push(CATS.map(function (c) { var r = shown.cats[c.id]; return c.name + " " + (r && r.score != null ? r.score : "—"); }).join(" · "));
    if (shown.sustain && shown.sustain.keep) lines.push("10분 연속 부하 뒤 성능 유지 " + shown.sustain.keep + "%");
    if (A) A.share(lines.join("\n")); else toast(lines.join(" / "));
  });

  /* ───────── 시작 ───────── */
  renderHome();
  if (SELFTEST) {
    log("HOME " + JSON.stringify(device) + " apps " + installed.length);
    log("SHOT-HOME");
    setTimeout(async function () {
      document.querySelector('input[value="quick"]').checked = true; syncModes();
      startRun("quick");
      var wait = setInterval(function () {
        if (current === "result") {
          clearInterval(wait);
          log("SHOT-RESULT");
          setTimeout(function () {
            $("detailBtn").click(); log("SHOT-DETAIL");
            setTimeout(function () { window.scrollTo(0, 99999); log("SHOT-DETAIL2"); setTimeout(function () { log("DONE"); }, 2500); }, 2500);
          }, 3000);
        }
      }, 500);
    }, 2500);
  }
})();
