/* 덜누름 앱 공용: Shizuku 설정 방법(그림 안내) 열기 · 닫기. 각 앱의 화면에서 ShizukuGuide.open("tv") 처럼 부릅니다. */
(function () {
  var f = null, onClose = null;
  function close() { if (f) { f.remove(); f = null; if (onClose) onClose(); } }
  window.ShizukuGuide = {
    open: function (app, closed) {
      close(); onClose = closed || null;
      f = document.createElement("iframe");
      f.src = "../shizuku/guide.html?inapp&app=" + encodeURIComponent(app || "");
      f.title = "Shizuku 설정 방법";
      f.setAttribute("style", "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483000;background:#f6f7fb");
      document.body.appendChild(f);
      setTimeout(function () { try { f.focus(); } catch (e) {} }, 100);
    },
    close: close,
    isOpen: function () { return !!f; },
    scroll: function (dy) { if (f) f.contentWindow.postMessage({ shizukuGuide: "scroll", dy: dy }, "*"); }
  };
  window.addEventListener("message", function (e) { if (e.data && e.data.shizukuGuide === "close") close(); });
})();
