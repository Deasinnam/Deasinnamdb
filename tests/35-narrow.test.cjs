const {run, assert} = require('./lib/harness.cjs');

// 1.67 좁은 화면(폴드7 좌우 반 가르기 344px·바깥 화면): 아래 버튼 줄은 아이콘 한 줄, 창 머리줄 한 줄,
// 속도계 위 정보는 접어 둠(상태 줄을 누르면 펼침), 플레이어 버튼 한 줄, 라디오 즐겨찾기 4칸
run('Narrow screens: Fold split half and cover display', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'one'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 344, height: 740});
  await p.goto(origin); await p.waitForFunction(() => window.AmpNarrow);
  assert.equal(await p.evaluate(() => document.documentElement.hasAttribute('data-narrow')), true);
  const rail = () => p.evaluate(() => { const bs = [...document.querySelectorAll('#ckRail>button')].filter(b => b.offsetParent);
    return {n: bs.length, rows: new Set(bs.map(b => Math.round(b.getBoundingClientRect().top))).size, text: bs.some(b => [...b.querySelectorAll('span')].some(s => s.offsetParent)), named: bs.every(b => b.getAttribute('aria-label'))}; });
  for (const f of ['gps', 'map', 'radio', 'vis', 'cam']) {
    await p.locator('#ckRail button[data-f="' + f + '"]').click(); await p.waitForTimeout(700);
    const r = await rail();
    assert.ok(r.n >= 8 && r.rows === 1 && !r.text && r.named, f + ': icon-only rail in one row ' + JSON.stringify(r));
    const bar = await p.evaluate(() => document.querySelector('#app>.win.fx>.bar').getBoundingClientRect().height);
    assert.ok(bar <= 50, f + ': window title bar on one line (' + bar + ')');
    assert.ok(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth + 1), f + ': no sideways overflow');
  }
  // 속도계 위 정보: 접힘 → 상태 줄 누르면 펼침 → 다시 접힘
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(700);
  const metrics = () => p.evaluate(() => getComputedStyle(document.querySelector('#pfdHost .pfd-metrics')).display !== 'none');
  assert.equal(await metrics(), false, 'speed stats folded away on a narrow screen');
  await p.locator('#pfdHost .pfd-flight-meta [data-role="source"]').click(); await p.waitForTimeout(200);
  assert.equal(await metrics(), true, 'tap the status line to open them');
  await p.locator('#pfdHost .pfd-flight-meta [data-role="source"]').click(); await p.waitForTimeout(200);
  assert.equal(await metrics(), false);
  // 플레이어 버튼 6개 한 줄
  await p.locator('#ckRail button[data-f="vis"]').click(); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(() => new Set([...document.querySelectorAll('#wMain .transport>.tb')].filter(b => b.offsetParent).map(b => Math.round(b.getBoundingClientRect().top))).size), 1, 'player buttons in one row');
  // 라디오 즐겨찾기 한 줄에 4칸
  await p.locator('#ckRail button[data-f="radio"]').click(); await p.waitForTimeout(700);
  assert.equal(await p.evaluate(() => getComputedStyle(document.getElementById('rdPresets')).gridTemplateColumns.split(' ').length), 4);
  await p.close();
});
