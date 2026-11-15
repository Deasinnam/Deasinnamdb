// 덜누름 게임 화면. 기기 기능은 Android(Bridge)가 맡습니다. 브라우저에서 열면 견본 데이터로 보입니다.
'use strict';

const $ = (s) => document.querySelector(s);
const SELFTEST = location.search.includes('selftest=1');

const A = window.Android || {
  games: () => JSON.stringify([{ pkg: 'demo.game', label: '견본 게임', icon: '', auto: true }]),
  allApps: () => JSON.stringify([{ pkg: 'demo.game', label: '견본 게임', icon: '', game: true }, { pkg: 'demo.app', label: '견본 앱', icon: '', game: false }]),
  setGame: () => {},
  gameApps: () => JSON.stringify([
    { pkg: 'com.droiddeck.launcher', label: 'DroidDeck', desc: '스팀 · 배틀넷 · 에픽 · GOG 등 PC 게임을 폰에서', url: '#', installed: false },
    { pkg: 'com.limelight', label: 'Moonlight', desc: '집 PC 게임을 폰으로 스트리밍', url: '#', installed: true, icon: '' }]),
  launch: () => true, openUrl: () => {}, startRecording: () => {}, stopRecording: () => {},
  isRecording: () => false, lastSaved: () => '', openRecordings: () => {},
  status: () => JSON.stringify({ dndAccess: false, dnd: false, hz: 120, modes: [60, 120], recording: false, shizukuInstalled: false, samsungGame: false, version: '0.1' }),
  setDnd: () => {}, openSamsungGame: () => {}, log: (m) => console.log(m),
  optimize: (pkg) => JSON.stringify({
    device: { model: '갤럭시 Z 폴드7', code: 'SM-F966N', soc: 'QTI SM8750', ramGb: 12, cores: 8, maxHz: 120, thermal: 0, batteryTemp: 31.5, battery: 80, charging: false, powerSave: false },
    recommend: { level: 2, why: ['기기 성능 기준: 고성능'], settings: { fps: 120, scale: 1, mode: 'performance', recSide: 1920, recFps: 60 } },
    chosen: demoLevels[pkg || ''] ?? -1, perGame: pkg ? (pkg in demoLevels) : false,
    levels: [{ name: '가볍게', fps: 60, scale: 0.7, mode: 'battery', recSide: 1280, recFps: 30 }, { name: '균형', fps: 60, scale: 0.85, mode: 'standard', recSide: 1920, recFps: 30 }, { name: '고성능', fps: 120, scale: 1, mode: 'performance', recSide: 1920, recFps: 60 }] }),
  chooseLevel: (pkg, lv) => { if (lv === -2) delete demoLevels[pkg]; else demoLevels[pkg || ''] = lv; },
};
var demoLevels = {};

const parse = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const log = (m) => { try { A.log(String(m)); } catch (e) { /* 없음 */ } };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

function icon(o) {
  return o.icon ? `<img src="${o.icon}" alt="">` : `<span class="ph">${esc((o.label || '?').slice(0, 1))}</span>`;
}

// ---------- 탭 ----------
function showTab(name) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === name));
  if (name === 'tools') { renderTools(); renderOptimize(); }
  if (name === 'apps') renderApps();
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

window.goBack = () => {
  if (!$('#gameSheet').hidden) { closeGameSheet(); return true; }
  if (!$('#picker').hidden) { closePicker(); return true; }
  if (!$('#games').classList.contains('on')) { showTab('games'); return true; }
  return false;
};

