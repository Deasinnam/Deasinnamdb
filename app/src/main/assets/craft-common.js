/*
 * 덜누름 워크 — 사진 · 동영상 · 사진 정리 · 녹음 편집기에 공통으로 넣는 작은 스크립트 (각 편집기 연결 스크립트보다 먼저 실행)
 *
 * 휴대폰 화면 맞춤:
 *   ArtCraft 편집기는 PC 화면(가로 1000px 안팎)을 기준으로 그려집니다. 휴대폰 세로 화면(가로 약 400px)에서는
 *   메뉴 · 패널이 화면 밖으로 밀려 쓸 수가 없습니다.
 *   → 화면 폭이 900px보다 좁으면 편집기가 보는 화면 폭을 넓히고(최대 1/0.55배) 전체를 그만큼 줄여 보여 줍니다.
 *   DeX · 태블릿처럼 넓은 화면에서는 아무것도 바꾸지 않습니다. 화면을 돌리면 다시 계산합니다.
 *   (앱 WebView의 useWideViewPort가 켜져 있어야 동작)
 */
(function () {
  "use strict";
  if (window.__dnCraftCommon) return;
  window.__dnCraftCommon = true;

  // 화면 언어 기본값: 한국어.
  // 사진 편집(PhotoCraft)은 시작할 때 localStorage 의 환경설정을 읽으므로, 언어가 정해져 있지 않으면 미리 "ko"로 적어 둠.
  // (사용자가 설정에서 다른 언어를 고르면 그 값이 저장되어 그대로 씀. 동영상 편집은 film-bridge.js, 사진 정리는 아래)
  try {
    if (/\/assets\/photo\//.test(location.pathname)) {
      const K = "photocraft.preferences";
      let d = null;
      try { d = JSON.parse(localStorage.getItem(K) || "{}"); } catch (_) { d = null; }
      if (d && typeof d === "object" && !Array.isArray(d)) {
        if (!d.interface || typeof d.interface !== "object") d.interface = {};
        if (!d.interface.language) { d.interface.language = "ko"; localStorage.setItem(K, JSON.stringify(d)); }
      }
    }
  } catch (_) {}
  // 사진 정리(LightCraft)는 언어를 "자동"으로 두면 브라우저 언어 목록(navigator.languages)의 첫 언어를 씀
  // → 기기 언어가 영어여도 한국어로 시작하게 목록 맨 앞에 ko-KR 을 둠 (편집 › 언어에서 다른 언어를 고를 수 있음)
  try {
    if (/\/assets\/light\//.test(location.pathname)) {
      const orig = Array.from(navigator.languages || [navigator.language || "en-US"]).filter((l) => !/^ko\b/i.test(l));
      const list = Object.freeze(["ko-KR"].concat(orig));
      Object.defineProperty(navigator, "languages", { configurable: true, get: () => list });
      Object.defineProperty(navigator, "language", { configurable: true, get: () => "ko-KR" });
    }
  } catch (_) {}

  const TARGET = 900; // 편집기가 편하게 보이는 최소 화면 폭 (CSS px)
  const MIN_SCALE = 0.55; // 이보다 더 줄이면 글자가 너무 작아짐
  let original = null; // 편집기 원래의 viewport 설정 (넓은 화면에서는 그대로 둠)

  function screenWidth() {
    const w = Math.min(screen.width, screen.height), h = Math.max(screen.width, screen.height);
    const land = (screen.orientation && /landscape/.test(screen.orientation.type)) ||
      (window.matchMedia && window.matchMedia("(orientation: landscape)").matches);
    return land ? h : w;
  }

  function fit() {
    let m = document.querySelector('meta[name="viewport"]');
    if (!m) {
      m = document.createElement("meta");
      m.name = "viewport";
      (document.head || document.documentElement).appendChild(m);
    }
    if (original === null) original = m.getAttribute("content") || "width=device-width, initial-scale=1";
    const cw = screenWidth();
    const s = Math.max(MIN_SCALE, Math.min(1, cw / TARGET));
    if (s >= 0.999) {
      if (m.getAttribute("content") !== original) m.setAttribute("content", original);
      window.__dnScreenScale = 1;
      return;
    }
    const k = s.toFixed(3);
    const want = "width=" + Math.round(cw / s) + ", initial-scale=" + k + ", minimum-scale=" + k + ", maximum-scale=" + k + ", user-scalable=no";
    if (m.getAttribute("content") !== want) m.setAttribute("content", want);
    window.__dnScreenScale = s;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fit);
  else fit();
  const later = () => setTimeout(fit, 80);
  window.addEventListener("orientationchange", later);
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener("change", later);
})();
