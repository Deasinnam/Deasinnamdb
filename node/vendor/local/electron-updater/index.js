"use strict";
// 안드로이드판에는 자동 업데이트가 없습니다. 데스크톱 코드가 부르는 모양만 맞춘 빈 구현입니다.
const { EventEmitter } = require("node:events");
class Updater extends EventEmitter {
  constructor() { super(); this.autoDownload = false; this.autoInstallOnAppQuit = false; this.allowPrerelease = false; this.logger = null; this.forceDevUpdateConfig = false; }
  checkForUpdates() { return Promise.resolve(null); }
  checkForUpdatesAndNotify() { return Promise.resolve(null); }
  downloadUpdate() { return Promise.resolve([]); }
  quitAndInstall() {}
  setFeedURL() {}
}
const autoUpdater = new Updater();
module.exports = { autoUpdater, AppUpdater: Updater, NsisUpdater: Updater, MacUpdater: Updater, AppImageUpdater: Updater, CancellationToken: class { cancel() {} } };
