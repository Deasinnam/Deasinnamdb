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

// ../ieum/packages/agent-core/src/mind-map.ts
var mind_map_exports = {};
__export(mind_map_exports, {
  MIND_MAP_EXPORT_COLORS: () => MIND_MAP_EXPORT_COLORS,
  MIND_MAP_LIMITS: () => MIND_MAP_LIMITS,
  MIND_MAP_METRICS: () => MIND_MAP_METRICS,
  MIND_MAP_TOOL: () => MIND_MAP_TOOL,
  countMindMapNodes: () => countMindMapNodes,
  labelUnits: () => labelUnits,
  layoutMindMap: () => layoutMindMap,
  mindMapToMermaid: () => mindMapToMermaid,
  parseMindMapTree: () => parseMindMapTree,
  wrapLabel: () => wrapLabel
});
module.exports = __toCommonJS(mind_map_exports);
var MIND_MAP_LIMITS = {
  maxNodes: 120,
  maxDepth: 5,
  maxLabelChars: 60,
  maxFocusChars: 80
};
var MIND_MAP_METRICS = {
  nodeWidth: 170,
  nodeHeight: 34,
  depthGap: 40,
  siblingGap: 14,
  padding: 10
};
var MIND_MAP_EXPORT_COLORS = {
  background: "#ffffff",
  nodeFill: "#ffffff",
  nodeStroke: "#d0d3d8",
  rootFill: "#e8663f",
  rootStroke: "#d4552f",
  nodeText: "#242424",
  rootText: "#ffffff",
  edge: "#c8ccd2",
  badgeFill: "#0f7fff",
  badgeText: "#ffffff",
  toggleFill: "#f0f2f5",
  toggleStroke: "#d0d3d8",
  toggleText: "#606366"
};
var nodeSchema = (depth) => ({
  type: "object",
  properties: {
    label: {
      type: "string",
      description: "short node label (2-8 words) in the document's language, taken from its headings or key phrases"
    },
    block: {
      type: "integer",
      description: "0-based block index this node summarizes (from the current block list); omit when the node spans several blocks"
    },
    children: depth > 0 ? {
      type: "array",
      description: "sub-topics; 2-5 per node reads best",
      items: nodeSchema(depth - 1)
    } : {
      type: "array",
      description: "sub-topics; 2-5 per node reads best",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "short node label (2-8 words) in the document's language"
          }
        },
        required: ["label"]
      }
    }
  },
  required: ["label"]
});
var MIND_MAP_TOOL = {
  name: "generate_mindmap",
  description: "Render an interactive mind map of the document (or of one focused aspect) as a diagram card in the chat. Call it when the user asks for a mind map / knowledge structure / overview diagram of the document or a topic. Pass the entire tree in this single call: the root is the document title or the focus topic, its children are the main sections, and so on. Labels must be short phrases in the document's own language and wording \u2014 never invent topics the document does not cover. Cite the block index each node summarizes in `block` so the user can jump to the passage. This tool does not modify the document; after it returns, reply with one short sentence.",
  inputSchema: {
    type: "object",
    properties: {
      focus: {
        type: "string",
        description: 'optional: the aspect the map should center on (e.g. "risk controls", "for beginners"); omit for a whole-document map'
      },
      root: {
        type: "object",
        description: "the mind map tree: root node with nested children",
        ...nodeSchema(MIND_MAP_LIMITS.maxDepth)
      }
    },
    required: ["root"]
  }
};
function parseMindMapTree(input, blockCount) {
  let nodeCount = 0;
  let maxDepth = 0;
  let trimmed = false;
  const walk = (raw, depth) => {
    if (nodeCount >= MIND_MAP_LIMITS.maxNodes || depth > MIND_MAP_LIMITS.maxDepth) {
      trimmed = true;
      return null;
    }
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
    const obj = raw;
    const label = typeof obj.label === "string" ? obj.label.trim() : "";
    if (!label) return null;
    nodeCount += 1;
    maxDepth = Math.max(maxDepth, depth);
    const node = { label: label.slice(0, MIND_MAP_LIMITS.maxLabelChars) };
    const block = obj.block;
    if (Number.isInteger(block) && block >= 0 && block < blockCount) {
      node.block = block;
    }
    const kids = Array.isArray(obj.children) ? obj.children : [];
    const children = [];
    for (const kid of kids) {
      const placed = walk(kid, depth + 1);
      if (placed) children.push(placed);
    }
    if (children.length > 0) node.children = children;
    return node;
  };
  const root = walk(input.root, 0);
  if (!root) {
    return {
      ok: false,
      error: 'root must be an object with a non-empty "label" string \u2014 pass the tree as {"root": {"label": "...", "children": [...]}}'
    };
  }
  if (!root.children || root.children.length === 0) {
    return {
      ok: false,
      error: "the map has no branches \u2014 expand the root into its main sections (2-5 children, each with its own children) and call again"
    };
  }
  return { ok: true, tree: root, nodeCount, depth: maxDepth, trimmed };
}
function countMindMapNodes(root) {
  let n = 1;
  for (const child of root.children ?? []) n += countMindMapNodes(child);
  return n;
}
function mindMapToMermaid(root) {
  const clean = (label) => {
    const text = label.replace(/[[\]{}()"`]|%%|:::/g, " ").replace(/\s+/g, " ").trim();
    return text || "Topic";
  };
  const lines = ["mindmap"];
  const walk = (node, depth) => {
    lines.push(`${"  ".repeat(depth + 1)}${clean(node.label)}`);
    for (const child of node.children ?? []) walk(child, depth + 1);
  };
  walk(root, 0);
  return lines.join("\n");
}
var CJK_RE = /[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF00-\uFFEF\u3040-\u30FF]/;
function labelUnits(text) {
  let units = 0;
  for (const ch of text) units += CJK_RE.test(ch) ? 2 : 1;
  return units;
}
function tokenize(label) {
  const tokens = [];
  let word = "";
  const flush = () => {
    if (word) {
      tokens.push({ text: word, units: labelUnits(word) });
      word = "";
    }
  };
  for (const ch of label) {
    if (CJK_RE.test(ch)) {
      flush();
      tokens.push({ text: ch, units: 2 });
    } else if (ch === " ") {
      word += ch;
      flush();
    } else {
      word += ch;
    }
  }
  flush();
  return tokens;
}
function splitToken(token, maxUnits) {
  const pieces = [];
  let text = "";
  let units = 0;
  for (const ch of token.text) {
    const chUnits = CJK_RE.test(ch) ? 2 : 1;
    if (units + chUnits > maxUnits && text) {
      pieces.push({ text, units });
      text = "";
      units = 0;
    }
    text += ch;
    units += chUnits;
  }
  if (text) pieces.push({ text, units });
  return pieces;
}
function wrapLabel(label, maxUnits, maxLines = 2) {
  const safeMax = Math.max(4, maxUnits);
  const tokens = [];
  for (const token of tokenize(label)) {
    if (token.units > safeMax) tokens.push(...splitToken(token, safeMax));
    else tokens.push(token);
  }
  const lines = [];
  let current = "";
  let currentUnits = 0;
  let overflow = false;
  for (const token of tokens) {
    if (currentUnits + token.units <= safeMax) {
      current += token.text;
      currentUnits += token.units;
      continue;
    }
    if (lines.length + 1 >= maxLines) {
      overflow = true;
      break;
    }
    lines.push(current.trimEnd());
    current = token.text.trimStart();
    currentUnits = labelUnits(current);
  }
  if (current.trim()) lines.push(current.trimEnd());
  if (overflow && lines.length > 0) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = fitEllipsis(last, safeMax);
  }
  return lines.length > 0 ? lines : [label];
}
function fitEllipsis(line, maxUnits) {
  const ellipsisUnits = 2;
  let out = "";
  let units = 0;
  for (const ch of line) {
    const chUnits = CJK_RE.test(ch) ? 2 : 1;
    if (units + chUnits + ellipsisUnits > maxUnits) break;
    out += ch;
    units += chUnits;
  }
  return `${out}\u2026`;
}
function edgePath(parent, child) {
  const px = parent.x + MIND_MAP_METRICS.nodeWidth / 2;
  const py = parent.y + MIND_MAP_METRICS.nodeHeight;
  const cx = child.x + MIND_MAP_METRICS.nodeWidth / 2;
  const cy = child.y;
  const k = Math.max(0, (cy - py) / 2);
  return `M ${px} ${py} C ${px} ${py + k}, ${cx} ${cy - k}, ${cx} ${cy}`;
}
function horizontalEdgePath(parent, child, dir) {
  const py = parent.y + MIND_MAP_METRICS.nodeHeight / 2;
  const cy = child.y + MIND_MAP_METRICS.nodeHeight / 2;
  const px = dir === 1 ? parent.x + MIND_MAP_METRICS.nodeWidth : parent.x;
  const cx = dir === 1 ? child.x : child.x + MIND_MAP_METRICS.nodeWidth;
  const k = Math.max(0, Math.abs(cx - px) / 2);
  return dir === 1 ? `M ${px} ${py} C ${px + k} ${py}, ${cx - k} ${cy}, ${cx} ${cy}` : `M ${px} ${py} C ${px - k} ${py}, ${cx + k} ${cy}, ${cx} ${cy}`;
}
function layoutMindMap(root, collapsed = /* @__PURE__ */ new Set(), options = {}) {
  if (options.orientation === "left-right") return layoutMindMapLeftRight(root, collapsed);
  return layoutMindMapTopDown(root, collapsed);
}
function layoutMindMapTopDown(root, collapsed) {
  const nodes = [];
  const edges = [];
  const { padding } = MIND_MAP_METRICS;
  let nextX = padding;
  let maxDepth = 0;
  const place = (node, id, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    const kids = node.children ?? [];
    const isCollapsed = collapsed.has(id);
    const placedKids = isCollapsed ? [] : kids.map((kid, i) => place(kid, `${id}.${i}`, depth + 1));
    let x;
    if (placedKids.length > 0) {
      const first = placedKids[0];
      const last = placedKids[placedKids.length - 1];
      x = (first.x + last.x + MIND_MAP_METRICS.nodeWidth) / 2 - MIND_MAP_METRICS.nodeWidth / 2;
    } else {
      x = nextX;
      nextX += MIND_MAP_METRICS.nodeWidth + MIND_MAP_METRICS.siblingGap;
    }
    const layoutNode = {
      id,
      label: node.label,
      lines: wrapLabel(node.label, labelBudget(node.block !== void 0, kids.length > 0)),
      block: node.block,
      depth,
      x,
      y: depth * (MIND_MAP_METRICS.nodeHeight + MIND_MAP_METRICS.depthGap) + padding,
      hasChildren: kids.length > 0,
      childCount: kids.length,
      descendants: countMindMapNodes(node) - 1,
      collapsed: isCollapsed
    };
    nodes.push(layoutNode);
    for (const kid of placedKids) {
      edges.push({ id: `${id}->${kid.id}`, d: edgePath(layoutNode, kid) });
    }
    return layoutNode;
  };
  place(root, "0", 0);
  const { nodeWidth: w, nodeHeight: h, depthGap, siblingGap } = MIND_MAP_METRICS;
  return {
    nodes,
    edges,
    width: Math.max(w, nextX - siblingGap - padding) + padding * 2,
    height: (maxDepth + 1) * (h + depthGap) - depthGap + padding * 2
  };
}
function layoutMindMapLeftRight(root, collapsed) {
  const { nodeWidth: W, nodeHeight: H, depthGap, siblingGap, padding } = MIND_MAP_METRICS;
  const nodes = [];
  const edges = [];
  const rootKids = root.children ?? [];
  const rootCollapsed = collapsed.has("0");
  const leafWeight = (node, id) => {
    if (collapsed.has(id)) return 1;
    const kids = node.children ?? [];
    if (kids.length === 0) return 1;
    return kids.reduce((sum, kid, i) => sum + leafWeight(kid, `${id}.${i}`), 0);
  };
  const left = [];
  const right = [];
  let leftWeight = 0;
  let rightWeight = 0;
  if (!rootCollapsed) {
    rootKids.forEach((kid, i) => {
      const id = `0.${i}`;
      const weight = leafWeight(kid, id);
      if (leftWeight < rightWeight) {
        left.push({ node: kid, id, half: "left" });
        leftWeight += weight;
      } else {
        right.push({ node: kid, id, half: "right" });
        rightWeight += weight;
      }
    });
  }
  const placed = [];
  const boxes = /* @__PURE__ */ new Map();
  const slotY = { left: padding, right: padding };
  const leafCount = { left: 0, right: 0 };
  const leafTop = [];
  const maxDepth = { left: 0, right: 0 };
  const place = (node, id, depth, half) => {
    const kids = node.children ?? [];
    const isCollapsed = collapsed.has(id);
    const visibleKids = isCollapsed ? [] : kids;
    let y;
    if (visibleKids.length === 0) {
      y = slotY[half];
      slotY[half] += H + siblingGap;
      leafCount[half] += 1;
      leafTop.push(y);
    } else {
      const childYs = visibleKids.map((kid, i) => place(kid, `${id}.${i}`, depth + 1, half));
      y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    }
    maxDepth[half] = Math.max(maxDepth[half], depth);
    placed.push({ node, id, depth, half, y });
    return y;
  };
  for (const branch of right) place(branch.node, branch.id, 1, "right");
  for (const branch of left) place(branch.node, branch.id, 1, "left");
  const leftWidth = maxDepth.left * (W + depthGap);
  const rightWidth = maxDepth.right * (W + depthGap);
  const rootX = padding + leftWidth;
  const rootY = leafTop.length === 0 ? padding : (Math.min(...leafTop) + Math.max(...leafTop)) / 2;
  const xFor = (depth, half) => half === "right" ? rootX + W + depthGap + (depth - 1) * (W + depthGap) : rootX - depthGap - W - (depth - 1) * (W + depthGap);
  boxes.set("0", { x: rootX, y: rootY });
  for (const item of placed) {
    boxes.set(item.id, { x: xFor(item.depth, item.half), y: item.y });
  }
  nodes.push({
    id: "0",
    label: root.label,
    lines: wrapLabel(root.label, labelBudget(root.block !== void 0, rootKids.length > 0)),
    block: root.block,
    depth: 0,
    x: rootX,
    y: rootY,
    hasChildren: rootKids.length > 0,
    childCount: rootKids.length,
    descendants: countMindMapNodes(root) - 1,
    collapsed: rootCollapsed
  });
  for (const item of placed) {
    const kids = item.node.children ?? [];
    nodes.push({
      id: item.id,
      label: item.node.label,
      lines: wrapLabel(
        item.node.label,
        labelBudget(item.node.block !== void 0, kids.length > 0)
      ),
      block: item.node.block,
      depth: item.depth,
      x: xFor(item.depth, item.half),
      y: item.y,
      hasChildren: kids.length > 0,
      childCount: kids.length,
      descendants: countMindMapNodes(item.node) - 1,
      collapsed: collapsed.has(item.id)
    });
  }
  const dirOf = (half) => half === "right" ? 1 : -1;
  for (const item of placed) {
    const kids = item.node.children ?? [];
    if (collapsed.has(item.id)) continue;
    const parent = boxes.get(item.id);
    for (let i = 0; i < kids.length; i++) {
      const kidId = `${item.id}.${i}`;
      const child = boxes.get(kidId);
      edges.push({
        id: `${item.id}->${kidId}`,
        d: horizontalEdgePath(parent, child, dirOf(item.half))
      });
    }
  }
  for (const branch of [...right, ...left]) {
    const child = boxes.get(branch.id);
    edges.push({
      id: `0->${branch.id}`,
      d: horizontalEdgePath(boxes.get("0"), child, dirOf(branch.half))
    });
  }
  const rows = Math.max(leafCount.left, leafCount.right);
  return {
    nodes,
    edges,
    width: padding * 2 + leftWidth + W + rightWidth,
    height: rows > 0 ? rows * (H + siblingGap) - siblingGap + padding * 2 : H + padding * 2
  };
}
function labelBudget(hasBadge, hasToggle) {
  const left = hasBadge ? 38 : 12;
  const right = hasToggle ? 32 : 10;
  return Math.max(6, Math.floor((MIND_MAP_METRICS.nodeWidth - left - right) / 6.5));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MIND_MAP_EXPORT_COLORS,
  MIND_MAP_LIMITS,
  MIND_MAP_METRICS,
  MIND_MAP_TOOL,
  countMindMapNodes,
  labelUnits,
  layoutMindMap,
  mindMapToMermaid,
  parseMindMapTree,
  wrapLabel
});
