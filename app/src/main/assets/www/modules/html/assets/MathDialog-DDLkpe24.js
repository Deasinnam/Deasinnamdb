import { u as useI18n, r as reactExports, a as renderMath, b as useModalKeys, M as MAX_LATEX_LENGTH, j as jsxRuntimeExports, c as MATH_TEMPLATES } from "./index-CmH-P8b_.js";
var tf = Object.defineProperty, rf = Object.defineProperties;
var nf = Object.getOwnPropertyDescriptors;
var No = Object.getOwnPropertySymbols;
var uu = Object.prototype.hasOwnProperty, du = Object.prototype.propertyIsEnumerable;
var cu = (t38, e, r) => e in t38 ? tf(t38, e, { enumerable: true, configurable: true, writable: true, value: r }) : t38[e] = r, h = (t38, e) => {
  for (var r in e || (e = {})) uu.call(e, r) && cu(t38, r, e[r]);
  if (No) for (var r of No(e)) du.call(e, r) && cu(t38, r, e[r]);
  return t38;
}, g = (t38, e) => rf(t38, nf(e));
var tl = (t38) => typeof t38 == "symbol" ? t38 : t38 + "", Ti = (t38, e) => {
  var r = {};
  for (var i in t38) uu.call(t38, i) && e.indexOf(i) < 0 && (r[i] = t38[i]);
  if (t38 != null && No) for (var i of No(t38)) e.indexOf(i) < 0 && du.call(t38, i) && (r[i] = t38[i]);
  return r;
};
function Le() {
  return "window" in globalThis && "document" in globalThis;
}
function Fo() {
  return "matchMedia" in window ? window.matchMedia("(pointer: coarse)").matches : "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
function mu() {
  try {
    return window.self !== window.top;
  } catch (t38) {
    return true;
  }
}
function Di() {
  return typeof navigator.vibrate == "function";
}
function Ct() {
  var e, r;
  if (!Le()) return "other";
  let t38 = (r = (e = navigator.userAgentData) == null ? void 0 : e.platform) != null ? r : navigator.platform;
  return /^mac/i.test(t38) ? navigator.maxTouchPoints === 5 ? "ios" : "macos" : /^win/i.test(t38) ? "windows" : /android/i.test(navigator.userAgent) ? "android" : /iphone|ipod|ipad/i.test(navigator.userAgent) ? "ios" : /\bcros\b/i.test(navigator.userAgent) ? "chromeos" : "other";
}
function hu() {
  if (!Le()) return true;
  if (/firefox/i.test(navigator.userAgent)) {
    let t38 = navigator.userAgent.match(/firefox\/(\d+)/i);
    return t38 ? parseInt(t38[1]) >= 78 : false;
  }
  if (/trident/i.test(navigator.userAgent)) return false;
  if (/edge/i.test(navigator.userAgent)) {
    let t38 = navigator.userAgent.match(/edg\/(\d+)/i);
    return t38 ? parseInt(t38[1]) >= 79 : false;
  }
  return true;
}
function rl() {
  return HTMLElement.prototype.hasOwnProperty("popover");
}
var pu = { id: "dvorak", locale: "en", displayName: "Dvorak", virtualLayout: "dvorak", platform: "", score: 0, mapping: { KeyA: ["a", "A", "å", "Å"], KeyB: ["x", "X", "≈", "˛"], KeyC: ["j", "J", "∆", "Ô"], KeyD: ["e", "E", "´", "´"], KeyE: [".", ">", "≥", "˘"], KeyF: ["u", "U", "¨", "¨"], KeyG: ["i", "I", "ˆ", "ˆ"], KeyH: ["d", "D", "∂", "Î"], KeyI: ["c", "C", "ç", "Ç"], KeyJ: ["h", "H", "˙", "Ó"], KeyK: ["t", "T", "†", "ˇ"], KeyL: ["n", "N", "˜", "˜"], KeyM: ["m", "M", "µ", "Â"], KeyN: ["b", "B", "∫", "ı"], KeyO: ["r", "R", "®", "‰"], KeyP: ["l", "L", "¬", "Ò"], KeyQ: ["'", '"', "æ", "Æ"], KeyR: ["p", "P", "π", "∏"], KeyS: ["o", "O", "ø", "Ø"], KeyT: ["y", "Y", "¥", "Á"], KeyU: ["g", "G", "©", "˝"], KeyV: ["k", "K", "˚", ""], KeyW: [",", "<", "≤", "¯"], KeyX: ["q", "Q", "œ", "Œ"], KeyY: ["f", "F", "ƒ", "Ï"], KeyZ: [";", ":", "…", "Ú"], Digit1: ["1", "!", "¡", "⁄"], Digit2: ["2", "@", "™", "€"], Digit3: ["3", "#", "£", "‹"], Digit4: ["4", "$", "¢", "›"], Digit5: ["5", "%", "∞", "ﬁ"], Digit6: ["6", "^", "§", "ﬂ"], Digit7: ["7", "&", "¶", "‡"], Digit8: ["8", "*", "•", "°"], Digit9: ["9", "(", "ª", "·"], Digit0: ["0", ")", "º", "‚"], Space: [" ", " ", " ", " "], Minus: ["[", "{", "“", "”"], Equal: ["]", "}", "‘", "’"], BracketLeft: ["/", "?", "÷", "¿"], BracketRight: ["=", "+", "≠", "±"], Backslash: ["\\", "|", "«", "»"], Semicolon: ["s", "S", "ß", "Í"], Quote: ["-", "_", "–", "—"], Backquote: ["`", "~", "`", "`"], Comma: ["w", "W", "∑", "„"], Period: ["v", "V", "√", "◊"], Slash: ["z", "Z", "Ω", "¸"], NumpadDivide: ["/", "/", "/", "/"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], Numpad1: ["1", "1", "1", "1"], Numpad2: ["2", "2", "2", "2"], Numpad3: ["3", "3", "3", "3"], Numpad4: ["4", "4", "4", "4"], Numpad5: ["5", "5", "5", "5"], Numpad6: ["6", "6", "6", "6"], Numpad7: ["7", "7", "7", "7"], Numpad8: ["8", "8", "8", "8"], Numpad9: ["9", "9", "9", "9"], Numpad0: ["0", "0", "0", "0"], NumpadDecimal: [".", ".", ".", "."], IntlBackslash: ["§", "±", "§", "±"], NumpadEqual: ["=", "=", "=", "="], AudioVolumeUp: ["", "=", "", "="] } };
var $o = { id: "apple.en-intl", displayName: "English (international)", virtualLayout: "qwerty", platform: "apple", locale: "en", score: 0, mapping: { KeyA: ["a", "A", "å", "Å"], KeyB: ["b", "B", "∫", "ı"], KeyC: ["c", "C", "ç", "Ç"], KeyD: ["d", "D", "∂", "Î"], KeyE: ["e", "E", "´", "´"], KeyF: ["f", "F", "ƒ", "Ï"], KeyG: ["g", "G", "©", "˝"], KeyH: ["h", "H", "˙", "Ó"], KeyI: ["i", "I", "ˆ", "ˆ"], KeyJ: ["j", "J", "∆", "Ô"], KeyK: ["k", "K", "˚", ""], KeyL: ["l", "L", "¬", "Ò"], KeyM: ["m", "M", "µ", "Â"], KeyN: ["n", "N", "˜", "˜"], KeyO: ["o", "O", "ø", "Ø"], KeyP: ["p", "P", "π", "∏"], KeyQ: ["q", "Q", "œ", "Œ"], KeyR: ["r", "R", "®", "‰"], KeyS: ["s", "S", "ß", "Í"], KeyT: ["t", "T", "†", "ˇ"], KeyU: ["u", "U", "¨", "¨"], KeyV: ["v", "V", "√", "◊"], KeyW: ["w", "W", "∑", "„"], KeyX: ["x", "X", "≈", "˛"], KeyY: ["y", "Y", "¥", "Á"], KeyZ: ["z", "Z", "Ω", "¸"], Digit1: ["1", "!", "¡", "⁄"], Digit2: ["2", "@", "™", "€"], Digit3: ["3", "#", "£", "‹"], Digit4: ["4", "$", "¢", "›"], Digit5: ["5", "%", "∞", "ﬁ"], Digit6: ["6", "^", "§", "ﬂ"], Digit7: ["7", "&", "¶", "‡"], Digit8: ["8", "*", "•", "°"], Digit9: ["9", "(", "ª", "·"], Digit0: ["0", ")", "º", "‚"], Space: [" ", " ", " ", " "], Minus: ["-", "_", "–", "—"], Equal: ["=", "+", "≠", "±"], BracketLeft: ["[", "{", "“", "”"], BracketRight: ["]", "}", "‘", "’"], Backslash: ["\\", "|", "«", "»"], Semicolon: [";", ":", "…", "Ú"], Quote: ["'", '"', "æ", "Æ"], Backquote: ["`", "˜", "`", "`"], Comma: [",", "<", "≤", "¯"], Period: [".", ">", "≥", "˘"], Slash: ["/", "?", "÷", "¿"], NumpadDivide: ["/", "/", "/", "/"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], Numpad1: ["1", "1", "1", "1"], Numpad2: ["2", "2", "2", "2"], Numpad3: ["3", "3", "3", "3"], Numpad4: ["4", "4", "4", "4"], Numpad5: ["5", "5", "5", "5"], Numpad6: ["6", "6", "6", "6"], Numpad7: ["7", "7", "7", "7"], Numpad8: ["8", "8", "8", "8"], Numpad9: ["9", "9", "9", "9"], Numpad0: ["0", "0", "0", "0"], NumpadDecimal: [".", ".", ".", "."], IntlBackslash: ["§", "±", "§", "±"], NumpadEqual: ["=", "=", "=", "="], AudioVolumeUp: ["", "=", "", "="] } }, il = { id: "windows.en-intl", displayName: "English (international)", platform: "windows", virtualLayout: "qwerty", locale: "en", score: 0, mapping: { KeyA: ["a", "A", "á", "Á"], KeyB: ["b", "B", "", ""], KeyC: ["c", "C", "©", "¢"], KeyD: ["d", "D", "ð", "Ð"], KeyE: ["e", "E", "é", "É"], KeyF: ["f", "F", "", ""], KeyG: ["g", "G", "", ""], KeyH: ["h", "H", "", ""], KeyI: ["i", "I", "í", "Í"], KeyJ: ["j", "J", "", ""], KeyK: ["k", "K", "", ""], KeyL: ["l", "L", "ø", "Ø"], KeyM: ["m", "M", "µ", ""], KeyN: ["n", "N", "ñ", "Ñ"], KeyO: ["o", "O", "ó", "Ó"], KeyP: ["p", "P", "ö", "Ö"], KeyQ: ["q", "Q", "ä", "Ä"], KeyR: ["r", "R", "®", ""], KeyS: ["s", "S", "ß", "§"], KeyT: ["t", "T", "þ", "Þ"], KeyU: ["u", "U", "ú", "Ú"], KeyV: ["v", "V", "", ""], KeyW: ["w", "W", "å", "Å"], KeyX: ["x", "X", "", ""], KeyY: ["y", "Y", "ü", "Ü"], KeyZ: ["z", "Z", "æ", "Æ"], Digit1: ["1", "!", "¡", "¹"], Digit2: ["2", "@", "²", ""], Digit3: ["3", "#", "³", ""], Digit4: ["4", "$", "¤", "£"], Digit5: ["5", "%", "€", ""], Digit6: ["6", "^", "¼", ""], Digit7: ["7", "&", "½", ""], Digit8: ["8", "*", "¾", ""], Digit9: ["9", "(", "‘", ""], Digit0: ["0", ")", "’", ""], Space: [" ", " ", "", ""], Minus: ["-", "_", "¥", ""], Equal: ["=", "+", "×", "÷"], BracketLeft: ["[", "{", "«", ""], BracketRight: ["]", "}", "»", ""], Backslash: ["\\", "|", "¬", "¦"], Semicolon: [";", ":", "¶", "°"], Quote: ["'", '"', "´", "¨"], Backquote: ["`", "~", "", ""], Comma: [",", "<", "ç", "Ç"], Period: [".", ">", "", ""], Slash: ["/", "?", "¿", ""], NumpadDivide: ["/", "/", "", ""], NumpadMultiply: ["*", "*", "", ""], NumpadSubtract: ["-", "-", "", ""], NumpadAdd: ["+", "+", "", ""], IntlBackslash: ["\\", "|", "", ""] } }, nl = { id: "linux.en", displayName: "English", platform: "linux", virtualLayout: "qwerty", locale: "en", score: 0, mapping: { KeyA: ["a", "A", "a", "A"], KeyB: ["b", "B", "b", "B"], KeyC: ["c", "C", "c", "C"], KeyD: ["d", "D", "d", "D"], KeyE: ["e", "E", "e", "E"], KeyF: ["f", "F", "f", "F"], KeyG: ["g", "G", "g", "G"], KeyH: ["h", "H", "h", "H"], KeyI: ["i", "I", "i", "I"], KeyJ: ["j", "J", "j", "J"], KeyK: ["k", "K", "k", "K"], KeyL: ["l", "L", "l", "L"], KeyM: ["m", "M", "m", "M"], KeyN: ["n", "N", "n", "N"], KeyO: ["o", "O", "o", "O"], KeyP: ["p", "P", "p", "P"], KeyQ: ["q", "Q", "q", "Q"], KeyR: ["r", "R", "r", "R"], KeyS: ["s", "S", "s", "S"], KeyT: ["t", "T", "t", "T"], KeyU: ["u", "U", "u", "U"], KeyV: ["v", "V", "v", "V"], KeyW: ["w", "W", "w", "W"], KeyX: ["x", "X", "x", "X"], KeyY: ["y", "Y", "y", "Y"], KeyZ: ["z", "Z", "z", "Z"], Digit1: ["1", "!", "1", "!"], Digit2: ["2", "@", "2", "@"], Digit3: ["3", "#", "3", "#"], Digit4: ["4", "$", "4", "$"], Digit5: ["5", "%", "5", "%"], Digit6: ["6", "^", "6", "^"], Digit7: ["7", "&", "7", "&"], Digit8: ["8", "*", "8", "*"], Digit9: ["9", "(", "9", "("], Digit0: ["0", ")", "0", ")"], Space: [" ", " ", " ", " "], Minus: ["-", "_", "-", "_"], Equal: ["=", "+", "=", "+"], BracketLeft: ["[", "{", "[", "{"], BracketRight: ["]", "}", "]", "}"], Backslash: ["\\", "|", "\\", "|"], Semicolon: [";", ":", ";", ":"], Quote: ["'", '"', "'", '"'], Backquote: ["`", "~", "`", "~"], Comma: [",", "<", ",", "<"], Period: [".", ">", ".", ">"], Slash: ["/", "?", "/", "?"], NumpadDivide: ["/", "/", "/", "/"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], Numpad1: ["1", "1", "1", "1"], Numpad2: ["2", "2", "2", "2"], Numpad3: ["3", "3", "3", "3"], Numpad4: ["4", "4", "4", "4"], Numpad5: ["5", "5", "5", "5"], Numpad6: ["6", "6", "6", "6"], Numpad7: ["7", "7", "7", "7"], Numpad8: ["8", "8", "8", "8"], Numpad9: ["9", "9", "9", "9"], Numpad0: ["0", "0", "0", "0"], NumpadDecimal: ["", ".", "", "."], IntlBackslash: ["<", ">", "|", "¦"], NumpadEqual: ["=", "=", "=", "="], NumpadComma: [".", ".", ".", "."], NumpadParenLeft: ["(", "(", "(", "("], NumpadParenRight: [")", ")", ")", ")"] } };
var fu = { id: "apple.french", locale: "fr", displayName: "French", platform: "apple", virtualLayout: "azerty", score: 0, mapping: { KeyA: ["q", "Q", "‡", "Ω"], KeyB: ["b", "B", "ß", "∫"], KeyC: ["c", "C", "©", "¢"], KeyD: ["d", "D", "∂", "∆"], KeyE: ["e", "E", "ê", "Ê"], KeyF: ["f", "F", "ƒ", "·"], KeyG: ["g", "G", "ﬁ", "ﬂ"], KeyH: ["h", "H", "Ì", "Î"], KeyI: ["i", "I", "î", "ï"], KeyJ: ["j", "J", "Ï", "Í"], KeyK: ["k", "K", "È", "Ë"], KeyL: ["l", "L", "¬", "|"], KeyM: [",", "?", "∞", "¿"], KeyN: ["n", "N", "~", "ı"], KeyO: ["o", "O", "œ", "Œ"], KeyP: ["p", "P", "π", "∏"], KeyQ: ["a", "A", "æ", "Æ"], KeyR: ["r", "R", "®", "‚"], KeyS: ["s", "S", "Ò", "∑"], KeyT: ["t", "T", "†", "™"], KeyU: ["u", "U", "º", "ª"], KeyV: ["v", "V", "◊", "√"], KeyW: ["z", "Z", "Â", "Å"], KeyX: ["x", "X", "≈", "⁄"], KeyY: ["y", "Y", "Ú", "Ÿ"], KeyZ: ["w", "W", "‹", "›"], Digit1: ["&", "1", "", "´"], Digit2: ["é", "2", "ë", "„"], Digit3: ['"', "3", "“", "”"], Digit4: ["'", "4", "‘", "’"], Digit5: ["(", "5", "{", "["], Digit6: ["§", "6", "¶", "å"], Digit7: ["è", "7", "«", "»"], Digit8: ["!", "8", "¡", "Û"], Digit9: ["ç", "9", "Ç", "Á"], Digit0: ["à", "0", "ø", "Ø"], Space: [" ", " ", " ", " "], Minus: [")", "°", "}", "]"], Equal: ["-", "_", "—", "–"], BracketLeft: ["^", "¨", "ô", "Ô"], BracketRight: ["$", "*", "€", "¥"], Backslash: ["`", "£", "@", "#"], Semicolon: ["m", "M", "µ", "Ó"], Quote: ["ù", "%", "Ù", "‰"], Backquote: ["<", ">", "≤", "≥"], Comma: [";", ".", "…", "•"], Period: [":", "/", "÷", "\\"], Slash: ["=", "+", "≠", "±"], NumpadDivide: ["/", "/", "/", "/"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], NumpadDecimal: [",", ".", ",", "."], IntlBackslash: ["@", "#", "•", "Ÿ"], NumpadEqual: ["=", "=", "=", "="] } }, gu = { id: "windows.french", locale: "fr", displayName: "French", virtualLayout: "azerty", platform: "windows", score: 0, mapping: { KeyA: ["q", "Q", "", ""], KeyB: ["b", "B", "", ""], KeyC: ["c", "C", "", ""], KeyD: ["d", "D", "", ""], KeyE: ["e", "E", "€", ""], KeyF: ["f", "F", "", ""], KeyG: ["g", "G", "", ""], KeyH: ["h", "H", "", ""], KeyI: ["i", "I", "", ""], KeyJ: ["j", "J", "", ""], KeyK: ["k", "K", "", ""], KeyL: ["l", "L", "", ""], KeyM: [",", "?", "", ""], KeyN: ["n", "N", "", ""], KeyO: ["o", "O", "", ""], KeyP: ["p", "P", "", ""], KeyQ: ["a", "A", "", ""], KeyR: ["r", "R", "", ""], KeyS: ["s", "S", "", ""], KeyT: ["t", "T", "", ""], KeyU: ["u", "U", "", ""], KeyV: ["v", "V", "", ""], KeyW: ["z", "Z", "", ""], KeyX: ["x", "X", "", ""], KeyY: ["y", "Y", "", ""], KeyZ: ["w", "W", "", ""], Digit1: ["&", "1", "", ""], Digit2: ["é", "2", "~", ""], Digit3: ['"', "3", "#", ""], Digit4: ["'", "4", "{", ""], Digit5: ["(", "5", "[", ""], Digit6: ["-", "6", "|", ""], Digit7: ["è", "7", "`", ""], Digit8: ["_", "8", "\\", ""], Digit9: ["ç", "9", "^", ""], Digit0: ["à", "0", "@", ""], Space: [" ", " ", "", ""], Minus: [")", "°", "]", ""], Equal: ["=", "+", "}", ""], BracketLeft: ["^", "¨", "", ""], BracketRight: ["$", "£", "¤", ""], Backslash: ["*", "µ", "", ""], Semicolon: ["m", "M", "", ""], Quote: ["ù", "%", "", ""], Backquote: ["²", "", "", ""], Comma: [";", ".", "", ""], Period: [":", "/", "", ""], Slash: ["!", "§", "", ""], NumpadDivide: ["/", "/", "", ""], NumpadMultiply: ["*", "*", "", ""], NumpadSubtract: ["-", "-", "", ""], NumpadAdd: ["+", "+", "", ""], IntlBackslash: ["<", ">", "", ""] } }, bu = { id: "linux.french", locale: "fr", displayName: "French", virtualLayout: "azerty", platform: "linux", score: 0, mapping: { KeyA: ["q", "Q", "@", "Ω"], KeyB: ["b", "B", "”", "’"], KeyC: ["c", "C", "¢", "©"], KeyD: ["d", "D", "ð", "Ð"], KeyE: ["e", "E", "€", "¢"], KeyF: ["f", "F", "đ", "ª"], KeyG: ["g", "G", "ŋ", "Ŋ"], KeyH: ["h", "H", "ħ", "Ħ"], KeyI: ["i", "I", "→", "ı"], KeyJ: ["j", "J", "̉", "̛"], KeyK: ["k", "K", "ĸ", "&"], KeyL: ["l", "L", "ł", "Ł"], KeyM: [",", "?", "́", "̋"], KeyN: ["n", "N", "n", "N"], KeyO: ["o", "O", "ø", "Ø"], KeyP: ["p", "P", "þ", "Þ"], KeyQ: ["a", "A", "æ", "Æ"], KeyR: ["r", "R", "¶", "®"], KeyS: ["s", "S", "ß", "§"], KeyT: ["t", "T", "ŧ", "Ŧ"], KeyU: ["u", "U", "↓", "↑"], KeyV: ["v", "V", "“", "‘"], KeyW: ["z", "Z", "«", "<"], KeyX: ["x", "X", "»", ">"], KeyY: ["y", "Y", "←", "¥"], KeyZ: ["w", "W", "ł", "Ł"], Digit1: ["&", "1", "¹", "¡"], Digit2: ["é", "2", "~", "⅛"], Digit3: ['"', "3", "#", "£"], Digit4: ["'", "4", "{", "$"], Digit5: ["(", "5", "[", "⅜"], Digit6: ["-", "6", "|", "⅝"], Digit7: ["è", "7", "`", "⅞"], Digit8: ["_", "8", "\\", "™"], Digit9: ["ç", "9", "^", "±"], Digit0: ["à", "0", "@", "°"], Enter: ["\r", "\r", "\r", "\r"], Escape: ["\x1B", "\x1B", "\x1B", "\x1B"], Backspace: ["\b", "\b", "\b", "\b"], Tab: ["	", "", "	", ""], Space: [" ", " ", " ", " "], Minus: [")", "°", "]", "¿"], Equal: ["=", "+", "}", "̨"], BracketLeft: ["̂", "̈", "̈", "̊"], BracketRight: ["$", "£", "¤", "̄"], Backslash: ["*", "µ", "̀", "̆"], Semicolon: ["m", "M", "µ", "º"], Quote: ["ù", "%", "̂", "̌"], Backquote: ["²", "~", "¬", "¬"], Comma: [";", ".", "─", "×"], Period: [":", "/", "·", "÷"], Slash: ["!", "§", "̣", "̇"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], NumpadDecimal: ["", ".", "", "."], IntlBackslash: ["<", ">", "|", "¦"] } };
var yu = { id: "apple.german", locale: "de", displayName: "German", virtualLayout: "qwertz", platform: "apple", score: 0, mapping: { KeyA: ["a", "A", "å", "Å"], KeyB: ["b", "B", "∫", "‹"], KeyC: ["c", "C", "ç", "Ç"], KeyD: ["d", "D", "∂", "™"], KeyE: ["e", "E", "€", "‰"], KeyF: ["f", "F", "ƒ", "Ï"], KeyG: ["g", "G", "©", "Ì"], KeyH: ["h", "H", "ª", "Ó"], KeyI: ["i", "I", "⁄", "Û"], KeyJ: ["j", "J", "º", "ı"], KeyK: ["k", "K", "∆", "ˆ"], KeyL: ["l", "L", "@", "ﬂ"], KeyM: ["m", "M", "µ", "˘"], KeyN: ["n", "N", "~", "›"], KeyO: ["o", "O", "ø", "Ø"], KeyP: ["p", "P", "π", "∏"], KeyQ: ["q", "Q", "«", "»"], KeyR: ["r", "R", "®", "¸"], KeyS: ["s", "S", "‚", "Í"], KeyT: ["t", "T", "†", "˝"], KeyU: ["u", "U", "¨", "Á"], KeyV: ["v", "V", "√", "◊"], KeyW: ["w", "W", "∑", "„"], KeyX: ["x", "X", "≈", "Ù"], KeyY: ["z", "Z", "Ω", "ˇ"], KeyZ: ["y", "Y", "¥", "‡"], Digit1: ["1", "!", "¡", "¬"], Digit2: ["2", '"', "“", "”"], Digit3: ["3", "§", "¶", "#"], Digit4: ["4", "$", "¢", "£"], Digit5: ["5", "%", "[", "ﬁ"], Digit6: ["6", "&", "]", "^"], Digit7: ["7", "/", "|", "\\"], Digit8: ["8", "(", "{", "˜"], Digit9: ["9", ")", "}", "·"], Digit0: ["0", "=", "≠", "¯"], Space: [" ", " ", " ", " "], Minus: ["ß", "?", "¿", "˙"], Equal: ["´", "`", "'", "˚"], BracketLeft: ["ü", "Ü", "•", "°"], BracketRight: ["+", "*", "±", ""], Backslash: ["#", "'", "‘", "’"], Semicolon: ["ö", "Ö", "œ", "Œ"], Quote: ["ä", "Ä", "æ", "Æ"], Backquote: ["<", ">", "≤", "≥"], Comma: [",", ";", "∞", "˛"], Period: [".", ":", "…", "÷"], Slash: ["-", "_", "–", "—"], NumpadDivide: ["/", "/", "/", "/"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], NumpadDecimal: [",", ",", ".", "."], IntlBackslash: ["^", "°", "„", "“"], NumpadEqual: ["=", "=", "=", "="] } }, xu = { id: "windows.german", locale: "de", displayName: "German", platform: "windows", virtualLayout: "qwertz", score: 0, mapping: { KeyA: ["a", "A", "", ""], KeyB: ["b", "B", "", ""], KeyC: ["c", "C", "", ""], KeyD: ["d", "D", "", ""], KeyE: ["e", "E", "€", ""], KeyF: ["f", "F", "", ""], KeyG: ["g", "G", "", ""], KeyH: ["h", "H", "", ""], KeyI: ["i", "I", "", ""], KeyJ: ["j", "J", "", ""], KeyK: ["k", "K", "", ""], KeyL: ["l", "L", "", ""], KeyM: ["m", "M", "µ", ""], KeyN: ["n", "N", "", ""], KeyO: ["o", "O", "", ""], KeyP: ["p", "P", "", ""], KeyQ: ["q", "Q", "@", ""], KeyR: ["r", "R", "", ""], KeyS: ["s", "S", "", ""], KeyT: ["t", "T", "", ""], KeyU: ["u", "U", "", ""], KeyV: ["v", "V", "", ""], KeyW: ["w", "W", "", ""], KeyX: ["x", "X", "", ""], KeyY: ["z", "Z", "", ""], KeyZ: ["y", "Y", "", ""], Digit1: ["1", "!", "", ""], Digit2: ["2", '"', "²", ""], Digit3: ["3", "§", "³", ""], Digit4: ["4", "$", "", ""], Digit5: ["5", "%", "", ""], Digit6: ["6", "&", "", ""], Digit7: ["7", "/", "{", ""], Digit8: ["8", "(", "[", ""], Digit9: ["9", ")", "]", ""], Digit0: ["0", "=", "}", ""], Space: [" ", " ", "", ""], Minus: ["ß", "?", "\\", "ẞ"], Equal: ["´", "`", "", ""], BracketLeft: ["ü", "Ü", "", ""], BracketRight: ["+", "*", "~", ""], Backslash: ["#", "'", "", ""], Semicolon: ["ö", "Ö", "", ""], Quote: ["ä", "Ä", "", ""], Backquote: ["^", "°", "", ""], Comma: [",", ";", "", ""], Period: [".", ":", "", ""], Slash: ["-", "_", "", ""], NumpadDivide: ["/", "/", "", ""], NumpadMultiply: ["*", "*", "", ""], NumpadSubtract: ["-", "-", "", ""], NumpadAdd: ["+", "+", "", ""], IntlBackslash: ["<", ">", "|", ""] } }, vu = { id: "linux.german", locale: "de", displayName: "German", platform: "windows", virtualLayout: "qwertz", score: 0, mapping: { KeyA: ["a", "A", "æ", "Æ"], KeyB: ["b", "B", "“", "‘"], KeyC: ["c", "C", "¢", "©"], KeyD: ["d", "D", "ð", "Ð"], KeyE: ["e", "E", "€", "€"], KeyF: ["f", "F", "đ", "ª"], KeyG: ["g", "G", "ŋ", "Ŋ"], KeyH: ["h", "H", "ħ", "Ħ"], KeyI: ["i", "I", "→", "ı"], KeyJ: ["j", "J", "̣", "̇"], KeyK: ["k", "K", "ĸ", "&"], KeyL: ["l", "L", "ł", "Ł"], KeyM: ["m", "M", "µ", "º"], KeyN: ["n", "N", "”", "’"], KeyO: ["o", "O", "ø", "Ø"], KeyP: ["p", "P", "þ", "Þ"], KeyQ: ["q", "Q", "@", "Ω"], KeyR: ["r", "R", "¶", "®"], KeyS: ["s", "S", "ſ", "ẞ"], KeyT: ["t", "T", "ŧ", "Ŧ"], KeyU: ["u", "U", "↓", "↑"], KeyV: ["v", "V", "„", "‚"], KeyW: ["w", "W", "ł", "Ł"], KeyX: ["x", "X", "«", "‹"], KeyY: ["z", "Z", "←", "¥"], KeyZ: ["y", "Y", "»", "›"], Digit1: ["1", "!", "¹", "¡"], Digit2: ["2", '"', "²", "⅛"], Digit3: ["3", "§", "³", "£"], Digit4: ["4", "$", "¼", "¤"], Digit5: ["5", "%", "½", "⅜"], Digit6: ["6", "&", "¬", "⅝"], Digit7: ["7", "/", "{", "⅞"], Digit8: ["8", "(", "[", "™"], Digit9: ["9", ")", "]", "±"], Digit0: ["0", "=", "}", "°"], Enter: ["\r", "\r", "\r", "\r"], Escape: ["\x1B", "\x1B", "\x1B", "\x1B"], Backspace: ["\b", "\b", "\b", "\b"], Tab: ["	", "", "	", ""], Space: [" ", " ", " ", " "], Minus: ["ß", "?", "\\", "¿"], Equal: ["́", "̀", "̧", "̨"], BracketLeft: ["ü", "Ü", "̈", "̊"], BracketRight: ["+", "*", "~", "¯"], Backslash: ["#", "'", "’", "̆"], Semicolon: ["ö", "Ö", "̋", "̣"], Quote: ["ä", "Ä", "̂", "̌"], Backquote: ["̂", "°", "′", "″"], Comma: [",", ";", "·", "×"], Period: [".", ":", "…", "÷"], Slash: ["-", "_", "–", "—"], PrintScreen: ["", "", "", ""], PageUp: ["/", "/", "/", "/"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], Numpad1: ["", "1", "", "1"], Numpad2: ["", "2", "", "2"], Numpad3: ["", "3", "", "3"], Numpad4: ["", "4", "", "4"], Numpad5: ["", "5", "", "5"], Numpad6: ["", "6", "", "6"], Numpad7: ["", "7", "", "7"], Numpad8: ["", "8", "", "8"], Numpad9: ["", "9", "", "9"], Numpad0: ["", "0", "", "0"], NumpadDecimal: ["", ",", "", ","], IntlBackslash: ["<", ">", "|", "̱"], AltRight: ["\r", "\r", "\r", "\r"], MetaRight: [".", ".", ".", "."] } };
var _u = { id: "apple.spanish", locale: "es", displayName: "Spanish ISO", platform: "apple", virtualLayout: "qwerty", score: 0, mapping: { KeyA: ["a", "A", "å", "Å"], KeyB: ["b", "B", "ß", ""], KeyC: ["c", "C", "©", " "], KeyD: ["d", "D", "∂", "∆"], KeyE: ["e", "E", "€", "€"], KeyF: ["f", "F", "ƒ", "ﬁ"], KeyG: ["g", "G", "", "ﬂ"], KeyH: ["h", "H", "™", " "], KeyI: ["i", "I", " ", " "], KeyJ: ["j", "J", "¶", "¯"], KeyK: ["k", "K", "§", "ˇ"], KeyL: ["l", "L", " ", "˘"], KeyM: ["m", "M", "µ", "˚"], KeyN: ["n", "N", " ", "˙"], KeyO: ["o", "O", "ø", "Ø"], KeyP: ["p", "P", "π", "∏"], KeyQ: ["q", "Q", "œ", "Œ"], KeyR: ["r", "R", "®", " "], KeyS: ["s", "S", "∫", " "], KeyT: ["t", "T", "†", "‡"], KeyU: ["u", "U", " ", " "], KeyV: ["v", "V", "√", "◊"], KeyW: ["w", "W", "æ", "Æ"], KeyX: ["x", "X", "∑", "›"], KeyY: ["y", "Y", "¥", " "], KeyZ: ["z", "Z", "Ω", "‹"], Digit1: ["1", "!", "|", "ı"], Digit2: ["2", '"', "@", "˝"], Digit3: ["3", "·", "#", "•"], Digit4: ["4", "$", "¢", "£"], Digit5: ["5", "%", "∞", "‰"], Digit6: ["6", "&", "¬", " "], Digit7: ["7", "/", "÷", "⁄"], Digit8: ["8", "(", "“", "‘"], Digit9: ["9", ")", "”", "’"], Digit0: ["0", "=", "≠", "≈"], Space: [" ", " ", " ", " "], Minus: ["'", "?", "´", "¸"], Equal: ["¡", "¿", "‚", "˛"], BracketLeft: ["`", "^", "[", "ˆ"], BracketRight: ["+", "*", "]", "±"], Backslash: ["ç", "Ç", "}", "»"], Semicolon: ["ñ", "Ñ", "~", "˜"], Quote: ["´", "¨", "{", "«"], Backquote: ["<", ">", "≤", "≥"], Comma: [",", ";", "„", ""], Period: [".", ":", "…", "…"], Slash: ["-", "_", "–", "—"], NumpadDivide: ["/", "/", "/", "/"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], Numpad1: ["1", "1", "1", "1"], Numpad2: ["2", "2", "2", "2"], Numpad3: ["3", "3", "3", "3"], Numpad4: ["4", "4", "4", "4"], Numpad5: ["5", "5", "5", "5"], Numpad6: ["6", "6", "6", "6"], Numpad7: ["7", "7", "7", "7"], Numpad8: ["8", "8", "8", "8"], Numpad9: ["9", "9", "9", "9"], Numpad0: ["0", "0", "0", "0"], NumpadDecimal: [",", ",", ",", ","], IntlBackslash: ["º", "ª", "\\", "°"] } }, Mu = { id: "windows.spanish", locale: "es", displayName: "Spanish", platform: "windows", virtualLayout: "qwerty", score: 0, mapping: { KeyA: ["a", "A", "", ""], KeyB: ["b", "B", "", ""], KeyC: ["c", "C", "", ""], KeyD: ["d", "D", "", ""], KeyE: ["e", "E", "€", ""], KeyF: ["f", "F", "", ""], KeyG: ["g", "G", "", ""], KeyH: ["h", "H", "", ""], KeyI: ["i", "I", "", ""], KeyJ: ["j", "J", "", ""], KeyK: ["k", "K", "", ""], KeyL: ["l", "L", "", ""], KeyM: ["m", "M", "", ""], KeyN: ["n", "N", "", ""], KeyO: ["o", "O", "", ""], KeyP: ["p", "P", "", ""], KeyQ: ["q", "Q", "", ""], KeyR: ["r", "R", "", ""], KeyS: ["s", "S", "", ""], KeyT: ["t", "T", "", ""], KeyU: ["u", "U", "", ""], KeyV: ["v", "V", "", ""], KeyW: ["w", "W", "", ""], KeyX: ["x", "X", "", ""], KeyY: ["y", "Y", "", ""], KeyZ: ["z", "Z", "", ""], Digit1: ["1", "!", "|", ""], Digit2: ["2", '"', "@", ""], Digit3: ["3", "·", "#", ""], Digit4: ["4", "$", "~", ""], Digit5: ["5", "%", "€", ""], Digit6: ["6", "&", "¬", ""], Digit7: ["7", "/", "", ""], Digit8: ["8", "(", "", ""], Digit9: ["9", ")", "", ""], Digit0: ["0", "=", "", ""], Space: [" ", " ", "", ""], Minus: ["'", "?", "", ""], Equal: ["¡", "¿", "", ""], BracketLeft: ["`", "^", "[", ""], BracketRight: ["+", "*", "]", ""], Backslash: ["ç", "Ç", "}", ""], Semicolon: ["ñ", "Ñ", "", ""], Quote: ["´", "¨", "{", ""], Backquote: ["º", "ª", "\\", ""], Comma: [",", ";", "", ""], Period: [".", ":", "", ""], Slash: ["-", "_", "", ""], NumpadDivide: ["/", "/", "", ""], NumpadMultiply: ["*", "*", "", ""], NumpadSubtract: ["-", "-", "", ""], NumpadAdd: ["+", "+", "", ""], IntlBackslash: ["<", ">", "", ""] } }, wu = { id: "linux.spanish", locale: "es", displayName: "Spanish", platform: "linux", virtualLayout: "qwerty", score: 0, mapping: { KeyA: ["a", "A", "æ", "Æ"], KeyB: ["b", "B", "”", "’"], KeyC: ["c", "C", "¢", "©"], KeyD: ["d", "D", "ð", "Ð"], KeyE: ["e", "E", "€", "¢"], KeyF: ["f", "F", "đ", "ª"], KeyG: ["g", "G", "ŋ", "Ŋ"], KeyH: ["h", "H", "ħ", "Ħ"], KeyI: ["i", "I", "→", "ı"], KeyJ: ["j", "J", "̉", "̛"], KeyK: ["k", "K", "ĸ", "&"], KeyL: ["l", "L", "ł", "Ł"], KeyM: ["m", "M", "µ", "º"], KeyN: ["n", "N", "n", "N"], KeyO: ["o", "O", "ø", "Ø"], KeyP: ["p", "P", "þ", "Þ"], KeyQ: ["q", "Q", "@", "Ω"], KeyR: ["r", "R", "¶", "®"], KeyS: ["s", "S", "ß", "§"], KeyT: ["t", "T", "ŧ", "Ŧ"], KeyU: ["u", "U", "↓", "↑"], KeyV: ["v", "V", "“", "‘"], KeyW: ["w", "W", "ł", "Ł"], KeyX: ["x", "X", "»", ">"], KeyY: ["y", "Y", "←", "¥"], KeyZ: ["z", "Z", "«", "<"], Digit1: ["1", "!", "|", "¡"], Digit2: ["2", '"', "@", "⅛"], Digit3: ["3", "·", "#", "£"], Digit4: ["4", "$", "~", "$"], Digit5: ["5", "%", "½", "⅜"], Digit6: ["6", "&", "¬", "⅝"], Digit7: ["7", "/", "{", "⅞"], Digit8: ["8", "(", "[", "™"], Digit9: ["9", ")", "]", "±"], Digit0: ["0", "=", "}", "°"], Enter: ["\r", "\r", "\r", "\r"], Escape: ["\x1B", "\x1B", "\x1B", "\x1B"], Backspace: ["\b", "\b", "\b", "\b"], Tab: ["	", "", "	", ""], Space: [" ", " ", " ", " "], Minus: ["'", "?", "\\", "¿"], Equal: ["¡", "¿", "̃", "~"], BracketLeft: ["̀", "̂", "[", "̊"], BracketRight: ["+", "*", "]", "̄"], Backslash: ["ç", "Ç", "}", "̆"], Semicolon: ["ñ", "Ñ", "~", "̋"], Quote: ["́", "̈", "{", "{"], Backquote: ["º", "ª", "\\", "\\"], Comma: [",", ";", "─", "×"], Period: [".", ":", "·", "÷"], Slash: ["-", "_", "̣", "̇"], NumpadDivide: ["/", "/", "/", "/"], NumpadMultiply: ["*", "*", "*", "*"], NumpadSubtract: ["-", "-", "-", "-"], NumpadAdd: ["+", "+", "+", "+"], NumpadEnter: ["\r", "\r", "\r", "\r"], Numpad1: ["", "1", "", "1"], Numpad2: ["", "2", "", "2"], Numpad3: ["", "3", "", "3"], Numpad4: ["", "4", "", "4"], Numpad5: ["", "5", "", "5"], Numpad6: ["", "6", "", "6"], Numpad7: ["", "7", "", "7"], Numpad8: ["", "8", "", "8"], Numpad9: ["", "9", "", "9"], Numpad0: ["", "0", "", "0"], NumpadDecimal: ["", ".", "", "."], IntlBackslash: ["<", ">", "|", "¦"], NumpadEqual: ["=", "=", "=", "="], NumpadComma: [".", ".", ".", "."], NumpadParenLeft: ["(", "(", "(", "("], NumpadParenRight: [")", ")", ")", ")"] } };
function ol(t38) {
  let e = t38.split("+"), r = { shift: false, alt: false, cmd: false, win: false, meta: false, ctrl: false, key: e.pop() };
  return e.includes("shift") && (r.shift = true), e.includes("alt") && (r.alt = true), e.includes("ctrl") && (r.ctrl = true), e.includes("cmd") && (r.cmd = true), e.includes("win") && (r.win = true), e.includes("meta") && (r.meta = true), r;
}
function Zr(t38) {
  let e = "";
  return t38.shift && (e += "shift+"), t38.alt && (e += "alt+"), t38.ctrl && (e += "ctrl+"), t38.cmd && (e += "cmd+"), t38.win && (e += "win+"), t38.meta && (e += "meta+"), e + t38.key;
}
var of = { enter: "[Enter]", escape: "[Escape]", backspace: "[Backspace]", tab: "[Tab]", space: "[Space]", pausebreak: "[Pause]", insert: "[Insert]", home: "[Home]", pageup: "[PageUp]", delete: "[Delete]", end: "[End]", pagedown: "[PageDown]", right: "[ArrowRight]", left: "[ArrowLeft]", down: "[ArrowDown]", up: "[ArrowUp]", numpad0: "[Numpad0]", numpad1: "[Numpad1]", numpad2: "[Numpad2]", numpad3: "[Numpad3]", numpad4: "[Numpad4]", numpad5: "[Numpad5]", numpad6: "[Numpad6]", numpad7: "[Numpad7]", numpad8: "[Numpad8]", numpad9: "[Numpad9]", numpad_divide: "[NumpadDivide]", numpad_multiply: "[NumpadMultiply]", numpad_subtract: "[NumpadSubtract]", numpad_add: "[NumpadAdd]", numpad_decimal: "[NumpadDecimal]", numpad_separator: "[NumpadComma]", capslock: "[Capslock]", f1: "[F1]", f2: "[F2]", f3: "[F3]", f4: "[F4]", f5: "[F5]", f6: "[F6]", f7: "[F7]", f8: "[F8]", f9: "[F9]", f10: "[F10]", f11: "[F11]", f12: "[F12]", f13: "[F13]", f14: "[F14]", f15: "[F15]", f16: "[F16]", f17: "[F17]", f18: "[F18]", f19: "[F19]" }, Oi = [];
function al() {
  switch (Ct()) {
    case "macos":
    case "ios":
      return "apple";
    case "windows":
      return "windows";
  }
  return "linux";
}
function Je(t38) {
  (!t38.platform || t38.platform === al()) && Oi.push(t38);
}
function Su(t38, e) {
  var i;
  let r = { shift: false, alt: false, cmd: false, win: false, meta: false, ctrl: false, key: "" };
  if (!t38) return r;
  for (let [n, o] of Object.entries(e.mapping)) {
    if (o[0] === t38) return r.key = `[${n}]`, r;
    if (o[1] === t38) return r.shift = true, r.key = `[${n}]`, r;
    if (o[2] === t38) return r.alt = true, r.key = `[${n}]`, r;
    if (o[3] === t38) return r.shift = true, r.alt = true, r.key = `[${n}]`, r;
  }
  return r.key = (i = of[t38]) != null ? i : "", r;
}
function ku(t38) {
  if (t38.code) return t38;
  let e = Object.entries(yr().mapping), r = false, i = false, n = "";
  for (let o = 0; o < 4; o++) {
    for (let [a, s] of e) if (s[o] === t38.key) {
      n = a, o === 3 ? (r = true, i = true) : o === 2 ? r = true : o === 1 && (i = true);
      break;
    }
    if (n) break;
  }
  return new KeyboardEvent(t38.type, g(h({}, t38), { altKey: r, shiftKey: i, code: n }));
}
function Lu(t38) {
  var r, i;
  if (!t38 || t38.key === "Unidentified" || t38.key === "Dead") return;
  let e = t38.shiftKey && t38.altKey ? 3 : t38.altKey ? 2 : t38.shiftKey ? 1 : 0;
  for (let n of Oi) ((r = n.mapping[t38.code]) == null ? void 0 : r[e]) === t38.key ? n.score += 1 : (i = n.mapping[t38.code]) != null && i[e] && (n.score = 0);
  Oi.sort((n, o) => o.score - n.score);
}
function yr() {
  return Oi[0];
}
function Cu() {
  switch (al()) {
    case "apple":
      return $o;
    case "windows":
      return il;
    case "linux":
      return nl;
  }
  return $o;
}
switch (al()) {
  case "apple":
    Je($o), Je(fu), Je(_u), Je(yu);
    break;
  case "windows":
    Je(il), Je(gu), Je(Mu), Je(xu);
    break;
  case "linux":
    Je(nl), Je(bu), Je(wu), Je(vu);
    break;
}
Je(pu);
function ee(t38) {
  return Array.isArray(t38);
}
var Eu = { en: { "keyboard.tooltip.symbols": "Symbols", "keyboard.tooltip.greek": "Greek Letters", "keyboard.tooltip.numeric": "Numeric", "keyboard.tooltip.alphabetic": "Roman Letters", "tooltip.copy to clipboard": "Copy to Clipboard", "tooltip.cut to clipboard": "Cut to Clipboard", "tooltip.paste from clipboard": "Paste from Clipboard", "tooltip.redo": "Redo", "tooltip.toggle virtual keyboard": "Toggle Virtual Keyboard", "tooltip.menu": "Menu", "tooltip.undo": "Undo", "menu.borders": "Borders", "menu.insert matrix": "Insert Matrix", "menu.array.add row above": "Add Row Before", "menu.array.add row below": "Add Row After", "menu.array.add column after": "Add Column After", "menu.array.add column before": "Add Column Before", "menu.array.delete row": "Delete Row", "menu.array.delete rows": "Delete Selected Rows", "menu.array.delete column": "Delete Column", "menu.array.delete columns": "Delete Selected Columns", "menu.mode": "Mode", "menu.mode-math": "Math", "menu.mode-text": "Text", "menu.mode-latex": "LaTeX", "menu.insert": "Insert", "menu.insert.abs": "Absolute Value", "menu.insert.abs-template": "\\left|x\\right|", "menu.insert.nth-root": "n<sup>th</sup> Root", "menu.insert.nth-root-template": "\\sqrt[n]{x}", "menu.insert.log-base": "Logarithm base a", "menu.insert.log-base-template": "\\log_a(x)", "menu.insert.heading-calculus": "Calculus", "menu.insert.derivative": "Derivative", "menu.insert.derivative-template": "\\dfrac{\\mathrm{d}}{\\mathrm{d}x}f(x)\\bigm|_{x=a}", "menu.insert.nth-derivative": "n<sup>th</sup> derivative", "menu.insert.nth-derivative-template": "\\dfrac{\\mathrm{d}^n}{\\mathrm{d}x^n}f(x)\\bigm|_{x=a}", "menu.insert.integral": "Integral", "menu.insert.integral-template": "$\\int_a^b f(x)\\,\\mathrm{d}x$", "menu.insert.sum": "Sum", "menu.insert.sum-template": "$\\sum_{i=1}^n x_i$", "menu.insert.product": "Product", "menu.insert.product-template": "\\prod_{i=1}^n x_i", "menu.insert.heading-complex-numbers": "Complex Numbers", "menu.insert.modulus": "Modulus", "menu.insert.modulus-template": "\\lvert z \\rvert", "menu.insert.argument": "Argument", "menu.insert.argument-template": "\\arg(z)", "menu.insert.real-part": "Real Part", "menu.insert.real-part-template": "\\Re(z)", "menu.insert.imaginary-part": "Imaginary Part", "menu.insert.imaginary-part-template": "\\Im(z)", "menu.insert.conjugate": "Conjugate", "menu.insert.conjugate-template": "\\overline{z}", "tooltip.blackboard": "Blackboard", "tooltip.bold": "Bold", "tooltip.italic": "Italic", "tooltip.fraktur": "Fraktur", "tooltip.script": "Script", "tooltip.caligraphic": "Caligraphic", "tooltip.typewriter": "Typewriter", "tooltip.roman-upright": "Roman Upright", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Font Style", "menu.accent": "Accent", "menu.decoration": "Decoration", "menu.color": "Color", "menu.background-color": "Background", "menu.cut": "Cut", "menu.copy": "Copy", "menu.copy-as-latex": "Copy as LaTeX", "menu.copy-as-typst": "Copy as Typst", "menu.copy-as-ascii-math": "Copy as ASCII Math", "menu.copy-as-mathml": "Copy as MathML", "menu.paste": "Paste", "menu.select-all": "Select All", "color.red": "Red", "color.orange": "Orange", "color.yellow": "Yellow", "color.lime": "Lime", "color.green": "Green", "color.teal": "Teal", "color.cyan": "Cyan", "color.blue": "Blue", "color.indigo": "Indigo", "color.purple": "Purple", "color.magenta": "Magenta", "color.black": "Black", "color.dark-grey": "Dark Grey", "color.grey": "Grey", "color.light-grey": "Light Grey", "color.white": "White" }, ar: { "keyboard.tooltip.symbols": "حرف او رمز", "keyboard.tooltip.greek": "حروف يونانية", "keyboard.tooltip.numeric": "الرقمية", "keyboard.tooltip.alphabetic": "رموز الاحرف الرومانية", "tooltip.copy to clipboard": "نسخ إلى الحافظة", "tooltip.cut to clipboard": "قص إلى الحافظة", "tooltip.paste from clipboard": "لصق من الحافظة", "tooltip.redo": "الإعادة", "tooltip.toggle virtual keyboard": "تبديل لوحة المفاتيح الإفتراضية", "tooltip.undo": "إلغاء", "menu.insert matrix": "أدخل المصفوفة", "menu.borders": "محددات المصفوفة", "menu.array.add row above": "أضف صفًا بعد ذلك", "menu.array.add row below": "أضف الصف قبل", "menu.array.add column after": "أضف العمود بعد ذلك", "menu.array.add column before": "أضف العمود قبل", "menu.array.delete row": "احذف صف", "menu.array.delete rows": "حذف الصفوف المحددة", "menu.array.delete column": "حذف العمود", "menu.array.delete columns": "حذف الأعمدة المحددة", "menu.mode": "وضع", "menu.mode-math": "رياضيات", "menu.mode-text": "نص", "menu.mode-latex": "لاتكس", "tooltip.blackboard": "سبورة", "tooltip.bold": "عريض", "tooltip.italic": "مائل", "tooltip.fraktur": "فراكتور", "tooltip.script": "سكريبت", "tooltip.caligraphic": "كاليجرافيك", "tooltip.typewriter": "آلة كاتبة", "tooltip.roman-upright": "روماني مستقيم", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "نمط الخط", "menu.accent": "تشكيل", "menu.decoration": "زخرفة", "menu.color": "لون", "menu.background-color": "الخلفية", "menu.cut": "قص", "menu.copy": "نسخ", "menu.copy-as-latex": "نسخ كـ LaTeX", "menu.copy-as-ascii-math": "نسخ كـ ASCII Math", "menu.copy-as-mathml": "نسخ كـ MathML", "menu.paste": "لصق", "menu.select-all": "تحديد الكل", "color.red": "أحمر", "color.orange": "برتقالي", "color.yellow": "أصفر", "color.lime": "ليموني", "color.green": "أخضر", "color.teal": "سماوي", "color.cyan": "سماوي فاتح", "color.blue": "أزرق", "color.indigo": "نيلي", "color.purple": "بنفسجي", "color.magenta": "أرجواني", "color.black": "أسود", "color.dark-grey": "رمادي غامق", "color.grey": "رمادي", "color.light-grey": "رمادي فاتح", "color.white": "أبيض" }, de: { "keyboard.tooltip.symbols": "Symbole", "keyboard.tooltip.greek": "Griechische Buchstaben", "keyboard.tooltip.numeric": "Numerisch", "keyboard.tooltip.alphabetic": "Römische Buchstaben", "tooltip.copy to clipboard": "In die Zwischenablage kopieren", "tooltip.redo": "Wiederholen", "tooltip.toggle virtual keyboard": "Virtuelle Tastatur umschalten", "tooltip.undo": "Widerrufen", "menu.insert matrix": "Matrix einfügen", "menu.borders": "Matrixtrennzeichen", "menu.array.add row above": "Zeile hinzufügen nach", "menu.array.add row below": "Zeile hinzufügen vor", "menu.array.add column after": "Spalte hinzufügen nach", "menu.array.add column before": "Spalte hinzufügen vor", "menu.array.delete row": "Zeile löschen", "menu.array.delete rows": "Ausgewählte Zeilen löschen", "menu.array.delete column": "Spalte löschen", "menu.array.delete columns": "Ausgewählte Spalten löschen", "menu.mode": "Modus", "menu.mode-math": "Mathematik", "menu.mode-text": "Text", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "Tafel", "tooltip.bold": "Fett", "tooltip.italic": "Kursiv", "tooltip.fraktur": "Fraktur", "tooltip.script": "Skript", "tooltip.caligraphic": "Kalligraphie", "tooltip.typewriter": "Schreibmaschine", "tooltip.roman-upright": "Römisch aufrecht", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Schriftstil", "menu.accent": "Akzent", "menu.decoration": "Dekoration", "menu.color": "Farbe", "menu.background-color": "Hintergrund", "menu.cut": "Ausschneiden", "menu.copy": "Kopieren", "menu.copy-as-latex": "Als LaTeX kopieren", "menu.copy-as-ascii-math": "Als ASCII Math kopieren", "menu.copy-as-mathml": "Als MathML kopieren", "menu.paste": "Einfügen", "menu.select-all": "Alles auswählen", "color.red": "Rot", "color.orange": "Orange", "color.yellow": "Gelb", "color.lime": "Limette", "color.green": "Grün", "color.teal": "Blaugrün", "color.cyan": "Cyan", "color.blue": "Blau", "color.indigo": "Indigo", "color.purple": "Lila", "color.magenta": "Magenta", "color.black": "Schwarz", "color.dark-grey": "Dunkelgrau", "color.grey": "Grau", "color.light-grey": "Hellgrau", "color.white": "Weiß" }, el: { "keyboard.tooltip.symbols": "σύμβολα", "keyboard.tooltip.greek": "ελληνικά γράμματα", "keyboard.tooltip.numeric": "Αριθμητικός", "keyboard.tooltip.alphabetic": "Ρωμαϊκά γράμματα", "tooltip.copy to clipboard": "Αντιγραφή στο πρόχειρο", "tooltip.redo": "Ξανακάνω", "tooltip.toggle virtual keyboard": "Εναλλαγή εικονικού πληκτρολογίου", "tooltip.undo": "Ξεκάνω", "menu.insert matrix": "Εισαγωγή μήτρα", "menu.borders": "Οριοθέτες μήτρα", "menu.array.add row above": "Προσθήκη σειράς μετά", "menu.array.add row below": "Προσθήκη σειράς πριν", "menu.array.add column after": "Προσθήκη στήλης μετά", "menu.array.add column before": "Προσθήκη στήλης πριν", "menu.array.delete row": "Διαγραφή σειράς", "menu.array.delete rows": "Διαγραφή επιλεγμένων σειρών", "menu.array.delete column": "Διαγραφή στήλης", "menu.array.delete columns": "Διαγραφή επιλεγμένων στηλών", "menu.mode": "Λειτουργία", "menu.mode-math": "Μαθηματικά", "menu.mode-text": "Κείμενο", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "Πίνακας", "tooltip.bold": "Έντονη", "tooltip.italic": "Πλάγια", "tooltip.fraktur": "Φράκτουρ", "tooltip.script": "Σενάριο", "tooltip.caligraphic": "Καλλιγραφική", "tooltip.typewriter": "Μηχανή γραφής", "tooltip.roman-upright": "Ρωμαϊκό Κατακόρυφο", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Στυλ γραμματοσειράς", "menu.accent": "Τόνος", "menu.decoration": "Διακόσμηση", "menu.color": "Χρώμα", "menu.background-color": "Χρώμα φόντου", "menu.cut": "Αποκοπή", "menu.copy": "Αντιγραφή", "menu.copy-as-latex": "Αντιγραφή ως LaTeX", "menu.copy-as-ascii-math": "Αντιγραφή ως ASCII Math", "menu.copy-as-mathml": "Αντιγραφή ως MathML", "menu.paste": "Επικόλληση", "menu.select-all": "Επιλογή όλων", "color.red": "Κόκκινο", "color.orange": "Πορτοκαλί", "color.yellow": "Κίτρινο", "color.lime": "Λαχανί", "color.green": "Πράσινο", "color.teal": "Κυανό", "color.cyan": "Γαλάζιο", "color.blue": "Μπλε", "color.indigo": "Ινδικό", "color.purple": "Μωβ", "color.magenta": "Ματζέντα", "color.black": "Μαύρο", "color.dark-grey": "Σκούρο Γκρι", "color.grey": "Γκρι", "color.light-grey": "Ανοιχτό Γκρι", "color.white": "Λευκό" }, es: { "keyboard.tooltip.symbols": "Símbolos", "keyboard.tooltip.greek": "Letras griegas", "keyboard.tooltip.numeric": "Numérico", "keyboard.tooltip.alphabetic": "Letras romanas", "tooltip.copy to clipboard": "Copiar al portapapeles", "tooltip.redo": "Rehacer", "tooltip.toggle virtual keyboard": "Alternar teclado virtual", "tooltip.undo": "Deshacer", "menu.insert matrix": "Añadir Matriz", "menu.borders": "Delimitadores de Matriz", "menu.array.add row above": "Añadir Línea Antes", "menu.array.add row below": "Añadir Línea Despues", "menu.array.add column after": "Añadir Columna Despues", "menu.array.add column before": "Añadir Columna Antes", "menu.array.delete row": "Borrar Línea", "menu.array.delete rows": "Borrar Líneas Seleccionadas", "menu.array.delete column": "Borrar Columna", "menu.array.delete columns": "Borrar Columnas Seleccionadas", "menu.mode": "Modo", "menu.mode-math": "Matemáticas", "menu.mode-text": "Texto", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "Pizarra", "tooltip.bold": "Negrita", "tooltip.italic": "Cursiva", "tooltip.fraktur": "Fraktur", "tooltip.script": "Script", "tooltip.caligraphic": "Caligráfico", "tooltip.typewriter": "Máquina de escribir", "tooltip.roman-upright": "Romano Vertical", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Estilo de fuente", "menu.accent": "Acento", "menu.decoration": "Decoración", "menu.color": "Color", "menu.background-color": "Fondo", "menu.cut": "Cortar", "menu.copy": "Copiar", "menu.copy-as-latex": "Copiar como LaTeX", "menu.copy-as-ascii-math": "Copiar como ASCII Math", "menu.copy-as-mathml": "Copiar como MathML", "menu.paste": "Pegar", "menu.select-all": "Seleccionar todo", "color.red": "Rojo", "color.orange": "Naranja", "color.yellow": "Amarillo", "color.lime": "Lima", "color.green": "Verde", "color.teal": "Verde azulado", "color.cyan": "Cian", "color.blue": "Azul", "color.indigo": "Índigo", "color.purple": "Morado", "color.magenta": "Magenta", "color.black": "Negro", "color.dark-grey": "Gris oscuro", "color.grey": "Gris", "color.light-grey": "Gris claro", "color.white": "Blanco" }, fr: { "keyboard.tooltip.symbols": "Symboles", "keyboard.tooltip.greek": "Lettres grecques", "keyboard.tooltip.numeric": "Numérique", "keyboard.tooltip.alphabetic": "Lettres romaines", "tooltip.menu": "Menu", "tooltip.copy to clipboard": "Copier dans le presse-papiers", "tooltip.redo": "Rétablir", "tooltip.toggle virtual keyboard": "Afficher/Masquer le clavier virtuel", "tooltip.undo": "Annuler", "menu.insert matrix": "Insérer une Matrice", "menu.borders": "Bords", "menu.array.add row above": "Ajouter une Ligne Avant", "menu.array.add row below": "Ajouter une Ligne Après", "menu.array.add column before": "Ajouter une Colonne Avant", "menu.array.add column after": "Ajouter une Colonne Après", "menu.array.delete row": "Enlever une Ligne", "menu.array.delete rows": "Enlever les Lignes Sélectionées", "menu.array.delete column": "Enlever une Colone", "menu.array.delete columns": "Enlever les Colonnes Sélectionées", "menu.mode": "Mode", "menu.mode-math": "Math", "menu.mode-text": "Text", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "Tableau noir", "tooltip.bold": "Gras", "tooltip.italic": "Italique", "tooltip.fraktur": "Fraktur", "tooltip.script": "Script", "tooltip.caligraphic": "Calligraphique", "tooltip.typewriter": "Machine à écrire", "tooltip.roman-upright": "Romain droit", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Style de police", "menu.accent": "Accent", "menu.decoration": "Décoration", "menu.color": "Couleur", "menu.background-color": "Arrière-plan", "menu.cut": "Couper", "menu.copy": "Copier", "menu.copy-as-latex": "Copier en LaTeX", "menu.copy-as-ascii-math": "Copier en ASCII Math", "menu.copy-as-mathml": "Copier en MathML", "menu.paste": "Coller", "menu.select-all": "Sélectionner tout", "color.red": "Rouge", "color.orange": "Orange", "color.yellow": "Jaune", "color.lime": "Citron vert", "color.green": "Vert", "color.teal": "Turquoise", "color.cyan": "Cyan", "color.blue": "Bleu", "color.indigo": "Indigo", "color.purple": "Violet", "color.magenta": "Magenta", "color.black": "Noir", "color.dark-grey": "Gris foncé", "color.grey": "Gris", "color.light-grey": "Gris clair", "color.white": "Blanc" }, he: { "keyboard.tooltip.symbols": "סמלים", "keyboard.tooltip.greek": "אותיות יווניות", "keyboard.tooltip.numeric": "מספרי", "keyboard.tooltip.alphabetic": "מכתבים רומיים", "tooltip.copy to clipboard": "העתק ללוח", "tooltip.redo": "לַעֲשׂוֹת שׁוּב", "tooltip.toggle virtual keyboard": "החלף את המקלדת הווירטואלית", "tooltip.undo": "לבטל", "menu.insert matrix": "הכנס מטריקס", "menu.borders": "מפרידי מטריקס", "menu.array.add row above": "הוסף שורה אחרי", "menu.array.add row below": "הוסף שורה לפני", "menu.array.add column after": "הוסף עמודה אחרי", "menu.array.add column before": "הוסף עמודה לפני", "menu.array.delete row": "מחק שורה", "menu.array.delete rows": "מחק שורות שנבחרו", "menu.array.delete column": "מחק עמודה", "menu.array.delete columns": "מחק עמודות שנבחרו", "menu.mode": "מצב", "menu.mode-math": "מתמטיקה", "menu.mode-text": "טקסט", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "לוח שחור", "tooltip.bold": "מודגש", "tooltip.italic": "נטוי", "tooltip.fraktur": "פרקטור", "tooltip.script": "כתב", "tooltip.caligraphic": "קליגרפי", "tooltip.typewriter": "מכונת כתיבה", "tooltip.roman-upright": "רומי ישר", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "סגנון גופן", "menu.accent": "צליל", "menu.decoration": "קישוט", "menu.color": "צבע", "menu.background-color": "רקע", "menu.cut": "גזור", "menu.copy": "העתק", "menu.copy-as-latex": "העתק כ־LaTeX", "menu.copy-as-ascii-math": "העתק כ־ASCII Math", "menu.copy-as-mathml": "העתק כ־MathML", "menu.paste": "הדבק", "menu.select-all": "בחר הכל", "color.red": "אדום", "color.orange": "כתום", "color.yellow": "צהוב", "color.lime": "ירוק ליים", "color.green": "ירוק", "color.teal": "טיל", "color.cyan": "ציאן", "color.blue": "כחול", "color.indigo": "אינדיגו", "color.purple": "סגול", "color.magenta": "מגנטה", "color.black": "שחור", "color.dark-grey": "אפור כהה", "color.grey": "אפור", "color.light-grey": "אפור בהיר", "color.white": "לבן" }, it: { "keyboard.tooltip.symbols": "Simboli", "keyboard.tooltip.greek": "Lettere greche", "keyboard.tooltip.numeric": "Numerico", "keyboard.tooltip.alphabetic": "Lettere romane", "tooltip.copy to clipboard": "Copia negli appunti", "tooltip.cut to clipboard": "Taglia negli appunti", "tooltip.paste from clipboard": "Incolla dagli appunti", "tooltip.redo": "Ripeti", "tooltip.toggle virtual keyboard": "Attiva/disattiva tastiera virtuale", "tooltip.menu": "Menu", "tooltip.undo": "Annulla", "menu.borders": "Delimitatori", "menu.insert matrix": "Inserisci matrice", "menu.array.add row above": "Aggiungi riga sopra", "menu.array.add row below": "Aggiungi riga sotto", "menu.array.add column after": "Aggiungi colonna dopo", "menu.array.add column before": "Aggiungi colonna prima", "menu.array.delete row": "Elimina riga", "menu.array.delete rows": "Elimina righe selezionate", "menu.array.delete column": "Elimina colonna", "menu.array.delete columns": "Elimina colonne selezionate", "menu.mode": "Modalità", "menu.mode-math": "Matematica", "menu.mode-text": "Testo", "menu.mode-latex": "LaTeX", "menu.insert": "Inserisci", "menu.insert.abs": "Valore assoluto", "menu.insert.abs-template": "\\left|x\\right|", "menu.insert.nth-root": "Radice n-esima", "menu.insert.nth-root-template": "\\sqrt[n]{x}", "menu.insert.log-base": "Logaritmo in base a", "menu.insert.log-base-template": "\\log_a(x)", "menu.insert.heading-calculus": "Calcolo", "menu.insert.derivative": "Derivata", "menu.insert.derivative-template": "\\dfrac{\\mathrm{d}}{\\mathrm{d}x}f(x)\\bigm|_{x=a}", "menu.insert.nth-derivative": "Derivata n-esima", "menu.insert.nth-derivative-template": "\\dfrac{\\mathrm{d}^n}{\\mathrm{d}x^n}f(x)\\bigm|_{x=a}", "menu.insert.integral": "Integrale", "menu.insert.integral-template": "$\\int_a^b f(x)\\,\\mathrm{d}x$", "menu.insert.sum": "Somma", "menu.insert.sum-template": "$\\sum_{i=1}^n x_i$", "menu.insert.product": "Prodotto", "menu.insert.product-template": "\\prod_{i=1}^n x_i", "menu.insert.heading-complex-numbers": "Numeri complessi", "menu.insert.modulus": "Modulo", "menu.insert.modulus-template": "\\lvert z \\rvert", "menu.insert.argument": "Argomento", "menu.insert.argument-template": "\\arg(z)", "menu.insert.real-part": "Parte reale", "menu.insert.real-part-template": "\\Re(z)", "menu.insert.imaginary-part": "Parte immaginaria", "menu.insert.imaginary-part-template": "\\Im(z)", "menu.insert.conjugate": "Coniugato", "menu.insert.conjugate-template": "\\overline{z}", "tooltip.blackboard": "Lavagna", "tooltip.bold": "Grassetto", "tooltip.italic": "Corsivo", "tooltip.fraktur": "Fraktur", "tooltip.script": "Script", "tooltip.caligraphic": "Calligrafico", "tooltip.typewriter": "Macchina da scrivere", "tooltip.roman-upright": "Romano diritto", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Stile carattere", "menu.accent": "Accento", "menu.decoration": "Decorazione", "menu.color": "Colore", "menu.background-color": "Sfondo", "menu.cut": "Taglia", "menu.copy": "Copia", "menu.copy-as-latex": "Copia come LaTeX", "menu.copy-as-ascii-math": "Copia come ASCII Math", "menu.copy-as-mathml": "Copia come MathML", "menu.paste": "Incolla", "menu.select-all": "Seleziona tutto", "color.red": "Rosso", "color.orange": "Arancione", "color.yellow": "Giallo", "color.lime": "Lime", "color.green": "Verde", "color.teal": "Verde acqua", "color.cyan": "Ciano", "color.blue": "Blu", "color.indigo": "Indaco", "color.purple": "Viola", "color.magenta": "Magenta", "color.black": "Nero", "color.dark-grey": "Grigio scuro", "color.grey": "Grigio", "color.light-grey": "Grigio chiaro", "color.white": "Bianco" }, ja: { "keyboard.tooltip.symbols": "記号", "keyboard.tooltip.greek": "ギリシア文字", "keyboard.tooltip.numeric": "数値", "keyboard.tooltip.alphabetic": "ローマ字", "tooltip.copy to clipboard": "クリップボードにコピー", "tooltip.cut to clipboard": "クリップボードに切り取り", "tooltip.paste from clipboard": "クリップボードから貼り付け", "tooltip.redo": "やり直し", "tooltip.toggle virtual keyboard": "仮想キーボードの切り替え", "tooltip.menu": "メニュー", "tooltip.undo": "元に戻す", "menu.borders": "行列の区切り文字", "menu.insert matrix": "行列を挿入", "menu.array.add row above": "後に行を追加", "menu.array.add row below": "前に行を追加", "menu.array.add column after": "後に列を追加", "menu.array.add column before": "前に列を追加", "menu.array.delete row": "行を削除", "menu.array.delete rows": "選択した行を削除", "menu.array.delete column": "列を削除", "menu.array.delete columns": "選択した列を削除", "menu.mode": "モード", "menu.mode-math": "数式", "menu.mode-text": "テキスト", "menu.mode-latex": "LaTeX", "menu.insert": "挿入", "menu.insert.abs": "絶対値", "menu.insert.nth-root": "n 乗根", "menu.insert.log-base": "底が a の対数", "menu.insert.heading-calculus": "微積分", "menu.insert.derivative": "導関数", "menu.insert.nth-derivative": "n 階導関数", "menu.insert.integral": "積分", "menu.insert.sum": "総和", "menu.insert.product": "総積", "menu.insert.heading-complex-numbers": "複素数", "menu.insert.modulus": "絶対値", "menu.insert.argument": "偏角", "menu.insert.real-part": "実部", "menu.insert.imaginary-part": "虚部", "menu.insert.conjugate": "共役複素数", "tooltip.blackboard": "黒板", "tooltip.bold": "太字", "tooltip.italic": "イタリック体", "tooltip.fraktur": "フラクトゥール", "tooltip.script": "スクリプト", "tooltip.caligraphic": "カリグラフィック", "tooltip.typewriter": "タイプライター", "tooltip.roman-upright": "ローマ直立", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "フォントスタイル", "menu.accent": "アクセント", "menu.decoration": "装飾", "menu.color": "色", "menu.background-color": "背景", "menu.cut": "切り取り", "menu.copy": "コピー", "menu.copy-as-latex": "LaTeX としてコピー", "menu.copy-as-typst": "Typst としてコピー", "menu.copy-as-ascii-math": "ASCII Math としてコピー", "menu.copy-as-mathml": "MathML としてコピー", "menu.paste": "貼り付け", "menu.select-all": "すべて選択", "color.red": "赤", "color.orange": "オレンジ", "color.yellow": "黄色", "color.lime": "ライム", "color.green": "緑", "color.teal": "ティール", "color.cyan": "シアン", "color.blue": "青", "color.indigo": "インディゴ", "color.purple": "紫", "color.magenta": "マゼンタ", "color.black": "黒", "color.dark-grey": "濃いグレー", "color.grey": "グレー", "color.light-grey": "薄いグレー", "color.white": "白" }, ko: { "keyboard.tooltip.symbols": "기호", "keyboard.tooltip.greek": "그리스 문자", "keyboard.tooltip.numeric": "숫자", "keyboard.tooltip.alphabetic": "로마 문자", "tooltip.copy to clipboard": "클립 보드에 복사", "tooltip.redo": "다시 실행", "tooltip.toggle virtual keyboard": "가상 키보드 전환", "tooltip.undo": "실행 취소", "menu.insert matrix": "행렬 삽입", "menu.borders": "행렬 구분 기호", "menu.array.add row above": "뒤에 행 추가", "menu.array.add row below": "앞에 행 추가", "menu.array.add column after": "뒤에 열 추가", "menu.array.add column before": "앞에 열 추가", "menu.array.delete row": "행 삭제", "menu.array.delete rows": "선택한 행 삭제", "menu.array.delete column": "열 삭제", "menu.array.delete columns": "선택한 열 삭제", "menu.mode": "모드", "menu.mode-math": "수식", "menu.mode-text": "텍스트", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "칠판", "tooltip.bold": "굵게", "tooltip.italic": "이탤릭", "tooltip.fraktur": "프랙투어", "tooltip.script": "첨자", "tooltip.caligraphic": "필기체", "tooltip.typewriter": "타자기", "tooltip.roman-upright": "일반 로마자", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "글꼴 스타일", "menu.accent": "발음 기호", "menu.decoration": "장식", "menu.color": "색상", "menu.background-color": "배경", "menu.cut": "잘라내기", "menu.copy": "복사", "menu.copy-as-latex": "LaTeX로 복사", "menu.copy-as-ascii-math": "ASCIIMath로 복사", "menu.copy-as-mathml": "MathML로 복사", "menu.paste": "붙여넣기", "menu.select-all": "모두 선택", "color.red": "빨강", "color.orange": "주황", "color.yellow": "노랑", "color.lime": "라임", "color.green": "초록", "color.teal": "청록", "color.cyan": "청색", "color.blue": "파랑", "color.indigo": "남색", "color.purple": "보라", "color.magenta": "자홍", "color.black": "검정", "color.dark-grey": "진한 회색", "color.grey": "회색", "color.light-grey": "연한 회색", "color.white": "흰색" }, pl: { "keyboard.tooltip.symbols": "Symbolika", "keyboard.tooltip.greek": "Litery greckie", "keyboard.tooltip.numeric": "Numeryczne", "keyboard.tooltip.alphabetic": "Litery rzymskie", "tooltip.copy to clipboard": "Kopiuj do Schowka", "tooltip.cut to clipboard": "Wytnij ze Schowka", "tooltip.paste from clipboard": "Wklej ze Schowka", "tooltip.redo": "Przywróć", "tooltip.toggle virtual keyboard": "Przełącz klawiaturę wirtualną", "tooltip.menu": "Menu", "tooltip.undo": "Cofnij", "menu.borders": "Ograniczniki macierzy", "menu.insert matrix": "Wstaw macierz", "menu.array.add row above": "Dodaj wiersz przed", "menu.array.add row below": "Dodaj wiersz po", "menu.array.add column after": "Dodaj kolumnę po", "menu.array.add column before": "Dodaj kolumnę przed", "menu.array.delete row": "Usuń wiersz", "menu.array.delete rows": "Usuń wybrane wiersze", "menu.array.delete column": "Usuń kolumnę", "menu.array.delete columns": "Usuń wybrane kolumny", "menu.mode": "Tryb", "menu.mode-math": "Formuła", "menu.mode-text": "Tekst", "menu.mode-latex": "LaTeX", "menu.insert": "Wstaw", "menu.insert.abs": "Wartość bezwzględna", "menu.insert.abs-template": "\\left|x\\right|", "menu.insert.nth-root": "Pierwiastek n-tego stopnia", "menu.insert.nth-root-template": "\\sqrt[n]{x}", "menu.insert.log-base": "Logarytm o podstawie a", "menu.insert.log-base-template": "\\log_a(x)", "menu.insert.heading-calculus": "Rachunek różniczkowy i całkowy", "menu.insert.derivative": "Pochodna", "menu.insert.derivative-template": "\\dfrac{\\mathrm{d}}{\\mathrm{d}x}f(x)\\bigm|_{x=a}", "menu.insert.nth-derivative": "Pochodna n-tego rzędu", "menu.insert.nth-derivative-template": "\\dfrac{\\mathrm{d}^n}{\\mathrm{d}x^n}f(x)\\bigm|_{x=a}", "menu.insert.integral": "Całka", "menu.insert.integral-template": "$\\int_a^b f(x)\\,\\mathrm{d}x$", "menu.insert.sum": "Suma", "menu.insert.sum-template": "$\\sum_{i=1}^n x_i$", "menu.insert.product": "Iloczyn", "menu.insert.product-template": "\\prod_{i=1}^n x_i", "menu.insert.heading-complex-numbers": "Liczby zespolone", "menu.insert.modulus": "Moduł", "menu.insert.modulus-template": "\\lvert z \\rvert", "menu.insert.argument": "Argument", "menu.insert.argument-template": "\\arg(z)", "menu.insert.real-part": "Część rzeczywista", "menu.insert.real-part-template": "\\Re(z)", "menu.insert.imaginary-part": "Część urojona", "menu.insert.imaginary-part-template": "\\Im(z)", "menu.insert.conjugate": "Sprzężenie", "menu.insert.conjugate-template": "\\overline{z}", "tooltip.blackboard": "Tablica", "tooltip.bold": "Pogrubienie", "tooltip.italic": "Kursywa", "tooltip.fraktur": "Fraktura", "tooltip.script": "Skrypt", "tooltip.caligraphic": "Kaligraficzny", "tooltip.typewriter": "Maszynowy", "tooltip.roman-upright": "Rzymski prosto", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Styl czcionki", "menu.accent": "Akcent", "menu.decoration": "Dekoracja", "menu.color": "Kolor", "menu.background-color": "Tło", "menu.cut": "Wytnij", "menu.copy": "Kopiuj", "menu.copy-as-latex": "Kopiuj jako LaTeX", "menu.copy-as-ascii-math": "Kopiuj jako ASCII Math", "menu.copy-as-mathml": "Kopiuj jako MathML", "menu.paste": "Wklej", "menu.select-all": "Zaznacz wszystko", "color.red": "Czerwony", "color.orange": "Pomarańczowy", "color.yellow": "Żółty", "color.lime": "Limetkowy", "color.green": "Zielony", "color.teal": "Turkusowy", "color.cyan": "Cyjan", "color.blue": "Niebieski", "color.indigo": "Indygo", "color.purple": "Fioletowy", "color.magenta": "Magenta", "color.black": "Czarny", "color.dark-grey": "Ciemnoszary", "color.grey": "Szary", "color.light-grey": "Jasnoszary", "color.white": "Biały" }, pt: { "keyboard.tooltip.symbols": "Símbolos", "keyboard.tooltip.greek": "Letras gregas", "keyboard.tooltip.numeric": "Numérico", "keyboard.tooltip.alphabetic": "Letras romanas", "tooltip.copy to clipboard": "Copiar para área de transferência", "tooltip.redo": "Refazer", "tooltip.toggle virtual keyboard": "Alternar teclado virtual", "tooltip.undo": "Desfazer", "menu.insert matrix": "Inserir Matriz", "menu.borders": "Delimitadores de matriz", "menu.array.add row above": "Adicionar linha depois", "menu.array.add row below": "Adicionar linha antes", "menu.array.add column after": "Adicionar coluna depois", "menu.array.add column before": "Adicionar coluna antes", "menu.array.delete row": "Excluir linha", "menu.array.delete rows": "Excluir linhas selecionadas", "menu.array.delete column": "Apagar Coluna", "menu.array.delete columns": "Excluir Colunas Selecionadas", "menu.mode": "Modo", "menu.mode-math": "Fórmula", "menu.mode-text": "Texto", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "Quadro Negro", "tooltip.bold": "Negrito", "tooltip.italic": "Itálico", "tooltip.fraktur": "Fraktur", "tooltip.script": "Script", "tooltip.caligraphic": "Caligráfico", "tooltip.typewriter": "Máquina de Escrever", "tooltip.roman-upright": "Romano Vertical", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Estilo da Fonte", "menu.accent": "Acento", "menu.decoration": "Decoração", "menu.color": "Cor", "menu.background-color": "Cor de Fundo", "menu.cut": "Recortar", "menu.copy": "Copiar", "menu.copy-as-latex": "Copiar como LaTeX", "menu.copy-as-ascii-math": "Copiar como ASCII Math", "menu.copy-as-mathml": "Copiar como MathML", "menu.paste": "Colar", "menu.select-all": "Selecionar Tudo", "color.red": "Vermelho", "color.orange": "Laranja", "color.yellow": "Amarelo", "color.lime": "Verde Lima", "color.green": "Verde", "color.teal": "Verde-azulado", "color.cyan": "Ciano", "color.blue": "Azul", "color.indigo": "Índigo", "color.purple": "Roxo", "color.magenta": "Magenta", "color.black": "Preto", "color.dark-grey": "Cinza Escuro", "color.grey": "Cinza", "color.light-grey": "Cinza Claro", "color.white": "Branco" }, uk: { "keyboard.tooltip.symbols": "Символи", "keyboard.tooltip.greek": "Грецькі літери", "keyboard.tooltip.numeric": "Числовий", "keyboard.tooltip.alphabetic": "Римські літери", "tooltip.copy to clipboard": "Копіювати в буфер обміну", "tooltip.cut to clipboard": "Вирізати в буфер обміну", "tooltip.paste from clipboard": "Вставити з буфера обміну", "tooltip.redo": "Повторити", "tooltip.toggle virtual keyboard": "Переключити віртуальну клавіатуру", "tooltip.menu": "Меню", "tooltip.undo": "Скасувати", "menu.borders": "Межі", "menu.insert matrix": "Вставити матрицю", "menu.array.add row above": "Додати рядок перед", "menu.array.add row below": "Додати рядок після", "menu.array.add column after": "Додати стовпець після", "menu.array.add column before": "Додати стовпець перед", "menu.array.delete row": "Видалити рядок", "menu.array.delete rows": "Видалити вибрані рядки", "menu.array.delete column": "Видалити стовпець", "menu.array.delete columns": "Видалити вибрані стовпці", "menu.mode": "Режим", "menu.mode-math": "Математика", "menu.mode-text": "Текст", "menu.mode-latex": "LaTeX", "menu.insert": "Вставити", "menu.insert.abs": "Абсолютне значення", "menu.insert.abs-template": "\\left|x\\right|", "menu.insert.nth-root": "Корінь n-го степеня", "menu.insert.nth-root-template": "\\sqrt[n]{x}", "menu.insert.log-base": "Логарифм за основою a", "menu.insert.log-base-template": "\\log_a(x)", "menu.insert.heading-calculus": "Обчислення", "menu.insert.derivative": "Похідна", "menu.insert.derivative-template": "\\dfrac{\\mathrm{d}}{\\mathrm{d}x}f(x)\\bigm|_{x=a}", "menu.insert.nth-derivative": "Похідна n-го порядку", "menu.insert.nth-derivative-template": "\\dfrac{\\mathrm{d}^n}{\\mathrm{d}x^n}f(x)\\bigm|_{x=a}", "menu.insert.integral": "Інтеграл", "menu.insert.integral-template": "$\\int_a^b f(x)\\,\\mathrm{d}x$", "menu.insert.sum": "Сума", "menu.insert.sum-template": "$\\sum_{i=1}^n x_i$", "menu.insert.product": "Добуток", "menu.insert.product-template": "\\prod_{i=1}^n x_i", "menu.insert.heading-complex-numbers": "Комплексні числа", "menu.insert.modulus": "Модуль", "menu.insert.modulus-template": "\\lvert z \\rvert", "menu.insert.argument": "Аргумент", "menu.insert.argument-template": "\\arg(z)", "menu.insert.real-part": "Дійсна частина", "menu.insert.real-part-template": "\\Re(z)", "menu.insert.imaginary-part": "Уявна частина", "menu.insert.imaginary-part-template": "\\Im(z)", "menu.insert.conjugate": "Спряжене число", "menu.insert.conjugate-template": "\\overline{z}", "tooltip.blackboard": "Дошка", "tooltip.bold": "Жирний", "tooltip.italic": "Курсив", "tooltip.fraktur": "Фрактурний", "tooltip.script": "Рукописний", "tooltip.caligraphic": "Каліграфічний", "tooltip.typewriter": "Друкарський", "tooltip.roman-upright": "Прямий римський", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "Стиль шрифту", "menu.accent": "Акцент", "menu.decoration": "Оформлення", "menu.color": "Колір", "menu.background-color": "Фон", "menu.cut": "Вирізати", "menu.copy": "Копіювати", "menu.copy-as-latex": "Копіювати як LaTeX", "menu.copy-as-ascii-math": "Копіювати як ASCII Math", "menu.copy-as-mathml": "Копіювати як MathML", "menu.paste": "Вставити", "menu.select-all": "Вибрати все", "color.red": "Червоний", "color.orange": "Помаранчевий", "color.yellow": "Жовтий", "color.lime": "Лаймовий", "color.green": "Зелений", "color.teal": "Бірюзовий", "color.cyan": "Синьо-зелений", "color.blue": "Синій", "color.indigo": "Індиго", "color.purple": "Фіолетовий", "color.magenta": "Пурпурний", "color.black": "Чорний", "color.dark-grey": "Темно-сірий", "color.grey": "Сірий", "color.light-grey": "Світло-сірий", "color.white": "Білий" }, "zh-cn": { "keyboard.tooltip.symbols": "符号", "keyboard.tooltip.greek": "希腊字母", "keyboard.tooltip.numeric": "数字", "keyboard.tooltip.alphabetic": "罗马字母", "tooltip.copy to clipboard": "复制到剪贴板", "tooltip.redo": "重做", "tooltip.toggle virtual keyboard": "切换虚拟键盘", "tooltip.undo": "撤消", "menu.insert matrix": "插入矩阵", "menu.borders": "矩阵分隔符", "menu.array.add row above": "在后面添加行", "menu.array.add row below": "在前面添加行", "menu.array.add column after": "在后面添加列r", "menu.array.add column before": "在前面添加列", "menu.array.delete row": "删除行", "menu.array.delete rows": "删除选定行", "menu.array.delete column": "删除列", "menu.array.delete columns": "删除选定的列", "menu.mode": "模式", "menu.mode-math": "数学", "menu.mode-text": "文本", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "黑板", "tooltip.bold": "粗体", "tooltip.italic": "斜体", "tooltip.fraktur": "Fraktur", "tooltip.script": "脚本", "tooltip.caligraphic": "草书", "tooltip.typewriter": "打字机", "tooltip.roman-upright": "罗马直立", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "字体样式", "menu.accent": "重音", "menu.decoration": "装饰", "menu.color": "颜色", "menu.background-color": "背景", "menu.cut": "剪切", "menu.copy": "复制", "menu.copy-as-latex": "复制为 LaTeX", "menu.copy-as-ascii-math": "复制为 ASCII Math", "menu.copy-as-mathml": "复制为 MathML", "menu.paste": "粘贴", "menu.select-all": "全选", "color.red": "红色", "color.orange": "橙色", "color.yellow": "黄色", "color.lime": "绿黄色", "color.green": "绿色", "color.teal": "青色", "color.cyan": "蓝绿色", "color.blue": "蓝色", "color.indigo": "靛蓝色", "color.purple": "紫色", "color.magenta": "洋红色", "color.black": "黑色", "color.dark-grey": "深灰色", "color.grey": "灰色", "color.light-grey": "浅灰色", "color.white": "白色" }, "zh-tw": { "keyboard.tooltip.symbols": "符號", "keyboard.tooltip.greek": "希臘字母", "keyboard.tooltip.numeric": "數字", "keyboard.tooltip.alphabetic": "羅馬字母", "tooltip.copy to clipboard": "複製到剪貼板", "tooltip.redo": "重做", "tooltip.toggle virtual keyboard": "切換虛擬鍵盤", "tooltip.undo": "撤消", "menu.insert matrix": "插入矩陣", "menu.borders": "矩陣分隔符", "menu.array.add row above": "在後面添加行", "menu.array.add row below": "在前面添加行", "menu.array.add column after": "在後面添加列", "menu.array.add column before": "在前面添加列", "menu.array.delete row": "刪除行", "menu.array.delete rows": "刪除選定行", "menu.array.delete column": "刪除列", "menu.array.delete columns": "刪除選定的列", "menu.mode": "模式", "menu.mode-math": "數學", "menu.mode-text": "文本", "menu.mode-latex": "LaTeX", "tooltip.blackboard": "黑板", "tooltip.bold": "粗體", "tooltip.italic": "斜體", "tooltip.fraktur": "Fraktur", "tooltip.script": "腳本", "tooltip.caligraphic": "草書", "tooltip.typewriter": "打字機", "tooltip.roman-upright": "羅馬直立", "tooltip.row-by-col": "%@ × %@", "menu.font-style": "字體樣式", "menu.accent": "重音", "menu.decoration": "裝飾", "menu.color": "顏色", "menu.background-color": "背景", "menu.cut": "剪下", "menu.copy": "複製", "menu.copy-as-latex": "複製為 LaTeX", "menu.copy-as-ascii-math": "複製為 ASCII Math", "menu.copy-as-mathml": "複製為 MathML", "menu.paste": "貼上", "menu.select-all": "全選", "color.red": "紅色", "color.orange": "橙色", "color.yellow": "黃色", "color.lime": "綠黃色", "color.green": "綠色", "color.teal": "青色", "color.cyan": "藍綠色", "color.blue": "藍色", "color.indigo": "靛藍色", "color.purple": "紫色", "color.magenta": "洋紅色", "color.black": "黑色", "color.dark-grey": "深灰色", "color.grey": "灰色", "color.light-grey": "淺灰色", "color.white": "白色" } };
var F = { strings: Eu, _locale: "", _dirty: false, _subscribers: [], _numberFormatter: void 0, get locale() {
  return F._locale || (F._locale = Le() ? navigator.language.slice(0, 5) : "en-US"), F._locale;
}, set locale(t38) {
  F._locale = t38, F._numberFormatter = void 0, F.dirty = true;
}, get numberFormatter() {
  if (!F._numberFormatter) try {
    F._numberFormatter = new Intl.NumberFormat(F.locale);
  } catch (t38) {
    try {
      F._numberFormatter = new Intl.NumberFormat(F.locale.slice(0, 2));
    } catch (e) {
      F._numberFormatter = new Intl.NumberFormat("en-US");
    }
  }
  return F._numberFormatter;
}, merge(t38, e) {
  if (typeof t38 == "string" && e) F.strings[t38] = h(h({}, F.strings[t38]), e), F.dirty = true;
  else for (let r of Object.keys(t38)) F.merge(r, t38[r]);
}, get dirty() {
  return F._dirty;
}, set dirty(t38) {
  F._dirty || F._dirty === t38 || (F._dirty = true, setTimeout(() => {
    F._dirty = false, this._subscribers.forEach((e) => e == null ? void 0 : e());
  }, 0));
}, subscribe(t38) {
  return F._subscribers.push(t38), F._subscribers.length - 1;
}, unsubscribe(t38) {
  t38 < 0 || t38 >= F._subscribers.length || (F._subscribers[t38] = void 0);
}, update(t38) {
  let e = t38.querySelectorAll("[data-l10n-tooltip]");
  for (let r of e) {
    let i = r.getAttribute("data-l10n-tooltip");
    if (i) {
      let n = $(i);
      n && r.setAttribute("data-tooltip", n);
    }
  }
  e = t38.querySelectorAll("[data-l10n-arial-label]");
  for (let r of e) {
    let i = r.getAttribute("data-l10n-arial-label");
    if (i) {
      let n = $(i);
      n && r.setAttribute("aria-label", n);
    }
  }
} };
function $(t38, ...e) {
  if (t38 === void 0) return;
  let r = "", i = F.locale;
  F.strings[i] && (r = F.strings[i][t38]);
  let n = i.slice(0, 2);
  if (!r && F.strings[n] && (r = F.strings[n][t38]), r || (r = F.strings.en[t38]), !r) return;
  let o = /(%@|%([0-9]+)\$@)/g, a = o.exec(r), s = 0;
  for (; a; ) {
    if (e[s++]) {
      let c = a[2] ? parseInt(a[2], 10) - 1 : s - 1, u = e[c];
      typeof u == "number" && (u = F.numberFormatter.format(u)), r = r.replace(a[1], u);
    }
    a = o.exec(r);
  }
  return r = r.replace(/%%/g, "%"), r;
}
var lf = { m0: "#3F3D99", m1: "#993D71", m2: "#998B3D", m3: "#3D9956", m4: "#3D5A99", m5: "#993D90", m6: "#996D3D", m7: "#43993D", m8: "#3D7999", m9: "#843D99" }, cf = { blue: "#0072BD", orange: "#D95319", yellow: "#EDB120", purple: "#7E2F8E", green: "#77AC30", cyan: "#4DBEEE", red: "#A2142F" }, Qt = { red: "#fbbbb6", orange: "#ffe0c2", yellow: "#fff1c2", lime: "#d0e8b9", green: "#bceac4", teal: "#b9f1f1", cyan: "#b8e5c9", blue: "#b6d9fb", indigo: "#d1c2f0", purple: "#e3baf8", magenta: "#f9c8e0", black: "#353535", "dark-grey": "#8C8C8C", grey: "#D0D0D0", "light-grey": "#F0F0F0", white: "#ffffff" }, er = { red: "#d7170b", orange: "#fe8a2b", yellow: "#ffc02b", lime: "#63b215", green: "#21ba3a", teal: "#17cfcf", cyan: "#13a7ec", blue: "#0d80f2", indigo: "#63c", purple: "#a219e6", magenta: "#eb4799", black: "#000", "dark-grey": "#666", grey: "#A6A6A6", "light-grey": "#d4d5d2", white: "#ffffff" }, Tu = { Red: "red", Orange: "orange", Yellow: "yellow", LimeGreen: "lime", Green: "green", TealBlue: "teal", Blue: "blue", Violet: "indigo", Purple: "purple", Magenta: "magenta", Black: "black", Gray: "grey", White: "white" }, uf = { Apricot: "#FBB982", Aquamarine: "#00B5BE", Bittersweet: "#C04F17", Black: "#221E1F", Blue: "#2D2F92", BlueGreen: "#00B3B8", BlueViolet: "#473992", BrickRed: "#B6321C", Brown: "#792500", BurntOrange: "#F7921D", CadetBlue: "#74729A", CarnationPink: "#F282B4", Cerulean: "#00A2E3", CornflowerBlue: "#41B0E4", Cyan: "#00AEEF", Dandelion: "#FDBC42", DarkOrchid: "#A4538A", Emerald: "#00A99D", ForestGreen: "#009B55", Fuchsia: "#8C368C", Goldenrod: "#FFDF42", Gray: "#949698", Green: "#00A64F", GreenYellow: "#DFE674", JungleGreen: "#00A99A", Lavender: "#F49EC4", Limegreen: "#8DC73E", Magenta: "#EC008C", Mahogany: "#A9341F", Maroon: "#AF3235", Melon: "#F89E7B", MidnightBlue: "#006795", Mulberry: "#A93C93", NavyBlue: "#006EB8", OliveGreen: "#3C8031", Orange: "#F58137", OrangeRed: "#ED135A", Orchid: "#AF72B0", Peach: "#F7965A", Periwinkle: "#7977B8", PineGreen: "#008B72", Plum: "#92268F", ProcessBlue: "#00B0F0", Purple: "#99479B", RawSienna: "#974006", Red: "#ED1B23", RedOrange: "#F26035", RedViolet: "#A1246B", Rhodamine: "#EF559F", RoyalBlue: "#0071BC", RoyalPurple: "#613F99", RubineRed: "#ED017D", Salmon: "#F69289", SeaGreen: "#3FBC9D", Sepia: "#671800", SkyBlue: "#46C5DD", SpringGreen: "#C6DC67", Tan: "#DA9D76", TealBlue: "#00AEB3", Thistle: "#D883B7", Turquoise: "#00B4CE", Violet: "#58429B", VioletRed: "#EF58A0", White: "#FFFFFF", WildStrawberry: "#EE2967", Yellow: "#FFF200", YellowGreen: "#98CC70", YellowOrange: "#FAA21A" };
function Yr(t38) {
  var u, d, m, p, f, y;
  let e = t38.split("!"), r, i, n, o = 255, a = 255, s = 255, l = -1, c = e.length > 0 && e[0].startsWith("-");
  c && (e[0] = e[0].slice(1));
  for (let v = 0; v < e.length; v++) {
    r = o, i = a, n = s;
    let b = (u = e[v].trim().match(/^([A-Za-z\d-]+)/)) == null ? void 0 : u[1], k = b == null ? void 0 : b.toLowerCase(), S = b && (y = (f = (p = (m = (d = er[k]) != null ? d : er[Tu[b]]) != null ? m : cf[b]) != null ? p : uf[b]) != null ? f : lf[b]) != null ? y : e[v].trim(), A = S.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if (A != null && A[1] && A[2] && A[3]) o = Math.max(0, Math.min(255, Number.parseInt(A[1], 16))), a = Math.max(0, Math.min(255, Number.parseInt(A[2], 16))), s = Math.max(0, Math.min(255, Number.parseInt(A[3], 16)));
    else if (A = S.match(/^#([\da-f]{3})$/i), A != null && A[1]) {
      let E = Number.parseInt(A[1][0], 16), C = Number.parseInt(A[1][1], 16), _ = Number.parseInt(A[1][2], 16);
      o = Math.max(0, Math.min(255, E * 16 + E)), a = Math.max(0, Math.min(255, C * 16 + C)), s = Math.max(0, Math.min(255, _ * 16 + _));
    } else if (A = S.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i), A != null && A[1] && A[2] && A[3]) o = Math.max(0, Math.min(255, Number.parseInt(A[1]))), a = Math.max(0, Math.min(255, Number.parseInt(A[2]))), s = Math.max(0, Math.min(255, Number.parseInt(A[3])));
    else return;
    l >= 0 && (o = (1 - l) * o + l * r, a = (1 - l) * a + l * i, s = (1 - l) * s + l * n, l = -1), v + 1 < e.length && (l = Math.max(0, Math.min(100, Number.parseInt(e[++v]))) / 100);
  }
  return l >= 0 && (o = l * o + (1 - l) * r, a = l * a + (1 - l) * i, s = l * s + (1 - l) * n), c && (o = 255 - o, a = 255 - a, s = 255 - s), "#" + ("00" + Math.round(o).toString(16)).slice(-2) + ("00" + Math.round(a).toString(16)).slice(-2) + ("00" + Math.round(s).toString(16)).slice(-2);
}
function Bi(t38) {
  var e, r;
  return t38 = t38.trim(), (r = (e = Qt[t38.toLowerCase()]) != null ? e : Qt[Tu[t38]]) != null ? r : Yr(t38);
}
function df(t38) {
  if (!t38 || t38[0] !== "#") return;
  t38 = t38.slice(1);
  let e;
  return t38.length <= 4 ? (e = { r: parseInt(t38[0] + t38[0], 16), g: parseInt(t38[1] + t38[1], 16), b: parseInt(t38[2] + t38[2], 16) }, t38.length === 4 && (e.a = parseInt(t38[3] + t38[3], 16) / 255)) : (e = { r: parseInt(t38[0] + t38[1], 16), g: parseInt(t38[2] + t38[3], 16), b: parseInt(t38[4] + t38[5], 16) }, t38.length === 8 && (e.a = parseInt(t38[6] + t38[7], 16) / 255)), e && e.a === void 0 && (e.a = 1), e;
}
function sl(t38, e, r) {
  return r < 0 && (r += 6), r >= 6 && (r -= 6), r < 1 ? (e - t38) * r + t38 : r < 3 ? e : r < 4 ? (e - t38) * (4 - r) + t38 : t38;
}
function mf(t38) {
  let [e, r, i] = [t38.h, t38.s, t38.l];
  e = (e + 360) % 360 / 60, i = Math.max(0, Math.min(i, 1)), r = Math.max(0, Math.min(r, 1));
  let n = i <= 0.5 ? i * (r + 1) : i + r - i * r, o = i * 2 - n;
  return { r: Math.round(255 * sl(o, n, e + 2)), g: Math.round(255 * sl(o, n, e)), b: Math.round(255 * sl(o, n, e - 2)) };
}
function ll(t38) {
  return t38 < 0 ? 0 : t38 > 255 ? 255 : Math.round(t38);
}
function hf(t38) {
  let { r: e, g: r, b: i } = t38, n = ((1 << 24) + (ll(e) << 16) + (ll(r) << 8) + ll(i)).toString(16).slice(1);
  return n[0] === n[1] && n[2] === n[3] && n[4] === n[5] && n[6] === n[7] && (n = n[0] + n[2] + n[4]), "#" + n;
}
function pf(t38) {
  let { r: e, g: r, b: i } = t38;
  e = e / 255, r = r / 255, i = i / 255;
  let n = Math.min(e, r, i), o = Math.max(e, r, i), a = o - n, s, l;
  o === n ? s = 0 : e === o ? s = (r - i) / a : r === o ? s = 2 + (i - e) / a : i === o && (s = 4 + (e - r) / a), s = Math.min(s * 60, 360), s < 0 && (s += 360);
  let c = (n + o) / 2;
  return o === n ? l = 0 : c <= 0.5 ? l = a / (o + n) : l = a / (2 - o - n), { h: s, s: l, l: c };
}
function Du(t38) {
  let e = df(t38);
  if (!e) return t38;
  let { h: r, s: i, l: n } = pf(e);
  return i += 0.1, n -= 0.1, hf(mf({ h: r, s: i, l: n }));
}
var ul = { 60: "\\lt", 62: "\\gt", 111: "o", 38: "\\&", 123: "\\lbrace", 125: "\\rbrace", 91: "\\lbrack", 93: "\\rbrack", 58: "\\colon", 160: "~", 172: "\\neg", 183: "\\cdot", 188: "\\frac{1}{4}", 189: "\\frac{1}{2}", 190: "\\frac{3}{4}", 8304: "^{0}", 8305: "^{i}", 185: "^{1}", 178: "^{2}", 179: "^{3}", 8224: "\\dagger", 8225: "\\ddagger", 8230: "\\ldots", 8308: "^{4}", 8309: "^{5}", 8310: "^{6}", 8311: "^{7}", 8312: "^{8}", 8313: "^{9}", 8314: "^{+}", 8315: "^{-}", 8316: "^{=}", 8319: "^{n}", 8320: "_{0}", 8321: "_{1}", 8322: "_{2}", 8323: "_{3}", 8324: "_{4}", 8325: "_{5}", 8326: "_{6}", 8327: "_{7}", 8328: "_{8}", 8329: "_{9}", 8330: "_{+}", 8331: "_{-}", 8332: "_{=}", 8336: "_{a}", 8337: "_{e}", 8338: "_{o}", 8339: "_{x}", 8242: "\\prime", 39: "\\prime", 8592: "\\gets", 8594: "\\to", 9651: "\\triangle", 9661: "\\triangledown", 8715: "\\owns", 8727: "\\ast", 8739: "\\vert", 8741: "\\Vert", 8743: "\\land", 8744: "\\lor", 8901: "\\cdot", 8904: "\\bowtie", 8800: "\\ne", 8804: "\\le", 8805: "\\ge", 8869: "\\bot", 10178: "\\perp", 10231: "\\biconditional", 10232: "\\impliedby", 10233: "\\implies", 10234: "\\iff", 8450: "\\mathbb{C}", 8469: "\\mathbb{N}", 8473: "\\mathbb{P}", 8474: "\\mathbb{Q}", 8477: "\\mathbb{R}", 8484: "\\mathbb{Z}", 8461: "\\mathbb{H}", 8476: "\\Re", 8465: "\\Im", 42: "\\ast", 11036: "\\square", 9633: "\\square", 8720: "\\coprod", 8716: "\\not\\ni", 9671: "\\diamond", 8846: "\\uplus", 8851: "\\sqcap", 8852: "\\sqcup", 8768: "\\wr", 8750: "\\oint", 8226: "\\textbullet", 8722: "-", 978: "\\Upsilon" }, cl = { 119893: 8462, 119965: 8492, 119968: 8496, 119969: 8497, 119971: 8459, 119972: 8464, 119975: 8466, 119976: 8499, 119981: 8475, 119994: 8495, 119996: 8458, 120004: 8500, 120070: 8493, 120075: 8460, 120076: 8465, 120085: 8476, 120093: 8488, 120122: 8450, 120127: 8461, 120133: 8469, 120135: 8473, 120136: 8474, 120137: 8477, 120145: 8484 }, Ou = [{ start: 119808, len: 26, offset: 65, style: "bold" }, { start: 119834, len: 26, offset: 97, style: "bold" }, { start: 120488, len: 25, offset: 913, style: "bold" }, { start: 120514, len: 25, offset: 945, style: "bold" }, { start: 119860, len: 26, offset: 65, style: "italic" }, { start: 119886, len: 26, offset: 97, style: "italic" }, { start: 120546, len: 25, offset: 913, style: "italic" }, { start: 120572, len: 25, offset: 945, style: "italic" }, { start: 119912, len: 26, offset: 65, style: "bolditalic" }, { start: 119938, len: 26, offset: 97, style: "bolditalic" }, { start: 120604, len: 25, offset: 913, style: "bolditalic" }, { start: 120630, len: 25, offset: 945, style: "bolditalic" }, { start: 120782, len: 10, offset: 48, variant: "main", style: "bold" }, { start: 119964, len: 26, offset: 65, variant: "script" }, { start: 119990, len: 26, offset: 97, variant: "script" }, { start: 120016, len: 26, offset: 65, variant: "script", style: "bold" }, { start: 120042, len: 26, offset: 97, variant: "script", style: "bold" }, { start: 120068, len: 26, offset: 65, variant: "fraktur" }, { start: 120094, len: 26, offset: 97, variant: "fraktur" }, { start: 120172, len: 26, offset: 65, variant: "fraktur", style: "bold" }, { start: 120198, len: 26, offset: 97, variant: "fraktur", style: "bold" }, { start: 120120, len: 26, offset: 65, variant: "double-struck" }, { start: 120146, len: 26, offset: 97, variant: "double-struck" }, { start: 120792, len: 10, offset: 48, variant: "double-struck" }, { start: 120432, len: 26, offset: 65, variant: "monospace" }, { start: 120458, len: 26, offset: 97, variant: "monospace" }, { start: 120822, len: 10, offset: 48, variant: "monospace" }, { start: 120224, len: 26, offset: 65, variant: "sans-serif" }, { start: 120250, len: 26, offset: 97, variant: "sans-serif" }, { start: 120276, len: 26, offset: 65, variant: "sans-serif", style: "bold" }, { start: 120302, len: 26, offset: 97, variant: "sans-serif", style: "bold" }, { start: 120328, len: 26, offset: 65, variant: "sans-serif", style: "italic" }, { start: 120354, len: 26, offset: 97, variant: "sans-serif", style: "italic" }, { start: 120380, len: 26, offset: 65, variant: "sans-serif", style: "bolditalic" }, { start: 120406, len: 26, offset: 97, variant: "sans-serif", style: "bolditalic" }, { start: 120662, len: 25, offset: 913, variant: "sans-serif", style: "bold" }, { start: 120688, len: 25, offset: 945, variant: "sans-serif", style: "bold" }, { start: 120720, len: 25, offset: 913, variant: "sans-serif", style: "bolditalic" }, { start: 120746, len: 25, offset: 945, variant: "sans-serif", style: "bolditalic" }, { start: 120803, len: 10, offset: 48, variant: "sans-serif" }, { start: 120812, len: 10, offset: 48, variant: "sans-serif", style: "bold" }];
function Bn(t38, e, r) {
  if (!/[A-Za-z\d]/.test(t38) || (r === "up" && (r = void 0), !e && !r)) return;
  let i = t38.codePointAt(0);
  if (i === void 0) return t38;
  for (let n of Ou) if ((!e || n.variant === e) && (!r || n.style === r) && i >= n.offset && i < n.offset + n.len) {
    let o = n.start + i - n.offset;
    return String.fromCodePoint(cl[o] || o);
  }
}
function ff(t38) {
  var e;
  if ((t38 < 119808 || t38 > 120831) && (t38 < 8448 || t38 > 8527)) return { char: String.fromCodePoint(t38) };
  for (let r in cl) if (cl[r] === t38) {
    t38 = (e = r.codePointAt(0)) != null ? e : 0;
    break;
  }
  for (let r of Ou) if (t38 >= r.start && t38 < r.start + r.len) return { char: String.fromCodePoint(t38 - r.start + r.offset), variant: r.variant, style: r.style };
  return { char: String.fromCodePoint(t38) };
}
function Bu(t38) {
  var a;
  if ("{}<>[]$&*#^_%:'˜".includes(t38) || t38.length > 1) return;
  let e = (a = t38.codePointAt(0)) != null ? a : 0, r = ul[e];
  if (r) return r;
  let { char: i, variant: n, style: o } = ff(e);
  if (!(!n && !o)) {
    switch (r = i, n) {
      case "double-struck":
        r = `\\mathbb{${r}}`;
        break;
      case "fraktur":
        r = `\\mathfrak{${r}}`;
        break;
      case "script":
        r = `\\mathscr{${r}}`;
        break;
      case "sans-serif":
        r = `\\mathsf{${r}}`;
        break;
      case "monospace":
        r = `\\mathtt{${r}}`;
        break;
      case "calligraphic":
        r = `\\mathcal{${r}}`;
        break;
    }
    switch (o) {
      case "bold":
        r = `\\mathbf{${r}}`;
        break;
      case "italic":
        r = `\\mathit{${r}}`;
        break;
      case "bolditalic":
        r = `\\mathbfit{${r}}`;
        break;
    }
    return r;
  }
}
function T(t38) {
  return t38 ? Array.isArray(t38) ? t38 : typeof t38 == "object" && "group" in t38 ? t38.group : [] : [];
}
var Kn = {}, Ho = h({}, ul), Pi = {}, ml = {}, gf = { darr: "\\downarrow", dArr: "\\Downarrow", Darr: "\\Downarrow", lang: "\\langle", rang: "\\rangle", uarr: "\\uparrow", uArr: "\\Uparrow", Uarr: "\\Uparrow", C: "\\mathbb{C}", H: "\\mathbb{H}", N: "\\mathbb{N}", Q: "\\mathbb{Q}", R: "\\mathbb{R}", Z: "\\mathbb{Z}", alef: "\\aleph", alefsym: "\\aleph", Alpha: "\\mathrm{A}", Beta: "\\mathrm{B}", bull: "\\bullet", Chi: "\\mathrm{X}", clubs: "\\clubsuit", cnums: "\\mathbb{C}", Complex: "\\mathbb{C}", Dagger: "\\ddagger", diamonds: "\\diamondsuit", doublecap: "\\Cap", doublecup: "\\Cup", empty: "\\emptyset", Epsilon: "\\mathrm{E}", Eta: "\\mathrm{H}", exist: "\\exists", hArr: "\\Leftrightarrow", harr: "\\leftrightarrow", Harr: "\\Leftrightarrow", hearts: "\\heartsuit", image: "\\Im", infin: "\\infty", Iota: "\\mathrm{I}", isin: "\\in", Kappa: "\\mathrm{K}", larr: "\\leftarrow", Larr: "\\Leftarrow", lArr: "\\Leftarrow", lrarr: "\\leftrightarrow", Lrarr: "\\Leftrightarrow", lrArr: "\\Leftrightarrow", Mu: "\\mathrm{M}", natnums: "\\mathbb{N}", Nu: "\\mathrm{N}", Omicron: "\\mathrm{O}", part: "\\partial", plusmn: "\\pm", rarr: "\\rightarrow", Rarr: "\\Rightarrow", rArr: "\\Rightarrow", real: "\\Re", reals: "\\mathbb{R}", Reals: "\\mathbb{R}", restriction: "\\upharpoonright", Rho: "\\mathrm{P}", sdot: "\\cdot", sect: "\\S", spades: "\\spadesuit", sub: "\\subset", sube: "\\subseteq", supe: "\\supseteq", Tau: "\\mathrm{T}", thetasym: "\\vartheta", varcoppa: "\\coppa", weierp: "\\wp", Zeta: "\\mathrm{Z}" }, bf = { varGamma: "\\mathit{\\Gamma}", varDelta: "\\mathit{\\Delta}", varTheta: "\\mathit{\\Theta}", varLambda: "\\mathit{\\Lambda}", varXi: "\\mathit{\\Xi}", varPi: "\\mathit{\\Pi}", varSigma: "\\mathit{\\Sigma}", varUpsilon: "\\mathit{\\Upsilon}", varPhi: "\\mathit{\\Phi}", varPsi: "\\mathit{\\Psi}", varOmega: "\\mathit{\\Omega}", pmod: { def: "\\quad(\\operatorname{mod}\\ #1)", args: 1, expand: false, captureSelection: false }, mod: { def: "\\quad\\operatorname{mod}\\,\\,#1", args: 1, expand: false }, bmod: { def: "\\;\\mathbin{\\operatorname{mod }}", expand: false } }, yf = { bra: { def: "\\mathinner{\\langle{#1}|}", args: 1, captureSelection: false }, ket: { def: "\\mathinner{|{#1}\\rangle}", args: 1, captureSelection: false }, braket: { def: "\\mathinner{\\langle{#1}\\rangle}", args: 1, captureSelection: false }, set: { def: "\\mathinner{\\lbrace #1 \\rbrace}", args: 1, captureSelection: false }, Bra: { def: "\\left\\langle #1\\right|", args: 1, captureSelection: false }, Ket: { def: "\\left|#1\\right\\rangle", args: 1, captureSelection: false }, Braket: { def: "\\left\\langle{#1}\\right\\rangle", args: 1, captureSelection: false }, Set: { def: "\\left\\lbrace #1 \\right\\rbrace", args: 1, captureSelection: false } }, xf = { strut: { primitive: true, def: "\\phantom{\\rule[0.3\\baselineskip]{0}{0.7\\baselineskip}}", args: 0, captureSelection: true }, iff: { primitive: true, captureSelection: true, def: "\\;\\Longleftrightarrow\\;" }, nicefrac: "^{#1}\\!\\!/\\!_{#2}", phase: { def: "\\enclose{phasorangle}{#1}", args: 1, captureSelection: false }, rd: "\\mathrm{d}", rD: "\\mathrm{D}", odif: "\\mathrm{d}", doubleStruckCapitalN: "\\mathbb{N}", doubleStruckCapitalR: "\\mathbb{R}", doubleStruckCapitalQ: "\\mathbb{Q}", doubleStruckCapitalZ: "\\mathbb{Z}", doubleStruckCapitalP: "\\mathbb{P}", scriptCapitalE: "\\mathscr{E}", scriptCapitalH: "\\mathscr{H}", scriptCapitalL: "\\mathscr{L}", gothicCapitalC: "\\mathfrak{C}", gothicCapitalH: "\\mathfrak{H}", gothicCapitalI: "\\mathfrak{I}", gothicCapitalR: "\\mathfrak{R}", imaginaryI: "\\mathrm{i}", imaginaryJ: "\\mathrm{j}", exponentialE: "\\mathrm{e}", differentialD: "\\mathrm{d}", capitalDifferentialD: "\\mathrm{D}", mathstrut: { def: "\\vphantom{(}", primitive: true }, angl: "\\enclose{actuarial}{#1}", angln: "\\enclose{actuarial}{n}", anglr: "\\enclose{actuarial}{r}", anglk: "\\enclose{actuarial}{k}", mathtools: { primitive: true, package: { ordinarycolon: ":", vcentcolon: "\\mathrel{\\mathop\\ordinarycolon}", dblcolon: '{\\mathop{\\char"2237}}', coloneqq: '{\\mathop{\\char"2254}}', Coloneqq: '{\\mathop{\\char"2A74}}', coloneq: '{\\mathop{\\char"2254}}', Coloneq: '{\\mathop{\\char"2A74}}', eqqcolon: '{\\mathop{\\char"2255}}', Eqqcolon: '{\\mathop{\\char"3D\\char"2237}}', eqcolon: '{\\mathop{\\char"2255}}', Eqcolon: '{\\mathop{\\char"3D\\char"2237}}', colonapprox: '{\\mathop{\\char"003A\\char"2248}}', Colonapprox: '{\\mathop{\\char"2237\\char"2248}}', colonsim: '{\\mathop{\\char"3A\\char"223C}}', Colonsim: '{\\mathop{\\char"2237\\char"223C}}', colondash: "\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}", Colondash: "\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}", dashcolon: "\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}", Dashcolon: "\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}" } }, ratio: "\\vcentcolon", coloncolon: "\\dblcolon", colonequals: "\\coloneq", coloncolonequals: "\\Coloneq", equalscolon: "\\eqcolon", equalscoloncolon: "\\Eqcolon", colonminus: "\\colondash", coloncolonminus: "\\Colondash", minuscolon: "\\dashcolon", minuscoloncolon: "\\Dashcolon", coloncolonapprox: "\\Colonapprox", coloncolonsim: "\\Colonsim", simcolon: "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}", Simcolon: "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}", simcoloncolon: "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}", approxcolon: "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}", Approxcolon: "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}", approxcoloncolon: "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}", notni: "\\mathrel{\\char`∌}", limsup: "\\operatorname*{lim\\,sup}", liminf: "\\operatorname*{lim\\,inf}", injlim: "\\operatorname*{inj\\,lim}", projlim: "\\operatorname*{proj\\,lim}", varlimsup: "\\operatorname*{\\overline{lim}}", varliminf: "\\operatorname*{\\underline{lim}}", varinjlim: "\\operatorname*{\\underrightarrow{lim}}", varprojlim: "\\operatorname*{\\underleftarrow{lim}}", argmin: "\\operatorname*{arg\\,min}", argmax: "\\operatorname*{arg\\,max}", plim: "\\mathop{\\operatorname{plim}}\\limits", tripledash: { def: "\\vphantom{-}\\raise{4mu}{\\mkern1.5mu\\rule{2mu}{1.5mu}\\mkern{2.25mu}\\rule{2mu}{1.5mu}\\mkern{2.25mu}\\rule{2mu}{1.5mu}\\mkern{2mu}}", expand: true }, "braket.sty": { package: yf }, "amsmath.sty": { package: bf, primitive: true }, "texvc.sty": { package: gf, primitive: false } }, Ki = { " ": 32, "\\!": 33, "\\#": 35, "\\$": 36, "\\%": 37, "\\&": 38, "\\_": 95, "-": 45, "\\textunderscore": 95, "\\euro": 8364, "\\maltese": 10016, "\\{": 123, "\\}": 125, "\\textbraceleft": 123, "\\textbraceright": 125, "\\lbrace": 123, "\\rbrace": 125, "\\lbrack": 91, "\\rbrack": 93, "\\nobreakspace": 160, "\\ldots": 8230, "\\textellipsis": 8230, "\\backslash": 92, "`": 8216, "'": 8217, "``": 8220, "''": 8221, "\\degree": 176, "\\textasciicircum": 94, "\\textasciitilde": 126, "\\textasteriskcentered": 42, "\\textbackslash": 92, "\\textbullet": 8226, "\\textdollar": 36, "\\textsterling": 163, "\\textdagger": 8224, "\\textdaggerdbl": 8225, "–": 8211, "—": 8212, "‘": 8216, "’": 8217, "“": 8220, "”": 8221, '"': 8221, "\\ss": 223, "\\ae": 230, "\\oe": 339, "\\AE": 198, "\\OE": 338, "\\O": 216, "\\i": 305, "\\j": 567, "\\aa": 229, "\\AA": 197 }, Ru = /[\w!@*()-=+{}\[\]\\';:?/.,~<>`|$%#&^" ]/, Wo, Qr;
hu() ? (Wo = new RegExp("\\p{Letter}", "u"), Qr = new RegExp("[0-9\\p{Letter}]", "u")) : (Wo = /[a-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒößÖẞìíòúÌÍÒÚáñÁÑ]/, Qr = /[\da-zA-ZаАбБвВгГдДеЕёЁжЖзЗиИйЙкКлЛмМнНоОпПрРсСтТуУфФхХцЦчЧшШщЩъЪыЫьЬэЭюЮяĄąĆćĘęŁłŃńÓóŚśŹźŻżàâäôéèëêïîçùûüÿæœÀÂÄÔÉÈËÊÏÎŸÇÙÛÜÆŒößÖẞìíòúÌÍÒÚáñÁÑ]/);
function dl(t38, e, r = "mord", i) {
  e !== void 0 && (Kn[t38] = { definitionType: "symbol", type: r, variant: i, codepoint: e }, Ho[e] || (Ho[e] = t38));
}
function Se(t38, e, r) {
  if (typeof t38 == "string") {
    for (let i = 0; i < t38.length; i++) {
      let n = t38.charAt(i);
      dl(n, n.codePointAt(0));
    }
    return;
  }
  for (let [i, n, o, a] of t38) dl(i, n, o != null ? o : e, a != null ? a : r);
}
function hl(t38, e) {
  for (let r = t38; r <= e; r++) dl(String.fromCodePoint(r), r);
}
function Iu(t38) {
  var e;
  return (e = ml[t38]) != null ? e : null;
}
function zu(t38, e) {
  var n, o;
  if (e.length === 0 || e === "\\" || !e.startsWith("\\")) return [];
  let r = [];
  for (let a in Pi) a.startsWith(e) && !Pi[a].infix && r.push({ match: a, frequency: (n = Pi[a].frequency) != null ? n : 0 });
  for (let a in Kn) a.startsWith(e) && r.push({ match: a, frequency: (o = Kn[a].frequency) != null ? o : 0 });
  let i = e.substring(1);
  for (let a of Object.keys(t38.options.macros)) a.startsWith(i) && r.push({ match: "\\" + a, frequency: 0 });
  return r.sort((a, s) => {
    var l, c;
    return a.frequency === s.frequency ? a.match.length === s.match.length ? a.match < s.match ? -1 : 1 : a.match.length - s.match.length : ((l = s.frequency) != null ? l : 0) - ((c = a.frequency) != null ? c : 0);
  }), r.map((a) => a.match);
}
function Ku(t38) {
  let e = "auto", r = t38.match(/:([^=]+)/);
  return r && (e = r[1].trim()), e;
}
function Uo(t38) {
  if (!t38) return [];
  let e = [], r = t38.split("]");
  if (r[0].startsWith("[")) {
    e.push({ isOptional: true, type: Ku(r[0].slice(1)) });
    for (let i = 1; i <= r.length; i++) e.push(...Uo(r[i]));
  } else if (r = t38.split("}"), r[0].startsWith("{")) {
    e.push({ isOptional: false, type: Ku(r[0].slice(1)) });
    for (let i = 1; i <= r.length; i++) e.push(...Uo(r[i]));
  }
  return e;
}
function pl(t38) {
  if (!t38) return "";
  let e = "", r = true;
  for (let i of t38) typeof i.value == "string" ? e += i.value : r = false;
  return r ? e : "";
}
function Et(t38, e, r) {
  typeof t38 == "string" && (t38 = [t38]);
  let n = { tabular: true, rootOnly: false, params: Uo(e), createAtom: r };
  for (let o of t38) ml[o] = n;
}
function Go(t38, e, r) {
  var n;
  typeof t38 == "string" && (t38 = [t38]);
  let i = { tabular: (n = r == null ? void 0 : r.tabular) != null ? n : false, rootOnly: true, params: [], createAtom: e };
  for (let o of t38) ml[o] = i;
}
function M(t38, e, r) {
  var n, o;
  r || (r = {});
  let i = { definitionType: "function", params: Uo(e), ifMode: r.ifMode, isFunction: (n = r.isFunction) != null ? n : false, applyMode: r.applyMode, infix: (o = r.infix) != null ? o : false, parse: r.parse, createAtom: r.createAtom, applyStyle: r.applyStyle, serialize: r.serialize, render: r.render };
  if (typeof t38 == "string") Pi["\\" + t38] = i;
  else for (let a of t38) Pi["\\" + a] = i;
}
var qo;
function Ri(t38) {
  return qo || (qo = ei(xf)), qo;
}
function Pu(t38, e) {
  var r, i, n, o;
  if (typeof t38 == "string") {
    let a = 0, s = t38;
    return /(^|[^\\])#1/.test(s) && (a = 1), /(^|[^\\])#2/.test(s) && (a = 2), /(^|[^\\])#3/.test(s) && (a = 3), /(^|[^\\])#4/.test(s) && (a = 4), /(^|[^\\])#5/.test(s) && (a = 5), /(^|[^\\])#6/.test(s) && (a = 6), /(^|[^\\])#7/.test(s) && (a = 7), /(^|[^\\])#8/.test(s) && (a = 8), /(^|[^\\])#9/.test(s) && (a = 9), { expand: (r = e == null ? void 0 : e.expand) != null ? r : true, captureSelection: (i = e == null ? void 0 : e.captureSelection) != null ? i : true, args: a, def: s };
  }
  return h({ expand: (n = e == null ? void 0 : e.expand) != null ? n : true, captureSelection: (o = e == null ? void 0 : e.captureSelection) != null ? o : true, args: 0 }, t38);
}
function ei(t38) {
  if (!t38) return {};
  let e = {};
  for (let r of Object.keys(t38)) {
    let i = t38[r];
    if (i == null) delete e[r];
    else if (typeof i == "object" && "package" in i) for (let n of Object.keys(i.package)) e[n] = Pu(i.package[n], { expand: !i.primitive, captureSelection: i.captureSelection });
    else e[r] = Pu(i);
  }
  return e;
}
function ne(t38, e = "math") {
  if (!t38 || t38.length === 0) return null;
  let r = null;
  if (t38.startsWith("\\")) {
    if (r = Pi[t38], r) return !r.ifMode || r.ifMode === e ? r : null;
    e === "math" ? r = Kn[t38] : Ki[t38] && (r = { definitionType: "symbol", type: "mord", codepoint: Ki[t38] });
  } else if (e === "math") {
    if (r = Kn[t38], !r && t38.length === 1) {
      let i = fl("math", t38.codePointAt(0));
      return i.startsWith("\\") ? g(h({}, ne(i, "math")), { command: i }) : null;
    }
  } else Ki[t38] ? r = { definitionType: "symbol", type: "mord", codepoint: Ki[t38] } : e === "text" && (r = { definitionType: "symbol", type: "mord", codepoint: t38.codePointAt(0) });
  return r != null ? r : null;
}
function ti(t38, e) {
  if (!t38.startsWith("\\")) return null;
  let r = t38.slice(1);
  return e[r];
}
function fl(t38, e) {
  if (e === void 0) return "";
  if (t38 === "math" && Ho[e]) return Ho[e];
  if (t38 === "text") {
    let r = Object.keys(Ki).find((i) => Ki[i] === e);
    return r || String.fromCodePoint(e);
  }
  return String.fromCodePoint(e);
}
var tt = [0, 0.68889, 0, 0, 0.72222], ri = [0, 0.68889, 0, 0, 0.66667], gl = [0, 0.68889, 0, 0, 0.77778], jo = [0, 0.68889, 0, 0, 0.61111], Nu = [0.16667, 0.68889, 0, 0, 0.77778], Pn = [0, 0.68889, 0, 0, 0.55556], Z = [0, 0, 0, 0, 0.25], Fu = [0, 0.825, 0, 0, 2.33334], $u = [0, 0.9, 0, 0, 2.33334], Jo = [0, 0.68889, 0, 0, 0.54028], bl = [-0.03598, 0.46402, 0, 0, 0.5], Be = [-0.13313, 0.36687, 0, 0, 1], Xo = [0.01354, 0.52239, 0, 0, 1], Vu = [0.01354, 0.52239, 0, 0, 1.11111], qu = [0, 0.54986, 0, 0, 1], Zo = [0, 0.69224, 0, 0, 0.5], yl = [0, 0.43056, 0, 0, 1], xr = [0.08198, 0.58198, 0, 0, 0.77778], Yo = [0.19444, 0.69224, 0, 0, 0.41667], Qo = [0.1808, 0.675, 0, 0, 1], Hu = [0.19444, 0.69224, 0, 0, 0.83334], Wu = [0.13667, 0.63667, 0, 0, 1], Uu = [-0.064, 0.437, 0, 0, 1.334], vr = [0.08167, 0.58167, 0, 0, 0.77778], Rn = [0, 0.69224, 0, 0, 0.72222], xl = [0, 0.69224, 0, 0, 0.66667], ea = [-0.13313, 0.36687, 0, 0, 0.77778], Gu = [0.06062, 0.54986, 0, 0, 0.77778], ta = [0, 0.69224, 0, 0, 0.77778], Ii = [0.25583, 0.75583, 0, 0, 0.77778], Tt = [0.25142, 0.75726, 0, 0, 0.77778], zi = [0.20576, 0.70576, 0, 0, 0.77778], ut = [0.30274, 0.79383, 0, 0, 0.77778], In = [0.22958, 0.72958, 0, 0, 0.77778], ju = [0.1808, 0.675, 0, 0, 0.77778], Dt = [0.13667, 0.63667, 0, 0, 0.77778], qe = [0.13597, 0.63597, 0, 0, 0.77778], _r = [0.03517, 0.54986, 0, 0, 0.77778], Ni = [0, 0.675, 0, 0, 0.77778], Ju = [0.19444, 0.69224, 0, 0, 0.61111], Xu = [0, 0.54986, 0, 0, 0.76042], Zu = [0, 0.54986, 0, 0, 0.66667], Mr = [0.0391, 0.5391, 0, 0, 0.77778], Yu = [0.03517, 0.54986, 0, 0, 1.33334], Qu = [0.38569, 0.88569, 0, 0, 0.77778], ra = [0.23222, 0.74111, 0, 0, 0.77778], ed = [0.19444, 0.69224, 0, 0, 0.77778], td = [0, 0.37788, 0, 0, 0.5], ia = [0, 0.54986, 0, 0, 0.72222], rd = [0, 0.69224, 0, 0, 0.83334], id = [0.11111, 0.69224, 0, 0, 0.66667], Fi = [0.26167, 0.75726, 0, 0, 0.77778], nd = [0.48256, 0.98256, 0, 0, 0.77778], od = [0.28481, 0.79383, 0, 0, 0.77778], ad = [0.08167, 0.58167, 0, 0, 0.22222], sd = [0.08167, 0.58167, 0, 0, 0.38889], ld = [0, 0.43056, 0.04028, 0, 0.66667], cd = [0.41951, 0.91951, 0, 0, 0.77778], ud = [0.24982, 0.74947, 0, 0, 0.38865], dd = [0.08319, 0.58283, 0, 0, 0.75623], md = [0, 0.10803, 0, 0, 0.27764], vl = [0, 0.47534, 0, 0, 0.50181], zn = [0.18906, 0.47534, 0, 0, 0.50181], hd = [0, 0.69141, 0, 0, 0.50181], pd = [0.24982, 0.74947, 0, 0, 0.27764], _l = [0, 0.69141, 0, 0, 0.21471], na = [0.25, 0.75, 0, 0, 0.44722], rt = [0, 0.64444, 0, 0, 0.575], $i = [0.08556, 0.58556, 0, 0, 0.89444], oa = [0, 0.69444, 0, 0, 0.89444], aa = [0, 0.68611, 0, 0, 0.9], Ml = [0, 0.68611, 0, 0, 0.86944], wr = [0.25, 0.75, 0, 0, 0.575], sa = [0.25, 0.75, 0, 0, 0.31944], ii = [0, 0.69444, 0, 0, 0.63889], Vi = [0, 0.69444, 0, 0, 0.31944], fd = [0, 0.44444, 0, 0, 0.63889], gd = [0, 0.44444, 0, 0, 0.51111], Sr = [0, 0.69444, 0, 0, 0.575], dt = [0.13333, 0.63333, 0, 0, 0.89444], bd = [0, 0.44444, 0, 0, 0.31944], yd = [0, 0.69444, 0, 0, 0.86944], xd = [0, 0.68611, 0, 0, 0.69166], la = [0, 0.68611, 0, 0, 0.83055], wl = [0, 0.68611, 0, 0, 0.89444], Sl = [0, 0.69444, 0, 0, 0.60278], vd = [0.19444, 0.69444, 0, 0, 0.51111], _d = [0, 0.69444, 0, 0, 0.83055], Ot = [-0.10889, 0.39111, 0, 0, 1.14999], Md = [0.19444, 0.69444, 0, 0, 0.575], Nn = [0.19444, 0.69444, 0, 0, 1.14999], wd = [0.19444, 0.69444, 0, 0, 0.70277], Sd = [0.05556, 0.75, 0, 0, 0.575], kl = [0, 0.68611, 0, 0, 0.95833], kd = [0.08556, 0.58556, 0, 0, 0.76666], Ll = [-0.02639, 0.47361, 0, 0, 0.575], Ld = [0, 0.44444, 0, 0, 0.89444], ni = [0, 0.55556, 0, 0, 0.76666], Ad = [-0.10889, 0.39111, 0, 0, 0.89444], Al = [222e-5, 0.50222, 0, 0, 0.89444], kr = [0.19667, 0.69667, 0, 0, 0.89444], Cd = [0.08556, 0.58556, 0, 0, 1.14999], Cl = [0, 0.69444, 0, 0, 0.70277], ca = [-0.02778, 0.47222, 0, 0, 0.575], ua = [0.25, 0.75, 0, 0, 0.51111], Ed = [-0.13889, 0.36111, 0, 0, 1.14999], Td = [0.19444, 0.69444, 0, 0, 1.02222], da = [0.12963, 0.69444, 0, 0, 0.89444], Dd = [0.19444, 0.69444, 0, 0, 0.44722], Lr = [0, 0.64444, 0.13167, 0, 0.59111], Od = [0.19444, 0.64444, 0.13167, 0, 0.59111], El = [0, 0.68611, 0.17208, 0, 0.8961], Bd = [0.19444, 0.44444, 0.105, 0, 0.53222], Kd = [0, 0.44444, 0.085, 0, 0.82666], Pd = [0, 0.69444, 0.06709, 0, 0.59111], ma = [0, 0.69444, 0.12945, 0, 0.35555], Rd = [0, 0.69444, 0, 0, 0.94888], Tl = [0, 0.69444, 0.11472, 0, 0.59111], Id = [0, 0.68611, 0.10778, 0, 0.88555], zd = [0, 0.69444, 0.07939, 0, 0.62055], ha = [0, 0.69444, 0.12417, 0, 0.30667], Ar = [0, 0.64444, 0.13556, 0, 0.51111], Nd = [0.19444, 0.64444, 0.13556, 0, 0.51111], pa = [0, 0.68333, 0.16389, 0, 0.74333], Fd = [0.19444, 0.43056, 0.08847, 0, 0.46], $d = [0, 0.43056, 0.07514, 0, 0.71555], Vd = [0, 0.69444, 0.06646, 0, 0.51111], qd = [0, 0.69444, 0, 0, 0.83129], Hd = [0, 0.69444, 0.1225, 0, 0.51111], Wd = [0, 0.68333, 0.09403, 0, 0.76666], Ud = [0, 0.68333, 0.11111, 0, 0.76666], Gd = [0, 0.69444, 0.06961, 0, 0.51444], tr = [0, 0.69444, 0, 0, 0.27778], qi = [0.25, 0.75, 0, 0, 0.38889], it = [0, 0.64444, 0, 0, 0.5], oi = [0, 0.69444, 0, 0, 0.77778], ai = [0, 0.68333, 0, 0, 0.75], Fn = [0, 0.68333, 0, 0, 0.77778], jd = [0, 0.68333, 0, 0, 0.68056], $n = [0, 0.68333, 0, 0, 0.72222], rr = [0.25, 0.75, 0, 0, 0.5], fa = [0.25, 0.75, 0, 0, 0.27778], ke = [0, 0.69444, 0, 0, 0.5], Hi = [0, 0.69444, 0, 0, 0.55556], Dl = [0, 0.43056, 0, 0, 0.44445], Vn = [0, 0.43056, 0, 0, 0.5], Jd = [0.19444, 0.43056, 0, 0, 0.55556], Xd = [0, 0.43056, 0, 0, 0.55556], nt = [0.08333, 0.58333, 0, 0, 0.77778], Zd = [0, 0.43056, 0, 0, 0.27778], Yd = [0, 0.66786, 0, 0, 0.27778], Qd = [0, 0.69444, 0, 0, 0.75], em = [0, 0.66786, 0, 0, 0.5], tm = [0, 0.68333, 0, 0, 0.625], Ol = [0.19444, 0.69444, 0, 0, 0.44445], qn = [0, 0.69444, 0, 0, 0.72222], rm = [0.19444, 0.69444, 0, 0, 0.5], Hn = [0.19444, 0.69444, 0, 0, 1], im = [0.011, 0.511, 0, 0, 1.126], Bl = [0.19444, 0.69444, 0, 0, 0.61111], Kl = [0.05556, 0.75, 0, 0, 0.5], nm = [0, 0.68333, 0, 0, 0.83334], om = [0.0391, 0.5391, 0, 0, 0.66667], Pl = [-0.05555, 0.44445, 0, 0, 0.5], am = [0, 0.43056, 0, 0, 0.77778], si = [0, 0.55556, 0, 0, 0.66667], ga = [-0.03625, 0.46375, 0, 0, 0.77778], sm = [-0.01688, 0.48312, 0, 0, 0.77778], lm = [0.0391, 0.5391, 0, 0, 1], Cr = [0, 0.69444, 0, 0, 0.61111], ba = [-0.03472, 0.46528, 0, 0, 0.5], ya = [0.25, 0.75, 0, 0, 0.44445], cm = [-0.14236, 0.35764, 0, 0, 1], xa = [0.244, 0.744, 0, 0, 0.412], um = [0.19444, 0.69444, 0, 0, 0.88889], va = [0.12963, 0.69444, 0, 0, 0.77778], dm = [0.19444, 0.69444, 0, 0, 0.38889], mm = [0.011, 0.511, 0, 0, 1.638], hm = [0.19444, 0.69444, 0, 0, 0], _a = [0, 0.44444, 0, 0, 0.575], Wn = [0.19444, 0.44444, 0, 0, 0.575], pm = [0, 0.68611, 0, 0, 0.75555], fm = [0, 0.69444, 0, 0, 0.66759], gm = [0, 0.68611, 0, 0, 0.80555], bm = [0, 0.68611, 0.08229, 0, 0.98229], ym = [0, 0.68611, 0, 0, 0.76666], xm = [0, 0.44444, 0, 0, 0.58472], vm = [0.19444, 0.44444, 0, 0, 0.6118], Un = [0.19444, 0.43056, 0, 0, 0.5], _m = [0, 0.68333, 0.02778, 0.08334, 0.76278], Mm = [0, 0.68333, 0.08125, 0.05556, 0.83125], wm = [0, 0.43056, 0, 0.05556, 0.48472], Sm = [0.19444, 0.43056, 0, 0.08334, 0.51702], km = [0.25, 0.75, 0, 0, 0.42778], Ce = [0, 0.69444, 0, 0, 0.55], ir = [0, 0.69444, 0, 0, 0.73334], Er = [0, 0.69444, 0, 0, 0.79445], Lm = [0, 0.69444, 0, 0, 0.51945], Rl = [0, 0.69444, 0, 0, 0.70278], Am = [0, 0.69444, 0, 0, 0.76389], Cm = [0.25, 0.75, 0, 0, 0.34306], Il = [0, 0.69444, 0, 0, 0.56111], Em = [0, 0.69444, 0, 0, 0.25556], Tm = [0.19444, 0.45833, 0, 0, 0.56111], Dm = [0, 0.45833, 0, 0, 0.56111], Ma = [0, 0.69444, 0, 0, 0.30556], Om = [0, 0.69444, 0, 0, 0.58056], Bm = [0, 0.69444, 0, 0, 0.67223], zl = [0, 0.69444, 0, 0, 0.85556], Nl = [0, 0.69444, 0, 0, 0.55834], Bt = [0, 0.65556, 0.11156, 0, 0.5], Fl = [0, 0.69444, 0.08094, 0, 0.70834], $l = [0.17014, 0, 0, 0, 0.44445], Km = [0, 0.69444, 0.0799, 0, 0.5], Pm = [0, 0.69444, 0, 0, 0.73752], Rm = [0, 0.69444, 0.09205, 0, 0.5], Im = [0, 0.69444, 0.09031, 0, 0.77778], Vl = [0, 0.69444, 0.07816, 0, 0.27778], zm = [0, 0.69444, 316e-5, 0, 0.5], Nm = [0.19444, 0.69444, 0, 0, 0.83334], Fm = [0.05556, 0.75, 0, 0, 0.83334], $m = [0, 0.75, 0, 0, 0.5], Vm = [0.125, 0.08333, 0, 0, 0.27778], qm = [0, 0.08333, 0, 0, 0.27778], Kt = [0, 0.65556, 0, 0, 0.5], ql = [0, 0.69444, 0, 0, 0.47222], nr = [0, 0.69444, 0, 0, 0.66667], Hm = [0, 0.69444, 0, 0, 0.59722], Hl = [0, 0.69444, 0, 0, 0.54167], Wl = [0, 0.69444, 0, 0, 0.70834], Wm = [0.25, 0.75, 0, 0, 0.28889], Ul = [0, 0.69444, 0, 0, 0.51667], Um = [0, 0.44444, 0, 0, 0.44445], Gm = [0.19444, 0.44444, 0, 0, 0.51667], jm = [0, 0.44444, 0, 0, 0.38333], Jm = [0, 0.44444, 0, 0, 0.51667], Xm = [0, 0.69444, 0, 0, 0.83334], Zm = [0.35001, 0.85, 0, 0, 0.45834], Ym = [0.35001, 0.85, 0, 0, 0.57778], Qm = [0.35001, 0.85, 0, 0, 0.41667], e0 = [0.35001, 0.85, 0, 0, 0.58334], wa = [0, 0.72222, 0, 0, 0.55556], t0 = [1e-5, 0.6, 0, 0, 0.66667], r0 = [1e-5, 0.6, 0, 0, 0.77778], i0 = [0.25001, 0.75, 0, 0, 0.94445], n0 = [0.306, 0.805, 0.19445, 0, 0.47222], o0 = [0.30612, 0.805, 0.19445, 0, 0.47222], Wi = [0.25001, 0.75, 0, 0, 0.83334], Ui = [0.35001, 0.85, 0, 0, 0.47222], Gl = [0.25001, 0.75, 0, 0, 1.11111], a0 = [0.65002, 1.15, 0, 0, 0.59722], s0 = [0.65002, 1.15, 0, 0, 0.81111], l0 = [0.65002, 1.15, 0, 0, 0.47222], c0 = [0.65002, 1.15, 0, 0, 0.66667], Sa = [0, 0.75, 0, 0, 1], u0 = [0.55001, 1.05, 0, 0, 1.27778], d0 = [0.862, 1.36, 0.44445, 0, 0.55556], m0 = [0.86225, 1.36, 0.44445, 0, 0.55556], Gi = [0.55001, 1.05, 0, 0, 1.11111], ka = [0.65002, 1.15, 0, 0, 0.52778], h0 = [0.65002, 1.15, 0, 0, 0.61111], jl = [0.55001, 1.05, 0, 0, 1.51112], p0 = [0.95003, 1.45, 0, 0, 0.73611], f0 = [0.95003, 1.45, 0, 0, 1.04445], g0 = [0.95003, 1.45, 0, 0, 0.52778], La = [0.95003, 1.45, 0, 0, 0.75], Aa = [0, 0.75, 0, 0, 1.44445], Ca = [0.95003, 1.45, 0, 0, 0.58334], b0 = [1.25003, 1.75, 0, 0, 0.79167], y0 = [1.25003, 1.75, 0, 0, 1.27778], x0 = [1.25003, 1.75, 0, 0, 0.58334], Ea = [1.25003, 1.75, 0, 0, 0.80556], Ta = [0, 0.825, 0, 0, 1.8889], Da = [1.25003, 1.75, 0, 0, 0.63889], Oa = [0.64502, 1.155, 0, 0, 0.875], v0 = [1e-5, 0.6, 0, 0, 0.875], Jl = [-99e-5, 0.601, 0, 0, 0.66667], Ba = [0.64502, 1.155, 0, 0, 0.66667], _0 = [1e-5, 0.9, 0, 0, 0.88889], M0 = [0.65002, 1.15, 0, 0, 0.88889], w0 = [0.90001, 0, 0, 0, 0.88889], S0 = [-499e-5, 0.605, 0, 0, 1.05556], Ka = [0, 0.12, 0, 0, 0.45], B = [0, 0.61111, 0, 0, 0.525], mt = [0.08333, 0.69444, 0, 0, 0.525], k0 = [-0.08056, 0.53055, 0, 0, 0.525], L0 = [-0.05556, 0.55556, 0, 0, 0.525], Re = [0, 0.43056, 0, 0, 0.525], Gn = [0.22222, 0.43056, 0, 0, 0.525], A0 = [0, 0, 0, 0, 0.525], C0 = { "AMS-Regular": { 32: Z, 65: tt, 66: ri, 67: tt, 68: tt, 69: ri, 70: jo, 71: gl, 72: gl, 73: [0, 0.68889, 0, 0, 0.38889], 74: [0.16667, 0.68889, 0, 0, 0.5], 75: gl, 76: ri, 77: [0, 0.68889, 0, 0, 0.94445], 78: tt, 79: Nu, 80: jo, 81: Nu, 82: tt, 83: Pn, 84: ri, 85: tt, 86: tt, 87: [0, 0.68889, 0, 0, 1], 88: tt, 89: tt, 90: ri, 107: Pn, 160: Z, 165: [0, 0.675, 0.025, 0, 0.75], 174: [0.15559, 0.69224, 0, 0, 0.94666], 240: Pn, 295: Jo, 710: Fu, 732: $u, 770: Fu, 771: $u, 989: vr, 1008: ld, 8245: [0, 0.54986, 0, 0, 0.275], 8463: Jo, 8487: tt, 8498: Pn, 8502: ri, 8503: [0, 0.68889, 0, 0, 0.44445], 8504: ri, 8513: [0, 0.68889, 0, 0, 0.63889], 8592: bl, 8594: bl, 8602: Be, 8603: Be, 8606: Xo, 8608: Xo, 8610: Vu, 8611: Vu, 8619: qu, 8620: qu, 8621: [-0.13313, 0.37788, 0, 0, 1.38889], 8622: Be, 8624: Zo, 8625: Zo, 8630: yl, 8631: yl, 8634: xr, 8635: xr, 8638: Yo, 8639: Yo, 8642: Yo, 8643: Yo, 8644: Qo, 8646: Qo, 8647: Qo, 8648: Hu, 8649: Qo, 8650: Hu, 8651: Xo, 8652: Xo, 8653: Be, 8654: Be, 8655: Be, 8666: Wu, 8667: Wu, 8669: [-0.13313, 0.37788, 0, 0, 1], 8672: Uu, 8674: Uu, 8705: [0, 0.825, 0, 0, 0.5], 8708: Pn, 8709: vr, 8717: [0, 0.43056, 0, 0, 0.42917], 8722: bl, 8724: [0.08198, 0.69224, 0, 0, 0.77778], 8726: vr, 8733: ta, 8736: Rn, 8737: Rn, 8738: [0.03517, 0.52239, 0, 0, 0.72222], 8739: ad, 8740: [0.25142, 0.74111, 0, 0, 0.27778], 8741: sd, 8742: [0.25142, 0.74111, 0, 0, 0.5], 8756: xl, 8757: xl, 8764: ea, 8765: [-0.13313, 0.37788, 0, 0, 0.77778], 8769: ea, 8770: ga, 8774: ut, 8776: sm, 8778: vr, 8782: Gu, 8783: Gu, 8785: xr, 8786: xr, 8787: xr, 8790: ta, 8791: In, 8796: [0.08198, 0.91667, 0, 0, 0.77778], 8806: Ii, 8807: Ii, 8808: Tt, 8809: Tt, 8812: [0.25583, 0.75583, 0, 0, 0.5], 8814: zi, 8815: zi, 8816: ut, 8817: ut, 8818: In, 8819: In, 8822: ju, 8823: ju, 8828: Dt, 8829: Dt, 8830: In, 8831: In, 8832: zi, 8833: zi, 8840: ut, 8841: ut, 8842: qe, 8843: qe, 8847: _r, 8848: _r, 8858: xr, 8859: xr, 8861: xr, 8862: Ni, 8863: Ni, 8864: Ni, 8865: Ni, 8872: [0, 0.69224, 0, 0, 0.61111], 8873: Rn, 8874: [0, 0.69224, 0, 0, 0.88889], 8876: jo, 8877: jo, 8878: tt, 8879: tt, 8882: _r, 8883: _r, 8884: Dt, 8885: Dt, 8888: [0, 0.54986, 0, 0, 1.11111], 8890: Jd, 8891: Ju, 8892: Ju, 8901: [0, 0.54986, 0, 0, 0.27778], 8903: vr, 8905: vr, 8906: vr, 8907: ta, 8908: ta, 8909: [-0.03598, 0.46402, 0, 0, 0.77778], 8910: Xu, 8911: Xu, 8912: _r, 8913: _r, 8914: Zu, 8915: Zu, 8916: xl, 8918: Mr, 8919: Mr, 8920: Yu, 8921: Yu, 8922: Qu, 8923: Qu, 8926: Dt, 8927: Dt, 8928: ut, 8929: ut, 8934: ra, 8935: ra, 8936: ra, 8937: ra, 8938: zi, 8939: zi, 8940: ut, 8941: ut, 8994: ed, 8995: ed, 9416: [0.15559, 0.69224, 0, 0, 0.90222], 9484: Zo, 9488: Zo, 9492: td, 9496: td, 9585: [0.19444, 0.68889, 0, 0, 0.88889], 9586: [0.19444, 0.74111, 0, 0, 0.88889], 9632: Ni, 9633: Ni, 9650: ia, 9651: ia, 9654: _r, 9660: ia, 9661: ia, 9664: _r, 9674: id, 9733: [0.19444, 0.69224, 0, 0, 0.94445], 10003: rd, 10016: rd, 10731: id, 10846: [0.19444, 0.75583, 0, 0, 0.61111], 10877: Dt, 10878: Dt, 10885: Ii, 10886: Ii, 10887: qe, 10888: qe, 10889: Fi, 10890: Fi, 10891: nd, 10892: nd, 10901: Dt, 10902: Dt, 10933: Tt, 10934: Tt, 10935: Fi, 10936: Fi, 10937: Fi, 10938: Fi, 10949: Ii, 10950: Ii, 10955: od, 10956: od, 57350: ad, 57351: sd, 57352: vr, 57353: ld, 57356: Tt, 57357: Tt, 57358: cd, 57359: ut, 57360: ut, 57361: cd, 57366: Tt, 57367: Tt, 57368: Tt, 57369: Tt, 57370: qe, 57371: qe }, "Caligraphic-Regular": { 32: Z, 65: [0, 0.68333, 0, 0.19445, 0.79847], 66: [0, 0.68333, 0.03041, 0.13889, 0.65681], 67: [0, 0.68333, 0.05834, 0.13889, 0.52653], 68: [0, 0.68333, 0.02778, 0.08334, 0.77139], 69: [0, 0.68333, 0.08944, 0.11111, 0.52778], 70: [0, 0.68333, 0.09931, 0.11111, 0.71875], 71: [0.09722, 0.68333, 0.0593, 0.11111, 0.59487], 72: [0, 0.68333, 965e-5, 0.11111, 0.84452], 73: [0, 0.68333, 0.07382, 0, 0.54452], 74: [0.09722, 0.68333, 0.18472, 0.16667, 0.67778], 75: [0, 0.68333, 0.01445, 0.05556, 0.76195], 76: [0, 0.68333, 0, 0.13889, 0.68972], 77: [0, 0.68333, 0, 0.13889, 1.2009], 78: [0, 0.68333, 0.14736, 0.08334, 0.82049], 79: [0, 0.68333, 0.02778, 0.11111, 0.79611], 80: [0, 0.68333, 0.08222, 0.08334, 0.69556], 81: [0.09722, 0.68333, 0, 0.11111, 0.81667], 82: [0, 0.68333, 0, 0.08334, 0.8475], 83: [0, 0.68333, 0.075, 0.13889, 0.60556], 84: [0, 0.68333, 0.25417, 0, 0.54464], 85: [0, 0.68333, 0.09931, 0.08334, 0.62583], 86: [0, 0.68333, 0.08222, 0, 0.61278], 87: [0, 0.68333, 0.08222, 0.08334, 0.98778], 88: [0, 0.68333, 0.14643, 0.13889, 0.7133], 89: [0.09722, 0.68333, 0.08222, 0.08334, 0.66834], 90: [0, 0.68333, 0.07944, 0.13889, 0.72473], 160: Z }, "Fraktur-Regular": { 32: Z, 33: [0, 0.69141, 0, 0, 0.29574], 34: _l, 38: [0, 0.69141, 0, 0, 0.73786], 39: [0, 0.69141, 0, 0, 0.21201], 40: ud, 41: ud, 42: [0, 0.62119, 0, 0, 0.27764], 43: dd, 44: md, 45: dd, 46: md, 47: [0.24982, 0.74947, 0, 0, 0.50181], 48: vl, 49: vl, 50: vl, 51: zn, 52: zn, 53: zn, 54: hd, 55: zn, 56: hd, 57: zn, 58: [0, 0.47534, 0, 0, 0.21606], 59: [0.12604, 0.47534, 0, 0, 0.21606], 61: [-0.13099, 0.36866, 0, 0, 0.75623], 63: [0, 0.69141, 0, 0, 0.36245], 65: [0, 0.69141, 0, 0, 0.7176], 66: [0, 0.69141, 0, 0, 0.88397], 67: [0, 0.69141, 0, 0, 0.61254], 68: [0, 0.69141, 0, 0, 0.83158], 69: [0, 0.69141, 0, 0, 0.66278], 70: [0.12604, 0.69141, 0, 0, 0.61119], 71: [0, 0.69141, 0, 0, 0.78539], 72: [0.06302, 0.69141, 0, 0, 0.7203], 73: [0, 0.69141, 0, 0, 0.55448], 74: [0.12604, 0.69141, 0, 0, 0.55231], 75: [0, 0.69141, 0, 0, 0.66845], 76: [0, 0.69141, 0, 0, 0.66602], 77: [0, 0.69141, 0, 0, 1.04953], 78: [0, 0.69141, 0, 0, 0.83212], 79: [0, 0.69141, 0, 0, 0.82699], 80: [0.18906, 0.69141, 0, 0, 0.82753], 81: [0.03781, 0.69141, 0, 0, 0.82699], 82: [0, 0.69141, 0, 0, 0.82807], 83: [0, 0.69141, 0, 0, 0.82861], 84: [0, 0.69141, 0, 0, 0.66899], 85: [0, 0.69141, 0, 0, 0.64576], 86: [0, 0.69141, 0, 0, 0.83131], 87: [0, 0.69141, 0, 0, 1.04602], 88: [0, 0.69141, 0, 0, 0.71922], 89: [0.18906, 0.69141, 0, 0, 0.83293], 90: [0.12604, 0.69141, 0, 0, 0.60201], 91: pd, 93: pd, 94: [0, 0.69141, 0, 0, 0.49965], 97: [0, 0.47534, 0, 0, 0.50046], 98: [0, 0.69141, 0, 0, 0.51315], 99: [0, 0.47534, 0, 0, 0.38946], 100: [0, 0.62119, 0, 0, 0.49857], 101: [0, 0.47534, 0, 0, 0.40053], 102: [0.18906, 0.69141, 0, 0, 0.32626], 103: [0.18906, 0.47534, 0, 0, 0.5037], 104: [0.18906, 0.69141, 0, 0, 0.52126], 105: [0, 0.69141, 0, 0, 0.27899], 106: [0, 0.69141, 0, 0, 0.28088], 107: [0, 0.69141, 0, 0, 0.38946], 108: [0, 0.69141, 0, 0, 0.27953], 109: [0, 0.47534, 0, 0, 0.76676], 110: [0, 0.47534, 0, 0, 0.52666], 111: [0, 0.47534, 0, 0, 0.48885], 112: [0.18906, 0.52396, 0, 0, 0.50046], 113: [0.18906, 0.47534, 0, 0, 0.48912], 114: [0, 0.47534, 0, 0, 0.38919], 115: [0, 0.47534, 0, 0, 0.44266], 116: [0, 0.62119, 0, 0, 0.33301], 117: [0, 0.47534, 0, 0, 0.5172], 118: [0, 0.52396, 0, 0, 0.5118], 119: [0, 0.52396, 0, 0, 0.77351], 120: [0.18906, 0.47534, 0, 0, 0.38865], 121: [0.18906, 0.47534, 0, 0, 0.49884], 122: [0.18906, 0.47534, 0, 0, 0.39054], 160: Z, 8216: _l, 8217: _l, 58112: [0, 0.62119, 0, 0, 0.49749], 58113: [0, 0.62119, 0, 0, 0.4983], 58114: [0.18906, 0.69141, 0, 0, 0.33328], 58115: [0.18906, 0.69141, 0, 0, 0.32923], 58116: [0.18906, 0.47534, 0, 0, 0.50343], 58117: [0, 0.69141, 0, 0, 0.33301], 58118: [0, 0.62119, 0, 0, 0.33409], 58119: [0, 0.47534, 0, 0, 0.50073] }, "Main-Bold": { 32: Z, 33: [0, 0.69444, 0, 0, 0.35], 34: Sl, 35: [0.19444, 0.69444, 0, 0, 0.95833], 36: Sd, 37: [0.05556, 0.75, 0, 0, 0.95833], 38: oa, 39: Vi, 40: na, 41: na, 42: [0, 0.75, 0, 0, 0.575], 43: dt, 44: [0.19444, 0.15556, 0, 0, 0.31944], 45: jm, 46: [0, 0.15556, 0, 0, 0.31944], 47: wr, 48: rt, 49: rt, 50: rt, 51: rt, 52: rt, 53: rt, 54: rt, 55: rt, 56: rt, 57: rt, 58: bd, 59: [0.19444, 0.44444, 0, 0, 0.31944], 60: $i, 61: Ad, 62: $i, 63: [0, 0.69444, 0, 0, 0.54305], 64: oa, 65: Ml, 66: [0, 0.68611, 0, 0, 0.81805], 67: la, 68: [0, 0.68611, 0, 0, 0.88194], 69: pm, 70: [0, 0.68611, 0, 0, 0.72361], 71: [0, 0.68611, 0, 0, 0.90416], 72: aa, 73: [0, 0.68611, 0, 0, 0.43611], 74: [0, 0.68611, 0, 0, 0.59444], 75: [0, 0.68611, 0, 0, 0.90138], 76: xd, 77: [0, 0.68611, 0, 0, 1.09166], 78: aa, 79: [0, 0.68611, 0, 0, 0.86388], 80: [0, 0.68611, 0, 0, 0.78611], 81: [0.19444, 0.68611, 0, 0, 0.86388], 82: [0, 0.68611, 0, 0, 0.8625], 83: [0, 0.68611, 0, 0, 0.63889], 84: [0, 0.68611, 0, 0, 0.8], 85: [0, 0.68611, 0, 0, 0.88472], 86: [0, 0.68611, 0.01597, 0, 0.86944], 87: [0, 0.68611, 0.01597, 0, 1.18888], 88: Ml, 89: [0, 0.68611, 0.02875, 0, 0.86944], 90: [0, 0.68611, 0, 0, 0.70277], 91: sa, 92: wr, 93: sa, 94: Sr, 95: [0.31, 0.13444, 0.03194, 0, 0.575], 97: [0, 0.44444, 0, 0, 0.55902], 98: ii, 99: gd, 100: ii, 101: [0, 0.44444, 0, 0, 0.52708], 102: [0, 0.69444, 0.10903, 0, 0.35139], 103: [0.19444, 0.44444, 0.01597, 0, 0.575], 104: ii, 105: Vi, 106: [0.19444, 0.69444, 0, 0, 0.35139], 107: [0, 0.69444, 0, 0, 0.60694], 108: Vi, 109: [0, 0.44444, 0, 0, 0.95833], 110: fd, 111: _a, 112: [0.19444, 0.44444, 0, 0, 0.63889], 113: [0.19444, 0.44444, 0, 0, 0.60694], 114: [0, 0.44444, 0, 0, 0.47361], 115: [0, 0.44444, 0, 0, 0.45361], 116: [0, 0.63492, 0, 0, 0.44722], 117: fd, 118: [0, 0.44444, 0.01597, 0, 0.60694], 119: [0, 0.44444, 0.01597, 0, 0.83055], 120: [0, 0.44444, 0, 0, 0.60694], 121: [0.19444, 0.44444, 0.01597, 0, 0.60694], 122: gd, 123: wr, 124: sa, 125: wr, 126: [0.35, 0.34444, 0, 0, 0.575], 160: Z, 163: [0, 0.69444, 0, 0, 0.86853], 168: Sr, 172: [0, 0.44444, 0, 0, 0.76666], 176: yd, 177: dt, 184: [0.17014, 0, 0, 0, 0.51111], 198: [0, 0.68611, 0, 0, 1.04166], 215: dt, 216: [0.04861, 0.73472, 0, 0, 0.89444], 223: Hm, 230: [0, 0.44444, 0, 0, 0.83055], 247: dt, 248: [0.09722, 0.54167, 0, 0, 0.575], 305: bd, 338: [0, 0.68611, 0, 0, 1.16944], 339: Ld, 567: [0.19444, 0.44444, 0, 0, 0.35139], 710: Sr, 711: [0, 0.63194, 0, 0, 0.575], 713: [0, 0.59611, 0, 0, 0.575], 714: Sr, 715: Sr, 728: Sr, 729: Vi, 730: yd, 732: Sr, 733: Sr, 915: xd, 916: kl, 920: wl, 923: gm, 926: ym, 928: aa, 931: la, 933: wl, 934: la, 936: wl, 937: la, 8211: [0, 0.44444, 0.03194, 0, 0.575], 8212: [0, 0.44444, 0.03194, 0, 1.14999], 8216: Vi, 8217: Vi, 8220: Sl, 8221: Sl, 8224: vd, 8225: vd, 8242: [0, 0.55556, 0, 0, 0.34444], 8407: [0, 0.72444, 0.15486, 0, 0.575], 8463: fm, 8465: _d, 8467: [0, 0.69444, 0, 0, 0.47361], 8472: [0.19444, 0.44444, 0, 0, 0.74027], 8476: _d, 8501: Cl, 8592: Ot, 8593: Md, 8594: Ot, 8595: Md, 8596: Ot, 8597: wr, 8598: Nn, 8599: Nn, 8600: Nn, 8601: Nn, 8636: Ot, 8637: Ot, 8640: Ot, 8641: Ot, 8656: Ot, 8657: wd, 8658: Ot, 8659: wd, 8660: Ot, 8661: [0.25, 0.75, 0, 0, 0.70277], 8704: ii, 8706: [0, 0.69444, 0.06389, 0, 0.62847], 8707: ii, 8709: Sd, 8711: kl, 8712: kd, 8715: kd, 8722: dt, 8723: dt, 8725: wr, 8726: wr, 8727: ca, 8728: Ll, 8729: Ll, 8730: [0.18, 0.82, 0, 0, 0.95833], 8733: Ld, 8734: [0, 0.44444, 0, 0, 1.14999], 8736: Rn, 8739: sa, 8741: wr, 8743: ni, 8744: ni, 8745: ni, 8746: ni, 8747: [0.19444, 0.69444, 0.12778, 0, 0.56875], 8764: Ad, 8768: [0.19444, 0.69444, 0, 0, 0.31944], 8771: Al, 8776: [0.02444, 0.52444, 0, 0, 0.89444], 8781: Al, 8801: Al, 8804: kr, 8805: kr, 8810: Cd, 8811: Cd, 8826: $i, 8827: $i, 8834: $i, 8835: $i, 8838: kr, 8839: kr, 8846: ni, 8849: kr, 8850: kr, 8851: ni, 8852: ni, 8853: dt, 8854: dt, 8855: dt, 8856: dt, 8857: dt, 8866: Cl, 8867: Cl, 8868: oa, 8869: oa, 8900: Ll, 8901: [-0.02639, 0.47361, 0, 0, 0.31944], 8902: ca, 8968: ua, 8969: ua, 8970: ua, 8971: ua, 8994: Ed, 8995: Ed, 9651: Td, 9657: ca, 9661: Td, 9667: ca, 9711: Nn, 9824: da, 9825: da, 9826: da, 9827: da, 9837: [0, 0.75, 0, 0, 0.44722], 9838: Dd, 9839: Dd, 10216: na, 10217: na, 10815: aa, 10927: kr, 10928: kr, 57376: hm }, "Main-BoldItalic": { 32: Z, 33: [0, 0.69444, 0.11417, 0, 0.38611], 34: zd, 35: [0.19444, 0.69444, 0.06833, 0, 0.94444], 37: [0.05556, 0.75, 0.12861, 0, 0.94444], 38: [0, 0.69444, 0.08528, 0, 0.88555], 39: ma, 40: [0.25, 0.75, 0.15806, 0, 0.47333], 41: [0.25, 0.75, 0.03306, 0, 0.47333], 42: [0, 0.75, 0.14333, 0, 0.59111], 43: [0.10333, 0.60333, 0.03306, 0, 0.88555], 44: [0.19444, 0.14722, 0, 0, 0.35555], 45: [0, 0.44444, 0.02611, 0, 0.41444], 46: [0, 0.14722, 0, 0, 0.35555], 47: [0.25, 0.75, 0.15806, 0, 0.59111], 48: Lr, 49: Lr, 50: Lr, 51: Lr, 52: Od, 53: Lr, 54: Lr, 55: Od, 56: Lr, 57: Lr, 58: [0, 0.44444, 0.06695, 0, 0.35555], 59: [0.19444, 0.44444, 0.06695, 0, 0.35555], 61: [-0.10889, 0.39111, 0.06833, 0, 0.88555], 63: Tl, 64: [0, 0.69444, 0.09208, 0, 0.88555], 65: [0, 0.68611, 0, 0, 0.86555], 66: [0, 0.68611, 0.0992, 0, 0.81666], 67: [0, 0.68611, 0.14208, 0, 0.82666], 68: [0, 0.68611, 0.09062, 0, 0.87555], 69: [0, 0.68611, 0.11431, 0, 0.75666], 70: [0, 0.68611, 0.12903, 0, 0.72722], 71: [0, 0.68611, 0.07347, 0, 0.89527], 72: El, 73: [0, 0.68611, 0.15681, 0, 0.47166], 74: [0, 0.68611, 0.145, 0, 0.61055], 75: [0, 0.68611, 0.14208, 0, 0.89499], 76: [0, 0.68611, 0, 0, 0.69777], 77: [0, 0.68611, 0.17208, 0, 1.07277], 78: El, 79: [0, 0.68611, 0.09062, 0, 0.85499], 80: [0, 0.68611, 0.0992, 0, 0.78721], 81: [0.19444, 0.68611, 0.09062, 0, 0.85499], 82: [0, 0.68611, 0.02559, 0, 0.85944], 83: [0, 0.68611, 0.11264, 0, 0.64999], 84: [0, 0.68611, 0.12903, 0, 0.7961], 85: [0, 0.68611, 0.17208, 0, 0.88083], 86: [0, 0.68611, 0.18625, 0, 0.86555], 87: [0, 0.68611, 0.18625, 0, 1.15999], 88: [0, 0.68611, 0.15681, 0, 0.86555], 89: [0, 0.68611, 0.19803, 0, 0.86555], 90: [0, 0.68611, 0.14208, 0, 0.70888], 91: [0.25, 0.75, 0.1875, 0, 0.35611], 93: [0.25, 0.75, 0.09972, 0, 0.35611], 94: Pd, 95: [0.31, 0.13444, 0.09811, 0, 0.59111], 97: [0, 0.44444, 0.09426, 0, 0.59111], 98: [0, 0.69444, 0.07861, 0, 0.53222], 99: [0, 0.44444, 0.05222, 0, 0.53222], 100: [0, 0.69444, 0.10861, 0, 0.59111], 101: [0, 0.44444, 0.085, 0, 0.53222], 102: [0.19444, 0.69444, 0.21778, 0, 0.4], 103: Bd, 104: [0, 0.69444, 0.09426, 0, 0.59111], 105: [0, 0.69326, 0.11387, 0, 0.35555], 106: [0.19444, 0.69326, 0.1672, 0, 0.35555], 107: [0, 0.69444, 0.11111, 0, 0.53222], 108: [0, 0.69444, 0.10861, 0, 0.29666], 109: [0, 0.44444, 0.09426, 0, 0.94444], 110: [0, 0.44444, 0.09426, 0, 0.64999], 111: [0, 0.44444, 0.07861, 0, 0.59111], 112: [0.19444, 0.44444, 0.07861, 0, 0.59111], 113: Bd, 114: [0, 0.44444, 0.11111, 0, 0.50167], 115: [0, 0.44444, 0.08167, 0, 0.48694], 116: [0, 0.63492, 0.09639, 0, 0.385], 117: [0, 0.44444, 0.09426, 0, 0.62055], 118: [0, 0.44444, 0.11111, 0, 0.53222], 119: [0, 0.44444, 0.11111, 0, 0.76777], 120: [0, 0.44444, 0.12583, 0, 0.56055], 121: [0.19444, 0.44444, 0.105, 0, 0.56166], 122: [0, 0.44444, 0.13889, 0, 0.49055], 126: [0.35, 0.34444, 0.11472, 0, 0.59111], 160: Z, 168: [0, 0.69444, 0.11473, 0, 0.59111], 176: Rd, 184: [0.17014, 0, 0, 0, 0.53222], 198: [0, 0.68611, 0.11431, 0, 1.02277], 216: [0.04861, 0.73472, 0.09062, 0, 0.88555], 223: [0.19444, 0.69444, 0.09736, 0, 0.665], 230: Kd, 248: [0.09722, 0.54167, 0.09458, 0, 0.59111], 305: [0, 0.44444, 0.09426, 0, 0.35555], 338: [0, 0.68611, 0.11431, 0, 1.14054], 339: Kd, 567: [0.19444, 0.44444, 0.04611, 0, 0.385], 710: Pd, 711: [0, 0.63194, 0.08271, 0, 0.59111], 713: [0, 0.59444, 0.10444, 0, 0.59111], 714: [0, 0.69444, 0.08528, 0, 0.59111], 715: [0, 0.69444, 0, 0, 0.59111], 728: [0, 0.69444, 0.10333, 0, 0.59111], 729: ma, 730: Rd, 732: Tl, 733: Tl, 915: [0, 0.68611, 0.12903, 0, 0.69777], 916: [0, 0.68611, 0, 0, 0.94444], 920: [0, 0.68611, 0.09062, 0, 0.88555], 923: [0, 0.68611, 0, 0, 0.80666], 926: [0, 0.68611, 0.15092, 0, 0.76777], 928: El, 931: [0, 0.68611, 0.11431, 0, 0.82666], 933: Id, 934: [0, 0.68611, 0.05632, 0, 0.82666], 936: Id, 937: [0, 0.68611, 0.0992, 0, 0.82666], 8211: [0, 0.44444, 0.09811, 0, 0.59111], 8212: [0, 0.44444, 0.09811, 0, 1.18221], 8216: ma, 8217: ma, 8220: [0, 0.69444, 0.16772, 0, 0.62055], 8221: zd }, "Main-Italic": { 32: Z, 33: ha, 34: Gd, 35: [0.19444, 0.69444, 0.06616, 0, 0.81777], 37: [0.05556, 0.75, 0.13639, 0, 0.81777], 38: [0, 0.69444, 0.09694, 0, 0.76666], 39: ha, 40: [0.25, 0.75, 0.16194, 0, 0.40889], 41: [0.25, 0.75, 0.03694, 0, 0.40889], 42: [0, 0.75, 0.14917, 0, 0.51111], 43: [0.05667, 0.56167, 0.03694, 0, 0.76666], 44: [0.19444, 0.10556, 0, 0, 0.30667], 45: [0, 0.43056, 0.02826, 0, 0.35778], 46: [0, 0.10556, 0, 0, 0.30667], 47: [0.25, 0.75, 0.16194, 0, 0.51111], 48: Ar, 49: Ar, 50: Ar, 51: Ar, 52: Nd, 53: Ar, 54: Ar, 55: Nd, 56: Ar, 57: Ar, 58: [0, 0.43056, 0.0582, 0, 0.30667], 59: [0.19444, 0.43056, 0.0582, 0, 0.30667], 61: [-0.13313, 0.36687, 0.06616, 0, 0.76666], 63: Hd, 64: [0, 0.69444, 0.09597, 0, 0.76666], 65: [0, 0.68333, 0, 0, 0.74333], 66: [0, 0.68333, 0.10257, 0, 0.70389], 67: [0, 0.68333, 0.14528, 0, 0.71555], 68: [0, 0.68333, 0.09403, 0, 0.755], 69: [0, 0.68333, 0.12028, 0, 0.67833], 70: [0, 0.68333, 0.13305, 0, 0.65277], 71: [0, 0.68333, 0.08722, 0, 0.77361], 72: pa, 73: [0, 0.68333, 0.15806, 0, 0.38555], 74: [0, 0.68333, 0.14028, 0, 0.525], 75: [0, 0.68333, 0.14528, 0, 0.76888], 76: [0, 0.68333, 0, 0, 0.62722], 77: [0, 0.68333, 0.16389, 0, 0.89666], 78: pa, 79: Wd, 80: [0, 0.68333, 0.10257, 0, 0.67833], 81: [0.19444, 0.68333, 0.09403, 0, 0.76666], 82: [0, 0.68333, 0.03868, 0, 0.72944], 83: [0, 0.68333, 0.11972, 0, 0.56222], 84: [0, 0.68333, 0.13305, 0, 0.71555], 85: pa, 86: [0, 0.68333, 0.18361, 0, 0.74333], 87: [0, 0.68333, 0.18361, 0, 0.99888], 88: [0, 0.68333, 0.15806, 0, 0.74333], 89: [0, 0.68333, 0.19383, 0, 0.74333], 90: [0, 0.68333, 0.14528, 0, 0.61333], 91: [0.25, 0.75, 0.1875, 0, 0.30667], 93: [0.25, 0.75, 0.10528, 0, 0.30667], 94: Vd, 95: [0.31, 0.12056, 0.09208, 0, 0.51111], 97: [0, 0.43056, 0.07671, 0, 0.51111], 98: [0, 0.69444, 0.06312, 0, 0.46], 99: [0, 0.43056, 0.05653, 0, 0.46], 100: [0, 0.69444, 0.10333, 0, 0.51111], 101: [0, 0.43056, 0.07514, 0, 0.46], 102: [0.19444, 0.69444, 0.21194, 0, 0.30667], 103: Fd, 104: [0, 0.69444, 0.07671, 0, 0.51111], 105: [0, 0.65536, 0.1019, 0, 0.30667], 106: [0.19444, 0.65536, 0.14467, 0, 0.30667], 107: [0, 0.69444, 0.10764, 0, 0.46], 108: [0, 0.69444, 0.10333, 0, 0.25555], 109: [0, 0.43056, 0.07671, 0, 0.81777], 110: [0, 0.43056, 0.07671, 0, 0.56222], 111: [0, 0.43056, 0.06312, 0, 0.51111], 112: [0.19444, 0.43056, 0.06312, 0, 0.51111], 113: Fd, 114: [0, 0.43056, 0.10764, 0, 0.42166], 115: [0, 0.43056, 0.08208, 0, 0.40889], 116: [0, 0.61508, 0.09486, 0, 0.33222], 117: [0, 0.43056, 0.07671, 0, 0.53666], 118: [0, 0.43056, 0.10764, 0, 0.46], 119: [0, 0.43056, 0.10764, 0, 0.66444], 120: [0, 0.43056, 0.12042, 0, 0.46389], 121: [0.19444, 0.43056, 0.08847, 0, 0.48555], 122: [0, 0.43056, 0.12292, 0, 0.40889], 126: [0.35, 0.31786, 0.11585, 0, 0.51111], 160: Z, 168: [0, 0.66786, 0.10474, 0, 0.51111], 176: qd, 184: [0.17014, 0, 0, 0, 0.46], 198: [0, 0.68333, 0.12028, 0, 0.88277], 216: [0.04861, 0.73194, 0.09403, 0, 0.76666], 223: [0.19444, 0.69444, 0.10514, 0, 0.53666], 230: $d, 248: [0.09722, 0.52778, 0.09194, 0, 0.51111], 338: [0, 0.68333, 0.12028, 0, 0.98499], 339: $d, 710: Vd, 711: [0, 0.62847, 0.08295, 0, 0.51111], 713: [0, 0.56167, 0.10333, 0, 0.51111], 714: [0, 0.69444, 0.09694, 0, 0.51111], 715: [0, 0.69444, 0, 0, 0.51111], 728: [0, 0.69444, 0.10806, 0, 0.51111], 729: [0, 0.66786, 0.11752, 0, 0.30667], 730: qd, 732: [0, 0.66786, 0.11585, 0, 0.51111], 733: Hd, 915: [0, 0.68333, 0.13305, 0, 0.62722], 916: [0, 0.68333, 0, 0, 0.81777], 920: Wd, 923: [0, 0.68333, 0, 0, 0.69222], 926: [0, 0.68333, 0.15294, 0, 0.66444], 928: pa, 931: [0, 0.68333, 0.12028, 0, 0.71555], 933: Ud, 934: [0, 0.68333, 0.05986, 0, 0.71555], 936: Ud, 937: [0, 0.68333, 0.10257, 0, 0.71555], 8211: [0, 0.43056, 0.09208, 0, 0.51111], 8212: [0, 0.43056, 0.09208, 0, 1.02222], 8216: ha, 8217: ha, 8220: [0, 0.69444, 0.1685, 0, 0.51444], 8221: Gd, 8463: Jo }, "Main-Regular": { 32: Z, 33: tr, 34: ke, 35: Nm, 36: Kl, 37: Fm, 38: oi, 39: tr, 40: qi, 41: qi, 42: $m, 43: nt, 44: [0.19444, 0.10556, 0, 0, 0.27778], 45: [0, 0.43056, 0, 0, 0.33333], 46: [0, 0.10556, 0, 0, 0.27778], 47: rr, 48: it, 49: it, 50: it, 51: it, 52: it, 53: it, 54: it, 55: it, 56: it, 57: it, 58: Zd, 59: [0.19444, 0.43056, 0, 0, 0.27778], 60: Mr, 61: ea, 62: Mr, 63: ql, 64: oi, 65: ai, 66: [0, 0.68333, 0, 0, 0.70834], 67: $n, 68: [0, 0.68333, 0, 0, 0.76389], 69: jd, 70: [0, 0.68333, 0, 0, 0.65278], 71: [0, 0.68333, 0, 0, 0.78472], 72: ai, 73: [0, 0.68333, 0, 0, 0.36111], 74: [0, 0.68333, 0, 0, 0.51389], 75: Fn, 76: tm, 77: [0, 0.68333, 0, 0, 0.91667], 78: ai, 79: Fn, 80: jd, 81: [0.19444, 0.68333, 0, 0, 0.77778], 82: [0, 0.68333, 0, 0, 0.73611], 83: [0, 0.68333, 0, 0, 0.55556], 84: $n, 85: ai, 86: [0, 0.68333, 0.01389, 0, 0.75], 87: [0, 0.68333, 0.01389, 0, 1.02778], 88: ai, 89: [0, 0.68333, 0.025, 0, 0.75], 90: [0, 0.68333, 0, 0, 0.61111], 91: fa, 92: rr, 93: fa, 94: ke, 95: [0.31, 0.12056, 0.02778, 0, 0.5], 97: Vn, 98: Hi, 99: Dl, 100: Hi, 101: Dl, 102: [0, 0.69444, 0.07778, 0, 0.30556], 103: [0.19444, 0.43056, 0.01389, 0, 0.5], 104: Hi, 105: Yd, 106: [0.19444, 0.66786, 0, 0, 0.30556], 107: [0, 0.69444, 0, 0, 0.52778], 108: tr, 109: [0, 0.43056, 0, 0, 0.83334], 110: Xd, 111: Vn, 112: Jd, 113: [0.19444, 0.43056, 0, 0, 0.52778], 114: [0, 0.43056, 0, 0, 0.39167], 115: [0, 0.43056, 0, 0, 0.39445], 116: [0, 0.61508, 0, 0, 0.38889], 117: Xd, 118: [0, 0.43056, 0.01389, 0, 0.52778], 119: [0, 0.43056, 0.01389, 0, 0.72222], 120: [0, 0.43056, 0, 0, 0.52778], 121: [0.19444, 0.43056, 0.01389, 0, 0.52778], 122: Dl, 123: rr, 124: fa, 125: rr, 126: [0.35, 0.31786, 0, 0, 0.5], 160: Z, 163: [0, 0.69444, 0, 0, 0.76909], 167: Ol, 168: em, 172: [0, 0.43056, 0, 0, 0.66667], 176: Qd, 177: nt, 182: Bl, 184: $l, 198: [0, 0.68333, 0, 0, 0.90278], 215: nt, 216: [0.04861, 0.73194, 0, 0, 0.77778], 223: ke, 230: [0, 0.43056, 0, 0, 0.72222], 247: nt, 248: [0.09722, 0.52778, 0, 0, 0.5], 305: Zd, 338: [0, 0.68333, 0, 0, 1.01389], 339: am, 567: [0.19444, 0.43056, 0, 0, 0.30556], 710: ke, 711: [0, 0.62847, 0, 0, 0.5], 713: [0, 0.56778, 0, 0, 0.5], 714: ke, 715: ke, 728: ke, 729: Yd, 730: Qd, 732: em, 733: ke, 915: tm, 916: nm, 920: Fn, 923: [0, 0.68333, 0, 0, 0.69445], 926: [0, 0.68333, 0, 0, 0.66667], 928: ai, 931: $n, 933: Fn, 934: $n, 936: Fn, 937: $n, 8211: [0, 0.43056, 0.02778, 0, 0.5], 8212: [0, 0.43056, 0.02778, 0, 1], 8216: tr, 8217: tr, 8220: ke, 8221: ke, 8224: Ol, 8225: Ol, 8230: [0, 0.12, 0, 0, 1.172], 8242: [0, 0.55556, 0, 0, 0.275], 8407: [0, 0.71444, 0.15382, 0, 0.5], 8463: Jo, 8465: qn, 8467: [0, 0.69444, 0, 0.11111, 0.41667], 8472: [0.19444, 0.43056, 0, 0.11111, 0.63646], 8476: qn, 8501: Cr, 8592: Be, 8593: rm, 8594: Be, 8595: rm, 8596: Be, 8597: rr, 8598: Hn, 8599: Hn, 8600: Hn, 8601: Hn, 8614: [0.011, 0.511, 0, 0, 1], 8617: im, 8618: im, 8636: Be, 8637: Be, 8640: Be, 8641: Be, 8652: [0.011, 0.671, 0, 0, 1], 8656: Be, 8657: Bl, 8658: Be, 8659: Bl, 8660: Be, 8661: [0.25, 0.75, 0, 0, 0.61111], 8704: Hi, 8706: [0, 0.69444, 0.05556, 0.08334, 0.5309], 8707: Hi, 8709: Kl, 8711: nm, 8712: om, 8715: om, 8722: nt, 8723: nt, 8725: rr, 8726: rr, 8727: ba, 8728: Pl, 8729: Pl, 8730: [0.2, 0.8, 0, 0, 0.83334], 8733: am, 8734: yl, 8736: Rn, 8739: fa, 8741: rr, 8743: si, 8744: si, 8745: si, 8746: si, 8747: [0.19444, 0.69444, 0.11111, 0, 0.41667], 8764: ea, 8768: [0.19444, 0.69444, 0, 0, 0.27778], 8771: ga, 8773: [-0.022, 0.589, 0, 0, 1], 8776: sm, 8781: ga, 8784: [-0.133, 0.67, 0, 0, 0.778], 8801: ga, 8804: qe, 8805: qe, 8810: lm, 8811: lm, 8826: Mr, 8827: Mr, 8834: Mr, 8835: Mr, 8838: qe, 8839: qe, 8846: si, 8849: qe, 8850: qe, 8851: si, 8852: si, 8853: nt, 8854: nt, 8855: nt, 8856: nt, 8857: nt, 8866: Cr, 8867: Cr, 8868: oi, 8869: oi, 8872: [0.249, 0.75, 0, 0, 0.867], 8900: Pl, 8901: [-0.05555, 0.44445, 0, 0, 0.27778], 8902: ba, 8904: [5e-3, 0.505, 0, 0, 0.9], 8942: [0.03, 0.9, 0, 0, 0.278], 8943: [-0.19, 0.31, 0, 0, 1.172], 8945: [-0.1, 0.82, 0, 0, 1.282], 8968: ya, 8969: ya, 8970: ya, 8971: ya, 8994: cm, 8995: cm, 9136: xa, 9137: xa, 9651: um, 9657: ba, 9661: um, 9667: ba, 9711: Hn, 9824: va, 9825: va, 9826: va, 9827: va, 9837: [0, 0.75, 0, 0, 0.38889], 9838: dm, 9839: dm, 10216: qi, 10217: qi, 10222: xa, 10223: xa, 10229: [0.011, 0.511, 0, 0, 1.609], 10230: mm, 10231: [0.011, 0.511, 0, 0, 1.859], 10232: [0.024, 0.525, 0, 0, 1.609], 10233: [0.024, 0.525, 0, 0, 1.638], 10234: [0.024, 0.525, 0, 0, 1.858], 10236: mm, 10815: ai, 10927: qe, 10928: qe, 57376: hm }, "Math-BoldItalic": { 32: Z, 48: _a, 49: _a, 50: _a, 51: Wn, 52: Wn, 53: Wn, 54: rt, 55: Wn, 56: rt, 57: Wn, 65: Ml, 66: [0, 0.68611, 0.04835, 0, 0.8664], 67: [0, 0.68611, 0.06979, 0, 0.81694], 68: [0, 0.68611, 0.03194, 0, 0.93812], 69: [0, 0.68611, 0.05451, 0, 0.81007], 70: [0, 0.68611, 0.15972, 0, 0.68889], 71: [0, 0.68611, 0, 0, 0.88673], 72: bm, 73: [0, 0.68611, 0.07778, 0, 0.51111], 74: [0, 0.68611, 0.10069, 0, 0.63125], 75: [0, 0.68611, 0.06979, 0, 0.97118], 76: pm, 77: [0, 0.68611, 0.11424, 0, 1.14201], 78: [0, 0.68611, 0.11424, 0, 0.95034], 79: [0, 0.68611, 0.03194, 0, 0.83666], 80: [0, 0.68611, 0.15972, 0, 0.72309], 81: [0.19444, 0.68611, 0, 0, 0.86861], 82: [0, 0.68611, 421e-5, 0, 0.87235], 83: [0, 0.68611, 0.05382, 0, 0.69271], 84: [0, 0.68611, 0.15972, 0, 0.63663], 85: [0, 0.68611, 0.11424, 0, 0.80027], 86: [0, 0.68611, 0.25555, 0, 0.67778], 87: [0, 0.68611, 0.15972, 0, 1.09305], 88: [0, 0.68611, 0.07778, 0, 0.94722], 89: [0, 0.68611, 0.25555, 0, 0.67458], 90: [0, 0.68611, 0.06979, 0, 0.77257], 97: [0, 0.44444, 0, 0, 0.63287], 98: [0, 0.69444, 0, 0, 0.52083], 99: [0, 0.44444, 0, 0, 0.51342], 100: [0, 0.69444, 0, 0, 0.60972], 101: [0, 0.44444, 0, 0, 0.55361], 102: [0.19444, 0.69444, 0.11042, 0, 0.56806], 103: [0.19444, 0.44444, 0.03704, 0, 0.5449], 104: fm, 105: [0, 0.69326, 0, 0, 0.4048], 106: [0.19444, 0.69326, 0.0622, 0, 0.47083], 107: [0, 0.69444, 0.01852, 0, 0.6037], 108: [0, 0.69444, 88e-4, 0, 0.34815], 109: [0, 0.44444, 0, 0, 1.0324], 110: [0, 0.44444, 0, 0, 0.71296], 111: xm, 112: [0.19444, 0.44444, 0, 0, 0.60092], 113: [0.19444, 0.44444, 0.03704, 0, 0.54213], 114: [0, 0.44444, 0.03194, 0, 0.5287], 115: [0, 0.44444, 0, 0, 0.53125], 116: [0, 0.63492, 0, 0, 0.41528], 117: [0, 0.44444, 0, 0, 0.68102], 118: [0, 0.44444, 0.03704, 0, 0.56666], 119: [0, 0.44444, 0.02778, 0, 0.83148], 120: [0, 0.44444, 0, 0, 0.65903], 121: [0.19444, 0.44444, 0.03704, 0, 0.59028], 122: [0, 0.44444, 0.04213, 0, 0.55509], 160: Z, 915: [0, 0.68611, 0.15972, 0, 0.65694], 916: kl, 920: [0, 0.68611, 0.03194, 0, 0.86722], 923: gm, 926: [0, 0.68611, 0.07458, 0, 0.84125], 928: bm, 931: [0, 0.68611, 0.05451, 0, 0.88507], 933: [0, 0.68611, 0.15972, 0, 0.67083], 934: ym, 936: [0, 0.68611, 0.11653, 0, 0.71402], 937: [0, 0.68611, 0.04835, 0, 0.8789], 945: [0, 0.44444, 0, 0, 0.76064], 946: [0.19444, 0.69444, 0.03403, 0, 0.65972], 947: [0.19444, 0.44444, 0.06389, 0, 0.59003], 948: [0, 0.69444, 0.03819, 0, 0.52222], 949: [0, 0.44444, 0, 0, 0.52882], 950: [0.19444, 0.69444, 0.06215, 0, 0.50833], 951: [0.19444, 0.44444, 0.03704, 0, 0.6], 952: [0, 0.69444, 0.03194, 0, 0.5618], 953: [0, 0.44444, 0, 0, 0.41204], 954: [0, 0.44444, 0, 0, 0.66759], 955: [0, 0.69444, 0, 0, 0.67083], 956: [0.19444, 0.44444, 0, 0, 0.70787], 957: [0, 0.44444, 0.06898, 0, 0.57685], 958: [0.19444, 0.69444, 0.03021, 0, 0.50833], 959: xm, 960: [0, 0.44444, 0.03704, 0, 0.68241], 961: vm, 962: [0.09722, 0.44444, 0.07917, 0, 0.42361], 963: [0, 0.44444, 0.03704, 0, 0.68588], 964: [0, 0.44444, 0.13472, 0, 0.52083], 965: [0, 0.44444, 0.03704, 0, 0.63055], 966: [0.19444, 0.44444, 0, 0, 0.74722], 967: [0.19444, 0.44444, 0, 0, 0.71805], 968: [0.19444, 0.69444, 0.03704, 0, 0.75833], 969: [0, 0.44444, 0.03704, 0, 0.71782], 977: [0, 0.69444, 0, 0, 0.69155], 981: [0.19444, 0.69444, 0, 0, 0.7125], 982: [0, 0.44444, 0.03194, 0, 0.975], 1009: vm, 1013: [0, 0.44444, 0, 0, 0.48333], 57649: [0, 0.44444, 0, 0, 0.39352], 57911: [0.19444, 0.44444, 0, 0, 0.43889] }, "Math-Italic": { 32: Z, 48: Vn, 49: Vn, 50: Vn, 51: Un, 52: Un, 53: Un, 54: it, 55: Un, 56: it, 57: Un, 65: [0, 0.68333, 0, 0.13889, 0.75], 66: [0, 0.68333, 0.05017, 0.08334, 0.75851], 67: [0, 0.68333, 0.07153, 0.08334, 0.71472], 68: [0, 0.68333, 0.02778, 0.05556, 0.82792], 69: [0, 0.68333, 0.05764, 0.08334, 0.7382], 70: [0, 0.68333, 0.13889, 0.08334, 0.64306], 71: [0, 0.68333, 0, 0.08334, 0.78625], 72: Mm, 73: [0, 0.68333, 0.07847, 0.11111, 0.43958], 74: [0, 0.68333, 0.09618, 0.16667, 0.55451], 75: [0, 0.68333, 0.07153, 0.05556, 0.84931], 76: [0, 0.68333, 0, 0.02778, 0.68056], 77: [0, 0.68333, 0.10903, 0.08334, 0.97014], 78: [0, 0.68333, 0.10903, 0.08334, 0.80347], 79: _m, 80: [0, 0.68333, 0.13889, 0.08334, 0.64201], 81: [0.19444, 0.68333, 0, 0.08334, 0.79056], 82: [0, 0.68333, 773e-5, 0.08334, 0.75929], 83: [0, 0.68333, 0.05764, 0.08334, 0.6132], 84: [0, 0.68333, 0.13889, 0.08334, 0.58438], 85: [0, 0.68333, 0.10903, 0.02778, 0.68278], 86: [0, 0.68333, 0.22222, 0, 0.58333], 87: [0, 0.68333, 0.13889, 0, 0.94445], 88: [0, 0.68333, 0.07847, 0.08334, 0.82847], 89: [0, 0.68333, 0.22222, 0, 0.58056], 90: [0, 0.68333, 0.07153, 0.08334, 0.68264], 97: [0, 0.43056, 0, 0, 0.52859], 98: [0, 0.69444, 0, 0, 0.42917], 99: [0, 0.43056, 0, 0.05556, 0.43276], 100: [0, 0.69444, 0, 0.16667, 0.52049], 101: [0, 0.43056, 0, 0.05556, 0.46563], 102: [0.19444, 0.69444, 0.10764, 0.16667, 0.48959], 103: [0.19444, 0.43056, 0.03588, 0.02778, 0.47697], 104: [0, 0.69444, 0, 0, 0.57616], 105: [0, 0.65952, 0, 0, 0.34451], 106: [0.19444, 0.65952, 0.05724, 0, 0.41181], 107: [0, 0.69444, 0.03148, 0, 0.5206], 108: [0, 0.69444, 0.01968, 0.08334, 0.29838], 109: [0, 0.43056, 0, 0, 0.87801], 110: [0, 0.43056, 0, 0, 0.60023], 111: wm, 112: [0.19444, 0.43056, 0, 0.08334, 0.50313], 113: [0.19444, 0.43056, 0.03588, 0.08334, 0.44641], 114: [0, 0.43056, 0.02778, 0.05556, 0.45116], 115: [0, 0.43056, 0, 0.05556, 0.46875], 116: [0, 0.61508, 0, 0.08334, 0.36111], 117: [0, 0.43056, 0, 0.02778, 0.57246], 118: [0, 0.43056, 0.03588, 0.02778, 0.48472], 119: [0, 0.43056, 0.02691, 0.08334, 0.71592], 120: [0, 0.43056, 0, 0.02778, 0.57153], 121: [0.19444, 0.43056, 0.03588, 0.05556, 0.49028], 122: [0, 0.43056, 0.04398, 0.05556, 0.46505], 160: Z, 915: [0, 0.68333, 0.13889, 0.08334, 0.61528], 916: [0, 0.68333, 0, 0.16667, 0.83334], 920: _m, 923: [0, 0.68333, 0, 0.16667, 0.69445], 926: [0, 0.68333, 0.07569, 0.08334, 0.74236], 928: Mm, 931: [0, 0.68333, 0.05764, 0.08334, 0.77986], 933: [0, 0.68333, 0.13889, 0.05556, 0.58333], 934: [0, 0.68333, 0, 0.08334, 0.66667], 936: [0, 0.68333, 0.11, 0.05556, 0.61222], 937: [0, 0.68333, 0.05017, 0.08334, 0.7724], 945: [0, 0.43056, 37e-4, 0.02778, 0.6397], 946: [0.19444, 0.69444, 0.05278, 0.08334, 0.56563], 947: [0.19444, 0.43056, 0.05556, 0, 0.51773], 948: [0, 0.69444, 0.03785, 0.05556, 0.44444], 949: [0, 0.43056, 0, 0.08334, 0.46632], 950: [0.19444, 0.69444, 0.07378, 0.08334, 0.4375], 951: [0.19444, 0.43056, 0.03588, 0.05556, 0.49653], 952: [0, 0.69444, 0.02778, 0.08334, 0.46944], 953: [0, 0.43056, 0, 0.05556, 0.35394], 954: [0, 0.43056, 0, 0, 0.57616], 955: [0, 0.69444, 0, 0, 0.58334], 956: [0.19444, 0.43056, 0, 0.02778, 0.60255], 957: [0, 0.43056, 0.06366, 0.02778, 0.49398], 958: [0.19444, 0.69444, 0.04601, 0.11111, 0.4375], 959: wm, 960: [0, 0.43056, 0.03588, 0, 0.57003], 961: Sm, 962: [0.09722, 0.43056, 0.07986, 0.08334, 0.36285], 963: [0, 0.43056, 0.03588, 0, 0.57141], 964: [0, 0.43056, 0.1132, 0.02778, 0.43715], 965: [0, 0.43056, 0.03588, 0.02778, 0.54028], 966: [0.19444, 0.43056, 0, 0.08334, 0.65417], 967: [0.19444, 0.43056, 0, 0.05556, 0.62569], 968: [0.19444, 0.69444, 0.03588, 0.11111, 0.65139], 969: [0, 0.43056, 0.03588, 0, 0.62245], 977: [0, 0.69444, 0, 0.08334, 0.59144], 981: [0.19444, 0.69444, 0, 0.08334, 0.59583], 982: [0, 0.43056, 0.02778, 0, 0.82813], 1009: Sm, 1013: [0, 0.43056, 0, 0.05556, 0.4059], 57649: [0, 0.43056, 0, 0.02778, 0.32246], 57911: [0.19444, 0.43056, 0, 0.08334, 0.38403] }, "SansSerif-Bold": { 32: Z, 33: [0, 0.69444, 0, 0, 0.36667], 34: Nl, 35: [0.19444, 0.69444, 0, 0, 0.91667], 36: [0.05556, 0.75, 0, 0, 0.55], 37: [0.05556, 0.75, 0, 0, 1.02912], 38: [0, 0.69444, 0, 0, 0.83056], 39: Ma, 40: km, 41: km, 42: [0, 0.75, 0, 0, 0.55], 43: [0.11667, 0.61667, 0, 0, 0.85556], 44: [0.10556, 0.13056, 0, 0, 0.30556], 45: [0, 0.45833, 0, 0, 0.36667], 46: [0, 0.13056, 0, 0, 0.30556], 47: [0.25, 0.75, 0, 0, 0.55], 48: Ce, 49: Ce, 50: Ce, 51: Ce, 52: Ce, 53: Ce, 54: Ce, 55: Ce, 56: Ce, 57: Ce, 58: [0, 0.45833, 0, 0, 0.30556], 59: [0.10556, 0.45833, 0, 0, 0.30556], 61: [-0.09375, 0.40625, 0, 0, 0.85556], 63: Lm, 64: ir, 65: ir, 66: ir, 67: Rl, 68: Er, 69: [0, 0.69444, 0, 0, 0.64167], 70: Cr, 71: ir, 72: Er, 73: [0, 0.69444, 0, 0, 0.33056], 74: Lm, 75: Am, 76: Om, 77: [0, 0.69444, 0, 0, 0.97778], 78: Er, 79: Er, 80: Rl, 81: [0.10556, 0.69444, 0, 0, 0.79445], 82: Rl, 83: Cr, 84: ir, 85: Am, 86: [0, 0.69444, 0.01528, 0, 0.73334], 87: [0, 0.69444, 0.01528, 0, 1.03889], 88: ir, 89: [0, 0.69444, 0.0275, 0, 0.73334], 90: Bm, 91: Cm, 93: Cm, 94: Ce, 95: [0.35, 0.10833, 0.03056, 0, 0.55], 97: [0, 0.45833, 0, 0, 0.525], 98: Il, 99: [0, 0.45833, 0, 0, 0.48889], 100: Il, 101: [0, 0.45833, 0, 0, 0.51111], 102: [0, 0.69444, 0.07639, 0, 0.33611], 103: [0.19444, 0.45833, 0.01528, 0, 0.55], 104: Il, 105: Em, 106: [0.19444, 0.69444, 0, 0, 0.28611], 107: [0, 0.69444, 0, 0, 0.53056], 108: Em, 109: [0, 0.45833, 0, 0, 0.86667], 110: Dm, 111: [0, 0.45833, 0, 0, 0.55], 112: Tm, 113: Tm, 114: [0, 0.45833, 0.01528, 0, 0.37222], 115: [0, 0.45833, 0, 0, 0.42167], 116: [0, 0.58929, 0, 0, 0.40417], 117: Dm, 118: [0, 0.45833, 0.01528, 0, 0.5], 119: [0, 0.45833, 0.01528, 0, 0.74445], 120: [0, 0.45833, 0, 0, 0.5], 121: [0.19444, 0.45833, 0.01528, 0, 0.5], 122: [0, 0.45833, 0, 0, 0.47639], 126: [0.35, 0.34444, 0, 0, 0.55], 160: Z, 168: Ce, 176: ir, 180: Ce, 184: [0.17014, 0, 0, 0, 0.48889], 305: [0, 0.45833, 0, 0, 0.25556], 567: [0.19444, 0.45833, 0, 0, 0.28611], 710: Ce, 711: [0, 0.63542, 0, 0, 0.55], 713: [0, 0.63778, 0, 0, 0.55], 728: Ce, 729: Ma, 730: ir, 732: Ce, 733: Ce, 915: Om, 916: [0, 0.69444, 0, 0, 0.91667], 920: zl, 923: Bm, 926: ir, 928: Er, 931: Er, 933: zl, 934: Er, 936: zl, 937: Er, 8211: [0, 0.45833, 0.03056, 0, 0.55], 8212: [0, 0.45833, 0.03056, 0, 1.10001], 8216: Ma, 8217: Ma, 8220: Nl, 8221: Nl }, "SansSerif-Italic": { 32: Z, 33: [0, 0.69444, 0.05733, 0, 0.31945], 34: zm, 35: [0.19444, 0.69444, 0.05087, 0, 0.83334], 36: [0.05556, 0.75, 0.11156, 0, 0.5], 37: [0.05556, 0.75, 0.03126, 0, 0.83334], 38: [0, 0.69444, 0.03058, 0, 0.75834], 39: Vl, 40: [0.25, 0.75, 0.13164, 0, 0.38889], 41: [0.25, 0.75, 0.02536, 0, 0.38889], 42: [0, 0.75, 0.11775, 0, 0.5], 43: [0.08333, 0.58333, 0.02536, 0, 0.77778], 44: Vm, 45: [0, 0.44444, 0.01946, 0, 0.33333], 46: qm, 47: [0.25, 0.75, 0.13164, 0, 0.5], 48: Bt, 49: Bt, 50: Bt, 51: Bt, 52: Bt, 53: Bt, 54: Bt, 55: Bt, 56: Bt, 57: Bt, 58: [0, 0.44444, 0.02502, 0, 0.27778], 59: [0.125, 0.44444, 0.02502, 0, 0.27778], 61: [-0.13, 0.37, 0.05087, 0, 0.77778], 63: [0, 0.69444, 0.11809, 0, 0.47222], 64: [0, 0.69444, 0.07555, 0, 0.66667], 65: nr, 66: [0, 0.69444, 0.08293, 0, 0.66667], 67: [0, 0.69444, 0.11983, 0, 0.63889], 68: [0, 0.69444, 0.07555, 0, 0.72223], 69: [0, 0.69444, 0.11983, 0, 0.59722], 70: [0, 0.69444, 0.13372, 0, 0.56945], 71: [0, 0.69444, 0.11983, 0, 0.66667], 72: Fl, 73: [0, 0.69444, 0.13372, 0, 0.27778], 74: [0, 0.69444, 0.08094, 0, 0.47222], 75: [0, 0.69444, 0.11983, 0, 0.69445], 76: Hl, 77: [0, 0.69444, 0.08094, 0, 0.875], 78: Fl, 79: [0, 0.69444, 0.07555, 0, 0.73611], 80: [0, 0.69444, 0.08293, 0, 0.63889], 81: [0.125, 0.69444, 0.07555, 0, 0.73611], 82: [0, 0.69444, 0.08293, 0, 0.64584], 83: [0, 0.69444, 0.09205, 0, 0.55556], 84: [0, 0.69444, 0.13372, 0, 0.68056], 85: [0, 0.69444, 0.08094, 0, 0.6875], 86: [0, 0.69444, 0.1615, 0, 0.66667], 87: [0, 0.69444, 0.1615, 0, 0.94445], 88: [0, 0.69444, 0.13372, 0, 0.66667], 89: [0, 0.69444, 0.17261, 0, 0.66667], 90: [0, 0.69444, 0.11983, 0, 0.61111], 91: [0.25, 0.75, 0.15942, 0, 0.28889], 93: [0.25, 0.75, 0.08719, 0, 0.28889], 94: Km, 95: [0.35, 0.09444, 0.08616, 0, 0.5], 97: [0, 0.44444, 981e-5, 0, 0.48056], 98: [0, 0.69444, 0.03057, 0, 0.51667], 99: [0, 0.44444, 0.08336, 0, 0.44445], 100: [0, 0.69444, 0.09483, 0, 0.51667], 101: [0, 0.44444, 0.06778, 0, 0.44445], 102: [0, 0.69444, 0.21705, 0, 0.30556], 103: [0.19444, 0.44444, 0.10836, 0, 0.5], 104: [0, 0.69444, 0.01778, 0, 0.51667], 105: [0, 0.67937, 0.09718, 0, 0.23889], 106: [0.19444, 0.67937, 0.09162, 0, 0.26667], 107: [0, 0.69444, 0.08336, 0, 0.48889], 108: [0, 0.69444, 0.09483, 0, 0.23889], 109: [0, 0.44444, 0.01778, 0, 0.79445], 110: [0, 0.44444, 0.01778, 0, 0.51667], 111: [0, 0.44444, 0.06613, 0, 0.5], 112: [0.19444, 0.44444, 0.0389, 0, 0.51667], 113: [0.19444, 0.44444, 0.04169, 0, 0.51667], 114: [0, 0.44444, 0.10836, 0, 0.34167], 115: [0, 0.44444, 0.0778, 0, 0.38333], 116: [0, 0.57143, 0.07225, 0, 0.36111], 117: [0, 0.44444, 0.04169, 0, 0.51667], 118: [0, 0.44444, 0.10836, 0, 0.46111], 119: [0, 0.44444, 0.10836, 0, 0.68334], 120: [0, 0.44444, 0.09169, 0, 0.46111], 121: [0.19444, 0.44444, 0.10836, 0, 0.46111], 122: [0, 0.44444, 0.08752, 0, 0.43472], 126: [0.35, 0.32659, 0.08826, 0, 0.5], 160: Z, 168: [0, 0.67937, 0.06385, 0, 0.5], 176: Pm, 184: $l, 305: [0, 0.44444, 0.04169, 0, 0.23889], 567: [0.19444, 0.44444, 0.04169, 0, 0.26667], 710: Km, 711: [0, 0.63194, 0.08432, 0, 0.5], 713: [0, 0.60889, 0.08776, 0, 0.5], 714: Rm, 715: ke, 728: [0, 0.69444, 0.09483, 0, 0.5], 729: [0, 0.67937, 0.07774, 0, 0.27778], 730: Pm, 732: [0, 0.67659, 0.08826, 0, 0.5], 733: Rm, 915: [0, 0.69444, 0.13372, 0, 0.54167], 916: Xm, 920: [0, 0.69444, 0.07555, 0, 0.77778], 923: Cr, 926: [0, 0.69444, 0.12816, 0, 0.66667], 928: Fl, 931: [0, 0.69444, 0.11983, 0, 0.72222], 933: Im, 934: [0, 0.69444, 0.04603, 0, 0.72222], 936: Im, 937: [0, 0.69444, 0.08293, 0, 0.72222], 8211: [0, 0.44444, 0.08616, 0, 0.5], 8212: [0, 0.44444, 0.08616, 0, 1], 8216: Vl, 8217: Vl, 8220: [0, 0.69444, 0.14205, 0, 0.5], 8221: zm }, "SansSerif-Regular": { 32: Z, 33: [0, 0.69444, 0, 0, 0.31945], 34: ke, 35: Nm, 36: Kl, 37: Fm, 38: [0, 0.69444, 0, 0, 0.75834], 39: tr, 40: qi, 41: qi, 42: $m, 43: nt, 44: Vm, 45: [0, 0.44444, 0, 0, 0.33333], 46: qm, 47: rr, 48: Kt, 49: Kt, 50: Kt, 51: Kt, 52: Kt, 53: Kt, 54: Kt, 55: Kt, 56: Kt, 57: Kt, 58: [0, 0.44444, 0, 0, 0.27778], 59: [0.125, 0.44444, 0, 0, 0.27778], 61: [-0.13, 0.37, 0, 0, 0.77778], 63: ql, 64: nr, 65: nr, 66: nr, 67: ii, 68: [0, 0.69444, 0, 0, 0.72223], 69: Hm, 70: [0, 0.69444, 0, 0, 0.56945], 71: nr, 72: Wl, 73: tr, 74: ql, 75: [0, 0.69444, 0, 0, 0.69445], 76: Hl, 77: [0, 0.69444, 0, 0, 0.875], 78: Wl, 79: [0, 0.69444, 0, 0, 0.73611], 80: ii, 81: [0.125, 0.69444, 0, 0, 0.73611], 82: [0, 0.69444, 0, 0, 0.64584], 83: Hi, 84: [0, 0.69444, 0, 0, 0.68056], 85: [0, 0.69444, 0, 0, 0.6875], 86: [0, 0.69444, 0.01389, 0, 0.66667], 87: [0, 0.69444, 0.01389, 0, 0.94445], 88: nr, 89: [0, 0.69444, 0.025, 0, 0.66667], 90: Cr, 91: Wm, 93: Wm, 94: ke, 95: [0.35, 0.09444, 0.02778, 0, 0.5], 97: [0, 0.44444, 0, 0, 0.48056], 98: Ul, 99: Um, 100: Ul, 101: Um, 102: [0, 0.69444, 0.06944, 0, 0.30556], 103: [0.19444, 0.44444, 0.01389, 0, 0.5], 104: Ul, 105: [0, 0.67937, 0, 0, 0.23889], 106: [0.19444, 0.67937, 0, 0, 0.26667], 107: [0, 0.69444, 0, 0, 0.48889], 108: [0, 0.69444, 0, 0, 0.23889], 109: [0, 0.44444, 0, 0, 0.79445], 110: Jm, 111: [0, 0.44444, 0, 0, 0.5], 112: Gm, 113: Gm, 114: [0, 0.44444, 0.01389, 0, 0.34167], 115: jm, 116: [0, 0.57143, 0, 0, 0.36111], 117: Jm, 118: [0, 0.44444, 0.01389, 0, 0.46111], 119: [0, 0.44444, 0.01389, 0, 0.68334], 120: [0, 0.44444, 0, 0, 0.46111], 121: [0.19444, 0.44444, 0.01389, 0, 0.46111], 122: [0, 0.44444, 0, 0, 0.43472], 126: [0.35, 0.32659, 0, 0, 0.5], 160: Z, 168: [0, 0.67937, 0, 0, 0.5], 176: nr, 184: $l, 305: [0, 0.44444, 0, 0, 0.23889], 567: [0.19444, 0.44444, 0, 0, 0.26667], 710: ke, 711: [0, 0.63194, 0, 0, 0.5], 713: [0, 0.60889, 0, 0, 0.5], 714: ke, 715: ke, 728: ke, 729: [0, 0.67937, 0, 0, 0.27778], 730: nr, 732: [0, 0.67659, 0, 0, 0.5], 733: ke, 915: Hl, 916: Xm, 920: oi, 923: Cr, 926: nr, 928: Wl, 931: qn, 933: oi, 934: qn, 936: oi, 937: qn, 8211: [0, 0.44444, 0.02778, 0, 0.5], 8212: [0, 0.44444, 0.02778, 0, 1], 8216: tr, 8217: tr, 8220: ke, 8221: ke }, "Script-Regular": { 32: Z, 65: [0, 0.7, 0.22925, 0, 0.80253], 66: [0, 0.7, 0.04087, 0, 0.90757], 67: [0, 0.7, 0.1689, 0, 0.66619], 68: [0, 0.7, 0.09371, 0, 0.77443], 69: [0, 0.7, 0.18583, 0, 0.56162], 70: [0, 0.7, 0.13634, 0, 0.89544], 71: [0, 0.7, 0.17322, 0, 0.60961], 72: [0, 0.7, 0.29694, 0, 0.96919], 73: [0, 0.7, 0.19189, 0, 0.80907], 74: [0.27778, 0.7, 0.19189, 0, 1.05159], 75: [0, 0.7, 0.31259, 0, 0.91364], 76: [0, 0.7, 0.19189, 0, 0.87373], 77: [0, 0.7, 0.15981, 0, 1.08031], 78: [0, 0.7, 0.3525, 0, 0.9015], 79: [0, 0.7, 0.08078, 0, 0.73787], 80: [0, 0.7, 0.08078, 0, 1.01262], 81: [0, 0.7, 0.03305, 0, 0.88282], 82: [0, 0.7, 0.06259, 0, 0.85], 83: [0, 0.7, 0.19189, 0, 0.86767], 84: [0, 0.7, 0.29087, 0, 0.74697], 85: [0, 0.7, 0.25815, 0, 0.79996], 86: [0, 0.7, 0.27523, 0, 0.62204], 87: [0, 0.7, 0.27523, 0, 0.80532], 88: [0, 0.7, 0.26006, 0, 0.94445], 89: [0, 0.7, 0.2939, 0, 0.70961], 90: [0, 0.7, 0.24037, 0, 0.8212], 160: Z }, "Size1-Regular": { 32: Z, 40: Zm, 41: Zm, 47: Ym, 91: Qm, 92: Ym, 93: Qm, 123: e0, 125: e0, 160: Z, 710: wa, 732: wa, 770: wa, 771: wa, 8214: [-99e-5, 0.601, 0, 0, 0.77778], 8593: t0, 8595: t0, 8657: r0, 8659: r0, 8719: i0, 8720: i0, 8721: [0.25001, 0.75, 0, 0, 1.05556], 8730: [0.35001, 0.85, 0, 0, 1], 8739: [-599e-5, 0.606, 0, 0, 0.33333], 8741: [-599e-5, 0.606, 0, 0, 0.55556], 8747: o0, 8748: n0, 8749: n0, 8750: o0, 8896: Wi, 8897: Wi, 8898: Wi, 8899: Wi, 8968: Ui, 8969: Ui, 8970: Ui, 8971: Ui, 9168: Jl, 10216: Ui, 10217: Ui, 10752: Gl, 10753: Gl, 10754: Gl, 10756: Wi, 10758: Wi }, "Size2-Regular": { 32: Z, 40: a0, 41: a0, 47: s0, 91: l0, 92: s0, 93: l0, 123: c0, 125: c0, 160: Z, 710: Sa, 732: Sa, 770: Sa, 771: Sa, 8719: u0, 8720: u0, 8721: [0.55001, 1.05, 0, 0, 1.44445], 8730: [0.65002, 1.15, 0, 0, 1], 8747: m0, 8748: d0, 8749: d0, 8750: m0, 8896: Gi, 8897: Gi, 8898: Gi, 8899: Gi, 8968: ka, 8969: ka, 8970: ka, 8971: ka, 10216: h0, 10217: h0, 10752: jl, 10753: jl, 10754: jl, 10756: Gi, 10758: Gi }, "Size3-Regular": { 32: Z, 40: p0, 41: p0, 47: f0, 91: g0, 92: f0, 93: g0, 123: La, 125: La, 160: Z, 710: Aa, 732: Aa, 770: Aa, 771: Aa, 8730: [0.95003, 1.45, 0, 0, 1], 8968: Ca, 8969: Ca, 8970: Ca, 8971: Ca, 10216: La, 10217: La }, "Size4-Regular": { 32: Z, 40: b0, 41: b0, 47: y0, 91: x0, 92: y0, 93: x0, 123: Ea, 125: Ea, 160: Z, 710: Ta, 732: Ta, 770: Ta, 771: Ta, 8730: [1.25003, 1.75, 0, 0, 1], 8968: Da, 8969: Da, 8970: Da, 8971: Da, 9115: Oa, 9116: v0, 9117: Oa, 9118: Oa, 9119: v0, 9120: Oa, 9121: Ba, 9122: Jl, 9123: Ba, 9124: Ba, 9125: Jl, 9126: Ba, 9127: _0, 9128: M0, 9129: w0, 9130: [0, 0.3, 0, 0, 0.88889], 9131: _0, 9132: M0, 9133: w0, 9143: [0.88502, 0.915, 0, 0, 1.05556], 10216: Ea, 10217: Ea, 57344: S0, 57345: S0, 57680: Ka, 57681: Ka, 57682: Ka, 57683: Ka }, "Typewriter-Regular": { 32: A0, 33: B, 34: B, 35: B, 36: mt, 37: mt, 38: B, 39: B, 40: mt, 41: mt, 42: [0, 0.52083, 0, 0, 0.525], 43: k0, 44: [0.13889, 0.125, 0, 0, 0.525], 45: k0, 46: [0, 0.125, 0, 0, 0.525], 47: mt, 48: B, 49: B, 50: B, 51: B, 52: B, 53: B, 54: B, 55: B, 56: B, 57: B, 58: Re, 59: [0.13889, 0.43056, 0, 0, 0.525], 60: L0, 61: [-0.19549, 0.41562, 0, 0, 0.525], 62: L0, 63: B, 64: B, 65: B, 66: B, 67: B, 68: B, 69: B, 70: B, 71: B, 72: B, 73: B, 74: B, 75: B, 76: B, 77: B, 78: B, 79: B, 80: B, 81: [0.13889, 0.61111, 0, 0, 0.525], 82: B, 83: B, 84: B, 85: B, 86: B, 87: B, 88: B, 89: B, 90: B, 91: mt, 92: mt, 93: mt, 94: B, 95: [0.09514, 0, 0, 0, 0.525], 96: B, 97: Re, 98: B, 99: Re, 100: B, 101: Re, 102: B, 103: Gn, 104: B, 105: B, 106: [0.22222, 0.61111, 0, 0, 0.525], 107: B, 108: B, 109: Re, 110: Re, 111: Re, 112: Gn, 113: Gn, 114: Re, 115: Re, 116: [0, 0.55358, 0, 0, 0.525], 117: Re, 118: Re, 119: Re, 120: Re, 121: Gn, 122: Re, 123: mt, 124: mt, 125: mt, 126: B, 127: B, 160: A0, 176: B, 184: [0.19445, 0, 0, 0, 0.525], 305: Re, 567: Gn, 711: [0, 0.56597, 0, 0, 0.525], 713: [0, 0.56555, 0, 0, 0.525], 714: B, 715: B, 728: B, 730: B, 770: B, 771: B, 776: B, 915: B, 916: B, 920: B, 923: B, 926: B, 928: B, 931: B, 933: B, 934: B, 936: B, 937: B, 8216: B, 8217: B, 8242: B, 9251: [0.11111, 0.21944, 0, 0, 0.525] } };
var vf = /[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FAF]|[\uAC00-\uD7AF]/, Pt = 10, Ie = 0.25, T0 = 1.2, Xe = 0.431, Xl = { slant: [0.25, 0.25, 0.25], space: [0, 0, 0], stretch: [0, 0, 0], shrink: [0, 0, 0], xHeight: [Xe, Xe, Xe], quad: [1, 1.171, 1.472], extraSpace: [0, 0, 0], num1: [0.5, 0.732, 0.925], num2: [0.394, 0.384, 0.5], num3: [0.444, 0.471, 0.504], denom1: [0.686, 0.752, 1.025], denom2: [0.345, 0.344, 0.532], sup1: [0.413, 0.503, 0.504], sup2: [0.363, 0.431, 0.404], sup3: [0.289, 0.286, 0.294], sub1: [0.15, 0.143, 0.2], sub2: [0.247, 0.286, 0.4], supDrop: [0.386, 0.353, 0.494], subDrop: [0.05, 0.071, 0.1], delim1: [2.39, 1.7, 1.98], delim2: [1.01, 1.157, 1.42], axisHeight: [Ie, Ie, Ie], defaultRuleThickness: [0.04, 0.049, 0.049], bigOpSpacing1: [0.111, 0.111, 0.111], bigOpSpacing2: [0.166, 0.166, 0.166], bigOpSpacing3: [0.2, 0.2, 0.2], bigOpSpacing4: [0.6, 0.611, 0.611], bigOpSpacing5: [0.1, 0.143, 0.143], sqrtRuleThickness: [0.04, 0.04, 0.04] }, jn = [0, 0.5, 0.7, 0.8, 0.9, 1, 1.2, 1.44, 1.728, 2.074, 2.488], ji = 5, E0 = { " ": " ", "​": " ", Å: "A", Ç: "C", Ð: "D", Þ: "o", å: "a", ç: "c", ð: "d", þ: "o", А: "A", Б: "B", В: "B", Г: "F", Д: "A", Е: "E", Ж: "K", З: "3", И: "N", Й: "N", К: "K", Л: "N", М: "M", Н: "H", О: "O", П: "N", Р: "P", С: "C", Т: "T", У: "y", Ф: "O", Х: "X", Ц: "U", Ч: "h", Ш: "W", Щ: "W", Ъ: "B", Ы: "X", Ь: "B", Э: "3", Ю: "X", Я: "R", а: "a", б: "b", в: "a", г: "r", д: "y", е: "e", ж: "m", з: "e", и: "n", й: "n", к: "n", л: "n", м: "m", н: "n", о: "o", п: "n", р: "p", с: "c", т: "o", у: "y", ф: "b", х: "x", ц: "n", ч: "n", ш: "w", щ: "w", ъ: "a", ы: "m", ь: "a", э: "e", ю: "m", я: "r" };
function Tr(t38, e) {
  t38 === void 0 && (t38 = 77);
  let r = C0[e][t38];
  if (r) return { defaultMetrics: false, depth: r[0], height: r[1], italic: r[2], skew: r[3], width: r[4] };
  if (t38 === 11034) return { defaultMetrics: true, depth: 0.2, height: 0.8, italic: 0, skew: 0, width: 0.8 };
  let i = String.fromCodePoint(t38);
  if (i in E0) t38 = E0[i].codePointAt(0);
  else if (vf.test(i)) return t38 = 77, { defaultMetrics: true, depth: 0.2, height: 0.9, italic: 0, skew: 0, width: 1 };
  return { defaultMetrics: true, depth: 0.2, height: 0.7, italic: 0, skew: 0, width: 0.8 };
}
var Zl = { overrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"], overleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"], underrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"], underleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"], xrightarrow: [["rightarrow"], 1.469, 522, "xMaxYMin"], longrightarrow: [["rightarrow"], 1.469, 522, "xMaxYMin"], xleftarrow: [["leftarrow"], 1.469, 522, "xMinYMin"], longleftarrow: [["leftarrow"], 1.469, 522, "xMinYMin"], Overrightarrow: [["doublerightarrow"], 0.888, 560, "xMaxYMin"], xRightarrow: [["doublerightarrow"], 1.526, 560, "xMaxYMin"], xLeftarrow: [["doubleleftarrow"], 1.526, 560, "xMinYMin"], overleftharpoon: [["leftharpoon"], 0.888, 522, "xMinYMin"], xleftharpoonup: [["leftharpoon"], 0.888, 522, "xMinYMin"], xleftharpoondown: [["leftharpoondown"], 0.888, 522, "xMinYMin"], overrightharpoon: [["rightharpoon"], 0.888, 522, "xMaxYMin"], xrightharpoonup: [["rightharpoon"], 0.888, 522, "xMaxYMin"], xrightharpoondown: [["rightharpoondown"], 0.888, 522, "xMaxYMin"], xlongequal: [["longequal"], 0.888, 334, "xMinYMin"], xtwoheadleftarrow: [["twoheadleftarrow"], 0.888, 334, "xMinYMin"], xtwoheadrightarrow: [["twoheadrightarrow"], 0.888, 334, "xMaxYMin"], overleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522], overbrace: [["leftbrace", "midbrace", "rightbrace"], 1.6, 548], underbrace: [["leftbraceunder", "midbraceunder", "rightbraceunder"], 1.6, 548], underleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522], xleftrightarrow: [["leftarrow", "rightarrow"], 1.75, 522], longleftrightarrow: [["leftarrow", "rightarrow"], 1.75, 522], xLeftrightarrow: [["doubleleftarrow", "doublerightarrow"], 1.75, 560], xrightleftharpoons: [["leftharpoondownplus", "rightharpoonplus"], 1.75, 716], longrightleftharpoons: [["leftharpoondownplus", "rightharpoonplus"], 1.75, 716], xleftrightharpoons: [["leftharpoonplus", "rightharpoondownplus"], 1.75, 716], longleftrightharpoons: [["leftharpoonplus", "rightharpoondownplus"], 1.75, 716], xhookleftarrow: [["leftarrow", "righthook"], 1.08, 522], xhookrightarrow: [["lefthook", "rightarrow"], 1.08, 522], overlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522], underlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522], overgroup: [["leftgroup", "rightgroup"], 0.888, 342], undergroup: [["leftgroupunder", "rightgroupunder"], 0.888, 342], xmapsto: [["leftmapsto", "rightarrow"], 1.5, 522], xtofrom: [["leftToFrom", "rightToFrom"], 1.75, 528], xleftrightarrows: [["baraboveleftarrow", "rightarrowabovebar"], 1.75, 901], longleftrightarrows: [["baraboveleftarrow", "rightarrowabovebar"], 1.75, 901], xRightleftharpoons: [["baraboveshortleftharpoon", "rightharpoonaboveshortbar"], 1.75, 716], longRightleftharpoons: [["baraboveshortleftharpoon", "rightharpoonaboveshortbar"], 1.75, 716], xLeftrightharpoons: [["shortbaraboveleftharpoon", "shortrightharpoonabovebar"], 1.75, 716], longLeftrightharpoons: [["shortbaraboveleftharpoon", "shortrightharpoonabovebar"], 1.75, 716] }, Yl = { widehat1: [1062, 239, 0.24], widehat2: [2364, 300, 0.3], widehat3: [2364, 360, 0.36], widehat4: [2364, 420, 0.42], widecheck1: [1062, 239, 0.24], widecheck2: [2364, 300, 0.3], widecheck3: [2364, 360, 0.36], widecheck4: [2364, 420, 0.42], widetilde1: [600, 260, 0.26], widetilde2: [1033, 286, 0.286], widetilde3: [2339, 306, 0.306], widetilde4: [2340, 312, 0.34], overarc: [1061, 159, 0.3], underarc: [1061, 159, 0.3] }, D0 = { doubleleftarrow: `M262 157
l10-10c34-36 62.7-77 86-123 3.3-8 5-13.3 5-16 0-5.3-6.7-8-20-8-7.3
 0-12.2.5-14.5 1.5-2.3 1-4.8 4.5-7.5 10.5-49.3 97.3-121.7 169.3-217 216-28
 14-57.3 25-88 33-6.7 2-11 3.8-13 5.5-2 1.7-3 4.2-3 7.5s1 5.8 3 7.5
c2 1.7 6.3 3.5 13 5.5 68 17.3 128.2 47.8 180.5 91.5 52.3 43.7 93.8 96.2 124.5
 157.5 9.3 8 15.3 12.3 18 13h6c12-.7 18-4 18-10 0-2-1.7-7-5-15-23.3-46-52-87
-86-123l-10-10h399738v-40H218c328 0 0 0 0 0l-10-8c-26.7-20-65.7-43-117-69 2.7
-2 6-3.7 10-5 36.7-16 72.3-37.3 107-64l10-8h399782v-40z
m8 0v40h399730v-40zm0 194v40h399730v-40z`, doublerightarrow: `M399738 392l
-10 10c-34 36-62.7 77-86 123-3.3 8-5 13.3-5 16 0 5.3 6.7 8 20 8 7.3 0 12.2-.5
 14.5-1.5 2.3-1 4.8-4.5 7.5-10.5 49.3-97.3 121.7-169.3 217-216 28-14 57.3-25 88
-33 6.7-2 11-3.8 13-5.5 2-1.7 3-4.2 3-7.5s-1-5.8-3-7.5c-2-1.7-6.3-3.5-13-5.5-68
-17.3-128.2-47.8-180.5-91.5-52.3-43.7-93.8-96.2-124.5-157.5-9.3-8-15.3-12.3-18
-13h-6c-12 .7-18 4-18 10 0 2 1.7 7 5 15 23.3 46 52 87 86 123l10 10H0v40h399782
c-328 0 0 0 0 0l10 8c26.7 20 65.7 43 117 69-2.7 2-6 3.7-10 5-36.7 16-72.3 37.3
-107 64l-10 8H0v40zM0 157v40h399730v-40zm0 194v40h399730v-40z`, leftarrow: `M400000 241H110l3-3c68.7-52.7 113.7-120
 135-202 4-14.7 6-23 6-25 0-7.3-7-11-21-11-8 0-13.2.8-15.5 2.5-2.3 1.7-4.2 5.8
-5.5 12.5-1.3 4.7-2.7 10.3-4 17-12 48.7-34.8 92-68.5 130S65.3 228.3 18 247
c-10 4-16 7.7-18 11 0 8.7 6 14.3 18 17 47.3 18.7 87.8 47 121.5 85S196 441.3 208
 490c.7 2 1.3 5 2 9s1.2 6.7 1.5 8c.3 1.3 1 3.3 2 6s2.2 4.5 3.5 5.5c1.3 1 3.3
 1.8 6 2.5s6 1 10 1c14 0 21-3.7 21-11 0-2-2-10.3-6-25-20-79.3-65-146.7-135-202
 l-3-3h399890zM100 241v40h399900v-40z`, leftbrace: `M6 548l-6-6v-35l6-11c56-104 135.3-181.3 238-232 57.3-28.7 117
-45 179-50h399577v120H403c-43.3 7-81 15-113 26-100.7 33-179.7 91-237 174-2.7
 5-6 9-10 13-.7 1-7.3 1-20 1H6z`, leftbraceunder: `M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13
 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688
 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7
-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z`, overarc: "M529 0c179 0 524 115 524 115 5 1 9 5 9 10 0 1-1 2-1 3l-4 22c-1 5-5 9-11 9h-2s-338-93-512-92c-174 0-513 92-513 92h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13 0 0 342-115 520-115z", underarc: `m 529 160
  c -179 0 -524 -115 -524 -115
  c -5 -1 -9 -5 -9 -10
  c 0 -1 1 -2 1 -3
  l 4 -22
  c 1 -5 5 -9 11 -9
  h 2
  s 338 93 512 92
  c 174 0 513 -92 513 -92
  h 2
  c 5 0 9 4 11 9
  l 5 22
  c 1 6 -2 12 -8 13
  c 0 0 -342 115 -520 115
  z
  `, leftgroup: `M400000 80
H435C64 80 168.3 229.4 21 260c-5.9 1.2-18 0-18 0-2 0-3-1-3-3v-38C76 61 257 0
 435 0h399565z`, leftgroupunder: `M400000 262
H435C64 262 168.3 112.6 21 82c-5.9-1.2-18 0-18 0-2 0-3 1-3 3v38c76 158 257 219
 435 219h399565z`, leftharpoon: `M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3
-3.3 10.2-9.5 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5
-18.3 3-21-1.3-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7
-196 228-6.7 4.7-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40z`, leftharpoonplus: `M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3-3.3 10.2-9.5
 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5-18.3 3-21-1.3
-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7-196 228-6.7 4.7
-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40zM0 435v40h400000v-40z
m0 0v40h400000v-40z`, leftharpoondown: `M7 241c-4 4-6.333 8.667-7 14 0 5.333.667 9 2 11s5.333
 5.333 12 10c90.667 54 156 130 196 228 3.333 10.667 6.333 16.333 9 17 2 .667 5
 1 9 1h5c10.667 0 16.667-2 18-6 2-2.667 1-9.667-3-21-32-87.333-82.667-157.667
-152-211l-3-3h399907v-40zM93 281 H400000 v-40L7 241z`, leftharpoondownplus: `M7 435c-4 4-6.3 8.7-7 14 0 5.3.7 9 2 11s5.3 5.3 12
 10c90.7 54 156 130 196 228 3.3 10.7 6.3 16.3 9 17 2 .7 5 1 9 1h5c10.7 0 16.7
-2 18-6 2-2.7 1-9.7-3-21-32-87.3-82.7-157.7-152-211l-3-3h399907v-40H7zm93 0
v40h399900v-40zM0 241v40h399900v-40zm0 0v40h399900v-40z`, lefthook: `M400000 281 H103s-33-11.2-61-33.5S0 197.3 0 164s14.2-61.2 42.5
-83.5C70.8 58.2 104 47 142 47 c16.7 0 25 6.7 25 20 0 12-8.7 18.7-26 20-40 3.3
-68.7 15.7-86 37-10 12-15 25.3-15 40 0 22.7 9.8 40.7 29.5 54 19.7 13.3 43.5 21
 71.5 23h399859zM103 281v-40h399897v40z`, leftlinesegment: `M40 281 V428 H0 V94 H40 V241 H400000 v40z
M40 281 V428 H0 V94 H40 V241 H400000 v40z`, leftmapsto: `M40 281 V448H0V74H40V241H400000v40z
M40 281 V448H0V74H40V241H400000v40z`, leftToFrom: `M0 147h400000v40H0zm0 214c68 40 115.7 95.7 143 167h22c15.3 0 23
-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69-70-101l-7-8h399905v-40H95l7-8
c28.7-32 52-65.7 70-101 10.7-23.3 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 265.3
 68 321 0 361zm0-174v-40h399900v40zm100 154v40h399900v-40z`, longequal: `M0 50 h400000 v40H0z m0 194h40000v40H0z
M0 50 h400000 v40H0z m0 194h40000v40H0z`, midbrace: `M200428 334
c-100.7-8.3-195.3-44-280-108-55.3-42-101.7-93-139-153l-9-14c-2.7 4-5.7 8.7-9 14
-53.3 86.7-123.7 153-211 199-66.7 36-137.3 56.3-212 62H0V214h199568c178.3-11.7
 311.7-78.3 403-201 6-8 9.7-12 11-12 .7-.7 6.7-1 18-1s17.3.3 18 1c1.3 0 5 4 11
 12 44.7 59.3 101.3 106.3 170 141s145.3 54.3 229 60h199572v120z`, midbraceunder: `M199572 214
c100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14
 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3
 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0
-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z`, oiintSize1: `M512.6 71.6c272.6 0 320.3 106.8 320.3 178.2 0 70.8-47.7 177.6
-320.3 177.6S193.1 320.6 193.1 249.8c0-71.4 46.9-178.2 319.5-178.2z
m368.1 178.2c0-86.4-60.9-215.4-368.1-215.4-306.4 0-367.3 129-367.3 215.4 0 85.8
60.9 214.8 367.3 214.8 307.2 0 368.1-129 368.1-214.8z`, oiintSize2: `M757.8 100.1c384.7 0 451.1 137.6 451.1 230 0 91.3-66.4 228.8
-451.1 228.8-386.3 0-452.7-137.5-452.7-228.8 0-92.4 66.4-230 452.7-230z
m502.4 230c0-111.2-82.4-277.2-502.4-277.2s-504 166-504 277.2
c0 110 84 276 504 276s502.4-166 502.4-276z`, oiiintSize1: `M681.4 71.6c408.9 0 480.5 106.8 480.5 178.2 0 70.8-71.6 177.6
-480.5 177.6S202.1 320.6 202.1 249.8c0-71.4 70.5-178.2 479.3-178.2z
m525.8 178.2c0-86.4-86.8-215.4-525.7-215.4-437.9 0-524.7 129-524.7 215.4 0
85.8 86.8 214.8 524.7 214.8 438.9 0 525.7-129 525.7-214.8z`, oiiintSize2: `M1021.2 53c603.6 0 707.8 165.8 707.8 277.2 0 110-104.2 275.8
-707.8 275.8-606 0-710.2-165.8-710.2-275.8C311 218.8 415.2 53 1021.2 53z
m770.4 277.1c0-131.2-126.4-327.6-770.5-327.6S248.4 198.9 248.4 330.1
c0 130 128.8 326.4 772.7 326.4s770.5-196.4 770.5-326.4z`, rightarrow: `M0 241v40h399891c-47.3 35.3-84 78-110 128
-16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20
 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7
 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85
-40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5
-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67
 151.7 139 205zm0 0v40h399900v-40z`, rightbrace: `M400000 542l
-6 6h-17c-12.7 0-19.3-.3-20-1-4-4-7.3-8.3-10-13-35.3-51.3-80.8-93.8-136.5-127.5
s-117.2-55.8-184.5-66.5c-.7 0-2-.3-4-1-18.7-2.7-76-4.3-172-5H0V214h399571l6 1
c124.7 8 235 61.7 331 161 31.3 33.3 59.7 72.7 85 118l7 13v35z`, rightbraceunder: `M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3
 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237
-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z`, rightgroup: `M0 80h399565c371 0 266.7 149.4 414 180 5.9 1.2 18 0 18 0 2 0
 3-1 3-3v-38c-76-158-257-219-435-219H0z`, rightgroupunder: `M0 262h399565c371 0 266.7-149.4 414-180 5.9-1.2 18 0 18
 0 2 0 3 1 3 3v38c-76 158-257 219-435 219H0z`, rightharpoon: `M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3
-3.7-15.3-11-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2
-10.7 0-16.7 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58
 69.2 92 94.5zm0 0v40h399900v-40z`, rightharpoonplus: `M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3-3.7-15.3-11
-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2-10.7 0-16.7
 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58 69.2 92 94.5z
m0 0v40h399900v-40z m100 194v40h399900v-40zm0 0v40h399900v-40z`, rightharpoondown: `M399747 511c0 7.3 6.7 11 20 11 8 0 13-.8 15-2.5s4.7-6.8
 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3 8.5-5.8 9.5
-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3-64.7 57-92 95
-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 241v40h399900v-40z`, rightharpoondownplus: `M399747 705c0 7.3 6.7 11 20 11 8 0 13-.8
 15-2.5s4.7-6.8 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3
 8.5-5.8 9.5-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3
-64.7 57-92 95-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 435v40h399900v-40z
m0-194v40h400000v-40zm0 0v40h400000v-40z`, righthook: `M399859 241c-764 0 0 0 0 0 40-3.3 68.7-15.7 86-37 10-12 15-25.3
 15-40 0-22.7-9.8-40.7-29.5-54-19.7-13.3-43.5-21-71.5-23-17.3-1.3-26-8-26-20 0
-13.3 8.7-20 26-20 38 0 71 11.2 99 33.5 0 0 7 5.6 21 16.7 14 11.2 21 33.5 21
 66.8s-14 61.2-42 83.5c-28 22.3-61 33.5-99 33.5L0 241z M0 281v-40h399859v40z`, rightlinesegment: `M399960 241 V94 h40 V428 h-40 V281 H0 v-40z
M399960 241 V94 h40 V428 h-40 V281 H0 v-40z`, rightToFrom: `M400000 167c-70.7-42-118-97.7-142-167h-23c-15.3 0-23 .3-23
 1 0 1.3 5.3 13.7 16 37 18 35.3 41.3 69 70 101l7 8H0v40h399905l-7 8c-28.7 32
-52 65.7-70 101-10.7 23.3-16 35.7-16 37 0 .7 7.7 1 23 1h23c24-69.3 71.3-125 142
-167z M100 147v40h399900v-40zM0 341v40h399900v-40z`, twoheadleftarrow: `M0 167c68 40
 115.7 95.7 143 167h22c15.3 0 23-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69
-70-101l-7-8h125l9 7c50.7 39.3 85 86 103 140h46c0-4.7-6.3-18.7-19-42-18-35.3
-40-67.3-66-96l-9-9h399716v-40H284l9-9c26-28.7 48-60.7 66-96 12.7-23.333 19
-37.333 19-42h-46c-18 54-52.3 100.7-103 140l-9 7H95l7-8c28.7-32 52-65.7 70-101
 10.7-23.333 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 71.3 68 127 0 167z`, twoheadrightarrow: `M400000 167
c-68-40-115.7-95.7-143-167h-22c-15.3 0-23 .3-23 1 0 1.3 5.3 13.7 16 37 18 35.3
 41.3 69 70 101l7 8h-125l-9-7c-50.7-39.3-85-86-103-140h-46c0 4.7 6.3 18.7 19 42
 18 35.3 40 67.3 66 96l9 9H0v40h399716l-9 9c-26 28.7-48 60.7-66 96-12.7 23.333
-19 37.333-19 42h46c18-54 52.3-100.7 103-140l9-7h125l-7 8c-28.7 32-52 65.7-70
 101-10.7 23.333-16 35.7-16 37 0 .7 7.7 1 23 1h22c27.3-71.3 75-127 143-167z`, widetilde1: `M200 55.538c-77 0-168 73.953-177 73.953-3 0-7
-2.175-9-5.437L2 97c-1-2-2-4-2-6 0-4 2-7 5-9l20-12C116 12 171 0 207 0c86 0
 114 68 191 68 78 0 168-68 177-68 4 0 7 2 9 5l12 19c1 2.175 2 4.35 2 6.525 0
 4.35-2 7.613-5 9.788l-19 13.05c-92 63.077-116.937 75.308-183 76.128
-68.267.847-113-73.952-191-73.952z`, widetilde2: `M344 55.266c-142 0-300.638 81.316-311.5 86.418
-8.01 3.762-22.5 10.91-23.5 5.562L1 120c-1-2-1-3-1-4 0-5 3-9 8-10l18.4-9C160.9
 31.9 283 0 358 0c148 0 188 122 331 122s314-97 326-97c4 0 8 2 10 7l7 21.114
c1 2.14 1 3.21 1 4.28 0 5.347-3 9.626-7 10.696l-22.3 12.622C852.6 158.372 751
 181.476 676 181.476c-149 0-189-126.21-332-126.21z`, widetilde3: `M786 59C457 59 32 175.242 13 175.242c-6 0-10-3.457
-11-10.37L.15 138c-1-7 3-12 10-13l19.2-6.4C378.4 40.7 634.3 0 804.3 0c337 0
 411.8 157 746.8 157 328 0 754-112 773-112 5 0 10 3 11 9l1 14.075c1 8.066-.697
 16.595-6.697 17.492l-21.052 7.31c-367.9 98.146-609.15 122.696-778.15 122.696
 -338 0-409-156.573-744-156.573z`, widetilde4: `M786 58C457 58 32 177.487 13 177.487c-6 0-10-3.345
-11-10.035L.15 143c-1-7 3-12 10-13l22-6.7C381.2 35 637.15 0 807.15 0c337 0 409
 177 744 177 328 0 754-127 773-127 5 0 10 3 11 9l1 14.794c1 7.805-3 13.38-9
 14.495l-20.7 5.574c-366.85 99.79-607.3 139.372-776.3 139.372-338 0-409
 -175.236-744-175.236z`, vec: `M377 20c0-5.333 1.833-10 5.5-14S391 0 397 0c4.667 0 8.667 1.667 12 5
3.333 2.667 6.667 9 10 19 6.667 24.667 20.333 43.667 41 57 7.333 4.667 11
10.667 11 18 0 6-1 10-3 12s-6.667 5-14 9c-28.667 14.667-53.667 35.667-75 63
-1.333 1.333-3.167 3.5-5.5 6.5s-4 4.833-5 5.5c-1 .667-2.5 1.333-4.5 2s-4.333 1
-7 1c-4.667 0-9.167-1.833-13.5-5.5S337 184 337 178c0-12.667 15.667-32.333 47-59
H213l-171-1c-8.667-6-13-12.333-13-19 0-4.667 4.333-11.333 13-20h359
c-16-25.333-24-45-24-59z`, widehat1: `M529 0h5l519 115c5 1 9 5 9 10 0 1-1 2-1 3l-4 22
c-1 5-5 9-11 9h-2L532 67 19 159h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13z`, widehat2: `M1181 0h2l1171 176c6 0 10 5 10 11l-2 23c-1 6-5 10
-11 10h-1L1182 67 15 220h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z`, widehat3: `M1181 0h2l1171 236c6 0 10 5 10 11l-2 23c-1 6-5 10
-11 10h-1L1182 67 15 280h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z`, widehat4: `M1181 0h2l1171 296c6 0 10 5 10 11l-2 23c-1 6-5 10
-11 10h-1L1182 67 15 340h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z`, widecheck1: `M529,159h5l519,-115c5,-1,9,-5,9,-10c0,-1,-1,-2,-1,-3l-4,-22c-1,
-5,-5,-9,-11,-9h-2l-512,92l-513,-92h-2c-5,0,-9,4,-11,9l-5,22c-1,6,2,12,8,13z`, widecheck2: `M1181,220h2l1171,-176c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,
-11,-10h-1l-1168,153l-1167,-153h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z`, widecheck3: `M1181,280h2l1171,-236c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,
-11,-10h-1l-1168,213l-1167,-213h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z`, widecheck4: `M1181,340h2l1171,-296c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,
-11,-10h-1l-1168,273l-1167,-273h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z`, baraboveleftarrow: `M400000 620h-399890l3 -3c68.7 -52.7 113.7 -120 135 -202
c4 -14.7 6 -23 6 -25c0 -7.3 -7 -11 -21 -11c-8 0 -13.2 0.8 -15.5 2.5
c-2.3 1.7 -4.2 5.8 -5.5 12.5c-1.3 4.7 -2.7 10.3 -4 17c-12 48.7 -34.8 92 -68.5 130
s-74.2 66.3 -121.5 85c-10 4 -16 7.7 -18 11c0 8.7 6 14.3 18 17c47.3 18.7 87.8 47
121.5 85s56.5 81.3 68.5 130c0.7 2 1.3 5 2 9s1.2 6.7 1.5 8c0.3 1.3 1 3.3 2 6
s2.2 4.5 3.5 5.5c1.3 1 3.3 1.8 6 2.5s6 1 10 1c14 0 21 -3.7 21 -11
c0 -2 -2 -10.3 -6 -25c-20 -79.3 -65 -146.7 -135 -202l-3 -3h399890z
M100 620v40h399900v-40z M0 241v40h399900v-40zM0 241v40h399900v-40z`, rightarrowabovebar: `M0 241v40h399891c-47.3 35.3-84 78-110 128-16.7 32
-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0
13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39
-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85-40.5
-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5
-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67
151.7 139 205zm96 379h399894v40H0zm0 0h399904v40H0z`, baraboveshortleftharpoon: `M507,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11
c1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17
c2,0.7,5,1,9,1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21
c-32,-87.3,-82.7,-157.7,-152,-211c0,0,-3,-3,-3,-3l399351,0l0,-40
c-398570,0,-399437,0,-399437,0z M593 435 v40 H399500 v-40z
M0 281 v-40 H399908 v40z M0 281 v-40 H399908 v40z`, rightharpoonaboveshortbar: `M0,241 l0,40c399126,0,399993,0,399993,0
c4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,
-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6
c-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z
M0 241 v40 H399908 v-40z M0 475 v-40 H399500 v40z M0 475 v-40 H399500 v40z`, shortbaraboveleftharpoon: `M7,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11
c1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17c2,0.7,5,1,9,
1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21c-32,-87.3,-82.7,-157.7,
-152,-211c0,0,-3,-3,-3,-3l399907,0l0,-40c-399126,0,-399993,0,-399993,0z
M93 435 v40 H400000 v-40z M500 241 v40 H400000 v-40z M500 241 v40 H400000 v-40z`, shortrightharpoonabovebar: `M53,241l0,40c398570,0,399437,0,399437,0
c4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,
-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6
c-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z
M500 241 v40 H399408 v-40z M500 435 v40 H400000 v-40z` };
function O0(t38) {
  if (Yl[t38]) {
    let [c, u, d] = Yl[t38], m = `<span class="ML__stretchy" style="height:${d}em"><svg width="100%" height="${d}em" viewBox="0 0 ${c} ${u}" preserveAspectRatio="none" ><path fill="currentcolor" d="${D0[t38]}"></path></svg></span>`;
    return `<span style="display:inline-block;height:${Math.floor(100 * d / 2) / 100}em;min-width:0">${m}</span>`;
  }
  let [e, r, i, n] = Zl[t38], o, a, s = i / 1e3;
  e.length === 3 ? (o = ["slice-1-of-3", "slice-2-of-3", "slice-3-of-3"], a = ["xMinYMin", "xMidYMin", "xMaxYMin"]) : e.length === 2 ? (o = ["slice-1-of-2", "slice-2-of-2"], a = ["xMinYMin", "xMaxYMin"]) : (o = ["slice-1-of-1"], a = [n]);
  let l = e.map((c, u) => `<span class="${o[u]}" style=height:${s}em><svg width=400em height=${s}em viewBox="0 0 400000 ${i}" preserveAspectRatio="${a[u]} slice"><path fill="currentcolor" d="${D0[c]}"></path></svg></span>`).join("");
  return `<span style="display:inline-block;height:${s}em;min-width:${r}em;">${l}</span>`;
}
function B0(t38) {
  return Zl[t38] ? Zl[t38][2] / 1e3 : Yl[t38][2];
}
function _f(t38) {
  let e = [];
  for (let r = 0; r < t38.length; r++) {
    let i = t38.charCodeAt(r);
    if (i === 13 && t38.charCodeAt(r + 1) === 10 && (i = 10, r++), (i === 13 || i === 12) && (i = 10), i === 0 && (i = 65533), i >= 55296 && i <= 56319) {
      let n = t38.charCodeAt(r + 1);
      if (n >= 56320 && n <= 57343) {
        let o = i - 55296, a = n - 56320;
        i = 2 ** 16 + o * 2 ** 10 + a, r++;
      }
    }
    e.push(i);
  }
  return e;
}
var Ra = 8205, Mf = [[Ra, 1], [65038, 2], [127995, 5], [129456, 4], [917536, 96]], Pa, K0 = [127462, 127487];
function P0(t38) {
  var e;
  if (Pa === void 0) {
    Pa = {};
    for (let r of Mf) for (let i = r[0]; i <= r[0] + r[1] - 1; i++) Pa[i] = true;
  }
  return (e = Pa[t38]) != null ? e : false;
}
function wf(t38) {
  return t38 >= K0[0] && t38 <= K0[1];
}
function Ia(t38) {
  if (/^[\u0020-\u00FF]*$/.test(t38)) return t38;
  let e = [], r = _f(t38), i = 0;
  for (; i < r.length; ) {
    let n = r[i++], o = r[i];
    if (o === Ra) {
      let a = i - 1;
      for (i += 2; r[i] === Ra; ) i += 2;
      e.push(String.fromCodePoint(...r.slice(a, i - a + 1)));
    } else if (P0(o)) {
      let a = i - 1;
      for (; P0(r[i]); ) i += r[i] === Ra ? 2 : 1;
      e.push(String.fromCodePoint(...r.slice(a, 2 * i - a - 1)));
    } else wf(n) ? (i += 1, e.push(String.fromCodePoint(...r.slice(i - 2, 2)))) : e.push(String.fromCodePoint(n));
  }
  return e;
}
var Ql = class {
  constructor(e) {
    this.obeyspaces = false;
    this.pos = 0;
    this.s = Ia(e);
  }
  end() {
    return this.pos >= this.s.length;
  }
  get() {
    return this.pos < this.s.length ? this.s[this.pos++] : "";
  }
  peek() {
    return this.s[this.pos];
  }
  match(e) {
    let r = typeof this.s == "string" ? e.exec(this.s.slice(this.pos)) : e.exec(this.s.slice(this.pos).join(""));
    return r != null && r[0] ? (this.pos += r[0].length, r[0]) : "";
  }
  next() {
    if (this.end()) return null;
    if (!this.obeyspaces && this.match(/^[ \f\n\r\t\v\u00A0\u2028\u2029]+/) || this.obeyspaces && this.match(/^[ \f\n\r\t\v\u00A0\u2028\u2029]/)) return "<space>";
    let e = this.get();
    if (e === "\\") {
      if (!this.end()) {
        let r = this.match(/^[a-zA-Z\*]+/);
        return r ? this.match(/^[ \f\n\r\t\v\u00A0\u2028\u2029]*/) : r = this.get(), "\\" + r;
      }
    } else {
      if (e === "{") return "<{>";
      if (e === "}") return "<}>";
      if (e === "^") {
        if (this.peek() === "^") {
          this.get();
          let r = this.match(/^(\^(\^(\^(\^[\da-f])?[\da-f])?[\da-f])?[\da-f])?[\da-f]{2}/);
          if (r) return String.fromCodePoint(Number.parseInt(r.slice(r.lastIndexOf("^") + 1), 16));
        }
        return e;
      } else if (e === "#") {
        if (!this.end()) {
          let r = false;
          if (/[\d?@]/.test(this.peek()) && (r = true, this.pos + 1 < this.s.length)) {
            let i = this.s[this.pos + 1];
            r = /[^\dA-Za-z]/.test(i);
          }
          return r ? "#" + this.get() : "#";
        }
      } else if (e === "$") return this.peek() === "$" ? (this.get(), "<$$>") : "<$>";
    }
    return e;
  }
};
function Sf(t38, e) {
  var n, o, a, s;
  let r = [], i = t38.next();
  if (i && i !== "\\relax") {
    if (i === "\\noexpand") i = t38.next(), i && r.push(i);
    else if (i === "\\obeyspaces") t38.obeyspaces = true;
    else if (i === "\\bgroup") r.push("<{>");
    else if (i === "\\egroup") r.push("<}>");
    else if (i === "\\string") {
      if (i = t38.next(), i) if (i.startsWith("\\")) for (let l of i) r.push(l === "\\" ? "\\backslash" : l);
      else i === "<{>" ? r.push("\\{") : i === "<space>" ? r.push("~") : i === "<}>" && r.push("\\}");
    } else if (i === "\\csname") {
      for (; t38.peek() === "<space>"; ) t38.next();
      let l = "", c = false, u = [];
      do {
        if (u.length === 0) if (/^#[\d?@]$/.test(t38.peek())) {
          let d = t38.get().slice(1);
          u = Ji((o = (n = e == null ? void 0 : e(d)) != null ? n : e == null ? void 0 : e("?")) != null ? o : "\\placeholder{}", e), i = u[0];
        } else i = t38.next(), u = i ? [i] : [];
        c = u.length === 0, !c && i === "\\endcsname" && (c = true, u.shift()), c || (c = i === "<$>" || i === "<$$>" || i === "<{>" || i === "<}>" || typeof i == "string" && i.length > 1 && i.startsWith("\\")), c || (l += u.shift());
      } while (!c);
      l && r.push("\\" + l), r.push(...u);
    } else if (i !== "\\endcsname") if (i.length > 1 && i.startsWith("#")) {
      let l = i.slice(1);
      r.push(...Ji((s = (a = e == null ? void 0 : e(l)) != null ? a : e == null ? void 0 : e("?")) != null ? s : "\\placeholder{}", e));
    } else r.push(i);
  }
  return r;
}
function Ji(t38, e = null) {
  if (!t38) return [];
  let r = [], i = "";
  for (let a of t38.toString().split(/\r?\n/)) {
    i && r.push(i), i = " ";
    let s = a.match(/((?:\\%)|[^%])*/);
    s !== null && r.push(s[0]);
  }
  let n = new Ql(r.join("")), o = [];
  do
    o.push(...Sf(n, e));
  while (!n.end());
  return o;
}
function R(t38) {
  let e = "", r = [];
  for (let i of t38) i && (e && /^[a-zA-Z\*]/.test(i) && r.push(e), r.push(i), /^\\[a-zA-Z]+\*?[\"\'][^\ ]+$/.test(i) && r.push(" "), e = /\\[a-zA-Z]+\*?$/.test(i) ? " " : "");
  return r.join("");
}
function U(t38, ...e) {
  return t38.startsWith("\\"), e.length === 0 ? t38 : R([t38, ...e.map((r) => `{${r}}`)]);
}
function Dr(t38) {
  return R(t38.map((e) => {
    var r;
    return (r = { "<space>": " ", "<$$>": "$$", "<$>": "$", "<{>": "{", "<}>": "}" }[e]) != null ? r : e;
  }));
}
var li = class li2 {
  constructor(e) {
    li2._registry[e] = this;
  }
  static createAtom(e, r, i) {
    return li2._registry[e].createAtom(r, ne(r, e), i);
  }
  static serialize(e, r) {
    var i;
    if (!e || e.length === 0) return "";
    if ((i = r.skipStyles) != null && i) {
      let n = [];
      for (let o of I0(e)) {
        let a = li2._registry[o[0].mode];
        n.push(...a.serialize(o, r));
      }
      return R(n);
    }
    return R(Lf(e, r));
  }
  static getFont(e, r, i) {
    return li2._registry[e].getFont(r, i);
  }
};
li._registry = {};
var _e = li;
function I0(t38) {
  let e = [], r = [], i = "NONE";
  for (let n of t38) n.type !== "first" && (n.mode !== i ? (r.length > 0 && e.push(r), r = [n], i = n.mode) : r.push(n));
  return r.length > 0 && e.push(r), e;
}
function za(t38) {
  if ((t38 == null ? void 0 : t38.mode) !== "math") return "";
  let { style: e } = t38;
  return !e || !e.variantStyle ? "" : e.variantStyle === "bold" || e.variantStyle === "bolditalic" ? "bold" : "";
}
function Na(t38) {
  if (!t38) return "";
  let { style: e } = t38;
  if (!e) return "";
  let r = e.variant;
  return r === void 0 && (r = "normal"), !["calligraphic", "fraktur", "double-struck", "script", "monospace", "sans-serif"].includes(r) && e.variantStyle && (r += "-" + e.variantStyle), r;
}
function ht(t38, e) {
  let r = [], i = [], n;
  for (let o of t38) {
    if (o.type === "first") continue;
    let a;
    e === "variant" ? a = Na(o) : e === "bold" ? a = za(o) : a = o.style[e], a === n ? i.push(o) : (i.length > 0 && r.push(i), i = [o], n = a);
  }
  return i.length > 0 && r.push(i), r;
}
function R0(t38, e) {
  var o;
  let { parent: r } = t38[0], i = r == null ? void 0 : r.style.color, n = [];
  for (let a of I0(t38)) {
    let s = e.defaultMode;
    for (let l of ht(a, "color")) {
      let c = l[0].style, u = _e._registry[l[0].mode].serialize(l, g(h({}, e), { defaultMode: s === "text" ? "text" : "math" }));
      !e.skipStyles && c.color && c.color !== "none" && (!r || i !== c.color) ? n.push(U("\\textcolor", (o = c.verbatimColor) != null ? o : c.color, R(u))) : n.push(R(u));
    }
  }
  return n;
}
function kf(t38, e) {
  let { parent: r } = t38[0], i = r == null ? void 0 : r.style.backgroundColor;
  return ht(t38, "backgroundColor").map((n) => {
    var o;
    if (n.length > 0 || n[0].type !== "box") {
      let a = n[0].style;
      if (a.backgroundColor && a.backgroundColor !== "none" && (!r || i !== a.backgroundColor)) return U("\\colorbox", (o = a.verbatimBackgroundColor) != null ? o : a.backgroundColor, R(R0(n, g(h({}, e), { defaultMode: "text" }))));
    }
    return R(R0(n, e));
  });
}
function Lf(t38, e) {
  if (t38.length === 0) return [];
  let { parent: r } = t38[0], i = r == null ? void 0 : r.style.fontSize, n = [];
  for (let o of ht(t38, "fontSize")) {
    let a = o[0].style.fontSize, s = kf(o, e);
    s && (a && a !== "auto" && (!r || i !== a) ? n.push(["", "\\tiny", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge"][a], ...s) : n.push(...s));
  }
  return n;
}
function Fa(t38) {
  return t38 ? { mord: "ord", mbin: "bin", mop: "op", mrel: "rel", mopen: "open", mclose: "close", mpunct: "punct", minner: "inner", spacing: "ignore", latex: "latex", composition: "inner", error: "inner", placeholder: "ord", supsub: "ignore" }[t38] : void 0;
}
function ci(t38) {
  if (t38.length === 0) return "ord";
  let e = Fa(t38[0].type), r = Fa(t38[t38.length - 1].type);
  return e && e === r ? e : "ord";
}
function Jn(t38, e) {
  if (typeof t38 == "string") return t38;
  if (typeof t38 == "number") {
    let r = Math.ceil(100 * t38) / 100;
    return r === 0 ? "0" : r.toString() + (e != null ? e : "");
  }
  return "";
}
var w = class t {
  constructor(e, r) {
    var n, o, a, s, l;
    if (typeof e == "number" ? this.value = String.fromCodePoint(e) : typeof e == "string" ? this.value = e : ee(e) ? this.children = e.filter((c) => c !== null) : e && e instanceof t && (this.children = [e]), this.children) for (let c of this.children) c.parent = this;
    this.type = (n = r == null ? void 0 : r.type) != null ? n : "ignore", this.isSelected = (r == null ? void 0 : r.isSelected) === true, r != null && r.caret && (this.caret = r.caret), this.classes = (o = r == null ? void 0 : r.classes) != null ? o : "", this.isTight = (a = r == null ? void 0 : r.isTight) != null ? a : false, r != null && r.attributes && (this.attributes = r.attributes);
    let i = r == null ? void 0 : r.fontFamily;
    r != null && r.style && this.value && (i = (l = _e.getFont((s = r.mode) != null ? s : "math", this, g(h({ variant: "normal" }, r.style), { letterShapeStyle: r.letterShapeStyle }))) != null ? l : void 0), i || (i = "Main-Regular"), this._height = 0, this._depth = 0, this._width = 0, this.hasExplicitWidth = false, this.skew = 0, this.italic = 0, this.maxFontSize = 0, this.scale = 1, (r == null ? void 0 : r.maxFontSize) !== void 0 && (this.maxFontSize = r.maxFontSize), Af(this, i);
  }
  set atomID(e) {
    e === void 0 || e.length === 0 || (this.id = e);
  }
  selected(e) {
    if (this.isSelected !== e && (this.isSelected = e, this.children)) for (let r of this.children) r.selected(e);
  }
  setStyle(e, r, i) {
    if (r === void 0) return;
    let n = Jn(r, i);
    n.length > 0 && (this.cssProperties || (this.cssProperties = {}), this.cssProperties[e] = n);
  }
  setTop(e) {
    Number.isFinite(e) && Math.abs(e) > 0.01 && (this.cssProperties || (this.cssProperties = {}), this.cssProperties.top = Jn(e, "em"), this.height -= e, this.depth += e);
  }
  get left() {
    var e;
    return (e = this.cssProperties) != null && e["margin-left"] ? Number.parseFloat(this.cssProperties["margin-left"]) : 0;
  }
  set left(e) {
    Number.isFinite(e) && (e === 0 ? this.cssProperties && delete this.cssProperties["margin-left"] : (this.cssProperties || (this.cssProperties = {}), this.cssProperties["margin-left"] = Jn(e, "em")));
  }
  set right(e) {
    Number.isFinite(e) && (e === 0 ? this.cssProperties && delete this.cssProperties["margin-right"] : (this.cssProperties || (this.cssProperties = {}), this.cssProperties["margin-right"] = Jn(e, "em")));
  }
  set bottom(e) {
    Number.isFinite(e) && (e === 0 ? this.cssProperties && delete this.cssProperties["margin-bottom"] : (this.cssProperties || (this.cssProperties = {}), this.cssProperties["margin-bottom"] = Jn(e, "em")));
  }
  get width() {
    return this._width * this.scale;
  }
  set width(e) {
    this._width = e, this.hasExplicitWidth = true;
  }
  set softWidth(e) {
  }
  get height() {
    return this._height * this.scale;
  }
  set height(e) {
    this._height = e;
  }
  get depth() {
    return this._depth * this.scale;
  }
  set depth(e) {
    this._depth = e;
  }
  wrap(e) {
    let r = e.parent;
    if (!r) return this;
    e.isPhantom && this.setStyle("opacity", 0);
    let i = e.color;
    i && i !== r.color && this.setStyle("color", i);
    let o = e.backgroundColor;
    this.isSelected && (o = Du(o)), o && o !== r.backgroundColor && (this.setStyle("background-color", o), this.setStyle("--bg-color", o), this.setStyle("display", "inline-block"), this.setStyle("position", "relative"), this.classes = this.classes ? `${this.classes} ML__bg` : "ML__bg");
    let a = e.scalingFactor;
    return this.scale = a, this.skew *= a, this.italic *= a, this;
  }
  toMarkup() {
    var c, u, d;
    let e = this.value ? Cf(this.value) : "";
    if (this.children) for (let m of this.children) e += m.toMarkup();
    let r = "";
    if (this.svgBody) r = O0(this.svgBody);
    else if (this.svgOverlay) {
      r = '<span style="', r += "display: inline-block;", r += `height:${Math.floor(100 * (this.height + this.depth)) / 100}em;`, r += `vertical-align:${Math.floor(100 * this.depth) / 100}em;`, r += '">', r += e, r += "</span>", r += '<svg style="position:absolute;overflow:visible;', r += `height:${Math.floor(100 * (this.height + this.depth)) / 100}em;`;
      let m = (c = this.cssProperties) == null ? void 0 : c.padding;
      m ? (r += `top:${m};`, r += `left:${m};`, r += `width:calc(100% - 2 * ${m} );`) : r += "top:0;left:0;width:100%;", r += "z-index:2;", this.svgFilter && (r += `filter:${this.svgFilter.replace(/["&<>]/g, (p) => `&#${p.charCodeAt(0)};`)};`), r += '"', this.svgStyle && (r += this.svgStyle), r += ` viewBox="0 0 ${Math.floor(100 * this.width) / 100} ${Math.floor(100 * (this.height + this.depth)) / 100}"`, r += `>${this.svgOverlay}</svg>`;
    }
    let i = [], n = this.classes.split(" ");
    n.push((u = { latex: "ML__raw-latex", placeholder: "ML__placeholder", error: "ML__error" }[this.type]) != null ? u : ""), this.caret === "latex" && n.push("ML__latex-caret"), this.isSelected && n.push("ML__selected");
    let o = n.length === 1 ? n[0] : n.filter((m, p, f) => m.length > 0 && f.indexOf(m) === p).join(" ");
    if (o.length > 0 && i.push(`class=${Xi(`"${o}"`)}`), this.id && i.push(` data-atom-id=${Xi(this.id)}`), this.cssId && i.push(` id=${Xi(`"${this.cssId.replace(/ /g, "-")}"`)}`), this.attributes && i.push(...Object.keys(this.attributes).map((m) => `${ec(m)}=${Xi(this.attributes[m])}`)), this.htmlData) {
      let m = this.htmlData.split(",");
      for (let p of m) {
        let f = p.match(/([^=]+)=(.+$)/);
        if (f) {
          let y = ec(f[1]);
          if (y) if (y === "href") {
            let v = new URL(f[2]);
            if (v.protocol !== "http:" && v.protocol !== "https:") throw new Error(`Invalid URL: ${f[2]}`);
            i.push(`href="${z0(f[2])}"`);
          } else i.push(`data-${y}=${Xi(f[2])}`);
        } else {
          let y = ec(p);
          y && i.push(`data-${y} `);
        }
      }
    }
    let a = (d = this.cssProperties) != null ? d : {};
    this.hasExplicitWidth && a.width === void 0 && (a.width = `${Math.ceil(this._width * 100) / 100}em`);
    let s = Object.keys(a).map((m) => `${m}:${a[m]}`);
    if (this.scale !== void 0 && this.scale !== 1 && (e.length > 0 || r.length > 0) && s.push(`font-size: ${Math.ceil(this.scale * 1e4) / 100}%`), this.htmlStyle) for (let m of this.htmlStyle.split(";")) {
      let p = m.match(/([^:]+):(.+$)/);
      if (p) {
        let f = p[1].trim().replace(/ /g, "-");
        f && s.push(`${f}:${p[2]}`);
      }
    }
    s.length > 0 && i.push(`style=${Xi(s.join(";"))}`);
    let l = "";
    return i.length > 0 || r.length > 0 ? l = `<span ${i.join(" ")}>${e}${r}</span>` : l = e, this.caret === "text" ? l += '<span class="ML__text-caret"></span>' : this.caret === "math" && (l += '<span class="ML__caret"></span>'), l;
  }
  tryCoalesceWith(e) {
    if (this.svgBody || !this.value || e.svgBody || !e.value) return false;
    let r = this.children && this.children.length > 0, i = e.children && e.children.length > 0;
    if (r || i) return false;
    if (e.cssProperties || this.cssProperties) {
      for (let l of ["border", "border-left", "border-right", "border-right-width", "left", "margin", "margin-left", "margin-right", "padding", "position", "width"]) if (e.cssProperties && l in e.cssProperties || this.cssProperties && l in this.cssProperties) return false;
    }
    let n = this.cssProperties ? Object.keys(this.cssProperties).length : 0, o = e.cssProperties ? Object.keys(e.cssProperties).length : 0;
    if (n !== o) return false;
    if (n > 0) {
      for (let l of Object.keys(this.cssProperties)) if (this.cssProperties[l] !== e.cssProperties[l]) return false;
    }
    let a = this.classes.trim().replace(/\s+/g, " ").split(" "), s = e.classes.trim().replace(/\s+/g, " ").split(" ");
    if (a.length !== s.length) return false;
    a.sort(), s.sort();
    for (let [l, c] of a.entries()) if (c === "ML__vertical-separator" || c !== s[l]) return false;
    return this.value += e.value, this.height = Math.max(this.height, e.height), this.depth = Math.max(this.depth, e.depth), this._width = this._width + e._width, this.maxFontSize = Math.max(this.maxFontSize, e.maxFontSize), this.italic = e.italic, true;
  }
};
function tc(t38) {
  if (!t38 || t38.length === 0) return [];
  t38[0].children = tc(t38[0].children);
  let e = [t38[0]];
  for (let r = 1; r < t38.length; r++) e[e.length - 1].tryCoalesceWith(t38[r]) || (t38[r].children = tc(t38[r].children), e.push(t38[r]));
  return e;
}
function Or(t38) {
  return t38.children && (t38.children = tc(t38.children)), t38;
}
function Br(t38, e) {
  if (!t38) return new w(null, e);
  let r = new w(null, { classes: "ML__strut", type: "ignore" });
  r.setStyle("height", Math.max(0, t38.height), "em");
  let i = [r];
  if (t38.depth !== 0) {
    let n = new w(null, { classes: "ML__strut--bottom", type: "ignore" });
    n.setStyle("height", t38.height + t38.depth, "em"), n.setStyle("vertical-align", -t38.depth, "em"), i.push(n);
  }
  return i.push(t38), new w(i, g(h({}, e), { type: "lift" }));
}
function Zi(t38) {
  let e = B0(t38) / 2, r = new w(null, { maxFontSize: 0 });
  return r.height = e + 0.166, r.depth = e - 0.166, r.svgBody = t38, r;
}
function Af(t38, e) {
  var r;
  if (t38.type === "latex") {
    t38.height = 0.9, t38.depth = 0.2, t38._width = 1;
    return;
  }
  if (t38.value) {
    t38.height = -1 / 0, t38.depth = -1 / 0, t38._width = 0, t38.skew = -1 / 0, t38.italic = -1 / 0;
    for (let i = 0; i < t38.value.length; i++) {
      let n = Tr(t38.value.codePointAt(i), e);
      t38.height = Math.max(t38.height, n.height), t38.depth = Math.max(t38.depth, n.depth), t38._width += n.width, t38.skew = n.skew, t38.italic = n.italic;
    }
    return;
  }
  if (t38.children && t38.children.length > 0) {
    let i = -1 / 0, n = -1 / 0, o = 0;
    for (let a of t38.children) a.height > i && (i = a.height), a.depth > n && (n = a.depth), o = Math.max(o, (r = a.maxFontSize) != null ? r : 0);
    t38.height = i, t38.depth = n, t38._width = t38.children.reduce((a, s) => a + s.width, 0), t38.maxFontSize = o;
  }
}
function Cf(t38) {
  return t38.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function ec(t38) {
  if (t38 = t38.trim().replace(/ /g, "-"), t38.length === 0) throw new Error("Invalid empty attribute name");
  if (/[\x20\x09\x0a\x0c\x0d"'>/=\x00-\x1f]/.test(t38)) throw new Error(`Invalid attribute name "${t38}"`);
  return t38;
}
function z0(t38) {
  return t38.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Xi(t38) {
  if (t38 = t38.trim(), t38.length >= 2 && (t38.startsWith('"') && t38.endsWith('"') || t38.startsWith("'") && t38.endsWith("'"))) t38 = t38.slice(1, -1);
  else if (t38.length === 0) throw new Error("Invalid empty attribute value");
  return `"${z0(t38)}"`;
}
function Ef(t38) {
  if ("individualShift" in t38) {
    let e = t38.individualShift, r = e[0];
    if (r == null) return [null, 0];
    let i = [r], n = -r.shift - r.box.depth, o = n;
    for (let a = 1; a < e.length; a++) {
      let s = e[a], l = -s.shift - o - s.box.depth, c = l - (r.box.height + r.box.depth);
      o = o + l, i.push(c), i.push(s), r = s;
    }
    return [i, n];
  }
  if ("top" in t38) {
    let e = t38.top;
    for (let r of t38.children) e -= typeof r == "number" ? r : r.box.height + r.box.depth;
    return [t38.children, e];
  } else {
    if ("bottom" in t38) return [t38.children, -t38.bottom];
    if ("firstBaseline" in t38) {
      let e = t38.firstBaseline[0];
      if (typeof e == "number") throw new Error("First child must be an element.");
      return [t38.firstBaseline, -e.box.depth];
    } else if ("shift" in t38) {
      let e = t38.children[0];
      if (typeof e == "number") throw new Error("First child must be an element.");
      return [t38.children, -e.box.depth - t38.shift];
    }
  }
  return [null, 0];
}
function Tf(t38) {
  var p;
  let [e, r] = Ef(t38);
  if (!e) return [[], 0, 0];
  let i = new w(null, { classes: "ML__pstrut" }), n = 0;
  for (let f of e) if (typeof f != "number") {
    let y = f.box;
    n = Math.max(n, y.maxFontSize, y.height);
  }
  n += 2, i.height = n, i.setStyle("height", n, "em");
  let o = [], a = r, s = r, l = r, c = 0;
  for (let f of e) {
    if (typeof f == "number") l += f;
    else {
      let y = f.box, v = (p = f.classes) != null ? p : [], b = new w([i, y], { classes: v.join(" "), style: f.style });
      y.setStyle("height", y.height + y.depth, "em"), y.setStyle("display", "inline-block"), b.setStyle("top", -n - l - y.depth, "em"), f.marginLeft && b.setStyle("margin-left", f.marginLeft, "em"), f.marginRight && b.setStyle("margin-right", f.marginRight, "em"), o.push(b), l += y.height + y.depth, c = Math.max(c, b.width);
    }
    a = Math.min(a, l), s = Math.max(s, l);
  }
  o.forEach((f) => {
    f.softWidth = c;
  });
  let u = new w(o, { classes: "ML__vlist" });
  if (u.softWidth = c, u.height = s, u.setStyle("height", s, "em"), a >= 0) return [[new w(u, { classes: "ML__vlist-r" })], s, -a];
  let d = new w(new w(null), { classes: "ML__vlist" });
  d.height = -a, d.setStyle("height", -a, "em");
  let m = new w(8203, { classes: "ML__vlist-s", maxFontSize: 0 });
  return m.softWidth = 0, m.height = 0, m.depth = 0, [[new w([u, m], { classes: "ML__vlist-r" }), new w(d, { classes: "ML__vlist-r" })], s, -a];
}
var te = class extends w {
  constructor(e, r) {
    var a;
    let [i, n, o] = Tf(e);
    super(i.length === 1 ? i[0] : i, { type: r == null ? void 0 : r.type, classes: ((a = r == null ? void 0 : r.classes) != null ? a : "") + " ML__vlist-t" + (i.length === 2 ? " ML__vlist-t2" : "") }), this.height = n, this.depth = o, this.softWidth = i.reduce((s, l) => Math.max(s, l.width), 0);
  }
};
function N0(t38, e) {
  var c, u, d, m, p;
  let r = t38.metrics, i = new w(e.base), n = (c = e.baseShift) != null ? c : 0, o = (u = e.slant) != null ? u : 0, a = 0, s = 0;
  e.above && (a = (d = e.aboveShift) != null ? d : Math.max(r.bigOpSpacing1, r.bigOpSpacing3 - e.above.depth)), e.below && (s = (m = e.belowShift) != null ? m : Math.max(r.bigOpSpacing2, r.bigOpSpacing4 - e.below.height));
  let l = null;
  if (e.below && e.above) {
    let f = r.bigOpSpacing5 + e.below.height + e.below.depth + s + i.depth + n;
    l = new te({ bottom: f, children: [r.bigOpSpacing5, { box: e.below, marginLeft: -o, classes: ["ML__center"] }, s, { box: i, classes: ["ML__center"] }, a, { box: e.above, marginLeft: o, classes: ["ML__center"] }, r.bigOpSpacing5] }).wrap(t38);
  } else if (e.below && !e.above) l = new te({ top: i.height - n, children: [r.bigOpSpacing5, { box: e.below, marginLeft: -o, classes: ["ML__center"] }, s, { box: i, classes: ["ML__center"] }] }).wrap(t38);
  else if (!e.below && e.above) {
    let f = i.depth + n;
    l = new te({ bottom: f, children: [{ box: i, classes: ["ML__center"] }, a, { box: e.above, marginLeft: o, classes: ["ML__center"] }, r.bigOpSpacing5] }).wrap(t38);
  } else {
    let f = i.depth + n;
    l = new te({ bottom: f, children: [{ box: i }, r.bigOpSpacing5] }).wrap(t38);
  }
  return new w(l, { type: (p = e.type) != null ? p : "op" });
}
var Df = /^-?(\d+|\d*\.\d+)(px|em|rem|ex|ch|pt|pc|cm|mm|in|vw|vh|%)?$/, Of = /^([a-zA-Z]+|#[0-9a-fA-F]{3,8}|(rgba?|hsla?)\(\s*[-\d.,%\s/]*\s*\)|var\(--[\w-]+\))$/, Bf = /^(none|hidden|solid|dashed|dotted|double|groove|ridge|inset|outset)$/;
function rc(t38) {
  let e = [], r = 0, i = "";
  for (let n of t38.trim()) {
    if (n === "(" ? r += 1 : n === ")" && (r -= 1), r < 0) return;
    /\s/.test(n) && r === 0 ? (i && e.push(i), i = "") : i += n;
  }
  if (r === 0) return i && e.push(i), e;
}
function ic(t38) {
  return Df.test(t38);
}
function nc(t38) {
  return Of.test(t38);
}
function F0(t38) {
  if (!t38) return;
  let e = t38.trim();
  return ic(e) ? e : void 0;
}
function Yi(t38) {
  if (!t38) return;
  let e = rc(t38);
  if (!(!e || e.length !== 1)) return nc(e[0]) ? e[0] : void 0;
}
function $a(t38) {
  if (!t38) return;
  let e = rc(t38);
  if (!e || e.length === 0 || e.length > 3) return;
  let r = 0, i = 0, n = 0;
  for (let o of e) if (ic(o)) r += 1;
  else if (Bf.test(o)) i += 1;
  else if (nc(o)) n += 1;
  else return;
  if (!(r > 1 || i > 1 || n > 1)) return e.join(" ");
}
function $0(t38) {
  if (!t38) return;
  let e = rc(t38);
  if (!e || e.length < 2 || e.length > 4) return;
  let r = 0, i = 0;
  for (let n of e) if (ic(n)) r += 1;
  else if (nc(n)) i += 1;
  else return;
  if (!(r < 2 || r > 3 || i > 1)) return e.join(" ");
}
function V0(t38) {
  if (!t38) return;
  let e = t38.trim();
  return /^[A-Za-z0-9 _'",-]+$/.test(e) ? e : void 0;
}
var Va = 7, Zn = 6, Yn = 5, Kr = 4, ui = 3, He = 2, Pr = 1, Ee = 0, Rt = class {
  constructor(e, r, i) {
    this.id = e, this.sizeDelta = r, this.cramped = i;
    let n = { "-4": 2, "-3": 1, 0: 0 }[r];
    this.metrics = Object.keys(Xl).reduce((o, a) => g(h({}, o), { [a]: Xl[a][n] }), {});
  }
  getFontSize(e) {
    return Math.max(1, e + this.sizeDelta);
  }
  get sup() {
    return pt[[Ee, Pr, Ee, Pr, He, ui, He, ui][this.id]];
  }
  get sub() {
    return pt[[Ee, Ee, Ee, Ee, He, He, He, He][this.id]];
  }
  get fracNum() {
    return pt[[Ee, Pr, Ee, Pr, He, ui, Kr, Yn][this.id]];
  }
  get fracDen() {
    return pt[[Ee, Ee, Ee, Ee, He, He, Kr, Kr][this.id]];
  }
  get cramp() {
    return pt[[Ee, Ee, He, He, Kr, Kr, Zn, Zn][this.id]];
  }
  get isTight() {
    return this.sizeDelta < 0;
  }
}, Xn = { 7: new Rt(Va, 0, false), 6: new Rt(Zn, 0, true), 5: new Rt(Yn, 0, false), 4: new Rt(Kr, 0, true), 3: new Rt(ui, -3, false), 2: new Rt(He, -3, true), 1: new Rt(Pr, -4, false), 0: new Rt(Ee, -4, true) }, pt = g(h({}, Xn), { displaystyle: Xn[Va], textstyle: Xn[Yn], scriptstyle: Xn[ui], scriptscriptstyle: Xn[Pr] });
function ac(t38, e) {
  var i;
  if (!t38) return 0;
  let r = { pt: 1, mm: 7227 / 2540, cm: 7227 / 254, ex: 35271 / 8192, px: 3 / 4, em: Pt, bp: 803 / 800, dd: 1238 / 1157, pc: 12, in: 72.27, mu: 10 / 18 }[(i = t38.unit) != null ? i : "pt"];
  if (Number.isFinite(e)) {
    let n = 10 ** e;
    return Math.round(t38.dimension / Pt * r * n) / n;
  }
  return t38.dimension * r;
}
function qa(t38, e) {
  if (t38 === null) return 0;
  let r = ac(t38) / Pt;
  if (Number.isFinite(e)) {
    let i = 10 ** e;
    return Math.round(r * i) / i;
  }
  return r;
}
function oc(t38) {
  var e;
  return `${t38.dimension}${(e = t38.unit) != null ? e : "pt"}`;
}
function Kf(t38) {
  let e = oc(t38.glue);
  return t38.grow && t38.grow.dimension !== 0 && (e += ` plus ${oc(t38.grow)}`), t38.shrink && t38.shrink.dimension !== 0 && (e += ` minus ${oc(t38.shrink)}`), e;
}
function ge(t38) {
  var r, i;
  if (t38 == null) return null;
  let e = "";
  if ("dimension" in t38 && (e = `${t38.dimension}${(r = t38.unit) != null ? r : "pt"}`), "glue" in t38 && (e = Kf(t38)), "number" in t38) if (!("base" in t38) || t38.base === "decimal") e = Number(t38.number).toString();
  else if (t38.base === "alpha") e = `\`${String.fromCodePoint(t38.number)}`;
  else {
    let n = Math.round(t38.number) >>> 0;
    t38.base === "hexadecimal" ? (e = Number(n).toString(16).toUpperCase(), n <= 255 ? e = e.padStart(2, "0") : n <= 65535 ? e = e.padStart(4, "0") : n <= 16777215 ? e = e.padStart(6, "0") : e = e.padStart(8, "0"), e = `"${e}`) : t38.base === "octal" && (e = Number(n).toString(8), n <= 63 ? e = e.padStart(2, "0") : n <= 30583 ? e = e.padStart(4, "0") : e = e.padStart(8, "0"), e = `'${e}`);
  }
  return "register" in t38 && ("factor" in t38 && (t38.factor === -1 ? e = "-" : t38.factor !== 1 && (e = Number(t38.factor).toString())), "global" in t38 && t38.global && (e += "\\global"), e += `\\${t38.register}`), "string" in t38 && (e = t38.string), (i = t38.relax) != null && i && (e += "\\relax"), e;
}
function ft(t38, e) {
  return t38 == null ? null : "number" in t38 ? g(h({}, t38), { number: t38.number * e }) : "register" in t38 ? "factor" in t38 && t38.factor ? g(h({}, t38), { factor: t38.factor * e }) : g(h({}, t38), { factor: e }) : "dimension" in t38 ? g(h({}, t38), { dimension: t38.dimension * e }) : "glue" in t38 ? t38.shrink && t38.grow ? { glue: ft(t38.glue, e), shrink: ft(t38.shrink, e), grow: ft(t38.grow, e) } : t38.shrink ? { glue: ft(t38.glue, e), shrink: ft(t38.shrink, e) } : t38.grow ? { glue: ft(t38.glue, e), grow: ft(t38.grow, e) } : { glue: ft(t38.glue, e) } : null;
}
var Pf = { "p@": { dimension: 1 }, "z@": { dimension: 0 }, maxdimen: { dimension: 16383.99999 }, hfuzz: { dimension: 0.1 }, vfuzz: { dimension: 0.1 }, overfullrule: { dimension: 5 }, hsize: { dimension: 6.5, unit: "in" }, vsize: { dimension: 8.9, unit: "in" }, parindent: { dimension: 20 }, maxdepth: { dimension: 4 }, splitmaxdepth: { register: "maxdimen" }, boxmaxdepth: { register: "maxdimen" }, delimitershortfall: { dimension: 5 }, nulldelimiterspace: { dimension: 1.2, unit: "pt" }, scriptspace: { dimension: 0.5 }, topskip: { dimension: 10 }, splittopskip: { dimension: 10 }, normalbaselineskip: { dimension: 12 }, normallineskip: { dimension: 1 }, normallineskiplimit: { dimension: 0 }, jot: { dimension: 3 }, doublerulesep: { dimension: 2 }, arrayrulewidth: { dimension: 0.4 }, arraycolsep: { dimension: 5 }, fboxsep: { dimension: 3 }, fboxrule: { dimension: 0.4 }, "z@skip": { glue: { dimension: 0 }, shrink: { dimension: 0 }, grow: { dimension: 0 } }, hideskip: { glue: { dimension: -1e3 }, grow: { dimension: 1, unit: "fill" } }, "@flushglue": { glue: { dimension: 0 }, grow: { dimension: 1, unit: "fill" } }, parskip: { glue: { dimension: 0 }, grow: { dimension: 1 } }, abovedisplayskip: { glue: { dimension: 12 }, grow: { dimension: 3 }, shrink: { dimension: 9 } }, abovedisplayshortskip: { glue: { dimension: 0 }, grow: { dimension: 3 } }, belowdisplayskip: { glue: { dimension: 12 }, grow: { dimension: 3 }, shrink: { dimension: 9 } }, belowdisplayshortskip: { glue: { dimension: 7 }, grow: { dimension: 3 }, shrink: { dimension: 4 } }, parfillskip: { glue: { dimension: 0 }, grow: { dimension: 1, unit: "fil" } }, thinmuskip: { glue: { dimension: 3, unit: "mu" } }, medmuskip: { glue: { dimension: 4, unit: "mu" }, grow: { dimension: 2, unit: "mu" }, shrink: { dimension: 4, unit: "mu" } }, thickmuskip: { glue: { dimension: 5, unit: "mu" }, grow: { dimension: 5, unit: "mu" } }, smallskipamount: { glue: { dimension: 3 }, grow: { dimension: 1 }, shrink: { dimension: 1 } }, medskipamount: { glue: { dimension: 6 }, grow: { dimension: 2 }, shrink: { dimension: 3 } }, bigskipamount: { glue: { dimension: 12 }, grow: { dimension: 2 }, shrink: { dimension: 4 } }, pretolerance: 100, tolerance: 200, hbadness: 1e3, vbadness: 1e3, linepenalty: 10, hyphenpenalty: 50, exhyphenpenalty: 50, binoppenalty: 700, relpenalty: 500, clubpenalty: 150, widowpenalty: 150, displaywidowpenalty: 50, brokenpenalty: 100, predisplaypenalty: 1e4, doublehyphendemerits: 1e4, finalhyphendemerits: 5e3, adjdemerits: 1e4, tracinglostchars: 1, uchyph: 1, delimiterfactor: 901, defaulthyphenchar: "\\-", defaultskewchar: -1, newlinechar: -1, showboxbreadth: 5, showboxdepth: 3, errorcontextlines: 5, interdisplaylinepenalty: 100, interfootnotelinepenalty: 100, baselineSkip: 1.2, arraystretch: 1, month: (/* @__PURE__ */ new Date()).getMonth() + 1, day: (/* @__PURE__ */ new Date()).getDate(), year: (/* @__PURE__ */ new Date()).getFullYear() };
function Ha() {
  return h({}, Pf);
}
function Qn() {
  return { registers: Ha(), smartFence: false, renderPlaceholder: void 0, placeholderSymbol: "▢", letterShapeStyle: F.locale.startsWith("fr") ? "french" : "tex", minFontScale: 0, maxMatrixCols: 10, colorMap: Yr, backgroundColorMap: Bi, getMacro: (t38) => ti(t38, Ri()) };
}
var P = class t2 {
  constructor(e, r) {
    var o, a, s, l, c, u, d, m, p, f, y, v, b, k, S;
    let i;
    e != null && e.parent ? (this.parent = e.parent, i = e.parent, this.registers = {}) : (i = h(h({}, Qn()), (o = e == null ? void 0 : e.from) != null ? o : {}), this.registers = i.registers), i.atomIdsSettings && (this.atomIdsSettings = h({}, i.atomIdsSettings)), this.renderPlaceholder = i.renderPlaceholder, this.isPhantom = (l = (s = e == null ? void 0 : e.isPhantom) != null ? s : (a = this.parent) == null ? void 0 : a.isPhantom) != null ? l : false, this.letterShapeStyle = i.letterShapeStyle, this.minFontScale = i.minFontScale, this.maxMatrixCols = i.maxMatrixCols, r != null && r.color && r.color !== "none" ? this.color = r.color : this.color = (u = (c = this.parent) == null ? void 0 : c.color) != null ? u : "", r != null && r.backgroundColor && r.backgroundColor !== "none" ? this.backgroundColor = r.backgroundColor : this.backgroundColor = (m = (d = this.parent) == null ? void 0 : d.backgroundColor) != null ? m : "", r != null && r.fontSize && r.fontSize !== "auto" && r.fontSize !== ((p = this.parent) == null ? void 0 : p.size) ? this.size = r.fontSize : this.size = (y = (f = this.parent) == null ? void 0 : f.size) != null ? y : ji;
    let n = (b = (v = this.parent) == null ? void 0 : v.mathstyle) != null ? b : pt.displaystyle;
    if (typeof (e == null ? void 0 : e.mathstyle) == "string") {
      if (i instanceof t2) switch (e.mathstyle) {
        case "cramp":
          n = n.cramp;
          break;
        case "superscript":
          n = n.sup;
          break;
        case "subscript":
          n = n.sub;
          break;
        case "numerator":
          n = n.fracNum;
          break;
        case "denominator":
          n = n.fracDen;
          break;
      }
      switch (e.mathstyle) {
        case "textstyle":
          n = pt.textstyle;
          break;
        case "displaystyle":
          n = pt.displaystyle;
          break;
        case "scriptstyle":
          n = pt.scriptstyle;
          break;
        case "scriptscriptstyle":
          n = pt.scriptscriptstyle;
          break;
      }
    }
    this.mathstyle = n, this.smartFence = i.smartFence, this.placeholderSymbol = i.placeholderSymbol, this.colorMap = (k = i.colorMap) != null ? k : ((A) => A), this.backgroundColorMap = (S = i.backgroundColorMap) != null ? S : ((A) => A), this.getMacro = i.getMacro, this.parent !== void 0 || this.registers;
  }
  makeID() {
    if (!this.atomIdsSettings) return;
    if (this.atomIdsSettings.overrideID) return this.atomIdsSettings.overrideID;
    if (typeof this.atomIdsSettings.seed != "number") return `${Date.now().toString(36).slice(-2)}${Math.floor(Math.random() * 1e5).toString(36)}`;
    let e = this.atomIdsSettings.seed.toString(36);
    return this.atomIdsSettings.seed += 1, e;
  }
  scale(e) {
    return e * this.effectiveFontSize;
  }
  get scalingFactor() {
    return this.parent ? this.effectiveFontSize / this.parent.effectiveFontSize : 1;
  }
  get isDisplayStyle() {
    return this.mathstyle.id === Va || this.mathstyle.id === Zn;
  }
  get isCramped() {
    return this.mathstyle.cramped;
  }
  get isTight() {
    return this.mathstyle.isTight;
  }
  get metrics() {
    return this.mathstyle.metrics;
  }
  get effectiveFontSize() {
    return Math.max(jn[Math.max(1, this.size + this.mathstyle.sizeDelta)], this.minFontScale);
  }
  getRegister(e) {
    if (this.registers && e in this.registers) return this.registers[e];
    if (this.parent) return this.parent.getRegister(e);
  }
  getRegisterAsNumber(e) {
    let r = this.getRegister(e);
    if (typeof r == "number") return r;
    if (typeof r == "string") return Number(r);
  }
  getRegisterAsGlue(e) {
    if (this.registers && e in this.registers) {
      let r = this.registers[e];
      return typeof r == "object" && "glue" in r ? r : typeof r == "object" && "dimension" in r ? { glue: { dimension: r.dimension } } : typeof r == "number" ? { glue: { dimension: r } } : void 0;
    }
    if (this.parent) return this.parent.getRegisterAsGlue(e);
  }
  getRegisterAsEm(e, r) {
    return qa(this.getRegisterAsDimension(e), r);
  }
  getRegisterAsDimension(e) {
    if (this.registers && e in this.registers) {
      let r = this.registers[e];
      return typeof r == "object" && "glue" in r ? r.glue : typeof r == "object" && "dimension" in r ? r : typeof r == "number" ? { dimension: r } : void 0;
    }
    if (this.parent) return this.parent.getRegisterAsDimension(e);
  }
  setRegister(e, r) {
    if (r === void 0) {
      delete this.registers[e];
      return;
    }
    this.registers[e] = r;
  }
  evaluate(e) {
    if (!e || !("register" in e)) return e;
    let r = this;
    if ("global" in e && e.global) for (; r.parent; ) r = r.parent;
    let i = 1;
    "factor" in e && e.factor !== 1 && e.factor !== void 0 && (i = e.factor);
    let n = r.getRegister(e.register);
    if (n === void 0) return;
    if (typeof n == "string") return { string: Number(n).toString() + n };
    if (typeof n == "number") return { number: i * n };
    let o = r.evaluate(n);
    if (o !== void 0) return "string" in o ? { string: Number(n).toString() + o.string } : "number" in o ? { number: i * o.number } : "dimension" in o ? g(h({}, o), { dimension: i * o.dimension }) : "glue" in o ? g(h({}, o), { glue: g(h({}, o.glue), { dimension: i * o.glue.dimension }), shrink: o.shrink ? g(h({}, o.shrink), { dimension: i * o.shrink.dimension }) : void 0, grow: o.grow ? g(h({}, o.grow), { dimension: i * o.grow.dimension }) : void 0 }) : e;
  }
  toDimension(e) {
    let r = this.evaluate(e);
    if (r === void 0) return null;
    if ("dimension" in r) return r;
    if ("glue" in r) return r.glue;
    if ("number" in r) return { dimension: r.number };
    if ("string" in r) {
      let i = parseFloat(r.string), n = r.string.match(/(mm|cm|ex|px|em|bp|dd|pc|in|mu)$/);
      return n ? { dimension: i, unit: n[0] } : { dimension: i };
    }
    return null;
  }
  toEm(e, r) {
    if (e === null) return 0;
    let i = this.toDimension(e);
    return i === null ? 0 : ac(i, r) / Pt;
  }
  toNumber(e) {
    if (e === null) return null;
    let r = this.evaluate(e);
    return r === void 0 ? null : "number" in r ? r.number : "dimension" in r ? r.dimension : "glue" in r ? r.glue.dimension : "string" in r ? Number(r.string) : null;
  }
  toColor(e) {
    var i, n, o;
    if (e === null) return null;
    let r = this.evaluate(e);
    return r === void 0 ? null : "string" in r && (o = (n = (i = this.colorMap) == null ? void 0 : i.call(this, r.string)) != null ? n : Yi(r.string)) != null ? o : null;
  }
  toBackgroundColor(e) {
    var i, n, o;
    if (e === null) return null;
    let r = this.evaluate(e);
    return r === void 0 ? null : "string" in r && (o = (n = (i = this.backgroundColorMap) == null ? void 0 : i.call(this, r.string)) != null ? n : Yi(r.string)) != null ? o : null;
  }
};
var Ir = ["body", "above", "below", "subscript", "superscript"];
function Rr(t38) {
  return typeof t38 == "string" && Ir.includes(t38);
}
function Ze(t38) {
  return t38 !== void 0 && Array.isArray(t38) && t38.length === 2;
}
var x = class t3 {
  constructor(e) {
    this.isRoot = false;
    var r, i, n, o, a, s, l;
    this.type = e.type, typeof e.value == "string" && (this.value = e.value), this.command = (i = (r = e.command) != null ? r : this.value) != null ? i : "", this.mode = (n = e.mode) != null ? n : "math", e.isFunction && (this.isFunction = true), (e.isRoot || this.type === "root") && (this.isRoot = true), e.limits && (this.subsupPlacement = e.limits), this.style = h({}, (o = e.style) != null ? o : {}), this.displayContainsHighlight = (a = e.displayContainsHighlight) != null ? a : false, this.captureSelection = (s = e.captureSelection) != null ? s : false, this.skipBoundary = (l = e.skipBoundary) != null ? l : false, e.verbatimLatex !== void 0 && e.verbatimLatex !== null && (this.verbatimLatex = e.verbatimLatex), e.args && (this.args = e.args), e.body && (this.body = e.body), this._changeCounter = 0;
  }
  static createBox(e, r, i) {
    var s;
    if (!r) return null;
    let n = Rf(r), o = [];
    for (let l of n) {
      let c = l[0].style, u = If(e, l, { style: { color: c.color, backgroundColor: c.backgroundColor, fontSize: c.fontSize } });
      u && o.push(u);
    }
    if (o.length === 0) return null;
    let a = ((s = i == null ? void 0 : i.classes) != null ? s : "").trim();
    return o.length === 1 && !a && !(i != null && i.type) ? o[0].wrap(e) : new w(o, { classes: a, type: i == null ? void 0 : i.type }).wrap(e);
  }
  static serialize(e, r) {
    return _e.serialize(e, r);
  }
  static commonAncestor(e, r) {
    if (e === r || e.parent === r.parent) return e.parent;
    let i = /* @__PURE__ */ new WeakSet(), { parent: n } = e;
    for (; n; ) i.add(n), n = n.parent;
    for (n = r.parent; n; ) {
      if (i.has(n)) return n;
      n = n.parent;
    }
  }
  static fromJson(e) {
    return typeof e == "string" ? new t3({ type: "mord", value: e, mode: "math" }) : new t3(e);
  }
  toJson() {
    if (this._json) return this._json;
    let e = {};
    if (this.type && (e.type = this.type), this.mode !== "math" && (e.mode = this.mode), this.command && this.command !== this.value && (e.command = this.command), this.value !== void 0 && (e.value = this.value), this.style && Object.keys(this.style).length > 0 && (e.style = h({}, this.style)), this.verbatimLatex !== void 0 && (e.verbatimLatex = this.verbatimLatex), this.subsupPlacement && (e.subsupPlacement = this.subsupPlacement), this.explicitSubsupPlacement && (e.explicitSubsupPlacement = true), this.isFunction && (e.isFunction = true), this.displayContainsHighlight && (e.displayContainsHighlight = true), this.skipBoundary && (e.skipBoundary = true), this.captureSelection && (e.captureSelection = true), this.args && (e.args = zf(this.args)), this._branches) for (let r of Object.keys(this._branches)) this._branches[r] && (e[r] = this._branches[r].filter((i) => i.type !== "first").map((i) => i.toJson()));
    return e.type === "mord" && Object.keys(e).length === 2 && "value" in e ? e.value : (this._json = e, e);
  }
  get changeCounter() {
    return this.parent ? this.parent.changeCounter : this._changeCounter;
  }
  set isDirty(e) {
    e && (this._json = void 0, this.parent || this._changeCounter++, "verbatimLatex" in this && (this.verbatimLatex = void 0), this._children = void 0, this.parent && (this.parent.isDirty = true));
  }
  _serialize(e) {
    if (!(e.expandMacro || e.skipStyles || e.skipPlaceholders) && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    return r != null && r.serialize ? r.serialize(this, e) : this.body && this.command ? R([U(this.command, this.bodyToLatex(e)), this.supsubToLatex(e)]) : this.body ? R([this.bodyToLatex(e), this.supsubToLatex(e)]) : !this.value || this.value === "​" ? "" : this.command;
  }
  bodyToLatex(e) {
    var i;
    let r = (i = e.defaultMode) != null ? i : this.mode === "math" ? "math" : "text";
    return _e.serialize(this.body, g(h({}, e), { defaultMode: r }));
  }
  aboveToLatex(e) {
    return _e.serialize(this.above, e);
  }
  belowToLatex(e) {
    return _e.serialize(this.below, e);
  }
  supsubToLatex(e) {
    let r = "";
    if (e = g(h({}, e), { defaultMode: "math" }), this.branch("subscript") !== void 0) {
      let i = _e.serialize(this.subscript, e);
      i.length === 0 ? r += "_{}" : i.length === 1 ? /^[0-9]$/.test(i) ? r += `_${i}` : r += `_{${i}}` : r += `_{${i}}`;
    }
    if (this.branch("superscript") !== void 0) {
      let i = _e.serialize(this.superscript, e);
      i.length === 0 ? r += "^{}" : i.length === 1 ? i === "′" ? r += "^\\prime " : i === "″" ? r += "^\\doubleprime " : /^[0-9]$/.test(i) ? r += `^${i}` : r += `^{${i}}` : r += `^{${i}}`;
    }
    return r;
  }
  get treeDepth() {
    let e = 1, r = this.parent;
    for (; r; ) r = r.parent, e += 1;
    return e;
  }
  get inCaptureSelection() {
    let e = this;
    for (; e; ) {
      if (e.captureSelection) return true;
      e = e.parent;
    }
    return false;
  }
  get parentPrompt() {
    let e = this.parent;
    for (; e; ) {
      if (e.type === "prompt" && !e.captureSelection) return e;
      e = e.parent;
    }
    return null;
  }
  branch(e) {
    if (Rr(e) && this._branches) return this._branches[e];
  }
  get branches() {
    if (!this._branches) return [];
    let e = [];
    for (let r of Ir) this._branches[r] && e.push(r);
    return e;
  }
  createBranch(e) {
    return Rr(e), Rr(e) ? (this._branches ? this._branches[e] || (this._branches[e] = [this.makeFirstAtom(e)]) : this._branches = { [e]: [this.makeFirstAtom(e)] }, this.isDirty = true, this._branches[e]) : [];
  }
  get row() {
    return Ze(this.parentBranch) ? this.parentBranch[0] : -1;
  }
  get col() {
    return Ze(this.parentBranch) ? this.parentBranch[1] : -1;
  }
  get body() {
    var e;
    return (e = this._branches) == null ? void 0 : e.body;
  }
  set body(e) {
    this.setChildren(e, "body");
  }
  get superscript() {
    var e;
    return (e = this._branches) == null ? void 0 : e.superscript;
  }
  set superscript(e) {
    this.setChildren(e, "superscript");
  }
  get subscript() {
    var e;
    return (e = this._branches) == null ? void 0 : e.subscript;
  }
  set subscript(e) {
    this.setChildren(e, "subscript");
  }
  get above() {
    var e;
    return (e = this._branches) == null ? void 0 : e.above;
  }
  set above(e) {
    this.setChildren(e, "above");
  }
  get below() {
    var e;
    return (e = this._branches) == null ? void 0 : e.below;
  }
  set below(e) {
    this.setChildren(e, "below");
  }
  applyStyle(e, r) {
    this.isDirty = true, r != null && r.unstyledOnly ? (e.color && !this.style.color && (this.style.color = e.color), e.backgroundColor && !this.style.backgroundColor && (this.style.backgroundColor = e.backgroundColor), e.fontFamily && !this.style.fontFamily && (this.style.fontFamily = e.fontFamily), e.fontShape && !this.style.fontShape && (this.style.fontShape = e.fontShape), e.fontSeries && !this.style.fontSeries && (this.style.fontSeries = e.fontSeries), e.fontSize && !this.style.fontSize && (this.style.fontSize = e.fontSize), e.variant && !this.style.variant && (this.style.variant = e.variant), e.variantStyle && !this.style.variantStyle && (this.style.variantStyle = e.variantStyle)) : this.style = h(h({}, this.style), e), this.style.fontFamily === "none" && delete this.style.fontFamily, this.style.fontShape === "auto" && delete this.style.fontShape, this.style.fontSeries === "auto" && delete this.style.fontSeries, this.style.color === "none" && (delete this.style.color, delete this.style.verbatimColor), this.style.backgroundColor === "none" && (delete this.style.backgroundColor, delete this.style.verbatimBackgroundColor), this.style.fontSize === "auto" && delete this.style.fontSize;
    for (let i of this.children) i.applyStyle(e, r);
  }
  getInitialBaseElement() {
    var e, r, i;
    return this.hasEmptyBranch("body") ? this : ((e = this.body) == null || e[0].type, (i = (r = this.body[1]) == null ? void 0 : r.getInitialBaseElement()) != null ? i : this);
  }
  getFinalBaseElement() {
    return this.hasEmptyBranch("body") ? this : this.body[this.body.length - 1].getFinalBaseElement();
  }
  isCharacterBox() {
    return this.type === "leftright" || this.type === "genfrac" || this.type === "subsup" || this.type === "delim" || this.type === "array" || this.type === "surd" ? false : this.getFinalBaseElement().type === "mord";
  }
  hasEmptyBranch(e) {
    let r = this.branch(e);
    return r ? (r.length > 0, r[0].type, r.length === 1) : true;
  }
  setChildren(e, r) {
    var n;
    if (!e || (Rr(r), !Rr(r))) return;
    let i = ((n = e[0]) == null ? void 0 : n.type) === "first" ? [...e] : [this.makeFirstAtom(r), ...e];
    this._branches ? this._branches[r] = i : this._branches = { [r]: i };
    for (let o of e) o.parent = this, o.parentBranch = r;
    this.isDirty = true;
  }
  makeFirstAtom(e) {
    let r = new t3({ type: "first", mode: this.mode });
    return r.parent = this, r.parentBranch = e, r;
  }
  addChild(e, r) {
    e.type, this.createBranch(r).push(e), this.isDirty = true, e.parent = this, e.parentBranch = r;
  }
  addChildBefore(e, r) {
    r.parentBranch;
    let i = this.createBranch(r.parentBranch);
    i.splice(i.indexOf(r), 0, e), this.isDirty = true, e.parent = this, e.parentBranch = r.parentBranch;
  }
  addChildAfter(e, r) {
    r.parentBranch;
    let i = this.createBranch(r.parentBranch);
    i.splice(i.indexOf(r) + 1, 0, e), this.isDirty = true, e.parent = this, e.parentBranch = r.parentBranch;
  }
  addChildren(e, r) {
    let i = this.createBranch(r);
    for (let n of e) n.parent = this, n.parentBranch = r, i.push(n);
    this.isDirty = true;
  }
  addChildrenAfter(e, r) {
    e.length === 0 || e[0].type, r.parentBranch;
    let i = this.createBranch(r.parentBranch);
    i.splice(i.indexOf(r) + 1, 0, ...e), this.isDirty = true;
    for (let n of e) n.parent = this, n.parentBranch = r.parentBranch;
    return e[e.length - 1];
  }
  removeBranch(e) {
    let r = this.branch(e);
    if (Rr(e) && (this._branches[e] = void 0), !r) return [];
    for (let o of r) o.parent = void 0, o.parentBranch = void 0;
    r[0].type;
    let [i, ...n] = r;
    return this.isDirty = true, n;
  }
  removeChild(e) {
    if (e.parent, e.type === "first") return;
    let r = this.branch(e.parentBranch), i = r.indexOf(e);
    r.splice(i, 1), this.isDirty = true, e.parent = void 0, e.parentBranch = void 0;
  }
  get siblings() {
    return this.parent ? this.parent.branch(this.parentBranch) : [];
  }
  get firstSibling() {
    return this.siblings[0];
  }
  get lastSibling() {
    let { siblings: e } = this;
    return e[e.length - 1];
  }
  get isFirstSibling() {
    return this === this.firstSibling;
  }
  get isLastSibling() {
    return this === this.lastSibling;
  }
  get hasNoSiblings() {
    return this.siblings.length === 1;
  }
  get leftSibling() {
    this.parent;
    let e = this.parent.branch(this.parentBranch);
    return e[e.indexOf(this) - 1];
  }
  get rightSibling() {
    this.parent;
    let e = this.parent.branch(this.parentBranch);
    return e[e.indexOf(this) + 1];
  }
  get hasChildren() {
    return !!(this._branches && this.children.length > 0);
  }
  get firstChild() {
    return this.hasChildren, this.children[0];
  }
  get lastChild() {
    this.hasChildren;
    let { children: e } = this;
    return e[e.length - 1];
  }
  get children() {
    if (this._children) return this._children;
    if (!this._branches) return [];
    let e = [];
    for (let r of Ir) if (this._branches[r]) for (let i of this._branches[r]) e.push(...i.children), e.push(i);
    return this._children = e, e;
  }
  render(e) {
    if (this.type === "first" && !e.atomIdsSettings) return null;
    let r = ne(this.command, this.mode);
    if (r != null && r.render) return r.render(this, e);
    let i = new P({ parent: e }, this.style), n = this.createBox(i, { classes: this.parent ? "" : "ML__base" });
    return n ? (!this.subsupPlacement && (this.superscript || this.subscript) && (n = this.attachSupsub(i, { base: n })), n.wrap(i)) : null;
  }
  attachSupsub(e, r) {
    var f;
    let i = r.base, n = this.superscript, o = this.subscript;
    if (!n && !o) return i;
    let a = null, s = null, l = (f = r.isCharacterBox) != null ? f : this.isCharacterBox(), c = 0;
    if (n) {
      let y = new P({ parent: e, mathstyle: "superscript" });
      a = t3.createBox(y, n), l || (c = i.height - e.metrics.supDrop * y.scalingFactor);
    }
    let u = 0;
    if (o) {
      let y = new P({ parent: e, mathstyle: "subscript" });
      s = t3.createBox(y, o), l || (u = i.depth + e.metrics.subDrop * y.scalingFactor);
    }
    let d;
    e.isDisplayStyle ? d = e.metrics.sup1 : e.isCramped ? d = e.metrics.sup3 : d = e.metrics.sup2;
    let m = 0.5 / Pt / e.scalingFactor, p = null;
    if (s && a) {
      c = Math.max(c, d, a.depth + 0.25 * e.metrics.xHeight), u = Math.max(u, e.metrics.sub2);
      let y = e.metrics.defaultRuleThickness;
      if (c - a.depth - (s.height - u) < 4 * y) {
        u = 4 * y - (c - a.depth) + s.height;
        let b = 0.8 * e.metrics.xHeight - (c - a.depth);
        b > 0 && (c += b, u -= b);
      }
      let v = this.type === "extensible-symbol" && i.italic ? -i.italic : 0;
      p = new te({ individualShift: [{ box: s, shift: u, marginLeft: v }, { box: a, shift: -c }] });
    } else s && !a ? (u = Math.max(u, e.metrics.sub1, s.height - 0.8 * Xe), p = new te({ shift: u, children: [{ box: s, marginRight: m, marginLeft: this.isCharacterBox() ? -i.italic : 0 }] })) : !s && a && (c = Math.max(c, d, a.depth + 0.25 * Xe), p = new te({ shift: -c, children: [{ box: a, marginRight: m }] }));
    return new w([i, new w(p, { caret: this.caret, isSelected: this.isSelected, classes: "ML__msubsup" })], { type: r.type });
  }
  attachLimits(e, r) {
    let i = this.superscript ? t3.createBox(new P({ parent: e, mathstyle: "superscript" }, this.style), this.superscript) : null, n = this.subscript ? t3.createBox(new P({ parent: e, mathstyle: "subscript" }, this.style), this.subscript) : null;
    return !i && !n ? r.base.wrap(e) : N0(e, g(h({}, r), { above: i, below: n }));
  }
  bind(e, r) {
    if (!r || e.isPhantom || this.value === "​") return r;
    let i = this.parent;
    for (; i && !i.captureSelection; ) i = i.parent;
    return i != null && i.captureSelection || (this.id || (this.id = e.makeID()), r.atomID = this.id), r;
  }
  createBox(e, r) {
    var s, l, c, u;
    let i = (s = this.value) != null ? s : this.body, n = (l = r == null ? void 0 : r.boxType) != null ? l : Fa(this.type), o = (c = r == null ? void 0 : r.classes) != null ? c : "";
    this.mode === "text" && (o += " ML__text");
    let a = typeof i == "string" || i === void 0 ? new w(i != null ? i : null, { type: n, isSelected: this.isSelected, mode: this.mode, maxFontSize: e.scalingFactor, style: g(h({ variant: "normal" }, this.style), { fontSize: Math.max(1, e.size + e.mathstyle.sizeDelta) }), letterShapeStyle: e.letterShapeStyle, classes: o }) : (u = t3.createBox(e, i, { type: n, classes: o })) != null ? u : new w(null);
    return e.isTight && (a.isTight = true), (this.mode !== "math" || this.style.variant === "main") && (a.italic = 0), a.right = a.italic, this.bind(e, a), this.caret && !this.superscript && !this.subscript && (a.caret = this.caret), a;
  }
  isDigit() {
    var e;
    return this.type === "mord" && this.value ? /^[\d,\.]$/.test(this.value) : this.type === "group" && ((e = this.body) == null ? void 0 : e.length) === 2 ? this.body[0].type === "first" && this.body[1].value === "," : false;
  }
  asDigit() {
    var e;
    return this.type === "mord" && this.value && /^[\d,\.]$/.test(this.value) ? this.value : this.type === "group" && ((e = this.body) == null ? void 0 : e.length) === 2 && this.body[0].type === "first" && this.body[1].value === "," ? "." : "";
  }
};
function Rf(t38) {
  let e, r = [], i = [];
  for (let n of t38) {
    if (n.type === "first") {
      i.push(n);
      continue;
    }
    if (!e && !n.style) i.push(n);
    else {
      let o = n.style;
      e && o.color === e.color && o.backgroundColor === e.backgroundColor && o.fontSize === e.fontSize ? i.push(n) : (i.length > 0 && r.push(i), i = [n], e = o);
    }
  }
  return i.length > 0 && r.push(i), r;
}
function If(t38, e, r) {
  var s, l, c, u, d;
  if (!e || e.length === 0) return null;
  let i = new P({ parent: t38 }, r.style), n = !((s = i.atomIdsSettings) != null && s.groupNumbers), o = [];
  if (e.length === 1) {
    let m = e[0], p = m.render(i);
    p && (n && m.isSelected && p.selected(true), o = [p]);
  } else {
    let m = "", p = true;
    for (let f of e) {
      (l = i.atomIdsSettings) != null && l.groupNumbers && m && (p && f.isDigit() || !p && sc(f)) && (i.atomIdsSettings.overrideID = m);
      let y = f.render(i);
      i.atomIdsSettings && (i.atomIdsSettings.overrideID = void 0), y && ((c = i.atomIdsSettings) != null && c.groupNumbers && ((f.isDigit() || sc(f)) && (!m || p !== f.isDigit()) && (p = f.isDigit(), m = (u = f.id) != null ? u : ""), m && (!(f.isDigit() || sc(f)) || !f.hasEmptyBranch("superscript") || !f.hasEmptyBranch("subscript")) && (m = "")), n && f.isSelected && y.selected(true), o.push(y));
    }
  }
  if (o.length === 0) return null;
  let a = new w(o, g(h({ isTight: i.isTight }, r), { type: (d = r.type) != null ? d : "lift" }));
  return a.isSelected = o.every((m) => m.isSelected), a.wrap(i);
}
function sc(t38) {
  return t38.mode === "text";
}
function zf(t38) {
  return t38.map((e) => e === null ? "<null>" : Array.isArray(e) && e[0] instanceof x ? { atoms: e.map((r) => r.toJson()) } : typeof e == "object" && "group" in e ? { group: e.group.map((r) => r.toJson()) } : e);
}
var We = class t4 extends x {
  constructor(e, r, i) {
    super({ type: "text", command: e, mode: "text", displayContainsHighlight: true }), this.value = r, this.verbatimLatex = r, this.applyStyle(i);
  }
  static fromJson(e) {
    return new t4(e.command, e.value, e.style);
  }
  render(e) {
    let r = this.createBox(e);
    return this.caret && (r.caret = this.caret), r;
  }
  _serialize(e) {
    var r;
    return (r = this.verbatimLatex) != null ? r : fl("text", this.value.codePointAt(0));
  }
};
function q0(t38, e) {
  if (t38.direction === e.direction) {
    let r = t38.ranges.length;
    if (e.ranges.length === r) {
      let i = 0;
      for (; i < r && Nf(t38.ranges[i], e.ranges[i]) === "equal"; ) i++;
      return i === r ? "equal" : "different";
    }
  }
  return "different";
}
function Nf(t38, e) {
  return t38[0] === e[0] && t38[1] === e[1] ? "equal" : "different";
}
function de(t38) {
  let e = 1 / 0, r = -1 / 0;
  for (let i of t38.ranges) e = Math.min(e, i[0], i[1]), r = Math.max(r, i[0], i[1]);
  return [e, r];
}
function It(t38) {
  return typeof t38 == "number" && !Number.isNaN(t38);
}
function di(t38) {
  return Array.isArray(t38) && t38.length === 2;
}
function Qi(t38) {
  return t38 != null && typeof t38 == "object" && "ranges" in t38 && Array.isArray(t38.ranges);
}
function H0(t38, e) {
  let r = t38.at(e), i;
  if (r) {
    i = r.mode;
    let n = r.parent;
    for (; !i && n; ) n && (i = n.mode), n = n.parent;
  }
  return i;
}
function Ff(t38, e) {
  if (!e) return "";
  if (typeof e == "string") return e;
  if (!t38 || e.after === void 0) return e.value;
  let r = false, i = false, n = false, o = false, a = false, s = false, l = false, c = false, u = false, d = false, m = false, p = false, f = false, y = false, v = false, b = t38[0], k = 0;
  for (; b != null && b.type && /^(subsup|placeholder)$/.test(b.type); ) k += 1, b = t38[k];
  return r = !b || b.type === "first", b && (y = b.mode === "text", i = !y && b.type === "mord" && Wo.test(b.value), n = !y && b.type === "mord" && /\d+$/.test(b.value), o = !y && b.isFunction, a = b.type === "genfrac", s = b.type === "surd", l = b.type === "mbin", c = b.type === "mrel", u = b.type === "mop" || b.type === "operator" || b.type === "extensible-symbol", d = b.type === "mpunct" || b.type === "minner", m = b.type === "array", p = b.type === "mopen", f = b.type === "mclose" || b.type === "leftright", v = b.type === "space"), e.after.includes("nothing") && r || e.after.includes("letter") && i || e.after.includes("digit") && n || e.after.includes("function") && o || e.after.includes("frac") && a || e.after.includes("surd") && s || e.after.includes("binop") && l || e.after.includes("relop") && c || e.after.includes("operator") && u || e.after.includes("punct") && d || e.after.includes("array") && m || e.after.includes("openfence") && p || e.after.includes("closefence") && f || e.after.includes("text") && y || e.after.includes("space") && v ? e.value : "";
}
function eo(t38, e, r) {
  return r ? Ff(t38, r[e]) : "";
}
var Wa = { "&": "\\&", "%": "\\%", $: "\\$", "''": "^{\\doubleprime}", "'''": "^{\\prime\\prime\\prime}", "''''": "^{\\prime\\prime\\prime\\prime}", alpha: "\\alpha", delta: "\\delta", Delta: "\\Delta", pi: "\\pi", Pi: "\\Pi", theta: "\\theta", Theta: "\\Theta", ii: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\imaginaryI" }, jj: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\imaginaryJ" }, ee: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\exponentialE" }, nabla: "\\nabla", grad: "\\nabla", del: "\\partial", deg: { after: "digit+space", value: "\\degree" }, infty: "\\infty", "∞": "\\infty", oo: { after: "nothing+digit+frac+surd+binop+relop+punct+array+openfence+closefence+space", value: "\\infty" }, "∑": "\\sum", sum: "\\sum_{#?}^{#?}", int: "\\int_{#?}^{#?}", prod: "\\prod_{#?}^{#?}", sqrt: "\\sqrt{#?}", "∆": "\\differentialD", "∂": "\\differentialD", sin: "\\sin", cos: "\\cos", tan: "\\tan", arccos: "\\arccos", arcsin: "\\arcsin", arctan: "\\arctan", arctg: "\\operatorname{arctg}", arcsec: "\\operatorname{arcsec}", arccsc: "\\operatorname{arccsc}", arsinh: "\\operatorname{arsinh}", arccosh: "\\operatorname{arccosh}", arcosh: "\\operatorname{arcosh}", artanh: "\\operatorname{artanh}", arctanh: "\\operatorname{arctanh}", arcsech: "\\operatorname{arcsech}", arccsch: "\\operatorname{arccsch}", ch: "\\operatorname{ch}", cosec: "\\operatorname{cosec}", cosh: "\\cosh", cot: "\\cot", cotg: "\\operatorname{cotg}", coth: "\\coth", csc: "\\csc", ctg: "\\operatorname{ctg}", cth: "\\operatorname{cth}", sec: "\\sec", sech: "\\operatorname{sech}", sinh: "\\sinh", sh: "\\operatorname{sh}", tanh: "\\tanh", tg: "\\operatorname{tg}", th: "\\operatorname{th}", arg: "\\arg", lg: "\\lg", lb: "\\operatorname{lb}", log: "\\log_{#?}", ln: "\\ln", exp: "\\exp", lim: "\\lim_{#?\\to#?}", dx: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\differentialD x" }, dy: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\differentialD y" }, dt: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\differentialD t" }, AA: "\\forall", EE: "\\exists", "!EE": "\\nexists", "&&": "\\land", xin: { after: "nothing+text+relop+punct+openfence+space", value: "x \\in" }, sint: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\sin t" }, in: { after: "nothing+letter+closefence", value: "\\in" }, "!in": "\\notin", NN: "\\mathbb{N}", ZZ: "\\mathbb{Z}", QQ: "\\mathbb{Q}", RR: "\\mathbb{R}", CC: "\\mathbb{C}", xx: "\\times", "+-": "\\pm", "≠": "\\ne", "!=": "\\ne", "≥": "\\ge", ">=": "\\ge", "≤": "\\le", "<=": "\\le", "<<": "\\ll", ">>": "\\gg", "~~": "\\approx", "≈": "\\approx", "?=": "\\questeq", "÷": "\\div", "¬": "\\neg", ":=": "\\coloneq", "::": "\\Colon", "(:": "\\langle", ":)": "\\rangle", beta: "\\beta", chi: "\\chi", epsilon: "\\epsilon", varepsilon: "\\varepsilon", eta: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\eta" }, gamma: "\\gamma", Gamma: "\\Gamma", iota: "\\iota", kappa: "\\kappa", lambda: "\\lambda", Lambda: "\\Lambda", mu: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\mu" }, nu: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\nu" }, µ: "\\mu", phi: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\phi" }, Phi: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\Phi" }, varphi: "\\varphi", psi: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\psi" }, Psi: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\Psi" }, rho: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\rho" }, sigma: "\\sigma", Sigma: "\\Sigma", tau: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\tau" }, vartheta: "\\vartheta", upsilon: "\\upsilon", xi: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space", value: "\\xi" }, Xi: { after: "nothing+digit+function+frac+surd+binop+relop+punct+array+openfence+closefence+space+text", value: "\\Xi" }, zeta: "\\zeta", omega: "\\omega", Omega: "\\Omega", Ω: "\\omega", forall: "\\forall", exists: "\\exists", "!exists": "\\nexists", ":.": "\\therefore", liminf: "\\liminf_{#?}", limsup: "\\limsup_{#?}", argmin: "\\operatorname*{arg~min}_{#?}", argmax: "\\operatorname*{arg~max}_{#?}", det: "\\det", mod: "\\bmod{#?}", "(mod": "\\pmod{#?}", max: "\\max", min: "\\min", erf: "\\operatorname{erf}", erfc: "\\operatorname{erfc}", bessel: "\\operatorname{bessel}", mean: "\\operatorname{mean}", median: "\\operatorname{median}", fft: "\\operatorname{fft}", lcm: "\\operatorname{lcm}", gcd: "\\gcd", randomReal: "\\operatorname{randomReal}", randomInteger: "\\operatorname{randomInteger}", Re: "\\operatorname{Re}", Im: "\\operatorname{Im}", mm: { after: "nothing+digit+operator", value: "\\operatorname{mm}" }, cm: { after: "nothing+digit+operator", value: "\\operatorname{cm}" }, km: { after: "nothing+digit+operator", value: "\\operatorname{km}" }, kg: { after: "nothing+digit+operator", value: "\\operatorname{kg}" }, ft: { after: "nothing+digit+operator", value: "\\operatorname{ft}" }, inch: { after: "nothing+digit+operator", value: "\\operatorname{inch}" }, mi: { after: "nothing+digit+operator", value: "\\operatorname{mi}" }, "...": "\\ldots", "+...": "+\\cdots", "-...": "-\\cdots", "->...": "\\to\\cdots", "-->...": "\\longrightarrow\\cdots", "->": "\\to", "|->": "\\mapsto", "-->": "\\longrightarrow", "<--": "\\longleftarrow", "=>": "\\Rightarrow", "==>": "\\Longrightarrow", "<=>": "\\iff", "<->": "\\leftrightarrow", "(.)": "\\odot", "(+)": "\\oplus", "(/)": "\\oslash", "(*)": "\\otimes", "(-)": "\\ominus", "||": "\\Vert", "*": "\\cdot", "**": "\\star", "***": "\\ast", "//": "\\slash", "\\\\": "\\backslash", setminus: "\\backslash", "|><": "\\ltimes", "><|": "\\rtimes", "|><|": "\\bowtie", "-:": "\\div", divide: "\\div", "@": "\\circ", "^^": "\\wedge", "^^^": "\\bigwedge", vv: "\\vee", vvv: "\\bigvee", nn: "\\cap", nnn: "\\bigcap", uu: "\\cup", uuu: "\\bigcup", "-=": "\\equiv", "~=": "\\cong", lt: "<", "lt=": "\\leq", gt: ">", "gt=": "\\geq", "-<": "\\prec", "-lt": "\\prec", "-<=": "\\preceq", ">-=": "\\succeq", prop: "\\propto", diamond: "\\diamond", square: "\\square", iff: "\\iff", sub: "\\subset", sup: "\\supset", sube: "\\subseteq", supe: "\\supseteq", uarr: "\\uparrow", darr: "\\downarrow", rarr: "\\rightarrow", rArr: "\\Rightarrow", larr: "\\leftarrow", lArr: "\\Leftarrow", harr: "\\leftrightarrow", hArr: "\\Leftrightarrow", aleph: "\\aleph", and: "\\land", or: "\\lor", not: "\\neg", "_|_": "\\bot", TT: "\\top", "|--": "\\vdash", "|==": "\\models", "|__": "\\lfloor", "__|": "\\rfloor", "|~": "\\lceil", "~|": "\\rceil", ">->": "\\rightarrowtail", "->>": "\\twoheadrightarrow", ">->>": "\\twoheadrightarrowtail", times: "\\times", of: "\\circ", infinity: "\\infty", defint: "\\int_{#?}^{#?}", approaches: "\\to", ceil: "\\left\\lceil#?\\right\\rceil", floor: "\\left\\lfloor#?\\right\\rfloor", union: "\\cup", asterisk: "\\ast", frac: "\\frac{#?}{#?}", cbrt: "\\sqrt[3]{#?}", nthroot: "\\sqrt[#?]{#?}" };
function or(t38, e) {
  var i;
  let r = (i = e == null ? void 0 : e.format) != null ? i : "auto";
  return r === "auto" && ([r, t38] = $f(t38)), r === "ascii-math" ? (t38 = t38.replace(/\u2061/gu, ""), t38 = t38.replace(/\u3016/gu, "{"), t38 = t38.replace(/\u3017/gu, "}"), t38 = t38.replace(/([^\\])sinx/g, "$1\\sin x"), t38 = t38.replace(/([^\\])cosx/g, "$1\\cos x "), t38 = t38.replace(/\u2013/g, "-"), ["ascii-math", Ue(t38, { inlineShortcuts: e == null ? void 0 : e.inlineShortcuts })]) : ["latex", t38];
}
function Ue(t38, e) {
  var a;
  if (t38 = t38.trim(), !t38) return "";
  let r = (a = e.inlineShortcuts) != null ? a : Wa;
  if (t38.startsWith("^") || t38.startsWith("_")) {
    let { match: s, rest: l } = mi(t38.slice(1), { inlineShortcuts: r, noWrap: true });
    return `${t38[0]}{${s}}${Ue(l, e)}`;
  }
  let i = t38.match(/^(sqrt|\u221A)(.*)/);
  if (i) {
    let { match: s, rest: l } = mi(i[2], { inlineShortcuts: r, noWrap: true });
    return `\\sqrt{${s != null ? s : "\\placeholder{}"}}${Ue(l, e)}`;
  }
  if (i = t38.match(/^(\\cbrt|\u221B)(.*)/), i) {
    let { match: s, rest: l } = mi(i[2], { inlineShortcuts: r, noWrap: true });
    return `\\sqrt[3]{${s != null ? s : "\\placeholder{}"}}${Ue(l, e)}`;
  }
  if (i = t38.match(/^abs(.*)/), i) {
    let { match: s, rest: l } = mi(i[1], { inlineShortcuts: r, noWrap: true });
    return `\\left|${s != null ? s : "\\placeholder{}"}\\right|${Ue(l, e)}`;
  }
  if (i = t38.match(/^["”“](.*?)["”“](.*)/), i) return `\\text{${i[1]}}${Ue(i[2], e)}`;
  if (i = t38.match(/^([^a-zA-Z0-9\(\{\[\_\^\\\s"]+)(.*)/), i) return `${U0(i[1], r)}${Ue(i[2], e)}`;
  if (/^([fgh])[^a-zA-Z]/.test(t38)) {
    let { rest: s, match: l } = mi(t38.slice(1), { inlineShortcuts: r, noWrap: true }), c = "";
    return t38[1] === "(" ? c = `${t38[0]}\\left(${l}\\right)` : c = t38[0] + l, c + Ue(s, e);
  }
  if (i = t38.match(/^([a-zA-Z]+)(.*)/), i) return U0(i[1], r) + Ue(i[2], e);
  let { match: n, rest: o } = mi(t38, { inlineShortcuts: r, noWrap: true });
  if (n && o[0] === "/") {
    let s = mi(o.slice(1), { inlineShortcuts: r, noWrap: true });
    if (s.match) return `\\frac{${n}}{${s.match}}${Ue(s.rest, e)}`;
  } else return t38.startsWith("(") ? "\\left(" + n + "\\right)" + Ue(o, e) : n + Ue(o, e);
  return i = t38.match(/^(\s+)(.*)$/), i ? " " + Ue(i[2], e) : t38;
}
var W0 = { "[": "\\lbrack", "]": "\\rbrack", "{": "\\lbrace", "}": "\\rbrace" };
function mi(t38, e) {
  var a, s;
  let r = "";
  t38 = t38.trim();
  let i = t38, n = t38.charAt(0), o = { "(": ")", "{": "}", "[": "]" }[n];
  if (o) {
    let l = 1, c = 1;
    for (; c < t38.length && l > 0; ) t38[c] === n && l++, t38[c] === o && l--, c++;
    if (l === 0) {
      let u = Ue(t38.substring(1, c - 1), e);
      e.noWrap && n === "(" ? r = u : r = `\\left${(a = W0[n]) != null ? a : n}${u}\\right${(s = W0[o]) != null ? s : o}`, i = t38.slice(Math.max(0, c));
    } else r = t38.substring(1, c), i = "";
  } else {
    let l = t38.match(/^([a-zA-Z]+)/);
    if (l) {
      let c = eo(null, t38, e.inlineShortcuts);
      if (c) return c = c.replace("_{#?}", ""), c = c.replace("^{#?}", ""), { match: c, rest: t38.slice(c.length) };
    }
    if (l = t38.match(/^([a-zA-Z])/), l) return { match: l[1], rest: t38.slice(1) };
    if (l = t38.match(/^(-)?\d+(\.\d*)?/), l) return { match: l[0], rest: t38.slice(l[0].length) };
    /^\\(left|right)/.test(t38) || (l = t38.match(/^(\\[a-zA-Z]+)/), l && (i = t38.slice(l[1].length), r = l[1]));
  }
  return { match: r, rest: i };
}
function U0(t38, e) {
  let r = eo(null, t38, e);
  return r ? (r = r.replace("_{#?}", ""), r = r.replace("^{#?}", ""), r += " ") : r = t38, r;
}
var lc = [["\\[", "\\]"], ["\\(", "\\)"], ["$$", "$$"], ["$", "$"], ["\\begin{math}", "\\end{math}"], ["\\begin{displaymath}", "\\end{displaymath}"], ["\\begin{equation}", "\\end{equation}"], ["\\begin{equation*}", "\\end{equation*}"]];
function Ua(t38) {
  let e = t38.trim();
  for (let r of lc) if (e.startsWith(r[0]) && e.endsWith(r[1])) return [true, e.substring(r[0].length, e.length - r[1].length)];
  return [false, t38];
}
function $f(t38) {
  if (t38 = t38.trim(), t38.length <= 1) return ["latex", t38];
  let e;
  return [e, t38] = Ua(t38), e ? ["latex", t38] : t38.startsWith("`") && t38.endsWith("`") ? (t38 = t38.substring(1, t38.length - 1), ["ascii-math", t38]) : t38.includes("\\") ? ["latex", t38] : /\$.+\$/.test(t38) ? ["latex", `\\text{${t38}}`] : [void 0, t38];
}
var Vf = "$$", qf = "$$", G0 = (t38, e, r) => (lc.some((i) => e.startsWith(i[0]) && e.endsWith(i[1])) || (e = `${Vf} ${e} ${qf}`), e), en = class en2 {
  constructor(e) {
    en2._modes[e] = this;
  }
  static onPaste(e, r, i) {
    var o;
    if (!r.contentEditable && r.userSelect === "none") return r.model.announce("plonk"), false;
    if (typeof i == "string") {
      let a = new DataTransfer();
      a.setData("text/plain", i), i = a;
    }
    let n = new ClipboardEvent("paste", { clipboardData: i, cancelable: true });
    return (o = r.host) != null && o.dispatchEvent(n) ? en2._modes[e].onPaste(r, i) : false;
  }
  static copyToClipboard(e, r) {
    if (!e.contentEditable && e.userSelect === "none") {
      e.model.announce("plonk");
      return;
    }
    let i = e.model, n = i.selectionIsCollapsed ? [0, i.lastOffset] : de(i.selection), o = i.getValue(n, r);
    navigator.clipboard.writeText(o).then(() => {
    }, () => e.model.announce("plonk"));
  }
  static onCopy(e, r) {
    var a;
    if (!r.clipboardData) return;
    if (!e.contentEditable && e.userSelect === "none") {
      e.model.announce("plonk");
      return;
    }
    let i = e.model, n = i.selectionIsCollapsed ? [0, i.lastOffset] : de(i.selection), o = i.getAtoms(n);
    if (o.every((s) => s.mode === "text" || !s.mode)) r.clipboardData.setData("text/plain", o.filter((s) => s instanceof We).map((s) => s.value).join(""));
    else if (o.every((s) => s.mode === "latex")) r.clipboardData.setData("text/plain", i.getAtoms(n, { includeChildren: true }).map((s) => {
      var l;
      return (l = s.value) != null ? l : "";
    }).join(""));
    else {
      let s;
      o.length === 1 && o[0].verbatimLatex !== void 0 ? s = o[0].verbatimLatex : s = i.getValue(n, "latex-expanded"), r.clipboardData.setData("application/x-latex", s);
      try {
        r.clipboardData.setData("text/plain", e.options.onExport(e, s, n));
      } catch (l) {
      }
      if (o.length === 1) {
        let l = o[0];
        (l.type === "root" || l.type === "group") && (o = l.body.filter((c) => c.type !== "first"));
      }
      try {
        r.clipboardData.setData("application/json+mathlive", JSON.stringify(o.map((l) => l.toJson())));
      } catch (l) {
      }
      if ((a = window[/* @__PURE__ */ Symbol.for("io.cortexjs.compute-engine")]) != null && a.ComputeEngine) {
        let l = globalThis.MathfieldElement.computeEngine;
        if (l) try {
          let c = l.jsonSerializationOptions;
          l.jsonSerializationOptions = { metadata: ["latex"] };
          let u = l.parse(i.getValue(n, "latex-unstyled"));
          l.jsonSerializationOptions = c;
          let d = JSON.stringify(u.json);
          d && r.clipboardData.setData("application/json", d);
        } catch (c) {
        }
      }
    }
    r.preventDefault();
  }
  static insert(e, r, i = {}) {
    var o;
    let n = i.mode === "auto" ? e.mode : (o = i.mode) != null ? o : e.mode;
    return en2._modes[n].insert(e, r, i);
  }
  onPaste(e, r) {
    return false;
  }
  insert(e, r, i) {
    return false;
  }
};
en._modes = {};
var H = en;
var j0 = [{ key: "left", command: "moveToPreviousChar" }, { key: "right", command: "moveToNextChar" }, { key: "up", command: "moveUp" }, { key: "down", command: "moveDown" }, { key: "shift+[ArrowLeft]", command: "extendSelectionBackward" }, { key: "shift+[ArrowRight]", command: "extendSelectionForward" }, { key: "shift+[ArrowUp]", command: "extendSelectionUpward" }, { key: "shift+[ArrowDown]", command: "extendSelectionDownward" }, { key: "[Backspace]", command: "deleteBackward" }, { key: "[Delete]", command: "deleteForward" }, { key: "shift+[Backspace]", command: "deleteForward" }, { key: "alt+[Backspace]", command: "deletePreviousWord" }, { key: "alt+[Delete]", command: "deleteNextWord" }, { key: "ctrl+[Backspace]", command: "deleteToGroupStart" }, { key: "ctrl+[Delete]", command: "deleteToGroupEnd" }, { key: "ctrl+shift+[Backspace]", command: "deleteToGroupEnd" }, { key: "alt+[ArrowLeft]", command: "moveToPreviousWord" }, { key: "alt+[ArrowRight]", command: "moveToNextWord" }, { key: "shift+alt+[ArrowLeft]", command: "extendToPreviousWord" }, { key: "shift+alt+[ArrowRight]", command: "extendToNextWord" }, { key: "ctrl+[ArrowLeft]", command: "moveToGroupStart" }, { key: "ctrl+[ArrowRight]", command: "moveToGroupEnd" }, { key: "shift+ctrl+[ArrowLeft]", command: "extendToGroupStart" }, { key: "shift+ctrl+[ArrowRight]", command: "extendToGroupEnd" }, { key: "[Home]", command: "moveToMathfieldStart" }, { key: "cmd+[ArrowLeft]", command: "moveToMathfieldStart" }, { key: "shift+[Home]", command: "extendToMathFieldStart" }, { key: "shift+cmd+[ArrowLeft]", command: "extendToMathFieldStart" }, { key: "[End]", command: "moveToMathfieldEnd" }, { key: "cmd+[ArrowRight]", command: "moveToMathfieldEnd" }, { key: "shift+[End]", command: "extendToMathFieldEnd" }, { key: "shift+cmd+[ArrowRight]", command: "extendToMathFieldEnd" }, { key: "[Pageup]", command: "moveToGroupStart" }, { key: "[Pagedown]", command: "moveToGroupEnd" }, { key: "[Tab]", command: "moveToNextGroup" }, { key: "shift+[Tab]", command: "moveToPreviousGroup" }, { key: "[Escape]", ifMode: "math", command: ["switchMode", "latex"] }, { key: "[Escape]", ifMode: "text", command: ["switchMode", "latex"] }, { key: "[Escape]", ifMode: "latex", command: ["complete", "complete", { selectItem: "true" }] }, { key: "\\", ifMode: "math", command: ["switchMode", "latex", "", "\\"] }, { key: "[IntlBackslash]", ifMode: "math", command: ["switchMode", "latex", "", "\\"] }, { key: "[Tab]", ifMode: "latex", command: ["complete", "accept-suggestion"] }, { key: "[Return]", ifMode: "latex", command: ["complete", "accept-all"] }, { key: "[Enter]", ifMode: "latex", command: ["complete", "accept-all"] }, { key: "shift+[Escape]", ifMode: "latex", command: ["complete", "reject"] }, { key: "[ArrowDown]", ifMode: "latex", command: "nextSuggestion" }, { key: "[ArrowUp]", ifMode: "latex", command: "previousSuggestion" }, { key: "ctrl+a", ifPlatform: "!macos", command: "selectAll" }, { key: "cmd+a", command: "selectAll" }, { key: "[Cut]", command: "cutToClipboard" }, { key: "[Copy]", command: "copyToClipboard" }, { key: "[Paste]", command: "pasteFromClipboard" }, { key: "[Clear]", command: "deleteBackward" }, { key: "[Undo]", command: "undo" }, { key: "[Redo]", command: "redo" }, { key: "[EraseEof]", command: "deleteToGroupEnd" }, { key: "ctrl+x", ifPlatform: "ios", command: "cutToClipboard" }, { key: "cmd+x", ifPlatform: "ios", command: "cutToClipboard" }, { key: "ctrl+c", ifPlatform: "ios", command: "copyToClipboard" }, { key: "cmd+c", ifPlatform: "ios", command: "copyToClipboard" }, { key: "ctrl+v", ifPlatform: "ios", command: "pasteFromClipboard" }, { key: "cmd+v", ifPlatform: "ios", command: "pasteFromClipboard" }, { key: "ctrl+z", ifPlatform: "!macos", command: "undo" }, { key: "cmd+z", command: "undo" }, { key: "ctrl+y", ifPlatform: "!macos", command: "redo" }, { key: "shift+cmd+y", command: "redo" }, { key: "shift+ctrl+z", ifPlatform: "!macos", command: "redo" }, { key: "shift+cmd+z", command: "redo" }, { key: "ctrl+b", ifPlatform: "macos", command: "moveToPreviousChar" }, { key: "ctrl+f", ifPlatform: "macos", command: "moveToNextChar" }, { key: "ctrl+p", ifPlatform: "macos", command: "moveUp" }, { key: "ctrl+n", ifPlatform: "macos", command: "moveDown" }, { key: "ctrl+a", ifPlatform: "macos", command: "moveToMathfieldStart" }, { key: "ctrl+e", ifPlatform: "macos", command: "moveToMathfieldEnd" }, { key: "shift+ctrl+b", ifPlatform: "macos", command: "extendSelectionBackward" }, { key: "shift+ctrl+f", ifPlatform: "macos", command: "extendSelectionForward" }, { key: "shift+ctrl+p", ifPlatform: "macos", command: "extendSelectionUpward" }, { key: "shift+ctrl+n", ifPlatform: "macos", command: "extendSelectionDownward" }, { key: "shift+ctrl+a", ifPlatform: "macos", command: "extendToMathFieldStart" }, { key: "shift+ctrl+e", ifPlatform: "macos", command: "extendToMathFieldEnd" }, { key: "alt+ctrl+b", ifPlatform: "macos", command: "moveToPreviousWord" }, { key: "alt+ctrl+f", ifPlatform: "macos", command: "moveToNextWord" }, { key: "shift+alt+ctrl+b", ifPlatform: "macos", command: "extendToPreviousWord" }, { key: "shift+alt+ctrl+f", ifPlatform: "macos", command: "extendToNextWord" }, { key: "ctrl+h", ifPlatform: "macos", command: "deleteBackward" }, { key: "ctrl+d", ifPlatform: "macos", command: "deleteForward" }, { key: "ctrl+l", ifPlatform: "macos", command: "scrollIntoView" }, { key: "ctrl+[Digit2]", ifMode: "math", command: ["insert", "\\sqrt{#0}"] }, { key: "ctrl+[Digit5]", ifMode: "math", command: "moveToOpposite" }, { key: "ctrl+[Digit6]", ifMode: "math", command: "moveToSuperscript" }, { key: "ctrl+[Return]", ifMode: "math", command: "addRowAfter" }, { key: "ctrl+[Enter]", ifMode: "math", command: "addRowAfter" }, { key: "cmd+[Return]", ifMode: "math", command: "addRowAfter" }, { key: "cmd+[Enter]", ifMode: "math", command: "addRowAfter" }, { key: "alt+p", ifMode: "math", command: ["insert", "\\pi"] }, { key: "alt+v", ifMode: "math", command: ["insert", "\\sqrt{#0}"] }, { key: "alt+shift+v", ifMode: "math", command: ["insert", "\\sqrt[#0]{#1}"] }, { key: "alt+o", ifMode: "math", command: ["insert", "\\emptyset"] }, { key: "alt+d", ifMode: "math", command: ["insert", "\\differentialD"] }, { key: "shift+alt+o", ifMode: "math", command: ["insert", "\\varnothing"] }, { key: "shift+alt+d", ifMode: "math", command: ["insert", "\\partial"] }, { key: "alt+[Backslash]", ifMode: "math", command: ["insert", "\\backslash"] }, { key: "[NumpadDivide]", ifMode: "math", command: ["insert", "\\frac{#@}{#?}"] }, { key: "alt+[NumpadDivide]", ifMode: "math", command: ["insert", "\\frac{#?}{#@}"] }, { key: "shift+alt+k", command: "toggleKeystrokeCaption" }, { key: "alt+[Space]", command: "toggleContextMenu" }, { key: "alt+shift+[Space]", command: "toggleVirtualKeyboard" }, { key: "alt+ctrl+[ArrowUp]", command: ["speak", "all", { withHighlighting: false }] }, { key: "alt+ctrl+[ArrowDown]", command: ["speak", "selection", { withHighlighting: false }] }, { key: "shift+[Quote]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["switchMode", "text", "", ""] }, { key: "shift+[Quote]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "text", command: ["switchMode", "math", "", ""] }, { key: "shift+alt+[KeyT]", ifMode: "math", command: ["switchMode", "text"] }, { key: "shift+alt+[KeyT]", ifMode: "text", command: ["switchMode", "math"] }, { key: "/", ifMode: "math", command: ["insert", "\\frac{#@}{#?}"] }, { key: "alt+/", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", "/"] }, { key: "alt+shift+/", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", "/"] }, { key: "alt+[BracketLeft]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", "\\left\\lbrack #0 \\right\\rbrack"] }, { key: "ctrl+[Minus]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: "moveToSubscript" }, { key: "shift+alt+[BracketLeft]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", "\\left\\lbrace #0 \\right\\rbrace"] }, { key: "ctrl+;", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: "addRowAfter" }, { key: "cmd+;", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: "addRowAfter" }, { key: "shift+ctrl+;", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: "addRowBefore" }, { key: "shift+cmd+;", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: "addRowBefore" }, { key: "alt+[Tab]", ifMode: "math", command: "addColumnAfter" }, { key: "shift+alt+[Tab]", ifMode: "math", command: "addColumnBefore" }, { key: "alt+[Enter]", ifMode: "math", command: "addRowAfter" }, { key: "shift+alt+[Enter]", ifMode: "math", command: "addRowBefore" }, { key: "alt+[Return]", ifMode: "math", command: "addRowAfter" }, { key: "shift+alt+[Return]", ifMode: "math", command: "addRowBefore" }, { key: "shift+[Backspace]", ifMode: "math", command: "removeColumn" }, { key: "shift+[Delete]", ifMode: "math", command: "removeRow" }, { key: "shift+alt+[Backspace]", ifMode: "math", command: "removeRow" }, { key: "alt+[Digit5]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", "$\\infty"] }, { key: "alt+[Digit9]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", "("] }, { key: "alt+[Digit0]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", ")"] }, { key: "alt+|", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", "|"] }, { key: "shift+[Backquote]", ifLayout: ["apple.en-intl", "windows.en-intl", "linux.en"], ifMode: "math", command: ["insert", "\\~"] }, { key: "[Backquote]", ifLayout: ["windows.french", "linux.french"], ifMode: "math", command: ["insert", "^2"] }, { key: "[Backquote]", ifLayout: ["windows.german", "linux.german"], ifMode: "math", command: ["insert", "^"] }, { key: "[IntlBackslash]", ifLayout: ["apple.german"], ifMode: "math", command: ["insert", "^"] }], J0 = { "\\sqrt": ["alt+v", "ctrl+[Digit2]"], "\\pi": "alt+p", "\\infty": "alt+[Digit5]", "\\differentialD": "alt+d", "\\partial": "shift+alt+d", "\\frac": "Slash", "\\emptyset": "alt+o", "\\varnothing": "shift+alt+o", "\\~": "~" };
function Ye(t38) {
  var e;
  return ((e = t38.element) == null ? void 0 : e.mathfield) === t38;
}
function Hf(t38) {
  var e, r;
  return (r = (e = t38.querySelector(".ML__caret")) != null ? e : t38.querySelector(".ML__text-caret")) != null ? r : t38.querySelector(".ML__latex-caret");
}
function tn(t38) {
  let e = Hf(t38);
  if (!e) return null;
  let r = e.getBoundingClientRect();
  return { x: r.right, y: r.bottom, height: r.height };
}
function Wf(t38) {
  var r;
  if (!t38.parent) return "root";
  let e = (r = t38.parent.id) != null ? r : "";
  return e += typeof t38.parentBranch == "string" ? "-" + t38.parentBranch : `-${t38.parentBranch[0]}/${t38.parentBranch[0]}`, e;
}
function uc(t38, e, r) {
  if (!e) return null;
  let i = t38.field.getBoundingClientRect(), n = e.right - e.left, o = e.bottom - e.top, a = Math.ceil(e.left - i.left + t38.field.scrollLeft * r), s = Math.ceil(e.top - i.top);
  return { left: a, right: a + n, top: s, bottom: s + o };
}
function cc(t38) {
  let e = t38, r = e.getBoundingClientRect();
  for (; r.bottom === r.top && e.parentElement instanceof Element && (e = e.parentElement, r = e.getBoundingClientRect(), r.bottom === r.top); ) ;
  let i = getComputedStyle(e), n = parseInt(i.marginRight), o = r.right - r.left, a = r.bottom - r.top;
  if (o === 0 || !Number.isFinite(o)) {
    let l = parseFloat(i.width);
    Number.isFinite(l) && l > 0 ? o = l : e instanceof HTMLElement && e.offsetWidth > 0 && (o = e.offsetWidth);
  }
  if (a === 0 || !Number.isFinite(a)) {
    let l = parseFloat(i.height);
    Number.isFinite(l) && l > 0 ? a = l : e instanceof HTMLElement && e.offsetHeight > 0 && (a = e.offsetHeight);
  }
  let s = { top: r.top - 1, bottom: r.top - 1 + a, left: r.left, right: r.left + o - 1 + n };
  if (t38.children.length === 0 || t38.tagName.toUpperCase() === "SVG") return s;
  for (let l of t38.children) if (l.nodeType === 1 && "atomId" in l.dataset && !l.classList.contains("ML__pstrut")) {
    let c = cc(l);
    s.left = Math.min(s.left, c.left), s.right = Math.max(s.right, c.right), s.top = Math.min(s.top, c.top), s.bottom = Math.max(s.bottom, c.bottom);
  }
  return s;
}
function ar(t38, e) {
  var o, a;
  if (!e.id) return null;
  let r = (a = (o = t38.atomBoundsCache) == null ? void 0 : o.get(e.id)) != null ? a : null;
  if (r !== null) return r;
  let i = t38.field.querySelectorAll(`[data-atom-id="${e.id}"]`), n = Array.from(i);
  if (e.type === "prompt") {
    for (let s of n) if (s.classList.contains("ML__prompt-atom")) {
      let l = s.querySelector(".ML__prompt");
      if (l) {
        let c = cc(l);
        r ? (r.left = Math.min(r.left, c.left), r.right = Math.max(r.right, c.right), r.top = Math.min(r.top, c.top), r.bottom = Math.max(r.bottom, c.bottom)) : r = c;
      }
    }
  }
  for (let s of n) {
    let l = cc(s);
    r ? (r.left = Math.min(r.left, l.left), r.right = Math.max(r.right, l.right), r.top = Math.min(r.top, l.top), r.bottom = Math.max(r.bottom, l.bottom)) : r = l;
  }
  return t38.atomBoundsCache && (r ? t38.atomBoundsCache.set(e.id, r) : t38.atomBoundsCache.delete(e.id)), r != null ? r : null;
}
function X0(t38, e) {
  let [r, i] = e, n = null;
  for (let o = r; o <= i; o++) {
    let a = ar(t38, t38.model.at(o));
    a && (n ? (n.top = Math.min(n.top, a.top), n.bottom = Math.max(n.bottom, a.bottom), n.left = Math.min(n.left, a.left), n.right = Math.max(n.right, a.right)) : n = a);
  }
  return n != null ? n : { top: 0, bottom: 0, left: 0, right: 0 };
}
function Uf(t38, e, r) {
  let i = /* @__PURE__ */ new Map(), n = t38.field, o = n.offsetWidth, s = Math.floor(n.getBoundingClientRect().width) / o;
  s = isNaN(s) ? 1 : s;
  for (let l of t38.model.getAtoms(e, { includeChildren: true })) {
    if (r != null && r.excludeAtomsWithBackground && l.style.backgroundColor) continue;
    let c = uc(t38, ar(t38, l), s);
    if (c) {
      let u = Wf(l);
      if (i.has(u)) {
        let d = i.get(u);
        i.set(u, { left: Math.min(d.left, c.left), right: Math.max(d.right, c.right), top: Math.min(d.top, c.top), bottom: Math.max(d.bottom, c.bottom) });
      } else i.set(u, c);
    }
  }
  return [...i.values()];
}
function Ga(t38, e) {
  return t38.model.selection.ranges.reduce((r, i) => r.concat(...Uf(t38, i, e)), []);
}
function rn(t38, e) {
  return t38 === "*" || e === "none" ? true : e === "same-origin" ? !window.origin || t38 === window.origin : typeof e == "function" ? e(t38) : false;
}
function dc(t38) {
  let e = 0, r = 0, i = t38.offsetWidth, n = t38.offsetHeight;
  for (; t38 instanceof HTMLElement; ) e += t38.offsetTop, r += t38.offsetLeft, t38 = t38.offsetParent;
  return new DOMRect(r, e, i, n);
}
function ja(t38, e) {
  if (!t38) return;
  let r = t38.model.at(e);
  if (!r) return;
  let i = {}, n = ar(t38, r);
  n && (i.bounds = new DOMRect(n.left, n.top, n.right - n.left, n.bottom - n.top)), i.depth = r.treeDepth - 2, i.style = r.style;
  let o = r;
  for (; o; ) {
    if (o.command === "\\htmlData" && o.args && typeof o.args[0] == "string") {
      let a = o.args[0].split(",");
      for (let s of a) {
        let l = s.match(/([^=]+)=(.+$)/);
        if (l) {
          let c = l[1].trim().replace(/ /g, "-");
          c && (i.data || (i.data = {}), i.data[c] = l[2]);
        } else {
          let c = s.trim().replace(/ /g, "-");
          c && (i.data || (i.data = {}), i.data[c] = void 0);
        }
      }
    }
    (o.command === "\\htmlId" || o.command === "\\cssId") && !i.id && o.args && typeof o.args[0] == "string" && (i.id = o.args[0]), o = o.parent;
  }
  return (r.mode === "math" || r.mode === "text") && (i.latex = x.serialize([r], { defaultMode: "math" })), i;
}
function Z0(t38, e) {
  let r = t38.model.at(e);
  for (; r; ) {
    if (r.command === "\\href") {
      let i = r.args[0];
      if (typeof i == "string") return i;
    }
    r = r.parent;
  }
  return "";
}
var Y0 = `@keyframes ML__caret-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
:host {
  display: block;
}
.ML__container {
  display: inline-flex;
  flex-flow: row;
  justify-content: space-between;
  align-items: flex-end;
  min-height: 39px;
  /* Need some room for the virtual keyboard toggle */
  width: 100%;
  padding: 4px;
  box-sizing: border-box;
  /* This attribute is necessary to work around a Firefox issue where
  where clicking multiple times on the border leads to a focused mathfield that cannot be edited until focus is lost and regained (also fixes the multiple cursor issue on firefox that can occur with the same sequence of events).
  */
  pointer-events: auto;
  /* Prevent the browser from trying to interpret touch gestures in the field */
  /* "Disabling double-tap to zoom removes the need for browsers to
        delay the generation of click events when the user taps the screen." */
  touch-action: none;
  --_caret-color: var(--caret-color, hsl(var(--_hue), 40%, 49%));
  --_selection-color: var(--selection-color, #000);
  --_selection-background-color: var(--selection-background-color, hsl(var(--_hue), 70%, 85%));
  --_text-highlight-background-color: var(--highlight-text, hsla(var(--_hue), 40%, 50%, 0.1));
  --_contains-highlight-background-color: var(--contains-highlight-background-color, hsl(var(--_hue), 40%, 95%));
  --_smart-fence-color: var(--smart-fence-color, currentColor);
  --_smart-fence-opacity: var(--smart-fence-opacity, 0.5);
  --_contains-highlight-color: var(--contains-highlight-color, var(--_caret-color));
  --_latex-color: var(--latex-color, hsl(var(--_hue), 80%, 40%));
  --_correct-color: var(--correct-color, #10a000);
  --_incorrect-color: var(--incorrect-color, #a01b00);
  --_composition-background-color: var(--composition-background-color, #fff1c2);
  --_composition-text-color: var(--composition-text-color, black);
  --_composition-underline-color: var(--composition-underline-color, transparent);
  --_tooltip-border: var(--tooltip-border, 1px solid transparent);
  --_tooltip-border-radius: var(--tooltip-border-radius, 8px);
  --_tooltip-background-color: var(--tooltip-background-color, #616161);
  --_tooltip-color: var(--tooltip-color, #fff);
  --_tooltip-box-shadow: var(--tooltip-box-shadow, 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2));
}
@media (prefers-color-scheme: dark) {
  .ML__container {
    --_contains-highlight-color: var(--contains-highlight-color, hsl(var(--_hue), 85%, 75%));
    --_caret-color: var(--caret-color, hsl(var(--_hue), 65%, 55%));
    --_selection-color: var(--selection-color, #fff);
    --_selection-background-color: var(--selection-background-color, hsl(var(--_hue), 65%, 55%));
    --_text-highlight-background-color: var(--text-highlight-background-color, hsla(var(--_hue), 40%, 50%, 0.6));
    --_contains-highlight-background-color: var(--contains-highlight-background-color, hsl(var(--_hue), 5%, 34%));
    --_latex-color: var(--primary, hsl(var(--_hue), 40%, 50%));
    --_composition-background-color: #69571c;
    --_composition-text-color: white;
    --_placeholder-color: hsl(var(--_hue), 60%, 69%);
    --_smart-fence-color: var(--smart-fence-color, #fff);
    --_smart-fence-opacity: var(--smart-fence-opacity, 0.7);
  }
}
@media (forced-colors: active) {
  .ML__container {
    --_caret-color: white;
    --_selection-color: white;
    --_smart-fence-color: white;
    --_latex-color: white;
    --_correct-color: white;
    --_incorrect-color: white;
    --_composition-text-color: white;
  }
}
@media (hover: none) and (pointer: coarse) {
  :host(:not(:focus)) .ML__container {
    pointer-events: none;
  }
}
/* This is the actual field content (formula) */
.ML__content {
  display: flex;
  align-items: center;
  align-self: center;
  position: relative;
  overflow: hidden;
  padding: 2px 3px 2px 1px;
  width: 100%;
  /* Encourage the browser to use the GPU to render the field.
     Weirdly, this is required for prompts to be rendered correctly. 
   */
  isolation: isolate;
  text-shadow: var(--text-shadow);
}
.ML__content .ML__latex {
  text-shadow: var(--text-shadow);
}
.ML__content .ML__sqrt-line {
  box-shadow: var(--text-shadow);
}
.ML__content .ML__frac-line {
  box-shadow: var(--text-shadow);
}
/* Container for the virtual keyboard toggle and menu toggle buttons */
.ML__toggles {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0;
  align-self: flex-start;
}
/* Vertical layout modifier */
.ML__toggles--vertical {
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.ML__toggles--vertical .ML__virtual-keyboard-toggle,
.ML__toggles--vertical .ML__menu-toggle {
  margin-right: 0;
}
.ML__virtual-keyboard-toggle,
.ML__menu-toggle {
  box-sizing: border-box;
  display: flex;
  align-self: center;
  align-items: center;
  flex-shrink: 0;
  flex-direction: column;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  margin-right: 4px;
  cursor: pointer;
  /* Avoid some weird blinking with :hover */
  border-radius: 8px;
  border: 1px solid transparent;
  transition: background 0.2s cubic-bezier(0.64, 0.09, 0.08, 1);
  color: hsl(var(--_hue), 40%, 50%);
  fill: currentColor;
  background: transparent;
}
.ML__virtual-keyboard-toggle:hover,
.ML__menu-toggle:hover {
  background: hsla(0, 0%, 70%, 0.3);
  color: #333;
  fill: currentColor;
}
.ML__virtual-keyboard-toggle > span,
.ML__menu-toggle > span {
  display: flex;
  align-self: center;
  align-items: center;
}
@media (pointer: coarse) {
  .ML__virtual-keyboard-toggle,
  .ML__menu-toggle {
    min-width: 60px;
    min-height: 60px;
  }
}
/* The invisible element used to capture keyboard events. We're just trying
 really hard to make sure it doesn't show. */
.ML__keyboard-sink {
  display: inline-block;
  resize: none;
  outline: none;
  border: none;
  pointer-events: none;
  /* Need these for Microsoft Edge */
  position: fixed;
  clip: rect(0 0 0 0);
  /* Need this to prevent iOS Safari from auto-zooming */
  font-size: 1em;
  font-family: KaTeX_Main;
  line-height: 0.5;
  /* On Chromium, if this is 0, no keyboard events are received */
  /* Preferred over clip */
  clip-path: inset(50%);
}
[part='placeholder'] {
  color: var(--neutral-400);
}
.ML__composition {
  background: var(--_composition-background-color);
  color: var(--_composition-text-color);
  text-decoration: underline var(--_composition-underline-color);
}
.ML__caret {
  display: inline-block;
}
.ML__caret::after {
  content: '';
  visibility: hidden;
  width: 0;
  display: inline-block;
  height: 0.76em;
  --_caret-width: clamp(2px, 0.08em, 10px);
  border: none;
  border-radius: calc(var(--_caret-width) / 2);
  border-right: var(--_caret-width) solid var(--_caret-color);
  margin-right: calc(-1 * var(--_caret-width));
  position: relative;
  left: -0.045em;
  bottom: -0.05em;
  animation: ML__caret-blink 1.05s step-end forwards infinite;
}
.ML__text-caret::after {
  content: '';
  visibility: hidden;
  width: 0;
  display: inline-block;
  height: 0.76em;
  --_caret-width: clamp(2px, 0.08em, 10px);
  border: none;
  border-radius: calc(var(--_caret-width) / 2);
  border-right: var(--_caret-width) solid var(--_caret-color);
  margin-right: calc(-1 * var(--_caret-width));
  position: relative;
  left: -0.045em;
  bottom: -0.05em;
  animation: ML__caret-blink 1.05s step-end forwards infinite;
}
.ML__latex-caret::after {
  content: '';
  visibility: hidden;
  --_caret-width: clamp(2px, 0.08em, 10px);
  border: none;
  border-radius: calc(var(--_caret-width) / 2);
  border-right: var(--_caret-width) solid var(--_latex-color);
  margin-right: calc(-1 * var(--_caret-width));
  position: relative;
  left: -0.019em;
  animation: ML__caret-blink 1.05s step-end forwards infinite;
}
.ML__focused .ML__latex-caret::after,
.ML__focused .ML__text-caret::after,
.ML__focused .ML__caret::after {
  visibility: visible;
}
.ML__focused .ML__text {
  background: var(--_text-highlight-background-color);
}
/* When using smartFence, the anticipated closing fence is displayed
with this style */
.ML__smart-fence__close {
  opacity: var(--_smart-fence-opacity);
  color: var(--_smart-fence-color);
}
.ML__focused .ML__selected,
.ML__focused .ML__selected .ML__contains-caret,
.ML__focused .ML__selected .ML__smart-fence__close,
.ML__focused .ML__selected .ML__placeholder {
  color: var(--_selection-color);
  opacity: 1;
}
.ML__empty-line-anchor::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 20px;
  border-radius: 2px;
  background: transparent;
  opacity: 0;
  pointer-events: none;
}
.ML__focused .ML__empty-line-anchor.ML__selected::after {
  background: var(--_selection-background-color);
  opacity: 1;
}
.ML__selection {
  box-sizing: border-box;
  background: transparent;
}
:host(:focus) .ML__selection {
  background: var(--_selection-background-color) !important;
}
.ML__contains-caret.ML__close,
.ML__contains-caret.ML__open,
.ML__contains-caret > .ML__close,
.ML__contains-caret > .ML__open,
.ML__contains-caret .ML__sqrt-sign,
.ML__contains-caret .ML__sqrt-line {
  color: var(--_contains-highlight-color);
}
.ML__contains-highlight {
  box-sizing: border-box;
  background: transparent;
}
.ML__focused .ML__contains-highlight {
  background: var(--_contains-highlight-background-color);
}
.ML__raw-latex {
  font-family: 'Berkeley Mono', 'IBM Plex Mono', 'Source Code Pro', Consolas, 'Roboto Mono', Menlo, 'Bitstream Vera Sans Mono', 'DejaVu Sans Mono', Monaco, Courier, monospace;
  font-weight: 400;
  font-size: 0.8em;
  letter-spacing: -0.05em;
  color: var(--_latex-color);
}
.ML__suggestion {
  color: var(--neutral-500);
}
.ML__virtual-keyboard-toggle.is-visible.is-pressed:hover {
  background: hsl(var(--_hue), 25%, 35%);
  color: #fafafa;
  fill: currentColor;
}
.ML__virtual-keyboard-toggle.is-pressed,
.ML__virtual-keyboard-toggle.is-active:hover,
.ML__virtual-keyboard-toggle.is-active {
  background: hsl(var(--_hue), 25%, 35%);
  color: #fafafa;
  fill: currentColor;
}
/* Add an attribute 'data-tooltip' to automatically show a
   tooltip over a element on hover.
*/
[data-tooltip] {
  position: relative;
}
[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  display: block;
  z-index: 2;
  pointer-events: none;
  right: auto;
  top: calc(-100% - 4px);
  width: max-content;
  max-width: 200px;
  padding: 8px 8px;
  border-radius: 4px;
  background: #616161;
  color: #fff;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
  text-align: center;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 13px;
  /* Phone */
  opacity: 0;
  transform: scale(0.5);
}
@media only screen and (max-width: 767px) {
  [data-tooltip]::after {
    padding: 8px 16px;
    font-size: 16px;
  }
}
menu [data-tooltip]::after {
  left: 100%;
  top: 0%;
}
menu .ML__base {
  cursor: default;
}
/** Don't display if we're tracking, i.e. have the pointer down */
.tracking [data-tooltip]:hover::after {
  /* Use visibility, not display. Display will remove the after from the DOM, and the override below will not work */
  visibility: hidden;
}
/** But do display if tracking and inside a menu */
.tracking menu li[data-tooltip]:hover::after,
[data-tooltip]:hover::after {
  visibility: visible;
  opacity: 1;
  transform: scale(1);
  transition-property: opacity, scale;
  transition-duration: 0.15s;
  transition-delay: 1s;
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
.ML__prompt {
  border-radius: 2px;
}
.ML__editablePromptBox {
  outline: 1px solid #acacac;
  border-radius: 2px;
  z-index: -1;
}
.ML__focused .ML__focusedPromptBox {
  outline: highlight auto 1px;
}
.ML__lockedPromptBox {
  background-color: rgba(142, 142, 141, 0.4);
  z-index: -1;
}
.ML__correctPromptBox {
  outline: 1px solid var(--_correct-color);
  box-shadow: 0 0 5px var(--_correct-color);
}
.ML__incorrectPromptBox {
  outline: 1px solid var(--_incorrect-color);
  box-shadow: 0 0 5px var(--_incorrect-color);
}
.variant-submenu {
  display: flex;
  flex-direction: column;
  padding: 8px;
}
.variant-submenu [part='menu-item'].ML__xl {
  font-size: 2rem;
  text-align: center;
  margin: 0;
}
.ML__center-menu .label {
  text-align: center;
}
.insert-matrix-submenu {
  /* Grid doesn't work on Safari */
  --_menu-item-size: 25px;
  width: calc(5 * var(--_menu-item-size));
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  align-content: center;
  justify-content: center;
}
.insert-matrix-submenu [part='menu-item'] {
  width: var(--_menu-item-size);
  height: var(--_menu-item-size);
  font-size: 21px;
  border: none;
  border-radius: 0;
  line-height: 21px;
  text-align: center;
  padding: 0;
  margin: 0;
}
.border-submenu [part='menu-item'] {
  font-size: 2rem;
  line-height: 1.2;
  text-align: center;
}
.swatches-submenu {
  --_swatch-size: 2rem;
  --_columns: 4;
  display: flex;
  flex-flow: wrap;
  padding: 8px;
  max-width: calc(var(--_columns) * (var(--_swatch-size) + 18px) + 16px);
  box-sizing: border-box;
}
.menu-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: fit-content;
  height: fit-content;
  margin: 2px;
  padding: 0;
  background: var(--neutral-200);
}
.menu-swatch > .label {
  padding: 0;
  margin: 0;
  line-height: 0;
}
.menu-swatch > .label > span {
  display: inline-block;
  margin: 6px;
  min-width: var(--_swatch-size);
  min-height: var(--_swatch-size);
  border-radius: 50%;
}
.menu-swatch.active {
  background: var(--neutral-100);
  z-index: 1;
  scale: 1.4;
}
.menu-swatch.active > .label > span {
  border-radius: 2px;
}
.menu-swatch .ui-checkmark,
.menu-swatch .ui-mixedmark {
  position: absolute;
  margin: 0;
  padding: 0;
  color: white;
}
.menu-swatch.dark-contrast .ui-checkmark,
.menu-swatch.dark-contrast .ui-mixedmark {
  color: #000;
}
.ML__insert-template {
  font-size: 1em;
}
.ML__insert-label {
  opacity: 0.5;
  margin-left: 2ex;
}
`;
var Q0 = `.ML__container {
  min-height: auto !important;
  --_hue: var(--hue, 212);
  --_placeholder-color: var(--placeholder-color, hsl(var(--_hue), 40%, 49%));
  --_placeholder-opacity: var(--placeholder-opacity, 0.4);
  --_text-font-family: var(--text-font-family, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif);
}
.ML__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
.ML__is-inline {
  display: inline-block;
}
.ML__base {
  visibility: inherit;
  display: inline-block;
  position: relative;
  cursor: text;
  padding: 0;
  margin: 0;
  box-sizing: content-box;
  border: 0;
  outline: 0;
  vertical-align: baseline;
  font-weight: inherit;
  font-family: inherit;
  font-style: inherit;
  text-decoration: none;
  width: min-content;
}
.ML__strut,
.ML__strut--bottom {
  display: inline-block;
  min-height: 0.5em;
}
.ML__small-delim {
  font-family: KaTeX_Main;
}
/* Text mode */
.ML__text {
  font-family: var(--_text-font-family);
  white-space: pre;
}
/* Use cmr for 'math upright' */
.ML__cmr {
  font-family: KaTeX_Main;
  font-style: normal;
}
.ML__mathit {
  font-family: KaTeX_Math;
  /* The KaTeX_Math font is italic by default, so the font-style below is only 
     useful when a fallback font is used
  */
  font-style: italic;
}
.ML__mathbf {
  font-family: KaTeX_Main;
  font-weight: bold;
}
/* Lowercase greek symbols should stick to math font when \\mathbf is applied 
   to match TeX idiosyncratic behavior */
.lcGreek.ML__mathbf {
  font-family: KaTeX_Math;
}
.ML__mathbfit {
  font-family: KaTeX_Math;
  font-weight: bold;
  font-style: italic;
}
.ML__ams {
  font-family: KaTeX_AMS;
}
/* Blackboard */
.ML__bb {
  font-family: KaTeX_AMS;
}
.ML__cal {
  font-family: KaTeX_Caligraphic;
}
.ML__frak {
  font-family: KaTeX_Fraktur;
}
.ML__tt {
  font-family: KaTeX_Typewriter;
}
.ML__script {
  font-family: KaTeX_Script;
}
.ML__sans {
  font-family: KaTeX_SansSerif;
}
.ML__series_ul {
  font-weight: 100;
}
.ML__series_el {
  font-weight: 100;
}
.ML__series_l {
  font-weight: 200;
}
.ML__series_sl {
  font-weight: 300;
}
.ML__series_sb {
  font-weight: 500;
}
.ML__bold {
  font-weight: 700;
}
.ML__series_eb {
  font-weight: 800;
}
.ML__series_ub {
  font-weight: 900;
}
.ML__series_uc {
  font-stretch: ultra-condensed;
}
.ML__series_ec {
  font-stretch: extra-condensed;
}
.ML__series_c {
  font-stretch: condensed;
}
.ML__series_sc {
  font-stretch: semi-condensed;
}
.ML__series_sx {
  font-stretch: semi-expanded;
}
.ML__series_x {
  font-stretch: expanded;
}
.ML__series_ex {
  font-stretch: extra-expanded;
}
.ML__series_ux {
  font-stretch: ultra-expanded;
}
.ML__it {
  font-style: italic;
}
.ML__shape_ol {
  -webkit-text-stroke: 1px black;
  text-stroke: 1px black;
  color: transparent;
}
.ML__shape_sc {
  font-variant: small-caps;
}
.ML__shape_sl {
  font-style: oblique;
}
/* First level emphasis */
.ML__emph {
  color: #bc2612;
}
/* Second level emphasis */
.ML__emph .ML__emph {
  color: #0c7f99;
}
.ML__highlight {
  color: #007cb2;
  background: #edd1b0;
}
.ML__center {
  text-align: center;
}
.ML__left {
  text-align: left;
}
.ML__right {
  text-align: right;
}
.ML__label_padding {
  padding: 0 0.5em;
}
.ML__frac-line {
  width: 100%;
  min-height: 1px;
}
.ML__frac-line:after {
  content: '';
  display: block;
  /* A custom bar thickness, for example from \`\\genfrac\`, sets the
       \`--frac-line-thickness\` variable on the element. The bar then fills
       the element, so \`--frac-line-margin\` is set to 0. */
  margin-top: var(--frac-line-margin, max(-1px, -0.04em));
  min-height: var(--frac-line-thickness, max(1px, 0.04em));
  /* Ensure the line is visible when printing even if "turn off background images" is on*/
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  /* There's a bug since Chrome 62 where 
      sub-pixel border lines don't draw at some zoom 
      levels (110%, 90%). 
      Setting the min-height used to work around it, but that workaround
      broke in Chrome 84 or so.
      Setting the background (and the min-height) seems to work for now.
      */
  background: currentColor;
  box-sizing: content-box;
  /* Vuetify sets the box-sizing to inherit 
            causes the fraction line to not draw at all sizes (see #26) */
  /* On some versions of Firefox on Windows, the line fails to 
            draw at some zoom levels, but setting the transform triggers
            the hardware accelerated path, which works */
  transform: translate(0, 0);
  forced-color-adjust: preserve-parent-color;
}
@media (forced-colors: active) {
  .ML__frac-line {
    min-height: 0px;
  }
}
.ML__sqrt {
  display: inline-block;
}
.ML__sqrt-sign {
  display: inline-block;
  position: relative;
}
.ML__sqrt-line {
  display: inline-block;
  height: max(1px, 0.04em);
  width: 100%;
}
.ML__sqrt-line:before {
  content: '';
  display: block;
  margin-top: min(-1px, -0.04em);
  min-height: max(1px, 0.04em);
  /* Ensure the line is visible when printing even if "turn off background images" is on*/
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  background: currentColor;
  /* On some versions of Firefox on Windows, the line fails to 
            draw at some zoom levels, but setting the transform triggers
            the hardware accelerated path, which works */
  transform: translate(0, 0);
  forced-color-adjust: preserve-parent-color;
}
@media (forced-colors: active) {
  .ML__sqrt-line:after {
    background: white !important;
  }
}
.ML__sqrt-line:after {
  border-bottom-width: 1px;
  content: ' ';
  display: block;
  margin-top: -0.1em;
}
.ML__sqrt-index {
  margin-left: 0.27777778em;
  margin-right: -0.55555556em;
}
.ML__delim-size1 {
  font-family: KaTeX_Size1;
}
.ML__delim-size2 {
  font-family: KaTeX_Size2;
}
.ML__delim-size3 {
  font-family: KaTeX_Size3;
}
.ML__delim-size4 {
  font-family: KaTeX_Size4;
}
.ML__delim-mult .delim-size1 > span {
  font-family: KaTeX_Size1;
}
.ML__delim-mult .delim-size4 > span {
  font-family: KaTeX_Size4;
}
.ML__accent-body {
  font-family: KaTeX_Main;
}
.ML__accent-combining-char {
  position: relative;
  left: 0.24em;
}
/** The markup for a LaTeX formula, either in an editable mathfield or 
    in a static display.
*/
.ML__latex {
  display: inline-block;
  direction: ltr;
  text-align: left;
  text-indent: 0;
  text-rendering: auto;
  font-family: inherit;
  font-style: normal;
  font-size-adjust: none;
  font-stretch: normal;
  font-variant-caps: normal;
  letter-spacing: normal;
  line-height: 1.2;
  word-wrap: normal;
  word-spacing: normal;
  white-space: nowrap;
  text-shadow: none;
  -webkit-user-select: none;
  user-select: none;
  width: min-content;
  forced-color-adjust: preserve-parent-color;
}
.ML__latex .style-wrap {
  position: relative;
}
.ML__latex .ML__mfrac {
  display: inline-block;
}
.ML__latex .ML__left-right {
  display: inline-block;
}
.ML__latex .ML__vlist-t {
  display: inline-table;
  table-layout: fixed;
  border-collapse: collapse;
}
.ML__latex .ML__vlist-r {
  display: table-row;
}
.ML__latex .ML__vlist {
  display: table-cell;
  vertical-align: bottom;
  position: relative;
}
.ML__latex .ML__vlist > span {
  display: block;
  height: 0;
  position: relative;
}
.ML__latex .ML__vlist > span > span {
  display: inline-block;
}
.ML__latex .ML__vlist > span > .ML__pstrut {
  overflow: hidden;
  width: 0;
}
.ML__latex .ML__vlist-t2 {
  margin-right: -2px;
}
.ML__latex .ML__vlist-s {
  display: table-cell;
  vertical-align: bottom;
  font-size: 1px;
  width: 2px;
  min-width: 2px;
}
.ML__latex .ML__msubsup {
  text-align: left;
}
.ML__latex .ML__negativethinspace {
  display: inline-block;
  margin-left: -0.16667em;
  height: 0.71em;
}
.ML__latex .ML__thinspace {
  display: inline-block;
  width: 0.16667em;
  height: 0.71em;
}
.ML__latex .ML__mediumspace {
  display: inline-block;
  width: 0.22222em;
  height: 0.71em;
}
.ML__latex .ML__thickspace {
  display: inline-block;
  width: 0.27778em;
  height: 0.71em;
}
.ML__latex .ML__enspace {
  display: inline-block;
  width: 0.5em;
  height: 0.71em;
}
.ML__latex .ML__quad {
  display: inline-block;
  width: 1em;
  height: 0.71em;
}
.ML__latex .ML__qquad {
  display: inline-block;
  width: 2em;
  height: 0.71em;
}
.ML__latex .ML__llap,
.ML__latex .ML__rlap {
  width: 0;
  position: relative;
  display: inline-block;
}
.ML__latex .ML__llap > .ML__inner,
.ML__latex .ML__rlap > .ML__inner {
  position: absolute;
}
.ML__latex .ML__llap > .ML__fix,
.ML__latex .ML__rlap > .ML__fix {
  display: inline-block;
}
.ML__latex .ML__llap > .ML__inner {
  right: 0;
}
.ML__latex .ML__rlap > .ML__inner {
  left: 0;
}
.ML__latex .ML__rule {
  display: inline-block;
  border: solid 0;
  position: relative;
  box-sizing: border-box;
}
.ML__latex .overline .overline-line,
.ML__latex .underline .underline-line {
  width: 100%;
}
.ML__latex .overline .overline-line:before,
.ML__latex .underline .underline-line:before {
  content: '';
  border-bottom-style: solid;
  border-bottom-width: max(1px, 0.04em);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  display: block;
}
.ML__latex .overline .overline-line:after,
.ML__latex .underline .underline-line:after {
  border-bottom-style: solid;
  border-bottom-width: max(1px, 0.04em);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  content: '';
  display: block;
  margin-top: -1px;
}
.ML__latex .ML__stretchy {
  display: block;
  position: absolute;
  width: 100%;
  left: 0;
  overflow: hidden;
}
.ML__latex .ML__stretchy:before,
.ML__latex .ML__stretchy:after {
  content: '';
}
.ML__latex .ML__stretchy svg {
  display: block;
  position: absolute;
  width: 100%;
  height: inherit;
  fill: currentColor;
  stroke: currentColor;
  fill-rule: nonzero;
  fill-opacity: 1;
  stroke-width: 1;
  stroke-linecap: butt;
  stroke-linejoin: miter;
  stroke-miterlimit: 4;
  stroke-dasharray: none;
  stroke-dashoffset: 0;
  stroke-opacity: 1;
}
.ML__latex .slice-1-of-2 {
  display: inline-flex;
  position: absolute;
  left: 0;
  width: 50.2%;
  overflow: hidden;
}
.ML__latex .slice-2-of-2 {
  display: inline-flex;
  position: absolute;
  right: 0;
  width: 50.2%;
  overflow: hidden;
}
.ML__latex .slice-1-of-3 {
  display: inline-flex;
  position: absolute;
  left: 0;
  width: 25.1%;
  overflow: hidden;
}
.ML__latex .slice-2-of-3 {
  display: inline-flex;
  position: absolute;
  left: 25%;
  width: 50%;
  overflow: hidden;
}
.ML__latex .slice-3-of-3 {
  display: inline-flex;
  position: absolute;
  right: 0;
  width: 25.1%;
  overflow: hidden;
}
.ML__latex .slice-1-of-1 {
  display: inline-flex;
  position: absolute;
  width: 100%;
  left: 0;
  overflow: hidden;
}
.ML__latex .ML__nulldelimiter {
  display: inline-block;
}
.ML__latex .ML__op-group {
  display: inline-block;
}
.ML__latex .ML__op-symbol {
  position: relative;
}
.ML__latex .ML__op-symbol.ML__small-op {
  font-family: KaTeX_Size1;
}
.ML__latex .ML__op-symbol.ML__large-op {
  font-family: KaTeX_Size2;
}
.ML__latex:has(.ML__center_environment),
.ML__latex:has(.ML__multiline_environment),
.ML__latex:has(.ML__align_environment),
.ML__latex:has(.ML__eqnarray_environment),
.ML__latex:has(.ML__gather_environment) {
  width: 100%;
}
.ML__latex .ML__multiline_environment {
  display: inline-flex;
  width: 100%;
}
.ML__latex .ML__center_environment {
  display: inline-flex;
  width: 100%;
  justify-content: center;
}
.ML__latex .ML__align_environment,
.ML__latex .ML__eqnarray_environment,
.ML__latex .ML__gather_environment {
  display: inline-block;
}
.ML__latex .ML__mtable .ML__vertical-separator {
  display: inline-block;
  min-width: 1px;
  box-sizing: border-box;
}
.ML__latex .ML__mtable .ML__arraycolsep {
  display: inline-block;
}
.ML__latex .ML__mtable .col-align-m > .ML__vlist-t {
  text-align: center;
}
.ML__latex .ML__mtable .col-align-c > .ML__vlist-t {
  text-align: center;
}
.ML__latex .ML__mtable .col-align-l > .ML__vlist-t {
  text-align: left;
}
.ML__latex .ML__mtable .col-align-r > .ML__vlist-t {
  text-align: right;
}
[data-href] {
  cursor: pointer;
}
.ML__error {
  display: inline-block;
  background-image: radial-gradient(ellipse at center, hsl(341, 100%, 40%), rgba(0, 0, 0, 0) 70%);
  background-color: hsla(341, 100%, 40%, 0.1);
  background-repeat: repeat-x;
  background-size: 3px 3px;
  padding-bottom: 3px;
  background-position: 0 100%;
}
.ML__error > .ML__error {
  background: transparent;
  padding: 0;
}
.ML__placeholder {
  color: var(--_placeholder-color);
  opacity: var(--_placeholder-opacity);
  padding-left: 0.4ex;
  padding-right: 0.4ex;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}
.ML__notation {
  position: absolute;
  box-sizing: border-box;
  line-height: 0;
}
/* This class is used to implement the \`\\mathtip\` and \`\\texttip\` commands
   For UI elements, see \`[data-ML__tooltip]\`
*/
.ML__tooltip-container {
  position: relative;
  transform: scale(0);
}
.ML__tooltip-container .ML__tooltip-content {
  position: fixed;
  display: inline-table;
  visibility: hidden;
  z-index: 2;
  width: max-content;
  max-width: 400px;
  padding: 12px 12px;
  border: var(--_tooltip-border);
  border-radius: var(--_tooltip-border-radius);
  background: var(--_tooltip-background-color);
  --_selection-color: var(--_tooltip-color);
  color: var(--_tooltip-color);
  box-shadow: var(--_tooltip-box-shadow);
  opacity: 0;
  transition: opacity 0.15s cubic-bezier(0.4, 0, 1, 1);
}
.ML__tooltip-container .ML__tooltip-content .ML__text {
  white-space: normal;
}
.ML__tooltip-container .ML__tooltip-content .ML__base {
  display: contents;
}
.ML__tooltip-container:hover .ML__tooltip-content {
  visibility: visible;
  opacity: 1;
  font-size: 0.75em;
  transform: scale(1) translate(0, 3em);
}
.ML__bg {
  background-color: transparent !important;
}
.ML__bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-color);
  z-index: -1;
  box-sizing: border-box;
}
`;
var eh = `#mathlive-environment-popover.is-visible {
  visibility: visible;
}
#mathlive-environment-popover {
  --_environment-panel-height: var(--environment-panel-height, 70px);
  --_accent-color: var(--accent-color, #aaa);
  --_background: var(--environment-panel-background, #fff);
  --_button-background: var(--environment-panel-button-background, white);
  --_button-background-hover: var(--environment-panel-button-background-hover, #f5f5f7);
  --_button-background-active: var(--environment-panel-button-background-active, #f5f5f7);
  --_button-text: var(--environment-panel-button-text, #e3e4e8);
  position: absolute;
  width: calc(var(--_environment-panel-height) * 2);
  height: var(--_environment-panel-height);
  border-radius: 4px;
  border: 1.5px solid var(--_accent-color);
  background-color: var(--_background);
  box-shadow: 0 0 30px 0 var(--environment-shadow, rgba(0, 0, 0, 0.4));
  pointer-events: all;
  visibility: hidden;
}
#mathlive-environment-popover .MLEP__array-buttons {
  height: calc(var(--_environment-panel-height) * 5/4);
  width: calc(var(--_environment-panel-height) * 5/4);
  margin-left: calc(0px - var(--_environment-panel-height) * 0.16);
  margin-top: calc(0px - var(--_environment-panel-height) * 0.19);
}
#mathlive-environment-popover .MLEP__array-buttons .font {
  fill: white;
}
#mathlive-environment-popover .MLEP__array-buttons circle {
  fill: #7f7f7f;
  transition: fill 300ms;
}
#mathlive-environment-popover .MLEP__array-buttons .MLEP__array-insert-background {
  fill-opacity: 1;
  fill: var(--_background);
  stroke: var(--_accent-color);
  stroke-width: 3px;
}
#mathlive-environment-popover .MLEP__array-buttons line {
  stroke: var(--_accent-color);
  stroke-opacity: 0;
  stroke-width: 40;
  pointer-events: none;
  transition: stroke-opacity 300ms;
  stroke-linecap: round;
}
#mathlive-environment-popover .MLEP__array-buttons g[data-command]:hover circle {
  fill: var(--_accent-color);
}
#mathlive-environment-popover .MLEP__array-buttons g[data-command]:hover line {
  stroke-opacity: 1;
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls {
  height: 100%;
  width: 50%;
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options {
  width: var(--_environment-panel-height);
  height: var(--_environment-panel-height);
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-around;
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg {
  pointer-events: all;
  margin-top: 2px;
  width: calc(var(--_environment-panel-height) / 3 * 28 / 24);
  height: calc(var(--_environment-panel-height) / 3 - 2px);
  border-radius: calc(var(--_environment-panel-height) / 25);
  background-color: var(--_button-background);
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg:hover {
  background-color: var(--_button-background-hover);
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg path,
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg line {
  stroke: var(--_button-text);
  stroke-width: 2;
  stroke-linecap: round;
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg rect,
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg path {
  fill-opacity: 0;
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg.active {
  pointer-events: none;
  background-color: var(--_button-background-active);
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg.active path,
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg.active line {
  stroke: var(--_accent-color);
}
#mathlive-environment-popover .MLEP__environment-delimiter-controls .MLEP__array-delimiter-options svg.active circle {
  fill: var(--_accent-color);
}
`;
var th = `/* The element that display info while in latex mode */
#mathlive-suggestion-popover {
  --_suggestion-zindex: var(--suggestion-zindex, 100);
  background-color: rgba(97, 97, 97);
  color: #fff;
  text-align: center;
  border-radius: 8px;
  position: fixed;
  z-index: var(--_suggestion-zindex);
  display: none;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
}
#mathlive-suggestion-popover.top-tip::after {
  content: '';
  position: absolute;
  top: -15px;
  left: calc(50% - 15px);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 15px solid rgba(97, 97, 97);
  font-size: 1rem;
}
#mathlive-suggestion-popover.bottom-tip::after {
  content: '';
  position: absolute;
  bottom: -15px;
  left: calc(50% - 15px);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 15px solid rgba(97, 97, 97);
  font-size: 1rem;
}
#mathlive-suggestion-popover.is-animated {
  transition: all 0.2s cubic-bezier(0.64, 0.09, 0.08, 1);
  animation: ML__fade-in cubic-bezier(0, 0, 0.2, 1) 0.15s;
}
#mathlive-suggestion-popover.is-visible {
  display: flex;
}
@keyframes ML__fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
/* The wrapper class for the entire content of the popover panel */
#mathlive-suggestion-popover ul {
  display: flex;
  flex-flow: column;
  list-style: none;
  margin: 0;
  padding: 0;
  align-items: flex-start;
  max-height: 400px;
  overflow-y: auto;
}
#mathlive-suggestion-popover li {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 8px;
  padding: 8px;
  width: calc(100% - 16px - 16px);
  column-gap: 1em;
  border-radius: 8px;
  cursor: pointer;
  /* Since the content can be clicked on, provide feedback on hover */
}
#mathlive-suggestion-popover li a {
  color: #5ea6fd;
  padding-top: 0.3em;
  margin-top: 0.4em;
  display: block;
}
#mathlive-suggestion-popover li a:hover {
  color: #5ea6fd;
  text-decoration: underline;
}
#mathlive-suggestion-popover li:hover,
#mathlive-suggestion-popover li.is-pressed,
#mathlive-suggestion-popover li.is-active {
  background: rgba(255, 255, 255, 0.1);
}
/* The command inside a popover (inside a #mathlive-suggestion-popover) */
.ML__popover__command {
  font-size: 1.6rem;
  font-family: KaTeX_Main;
}
.ML__popover__current {
  background: #5ea6fd;
  color: #fff;
}
.ML__popover__latex {
  font-family: 'IBM Plex Mono', 'Source Code Pro', Consolas, 'Roboto Mono', Menlo, 'Bitstream Vera Sans Mono', 'DejaVu Sans Mono', Monaco, Courier, monospace;
  align-self: center;
}
/* The keyboard shortcuts for a symbol as displayed in the popover */
.ML__popover__keybinding {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 0.8em;
  opacity: 0.7;
}
/* Style for the character that joins the modifiers of a keyboard shortcut 
(usually a "+" sign)*/
.ML__shortcut-join {
  opacity: 0.5;
}
`;
var rh = `/* The element that displays the keys as the user type them */
#mathlive-keystroke-caption-panel {
  visibility: hidden;
  /*min-width: 160px;*/
  /*background-color: rgba(97, 97, 200, .95);*/
  background: var(--secondary, hsl(var(--_hue), 19%, 26%));
  border-color: var(--secondary-border, hsl(0, 0%, 91%));
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  text-align: center;
  border-radius: 6px;
  padding: 16px;
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  --keystroke: white;
  --on-keystroke: #555;
  --keystroke-border: #f7f7f7;
}
@media (prefers-color-scheme: dark) {
  body:not([theme='light']) #mathlive-keystroke-caption-panel {
    --keystroke: hsl(var(--_hue), 50%, 30%);
    --on-keystroke: hsl(0, 0%, 98%);
    --keystroke-border: hsl(var(--_hue), 50%, 25%);
  }
}
body[theme='dark'] #mathlive-keystroke-caption-panel {
  --keystroke: hsl(var(--_hue), 50%, 30%);
  --on-keystroke: hsl(0, 0%, 98%);
  --keystroke-border: hsl(var(--_hue), 50%, 25%);
}
#mathlive-keystroke-caption-panel > span {
  min-width: 14px;
  /*height: 8px;*/
  margin: 0 8px 0 0;
  padding: 4px;
  background-color: var(--keystroke);
  color: var(--on-keystroke);
  fill: currentColor;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 1em;
  border-radius: 6px;
  border: 2px solid var(--keystroke-border);
  /*box-shadow: 0 7px 14px rgba(0,0,0,0.25), 0 5px 5px rgba(0,0,0,0.22);*/
}
`;
var ih = `.ML__keyboard {
  --_keyboard-height: 0;
  --_keyboard-zindex: var(--keyboard-zindex, 105);
  --_accent-color: var(--keyboard-accent-color, #0c75d8);
  --_background: var(--keyboard-background, #cacfd7);
  --_border: var(--keyboard-border, #ddd);
  --_padding-horizontal: var(--keyboard-padding-horizontal, 0px);
  --_padding-top: var(--keyboard-padding-top, 5px);
  --_padding-bottom: var(--keyboard-padding-bottom, 0px);
  --_row-padding-left: var(--keyboard-row-padding-left, 0px);
  --_row-padding-right: var(--keyboard-row-padding-right, 0px);
  --_toolbar-text: var(--keyboard-toolbar-text, #2c2e2f);
  --_toolbar-text-active: var(--keyboard-toolbar-text-active, var(--_accent-color));
  --_toolbar-background: var(--keyboard-toolbar-background, transparent);
  --_toolbar-background-hover: var(--keyboard-toolbar-background-hover, #eee);
  --_toolbar-background-selected: var(--keyboard-toolbar-background-selected, transparent);
  --_toolbar-font-size: var(--keyboard-toolbar-font-size, '135%');
  --_horizontal-rule: var(--keyboard-horizontal-rule, 1px solid #fff);
  --_keycap-background: var(--keycap-background, #f0f0f0);
  --_keycap-background-hover: var(--keycap-background-hover, #f5f5f7);
  --_keycap-background-active: var(--keycap-background-active, var(--_accent-color));
  --_keycap-background-pressed: var(--keycap-background-pressed, var(--_accent-color));
  --_keycap-border: var(--keycap-border, #e5e6e9);
  --_keycap-border-bottom: var(--keycap-border-bottom, #8d8f92);
  --_keycap-text: var(--keycap-text, #000);
  --_keycap-text-active: var(--keycap-text-active, #fff);
  --_keycap-text-hover: var(--keycap-text-hover, var(--_keycap-text));
  --_keycap-text-pressed: var(--keycap-text-pressed, #fff);
  --_keycap-shift-text: var(--keycap-shift-text, var(--_accent-color));
  --_keycap-primary-background: var(--keycap-primary-background, var(--_accent-color));
  --_keycap-primary-text: var(--keycap-primary-text, #ddd);
  --_keycap-primary-background-hover: var(--keycap-primary-background-hover, #0d80f2);
  --_keycap-secondary-background: var(--keycap-secondary-background, #a0a9b8);
  --_keycap-secondary-background-hover: var(--keycap-secondary-background-hover, #7d8795);
  --_keycap-secondary-text: var(--keycap-secondary-text, #060707);
  --_keycap-secondary-border: var(--keycap-secondary-border, #c5c9d0);
  --_keycap-secondary-border-bottom: var(--keycap-secondary-border-bottom, #989da6);
  --_keycap-height: var(--keycap-height, 60px);
  /* Keycap width (incl. margin) */
  --_keycap-max-width: var(--keycap-max-width, 100px);
  --_keycap-gap: var(--keycap-gap, 8px);
  --_keycap-font-size: var(--keycap-font-size, clamp(16px, 4cqw, 24px));
  --_keycap-small-font-size: var(--keycap-small-font-size, calc(var(--keycap-font-size) * 0.8));
  --_keycap-extra-small-font-size: var(--keycap-extra-small-font-size, calc(var(--keycap-font-size) / 1.42));
  --_variant-panel-background: var(--variant-panel-background, #f0f0f0);
  --_variant-keycap-text: var(--variant-keycap-text, var(--_keycap-text));
  --_variant-keycap-text-active: var(--variant-keycap-text-active, var(--_keycap-text-active));
  --_variant-keycap-background-active: var(--variant-keycap-background-active, var(--_accent-color));
  --_variant-keycap-length: var(--variant-keycap-length, 70px);
  --_variant-keycap-font-size: var(--variant-keycap-font-size, 30px);
  --_variant-keycap-aside-font-size: var(--variant-keycap-aside-font-size, 12px);
  --_keycap-shift-font-size: var(--keycap-shift-font-size, 16px);
  --_keycap-shift-color: var(--keycap-shift-color, var(--_accent-color));
  --_box-placeholder-color: var(--box-placeholder-color, var(--_accent-color));
  --_box-placeholder-pressed-color: var(--box-placeholder-pressed-color, var(--keycap-text-pressed));
  --_keycap-glyph-size: var(--keycap-glyph-size, 20px);
  --_keycap-glyph-size-lg: var(--keycap-glyph-size-lg, 24px);
  --_keycap-glyph-size-xl: var(--keycap-glyph-size-xl, 50px);
}
.is-math-mode .MLK__rows .if-text-mode,
.is-text-mode .MLK__rows .if-math-mode {
  display: none;
}
.if-can-undo,
.if-can-redo,
.if-can-copy,
.if-can-cut,
.if-can-paste {
  opacity: 0.4;
  pointer-events: none;
}
.can-undo .if-can-undo,
.can-redo .if-can-redo,
.can-copy .if-can-copy,
.can-cut .if-can-cut,
.can-paste .if-can-paste {
  opacity: 1;
  pointer-events: all;
}
body > .ML__keyboard {
  position: fixed;
  --_padding-bottom: calc(var(--keyboard-padding-bottom, 0px) + env(safe-area-inset-bottom, 0));
}
body > .ML__keyboard.is-visible > .MLK__backdrop {
  box-shadow: 0 -5px 6px rgba(0, 0, 0, 0.08);
  border-top: 1px solid var(--_border);
}
body > .ML__keyboard.backdrop-is-transparent.is-visible > .MLK__backdrop {
  box-shadow: none;
  border: none;
}
body > .ML__keyboard.is-visible.animate > .MLK__backdrop {
  transition: 0.28s cubic-bezier(0, 0, 0.2, 1);
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
.ML__keyboard {
  position: relative;
  overflow: hidden;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: var(--_keyboard-zindex);
  box-sizing: border-box;
  outline: none;
  border: none;
  margin: 0;
  padding: 0;
  line-height: 1;
  overflow-wrap: unset;
  text-align: left;
  vertical-align: baseline;
  cursor: auto;
  white-space: pre;
  box-shadow: none;
  opacity: 1;
  transform: none;
  pointer-events: none;
}
.ML__keyboard :where(div) {
  box-sizing: border-box;
  outline: none;
  border: none;
  margin: 0;
  padding: 0;
  line-height: 1;
  overflow-wrap: unset;
  text-align: left;
  vertical-align: baseline;
  cursor: auto;
  white-space: pre;
  box-shadow: none;
  transform: none;
}
.MLK__backdrop {
  position: absolute;
  bottom: calc(-1 * var(--_keyboard-height));
  width: 100%;
  height: var(--_keyboard-height);
  box-sizing: border-box;
  padding-top: var(--_padding-top);
  padding-bottom: var(--_padding-bottom);
  padding-left: var(--_padding-horizontal);
  padding-right: var(--_padding-horizontal);
  opacity: 0;
  visibility: hidden;
  transform: translate(0, 0);
  background: var(--_background);
}
.backdrop-is-transparent .MLK__backdrop {
  background: transparent;
}
/* If a custom layout has a custom container/backdrop
  (backdrop-is-transparent), make sure to let pointer event go through. */
.backdrop-is-transparent .MLK__plate {
  background: transparent;
  pointer-events: none;
}
/* If a custom layout has a custom container/backdrop, make sure to 
   allow pointer events on it. */
.backdrop-is-transparent .MLK__layer > div > div {
  pointer-events: all;
}
.ML__keyboard.is-visible > .MLK__backdrop {
  transform: translate(0, calc(-1 * var(--_keyboard-height)));
  opacity: 1;
  visibility: visible;
}
.caps-lock-indicator {
  display: none;
  width: 8px;
  height: 8px;
  background: #0cbc0c;
  box-shadow: inset 0 0 4px 0 #13ca13, 0 0 4px 0 #a9ef48;
  border-radius: 8px;
  right: 8px;
  top: 8px;
  position: absolute;
}
.ML__keyboard.is-caps-lock .caps-lock-indicator {
  display: block;
}
.ML__keyboard.is-caps-lock .shift {
  background: var(--_keycap-background-active);
  color: var(--_keycap-text-active);
}
.MLK__plate {
  position: absolute;
  top: var(--_padding-top);
  left: var(--_padding-horizontal);
  width: calc(100% - 2 * var(--_padding-horizontal));
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  container-type: inline-size;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: all;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  /* Size of toolbar labels */
  font-weight: 400;
  text-shadow: none;
}
.ML__box-placeholder {
  color: var(--_box-placeholder-color);
}
.MLK__tex {
  font-family: KaTeX_Main, KaTeX_Math, 'Cambria Math', 'Asana Math', OpenSymbol, Symbola, STIX, Times, serif !important;
}
.MLK__tex-math {
  font-family: KaTeX_Math, KaTeX_Main, 'Cambria Math', 'Asana Math', OpenSymbol, Symbola, STIX, Times, serif !important;
  font-style: italic;
}
.MLK__layer {
  display: none;
  outline: none;
}
.MLK__layer.is-visible {
  display: flex;
  flex-flow: column;
}
/* Keyboard layouts are made or rows of keys... */
.MLK__rows {
  --_keycap-width: var(--keycap-width, min(var(--_keycap-max-width), 10cqw));
  display: flex;
  flex-flow: column;
  align-items: center;
  border-collapse: separate;
  clear: both;
  border: 0;
  margin: 0;
  margin-bottom: var(--_keycap-gap);
  gap: var(--_keycap-gap);
  /* If the styling include, e.g., some shadows, they will be
  cut off by the overflow. In that case, set the padding to 
  compensate. */
  padding-left: var(--_row-padding-left);
  padding-right: var(--_row-padding-right);
  overflow: visible;
  touch-action: none;
}
.MLK__rows > .MLK__row {
  display: flex;
  flex-flow: row;
  justify-content: center;
  width: 100%;
  gap: var(--_keycap-gap);
  margin: 0;
  padding: 0;
  /* For the alignment of the text on some modifiers (e.g. shift) */
  /* Extra spacing between two adjacent keys */
}
.MLK__rows > .MLK__row .tex {
  font-family: KaTeX_Math, KaTeX_Main, 'Cambria Math', 'Asana Math', OpenSymbol, Symbola, STIX, Times, serif !important;
}
.MLK__rows > .MLK__row .tex-math {
  font-family: KaTeX_Math, 'Cambria Math', 'Asana Math', OpenSymbol, Symbola, STIX, Times, serif !important;
}
.MLK__rows > .MLK__row .big-op {
  font-size: calc(1.25 * var(--_keycap-font-size));
}
.MLK__rows > .MLK__row .small {
  font-size: var(--_keycap-small-font-size);
}
.MLK__rows > .MLK__row .bottom {
  justify-content: flex-end;
}
.MLK__rows > .MLK__row .left {
  align-items: flex-start;
  padding-left: 12px;
}
.MLK__rows > .MLK__row .right {
  align-items: flex-end;
  padding-right: 12px;
}
.MLK__rows > .MLK__row .w0 {
  width: 0;
}
.MLK__rows > .MLK__row .w5 {
  width: calc(0.5 * var(--_keycap-width) - var(--_keycap-gap));
}
.MLK__rows > .MLK__row .w15 {
  width: calc(1.5 * var(--_keycap-width) - var(--_keycap-gap));
}
.MLK__rows > .MLK__row .w20 {
  width: calc(2 * var(--_keycap-width) - var(--_keycap-gap));
}
.MLK__rows > .MLK__row .w40 {
  width: calc(4 * var(--_keycap-width) - var(--_keycap-gap));
}
.MLK__rows > .MLK__row .w50 {
  width: calc(5 * var(--_keycap-width) - var(--_keycap-gap));
}
.MLK__rows > .MLK__row .MLK__keycap.w50 {
  font-size: 80%;
  padding-top: 10px;
  font-weight: 100;
}
.MLK__rows > .MLK__row .separator {
  background: transparent;
  border: none;
  pointer-events: none;
}
.MLK__rows > .MLK__row .horizontal-rule {
  height: 6px;
  margin-top: 3px;
  margin-bottom: 0;
  width: 100%;
  border-radius: 0;
  border-top: var(--_horizontal-rule);
}
.MLK__rows > .MLK__row .ghost {
  background: var(--_toolbar-background);
  border: none;
  color: var(--_toolbar-text);
}
.MLK__rows > .MLK__row .ghost:hover {
  background: var(--_toolbar-background-hover);
}
.MLK__rows > .MLK__row .bigfnbutton {
  font-size: var(--_keycap-extra-small-font-size);
}
.MLK__rows > .MLK__row .shift,
.MLK__rows > .MLK__row .action {
  color: var(--_keycap-secondary-text);
  background: var(--_keycap-secondary-background);
  border-color: var(--_keycap-secondary-border);
  border-bottom-color: var(--_keycap-secondary-border-bottom);
  line-height: 0.8;
  font-size: min(1rem, var(--_keycap-small-font-size));
  font-weight: 600;
  padding: 8px 12px 8px 12px;
}
.MLK__rows > .MLK__row .shift:hover,
.MLK__rows > .MLK__row .action:hover {
  background: var(--_keycap-secondary-background-hover);
}
.MLK__rows > .MLK__row .action.primary {
  background: var(--_keycap-primary-background);
  color: var(--_keycap-primary-text);
}
.MLK__rows > .MLK__row .action.primary:hover {
  background: var(--_keycap-primary-background-hover);
  color: var(--_keycap-primary-text);
}
.MLK__rows > .MLK__row .shift.selected,
.MLK__rows > .MLK__row .action.selected {
  color: var(--_toolbar-text-active);
}
.MLK__rows > .MLK__row .shift.selected.is-pressed,
.MLK__rows > .MLK__row .action.selected.is-pressed,
.MLK__rows > .MLK__row .shift.selected.is-active,
.MLK__rows > .MLK__row .action.selected.is-active {
  color: white;
}
.MLK__rows > .MLK__row .warning {
  background: #cd0030;
  color: white;
}
.MLK__rows > .MLK__row .warning svg.svg-glyph {
  width: var(--_keycap-glyph-size-lg);
  height: var(--_keycap-glyph-size-lg);
  min-height: var(--_keycap-glyph-size-lg);
}
/** A regular keycap
 * Use the :where() pseudo-class to give it a very low specifity, 
 * so that it can be overriden by custom style.
 */
:where(.MLK__rows > .MLK__row div) {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: space-evenly;
  width: calc(var(--_keycap-width) - var(--_keycap-gap));
  height: var(--_keycap-height);
  box-sizing: border-box;
  padding: 0;
  vertical-align: top;
  text-align: center;
  float: left;
  color: var(--_keycap-text);
  fill: currentColor;
  font-size: var(--_keycap-font-size);
  background: var(--_keycap-background);
  border: 1px solid var(--_keycap-border);
  border-bottom-color: var(--_keycap-border-bottom);
  border-radius: 6px;
  cursor: pointer;
  touch-action: none;
  /* Keys with a variants panel */
  position: relative;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
:where(.MLK__rows > .MLK__row div):hover {
  overflow: visible;
  background: var(--_keycap-background-hover);
  color: var(--_keycap-text-hover);
}
:where(.MLK__rows > .MLK__row div) .ML__latex {
  pointer-events: none;
  touch-action: none;
}
:where(.MLK__rows > .MLK__row div) svg.svg-glyph {
  margin: 8px 0;
  width: var(--_keycap-glyph-size);
  height: var(--_keycap-glyph-size);
  min-height: var(--_keycap-glyph-size);
}
:where(.MLK__rows > .MLK__row div) svg.svg-glyph-lg {
  margin: 8px 0;
  width: var(--_keycap-glyph-size-lg);
  height: var(--_keycap-glyph-size-lg);
  min-height: var(--_keycap-glyph-size-lg);
}
:where(.MLK__rows > .MLK__row div).MLK__tex-math {
  font-size: 25px;
}
:where(.MLK__rows > .MLK__row div).is-pressed {
  background: var(--_keycap-background-pressed);
  color: var(--_keycap-text-pressed);
  --_box-placeholder-color: var(--_box-placeholder-pressed-color);
}
:where(.MLK__rows > .MLK__row div).MLK__keycap.is-active,
:where(.MLK__rows > .MLK__row div).action.is-active,
:where(.MLK__rows > .MLK__row div).MLK__keycap.is-pressed,
:where(.MLK__rows > .MLK__row div).action.is-pressed {
  z-index: calc(var(--_keyboard-zindex) - 5);
}
:where(.MLK__rows > .MLK__row div).MLK__keycap.is-active aside,
:where(.MLK__rows > .MLK__row div).action.is-active aside,
:where(.MLK__rows > .MLK__row div).MLK__keycap.is-pressed aside,
:where(.MLK__rows > .MLK__row div).action.is-pressed aside {
  display: none;
}
:where(.MLK__rows > .MLK__row div).MLK__keycap.is-active .MLK__shift,
:where(.MLK__rows > .MLK__row div).action.is-active .MLK__shift,
:where(.MLK__rows > .MLK__row div).MLK__keycap.is-pressed .MLK__shift,
:where(.MLK__rows > .MLK__row div).action.is-pressed .MLK__shift {
  display: none;
}
:where(.MLK__rows > .MLK__row div).shift.is-pressed,
:where(.MLK__rows > .MLK__row div).MLK__keycap.is-pressed,
:where(.MLK__rows > .MLK__row div).action.is-pressed {
  background: var(--_keycap-background-pressed);
  color: var(--_keycap-text-pressed);
}
:where(.MLK__rows > .MLK__row div).shift.is-active,
:where(.MLK__rows > .MLK__row div).MLK__keycap.is-active,
:where(.MLK__rows > .MLK__row div).action.is-active {
  background: var(--_keycap-background-active);
  color: var(--_keycap-text-active);
  --_box-placeholder-color: var(--_box-placeholder-pressed-color);
}
:where(.MLK__rows > .MLK__row div) small {
  color: var(--_keycap-secondary-text);
}
:where(.MLK__rows > .MLK__row div) aside {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 10px;
  line-height: 10px;
  color: var(--_keycap-secondary-text);
}
/* Add an attribute 'data-tooltip' to display a tooltip on hover.
Note there are a different set of tooltip rules for the keyboard toggle
(it's in a different CSS tree) */
.ML__keyboard [data-tooltip] {
  position: relative;
}
.ML__keyboard [data-tooltip]::after {
  position: absolute;
  display: inline-table;
  content: attr(data-tooltip);
  top: inherit;
  bottom: 100%;
  width: max-content;
  max-width: 200px;
  padding: 8px 8px;
  background: #616161;
  color: #fff;
  text-align: center;
  z-index: 2;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-weight: 400;
  font-size: 12px;
  transition: all 0.15s cubic-bezier(0.4, 0, 1, 1) 1s;
  opacity: 0;
  transform: scale(0.5);
}
.ML__keyboard [data-tooltip]:hover {
  position: relative;
}
.ML__keyboard [data-tooltip]:hover::after {
  opacity: 1;
  transform: scale(1);
}
.MLK__toolbar {
  align-self: center;
  display: flex;
  flex-flow: row;
  justify-content: space-between;
  width: 100%;
  max-width: 996px;
  min-height: 32px;
  /* Icons for undo/redo, etc. */
}
.MLK__toolbar svg {
  height: 20px;
  width: 20px;
}
.MLK__toolbar > .left {
  position: relative;
  display: flex;
  justify-content: flex-start;
  flex-flow: row;
}
.MLK__toolbar > .right {
  display: flex;
  justify-content: flex-end;
  flex-flow: row;
}
.MLK__toolbar > div > div {
  /* "button" in the toolbar */
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--_toolbar-text);
  fill: currentColor;
  background: var(--_toolbar-background);
  font-size: var(--_toolbar-font-size);
  padding: 4px 15px;
  cursor: pointer;
  width: max-content;
  min-width: 42px;
  min-height: 34px;
  border: none;
  padding-left: 10px;
  padding-right: 10px;
  padding-bottom: 8px;
  padding-top: 8px;
  margin-top: 0;
  margin-bottom: 4px;
  margin-left: 4px;
  margin-right: 4px;
  border-radius: 8px;
  box-shadow: none;
  border-bottom: 2px solid transparent;
}
.MLK__toolbar > div > div:not(.disabled):not(.selected):hover {
  background: var(--_toolbar-background-hover);
}
.MLK__toolbar > div > div.disabled svg,
.MLK__toolbar > div > div.disabled:hover svg,
.MLK__toolbar > div > div.disabled.is-pressed svg {
  color: var(--_toolbar-text);
  opacity: 0.2;
}
.MLK__toolbar > div > div:hover,
.MLK__toolbar > div > div:active,
.MLK__toolbar > div > div.is-pressed,
.MLK__toolbar > div > div.is-active {
  color: var(--_toolbar-text-active);
}
.MLK__toolbar > div > div.selected {
  color: var(--_toolbar-text-active);
  background: var(--_toolbar-background-selected);
  border-radius: 0;
  border-bottom-color: var(--_toolbar-text-active);
  padding-bottom: 4px;
  margin-bottom: 8px;
}
/* This is the element that displays variants on press+hold */
.MLK__variant-panel {
  visibility: hidden;
  position: fixed;
  display: flex;
  flex-flow: row wrap-reverse;
  justify-content: center;
  align-content: center;
  margin: 0;
  padding: 0;
  bottom: auto;
  top: 0;
  box-sizing: content-box;
  transform: none;
  z-index: calc(var(--_keyboard-zindex) + 1);
  touch-action: none;
  max-width: 350px;
  background: var(--_variant-panel-background);
  text-align: center;
  border-radius: 6px;
  padding: 6px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
  transition: none;
}
.MLK__variant-panel.is-visible {
  visibility: visible;
}
.MLK__variant-panel.compact {
  --_variant-keycap-length: var(--variant-keycap-length, 50px);
  --_variant-keycap-font-size: var(--variant-keycap-font-size, 24px);
  --_variant-keycap-aside-font-size: var(--variant-keycap-aside-font-size, 10px);
}
.MLK__variant-panel .item {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  font-size: var(--_variant-keycap-font-size);
  height: var(--_variant-keycap-length);
  width: var(--_variant-keycap-length);
  margin: 0;
  box-sizing: border-box;
  border-radius: 5px;
  border: 1px solid transparent;
  background: transparent;
  pointer-events: all;
  cursor: pointer;
  color: var(--_variant-keycap-text);
  fill: currentColor;
}
@media (max-height: 412px) {
  .MLK__variant-panel .item {
    --_variant-keycap-font-size: var(--variant-keycap-font-size, 24px);
    --_variant-keycap-length: var(--variant-keycap-length, 50px);
  }
}
.MLK__variant-panel .item .ML__latex {
  pointer-events: none;
}
.MLK__variant-panel .item:hover {
  color: var(--_keycap-text-hover);
}
.MLK__variant-panel .item.is-active {
  background: var(--_variant-keycap-background-active);
  color: var(--_variant-keycap-text-active);
  --_box-placeholder-color: var(--_box-placeholder-pressed-color);
}
.MLK__variant-panel .item.is-pressed {
  background: var(--_variant-keycap-background-pressed);
  color: var(--_variant-keycap-text-pressed);
  --_box-placeholder-color: var(--_box-placeholder-pressed-color);
}
.MLK__variant-panel .item.small {
  font-size: var(--_keycap-small-font-size);
}
.MLK__variant-panel .item.swatch-button {
  box-sizing: border-box;
  background: #fbfbfb;
}
.MLK__variant-panel .item.swatch-button > span {
  display: inline-block;
  margin: 6px;
  width: calc(100% - 12px);
  height: calc(100% - 12px);
  border-radius: 50%;
}
.MLK__variant-panel .item.swatch-button:hover {
  background: #f0f0f0;
}
.MLK__variant-panel .item.swatch-button:hover > span {
  border-radius: 2px;
}
.MLK__variant-panel .item.box > div,
.MLK__variant-panel .item.box > span {
  border: 1px dashed rgba(0, 0, 0, 0.24);
}
.MLK__variant-panel .item .warning {
  min-height: 60px;
  min-width: 60px;
  background: #cd0030;
  color: white;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
}
.MLK__variant-panel .item .warning.is-pressed,
.MLK__variant-panel .item .warning.is-active {
  background: red;
}
.MLK__variant-panel .item .warning svg.svg-glyph {
  width: var(--_keycap-glyph-size-xl);
  height: var(--_keycap-glyph-size-xl);
}
.MLK__variant-panel .item aside {
  font-size: var(--_variant-keycap-aside-font-size);
  line-height: 12px;
  opacity: 0.78;
  padding-top: 2px;
  width: 100%;
  text-align: center;
  text-wrap: wrap;
}
.MLK__keycap {
  position: relative;
}
.MLK__shift {
  display: block;
  position: absolute;
  right: 4px;
  top: 4px;
  font-size: var(--_keycap-shift-font-size);
  color: var(--_keycap-shift-color);
}
.hide-shift .MLK__shift {
  display: none;
}
@media (max-width: 414px) {
  .MLK__variant-panel {
    max-width: 350px;
    --_variant-keycap-font-size: var(--variant-keycap-font-size, 24px);
    --_variant-keycap-length: var(--variant-keycap-length, 50px);
  }
}
/* @xs breakpoint: iPhone 5 */
@container (max-width: 414px) {
  .MLK__rows {
    --_keycap-gap: max(var(--_keycap-gap, 2px), 2px);
    --_keycap-height: var(--keycap-height, 42px);
    --_keycap-width: var(--keycap-width, min(min(var(--_keycap-max-width)), 10cqw), 62px));
  }
  .MLK__toolbar > div > div {
    font-size: 100%;
    margin-left: 2px;
    margin-right: 2px;
  }
  .MLK__rows .shift,
  .MLK__rows .action {
    font-size: 65%;
  }
  .MLK__rows .warning svg.svg-glyph {
    width: 14px;
    height: 14px;
    min-height: 14px;
  }
}
@container (max-width: 744px) {
  .MLK__rows {
    --_keycap-gap: max(var(--keycap-gap, 2px), 2px);
    --_keycap-height: var(--keycap-height, 52px);
    --_keycap-width: var(--keycap-width, min(min(var(--_keycap-max-width), 10cqw), 62px));
  }
  .MLK__toolbar > div > div {
    padding-left: 0;
    padding-right: 0;
  }
  .MLK__tooltip::after {
    padding: 8px 16px;
    font-size: 16px;
  }
  .MLK__rows > .MLK__row > div.fnbutton {
    font-size: 16px;
  }
  .MLK__rows > .MLK__row > div.bigfnbutton {
    font-size: calc(var(--_keycap-extra-small-font-size) / 1.55);
  }
  .MLK__rows > .MLK__row > div.small {
    font-size: 13px;
  }
  .MLK__rows > .MLK__row > div > aside {
    display: none;
  }
  .MLK__shift {
    display: none;
  }
}
/* Medium breakpoint: larger phones */
@container (max-width: 768px) {
  .MLK__rows {
    --_keycap-height: var(--keycap-height, 42px);
  }
  .MLK__rows > .MLK__row > div > small {
    font-size: 14px;
  }
}
@media (max-height: 768px) {
  .MLK__rows {
    --_keycap-height: var(--keycap-height, 42px);
  }
  .MLK__rows > .MLK__row > div > small {
    font-size: 14px;
  }
}
@container (max-width: 1444px) {
  .MLK__rows .if-wide {
    display: none;
  }
}
@media (prefers-color-scheme: dark) {
  .ML__keyboard {
    --_accent-color: var(--keyboard-accent-color, #0b5c9c);
    --_background: var(--keyboard-background, #151515);
    --_border: var(--keyboard-border, transparent);
    --_toolbar-text: var(--keyboard-toolbar-text, #e3e4e8);
    --_toolbar-background-hover: var(--keyboard-toolbar-background-hover, #303030);
    --keyboard-toolbar-background-hover: #303030;
    --_horizontal-rule: var(--keyboard-horizontal-rule, 1px solid #303030);
    --_keycap-background: var(--keycap-background, #1f2022);
    --_keycap-background-hover: var(--keycap-background-hover, #2f3032);
    --_keycap-border: var(--_keycap-border, transparent);
    --_keycap-border-bottom: var(--_keycap-border-bottom, transparent);
    --_keycap-text: var(--keycap-text, #e3e4e8);
    --_keycap-secondary-background: var(--keycap-secondary-background, #3d4144);
    --_keycap-secondary-background-hover: var(--keycap-secondary-background-hover, #4d5154);
    --_keycap-secondary-text: var(--keycap-secondary-text, #e7ebee);
    --keycap-secondary-border: transparent;
    --keycap-secondary-border-bottom: transparent;
    --_keycap-secondary-border: var(--keycap-secondary-border, transparent);
    --_keycap-secondary-border-bottom: var(--keycap-secondary-border-bottom, transparent);
    --_variant-panel-background: var(--variant-panel-background, #303030);
    --_variant-keycap-text-active: var(--variant-keycap-text-active, #fff);
  }
}
/* Same as the media query, but with a class */
[theme='dark'] .ML__keyboard {
  --_accent-color: var(--keyboard-accent-color, #0b5c9c);
  --_background: var(--keyboard-background, #151515);
  --_border: var(--keyboard-border, transparent);
  --_toolbar-text: var(--keyboard-toolbar-text, #e3e4e8);
  --_toolbar-background-hover: var(--keyboard-toolbar-background-hover, #303030);
  --keyboard-toolbar-background-hover: #303030;
  --_horizontal-rule: var(--keyboard-horizontal-rule, 1px solid #303030);
  --_keycap-background: var(--keycap-background, #1f2022);
  --_keycap-background-hover: var(--keycap-background-hover, #2f3032);
  --_keycap-border: var(--_keycap-border, transparent);
  --_keycap-border-bottom: var(--_keycap-border-bottom, transparent);
  --_keycap-text: var(--keycap-text, #e3e4e8);
  --_keycap-secondary-background: var(--keycap-secondary-background, #3d4144);
  --_keycap-secondary-background-hover: var(--keycap-secondary-background-hover, #4d5154);
  --_keycap-secondary-text: var(--keycap-secondary-text, #e7ebee);
  --keycap-secondary-border: transparent;
  --keycap-secondary-border-bottom: transparent;
  --_keycap-secondary-border: var(--keycap-secondary-border, transparent);
  --_keycap-secondary-border-bottom: var(--keycap-secondary-border-bottom, transparent);
  --_variant-panel-background: var(--variant-panel-background, #303030);
  --_variant-keycap-text-active: var(--variant-keycap-text-active, #fff);
}
[theme='light'] .ML__keyboard {
  --_accent-color: var(--keyboard-accent-color, #0c75d8);
  --_background: var(--keyboard-background, #cacfd7);
  --_border: var(--keyboard-border, #ddd);
  --_toolbar-text: var(--keyboard-toolbar-text, #2c2e2f);
  --_toolbar-background: var(--keyboard-toolbar-background, transparent);
  --_toolbar-background-hover: var(--keyboard-toolbar-background-hover, #eee);
  --_toolbar-background-selected: var(--keyboard-toolbar-background-selected, transparent);
  --_horizontal-rule: var(--keyboard-horizontal-rule, 1px solid #fff);
  --_keycap-background: var(--keycap-background, white);
  --_keycap-background-hover: var(--keycap-background-hover, #f5f5f7);
  --_keycap-background-active: var(--keycap-background-active, var(--_accent-color));
  --_keycap-background-pressed: var(--keycap-background-pressed, var(--_accent-color));
  --_keycap-border: var(--_keycap-border, #e5e6e9);
  --_keycap-border-bottom: var(--_keycap-border-bottom, #8d8f92);
  --_keycap-text: var(--keycap-text, #000);
  --_keycap-text-active: var(--keycap-text-active, #fff);
  --_keycap-text-hover: var(--keycap-text-hover, var(--_keycap-text));
  --_keycap-text-pressed: var(--keycap-text-pressed, #fff);
  --_keycap-shift-text: var(--keycap-shift-text, var(--_accent-color));
  --_keycap-secondary-background: var(--keycap-secondary-background, #a0a9b8);
  --_keycap-secondary-background-hover: var(--keycap-secondary-background-hover, #7d8795);
  --_keycap-secondary-text: var(--keycap-secondary-text, #060707);
  --_keycap-secondary-border: var(--keycap-secondary-border, #c5c9d0);
  --_keycap-secondary-border-bottom: var(--keycap-secondary-border-bottom, #989da6);
  --_variant-panel-background: var(--variant-panel-background, #f0f0f0);
  --_variant-keycap-text: var(--variant-keycap-textvar, var(--_keycap-text));
  --_variant-keycap-text-active: var(--variant-keycap-text-active, var(--_keycap-text-active));
  --_variant-keycap-background-active: var(--variant-keycap-background-active, var(--_accent-color));
}
`;
var nh = `:host {
  --primary-color: #5898ff;
  --primary-color-dimmed: #c0c0f0;
  --primary-color-dark: var(--blue-500);
  --primary-color-light: var(--blue-100);
  --primary-color-reverse: #ffffff;
  --secondary-color: #ff8a65;
  --secondary-color-dimmed: #f0d5c5;
  --secondary-color-dark: var(--orange-500);
  --secondary-color-light: var(--orange-100);
  --secondary-color-reverse: #ffffff;
  --link-color: #5898ff;
  --link-color-dimmed: #c5c5c5;
  --link-color-dark: #121212;
  --link-color-light: #e2e2e2;
  --link-color-reverse: #ffffff;
  --semantic-blue: var(--blue-700);
  --semantic-red: var(--red-400);
  --semantic-orange: var(--orange-400);
  --semantic-green: var(--green-700);
  --neutral-100: #f5f5f5;
  --neutral-200: #eeeeee;
  --neutral-300: #e0e0e0;
  --neutral-400: #bdbdbd;
  --neutral-500: #9e9e9e;
  --neutral-600: #757575;
  --neutral-700: #616161;
  --neutral-800: #424242;
  --neutral-900: #212121;
  --red-25: #fff8f7;
  --red-50: #fff1ef;
  --red-100: #ffeae6;
  --red-200: #ffcac1;
  --red-300: #ffa495;
  --red-400: #ff7865;
  --red-500: #f21c0d;
  --red-600: #e50018;
  --red-700: #d30024;
  --red-800: #bd002c;
  --red-900: #a1002f;
  --orange-25: #fffbf8;
  --orange-50: #fff7f1;
  --orange-100: #fff3ea;
  --orange-200: #ffe1c9;
  --orange-300: #ffcca2;
  --orange-400: #ffb677;
  --orange-500: #fe9310;
  --orange-600: #f58700;
  --orange-700: #ea7c00;
  --orange-800: #dc6d00;
  --orange-900: #ca5b00;
  --brown-25: #fff8ef;
  --brown-50: #fff1df;
  --brown-100: #ffe9ce;
  --brown-200: #ebcca6;
  --brown-300: #cdaf8a;
  --brown-400: #af936f;
  --brown-500: #856a47;
  --brown-600: #7f5e34;
  --brown-700: #78511f;
  --brown-800: #6e4200;
  --brown-900: #593200;
  --yellow-25: #fffdf9;
  --yellow-50: #fffcf2;
  --yellow-100: #fffaec;
  --yellow-200: #fff2ce;
  --yellow-300: #ffe8ab;
  --yellow-400: #ffdf85;
  --yellow-500: #ffcf33;
  --yellow-600: #f1c000;
  --yellow-700: #dfb200;
  --yellow-800: #c9a000;
  --yellow-900: #ad8a00;
  --lime-25: #f4ffee;
  --lime-50: #e9ffdd;
  --lime-100: #ddffca;
  --lime-200: #a8fb6f;
  --lime-300: #94e659;
  --lime-400: #80d142;
  --lime-500: #63b215;
  --lime-600: #45a000;
  --lime-700: #268e00;
  --lime-800: #007417;
  --lime-900: #005321;
  --green-25: #f5fff5;
  --green-50: #ebffea;
  --green-100: #e0ffdf;
  --green-200: #a7ffa7;
  --green-300: #5afa65;
  --green-400: #45e953;
  --green-500: #17cf36;
  --green-600: #00b944;
  --green-700: #00a34a;
  --green-800: #008749;
  --green-900: #00653e;
  --teal-25: #f3ffff;
  --teal-50: #e6fffe;
  --teal-100: #d9fffe;
  --teal-200: #8dfffe;
  --teal-300: #57f4f4;
  --teal-400: #43e5e5;
  --teal-500: #17cfcf;
  --teal-600: #00c2c0;
  --teal-700: #00b5b1;
  --teal-800: #00a49e;
  --teal-900: #009087;
  --cyan-25: #f7fcff;
  --cyan-50: #eff8ff;
  --cyan-100: #e7f5ff;
  --cyan-200: #c2e6ff;
  --cyan-300: #95d5ff;
  --cyan-400: #61c4ff;
  --cyan-500: #13a7ec;
  --cyan-600: #069eda;
  --cyan-700: #0095c9;
  --cyan-800: #0088b2;
  --cyan-900: #0a7897;
  --blue-25: #f7faff;
  --blue-50: #eef5ff;
  --blue-100: #e5f1ff;
  --blue-200: #bfdbff;
  --blue-300: #92c2ff;
  --blue-400: #63a8ff;
  --blue-500: #0d80f2;
  --blue-600: #0077db;
  --blue-700: #006dc4;
  --blue-800: #0060a7;
  --blue-900: #005086;
  --indigo-25: #f8f7ff;
  --indigo-50: #f1efff;
  --indigo-100: #eae7ff;
  --indigo-200: #ccc3ff;
  --indigo-300: #ac99ff;
  --indigo-400: #916aff;
  --indigo-500: #63c;
  --indigo-600: #5a21b2;
  --indigo-700: #4e0b99;
  --indigo-800: #3b0071;
  --indigo-900: #220040;
  --purple-25: #fbf7ff;
  --purple-50: #f8f0ff;
  --purple-100: #f4e8ff;
  --purple-200: #e4c4ff;
  --purple-300: #d49aff;
  --purple-400: #c36aff;
  --purple-500: #a219e6;
  --purple-600: #9000c4;
  --purple-700: #7c009f;
  --purple-800: #600073;
  --purple-900: #3d0043;
  --magenta-25: #fff8fb;
  --magenta-50: #fff2f6;
  --magenta-100: #ffebf2;
  --magenta-200: #ffcddf;
  --magenta-300: #ffa8cb;
  --magenta-400: #ff7fb7;
  --magenta-500: #eb4799;
  --magenta-600: #da3689;
  --magenta-700: #c82179;
  --magenta-800: #b00065;
  --magenta-900: #8a004c;
}
@media (prefers-color-scheme: dark) {
  :host {
    --semantic-blue: var(--blue-700);
    --semantic-red: var(--red-400);
    --semantic-orange: var(--orange-400);
    --semantic-green: var(--green-700);
    --semantic-bg-blue: var(--blue-25);
    --semantic-bg-red: var(--red-25);
    --semantic-bg-orange: var(--orange-25);
    --semantic-bg-green: var(--green-25);
    --neutral-100: #121212;
    --neutral-200: #424242;
    --neutral-300: #616161;
    --neutral-400: #757575;
    --neutral-500: #9e9e9e;
    --neutral-600: #bdbdbd;
    --neutral-700: #e0e0e0;
    --neutral-800: #eeeeee;
    --neutral-900: #f5f5f5;
  }
}
:host([theme='dark']) {
  --semantic-blue: var(--blue-700);
  --semantic-red: var(--red-400);
  --semantic-orange: var(--orange-400);
  --semantic-green: var(--green-700);
  --semantic-bg-blue: var(--blue-25);
  --semantic-bg-red: var(--red-25);
  --semantic-bg-orange: var(--orange-25);
  --semantic-bg-green: var(--green-25);
  --neutral-100: #121212;
  --neutral-200: #424242;
  --neutral-300: #616161;
  --neutral-400: #757575;
  --neutral-500: #9e9e9e;
  --neutral-600: #bdbdbd;
  --neutral-700: #e0e0e0;
  --neutral-800: #eeeeee;
  --neutral-900: #f5f5f5;
}
/* @media (prefers-color-scheme: dark) {
  :host {
      --label-color: #fff;
      --active-label-color: #000;
      --menu-bg: #525252;
      --active-bg: #5898ff;
      --active-bg-dimmed: #5c5c5c;
  }
} */
:host {
  --ui-font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  --ui-font-size: 14px;
  --ui-line-height: 1.5;
  --ui-letter-spacing: 0.007em;
  --mono-font-family: 'Berkeley Mono', 'JetBrains Mono', 'IBM Plex Mono', 'Source Code Pro', Menlo, Monaco, 'Courier New', monospace;
  --ui-layer-1: var(--neutral-100);
  --ui-layer-2: var(--neutral-200);
  --ui-layer-3: var(--neutral-300);
  --ui-layer-4: var(--neutral-400);
  --ui-layer-5: var(--neutral-500);
  --ui-layer-6: var(--neutral-600);
  --ui-border-color: var(--primary-color);
  --ui-border-radius: 4px;
  --ui-text: var(--neutral-900);
  --ui-text-secondary: var(--neutral-700);
  --ui-text-placeholder: var(--neutral-500);
  --ui-text-muted: var(--neutral-300);
  /** A field is a UI element in which a user can type data, for
  * example an input or textarea element.
  */
  --ui-field-bg: var(--neutral-100);
  --ui-field-bg-hover: var(--neutral-100);
  --ui-field-bg-disabled: var(--neutral-300);
  --ui-field-bg-invalid: var(--red-100);
  --ui-field-bg-focus: var(--neutral-100);
  --ui-field-border: 0.5px solid var(--border-color);
  --ui-field-border-hover: 0.5px solid var(--border-color);
  --ui-field-border-disabled: 0.5px solid var(--border-color);
  --ui-field-border-invalid: 0.5px solid var(--border-color);
  --ui-field-border-focus: 0.5px solid var(--border-color);
  --ui-menu-bg: var(--neutral-100);
  --ui-menu-text: var(--neutral-900);
  --ui-menu-bg-hover: var(--neutral-200);
  --ui-menu-text-hover: var(--neutral-900);
  /** The \`active\` state is used for the state of menu items
  * when they are selected.
  */
  --ui-menu-bg-active: var(--primary-color);
  --ui-menu-text-active: var(--primary-color-reverse);
  /** The \`active-muted\` set is used for the state of
  * submenus when they are open.
  */
  --ui-menu-bg-active-muted: var(--neutral-300);
  --ui-menu-text-active-muted: var(--neutral-900);
  /* --ui-menu-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.302),
0 2px 6px 2px rgba(60, 64, 67, 0.149); */
  --ui-menu-shadow: 0 0 2px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.2);
  --ui-menu-divider: 0.5px solid #c7c7c7;
  /* var(--neutral-300); */
  --ui-menu-z-index: 10000;
  --page-bg: var(--neutral-100);
  --content-bg: var(--neutral-200);
}
@media (prefers-color-scheme: dark) {
  :host {
    --ui-menu-bg: var(--neutral-200);
  }
}
:host([theme='dark']) {
  --ui-menu-bg: var(--neutral-200);
}
/* PingFang SC is a macOS font. Microsoft Yahei is a Windows font. 
  Noto  is a Linux/Android font.
*/
:lang(zh-cn),
:lang(zh-sg),
:lang(zh-my),
:lang(zh) {
  --ui-font-family: -apple-system, system-ui, 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC', 'Noto Sans SC', 'Noto Sans', 'Microsoft Yahei UI', 'Microsoft YaHei New', 'Microsoft Yahei', '微软雅黑', SimSun, '宋体', STXihei, '华文细黑', sans-serif;
}
:lang(zh-tw),
:lang(zh-hk),
:lang(zh-mo) {
  --ui-font-family: -apple-system, system-ui, 'Noto Sans', 'Microsoft JhengHei UI', 'Microsoft JhengHei', '微軟正黑體', '新細明體', 'PMingLiU', '細明體', 'MingLiU', sans-serif;
}
:lang(ja),
:lang(ja-jp),
:lang(ja-jp-mac) {
  --ui-font-family: -apple-system, system-ui, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans CJK JP', 'Noto Sans JP', 'Noto Sans', '游ゴシック', '游ゴシック体', YuGothic, 'Yu Gothic', 'メイリオ', Meiryo, 'ＭＳ Ｐゴシック', 'MS PGothic', sans-serif;
}
:lang(ko),
:lang(ko-kr),
:lang(ko-kr-std) {
  --ui-font-family: -apple-system, system-ui, 'Noto Sans CJK KR', 'Noto Sans KR', 'Noto Sans', 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', '애플 SD 산돌고딕 Neo', 'Apple SD 산돌고딕 Neo', '돋움', Dotum, sans-serif;
}
:lang(ko-kr-apple) {
  --ui-font-family: -apple-system, system-ui, 'Noto Sans CJK KR', 'Noto Sans KR', 'Noto Sans', 'Apple SD Gothic Neo', '애플 SD 산돌고딕 Neo', 'Apple SD 산돌고딕 Neo', '돋움', Dotum, sans-serif;
}
:lang(zh-cn),
:lang(zh-sg),
:lang(zh-my),
:lang(zh),
:lang(zh-tw),
:lang(zh-hk),
:lang(zh-mo),
:lang(ja),
:lang(ja-jp),
:lang(ja-jp-mac),
:lang(ko),
:lang(ko-kr),
:lang(ko-kr-std),
:lang(ko-kr-apple) {
  --ui-font-size: 1rem;
  --ui-line-height: 1.7;
  --ui-letter-spacing: 0;
}
:dir(rtl) {
  --ui-line-height: auto;
  --ui-letter-spacing: 0;
}
`;
var oh = `.ui-menu *,
.ui-menu ::before,
.ui-menu ::after {
  box-sizing: border-box;
}
.ui-menu {
  display: none;
  color-scheme: light dark;
  -webkit-user-select: none;
  /* Important: Safari iOS doesn't respect user-select */
  user-select: none;
  cursor: default;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: rgba(0 0 0 0);
  --active-label-color: #fff;
  /* ui-menu-text-active */
  --label-color: #121212;
  /* ui-menu-text */
  --menu-bg: #e2e2e2;
  /* ui-menu-background */
  --active-bg: #5898ff;
  /* ui-menu-background-active */
  --active-bg-dimmed: #c5c5c5;
  /* ui-menu-background-active-muted */
}
/** Use the :where pseudo selector to make the specificity of the
 * selector 0, so that it can be overridden by the user.
 */
:where(.ui-menu-container) {
  position: absolute;
  overflow: visible;
  width: auto;
  height: auto;
  z-index: 10000;
  border-radius: 8px;
  background: var(--ui-menu-bg);
  box-shadow: var(--ui-menu-shadow);
  list-style: none;
  padding: 6px 0 6px 0;
  margin: 0;
  user-select: none;
  cursor: default;
  color: var(--ui-menu-text);
  font-weight: normal;
  font-style: normal;
  text-shadow: none;
  text-transform: none;
  letter-spacing: 0;
  outline: none;
  opacity: 1;
  /* The [popover] elements have a 1px solid black border. Ugh. */
  border: none;
  width: fit-content;
  height: fit-content;
}
:where(.ui-menu-container > li) {
  display: flex;
  flex-flow: row;
  align-items: center;
  padding: 1px 7px 1px 7px;
  margin-top: 0;
  margin-left: 6px;
  margin-right: 6px;
  border-radius: 4px;
  white-space: nowrap;
  position: relative;
  outline: none;
  fill: currentColor;
  user-select: none;
  cursor: default;
  text-align: left;
  color: inherit;
  font-family: var(--ui-font-family);
  font-size: var(--ui-font-size);
  line-height: var(--ui-line-height);
  letter-spacing: var(--ui-letter-spacing);
}
:where(.ui-menu-container > li > .label) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  appearance: none;
  background: none;
  outline: none;
  width: 100%;
  margin: 0;
  padding: 1px 2px 1px 1px;
  overflow: visible;
  border: 1px solid transparent;
  white-space: nowrap;
  text-align: start;
  align-content: center;
}
:where(.ui-menu-container > li:has(.heading)) {
  margin-top: 0.5em;
}
:where(.ui-menu-container > li > .label.heading) {
  font-weight: bold;
  opacity: 0.4;
}
:where(.ui-menu-container > li.indent > .label) {
  margin-inline-start: 12px;
}
:where(.ui-menu-container > li > .label.indent) {
  margin-inline-start: 12px;
}
:where(.ui-menu-container > li[role='divider']) {
  border-bottom: 1px solid var(--ui-menu-divider);
  border-radius: 0;
  padding: 0;
  margin-left: 15px;
  margin-right: 15px;
  padding-top: 5px;
  margin-bottom: 5px;
  width: calc(100% - 30px);
  /** 100% - (margin-left + margin-right) */
}
:where(.ui-menu-container > li[aria-disabled='true']) {
  opacity: 0.5;
}
:where(.ui-menu-container > li.active) {
  background: var(--ui-menu-bg-active);
  background: -apple-system-control-accent;
  color: var(--ui-menu-text-active);
}
:where(.ui-menu-container > li.active.is-submenu-open) {
  background: var(--ui-menu-bg-active-muted);
  color: inherit;
}
:where(.ui-menu-container > li[aria-haspopup='true'] > .label) {
  padding-inline-end: 0;
}
:where(.ui-menu-container > li[aria-haspopup='true'].active::after) {
  color: var(--ui-menu-text-active);
}
/** Keyboard shortcut */
:where(.ui-menu-container > li > kbd) {
  font-family: var(--ui-font-family);
  margin-inline-start: 12px;
  opacity: 0.4;
}
:where(.ui-menu-container > li.active > kbd) {
  opacity: 0.85;
}
.ui-trailing-chevron {
  display: flex;
  margin-inline-start: 24px;
  width: 10px;
  height: 10px;
  margin-bottom: 4px;
}
.ui-trailing-chevron:dir(rtl) {
  transform: scaleX(-1);
}
.ui-checkmark {
  display: flex;
  margin-inline-end: -11px;
  margin-inline-start: -4px;
  margin-top: 2px;
  width: 16px;
  height: 16px;
}
.ui-mixedmark {
  display: flex;
  margin-inline-end: -11px;
  margin-inline-start: -4px;
  margin-top: 2px;
  width: 16px;
  height: 16px;
}
`;
var zr;
function Nt(t38) {
  let e = "";
  switch (t38) {
    case "mathfield-element":
      e = `
    :host { display: inline-block; background-color: field; color: fieldtext; border-width: 1px; border-style: solid; border-color: #acacac; border-radius: 2px;}
    :host([hidden]) { display: none; }
    :host([disabled]), :host([disabled]:focus), :host([disabled]:focus-within) { outline: none; opacity:  .5; }
    :host(:focus), :host(:focus-within) {
      outline: Highlight auto 1px;    /* For Firefox */
      outline: -webkit-focus-ring-color auto 1px;
    }
    :host([readonly]:focus), :host([readonly]:focus-within),
    :host([read-only]:focus), :host([read-only]:focus-within) {
      outline: none;
    }`;
      break;
    case "core":
      e = Q0;
      break;
    case "mathfield":
      e = Y0;
      break;
    case "environment-popover":
      e = eh;
      break;
    case "suggestion-popover":
      e = th;
      break;
    case "keystroke-caption":
      e = rh;
      break;
    case "virtual-keyboard":
      e = ih;
      break;
    case "ui":
      e = nh;
      break;
    case "menu":
      e = oh;
      break;
  }
  return e;
}
function sr(t38) {
  return zr || (zr = {}), zr[t38] || (zr[t38] = new CSSStyleSheet(), zr[t38].replaceSync(Nt(t38))), zr[t38];
}
var zt;
function Ge(t38) {
  var e;
  try {
    if (!("adoptedStyleSheets" in document)) {
      if (window.document.getElementById(`mathlive-style-${t38}`)) return;
      let r = window.document.createElement("style");
      r.id = `mathlive-style-${t38}`, r.append(window.document.createTextNode(Nt(t38))), window.document.head.appendChild(r);
      return;
    }
    if (zt || (zt = {}), ((e = zt[t38]) != null ? e : 0) !== 0) zt[t38] += 1;
    else {
      let r = sr(t38);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, r], zt[t38] = 1;
    }
  } catch (r) {
    console.error("Error injecting stylesheet", t38, r);
  }
}
function ot(t38) {
  if ("adoptedStyleSheets" in document && zt != null && zt[t38] && (zt[t38] -= 1, zt[t38] <= 0)) {
    let e = zr[t38];
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((r) => r !== e);
  }
}
var Nr = class t5 extends x {
  constructor(e) {
    var r;
    super(g(h({}, e), { type: "accent", body: (r = e.body) != null ? r : void 0 })), e.accentChar ? this.accent = e.accentChar : this.svgAccent = e == null ? void 0 : e.svgAccent, this.skipBoundary = true, this.captureSelection = true;
  }
  static fromJson(e) {
    return new t5(e);
  }
  toJson() {
    return g(h({}, super.toJson()), { accentChar: this.accent, svgAccent: this.svgAccent });
  }
  render(e) {
    var c;
    let r = new P({ parent: e, mathstyle: "cramp" }, this.style), i = (c = x.createBox(r, this.body)) != null ? c : new w("□", { style: this.style }), n = 0;
    !this.hasEmptyBranch("body") && this.body.length === 2 && this.body[1].isCharacterBox() && (n = i.skew);
    let o = Math.min(i.height, Xe), a;
    if (this.svgAccent) a = Zi(this.svgAccent), o = r.metrics.bigOpSpacing1 - o;
    else if (this.accent) {
      let u = new w(this.accent, { fontFamily: "Main-Regular" });
      u.italic = 0;
      let d = this.accent === 8407 || this.accent === 8411 || this.accent === 8412 ? " ML__accent-combining-char" : "";
      a = new w(u, { classes: "ML__accent-body" + d });
    }
    let s = (i.width - a.width) / 2 + i.left + 2 * n;
    a = new te({ shift: 0, children: [{ box: new w(i) }, -o, { box: a, marginLeft: s, classes: ["ML__center"] }] });
    let l = new w(a, { type: "ord" });
    return this.caret && (l.caret = this.caret), this.bind(r, l.wrap(r)), this.attachSupsub(r, { base: l });
  }
};
var nn = { "(": ")", "{": "}", "[": "]", "|": "|", "\\lbrace": "\\rbrace", "\\lparen": "\\rparen", "\\{": "\\}", "\\langle": "\\rangle", "\\lfloor": "\\rfloor", "\\lceil": "\\rceil", "\\vert": "\\vert", "\\lvert": "\\rvert", "\\Vert": "\\Vert", "\\lVert": "\\rVert", "\\lbrack": "\\rbrack", "\\ulcorner": "\\urcorner", "\\llcorner": "\\lrcorner", "\\lgroup": "\\rgroup", "\\lmoustache": "\\rmoustache" }, on = Object.fromEntries(Object.entries(nn).map(([t38, e]) => [e, t38]));
function Ja(t38) {
  var e;
  return (e = { "[": 91, "]": 93, "(": 40, ")": 41, "\\mid": 8739, "|": 8739, "∣": 8739, "∥": 8741, "\\|": 8739, "\\{": 123, "\\}": 125, "\\lbrace": 123, "\\rbrace": 125, "\\lparen": 40, "\\rparen": 41, "\\lbrack": 91, "\\rbrack": 93, "\\vert": 8739, "\\lvert": 8739, "\\mvert": 8739, "\\rvert": 8739, "\\Vert": 8741, "\\lVert": 8741, "\\mVert": 8741, "\\rVert": 8741, "\\parallel": 8741, "\\shortparallel": 8741, "\\langle": 10216, "\\rangle": 10217, "\\lfloor": 8970, "\\rfloor": 8971, "\\lceil": 8968, "\\rceil": 8969, "\\ulcorner": 9484, "\\urcorner": 9488, "\\llcorner": 9492, "\\lrcorner": 9496, "\\lgroup": 10222, "\\rgroup": 10223, "\\lmoustache": 9136, "\\rmoustache": 9137, "\\surd": 8730 }[t38]) != null ? e : t38.codePointAt(0);
}
function tg(t38, e, r, i) {
  var a;
  let o = new w(Ja(t38), { fontFamily: "Main-Regular", isSelected: i.isSelected, classes: "ML__small-delim " + ((a = i.classes) != null ? a : "") }).wrap(e);
  return r && o.setTop((1 - e.scalingFactor) * Ie), o;
}
function ah(t38, e, r, i, n) {
  var s, l;
  let o = new P({ parent: i, mathstyle: "textstyle" }, n == null ? void 0 : n.style), a = new w(Ja(t38), { fontFamily: `Size${e}-Regular`, isSelected: n.isSelected, classes: ((s = n.classes) != null ? s : "") + ` ML__delim-size${e}`, type: (l = n.type) != null ? l : "ignore" }).wrap(o);
  return r && a.setTop((1 - o.scalingFactor) * Ie), a;
}
function sh(t38, e, r, i, n) {
  var j;
  let o, a, s, l;
  o = s = l = Ja(t38), a = null;
  let c = "Size1-Regular";
  t38 === "\\vert" || t38 === "\\lvert" || t38 === "\\rvert" || t38 === "\\mvert" || t38 === "\\mid" ? s = o = l = 8739 : t38 === "\\Vert" || t38 === "\\lVert" || t38 === "\\rVert" || t38 === "\\mVert" || t38 === "\\|" ? s = o = l = 8741 : t38 === "\\uparrow" ? s = l = 9168 : t38 === "\\Uparrow" ? s = l = 8214 : t38 === "\\downarrow" ? o = s = 9168 : t38 === "\\Downarrow" ? o = s = 8214 : t38 === "\\updownarrow" ? (o = 8593, s = 9168, l = 8595) : t38 === "\\Updownarrow" ? (o = 8657, s = 8214, l = 8659) : t38 === "[" || t38 === "\\lbrack" ? (o = 9121, s = 9122, l = 9123, c = "Size4-Regular") : t38 === "]" || t38 === "\\rbrack" ? (o = 9124, s = 9125, l = 9126, c = "Size4-Regular") : t38 === "\\lfloor" || t38 === "⌊" ? (s = o = 9122, l = 9123, c = "Size4-Regular") : t38 === "\\lceil" || t38 === "⌈" ? (o = 9121, s = l = 9122, c = "Size4-Regular") : t38 === "\\rfloor" || t38 === "⌋" ? (s = o = 9125, l = 9126, c = "Size4-Regular") : t38 === "\\rceil" || t38 === "⌉" ? (o = 9124, s = l = 9125, c = "Size4-Regular") : t38 === "(" || t38 === "\\lparen" ? (o = 9115, s = 9116, l = 9117, c = "Size4-Regular") : t38 === ")" || t38 === "\\rparen" ? (o = 9118, s = 9119, l = 9120, c = "Size4-Regular") : t38 === "\\{" || t38 === "\\lbrace" ? (o = 9127, a = 9128, l = 9129, s = 9130, c = "Size4-Regular") : t38 === "\\}" || t38 === "\\rbrace" ? (o = 9131, a = 9132, l = 9133, s = 9130, c = "Size4-Regular") : t38 === "\\lgroup" || t38 === "⟮" ? (o = 9127, l = 9129, s = 9130, c = "Size4-Regular") : t38 === "\\rgroup" || t38 === "⟯" ? (o = 9131, l = 9133, s = 9130, c = "Size4-Regular") : t38 === "\\lmoustache" || t38 === "⎰" ? (o = 9127, l = 9133, s = 9130, c = "Size4-Regular") : t38 === "\\rmoustache" || t38 === "⎱" ? (o = 9131, l = 9129, s = 9130, c = "Size4-Regular") : t38 === "\\surd" ? (o = 57345, l = 9143, s = 57344, c = "Size4-Regular") : t38 === "\\ulcorner" ? (o = 9484, s = l = 32) : t38 === "\\urcorner" ? (o = 9488, s = l = 32) : t38 === "\\llcorner" ? (l = 9492, s = o = 32) : t38 === "\\lrcorner" && (o = 9496, s = o = 32);
  let u = Tr(o, c), d = u.height + u.depth, m = Tr(s, c), p = m.height + m.depth, f = Tr(l, c), y = f.height + f.depth, v = 0, b = 1;
  if (a !== null) {
    let D = Tr(a, c);
    v = D.height + D.depth, b = 2;
  }
  let k = d + y + v, S = Math.max(0, Math.ceil((e - k) / (b * p))), A = k + S * b * p, E = Ie;
  r && (E = E * i.scalingFactor);
  let C = A / 2 - E, O = [];
  O.push({ box: new w(l, { fontFamily: c }) }), O.push(-8e-3);
  let I = new w(s, { fontFamily: c });
  if (a === null) for (let D = 0; D < S; D++) O.push({ box: I });
  else {
    for (let D = 0; D < S; D++) O.push({ box: I });
    O.push(-8e-3), O.push({ box: new w(a, { fontFamily: c }) }), O.push(-8e-3);
    for (let D = 0; D < S; D++) O.push({ box: I });
  }
  O.push(-8e-3), O.push({ box: new w(o, { fontFamily: c }) });
  let V = "";
  c === "Size1-Regular" ? V = " delim-size1" : c === "Size4-Regular" && (V = " delim-size4");
  let K = new te({ bottom: C, children: O }, { classes: V });
  return new w(K, g(h({}, n != null ? n : {}), { classes: ((j = n == null ? void 0 : n.classes) != null ? j : "") + " ML__delim-mult" }));
}
var lh = /* @__PURE__ */ new Set(["(", ")", "\\lparen", "\\rparen", "[", "]", "\\lbrack", "\\rbrack", "\\{", "\\}", "\\lbrace", "\\rbrace", "\\lfloor", "\\rfloor", "\\lceil", "\\rceil", "\\surd", "⌊", "⌋", "⌈", "⌉"]), rg = /* @__PURE__ */ new Set(["\\uparrow", "\\downarrow", "\\updownarrow", "\\Uparrow", "\\Downarrow", "\\Updownarrow", "|", "\\|", "\\vert", "\\Vert", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\mvert", "\\mid", "\\lgroup", "\\rgroup", "\\lmoustache", "\\rmoustache", "⟮", "⟯", "⎰", "⎱"]), ch = /* @__PURE__ */ new Set(["<", ">", "\\langle", "\\rangle", "/", "\\backslash", "\\lt", "\\gt"]), ig = [0, 1.2, 1.8, 2.4, 3];
function uh(t38, e, r, i) {
  return t38 === void 0 || t38 === "." ? lr(r, i.classes) : (t38 === "<" || t38 === "\\lt" || t38 === "⟨" ? t38 = "\\langle" : (t38 === ">" || t38 === "\\gt" || t38 === "⟩") && (t38 = "\\rangle"), lh.has(t38) || ch.has(t38) ? ah(t38, e, false, r, i) : rg.has(t38) ? sh(t38, ig[e], false, r, i) : null);
}
var ng = [{ type: "small", mathstyle: "scriptscriptstyle" }, { type: "small", mathstyle: "scriptstyle" }, { type: "small", mathstyle: "textstyle" }, { type: "large", size: 1 }, { type: "large", size: 2 }, { type: "large", size: 3 }, { type: "large", size: 4 }], og = [{ type: "small", mathstyle: "scriptscriptstyle" }, { type: "small", mathstyle: "scriptscriptstyle" }, { type: "small", mathstyle: "textstyle" }, { type: "stack" }], ag = [{ type: "small", mathstyle: "scriptscriptstyle" }, { type: "small", mathstyle: "scriptstyle" }, { type: "small", mathstyle: "textstyle" }, { type: "large", size: 1 }, { type: "large", size: 2 }, { type: "large", size: 3 }, { type: "large", size: 4 }, { type: "stack" }];
function sg(t38) {
  return t38.type === "small" ? "Main-Regular" : t38.type === "large" ? "Size" + t38.size + "-Regular" : (t38.type, "Size4-Regular");
}
function lg(t38, e, r, i) {
  let n = { "-4": 0, "-3": 1, 0: 2 }[i.mathstyle.sizeDelta];
  for (let o = n; o < r.length && r[o].type !== "stack"; o++) {
    let a = Tr(t38, sg(r[o]));
    if (a.defaultMetrics) return { type: "small", mathstyle: "scriptstyle" };
    let s = a.height + a.depth;
    if (r[o].type === "small" && (r[o].mathstyle === "scriptscriptstyle" ? s *= Math.max(jn[Math.max(1, i.size - 2)], i.minFontScale) : r[o].mathstyle === "scriptstyle" && (s *= Math.max(jn[Math.max(1, i.size - 1)], i.minFontScale))), s > e) return r[o];
  }
  return r[r.length - 1];
}
function an(t38, e, r, i, n, o) {
  if (!e || e.length === 0 || e === ".") return lr(n);
  e === "<" || e === "\\lt" ? e = "\\langle" : (e === ">" || e === "\\gt") && (e = "\\rangle");
  let a;
  ch.has(e) ? a = ng : lh.has(e) ? a = ag : a = og;
  let s = lg(Ja(e), r, a, n), l = new P({ parent: n, mathstyle: s.mathstyle }, o == null ? void 0 : o.style);
  return s.type === "small" ? tg(e, l, i, g(h({}, o), { type: t38 })) : s.type === "large" ? ah(e, s.size, i, l, g(h({}, o), { type: t38 })) : (s.type, sh(e, r, i, l, g(h({}, o), { type: t38 })));
}
function hi(t38, e, r, i, n, o) {
  if (e === ".") return lr(n, o == null ? void 0 : o.classes);
  let a = Ie * n.scalingFactor, s = 901, l = 5 / Pt, c = Math.max(r - a, i + a), u = Math.max(c / 500 * s, 2 * c - l);
  return an(t38, e, u, true, n, o);
}
function lr(t38, e) {
  let r = new w(null, { classes: " ML__nulldelimiter " + (e != null ? e : ""), type: "ignore" });
  return r.width = t38.getRegisterAsEm("nulldelimiterspace"), r.wrap(new P({ parent: t38, mathstyle: "textstyle" }));
}
var Me = class t6 extends x {
  constructor(e) {
    var r;
    super({ type: "placeholder", command: "\\placeholder", mode: (r = e == null ? void 0 : e.mode) != null ? r : "math", style: e == null ? void 0 : e.style }), this.captureSelection = true;
  }
  static fromJson(e) {
    return new t6(e);
  }
  toJson() {
    return super.toJson();
  }
  render(e) {
    let r;
    return this.value = e.placeholderSymbol, typeof e.renderPlaceholder == "function" ? r = e.renderPlaceholder(e) : r = this.createBox(e), this.caret && (r.classes += " ML__placeholder-selected"), r;
  }
  _serialize(e) {
    return e.skipPlaceholders ? "" : "\\placeholder{}";
  }
};
var dh = ["matrix", "matrix*", "pmatrix", "pmatrix*", "bmatrix", "bmatrix*", "Bmatrix", "Bmatrix*", "vmatrix", "vmatrix*", "Vmatrix", "Vmatrix*"], mc = ["cases", "dcases", "rcases"], mh = ["align", "align*", "aligned", "gather", "gather*", "gathered", "split"], cg = ["array", "subequations", "eqnarray"];
function hh(t38) {
  return mh.includes(t38) || mc.includes(t38) || mc.includes(t38) || dh.includes(t38) || cg.includes(t38);
}
function Xa(t38) {
  return dh.includes(t38);
}
function ph(t38) {
  return mc.includes(t38);
}
function fh(t38) {
  return mh.includes(t38);
}
function ug(t38, e, r) {
  let i = 0;
  for (let c of r.columns) "align" in c && (i += 1);
  i = Math.max(i, r.minColumns);
  let n = 0, o = [];
  for (let c of e) {
    n = Math.max(n, Math.min(c.length, i));
    let u = 0;
    for (; u < c.length; ) {
      let d = [], m = Math.min(c.length, u + i);
      for (; u < m; ) d.push(hg(c[u], t38.mode)), u += 1;
      if (d.length < r.minColumns) for (; d.length < r.minColumns; ) d.push([new x({ type: "first", mode: t38.mode })]);
      o.push(d);
    }
  }
  !t38.isMultiline && o.length > 0 && o[o.length - 1].length === 1 && pg(o[o.length - 1][0]) && o.pop();
  let a = [];
  for (let c of o) {
    if (c.length !== n) for (let u = c.length; u < n; u++) t38.isMultiline ? c.push([new x({ type: "first", mode: t38.mode })]) : c.push([new x({ type: "first", mode: t38.mode }), new Me()]);
    a.push(c);
  }
  let s = 0, l = 0;
  for (let c of a) {
    l = 0;
    for (let u of c) {
      for (let d of u) d.parent = t38, d.parentBranch = [s, l];
      l += 1;
    }
    s += 1;
  }
  return t38.isDirty = true, a;
}
function dg(t38) {
  return t38.length > 0 && t38.every((e) => e.type === "first");
}
function mg(t38, e, r) {
  let i = new w(null, { classes: "ML__empty-line-anchor" }), n = t38[0];
  n && (n.id || (n.id = e.makeID()), i.atomID = n.id), i.setStyle("display", "inline-block"), i.setStyle("width", 0), i.setStyle("position", "relative"), i.setStyle("height", Math.max(0, r.height + r.depth), "em"), i.setStyle("vertical-align", -r.depth, "em"), i.height = r.height, i.depth = r.depth;
  let o = t38.find((a) => a.caret);
  return o != null && o.caret && (i.caret = o.caret), t38.some((a) => a.isSelected) && i.selected(true), i;
}
function hg(t38, e) {
  return t38.length === 0 ? [new x({ type: "first", mode: e })] : t38[0].type !== "first" ? [new x({ type: "first", mode: e }), ...t38] : (t38.slice(1).some((r) => r.type === "first"), t38);
}
function pg(t38) {
  return t38.length === 1 && t38[0].type === "first";
}
var z = class t7 extends x {
  get isMultiline() {
    let e = this.environmentName;
    return ["lines", "multline", "multline*", "align", "split", "gather", "gathered"].includes(e);
  }
  constructor(e, r, i, n = {}) {
    var o, a, s, l;
    if (super({ type: "array", isRoot: n.isRoot }), this.environmentName = e, n.columns) n.columns.length === 0 ? this.colFormat = [{ align: "l" }] : this.colFormat = [...n.columns];
    else if (n.minColumns) {
      let c = [];
      for (let u = 0; u < n.minColumns; u++) c.push({ align: "l" });
      this.colFormat = c;
    } else this.colFormat = [{ align: "l" }, { align: "l" }, { align: "l" }, { align: "l" }, { align: "l" }, { align: "l" }, { align: "l" }, { align: "l" }, { align: "l" }, { align: "l" }];
    this.minColumns = (o = n.minColumns) != null ? o : 1, this.minRows = (a = n.minRows) != null ? a : 1, this.maxRows = (s = n.maxRows) != null ? s : 1 / 0, this._rows = ug(this, r, { columns: this.colFormat, minColumns: this.minColumns, minRows: this.minRows, maxRows: this.maxRows }), this.rowGaps = i, n.arraycolsep !== void 0 && (this.arraycolsep = n.arraycolsep), this.colSeparationType = n.colSeparationType, n.arraystretch !== void 0 && (this.arraystretch = n.arraystretch), n.mathstyleName && (this.mathstyleName = n.mathstyleName), n.leftDelim && (this.leftDelim = n.leftDelim), n.rightDelim && (this.rightDelim = n.rightDelim), this.classes = (l = n.classes) != null ? l : [];
  }
  static fromJson(e) {
    return new t7(e.environmentName, e.array, e.rowGaps, e);
  }
  toJson() {
    let e = g(h({}, super.toJson()), { environmentName: this.environmentName, array: this._rows.map((r) => r.map((i) => i.map((n) => n.toJson()))), rowGaps: this.rowGaps, columns: this.colFormat, colSeparationType: this.colSeparationType, minColumns: this.minColumns, minRows: this.minRows, maxRows: this.maxRows });
    return this.arraystretch !== void 0 && (e.arraystretch = this.arraystretch), this.arraycolsep !== void 0 && (e.arraycolsep = this.arraycolsep), this.leftDelim && (e.leftDelim = this.leftDelim), this.rightDelim && (e.rightDelim = this.rightDelim), this.isRoot && (e.isRoot = true), e.minColumns = this.minColumns, e.minRows = this.minRows, e.maxRows = this.maxRows, this.mathstyleName && (e.mathstyleName = this.mathstyleName), this.classes.length > 0 && (e.classes = this.classes), e;
  }
  branch(e) {
    var r;
    if (Ze(e)) return (r = this._rows[e[0]][e[1]]) != null ? r : void 0;
  }
  createBranch(e) {
    var r;
    return Ze(e) ? (this.isDirty = true, (r = this.branch(e)) != null ? r : []) : [];
  }
  get rowCount() {
    return this._rows.length;
  }
  get colCount() {
    return this._rows[0].length;
  }
  get maxColumns() {
    return this.colFormat.filter((e) => !!e.align).length;
  }
  removeBranch(e) {
    if (Rr(e)) return super.removeBranch(e);
    let [r, ...i] = this.branch(e);
    return r.type, this._rows[e[0]][e[1]] = void 0, i.forEach((n) => {
      n.parent = void 0, n.parentBranch = void 0;
    }), this.isDirty = true, i;
  }
  get hasChildren() {
    return this.children.length > 0;
  }
  get children() {
    let e = [];
    for (let r of this._rows) for (let i of r) if (i) for (let n of i) e.push(...n.children), e.push(n);
    return [...e, ...super.children];
  }
  render(e) {
    var K, N, j, D, W, ie;
    let r = new P({ parent: e, mathstyle: this.mathstyleName }, this.style), i = r.getRegisterAsEm("arrayrulewidth"), n = r.getRegisterAsEm("arraycolsep"), o = r.getRegisterAsEm("doublerulesep"), a = (N = (K = this.arraystretch) != null ? K : r.getRegisterAsNumber("arraystretch")) != null ? N : 1, s = typeof this.arraycolsep == "number" ? this.arraycolsep : n;
    this.colSeparationType === "small" && (s = 0.2778 * (new P({ parent: e, mathstyle: "scriptstyle" }).scalingFactor / e.scalingFactor));
    let l = a * T0, c = 0.7 * l, u = 0.3 * l, d = 0, m = [], p = 0, f = this._rows.length;
    for (let X = 0; X < f; ++X) {
      let ye = this._rows[X];
      p = Math.max(p, ye.length);
      let xe = new P({ parent: r, mathstyle: this.mathstyleName }, this.style), Pe = c / xe.scalingFactor, At = u / xe.scalingFactor, ue = { cells: [], height: 0, depth: 0, pos: 0 };
      for (let Xr of ye) {
        let br = this.isMultiline && Xr && dg(Xr) ? mg(Xr, xe, { height: c / xe.scalingFactor, depth: u / xe.scalingFactor }) : (j = x.createBox(xe, Xr, { type: "ignore" })) != null ? j : new w(null, { type: "ignore" });
        At = Math.max(At, br.depth), Pe = Math.max(Pe, br.height), ue.cells.push(br);
      }
      let we = (D = qa(this.rowGaps[X])) != null ? D : 0;
      we > 0 && (we += u, At = Math.max(At, we), we = 0), X < f - 1 && !Xa(this.environmentName) && this.environmentName !== "cases" && this.environmentName !== "array" && (At += r.getRegisterAsEm("jot")), ue.height = Pe, ue.depth = At, d += Pe, ue.pos = d, d += At + we, m.push(ue);
    }
    let y = this.environmentName === "array" && !this.isMultiline ? m[0].height : d / 2 + Ie, v = [];
    for (let X = 0; X < p; X++) {
      let ye = [];
      for (let xe of m) {
        let Pe = xe.cells[X];
        Pe && (Pe.depth = xe.depth, Pe.height = xe.height, ye.push({ box: Pe, shift: xe.pos - y }));
      }
      ye.length > 0 && v.push(new te({ individualShift: ye }));
    }
    let b = [], k = false, S = false, A = 0, E = !this.leftDelim, { colFormat: C } = this;
    for (let X of C) {
      if ("align" in X && A >= v.length) break;
      if ("align" in X) k ? b.push(Ya(2 * s)) : (S || E) && b.push(Ya(s)), b.push(new w(v[A], { classes: "col-align-" + X.align })), A++, k = true, S = false, E = false;
      else if ("gap" in X) {
        if (typeof X.gap == "number") b.push(Ya(X.gap));
        else {
          let ye = fg(e, m, y, X.gap);
          ye && b.push(ye);
        }
        k = false, S = false, E = false;
      } else if ("separator" in X) {
        let ye = new w(null, { classes: "ML__vertical-separator" });
        ye.height = d, ye.setStyle("height", d, "em"), ye.setStyle("border-right", `${i}em ${X.separator} currentColor`), ye.setStyle("vertical-align", -(d - y), "em");
        let xe = 0;
        S ? xe = o - i : k && (xe = s - i), ye.left = xe, b.push(ye), k = false, S = true, E = false;
      }
    }
    k && !this.rightDelim && b.push(Ya(s));
    let _ = new w(b, { classes: ["ML__mtable", ...this.classes].join(" ") });
    if (this.environmentName === "array" && !this.isMultiline && (_.height = m[0].height, _.depth = d - m[0].height), (!this.leftDelim || this.leftDelim === ".") && (!this.rightDelim || this.rightDelim === ".")) return this.caret && (_.caret = this.caret), this.bind(e, _);
    let O = _.height, I = _.depth, V = this.bind(e, new w([this.bind(e, hi("open", (W = this.leftDelim) != null ? W : ".", O, I, r, { isSelected: this.isSelected })), _, this.bind(e, hi("close", (ie = this.rightDelim) != null ? ie : ".", O, I, r, { isSelected: this.isSelected }))], { type: "ord" }));
    return V ? (V.setStyle("display", "inline-block"), this.caret && (V.caret = this.caret), this.bind(e, this.attachSupsub(e, { base: V }))) : null;
  }
  _serialize(e) {
    var i;
    let r = [];
    if (this.environmentName === "lines" && this._rows.length > 1 ? r.push("\\displaylines{") : this.environmentName !== "lines" && r.push(`\\begin{${this.environmentName}}`), this.environmentName === "array") {
      if (r.push("{"), this.colFormat !== void 0) for (let n of this.colFormat) "align" in n && typeof n.align == "string" ? r.push(n.align) : "separator" in n && n.separator === "solid" ? r.push("|") : "separator" in n && n.separator === "dashed" && r.push(":");
      r.push("}");
    }
    for (let n = 0; n < this._rows.length; n++) {
      for (let o = 0; o < this._rows[n].length; o++) o > 0 && r.push(" & "), r.push(x.serialize(this._rows[n][o], e));
      if (n < this._rows.length - 1) {
        let o = this.rowGaps[n];
        o != null && o.dimension ? r.push(`\\\\[${o.dimension} ${(i = o.unit) != null ? i : "pt"}] `) : r.push("\\\\ ");
      }
    }
    return this.environmentName === "lines" && this._rows.length > 1 ? r.push("}") : this.environmentName !== "lines" && r.push(`\\end{${this.environmentName}}`), R(r);
  }
  forEachCell(e) {
    for (let r = 0; r < this.rowCount; r++) for (let i = 0; i < this.colCount; i++) e(this._rows[r][i], r, i);
  }
  getCell(e, r) {
    var i;
    return (i = this._rows[e]) == null ? void 0 : i[r];
  }
  setCell(e, r, i) {
    this.type === "array" && Array.isArray(this._rows) && this._rows[e][r];
    for (let o of this._rows[e][r]) o.parent = void 0, o.parentBranch = void 0;
    let n = [new x({ type: "first", mode: this.mode }), ...i.filter((o) => o.type !== "first")];
    this._rows[e][r] = n, pi(this), this.isDirty = true;
  }
  addRowBefore(e) {
    this.type === "array" && Array.isArray(this._rows), this._rows.splice(e, 0, Array.from({ length: this.colCount }, () => Za(this, !this.isMultiline))), pi(this), this.isDirty = true;
  }
  addRowAfter(e) {
    this.type === "array" && Array.isArray(this._rows), this._rows.splice(e + 1, 0, Array.from({ length: this.colCount }, () => Za(this, !this.isMultiline))), pi(this), this.isDirty = true;
  }
  removeRow(e) {
    this.type === "array" && Array.isArray(this._rows) && this.rowCount > e;
    let r = this._rows.splice(e, 1);
    for (let i of r) for (let n of i) if (n) for (let o of n) o.parent = void 0, o.parentBranch = void 0;
    pi(this), this.isDirty = true;
  }
  addColumnBefore(e) {
    this.type === "array" && Array.isArray(this._rows);
    for (let r of this._rows) r.splice(e, 0, Za(this));
    pi(this), this.isDirty = true;
  }
  addColumnAfter(e) {
    this.type === "array" && Array.isArray(this._rows);
    for (let r of this._rows) r.splice(e + 1, 0, Za(this));
    pi(this), this.isDirty = true;
  }
  addColumn() {
    this.addColumnAfter(this.colCount - 1);
  }
  removeColumn(e) {
    this.type === "array" && Array.isArray(this._rows) && this.colCount > e;
    for (let r of this._rows) {
      let i = r.splice(e, 1);
      for (let n of i) if (n) for (let o of n) o.parent = void 0, o.parentBranch = void 0;
    }
    pi(this), this.isDirty = true;
  }
  get cells() {
    let e = [];
    for (let r of this._rows) for (let i of r) i && e.push(i.filter((n) => n.type !== "first"));
    return e;
  }
  get rows() {
    return this._rows;
  }
};
function Za(t38, e = false) {
  let r = new x({ type: "first", mode: t38.mode });
  r.parent = t38;
  let i = [r];
  if (e) {
    let n = new Me();
    n.parent = t38, i.push(n);
  }
  return i;
}
function pi(t38) {
  for (let e = 0; e < t38.rowCount; e++) for (let r = 0; r < t38.colCount; r++) {
    let i = t38.getCell(e, r);
    if (i) for (let n of i) n && (n.parent = t38, n.parentBranch = [e, r]);
  }
}
function Ya(t38) {
  let e = new w(null, { classes: "ML__arraycolsep" });
  return e.width = t38, e;
}
function fg(t38, e, r, i) {
  if (!i) return null;
  let n = [];
  for (let o of e) {
    let a = x.createBox(t38, i, { type: "ignore" });
    a && (a.depth = o.depth, a.height = o.height, n.push({ box: a, shift: o.pos - r }));
  }
  return new te({ individualShift: n }).wrap(t38);
}
var at = class t8 extends x {
  constructor(e) {
    super({ mode: e.mode, command: e.command, style: e.style, body: e.body, type: "box" }), this.framecolor = e.framecolor, this.backgroundcolor = e.backgroundcolor, this.padding = e.padding, this.offset = e.offset, this.border = e.border;
  }
  static fromJson(e) {
    return new t8(e);
  }
  toJson() {
    return g(h({}, super.toJson()), { framecolor: this.framecolor, backgroundcolor: this.backgroundcolor, padding: this.padding, offset: this.offset, border: this.border });
  }
  render(e) {
    var c, u, d, m;
    let r = x.createBox(e, this.body, { type: "lift" });
    if (!r) return null;
    let i = e.toEm((c = this.offset) != null ? c : { dimension: 0 });
    r.depth += i, r.setStyle("display", "inline-block"), r.setStyle("position", "relative"), r.setStyle("height", Math.floor(100 * r.height + r.depth) / 100, "em"), r.setStyle("vertical-align", -Math.floor(100 * r.height) / 100, "em");
    let n = new P({ parent: e }, this.style), o = n.toEm((u = this.padding) != null ? u : { register: "fboxsep" }), a = new w(null, { classes: "ML__box" });
    a.height = r.height + o, a.depth = r.depth + o, a.setStyle("box-sizing", "border-box"), a.setStyle("position", "absolute"), a.setStyle("top", -o + 0.3, "em"), a.setStyle("left", 0), a.setStyle("height", a.height + a.depth, "em"), a.setStyle("width", "100%"), this.backgroundcolor && a.setStyle("background-color", (d = n.toBackgroundColor(this.backgroundcolor)) != null ? d : "transparent"), this.framecolor && a.setStyle("border", `${n.getRegisterAsEm("fboxrule", 2)}em solid ${(m = n.toColor(this.framecolor)) != null ? m : "black"}`);
    let s = $a(this.border);
    s && a.setStyle("border", s);
    let l = new w([a, r], { type: "lift" });
    return l.setStyle("display", "inline-block"), l.setStyle("position", "relative"), l.setStyle("line-height", 0), l.height = r.height + o + (i > 0 ? i : 0), l.depth = r.depth + o + (i < 0 ? -i : 0), l.setStyle("padding-left", o, "em"), l.setStyle("padding-right", o, "em"), l.setStyle("height", Math.floor(100 * (r.height + r.depth + 2 * o + Math.abs(i))) / 100, "em"), l.setStyle("margin-top", -o, "em"), l.setStyle("top", Math.floor(100 * (r.depth - r.height + 2 * o - i)) / 100, "em"), l.setStyle("vertical-align", Math.floor(100 * (r.depth + 2 * o)) / 100, "em"), this.caret && (l.caret = this.caret), this.attachSupsub(e, { base: l });
  }
  _serialize(e) {
    return e.skipStyles ? R([this.bodyToLatex(e), this.supsubToLatex(e)]) : super._serialize(e);
  }
};
var sn = class t9 extends x {
  constructor(e, r) {
    var i;
    super({ type: "composition", mode: (i = r == null ? void 0 : r.mode) != null ? i : "math", value: e });
  }
  static fromJson(e) {
    return new t9(e.value, e);
  }
  toJson() {
    return super.toJson();
  }
  render(e) {
    let r = new w(this.value, { classes: "ML__composition", type: "composition" });
    return this.bind(e, r), this.caret && (r.caret = this.caret), r;
  }
  _serialize(e) {
    return "";
  }
};
var gt = class t10 extends x {
  constructor(e) {
    super({ type: "error", value: e, command: e, mode: "math" }), this.verbatimLatex = e;
  }
  static fromJson(e) {
    return new t10(e.command);
  }
  toJson() {
    return super.toJson();
  }
  render(e) {
    let r = this.createBox(e, { classes: "ML__error" });
    return this.caret && (r.caret = this.caret), r;
  }
};
var ln = class t11 extends x {
  constructor(e, r) {
    super({ type: "group", mode: r }), this.body = e, this.boxType = e.length > 1 ? "ord" : "ignore", this.skipBoundary = true, this.displayContainsHighlight = false, (e == null ? void 0 : e.length) === 1 && e[0].command === "," && (this.captureSelection = true);
  }
  static fromJson(e) {
    return new t11(e.body, e.mode);
  }
  render(e) {
    let r = x.createBox(e, this.body, { type: this.boxType });
    return r ? (this.caret && (r.caret = this.caret), this.bind(e, r)) : null;
  }
  _serialize(e) {
    if (!(e.expandMacro || e.skipStyles || e.skipPlaceholders) && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    return r != null && r.serialize ? r.serialize(this, e) : `{${this.bodyToLatex(e)}}`;
  }
};
var J = class t12 extends x {
  constructor(e, r, i) {
    super({ type: "leftright", style: i.style, displayContainsHighlight: true }), this.variant = e, this.body = r, this.leftDelim = i.leftDelim, this.rightDelim = i.rightDelim;
  }
  static fromJson(e) {
    var r;
    return new t12((r = e.variant) != null ? r : "", e.body, e);
  }
  toJson() {
    let e = super.toJson();
    return this.variant && (e.variant = this.variant), this.leftDelim && (e.leftDelim = this.leftDelim), this.rightDelim && (e.rightDelim = this.rightDelim), e;
  }
  _serialize(e) {
    var i, n;
    let r = this.matchingRightDelim();
    return this.variant === "left...right" ? R(["\\left", (i = this.leftDelim) != null ? i : ".", this.bodyToLatex(e), "\\right", r]) : this.variant === "mleft...mright" ? R(["\\mleft", (n = this.leftDelim) != null ? n : ".", this.bodyToLatex(e), "\\mright", r]) : R([!this.leftDelim || this.leftDelim === "." ? "" : this.leftDelim, this.bodyToLatex(e), r]);
  }
  matchingRightDelim() {
    var r, i;
    if (this.rightDelim && this.rightDelim !== "?") return this.rightDelim;
    let e = (r = this.leftDelim) != null ? r : ".";
    return (i = nn[e]) != null ? i : e;
  }
  render(e) {
    var d, m;
    let r = new P({ parent: e }, this.style);
    this.body;
    let i = new P({ parent: e, mathstyle: "textstyle" }, this.style), n = (d = x.createBox(r, this.body, { type: "inner" })) != null ? d : new w(null, { type: "inner" }), o = n.height / i.scalingFactor, a = n.depth / i.scalingFactor, s = [];
    if (this.leftDelim && s.push(this.bind(i, hi("open", this.leftDelim, o, a, i, { isSelected: this.isSelected, classes: "ML__open" + (this.containsCaret ? " ML__contains-caret" : ""), mode: this.mode, style: this.style }))), n && (gh(n.children, this, r, o, a), s.push(n)), this.rightDelim) {
      let p = this.containsCaret ? " ML__contains-caret" : "", f = this.rightDelim;
      f === "?" && (r.smartFence ? (f = this.matchingRightDelim(), p += " ML__smart-fence__close") : f = "."), s.push(this.bind(i, hi("close", f, o, a, i, { isSelected: this.isSelected, classes: p + " ML__close", mode: this.mode, style: this.style })));
    }
    let l = this.variant === "mleft...mright", c = this.leftSibling;
    c && (!l && c.isFunction && (l = true), !l && c.type === "subsup" && ((m = c.leftSibling) != null && m.isFunction) && (l = true));
    let u = new w(s, { type: l ? "close" : "inner", classes: "ML__left-right" });
    return u.setStyle("margin-top", `${-n.depth}em`), u.setStyle("height", `${n.height + n.depth}em`), this.caret && (u.caret = this.caret), this.bind(r, u.wrap(r));
  }
};
function gh(t38, e, r, i, n) {
  if (t38) for (let o = 0; o < t38.length; o++) {
    let a = t38[o];
    a.type === "middle" ? (t38[o] = e.bind(r, hi("inner", a.value, i, n, r, { isSelected: e.isSelected })), t38[o].caret = a.caret, t38[o].isSelected = a.isSelected, t38[o].cssId = a.cssId, t38[o].htmlData = a.htmlData, t38[o].htmlStyle = a.htmlStyle, t38[o].attributes = a.attributes, t38[o].cssProperties = a.cssProperties) : a.children && gh(a.children, e, r, i, n);
  }
}
var cn = class t13 extends x {
  constructor(e, r) {
    var i;
    super({ type: "macro", command: e, style: r.style }), this.body = r.body, r.captureSelection === void 0 ? r.args ? this.captureSelection = false : this.captureSelection = true : this.captureSelection = r.captureSelection, this.macroArgs = r.args, this.expand = (i = r.expand) != null ? i : false;
  }
  static fromJson(e) {
    return new t13(e.command, e);
  }
  toJson() {
    let e = super.toJson();
    return this.expand && (e.expand = true), this.captureSelection !== void 0 && (e.captureSelection = this.captureSelection), this.macroArgs && (e.args = this.macroArgs), e;
  }
  _serialize(e) {
    var r;
    return e.expandMacro && this.expand ? this.bodyToLatex(e) : this.command + ((r = this.macroArgs) != null ? r : "");
  }
  applyStyle(e, r) {
    let i = {};
    e.color && (i.color = e.color), e.backgroundColor && (i.backgroundColor = e.backgroundColor), super.applyStyle(i, r);
  }
  render(e) {
    let r = x.createBox(e, this.body, { type: "lift" });
    return r ? (this.caret && (r.caret = this.caret), this.bind(e, r)) : null;
  }
}, Qa = class t14 extends x {
  constructor() {
    super({ type: "macro-argument" });
  }
  static fromJson(e) {
    return new t14();
  }
  toJson() {
    return super.toJson();
  }
  _serialize(e) {
    return "";
  }
  render(e) {
    return null;
  }
};
var un = class t15 extends x {
  constructor(e, r, i = false, n, o) {
    var a;
    super({ type: "prompt", mode: (a = o == null ? void 0 : o.mode) != null ? a : "math", style: o == null ? void 0 : o.style, command: "\\placeholder" }), this.body = n, this.correctness = r, this.placeholderId = e, this.locked = i, this.captureSelection = this.locked;
  }
  static fromJson(e) {
    return new t15(e.placeholderId, e.correctness, e.locked, e.body, e);
  }
  toJson() {
    let e = super.toJson();
    return this.placeholderId && (e.placeholderId = this.placeholderId), this.body || delete e.body, this.body && (e.body = this.body.filter((r) => r.type !== "first").map((r) => r.toJson())), this.correctness && (e.correctness = this.correctness), e.locked = this.locked, e;
  }
  render(e) {
    var C, _, O, I, V;
    let r = new P({ parent: e }), i = r.getRegisterAsEm("fboxsep"), n = i, o = i, a = x.createBox(e, this.body);
    if (!a) return null;
    let l = !this.body || this.body.length === 0 || this.body.every((K) => K.type === "first") ? new Me({ mode: this.mode, style: this.style }).render(new P({ parent: e, isPhantom: true })) : null, c = (C = l == null ? void 0 : l.height) != null ? C : r.metrics.xHeight, u = (_ = l == null ? void 0 : l.depth) != null ? _ : c / 2, d = Math.max((O = a.height) != null ? O : 0, c), m = Math.max((I = a.depth) != null ? I : 0, u);
    a.setStyle("vertical-align", `calc(-${d}em + 2px)`), this.correctness === "correct" ? a.setStyle("color", "var(--correct-color, var(--ML__correct-color))") : this.correctness === "incorrect" && a.setStyle("color", "var(--incorrect-color, var(--ML__incorrect-color))");
    let f = d + m + 2 * o - 2 * n, y = new w(a, { type: "ord" });
    y.setStyle("display", "inline-block"), y.height = d, y.depth = m, y.setStyle("height", d + m, "em"), y.setStyle("vertical-align", -o, "em"), ((V = a.width) != null ? V : 0) < f && (y.width = f, y.setStyle("width", f, "em"));
    let v = "ML__prompt ";
    this.locked ? v += " ML__lockedPromptBox " : v += " ML__editablePromptBox ", this.correctness === "correct" ? v += " ML__correctPromptBox " : this.correctness === "incorrect" && (v += " ML__incorrectPromptBox "), this.containsCaret && (v += " ML__focusedPromptBox ");
    let b = new w(null, { classes: v, attributes: { part: "prompt" } });
    b.height = y.height + o, b.depth = y.depth + o, b.width = y.width + 2 * n, b.setStyle("position", "absolute"), b.setStyle("height", y.height + y.depth + 2 * o, "em"), n === 0 && b.setStyle("width", "100%"), n !== 0 && (b.setStyle("width", `calc(100% + ${2 * n}em)`), b.setStyle("top", i, "em"), b.setStyle("left", -n, "em"));
    let k = "";
    this.correctness === "incorrect" && (k += '<line x1="3%"  y1="97%" x2="97%" y2="3%" stroke-width="0.5" stroke="var(--incorrect-color, var(--ML__incorrect-color))" stroke-linecap="round" />'), k && (b.svgOverlay = k);
    let S = new w([b, y], { classes: "ML__prompt-atom" });
    y.setStyle("line-height", 1), S.setStyle("position", "relative"), S.setStyle("display", "inline-block"), S.setStyle("line-height", 0), S.height = d + o + 0.2, S.depth = m + o, S.left = n, S.right = n, S.setStyle("height", d + 2 * o, "em"), S.setStyle("top", m - d - o / 2, "em"), S.setStyle("vertical-align", y.depth, "em"), S.setStyle("margin-left", 0.5, "em"), S.setStyle("margin-right", 0.5, "em"), this.caret && (S.caret = this.caret);
    let A = this.attachSupsub(e, { base: S }), E = this.bind(r, A);
    return E && this.id && (b.atomID = this.id, y.atomID = this.id, S.atomID = this.id), E;
  }
  _serialize(e) {
    var n;
    let r = (n = this.bodyToLatex(e)) != null ? n : "";
    if (e.skipPlaceholders) return r;
    let i = "\\placeholder";
    return this.placeholderId && (i += `[${this.placeholderId}]`), this.correctness === "correct" ? i += "[correct]" : this.correctness === "incorrect" && (i += "[incorrect]"), this.locked && (i += "[locked]"), U(i, r);
  }
};
var cr = class t16 extends x {
  constructor(e) {
    super({ type: "subsup", style: e == null ? void 0 : e.style }), this.subsupPlacement = "auto";
  }
  get children() {
    if (!this._children) {
      let e = [], r = this.branch("subscript");
      if (r) for (let n of r) e.push(...n.children), e.push(n);
      let i = this.branch("superscript");
      if (i) for (let n of i) e.push(...n.children), e.push(n);
      this._children = e;
    }
    return this._children;
  }
  static fromJson(e) {
    let r = new t16(e);
    for (let i of Ir) e[i] && r.setChildren(e[i], i);
    return r;
  }
  render(e) {
    var a;
    let r = new P({ parent: e, isPhantom: true }), i = this.leftSibling, n = (a = i.render(r)) != null ? a : new w(null), o = new w(null);
    return o.height = n.height, o.depth = n.depth, this.attachSupsub(e, { base: o, isCharacterBox: i.isCharacterBox(), type: "ignore" });
  }
  _serialize(e) {
    return this.supsubToLatex(e);
  }
};
function dn(t38) {
  return t38 ? !/^(<$$>|<$>|<space>|<{>|<}>|#[0-9\?]|\\.+)$/.test(t38) : false;
}
var es = class {
  constructor(e, r, i) {
    this.errors = [];
    this.index = 0;
    this.endCount = 0;
    var n, o, a, s;
    i != null || (i = {}), this.tokens = e, this.context = r instanceof P && !(i != null && i.parseMode) && !i.mathstyle ? r : new P({ from: r, mathstyle: i.mathstyle }, i.style), this.args = (n = i.args) != null ? n : void 0, this.smartFence = this.context.smartFence, this.parsingContext = { parent: void 0, mathlist: [], style: (o = i.style) != null ? o : {}, parseMode: (a = i.parseMode) != null ? a : "math", mathstyle: (s = i.mathstyle) != null ? s : "displaystyle", tabular: false };
  }
  beginContext(e) {
    var n, o, a, s, l, c;
    if (e != null && e.root) {
      this.parsingContext = { parent: this.parsingContext.parent, mathlist: [], style: {}, parseMode: (n = e == null ? void 0 : e.mode) != null ? n : "math", mathstyle: (o = e == null ? void 0 : e.mathstyle) != null ? o : "displaystyle", tabular: (a = e == null ? void 0 : e.tabular) != null ? a : false };
      return;
    }
    let r = this.parsingContext, i = { parent: r, mathlist: [], style: h({}, r.style), parseMode: (s = e == null ? void 0 : e.mode) != null ? s : r.parseMode, mathstyle: (l = e == null ? void 0 : e.mathstyle) != null ? l : r.mathstyle, tabular: (c = e == null ? void 0 : e.tabular) != null ? c : false };
    this.parsingContext = i;
  }
  endContext() {
    this.parsingContext = this.parsingContext.parent;
  }
  onError(e) {
    this.errors.push(h({ before: Dr(this.tokens.slice(this.index, this.index + 10)), after: Dr(this.tokens.slice(Math.max(0, this.index - 10), this.index)) }, e));
  }
  get mathlist() {
    return this.parsingContext.mathlist;
  }
  set mathlist(e) {
    this.parsingContext.mathlist = e;
  }
  get parseMode() {
    return this.parsingContext.parseMode;
  }
  set parseMode(e) {
    this.parsingContext.parseMode = e;
  }
  get tabularMode() {
    return this.parsingContext.tabular;
  }
  get style() {
    let e = this.parsingContext;
    for (; e; ) {
      if (e.style) return h({}, e.style);
      e = e.parent;
    }
    return {};
  }
  set style(e) {
    this.parsingContext.style = e;
  }
  end() {
    return this.endCount++, this.index >= this.tokens.length || this.endCount > 1e3;
  }
  next() {
    this.index += 1;
  }
  get() {
    return this.endCount = 0, this.index < this.tokens.length ? this.tokens[this.index++] : "";
  }
  peek() {
    return this.tokens[this.index];
  }
  expandUnicode() {
    if (!this.peek() || this.parseMode !== "math") return;
    let e = Bu(this.peek());
    e && this.tokens.splice(this.index, 1, ...Ji(e));
  }
  match(e) {
    return this.tokens[this.index] === e ? (this.index++, true) : false;
  }
  lastSubsupAtom() {
    let e;
    return this.mathlist.length > 0 && (e = this.mathlist[this.mathlist.length - 1], e.type === "subsup" || e.subsupPlacement !== void 0) || (e = new cr({ style: this.style }), this.mathlist.push(e)), e;
  }
  hasPattern(e) {
    return e.test(this.tokens[this.index]);
  }
  hasInfixCommand() {
    var r;
    let { index: e } = this;
    if (e < this.tokens.length && this.tokens[e].startsWith("\\")) {
      let i = ne(this.tokens[e], this.parseMode);
      return !i || i.definitionType === "symbol" || i.ifMode && !i.ifMode.includes(this.parseMode) ? false : (r = i.infix) != null ? r : false;
    }
    return false;
  }
  matchColumnSeparator() {
    return !this.tabularMode || this.peek() !== "&" ? false : (this.index++, true);
  }
  matchRowSeparator() {
    if (!this.tabularMode) return false;
    let e = this.peek();
    return e !== "\\\\" && e !== "\\cr" && e !== "\\tabularnewline" ? false : (this.index++, true);
  }
  placeholder() {
    var r;
    let e = (r = this.args) == null ? void 0 : r.call(this, "?");
    return e ? be(e, { parseMode: this.parseMode, mathstyle: "textstyle" }) : [new Me({ mode: this.parseMode, style: this.style })];
  }
  skipWhitespace() {
    for (; this.match("<space>"); ) ;
  }
  skipUntilToken(e) {
    let r = this.tokens[this.index];
    for (; r && r !== e; ) r = this.tokens[++this.index];
    r === e && this.index++;
  }
  skipFiller() {
    for (; this.match("\\relax") || this.match("<space>"); ) ;
  }
  matchKeyword(e) {
    let r = this.index, i = this.end(), n = "";
    for (; !i; ) {
      let a = this.get();
      dn(a) ? (n += a, i = this.end() || n.length >= e.length) : i = true;
    }
    let o = e.toUpperCase() === n.toUpperCase();
    return o || (this.index = r), o;
  }
  scanString() {
    let e = "";
    for (; !this.end(); ) {
      let r = this.peek();
      if (r === "]") return e;
      if (r === "<space>") e += " ";
      else if (r.startsWith("\\")) this.onError({ code: "unexpected-command-in-string" }), e += r.substring(1);
      else if (dn(r)) e += r;
      else return e;
      this.next();
    }
    return e;
  }
  scanBalancedString() {
    let e = "", r = this.end(), i = 1;
    for (; !r; ) {
      let n = this.get();
      n === "<space>" ? e += " " : n === "<{>" ? (e += "{", i += 1) : n === "<}>" ? (i -= 1, i > 0 ? e += "}" : this.index -= 1) : n === "<$>" ? e += "$" : n === "<$$>" ? e += "$$" : e += n, r = i === 0 || this.end();
    }
    return e;
  }
  scanLiteralGroup() {
    var i;
    if (!this.match("<{>")) return "";
    let e = "", r = 1;
    for (; r > 0 && !this.end(); ) {
      let n = this.get();
      n === "<}>" ? (r -= 1, r > 0 && (e += "}")) : n === "<{>" ? (r += 1, e += "{") : (/\\[a-zA-Z]+$/.test(e) && /^[a-zA-Z]/.test(n) && (e += " "), e += (i = { "<space>": " ", "<$$>": "$$", "<$>": "$" }[n]) != null ? i : n);
    }
    return e;
  }
  scanNumber(e = true) {
    var l, c;
    let r = false, i = this.peek();
    for (; i === "<space>" || i === "+" || i === "-"; ) this.get(), i === "-" && (r = !r), i = this.peek();
    e = !!e;
    let n = 10, o = /\d/;
    if (this.match("'")) n = 8, o = /[0-7]/, e = true;
    else if (this.match('"')) n = 16, o = /[\dA-F]/, e = true;
    else if (this.match("x")) n = 16, o = /[\dA-Fa-f]/, e = true;
    else if (this.match("`")) return i = this.get(), i ? i.length === 2 && i.startsWith("\\") ? { number: (r ? -1 : 1) * ((l = i.codePointAt(1)) != null ? l : 0), base: "alpha" } : { number: (r ? -1 : 1) * ((c = i.codePointAt(0)) != null ? c : 0), base: "alpha" } : null;
    let a = "";
    for (; this.hasPattern(o); ) a += this.get();
    if (!e && (this.match(".") || this.match(","))) for (a += "."; this.hasPattern(o); ) a += this.get();
    let s = e ? Number.parseInt(a, n) : Number.parseFloat(a);
    return Number.isNaN(s) ? null : { number: r ? -s : s, base: n === 16 ? "hexadecimal" : n === 8 ? "octal" : "decimal" };
  }
  scanRegister() {
    var o;
    let e = this.index, r = this.scanNumber(false);
    if (this.skipWhitespace(), this.match("\\relax")) return r;
    let i = false;
    if (r === null) for (; ; ) {
      let a = this.peek();
      if (a === "-") i = !i;
      else if (a !== "+") break;
      this.next(), this.skipWhitespace();
    }
    if (this.match("\\global")) {
      this.skipWhitespace();
      let a = this.get();
      return a.startsWith("\\") ? r ? { register: a, global: true, factor: (i ? -1 : 1) * r.number } : i ? { register: a, global: true, factor: -1 } : { register: a, global: true } : (this.index = e, null);
    }
    let n = this.get();
    return n != null && n.startsWith("\\") ? (n = n.substring(1), this.context.registers[n] ? !i || r !== null ? { register: n, factor: (i ? -1 : 1) * ((o = r == null ? void 0 : r.number) != null ? o : 1) } : { register: n } : (this.index = e, null)) : (this.index = e, null);
  }
  scanValue() {
    let e = this.scanRegister();
    if (e) return e;
    let r = this.index, i = this.scanGlueOrDimen();
    if (i && ("unit" in i || "glue" in i && "unit" in i.glue)) return i;
    this.index = r;
    let n = this.scanNumber();
    if (n) return n;
    if (this.end() || !dn(this.peek())) return null;
    let o = this.scanString();
    return o.length > 0 ? { string: o } : null;
  }
  scanDimen() {
    let e = this.scanNumber(false);
    if (e === null) return null;
    let r = e.number;
    this.skipWhitespace(), this.matchKeyword("true"), this.skipWhitespace();
    let i;
    return this.matchKeyword("pt") ? i = "pt" : this.matchKeyword("mm") ? i = "mm" : this.matchKeyword("cm") ? i = "cm" : this.matchKeyword("ex") ? i = "ex" : this.matchKeyword("px") ? i = "px" : this.matchKeyword("em") ? i = "em" : this.matchKeyword("bp") ? i = "bp" : this.matchKeyword("dd") ? i = "dd" : this.matchKeyword("pc") ? i = "pc" : this.matchKeyword("in") ? i = "in" : this.matchKeyword("mu") && (i = "mu"), i ? { dimension: r, unit: i } : { dimension: r };
  }
  scanGlueOrDimen() {
    let e = this.scanDimen();
    if (e === null) return null;
    if (this.skipWhitespace(), this.match("\\relax")) return e;
    let r = { glue: e };
    if (this.matchKeyword("plus")) {
      let i = this.scanDimen();
      if (i) r.grow = i;
      else return r;
    }
    if (this.skipWhitespace(), this.match("\\relax")) return r;
    if (this.skipWhitespace(), this.matchKeyword("minus")) {
      let i = this.scanDimen();
      if (i) r.shrink = i;
      else return r;
    }
    return !r.grow && !r.shrink ? e : r;
  }
  scanColspec() {
    this.skipWhitespace();
    let e = [];
    for (; !this.end() && !(this.peek() === "<}>" || this.peek() === "]"); ) {
      let r = this.get();
      r === "c" || r === "r" || r === "l" ? e.push({ align: r }) : r === "|" ? e.push({ separator: "solid" }) : r === ":" ? e.push({ separator: "dashed" }) : r === "@" && (this.match("<{>") && (this.beginContext({ mode: "math" }), e.push({ gap: this.scan((i) => i === "<}>") }), this.endContext()), this.match("<}>") || this.onError({ code: "unbalanced-braces" }));
    }
    return e;
  }
  scanModeSet() {
    let e;
    if (this.match("\\(") && (e = "textstyle"), !e && this.match("\\[") && (e = "displaystyle"), !e) return null;
    this.beginContext({ mode: "math", mathstyle: e });
    let r = this.scan((i) => i === (e === "displaystyle" ? "\\]" : "\\)"));
    return this.match(e === "displaystyle" ? "\\]" : "\\)") || this.onError({ code: "unbalanced-mode-shift" }), this.endContext(), r;
  }
  scanModeShift() {
    let e = "";
    if (this.match("<$>") && (e = "<$>"), !e && this.match("<$$>") && (e = "<$$>"), !e) return null;
    this.beginContext({ mode: "math", mathstyle: e === "<$>" ? "textstyle" : "displaystyle" });
    let r = this.scan((i) => i === e);
    return this.match(e) || this.onError({ code: "unbalanced-mode-shift" }), this.endContext(), r;
  }
  scanEnvironment() {
    if (!this.match("\\begin")) return null;
    let e = this.scanArgument("string");
    if (!e) return null;
    let r = Iu(e);
    if (!r) return this.onError({ code: "unknown-environment", arg: e }), null;
    let i = [];
    if (r.params) for (let l of r.params) if (l.isOptional) i.push(this.scanOptionalArgument(l.type));
    else {
      let c = this.scanArgument(l.type);
      c || this.onError({ code: "missing-argument", arg: e }), i.push(c);
    }
    this.beginContext({ tabular: r.tabular, root: r.rootOnly });
    let n = [], o = [], a = [], s = false;
    do
      if (this.end() && (this.onError({ code: "unbalanced-environment", arg: e }), s = true), !s && this.match("\\end") && (this.scanArgument("string") !== e && this.onError({ code: "unbalanced-environment", arg: e }), s = true), !s) if (this.matchColumnSeparator()) a.push(this.mathlist), this.mathlist = [];
      else if (this.matchRowSeparator()) {
        a.push(this.mathlist), this.mathlist = [];
        let l = null;
        this.skipWhitespace(), this.match("[") && (l = this.scanDimen(), this.skipWhitespace(), this.match("]")), o.push(l != null ? l : { dimension: 0 }), n.push(a), a = [];
      } else this.mathlist.push(...this.scan((l) => ["<}>", "&", "\\end", "\\cr", "\\\\", "\\tabularnewline"].includes(l)));
    while (!s);
    return a.push(this.mathlist), a.length > 0 && n.push(a), this.endContext(), r.rootOnly && (this.index = this.tokens.length), r.createAtom(e, n, o, i, this.context.maxMatrixCols);
  }
  scanExpression() {
    let e = this.mathlist;
    if (this.mathlist = [], this.parseExpression()) {
      let r = this.mathlist;
      return this.mathlist = e, r;
    }
    return this.mathlist = e, null;
  }
  scan(e) {
    this.beginContext(), e || (e = (s) => s === "<}>");
    let r = "", i = null, n = [], o = null;
    for (; !this.end() && !e(this.peek()); ) this.hasInfixCommand() && !r ? (r = this.get(), i = ne(r, "math"), i && (n = this.scanArguments(i)[1]), o = this.mathlist, this.mathlist = []) : this.parseExpression();
    let a;
    return r ? (n.unshift(this.mathlist), o && n.unshift(o), a = [i.createAtom({ command: r, args: n, style: this.style, mode: this.parseMode })]) : a = this.mathlist, this.endContext(), a;
  }
  scanGroup() {
    let e = this.index;
    if (!this.match("<{>")) return null;
    let r = this.scan((n) => n === "<}>");
    if (this.match("<}>") || this.onError({ code: "unbalanced-braces" }), r.length === 1 && r[0].type === "placeholder") return r[0];
    let i = new ln(r, this.parseMode);
    return i.verbatimLatex = Dr(this.tokens.slice(e, this.index)), i;
  }
  scanSmartFence() {
    if (this.skipWhitespace(), !this.match("(")) return null;
    this.beginContext();
    let e = 1;
    for (; !this.end() && e !== 0; ) this.match("(") && (e += 1), this.match(")") && (e -= 1), e !== 0 && this.parseExpression();
    let r = new J("", this.mathlist, { leftDelim: "(", rightDelim: e === 0 ? ")" : "?" });
    return this.endContext(), r;
  }
  scanDelim() {
    this.skipWhitespace();
    let e = this.peek();
    if (!e) return this.onError({ code: "unexpected-end-of-string" }), null;
    if (!dn(e) && !e.startsWith("\\")) return null;
    this.next();
    let r = ne(e, "math");
    return r ? r.definitionType === "function" && r.ifMode && !r.ifMode.includes(this.parseMode) ? (this.onError({ code: "unexpected-delimiter", arg: e }), null) : r.definitionType === "symbol" && (r.type === "mopen" || r.type === "mclose") || /^(\.|\?|\||<|>|\\vert|\\Vert|\\\||\\surd|\\uparrow|\\downarrow|\\Uparrow|\\Downarrow|\\updownarrow|\\Updownarrow|\\mid|\\mvert|\\mVert)$/.test(e) ? e : (this.onError({ code: "unexpected-delimiter", arg: e }), null) : (this.onError({ code: "unknown-command", arg: e }), null);
  }
  scanLeftRight() {
    var o;
    if (this.match("\\right")) return this.onError({ code: "unbalanced-braces" }), new gt("\\right");
    if (this.match("\\mright")) return this.onError({ code: "unbalanced-braces" }), new gt("\\mright");
    let e = "\\right";
    if (!this.match("\\left")) {
      if (!this.match("\\mleft")) return null;
      e = "\\mright";
    }
    let r = this.scanDelim();
    if (!r) return this.onError({ code: "unexpected-delimiter" }), new gt(e === "\\right" ? "\\left" : "\\mleft");
    for (this.beginContext(); !this.end() && !this.match(e); ) this.parseExpression();
    let i = this.mathlist;
    this.endContext();
    let n = (o = this.scanDelim()) != null ? o : ".";
    return new J(e === "\\right" ? "left...right" : "mleft...mright", i, { leftDelim: r, rightDelim: n, style: this.style });
  }
  parseSupSub() {
    if (this.parseMode !== "math") return false;
    let e = this.peek();
    if (e !== "^" && e !== "_" && e !== "'") return false;
    let r = this.lastSubsupAtom();
    for (; e === "^" || e === "_" || e === "'"; ) this.match("'") ? this.match("'") ? r.addChild(new x({ type: "mord", command: "\\doubleprime", mode: "math", value: "′′" }), "superscript") : r.addChild(new x({ type: "mord", command: "\\prime", mode: "math", value: "′" }), "superscript") : (this.match("^") || this.match("_")) && r.addChildren(T(this.scanArgument("expression")), e === "_" ? "subscript" : "superscript"), e = this.peek();
    return true;
  }
  parseLimits() {
    if (this.parseMode !== "math") return false;
    let e = this.match("\\limits"), r = !e && this.match("\\nolimits"), i = !r && !e && this.match("\\displaylimits");
    if (!e && !r && !i) return false;
    let n = this.mathlist.length > 0 ? this.mathlist[this.mathlist.length - 1] : null;
    return n === null ? false : (n.explicitSubsupPlacement = true, e && (n.subsupPlacement = "over-under"), r && (n.subsupPlacement = "adjacent"), i && (n.subsupPlacement = "auto"), true);
  }
  scanArguments(e) {
    if (!(e != null && e.params)) return [void 0, []];
    let r, i = [], n = e.infix ? 2 : 0;
    for (; n < e.params.length; ) {
      let o = e.params[n];
      o.type === "rest" ? i.push(this.scan((a) => ["<}>", "&", "\\end", "\\cr", "\\\\", "\\tabularnewline", "\\right"].includes(a))) : o.isOptional ? i.push(this.scanOptionalArgument(o.type)) : o.type.endsWith("*") ? r = o.type.slice(0, -1) : i.push(this.scanArgument(o.type)), n += 1;
    }
    return [r, i];
  }
  scanSymbolOrLiteral() {
    let e = this.peek();
    if (!e) return null;
    this.next();
    let r;
    if (dn(e)) {
      let i = _e.createAtom(this.parseMode, e, h({}, this.style));
      return i ? [i] : null;
    }
    if (r = this.scanMacro(e), r) return [r];
    if (e.startsWith("\\")) {
      let i = ne(e, this.parseMode);
      if (!i) return this.onError({ code: "unknown-command", arg: e }), [new gt(e)];
      if (i.definitionType === "symbol") {
        let n = h({}, this.style);
        i.variant && (n.variant = i.variant), r = new x({ type: i.type, command: e, style: n, value: String.fromCodePoint(i.codepoint), mode: this.parseMode, verbatimLatex: e });
      } else {
        if (i.applyMode || i.applyStyle || i.infix) return this.onError({ code: "invalid-command", arg: e }), [new gt(e)];
        i.createAtom && (r = i.createAtom({ command: e, args: [], style: this.style, mode: this.parseMode }));
      }
    }
    return r ? [r] : null;
  }
  scanArgument(e) {
    var n, o;
    this.skipFiller();
    let r = this.parseMode;
    if (e === "auto" && (e = r), !this.match("<{>")) {
      if (e === "string") return this.scanString();
      if (e === "value") return this.scanValue();
      if (e === "delim") return (n = this.scanDelim()) != null ? n : ".";
      if (e === "expression") return this.scanExpression();
      if (e === "math") {
        e !== r && this.beginContext({ mode: "math" });
        let a = this.scanSymbolOrLiteral();
        return e !== r && this.endContext(), a;
      }
      if (e === "text") {
        e !== r && this.beginContext({ mode: "text" });
        let a = this.scanSymbolOrLiteral();
        return e !== r && this.endContext(), a;
      }
      return e === "balanced-string" ? null : e === "rest" ? this.scan((a) => ["<}>", "&", "\\end", "\\cr", "\\\\", "\\tabularnewline", "\\right"].includes(a)) : null;
    }
    if (e === "text") {
      this.beginContext({ mode: "text" });
      do
        this.mathlist.push(...this.scan());
      while (!this.match("<}>") && !this.end());
      let a = this.mathlist;
      return this.endContext(), { group: a };
    }
    if (e === "math") {
      this.beginContext({ mode: "math" });
      do
        this.mathlist.push(...this.scan());
      while (!this.match("<}>") && !this.end());
      let a = this.mathlist;
      return this.endContext(), { group: a };
    }
    if (e === "rest") {
      let a = this.scan();
      return this.match("<}>") || this.onError({ code: "unbalanced-braces" }), { group: a };
    }
    let i = null;
    if (e === "expression") {
      this.beginContext({ mode: "math" });
      do
        this.mathlist.push(...this.scan());
      while (!this.match("<}>") && !this.end());
      let a = this.mathlist;
      return this.endContext(), { group: a };
    }
    return e === "string" ? i = this.scanString() : e === "balanced-string" ? i = this.scanBalancedString() : e === "colspec" ? i = this.scanColspec() : e === "value" ? i = this.scanValue() : e === "delim" && (i = this.peek() === "<}>" ? "." : (o = this.scanDelim()) != null ? o : "."), this.skipUntilToken("<}>"), i;
  }
  scanOptionalArgument(e) {
    if (e = e === "auto" ? this.parseMode : e, this.skipFiller(), !this.match("[")) return null;
    let r = null;
    for (; !this.end() && !this.match("]"); ) if (e === "string") r = this.scanString();
    else if (e === "value") r = this.scanValue();
    else if (e === "colspec") r = this.scanColspec();
    else if (e === "bbox") {
      let i = {}, n = this.scanString().toLowerCase().trim().split(/,(?![^(]*\)(?:(?:[^(]*\)){2})*[^"]*$)/);
      for (let o of n) {
        let a = o.match(/^\s*([\d.]+)\s*([a-z]{2})/);
        if (a) i.padding = { dimension: Number.parseFloat(a[1]), unit: a[2] };
        else {
          let s = o.match(/^\s*border\s*:\s*(.*)/);
          s ? i.border = s[1] : i.backgroundcolor = { string: o };
        }
      }
      r = i;
    } else e === "math" && (this.beginContext({ mode: "math" }), r = this.mathlist.concat(this.scan((i) => i === "]")), this.endContext());
    return r;
  }
  scanSymbolOrCommand(e) {
    var o, a, s;
    if (e === "\\placeholder") {
      let l = this.scanOptionalArgument("string"), c = this.scanOptionalArgument("math"), u = x.serialize(c, { defaultMode: "math" }), d = [], m;
      !m && u === "correct" ? m = "correct" : !m && u === "incorrect" ? m = "incorrect" : u !== "" && (d = c);
      let p = this.scanOptionalArgument("string") === "locked", f = this.scanArgument("auto"), y;
      return f && Array.isArray(f) && f.length > 0 ? y = f : f && typeof f == "object" && "group" in f ? y = f.group : y = d, l ? [new un(l, m, p, y != null ? y : d, { mode: this.parseMode, style: this.style })] : [new Me({ mode: this.parseMode, style: this.style })];
    }
    if (e === "\\renewcommand" || e === "\\newcommand" || e === "\\providecommand" || e === "\\def") {
      let l = this.index, c = this.scanLiteralGroup() || this.next();
      if (!c) return null;
      if (this.context.registers[c.substring(1)]) {
        let u = this.scanArgument("string");
        u !== null && (this.context.registers[c.substring(1)] = u);
        let d = R([e, Dr(this.tokens.slice(l, this.index))]);
        return [new x({ type: "text", value: "", verbatimLatex: d })];
      }
    }
    let r = this.scanMacro(e);
    if (r) return [r];
    let i = ne(e, this.parseMode);
    if (!i) return this.parseMode === "text" ? (/[a-zA-Z]/.test((o = this.peek()) != null ? o : "") && (e += " "), [...e].map((l) => new x({ type: "text", value: l, mode: "text", style: this.style }))) : (this.onError({ code: "unknown-command", arg: e }), [new gt(e)]);
    let n = this.index;
    if (i.definitionType === "symbol") {
      let l = h({}, this.style);
      i.variant && (l.variant = i.variant), r = new x({ type: i.type, command: e, style: l, value: String.fromCodePoint(i.codepoint), mode: this.parseMode });
    } else {
      if (i.ifMode && !i.ifMode.includes(this.parseMode)) return [];
      let l = this.parseMode;
      i.applyMode && (this.parseMode = i.applyMode);
      let c, u = [];
      if (i.parse ? u = i.parse(this) : [c, u] = this.scanArguments(i), this.parseMode = l, i.applyMode && !i.applyStyle && !i.createAtom) return T(u[0]);
      if (i.infix) return this.onError({ code: "too-many-infix-commands", arg: e }), null;
      if (typeof i.createAtom == "function") r = i.createAtom({ command: e, args: u, style: this.style, mode: this.parseMode }), c && (r.body = T(this.scanArgument(c)));
      else if (typeof i.applyStyle == "function") {
        let d = i.applyStyle(this.style, e, u, this.context), m = this.parseMode;
        if (i.applyMode && (this.parseMode = i.applyMode), c) {
          let p = this.style;
          this.style = d;
          let f = this.scanArgument(c);
          return this.style = p, this.parseMode = m, T(f);
        }
        this.style = d;
      } else r = new x({ type: "mord", command: (a = i.command) != null ? a : e, style: h({}, this.style), value: e, mode: (s = i.applyMode) != null ? s : this.parseMode });
    }
    if (!r) return null;
    if (r instanceof x && r.verbatimLatex === void 0 && !/^\\(llap|rlap|class|cssId|htmlData)$/.test(e)) {
      let l = R([e, Dr(this.tokens.slice(n, this.index))]);
      l && (r.verbatimLatex = l);
    }
    if (r.verbatimLatex === null && (r.verbatimLatex = void 0), r.isFunction && this.smartFence) {
      let l = this.scanSmartFence();
      if (l) return [r, l];
    }
    return [r];
  }
  scanSymbolCommandOrLiteral() {
    this.expandUnicode();
    let e = this.get();
    if (!e) return null;
    if (dn(e)) {
      let r = _e.createAtom(this.parseMode, e, h({}, this.style));
      if (!r) return null;
      if (r.isFunction && this.smartFence) {
        let i = this.scanSmartFence();
        if (i) return [r, i];
      }
      return [r];
    }
    return e.startsWith("\\") ? this.scanSymbolOrCommand(e) : e === "<space>" ? this.parseMode === "text" ? [new We(" ", " ", this.style)] : null : (e === "<}>" ? this.onError({ latex: "", code: "unbalanced-braces" }) : this.onError({ latex: "", code: "unexpected-token", arg: e }), null);
  }
  scanMacro(e) {
    var a;
    let r = this.context.getMacro(e);
    if (!r) return null;
    let i = this.index, n = r.args, o = { "?": (a = this.args) == null ? void 0 : a.call(this, "?") };
    for (let s = 1; s <= n; s++) {
      let l = this.scanLiteralGroup();
      if (!l) {
        let c = this.index;
        this.scanExpression(), l = Dr(this.tokens.slice(c, this.index));
      }
      o[s] = l;
    }
    return new cn(e, { expand: r.expand, captureSelection: r.captureSelection, args: i === this.index ? null : Dr(this.tokens.slice(i, this.index)), style: this.parsingContext.style, body: be(r.def, { context: this.context, parseMode: this.parseMode, args: (s) => o[s], mathstyle: this.parsingContext.mathstyle, style: this.parsingContext.style }) });
  }
  parseExpression() {
    var r, i, n, o;
    let e = (o = (n = (i = (r = this.scanEnvironment()) != null ? r : this.scanModeShift()) != null ? i : this.scanModeSet()) != null ? n : this.scanGroup()) != null ? o : this.scanLeftRight();
    if (e === null) {
      if (this.parseSupSub() || this.parseLimits()) return true;
      e = this.scanSymbolCommandOrLiteral();
    }
    return e ? (ee(e) ? this.mathlist.push(...e) : this.mathlist.push(e), true) : false;
  }
};
function be(t38, e) {
  var o, a, s, l;
  let r = (o = e == null ? void 0 : e.args) != null ? o : void 0, i = new es(Ji(t38, r), e == null ? void 0 : e.context, { args: r, mathstyle: (a = e == null ? void 0 : e.mathstyle) != null ? a : "displaystyle", parseMode: (s = e == null ? void 0 : e.parseMode) != null ? s : "math", style: (l = e == null ? void 0 : e.style) != null ? l : {} }), n = [];
  for (; !i.end(); ) n.push(...i.scan(() => false));
  return n;
}
function ts(t38, e) {
  var i;
  let r = new es(Ji(t38, null), e == null ? void 0 : e.context, { mathstyle: "displaystyle", parseMode: (i = e == null ? void 0 : e.parseMode) != null ? i : "math" });
  for (; !r.end(); ) r.scan();
  return r.errors;
}
var to = class t17 extends x {
  constructor(e, r) {
    super({ type: "chem" }, { command: e, mode: "math" });
    let i = me.go(L.go(r, e === "\\pu" ? "pu" : "ce"), false);
    this.body = be(i), this._verbatimLatex = e + "{" + r + "}", this.arg = r, this.captureSelection = true;
  }
  static fromJson(e) {
    return new t17(e.command, e.arg);
  }
  set verbatimLatex(e) {
  }
  get verbatimLatex() {
    return this._verbatimLatex;
  }
  toJson() {
    return g(h({}, super.toJson()), { arg: this.arg });
  }
  render(e) {
    let r = x.createBox(e, this.body, { type: "inner" });
    return this.caret && (r.caret = this.caret), this.bind(e, r);
  }
  _serialize(e) {
    return this.verbatimLatex, this.verbatimLatex;
  }
};
M(["ce", "pu"], "{chemformula:balanced-string}", { createAtom: (t38) => {
  var e;
  return new to(t38.command, (e = t38.args[0]) != null ? e : "");
} });
var L = { go: function(t38, e) {
  if (!t38) return [];
  e === void 0 && (e = "ce");
  var r = "0", i = {};
  i.parenthesisLevel = 0, t38 = t38.replace(/\n/g, " "), t38 = t38.replace(/[\u2212\u2013\u2014\u2010]/g, "-"), t38 = t38.replace(/[\u2026]/g, "...");
  for (var n, o = 10, a = []; ; ) {
    n !== t38 ? (o = 10, n = t38) : o--;
    var s = L.stateMachines[e], l = s.transitions[r] || s.transitions["*"];
    e: for (var c = 0; c < l.length; c++) {
      var u = L.patterns.match_(l[c].pattern, t38);
      if (u) {
        for (var d = l[c].task, m = 0; m < d.action_.length; m++) {
          var p;
          if (s.actions[d.action_[m].type_]) p = s.actions[d.action_[m].type_](i, u.match_, d.action_[m].option);
          else if (L.actions[d.action_[m].type_]) p = L.actions[d.action_[m].type_](i, u.match_, d.action_[m].option);
          else throw ["MhchemBugA", "mhchem bug A. Please report. (" + d.action_[m].type_ + ")"];
          L.concatArray(a, p);
        }
        if (r = d.nextState || r, t38.length > 0) {
          if (d.revisit || (t38 = u.remainder), !d.toContinue) break e;
        } else return a;
      }
    }
    if (o <= 0) throw ["MhchemBugU", "mhchem bug U. Please report."];
  }
}, concatArray: function(t38, e) {
  if (e) if (Object.prototype.toString.call(e) === "[object Array]") for (var r = 0; r < e.length; r++) t38.push(e[r]);
  else t38.push(e);
}, patterns: { patterns: { empty: /^$/, else: /^./, else2: /^./, space: /^\s/, "space A": /^\s(?=[A-Z\\$])/, space$: /^\s$/, "a-z": /^[a-z]/, x: /^x/, x$: /^x$/, i$: /^i$/, letters: /^(?:[a-zA-Z\u03B1-\u03C9\u0391-\u03A9?@]|(?:\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))))+/, "\\greek": /^\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))/, "one lowercase latin letter $": /^(?:([a-z])(?:$|[^a-zA-Z]))$/, "$one lowercase latin letter$ $": /^\$(?:([a-z])(?:$|[^a-zA-Z]))\$$/, "one lowercase greek letter $": /^(?:\$?[\u03B1-\u03C9]\$?|\$?\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\s*\$?)(?:\s+|\{\}|(?![a-zA-Z]))$/, digits: /^[0-9]+/, "-9.,9": /^[+\-]?(?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))/, "-9.,9 no missing 0": /^[+\-]?[0-9]+(?:[.,][0-9]+)?/, "(-)(9.,9)(e)(99)": function(t38) {
  var e = t38.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))?(\((?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))\))?(?:(?:([eE])|\s*(\*|x|\\times|\u00D7)\s*10\^)([+\-]?[0-9]+|\{[+\-]?[0-9]+\}))?/);
  return e && e[0] ? { match_: e.slice(1), remainder: t38.substr(e[0].length) } : null;
}, "(-)(9)^(-9)": function(t38) {
  var e = t38.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)\^([+\-]?[0-9]+|\{[+\-]?[0-9]+\})/);
  return e && e[0] ? { match_: e.slice(1), remainder: t38.substr(e[0].length) } : null;
}, "state of aggregation $": function(t38) {
  var e = L.patterns.findObserveGroups(t38, "", /^\([a-z]{1,3}(?=[\),])/, ")", "");
  if (e && e.remainder.match(/^($|[\s,;\)\]\}])/)) return e;
  var r = t38.match(/^(?:\((?:\\ca\s?)?\$[amothc]\$\))/);
  return r ? { match_: r[0], remainder: t38.substr(r[0].length) } : null;
}, "_{(state of aggregation)}$": /^_\{(\([a-z]{1,3}\))\}/, "{[(": /^(?:\\\{|\[|\()/, ")]}": /^(?:\)|\]|\\\})/, ", ": /^[,;]\s*/, ",": /^[,;]/, ".": /^[.]/, ". ": /^([.\u22C5\u00B7\u2022])\s*/, "...": /^\.\.\.(?=$|[^.])/, "* ": /^([*])\s*/, "^{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "^{", "", "", "}");
}, "^($...$)": function(t38) {
  return L.patterns.findObserveGroups(t38, "^", "$", "$", "");
}, "^a": /^\^([0-9]+|[^\\_])/, "^\\x{}{}": function(t38) {
  return L.patterns.findObserveGroups(t38, "^", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true);
}, "^\\x{}": function(t38) {
  return L.patterns.findObserveGroups(t38, "^", /^\\[a-zA-Z]+\{/, "}", "");
}, "^\\x": /^\^(\\[a-zA-Z]+)\s*/, "^(-1)": /^\^(-?\d+)/, "'": /^'/, "_{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "_{", "", "", "}");
}, "_($...$)": function(t38) {
  return L.patterns.findObserveGroups(t38, "_", "$", "$", "");
}, _9: /^_([+\-]?[0-9]+|[^\\])/, "_\\x{}{}": function(t38) {
  return L.patterns.findObserveGroups(t38, "_", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true);
}, "_\\x{}": function(t38) {
  return L.patterns.findObserveGroups(t38, "_", /^\\[a-zA-Z]+\{/, "}", "");
}, "_\\x": /^_(\\[a-zA-Z]+)\s*/, "^_": /^(?:\^(?=_)|\_(?=\^)|[\^_]$)/, "{}": /^\{\}/, "{...}": function(t38) {
  return L.patterns.findObserveGroups(t38, "", "{", "}", "");
}, "{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "{", "", "", "}");
}, "$...$": function(t38) {
  return L.patterns.findObserveGroups(t38, "", "$", "$", "");
}, "${(...)}$": function(t38) {
  return L.patterns.findObserveGroups(t38, "${", "", "", "}$");
}, "$(...)$": function(t38) {
  return L.patterns.findObserveGroups(t38, "$", "", "", "$");
}, "=<>": /^[=<>]/, "#": /^[#\u2261]/, "+": /^\+/, "-$": /^-(?=[\s_},;\]/]|$|\([a-z]+\))/, "-9": /^-(?=[0-9])/, "- orbital overlap": /^-(?=(?:[spd]|sp)(?:$|[\s,;\)\]\}]))/, "-": /^-/, "pm-operator": /^(?:\\pm|\$\\pm\$|\+-|\+\/-)/, operator: /^(?:\+|(?:[\-=<>]|<<|>>|\\approx|\$\\approx\$)(?=\s|$|-?[0-9]))/, arrowUpDown: /^(?:v|\(v\)|\^|\(\^\))(?=$|[\s,;\)\]\}])/, "\\bond{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\bond{", "", "", "}");
}, "->": /^(?:<->|<-->|->|<-|<=>>|<<=>|<=>|[\u2192\u27F6\u21CC])/, CMT: /^[CMT](?=\[)/, "[(...)]": function(t38) {
  return L.patterns.findObserveGroups(t38, "[", "", "", "]");
}, "1st-level escape": /^(&|\\\\|\\hline)\s*/, "\\,": /^(?:\\[,\ ;:])/, "\\x{}{}": function(t38) {
  return L.patterns.findObserveGroups(t38, "", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true);
}, "\\x{}": function(t38) {
  return L.patterns.findObserveGroups(t38, "", /^\\[a-zA-Z]+\{/, "}", "");
}, "\\ca": /^\\ca(?:\s+|(?![a-zA-Z]))/, "\\x": /^(?:\\[a-zA-Z]+\s*|\\[_&{}%])/, orbital: /^(?:[0-9]{1,2}[spdfgh]|[0-9]{0,2}sp)(?=$|[^a-zA-Z])/, others: /^[\/~|]/, "\\frac{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\frac{", "", "", "}", "{", "", "", "}");
}, "\\overset{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\overset{", "", "", "}", "{", "", "", "}");
}, "\\underset{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\underset{", "", "", "}", "{", "", "", "}");
}, "\\underbrace{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\underbrace{", "", "", "}_", "{", "", "", "}");
}, "\\color{(...)}0": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\color{", "", "", "}");
}, "\\color{(...)}{(...)}1": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\color{", "", "", "}", "{", "", "", "}");
}, "\\color(...){(...)}2": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\color", "\\", "", /^(?=\{)/, "{", "", "", "}");
}, "\\ce{(...)}": function(t38) {
  return L.patterns.findObserveGroups(t38, "\\ce{", "", "", "}");
}, oxidation$: /^(?:[+-][IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/, "d-oxidation$": /^(?:[+-]?\s?[IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/, "roman numeral": /^[IVX]+/, "1/2$": /^[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+(?:\$[a-z]\$|[a-z])?$/, amount: function(t38) {
  var e;
  if (e = t38.match(/^(?:(?:(?:\([+\-]?[0-9]+\/[0-9]+\)|[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+|[+\-]?[0-9]+[.,][0-9]+|[+\-]?\.[0-9]+|[+\-]?[0-9]+)(?:[a-z](?=\s*[A-Z]))?)|[+\-]?[a-z](?=\s*[A-Z])|\+(?!\s))/), e) return { match_: e[0], remainder: t38.substr(e[0].length) };
  var r = L.patterns.findObserveGroups(t38, "", "$", "$", "");
  return r && (e = r.match_.match(/^\$(?:\(?[+\-]?(?:[0-9]*[a-z]?[+\-])?[0-9]*[a-z](?:[+\-][0-9]*[a-z]?)?\)?|\+|-)\$$/), e) ? { match_: e[0], remainder: t38.substr(e[0].length) } : null;
}, amount2: function(t38) {
  return this.amount(t38);
}, "(KV letters),": /^(?:[A-Z][a-z]{0,2}|i)(?=,)/, formula$: function(t38) {
  if (t38.match(/^\([a-z]+\)$/)) return null;
  var e = t38.match(/^(?:[a-z]|(?:[0-9\ \+\-\,\.\(\)]+[a-z])+[0-9\ \+\-\,\.\(\)]*|(?:[a-z][0-9\ \+\-\,\.\(\)]+)+[a-z]?)$/);
  return e ? { match_: e[0], remainder: t38.substr(e[0].length) } : null;
}, uprightEntities: /^(?:pH|pOH|pC|pK|iPr|iBu)(?=$|[^a-zA-Z])/, "/": /^\s*(\/)\s*/, "//": /^\s*(\/\/)\s*/, "*": /^\s*[*.]\s*/ }, findObserveGroups: function(t38, e, r, i, n, o, a, s, l, c) {
  var u = function(b, k) {
    if (typeof k == "string") return b.indexOf(k) !== 0 ? null : k;
    var S = b.match(k);
    return S ? S[0] : null;
  }, d = function(b, k, S) {
    for (var A = 0; k < b.length; ) {
      var E = b.charAt(k), C = u(b.substr(k), S);
      if (C !== null && A === 0) return { endMatchBegin: k, endMatchEnd: k + C.length };
      if (E === "{") A++;
      else if (E === "}") {
        if (A === 0) throw ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"];
        A--;
      }
      k++;
    }
    return null;
  }, m = u(t38, e);
  if (m === null || (t38 = t38.substr(m.length), m = u(t38, r), m === null)) return null;
  var p = d(t38, m.length, i || n);
  if (p === null) return null;
  var f = t38.substring(0, i ? p.endMatchEnd : p.endMatchBegin);
  if (o || a) {
    var y = this.findObserveGroups(t38.substr(p.endMatchEnd), o, a, s, l);
    if (y === null) return null;
    var v = [f, y.match_];
    return { match_: c ? v.join("") : v, remainder: y.remainder };
  } else return { match_: f, remainder: t38.substr(p.endMatchEnd) };
}, match_: function(t38, e) {
  var r = L.patterns.patterns[t38];
  if (r === void 0) throw ["MhchemBugP", "mhchem bug P. Please report. (" + t38 + ")"];
  if (typeof r == "function") return L.patterns.patterns[t38](e);
  var i = e.match(r);
  if (i) {
    var n;
    return i[2] ? n = [i[1], i[2]] : i[1] ? n = i[1] : n = i[0], { match_: n, remainder: e.substr(i[0].length) };
  }
  return null;
} }, actions: { "a=": function(t38, e) {
  t38.a = (t38.a || "") + e;
}, "b=": function(t38, e) {
  t38.b = (t38.b || "") + e;
}, "p=": function(t38, e) {
  t38.p = (t38.p || "") + e;
}, "o=": function(t38, e) {
  t38.o = (t38.o || "") + e;
}, "q=": function(t38, e) {
  t38.q = (t38.q || "") + e;
}, "d=": function(t38, e) {
  t38.d = (t38.d || "") + e;
}, "rm=": function(t38, e) {
  t38.rm = (t38.rm || "") + e;
}, "text=": function(t38, e) {
  t38.text_ = (t38.text_ || "") + e;
}, insert: function(t38, e, r) {
  return { type_: r };
}, "insert+p1": function(t38, e, r) {
  return { type_: r, p1: e };
}, "insert+p1+p2": function(t38, e, r) {
  return { type_: r, p1: e[0], p2: e[1] };
}, copy: function(t38, e) {
  return e;
}, rm: function(t38, e) {
  return { type_: "rm", p1: e || "" };
}, text: function(t38, e) {
  return L.go(e, "text");
}, "{text}": function(t38, e) {
  var r = ["{"];
  return L.concatArray(r, L.go(e, "text")), r.push("}"), r;
}, "tex-math": function(t38, e) {
  return L.go(e, "tex-math");
}, "tex-math tight": function(t38, e) {
  return L.go(e, "tex-math tight");
}, bond: function(t38, e, r) {
  return { type_: "bond", kind_: r || e };
}, "color0-output": function(t38, e) {
  return { type_: "color0", color: e[0] };
}, ce: function(t38, e) {
  return L.go(e);
}, "1/2": function(t38, e) {
  var r = [];
  e.match(/^[+\-]/) && (r.push(e.substr(0, 1)), e = e.substr(1));
  var i = e.match(/^([0-9]+|\$[a-z]\$|[a-z])\/([0-9]+)(\$[a-z]\$|[a-z])?$/);
  return i[1] = i[1].replace(/\$/g, ""), r.push({ type_: "frac", p1: i[1], p2: i[2] }), i[3] && (i[3] = i[3].replace(/\$/g, ""), r.push({ type_: "tex-math", p1: i[3] })), r;
}, "9,9": function(t38, e) {
  return L.go(e, "9,9");
} }, createTransitions: function(t38) {
  var e, r, i, n, o = {};
  for (e in t38) for (r in t38[e]) for (i = r.split("|"), t38[e][r].stateArray = i, n = 0; n < i.length; n++) o[i[n]] = [];
  for (e in t38) for (r in t38[e]) for (i = t38[e][r].stateArray || [], n = 0; n < i.length; n++) {
    var a = t38[e][r];
    if (a.action_) {
      a.action_ = [].concat(a.action_);
      for (var s = 0; s < a.action_.length; s++) typeof a.action_[s] == "string" && (a.action_[s] = { type_: a.action_[s] });
    } else a.action_ = [];
    for (var l = e.split("|"), c = 0; c < l.length; c++) if (i[n] === "*") for (var u in o) o[u].push({ pattern: l[c], task: a });
    else o[i[n]].push({ pattern: l[c], task: a });
  }
  return o;
}, stateMachines: {} };
L.stateMachines = { ce: { transitions: L.createTransitions({ empty: { "*": { action_: "output" } }, else: { "0|1|2": { action_: "beginsWithBond=false", revisit: true, toContinue: true } }, oxidation$: { 0: { action_: "oxidation-output" } }, CMT: { r: { action_: "rdt=", nextState: "rt" }, rd: { action_: "rqt=", nextState: "rdt" } }, arrowUpDown: { "0|1|2|as": { action_: ["sb=false", "output", "operator"], nextState: "1" } }, uprightEntities: { "0|1|2": { action_: ["o=", "output"], nextState: "1" } }, orbital: { "0|1|2|3": { action_: "o=", nextState: "o" } }, "->": { "0|1|2|3": { action_: "r=", nextState: "r" }, "a|as": { action_: ["output", "r="], nextState: "r" }, "*": { action_: ["output", "r="], nextState: "r" } }, "+": { o: { action_: "d= kv", nextState: "d" }, "d|D": { action_: "d=", nextState: "d" }, q: { action_: "d=", nextState: "qd" }, "qd|qD": { action_: "d=", nextState: "qd" }, dq: { action_: ["output", "d="], nextState: "d" }, 3: { action_: ["sb=false", "output", "operator"], nextState: "0" } }, amount: { "0|2": { action_: "a=", nextState: "a" } }, "pm-operator": { "0|1|2|a|as": { action_: ["sb=false", "output", { type_: "operator", option: "\\pm" }], nextState: "0" } }, operator: { "0|1|2|a|as": { action_: ["sb=false", "output", "operator"], nextState: "0" } }, "-$": { "o|q": { action_: ["charge or bond", "output"], nextState: "qd" }, d: { action_: "d=", nextState: "d" }, D: { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" }, q: { action_: "d=", nextState: "qd" }, qd: { action_: "d=", nextState: "qd" }, "qD|dq": { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" } }, "-9": { "3|o": { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "3" } }, "- orbital overlap": { o: { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" }, d: { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" } }, "-": { "0|1|2": { action_: [{ type_: "output", option: 1 }, "beginsWithBond=true", { type_: "bond", option: "-" }], nextState: "3" }, 3: { action_: { type_: "bond", option: "-" } }, a: { action_: ["output", { type_: "insert", option: "hyphen" }], nextState: "2" }, as: { action_: [{ type_: "output", option: 2 }, { type_: "bond", option: "-" }], nextState: "3" }, b: { action_: "b=" }, o: { action_: { type_: "- after o/d", option: false }, nextState: "2" }, q: { action_: { type_: "- after o/d", option: false }, nextState: "2" }, "d|qd|dq": { action_: { type_: "- after o/d", option: true }, nextState: "2" }, "D|qD|p": { action_: ["output", { type_: "bond", option: "-" }], nextState: "3" } }, amount2: { "1|3": { action_: "a=", nextState: "a" } }, letters: { "0|1|2|3|a|as|b|p|bp|o": { action_: "o=", nextState: "o" }, "q|dq": { action_: ["output", "o="], nextState: "o" }, "d|D|qd|qD": { action_: "o after d", nextState: "o" } }, digits: { o: { action_: "q=", nextState: "q" }, "d|D": { action_: "q=", nextState: "dq" }, q: { action_: ["output", "o="], nextState: "o" }, a: { action_: "o=", nextState: "o" } }, "space A": { "b|p|bp": {} }, space: { a: { nextState: "as" }, 0: { action_: "sb=false" }, "1|2": { action_: "sb=true" }, "r|rt|rd|rdt|rdq": { action_: "output", nextState: "0" }, "*": { action_: ["output", "sb=true"], nextState: "1" } }, "1st-level escape": { "1|2": { action_: ["output", { type_: "insert+p1", option: "1st-level escape" }] }, "*": { action_: ["output", { type_: "insert+p1", option: "1st-level escape" }], nextState: "0" } }, "[(...)]": { "r|rt": { action_: "rd=", nextState: "rd" }, "rd|rdt": { action_: "rq=", nextState: "rdq" } }, "...": { "o|d|D|dq|qd|qD": { action_: ["output", { type_: "bond", option: "..." }], nextState: "3" }, "*": { action_: [{ type_: "output", option: 1 }, { type_: "insert", option: "ellipsis" }], nextState: "1" } }, ". |* ": { "*": { action_: ["output", { type_: "insert", option: "addition compound" }], nextState: "1" } }, "state of aggregation $": { "*": { action_: ["output", "state of aggregation"], nextState: "1" } }, "{[(": { "a|as|o": { action_: ["o=", "output", "parenthesisLevel++"], nextState: "2" }, "0|1|2|3": { action_: ["o=", "output", "parenthesisLevel++"], nextState: "2" }, "*": { action_: ["output", "o=", "output", "parenthesisLevel++"], nextState: "2" } }, ")]}": { "0|1|2|3|b|p|bp|o": { action_: ["o=", "parenthesisLevel--"], nextState: "o" }, "a|as|d|D|q|qd|qD|dq": { action_: ["output", "o=", "parenthesisLevel--"], nextState: "o" } }, ", ": { "*": { action_: ["output", "comma"], nextState: "0" } }, "^_": { "*": {} }, "^{(...)}|^($...$)": { "0|1|2|as": { action_: "b=", nextState: "b" }, p: { action_: "b=", nextState: "bp" }, "3|o": { action_: "d= kv", nextState: "D" }, q: { action_: "d=", nextState: "qD" }, "d|D|qd|qD|dq": { action_: ["output", "d="], nextState: "D" } }, "^a|^\\x{}{}|^\\x{}|^\\x|'": { "0|1|2|as": { action_: "b=", nextState: "b" }, p: { action_: "b=", nextState: "bp" }, "3|o": { action_: "d= kv", nextState: "d" }, q: { action_: "d=", nextState: "qd" }, "d|qd|D|qD": { action_: "d=" }, dq: { action_: ["output", "d="], nextState: "d" } }, "_{(state of aggregation)}$": { "d|D|q|qd|qD|dq": { action_: ["output", "q="], nextState: "q" } }, "_{(...)}|_($...$)|_9|_\\x{}{}|_\\x{}|_\\x": { "0|1|2|as": { action_: "p=", nextState: "p" }, b: { action_: "p=", nextState: "bp" }, "3|o": { action_: "q=", nextState: "q" }, "d|D": { action_: "q=", nextState: "dq" }, "q|qd|qD|dq": { action_: ["output", "q="], nextState: "q" } }, "=<>": { "0|1|2|3|a|as|o|q|d|D|qd|qD|dq": { action_: [{ type_: "output", option: 2 }, "bond"], nextState: "3" } }, "#": { "0|1|2|3|a|as|o": { action_: [{ type_: "output", option: 2 }, { type_: "bond", option: "#" }], nextState: "3" } }, "{}": { "*": { action_: { type_: "output", option: 1 }, nextState: "1" } }, "{...}": { "0|1|2|3|a|as|b|p|bp": { action_: "o=", nextState: "o" }, "o|d|D|q|qd|qD|dq": { action_: ["output", "o="], nextState: "o" } }, "$...$": { a: { action_: "a=" }, "0|1|2|3|as|b|p|bp|o": { action_: "o=", nextState: "o" }, "as|o": { action_: "o=" }, "q|d|D|qd|qD|dq": { action_: ["output", "o="], nextState: "o" } }, "\\bond{(...)}": { "*": { action_: [{ type_: "output", option: 2 }, "bond"], nextState: "3" } }, "\\frac{(...)}": { "*": { action_: [{ type_: "output", option: 1 }, "frac-output"], nextState: "3" } }, "\\overset{(...)}": { "*": { action_: [{ type_: "output", option: 2 }, "overset-output"], nextState: "3" } }, "\\underset{(...)}": { "*": { action_: [{ type_: "output", option: 2 }, "underset-output"], nextState: "3" } }, "\\underbrace{(...)}": { "*": { action_: [{ type_: "output", option: 2 }, "underbrace-output"], nextState: "3" } }, "\\color{(...)}{(...)}1|\\color(...){(...)}2": { "*": { action_: [{ type_: "output", option: 2 }, "color-output"], nextState: "3" } }, "\\color{(...)}0": { "*": { action_: [{ type_: "output", option: 2 }, "color0-output"] } }, "\\ce{(...)}": { "*": { action_: [{ type_: "output", option: 2 }, "ce"], nextState: "3" } }, "\\,": { "*": { action_: [{ type_: "output", option: 1 }, "copy"], nextState: "1" } }, "\\x{}{}|\\x{}|\\x": { "0|1|2|3|a|as|b|p|bp|o|c0": { action_: ["o=", "output"], nextState: "3" }, "*": { action_: ["output", "o=", "output"], nextState: "3" } }, others: { "*": { action_: [{ type_: "output", option: 1 }, "copy"], nextState: "3" } }, else2: { a: { action_: "a to o", nextState: "o", revisit: true }, as: { action_: ["output", "sb=true"], nextState: "1", revisit: true }, "r|rt|rd|rdt|rdq": { action_: ["output"], nextState: "0", revisit: true }, "*": { action_: ["output", "copy"], nextState: "3" } } }), actions: { "o after d": function(t38, e) {
  var r;
  if ((t38.d || "").match(/^[0-9]+$/)) {
    var i = t38.d;
    t38.d = void 0, r = this.output(t38), t38.b = i;
  } else r = this.output(t38);
  return L.actions["o="](t38, e), r;
}, "d= kv": function(t38, e) {
  t38.d = e, t38.dType = "kv";
}, "charge or bond": function(t38, e) {
  if (t38.beginsWithBond) {
    var r = [];
    return L.concatArray(r, this.output(t38)), L.concatArray(r, L.actions.bond(t38, e, "-")), r;
  } else t38.d = e;
}, "- after o/d": function(t38, e, r) {
  var i = L.patterns.match_("orbital", t38.o || ""), n = L.patterns.match_("one lowercase greek letter $", t38.o || ""), o = L.patterns.match_("one lowercase latin letter $", t38.o || ""), a = L.patterns.match_("$one lowercase latin letter$ $", t38.o || ""), s = e === "-" && (i && i.remainder === "" || n || o || a);
  s && !t38.a && !t38.b && !t38.p && !t38.d && !t38.q && !i && o && (t38.o = "$" + t38.o + "$");
  var l = [];
  return s ? (L.concatArray(l, this.output(t38)), l.push({ type_: "hyphen" })) : (i = L.patterns.match_("digits", t38.d || ""), r && i && i.remainder === "" ? (L.concatArray(l, L.actions["d="](t38, e)), L.concatArray(l, this.output(t38))) : (L.concatArray(l, this.output(t38)), L.concatArray(l, L.actions.bond(t38, e, "-")))), l;
}, "a to o": function(t38) {
  t38.o = t38.a, t38.a = void 0;
}, "sb=true": function(t38) {
  t38.sb = true;
}, "sb=false": function(t38) {
  t38.sb = false;
}, "beginsWithBond=true": function(t38) {
  t38.beginsWithBond = true;
}, "beginsWithBond=false": function(t38) {
  t38.beginsWithBond = false;
}, "parenthesisLevel++": function(t38) {
  t38.parenthesisLevel++;
}, "parenthesisLevel--": function(t38) {
  t38.parenthesisLevel--;
}, "state of aggregation": function(t38, e) {
  return { type_: "state of aggregation", p1: L.go(e, "o") };
}, comma: function(t38, e) {
  var r = e.replace(/\s*$/, ""), i = r !== e;
  return i && t38.parenthesisLevel === 0 ? { type_: "comma enumeration L", p1: r } : { type_: "comma enumeration M", p1: r };
}, output: function(t38, e, r) {
  var i;
  if (!t38.r) i = [], !t38.a && !t38.b && !t38.p && !t38.o && !t38.q && !t38.d && !r || (t38.sb && i.push({ type_: "entitySkip" }), !t38.o && !t38.q && !t38.d && !t38.b && !t38.p && r !== 2 ? (t38.o = t38.a, t38.a = void 0) : !t38.o && !t38.q && !t38.d && (t38.b || t38.p) ? (t38.o = t38.a, t38.d = t38.b, t38.q = t38.p, t38.a = t38.b = t38.p = void 0) : t38.o && t38.dType === "kv" && L.patterns.match_("d-oxidation$", t38.d || "") ? t38.dType = "oxidation" : t38.o && t38.dType === "kv" && !t38.q && (t38.dType = void 0), i.push({ type_: "chemfive", a: L.go(t38.a, "a"), b: L.go(t38.b, "bd"), p: L.go(t38.p, "pq"), o: L.go(t38.o, "o"), q: L.go(t38.q, "pq"), d: L.go(t38.d, t38.dType === "oxidation" ? "oxidation" : "bd"), dType: t38.dType }));
  else {
    var n;
    t38.rdt === "M" ? n = L.go(t38.rd, "tex-math") : t38.rdt === "T" ? n = [{ type_: "text", p1: t38.rd || "" }] : n = L.go(t38.rd);
    var o;
    t38.rqt === "M" ? o = L.go(t38.rq, "tex-math") : t38.rqt === "T" ? o = [{ type_: "text", p1: t38.rq || "" }] : o = L.go(t38.rq), i = { type_: "arrow", r: t38.r, rd: n, rq: o };
  }
  for (var a in t38) a !== "parenthesisLevel" && a !== "beginsWithBond" && delete t38[a];
  return i;
}, "oxidation-output": function(t38, e) {
  var r = ["{"];
  return L.concatArray(r, L.go(e, "oxidation")), r.push("}"), r;
}, "frac-output": function(t38, e) {
  return { type_: "frac-ce", p1: L.go(e[0]), p2: L.go(e[1]) };
}, "overset-output": function(t38, e) {
  return { type_: "overset", p1: L.go(e[0]), p2: L.go(e[1]) };
}, "underset-output": function(t38, e) {
  return { type_: "underset", p1: L.go(e[0]), p2: L.go(e[1]) };
}, "underbrace-output": function(t38, e) {
  return { type_: "underbrace", p1: L.go(e[0]), p2: L.go(e[1]) };
}, "color-output": function(t38, e) {
  return { type_: "color", color1: e[0], color2: L.go(e[1]) };
}, "r=": function(t38, e) {
  t38.r = e;
}, "rdt=": function(t38, e) {
  t38.rdt = e;
}, "rd=": function(t38, e) {
  t38.rd = e;
}, "rqt=": function(t38, e) {
  t38.rqt = e;
}, "rq=": function(t38, e) {
  t38.rq = e;
}, operator: function(t38, e, r) {
  return { type_: "operator", kind_: r || e };
} } }, a: { transitions: L.createTransitions({ empty: { "*": {} }, "1/2$": { 0: { action_: "1/2" } }, else: { 0: { nextState: "1", revisit: true } }, "$(...)$": { "*": { action_: "tex-math tight", nextState: "1" } }, ",": { "*": { action_: { type_: "insert", option: "commaDecimal" } } }, else2: { "*": { action_: "copy" } } }), actions: {} }, o: { transitions: L.createTransitions({ empty: { "*": {} }, "1/2$": { 0: { action_: "1/2" } }, else: { 0: { nextState: "1", revisit: true } }, letters: { "*": { action_: "rm" } }, "\\ca": { "*": { action_: { type_: "insert", option: "circa" } } }, "\\x{}{}|\\x{}|\\x": { "*": { action_: "copy" } }, "${(...)}$|$(...)$": { "*": { action_: "tex-math" } }, "{(...)}": { "*": { action_: "{text}" } }, else2: { "*": { action_: "copy" } } }), actions: {} }, text: { transitions: L.createTransitions({ empty: { "*": { action_: "output" } }, "{...}": { "*": { action_: "text=" } }, "${(...)}$|$(...)$": { "*": { action_: "tex-math" } }, "\\greek": { "*": { action_: ["output", "rm"] } }, "\\,|\\x{}{}|\\x{}|\\x": { "*": { action_: ["output", "copy"] } }, else: { "*": { action_: "text=" } } }), actions: { output: function(t38) {
  if (t38.text_) {
    var e = { type_: "text", p1: t38.text_ };
    for (var r in t38) delete t38[r];
    return e;
  }
} } }, pq: { transitions: L.createTransitions({ empty: { "*": {} }, "state of aggregation $": { "*": { action_: "state of aggregation" } }, i$: { 0: { nextState: "!f", revisit: true } }, "(KV letters),": { 0: { action_: "rm", nextState: "0" } }, formula$: { 0: { nextState: "f", revisit: true } }, "1/2$": { 0: { action_: "1/2" } }, else: { 0: { nextState: "!f", revisit: true } }, "${(...)}$|$(...)$": { "*": { action_: "tex-math" } }, "{(...)}": { "*": { action_: "text" } }, "a-z": { f: { action_: "tex-math" } }, letters: { "*": { action_: "rm" } }, "-9.,9": { "*": { action_: "9,9" } }, ",": { "*": { action_: { type_: "insert+p1", option: "comma enumeration S" } } }, "\\color{(...)}{(...)}1|\\color(...){(...)}2": { "*": { action_: "color-output" } }, "\\color{(...)}0": { "*": { action_: "color0-output" } }, "\\ce{(...)}": { "*": { action_: "ce" } }, "\\,|\\x{}{}|\\x{}|\\x": { "*": { action_: "copy" } }, else2: { "*": { action_: "copy" } } }), actions: { "state of aggregation": function(t38, e) {
  return { type_: "state of aggregation subscript", p1: L.go(e, "o") };
}, "color-output": function(t38, e) {
  return { type_: "color", color1: e[0], color2: L.go(e[1], "pq") };
} } }, bd: { transitions: L.createTransitions({ empty: { "*": {} }, x$: { 0: { nextState: "!f", revisit: true } }, formula$: { 0: { nextState: "f", revisit: true } }, else: { 0: { nextState: "!f", revisit: true } }, "-9.,9 no missing 0": { "*": { action_: "9,9" } }, ".": { "*": { action_: { type_: "insert", option: "electron dot" } } }, "a-z": { f: { action_: "tex-math" } }, x: { "*": { action_: { type_: "insert", option: "KV x" } } }, letters: { "*": { action_: "rm" } }, "'": { "*": { action_: { type_: "insert", option: "prime" } } }, "${(...)}$|$(...)$": { "*": { action_: "tex-math" } }, "{(...)}": { "*": { action_: "text" } }, "\\color{(...)}{(...)}1|\\color(...){(...)}2": { "*": { action_: "color-output" } }, "\\color{(...)}0": { "*": { action_: "color0-output" } }, "\\ce{(...)}": { "*": { action_: "ce" } }, "\\,|\\x{}{}|\\x{}|\\x": { "*": { action_: "copy" } }, else2: { "*": { action_: "copy" } } }), actions: { "color-output": function(t38, e) {
  return { type_: "color", color1: e[0], color2: L.go(e[1], "bd") };
} } }, oxidation: { transitions: L.createTransitions({ empty: { "*": {} }, "roman numeral": { "*": { action_: "roman-numeral" } }, "${(...)}$|$(...)$": { "*": { action_: "tex-math" } }, else: { "*": { action_: "copy" } } }), actions: { "roman-numeral": function(t38, e) {
  return { type_: "roman numeral", p1: e || "" };
} } }, "tex-math": { transitions: L.createTransitions({ empty: { "*": { action_: "output" } }, "\\ce{(...)}": { "*": { action_: ["output", "ce"] } }, "{...}|\\,|\\x{}{}|\\x{}|\\x": { "*": { action_: "o=" } }, else: { "*": { action_: "o=" } } }), actions: { output: function(t38) {
  if (t38.o) {
    var e = { type_: "tex-math", p1: t38.o };
    for (var r in t38) delete t38[r];
    return e;
  }
} } }, "tex-math tight": { transitions: L.createTransitions({ empty: { "*": { action_: "output" } }, "\\ce{(...)}": { "*": { action_: ["output", "ce"] } }, "{...}|\\,|\\x{}{}|\\x{}|\\x": { "*": { action_: "o=" } }, "-|+": { "*": { action_: "tight operator" } }, else: { "*": { action_: "o=" } } }), actions: { "tight operator": function(t38, e) {
  t38.o = (t38.o || "") + "{" + e + "}";
}, output: function(t38) {
  if (t38.o) {
    var e = { type_: "tex-math", p1: t38.o };
    for (var r in t38) delete t38[r];
    return e;
  }
} } }, "9,9": { transitions: L.createTransitions({ empty: { "*": {} }, ",": { "*": { action_: "comma" } }, else: { "*": { action_: "copy" } } }), actions: { comma: function() {
  return { type_: "commaDecimal" };
} } }, pu: { transitions: L.createTransitions({ empty: { "*": { action_: "output" } }, space$: { "*": { action_: ["output", "space"] } }, "{[(|)]}": { "0|a": { action_: "copy" } }, "(-)(9)^(-9)": { 0: { action_: "number^", nextState: "a" } }, "(-)(9.,9)(e)(99)": { 0: { action_: "enumber", nextState: "a" } }, space: { "0|a": {} }, "pm-operator": { "0|a": { action_: { type_: "operator", option: "\\pm" }, nextState: "0" } }, operator: { "0|a": { action_: "copy", nextState: "0" } }, "//": { d: { action_: "o=", nextState: "/" } }, "/": { d: { action_: "o=", nextState: "/" } }, "{...}|else": { "0|d": { action_: "d=", nextState: "d" }, a: { action_: ["space", "d="], nextState: "d" }, "/|q": { action_: "q=", nextState: "q" } } }), actions: { enumber: function(t38, e) {
  var r = [];
  return e[0] === "+-" || e[0] === "+/-" ? r.push("\\pm ") : e[0] && r.push(e[0]), e[1] && (L.concatArray(r, L.go(e[1], "pu-9,9")), e[2] && (e[2].match(/[,.]/) ? L.concatArray(r, L.go(e[2], "pu-9,9")) : r.push(e[2])), (e[3] || e[4]) && (e[3] === "e" || e[4] === "*" ? r.push({ type_: "cdot" }) : r.push({ type_: "times" }))), e[5] && r.push("10^{" + e[5] + "}"), r;
}, "number^": function(t38, e) {
  var r = [];
  return e[0] === "+-" || e[0] === "+/-" ? r.push("\\pm ") : e[0] && r.push(e[0]), L.concatArray(r, L.go(e[1], "pu-9,9")), r.push("^{" + e[2] + "}"), r;
}, operator: function(t38, e, r) {
  return { type_: "operator", kind_: r || e };
}, space: function() {
  return { type_: "pu-space-1" };
}, output: function(t38) {
  var e, r = L.patterns.match_("{(...)}", t38.d || "");
  r && r.remainder === "" && (t38.d = r.match_);
  var i = L.patterns.match_("{(...)}", t38.q || "");
  if (i && i.remainder === "" && (t38.q = i.match_), t38.d && (t38.d = t38.d.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C"), t38.d = t38.d.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F")), t38.q) {
    t38.q = t38.q.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C"), t38.q = t38.q.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
    var n = { d: L.go(t38.d, "pu"), q: L.go(t38.q, "pu") };
    t38.o === "//" ? e = { type_: "pu-frac", p1: n.d, p2: n.q } : (e = n.d, n.d.length > 1 || n.q.length > 1 ? e.push({ type_: " / " }) : e.push({ type_: "/" }), L.concatArray(e, n.q));
  } else e = L.go(t38.d, "pu-2");
  for (var o in t38) delete t38[o];
  return e;
} } }, "pu-2": { transitions: L.createTransitions({ empty: { "*": { action_: "output" } }, "*": { "*": { action_: ["output", "cdot"], nextState: "0" } }, "\\x": { "*": { action_: "rm=" } }, space: { "*": { action_: ["output", "space"], nextState: "0" } }, "^{(...)}|^(-1)": { 1: { action_: "^(-1)" } }, "-9.,9": { 0: { action_: "rm=", nextState: "0" }, 1: { action_: "^(-1)", nextState: "0" } }, "{...}|else": { "*": { action_: "rm=", nextState: "1" } } }), actions: { cdot: function() {
  return { type_: "tight cdot" };
}, "^(-1)": function(t38, e) {
  t38.rm += "^{" + e + "}";
}, space: function() {
  return { type_: "pu-space-2" };
}, output: function(t38) {
  var e = [];
  if (t38.rm) {
    var r = L.patterns.match_("{(...)}", t38.rm || "");
    r && r.remainder === "" ? e = L.go(r.match_, "pu") : e = { type_: "rm", p1: t38.rm };
  }
  for (var i in t38) delete t38[i];
  return e;
} } }, "pu-9,9": { transitions: L.createTransitions({ empty: { 0: { action_: "output-0" }, o: { action_: "output-o" } }, ",": { 0: { action_: ["output-0", "comma"], nextState: "o" } }, ".": { 0: { action_: ["output-0", "copy"], nextState: "o" } }, else: { "*": { action_: "text=" } } }), actions: { comma: function() {
  return { type_: "commaDecimal" };
}, "output-0": function(t38) {
  var e = [];
  if (t38.text_ = t38.text_ || "", t38.text_.length > 4) {
    var r = t38.text_.length % 3;
    r === 0 && (r = 3);
    for (var i = t38.text_.length - 3; i > 0; i -= 3) e.push(t38.text_.substr(i, 3)), e.push({ type_: "1000 separator" });
    e.push(t38.text_.substr(0, r)), e.reverse();
  } else e.push(t38.text_);
  for (var n in t38) delete t38[n];
  return e;
}, "output-o": function(t38) {
  var e = [];
  if (t38.text_ = t38.text_ || "", t38.text_.length > 4) {
    for (var r = t38.text_.length - 3, i = 0; i < r; i += 3) e.push(t38.text_.substr(i, 3)), e.push({ type_: "1000 separator" });
    e.push(t38.text_.substr(i));
  } else e.push(t38.text_);
  for (var n in t38) delete t38[n];
  return e;
} } } };
var me = { go: function(t38, e) {
  if (!t38) return "";
  for (var r = "", i = false, n = 0; n < t38.length; n++) {
    var o = t38[n];
    typeof o == "string" ? r += o : (r += me._go2(o), o.type_ === "1st-level escape" && (i = true));
  }
  return !e && !i && r && (r = "{" + r + "}"), r;
}, _goInner: function(t38) {
  return t38 && me.go(t38, true);
}, _go2: function(t38) {
  var e;
  switch (t38.type_) {
    case "chemfive":
      e = "";
      var r = { a: me._goInner(t38.a), b: me._goInner(t38.b), p: me._goInner(t38.p), o: me._goInner(t38.o), q: me._goInner(t38.q), d: me._goInner(t38.d) };
      r.a && (r.a.match(/^[+\-]/) && (r.a = "{" + r.a + "}"), e += r.a + "\\,"), (r.b || r.p) && (e += "{\\vphantom{X}}", e += "^{\\hphantom{" + (r.b || "") + "}}_{\\hphantom{" + (r.p || "") + "}}", e += "{\\vphantom{X}}", e += "^{\\smash[t]{\\vphantom{2}}\\llap{" + (r.b || "") + "}}", e += "_{\\vphantom{2}\\llap{\\smash[t]{" + (r.p || "") + "}}}"), r.o && (r.o.match(/^[+\-]/) && (r.o = "{" + r.o + "}"), e += r.o), t38.dType === "kv" ? ((r.d || r.q) && (e += "{\\vphantom{X}}"), r.d && (e += "^{" + r.d + "}"), r.q && (e += "_{\\smash[t]{" + r.q + "}}")) : t38.dType === "oxidation" ? (r.d && (e += "{\\vphantom{X}}", e += "^{" + r.d + "}"), r.q && (e += "{\\vphantom{X}}", e += "_{\\smash[t]{" + r.q + "}}")) : (r.q && (e += "{\\vphantom{X}}", e += "_{\\smash[t]{" + r.q + "}}"), r.d && (e += "{\\vphantom{X}}", e += "^{" + r.d + "}"));
      break;
    case "rm":
      e = "\\mathrm{" + t38.p1 + "}";
      break;
    case "text":
      t38.p1.match(/[\^_]/) ? (t38.p1 = t38.p1.replace(" ", "~").replace("-", "\\text{-}"), e = "\\mathrm{" + t38.p1 + "}") : e = "\\text{" + t38.p1 + "}";
      break;
    case "roman numeral":
      e = "\\mathrm{" + t38.p1 + "}";
      break;
    case "state of aggregation":
      e = "\\mskip2mu " + me._goInner(t38.p1);
      break;
    case "state of aggregation subscript":
      e = "\\mskip1mu " + me._goInner(t38.p1);
      break;
    case "bond":
      if (e = me._getBond(t38.kind_), !e) throw ["MhchemErrorBond", "mhchem Error. Unknown bond type (" + t38.kind_ + ")"];
      break;
    case "frac":
      var i = "\\frac{" + t38.p1 + "}{" + t38.p2 + "}";
      e = "\\mathchoice{\\textstyle" + i + "}{" + i + "}{" + i + "}{" + i + "}";
      break;
    case "pu-frac":
      var n = "\\frac{" + me._goInner(t38.p1) + "}{" + me._goInner(t38.p2) + "}";
      e = "\\mathchoice{\\textstyle" + n + "}{" + n + "}{" + n + "}{" + n + "}";
      break;
    case "tex-math":
      e = t38.p1 + " ";
      break;
    case "frac-ce":
      e = "\\frac{" + me._goInner(t38.p1) + "}{" + me._goInner(t38.p2) + "}";
      break;
    case "overset":
      e = "\\overset{" + me._goInner(t38.p1) + "}{" + me._goInner(t38.p2) + "}";
      break;
    case "underset":
      e = "\\underset{" + me._goInner(t38.p1) + "}{" + me._goInner(t38.p2) + "}";
      break;
    case "underbrace":
      e = "\\underbrace{" + me._goInner(t38.p1) + "}_{" + me._goInner(t38.p2) + "}";
      break;
    case "color":
      e = "{\\color{" + t38.color1 + "}{" + me._goInner(t38.color2) + "}}";
      break;
    case "color0":
      e = "\\color{" + t38.color + "}";
      break;
    case "arrow":
      var o = { rd: me._goInner(t38.rd), rq: me._goInner(t38.rq) }, a = me._getArrow(t38.r);
      o.rd || o.rq ? t38.r === "<=>" || t38.r === "<=>>" || t38.r === "<<=>" || t38.r === "<-->" ? (a = "\\long" + a, o.rd && (a = "\\overset{" + o.rd + "}{" + a + "}"), o.rq && (t38.r === "<-->" ? a = "\\underset{\\lower2mu{" + o.rq + "}}{" + a + "}" : a = "\\underset{\\lower6mu{" + o.rq + "}}{" + a + "}"), a = " {}\\mathrel{" + a + "}{} ") : (o.rq && (a += "[{" + o.rq + "}]"), a += "{" + o.rd + "}", a = " {}\\mathrel{\\x" + a + "}{} ") : a = " {}\\mathrel{\\long" + a + "}{} ", e = a;
      break;
    case "operator":
      e = me._getOperator(t38.kind_);
      break;
    case "1st-level escape":
      e = t38.p1 + " ";
      break;
    case "space":
      e = " ";
      break;
    case "entitySkip":
      e = "~";
      break;
    case "pu-space-1":
      e = "~";
      break;
    case "pu-space-2":
      e = "\\mkern3mu ";
      break;
    case "1000 separator":
      e = "\\mkern2mu ";
      break;
    case "commaDecimal":
      e = "{,}";
      break;
    case "comma enumeration L":
      e = "{" + t38.p1 + "}\\mkern6mu ";
      break;
    case "comma enumeration M":
      e = "{" + t38.p1 + "}\\mkern3mu ";
      break;
    case "comma enumeration S":
      e = "{" + t38.p1 + "}\\mkern1mu ";
      break;
    case "hyphen":
      e = "\\text{-}";
      break;
    case "addition compound":
      e = "\\,{\\cdot}\\,";
      break;
    case "electron dot":
      e = "\\mkern1mu \\bullet\\mkern1mu ";
      break;
    case "KV x":
      e = "{\\times}";
      break;
    case "prime":
      e = "\\prime ";
      break;
    case "cdot":
      e = "\\cdot ";
      break;
    case "tight cdot":
      e = "\\mkern1mu{\\cdot}\\mkern1mu ";
      break;
    case "times":
      e = "\\times ";
      break;
    case "circa":
      e = "{\\sim}";
      break;
    case "^":
      e = "uparrow";
      break;
    case "v":
      e = "downarrow";
      break;
    case "ellipsis":
      e = "\\ldots ";
      break;
    case "/":
      e = "/";
      break;
    case " / ":
      e = "\\,/\\,";
      break;
    default:
      throw ["MhchemBugT", "mhchem bug T. Please report."];
  }
  return e;
}, _getArrow: function(t38) {
  switch (t38) {
    case "->":
      return "rightarrow";
    case "→":
      return "rightarrow";
    case "⟶":
      return "rightarrow";
    case "<-":
      return "leftarrow";
    case "<->":
      return "leftrightarrow";
    case "<-->":
      return "leftrightarrows";
    case "<=>":
      return "rightleftharpoons";
    case "⇌":
      return "rightleftharpoons";
    case "<=>>":
      return "Rightleftharpoons";
    case "<<=>":
      return "Leftrightharpoons";
    default:
      throw ["MhchemBugT", "mhchem bug T. Please report."];
  }
}, _getBond: function(t38) {
  switch (t38) {
    case "-":
      return "{-}";
    case "1":
      return "{-}";
    case "=":
      return "{=}";
    case "2":
      return "{=}";
    case "#":
      return "{\\equiv}";
    case "3":
      return "{\\equiv}";
    case "~":
      return "{\\tripledash}";
    case "~-":
      return "{\\rlap{\\lower.1em{-}}\\raise.1em{\\tripledash}}";
    case "~=":
      return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{\\tripledash}}-}";
    case "~--":
      return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{\\tripledash}}-}";
    case "-~-":
      return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{-}}\\tripledash}";
    case "...":
      return "{{\\cdot}{\\cdot}{\\cdot}}";
    case "....":
      return "{{\\cdot}{\\cdot}{\\cdot}{\\cdot}}";
    case "->":
      return "{\\rightarrow}";
    case "<-":
      return "{\\leftarrow}";
    case "<":
      return "{<}";
    case ">":
      return "{>}";
    default:
      throw ["MhchemBugT", "mhchem bug T. Please report."];
  }
}, _getOperator: function(t38) {
  switch (t38) {
    case "+":
      return " {}+{} ";
    case "-":
      return " {}-{} ";
    case "=":
      return " {}={} ";
    case "<":
      return " {}<{} ";
    case ">":
      return " {}>{} ";
    case "<<":
      return " {}\\ll{} ";
    case ">>":
      return " {}\\gg{} ";
    case "\\pm":
      return " {}\\pm{} ";
    case "\\approx":
      return " {}\\approx{} ";
    case "$\\approx$":
      return " {}\\approx{} ";
    case "v":
      return " \\downarrow{} ";
    case "(v)":
      return " \\downarrow{} ";
    case "^":
      return " \\uparrow{} ";
    case "(^)":
      return " \\uparrow{} ";
    default:
      throw ["MhchemBugT", "mhchem bug T. Please report."];
  }
} };
var mn = class t18 extends x {
  constructor(e) {
    super(g(h({}, e), { type: "delim" })), this.value = e.delim, this.size = e.size;
  }
  static fromJson(e) {
    return new t18(e);
  }
  toJson() {
    return g(h({}, super.toJson()), { delim: this.value, size: this.size });
  }
  render(e) {
    return new w(this.value, { type: "middle" });
  }
  _serialize(e) {
    if (!(e.expandMacro || e.skipStyles || e.skipPlaceholders) && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    return r != null && r.serialize ? r.serialize(this, e) : U(this.command, this.value);
  }
}, hn = class t19 extends x {
  constructor(e) {
    super(g(h({}, e), { type: "sizeddelim", value: e.delim })), this.delimType = e.delimType, this.size = e.size;
  }
  static fromJson(e) {
    return new t19(e);
  }
  toJson() {
    return g(h({}, super.toJson()), { delim: this.value, size: this.size, delimType: this.delimType });
  }
  render(e) {
    let r = uh(this.value, this.size, e, { classes: { open: "ML__open", close: "ML__close" }[this.delimType], type: this.delimType, isSelected: this.isSelected });
    return r ? (r = this.bind(e, r), this.caret && (r.caret = this.caret), r) : null;
  }
  _serialize(e) {
    if (!(e.expandMacro || e.skipStyles || e.skipPlaceholders) && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    return r != null && r.serialize ? r.serialize(this, e) : U(this.command, this.value);
  }
};
function ro(t38) {
  return t38.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
var ur = class t20 extends x {
  constructor(e, r, i, n) {
    var o, a, s, l, c, u;
    super({ type: "enclose", command: e, style: n.style }), this.body = r, i.updiagonalarrow && (i.updiagonalstrike = false), i.box && (i.left = false, i.right = false, i.bottom = false, i.top = false), this.notation = i, this.shadow = (o = n.shadow) != null ? o : "none", this.strokeWidth = (a = F0(n.strokeWidth)) != null ? a : "0.06em", this.strokeStyle = /^(solid|dashed|dotted|double|none)$/.test((s = n.strokeStyle) != null ? s : "") ? n.strokeStyle : "solid", this.svgStrokeStyle = n.svgStrokeStyle, this.strokeColor = (l = Yi(n.strokeColor)) != null ? l : "currentColor", this.backgroundcolor = (c = Yi(n.backgroundcolor)) != null ? c : "transparent", this.borderStyle = (u = $a(n.borderStyle)) != null ? u : `${this.strokeWidth} ${this.strokeStyle} ${this.strokeColor}`, this.padding = n.padding, this.captureSelection = false;
  }
  static fromJson(e) {
    return new t20(e.command, e.body, e.notation, e);
  }
  toJson() {
    return g(h({}, super.toJson()), { notation: this.notation, shadow: this.shadow, strokeWidth: this.strokeWidth, strokeStyle: this.strokeStyle, svgStrokeStyle: this.svgStrokeStyle, strokeColor: this.strokeColor, borderStyle: this.borderStyle, padding: this.padding });
  }
  _serialize(e) {
    var n;
    if (!(e.expandMacro || e.skipStyles || e.skipPlaceholders) && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    if (r != null && r.serialize) return r.serialize(this, e);
    let i = (n = this.command) != null ? n : "";
    if (this.command === "\\enclose") {
      i += "{" + Object.keys(this.notation).join(" ") + "}";
      let o = "", a = "";
      this.backgroundcolor && this.backgroundcolor !== "transparent" && (o += a + 'mathbackground="' + this.backgroundcolor + '"', a = ","), this.shadow && this.shadow !== "auto" && (o += a + 'shadow="' + this.shadow + '"', a = ","), this.strokeWidth || this.strokeStyle !== "solid" ? (o += a + this.borderStyle, a = ",") : this.strokeColor && this.strokeColor !== "currentColor" && (o += a + 'mathcolor="' + this.strokeColor + '"', a = ","), o && (i += `[${o}]`);
    }
    return U(i, this.bodyToLatex(e));
  }
  render(e) {
    var p, f, y, v;
    let r = new P({ parent: e }, this.style), i = x.createBox(r, this.body);
    if (!i) return null;
    let n = gg(this.borderStyle), o = r.toEm(!this.padding || this.padding === "auto" ? { register: "fboxsep" } : { string: this.padding });
    i.setStyle("position", "relative"), i.setStyle("display", "inline-block"), i.setStyle("height", i.height + i.depth, "em"), i.setStyle("width", i.width, "em");
    let a = new w(null, { classes: "ML__notation" }), s = i.height + i.depth + 2 * o, l = i.width + 2 * o, c = "", u = Math.min(o * 0.2, 0.05);
    if (this.notation.horizontalstrike) {
      let b = 2 * o + i.height - Xe / 2;
      c += this.line((o + u).toString(), b.toString(), (o + i.width - u).toString(), b.toString());
    }
    if (this.notation.verticalstrike) {
      let b = o + i.width / 2;
      c += this.line(b.toString(), (o + u).toString(), b.toString(), (s - o - u).toString());
    }
    if (this.notation.updiagonalstrike && (c += this.line((o + u).toString(), (s - o - u).toString(), (o + i.width - u).toString(), (o + u).toString())), this.notation.downdiagonalstrike && (c += this.line((o + u).toString(), (o + u).toString(), (o + i.width - u).toString(), (s - o - u).toString())), this.notation.updiagonalarrow) {
      c += this.line(o.toString(), (2 * o + i.depth + i.height).toString(), (o + i.width).toString(), o.toString());
      let S = 0.03 * Math.sqrt(l * l + s * s) * 1, A = i.width * S, E = (i.depth + i.height) * S, C = o + i.width, _ = o;
      _ + E - 0.4 * A < 0 && (_ = 0.4 * A - E), c += '<polygon points="', c += `${C},${_} ${C - A - 0.4 * E},${_ + E - 0.4 * A} `, c += `${C - 0.7 * A},${_ + 0.7 * E} ${C - A + 0.4 * E},${_ + E + 0.4 * A} `, c += `${C},${_}`, c += `" stroke='none' fill="${ro((p = this.strokeColor) != null ? p : "")}"`, c += "/>";
    }
    let d = 0;
    if (this.notation.phasorangle) {
      let b = bh(r), k = (i.height + i.depth + 2 * b + 2 * o).toString(), S = (i.height + i.depth) / 2;
      c += this.line(o.toString(), k, (o + S + i.width).toString(), k), c += this.line(o.toString(), k, (o + S).toString(), (o - b).toString()), s += b, d = S, i.left += s / 2 - o;
    }
    if (this.notation.longdiv) {
      let b = bh(r);
      s += b, c += this.line(o.toString(), o.toString(), (o + i.width).toString(), o.toString());
      let k = 0.3;
      d = k + b, i.left += k + b, i.setTop(o + b), c += '<path d="', c += `M ${o} ${o}  a${k} ${(i.depth + i.height + 2 * b) / 2}, 0, 1, 1, 0 ${i.depth + i.height + 2 * b} "`, c += ` stroke-width="${bg(r)}" stroke="${ro((f = this.strokeColor) != null ? f : "")}" fill="none"`, c += "/>";
    }
    if (a.width = i.width + 2 * o + d, a.height = i.height + 2 * o, a.depth = i.depth, a.setStyle("box-sizing", "border-box"), a.setStyle("left", `calc(-1 * ${n} - ${o}em)`), a.setStyle("height", `calc( ${i.height + i.depth + 2 * o}em + ${n})`), a.setStyle("top", "0em"), a.setStyle("width", `calc(${i.width + 2 * o}em + ${n})`), this.backgroundcolor && a.setStyle("background-color", this.backgroundcolor), this.notation.box && a.setStyle("border", this.borderStyle), this.notation.actuarial && (a.setStyle("border-top", this.borderStyle), a.setStyle("border-right", this.borderStyle)), this.notation.madruwb && (a.setStyle("border-bottom", this.borderStyle), a.setStyle("border-right", this.borderStyle)), this.notation.roundedbox && (a.setStyle("border-radius", "8px"), a.setStyle("border", this.borderStyle)), this.notation.circle && (a.setStyle("border-radius", "50%"), a.setStyle("border", this.borderStyle)), this.notation.top && a.setStyle("border-top", this.borderStyle), this.notation.left && a.setStyle("border-left", this.borderStyle), this.notation.right && a.setStyle("border-right", this.borderStyle), this.notation.bottom && a.setStyle("border-bottom", this.borderStyle), c) {
      if (this.shadow === "auto") a.svgFilter = "drop-shadow(0 0 .5px rgba(255, 255, 255, .7)) drop-shadow(1px 1px 2px #333)";
      else if (this.shadow && this.shadow !== "none") {
        let k = $0(this.shadow);
        k && (a.svgFilter = `drop-shadow(${k})`);
      }
      let b = ` stroke-width="${ro((y = this.strokeWidth) != null ? y : "")}" stroke="${ro((v = this.strokeColor) != null ? v : "")}"`;
      b += ' stroke-linecap="round"', this.svgStrokeStyle && (b += ` stroke-dasharray="${ro(this.svgStrokeStyle)}"`), a.svgStyle = b, a.svgOverlay = c;
    }
    let m = new w([a, i]);
    return m.setStyle("position", "relative"), m.setStyle("height", `${Math.floor(100 * (a.depth + a.height)) / 100}em`), m.setStyle("display", "inline-block"), m.height = a.height, m.depth = a.depth, m.width = a.width - 2 * o, m.left = o, m.right = o, this.caret && (m.caret = this.caret), m.wrap(r);
  }
  line(e, r, i, n) {
    return `<line x1="${rs(e)}"  y1="${rs(r)}" x2="${rs(i)}" y2="${rs(n)}" vector-effect="non-scaling-stroke"></line>`;
  }
};
function rs(t38) {
  return typeof t38 == "number" ? `${Math.floor(100 * t38) / 100}%` : t38;
}
function gg(t38) {
  if (!t38) return "1px";
  let e = t38.match(/([0-9][a-zA-Z\%]+)/);
  return e === null ? "1px" : e[1];
}
function bg(t38) {
  return (Math.floor(100 * t38.metrics.sqrtRuleThickness / t38.scalingFactor) / 100 / 10).toString() + "em";
}
function bh(t38) {
  let e = t38.isDisplayStyle ? Xe : t38.metrics.defaultRuleThickness;
  return t38.metrics.defaultRuleThickness + t38.scalingFactor * e / 4;
}
var pn = { fractionNavigationOrder: "numerator-denominator" };
var st = class t21 extends x {
  constructor(e, r, i) {
    var n, o, a;
    super(g(h({}, i), { type: "genfrac", displayContainsHighlight: true })), this.above = e, this.below = r, this.hasBarLine = (n = i == null ? void 0 : i.hasBarLine) != null ? n : true, this.continuousFraction = (o = i == null ? void 0 : i.continuousFraction) != null ? o : false, this.align = (a = i == null ? void 0 : i.align) != null ? a : "center", this.numerPrefix = i == null ? void 0 : i.numerPrefix, this.denomPrefix = i == null ? void 0 : i.denomPrefix, this.mathstyleName = i == null ? void 0 : i.mathstyleName, this.leftDelim = i == null ? void 0 : i.leftDelim, this.rightDelim = i == null ? void 0 : i.rightDelim, this.barThickness = i == null ? void 0 : i.barThickness;
  }
  static fromJson(e) {
    return new t21(e.above, e.below, e);
  }
  toJson() {
    let e = {};
    return this.continuousFraction && (e.continuousFraction = true), this.align !== "center" && (e.align = this.align), this.numerPrefix && (e.numerPrefix = this.numerPrefix), this.denomPrefix && (e.denomPrefix = this.denomPrefix), this.leftDelim && (e.leftDelim = this.leftDelim), this.rightDelim && (e.rightDelim = this.rightDelim), this.hasBarLine || (e.hasBarLine = false), this.barThickness && (e.barThickness = this.barThickness), this.mathstyleName && (e.mathstyleName = this.mathstyleName), h(h({}, super.toJson()), e);
  }
  get children() {
    if (this._children) return this._children;
    let e = [];
    if (pn.fractionNavigationOrder === "denominator-numerator") {
      for (let r of this.below) e.push(...r.children), e.push(r);
      for (let r of this.above) e.push(...r.children), e.push(r);
    } else {
      for (let r of this.above) e.push(...r.children), e.push(r);
      for (let r of this.below) e.push(...r.children), e.push(r);
    }
    return this._children = e, e;
  }
  render(e) {
    var E, C;
    let r = new P({ parent: e, mathstyle: this.mathstyleName }, this.style), i = r.metrics, n = new P({ parent: r, mathstyle: this.continuousFraction ? "" : "numerator" }, this.style), o = this.numerPrefix ? new w([new w(this.numerPrefix), x.createBox(n, this.above)], { isTight: n.isTight, type: "ignore" }) : (E = x.createBox(n, this.above, { type: "ignore" })) != null ? E : new w(null, { type: "ignore" }), a = new P({ parent: r, mathstyle: this.continuousFraction ? "" : "denominator" }, this.style), s = this.denomPrefix ? new w([new w(this.denomPrefix), x.createBox(a, this.below, { type: "ignore" })]) : (C = x.createBox(a, this.below, { type: "ignore" })) != null ? C : new w(null, { type: "ignore" }), l = 0;
    this.hasBarLine && (l = this.barThickness ? r.toEm(this.barThickness) : i.defaultRuleThickness);
    let c, u = 0, d;
    r.isDisplayStyle ? (c = n.metrics.num1, u = l > 0 ? 3 * l : 7 * l, d = a.metrics.denom1) : (l > 0 ? (c = n.metrics.num2, u = l) : (c = n.metrics.num3, u = 3 * i.defaultRuleThickness), d = a.metrics.denom2);
    let m = [];
    this.isSelected && m.push("ML__selected");
    let p = o.depth, f = s.height, y;
    if (l <= 0) {
      let _ = c - p - (f - d);
      _ < u && (c += (u - _) / 2, d += (u - _) / 2), y = new te({ individualShift: [{ box: o, shift: -c, classes: [...m, is(this.align)] }, { box: s, shift: d, classes: [...m, is(this.align)] }] }).wrap(r);
    } else {
      let _ = new w(null, { classes: "ML__frac-line", mode: this.mode, style: this.style });
      _.softWidth = Math.max(o.width, s.width), _.height = l / 2, _.depth = l / 2, this.barThickness && (_.setStyle("--frac-line-thickness", l, "em"), _.setStyle("--frac-line-margin", "0"));
      let O = Ie + l / 2;
      c < u + p + O && (c = u + p + O);
      let I = Ie - l / 2;
      d < u + f - I && (d = u + f - I), y = new te({ individualShift: [{ box: s, shift: d, classes: [...m, is(this.align)] }, { box: _, shift: -I, classes: m }, { box: o, shift: -c, classes: [...m, is(this.align)] }] }).wrap(r);
    }
    let v = r.isDisplayStyle ? i.delim1 : i.delim2, b = this.leftDelim ? this.bind(e, an("open", this.leftDelim, v, true, e, { style: this.style, mode: this.mode, isSelected: this.isSelected })) : lr(r, "ML__open"), k = null;
    this.continuousFraction ? k = new w(null, { type: "close" }) : this.rightDelim ? k = this.bind(e, an("close", this.rightDelim, v, true, e, { style: this.style, mode: this.mode, isSelected: this.isSelected })) : k = lr(r, "ML__close");
    let S = new w([b, y, k], { isTight: r.isTight, type: "inner", classes: "ML__mfrac" }), A = this.bind(e, S);
    return this.caret && (A.caret = this.caret), this.attachSupsub(e, { base: A });
  }
};
function is(t38) {
  var e;
  return (e = { left: "ML__left", right: "ML__right", center: "ML__center" }[t38]) != null ? e : "ML__center";
}
var he = class t22 extends x {
  constructor(e, r) {
    var i;
    super({ type: "latex", value: e, mode: "latex" }), this.isSuggestion = (i = r == null ? void 0 : r.isSuggestion) != null ? i : false, this.isError = false;
  }
  static fromJson(e) {
    let r = new t22(e.value);
    return e.isSuggestion && (r.isSuggestion = true), e.isError && (r.isError = true), r;
  }
  toJson() {
    let e = {};
    return this.isSuggestion && (e.isSuggestion = true), this.isError && (e.isError = true), h({ type: "latex", value: this.value }, e);
  }
  render(e) {
    let r = new w(this.value, { classes: this.isSuggestion ? "ML__suggestion" : this.isError ? "ML__error" : "", type: "latex", maxFontSize: 1 });
    return r ? (this.caret && (r.caret = this.caret), this.bind(e, r)) : null;
  }
}, Ft = class t23 extends x {
  constructor(e = "") {
    super({ type: "latexgroup", mode: "latex" }), this.body = [...e].map((r) => new he(r)), this.skipBoundary = true;
  }
  static fromJson(e) {
    return new t23();
  }
  toJson() {
    return super.toJson();
  }
  render(e) {
    let r = x.createBox(e, this.body);
    return r ? (this.caret && (r.caret = this.caret), this.bind(e, r)) : null;
  }
  _serialize(e) {
    var r, i;
    return (i = (r = this.body) == null ? void 0 : r.map((n) => n.value).join("")) != null ? i : "";
  }
};
var fi = class t24 extends x {
  constructor(e, r) {
    super(g(h({}, r), { type: "extensible-symbol", isFunction: r == null ? void 0 : r.isFunction })), this.value = e, this.variant = r == null ? void 0 : r.variant, this.subsupPlacement = r == null ? void 0 : r.limits;
  }
  static fromJson(e) {
    return new t24(e.symbol, e);
  }
  toJson() {
    let e = super.toJson();
    return this.variant && (e.variant = this.variant), this.subsupPlacement && (e.limits = this.subsupPlacement), this.value && (e.symbol = this.value), e;
  }
  render(e) {
    var s;
    let r = e.isDisplayStyle && this.value !== "\\smallint", i = new w(this.value, { fontFamily: r ? "Size2-Regular" : "Size1-Regular", classes: "ML__op-symbol " + (r ? "ML__large-op" : "ML__small-op"), type: "op", maxFontSize: e.scalingFactor, isSelected: this.isSelected });
    if (!i) return null;
    i.right = i.italic;
    let n = (i.height - i.depth) / 2 - Ie * e.scalingFactor, o = i.italic;
    i.setTop(n);
    let a = i;
    if (this.superscript || this.subscript) {
      let l = (s = this.subsupPlacement) != null ? s : "auto";
      l === "auto" && e.isDisplayStyle && (l = "over-under"), a = l === "over-under" ? this.attachLimits(e, { base: i, baseShift: n, slant: o }) : this.attachSupsub(e, { base: i });
    }
    return new w(this.bind(e, a), { type: "op", caret: this.caret, isSelected: this.isSelected, classes: "ML__op-group" }).wrap(e);
  }
  _serialize(e) {
    if (!(e.expandMacro || e.skipStyles || e.skipPlaceholders) && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    if (r != null && r.serialize) return r.serialize(this, e);
    let i = [];
    return i.push(this.command), this.explicitSubsupPlacement && (this.subsupPlacement === "over-under" && i.push("\\limits"), this.subsupPlacement === "adjacent" && i.push("\\nolimits"), this.subsupPlacement === "auto" && i.push("\\displaylimits")), i.push(this.supsubToLatex(e)), R(i);
  }
};
var bt = class t25 extends x {
  constructor(e) {
    let r = e.body;
    super(g(h({}, e), { type: "overlap", body: typeof r == "string" ? [new x({ value: r })] : r, style: e == null ? void 0 : e.style })), this.skipBoundary = true, this.align = e == null ? void 0 : e.align, this.boxType = e == null ? void 0 : e.boxType;
  }
  static fromJson(e) {
    return new t25(e);
  }
  toJson() {
    let e = {};
    return this.align && (e.align = this.align), this.boxType && (e.boxType = this.boxType), h(h({}, super.toJson()), e);
  }
  render(e) {
    let r = x.createBox(e, this.body, { classes: "ML__inner" });
    return r ? (this.caret && (r.caret = this.caret), this.bind(e, new w([r, new w(null, { classes: "ML__fix" })], { classes: this.align === "right" ? "ML__rlap" : "ML__llap", type: this.boxType }))) : null;
  }
};
var Ae = class t26 extends x {
  constructor(e) {
    var r, i, n, o;
    super({ type: "overunder", command: e.command, style: e.style, mode: e.mode, body: e.body, skipBoundary: (r = e.skipBoundary) != null ? r : true }), this.subsupPlacement = e.supsubPlacement, this.svgAbove = e.svgAbove, this.svgBelow = e.svgBelow, this.svgBody = e.svgBody, this.above = e.above, this.below = e.below, this.boxType = (i = e.boxType) != null ? i : "ord", this.paddedBody = (n = e.paddedBody) != null ? n : false, this.paddedLabels = (o = e.paddedLabels) != null ? o : false;
  }
  static fromJson(e) {
    return new t26(e);
  }
  toJson() {
    let e = super.toJson();
    return this.skipBoundary || (e.skipBoundary = false), this.subsupPlacement && (e.subsupPlacement = this.subsupPlacement), this.svgAbove && (e.svgAbove = this.svgAbove), this.svgBelow && (e.svgBelow = this.svgBelow), this.svgBody && (e.svgBody = this.svgBody), this.boxType !== "ord" && (e.boxType = this.boxType), this.paddedBody && (e.paddedBody = true), this.paddedLabels && (e.paddedLabels = true), e;
  }
  render(e) {
    let r = this.svgBody ? Zi(this.svgBody) : x.createBox(e, this.body, { type: "ignore" }), i = new P({ parent: e, mathstyle: "scriptstyle" }, this.style), n = null;
    this.svgAbove ? n = Zi(this.svgAbove) : this.above && (n = x.createBox(i, this.above, { type: "ignore" }));
    let o = null;
    this.svgBelow ? o = Zi(this.svgBelow) : this.below && (o = x.createBox(i, this.below, { type: "ignore" })), this.paddedBody && (r = new w([lr(e, "ML__open"), r, lr(e, "ML__close")], { type: "ignore" }));
    let a = yg(e, { base: r, above: n, below: o, type: this.boxType === "bin" || this.boxType === "rel" ? this.boxType : "ord", paddedAboveBelow: this.paddedLabels });
    return a ? (this.subsupPlacement === "over-under" ? a = this.attachLimits(e, { base: a, type: a.type }) : a = this.attachSupsub(e, { base: a }), this.caret && (a.caret = this.caret), this.bind(e, a)) : null;
  }
};
function yg(t38, e) {
  if (!e.base) return null;
  if (!e.above && !e.below) {
    let s = new w(e.base, { type: e.type });
    return s.setStyle("position", "relative"), s;
  }
  let r = 0;
  e.above && (r = t38.metrics.bigOpSpacing5);
  let i = null, n = e.base, o = 0, a = ["ML__center"];
  if (e.paddedAboveBelow && a.push("ML__label_padding"), e.below && e.above) {
    let s = t38.metrics.bigOpSpacing5 + e.below.height + e.below.depth + n.depth + o;
    i = new te({ bottom: s, children: [t38.metrics.bigOpSpacing5, { box: e.below, classes: a }, { box: n, classes: ["ML__center"] }, r, { box: e.above, classes: a }, t38.metrics.bigOpSpacing5] });
  } else e.below ? i = new te({ top: n.height - o, children: [t38.metrics.bigOpSpacing5, { box: e.below, classes: a }, { box: n, classes: ["ML__center"] }] }) : e.above && (i = new te({ bottom: n.depth + o, children: [{ box: n, classes: ["ML__center"] }, r, { box: e.above, classes: a }, t38.metrics.bigOpSpacing5] }));
  return new w(i, { type: e.type });
}
var $t = class t27 extends x {
  constructor(e) {
    var r, i, n, o;
    super(g(h({}, e), { type: "phantom" })), this.captureSelection = true, this.isInvisible = (r = e.isInvisible) != null ? r : false, this.smashDepth = (i = e.smashDepth) != null ? i : false, this.smashHeight = (n = e.smashHeight) != null ? n : false, this.smashWidth = (o = e.smashWidth) != null ? o : false;
  }
  static fromJson(e) {
    return new t27(e);
  }
  toJson() {
    let e = {};
    return this.isInvisible && (e.isInvisible = true), this.smashDepth && (e.smashDepth = true), this.smashHeight && (e.smashHeight = true), this.smashWidth && (e.smashWidth = true), h(h({}, super.toJson()), e);
  }
  render(e) {
    let r = new P({ parent: e, isPhantom: true });
    if (!this.smashDepth && !this.smashHeight && !this.smashWidth) return this.isInvisible, x.createBox(r, this.body, { classes: "ML__inner" });
    let i = x.createBox(this.isInvisible ? r : e, this.body);
    if (!i) return null;
    if (this.smashWidth) {
      let n = new w(null, { classes: "ML__fix" });
      return new w([i, n], { classes: "ML__rlap" }).wrap(e);
    }
    if (!this.smashHeight && !this.smashDepth) return i;
    if (this.smashHeight && (i.height = 0), this.smashDepth && (i.depth = 0), i.children) for (let n of i.children) this.smashHeight && (n.height = 0), this.smashDepth && (n.depth = 0);
    return new te({ firstBaseline: [{ box: i }] }, { type: i.type }).wrap(e);
  }
};
var Vt = class t28 extends x {
  constructor(e) {
    var r;
    super(h({ type: "spacing" }, e)), this.width = e == null ? void 0 : e.width, this._braced = (r = e == null ? void 0 : e.braced) != null ? r : false;
  }
  static fromJson(e) {
    return new t28(e);
  }
  toJson() {
    let e = super.toJson();
    return this.width !== void 0 && (e.width = this.width), this._braced && (e.braced = true), e;
  }
  render(e) {
    var i;
    if (this.command === "space") return new w(this.mode === "math" ? null : " ");
    let r;
    if (this.width !== void 0) r = new w(null, { classes: "ML__mspace" }), r.left = e.toEm(this.width);
    else {
      let n = (i = { "\\qquad": "ML__qquad", "\\quad": "ML__quad", "\\enspace": "ML__enspace", "\\;": "ML__thickspace", "\\:": "ML__mediumspace", "\\>": "ML__mediumspace", "\\,": "ML__thinspace", "\\!": "ML__negativethinspace" }[this.command]) != null ? i : "ML__mediumspace";
      r = new w(null, { classes: n });
    }
    return r = this.bind(e, r), this.caret && (r.caret = this.caret), r;
  }
  _serialize(e) {
    var n;
    if (!e.expandMacro && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    if (r != null && r.serialize) return r.serialize(this, e);
    let i = (n = this.command) != null ? n : "";
    return this.width === void 0 ? i : this._braced && !("register" in this.width) ? `${i}{${ge(this.width)}}` : `${i}${ge(this.width)}`;
  }
};
var fn = class t29 extends x {
  constructor(e) {
    var r;
    super(g(h({}, e), { type: "surd", mode: (r = e.mode) != null ? r : "math", style: e.style, displayContainsHighlight: true, body: e.body })), this.above = e.index;
  }
  static fromJson(e) {
    return new t29(g(h({}, e), { index: e.above }));
  }
  _serialize(e) {
    if (!(e.expandMacro || e.skipStyles || e.skipPlaceholders) && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    if (r != null && r.serialize) return r.serialize(this, e);
    let i = this.command, n = this.bodyToLatex(e);
    return this.above && !this.hasEmptyBranch("above") ? U(`${i}[${this.aboveToLatex(e)}]`, n) : /^[0-9]$/.test(n) ? `${i}${n}` : U(i, n);
  }
  get children() {
    if (this._children) return this._children;
    let e = [];
    if (this.above) for (let r of this.above) e.push(...r.children), e.push(r);
    if (this.body) for (let r of this.body) e.push(...r.children), e.push(r);
    return this._children = e, e;
  }
  render(e) {
    var k;
    let r = new P({ parent: e, mathstyle: "cramp" }, this.style), i = (k = x.createBox(r, this.body, { type: "inner" })) != null ? k : new w(null), n = r.scalingFactor, o = r.metrics.defaultRuleThickness / n, a = e.isDisplayStyle ? Xe : o, s = new w(null, { classes: "ML__sqrt-line", style: this.style });
    s.height = o, s.softWidth = i.width;
    let l = n * (o + a / 4), u = Math.max(n * 2 * a, i.height + i.depth) + l + o, d = new P({ parent: e }, this.style), m = this.bind(d, new w(an("inner", "\\surd", u, false, d, { isSelected: this.isSelected }), { isSelected: this.isSelected, classes: "ML__sqrt-sign", style: this.style }));
    if (!m) return null;
    let p = m.height + m.depth - o;
    p > i.height + i.depth + l && (l = (l + p - (i.height + i.depth)) / 2), m.setTop(m.height - i.height - l);
    let f = this.bind(e, new te({ firstBaseline: [{ box: new w(i) }, l - 2 * o, { box: s }, o] })), y = x.createBox(new P({ parent: e, mathstyle: "scriptscriptstyle" }), this.above, { type: "ignore" });
    if (!y) {
      let S = new w([m, f], { classes: this.containsCaret ? "ML__contains-caret" : "", type: "inner" });
      return S.setStyle("display", "inline-block"), S.setStyle("height", S.height + S.depth, "em"), this.caret && (S.caret = this.caret), this.bind(e, S);
    }
    let v = new te({ shift: -0.6 * (Math.max(m.height, f.height) - Math.max(m.depth, f.depth)), children: [{ box: y }] }), b = new w([new w(v, { classes: "ML__sqrt-index", type: "ignore" }), m, f], { type: "inner", classes: this.containsCaret ? "ML__contains-caret" : "" });
    return b.height = m.height, b.depth = m.depth, this.caret && (b.caret = this.caret), this.bind(e, b);
  }
};
var hc = class extends w {
  constructor(e) {
    super(null, { type: "skip" }), this._width = e;
  }
  toMarkup() {
    return `<span style="display:inline-block;width:${Math.ceil(this.width * 100) / 100}em"></span>`;
  }
};
function io(t38, e) {
  if (!t38.parent) return;
  let r = t38.parent.children, i = r.indexOf(t38), n = i - 1;
  for (; n >= 0 && r[n].type === "ignore"; ) n -= 1;
  if (n < 0 && t38.parent.parent && t38.parent.type === "lift") {
    io(t38.parent, e);
    return;
  }
  i > 0 && r[i - 1].type === "skip" ? r[i - 1].width += e : r.splice(i, 0, new hc(e));
}
var xg = { ord: { op: 3, bin: 4, rel: 5, inner: 3 }, op: { ord: 3, op: 3, rel: 5, inner: 3 }, bin: { ord: 4, op: 4, open: 4, inner: 4 }, rel: { ord: 5, op: 5, open: 5, inner: 5 }, close: { op: 3, bin: 4, rel: 5, inner: 3 }, punct: { ord: 3, op: 3, rel: 3, open: 3, punct: 3, inner: 3 }, inner: { ord: 3, op: 3, bin: 4, rel: 5, open: 3, punct: 3, inner: 3 } }, vg = { ord: { op: 3 }, op: { ord: 3, op: 3 }, close: { op: 3 }, inner: { op: 3 } };
function _g(t38) {
  no(t38, (e, r) => {
    r.type === "bin" && (!e || /^(middle|bin|op|rel|open|punct)$/.test(e.type)) && (r.type = "ord"), (e == null ? void 0 : e.type) === "bin" && /^(rel|close|punct)$/.test(r.type) && (e.type = "ord"), r.type !== "ignore" && (e = r);
  });
}
function qt(t38, e) {
  if (!t38.children) return t38;
  let r = t38.children;
  _g(r);
  let i = e.getRegisterAsEm("thinmuskip"), n = e.getRegisterAsEm("medmuskip"), o = e.getRegisterAsEm("thickmuskip");
  return no(r, (a, s) => {
    var d, m, p;
    if (!a) return;
    let l = a.type, c = s.isTight ? (d = vg[l]) != null ? d : null : (m = xg[l]) != null ? m : null, u = (p = c == null ? void 0 : c[s.type]) != null ? p : null;
    u === 3 && io(s, i), u === 4 && io(s, n), u === 5 && io(s, o);
  }), t38;
}
function no(t38, e, r = void 0) {
  if (!t38) return r;
  t38 = [...t38];
  for (let i of t38) i.type === "lift" ? r = no(i.children, e, r) : i.type === "ignore" ? no(i.children, e) : (e(r, i), no(i.children, e), r = i);
  return r;
}
var gi = class t30 extends x {
  constructor(e) {
    super({ type: "tooltip", command: e.command, mode: e.mode, style: e.style, body: e.body, displayContainsHighlight: true }), this.tooltip = new x({ type: "root", mode: e.content, body: e.tooltip, style: {} }), this.skipBoundary = true, this.captureSelection = false;
  }
  static fromJson(e) {
    return new t30(g(h({}, e), { tooltip: yt(e.tooltip) }));
  }
  toJson() {
    var r;
    let e = (r = this.tooltip.body) == null ? void 0 : r.filter((i) => i.type !== "first").map((i) => i.toJson());
    return g(h({}, super.toJson()), { tooltip: e });
  }
  render(e) {
    let r = x.createBox(e, this.body);
    if (!r) return null;
    let i = new P({ parent: e, mathstyle: "displaystyle" }, { fontSize: ji }), n = Or(qt(new w(this.tooltip.render(i), { classes: "ML__tooltip-content" }), i)), o = new w([n, r], { classes: "ML__tooltip-container" });
    return this.caret && (o.caret = this.caret), this.bind(e, o);
  }
};
var xt = class t31 extends x {
  constructor(e, r) {
    super(g(h({}, r), { type: "operator", isFunction: r == null ? void 0 : r.isFunction })), this.value = e, this.variant = r == null ? void 0 : r.variant, this.variantStyle = r == null ? void 0 : r.variantStyle, this.subsupPlacement = r == null ? void 0 : r.limits;
  }
  static fromJson(e) {
    return new t31(e.symbol, e);
  }
  toJson() {
    let e = super.toJson();
    return this.variant && (e.variant = this.variant), this.variantStyle && (e.variantStyle = this.variantStyle), this.subsupPlacement && (e.limits = this.subsupPlacement), this.value && (e.symbol = this.value), e;
  }
  render(e) {
    var n;
    let r = new w(this.value, { type: "op", mode: "math", maxFontSize: e.scalingFactor, style: { variant: this.variant, variantStyle: this.variantStyle }, isSelected: this.isSelected, letterShapeStyle: e.letterShapeStyle }), i = r;
    if (this.superscript || this.subscript) {
      let o = (n = this.subsupPlacement) != null ? n : "auto";
      i = o === "over-under" || o === "auto" && e.isDisplayStyle ? this.attachLimits(e, { base: r }) : this.attachSupsub(e, { base: r });
    }
    return new w(this.bind(e, i), { type: "op", caret: this.caret, isSelected: this.isSelected, classes: "ML__op-group" }).wrap(e);
  }
  _serialize(e) {
    if (!(e.expandMacro || e.skipStyles || e.skipPlaceholders) && typeof this.verbatimLatex == "string") return this.verbatimLatex;
    let r = ne(this.command, this.mode);
    if (r != null && r.serialize) return r.serialize(this, e);
    let i = [this.command];
    return this.explicitSubsupPlacement && (this.subsupPlacement === "over-under" && i.push("\\limits"), this.subsupPlacement === "adjacent" && i.push("\\nolimits"), this.subsupPlacement === "auto" && i.push("\\displaylimits")), i.push(this.supsubToLatex(e)), R(i);
  }
};
function yt(t38) {
  if (ee(t38)) return t38.map((i) => yt(i));
  if (typeof t38 == "string") return x.fromJson(t38);
  t38 = h({}, t38);
  for (let i of Ir) t38[i] && (t38[i] = yt(t38[i]));
  t38.args && (t38.args = Mg(t38.args)), t38.array && (t38.array = yt(t38.array));
  let e = t38.type, r;
  e === "accent" && (r = Nr.fromJson(t38)), e === "array" && (r = z.fromJson(t38)), e === "box" && (r = at.fromJson(t38)), e === "chem" && (r = to.fromJson(t38)), e === "composition" && (r = sn.fromJson(t38)), e === "delim" && (r = mn.fromJson(t38)), e === "enclose" && (r = ur.fromJson(t38)), e === "error" && (r = gt.fromJson(t38)), e === "extensible-symbol" && (r = fi.fromJson(t38)), e === "genfrac" && (r = st.fromJson(t38)), e === "group" && (r = ln.fromJson(t38)), e === "latex" && (r = he.fromJson(t38)), e === "latexgroup" && (r = Ft.fromJson(t38)), e === "leftright" && (r = J.fromJson(t38)), e === "macro" && (r = cn.fromJson(t38)), e === "macro-argument" && (r = Qa.fromJson(t38)), e === "operator" && (r = xt.fromJson(t38)), e === "overlap" && (r = bt.fromJson(t38)), e === "overunder" && (r = Ae.fromJson(t38)), e === "placeholder" && (r = Me.fromJson(t38)), e === "prompt" && (r = un.fromJson(t38)), e === "phantom" && (r = $t.fromJson(t38)), e === "sizeddelim" && (r = hn.fromJson(t38)), e === "spacing" && (r = Vt.fromJson(t38)), e === "subsup" && (r = cr.fromJson(t38)), e === "surd" && (r = fn.fromJson(t38)), e === "text" && (r = We.fromJson(t38)), e === "tooltip" && (r = gi.fromJson(t38)), r || (r = x.fromJson(t38));
  for (let i of Ir) t38[i] && r.setChildren(t38[i], i);
  return t38.verbatimLatex !== void 0 && (r.verbatimLatex = t38.verbatimLatex), t38.subsupPlacement && (r.subsupPlacement = t38.subsupPlacement), t38.explicitSubsupPlacement && (r.explicitSubsupPlacement = true), t38.isFunction && (r.isFunction = true), t38.skipBoundary && (r.skipBoundary = true), t38.captureSelection && (r.captureSelection = true), r;
}
function Mg(t38) {
  if (t38) {
    if (typeof t38 == "string") return t38;
    if (Array.isArray(t38)) return t38.map((e) => e === "<null>" ? null : typeof e == "object" && "group" in e ? { group: e.group.map((r) => yt(r)) } : typeof e == "object" && "atoms" in e ? e.atoms.map((r) => yt(r)) : e);
  }
}
function oo(t38, e) {
  !t38 || !e || (ee(t38) ? t38.forEach((r) => oo(r, e)) : typeof t38 == "object" && t38.applyStyle(e, { unstyledOnly: true }));
}
function ao(t38, e, r, i) {
  function n(a, s) {
    for (let l of o) if (l.style[a] !== s) return false;
    return true;
  }
  if (e = t38.normalizeRange(e), e[0] === e[1]) return false;
  let o = t38.getAtoms(e, { includeChildren: true });
  i.operation === "toggle" && (r.color && n("color", r.color) && (r.color = "none", delete r.verbatimColor), r.backgroundColor && n("backgroundColor", r.backgroundColor) && (r.backgroundColor = "none", delete r.verbatimBackgroundColor), r.fontFamily && n("fontFamily", r.fontFamily) && (r.fontFamily = "none"), r.fontSeries && n("fontSeries", r.fontSeries) && (r.fontSeries = "auto"), r.fontShape && n("fontShape", r.fontShape) && (r.fontShape = "auto"), r.fontSize && n("fontSize", r.fontSize) && (r.fontSize = ji), r.variant && n("variant", r.variant) && (r.variant = "normal"), r.variantStyle && n("variantStyle", r.variantStyle) && (r.variantStyle = ""));
  for (let a of o) a.applyStyle(r);
  return true;
}
function yh(t38) {
  return { up: "italic", bold: "bolditalic", italic: "italic", bolditalic: "bolditalic", "": "italic" }[t38 != null ? t38 : ""];
}
function so(t38) {
  return { up: "up", bold: "bold", italic: void 0, bolditalic: "bold", "": void 0 }[t38 != null ? t38 : ""];
}
var xh = { acute: 714, grave: 715, dot: 729, ddot: 168, dddot: 8411, ddddot: 8412, mathring: 730, tilde: 126, bar: 713, breve: 728, check: 711, hat: 94, vec: 8407 };
M(Object.keys(xh), "{body:auto}", { createAtom: (t38) => new Nr(g(h({}, t38), { body: T(t38.args[0]), accentChar: xh[t38.command.slice(1)] })) });
M(["widehat", "widecheck", "widetilde"], "{body:auto}", { createAtom: (t38) => {
  let e = pl(T(t38.args[0]));
  return new Nr(g(h({}, t38), { body: T(t38.args[0]), svgAccent: t38.command.slice(1) + (e.length > 5 ? "4" : ["1", "1", "2", "2", "3", "3"][e.length]) }));
} });
M(["overarc", "overparen", "wideparen"], "{body:auto}", { createAtom: (t38) => new Nr(g(h({}, t38), { body: T(t38.args[0]), svgAccent: "overarc" })) });
M(["underarc", "underparen"], "{body:auto}", { createAtom: (t38) => new Ae(g(h({}, t38), { body: T(t38.args[0]), svgBelow: "underarc" })) });
M("utilde", "{body:auto}", { createAtom: (t38) => {
  let e = T(t38.args[0]), r = pl(e), i = "widetilde" + (r.length > 5 ? "4" : ["1", "1", "2", "2", "3", "3"][r.length]);
  return new Ae(g(h({}, t38), { body: e, svgBelow: i, boxType: ci(e) }));
} });
M("^", "{:string}", { createAtom: (t38) => {
  var e;
  return new x(g(h({}, t38), { type: "mord", isFunction: false, limits: "adjacent", value: t38.args[0] && (e = { a: "â", e: "ê", i: "î", o: "ô", u: "û", A: "Â", E: "Ê", I: "Î", O: "Ô", U: "Û" }[t38.args[0]]) != null ? e : "^" }));
} });
M("`", "{:string}", { createAtom: (t38) => {
  var e;
  return new x(g(h({}, t38), { type: "mord", isFunction: false, limits: "adjacent", value: t38.args[0] && (e = { a: "à", e: "è", i: "ì", o: "ò", u: "ù", A: "À", E: "È", I: "Ì", O: "Ò", U: "Ù" }[t38.args[0]]) != null ? e : "`" }));
} });
M("'", "{:string}", { createAtom: (t38) => {
  var e;
  return new x(g(h({}, t38), { type: "mord", isFunction: false, limits: "adjacent", value: t38.args[0] && (e = { a: "á", e: "é", i: "í", o: "ó", u: "ú", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú" }[t38.args[0]]) != null ? e : "'" }));
} });
M('"', "{:string}", { createAtom: (t38) => {
  var e, r;
  return new x(g(h({}, t38), { type: "mord", isFunction: false, limits: "adjacent", value: (e = t38.args) != null && e[0] ? (r = { a: "ä", e: "ë", i: "ï", o: "ö", u: "ü", A: "Ä", E: "Ë", I: "Ë", O: "Ö", U: "Ü" }[t38.args[0]]) != null ? r : '"' + t38.args[0] : '"' }));
} });
M(".", "{:string}", { createAtom: (t38) => {
  var e, r;
  return new x(g(h({}, t38), { type: "mord", isFunction: false, limits: "adjacent", value: (e = t38.args) != null && e[0] ? (r = { a: "ȧ", e: "ė", i: "̇i", o: "ȯ", u: "̇u", A: "Ȧ", E: "Ė", I: "İ", O: "Ȯ", U: "̇U" }[t38.args[0]]) != null ? r : "." + t38.args[0] : "." }));
} });
M("=", "{:string}", { createAtom: (t38) => {
  var e, r;
  return new x(g(h({}, t38), { type: "mord", isFunction: false, limits: "adjacent", value: (e = t38.args) != null && e[0] ? (r = { a: "ā", e: "ē", i: "ī", o: "ō", u: "ū", A: "Ā", E: "Ē", I: "Ī", O: "Ō", U: "Ū" }[t38.args[0]]) != null ? r : "=" + t38.args[0] : "=" }));
} });
M("~", "{:string}", { createAtom: (t38) => {
  var e;
  return new x(g(h({ type: "mord" }, t38), { isFunction: false, limits: "adjacent", value: t38.args[0] && (e = { n: "ñ", N: "Ñ", a: "ã", o: "õ", A: "Ã", O: "Õ" }[t38.args[0]]) != null ? e : "´" }));
} });
M("c", "{:string}", { createAtom: (t38) => {
  var e;
  return new x(g(h({}, t38), { type: "mord", isFunction: false, limits: "adjacent", value: t38.args[0] && (e = { c: "ç", C: "Ç" }[t38.args[0]]) != null ? e : "" }));
} });
var wg = /* @__PURE__ */ new Set(["downdiagonalstrike", "updiagonalstrike", "verticalstrike", "horizontalstrike", "updiagonalarrow", "right", "bottom", "left", "top", "circle", "roundedbox", "madruwb", "actuarial", "box", "phasorangle", "longdiv"]);
function Sg(t38, e) {
  let r = [], i = 0, n = false, o = "";
  for (let a of t38) a === '"' ? n = !n : !n && a === "(" ? i += 1 : !n && a === ")" && (i = Math.max(0, i - 1)), a === e && i === 0 && !n ? (o.length > 0 && r.push(o), o = "") : o += a;
  return o.length > 0 && r.push(o), r;
}
M("enclose", "{notation:string}[style:string]{body:auto}", { createAtom: (t38) => {
  var n, o;
  let e = t38.args, r = { strokeColor: "currentColor", strokeWidth: "", strokeStyle: "solid", backgroundcolor: "transparent", padding: "auto", shadow: "none", svgStrokeStyle: void 0, borderStyle: void 0, style: (n = t38.style) != null ? n : {} };
  if (e[1]) {
    let a = Sg(e[1], ",");
    for (let s of a) {
      let l = s.match(/^\s*([a-z]*)\s*=\s*"(.*)"\s*$/);
      if (l) l[1] === "mathbackground" ? r.backgroundcolor = l[2] : l[1] === "mathcolor" ? r.strokeColor = l[2] : l[1] === "padding" ? r.padding = l[2] : l[1] === "shadow" && (r.shadow = l[2]);
      else {
        let c = s.match(/\s*(\S+)\s+(\S+)\s+(.*)/);
        c && (r.strokeWidth = c[1], r.strokeStyle = c[2], r.strokeColor = c[3]);
      }
    }
    r.strokeStyle === "dashed" ? r.svgStrokeStyle = "5,5" : r.strokeStyle === "dotted" && (r.svgStrokeStyle = "1,5");
  }
  r.borderStyle = `${r.strokeWidth} ${r.strokeStyle} ${r.strokeColor}`;
  let i = {};
  return ((o = e[0]) != null ? o : "").split(/[, ]/).filter((a) => a.length > 0).forEach((a) => {
    let s = a.toLowerCase();
    wg.has(s) && (i[s] = true);
  }), new ur(t38.command, T(e[2]), i, r);
} });
M("cancel", "{body:auto}", { createAtom: (t38) => {
  var e;
  return new ur(t38.command, T(t38.args[0]), { updiagonalstrike: true }, { strokeColor: "currentColor", strokeWidth: "", strokeStyle: "solid", borderStyle: "1px solid currentColor", backgroundcolor: "transparent", padding: "auto", shadow: "none", style: (e = t38.style) != null ? e : {} });
} });
M("bcancel", "{body:auto}", { createAtom: (t38) => {
  var e;
  return new ur(t38.command, T(t38.args[0]), { downdiagonalstrike: true }, { strokeColor: "currentColor", strokeWidth: "", strokeStyle: "solid", borderStyle: "1px solid currentColor", backgroundcolor: "transparent", padding: "auto", shadow: "none", style: (e = t38.style) != null ? e : {} });
} });
M("xcancel", "{body:auto}", { createAtom: (t38) => {
  var e;
  return new ur(t38.command, T(t38.args[0]), { updiagonalstrike: true, downdiagonalstrike: true }, { strokeColor: "currentColor", strokeWidth: "", strokeStyle: "solid", borderStyle: "1px solid currentColor", backgroundcolor: "transparent", padding: "auto", shadow: "none", style: (e = t38.style) != null ? e : {} });
} });
Go(["math", "displaymath"], ze);
Go("center", ze);
Et(["multline", "multline*"], "", ze);
M("displaylines", "", { parse: (t38) => {
  if (t38.skipWhitespace(), !t38.match("<{>")) return [];
  let e = [], r = [];
  t38.mathlist.length > 0 && e.push([t38.mathlist]), t38.beginContext({ tabular: true, root: true });
  do {
    if (t38.end() || t38.match("<}>")) break;
    t38.matchColumnSeparator() || t38.matchRowSeparator() ? (e.push([r]), r = []) : r.push(...t38.scan((n) => ["<}>", "&", "\\cr", "\\\\", "\\tabularnewline"].includes(n)));
  } while (true);
  t38.endContext(), e.push([r]);
  let i = t38.scan();
  return i.length > 0 && e.push([i]), e;
}, createAtom: (t38) => new z("lines", t38.args, [], { leftDelim: ".", rightDelim: ".", columns: [{ align: "l" }], classes: ["ML__multiline_environment"], isRoot: true, minColumns: 1, maxColumns: 1, minRows: 1 }) });
Et("split", "", ze);
Et(["gather", "gather*", "gathered"], "", ze);
Et(["equation", "equation*", "subequations"], "", ze);
Go(["align", "align*", "eqnarray"], ze, { tabular: true });
Et(["aligned"], "", ze);
Et("array", "{columns:colspec}", (t38, e, r, i) => new z(t38, e, r, { columns: i[0], mathstyleName: "textstyle" }));
Et(["matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "matrix*", "pmatrix*", "bmatrix*", "Bmatrix*", "vmatrix*", "Vmatrix*"], "[columns:colspec]", ze);
Et(["smallmatrix", "smallmatrix*"], "[columns:colspec]", ze);
Et(["cases", "dcases", "rcases"], "", ze);
function ze(t38, e = [[[]]], r = [], i = [], n) {
  switch (t38) {
    case "math":
      return new z(t38, e, r, { mathstyleName: "textstyle", isRoot: true, minColumns: 1, maxColumns: 1, minRows: 1, maxRows: 1 });
    case "displaymath":
      return new z(t38, e, r, { mathstyleName: "textstyle", isRoot: true, minColumns: 1, maxColumns: 1, minRows: 1, maxRows: 1 });
    case "center":
      return new z(t38, e, r, { columns: [{ align: "c" }], classes: ["ML__center_environment"], isRoot: true, minColumns: 1, maxColumns: 1, minRows: 1, maxRows: 1 });
    case "multline":
    case "multline*":
      return new z(t38, e, r, { columns: [{ align: "m" }], leftDelim: ".", rightDelim: ".", isRoot: true, minColumns: 1, maxColumns: 1, minRows: 1 });
    case "split":
      return new z(t38, e, r, { columns: [{ align: "r" }, { align: "l" }], minColumns: 2, minRows: 1, isRoot: false });
    case "gather":
    case "gather*":
      return new z(t38, e, r, { columns: [{ gap: 0.25 }, { align: "c" }, { gap: 0 }], minColumns: 1, maxColumns: 1, minRows: 1, isRoot: true, classes: ["ML__gather_environment"] });
    case "gathered":
      return new z(t38, e, r, { columns: [{ gap: 0.25 }, { align: "c" }, { gap: 0 }], minColumns: 1, maxColumns: 1, minRows: 1 });
    case "equation":
    case "equation*":
    case "subequations":
      return new z(t38, e, r, { columns: [{ align: "c" }], isRoot: true, minColumns: 1, maxColumns: 1, minRows: 1 });
    case "aligned": {
      let o = 0;
      for (let l of e) o = Math.max(o, l.length);
      let a = [{ gap: 0 }, { align: "r" }, { gap: 0.25 }, { align: "l" }], s = 2;
      for (; s < o; ) a.push({ gap: 1 }, { align: "r" }, { gap: 0.25 }, { align: "l" }), s += 2;
      return a.push({ gap: 0 }), new z(t38, e, r, { arraycolsep: 0, columns: a, minColumns: 2, minRows: 1, isRoot: t38 !== "aligned" });
    }
    case "eqnarray":
      return new z(t38, e, r, { arraycolsep: 0, columns: [{ gap: 0 }, { align: "r" }, { align: "c" }, { align: "l" }], minColumns: 3, maxColumns: 3, minRows: 1, isRoot: true, classes: ["ML__eqnarray_environment"] });
    case "align":
    case "align*":
      return new z(t38, e, r, { arraycolsep: 0, columns: [{ gap: 0 }, { align: "r" }, { gap: 0.25 }, { align: "l" }], minColumns: 2, maxColumns: 2, minRows: 1, isRoot: true, classes: ["ML__align_environment"] });
    case "pmatrix":
    case "pmatrix*":
      return new z(t38, e, r, { mathstyleName: "textstyle", leftDelim: "(", rightDelim: ")", columns: bi(i[0], n) });
    case "bmatrix":
    case "bmatrix*":
      return new z(t38, e, r, { mathstyleName: "textstyle", leftDelim: "[", rightDelim: "]", columns: bi(i[0], n) });
    case "Bmatrix":
    case "Bmatrix*":
      return new z(t38, e, r, { mathstyleName: "textstyle", leftDelim: "\\lbrace", rightDelim: "\\rbrace", columns: bi(i[0], n) });
    case "vmatrix":
    case "vmatrix*":
      return new z(t38, e, r, { mathstyleName: "textstyle", leftDelim: "\\vert", rightDelim: "\\vert", columns: bi(i[0], n) });
    case "Vmatrix":
    case "Vmatrix*":
      return new z(t38, e, r, { mathstyleName: "textstyle", leftDelim: "\\Vert", rightDelim: "\\Vert", columns: bi(i[0], n) });
    case "matrix":
    case "matrix*":
      return new z(t38, e, r, { mathstyleName: "textstyle", leftDelim: ".", rightDelim: ".", columns: bi(i == null ? void 0 : i[0], n) });
    case "smallmatrix":
    case "smallmatrix*":
      return new z(t38, e, r, { mathstyleName: "scriptstyle", columns: bi(i == null ? void 0 : i[0], n), colSeparationType: "small", arraystretch: 0.5 });
    case "cases":
    case "dcases":
      return new z(t38, e, r, { mathstyleName: t38 === "dcases" ? "displaystyle" : "textstyle", arraystretch: 1.2, leftDelim: "\\lbrace", rightDelim: ".", columns: vh() });
    case "rcases":
      return new z(t38, e, r, { arraystretch: 1.2, leftDelim: ".", rightDelim: "\\rbrace", columns: vh() });
    case "lines":
      return new z(t38, e, r, { leftDelim: ".", rightDelim: ".", columns: [{ align: "l" }], isRoot: true, minColumns: 1, maxColumns: 1, minRows: 1 });
  }
  return new z(t38, e, r, { mathstyleName: "textstyle" });
}
function bi(t38, e = 10) {
  return t38 != null ? t38 : Array(e).fill({ align: "c" });
}
function vh(t38 = 10) {
  let e = [];
  for (let r = 0; r < t38; r++) r > 0 && e.push({ gap: 1 }), e.push({ align: "l" });
  return e;
}
M(["overrightarrow", "overleftarrow", "Overrightarrow", "overleftharpoon", "overrightharpoon", "overleftrightarrow", "overlinesegment", "overgroup"], "{:auto}", { createAtom: (t38) => {
  var e;
  return new Ae(g(h({}, t38), { body: T((e = t38.args) == null ? void 0 : e[0]), skipBoundary: false, supsubPlacement: "over-under", paddedBody: true, boxType: "rel", svgAbove: t38.command.slice(1) }));
} });
M("overbrace", "{:auto}", { createAtom: (t38) => new Ae(g(h({}, t38), { body: T(t38.args[0]), skipBoundary: false, supsubPlacement: "over-under", paddedBody: true, boxType: "ord", svgAbove: t38.command.slice(1) })) });
M(["underrightarrow", "underleftarrow", "underleftrightarrow", "underlinesegment", "undergroup"], "{:auto}", { createAtom: (t38) => new Ae(g(h({}, t38), { body: T(t38.args[0]), skipBoundary: false, supsubPlacement: "over-under", paddedBody: true, boxType: "rel", svgBelow: t38.command.slice(1) })) });
M(["underbrace"], "{:auto}", { createAtom: (t38) => new Ae(g(h({}, t38), { body: T(t38.args[0]), skipBoundary: false, supsubPlacement: "over-under", paddedBody: true, boxType: "ord", svgBelow: t38.command.slice(1) })) });
M(["xrightarrow", "longrightarrow", "xleftarrow", "longleftarrow", "xRightarrow", "xLeftarrow", "xleftharpoonup", "xleftharpoondown", "xrightharpoonup", "xrightharpoondown", "xlongequal", "xtwoheadleftarrow", "xtwoheadrightarrow", "xleftrightarrow", "longleftrightarrow", "xLeftrightarrow", "xrightleftharpoons", "longrightleftharpoons", "xleftrightharpoons", "xhookleftarrow", "xhookrightarrow", "xmapsto", "xtofrom", "xleftrightarrows", "longleftrightarrows", "xRightleftharpoons", "longRightleftharpoons", "xLeftrightharpoons", "longLeftrightharpoons"], "[:auto]{:auto}", { createAtom: (t38) => {
  var e, r, i, n, o;
  return new Ae(g(h({}, t38), { svgBody: t38.command.slice(1), above: ((r = T((e = t38.args) == null ? void 0 : e[1])) == null ? void 0 : r.length) === 0 ? void 0 : T((i = t38.args) == null ? void 0 : i[1]), below: (o = T((n = t38.args) == null ? void 0 : n[0])) != null ? o : null, skipBoundary: false, supsubPlacement: "over-under", paddedBody: true, paddedLabels: true, boxType: "rel" }));
}, serialize: (t38, e) => t38.command + (t38.hasEmptyBranch("below") ? "" : `[${t38.belowToLatex(e)}]`) + `{${t38.aboveToLatex(e)}}${t38.supsubToLatex(e)}` });
M(["arccos", "arcsin", "arctan", "arctg", "arcctg", "arg", "ch", "cos", "cosh", "cot", "cotg", "coth", "ctg", "cth", "csc", "cosec", "deg", "dim", "exp", "gcd", "hom", "inf", "ker", "lb", "lg", "ln", "log", "Pr", "sec", "sh", "sin", "sinh", "sup", "tan", "tanh", "tg", "th", "arcsec", "arccsc", "arsinh", "arcosh", "artanh", "arcsech", "arccsch"], "", { isFunction: true, ifMode: "math", createAtom: (t38) => new xt(t38.command.slice(1), g(h({}, t38), { limits: "adjacent", isFunction: true, variant: "main", variantStyle: "up" })) });
M(["liminf", "limsup"], "", { ifMode: "math", createAtom: (t38) => new xt({ "\\liminf": "lim inf", "\\limsup": "lim sup" }[t38.command], g(h({}, t38), { limits: "over-under", variant: "main" })) });
M(["lim", "mod"], "", { ifMode: "math", createAtom: (t38) => new xt(t38.command.slice(1), g(h({}, t38), { limits: "over-under", variant: "main" })) });
M(["det", "max", "min"], "", { ifMode: "math", isFunction: true, createAtom: (t38) => new xt(t38.command.slice(1), g(h({}, t38), { limits: "over-under", isFunction: true, variant: "main" })) });
M("ang", "{:math}", { ifMode: "math", createAtom: (t38) => new x(g(h({}, t38), { body: T(t38.args[0]) })), serialize: (t38, e) => `\\ang{${t38.bodyToLatex(e)}}`, render: (t38, e) => {
  let r = t38.createBox(e), i = r.caret;
  r.caret = void 0;
  let n = new w("°", { style: g(h({}, t38.style), { variant: "normal", variantStyle: "up" }) });
  return new w([r, n], { type: "inner", isSelected: t38.isSelected, caret: i });
} });
M("sqrt", "[index:auto]{radicand:expression}", { ifMode: "math", createAtom: (t38) => new fn(g(h({}, t38), { body: T(t38.args[1]), index: t38.args[0] ? T(t38.args[0]) : void 0 })) });
M(["frac", "dfrac", "tfrac", "binom", "dbinom", "tbinom"], "{:expression}{:expression}", { ifMode: "math", createAtom: (t38) => {
  let e = h({}, t38), r = t38.command, i = t38.args;
  switch (r) {
    case "\\dfrac":
    case "\\frac":
    case "\\tfrac":
      e.hasBarLine = true;
      break;
    case "\\atopfrac":
      e.hasBarLine = false;
      break;
    case "\\dbinom":
    case "\\binom":
    case "\\tbinom":
      e.hasBarLine = false, e.leftDelim = "(", e.rightDelim = ")";
      break;
    case "\\cfrac":
      e.hasBarLine = true, e.continuousFraction = true;
      break;
  }
  switch (r) {
    case "\\dfrac":
    case "\\dbinom":
      e.mathstyleName = "displaystyle";
      break;
    case "\\tfrac":
    case "\\tbinom":
      e.mathstyleName = "textstyle";
      break;
  }
  return new st(i[0] ? T(i[0]) : [new Me()], i[1] ? T(i[1]) : [new Me()], e);
}, serialize: (t38, e) => {
  let r = t38.aboveToLatex(e), i = t38.belowToLatex(e);
  return /^[0-9]$/.test(r) && /^[0-9]$/.test(i) ? `${t38.command}${r}${i}` : U(t38.command, r, i);
} });
M(["cfrac"], "[:string]{:expression}{:expression}", { ifMode: "math", createAtom: (t38) => {
  let e = h({}, t38), r = t38.args;
  return e.hasBarLine = true, e.continuousFraction = true, r[0] === "r" && (e.align = "right"), r[0] === "l" && (e.align = "left"), new st(r[1] ? T(r[1]) : [new Me()], r[2] ? T(r[2]) : [new Me()], e);
}, serialize: (t38, e) => {
  let r = t38.aboveToLatex(e), i = t38.belowToLatex(e);
  return U(t38.command, r, i);
} });
var _h = ["displaystyle", "textstyle", "scriptstyle", "scriptscriptstyle"];
M("genfrac", "{left-delim:delim}{right-delim:delim}{thickness:value}{mathstyle:string}{numerator:expression}{denominator:expression}", { ifMode: "math", createAtom: (t38) => {
  let [e, r, i, n, o, a] = t38.args, s = h({}, t38);
  e && e !== "." && (s.leftDelim = e), r && r !== "." && (s.rightDelim = r), i ? (s.barThickness = i, s.hasBarLine = !kg(i)) : s.hasBarLine = true;
  let l = n == null ? void 0 : n.trim();
  return l && /^[0-3]$/.test(l) && (s.mathstyleName = _h[Number(l)]), new st(o ? T(o) : [new Me()], a ? T(a) : [new Me()], s);
}, serialize: (t38, e) => {
  var i, n, o;
  let r = t38.mathstyleName ? _h.indexOf(t38.mathstyleName) : -1;
  return U(t38.command, (i = t38.leftDelim) != null ? i : "", (n = t38.rightDelim) != null ? n : "", (o = ge(t38.barThickness)) != null ? o : "", r >= 0 ? r.toString() : "", t38.aboveToLatex(e), t38.belowToLatex(e));
} });
function kg(t38) {
  return "dimension" in t38 ? t38.dimension === 0 : "glue" in t38 ? t38.glue.dimension === 0 : "number" in t38 ? t38.number === 0 : "string" in t38 ? parseFloat(t38.string) === 0 : false;
}
M(["brace", "brack"], "", { infix: true, createAtom: (t38) => new st(T(t38.args[0]), T(t38.args[1]), g(h({}, t38), { hasBarLine: false, leftDelim: t38.command === "\\brace" ? "\\lbrace" : "\\lbrack", rightDelim: t38.command === "\\brace" ? "\\rbrace" : "\\rbrack" })), serialize: (t38, e) => R([t38.aboveToLatex(e), t38.command, t38.belowToLatex(e)]) });
M(["over", "atop", "choose"], "", { infix: true, createAtom: (t38) => {
  let e, r, i = t38.args;
  return t38.command === "\\choose" && (e = "(", r = ")"), new st(T(i[0]), T(i[1]), g(h({}, t38), { hasBarLine: t38.command === "\\over", leftDelim: e, rightDelim: r }));
}, serialize: (t38, e) => R([t38.aboveToLatex(e), t38.command, t38.belowToLatex(e)]) });
M(["overwithdelims", "atopwithdelims"], "{numer:auto}{denom:auto}{left-delim:delim}{right-delim:delim}", { infix: true, createAtom: (t38) => {
  var r, i;
  let e = t38.args;
  return new st(T(e[0]), T(e[1]), g(h({}, t38), { leftDelim: (r = e[2]) != null ? r : ".", rightDelim: (i = e[3]) != null ? i : ".", hasBarLine: false }));
}, serialize: (t38, e) => `${t38.aboveToLatex(e)} ${t38.command}${t38.leftDelim}${t38.rightDelim}${t38.belowToLatex(e)}` });
M("pdiff", "{numerator}{denominator}", { ifMode: "math", createAtom: (t38) => new st(T(t38.args[0]), T(t38.args[1]), g(h({}, t38), { hasBarLine: true, numerPrefix: "∂", denomPrefix: "∂" })), serialize: (t38, e) => R([t38.aboveToLatex(e), t38.command, t38.belowToLatex(e)]) });
M(["sum", "prod", "bigcup", "bigcap", "coprod", "bigvee", "bigwedge", "biguplus", "bigotimes", "bigoplus", "bigodot", "bigsqcup", "intop"], "", { ifMode: "math", createAtom: (t38) => new fi({ coprod: "∐", bigvee: "⋁", bigwedge: "⋀", biguplus: "⨄", bigcap: "⋂", bigcup: "⋃", intop: "∫", prod: "∏", sum: "∑", bigotimes: "⨂", bigoplus: "⨁", bigodot: "⨀", bigsqcup: "⨆", smallint: "∫" }[t38.command.slice(1)], g(h({}, t38), { limits: "auto", variant: "main" })) });
M("smallint", "", { ifMode: "math", createAtom: (t38) => new xt("∫", g(h({}, t38), { limits: "adjacent", variant: "main" })) });
var Mh = { int: "∫", iint: "∬", iiint: "∭", oint: "∮", oiint: "∯", oiiint: "∰", intclockwise: "∱", varointclockwise: "∲", ointctrclockwise: "∳", intctrclockwise: "⨑", sqcup: "⊔", sqcap: "⊓", uplus: "⊎", wr: "≀", amalg: "⨿", Cap: "⋒", Cup: "⋓", doublecap: "⋒", doublecup: "⋓" };
M(Object.keys(Mh), "", { ifMode: "math", createAtom: (t38) => {
  let e = t38.command, r = Mh[e.slice(1)];
  return new fi(r, g(h({}, t38), { limits: "adjacent", variant: { "⋒": "ams", "⋓": "ams" }[r] }));
} });
M(["Re", "Im"], "", { ifMode: "math", createAtom: (t38) => new xt({ "\\Re": "ℜ", "\\Im": "ℑ" }[t38.command], g(h({}, t38), { limits: "adjacent", isFunction: true, variant: "fraktur" })) });
M("middle", "{:delim}", { ifMode: "math", createAtom: (t38) => {
  var e;
  return new mn(g(h({}, t38), { delim: (e = t38.args[0]) != null ? e : "|", size: 1 }));
} });
M("the", "{:value}", { createAtom: (t38) => new x(g(h({}, t38), { captureSelection: true, verbatimLatex: null })), render: (t38, e) => {
  var o;
  let r = new P({ parent: e }, t38.style), i = "";
  t38.isSelected && (i += " ML__selected");
  let n = r.evaluate(t38.args[0]);
  return new w(((o = ge(n)) != null ? o : "").split("").map((a) => new w(a, { type: "ord", classes: i, mode: t38.mode, isSelected: t38.isSelected, style: h({ variant: "main" }, t38.style) })), { type: "lift", style: t38.style, caret: t38.caret, isSelected: t38.isSelected, classes: i }).wrap(r);
}, serialize: (t38) => {
  var e;
  return `\\the${(e = ge(t38.args[0])) != null ? e : "\\relax"}`;
} });
M("mathtip", "{:auto}{:math}", { createAtom: (t38) => new gi(g(h({}, t38), { body: T(t38.args[0]), tooltip: T(t38.args[1]), content: "math" })), serialize: (t38, e) => e.skipStyles ? t38.bodyToLatex(e) : `\\mathtip{${t38.bodyToLatex(e)}}{${x.serialize([t38.tooltip], g(h({}, e), { defaultMode: "math" }))}}` });
M("texttip", "{:auto}{:text}", { createAtom: (t38) => new gi(g(h({}, t38), { body: T(t38.args[0]), tooltip: T(t38.args[1]), content: "text" })), serialize: (t38, e) => e.skipStyles ? t38.bodyToLatex(e) : `\\texttip{${t38.bodyToLatex(e)}}{${x.serialize([t38.tooltip], g(h({}, e), { defaultMode: "text" }))}}` });
M("error", "{:math}", { createAtom: (t38) => new x(g(h({}, t38), { body: T(t38.args[0]) })), serialize: (t38, e) => `\\error{${t38.bodyToLatex(e)}}`, render: (t38, e) => t38.createBox(e, { classes: "ML__error" }) });
M("ensuremath", "{:math}", { createAtom: (t38) => new x(g(h({}, t38), { body: T(t38.args[0]) })), serialize: (t38, e) => `${t38.command}{${t38.bodyToLatex(g(h({}, e), { defaultMode: "math" }))}}` });
M("color", "{:value}", { applyStyle: (t38, e, r, i) => {
  var n, o;
  return g(h({}, t38), { verbatimColor: (n = ge(r[0])) != null ? n : void 0, color: i.toColor((o = r[0]) != null ? o : { string: "red" }) });
} });
M("textcolor", "{:value}{content:auto*}", { applyStyle: (t38, e, r, i) => {
  var n, o;
  return g(h({}, t38), { verbatimColor: (n = ge(r[0])) != null ? n : void 0, color: i.toColor((o = r[0]) != null ? o : { string: "red" }) });
} });
M("boxed", "{content:math}", { createAtom: (t38) => new at(g(h({}, t38), { body: T(t38.args[0]), framecolor: { string: "black" } })) });
M("colorbox", "{:value}{:text*}", { applyStyle: (t38, e, r, i) => {
  var n, o;
  return g(h({}, t38), { verbatimBackgroundColor: (n = ge(r[0])) != null ? n : void 0, backgroundColor: i.toBackgroundColor((o = r[0]) != null ? o : { string: "yellow" }) });
} });
M("fcolorbox", "{frame-color:value}{background-color:value}{content:text}", { applyMode: "text", createAtom: (t38) => {
  var e, r;
  return new at(g(h({}, t38), { body: T(t38.args[2]), framecolor: (e = t38.args[0]) != null ? e : { string: "blue" }, backgroundcolor: (r = t38.args[1]) != null ? r : { string: "yellow" } }));
}, serialize: (t38, e) => {
  var r, i;
  return e.skipStyles ? t38.bodyToLatex(g(h({}, e), { defaultMode: "text" })) : U(t38.command, (r = ge(t38.framecolor)) != null ? r : "", (i = ge(t38.backgroundcolor)) != null ? i : "", t38.bodyToLatex(g(h({}, e), { defaultMode: "text" })));
} });
M("bbox", "[:bbox]{body:auto}", { createAtom: (t38) => {
  var i;
  let e = t38.args[0], r = T(t38.args[1]);
  return e ? new at(g(h({}, t38), { body: r, padding: e.padding, border: e.border, backgroundcolor: (i = e.backgroundcolor) != null ? i : void 0 })) : new at(g(h({}, t38), { body: r }));
}, serialize: (t38, e) => {
  var i, n;
  if (e.skipStyles) return t38.bodyToLatex(e);
  let r = t38.command;
  if (Number.isFinite(t38.padding) || t38.border !== void 0 || t38.backgroundcolor !== void 0) {
    let o = [];
    t38.padding && o.push((i = ge(t38.padding)) != null ? i : ""), t38.border && o.push(`border: ${t38.border}`), t38.backgroundcolor && o.push((n = ge(t38.backgroundcolor)) != null ? n : ""), r += `[${o.join(",")}]`;
  }
  return U(r, t38.bodyToLatex(e));
} });
M(["displaystyle", "textstyle", "scriptstyle", "scriptscriptstyle"], "{:rest}", { createAtom: (t38) => new x(g(h({}, t38), { body: T(t38.args[0]) })), render: (t38, e) => {
  let r = new P({ parent: e, mathstyle: t38.command.slice(1) }, t38.style), i = x.createBox(r, t38.body, { type: "lift" });
  return t38.caret && (i.caret = t38.caret), t38.bind(e, i);
}, serialize: (t38, e) => e.skipStyles ? t38.bodyToLatex(e) : `{${R([t38.command, t38.bodyToLatex(e)])}}` });
M(["tiny", "scriptsize", "footnotesize", "small", "normalsize", "large", "Large", "LARGE", "huge", "Huge"], "", { applyStyle: (t38, e) => g(h({}, t38), { fontSize: { "\\tiny": 1, "\\scriptsize": 2, "\\footnotesize": 3, "\\small": 4, "\\normalsize": 5, "\\large": 6, "\\Large": 7, "\\LARGE": 8, "\\huge": 9, "\\Huge": 10 }[e] }) });
M("fontseries", "{:string}", { ifMode: "text", applyStyle: (t38, e, r) => {
  var i;
  return g(h({}, t38), { fontSeries: (i = r[0]) != null ? i : "auto" });
} });
M("fontshape", "{:string}", { ifMode: "text", applyStyle: (t38, e, r) => {
  var i;
  return g(h({}, t38), { fontShape: (i = r[0]) != null ? i : "auto" });
} });
M("fontfamily", "{:string}", { ifMode: "text", applyStyle: (t38, e, r) => {
  var i;
  return g(h({}, t38), { fontFamily: (i = r[0]) != null ? i : "roman" });
} });
M("selectfont", "", { ifMode: "text", applyStyle: (t38) => t38 });
M("bf", "{:rest*}", { applyStyle: (t38) => g(h({}, t38), { fontSeries: "b", fontShape: "n", fontFamily: "roman" }) });
M(["boldsymbol", "bm", "bold"], "{:math*}", { applyMode: "math", applyStyle: (t38) => g(h({}, t38), { variantStyle: "bold" }) });
M("bfseries", "{:rest*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontSeries: "b" }) });
M("mdseries", "{:rest*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontSeries: "m" }) });
M("upshape", "{:rest*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontShape: "n" }) });
M("slshape", "{:rest*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontShape: "sl" }) });
M("scshape", "{:rest*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontShape: "sc" }) });
M("textbf", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontSeries: "b" }) });
M("textmd", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontSeries: "m" }) });
M("textup", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontShape: "n" }) });
M("textnormal", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontShape: "n", fontSeries: "m" }) });
M("textsl", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontShape: "sl" }) });
M("textit", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontShape: "it" }) });
M("textsc", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontShape: "sc" }) });
M("textrm", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontFamily: "roman" }) });
M("textsf", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontFamily: "sans-serif" }) });
M("texttt", "{:text*}", { applyMode: "text", applyStyle: (t38) => g(h({}, t38), { fontFamily: "monospace" }) });
M("mathbf", "{:math*}", { applyMode: "math", applyStyle: (t38) => g(h({}, t38), { variant: "normal", variantStyle: "bold" }) });
M("mathit", "{:math*}", { applyMode: "math", applyStyle: (t38) => g(h({}, t38), { variant: "main", variantStyle: "italic" }) });
M("mathnormal", "{:math*}", { applyMode: "math", applyStyle: (t38) => g(h({}, t38), { variant: "normal", variantStyle: "italic" }) });
M("mathbfit", "{:math*}", { applyMode: "math", applyStyle: (t38) => g(h({}, t38), { variant: "main", variantStyle: "bolditalic" }) });
M("mathrm", "{:math*}", { applyMode: "math", applyStyle: (t38) => g(h({}, t38), { variant: "normal", variantStyle: "up" }) });
M("mathsf", "{:math*}", { applyMode: "math", applyStyle: (t38) => g(h({}, t38), { variant: "sans-serif", variantStyle: "up" }) });
M("mathtt", "{:math*}", { applyMode: "math", applyStyle: (t38) => g(h({}, t38), { variant: "monospace", variantStyle: "up" }) });
M("it", "{:rest*}", { applyStyle: (t38) => g(h({}, t38), { fontSeries: "m", fontShape: "it", fontFamily: "roman", variantStyle: "italic" }) });
M("rmfamily", "{:rest*}", { applyStyle: (t38) => g(h({}, t38), { fontFamily: "roman" }) });
M("sffamily", "{:rest*}", { applyStyle: (t38) => g(h({}, t38), { fontFamily: "sans-serif" }) });
M("ttfamily", "{:rest*}", { applyStyle: (t38) => g(h({}, t38), { fontFamily: "monospace" }) });
M(["Bbb", "mathbb"], "{:math*}", { applyStyle: (t38) => g(h({}, t38), { variant: "double-struck", variantStyle: so(t38.variantStyle) }) });
M(["frak", "mathfrak"], "{:math*}", { applyStyle: (t38) => g(h({}, t38), { variant: "fraktur", variantStyle: so(t38.variantStyle) }) });
M("mathcal", "{:math*}", { applyStyle: (t38) => g(h({}, t38), { variant: "calligraphic", variantStyle: so(t38.variantStyle) }) });
M("mathscr", "{:math*}", { applyStyle: (t38) => g(h({}, t38), { variant: "script", variantStyle: so(t38.variantStyle) }) });
M("mbox", "{:text}", { ifMode: "math", createAtom: (t38) => new x(g(h({}, t38), { type: "mord", body: T(t38.args[0]), mode: "math" })), serialize: (t38, e) => U("\\mbox", t38.bodyToLatex(g(h({}, e), { defaultMode: "text" }))) });
M("text", "{:text}", { ifMode: "math", applyMode: "text" });
M(["class", "htmlClass"], "{name:string}{content:auto*}", { createAtom: (t38) => new x(g(h({}, t38), { type: "mord", body: T(t38.args[1]) })), serialize: (t38, e) => !t38.args[0] || e.skipStyles ? t38.bodyToLatex(e) : `${t38.command}{${t38.args[0]}}{${t38.bodyToLatex(e)}}`, render: (t38, e) => {
  var r;
  return t38.createBox(e, { classes: (r = t38.args[0]) != null ? r : "", boxType: "lift" });
} });
M(["cssId", "htmlId"], "{id:string}{content:auto*}", { createAtom: (t38) => new x(g(h({}, t38), { type: "mord", body: T(t38.args[1]) })), serialize: (t38, e) => {
  var r;
  return !((r = t38.args) != null && r[0]) || e.skipStyles ? t38.bodyToLatex(e) : `${t38.command}{${t38.args[0]}}{${t38.bodyToLatex(e)}}`;
}, render: (t38, e) => {
  var i;
  let r = t38.createBox(e);
  return r.cssId = (i = t38.args[0]) != null ? i : "", r;
} });
M("htmlData", "{data:string}{content:auto*}", { createAtom: (t38) => new x(g(h({}, t38), { type: "mord", body: T(t38.args[1]) })), serialize: (t38, e) => {
  var r;
  return !((r = t38.args) != null && r[0]) || e.skipStyles ? t38.bodyToLatex(e) : `\\htmlData{${t38.args[0]}}{${t38.bodyToLatex(e)}}`;
}, render: (t38, e) => {
  var i;
  let r = t38.createBox(e);
  return r.htmlData = (i = t38.args[0]) != null ? i : "", r;
} });
M(["style", "htmlStyle"], "{data:string}{content:auto*}", { createAtom: (t38) => new x(g(h({}, t38), { type: "mord", body: T(t38.args[1]) })), serialize: (t38, e) => {
  var r;
  return !((r = t38.args) != null && r[0]) || e.skipStyles ? t38.bodyToLatex(e) : `${t38.command}{${t38.args[0]}}{${t38.bodyToLatex(e)}}`;
}, render: (t38, e) => {
  var i;
  let r = t38.createBox(e);
  return r.htmlStyle = (i = t38.args[0]) != null ? i : "", r;
} });
M("href", "{url:string}{content:auto*}", { createAtom: (t38) => new x(g(h({}, t38), { type: "mord", body: T(t38.args[1]) })), render: (t38, e) => {
  var n;
  let r = t38.createBox(e), i = (n = t38.args[0]) != null ? n : "";
  return i && (r.htmlData = `href=${i}`), r;
} });
M("em", "{:rest}", { createAtom: (t38) => new x(g(h({}, t38), { body: T(t38.args[0]) })), serialize: (t38, e) => e.skipStyles ? t38.bodyToLatex(e) : `{\\em ${t38.bodyToLatex(e)}}`, render: (t38, e) => t38.createBox(e, { classes: "ML__emph", boxType: "lift" }) });
M("emph", "{:auto}", { createAtom: (t38) => new x(g(h({}, t38), { body: T(t38.args[1]) })), serialize: (t38, e) => e.skipStyles ? t38.bodyToLatex(e) : `\\emph{${t38.bodyToLatex(e)}}`, render: (t38, e) => t38.createBox(e, { classes: "ML__emph", boxType: "lift" }) });
var wh = { "\\bigl": { mclass: "mopen", size: 1 }, "\\Bigl": { mclass: "mopen", size: 2 }, "\\biggl": { mclass: "mopen", size: 3 }, "\\Biggl": { mclass: "mopen", size: 4 }, "\\bigr": { mclass: "mclose", size: 1 }, "\\Bigr": { mclass: "mclose", size: 2 }, "\\biggr": { mclass: "mclose", size: 3 }, "\\Biggr": { mclass: "mclose", size: 4 }, "\\bigm": { mclass: "mrel", size: 1 }, "\\Bigm": { mclass: "mrel", size: 2 }, "\\biggm": { mclass: "mrel", size: 3 }, "\\Biggm": { mclass: "mrel", size: 4 }, "\\big": { mclass: "mord", size: 1 }, "\\Big": { mclass: "mord", size: 2 }, "\\bigg": { mclass: "mord", size: 3 }, "\\Bigg": { mclass: "mord", size: 4 } };
M(["bigl", "Bigl", "biggl", "Biggl", "bigr", "Bigr", "biggr", "Biggr", "bigm", "Bigm", "biggm", "Biggm", "big", "Big", "bigg", "Bigg"], "{:delim}", { createAtom: (t38) => {
  var e;
  return new hn(g(h({}, t38), { delim: (e = t38.args[0]) != null ? e : ".", size: wh[t38.command].size, delimType: wh[t38.command].mclass }));
}, serialize: (t38, e) => R([t38.command, /^[a-zA-Z]/.test(t38.value) ? `{${t38.value}}` : t38.value]) });
M(["hspace", "hspace*"], "{width:value}", { createAtom: (t38) => {
  var e;
  return new Vt(g(h({}, t38), { width: (e = t38.args[0]) != null ? e : { dimension: 0 } }));
} });
M(["mkern", "kern", "mskip", "hskip", "mspace"], "{width:value}", { createAtom: (t38) => {
  var e;
  return new Vt(g(h({}, t38), { width: (e = t38.args[0]) != null ? e : { dimension: 0 } }));
} });
M("mathchoice", "{:math}{:math}{:math}{:math}", { createAtom: (t38) => new x(t38), render: (t38, e) => {
  let r = 0, i = e.mathstyle.id;
  (i === Yn || i === Kr) && (r = 1), (i === ui || i === He) && (r = 2), (i === Pr || i === Ee) && (r = 3);
  let n = T(t38.args[r]);
  return x.createBox(e, n);
}, serialize: (t38, e) => `\\mathchoice{${x.serialize(t38.args[0], e)}}{${x.serialize(t38.args[1], e)}}{${x.serialize(t38.args[2], e)}}{${x.serialize(t38.args[3], e)}}` });
M("mathop", "{:auto}", { createAtom: (t38) => new x(g(h({}, t38), { type: "mop", body: T(t38.args[0]), limits: "over-under", isFunction: true, captureSelection: true })), render: (t38, e) => {
  var i;
  let r = x.createBox(e, t38.body);
  if (t38.superscript || t38.subscript) {
    let n = (i = t38.subsupPlacement) != null ? i : "auto";
    r = n === "over-under" || n === "auto" && e.isDisplayStyle ? t38.attachLimits(e, { base: r }) : t38.attachSupsub(e, { base: r });
  }
  return t38.caret && (r.caret = t38.caret), new w(t38.bind(e, r), { type: "op", isSelected: t38.isSelected, classes: "ML__op-group" });
}, serialize: (t38, e) => {
  let r = [U(t38.command, t38.bodyToLatex(e))];
  return t38.explicitSubsupPlacement && (t38.subsupPlacement === "over-under" && r.push("\\limits"), t38.subsupPlacement === "adjacent" && r.push("\\nolimits"), t38.subsupPlacement === "auto" && r.push("\\displaylimits")), r.push(t38.supsubToLatex(e)), R(r);
} });
M(["mathbin", "mathrel", "mathopen", "mathclose", "mathpunct", "mathord", "mathinner"], "{:auto}", { createAtom: (t38) => new x(g(h({}, t38), { type: { "\\mathbin": "mbin", "\\mathrel": "mrel", "\\mathopen": "mopen", "\\mathclose": "mclose", "\\mathpunct": "mpunct", "\\mathord": "mord", "\\mathinner": "minner" }[t38.command], body: T(t38.args[0]) })) });
M(["operatorname", "operatorname*"], "{operator:math}", { createAtom: (t38) => {
  let e = T(t38.args[0]).map((r) => {
    var i;
    return r.type !== "first" && (r.type = "mord", r.value = (i = { "∗": "*", "−": "-" }[r.value]) != null ? i : r.value, r.isFunction = false, !r.style.variant && !r.style.variantStyle && (r.style.variant = "main", r.style.variantStyle = "up")), r;
  });
  return new x(g(h({}, t38), { type: "mop", body: e, isFunction: true, limits: t38.command === "\\operatorname" ? "adjacent" : "over-under" }));
}, render: (t38, e) => {
  var i;
  let r = x.createBox(e, t38.body);
  if (t38.superscript || t38.subscript) {
    let n = (i = t38.subsupPlacement) != null ? i : "auto";
    r = n === "over-under" || n === "auto" && e.isDisplayStyle ? t38.attachLimits(e, { base: r }) : t38.attachSupsub(e, { base: r });
  }
  return t38.caret && (r.caret = t38.caret), new w(t38.bind(e, r), { type: "op", isSelected: t38.isSelected, classes: "ML__op-group" });
}, serialize: (t38, e) => {
  let r = [U(t38.command, t38.bodyToLatex(e))];
  return t38.explicitSubsupPlacement && (t38.subsupPlacement === "over-under" && r.push("\\limits"), t38.subsupPlacement === "adjacent" && r.push("\\nolimits"), t38.subsupPlacement === "auto" && r.push("\\displaylimits")), r.push(t38.supsubToLatex(e)), R(r);
} });
M(["char", "unicode"], "{charcode:value}", { createAtom: (t38) => new x(g(h({}, t38), { type: t38.mode === "text" ? "text" : "mord" })), serialize: (t38) => {
  var e;
  return `${t38.command}${ge((e = t38.args[0]) != null ? e : { number: 10067, base: "hexadecimal" })}`;
}, render: (t38, e) => {
  let r = e.evaluate(t38.args[0]);
  return (!r || !("number" in r)) && (r = { number: 10067, base: "hexadecimal" }), t38.value = String.fromCodePoint(r.number), t38.createBox(e);
} });
M("rule", "[raise:value]{width:value}{thickness:value}", { createAtom: (t38) => new x(t38), render: (t38, e) => {
  var s, l, c;
  let r = new P({ parent: e, mathstyle: "textstyle" }, t38.style), i = r.toEm((s = t38.args[0]) != null ? s : { dimension: 0 }), n = r.toEm((l = t38.args[1]) != null ? l : { dimension: 10 }), o = r.toEm((c = t38.args[2]) != null ? c : { dimension: 10 }), a = new w(null, { classes: "ML__rule", type: "ord" });
  return a.width = n, a.height = o + i, a.depth = -i, a.setStyle("border-right-width", n, "em"), a.setStyle("border-top-width", o, "em"), a.setStyle("border-color", t38.style.color), a.setStyle("vertical-align", i, "em"), t38.isSelected && a.setStyle("opacity", "50%"), t38.bind(r, a), t38.caret && (a.caret = t38.caret), a.wrap(e);
}, serialize: (t38) => `\\rule${t38.args[0] ? `[${ge(t38.args[0])}]` : ""}{${ge(t38.args[1])}}{${ge(t38.args[2])}}` });
M(["overline", "underline"], "{:auto}", { createAtom: (t38) => new x(g(h({}, t38), { body: T(t38.args[0]) })), render: (t38, e) => {
  let r = t38.command.substring(1), i = new P({ parent: e, mathstyle: "cramp" }, t38.style), n = x.createBox(i, t38.body);
  if (!n) return null;
  let o = i.metrics.defaultRuleThickness / i.scalingFactor, a = new w(null, { classes: r + "-line" });
  a.height = o, a.maxFontSize = o * 1.125 * i.scalingFactor;
  let s;
  return r === "overline" ? s = new te({ shift: 0, children: [{ box: n }, 3 * o, { box: a }, o] }) : s = new te({ top: n.height, children: [o, { box: a }, 3 * o, { box: n }] }), t38.caret && (s.caret = t38.caret), new w(s, { classes: r, type: "ignore" });
} });
M("overset", "{:auto}{base:auto}", { createAtom: (t38) => {
  let e = T(t38.args[1]);
  return new Ae(g(h({}, t38), { above: T(t38.args[0]), body: e, skipBoundary: false, boxType: ci(e) }));
}, serialize: (t38, e) => U(t38.command, t38.aboveToLatex(e), t38.bodyToLatex(e)) });
M("underset", "{:auto}{base:auto}", { createAtom: (t38) => {
  let e = T(t38.args[1]);
  return new Ae(g(h({}, t38), { below: T(t38.args[0]), body: e, skipBoundary: false, boxType: ci(e) }));
}, serialize: (t38, e) => U(t38.command, t38.belowToLatex(e), t38.bodyToLatex(e)) });
M("overunderset", "{above:auto}{below:auto}{base:auto}", { createAtom: (t38) => {
  let e = T(t38.args[2]);
  return new Ae(g(h({}, t38), { above: T(t38.args[0]), below: T(t38.args[1]), body: e, skipBoundary: false, boxType: ci(e) }));
}, serialize: (t38, e) => U(t38.command, t38.belowToLatex(e), t38.bodyToLatex(e)) });
M(["stackrel", "stackbin"], "[below:auto]{above:auto}{base:auto}", { createAtom: (t38) => new Ae(g(h({}, t38), { body: T(t38.args[2]), above: T(t38.args[1]), below: T(t38.args[0]), skipBoundary: false, boxType: t38.command === "\\stackrel" ? "rel" : "bin" })), serialize: (t38, e) => U(t38.command, t38.aboveToLatex(e), t38.bodyToLatex(e)) });
M("smash", "[:string]{:auto}", { createAtom: (t38) => {
  var e, r, i, n;
  return new $t(g(h({}, t38), { body: T(t38.args[1]), smashHeight: (r = (e = t38.args[0]) == null ? void 0 : e.includes("t")) != null ? r : true, smashDepth: (n = (i = t38.args[0]) == null ? void 0 : i.includes("b")) != null ? n : true }));
} });
M("vphantom", "{:auto}", { createAtom: (t38) => new $t(g(h({}, t38), { body: T(t38.args[0]), isInvisible: true, smashWidth: true })) });
M("hphantom", "{:auto}", { createAtom: (t38) => new $t(g(h({}, t38), { body: T(t38.args[0]), isInvisible: true, smashHeight: true, smashDepth: true })) });
M("phantom", "{:auto}", { createAtom: (t38) => new $t(g(h({}, t38), { body: T(t38.args[0]), isInvisible: true })) });
M("mathstrut", "", { createAtom: (t38) => new $t(g(h({}, t38), { body: [new x({ value: "(" })], isInvisible: true })) });
M("not", "{:math}", { createAtom: (t38) => {
  let e = T(t38.args[0]);
  return e.length === 0 ? new x(g(h({}, t38), { type: "mrel", value: "" })) : new x(g(h({}, t38), { body: [new bt(g(h({}, t38), { body: "", align: "right" })), ...e], captureSelection: true }));
}, serialize: (t38, e) => {
  let r = t38.args[0], i = r && typeof r == "object" && "group" in r;
  return t38.value !== "" ? i ? `\\not{${x.serialize(r.group, e)}}` : `\\not${x.serialize(r, e)}` : i ? "\\not{}" : "\\not";
}, render: (t38, e) => {
  if (t38.value) return t38.createBox(e);
  let i = t38.args[0] && typeof t38.args[0] == "object" && "group" in t38.args[0] ? "ord" : ci(T(t38.args[0])), n = x.createBox(e, t38.body, { type: i });
  return t38.caret && (n.caret = t38.caret), t38.bind(e, n);
} });
M(["ne", "neq"], "", { createAtom: (t38) => new x(g(h({}, t38), { type: "mrel", body: [new bt(g(h({}, t38), { body: "", align: "right", boxType: "rel" })), new x(g(h({}, t38), { value: "=" }))], captureSelection: true })), serialize: (t38) => t38.command });
M("rlap", "{:auto}", { createAtom: (t38) => new bt(g(h({}, t38), { body: T(t38.args[0]), align: "right" })) });
M("llap", "{:auto}", { createAtom: (t38) => new bt(g(h({}, t38), { body: T(t38.args[0]), align: "left" })) });
M("mathrlap", "{:math}", { createAtom: (t38) => new bt(g(h({}, t38), { body: T(t38.args[0]), align: "right" })) });
M("mathllap", "{:math}", { createAtom: (t38) => new bt(g(h({}, t38), { body: T(t38.args[0]), align: "left" })) });
M("raisebox", "{:value}{:text}", { createAtom: (t38) => {
  var e;
  return new at(g(h({}, t38), { body: T(t38.args[1]), padding: { dimension: 0 }, offset: (e = t38.args[0]) != null ? e : { dimension: 0 } }));
}, serialize: (t38, e) => {
  var r;
  return U("\\raisebox", (r = ge(t38.offset)) != null ? r : "0pt", t38.bodyToLatex(e));
} });
M("raise", "{:value}{:auto}", { createAtom: (t38) => {
  var e;
  return new at(g(h({}, t38), { body: T(t38.args[1]), padding: { dimension: 0 }, offset: (e = t38.args[0]) != null ? e : { dimension: 0 } }));
}, serialize: (t38, e) => {
  var r;
  return U("\\raise", (r = ge(t38.offset)) != null ? r : "0pt", t38.bodyToLatex(e));
} });
M("lower", "{:value}{:auto}", { createAtom: (t38) => {
  var e;
  return new at(g(h({}, t38), { body: T(t38.args[1]), padding: { dimension: 0 }, offset: (e = ft(t38.args[0], -1)) != null ? e : { dimension: 0 } }));
}, serialize: (t38, e) => {
  var r, i;
  return U("\\lower", (i = ge(ft((r = t38.offset) != null ? r : { dimension: 0 }, -1))) != null ? i : "0pt", t38.bodyToLatex(e));
} });
Se("0123456789/@.?!");
hl(65, 90);
hl(97, 122);
Se([["\\forall", 8704], ["\\exists", 8707], ["\\nexists", 8708, "mord", "ams"], ["\\mid", 8739, "mrel"], ["\\top", 8868], ["\\bot", 8869]]);
Se([["\\#", 35], ["\\&", 38], ["\\parallelogram", 9649], ["\\spadesuit", 9824], ["\\heartsuit", 9825], ["\\diamondsuit", 9826], ["\\clubsuit", 9827], ["\\flat", 9837], ["\\natural", 9838], ["\\sharp", 9839]]);
Se([["\\backslash", 92], ["\\nabla", 8711], ["\\partial", 8706], ["\\ell", 8467], ["\\hbar", 8463], ["\\pounds", 163], ["\\euro", 8364]]);
Se([["\\rightarrow", 8594], ["\\to", 8594], ["\\leftarrow", 8592], ["\\gets", 8592], ["\\Rightarrow", 8658], ["\\Leftarrow", 8656], ["\\longrightarrow", 10230], ["\\longleftarrow", 10229], ["\\Longrightarrow", 10233], ["\\implies", 10233], ["\\Longleftarrow", 10232], ["\\impliedby", 10232], ["\\longleftrightarrow", 10231], ["\\biconditional", 10231], ["\\Longleftrightarrow", 10234], ["\\mapsto", 8614], ["\\longmapsto", 10236], ["\\uparrow", 8593], ["\\downarrow", 8595], ["\\Uparrow", 8657], ["\\Downarrow", 8659], ["\\updownarrow", 8597], ["\\Updownarrow", 8661], ["\\hookrightarrow", 8618], ["\\hookleftarrow", 8617], ["\\rightharpoonup", 8640], ["\\leftharpoonup", 8636], ["\\rightharpoondown", 8641], ["\\leftharpoondown", 8637], ["\\searrow", 8600], ["\\nearrow", 8599], ["\\swarrow", 8601], ["\\nwarrow", 8598], ["\\originalof", 8886], ["\\laplace", 8886], ["\\imageof", 8887], ["\\Laplace", 8887]], "mrel");
Se([["\\mapsfrom", 8612, "mrel"], ["\\Mapsfrom", 10502, "mrel"], ["\\MapsTo", 10503, "mrel"], ["\\Yup", 8516, "mord"], ["\\lightning", 8623, "mrel"], ["\\leftarrowtriangle", 8701, "mrel"], ["\\rightarrowtriangle", 8702, "mrel"], ["\\leftrightarrowtriangle", 8703, "mrel"], ["\\boxdot", 8865, "mbin"], ["\\bigtriangleup", 9651, "mbin"], ["\\bigtriangledown", 9661, "mbin"], ["\\boxbar", 9707, "mbin"], ["\\Lbag", 10181, "mopen"], ["\\Rbag", 10182, "mclose"], ["\\llbracket", 10214, "mopen"], ["\\rrbracket", 10215, "mclose"], ["\\longmapsfrom", 10235, "mrel"], ["\\Longmapsfrom", 10237, "mrel"], ["\\Longmapsto", 10238, "mrel"], ["\\boxslash", 10692, "mbin"], ["\\boxbslash", 10693, "mbin"], ["\\boxast", 10694, "mbin"], ["\\boxcircle", 10695, "mbin"], ["\\boxbox", 10696, "mbin"], ["\\fatsemi", 10783, "mop"], ["\\leftslice", 10918, "mrel"], ["\\rightslice", 10919, "mrel"], ["\\interleave", 10996, "mbin"], ["\\biginterleave", 11004, "mop"], ["\\sslash", 11005, "mbin"], ["\\talloblong", 11006, "mbin"]]);
Se([["\\lbrace", 123, "mopen"], ["\\rbrace", 125, "mclose"], ["\\lparen", 40, "mopen"], ["\\rparen", 41, "mclose"], ["\\langle", 10216, "mopen"], ["\\rangle", 10217, "mclose"], ["\\lfloor", 8970, "mopen"], ["\\rfloor", 8971, "mclose"], ["\\lceil", 8968, "mopen"], ["\\rceil", 8969, "mclose"], ["\\vert", 8739], ["\\lvert", 8739, "mopen"], ["\\rvert", 8739, "mclose"], ["\\|", 8741], ["\\Vert", 8741], ["\\mVert", 8741], ["\\lVert", 8741, "mopen"], ["\\rVert", 8741, "mclose"], ["\\lbrack", 91, "mopen"], ["\\rbrack", 93, "mclose"], ["\\{", 123, "mopen"], ["\\}", 125, "mclose"], ["(", 40, "mopen"], [")", 41, "mclose"], ["[", 91, "mopen"], ["]", 93, "mclose"], ["\\ulcorner", 9484, "mopen", "ams"], ["\\urcorner", 9488, "mclose", "ams"], ["\\llcorner", 9492, "mopen", "ams"], ["\\lrcorner", 9496, "mclose", "ams"], ["\\lgroup", 10222, "mopen"], ["\\rgroup", 10223, "mclose"], ["\\lmoustache", 9136, "mopen"], ["\\rmoustache", 9137, "mclose"]]);
Se([["\\dashrightarrow", 8674], ["\\dashleftarrow", 8672], ["\\Rrightarrow", 8667], ["\\Lleftarrow", 8666], ["\\leftrightarrows", 8646], ["\\rightleftarrows", 8644], ["\\curvearrowright", 8631], ["\\curvearrowleft", 8630], ["\\rightrightarrows", 8649], ["\\leftleftarrows", 8647], ["\\upuparrows", 8648], ["\\downdownarrows", 8650], ["\\vartriangle", 9651], ["\\triangleq", 8796], ["\\vartriangleleft", 8882], ["\\trianglelefteq", 8884], ["\\ntriangleleft", 8938], ["\\ntrianglelefteq", 8940], ["\\vartriangleright", 8883], ["\\trianglerighteq", 8885], ["\\ntriangleright", 8939], ["\\ntrianglerighteq", 8941], ["\\blacktriangleleft", 9664], ["\\blacktriangleright", 9654], ["\\leftarrowtail", 8610], ["\\rightarrowtail", 8611], ["\\looparrowright", 8620], ["\\looparrowleft", 8619], ["\\twoheadleftarrow", 8606], ["\\twoheadrightarrow", 8608], ["\\twoheadrightarrowtail", 10518], ["\\rightleftharpoons", 8652], ["\\leftrightharpoons", 8651], ["\\Rsh", 8625], ["\\Lsh", 8624], ["\\circlearrowright", 8635], ["\\circlearrowleft", 8634], ["\\restriction", 8638], ["\\upharpoonright", 8638], ["\\upharpoonleft", 8639], ["\\downharpoonright", 8642], ["\\downharpoonleft", 8643], ["\\rightsquigarrow", 8669], ["\\leadsto", 8669], ["\\leftrightsquigarrow", 8621], ["\\multimap", 8888], ["\\nleftarrow", 8602], ["\\nrightarrow", 8603], ["\\nRightarrow", 8655], ["\\nLeftarrow", 8653], ["\\nleftrightarrow", 8622], ["\\nLeftrightarrow", 8654], ["\\nvrightarrow", 8696], ["\\nvtwoheadrightarrow", 10496], ["\\nvrightarrowtail", 10516], ["\\nvtwoheadrightarrowtail", 10519], ["\\shortparallel", 8741], ["\\nless", 8814], ["\\nleqslant", 57360], ["\\lneq", 10887], ["\\lneqq", 8808], ["\\nleqq", 57361], ["\\lvertneqq", 57356], ["\\lnsim", 8934], ["\\lnapprox", 10889], ["\\nprec", 8832], ["\\npreceq", 8928], ["\\precnsim", 8936], ["\\precnapprox", 10937], ["\\nsim", 8769], ["\\nshortmid", 57350], ["\\nmid", 8740], ["\\nvdash", 8876], ["\\nvDash", 8877], ["\\ngtr", 8815], ["\\ngeqslant", 57359], ["\\ngeqq", 57358], ["\\gneq", 10888], ["\\gneqq", 8809], ["\\gvertneqq", 57357], ["\\gnsim", 8935], ["\\gnapprox", 10890], ["\\nsucc", 8833], ["\\nsucceq", 8929], ["\\succnsim", 8937], ["\\succnapprox", 10938], ["\\ncong", 8774], ["\\nshortparallel", 57351], ["\\nparallel", 8742], ["\\nVDash", 8879], ["\\nsupseteqq", 57368], ["\\supsetneq", 8843], ["\\varsupsetneq", 57371], ["\\supsetneqq", 10956], ["\\varsupsetneqq", 57369], ["\\nVdash", 8878], ["\\precneqq", 10933], ["\\succneqq", 10934], ["\\nsubseteqq", 57366], ["\\leqslant", 10877], ["\\geqslant", 10878], ["\\gtrsim", 8819], ["\\approxeq", 8778], ["\\thickapprox", 8776], ["\\lessapprox", 10885], ["\\gtrapprox", 10886], ["\\precapprox", 10935], ["\\succapprox", 10936], ["\\thicksim", 8764], ["\\succsim", 8831], ["\\precsim", 8830], ["\\backsim", 8765], ["\\eqsim", 8770], ["\\backsimeq", 8909], ["\\lesssim", 8818], ["\\nleq", 8816], ["\\ngeq", 8817], ["\\smallsmile", 8995], ["\\smallfrown", 8994], ["\\leqq", 8806], ["\\eqslantless", 10901], ["\\lll", 8920], ["\\lessgtr", 8822], ["\\lesseqgtr", 8922], ["\\lesseqqgtr", 10891], ["\\risingdotseq", 8787], ["\\fallingdotseq", 8786], ["\\subseteqq", 10949], ["\\Subset", 8912], ["\\sqsubset", 8847], ["\\preccurlyeq", 8828], ["\\curlyeqprec", 8926], ["\\vDash", 8872], ["\\Vvdash", 8874], ["\\bumpeq", 8783], ["\\Bumpeq", 8782], ["\\geqq", 8807], ["\\eqslantgtr", 10902], ["\\ggg", 8921], ["\\gtrless", 8823], ["\\gtreqless", 8923], ["\\gtreqqless", 10892], ["\\supseteqq", 10950], ["\\Supset", 8913], ["\\sqsupset", 8848], ["\\succcurlyeq", 8829], ["\\curlyeqsucc", 8927], ["\\Vdash", 8873], ["\\shortmid", 8739], ["\\between", 8812], ["\\pitchfork", 8916], ["\\varpropto", 8733], ["\\backepsilon", 8717], ["\\llless", 8920], ["\\gggtr", 8921], ["\\doteqdot", 8785], ["\\Doteq", 8785], ["\\eqcirc", 8790], ["\\circeq", 8791], ["\\therefore", 8756], ["\\because", 8757]], "mrel", "ams");
Se([["+", 43], ["-", 8722], ["−", 8722], ["\\pm", 177], ["\\mp", 8723], ["*", 8727], ["\\times", 215], ["\\div", 247], ["\\divides", 8739], ["\\cdot", 8901], ["\\cap", 8745], ["\\cup", 8746], ["\\setminus", 8726], ["\\land", 8743], ["\\wedge", 8743], ["\\lor", 8744], ["\\vee", 8744], ["\\circ", 8728], ["\\bigcirc", 9711], ["\\bullet", 8729], ["\\oplus", 8853], ["\\ominus", 8854], ["\\otimes", 8855], ["\\odot", 8857], ["\\oslash", 8856], ["\\bigtriangleup", 9651], ["\\bigtriangledown", 9661], ["\\triangleleft", 9667], ["\\triangleright", 9657], ["\\And", 38], ["\\dagger", 8224], ["\\dag", 8224], ["\\ddag", 8225], ["\\ddagger", 8225], ["\\ast", 8727], ["\\star", 8902], ["\\bigstar", 9733], ["\\diamond", 8900]], "mbin");
Se([["\\lhd", 8882], ["\\rhd", 8883], ["\\lessdot", 8918], ["\\gtrdot", 8919], ["\\ltimes", 8905], ["\\rtimes", 8906], ["\\leftthreetimes", 8907], ["\\rightthreetimes", 8908], ["\\intercal", 8890], ["\\dotplus", 8724], ["\\doublebarwedge", 10846], ["\\divideontimes", 8903], ["\\centerdot", 8901], ["\\smallsetminus", 8726], ["\\barwedge", 8892], ["\\veebar", 8891], ["\\nor", 8891], ["\\curlywedge", 8911], ["\\curlyvee", 8910], ["\\boxminus", 8863], ["\\boxplus", 8862], ["\\boxtimes", 8864], ["\\boxdot", 8865], ["\\circleddash", 8861], ["\\circledast", 8859], ["\\circledcirc", 8858], ["\\unlhd", 8884], ["\\unrhd", 8885]], "mbin", "ams");
Se([["\\surd", 8730], ["\\S", 167], ["\\infty", 8734], ["\\prime", 8242], ["\\doubleprime", 8243], ["\\angle", 8736], ["`", 8216], ["\\$", 36], ["\\%", 37], ["\\_", 95], ["\\alpha", 945], ["\\beta", 946], ["\\gamma", 947], ["\\delta", 948], ["\\epsilon", 1013], ["\\varepsilon", 949], ["\\zeta", 950], ["\\eta", 951], ["\\theta", 952], ["\\vartheta", 977], ["\\iota", 953], ["\\kappa", 954], ["\\varkappa", 1008, "mord", "ams"], ["\\lambda", 955], ["\\mu", 956], ["\\nu", 957], ["\\xi", 958], ["\\omicron", 111], ["\\pi", 960], ["\\varpi", 982], ["\\rho", 961], ["\\varrho", 1009], ["\\sigma", 963], ["\\varsigma", 962], ["\\tau", 964], ["\\phi", 981], ["\\varphi", 966], ["\\upsilon", 965], ["\\chi", 967], ["\\psi", 968], ["\\omega", 969], ["\\Gamma", 915], ["\\Delta", 916], ["\\Theta", 920], ["\\Lambda", 923], ["\\Xi", 926], ["\\Pi", 928], ["\\Sigma", 931], ["\\Upsilon", 933], ["\\Phi", 934], ["\\Psi", 936], ["\\Omega", 937], ["\\digamma", 989, "mord", "ams"], ["\\varkappa", 1008, "mord", "ams"], ["\\coppa", 985, "mord", "ams"], ["\\koppa", 985, "mord", "ams"], ["\\Coppa", 984, "mord", "ams"], ["\\Koppa", 984, "mord", "ams"], ["\\sampi", 993, "mord", "ams"], ["\\Sampi", 992, "mord", "ams"], ["\\emptyset", 8709]]);
Se([["=", 61], ["<", 60], ["\\lt", 60], [">", 62], ["\\gt", 62], ["\\le", 8804], ["\\leq", 8804], ["\\ge", 8805], ["\\geq", 8805], ["\\ll", 8810], ["\\gg", 8811], ["\\coloneq", 8788], ["\\coloneqq", 8788], ["\\colonequals", 8788], ["\\measeq", 8797], ["\\eqdef", 8798], ["\\questeq", 8799], [":", 58], ["\\cong", 8773], ["\\equiv", 8801], ["\\prec", 8826], ["\\preceq", 10927], ["\\succ", 8827], ["\\succeq", 10928], ["\\perp", 10178], ["\\propto", 8733], ["\\Colon", 8759], ["\\smile", 8995], ["\\frown", 8994], ["\\sim", 8764], ["\\doteq", 8784], ["\\bowtie", 8904], ["\\Join", 8904], ["\\asymp", 8781], ["\\sqsubseteq", 8849], ["\\sqsupseteq", 8850], ["\\approx", 8776], ["\\~", 126], ["\\leftrightarrow", 8596], ["\\Leftrightarrow", 8660], ["\\models", 8872], ["\\vdash", 8866], ["\\dashv", 8867], ["\\roundimplies", 10608], ["\\in", 8712], ["\\notin", 8713], ["\\ni", 8715], ["\\owns", 8715], ["\\subset", 8834], ["\\supset", 8835], ["\\subseteq", 8838], ["\\supseteq", 8839], ["\\differencedelta", 8710], ["\\mvert", 8739], ["\\parallel", 8741], ["\\simeq", 8771]], "mrel");
Se([["\\lnot", 172], ["\\neg", 172], ["\\triangle", 9651], ["\\subsetneq", 8842], ["\\varsubsetneq", 57370], ["\\subsetneqq", 10955], ["\\varsubsetneqq", 57367], ["\\nsubset", 8836], ["\\nsupset", 8837], ["\\nsubseteq", 8840], ["\\nsupseteq", 8841]], "mrel", "ams");
Se([["\\wp", 8472], ["\\aleph", 8501]]);
Se([["\\blacktriangle", 9650], ["\\hslash", 8463], ["\\Finv", 8498], ["\\Game", 8513], ["\\eth", 240], ["\\mho", 8487], ["\\Bbbk", 107], ["\\yen", 165], ["\\square", 9633], ["\\Box", 9633], ["\\blacksquare", 9632], ["\\circledS", 9416], ["\\circledR", 174], ["\\triangledown", 9661], ["\\blacktriangledown", 9660], ["\\checkmark", 10003], ["\\diagup", 9585], ["\\measuredangle", 8737], ["\\sphericalangle", 8738], ["\\backprime", 8245], ["\\backdoubleprime", 8246], ["\\Diamond", 9674], ["\\lozenge", 9674], ["\\blacklozenge", 10731], ["\\varnothing", 8709], ["\\complement", 8705], ["\\maltese", 10016], ["\\beth", 8502], ["\\daleth", 8504], ["\\gimel", 8503]], "mord", "ams");
Se([["\\ ", 160], ["~", 160]], "space");
M(["!", ",", ":", ";", ">", "enskip", "enspace", "quad", "qquad"], "", { createAtom: (t38) => new Vt(t38) });
M("space", "", { createAtom: (t38) => new Vt(t38) });
Se([["\\colon", 58], ["\\cdotp", 8901], ["\\vdots", 8942, "mord"], ["\\ldotp", 46], [",", 44], [";", 59]], "mpunct");
Se([["\\cdots", 8943], ["\\ddots", 8945], ["\\ldots", 8230], ["\\mathellipsis", 8230]], "minner");
Se([["\\/", 47], ["|", 8739, "mord"], ["\\imath", 305], ["\\jmath", 567], ["\\degree", 176], ["'", 8242], ['"', 8221]]);
var ns = { main: ["Main-Regular", "ML__cmr"], "main-italic": ["Main-Italic", "ML__cmr ML__it"], "main-bold": ["Main-Bold", "ML__cmr ML__bold"], "main-bolditalic": ["Main-BoldItalic", "ML__cmr ML__bold ML__it"], normal: ["Main-Regular", "ML__cmr"], "normal-bold": ["Main-Bold", "ML__mathbf"], "normal-italic": ["Math-Italic", "ML__mathit"], "normal-bolditalic": ["Math-BoldItalic", "ML__mathbfit"], roman: ["Main-Regular", "ML__cmr"], "roman-bold": ["Main-Bold", "ML__mathbf"], "roman-italic": ["Math-Italic", "ML__mathit"], "roman-bolditalic": ["Math-BoldItalic", "ML__mathbfit"], ams: ["AMS-Regular", "ML__ams"], "ams-bold": ["AMS-Regular", "ML__ams ML__bold"], "ams-italic": ["AMS-Regular", "ML__ams ML__it"], "ams-bolditalic": ["AMS-Regular", "ML__ams ML__bold ML__it"], "sans-serif": ["SansSerif-Regular", "ML__sans"], "sans-serif-bold": ["SansSerif-Regular", "ML__sans ML__bold"], "sans-serif-italic": ["SansSerif-Regular", "ML__sans ML__it"], "sans-serif-bolditalic": ["SansSerif-Regular", "ML__sans ML__bold ML__it"], calligraphic: ["Caligraphic-Regular", "ML__cal"], "calligraphic-bold": ["Caligraphic-Regular", "ML__cal ML__bold"], "calligraphic-italic": ["Caligraphic-Regular", "ML__cal ML__it"], "calligraphic-bolditalic": ["Caligraphic-Regular", "ML__cal ML__bold ML__it"], script: ["Script-Regular", "ML__script"], "script-bold": ["Script-Regular", "ML__script ML__bold"], "script-italic": ["Script-Regular", "ML__script ML__it"], "script-bolditalic": ["Script-Regular", "ML__script ML__bold ML__it"], fraktur: ["Fraktur-Regular", "ML__frak"], "fraktur-bold": ["Fraktur-Regular", "ML__frak ML__bold"], "fraktur-italic": ["Fraktur-Regular", "ML__frak ML__it"], "fraktur-bolditalic": ["Fraktur-Regular", "ML__frak ML__bold ML__it"], monospace: ["Typewriter-Regular", "ML__tt"], "monospace-bold": ["Typewriter-Regular", "ML__tt ML__bold"], "monospace-italic": ["Typewriter-Regular", "ML__tt ML__it"], "monospace-bolditalic": ["Typewriter-Regular", "ML__tt ML__bold ML__it"], "double-struck": ["AMS-Regular", "ML__bb"], "double-struck-bold": ["AMS-Regular", "ML__bb ML__bold"], "double-struck-italic": ["AMS-Regular", "ML__bb ML_italic"], "double-struck-bolditalic": ["AMS-Regular", "ML__bb ML_bolditalic"] }, as = { "double-struck": /^[A-Z ]$/, script: /^[A-Z ]$/, calligraphic: /^[\dA-Z ]$/, fraktur: /^[\dA-Za-z ]$|^[!"#$%&'()*+,\-./:;=?[]^’‘]$/, monospace: /^[\dA-Za-z ]$|^[!"&'()*+,\-./:;=?@[\]^_~\u0131\u0237\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A8\u03A9]$/, "sans-serif": /^[\dA-Za-z ]$|^[!"&'()*+,\-./:;=?@[\]^_~\u0131\u0237\u0393\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A8\u03A9]$/ }, Sh = /^[\u03B1-\u03C9]|\u03D1|\u03D5|\u03D6|\u03F1|\u03F5]$/, Lg = /^[\u0393|\u0394\u0398\u039B\u039E\u03A0\u03A3\u03A5\u03A6\u03A8\u03A9]$/, Ag = [/^[a-z]$/, /^[A-Z]$/, Sh, Lg], Cg = { iso: ["it", "it", "it", "it"], tex: ["it", "it", "it", "up"], french: ["it", "up", "up", "up"], upright: ["up", "up", "up", "up"] }, pc = class extends _e {
  constructor() {
    super("math");
  }
  createAtom(e, r, i) {
    var a, s, l, c, u, d;
    if (r === null) return new x({ type: "mord", mode: "math", command: e, value: e, style: i });
    let n;
    try {
      n = (l = (s = globalThis.MathfieldElement) == null ? void 0 : s.isFunction((a = r.command) != null ? a : e)) != null ? l : false;
    } catch (m) {
      n = false;
    }
    if (r.definitionType === "symbol") {
      let m = new x({ type: (c = r.type) != null ? c : "mord", mode: "math", command: (u = r.command) != null ? u : e, value: String.fromCodePoint(r.codepoint), isFunction: n, style: i });
      return e.startsWith("\\") && (m.verbatimLatex = e), m;
    }
    let o = new x({ type: "mord", mode: "math", command: (d = r.command) != null ? d : e, value: e, isFunction: n, style: i });
    return e.startsWith("\\") && (o.verbatimLatex = e), o;
  }
  serialize(e, r) {
    let i = Eg(e, g(h({}, r), { defaultMode: "math" }));
    return i.length === 0 || r.defaultMode !== "text" ? i : ["$ ", ...i, " $"];
  }
  getFont(e, r) {
    var l, c, u;
    if (r.variant, r.fontFamily) {
      let d = r.fontFamily;
      r.fontSeries === "b" && r.fontShape === "it" ? d += "-bolditalic" : r.fontSeries === "b" ? d += "-bold" : r.fontShape === "it" && (d += "-italic");
      let m = (l = ns[d]) != null ? l : ns[r.fontFamily];
      if (!m) return console.error(`Unknown font family variant: ${d}`), null;
      let [p, f] = m;
      return f && (e.classes += " " + f), p;
    }
    let { variant: i } = r, { variantStyle: n } = r;
    if (i === "normal" && !n && /[\u00A3\u0131\u0237]/.test(e.value) && (i = "main", n = "italic"), i === "normal" && !n && e.value.length === 1) {
      let d = false;
      Ag.forEach((m, p) => {
        var f;
        m.test(e.value) && Cg[(f = r.letterShapeStyle) != null ? f : "tex"][p] === "it" && (d = true);
      }), d && (n = yh(n));
    }
    n === "up" && (n = void 0);
    let o = n ? i + "-" + n : i;
    let [a, s] = ns[o];
    if (as[i] && !as[i].test(e.value)) {
      let d = Bn(e.value, i, n);
      return d || (d = (c = Bn(e.value, i)) != null ? c : e.value, e.classes += (u = { bold: " ML__bold", italic: " ML__it", "bold-italic": " ML__bold ML__it" }[n != null ? n : ""]) != null ? u : ""), e.value = d, null;
    }
    return Sh.test(e.value) && (e.classes += " lcGreek"), s && (e.classes += " " + s), a;
  }
};
function Eg(t38, e) {
  return ht(t38, "bold").map((r) => {
    if (za(r[0]) !== "bold") return R(os(r, e));
    if (za(r[0].parent) === "bold") return R(os(r, e));
    let n = R(r.map((o) => {
      var a;
      return (a = o.value) != null ? a : "";
    }));
    return /^[a-zA-Z0-9]+$/.test(n) ? U("\\mathbf", R(os(r, e))) : U("\\bm", R(os(r, e)));
  });
}
function os(t38, e) {
  let { parent: r } = t38[0], i = Na(r);
  return ht(t38, "variant").map((n) => {
    let o = Na(n[0]), a = "";
    o && o !== i && (a = { calligraphic: "\\mathcal", "calligraphic-uo": "\\mathcal", fraktur: "\\mathfrak", "fraktur-uo": "\\mathfrak", "double-struck": "\\mathbb", "double-struck-uo": "\\mathbb", script: "\\mathscr", "script-uo": "\\mathscr", monospace: "\\mathtt", "monospace-uo": "\\mathtt", "sans-serif": "\\mathsf", "sans-serif-uo": "\\mathsf", normal: "", "normal-up": "\\mathrm", "normal-italic": "\\mathnormal", "normal-bold": "", "normal-bolditalic": "\\mathbfit", ams: "", "ams-up": "\\mathrm", "ams-italic": "\\mathit", "ams-bold": "", "ams-bolditalic": "\\mathbfit", main: "", "main-up": "\\mathrm", "main-italic": "\\mathit", "main-bold": "", "main-bolditalic": "\\mathbfit" }[o]);
    let s = "", l = n[n.length - 1], c = a && n.length > 0 && (l.branch("subscript") !== void 0 || l.branch("superscript") !== void 0);
    c && (s = l.supsubToLatex(e));
    let u = R(n.map((d, m) => {
      if (c && m === n.length - 1) {
        let p = ne(d.command, d.mode);
        return p != null && p.serialize ? p.serialize(d, e) : d.body && d.command ? U(d.command, d.bodyToLatex(e)) : d.body ? d.bodyToLatex(e) : !d.value || d.value === "​" ? "" : d.command || d.value;
      }
      return d._serialize(e);
    }));
    return a ? U(a, u) + s : u;
  });
}
new pc();
function Tg(t38, e) {
  return t38.map((r) => r._serialize(e));
}
function Dg(t38, e) {
  return ht(t38, "fontShape").map((r) => {
    let i = Tg(r, e), { fontShape: n } = r[0].style, o = "";
    return n === "it" && (o = "\\textit"), n === "sl" && (o = "\\textsl"), n === "sc" && (o = "\\textsc"), n === "n" && (o = "\\textup"), !o && n ? `{${U("\\fontshape", n)}${R(i)}}` : o ? U(o, R(i)) : R(i);
  });
}
function Og(t38, e) {
  return ht(t38, "fontSeries").map((r) => {
    let i = Dg(r, e), { fontSeries: n } = r[0].style, o = "";
    return n === "b" && (o = "\\textbf"), n === "l" && (o = "\\textlf"), n === "m" && (o = "\\textmd"), n && !o ? `{${U("\\fontseries", n)}${R(i)}}` : o ? U(o, R(i)) : R(i);
  });
}
function Bg(t38, e) {
  return ht(t38, "fontSize").map((r) => {
    var o, a;
    let i = Og(r, e), n = (a = ["", "\\tiny", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge"][(o = r[0].style.fontSize) != null ? o : ""]) != null ? a : "";
    return n ? `${n} ${R(i)}` : R(i);
  });
}
function Kg(t38, e, r) {
  return ht(t38, "fontFamily").map((i) => {
    var s;
    r = r && !i.every((l) => l.style.fontFamily || l.style.fontShape || l.style.fontSeries || l.style.fontSize);
    let n = Bg(i, e), { fontFamily: o } = i[0].style, a = (s = { roman: "textrm", monospace: "texttt", "sans-serif": "textsf" }[o != null ? o : ""]) != null ? s : "";
    return a ? `\\${a}{${R(n)}}` : o ? `{\\fontfamily{${i[0].style.fontFamily}} ${R(n)}}` : r ? `\\text{${R(n)}}` : R(n);
  });
}
var kh = { roman: "", "sans-serif": "ML__sans", monospace: "ML__tt" }, fc = class extends _e {
  constructor() {
    super("text");
  }
  createAtom(e, r, i) {
    return r && r.definitionType === "symbol" ? new We(e, String.fromCodePoint(r.codepoint), i != null ? i : {}) : null;
  }
  serialize(e, r) {
    return Kg(e, g(h({}, r), { defaultMode: "text" }), r.defaultMode !== "text");
  }
  getFont(e, r) {
    var n, o, a, s, l;
    let { fontFamily: i } = r;
    if (kh[i]) e.classes += " " + kh[i];
    else if (i) {
      let c = V0(i);
      c && e.setStyle("font-family", c);
    }
    if (r.fontShape && (e.classes += " ", e.classes += (n = { it: "ML__it", sl: "ML__shape_sl", sc: "ML__shape_sc", ol: "ML__shape_ol" }[r.fontShape]) != null ? n : ""), r.fontSeries) {
      let c = r.fontSeries.match(/(.?[lbm])?(.?[cx])?/);
      c && (e.classes += " ", e.classes += (a = { ul: "ML__series_ul", el: "ML__series_el", l: "ML__series_l", sl: "ML__series_sl", m: "", sb: "ML__series_sb", b: "ML__bold", eb: "ML__series_eb", ub: "ML__series_ub" }[(o = c[1]) != null ? o : ""]) != null ? a : "", e.classes += " ", e.classes += (l = { uc: "ML__series_uc", ec: "ML__series_ec", c: "ML__series_c", sc: "ML__series_sc", n: "", sx: "ML__series_sx", x: "ML__series_x", ex: "ML__series_ex", ux: "ML__series_ux" }[(s = c[2]) != null ? s : ""]) != null ? l : "");
    }
    return "Main-Regular";
  }
};
new fc();
var gc = class extends _e {
  constructor() {
    super("latex");
  }
  createAtom(e) {
    return new he(e);
  }
  serialize(e, r) {
    return e.filter((i) => i instanceof he && !i.isSuggestion).map((i) => i.value);
  }
  getFont() {
    return null;
  }
};
new gc();
function gn(t38) {
  var n;
  let e = /macos|ios/.test(Ct()), r = t38.split("+"), i = "";
  for (let o of r) i && (i += e ? " " : '<span class="ML__shortcut-join">+</span>'), o.startsWith("[Key") ? i += o.slice(4, 5) : o.startsWith("Key") ? i += o.slice(3, 4) : o.startsWith("[Digit") ? i += o.slice(6, 7) : o.startsWith("Digit") ? i += o.slice(5, 6) : i += (n = { cmd: "⌘", meta: e ? "⌘" : "Ctrl", shift: e ? "⇧" : "Shift", alt: e ? "⌥" : "Alt", ctrl: e ? "⌃" : "Ctrl", "\n": e ? "⏎" : "Return", "[return]": e ? "⏎" : "Return", "[enter]": e ? "⌤" : "Enter", "[tab]": e ? "⇥" : "Tab", "[escape]": "Esc", "[backspace]": e ? "⌫" : "Backspace", "[delete]": e ? "⌦" : "Del", "[pageup]": e ? "⇞" : "Page Up", "[pagedown]": e ? "⇟" : "Page Down", "[home]": e ? "⤒" : "Home", "[end]": e ? "⤓" : "End", "[space]": "Space", "[equal]": "=", "[minus]": "-", "[comma]": ",", "[slash]": "/", "[backslash]": "\\", "[bracketleft]": "[", "[bracketright]": "]", semicolon: ";", period: ".", comma: ",", minus: "-", equal: "=", quote: "'", backslash: "\\", intlbackslash: "\\", backquote: "`", slash: "/", numpadmultiply: "* &#128290;", numpaddivide: "/ &#128290;", numpadsubtract: "- &#128290;", numpadadd: "+ &#128290;", numpaddecimal: ". &#128290;", numpadcomma: ", &#128290;", help: "help", left: "⇠", up: "⇡", right: "⇢", down: "⇣", "[arrowleft]": "⇠", "[arrowup]": "⇡", "[arrowright]": "⇢", "[arrowdown]": "⇣" }[o.toLowerCase()]) != null ? n : o.toUpperCase();
  return i;
}
function bn(t38) {
  if (t38 instanceof MouseEvent || t38 instanceof PointerEvent) return { x: t38.clientX, y: t38.clientY };
  if (typeof TouchEvent != "undefined" && t38 instanceof TouchEvent) {
    let e = [...t38.touches].reduce((i, n) => ({ x: i.x + n.clientX, y: i.y + n.clientY }), { x: 0, y: 0 }), r = t38.touches.length;
    return { x: e.x / r, y: e.y / r };
  }
}
function Ht(t38) {
  let e = { alt: false, control: false, shift: false, meta: false };
  return (t38 instanceof MouseEvent || t38 instanceof PointerEvent || typeof TouchEvent != "undefined" && t38 instanceof TouchEvent || t38 instanceof KeyboardEvent) && (t38.altKey && (e.alt = true), t38.ctrlKey && (e.control = true), t38.metaKey && (e.meta = true), t38.shiftKey && (e.shift = true)), e;
}
function Lh(t38, e) {
  return !t38 && e || t38 && !e ? false : !t38 || !e ? true : t38.alt === e.alt && t38.control === e.control && t38.shift === e.shift && t38.meta === e.meta;
}
var Pg = /* @__PURE__ */ new Set(["Backquote", "Digit0", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Minus", "Equal", "IntlYen", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Backslash", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "IntlBackslash", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "IntlRo", "Space", "Numpad0", "Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5", "Numpad6", "Numpad7", "Numpad8", "Numpad9", "NumpadAdd", "NumpadComma", "NumpadDecimal", "NumpadDivide", "NumpadEqual", "NumpadHash", "NumpadMultiply", "NumpadParenLeft", "NumpadParenRight", "NumpadStar", "NumpadSubstract"]);
function dr(t38) {
  return t38.ctrlKey || t38.metaKey || ["Dead", "Process"].includes(t38.key) ? false : t38.code === "" ? true : Pg.has(t38.code);
}
function Wt() {
  var e;
  let t38 = document.activeElement;
  for (; (e = t38 == null ? void 0 : t38.shadowRoot) != null && e.activeElement; ) t38 = t38.shadowRoot.activeElement;
  return t38;
}
var Te = class t32 {
  static get scrim() {
    return t32._scrim || (t32._scrim = new t32()), t32._scrim;
  }
  static open(e) {
    t32.scrim.open(e);
  }
  static close() {
    t32.scrim.close();
  }
  static get state() {
    return t32.scrim.state;
  }
  static get element() {
    return t32.scrim.element;
  }
  constructor(e) {
    var r, i;
    this.lightDismiss = (r = e == null ? void 0 : e.lightDismiss) != null ? r : true, this.translucent = (i = e == null ? void 0 : e.translucent) != null ? i : false, this.state = "closed";
  }
  get element() {
    if (this._element) return this._element;
    let e = document.createElement("div");
    return e.setAttribute("role", "presentation"), e.style.position = "fixed", e.style.contain = "content", e.style.top = "0", e.style.left = "0", e.style.right = "0", e.style.bottom = "0", e.style.zIndex = "var(--scrim-zindex, 10099)", e.style.outline = "none", this.translucent ? (e.style.background = "rgba(255, 255, 255, .2)", e.style.backdropFilter = "contrast(40%)") : e.style.background = "transparent", this._element = e, e;
  }
  open(e) {
    var a;
    if (this.state !== "closed") return;
    this.state = "opening", this.onDismiss = e == null ? void 0 : e.onDismiss, this.savedActiveElement = Wt();
    let { element: r } = this;
    ((a = e == null ? void 0 : e.root) != null ? a : document.body).appendChild(r), r.addEventListener("click", this), document.addEventListener("touchmove", this, false), document.addEventListener("scroll", this, false);
    let i = window.innerWidth - document.documentElement.clientWidth;
    this.savedMarginRight = document.body.style.marginRight, this.savedOverflow = document.body.style.overflow, document.body.style.overflow = "hidden";
    let n = Number.parseFloat(getComputedStyle(document.body).marginRight);
    document.body.style.marginRight = `${n + i}px`;
    let o = document.querySelector(".MLK__plate");
    if (o instanceof HTMLElement) {
      this.savedMlkPaddingRight = o.style.paddingRight;
      let s = Number.parseFloat(getComputedStyle(o).paddingRight);
      o.style.paddingRight = `${s + i}px`;
    }
    e != null && e.child && r.append(e.child), this.state = "open";
  }
  close() {
    var i, n, o, a, s;
    if (this.state !== "open") {
      this.element.parentElement;
      return;
    }
    this.state = "closing", typeof this.onDismiss == "function" && this.onDismiss(), this.onDismiss = void 0;
    let { element: e } = this;
    e.removeEventListener("click", this), document.removeEventListener("touchmove", this, false), document.removeEventListener("scroll", this, false), e.remove(), document.body.style.overflow = (i = this.savedOverflow) != null ? i : "", document.body.style.marginRight = (n = this.savedMarginRight) != null ? n : "";
    let r = document.querySelector(".MLK__plate");
    r instanceof HTMLElement && (r.style.paddingRight = (o = this.savedMlkPaddingRight) != null ? o : ""), Wt() !== this.savedActiveElement && ((s = (a = this.savedActiveElement) == null ? void 0 : a.focus) == null || s.call(a)), e.innerHTML = "", this.state = "closed";
  }
  handleEvent(e) {
    this.lightDismiss && (e.target === this._element && e.type === "click" ? (this.close(), e.preventDefault(), e.stopPropagation()) : e.target === document && (e.type === "touchmove" || e.type === "scroll") && (this.close(), e.preventDefault(), e.stopPropagation()));
  }
};
function Ah(t38, e, r) {
  let i = null, n = null, o = false, a = false, s = false, l = new AbortController(), c = l.signal;
  return t38.addEventListener("keydown", (u) => {
    if (o || u.key === "Process" || u.code === "CapsLock" || /(Control|Meta|Alt|Shift)(Left|Right)/.test(u.code)) {
      i = null;
      return;
    }
    i = u, n = null, r.onKeystroke(u) ? t38.textContent = "" : i = null;
  }, { capture: true, signal: c }), t38.addEventListener("keypress", (u) => {
    o || (i && n && r.onKeystroke(i), n = u);
  }, { capture: true, signal: c }), t38.addEventListener("compositionstart", (u) => {
    t38.textContent = "", o = true, r.onCompositionStart(u.data);
  }, { capture: true, signal: c }), t38.addEventListener("compositionupdate", (u) => {
    o && r.onCompositionUpdate(u.data);
  }, { capture: true, signal: c }), t38.addEventListener("compositionend", (u) => {
    t38.textContent = "", o && (o = false, r.onCompositionEnd(u.data));
  }, { capture: true, signal: c }), t38.addEventListener("beforeinput", (u) => u.stopImmediatePropagation(), { signal: c }), t38.addEventListener("input", (u) => {
    var d;
    if (!o && (t38.textContent = "", u.inputType !== "insertCompositionText")) {
      if (u.inputType === "insertFromPaste") {
        u.preventDefault(), u.stopPropagation();
        return;
      }
      r.onInput((d = u.data) != null ? d : ""), u.preventDefault(), u.stopPropagation();
    }
  }, { signal: c }), t38.addEventListener("paste", (u) => {
    t38.focus({ preventScroll: true }), t38.textContent = "", r.onPaste(u) || u.preventDefault(), u.stopImmediatePropagation();
  }, { signal: c }), t38.addEventListener("cut", (u) => r.onCut(u), { capture: true, signal: c }), t38.addEventListener("copy", (u) => r.onCopy(u), { capture: true, signal: c }), t38.addEventListener("blur", (u) => {
    var f, y;
    if (((y = (f = u.relatedTarget) == null ? void 0 : f._mathfield) == null ? void 0 : y.element) === e) {
      t38.focus({ preventScroll: true }), u.preventDefault(), u.stopPropagation();
      return;
    }
    let d = false, m = u.relatedTarget;
    for (; m; ) {
      if (m.classList.contains("ML__keyboard")) {
        d = true;
        break;
      }
      m = m.parentElement;
    }
    if (d) {
      t38.focus({ preventScroll: true }), u.preventDefault(), u.stopPropagation();
      return;
    }
    let p = Te.state;
    if (p === "open" || p === "opening") {
      u.preventDefault(), u.stopPropagation();
      return;
    }
    if (u.relatedTarget === u.target.getRootNode().host) {
      u.preventDefault(), u.stopPropagation();
      return;
    }
    s || a || (s = true, i = null, n = null, r.onBlur(), s = false);
  }, { capture: true, signal: c }), t38.addEventListener("focus", (u) => {
    s || a || (a = true, r.onFocus(), a = false);
  }, { capture: true, signal: c }), { dispose: () => l.abort(), cancelComposition: () => {
    o && (typeof t38.blur == "function" && t38.blur(), requestAnimationFrame(() => t38.focus({ preventScroll: true })));
  }, blur: () => {
    typeof t38.blur == "function" && (s = true, t38.blur(), s = false);
  }, focus: () => {
    !a && typeof t38.focus == "function" && (a = true, t38.focus({ preventScroll: true }), a = false);
  }, hasFocus: () => Wt() === t38, setAriaLabel: (u) => t38.setAttribute("aria-label", u), setAriaReadOnly: (u) => {
    u ? t38.setAttribute("aria-readonly", "true") : t38.removeAttribute("aria-readonly");
  }, setValue: (u) => {
    var d;
    t38.textContent !== u && (t38.textContent = u, t38.style.left = "-1000px", (d = window.getSelection()) == null || d.selectAllChildren(t38));
  }, moveTo: (u, d) => {
    t38.style.top = `${d}px`, t38.style.left = `${u}px`;
  } };
}
function Fr(t38) {
  var r;
  if (!t38 || !dr(t38)) return "";
  let e;
  return t38.key === "Unidentified" && t38.target && (e = t38.target.value), e = (r = e != null ? e : t38.key) != null ? r : t38.code, /^(Dead|Return|Enter|Tab|Escape|Delete|PageUp|PageDown|Home|End|Help|ArrowLeft|ArrowRight|ArrowUp|ArrowDown)$/.test(e) && (e = ""), e;
}
function ss(t38) {
  t38 = ku(t38);
  let e = [];
  return t38.ctrlKey && e.push("ctrl"), t38.metaKey && e.push("meta"), t38.altKey && e.push("alt"), t38.shiftKey && e.push("shift"), e.length === 0 ? `[${t38.code}]` : (e.push(`[${t38.code}]`), e.join("+"));
}
function Rg(t38) {
  if (Le()) {
    let e = Ct(), r = t38.startsWith("!"), i = t38.endsWith(e);
    if (r && !i || !r && i) return true;
  }
  return t38 === "!other" ? false : t38 === "other";
}
function Eh(t38, e, r) {
  if (t38.length === 0) return "";
  let i = Zr(ol(ss(r))), n = Zr({ key: r.key, shift: r.shiftKey, alt: r.altKey, ctrl: r.ctrlKey, meta: r.metaKey || r.ctrlKey && /macos|ios/.test(Ct()), cmd: false, win: false });
  for (let o = t38.length - 1; o >= 0; o--) if ((t38[o].key === i || t38[o].key === n) && (!t38[o].ifMode || t38[o].ifMode === e)) return t38[o].command;
  return "";
}
function Ch(t38) {
  let e = t38;
  return ee(e) && (e = e.length > 0 ? e[0] + "(" + e.slice(1).join("") + ")" : ""), e;
}
function Th(t38, e) {
  let r = [];
  if (typeof e == "string") {
    let o = J0[e];
    ee(o) ? r = o.slice() : o && r.push(o);
  }
  let i = Ch(e), n = new RegExp("^" + i.replace("\\", "\\\\").replace("|", "\\|").replace("*", "\\*").replace("$", "\\$").replace("^", "\\^") + "([^*a-zA-Z]|$)");
  for (let o of t38) n.test(Ch(o.command)) && r.push(o.key);
  return r.map(gn);
}
function Ig(t38, e) {
  if (t38.ifPlatform && !/^!?(macos|windows|android|ios|chromeos|other)$/.test(t38.ifPlatform)) throw new Error(`Unexpected platform "${t38.ifPlatform}" for keybinding ${t38.key}`);
  if (t38.ifLayout !== void 0 && (e.score === 0 || !t38.ifLayout.includes(e.id))) return;
  let r = ol(t38.key), i = t38.ifPlatform;
  if (r.cmd) {
    if (i && i !== "macos" && i !== "ios") throw new Error('Unexpected "cmd" modifier with platform "' + i + `"
"cmd" modifier can only be used with macOS or iOS platform.`);
    i || (i = Ct() === "ios" ? "ios" : "macos"), r.win = false, r.cmd = false, r.meta = true;
  }
  if (r.win) {
    if (i && i !== "windows") throw new Error('Unexpected "win" modifier with platform "' + i + `"
"win" modifier can only be used with Windows platform.`);
    i = "windows", r.win = false, r.cmd = false, r.meta = true;
  }
  if (i && !Rg(i)) return;
  if (/^\[.+\]$/.test(r.key)) return g(h({}, t38), { key: Zr(r) });
  let n = Su(r.key, e);
  if (!n) return g(h({}, t38), { key: Zr(r) });
  if (n.shift && r.shift || n.alt && r.alt) throw new Error(`The keybinding ${t38.key} (${bc(t38.command)}) is conflicting with the key combination ${Zr(n)} using the ${e.displayName} keyboard layout`);
  return n.shift = n.shift || r.shift, n.alt = n.alt || r.alt, n.meta = r.meta, n.ctrl = r.ctrl, g(h({}, t38), { key: Zr(n) });
}
function bc(t38) {
  if (Array.isArray(t38)) {
    let e = [...t38];
    return e.shift() + "(" + e.map((r) => typeof r == "string" ? `"${r}"` : r.toString()).join(", ") + ")";
  }
  return t38;
}
function Dh(t38, e) {
  let r = [], i = [];
  for (let n of t38) try {
    let o = Ig(n, e);
    if (!o) continue;
    let a = i.find((s) => s.key === o.key && s.ifMode === o.ifMode);
    if (a) throw new Error(`Ambiguous key binding ${n.key} (${bc(n.command)}) matches ${a.key} (${bc(a.command)}) with the ${e.displayName} keyboard layout`);
    i.push(o);
  } catch (o) {
    o instanceof Error && r.push(o.message);
  }
  return [i, r];
}
var yc = class extends H {
  constructor() {
    super("latex");
  }
  createAtom(e) {
    return new he(e);
  }
  onPaste(e, r) {
    if (!r) return false;
    let i = typeof r == "string" ? r : r.getData("application/x-latex") || r.getData("text/plain");
    return i && e.model.contentWillChange({ inputType: "insertFromPaste", data: i }) ? (e.stopCoalescingUndo(), e.stopRecording(), this.insert(e.model, i) && (e.startRecording(), e.snapshot("paste"), e.model.contentDidChange({ inputType: "insertFromPaste" }), Y(e)), e.startRecording(), true) : false;
  }
  insert(e, r, i) {
    if (!e.contentWillChange({ data: r, inputType: "insertText" })) return false;
    i || (i = {}), i.insertionMode || (i.insertionMode = "replaceSelection"), i.selectionMode || (i.selectionMode = "placeholder");
    let { silenceNotifications: n } = e;
    i.silenceNotifications && (e.silenceNotifications = true);
    let o = e.silenceNotifications;
    e.silenceNotifications = true, i.insertionMode === "replaceSelection" && !e.selectionIsCollapsed ? e.deleteAtoms(de(e.selection)) : i.insertionMode === "replaceAll" ? (e.root.setChildren([], "body"), e.position = 0) : i.insertionMode === "insertBefore" ? e.collapseSelection("backward") : i.insertionMode === "insertAfter" && e.collapseSelection("forward");
    let a = [];
    for (let c of r) Ru.test(c) && a.push(new he(c));
    let s = e.at(e.position);
    if (s instanceof Ft && (s = s.lastChild), !(s.parent instanceof Ft)) {
      let c = new Ft();
      s.parent.addChildAfter(c, s), s = c.firstChild;
    }
    let l = s.parent.addChildrenAfter(a, s);
    return e.silenceNotifications = o, i.selectionMode === "before" || (i.selectionMode === "item" ? e.setSelection(e.anchor, e.offsetOf(l)) : l && (e.position = e.offsetOf(l))), e.contentDidChange({ data: r, inputType: "insertText" }), e.silenceNotifications = n, true;
  }
};
function lo(t38) {
  return t38.atoms.find((e) => e.type === "latexgroup");
}
function yi(t38) {
  var r, i;
  let e = lo(t38);
  return (i = (r = e == null ? void 0 : e.body) == null ? void 0 : r.filter((n) => n.type === "latex")) != null ? i : [];
}
function ls(t38, e) {
  var s;
  let r = 0, i = false, n = Number.isFinite(e == null ? void 0 : e.before) ? (s = e == null ? void 0 : e.before) != null ? s : 0 : t38.lastOffset;
  for (; r <= n && !i; ) {
    let l = t38.at(r);
    i = l instanceof he && l.isSuggestion, i || r++;
  }
  if (!i) return [void 0, void 0];
  let o = r, a = false;
  for (; o <= n && !a; ) {
    let l = t38.at(o);
    a = !(l instanceof he && l.isSuggestion), a || o++;
  }
  return [r - 1, o - 1];
}
new yc();
function zg(t38, e) {
  t38.flushInlineShortcutBuffer(), t38.stopCoalescingUndo();
  let r = cs(t38, e), { model: i } = t38;
  return i.selectionIsCollapsed ? (t38.defaultStyle.fontSeries && r.fontSeries === t38.defaultStyle.fontSeries && (r.fontSeries = "auto"), r.fontShape && r.fontShape === t38.defaultStyle.fontShape && (r.fontShape = "auto"), r.color && r.color === t38.defaultStyle.color && (r.color = "none"), r.backgroundColor && r.backgroundColor === t38.defaultStyle.backgroundColor && (r.backgroundColor = "none"), r.fontSize && r.fontSize === t38.defaultStyle.fontSize && (r.fontSize = "auto"), t38.defaultStyle = h(h({}, t38.defaultStyle), r)) : t38.model.deferNotifications({ content: true, type: "insertText" }, () => {
    i.selection.ranges.forEach((n) => ao(i, n, r, { operation: "toggle" })), t38.snapshot("style-change");
  }), true;
}
pe({ applyStyle: zg }, { target: "mathfield", canUndo: true, changeContent: true });
function cs(t38, e) {
  var n, o, a, s, l, c, u, d, m, p;
  let r = {};
  if (typeof e.color == "string") {
    let f = (o = t38.colorMap((n = e.color) != null ? n : e.verbatimColor)) != null ? o : "none";
    f !== e.color && (r.verbatimColor = (a = e.verbatimColor) != null ? a : e.color), r.color = f;
  }
  if (typeof e.backgroundColor == "string") {
    let f = (l = t38.backgroundColorMap((s = e.backgroundColor) != null ? s : e.verbatimBackgroundColor)) != null ? l : "none";
    f !== e.backgroundColor && (r.verbatimBackgroundColor = (c = e.verbatimBackgroundColor) != null ? c : e.backgroundColor), r.backgroundColor = f;
  }
  typeof e.fontFamily == "string" && (r.fontFamily = e.fontFamily), typeof e.series == "string" && (r.fontSeries = e.series), typeof e.fontSeries == "string" && (r.fontSeries = e.fontSeries.toLowerCase()), r.fontSeries && (r.fontSeries = (u = { bold: "b", medium: "m", normal: "m" }[r.fontSeries]) != null ? u : r.fontSeries), typeof e.shape == "string" && (r.fontShape = e.shape), typeof e.fontShape == "string" && (r.fontShape = e.fontShape.toLowerCase()), r.fontShape && (r.fontShape = (d = { italic: "it", up: "n", upright: "n", normal: "n" }[r.fontShape]) != null ? d : r.fontShape), e.variant && (r.variant = e.variant.toLowerCase()), e.variantStyle !== void 0 && (r.variantStyle = typeof e.variantStyle == "string" && e.variantStyle !== "" ? e.variantStyle.toLowerCase() : e.variantStyle);
  let i = (m = e.size) != null ? m : e.fontSize;
  return typeof i == "number" ? r.fontSize = Math.max(1, Math.min(10, i)) : typeof i == "string" && (r.fontSize = (p = { size1: 1, size2: 2, size3: 3, size4: 4, size5: 5, size6: 6, size7: 7, size8: 8, size9: 9, size10: 10 }[i.toLowerCase()]) != null ? p : { tiny: 1, scriptsize: 2, footnotesize: 3, small: 4, normal: 5, normalsize: 5, large: 6, Large: 7, LARGE: 8, huge: 9, Huge: 10 }[i]), r;
}
function co(t38, e, r) {
  var o, a;
  let i = t38.model;
  if (i.mode === "latex") return {};
  let n = t38.styleBias;
  if (n === "none") return t38.defaultStyle;
  if (i.mode === "text") return (a = (o = i.at(n === "right" ? r.after : r.before)) == null ? void 0 : o.style) != null ? a : t38.defaultStyle;
  if (i.mode === "math") {
    let s = i.at(n === "right" ? r.after : r.before);
    return h(s ? g(h({}, s.style), { variant: "normal" }) : { variant: "normal" }, t38.defaultStyle);
  }
  return {};
}
function Ut(t38) {
  let e = t38.options.onInsertStyle;
  if (e === null) return {};
  e === void 0 && (e = co);
  let r = t38.model, i = t38.styleBias, n = r.at(r.position), o = Oh(r, n, i), a = Oh(r, n.rightSibling, i);
  return e(t38, r.position, { before: o, after: a });
}
function Oh(t38, e, r) {
  var i;
  return !e || e.type === "first" && r !== "right" ? -1 : e.type !== "group" ? t38.offsetOf(e) : !e.body || e.body.length < 2 ? -1 : ((i = e.body) == null ? void 0 : i.length) === 1 || r !== "right" ? t38.offsetOf(e.body[0]) : t38.offsetOf(e.body[e.body.length - 1]);
}
function xi(t38) {
  let e = yi(t38.model).filter((r) => r.isSuggestion);
  if (e.length !== 0) {
    t38.model.position = t38.model.offsetOf(e[0].leftSibling);
    for (let r of e) r.parent.removeChild(r);
  }
}
function Vr(t38, e) {
  var c;
  let { model: r } = t38;
  xi(t38);
  for (let u of yi(r)) u.isError = false;
  if (!r.selectionIsCollapsed || t38.options.popoverPolicy === "off") {
    $r(t38);
    return;
  }
  let i = [], n = r.at(r.position);
  for (; n && n instanceof he && /^[a-zA-Z\*]$/.test(n.value); ) n = n.leftSibling;
  if (n && n instanceof he && n.value === "\\") for (i.push(n), n = n.rightSibling; n && n instanceof he && /^[a-zA-Z\*]$/.test(n.value); ) i.push(n), n = n.rightSibling;
  let o = i.map((u) => u.value).join(""), a = zu(t38, o);
  if (a.length === 0) {
    if (/^\\[a-zA-Z\*]+$/.test(o)) for (let u of i) u.isError = true;
    $r(t38);
    return;
  }
  let s = (c = e == null ? void 0 : e.atIndex) != null ? c : 0;
  t38.suggestionIndex = s < 0 ? a.length - 1 : s % a.length;
  let l = a[t38.suggestionIndex];
  if (l !== o) {
    let u = i[i.length - 1];
    u.parent.addChildrenAfter([...l.slice(o.length - l.length)].map((d) => new he(d, { isSuggestion: true })), u), vt(t38, { interactive: true });
  }
  Bh(t38, a);
}
function us(t38) {
  let [e, r] = ls(t38, { before: t38.position });
  if (e === void 0 || r === void 0) return false;
  let i = false;
  return t38.getAtoms([e, r]).forEach((n) => {
    n.isSuggestion && (n.isSuggestion = false, i = true);
  }), i;
}
function Qe(t38, e = "accept", r) {
  var l, c;
  $r(t38);
  let i = lo(t38.model);
  if (!i) return false;
  if (e === "accept-suggestion" || e === "accept-all") {
    let u = yi(t38.model).filter((d) => d.isSuggestion);
    if (u.length !== 0) {
      for (let d of u) d.isSuggestion = false;
      t38.model.position = t38.model.offsetOf(u[u.length - 1]);
    }
    if (e === "accept-suggestion") return u.length !== 0;
  }
  let o = yi(t38.model).filter((u) => !u.isSuggestion).map((u) => u.value).join(""), a = i.leftSibling;
  if (i.parent.removeChild(i), t38.model.position = t38.model.offsetOf(a), t38.switchMode((l = r == null ? void 0 : r.mode) != null ? l : "math"), e === "reject") return true;
  let s = h({}, Ut(t38));
  return !/^[a-zA-Z0-9]$/.test(o) && t38.styleBias !== "none" && (s.variant = "normal", s.variantStyle = void 0), H.insert(t38.model, o, { selectionMode: (c = r == null ? void 0 : r.selectItem) != null && c ? "item" : "placeholder", format: "latex", mode: "math", style: s }), t38.snapshot(), t38.model.announce("replacement"), t38.switchMode("math"), true;
}
function vi(t38) {
  var r;
  let e = document.getElementById(t38);
  return e ? e.dataset.refcount = Number(Number.parseInt((r = e.dataset.refcount) != null ? r : "0") + 1).toString() : (e = document.createElement("div"), e.setAttribute("aria-hidden", "true"), e.dataset.refcount = "1", e.id = t38, document.body.append(e)), e;
}
function qr(t38) {
  var i;
  let e = document.getElementById(t38);
  if (!e) return;
  let r = Number.parseInt((i = e.getAttribute("data-refcount")) != null ? i : "0");
  r <= 1 ? e.remove() : e.dataset.refcount = Number(r - 1).toString();
}
function Kh(t38) {
  return t38.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Ng(t38, e) {
  let r = new P({ from: t38.context }), i = new x({ mode: "math", type: "root", body: be(e, { context: r }) }), n = Or(qt(new w(i.render(r), { classes: "ML__base" }), r));
  return Br(n, { classes: "ML__latex" }).toMarkup();
}
function Bh(t38, e) {
  var n;
  if (e.length === 0) {
    $r(t38);
    return;
  }
  let r = "";
  for (let [o, a] of e.entries()) {
    let s = a, l = Ng(t38, a), c = Th(t38.keybindings, s).join("<br>");
    r += `<li role="button" data-command="${Kh(s)}" ${o === t38.suggestionIndex ? "class=ML__popover__current" : ""}><span class="ML__popover__latex">${Kh(s)}</span><span class="ML__popover__command">${l}</span>`, c && (r += `<span class="ML__popover__keybinding">${c}</span>`), r += "</li>";
  }
  let i = Fg(t38, `<ul>${r}</ul>`);
  xc() && ((n = i.querySelector(".ML__popover__current")) == null || n.scrollIntoView({ block: "nearest", inline: "nearest" })), setTimeout(() => {
    var o;
    i && !xc() && (i.classList.add("is-visible"), yn(t38), (o = i.querySelector(".ML__popover__current")) == null || o.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }, 32);
}
function xc() {
  let t38 = document.getElementById("mathlive-suggestion-popover");
  return t38 ? t38.classList.contains("is-visible") : false;
}
function yn(t38, e) {
  var d, m, p;
  if (!t38.element || t38.element.mathfield !== t38 || !xc()) return;
  if (((d = t38.model.at(t38.model.position)) == null ? void 0 : d.type) !== "latex") {
    $r(t38);
    return;
  }
  if (e != null && e.deferred) {
    setTimeout(() => yn(t38), 32);
    return;
  }
  let r = tn(t38.field);
  if (!r) return;
  let i = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight, n = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth, o = window.innerWidth - document.documentElement.clientWidth, a = window.innerHeight - document.documentElement.clientHeight, s = (p = (m = window.mathVirtualKeyboard) == null ? void 0 : m.boundingRect.height) != null ? p : 0, l = document.getElementById("mathlive-suggestion-popover");
  r.x + l.offsetWidth / 2 > n - o ? l.style.left = `${n - l.offsetWidth - o}px` : r.x - l.offsetWidth / 2 < 0 ? l.style.left = "0" : l.style.left = `${r.x - l.offsetWidth / 2}px`;
  let c = r.y - r.height;
  i - a - s - r.y < c ? (l.classList.add("ML__popover--reverse-direction"), l.classList.remove("top-tip"), l.classList.add("bottom-tip"), l.style.top = `${r.y - r.height - l.offsetHeight - 15}px`) : (l.classList.remove("ML__popover--reverse-direction"), l.classList.add("top-tip"), l.classList.remove("bottom-tip"), l.style.top = `${r.y + 15}px`);
}
function $r(t38) {
  t38.suggestionIndex = 0, document.getElementById("mathlive-suggestion-popover") && qr("mathlive-suggestion-popover");
}
function Fg(t38, e) {
  let r = document.getElementById("mathlive-suggestion-popover");
  return r ? qr("mathlive-suggestion-popover") : (Ge("suggestion-popover"), Ge("core")), r = vi("mathlive-suggestion-popover"), r.addEventListener("pointerdown", (i) => i.preventDefault()), r.addEventListener("click", (i) => {
    let n = i.target;
    for (; n && !n.dataset.command; ) n = n.parentElement;
    n && (Qe(t38, "reject"), H.insert(t38.model, n.dataset.command, { selectionMode: "placeholder", format: "latex", mode: "math" }), t38.dirty = true, t38.focus());
  }), r.innerHTML = globalThis.MathfieldElement.createHTML(e), r;
}
function Ph() {
  document.getElementById("mathlive-suggestion-popover") && (qr("mathlive-suggestion-popover"), ot("suggestion-popover"), ot("core"));
}
function $g() {
  let t38 = String(new Error().stack).replace(/^Error.*\n/, "").split(`
`);
  if (t38.length === 0) return console.error(`Can't use relative paths to specify assets location because the sourcefile location could not be determined (unexpected stack trace format "${new Error().stack}").`), "";
  let e = t38[1], r = e.match(/http.*\.ts[\?:]/);
  return r && (e = t38[2]), r = e.match(/(https?:.*):[0-9]+:[0-9]+/), r || (r = e.match(/at (.*(\.ts))[\?:]/), r || (r = e.match(/at (.*(\.mjs|\.js))[\?:]/))), r ? r[1] : (console.error(t38), console.error(`Can't use relative paths to specify assets location because the source file location could not be determined (unexpected location "${e}").`), "");
}
var mr = null, Rh, Ih, vc = ((Ih = (Rh = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : Rh.currentScript) == null ? void 0 : Ih.src) || $g();
async function ds(t38) {
  if (/^(?:[a-z+]+:)?\/\//i.test(t38)) {
    try {
      return new URL(t38).href;
    } catch (e) {
    }
    if (t38.startsWith("//")) try {
      return new URL(`${window.location.protocol}${t38}`).href;
    } catch (e) {
    }
    return t38;
  }
  if (mr === null) try {
    let e = await fetch(vc, { method: "HEAD" });
    e.status === 200 && (mr = e.url, mr = mr.replace(/\/\+esm$/, "/"), mr.includes("jsdelivr.net/") && (mr += "/"));
  } catch (e) {
    console.error(`Invalid URL "${t38}" (relative to "${vc}")`);
  }
  return new URL(t38, mr != null ? mr : vc).href;
}
function Vg(t38, e, r = {}) {
  return new FontFace(t38, `url(${e}.woff2) format('woff2')`, r);
}
var Ne = "not-loaded";
async function zh() {
  return Ne = "not-loaded", hr();
}
async function hr() {
  var e;
  if (Ne !== "not-loaded") return;
  if (Ne = "loading", (e = getComputedStyle(document.documentElement).getPropertyValue("--ML__static-fonts")) != null ? e : false) {
    Ne = "ready";
    return;
  }
  if (document.body.classList.remove("ML__fonts-did-not-load"), "fonts" in document) {
    let r = ["KaTeX_Main", "KaTeX_Math", "KaTeX_AMS", "KaTeX_Caligraphic", "KaTeX_Fraktur", "KaTeX_SansSerif", "KaTeX_Script", "KaTeX_Typewriter", "KaTeX_Size1", "KaTeX_Size2", "KaTeX_Size3", "KaTeX_Size4"], i = Array.from(document.fonts).map((a) => a.family);
    if (r.every((a) => i.includes(a))) {
      Ne = "ready";
      return;
    }
    if (!globalThis.MathfieldElement.fontsDirectory) {
      Ne = "not-loaded";
      return;
    }
    let n = await ds(globalThis.MathfieldElement.fontsDirectory);
    if (!n) {
      document.body.classList.add("ML__fonts-did-not-load"), Ne = "error";
      return;
    }
    n.endsWith("/") && (n = n.slice(0, -1));
    let o = [["KaTeX_Main-Regular"], ["KaTeX_Main-BoldItalic", { style: "italic", weight: "bold" }], ["KaTeX_Main-Bold", { weight: "bold" }], ["KaTeX_Main-Italic", { style: "italic" }], ["KaTeX_Math-Italic", { style: "italic" }], ["KaTeX_Math-BoldItalic", { style: "italic", weight: "bold" }], ["KaTeX_AMS-Regular"], ["KaTeX_Caligraphic-Regular"], ["KaTeX_Caligraphic-Bold", { weight: "bold" }], ["KaTeX_Fraktur-Regular"], ["KaTeX_Fraktur-Bold", { weight: "bold" }], ["KaTeX_SansSerif-Regular"], ["KaTeX_SansSerif-Bold", { weight: "bold" }], ["KaTeX_SansSerif-Italic", { style: "italic" }], ["KaTeX_Script-Regular"], ["KaTeX_Typewriter-Regular"], ["KaTeX_Size1-Regular"], ["KaTeX_Size2-Regular"], ["KaTeX_Size3-Regular"], ["KaTeX_Size4-Regular"]].map((a) => Vg(a[0].replace(/-[a-zA-Z]+$/, ""), `${n}/${a[0]}`, a[1]));
    try {
      (await Promise.all(o.map((s) => {
        try {
          return s.load();
        } catch (l) {
        }
      }))).forEach((s) => document.fonts.add(s)), Ne = "ready";
      return;
    } catch (a) {
      console.error(`MathLive 0.111.1: The math fonts could not be loaded from "${n}"`, { cause: a }), document.body.classList.add("ML__fonts-did-not-load");
    }
    Ne = "error";
  }
}
function Nh(t38, e = 0) {
  let r = 3735928559 ^ e, i = 1103547991 ^ e;
  for (let n = 0; n < t38.length; n++) {
    let o = t38.charCodeAt(n);
    r = Math.imul(r ^ o, 2654435761), i = Math.imul(i ^ o, 1597334677);
  }
  return r = Math.imul(r ^ r >>> 16, 2246822507), r ^= Math.imul(i ^ i >>> 13, 3266489909), i = Math.imul(i ^ i >>> 16, 2246822507), i ^= Math.imul(r ^ r >>> 13, 3266489909), 4294967296 * (2097151 & i) + (r >>> 0);
}
function Y(t38, e) {
  !t38 || t38.dirty || !t38.field || (t38.resizeObserver.unobserve(t38.field), t38.dirty = true, requestAnimationFrame(() => {
    Ye(t38) && t38.dirty && (t38.atomBoundsCache = /* @__PURE__ */ new Map(), vt(t38, e), t38.resizeObserver.observe(t38.field), t38.resizeObserverStarted = true);
  }));
}
function qg(t38, e) {
  var o;
  e = e != null ? e : {};
  let r = new P({ from: g(h({}, t38.context), { atomIdsSettings: { seed: e.forHighlighting ? Nh(x.serialize([t38.model.root], { expandMacro: false, defaultMode: t38.options.defaultMode })) : "random", groupNumbers: (o = e.forHighlighting) != null ? o : false }, letterShapeStyle: t38.options.letterShapeStyle }), mathstyle: t38.options.defaultMode === "inline-math" ? "textstyle" : "displaystyle" }), i = t38.model.root.render(r);
  return Br(qt(i, r), { classes: t38.hasEditablePrompts ? "ML__latex ML__prompting" : "ML__latex", attributes: { translate: "no", "aria-hidden": "true" } });
}
function _c(t38, e) {
  try {
    let { model: r } = t38;
    r.root.caret = void 0, r.root.isSelected = false, r.root.containsCaret = true;
    for (let n of r.atoms) n.caret = void 0, n.isSelected = false, n.containsCaret = false;
    if (r.selectionIsCollapsed) {
      let n = r.at(r.position);
      n.caret = t38.model.mode;
      let o = n.parent;
      for (; o; ) o.containsCaret = true, o = o.parent;
    } else {
      let n = r.getAtoms(r.selection, { includeChildren: true, includeFirstAtoms: true });
      for (let o of n) o.isSelected = true;
    }
    return qg(t38, e).toMarkup();
  } catch (r) {
    return console.error(r), '<span class="ML__latex" translate="no" aria-hidden="true">🚫</span>';
  }
}
function vt(t38, e) {
  if (!Ye(t38)) return;
  e != null || (e = {});
  let r = t38.element.querySelector("[part=virtual-keyboard-toggle]");
  r && (r.style.display = t38.hasEditableContent ? "" : "none");
  let i = t38.field;
  if (!i) return;
  let n = t38.isSelectionEditable && t38.hasFocus(), o = i.classList.contains("ML__focused");
  o && !n ? i.classList.remove("ML__focused") : !o && n && i.classList.add("ML__focused");
  let a = _c(t38, e), s = t38.element.querySelector("[part=menu-toggle]");
  if (s) {
    let l = false;
    (t38.disabled || t38.readOnly && !t38.hasEditableContent || t38.userSelect === "none") && (l = true), !l && t38.element.offsetWidth < 50 && (l = true), s.style.display = l ? "none" : "";
  }
  if (t38.model.atoms.length <= 1) {
    let l = t38.options.contentPlaceholder;
    l && (a += `<span part=placeholder class="ML__content-placeholder">${fe(l)}</span>`);
  }
  i.innerHTML = globalThis.MathfieldElement.createHTML(a), uo(t38, e.interactive), t38.updateToggleLayout(), t38.dirty = false;
}
function uo(t38, e) {
  var l;
  let r = t38.field;
  if (!r) return;
  for (let c of r.querySelectorAll(".ML__selection, .ML__contains-highlight")) c.remove();
  if (!(e != null && e) && Ne !== "error" && Ne !== "ready") {
    setTimeout(() => {
      Ne === "ready" ? uo(t38) : setTimeout(() => uo(t38), 128);
    }, 32);
    return;
  }
  let i = t38.model;
  (l = t38.atomBoundsCache) == null || l.clear();
  let n, o = () => {
    if (n !== void 0) return n;
    let c = r.offsetWidth, u = r.getBoundingClientRect().width;
    return n = Math.floor(u) / c, isNaN(n) && (n = 1), n;
  };
  if (i.selectionIsCollapsed) {
    yn(t38, { deferred: true });
    let c = i.at(i.position);
    for (; c && c.type !== "prompt" && !(c.containsCaret && c.displayContainsHighlight); ) c = c.parent;
    if (c != null && c.containsCaret && c.displayContainsHighlight) {
      let u = o(), d = uc(t38, ar(t38, c), u);
      if (d) {
        d.left /= u, d.right /= u, d.top /= u, d.bottom /= u;
        let m = document.createElement("div");
        m.classList.add("ML__contains-highlight"), m.style.position = "absolute", m.style.left = `${d.left + 1}px`, m.style.top = `${Math.ceil(d.top)}px`, m.style.width = `${Math.ceil(d.right - d.left)}px`, m.style.height = `${Math.ceil(d.bottom - d.top)}px`, r.insertBefore(m, r.childNodes[0]);
      }
    }
    return;
  }
  let a = o(), s = Hg(Ga(t38, { excludeAtomsWithBackground: true }));
  for (let c of s) {
    c.left /= a, c.right /= a, c.top /= a, c.bottom /= a;
    let u = document.createElement("div");
    u.classList.add("ML__selection"), u.style.position = "absolute", u.style.left = `${c.left}px`, u.style.top = `${c.top}px`, u.style.width = `${Math.ceil(c.right - c.left)}px`, u.style.height = `${Math.max(1, Math.ceil(c.bottom - c.top - 1))}px`, r.insertBefore(u, r.childNodes[0]);
  }
}
function Hg(t38) {
  let e = [];
  for (let r of t38) {
    let i = false;
    for (let n of e) if (r.left === n.left && r.right === n.right && r.top === n.top && r.bottom === n.bottom) {
      i = true;
      break;
    }
    i || e.push(r);
  }
  t38 = e, e = [];
  for (let r of t38) {
    let i = 0;
    for (let n of t38) if (r.left >= n.left && r.right <= n.right && r.top >= n.top && r.bottom <= n.bottom && (i += 1, i > 1)) break;
    i === 1 && e.push(r);
  }
  return e;
}
function Mc(t38) {
  if (!t38) return;
  let e = t38.model, r = e.selection, i = x.serialize([e.root], { expandMacro: false, defaultMode: t38.options.defaultMode });
  H.insert(e, i, { insertionMode: "replaceAll", selectionMode: "after", format: "latex", silenceNotifications: true, mode: "math" });
  let n = e.silenceNotifications;
  e.silenceNotifications = true, e.selection = r, e.silenceNotifications = n, Y(t38);
}
function wc() {
  for (let t38 of document.querySelectorAll(".ML__mathfield")) "_mathfield" in t38 && Mc(t38._mathfield);
}
var mo = 3, _t;
function pe(t38, e) {
  e = h({ target: "mathfield", canUndo: false, audioFeedback: void 0, changeContent: false, changeSelection: false }, e != null ? e : {}), _t || (_t = {});
  for (let r of Object.keys(t38)) _t[r], _t[r] = g(h({}, e), { fn: t38[r] });
}
function Sc(t38) {
  let e;
  if (Array.isArray(t38)) {
    if (t38[0] === "performWithFeedback") return Sc(t38[1]);
    e = t38[0];
  } else e = t38;
  return _t[e];
}
function pr(t38) {
  var e;
  return (e = Sc(t38)) == null ? void 0 : e.target;
}
function Fh(t38, e) {
  var l, c;
  if (e = _i(e), !e) return false;
  let r, i = [], n = false, o = false;
  ee(e) ? (r = e[0], i = e.slice(1)) : r = e;
  let a = _t[r], s = a == null ? void 0 : a.target;
  if (s === "model") {
    if (!t38.isSelectionEditable && (a != null && a.changeContent)) return t38.model.announce("plonk"), false;
    /^(delete|add)/.test(r) && (r !== "deleteBackward" && t38.flushInlineShortcutBuffer(), t38.snapshot(r)), /^complete/.test(r) || xi(t38), _t[r].fn(t38.model, ...i), Vr(t38), o = true, n = true;
  } else if (s === "virtual-keyboard") o = (c = (l = window.mathVirtualKeyboard) == null ? void 0 : l.executeCommand(e)) != null ? c : false, n = true;
  else if (_t[r]) {
    if (!t38.isSelectionEditable && (a != null && a.changeContent)) return t38.model.announce("plonk"), false;
    /^(undo|redo)/.test(r) && t38.flushInlineShortcutBuffer(), o = _t[r].fn(t38, ...i), n = true;
  } else throw new Error(`Unknown command "${r}"`);
  return s !== "virtual-keyboard" && (!t38.model.selectionIsCollapsed || a != null && a.changeSelection && r !== "deleteBackward") && (t38.flushInlineShortcutBuffer(), a != null && a.changeContent || t38.stopCoalescingUndo(), t38.defaultStyle = {}), o && (a != null && a.changeSelection && n ? (t38.dirty = true, t38.scrollIntoView()) : Y(t38)), n;
}
function Wg(t38, e) {
  var n;
  if (!t38) return false;
  t38.focus(), xn.keypressVibration && Di() && navigator.vibrate(mo);
  let r = Sc(e);
  globalThis.MathfieldElement.playSound((n = r == null ? void 0 : r.audioFeedback) != null ? n : "keypress");
  let i = t38.executeCommand(e);
  return t38.scrollIntoView(), i;
}
pe({ performWithFeedback: (t38, e) => Wg(t38, e) });
function Ug(t38) {
  return Vr(t38, { atIndex: t38.suggestionIndex + 1 }), false;
}
function Gg(t38) {
  return Vr(t38, { atIndex: t38.suggestionIndex - 1 }), false;
}
pe({ complete: Qe }, { target: "mathfield", audioFeedback: "return", canUndo: true, changeContent: true, changeSelection: true });
pe({ dispatchEvent: (t38, e, r) => {
  var i, n;
  return (n = (i = t38.host) == null ? void 0 : i.dispatchEvent(new CustomEvent(e, { detail: r }))) != null ? n : false;
} }, { target: "mathfield" });
pe({ nextSuggestion: Ug, previousSuggestion: Gg }, { target: "mathfield", audioFeedback: "keypress", changeSelection: true });
function _i(t38) {
  if (!t38) return;
  if (ee(t38) && t38.length > 0) {
    let i = t38[0];
    return i = i.replace(/-\w/g, (n) => n[1].toUpperCase()), i === "performWithFeedback" && t38.length === 2 ? [i, _i(t38[1])] : [i, ...t38.slice(1)];
  }
  if (typeof t38 != "string") return;
  let e = t38.trim().match(/^([a-zA-Z0-9-]+)\((.*)\)$/);
  if (e) {
    let i = e[1].replace(/-\w/g, (o) => o[1].toUpperCase()), n = e[2].split(",").map((o) => o.trim());
    return [i, ...n.map((o) => {
      if (/"[^"]*"/.test(o) || /'[^']*'/.test(o)) return o.slice(1, -1);
      if (/^true$/.test(o)) return true;
      if (/^false$/.test(o)) return false;
      if (/^[-]?\d+$/.test(o)) return parseInt(o, 10);
      if (/^\{.*\}$/.test(o)) try {
        return JSON.parse(o);
      } catch (a) {
        return console.error("Invalid argument:", o), o;
      }
      return _i(o);
    })];
  }
  return t38.replace(/-\w/g, (i) => i[1].toUpperCase());
}
var po = "mathlive#virtual-keyboard-message";
function fo(t38) {
  var r;
  return t38.type !== "message" ? false : ((r = t38.data) == null ? void 0 : r.type) === po;
}
var ho = class t33 {
  constructor() {
    this.targetOrigin = window.origin;
    this.originValidator = "none";
    this.targetWindow = window.top;
    this._boundingRect = new DOMRect(0, 0, 0, 0);
    this._isShifted = false;
    window.addEventListener("message", this), this.sendMessage("proxy-created"), this.listeners = {};
  }
  static get singleton() {
    return this._singleton || (this._singleton = new t33()), this._singleton;
  }
  getKeycap(e) {
  }
  setKeycap(e, r) {
    this.sendMessage("update-setting", { setKeycap: { keycap: e, value: r } });
  }
  set alphabeticLayout(e) {
    this.sendMessage("update-setting", { alphabeticLayout: e });
  }
  set layouts(e) {
    this.sendMessage("update-setting", { layouts: e });
  }
  get normalizedLayouts() {
    return [];
  }
  set editToolbar(e) {
    this.sendMessage("update-setting", { editToolbar: e });
  }
  set container(e) {
    throw new Error("Container inside an iframe cannot be changed");
  }
  show(e) {
    this.dispatchEvent(new CustomEvent("before-virtual-keyboard-toggle", { detail: { visible: true }, bubbles: true, cancelable: true, composed: true })) && (this.sendMessage("show", e), this.dispatchEvent(new Event("virtual-keyboard-toggle")));
  }
  hide(e) {
    this.dispatchEvent(new CustomEvent("before-virtual-keyboard-toggle", { detail: { visible: false }, bubbles: true, cancelable: true, composed: true })) && (this.sendMessage("hide", e), this.dispatchEvent(new Event("virtual-keyboard-toggle")));
  }
  get isShifted() {
    return this._isShifted;
  }
  get visible() {
    return this._boundingRect.height > 0;
  }
  set visible(e) {
    e ? this.show() : this.hide();
  }
  get boundingRect() {
    return this._boundingRect;
  }
  executeCommand(e) {
    return this.sendMessage("execute-command", { command: e }), true;
  }
  updateToolbar(e) {
    this.sendMessage("update-toolbar", e);
  }
  update(e) {
    this.sendMessage("update-setting", e);
  }
  connect() {
    this.sendMessage("connect");
  }
  disconnect() {
    this.sendMessage("disconnect");
  }
  addEventListener(e, r, i) {
    this.listeners[e] || (this.listeners[e] = /* @__PURE__ */ new Set()), this.listeners[e].has(r) || this.listeners[e].add(r);
  }
  dispatchEvent(e) {
    return !this.listeners[e.type] || this.listeners[e.type].size === 0 ? true : (this.listeners[e.type].forEach((r) => {
      typeof r == "function" ? r(e) : r == null || r.handleEvent(e);
    }), !e.defaultPrevented);
  }
  removeEventListener(e, r, i) {
    this.listeners[e] && this.listeners[e].delete(r);
  }
  handleEvent(e) {
    if (fo(e)) {
      if (!rn(e.origin, this.originValidator)) throw new DOMException(`Message from unknown origin (${e.origin}) cannot be handled`, "SecurityError");
      this.handleMessage(e.data);
    }
  }
  handleMessage(e) {
    let { action: r } = e;
    if (r === "execute-command") {
      let { command: i } = e;
      pr(i) === "virtual-keyboard" && this.executeCommand(i);
      return;
    }
    if (r === "synchronize-proxy") {
      this._boundingRect = e.boundingRect, this._isShifted = e.isShifted;
      return;
    }
    if (r === "geometry-changed") {
      this._boundingRect = e.boundingRect, this.dispatchEvent(new Event("geometrychange"));
      return;
    }
  }
  sendMessage(e, r = {}) {
    if (!this.targetWindow) throw new DOMException("A frame does not have access to the top window and can't communicate with the keyboard.", "SecurityError");
    this.targetWindow.postMessage(h({ type: po, action: e }, r), this.targetOrigin);
  }
};
var kc = { numeric: { label: "123", labelClass: "MLK__tex-math", tooltip: "keyboard.tooltip.numeric", rows: [[{ latex: "x", shift: "y", variants: ["y", "z", "t", "r", "x^2", "x^n", "x^{#?}", "x_n", "x_i", "x_{#?}", { latex: "f(#?)", class: "small" }, { latex: "g(#?)", class: "small" }] }, { latex: "n", shift: "a", variants: ["i", "j", "p", "k", "a", "u"] }, "[separator-5]", "[7]", "[8]", "[9]", "[/]", "[separator-5]", { latex: "\\exponentialE", shift: "\\ln", variants: ["\\exp", "\\times 10^{#?}", "\\ln", "\\log_{10}", "\\log", "\\lg", "\\operatorname{lb}"] }, { latex: "\\imaginaryI", variants: ["\\Re", "\\Im", "\\imaginaryJ", "\\Vert #0 \\Vert"] }, { latex: "\\pi", shift: "\\sin", variants: ["\\prod", { latex: "\\theta", aside: "theta" }, { latex: "\\rho", aside: "rho" }, { latex: "\\tau", aside: "tau" }, "\\sin", "\\cos", "\\tan"] }], [{ label: "<", latex: "<", class: "hide-shift", shift: { latex: "\\le", label: "≤" } }, { label: ">", latex: ">", class: "hide-shift", shift: { latex: "\\ge", label: "≥" } }, "[separator-5]", "[4]", "[5]", "[6]", "[*]", "[separator-5]", { class: "hide-shift", latex: "#@^2}", shift: "#@^{\\prime}}" }, { latex: "#@^{#0}}", class: "hide-shift", shift: "#@_{#?}" }, { class: "hide-shift", latex: "\\sqrt{#0}", shift: { latex: "\\sqrt[#0]{#?}}" } }], ["[(]", "[)]", "[separator-5]", "[1]", "[2]", "[3]", "[-]", "[separator-5]", { latex: "\\int^{\\infty}_{0}\\!#?\\,\\mathrm{d}x", class: "small hide-shift", shift: "\\int", variants: [{ latex: "\\int_{#?}^{#?}", class: "small" }, { latex: "\\int", class: "small" }, { latex: "\\iint", class: "small" }, { latex: "\\iiint", class: "small" }, { latex: "\\oint", class: "small" }, "\\mathrm{d}x", { latex: "\\dfrac{\\mathrm{d}}{\\mathrm{d} x}", class: "small" }, { latex: "\\frac{\\partial}{\\partial x}", class: "small" }, "\\partial"] }, { class: "hide-shift", latex: "\\forall", shift: "\\exists" }, { label: "[backspace]", width: 1 }], [{ label: "[shift]", width: 2 }, "[separator-5]", "[0]", "[.]", "[=]", "[+]", "[separator-5]", "[left]", "[right]", { label: "[action]", width: 1 }]] }, greek: { label: "&alpha;&beta;&gamma;", labelClass: "MLK__tex-math", tooltip: "keyboard.tooltip.greek", rows: [[{ label: "<i>&#x03c6;</i>", class: "MLK__tex hide-shift", insert: "\\varphi", aside: "phi var.", shift: "\\Phi" }, { label: "<i>&#x03c2;</i>", class: "MLK__tex hide-shift", insert: "\\varsigma", aside: "sigma var.", shift: "\\Sigma" }, { label: "<i>&#x03f5;</i>", class: "MLK__tex hide-shift", insert: "\\epsilon", aside: "epsilon", shift: '\\char"0190' }, { label: "<i>&rho;</i>", class: "MLK__tex hide-shift", insert: "\\rho", aside: "rho", shift: '\\char"3A1' }, { label: "<i>&tau;</i>", class: "MLK__tex hide-shift", insert: "\\tau", aside: "tau", shift: '\\char"3A4' }, { label: "<i>&upsilon;</i>", class: "MLK__tex hide-shift", insert: "\\upsilon", aside: "upsilon", shift: "\\Upsilon" }, { label: "<i>&theta;</i>", class: "MLK__tex hide-shift", insert: "\\theta", aside: "theta", shift: "\\Theta" }, { label: "<i>&iota;</i>", class: "MLK__tex hide-shift", insert: "\\iota", aside: "iota", shift: '\\char"399' }, { label: "<i>&omicron;</i>", class: "MLK__tex hide-shift", insert: "\\omicron", aside: "omicron", shift: '\\char"39F' }, { label: "<i>&pi;</i>", class: "MLK__tex hide-shift", insert: "\\pi", aside: "pi", shift: "\\Pi" }], ["[separator-5]", { label: "<i>&alpha;</i>", class: "MLK__tex hide-shift", insert: "\\alpha", aside: "alpha", shift: '\\char"391' }, { label: "<i>&sigma;</i>", class: "MLK__tex hide-shift", insert: "\\sigma", aside: "sigma", shift: "\\Sigma" }, { label: "<i>&delta;</i>", class: "MLK__tex hide-shift", insert: "\\delta", aside: "delta", shift: "\\Delta" }, { latex: "\\phi", class: "MLK__tex hide-shift", insert: "\\phi", aside: "phi", shift: "\\Phi" }, { label: "<i>&gamma;</i>", class: "MLK__tex hide-shift", insert: "\\gamma", aside: "gamma", shift: "\\Gamma" }, { label: "<i>&eta;</i>", class: "MLK__tex hide-shift", insert: "\\eta", aside: "eta", shift: '\\char"397' }, { label: "<i>&xi;</i>", class: "MLK__tex hide-shift", insert: "\\xi", aside: "xi", shift: "\\Xi" }, { label: "<i>&kappa;</i>", class: "MLK__tex hide-shift", insert: "\\kappa", aside: "kappa", shift: "\\Kappa" }, { label: "<i>&lambda;</i>", class: "MLK__tex hide-shift", insert: "\\lambda", aside: "lambda", shift: "\\Lambda" }, "[separator-5]"], ["[shift]", { label: "<i>&zeta;</i>", class: "MLK__tex hide-shift", insert: "\\zeta", aside: "zeta", shift: '\\char"396' }, { label: "<i>&chi;</i>", class: "MLK__tex hide-shift", insert: "\\chi", aside: "chi", shift: '\\char"3A7' }, { label: "<i>&psi;</i>", class: "MLK__tex hide-shift", insert: "\\psi", aside: "psi", shift: "\\Psi" }, { label: "<i>&omega;</i>", class: "MLK__tex hide-shift", insert: "\\omega", aside: "omega", shift: "\\Omega" }, { label: "<i>&beta;</i>", class: "MLK__tex hide-shift", insert: "\\beta", aside: "beta", shift: '\\char"392' }, { label: "<i>&nu;</i>", class: "MLK__tex hide-shift", insert: "\\nu", aside: "nu", shift: '\\char"39D' }, { label: "<i>&mu;</i>", class: "MLK__tex hide-shift", insert: "\\mu", aside: "mu", shift: '\\char"39C' }, "[backspace]"], ["[separator]", { label: "<i>&#x03b5;</i>", class: "MLK__tex", insert: "\\varepsilon", aside: "epsilon var." }, { label: "<i>&#x03d1;</i>", class: "MLK__tex", insert: "\\vartheta", aside: "theta var." }, { label: "<i>&#x3f0;</i>", class: "MLK__tex", insert: "\\varkappa", aside: "kappa var." }, { label: "<i>&#x03d6;</i>", class: "MLK__tex", insert: "\\varpi", aside: "pi var." }, { label: "<i>&#x03f1;</i>", class: "MLK__tex", insert: "\\varrho", aside: "rho var." }, "[left]", "[right]", "[action]"]] }, symbols: { label: "&infin;≠∈", labelClass: "MLK__tex", tooltip: "keyboard.tooltip.symbols", rows: [[{ latex: "\\sin", shift: "\\sin^{-1}", variants: [{ class: "small", latex: "\\sinh" }, { class: "small", latex: "\\sin^{-1}" }, { class: "small", latex: "\\operatorname{arsinh}" }] }, "\\ln", { latex: "\\mathrm{abs}", insert: "\\mathrm{abs}\\left(#0\\right)" }, { latex: "\\rightarrow", shift: "\\Rightarrow", variants: [{ latex: "\\implies", aside: "implies" }, { latex: "\\to", aside: "to" }, "\\dashv", { latex: "\\roundimplies", aside: "round implies" }] }, { latex: "\\exists", variants: ["\\nexists"], shift: "\\nexists" }, { latex: "\\in", shift: "\\notin", variants: ["\\notin", "\\owns"] }, "\\cup", { latex: "\\overrightarrow{#@}", shift: "\\overleftarrow{#@}", variants: ["\\overleftarrow{#@}", "\\bar{#@}", "\\vec{#@}", "\\hat{#@}", "\\check{#@}", "\\dot{#@}", "\\ddot{#@}", "\\mathring{#@}", "\\breve{#@}", "\\acute{#@}", "\\tilde{#@}", "\\grave{#@}"] }, { class: "small hide-shift", latex: "\\lim_{#?}", shift: "\\lim_{x\\to\\infty}", variants: [{ class: "small", latex: "\\liminf_{#?}" }, { class: "small", latex: "\\limsup_{#?}" }] }, "\\exponentialE"], [{ latex: "\\cos", shift: "\\cos^{-1}", variants: [{ class: "small", latex: "\\cosh" }, { class: "small", latex: "\\cos^{-1}" }, { class: "small", latex: "\\operatorname{arcosh}" }] }, { latex: "\\log", shift: "\\log_{10}", variants: ["\\log_{#0}", "\\log_{10}"] }, "\\left\\vert#0\\right\\vert", { latex: "\\larr", shift: "\\lArr", variants: [{ latex: "\\impliedby", aside: "implied by" }, { latex: "\\gets", aside: "gets" }, "\\lArr", "\\vdash", { latex: "\\models", aside: "models" }] }, { latex: "\\forall", shift: "\\lnot", variants: [{ latex: "\\land", aside: "and" }, { latex: "\\lor", aside: "or" }, { latex: "\\oplus", aside: "xor" }, { latex: "\\lnot", aside: "not" }, { latex: "\\downarrow", aside: "nor" }, { latex: "\\uparrow", aside: "nand" }, { latex: "\\curlywedge", aside: "nor" }, { latex: "\\bar\\curlywedge", aside: "nand" }] }, { latex: "\\ni", shift: "\\not\\owns" }, "\\cap", { latex: "\\overline{#@}", shift: "\\underline{#@}", variants: ["\\overbrace{#@}", "\\overlinesegment{#@}", "\\overleftrightarrow{#@}", "\\overrightarrow{#@}", "\\overleftarrow{#@}", "\\overgroup{#@}", "\\underbrace{#@}", "\\underlinesegment{#@}", "\\underleftrightarrow{#@}", "\\underrightarrow{#@}", "\\underleftarrow{#@}", "\\undergroup{#@}"] }, { class: "hide-shift small", latex: "\\int", shift: "\\iint", variants: [{ latex: "\\int_{#?}^{#?}", class: "small" }, { latex: "\\int", class: "small" }, { latex: "\\smallint", class: "small" }, { latex: "\\iint", class: "small" }, { latex: "\\iiint", class: "small" }, { latex: "\\oint", class: "small" }, "\\intop", "\\iiint", "\\oiint", "\\oiiint", "\\intclockwise", "\\varointclockwise", "\\ointctrclockwise", "\\intctrclockwise"] }, { latex: "\\pi", shift: "\\tau", variants: ["\\tau"] }], [{ latex: "\\tan", shift: "\\tan^{-1}", variants: [{ class: "small", latex: "\\tanh" }, { class: "small", latex: "\\tan^{-1}" }, { class: "small", latex: "\\operatorname{artanh}" }, { class: "small", latex: "\\arctan" }, { class: "small", latex: "\\operatorname{arctg}" }, { class: "small", latex: "\\operatorname{tg}" }] }, { latex: "\\exp", insert: "\\exp\\left(#0\\right)", variants: ["\\exponentialE^{#0}"] }, "\\left\\Vert#0\\right\\Vert", { latex: "\\lrArr", shift: "\\leftrightarrow", variants: [{ latex: "\\iff", aside: "if and only if" }, "\\leftrightarrow", "\\leftrightarrows", "\\Leftrightarrow", { latex: "^\\biconditional", aside: "biconditional" }] }, { latex: "\\vert", shift: "!" }, { latex: "#@^{\\complement}", aside: "complement", variants: [{ latex: "\\setminus", aside: "set minus" }, { latex: "\\smallsetminus", aside: "small set minus" }] }, { latex: "\\subset", shift: "\\subseteq", variants: ["\\subset", "\\subseteq", "\\subsetneq", "\\varsubsetneq", "\\subsetneqq", "\\nsubset", "\\nsubseteq", "\\supset", "\\supseteq", "\\supsetneq", "\\supsetneqq", "\\nsupset", "\\nsupseteq"] }, { latex: "#@^{\\prime}", shift: "#@^{\\doubleprime}", variants: ["#@^{\\doubleprime}", "#@\\degree"] }, { latex: "\\mathrm{d}", shift: "\\partial", variants: ["\\mathrm{d}x", { latex: "\\dfrac{\\mathrm{d}}{\\mathrm{d} x}", class: "small" }, { latex: "\\frac{\\partial}{\\partial x}", class: "small" }, "\\partial"] }, { latex: "\\infty", variants: ["\\aleph_0", "\\aleph_1", "\\omega", "\\mathfrak{m}"] }], [{ label: "[shift]", width: 2 }, { class: "box", latex: ",", shift: ";", variants: [";", "?"] }, { class: "box", latex: "\\colon", shift: "\\Colon", variants: [{ latex: "\\Colon", aside: "such that", class: "box" }, { latex: ":", aside: "ratio", class: "box" }, { latex: "\\vdots", aside: "", class: "box" }, { latex: "\\ddots", aside: "", class: "box" }, { latex: "\\ldotp", aside: "low dot", class: "box" }, { latex: "\\cdotp", aside: "center dot", class: "box" }, { latex: "\\ldots", aside: "low ellipsis", class: "box" }, { latex: "\\cdots", aside: "center ellipsis", class: "box" }, { latex: "\\therefore", aside: "therefore", class: "box" }, { latex: "\\because", aside: "because", class: "box" }] }, { class: "box", latex: "\\cdot", aside: "centered dot", shift: "\\ast", variants: ["\\circ", "\\bigcirc", "\\bullet", "\\odot", "\\oslash", "\\circledcirc", "\\ast", "\\star", "\\times", "\\doteq", "\\doteqdot"] }, "[separator]", "[left]", "[right]", { label: "[backspace]", width: 1, class: "action hide-shift" }, { label: "[action]", width: 1 }]] }, compact: { label: "compact", rows: [["[+]", "[-]", "[*]", "[/]", "[=]", "[.]", "[(]", "[)]", "\\sqrt{#0}", "#@^{#?}"], ["[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]", "[9]", "[0]"], ["[hr]"], ["[undo]", "[redo]", "[separator]", "[separator]", "[separator]", "[left]", "[right]", { label: "[backspace]", class: "action hide-shift" }, "[hide-keyboard]"]] }, minimalist: { label: "minimalist", layers: [{ style: `
          div.minimalist-backdrop {
            display: flex;
            justify-content: center;
          }          
          div.minimalist-container {
            --keycap-height: 40px;
            --keycap-max-width: 53px;
            --keycap-small-font-size: 12px;
            background: var(--keyboard-background);
            padding: 20px 20px 0px 20px;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            border: 1px solid var(--keyboard-border);
            box-shadow: 0 0 32px rgb(0 0 0 / 30%);
          }        
        `, backdrop: "minimalist-backdrop", container: "minimalist-container", rows: [["+", "-", "\\times", { latex: "\\frac{#@}{#0}", class: "small" }, "=", "[.]", "(", ")", { latex: "\\sqrt{#0}", class: "small" }, { latex: "#@^{#?}", class: "small" }], ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], ["[hr]"], ["[undo]", "[redo]", "[separator]", "[separator]", "[separator]", "[left]", "[right]", { label: "[backspace]", class: "action hide-shift" }, "[hide-keyboard]"]] }] }, "numeric-only": { label: "123", labelClass: "MLK__tex-math", tooltip: "keyboard.tooltip.numeric", id: "numeric-only", rows: [["7", "8", "9", "[separator]", { label: "[backspace]", width: 2 }], ["4", "5", "6", "[separator]", "[separator]", "[separator]"], ["1", "2", "3", "[separator]", "[separator]", "[separator]"], ["0", { label: "[.]", variants: [] }, "-", "[separator]", "[left]", "[right]"]] } };
var ms = { 0: ["\\varnothing", "\\infty"], 1: ["\\frac{1}{#@}", "#@^{-1}", "\\times 10^{#?}", "\\phi", "\\imaginaryI"], 2: ["\\frac{1}{2}", "#@^2", "\\sqrt2", "\\exponentialE"], 3: ["\\frac{1}{3}", "#@^3", "\\sqrt3", "\\pi"], 4: ["\\frac{1}{4}", "#@^4"], 5: ["\\frac{1}{5}", "#@^5", "\\sqrt5"], 6: ["\\frac{1}{6}", "#@^6"], 7: ["\\frac{1}{7}", "#@^7"], 8: ["\\frac{1}{8}", "#@^8"], 9: ["\\frac{1}{9}", "#@^9"], ".": [".", ",", ";", "\\colon"], ",": ["{,}", ".", ";", "\\colon"], a: [{ latex: "\\aleph", aside: "aleph" }, { latex: "\\forall", aside: "for all" }, "å", "à", "á", "â", "ä", "æ"], A: [{ latex: "\\aleph", aside: "aleph" }, { latex: "\\forall", aside: "for all" }, "Å", "À", "Á", "Â", "Ä", "Æ"], b: [{ latex: "\\beth", aside: "beth" }], c: [{ latex: "\\C", aside: "set of complex numbers" }, "ç"], d: [{ latex: "\\daleth", aside: "daleth" }], e: [{ latex: "\\exponentialE", aside: "exponential e" }, { latex: "\\exists", aside: "there is" }, { latex: "\\nexists", aside: "there isn’t" }, "è", "é", "ê", "ë"], E: [{ latex: "\\exponentialE", aside: "exponential e" }, { latex: "\\exists", aside: "there is" }, { latex: "\\nexists", aside: "there isn’t" }, "È", "É", "Ê", "Ë"], g: [{ latex: "\\gimel", aside: "gimel" }], h: [{ latex: "\\hbar", aside: "h bar" }, { latex: "\\hslash", aside: "h slash" }], i: [{ latex: "\\imaginaryI", aside: "imaginary i" }, "ì", "í", "î", "ï"], I: [{ latex: "\\imaginaryI", aside: "imaginary i" }, "Ì", "Í", "Î", "Ï"], j: [{ latex: "\\imaginaryJ", aside: "imaginary j" }], l: [{ latex: "\\ell", aside: "ell" }], n: [{ latex: "\\mathbb{N}", aside: "set of natural numbers" }, "ñ"], o: ["ø", "œ", "ò", "ó", "ô", "ö"], O: ["ø", "Œ", "Ò", "Ó", "Ô", "Ö"], p: [{ latex: "\\mathbb{P}", aside: "set of primes" }], q: [{ latex: "\\mathbb{Q}", aside: "set of rational numbers" }], r: [{ latex: "\\mathbb{R}", aside: "set of real numbers" }], u: ["ù", "ú", "û", "ü"], U: ["Ù", "Ú", "Û", "Ü"], z: [{ latex: "\\mathbb{Z}", aside: "set of integers" }], y: ["ý", "ÿ"], Y: ["Ÿ"], space: [{ latex: '\\char"203A\\!\\char"2039', insert: "\\!", aside: "negative thin space<br>⁻³⧸₁₈ em" }, { latex: '\\char"203A\\,\\char"2039', insert: "\\,", aside: "thin space<br>³⧸₁₈ em" }, { latex: '\\char"203A\\:\\char"2039', insert: "\\:", aside: "medium space<br>⁴⧸₁₈ em" }, { latex: '\\char"203A\\;\\char"2039', insert: "\\;", aside: "thick space<br>⁵⧸₁₈ em" }, { latex: '\\char"203A\\ \\char"2039', insert: "\\ ", aside: "⅓ em" }, { latex: '\\char"203A\\enspace\\char"2039', insert: "\\enspace", aside: "½ em" }, { latex: '\\char"203A\\quad\\char"2039', insert: "\\quad", aside: "1 em" }, { latex: '\\char"203A\\qquad\\char"2039', insert: "\\qquad", aside: "2 em" }] }, vn;
function hs(t38, e) {
  var m, p, f, y, v;
  let r = Fe.singleton;
  if (!r) return;
  let i = Mi(t38), n = "";
  if (window.mathVirtualKeyboard.isShifted) {
    let b = (m = r.getKeycap(i == null ? void 0 : i.id)) == null ? void 0 : m.shift;
    typeof b == "object" && "variants" in b && (n = (p = b.variants) != null ? p : "");
  } else n = (y = (f = r.getKeycap(i == null ? void 0 : i.id)) == null ? void 0 : f.variants) != null ? y : "";
  if (typeof n == "string" && !ps(n) || Array.isArray(n) && n.length === 0) {
    e == null || e();
    return;
  }
  let o = {}, a = "";
  for (let b of Jg(n)) {
    let k = go(b), S = Date.now().toString(36).slice(-2) + Math.floor(Math.random() * 1e5).toString(36);
    o[S] = k;
    let [A, E] = _n(k);
    a += `<div id=${S} class="item ${E}">${A}</div>`;
  }
  let s = document.createElement("div");
  s.setAttribute("aria-hidden", "true"), s.className = "MLK__variant-panel", s.style.height = "auto";
  let l = Object.keys(o).length, c = 5;
  l === 1 ? c = 1 : l === 2 || l === 4 ? c = 2 : l === 3 || l === 5 || l === 6 ? c = 3 : l >= 7 && l < 14 && (c = 4), s.style.width = `calc(var(--variant-keycap-length) * ${c} + 12px)`, s.innerHTML = xn.createHTML(a), Te.open({ root: (v = r == null ? void 0 : r.container) == null ? void 0 : v.querySelector(".ML__keyboard"), child: s }), vn = new AbortController();
  let { signal: u } = vn, d = t38 == null ? void 0 : t38.getBoundingClientRect();
  if (d) {
    d.top - s.clientHeight < 0 && (s.style.width = "auto", l <= 6 ? s.style.height = "56px" : l <= 12 ? s.style.height = "108px" : l <= 18 ? s.style.height = "205px" : s.classList.add("compact"));
    let b = Math.max(0, Math.min(window.innerWidth - s.offsetWidth, (d.left + d.right - s.offsetWidth) / 2)), k = d.top - s.clientHeight + 5;
    s.style.left = `${b}px`, s.style.top = `${k}px`, s.classList.add("is-visible"), requestAnimationFrame(() => {
      var S;
      s.addEventListener("pointerup", (A) => {
        let E = Mi(A.target);
        !(E != null && E.id) || !o[E.id] || (fs(o[E.id]), Hr(), e == null || e(), A.preventDefault());
      }, { capture: true, passive: false, signal: u }), s.addEventListener("pointerenter", (A) => {
        let E = Mi(A.target);
        !(E != null && E.id) || !o[E.id] || E.classList.add("is-active");
      }, { capture: true, signal: u }), s.addEventListener("pointerleave", (A) => {
        let E = Mi(A.target);
        A.target && "tagName" in A.target && typeof A.target.tagName == "string" && A.target.tagName.toUpperCase() === "ASIDE" || !(E != null && E.id) || !o[E.id] || E.classList.remove("is-active");
      }, { capture: true, signal: u }), (S = r.getKeycap(i == null ? void 0 : i.id)) != null && S.stickyVariantPanel ? window.addEventListener("pointerdown", (A) => {
        if (!(A.target instanceof Node)) return;
        let E = s.contains(A.target);
        A.target === s || E || (Hr(), e == null || e());
      }, { signal: u }) : (window.addEventListener("pointercancel", () => {
        Hr(), e == null || e();
      }, { signal: u }), window.addEventListener("pointerup", () => {
        Hr(), e == null || e();
      }, { signal: u }));
    });
  }
}
function Hr() {
  vn == null || vn.abort(), vn = null, Te.state === "open" && Te.close();
}
function jg(t38) {
  if (t38 === "foreground-color") {
    let e = [];
    for (let r of Object.keys(er)) e.push({ class: "swatch-button", label: '<span style="border: 3px solid ' + er[r] + '"></span>', command: ["applyStyle", { color: r }] });
    return e;
  }
  if (t38 === "background-color") {
    let e = [];
    for (let r of Object.keys(Qt)) e.push({ class: "swatch-button", label: '<span style="background:' + Qt[r] + '"></span>', command: ["applyStyle", { backgroundColor: r }] });
    return e;
  }
}
function ps(t38) {
  return ms[t38] !== void 0;
}
function Jg(t38) {
  var e;
  return typeof t38 != "string" ? t38 : (ms[t38] || (ms[t38] = (e = jg(t38)) != null ? e : []), ms[t38]);
}
function Xg(t38) {
  return typeof t38 == "string" ? t38 : Object.entries(t38).map(([e, r]) => `${e}:${r} !important`).join(";");
}
function Zg(t38) {
  return Object.keys(t38).map((e) => `${e} {${Xg(t38[e])}}`).join("");
}
function bo(t38) {
  if (!t38) return "";
  let e = new P(), r = new x({ mode: "math", type: "root", body: be(t38, { context: e, args: (n) => n === "@" ? "{\\class{ML__box-placeholder}{\\blacksquare}}" : "\\placeholder{}" }) }), i = Or(qt(new w(r.render(e), { classes: "ML__base" }), e));
  return Br(i, { classes: "ML__latex" }).toMarkup();
}
function gs(t38) {
  return t38.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function Yg(t38) {
  return t38.replace(/<\/?[^>]+(>|$)/g, " ");
}
function Qg(t38) {
  var i, n, o, a;
  let e = (a = (o = (n = (i = t38.tooltip) != null ? i : typeof t38.label == "string" ? Yg(t38.label) : void 0) != null ? n : t38.insert) != null ? o : t38.latex) != null ? a : t38.key;
  return e && e.replace(/\s+/g, " ").trim() || null;
}
function eb(t38) {
  if (typeof t38 == "undefined" || t38 === null) return null;
  try {
    return JSON.stringify(t38);
  } catch (e) {
    return null;
  }
}
function tb(t38) {
  var r, i;
  let e = (i = (r = t38.insert) != null ? r : t38.latex) != null ? i : t38.key;
  return e != null ? e : null;
}
function yo(t38) {
  if (Array.isArray(t38)) return t38.map((i) => yo(i)).flat();
  let e = typeof t38 == "string" ? { markup: t38 } : t38;
  return "rows" in e && Array.isArray(e.rows) && (e.rows = e.rows.map((i) => i.map((n) => go(n)))), e.id != null || (e.id = "ML__layer_" + Date.now().toString(36).slice(-2) + Math.floor(Math.random() * 1e5).toString(36)), [e];
}
function rb() {
  var o, a;
  let e = window.mathVirtualKeyboard.alphabeticLayout;
  if (e === "auto") {
    let s = yr();
    s && (e = s.virtualLayout), (!e || e === "auto") && (e = (o = { fr: "azerty", be: "azerty", al: "qwertz", ba: "qwertz", cz: "qwertz", de: "qwertz", hu: "qwertz", sk: "qwertz", ch: "qwertz" }[F.locale.slice(0, 2)]) != null ? o : "qwerty");
  }
  let r = { qwerty: ["qwertyuiop", " asdfghjkl ", "^zxcvbnm~"], azerty: ["azertyuiop", "qsdfghjklm", "^ wxcvbn ~"], qwertz: ["qwertzuiop", " asdfghjkl ", "^yxcvbnm~"], dvorak: ["^  pyfgcrl ", "aoeuidhtns", "qjkxbmwvz~"], colemak: [" qwfpgjluy ", "arstdhneio", "^zxcvbkm~"] }, i = (a = r[e]) != null ? a : r.qwerty, n = e === "azerty" ? [[{ label: "1", variants: "1" }, { label: "2", shift: { latex: "é" }, variants: "2" }, { label: "3", shift: { latex: "ù" }, variants: "3" }, { label: "4", variants: "4" }, { label: "5", shift: { label: "(", latex: "(" }, variants: "5" }, { label: "6", shift: { label: ")", latex: ")" }, variants: "6" }, { label: "7", shift: { latex: "è" }, variants: "7" }, { label: "8", shift: { latex: "ê" }, variants: "8" }, { label: "9", shift: { latex: "ç" }, variants: "9" }, { label: "0", shift: { latex: "à" }, variants: "0" }]] : [[{ label: "1", variants: "1" }, { label: "2", variants: "2" }, { label: "3", variants: "3" }, { label: "4", variants: "4" }, { label: "5", shift: { latex: "\\frac{#@}{#?}" }, variants: "5" }, { label: "6", shift: { latex: "#@^#?" }, variants: "6" }, { label: "7", variants: "7" }, { label: "8", shift: { latex: "\\times" }, variants: "8" }, { label: "9", shift: { label: "(", latex: "(" }, variants: "9" }, { label: "0", shift: { label: ")", latex: ")" }, variants: "0" }]];
  for (let s of i) {
    let l = [];
    for (let c of s) /[a-z]/.test(c) ? l.push({ label: c, class: "hide-shift", shift: { label: c.toUpperCase(), variants: ps(c.toUpperCase()) ? c.toUpperCase() : void 0 }, variants: ps(c) ? c : void 0 }) : c === "~" ? e !== "dvorak" ? l.push("[backspace]") : l.push({ label: "[backspace]", width: 1 }) : c === "^" ? l.push("[shift]") : c === " " && l.push("[separator-5]");
    n.push(l);
  }
  return n.push(["[-]", "[+]", "[=]", { label: " ", width: 1.5 }, { label: ",", shift: ";", variants: ".", class: "hide-shift" }, "[.]", "[left]", "[right]", { label: "[action]", width: 1.5 }]), { label: "abc", labelClass: "MLK__tex-math", tooltip: "keyboard.tooltip.alphabetic", layers: yo({ rows: n }) };
}
function Lc(t38) {
  if (t38 === "alphabetic") return rb();
  if (typeof t38 == "string") return Lc(kc[t38]);
  let e;
  if ("rows" in t38 && Array.isArray(t38.rows)) {
    let n = t38, { rows: a } = n, s = Ti(n, ["rows"]);
    e = g(h({}, s), { layers: yo({ rows: t38.rows }) });
  } else if ("markup" in t38 && typeof t38.markup == "string") {
    let o = t38, { markup: a } = o, s = Ti(o, ["markup"]);
    e = g(h({}, s), { layers: yo(t38.markup) });
  } else e = h({}, t38), "layers" in t38 ? e.layers = yo(t38.layers) : console.error('MathLive 0.111.1: provide either a "rows", "markup" or "layers" property');
  let r = false, i = false;
  for (let a of e.layers) if (a.rows) for (let s of a.rows.flat()) {
    Mn(s) && (r = true);
    let l = s.command;
    typeof l == "string" && ["undo", "redo", "cut", "copy", "paste"].includes(l) && (i = true);
  }
  return (!("displayShiftedKeycaps" in t38) || t38.displayShiftedKeycaps === void 0) && (e.displayShiftedKeycaps = r), (!("displayEditToolbar" in t38) || t38.displayEditToolbar === void 0) && (e.displayEditToolbar = !i), e;
}
function ib(t38, e) {
  var i, n;
  let r = '<div class="left">';
  if (t38.normalizedLayouts.length > 1) for (let [o, a] of t38.normalizedLayouts.entries()) {
    let s = a, l = [o === e ? "selected" : "layer-switch"];
    s.tooltip && l.push("MLK__tooltip"), s.labelClass && l.push(...s.labelClass.split(" ")), r += `<div class="${l.join(" ")}"`, s.tooltip && (r += " data-tooltip='" + ((i = $(s.tooltip)) != null ? i : s.tooltip) + "' "), o !== e && (r += `data-layer="${s.layers[0].id}"`), r += `>${(n = s.label) != null ? n : "untitled"}</div>`;
  }
  return r += "</div>", r;
}
function $h(t38, e) {
  let r = "";
  if (t38.editToolbar === "none") return "";
  let n = [];
  e.selectionIsCollapsed ? n.push("undo", "redo", "pasteFromClipboard") : n.push("cutToClipboard", "copyToClipboard", "pasteFromClipboard");
  let o = { undo: `<div class='action ${e.canUndo === false ? "disabled" : ""}'
          data-command='"undo"'
          data-tooltip='${$("tooltip.undo")}'>
          <svg><use xlink:href='#svg-undo' /></svg>
      </div>`, redo: `<div class='action ${e.canRedo === false ? "disabled" : ""}'
          data-command='"redo"'
          data-tooltip='${$("tooltip.redo")}'>
          <svg><use xlink:href='#svg-redo' /></svg>
      </div>`, cutToClipboard: `
        <div class='action'
            data-command='"cutToClipboard"'
            data-tooltip='${$("tooltip.cut to clipboard")}'>
            <svg><use xlink:href='#svg-cut' /></svg>
        </div>
    `, copyToClipboard: `
        <div class='action'
            data-command='"copyToClipboard"'
            data-tooltip='${$("tooltip.copy to clipboard")}'>
            <svg><use xlink:href='#svg-copy' /></svg>
        </div>
    `, pasteFromClipboard: `
        <div class='action'
            data-command='"pasteFromClipboard"'
            data-tooltip='${$("tooltip.paste from clipboard")}'>
            <svg><use xlink:href='#svg-paste' /></svg>
        </div>
    ` };
  return r += n.map((a) => o[a]).join(""), r;
}
function nb(t38) {
  for (let e of t38) ob(e);
}
function ob(t38) {
  let e = Fe.singleton;
  if (!e) return;
  let r = {};
  if (!t38.id) {
    if (t38.hasAttribute("data-label") && (r.label = t38.dataset.label), t38.hasAttribute("data-latex") && (r.latex = t38.dataset.latex), t38.hasAttribute("data-key") && (r.key = t38.dataset.key), t38.hasAttribute("data-insert") && (r.insert = t38.dataset.insert), t38.hasAttribute("data-variants") && (r.variants = t38.dataset.variants), t38.hasAttribute("data-aside") && (r.aside = t38.dataset.aside), t38.className && (r.class = t38.className), !r.label && !r.latex && !r.key && !r.insert && (r.latex = t38.innerText, r.label = t38.innerHTML), t38.hasAttribute("data-command")) try {
      r.command = JSON.parse(t38.dataset.command);
    } catch (i) {
      console.warn("Invalid JSON in data-command attribute", i);
    }
    t38.id = e.registerKeycap(r);
  }
  if (!t38.innerHTML) {
    let [i] = _n(r);
    t38.innerHTML = globalThis.MathfieldElement.createHTML(i);
  }
}
function ab() {
  Ge("virtual-keyboard"), Ge("core"), hr();
}
function Vh() {
  ot("core"), ot("virtual-keyboard");
}
var sb = `<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">

<symbol id="svg-delete-backward" viewBox="0 0 576 512">
  <path d="M432.1 208.1L385.9 256L432.1 303C442.3 312.4 442.3 327.6 432.1 336.1C423.6 346.3 408.4 346.3 399 336.1L352 289.9L304.1 336.1C295.6 346.3 280.4 346.3 271 336.1C261.7 327.6 261.7 312.4 271 303L318.1 256L271 208.1C261.7 199.6 261.7 184.4 271 175C280.4 165.7 295.6 165.7 304.1 175L352 222.1L399 175C408.4 165.7 423.6 165.7 432.1 175C442.3 184.4 442.3 199.6 432.1 208.1V208.1zM512 64C547.3 64 576 92.65 576 128V384C576 419.3 547.3 448 512 448H205.3C188.3 448 172 441.3 160 429.3L9.372 278.6C3.371 272.6 0 264.5 0 256C0 247.5 3.372 239.4 9.372 233.4L160 82.75C172 70.74 188.3 64 205.3 64L512 64zM528 128C528 119.2 520.8 112 512 112H205.3C201 112 196.9 113.7 193.9 116.7L54.63 256L193.9 395.3C196.9 398.3 201 400 205.3 400H512C520.8 400 528 392.8 528 384V128z"/>
</symbol>

<symbol id="svg-shift" viewBox="0 0 384 512">
  <path d="M2.438 252.3C7.391 264.2 19.06 272 32 272h80v160c0 26.51 21.49 48 48 48h64C250.5 480 272 458.5 272 432v-160H352c12.94 0 24.61-7.797 29.56-19.75c4.953-11.97 2.219-25.72-6.938-34.88l-160-176C208.4 35.13 200.2 32 192 32S175.6 35.13 169.4 41.38l-160 176C.2188 226.5-2.516 240.3 2.438 252.3zM192 86.63L313.4 224H224v208H160V224H70.63L192 86.63z"/>
</symbol>

<symbol id="svg-commit" viewBox="0 0 512 512">
  <path d="M135 432.1l-128-128C2.344 300.3 0 294.2 0 288s2.344-12.28 7.031-16.97l128-128c9.375-9.375 24.56-9.375 33.94 0s9.375 24.56 0 33.94L81.94 264H464v-208C464 42.75 474.8 32 488 32S512 42.75 512 56V288c0 13.25-10.75 24-24 24H81.94l87.03 87.03c9.375 9.375 9.375 24.56 0 33.94S144.4 442.3 135 432.1z"/>
</symbol>


<symbol id="circle-plus" viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344c0 13.3 10.7 24 24 24s24-10.7 24-24V280h64c13.3 0 24-10.7 24-24s-10.7-24-24-24H280V168c0-13.3-10.7-24-24-24s-24 10.7-24 24v64H168c-13.3 0-24 10.7-24 24s10.7 24 24 24h64v64z"/></symbol>

<symbol id="svg-command" viewBox="0 0 640 512">
  <path d="M34.495 36.465l211.051 211.05c4.686 4.686 4.686 12.284 0 16.971L34.495 475.535c-4.686 4.686-12.284 4.686-16.97 0l-7.071-7.07c-4.686-4.686-4.686-12.284 0-16.971L205.947 256 10.454 60.506c-4.686-4.686-4.686-12.284 0-16.971l7.071-7.07c4.686-4.687 12.284-4.687 16.97 0zM640 468v-10c0-6.627-5.373-12-12-12H300c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h328c6.627 0 12-5.373 12-12z"/>
</symbol>

<symbol id="svg-undo" viewBox="0 0 512 512">
  <path d="M20 8h10c6.627 0 12 5.373 12 12v110.625C85.196 57.047 165.239 7.715 256.793 8.001 393.18 8.428 504.213 120.009 504 256.396 503.786 393.181 392.834 504 256 504c-63.926 0-122.202-24.187-166.178-63.908-5.113-4.618-5.354-12.561-.482-17.433l7.069-7.069c4.503-4.503 11.749-4.714 16.482-.454C150.782 449.238 200.935 470 256 470c117.744 0 214-95.331 214-214 0-117.744-95.331-214-214-214-82.862 0-154.737 47.077-190.289 116H180c6.627 0 12 5.373 12 12v10c0 6.627-5.373 12-12 12H20c-6.627 0-12-5.373-12-12V20c0-6.627 5.373-12 12-12z"/>
</symbol>
<symbol id="svg-redo" viewBox="0 0 512 512">
  <path d="M492 8h-10c-6.627 0-12 5.373-12 12v110.625C426.804 57.047 346.761 7.715 255.207 8.001 118.82 8.428 7.787 120.009 8 256.396 8.214 393.181 119.166 504 256 504c63.926 0 122.202-24.187 166.178-63.908 5.113-4.618 5.354-12.561.482-17.433l-7.069-7.069c-4.503-4.503-11.749-4.714-16.482-.454C361.218 449.238 311.065 470 256 470c-117.744 0-214-95.331-214-214 0-117.744 95.331-214 214-214 82.862 0 154.737 47.077 190.289 116H332c-6.627 0-12 5.373-12 12v10c0 6.627 5.373 12 12 12h160c6.627 0 12-5.373 12-12V20c0-6.627-5.373-12-12-12z"/>
</symbol>
<symbol id="svg-arrow-left" viewBox="0 0 320 512">
  <path d="M206.7 464.6l-183.1-191.1C18.22 267.1 16 261.1 16 256s2.219-11.97 6.688-16.59l183.1-191.1c9.152-9.594 24.34-9.906 33.9-.7187c9.625 9.125 9.938 24.37 .7187 33.91L73.24 256l168 175.4c9.219 9.5 8.906 24.78-.7187 33.91C231 474.5 215.8 474.2 206.7 464.6z"/>
</symbol>
<symbol id="svg-arrow-right" viewBox="0 0 320 512">
  <path d="M113.3 47.41l183.1 191.1c4.469 4.625 6.688 10.62 6.688 16.59s-2.219 11.97-6.688 16.59l-183.1 191.1c-9.152 9.594-24.34 9.906-33.9 .7187c-9.625-9.125-9.938-24.38-.7187-33.91l168-175.4L78.71 80.6c-9.219-9.5-8.906-24.78 .7187-33.91C88.99 37.5 104.2 37.82 113.3 47.41z"/>
</symbol>
<symbol id="svg-tab" viewBox="0 0 448 512">
  <path d="M32 217.1c0-8.8 7.2-16 16-16h144v-93.9c0-7.1 8.6-10.7 13.6-5.7l143.5 143.1c6.3 6.3 6.3 16.4 0 22.7L205.6 410.4c-5 5-13.6 1.5-13.6-5.7v-93.9H48c-8.8 0-16-7.2-16-16v-77.7m-32 0v77.7c0 26.5 21.5 48 48 48h112v61.9c0 35.5 43 53.5 68.2 28.3l143.6-143c18.8-18.8 18.8-49.2 0-68L228.2 78.9c-25.1-25.1-68.2-7.3-68.2 28.3v61.9H48c-26.5 0-48 21.6-48 48zM436 64h-8c-6.6 0-12 5.4-12 12v360c0 6.6 5.4 12 12 12h8c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12z"/>
</symbol>
<symbol id="svg-paste" viewBox="0 0 512 512"><path d="M160 32c11.6 0 21.3 8.2 23.5 19.2C185 58.6 191.6 64 199.2 64H208c8.8 0 16 7.2 16 16V96H96V80c0-8.8 7.2-16 16-16h8.8c7.6 0 14.2-5.4 15.7-12.8C138.7 40.2 148.4 32 160 32zM64 64h2.7C65 69 64 74.4 64 80V96c0 17.7 14.3 32 32 32H224c17.7 0 32-14.3 32-32V80c0-5.6-1-11-2.7-16H256c17.7 0 32 14.3 32 32h32c0-35.3-28.7-64-64-64H210.6c-9-18.9-28.3-32-50.6-32s-41.6 13.1-50.6 32H64C28.7 32 0 60.7 0 96V384c0 35.3 28.7 64 64 64H192V416H64c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32zM288 480c-17.7 0-32-14.3-32-32V192c0-17.7 14.3-32 32-32h96v56c0 22.1 17.9 40 40 40h56V448c0 17.7-14.3 32-32 32H288zM416 165.3L474.7 224H424c-4.4 0-8-3.6-8-8V165.3zM448 512c35.3 0 64-28.7 64-64V235.9c0-12.7-5.1-24.9-14.1-33.9l-59.9-59.9c-9-9-21.2-14.1-33.9-14.1H288c-35.3 0-64 28.7-64 64V448c0 35.3 28.7 64 64 64H448z"/></symbol>
<symbol id="svg-cut" viewBox="0 0 512 512"><path d="M485.6 444.2L333.6 314.9C326.9 309.2 326.1 299.1 331.8 292.4C337.5 285.6 347.6 284.8 354.4 290.5L506.4 419.8C513.1 425.5 513.9 435.6 508.2 442.4C502.5 449.1 492.4 449.9 485.6 444.2zM485.7 67.76C492.5 62.07 502.5 62.94 508.2 69.69C513.9 76.45 513.1 86.55 506.3 92.24L208.5 343.1C218.3 359.7 224 379.2 224 400C224 461.9 173.9 512 112 512C50.14 512 0 461.9 0 400C0 338.1 50.14 288 112 288C141.5 288 168.4 299.4 188.4 318.1L262.2 256L188.4 193.9C168.4 212.6 141.5 224 112 224C50.14 224 0 173.9 0 112C0 50.14 50.14 0 112 0C173.9 0 224 50.14 224 112C224 132.8 218.3 152.3 208.5 168.9L287 235.1L485.7 67.76zM32 112C32 156.2 67.82 192 112 192C156.2 192 192 156.2 192 112C192 67.82 156.2 32 112 32C67.82 32 32 67.82 32 112zM112 480C156.2 480 192 444.2 192 400C192 355.8 156.2 320 112 320C67.82 320 32 355.8 32 400C32 444.2 67.82 480 112 480z"/></symbol>
<symbol id="svg-copy" viewBox="0 0 512 512"><path d="M272 416C263.2 416 256 423.2 256 432V448c0 17.67-14.33 32-32 32H64c-17.67 0-32-14.33-32-32V192c0-17.67 14.33-32 32-32h112C184.8 160 192 152.8 192 144C192 135.2 184.8 128 176 128H63.99c-35.35 0-64 28.65-64 64l.0098 256C0 483.3 28.65 512 64 512h160c35.35 0 64-28.65 64-64v-16C288 423.2 280.8 416 272 416zM502.6 86.63l-77.25-77.25C419.4 3.371 411.2 0 402.7 0H288C252.7 0 224 28.65 224 64v256c0 35.35 28.65 64 64 64h160c35.35 0 64-28.65 64-64V109.3C512 100.8 508.6 92.63 502.6 86.63zM416 45.25L466.7 96H416V45.25zM480 320c0 17.67-14.33 32-32 32h-160c-17.67 0-32-14.33-32-32V64c0-17.67 14.33-32 32-32h96l.0026 64c0 17.67 14.33 32 32 32H480V320z"/>
</symbol>
<symbol id="svg-angle-double-right" viewBox="0 0 512 512"><path d="M470.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 256 265.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160zm-352 160l160-160c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L210.7 256 73.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0z"/>
</symbol>
<symbol id="svg-angle-double-left" viewBox="0 0 512 512"><path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160zm352-160l-160 160c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L301.3 256 438.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0z"/>
</symbol>
<symbol id="svg-trash" viewBox="0 0 448 512">
  <path d="M336 64l-33.6-44.8C293.3 7.1 279.1 0 264 0h-80c-15.1 0-29.3 7.1-38.4 19.2L112 64H24C10.7 64 0 74.7 0 88v2c0 3.3 2.7 6 6 6h26v368c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V96h26c3.3 0 6-2.7 6-6v-2c0-13.3-10.7-24-24-24h-88zM184 32h80c5 0 9.8 2.4 12.8 6.4L296 64H152l19.2-25.6c3-4 7.8-6.4 12.8-6.4zm200 432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V96h320v368zm-176-44V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm-80 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm160 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12z"/>
</symbol>
<symbol id="svg-keyboard-down" viewBox="0 0 576 512"><path d="M64 48c-8.8 0-16 7.2-16 16V240c0 8.8 7.2 16 16 16H512c8.8 0 16-7.2 16-16V64c0-8.8-7.2-16-16-16H64zM0 64C0 28.7 28.7 0 64 0H512c35.3 0 64 28.7 64 64V240c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zM159 359c9.4-9.4 24.6-9.4 33.9 0l95 95 95-95c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9L305 505c-4.5 4.5-10.6 7-17 7s-12.5-2.5-17-7L159 393c-9.4-9.4-9.4-24.6 0-33.9zm1-167c0-8.8 7.2-16 16-16H400c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V192zM120 88h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H120c-8.8 0-16-7.2-16-16V104c0-8.8 7.2-16 16-16zm64 16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H200c-8.8 0-16-7.2-16-16V104zm96-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H280c-8.8 0-16-7.2-16-16V104c0-8.8 7.2-16 16-16zm64 16c0-8.8 7.2-16 16-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H360c-8.8 0-16-7.2-16-16V104zm96-16h16c8.8 0 16 7.2 16 16v16c0 8.8-7.2 16-16 16H440c-8.8 0-16-7.2-16-16V104c0-8.8 7.2-16 16-16z"/></symbol>
</svg>`;
function qh(t38) {
  t38.resetKeycapRegistry(), ab();
  let e = document.createElement("div");
  e.className = "ML__keyboard";
  let r = document.createElement("div");
  r.className = "MLK__plate", r.innerHTML = globalThis.MathfieldElement.createHTML(sb + t38.normalizedLayouts.map((a, s) => lb(t38, a, s)).join(""));
  let i = document.createElement("div");
  i.className = "MLK__backdrop", i.appendChild(r), e.appendChild(i), e.addEventListener("pointerdown", ub, { passive: false });
  let n = e.querySelectorAll(".ML__edit-toolbar");
  if (n) for (let a of n) a.addEventListener("click", (s) => {
    var u, d;
    let l = s.target, c = "";
    for (; l && !c; ) c = (u = l == null ? void 0 : l.getAttribute("data-command")) != null ? u : "", l = (d = l == null ? void 0 : l.parentElement) != null ? d : null;
    c && t38.executeCommand(JSON.parse(c));
  });
  nb(e.querySelectorAll(".MLK__keycap, .action, .fnbutton, .bigfnbutton"));
  let o = e.querySelectorAll(".MLK__layer");
  o.length > 0;
  for (let a of o) a.addEventListener("pointerdown", (s) => s.preventDefault());
  return t38.currentLayer = t38.latentLayer, e;
}
function lb(t38, e, r) {
  var n;
  let i = [];
  if (!("layers" in e)) return "";
  for (let o of e.layers) i.push(`<div tabindex="-1" class="MLK__layer" id="${o.id}">`), (t38.normalizedLayouts.length > 1 || e.displayEditToolbar) && (i.push("<div class='MLK__toolbar' role='toolbar'>"), i.push(ib(t38, r)), ((n = e.displayEditToolbar) == null || n) && i.push('<div class="ML__edit-toolbar right"></div>'), i.push("</div>")), i.push(cb(t38, o)), i.push("</div>");
  return i.join("");
}
function cb(t38, e) {
  if (typeof e == "string") return e;
  let r = "";
  if (typeof e.style == "string" ? r += `<style>${e.style}</style>` : typeof e.style == "object" && (r += `<style>${Zg(e.style)}</style>`), e.backdrop && (r += `<div class='${e.backdrop}'>`), e.container && (r += `<div class='${e.container}'>`), e.rows) {
    r += "<div class=MLK__rows>";
    for (let i of e.rows) {
      r += '<div dir="ltr" class=MLK__row>';
      for (let n of i) if (n) {
        let o = t38.registerKeycap(n), [a, s] = _n(n);
        /(^|\s)separator/.test(s) ? r += `<div class="${s}"` : r += `<div tabindex="-1" id="${o}" class="${s}"`, n.tooltip && (r += ` data-tooltip="${gs(n.tooltip)}"`);
        let l = Qg(n);
        l && (r += ` aria-label="${gs(l)}"`);
        let c = eb(n.command);
        c && (r += ` data-command="${gs(c)}"`);
        let u = tb(n);
        u && (r += ` data-keycap-value="${gs(u)}"`), r += `>${a}</div>`;
      }
      r += "</div>";
    }
    r += "</div>";
  } else e.markup && (r += e.markup);
  return e.container && (r += "</div>"), e.backdrop && (r += "</div>"), r;
}
function _n(t38, e = { shifted: false }) {
  var n, o, a, s, l, c, u;
  let r = "", i = (n = t38.class) != null ? n : "";
  if (e.shifted && Mn(t38) && (i += " is-active"), e.shifted && "shift" in t38) typeof t38.shift == "string" ? r = bo(t38.shift) : typeof t38.shift == "object" && (r = t38.shift.label ? t38.shift.label : (o = bo(t38.shift.latex || t38.shift.insert || "") || t38.shift.key) != null ? o : ""), typeof t38.shift == "object" && (i = (s = (a = t38.shift.class) != null ? a : t38.class) != null ? s : "");
  else {
    if (r = t38.label ? t38.label : (l = bo(t38.latex || t38.insert || "") || t38.key) != null ? l : "", t38.shift) {
      let d;
      typeof t38.shift == "string" ? d = bo(t38.shift) : t38.shift.label ? d = t38.shift.label : d = (c = bo(t38.shift.latex || t38.shift.insert || "") || t38.shift.key) != null ? c : "", r += `<span class="MLK__shift">${d}</span>`;
    }
    t38.aside && (r += `<aside>${t38.aside}</aside>`);
  }
  return t38.layer && !/layer-switch/.test(i) && (i += " layer-switch"), /(^|\s)(separator|action|shift|fnbutton|bigfnbutton)($|\s)/.test(i) || (i += " MLK__keycap"), !/\bw[0-9]+\b/.test(i) && t38.width && (i += (u = { 0: " w0", 0.5: " w5", 1.5: " w15", 2: " w20", 5: " w50" }[t38.width]) != null ? u : ""), [r, i || "MLK__keycap"];
}
var Gt = { "[left]": { class: "action hide-shift", label: "<svg class=svg-glyph><use xlink:href=#svg-arrow-left /></svg>", command: "performWithFeedback(moveToPreviousChar)", shift: { label: "<svg class=svg-glyph><use xlink:href=#svg-angle-double-left /></svg>", command: "performWithFeedback(extendSelectionBackward)" } }, "[right]": { class: "action hide-shift", label: "<svg class=svg-glyph><use xlink:href=#svg-arrow-right /></svg>", command: "performWithFeedback(moveToNextChar)", shift: { label: "<svg class=svg-glyph><use xlink:href=#svg-angle-double-right /></svg>", command: "performWithFeedback(extendSelectionForward)" } }, "[up]": { class: "action hide-shift", label: "↑", command: "performWithFeedback(moveUp)", shift: { label: "↟", command: "performWithFeedback(extendSelectionUpward)" } }, "[down]": { class: "action hide-shift", label: "↓", command: "performWithFeedback(moveDown)", shift: { label: "↡", command: "performWithFeedback(extendSelectionDownward)" } }, "[return]": { class: "action hide-shift", command: "performWithFeedback(commit)", shift: { command: "performWithFeedback(addRowAfter)" }, width: 1.5, label: "<svg class=svg-glyph><use xlink:href=#svg-commit /></svg>" }, "[action]": { class: "action hide-shift", command: "performWithFeedback(commit)", shift: { label: "<svg class=svg-glyph><use xlink:href=#circle-plus /></svg>", command: "performWithFeedback(addRowAfter)" }, width: 1.5, label: "<svg class=svg-glyph><use xlink:href=#svg-commit /></svg>" }, "[hr]": { class: "separator horizontal-rule" }, "[hide-keyboard]": { class: "action", command: ["hideVirtualKeyboard"], width: 1.5, label: "<svg class=svg-glyph-lg><use xlink:href=#svg-keyboard-down /></svg>" }, "[.]": { variants: ".", command: "performWithFeedback(insertDecimalSeparator)", shift: ",", class: "big-op hide-shift", label: "." }, "[,]": { variants: ",", command: "performWithFeedback(insertDecimalSeparator)", shift: ".", class: "big-op hide-shift", label: "," }, "[+]": { variants: [{ latex: "\\sum_{#0}^{#0}", class: "small" }, "\\oplus"], latex: "+", label: "+", class: "big-op hide-shift", shift: { latex: "\\sum", insert: "\\sum", class: "small" } }, "[-]": { variants: ["\\pm", "\\ominus"], latex: "-", label: "&#x2212;", shift: "\\pm", class: "big-op hide-shift" }, "[/]": { class: "big-op hide-shift", shift: { class: "", latex: "\\frac{1}{#@}" }, variants: ["/", "\\div", "\\%", "\\oslash"], latex: "\\frac{#@}{#?}", label: "&divide;" }, "[*]": { variants: [{ latex: "\\prod_{#0}^{#0}", class: "small" }, "\\otimes", "\\cdot"], latex: "\\cdot", label: "&times;", shift: { latex: "\\times" }, class: "big-op hide-shift" }, "[=]": { variants: ["\\neq", "\\equiv", "\\varpropto", "\\thickapprox", "\\lt", "\\gt", "\\le", "\\ge"], latex: "=", label: "=", shift: { label: "≠", latex: "\\ne" }, class: "big-op hide-shift" }, "[backspace]": { class: "action bottom right hide-shift", width: 1.5, command: "performWithFeedback(deleteBackward)", label: "<svg class=svg-glyph><use xlink:href=#svg-delete-backward /></svg>", shift: { class: "action warning", label: "<svg class=svg-glyph><use xlink:href=#svg-trash /></svg>", command: "deleteAll" } }, "[undo]": { class: "ghost if-can-undo", command: "undo", label: "<svg class=svg-glyph><use xlink:href=#svg-undo /></svg>", tooltip: "tooltip.undo" }, "[redo]": { class: "ghost  if-can-redo", command: "redo", label: "<svg class=svg-glyph><use xlink:href=#svg-redo /></svg>", tooltip: "tooltip.redo" }, "[(]": { variants: [{ latex: "\\lbrack", key: "[" }, "\\langle", "\\lfloor", "\\lceil", { latex: "\\lbrace", key: "{" }], key: "(", label: "(", shift: { label: "[", key: "[" }, class: "hide-shift" }, "[)]": { variants: [{ latex: "\\rbrack", key: "]" }, "\\rangle", "\\rfloor", "\\rceil", { latex: "\\rbrace", key: "}" }], key: ")", label: ")", shift: { label: "]", latex: "\\rbrack" }, class: "hide-shift" }, "[0]": { variants: "0", latex: "0", label: "0", shift: "\\infty", class: "hide-shift" }, "[1]": { variants: "1", latex: "1", label: "1", shift: "#@^{-1}", class: "hide-shift" }, "[2]": { variants: "2", latex: "2", label: "2", shift: "#@^2", class: "hide-shift" }, "[3]": { variants: "3", latex: "3", label: "3", shift: "#@^3", class: "hide-shift" }, "[4]": { variants: "4", latex: "4", label: "4", shift: "#@^4", class: "hide-shift" }, "[5]": { variants: "5", latex: "5", label: "5", shift: "#@^5", class: "hide-shift" }, "[6]": { variants: "6", latex: "6", label: "6", shift: "#@^6", class: "hide-shift" }, "[7]": { variants: "7", latex: "7", label: "7", shift: "#@^7", class: "hide-shift" }, "[8]": { variants: "8", latex: "8", label: "8", shift: "#@^8", class: "hide-shift" }, "[9]": { variants: "9", latex: "9", label: "9", shift: "#@^9", class: "hide-shift" }, "[separator-5]": { class: "separator", width: 0.5 }, "[separator]": { class: "separator" }, "[separator-10]": { class: "separator" }, "[separator-15]": { class: "separator", width: 1.5 }, "[separator-20]": { class: "separator", width: 2 }, "[separator-50]": { class: "separator", width: 5 }, "[shift]": { class: "shift bottom left", width: 1.5, label: "<span class=caps-lock-indicator></span><svg class=svg-glyph><use xlink:href=#svg-shift /></svg>" }, "[foreground-color]": { variants: "foreground-color", command: ["applyStyle", { color: "red" }], label: "<span style='border-radius: 50%;width:22px;height:22px; border: 3px solid #cc2428; box-sizing: border-box'>" }, "[background-color]": { variants: "background-color", command: ["applyStyle", { backgroundColor: "yellow" }], label: "<span style='border-radius: 50%;width:22px;height:22px; background:#fff590; box-sizing: border-box'></span>" } };
function go(t38) {
  var r;
  if (typeof t38 == "string") {
    if (t38 === "[.]" && globalThis.MathfieldElement.decimalSeparator === "," && (t38 = "[,]"), !Gt[t38]) return { latex: t38 };
    t38 = { label: t38 };
  }
  let e;
  return "label" in t38 && t38.label && Gt[t38.label] && (e = g(h(h({}, Gt[t38.label]), t38), { label: Gt[t38.label].label })), "key" in t38 && t38.key && Gt[t38.key] && (e = g(h(h({}, Gt[t38.key]), t38), { key: Gt[t38.key].key })), e ? (e.command === "insertDecimalSeparator" && (e.label = (r = globalThis.MathfieldElement.decimalSeparator) != null ? r : "."), (e.tooltip === void 0 || e.tooltip === null || e.tooltip === false) && delete e.tooltip, (e.tooltip === void 0 || e.tooltip === null || e.tooltip === false) && delete e.tooltip, (e.aside === void 0 || e.aside === null || e.aside === false) && delete e.aside, (e.variants === void 0 || e.variants === null || e.variants === false) && delete e.variants, (e.shift === void 0 || e.shift === null || e.shift === false) && delete e.shift, e) : t38;
}
var xo;
function ub(t38) {
  var l, c, u, d;
  if (t38.button !== 0) return;
  let e = Fe.singleton;
  if (!e) return;
  let r = t38.target;
  for (; r && !r.getAttribute("data-layer"); ) r = r.parentElement;
  if (r) {
    e.currentLayer = (l = r.getAttribute("data-layer")) != null ? l : "", t38.preventDefault();
    return;
  }
  let i = Mi(t38.target);
  if (!(i != null && i.id)) return;
  let n = e.getKeycap(i.id);
  if (!n) return;
  t38.type;
  let o = e;
  if (!o.connectedMathfieldWindow) {
    let m = (c = window.focusedMathfield) == null ? void 0 : c.call(window);
    if (m) {
      let p = (d = (u = m.element) == null ? void 0 : u.ownerDocument) == null ? void 0 : d.defaultView;
      p && p !== window && (o.connectedMathfieldWindow = p);
    }
  }
  let a = new AbortController(), s = a.signal;
  i.classList.add("is-pressed"), i.addEventListener("pointerenter", bs(a), { capture: true, signal: s }), i.addEventListener("pointerleave", bs(a), { capture: true, signal: s }), i.addEventListener("pointercancel", bs(a), { signal: s }), i.addEventListener("pointerup", bs(a), { signal: s }), Mn(n) && (i.classList.add("is-active"), e.shiftPressCount++), n.variants && (xo && clearTimeout(xo), xo = setTimeout(() => {
    i.classList.contains("is-pressed") && (i.classList.remove("is-pressed"), i.classList.add("is-active"), t38.target && "releasePointerCapture" in t38.target && t38.target.releasePointerCapture(t38.pointerId), hs(i, () => {
      a.abort(), i == null || i.classList.remove("is-active");
    }));
  }, n.stickyVariantPanel ? 0 : 300)), t38.preventDefault();
}
function bs(t38) {
  return (e) => {
    let r = Mi(e.target);
    if (!(r != null && r.id)) return;
    let i = Fe.singleton;
    if (!i) return;
    let n = i.getKeycap(r.id);
    if (n) {
      if (e.type === "pointerenter" && e.target === r && e.isPrimary && r.classList.add("is-pressed"), e.type === "pointercancel") {
        r.classList.remove("is-pressed"), Mn(n) && (i.shiftPressCount--, r.classList.toggle("is-active", i.isShifted)), t38.abort();
        return;
      }
      if (e.type === "pointerleave" && e.target === r) {
        r.classList.remove("is-pressed"), Mn(n) && (i.shiftPressCount--, r.classList.toggle("is-active", i.isShifted));
        return;
      }
      if (e.type === "pointerup") {
        xo && clearTimeout(xo), Mn(n) ? r.classList.toggle("is-active", i.isShifted) : r.classList.contains("is-pressed") && (r.classList.remove("is-pressed"), i.isShifted && n.shift ? typeof n.shift == "string" ? i.executeCommand(["insert", n.shift, { focus: true, feedback: true, scrollIntoView: true, mode: "math", format: "latex" }]) : fs(n.shift) : fs(n), i.shiftPressCount === 1 && !e.shiftKey && (i.shiftPressCount = 0)), t38.abort(), e.preventDefault();
        return;
      }
    }
  };
}
function fs(t38) {
  let e = t38.command;
  !e && t38.insert && (e = ["insert", t38.insert, { focus: true, feedback: true, scrollIntoView: true, mode: "math", format: "latex" }]), !e && t38.key && (e = ["typedText", t38.key, { focus: true, feedback: true, simulateKeystroke: true }]), !e && t38.latex && (e = ["insert", t38.latex, { focus: true, feedback: true, scrollIntoView: true, mode: "math", format: "latex" }]), e || (e = ["typedText", t38.label, { focus: true, feedback: true, simulateKeystroke: true }]), Fe.singleton && Fe.singleton.executeCommand(e);
}
function db(t38) {
  if (t38.nodeType !== 1) return false;
  let e = t38.classList;
  return e.contains("MLK__keycap") || e.contains("shift") || e.contains("action") || e.contains("fnbutton") || e.contains("bigfnbutton");
}
function Mi(t38) {
  if (!t38) return;
  let e = t38;
  for (; e && !db(e); ) e = e.parentElement;
  return e != null ? e : void 0;
}
function Mn(t38) {
  return !!t38.class && /(^|\s)shift($|\s)/.test(t38.class);
}
var Fe = class t34 {
  constructor() {
    this.originalContainerBottomPadding = null;
    this.keycapRegistry = {};
    this._shiftPressCount = 0;
    this.isSandbox = false;
    var e;
    this.targetOrigin = window.origin, this.originValidator = "none", this._alphabeticLayout = "auto", this._layouts = Object.freeze(["default"]), this._editToolbar = "default", this._container = void 0, this._visible = false, this._rebuilding = false, this.observer = new ResizeObserver((r) => {
      this.adjustBoundingRect(), this.dispatchEvent(new Event("geometrychange")), this.sendMessage("geometry-changed", { boundingRect: this.boundingRect });
    }), this.listeners = {};
    try {
      (e = window.top) == null || e.addEventListener("message", this);
    } catch (r) {
      window.addEventListener("message", this);
    }
    Fo() && document.addEventListener("focusin", (r) => {
      let i = r.target;
      i != null && i.isConnected && setTimeout(() => {
        let n = Hh();
        n && n.mathVirtualKeyboardPolicy === "auto" && n.hasEditableContent && this.show({ animate: true });
      }, 300);
    }), document.addEventListener("focusout", (r) => {
      r.target instanceof Mt && r.target.mathVirtualKeyboardPolicy !== "manual" && setTimeout(() => {
        Hh() || this.hide();
      }, 300);
    });
  }
  get currentLayer() {
    var e, r, i;
    return (i = (r = (e = this._element) == null ? void 0 : e.querySelector(".MLK__layer.is-visible")) == null ? void 0 : r.id) != null ? i : "";
  }
  set currentLayer(e) {
    var i;
    if (!this._element) {
      this.latentLayer = e;
      return;
    }
    let r = e ? this._element.querySelector(`#${e}.MLK__layer`) : null;
    r || (r = this._element.querySelector(".MLK__layer")), r && ((i = this._element.querySelector(".MLK__layer.is-visible")) == null || i.classList.remove("is-visible"), r.classList.add("is-visible")), this.render();
  }
  get shiftPressCount() {
    return this._shiftPressCount;
  }
  set shiftPressCount(e) {
    var r;
    this._shiftPressCount = e > 2 || e < 0 ? 0 : e, (r = this._element) == null || r.classList.toggle("is-caps-lock", this.shiftPressCount === 2), this.render();
  }
  get isShifted() {
    return this._shiftPressCount > 0;
  }
  resetKeycapRegistry() {
    this.keycapRegistry = {};
  }
  registerKeycap(e) {
    let r = "ML__k" + Date.now().toString(36).slice(-2) + Math.floor(Math.random() * 1e5).toString(36);
    return this.keycapRegistry[r] = e, r;
  }
  setKeycap(e, r) {
    Gt[e] = go(r), this.rebuild();
  }
  getKeycap(e) {
    var r;
    return e ? (r = Gt[e]) != null ? r : this.keycapRegistry[e] : void 0;
  }
  getLayer(e) {
    let r = this.normalizedLayouts;
    for (let i of r) for (let n of i.layers) if (n.id === e) return n;
  }
  get alphabeticLayout() {
    return this._alphabeticLayout;
  }
  set alphabeticLayout(e) {
    this._alphabeticLayout = e, this._normalizedLayouts = void 0, this.rebuild();
  }
  get layouts() {
    return this._layouts;
  }
  set layouts(e) {
    this.updateNormalizedLayouts(e), this.rebuild();
  }
  updateNormalizedLayouts(e) {
    let r = Array.isArray(e) ? [...e] : [e], i = r.findIndex((n) => n === "default");
    i >= 0 && r.splice(i, 1, "numeric", "symbols", "alphabetic", "greek"), this._layouts = Object.freeze(r), this._normalizedLayouts = r.map((n) => Lc(n));
  }
  get normalizedLayouts() {
    return this._normalizedLayouts || this.updateNormalizedLayouts(this._layouts), this._normalizedLayouts;
  }
  get editToolbar() {
    return this._editToolbar;
  }
  set editToolbar(e) {
    this._editToolbar = e, this.rebuild();
  }
  get container() {
    return this._container === void 0 ? window.document.body : this._container;
  }
  set container(e) {
    this._container = e, this.rebuild();
  }
  static get singleton() {
    if (this._singleton === void 0) try {
      this._singleton = new t34();
    } catch (e) {
      this._singleton = null;
    }
    return this._singleton;
  }
  get style() {
    return this._style;
  }
  addEventListener(e, r, i) {
    this.listeners[e] || (this.listeners[e] = /* @__PURE__ */ new Set()), this.listeners[e].has(r) || this.listeners[e].add(r);
  }
  dispatchEvent(e) {
    return !this.listeners[e.type] || this.listeners[e.type].size === 0 ? true : (this.listeners[e.type].forEach((r) => {
      typeof r == "function" ? r(e) : r == null || r.handleEvent(e);
    }), !e.defaultPrevented);
  }
  removeEventListener(e, r, i) {
    this.listeners[e] && this.listeners[e].delete(r);
  }
  get element() {
    return this._element;
  }
  set element(e) {
    var r;
    this._element !== e && ((r = this._element) == null || r.remove(), this._element = e);
  }
  get visible() {
    return this._visible;
  }
  set visible(e) {
    e ? this.show() : this.hide();
  }
  get boundingRect() {
    var r;
    if (!this._visible) return new DOMRect();
    let e = (r = this._element) == null ? void 0 : r.getElementsByClassName("MLK__plate")[0];
    return e ? e.getBoundingClientRect() : new DOMRect();
  }
  adjustBoundingRect() {
    if (!this._element) return;
    let e = this.boundingRect.height;
    if (this.container === document.body) {
      this._element.style.setProperty("--_keyboard-height", `calc(${e}px + var(--_padding-top) + var(--_padding-bottom))`);
      let r = e - 1;
      this.container.style.paddingBottom = this.originalContainerBottomPadding ? `calc(${this.originalContainerBottomPadding} + ${r}px)` : `${r}px`;
    } else this._element.style.setProperty("--_keyboard-height", `${e}px`);
  }
  rebuild() {
    if (this._rebuilding || !this._element) return;
    this._rebuilding = true;
    let e = this.currentLayer;
    requestAnimationFrame(() => {
      this._rebuilding = false, this._element && (this._element.remove(), this._element = void 0), this.visible && (this.buildAndAttachElement(), this.currentLayer = e, this.render(), this.adjustBoundingRect(), this._element.classList.add("is-visible"));
    });
  }
  render() {
    var n;
    if (!this._element) return;
    let e = this.getLayer(this.currentLayer);
    this._element.classList.toggle("backdrop-is-transparent", !!(e && (e.backdrop || e.container)));
    let r = this._element.querySelectorAll(".MLK__layer.is-visible .MLK__keycap, .MLK__layer.is-visible .action, .fnbutton, .MLK__layer.is-visible .bigfnbutton, .MLK__layer.is-visible .shift");
    if (!r) return;
    let i = this.isShifted;
    for (let o of r) {
      let a = this.getKeycap(o.id);
      if (a) {
        let [s, l] = _n(a, { shifted: i });
        o.innerHTML = globalThis.MathfieldElement.createHTML(s), o.className = l, i && typeof a.shift == "object" && ((n = a.shift) != null && n.tooltip) ? o.dataset.tooltip = a.shift.tooltip : !i && a.tooltip && (o.dataset.tooltip = a.tooltip);
      }
    }
  }
  show(e) {
    var i;
    if (this._visible) return;
    let r = this.container;
    if (r && window.mathVirtualKeyboard && this.stateWillChange(true)) {
      if (this._element || (this.buildAndAttachElement(), this.adjustBoundingRect()), !this._visible) {
        let n = this._element.getElementsByClassName("MLK__plate")[0];
        if (n && this.observer.observe(n), r === window.document.body) {
          let o = r.style.paddingBottom;
          this.originalContainerBottomPadding = o;
          let a = n.offsetHeight - 1;
          r.style.paddingBottom = o ? `calc(${o} + ${a}px)` : `${a}px`;
        }
        window.addEventListener("mouseup", this), window.addEventListener("blur", this), window.addEventListener("keydown", this, { capture: true }), window.addEventListener("keyup", this, { capture: true }), (i = this._element) == null || i.classList.toggle("is-caps-lock", this.shiftPressCount === 2), this.currentLayer = this.latentLayer;
      }
      this._visible = true, e != null && e.animate ? requestAnimationFrame(() => {
        this._element && (this._element.classList.add("animate"), this._element.addEventListener("transitionend", () => {
          var n;
          return (n = this._element) == null ? void 0 : n.classList.remove("animate");
        }, { once: true }), this._element.classList.add("is-visible"), this.stateChanged());
      }) : (this._element.classList.add("is-visible"), this.stateChanged());
    }
  }
  hide(e) {
    var i;
    let r = this.container;
    if (r && this._visible && this.stateWillChange(false)) {
      if (this._visible = false, this._element) {
        this.latentLayer = this.currentLayer;
        let n = this._element.getElementsByClassName("MLK__plate")[0];
        n && this.observer.unobserve(n), window.removeEventListener("mouseup", this), window.removeEventListener("blur", this), window.removeEventListener("keydown", this, { capture: true }), window.removeEventListener("keyup", this, { capture: true }), window.removeEventListener("contextmenu", this, { capture: true }), Hr(), Vh(), (i = this._element) == null || i.remove(), this._element = void 0, this.originalContainerBottomPadding !== null && (r.style.paddingBottom = this.originalContainerBottomPadding);
      }
      this.stateChanged();
    }
  }
  get height() {
    var e, r;
    return (r = (e = this.element) == null ? void 0 : e.offsetHeight) != null ? r : 0;
  }
  buildAndAttachElement() {
    var e;
    this.element, this.element = qh(this), window.addEventListener("contextmenu", this, { capture: true }), this.element.addEventListener("contextmenu", (r) => {
      r.shiftKey || ((r.ctrlKey || r.button === 2) && hs(r.target), r.preventDefault(), r.stopPropagation());
    }, { capture: true }), (e = this.container) == null || e.appendChild(this.element);
  }
  handleEvent(e) {
    if (fo(e)) {
      if (!rn(e.origin, this.originValidator)) throw new DOMException(`Message from unknown origin (${e.origin}) cannot be handled`, "SecurityError");
      if (e.data.action === "disconnect") {
        if (this._visible) return;
        this.connectedMathfieldWindow = void 0;
      } else e.data.action !== "update-setting" && e.data.action !== "proxy-created" && e.data.action !== "execute-command" && (e.source, this.connectedMathfieldWindow = e.source);
      this.handleMessage(e.data, e.source);
    }
    if (this._element) switch (e.type) {
      case "mouseup":
      case "blur":
        document.body.style.userSelect = "", this.shiftPressCount = 0;
        break;
      case "contextmenu":
        e.button !== 2 && e.preventDefault();
        break;
      case "keydown": {
        e.key === "Shift" && !e.repeat && (this.shiftPressCount = 1);
        break;
      }
      case "keyup": {
        (e.key === "Shift" || !e.getModifierState("Shift") && this.shiftPressCount !== 2) && (this.shiftPressCount = 0);
        break;
      }
    }
  }
  handleMessage(e, r) {
    let { action: i } = e;
    if (i === "execute-command") {
      let { command: n } = e, o = pr(n);
      if (window === window.top && r !== window || r === window && o !== "virtual-keyboard") return;
      this.executeCommand(n);
      return;
    }
    if ((i === "connect" || i === "show") && this.sendMessage("synchronize-proxy", { boundingRect: this.boundingRect, alphabeticLayout: this._alphabeticLayout, layouts: this._layouts, editToolbar: this._editToolbar }, r), i !== "disconnect" && !this.isSandbox) {
      if (i === "show") {
        typeof e.animate != "undefined" ? this.show({ animate: e.animate }) : this.show();
        return;
      }
      if (i === "hide") {
        typeof e.animate != "undefined" ? this.hide({ animate: e.animate }) : this.hide();
        return;
      }
      if (i === "update-setting") {
        if (e.alphabeticLayout && (this.alphabeticLayout = e.alphabeticLayout), e.layouts && (this.layouts = e.layouts), e.editToolbar && (this.editToolbar = e.editToolbar), e.setKeycap) {
          let { keycap: n, value: o } = e.setKeycap;
          this.setKeycap(n, o), this.render();
        }
        return;
      }
      if (i === "proxy-created") {
        this.sendMessage("synchronize-proxy", { boundingRect: this.boundingRect, alphabeticLayout: this._alphabeticLayout, layouts: this._layouts, editToolbar: this._editToolbar }, r);
        return;
      }
    }
  }
  sendMessage(e, r, i) {
    if (r.command && this.dispatchEvent(new CustomEvent("math-virtual-keyboard-command", { detail: r.command })), i || (i = this.connectedMathfieldWindow), this.targetOrigin === null || this.targetOrigin === "null" || i === window) {
      window.dispatchEvent(new MessageEvent("message", { source: window, origin: window.origin, data: h({ type: po, action: e }, r) }));
      return;
    }
    if (i) i.postMessage(h({ type: po, action: e }, r), { targetOrigin: this.targetOrigin });
    else if (e === "execute-command" && Array.isArray(r.command) && r.command[0] === "insert") {
      let n = r.command[1].split("");
      for (let o of n) this.dispatchEvent(new KeyboardEvent("keydown", { key: o, bubbles: true })), this.dispatchEvent(new KeyboardEvent("keyup", { key: o, bubbles: true }));
    }
  }
  stateWillChange(e) {
    return this.dispatchEvent(new CustomEvent("before-virtual-keyboard-toggle", { detail: { visible: e }, bubbles: true, cancelable: true, composed: true }));
  }
  stateChanged() {
    this.dispatchEvent(new Event("virtual-keyboard-toggle")), this._visible || (this.dispatchEvent(new Event("geometrychange")), this.sendMessage("geometry-changed", { boundingRect: this.boundingRect }));
  }
  focus() {
    this.sendMessage("focus", {});
  }
  blur() {
    this.sendMessage("blur", {});
  }
  updateToolbar(e) {
    let r = this._element;
    if (!r) return;
    r.classList.toggle("is-math-mode", e.mode === "math"), r.classList.toggle("is-text-mode", e.mode === "text"), r.classList.toggle("can-undo", e.canUndo), r.classList.toggle("can-redo", e.canRedo), r.classList.toggle("can-copy", !e.selectionIsCollapsed), r.classList.toggle("can-cut", !e.selectionIsCollapsed), r.classList.toggle("can-paste", true);
    let i = r.querySelectorAll(".ML__edit-toolbar");
    if (i) for (let n of i) n.innerHTML = $h(this, e);
  }
  update(e) {
    this._style = e.style, this.updateToolbar(e);
  }
  connect() {
    this.connectedMathfieldWindow = window;
  }
  disconnect() {
    this._visible || (this.connectedMathfieldWindow = void 0);
  }
  executeCommand(e) {
    if (e = _i(e), !e) return false;
    let r, i = [], n = pr(e);
    return ee(e) ? (r = e[0], r === "performWithFeedback" && (n = pr(e.slice(1))), i = e.slice(1)) : r = e, n === "virtual-keyboard" ? _t[r].fn(void 0, ...i) : (this.sendMessage("execute-command", { command: e }), false);
  }
  dispose() {
    window.removeEventListener("mouseup", this), window.removeEventListener("blur", this), window.removeEventListener("message", this);
  }
};
function Hh() {
  let t38 = Wt(), e = null;
  for (; t38; ) {
    if ("host" in t38 && t38.host instanceof Mt) {
      e = t38.host;
      break;
    }
    t38 = t38.parentNode;
  }
  return e;
}
Le() && !("mathVirtualKeyboard" in window) && (window === window.top ? ys() : Object.defineProperty(window, "mathVirtualKeyboard", { get: () => ho.singleton, configurable: true }));
function ys() {
  let t38 = Fe.singleton;
  return window.mathVirtualKeyboard !== t38 && Object.defineProperty(window, "mathVirtualKeyboard", { get: () => t38 }), t38;
}
function wn(t38) {
  let e = {};
  for (let r of Object.keys(t38)) switch (r) {
    case "scriptDepth":
      let i = t38.scriptDepth;
      if (ee(i)) e.scriptDepth = [i[0], i[1]];
      else if (typeof i == "number") e.scriptDepth = [i, i];
      else if (typeof i == "string") {
        let [o, a] = i.split(",").map((s) => parseInt(s.trim()));
        e.scriptDepth = [o, a];
      } else throw new TypeError("Unexpected value for scriptDepth");
      break;
    case "mathVirtualKeyboardPolicy":
      let n = t38.mathVirtualKeyboardPolicy.toLowerCase();
      if (n === "sandboxed") {
        let o = ys();
        o && (o.isSandbox = true), n = "manual";
      }
      e.mathVirtualKeyboardPolicy = n;
      break;
    case "letterShapeStyle":
      t38.letterShapeStyle === "auto" ? F.locale.startsWith("fr") ? e.letterShapeStyle = "french" : e.letterShapeStyle = "tex" : e.letterShapeStyle = t38.letterShapeStyle;
      break;
    case "defaultMode":
      ["text", "math", "inline-math"].includes(t38.defaultMode) ? e.defaultMode = t38.defaultMode : (console.error('MathLive 0.111.1:  valid values for defaultMode are "text", "math" or "inline-math"'), e.defaultMode = "math");
      break;
    case "macros":
      e.macros = ei(t38.macros);
      break;
    default:
      ee(t38[r]) ? e[r] = [...t38[r]] : typeof t38[r] == "object" && !(t38[r] instanceof Element) && r !== "computeEngine" ? e[r] = h({}, t38[r]) : e[r] = t38[r];
  }
  return e;
}
function fr(t38, e) {
  let r;
  typeof e == "string" ? r = [e] : e === void 0 ? r = Object.keys(t38) : r = e;
  let i = {};
  for (let n of r) t38[n] === null ? i[n] = null : ee(t38[n]) ? i[n] = [...t38[n]] : typeof t38[n] == "object" && !(t38[n] instanceof Element) && n !== "computeEngine" ? i[n] = h({}, t38[n]) : i[n] = t38[n];
  return typeof e == "string" ? i[e] : i;
}
function Sn() {
  return { readOnly: false, defaultMode: "math", macros: {}, registers: {}, colorMap: Yr, backgroundColorMap: Bi, letterShapeStyle: F.locale.startsWith("fr") ? "french" : "tex", minFontScale: 0, maxMatrixCols: 10, smartMode: false, smartFence: true, smartSuperscript: true, scriptDepth: [1 / 0, 1 / 0], removeExtraneousParentheses: true, isImplicitFunction: (t38) => ["\\sin", "\\cos", "\\tan", "\\arcsin", "\\arccos", "\\arctan", "\\arcsec", "\\arccsc", "\\arsinh", "\\arcosh", "\\artanh", "\\arcsech", "\\arccsch", "\\arg", "\\ch", "\\cosec", "\\cosh", "\\cot", "\\cotg", "\\coth", "\\csc", "\\ctg", "\\cth", "\\sec", "\\sinh", "\\sh", "\\tanh", "\\tg", "\\th", "\\lg", "\\lb", "\\log", "\\ln"].includes(t38), mathModeSpace: "", placeholderSymbol: "▢", contentPlaceholder: "", popoverPolicy: "auto", environmentPopoverPolicy: "off", keybindings: j0, inlineShortcuts: Wa, inlineShortcutTimeout: 0, mathVirtualKeyboardPolicy: "auto", originValidator: "none", onInsertStyle: co, onInlineShortcut: () => "", onScrollIntoView: null, onExport: G0, value: "" };
}
function Ac(t38) {
  return t38.defaultMode === "inline-math" ? "math" : t38.defaultMode;
}
var Wh = "<mo>&#x2061;</mo>", xs = "<mo>&#8290;</mo>";
function De(t38) {
  return t38.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function re(t38, e) {
  return !t38 || !e.generateID ? "" : ` extid="${t38}"`;
}
function mb(t38, e, r) {
  var d, m, p, f, y, v, b, k;
  let i = false;
  e = e != null ? e : t38.atoms.length;
  let n = "", o = "", a = t38.atoms[t38.index], s = (d = a.style) == null ? void 0 : d.variant, l = (m = a.style) == null ? void 0 : m.variantStyle, c = "";
  if (a.value && (s || l)) {
    let S = (p = Bn(a.value, s, l)) != null ? p : a.value;
    if (S !== a.value) return t38.index += 1, n = `<mi${re(a.id, r)}>${S}</mi>`, jt(n, t38, r) || (t38.mathML += n, t38.lastType = "mi"), true;
    c = (f = { upnormal: "normal", boldnormal: "bold", italicmain: "italic", bolditalicmain: "bold-italic", "updouble-struck": "double-struck", "double-struck": "double-struck", boldfraktur: "bold-fraktur", calligraphic: "script", upcalligraphic: "script", script: "script", boldscript: "bold-script", boldcalligraphic: "bold-script", fraktur: "fraktur", "upsans-serif": "sans-serif", "boldsans-serif": "bold-sans-serif", "italicsans-serif": "sans-serif-italic", "bolditalicsans-serif": "sans-serif-bold-italic", monospace: "monospace" }[(l != null ? l : "") + (s != null ? s : "")]) != null ? f : "", c && (c = ` mathvariant="${c}"`);
  }
  let u = { "\\exponentialE": "&#x02147;", "\\imaginaryI": "&#x2148;", "\\differentialD": "&#x2146;", "\\capitalDifferentialD": "&#x2145;", "\\alpha": "&#x03b1;", "\\pi": "&#x03c0;", "\\infty": "&#x221e;", "\\forall": "&#x2200;", "\\nexists": "&#x2204;", "\\exists": "&#x2203;", "\\hbar": "ℏ", "\\cdotp": "⋅", "\\ldots": "…", "\\cdots": "⋯", "\\ddots": "⋱", "\\vdots": "⋮", "\\ldotp": "." };
  if (a.command === "!") return t38.index += 1, n = "<mo>!</mo>", jt(n, t38, r) || (t38.mathML += n, t38.lastType = "mo"), true;
  if (u[a.command]) {
    t38.index += 1;
    let S = `<mi${re(a.id, r)}${c}>${u[a.command]}</mi>`;
    return (t38.lastType === "mi" || t38.lastType === "mn" || t38.lastType === "mtext" || t38.lastType === "fence") && (S = xs + S), jt(S, t38, r) || (t38.mathML += S, t38.lastType = "mi"), true;
  }
  if (a.command === "\\operatorname") o = kn(a.body), t38.index += 1;
  else if (s || l) for (; t38.index < e && (a.type === "mord" || a.type === "macro") && !a.isDigit() && s === ((v = (y = a.style) == null ? void 0 : y.variant) != null ? v : "") && l === ((k = (b = a.style) == null ? void 0 : b.variantStyle) != null ? k : ""); ) o += kn([a]), t38.index += 1, a = t38.atoms[t38.index];
  else (a.type === "mord" || a.type === "macro") && !a.isDigit() && (o += kn([a]), t38.index += 1);
  if (o.length > 0) {
    i = true, n = `<mi${c}>${o}</mi>`;
    let S = t38.lastType;
    n.endsWith(">f</mi>") || n.endsWith(">g</mi>") ? (n += Wh, t38.lastType = "applyfunction") : t38.lastType = /^<mo>(.*)<\/mo>$/.test(n) ? "mo" : "mi", jt(n, t38, r) || ((S === "mi" || S === "mn" || S === "mtext" || S === "fence") && (n = xs + n), t38.mathML += n);
  }
  return i;
}
function Uh(t38) {
  return t38.index < t38.atoms.length && t38.atoms[t38.index].superscript && t38.atoms[t38.index].type === "subsup";
}
function Gh(t38) {
  let e = -1, r = t38.index, i = false, n = false;
  for (; r < t38.atoms.length && !i && !n; ) {
    let o = t38.atoms[r];
    i = !o.isDigit(), n = !i && o.superscript !== void 0, r++;
  }
  return n && (e = r - 1), e;
}
function jt(t38, e, r) {
  var l;
  let i = e.atoms[e.index - 1];
  if (!i) return false;
  if (!i.superscript && !i.subscript) if (((l = e.atoms[e.index]) == null ? void 0 : l.type) === "subsup") i = e.atoms[e.index], e.index += 1;
  else return false;
  let n = e.lastType;
  e.lastType = "";
  let o = G(i.superscript, r);
  e.lastType = "";
  let a = G(i.subscript, r);
  if (e.lastType = n, !o && !a) return false;
  let s = "";
  return o && a ? s = `<msubsup>${t38}${a}${o}</msubsup>` : o ? s = `<msup>${t38}${o}</msup>` : a && (s = `<msub>${t38}${a}</msub>`), e.mathML += s, e.lastType = "", true;
}
function hb(t38, e, r) {
  e = e != null ? e : t38.atoms.length;
  let i = t38.index, n = "", o = Gh(t38);
  for (o >= 0 && o < e && (e = o); t38.index < e && t38.atoms[t38.index].mode === "text"; ) n += t38.atoms[t38.index].value ? t38.atoms[t38.index].value : " ", t38.index += 1;
  return n.length > 0 ? (n = `<mtext ${re(t38.atoms[i].id, r)}>${De(n)}</mtext>`, o < 0 && Uh(t38) && (o = t38.index, t38.index += 1), jt(n, t38, r) || (t38.mathML += n, t38.lastType = "mtext"), true) : false;
}
function pb(t38, e, r) {
  e = e != null ? e : t38.atoms.length;
  let i = t38.index, n = "", o = Gh(t38);
  for (o >= 0 && o < e && (e = o); t38.index < e && t38.atoms[t38.index].isDigit(); ) n += t38.atoms[t38.index].asDigit(), t38.index += 1;
  return n.length <= 0 ? false : (n = "<mn" + re(t38.atoms[i].id, r) + ">" + n + "</mn>", o < 0 && Uh(t38) && (o = t38.index, t38.index += 1), jt(n, t38, r) || (t38.mathML += n, t38.lastType = "mn"), true);
}
function fb(t38, e, r) {
  let i = false;
  e = e != null ? e : t38.atoms.length;
  let n = "", o = "";
  if (t38.index < e && t38.atoms[t38.index].type === "mopen") {
    let a = false, s = 0, l = t38.index, c = -1, u = l + 1;
    for (; u < e && !a; ) t38.atoms[u].type === "mopen" ? s += 1 : t38.atoms[u].type === "mclose" && (s -= 1), s === -1 && (a = true, c = u), u += 1;
    a && (n = "<mrow>", n += wi(t38.atoms[l], r), n += G(t38.atoms, r, l + 1, c), n += wi(t38.atoms[c], r), n += "</mrow>", t38.index = c + 1, (t38.lastType === "mi" || t38.lastType === "mn" || t38.lastType === "mfrac" || t38.lastType === "fence") && (t38.mathML += xs), jt(n, t38, r) && (i = true, t38.lastType = "", n = ""), o = "fence");
  }
  return n.length > 0 && (i = true, t38.mathML += n, t38.lastType = o), i;
}
function gb(t38, e, r) {
  let i = false;
  e = e != null ? e : t38.atoms.length;
  let n = "", o = "", a = t38.atoms[t38.index];
  if (!a) return false;
  let s = { "\\ne": "&ne;", "\\neq": "&ne;", "\\pm": "&#177;", "\\times": "&#215;", "\\colon": ":", "\\vert": "|", "\\Vert": "∥", "\\mid": "∣", "\\{": "{", "\\}": "}", "\\lbrace": "{", "\\rbrace": "}", "\\lbrack": "[", "\\rbrack": "]", "\\lparen": "(", "\\rparen": ")", "\\langle": "⟨", "\\rangle": "⟩", "\\lfloor": "⌊", "\\rfloor": "⌋", "\\lceil": "⌈", "\\rceil": "⌉" };
  if (s[a.command]) {
    t38.index += 1;
    let l = `<mo${re(a.id, r)}>${s[a.command]}</mo>`;
    return jt(l, t38, r) || (t38.mathML += l, t38.lastType = "mo"), true;
  }
  if (t38.index < e && (a.type === "mbin" || a.type === "mrel")) n += Cc(t38.atoms[t38.index], r), t38.index += 1, o = "mo";
  else if (t38.index < e && (a.type === "mop" || a.type === "operator" || a.type === "extensible-symbol")) {
    if (a.subsupPlacement === "over-under" && (a.superscript || a.subscript)) {
      let l = wi(a, r);
      return a.superscript && a.subscript ? (n += "<munderover>" + l, n += G(a.subscript, r), n += G(a.superscript, r), n += "</munderover>") : a.superscript ? (n += "<mover>" + l, n += G(a.superscript, r), n += "</mover>") : a.subscript && (n += "<munder>" + l, n += G(a.subscript, r), n += "</munder>"), t38.mathML += n, t38.lastType = "mo", t38.index += 1, true;
    }
    {
      let l = t38.atoms[t38.index], c = l.value === "\\operatorname", u = c ? '<mi class="MathML-Unit"' + re(l.id, r) + ">" + kn(l.value) + "</mi>" : wi(l, r);
      n += u, !c && !/^<mo>(.*)<\/mo>$/.test(u) ? (n += Wh, o = "applyfunction") : o = c ? "mi" : "mo";
    }
    (t38.lastType === "mi" || t38.lastType === "mn") && !/^<mo>(.*)<\/mo>$/.test(n) && (n = xs + n), t38.index += 1;
  }
  return n.length > 0 && (i = true, jt(n, t38, r) || (t38.mathML += n, t38.lastType = o)), i;
}
function G(t38, e, r, i) {
  e != null || (e = {});
  let n = { atoms: [], index: r != null ? r : 0, mathML: "", lastType: "" };
  if (typeof t38 == "number" || typeof t38 == "boolean") n.mathML = t38.toString();
  else if (typeof t38 == "string") n.mathML = t38;
  else if (t38 instanceof x) n.mathML = Cc(t38, e);
  else if (Array.isArray(t38)) {
    n.atoms = t38;
    let o = 0;
    for (i = i || (t38 ? t38.length : 0); n.index < i; ) if (hb(n, i, e) || pb(n, i, e) || mb(n, i, e) || gb(n, i, e) || fb(n, i, e)) o += 1;
    else if (n.index < i) {
      let a = Cc(n.atoms[n.index], e);
      n.lastType === "mn" && a.length > 0 && n.atoms[n.index].type === "genfrac" && (a = "<mo>&#x2064;</mo>" + a), n.atoms[n.index].type === "genfrac" ? n.lastType = "mfrac" : n.lastType = "", n.index += 1, jt(a, n, e) ? o += 1 : a.length > 0 && (n.mathML += a, o += 1);
    }
    o > 1 && (n.mathML = "<mrow>" + n.mathML + "</mrow>");
  }
  return n.mathML;
}
function wi(t38, e) {
  let r = "", i = kn(t38.value);
  return i && (r = "<mo" + re(t38.id, e) + ">" + i + "</mo>"), r;
}
function kn(t38) {
  if (!t38) return "";
  if (typeof t38 == "string") return De(t38);
  if (!Array.isArray(t38) && typeof t38.body == "string") return De(t38.body);
  let e = "";
  for (let r of t38) typeof r.value == "string" && (e += r.value);
  return De(e);
}
function Cc(t38, e) {
  var y, v, b, k, S, A, E, C, _, O, I, V, K, N, j, D, W, ie, X, ye, xe, Pe, At;
  if (t38.mode === "text") return `<mi${re(t38.id, e)}>${De(t38.value)}</mi>`;
  let r = { widehat: "^", widecheck: "ˇ", widetilde: "~", utilde: "~", overleftarrow: "←", underleftarrow: "←", xleftarrow: "←", longleftarrow: "←", overrightarrow: "→", underrightarrow: "→", xrightarrow: "→", longrightarrow: "→", underbrace: "⏟", overbrace: "⏞", overgroup: "⏠", undergroup: "⏡", overleftrightarrow: "↔", underleftrightarrow: "↔", xleftrightarrow: "↔", Overrightarrow: "⇒", xRightarrow: "⇒", overleftharpoon: "↼", xleftharpoonup: "↼", overrightharpoon: "⇀", xrightharpoonup: "⇀", xLeftarrow: "⇐", xLeftrightarrow: "⇔", xhookleftarrow: "↩", xhookrightarrow: "↪", xmapsto: "↦", xrightharpoondown: "⇁", xleftharpoondown: "↽", xrightleftharpoons: "⇌", longrightleftharpoons: "⇌", xleftrightharpoons: "⇋", xtwoheadleftarrow: "↞", xtwoheadrightarrow: "↠", xlongequal: "=", xtofrom: "⇄", xleftrightarrows: "⇄", xRightleftharpoons: "⇌", longRightleftharpoons: "⇌", xLeftrightharpoons: "⇋", longLeftrightharpoons: "⇋" }, i = { "\\!": -3 / 18, "\\ ": 6 / 18, "\\,": 3 / 18, "\\:": 4 / 18, "\\>": 4 / 18, "\\;": 5 / 18, "\\enspace": 0.5, "\\quad": 1, "\\qquad": 2, "\\enskip": 0.5 }, n = "", o = "", a, s, l, c, u, d, { command: m } = t38;
  if (t38.command === "\\error") return `<merror${re(t38.id, e)}>${G(t38.body, e)}</merror>`;
  let p = { "\\vert": "|", "\\Vert": "∥", "\\mid": "∣", "\\lbrack": "[", "\\rbrack": "]", "\\{": "{", "\\}": "}", "\\lbrace": "{", "\\rbrace": "}", "\\lparen": "(", "\\rparen": ")", "\\langle": "⟨", "\\rangle": "⟩", "\\lfloor": "⌊", "\\rfloor": "⌋", "\\lceil": "⌈", "\\rceil": "⌉" }, f = { "\\vec": "&#x20d7;", "\\acute": "&#x00b4;", "\\grave": "&#x0060;", "\\dot": "&#x02d9;", "\\ddot": "&#x00a8;", "\\tilde": "&#x007e;", "\\bar": "&#x00af;", "\\breve": "&#x02d8;", "\\check": "&#x02c7;", "\\hat": "&#x005e;" };
  switch (t38.type) {
    case "first":
      break;
    case "error":
      if (t38.command === "\\\\") break;
      n = `<merror${re(t38.id, e)}>${G(t38.body, e)}</merror>`;
      break;
    case "group":
    case "root":
      n = G(t38.body, e);
      break;
    case "array":
      let ue = t38;
      if ((ue.leftDelim && ue.leftDelim !== "." || ue.rightDelim && ue.rightDelim !== ".") && (n += "<mrow>", ue.leftDelim && ue.leftDelim !== "." && (n += `<mo>${De(p[ue.leftDelim] || ue.leftDelim)}</mo>`)), n += "<mtable", ue.colFormat) {
        for (n += ' columnalign="', l = 0; l < ue.colFormat.length; l++) {
          let Oe = ue.colFormat[l];
          "align" in Oe && (n += { l: "left", c: "center", r: "right" }[Oe.align] + " ");
        }
        n += '"';
      }
      for (n += ">", s = 0; s < ue.rows.length; s++) {
        for (n += "<mtr>", a = 0; a < ue.rows[s].length; a++) n += "<mtd>" + G(ue.rows[s][a], e) + "</mtd>";
        n += "</mtr>";
      }
      n += "</mtable>", (ue.leftDelim && ue.leftDelim !== "." || ue.rightDelim && ue.rightDelim !== ".") && (ue.rightDelim && ue.rightDelim !== "." && (n += `<mo>${De(p[ue.rightDelim] || ue.rightDelim)}</mo>`), n += "</mrow>");
      break;
    case "genfrac":
      let we = t38;
      if ((we.leftDelim || we.rightDelim) && (n += "<mrow>"), we.leftDelim && we.leftDelim !== "." && (n += "<mo" + re(t38.id, e) + ">" + De(p[we.leftDelim] || we.leftDelim) + "</mo>"), we.hasBarLine) {
        let Oe = we.barThickness;
        Oe && "dimension" in Oe ? n += `<mfrac linethickness="${ge(Oe)}">` : n += "<mfrac>", n += G(t38.above, e) || "<mi>&nbsp;</mi>", n += G(t38.below, e) || "<mi>&nbsp;</mi>", n += "</mfrac>";
      } else n += "<mtable" + re(t38.id, e) + ">", n += "<mtr>" + G(t38.above, e) + "</mtr>", n += "<mtr>" + G(t38.below, e) + "</mtr>", n += "</mtable>";
      we.rightDelim && we.rightDelim !== "." && (n += "<mo" + re(t38.id, e) + ">" + De(p[we.rightDelim] || we.rightDelim) + "</mo>"), (we.leftDelim || we.rightDelim) && (n += "</mrow>");
      break;
    case "surd":
      t38.hasEmptyBranch("above") ? (n += "<msqrt" + re(t38.id, e) + ">", n += G(t38.body, e), n += "</msqrt>") : (n += "<mroot" + re(t38.id, e) + ">", n += G(t38.body, e), n += G(t38.above, e), n += "</mroot>");
      break;
    case "leftright":
      let Xr = t38, br = Xr.leftDelim;
      n = "<mrow>", br && br !== "." && (n += `<mo${re(t38.id, e)}>${De((y = p[br]) != null ? y : br)}</mo>`), t38.body && (n += G(t38.body, e));
      let Io = Xr.matchingRightDelim();
      Io && Io !== "." && (n += `<mo${re(t38.id, e)}>${De((v = p[Io]) != null ? v : Io)}</mo>`), n += "</mrow>";
      break;
    case "sizeddelim":
    case "delim":
      n += `<mo${re(t38.id, e)}>${De(p[t38.value] || t38.value)}</mo>`;
      break;
    case "accent":
      let ef = t38;
      n += '<mover accent="true"' + re(t38.id, e) + ">", n += G(t38.body, e), n += "<mo>" + (f[m] || ef.accent) + "</mo>", n += "</mover>";
      break;
    case "line":
    case "overlap":
      break;
    case "overunder":
      let je = t38;
      u = t38.above, c = t38.below, (je.svgAbove || u) && (je.svgBelow || c) ? d = t38.body : u && u.length > 0 ? (d = t38.body, (k = (b = t38.body) == null ? void 0 : b[0]) != null && k.below ? (c = t38.body[0].below, d = t38.body[0].body) : ((A = (S = t38.body) == null ? void 0 : S[0]) == null ? void 0 : A.type) === "first" && ((C = (E = t38.body) == null ? void 0 : E[1]) != null && C.below) && (c = t38.body[1].below, d = t38.body[1].body)) : c && c.length > 0 && (d = t38.body, (O = (_ = t38.body) == null ? void 0 : _[0]) != null && O.above ? (u = t38.body[0].above, d = t38.body[0].body) : ((V = (I = t38.body) == null ? void 0 : I[0]) == null ? void 0 : V.type) === "first" && ((N = (K = t38.body) == null ? void 0 : K[1]) != null && N.above) && (u = t38.body[1].above, d = t38.body[1].body)), (je.svgAbove || u) && (je.svgBelow || c) ? (n += `<munderover ${re(t38.id, e)}>`, n += (j = r[je.svgBody]) != null ? j : G(d, e), n += (D = r[je.svgBelow]) != null ? D : G(c, e), n += (W = r[je.svgAbove]) != null ? W : G(u, e), n += "</munderover>") : je.svgAbove || u ? (n += `<mover ${re(t38.id, e)}>` + ((ie = r[je.svgBody]) != null ? ie : G(d, e)), n += (X = r[je.svgAbove]) != null ? X : G(u, e), n += "</mover>") : (je.svgBelow || c) && (n += `<munder ${re(t38.id, e)}>` + ((ye = r[je.svgBody]) != null ? ye : G(d, e)), n += (xe = r[je.svgBelow]) != null ? xe : G(c, e), n += "</munder>");
      break;
    case "placeholder":
      n += "?";
      break;
    case "mord": {
      if (n = typeof t38.value == "string" ? t38.value : m, n.length > 0 && n.startsWith("\\")) typeof t38.value == "string" && t38.value.charCodeAt(0) > 255 ? n = String.fromCodePoint(t38.value.codePointAt(0)) : typeof t38.value == "string" && (n = t38.value.charAt(0));
      else if (t38.command === "\\char") {
        let el = (Pe = t38.args) == null ? void 0 : Pe[0];
        if (el !== void 0 && "number" in el) {
          let zo = el.number;
          typeof zo == "number" && zo >= 0 && zo <= 1114111 && (n = String.fromCodePoint(zo));
        }
      } else typeof t38.value == "string" ? n = t38.value : (console.error("Did not expect this"), n = "");
      let Oe = /\d/.test(n) ? "mn" : "mi";
      n = `<${Oe}${re(t38.id, e)}>${De(n)}</${Oe}>`;
      break;
    }
    case "mbin":
    case "mrel":
    case "minner":
      n = wi(t38, e);
      break;
    case "mpunct":
      n = '<mo separator="true"' + re(t38.id, e) + ">" + m + "</mo>";
      break;
    case "mop":
    case "operator":
    case "extensible-symbol":
      t38.value !== "​" && (n = "<mo" + re(t38.id, e) + ">", n += m === "\\operatorname" ? t38.body : m || t38.body, n += "</mo>");
      break;
    case "box":
      let Ys = t38;
      n = '<menclose notation="box"', Ys.backgroundcolor && "string" in Ys.backgroundcolor && (n += ' mathbackground="' + De(Ys.backgroundcolor.string) + '"'), n += re(t38.id, e) + ">" + G(t38.body, e) + "</menclose>";
      break;
    case "spacing":
      n += '<mspace width="' + ((At = i[m]) != null ? At : 0) + 'em"/>';
      break;
    case "enclose":
      let Qs = t38;
      n = '<menclose notation="';
      for (let Oe in Qs.notation) Object.prototype.hasOwnProperty.call(Qs.notation, Oe) && Qs.notation[Oe] && (n += o + De(Oe), o = " ");
      n += re(t38.id, e) + '">' + G(t38.body, e) + "</menclose>";
      break;
    case "prompt":
      n = '<menclose notation="roundexbox""">' + G(t38.body, e) + "</menclose>";
      break;
    case "space":
      n += "&nbsp;";
      break;
    case "subsup":
      break;
    case "phantom":
      break;
    case "composition":
      break;
    case "rule":
      break;
    case "chem":
      break;
    case "mopen":
      n += wi(t38, e);
      break;
    case "mclose":
      n += wi(t38, e);
      break;
    case "macro":
      {
        let Oe = t38.command + kn(t38.macroArgs);
        Oe && (n += `<mo ${re(t38.id, e)}>${Oe}</mo>`);
      }
      break;
    case "latexgroup":
      n += G(t38.body, e);
      break;
    case "latex":
      n += "<mtext" + re(t38.id, e) + ">" + De(t38.value) + "</mtext>";
      break;
    case "tooltip":
      n += G(t38.body, e);
      break;
    case "text":
      n += `<mtext ${re(t38.id, e)}x>${De(t38.value)}</mtext>`;
      break;
    default:
      if (t38.command === "\\displaystyle") return `<mrow ${re(t38.id, e)} displaystyle="true">${G(t38.body, e)}</mrow>`;
      if (t38.command === "\\textstyle") return `<mrow ${re(t38.id, e)} displaystyle="false">${G(t38.body, e)}</mrow>`;
      console.info("Unexpected element in conversion to MathML:", t38);
  }
  return n;
}
var Ln = { "\\alpha": "alpha ", "\\mu": "mew ", "\\sigma": "sigma ", "\\pi": "pie ", "\\imaginaryI": "imaginary eye ", "\\imaginaryJ": "imaginary jay ", "\\sum": "Summation ", "\\prod": "Product ", "+": "plus ", "-": "minus ", ";": '<break time="150ms"/> semi-colon <break time="150ms"/>', ",": '<break time="150ms"/> comma  <break time="150ms"/>', "|": '<break time="150ms"/>Vertical bar<break time="150ms"/>', "(": '<break time="150ms"/>Open paren. <break time="150ms"/>', ")": '<break time="150ms"/> Close paren. <break time="150ms"/>', "=": "equals ", "<": "is less than ", "\\lt": "is less than ", "<=": "is less than or equal to ", "\\le": "is less than or equal to ", "\\gt": "is greater than ", ">": "is greater than ", "\\pm": "plus or minus", "\\mp": "minus or plus", "\\ge": "is greater than or equal to ", "\\geq": "is greater than or equal to ", "\\leq": "is less than or equal to ", "\\ne": "is not equal to ", "\\neq": "is not equal to ", "!": "factorial ", "\\sin": "sine ", "\\cos": "cosine ", "​": "", "−": "minus ", ":": '<break time="150ms"/> such that <break time="200ms"/> ', "\\colon": '<break time="150ms"/> such that <break time="200ms"/> ', "\\hbar": "etch bar ", "\\iff": '<break time="200ms"/>if, and only if, <break time="200ms"/>', "\\Longleftrightarrow": '<break time="200ms"/>if, and only if, <break time="200ms"/>', "\\land": "and ", "\\lor": "or ", "\\neg": "not ", "\\div": "divided by ", "\\forall": "for all ", "\\exists": "there exists ", "\\nexists": "there does not exists ", "\\in": "element of ", "\\N": 'the set <break time="150ms"/><say-as interpret-as="character">n</say-as>', "\\C": 'the set <break time="150ms"/><say-as interpret-as="character">c</say-as>', "\\Z": 'the set <break time="150ms"/><say-as interpret-as="character">z</say-as>', "\\Q": 'the set <break time="150ms"/><say-as interpret-as="character">q</say-as>', "\\infty": "infinity ", "\\nabla": "nabla ", "\\partial": "partial derivative of ", "\\cdot": "times ", "\\cdots": "dot dot dot ", "\\Rightarrow": "implies ", "\\lparen": '<break time="150ms"/>open paren<break time="150ms"/>', "\\rparen": '<break time="150ms"/>close paren<break time="150ms"/>', "\\lbrace": '<break time="150ms"/>open brace<break time="150ms"/>', "\\{": '<break time="150ms"/>open brace<break time="150ms"/>', "\\rbrace": '<break time="150ms"/>close brace<break time="150ms"/>', "\\}": '<break time="150ms"/>close brace<break time="150ms"/>', "\\langle": '<break time="150ms"/>left angle bracket<break time="150ms"/>', "\\rangle": '<break time="150ms"/>right angle bracket<break time="150ms"/>', "\\lfloor": '<break time="150ms"/>open floor<break time="150ms"/>', "\\rfloor": '<break time="150ms"/>close floor<break time="150ms"/>', "\\lceil": '<break time="150ms"/>open ceiling<break time="150ms"/>', "\\rceil": '<break time="150ms"/>close ceiling<break time="150ms"/>', "\\vert": '<break time="150ms"/>vertical bar<break time="150ms"/>', "\\mvert": '<break time="150ms"/>divides<break time="150ms"/>', "\\lvert": '<break time="150ms"/>left vertical bar<break time="150ms"/>', "\\rvert": '<break time="150ms"/>right vertical bar<break time="150ms"/>', "\\lbrack": '<break time="150ms"/> open square bracket <break time="150ms"/>', "\\rbrack": '<break time="150ms"/> close square bracket <break time="150ms"/>', mm: "millimeters", cm: "centimeters", km: "kilometers", kg: "kilograms" }, Ec = { array: "array", matrix: "matrix", pmatrix: "parenthesis matrix", bmatrix: "square brackets matrix", Bmatrix: "braces matrix", vmatrix: "bars matrix", Vmatrix: "double bars matrix", "matrix*": "matrix", smallmatrix: "small matrix" };
function bb(t38) {
  let e = "";
  return t38.startsWith("\\") && (e = " " + t38.replace("\\", "") + " "), e;
}
function vo(t38) {
  let e = 0;
  if (ee(t38)) for (let r of t38) r.type !== "first" && (e += 1);
  return e === 1;
}
function yb(t38) {
  if (ee(t38)) {
    for (let e of t38) if (e.type !== "first" && e.id) return e.id.toString();
  }
  return "";
}
function jh(t38) {
  let e = "";
  if (ee(t38)) for (let r of t38) r.type !== "first" && typeof r.value == "string" && (e += r.value);
  return e;
}
function xb(t38) {
  return t38 ? t38.map((e) => e.value).join("") : "";
}
function vs(t38) {
  if (t38 && !t38.some((e) => e.type !== "first" && e.value === void 0)) return t38.map((e) => e.value).join("");
}
function Tc(t38) {
  return `<emphasis>${t38}</emphasis>`;
}
function vb(t38, e) {
  var o;
  let r = "", i = false, n = false;
  for (let a = 0; a < e.length; a++) e[a].type !== "first" && (e[a].mode !== "text" && (n = false), a < e.length - 2 && e[a].type === "mopen" && e[a + 2].type === "mclose" && e[a + 1].type === "mord" ? (r += " of ", r += Tc(q(t38, e[a + 1])), a += 2) : e[a].mode === "text" ? n ? r += (o = e[a].value) != null ? o : " " : (n = true, r += q("text", e[a])) : e[a].isDigit() ? i ? r += e[a].asDigit() : (i = true, r += q(t38, e[a])) : (i = false, r += q(t38, e[a])));
  return r;
}
function Jh(t38) {
  return t38 ? globalThis.MathfieldElement.textToSpeechMarkup ? t38.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : t38 : "";
}
function q(t38, e) {
  var c, u, d, m, p, f, y, v;
  function r(b) {
    return globalThis.MathfieldElement.textToSpeechMarkup ? /[a-z]/.test(b) ? ` <say-as interpret-as="character">${b}</say-as>` : /[A-Z]/.test(b) ? `capital <say-as interpret-as="character">${b.toLowerCase()}</say-as>` : b : /[a-z]/.test(b) ? " '" + b.toUpperCase() + "'" : /[A-Z]/.test(b) ? " 'capital " + b.toUpperCase() + "'" : b;
  }
  if (!e) return "";
  if (ee(e)) return vb(t38, e);
  let i = "";
  if (e.id && t38 === "math" && (i += '<mark name="' + e.id.toString() + '"/>'), e.mode === "text") return i + Jh(e.value);
  let n = "", o = "", a = "", s = false, { command: l } = e;
  switch (l) {
    case "\\vec":
      return "vector " + q(t38, e.body);
    case "\\acute":
      return q(t38, e.body) + " acute";
    case "\\grave":
      return q(t38, e.body) + " grave";
    case "\\dot":
      return "dot over" + q(t38, e.body);
    case "\\ddot":
      return "double dot over" + q(t38, e.body);
    case "\\mathring":
      return "ring over" + q(t38, e.body);
    case "\\tilde":
    case "\\widetilde":
      return "tilde over" + q(t38, e.body);
    case "\\bar":
      return q(t38, e.body) + " bar";
    case "\\breve":
      return q(t38, e.body) + " breve";
    case "\\check":
    case "\\widecheck":
      return "check over " + q(t38, e.body);
    case "\\hat":
    case "\\widehat":
      return "hat over" + q(t38, e.body);
    case "\\overarc":
    case "\\overparen":
    case "\\wideparen":
      return "arc over " + q(t38, e.body);
    case "\\underarc":
    case "\\underparen":
      return "arc under " + q(t38, e.body);
    case "\\mathop":
      return (c = vs(e.body)) != null ? c : q(t38, e.body);
    case "\\mathit":
      return (u = vs(e.body)) != null ? u : q(t38, e.body);
    case "\\mathrm":
      return (d = vs(e.body)) != null ? d : q(t38, e.body);
    case "\\mathbb":
      return "blackboard" + ((m = vs(e.body)) != null ? m : q(t38, e.body));
  }
  switch (e.type) {
    case "prompt":
      let b = e.body.length > 1 ? 'start input . <break time="500ms"/> ' + q(t38, e.body) + '. <break time="500ms"/> end input' : "blank";
      i += ' <break time="300ms"/> ' + b + '. <break time="700ms"/>' + ((p = e.correctness) != null ? p : "") + ' . <break time="700ms"/> ';
      break;
    case "array":
      let k = e.rows, S = e.environmentName;
      if (Object.keys(Ec).includes(S)) {
        i += ` begin ${Ec[S]} `;
        for (let C = 0; C < k.length; C++) {
          C > 0 && (i += ","), i += ` row ${C + 1} `;
          for (let _ = 0; _ < k[C].length; _++) _ > 0 && (i += ","), i += ` column ${_ + 1}: `, i += q("math", k[C][_]);
        }
        i += ` end ${Ec[S]} `;
      }
      break;
    case "group":
      l === "\\ne" ? i += " not equal " : (l === "\\not" && (i += " not "), i += q("math", e.body));
      break;
    case "root":
      i += q("math", e.body);
      break;
    case "genfrac":
      if (n = q("math", e.above), o = q("math", e.below), vo(e.above) && vo(e.below)) {
        let _ = { "1/2": " half ", "1/3": " one third ", "2/3": " two third", "1/4": " one quarter ", "3/4": " three quarter ", "1/5": " one fifth ", "2/5": " two fifths ", "3/5": " three fifths ", "4/5": " four fifths ", "1/6": " one sixth ", "5/6": " five sixths ", "1/8": " one eight ", "3/8": " three eights ", "5/8": " five eights ", "7/8": " seven eights ", "1/9": " one ninth ", "2/9": " two ninths ", "4/9": " four ninths ", "5/9": " five ninths ", "7/9": " seven ninths ", "8/9": " eight ninths " }[jh(e.above) + "/" + jh(e.below)];
        _ ? i = _ : i += n + " over " + o;
      } else i += ' the fraction <break time="150ms"/>' + n + ' over <break time="150ms"/>' + o + '.<break time="150ms"/> End fraction.<break time="150ms"/>';
      break;
    case "surd":
      if (a = q("math", e.body), e.hasEmptyBranch("above")) i += vo(e.body) ? " the square root of " + a + " , " : ' the square root of <break time="200ms"/>' + a + '. <break time="200ms"/> End square root';
      else {
        let C = q("math", e.above);
        C = C.trim();
        let _ = C.replace(/<mark([^/]*)\/>/g, "");
        _ === "3" ? i += ' the cube root of <break time="200ms"/>' + a + '. <break time="200ms"/> End cube root' : _ === "n" ? i += ' the nth root of <break time="200ms"/>' + a + '. <break time="200ms"/> End root' : i += ' the root with index: <break time="200ms"/>' + C + ', of <break time="200ms"/>' + a + '. <break time="200ms"/> End root';
      }
      break;
    case "leftright":
      {
        let C = e;
        i += (f = C.leftDelim ? Ln[C.leftDelim] : void 0) != null ? f : C.leftDelim, i += q("math", e.body), i += (y = C.rightDelim ? Ln[C.rightDelim] : void 0) != null ? y : C.rightDelim;
      }
      break;
    case "rule":
      break;
    case "overunder":
      break;
    case "overlap":
      break;
    case "macro":
      let A = l.replace(/^\\/g, ""), E = Ri()[A];
      E != null && E.expand ? i += q("math", e.body) : i += `${A} `;
      break;
    case "placeholder":
      i += "placeholder ";
      break;
    case "delim":
    case "sizeddelim":
    case "mord":
    case "minner":
    case "mbin":
    case "mrel":
    case "mpunct":
    case "mopen":
    case "mclose": {
      if (l === "\\mathbin" || l === "\\mathrel" || l === "\\mathopen" || l === "\\mathclose" || l === "\\mathpunct" || l === "\\mathord" || l === "\\mathinner") {
        i = q(t38, e.body);
        break;
      }
      let C = e.isDigit() ? e.asDigit() : e.value, _ = e.command;
      if ((e.type === "delim" || e.type === "sizeddelim") && (_ = e.value, C = _), t38 === "text") i += Jh(C);
      else {
        if (e.type === "mbin" && (i += '<break time="150ms"/>'), C) {
          let O = Ln[C] || (_ ? Ln[_.trim()] : "");
          if (O) i += " " + O;
          else {
            let I = _ ? bb(_.trim()) : "";
            i += I || r(C);
          }
        } else i += q("math", e.body);
        e.type === "mbin" && (i += '<break time="150ms"/>');
      }
      break;
    }
    case "mop":
    case "operator":
    case "extensible-symbol":
      if (e.value !== "​") {
        let C = e.command;
        if (C === "\\sum") if (!e.hasEmptyBranch("superscript") && !e.hasEmptyBranch("subscript")) {
          let _ = q("math", e.superscript);
          _ = _.trim();
          let O = q("math", e.subscript);
          O = O.trim(), i += ' the summation from <break time="200ms"/>' + O + '<break time="200ms"/> to  <break time="200ms"/>' + _ + '<break time="200ms"/> of <break time="150ms"/>', s = true;
        } else if (e.hasEmptyBranch("subscript")) i += " the summation of";
        else {
          let _ = q("math", e.subscript);
          _ = _.trim(), i += ' the summation from <break time="200ms"/>' + _ + '<break time="200ms"/> of <break time="150ms"/>', s = true;
        }
        else if (C === "\\prod") if (!e.hasEmptyBranch("superscript") && !e.hasEmptyBranch("subscript")) {
          let _ = q("math", e.superscript);
          _ = _.trim();
          let O = q("math", e.subscript);
          O = O.trim(), i += ' the product from <break time="200ms"/>' + O + '<break time="200ms"/> to <break time="200ms"/>' + _ + '<break time="200ms"/> of <break time="150ms"/>', s = true;
        } else if (e.hasEmptyBranch("subscript")) i += " the product  of ";
        else {
          let _ = q("math", e.subscript);
          _ = _.trim(), i += ' the product from <break time="200ms"/>' + _ + '<break time="200ms"/> of <break time="150ms"/>', s = true;
        }
        else if (C === "\\int") if (!e.hasEmptyBranch("superscript") && !e.hasEmptyBranch("subscript")) {
          let _ = q("math", e.superscript);
          _ = _.trim();
          let O = q("math", e.subscript);
          O = O.trim(), i += ' the integral from <break time="200ms"/>' + Tc(O) + '<break time="200ms"/> to <break time="200ms"/>' + Tc(_) + ' <break time="200ms"/> of ', s = true;
        } else i += ' the integral of <break time="200ms"/> ';
        else if (C === "\\operatorname" || C === "\\operatorname*") i += xb(e.body) + " ";
        else if (typeof e.value == "string") {
          let _ = (v = Ln[e.value]) != null ? v : e.command ? Ln[e.command] : void 0;
          i += _ || " " + e.value;
        } else e.command && (e.command === "\\mathop" ? i += q("math", e.body) : i += e.command.startsWith("\\") ? " " + e.command.slice(1) : " " + e.command);
      }
      break;
    case "enclose":
      a = q("math", e.body), i += " crossed out " + a + ". End crossed out.";
      break;
  }
  if (!s && !e.hasEmptyBranch("superscript")) {
    let b = q(t38, e.superscript);
    b = b.trim();
    let k = b.replace(/<[^>]*>/g, "");
    if (vo(e.superscript)) {
      if (t38 === "math") {
        let S = yb(e.superscript);
        S && (i += '<mark name="' + S + '"/>');
      }
      k === "′" ? i += " prime " : k === "2" ? i += " squared " : k === "3" ? i += " cubed " : Number.isNaN(Number.parseInt(k)) ? i += " to the " + b + "; " : i += ' to the <say-as interpret-as="ordinal">' + k + "</say-as> power; ";
    } else Number.isNaN(Number.parseInt(k)) ? i += " raised to the " + b + "; " : i += ' raised to the <say-as interpret-as="ordinal">' + k + "</say-as> power; ";
  }
  if (!s && !e.hasEmptyBranch("subscript")) {
    let b = q("math", e.subscript);
    b = b.trim(), i += vo(e.subscript) ? " sub " + b : " subscript " + b + ". End subscript. ";
  }
  return i;
}
function wt(t38) {
  var i, n;
  let e = globalThis.MathfieldElement;
  if (e.textToSpeechRules === "sre" && ("sre" in window || "SRE" in window)) {
    let o = G(t38);
    if (o) {
      e.textToSpeechMarkup && (e.textToSpeechRulesOptions = (i = e.textToSpeechRulesOptions) != null ? i : {}, e.textToSpeechRulesOptions = g(h({}, e.textToSpeechRulesOptions), { markup: e.textToSpeechMarkup }), e.textToSpeechRulesOptions.markup === "ssml" && (e.textToSpeechRulesOptions = g(h({}, e.textToSpeechRulesOptions), { markup: "ssml_step" })), e.textToSpeechRulesOptions = g(h({}, e.textToSpeechRulesOptions), { rate: e.speechEngineRate }));
      let a = (n = window.SRE) != null ? n : globalThis.sre.System.getInstance();
      e.textToSpeechRulesOptions && a.setupEngine(e.textToSpeechRulesOptions);
      let s = "";
      try {
        s = a.toSpeech(o);
      } catch (l) {
        console.error("MathLive 0.111.1: `SRE.toSpeech()` runtime error", l);
      }
      return s;
    }
    return "";
  }
  let r = q("math", t38);
  if (e.textToSpeechMarkup === "ssml") {
    let o = "";
    e.speechEngineRate && (o = '<prosody rate="' + e.speechEngineRate + '">'), r = '<?xml version="1.0"?><speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><amazon:auto-breaths>' + o + "<p><s>" + r + "</s></p>" + (o ? "</prosody>" : "") + "</amazon:auto-breaths></speak>";
  } else e.textToSpeechMarkup === "mac" && Ct() === "macos" ? r = r.replace(/<mark([^/]*)\/>/g, "").replace(/<emphasis>/g, "[[emph+]]").replace(/<\/emphasis>/g, "").replace(/<break time="(\d*)ms"\/>/g, "[[slc $1]]").replace(/<say-as[^>]*>/g, "").replace(/<\/say-as>/g, "") : r = r.replace(/<[^>]*>/g, "").replace(/\s{2,}/g, " ");
  return r;
}
function Wr(t38, e) {
  return typeof t38 == "string" ? t38 + wt(e) : wt(t38);
}
var Xh = "math input field";
function Dc(t38, e) {
  var i;
  if (t38 === e) return "";
  if (t38.nodeType === Node.TEXT_NODE) return (i = t38.textContent) != null ? i : "";
  let r = "";
  for (let n of Array.from(t38.childNodes)) r += Dc(n, e);
  return r;
}
function Bc(t38) {
  var l;
  if (!t38) return Xh;
  let e = t38.getRootNode(), r = (c) => (c != null ? c : "").replace(/\s+/g, " ").trim(), i = t38.getAttribute("aria-labelledby");
  if (i && typeof e.getElementById == "function") {
    let c = r(i.split(/\s+/).map((u) => e.getElementById(u)).map((u) => u ? Dc(u, t38) : "").join(" "));
    if (c) return c;
  }
  let n = r(t38.getAttribute("aria-label"));
  if (n) return n;
  let o = [];
  if (t38.id && typeof e.querySelectorAll == "function") for (let c of Array.from(e.querySelectorAll("label[for]"))) c.getAttribute("for") === t38.id && o.push(c);
  let a = (l = t38.parentElement) == null ? void 0 : l.closest("label");
  a && o.push(a);
  let s = r(o.map((c) => Dc(c, t38)).join(" "));
  return s || r(t38.getAttribute("title")) || Xh;
}
function Oc(t38) {
  var r;
  let e;
  if (t38.parent.type === "prompt") t38.parentBranch === "body" && (e = "prompt");
  else if (t38.parentBranch === "body") {
    if (t38.type === "first" && (t38.parent.type === "root" ? e = "mathfield" : t38.parent.type === "surd" ? e = "radicand" : t38.parent.type === "genfrac" ? e = "fraction" : t38.parent.type === "sizeddelim" && (e = "delimiter"), e)) return e;
    t38.type === "subsup" ? t38.superscript && t38.subscript ? e = "superscript and subscript" : t38.superscript ? e = "superscript" : t38.subscript && (e = "subscript") : t38.type && (e = (r = { accent: "accented", array: "array", box: "box", chem: "chemical formula", delim: "delimiter", enclose: "cross out", "extensible-symbol": "extensible symbol", error: "error", first: "first", genfrac: "fraction", group: "group", latex: "LaTeX", leftright: "delimiter", line: "line", subsup: "subscript-superscript", operator: "operator", overunder: "over-under", placeholder: "placeholder", rule: "rule", sizeddelim: "delimiter", space: "space", spacing: "spacing", surd: "square root", text: "text", prompt: "prompt", root: "math field", mop: "operator" }[t38.type]) != null ? r : "parent");
  } else if (t38.parent.type === "genfrac") {
    if (t38.parentBranch === "above") return "numerator";
    if (t38.parentBranch === "below") return "denominator";
  } else t38.parent.type === "surd" ? t38.parentBranch === "above" && (e = "index") : t38.parentBranch === "superscript" ? e = "superscript" : t38.parentBranch === "subscript" && (e = "subscript");
  return e != null ? e : "parent";
}
function Zh(t38, e, r, i) {
  let n = "";
  if (e === "plonk") {
    globalThis.MathfieldElement.playSound("plonk"), t38.flushInlineShortcutBuffer();
    return;
  }
  if (e === "delete") n = Wr("deleted: ", i);
  else if (e === "focus" || e.includes("move")) n = _b(t38.model, r), n += Mb(t38.model);
  else if (e === "replacement") n = Wr(t38.model.at(t38.model.position));
  else if (e === "line") {
    let o = Wr(t38.model.root).trim(), a = Bc(t38.host);
    t38.keyboardDelegate.setAriaLabel(o ? `${a}: ${o}` : a);
  } else n = i ? Wr(e + " ", i) : e;
  if (n && t38.ariaLiveText) {
    let o = t38.ariaLiveText.textContent.includes(" ") ? "   " : "   ";
    t38.ariaLiveText.textContent = n + o;
  }
}
function _b(t38, e) {
  if (Number.isNaN(e)) return "";
  let r = t38.at(e);
  if (!r || r.treeDepth <= t38.at(t38.position).treeDepth) return "";
  let i = "", n = r.parent, o = t38.at(t38.position).parent;
  for (; n !== t38.root && n !== o; ) i += `out of ${Oc(n)};`, n = n.parent;
  return i;
}
function Mb(t38) {
  if (!t38.selectionIsCollapsed) return `selected: ${Wr(t38.getAtoms(t38.selection))}`;
  let e = "", r = t38.at(t38.position);
  if (r.isFirstSibling && (e = `start of ${Oc(r)}: `), r.isLastSibling) {
    if (!r.isFirstSibling) {
      if (!r.parent.parent) return `${Wr(r)}; end of mathfield`;
      e = `${Wr(r)}; end of ${Oc(r)}`;
    }
  } else e += Wr(r);
  return e;
}
function Yh(t38, e) {
  let r = t38.at(t38.position);
  if (r.type === "composition") r.value = e;
  else {
    let { caret: i } = r;
    r.caret = void 0;
    let n = new sn(e, { mode: r.mode });
    n.caret = i, r.parent.addChildAfter(n, r), t38.position += 1;
  }
}
function Qh(t38) {
  let e = t38.at(t38.position);
  e.type === "composition" && (e.parent.removeChild(e), t38.position -= 1);
}
function wb(t38) {
  let e = t38.at(t38.position);
  for (; e && !Ze(e.parentBranch); ) e = e.parent;
  return [e.firstSibling, e.lastSibling];
}
function Sb(t38, e) {
  let r = t38.at(t38.position);
  for (; r && !(r.parent instanceof z); ) r = r.parent;
  if ((r == null ? void 0 : r.type) === "array" && r.environmentName, !r || !(r.parent instanceof z)) {
    let i = t38.at(t38.position);
    if (r = i, !r.parent.parent) {
      let n = t38.extractAtoms([t38.position, t38.lastOffset]), o = t38.extractAtoms([0, t38.position]), a;
      return e.endsWith("column") ? (o.length === 0 && (o = Ms()), n.length === 0 && (n = Ms()), a = ze("split", [[o, n]]), t38.root = a, _o(a, 0, 0) ? An(t38, a, 0, 0) : _o(a, 0, 1) ? An(t38, a, 0, 1) : t38.position = t38.offsetOf(i)) : (a = ze("lines", [[o], [n]]), t38.root = a, An(t38, a, 1, 0)), [void 0, [0, 0]];
    }
    if (r.parent instanceof J) {
      let n = r.parent, o = t38.extractAtoms([t38.position, t38.offsetOf(n.lastChild)]), a = t38.extractAtoms([t38.offsetOf(n.firstChild), t38.position]);
      a.length === 0 && (a = Ms()), o.length === 0 && (o = Ms());
      let s = "pmatrix", l = n.leftDelim, c = n.rightDelim;
      l === "(" && (c === ")" || c === "?") ? s = "pmatrix" : (l === "[" || l === "\\lbrack") && (c === "]" || c === "\\rbrack" || c === "?") ? s = "bmatrix" : l === "\\vert" && c === "\\vert" ? s = "vmatrix" : l === "\\Vert" && c === "\\Vert" ? s = "Vmatrix" : (l === "{" || l === "\\lbrace") && (c === "." || c === "?") && (s = "cases");
      let u = ze(s, e.endsWith("column") ? [[a, o]] : [[a], [o]]);
      return n.parent.addChildBefore(u, n), n.parent.removeChild(n), _o(u, 0, 0) ? An(t38, u, 0, 0) : e.endsWith("column") ? _o(u, 0, 1) ? An(t38, u, 0, 1) : t38.position = t38.offsetOf(r) : _o(u, 1, 0) ? An(t38, u, 1, 0) : t38.position = t38.offsetOf(r), [void 0, [0, 0]];
    }
  }
  return r && r.parent instanceof z ? [r.parent, r.parentBranch] : [void 0, [0, 0]];
}
function _o(t38, e, r) {
  let i = t38.getCell(e, r);
  return (i == null ? void 0 : i.length) !== 2 ? false : i[1].type === "placeholder";
}
function kb(t38, e, r, i) {
  let n = e.getCell(r, i);
  return n ? [t38.offsetOf(n[0]), t38.offsetOf(n[n.length - 1])] : -1;
}
function An(t38, e, r, i) {
  let n = kb(t38, e, r, i);
  typeof n != "number" && t38.setSelection(n);
}
function _s(t38, e, r, i, n) {
  let o = e.getCell(r, i);
  o && t38.setPositionHandlingPlaceholder(t38.offsetOf(o[n === "start" ? 0 : o.length - 1]));
}
function Mo(t38, e) {
  let [r, [i, n]] = Sb(t38, e);
  if (r) switch (e) {
    case "after row":
      r.addRowAfter(i), _s(t38, r, i + 1, 0, "end");
      break;
    case "after column":
      if (r.maxColumns <= r.colCount) {
        t38.announce("plonk");
        return;
      }
      r.addColumnAfter(n), _s(t38, r, i, n + 1, "end");
      break;
    case "before row":
      r.addRowBefore(i), _s(t38, r, i, 0, "start");
      break;
    case "before column":
      if (r.maxColumns <= r.colCount) {
        t38.announce("plonk");
        return;
      }
      r.addColumnBefore(n), _s(t38, r, i, n, "start");
      break;
  }
}
function Kc(t38) {
  var r;
  let e = t38.at(t38.position);
  if (!Ze(e.parentBranch) && e.parent !== t38.root && t38.root.type !== "root") return t38.announce("plonk"), false;
  if (!t38.contentWillChange({ inputType: "insertText" })) return false;
  if ((r = t38.parentEnvironment) != null && r.isMultiline) {
    t38.selectionIsCollapsed || t38.deleteAtoms(de(t38.selection));
    let [i, n] = wb(t38), o = t38.extractAtoms([t38.position, t38.offsetOf(n)]), a = t38.extractAtoms([t38.offsetOf(i), t38.position]), s = i.parent, [l, c] = i.parentBranch;
    return s.setCell(l, c, a), Mo(t38, "after row"), s.setCell(l + 1, c, o), t38.position = t38.offsetOf(s.getCell(l + 1, c)[0]), t38.contentDidChange({ inputType: "insertText" }), true;
  }
  return Mo(t38, "after row"), t38.contentDidChange({ inputType: "insertText" }), true;
}
function Lb(t38) {
  return t38.contentWillChange({ inputType: "insertText" }) ? (Mo(t38, "before row"), t38.contentDidChange({ inputType: "insertText" }), true) : false;
}
function Pc(t38) {
  return t38.contentWillChange({ inputType: "insertText" }) ? (Mo(t38, "after column"), t38.contentDidChange({ inputType: "insertText" }), true) : false;
}
function Ab(t38) {
  return t38.contentWillChange({ inputType: "insertText" }) ? (Mo(t38, "before column"), t38.contentDidChange({ inputType: "insertText" }), true) : false;
}
function Rc(t38, e) {
  if (!t38.contentWillChange({})) return false;
  t38.mathfield.snapshot();
  let r = ".", i = ".";
  switch (e) {
    case "pmatrix":
    case "pmatrix*":
      r = "(", i = ")";
      break;
    case "bmatrix":
    case "bmatrix*":
      r = "[", i = "]";
      break;
    case "Bmatrix":
    case "Bmatrix*":
      r = "\\lbrace", i = "\\rbrace";
      break;
    case "vmatrix":
    case "vmatrix*":
      r = "\\vert", i = "\\vert";
      break;
    case "Vmatrix":
    case "Vmatrix*":
      r = "\\Vert", i = "\\Vert";
      break;
    case "matrix":
    case "matrix*":
      r = ".", i = ".";
      break;
    case "cases":
    case "dcases":
      r = "\\lbrace";
      break;
    case "rcases":
      i = "\\rbrace";
      break;
  }
  let n = t38.at(t38.position), o = n.type === "array" ? n : t38.parentEnvironment;
  return o.environmentName = e, o.leftDelim = r, o.rightDelim = i, t38.contentDidChange({}), true;
}
function ep(t38, e) {
  let r = t38.at(t38.position);
  for (; r && !(Array.isArray(r.parentBranch) && r.parent instanceof z); ) r = r.parent;
  if (Array.isArray(r == null ? void 0 : r.parentBranch) && (r == null ? void 0 : r.parent) instanceof z) {
    let i = r.parent, n = r.parentBranch, o;
    switch (e) {
      case "row":
        if (i.rowCount > 1) {
          i.removeRow(n[0]);
          let a = i.getCell(Math.max(0, n[0] - 1), n[1]);
          o = t38.offsetOf(a[a.length - 1]);
        }
        break;
      case "column":
        if (i.colCount > i.minColumns) {
          i.removeColumn(n[1]);
          let a = i.getCell(n[0], Math.max(0, n[1] - 1));
          o = t38.offsetOf(a[a.length - 1]);
        }
        break;
    }
    o !== void 0 && t38.setPositionHandlingPlaceholder(o);
  }
}
function Cb(t38) {
  return t38.contentWillChange({ inputType: "deleteContent" }) ? (ep(t38, "row"), t38.contentDidChange({ inputType: "deleteContent" }), true) : false;
}
function Eb(t38) {
  return t38.contentWillChange({ inputType: "deleteContent" }) ? (ep(t38, "column"), t38.contentDidChange({ inputType: "deleteContent" }), true) : false;
}
pe({ addRowAfter: Kc, addColumnAfter: Pc, addRowBefore: Lb, addColumnBefore: Ab, removeRow: Cb, removeColumn: Eb, setEnvironment: Rc }, { target: "model", canUndo: true, changeContent: true, changeSelection: true });
function Ms() {
  return [new Me()];
}
var Ss = class Ss2 {
  constructor(e) {
    this.recording = false;
    this.model = e, this.reset();
  }
  reset() {
    this.stack = [], this.index = -1, this.lastOp = "";
  }
  startRecording() {
    this.recording = true;
  }
  stopRecording() {
    this.recording = false;
  }
  canUndo() {
    return this.index - 1 >= 0;
  }
  canRedo() {
    return this.stack.length - 1 > this.index;
  }
  stopCoalescing(e) {
    e && this.index >= 0 && (this.stack[this.index].selection = e), this.lastOp = "";
  }
  undo() {
    if (!this.canUndo()) return false;
    let e = this.stack[this.index - 1];
    return this.index -= 1, this.lastOp = "", this.model.setState(e, { silenceNotifications: false, type: "undo" }), true;
  }
  redo() {
    if (!this.canRedo()) return false;
    let e = this.stack[this.index + 1];
    return this.index += 1, this.lastOp = "", this.model.setState(e, { silenceNotifications: false, type: "redo" }), true;
  }
  pop() {
    this.canUndo() && (this.stack.splice(this.index, this.stack.length - this.index), this.index -= 1);
  }
  snapshot(e) {
    return this.recording ? (e && e === this.lastOp && this.pop(), this.stack.splice(this.index + 1, this.stack.length - this.index - 1), this.stack.push(this.model.getState()), this.index += 1, this.stack.length > Ss2.maximumDepth && (this.stack.shift(), this.index -= 1), this.lastOp = e != null ? e : "", true) : false;
  }
};
Ss.maximumDepth = 1e3;
var ws = Ss;
function wo(t38, e, r, i) {
  var o, a, s, l, c, u;
  let n = r.parent;
  if (Ze(i) && r instanceof z && r.isMultiline && Tb(t38, r, i[0], e)) return true;
  if (n && r instanceof J) {
    let d = !i && e === "forward" || i === "body" && e === "backward", m = d ? t38.offsetOf(r.firstChild) : t38.offsetOf(r.lastChild);
    return d ? r.rightDelim !== "?" && r.rightDelim !== "." ? (r.leftDelim = ".", r.isDirty = true) : (n.addChildrenAfter(r.removeBranch("body"), r), n.removeChild(r), m--) : r.leftDelim !== "?" && r.leftDelim !== "." ? (r.rightDelim = ".", r.isDirty = true) : (n.addChildrenAfter(r.removeBranch("body"), r), n.removeChild(r), m--), t38.position = m, true;
  }
  if (n && r.type === "surd") {
    if (e === "forward" && !i || e === "backward" && i === "body") {
      let d = r.leftSibling;
      r.hasChildren && n.addChildrenAfter(r.removeBranch("body"), r), n.removeChild(r), t38.position = t38.offsetOf(d);
    } else e === "forward" && i === "body" ? t38.position = t38.offsetOf(r) : !i && e === "backward" ? r.hasChildren ? t38.position = t38.offsetOf(r.lastChild) : (t38.position = Math.max(0, t38.offsetOf(r) - 1), n.removeChild(r)) : i === "above" && (r.hasEmptyBranch("above") && r.removeBranch("above"), e === "backward" ? t38.position = t38.offsetOf(r.leftSibling) : t38.position = t38.offsetOf(r.body[0]));
    return true;
  }
  if (n && (r.type === "box" || r.type === "enclose")) {
    let d = i && e === "backward" || !i && e === "forward" ? r.leftSibling : r.lastChild;
    return n.addChildrenAfter(r.removeBranch("body"), r), n.removeChild(r), t38.position = t38.offsetOf(d), true;
  }
  if (r.type === "genfrac" || r.type === "overunder") {
    if (!i) return r.type === "overunder" && r.hasEmptyBranch("body") || r.type === "genfrac" && r.hasEmptyBranch("below") && r.hasEmptyBranch("above") ? false : (t38.position = t38.offsetOf(e === "forward" ? r.firstChild : r.lastChild), true);
    let d = Mt.fractionNavigationOrder === "numerator-denominator" ? "above" : "below", m = d === "above" ? "below" : "above";
    if (n && (e === "forward" && i === d || e === "backward" && i === m)) {
      let p = r.removeBranch(d), f = r.removeBranch(m);
      return n.addChildrenAfter([...p, ...f], r), n.removeChild(r), t38.position = t38.offsetOf(p.length > 0 ? p[p.length - 1] : f[0]), true;
    }
    return e === "backward" ? t38.position = t38.offsetOf(r.leftSibling) : t38.position = t38.offsetOf(r), true;
  }
  if (r.type === "extensible-symbol" || r.type === "subsup" || r.type === "operator") {
    if (!i && e === "forward") return false;
    if (!i) {
      if (r.subscript || r.superscript) {
        let d = e === "forward" ? (s = (o = r.subscript) == null ? void 0 : o[0]) != null ? s : (a = r.superscript) == null ? void 0 : a[0] : (u = (l = r.superscript) == null ? void 0 : l[0].lastSibling) != null ? u : (c = r.subscript) == null ? void 0 : c[0].lastSibling;
        return d && (t38.position = t38.offsetOf(d)), true;
      }
      return false;
    }
    if (!r.hasChildren && r.type === "subsup") {
      let d = e === "forward" ? t38.offsetOf(r) : Math.max(0, t38.offsetOf(r) - 1);
      return r.parent.removeChild(r), t38.position = d, true;
    }
    if (i && r.hasEmptyBranch(i)) {
      if (r.removeBranch(i), r.type === "subsup" && !r.subscript && !r.superscript) {
        let d = e === "forward" ? t38.offsetOf(r) : Math.max(0, t38.offsetOf(r) - 1);
        return r.parent.removeChild(r), t38.position = d, true;
      }
      return i === "subscript" && e === "backward" ? t38.position = t38.offsetOf(r.firstChild) - 1 : i === "superscript" && e === "backward" ? r.subscript ? t38.position = t38.offsetOf(r.subscript[0].lastSibling) : t38.position = t38.offsetOf(r.firstChild) - 1 : t38.position = t38.offsetOf(r), true;
    }
    if (i === "subscript") if (e === "backward") {
      let d = t38.offsetOf(r.firstChild) - 1;
      t38.position = d;
    } else r.superscript ? t38.position = t38.offsetOf(r.superscript[0]) : t38.position = t38.offsetOf(r);
    else i === "superscript" && (e === "backward" && r.subscript ? t38.position = t38.offsetOf(r.subscript[0].lastSibling) : e === "backward" ? t38.position = t38.offsetOf(r.firstChild) - 1 : t38.position = t38.offsetOf(r));
    return true;
  }
  if ((n == null ? void 0 : n.type) === "genfrac" && !i && r.type !== "first") {
    let d = t38.offsetOf(r.leftSibling);
    return n.removeChild(r), n.hasEmptyBranch("above") && n.hasEmptyBranch("below") ? (d = t38.offsetOf(n.leftSibling), n.parent.removeChild(n), t38.announce("delete", void 0, [n]), t38.position = d, true) : (t38.announce("delete", void 0, [r]), t38.position = d, true);
  }
  if (e === "backward" && ((n == null ? void 0 : n.command) === "\\ln" || (n == null ? void 0 : n.command) === "\\log") && r.parentBranch !== "body") {
    let d = t38.offsetOf(n.leftSibling);
    return n.parent.removeChild(n), t38.announce("delete", void 0, [n]), t38.position = d, true;
  }
  return false;
}
function tp(t38) {
  return !t38.mathfield.isSelectionEditable || !t38.contentWillChange({ inputType: "deleteContentBackward" }) ? false : t38.selectionIsCollapsed ? t38.deferNotifications({ content: true, selection: true, type: "deleteContentBackward" }, () => {
    var i;
    let e = t38.at(t38.position);
    if (e && wo(t38, "backward", e)) return;
    if (e != null && e.isFirstSibling) {
      if (wo(t38, "backward", e.parent, e.parentBranch)) return;
      e = null;
    }
    if (!e) {
      t38.announce("plonk");
      return;
    }
    let r = e.parent;
    if (t38.position = t38.offsetOf(e.leftSibling), r.removeChild(e), t38.announce("delete", void 0, [e]), r.type === "latexgroup" && r.hasEmptyBranch("body")) {
      let n = t38.offsetOf(r.leftSibling);
      (i = r.parent) == null || i.removeChild(r), t38.position = Math.max(0, n);
    }
    t38.root.hasEmptyBranch("body") && t38.mathfield.flushInlineShortcutBuffer();
  }) : lt(t38, de(t38.selection), "deleteContentBackward");
}
function rp(t38) {
  return !t38.mathfield.isSelectionEditable || !t38.contentWillChange({ inputType: "deleteContentForward" }) ? false : t38.selectionIsCollapsed ? t38.deferNotifications({ content: true, selection: true, type: "deleteContentForward" }, () => {
    var n, o, a;
    let e = t38.at(t38.position).rightSibling;
    if (e && wo(t38, "forward", e)) return;
    if (e) {
      if (t38.at(t38.position).isLastSibling && wo(t38, "forward", e.parent, e.parentBranch)) return;
    } else {
      if (e = t38.at(t38.position), e.isLastSibling && wo(t38, "forward", e.parent, e.parentBranch)) return;
      e = void 0;
    }
    if (t38.position === t38.lastOffset || !e) {
      t38.announce("plonk");
      return;
    }
    let r = e.parent;
    r.removeChild(e);
    let i = (n = t38.at(t38.position)) == null ? void 0 : n.rightSibling;
    for (; (i == null ? void 0 : i.type) === "subsup"; ) i.parent.removeChild(i), i = (o = t38.at(t38.position)) == null ? void 0 : o.rightSibling;
    if (t38.announce("delete", void 0, [e]), r.type === "latexgroup" && r.hasEmptyBranch("body")) {
      let s = t38.offsetOf(r.leftSibling);
      (a = r.parent) == null || a.removeChild(r), t38.position = Math.max(0, s);
    }
    t38.root.hasEmptyBranch("body") && t38.mathfield.flushInlineShortcutBuffer();
  }) : lt(t38, de(t38.selection), "deleteContentForward");
}
function lt(t38, e, r) {
  let i = t38.getAtoms(e);
  if (i.length > 0 && i[0].parent) {
    let n = i[0];
    for (; n && !(n instanceof z); ) n = n.parent;
    let o = i[i.length - 1];
    for (; o && !(o instanceof z); ) o = o.parent;
    if (n && n instanceof z) {
      let u = n;
      if (u && o === u && u.isMultiline) {
        let [d, m] = [Math.min(t38.position, t38.anchor), Math.max(t38.position, t38.anchor)], [p, f] = t38.at(d).parentBranch, [y, v] = t38.at(m).parentBranch;
        if (y - p + 1 >= 2) return t38.deferNotifications({ content: true, selection: true, type: r }, () => {
          var _;
          let k = u.getCell(p, f), S = u.getCell(y, v);
          if (!k || !S) return;
          t38.extractAtoms([d, m]);
          let A = u.getCell(p, f);
          u.getCell(y, v);
          for (let O = y - 1; O > p; O--) u.removeRow(O);
          if (p !== y) {
            let O = u.getCell(p + 1, f);
            if (A && O) {
              let I = [...A.filter((V) => V.type !== "first"), ...O.filter((V) => V.type !== "first")];
              u.setCell(p, f, I), u.removeRow(p + 1);
            }
          }
          let C = u.getCell(p, f);
          if (C) {
            let O = A ? A.filter((I) => I.type !== "first").length : 0;
            t38.position = t38.offsetOf((_ = C[O]) != null ? _ : C[0]);
          } else t38.position = d;
          u.isDirty = true;
        });
      }
    }
    let a = i[0].parent.firstChild;
    a.type === "first" && (a = a.rightSibling);
    let s = i[i.length - 1].parent.lastChild, l = i[0];
    l.type === "first" && (l = l.rightSibling);
    let c = i[i.length - 1];
    if (l === a && c === s) {
      let u = i[0].parent;
      u.parent && u.type !== "prompt" && (e = [t38.offsetOf(u.leftSibling), t38.offsetOf(u)]);
    }
    if (i.length === 1 && i[0].type === "placeholder" && i[0].parent.type === "genfrac") {
      let u = i[0].parent, d = i[0].parentBranch === "below" ? "above" : "below", m = t38.offsetOf(u.leftSibling);
      return t38.deferNotifications({ content: true, selection: true, type: r }, () => {
        var f, y;
        let p = u.removeBranch(d);
        if (p.length === 1 && p[0].type === "placeholder") (y = u.parent) == null || y.removeChild(u), t38.position = Math.max(0, m);
        else {
          let v = u.parent.addChildrenAfter(p, u);
          (f = u.parent) == null || f.removeChild(u), t38.position = t38.offsetOf(v);
        }
      });
    }
  }
  return t38.deferNotifications({ content: true, selection: true, type: r }, () => {
    let n = /* @__PURE__ */ new Map();
    if (i.length > 0) {
      let a = i[0], s = i[i.length - 1], l = /* @__PURE__ */ new Set(), c = a.parent;
      for (; c; ) (c.type === "surd" || c.type === "box" || c.type === "enclose" || c.type === "leftright" || c.type === "genfrac" || c.type === "overunder") && c.parent && l.add(c), c = c.parent;
      let u = /* @__PURE__ */ new Set();
      for (c = s.parent; c; ) (c.type === "surd" || c.type === "box" || c.type === "enclose" || c.type === "leftright" || c.type === "genfrac" || c.type === "overunder") && c.parent && u.add(c), c = c.parent;
      for (let d of i) for (c = d.parent; c; ) {
        if ((c.type === "surd" || c.type === "box" || c.type === "enclose" || c.type === "leftright" || c.type === "genfrac" || c.type === "overunder") && c.parent) {
          n.has(c) || n.set(c, { containsStart: l.has(c), containsEnd: u.has(c) });
          break;
        }
        c = c.parent;
      }
    }
    let o = Math.min(...e);
    t38.deleteAtoms(e);
    for (let [a, s] of n) {
      if (!a.parent) continue;
      let l = s.containsStart !== s.containsEnd;
      if (a.type === "surd" || a.type === "box" || a.type === "enclose" || a.type === "leftright") {
        let c = a.branch("body");
        if (!c || c.length === 0 || c.length === 1 && c[0].type === "placeholder") {
          let d = t38.offsetOf(a.leftSibling);
          a.parent.removeChild(a), t38.position = Math.max(0, d);
        } else if (l && !s.containsStart && s.containsEnd) {
          let d = t38.offsetOf(a.leftSibling), m = a.removeBranch("body");
          m && m.length > 0 && a.parent.addChildrenAfter(m, a), a.parent.removeChild(a), t38.position = Math.max(0, d);
        }
      }
      if (a.type === "genfrac") {
        let c = a.branch("above"), u = a.branch("below"), d = !c || c.length === 0 || c.length === 1 && c[0].type === "placeholder", m = !u || u.length === 0 || u.length === 1 && u[0].type === "placeholder";
        if (d && m) {
          let p = t38.offsetOf(a.leftSibling);
          a.parent.removeChild(a), t38.position = Math.max(0, p);
        } else if (d && !m) {
          let p = t38.offsetOf(a.leftSibling), f = a.removeBranch("below");
          f && f.length > 0 && a.parent.addChildrenAfter(f, a), a.parent.removeChild(a), t38.position = Math.max(0, p);
        } else if (!d && m) {
          let p = t38.offsetOf(a.leftSibling), f = a.removeBranch("above");
          f && f.length > 0 && a.parent.addChildrenAfter(f, a), a.parent.removeChild(a), t38.position = Math.max(0, p);
        } else if (l && !s.containsStart && s.containsEnd && !d && !m) {
          let p = t38.offsetOf(a.leftSibling), f = a.removeBranch("above");
          f && f.length > 0 && a.parent.addChildrenAfter(f, a), a.parent.removeChild(a), t38.position = Math.max(0, p);
        }
      }
    }
    n.size === 0 && (t38.position = o), t38.root.hasEmptyBranch("body") && t38.mathfield.flushInlineShortcutBuffer();
  });
}
function Tb(t38, e, r, i) {
  if (!(e instanceof z) || !e.isMultiline || e.rows.length === 1 || e.rows[r].length > 1) return false;
  let n = e.getCell(r, 0);
  if (!n) return false;
  if (e.removeRow(r), i === "backward") {
    let o = e.getCell(r - 1, 0);
    if (!o) return t38.position = t38.offsetOf(e), true;
    o.length > 0 ? t38.position = t38.offsetOf(o[o.length - 1]) : t38.position = t38.offsetOf(e), e.setCell(r - 1, 0, [...o, ...n]);
  } else {
    let o = e.getCell(r, 0);
    if (!o) return t38.position = t38.offsetOf(e), true;
    o.length > 0 ? t38.position = t38.offsetOf(o[0]) : t38.position = t38.offsetOf(e), e.setCell(r, 0, [...n, ...o]);
  }
  return true;
}
function Db(t38, e, r) {
  var o, a;
  if (t38.at(e).mode !== "text") return e;
  let i = r === "backward" ? -1 : 1, n;
  if (Qr.test(t38.at(e).value)) {
    let s = e, l;
    do
      l = t38.at(s).mode === "text" && Qr.test(t38.at(s).value), s += i;
    while (t38.at(s) && l);
    n = t38.at(s) ? s - 2 * i : s - i;
  } else if (/\s/.test(t38.at(e).value)) {
    let s = e;
    for (; ((o = t38.at(s)) == null ? void 0 : o.mode) === "text" && /\s/.test(t38.at(s).value); ) s += i;
    if (!t38.at(s)) n = s - i;
    else {
      let l = true;
      do
        l = t38.at(s).mode === "text" && !/\s/.test(t38.at(s).value), s += i;
      while (t38.at(s) && l);
      n = t38.at(s) ? s - 2 * i : s - i;
    }
  } else {
    let s = e;
    for (; ((a = t38.at(s)) == null ? void 0 : a.mode) === "text" && !/\s/.test(t38.at(s).value); ) s += i;
    n = t38.at(s) ? s : s - i;
    let l = true;
    for (; t38.at(s) && l; ) l = t38.at(s).mode === "text" && /\s/.test(t38.at(s).value), l && (n = s), s += i;
    n = t38.at(s) ? s - 2 * i : s - i;
  }
  return n - (i > 0 ? 0 : 1);
}
function St(t38, e, r) {
  var a, s, l, c, u, d, m, p;
  let i = t38.position;
  (a = r == null ? void 0 : r.extend) != null && a || t38.collapseSelection(e);
  let n = t38.at(t38.position);
  if (e === "forward" && (n.type === "subsup" ? (n = n.rightSibling, n || (n = t38.at(t38.position + 1))) : n = t38.at(t38.position + 1)), !n) return t38.announce("plonk"), false;
  let o = t38.offsetOf(n);
  if (n instanceof We) o = Db(t38, o, e);
  else if (n instanceof he) if (n.isSuggestion) for (; n && n instanceof he; ) n.isSuggestion = false, o = t38.offsetOf(n), n = n.rightSibling;
  else if (e === "forward") {
    if (n = n.rightSibling, !n || !(n instanceof he)) return t38.announce("plonk"), false;
    for (; n && n instanceof he && /[a-zA-Z\*]/.test(n.value); ) o = t38.offsetOf(n), n = n.rightSibling;
  } else {
    if (n = n.leftSibling, !n || !(n instanceof he)) return t38.announce("plonk"), false;
    for (; n && n instanceof he && /[a-zA-Z\*]/.test(n.value); ) o = t38.offsetOf(n), n = n.leftSibling;
  }
  else if (e === "forward" && n.type === "mopen") {
    let f = 0;
    do
      n.type === "mopen" ? f += 1 : n.type === "mclose" && (f -= 1), n = n.rightSibling;
    while (!n.isLastSibling && f !== 0);
    o = t38.offsetOf(n.leftSibling);
  } else if (e === "backward" && n.type === "mclose") {
    let f = 0;
    do
      n.type === "mopen" ? f += 1 : n.type === "mclose" && (f -= 1), n = n.leftSibling;
    while (!n.isFirstSibling && f !== 0);
    o = t38.offsetOf(n);
  } else if (e === "backward") if (n.type === "first") for (; o > 0 && n.type === "first"; ) o -= 1, n = t38.at(o);
  else {
    let f = n.type;
    n.type === "subsup" && (o = t38.offsetOf(t38.at(o).leftSibling)), o -= 1;
    let y = (s = t38.at(o)) == null ? void 0 : s.type;
    for (; o >= 0 && y === f; ) ((l = t38.at(o)) == null ? void 0 : l.type) === "subsup" ? o = t38.offsetOf(t38.at(o).leftSibling) : o -= 1, y = t38.at(o).type;
  }
  else {
    let { type: f } = n, y = (c = t38.at(o)) == null ? void 0 : c.type, { lastOffset: v } = t38;
    for (; o <= v && (y === f || y === "subsup"); ) {
      for (; ((u = t38.at(o).rightSibling) == null ? void 0 : u.type) === "subsup"; ) o = t38.offsetOf(t38.at(o).rightSibling);
      o += 1, y = (d = t38.at(o)) == null ? void 0 : d.type;
    }
    o -= 1;
  }
  if ((m = r == null ? void 0 : r.extend) != null && m) {
    if (!t38.setSelection(t38.anchor, o)) return t38.announce("plonk"), false;
    t38.announce("move", i);
  } else {
    if (o === t38.position) return t38.announce("plonk"), false;
    (p = r == null ? void 0 : r.delete) != null && p ? e === "forward" ? lt(t38, [i, o], "deleteWordForward") : (lt(t38, [i, o], "deleteWordBackward"), t38.position = o) : (t38.position = o, t38.announce("move", i));
  }
  return t38.mathfield.stopCoalescingUndo(), true;
}
function ct(t38, e, r) {
  var o, a;
  if (r = r != null ? r : { extend: false }, t38.mathfield.styleBias = e === "backward" ? "right" : "left", e !== "forward") {
    let [s, l] = ls(t38);
    s !== void 0 && l !== void 0 && t38.deleteAtoms([s, l]);
  }
  if (e === "upward") return Bb(t38, r);
  if (e === "downward") return Kb(t38, r);
  if (r.extend) {
    let s = ks(t38, t38.position, e);
    s < 0 && (s = 0), s > t38.lastOffset && (s = t38.lastOffset);
    let l = t38.setSelection(t38.anchor, s);
    return t38.mathfield.stopCoalescingUndo(), l;
  }
  if (t38.selectionIsPlaceholder) {
    t38.collapseSelection(e);
    let s = ct(t38, e);
    return t38.mathfield.stopCoalescingUndo(), s;
  }
  let i = t38.position, n = i;
  if (t38.collapseSelection(e) ? (i = t38.position, ip(t38, i) || (i = ks(t38, i, e))) : i = ks(t38, i, e), i < 0 || i > t38.lastOffset) {
    let s = true;
    return t38.silenceNotifications || (s = (a = (o = t38.mathfield.host) == null ? void 0 : o.dispatchEvent(new CustomEvent("move-out", { detail: { direction: e }, cancelable: true, bubbles: true, composed: true }))) != null ? a : true), s && t38.announce("plonk"), s;
  }
  return t38.setPositionHandlingPlaceholder(i), t38.mathfield.stopCoalescingUndo(), t38.announce("move", n), true;
}
function ks(t38, e, r) {
  return e = e + (r === "forward" ? 1 : -1), e < 0 || e > t38.lastOffset || ip(t38, e) ? e : ks(t38, e, r);
}
function ip(t38, e) {
  var n;
  let r = t38.at(e), i = r.parent;
  for (; i && !i.inCaptureSelection; ) i = i.parent;
  return !(i != null && i.inCaptureSelection || (n = r.parent) != null && n.skipBoundary && (!r.isFirstSibling && r.isLastSibling || r.type === "first") || t38.mathfield.hasEditablePrompts && !r.parentPrompt);
}
function Ob(t38, e, r) {
  let i = 1 / 0, n = 0;
  for (; n < e.length; n++) {
    let o = e[n], a = t38.getHTMLElement(o);
    if (!a) continue;
    let s = dc(a).right, l = Math.abs(r - s);
    if (l <= i) i = l;
    else break;
  }
  return e[n - 1];
}
function Ls(t38, e, r, i, n) {
  let o = t38.mathfield.hasEditablePrompts, a = o ? r.filter((c) => c.type === "prompt" && !c.captureSelection) : r, s = dc(t38.mathfield.getHTMLElement(e)).right, l = t38.offsetOf(Ob(t38.mathfield, a, s)) - (o ? 1 : 0);
  if (i) {
    let [c, u] = t38.selection.ranges[0], d;
    l < (n === "up" ? c : u) ? d = { ranges: [[l, u]], direction: "backward" } : d = { ranges: [[c, l]], direction: "forward" }, t38.setSelection(d);
  } else t38.setPositionHandlingPlaceholder(l);
  t38.announce(`move ${n}`);
}
function Bb(t38, e) {
  var a, s;
  let r = (a = e == null ? void 0 : e.extend) != null ? a : false;
  r || t38.collapseSelection("backward");
  let i = () => {
    var c, u;
    let l = true;
    return t38.silenceNotifications || (l = (u = (c = t38.mathfield.host) == null ? void 0 : c.dispatchEvent(new CustomEvent("move-out", { detail: { direction: "upward" }, cancelable: true, bubbles: true, composed: true }))) != null ? u : true), t38.announce(l ? "line" : "plonk"), l;
  }, n = t38.at(t38.position), o = n;
  for (; o && o.parentBranch !== "below" && !(Array.isArray(o.parentBranch) && o.parent instanceof z); ) o = o.parent;
  if (Array.isArray(o == null ? void 0 : o.parentBranch) && o.parent instanceof z) {
    let l = o.parent;
    if (o.parentBranch[0] < 1) return i();
    let c = o.parentBranch[0] - 1, u = l.getCell(c, o.parentBranch[1]);
    if (!u.some((m) => m.type === "prompt" && !m.captureSelection) && t38.mathfield.hasEditablePrompts) return i();
    Ls(t38, n, u, r, "up");
  } else if (o) {
    let l = (s = o.parent.branch("above")) != null ? s : o.parent.createBranch("above");
    if (!l.some((u) => u.type === "prompt" && u.placeholderId) && t38.mathfield.hasEditablePrompts) return i();
    Ls(t38, n, l, r, "up");
  } else return i();
  return t38.mathfield.stopCoalescingUndo(), true;
}
function Kb(t38, e) {
  var a, s;
  let r = (a = e == null ? void 0 : e.extend) != null ? a : false;
  r || t38.collapseSelection("forward");
  let i = () => {
    var c, u;
    let l = true;
    return t38.silenceNotifications || (l = (u = (c = t38.mathfield.host) == null ? void 0 : c.dispatchEvent(new CustomEvent("move-out", { detail: { direction: "downward" }, cancelable: true, bubbles: true, composed: true }))) != null ? u : true), t38.announce(l ? "line" : "plonk"), l;
  }, n = t38.at(t38.position), o = n;
  for (; o && o.parentBranch !== "above" && !(Ze(o.parentBranch) && o.parent instanceof z); ) o = o.parent;
  if (Ze(o == null ? void 0 : o.parentBranch) && o.parent instanceof z) {
    let l = o.parent;
    if (o.parentBranch[0] + 1 > l.rows.length - 1) return i();
    let c = o.parentBranch[0] + 1, u = l.getCell(c, o.parentBranch[1]);
    if (!u.some((m) => m.type === "prompt" && !m.captureSelection) && t38.mathfield.hasEditablePrompts) return i();
    Ls(t38, n, u, r, "down");
  } else if (o) {
    let l = (s = o.parent.branch("below")) != null ? s : o.parent.createBranch("below");
    if (!l.some((u) => u.type === "prompt") && t38.mathfield.hasEditablePrompts) return i();
    Ls(t38, n, l, r, "down");
  } else return i();
  return true;
}
function zc(t38) {
  let e = t38.position, r = t38.at(e).parent;
  return r != null && r.parent ? (t38.position = t38.offsetOf(r), t38.mathfield.stopCoalescingUndo(), t38.announce("move", e), true) : (t38.announce("plonk"), false);
}
function Pb(t38) {
  let e = 0, r = t38.at(t38.position), i = false;
  for (; r; ) r.hasEmptyBranch("superscript") ? r.hasEmptyBranch("subscript") || (i = false) : (e += 1, i = true), r = r.parent;
  return i ? e : 0;
}
function Rb(t38) {
  let e = 0, r = t38.at(t38.position), i = false;
  for (; r; ) r.hasEmptyBranch("subscript") ? r.hasEmptyBranch("superscript") || (i = false) : (e += 1, i = true), r = r.parent;
  return i ? e : 0;
}
function np(t38) {
  if (t38.collapseSelection(), Pb(t38) >= t38.mathfield.options.scriptDepth[1]) return t38.announce("plonk"), false;
  let e = t38.at(t38.position);
  if (e.subsupPlacement === void 0) {
    let r = e.rightSibling;
    (r == null ? void 0 : r.type) !== "subsup" && (r = new cr({ style: e.style }), e.parent.addChildAfter(r, e)), e = r;
  }
  return e.createBranch("superscript"), t38.setSelection(t38.getSiblingsRange(t38.offsetOf(e.superscript[0]))), true;
}
function op(t38) {
  if (t38.collapseSelection(), Rb(t38) >= t38.mathfield.options.scriptDepth[0]) return t38.announce("plonk"), false;
  let e = t38.at(t38.position);
  if (e.subsupPlacement === void 0) {
    let r = e.rightSibling;
    (r == null ? void 0 : r.type) !== "subsup" && (r = new cr({ style: e.style }), e.parent.addChildAfter(r, e)), e = r;
  }
  return e.createBranch("subscript"), t38.setSelection(t38.getSiblingsRange(t38.offsetOf(e.subscript[0]))), true;
}
function Ib() {
  function t38(l) {
    let c = [], u = [];
    return [...l.querySelectorAll(`input, select, textarea, a[href], button,
        [tabindex], audio[controls], video[controls],
        [contenteditable]:not([contenteditable="false"]), details>summary`)].filter(e).forEach((m, p) => {
      let f = i(m);
      f === 0 ? c.push(m) : u.push({ documentOrder: p, tabIndex: f, node: m });
    }), u.sort((m, p) => m.tabIndex === p.tabIndex ? m.documentOrder - p.documentOrder : m.tabIndex - p.tabIndex).map((m) => m.node).concat(c);
  }
  function e(l) {
    return !(!r(l) || n(l) || i(l) < 0);
  }
  function r(l) {
    return !(l.disabled || l.type === "hidden" && l.tagName.toUpperCase() === "INPUT" || s(l));
  }
  function i(l) {
    var u;
    let c = Number.parseInt((u = l.getAttribute("tabindex")) != null ? u : "NaN", 10);
    return Number.isNaN(c) ? l.contentEditable === "true" || (l.nodeName === "AUDIO" || l.nodeName === "VIDEO") && l.getAttribute("tabindex") === null ? 0 : l.tabIndex : c;
  }
  function n(l) {
    return l.tagName.toUpperCase() === "INPUT" && l.type === "radio" && !a(l);
  }
  function o(l, c) {
    for (let u of l) if (u.checked && u.form === c) return u;
    return null;
  }
  function a(l) {
    var m;
    if (!l.name) return true;
    let u = ((m = l.form) != null ? m : l.ownerDocument).querySelectorAll('input[type="radio"][name="' + l.name + '"]'), d = o(u, l.form);
    return !d || d === l;
  }
  function s(l) {
    if (!Le() || l === document.activeElement || l.contains(document.activeElement)) return false;
    if (getComputedStyle(l).visibility === "hidden") return true;
    let c = l.getBoundingClientRect();
    if (c.width === 0 || c.height === 0) return true;
    for (; l; ) {
      if (getComputedStyle(l).display === "none") return true;
      l = l.parentElement;
    }
    return false;
  }
  return Le() ? t38(document.body) : [];
}
function Ke(t38, e, r = "forward") {
  let i = t38.position;
  if (ee(e)) {
    let n = t38.offsetOf(e[0]), o = t38.offsetOf(e[e.length - 1]);
    return r === "forward" ? t38.setSelection(n, o) : t38.setSelection(o, n), t38.announce("move", i), t38.mathfield.stopCoalescingUndo(), true;
  }
  return r === "forward" ? Ke(t38, [e.leftSibling, e]) : Ke(t38, [e, e.leftSibling]);
}
function kt(t38, e) {
  let r = t38.position;
  if (typeof e == "number" && (e = t38.at(e)), e.type === "prompt") t38.setSelection(t38.offsetOf(e.firstChild), t38.offsetOf(e.lastChild));
  else {
    let i = t38.offsetOf(e);
    e.type === "placeholder" ? t38.setSelection(i - 1, i) : t38.position = i;
  }
  return t38.announce("move", r), t38.mathfield.stopCoalescingUndo(), true;
}
function Cn(t38, e) {
  var a, s;
  let r = e === "forward" ? 1 : -1;
  t38.at(t38.anchor).type === "placeholder" && ct(t38, e);
  let i, n = t38.at(t38.anchor).parentPrompt;
  n ? e === "forward" ? i = t38.offsetOf(n) + 1 : i = t38.offsetOf(n.leftSibling) : i = Math.max(t38.position + r, 0);
  let o = Ic(t38, i, e);
  if (!o || e === "forward" && t38.offsetOf(o) < i || e === "backward" && t38.offsetOf(o) > i) {
    if (!((s = (a = t38.mathfield.host) == null ? void 0 : a.dispatchEvent(new CustomEvent("move-out", { detail: { direction: e }, cancelable: true, bubbles: true, composed: true }))) != null ? s : true)) return t38.announce("plonk"), false;
    let c = Ib();
    if (!document.activeElement || c.length <= 1) return t38.announce("plonk"), false;
    let u = c.indexOf(document.activeElement) + r;
    return u < 0 && (u = c.length - 1), u >= c.length && (u = 0), c[u].focus(), t38.mathfield.stopCoalescingUndo(), true;
  }
  return kt(t38, o), true;
}
function Ic(t38, e = 0, r = "forward") {
  return t38.findAtom((i) => i.type === "placeholder" || i.type === "prompt" || !t38.mathfield.readOnly && i.treeDepth > 2 && i.isFirstSibling && i.isLastSibling, e, r);
}
pe({ moveToOpposite: (t38) => {
  let e = { superscript: "subscript", subscript: "superscript", above: "below", below: "above" }, r = t38.at(t38.position), { parent: i } = r;
  if (!i) return t38.announce("plonk"), false;
  let n = r.parentBranch, o;
  if (typeof n == "string" && (o = e[n]), !o) {
    let s = r.subsupPlacement ? op(t38) : np(t38);
    return t38.mathfield.stopCoalescingUndo(), s;
  }
  i.branch(o) || i.createBranch(o);
  let a = t38.setSelection(t38.getBranchRange(t38.offsetOf(i), o));
  return t38.mathfield.stopCoalescingUndo(), a;
}, moveBeforeParent: (t38) => {
  let { parent: e } = t38.at(t38.position);
  return e ? (t38.position = t38.offsetOf(e), t38.mathfield.stopCoalescingUndo(), true) : (t38.announce("plonk"), false);
}, moveAfterParent: (t38) => zc(t38), moveToNextChar: (t38) => ct(t38, "forward"), moveToPreviousChar: (t38) => ct(t38, "backward"), moveUp: (t38) => ct(t38, "upward"), moveDown: (t38) => ct(t38, "downward"), moveToNextWord: (t38) => St(t38, "forward"), moveToPreviousWord: (t38) => St(t38, "backward"), moveToGroupStart: (t38) => {
  let e = t38.offsetOf(t38.at(t38.position).firstSibling);
  return e === t38.position ? (t38.announce("plonk"), false) : (t38.position = e, t38.mathfield.stopCoalescingUndo(), true);
}, moveToGroupEnd: (t38) => {
  let e = t38.offsetOf(t38.at(t38.position).lastSibling);
  return e === t38.position ? (t38.announce("plonk"), false) : (t38.position = e, t38.mathfield.stopCoalescingUndo(), true);
}, moveToNextGroup: (t38) => {
  var l, c, u, d;
  if (t38.position === t38.lastOffset && t38.anchor === t38.lastOffset) return Cn(t38, "forward");
  let e = t38.at(t38.position);
  if (e.mode === "text") {
    if (t38.selectionIsCollapsed) {
      let m = e;
      for (; (m == null ? void 0 : m.mode) === "text"; ) m = m.leftSibling;
      let p = e;
      for (; ((l = p.rightSibling) == null ? void 0 : l.mode) === "text"; ) p = p.rightSibling;
      if (m && p) return Ke(t38, [m, p]);
    }
    if (e.rightSibling.mode === "text") {
      let m = e;
      for (; (m == null ? void 0 : m.mode) === "text"; ) m = m.rightSibling;
      return m ? (kt(t38, (c = m.leftSibling) != null ? c : m), t38.mathfield.switchMode("math"), true) : kt(t38, t38.lastOffset);
    }
  }
  let i = t38.at(t38.anchor).parentPrompt, n = i ? t38.offsetOf(i) + 1 : Math.max(t38.position + 1, 0), o = Ic(t38, n, "forward");
  if (o && t38.offsetOf(o) < n) return Cn(t38, "forward");
  if (o) return kt(t38, o);
  let a = ap(t38, e, (m) => m.type === "leftright" || m.type === "text", "forward");
  if (a) {
    if (a.mode === "text") {
      let m = a;
      for (; (m == null ? void 0 : m.mode) === "text"; ) m = m.rightSibling;
      return Ke(t38, [(u = a.leftSibling) != null ? u : a, (d = m.leftSibling) != null ? d : m]);
    }
    return Ke(t38, a);
  }
  let s = e.parent;
  if (s) {
    if (s.type === "leftright" || s.type === "surd") return Ke(t38, s);
    if (e.parentBranch === "subscript" && s.superscript) return Ke(t38, s.superscript);
    if (e.parentBranch === "above" && s.below) return Ke(t38, s.below);
    if (e.parentBranch === "superscript" || e.parentBranch === "subscript") return kt(t38, s);
    if (e.parentBranch === "above" || e.parentBranch === "below") return Ke(t38, s);
  }
  return kt(t38, t38.lastOffset);
}, moveToPreviousGroup: (t38) => {
  var a;
  if (t38.position === 0 && t38.anchor === 0) return Cn(t38, "backward");
  let e = t38.at(t38.position), r = e.mode;
  if (r === "text") {
    if (t38.selectionIsCollapsed) {
      let s = e;
      for (; (s == null ? void 0 : s.mode) === "text"; ) s = s.leftSibling;
      let l = e;
      for (; ((a = l.rightSibling) == null ? void 0 : a.mode) === "text"; ) l = l.rightSibling;
      if (s && l) return Ke(t38, [s, l]);
    }
    for (; (e == null ? void 0 : e.mode) === "text"; ) e = e.leftSibling;
    return e ? kt(t38, e) : kt(t38, 0);
  }
  let i = t38.at(t38.anchor).parentPrompt, n = i ? t38.offsetOf(i.leftSibling) : Math.max(t38.position - 1, 0), o = Ic(t38, n, "backward");
  if (o && t38.offsetOf(o) > n) return Cn(t38, "backward");
  if (o) return kt(t38, o);
  if (r === "math") {
    let s = ap(t38, e, (c) => c.type === "leftright" || c.type === "text", "backward");
    if (s) {
      if (s.mode === "text") {
        let c = s;
        for (; (c == null ? void 0 : c.mode) === "text"; ) c = c.leftSibling;
        return Ke(t38, [s, c]);
      }
      return Ke(t38, s);
    }
    let l = e.parent;
    if (l) {
      if (l.type === "leftright" || l.type === "surd") return Ke(t38, l);
      if (e.parentBranch === "superscript" && l.subscript) return Ke(t38, l.subscript);
      if (e.parentBranch === "below" && l.above) return Ke(t38, l.above);
      if (e.parentBranch === "superscript" || e.parentBranch === "subscript") return kt(t38, l);
      if (e.parentBranch === "above" || e.parentBranch === "below") return Ke(t38, l);
    }
    return kt(t38, 0);
  }
  return false;
}, moveToMathfieldStart: (t38) => t38.selectionIsCollapsed && t38.position === 0 ? (t38.announce("plonk"), false) : (t38.position = 0, t38.mathfield.stopCoalescingUndo(), true), moveToMathfieldEnd: (t38) => t38.selectionIsCollapsed && t38.position === t38.lastOffset ? (t38.announce("plonk"), false) : (t38.position = t38.lastOffset, t38.mathfield.stopCoalescingUndo(), true), moveToSuperscript: np, moveToSubscript: op }, { target: "model", changeSelection: true });
pe({ moveToNextPlaceholder: (t38) => Cn(t38, "forward"), moveToPreviousPlaceholder: (t38) => Cn(t38, "backward") }, { target: "model", changeSelection: true, audioFeedback: "return" });
function ap(t38, e, r, i) {
  if (i === "forward") {
    let o = e.rightSibling;
    for (; o && !r(o); ) o = o.rightSibling;
    return o;
  }
  let n = e.leftSibling;
  for (; n && !r(n); ) n = n.leftSibling;
  return n;
}
function As(t38, e, r) {
  typeof e == "function" && (r = e, e = 1 / 0), e === void 0 && (e = 1 / 0);
  let i = t38.position, n = false, o = "";
  for (; !n; ) {
    let a = t38.at(i);
    n = e === 0 || a === void 0 || a.type === "first" || a.mode !== "math" || !(a.type && /mord|mpunct|operator/.test(a.type) || a.type === "mop" && /[a-zA-Z ]+/.test(a.value)) || !a.hasEmptyBranch("superscript") || !a.hasEmptyBranch("subscript") || typeof r == "function" && !r(a), n || (a.mode = "text", a.command = a.value, a.verbatimLatex = void 0, o += a.value), i -= 1, e -= 1;
  }
  t38.contentDidChange({ data: o, inputType: "insertText" });
}
function Si(t38, e, r) {
  typeof e == "function" && (r = e, e = 1 / 0), e === void 0 && (e = 1 / 0);
  let i = t38.position, n = false, o = [];
  for (; !n; ) {
    let a = t38.at(i);
    n = e === 0 || !a || a.type === "first" || a.isFirstSibling || a.mode !== "text" || a.value === " " || typeof r == "function" && !r(a), n || (o.push(x.serialize([a], { defaultMode: "math" })), a.mode = "math"), i -= 1, e -= 1;
  }
  Cs(t38), t38.contentDidChange({ data: R(o), inputType: "insertText" });
}
function Cs(t38) {
  var r;
  let e = t38.position - 1;
  for (; e >= 0 && ((r = t38.at(e)) == null ? void 0 : r.mode) === "math"; ) e -= 1;
  if (!(e < 0) && t38.at(e).mode === "text" && t38.at(e).value === " " && t38.at(e - 1).mode === "math") {
    t38.at(e - 1).parent.removeChild(t38.at(e - 1));
    let i = t38.silenceNotifications;
    t38.silenceNotifications = true, t38.position -= 1, t38.silenceNotifications = i, t38.contentDidChange({ inputType: "deleteContent" });
  }
}
function zb(t38) {
  let e = "", r = t38.position, i = false;
  for (; !i; ) {
    let n = t38.at(r);
    i = !(n && (n.mode === "text" || n.mode === "math" && n.type && /mord|mpunct/.test(n.type))), i || (e = n.value + e), r -= 1;
  }
  return e;
}
function sp(t38, e, r) {
  let { model: i } = t38;
  if (i.mode === "latex" || !i.at(i.position).isLastSibling || !r || !dr(r)) return false;
  let n = Fr(r);
  if (!i.selectionIsCollapsed) return !!(t38.model.mode === "text" && /[/_^]/.test(n));
  let o = zb(i) + n;
  if (t38.model.mode === "text") {
    if (e === "Esc" || /[/\\]/.test(n)) return true;
    if (/[\^_]/.test(n)) return /(^|\s)[a-zA-Z][^_]$/.test(o) && Si(i, 1), true;
    let a = { ")": "(", "}": "{", "]": "[" }[n], { parent: s } = i.at(i.position);
    if (a && s instanceof J && s.leftDelim === a) return true;
    if (/(^|[^a-zA-Z])(a|I) $/.test(o)) return false;
    if (/[$€£₤₺¥¤฿¢₡₧₨₹₩₱]/u.test(n)) return true;
    if (/(^|[^a-zA-Z'’])[a-zA-Z] $/.test(o)) return Si(i, 1), false;
    if (/\D\.[^\d\s]$/.test(o)) {
      Si(i, 1);
      let l = i.at(i.position);
      return l.value = "⋅", l.style.variant = "normal", l.command = "\\cdot", l.verbatimLatex = void 0, i.contentDidChange({ data: "\\cdot", inputType: "insertText" }), true;
    }
    if (/(^|\s)[a-zA-Z][^a-zA-Z]$/.test(o) || /\.\d$/.test(o) || /\([\d+\-.]$/.test(o)) return Si(i, 1), true;
    if (/\([a-z][,;]$/.test(o)) return Si(i, 2), true;
    if (/[\d+\-=><*|]$/.test(n)) return Cs(i), true;
  } else {
    if (e === "[Space]") return As(i, void 0, (a) => /[a-z][:,;.]$/.test(a.value)), true;
    if (/[a-zA-Z]{3,}$/.test(o) && !/(dxd|abc|xyz|uvw)$/.test(o)) return As(i, void 0, (a) => /[a-zA-Z]/.test(a.value)), true;
    if (/(^|\W)(if)$/i.test(o)) return As(i, 1), true;
    if (/(\u0393|\u0394|\u0398|\u039B|\u039E|\u03A0|\u03A3|\u03A5|\u03A6|\u03A8|\u03A9|[\u03B1-\u03C9]|\u03D1|\u03D5|\u03D6|\u03F1|\u03F5){3,}$/u.test(o) && !/(αβγ)$/.test(o)) return As(i, void 0, (a) => /(:|,|;|.|\u0393|\u0394|\u0398|\u039B|\u039E|\u03A0|\u03A3|\u03A5|\u03A6|\u03A8|\u03A9|[\u03B1-\u03C9]|\u03D1|\u03D5|\u03D6|\u03F1|\u03F5)/u.test(a.value)), true;
    if (n === "?" || n === "." && !/[\d-+]\.$/.test(o)) return true;
  }
  return false;
}
function lp(t38, e) {
  if (!t38.isSelectionEditable || !t38.keystrokeCaptionVisible) return;
  let r = up(), i = t38.element.getBoundingClientRect();
  r.style.left = `${i.left}px`, r.style.top = `${i.top - 64}px`, r.innerHTML = globalThis.MathfieldElement.createHTML("<span>" + (gn(e) || e) + "</span>" + r.innerHTML), r.style.visibility = "visible", setTimeout(() => {
    r.childNodes.length > 0 && r.childNodes[r.childNodes.length - 1].remove(), r.childNodes.length === 0 && (r.style.visibility = "hidden");
  }, 3e3);
}
function cp(t38) {
  if (t38.keystrokeCaptionVisible = !t38.keystrokeCaptionVisible, t38.keystrokeCaptionVisible) {
    let e = up();
    e.innerHTML = "";
  } else {
    let e = vi("mathlive-keystroke-caption-panel");
    e.style.visibility = "hidden";
  }
  return false;
}
function up() {
  let t38 = document.getElementById("mathlive-keystroke-caption-panel");
  return t38 || (Ge("keystroke-caption"), Ge("core"), vi("mathlive-keystroke-caption-panel"));
}
function dp() {
  document.getElementById("mathlive-keystroke-caption-panel") && (qr("mathlive-keystroke-caption-panel"), ot("core"), ot("keystroke-caption"));
}
function Fc(t38, e) {
  var m, p, f, y;
  let { model: r } = t38, i = ss(e);
  if (e.isTrusted) {
    Lu(e);
    let v = yr();
    t38.keyboardLayout !== v.id && (t38.keyboardLayout = v.id, t38._keybindings = void 0);
  }
  if (clearTimeout(t38.inlineShortcutBufferFlushTimer), t38.inlineShortcutBufferFlushTimer = 0, lp(t38, i), e.isTrusted && e.defaultPrevented) return t38.flushInlineShortcutBuffer(), false;
  let n, o = 0, a = "", s = 0, l = t38.inlineShortcutBuffer, c = false;
  if (t38.isSelectionEditable && r.selectionIsPlaceholder && dr(e) && (t38.flushInlineShortcutBuffer(), r.deleteAtoms(de(r.selection)), t38.snapshot("delete"), c = true), t38.isSelectionEditable) {
    if (r.mode === "math" && (!r.selectionIsPlaceholder || c)) if (i === "[Backspace]") t38.undoManager.lastOp === "insert-shortcut" ? a = "undo" : l.pop();
    else if (!dr(e)) t38.flushInlineShortcutBuffer();
    else {
      let v = Fr(e), b = [...(p = (m = l[l.length - 1]) == null ? void 0 : m.keystrokes) != null ? p : [], v];
      l.push({ state: r.getState(), keystrokes: b, leftSiblings: $b(t38) }), o = 0;
      let k = "";
      for (; !n && o < b.length; ) s = l.length - (b.length - o), k = b.slice(o).join(""), n = eo(l[s].leftSiblings, k, t38.options.inlineShortcuts), !n && /^[a-zA-Z][a-zA-Z0-9]+?([_\^][a-zA-Z0-9\*\+\-]+?)?$/.test(k) && (n = t38.options.onInlineShortcut(t38, k)), o += 1;
      t38.flushInlineShortcutBuffer({ defer: true });
    }
    t38.options.smartMode && (n ? t38.switchMode("math") : sp(t38, i, e) && (t38.switchMode({ math: "text", text: "math" }[r.mode]), a = ""));
  }
  if (!n) {
    if (a || (a = Eh(t38.keybindings, r.mode, e)), !a && (i === "[Enter]" || i === "[Return]")) {
      let v = true;
      return r.contentWillChange({ inputType: "insertLineBreak" }) && (t38.host && (v = t38.host.dispatchEvent(new Event("change", { bubbles: true, composed: true }))), !v && e.preventDefault ? (e.preventDefault(), e.stopPropagation()) : ((f = r.parentEnvironment) != null && f.isMultiline && t38.executeCommand("addRowAfter"), r.contentDidChange({ inputType: "insertLineBreak" }))), v;
    }
    if (i === "[Space]" && r.mode === "latex" && Qe(t38, "accept-all")) return t38.dirty = true, t38.scrollIntoView(), e.preventDefault && (e.preventDefault(), e.stopPropagation()), false;
    if ((!a || i === "[Space]") && r.mode === "math") {
      if (i === "[Space]") {
        if (t38.styleBias = "none", t38.flushInlineShortcutBuffer(), t38.options.mathModeSpace) return H.insert(r, t38.options.mathModeSpace, { format: "latex", mode: "math" }), t38.snapshot("insert-space"), a = "", t38.dirty = true, t38.scrollIntoView(), e.preventDefault && (e.preventDefault(), e.stopPropagation()), false;
        let v = r.at(r.position + 1), b = r.at(r.position - 1);
        if ((v == null ? void 0 : v.mode) === "text" || (b == null ? void 0 : b.mode) === "text") return H.insert(r, " ", { mode: "text" }), t38.snapshot("insert-space"), t38.dirty = true, t38.scrollIntoView(), false;
      }
      (y = r.at(r.position)) != null && y.isDigit() && globalThis.MathfieldElement.decimalSeparator === "," && Fr(e) === "," && (a = "insertDecimalSeparator");
    }
  }
  if (!n && !a) {
    if (r.mathfield.smartFence) {
      if (pp(r, Fr(e), Ut(t38))) return t38.dirty = true, t38.scrollIntoView(), e.preventDefault && e.preventDefault(), false;
    } else {
      let { parent: v } = r.at(r.position);
      if (v instanceof J && v.rightDelim === "?" && r.at(r.position).isLastSibling && /^[)}\]|]$/.test(i)) return t38.snapshot(), v.isDirty = true, v.rightDelim = i, r.position += 1, r.selectionDidChange(), r.contentDidChange({ data: Fr(e), inputType: "insertText" }), t38.snapshot("insert-fence"), t38.dirty = true, t38.scrollIntoView(), e.preventDefault && e.preventDefault(), false;
      if (!r.selectionIsCollapsed) {
        let b = Fr(e);
        if (b === "(" || b === "{" || b === "[") {
          let k = { "(": "(", "{": "\\lbrace", "[": "\\lbrack" }[b], S = { "(": ")", "{": "\\rbrace", "[": "\\rbrack" }[b], [A, E] = de(r.selection);
          return t38.snapshot(), r.position = E, H.insert(r, S, { format: "latex" }), r.position = A, H.insert(r, k, { format: "latex" }), r.setSelection(A + 1, E + 1), r.contentDidChange({ data: b, inputType: "insertText" }), t38.snapshot("insert-fence"), t38.dirty = true, t38.scrollIntoView(), e.preventDefault && e.preventDefault(), false;
        }
      }
    }
    return true;
  }
  let u = r.at(Math.max(r.position, r.anchor)), { parent: d } = u;
  if (a === "moveAfterParent" && d instanceof J && u.isLastSibling && t38.options.smartFence && d.rightDelim === "?" && (t38.snapshot(), d.rightDelim = d.matchingRightDelim(), d.isDirty = true, r.contentDidChange({ inputType: "insertText" }), t38.snapshot("insert-fence")), t38.keyboardDelegate.cancelComposition(), a) t38.executeCommand(a);
  else if (n) {
    let v = Ut(t38);
    r.setState(l[s].state);
    let b = l[l.length - 1].keystrokes;
    b = b.slice(o - 1);
    for (let k of b) H.insert(r, k, { silenceNotifications: true, style: v });
    t38.snapshot("insert-shortcut"), r.setState(l[s].state), r.deferNotifications({ content: true, selection: true, data: n, type: "insertText" }, () => (H.insert(r, n, { format: "latex", style: v }), Cs(t38.model), n.endsWith(" ") && (t38.switchMode("text"), H.insert(r, " ", { style: v, mode: "text" })), t38.snapshot(), r.selectionIsCollapsed || t38.flushInlineShortcutBuffer(), true)), t38.dirty = true, r.announce("replacement");
  }
  return t38.scrollIntoView(), e.preventDefault && e.preventDefault(), false;
}
function Nb(t38) {
  var p, f;
  let { position: e } = t38, r = e, i = [];
  for (; r > 0; ) {
    let y = t38.at(r), v = y.value;
    if (y.type === "mord" || y.type === "mbin" && (v === "+" || v === "-" || v === "−")) i.unshift(y), r--;
    else break;
  }
  if (i.length === 0) return null;
  let n = i.map((y) => y.value).join(""), a = ((f = (p = globalThis.MathfieldElement) == null ? void 0 : p.decimalSeparator) != null ? f : ".") === "." ? "\\." : ",", s = new RegExp(`^(\\d+(?:${a}\\d*)?)[eE]([+\\-−]?)(\\d+)$`), l = n.match(s);
  if (!l) return null;
  let c = l[1], u = l[2], d = l[3], m = u + d;
  return { startOffset: r, endOffset: e, significand: c, exponent: m };
}
function Fb(t38, e) {
  var n;
  let r = (n = globalThis.MathfieldElement) == null ? void 0 : n.scientificNotationTemplate;
  if (!r || r === "" || !r.includes("#1") || !r.includes("#2")) return null;
  let i = r.replace("#1", t38);
  return i = i.replace("#2", e), i;
}
function mp(t38) {
  let { model: e } = t38;
  if (e.mode !== "math") return false;
  let r = Nb(e);
  if (!r) return false;
  let i = Fb(r.significand, r.exponent);
  return i ? (e.deferNotifications({ content: true, selection: true, type: "insertText" }, () => {
    e.selection = { ranges: [[r.startOffset, r.endOffset]], direction: "forward" }, H.insert(e, i, { insertionMode: "replaceSelection", selectionMode: "after" });
  }), t38.snapshot("format-scientific-notation"), t38.dirty = true, t38.scrollIntoView(), true) : false;
}
function So(t38, e, r) {
  let { model: i } = t38;
  if (!t38.isSelectionEditable) {
    i.announce("plonk");
    return;
  }
  r != null || (r = {}), r.focus && t38.focus(), r.feedback && (globalThis.MathfieldElement.keypressVibration && Di() && navigator.vibrate(mo), globalThis.MathfieldElement.playSound("keypress")), typeof r.mode == "string" && (t38.switchMode(r.mode), t38.snapshot());
  let n = Ia(e), o = window.mathVirtualKeyboard;
  if (o != null && o.isShifted && (n = typeof n == "string" ? n.toUpperCase() : n.map((a) => a.toUpperCase())), r.simulateKeystroke) {
    let a = true;
    for (let s of n) Fc(t38, new KeyboardEvent("keypress", { key: s })) && (a = false);
    if (a) return;
  }
  if (i.mode === "latex") {
    if (i.deferNotifications({ content: true, selection: true, data: e, type: "insertText" }, () => {
      xi(t38);
      for (let a of n) H.insert(i, a, { insertionMode: "replaceSelection" });
      t38.snapshot("insert-latex"), Vr(t38);
    }), e === "}") {
      let s = yi(i).map((c) => c.value).join(""), l = s.match(/^\\([a-zA-Z]+)/);
      if (l) {
        let c = "\\" + l[1], u = ne(c, "math");
        if ((u == null ? void 0 : u.definitionType) === "function") {
          let d = u.params.filter((m) => !m.isOptional).length;
          if (d > 0) {
            let m = 0, p = 0, f = true;
            for (let y = 0; y < s.length; y++) {
              let v = s[y];
              if (f) {
                if (v === "\\" || /[a-zA-Z]/.test(v)) continue;
                f = false;
              }
              v === "{" ? m++ : v === "}" && (m--, m === 0 && p++);
            }
            if (m === 0 && p === d && Qe(t38, "accept-all")) {
              t38.dirty = true, t38.scrollIntoView();
              return;
            }
          }
        }
      }
    }
  } else if (i.mode === "text") {
    let a = h(h({}, qb(i)), t38.defaultStyle);
    for (let s of n) H.insert(i, s, { style: a, insertionMode: "replaceSelection" });
    t38.snapshot("insert-text");
  } else if (i.mode === "math") for (let a of n) Vb(t38, a);
  t38.dirty = true, t38.scrollIntoView();
}
function $b(t38) {
  let e = t38.model, r = [], i = e.at(Math.min(e.position, e.anchor));
  for (; i.type !== "first"; ) r.push(i), i = i.leftSibling;
  return r;
}
function Vb(t38, e) {
  let r = t38.model;
  /\d/.test(e) || mp(t38);
  let i = { "^": "moveToSuperscript", _: "moveToSubscript", " ": t38.options.mathModeSpace ? ["insert", t38.options.mathModeSpace] : "moveAfterParent" }[e];
  if (i === "moveAfterParent") {
    let l = r.at(Math.max(r.position, r.anchor)), { parent: c } = l;
    c instanceof J && l.isLastSibling && t38.options.smartFence && c.rightDelim === "?" && (t38.snapshot(), c.rightDelim = c.matchingRightDelim(), c.isDirty = true, r.contentDidChange({ inputType: "insertText" }), t38.snapshot("insert-fence"));
  }
  if (i) {
    t38.executeCommand(i);
    return;
  }
  let n = h({}, Ut(t38));
  !/[a-zA-Z0-9]/.test(e) && t38.styleBias !== "none" && (n.variant = "normal", n.variantStyle = void 0);
  let o = r.at(r.position), a = r.selectionIsPlaceholder;
  if (/\d/.test(e) && t38.options.smartSuperscript && o.parentBranch === "superscript" && o.parent.type !== "mop" && o.parent.type !== "operator" && o.parent.type !== "extensible-symbol" && o.hasNoSiblings) {
    if (!H.insert(r, e, { style: n, insertionMode: "replaceSelection", selectionMode: a ? "after" : "placeholder" })) {
      t38.undoManager.pop();
      return;
    }
    t38.snapshot("insert-mord"), zc(r);
    return;
  }
  let s = e;
  if (s === "{" ? s = "\\lbrace" : s === "}" ? s = "\\rbrace" : s === "&" ? s = "\\&" : s === "#" ? s = "\\#" : s === "$" ? s = "\\$" : s === "%" ? s = "\\%" : s === "~" ? s = "\\~" : s === "\\" && (s = "\\backslash"), !!H.insert(r, s, { style: n, insertionMode: "replaceSelection", selectionMode: a ? "after" : "placeholder" }) && (t38.snapshot(`insert-${r.at(r.position).type}`), /\d/.test(e))) {
    let l = t38.options.inlineShortcutTimeout > 0 ? t38.options.inlineShortcutTimeout : 1e3;
    clearTimeout(t38.scientificNotationTimer), t38.scientificNotationTimer = setTimeout(() => {
      mp(t38);
    }, l);
  }
}
function qb(t38) {
  var r, i, n, o;
  if (t38.selectionIsCollapsed) return (i = (r = t38.at(t38.position)) == null ? void 0 : r.style) != null ? i : {};
  let e = de(t38.selection)[0];
  return (o = (n = t38.at(e + 1)) == null ? void 0 : n.style) != null ? o : {};
}
function pp(t38, e, r) {
  var l;
  if (!e || t38.mode !== "math") return false;
  let i = t38.at(t38.position), { parent: n } = i, o = { "(": "(", ")": ")", "{": "\\lbrace", "}": "\\rbrace", "[": "\\lbrack", "]": "\\rbrack", "|": "|" }[e];
  if (!o) return false;
  let a = on[o], s = nn[o];
  if (!t38.selectionIsCollapsed) {
    t38.mathfield.snapshot();
    let [c, u] = de(t38.selection), d = t38.extractAtoms([c, u]);
    d = d.filter((p) => p.type !== "first");
    let m = n.addChildrenAfter([new J("left...right", d, { leftDelim: o, rightDelim: s })], t38.at(c));
    return t38.setSelection(t38.offsetOf(m.firstChild), t38.offsetOf(m.lastChild)), t38.mathfield.snapshot("insert-fence"), t38.contentDidChange({ data: o, inputType: "insertText" }), true;
  }
  if (o === "|") {
    let c = n instanceof J ? n.leftDelim + n.rightDelim : "";
    if (c === "\\lbrace\\rbrace" || c === "\\{\\}" || c === "\\lbrace?") return t38.mathfield.snapshot(), H.insert(t38, "\\,\\middle\\vert\\,", { format: "latex", style: r }), t38.mathfield.snapshot("insert-fence"), t38.contentDidChange({ data: o, inputType: "insertText" }), true;
  }
  if (s) {
    if (n instanceof J && n.firstChild === i && (n.leftDelim === "?" || n.leftDelim === ".")) return n.leftDelim = o, n.isDirty = true, t38.mathfield.snapshot(), t38.contentDidChange({ data: o, inputType: "insertText" }), t38.mathfield.snapshot("insert-fence"), true;
    if (!(n instanceof J)) {
      let m = i;
      for (; m && !(m.type === "mclose" && m.value === s); ) m = m.rightSibling;
      if (m) {
        t38.mathfield.snapshot();
        let p = t38.extractAtoms([t38.offsetOf(i), t38.offsetOf(m)]);
        p.pop(), p = p.filter((y) => y.type !== "first");
        let f = new J("left...right", p, { leftDelim: o, rightDelim: s });
        return n.addChildrenAfter([f], i), t38.position = t38.offsetOf(f.firstChild), t38.contentDidChange({ data: o, inputType: "insertText" }), t38.mathfield.snapshot("insert-fence"), true;
      }
    }
    let c = t38.offsetOf(i.lastSibling), u;
    for (u = t38.position; u <= c; u++) {
      let m = t38.at(u);
      if (m instanceof J && (m.leftDelim === "?" || m.leftDelim === ".") && hp(o, m.rightDelim)) break;
    }
    let d = t38.at(u);
    if (u <= c && d instanceof J) {
      d.leftDelim = o, t38.mathfield.snapshot();
      let m = t38.extractAtoms([t38.position, u - 1]);
      return m = m.filter((p) => p.type !== "first"), d.addChildren(m, d.parentBranch), t38.position += 1, t38.contentDidChange({ data: o, inputType: "insertText" }), t38.mathfield.snapshot("insert-fence"), true;
    }
    if (n instanceof J && (n.leftDelim === "?" || n.leftDelim === ".") && hp(o, n.rightDelim)) {
      n.isDirty = true, n.leftDelim = o, t38.mathfield.snapshot();
      let m = t38.extractAtoms([t38.offsetOf(i.firstSibling), t38.position]);
      for (let p of m) n.parent.addChildBefore(p, n);
      return t38.contentDidChange({ data: o, inputType: "insertText" }), t38.mathfield.snapshot("insert-fence"), true;
    }
    if (!(n instanceof J && n.leftDelim === "|")) {
      if (o === "(") {
        let m = t38.position - 1, p = false;
        for (; m >= 0; ) {
          let f = t38.at(m);
          if (f.type === "first") break;
          if (f.type === "mord" && f.value && /^[\d]$/.test(f.value)) {
            m -= 1;
            continue;
          }
          if (f.type === "group" && ((l = f.body) == null ? void 0 : l.length) === 2 && f.body[0].type === "first" && f.body[1].value === ",") {
            p = true;
            break;
          }
          if (f.type === "mord" && (f.value === "," || f.value === ".")) {
            p = true;
            break;
          }
          break;
        }
        if (p) return false;
      }
      if (t38.mathfield.snapshot(), H.insert(t38, `\\left${o}\\right?`, { format: "latex", style: r }), i.lastSibling.type !== "first") {
        let m = t38.offsetOf(i.lastSibling), p = t38.extractAtoms([t38.position, m]);
        t38.at(t38.position).body = p, t38.position -= 1;
      }
      return t38.mathfield.snapshot("insert-fence"), true;
    }
  }
  if (a) {
    if (o === ")") {
      let f = t38.position - 1, y = false;
      for (; f >= 0; ) {
        let v = t38.at(f);
        if (v.type === "first") break;
        if (v.type === "mord" && v.value && /^[\d]$/.test(v.value)) {
          y = true, f -= 1;
          continue;
        }
        break;
      }
      if (y && t38.at(f).type === "mopen" && t38.at(f).value === "(") return false;
    }
    let c = i;
    for (; c; ) {
      if (c.type === "mopen" && c.value === a) {
        t38.mathfield.snapshot();
        let f = c.leftSibling, y = t38.extractAtoms([t38.offsetOf(c.leftSibling), t38.offsetOf(i)]);
        [, ...y] = y;
        let v = new J("left...right", y, { leftDelim: a, rightDelim: o });
        return n.addChildrenAfter([v], f), t38.position = t38.offsetOf(v), t38.contentDidChange({ data: o, inputType: "insertText" }), t38.mathfield.snapshot("insert-fence"), true;
      }
      c = c.leftSibling;
    }
    if (n instanceof J && i.isLastSibling && Nc(n.leftDelim, o)) return t38.mathfield.snapshot(), n.isDirty = true, n.rightDelim = o, t38.position += 1, t38.contentDidChange({ data: o, inputType: "insertText" }), t38.mathfield.snapshot("insert-fence"), true;
    let u = t38.offsetOf(i.firstSibling), d;
    for (d = t38.position; d >= u; d--) {
      let f = t38.at(d);
      if (f instanceof J && (f.rightDelim === "?" || f.rightDelim === ".") && Nc(f.leftDelim, o)) break;
    }
    let m = t38.at(d);
    if (d >= u && m instanceof J) return t38.mathfield.snapshot(), m.rightDelim = o, m.addChildren(t38.extractAtoms([d, t38.position]), m.parentBranch), t38.contentDidChange({ data: o, inputType: "insertText" }), t38.mathfield.snapshot("insert-fence"), true;
    if (n instanceof J && (n.rightDelim === "?" || n.rightDelim === ".") && Nc(n.leftDelim, o)) return t38.mathfield.snapshot(), n.isDirty = true, n.rightDelim = o, n.parent.addChildren(t38.extractAtoms([t38.position, t38.offsetOf(i.lastSibling)]), n.parentBranch), t38.position = t38.offsetOf(n), t38.contentDidChange({ data: o, inputType: "insertText" }), t38.mathfield.snapshot("insert-fence"), true;
    let p = n.parent;
    return p instanceof J && (p.rightDelim === "?" || p.rightDelim === ".") && t38.at(t38.position).isLastSibling ? (t38.position = t38.offsetOf(p), pp(t38, o, r)) : false;
  }
  return false;
}
function Nc(t38, e) {
  return t38 ? ["(", "\\lparen", "{", "\\{", "\\lbrace", "[", "\\lbrack"].includes(t38) ? [")", "\\rparen", "}", "\\}", "\\rbrace", "]", "\\rbrack"].includes(e) : nn[t38] === e : true;
}
function hp(t38, e) {
  return e ? [")", "\\rparen", "}", "\\}", "\\rbrace", "]", "\\rbrack"].includes(e) ? ["(", "\\lparen", "{", "\\{", "\\lbrace", "[", "\\lbrack"].includes(t38) : on[e] === t38 : true;
}
pe({ scrollIntoView: (t38) => (t38.scrollIntoView(), true), scrollToStart: (t38) => (t38.field.scroll(0, 0), true), scrollToEnd: (t38) => {
  let e = t38.field.getBoundingClientRect();
  return t38.field.scroll(e.left - window.scrollX, 0), true;
}, toggleKeystrokeCaption: cp, toggleContextMenu: (t38) => {
  let e = t38.toggleContextMenu();
  return e || t38.model.announce("plonk"), e;
}, plonk: (t38) => (t38.model.announce("plonk"), true), switchMode: (t38, e, r, i) => (t38.switchMode(e, r, i), true) });
pe({ undo: (t38) => (t38.undo(), true), redo: (t38) => (t38.redo(), true) }, { target: "mathfield", changeContent: true });
pe({ insert: (t38, e, r) => t38.insert(e, r), typedText: (t38, e, r) => (So(t38, e, r), true), insertDecimalSeparator: (t38) => {
  let e = t38.model;
  return e.mode === "math" && globalThis.MathfieldElement.decimalSeparator === "," && e.at(Math.max(e.position, e.anchor)).isDigit() ? (t38.insert("{,}", { format: "latex" }), t38.snapshot("insert-mord"), true) : (t38.insert("."), true);
}, commit: (t38) => {
  var r, i;
  let e = t38.model;
  return e.contentWillChange({ inputType: "insertLineBreak" }) && ((r = t38.host) == null || r.dispatchEvent(new Event("change", { bubbles: true, composed: true })), (i = e.parentEnvironment) != null && i.isMultiline && t38.executeCommand("addRowAfter"), e.contentDidChange({ inputType: "insertLineBreak" })), true;
}, insertPrompt: (t38, e, r) => {
  let i = t38.getPrompts(), n = "prompt-" + Date.now().toString(36).slice(-2) + Math.floor(Math.random() * 1e5).toString(36), o = 0;
  for (; i.includes(n) && o < 100; ) {
    if (o === 99) return console.error("could not find a unique ID after 100 tries"), false;
    n = "prompt-" + Date.now().toString(36).slice(-2) + Math.floor(Math.random() * 1e5).toString(36), o++;
  }
  return t38.insert(`\\placeholder[${e != null ? e : n}]{}`, r), true;
} }, { target: "mathfield", canUndo: true, changeContent: true, changeSelection: true });
pe({ copyToClipboard: (t38) => (t38.focus(), t38.model.selectionIsCollapsed && t38.select(), "queryCommandSupported" in document && document.queryCommandSupported("copy") && document.execCommand("copy") || t38.element.querySelector(".ML__keyboard-sink").dispatchEvent(new ClipboardEvent("copy", { bubbles: true, composed: true })), false) }, { target: "mathfield" });
pe({ cutToClipboard: (t38) => (t38.focus(), "queryCommandSupported" in document && document.queryCommandSupported("cut") && document.execCommand("cut") || t38.element.querySelector(".ML__keyboard-sink").dispatchEvent(new ClipboardEvent("cut", { bubbles: true, composed: true })), true), pasteFromClipboard: (t38) => (t38.focus(), "queryCommandSupported" in document && document.queryCommandSupported("paste") ? (document.execCommand("paste"), true) : (navigator.clipboard.readText().then((e) => {
  e && t38.model.contentWillChange({ inputType: "insertFromPaste", data: e }) ? (t38.stopCoalescingUndo(), t38.stopRecording(), t38.insert(e, { mode: t38.model.mode }) && (Vr(t38), t38.startRecording(), t38.snapshot("paste"), t38.model.contentDidChange({ inputType: "insertFromPaste" }), Y(t38))) : t38.model.announce("plonk"), t38.startRecording();
}).catch(() => {
  t38.model.announce("plonk"), t38.startRecording();
}), true)) }, { target: "mathfield", canUndo: true, changeContent: true, changeSelection: true });
function Es(t38) {
  let [e, r] = de(t38.selection);
  if (e = fp(t38, e, "backward"), r = fp(t38, r, "forward"), e === r) {
    let i = t38.at(e);
    if (i.type === "leftright") return t38.setSelection(t38.offsetOf(i.firstChild) - 1, r);
    if (i.type === "first" && (i.parent.type === "leftright" || i.parent.type === "surd")) return t38.setSelection(e - 1, t38.offsetOf(i.parent.lastChild) + 1);
    t38.setSelection(e - 1, r);
  } else t38.setSelection(e, r);
  return true;
}
function fp(t38, e, r) {
  var o;
  let i = t38.at(e);
  if (!i) return e;
  let n = r === "forward" ? 1 : -1;
  if (i.mode === "text") {
    for (; i && !(i.mode !== "text" || !Qr.test(i.value)); ) e += n, i = t38.at(e);
    return r === "backward" ? e - 1 : e;
  }
  if (i.mode === "latex") {
    if (/[a-zA-Z\\*]/.test(i.value)) if (r === "backward") for (; (i == null ? void 0 : i.mode) === "latex" && i.value !== "\\" && /[a-zA-Z]/.test(i.value); ) e += n, i = t38.at(e);
    else for (; (i == null ? void 0 : i.mode) === "latex" && /[a-zA-Z\\*]/.test(i.value); ) e += n, i = t38.at(e);
    else if (i.value === "{") {
      if (r === "forward") {
        for (; (i == null ? void 0 : i.mode) === "latex" && i.value !== "}"; ) e += n, i = t38.at(e);
        return e;
      }
      return e - 1;
    } else if (i.value === "}") {
      if (r === "backward") {
        for (; (i == null ? void 0 : i.mode) === "latex" && i.value !== "{"; ) e += n, i = t38.at(e);
        return e - 1;
      }
      return e;
    }
    return e - 1;
  }
  if (i.mode === "math") {
    if (i.isDigit()) {
      for (; (o = t38.at(e + n)) != null && o.isDigit(); ) e += n;
      return r === "backward" ? e - 1 : e;
    }
    if (i.style.variant || i.style.variantStyle) {
      let a = i.style.variant, s = i.style.variantStyle;
      for (; ; ) {
        let l = t38.at(e + n);
        if (!l || l.style.variant !== a || l.style.variantStyle !== s) break;
        e += n;
      }
      return r === "backward" ? e - 1 : e;
    }
    return e;
  }
  return e;
}
pe({ selectGroup: (t38) => {
  let e = Es(t38);
  return e || t38.announce("plonk"), e;
}, selectAll: (t38) => t38.setSelection(0, t38.lastOffset), extendSelectionForward: (t38) => ct(t38, "forward", { extend: true }), extendSelectionBackward: (t38) => ct(t38, "backward", { extend: true }), extendToNextWord: (t38) => St(t38, "forward", { extend: true }), extendToPreviousWord: (t38) => St(t38, "backward", { extend: true }), extendSelectionUpward: (t38) => ct(t38, "upward", { extend: true }), extendSelectionDownward: (t38) => ct(t38, "downward", { extend: true }), extendToNextBoundary: (t38) => St(t38, "forward", { extend: true }), extendToPreviousBoundary: (t38) => St(t38, "backward", { extend: true }), extendToGroupStart: (t38) => {
  let e = t38.setSelection(t38.anchor, t38.offsetOf(t38.at(t38.position).firstSibling));
  return e || t38.announce("plonk"), e;
}, extendToGroupEnd: (t38) => {
  let e = t38.setSelection(t38.anchor, t38.offsetOf(t38.at(t38.position).lastSibling));
  return e || t38.announce("plonk"), e;
}, extendToMathFieldStart: (t38) => {
  let e = t38.setSelection(t38.anchor, 0);
  return e || t38.announce("plonk"), e;
}, extendToMathFieldEnd: (t38) => {
  let e = t38.setSelection(t38.anchor, t38.lastOffset);
  return e || t38.announce("plonk"), e;
} }, { target: "model", changeSelection: true });
var ki = null, ko = 0, Li = class t35 {
  static start(e, r, i, n) {
    var a;
    t35.element = e, (a = t35.controller) == null || a.abort(), t35.controller = new AbortController();
    let o = { signal: t35.controller.signal };
    "PointerEvent" in window ? (e.addEventListener("pointermove", i, o), e.addEventListener("pointerup", n, o), e.addEventListener("pointercancel", n, o), Vc(r) && (t35.pointerId = r.pointerId, e.setPointerCapture(r.pointerId))) : (window.addEventListener("mousemove", i, o), window.addEventListener("blur", n, o), window.addEventListener("mouseup", n, o));
  }
  static stop() {
    var e;
    (e = t35.controller) == null || e.abort(), t35.controller = void 0, typeof t35.pointerId == "number" && (t35.element.releasePointerCapture(t35.pointerId), t35.pointerId = void 0);
  }
};
function Vc(t38) {
  return t38 !== null && globalThis.PointerEvent !== void 0 && t38 instanceof PointerEvent;
}
function $c(t38, e, r) {
  return t38 >= r.left && t38 <= r.right && e >= r.top && e <= r.bottom;
}
function gp(t38, e, r) {
  return t38 < e ? e : t38 > r ? r : t38;
}
function qc(t38, e) {
  var O, I, V, K, N, j;
  if (e.buttons > 1) return;
  t38.atomBoundsCache ? t38.atomBoundsCache.clear() : t38.atomBoundsCache = /* @__PURE__ */ new Map();
  let r = t38, i, n = false, o = false, a = "none", s = false, l = false, c = e.clientX, u = e.clientY, d = Date.now(), m = r.field, p = setInterval(() => {
    s ? m.scroll({ top: 0, left: m.scrollLeft - 16 }) : l && m.scroll({ top: 0, left: m.scrollLeft + 16 });
  }, 32);
  function f() {
    Li.stop(), n = false, clearInterval(p), t38.element.classList.remove("tracking"), e && e.preventDefault();
  }
  function y(D) {
    if (!r.hasFocus()) {
      f();
      return;
    }
    let W = D.clientX, ie = D.clientY, X = Vc(D) && D.pointerType === "touch" ? 20 : 5;
    if (Date.now() < d + 500 && Math.abs(c - W) < X && Math.abs(u - ie) < X) {
      D.preventDefault(), D.stopPropagation();
      return;
    }
    let ye = m.getBoundingClientRect();
    l = W > ye.right, s = W < ye.left;
    let xe = i;
    Vc(D) && (D.isPrimary || (xe = Ao(r, D.clientX, D.clientY, { bias: 0 })));
    let Pe = Ao(r, W, ie, { bias: W <= c ? W === c ? 0 : -1 : 1 });
    xe >= 0 && Pe >= 0 && (r.model.extendSelectionTo(xe, Pe), Y(t38)), o && Es(r.model);
  }
  ki && Math.abs(ki.x - c) < 5 && Math.abs(ki.y - u) < 5 && Date.now() < ki.time + 500 ? (ko += 1, ki.time = d) : (ki = { x: c, y: u, time: d }, ko = 1);
  let v = m.getBoundingClientRect(), b = (I = (O = t38.container) == null ? void 0 : O.getBoundingClientRect()) != null ? I : t38.element.getBoundingClientRect(), k = (K = (V = t38.element) == null ? void 0 : V.getBoundingClientRect()) != null ? K : b, S = $c(c, u, v), A = !S && b ? $c(c, u, b) : false, E = !S && !A && k ? $c(c, u, k) : false, C = S ? c : A || E ? gp(c, v.left, v.right) : c, _ = S ? u : A || E ? gp(u, v.top, v.bottom) : u;
  if (S || A || E) {
    if (t38.flushInlineShortcutBuffer(), i = Ao(t38, C, _, { bias: 0 }), i !== t38.model.anchor) {
      let D = t38.defaultStyle.variantStyle;
      t38.defaultStyle = D !== void 0 ? { variantStyle: D } : {}, t38.styleBias = "left";
    }
    if (i >= 0) {
      if (t38.element.classList.add("tracking"), e.shiftKey) {
        let D = t38.model.selectionIsCollapsed;
        t38.model.extendSelectionTo(t38.model.anchor, i), us(t38.model) || D ? a = "all" : a = "selection";
      } else if (t38.model.at(i).type === "placeholder" || t38.model.at(i).type === "prompt") {
        let D = t38.model.at(i);
        D.hasChildren && D.firstChild ? t38.model.position = t38.model.offsetOf(D.firstChild) : t38.model.setSelection(i - 1, i), a = "selection";
      } else if (((N = t38.model.at(i).rightSibling) == null ? void 0 : N.type) === "placeholder" || ((j = t38.model.at(i).rightSibling) == null ? void 0 : j.type) === "prompt") {
        let D = t38.model.at(i).rightSibling;
        D.hasChildren && D.firstChild ? t38.model.position = t38.model.offsetOf(D.firstChild) : t38.model.setSelection(i, i + 1), a = "selection";
      } else {
        let D = t38.model.at(i);
        if (D.captureSelection && D.hasChildren && D.body && D.body.length > 0) {
          let W = D.body.find((ie) => ie.type !== "first");
          W && (W.type === "placeholder" || W.type === "prompt") && W.hasChildren && W.firstChild ? (t38.model.position = t38.model.offsetOf(W.firstChild), a = "selection") : (t38.model.position = i, us(t38.model) ? a = "all" : a = "selection");
        } else t38.model.position = i, us(t38.model) ? a = "all" : a = "selection";
      }
      e.detail === 3 || ko > 2 ? (f(), (e.detail === 3 || ko === 3) && (t38.model.selection = { ranges: [[0, t38.model.lastOffset]] }, a = "all")) : n || (n = true, Li.start(m, e, y, f), (e.detail === 2 || ko === 2) && (o = true, Es(t38.model), a = "all"));
    }
    t38.hasFocus() || (a = "none", t38.onFocus(), t38.model.announce("line"));
  } else ki = null;
  t38.stopCoalescingUndo(), a !== "none" && (t38.model.selectionIsCollapsed && (a = "all"), Y(t38)), e.preventDefault();
}
function Hb(t38, e, r) {
  if (t38 >= r.left && t38 <= r.right && e >= r.top && e <= r.bottom) return 0;
  let i = t38 - (r.left + r.right) / 2, n = e - (r.top + r.bottom) / 2;
  return i * i + n * n;
}
function Lo(t38, e, r, i, n) {
  if (!r.id) return [1 / 0, null];
  if (e.has(r.id)) return e.get(r.id);
  let o = ar(t38, r);
  if (!o) return [1 / 0, null];
  let a = [1 / 0, null], s = t38.model;
  if (r instanceof z) {
    let l = -1, c = 1 / 0;
    for (let d = 0; d < r.rows.length; d++) {
      let m = r.rows[d];
      if (!m || m.length === 0) continue;
      let p = 1 / 0, f = -1 / 0;
      for (let y of m) if (y) for (let v of y) {
        let b = ar(t38, v);
        b && (p = Math.min(p, b.top), f = Math.max(f, b.bottom));
      }
      if (p !== 1 / 0 && f !== -1 / 0) {
        let y;
        n < p ? y = p - n : n > f ? y = n - f : y = 0, y < c && (c = y, l = d);
      }
    }
    let u = l >= 0 ? [r.rows[l]] : r.rows;
    for (let d of u) for (let m of d) if (m) for (let p of m) {
      let f = Lo(t38, e, p, i, n);
      f[0] <= a[0] && (a = f);
    }
    if (!r.isMultiline) for (let d of r.children) {
      let m = Lo(t38, e, d, i, n);
      m[0] <= a[0] && (a = m);
    }
  } else if (r.hasChildren && !r.captureSelection && i >= o.left && i <= o.right) {
    let l = r.children;
    for (let c of l) {
      let u = Lo(t38, e, c, i, n);
      u[0] <= a[0] && (a = u);
    }
    for (let c of r.branches) {
      let u = r.branch(c);
      if (!u || u.length === 0) continue;
      let d = [s.offsetOf(u[0]), s.offsetOf(u[u.length - 1])], m = X0(t38, d);
      if (n >= m.top && n <= m.bottom) for (let p of u) {
        let f = Lo(t38, e, p, i, n);
        f[0] <= a[0] && (a = f);
      }
    }
  }
  return a[1] || (a = [Hb(i, n, o), r]), e.set(r.id, a), a;
}
function Wb(t38, e, r) {
  let [, i] = Lo(t38, /* @__PURE__ */ new Map(), t38.model.root, e, r);
  return i;
}
function Ao(t38, e, r, i) {
  var c;
  let n = t38.field.querySelector(".ML__latex").getBoundingClientRect();
  if (!n) return 0;
  if (e > n.right || r > n.bottom + 8) return t38.model.lastOffset;
  if (e < n.left || r < n.top - 8) return 0;
  i = i != null ? i : {}, i.bias = (c = i.bias) != null ? c : 0;
  let o = Wb(t38, e, r), a = [], s = o;
  for (; s; ) a.unshift(s), s = s.parent;
  for (let u of a) if (u.captureSelection) {
    o = u;
    break;
  }
  let l = t38.model.offsetOf(o);
  if (l < 0) return -1;
  if (o.leftSibling) {
    let u = o.type === "placeholder" || o.type === "prompt";
    if (i.bias === 0 && !u) {
      let d = ar(t38, o);
      d && e < (d.left + d.right) / 2 && (l = t38.model.offsetOf(o.leftSibling));
    } else i.bias < 0 && (l = t38.model.offsetOf(o.leftSibling));
  }
  return l;
}
var Hc = class extends H {
  constructor() {
    super("math");
  }
  onPaste(e, r) {
    if (!r || !e.model.contentWillChange({ data: typeof r == "string" ? r : null, dataTransfer: typeof r == "string" ? null : r, inputType: "insertFromPaste" })) return false;
    let i = "", n = "auto", o = typeof r != "string" ? r.getData("application/json+mathlive") : "";
    if (o) try {
      let a = JSON.parse(o);
      if (a && Array.isArray(a)) {
        e.snapshot();
        let s = yt(a), { model: l } = e;
        l.selectionIsCollapsed || l.deleteAtoms(de(l.selection));
        let c = l.at(l.position);
        if (c.parent instanceof z) {
          c.parentBranch;
          let u = [], d = [];
          s[0].type === "first" && s.shift(), s[s.length - 1].type === "first" && s.pop();
          for (let y of s) y.type === "first" && d.length > 0 ? (u.push(d), d = [y]) : d.push(y);
          d.length > 0 && u.push(d);
          let m = Number(c.parentBranch[0]), p = Number(c.parentBranch[1]), f = c.parent.maxColumns;
          for (; c.parent.colCount - p < u.length && c.parent.colCount < f; ) c.parent.addColumn();
          c.parent.addChildrenAfter(u[0], c);
          for (let y = 1; y < u.length; y++) p++, p >= f && (p = 0, c.parent.addRowAfter(m), m++), c.parent.setCell(m, p, u[y]);
        } else c.parent.addChildrenAfter(s.filter((u) => u.type !== "first"), c);
        return l.position = l.offsetOf(s[s.length - 1]), l.contentDidChange({ inputType: "insertFromPaste" }), Y(e), true;
      }
    } catch (a) {
    }
    if (o = typeof r != "string" ? r.getData("application/json") : "", o && globalThis.MathfieldElement.computeEngine) try {
      let a = JSON.parse(o);
      if (typeof a == "object" && "latex" in a && a.latex && (i = a.latex), !i) {
        let s = globalThis.MathfieldElement.computeEngine.box(a);
        s && !s.has("Error") && (i = s.latex);
      }
      i || (n = "latex");
    } catch (a) {
    }
    if (!i && typeof r != "string" && (i = r.getData("application/x-latex"), i && (n = "latex")), i || (i = typeof r == "string" ? r : r.getData("text/plain")), i) {
      let a;
      return [a, i] = Ua(i), n === "auto" && a && (n = "latex"), e.stopCoalescingUndo(), e.stopRecording(), this.insert(e.model, i, { format: n }) && (e.startRecording(), e.snapshot("paste"), Y(e)), e.startRecording(), true;
    }
    return false;
  }
  insert(e, r, i) {
    var k, S, A, E;
    let n = typeof r == "string" ? r : (S = (k = globalThis.MathfieldElement.computeEngine) == null ? void 0 : k.box(r).latex) != null ? S : "";
    if (!i.silenceNotifications && !e.contentWillChange({ data: n, inputType: "insertText" })) return false;
    i.insertionMode || (i.insertionMode = "replaceSelection"), i.selectionMode || (i.selectionMode = "placeholder"), i.format || (i.format = "auto");
    let { silenceNotifications: o } = e;
    i.silenceNotifications && (e.silenceNotifications = true);
    let a = e.silenceNotifications;
    e.silenceNotifications = true;
    let s = { "?": "\\placeholder{}", "@": "\\placeholder{}" };
    s[0] = i.insertionMode === "replaceAll" ? "" : e.getValue(e.selection, "latex-unstyled"), i.insertionMode === "replaceSelection" ? e.deleteAtoms(de(e.selection)) : i.insertionMode === "replaceAll" ? e.deleteAtoms() : i.insertionMode === "insertBefore" ? e.collapseSelection("backward") : i.insertionMode === "insertAfter" && e.collapseSelection("forward");
    let l = e.at(e.position);
    l && !l.isLastSibling && ((A = e.at(e.position + 1)) == null ? void 0 : A.type) === "placeholder" ? e.deleteAtoms([e.position, e.position + 1]) : (l == null ? void 0 : l.type) === "placeholder" && e.deleteAtoms([e.position - 1, e.position]);
    let c = -1;
    s[0] ? s["@"] = s[0] : typeof r == "string" && /(^|[^\\])#@/.test(r) && (c = Ub(e), c >= 0 && (s["@"] = e.getValue(c, e.position, "latex"))), s[0] || (s[0] = s["?"]);
    let u = false, d = (C) => (u = true, s[C]), [m, p] = bp(e, r, d, i);
    if (!p) return false;
    let f = p.length === 1 && p[0].type === "genfrac", y = e.at(e.position);
    f && c >= 0 && typeof e.mathfield.options.isImplicitFunction == "function" && y && e.mathfield.options.isImplicitFunction(y.command) && (s["@"] = s["?"], u = false, [m, p] = bp(e, r, d, i));
    let v = e.position;
    if (p.length === 1 && p[0].isRoot) e.root = p[0];
    else {
      let C = e.at(e.position), _ = (E = C == null ? void 0 : C.parent) != null ? E : e.root, O = _.hasEmptyBranch("body");
      if (f && m !== "latex" && e.mathfield.options.removeExtraneousParentheses && _ instanceof J && _.leftDelim === "(" && O) {
        let V = _.parent, K = _.parentBranch;
        V.removeChild(_), V.setChildren(p, K);
      }
      let I = e.at(e.position);
      if (I) I.parent.addChildrenAfter(p, I);
      else {
        let V = _.branch("body"), K = V == null ? void 0 : V[0];
        K ? _.addChildrenAfter(p, K) : _.setChildren(p, "body");
      }
      if (c >= 0) {
        e.deleteAtoms([c, v]);
        let V = e.root.branch("body");
        if (V) for (let K of V) K.parent !== e.root && (K.parent = e.root, K.parentBranch = "body");
      }
      m === "latex" && typeof r == "string" && (_ == null ? void 0 : _.type) === "root" && O && !u && (_.verbatimLatex = r);
    }
    e.silenceNotifications = a;
    let b = p[p.length - 1];
    if (i.selectionMode === "placeholder") {
      let C;
      if (p.length === 1 && p[0].type === "genfrac") {
        let _ = p[0].branch("above");
        if (C = _ == null ? void 0 : _.find((O) => O.type === "placeholder"), !C) {
          let O = p[0].branch("below");
          C = O == null ? void 0 : O.find((I) => I.type === "placeholder");
        }
      }
      if (C || (C = p.flatMap((_) => [_, ..._.children]).find((_) => _.type === "placeholder")), C) {
        let _ = e.offsetOf(C);
        e.setSelection(_ - 1, _), e.announce("move");
      } else if (b) {
        let _ = b.body, O = b.hasEmptyBranch("body");
        _ && O ? e.setSelection(e.offsetOf(_[0]), e.offsetOf(_[_.length - 1]) + 1) : e.position = e.offsetOf(b);
      }
    } else i.selectionMode === "before" || (i.selectionMode === "after" ? b && (e.position = e.offsetOf(b)) : i.selectionMode === "item" && e.setSelection(e.anchor, e.offsetOf(b)));
    return e.contentDidChange({ data: n, inputType: "insertText" }), e.silenceNotifications = o, true;
  }
};
function bp(t38, e, r, i) {
  var a;
  let n, o = [];
  if (typeof e != "string") {
    let s = globalThis.MathfieldElement.computeEngine;
    if (!s) return ["latex", []];
    [n, e] = ["latex", s.box(e).latex], o = be(e, { context: t38.mathfield.context });
  } else typeof e == "string" && i.format === "ascii-math" ? ([n, e] = or(e, { format: "ascii-math", inlineShortcuts: t38.mathfield.options.inlineShortcuts }), o = be(e, { context: t38.mathfield.context }), n !== "latex" && t38.mathfield.options.removeExtraneousParentheses && (o = o.map((s) => Ts(s)))) : (i.format === "auto" || (a = i.format) != null && a.startsWith("latex")) && (i.format === "auto" && ([n, e] = or(e, { format: "auto", inlineShortcuts: t38.mathfield.options.inlineShortcuts })), i.format === "latex" && ([, e] = Ua(e)), o = be(e, { context: t38.mathfield.context, args: r }), i.format !== "latex" && t38.mathfield.options.removeExtraneousParentheses && (o = o.map((s) => Ts(s))));
  return oo(o, i.style), [n != null ? n : "latex", o];
}
function Ts(t38) {
  var e;
  if (t38 instanceof J && t38.leftDelim !== "(" && t38.rightDelim === ")") {
    let r = (e = t38.body) == null ? void 0 : e.filter((i) => i.type !== "first");
    if ((r == null ? void 0 : r.length) === 1 && r[0].type === "genfrac") return r[0];
  }
  for (let r of t38.branches) t38.hasEmptyBranch(r) || t38.setChildren(t38.branch(r).map((i) => Ts(i)), r);
  return t38 instanceof z && t38.forEachCell((r, i, n) => {
    t38.setCell(i, n, r.map((o) => Ts(o)));
  }), t38;
}
function Ub(t38) {
  let e = t38.at(t38.position);
  if (!e) return -1;
  if (e.mode === "text") {
    for (; !e.isFirstSibling && e.mode === "text"; ) e = e.leftSibling;
    return t38.offsetOf(e);
  }
  let r = e, i = false;
  if (e.type === "mclose") {
    let n = on[e.value];
    for (; !e.isFirstSibling && !(e.type === "mopen" && e.value === n); ) {
      let o = e.leftSibling;
      if (!o) break;
      e = o;
    }
    if (!e.isFirstSibling) {
      let o = e.leftSibling;
      o && (e = o);
    }
    i = true;
  } else if (e.type === "leftright") {
    let n = e.leftSibling;
    n && (e = n), i = true;
  }
  if (i) for (; !e.isFirstSibling && (e.isFunction || yp(e)); ) {
    let n = e.leftSibling;
    if (!n) break;
    e = n;
  }
  else {
    let n = [];
    for (; !e.isFirstSibling && (yp(e) || n.length > 0); ) {
      e.type === "mclose" && n.unshift(e.value), e.type === "mopen" && n.length > 0 && e.value === on[n[0]] && n.shift();
      let o = e.leftSibling;
      if (!o) break;
      e = o;
    }
  }
  return r === e ? -1 : t38.offsetOf(e);
}
function Gb(t38) {
  if (t38.type === "mord" && t38.value === "e") {
    let e = t38.leftSibling;
    if (e && e.isDigit()) return true;
  }
  if (t38.type === "mbin" && (t38.value === "+" || t38.value === "-" || t38.value === "−")) {
    let e = t38.leftSibling, r = t38.rightSibling;
    if ((e == null ? void 0 : e.type) === "mord" && e.value === "e" && r && r.isDigit()) {
      let i = e.leftSibling;
      if (i && i.isDigit()) return true;
    }
  }
  if (t38.type === "subsup") {
    let e = t38.leftSibling;
    if (e && e.isDigit() && e.value === "0") {
      let r = e.leftSibling;
      if (r && r.isDigit() && r.value === "1") {
        let i = r.leftSibling;
        if ((i == null ? void 0 : i.type) === "mbin" && (i.value === "×" || i.value === "\\times")) {
          let n = i.leftSibling;
          if (n && n.isDigit()) return true;
        }
      }
    }
  }
  if (t38.isDigit() && t38.value === "0") {
    let e = t38.leftSibling, r = t38.rightSibling;
    if (e && e.isDigit() && e.value === "1" && (r == null ? void 0 : r.type) === "subsup") {
      let i = e.leftSibling;
      if ((i == null ? void 0 : i.type) === "mbin" && (i.value === "×" || i.value === "\\times")) {
        let n = i.leftSibling;
        if (n && n.isDigit()) return true;
      }
    }
  }
  if (t38.isDigit() && t38.value === "1") {
    let e = t38.rightSibling;
    if (e && e.isDigit() && e.value === "0") {
      let r = e.rightSibling;
      if ((r == null ? void 0 : r.type) === "subsup") {
        let i = t38.leftSibling;
        if ((i == null ? void 0 : i.type) === "mbin" && (i.value === "×" || i.value === "\\times")) {
          let n = i.leftSibling;
          if (n && n.isDigit()) return true;
        }
      }
    }
  }
  if (t38.type === "mbin" && (t38.value === "×" || t38.value === "\\times")) {
    let e = t38.leftSibling, r = t38.rightSibling;
    if (e && e.isDigit() && r && r.isDigit() && r.value === "1") {
      let i = r.rightSibling;
      if (i && i.isDigit() && i.value === "0") {
        let n = i.rightSibling;
        if ((n == null ? void 0 : n.type) === "subsup") return true;
      }
    }
  }
  return false;
}
function yp(t38) {
  return t38.isDigit() || Gb(t38) ? true : t38.type && /^(mord|surd|subsup|leftright|mop|mclose)$/.test(t38.type) ? t38.type !== "extensible-symbol" : false;
}
new Hc();
var Wc = class extends H {
  constructor() {
    super("text");
  }
  onPaste(e, r) {
    if (!r) return false;
    let i = typeof r == "string" ? r : r.getData("text/plain");
    return i && e.model.contentWillChange({ inputType: "insertFromPaste", data: i }) ? (e.stopCoalescingUndo(), e.stopRecording(), this.insert(e.model, i) && (e.model.contentDidChange({ inputType: "insertFromPaste" }), e.startRecording(), e.snapshot("paste"), Y(e)), e.startRecording(), true) : false;
  }
  insert(e, r, i = {}) {
    if (!e.contentWillChange({ data: r, inputType: "insertText" })) return false;
    i.insertionMode || (i.insertionMode = "replaceSelection"), i.selectionMode || (i.selectionMode = "placeholder"), i.format || (i.format = "auto");
    let { silenceNotifications: n } = e;
    i.silenceNotifications && (e.silenceNotifications = true);
    let o = e.silenceNotifications;
    e.silenceNotifications = true, i.insertionMode === "replaceSelection" && !e.selectionIsCollapsed ? e.deleteAtoms(de(e.selection)) : i.insertionMode === "replaceAll" ? (e.root.setChildren([], "body"), e.position = 0) : i.insertionMode === "insertBefore" ? e.collapseSelection("backward") : i.insertionMode === "insertAfter" && e.collapseSelection("forward");
    let a = jb(r, e.mathfield.context);
    if (oo(a, i.style), !a) return false;
    let s = e.at(e.position), l = s.parent.addChildrenAfter(a, s);
    return e.silenceNotifications = o, i.selectionMode === "before" || (i.selectionMode === "item" ? e.setSelection(e.anchor, e.offsetOf(l)) : l && (e.position = e.offsetOf(l))), e.contentDidChange({ data: r, inputType: "insertText" }), e.silenceNotifications = n, true;
  }
};
function jb(t38, e) {
  if (t38.includes("$")) {
    let r = [], i = 0, n = false, o = "";
    for (; i < t38.length; ) t38[i] === "$" ? i + 1 < t38.length && t38[i + 1] === "$" ? (!n && o ? (r.push(Ds(o)), o = "") : n && o && (r.push(o), o = ""), r.push("$$"), n = !n, i += 2) : (!n && o ? (r.push(Ds(o)), o = "") : n && o && (r.push(o), o = ""), r.push("$"), n = !n, i += 1) : (o += t38[i], i += 1);
    return o && (n ? r.push(o) : r.push(Ds(o))), be(r.join(""), { context: e, parseMode: "text" });
  }
  return be(Ds(t38), { context: e, parseMode: "text" });
}
function Ds(t38) {
  return t38 = t38.replace(/\\/g, "\\textbackslash "), t38 = t38.replace(/#/g, "\\#"), t38 = t38.replace(/%/g, "\\%"), t38 = t38.replace(/&/g, "\\&"), t38 = t38.replace(/_/g, "\\_"), t38 = t38.replace(/{/g, "\\textbraceleft "), t38 = t38.replace(/}/g, "\\textbraceright "), t38 = t38.replace(/lbrace/g, "\\textbraceleft "), t38 = t38.replace(/rbrace/g, "\\textbraceright "), t38 = t38.replace(/\^/g, "\\textasciicircum "), t38 = t38.replace(/~/g, "\\textasciitilde "), t38 = t38.replace(/£/g, "\\textsterling "), t38;
}
new Wc();
function Jt(t38) {
  return { value: t38.model.getValue(), selectionIsCollapsed: t38.model.selectionIsCollapsed, canUndo: t38.canUndo(), canRedo: t38.canRedo(), style: Jb(t38.model), mode: t38.model.mode };
}
function Jb(t38) {
  var i;
  if (t38.selectionIsCollapsed) return (i = t38.at(t38.position)) == null ? void 0 : i.style;
  let e = t38.getAtoms(t38.selection);
  if (e.length === 0) return {};
  let r = h({}, e[0].style);
  for (let n of e) for (let [o, a] of Object.entries(n.style)) r[o] !== a && delete r[o];
  return r;
}
var se = 4, $e = 20, ve = 2 * ($e + se), Os = (t38, e) => `
  <line x1="${t38 + $e}" y1="${e + $e}" 
    x2="${t38 > e ? t38 + $e : 7 * $e + 10 * se}" 
    y2="${t38 < e ? e + $e : 7 * $e + 10 * se}"/>
  <svg id="plus" viewBox="0 0 40 40" x="${t38}" y="${e}" width="40" height="40">
    <circle class="cls-2" cx="20" cy="20" r="20"/>
    <path class="font" d="m33.33,20c0,1.84-1.49,3.34-3.33,3.34h-6.67v6.66c0,1.84-1.49,3.34-3.33,3.34s-3.34-1.5-3.34-3.34v-6.66h-6.66c-1.84,0-3.34-1.5-3.34-3.34s1.5-3.33,3.34-3.33h6.66v-6.67c0-1.84,1.5-3.33,3.34-3.33s3.33,1.49,3.33,3.33v6.67h6.67c1.84,0,3.33,1.49,3.33,3.33Z"/>
  </svg>`, xp = (t38, e) => `
  <line x1="${t38 + $e}" y1="${e + $e}" 
    x2="${t38 > e ? t38 + $e : 7 * $e + 10 * se}" 
    y2="${t38 < e ? e + $e : 7 * $e + 10 * se}"/>
  <svg id="minus" viewBox="0 0 40 40" x="${t38}" y="${e}" width="40" height="40">
    <circle class="cls-2" cx="20" cy="20" r="20"/>
    <path class="font" d="m33.33,20c0,1.84-1.49,3.33-3.33,3.33H10c-1.84,0-3.34-1.49-3.34-3.33s1.5-3.34,3.34-3.34h20c1.84,0,3.33,1.5,3.33,3.34Z"/>
  </svg>`, Bs = (t38, e, r) => `
  <svg id="arrow" viewBox="0 0 40 40" x="${t38}" y="${e}" width="40" height="40">
    <circle class="cls-2" cx="20" cy="20" r="20"/>
    <g transform="rotate(${r})" transform-origin="20 20">
      <path class="font" d="m17.7,7.23h4.6c.52,0,.94.42.94.94v13.82c0,.52.42.94.94.94h3.39c.83,0,1.25,1.01.66,1.6l-7.56,7.56c-.37.37-.96.37-1.32,0l-7.56-7.56c-.59-.59-.17-1.6.66-1.6h3.39c.52,0,.94-.42.94-.94v-13.82c0-.52.42-.94.94-.94Z"/>
    </g>  
  </svg>`, Xb = `
<svg class="MLEP__array-buttons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
viewBox=
"-2 -2 ${8 * $e + 10 * se + 5} ${8 * $e + 10 * se + 5}">
  <rect 
      class="MLEP__array-insert-background rows"
      x="0" 
      y="${ve + se}" 
      height="${3 * ve}" 
      width="${ve}" 
      rx="${ve / 2}"/>
      <rect 
      class="MLEP__array-insert-background columns"
      x="${ve + se}" 
      y="0" 
      height="${ve}" 
      width="${3 * ve}" 
      rx="${ve / 2}"/>
  <g data-command='"moveDown"'>
  ${Bs(2 * (se + ve), 2 * se + 3 * ve, 0)}
  </g>
  <g data-command='"moveUp"'>
  ${Bs(2 * (se + ve), 2 * se + ve, 180)}
  </g>
  <g data-command='"moveToNextWord"'>
  ${Bs(2 * se + 3 * ve, 2 * (se + ve), -90)}
  </g>
  <g data-command='"moveToPreviousWord"'>
  ${Bs(2 * se + ve, 2 * (se + ve), 90)}
  </g>
  <g>

  <g data-command='"addColumnBefore"'>
  ${Os(2 * se + ve, se)}
  </g>
  <g data-command='"removeColumn"'>
  ${xp(2 * se + 2 * ve, se)}
  </g>
  <g data-command='"addColumnAfter"'>
  ${Os(2 * se + 3 * ve, se)}
  </g>
  <g data-command='"addRowBefore"'>
  ${Os(se, 2 * se + ve)}
  </g>
  <g data-command='"removeRow"'>
  ${xp(se, 2 * se + 2 * ve)}
  </g>
  <g data-command='"addRowAfter"'>
    ${Os(se, 2 * se + 3 * ve)}
  </g>
</svg>`, Zb = (t38) => `
<svg id="matrix" class="${t38}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","matrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/></svg>`, Yb = (t38) => `
<svg id="pmatrix" class="${t38}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
data-command='["setEnvironment","pmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m6,4c-3.96,4.6-3.96,11.4,0,16"/>
  <path class="cls-2" d="m22,4c3.96,4.6,3.96,11.4,0,16"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/></svg>`, vp = (t38) => `
<svg id="Bmatrix" class="${t38}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","Bmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m6,4c-1.1,0-2,.9-2,2v3c0,1.66-.9,3-2,3,1.1,0,2,1.34,2,3v3c0,1.1.9,2,2,2"/>
  <path class="cls-2" d="m22,4c1.1,0,2,.9,2,2v3c0,1.66.9,3,2,3-1.1,0-2,1.34-2,3v3c0,1.1-.9,2-2,2"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/>
</svg>`, Qb = (t38) => `
<svg id="bmatrix" class="${t38}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","bmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m6,4h-3v16h3"/>
  <path class="cls-2" d="m22,4h3v16h-3"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/>
</svg>`, ey = (t38) => `
<svg id="vmatrix" class="${t38}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","vmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/>
  <line class="cls-2" x1="4" y1="4" x2="4" y2="20"/>
  <line class="cls-2" x1="24" y1="4" x2="24" y2="20"/>
</svg>`, ty = (t38) => `
<svg id="Vmatrix" class="${t38}" xmlns="http://www.w3.org/2000/svg" viewBox="-3.5 -3 35 30" 
  data-command='["setEnvironment","Vmatrix"]'>
  <rect class="cls-1" width="28" height="24"/>
  <circle cx="10" cy="8" r="1"/>
  <circle cx="14" cy="12" r="1"/>
  <circle cx="18" cy="16" r="1"/>
  <line class="cls-2" x1="6" y1="4" x2="6" y2="20"/>
  <line class="cls-2" x1="22" y1="4" x2="22" y2="20"/>
  <line class="cls-2" x1="2" y1="4" x2="2" y2="20"/>
  <line class="cls-2" x1="26" y1="4" x2="26" y2="20"/>
</svg>`, ry = (t38) => `
<svg id="cases" class="${t38}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","cases"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m10,4c-1.1,0-2,.9-2,2v3c0,1.66-.9,3-2,3,1.1,0,2,1.34,2,3v3c0,1.1.9,2,2,2"/>
  <circle cx="13" cy="8" r="1"/>
  <circle cx="13" cy="16" r="1"/>
  <circle cx="21" cy="8" r="1"/>
  <circle cx="21" cy="16" r="1"/>
</svg>`, iy = (t38) => `
<svg id="rcases" class="${t38}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 24" 
  data-command='["setEnvironment","rcases"]'>
  <rect class="cls-1" width="28" height="24"/>
  <path class="cls-2" d="m18,20c1.1,0,2-.9,2-2v-3c0-1.66.9-3,2-3-1.1,0-2-1.34-2-3v-3c0-1.1-.9-2-2-2"/>
  <circle cx="15" cy="8" r="1"/>
  <circle cx="15" cy="16" r="1"/>
  <circle cx="7" cy="8" r="1"/>
  <circle cx="7" cy="16" r="1"/>
</svg>`, Uc = { matrix: Zb, pmatrix: Yb, bmatrix: Qb, Bmatrix: vp, vmatrix: ey, Vmatrix: ty }, Gc = { cases: ry, rcases: iy, Bmatrix: vp };
function ny(t38) {
  var m, y;
  let e = (m = t38.model.parentEnvironment) == null ? void 0 : m.rows;
  if (!e) return;
  let r = 0;
  e.forEach((v) => {
    (!r || v.length > r) && (r = v.length);
  });
  let i = document.getElementById("mathlive-environment-popover");
  i || (i = vi("mathlive-environment-popover"), Ge("environment-popover"), Ge("core"), i.setAttribute("aria-hidden", "true"));
  let n, o = i.querySelector(".MLEP__environment-controls");
  o ? n = o : (n = document.createElement("div"), i.innerHTML = "", i.appendChild(n)), n.className = "MLEP__environment-controls", n.style.display = "flex", n.style.width = "100%", n.style.height = "100%", n.style.boxSizing = "border-box", n.innerHTML = Xb;
  let a = [], s = "", l = t38.model.parentEnvironment.environmentName;
  if (Xa(l)) {
    let v = oy(l);
    s = Uc[v]("active");
    let p = Uc, { [v]: b } = p, k = Ti(p, [tl(v)]);
    a = Object.values(k).map((S) => S("inactive"));
  } else if (ph(l)) {
    let v = ay(l);
    s = Gc[v]("active");
    let f = Gc, { [v]: b } = f, k = Ti(f, [tl(v)]);
    a = Object.values(k).map((S) => S("inactive"));
  } else fh(l) && (s = Uc.matrix("active"), a = Object.values(Gc).map((v) => v("inactive")));
  let c = document.createElement("div");
  c.className = "MLEP__environment-delimiter-controls", c.style.display = "flex", c.style.flexDirection = "column", c.innerHTML = `
  <div class='MLEP__array-delimiter-options'>
  ${s}
  ${a.join("")}
  </div>`, s && n.appendChild(c), n.querySelectorAll("[data-command]").forEach((v) => {
    let b = v.dataset.command, k = b;
    try {
      k = JSON.parse(b);
    } catch (S) {
    }
    v.addEventListener("mousedown", (S) => S.preventDefault()), k && v.addEventListener("click", () => t38.executeCommand(k));
  });
  let d = (y = t38.field) == null ? void 0 : y.getBoundingClientRect();
  d && (i.style.top = `${window.scrollY + (d.top - i.clientHeight - 15)}px`, i.style.left = `${d.left + 20}px`, i.classList.add("is-visible"));
}
function Ks() {
  let t38 = document.getElementById("mathlive-environment-popover");
  t38 == null || t38.classList.remove("is-visible");
}
function _p() {
  document.getElementById("mathlive-environment-popover") && (qr("mathlive-environment-popover"), ot("environment-popover"), ot("core"));
}
function Co(t38) {
  if (!t38.hasFocus()) return;
  let e = false;
  if (t38.model.mode === "math") {
    let r = t38.model.parentEnvironment;
    if (r != null && r.rows && hh(r.environmentName)) {
      let i = t38.options.environmentPopoverPolicy;
      e = i === "auto" || i === "on";
    }
  }
  e ? ny(t38) : Ks();
}
function oy(t38) {
  return t38.replace("*", "");
}
function ay(t38) {
  return t38 === "dcases" ? "cases" : t38;
}
function Ps(t38) {
  let e = getComputedStyle(t38).direction;
  return e === "ltr" || e === "rtl" ? e : "ltr";
}
function Jc(t38, e, r) {
  return e === "left" || e === "leading" && r === "ltr" || e === "trailing" && r === "rtl" ? t38.left : t38.right;
}
function jc(t38, e, r, i) {
  return r === "middle" ? t38 - e / 2 : r === "start" && i === "rtl" || r === "end" && i === "ltr" || r === "top" || r === "right" ? Math.max(0, t38 - e) : t38;
}
function sy(t38, e, r, i) {
  return r === "middle" ? t38 - e / 2 : r === "start" && i === "ltr" || r === "end" && i === "rtl" || r === "top" || r === "right" ? t38 : t38 - e;
}
function Mp(t38, e) {
  var u, d, m;
  let r = (u = Ps(t38)) != null ? u : "ltr";
  t38.style.position = "fixed", t38.style.left = "", t38.style.top = "", t38.style.right = "", t38.style.bottom = "", t38.style.height = "", t38.style.width = "";
  let i = t38.getBoundingClientRect(), n = Number.isFinite(e.maxHeight) ? Math.min(e.maxHeight, window.innerHeight) : window.innerHeight, o = Math.min(n, (d = e.height) != null ? d : i.height), a = jc(e.location.y, o, e.verticalPos, r);
  a + o > window.innerHeight - 8 && (e.alternateLocation ? (a = jc(e.alternateLocation.y, o, e.verticalPos, r), a + o > window.innerHeight - 8 && (a = void 0)) : a = void 0), Number.isFinite(a) || (a = Math.max(8, window.innerHeight - 8 - o), 8 + o > window.innerHeight - 8 && (t38.style.bottom = "8px")), o = Math.min(a + o, window.innerHeight - 8) - a;
  let s = Number.isFinite(e.maxWidth) ? Math.min(e.maxWidth, window.innerWidth) : window.innerWidth, l = Math.min(s, (m = e.width) != null ? m : i.width), c = jc(e.location.x, l, e.horizontalPos, r);
  c + l > window.innerWidth - 8 && (e.alternateLocation ? (c = sy(e.alternateLocation.x, l, e.verticalPos, r), c + l > window.innerWidth - 8 && (c = void 0)) : c = void 0), Number.isFinite(c) || (c = Math.max(8, window.innerWidth - 8 - l), 8 + l > window.innerWidth - 8 && (t38.style.right = "8px")), l = Math.min(c + l, window.innerWidth - 8) - c, r === "rtl" ? t38.style.right = `${Math.ceil(window.innerWidth - c - l).toString()}px` : t38.style.left = `${Math.ceil(c).toString()}px`, t38.style.top = `${Math.ceil(a).toString()}px`, o !== i.height && (t38.style.height = `${Math.ceil(o).toString()}px`), l !== i.width && (t38.style.width = `${Math.ceil(l).toString()}px`);
}
function wp(t38, e) {
  return Math.hypot(e.x - t38.x, e.y - t38.y);
}
function Ur(t38) {
  return "submenu" in t38;
}
function Lt(t38) {
  return "type" in t38 && t38.type === "command" || "onMenuSelect" in t38 || "id" in t38;
}
function Eo(t38) {
  return "type" in t38 && t38.type === "divider";
}
function Rs(t38) {
  return "type" in t38 && t38.type === "heading";
}
var Sp = {};
function Is(t38) {
  let e = Sp[t38];
  if (!e) {
    let r;
    switch (t38) {
      case "checkmark":
        r = `<span aria-hidden="true" class="ui-checkmark"><svg  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M435.848 83.466L172.804 346.51l-96.652-96.652c-4.686-4.686-12.284-4.686-16.971 0l-28.284 28.284c-4.686 4.686-4.686 12.284 0 16.971l133.421 133.421c4.686 4.686 12.284 4.686 16.971 0l299.813-299.813c4.686-4.686 4.686-12.284 0-16.971l-28.284-28.284c-4.686-4.686-12.284-4.686-16.97 0z"></path></svg>
      </span>`;
        break;
      case "trailing-chevron":
        r = '<span aria-hidden="true" class="ui-trailing-chevron"><svg focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path></svg></span>';
        break;
      case "mixedmark":
        r = '<span aria-hidden="true" class="ui-mixedmark"><svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 512 512"><path fill="currentColor" d="M0 256c0-13.3 10.7-24 24-24H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24z"/></svg></span>';
    }
    if (r) {
      let i = document.createElement("template");
      i.innerHTML = r, Sp[t38] = i, e = i;
    }
  }
  if (e) {
    if ("content" in e) return e.content.cloneNode(true);
    let r = document.createElement("svg");
    return r.innerHTML = e.innerHTML, r;
  }
}
var kp = 80, En = class {
  constructor(e, r) {
    this._className = "";
    this._element = null;
    var i;
    this.parentMenu = r, this._declaration = e, Object.freeze(this._declaration), Ur(e) ? (this.type = "submenu", this.submenu = new Tn(e.submenu, { parentMenu: r, submenuClass: e.submenuClass, columnCount: e.columnCount })) : this.type = (i = e.type) != null ? i : "command", this.hasCheck = Lt(e) && e.checked !== void 0;
  }
  get rootMenu() {
    return this.parentMenu.rootMenu;
  }
  get abortController() {
    return this._abortController || (this._abortController = new AbortController()), this._abortController;
  }
  dispose() {
    var e, r;
    (e = this._abortController) == null || e.abort(), this._abortController = void 0, (r = this._element) == null || r.remove(), this._element = null, this.submenu && this.submenu.dispose(), this.submenu = void 0;
  }
  get menuItem() {
    return this._declaration;
  }
  get label() {
    var e;
    return (e = this._label) != null ? e : "";
  }
  set label(e) {
    e === void 0 && (e = ""), e !== this._label && (this._label = e, this.dirty = true);
  }
  get visible() {
    return this._visible;
  }
  set visible(e) {
    e !== this._visible && (this._visible = e, this.dirty = true);
  }
  get enabled() {
    return this._enabled;
  }
  set enabled(e) {
    this._enabled = e, this.element && (e ? this.element.removeAttribute("aria-disabled") : this.element.setAttribute("aria-disabled", "true")), this.dirty = true;
  }
  get checked() {
    return this._checked;
  }
  set checked(e) {
    this._checked = e, this.dirty = true;
  }
  get tooltip() {
    return this._tooltip;
  }
  set tooltip(e) {
    e !== this._tooltip && (this._tooltip = e, this.dirty = true);
  }
  get ariaLabel() {
    return this._ariaLabel;
  }
  set ariaLabel(e) {
    e !== this._ariaLabel && (this._ariaLabel = e, this.dirty = true);
  }
  get active() {
    var e, r;
    return (r = (e = this.element) == null ? void 0 : e.classList.contains("active")) != null ? r : false;
  }
  set active(e) {
    this.element && this.element.classList.toggle("active", e);
  }
  updateState(e) {
    var i, n, o;
    let r = this._declaration;
    if (Eo(r)) {
      this.enabled = false, this.checked = false;
      return;
    }
    Rs(r) && (this.enabled = false, this.checked = false, this.visible = true), Lt(r) && (this.checked = (i = Ai(r.checked, e)) != null ? i : false), (Lt(r) || Ur(r)) && (this.enabled = (n = Ai(r.enabled, e)) != null ? n : true, this.visible = (o = Ai(r.visible, e)) != null ? o : true, this.visible && this.enabled && this.submenu && (this.submenu.updateState(e), this.submenu.visible || (this.visible = false))), (Lt(r) || Rs(r) || Ur(r)) && (this.label = Ai(r.label, e), this._className = Ai(r.class, e), this.tooltip = Ai(r.tooltip, e), this.ariaLabel = Ai(r.ariaLabel, e)), this._element && this.updateElement();
  }
  set dirty(e) {
    e && this.parentMenu && (this.parentMenu.dirty = true);
  }
  updateElement() {
    var i;
    if (!this.visible || !this.element) return;
    let e = this.element;
    e.textContent = "", e.className = "", e.className = (i = this._className) != null ? i : "", this.enabled ? e.removeAttribute("aria-disabled") : e.setAttribute("aria-disabled", "true"), this.checked === true ? (e.setAttribute("aria-checked", "true"), e.append(Is("checkmark"))) : this.checked === "mixed" ? (e.setAttribute("aria-checked", "mixed"), e.append(Is("mixedmark"))) : e.removeAttribute("aria-checked"), this.ariaLabel && e.setAttribute("aria-label", this.ariaLabel);
    let r = document.createElement("span");
    if (r.className = this.parentMenu.hasCheck ? "label indent" : "label", this.type === "heading" && r.classList.add("heading"), r.innerHTML = this.label, e.append(r), this._tooltip && e.setAttribute("data-tooltip", this._tooltip), Lt(this._declaration) && this._declaration.keyboardShortcut) {
      let n = document.createElement("kbd");
      n.innerHTML = gn(this._declaration.keyboardShortcut), e.append(n);
    }
    this.type === "submenu" && e.append(Is("trailing-chevron"));
  }
  get element() {
    if (this._element) return this._element;
    if (Eo(this._declaration)) {
      let i = document.createElement("li");
      return i.setAttribute("part", "menu-divider"), i.setAttribute("role", "divider"), this._element = i, i;
    }
    let e = document.createElement("li");
    this._element = e, (Lt(this._declaration) || Rs(this._declaration) || Ur(this._declaration)) && e.setAttribute("part", "menu-item"), e.setAttribute("tabindex", "-1"), this.hasCheck ? e.setAttribute("role", "menuitemcheckbox") : e.setAttribute("role", "menuitem"), this.type === "submenu" && (e.setAttribute("aria-haspopup", "true"), e.setAttribute("aria-expanded", "false"));
    let r = this.abortController.signal;
    return e.addEventListener("pointerenter", this, { signal: r }), e.addEventListener("pointerleave", this, { signal: r }), e.addEventListener("pointerup", this, { signal: r }), e.addEventListener("click", this, { signal: r }), this._element;
  }
  dispatchSelect() {
    var i;
    if (!Lt(this._declaration)) return;
    let e = new CustomEvent("menu-select", { cancelable: true, bubbles: true, detail: { modifiers: this.rootMenu.modifiers, id: this._declaration.id, data: this._declaration.data } });
    this.parentMenu.dispatchEvent(e) && typeof this._declaration.onMenuSelect == "function" && this._declaration.onMenuSelect({ target: (i = this.parentMenu.host) != null ? i : void 0, modifiers: this.rootMenu.modifiers, id: this._declaration.id, data: this._declaration.data });
  }
  handleEvent(e) {
    var r;
    if (!(!this.visible || !this.enabled)) {
      if (e.type === "click") {
        this.rootMenu.state === "modal" && this.select(), e.stopPropagation(), e.preventDefault();
        return;
      }
      if (e.type === "pointerenter") {
        let i = e;
        this.rootMenu.cancelDelayedOperation(), this.parentMenu.isSubmenuOpen && ((r = this.parentMenu.activeMenuItem) != null && r.movingTowardSubmenu(i)) ? this.rootMenu.scheduleOperation(() => {
          this.parentMenu.activeMenuItem = this, this.openSubmenu();
        }) : (this.parentMenu.activeMenuItem = this, this.openSubmenu({ withDelay: true }));
        return;
      }
      if (e.type === "pointerleave") {
        this.rootMenu.activeSubmenu === this.parentMenu && (this.parentMenu.activeMenuItem = null);
        return;
      }
      if (e.type === "pointerup") {
        this.rootMenu.state !== "modal" && this.select(), e.stopPropagation(), e.preventDefault();
        return;
      }
    }
  }
  select() {
    if (this.rootMenu.cancelDelayedOperation(), this.type === "submenu") {
      this.openSubmenu();
      return;
    }
    this.active = false, setTimeout(() => {
      this.active = true, setTimeout(() => {
        this.active = false, this.rootMenu.hide(), this.dispatchSelect();
      }, kp);
    }, kp);
  }
  openSubmenu(e) {
    var n;
    if (this.type !== "submenu" || !this.element) return;
    if ((n = e == null ? void 0 : e.withDelay) != null && n) {
      this.rootMenu.scheduleOperation(() => this.openSubmenu());
      return;
    }
    let r = this.element.getBoundingClientRect(), i = Ps(this.element);
    this.submenu.show({ container: this.rootMenu.element.parentNode, location: { x: Jc(r, "trailing", i), y: r.top - 4 }, alternateLocation: { x: Jc(r, "leading", i), y: r.top - 4 } });
  }
  movingTowardSubmenu(e) {
    if (!this.element || this.type !== "submenu") return false;
    let r = this.rootMenu.lastMoveEvent;
    if (!r) return false;
    let i = e.timeStamp - r.timeStamp;
    if (i > 500) return false;
    let n = e.clientX - r.clientX;
    if (ly(n, r.clientY - e.clientY, i) <= 0.2) return false;
    let a = "right";
    if (this.submenu.element) {
      let s = this.submenu.element.getBoundingClientRect(), l = this.element.getBoundingClientRect();
      s.left < l.left + l.width / 2 && (a = "left");
    }
    return a === "right" ? n > 0 : n < 0;
  }
};
function ly(t38, e, r) {
  return Math.hypot(t38, e) / r;
}
function Ai(t38, e) {
  return t38 === void 0 || typeof t38 != "function" ? t38 : (e != null || (e = { alt: false, control: false, shift: false, meta: false }), t38(e));
}
var Tn = class t36 {
  constructor(e, r) {
    this._element = null;
    this._activeMenuItem = null;
    this._dirty = true;
    var i, n;
    this.parentMenu = (i = r == null ? void 0 : r.parentMenu) != null ? i : null, this._submenuClass = r == null ? void 0 : r.submenuClass, this.columnCount = (n = r == null ? void 0 : r.columnCount) != null ? n : 1, this.isSubmenuOpen = false, this.menuItems = e;
  }
  get children() {
    return Object.freeze([...this._menuItems]);
  }
  set menuItems(e) {
    let r = this.parentMenu;
    this.dispose(), this.parentMenu = r, e = [...e], this._menuItems = e.map((i) => i.onCreate ? i.onCreate(i, this) : new En(i, this)), this.hasCheck = void 0, this.dirty = true;
  }
  dispose() {
    var e;
    this.hide(), this._element && this._element.remove(), this._abortController && this._abortController.abort(), (e = this._menuItems) == null || e.forEach((r) => r.dispose()), this._menuItems = [], this._activeMenuItem = null, this.parentMenu = null;
  }
  handleEvent(e) {
    if (e.type === "wheel" && this._element) {
      let r = e;
      this._element.scrollBy(0, r.deltaY), e.stopPropagation();
    }
  }
  dispatchEvent(e) {
    return this.rootMenu.dispatchEvent(e);
  }
  get host() {
    return this.rootMenu.host;
  }
  get rootMenu() {
    return this.parentMenu.rootMenu;
  }
  updateState(e) {
    var a, s, l;
    this._menuItems.forEach((c) => c.updateState(e));
    let r = this.hasCheck;
    this.hasCheck = this._menuItems.some((c) => c.visible && c.hasCheck), this.hasCheck !== r && this._menuItems.forEach((c) => c.updateState(e));
    let i, n = 0;
    for (let c of this._menuItems) c.type === "heading" ? (i && n === 0 && (i.visible = false), i = c, n = 0) : c.type === "divider" && i ? (i.visible = n > 0, i = void 0, n = 0) : i && c.visible && (n += 1);
    i && (i.visible = n > 0);
    let o = true;
    for (let c of this._menuItems) c.type === "divider" ? (c.visible = !o, o = true) : c.visible && (o = false);
    (a = this.activeMenuItem) != null && a.visible || (this.activeMenuItem = null), !((s = this.activeMenuItem) != null && s.enabled) && ((l = this.activeMenuItem) == null ? void 0 : l.type) === "submenu" && this._activeMenuItem.submenu.hide(), this._dirty = false;
  }
  get enabled() {
    return this.updateIfDirty(), this._menuItems.some((e) => e.type !== "divider" && e.visible && e.enabled);
  }
  get visible() {
    return this.updateIfDirty(), this._menuItems.some((e) => e.type !== "divider" && e.visible);
  }
  set dirty(e) {
    this._dirty !== e && e && this.parentMenu && (this._dirty = true, this.parentMenu.dirty = true);
  }
  updateIfDirty() {
    this._dirty && this.updateState(this.rootMenu.modifiers);
  }
  updateElement() {
    var e;
    if (this._element) {
      this._element.textContent = "";
      for (let { element: r, visible: i } of this._menuItems) r && i && this._element.append(r);
      (e = this._element.querySelector("li:first-of-type")) == null || e.setAttribute("tabindex", "0");
    }
  }
  get element() {
    if (this._element) return this._element;
    let e = document.createElement("menu");
    e.setAttribute("role", "menu"), e.setAttribute("tabindex", "-1"), e.setAttribute("aria-orientation", "vertical"), e.setAttribute("part", "ui-menu-container"), this._submenuClass && e.classList.add(this._submenuClass), e.classList.add("ui-menu-container"), this._abortController || (this._abortController = new AbortController());
    let r = this._abortController.signal;
    return e.addEventListener("focus", this, { signal: r }), e.addEventListener("wheel", this, { passive: true, signal: r }), this._element = e, this.updateElement(), e;
  }
  get activeMenuItem() {
    return this._activeMenuItem;
  }
  set activeMenuItem(e) {
    var r, i, n, o;
    if (this.rootMenu.cancelDelayedOperation(), e !== this._activeMenuItem) {
      if (this.activeMenuItem) {
        let a = this.activeMenuItem;
        a.active = false, (r = a.submenu) == null || r.hide();
      }
      if (!((i = e == null ? void 0 : e.visible) == null || i)) {
        this._activeMenuItem = null;
        return;
      }
      this._activeMenuItem = e, e && (e.active = true);
    }
    e ? (n = e.element) == null || n.focus({ preventScroll: true }) : (o = this._element) == null || o.focus({ preventScroll: true });
  }
  get firstMenuItem() {
    this.updateIfDirty();
    let e = 0, r = false, i = this._menuItems;
    for (; !r && e <= i.length - 1; ) {
      let n = i[e];
      r = n.type !== "divider" && n.visible && n.enabled, e += 1;
    }
    return r ? i[e - 1] : null;
  }
  get lastMenuItem() {
    this.updateIfDirty();
    let e = this._menuItems, r = e.length - 1, i = false;
    for (; !i && r >= 0; ) {
      let n = e[r];
      i = n.type !== "divider" && n.visible && n.enabled, r -= 1;
    }
    return i ? e[r + 1] : null;
  }
  nextMenuItem(e) {
    if (e === 0) return this._activeMenuItem;
    if (!this._activeMenuItem) return e > 0 ? this.firstMenuItem : this.lastMenuItem;
    if (!this.firstMenuItem || !this.lastMenuItem || !this._activeMenuItem) return null;
    this.updateIfDirty();
    let r = this._menuItems.indexOf(this.firstMenuItem), i = this._menuItems.indexOf(this.lastMenuItem), n = this._menuItems.indexOf(this._activeMenuItem), o = 1;
    for (; n >= r && n <= i; ) {
      n += e > 0 ? 1 : -1;
      let a = this._menuItems[n];
      if (!a) break;
      if (a.visible && a.enabled) {
        if (o === Math.abs(e)) return this._menuItems[n];
        o += 1;
      }
    }
    return e > 0 ? this.lastMenuItem : this.firstMenuItem;
  }
  getMenuItemColumn(e) {
    this.updateIfDirty();
    let i = this._menuItems.filter((n) => n.visible && n.enabled).indexOf(e);
    return i < 0 ? -1 : i % this.columnCount;
  }
  static get collator() {
    return t36._collator || (t36._collator = new Intl.Collator(void 0, { usage: "search", sensitivity: "base" })), t36._collator;
  }
  findMenuItem(e) {
    var a;
    this.updateIfDirty();
    let r = this._menuItems.filter((s) => s.type !== "divider" && s.visible && s.enabled);
    if (r.length === 0) return null;
    let i = Math.max(...r.map((s) => s.label.length)) - e.length;
    if (i < 0) return null;
    let n = null, o = 0;
    for (; o < i && !n; ) n = (a = r.find((s) => t36.collator.compare(e, s.label.substring(o, e.length)) === 0)) != null ? a : null, o++;
    return n;
  }
  show(e) {
    return !this.visible || !e.container ? false : (this.updateElement(), e.container.appendChild(this.element), rl() && (this.element.popover = "manual", this.element.showPopover()), e.location && Mp(this.element, { location: e.location, alternateLocation: e.alternateLocation, verticalPos: "bottom", horizontalPos: "start" }), Lp(), this.element.focus({ preventScroll: true }), Ap(), this.parentMenu && (this.parentMenu.openSubmenu = this), true);
  }
  hide() {
    var e, r, i, n, o, a;
    this.openSubmenu = null, this.activeMenuItem = null, this.parentMenu && (this.parentMenu.openSubmenu = null), !(!((e = this._element) != null && e.isConnected) || !this._element.parentElement) && (rl() && ((r = this._element) != null && r.popover) && this._element.hidePopover(), Lp(), (n = (i = this.parentMenu) == null ? void 0 : i.element) == null || n.focus(), (a = (o = this._element) == null ? void 0 : o.parentNode) == null || a.removeChild(this._element), Ap());
  }
  set openSubmenu(e) {
    var i, n, o, a;
    let r = e !== null;
    ((i = this.activeMenuItem) == null ? void 0 : i.type) === "submenu" && ((n = this.activeMenuItem.element) == null || n.setAttribute("aria-expanded", r.toString())), (a = (o = this.activeMenuItem) == null ? void 0 : o.element) == null || a.classList.toggle("is-submenu-open", r), this.isSubmenuOpen = r;
  }
};
function Lp() {
  document.addEventListener("focusin", Gr, true), document.addEventListener("focusout", Gr, true), document.addEventListener("focus", Gr, true), document.addEventListener("blur", Gr, true);
}
function Gr(t38) {
  t38.stopImmediatePropagation(), t38.preventDefault();
}
function Ap() {
  document.removeEventListener("focusin", Gr, true), document.removeEventListener("focusout", Gr, true), document.removeEventListener("focus", Gr, true), document.removeEventListener("blur", Gr, true);
}
var zs = class zs2 extends Tn {
  constructor(r, i) {
    var n;
    super(r);
    this.state = "closed";
    this.typingBufferResetTimer = 0;
    this.hysteresisTimer = 0;
    this._updating = false;
    this._host = (n = i == null ? void 0 : i.host) != null ? n : null, this.isDynamic = r.some(Cp), this._modifiers = { shift: false, control: false, alt: false, meta: false }, this.typingBuffer = "", this.state = "closed";
  }
  get modifiers() {
    return this._modifiers;
  }
  set modifiers(r) {
    Lh(this._modifiers, r) || (this._modifiers = r, this.dirty = true);
  }
  get activeSubmenu() {
    let r = this;
    for (; r.isSubmenuOpen; ) r = r.activeMenuItem.submenu;
    return r;
  }
  set dirty(r) {
    this._updating || this._dirty !== r && (this._dirty = true, r && setTimeout(() => {
      this.updateState(this.modifiers), this.updateElement();
    }));
  }
  updateState(r) {
    this._updating = true, this.modifiers = r != null ? r : this.modifiers, super.updateState(this.modifiers), this._updating = false;
  }
  handleKeyupEvent(r) {
    this.isDynamic && (this.modifiers = Ht(r)), r.stopImmediatePropagation();
  }
  handleKeydownEvent(r) {
    var a, s, l;
    if (r.key === "Tab" || r.key === "Escape") {
      this.hide();
      return;
    }
    this.isDynamic && (this.modifiers = Ht(r));
    let i = true, n = this.activeSubmenu, o = n.activeMenuItem;
    switch (r.key) {
      case " ":
      case "Space":
      case "Return":
      case "Enter":
        o == null || o.select(Ht(r));
        break;
      case "ArrowRight":
        if ((o == null ? void 0 : o.type) === "submenu") o.select(Ht(r)), this.activeSubmenu.activeMenuItem = this.activeSubmenu.firstMenuItem;
        else if (!o) n.activeMenuItem = n.firstMenuItem;
        else {
          let c = (a = n.getMenuItemColumn(o)) != null ? a : -1;
          if (c >= 0 && c < ((s = n.columnCount) != null ? s : 1) - 1) {
            let u = n.nextMenuItem(1);
            u && (n.activeMenuItem = u);
          }
        }
        break;
      case "ArrowLeft":
        if (n === this.rootMenu) o || (n.activeMenuItem = n.firstMenuItem);
        else if ((o && (l = n.getMenuItemColumn(o)) != null ? l : -1) <= 0 || !o) {
          n.hide();
          let u = n.parentMenu.activeMenuItem;
          if (u) {
            let { element: d } = u;
            d == null || d.focus(), d == null || d.classList.remove("is-submenu-open");
          }
        } else {
          let u = n.nextMenuItem(-1);
          u && (n.activeMenuItem = u);
        }
        break;
      case "ArrowDown":
        n.activeMenuItem = n.nextMenuItem(n.columnCount);
        break;
      case "ArrowUp":
        n.activeMenuItem = n.nextMenuItem(-n.columnCount);
        break;
      case "Home":
      case "PageUp":
        n.activeMenuItem = n.firstMenuItem;
        break;
      case "End":
      case "PageDown":
        n.activeMenuItem = n.lastMenuItem;
        break;
      case "Backspace":
        if (this.typingBuffer && (this.typingBuffer = this.typingBuffer.slice(0, -1), this.typingBuffer)) {
          clearTimeout(this.typingBufferResetTimer);
          let c = n.findMenuItem(this.typingBuffer);
          c && (n.activeMenuItem = c), this.typingBufferResetTimer = setTimeout(() => {
            this.typingBuffer = "";
          }, 500);
        }
        break;
      default:
        if (dr(r)) {
          isFinite(this.typingBufferResetTimer) && clearTimeout(this.typingBufferResetTimer), this.typingBuffer += r.key;
          let c = n.findMenuItem(this.typingBuffer);
          c && (n.activeMenuItem = c), this.typingBufferResetTimer = setTimeout(() => {
            this.typingBuffer = "";
          }, 500);
        } else i = false;
    }
    i && (r.preventDefault(), r.stopPropagation());
  }
  handleEvent(r) {
    if (r.type === "keydown") this.handleKeydownEvent(r);
    else if (r.type === "keyup") this.handleKeyupEvent(r);
    else if (r.type === "pointermove") this.lastMoveEvent = r;
    else if (r.type === "pointerup") Number.isFinite(this.rootMenu._openTimestamp) && Date.now() - this.rootMenu._openTimestamp < 120 ? this.state = "modal" : this.state === "modal" && r.target === this.scrim && this.hide();
    else if (r.type === "contextmenu") {
      r.preventDefault(), r.stopPropagation();
      return;
    }
    super.handleEvent(r);
  }
  dispatchEvent(r) {
    return this._host ? this._host.dispatchEvent(r) : true;
  }
  get host() {
    return this._host;
  }
  get scrim() {
    return Te.element;
  }
  connectScrim(r) {
    let i = this.scrim;
    i.addEventListener("pointerup", this, true), i.addEventListener("contextmenu", this), i.addEventListener("keydown", this), i.addEventListener("keyup", this), i.addEventListener("pointermove", this), Te.open({ root: r, onDismiss: () => this.hide() });
  }
  disconnectScrim() {
    let r = this.scrim;
    r.removeEventListener("pointerup", this, true), r.removeEventListener("contextmenu", this), r.removeEventListener("keydown", this), r.removeEventListener("keyup", this), r.removeEventListener("pointermove", this), Te.state === "open" && Te.scrim.close();
  }
  get rootMenu() {
    return this;
  }
  show(r) {
    return this._onDismiss = r == null ? void 0 : r.onDismiss, r != null && r.modifiers && (this.modifiers = r.modifiers), this.updateState(), this.connectScrim(r == null ? void 0 : r.target), super.show(g(h({}, r), { container: this.scrim })) ? (this._openTimestamp = Date.now(), this.state = "open", true) : (this.disconnectScrim(), false);
  }
  hide() {
    this.cancelDelayedOperation(), this.state !== void 0 && (this.state !== "closed" && (this.activeMenuItem = null, Te.element.parentElement.focus(), super.hide(), this.state = "closed", this.disconnectScrim()), this._onDismiss && (this._onDismiss(), this._onDismiss = void 0));
  }
  scheduleOperation(r) {
    this.cancelDelayedOperation();
    let i = zs2.SUBMENU_DELAY;
    if (i <= 0) {
      r();
      return;
    }
    this.hysteresisTimer = setTimeout(() => {
      this.hysteresisTimer = 0, r();
    }, i);
  }
  cancelDelayedOperation() {
    this.hysteresisTimer && (clearTimeout(this.hysteresisTimer), this.hysteresisTimer = 0);
  }
};
zs.SUBMENU_DELAY = 120;
var To = zs;
function Cp(t38) {
  return Eo(t38) ? false : typeof t38.label == "function" || typeof t38.ariaLabel == "function" || typeof t38.tooltip == "function" || (Lt(t38) || Ur(t38)) && (typeof t38.enabled == "function" || typeof t38.visible == "function") || Lt(t38) && typeof t38.checked == "function" ? true : Ur(t38) ? t38.submenu.some(Cp) : false;
}
var Dn = class {
};
Dn.DELAY = 300, Dn.MAX_DISTANCE = 10;
function Ep(t38) {
  return new Promise((e, r) => {
    let i = bn(t38);
    i || e(false);
    let n = i, o = setTimeout(() => {
      a.abort(), e(wp(n, i) < Dn.MAX_DISTANCE);
    }, Dn.DELAY), a = new AbortController(), s = a.signal;
    for (let l of ["pointermove", "pointerup", "pointercancel"]) window.addEventListener(l, (c) => {
      if (c.type === "pointerup" || c.type === "pointercancel") clearTimeout(o), a.abort(), e(false);
      else if (c.type === "pointermove") {
        let u = bn(c);
        u && (n = u);
      }
    }, { passive: true, signal: s });
  });
}
async function Xc(t38, e, r) {
  if (t38.defaultPrevented) return false;
  if (t38.type === "contextmenu") {
    let i = t38;
    if (t38.preventDefault(), t38.stopPropagation(), r.show({ target: e, location: bn(i), modifiers: Ht(i) })) return true;
  }
  if (t38.type === "keydown") {
    let i = t38;
    if (i.code === "ContextMenu" || i.code === "F10" && i.shiftKey) {
      let n = e == null ? void 0 : e.getBoundingClientRect();
      if (Tp(e) && n && r.show({ target: e, location: { x: Math.ceil(n.left + n.width / 2), y: Math.ceil(n.top + n.height / 2) }, modifiers: Ht(i) })) return t38.preventDefault(), t38.stopPropagation(), true;
    }
  }
  if (t38.type === "pointerdown" && t38.pointerType !== "mouse" && t38.button === 0) {
    let i = t38.target;
    for (; i && e !== i; ) i = i.parentNode;
    if (!i || !r.visible) return false;
    let n = bn(t38);
    if (await Ep(t38)) return r.state !== "closed" || !Tp(e) ? false : (r.show({ target: e, location: n }), true);
  }
  return false;
}
function Tp(t38) {
  return t38.dispatchEvent(new Event("contextmenu", { cancelable: true }));
}
var Xt = { "\\ne": "≠", "\\neq": "≠", "−": "-", "-": "-", "\\alpha": "alpha", "\\beta": "beta", "\\gamma": "gamma", "\\delta": "delta", "\\epsilon": "epsilon", "\\varepsilon": "varepsilon", "\\zeta": "zeta", "\\eta": "eta", "\\theta": "theta", "\\vartheta": "vartheta", "\\iota": "iota", "\\kappa": "kappa", "\\lambda": "lambda", "\\mu": "mu", "\\nu": "nu", "\\xi": "xi", "\\pi": "pi", "\\rho": "rho", "\\sigma": "sigma", "\\tau": "tau", "\\upsilon": "upsilon", "\\phi": "phi", "\\varphi": "varphi", "\\chi": "chi", "\\psi": "psi", "\\omega": "omega", "\\Gamma": "Gamma", "\\Delta": "Delta", "\\Theta": "Theta", "\\Lambda": "Lambda", "\\Xi": "Xi", "\\Pi": "Pi", "\\Sigma": "Sigma", "\\Phi": "Phi", "\\Psi": "Psi", "\\Omega": "Omega", "\\exponentialE": "e", "\\imaginaryI": "i", "\\imaginaryJ": "j", "\\!": " ", "\\,": " ", "\\:": " ", "\\>": " ", "\\;": " ", "\\enskip": " ", "\\enspace": " ", "\\qquad": " ", "\\quad": " ", "\\infty": "oo", "\\R": "RR", "\\mathbb{R}": "RR", "\\N": "NN", "\\mathbb{N}": "NN", "\\Z": "ZZ", "\\mathbb{Z}": "ZZ", "\\Q": "QQ", "\\mathbb{Q}": "QQ", "\\C": "CC", "\\mathbb{C}": "CC", "\\emptyset": "O/", "\\varnothing": "O/", "\\varDelta": "Delta", "\\varTheta": "Theta", "\\varLambda": "Lambda", "\\varXi": "Xi", "\\varPi": "Pi", "\\varSigma": "Sigma", "\\varUpsilon": "Upsilon", "\\varPhi": "Phi", "\\varPsi": "Psi", "\\varOmega": "Omega" }, Do = { "\\pm": "+-", "\\colon": " : ", "\\sum": " sum ", "\\prod": " prod ", "\\bigcap": " nnn ", "\\bigcup": " uuu ", "\\int": " int ", "\\oint": " oint ", "\\ge": ">=", "\\le": "<=", "\\ne": "!=", "\\neq": "!=", "\\lt": "<", "\\gt": ">", "\\gets": "<-", "\\to": "->", "\\land": " and ", "\\lor": " or ", "\\lnot": " not ", "\\forall": " AA ", "\\exists": " EE ", "\\in": " in ", "\\notin": " !in ", "\\mapsto": "|->", "\\implies": "=>", "\\iff": "<=>", "\\cdot": " * ", "\\ast": " ** ", "\\star": " *** ", "\\times": " * ", "\\div": " -: ", "\\ltimes": " |>< ", "\\rtimes": " ><| ", "\\bowtie": " |><| ", "\\circ": "@" }, Ns = { "\\vert": "|", "\\Vert": "||", "\\mid": "|", "\\lbrack": "[", "\\rbrack": "]", "\\lbrace": "{", "\\rbrace": "}", "\\lparen": "(", "\\rparen": ")", "\\langle": "(:", "\\rangle": ":)" };
function cy(t38) {
  let e = "";
  for (let r of t38) {
    let i = e[e.length - 1];
    i !== void 0 && (/\d$/.test(i) && /^\d/.test(r) || /[a-zA-Z]$/.test(i) && /^[a-zA-Z]/.test(r)) && (e += " "), e += r;
  }
  return e;
}
function le(t38, e) {
  var a, s, l, c, u, d, m, p, f, y, v, b, k, S, A, E, C, _, O;
  if (!t38) return "";
  if (ee(t38)) {
    if (t38.length === 0) return "";
    if (t38[0].mode === "latex") return t38.map((K) => le(K)).join("");
    if (t38[0].mode === "text") {
      let K = 0, N = "";
      for (; ((a = t38[K]) == null ? void 0 : a.mode) === "text"; ) N += t38[K].body ? le(t38[K].body, e) : t38[K].value, K++;
      return e != null && e.plain ? N + le(t38.slice(K), e) : `"${N}" ${le(t38.slice(K))}`;
    }
    let I = 0, V = [];
    for (; ((s = t38[I]) == null ? void 0 : s.mode) === "math"; ) {
      let K = "";
      for (; ((l = t38[I]) == null ? void 0 : l.type) === "mord" && /\d/.test(t38[I].value); ) K += t38[I++].value;
      K ? V.push(K) : V.push(le(t38[I++], e));
    }
    return V.push(le(t38.slice(I), e)), cy(V);
  }
  if (t38.mode === "text") return e != null && e.plain ? t38.value : `"${t38.value}"`;
  let r = "", { command: i } = t38, n;
  if (i === "\\placeholder") return `(${le(t38.body, e)})`;
  let o = x.serialize([t38], { expandMacro: false, defaultMode: "math" });
  switch (t38.type) {
    case "accent":
      let I = { "\\vec": "vec", "\\dot": "dot", "\\ddot": "ddot", "\\bar": "bar", "\\hat": "hat", "\\acute": "acute;", "\\grave": "grave", "\\tilde": "tilde", "\\breve": "breave", "\\check": "check" }[i];
      r = `${I != null ? I : ""} ${le(t38.body, e)} `;
      break;
    case "first":
      return "";
    case "latexgroup":
      return t38.body.map((K) => K.value).join("");
    case "group":
    case "root":
      r = (c = Xt[i]) != null ? c : le(t38.body, e);
      break;
    case "genfrac":
      {
        let K = t38;
        (K.leftDelim || K.rightDelim) && (r = K.leftDelim === "." || !K.leftDelim ? "{:" : K.leftDelim), K.hasBarLine ? (r += "(", r += le(K.above, e), r += ")/(", r += le(K.below, e), r += ")") : (r += "((", r += le(K.above, e), r += ") choose (", r += le(K.below, e), r += "))"), (K.leftDelim || K.rightDelim) && (r += K.rightDelim === "." || !K.rightDelim ? "{:" : K.rightDelim);
      }
      break;
    case "surd":
      t38.hasEmptyBranch("above") ? r += `sqrt(${le(t38.body, e)})` : r += `root(${le(t38.above, e)})(${le(t38.body, e)})`;
      break;
    case "latex":
      r = t38.value;
      break;
    case "leftright":
      {
        let K = t38, N = K.leftDelim;
        N && Ns[N] && (N = Ns[N]), r += N === "." || !N ? "{:" : N, r += le(K.body, e);
        let j = K.matchingRightDelim();
        j && Ns[j] && (j = Ns[j]), r += j === "." || !j ? ":}" : j;
      }
      break;
    case "sizeddelim":
    case "delim":
      r = t38.value;
      break;
    case "overlap":
      break;
    case "overunder":
      break;
    case "mord":
      if (Xt[o]) return Xt[o];
      r = (m = (d = (u = Xt[i]) != null ? u : i) != null ? d : i) != null ? m : typeof t38.value == "string" ? t38.value : "", r.startsWith("\\") && (r += " "), n = i ? i.match(/{?\\char"([\dabcdefABCDEF]+)}?/) : null, n ? r = String.fromCodePoint(Number.parseInt("0x" + n[1])) : r.length > 0 && r.startsWith("\\") && (r = typeof t38.value == "string" ? t38.value.charAt(0) : t38.command), r = uy(r, t38.style);
      break;
    case "mbin":
    case "mrel":
    case "minner":
      r = (y = (f = (p = Xt[o]) != null ? p : Xt[i]) != null ? f : Do[i]) != null ? y : t38.value;
      break;
    case "mopen":
    case "mclose":
      r = t38.value;
      break;
    case "mpunct":
      r = (v = Do[i]) != null ? v : i;
      break;
    case "mop":
    case "operator":
    case "extensible-symbol":
      t38.value !== "​" && (Do[i] ? r = Do[i] : r = i === "\\operatorname" ? le(t38.body, e) : (b = t38.value) != null ? b : i, r += " ");
      break;
    case "array":
      let V = t38.environmentName;
      if (t38.isMultiline) r = t38.rows.map((N) => N.map((j) => le(j, e)).join("")).join(`
`);
      else {
        let K = (k = { bmatrix: ["[", "]"], "bmatrix*": ["[", "]"] }[V]) != null ? k : ["(", ")"], N = [], j = t38.rows;
        for (let W of j) {
          let ie = [];
          for (let X of W) ie.push(le(X, e));
          N.push(K[0] + ie.join(",") + K[1]);
        }
        let D = (S = { bmatrix: ["[", "]"], "bmatrix*": ["[", "]"], cases: ["{", ":}"] }[V]) != null ? S : ["(", ")"];
        r = D[0] + N.join(",") + D[1];
      }
      break;
    case "box":
      break;
    case "spacing":
      r = (E = (A = Xt[o]) != null ? A : Xt[i]) != null ? E : " ";
      break;
    case "enclose":
      r = "(" + le(t38.body, e) + ")";
      break;
    case "space":
      r = " ";
      break;
    case "subsup":
      r = "";
      break;
    case "macro":
      r = (O = (_ = (C = Xt[o]) != null ? C : Xt[i]) != null ? _ : Do[i]) != null ? O : le(t38.body, e);
      break;
  }
  if (!t38.hasEmptyBranch("subscript")) {
    r += "_";
    let I = le(t38.subscript, e);
    r += I.length !== 1 ? `(${I})` : I;
  }
  if (!t38.hasEmptyBranch("superscript")) {
    r += "^";
    let I = le(t38.superscript, e);
    r += I.length !== 1 ? `(${I})` : I;
  }
  return r;
}
function uy(t38, e) {
  if (!e) return t38;
  let r = t38;
  return e.variant === "double-struck" && (r = `bbb "${r}"`), e.variant === "script" && (r = `cc "${r}"`), e.variant === "fraktur" && (r = `fr "${r}"`), e.variant === "sans-serif" && (r = `sf "${r}"`), e.variant === "monospace" && (r = `tt "${r}"`), e.variantStyle === "bold" && (r = `bb "${r}"`), e.color ? `color({${e.color}})(${r})` : r;
}
function fe(t38, e) {
  var u;
  let r = g(h({}, Qn()), { renderPlaceholder: () => new w(160, { maxFontSize: 1 }) });
  if (e != null && e.letterShapeStyle && (e == null ? void 0 : e.letterShapeStyle) !== "auto" && (r.letterShapeStyle = e.letterShapeStyle), e != null && e.macros) {
    let d = ei(e == null ? void 0 : e.macros);
    r.getMacro = (m) => ti(m, d);
  }
  e != null && e.registers && (r.registers = h(h({}, r.registers), e.registers));
  let i = (u = e == null ? void 0 : e.defaultMode) != null ? u : "math", n = "math", o = "displaystyle";
  i === "inline-math" ? o = "textstyle" : i === "math" ? o = "displaystyle" : i === "text" && (o = "textstyle", n = "text");
  let a = new P({ from: r }), l = new x({ type: "root", mode: n, body: be(t38, { context: a, parseMode: n, mathstyle: o }) }).render(a);
  return l ? (Or(qt(l, a)), Br(l, { classes: "ML__latex" }).toMarkup()) : "";
}
function Fs(t38, e = {}) {
  return G(be(t38, { parseMode: "math", args: () => "", mathstyle: "displaystyle" }), e);
}
function $s(t38) {
  let e = be(t38, { parseMode: "math", mathstyle: "displaystyle" });
  return wt(e);
}
function Dp(t38) {
  return or(t38, { format: "ascii-math" })[1];
}
function Oo(t38) {
  if (typeof t38 == "string") {
    let e = dy(t38);
    if (!e) throw new Error(`Invalid color: ${t38}`);
    return e;
  }
  return "C" in t38 ? hy(t38) : "a" in t38 ? Op(t38) : t38;
}
function Ci(t38) {
  return t38 < 0 ? 0 : t38 > 255 ? 255 : Math.round(t38);
}
function dy(t38) {
  if (!t38 || t38[0] !== "#") return;
  t38 = t38.slice(1);
  let e;
  return t38.length <= 4 ? (e = { r: parseInt(t38[0] + t38[0], 16), g: parseInt(t38[1] + t38[1], 16), b: parseInt(t38[2] + t38[2], 16) }, t38.length === 4 && (e.a = parseInt(t38[3] + t38[3], 16) / 255)) : (e = { r: parseInt(t38[0] + t38[1], 16), g: parseInt(t38[2] + t38[3], 16), b: parseInt(t38[4] + t38[5], 16) }, t38.length === 8 && (e.a = parseInt(t38[6] + t38[7], 16) / 255)), typeof (e == null ? void 0 : e.a) == "undefined" && (e.a = 1), e;
}
function eu(t38) {
  let [e, r, i] = [t38.L, t38.C, t38.H], n = i * Math.PI / 180, o = { L: e, a: r * Math.cos(n), b: r * Math.sin(n) };
  return t38.alpha !== void 0 && (o.alpha = t38.alpha), o;
}
function my(t38) {
  let [e, r, i] = [t38.L, t38.a, t38.b], n = Math.sqrt(r * r + i * i), a = Math.atan2(i, r) * 180 / Math.PI, s = { L: e, C: n, H: a };
  return t38.alpha !== void 0 && (s.alpha = t38.alpha), s;
}
function Zc(t38) {
  let [e, r, i] = [t38.L, t38.a, t38.b], n = Math.pow(0.9999999984505198 * e + 0.39633779217376786 * r + 0.2158037580607588 * i, 3), o = Math.pow(1.00000000888176 * e - 0.10556134232365635 * r - 0.0638541747717059 * i, 3), a = Math.pow(e * 1.000000054672411 - 0.0894841820949657 * r - 1.2914855378640917 * i, 3), s = 4.076741661347994 * n - 3.307711590408193 * o + 0.230969928729428 * a, l = -1.2684380040921763 * n + 2.6097574006633715 * o - 0.3413193963102197 * a, c = -0.004196086541837188 * n - 0.7034186144594493 * o + 1.7076147009309444 * a, u = (d) => {
    let m = Math.abs(d);
    return m <= 31308e-7 ? d * 12.92 : (Math.sign(d) || 1) * (1.055 * Math.pow(m, 1 / 2.4) - 0.055);
  };
  return [u(s), u(l), u(c)];
}
function Yc(t38) {
  let [e, r, i] = t38;
  return e >= 0 && e <= 1 && r >= 0 && r <= 1 && i >= 0 && i <= 1;
}
function Qc(t38, e) {
  let [r, i, n] = t38;
  return r = Ci(r * 255), i = Ci(i * 255), n = Ci(n * 255), e !== void 0 ? { r, g: i, b: n, alpha: e } : { r, g: i, b: n };
}
function Op(t38) {
  let [e, r, i] = Zc(t38);
  if (Yc([e, r, i])) return Qc([e, r, i], t38.alpha);
  let n = my(t38);
  if (n.C = 0, [e, r, i] = Zc(eu(n)), !Yc([e, r, i])) return Qc([e, r, i], t38.alpha);
  let o = 0, a = t38.L, s = (o + a) / 2;
  n.C = s;
  let l = 0.36 / Math.pow(2, 12);
  for (; a - o > l; ) s = (o + a) / 2, n.C = s, [e, r, i] = Zc(eu(n)), Yc([e, r, i]) ? o = s : a = s;
  return Qc([e, r, i], t38.alpha);
}
function hy(t38) {
  return Op(eu(t38));
}
function Bp(t38, e) {
  let r = Oo(t38), i = Oo(e), n = 0.56, o = 0.57, a = 0.62, s = 0.65, l = 0.022, c = 1.414, u = 0.1, d = 5e-4, m = 1.14, p = 0.027, f = 1.14, y = 0.027;
  function v(_) {
    return _ >= l ? _ : _ + (l - _) ** c;
  }
  function b(_) {
    return (_ < 0 ? -1 : 1) * Math.pow(Math.abs(_), 2.4);
  }
  let k = v(b(i.r / 255) * 0.2126729 + b(i.g / 255) * 0.7151522 + b(i.b / 255) * 0.072175), S = v(b(r.r / 255) * 0.2126729 + b(r.g / 255) * 0.7151522 + b(r.b / 255) * 0.072175), A, E, C;
  return Math.abs(S - k) < d ? E = 0 : S > k ? (A = S ** n - k ** o, E = A * m) : (A = S ** s - k ** a, E = A * f), Math.abs(E) < u ? C = 0 : E > 0 ? C = E - y : C = E + p, C * 100;
}
function tu(t38, e, r) {
  r != null || (r = "#fff"), e != null || (e = "#000");
  let i = Bp(t38, r), n = Bp(t38, e);
  return Math.abs(i) > Math.abs(n) ? r : e;
}
function Kp(t38) {
  let e = Oo(t38), r = ((1 << 24) + (Ci(e.r) << 16) + (Ci(e.g) << 8) + Ci(e.b)).toString(16).slice(1);
  return e.alpha !== void 0 && e.alpha < 1 && (r += ("00" + Math.round(e.alpha * 255).toString(16)).slice(-2)), r[0] === r[1] && r[2] === r[3] && r[4] === r[5] && r[6] === r[7] && (r = r[0] + r[2] + r[4] + (e.alpha !== void 0 && e.alpha < 1 ? r[6] : "")), "#" + r;
}
function oe(t38) {
  let e = Pp(t38), r = "";
  for (let i of e) {
    if (typeof i.value != "string") return "";
    r += i.value;
  }
  return r;
}
function Pp(t38) {
  let r = t38.model.selection.ranges;
  if (r.length !== 1) return [];
  let i = t38.model.getAtoms(r[0]);
  return i.length === 1 && i[0].isRoot && (i = i[0].children), i.filter((n) => n.type !== "first");
}
function py(t38, e) {
  let r = Pp(t38);
  if (r.length !== 1) return false;
  let i = as[e];
  return i ? !!i.test(r[0].value) : false;
}
function fy(t38) {
  return [iu(t38, "double-struck", "mathbb", "tooltip.blackboard"), iu(t38, "fraktur", "mathfrak", "tooltip.fraktur"), iu(t38, "calligraphic", "mathcal", "tooltip.caligraphic"), nu(t38, "up", "mathrm", "tooltip.roman-upright"), nu(t38, "bold", "bm", "tooltip.bold"), nu(t38, "italic", "mathit", "tooltip.italic")];
}
function gy(t38) {
  return [{ id: "accent-vec", class: "ML__center-menu", label: () => fe(`\\vec{${oe(t38)}}`), visible: () => oe(t38).length === 1, onMenuSelect: () => t38.insert("\\vec{#@}", { selectionMode: "item" }) }, { id: "accent-overrightarrow", class: "ML__center-menu", label: () => fe(`\\overrightarrow{${oe(t38)}}`), visible: () => oe(t38).length > 0, onMenuSelect: () => t38.insert("\\overrightarrow{#@}", { selectionMode: "item" }) }, { id: "accent-overleftarrow", class: "ML__center-menu", label: () => fe(`\\overleftarrow{${oe(t38)}}`), visible: () => oe(t38).length > 0, onMenuSelect: () => t38.insert("\\overleftarrow{#@}", { selectionMode: "item" }) }, { id: "accent-dot", class: "ML__center-menu", label: () => fe(`\\dot{${oe(t38)}}`), visible: () => oe(t38).length === 1, onMenuSelect: () => t38.insert("\\dot{#@}", { selectionMode: "item" }) }, { id: "accent-ddot", class: "ML__center-menu", label: () => fe(`\\ddot{${oe(t38)}}`), visible: () => oe(t38).length === 1, onMenuSelect: () => t38.insert("\\ddot{#@}", { selectionMode: "item" }) }, { id: "accent-bar", class: "ML__center-menu", label: () => fe(`\\bar{${oe(t38)}}`), visible: () => oe(t38).length === 1, onMenuSelect: () => t38.insert("\\bar{#@}", { selectionMode: "item" }) }, { id: "accent-overline", class: "ML__center-menu", label: () => fe(`\\overline{${oe(t38)}}`), visible: () => oe(t38).length > 0, onMenuSelect: () => t38.insert("\\overline{#@}", { selectionMode: "item" }) }, { id: "accent-overgroup", class: "ML__center-menu", label: () => fe(`\\overgroup{${oe(t38)}}`), visible: () => oe(t38).length > 0, onMenuSelect: () => t38.insert("\\overgroup{#@}", { selectionMode: "item" }) }, { id: "accent-overbrace", class: "ML__center-menu", label: () => fe(`\\overbrace{${oe(t38)}}`), visible: () => oe(t38).length > 0, onMenuSelect: () => t38.insert("\\overbrace{#@}", { selectionMode: "item" }) }, { id: "accent-underline", class: "ML__center-menu", label: () => fe(`\\underline{${oe(t38)}}`), visible: () => oe(t38).length > 0, onMenuSelect: () => t38.insert("\\underline{#@}", { selectionMode: "item" }) }, { id: "accent-undergroup", class: "ML__center-menu", label: () => fe(`\\undergroup{${oe(t38)}}`), visible: () => oe(t38).length > 0, onMenuSelect: () => t38.insert("\\undergroup{#@}", { selectionMode: "item" }) }, { id: "accent-underbrace", class: "ML__center-menu", label: () => fe(`\\underbrace{${oe(t38)}}`), visible: () => oe(t38).length > 0, onMenuSelect: () => t38.insert("\\underbrace{#@}", { selectionMode: "item" }) }];
}
function by(t38) {
  return [{ id: "decoration-boxed", label: () => fe(`\\boxed{${t38.getValue(t38.model.selection)}}}`), onMenuSelect: () => t38.insert("\\boxed{#@}", { selectionMode: "item" }) }, { id: "decoration-red-box", label: () => fe(`\\bbox[5px, border: 2px solid red]{${t38.getValue(t38.model.selection)}}`), onMenuSelect: () => t38.insert("\\bbox[5px, border: 2px solid red]{#@}", { selectionMode: "item" }) }, { id: "decoration-dashed-black-box", label: () => fe(`\\bbox[5px, border: 2px dashed black]{${t38.getValue(t38.model.selection)}}`), onMenuSelect: () => t38.insert("\\bbox[5px, border: 2px dashed black]{#@}", { selectionMode: "item" }) }];
}
function yy(t38) {
  let e = [];
  for (let r of Object.keys(Qt)) e.push({ id: `background-color-${r}`, class: (Kp(tu(Qt[r])) === "#000" ? "dark-contrast" : "light-contrast") + " menu-swatch", label: `<span style="background:${Qt[r]} "></span>`, ariaLabel: () => {
    var i;
    return (i = $(r)) != null ? i : r;
  }, checked: () => {
    var i;
    return (i = { some: "mixed", all: true }[t38.queryStyle({ backgroundColor: r })]) != null ? i : false;
  }, onMenuSelect: () => t38.applyStyle({ backgroundColor: r }, { operation: "toggle" }) });
  return e;
}
function xy(t38) {
  let e = [];
  for (let r of Object.keys(er)) e.push({ id: `color-${r}`, class: (tu(er[r]) === "#000" ? "dark-contrast" : "light-contrast") + " menu-swatch", label: `<span style="background:${er[r]} "></span>`, ariaLabel: () => {
    var i;
    return (i = $(r)) != null ? i : r;
  }, checked: () => {
    var i;
    return (i = { some: "mixed", all: true }[t38.queryStyle({ color: r })]) != null ? i : false;
  }, onMenuSelect: () => t38.applyStyle({ color: r }, { operation: "toggle" }) });
  return e;
}
var ou = class extends En {
  constructor(e, r, i, n) {
    super(e, r), this.row = i, this.col = n;
  }
  set active(e) {
    let r = this.parentMenu.children;
    if (e) for (let i of r) i.element.classList.toggle("active", i.row <= this.row && i.col <= this.col);
    else for (let i of r) i.element.classList.remove("active");
  }
};
function vy(t38) {
  let e = [];
  for (let r = 1; r <= 5; r++) for (let i = 1; i <= 5; i++) e.push({ id: `insert-matrix-${r}x${i}`, onCreate: (n, o) => new ou(n, o, r, i), label: "☐", tooltip: () => $("tooltip.row-by-col", r, i), data: { row: r, col: i }, onMenuSelect: () => {
    t38.insert(`\\begin{pmatrix}${Array(r).fill(Array(i).fill("#?").join(" & ")).join("\\\\")}\\end{pmatrix}`, { selectionMode: "item" });
  } });
  return e;
}
function Rp(t38) {
  return [{ label: () => $("menu.array.add row above"), id: "add-row-above", onMenuSelect: () => t38.executeCommand("addRowBefore"), keyboardShortcut: "shift+alt+[Return]", visible: () => {
    if (!t38.isSelectionEditable || !Ei(t38)) return false;
    let [e] = jr(t38), [i] = On(t38);
    return e !== i;
  } }, { label: () => $("menu.array.add row below"), id: "add-row-below", onMenuSelect: () => t38.executeCommand("addRowAfter"), keyboardShortcut: "alt+[Return]", visible: () => {
    if (!t38.isSelectionEditable || !Ei(t38)) return false;
    let [e] = jr(t38), [i] = On(t38);
    return e !== i;
  } }, { label: () => $("menu.array.add column before"), id: "add-column-before", onMenuSelect: () => t38.executeCommand("addColumnBefore"), visible: () => {
    if (!t38.isSelectionEditable || !Ei(t38)) return false;
    let [e, r] = jr(t38), [i, n] = On(t38);
    return r !== n;
  }, keyboardShortcut: "shift+alt+[Tab]", enabled: () => {
    let e = t38.model.parentEnvironment;
    if (!e) return false;
    let [r] = ru(t38);
    return r < e.maxColumns;
  } }, { label: () => $("menu.array.add column after"), id: "add-column-after", onMenuSelect: () => t38.executeCommand("addColumnAfter"), keyboardShortcut: "alt+[Tab]", visible: () => {
    if (!t38.isSelectionEditable || !Ei(t38)) return false;
    let [e, r] = jr(t38), [i, n] = On(t38);
    return r !== n;
  } }, { type: "divider" }, { label: () => $("menu.array.delete row"), id: "delete-row", onMenuSelect: () => t38.executeCommand("removeRow"), enabled: () => {
    let [e] = jr(t38), [i] = ru(t38);
    return i > e;
  }, visible: () => {
    if (!t38.isSelectionEditable || !Ei(t38)) return false;
    let [e] = jr(t38), [i] = On(t38);
    return e !== i;
  } }, { label: () => $("menu.array.delete column"), id: "delete-column", onMenuSelect: () => t38.executeCommand("removeColumn"), enabled: () => {
    let [e, r] = jr(t38), [i, n] = ru(t38);
    return n > r;
  }, visible: () => {
    if (!t38.isSelectionEditable || !Ei(t38)) return false;
    let [e, r] = jr(t38), [i, n] = On(t38);
    return r !== n;
  } }, { type: "divider" }, { label: () => $("menu.borders"), visible: () => (_y(t38) || Ei(t38)) && t38.isSelectionEditable, submenu: [{ label: " ⋱ ", id: "environment-no-border", onMenuSelect: () => Bo(t38, "matrix") }, { label: "(⋱)", id: "environment-parentheses", onMenuSelect: () => Bo(t38, "pmatrix") }, { label: "[⋱]", id: "environment-brackets", onMenuSelect: () => Bo(t38, "bmatrix") }, { label: "|⋱|", id: "environment-bar", onMenuSelect: () => Bo(t38, "vmatrix") }, { label: "{⋱}", id: "environment-braces", onMenuSelect: () => Bo(t38, "Bmatrix") }], submenuClass: "border-submenu" }, { type: "divider" }, { label: () => $("menu.insert matrix"), id: "insert-matrix", visible: () => t38.isSelectionEditable, submenu: vy(t38), submenuClass: "insert-matrix-submenu", columnCount: 5 }, { type: "divider" }, { label: () => $("menu.insert"), id: "insert", submenu: My(t38) }, { type: "divider" }, { label: () => $("menu.mode"), id: "mode", visible: () => t38.isSelectionEditable && t38.model.selectionIsCollapsed, submenu: [{ label: () => $("menu.mode-math"), id: "mode-math", onMenuSelect: () => {
    Qe(t38, "accept-all"), t38.executeCommand(["switchMode", "math"]);
  }, checked: () => t38.model.mode === "math" }, { label: () => $("menu.mode-text"), id: "mode-text", onMenuSelect: () => {
    Qe(t38, "accept-all"), t38.executeCommand(["switchMode", "text"]);
  }, checked: () => t38.model.mode === "text" }, { label: () => $("menu.mode-latex"), id: "mode-latex", onMenuSelect: () => t38.executeCommand(["switchMode", "latex"]), checked: () => t38.model.mode === "latex" }] }, { type: "divider" }, { label: () => $("menu.font-style"), id: "variant", visible: () => t38.isSelectionEditable, submenu: fy(t38), submenuClass: "variant-submenu" }, { label: () => $("menu.color"), id: "color", visible: () => t38.isSelectionEditable, submenu: xy(t38), columnCount: 4, submenuClass: "swatches-submenu" }, { label: () => $("menu.background-color"), id: "background-color", visible: () => t38.isSelectionEditable, submenu: yy(t38), columnCount: 4, submenuClass: "swatches-submenu" }, { label: () => $("menu.accent"), id: "accent", visible: () => t38.isSelectionEditable, submenu: gy(t38), submenuClass: "variant-submenu" }, { label: () => $("menu.decoration"), id: "decoration", visible: () => t38.isSelectionEditable && oe(t38).length > 0, submenu: by(t38), submenuClass: "variant-submenu" }, { type: "divider" }, { label: () => $("menu.cut"), id: "cut", onMenuSelect: () => t38.executeCommand("cutToClipboard"), visible: () => !t38.options.readOnly && t38.isSelectionEditable, keyboardShortcut: "meta+X" }, { label: () => $("menu.copy"), id: "copy", submenu: [{ label: () => $("menu.copy-as-latex"), id: "copy-latex", onMenuSelect: () => H.copyToClipboard(t38, "latex"), keyboardShortcut: "meta+C" }, { label: () => $("menu.copy-as-typst"), id: "copy-latex", onMenuSelect: () => H.copyToClipboard(t38, "typst") }, { label: () => $("menu.copy-as-ascii-math"), id: "copy-ascii-math", onMenuSelect: () => H.copyToClipboard(t38, "ascii-math") }, { label: () => $("menu.copy-as-mathml"), id: "copy-math-ml", onMenuSelect: () => H.copyToClipboard(t38, "math-ml") }] }, { label: () => $("menu.paste"), id: "paste", onMenuSelect: () => t38.executeCommand("pasteFromClipboard"), visible: () => t38.hasEditableContent, keyboardShortcut: "meta+V" }, { label: () => $("menu.select-all"), id: "select-all", keyboardShortcut: "meta+A", onMenuSelect: () => t38.executeCommand("selectAll") }];
}
function Ei(t38) {
  var r, i;
  let e = (i = (r = t38.model.parentEnvironment) == null ? void 0 : r.environmentName) != null ? i : "";
  return ["array", "matrix", "pmatrix", "bmatrix", "vmatrix", "Bmatrix", "cases", "dcases", "rcases"].includes(e);
}
function _y(t38) {
  let e = t38.model.at(t38.model.position);
  if (e.type !== "array") return false;
  let r = e.environmentName;
  return ["matrix", "pmatrix", "bmatrix", "vmatrix", "Bmatrix"].includes(r);
}
function ru(t38) {
  var r;
  let e = (r = t38.model.parentEnvironment) == null ? void 0 : r.rows;
  return e ? [e.length, e.reduce((i, n) => Math.max(i, n.length), 0)] : [0, 0];
}
function jr(t38) {
  let e = t38.model.parentEnvironment;
  return e ? [e.minRows, e.minColumns] : [0, 0];
}
function On(t38) {
  let e = t38.model.parentEnvironment;
  return e ? [e.maxRows, e.maxColumns] : [0, 0];
}
function Bo(t38, e) {
  xi(t38), t38.flushInlineShortcutBuffer(), Rc(t38.model, e), Y(t38);
}
function iu(t38, e, r, i) {
  return { id: `variant-${e}`, label: () => {
    var o;
    return oe(t38).length < 12 ? fe(`\\${r}{${oe(t38)}}`) : (o = $(i)) != null ? o : i;
  }, class: "ML__xl", tooltip: () => {
    var n;
    return (n = $(i)) != null ? n : i;
  }, visible: () => py(t38, e), checked: () => {
    var n;
    return (n = { some: "mixed", all: true }[t38.queryStyle({ variant: e })]) != null ? n : false;
  }, onMenuSelect: () => t38.applyStyle({ variant: e }, { operation: "toggle" }) };
}
function nu(t38, e, r, i) {
  return { id: `variant-style-${e}`, label: () => {
    var o;
    let n = oe(t38);
    return n.length > 0 && n.length < 12 ? fe(`\\${r}{${oe(t38)}}`) : (o = $(i)) != null ? o : i;
  }, class: () => {
    let n = oe(t38);
    return n.length > 0 && n.length < 12 ? "ML__xl" : "";
  }, tooltip: () => {
    var n;
    return (n = $(i)) != null ? n : i;
  }, visible: true, checked: () => {
    var n;
    return (n = { some: "mixed", all: true }[t38.queryStyle({ variantStyle: e })]) != null ? n : false;
  }, onMenuSelect: () => t38.applyStyle({ variantStyle: e }, { operation: "toggle" }) };
}
function My(t38) {
  return [{ label: () => et("abs"), id: "insert-abs", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("|#?|") }, { label: () => et("nth-root"), id: "insert-nth-root", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\sqrt[#?]{#?}") }, { label: () => et("log-base"), id: "insert-log-base", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\log_{#?}{#?}") }, { type: "heading", label: () => $("menu.insert.heading-calculus") }, { label: () => et("derivative"), id: "insert-derivative", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\dfrac{\\mathrm{d}}{\\mathrm{d}x}#?\\bigm|_{x=#?}") }, { label: () => et("nth-derivative"), id: "insert-nth-derivative", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\dfrac{\\mathrm{d}^#?}{\\mathrm{d}x^#?}#?\\bigm|_{x=#?}") }, { label: () => et("integral"), id: "insert-integral", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\int_#?^#?#?\\,\\mathrm{d}#?") }, { label: () => et("sum"), id: "insert-sum", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\sum_#?^#?#?") }, { label: () => et("product"), id: "insert-product", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\prod_#?^#?#?") }, { type: "heading", label: () => $("menu.insert.heading-complex-numbers") }, { label: () => et("modulus"), id: "insert-modulus", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\lvert#?\\rvert") }, { label: () => et("argument"), id: "insert-argument", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\arg(#?)") }, { label: () => et("real-part"), id: "insert-real-part", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\Re(#?)") }, { label: () => et("imaginary-part"), id: "insert-imaginary-part", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\Im(#?)") }, { label: () => et("conjugate"), id: "insert-conjugate", visible: () => t38.isSelectionEditable, onMenuSelect: () => t38.insert("\\overline{#?}") }];
}
function et(t38) {
  return `<span class='ML__insert-template'> ${fe($(`menu.insert.${t38}-template`))}</span><span class="ML__insert-label">${$(`menu.insert.${t38}`)}</span>`;
}
var Ve = { "\\ne": "!=", "\\neq": "!=", "−": "-", "-": "-", "\\alpha": "alpha", "\\beta": "beta", "\\gamma": "gamma", "\\delta": "delta", "\\epsilon": "epsilon.alt", "\\varepsilon": "epsilon", "\\zeta": "zeta", "\\eta": "eta", "\\theta": "theta.alt", "\\vartheta": "theta", "\\iota": "iota", "\\kappa": "kappa", "\\lambda": "lambda", "\\mu": "mu", "\\nu": "nu", "\\xi": "xi", "\\pi": "pi", "\\rho": "rho", "\\sigma": "sigma", "\\tau": "tau", "\\upsilon": "upsilon", "\\phi": "phi.alt", "\\varphi": "phi", "\\chi": "chi", "\\psi": "psi", "\\omega": "omega", "\\Gamma": "Gamma", "\\Delta": "Delta", "\\Theta": "Theta", "\\Lambda": "Lambda", "\\Xi": "Xi", "\\Pi": "Pi", "\\Sigma": "Sigma", "\\Phi": "Phi", "\\Psi": "Psi", "\\Omega": "Omega", "\\exponentialE": "e", "\\imaginaryI": "i", "\\imaginaryJ": "j", "\\!": " #h(-1em/6) ", "\\,": " thin ", "\\:": " med ", "\\>": " med ", "\\;": " thick ", "\\enskip": "space.en", "\\enspace": "space.en", "\\qquad": "space.quad space.quad", "\\quad": "space.quad", "\\infty": "infinity", "\\R": "RR", "\\mathbb{R}": "RR", "\\N": "NN", "\\mathbb{N}": "NN", "\\Z": "ZZ", "\\mathbb{Z}": "ZZ", "\\Q": "QQ", "\\mathbb{Q}": "QQ", "\\C": "CC", "\\mathbb{C}": "CC", "\\emptyset": "emptyset", "\\varnothing": "nothing", "\\varDelta": "Delta", "\\varTheta": "Theta", "\\varLambda": "Lambda", "\\varXi": "Xi", "\\varPi": "Pi", "\\varSigma": "Sigma", "\\varUpsilon": "Upsilon", "\\varPhi": "Phi", "\\varPsi": "Psi", "\\varOmega": "Omega", "\\vert": " | ", "\\Vert": " || ", "\\mid": " divides ", "\\lbrack": " bracket.l ", "\\rbrack": " bracket.r ", "\\lbrace": " brace.l ", "\\rbrace": " brace.r ", "\\lparen": " paren.l ", "\\rparen": " paren.r ", "\\langle": " angle.l ", "\\rangle": " angle.r ", "\\differentialD": " dif ", "\\diamond": " diamond.stroked.small ", "\\square": " square.stroked.small ", "\\lceil": " ceil.l ", "\\rceil": " ceil.r ", "\\lfloor": " floor.l ", "\\rfloor": " floor.r ", "\\aleph": " aleph ", "\\bet": " bet ", "\\gimel": " gimel ", "\\dalet": " dalet ", "\\mod": " mod ", "\\equiv": " equiv ", "\\subset": " subset ", "\\supset": " supset ", "\\subseteq": " subset.eq ", "\\supseteq": " supset.eq ", "\\subsetneq": " subset.neq ", "\\supsetneq": " supset.neq ", "\\supsetneqq": " supset.neq ", "\\nsubset": " subset.not ", "\\nsupset": " supset.not ", "\\nsubseteq": " subset.eq.not ", "\\nsupseteq": " supset.eq.not ", "\\approx": " approx ", "\\uparrow": " arrow.t ", "\\downarrow": " arrow.b ", "\\rightarrow": " arrow.r ", "\\leftarrow": " arrow.l ", "\\longmapsto": " mapsto.long ", "\\longmapsfrom": " arrow.l.bar.long ", "/": "\\/", "&": "&" }, Ip = { "[": " bracket.l ", "]": " bracket.r ", "{": " brace.l ", "}": " brace.r ", "(": " paren.l ", ")": " paren.r ", "<": " angle.l ", ">": " angle.r ", ".": "" }, zp = { " bracket.l ": "[", " bracket.r ": "]", " brace.l ": "{", " brace.r ": "}", " paren.l ": "(", " paren.r ": ")", " angle.l ": " angle.l ", " angle.r ": " angle.r " }, Ko = { "\\pm": "plus.minus", "\\colon": " : ", "\\sum": " sum ", "\\prod": " product ", "\\bigcap": " inter.big ", "\\bigcup": " union.big ", "\\int": " integral ", "\\iint": " integral.double ", "\\iiint": " integral.triple ", "\\intop": " integral ", "\\oint": " integral.cont ", "\\oiint": " integral.surf ", "\\oiiint": " integral.vol ", "\\setminus": " without ", "\\vdots": " without ", "\\ddots": " dots.down ", "\\ge": ">=", "\\le": "<=", "\\ne": "!=", "\\neq": "!=", "\\lt": "<", "\\gt": ">", "\\gets": "<-", "\\to": "->", "\\land": " and ", "\\lor": " or ", "\\lnot": " not ", "\\forall": " forall ", "\\exists": " exists ", "\\in": " in ", "\\notin": " in.not ", "\\mapsto": "|->", "\\implies": "==>", "\\iff": "<==>", "\\cdot": " dot.op ", "\\ast": " * ", "\\star": " star.op ", "\\times": " times ", "\\div": " div ", "\\ltimes": " times.l ", "\\rtimes": " times.r ", "\\bowtie": " ⋈ ", "\\circ": " circle.stroked.small " }, wy = { underarc: "underparen", underparen: "underparen", underbrace: "underbrace", underline: "underline", overarc: "overparen", overparen: "overparen", overbrace: "overbrace", overline: "overline", cancel: "cancel", displaystyle: "display", textstyle: "inline" }, Sy = { longrightarrow: (t38) => `arrow.r.long^(${ae(t38.above)})`, longleftarrow: (t38) => `arrow.l.long^(${ae(t38.above)})` };
function ky(t38) {
  let e = "";
  for (let r of t38) {
    let i = e[e.length - 1];
    i !== void 0 && (/\d$/.test(i) && /^\d/.test(r) || /[a-zA-Z]$/.test(i) && /^[a-zA-Z]/.test(r)) && (e += " "), e += r;
  }
  return e;
}
function ae(t38) {
  var o, a, s, l, c, u, d, m, p, f, y, v, b, k, S, A, E, C, _, O, I, V, K;
  if (!t38) return "";
  if (ee(t38)) {
    if (t38.length === 0) return "";
    if (t38[0].mode === "latex") return t38.map((D) => ae(D)).join("");
    if (t38[0].mode === "text") {
      let D = 0, W = "";
      for (; ((o = t38[D]) == null ? void 0 : o.mode) === "text"; ) W += t38[D].body ? ae(t38[D].body) : t38[D].value, D++;
      return ` "${W}" ${ae(t38.slice(D))}`;
    }
    let N = 0, j = [];
    for (; ((a = t38[N]) == null ? void 0 : a.mode) === "math"; ) {
      let D = "";
      for (; ((s = t38[N]) == null ? void 0 : s.type) === "mord" && /\d/.test(t38[N].value); ) D += t38[N++].value;
      D ? j.push(D) : j.push(ae(t38[N++]));
    }
    return j.push(ae(t38.slice(N))), ky(j);
  }
  if (t38.mode === "text") return `"${t38.value}"`;
  let e = "", { command: r } = t38, i;
  if (r === "\\placeholder") return `"${ae(t38.body)}"`;
  let n = x.serialize([t38], { expandMacro: true, defaultMode: "math" });
  switch (t38.type) {
    case "accent":
      let N = { "\\vec": "arrow", "\\dot": "dot", "\\ddot": "dot.double", "\\bar": "overline", "\\hat": "hat", "\\acute": "acute", "\\grave": "grave", "\\tilde": "tilde", "\\breve": "breve", "\\check": "caron" }[r];
      e = `${N != null ? N : ""}(${ae(t38.body)}) `;
      break;
    case "first":
      return "";
    case "latexgroup":
      return t38.body.map((D) => D.value).join("");
    case "group":
    case "root":
      e = (l = Ve[r]) != null ? l : ae(t38.body);
      break;
    case "genfrac":
      {
        let D = t38;
        D.hasBarLine ? (e += "(", e += ae(D.above), e += ")/(", e += ae(D.below), e += ")") : e += `binom(${ae(D.above)}, ${ae(D.below)})`;
      }
      break;
    case "surd":
      t38.hasEmptyBranch("above") ? e += `sqrt(${ae(t38.body)})` : e += `root(${ae(t38.above)}, ${ae(t38.body)})`;
      break;
    case "latex":
      e = t38.value;
      break;
    case "leftright":
      {
        let D = t38, W = D.leftDelim;
        W && Ve[W] && (W = Ve[W]);
        let ie = D.matchingRightDelim();
        ie && Ve[ie] && (ie = Ve[ie]), W && (W = (c = Ip[W]) != null ? c : W), ie && (ie = (u = Ip[ie]) != null ? u : ie), W && ie ? e = `lr(${(d = zp[W]) != null ? d : W}${ae(D.body)}${(m = zp[ie]) != null ? m : ie})` : e = `lr(${W}${ae(D.body)}${ie})`;
      }
      break;
    case "sizeddelim":
    case "delim":
      e = t38.value;
      break;
    case "overlap":
      break;
    case "mord":
      if (Ve[n]) return Ve[n];
      e = (y = (f = (p = Ve[r]) != null ? p : r) != null ? f : r) != null ? y : typeof t38.value == "string" ? t38.value : "", e.startsWith("\\") && (e += " "), i = r ? r.match(/{?\\char"([\dabcdefABCDEF]+)}?/) : null, i ? e = String.fromCodePoint(Number.parseInt("0x" + i[1])) : e.length > 0 && e.startsWith("\\") && (e = typeof t38.value == "string" ? t38.value.charAt(0) : t38.command), e = Ly(e, t38.style), e = ` ${e} `;
      break;
    case "mbin":
    case "mrel":
    case "minner":
      e = (k = (b = (v = Ve[n]) != null ? v : Ve[r]) != null ? b : Ko[r]) != null ? k : t38.value;
      break;
    case "mopen":
    case "mclose":
      e = (S = Ve[n]) != null ? S : t38.value;
      break;
    case "mpunct":
      e = (A = Ko[r]) != null ? A : r;
      break;
    case "mop":
    case "operator":
    case "extensible-symbol":
      t38.value !== "​" && (Ko[r] ? e = Ko[r] : e = r === "\\operatorname" ? ae(t38.body) : (E = t38.value) != null ? E : r, e += " ");
      break;
    case "array":
      let j = t38.environmentName;
      if (t38.isMultiline) e = t38.rows.map((W) => W.map((ie) => ae(ie)).join("")).join(`
`);
      else {
        let D = t38.rows, W = D.map((X) => X.map(ae).join(", ")), ie = { pmatrix: '"("', bmatrix: '"["', "bmatrix*": '"["', Bmatrix: '"{"', vmatrix: '"|"', matrix: "#none" }[j];
        ie ? e = `mat(delim: ${ie}, ${W.join(" ; ")})` : j === "cases" || j === "rcases" ? e = `cases(reverse: #${j === "rcases"}, ${W.join(", ")})` : j === "aligned" ? e = D.map((X) => X.map(ae).join(" & ")).join(" \\ ") : e = D.map((X) => X.map(ae).join("")).join("");
      }
      break;
    case "box":
      break;
    case "spacing":
      e = (_ = (C = Ve[n]) != null ? C : Ve[r]) != null ? _ : " ";
      break;
    case "space":
      e = " ";
      break;
    case "subsup":
      e = (O = t38.leftSibling) != null && O.value ? "" : '""';
      break;
    case "macro":
      e = (K = (V = (I = Ve[n]) != null ? I : Ve[r]) != null ? V : Ko[r]) != null ? K : ae(t38.body);
      break;
  }
  if (!e) {
    let N = wy[t38.command.slice(1)];
    N && (e = `${N}(${ae(t38.body)})`);
  }
  if (!e) {
    let N = Sy[t38.command.slice(1)];
    N && (e = N(t38));
  }
  if (!t38.hasEmptyBranch("subscript")) {
    e += "_";
    let N = ae(t38.subscript);
    e += N.length !== 1 ? `(${N})` : N;
  }
  if (!t38.hasEmptyBranch("superscript")) {
    e += "^";
    let N = ae(t38.superscript);
    e += N.length !== 1 ? `(${N})` : N;
  }
  return e;
}
function Ly(t38, e) {
  if (!e) return t38;
  let r = t38;
  return e.variant === "double-struck" && (r = `bb(${r})`), e.variant === "script" && (r = `cal(${r})`), e.variant === "fraktur" && (r = `frak(${r})`), e.variant === "sans-serif" && (r = `sans(${r})`), e.variant === "monospace" && (r = `mono(${r})`), e.variantStyle === "bold" && (r = `bold(${r})`), r;
}
var qs = class {
  constructor(e, r, i) {
    this.mathfield = e, this.mode = r, this.silenceNotifications = false, this._selection = { ranges: [[0, 0]], direction: "none" }, this._anchor = 0, this._position = 0, this.root = i;
  }
  dispose() {
    this.mathfield = void 0;
  }
  getState() {
    let e = { ranges: [...this._selection.ranges] };
    return this.selection.direction && this.selection.direction !== "none" && (e.direction = this.selection.direction), { content: this.root.toJson(), selection: e, mode: this.mode };
  }
  setState(e, r) {
    var o;
    let i = this.silenceNotifications;
    this.silenceNotifications = (o = r == null ? void 0 : r.silenceNotifications) != null ? o : true;
    let n = {};
    if ((r == null ? void 0 : r.type) === "undo" && (n = { inputType: "historyUndo" }), (r == null ? void 0 : r.type) === "redo" && (n = { inputType: "historyRedo" }), this.contentWillChange(n)) {
      let a = this.silenceNotifications;
      this.silenceNotifications = true, this.mode = e.mode, this.root = yt(e.content), this.selection = e.selection, this.silenceNotifications = a, this.contentDidChange(n), this.selectionDidChange();
    }
    this.silenceNotifications = i;
  }
  get atoms() {
    return this.root.children;
  }
  get selection() {
    return this._selection;
  }
  set selection(e) {
    this.setSelection(e);
  }
  setSelection(e, r) {
    return !this.mathfield.contentEditable && this.mathfield.userSelect === "none" ? false : this.deferNotifications({ selection: true, content: true }, () => {
      var c, u, d, m;
      let i = this.normalizeSelection(e, r);
      if (i === void 0) throw new TypeError("Invalid selection");
      if (i.ranges.length === 1 && i.ranges[0][0] === i.ranges[0][1]) {
        let p = i.ranges[0][0];
        if (!this.mathfield.dirty && !((c = this.at(p)) != null && c.parentPrompt) && this.mathfield.hasEditablePrompts) {
          if ((u = this.at(p - 1)) != null && u.parentPrompt) {
            this._anchor = this.normalizeOffset(p - 1), this._position = this._anchor, this._selection = this.normalizeSelection(this._anchor);
            return;
          }
          if ((d = this.at(p + 1)) != null && d.parentPrompt) {
            this._anchor = this.normalizeOffset(p + 1), this._position = this._anchor, this._selection = this.normalizeSelection(this._anchor);
            return;
          }
          this._anchor = 0, this._position = 0, this._selection = { ranges: [[0, 0]] };
          return;
        }
        this._anchor = p, this._position = p, this._selection = i;
        return;
      }
      let n = de(i);
      n = Ay(this, n), i.direction === "backward" ? [this._position, this._anchor] = n : [this._anchor, this._position] = n;
      let o = n[0] + 1;
      for (; o <= this.lastOffset && ((m = this.at(o)) == null ? void 0 : m.type) === "first" && o < n[1]; ) o += 1;
      let a = o <= this.lastOffset ? this.at(o) : this.at(n[1]), s = this.at(n[1]), l = x.commonAncestor(a, s);
      (l == null ? void 0 : l.type) === "array" && a.parent === l && s.parent === l ? this._selection = { ranges: [n], direction: i.direction } : this._selection = { ranges: [n], direction: i.direction }, this._position >= 0 && this._position <= this.lastOffset;
    });
  }
  setPositionHandlingPlaceholder(e) {
    var i;
    let r = this.at(e);
    (r == null ? void 0 : r.type) === "placeholder" ? this.setSelection(e - 1, e) : ((i = r == null ? void 0 : r.rightSibling) == null ? void 0 : i.type) === "placeholder" ? this.setSelection(e, e + 1) : this.position = e, r instanceof he && r.isSuggestion && (r.isSuggestion = false), this.mathfield.stopCoalescingUndo();
  }
  get position() {
    return this._position;
  }
  set position(e) {
    this.setSelection(e, e);
  }
  get anchor() {
    return this._anchor;
  }
  get selectionIsCollapsed() {
    return this._anchor === this._position;
  }
  get selectionIsPlaceholder() {
    return Math.abs(this._anchor - this._position) === 1 ? this.at(Math.max(this._anchor, this._position)).type === "placeholder" : false;
  }
  collapseSelection(e = "forward") {
    return this._anchor === this._position ? false : (e === "backward" ? this.position = Math.min(this._anchor, this._position) : this.position = Math.max(this._anchor, this._position), true);
  }
  get lastOffset() {
    return this.atoms.length - 1;
  }
  at(e) {
    return this.atoms[e];
  }
  offsetOf(e) {
    return this.atoms.indexOf(e);
  }
  getSiblingsRange(e) {
    let r = this.at(e), { parent: i } = r;
    if (!i) return [0, this.lastOffset];
    let n = r.parent.branch(r.parentBranch);
    return [this.offsetOf(n[0]), this.offsetOf(n[n.length - 1])];
  }
  getBranchRange(e, r) {
    let i = this.at(e).branch(r);
    return [this.offsetOf(i[0]), this.offsetOf(i[i.length - 1])];
  }
  getCellRange(e) {
    var n, o;
    this.getParentCell(e);
    let i = this.at(e);
    if (i) {
      for (; i && ((n = i.parent) == null ? void 0 : n.type) !== "array"; ) i = i.parent;
      if (((o = i == null ? void 0 : i.parent) == null ? void 0 : o.type) === "array") return [this.offsetOf(i.firstSibling), this.offsetOf(i.lastSibling)];
    }
  }
  getAtoms(e, r, i) {
    let n = i != null ? i : {};
    if (Qi(e)) {
      if (n = r != null ? r : {}, e.ranges.length > 1) return e.ranges.reduce((m, p) => [...m, ...this.getAtoms(p, n)], []);
      e = e.ranges[0];
    }
    let o, a;
    if (It(e)) {
      if (o = e, !It(r)) return [];
      a = r;
    } else [o, a] = e, Object.keys(n).length === 0 && (n = r != null ? r : {});
    if (!Number.isFinite(o)) return [];
    n.includeChildren === void 0 && (n.includeChildren = false), o < 0 && (o = this.lastOffset - o + 1), a < 0 && (a = this.lastOffset + a + 1);
    let s = Math.min(o, a), l = Math.max(o, a), c = s === 0 ? 0 : s + 1, u = l;
    if (!n.includeChildren && s === 0 && l === this.lastOffset) return [this.root];
    let d = [];
    for (let m = c; m <= u; m++) {
      let p = this.atoms[m];
      Np(this, p, c, u, n.includeFirstAtoms) && d.push(p);
    }
    return n.includeChildren || (d = d.filter((m) => {
      let p = false, { parent: f } = m;
      for (; f && !p; ) p = Np(this, f, c, u, n.includeFirstAtoms), f = f.parent;
      return !p;
    })), d;
  }
  findAtom(e, r = 0, i = "forward") {
    let n, o = this.lastOffset;
    if (i === "forward") {
      for (let a = r; a <= o; a++) if (n = this.atoms[a], e(n)) return n;
      for (let a = 0; a < r; a++) if (n = this.atoms[a], e(n)) return n;
      return;
    }
    for (let a = r; a >= 0; a--) if (n = this.atoms[a], e(n)) return n;
    for (let a = o; a > r; a--) if (n = this.atoms[a], e(n)) return n;
  }
  extractAtoms(e) {
    var i;
    let r = this.getAtoms(e);
    r.length === 1 && !r[0].parent && r[0].isRoot && (r[0] instanceof z ? r = r[0].rows.flatMap((n) => n.flatMap((o) => o)) : r = [...(i = r[0].body) != null ? i : r[0].children], r = r.filter((n) => n.type !== "first"));
    for (let n of r) n.parent.removeChild(n);
    return r;
  }
  deleteAtoms(e) {
    if (e != null || (e = [0, -1]), this.extractAtoms(e), e[0] === 0 && e[1] === -1 && this.root instanceof z) for (; this.root.rowCount > 1; ) this.root.removeRow(1);
    this.position = e[0];
  }
  atomToString(e, r) {
    let i = r != null ? r : "latex";
    if (i.startsWith("latex")) return x.serialize([e], { expandMacro: i === "latex-expanded", skipStyles: i === "latex-unstyled", skipPlaceholders: i === "latex-without-placeholders", defaultMode: this.mathfield.options.defaultMode });
    if (i === "math-ml") return G(e);
    if (i === "spoken") return wt(e);
    if (i === "spoken-text") {
      let n = globalThis.MathfieldElement.textToSpeechMarkup;
      globalThis.MathfieldElement.textToSpeechMarkup = "";
      let o = wt(e);
      return globalThis.MathfieldElement.textToSpeechMarkup = n, o;
    }
    if (i === "spoken-ssml" || i === "spoken-ssml-with-highlighting") {
      let n = globalThis.MathfieldElement.textToSpeechMarkup;
      globalThis.MathfieldElement.textToSpeechMarkup = "ssml";
      let o = wt(e);
      return globalThis.MathfieldElement.textToSpeechMarkup = n, o;
    }
    return i === "typst" ? ae(e) : i === "plain-text" ? le(e, { plain: true }) : i === "ascii-math" ? le(e) : (console.error(`MathLive 0.111.1: Unexpected format "${i}`), "");
  }
  getValue(e, r, i) {
    if (e === void 0) return this.atomToString(this.root, "latex");
    if (typeof e == "string") return this.atomToString(this.root, e);
    let n, o;
    if (It(e) && It(r) ? (n = [this.normalizeRange([e, r])], o = i) : di(e) ? (n = [this.normalizeRange(e)], o = r) : Qi(e) ? (n = e.ranges, o = r) : (n = [this.normalizeRange([0, -1])], o = "latex"), o != null || (o = "latex"), o.startsWith("latex")) {
      let a = { expandMacro: o === "latex-expanded", skipStyles: o === "latex-unstyled", skipPlaceholders: o === "latex-without-placeholders", defaultMode: this.mathfield.options.defaultMode };
      return R(n.map((s) => x.serialize(this.getAtoms(s), a)));
    }
    return n.map((a) => this.getAtoms(a).map((s) => this.atomToString(s, o)).join("")).join("");
  }
  extendSelectionTo(e, r) {
    return !this.mathfield.contentEditable && this.mathfield.userSelect === "none" ? false : this.deferNotifications({ selection: true }, () => {
      let i = this.normalizeRange([e, r]), [n, o] = i, a = /* @__PURE__ */ new Set(["genfrac", "subsup", "accent", "box", "overlap", "overunder"]), { parent: s } = this.at(o);
      if (s != null && s.type && a.has(s.type)) for (; s != null && s.type && a.has(s.type) && Vs(this, s, [n, o]); ) o = this.offsetOf(s), s = s.parent;
      for (s = this.at(n).parent; s != null && s.type && a.has(s.type) && Vs(this, s, [n, o]); ) n = this.offsetOf(s.leftSibling), s = s.parent;
      if (s = this.at(o).parent, s != null && s.type && a.has(s.type)) for (; s != null && s.type && a.has(s.type) && Vs(this, s, [n, o]); ) o = this.offsetOf(s), s = s.parent;
      this._position = this.normalizeOffset(r), this._selection = { ranges: [[n, o]], direction: "none" };
    });
  }
  announce(e, r, i = []) {
    var o, a;
    ((a = (o = this.mathfield.host) == null ? void 0 : o.dispatchEvent(new CustomEvent("announce", { detail: { command: e, previousPosition: r, atoms: i }, cancelable: true, bubbles: true, composed: true }))) == null || a) && Zh(this.mathfield, e, r, i);
  }
  deferNotifications(e, r) {
    let i = this._selection, n = this._anchor, o = this._position, a = this.silenceNotifications;
    this.silenceNotifications = true;
    let s = this.root.changeCounter;
    r(), this.silenceNotifications = a;
    let l = n !== this._anchor || o !== this._position || q0(this._selection, i) === "different";
    e.selection && l && this.selectionDidChange();
    let c = this.root.changeCounter !== s;
    return e.content && c && this.contentDidChange({ inputType: e.type }), c || l;
  }
  normalizeOffset(e) {
    return e > 0 ? e = Math.min(e, this.lastOffset) : e < 0 && (e = this.lastOffset + e + 1), e;
  }
  normalizeRange(e) {
    let [r, i] = e;
    return r = this.normalizeOffset(r), i = this.normalizeOffset(i), r < i ? [r, i] : [i, r];
  }
  normalizeSelection(e, r) {
    var n;
    let i;
    if (It(e)) {
      let o = this.normalizeOffset(e);
      if (It(r)) {
        let a = this.normalizeOffset(r);
        i = o <= a ? { ranges: [[o, a]], direction: "none" } : { ranges: [[a, o]], direction: "backward" };
      } else i = { ranges: [[o, o]], direction: "none" };
    } else if (di(e)) {
      let o = this.normalizeOffset(e[0]), a = this.normalizeOffset(e[1]);
      i = o <= a ? { ranges: [[o, a]], direction: "none" } : { ranges: [[a, o]], direction: "backward" };
    } else Qi(e) && (i = { ranges: e.ranges.map((o) => this.normalizeRange(o)), direction: (n = e.direction) != null ? n : "none" });
    return i;
  }
  get parentEnvironment() {
    let e = this.at(this.position).parent;
    if (e) {
      for (; e.parent && e.type !== "array"; ) e = e.parent;
      if (e.type === "array") return e;
    }
  }
  get parentCell() {
    return this.getParentCell(this.position);
  }
  getParentCell(e) {
    var i, n;
    let r = this.at(e);
    if (r) {
      for (; r && ((i = r.parent) == null ? void 0 : i.type) !== "array"; ) r = r.parent;
      if (((n = r == null ? void 0 : r.parent) == null ? void 0 : n.type) === "array") return r.parentBranch;
    }
  }
  contentWillChange(e = {}) {
    if (this.silenceNotifications || !this.mathfield) return true;
    let r = this.silenceNotifications;
    this.silenceNotifications = true;
    let i = this.mathfield.onContentWillChange(e);
    return this.silenceNotifications = r, i;
  }
  contentDidChange(e) {
    var i;
    if (window.mathVirtualKeyboard.visible && window.mathVirtualKeyboard.update(Jt(this.mathfield)), this.silenceNotifications || !((i = this.mathfield) != null && i.host)) return;
    let r = this.silenceNotifications;
    this.silenceNotifications = true, setTimeout(() => {
      var n;
      !this.mathfield || !Ye(this.mathfield) || !this.mathfield.host || this.mathfield.host.dispatchEvent(new InputEvent("input", g(h({}, e), { data: e.data ? e.data : (n = e.inputType) != null ? n : "", bubbles: true, composed: true })));
    }, 0), this.silenceNotifications = r;
  }
  selectionDidChange() {
    if (!this.mathfield) return;
    let e = this.silenceNotifications;
    e || (this.silenceNotifications = true, this.mathfield.onSelectionDidChange()), this.silenceNotifications = e;
  }
};
function Np(t38, e, r, i, n) {
  let o = t38.offsetOf(e);
  if (o < r || o > i) return false;
  if (!e.hasChildren) return true;
  let a = n ? e.firstChild : Fp(e);
  if (!a) return true;
  let s = n ? e.lastChild : $p(e);
  if (!s) return true;
  let l = t38.offsetOf(a);
  if (l >= r && l <= i) {
    let c = t38.offsetOf(s);
    if (c >= r && c <= i) return true;
  }
  return false;
}
function Vs(t38, e, r) {
  if (!(e != null && e.hasChildren)) return false;
  let [i, n] = r, o = Fp(e);
  if (!o) return false;
  let a = $p(e);
  if (!a) return false;
  let s = t38.offsetOf(o), l = t38.offsetOf(a);
  return s >= i && s <= n && l >= s && l <= n;
}
function Ay(t38, e) {
  let [r, i] = e, n = i + 1;
  if (n > t38.lastOffset) return e;
  let o = t38.at(n);
  return Cy(t38, o, r, i) && (i = t38.offsetOf(o)), [r, i];
}
function Cy(t38, e, r, i) {
  if ((e == null ? void 0 : e.type) !== "subsup" || !Vs(t38, e, [r, i])) return false;
  let n = e.leftSibling;
  if (!n) return false;
  let o = t38.offsetOf(n);
  return o > r && o <= i;
}
function Fp(t38) {
  for (let e of t38.children) if (e.type !== "first") return e;
}
function $p(t38) {
  let { children: e } = t38;
  for (let r = e.length - 1; r >= 0; r--) if (e[r].type !== "first") return e[r];
}
pe({ deleteAll: (t38) => t38.contentWillChange({ inputType: "deleteContent" }) && lt(t38, [0, -1], "deleteContent"), deleteForward: (t38) => rp(t38), deleteBackward: (t38) => tp(t38), deleteNextWord: (t38) => t38.contentWillChange({ inputType: "deleteWordForward" }) && St(t38, "forward", { delete: true }), deletePreviousWord: (t38) => t38.contentWillChange({ inputType: "deleteWordBackward" }) && St(t38, "backward", { delete: true }), deleteToGroupStart: (t38) => {
  if (!t38.contentWillChange({ inputType: "deleteSoftLineBackward" })) return false;
  let e = t38.offsetOf(t38.at(t38.position).firstSibling);
  return e === t38.position ? (t38.announce("plonk"), false) : (t38.deferNotifications({ content: true, selection: true, type: "deleteSoftLineBackward" }, () => t38.deleteAtoms([t38.anchor, e])), t38.position = e, true);
}, deleteToGroupEnd: (t38) => {
  if (!t38.contentWillChange({ inputType: "deleteSoftLineForward" })) return false;
  let e = t38.offsetOf(t38.at(t38.position).lastSibling);
  return e === t38.position ? (t38.announce("plonk"), false) : (t38.deferNotifications({ content: true, selection: true, type: "deleteSoftLineForward" }, () => t38.deleteAtoms([t38.anchor, e])), true);
}, deleteToMathFieldStart: (t38) => t38.contentWillChange({ inputType: "deleteHardLineBackward" }) && lt(t38, [t38.anchor, 0], "deleteHardLineBackward"), deleteToMathFieldEnd: (t38) => t38.contentWillChange({ inputType: "deleteHardLineForward" }) && lt(t38, [t38.anchor, -1], "deleteHardLineForward") }, { target: "model", audioFeedback: "delete", canUndo: true, changeContent: true, changeSelection: true });
var Ey = `<svg xmlns="http://www.w3.org/2000/svg" style="width: 21px;"  viewBox="0 0 576 512" role="img" aria-label="${$("tooltip.toggle virtual keyboard")}"><path d="M528 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h480c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm16 336c0 8.823-7.177 16-16 16H48c-8.823 0-16-7.177-16-16V112c0-8.823 7.177-16 16-16h480c8.823 0 16 7.177 16 16v288zM168 268v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-336 80v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm384 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zM120 188v-24c0-6.627-5.373-12-12-12H84c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm96 0v-24c0-6.627-5.373-12-12-12h-24c-6.627 0-12 5.373-12 12v24c0 6.627 5.373 12 12 12h24c6.627 0 12-5.373 12-12zm-96 152v-8c0-6.627-5.373-12-12-12H180c-6.627 0-12 5.373-12 12v8c0 6.627 5.373 12 12 12h216c6.627 0 12-5.373 12-12z"/></svg>`, Ty = `<svg xmlns="http://www.w3.org/2000/svg" style="height: 18px;" viewBox="0 0 448 512" role="img" aria-label="${$("tooltip.menu")}"><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>`, Hs = class t37 {
  constructor(e, r) {
    this.focusBlurInProgress = false;
    this.programmaticFocusInProgress = false;
    this.connectedToVirtualKeyboard = false;
    var m, p, f;
    this.options = h(g(h({}, Sn()), { macros: Ri(), registers: Ha() }), wn(r)), this.eventController = new AbortController();
    let i = this.eventController.signal;
    r.eventSink && (this.host = r.eventSink), this.element = e, e.mathfield = this, this.blurred = true, this.keystrokeCaptionVisible = false, this.suggestionIndex = 0, this.inlineShortcutBuffer = [], this.inlineShortcutBufferFlushTimer = 0, this.scientificNotationTimer = 0, this.defaultStyle = {}, this.styleBias = "left", this.options.defaultMode === "inline-math" ? this.element.classList.add("ML__is-inline") : this.element.classList.remove("ML__is-inline"), this.dirty = false;
    let n = (p = (m = r.value) != null ? m : this.element.textContent) != null ? p : "";
    n = n.trim();
    let o = Ac(this.options), a = be(n, { context: this.context }), s;
    a.length === 1 && a[0].isRoot ? s = a[0] : s = new x({ type: "root", mode: o, body: a }), this.model = new qs(this, o, s), this.undoManager = new ws(this.model);
    let l = [];
    if (l.push("<span contenteditable=true role=textbox aria-autocomplete=none aria-multiline=false part=keyboard-sink class=ML__keyboard-sink autocapitalize=off autocomplete=off autocorrect=off spellcheck=false inputmode=none tabindex=0></span>"), l.push('<span part=container class=ML__container  style="visibility:hidden">'), l.push("<span part=content class=ML__content>"), l.push(_c(this)), l.push("</span>"), l.push("<div class=ML__toggles>"), window.mathVirtualKeyboard && (l.push(`<div part=virtual-keyboard-toggle class=ML__virtual-keyboard-toggle role=button ${this.hasEditableContent ? "" : 'style="display:none;"'} data-l10n-tooltip="tooltip.toggle virtual keyboard">`), l.push(Ey), l.push("</div>")), l.push('<div part=menu-toggle class=ML__menu-toggle role=button data-l10n-tooltip="tooltip.menu">'), l.push(Ty), l.push("</div>"), l.push("</div>"), l.push("</span>"), l.push("<span class=ML__sr-only>"), l.push("<span role=status aria-live=assertive aria-atomic=true></span>"), l.push("</span>"), this.element.innerHTML = globalThis.MathfieldElement.createHTML(l.join("")), !this.element.children) {
      console.error("%cMathLive 0.111.1: Something went wrong and the mathfield could not be created.%c\nIf you are using Vue, this may be because you are using the runtime-only build of Vue. Make sure to include `runtimeCompiler: true` in your Vue configuration. There may a warning from Vue in the log above.", "color:red;font-family:system-ui;font-size:1.2rem;font-weight:bold", "color:inherit;font-family:system-ui;font-size:inherit;font-weight:inherit");
      return;
    }
    this._l10Subscription = F.subscribe(() => F.update(this.element)), F.update(this.element), this.container = this.element.querySelector("[part=container]"), this.field = this.container.querySelector("[part=content]"), this.field.addEventListener("click", (y) => y.stopImmediatePropagation(), { capture: false, signal: i }), this.field.addEventListener("wheel", this, { passive: false, signal: i });
    let c = this.element;
    if ("PointerEvent" in window ? c.addEventListener("pointerdown", this, { signal: i }) : c.addEventListener("mousedown", this, { signal: i }), this.host) {
      let y = (v) => {
        v.target === this.host && this.handleEvent(v);
      };
      "PointerEvent" in window ? this.host.addEventListener("pointerdown", y, { signal: i }) : this.host.addEventListener("mousedown", y, { signal: i });
    }
    let u = this.element.querySelector("[part=virtual-keyboard-toggle]");
    u == null || u.addEventListener("pointerdown", (y) => {
      y.currentTarget === u && (window.mathVirtualKeyboard.visible ? window.mathVirtualKeyboard.hide() : (window.mathVirtualKeyboard.show({ animate: true }), window.mathVirtualKeyboard.update(Jt(this)), setTimeout(() => this.scrollIntoView(), 300)), y.preventDefault(), y.stopPropagation(), this.hasFocus() || this.focus({ preventScroll: true }));
    }, { signal: i }), this.field.addEventListener("contextmenu", this, { signal: i });
    let d = this.element.querySelector("[part=menu-toggle]");
    d == null || d.addEventListener("pointerdown", (y) => {
      if (y.currentTarget !== d) return;
      let v = this.menu;
      if (v.state !== "closed") return;
      this.element.classList.add("tracking");
      let b = d.getBoundingClientRect();
      v.modifiers = Ht(y), v.show({ target: d, location: { x: b.left, y: b.bottom }, onDismiss: () => this.element.classList.remove("tracking") }), y.preventDefault(), y.stopPropagation();
    }, { signal: i }), (this.disabled || this.readOnly && !this.hasEditableContent || this.userSelect === "none") && (d.style.display = "none"), this.ariaLiveText = (f = this.element.querySelector("[role=status]")) != null ? f : void 0, this.keyboardDelegate = Ah(this.element.querySelector(".ML__keyboard-sink"), this.element, this), this.updateAccessibleName(), this.updateAccessibleReadOnly(), window.addEventListener("resize", this, { signal: i }), document.addEventListener("scroll", this, { signal: i }), this.resizeObserver = new ResizeObserver((y) => {
      if (this.resizeObserverStarted) {
        this.resizeObserverStarted = false;
        return;
      }
      this.updateToggleLayout(), Y(this);
    }), this.resizeObserverStarted = true, this.resizeObserver.observe(this.field), this.resizeObserver.observe(this.container), setTimeout(() => this.updateToggleLayout(), 100), window.mathVirtualKeyboard.addEventListener("virtual-keyboard-toggle", this, { signal: i }), Ne !== "ready" && document.fonts.ready.then(() => uo(this)), e.querySelector("[part=container]").style.removeProperty("visibility"), this.undoManager.startRecording(), this.undoManager.snapshot("set-value"), Y(this);
  }
  connectToVirtualKeyboard() {
    this.connectedToVirtualKeyboard || (this.connectedToVirtualKeyboard = true, window.addEventListener("message", this, { signal: this.eventController.signal }), window.mathVirtualKeyboard.connect(), window.mathVirtualKeyboard.visible && window.mathVirtualKeyboard.update(Jt(this)), Co(this));
  }
  disconnectFromVirtualKeyboard() {
    this.connectedToVirtualKeyboard && (window.removeEventListener("message", this), window.mathVirtualKeyboard.disconnect(), this.connectedToVirtualKeyboard = false, Ks());
  }
  showMenu(e) {
    var o, a;
    let r = (a = (o = e == null ? void 0 : e.location) != null ? o : tn(this.field)) != null ? a : void 0, i = e == null ? void 0 : e.modifiers, n = this.element.querySelector("[part=container]");
    return this._menu.show({ target: n, location: r, modifiers: i });
  }
  get colorMap() {
    return (e) => {
      var r, i, n;
      return (n = (i = (r = this.options).colorMap) == null ? void 0 : i.call(r, e)) != null ? n : Yr(e);
    };
  }
  get backgroundColorMap() {
    return (e) => {
      var r, i, n, o, a, s;
      return (s = (a = (i = (r = this.options).backgroundColorMap) == null ? void 0 : i.call(r, e)) != null ? a : (o = (n = this.options).colorMap) == null ? void 0 : o.call(n, e)) != null ? s : Bi(e);
    };
  }
  get smartFence() {
    var e;
    return (e = this.options.smartFence) != null ? e : false;
  }
  get readOnly() {
    var e;
    return (e = this.options.readOnly) != null ? e : false;
  }
  updateAccessibleName() {
    var e;
    (e = this.keyboardDelegate) == null || e.setAriaLabel(Bc(this.host));
  }
  updateAccessibleReadOnly() {
    var e;
    (e = this.keyboardDelegate) == null || e.setAriaReadOnly(this.readOnly && !this.hasEditablePrompts);
  }
  get disabled() {
    var e, r;
    return (r = (e = this.host) == null ? void 0 : e.disabled) != null ? r : false;
  }
  get contentEditable() {
    return this.host ? this.host.getAttribute("contenteditable") !== "false" : false;
  }
  get userSelect() {
    if (!this.host) return "";
    let e = getComputedStyle(this.host);
    return e.getPropertyValue("user-select") || e.getPropertyValue("-webkit-user-select");
  }
  get hasEditableContent() {
    return this.disabled || !this.contentEditable ? false : !this.readOnly || this.hasEditablePrompts;
  }
  get hasEditablePrompts() {
    return this.readOnly && !this.disabled && this.contentEditable && this.model.findAtom((e) => e.type === "prompt" && !e.locked) !== void 0;
  }
  get isSelectionEditable() {
    if (this.disabled || !this.contentEditable) return false;
    if (!this.readOnly) return true;
    let e = this.model.at(this.model.anchor), r = this.model.at(this.model.position), i = x.commonAncestor(e, r);
    return !!((i == null ? void 0 : i.type) === "prompt" || i != null && i.parentPrompt);
  }
  get letterShapeStyle() {
    var e;
    return (e = this.options.letterShapeStyle) != null ? e : "tex";
  }
  get minFontScale() {
    return this.options.minFontScale;
  }
  get maxMatrixCols() {
    return this.options.maxMatrixCols;
  }
  queryStyle(e) {
    let r = cs(this, e);
    "verbatimColor" in r && delete r.verbatimColor, "verbatimBackgroundColor" in r && delete r.verbatimBackgroundColor;
    let i = Object.keys(r).length;
    if (i === 0) return "all";
    if (i > 1) {
      for (let c of Object.keys(r)) {
        let u = this.queryStyle({ [c]: r[c] });
        if (u === "none") return "none";
        if (u === "some") return "some";
      }
      return "all";
    }
    let n = Object.keys(r)[0], o = r[n];
    if (this.model.selectionIsCollapsed) return Ut(this)[n] === o ? "all" : "none";
    let a = this.model.getAtoms(this.model.selection, { includeChildren: true }), s = a.length;
    if (s === 0) return "none";
    let l = 0;
    for (let c of a) {
      if (c.type === "first") {
        s -= 1;
        continue;
      }
      c.style[n] === o && (l += 1);
    }
    return l === 0 ? "none" : l === s ? "all" : "some";
  }
  get keybindings() {
    var i, n;
    if (this._keybindings) return this._keybindings;
    let [e, r] = Dh(this.options.keybindings, (i = yr()) != null ? i : Cu());
    return ((n = yr()) == null ? void 0 : n.score) > 0 && (this._keybindings = e, r.length > 0 && console.error("MathLive 0.111.1: Invalid keybindings for current keyboard layout", r)), e;
  }
  get menu() {
    return this._menu != null || (this._menu = new To(Rp(this), { host: this.host })), this._menu;
  }
  set menuItems(e) {
    this._menu ? this._menu.menuItems = e : this._menu = new To(e, { host: this.host });
  }
  setOptions(e) {
    var n;
    this.options = h(h({}, this.options), wn(e)), this._keybindings = void 0, this.options.defaultMode === "inline-math" ? this.element.classList.add("ML__is-inline") : this.element.classList.remove("ML__is-inline");
    let r = this.options.defaultMode;
    r === "inline-math" && (r = "math"), ((n = this.model.root.firstChild) == null ? void 0 : n.mode) !== r && (this.model.root.firstChild.mode = r), this.options.readOnly && this.hasFocus() && window.mathVirtualKeyboard.visible && this.executeCommand("hideVirtualKeyboard"), "readOnly" in e && this.updateAccessibleReadOnly();
    let i = x.serialize([this.model.root], { expandMacro: false, defaultMode: this.options.defaultMode });
    ("macros" in e || this.model.getValue() !== i) && Mc(this), ("value" in e || "registers" in e || "colorMap" in e || "backgroundColorMap" in e || "letterShapeStyle" in e || "minFontScale" in e || "maxMatrixCols" in e || "readOnly" in e || "contentPlaceholder" in e || "placeholderSymbol" in e) && Y(this);
  }
  getOptions(e) {
    return fr(this.options, e);
  }
  getOption(e) {
    return fr(this.options, e);
  }
  async handleEvent(e) {
    var r, i, n;
    if (Ye(this)) {
      if (fo(e)) {
        if (!rn(e.origin, (r = this.options.originValidator) != null ? r : "none")) throw new DOMException(`Message from unknown origin (${e.origin}) cannot be handled`, "SecurityError");
        let { action: o } = e.data;
        if (o === "execute-command") {
          let a = _i(e.data.command);
          if (!a || pr(a) === "virtual-keyboard") return;
          this.executeCommand(a);
        } else o === "update-state" || (o === "focus" ? this.focus({ preventScroll: true }) : o === "blur" && this.blur());
        return;
      }
      switch (e.type) {
        case "focus":
          this.programmaticFocusInProgress || this.onFocus({ suppressEvents: true });
          break;
        case "blur":
          this.onBlur({ dispatchEvents: false });
          break;
        case "mousedown":
          this.userSelect !== "none" && !((i = e.target) != null && i.closest("[part=virtual-keyboard-toggle],[part=menu-toggle]")) && qc(this, e);
          break;
        case "pointerdown":
          !e.defaultPrevented && this.userSelect !== "none" && !((n = e.target) != null && n.closest("[part=virtual-keyboard-toggle],[part=menu-toggle]")) && (qc(this, e), e.shiftKey === false && await Xc(e, this.container, this.menu) && Li.stop());
          break;
        case "contextmenu":
          this.userSelect !== "none" && e.shiftKey === false && await Xc(e, this.container, this.menu) && Li.stop();
          break;
        case "virtual-keyboard-toggle":
          this.hasFocus() && Co(this), this.hasFocus() && this.options.mathVirtualKeyboardPolicy !== "manual" && (this.focusBlurInProgress = true, this.keyboardDelegate.blur(), this.keyboardDelegate.focus(), this.focusBlurInProgress = false);
          break;
        case "resize":
          this.geometryChangeTimer && cancelAnimationFrame(this.geometryChangeTimer), this.geometryChangeTimer = requestAnimationFrame(() => Ye(this) && this.onGeometryChange());
          break;
        case "scroll":
          this.geometryChangeTimer && cancelAnimationFrame(this.geometryChangeTimer), this.geometryChangeTimer = requestAnimationFrame(() => Ye(this) && this.onGeometryChange());
          break;
        case "wheel":
          this.onWheel(e);
          break;
        case "message":
          break;
        default:
          console.warn("Unexpected event type", e.type);
      }
    }
  }
  updateToggleLayout() {
    if (!this.element || !this.host) return;
    let e = this.element.querySelector(".ML__toggles");
    if (!e) return;
    let r = this.host.offsetHeight, i = e.classList.contains("ML__toggles--vertical");
    r >= 100 && !i ? e.classList.add("ML__toggles--vertical") : r < 100 && i && e.classList.remove("ML__toggles--vertical");
  }
  dispose() {
    if (!Ye(this)) return;
    t37._globallyFocusedMathfield === this && (t37._globallyFocusedMathfield = void 0), F.unsubscribe(this._l10Subscription), this.keyboardDelegate.dispose(), this.keyboardDelegate = void 0, this.eventController.abort(), this.eventController = void 0, this.resizeObserver.disconnect(), window.mathVirtualKeyboard.removeEventListener("virtual-keyboard-toggle", this), this.disconnectFromVirtualKeyboard(), this.model.dispose();
    let e = this.element;
    delete e.mathfield, this.element = void 0, this.host = void 0, this.field = void 0, this.ariaLiveText = void 0, dp(), Ph(), _p();
  }
  flushInlineShortcutBuffer(e) {
    if (e != null || (e = { defer: false }), !e.defer) {
      this.inlineShortcutBuffer.length = 0, clearTimeout(this.inlineShortcutBufferFlushTimer), this.inlineShortcutBufferFlushTimer = 0;
      return;
    }
    this.options.inlineShortcutTimeout > 0 && (clearTimeout(this.inlineShortcutBufferFlushTimer), this.inlineShortcutBufferFlushTimer = setTimeout(() => this.flushInlineShortcutBuffer(), this.options.inlineShortcutTimeout));
  }
  executeCommand(e) {
    return pr(e) === "virtual-keyboard" ? (this.focus({ preventScroll: true }), window.mathVirtualKeyboard.executeCommand(e), requestAnimationFrame(() => window.mathVirtualKeyboard.update(Jt(this))), false) : Fh(this, e);
  }
  get errors() {
    return ts(this.model.getValue(), { context: this.context });
  }
  getValue(e, r, i) {
    return this.model.getValue(e, r, i);
  }
  setValue(e, r) {
    var n;
    r = r != null ? r : { mode: "math" }, r.insertionMode === void 0 && (r.insertionMode = "replaceAll"), (r.format === void 0 || r.format === "auto") && (r.format = "latex"), (r.mode === void 0 || r.mode === "auto") && (r.mode = (n = H0(this.model, this.model.position)) != null ? n : "math");
    let i = this.undoManager.canUndo();
    H.insert(this.model, e, r) && (Y(this), i || this.undoManager.reset(), this.undoManager.snapshot("set-value"));
  }
  scrollIntoView() {
    var i;
    if (!this.element) return;
    if (this.host) {
      if (this.options.onScrollIntoView) this.options.onScrollIntoView(this);
      else if (this.host.scrollIntoView({ block: "nearest", inline: "nearest" }), window.mathVirtualKeyboard.visible && window.mathVirtualKeyboard.container === window.document.body) {
        let n = window.mathVirtualKeyboard.boundingRect, o = this.host.getBoundingClientRect();
        o.bottom > n.top && ((i = window.document.scrollingElement) == null || i.scrollBy(0, o.bottom - n.top + 8));
      }
    }
    this.dirty && vt(this, { interactive: true });
    let e = this.field.getBoundingClientRect(), r = null;
    if (this.model.selectionIsCollapsed) r = tn(this.field);
    else {
      let n = Ga(this);
      if (n.length > 0) {
        let o = -1 / 0, a = 1 / 0, s = -1 / 0;
        for (let c of n) c.right > o && (o = c.right), c.top < a && (a = c.top), c.bottom > s && (s = c.bottom);
        let l = s - a;
        r = { x: o + e.left - this.field.scrollLeft, y: a + e.top - this.field.scrollTop, height: l };
      }
    }
    if (this.host && r) {
      let n = this.host.getBoundingClientRect(), o = 20, a = r.y, s = r.y + r.height, l = this.host.scrollTop;
      a < n.top + o ? l = a - n.top + this.host.scrollTop - o : s > n.bottom - o && (l = s - n.bottom + this.host.scrollTop + o), l !== this.host.scrollTop && this.host.scroll({ top: l, behavior: "auto" });
    }
    if (r) {
      let n = r.x - window.scrollX, o = this.field.scrollLeft;
      n < e.left ? o = n - e.left + this.field.scrollLeft - 20 : n > e.right && (o = n - e.right + this.field.scrollLeft + 20), this.field.scroll({ top: this.field.scrollTop, left: o });
    }
  }
  insert(e, r) {
    if (typeof e != "string" || e.length === 0 && ((r == null ? void 0 : r.insertionMode) === "insertBefore" || (r == null ? void 0 : r.insertionMode) === "insertAfter") || e.length === 0 && this.model.selectionIsCollapsed) return false;
    if (this.flushInlineShortcutBuffer(), r = r != null ? r : { mode: "math" }, r.focus && this.focus(), r.feedback && (globalThis.MathfieldElement.keypressVibration && Di() && navigator.vibrate(mo), globalThis.MathfieldElement.playSound("keypress")), e === "\\\\") Kc(this.model);
    else if (e === "&") Pc(this.model);
    else if (this.model.selectionIsCollapsed) {
      let i = h({}, Ut(this));
      !/^[a-zA-Z0-9]$/.test(e) && this.styleBias !== "none" && (i.variant = "normal", i.variantStyle = void 0), H.insert(this.model, e, h({ style: i }, r));
    } else H.insert(this.model, e, r);
    return this.snapshot(`insert-${this.model.at(this.model.position).type}`), Y(this), r.scrollIntoView && this.scrollIntoView(), true;
  }
  switchMode(e, r = "", i = "") {
    if (this.model.mode === e || !this.hasEditableContent || !this.contentEditable || this.disabled) return;
    let { model: n } = this, o = n.mode;
    if (n.mode = e, this.host && !this.host.dispatchEvent(new Event("mode-change", { bubbles: true, composed: true, cancelable: true }))) {
      n.mode = o;
      return;
    }
    n.mode = o, n.deferNotifications({ content: !!i || !!r, selection: true, type: "insertText" }, () => {
      let a = n.at(n.position), s = (d, m) => {
        if (!d) return;
        let p = n.mode === "math" ? be(or(d, { format: "ascii-math" })[1], { context: this.context }) : [...d].map((f) => new We(f, f, {}));
        if (m.select) {
          let f = a.parent.addChildrenAfter(p, a);
          n.setSelection(n.offsetOf(p[0].leftSibling), n.offsetOf(f));
        } else n.position = n.offsetOf(a.parent.addChildrenAfter(p, a));
        u = true;
      }, l = (d, m) => {
        let p = new Ft(d);
        a.parent.addChildAfter(p, a), m.select ? n.setSelection(n.offsetOf(p.firstChild), n.offsetOf(p.lastChild)) : n.position = n.offsetOf(p.lastChild), u = true;
      }, c = () => {
        let d = e === "latex" ? "latex" : e === "math" ? "plain-text" : "ascii-math", m = de(n.selection), p = this.model.getValue(m, d), f = this.model.extractAtoms(m);
        return f.length === 1 && f[0].type === "placeholder" && (p = i), a = n.at(m[0]), p;
      }, u = false;
      if (this.flushInlineShortcutBuffer(), this.stopCoalescingUndo(), Qe(this, "accept"), n.selectionIsCollapsed) s(r, { select: false }), n.mode = e, e === "latex" ? l(i, { select: false }) : s(i, { select: false });
      else {
        let d = c();
        n.mode = e, e === "latex" ? l(d, { select: true }) : s(d, { select: true });
      }
      return Y(this), this.undoManager.snapshot(e === "latex" ? "insert-latex" : "insert"), u;
    }), n.mode = e, window.mathVirtualKeyboard.update(Jt(this));
  }
  hasFocus() {
    return !this.blurred;
  }
  focus(e) {
    var r;
    this.disabled || this.focusBlurInProgress || (this.hasFocus() || (this.programmaticFocusInProgress = true, this.onFocus(), this.model.announce("line")), (r = e == null ? void 0 : e.preventScroll) != null && r || this.scrollIntoView());
  }
  blur() {
    this.disconnectFromVirtualKeyboard(), this.hasFocus() && this.keyboardDelegate.blur();
  }
  select() {
    this.model.selection = { ranges: [[0, this.model.lastOffset]] }, this.focus();
  }
  applyStyle(e, r = {}) {
    var s;
    let i, n = "set", o = false;
    di(r) ? i = r : (r.operation === "toggle" && (n = "toggle"), i = r.range, o = (s = r.silenceNotifications) != null ? s : false), i && (i = this.model.normalizeRange(i)), i && i[0] === i[1] && (i = void 0);
    let a = cs(this, e);
    if (i === void 0 && this.model.selectionIsCollapsed) {
      if (n === "set") {
        let u = h({}, this.defaultStyle);
        "color" in a && delete u.verbatimColor, "backgroundColor" in a && delete u.verbatimBackgroundColor, this.defaultStyle = h(h({}, u), a), this.styleBias = "none";
        return;
      }
      let l = Ut(this), c = h({}, this.defaultStyle);
      for (let u of Object.keys(a)) l[u] === a[u] ? (u === "color" && delete c.verbatimColor, u === "backgroundColor" && delete c.verbatimBackgroundColor, delete c[u]) : c[u] = a[u];
      this.defaultStyle = c, this.styleBias = "none";
      return;
    }
    this.model.deferNotifications({ content: !o, type: "insertText" }, () => {
      if (i === void 0) for (let l of this.model.selection.ranges) ao(this.model, l, a, { operation: n });
      else ao(this.model, i, a, { operation: n });
    }), Y(this);
  }
  toggleContextMenu() {
    var n;
    let e = this.menu;
    if (!e.visible) return false;
    if (e.state === "open") return e.hide(), true;
    let r = (n = ja(this, this.model.position)) == null ? void 0 : n.bounds;
    if (!r) return false;
    let i = { x: r.right, y: r.bottom };
    return e.show({ target: this.element.querySelector("[part=container]"), location: i, onDismiss: () => {
      var o;
      return (o = this.element) == null ? void 0 : o.focus();
    } }), true;
  }
  getPrompt(e) {
    let r = this.model.findAtom((i) => i.type === "prompt" && i.placeholderId === e);
    return r;
  }
  getPromptValue(e, r) {
    let i = this.getPrompt(e);
    if (!i) return "";
    let n = this.model.offsetOf(i.firstChild), o = this.model.offsetOf(i.lastChild);
    return this.model.getValue(n, o, r);
  }
  getPrompts(e) {
    return this.model.atoms.filter((r) => r.type !== "prompt" ? false : e ? !(e.id && r.placeholderId !== e.id || e.locked && r.locked !== e.locked || e.correctness === "undefined" && r.correctness || e.correctness && r.correctness !== e.correctness) : true).map((r) => r.placeholderId);
  }
  setPromptValue(e, r, i) {
    if (r !== void 0) {
      let n = this.getPrompt(e);
      if (!n) {
        console.error(`MathLive 0.111.1: unknown prompt ${e}`);
        return;
      }
      let o = this.model.getBranchRange(this.model.offsetOf(n), "body");
      this.model.setSelection(o), this.insert(r, g(h({}, i), { insertionMode: "replaceSelection" }));
    }
    i != null && i.silenceNotifications && (this.valueOnFocus = this.getValue()), Y(this);
  }
  setPromptState(e, r, i) {
    let n = this.getPrompt(e);
    if (!n) {
      console.error(`MathLive 0.111.1: unknown prompt ${e}`);
      return;
    }
    r === "undefined" ? n.correctness = void 0 : typeof r == "string" && (n.correctness = r), typeof i == "boolean" && (n.locked = i, n.captureSelection = i), Y(this);
  }
  getPromptState(e) {
    let r = this.getPrompt(e);
    return r ? [r.correctness, r.locked] : (console.error(`MathLive 0.111.1: unknown prompt ${e}`), [void 0, true]);
  }
  getPromptRange(e) {
    let r = this.getPrompt(e);
    return r ? this.model.getBranchRange(this.model.offsetOf(r), "body") : (console.error(`MathLive 0.111.1: unknown prompt ${e}`), [0, 0]);
  }
  canUndo() {
    return this.undoManager.canUndo();
  }
  canRedo() {
    return this.undoManager.canRedo();
  }
  popUndoStack() {
    this.undoManager.pop(), window.mathVirtualKeyboard.visible && window.mathVirtualKeyboard.update(Jt(this));
  }
  snapshot(e) {
    var r;
    this.undoManager.snapshot(e) && (window.mathVirtualKeyboard.visible && window.mathVirtualKeyboard.update(Jt(this)), (r = this.host) == null || r.dispatchEvent(new CustomEvent("undo-state-change", { bubbles: true, composed: true, detail: { type: "snapshot" } })));
  }
  stopCoalescingUndo() {
    this.undoManager.stopCoalescing(this.model.selection);
  }
  stopRecording() {
    this.undoManager.stopRecording();
  }
  startRecording() {
    this.undoManager.startRecording();
  }
  undo() {
    var e;
    this.undoManager.undo() && ((e = this.host) == null || e.dispatchEvent(new CustomEvent("undo-state-change", { bubbles: true, composed: true, detail: { type: "undo" } })));
  }
  redo() {
    var e;
    this.undoManager.redo() && ((e = this.host) == null || e.dispatchEvent(new CustomEvent("undo-state-change", { bubbles: true, composed: true, detail: { type: "redo" } })));
  }
  resetUndo() {
    var e;
    (e = this.undoManager) == null || e.reset();
  }
  onSelectionDidChange() {
    var r, i;
    let e = this.model;
    if (e.mathfield.hasFocus() && this.keyboardDelegate.setValue(e.getValue(e.selection, "latex-expanded")), e.selectionIsCollapsed) {
      let n = lo(e), o = e.position, a = e.at(o), s = (r = a.mode) != null ? r : Ac(this.options);
      if (n && (o < e.offsetOf(n.firstChild) || o > e.offsetOf(n.lastChild))) {
        Qe(this, "accept", { mode: s });
        let l = e.offsetOf(a);
        l >= 0 && (e.position = l);
      } else {
        let l = e.at(o + 1);
        (l == null ? void 0 : l.type) === "first" && l.mode === "latex" ? e.position = o + 1 : n && (l == null ? void 0 : l.mode) !== "latex" ? e.position = o - 1 : this.switchMode(s);
      }
    }
    (i = this.host) == null || i.dispatchEvent(new Event("selection-change", { bubbles: true, composed: true })), window.mathVirtualKeyboard.visible && window.mathVirtualKeyboard.update(Jt(this)), Co(this);
  }
  onContentWillChange(e) {
    var r, i, n;
    return (n = (i = this.host) == null ? void 0 : i.dispatchEvent(new InputEvent("beforeinput", g(h({}, e), { data: e.data ? e.data : (r = e.inputType) != null ? r : "", cancelable: true, bubbles: true, composed: true })))) != null ? n : true;
  }
  onFocus(e) {
    if (this.disabled || this.focusBlurInProgress || !this.blurred) return;
    let r = t37._globallyFocusedMathfield;
    r && r !== this && Ye(r) && !r.disabled && r.hasFocus() && r.onBlur({ dispatchEvents: true }), this.focusBlurInProgress = true, this.blurred = false, this.updateAccessibleName(), this.updateAccessibleReadOnly(), t37._globallyFocusedMathfield = this, this.stopCoalescingUndo(), this.valueOnFocus = this.model.getValue(), this.hasEditablePrompts && !this.model.at(this.model.anchor).parentPrompt && this.executeCommand("moveToNextPlaceholder"), vt(this, { interactive: true });
    let i = Wt();
    setTimeout(() => {
      var s, l, c, u, d;
      if (!Ye(this)) return;
      let n = Wt(), o = ((s = this.element) == null ? void 0 : s.contains(n)) || ((c = (l = this.element) == null ? void 0 : l.shadowRoot) == null ? void 0 : c.contains(n));
      if (t37._globallyFocusedMathfield !== this || n !== i && !o) {
        this.focusBlurInProgress = false, this.programmaticFocusInProgress = false, this.onBlur({ dispatchEvents: false });
        return;
      }
      if ((u = e == null ? void 0 : e.suppressEvents) != null ? u : false) {
        let m = new AbortController(), p = m.signal, f = (y) => {
          y.preventDefault(), y.stopPropagation();
        };
        for (let y of ["focus", "focusin"]) (d = this.host) == null || d.addEventListener(y, f, { capture: true, signal: p });
        this.focusBlurInProgress = false, this.keyboardDelegate.focus(), this.connectToVirtualKeyboard(), setTimeout(() => m.abort(), 0);
      } else this.focusBlurInProgress = false, this.keyboardDelegate.focus(), this.connectToVirtualKeyboard(), setTimeout(() => {
        this.programmaticFocusInProgress = false;
      }, 0);
    }, 60);
  }
  onBlur(e) {
    var i, n, o, a;
    if (this.focusBlurInProgress || this.blurred) return;
    if (this.focusBlurInProgress = true, this.stopCoalescingUndo(), this.blurred = true, t37._globallyFocusedMathfield === this && (t37._globallyFocusedMathfield = void 0), this.ariaLiveText && (this.ariaLiveText.textContent = ""), $r(this), this.model.getValue() !== this.valueOnFocus && ((i = this.host) == null || i.dispatchEvent(new Event("change", { bubbles: true, composed: true }))), this.disconnectFromVirtualKeyboard(), ((n = e == null ? void 0 : e.dispatchEvents) == null || n) && ((o = this.host) == null || o.dispatchEvent(new Event("blur", { bubbles: false, composed: true })), (a = this.host) == null || a.dispatchEvent(new UIEvent("focusout", { bubbles: true, composed: true }))), Y(this), this.focusBlurInProgress = false, Ks(), xn.restoreFocusWhenDocumentFocused) {
      let s = new AbortController(), l = s.signal;
      window.addEventListener("blur", () => {
        window.addEventListener("focus", () => {
          Ye(this) && this.focus({ preventScroll: true });
        }, { once: true, signal: l });
      }, { once: true, signal: l }), document.addEventListener("focusin", () => s.abort(), { once: true }), document.addEventListener("click", () => s.abort(), { once: true });
    }
  }
  onInput(e) {
    So(this, e);
  }
  onKeystroke(e) {
    return Fc(this, e);
  }
  onCompositionStart(e) {
    lt(this.model, de(this.model.selection), "insertText");
    let r = tn(this.field);
    r && requestAnimationFrame(() => {
      vt(this), this.keyboardDelegate.moveTo(r.x, r.y - r.height);
    });
  }
  onCompositionUpdate(e) {
    Yh(this.model, e), Y(this);
  }
  onCompositionEnd(e) {
    Qh(this.model), So(this, e, { simulateKeystroke: true });
  }
  onCut(e) {
    if (!this.isSelectionEditable) {
      this.model.announce("plonk");
      return;
    }
    this.model.contentWillChange({ inputType: "deleteByCut" }) && (this.stopCoalescingUndo(), e.clipboardData ? H.onCopy(this, e) : H.copyToClipboard(this, "latex"), lt(this.model, de(this.model.selection), "deleteByCut"), this.snapshot("cut"), Y(this));
  }
  onCopy(e) {
    e.clipboardData ? H.onCopy(this, e) : H.copyToClipboard(this, "latex");
  }
  onPaste(e) {
    let r = this.isSelectionEditable;
    return r && (r = H.onPaste(this.model.at(this.model.position).mode, this, e.clipboardData)), r || this.model.announce("plonk"), e.preventDefault(), e.stopPropagation(), r;
  }
  onGeometryChange() {
    var e;
    (e = this._menu) == null || e.hide(), yn(this), Co(this);
  }
  onWheel(e) {
    let r = 5 * e.deltaX;
    if (!Number.isFinite(r) || r === 0) return;
    let i = this.field;
    r < 0 && i.scrollLeft === 0 || r > 0 && i.offsetWidth + i.scrollLeft >= i.scrollWidth || (i.scrollBy({ top: 0, left: r }), e.preventDefault(), e.stopPropagation());
  }
  getHTMLElement(e) {
    let r = e;
    for (; !r.id && r.hasChildren; ) r = e.children[0];
    return this.field.querySelector(`[data-atom-id="${r.id}"]`);
  }
  get context() {
    var e, r;
    return { registers: (e = this.options.registers) != null ? e : {}, smartFence: this.smartFence, letterShapeStyle: this.letterShapeStyle, minFontScale: this.minFontScale, maxMatrixCols: this.maxMatrixCols, placeholderSymbol: (r = this.options.placeholderSymbol) != null ? r : "▢", colorMap: (i) => this.colorMap(i), backgroundColorMap: (i) => this.backgroundColorMap(i), getMacro: (i) => ti(i, this.options.macros), atomIdsSettings: { seed: "random", groupNumbers: false } };
  }
};
pe({ speak: (t38, e, r) => Dy(t38, e, r) }, { target: "mathfield" });
function Dy(t38, e, r) {
  var c;
  r = r != null ? r : { withHighlighting: false };
  let { model: i } = t38;
  function n(u) {
    let d = null;
    switch (u) {
      case "all":
        d = i.root;
        break;
      case "selection":
        d = i.getAtoms(i.selection);
        break;
      case "left": {
        d = i.getAtoms(i.offsetOf(i.at(i.position).leftSibling), i.position);
        break;
      }
      case "right": {
        d = i.getAtoms(i.position, i.offsetOf(i.at(i.position).rightSibling));
        break;
      }
      case "group":
        d = i.getAtoms(i.getSiblingsRange(i.position));
        break;
      case "parent": {
        let { parent: m } = i.at(i.position);
        m != null && m.parent ? d = m : d = i.root;
        break;
      }
      default:
        d = i.root;
    }
    return d;
  }
  function o(u) {
    let d = "";
    switch (u) {
      case "all":
        console.error("Internal failure: speak all failed");
        break;
      case "selection":
        d = "no selection";
        break;
      case "left":
        d = "at start";
        break;
      case "right":
        d = "at end";
        break;
      case "group":
        console.error("Internal failure: speak group failed");
        break;
      case "parent":
        d = "no parent";
        break;
      default:
        console.error('unknown speak_ param value: "' + u + '"');
        break;
    }
    return d;
  }
  let a = globalThis.MathfieldElement, s = n(e);
  if (s === null) return (c = a.speakHook) == null || c.call(a, o(e)), false;
  (r.withHighlighting || a.speechEngine === "amazon") && (a.textToSpeechMarkup = globalThis.sre && a.textToSpeechRules === "sre" ? "ssml_step" : "ssml");
  let l = wt(s);
  return Le() && r.withHighlighting ? (Zt().readAloudMathfield = t38, vt(t38, { forHighlighting: true }), a.readAloudHook && a.readAloudHook(t38.field, l)) : a.speakHook && a.speakHook(l), false;
}
function Vp(t38) {
  var r, i;
  if (!Le()) return;
  let e = globalThis.MathfieldElement;
  if (!e.speechEngine || e.speechEngine === "local") {
    let n = new SpeechSynthesisUtterance(t38);
    globalThis.speechSynthesis.speak(n);
  } else if (e.speechEngine === "amazon") if (!("AWS" in window)) console.error("MathLive 0.111.1: AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk");
  else {
    let n = new globalThis.AWS.Polly({ apiVersion: "2016-06-10" }), o = { OutputFormat: "mp3", VoiceId: (r = e.speechEngineVoice) != null ? r : "Joanna", Engine: ["Amy", "Emma", "Brian", "Ivy", "Joanna", "Kendra", "Kimberly", "Salli", "Joey", "Justin", "Matthew"].includes((i = e.speechEngineVoice) != null ? i : "Joanna") ? "neural" : "standard", Text: t38, TextType: "ssml" };
    n.synthesizeSpeech(o, (a, s) => {
      if (a) console.trace(`MathLive 0.111.1: \`polly.synthesizeSpeech()\` error: ${a}`);
      else if (s != null && s.AudioStream) {
        let l = new Uint8Array(s.AudioStream), c = new Blob([l.buffer], { type: "audio/mpeg" }), u = URL.createObjectURL(c);
        new Audio(u).play().catch((m) => console.error(m));
      }
    });
  }
  else e.speechEngine === "google" && console.error("MathLive 0.111.1: The Google speech engine is not supported yet. Please come again.");
}
function qp(t38) {
  if (t38 && (t38.classList.remove("ML__highlight"), t38.children)) for (let e of t38.children) qp(e);
}
function au(t38, e) {
  var r;
  t38 && (!e || ((r = t38.dataset) == null ? void 0 : r.atomId) === e ? (t38.classList.add("ML__highlight"), t38.children && t38.children.length > 0 && [...t38.children].forEach((i) => {
    i instanceof HTMLElement && au(i);
  })) : (t38.classList.remove("ML__highlight"), t38.children && t38.children.length > 0 && [...t38.children].forEach((i) => {
    i instanceof HTMLElement && au(i, e);
  })));
}
function Hp(t38, e) {
  var n;
  if (!Le()) return;
  if (globalThis.MathfieldElement.speechEngine !== "amazon") {
    console.error("MathLive 0.111.1: Use Amazon TTS Engine for synchronized highlighting"), typeof globalThis.MathfieldElement.speakHook == "function" && globalThis.MathfieldElement.speakHook(e);
    return;
  }
  if (!globalThis.AWS) {
    console.error("MathLive 0.111.1: AWS SDK not loaded. See https://www.npmjs.com/package/aws-sdk");
    return;
  }
  let r = new globalThis.AWS.Polly({ apiVersion: "2016-06-10" }), i = { OutputFormat: "json", VoiceId: (n = globalThis.MathfieldElement.speechEngineVoice) != null ? n : "Joanna", Engine: "standard", Text: e, TextType: "ssml", SpeechMarkTypes: ["ssml"] };
  Zt().readAloudElement = t38, r.synthesizeSpeech(i, (o, a) => {
    if (o) {
      console.trace(`MathLive 0.111.1: \`polly.synthesizeSpeech()\` error: ${o}`);
      return;
    }
    if (!(a != null && a.AudioStream)) return;
    let s = new TextDecoder("utf-8").decode(new Uint8Array(a.AudioStream));
    Zt().readAloudMarks = s.split(`
`).map((l) => l ? JSON.parse(l) : {}), Zt().readAloudTokens = [];
    for (let l of Zt().readAloudMarks) l.value && Zt().readAloudTokens.push(l.value);
    Zt().readAloudCurrentMark = "", i.OutputFormat = "mp3", i.SpeechMarkTypes = [], r.synthesizeSpeech(i, (l, c) => {
      if (l) {
        console.trace(`MathLive 0.111.1: \`polly.synthesizeSpeech("${e}") error:${l}`);
        return;
      }
      if (!(c != null && c.AudioStream)) return;
      let u = new Uint8Array(c.AudioStream), d = new Blob([u.buffer], { type: "audio/mpeg" }), m = URL.createObjectURL(d), p = Zt();
      p.readAloudAudio ? p.readAloudAudio.pause() : (p.readAloudAudio = new Audio(), p.readAloudAudio.addEventListener("ended", () => {
        let f = p.readAloudMathfield;
        p.readAloudStatus = "ended", document.body.dispatchEvent(new Event("read-aloud-status-change", { bubbles: true, composed: true })), f ? (vt(f), p.readAloudElement = null, p.readAloudMathfield = null, p.readAloudTokens = [], p.readAloudMarks = [], p.readAloudCurrentMark = "") : qp(p.readAloudElement);
      }), p.readAloudAudio.addEventListener("timeupdate", () => {
        let f = "", y = p.readAloudAudio.currentTime * 1e3 + 100;
        for (let v of p.readAloudMarks) v.time < y && (f = v.value);
        p.readAloudCurrentMark !== f && (p.readAloudCurrentToken = f, f && f === p.readAloudFinalToken ? p.readAloudAudio.pause() : (p.readAloudCurrentMark = f, au(p.readAloudElement, p.readAloudCurrentMark)));
      })), p.readAloudAudio.src = m, p.readAloudStatus = "playing", document.body.dispatchEvent(new Event("read-aloud-status-change", { bubbles: true, composed: true })), p.readAloudAudio.play();
    });
  });
}
Le() || console.error('MathLive 0.111.1: this version of the MathLive library is for use in the browser. A subset of the API is available on the server side in the "mathlive-ssr" library. If using server side rendering (with React for example) you may want to do a dynamic import of the MathLive library inside a `useEffect()` call.');
var Q = /* @__PURE__ */ new WeakMap(), Oy = 0.5, Jr = { letterShapeStyle: "mf.letterShapeStyle = ...", horizontalSpacingScale: 'Removed. Use `"thinmuskip"`, `"medmuskip"`, and `"thickmuskip"` registers ', macros: "mf.macros = ...", registers: "mf.registers = ...", backgroundColorMap: "mf.backgroundColorMap = ...", colorMap: "mf.colorMap = ...", enablePopover: "mf.popoverPolicy = ...", mathModeSpace: "mf.mathModeSpace = ...", placeholderSymbol: "mf.placeholderSymbol = ...", readOnly: "mf.readOnly = ...", removeExtraneousParentheses: "mf.removeExtraneousParentheses = ...", scriptDepth: "mf.scriptDepth = ...", smartFence: "mf.smartFence = ...", smartMode: "mf.smartMode = ...", smartSuperscript: "mf.smartSuperscript = ...", inlineShortcutTimeout: "mf.inlineShortcutTimeout = ...", inlineShortcuts: "mf.inlineShortcuts = ...", keybindings: "mf.keybindings = ...", virtualKeyboardMode: "mf.mathVirtualKeyboardPolicy = ...", customVirtualKeyboardLayers: "mathVirtualKeyboard.layers = ...", customVirtualKeyboards: "mathVirtualKeyboard.layouts = ...", keypressSound: "mathVirtualKeyboard.keypressSound = ...", keypressVibration: "mathVirtualKeyboard.keypressVibration = ...", plonkSound: "mathVirtualKeyboard.plonkSound = ...", virtualKeyboardContainer: "mathVirtualKeyboard.container = ...", virtualKeyboardLayout: "mathVirtualKeyboard.alphabeticLayout = ...", virtualKeyboardTheme: "No longer supported", virtualKeyboardToggleGlyph: "No longer supported", virtualKeyboardToolbar: "mathVirtualKeyboard.editToolbar = ...", virtualKeyboards: "Use `mathVirtualKeyboard.layouts`", speechEngine: "`MathfieldElement.speechEngine`", speechEngineRate: "`MathfieldElement.speechEngineRate`", speechEngineVoice: "`MathfieldElement.speechEngineVoice`", textToSpeechMarkup: "`MathfieldElement.textToSpeechMarkup`", textToSpeechRules: "`MathfieldElement.textToSpeechRules`", textToSpeechRulesOptions: "`MathfieldElement.textToSpeechRulesOptions`", readAloudHook: "`MathfieldElement.readAloudHook`", speakHook: "`MathfieldElement.speakHook`", computeEngine: "`MathfieldElement.computeEngine`", fontsDirectory: "`MathfieldElement.fontsDirectory`", soundsDirectory: "`MathfieldElement.soundsDirectory`", createHTML: "`MathfieldElement.createHTML`", onExport: "`mf.onExport`", onInlineShortcut: "`mf.onInlineShortcut`", onScrollIntoView: "`mf.onScrollIntoView`", locale: "MathfieldElement.locale = ...", strings: "MathfieldElement.strings = ...", decimalSeparator: "MathfieldElement.decimalSeparator = ...", fractionNavigationOrder: "MathfieldElement.fractionNavigationOrder = ..." }, ce = class ce2 extends HTMLElement {
  constructor(r) {
    super();
    this._observer = null;
    if (r) {
      let i = [];
      for (let n of Object.keys(r)) if (Jr[n]) if (Jr[n].startsWith("mf.")) if (Jr[n].startsWith(`mf.${n}`)) i.push(`Option \`${n}\` cannot be used as a constructor option. Use ${Jr[n]}`);
      else {
        let o = Jr[n].match(/([a-zA-Z]+) =/);
        i.push(`Option \`${n}\` has been renamed \`${o[1]}\``);
      }
      else i.push(`Option \`${n}\` cannot be used as a constructor option. Use ${Jr[n]}`);
      if (i.length > 0) {
        console.group("%cMathLive 0.111.1: %cInvalid Options", "color:#12b; font-size: 1.1rem", "color:#db1111; font-size: 1.1rem"), console.warn("Some of the options passed to `new MathfieldElement(...)` are invalid. \n          See mathfield/changelog/ for details.");
        for (let n of i) console.warn(n);
        console.groupEnd();
      }
    }
    if (Us() && (this._internals = this.attachInternals(), this._internals.role = "group"), this.attachShadow({ mode: "open", delegatesFocus: true }), this.shadowRoot && "adoptedStyleSheets" in this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sr("core"), sr("mathfield"), sr("mathfield-element"), sr("ui"), sr("menu")], this.shadowRoot.appendChild(document.createElement("span"));
      let i = document.createElement("slot");
      i.style.display = "none", this.shadowRoot.appendChild(i);
    } else this.shadowRoot.innerHTML = "<style>" + Nt("core") + Nt("mathfield") + Nt("mathfield-element") + Nt("ui") + Nt("menu") + '</style><span></span><slot style="display:none"></slot>';
    r && this._setOptions(r);
  }
  static get formAssociated() {
    return Us();
  }
  static get optionsAttributes() {
    return { "default-mode": "string", "letter-shape-style": "string", "min-font-scale": "number", "max-matrix-cols": "number", "popover-policy": "string", "math-mode-space": "string", "read-only": "boolean", "remove-extraneous-parentheses": "on/off", "smart-fence": "on/off", "smart-mode": "on/off", "smart-superscript": "on/off", "inline-shortcut-timeout": "string", "script-depth": "string", placeholder: "string", "virtual-keyboard-target-origin": "string", "math-virtual-keyboard-policy": "string" };
  }
  static get observedAttributes() {
    return [...Object.keys(this.optionsAttributes), "contenteditable", "disabled", "readonly", "read-only", "aria-label", "aria-labelledby", "title"];
  }
  static get fontsDirectory() {
    return this._fontsDirectory;
  }
  static set fontsDirectory(r) {
    r !== this._fontsDirectory && (this._fontsDirectory = r, zh());
  }
  get fontsDirectory() {
    throw new Error("Use MathfieldElement.fontsDirectory instead");
  }
  set fontsDirectory(r) {
    throw new Error("Use MathfieldElement.fontsDirectory instead");
  }
  static get soundsDirectory() {
    return this._soundsDirectory;
  }
  static set soundsDirectory(r) {
    this._soundsDirectory = r, this.audioBuffers = {};
  }
  get soundsDirectory() {
    throw new Error("Use MathfieldElement.soundsDirectory instead");
  }
  set soundsDirectory(r) {
    throw new Error("Use MathfieldElement.soundsDirectory instead");
  }
  static get keypressSound() {
    return this._keypressSound;
  }
  static set keypressSound(r) {
    var i, n, o;
    this.audioBuffers = {}, r === null ? this._keypressSound = { spacebar: null, return: null, delete: null, default: null } : typeof r == "string" ? this._keypressSound = { spacebar: r, return: r, delete: r, default: r } : typeof r == "object" && "default" in r && (this._keypressSound = { spacebar: (i = r.spacebar) != null ? i : r.default, return: (n = r.return) != null ? n : r.default, delete: (o = r.delete) != null ? o : r.default, default: r.default });
  }
  static get plonkSound() {
    return this._plonkSound;
  }
  static set plonkSound(r) {
    this.audioBuffers = {}, this._plonkSound = r;
  }
  static get audioContext() {
    return this._audioContext || (this._audioContext = new AudioContext()), this._audioContext;
  }
  static get speechEngine() {
    return this._speechEngine;
  }
  static set speechEngine(r) {
    this._speechEngine = r;
  }
  static get speechEngineRate() {
    return this._speechEngineRate;
  }
  static set speechEngineRate(r) {
    this._speechEngineRate = r;
  }
  static get speechEngineVoice() {
    return this._speechEngineVoice;
  }
  static set speechEngineVoice(r) {
    this._speechEngineVoice = r;
  }
  static get textToSpeechMarkup() {
    return this._textToSpeechMarkup;
  }
  static set textToSpeechMarkup(r) {
    this._textToSpeechMarkup = r;
  }
  static get textToSpeechRules() {
    return this._textToSpeechRules;
  }
  static set textToSpeechRules(r) {
    this._textToSpeechRules = r;
  }
  static get textToSpeechRulesOptions() {
    return this._textToSpeechRulesOptions;
  }
  static set textToSpeechRulesOptions(r) {
    this._textToSpeechRulesOptions = r;
  }
  static get locale() {
    return F.locale;
  }
  static set locale(r) {
    r === "auto" && (r = navigator.language.slice(0, 5)), F.locale = r;
  }
  get locale() {
    throw new Error("Use MathfieldElement.locale instead");
  }
  set locale(r) {
    throw new Error("Use MathfieldElement.locale instead");
  }
  static get strings() {
    return F.strings;
  }
  static set strings(r) {
    F.merge(r);
  }
  get strings() {
    throw new Error("Use MathfieldElement.strings instead");
  }
  set strings(r) {
    throw new Error("Use MathfieldElement.strings instead");
  }
  static get decimalSeparator() {
    return this._decimalSeparator;
  }
  static set decimalSeparator(r) {
    this._decimalSeparator = r, this._computeEngine && console.warn("MathLive 0.111.1: setting MathfieldElement.decimalSeparator after the Compute Engine has been created has no effect on the engine. Reassign MathfieldElement.computeEngine with a freshly configured instance to apply the new separator.");
  }
  get decimalSeparator() {
    throw new Error("Use MathfieldElement.decimalSeparator instead");
  }
  set decimalSeparator(r) {
    throw new Error("Use MathfieldElement.decimalSeparator instead");
  }
  static set scientificNotationTemplate(r) {
    this._scientificNotationTemplate = r;
  }
  static get scientificNotationTemplate() {
    return this._scientificNotationTemplate;
  }
  static get fractionNavigationOrder() {
    return pn.fractionNavigationOrder;
  }
  static set fractionNavigationOrder(r) {
    if (r !== "numerator-denominator" && r !== "denominator-numerator") throw new Error("Invalid value");
    pn.fractionNavigationOrder !== r && (pn.fractionNavigationOrder = r, wc());
  }
  static get computeEngine() {
    var r, i;
    if (this._computeEngine === void 0) {
      let n = window[/* @__PURE__ */ Symbol.for("io.cortexjs.compute-engine")], o = n == null ? void 0 : n.ComputeEngine;
      if (!o) return null;
      if (this._computeEngine = new o(), this._computeEngine && this.decimalSeparator === ",") {
        let [a, s] = String((r = n == null ? void 0 : n.version) != null ? r : "").split(".").map((l) => parseInt(l, 10));
        (a > 0 || a === 0 && s >= 58) && (this._computeEngine.latexOptions = g(h({}, this._computeEngine.latexOptions), { decimalSeparator: "{,}" }));
      }
    }
    return (i = this._computeEngine) != null ? i : null;
  }
  static set computeEngine(r) {
    this._computeEngine = r;
  }
  get computeEngine() {
    throw new Error("Use MathfieldElement.computeEngine instead");
  }
  set computeEngine(r) {
    throw new Error("Use MathfieldElement.computeEngine instead");
  }
  static get isFunction() {
    return typeof this._isFunction != "function" ? () => false : this._isFunction;
  }
  static set isFunction(r) {
    this._isFunction = r, wc();
  }
  static async loadSound(r) {
    delete this.audioBuffers[r];
    let i = "";
    switch (r) {
      case "keypress":
        i = this._keypressSound.default;
        break;
      case "return":
        i = this._keypressSound.return;
        break;
      case "spacebar":
        i = this._keypressSound.spacebar;
        break;
      case "delete":
        i = this._keypressSound.delete;
        break;
      case "plonk":
        i = this.plonkSound;
        break;
    }
    if (typeof i != "string") return;
    i = i.trim();
    let n = this.soundsDirectory;
    if (!(n == null || n === "null" || i === "none" || i === "null")) try {
      let a = await (await fetch(await ds(`${n}/${i}`))).arrayBuffer(), s = await this.audioContext.decodeAudioData(a);
      this.audioBuffers[r] = s;
    } catch (o) {
    }
  }
  static async playSound(r) {
    if ((this.audioContext.state === "suspended" || this.audioContext.state === "interrupted") && await this.audioContext.resume(), this.audioBuffers[r] || await this.loadSound(r), !this.audioBuffers[r]) return;
    let i = this.audioContext.createBufferSource();
    i.buffer = this.audioBuffers[r];
    let n = this.audioContext.createGain();
    n.gain.value = Oy, i.connect(n).connect(this.audioContext.destination), i.start();
  }
  showMenu(r) {
    var i, n;
    return (n = (i = this._mathfield) == null ? void 0 : i.showMenu(r)) != null ? n : false;
  }
  get mathVirtualKeyboard() {
    throw new Error("The `mathVirtualKeyboard` property is not available on the MathfieldElement. Use `window.mathVirtualKeyboard` instead.");
  }
  onPointerDown() {
    window.addEventListener("pointerup", (r) => {
      let i = this._mathfield;
      if (i && r.target === this && !i.disabled) {
        this.dispatchEvent(new MouseEvent("click", { altKey: r.altKey, button: r.button, buttons: r.buttons, clientX: r.clientX, clientY: r.clientY, ctrlKey: r.ctrlKey, metaKey: r.metaKey, movementX: r.movementX, movementY: r.movementY, relatedTarget: r.relatedTarget, screenX: r.screenX, screenY: r.screenY, shiftKey: r.shiftKey }));
        let n = this.getOffsetFromPoint(r.clientX, r.clientY);
        n >= 0 && ce2.openUrl(Z0(i, n)), r.pointerType === "touch" && this.selectionIsCollapsed && (this.position = n);
      }
    }, { once: true });
  }
  getPromptValue(r, i) {
    var n, o;
    return (o = (n = this._mathfield) == null ? void 0 : n.getPromptValue(r, i)) != null ? o : "";
  }
  setPromptValue(r, i, n) {
    var o;
    (o = this._mathfield) == null || o.setPromptValue(r, i, n);
  }
  getPromptRange(r) {
    var i, n;
    return (n = (i = this._mathfield) == null ? void 0 : i.getPromptRange(r)) != null ? n : null;
  }
  getPrompts(r) {
    var i, n;
    return (n = (i = this._mathfield) == null ? void 0 : i.getPrompts(r)) != null ? n : [];
  }
  get hasEditableContent() {
    var r, i;
    return (i = (r = this._mathfield) == null ? void 0 : r.hasEditableContent) != null ? i : false;
  }
  get form() {
    var r;
    return (r = this._internals) == null ? void 0 : r.form;
  }
  get name() {
    var r;
    return (r = this.getAttribute("name")) != null ? r : "";
  }
  get type() {
    return this.localName;
  }
  get mode() {
    var r, i;
    return (i = (r = this._mathfield) == null ? void 0 : r.model.mode) != null ? i : this.defaultMode === "text" ? "text" : "math";
  }
  set mode(r) {
    var i;
    (i = this._mathfield) == null || i.switchMode(r);
  }
  get errors() {
    var r, i;
    return (i = (r = this._mathfield) == null ? void 0 : r.errors) != null ? i : [];
  }
  _getOptions(r) {
    return this._mathfield ? fr(this._mathfield.options, r) : Q.has(this) ? h({}, fr(h(h({}, Sn()), wn(Q.get(this).options)), r)) : null;
  }
  getOptions(r) {
    return console.warn("%cMathLive 0.111.1: %cDeprecated Usage%c\n      `mf.getOptions()` is deprecated. Read the property directly on the mathfield instead.\n      See mathfield/changelog/ for details.", "color:#12b; font-size: 1.1rem", "color:#db1111; font-size: 1.1rem", "color: inherit, font-size: 1rem"), this._mathfield ? fr(this._mathfield.options, r) : Q.has(this) ? fr(h(h({}, Sn()), wn(Q.get(this).options)), r) : null;
  }
  reflectAttributes() {
    let r = Sn(), i = this._getOptions();
    Object.keys(ce2.optionsAttributes).forEach((n) => {
      let o = n === "placeholder" ? "contentPlaceholder" : gr(n);
      ce2.optionsAttributes[n] === "on/off" ? r[o] !== i[o] ? this.setAttribute(n, i[o] ? "on" : "off") : this.removeAttribute(n) : r[o] !== i[o] && (ce2.optionsAttributes[n] === "boolean" ? i[o] ? this.setAttribute(n, "") : this.removeAttribute(n) : (typeof i[o] == "string" || typeof i[o] == "number") && this.setAttribute(n, i[o].toString()));
    });
  }
  getOption(r) {
    return console.warn("%cMathLive 0.111.1: %cDeprecated Usage%c\n      `mf.getOption()` is deprecated. Read the property directly on the mathfield instead.\n      See mathfield/changelog/ for details.", "color:#12b; font-size: 1.1rem", "color:#db1111; font-size: 1.1rem", "color: inherit, font-size: 1rem"), this._getOptions([r])[r];
  }
  _getOption(r) {
    return this._getOptions([r])[r];
  }
  _setOptions(r) {
    if (this._mathfield) this._mathfield.setOptions(r);
    else if (Q.has(this)) {
      let i = h(h({}, Q.get(this).options), r);
      Q.set(this, g(h({}, Q.get(this)), { selection: { ranges: i.readOnly ? [[0, 0]] : [[0, -1]] }, options: i }));
    } else Q.set(this, { value: void 0, selection: { ranges: [[0, 0]] }, options: r, menuItems: void 0 });
    this.reflectAttributes();
  }
  setOptions(r) {
    console.group("%cMathLive 0.111.1: %cDeprecated Usage", "color:#12b; font-size: 1.1rem", "color:#db1111; font-size: 1.1rem"), console.warn(" `mf.setOptions()` is deprecated. Set the property directly on the mathfield instead.\n      See mathfield/changelog/ for details.");
    for (let i of Object.keys(r)) Jr[i] && console.warn(`\`mf.setOptions({${i}:...})\` -> ${Jr[i]}`);
    console.groupEnd(), this._setOptions(r);
  }
  executeCommand(...r) {
    var n, o;
    let i;
    if (r.length === 1 ? i = r[0] : i = [r[0], ...r.slice(1)], i) return (o = (n = this._mathfield) == null ? void 0 : n.executeCommand(i)) != null ? o : false;
    throw new Error("Invalid selector");
  }
  getValue(r, i, n) {
    var o, a;
    if (this._mathfield) return this._mathfield.model.getValue(r, i, n);
    if (Q.has(this)) {
      let s, l, c;
      if (Qi(r) ? ([s, l] = r.ranges[0], c = i) : di(r) ? ([s, l] = r, c = i) : It(r) && It(i) ? (s = r, l = i, c = n) : (s = 0, l = -1, c = r), (c === void 0 || c === "latex") && s === 0 && l === -1) return (a = (o = Q.get(this).value) != null ? o : this.textContent) != null ? a : "";
    }
    return "";
  }
  setValue(r, i) {
    if (this._mathfield && r !== void 0) {
      if (this._mathfield.model.getValue() === r) return;
      i != null || (i = { silenceNotifications: true, mode: "math" }), this._mathfield.setValue(r, i);
      return;
    }
    if (Q.has(this)) {
      let o = Q.get(this).options;
      Q.set(this, { value: r, selection: { ranges: [[-1, -1]], direction: "forward" }, options: o, menuItems: void 0 });
      return;
    }
    let n = Ws(this);
    Q.set(this, { value: r, selection: { ranges: [[-1, -1]], direction: "forward" }, options: n, menuItems: void 0 });
  }
  hasFocus() {
    var r, i;
    return (i = (r = this._mathfield) == null ? void 0 : r.hasFocus()) != null ? i : false;
  }
  focus() {
    var r;
    this.disabled || (r = this._mathfield) == null || r.focus();
  }
  blur() {
    var r;
    (r = this._mathfield) == null || r.blur();
  }
  select() {
    var r;
    (r = this._mathfield) == null || r.select();
  }
  insert(r, i) {
    var n, o;
    return (o = (n = this._mathfield) == null ? void 0 : n.insert(r, i)) != null ? o : false;
  }
  applyStyle(r, i) {
    var n;
    return (n = this._mathfield) == null ? void 0 : n.applyStyle(r, i);
  }
  queryStyle(r) {
    var i, n;
    return (n = (i = this._mathfield) == null ? void 0 : i.queryStyle(r)) != null ? n : "none";
  }
  getOffsetFromPoint(r, i, n) {
    return this._mathfield ? Ao(this._mathfield, r, i, n) : -1;
  }
  getElementInfo(r) {
    return ja(this._mathfield, r);
  }
  resetUndo() {
    var r;
    (r = this._mathfield) == null || r.resetUndo();
  }
  canUndo() {
    return this._mathfield ? this._mathfield.canUndo() : false;
  }
  canRedo() {
    return this._mathfield ? this._mathfield.canRedo() : false;
  }
  handleEvent(r) {
    var n, o, a, s, l;
    if (Te.state !== "closed" || ((o = (n = this._mathfield) == null ? void 0 : n.menu) == null ? void 0 : o.state) !== "closed" || (r.type === "pointerdown" && this.onPointerDown(), r.type === "focus") || r.type !== "blur") return;
    let i = Fo();
    i && ((a = window == null ? void 0 : window.mathVirtualKeyboard) != null && a.visible) || ((s = Te.scrim) == null ? void 0 : s.state) !== "closed" || i && mu() || (l = this._mathfield) == null || l.onBlur({ dispatchEvents: false });
  }
  connectedCallback() {
    var l, c, u, d;
    let r = this.shadowRoot, i = r.host, o = window.getComputedStyle(this).userSelect !== "none";
    if (o) i.addEventListener("pointerdown", this, true);
    else {
      let m = r.querySelector("span");
      m.style.pointerEvents = "none";
    }
    i.addEventListener("focus", this, true), i.addEventListener("blur", this, true), this._observer = new MutationObserver(() => {
      var m;
      this.value = (m = this.textContent) != null ? m : "";
    }), this._observer.observe(this, { childList: true, characterData: true, subtree: true }), Us() || this.hasAttribute("role") || this.setAttribute("role", "group"), o && !this.hasAttribute("contenteditable") && this.setAttribute("contenteditable", "true"), this.hasAttribute("tabindex") || this.setAttribute("tabindex", "0");
    let a = r.querySelector("slot:not([name])");
    if (a) try {
      this._style = a.assignedElements().filter((m) => m.tagName.toLowerCase() === "style").map((m) => m.textContent).join("");
    } catch (m) {
      console.error(m);
    }
    if (this._style) {
      let m = document.createElement("style");
      m.textContent = this._style, r.appendChild(m);
    }
    let s = "";
    if (this.hasAttribute("value") ? s = this.getAttribute("value") : s = (l = a == null ? void 0 : a.assignedNodes().map((m) => m.nodeType === 3 ? m.textContent : "").join("").trim()) != null ? l : "", this._mathfield = new Hs(r.querySelector(":host > span"), g(h({}, (u = (c = Q.get(this)) == null ? void 0 : c.options) != null ? u : Ws(this)), { eventSink: this, value: s })), !Q.has(this)) {
      this.upgradeProperty("disabled"), this.upgradeProperty("readonly");
      for (let m of Object.keys(ce2.optionsAttributes)) this.upgradeProperty(gr(m));
    }
    if (!((d = this._mathfield) != null && d.model)) {
      this._mathfield = null;
      return;
    }
    if (Q.has(this)) {
      let m = this._mathfield, p = Q.get(this), f = p.menuItems;
      m.model.deferNotifications({ content: false, selection: false }, () => {
        let y = p.value;
        y !== void 0 && m.setValue(y), m.model.selection = p.selection, Q.delete(this);
      }), f && (this.menuItems = f);
    }
    window.queueMicrotask(() => {
      this.isConnected && this.dispatchEvent(new Event("mount", { cancelable: false, bubbles: true, composed: true }));
    }), hr();
  }
  disconnectedCallback() {
    var i, n, o;
    if (this.shadowRoot.host.removeEventListener("pointerdown", this, true), !this._mathfield) return;
    (i = this._observer) == null || i.disconnect(), this._observer = null, this._mathfield.hasFocus() && this._mathfield.onBlur({ dispatchEvents: true }), window.queueMicrotask(() => this.dispatchEvent(new Event("unmount", { cancelable: false, bubbles: true, composed: true })));
    let r = fr(this._mathfield.options, Object.keys(ce2.optionsAttributes).map((a) => gr(a)));
    Q.set(this, { value: this._mathfield.getValue(), selection: this._mathfield.model.selection, menuItems: (o = (n = this._mathfield.menu) == null ? void 0 : n.menuItems) != null ? o : void 0, options: r }), this._mathfield.dispose(), this._mathfield = null;
  }
  upgradeProperty(r) {
    if (this.hasOwnProperty(r)) {
      let i = this[r];
      delete this[r], (r === "readonly" || r === "read-only") && (r = "readOnly"), this[r] = i;
    }
  }
  attributeChangedCallback(r, i, n) {
    var a;
    if (i === n) return;
    let o = n !== null;
    switch (r) {
      case "contenteditable":
        Y(this._mathfield);
        break;
      case "aria-label":
      case "aria-labelledby":
      case "title":
        (a = this._mathfield) == null || a.updateAccessibleName();
        break;
      case "placeholder":
        n === false && (n = ""), this.placeholder = n;
        break;
      case "disabled":
        this.disabled = o;
        break;
      case "read-only":
      case "readonly":
        this.readOnly = o;
        break;
    }
  }
  get readonly() {
    return this.hasAttribute("readonly") || this.hasAttribute("read-only");
  }
  set readonly(r) {
    let i = !!r;
    i ? this.setAttribute("readonly", "") : (this.removeAttribute("readonly"), this.removeAttribute("read-only")), this._setOptions({ readOnly: i });
  }
  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(r) {
    var n;
    let i = !!r;
    i ? this.setAttribute("disabled", "") : this.removeAttribute("disabled"), Us() ? this._internals.ariaDisabled = i ? "true" : "false" : this.setAttribute("aria-disabled", i ? "true" : "false"), i && ((n = this._mathfield) != null && n.hasFocus) && window.mathVirtualKeyboard.visible && this._mathfield.executeCommand("hideVirtualKeyboard");
  }
  get value() {
    return this.getValue();
  }
  set value(r) {
    this.setValue(r);
  }
  get defaultMode() {
    return this._getOption("defaultMode");
  }
  set defaultMode(r) {
    this._setOptions({ defaultMode: r });
  }
  get macros() {
    if (!this._mathfield) throw new Error("Mathfield not mounted");
    return this._getOption("macros");
  }
  set macros(r) {
    this._setOptions({ macros: r });
  }
  get registers() {
    if (!this._mathfield) throw new Error("Mathfield not mounted");
    let r = this;
    return new Proxy({}, { get: (i, n) => {
      if (typeof n == "string") return r._getOption("registers")[n];
    }, set(i, n, o) {
      return typeof n != "string" ? false : (r._setOptions({ registers: g(h({}, r._getOption("registers")), { [n]: o }) }), true);
    }, ownKeys: () => Reflect.ownKeys(r._getOption("registers")), getOwnPropertyDescriptor: (i, n) => {
      let o = r._getOption("registers")[n];
      if (o !== void 0) return { configurable: true, enumerable: true, value: o, writable: true };
    } });
  }
  set registers(r) {
    this._setOptions({ registers: r });
  }
  get colorMap() {
    return this._getOption("colorMap");
  }
  set colorMap(r) {
    this._setOptions({ colorMap: r });
  }
  get backgroundColorMap() {
    return this._getOption("backgroundColorMap");
  }
  set backgroundColorMap(r) {
    this._setOptions({ backgroundColorMap: r });
  }
  get letterShapeStyle() {
    return this._getOption("letterShapeStyle");
  }
  set letterShapeStyle(r) {
    this._setOptions({ letterShapeStyle: r });
  }
  get minFontScale() {
    return this._getOption("minFontScale");
  }
  set minFontScale(r) {
    this._setOptions({ minFontScale: r });
  }
  get maxMatrixCols() {
    return this._getOption("maxMatrixCols");
  }
  set maxMatrixCols(r) {
    this._setOptions({ maxMatrixCols: r });
  }
  get smartMode() {
    return this._getOption("smartMode");
  }
  set smartMode(r) {
    this._setOptions({ smartMode: r });
  }
  get smartFence() {
    return this._getOption("smartFence");
  }
  set smartFence(r) {
    this._setOptions({ smartFence: r });
  }
  get smartSuperscript() {
    return this._getOption("smartSuperscript");
  }
  set smartSuperscript(r) {
    this._setOptions({ smartSuperscript: r });
  }
  get scriptDepth() {
    return this._getOption("scriptDepth");
  }
  set scriptDepth(r) {
    this._setOptions({ scriptDepth: r });
  }
  get removeExtraneousParentheses() {
    return this._getOption("removeExtraneousParentheses");
  }
  set removeExtraneousParentheses(r) {
    this._setOptions({ removeExtraneousParentheses: r });
  }
  get mathModeSpace() {
    return this._getOption("mathModeSpace");
  }
  set mathModeSpace(r) {
    this._setOptions({ mathModeSpace: r });
  }
  get placeholderSymbol() {
    return this._getOption("placeholderSymbol");
  }
  set placeholderSymbol(r) {
    this._setOptions({ placeholderSymbol: r });
  }
  get placeholder() {
    return this._getOption("contentPlaceholder");
  }
  set placeholder(r) {
    this._setOptions({ contentPlaceholder: r });
  }
  get popoverPolicy() {
    return this._getOption("popoverPolicy");
  }
  set popoverPolicy(r) {
    this._setOptions({ popoverPolicy: r });
  }
  get environmentPopoverPolicy() {
    return this._getOption("environmentPopoverPolicy");
  }
  set environmentPopoverPolicy(r) {
    this._setOptions({ environmentPopoverPolicy: r });
  }
  get menuItems() {
    var r;
    if (!this._mathfield) throw new Error("Mathfield not mounted");
    return (r = this._mathfield.menu._menuItems.map((i) => i.menuItem)) != null ? r : [];
  }
  set menuItems(r) {
    var i;
    if (!this._mathfield) throw new Error("Mathfield not mounted");
    if (this._mathfield) {
      let n = (i = this._mathfield.element) == null ? void 0 : i.querySelector("[part=menu-toggle]");
      n && (n.style.display = r.length === 0 ? "none" : ""), this._mathfield.menu.menuItems = r;
    }
  }
  get mathVirtualKeyboardPolicy() {
    return this._getOption("mathVirtualKeyboardPolicy");
  }
  set mathVirtualKeyboardPolicy(r) {
    this._setOptions({ mathVirtualKeyboardPolicy: r });
  }
  get inlineShortcuts() {
    if (!this._mathfield) throw new Error("Mathfield not mounted");
    return this._getOption("inlineShortcuts");
  }
  set inlineShortcuts(r) {
    if (!this._mathfield) throw new Error("Mathfield not mounted");
    this._setOptions({ inlineShortcuts: r });
  }
  get inlineShortcutTimeout() {
    return this._getOption("inlineShortcutTimeout");
  }
  set inlineShortcutTimeout(r) {
    this._setOptions({ inlineShortcutTimeout: r });
  }
  get keybindings() {
    if (!this._mathfield) throw new Error("Mathfield not mounted");
    return this._getOption("keybindings");
  }
  set keybindings(r) {
    if (!this._mathfield) throw new Error("Mathfield not mounted");
    this._setOptions({ keybindings: r });
  }
  get onInsertStyle() {
    let r = this._getOption("onInsertStyle");
    return r === void 0 ? co : r;
  }
  set onInsertStyle(r) {
    this._setOptions({ onInsertStyle: r });
  }
  get onInlineShortcut() {
    return this._getOption("onInlineShortcut");
  }
  set onInlineShortcut(r) {
    this._setOptions({ onInlineShortcut: r });
  }
  get onScrollIntoView() {
    return this._getOption("onScrollIntoView");
  }
  set onScrollIntoView(r) {
    this._setOptions({ onScrollIntoView: r });
  }
  get onExport() {
    return this._getOption("onExport");
  }
  set onExport(r) {
    this._setOptions({ onExport: r });
  }
  get readOnly() {
    return this._getOption("readOnly");
  }
  set readOnly(r) {
    this._setOptions({ readOnly: r });
  }
  get isSelectionEditable() {
    var r, i;
    return (i = (r = this._mathfield) == null ? void 0 : r.isSelectionEditable) != null ? i : false;
  }
  setPromptState(r, i, n) {
    var o;
    (o = this._mathfield) == null || o.setPromptState(r, i, n);
  }
  getPromptState(r) {
    var i, n;
    return (n = (i = this._mathfield) == null ? void 0 : i.getPromptState(r)) != null ? n : [void 0, true];
  }
  get selection() {
    return this._mathfield ? this._mathfield.model.selection : Q.has(this) ? Q.get(this).selection : { ranges: [[0, 0]], direction: "forward" };
  }
  set selection(r) {
    if (typeof r == "number" && (r = { ranges: [[r, r]] }), this._mathfield) {
      this._mathfield.model.selection = r, Y(this._mathfield);
      return;
    }
    if (Q.has(this)) {
      Q.set(this, g(h({}, Q.get(this)), { selection: r }));
      return;
    }
    Q.set(this, { value: void 0, selection: r, options: Ws(this), menuItems: void 0 });
  }
  get selectionIsCollapsed() {
    let r = this.selection;
    return r.ranges.length === 1 && r.ranges[0][0] === r.ranges[0][1];
  }
  get position() {
    return this._mathfield ? this._mathfield.model.position : Q.has(this) ? Q.get(this).selection.ranges[0][0] : 0;
  }
  set position(r) {
    if (this._mathfield && (this._mathfield.model.position = r, Y(this._mathfield)), Q.has(this)) {
      Q.set(this, g(h({}, Q.get(this)), { selection: { ranges: [[r, r]] } }));
      return;
    }
    Q.set(this, { value: void 0, selection: { ranges: [[r, r]] }, options: Ws(this), menuItems: void 0 });
  }
  get lastOffset() {
    var r, i;
    return (i = (r = this._mathfield) == null ? void 0 : r.model.lastOffset) != null ? i : -1;
  }
};
ce.version = "0.111.1", ce.openUrl = (r) => {
  if (!r) return;
  let i = new URL(r);
  if (!["http:", "https:", "file:"].includes(i.protocol.toLowerCase())) {
    ce.playSound("plonk");
    return;
  }
  window.open(i, "_blank");
}, ce._fontsDirectory = "./fonts/", ce._soundsDirectory = "./sounds", ce.keypressVibration = true, ce._keypressSound = { spacebar: "keypress-spacebar.wav", return: "keypress-return.wav", delete: "keypress-delete.wav", default: "keypress-standard.wav" }, ce._plonkSound = "plonk.wav", ce.audioBuffers = {}, ce.createHTML = (r) => r, ce._speechEngineRate = "100%", ce._speechEngineVoice = "Joanna", ce._textToSpeechMarkup = "", ce._textToSpeechRules = "mathlive", ce._textToSpeechRulesOptions = {}, ce.speakHook = Vp, ce.readAloudHook = Hp, ce.restoreFocusWhenDocumentFocused = true, ce._decimalSeparator = ".", ce._scientificNotationTemplate = "#1\\times10^{#2}", ce._isFunction = (r) => {
  var n, o;
  let i = globalThis.MathfieldElement.computeEngine;
  return (o = (n = i == null ? void 0 : i.parse(r).domain) == null ? void 0 : n.isFunction) != null ? o : false;
};
var Mt = ce;
function gr(t38) {
  return t38.replace(/[^a-zA-Z\d]+(.)/g, (e, r) => r.toUpperCase());
}
function Ws(t38) {
  let e = { readOnly: false }, r = Mt.optionsAttributes;
  return Object.keys(r).forEach((i) => {
    var n;
    if (t38.hasAttribute(i)) {
      let o = t38.getAttribute(i);
      i === "placeholder" ? e.contentPlaceholder = o != null ? o : "" : r[i] === "boolean" ? e[gr(i)] = true : r[i] === "on/off" ? (o = (n = o == null ? void 0 : o.toLowerCase()) != null ? n : "", o === "on" || o === "true" ? e[gr(i)] = true : o === "off" || o === "false" ? e[gr(i)] = false : e[gr(i)] = void 0) : r[i] === "number" ? e[gr(i)] = Number.parseFloat(o != null ? o : "0") : e[gr(i)] = o;
    }
  }), e;
}
function Us() {
  return !(!("ElementInternals" in window) || !HTMLElement.prototype.attachInternals || !("role" in window.ElementInternals.prototype));
}
var xn = Mt, Wp, Up, jp;
if (Le() && !((Wp = window.customElements) != null && Wp.get("math-field"))) {
  window[Up = /* @__PURE__ */ Symbol.for("io.cortexjs.mathlive")] != null || (window[Up] = {});
  let t38 = window[/* @__PURE__ */ Symbol.for("io.cortexjs.mathlive")];
  t38.version = "0.111.1", globalThis.MathfieldElement = Mt, (jp = window.customElements) == null || jp.define("math-field", Mt);
}
var Po;
function Gs(t38) {
  var e, r;
  if (!Po) {
    let i = (e = globalThis[/* @__PURE__ */ Symbol.for("io.cortexjs.compute-engine")]) == null ? void 0 : e.ComputeEngine;
    i ? Po = new i() : console.error(`MathLive 0.111.1: The CortexJS Compute Engine library is not available.

        Load the library, for example with:

        import "https://esm.run/@cortex-js/compute-engine"`);
  }
  return (r = Po == null ? void 0 : Po.box(t38).latex) != null ? r : "";
}
var Jp = false, Xp = null;
function By() {
  Jp || Xp || (Xp = hr().then(() => {
    Jp = true;
  }));
}
var js = class extends HTMLElement {
  constructor() {
    super();
    this._hasRendered = false;
    if (this._shadowRoot = this.attachShadow({ mode: "open" }), "adoptedStyleSheets" in this._shadowRoot) this._shadowRoot.adoptedStyleSheets = [sr("core")];
    else {
      let r = document.createElement("style");
      r.textContent = Nt("core"), this._shadowRoot.appendChild(r);
    }
    this._contentSlot = document.createElement("div"), this._contentSlot.style.display = "none", this._contentSlot.setAttribute("part", "content"), this._renderContainer = document.createElement("div"), this._renderContainer.setAttribute("part", "render"), this._renderContainer.setAttribute("aria-hidden", "true"), this._errorFallback = document.createElement("div"), this._errorFallback.style.display = "none", this._errorFallback.setAttribute("part", "error"), this._shadowRoot.appendChild(this._contentSlot), this._shadowRoot.appendChild(this._renderContainer), this._shadowRoot.appendChild(this._errorFallback), this.addEventListener("keydown", this._handleKeydown.bind(this));
  }
  static get observedAttributes() {
    return ["mode", "format", "macros", "letter-shape-style", "min-font-scale", "max-matrix-cols"];
  }
  connectedCallback() {
    By(), "IntersectionObserver" in window && !this._hasRendered ? (this._observer = new IntersectionObserver((r) => {
      var i;
      r[0].isIntersecting && !this._hasRendered && (this.render(), (i = this._observer) == null || i.disconnect());
    }, { rootMargin: "50px" }), this._observer.observe(this)) : this.render();
  }
  disconnectedCallback() {
    var r;
    (r = this._observer) == null || r.disconnect();
  }
  attributeChangedCallback(r, i, n) {
    i !== n && this._hasRendered && this.render();
  }
  _handleKeydown(r) {
    if (this.getAttribute("tabindex") !== null && (r.key === " " || r.key === "Enter")) {
      r.preventDefault();
      let n = this.getAttribute("aria-label");
      if (n && "speechSynthesis" in window) {
        let o = new SpeechSynthesisUtterance(n);
        speechSynthesis.speak(o);
      }
    }
  }
  get mode() {
    let r = this.getAttribute("mode");
    return r === "textstyle" || r === "displaystyle" ? r : this.getDefaultMathstyle();
  }
  set mode(r) {
    this.setAttribute("mode", r);
  }
  get format() {
    let r = this.getAttribute("format");
    return r === "latex" || r === "ascii-math" || r === "math-json" ? r : "latex";
  }
  set format(r) {
    this.setAttribute("format", r);
  }
  get letterShapeStyle() {
    let r = this.getAttribute("letter-shape-style");
    if (r === "auto" || r === "tex" || r === "iso" || r === "french" || r === "upright") return r;
  }
  set letterShapeStyle(r) {
    r === void 0 ? this.removeAttribute("letter-shape-style") : this.setAttribute("letter-shape-style", r);
  }
  get macros() {
    var r;
    return (r = this.getAttribute("macros")) != null ? r : void 0;
  }
  set macros(r) {
    r === void 0 ? this.removeAttribute("macros") : this.setAttribute("macros", r);
  }
  get minFontScale() {
    let r = this.getAttribute("min-font-scale");
    return r ? parseFloat(r) : void 0;
  }
  set minFontScale(r) {
    r === void 0 ? this.removeAttribute("min-font-scale") : this.setAttribute("min-font-scale", String(r));
  }
  get maxMatrixCols() {
    let r = this.getAttribute("max-matrix-cols");
    return r ? parseInt(r, 10) : void 0;
  }
  set maxMatrixCols(r) {
    r === void 0 ? this.removeAttribute("max-matrix-cols") : this.setAttribute("max-matrix-cols", String(r));
  }
  render() {
    var r, i, n;
    try {
      let o = (i = (r = this.textContent) == null ? void 0 : r.trim()) != null ? i : "";
      if (!o) {
        this._renderContainer.innerHTML = "", this._errorFallback.style.display = "none", this._renderContainer.style.display = "none", this._removeMathML();
        return;
      }
      this._contentSlot.textContent = o;
      let a, s = this.format;
      if (s === "ascii-math") a = Dp(o);
      else if (s === "math-json") {
        let u = JSON.parse(o);
        a = Gs(u);
      } else a = o;
      let l = { defaultMode: this.mode === "displaystyle" ? "math" : "inline-math" };
      if (this.letterShapeStyle && (l.letterShapeStyle = this.letterShapeStyle), this.macros) try {
        l.macros = JSON.parse(this.macros);
      } catch (u) {
        console.warn("Invalid macros JSON:", u);
      }
      this.minFontScale !== void 0 && (l.minFontScale = this.minFontScale), this.maxMatrixCols !== void 0 && (l.maxMatrixCols = this.maxMatrixCols);
      let c = fe(a, l);
      this._renderContainer.innerHTML = c, this._renderContainer.style.display = this.getDefaultDisplay(), this._errorFallback.style.display = "none", this._updateAccessibility(a), this._hasRendered = true, this.dispatchEvent(new CustomEvent("render", { bubbles: true, composed: true, detail: { format: s, content: a } }));
    } catch (o) {
      console.error("MathLive static element render error:", o), this._renderContainer.style.display = "none", this._errorFallback.textContent = (n = this.textContent) != null ? n : "", this._errorFallback.style.display = "block", this._removeMathML(), this.dispatchEvent(new CustomEvent("render-error", { bubbles: true, composed: true, detail: { error: o, content: this.textContent } }));
    }
  }
  _updateAccessibility(r) {
    if (!this.hasAttribute("aria-label")) try {
      let i = $s(r);
      this.setAttribute("aria-label", i);
    } catch (i) {
      console.warn("Could not generate speakable text:", i);
    }
    this.hasAttribute("role") || this.setAttribute("role", "img"), this._addMathML(r);
  }
  _addMathML(r) {
    try {
      let i = Fs(r);
      this._mathMLContainer || (this._mathMLContainer = document.createElement("div"), this._mathMLContainer.style.position = "absolute", this._mathMLContainer.style.width = "1px", this._mathMLContainer.style.height = "1px", this._mathMLContainer.style.overflow = "hidden", this._mathMLContainer.style.clip = "rect(0, 0, 0, 0)", this._mathMLContainer.setAttribute("aria-hidden", "false"), this._shadowRoot.appendChild(this._mathMLContainer)), this._mathMLContainer.innerHTML = "<math xmlns='http://www.w3.org/1998/Math/MathML'>" + i + "</math>";
    } catch (i) {
      console.warn("Could not generate MathML:", i);
    }
  }
  _removeMathML() {
    this._mathMLContainer && (this._mathMLContainer.remove(), this._mathMLContainer = void 0);
  }
}, Js = class extends js {
  getDefaultMathstyle() {
    return "textstyle";
  }
  getDefaultDisplay() {
    return "inline-flex";
  }
}, Xs = class extends js {
  getDefaultMathstyle() {
    return "displaystyle";
  }
  getDefaultDisplay() {
    return "flex";
  }
};
function Ky() {
  var t38, e, r, i;
  typeof window != "undefined" && ((t38 = window.customElements) != null && t38.get("math-span") || (e = window.customElements) == null || e.define("math-span", Js), (r = window.customElements) != null && r.get("math-div") || (i = window.customElements) == null || i.define("math-div", Xs));
}
Ky();
function Fy(t38, e) {
  let r = Fe.singleton;
  return r ? (r.show(), Hr(), r.currentLayer = e, r.render(), r.focus(), true) : false;
}
function $y() {
  let t38 = window.mathVirtualKeyboard;
  return t38.visible ? t38.hide({ animate: true }) : t38.show({ animate: true }), false;
}
pe({ switchKeyboardLayer: Fy, toggleVirtualKeyboard: $y, hideVirtualKeyboard: () => (window.mathVirtualKeyboard.hide({ animate: true }), false), showVirtualKeyboard: () => (window.mathVirtualKeyboard.show({ animate: true }), false) }, { target: "virtual-keyboard" });
function Zt() {
  var t38;
  return globalThis[t38 = /* @__PURE__ */ Symbol.for("io.cortexjs.mathlive")] != null || (globalThis[t38] = {}), globalThis[/* @__PURE__ */ Symbol.for("io.cortexjs.mathlive")];
}
Mt.fontsDirectory = null;
Mt.soundsDirectory = null;
function MathDialog({ initial, editing, onApply, onCancel }) {
  const { t: t38, lang } = useI18n();
  const titleId = reactExports.useId();
  const host = reactExports.useRef(null);
  const field = reactExports.useRef(null);
  const [latex, setLatex] = reactExports.useState(initial.latex);
  const [display, setDisplay] = reactExports.useState(initial.display);
  const [stale, setStale] = reactExports.useState(false);
  const value = reactExports.useMemo(() => ({ latex, display }), [latex, display]);
  const preview = reactExports.useMemo(() => renderMath(value), [value]);
  const modalKeys = useModalKeys(onCancel, { restoreFocus: true });
  const inputLabel = t38("mathVisualInput");
  reactExports.useEffect(() => {
    const mf2 = new Mt();
    mf2.mathVirtualKeyboardPolicy = "manual";
    mf2.value = initial.latex.length <= MAX_LATEX_LENGTH ? initial.latex : "";
    const keyboardZIndex = document.body.style.getPropertyValue("--keyboard-zindex");
    document.body.style.setProperty("--keyboard-zindex", "1300");
    const input = () => setLatex(mf2.value);
    mf2.addEventListener("input", input);
    host.current?.append(mf2);
    mf2.menuItems = [];
    field.current = mf2;
    mf2.focus();
    return () => {
      mf2.removeEventListener("input", input);
      window.mathVirtualKeyboard?.hide();
      if (keyboardZIndex) document.body.style.setProperty("--keyboard-zindex", keyboardZIndex);
      else document.body.style.removeProperty("--keyboard-zindex");
      mf2.remove();
      field.current = null;
    };
  }, [initial]);
  reactExports.useEffect(() => {
    field.current?.setAttribute("aria-label", inputLabel);
    field.current?.setAttribute("lang", lang);
  }, [inputLabel, lang]);
  const apply = () => {
    if (!latex.trim() || latex.length > MAX_LATEX_LENGTH) return;
    if (!onApply(value)) setStale(true);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "html-math-mask",
      ref: modalKeys.ref,
      onKeyDown: (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.nativeEvent.isComposing) {
          e.preventDefault();
          e.stopPropagation();
          apply();
        } else modalKeys.onKeyDown(e);
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "section",
        {
          className: "html-math-dialog",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": titleId,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: titleId, children: t38(editing ? "mathEdit" : "mathInsert") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": t38("closeEsc"), onClick: onCancel, children: "×" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: t38("mathHelp") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "html-math-field", ref: host }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "html-math-templates", children: [
              MATH_TEMPLATES.map(([label, snippet]) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    field.current?.insert(snippet);
                    field.current?.focus();
                    setLatex(field.current?.value ?? latex);
                  },
                  children: t38(label)
                },
                label
              )),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const keyboard = window.mathVirtualKeyboard;
                    if (keyboard.visible) keyboard.hide();
                    else keyboard.show();
                  },
                  children: t38("mathKeyboard")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "html-math-source", children: [
              t38("mathSource"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  "aria-label": t38("mathSource"),
                  rows: 3,
                  spellCheck: false,
                  value: latex,
                  onChange: (e) => {
                    setLatex(e.target.value);
                    if (e.target.value.length <= MAX_LATEX_LENGTH)
                      field.current?.setValue(e.target.value, { silenceNotifications: true });
                  }
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "html-math-display", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: display, onChange: (e) => setDisplay(e.target.checked) }),
              t38("mathDisplay")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "html-math-preview",
                "aria-label": t38("mathPreview"),
                dangerouslySetInnerHTML: { __html: preview.html }
              }
            ),
            preview.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "html-math-warning", role: "status", children: t38("mathUnsupported") }),
            latex.length > MAX_LATEX_LENGTH && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", children: t38("mathTooLong", { n: MAX_LATEX_LENGTH }) }),
            stale && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", children: t38("mathStale") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: t38("mathShortcut") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onCancel, children: t38("cancel") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "primary",
                  disabled: !latex.trim() || latex.length > MAX_LATEX_LENGTH || stale,
                  onClick: apply,
                  children: t38("mathApply")
                }
              )
            ] })
          ]
        }
      )
    }
  );
}
export {
  MathDialog
};
