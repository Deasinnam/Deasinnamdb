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
  function engineRequest(req) {
    const A = bridge();
    if (!A) return Promise.reject(new Error("안드로이드 앱에서 실행해 주세요"));
    return new Promise((resolve, reject) => {
      const id = "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      let opened = false;
      channels.set(id, (ev, data) => {
        if (ev === "status") { const [st, ...d] = String(data).split(":"); if (st !== "ready") busy(d.join(":") || "문서 엔진 준비 중…"); }
        else if (ev === "open") { opened = true; A.postMessage(JSON.stringify({ id: 0, method: "nodeSend", args: [id, JSON.stringify({ ...req, id: 1 })] })); }
        else if (ev === "message") {
          let m; try { m = JSON.parse(data); } catch (_) { return; }
          channels.delete(id);
          A.postMessage(JSON.stringify({ id: 0, method: "nodeClose", args: [id] }));
          if (m.ok) resolve(m.v); else reject(new Error(m.e || "실패"));
        } else if (ev === "close") {
          channels.delete(id);
          reject(new Error(opened ? "문서 엔진 연결이 끊겼습니다" : "문서 엔진을 시작하지 못했습니다"));
        }
      });
      A.postMessage(JSON.stringify({ id: 0, method: "nodeOpen", args: [id, ""] }));
    });
  }

  function busy(text) {
    let el = document.getElementById("busy");
    if (!text) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = "busy"; document.body.appendChild(el); }
    el.textContent = text;
  }

  async function openInEngine(mod, path, name, replace) {
    busy("문서 엔진에서 여는 중…");
    try {
      const r = await engineRequest({ t: "open", module: mod, path: path || undefined });
      const url = "../modules/" + mod + "/index.html?s=" + encodeURIComponent(r.session) + "&name=" + encodeURIComponent(name || "");
      if (replace) location.replace(url); else location.href = url;
    } catch (e) {
      busy("");
      toast(e.message || "열지 못했습니다");
    }
  }

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
  call("nodeStatus").then((st) => {
    const el = document.getElementById("engine");
    if (!el || !st || !st.ok) return;
    el.textContent = st.ready ? "문서 엔진 준비됨" : st.failure ? "문서 엔진 오류: " + st.failure : st.available ? "문서 엔진 준비 중…" : "이 기기에서는 문서 엔진을 쓸 수 없습니다";
  });

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
