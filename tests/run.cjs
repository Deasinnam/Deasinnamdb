#!/usr/bin/env node
/*
 * 모든 UI 테스트(tests/*.test.cjs)를 각자 다른 프로세스로 실행합니다(기본 동시 2개, TEST_JOBS로 조절).
 *   node tests/run.cjs            모두
 *   node tests/run.cjs radio      이름에 radio가 들어간 것만
 */
'use strict';
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const dir = __dirname;
const filter = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.cjs')).sort()
  .filter(f => !filter.length || filter.some(k => f.includes(k)));
const jobs = Math.max(1, +process.env.TEST_JOBS || 2);
const t0 = Date.now();
let next = 0, failed = [];

function one(f) {
  return new Promise(resolve => {
    const out = [];
    const p = spawn(process.execPath, [path.join(dir, f)], {stdio: ['ignore', 'pipe', 'pipe']});
    p.stdout.on('data', d => out.push(d));
    p.stderr.on('data', d => out.push(d));
    p.on('close', code => {
      const text = Buffer.concat(out).toString().trim();
      if (code !== 0) failed.push(f);
      console.log((code === 0 ? '' : '✗ ' + f + '\n') + text);
      resolve();
    });
  });
}

async function worker() { while (next < files.length) await one(files[next++]); }

Promise.all(Array.from({length: Math.min(jobs, files.length)}, worker)).then(() => {
  const s = ((Date.now() - t0) / 1000).toFixed(0);
  if (failed.length) { console.error(`\n${failed.length}/${files.length} test files failed (${s}s): ${failed.join(', ')}`); process.exit(1); }
  console.log(`\nAll ${files.length} test files passed (${s}s)`);
});
