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

// ../ieum/packages/agent-core/src/user-mcp/result.ts
var result_exports = {};
__export(result_exports, {
  MCP_ERROR_EMPTY: () => MCP_ERROR_EMPTY,
  MCP_NO_ANSWER: () => MCP_NO_ANSWER,
  MCP_RESULT_EMPTY: () => MCP_RESULT_EMPTY,
  MCP_RESULT_MAX_CHARS: () => MCP_RESULT_MAX_CHARS,
  MCP_RESULT_UNREADABLE: () => MCP_RESULT_UNREADABLE,
  mcpCallAnswerOf: () => mcpCallAnswerOf,
  shapeMcpResult: () => shapeMcpResult,
  shapedMcpAnswer: () => shapedMcpAnswer
});
module.exports = __toCommonJS(result_exports);
var MCP_RESULT_MAX_CHARS = 2e5;
var MCP_RESULT_UNREADABLE = "The server returned a result this app could not read.";
var MCP_RESULT_EMPTY = "(The tool returned no content.)";
var MCP_ERROR_EMPTY = "(The tool reported an error without a message.)";
var nonTextLine = (n) => n === 1 ? "[1 non-text item was not passed on.]" : `[${n} non-text items were not passed on.]`;
function canonicalJson(text) {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return null;
  }
}
function cut(output, maxChars) {
  if (output.length <= maxChars) return output;
  let end = Math.max(0, maxChars);
  const last = output.charCodeAt(end - 1);
  if (end > 0 && last >= 55296 && last <= 56319) end -= 1;
  return `${output.slice(0, end)}

[The result was cut because it was long: the first ${end} of ${output.length} characters are shown.]`;
}
function shapeMcpResult(result, maxChars = MCP_RESULT_MAX_CHARS) {
  if (result === null || typeof result !== "object") {
    return { output: MCP_RESULT_UNREADABLE, isError: true };
  }
  const { content, structuredContent, isError } = result;
  if (content !== void 0 && !Array.isArray(content)) {
    return { output: MCP_RESULT_UNREADABLE, isError: true };
  }
  const failed = isError === true;
  const texts = [];
  let skipped = 0;
  for (const block of content ?? []) {
    const b = block;
    if (b && typeof b === "object" && b.type === "text" && typeof b.text === "string") {
      texts.push(b.text);
    } else skipped += 1;
  }
  if (structuredContent !== void 0 && structuredContent !== null) {
    let json = null;
    try {
      json = JSON.stringify(structuredContent) ?? null;
    } catch {
      json = null;
    }
    if (json !== null && !texts.some((t) => canonicalJson(t) === json)) texts.push(json);
  }
  const parts = skipped > 0 ? [...texts, nonTextLine(skipped)] : texts;
  const output = parts.join("\n\n");
  if (output.length === 0) {
    return { output: failed ? MCP_ERROR_EMPTY : MCP_RESULT_EMPTY, isError: failed };
  }
  return { output: cut(output, maxChars), isError: failed };
}
function shapedMcpAnswer(shaped) {
  return { ok: true, output: shaped.output, isError: shaped.isError };
}
var MCP_NO_ANSWER = "The MCP connection did not answer.";
function mcpCallAnswerOf(raw) {
  if (raw === null || raw === void 0) return { ok: false, error: MCP_NO_ANSWER };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: MCP_RESULT_UNREADABLE };
  }
  const answer = raw;
  if (answer.ok === false) {
    const error = typeof answer.error === "string" ? answer.error : "";
    return { ok: false, error: error || "The call could not be made." };
  }
  if (answer.ok === true && typeof answer.output === "string") {
    return { ok: true, output: answer.output, isError: answer.isError === true };
  }
  return { ok: false, error: MCP_RESULT_UNREADABLE };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MCP_ERROR_EMPTY,
  MCP_NO_ANSWER,
  MCP_RESULT_EMPTY,
  MCP_RESULT_MAX_CHARS,
  MCP_RESULT_UNREADABLE,
  mcpCallAnswerOf,
  shapeMcpResult,
  shapedMcpAnswer
});
