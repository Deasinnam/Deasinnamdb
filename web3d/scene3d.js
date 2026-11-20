/* 1.80 대신남 3D 맵 스킨: 스피드미터(PFD) 풍경을 Three.js 3D 엔진으로 그림.
 *  - 실제 지도: OpenStreetMap 타일을 실제 고도(AWS 공개 Terrain Tiles)로 솟게 해 내 위치 둘레에 3단계(가까이 z15·중간 z13·멀리 z11)로 깔고
 *    지도의 건물 칸은 3D 건물로, 숲·공원 칸은 나무로 세움. 밤에는 길이 주황 불빛으로, 건물 창에 불이 들어옴
 *  - 하늘(대기 산란 셰이더)·해·달·별·구름(빌보드)·구름 그림자·물 반사·안개·그림자·블룸(빛 번짐)
 *  - 인터넷이 없으면 코드로 만든 들판 질감과 평지로 대신
 *  - 묶기: node tools/build-3d.cjs → app/src/main/assets/pfd3d.js (이 파일을 고친 뒤 꼭 다시 묶기)
 *  지도 © OpenStreetMap 기여자, 고도 © Mapzen/AWS Terrain Tiles */
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const R = 6378137, PI = Math.PI, D2R = PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mercX = lon => R * lon * D2R, mercY = lat => R * Math.log(Math.tan(PI / 4 + lat * D2R / 2));
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const LEVELS = [{ z: 15, r: 2 }, { z: 13, r: 2 }, { z: 11, r: 2 }];   // 가까이부터(5×5씩)
const SEG = 32;

/* ---------- 해 위치(시각·위치 → 고도·방위) ---------- */
function sunPos(ms, lat, lon) {
  const d = ms / 864e5 - 10957.5, g = (357.529 + .98560028 * d) * D2R, q = 280.459 + .98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * D2R, e = (23.439 - 3.6e-7 * d) * D2R;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24, ha = ((gmst * 15 + lon) * D2R - ra), la = lat * D2R;
  const el = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha));
  return { el: el / D2R, az: ((az / D2R) + 360) % 360 };
}

