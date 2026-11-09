/*
 * IeumOffice 안드로이드판 — Electron 대체 셈
 *
 * 데스크톱판의 preload 스크립트는 require("electron")으로 contextBridge·ipcRenderer·webUtils만 씁니다.
 * 이 파일이 그 세 가지를 흉내 내고, ipcRenderer.invoke/send가 가는 곳(원래는 Electron 메인 프로세스)을
 * 아래 HANDLERS가 대신 받습니다. 파일 읽기는 앱이 띄운 /doc/<id> 주소로, 쓰기·파일 고르기는
 * 안드로이드 JS 인터페이스(window.IeumAndroid)로 처리합니다.
 */
(function () {
  "use strict";

  const MOD = (document.currentScript && document.currentScript.dataset.module) || "";

  // ---------- 안드로이드 호출 ----------
  // 앱은 addWebMessageListener로 이 출처(앱 내부 주소)에만 IeumAndroid 객체를 넣어 줍니다.
  // 요청: {id, method, args} / 응답: {id, result}. id 0은 응답 없는 알림입니다.
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
        done(msg.result == null ? { ok: false, error: "응답 없음" } : msg.result);
      };
    }
    return A;
  }
  function callAndroid(method, ...args) {
    const A = bridge();
    if (!A) return Promise.resolve({ ok: false, error: "안드로이드 연결 없음: " + method });
    return new Promise((resolve) => {
      const id = ++seq;
      waiting.set(id, resolve);
      A.postMessage(JSON.stringify({ id, method, args }));
    });
  }
  function notifyAndroid(method, ...args) {
    const A = bridge();
    if (A) A.postMessage(JSON.stringify({ id: 0, method, args }));
  }

  // ---------- 문서 경로 (가상 경로: /ieum/<docId>/<파일 이름>) ----------
  const params = new URLSearchParams(location.search);
  function pathFor(id, name) { return "/ieum/" + id + "/" + (name || "문서"); }
  function idOf(path) { const m = /^\/ieum\/([^/]+)\//.exec(path || ""); return m ? m[1] : null; }
  function nameOf(path) { return String(path || "").split("/").pop() || "문서"; }
  function extOf(path) { const m = /\.([a-z0-9]+)$/i.exec(path || ""); return m ? m[1].toLowerCase() : ""; }
  let currentPath = params.get("doc") ? pathFor(params.get("doc"), params.get("name")) : null;
  let dirty = false;

  async function fetchDoc(path) {
    const id = idOf(path);
    if (!id) throw new Error("알 수 없는 문서 경로: " + path);
    const res = await fetch("/doc/" + encodeURIComponent(id), { cache: "no-store" });
    if (!res.ok) throw new Error("파일을 읽지 못했습니다 (" + res.status + ")");
    return res;
  }

  function toBase64(bytes) {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let out = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < u8.length; i += CHUNK) {
      out += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
    }
    return btoa(out);
  }

  const MIME = {
    md: "text/markdown", markdown: "text/markdown", txt: "text/plain",
    html: "text/html", htm: "text/html",
    hwp: "application/x-hwp", hwpx: "application/hwp+zip", pdf: "application/pdf",
  };

  // 새 파일 만들기(다른 이름으로 저장). 결과: { ok, canceled?, path? }
  async function pickSaveTarget(suggestedName) {
    const r = await callAndroid("createDocument", suggestedName, MIME[extOf(suggestedName)] || "application/octet-stream");
    if (!r || !r.ok) return r || { ok: false, error: "저장 위치를 고르지 못했습니다" };
    if (r.canceled) return { ok: true, canceled: true };
    return { ok: true, path: pathFor(r.id, r.name || suggestedName) };
  }

  async function writeText(path, text) {
    return callAndroid("writeText", idOf(path), text);
  }
  async function writeBytes(path, bytes) {
    return callAndroid("writeBase64", idOf(path), toBase64(bytes));
  }

  function suggested(name, fallbackExt) {
    const base = name ? nameOf(name) : "새 문서";
    return /\.[a-z0-9]+$/i.test(base) ? base : base + "." + fallbackExt;
  }

  // 마크다운·HTML 공통 저장 (텍스트)
  async function saveText(request, ext) {
    if (!request || typeof request.text !== "string") return { ok: false, error: ext + ": bad save request" };
    if (request.pdfHtml) return { ok: false, error: "안드로이드판에서는 PDF로 내보내기를 아직 지원하지 않습니다" };
    let target = currentPath;
    if (request.mode === "saveAs" || !target) {
      const picked = await pickSaveTarget(suggested(request.suggestedName || currentPath, ext));
      if (!picked.ok || picked.canceled) return picked;
      target = picked.path;
    }
    const w = await writeText(target, request.text);
    if (!w || !w.ok) {
      // 원본에 쓰기 권한이 없을 수 있음(파일 관리자에서 연 경우) → 새 위치로 저장
      if (target === currentPath && request.mode !== "saveAs") {
        const picked = await pickSaveTarget(suggested(currentPath, ext));
        if (!picked.ok || picked.canceled) return picked;
        const w2 = await writeText(picked.path, request.text);
        if (!w2 || !w2.ok) return { ok: false, error: (w2 && w2.error) || "저장 실패" };
        target = picked.path;
      } else {
        return { ok: false, error: (w && w.error) || "저장 실패" };
      }
    }
    currentPath = target;
    toast("저장했습니다: " + nameOf(target));
    return { ok: true, path: target };
  }

  // ---------- 공통 + 모듈별 핸들러 ----------
  const PREVIEW_URL = "https://ieum-preview.local/view/";
  // AI 기능은 데스크톱 메인 프로세스가 API 키로 호출하던 것이라 안드로이드판에선 꺼 둡니다. 설정 모양만 맞춥니다.
  const AI_PROVIDER_DEFAULT = { apiKey: "", model: "" };
  const AI_SETTINGS = {
    provider: "auto",
    providers: new Proxy({}, { get: (t, k) => (typeof k === "string" ? (t[k] || AI_PROVIDER_DEFAULT) : undefined) }),
    media: { imageProvider: "none", analysisProvider: "chat", videoAnalysisProvider: "none", providers: {} },
    search: { provider: "parallel", providers: {} },
    meteredAccepted: {},
    headlessSubscriptionEnabled: false,
    headlessSubscriptionConsentVersion: 0,
    subscriptionNoticeSeen: true,
    subscriptionNoticeVersion: 2,
    pdfSendNoticeSeen: 0,
    internetTools: false,
  };
  let hwpPending = null; // { path, format }

  const HANDLERS = {
    "app:get-language": () => "ko",
    "app:get-theme": () => "system",
    "app:get-document-theme": () => "follow",
    "app:get-auto-save-default": () => ({ on: false, updatedAt: 0 }),
    "home:get-author-name": () => ({ value: "", fallback: "" }),
    "app:get-author-name": () => ({ value: "", fallback: "" }),
    "app:get-split-role": () => null,
    "app:get-ai-panel-prefs": () => ({ side: "left", fontSize: "default", customFontSize: 14, spellcheck: true, openInNewDocs: true, showAiSidebar: false }),
    "ai:get-settings": () => AI_SETTINGS,
    "project:resolveChat": (args) => ({ projectId: "default", chatId: (args && args.tempChatId) || "unsaved-" + Date.now() }),
    "project:loadChat": () => null,
    "projectFolder:getSelection": () => ({ projectId: null, initialChatId: null }),
    "projectFolder:getDefaultParentFolder": () => null,
    "ai:internet-tools": () => false,
    "ai:subscription-statuses": () => ({}),
    "drive:ai-enabled": () => false,
    "drive:connected": () => false,
    "doc:attach-available": () => false,
    "skills:take-handoff": () => null,

    // PDF
    "pdf:consume-pending": () => currentPath,
    "pdf:read-file": async (path) => (await fetchDoc(path)).arrayBuffer(),
    "pdf:get-username": () => "",
    "pdf:is-untitled": () => false,
    "pdf:is-untitled-copy": () => false,
    "pdf:list-edit-fonts": () => [],
    "pdf:save": () => ({ ok: false, error: "안드로이드판 1차 버전은 PDF 보기 전용입니다" }),

    // HWP / HWPX
    "hwp:consume-pending": () => currentPath,
    "hwp:untitled-copy": () => null,
    "hwp:tracking-dropped": () => false,
    "hwp:read-file": async (path) => new Uint8Array(await (await fetchDoc(path)).arrayBuffer()),
    "hwp:begin-save": async (mode) => {
      hwpPending = null;
      const curExt = extOf(currentPath);
      const curFormat = curExt === "hwp" || curExt === "hwpx" ? curExt : null;
      if (mode !== "saveAs" && currentPath && curFormat) {
        hwpPending = { path: currentPath, format: curFormat, fallback: true };
        return { ok: true, path: currentPath, format: curFormat };
      }
      if (mode !== "save" && mode !== "saveAs" && mode !== undefined) {
        return { ok: true, canceled: true }; // PDF 내보내기 등은 아직 미지원
      }
      const name = suggested(currentPath ? nameOf(currentPath).replace(/\.[^.]+$/, "") + ".hwpx" : "새 문서.hwpx", "hwpx");
      const picked = await pickSaveTarget(name);
      if (!picked.ok || picked.canceled) return picked;
      const fmt = extOf(picked.path) === "hwp" ? "hwp" : "hwpx";
      hwpPending = { path: picked.path, format: fmt };
      return { ok: true, path: picked.path, format: fmt };
    },
    "hwp:commit-save": async (data) => {
      const pending = hwpPending;
      hwpPending = null;
      if (!pending) return { ok: false, error: "hwp: no save in progress" };
      if (!(data instanceof Uint8Array) || data.length === 0) return { ok: false, error: "hwp: bad save request" };
      let target = pending.path;
      let w = await writeBytes(target, data);
      if ((!w || !w.ok) && pending.fallback) {
        const picked = await pickSaveTarget(nameOf(target));
        if (!picked.ok || picked.canceled) return { ok: false, error: "저장을 취소했습니다" };
        target = picked.path;
        w = await writeBytes(target, data);
      }
      if (!w || !w.ok) return { ok: false, error: (w && w.error) || "저장 실패" };
      currentPath = target;
      toast("저장했습니다: " + nameOf(target));
      return { ok: true, path: target };
    },

    // 마크다운
    "markdown:consume-pending": () => currentPath,
    "markdown:seed-take": () => null,
    "markdown:note-append-take": () => [],
    "markdown:recovery-open": () => null,
    "markdown:get-theme": () => "default",
    "markdown:read-file": async (path) => (await fetchDoc(path)).text(),
    "markdown:save": (request) => saveText(request, "md"),

    // HTML
    "html:consume-pending": () => currentPath,
    "html:seed-take": () => null,
    "html:recovery-open": () => null,
    "html:preview-info": () => ({ url: PREVIEW_URL }),
    "html:read-file": async (path) => (await fetchDoc(path)).text(),
    "html:save": (request) => saveText(request, "html"),
  };

  const SEND_HANDLERS = {
    // HTML 미리보기 본문은 앱이 별도 출처(PREVIEW_URL)로 내보냅니다. 문서 속 스크립트가 앱 브리지에 닿지 않게 하려는 것.
    "html:preview-update": (text) => { if (typeof text === "string") notifyAndroid("setPreview", text); },
  };
  for (const m of ["pdf", "hwp", "markdown", "html"]) {
    SEND_HANDLERS[m + ":dirty-changed"] = (d) => { dirty = !!d; };
  }

  const unhandled = new Set();
  function logUnhandled(kind, channel) {
    if (unhandled.has(channel)) return;
    unhandled.add(channel);
    console.debug("[ieum-shim] " + kind + " (미구현): " + channel);
  }

  // ---------- 가짜 electron ----------
  const listeners = new Map();
  const ipcRenderer = {
    invoke(channel, ...args) {
      const h = HANDLERS[channel];
      if (!h) {
        logUnhandled("invoke", channel);
        // 목록을 돌려주던 채널은 빈 목록으로 (프로젝트·스킬·위키 노트 등 데스크톱 전용 기능)
        return Promise.resolve(/:list|[-:]list[A-Z-]|:list-/.test(channel) ? [] : undefined);
      }
      try { return Promise.resolve(h(...args)); } catch (err) { return Promise.reject(err); }
    },
    send(channel, ...args) {
      const h = SEND_HANDLERS[channel];
      if (!h) { logUnhandled("send", channel); return; }
      try { h(...args); } catch (err) { console.error(err); }
    },
    sendSync(channel) { logUnhandled("sendSync", channel); return undefined; },
    postMessage(channel) { logUnhandled("postMessage", channel); },
    on(channel, fn) {
      if (!listeners.has(channel)) listeners.set(channel, new Set());
      listeners.get(channel).add(fn);
      return ipcRenderer;
    },
    once(channel, fn) {
      const wrap = (...a) => { ipcRenderer.removeListener(channel, wrap); fn(...a); };
      return ipcRenderer.on(channel, wrap);
    },
    removeListener(channel, fn) { const s = listeners.get(channel); if (s) s.delete(fn); return ipcRenderer; },
    off(channel, fn) { return ipcRenderer.removeListener(channel, fn); },
    removeAllListeners(channel) { if (channel) listeners.delete(channel); else listeners.clear(); return ipcRenderer; },
  };
  function emit(channel, ...args) {
    const s = listeners.get(channel);
    if (!s || s.size === 0) return false;
    for (const fn of Array.from(s)) {
      try { fn({ sender: ipcRenderer }, ...args); } catch (err) { console.error(err); }
    }
    return true;
  }

  const electron = {
    contextBridge: { exposeInMainWorld(key, value) { window[key] = value; } },
    ipcRenderer,
    webUtils: { getPathForFile() { return ""; } },
  };
  window.__ieumRequire = function (name) {
    if (name === "electron") return electron;
    throw new Error("[ieum-shim] require 미지원: " + name);
  };

  // ---------- 안드로이드 쪽에서 부르는 함수 ----------
  window.__ieumIsDirty = () => dirty;
  window.__ieumSave = (mode) => {
    if (MOD === "pdf") { toast("PDF는 아직 보기 전용입니다"); return; }
    if (!emit(MOD + ":save-request", mode || "save")) toast("이 화면에서는 저장할 수 없습니다");
  };

  // ---------- 화면 위 작은 메뉴 (저장 / 다른 이름으로 / 홈) ----------
  let toastEl = null;
  let toastTimer = 0;
  function toast(text) {
    if (!document.body) return;
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "ieum-toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }
  window.__ieumToast = toast;

  function goHome() {
    if (bridge()) notifyAndroid("goHome", dirty);
    else location.href = "../../home/index.html";
  }

  function installMenu() {
    const style = document.createElement("style");
    style.textContent = `
      .ieum-fab{position:fixed;right:14px;bottom:18px;z-index:2147483646;width:48px;height:48px;border-radius:24px;
        border:none;background:#2b6cb0;color:#fff;font:600 22px/48px system-ui,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3);
        opacity:.85;touch-action:none}
      .ieum-menu{position:fixed;right:14px;bottom:74px;z-index:2147483647;background:#fff;color:#1a202c;border-radius:12px;
        box-shadow:0 6px 24px rgba(0,0,0,.25);overflow:hidden;display:none;min-width:180px;font:15px system-ui,sans-serif}
      .ieum-menu.open{display:block}
      .ieum-menu button{display:block;width:100%;padding:14px 18px;border:none;background:none;text-align:left;font:inherit;color:inherit}
      .ieum-menu button:active{background:#edf2f7}
      .ieum-toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:2147483647;background:rgba(26,32,44,.92);
        color:#fff;padding:10px 16px;border-radius:18px;font:14px system-ui,sans-serif;opacity:0;transition:opacity .2s;pointer-events:none;max-width:86vw}
      .ieum-toast.show{opacity:1}
      @media (prefers-color-scheme: dark){.ieum-menu{background:#2d3748;color:#f7fafc}.ieum-menu button:active{background:#4a5568}}
    `;
    document.head.appendChild(style);
    const fab = document.createElement("button");
    fab.className = "ieum-fab";
    fab.setAttribute("aria-label", "메뉴");
    fab.textContent = "⋯";
    const menu = document.createElement("div");
    menu.className = "ieum-menu";
    const items = MOD === "pdf"
      ? [["홈으로", goHome]]
      : [["저장", () => window.__ieumSave("save")], ["다른 이름으로 저장", () => window.__ieumSave("saveAs")], ["홈으로", goHome]];
    for (const [label, fn] of items) {
      const b = document.createElement("button");
      b.textContent = label;
      b.addEventListener("click", () => { menu.classList.remove("open"); fn(); });
      menu.appendChild(b);
    }
    fab.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.toggle("open"); });
    document.addEventListener("click", (e) => { if (!menu.contains(e.target)) menu.classList.remove("open"); }, true);
    document.body.appendChild(menu);
    document.body.appendChild(fab);
  }

  // Ctrl+S (블루투스 키보드·DeX)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      window.__ieumSave(e.shiftKey ? "saveAs" : "save");
    }
  }, true);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installMenu);
  else installMenu();
})();
