/*
 * FilmCraft 안드로이드판 — 웹판과 앱을 잇는 작은 스크립트 (페이지보다 먼저 실행됨)
 *
 * 1) 저장: 웹판은 저장·내보내기(프로젝트, 동영상, 오디오, 자막 …)를 "다운로드"(<a download href=blob:>.click())로 합니다.
 *    그 순간을 가로채 파일 내용을 앱으로 넘기면, 앱이 안드로이드 "파일 만들기"로 저장합니다.
 * 2) 다른 앱에서 열기·공유: 앱이 넘긴 파일을 웹판의 window.filmcraft API로 가져옵니다
 *    (.fcproj 는 프로젝트 열기, 나머지는 미디어 가져오기).
 * 3) 자동 점검(빌드 서버 에뮬레이터): ?selftest 가 붙으면 시작·가져오기·저장 경로를 보고합니다.
 */
(function () {
  "use strict";
  if (window.__filmcraftAndroid) return;
  window.__filmcraftAndroid = true;

  const bridge = () => window.FilmCraftAndroid || null;
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
  // 웹판은 클릭 직후 주소를 폐기(revoke)하므로, 주소를 만들 때 Blob을 미리 기억해 둡니다.
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

  // 저장은 한 번에 하나씩 (동영상 내보내기는 수백 MB일 수 있음)
  let saveSeq = 0;
  let saveChain = Promise.resolve();
  function sendBlob(blob, name) {
    saveChain = saveChain.then(async () => {
      const id = ++saveSeq;
      post({ t: "save-begin", id, name, mime: blob.type || "", size: blob.size });
      const CH = 1536 * 1024;
      for (let off = 0; off < blob.size; off += CH) {
        const part = new Uint8Array(await blob.slice(off, off + CH).arrayBuffer());
        post({ t: "save-chunk", id, d: b64(part), done: Math.min(blob.size, off + CH) });
        // 큰 파일은 앱이 받아 쓸 틈을 줌
        if (blob.size > 32 * 1024 * 1024) await new Promise((r) => setTimeout(r, 0));
      }
      post({ t: "save-end", id });
    }).catch((e) => log("저장 실패: " + e));
  }

  const origClick = HTMLElement.prototype.click;
  HTMLElement.prototype.click = function () {
    try {
      if (bridge() && this instanceof HTMLAnchorElement && this.hasAttribute("download")) {
        const href = this.href || "";
        const name = this.getAttribute("download") || "filmcraft";
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

  // ---------- 2) 다른 앱에서 연 파일 ----------
  const appReady = () => !!(window.filmcraft && window.filmcraftLoad && window.filmcraftLoad.readyMs);
  function whenReady(maxMs) {
    const t0 = Date.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        if (appReady()) return resolve();
        const L = window.filmcraftLoad || {};
        const willRetry = L.error && /Limit '[^']+' value/.test(L.error) && !/[?&](webgl|cpu)\b/.test(location.search);
        if ((L.error && !willRetry) || L.fatal) return reject(new Error(L.error || L.fatal));
        if (Date.now() - t0 > maxMs) return reject(new Error("FilmCraft가 시작되지 않았습니다"));
        setTimeout(tick, 400);
      };
      tick();
    });
  }

  async function openFile(file) {
    try {
      await whenReady(240000);
      if (/\.fcproj$/i.test(file.name)) {
        await window.filmcraft.openProject(file);
        post({ t: "opened", name: file.name, kind: "project" });
      } else {
        const r = await window.filmcraft.importFiles([file]);
        const errs = (r && r.errors) || [];
        post({ t: "opened", name: file.name, kind: "media", items: ((r && r.items) || []).length, error: errs.length ? JSON.stringify(errs).slice(0, 300) : "" });
      }
    } catch (e) {
      post({ t: "opened", name: file.name, error: String(e && e.message || e) });
    }
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
      if (f) openFile(new File(f.parts, f.name, { type: f.mime || "" }));
    }
  }

  function wire() {
    const A = bridge();
    if (!A) return false;
    A.onmessage = onAppMessage;
    post({ t: "ready" });
    return true;
  }
  if (!wire()) document.addEventListener("DOMContentLoaded", wire);

  // ---------- 시작 실패 시 다시 시도 ----------
  // WebGPU가 있다고 나오지만 장치 한도가 모자라 시작하지 못하면(일부 기기·에뮬레이터) WebGL2로 한 번 더 시도합니다.
  // 웹판 index.html 은 오류 문구에 wgpu/webgpu 가 있을 때만 이렇게 하므로, 한도 오류도 같은 길로 보냅니다.
  (function retryOnLimit() {
    const params = new URLSearchParams(location.search);
    const t0 = Date.now();
    const tick = () => {
      const L = window.filmcraftLoad;
      if (L && L.readyMs) return;
      if (L && L.error && /Limit '[^']+' value/.test(L.error) && !params.has("webgl") && !params.has("cpu")) {
        log("시작 실패(장치 한도) → WebGL2로 다시 시도: " + L.error);
        params.set("webgl", "");
        location.replace(location.pathname + "?" + params.toString().replace(/=(&|$)/g, "$1") + location.hash);
        return;
      }
      if (Date.now() - t0 < 60000) setTimeout(tick, 300);
    };
    setTimeout(tick, 300);
  })();

  // ---------- 3) 자동 점검 ----------
  if (/[?&]selftest\b/.test(location.search)) {
    const errors = [];
    window.addEventListener("error", (e) => errors.push(String(e.message || e)));
    window.addEventListener("unhandledrejection", (e) => errors.push("거부: " + String(e.reason && e.reason.message || e.reason)));
    const origError = console.error;
    console.error = function () { errors.push(Array.from(arguments).join(" ").slice(0, 300)); return origError.apply(this, arguments); };

    // 1초짜리 사인파 WAV (가져오기 점검용)
    function toneWav() {
      const rate = 48000, n = rate;
      const buf = new ArrayBuffer(44 + n * 2);
      const v = new DataView(buf);
      const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
      v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, "data"); v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.sin(2 * Math.PI * 440 * i / rate) * 8000), true);
      return new File([buf], "selftest-tone.wav", { type: "audio/wav" });
    }
    const until = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await fn()) return true; } catch (_) {} await new Promise((r) => setTimeout(r, 1000)); } return false; };

    (async () => {
      const started = Date.now();
      let ok = true;
      try { await whenReady(200000); } catch (e) { ok = false; errors.push("시작: " + e.message); }
      const c = document.querySelector("canvas");
      let info = null;
      try { info = ok ? await window.filmcraft.info() : null; } catch (e) { errors.push("info: " + e); }
      post({
        t: "selftest", step: "page", started: ok, seconds: Math.round((Date.now() - started) / 1000),
        canvas: c ? c.width + "x" + c.height : "none", webgpu: !!navigator.gpu, ua: navigator.userAgent, url: location.search,
        glMaxTex: (() => { try { const g = document.createElement("canvas").getContext("webgl2"); return g ? g.getParameter(g.MAX_TEXTURE_SIZE) : "no-webgl2"; } catch (e) { return String(e); } })(),
        info: info ? JSON.stringify(info).slice(0, 600) : "", errors: errors.length, first: errors.slice(0, 4).join(" | ").slice(0, 900),
        text: ((document.body && document.body.innerText) || "").replace(/\s+/g, " ").slice(0, 200),
      });
      // 저장 경로: 작은 파일 하나를 "다운로드" (편집기가 시작하지 못해도 앱 연결은 확인)
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["filmcraft-android-selftest"], { type: "text/plain" }));
      a.download = "selftest.txt";
      a.click();
      if (!ok) {
        const L = window.filmcraftLoad || {};
        post({ t: "selftest", step: "load", wasmLoaded: !!L.wasmMs, gpuLimit: /Limit '[^']+' value/.test(String(L.error || "")) });
        await saveChain;
        post({ t: "selftest-done" });
        return;
      }

      // 가져오기
      try {
        const r = await window.filmcraft.importFiles([toneWav()]);
        post({ t: "selftest", step: "import", items: ((r && r.items) || []).length, errors: JSON.stringify((r && r.errors) || []).slice(0, 300) });
      } catch (e) {
        post({ t: "selftest", step: "import", items: 0, errors: String(e) });
      }

      // 실제 동영상 내보내기 (데모 프로젝트, 시간이 넉넉할 때만 — 결과는 참고용)
      try {
        const ex = await window.filmcraft.execute("file.exportMedia", { format: "h264", path: "/exports/selftest-export.mp4", bitrateKbps: 1500 });
        const done = await until(() => window.filmcraft.execute("jobs.list").then((js) => js.some((j) => j.id === ex.job && j.finished)), 240000);
        post({ t: "selftest", step: "export", job: ex && ex.job, finished: done });
        if (done) await new Promise((r) => setTimeout(r, 15000)); // 내보낸 파일이 앱으로 넘어갈 시간
      } catch (e) {
        post({ t: "selftest", step: "export", error: String(e && e.message || e).slice(0, 300) });
      }
      await saveChain;
      post({ t: "selftest-done" });
    })();
  }
})();
