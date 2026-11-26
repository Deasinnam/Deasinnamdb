/* 덜누름 워크 ↔ DNR AI(Chat DNR Ai): 편집기에서 글 가져오기 · 결과 넣기. OfficeActivity가 필요할 때 넣어 실행 */
window.__dnrAi = window.__dnrAi || (function () {
  var saved = null; // {win, range, el}
  function wins(w, out) {
    out.push(w);
    var fr = [];
    try { fr = w.document.querySelectorAll("iframe"); } catch (e) {}
    for (var i = 0; i < fr.length; i++) { try { if (fr[i].contentWindow && fr[i].contentWindow.document) wins(fr[i].contentWindow, out); } catch (e) {} }
    return out;
  }
  function editableOf(node) {
    var el = node && (node.nodeType === 1 ? node : node.parentNode);
    while (el && el.nodeType === 1) {
      if (el.isContentEditable) return el;
      el = el.parentNode;
    }
    return null;
  }
  function textOf(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value || "";
    return el.innerText || "";
  }
  /** 선택한 글(없으면 문서 글)과 넣을 자리를 기억 */
  function capture() {
    saved = null;
    var ws = wins(window, []), sel = "", best = null, bestLen = 0;
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i], d = w.document, s = null;
      try { s = w.getSelection(); } catch (e) {}
      var ae = d.activeElement;
      if (ae && (ae.tagName === "TEXTAREA" || (ae.tagName === "INPUT" && /^(text|search|)$/.test(ae.type || ""))) && typeof ae.selectionStart === "number") {
        var t = ae.value.slice(ae.selectionStart, ae.selectionEnd);
        if (!saved || t) saved = { win: w, el: ae, start: ae.selectionStart, end: ae.selectionEnd };
        if (t.trim()) { sel = t; break; }
      }
      if (s && s.rangeCount > 0) {
        var r = s.getRangeAt(0), ed = editableOf(r.startContainer);
        var txt = String(s);
        if (ed) { if (!saved || txt) saved = { win: w, range: r.cloneRange(), el: ed }; }
        if (txt.trim() && ed) { sel = txt; break; }
        if (txt.trim() && !sel) sel = txt;
      }
      // 문서 글: 편집 영역 가운데 글이 가장 많은 곳
      var cands = d.querySelectorAll(".ProseMirror, .cm-content, [contenteditable='true'], textarea");
      for (var k = 0; k < cands.length; k++) {
        var n = textOf(cands[k]).length;
        if (n > bestLen) { bestLen = n; best = cands[k]; }
      }
    }
    var all = sel ? "" : textOf(best);
    return JSON.stringify({ sel: sel, all: all.slice(0, 20000), title: document.title || "", canInsert: !!saved });
  }
  /** AI 결과 넣기: 기억한 자리(선택 부분은 바꾸고, 커서면 그 자리에). 못 넣으면 "copy" */
  function insert(html, plain) {
    var s = saved;
    if (!s) return "copy";
    try {
      var w = s.win, d = w.document;
      if (s.el && (s.el.tagName === "TEXTAREA" || s.el.tagName === "INPUT")) {
        s.el.focus();
        s.el.setRangeText(plain, s.start, s.end, "end");
        s.el.dispatchEvent(new w.Event("input", { bubbles: true }));
        return "ok";
      }
      if (s.range && s.el) {
        s.el.focus();
        var sel = w.getSelection();
        sel.removeAllRanges(); sel.addRange(s.range);
        // 붙여 넣기와 같은 길로: 편집기가 제목 · 목록 · 표를 제 문서 구조로 바꿈
        try {
          var dt = new w.DataTransfer();
          if (html) dt.setData("text/html", html);
          dt.setData("text/plain", plain);
          var ev = new w.ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true });
          s.el.dispatchEvent(ev);
          if (ev.defaultPrevented) { saved = null; return "ok"; }
        } catch (e) {}
        if (d.execCommand("insertText", false, plain)) { saved = null; return "ok"; }
      }
    } catch (e) {}
    return "copy";
  }
  return { capture: capture, insert: insert };
})();
