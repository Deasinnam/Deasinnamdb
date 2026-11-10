(function () {
  "use strict";
  const post = (m) => { if (window.WorkAndroid) window.WorkAndroid.postMessage(JSON.stringify(m)); };
  for (const b of document.querySelectorAll("[data-go]")) b.addEventListener("click", () => post({ go: b.dataset.go }));
  const open = document.getElementById("open");
  if (open) open.addEventListener("click", () => post({ go: "open" }));
})();
