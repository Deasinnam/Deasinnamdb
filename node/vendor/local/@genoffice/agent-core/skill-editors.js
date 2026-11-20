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

// ../ieum/packages/agent-core/src/skill-editors.ts
var skill_editors_exports = {};
__export(skill_editors_exports, {
  SKILL_EDITORS: () => SKILL_EDITORS,
  isSkillEditorId: () => isSkillEditorId,
  skillEditorScope: () => skillEditorScope,
  skillEditorsChoiceOf: () => skillEditorsChoiceOf,
  skillEditorsOf: () => skillEditorsOf,
  skillStandsBack: () => skillStandsBack,
  skillUsedIn: () => skillUsedIn
});
module.exports = __toCommonJS(skill_editors_exports);
var SKILL_EDITORS = [
  "docs",
  "sheets",
  "slides",
  "hwp",
  "pdf",
  "markdown",
  "html",
  "mindmap",
  "epub",
  "diagram"
];
function isSkillEditorId(value) {
  return typeof value === "string" && SKILL_EDITORS.includes(value);
}
function skillEditorsOf(value) {
  const parts = typeof value === "string" ? value.split(/[\s,]+/) : Array.isArray(value) ? value : [];
  const known = new Set(parts.filter(isSkillEditorId));
  const editors = SKILL_EDITORS.filter((id) => known.has(id));
  return editors.length > 0 && editors.length < SKILL_EDITORS.length ? editors : void 0;
}
function skillEditorsChoiceOf(value) {
  if (value === "all") return "all";
  if (!Array.isArray(value)) return void 0;
  return skillEditorsOf(value) ?? "all";
}
function skillEditorScope(choice, fromFile) {
  if (choice === "all") return void 0;
  return skillEditorsOf(choice ?? fromFile);
}
function skillUsedIn(scope, editor) {
  if (!editor) return true;
  const editors = skillEditorsOf(scope);
  return !editors || editors.includes(editor);
}
function skillStandsBack(skill, all, editor) {
  const by = skill.shadowedBy;
  if (typeof by !== "string" || !by) return false;
  const winner = all.find(
    (other) => !!other && typeof other === "object" && other.id === by
  );
  return !winner || skillUsedIn(skillEditorsOf(winner.editors), editor);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SKILL_EDITORS,
  isSkillEditorId,
  skillEditorScope,
  skillEditorsChoiceOf,
  skillEditorsOf,
  skillStandsBack,
  skillUsedIn
});
