// 덜누름 게임 화면. 기기 기능은 Android(Bridge)가 맡습니다. 브라우저에서 열면 견본 데이터로 보입니다.
// 터치·마우스와 함께 게임패드·방향키로도 움직입니다 (A 선택 · B 뒤로 · Y 설정 · L1/R1 탭 바꾸기).
'use strict';

const $ = (s) => document.querySelector(s);
const SELFTEST = location.search.includes('selftest=1');
var demoLevels = {};

const A = window.Android || {
  pcGuide: () => JSON.stringify(demoPc), openDevSettings: () => toast('(견본) 설정이 열려요'), fixChildProcess: () => { demoPc.child = 'off'; return 'ok'; },
  games: () => JSON.stringify([
    { pkg: 'demo.rpg', label: '견본 RPG', icon: '', auto: true },
    { pkg: 'demo.race', label: '견본 레이싱', icon: '', auto: true },
    { pkg: 'demo.puzzle', label: '견본 퍼즐', icon: '', auto: true }]),
  allApps: () => JSON.stringify([{ pkg: 'demo.rpg', label: '견본 RPG', icon: '', game: true }, { pkg: 'demo.app', label: '견본 앱', icon: '', game: false }]),
  setGame: () => {},
  gameApps: () => JSON.stringify([
    { pkg: 'com.droiddeck.launcher', label: 'DroidDeck', desc: '스팀 · 배틀넷 · 에픽 · GOG 등 PC 게임을 폰에서', url: '#', installed: false },
    { pkg: 'com.limelight', label: 'Moonlight', desc: '집 PC 게임을 폰으로 스트리밍', url: '#', installed: true, icon: '' },
    { pkg: 'com.valvesoftware.steamlink', label: 'Steam Link', desc: '스팀 PC 게임 원격 플레이', url: '#', installed: false }]),
  launch: () => true, openUrl: () => {}, startRecording: () => {}, stopRecording: () => {},
  isRecording: () => false, lastSaved: () => '', openRecordings: () => {},
  status: () => JSON.stringify({ dndAccess: false, dnd: false, hz: 120, modes: [60, 120], recording: false, shizukuInstalled: true, shizukuRunning: true, shizukuGranted: false, fpsMode: demoFps.mode, applyAdv: demoFps.adv, overlay: false, fpsRunning: false, fps: -1, samsungGame: true, version: '0.2' }),
  setFpsMode: (m) => { demoFps.mode = m; }, setApplyAdv: (on) => { demoFps.adv = on; }, shizukuConnect: () => toast('(견본) Shizuku 연결'),
  fpsPreview: () => toast('(견본) FPS 표시'), fpsStop: () => {}, fpsSelfTest: () => '60 0 demo',
  setDnd: () => {}, openSamsungGame: () => {}, log: (m) => console.log(m),
  optimize: (pkg) => JSON.stringify({
    device: { model: '갤럭시 Z 폴드7', code: 'SM-F966N', soc: 'QTI SM8750', ramGb: 12, cores: 8, maxHz: 120, thermal: 0, batteryTemp: 31.5, battery: 80, charging: false, powerSave: false },
    recommend: { level: 2, why: ['기기 성능 기준: 고성능'], settings: { fps: 120, scale: 1, mode: 'performance', recSide: 1920, recFps: 60 } },
    chosen: demoLevels[pkg || ''] ?? -1, perGame: pkg ? (pkg in demoLevels) : false,
    levels: [{ name: '가볍게', fps: 60, scale: 0.7, mode: 'battery', recSide: 1280, recFps: 30 }, { name: '균형', fps: 60, scale: 0.85, mode: 'standard', recSide: 1920, recFps: 30 }, { name: '고성능', fps: 120, scale: 1, mode: 'performance', recSide: 1920, recFps: 60 }] }),
  chooseLevel: (pkg, lv) => { if (lv === -2) delete demoLevels[pkg]; else demoLevels[pkg || ''] = lv; },
  keymap: (pkg) => JSON.stringify({ service: false, connected: false, on: !!demoKm[pkg], count: demoKm[pkg] ? 3 : 0 }),
  keymapSetOn: (pkg, on) => { demoKm[pkg] = on; }, keymapClear: () => {}, keymapSet: () => {}, keymapSettings: () => toast('(견본) 접근성 설정이 열려요'),
};
var demoKm = {};
var demoPc = { droiddeck: true, devOn: true, child: 'unknown', shizukuGranted: false, added: false, sdk: 35 };
var demoFps = { mode: 'off', adv: true };

const parse = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const log = (m) => { try { A.log(String(m)); } catch (e) { /* 없음 */ } };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 없음 */ } },
};

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

