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
        if (msg && msg.node) { const ch = nodeChannels.get(msg.node); if (ch) ch._push(msg.ev, msg.data); return; }
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
  // ---------- Node 연결 통로 ----------
  // 화면은 Node에 직접 붙지 않고 앱(IeumAndroid)이 중계합니다. 포트·비밀값은 앱만 압니다.
  // (안드로이드 밖에서 시험할 때만 ?p=&k= 로 직접 웹소켓을 씁니다)
  const nodeChannels = new Map();
  let nodeChannelSeq = 0;
  function openNodeChannel(query) {
    const id = "c" + (++nodeChannelSeq) + "-" + Math.random().toString(36).slice(2, 8);
    const ch = { onopen: null, onmessage: null, onclose: null, readyState: 0 };
    ch._push = (ev, data) => {
      if (ev === "open") { ch.readyState = 1; ch.onopen && ch.onopen(); }
      else if (ev === "message") ch.onmessage && ch.onmessage({ data });
      else if (ev === "close") { ch.readyState = 3; nodeChannels.delete(id); ch.onclose && ch.onclose({ code: Number(data) || 1006 }); }
    };
    const direct = new URLSearchParams(location.search);
    if (!bridge() && direct.get("p")) {
      const ws = new WebSocket("ws://localhost:" + direct.get("p") + "/ws?token=" + encodeURIComponent(direct.get("k") || "") + "&" + query);
      ws.onopen = () => ch._push("open");
      ws.onmessage = (e) => ch._push("message", e.data);
      ws.onclose = (e) => ch._push("close", e.code);
      ch.send = (t) => ws.send(t);
      ch.close = () => ws.close();
      return ch;
    }
    nodeChannels.set(id, ch);
    ch.send = (t) => notifyAndroid("nodeSend", id, t);
    ch.close = () => notifyAndroid("nodeClose", id);
    notifyAndroid("nodeOpen", id, query);
    return ch;
  }
  window.__ieumOpenNodeChannel = openNodeChannel;

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
  let nodeOpenSeen = false;

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


  // ================= Node 모드 =================
  // 워드·엑셀·파워포인트·EPUB·마인드맵·다이어그램은 데스크톱 메인 코드가 앱 안 Node에서 돕니다.
  // 주소에 ?s=<세션>&p=<포트>&k=<비밀값> 이 붙어 오면 ipcRenderer를 웹소켓으로 그 세션에 잇습니다.
  const NODE_SID = params.get("s");
  const NODE = NODE_SID ? (function () {
    const ORIGIN = location.origin;
    const SCHEMES = ["genoffice-docx-media", "genoffice-slide-media", "epub-asset", "drawio-app"];
    const PROTO = ORIGIN + "/proto/m/" + MOD + "/";
    const TYPED = ["Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array"];

    // 메인이 준 자체 프로토콜 주소 → 앱 내부 주소, 화면이 돌려보내는 주소는 반대로
    function toWeb(str) {
      if (str.indexOf("://") < 0) return str;
      for (const sc of SCHEMES) if (str.indexOf(sc + "://") >= 0) str = str.split(sc + "://").join(PROTO + sc + "/");
      if (str.startsWith("genoffice-app://")) return ORIGIN + "/assets/www/modules/" + str.slice(16);
      return str;
    }
    function toMain(str) {
      if (str.indexOf(PROTO) < 0) return str;
      for (const sc of SCHEMES) str = str.split(PROTO + sc + "/").join(sc + "://");
      return str;
    }
    function b64(u8) {
      let out = "";
      for (let i = 0; i < u8.length; i += 0x8000) out += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return btoa(out);
    }
    function unb64(s) {
      const bin = atob(s);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return u8;
    }
    function encode(v, seen) {
      seen = seen || new WeakSet();
      if (v === undefined) return { $t: "u" };
      if (v === null || typeof v === "boolean") return v;
      if (typeof v === "string") return toMain(v);
      if (typeof v === "number") return Number.isFinite(v) ? v : { $t: "n", v: String(v) };
      if (typeof v === "bigint") return { $t: "bi", v: v.toString() };
      if (typeof v !== "object") return { $t: "u" };
      if (seen.has(v)) return null;
      if (v instanceof ArrayBuffer) return { $t: "ab", d: b64(new Uint8Array(v)) };
      if (ArrayBuffer.isView(v)) {
        const name = TYPED.includes(v.constructor.name) ? v.constructor.name : "Uint8Array";
        return { $t: name, d: b64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
      }
      if (v instanceof Date) return { $t: "date", v: v.getTime() };
      if (v instanceof Error) return { $t: "err", name: v.name, message: v.message };
      if (v instanceof RegExp) return { $t: "re", s: v.source, f: v.flags };
      if (typeof File !== "undefined" && v instanceof Blob) return null;
      seen.add(v);
      if (v instanceof Map) return { $t: "map", v: Array.from(v).map(([k, x]) => [encode(k, seen), encode(x, seen)]) };
      if (v instanceof Set) return { $t: "set", v: Array.from(v).map((x) => encode(x, seen)) };
      if (Array.isArray(v)) return v.map((x) => encode(x, seen));
      const out = {};
      for (const k of Object.keys(v)) {
        const x = v[k];
        if (typeof x === "function" || typeof x === "symbol") continue;
        out[k] = encode(x, seen);
      }
      return Object.prototype.hasOwnProperty.call(out, "$t") ? { $t: "obj", v: out } : out;
    }
    function decode(v) {
      if (typeof v === "string") return toWeb(v);
      if (v === null || typeof v !== "object") return v;
      if (Array.isArray(v)) return v.map(decode);
      if (typeof v.$t === "string") {
        switch (v.$t) {
          case "u": return undefined;
          case "n": return Number(v.v);
          case "bi": return BigInt(v.v);
          case "ab": return unb64(v.d).buffer;
          case "date": return new Date(v.v);
          case "err": { const e = new Error(v.message); e.name = v.name; return e; }
          case "re": return new RegExp(v.s, v.f);
          case "map": return new Map(v.v.map(([k, x]) => [decode(k), decode(x)]));
          case "set": return new Set(v.v.map(decode));
          case "obj": { const o = {}; for (const k of Object.keys(v.v)) o[k] = decode(v.v[k]); return o; }
          default:
            if (TYPED.includes(v.$t)) {
              const u8 = unb64(v.d);
              return v.$t === "Uint8Array" ? u8 : new self[v.$t](u8.buffer);
            }
        }
      }
      const o = {};
      for (const k of Object.keys(v)) o[k] = decode(v[k]);
      return o;
    }

    let ws = null;
    let open = false;
    const queue = [];
    const pendingInvokes = new Map();
    let invokeSeq = 0;
    function connect() {
      ws = openNodeChannel("session=" + encodeURIComponent(NODE_SID));
      ws.onopen = () => { open = true; nodeOpenSeen = true; while (queue.length) ws.send(queue.shift()); };
      ws.onclose = (ev) => {
        open = false;
        if (ev.code === 4004) { toast("편집기 세션이 끝났습니다. 홈에서 다시 열어 주세요."); return; }
        setTimeout(connect, 800); // Node가 잠깐 끊겨도 다시 붙음
      };
      ws.onmessage = (ev) => {
        let m;
        try { m = JSON.parse(ev.data); } catch (_) { return; }
        if (m.t === "result") {
          const p = pendingInvokes.get(m.id);
          if (!p) return;
          pendingInvokes.delete(m.id);
          if (m.ok) p.resolve(decode(m.v));
          else if (/^No handler registered/.test(m.e) && p.fallback) p.fallback();
          else p.reject(new Error("Error invoking remote method: " + m.e));
        } else if (m.t === "event") {
          if (m.ch === "__ieum:dirty") { dirty = !!m.a[0]; return; }
          if (m.ch === "__ieum:menu") { appMenu = m.a[0]; return; }
          if (m.ch === "__ieum:role") { try { document.execCommand(String(m.a[0])); } catch (_) {} return; }
          emit(m.ch, ...decode(m.a || []));
        } else if (m.t === "ask") {
          answerAsk(m.fn, decode(m.a || [])).then(
            (v) => post({ t: "answer", id: m.id, ok: true, v: encode(v) }),
            (e) => post({ t: "answer", id: m.id, ok: false, e: String(e && e.message || e) })
          );
        }
      };
    }
    function post(msg) {
      const text = JSON.stringify(msg);
      if (open) ws.send(text); else queue.push(text);
    }
    connect();

    function invoke(channel, args) {
      return new Promise((resolve, reject) => {
        const id = ++invokeSeq;
        // 데스크톱에선 껍데기 앱이 답하던 공통 채널(app:·ai:·project: 등)은 셈의 기본값으로
        const fallback = () => {
          const h = HANDLERS[channel];
          if (h) { try { resolve(h(...args)); } catch (e) { reject(e); } return; }
          logUnhandled("invoke(node)", channel);
          resolve(/:list|[-:]list[A-Z-]|:list-/.test(channel) ? [] : undefined);
        };
        pendingInvokes.set(id, { resolve, reject, fallback });
        post({ t: "invoke", id, ch: channel, a: encode(args) });
      });
    }
    function send(channel, args) {
      if (/dirty/i.test(channel) && typeof args[0] === "boolean") dirty = args[0];
      post({ t: "send", ch: channel, a: encode(args) });
    }

    // 메인이 화면에 묻는 것: 저장/열기 대화상자, 확인 창, 바깥 링크, 클립보드, 파일 옮겨 쓰기
    async function answerAsk(fn, args) {
      const o = args[0] || {};
      switch (fn) {
        case "dialog.showSaveDialog": {
          const base = String(o.defaultPath || "새 문서").split(/[\\/]/).pop();
          const ext = (/\.([a-z0-9]+)$/i.exec(base) || [])[1] || firstExt(o.filters) || "";
          const name = /\.[a-z0-9]+$/i.test(base) || !ext ? base : base + "." + ext;
          const r = await callAndroid("createDocument", name, mimeOfExt(ext), true);
          if (!r || !r.ok || r.canceled || !r.path) return { canceled: true, filePath: "" };
          return { canceled: false, filePath: r.path };
        }
        case "dialog.showOpenDialog": {
          const r = await callAndroid("pickDocument", true);
          if (!r || !r.ok || r.canceled || !r.path) return { canceled: true, filePaths: [] };
          return { canceled: false, filePaths: [r.path] };
        }
        case "dialog.showMessageBox":
          return messageBox(o);
        case "dialog.showErrorBox":
          await messageBox({ title: o.title, message: o.title, detail: o.content, buttons: ["확인"] });
          return true;
        case "shell.openExternal":
          notifyAndroid("openExternal", String(o));
          return true;
        case "clipboard.writeText":
          try { await navigator.clipboard.writeText(String(args[0] || "")); } catch (_) {}
          return true;
        case "android.syncFile": {
          const r = await callAndroid("syncFile", String(args[0] || ""));
          if (r && r.ok && r.synced) toast("저장했습니다");
          else if (r && !r.ok) toast(r.error || "원본 위치에 저장하지 못했습니다");
          return !!(r && r.ok);
        }
        default:
          throw new Error("모르는 요청: " + fn);
      }
    }
    function firstExt(filters) {
      if (!Array.isArray(filters)) return "";
      for (const f of filters) for (const e of f.extensions || []) if (e && e !== "*") return e;
      return "";
    }
    function mimeOfExt(ext) {
      return ({
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        pdf: "application/pdf", epub: "application/epub+zip", xmind: "application/vnd.xmind.workbook",
        drawio: "application/vnd.jgraph.mxfile", csv: "text/csv", md: "text/markdown", html: "text/html",
        odt: "application/vnd.oasis.opendocument.text", png: "image/png", svg: "image/svg+xml",
      })[String(ext).toLowerCase()] || "application/octet-stream";
    }

    // 데스크톱 확인 창(dialog.showMessageBox)을 화면 안 모달로
    function messageBox(o) {
      return new Promise((resolve) => {
        const wrap = document.createElement("div");
        wrap.className = "ieum-modal";
        const box = document.createElement("div");
        box.className = "ieum-box";
        const msg = document.createElement("div");
        msg.className = "ieum-msg";
        msg.textContent = o.message || o.title || "";
        box.appendChild(msg);
        if (o.detail) {
          const d = document.createElement("div");
          d.className = "ieum-detail";
          d.textContent = o.detail;
          box.appendChild(d);
        }
        let check = null;
        if (o.checkboxLabel) {
          const l = document.createElement("label");
          check = document.createElement("input");
          check.type = "checkbox";
          check.checked = !!o.checkboxChecked;
          l.append(check, " " + o.checkboxLabel);
          box.appendChild(l);
        }
        const row = document.createElement("div");
        row.className = "ieum-buttons";
        const buttons = Array.isArray(o.buttons) && o.buttons.length ? o.buttons : ["확인"];
        buttons.forEach((label, i) => {
          const b = document.createElement("button");
          b.textContent = String(label).replace(/&/g, "");
          if (i === (o.defaultId ?? 0)) b.className = "primary";
          b.addEventListener("click", () => { wrap.remove(); resolve({ response: i, checkboxChecked: !!(check && check.checked) }); });
          row.appendChild(b);
        });
        box.appendChild(row);
        wrap.appendChild(box);
        document.body.appendChild(wrap);
      });
    }

    let appMenu = null;
    window.__ieumProtoBase = (scheme) => PROTO + scheme + "/";
    return {
      invoke, send,
      menu: () => appMenu,
      clickMenu: (path) => post({ t: "menu", path }),
    };
  })() : null;

  // ---------- 가짜 electron ----------
  const listeners = new Map();
  const ipcRenderer = {
    invoke(channel, ...args) {
      if (NODE) return NODE.invoke(channel, args);
      const h = HANDLERS[channel];
      if (!h) {
        logUnhandled("invoke", channel);
        // 목록을 돌려주던 채널은 빈 목록으로 (프로젝트·스킬·위키 노트 등 데스크톱 전용 기능)
        return Promise.resolve(/:list|[-:]list[A-Z-]|:list-/.test(channel) ? [] : undefined);
      }
      try { return Promise.resolve(h(...args)); } catch (err) { return Promise.reject(err); }
    },
    send(channel, ...args) {
      if (NODE) { NODE.send(channel, args); return; }
      const h = SEND_HANDLERS[channel];
      if (!h) { logUnhandled("send", channel); return; }
      try { h(...args); } catch (err) { console.error(err); }
    },
    sendSync(channel) { logUnhandled("sendSync", channel); return undefined; },
    postMessage(channel, message) { if (NODE) NODE.send(channel, [message]); else logUnhandled("postMessage", channel); },
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
    if (NODE) {
      // 워드·엑셀·파워포인트: 데스크톱 메뉴의 저장 항목(Ctrl+S / Ctrl+Shift+S)을 그대로 누릅니다
      const want = mode === "saveAs" ? /^(CmdOrCtrl|CommandOrControl|Ctrl)\+Shift\+S$/i : /^(CmdOrCtrl|CommandOrControl|Ctrl)\+S$/i;
      const hit = findMenu(NODE.menu(), (it) => it.accelerator && want.test(it.accelerator));
      if (hit) { NODE.clickMenu(hit); return; }
    }
    if (!emit(MOD + ":save-request", mode || "save")) toast("이 화면에서는 저장할 수 없습니다");
  };
  function findMenu(items, test, path) {
    if (!Array.isArray(items)) return null;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const here = (path || []).concat(i);
      if (it.enabled !== false && it.visible !== false && test(it)) return here;
      const sub = findMenu(it.submenu, test, here);
      if (sub) return sub;
    }
    return null;
  }

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
      .ieum-menu{max-height:70vh;overflow-y:auto}
      .ieum-menu .ieum-sep{height:1px;background:#e2e8f0;margin:4px 0}
      .ieum-menu .ieum-acc{float:right;opacity:.5;font-size:12px;margin-left:16px}
      .ieum-menu button[disabled]{opacity:.4}
      .ieum-modal{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:20px}
      .ieum-box{background:#fff;color:#1a202c;border-radius:14px;max-width:460px;width:100%;padding:20px;font:15px/1.5 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.3)}
      .ieum-msg{font-weight:600;margin-bottom:8px;white-space:pre-wrap}
      .ieum-detail{color:#4a5568;font-size:14px;margin-bottom:12px;white-space:pre-wrap}
      .ieum-buttons{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:14px}
      .ieum-buttons button{border:1px solid #cbd5e0;background:#fff;border-radius:10px;padding:10px 14px;font:inherit}
      .ieum-buttons button.primary{background:#2b6cb0;border-color:#2b6cb0;color:#fff}
      @media (prefers-color-scheme: dark){.ieum-menu{background:#2d3748;color:#f7fafc}.ieum-menu button:active{background:#4a5568}}
    `;
    document.head.appendChild(style);
    const fab = document.createElement("button");
    fab.className = "ieum-fab";
    fab.setAttribute("aria-label", "메뉴");
    fab.textContent = "⋯";
    const menu = document.createElement("div");
    menu.className = "ieum-menu";
    function addButton(parent, label, fn, extra) {
      const b = document.createElement("button");
      b.textContent = label;
      if (extra) { const a = document.createElement("span"); a.className = "ieum-acc"; a.textContent = extra; b.appendChild(a); }
      b.addEventListener("click", (e) => { e.stopPropagation(); fn(); });
      parent.appendChild(b);
      return b;
    }
    function renderTop() {
      menu.textContent = "";
      const close = (fn) => () => { menu.classList.remove("open"); fn(); };
      if (MOD !== "pdf") {
        addButton(menu, "저장", close(() => window.__ieumSave("save")));
        addButton(menu, "다른 이름으로 저장", close(() => window.__ieumSave("saveAs")));
      }
      const appItems = NODE && NODE.menu();
      if (Array.isArray(appItems) && appItems.length) {
        addButton(menu, "메뉴 전체 ›", () => renderSub(appItems, []));
      }
      addButton(menu, "홈으로", close(goHome));
    }
    // 데스크톱판 메뉴 막대(파일·편집·보기…)를 그대로 펼쳐 보여 줍니다
    function renderSub(items, path) {
      menu.textContent = "";
      addButton(menu, "‹ 뒤로", () => (path.length ? renderSub(parentItems(path.slice(0, -1)), path.slice(0, -1)) : renderTop()));
      items.forEach((it, i) => {
        if (it.visible === false) return;
        if (it.type === "separator") { const d = document.createElement("div"); d.className = "ieum-sep"; menu.appendChild(d); return; }
        const label = String(it.label || it.role || "").replace(/&/g, "");
        const here = path.concat(i);
        if (Array.isArray(it.submenu)) { addButton(menu, label + " ›", () => renderSub(it.submenu, here)); return; }
        const b = addButton(menu, (it.checked ? "✓ " : "") + label, () => { menu.classList.remove("open"); NODE.clickMenu(here); },
          it.accelerator ? String(it.accelerator).replace(/CmdOrCtrl|CommandOrControl/i, "Ctrl") : "");
        if (it.enabled === false) b.disabled = true;
      });
    }
    function parentItems(path) {
      let items = NODE.menu();
      for (const i of path) items = items[i].submenu;
      return items;
    }
    renderTop();
    fab.addEventListener("click", (e) => { e.stopPropagation(); if (!menu.classList.contains("open")) renderTop(); menu.classList.toggle("open"); });
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

  // 자동 점검: 화면이 뜬 뒤 결과를 앱 로그로 보내고 다음 문서로 넘어갑니다
  if (params.get("selftest") !== null) {
    const errors = [];
    window.addEventListener("error", (e) => errors.push(String(e.message || e)));
    window.addEventListener("unhandledrejection", (e) => errors.push("거부: " + String(e.reason && e.reason.message || e.reason)));
    setTimeout(() => {
      const text = (document.body && document.body.innerText) || "";
      const ok = text.length > 40 && errors.length === 0 && (!NODE || nodeOpenSeen);
      notifyAndroid("selftestReport", MOD, (ok ? "ok" : "fail") + " text=" + text.length + " node=" + nodeOpenSeen + " errors=" + errors.length + (errors[0] ? " first=" + errors[0].slice(0, 200) : ""));
      location.replace("../../home/index.html?selftest=" + (Number(params.get("selftest")) + 1));
    }, 15000);
  }
})();
