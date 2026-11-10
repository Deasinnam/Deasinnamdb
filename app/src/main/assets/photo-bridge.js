/*
 * 덜누름 워크 사진 편집 — 편집기(PhotoCraft 웹 빌드)와 앱을 잇는 작은 스크립트 (페이지보다 먼저 실행됨)
 *
 * 1) 저장: 웹판은 저장·내보내기를 "다운로드"(<a download href=blob:>.click())로 합니다.
 *    그 순간을 가로채 파일 내용을 앱으로 넘기면, 앱이 안드로이드 "파일 만들기"로 저장합니다.
 * 2) 다른 앱에서 열기: 앱이 넘긴 파일을 캔버스에 "끌어다 놓기"로 넣어 엽니다.
 * 3) 자동 점검(빌드 서버 에뮬레이터): ?selftest 가 붙으면 화면 상태와 저장 경로를 보고합니다.
 */
(function () {
  "use strict";
  if (window.__photocraftAndroid) return;
  window.__photocraftAndroid = true;

  const bridge = () => window.PhotoCraftAndroid || null;
  function post(msg) {
    const A = bridge();
    if (A) A.postMessage(JSON.stringify(msg));
  }

  function b64(u8) {
    let s = "";
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(s) {
    const bin = atob(s);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }

  // ---------- 1) 저장 ----------
  // 웹판은 클릭 직후 주소를 폐기(revoke)할 수 있으므로, 주소를 만들 때 Blob을 미리 기억해 둡니다.
  const blobs = new Map();
  const origCreate = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (obj) {
    const url = origCreate(obj);
    if (obj instanceof Blob) {
      blobs.set(url, obj);
      setTimeout(() => blobs.delete(url), 120000);
    }
    return url;
  };

  let saveSeq = 0;
  async function sendBlob(blob, name) {
    const id = ++saveSeq;
    post({ t: "save-begin", id, name, mime: blob.type || "", size: blob.size });
    const CH = 768 * 1024;
    for (let off = 0; off < blob.size; off += CH) {
      const part = new Uint8Array(await blob.slice(off, off + CH).arrayBuffer());
      post({ t: "save-chunk", id, d: b64(part) });
    }
    post({ t: "save-end", id });
  }

  const origClick = HTMLElement.prototype.click;
  HTMLElement.prototype.click = function () {
    try {
      if (bridge() && this instanceof HTMLAnchorElement && this.hasAttribute("download")) {
        const href = this.href || "";
        const name = this.getAttribute("download") || "image";
        const blob = blobs.get(href);
        if (blob) { sendBlob(blob, name); return; }
        if (href.startsWith("data:") || href.startsWith("blob:")) {
          fetch(href).then((r) => r.blob()).then((b) => sendBlob(b, name)).catch((e) => post({ t: "log", m: "저장 실패: " + e }));
          return;
        }
      }
    } catch (e) {
      post({ t: "log", m: "저장 가로채기 오류: " + e });
    }
    return origClick.apply(this, arguments);
  };

  // ---------- 2) 다른 앱에서 연 파일 ----------
  const incoming = new Map();
  function onAppMessage(ev) {
    let m;
    try { m = JSON.parse(ev.data); } catch (_) { return; }
    if (m.t === "open-begin") incoming.set(m.id, { name: m.name, mime: m.mime, parts: [] });
    else if (m.t === "open-chunk") { const f = incoming.get(m.id); if (f) f.parts.push(unb64(m.d)); }
    else if (m.t === "open-end") {
      const f = incoming.get(m.id);
      incoming.delete(m.id);
      if (f) dropWhenReady(new File(f.parts, f.name, { type: f.mime || "" }));
    }
  }
  function dropWhenReady(file, tries) {
    tries = tries || 0;
    const canvas = document.querySelector("canvas");
    const ready = canvas && canvas.width > 0 && document.body && document.body.dataset.photocraftReady !== "0";
    if (!ready || performance.now() < 4000) {
      if (tries < 120) setTimeout(() => dropWhenReady(file, tries + 1), 500);
      return;
    }
    const dt = new DataTransfer();
    dt.items.add(file);
    const r = canvas.getBoundingClientRect();
    const at = { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    for (const type of ["dragenter", "dragover", "drop"]) canvas.dispatchEvent(new DragEvent(type, at));
    post({ t: "log", m: "열기: " + file.name + " (" + file.size + "바이트)" });
  }

  function wire() {
    const A = bridge();
    if (!A) return false;
    A.onmessage = onAppMessage;
    post({ t: "ready" });
    return true;
  }
  if (!wire()) document.addEventListener("DOMContentLoaded", wire);

  // ---------- 3) 자동 점검 ----------
  if (/[?&]selftest\b/.test(location.search)) {
    const errors = [];
    window.addEventListener("error", (e) => errors.push(String(e.message || e)));
    window.addEventListener("unhandledrejection", (e) => errors.push("거부: " + String(e.reason && e.reason.message || e.reason)));
    const origError = console.error;
    console.error = function () { errors.push(Array.from(arguments).join(" ").slice(0, 300)); return origError.apply(this, arguments); };
    // 로딩 문구가 사라질 때까지(최대 150초) 기다린 뒤 보고
    const started = Date.now();
    const check = () => {
      const c = document.querySelector("canvas");
      const text = ((document.body && document.body.innerText) || "").replace(/\s+/g, " ").slice(0, 300);
      const loading = /Loading PhotoCraft|사진 편집을 준비|taking longer|failed to download|stopped/i.test(text);
      if (loading && Date.now() - started < 150000) { setTimeout(check, 3000); return; }
      post({
        t: "selftest",
        step: "page",
        canvas: c ? c.width + "x" + c.height : "none",
        started: !loading,
        seconds: Math.round((Date.now() - started) / 1000),
        webgpu: !!navigator.gpu,
        ua: navigator.userAgent,
        text,
        errors: errors.length,
        first: errors.slice(0, 4).join(" | ").slice(0, 900),
      });
      // 저장 경로 점검: 작은 파일 하나를 "다운로드"해 봄
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["photocraft-android-selftest"], { type: "text/plain" }));
      a.download = "selftest.txt";
      a.click();
      setTimeout(() => post({ t: "selftest-done" }), 6000);
    };
    setTimeout(check, 10000);
  }
})();
