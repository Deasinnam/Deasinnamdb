/*
 * 덜누름 워크 사진 정리(LightCraft 웹 빌드) · 녹음 편집(SoundCraft 웹 빌드) — 편집기와 앱을 잇는 스크립트 (페이지보다 먼저 실행됨)
 * 어느 편집기인지는 주소(/assets/light/, /assets/sound/)로 정합니다.
 *
 * 1) 저장: 웹판은 저장 · 내보내기를 "다운로드"(<a download href=blob:>.click())로 합니다.
 *    그 순간을 가로채 파일 내용을 앱으로 넘기면, 앱이 안드로이드 "파일 만들기"로 저장합니다.
 * 2) 다른 앱에서 연 파일 · 공유받은 파일 · 앱에서 녹음한 파일: 편집기 화면에 "끌어다 놓기"로 넣습니다.
 *    (사진 정리: 보관함으로 가져오기, 녹음 편집: 세션 파일은 열기, 소리 파일은 새 트랙으로 가져오기)
 * 3) 시작 실패 시 다시 시도: 녹음 편집이 WebGPU로 시작하지 못하면 WebGL2로 한 번 더.
 * 4) 자동 점검(빌드 서버 에뮬레이터): ?selftest 가 붙으면 시작 · 저장 경로 · 가져오기를 보고합니다.
 */