const iconImg = (o, cls = '') => (o.icon ? `<img src="${o.icon}" alt="" class="${cls}">` : `<span class="ph ${cls}">${esc((o.label || '?').slice(0, 1))}</span>`);
const artStyle = (o) => (o.icon ? ` style="--img:url('${o.icon}')"` : '');

// ---------- 최근 플레이 ----------
function markPlayed(pkg) {
  const r = store.get('recent', {});
  r[pkg] = Date.now();
  store.set('recent', r);
}
function byRecent(list) {
  const r = store.get('recent', {});
  return list.slice().sort((a, b) => ((r[b.pkg] || 0) - (r[a.pkg] || 0)) || a.label.localeCompare(b.label, 'ko'));
}
function play(pkg, optimize = true) {
  if (A.launch(pkg, optimize)) { markPlayed(pkg); return true; }
  toast('열지 못했어요');
  return false;
}

// ---------- 탭 ----------
const TABS = ['home', 'games', 'apps', 'tools'];
let tab = 'home';
function showTab(name) {
  tab = name;
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
  document.querySelectorAll('.pane').forEach((p) => p.classList.toggle('on', p.id === name));
  if (name === 'home') renderHome();
  if (name === 'games') renderGames();
  if (name === 'tools') { renderTools(); renderOptimize(); }
  if (name === 'apps') renderApps();
  window.scrollTo(0, 0);
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

window.goBack = () => {
  if (!$('#pcGuide').hidden) { closeGuide(); return true; }
  if (!$('#gameSheet').hidden) { closeGameSheet(); return true; }
  if (!$('#picker').hidden) { closePicker(); return true; }
  if (tab !== 'home') { showTab('home'); focusFirst(); return true; }
  return false;
};

// ---------- 홈 ----------
let heroGame = null;
function setHero(g) {
  heroGame = g;
  const r = store.get('recent', {});
  $('#heroTitle').textContent = g ? g.label : '게임을 추가해 보세요';
  $('#heroKind').textContent = g ? (r[g.pkg] ? '최근 플레이' : '라이브러리') : '시작하기';
  $('#heroSub').textContent = g
    ? (r[g.pkg] ? `마지막 플레이 ${new Date(r[g.pkg]).toLocaleDateString('ko-KR')}` : '아직 플레이하지 않은 게임')
    : '라이브러리에서 "+ 게임 추가"로 게임을 넣을 수 있어요.';
  const img = $('#heroIcon');
  if (g && g.icon) img.src = g.icon; else img.removeAttribute('src');
  $('#heroBg').style.backgroundImage = g && g.icon ? `url('${g.icon}')` : '';
  $('#heroPlay').textContent = g ? '▶ 플레이' : '+ 게임 추가';
  $('#heroSet').hidden = !g;
}
$('#heroPlay').addEventListener('click', () => { if (heroGame) play(heroGame.pkg); else { showTab('games'); openPicker(); } });
$('#heroSet').addEventListener('click', () => heroGame && openGameSheet(heroGame.pkg, heroGame.label));

function renderHome() {
  const games = byRecent(parse(A.games(), []));
  setHero(games[0] || null);
  $('#recentShelf').innerHTML = games.length
    ? games.map((g) => `<button class="cap" data-f data-pkg="${esc(g.pkg)}"><div class="art"${artStyle(g)}>${iconImg(g)}</div><b>${esc(g.label)}</b></button>`).join('')
    : '<div class="empty-cap">아직 게임이 없어요</div>';
  bindGameCards($('#recentShelf'), games);
  const apps = parse(A.gameApps(), []).sort((a, b) => b.installed - a.installed);
  $('#appShelf').innerHTML = apps.map((a) =>
    `<button class="cap ${a.installed ? '' : 'off'}" data-f data-app="${esc(a.pkg)}" data-url="${esc(a.url)}" data-in="${a.installed ? 1 : 0}"><div class="art"${artStyle(a)}>${iconImg(a)}</div><b>${esc(a.label)}</b><small>${a.installed ? '열기' : '받으러 가기'}</small></button>`).join('');
  $('#appShelf').querySelectorAll('.cap').forEach((c) => c.addEventListener('click', () => {
    if (c.dataset.in === '1') play(c.dataset.app, false); else A.openUrl(c.dataset.url);
  }));
  renderQuick();
  return games.length;
}

function renderQuick() {
  const s = parse(A.status(), {});
  const rec = A.isRecording();
  $('#qRec').classList.toggle('on', rec);
  $('#qRec').querySelector('span').textContent = rec ? '녹화 멈추기' : '녹화 시작';
  $('#qDnd').classList.toggle('on', !!s.dnd);
  $('#qDndTxt').textContent = s.dnd ? '방해 금지 켬' : '방해 금지 끔';
  const o = parse(A.optimize(''), {});
  if (o.levels) {
    const lv = o.chosen < 0 ? o.recommend.level : o.chosen;
    $('#qOptTxt').textContent = `최적화: ${o.chosen < 0 ? '자동 · ' : ''}${o.levels[lv].name}`;
  }
  $('#recDot').hidden = !rec;
}
$('#qRec').addEventListener('click', () => { if (A.isRecording()) { A.stopRecording(); setTimeout(renderQuick, 800); } else A.startRecording(false); });
$('#qOpt').addEventListener('click', () => { showTab('tools'); setTimeout(() => { const b = $('#levelBtns button.on') || $('#levelBtns button'); if (b) b.focus(); }, 50); });
$('#qDnd').addEventListener('click', () => { const s = parse(A.status(), {}); A.setDnd(!s.dnd); setTimeout(renderQuick, 300); });
$('#qVids').addEventListener('click', () => A.openRecordings());

// 게임 카드: 누르면 시작, 길게 누르거나 Y면 설정, 포커스되면 홈 큰 화면에 표시
function bindGameCards(root, games) {
  const map = {};
  games.forEach((g) => { map[g.pkg] = g; });
  root.querySelectorAll('[data-pkg]').forEach((t) => {
    let timer = 0; let long = false;
    const g = map[t.dataset.pkg];
    t.addEventListener('pointerdown', () => { long = false; timer = setTimeout(() => { long = true; openGameSheet(g.pkg, g.label); }, 550); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((e) => t.addEventListener(e, () => clearTimeout(timer)));
    t.addEventListener('contextmenu', (e) => e.preventDefault());
    t.addEventListener('click', () => { if (!long) play(g.pkg); });
    t.onFocusHook = () => { if (tab === 'home') setHero(g); };
    t.addEventListener('focus', t.onFocusHook);
    t.optionsAction = () => openGameSheet(g.pkg, g.label);
  });
}

// ---------- 라이브러리 ----------
function renderGames() {
  const games = parse(A.games(), []);
  games.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
  $('#gameGrid').innerHTML = games.map((g) =>
    `<button class="tile" data-f data-pkg="${esc(g.pkg)}"><div class="art"${artStyle(g)}>${iconImg(g)}</div><b>${esc(g.label)}</b></button>`).join('');
  $('#gameEmpty').hidden = games.length > 0;
  bindGameCards($('#gameGrid'), games);
  return games.length;
}

function openPicker() {
  const apps = parse(A.allApps(), []);
  const games = new Set(parse(A.games(), []).map((g) => g.pkg));
  apps.sort((a, b) => (games.has(b.pkg) - games.has(a.pkg)) || a.label.localeCompare(b.label, 'ko'));
  $('#pickList').innerHTML = apps.map((a) => {
    const on = games.has(a.pkg);
    return `<div class="item">${iconImg(a)}<div class="txt"><b>${esc(a.label)}</b><span>${a.game ? '게임으로 등록된 앱' : ''}</span></div>` +
      `<button class="ghost toggle ${on ? 'on' : ''}" data-f data-pkg="${esc(a.pkg)}">${on ? '보임' : '추가'}</button></div>`;
  }).join('');
  $('#pickList').querySelectorAll('.toggle').forEach((b) => b.addEventListener('click', () => {
    const on = !b.classList.contains('on');
    A.setGame(b.dataset.pkg, on);
    b.classList.toggle('on', on);
    b.textContent = on ? '보임' : '추가';
  }));
  $('#picker').hidden = false;
  focusFirst($('#picker'));
}
function closePicker() { $('#picker').hidden = true; renderGames(); focusFirst(); }
$('#addGame').addEventListener('click', openPicker);
$('#pickClose').addEventListener('click', closePicker);

// ---------- 게임 앱 ----------
function renderApps() {
  const apps = parse(A.gameApps(), []);
  $('#appList').innerHTML = apps.map((a) =>
    `<div class="item">${iconImg(a)}<div class="txt"><b>${esc(a.label)}</b><span>${esc(a.desc)}</span></div>` +
    (a.installed
      ? `<button class="primary" data-f data-open="${esc(a.pkg)}">열기</button>`
      : `<button class="ghost" data-f data-url="${esc(a.url)}">받으러 가기</button>`) +
    (a.pkg === DD ? '<button class="ghost" data-f data-guide>사용법</button>' : '') + '</div>').join('');
  $('#appList').querySelectorAll('[data-guide]').forEach((b) => b.addEventListener('click', openGuide));
  $('#appList').querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
    // DroidDeck을 처음 열 때는 안내를 먼저 한 번 보여 줌 (스팀이 꺼지지 않게 하는 설정 때문)
    if (b.dataset.open === DD && !localStorage.getItem('pcGuideSeen') && !SELFTEST) { openGuide(); return; }
    play(b.dataset.open, false);
  }));
  renderPcEntry();
  $('#appList').querySelectorAll('[data-url]').forEach((b) => b.addEventListener('click', () => A.openUrl(b.dataset.url)));
  return apps;
}

