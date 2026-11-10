"use strict";
/*
 * 가짜 electron 모듈 (메인 프로세스 쪽).
 *
 * 데스크톱 편집기 모듈의 메인 코드(modules/<m>/main/index.js)는 require("electron")으로
 * ipcMain·app·BrowserWindow·dialog·protocol 등을 씁니다. 편집기 세션마다 이 객체를 하나씩 만들어
 * 넘기고, 화면(WebView)과의 실제 통신은 session(host.js)이 맡습니다.
 * 모르는 속성은 "아무것도 안 하는 함수"로 돌려줘 데스크톱 전용 기능이 앱을 멈추지 않게 합니다.
 */
const { EventEmitter } = require("node:events");
const path = require("node:path");
const fs = require("node:fs");

const warned = new Set();
function warnOnce(what) {
  if (warned.has(what)) return;
  warned.add(what);
  if (process.env.IEUM_DEBUG) console.log("[fake-electron] 미구현: " + what);
}

/** 모르는 속성을 물으면 기록만 하고 아무 일도 안 하는 함수/객체를 돌려줍니다. */
function lenient(target, label) {
  return new Proxy(target, {
    get(t, prop, recv) {
      if (prop in t || typeof prop === "symbol") return Reflect.get(t, prop, recv);
      if (prop === "then") return undefined; // Promise로 오인되지 않게
      warnOnce(label + "." + String(prop));
      return stub(label + "." + String(prop));
    },
  });
}
function stub(label) {
  const fn = function () { warnOnce(label + "()"); return undefined; };
  return lenient(fn, label);
}

let nextWindowId = 1;
let nextContentsId = 1;

