/*
 * UI 테스트 공통 준비: assets 폴더를 띄우는 작은 서버 + Chromium + 기본 창(1470×1000).
 * 바깥 주소 요청은 모두 막고(/media, /art는 빈 응답), 페이지 오류는 errors에 모아 끝에 비어 있는지 확인합니다.
 *
 *   const {run, assert} = require('./lib/harness.cjs');
 *   run('이름', async ({browser, context, origin, errors, newPage}) => { ... });
 */
'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');

const assets = path.resolve(__dirname, '../../app/src/main/assets');
const TYPES = {'.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml'};

/** 서버: 테스트가 응답을 바꿀 수 있게 hook(req) → {status, type, body} | null */
async function startServer(hook) {
  const server = http.createServer(async (req, res) => {
    const name = new URL(req.url, 'http://localhost').pathname;
    const target = path.resolve(assets, '.' + (name === '/' ? '/index.html' : name));
    if (!target.startsWith(assets + path.sep)) { res.writeHead(403).end(); return; }
    try {
      let body = await fs.readFile(target);
      if (hook) { const r = await hook(req, name, body); if (r) { res.writeHead(r.status || 200, {'Content-Type': r.type || 'text/html'}); res.end(r.body); return; } }
      res.setHeader('Content-Type', TYPES[path.extname(target)] || 'text/html');
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {server, origin: `http://127.0.0.1:${server.address().port}`};
}

async function routeLocal(context, origin) {
  // 시험에서는 플레이 출시 때 숨긴 예전 스킨도 그대로 확인
  await context.addInitScript(() => { if (window.__allSkins === undefined) window.__allSkins = true; });
  return context.route('**/*', route => {
    const url = route.request().url();
    if (!url.startsWith(origin)) return route.abort();
    // 앱에서는 /media, /art를 네이티브가 기기 파일로 응답합니다. 테스트에서는 빈 응답으로 대신합니다.
    if (/\/(media|art)\?/.test(url)) return route.fulfill({status: 404, body: ''});
    return route.continue();
  });
}

const errText = error => error.message + ' @ ' + (error.stack || '').split('\n').slice(1, 3).join(' | ');

function run(name, fn, opts = {}) {
  opts = opts || {};
  const t0 = Date.now();
  (async () => {
    const {server, origin} = await startServer(opts.serve);
    let browser;
    try {
      browser = await chromium.launch({headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {})});
      const context = await browser.newContext({viewport: {width: 1470, height: 1000}});
      await routeLocal(context, origin);
      // TEST_BUILD=special 처럼 주면 모든 페이지를 그 빌드로 열어 봄(스페셜판도 기존 기능이 다 되는지)
      if (process.env.TEST_BUILD) await context.addInitScript(b => { if (!window.__build) window.__build = b; }, process.env.TEST_BUILD);
      const errors = [];
      /** 오류를 모으는 새 페이지 (init: addInitScript 함수, arg: 그 인자) */
      const newPage = async (init, arg, ctx) => {
        const p = await (ctx || context).newPage();
        p.on('pageerror', e => errors.push(name + ': ' + errText(e)));
        if (init) await p.addInitScript(init, arg);
        return p;
      };
      await fn({browser, context, origin, errors, newPage, routeLocal: c => routeLocal(c, origin), errText});
      assert.deepEqual(errors, [], 'No page errors');
      console.log(`PASS: ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } finally {
      if (browser) await browser.close();
      await new Promise(resolve => server.close(resolve));
    }
  })().catch(error => { console.error(`FAIL: ${name}\n`, error); process.exitCode = 1; });
}

module.exports = {run, assert, assets, startServer};
