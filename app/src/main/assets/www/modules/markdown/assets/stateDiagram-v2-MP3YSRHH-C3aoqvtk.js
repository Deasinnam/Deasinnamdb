import { s as styles_default, b as stateRenderer_v3_unified_default, a as stateDiagram_default, S as StateDB } from "./chunk-IMKFNOWR-Cymxa0cs.js";
import { _ as __name } from "./mermaid.core-DWXyrGY1.js";
import "./chunk-XXDRQBXY-Bed5XMTR.js";
import "./chunk-POPQ4Y6H-CgjCzBnT.js";
import "./chunk-F27PBJKO-rv2tlTxF.js";
import "./index-CQcCeh3X.js";
var diagram = {
  parser: stateDiagram_default,
  get db() {
    return new StateDB(2);
  },
  renderer: stateRenderer_v3_unified_default,
  styles: styles_default,
  init: /* @__PURE__ */ __name((cnf) => {
    if (!cnf.state) {
      cnf.state = {};
    }
    cnf.state.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
  }, "init")
};
export {
  diagram
};