function createElectron(session) {
  const allWindows = new Set();
  const allContents = new Map();

  // ---------- ipcMain ----------
  const handlers = session.ipcHandlers;
  const listeners = session.ipcListeners;
  const ipcMain = lenient(Object.assign(new EventEmitter(), {
    handle(channel, fn) {
      if (handlers.has(channel)) throw new Error(`Attempted to register a second handler for '${channel}'`);
      handlers.set(channel, fn);
    },
    handleOnce(channel, fn) {
      handlers.set(channel, (...a) => { handlers.delete(channel); return fn(...a); });
    },
    removeHandler(channel) { handlers.delete(channel); },
  }), "ipcMain");
  // on/once/removeListener는 EventEmitter 그대로 쓰되, session이 같은 객체를 보게 합니다.
  session.ipcEmitter = ipcMain;
  void listeners;

  // ---------- webContents ----------
  class WebContents extends EventEmitter {
    constructor(win) {
      super();
      this.id = nextContentsId++;
      this._win = win;
      this._url = "";
      this._destroyed = false;
      this.session = defaultSession;
      this.mainFrame = { url: "", routingId: 1, processId: 1, frames: [], framesInSubtree: [] };
      this.ipc = ipcMain;
      allContents.set(this.id, this);
    }
    send(channel, ...args) { session.sendToRenderer(this, channel, args); }
    postMessage(channel, message) { session.sendToRenderer(this, channel, [message]); }
    getURL() { return this._url; }
    getTitle() { return session.title || ""; }
    isDestroyed() { return this._destroyed; }
    isLoading() { return false; }
    isCrashed() { return false; }
    isFocused() { return true; }
    focus() {}
    setWindowOpenHandler() {}
    getOwnerBrowserWindow() { return this._win; }
    getZoomFactor() { return 1; }
    setZoomFactor() {}
    getZoomLevel() { return 0; }
    setZoomLevel() {}
    setVisualZoomLevelLimits() { return Promise.resolve(); }
    setBackgroundThrottling() {}
    setIgnoreMenuShortcuts() {}
    setAudioMuted() {}
    isDevToolsOpened() { return false; }
    openDevTools() {}
    closeDevTools() {}
    reload() {}
    stop() {}
    undo() {} redo() {} cut() {} copy() {} paste() {} selectAll() {} delete() {}
    insertText() { return Promise.resolve(); }
    replaceMisspelling() {}
    getOSProcessId() { return process.pid; }
    getProcessId() { return 1; }
    executeJavaScript() { return Promise.reject(new Error("executeJavaScript는 안드로이드판에서 지원하지 않습니다")); }
    printToPDF() { return Promise.reject(new Error("PDF로 인쇄는 안드로이드판에서 아직 지원하지 않습니다")); }
    print(_opts, cb) { if (typeof cb === "function") cb(false, "unsupported"); }
    capturePage() { return Promise.resolve(nativeImage.createEmpty()); }
    loadURL(url) { this._url = url; return Promise.resolve(); }
    _destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      allContents.delete(this.id);
      this.emit("destroyed");
    }
    close() { this._win?.close(); }
    destroy() { this._destroy(); }
  }

  // ---------- BrowserWindow ----------
  class BrowserWindow extends EventEmitter {
    constructor(options = {}) {
      super();
      this.id = nextWindowId++;
      this._options = options;
      this._destroyed = false;
      this._title = options.title || "";
      this.webContents = lenient(new WebContents(this), "webContents");
      allWindows.add(this);
      session.onWindowCreated(this);
      return lenient(this, "BrowserWindow");
    }
    static getAllWindows() { return [...allWindows]; }
    static getFocusedWindow() { return [...allWindows].find((w) => !w._destroyed) || null; }
    static fromWebContents(wc) { return wc && wc._win ? wc._win : null; }
    static fromId(id) { return [...allWindows].find((w) => w.id === id) || null; }
    static fromBrowserView() { return null; }
    loadURL(url) {
      this.webContents._url = url;
      session.onWindowLoad(this, url);
      return Promise.resolve();
    }
    loadFile(file) { return this.loadURL("file://" + file); }
    show() {} showInactive() {} hide() {} focus() {} blur() {} moveTop() {}
    isVisible() { return true; }
    isFocused() { return true; }
    isDestroyed() { return this._destroyed; }
    isMinimized() { return false; } isMaximized() { return false; } isFullScreen() { return false; }
    isSimpleFullScreen() { return false; } isNormal() { return true; } isKiosk() { return false; }
    minimize() {} maximize() {} unmaximize() {} restore() {}
    setFullScreen() {} setSimpleFullScreen() {} setFullScreenable() {} setKiosk() {}
    setTitle(t) { this._title = t; session.title = t; }
    getTitle() { return this._title; }
    setMenu(m) { if (m) { appMenu = m; session.setAppMenu(m); } }
    removeMenu() {} setMenuBarVisibility() {} setAutoHideMenuBar() {}
    setDocumentEdited(flag) { this._edited = !!flag; session.setDirty(!!flag); }
    isDocumentEdited() { return !!this._edited; }
    setRepresentedFilename() {}
    setProgressBar() {} flashFrame() {} setTitleBarOverlay() {} setBackgroundColor() {}
    setOpacity() {} setAlwaysOnTop() {} setSkipTaskbar() {} setIcon() {} setMinimumSize() {}
    setBounds() {} setContentBounds() {} setSize() {} setPosition() {} center() {}
    getBounds() { return { x: 0, y: 0, width: 1200, height: 850 }; }
    getContentBounds() { return { x: 0, y: 0, width: 1200, height: 850 }; }
    getNormalBounds() { return this.getBounds(); }
    getSize() { return [1200, 850]; } getContentSize() { return [1200, 850]; } getPosition() { return [0, 0]; }
    getNativeWindowHandle() { return Buffer.alloc(8); }
    getParentWindow() { return null; } getChildWindows() { return []; }
    setParentWindow() {}
    addBrowserView() {} removeBrowserView() {} setBrowserView() {} getBrowserViews() { return []; }
    get contentView() { return lenient({ addChildView() {}, removeChildView() {}, children: [] }, "contentView"); }
    close() {
      if (this._destroyed) return;
      const ev = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
      this.emit("close", ev);
      if (ev.defaultPrevented) return;
      this.destroy();
    }
    destroy() {
      if (this._destroyed) return;
      this._destroyed = true;
      allWindows.delete(this);
      this.webContents._destroy();
      this.emit("closed");
      if (allWindows.size === 0) app.emit("window-all-closed");
    }
  }

  // ---------- 세션·프로토콜 ----------
  const protocol = lenient({
    registerSchemesAsPrivileged() {},
    registerFileProtocol() { return true; },
    registerBufferProtocol() { return true; },
    registerStringProtocol() { return true; },
    handle(scheme, fn) { session.protocols.set(scheme, fn); if (process.env.IEUM_DEBUG) session.log("프로토콜 등록: " + scheme); },
    unhandle(scheme) { session.protocols.delete(scheme); },
    isProtocolHandled(scheme) { return session.protocols.has(scheme); },
    interceptFileProtocol() { return true; },
  }, "protocol");
  const webRequest = lenient({ onBeforeRequest() {}, onBeforeSendHeaders() {}, onHeadersReceived() {}, onCompleted() {} }, "webRequest");
  const defaultSession = lenient(Object.assign(new EventEmitter(), {
    protocol,
    webRequest,
    setPermissionRequestHandler() {},
    setPermissionCheckHandler() {},
    setDevicePermissionHandler() {},
    setDisplayMediaRequestHandler() {},
    setSpellCheckerLanguages() {},
    getSpellCheckerLanguages() { return []; },
    setSpellCheckerEnabled() {},
    availableSpellCheckerLanguages: [],
    addWordToSpellCheckerDictionary() { return true; },
    removeWordFromSpellCheckerDictionary() { return true; },
    listWordsInSpellCheckerDictionary() { return Promise.resolve([]); },
    clearCache() { return Promise.resolve(); },
    clearStorageData() { return Promise.resolve(); },
    resolveProxy() { return Promise.resolve("DIRECT"); },
    setProxy() { return Promise.resolve(); },
    getUserAgent() { return "DeolnureumWork-Android"; },
    setUserAgent() {},
    fetch: (...a) => fetch(...a),
    setPreloads() {},
    getPreloads() { return []; },
    registerPreloadScript() { return "preload"; },
  }), "session");
  const sessionApi = lenient({
    defaultSession,
    fromPartition() { return defaultSession; },
    fromPath() { return defaultSession; },
  }, "session");

  // ---------- app ----------
  const dirs = session.dirs;
  const app = lenient(Object.assign(new EventEmitter(), {
    name: "DeolnureumWork",
    isPackaged: true,
    commandLine: lenient({ appendSwitch() {}, appendArgument() {}, hasSwitch() { return false; }, getSwitchValue() { return ""; }, removeSwitch() {} }, "commandLine"),
    dock: undefined,
    whenReady() { return session.ready; },
    isReady() { return session.isReady; },
    getPath(name) {
      const p = dirs[name] || path.join(dirs.userData, name);
      try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
      return p;
    },
    setPath(name, value) { dirs[name] = value; },
    getAppPath() { return path.join(session.resourcesPath, "app"); },
    getLocale() { return "ko"; },
    getSystemLocale() { return "ko-KR"; },
    getPreferredSystemLanguages() { return ["ko-KR"]; },
    getLocaleCountryCode() { return "KR"; },
    getVersion() { return session.appVersion; },
    getName() { return "DeolnureumWork"; },
    setName() {},
    quit() { session.log("app.quit() 무시"); },
    exit() { session.log("app.exit() 무시"); },
    relaunch() {},
    focus() {},
    hide() {},
    show() {},
    requestSingleInstanceLock() { return true; },
    hasSingleInstanceLock() { return true; },
    releaseSingleInstanceLock() {},
    setAppUserModelId() {},
    setAsDefaultProtocolClient() { return false; },
    isDefaultProtocolClient() { return false; },
    removeAsDefaultProtocolClient() { return false; },
    setAccessibilitySupportEnabled() {},
    isAccessibilitySupportEnabled() { return false; },
    getGPUFeatureStatus() { return {}; },
    getGPUInfo() { return Promise.resolve({}); },
    disableHardwareAcceleration() {},
    addRecentDocument() {},
    clearRecentDocuments() {},
    setBadgeCount() { return false; },
    getFileIcon() { return Promise.resolve(nativeImage.createEmpty()); },
    setAboutPanelOptions() {},
    getLoginItemSettings() { return { openAtLogin: false }; },
    setLoginItemSettings() {},
    enableSandbox() {},
    setUserTasks() { return false; },
    setJumpList() {},
  }), "app");

  // ---------- dialog (화면에 물어봄) ----------
  const dialog = lenient({
    async showOpenDialog(win, options) {
      if (!(win instanceof BrowserWindow) && win && !win.webContents) options = win;
      return session.askRenderer("dialog.showOpenDialog", [options || {}]);
    },
    async showSaveDialog(win, options) {
      if (!(win instanceof BrowserWindow) && win && !win.webContents) options = win;
      return session.askRenderer("dialog.showSaveDialog", [options || {}]);
    },
    async showMessageBox(win, options) {
      if (!(win instanceof BrowserWindow) && win && !win.webContents) options = win;
      return session.askRenderer("dialog.showMessageBox", [sanitizeBox(options || {})]);
    },
    showErrorBox(title, content) { session.askRenderer("dialog.showErrorBox", [{ title, content }]).catch(() => {}); },
    showOpenDialogSync() { warnOnce("dialog.showOpenDialogSync"); return undefined; },
    showSaveDialogSync() { warnOnce("dialog.showSaveDialogSync"); return undefined; },
    showMessageBoxSync(win, options) {
      if (!(win instanceof BrowserWindow) && win && !win.webContents) options = win;
      warnOnce("dialog.showMessageBoxSync");
      return typeof options?.cancelId === "number" ? options.cancelId : 0;
    },
    showCertificateTrustDialog() { return Promise.resolve(); },
  }, "dialog");
  function sanitizeBox(o) {
    return {
      type: o.type, title: o.title, message: o.message, detail: o.detail,
      buttons: Array.isArray(o.buttons) ? o.buttons.map(String) : ["확인"],
      defaultId: o.defaultId, cancelId: o.cancelId,
      checkboxLabel: o.checkboxLabel, checkboxChecked: o.checkboxChecked,
    };
  }

  // ---------- 나머지 ----------
  let clipText = "";
  const clipboard = lenient({
    readText() { return clipText; },
    writeText(t) { clipText = String(t ?? ""); session.askRenderer("clipboard.writeText", [clipText]).catch(() => {}); },
    readHTML() { return ""; },
    writeHTML() {},
    readRTF() { return ""; },
    readImage() { return nativeImage.createEmpty(); },
    writeImage() {},
    readBuffer() { return Buffer.alloc(0); },
    writeBuffer() {},
    write(data) { if (data && typeof data.text === "string") clipboard.writeText(data.text); },
    availableFormats() { return []; },
    has() { return false; },
    clear() { clipText = ""; },
  }, "clipboard");

  function makeImage(buf, size) {
    const bytes = buf ? Buffer.from(buf) : Buffer.alloc(0);
    const img = {
      isEmpty: () => bytes.length === 0,
      toPNG: () => bytes,
      toJPEG: () => bytes,
      toBitmap: () => bytes,
      getBitmap: () => bytes,
      toDataURL: () => "data:image/png;base64," + bytes.toString("base64"),
      getSize: () => size || { width: 0, height: 0 },
      getAspectRatio: () => 1,
      resize: () => img,
      crop: () => img,
      addRepresentation() {},
      setTemplateImage() {},
      isTemplateImage: () => false,
      getScaleFactors: () => [1],
    };
    return img;
  }
  const nativeImage = lenient({
    createEmpty: () => makeImage(null),
    createFromBuffer: (buf) => makeImage(buf, pngSize(buf)),
    createFromPath: (p) => { try { const b = fs.readFileSync(p); return makeImage(b, pngSize(b)); } catch (_) { return makeImage(null); } },
    createFromDataURL: (u) => { const m = /base64,(.*)$/.exec(String(u)); return makeImage(m ? Buffer.from(m[1], "base64") : null); },
    createFromBitmap: () => makeImage(null),
    createThumbnailFromPath: () => Promise.reject(new Error("미리보기 이미지 미지원")),
  }, "nativeImage");
  function pngSize(buf) {
    try {
      const b = Buffer.from(buf);
      if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    } catch (_) {}
    return { width: 0, height: 0 };
  }

  const display = { id: 1, bounds: { x: 0, y: 0, width: 1200, height: 850 }, workArea: { x: 0, y: 0, width: 1200, height: 850 }, size: { width: 1200, height: 850 }, workAreaSize: { width: 1200, height: 850 }, scaleFactor: 2, rotation: 0, internal: true };
  const screen = lenient(Object.assign(new EventEmitter(), {
    getAllDisplays: () => [display],
    getPrimaryDisplay: () => display,
    getDisplayMatching: () => display,
    getDisplayNearestPoint: () => display,
    getCursorScreenPoint: () => ({ x: 0, y: 0 }),
  }), "screen");

  const nativeTheme = lenient(Object.assign(new EventEmitter(), {
    themeSource: "system",
    shouldUseDarkColors: false,
    shouldUseHighContrastColors: false,
    shouldUseInvertedColorScheme: false,
  }), "nativeTheme");

  let appMenu = null;
  class MenuItem {
    constructor(o) {
      Object.assign(this, o || {});
      if (Array.isArray(this.submenu)) this.submenu = Menu.buildFromTemplate(this.submenu);
      if (this.enabled === undefined) this.enabled = true;
      if (this.visible === undefined) this.visible = true;
    }
  }
  class Menu {
    constructor() { this.items = []; }
    static buildFromTemplate(t) { const m = new Menu(); m.items = (t || []).map((i) => new MenuItem(i)); return m; }
    static setApplicationMenu(m) { appMenu = m || null; session.setAppMenu(appMenu); }
    static getApplicationMenu() { return appMenu; }
    static sendActionToFirstResponder() {}
    append(i) { this.items.push(i); }
    insert(pos, i) { this.items.splice(pos, 0, i); }
    popup() {}
    closePopup() {}
    getMenuItemById() { return null; }
    on() { return this; }
    once() { return this; }
  }

  const shell = lenient({
    openExternal(url) { return session.askRenderer("shell.openExternal", [String(url)]).then(() => undefined, () => undefined); },
    openPath() { return Promise.resolve("지원하지 않음"); },
    showItemInFolder() {},
    trashItem(p) { return fs.promises.rm(p, { force: true }); },
    beep() {},
    readShortcutLink() { return {}; },
  }, "shell");

  const webContentsApi = lenient({
    getAllWebContents: () => [...allContents.values()],
    fromId: (id) => allContents.get(id) || undefined,
    getFocusedWebContents: () => [...allContents.values()][0] || null,
    fromFrame: () => null,
  }, "webContents");

  class Notification extends EventEmitter {
    static isSupported() { return false; }
    show() {} close() {}
  }

  const electron = {
    app,
    ipcMain,
    BrowserWindow,
    BaseWindow: BrowserWindow,
    WebContentsView: class { constructor() { this.webContents = new WebContents(null); } setBounds() {} },
    BrowserView: class { constructor() { this.webContents = new WebContents(null); } setBounds() {} setAutoResize() {} },
    dialog,
    protocol,
    session: sessionApi,
    shell,
    clipboard,
    nativeImage,
    nativeTheme,
    screen,
    Menu,
    MenuItem,
    Notification,
    Tray: class { constructor() {} setToolTip() {} setContextMenu() {} on() {} destroy() {} },
    webContents: webContentsApi,
    net: lenient({ fetch: (...a) => fetch(...a), isOnline: () => true, online: true, request() { throw new Error("net.request 미지원"); } }, "net"),
    systemPreferences: lenient({ getMediaAccessStatus: () => "denied", askForMediaAccess: () => Promise.resolve(false), isDarkMode: () => false, getAccentColor: () => "2b6cb0ff", getUserDefault: () => undefined, on() {}, subscribeNotification() { return 0; } }, "systemPreferences"),
    desktopCapturer: lenient({ getSources: () => Promise.resolve([]) }, "desktopCapturer"),
    powerMonitor: lenient(Object.assign(new EventEmitter(), { getSystemIdleTime: () => 0, isOnBatteryPower: () => false }), "powerMonitor"),
    powerSaveBlocker: lenient({ start: () => 0, stop() {}, isStarted: () => false }, "powerSaveBlocker"),
    crashReporter: lenient({ start() {} }, "crashReporter"),
    autoUpdater: lenient(Object.assign(new EventEmitter(), { setFeedURL() {}, checkForUpdates() {}, quitAndInstall() {} }), "autoUpdater"),
    globalShortcut: lenient({ register: () => false, unregister() {}, unregisterAll() {}, isRegistered: () => false }, "globalShortcut"),
    contentTracing: lenient({}, "contentTracing"),
    utilityProcess: lenient({ fork() { throw new Error("utilityProcess 미지원"); } }, "utilityProcess"),
    MessageChannelMain: class { constructor() { const { MessageChannel } = require("node:worker_threads"); const c = new MessageChannel(); this.port1 = c.port1; this.port2 = c.port2; } },
  };
  session.windows = allWindows;
  return lenient(electron, "electron");
}

module.exports = { createElectron };