(function () {
  "use strict";
  if (window.__dnEguiBridge) return;
  window.__dnEguiBridge = true;

  const KIND = /\/assets\/sound\//.test(location.pathname) ? "sound" : "light";
  const CFG = {
    light: { bridge: "LightCraftAndroid", loading: "lightcraft_loading", busy: /Loading LightCraft|사진 정리를 준비/i, failed: /failed to load|시작하지 못했/i },
    sound: { bridge: "SoundCraftAndroid", loading: "soundcraft_loading", busy: /Loading SoundCraft|녹음 편집을 준비/i, failed: /failed to start|시작하지 못했/i },
  }[KIND];

  const bridge = () => window[CFG.bridge] || null;
  function post(msg) {
    const A = bridge();
    if (A) A.postMessage(JSON.stringify(msg));
  }
  const log = (m) => post({ t: "log", m: String(m) });

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
      setTimeout(() => blobs.delete(url), 300000);
    }
    return url;
  };

  // 저장은 한 번에 하나씩 (내보내기 여러 장 · 긴 녹음은 클 수 있음)
  let saveSeq = 0;
  let saveChain = Promise.resolve();
  function sendBlob(blob, name) {
    saveChain = saveChain.then(async () => {
      const id = ++saveSeq;
      post({ t: "save-begin", id, name, mime: blob.type || "", size: blob.size });
      const CH = 1536 * 1024;
      for (let off = 0; off < blob.size; off += CH) {
        const part = new Uint8Array(await blob.slice(off, off + CH).arrayBuffer());
        post({ t: "save-chunk", id, d: b64(part) });
        if (blob.size > 32 * 1024 * 1024) await new Promise((r) => setTimeout(r, 0));
      }
      post({ t: "save-end", id });
    }).catch((e) => log("저장 실패: " + e));
    return saveChain;
  }

  const origClick = HTMLElement.prototype.click;
  HTMLElement.prototype.click = function () {
    try {
      if (bridge() && this instanceof HTMLAnchorElement && this.hasAttribute("download")) {
        const href = this.href || "";
        const name = this.getAttribute("download") || (KIND === "sound" ? "audio" : "photo");
        const blob = blobs.get(href);
        if (blob) { sendBlob(blob, name); return; }
        if (href.startsWith("data:") || href.startsWith("blob:")) {
          fetch(href).then((r) => r.blob()).then((b) => sendBlob(b, name)).catch((e) => log("저장 실패: " + e));
          return;
        }
      }
    } catch (e) {
      log("저장 가로채기 오류: " + e);
    }
    return origClick.apply(this, arguments);
  };

  // ---------- 2) 앱이 넘긴 파일 ----------
  function started() {
    const c = document.querySelector("canvas");
    const el = document.getElementById(CFG.loading);
    const busy = el && el.isConnected && getComputedStyle(el).display !== "none";
    return !!(c && c.width > 0 && !busy);
  }

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

  function dropFile(file) {
    const canvas = document.querySelector("canvas");
    const dt = new DataTransfer();
    dt.items.add(file);
    const r = canvas.getBoundingClientRect();
    const at = { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    for (const type of ["dragenter", "dragover", "drop"]) canvas.dispatchEvent(new DragEvent(type, at));
  }

  function dropWhenReady(file, tries) {
    tries = tries || 0;
    if (!started() || performance.now() < 3000) {
      if (tries < 240) setTimeout(() => dropWhenReady(file, tries + 1), 500);
      else post({ t: "opened", name: file.name, error: "편집기가 시작되지 않았습니다" });
      return;
    }
    dropFile(file);
    post({ t: "opened", name: file.name, kind: KIND });
  }

  function wire() {
    const A = bridge();
    if (!A) return false;
    A.onmessage = onAppMessage;
    post({ t: "ready" });
    return true;
  }
  if (!wire()) document.addEventListener("DOMContentLoaded", wire);

  // ---------- 3) 시작 실패 시 다시 시도 (녹음 편집: WebGPU → WebGL2) ----------
  if (KIND === "sound") {
    const params = new URLSearchParams(location.search);
    const t0 = Date.now();
    const tick = () => {
      if (started()) return;
      const el = document.getElementById(CFG.loading);
      const text = el ? el.textContent || "" : "";
      if (CFG.failed.test(text) && !params.has("webgl")) {
        log("시작 실패 → WebGL2로 다시 시도: " + text.slice(0, 200));
        params.set("webgl", "");
        location.replace(location.pathname + "?" + params.toString().replace(/=(&|$)/g, "$1") + location.hash);
        return;
      }
      if (Date.now() - t0 < 120000) setTimeout(tick, 500);
    };
    setTimeout(tick, 500);
  }

  // ---------- 4) 자동 점검 ----------
  if (/[?&]selftest\b/.test(location.search)) {
    const errors = [];
    window.addEventListener("error", (e) => errors.push(String(e.message || e)));
    window.addEventListener("unhandledrejection", (e) => errors.push("거부: " + String(e.reason && e.reason.message || e.reason)));
    const origError = console.error;
    console.error = function () { errors.push(Array.from(arguments).join(" ").slice(0, 300)); return origError.apply(this, arguments); };

    function toneWav() {
      const rate = 48000, n = rate;
      const buf = new ArrayBuffer(44 + n * 2);
      const v = new DataView(buf);
      const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
      v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, "data"); v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * 440 * i / rate) * 8000), true);
      return new File([buf], "점검 소리.wav", { type: "audio/wav" });
    }

    const t0 = Date.now();
    const check = () => {
      const text = ((document.body && document.body.innerText) || "").replace(/\s+/g, " ").slice(0, 300);
      if (!started() && Date.now() - t0 < 180000) { setTimeout(check, 3000); return; }
      const c = document.querySelector("canvas");
      const vp = document.querySelector('meta[name="viewport"]');
      post({
        t: "selftest", step: "page", started: started(), seconds: Math.round((Date.now() - t0) / 1000),
        canvas: c ? c.width + "x" + c.height : "none", webgpu: !!navigator.gpu, url: location.search,
        scale: window.__dnScreenScale || "?", inner: innerWidth + "x" + innerHeight, viewport: vp ? vp.content : "",
        text, errors: errors.length, first: errors.slice(0, 4).join(" | ").slice(0, 900),
      });
      // 저장 경로: 작은 파일 하나를 "다운로드"
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([KIND + "-android-selftest"], { type: "text/plain" }));
      a.download = "selftest.txt";
      a.click();
      // 가져오기: 녹음 편집은 소리 파일 하나를 끌어다 놓아 봄 (결과는 화면 기록으로 확인)
      if (KIND === "sound" && started()) {
        try { dropFile(toneWav()); post({ t: "selftest", step: "import", dropped: true }); }
        catch (e) { post({ t: "selftest", step: "import", dropped: false, error: String(e) }); }
      }
      // 사진 정리: 보관함 정보 (자동화 명령)
      if (KIND === "light" && window.lightcraft && window.lightcraft.command) {
        Promise.resolve(window.lightcraft.command("library.info", "{}"))
          .then((r) => post({ t: "selftest", step: "library", info: String(r).slice(0, 400) }))
          .catch((e) => post({ t: "selftest", step: "library", error: String(e).slice(0, 300) }));
      }
      setTimeout(() => saveChain.then(() => post({ t: "selftest-done" })), 6000);
    };
    setTimeout(check, 8000);
  }
})();
