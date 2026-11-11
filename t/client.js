// 폰(arm64)용 문서 엔진이 실제로 뜨고, 견본 문서를 여는지 확인
const path = require("path");
const { WebSocket } = require(path.join(process.argv[2], "node_modules", "ws"));
const port = process.argv[3], token = process.argv[4], samples = process.argv[5];
const files = { docs: "1-docs.docx", sheets: "2-sheets.xlsx", slides: "3-slides.pptx", epub: "4-epub.epub", mindmap: "5-mindmap.xmind", diagram: "6-diagram.drawio" };
const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${token}`);
let id = 0; const wait = new Map();
const ask = (msg) => new Promise((res) => { msg.id = ++id; wait.set(msg.id, res); ws.send(JSON.stringify(msg)); setTimeout(() => res({ ok: false, e: "timeout 60s" }), 60000); });
ws.on("message", (d) => { const m = JSON.parse(String(d)); const r = wait.get(m.id); if (r) { wait.delete(m.id); r(m); } });
ws.on("error", (e) => { console.log("CLIENT FAIL ws " + e); process.exit(1); });
ws.on("open", async () => {
  console.log("CLIENT ping " + JSON.stringify(await ask({ t: "ping" })));
  let bad = 0;
  for (const [mod, f] of Object.entries(files)) {
    const t0 = Date.now();
    const r = await ask({ t: "open", module: mod, path: path.join(samples, f) });
    console.log(`CLIENT ${r.ok ? "PASS" : "FAIL"} open ${mod} ${Date.now() - t0}ms ${JSON.stringify(r).slice(0, 300)}`);
    if (!r.ok) bad++;
    await new Promise((r2) => setTimeout(r2, 3000));
  }
  console.log("CLIENT DONE bad=" + bad);
  process.exit(bad ? 1 : 0);
});
