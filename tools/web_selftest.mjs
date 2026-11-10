// 빌드 서버의 크롬(헤드리스)에서 앱에 넣을 웹 빌드 + bridge.js 를 그대로 돌려 봅니다.
// 앱(Java) 대신 가짜 FilmCraftAndroid 를 붙여, 웹 → 앱 저장과 앱 → 웹 열기를 흉내 냅니다.
// 사용: node tools/web_selftest.mjs http://127.0.0.1:8765/index.html app/src/main/assets/bridge.js
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

const [url, bridgePath] = process.argv.slice(2);
const bridge = readFileSync(bridgePath, "utf8");
const fake = `
(() => {
  const saves = {};
  window.__fc = { saves: [], opened: [], selftest: [], done: false, ready: false };
  window.FilmCraftAndroid = {
    onmessage: null,
    postMessage(s) {
      const m = JSON.parse(s);
      if (m.t === "ready") window.__fc.ready = true;
      else if (m.t === "save-begin") saves[m.id] = { name: m.name, bytes: 0 };
      else if (m.t === "save-chunk") saves[m.id].bytes += Math.floor(m.d.length * 3 / 4) - (m.d.endsWith("==") ? 2 : m.d.endsWith("=") ? 1 : 0);
      else if (m.t === "save-end") { window.__fc.saves.push(saves[m.id]); console.log("FC save ok name=" + saves[m.id].name + " bytes=" + saves[m.id].bytes); }
      else if (m.t === "opened") { window.__fc.opened.push(m); console.log("FC opened " + JSON.stringify(m)); }
      else if (m.t === "selftest") { window.__fc.selftest.push(m); console.log("FC selftest " + JSON.stringify(m).slice(0, 700)); }
      else if (m.t === "selftest-done") { window.__fc.done = true; console.log("FC DONE"); }
      else if (m.t === "log") console.log("FC log " + m.m);
    },
  };
})();`;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--enable-unsafe-webgpu",
    "--enable-features=Vulkan", "--use-webgpu-adapter=swiftshader", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1344, height: 1100, deviceScaleFactor: 1.5, hasTouch: true });
page.on("console", (m) => { const t = m.text(); if (/^FC |panicked|ERROR/.test(t)) console.log(t.slice(0, 900)); });
page.on("pageerror", (e) => console.log("pageerror " + String(e).slice(0, 300)));
await page.evaluateOnNewDocument(fake);
await page.evaluateOnNewDocument(bridge);
await page.goto(url + "?selftest", { waitUntil: "load" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn).catch(() => false)) return true; await sleep(1000); } return false; }

const started = await waitFor(() => window.__fc.selftest.some((s) => s.step === "page"), 240000);
await page.screenshot({ path: "web-screen-started.png" });

// 앱 → 웹 열기 흉내: 2초짜리 WAV를 조각으로 보냄
let openedOk = false;
if (started && await page.evaluate(() => window.__fc.selftest.find((s) => s.step === "page").started)) {
  await page.evaluate(() => {
    const rate = 44100, n = rate * 2, buf = new Uint8Array(44 + n * 2), v = new DataView(buf.buffer);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, "data"); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.round(Math.sin(i / 20) * 6000), true);
    const send = (o) => window.FilmCraftAndroid.onmessage({ data: JSON.stringify(o) });
    send({ t: "open-begin", id: 7, name: "공유된 소리.wav", mime: "audio/wav" });
    for (let off = 0; off < buf.length; off += 65536) {
      let s = ""; const part = buf.subarray(off, off + 65536);
      for (let i = 0; i < part.length; i += 0x8000) s += String.fromCharCode.apply(null, part.subarray(i, i + 0x8000));
      send({ t: "open-chunk", id: 7, d: btoa(s) });
    }
    send({ t: "open-end", id: 7 });
  });
  openedOk = await waitFor(() => window.__fc.opened.some((o) => !o.error && o.items > 0), 60000);
}

await waitFor(() => window.__fc.done, 400000);
await sleep(3000);
await page.screenshot({ path: "web-screen-end.png" });
const r = await page.evaluate(() => window.__fc);

// 화면 확인용: 헤드리스 크롬은 WebGPU 캔버스를 스크린샷에 못 담는 경우가 많아 WebGL2로 한 번 더 띄워 찍음
try {
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1344, height: 1100, deviceScaleFactor: 1.5, hasTouch: true });
  await p2.evaluateOnNewDocument(fake);
  await p2.evaluateOnNewDocument(bridge);
  await p2.goto(url + "?webgl&norecover", { waitUntil: "load" });
  for (let i = 0; i < 60 && !(await p2.evaluate(() => !!(window.filmcraftLoad && window.filmcraftLoad.readyMs)).catch(() => false)); i++) await sleep(1000);
  await sleep(6000);
  await p2.screenshot({ path: "web-screen-ui.png" });
} catch (e) { console.log("screenshot " + e); }
await browser.close();

const pageStep = r.selftest.find((s) => s.step === "page") || {};
const imp = r.selftest.find((s) => s.step === "import") || {};
const exp = r.selftest.find((s) => s.step === "export") || {};
const mp4 = r.saves.find((s) => /\.mp4$/i.test(s.name) && s.bytes > 1000);
const txt = r.saves.find((s) => s.name === "selftest.txt");
console.log(`web: started=${pageStep.started} import=${imp.items} openFromApp=${openedOk} export=${JSON.stringify(exp)} mp4=${mp4 ? mp4.bytes : 0} txtSave=${!!txt}`);
console.log((pageStep.started ? "PASS" : "FAIL") + " web start");
console.log((imp.items > 0 ? "PASS" : "FAIL") + " web import (filmcraft.importFiles)");
console.log((openedOk ? "PASS" : "FAIL") + " web open from app (chunks → importFiles)");
console.log((txt ? "PASS" : "FAIL") + " web save hook");
console.log((mp4 ? "PASS" : "FAIL") + " web export mp4 (H.264) → app");
process.exit(pageStep.started && imp.items > 0 && openedOk && txt && mp4 ? 0 : 1);
