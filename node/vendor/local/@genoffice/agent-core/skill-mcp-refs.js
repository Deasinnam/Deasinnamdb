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

// ../../../pblsketch/ieumoffice/packages/agent-core/src/skill-mcp-refs.ts
var skill_mcp_refs_exports = {};
__export(skill_mcp_refs_exports, {
  SKILL_SKIPPED_STEPS_SENTENCE: () => SKILL_SKIPPED_STEPS_SENTENCE,
  mcpServerListOf: () => mcpServerListOf,
  mcpServerUnusableLine: () => mcpServerUnusableLine,
  mcpServersInAllowedTools: () => mcpServersInAllowedTools,
  mcpServersInText: () => mcpServersInText,
  mcpServersOfSkill: () => mcpServersOfSkill,
  skillStepsNote: () => skillStepsNote,
  unusableMcpServers: () => unusableMcpServers
});
module.exports = __toCommonJS(skill_mcp_refs_exports);
var SKILL_SKIPPED_STEPS_SENTENCE = "If any step of this skill cannot be done here (running scripts, a tool that is missing or failed), say in your answer which step you could not do. Do not write as if that step was done.";
function mcpServerUnusableLine(server) {
  return `This skill expects tools from MCP server ${server}, which cannot be used right now.`;
}
var TOOL_IN_TEXT = /(?<![A-Za-z0-9_])mcp__([A-Za-z0-9][A-Za-z0-9_.-]*?)__[A-Za-z0-9*][\w.*-]*/g;
var ALLOWED_ENTRY = /^mcp__([A-Za-z0-9][A-Za-z0-9_.-]*?)(?:__[A-Za-z0-9*][\w.*-]*)?$/;
function addOnce(into, server) {
  if (server && !into.includes(server)) into.push(server);
}
function mcpServersInText(text) {
  const out = [];
  for (const match of text.matchAll(TOOL_IN_TEXT)) addOnce(out, match[1]);
  return out;
}
function mcpServersInAllowedTools(value) {
  if (value === void 0) return [];
  const text = typeof value === "string" ? value : value.join(" ");
  const out = [];
  for (const raw of text.split(/[\s,]+/)) {
    const entry = raw.replace(/^["']+|["']+$/g, "");
    const match = ALLOWED_ENTRY.exec(entry);
    if (match) addOnce(out, match[1]);
  }
  return out;
}
function mcpServersOfSkill(body, allowedTools) {
  const out = mcpServersInAllowedTools(allowedTools);
  for (const server of mcpServersInText(body)) addOnce(out, server);
  return out;
}
function unusableMcpServers(servers, isUsable) {
  return servers.filter((server) => {
    if (!isUsable) return true;
    try {
      return !isUsable(server);
    } catch {
      return true;
    }
  });
}
function skillStepsNote(servers, isUsable) {
  return [
    ...unusableMcpServers(servers, isUsable).map(mcpServerUnusableLine),
    SKILL_SKIPPED_STEPS_SENTENCE
  ].join("\n");
}
function mcpServerListOf(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const server of value) if (typeof server === "string") addOnce(out, server);
  return out;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SKILL_SKIPPED_STEPS_SENTENCE,
  mcpServerListOf,
  mcpServerUnusableLine,
  mcpServersInAllowedTools,
  mcpServersInText,
  mcpServersOfSkill,
  skillStepsNote,
  unusableMcpServers
});
