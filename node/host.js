"use strict";
/*
 * 이음오피스 안드로이드판 Node 호스트.
 *
 * 앱이 Node(안드로이드용)로 이 파일을 실행합니다. 데스크톱판 편집기 모듈의 메인 코드
 * (resources/modules/<모듈>/main/index.js)를 문서마다 새로 불러 돌리고,
 * 화면(WebView)과는 localhost 웹소켓으로, 화면이 요청하는 사용자 정의 프로토콜 자원은 HTTP로 주고받습니다.
 *
 * 환경 변수
 *   IEUM_PORT       듣는 포트 (127.0.0.1)
 *   IEUM_TOKEN      화면·앱만 아는 비밀값 (다른 앱의 접속 차단)
 *   IEUM_DATA       설정·임시 파일 폴더
 *   IEUM_RESOURCES  데스크톱판 resources 폴더 (modules/, template-fonts/ 등)
 *   IEUM_SIDECAR    엑셀 엔진(xlsx-sidecar) 실행 파일 경로
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const Module = require("node:module");
const { WebSocketServer } = require("ws");
const { createElectron } = require("./fake-electron");
const codec = require("./codec");

const PORT = Number(process.env.IEUM_PORT || 0);
const TOKEN = process.env.IEUM_TOKEN || "";
const DATA = path.resolve(process.env.IEUM_DATA || path.join(__dirname, "data"));
const RESOURCES = path.resolve(process.env.IEUM_RESOURCES || path.join(__dirname, "resources"));
const APP_VERSION = process.env.IEUM_APP_VERSION || "0.12.12";
const MODULES = ["docs", "sheets", "slides", "epub", "mindmap", "diagram"];
const CUSTOM_SCHEMES = ["genoffice-docx-media", "genoffice-slide-media", "epub-asset", "drawio-app"];

if (!TOKEN) {
  console.error("IEUM_TOKEN이 없습니다");
  process.exit(2);
}

// 데스크톱 코드가 기대하는 Electron 환경값
process.resourcesPath = RESOURCES;
process.type = "browser";
process.versions.electron = process.versions.electron || "38.0.0";
if (process.env.IEUM_SIDECAR) process.env.XLSX_SIDECAR_PATH = process.env.IEUM_SIDECAR;
process.env.GENOFFICE_LANG = process.env.GENOFFICE_LANG || "ko";
const realExit = process.exit.bind(process);
process.exit = (code) => { log(`process.exit(${code}) 무시`); };
process.on("uncaughtException", (err) => log("처리 안 된 오류: " + (err && err.stack || err)));
process.on("unhandledRejection", (err) => log("처리 안 된 거부: " + (err && err.stack || err)));

function log(msg) { console.log(`[host] ${msg}`); }

const dirs = {};
for (const name of ["userData", "appData", "temp", "home", "documents", "downloads", "desktop", "logs", "sessionData", "cache", "crashDumps", "pictures", "music", "videos", "recent"]) {
  dirs[name] = path.join(DATA, name);
  fs.mkdirSync(dirs[name], { recursive: true });
}
dirs.exe = process.execPath;
dirs.module = process.execPath;
process.env.HOME = dirs.home;
process.env.TMPDIR = dirs.temp;

// 데스크톱판 독립 실행용 메인 코드가 바깥에서 찾는 패키지 (vendor/node_modules)
// vendor/local: 원본 소스(packages/agent-core)에서 만든 일부와 자동 업데이트 빈 구현
process.env.NODE_PATH = [path.join(__dirname, "vendor", "local"), path.join(__dirname, "vendor", "node_modules"), process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
Module._initPaths();

// ---------- require("electron") → 지금 불러오는 모듈 세션의 가짜 electron ----------
const electronFor = new Map(); // 모듈 이름 → 가짜 electron
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "electron") {
    const m = moduleOfFile(parent && parent.filename);
    const e = m && electronFor.get(m);
    if (e) return e;
    throw new Error("electron을 요청한 모듈을 알 수 없습니다: " + (parent && parent.filename));
  }
  return origLoad.apply(this, arguments);
};
function moduleOfFile(file) {
  if (!file) return null;
  const rel = path.relative(path.join(RESOURCES, "modules"), file);
  const m = rel.split(path.sep)[0];
  return MODULES.includes(m) ? m : null;
}

// ---------- 편집기 세션 ----------
const sessions = new Map(); // sid → Session
const activeByModule = new Map(); // 모듈 → sid (모듈마다 한 번에 문서 하나)

// 독립 실행용 메인 코드가 명령줄로 파일을 받지 않는 모듈: 첫 "열기" 요청을 그 문서로 돌립니다
const OPEN_HOOKS = {
  sheets(session, ch) {
    if (!session.docPath || session.docOpened) return null;
    if (ch === "sheets:has-queued-workbook") return { value: true };
    if (ch === "workbook:select") {
      session.docOpened = true;
      return { reroute: "workbook:reopen", args: [session.docPath] };
    }
    return null;
  },
};

class Session {
  constructor(moduleName, docPath) {
    this.sid = crypto.randomBytes(9).toString("hex");
    this.module = moduleName;
    this.docPath = docPath || null;
    this.ipcHandlers = new Map();
    this.ipcListeners = new Map();
    this.protocols = new Map();
    this.dirs = dirs;
    this.resourcesPath = RESOURCES;
    this.appVersion = APP_VERSION;
    this.isReady = false;
    this.ready = new Promise((r) => { this._resolveReady = r; });
    this.wc = null;
    this.socket = null;
    this.outbox = [];
    this.asks = new Map();
    this.askSeq = 0;
    this.watched = new Map(); // 경로 → 마지막으로 본 수정 시각
    this.closed = false;
    this.windowLoaded = new Promise((r) => { this._resolveWindow = r; });
  }

  log(msg) { log(`[${this.module}] ${msg}`); }

  start() {
    const prev = activeByModule.get(this.module);
    if (prev && sessions.get(prev)) sessions.get(prev).close();
    activeByModule.set(this.module, this.sid);
    sessions.set(this.sid, this);

    const mainDir = path.join(RESOURCES, "modules", this.module, "main");
    for (const key of Object.keys(require.cache)) {
      if (key.startsWith(mainDir + path.sep)) delete require.cache[key];
    }
    electronFor.set(this.module, createElectron(this));
    process.argv = [process.execPath, ...(this.docPath ? [this.docPath] : [])];
    if (this.docPath) this.watch(this.docPath);
    try {
      require(path.join(mainDir, "index.js"));
    } catch (err) {
      this.log("메인 코드 불러오기 실패: " + (err && err.stack || err));
      throw err;
    }
    this.isReady = true;
    this._resolveReady();
    // 창이 늦게 만들어지는 모듈도 있으니 잠시 기다립니다
    return Promise.race([
      this.windowLoaded,
      new Promise((_, rej) => setTimeout(() => rej(new Error("편집기 창이 열리지 않았습니다")), 20000)),
    ]);
  }

  // fake-electron이 부릅니다
  onWindowCreated(win) { this.log("창 생성 #" + win.id); }
  setDirty(flag) { this.rawSend({ t: "event", ch: "__ieum:dirty", a: [flag] }); }
  setAppMenu(menu) {
    this.appMenu = menu;
    this.rawSend({ t: "event", ch: "__ieum:menu", a: [serializeMenu(menu)] });
  }
  clickMenu(pathIdx) {
    let items = this.appMenu && this.appMenu.items;
    let item = null;
    for (const i of pathIdx || []) {
      item = items && items[i];
      items = item && item.submenu && item.submenu.items;
    }
    if (!item) return;
    const win = this.wc && this.wc._win;
    if (typeof item.click === "function") {
      try { item.click(item, win, { triggeredByAccelerator: false }); } catch (e) { this.log("메뉴 실행 오류: " + e); }
    } else if (item.role) {
      const role = String(item.role).toLowerCase();
      const map = { undo: "undo", redo: "redo", cut: "cut", copy: "copy", paste: "paste", selectall: "selectAll", delete: "delete" };
      if (map[role]) this.rawSend({ t: "event", ch: "__ieum:role", a: [map[role]] });
    }
    setTimeout(() => this.checkWatched(), 200);
  }
  onWindowLoad(win, url) {
    if (!this.wc) {
      this.wc = win.webContents;
      this.log("화면 연결 대상 webContents #" + this.wc.id + " (" + url + ")");
      this._resolveWindow(this.wc.id);
    }
  }

  attach(socket) {
    if (this.socket && this.socket !== socket) try { this.socket.close(); } catch (_) {}
    this.socket = socket;
    const pending = this.outbox;
    this.outbox = [];
    for (const m of pending) this.rawSend(m);
  }

  rawSend(msg) {
    if (this.socket && this.socket.readyState === 1) this.socket.send(JSON.stringify(msg));
    else this.outbox.push(msg);
  }

  sendToRenderer(wc, channel, args) {
    if (wc !== this.wc && this.wc && wc && wc.id !== this.wc.id) return; // 다른 창은 화면이 없음
    this.rawSend({ t: "event", ch: channel, a: codec.encode(args) });
  }

  askRenderer(fn, args) {
    const id = ++this.askSeq;
    return new Promise((resolve, reject) => {
      this.asks.set(id, { resolve, reject });
      this.rawSend({ t: "ask", id, fn, a: codec.encode(args) });
    }).then((v) => {
      // 저장 위치로 고른 파일은 바뀌는지 지켜보다가 원래 위치(안드로이드 문서)로 옮겨 씁니다
      if (fn === "dialog.showSaveDialog" && v && v.filePath) this.watch(v.filePath, true);
      if (fn === "dialog.showOpenDialog" && v && Array.isArray(v.filePaths)) v.filePaths.forEach((p) => this.watch(p));
      return v;
    });
  }

  makeEvent() {
    const wc = this.wc;
    const frame = { url: wc ? wc.getURL() : "", top: null, parent: null, routingId: 1, processId: 1, frameTreeNodeId: 1, origin: "" };
    frame.top = frame;
    return {
      sender: wc,
      senderFrame: frame,
      frameId: 1,
      processId: 1,
      returnValue: undefined,
      ports: [],
      preventDefault() {},
      reply: (ch, ...args) => this.sendToRenderer(wc, ch, args),
    };
  }

  async onMessage(msg) {
    if (msg.t === "invoke") {
      // 데스크톱 껍데기 앱이 대신 해 주던 "이 파일 열기"를 모듈별로 이어 줍니다
      const hooked = OPEN_HOOKS[this.module] && OPEN_HOOKS[this.module](this, msg.ch);
      if (hooked && hooked.value !== undefined) {
        this.rawSend({ t: "result", id: msg.id, ok: true, v: codec.encode(hooked.value) });
        return;
      }
      if (hooked && hooked.reroute) {
        msg = { ...msg, ch: hooked.reroute, a: codec.encode(hooked.args) };
      }
      const fn = this.ipcHandlers.get(msg.ch);
      let reply;
      if (!fn) {
        reply = { t: "result", id: msg.id, ok: false, e: `No handler registered for '${msg.ch}'` };
      } else {
        try {
          const v = await fn(this.makeEvent(), ...codec.decode(msg.a || []));
          reply = { t: "result", id: msg.id, ok: true, v: codec.encode(v) };
        } catch (err) {
          reply = { t: "result", id: msg.id, ok: false, e: String(err && err.message || err) };
        }
      }
      this.rawSend(reply);
      this.checkWatched();
    } else if (msg.t === "send") {
      try {
        this.ipcEmitter.emit(msg.ch, this.makeEvent(), ...codec.decode(msg.a || []));
      } catch (err) {
        this.log(`send ${msg.ch} 처리 오류: ${err && err.stack || err}`);
      }
      setTimeout(() => this.checkWatched(), 50);
    } else if (msg.t === "menu") {
      this.clickMenu(msg.path);
    } else if (msg.t === "answer") {
      const a = this.asks.get(msg.id);
      if (!a) return;
      this.asks.delete(msg.id);
      if (msg.ok) a.resolve(codec.decode(msg.v)); else a.reject(new Error(msg.e || "취소"));
    }
  }

  watch(p, fresh) {
    let m = 0;
    if (!fresh) try { m = fs.statSync(p).mtimeMs; } catch (_) {}
    this.watched.set(path.resolve(p), m);
  }

  checkWatched() {
    for (const [p, last] of this.watched) {
      let m = 0;
      try { m = fs.statSync(p).mtimeMs; } catch (_) { continue; }
      if (m !== last) {
        this.watched.set(p, m);
        this.log("파일 바뀜 → 원본 위치로 옮김: " + p);
        this.askRenderer("android.syncFile", [p]).catch(() => {});
      }
    }
  }

  async serveProtocol(scheme, url, req, res) {
    const fn = this.protocols.get(scheme);
    if (!fn) { this.log("등록 안 된 프로토콜 요청: " + scheme); res.writeHead(404); res.end(); return; }
    let response;
    try {
      response = await fn(new Request(url, { method: req.method, headers: { accept: req.headers.accept || "*/*" } }));
    } catch (err) {
      this.log(`${scheme} 프로토콜 오류: ${err && err.message}`);
      res.writeHead(500); res.end(); return;
    }
    if (!response) { res.writeHead(404); res.end(); return; }
    const headers = {};
    response.headers.forEach((v, k) => { headers[k] = v; });
    const type = String(headers["content-type"] || "");
    if (response.body && /text\/html|text\/css|xhtml|image\/svg|javascript/.test(type)) {
      // 응답 안의 자체 프로토콜 주소도 앱 내부 주소로 (책 본문·draw.io 화면 등)
      let text = await response.text();
      const fix = (t, csp) => {
        for (const sc of CUSTOM_SCHEMES) {
          t = t.split(sc + "://").join("/proto/m/" + this.module + "/" + sc + "/");
          // CSP 안의 "epub-asset:" 같은 출처 표기는 같은 출처('self')로
          if (csp || /html/.test(type)) t = t.replace(new RegExp("(^|[\\s;\"'])" + sc + ":(?!//)", "g"), "$1'self'");
        }
        // frame-ancestors genoffice-app: 등 화면 자신을 가리키는 출처
        if (csp || /html/.test(type)) t = t.replace(/(^|[\s;"'])genoffice-app:(?!\/\/)/g, "$1'self'");
        return t;
      };
      text = fix(text, false);
      if (/html/.test(type)) {
        // 응답 HTML 안의 "/..." 절대 경로는 원래 프로토콜 주소의 뿌리를 가리킵니다 → 앱 내부 주소로
        const u = new URL(url);
        const root = "/proto/m/" + this.module + "/" + scheme + "/" + u.host + "/";
        text = text.replace(/(\s(?:src|href)=["'])\/(?!\/|proto\/)/g, "$1" + root);
      }
      if (headers["content-security-policy"]) headers["content-security-policy"] = fix(headers["content-security-policy"], true);
      delete headers["content-length"];
      res.writeHead(response.status, headers);
      res.end(text);
      return;
    }
    res.writeHead(response.status, headers);
    if (!response.body) { res.end(); return; }
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.checkWatched();
    for (const w of this.windows || []) try { w.destroy(); } catch (_) {}
    for (const a of this.asks.values()) a.reject(new Error("세션 닫힘"));
    sessions.delete(this.sid);
    if (activeByModule.get(this.module) === this.sid) activeByModule.delete(this.module);
    this.log("세션 닫음");
  }
}

function serializeMenu(menu) {
  const items = menu && menu.items;
  if (!Array.isArray(items)) return null;
  return items.map((it) => ({
    label: typeof it.label === "string" ? it.label : "",
    role: it.role || undefined,
    type: it.type || "normal",
    accelerator: typeof it.accelerator === "string" ? it.accelerator : undefined,
    enabled: it.enabled !== false,
    visible: it.visible !== false,
    checked: !!it.checked,
    submenu: it.submenu ? serializeMenu(it.submenu) : undefined,
  }));
}

// ---------- HTTP + 웹소켓 ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const token = req.headers["x-ieum-token"] || url.searchParams.get("token");
  if (token !== TOKEN) { res.writeHead(403); res.end(); return; }
  // /proto/m/<모듈>/<scheme>/<host>/<path...> → 그 모듈의 열린 문서 세션
  const m = /^\/proto\/m\/([a-z]+)\/([a-z0-9+.-]+)\/(.*)$/i.exec(url.pathname);
  if (m) {
    const s = sessions.get(activeByModule.get(m[1]));
    if (!s) { res.writeHead(404); res.end(); return; }
    url.searchParams.delete("token");
    const q = url.searchParams.toString();
    const target = `${m[2]}://${m[3]}${q ? "?" + q : ""}`;
    await s.serveProtocol(m[2], target, req, res).catch((e) => { log("protocol " + e); try { res.end(); } catch (_) {} });
    return;
  }
  if (url.pathname === "/health") { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: true, sessions: sessions.size })); return; }
  res.writeHead(404); res.end();
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 512 * 1024 * 1024 });
server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://localhost");
  if (url.searchParams.get("token") !== TOKEN) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => onSocket(ws, url));
});

