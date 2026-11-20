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

// ../ieum/packages/agent-core/src/user-mcp/names.ts
var names_exports = {};
__export(names_exports, {
  APP_MCP_SERVER_NAME: () => APP_MCP_SERVER_NAME,
  MCP_NAME_SEPARATOR: () => MCP_NAME_SEPARATOR,
  MCP_SERVER_NAME_MAX: () => MCP_SERVER_NAME_MAX,
  MCP_TOOL_NAME_MAX: () => MCP_TOOL_NAME_MAX,
  MCP_TOOL_PREFIX: () => MCP_TOOL_PREFIX,
  RESERVED_MCP_SERVER_NAMES: () => RESERVED_MCP_SERVER_NAMES,
  isMcpToolName: () => isMcpToolName,
  isValidServerName: () => isValidServerName,
  mapServerToolNames: () => mapServerToolNames,
  mcpToolName: () => mcpToolName,
  parseMcpToolName: () => parseMcpToolName,
  parseMcpToolNameIn: () => parseMcpToolNameIn,
  sanitizeToolName: () => sanitizeToolName,
  serverNameProblem: () => serverNameProblem,
  suggestServerName: () => suggestServerName,
  suggestServerNameFrom: () => suggestServerNameFrom,
  toolStepLabel: () => toolStepLabel
});
module.exports = __toCommonJS(names_exports);
var MCP_TOOL_PREFIX = "mcp__";
var MCP_NAME_SEPARATOR = "__";
var MCP_SERVER_NAME_MAX = 24;
var MCP_TOOL_NAME_MAX = 64;
var APP_MCP_SERVER_NAME = "ieumoffice-editor";
var RESERVED_MCP_SERVER_NAMES = /* @__PURE__ */ new Set([APP_MCP_SERVER_NAME]);
var NAME_CHARS = /^[A-Za-z0-9_-]+$/;
var FULL_TOOL_NAME = new RegExp(`^[A-Za-z0-9_-]{1,${MCP_TOOL_NAME_MAX}}$`);
var isReserved = (name) => RESERVED_MCP_SERVER_NAMES.has(name.toLowerCase());
function shapeProblem(name) {
  if (name.length === 0) return "empty";
  if (!NAME_CHARS.test(name)) return "bad-char";
  if (name.includes(MCP_NAME_SEPARATOR)) return "double-underscore";
  if (name.startsWith("_") || name.endsWith("_")) return "edge-underscore";
  return null;
}
function serverNameProblem(name, maxLength = MCP_SERVER_NAME_MAX) {
  if (name.length === 0) return "empty";
  if (name.length > maxLength) return "too-long";
  return shapeProblem(name) ?? (isReserved(name) ? "reserved" : null);
}
function isValidServerName(name, maxLength = MCP_SERVER_NAME_MAX) {
  return serverNameProblem(name, maxLength) === null;
}
var trimEdges = (s) => s.replace(/^[-_]+|[-_]+$/g, "");
function suggestServerName(raw, taken = [], maxLength = MCP_SERVER_NAME_MAX) {
  const cleaned = trimEdges(raw.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/_{2,}/g, "_"));
  const base = /[A-Za-z0-9]/.test(cleaned) ? cleaned : "server";
  const used = new Set([...taken].map((t) => t.toLowerCase()));
  const fits = (suffix) => {
    const name = trimEdges(base.slice(0, Math.max(1, maxLength - suffix.length))) + suffix;
    return isValidServerName(name, maxLength) && !used.has(name.toLowerCase()) ? name : null;
  };
  for (let n = 1; n <= used.size + 2; n++) {
    const name = fits(n === 1 ? "" : `-${n}`);
    if (name) return name;
  }
  return trimEdges(base.slice(0, maxLength)) || "server";
}
var PLAIN_HOST_LABELS = /* @__PURE__ */ new Set(["www", "mcp", "api", "app", "server", "servers"]);
var PACKAGE_RUNNERS = /* @__PURE__ */ new Set([
  "npx",
  "bunx",
  "uvx",
  "pnpx",
  "pipx",
  "uv",
  "pnpm",
  "npm",
  "bun",
  "yarn"
]);
var RUNNER_WORDS = /* @__PURE__ */ new Set(["run", "dlx", "exec", "x", "tool"]);
var baseName = (path) => path.split(/[\\/]/).pop() ?? "";
function nameFromUrl(raw) {
  let host;
  try {
    host = new URL(raw.trim()).hostname;
  } catch {
    return "";
  }
  if (host === "" || host.includes(":") || /^[\d.]+$/.test(host) || host === "localhost") return "";
  const labels = host.split(".").filter(Boolean);
  const telling = labels.slice(0, Math.max(1, labels.length - 1));
  return telling.find((label) => !PLAIN_HOST_LABELS.has(label.toLowerCase())) ?? "";
}
function nameFromCommand(command, args) {
  const program = baseName(command.trim()).replace(/\.(exe|cmd|bat)$/i, "").toLowerCase();
  const words = args.filter((a) => a.trim() !== "" && !a.startsWith("-"));
  const target = PACKAGE_RUNNERS.has(program) ? words.find((w) => !RUNNER_WORDS.has(w)) ?? "" : /^(node|python3?|deno)$/.test(program) ? words[0] ?? "" : program;
  if (!target) return "";
  let word = target.startsWith("@") ? target.split("/")[1] ?? "" : target;
  word = baseName(word).replace(/@[^@]*$/, "").replace(/\.[A-Za-z0-9]+$/, "");
  return word;
}
function suggestServerNameFrom(raw, taken = [], source = {}) {
  const cleaned = raw.replace(/[^A-Za-z0-9_-]+/g, "-");
  if (/[A-Za-z0-9]/.test(cleaned)) return suggestServerName(raw, taken);
  const derived = (source.url ? nameFromUrl(source.url) : "") || (source.command ? nameFromCommand(source.command, source.args ?? []) : "");
  return suggestServerName(derived || "server", taken);
}
function toolStepLabel(name) {
  const parsed = parseMcpToolName(name);
  if (parsed) return `${parsed.server} \xB7 ${parsed.tool}`;
  return name.replace(/[_-]+/g, " ");
}
function sanitizeToolName(raw) {
  return raw.replace(/[^A-Za-z0-9_-]/g, "_");
}
function mcpToolName(server, tool) {
  return `${MCP_TOOL_PREFIX}${server}${MCP_NAME_SEPARATOR}${tool}`;
}
function isMcpToolName(name) {
  return name.startsWith(MCP_TOOL_PREFIX);
}
function mapServerToolNames(server, tools) {
  const badServer = shapeProblem(server) !== null;
  const entries = tools.map((original) => {
    const tool = sanitizeToolName(original);
    return { original, name: mcpToolName(server, tool), changed: tool !== original };
  });
  const counts = /* @__PURE__ */ new Map();
  for (const e of entries) counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
  return entries.map((e) => ({
    ...e,
    problem: badServer ? "server-name" : e.original.length === 0 ? "empty" : e.name.length > MCP_TOOL_NAME_MAX ? "too-long" : (counts.get(e.name) ?? 0) > 1 ? "collision" : null
  }));
}
function parseMcpToolName(name) {
  if (!isMcpToolName(name) || !FULL_TOOL_NAME.test(name)) return null;
  const rest = name.slice(MCP_TOOL_PREFIX.length);
  const cut = rest.indexOf(MCP_NAME_SEPARATOR);
  if (cut < 0) return null;
  const server = rest.slice(0, cut);
  const tool = rest.slice(cut + MCP_NAME_SEPARATOR.length);
  if (tool.length === 0 || shapeProblem(server) !== null) return null;
  return { server, tool };
}
function parseMcpToolNameIn(name, servers) {
  const parsed = parseMcpToolName(name);
  if (!parsed) return null;
  const known = servers instanceof Set ? servers : new Set(servers);
  return known.has(parsed.server) ? parsed : null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  APP_MCP_SERVER_NAME,
  MCP_NAME_SEPARATOR,
  MCP_SERVER_NAME_MAX,
  MCP_TOOL_NAME_MAX,
  MCP_TOOL_PREFIX,
  RESERVED_MCP_SERVER_NAMES,
  isMcpToolName,
  isValidServerName,
  mapServerToolNames,
  mcpToolName,
  parseMcpToolName,
  parseMcpToolNameIn,
  sanitizeToolName,
  serverNameProblem,
  suggestServerName,
  suggestServerNameFrom,
  toolStepLabel
});
