import { c as createFlowDiagram, s as styles_default } from "./flowDiagram-HODETNUW-D-A0KhkR.js";
import { _ as __name } from "./mermaid.core-DWXyrGY1.js";
import "./chunk-5VM5RSS4-BsaVBkrG.js";
import "./chunk-XXDRQBXY-Bed5XMTR.js";
import "./chunk-POPQ4Y6H-CgjCzBnT.js";
import "./chunk-F27PBJKO-rv2tlTxF.js";
import "./channel-BCOxRvJL.js";
import "./index-CQcCeh3X.js";
var getStyles = /* @__PURE__ */ __name((options) => `${styles_default(options)}
  .swimlane.cluster rect {
    stroke: ${options.clusterBorder} !important;
  }
  [data-look="neo"].cluster rect {
    filter: none;
  }
`, "getStyles");
var styles_default2 = getStyles;
var diagram = createFlowDiagram({ defaultLayout: "swimlane", styles: styles_default2 });
export {
  diagram
};
