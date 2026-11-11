(function () {
  "use strict";

  // 확장자 → 편집기 모듈
  const ROUTES = {
    hwp: "hwp", hwpx: "hwp", md: "markdown", markdown: "markdown", txt: "markdown", html: "html", htm: "html", pdf: "pdf",
    docx: "docs", odt: "docs", xlsx: "sheets", xlsm: "sheets", xls: "sheets", csv: "sheets", tsv: "sheets",
    pptx: "slides", epub: "epub", xmind: "mindmap", mm: "mindmap", drawio: "diagram", dio: "diagram", vsdx: "diagram",
  };
  // 데스크톱판 메인 코드를 앱 안 Node(문서 엔진)에서 돌리는 편집기
  const NODE_MODULES = new Set(["docs", "sheets", "slides", "epub", "mindmap", "diagram"]);
  const BADGE = {
    hwp: ["HWP", "hwp"], markdown: ["MD", "md"], html: ["HTML", "html"], pdf: ["PDF", "pdf"],
    docs: ["DOC", "doc"], sheets: ["XLS", "xls"], slides: ["PPT", "ppt"], epub: ["EPUB", "epub"], mindmap: ["MAP", "map"], diagram: ["DIA", "dia"],
  };

  let seq = 0;
  const waiting = new Map();
  let wired = null;
  function bridge() {
    const A = window.IeumAndroid || null;
    if (A && wired !== A) {
      wired = A;
      A.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch (_) { return; }
        if (msg && msg.node) { const ch = channels.get(msg.node); if (ch) ch(msg.ev, msg.data); return; }
        const done = msg && waiting.get(msg.id);
        if (!done) return;
        waiting.delete(msg.id);
        done(msg.result == null ? { ok: false } : msg.result);
      };
    }
    return A;
  }
  function call(method, ...args) {
    const A = bridge();
    if (!A) return Promise.resolve({ ok: false, error: "안드로이드 앱에서 실행해 주세요" });
    return new Promise((resolve) => {
      const id = ++seq;
      waiting.set(id, resolve);
      A.postMessage(JSON.stringify({ id, method, args }));
    });
  }

  // ---------- 문서 엔진(Node) 제어 통로: 앱이 중계 ----------
  const channels = new Map();
  function notify(method, ...args) {
    const A = bridge();
    if (A) A.postMessage(JSON.stringify({ id: 0, method, args }));
  }
  /**
   * 문서 엔진에 요청 하나를 보내고 답을 받습니다.
   * 엔진이 멈춰 있어도 끝없이 기다리지 않도록 시간 제한을 두고, 실패하면 이유를 그대로 돌려줍니다.
   */
  function engineRequest(req, onStatus) {
    const A = bridge();
    if (!A) return Promise.reject(new Error("앱 연결(IeumAndroid)이 없습니다. Android System WebView를 업데이트해 주세요."));
    return new Promise((resolve, reject) => {
      const id = "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      let opened = false;
      let detail = "";
      let done = false;
      let timer = 0;
      const finish = (fn, v) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        channels.delete(id);
        notify("nodeClose", id);
        fn(v);
      };
      const arm = (ms) => {
        clearTimeout(timer);
        timer = setTimeout(() => finish(reject, new Error((opened ? "문서 엔진이 응답하지 않습니다" : "문서 엔진이 시작되지 않습니다") + " (" + Math.round(ms / 1000) + "초 기다림)")), ms);
      };
      channels.set(id, (ev, data) => {
        if (ev === "status") {
          const [st, ...d] = String(data).split(":");
          if (onStatus) onStatus(st, d.join(":"));
          arm(150000); // 처음 실행은 설치(압축 풀기)에 시간이 걸릴 수 있음
        } else if (ev === "open") {
          opened = true;
          arm(60000);
          notify("nodeSend", id, JSON.stringify({ ...req, id: 1 }));
        } else if (ev === "error") {
          detail = String(data || "");
        } else if (ev === "message") {
          let m; try { m = JSON.parse(data); } catch (_) { return; }
          if (m.ok) finish(resolve, m.v); else finish(reject, new Error(m.e || "실패"));
        } else if (ev === "close") {
          finish(reject, new Error(detail || (opened ? "문서 엔진 연결이 끊겼습니다" : "문서 엔진을 시작하지 못했습니다")));
        }
      });
      arm(150000);
      notify("nodeOpen", id, "");
    });
  }

  function busy(text) {
    let el = document.getElementById("busy");
    if (!text) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = "busy"; document.body.appendChild(el); }
    el.textContent = text;
  }
  const engineStatus = (st, d) => { if (st !== "ready") busy(d || "문서 엔진 준비 중…"); else busy("문서 엔진에서 여는 중…"); };

  // 열지 못했을 때: 잠깐 떴다 사라지는 알림 대신, 이유와 다시 시도·진단 단추를 보여 줍니다
  let retryAction = null;
  function showProblem(message, retry) {
    retryAction = retry || null;
    document.getElementById("problem-text").textContent = message;
    document.getElementById("problem-retry").hidden = !retry;
    document.getElementById("problem").hidden = false;
  }
  document.getElementById("problem-close").addEventListener("click", () => { document.getElementById("problem").hidden = true; });
  document.getElementById("problem-retry").addEventListener("click", () => {
    document.getElementById("problem").hidden = true;
    if (retryAction) retryAction();
  });
  document.getElementById("problem-diag").addEventListener("click", () => {
    document.getElementById("problem").hidden = true;
    runDiag();
  });

  async function openInEngine(mod, path, name, replace) {
    busy("문서 엔진에서 여는 중…");
    try {
      const r = await engineRequest({ t: "open", module: mod, path: path || undefined }, engineStatus);
      const url = "../modules/" + mod + "/index.html?s=" + encodeURIComponent(r.session) + "&name=" + encodeURIComponent(name || "");
      if (replace) location.replace(url); else location.href = url;
    } catch (e) {
      busy("");
      notify("pageReport", "home", "open-fail", mod + ": " + (e.message || e));
      showProblem(e.message || "열지 못했습니다", () => openInEngine(mod, path, name, replace));
    }
  }

  // ---------- 문제 진단 ----------
  const DIAG_MODULES = [["docs", "워드"], ["sheets", "엑셀"], ["slides", "파워포인트"], ["mindmap", "마인드맵"]];
  let diagText = "";
  let diagRunning = false;
  async function runDiag() {
    if (diagRunning) return;
    diagRunning = true;
    const panel = document.getElementById("diag-panel");
    const out = document.getElementById("diag-out");
    const copy = document.getElementById("diag-copy");
    const share = document.getElementById("diag-share");
    panel.hidden = false;
    copy.disabled = share.disabled = true;
    const lines = [];
    const put = (l) => { lines.push(l); diagText = lines.join("\n"); out.textContent = diagText; out.scrollTop = out.scrollHeight; };
    let bad = 0;
    const step = async (label, fn) => {
      const t0 = Date.now();
      try {
        const extra = await fn();
        put("통과  " + label + " " + (Date.now() - t0) + "ms" + (extra ? " " + extra : ""));
        return true;
      } catch (e) {
        bad++;
        put("실패  " + label + " " + (Date.now() - t0) + "ms — " + (e && e.message || e));
        return false;
      }
    };
    put("덜누름 워크 문제 진단  " + new Date().toLocaleString("ko-KR"));
    const info = await call("nodeDiag");
    if (info && info.ok) {
      put("앱: " + info.app);
      put("기기: " + info.device + " / 안드로이드 " + info.android + " / " + info.abis);
      put("웹뷰: " + info.webview);
      put("창: " + info.window + " / 화면 " + innerWidth + "x" + innerHeight + " @" + devicePixelRatio);
      const n = info.node || {};
      put("엔진 파일: " + (n.available ? "있음" : "없음") + " / 설치 " + (n.installed ? "됨" : "안 됨") + " / 저장공간 여유 " + n.freeMB + "MB");
      put("  " + (n.libs || []).join(" "));
    } else {
      bad++;
      put("실패  앱 정보 읽기 — " + (info && info.error || "응답 없음"));
    }
    put("");
    const up = await step("엔진 시작·연결", async () => {
      const v = await engineRequest({ t: "ping" }, (st, d) => put("  … " + st + (d ? " " + d : "")));
      return "(node " + (v && v.node) + ")";
    });
    if (up) {
      const files = await call("selftestFiles");
      const sample = {};
      if (files && files.ok) for (const f of files.files) sample[f.module] = f.path;
      for (const [mod, label] of DIAG_MODULES) {
        await step(label + " 새 문서", async () => {
          const r = await engineRequest({ t: "open", module: mod });
          await engineRequest({ t: "close", session: r.session }).catch(() => {});
        });
        if (sample[mod]) await step(label + " 견본 문서", async () => {
          const r = await engineRequest({ t: "open", module: mod, path: sample[mod] });
          await engineRequest({ t: "close", session: r.session }).catch(() => {});
        });
      }
    }
    put("");
    const after = await call("nodeDiag");
    const n = (after && after.node) || {};
    put("엔진 상태: 준비 " + !!n.ready + " / 실행 중 " + !!n.alive + " / 방법 " + (n.mode || "-") + (n.failure ? " / 오류: " + n.failure : ""));
    if (n.journal && n.journal.length) { put("기록:"); for (const l of n.journal.slice(-40)) put("  " + l); }
    if (n.output && n.output.length) { put("엔진 출력:"); for (const l of n.output.slice(-25)) put("  " + l); }
    put("");
    put(bad ? "결과: 실패 " + bad + "건 — 이 내용을 그대로 복사해 보내 주세요." : "결과: 모두 통과 (문서 엔진은 정상입니다)");
    notify("diagReport", diagText);
    copy.disabled = share.disabled = false;
    diagRunning = false;
  }
  document.getElementById("diag").addEventListener("click", runDiag);
  document.getElementById("diag-close").addEventListener("click", () => { document.getElementById("diag-panel").hidden = true; });
  document.getElementById("diag-copy").addEventListener("click", async () => {
    const r = await call("copyText", diagText);
    toast(r && r.ok ? "진단 결과를 복사했습니다" : "복사하지 못했습니다");
  });
  document.getElementById("diag-share").addEventListener("click", () => notify("shareText", diagText));

  let toastTimer = 0;
  function toast(text) {
    const el = document.getElementById("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function extOf(name) { const m = /\.([a-z0-9]+)$/i.exec(name || ""); return m ? m[1].toLowerCase() : ""; }

  // 최근 문서 (기기 안에만 저장)
  const KEY = "ieum.recent";
  function loadRecent() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (_) { return []; } }
  function saveRecent(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30))); } catch (_) {} }
  function remember(doc) { saveRecent([doc].concat(loadRecent().filter((d) => d.id !== doc.id))); }

  function openDoc(id, name, replace) {
    const mod = ROUTES[extOf(name)];
    if (!mod) {
      toast("아직 지원하지 않는 형식입니다: ." + (extOf(name) || "?"));
      return false;
    }
    remember({ id, name, mod, at: Date.now() });
    if (NODE_MODULES.has(mod)) {
      busy("문서를 준비하는 중…");
      call("materialize", id).then((r) => {
        if (!r.ok) { busy(""); toast(r.error || "문서를 준비하지 못했습니다"); return; }
        openInEngine(mod, r.path, name, replace);
      });
      return true;
    }
    const url = "../modules/" + mod + "/index.html?doc=" + encodeURIComponent(id) + "&name=" + encodeURIComponent(name);
    if (replace) location.replace(url); else location.href = url;
    return true;
  }

  function renderRecent() {
    const ul = document.getElementById("recent");
    const list = loadRecent();
    ul.textContent = "";
    if (list.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "아직 연 문서가 없습니다";
      ul.appendChild(li);
      return;
    }
    for (const d of list) {
      const li = document.createElement("li");
      const [label, cls] = BADGE[d.mod] || ["?", "md"];
      const badge = document.createElement("span");
      badge.className = "badge " + cls;
      badge.textContent = label;
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = d.name;
      const del = document.createElement("button");
      del.className = "del";
      del.setAttribute("aria-label", "목록에서 지우기");
      del.textContent = "×";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        saveRecent(loadRecent().filter((x) => x.id !== d.id));
        call("forget", d.id);
        renderRecent();
      });
      li.append(badge, name, del);
      li.addEventListener("click", async () => {
        const ok = await call("hasDocument", d.id);
        if (ok && ok.ok) openDoc(d.id, d.name);
        else { toast("파일에 접근할 수 없습니다. 다시 열어 주세요."); saveRecent(loadRecent().filter((x) => x.id !== d.id)); renderRecent(); }
      });
      ul.appendChild(li);
    }
  }

  document.getElementById("open").addEventListener("click", async () => {
    const r = await call("pickDocument");
    if (!r.ok) { toast(r.error || "파일을 열지 못했습니다"); return; }
    if (r.canceled) return;
    openDoc(r.id, r.name);
  });

  for (const b of document.querySelectorAll("[data-new]")) {
    b.addEventListener("click", () => {
      const mod = b.dataset.new;
      if (NODE_MODULES.has(mod)) openInEngine(mod, null, "");
      else location.href = "../modules/" + mod + "/index.html";
    });
  }

  // 문서 엔진 상태 표시
  (function showEngine(tries) {
    call("nodeStatus").then((st) => {
      const el = document.getElementById("engine");
      if (!el || !st || !st.ok) return;
      el.textContent = st.ready ? "문서 엔진 준비됨" : st.failure ? "문서 엔진 오류: " + st.failure : st.available ? "문서 엔진 준비 중…" : "이 기기에서는 문서 엔진을 쓸 수 없습니다";
      if (!st.ready && !st.failure && st.available && tries > 0) setTimeout(() => showEngine(tries - 1), 2000);
    });
  })(45);

  const params = new URLSearchParams(location.search);
  // 자동 점검 (빌드 서버의 에뮬레이터): ?selftest=<번호>
  if (params.get("selftest") !== null) {
    runSelftest(Number(params.get("selftest")) || 0);
    return;
  }

  // 다른 앱에서 "덜누름 워크 문서로 열기"로 들어온 경우
  if (params.get("open")) {
    if (openDoc(params.get("open"), params.get("name") || "문서", true)) return;
  }
  renderRecent();

  async function runSelftest(i) {
    const list = await call("selftestFiles");
    if (!list || !list.ok) { call("selftestReport", "setup", "fail " + (list && list.error)); return; }
    const item = list.files[i];
    if (!item) { call("selftestReport", "DONE", "all"); return; }
    try {
      const r = await engineRequest({ t: "open", module: item.module, path: item.path });
      location.href = "../modules/" + item.module + "/index.html?s=" + encodeURIComponent(r.session) + "&name=x&selftest=" + i;
    } catch (e) {
      call("selftestReport", item.module, "fail open: " + e.message);
      location.replace("index.html?selftest=" + (i + 1));
    }
  }
})();
