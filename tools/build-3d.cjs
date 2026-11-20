#!/usr/bin/env node
/* 3D 맵 스킨 엔진 묶기: web3d/scene3d.js + three.js → app/src/main/assets/pfd3d.js (한 파일, 압축)
 * three·esbuild는 devDependencies. 엔진을 고친 뒤 `node tools/build-3d.cjs`로 다시 묶고 결과 파일도 함께 올림 */
'use strict';
const path = require('node:path');
require('esbuild').buildSync({
  entryPoints: [path.join(__dirname, '..', 'web3d', 'scene3d.js')], bundle: true, minify: true, format: 'iife', target: 'chrome90',
  outfile: path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'pfd3d.js'),
  banner: { js: '/* 자동 생성 — 원본 web3d/scene3d.js, 묶기 node tools/build-3d.cjs. three.js © mrdoob (MIT). 지도 © OpenStreetMap 기여자, 고도 © Mapzen/AWS Terrain Tiles */' },
  alias: { 'three/addons': path.join(__dirname, '..', 'node_modules', 'three', 'examples', 'jsm') }, legalComments: 'none'
});
console.log('pfd3d.js 묶음 완료');
