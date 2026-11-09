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

// ../../../pblsketch/ieumoffice/packages/agent-core/src/user-skill-names.ts
var user_skill_names_exports = {};
__export(user_skill_names_exports, {
  RESERVED_USER_SKILL_NAMES: () => RESERVED_USER_SKILL_NAMES
});
module.exports = __toCommonJS(user_skill_names_exports);
var RESERVED_USER_SKILL_NAMES = /* @__PURE__ */ new Set(["genoffice", "ieumoffice"]);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RESERVED_USER_SKILL_NAMES
});