// ---------- PC 게임(DroidDeck) 시작 안내 ----------
const DD = 'com.droiddeck.launcher';
const GUIDE_WEB = 'https://deolnureum.com/updates/#post-game-pc';
function pcState() { return parse(A.pcGuide(), {}); }
function renderPcEntry() {
  const s = pcState();
  const left = [!s.droiddeck, !s.devOn, s.child !== 'off'].filter(Boolean).length;
  $('#pcEntrySub').textContent = !s.droiddeck ? 'DroidDeck 설치부터 게임 실행까지 차례대로 안내해요'
    : left ? '준비가 조금 남았어요 · 눌러서 이어서 하기' : '준비 끝 · 스팀 · 배틀넷 로그인과 게임 실행 방법 보기';
}
function guideStep(done, now, title, body, buttons, badge) {
  const pill = badge || (done ? '<span class="pill ok">완료</span>' : '');
  return `<li class="${done ? 'done' : ''} ${now ? 'now' : ''}"><h3>${title}${pill}</h3>${body}` +
    (buttons ? `<div class="row">${buttons}</div>` : '') + '</li>';
}
function renderGuide() {
  const s = pcState();
  const ddOk = !!s.droiddeck;
  const childOk = s.child === 'off';
  const first = !ddOk ? 1 : !s.devOn && !childOk ? 3 : !childOk ? 4 : 5;
  const childBadge = childOk ? '<span class="pill ok">완료</span>'
    : s.child === 'unknown' ? '<span class="pill">직접 확인</span>' : '<span class="pill warn">꺼져 있음</span>';
  const steps = [
    guideStep(ddOk, first === 1, 'DroidDeck 설치',
      '<p>스팀 · 배틀넷 PC 게임을 폰에서 돌려 주는 앱이에요. 공식 배포 페이지(GitHub)에서 맨 위 최신 버전의 <b>.apk</b>를 받아 설치하세요.</p>',
      ddOk ? '' : '<button class="primary" data-f data-act="get">받으러 가기</button>'),
    guideStep(false, first === 2, 'DroidDeck 한 번 열기',
      '<p>DroidDeck을 열고 <b>파일(저장 공간) 접근 권한</b>을 허용한 뒤 덜누름 게임으로 돌아오세요. 스팀은 아직 실행하지 않아도 돼요.</p>',
      ddOk ? '<button class="ghost" data-f data-act="open">DroidDeck 열기</button>' : ''),
    guideStep(!!s.devOn, first === 3, '개발자 옵션 켜기',
      '<p>설정에서 <b>빌드번호</b>를 7번 연달아 누르면 "개발자 모드를 켰습니다"가 뜨고, 설정 맨 아래에 <b>개발자 옵션</b>이 생겨요.</p>' +
      '<span class="path">설정 › 휴대전화 정보 › 소프트웨어 정보 › 빌드번호</span>',
      s.devOn ? '' : '<button class="primary" data-f data-act="dev">휴대전화 정보 열기</button>'),
    guideStep(childOk, first === 4, '자식 프로세스 제한 중지 켜기',
      '<p>스팀은 뒤에서 여러 프로그램을 함께 돌려요. 이 스위치를 켜야 스팀이 중간에 꺼지지 않아요. 개발자 옵션에서 아래로 내려 <b>자식 프로세스 제한 중지</b>를 찾아 <b>켜세요</b>.</p>' +
      '<span class="path">설정 › 개발자 옵션 › 자식 프로세스 제한 중지</span>' +
      (s.child === 'unknown' ? '<p style="margin-top:8px">이 기기에서는 켜졌는지 앱이 알 수 없어요. 개발자 옵션에서 스위치가 켜져 있는지 직접 확인해 주세요.</p>' : '') +
      '<p style="margin-top:8px">이 항목이 없는 기기는 DroidDeck에서 <b>Steam 실행</b>을 누를 때 나오는 안내(무선 디버깅 페어링)를 따르면 돼요.</p>',
      (childOk ? '' : '<button class="primary" data-f data-act="dev">개발자 옵션 열기</button>') +
      (!childOk && s.shizukuGranted ? '<button class="ghost" data-f data-act="fix">고급 기능으로 바로 켜기</button>' : ''),
      childBadge),
    guideStep(false, first === 5, '스팀 로그인 · 게임 설치',
      '<p>DroidDeck 아래 메뉴 <b>Steam</b> › <b>▶ Steam 실행</b>. 처음엔 실행 환경(1GB 안팎)을 받으니 와이파이에서 기다려 주세요. 스팀 아이디 · 비밀번호로 로그인하거나 <b>스팀 모바일 앱으로 QR 코드</b>를 찍으면 돼요. 로그인 후 게임을 골라 <b>설치</b>하세요.</p>' +
      '<span class="path">DroidDeck › Steam › ▶ Steam 실행</span>',
      ddOk ? '<button class="ghost" data-f data-act="open">DroidDeck 열기</button>' : ''),
    guideStep(false, false, '배틀넷 로그인 · 게임 설치',
      '<p>DroidDeck 아래 메뉴 <b>스토어</b> › 위쪽 줄 맨 끝 <b>Battle.net</b> › <b>로그인</b>. 처음 한 번은 "데스크톱 준비 중"으로 몇 분 걸려요. 로그인 창에서 글자는 왼쪽 아래 <b>⌨</b> 단추로 입력하세요. 로그인 후 게임을 골라 설치하고, 진행은 스토어 위 <b>⤓</b>에서 봐요.</p>' +
      '<span class="path">DroidDeck › 스토어 › Battle.net › 로그인</span>', ''),
    guideStep(!!s.added, false, '게임 실행',
      '<p>DroidDeck 아래 메뉴 <b>라이브러리</b>에 설치한 게임이 모여요. 덜누름 게임 라이브러리에 DroidDeck을 넣어 두면, 홈에서 <b>▶ 플레이</b>로 기기 맞춤 최적화와 함께 바로 열 수 있어요. 게임 중엔 홈 › 빠른 도구에서 녹화 · 방해 금지를 쓰세요.</p>',
      (ddOk && !s.added ? '<button class="primary" data-f data-act="add">라이브러리에 DroidDeck 넣기</button>' : '') +
      (ddOk ? '<button class="ghost" data-f data-act="play">▶ DroidDeck 실행</button>' : '')),
  ];
  $('#pgSteps').innerHTML = steps.join('');
  $('#pgSteps').querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => guideAct(b.dataset.act)));
  return s;
}
function guideAct(act) {
  if (act === 'get') A.openUrl('https://github.com/Droid-Deck/DroidDeck/releases/latest');
  if (act === 'open') { localStorage.setItem('pcGuideSeen', '1'); A.launch(DD, false); }
  if (act === 'play') { localStorage.setItem('pcGuideSeen', '1'); play(DD, true); }
  if (act === 'dev') A.openDevSettings();
  if (act === 'fix') {
    const r = A.fixChildProcess();
    toast(r === 'ok' ? '자식 프로세스 제한 중지를 켰어요' : r === 'noshizuku' ? '고급 기능(Shizuku)을 먼저 연결해 주세요' : '켜지 못했어요. 개발자 옵션에서 직접 켜 주세요');
    renderGuide(); focusFirst($('#pcGuide'));
  }
  if (act === 'add') { A.setGame(DD, true); toast('라이브러리에 DroidDeck을 넣었어요'); renderGuide(); focusFirst($('#pcGuide')); }
}
function openGuide() {
  renderGuide();
  $('#pcGuide').hidden = false;
  const now = $('#pgSteps li.now [data-f]');
  if (now) focusEl(now); else focusFirst($('#pcGuide'));
}
function closeGuide() {
  localStorage.setItem('pcGuideSeen', '1');
  $('#pcGuide').hidden = true;
  if (tab === 'apps') renderApps();
  focusFirst();
}
$('#pcEntry').addEventListener('click', openGuide);
$('#pgClose').addEventListener('click', closeGuide);
$('#pgWeb').addEventListener('click', () => A.openUrl(GUIDE_WEB));

