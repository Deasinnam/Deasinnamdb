const {run, assert} = require('./lib/harness.cjs');

// 1.23 콕핏 스페셜 조종 패널: 와이파이 → 주행 녹화, 블루투스 → 미디어 음소거, 간편 모드 → 주간·야간
run('Cockpit special deck switches', async ({context, origin, errors}) => {
  const p = await context.newPage();
  p.on('pageerror', e => errors.push('deck: ' + e.message));
  await p.addInitScript(() => {
    window.__rec = []; window.__bri = [];
    window.AndroidBridge = {recOpen: n => { __rec.push('open:' + n); return true; }, recWrite: b => { __rec.push('w:' + b.length); return true; }, recClose: () => { __rec.push('close'); return '동영상/DaesinnamOne/test.webm'; },
      setScreenBrightness: v => __bri.push(v)};
    navigator.mediaDevices.getUserMedia = async () => { const c = document.createElement('canvas'); c.width = 320; c.height = 180; const g = c.getContext('2d');
      setInterval(() => { g.fillStyle = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'); g.fillRect(0, 0, 320, 180); }, 50); return c.captureStream(20); };
    if (!sessionStorage.getItem('dk')) { sessionStorage.setItem('dk', '1'); localStorage.clear(); localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); localStorage.setItem('dna_pfdSet', JSON.stringify({theme: 'day'})); /* 1.60: 시험 시각이 밤이어도 계기 야간 20%가 끼어들지 않게 */ }
  });
  await p.setViewportSize({width: 1036, height: 1300});
  await p.goto(origin);
  await p.waitForTimeout(800);
  for (const id of ['dkWifiSwitch', 'dkBtSwitch', 'dkModeSwitch']) assert.equal(await p.locator('#' + id).isVisible(), false, id + ' replaced');
  for (const id of ['dkRecSwitch', 'dkMuteSwitch', 'dkDaySwitch']) assert.equal(await p.locator('#' + id).isVisible(), true, id + ' shown');
  // 녹화: 올리면 REC + 시간, 내리면 저장 후 종료
  assert.equal(await p.locator('#dkRecReadout').textContent(), 'STANDBY');
  await p.locator('#dkRecSwitch').click();
  await p.waitForFunction(() => /^REC \d\d:\d\d:\d\d$/.test(document.getElementById('dkRecReadout').textContent), null, {timeout: 5000});
  assert.equal(await p.locator('#recBadge').isVisible(), true, 'REC badge on screen');
  await p.waitForTimeout(2600);
  assert.match(await p.locator('#dkRecReadout').textContent(), /^REC 00:00:0[1-9]$/, 'Recording time runs');
  await p.locator('#dkRecSwitch').click();
  await p.waitForFunction(() => __rec.includes('close'), null, {timeout: 5000});
  const log = await p.evaluate(() => __rec);
  assert.match(log[0], /^open:D1_\d{8}_\d{6}\.webm$/);
  assert.ok(log.some(x => /^w:\d+$/.test(x) && +x.slice(2) > 0), 'Video data written');
  assert.equal(await p.locator('#dkRecReadout').textContent(), 'STANDBY');
  assert.equal(await p.locator('#recBadge').isVisible(), false);
  assert.equal(await p.locator('#dkRecSwitch').getAttribute('aria-checked'), 'false');
  // 음소거
  await p.locator('#dkMuteSwitch').click();
  await p.waitForTimeout(100);
  assert.equal(await p.locator('#dkMuteReadout').textContent(), 'MUTED');
  assert.equal(await p.locator('#dkVolumeValue').textContent(), '0');
  await p.locator('#dkMuteSwitch').click();
  await p.waitForTimeout(100);
  assert.equal(await p.locator('#dkMuteReadout').textContent(), 'SOUND ON');
  assert.notEqual(await p.locator('#dkVolumeValue').textContent(), '0');
  // 주간·야간
  const bri0 = await p.evaluate(() => __bri.length);
  await p.locator('#dkDaySwitch').click();
  assert.equal(await p.locator('#dkDayReadout').textContent(), 'NIGHT');
  // 스위치를 누른 순간 50%로 맞춤(그 뒤 1초마다 도는 계기 야간 규칙이 20%로 낮출 수 있어 마지막 값이 아니라 누른 뒤 기록을 봄)
  assert.ok(await p.evaluate(n => __bri.slice(n).includes(50), bri0), 'Night brightness 50%');
  assert.equal(await p.evaluate(() => window.AmpPfd && window.AmpPfd.theme), 'night', 'Night runway');
  await p.locator('#dkDaySwitch').click();
  assert.equal(await p.locator('#dkDayReadout').textContent(), 'DAY');
  assert.equal(await p.evaluate(() => __bri[__bri.length - 1]), 100, 'Day brightness 100%');
  assert.equal(await p.evaluate(() => window.AmpPfd.theme), 'day');
  // 다른 스킨은 원래 스위치
  await p.evaluate(() => { const s = document.getElementById('skin'); s.value = 'carnival5'; s.dispatchEvent(new Event('change')); });
  await p.waitForTimeout(200);
  assert.equal(await p.locator('#dkWifiSwitch').isVisible(), true);
  assert.equal(await p.locator('#dkRecSwitch').isVisible(), false);
  await p.close();
});
