(function () {
  "use strict";

  // 확장자 → 편집기 모듈
  const ROUTES = { hwp: "hwp", hwpx: "hwp", md: "markdown", markdown: "markdown", txt: "markdown", html: "html", htm: "html", pdf: "pdf" };
  const BADGE = { hwp: ["HWP", "hwp"], markdown: ["MD", "md"], html: ["HTML", "html"], pdf: ["PDF", "pdf"] };

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
    b.addEventListener("click", () => { location.href = "../modules/" + b.dataset.new + "/index.html"; });
  }

  // 다른 앱에서 "이음오피스로 열기"로 들어온 경우
  const params = new URLSearchParams(location.search);
  if (params.get("open")) {
    if (openDoc(params.get("open"), params.get("name") || "문서", true)) return;
  }
  renderRecent();
})();
