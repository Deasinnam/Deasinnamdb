const {run, assert} = require('./lib/harness.cjs');

// 1.55 앱 나누기: 대신남 AMP = 오디오 스킨 7개(차량 기능 숨김), 대신남 원 = 자동차 모드·에어라인
run('App split: AMP audio skins only, One car skins only', async ({context, origin, errors}) => {
  for (const [kind, skins, def] of [['amp', ['blue', 'amber', 'base', 'neon', 'ice', 'red', 'wood'], 'blue'], ['one', ['carnival', 'carnival7'], 'carnival7'], ['std', ['carnival', 'carnival7'], 'carnival7']]) {
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(kind + ': ' + e.message));
    await p.addInitScript(k => { window.__build = k; window.AndroidBridge = {buildKind: () => k}; if (sessionStorage.getItem('as') !== k) { sessionStorage.setItem('as', k); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify(k === 'amp' ? 'carnival7' : 'neon')); } }, kind);
    await p.setViewportSize({width: 900, height: 1000});
    await p.goto(origin); await p.waitForTimeout(700);
    assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_skin2'))), def, kind + ': a skin from the other app falls back to the default');
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#skin option')].map(o => o.value)), skins, kind + ' skins');
    await p.locator('#skinBtn').click();
    assert.deepEqual(await p.evaluate(() => [...document.querySelectorAll('#skinPickList .pill')].map(b => b.dataset.k)), skins);
    await p.evaluate(() => document.getElementById('skinPick').hidden = true);
    const vis = await p.evaluate(() => ['#driveBtn', '#revBtn', '#wGps', '#wLog'].map(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && !e.hidden; }));
    if (kind === 'amp') assert.deepEqual(vis, [false, false, false, false], 'AMP hides car features');
    else assert.deepEqual(vis.slice(0, 3), [true, true, true], 'One keeps car features');
    if (kind !== 'amp') { // 1.56: 켜면 스피드미터 창이 화면 한가득, 관제탑 문구가 길어도 제목줄 높이 그대로
      await p.reload(); await p.waitForTimeout(1800);
      const st = await p.evaluate(() => { const w = document.getElementById('wGps').getBoundingClientRect(); return {fx: document.getElementById('app').classList.contains('FX'), top: Math.round(w.top), h: Math.round(w.height), vh: innerHeight}; });
      assert.ok(st.fx && Math.abs(st.top) < 12 && st.h > st.vh - 30, 'boots into a full-screen speedometer: ' + JSON.stringify(st));
      const hs = [];
      for (const t of ['대기', '전조등 · 계기판 조명 확인 CHECK — 엔진 계통 이상 없음, 연료 충분, 활주로 33 진입 대기 중입니다']) {
        await p.evaluate(t => { const li = document.createElement('li'); li.textContent = 'TWR ' + t; document.getElementById('atcLog').append(li); }, t); await p.waitForTimeout(200);
        hs.push(await p.evaluate(() => [Math.round(document.querySelector('#wGps>.bar').getBoundingClientRect().height), document.querySelector('#atcMini span').classList.contains('mq')]));
      }
      assert.equal(hs[0][0], hs[1][0], 'title bar height stays the same'); assert.deepEqual([hs[0][1], hs[1][1]], [false, true], 'long text scrolls like a marquee');
    }
    assert.equal(await p.evaluate(() => document.documentElement.dataset.app), kind === 'std' ? 'one' : kind);
    if (kind === 'amp') {
      const top = await p.evaluate(() => { document.getElementById('srcSeg').hidden = false; const t = document.querySelector('header.top .tools'); const it = [...t.children].filter(e => e.offsetParent);
        return { clock: getComputedStyle(document.getElementById('clock')).display, rows: new Set(it.map(e => Math.round(e.getBoundingClientRect().top))).size, emo: [...t.querySelectorAll('.emo,.ico')].some(e => e.offsetParent), fit: t.scrollWidth <= t.clientWidth + 1 }; });
      assert.equal(top.clock, 'none', 'AMP hides clock/weather/brightness');
      assert.equal(top.rows, 1, 'AMP tool buttons in one row'); assert.equal(top.emo, false, 'no emoji icons'); assert.ok(top.fit, 'row fits');
    }
    await p.close();
  }
});
