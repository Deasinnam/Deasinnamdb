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

// ../../../pblsketch/ieumoffice/packages/agent-core/src/redact-range.ts
var redact_range_exports = {};
__export(redact_range_exports, {
  REDACT_EL: () => REDACT_EL,
  REDACT_NS: () => REDACT_NS,
  REDACT_PREFIX: () => REDACT_PREFIX,
  redactTextBetween: () => redactTextBetween,
  withheldNodeSize: () => withheldNodeSize
});
module.exports = __toCommonJS(redact_range_exports);
var DEFAULT_BLOCK_SEPARATOR = "\n";
var DEFAULT_LEAF_TEXT = " ";
function nameOf(value) {
  return typeof value === "string" ? value : value?.name;
}
function markNameOf(mark, wanted) {
  return nameOf(mark.type) === wanted;
}
function labelOf(node, wanted) {
  const mark = (node.marks ?? []).find((m) => markNameOf(m, wanted));
  const label = mark?.attrs?.label;
  return typeof label === "string" ? label : "private";
}
function withheldNodeSize(node, isLeaf) {
  if (typeof node.text === "string") return node.text.length;
  if (isLeaf(node)) return 1;
  return 2 + (Array.isArray(node.content) ? node.content.reduce((sum, child) => sum + withheldNodeSize(child, isLeaf), 0) : 0);
}
function redactTextBetween(node, from, to, options) {
  const {
    markName,
    marker,
    blockSeparator = DEFAULT_BLOCK_SEPARATOR,
    leafText = DEFAULT_LEAF_TEXT,
    isLeaf = () => false
  } = options;
  if (to <= from) return "";
  const blocks = node.content;
  if (!Array.isArray(blocks)) return "";
  const resolved = {
    markName,
    marker,
    blockSeparator,
    leafText,
    isLeaf
  };
  const size = (n) => withheldNodeSize(n, resolved.isLeaf);
  const out = [];
  let blockPos = 0;
  blocks.forEach((block) => {
    if (blockPos > from && blockPos < to) out.push(blockSeparator);
    if (blockPos + 1 < to) walkInline(block, blockPos + 1, from, to, out, resolved, size);
    blockPos += size(block);
  });
  return out.join("");
}
function walkInline(block, contentStart, from, to, out, options, size) {
  const { markName, marker, leafText, isLeaf } = options;
  const selfStart = contentStart - 1;
  if ((block.marks ?? []).some((m) => markNameOf(m, markName))) {
    if (selfStart < to && selfStart + size(block) > from) out.push(marker(labelOf(block, markName)));
    return;
  }
  const children = block.content;
  if (!Array.isArray(children)) {
    if (typeof block.text === "string" && contentStart < to) {
      out.push(
        block.text.slice(
          Math.max(0, from - contentStart),
          Math.min(block.text.length, to - contentStart)
        )
      );
    }
    return;
  }
  let pos = contentStart;
  for (const child of children) {
    const start = pos;
    if ((child.marks ?? []).some((m) => markNameOf(m, markName))) {
      if (start < to && start + size(child) > from) out.push(marker(labelOf(child, markName)));
    } else if (isLeaf(child)) {
      if (start < to && start + size(child) > from) out.push(leafText);
    } else if (typeof child.text === "string") {
      if (start + child.text.length > from && start < to) {
        out.push(
          child.text.slice(Math.max(0, from - start), Math.min(child.text.length, to - start))
        );
      }
    } else {
      walkInline(child, start + 1, from, to, out, options, size);
    }
    pos = start + size(child);
  }
}
var REDACT_NS = "https://genspark.ai/genoffice/redaction/2026";
var REDACT_PREFIX = "go";
var REDACT_EL = `${REDACT_PREFIX}:redact`;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  REDACT_EL,
  REDACT_NS,
  REDACT_PREFIX,
  redactTextBetween,
  withheldNodeSize
});
