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

// ../../../pblsketch/ieumoffice/packages/agent-core/src/redact-core.ts
var redact_core_exports = {};
__export(redact_core_exports, {
  MAX_LABEL_LENGTH: () => MAX_LABEL_LENGTH,
  checkPlaceholders: () => checkPlaceholders,
  collectPlaceholders: () => collectPlaceholders,
  isWholePlaceholder: () => isWholePlaceholder,
  placeholderInstruction: () => placeholderInstruction,
  placeholderSource: () => placeholderSource,
  readPlaceholderLabel: () => readPlaceholderLabel,
  sanitizeLabel: () => sanitizeLabel
});
module.exports = __toCommonJS(redact_core_exports);
var OPEN = "{{";
var CLOSE = "}}";
var MAX_LABEL_LENGTH = 40;
var LABEL_STRIP = /[{}<>="']/g;
var LABEL_STRIP_COMMENT = /[{}<>="'*/]/g;
function sanitizeLabel(raw, options = {}) {
  return raw.replace(options.forComment ? LABEL_STRIP_COMMENT : LABEL_STRIP, "").replace(/\s+/g, " ").trim().slice(0, MAX_LABEL_LENGTH).trim();
}
function placeholderSource(label) {
  return `${OPEN}${sanitizeLabel(label) || "private"}${CLOSE}`;
}
function isWholePlaceholder(text) {
  const t = text.trim();
  return t.startsWith(OPEN) && t.endsWith(CLOSE) && t.length > OPEN.length + CLOSE.length;
}
function readPlaceholderLabel(text) {
  const t = text.trim();
  if (!isWholePlaceholder(t)) return null;
  return sanitizeLabel(t.slice(OPEN.length, t.length - CLOSE.length)) || null;
}
function collectPlaceholders(text) {
  return [...text.matchAll(/\{\{[^{}]*\}\}/g)].map((m) => m[0]);
}
function leftoverBraces(text) {
  const masked = text.replace(/\{\{[^{}]*\}\}/g, (m) => " ".repeat(m.length));
  const out = [];
  for (const m of masked.matchAll(/\{\{|\}\}/g)) out.push(m[0]);
  for (const m of masked.matchAll(/(?<!\{)\{[^{}]*\}(?!\})/g)) out.push(m[0]);
  return out;
}
function checkPlaceholders(before, after) {
  const issues = [];
  for (const stray of leftoverBraces(after)) {
    issues.push({ found: stray, expected: "", reason: "split" });
  }
  const gotCounts = /* @__PURE__ */ new Map();
  for (const m of collectPlaceholders(after)) gotCounts.set(m, (gotCounts.get(m) ?? 0) + 1);
  const wantCounts = /* @__PURE__ */ new Map();
  for (const m of collectPlaceholders(before)) wantCounts.set(m, (wantCounts.get(m) ?? 0) + 1);
  for (const [marker, want] of wantCounts) {
    const have = gotCounts.get(marker) ?? 0;
    if (have < want) {
      issues.push({ found: have ? marker : "", expected: marker, reason: "missing" });
    }
  }
  for (const [marker, have] of gotCounts) {
    if (!wantCounts.has(marker)) {
      issues.push({ found: marker, expected: "", reason: "unknown" });
      continue;
    }
    if (have > (wantCounts.get(marker) ?? 0)) {
      issues.push({ found: marker, expected: marker, reason: "unknown" });
    }
  }
  return issues;
}
function placeholderInstruction(labels, spec) {
  const list = [...new Set(labels)].map((l) => `- ${placeholderSource(l)}`).join("\n");
  return [
    "## Private placeholders",
    `This ${spec.subject} contains {{...}} placeholders. ${spec.opening}`,
    "",
    "Treat every placeholder as one indivisible object:",
    "- Copy it character for character \u2014 same letters, same order, same spacing.",
    `- Never split it across ${spec.boundary} or put a space inside it.`,
    "- Never merge two into one, never split one into several, never reorder them.",
    "- Never rename, translate, re-case, expand or shorten it.",
    "- Never drop one, and never add a placeholder that was not already there.",
    "",
    ...spec.middle,
    "",
    `The placeholders in this ${spec.subject}:`,
    list
  ].join("\n");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MAX_LABEL_LENGTH,
  checkPlaceholders,
  collectPlaceholders,
  isWholePlaceholder,
  placeholderInstruction,
  placeholderSource,
  readPlaceholderLabel,
  sanitizeLabel
});