function onSocket(ws, url) {
  const sid = url.searchParams.get("session");
  if (sid) {
    const s = sessions.get(sid);
    if (!s) { ws.close(4004, "no session"); return; }
    s.attach(ws);
    ws.on("message", (data) => {
      let msg;
      try { msg = JSON.parse(String(data)); } catch (_) { return; }
      s.onMessage(msg).catch((e) => s.log("메시지 처리 오류: " + e));
    });
    ws.on("close", () => {
      if (s.socket === ws) s.socket = null;
    });
    return;
  }
  // 제어 연결 (홈 화면): 문서 열기·닫기
  ws.on("message", async (data) => {
    let msg;
    try { msg = JSON.parse(String(data)); } catch (_) { return; }
    const reply = (v) => ws.send(JSON.stringify({ t: "result", id: msg.id, ...v }));
    try {
      if (msg.t === "open") {
        if (!MODULES.includes(msg.module)) throw new Error("모르는 모듈: " + msg.module);
        if (msg.path && !fs.existsSync(msg.path)) throw new Error("파일이 없습니다: " + msg.path);
        const s = new Session(msg.module, msg.path || null);
        const wcId = await s.start();
        reply({ ok: true, v: { session: s.sid, wcId } });
      } else if (msg.t === "close") {
        const s = sessions.get(msg.session);
        if (s) s.close();
        reply({ ok: true });
      } else if (msg.t === "ping") {
        reply({ ok: true, v: { version: APP_VERSION, node: process.version } });
      } else {
        reply({ ok: false, e: "모르는 요청" });
      }
    } catch (err) {
      reply({ ok: false, e: String(err && err.message || err) });
    }
  });
}

// 자동 저장 등 화면 요청 없이 바뀐 파일도 원본 위치로 옮기도록 주기적으로 확인
setInterval(() => { for (const s of sessions.values()) s.checkWatched(); }, 3000).unref();

server.listen(PORT, "127.0.0.1", () => {
  log(`준비됨 port=${server.address().port} node=${process.version}`);
  console.log("IEUM_READY " + server.address().port);
});

module.exports = { realExit };