/* ---------- 코드로 만드는 질감 ---------- */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function fieldTexture() {            // 인터넷이 없을 때 땅: 들판 조각보 + 이랑 + 얼룩
  const W = 512, cv = canvas(W, W), x = cv.getContext('2d');
  const tones = ['#6f8a48', '#7d9450', '#8e9a58', '#60803f', '#9aa163', '#7a9055', '#a7a56a', '#5c7a3c'];
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = tones[Math.floor(hash(i * 8 + j) * tones.length)]; x.fillRect(i * 64 + 1, j * 64 + 1, 62, 62);
    x.strokeStyle = 'rgba(40,50,20,.18)'; x.lineWidth = 1; const v = hash(i + j * 9) < .5; for (let k = 4; k < 64; k += 5) { x.beginPath(); if (v) { x.moveTo(i * 64 + k, j * 64); x.lineTo(i * 64 + k, j * 64 + 64); } else { x.moveTo(i * 64, j * 64 + k); x.lineTo(i * 64 + 64, j * 64 + k); } x.stroke(); } }
  x.fillStyle = '#9b9a90'; for (let k = 0; k < 8; k++) { x.fillRect(k * 64, 0, 1.5, W); x.fillRect(0, k * 64, W, 1.5); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function cloudTexture(seed) {        // 뭉게구름 한 덩이(부드러운 공 여러 개)
  const W = 256, cv = canvas(W, W), x = cv.getContext('2d');
  for (let i = 0; i < 26; i++) { const a = hash(seed + i) * PI * 2, r = hash(seed + i * 3) * 70, px = 128 + Math.cos(a) * r * 1.3, py = 140 + Math.sin(a) * r * .55 - hash(seed + i * 5) * 30, s = 34 + hash(seed + i * 7) * 46;
    const g = x.createRadialGradient(px, py, 0, px, py, s); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.6, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, W, W); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function runwayTexture() {
  const cv = canvas(128, 2048), x = cv.getContext('2d');
  x.fillStyle = '#3a3c3f'; x.fillRect(0, 0, 128, 2048);
  for (let i = 0; i < 9000; i++) { x.fillStyle = hash(i) < .5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.06)'; x.fillRect(hash(i * 3) * 128, hash(i * 7) * 2048, 1.5, 1.5); }
  x.fillStyle = 'rgba(20,20,20,.35)'; for (let i = 0; i < 40; i++) x.fillRect(44 + hash(i) * 40, 1700 + hash(i * 5) * 300, 3, 60);   // 바퀴 자국
  x.fillStyle = '#f2f2ee'; x.fillRect(4, 0, 3, 2048); x.fillRect(121, 0, 3, 2048);
  for (let y = 180; y < 1880; y += 60) x.fillRect(62, y, 4, 34);                                        // 가운데 점선
  for (let i = 0; i < 8; i++) { x.fillRect(12 + i * 6.5, 1990, 4, 50); x.fillRect(116 - i * 6.5 - 4, 1990, 4, 50); x.fillRect(12 + i * 6.5, 8, 4, 50); x.fillRect(116 - i * 6.5 - 4, 8, 4, 50); }
  x.font = 'bold 52px sans-serif'; x.textAlign = 'center'; x.save(); x.translate(64, 1930); x.fillText('33', 0, 0); x.restore();
  x.save(); x.translate(64, 120); x.rotate(PI); x.fillText('15', 0, 0); x.restore();
  for (const y of [1750, 1690]) { x.fillRect(30, y, 14, 30); x.fillRect(84, y, 14, 30); }               // 접지 표시
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}
function glowTexture(rgb) {
  const cv = canvas(64, 64), x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(.25, 'rgba(' + rgb + ',.5)'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- 지도 바닥 재질: 낮엔 지도 색에 해·구름 그림자, 밤엔 길이 불빛(블룸), 물은 하늘을 비춤 ---------- */
const SH = { uTime: { value: 0 }, uNight: { value: 0 }, uCloud: { value: 1 }, uWind: { value: new THREE.Vector2() } };
const GLSL_NOISE = `
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=vn(p)*a;p*=2.03;a*=.5;}return s;}`;
function groundMaterial(level, map) {
  const m = new THREE.MeshStandardMaterial({ map, roughness: .93, metalness: 0, envMapIntensity: 1 });
  m.userData.hole = { value: new THREE.Vector4(1, 1, -1, -1) }; m.userData.osm = { value: 0 };
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, SH, { uHole: m.userData.hole, uOsm: m.userData.osm });
    s.vertexShader = 'varying vec3 vW;\n' + s.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader = 'varying vec3 vW;uniform float uTime,uNight,uCloud;uniform vec2 uWind;uniform vec4 uHole;uniform float uOsm;\n' + GLSL_NOISE + "\n" + s.fragmentShader
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif(vW.x>uHole.x&&vW.x<uHole.z&&vW.z>uHole.y&&vW.z<uHole.w)discard;\nfloat isWater=0.,glow=0.;vec3 glowC=vec3(0.);')
      .replace('#include <map_fragment>', `#ifdef USE_MAP
  vec4 tx=texture2D(map,vMapUv);vec3 sc=pow(max(tx.rgb,vec3(0.)),vec3(1./2.2));
  isWater=1.-smoothstep(.04,.10,distance(sc,vec3(.667,.827,.875)));
  float lum=dot(sc,vec3(.3,.59,.11)),sat=max(sc.r,max(sc.g,sc.b))-min(sc.r,min(sc.g,sc.b));
  float road=(smoothstep(.975,.995,lum)*(1.-smoothstep(.015,.04,sat))+smoothstep(.12,.3,sat)*step(sc.b,sc.g*.85)*step(sc.g*.97,sc.r))*(1.-isWater);
  float bld=1.-smoothstep(.03,.07,distance(sc,vec3(.851,.816,.788)));
  vec3 day=tx.rgb;day=mix(vec3(dot(day,vec3(.3,.59,.11))),day,1.12);
  day=mix(day,vec3(.05,.17,.27),isWater*.7);
  float cl=smoothstep(.45,.75,fbm(vW.xz*.00035+uWind*uTime))*uCloud*(1.-uNight);
  day*=1.-.38*cl;
  vec3 nite=mix(vec3(.010,.014,.024),vec3(.004,.010,.022),isWater)+tx.rgb*.02;
  glow=uOsm*(road*(.55+.45*vn(vW.xz*.05))+bld*step(.62,h21(floor(vW.xz/7.)))*.35)+(1.-uOsm)*step(.993,h21(floor(vW.xz/23.)))*1.5;   // 지도 없으면 들판에 드문드문 집 불빛
  glowC=mix(vec3(1.,.55,.18),vec3(1.,.8,.55),bld)*glow;
  diffuseColor.rgb*=mix(day,nite,uNight);
#endif`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.07,isWater);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nif(isWater>.5){vec2 q=vW.xz*.06+uTime*vec2(.6,.4);normal=normalize(normal+(viewMatrix*vec4(vn(q)-.5,0.,vn(q+7.)-.5,0.)).xyz*.35);}')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=glowC*uNight*1.4;');
  };
  m.polygonOffset = true; m.polygonOffsetFactor = level; m.polygonOffsetUnits = level;
  return m;
}
function buildingMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .78, metalness: .05 });
  m.onBeforeCompile = s => {
    Object.assign(s.uniforms, SH);
    s.vertexShader = 'varying vec3 vB;varying vec3 vN0;\n' + s.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n#ifdef USE_INSTANCING\nvB=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;\n#else\nvB=(modelMatrix*vec4(transformed,1.)).xyz;\n#endif\nvN0=normal;');
    s.fragmentShader = 'varying vec3 vB;varying vec3 vN0;uniform float uNight;\n' + GLSL_NOISE + "\n" + s.fragmentShader
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  if(abs(vN0.y)<.5){vec2 g=vec2((abs(vN0.x)>.5?vB.z:vB.x)/3.6,vB.y/3.3);vec2 f=fract(g);float win=step(.25,f.x)*step(f.x,.8)*step(.3,f.y)*step(f.y,.8);
    float lit=step(.55,h21(floor(g)+floor(vB.xz/40.)));diffuseColor.rgb*=mix(1.,.72,win*(1.-uNight));
    totalEmissiveRadiance+=win*lit*vec3(1.,.78,.45)*uNight*1.6;}else{diffuseColor.rgb*=.86;}`);
  };
  return m;
}

/* ---------- 엔진 ---------- */
export function create() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .55;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(56, 1.5, 2, 70000); cam.rotation.order = 'YXZ';
  scene.fog = new THREE.FogExp2(0xb8cbe0, .000045);

  // 하늘·해·달·별
  const sky = new Sky(); sky.scale.setScalar(60000); scene.add(sky);
  const su = sky.material.uniforms; su.turbidity.value = 4; su.rayleigh.value = 1.6; su.mieCoefficient.value = .004; su.mieDirectionalG.value = .82;
  if (su.cloudCoverage) su.cloudCoverage.value = 0;                     // 구름은 3D 빌보드로
  const sunL = new THREE.DirectionalLight(0xffffff, 3); sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048);
  Object.assign(sunL.shadow.camera, { left: -1400, right: 1400, top: 1400, bottom: -1400, near: 10, far: 8000 }); sunL.shadow.bias = -.0004; sunL.shadow.normalBias = 1.5;
  scene.add(sunL, sunL.target);
  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x4a5a3a, 1.1); scene.add(hemi);
  const starG = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 2600; i++) { const a = hash(i) * PI * 2, e = Math.asin(hash(i + 9) * .98 + .02); sp.push(Math.cos(e) * Math.sin(a) * 50000, Math.sin(e) * 50000, -Math.cos(e) * Math.cos(a) * 50000); }
  starG.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  const stars = new THREE.Points(starG, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false })); scene.add(stars);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('235,240,255'), color: 0xffffff, depthWrite: false, fog: false, transparent: true })); moon.scale.setScalar(4200); scene.add(moon);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('255,236,200'), depthWrite: false, fog: false, transparent: true, blending: THREE.AdditiveBlending })); sunGlow.scale.setScalar(9000); scene.add(sunGlow);

  // 하늘을 비추는 환경 맵(물·유리 반사), 해가 움직이면 가끔 다시 구움
  const pmrem = new THREE.PMREMGenerator(renderer); let envRT = null, envAt = -1e9, envEl = 999;
  const envScene = new THREE.Scene(), envSky = new Sky(); envSky.scale.setScalar(50); envScene.add(envSky);

  // 지도 타일(3단계)
  const FALLBACK = fieldTexture(), loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
  const tiles = new Map(), levelGroups = LEVELS.map(() => new THREE.Group()); levelGroups.forEach(g => scene.add(g));
  const mats = LEVELS.map((L, i) => groundMaterial(i * 2, FALLBACK));
  let net = true, pending = 0;
  const geo = { lat0: null, lon0: null, mx0: 0, my0: 0, k: 1 };
  function setOrigin(lat, lon) { geo.lat0 = lat; geo.lon0 = lon; geo.mx0 = mercX(lon); geo.my0 = mercY(lat); geo.k = Math.cos(lat * D2R); for (const t of tiles.values()) dropTile(t); tiles.clear(); }
  const tileSize = z => 2 * PI * R / Math.pow(2, z);
  const toWorld = (mx, my) => [(mx - geo.mx0) * geo.k, (geo.my0 - my) * geo.k];
  const toMerc = (x, z) => [x / geo.k + geo.mx0, geo.my0 - z / geo.k];
  function dropTile(t) { t.mesh && t.mesh.parent && t.mesh.parent.remove(t.mesh); t.mesh && t.mesh.geometry.dispose(); t.mat && t.mat.dispose(); t.tex && t.tex.dispose(); for (const k of ['bld', 'trees']) if (t[k]) { t[k].parent && t[k].parent.remove(t[k]); t[k].dispose(); } }   // 공용 모양(bGeo·tGeo)은 남김
  function decodeDem(img) { const c = canvas(256, 256), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, 256, 256).data, out = new Float32Array((SEG + 1) * (SEG + 1));
    for (let j = 0; j <= SEG; j++) for (let i = 0; i <= SEG; i++) { const px = Math.min(255, Math.round(i / SEG * 255)), py = Math.min(255, Math.round(j / SEG * 255)), k = (py * 256 + px) * 4; out[j * (SEG + 1) + i] = Math.max(-20, d[k] * 256 + d[k + 1] + d[k + 2] / 256 - 32768); }
    return out; }
  function applyDem(t) { const p = t.mesh.geometry.attributes.position; for (let v = 0; v < p.count; v++) p.setY(v, t.dem[v]); p.needsUpdate = true; t.mesh.geometry.computeVertexNormals(); t.mesh.geometry.computeBoundingSphere(); }
  function demAt(t, u, v) { if (!t || !t.dem) return null; const x = clamp(u, 0, 1) * SEG, y = clamp(v, 0, 1) * SEG, i = Math.min(SEG - 1, Math.floor(x)), j = Math.min(SEG - 1, Math.floor(y)), fx = x - i, fy = y - j, W = SEG + 1, d = t.dem;
    return lerp(lerp(d[j * W + i], d[j * W + i + 1], fx), lerp(d[(j + 1) * W + i], d[(j + 1) * W + i + 1], fx), fy); }
  function heightAt(x, z) {
    if (geo.lat0 === null) return 0; const [mx, my] = toMerc(x, z);
    for (const L of LEVELS) { const S = tileSize(L.z), tx = Math.floor((mx + PI * R) / S), ty = Math.floor((PI * R - my) / S), t = tiles.get(L.z + '/' + tx + '/' + ty);
      if (t && t.dem) return demAt(t, (mx + PI * R) / S - tx, (PI * R - my) / S - ty); }
    return 0;
  }
  // 지도 그림에서 건물·숲 칸을 찾아 3D로 세움(가까운 3×3 타일만)
  const bGeo = new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), bMat = buildingMaterial();
  const tGeo = new THREE.ConeGeometry(.5, 1, 7).translate(0, .5, 0), tMat = new THREE.MeshStandardMaterial({ color: 0x3f6a33, roughness: .9 });
  function extrude(t, img) {
    const c = canvas(256, 256), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); let d; try { d = x.getImageData(0, 0, 256, 256).data; } catch (e) { return; }
    const S = tileSize(t.z) * geo.k, mpp = S / 256, B = [], T = [], step = 4, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
    for (let py = 2; py < 256; py += step) for (let px = 2; px < 256; px += step) {
      const k = (py * 256 + px) * 4, r = d[k], g = d[k + 1], b = d[k + 2];
      const wx = t.x0 + (px + .5) * mpp, wz = t.z0 + (py + .5) * mpp, hs = hash(px * 7.1 + py * 3.3 + t.tx * 1.7 + t.ty * 2.9);
      if (Math.abs(r - 217) < 10 && Math.abs(g - 208) < 10 && Math.abs(b - 201) < 10) {
        const hgt = hs < .62 ? 7 + hs * 14 : hs < .93 ? 22 + (hs - .62) * 160 : 70 + (hs - .93) * 900;
        B.push([wx, wz, mpp * step * .82, hgt, hs]);
      } else if ((Math.abs(r - 173) < 14 && Math.abs(g - 209) < 14 && Math.abs(b - 158) < 14) || (Math.abs(r - 200) < 10 && Math.abs(g - 250) < 6 && Math.abs(b - 204) < 10)) {
        if (hs < .7) T.push([wx + (hs - .5) * mpp * 3, wz + (hash(hs * 99) - .5) * mpp * 3, 9 + hs * 14]);
      }
    }
    if (B.length) { const im = new THREE.InstancedMesh(bGeo, bMat, B.length); im.castShadow = im.receiveShadow = true;
      B.forEach(([wx, wz, s, hgt, hs], i) => { const y = heightAt(wx, wz) - 1; m4.compose(new THREE.Vector3(wx, y, wz), q, new THREE.Vector3(s, hgt, s * (.8 + hs * .4))); im.setMatrixAt(i, m4);
        im.setColorAt(i, col.setHSL(.08 + hs * .08, .08 + hs * .1, .62 + hs * .25)); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere(); scene.add(im); t.bld = im; }
    if (T.length) { const im = new THREE.InstancedMesh(tGeo, tMat, T.length); im.castShadow = true;
      T.forEach(([wx, wz, hgt], i) => { m4.compose(new THREE.Vector3(wx, heightAt(wx, wz) - .5, wz), q, new THREE.Vector3(hgt * .55, hgt, hgt * .55)); im.setMatrixAt(i, m4); });
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); scene.add(im); t.trees = im; }
  }
  function loadImg(url, ok, fail) { if (!net) return fail(); const im = new Image(); im.crossOrigin = 'anonymous'; pending++;
    im.onload = () => { pending--; ok(im); }; im.onerror = () => { pending--; fail(); }; im.src = url; }
  let fails = 0;
  function wantTile(z, tx, ty, li, near) {
    const key = z + '/' + tx + '/' + ty; let t = tiles.get(key); if (t) { t.seen = frame; return t; }
    const S = tileSize(z), [x0, z0] = toWorld(tx * S - PI * R, PI * R - ty * S), ws = S * geo.k;
    const g = new THREE.PlaneGeometry(ws, ws, SEG, SEG).rotateX(-PI / 2), mat = groundMaterial(li * 2, null); mat.userData.hole = mats[li].userData.hole; mat.customProgramCacheKey = () => 'g' + li;
    mat.map = FALLBACK.clone(); mat.map.repeat.set(ws / 900, ws / 900); mat.map.needsUpdate = true;
    const mesh = new THREE.Mesh(g, mat); mesh.position.set(x0 + ws / 2, 0, z0 + ws / 2); mesh.receiveShadow = li === 0; levelGroups[li].add(mesh);
    t = { z, tx, ty, key, mesh, mat, x0, z0, seen: frame, dem: null }; tiles.set(key, t);
    if (z <= 15) loadImg(DEM_URL.replace('{z}', z).replace('{x}', tx).replace('{y}', ty), im => { if (!tiles.has(key)) return; try { t.dem = decodeDem(im); applyDem(t); } catch (e) {} }, () => {});
    loadImg(TILE_URL.replace('{z}', z).replace('{x}', tx).replace('{y}', ty), im => {
      if (!tiles.has(key)) return; fails = 0; const tex = new THREE.Texture(im); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
      if (mat.map) mat.map.dispose(); mat.map = tex; t.tex = tex; mat.userData.osm.value = 1; mat.needsUpdate = true;
      if (near) { const go = () => extrude(t, im); t.dem ? go() : setTimeout(go, 900); }
    }, () => { if (++fails > 12) net = false; });
    return t;
  }
  let frame = 0;
  function updateTiles(cx, cz) {
    if (geo.lat0 === null) return; frame++;
    const [mx, my] = toMerc(cx, cz);
    LEVELS.forEach((L, li) => {
      const S = tileSize(L.z), tx = Math.floor((mx + PI * R) / S), ty = Math.floor((PI * R - my) / S);
      for (let j = -L.r; j <= L.r; j++) for (let i = -L.r; i <= L.r; i++) wantTile(L.z, tx + i, ty + j, li, li === 0 && Math.abs(i) <= 1 && Math.abs(j) <= 1);
      // 이 단계가 덮는 사각형 = 한 단계 먼 지도의 구멍(겹쳐 그리지 않게)
      const [ax, az] = toWorld((tx - L.r) * S - PI * R, PI * R - (ty - L.r) * S), [bx, bz] = toWorld((tx + L.r + 1) * S - PI * R, PI * R - (ty + L.r + 1) * S);
      if (li + 1 < LEVELS.length) mats[li + 1].userData.hole.value.set(Math.min(ax, bx) + 1, Math.min(az, bz) + 1, Math.max(ax, bx) - 1, Math.max(az, bz) - 1);
    });
    for (const [k, t] of tiles) if (frame - t.seen > 2) { dropTile(t); tiles.delete(k); }
  }

  // 구름(빌보드 무리)
  const clouds = [], cTex = [cloudTexture(1), cloudTexture(40), cloudTexture(90)];
  for (let i = 0; i < 70; i++) { const sm = new THREE.SpriteMaterial({ map: cTex[i % 3], transparent: true, depthWrite: false, fog: true, opacity: .95 }); const s = new THREE.Sprite(sm);
    const sc = 1600 + hash(i * 3) * 2600; s.scale.set(sc * 1.6, sc * .8, 1); s.userData = { ox: (hash(i) - .5) * 30000, oz: (hash(i + 5) - .5) * 30000, y: 1500 + hash(i + 9) * 1300 }; scene.add(s); clouds.push(s); }

  // 활주로·관제탑(출발·도착 때 내 앞에 놓임)
  const rw = new THREE.Group(); scene.add(rw);
  const rwMesh = new THREE.Mesh(new THREE.PlaneGeometry(45, 1400).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ map: runwayTexture(), roughness: .85, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }));
  rwMesh.position.set(0, .4, -700); rwMesh.receiveShadow = true; rw.add(rwMesh);
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(420, 1700).rotateX(-PI / 2), new THREE.MeshStandardMaterial({ color: 0x5f7a45, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  apron.position.set(0, .2, -700); apron.receiveShadow = true; rw.add(apron);
  const lightG = new THREE.SphereGeometry(.7, 8, 6), lights = new THREE.InstancedMesh(lightG, new THREE.MeshBasicMaterial({ color: 0xffffff }), 120), m4 = new THREE.Matrix4(), cc = new THREE.Color();
  for (let i = 0; i < 60; i++) { for (const sd of [-1, 1]) { const n = i * 2 + (sd > 0 ? 1 : 0); m4.makeTranslation(sd * 24, 1, -i * 1400 / 59); lights.setMatrixAt(n, m4); lights.setColorAt(n, cc.set(i < 3 ? 0x40ff70 : i > 56 ? 0xff3030 : 0xfff2d0)); } }
  rw.add(lights);
  const tower = new THREE.Group(), tm = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: .6 }), glass = new THREE.MeshStandardMaterial({ color: 0x1b3346, roughness: .08, metalness: .6, emissive: 0x3a6a8a, emissiveIntensity: 0 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 48, 16), tm); shaft.position.y = 24; const cab = new THREE.Mesh(new THREE.CylinderGeometry(9, 7, 7, 16), glass); cab.position.y = 51;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 1.5, 16), tm); roof.position.y = 55.5; tower.add(shaft, cab, roof); tower.position.set(170, 0, -520);
  tower.traverse(o => { o.castShadow = o.receiveShadow = true; }); rw.add(tower);
  for (let i = 0; i < 3; i++) { const hg = new THREE.Mesh(new THREE.BoxGeometry(70, 22, 60).translate(0, 11, 0), new THREE.MeshStandardMaterial({ color: i === 1 ? 0xb9c0c6 : 0xa5adb4, roughness: .5, metalness: .4 })); hg.position.set(175, 0, -680 - i * 80); hg.castShadow = hg.receiveShadow = true; rw.add(hg); }

  // 후처리: 빛 번짐
  const composer = new EffectComposer(renderer), bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .2, .55, .85);
  composer.addPass(new RenderPass(scene, cam)); composer.addPass(bloom); composer.addPass(new OutputPass());

  const st = { x: 0, z: 0, hd: 0, wz: null, t0: performance.now(), rwSet: false, fixT: 0, fx: 0, fz: 0, vx: 0, vz: 0 };
  let W = 0, H = 0, lastQ = '';
  function render(o) {
    const now = performance.now(), t = (now - st.t0) / 1000;
    const hq = o.quality !== 'balanced', scale = hq ? Math.min(2, o.dpr) : Math.min(1.25, o.dpr), w = Math.max(64, Math.round(o.w * scale)), h = Math.max(64, Math.round(o.h * scale));
    if (w !== W || h !== H || lastQ !== o.quality) { W = w; H = h; lastQ = o.quality; renderer.setPixelRatio(1); renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
      renderer.shadowMap.enabled = hq; sunL.castShadow = hq; }
    // 원점·위치: GPS가 있으면 실제 자리(1초 간격 위치를 부드럽게 이어), 없으면 서울 시청에서 달린 만큼
    const g = o.gps;
    if (geo.lat0 === null) setOrigin(g && g.fix ? g.lat : 37.5665, g && g.fix ? g.lon : 126.978);
    if (o.hd !== null) st.hd = o.hd;
    const fwd = [Math.sin(st.hd * D2R), -Math.cos(st.hd * D2R)];
    if (g && g.fix && isFinite(g.lat)) {
      const [px, pz] = toWorld(mercX(g.lon), mercY(g.lat));
      if (Math.hypot(px - st.x, pz - st.z) > 30000) setOrigin(g.lat, g.lon), st.x = 0, st.z = 0;
      else if (px !== st.fx || pz !== st.fz) { st.fx = px; st.fz = pz; st.fixT = now; const v = (o.speed || 0) / 3.6; st.vx = fwd[0] * v; st.vz = fwd[1] * v; }
      const dt = Math.min(1.5, (now - st.fixT) / 1000), tx = st.fx + st.vx * dt, tz = st.fz + st.vz * dt, k = clamp((now - (st.last || now)) / 400, 0, 1);
      st.x = lerp(st.x, tx, k || 1); st.z = lerp(st.z, tz, k || 1);
    } else if (st.wz !== null) { const d = o.wz - st.wz; if (d > 0 && d < 2000) { st.x += fwd[0] * d / 2.2; st.z += fwd[1] * d / 2.2; } }
    st.wz = o.wz; st.last = now;
    updateTiles(st.x, st.z);
    const gh = heightAt(st.x, st.z), alt = Math.max(gh, 0) + 3 + o.alt * 1.6;
    cam.position.set(st.x, alt, st.z);
    cam.rotation.set(o.pitch * D2R, -st.hd * D2R, -o.roll * D2R);
    // 원근: 2D 계기의 피치 사다리(높이/58°, 수평선이 0.53 높이)와 맞춤
    const fullH = h * 1.06, f = h / 58 * 180 / PI; cam.fov = 2 * Math.atan(fullH / 2 / f) / D2R; cam.aspect = w / fullH; cam.setViewOffset(w, fullH, 0, 0, w, h); cam.updateProjectionMatrix();

    // 해·밤
    const sun = sunPos(o.time, geo.lat0, geo.lon0); let el = sun.el;
    if (o.night && el > -4) el = -14; if (!o.night && el < 2) el = 30;
    const night = clamp((-el + 2) / 10, 0, 1), gold = clamp(1 - Math.abs(el - 4) / 10, 0, 1) * (1 - night);
    const sd = new THREE.Vector3().setFromSphericalCoords(1, (90 - el) * D2R, (180 - sun.az) * D2R);   // 북 -Z, 동 +X
    su.sunPosition.value.copy(sd); envSky.material.uniforms.sunPosition.value.copy(sd);
    su.rayleigh.value = lerp(1.6, 3.2, gold); su.turbidity.value = lerp(4, 9, gold);
    if (Math.abs(el - envEl) > 1.5 || now - envAt > 60000) { envEl = el; envAt = now; Object.assign(envSky.material.uniforms.turbidity, { value: su.turbidity.value }); envSky.material.uniforms.rayleigh.value = su.rayleigh.value;
      if (envRT) envRT.dispose(); envRT = pmrem.fromScene(envScene); scene.environment = envRT.texture; }
    sunL.position.copy(cam.position).addScaledVector(sd, 4000); sunL.target.position.copy(cam.position); sunL.target.position.y = gh;
    sunL.color.setHSL(lerp(.12, .07, gold), lerp(.25, .85, gold), .62); sunL.intensity = lerp(2.8, 1.8, gold) * (1 - night) + night * .3;
    if (night > .5) { sunL.position.copy(cam.position).addScaledVector(new THREE.Vector3(-sd.x, .6, -sd.z).normalize(), 4000); sunL.color.set(0x8fa8e0); }
    hemi.intensity = lerp(.45, .1, night); scene.environmentIntensity = lerp(.16, .05, night);   // 하늘 환경 빛은 아주 밝아(대기 셰이더 값) 낮춰 씀 hemi.color.set(night > .5 ? 0x2a3a5a : 0xcfe4ff); hemi.groundColor.set(night > .5 ? 0x0a0d14 : 0x4a5a3a);
    renderer.toneMappingExposure = lerp(.62, .9, night);
    stars.material.opacity = night; stars.position.copy(cam.position); stars.visible = night > .02;
    moon.visible = night > .2; moon.position.copy(cam.position).add(new THREE.Vector3(-sd.x, Math.max(.25, -sd.y), -sd.z).normalize().multiplyScalar(40000));
    sunGlow.visible = el > -2; sunGlow.position.copy(cam.position).addScaledVector(sd, 40000); sunGlow.material.opacity = (1 - night) * lerp(.35, .8, gold);
    sky.position.copy(cam.position);
    const fogC = new THREE.Color().setRGB(lerp(.72, .95, gold), lerp(.80, .72, gold), lerp(.88, .62, gold)).lerp(new THREE.Color(0x0a1120), night);
    scene.fog.color.copy(fogC); scene.fog.density = lerp(.000038, .00006, gold) * (alt > 900 ? .8 : 1);
    SH.uTime.value = t; SH.uNight.value = night; SH.uWind.value.set(.012, .006); SH.uCloud.value = 1;
    glass.emissiveIntensity = night * 2;
    // 구름: 내 둘레 30km에 감겨 다시 나타남, 바람에 천천히 흐름
    const cl = new THREE.Color().setRGB(lerp(1, 1, gold), lerp(1, .78, gold), lerp(1, .6, gold)).lerp(new THREE.Color(0x26324a), night);
    for (const s of clouds) { const u = s.userData, wx = ((u.ox + t * 6 - st.x) % 30000 + 45000) % 30000 - 15000, wz = ((u.oz + t * 3 - st.z) % 30000 + 45000) % 30000 - 15000;
      s.position.set(st.x + wx, u.y, st.z + wz); s.material.color.copy(cl); s.material.opacity = lerp(.95, .55, night); }
    // 활주로: 지상·접근 중에는 내 앞(진행 방향)에, 이륙 뒤에는 그 자리에 남음
    const ground = ['hold', 'roll', 'landed', 'rollout', 'approach'].includes(o.phase);
    if (ground || !st.rwSet) { const d = (o.rwS || 0) / 2.2; rw.position.set(st.x + fwd[0] * d, 0, st.z + fwd[1] * d); rw.rotation.y = -st.hd * D2R; rw.position.y = heightAt(rw.position.x, rw.position.z); st.rwSet = true;
    }
    rw.visible = Math.hypot(rw.position.x - st.x, rw.position.z - st.z) < 25000;
    lights.material.color.setScalar(lerp(.6, 4, night));
    bloom.strength = lerp(hq ? .12 : .08, hq ? .75 : .55, night); bloom.threshold = lerp(2.2, .42, night); bloom.radius = lerp(.4, .5, night);
    const dbg = window.__3dOff || {}; bloom.enabled = !dbg.bloom; if (dbg.fog) scene.fog.density = 0; if (dbg.env) scene.environment = null; else if (envRT) scene.environment = envRT.texture;
    if (dbg.direct) renderer.render(scene, cam); else composer.render();
    return renderer.domElement;
  }
  return { ok: true, render, get tiles() { return tiles.size; }, get net() { return net; }, get pending() { return pending; }, get pos() { return { x: st.x, z: st.z, hd: st.hd, lat0: geo.lat0 }; }, renderer, scene, bloom, composer };
}
window.Amp3D = { create };