// ---------- 게임 ----------
function renderGames() {
  const games = parse(A.games(), []);
  games.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
  $('#gameGrid').innerHTML = games.map((g) =>
    `<button class="tile" data-pkg="${esc(g.pkg)}">${g.icon ? `<img src="${g.icon}" alt="">` : '<span class="ph" style="width:64px;height:64px;margin:auto"></span>'}<b>${esc(g.label)}</b></button>`).join('');
  $('#gameEmpty').hidden = games.length > 0;
  $('#gameGrid').querySelectorAll('.tile').forEach((t) => {
    let timer = 0; let long = false;
    const label = t.querySelector('b').textContent;
    t.addEventListener('pointerdown', () => { long = false; timer = setTimeout(() => { long = true; openGameSheet(t.dataset.pkg, label); }, 550); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((e) => t.addEventListener(e, () => clearTimeout(timer)));
    t.addEventListener('contextmenu', (e) => e.preventDefault());
    t.addEventListener('click', () => {
      if (long) return;
      if (!A.launch(t.dataset.pkg, true)) toast('게임을 열지 못했어요');
    });
  });
  return games.length;
}

function openPicker() {
  const apps = parse(A.allApps(), []);
  const games = new Set(parse(A.games(), []).map((g) => g.pkg));
  apps.sort((a, b) => (games.has(b.pkg) - games.has(a.pkg)) || a.label.localeCompare(b.label, 'ko'));
  $('#pickList').innerHTML = apps.map((a) => {
    const on = games.has(a.pkg);
    return `<div class="item">${icon(a)}<div class="txt"><b>${esc(a.label)}</b><span>${a.game ? '게임으로 등록된 앱' : ''}</span></div>` +
      `<button class="ghost toggle ${on ? 'on' : ''}" data-pkg="${esc(a.pkg)}">${on ? '보임' : '추가'}</button></div>`;
  }).join('');
  $('#pickList').querySelectorAll('.toggle').forEach((b) => b.addEventListener('click', () => {
    const on = !b.classList.contains('on');
    A.setGame(b.dataset.pkg, on);
    b.classList.toggle('on', on);
    b.textContent = on ? '보임' : '추가';
  }));
  $('#picker').hidden = false;
}
function closePicker() { $('#picker').hidden = true; renderGames(); }
$('#addGame').addEventListener('click', openPicker);
$('#pickClose').addEventListener('click', closePicker);

// ---------- 게임 앱 ----------
function renderApps() {
  const apps = parse(A.gameApps(), []);
  $('#appList').innerHTML = apps.map((a) =>
    `<div class="item">${icon(a)}<div class="txt"><b>${esc(a.label)}</b><span>${esc(a.desc)}</span></div>` +
    (a.installed
      ? `<button class="primary" data-open="${esc(a.pkg)}">열기</button>`
      : `<button class="ghost" data-url="${esc(a.url)}">받으러 가기</button>`) + '</div>').join('');
  $('#appList').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
    if (!A.launch(b.dataset.open, false)) toast('앱을 열지 못했어요');
  }));
  $('#appList').querySelectorAll('[data-url]').forEach((b) => b.addEventListener('click', () => A.openUrl(b.dataset.url)));
  return apps;
}

// ---------- 기기 맞춤 최적화 ----------
const MODE_KO = { performance: '성능 우선', standard: '표준', battery: '배터리 절약' };
const THERMAL_KO = ['정상', '조금 따뜻함', '따뜻함', '뜨거움', '매우 뜨거움', '위험', '꺼짐 직전'];

function settingsHtml(st, pending) {
  const p = pending ? ' <span class="pend">고급 기능 연결 후 적용</span>' : '';
  return `<dl><dt>FPS 상한</dt><dd>${st.fps}${p}</dd>` +
    `<dt>게임 해상도</dt><dd>${Math.round(st.scale * 100)}%${p}</dd>` +
    `<dt>게임 모드</dt><dd>${MODE_KO[st.mode] || st.mode}${p}</dd>` +
    `<dt>녹화 화질</dt><dd>${st.recSide === 1920 ? '1080p' : '720p'} · ${st.recFps}프레임</dd></dl>`;
}

