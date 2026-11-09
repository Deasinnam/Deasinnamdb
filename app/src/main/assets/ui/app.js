(function () {
  "use strict";

  // ---------- 앱(Java)과 통신: {id, method, args} → {id, result} ----------
  let seq = 0;
  const waiting = new Map();
  let wired = null;
  function bridge() {
    const A = window.MeetingAndroid || null;
    if (A && wired !== A) {
      wired = A;
      A.onmessage = (ev) => {
        let m;
        try { m = JSON.parse(ev.data); } catch (_) { return; }
        if (m.push) { onPush(m.push, m.data); return; }
        const done = waiting.get(m.id);
        if (!done) return;
        waiting.delete(m.id);
        done(m.result == null ? { ok: false, error: "응답 없음" } : m.result);
      };
    }
    return A;
  }
  function call(method, ...args) {
    const A = bridge();
    if (!A) return Promise.resolve({ ok: false, error: "안드로이드 앱에서 실행해 주세요" });
    return new Promise((resolve) => {
      const id = ++seq;
      waiting.set(id, resolve);
      A.postMessage(JSON.stringify({ id, method, args }));
    });
  }
  function onPush(kind, data) {
    if (kind === "open") go("#m/" + data);
    if (kind === "refresh") { refreshList(); if (current.meeting) showMeeting(current.meeting, true); }
  }

  // ---------- 작은 도우미 ----------
  const $ = (id) => document.getElementById(id);
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v; // CSP: 인라인 style 속성 대신 CSSOM
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "html") continue; // 사용하지 않음 (본문은 항상 글자로만 넣음)
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
    return el;
  }
  let toastTimer = 0;
  function toast(t) {
    const el = $("toast");
    el.textContent = t;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  const pad = (n) => String(n).padStart(2, "0");
  function clock(ms) {
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600);
    return (hh ? hh + ":" : "") + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
  }
  function when(sec) { return clock(Math.round(sec * 1000)); }
  function dateText(ms) {
    const d = new Date(ms);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${"일월화수목금토"[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function dueText(s) {
    if (!s) return "";
    const d = new Date(s);
    if (isNaN(d)) return String(s);
    const hasTime = /T\d\d:\d\d/.test(s) && !/T00:00/.test(s);
    return `${d.getMonth() + 1}/${d.getDate()}(${"일월화수목금토"[d.getDay()]})` + (hasTime ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}` : "");
  }
  const COLORS = ["#2563eb", "#db2777", "#059669", "#d97706", "#7c3aed", "#0891b2", "#dc2626", "#65a30d"];
  function colorOf(label, all) {
    const i = Math.max(0, all.indexOf(label));
    return COLORS[i % COLORS.length];
  }
  function sheet(title, build) {
    const s = $("sheet");
    s.textContent = "";
    const panel = h("div", { class: "panel" }, h("h4", null, title));
    s.append(panel);
    s.hidden = false;
    const close = () => { s.hidden = true; s.textContent = ""; };
    s.onclick = (e) => { if (e.target === s) close(); };
    build(panel, close);
  }

  // ---------- 화면 전환 (#home, #m/<id>, #settings) ----------
  const current = { meeting: null, tab: "summary", data: null };
  function go(hash) { if (location.hash !== hash) location.hash = hash; else route(); }
  window.addEventListener("hashchange", route);
  function route() {
    const hsh = location.hash || "#home";
    const m = /^#m\/(.+)$/.exec(hsh);
    document.body.classList.toggle("detail", hsh !== "#home");
    $("main").hidden = hsh === "#home" && window.innerWidth < 760;
    if (m) showMeeting(decodeURIComponent(m[1]));
    else if (hsh === "#settings") showSettings();
    else { current.meeting = null; markSelected(); if (window.innerWidth >= 760) showWelcome(); }
  }
  $("btn-back").addEventListener("click", () => go("#home"));
  $("btn-settings").addEventListener("click", () => go("#settings"));

  function setMain(title, ...body) {
    $("main-title").textContent = title;
    $("btn-more").hidden = true;
    const b = $("main-body");
    b.textContent = "";
    b.append(...body);
    $("main").scrollTop = 0;
  }
  function showWelcome() {
    setMain("", h("div", { class: "state-box" },
      h("p", null, "왼쪽에서 회의를 고르거나, 새 회의를 녹음하세요."),
      h("p", { class: "small" }, "회의가 끝나면 요약, 화자별 발언, 나에게 요청된 일, 일정을 정리해 드립니다.")));
  }

  // ---------- 녹음 ----------
  let status = { state: "idle" };
  $("btn-record").addEventListener("click", async () => {
    const r = await call("startRecording", $("rec-title").value.trim());
    if (!r.ok) { toast(r.error || "녹음을 시작하지 못했습니다"); return; }
    $("rec-title").value = "";
    poll();
  });
  $("btn-stop").addEventListener("click", async () => {
    const r = await call("stopRecording");
    if (!r.ok) toast(r.error || "종료하지 못했습니다");
    poll();
  });
  $("btn-cancel").addEventListener("click", () => {
    sheet("녹음을 취소할까요?", (p, close) => {
      p.append(h("p", { class: "muted" }, "지금까지 녹음한 내용은 저장되지 않고 지워집니다."),
        h("div", { class: "row" },
          h("button", { class: "ghost", onclick: close }, "계속 녹음"),
          h("button", { class: "primary", onclick: async () => { close(); await call("cancelRecording"); poll(); } }, "녹음 취소")));
    });
  });

  async function poll() {
    const s = await call("status");
    if (s && s.ok !== false) status = s;
    const st = status.state || "idle";
    $("rec-idle").hidden = st !== "idle";
    $("rec-live").hidden = st !== "recording";
    $("rec-busy").hidden = st !== "processing";
    $("key-warning").hidden = st !== "idle" || !!status.hasKey;
    if (st === "recording") {
      $("rec-time").textContent = clock(status.elapsedMs || 0);
      $("rec-level").style.width = Math.min(100, Math.round((status.level || 0) * 140)) + "%";
      $("rec-name").textContent = status.title ? "녹음 중 · " + status.title : "녹음 중";
    }
    if (st === "processing") $("busy-step").textContent = status.step || "분석 중…";
    if (pollState !== st) { pollState = st; refreshList(); }
  }
  let pollState = null;
  setInterval(() => { if (!document.hidden) poll(); }, 700);

  // ---------- 회의 목록 ----------
  async function refreshList() {
    const r = await call("listMeetings");
    const ul = $("meetings");
    ul.textContent = "";
    const list = (r && r.meetings) || [];
    if (!list.length) { ul.append(h("li", { class: "empty" }, "아직 기록이 없습니다")); return; }
    for (const m of list) {
      const badge = m.state === "done" ? null
        : m.state === "error" ? h("span", { class: "badge err" }, "분석 실패")
        : m.state === "recording" ? h("span", { class: "badge err" }, "녹음 중")
        : h("span", { class: "badge" }, "분석 중");
      const li = h("li", { "data-id": m.id, onclick: () => go("#m/" + encodeURIComponent(m.id)) },
        h("div", { class: "t" }, m.title || "제목 없는 회의"),
        h("div", { class: "m" }, h("span", null, dateText(m.startedAt)), m.durationMs ? h("span", null, clock(m.durationMs)) : null,
          m.requestsToMe ? h("span", { class: "badge me" }, "나에게 " + m.requestsToMe) : null, badge),
        m.summary ? h("div", { class: "s" }, m.summary) : null);
      ul.append(li);
    }
    markSelected();
  }
  function markSelected() {
    for (const li of $("meetings").querySelectorAll("li[data-id]")) li.classList.toggle("sel", li.dataset.id === current.meeting);
  }

  // ---------- 회의 상세 ----------
  async function showMeeting(id, keepTab) {
    if (current.meeting !== id) { current.tab = "summary"; }
    current.meeting = id;
    markSelected();
    const r = await call("getMeeting", id);
    if (!r || !r.ok) { setMain("회의", h("div", { class: "state-box" }, (r && r.error) || "회의를 찾지 못했습니다")); return; }
    current.data = r;
    renderMeeting(r);
    void keepTab;
  }

  function nameOf(label) {
    const d = current.data;
    const names = (d && d.meta && d.meta.speakerNames) || {};
    return names[label] || label;
  }

  function renderMeeting(d) {
    const meta = d.meta || {};
    const a = d.analysis;
    const title = (a && a.title && !meta.titleSetByUser ? a.title : meta.title) || "제목 없는 회의";
    if (!a) {
      const box = h("div", { class: "state-box" });
      if (meta.state === "error") {
        box.append(h("p", { class: "danger" }, "분석하지 못했습니다"), h("p", { class: "small" }, meta.error || ""),
          h("button", { class: "primary", onclick: async () => { const x = await call("retry", meta.id); if (!x.ok) toast(x.error); poll(); } }, "다시 분석"));
      } else if (meta.state === "recording") {
        box.append(h("p", null, "녹음 중인 회의입니다."));
      } else {
        box.append(h("div", { class: "spinner" }), h("p", null, meta.step || "분석 중…"));
      }
      setMain(title, h("div", { class: "sec" }, h("div", { class: "muted small" }, dateText(meta.startedAt), " · ", clock(meta.durationMs || 0))), box);
      return;
    }
    const speakersAll = (d.transcript && d.transcript.speakers) || (a.speakers || []).map((s) => s.label);
    const tabs = [
      ["summary", "요약"],
      ["me", "나에게 요청", (a.requestsToMe || []).length],
      ["speakers", "화자별", speakersAll.length],
      ["schedule", "일정", (a.schedules || []).length],
      ["actions", "할 일", (a.actionItems || []).length],
      ["transcript", "전체 기록"],
    ];
    const tabBar = h("div", { class: "tabs" }, tabs.map(([k, label, n]) =>
      h("button", { class: current.tab === k ? "on" : null, onclick: () => { current.tab = k; renderMeeting(d); } }, label, n ? h("span", { class: "n" }, n) : null)));
    const body = h("div");
    const views = { summary: viewSummary, me: viewMe, speakers: viewSpeakers, schedule: viewSchedule, actions: viewActions, transcript: viewTranscript };
    views[current.tab](body, d, speakersAll);
    setMain(title, h("div", { class: "sec" }, h("div", { class: "muted small" }, dateText(meta.startedAt), " · ", clock(meta.durationMs || 0),
      meta.myLabel ? " · 나: " + nameOf(meta.myLabel) : "")), tabBar, body);
    const more = $("btn-more");
    more.hidden = false;
    more.onclick = () => meetingMenu(d);
  }

  function meetingMenu(d) {
    const id = d.meta.id;
    sheet("회의", (p, close) => {
      p.append(
        h("button", { class: "opt", onclick: async () => { close(); const r = await call("shareMeeting", id); if (!r.ok) toast(r.error); } }, "요약 공유하기"),
        h("button", { class: "opt", onclick: () => { close(); renameMeeting(d); } }, "회의 이름 바꾸기"),
        h("button", { class: "opt", onclick: async () => { close(); const r = await call("reanalyze", id); toast(r.ok ? "다시 분석합니다" : r.error); poll(); } }, "다시 분석하기 (화자 이름 반영)"),
        h("button", { class: "opt danger", onclick: () => { close(); confirmDelete(id); } }, "회의 삭제"));
    });
  }
  function renameMeeting(d) {
    sheet("회의 이름", (p, close) => {
      const inp = h("input", { type: "text", value: d.meta.title || (d.analysis && d.analysis.title) || "" });
      p.append(inp, h("button", { class: "primary", onclick: async () => { await call("renameMeeting", d.meta.id, inp.value.trim()); close(); refreshList(); showMeeting(d.meta.id); } }, "저장"));
    });
  }
  function confirmDelete(id) {
    sheet("회의를 삭제할까요?", (p, close) => {
      p.append(h("p", { class: "muted" }, "녹음, 기록, 분석이 모두 지워집니다. 캘린더에 넣은 일정은 그대로 둡니다."),
        h("div", { class: "row" }, h("button", { class: "ghost", onclick: close }, "취소"),
          h("button", { class: "primary", onclick: async () => { close(); await call("deleteMeeting", id); current.meeting = null; refreshList(); go("#home"); } }, "삭제")));
    });
  }

  function list(items) { return h("ul", { class: "plain" }, (items || []).map((x) => h("li", null, x))); }

  function viewSummary(el, d) {
    const a = d.analysis;
    el.append(h("div", { class: "sec" }, h("div", { class: "item summary" }, a.summary || "")));
    if ((a.keyPoints || []).length) el.append(h("div", { class: "sec" }, h("h3", null, "핵심 내용"), h("div", { class: "item" }, list(a.keyPoints))));
    if ((a.decisions || []).length) el.append(h("div", { class: "sec" }, h("h3", null, "결정된 것"), h("div", { class: "item" }, list(a.decisions))));
    if ((a.requestsToMe || []).length) {
      el.append(h("div", { class: "sec" }, h("h3", null, "나에게 요청된 일"), (a.requestsToMe || []).slice(0, 3).map(reqItem),
        a.requestsToMe.length > 3 ? h("button", { class: "secondary", onclick: () => { current.tab = "me"; renderMeeting(d); } }, "모두 보기") : null));
    }
    if ((a.openQuestions || []).length) el.append(h("div", { class: "sec" }, h("h3", null, "남은 질문"), h("div", { class: "item" }, list(a.openQuestions))));
  }

  function reqItem(r) {
    return h("div", { class: "item" },
      h("div", { class: "head" }, h("span", null, (r.from ? nameOf(r.from) : "누군가") + "의 요청"),
        r.due ? h("span", { class: "badge" }, "기한 " + dueText(r.due)) : null,
        r.priority === "high" ? h("span", { class: "prio-high" }, "중요") : null),
      h("div", { class: "body" }, r.request || ""),
      r.quote ? h("div", { class: "quote" }, "“" + r.quote + "”") : null);
  }

  function viewMe(el, d) {
    const a = d.analysis;
    const meta = d.meta;
    const sec = h("div", { class: "sec" });
    if (!meta.myLabel && !meta.myNameUsed) {
      sec.append(h("div", { class: "item" }, h("div", { class: "body" }, "회의에서 누가 나인지 알려 주시면 더 정확해집니다."),
        h("div", { class: "acts" }, h("button", { class: "secondary", onclick: () => { current.tab = "speakers"; renderMeeting(d); } }, "화자별 탭에서 '나' 고르기"))));
    }
    const reqs = a.requestsToMe || [];
    if (!reqs.length) sec.append(h("div", { class: "state-box" }, "이 회의에서 나에게 요청된 일은 없었습니다."));
    else sec.append(...reqs.map(reqItem));
    el.append(sec);
  }

  function viewSpeakers(el, d, all) {
    const a = d.analysis;
    const meta = d.meta;
    const byLabel = new Map((a.speakers || []).map((s) => [s.label, s]));
    const counts = {};
    for (const s of (d.transcript && d.transcript.segments) || []) counts[s.speaker] = (counts[s.speaker] || 0) + (s.end - s.start);
    const sec = h("div", { class: "sec" });
    for (const label of all) {
      const s = byLabel.get(label) || { label };
      const isMe = meta.myLabel === label;
      sec.append(h("div", { class: "item" },
        h("div", { class: "spk" },
          h("div", { class: "avatar", style: "background:" + colorOf(label, all) }, nameOf(label).slice(0, 1)),
          h("div", { style: "flex:1" },
            h("div", { style: "font-weight:600" }, nameOf(label), isMe ? h("span", { class: "badge me", style: "margin-left:6px" }, "나") : null,
              s.name && !meta.speakerNames?.[label] ? h("span", { class: "muted small" }, "  (추정: " + s.name + ")") : null),
            h("div", { class: "muted small" }, (s.role ? s.role + " · " : "") + "발언 " + clock(Math.round((counts[label] || 0) * 1000))))),
        s.summary ? h("div", { class: "body", style: "margin-top:8px" }, s.summary) : null,
        (s.points || []).length ? h("div", { style: "margin-top:6px" }, list(s.points)) : null,
        h("div", { class: "acts" },
          h("button", { class: "secondary", onclick: () => renameSpeaker(d, label, s.name) }, "이름 바꾸기"),
          isMe ? null : h("button", { class: "secondary", onclick: async () => { await call("setMe", meta.id, label); toast("'나'로 정했습니다. 다시 분석하면 요청 정리에 반영됩니다."); showMeeting(meta.id); } }, "이 화자가 나"))));
    }
    el.append(sec);
  }

  function renameSpeaker(d, label, guess) {
    sheet(label + " 이름", (p, close) => {
      const inp = h("input", { type: "text", value: (d.meta.speakerNames || {})[label] || guess || "", placeholder: "예: 김부장" });
      p.append(inp, h("button", { class: "primary", onclick: async () => {
        await call("renameSpeaker", d.meta.id, label, inp.value.trim()); close(); showMeeting(d.meta.id);
      } }, "저장"));
    });
  }

  function viewSchedule(el, d) {
    const a = d.analysis;
    const sec = h("div", { class: "sec" });
    const items = a.schedules || [];
    if (!items.length) sec.append(h("div", { class: "state-box" }, "회의에서 정해진 일정이 없습니다."));
    items.forEach((s, i) => {
      const ev = (d.meta.events || {})[i];
      sec.append(h("div", { class: "item" },
        h("div", { class: "head" }, h("span", null, s.allDay ? dueText(s.start) + " 종일" : dueText(s.start) + (s.end ? " ~ " + dueText(s.end).replace(/^.*\) /, "") : "")),
          s.location ? h("span", null, "· " + s.location) : null,
          typeof s.confidence === "number" && s.confidence < 0.7 ? h("span", { class: "badge err" }, "확인 필요") : null),
        h("div", { class: "body" }, s.title || "일정"),
        (s.attendees || []).length ? h("div", { class: "muted small" }, "참석: " + s.attendees.map(nameOf).join(", ")) : null,
        s.evidence ? h("div", { class: "quote" }, "“" + s.evidence + "”") : null,
        h("div", { class: "acts" },
          ev ? h("span", { class: "ev-ok" }, "✓ 캘린더에 등록됨") : null,
          ev ? h("button", { class: "secondary", onclick: () => call("openEvent", ev) }, "캘린더에서 보기") : null,
          ev ? h("button", { class: "secondary", onclick: async () => { const r = await call("removeEvent", d.meta.id, i); toast(r.ok ? "캘린더에서 뺐습니다" : r.error); showMeeting(d.meta.id); } }, "등록 취소")
            : h("button", { class: "primary", disabled: !s.start, onclick: async () => { const r = await call("addEvent", d.meta.id, i); toast(r.ok ? "캘린더에 넣었습니다" : r.error); showMeeting(d.meta.id); } }, "캘린더에 넣기"))));
    });
    el.append(sec);
  }

  function viewActions(el, d) {
    const a = d.analysis;
    const sec = h("div", { class: "sec" });
    const items = a.actionItems || [];
    if (!items.length) sec.append(h("div", { class: "state-box" }, "정해진 할 일이 없습니다."));
    for (const t of items) {
      sec.append(h("div", { class: "item" },
        h("div", { class: "head" }, h("span", null, t.owner ? nameOf(t.owner) : "담당 미정"), t.due ? h("span", { class: "badge" }, "기한 " + dueText(t.due)) : null),
        h("div", { class: "body" }, t.task || "")));
    }
    el.append(sec);
  }

  function viewTranscript(el, d, all) {
    const segs = (d.transcript && d.transcript.segments) || [];
    const sec = h("div", { class: "sec item" });
    if (!segs.length) sec.append(h("div", { class: "muted" }, "받아쓴 내용이 없습니다."));
    // 같은 화자가 이어 말한 부분은 한 덩어리로
    let last = null;
    for (const s of segs) {
      if (last && last.speaker === s.speaker && s.start - last.end < 4) {
        last.node.lastChild.append(" " + s.text);
        last.end = s.end;
        continue;
      }
      const node = h("div", { class: "seg" },
        h("div", { class: "who", style: "color:" + colorOf(s.speaker, all) }, nameOf(s.speaker), h("div", { class: "when" }, when(s.start))),
        h("div", { class: "txt" }, s.text));
      sec.append(node);
      last = { speaker: s.speaker, end: s.end, node };
    }
    el.append(sec);
  }

  // ---------- 설정 ----------
  async function showSettings() {
    current.meeting = null;
    markSelected();
    const s = await call("getSettings");
    if (!s || !s.ok) { setMain("설정", h("div", { class: "state-box" }, (s && s.error) || "설정을 불러오지 못했습니다")); return; }
    const key = h("input", { type: "password", placeholder: s.hasKey ? "저장됨 (" + s.keyHint + ") — 바꿀 때만 입력" : "sk-로 시작하는 키", autocomplete: "off" });
    const myName = h("input", { type: "text", value: s.myName || "", placeholder: "예: 이대신" });
    const cal = h("select", null, h("option", { value: "" }, s.calendars && s.calendars.length ? "캘린더를 고르세요" : "캘린더 권한이 필요합니다"),
      (s.calendars || []).map((c) => h("option", { value: String(c.id), selected: String(c.id) === String(s.calendarId) }, c.name + " (" + c.account + ")")));
    const auto = h("input", { type: "checkbox" });
    auto.checked = !!s.autoCalendar;
    const tModel = h("input", { type: "text", value: s.transcribeModel || "" });
    const aModel = h("input", { type: "text", value: s.analysisModel || "" });
    const base = h("input", { type: "text", value: s.baseUrl || "" });
    const voice = h("button", { class: "secondary", onclick: async () => {
      voice.disabled = true;
      voice.textContent = "녹음 중… 8초 동안 평소처럼 말해 주세요";
      const r = await call("recordVoiceSample");
      voice.disabled = false;
      voice.textContent = "내 목소리 다시 등록";
      toast(r.ok ? "내 목소리를 등록했습니다" : r.error || "등록하지 못했습니다");
    } }, s.voiceRegistered ? "내 목소리 다시 등록" : "내 목소리 등록 (8초)");

    setMain("설정",
      h("div", { class: "field" }, h("label", null, "OpenAI API 키"), key,
        h("div", { class: "hint" }, "기기 안에 암호화해 저장합니다. 녹음과 기록은 분석을 위해 OpenAI로 전송되며, 사용량만큼 요금이 나옵니다.")),
      h("div", { class: "field" }, h("label", null, "내 이름"), myName,
        h("div", { class: "hint" }, "회의에서 나를 부르는 이름(예: 이 과장, 대신 씨)을 찾아 '나에게 요청된 일'을 정리합니다.")),
      h("div", { class: "field" }, h("label", null, "내 목소리"), voice,
        h("div", { class: "hint" }, "등록하면 받아쓰기에서 내 발언에 내 이름이 붙습니다.")),
      h("div", { class: "field" }, h("label", null, "일정을 넣을 캘린더"), cal,
        h("div", { class: "hint" }, "구글 계정 캘린더를 고르면 구글 캘린더에 자동으로 동기화됩니다.")),
      h("div", { class: "field" }, h("label", { class: "switch" }, h("span", null, "분석이 끝나면 일정을 자동으로 등록"), auto),
        h("div", { class: "hint" }, "날짜와 시간이 분명한 일정만 넣고, 애매한 것은 '확인 필요'로 남겨 둡니다.")),
      h("details", { class: "adv" }, h("summary", null, "고급 설정"),
        h("div", { class: "field" }, h("label", null, "받아쓰기 모델 (화자 구분)"), tModel),
        h("div", { class: "field" }, h("label", null, "분석 모델"), aModel),
        h("div", { class: "field" }, h("label", null, "API 주소"), base)),
      h("div", { class: "field" }, h("button", { class: "primary", style: "width:100%", onclick: async () => {
        const r = await call("saveSettings", {
          apiKey: key.value.trim() || null, myName: myName.value.trim(), calendarId: cal.value || null, autoCalendar: auto.checked,
          transcribeModel: tModel.value.trim(), analysisModel: aModel.value.trim(), baseUrl: base.value.trim(),
        });
        toast(r.ok ? "저장했습니다" : r.error || "저장하지 못했습니다");
        if (r.ok) { poll(); showSettings(); }
      } }, "저장")));
    if (!s.calendars || !s.calendars.length) {
      $("main-body").append(h("div", { class: "field" }, h("button", { class: "secondary", style: "width:100%", onclick: async () => { await call("requestCalendarPermission"); showSettings(); } }, "캘린더 권한 허용")));
    }
  }

  // ---------- 시작 ----------
  window.addEventListener("resize", () => { if (window.innerWidth >= 760) $("main").hidden = false; });
  refreshList();
  poll();
  route();
})();
