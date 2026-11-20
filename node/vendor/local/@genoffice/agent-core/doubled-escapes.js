"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../ieum/packages/agent-core/src/doubled-escapes.ts
var doubled_escapes_exports = {};
__export(doubled_escapes_exports, {
  undoDoubledEscapes: () => undoDoubledEscapes,
  undoDoubledEscapesInList: () => undoDoubledEscapesInList
});
module.exports = __toCommonJS(doubled_escapes_exports);
function undoDoubledEscapes(text) {
  if (/[\r\n]/.test(text) || !/\\[nr]/.test(text)) return text;
  if (/\\(?![nrt"])/.test(text)) return text;
  if (/(?:^|[^A-Za-z])[A-Za-z]:\\/.test(text)) return text;
  return text.replace(/\\r\\n|\\[nrt"]/g, (escape) => {
    if (escape === "\\t") return " ";
    if (escape === '\\"') return '"';
    return "\n";
  });
}
function undoDoubledEscapesInList(value) {
  if (!Array.isArray(value)) return value;
  return value.map((item) => typeof item === "string" ? undoDoubledEscapes(item) : item);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  undoDoubledEscapes,
  undoDoubledEscapesInList
});
