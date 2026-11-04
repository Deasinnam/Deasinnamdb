#!/usr/bin/env node
/*
 * 앱 화면 스크립트 묶기: web/src/*.js(이름 순)를 하나의 함수 범위로 이어 붙여 assets/app.js를 만듭니다.
 * - 원래 index.html 안의 큰 스크립트를 기능별 파일로 나눈 것이라, 모든 파일이 같은 범위(서로의 함수·변수)를 씁니다.
 * - 고칠 때는 web/src의 파일을 고치고 `npm run build` (테스트는 자동으로 먼저 묶음).
 * - `--check`: app.js가 web/src와 다르면 실패(CI에서 묶기를 빠뜨렸는지 확인).
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'web', 'src');
const out = path.join(root, 'app', 'src', 'main', 'assets', 'app.js');

function build() {
  const files = fs.readdirSync(srcDir).filter(f => /^\d\d-[a-z0-9-]+\.js$/.test(f)).sort();
  if (!files.length) throw new Error('web/src에 파일이 없어요');
  const parts = ['/* 자동 생성 파일 — 고치지 마세요. 원본: web/src/*.js, 묶기: node tools/build-web.cjs */', '(()=>{'];
  for (const f of files) {
    const body = fs.readFileSync(path.join(srcDir, f), 'utf8').replace(/\s+$/, '');
    parts.push(`/* ===== ${f} ===== */`, body);
  }
  parts.push('})();', '');
  return parts.join('\n');
}

const text = build();
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== text) {
    console.error('assets/app.js가 web/src와 달라요. `npm run build`로 다시 묶어 주세요.');
    process.exit(1);
  }
  console.log('app.js is up to date');
} else {
  fs.writeFileSync(out, text);
  console.log('built', path.relative(root, out), (text.length / 1024).toFixed(0) + ' KB');
}