// ---------- 기기 맞춤 최적화 ----------
const MODE_KO = { performance: '성능 우선', standard: '표준', battery: '배터리 절약' };
const THERMAL_KO = ['정상', '조금 따뜻함', '따뜻함', '뜨거움', '매우 뜨거움', '위험', '꺼짐 직전'];

// 고급 기능이 연결돼 있고 '실제 적용'을 켜 두었으면 FPS 상한·해상도·게임 모드가 바로 적용됨
function advReady() { const s = parse(A.status(), {}); return !!(s.shizukuGranted && s.applyAdv); }
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
  const btns = [{ lv: -1, name: '자동 추천', small: `지금은 ${o.levels[rec.level].name}` }]
    .concat(o.levels.map((l, i) => ({ lv: i, name: l.name, small: `${l.fps}fps · ${Math.round(l.scale * 100)}%` })));
  let current = o.chosen;
  if (pkg && !o.perGame) current = 'base';
  const extra = pkg ? `<button data-f data-lv="-2" class="${current === 'base' ? 'on' : ''}">기본 따르기<small>${base < 0 ? '자동 추천' : o.levels[base].name}</small></button>` : '';
  box.innerHTML = extra + btns.map((b) => `<button data-f data-lv="${b.lv}" class="${current === b.lv ? 'on' : ''}">${b.name}<small>${b.small}</small></button>`).join('');
  const eff = current === 'base' ? (base < 0 ? rec.level : base) : (current < 0 ? rec.level : current);
  const why = (current === -1 || (current === 'base' && base < 0)) ? `<ul>${rec.why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : '';
  detail.innerHTML = `<b>${o.levels[eff].name}</b> 설정${settingsHtml(o.levels[eff], !advReady())}${why}`;
  box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    const lv = b.dataset.lv;
    A.chooseLevel(pkg, Number(lv));
    renderLevels(box, detail, pkg);
    const again = box.querySelector(`[data-lv="${lv}"]`);
    if (again) again.focus();
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
  renderSheetKeymap();
  $('#gameSheet').hidden = false;
  focusFirst($('#gameSheet'));
}
function renderSheetKeymap() {
  const k = parse(A.keymap(sheetPkg), {});
  $('#gsKm').checked = !!k.on;
  $('#gsKmInfo').textContent = !k.service ? '먼저 도구 › 키 매핑 권한을 켜 주세요' : (k.count ? `키 ${k.count}개 배치됨` : '게임 화면의 🎮로 배치');
  $('#gsKmRow').hidden = !k.count;
}
$('#gsKm').addEventListener('change', (e) => { A.keymapSetOn(sheetPkg, e.target.checked); renderSheetKeymap(); });
$('#gsKmClear').addEventListener('click', () => { A.keymapClear(sheetPkg); renderSheetKeymap(); toast('키 배치를 지웠어요'); });
function closeGameSheet() { $('#gameSheet').hidden = true; focusFirst(); }
$('#gsClose').addEventListener('click', closeGameSheet);
$('#gsPlay').addEventListener('click', () => { closeGameSheet(); play(sheetPkg); });
$('#gsHide').addEventListener('click', () => { A.setGame(sheetPkg, false); closeGameSheet(); showTab(tab); });

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
  renderFps(s);
  $('#ver').textContent = s.version || '';
  const k = parse(A.keymap(''), {});
  $('#kmState').textContent = k.service ? '켜짐' : '꺼짐';
  $('#kmState').classList.toggle('ok', !!k.service);
  $('#kmSettings').textContent = k.service ? '키 매핑 권한 설정 열기' : '키 매핑 권한 켜기';
  $('#recDot').hidden = !rec;
  return s;
}

$('#recBtn').addEventListener('click', () => {
  if (A.isRecording()) { A.stopRecording(); setTimeout(renderTools, 800); } else { A.startRecording($('#recMic').checked); }
});
$('#recOpen').addEventListener('click', () => A.openRecordings());
$('#optDnd').addEventListener('change', (e) => { A.setDnd(e.target.checked); setTimeout(renderTools, 300); });
$('#samsungBtn').addEventListener('click', () => A.openSamsungGame());
$('#kmSettings').addEventListener('click', () => A.keymapSettings());

// ---------- FPS 보기 ----------
function pill(el, ok, yes, no) { el.textContent = ok ? yes : no; el.classList.toggle('ok', !!ok); }
function renderFps(st) {
  const s = st || parse(A.status(), {});
  const mode = s.fpsMode || 'off';
  document.querySelectorAll('#fpsModes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  $('#fpsDeol').hidden = mode !== 'deolnureum';
  $('#fpsSam').hidden = mode !== 'samsung';
  pill($('#szInst'), s.shizukuInstalled, '설치됨', '없음');
  pill($('#szRun'), s.shizukuRunning, '켜짐', '꺼짐');
  pill($('#szOk'), s.shizukuGranted, '허용됨', '아직');
  $('#szBtn').textContent = !s.shizukuInstalled ? 'Shizuku 받으러 가기' : !s.shizukuRunning ? 'Shizuku 열어서 시작' : !s.shizukuGranted ? '덜누름 게임 허용하기' : '연결됨 ✓';
  $('#szBtn').className = s.shizukuGranted ? 'ghost' : 'primary';
  $('#applyAdv').checked = !!s.applyAdv;
  $('#fpsTry').textContent = s.fpsRunning ? 'FPS 표시 끄기' : '지금 FPS 표시 켜기';
  $('#fpsInfo').textContent = s.fpsRunning
    ? `표시 중 · 지금 ${s.fps >= 0 ? s.fps + ' FPS' : 'FPS 읽는 중'}`
    : (s.shizukuGranted ? '준비됐어요. 게임을 시작하면 FPS 창이 떠요.' : 'Shizuku가 연결되기 전에는 온도·배터리만 보이고 FPS는 "--"로 나와요.');
  $('#samInfo').textContent = s.samsungGame ? '' : '이 기기에서 삼성 게임 런처를 찾지 못했어요. 삼성 기기가 아니면 "덜누름 표시"를 써 주세요.';
  $('#samBtn').hidden = !s.samsungGame;
  return s;
}
document.querySelectorAll('#fpsModes button').forEach((b) => b.addEventListener('click', () => {
  A.setFpsMode(b.dataset.mode);
  renderFps();
  renderOptimize();
  b.focus();
}));
$('#szBtn').addEventListener('click', () => A.shizukuConnect());
$('#fpsTry').addEventListener('click', () => { const s = parse(A.status(), {}); if (s.fpsRunning) A.fpsStop(); else A.fpsPreview(); setTimeout(renderFps, 600); });
$('#applyAdv').addEventListener('change', (e) => { A.setApplyAdv(e.target.checked); renderOptimize(); });
$('#samBtn').addEventListener('click', () => A.openSamsungGame());

// ---------- 위 줄: 시계·배터리 ----------
function renderStatus() {
  $('#clock').textContent = new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  const d = parse(A.optimize(''), {}).device || {};
  $('#bat').textContent = d.battery >= 0 ? `${d.charging ? '⚡' : '🔋'} ${d.battery}%` : '';
  $('#recDot').hidden = !A.isRecording();
}
setInterval(renderStatus, 30000);

window.onResumeApp = () => {
  renderStatus();
  if (!$('#pcGuide').hidden) { renderGuide(); return; }
  if (tab === 'tools') { renderTools(); renderOptimize(); }
  else if ($('#picker').hidden && $('#gameSheet').hidden) showTab(tab);
};
window.onNative = (type, msg) => {
  if (type === 'toast') toast(msg);
  if (type === 'refresh' && tab === 'tools') { renderTools(); renderOptimize(); }
};
setInterval(() => { if (tab === 'tools') renderTools(); else if (tab === 'home') renderQuick(); }, 1500);

// ---------- 패드·방향키로 움직이기 ----------
function layer() {
  if (!$('#pcGuide').hidden) return $('#pcGuide');
  if (!$('#gameSheet').hidden) return $('#gameSheet');
  if (!$('#picker').hidden) return $('#picker');
  return document;
}
function focusables(root) {
  return Array.from(root.querySelectorAll('[data-f]')).filter((el) => el.offsetParent !== null && !el.disabled);
}
function focusFirst(root) {
  const r = root || layer();
  const list = focusables(r === document ? $('#' + tab) : r);
  if (list.length) focusEl(list[0]);
}
function focusEl(el) {
  el.focus();
  if (el.onFocusHook) el.onFocusHook();
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
}
function move(dir) {
  const list = focusables(layer());
  const cur = document.activeElement;
  if (!cur || !list.includes(cur)) { focusFirst(); return; }
  const a = cur.getBoundingClientRect();
  const ax = a.left + a.width / 2; const ay = a.top + a.height / 2;
  let best = null; let bestScore = Infinity;
  list.forEach((el) => {
    if (el === cur) return;
    const b = el.getBoundingClientRect();
    const bx = b.left + b.width / 2; const by = b.top + b.height / 2;
    const dx = bx - ax; const dy = by - ay;
    let main; let side;
    const sameRow = b.top < a.bottom - 4 && b.bottom > a.top + 4;
    if (dir === 'left') { if (dx >= -2 || !sameRow) return; main = -dx; side = Math.abs(dy); }
    if (dir === 'right') { if (dx <= 2 || !sameRow) return; main = dx; side = Math.abs(dy); }
    if (dir === 'up') { if (dy >= -2) return; main = -dy; side = Math.abs(dx); }
    if (dir === 'down') { if (dy <= 2) return; main = dy; side = Math.abs(dx); }
    const score = main + side * 2.5;
    if (score < bestScore) { bestScore = score; best = el; }
  });
  if (best) focusEl(best);
}
function nextTab(step) {
  const i = (TABS.indexOf(tab) + step + TABS.length) % TABS.length;
  showTab(TABS[i]);
  focusFirst();
}
// 안드로이드가 패드 버튼을 이 이름으로 넘겨 줍니다 (MainActivity.dispatchKeyEvent)
window.onPad = (k) => {
  document.body.classList.add('pad');
  if (k === 'up' || k === 'down' || k === 'left' || k === 'right') { move(k); return true; }
  if (k === 'a') { const el = document.activeElement; if (el && el !== document.body) el.click(); else focusFirst(); return true; }
  if (k === 'b') { if (!window.goBack()) return false; return true; }
  if (k === 'y') { const el = document.activeElement; if (el && el.optionsAction) el.optionsAction(); return true; }
  if (k === 'l1') { nextTab(-1); return true; }
  if (k === 'r1') { nextTab(1); return true; }
  return false;
};
// 키보드(DeX·블루투스 키보드)도 같은 방식으로
document.addEventListener('keydown', (e) => {
  const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Escape: 'b', q: 'l1', e: 'r1', y: 'y' };
  const k = map[e.key];
  if (k && window.onPad(k)) e.preventDefault();
});
document.addEventListener('pointerdown', () => document.body.classList.remove('pad'), true);
document.querySelectorAll('.hint-b').forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.pad;
  if (k === 'b') { if (!window.goBack()) toast('홈이에요'); } else window.onPad(k);
}));

// ---------- 시작 ----------
renderStatus();
renderHome();
const gameCount = renderGames();

// ---------- 자동 점검 (에뮬레이터) ----------
if (SELFTEST) {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  (async () => {
    log(`GAMES ${gameCount}`);
    log(`HOME shelves recent ${$('#recentShelf').querySelectorAll('.cap').length} apps ${$('#appShelf').querySelectorAll('.cap').length}`);
    // 패드로 움직여 보기: 아래 → 오른쪽
    focusFirst(); window.onPad('down'); window.onPad('right');
    log(`PAD focus ${document.activeElement ? (document.activeElement.textContent || '').trim().slice(0, 20) : 'none'}`);
    await wait(1500);
    log('SHOT-HOME');
    await wait(2500);
    showTab('games');
    await wait(800);
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
    openGuide();
    const pg = pcState();
    log(`PCGUIDE steps ${$('#pgSteps').children.length} dd ${pg.droiddeck} dev ${pg.devOn} child ${pg.child} added ${pg.added}`);
    await wait(1200);
    log('SHOT-GUIDE');
    await wait(2500);
    closeGuide();
    showTab('tools');
    const s = renderTools();
    log(`TOOLS hz ${s.hz} modes ${(s.modes || []).join(',')}`);
    const op = renderOptimize();
    log(`OPTIMIZE ${op.device ? op.device.model + ' / ' + op.device.soc + ' / ' + op.device.ramGb + 'GB' : 'none'} level ${op.recommend ? op.recommend.level : '?'}`);
    await wait(1200);
    log('SHOT-TOOLS');
    await wait(2500);
    // FPS 보기: 세 방식 바꿔 보기 → 덜누름 표시 창 띄우기 (에뮬레이터엔 Shizuku가 없어 FPS는 "--")
    log(`FPS meter ${A.fpsSelfTest()}`);
    for (const m of ['samsung', 'deolnureum']) {
      $(`#fpsModes [data-mode="${m}"]`).click();
      const st = parse(A.status(), {});
      log(`FPSMODE-UI ${st.fpsMode} deol ${!$('#fpsDeol').hidden} sam ${!$('#fpsSam').hidden} shizuku ${st.shizukuInstalled}/${st.shizukuRunning}/${st.shizukuGranted}`);
    }
    $('#fpsCard').scrollIntoView({ block: 'start' });
    A.fpsPreview();
    let shown = false;
    for (let i = 0; i < 10 && !shown; i++) { await wait(400); shown = !!parse(A.status(), {}).fpsRunning; }
    renderFps();
    log(`FPS-PREVIEW ${shown ? 'shown' : 'not-shown'}`);
    await wait(1500);
    log('SHOT-FPS');
    await wait(2500);
    A.fpsStop();
    $('#fpsModes [data-mode="off"]').click();
    await wait(500);
    window.scrollTo(0, 0);
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
    const km = parse(A.keymap(''), {});
    log(`KEYMAP service ${km.service} connected ${km.connected}`);
    // 설정 앱에 A 버튼 → 화면 가운데 톡 을 넣어 두고, 점검 스크립트가 A 버튼을 눌러 봄
    A.keymapSet('com.android.settings', JSON.stringify({ 96: { x: 0.5, y: 0.5, mode: 'tap' } }));
    showTab('home');
    await wait(500);
    A.launch('com.android.settings', false);
    await wait(3000);
    log('DONE');
  })();
}
