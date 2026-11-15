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
};

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
  if (name === 'tools') renderTools();
  if (name === 'apps') renderApps();
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

window.goBack = () => {
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
  $('#gameGrid').querySelectorAll('.tile').forEach((t) => t.addEventListener('click', () => {
    if (!A.launch(t.dataset.pkg, true)) toast('게임을 열지 못했어요');
  }));
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
  $('#shizukuState').textContent = s.shizukuInstalled ? 'Shizuku가 설치되어 있어요. 다음 업데이트에서 연결합니다.' : 'Shizuku는 아직 설치되어 있지 않아요. 다음 업데이트에서 설치·켜기 안내를 드려요.';
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
  if ($('#tools').classList.contains('on')) renderTools();
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
