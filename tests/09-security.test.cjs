const {run, assert} = require('./lib/harness.cjs');

const TOK = 'tok' + 'a1b2c3d4'.repeat(6);
// 앱처럼 index.html에 열쇠를 심어서 보냄
const serve = (req, name, body) => name === '/' || name === '/index.html'
  ? {type: 'text/html', body: body.toString('utf8').replace('"__NBT__"', JSON.stringify(TOK))} : null;

run('Bridge key gate, CSP, map message source, settings migration', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('security: ' + e.message));
  await p.addInitScript(tok => {
    window.__gate = [];
    const impl = {
      gpsStatus: () => JSON.stringify({fix: false, perm: true, enabled: true}),
      keepScreenOn: () => {}, takeCarAutoplay: () => false,
      migrateTake: () => sessionStorage.getItem('mig') ? '' : (sessionStorage.setItem('mig', '1'), JSON.stringify({dna_skin2: JSON.stringify('blue'), dna_rdVol: '55'})),
      probeBool: () => true, probeNum: () => 42, probeVoid: () => undefined, probeArgs: (a, b, c) => JSON.stringify([a, b, c])
    };
    window.AndroidBridge = {
      methods: t => t === tok ? Object.keys(impl).join(',') : '',
      call: (t, n, a) => {
        window.__gate.push(n + (t === tok ? '' : ':denied'));
        if (t !== tok) return 'eDenied';
        const r = impl[n](...JSON.parse(a));
        return r === undefined ? 'u' : typeof r === 'string' ? 's' + r : typeof r === 'boolean' ? (r ? 'b1' : 'b0') : 'n' + r;
      }
    };
  }, TOK);
  await p.goto(origin);
  await p.waitForFunction(() => window.AmpRadio && document.readyState === 'complete');
  // 열쇠로 만든 창구만 남고, 원래 객체는 다른 이름으로도 꺼낼 수 없음
  const shape = await p.evaluate(() => ({
    hasCall: typeof window.AndroidBridge.call, names: Object.keys(window.AndroidBridge).sort().join(','),
    frozen: Object.isFrozen(window.AndroidBridge), same: window.__AmpNB === window.AndroidBridge,
    b: window.AndroidBridge.probeBool(), n: window.AndroidBridge.probeNum(), v: window.AndroidBridge.probeVoid(),
    args: window.AndroidBridge.probeArgs('x', 3, true)
  }));
  assert.equal(shape.hasCall, 'undefined', 'Raw gate is not reachable as AndroidBridge');
  assert.equal(shape.frozen, true);
  assert.equal(shape.same, true);
  assert.deepEqual([shape.b, shape.n, shape.v, shape.args], [true, 42, undefined, '["x",3,true]'], 'Types survive the gate');
  assert.ok(!(await p.evaluate(() => __gate)).some(x => /denied/.test(x)), 'App calls always carry the key');
  // 옛 주소의 설정이 앱 시작 전에 옮겨짐
  assert.equal(await p.locator('#skin').inputValue(), 'blue', 'Migrated skin applied at boot');
  // CSP: 앱 화면에 바깥 스크립트를 넣으면 막힘
  const blocked = await p.evaluate(() => new Promise(res => {
    document.addEventListener('securitypolicyviolation', e => res(e.violatedDirective), {once: true});
    const s = document.createElement('script'); s.src = 'https://cdn.example.com/x.js'; document.head.appendChild(s);
    setTimeout(() => res('none'), 1500);
  }));
  assert.match(blocked, /script-src/, 'External script blocked by CSP');
  // 지도 메시지: 지도 iframe이 아닌 곳에서 온 메시지는 무시
  await p.evaluate(() => window.postMessage({t: 'map', p: 'naver', ok: false, err: 'FAKE'}, '*'));
  await p.waitForTimeout(200);
  assert.ok(!/FAKE/.test(await p.evaluate(() => document.getElementById('mapMsg').textContent)), 'Map messages from other windows are ignored');
  await p.close();
}, {serve});
