/* 자동 생성: tools/build_web.py — 원본은 IeumOffice modules/markdown/preload/index.js */
(function (require, module, exports) {
"use strict";
const electron = require("electron");
const DRIVE_AI_CHANNELS = {
  enabled: "drive:ai-enabled",
  search: "drive:ai-search",
  read: "drive:ai-read",
  /** Drive is connected (attaching from Drive does not need the AI switch) */
  connected: "drive:connected",
  /** opens the attach-from-Drive window; answers with the downloaded paths */
  pickAttachments: "drive:pick-attachments",
  /** main → every window: the Drive state changed (payload: the shell's DriveUiState) */
  changed: "drive:state-changed"
};
function driveConnectedOf(state) {
  const s = state && typeof state === "object" ? state : {};
  return s.state === "connected";
}
function driveAiOn(state) {
  const s = state && typeof state === "object" ? state : {};
  return s.state === "connected" && s.aiAccess === true && s.trainingAck === true;
}
function driveAiBridge() {
  return {
    driveAiEnabled: async () => await electron.ipcRenderer.invoke(DRIVE_AI_CHANNELS.enabled).catch(() => false) === true,
    driveSearch: (query, limit) => electron.ipcRenderer.invoke(DRIVE_AI_CHANNELS.search, { q: String(query), limit: Number(limit) }),
    driveRead: (fileId, offset) => electron.ipcRenderer.invoke(DRIVE_AI_CHANNELS.read, { id: String(fileId), offset: Number(offset) }),
    onDriveAiChanged(listener) {
      const handler = (_event, state) => listener(driveAiOn(state));
      electron.ipcRenderer.on(DRIVE_AI_CHANNELS.changed, handler);
      return () => {
        electron.ipcRenderer.removeListener(DRIVE_AI_CHANNELS.changed, handler);
      };
    },
    driveConnected: async () => await electron.ipcRenderer.invoke(DRIVE_AI_CHANNELS.connected).catch(() => false) === true,
    onDriveConnectedChanged(listener) {
      const handler = (_event, state) => listener(driveConnectedOf(state));
      electron.ipcRenderer.on(DRIVE_AI_CHANNELS.changed, handler);
      return () => {
        electron.ipcRenderer.removeListener(DRIVE_AI_CHANNELS.changed, handler);
      };
    },
    drivePickAttachments: () => electron.ipcRenderer.invoke(DRIVE_AI_CHANNELS.pickAttachments).catch(() => ({
      ok: false,
      reason: "cancelled"
    }))
  };
}
const MCP_TOOLS_CHANNELS = {
  list: "mcp-tools:list",
  call: "mcp-tools:call",
  cancel: "mcp-tools:cancel",
  retry: "mcp-tools:retry",
  openSettings: "mcp-tools:open-settings",
  /** main → every window: the list changed (no payload; ask `list` again) */
  changed: "mcp-tools:changed"
};
const noAnswer = { ok: false, error: "The MCP connection did not answer." };
function mcpToolsBridge() {
  return {
    list: () => electron.ipcRenderer.invoke(MCP_TOOLS_CHANNELS.list).catch(() => []),
    call: (server, tool, input, callId) => electron.ipcRenderer.invoke(MCP_TOOLS_CHANNELS.call, {
      server: String(server),
      tool: String(tool),
      input,
      callId: String(callId)
    }).catch(() => noAnswer),
    cancel: async (callId) => {
      await electron.ipcRenderer.invoke(MCP_TOOLS_CHANNELS.cancel, String(callId)).catch(() => void 0);
    },
    onChanged(listener) {
      const handler = () => listener();
      electron.ipcRenderer.on(MCP_TOOLS_CHANNELS.changed, handler);
      return () => {
        electron.ipcRenderer.removeListener(MCP_TOOLS_CHANNELS.changed, handler);
      };
    },
    retry: (server) => electron.ipcRenderer.invoke(MCP_TOOLS_CHANNELS.retry, String(server)).catch(() => ({ ok: false })),
    openSettings: (server) => electron.ipcRenderer.invoke(MCP_TOOLS_CHANNELS.openSettings, String(server)).catch(() => ({ ok: false }))
  };
}
const OUTBOUND_CHANNELS = {
  /** whether "Let AI use internet tools" is on (absent in ai-settings.json = on) */
  internetTools: "ai:internet-tools",
  /** asks the person in a dialog over the calling window; answers true only on "Allow" */
  confirmAddresses: "ai:confirm-addresses",
  /** main → every window: ai-settings.json was saved (the editors' existing broadcast) */
  settingsChanged: "ai:settings-changed"
};
function outboundBridge() {
  const enabled = async () => await electron.ipcRenderer.invoke(OUTBOUND_CHANNELS.internetTools).catch(() => false) === true;
  return {
    internetToolsEnabled: enabled,
    onInternetToolsChanged(listener) {
      const handler = () => void enabled().then(listener);
      electron.ipcRenderer.on(OUTBOUND_CHANNELS.settingsChanged, handler);
      return () => {
        electron.ipcRenderer.removeListener(OUTBOUND_CHANNELS.settingsChanged, handler);
      };
    },
    confirmAddresses: async (tool, addresses) => await electron.ipcRenderer.invoke(OUTBOUND_CHANNELS.confirmAddresses, {
      tool: String(tool),
      addresses: Array.isArray(addresses) ? addresses.map(String) : []
    }).catch(() => false) === true
  };
}
const USER_SKILLS_BRIDGE_KEY = "aiOfficeUserSkills";
const USER_SKILLS_CHANNELS = {
  list: "skills:list",
  read: "skills:read",
  setState: "skills:set-state",
  hideBuiltin: "skills:hide-builtin",
  unhideBuiltins: "skills:unhide-builtins",
  remove: "skills:remove",
  copyToMine: "skills:copy-to-mine",
  suggestName: "skills:suggest-name",
  checkName: "skills:check-name",
  save: "skills:save",
  saveFromCard: "skills:save-from-card",
  importFolder: "skills:import-folder",
  importZip: "skills:import-zip",
  importGitHub: "skills:import-github",
  cancelImport: "skills:cancel-import",
  install: "skills:install",
  checkUpdate: "skills:check-update",
  applyUpdate: "skills:apply-update",
  cancelUpdate: "skills:cancel-update",
  exportInfo: "skills:export-info",
  exportZip: "skills:export-zip",
  openFolder: "skills:open-folder",
  aiRead: "skills:ai-read",
  aiReadFile: "skills:ai-read-file",
  openSettings: "skills:open-settings",
  agentNotice: "skills:agent-notice",
  agentNoticeSeen: "skills:agent-notice-seen",
  /** a template skill's copy in a new tab of its editor, with the request handed over (spec 5.7) */
  openTemplate: "skills:open-template",
  /** the current document's copy in a template preview tab (spec 5.6) */
  openPreview: "skills:open-preview",
  /** the preview tab: the original document's bytes, for "save the original as is" */
  previewOriginal: "skills:preview-original",
  /** the preview tab: its card was saved or cancelled */
  finishPreview: "skills:finish-preview",
  /** a new tab's AI panel takes its skill hand-off, once */
  takeHandoff: "skills:take-handoff",
  /** bring a tab this flow opened to the front */
  focusTab: "skills:focus-tab",
  /** main → the original tab: its template preview ended (saved, or not) */
  previewEnded: "skills:preview-ended",
  /** main → every window: the list or a state changed; read the list again */
  changed: "skills:changed"
};
function isRecord$1(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function text(value, max = 1e6) {
  return typeof value === "string" && value.length <= max ? value : void 0;
}
function skillIdOf(value) {
  const id = text(value, 512);
  return id && id.includes(":") ? id : void 0;
}
function skillViewsOf(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item) => isRecord$1(item) && typeof item.id === "string" && typeof item.name === "string"
  );
}
function skillsResultOf(value) {
  if (isRecord$1(value) && typeof value.ok === "boolean") return value;
  return { ok: false, reason: "failed" };
}
function previewEndedOf(value) {
  if (!isRecord$1(value)) return void 0;
  const previewId = text(value.previewId, 128);
  const outcome = value.outcome === "saved" || value.outcome === "unsaved" ? value.outcome : null;
  if (!previewId || !outcome) return void 0;
  const skillId = value.skillId === void 0 ? void 0 : skillIdOf(value.skillId);
  const title = value.title === void 0 ? void 0 : text(value.title, 1e4);
  return {
    previewId,
    outcome,
    ...skillId ? { skillId } : {},
    ...title !== void 0 ? { title } : {}
  };
}
const unavailable = { ok: false, reason: "failed" };
async function result(channel, ...args) {
  try {
    return skillsResultOf(await electron.ipcRenderer.invoke(channel, ...args));
  } catch {
    return unavailable;
  }
}
function userSkillsBridge() {
  return {
    list: async () => skillViewsOf(await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.list).catch(() => [])),
    read: (id) => result(USER_SKILLS_CHANNELS.read, String(id)),
    setState: (id, patch) => result(USER_SKILLS_CHANNELS.setState, String(id), patch),
    hideBuiltin: (id) => result(USER_SKILLS_CHANNELS.hideBuiltin, String(id)),
    unhideBuiltins: (names) => result(USER_SKILLS_CHANNELS.unhideBuiltins, names),
    remove: (id) => result(USER_SKILLS_CHANNELS.remove, String(id)),
    copyToMine: (id, overwrite) => result(USER_SKILLS_CHANNELS.copyToMine, String(id), overwrite === true),
    suggestName: async (title) => {
      const name = await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.suggestName, String(title)).catch(() => "");
      return typeof name === "string" ? name : "";
    },
    checkName: async (name, forId) => {
      const answer = await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.checkName, String(name), forId).catch(() => void 0);
      const value = answer && typeof answer === "object" ? answer : {};
      if (value.ok === true) return { ok: true };
      return {
        ok: false,
        problem: typeof value.problem === "string" ? value.problem : "empty"
      };
    },
    save: (input) => result(USER_SKILLS_CHANNELS.save, input),
    saveFromCard: (input) => result(USER_SKILLS_CHANNELS.saveFromCard, input),
    importFolder: () => result(USER_SKILLS_CHANNELS.importFolder),
    importZip: () => result(USER_SKILLS_CHANNELS.importZip),
    importGitHub: (address) => result(USER_SKILLS_CHANNELS.importGitHub, String(address)),
    cancelImport: async (token) => {
      await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.cancelImport, token).catch(() => void 0);
    },
    install: (token, selected, onCollision) => result(USER_SKILLS_CHANNELS.install, { token, selected, onCollision: onCollision ?? {} }),
    checkUpdate: async (id) => {
      try {
        const answer = await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.checkUpdate, String(id));
        return skillsResultOf(answer);
      } catch {
        return unavailable;
      }
    },
    applyUpdate: (token) => result(USER_SKILLS_CHANNELS.applyUpdate, String(token)),
    cancelUpdate: async (token) => {
      await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.cancelUpdate, String(token)).catch(() => void 0);
    },
    exportInfo: (id) => result(USER_SKILLS_CHANNELS.exportInfo, String(id)),
    exportZip: (id) => result(USER_SKILLS_CHANNELS.exportZip, String(id)),
    openFolder: (id) => result(USER_SKILLS_CHANNELS.openFolder, String(id)),
    aiRead: (id) => result(USER_SKILLS_CHANNELS.aiRead, String(id)),
    aiReadFile: (id, rel) => result(USER_SKILLS_CHANNELS.aiReadFile, String(id), String(rel)),
    openSettings: async () => {
      await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.openSettings).catch(() => void 0);
    },
    agentNotice: async () => await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.agentNotice).catch(() => false) === true,
    markAgentNoticeSeen: async () => {
      await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.agentNoticeSeen).catch(() => void 0);
    },
    openTemplate: (input) => result(USER_SKILLS_CHANNELS.openTemplate, input),
    openPreview: (input) => result(USER_SKILLS_CHANNELS.openPreview, input),
    previewOriginal: (previewId) => result(USER_SKILLS_CHANNELS.previewOriginal, String(previewId)),
    finishPreview: (previewId, outcome, saved) => result(USER_SKILLS_CHANNELS.finishPreview, {
      previewId: String(previewId),
      outcome,
      ...saved ? { skillId: saved.skillId, title: saved.title } : {}
    }),
    takeHandoff: async (target) => {
      const answer = await electron.ipcRenderer.invoke(USER_SKILLS_CHANNELS.takeHandoff, String(target)).catch(() => null);
      return answer && typeof answer === "object" ? answer : null;
    },
    focusTab: (tabId) => result(USER_SKILLS_CHANNELS.focusTab, String(tabId)),
    onPreviewEnded(listener) {
      const handler = (_event, raw) => {
        const ended = previewEndedOf(raw);
        if (ended) listener(ended);
      };
      electron.ipcRenderer.on(USER_SKILLS_CHANNELS.previewEnded, handler);
      return () => {
        electron.ipcRenderer.removeListener(USER_SKILLS_CHANNELS.previewEnded, handler);
      };
    },
    onChanged(listener) {
      const handler = () => listener();
      electron.ipcRenderer.on(USER_SKILLS_CHANNELS.changed, handler);
      return () => {
        electron.ipcRenderer.removeListener(USER_SKILLS_CHANNELS.changed, handler);
      };
    }
  };
}
const PROJECT_FOLDER_EVENTS = {
  onChatMessageAppended: "projectFolder:event:chatMessageAppended",
  onOpenChat: "projectFolder:event:openChat",
  onOpenProjectScreen: "projectFolder:event:openProjectScreen",
  onProjectChanged: "projectFolder:event:projectChanged"
};
const PROJECT_FOLDER_CHANNELS = {
  listProjects: "projectFolder:listProjects",
  addFolder: "projectFolder:addFolder",
  getDefaultParentFolder: "projectFolder:getDefaultParentFolder",
  createProject: "projectFolder:createProject",
  removeFromList: "projectFolder:removeFromList",
  setPinned: "projectFolder:setPinned",
  renameProject: "projectFolder:renameProject",
  relocateProject: "projectFolder:relocateProject",
  openInFileManager: "projectFolder:openInFileManager",
  retryUnwritable: "projectFolder:retryUnwritable",
  getSelection: "projectFolder:getSelection",
  setSelection: "projectFolder:setSelection",
  adoptFolderHint: "projectFolder:adoptFolderHint",
  readContext: "projectFolder:readContext",
  openScope: "projectFolder:openScope",
  closeScope: "projectFolder:closeScope",
  listFiles: "projectFolder:listFiles",
  search: "projectFolder:search",
  read: "projectFolder:read",
  remember: "projectFolder:remember",
  editMemory: "projectFolder:editMemory",
  saveMemory: "projectFolder:saveMemory",
  applyMemoryConsolidation: "projectFolder:applyMemoryConsolidation",
  undoMemoryConsolidation: "projectFolder:undoMemoryConsolidation",
  listChats: "projectFolder:listChats",
  newChat: "projectFolder:newChat",
  openChat: "projectFolder:openChat",
  appendChat: "projectFolder:appendChat",
  renameChat: "projectFolder:renameChat",
  deleteChat: "projectFolder:deleteChat",
  attachDocument: "projectFolder:attachDocument",
  openDocumentChat: "projectFolder:openDocumentChat",
  getProjectDetail: "projectFolder:getProjectDetail",
  getSettings: "projectFolder:getSettings",
  setSettings: "projectFolder:setSettings",
  decideTrust: "projectFolder:decideTrust",
  saveInstructions: "projectFolder:saveInstructions",
  addIgnore: "projectFolder:addIgnore",
  removeIgnore: "projectFolder:removeIgnore",
  listIgnoredFiles: "projectFolder:listIgnoredFiles",
  openProjectScreen: "projectFolder:openProjectScreen"
};
const PROJECT_FOLDER_LISTEN_CHANNEL = "projectFolder:listen";
const PROJECT_FOLDER_BRIDGE_KEY = "projectFolderApi";
function projectFolderBridge(ipc) {
  const listeners = /* @__PURE__ */ new Map();
  const tell = (method, listening) => {
    const message = { method, listening };
    ipc.send(PROJECT_FOLDER_LISTEN_CHANNEL, message);
  };
  const subscribe = (method, listener) => {
    const channel = PROJECT_FOLDER_EVENTS[method];
    const wrapped = (_event, payload) => listener(payload);
    ipc.on(channel, wrapped);
    const count = (listeners.get(method) ?? 0) + 1;
    listeners.set(method, count);
    if (count === 1) tell(method, true);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      ipc.removeListener(channel, wrapped);
      const left = Math.max(0, (listeners.get(method) ?? 1) - 1);
      listeners.set(method, left);
      if (left === 0) tell(method, false);
    };
  };
  const requests = {};
  for (const name of Object.keys(PROJECT_FOLDER_CHANNELS)) {
    const channel = PROJECT_FOLDER_CHANNELS[name];
    requests[name] = (args) => args === void 0 ? ipc.invoke(channel) : ipc.invoke(channel, args);
  }
  return {
    ...requests,
    onChatMessageAppended: (listener) => subscribe("onChatMessageAppended", listener),
    onOpenChat: (listener) => subscribe("onOpenChat", listener),
    onOpenProjectScreen: (listener) => subscribe("onOpenProjectScreen", listener),
    onProjectChanged: (listener) => subscribe("onProjectChanged", listener)
  };
}
const AI_EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max"];
function aiEffortOf(value) {
  if (typeof value !== "string") return void 0;
  const effort = value.trim();
  return AI_EFFORTS.includes(effort) ? effort : void 0;
}
function aiEffortsOf(value) {
  if (!Array.isArray(value)) return void 0;
  const known = new Set(value.map(aiEffortOf).filter((effort) => effort !== void 0));
  const efforts = AI_EFFORTS.filter((effort) => known.has(effort));
  return efforts.length > 0 ? efforts : void 0;
}
const DEEPSEEK_V41_FLASH = "deep-seek-v4.1-flash";
const AI_PROVIDERS = [
  {
    id: "claude-code",
    label: "Claude Code",
    // Aliases the CLI resolves to the subscription's current models, so no
    // dated id goes stale here. Empty leaves the choice to the CLI.
    models: ["opus", "sonnet", "haiku"],
    defaultModel: "",
    keyPlaceholder: ""
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    // Read at runtime from the plan's model catalog (/v1/models). Empty runs
    // on the first model the catalog lists.
    models: [],
    defaultModel: "",
    keyPlaceholder: ""
  },
  {
    id: "codex",
    label: "Codex CLI",
    // Populated at runtime from codex app-server model/list. Empty also lets
    // the CLI select the account's current default without a stale hardcode.
    models: [],
    defaultModel: "",
    keyPlaceholder: "",
    needsCliPath: true
  },
  {
    id: "anthropic",
    label: "Claude",
    // current lineup per platform.claude.com models overview (2026-10-27):
    // Sonnet 5.5 (2026-09-28) replaces Sonnet 5 as the speed/intelligence
    // default; it accepts only tool_choice auto/none, which is all this
    // adapter sends. Fable needs data retention enabled on the org, otherwise
    // the API answers model_not_available; every other id is served to any key.
    models: [
      "claude-opus-5-5",
      "claude-sonnet-5-5",
      "claude-fable-5-1",
      "claude-haiku-5-5",
      "claude-sonnet-5",
      "claude-opus-5",
      "claude-fable-5",
      "claude-sonnet-4-6"
    ],
    defaultModel: "claude-sonnet-5-5",
    keyPlaceholder: "sk-ant-api03-..."
  },
  {
    id: "gemini",
    label: "Gemini",
    // per ai.google.dev/gemini-api/docs/models (2026-10-29). 4 Argon (GA
    // 2026-10-13) is the flagship reasoning model and 3.1 Pro is still
    // preview-only; neither has a free tier, so 3.8 Flash, the stable Flash
    // Google recommends, stays the default. 3.7 Flash was deprecated on
    // 2026-10-08 (see RETIRED_MODELS). Models released after this list come
    // from the key's live list (key-models.ts).
    models: [
      "gemini-3.8-flash",
      "gemini-4-argon",
      "gemini-3.1-pro-preview",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite"
    ],
    defaultModel: "gemini-3.8-flash",
    keyPlaceholder: "AIza..."
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    // GET api.deepseek.com/v1/models serves `deepseek-v4-pro` and
    // `deepseek-flash` (verified 2026-09-21); the latter is V4.1 Flash with
    // native vision. We list it under a versioned name; the adapter maps it
    // back to the unversioned wire id (see DEEPSEEK_WIRE_IDS in registry.ts).
    models: ["deepseek-v4-pro", DEEPSEEK_V41_FLASH],
    defaultModel: "deepseek-v4-pro",
    keyPlaceholder: "sk-..."
  },
  {
    id: "openai",
    label: "OpenAI",
    // Tier names: astra/sol = flagship, terra = balanced cost/intelligence,
    // luna = high-volume. GPT-5.4+ and GPT-6 run on the Responses API (see
    // modelUsesResponsesApi), which is the only route where they call tools
    // with reasoning on (live-verified 2026-10-27). 6.1 Terra (2026-10-26,
    // $1/$5) is the default: cheaper than 5.6 Terra, and the 5.6 tiers have
    // left OpenAI's models page.
    models: [
      "gpt-6.1-terra",
      "gpt-6.1-sol",
      "gpt-6-astra",
      "gpt-6-sol",
      "gpt-6-luna",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5.4-mini"
    ],
    defaultModel: "gpt-6.1-terra",
    keyPlaceholder: "sk-..."
  },
  {
    id: "kimi",
    label: "Kimi",
    // K3.1 Pro opens the K3.1 series: 3T-class parameters, native vision, 1M
    // context (2026-10). K3 stays listed while the vendor still sells it.
    models: ["kimi-k3.1-pro", "kimi-k3"],
    defaultModel: "kimi-k3.1-pro",
    keyPlaceholder: "sk-..."
  },
  {
    id: "glm",
    label: "GLM",
    // bigmodel.cn text-model lineup (2026-08); 5.3 and 5.2 share a base model.
    // 5.3-Flash is the first multimodal GLM-5 and the documented successor to
    // 5-Turbo, which Z.ai delisted from its price card in late August and
    // Tencent CloudBase retires on 2026-10-30 with migration advice pointing
    // here. 5.2 is marked deprecated on third-party catalogues but is still
    // sold pay-as-you-go, so it stays listed.
    models: ["glm-5.3", "glm-5.3-flash", "glm-5.2"],
    defaultModel: "glm-5.3",
    keyPlaceholder: "xxxxxxxx.xxxxxxxx"
  },
  {
    id: "qwen",
    label: "Qwen",
    // Versioned DashScope ids: the bare qwen-max alias still points at a
    // Qwen2.5-era snapshot, so name the 3.x tiers explicitly (2026-08).
    // 3.8 ships as Max and Flash only — there is no 3.8-Plus tier, and
    // 3.7-Flash is still the listed high-volume option.
    models: ["qwen3.8-max", "qwen3.8-flash", "qwen3.7-plus", "qwen3.7-flash"],
    defaultModel: "qwen3.8-max",
    keyPlaceholder: "sk-..."
  },
  {
    id: "doubao",
    label: "Doubao",
    // Ark ids are dashed and date-pinned; it also accepts ep-... inference
    // endpoint ids in the model field
    models: ["doubao-seed-2-1-pro-260628", "doubao-seed-2-1-turbo-260628"],
    defaultModel: "doubao-seed-2-1-pro-260628",
    keyPlaceholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  },
  {
    id: "mimo",
    label: "MiMo",
    // Xiaomi's open-weight omni-modal pair (released 2026-09-22): Pro is the
    // trillion-parameter flagship, Flash the efficiency/cost tier. Both take
    // text, image, video and audio input; a -pro-ultraspeed tier also exists but
    // is the same weights behind a faster serving path, so it is not a
    // separate model to pick here.
    models: ["mimo-v2.6-pro", "mimo-v2.6-flash"],
    defaultModel: "mimo-v2.6-pro",
    keyPlaceholder: "sk-..."
  },
  {
    id: "hunyuan",
    label: "Hunyuan",
    // Tencent's TokenHub chat models (docs 1823/132252, read 2026-09-30).
    // hy4-preview is the 1M-context flagship and has deep thinking on by
    // default; hy3 is the 256k balanced tier. Every other provider here
    // defaults to its flagship, so this does too.
    models: ["hy4-preview", "hy3"],
    defaultModel: "hy4-preview",
    keyPlaceholder: "sk-..."
  },
  {
    id: "ling",
    label: "Ling",
    // Ids as listed by developer.ant-ling.com (Ring = reasoning line); only
    // Ling-3.0-flash-VL takes images, see modelLacksVision()
    models: [
      "Ling-3.0-flash",
      "Ling-3.0-flash-VL",
      "Ling-3.0-tiny",
      "Ling-2.6-1T",
      "Ring-2.6-1T",
      "Ling-2.6-flash"
    ],
    defaultModel: "Ling-3.0-flash",
    keyPlaceholder: "API Key"
  },
  {
    id: "spark",
    label: "Spark",
    // iFlytek MaaS: lower-case model id and ak- key prefix are the vendor's own spelling
    models: ["spark-x2.5"],
    defaultModel: "spark-x2.5",
    keyPlaceholder: "ak-..."
  },
  {
    id: "longcat",
    label: "LongCat",
    // 2.5-Preview is the multimodal tier; 2.0 stays default so a fresh config avoids a preview
    models: ["LongCat-2.5-Preview", "LongCat-2.0"],
    defaultModel: "LongCat-2.0",
    keyPlaceholder: "API Key"
  },
  {
    id: "minimax",
    label: "MiniMax",
    // M3 is the current agentic/tool-use model; M2.5 moved to the legacy tier
    models: ["MiniMax-M3", "MiniMax-M2.7"],
    defaultModel: "MiniMax-M3",
    keyPlaceholder: "eyJ..."
  },
  {
    id: "xai",
    label: "Grok",
    // 4.7 (2026-09-21) is 2.1T / 500K context at 4.6's price. 4.6 stays the
    // default so a fresh config does not silently move to a model released
    // this month; say the word and the default follows the flagship like every
    // other provider here.
    models: ["grok-4.7", "grok-4.6", "grok-4.5"],
    defaultModel: "grok-4.6",
    keyPlaceholder: "xai-..."
  },
  {
    id: "mistral",
    label: "Mistral",
    // `-latest` aliases track the newest GA snapshot. Medium 3.5 is Mistral's
    // agentic tier; codestral is a code-completion/FIM model, not an agent driver.
    models: ["mistral-medium-latest", "mistral-large-latest", "mistral-small-latest"],
    defaultModel: "mistral-medium-latest",
    keyPlaceholder: "API Key"
  },
  {
    id: "upstage",
    label: "Solar",
    // GET api.upstage.ai/v1/models (2026-10-21); every id here answered a
    // tool call. Pro4 is the flagship, Mini4 the fast, cheap tier.
    models: ["solar-pro4", "solar-pro3", "solar-mini4"],
    defaultModel: "solar-pro4",
    keyPlaceholder: "up_..."
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    // vendor-prefixed slugs exactly as openrouter.ai/api/v1/models lists them —
    // there is no `openai/gpt-5.6` alias there, only the per-tier ids
    models: [
      "openrouter/auto",
      "anthropic/claude-opus-5.5",
      "anthropic/claude-sonnet-5",
      "openai/gpt-6-astra",
      "openai/gpt-6-sol",
      "openai/gpt-6-luna",
      "openai/gpt-5.6-sol",
      "moonshotai/kimi-k3.1-pro",
      "moonshotai/kimi-k3"
    ],
    defaultModel: "openrouter/auto",
    keyPlaceholder: "sk-or-..."
  },
  {
    id: "requesty",
    label: "Requesty",
    // Managed policy ids exactly as GET router.requesty.ai/v1/models/managed
    // lists them (2026-09-24): short stable names Requesty routes across
    // providers, used as-is in the model field. The full vendor-prefixed
    // catalog (GET /v1/models, e.g. openai/gpt-4o-mini) works too when typed
    // in. Ids ending "@eu" route through EU providers only.
    models: [
      "claude-sonnet-5",
      "claude-opus-5-5",
      "claude-opus-4-8",
      "gpt-6-sol",
      "gpt-6-luna",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gemini-3.7-flash",
      "deepseek-v4-pro",
      "kimi-k3"
    ],
    defaultModel: "claude-sonnet-5",
    keyPlaceholder: "sk-..."
  },
  {
    id: "opper",
    label: "Opper",
    // Pool ids exactly as GET api.opper.ai/v3/models lists them (2026-09-14):
    // a bare name is an Opper pool, and Opper picks the serving provider and
    // region per request. The vendor-prefixed catalog (anthropic/claude-sonnet-4-6,
    // azure/gpt-5, …) pins one provider and works as-is when typed in.
    // Full list at opper.ai/models.
    models: [
      "claude-sonnet-4-6",
      "claude-opus-5",
      "gpt-5.5",
      "gpt-5.4-mini",
      "gemini-3.8-flash",
      "deepseek-v4-pro",
      "kimi-k3",
      "mistral-large-2512"
    ],
    defaultModel: "claude-sonnet-4-6",
    keyPlaceholder: "API Key"
  },
  {
    id: "cheaperinference",
    label: "Cheaper Inference",
    // Bare model ids as GET api.cheaperinference.com/v1/models lists them (the
    // chat rows, type "text"): no vendor prefix, one key for every lab. Other
    // ids from that list work as-is when typed in. Full list at
    // cheaperinference.com/#models.
    models: ["gpt-5.4-mini", "gpt-5.4", "claude-sonnet-5", "gemini-3.1-pro"],
    defaultModel: "gpt-5.4-mini",
    keyPlaceholder: "ci_live_..."
  },
  {
    id: "atlascloud",
    label: "Atlas Cloud",
    // Lab-namespaced ids exactly as GET api.atlascloud.ai/v1/models lists them
    // (2026-10-08, public endpoint, no key needed); the rest of the 117-model
    // catalog works as-is when typed in. Chat, temperature and — for the
    // multimodal ids — data-URI image input are live-verified. The text-only
    // ids (deepseek-v4-*, glm-5.3, both MiniMax) are listed in
    // modelLacksVision(); Atlas Cloud serves MiniMax M3 text-only even though
    // MiniMax's own API takes images.
    models: [
      "deepseek-ai/deepseek-v4-pro",
      "deepseek-ai/deepseek-v4-flash",
      "moonshotai/kimi-k3",
      "moonshotai/kimi-k2.6",
      "zai-org/glm-5.3",
      "zai-org/glm-5.3-flash",
      "qwen/qwen3.8-max",
      "qwen/qwen3.5-flash",
      "minimaxai/minimax-m3",
      "minimaxai/minimax-m2.5"
    ],
    defaultModel: "deepseek-ai/deepseek-v4-pro",
    keyPlaceholder: "apikey-..."
  },
  {
    id: "runcrate",
    label: "Runcrate",
    // Lab-namespaced ids exactly as GET api.runcrate.ai/v1/models lists them
    // (2026-10-25, public endpoint, no key needed); the rest of the catalog
    // works as-is when typed in. Chat, streaming and tool calls are
    // live-verified; image support follows each id's catalog input_modalities,
    // and the text-only ids (GLM-5.3, Qwen3.8 Flash, gpt-oss 120B) are covered
    // by modelLacksVision().
    models: [
      "deepseek-ai/DeepSeek-V4.1-Flash",
      "deepseek-ai/DeepSeek-V4.1-Flash-1017",
      "zai-org/GLM-5.3",
      "zai-org/GLM-5.3-Flash",
      "moonshotai/Kimi-K2.6",
      "Qwen/Qwen3.8-Flash",
      "openai/gpt-oss-120b"
    ],
    defaultModel: "deepseek-ai/DeepSeek-V4.1-Flash",
    keyPlaceholder: "rc_live_..."
  },
  {
    id: "cloudgpu",
    label: "CloudGPU",
    // Bare model ids exactly as GET https://cloudgpu.app/v1/models lists them
    // (2026-10-29, public endpoint, no key needed); the rest of the catalog
    // works as-is when typed in. Docs: https://cloudgpu.app/api/docs.
    // The catalog does not report input modalities, so vision follows the
    // existing modelLacksVision() rules.
    models: ["deepseek-v4.1-flash", "deepseek-v4-pro", "glm-5.3-flash", "kimi-k2.6", "minimax-m3"],
    defaultModel: "deepseek-v4.1-flash",
    keyPlaceholder: "sk-..."
  },
  {
    id: "opencode-zen",
    label: "OpenCode Zen",
    // Pay-as-you-go gateway (opencode.ai/docs/zen); ids exactly as GET
    // /zen/v1/models lists them (2026-10-09). GPT-5.x/6, Grok and Muse Spark
    // are served only through the Responses API, which has no protocol here,
    // so they stay out until one exists.
    models: [
      "claude-sonnet-5",
      "claude-opus-5-5",
      "claude-opus-5",
      "claude-fable-5-1",
      "claude-haiku-5-5",
      "gemini-3.7-flash",
      "gemini-3.1-pro",
      "kimi-k3",
      "kimi-k2.7-code",
      "deepseek-v4-pro",
      "deepseek-v4-flash",
      "glm-5.2",
      "minimax-m3",
      "qwen3.6-plus"
    ],
    defaultModel: "claude-sonnet-5",
    keyPlaceholder: "API Key"
  },
  {
    id: "opencode-go",
    label: "OpenCode Go",
    // $10/month subscription to open-weight coding models (opencode.ai/docs/go),
    // same key as Zen; ids exactly as GET /zen/go/v1/models lists them
    // (re-read 2026-09-30). GPT-5.6 Luna, Grok and Muse Spark are
    // Responses-only and left out for the same reason as above.
    models: [
      "kimi-k2.7-code",
      "kimi-k3",
      "kimi-k2.6",
      "glm-5.3",
      "glm-5.3-flash",
      "glm-5.2",
      "deepseek-v4-pro",
      "deepseek-v4-flash",
      "deepseek-v4.1-flash",
      "qwen3.8-max",
      "qwen3.8-flash",
      "minimax-m3",
      "minimax-m2.7",
      "mimo-v2.5-pro",
      "mimo-v2.6-pro",
      "mimo-v2.6-flash",
      "longcat-2.0",
      "longcat-2.5-preview-free",
      "hy4-preview",
      "hy3"
    ],
    defaultModel: "kimi-k2.7-code",
    keyPlaceholder: "API Key"
  },
  {
    id: "custom",
    label: "Custom",
    models: [],
    defaultModel: "",
    keyPlaceholder: "API Key",
    needsBaseUrl: true
  }
];
(() => {
  const g = globalThis;
  if (g.navigator?.platform) return /mac/i.test(g.navigator.platform);
  return g.process?.platform === "darwin";
})();
const AI_SUBSCRIPTION_LOGIN_FAILURE_REASONS = [
  "timeout",
  "denied",
  "no-plan",
  "network"
];
const AI_SUBSCRIPTION_LOGIN_FAILURE_STEPS = [
  /** no browser took the sign-in page */
  "browser",
  /** the waiting server could not start */
  "loopback",
  /** the browser came back with an `error` */
  "callback-error",
  /** the browser came back without a code or a client id */
  "callback-incomplete",
  /** the token endpoint refused the code (400, 401, 403) */
  "token-refused",
  /** the token endpoint answered another failing status */
  "token-http",
  /** the token endpoint could not be reached */
  "token-unreachable",
  /** the token answer lacked the access or refresh token, or was no JSON */
  "token-unreadable",
  /** the token answer had no ID token */
  "id-token-missing",
  /** OpenAI's signing keys could not be read */
  "signing-keys",
  /** the ID token failed a check: signature, issuer, audience, expiry or nonce */
  "id-token-invalid",
  /** the token answer named no scope at all */
  "scope-missing",
  /** the token answer named scopes, without the plan's */
  "plan-scope-missing"
];
const SUBSCRIPTION_IPC_CHANNELS = {
  /** () → SubscriptionStatusMap: the last known statuses, `checking` until a first check answered */
  statuses: "ai:subscription-statuses",
  /** (SubscriptionRecheckRequest?) → SubscriptionStatusMap: look again, answer when done */
  recheck: "ai:subscription-recheck",
  /** (SubscriptionProviderRequest) → SubscriptionLaunchResult: open the CLI's own login */
  login: "ai:subscription-login",
  /** (SubscriptionProviderRequest) → SubscriptionLaunchResult: run the vendor install command */
  install: "ai:subscription-install",
  /** (SubscriptionProviderRequest) → SubscriptionLaunchResult: run the official update in a terminal window */
  update: "ai:subscription-update",
  /** (SubscriptionProviderRequest) → SubscriptionLaunchResult: end a login the app started, then look again */
  cancelLogin: "ai:subscription-cancel-login",
  /** (SubscriptionMeteredRequest) → SubscriptionMeteredResult: "use anyway" for a metered login */
  metered: "ai:subscription-metered",
  /** event, payload SubscriptionStatusMap: the statuses changed */
  changed: "ai:subscription-changed"
};
function checkingSubscriptionStatus(provider) {
  return { provider, state: "checking", meteredAccepted: false };
}
function subscriptionStatusErrorKind(status) {
  if (status.state !== "error") return null;
  const text2 = status.error ?? "";
  if (text2.startsWith("needs-update:")) return "needs-update";
  if (text2.startsWith("timeout:")) return "timeout";
  return "failed";
}
const SUBSCRIPTION_PROGRAM_PATH_MAX_LENGTH = 32767;
function subscriptionProgramPathOf(value) {
  if (typeof value !== "string") return void 0;
  if (!value || value.length > SUBSCRIPTION_PROGRAM_PATH_MAX_LENGTH) return void 0;
  if (new RegExp("\\p{Cc}", "u").test(value)) return void 0;
  return /^(?:[A-Za-z]:[\\/]|\\\\|\/)/.test(value) ? value : void 0;
}
const SUBSCRIPTION_STATES = [
  "checking",
  "not-installed",
  "signed-out",
  "ready",
  "metered",
  "error",
  "off"
];
const SUBSCRIPTION_LAUNCH_FAILURES = [
  "not-installed",
  "unsupported",
  "failed",
  "invalid"
];
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const SUBSCRIPTION_ACCOUNT_MAX_LENGTH = 254;
const ACCOUNT_PATTERN = /^[\p{L}\p{N}._%+-]{1,64}@[\p{L}\p{N}-]{1,63}(?:\.[\p{L}\p{N}-]{1,63})+$/u;
function subscriptionAccountOf(value) {
  if (typeof value !== "string") return void 0;
  const account = value.trim();
  return account.length <= SUBSCRIPTION_ACCOUNT_MAX_LENGTH && ACCOUNT_PATTERN.test(account) ? account : void 0;
}
const SUBSCRIPTION_MODELS_MAX = 50;
const SUBSCRIPTION_MODEL_LABEL_MAX = 80;
const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:[\]-]{0,127}$/;
function modelIdOf(value) {
  if (typeof value !== "string") return void 0;
  const id = value.trim();
  return MODEL_ID_PATTERN.test(id) ? id : void 0;
}
function modelLabelOf(value) {
  if (typeof value !== "string") return "";
  return value.replace(new RegExp("\\p{Cc}+", "gu"), "").replace(/\s+/g, " ").trim().slice(0, SUBSCRIPTION_MODEL_LABEL_MAX);
}
function subscriptionModelsOf(value) {
  if (!Array.isArray(value)) return void 0;
  const models = [];
  const seen = /* @__PURE__ */ new Set();
  for (const entry of value) {
    if (models.length >= SUBSCRIPTION_MODELS_MAX) break;
    if (!isRecord(entry)) continue;
    const isDefaultEntry = entry.id === "";
    const id = isDefaultEntry ? "" : modelIdOf(entry.id);
    if (id === void 0 || seen.has(id)) continue;
    const resolved = modelIdOf(entry.resolved);
    if (isDefaultEntry && !resolved) continue;
    seen.add(id);
    const efforts = aiEffortsOf(entry.efforts);
    const defaultEffort = aiEffortOf(entry.defaultEffort);
    models.push({
      id,
      label: modelLabelOf(entry.label) || id || resolved,
      ...resolved ? { resolved } : {},
      ...isDefaultEntry || entry.isDefault === true ? { isDefault: true } : {},
      ...efforts ? { efforts } : {},
      ...efforts && defaultEffort && efforts.includes(defaultEffort) ? { defaultEffort } : {}
    });
  }
  return models.length > 0 ? models : void 0;
}
const SUBSCRIPTION_LOGIN_ERROR_CODE = /^[a-z0-9_.-]{1,64}$/;
function subscriptionLoginFailureOf(value) {
  if (!isRecord(value)) return void 0;
  const reason = AI_SUBSCRIPTION_LOGIN_FAILURE_REASONS.find((known) => known === value.reason);
  if (!reason) return void 0;
  const failure = { reason };
  const step = AI_SUBSCRIPTION_LOGIN_FAILURE_STEPS.find((known) => known === value.step);
  if (step) failure.step = step;
  const status = value.httpStatus;
  if (typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599) {
    failure.httpStatus = status;
  }
  const code = value.oauthError;
  if (typeof code === "string" && SUBSCRIPTION_LOGIN_ERROR_CODE.test(code)) {
    failure.oauthError = code;
  }
  return failure;
}
function subscriptionStatusMapOf(result2) {
  const raw = isRecord(result2) ? result2 : {};
  const statusOf = (provider) => {
    const status = raw[provider];
    if (isRecord(result2) && status === void 0 && provider === "chatgpt") {
      return { provider, state: "signed-out", meteredAccepted: false };
    }
    if (!isRecord(status) || !SUBSCRIPTION_STATES.includes(status.state)) {
      return checkingSubscriptionStatus(provider);
    }
    const read = {
      ...status,
      provider,
      meteredAccepted: status.meteredAccepted === true
    };
    const signedIn = read.state === "ready" || read.state === "metered";
    const account = signedIn ? subscriptionAccountOf(status.account) : void 0;
    const models = signedIn ? subscriptionModelsOf(status.models) : void 0;
    const programPath = subscriptionStatusErrorKind(read) === "needs-update" ? subscriptionProgramPathOf(status.programPath) : void 0;
    delete read.account;
    delete read.models;
    delete read.signingIn;
    delete read.loginUnfinished;
    delete read.loginFailure;
    delete read.programPath;
    if (account) read.account = account;
    if (models) read.models = models;
    if (programPath) read.programPath = programPath;
    if ((status.signingIn === "browser" || status.signingIn === "window") && read.state !== "off") {
      read.signingIn = status.signingIn;
    }
    if (read.state === "signed-out" && status.loginUnfinished === true) {
      read.loginUnfinished = true;
      const failure = subscriptionLoginFailureOf(status.loginFailure);
      if (failure) read.loginFailure = failure;
    }
    return read;
  };
  return {
    "claude-code": statusOf("claude-code"),
    chatgpt: statusOf("chatgpt"),
    codex: statusOf("codex")
  };
}
function subscriptionLaunchResultOf(result2) {
  const raw = isRecord(result2) ? result2 : {};
  if (raw.ok === true) return { ok: true };
  const reason = SUBSCRIPTION_LAUNCH_FAILURES.includes(raw.reason) ? raw.reason : "failed";
  return {
    ok: false,
    reason,
    ...typeof raw.installUrl === "string" ? { installUrl: raw.installUrl } : {}
  };
}
function metaOf(id) {
  return AI_PROVIDERS.find((m) => m.id === id);
}
({
  "claude-code": {
    meta: metaOf("claude-code")
  },
  chatgpt: {
    meta: metaOf("chatgpt")
  },
  codex: {
    meta: metaOf("codex")
  },
  anthropic: {
    meta: metaOf("anthropic")
  },
  gemini: {
    meta: metaOf("gemini")
  },
  deepseek: {
    meta: metaOf("deepseek")
  },
  openai: {
    meta: metaOf("openai")
  },
  kimi: {
    meta: metaOf("kimi")
  },
  glm: {
    meta: metaOf("glm")
  },
  qwen: {
    meta: metaOf("qwen")
  },
  doubao: {
    meta: metaOf("doubao")
  },
  mimo: {
    meta: metaOf("mimo")
  },
  hunyuan: {
    meta: metaOf("hunyuan")
  },
  ling: {
    meta: metaOf("ling")
  },
  spark: {
    meta: metaOf("spark")
  },
  longcat: {
    meta: metaOf("longcat")
  },
  minimax: {
    meta: metaOf("minimax")
  },
  xai: {
    meta: metaOf("xai")
  },
  mistral: {
    meta: metaOf("mistral")
  },
  upstage: {
    meta: metaOf("upstage")
  },
  openrouter: {
    meta: metaOf("openrouter")
  },
  requesty: {
    meta: metaOf("requesty")
  },
  opper: {
    meta: metaOf("opper")
  },
  cheaperinference: {
    meta: metaOf("cheaperinference")
  },
  atlascloud: {
    meta: metaOf("atlascloud")
  },
  runcrate: {
    meta: metaOf("runcrate")
  },
  cloudgpu: {
    meta: metaOf("cloudgpu")
  },
  "opencode-zen": {
    meta: metaOf("opencode-zen")
  },
  "opencode-go": {
    meta: metaOf("opencode-go")
  },
  custom: {
    meta: metaOf("custom")
  }
});
const DROP_OPEN_CHANNEL = "app:open-dropped-files";
const OPENABLE_DOC_RE = /\.(docx|odt|xlsx|xlsm|xls|csv|tsv|pptx|pdf|md|markdown|html|htm|xmind|mm|hwp|hwpx|epub|drawio|dio|vsdx|drawio\.svg|drawio\.png)$/i;
const KNOWN_UNSUPPORTED_DOC_RE = /\.(doc|rtf|ppt|pps|odp|ods|xlsb|pages|key|numbers)$/i;
const MAX_DROPPED_FILES = 20;
function tryResolvePath(file, getPathForFile) {
  try {
    return getPathForFile(file).trim();
  } catch {
    return "";
  }
}
const MAX_RESOLVED_DROP_PATHS = 100;
const MAX_DROP_PATH_CHARS = 4096;
function droppableFilePaths(ev, getPathForFile) {
  const transfer = ev.dataTransfer;
  if (!transfer || !transfer.types.includes("Files")) return null;
  const paths = [];
  for (const file of Array.from(transfer.files)) {
    if (paths.length >= MAX_RESOLVED_DROP_PATHS) break;
    const path = tryResolvePath(file, getPathForFile);
    if (!path || path.length > MAX_DROP_PATH_CHARS) continue;
    paths.push(path);
  }
  return paths;
}
const INSTALLED = /* @__PURE__ */ Symbol.for("genoffice.drop-open-installed");
function installDropOpenBridge() {
  const holder = globalThis;
  if (typeof window === "undefined" || holder[INSTALLED]) return;
  holder[INSTALLED] = true;
  window.addEventListener("dragover", (ev) => {
    if (ev.defaultPrevented) return;
    if (!ev.dataTransfer?.types.includes("Files")) return;
    ev.preventDefault();
  });
  window.addEventListener("drop", (ev) => {
    if (ev.defaultPrevented) return;
    const paths = droppableFilePaths(ev, (file) => electron.webUtils.getPathForFile(file));
    if (!paths) return;
    const payload = paths.filter((p) => OPENABLE_DOC_RE.test(p) || KNOWN_UNSUPPORTED_DOC_RE.test(p));
    ev.preventDefault();
    if (payload.length === 0) return;
    electron.ipcRenderer.send(DROP_OPEN_CHANNEL, payload.slice(0, MAX_DROPPED_FILES));
  });
}
const SPLIT_PANE_CHANNELS = {
  /** invoke: SplitPaneRole | null */
  getRole: "app:get-split-role",
  /** push: SplitPaneRole | null */
  roleChanged: "app:split-role-changed",
  /** invoke/send: ask the shell to focus this pane */
  requestFocus: "tabs:focus-pane",
  /** send: fallback focus ping from a view that gained focus */
  reportFocus: "app:view-focused"
};
function splitPaneBridge(ipcRenderer) {
  return {
    getRole: async () => await ipcRenderer.invoke(SPLIT_PANE_CHANNELS.getRole).catch(() => null) ?? null,
    onRoleChanged(handler) {
      const listener = (_event, role) => handler(role);
      ipcRenderer.on(SPLIT_PANE_CHANNELS.roleChanged, listener);
      return () => {
        ipcRenderer.removeListener(SPLIT_PANE_CHANNELS.roleChanged, listener);
      };
    },
    requestFocus() {
      ipcRenderer.send(SPLIT_PANE_CHANNELS.requestFocus);
    },
    reportFocus() {
      ipcRenderer.send(SPLIT_PANE_CHANNELS.reportFocus);
    }
  };
}
const MARKDOWN_CHANNELS = {
  consumePending: "markdown:consume-pending",
  /** invoke → the text a new tab starts with (8.6 "convert without AI"), once; null otherwise */
  seedTake: "markdown:seed-take",
  /** invoke → the texts "Add to note" queued for this note tab (reading-assist 4.9), once */
  noteAppendTake: "markdown:note-append-take",
  /** main → renderer: texts are waiting for this note tab */
  noteAppendReady: "markdown:note-append-ready",
  readFile: "markdown:read-file",
  resolveWikiLinks: "markdown:resolve-wiki-links",
  /** remember the `#fragment` of a wiki link, so the note opens on its heading */
  rememberWikiFragment: "markdown:remember-wiki-fragment",
  /** take the fragment remembered for a path, '' when there is none */
  takeWikiFragment: "markdown:take-wiki-fragment",
  /** list the vault's notes for the `[[` suggester, breadth-first from the root */
  listWikiNotes: "markdown:list-wiki-notes",
  /** create the note an unresolved `[[wiki link]]` names (never overwrites) */
  createWikiNote: "markdown:create-wiki-note",
  /** what `[[Note#` offers: the target note's headings and block ids */
  wikiHeads: "markdown:wiki-heads",
  /** notes whose links land on the given path (the backlinks panel) */
  wikiBacklinks: "markdown:wiki-backlinks",
  wikiTags: "markdown:wiki-tags",
  /** the vault's link graph (nodes + resolved edges, the graph view) */
  wikiGraph: "markdown:wiki-graph",
  /** invoke → the recovery copy's text to open instead of the file (or as the untitled document), else null */
  recoveryOpen: "markdown:recovery-open",
  /** invoke(text | null) → keep the text as this document's recovery copy */
  recoveryWrite: "markdown:recovery-write",
  /** main → renderer: send the recovery copy now (the OS is ending the session) */
  recoveryFlushRequest: "markdown:recovery-flush-request",
  save: "markdown:save",
  saveRequest: "markdown:save-request",
  saveRequestAck: "markdown:save-request-ack",
  readTextRequest: "markdown:read-text-request",
  readTextResult: "markdown:read-text-result",
  dirtyChanged: "markdown:dirty-changed",
  closeSaveRequest: "markdown:close-save-request",
  closeSaveResult: "markdown:close-save-result",
  fileRenamed: "markdown:file-renamed",
  pickImage: "markdown:pick-image",
  saveImage: "markdown:save-image",
  readImage: "markdown:read-image",
  saveImageAs: "markdown:save-image-as",
  getImageHost: "markdown:get-image-host",
  setImageHost: "markdown:set-image-host",
  getMarkdownTheme: "markdown:get-theme",
  setMarkdownTheme: "markdown:set-theme",
  uploadImage: "markdown:upload-image",
  viewImage: "genoffice:view-image",
  exportRequest: "markdown:export-request",
  exportDocx: "markdown:export-docx",
  exportOdt: "markdown:export-odt",
  exportPdf: "markdown:export-pdf",
  printPreview: "markdown:print-preview",
  printDocument: "markdown:print-document",
  prepareImageExport: "markdown:prepare-image-export",
  writeExportImage: "markdown:write-export-image",
  finishImageExport: "markdown:finish-image-export",
  consumeHeadlessExport: "markdown:consume-headless-export",
  headlessExportDone: "markdown:headless-export-done",
  printRequest: "markdown:print-request",
  aiGenerateImage: "markdown:ai-generate-image",
  getLanguage: "app:get-language",
  languageChanged: "app:language-changed",
  getTheme: "app:get-theme",
  themeChanged: "app:theme-changed",
  getDocumentTheme: "app:get-document-theme",
  documentThemeChanged: "app:document-theme-changed",
  getAutoSaveDefault: "app:get-auto-save-default",
  autoSaveDefaultChanged: "app:auto-save-default-changed",
  getAiPanelPrefs: "app:get-ai-panel-prefs",
  aiPanelPrefsChanged: "app:ai-panel-prefs-changed"
};
const AI_CHANNELS = {
  getSettings: "ai:get-settings",
  setSettings: "ai:set-settings",
  settingsChanged: "ai:settings-changed",
  openModelSettings: "ai:open-model-settings",
  stream: "ai:stream",
  streamChunk: "ai:stream-chunk",
  streamCancel: "ai:stream-cancel",
  webSearch: "ai:web-search",
  readUrl: "ai:read-url",
  imageSearch: "ai:image-search",
  fetchImage: "ai:fetch-image"
};
const AI_TOOL_CAPABILITIES_CHANNEL = "ai:tool-capabilities";
const MARKDOWN_THEME_IDS = [
  "default",
  "notion-light",
  "notion-dark",
  "drake-dark",
  "blubook",
  "nord",
  "newsprint"
];
function normalizeMarkdownTheme(value) {
  return MARKDOWN_THEME_IDS.includes(String(value)) ? String(value) : "default";
}
const SUBSCRIPTION_INSTALL_HELP_CHANNEL = "home:open-subscription-install-help";
const SUBSCRIPTION_CONNECT_HELP_CHANNEL = "home:open-connect-help";
const aiSubscription = {
  async statuses() {
    return subscriptionStatusMapOf(await electron.ipcRenderer.invoke(SUBSCRIPTION_IPC_CHANNELS.statuses));
  },
  async recheck(providers) {
    return subscriptionStatusMapOf(
      await electron.ipcRenderer.invoke(
        SUBSCRIPTION_IPC_CHANNELS.recheck,
        providers ? { providers } : void 0
      )
    );
  },
  async login(provider, mode) {
    return subscriptionLaunchResultOf(
      await electron.ipcRenderer.invoke(
        SUBSCRIPTION_IPC_CHANNELS.login,
        mode ? { provider, mode } : { provider }
      )
    );
  },
  async install(provider) {
    return subscriptionLaunchResultOf(
      await electron.ipcRenderer.invoke(SUBSCRIPTION_IPC_CHANNELS.install, { provider })
    );
  },
  async update(provider) {
    return subscriptionLaunchResultOf(
      await electron.ipcRenderer.invoke(SUBSCRIPTION_IPC_CHANNELS.update, { provider })
    );
  },
  async cancelLogin(provider) {
    return subscriptionLaunchResultOf(
      await electron.ipcRenderer.invoke(SUBSCRIPTION_IPC_CHANNELS.cancelLogin, { provider })
    );
  },
  async setMeteredAccepted(provider, accepted) {
    const result2 = await electron.ipcRenderer.invoke(SUBSCRIPTION_IPC_CHANNELS.metered, {
      provider,
      accepted
    });
    const raw = result2 ?? {};
    return { ok: raw.ok === true, statuses: subscriptionStatusMapOf(raw.statuses) };
  },
  onChanged(handler) {
    const listener = (_e, statuses) => handler(subscriptionStatusMapOf(statuses));
    electron.ipcRenderer.on(SUBSCRIPTION_IPC_CHANNELS.changed, listener);
    return () => electron.ipcRenderer.removeListener(SUBSCRIPTION_IPC_CHANNELS.changed, listener);
  },
  async openInstallHelp(provider) {
    await electron.ipcRenderer.invoke(SUBSCRIPTION_INSTALL_HELP_CHANNEL, provider);
  },
  async openConnectHelp(path) {
    await electron.ipcRenderer.invoke(SUBSCRIPTION_CONNECT_HELP_CHANNEL, path);
  }
};
const api = {
  consumePending: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.consumePending),
  takeSeed: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.seedTake),
  takeNoteAppend: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.noteAppendTake).catch(() => []),
  onNoteAppendReady: (handler) => {
    const listener = () => handler();
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.noteAppendReady, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.noteAppendReady, listener);
  },
  openSourcePath: (path) => electron.ipcRenderer.invoke("home:open-path", path),
  resolveWikiLinks: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.resolveWikiLinks, request),
  rememberWikiFragment: (path, fragment) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.rememberWikiFragment, path, fragment),
  takeWikiFragment: (path) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.takeWikiFragment, path),
  listWikiNotes: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.listWikiNotes),
  createWikiNote: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.createWikiNote, request),
  wikiHeads: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.wikiHeads, request),
  wikiBacklinks: (path) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.wikiBacklinks, path),
  wikiTags: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.wikiTags),
  wikiGraph: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.wikiGraph),
  consumeHeadlessExport: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.consumeHeadlessExport),
  headlessExportDone: (result2) => electron.ipcRenderer.send(MARKDOWN_CHANNELS.headlessExportDone, result2),
  readFile: (path) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.readFile, path),
  recoveryOpen: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.recoveryOpen),
  writeRecoveryCopy: (text2) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.recoveryWrite, text2),
  onRecoveryFlushRequest: (handler) => {
    const listener = () => handler();
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.recoveryFlushRequest, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.recoveryFlushRequest, listener);
  },
  save: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.save, request),
  setDirty: (dirty) => electron.ipcRenderer.send(MARKDOWN_CHANNELS.dirtyChanged, dirty),
  onSaveRequest: (handler) => {
    const listener = (_e, mode) => handler(mode);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.saveRequest, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.saveRequest, listener);
  },
  onCloseSaveRequest: (handler) => {
    const listener = () => handler();
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.closeSaveRequest, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.closeSaveRequest, listener);
  },
  sendCloseSaveResult: (ok) => electron.ipcRenderer.send(MARKDOWN_CHANNELS.closeSaveResult, ok),
  sendSaveRequestAck: (ok) => electron.ipcRenderer.send(MARKDOWN_CHANNELS.saveRequestAck, ok),
  onReadTextRequest: (handler) => {
    const listener = () => handler();
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.readTextRequest, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.readTextRequest, listener);
  },
  sendReadTextResult: (result2) => electron.ipcRenderer.send(MARKDOWN_CHANNELS.readTextResult, result2),
  onFileRenamed: (handler) => {
    const listener = (_e, newPath) => handler(newPath);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.fileRenamed, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.fileRenamed, listener);
  },
  pickImage: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.pickImage),
  saveImage: (data) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.saveImage, data),
  readImage: (src) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.readImage, src),
  saveImageAs: (src) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.saveImageAs, src),
  getMarkdownTheme: async () => {
    const result2 = await electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.getMarkdownTheme);
    return normalizeMarkdownTheme(result2);
  },
  setMarkdownTheme: async (theme) => {
    const result2 = await electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.setMarkdownTheme, theme);
    return normalizeMarkdownTheme(result2);
  },
  getImageHost: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.getImageHost),
  setImageHost: (config) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.setImageHost, config),
  uploadImage: (data) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.uploadImage, data),
  onViewImage: (handler) => {
    const listener = (_e, src) => handler(src);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.viewImage, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.viewImage, listener);
  },
  onExportRequest: (handler) => {
    const listener = (_e, format) => handler(format);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.exportRequest, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.exportRequest, listener);
  },
  onPrintRequest: (handler) => {
    const listener = () => handler();
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.printRequest, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.printRequest, listener);
  },
  exportDocx: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.exportDocx, request),
  exportOdt: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.exportOdt, request),
  exportPdf: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.exportPdf, request),
  renderPrintPreview: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.printPreview, request),
  printDocument: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.printDocument, request),
  prepareImageExport: (request) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.prepareImageExport, request),
  writeExportImage: (id, page, base64) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.writeExportImage, id, page, base64),
  finishImageExport: (id, success) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.finishImageExport, id, success),
  getLanguage: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.getLanguage),
  onLanguageChanged: (handler) => {
    const listener = (_e, lang) => handler(lang);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.languageChanged, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.languageChanged, listener);
  },
  getTheme: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.getTheme),
  onThemeChanged: (handler) => {
    const listener = (_e, theme) => handler(theme);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.themeChanged, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.themeChanged, listener);
  },
  getDocumentTheme: async () => {
    const result2 = await electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.getDocumentTheme);
    return result2 === "dark" || result2 === "light" ? result2 : "follow";
  },
  onDocumentThemeChanged: (handler) => {
    const listener = (_e, theme) => handler(theme);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.documentThemeChanged, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.documentThemeChanged, listener);
  },
  getAutoSaveDefault: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.getAutoSaveDefault),
  onAutoSaveDefaultChanged: (handler) => {
    const listener = (_e, value) => handler(value);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.autoSaveDefaultChanged, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.autoSaveDefaultChanged, listener);
  },
  getAiPanelPrefs: () => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.getAiPanelPrefs),
  setAiPanelPrefs: (patch) => electron.ipcRenderer.invoke("app:set-ai-panel-prefs", patch),
  onAiPanelPrefsChanged: (handler) => {
    const listener = (_event, prefs) => handler(prefs);
    electron.ipcRenderer.on(MARKDOWN_CHANNELS.aiPanelPrefsChanged, listener);
    return () => electron.ipcRenderer.removeListener(MARKDOWN_CHANNELS.aiPanelPrefsChanged, listener);
  },
  onChromePressed: (handler) => {
    const listener = () => handler();
    electron.ipcRenderer.on("app:chrome-pressed", listener);
    return () => electron.ipcRenderer.removeListener("app:chrome-pressed", listener);
  },
  getAiSettings: () => electron.ipcRenderer.invoke(AI_CHANNELS.getSettings),
  setAiSettings: (settings) => electron.ipcRenderer.invoke(AI_CHANNELS.setSettings, settings),
  onAiSettingsChanged: (handler) => {
    const listener = () => handler();
    electron.ipcRenderer.on(AI_CHANNELS.settingsChanged, listener);
    return () => electron.ipcRenderer.removeListener(AI_CHANNELS.settingsChanged, listener);
  },
  openAiModelSettings: () => electron.ipcRenderer.invoke(AI_CHANNELS.openModelSettings),
  aiSubscription,
  aiToolCapabilities: () => electron.ipcRenderer.invoke(AI_TOOL_CAPABILITIES_CHANNEL),
  aiStream: (request) => electron.ipcRenderer.invoke(AI_CHANNELS.stream, request),
  aiStreamCancel: (requestId) => electron.ipcRenderer.invoke(AI_CHANNELS.streamCancel, requestId),
  onAiStream: (handler) => {
    const listener = (_e, chunk) => handler(chunk);
    electron.ipcRenderer.on(AI_CHANNELS.streamChunk, listener);
    return () => electron.ipcRenderer.removeListener(AI_CHANNELS.streamChunk, listener);
  },
  webSearch: (query, maxResults) => electron.ipcRenderer.invoke(AI_CHANNELS.webSearch, query, maxResults),
  readUrl: (url, offset) => electron.ipcRenderer.invoke(AI_CHANNELS.readUrl, url, offset),
  imageSearch: (query, maxResults) => electron.ipcRenderer.invoke(AI_CHANNELS.imageSearch, query, maxResults),
  fetchImage: (url) => electron.ipcRenderer.invoke(AI_CHANNELS.fetchImage, url),
  aiGenerateImage: (op) => electron.ipcRenderer.invoke(MARKDOWN_CHANNELS.aiGenerateImage, op)
};
const projectApi = {
  resolveChat: (args) => electron.ipcRenderer.invoke("project:resolveChat", args),
  appendChat: (args) => electron.ipcRenderer.invoke("project:appendChat", args),
  loadChat: (args) => electron.ipcRenderer.invoke("project:loadChat", args),
  rebindChat: (args) => electron.ipcRenderer.invoke("project:rebindChat", args)
};
electron.contextBridge.exposeInMainWorld("markdownApi", api);
electron.contextBridge.exposeInMainWorld("aiOfficeSplit", splitPaneBridge(electron.ipcRenderer));
electron.contextBridge.exposeInMainWorld("aiOfficeDriveAi", driveAiBridge());
electron.contextBridge.exposeInMainWorld("aiOfficeOutbound", outboundBridge());
electron.contextBridge.exposeInMainWorld("aiOfficeMcpTools", mcpToolsBridge());
electron.contextBridge.exposeInMainWorld(USER_SKILLS_BRIDGE_KEY, userSkillsBridge());
electron.contextBridge.exposeInMainWorld("projectApi", projectApi);
electron.contextBridge.exposeInMainWorld(PROJECT_FOLDER_BRIDGE_KEY, projectFolderBridge(electron.ipcRenderer));
installDropOpenBridge();

})(window.__ieumRequire, { exports: {} }, {});
