const {run, assert} = require('./lib/harness.cjs');

// 1.75 주간·야간은 하늘 하나로: 계기판 설정 창의 칸 = 하늘 고르기, 어느 쪽에서 바꿔도 같이 바뀜(계기 테마는 늘 자동)
run('Day/night unified with the sky picker', async ({newPage, origin}) => {
  const p = await newPage(() => { window.__build = 'special'; localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); localStorage.setItem('dna_pfdSet', JSON.stringify({theme: 'day'})); });
  await p.setViewportSize({width: 840, height: 900}); await p.goto(origin); await p.waitForFunction(() => window.AmpSpecialSky);
  assert.equal(await p.evaluate(() => AmpPfd.theme), 'auto', 'old pinned day is released');
  const opts = await p.evaluate(() => [...pfd.els.theme.options].map(o => o.value).join(','));
  assert.equal(opts, 'auto,dawn,noon,gold,set,night', 'dialog lists the skies');
  assert.match(await p.evaluate(() => pfd.els.theme.closest('label').textContent), /하늘/);
  // 앱 스위치(주간·야간) → 하늘
  await p.evaluate(() => AmpPfd.setTheme('night'));
  assert.equal(await p.evaluate(() => AmpSpecialSky.mode), 'night'); assert.equal(await p.evaluate(() => pfd.day), false);
  assert.equal(await p.evaluate(() => AmpPfd.theme), 'auto');
  // 설정 창은 지금 하늘을 보여 주고, 거기서 고르면 하늘이 바뀜
  await p.evaluate(() => pfd.openSettings());
  assert.equal(await p.evaluate(() => pfd.els.theme.value), 'night');
  await p.evaluate(() => { pfd.els.theme.value = 'noon'; pfd.els.form.requestSubmit(); }); await p.waitForTimeout(100);
  assert.equal(await p.evaluate(() => AmpSpecialSky.mode), 'noon', 'dialog picks the sky'); assert.equal(await p.evaluate(() => pfd.day), true);
  assert.equal(await p.evaluate(() => AmpPfd.theme), 'auto');
  // 하늘 자동 → 설정 창도 자동
  await p.evaluate(() => AmpSpecialSky.set('auto'));
  await p.evaluate(() => pfd.openSettings());
  assert.equal(await p.evaluate(() => pfd.els.theme.value), 'auto', 'dialog follows sky auto');
  await p.close();
});
