/* 덜누름 데스크 — 배경 층. 앱이 setLook("wp-2", "") 또는 setLook("wp-custom", 'url("…")') 로 부릅니다. */
window.setLook = function (cls, image) {
  document.body.className = /^wp-(\d|custom)$/.test(cls) ? cls : "wp-0";
  document.body.style.backgroundImage = image || "";
};
