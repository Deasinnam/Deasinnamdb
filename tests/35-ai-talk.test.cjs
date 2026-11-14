const {run, assert} = require('./lib/harness.cjs');

// 1.64 아래 버튼 줄 [AI]: 앱 고르기, 대화 중이면 스피드미터 위 AI 아일랜드(듣는 중·말하는 중·답 한 줄)
run('AI voice talk button and speedometer island', async ({newPage, origin}) => {
  const p = await newPage(() => { localStorage.setItem('dna_skin2', JSON.stringify('carnival7')); });
  await p.setViewportSize({width: 900, height: 1000});
  await p.goto(origin); await p.waitForFunction(() => window.AmpAiTalk);
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(800);
  const btn = p.locator('#ckRail button[data-ai]');
  assert.equal(await btn.locator('em').textContent(), '고르기');
  await btn.click(); await p.waitForTimeout(200);
  assert.equal(await p.locator('#aiPick').isVisible(), true, 'first tap asks which AI app');
  await p.locator('#aiPick button[data-app="claude"]').click(); await p.waitForTimeout(200);
  assert.equal(await btn.locator('em').textContent(), 'Claude');
  assert.equal(await p.evaluate(() => JSON.parse(localStorage.getItem('dna_aiApp'))), 'claude');
  assert.equal(await p.locator('#aiPick').isVisible(), false);

  const isl = p.locator('#pfdHost .ai-isl');
  await p.evaluate(() => { window.__ai = {on: true, pkg: 'com.anthropic.claude', ongoing: true, rec: true, voice: false, notif: true, text: ''}; AmpAiTalk.render(); });
  await p.waitForTimeout(400);
  assert.equal(await isl.evaluate(e => e.classList.contains('show')), true, 'island shows during a talk');
  assert.equal(await isl.locator('.ai-n').textContent(), 'CLAUDE');
  assert.equal(await isl.locator('.ai-s').textContent(), '듣는 중');
  await p.evaluate(() => { window.__ai = {on: true, pkg: 'com.anthropic.claude', ongoing: true, rec: false, voice: true, notif: true, text: '다음 휴게소는 12km 앞 안성휴게소예요.'}; AmpAiTalk.render(); });
  await p.waitForTimeout(400);
  assert.equal(await isl.locator('.ai-s').textContent(), '말하는 중');
  assert.match(await isl.locator('.ai-t').textContent(), /안성휴게소/);
  assert.equal(await isl.evaluate(e => e.classList.contains('txt')), true);
  // 1.66 실제 소리 크기가 들어오면 그걸로: 소리가 나면 말하는 중, 조용하면 듣는 중(통화 모드처럼 둘 다 켜져 있어도)
  await p.evaluate(() => { window.__ai = {on: true, pkg: 'com.openai.chatgpt', ongoing: true, rec: true, voice: true, notif: true, text: '응답이 진행 중입니다.'}; window.__aiLevel = 0.3; AmpAiTalk.render(); });
  await p.waitForTimeout(500);
  assert.equal(await isl.locator('.ai-s').textContent(), '말하는 중');
  assert.match(await isl.locator('.ai-t').textContent(), /안성휴게소/, 'status text like 응답이 진행 중 is not shown as the answer');
  await p.evaluate(() => { window.__aiLevel = 0; AmpAiTalk.render(); }); await p.waitForTimeout(900);
  await p.evaluate(() => AmpAiTalk.render()); await p.waitForTimeout(100);
  assert.equal(await isl.locator('.ai-s').textContent(), '듣는 중');
  // 1.65 NOW PLAYING 시각화 화면도 대화 효과로 바뀜
  await p.locator('#ckRail button[data-f="vis"]').click(); await p.waitForTimeout(800);
  const n0 = await p.evaluate(() => window.__aiVisN || 0); await p.waitForTimeout(600);
  assert.ok(await p.evaluate(() => window.__aiVisN || 0) > n0, 'visualizer draws the AI talk scene');
  await p.locator('#ckRail button[data-f="gps"]').click(); await p.waitForTimeout(600);
  // 대화가 끝나면 잠시 뒤 사라짐
  await p.evaluate(() => { window.__ai = {on: false}; window.__aiOffTest = 1; });
  await p.evaluate(() => { delete window.__ai; AmpAiTalk.render(); });
  await p.waitForTimeout(3800);
  assert.equal(await isl.evaluate(e => e.classList.contains('show')), false, 'island hides after the talk ends');
  await p.close();
});