// pkg가 ''이면 기본 설정, 아니면 그 게임만
function renderLevels(box, detail, pkg) {
  const o = parse(A.optimize(pkg), {});
  if (!o.levels) return o;
  const rec = o.recommend;
  const base = pkg ? parse(A.optimize(''), {}).chosen : -1;
  const btns = [{ lv: -1, name: '자동 추천', small: rec.settings ? `지금은 ${o.levels[rec.level].name}` : '' }]
    .concat(o.levels.map((l, i) => ({ lv: i, name: l.name, small: `${l.fps}fps · ${Math.round(l.scale * 100)}%` })));
  let current = o.chosen;
  if (pkg && !o.perGame) current = 'base';
  const extra = pkg ? `<button data-lv="-2" class="${current === 'base' ? 'on' : ''}">기본 따르기<small>${base < 0 ? '자동 추천' : o.levels[base].name}</small></button>` : '';
  box.innerHTML = extra + btns.map((b) => `<button data-lv="${b.lv}" class="${current === b.lv ? 'on' : ''}">${b.name}<small>${b.small}</small></button>`).join('');
  const eff = current === 'base' ? (base < 0 ? rec.level : base) : (current < 0 ? rec.level : current);
  const why = (current === -1 || (current === 'base' && base < 0)) ? `<ul>${rec.why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : '';
  detail.innerHTML = `<b>${o.levels[eff].name}</b> 설정${settingsHtml(o.levels[eff], true)}${why}`;
  box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    A.chooseLevel(pkg, Number(b.dataset.lv));
    renderLevels(box, detail, pkg);
  }));
  return o;
}

function renderOptimize() {
  const o = renderLevels($('#levelBtns'), $('#recBox'), '');
  const d = o.device || {};
  $('#devInfo').textContent = d.model
    ? `${d.model} · ${d.soc} · 메모리 ${d.ramGb}GB · 최대 ${d.maxHz}Hz · 온도 ${THERMAL_KO[d.thermal] || '?'}${d.batteryTemp ? ` (배터리 ${d.batteryTemp}°C)` : ''}`
    : '';
  return o;
}

let sheetPkg = '';
function openGameSheet(pkg, label) {
  sheetPkg = pkg;
  $('#gsTitle').textContent = `${label} 설정`;
  renderLevels($('#gsLevels'), $('#gsBox'), pkg);
  $('#gameSheet').hidden = false;
}
function closeGameSheet() { $('#gameSheet').hidden = true; }
$('#gsClose').addEventListener('click', closeGameSheet);
$('#gsPlay').addEventListener('click', () => { closeGameSheet(); if (!A.launch(sheetPkg, true)) toast('게임을 열지 못했어요'); });
$('#gsHide').addEventListener('click', () => { A.setGame(sheetPkg, false); closeGameSheet(); renderGames(); });

// ---------- 도구 ----------
function renderTools() {
  const s = parse(A.status(), {});
  const rec = A.isRecording();
  $('#recBtn').textContent = rec ? '녹화 멈추기' : '녹화 시작';
  $('#recBtn').className = rec ? 'rec' : 'primary';
  const last = A.lastSaved();
  $('#recState').textContent = rec ? '녹화 중이에요. 알림의 "녹화 멈추기"로도 멈출 수 있어요.' : (last ? `마지막 녹화: ${last}` : '');
  $('#optDnd').checked = !!s.dnd;
  $('#dndState').textContent = s.dnd && !s.dndAccess ? '설정에서 "덜누름 게임"의 방해 금지 접근을 허용해 주세요.' : '';
  $('#samsungRow').hidden = !s.samsungGame;
  $('#hzNow').textContent = s.hz ? `지금 ${s.hz}Hz` : '—';
  $('#hzModes').textContent = s.modes && s.modes.length ? `이 화면이 지원하는 주사율: ${s.modes.join(' · ')}Hz` : '';
  $('#shizukuState').textContent = s.shizukuInstalled ? '필요한 도우미 앱(Shizuku)이 이미 설치되어 있어요. 다음 업데이트에서 연결합니다.' : '도우미 앱(Shizuku)을 한 번 설치하면 쓸 수 있어요. 다음 업데이트에서 차례대로 안내해 드려요.';
  $('#ver').textContent = s.version || '';
  return s;
}

$('#recBtn').addEventListener('click', () => {
  if (A.isRecording()) { A.stopRecording(); setTimeout(renderTools, 800); } else { A.startRecording($('#recMic').checked); }
});
$('#recOpen').addEventListener('click', () => A.openRecordings());
$('#optDnd').addEventListener('change', (e) => { A.setDnd(e.target.checked); setTimeout(renderTools, 300); });
$('#samsungBtn').addEventListener('click', () => A.openSamsungGame());

window.onResumeApp = () => {
  if ($('#tools').classList.contains('on')) { renderTools(); renderOptimize(); }
  if ($('#games').classList.contains('on') && $('#picker').hidden) renderGames();
};
window.onNative = (type, msg) => { if (type === 'toast') toast(msg); };
setInterval(() => { if ($('#tools').classList.contains('on')) renderTools(); }, 1500);

// ---------- 시작 ----------
const gameCount = renderGames();

// ---------- 자동 점검 (에뮬레이터) ----------
if (SELFTEST) {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  (async () => {
    log(`GAMES ${gameCount}`);
    await wait(1500);
    log('SHOT-GAMES');
    await wait(2500);
    openPicker();
    log(`PICKER ${$('#pickList').children.length}`);
    await wait(1200);
    log('SHOT-PICKER');
    await wait(2500);
    closePicker();
    showTab('apps');
    const apps = renderApps();
    log(`APPS ${apps.length} installed ${apps.filter((a) => a.installed).length}`);
    await wait(1200);
    log('SHOT-APPS');
    await wait(2500);
    showTab('tools');
    const s = renderTools();
    log(`TOOLS hz ${s.hz} modes ${(s.modes || []).join(',')}`);
    const op = renderOptimize();
    log(`OPTIMIZE ${op.device ? op.device.model + ' / ' + op.device.soc + ' / ' + op.device.ramGb + 'GB' : 'none'} level ${op.recommend ? op.recommend.level : '?'}`);
    await wait(1200);
    log('SHOT-TOOLS');
    await wait(2500);
    // 녹화: 시작 → 5초 → 멈춤 → 저장 확인
    A.startRecording(false);
    let started = false;
    for (let i = 0; i < 20 && !started; i++) { await wait(500); started = A.isRecording(); }
    log(`REC ${started ? 'started' : 'not-started'}`);
    if (started) {
      await wait(1000);
      log('SHOT-REC');
      await wait(4500);
      A.stopRecording();
      await wait(2500);
      log(`REC saved ${A.lastSaved() || 'none'}`);
    }
    showTab('games');
    await wait(500);
    A.launch('com.android.settings', false);
    await wait(3000);
    log('DONE');
  })();
}
