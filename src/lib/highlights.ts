import { db, type Highlight } from "./db";

export const HIGHLIGHT_COLORS: { name: string; value: string; bg: string }[] = [
  { name: "Yellow", value: "yellow", bg: "#fef3a8" },
  { name: "Red", value: "red", bg: "#fecaca" },
  { name: "Lime", value: "lime", bg: "#d9f99d" },
  { name: "Sky", value: "sky", bg: "#bae6fd" },
  { name: "Orange", value: "orange", bg: "#fed7aa" },
  { name: "Pink", value: "pink", bg: "#fbcfe8" },
  { name: "Purple", value: "purple", bg: "#e9d5ff" },
  { name: "Ash", value: "ash", bg: "#e5e7eb" },
];

export function colorBg(value: string): string {
  return HIGHLIGHT_COLORS.find((c) => c.value === value)?.bg ?? "#fef3a8";
}

function getXPath(node: Node, root: HTMLElement): string {
  if (node === root) return "";
  const parts: string[] = [];
  let cur: Node | null = node;
  while (cur && cur !== root) {
    const parent = cur.parentNode;
    if (!parent) break;
    const siblings = Array.from(parent.childNodes).filter(
      (n) => n.nodeType === cur!.nodeType && n.nodeName === cur!.nodeName
    );
    const idx = siblings.indexOf(cur as ChildNode);
    parts.unshift(`${cur.nodeName}[${idx}]`);
    cur = parent;
  }
  return parts.join("/");
}

function nodeFromXPath(path: string, root: HTMLElement): Node | null {
  if (!path) return root;
  const parts = path.split("/");
  let cur: Node = root;
  for (const p of parts) {
    const m = p.match(/^(.+)\[(\d+)\]$/);
    if (!m) return null;
    const [, name, idxStr] = m;
    const idx = parseInt(idxStr, 10);
    const siblings = Array.from(cur.childNodes).filter(
      (n) => n.nodeName === name
    );
    if (!siblings[idx]) return null;
    cur = siblings[idx];
  }
  return cur;
}

export function serializeRange(
  range: Range,
  root: HTMLElement
): {
  startXPath: string;
  startOffset: number;
  endXPath: string;
  endOffset: number;
} | null {
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer))
    return null;
  return {
    startXPath: getXPath(range.startContainer, root),
    startOffset: range.startOffset,
    endXPath: getXPath(range.endContainer, root),
    endOffset: range.endOffset,
  };
}

export function applyHighlight(h: Highlight, root: HTMLElement) {
  try {
    const startNode = nodeFromXPath(h.startXPath, root);
    const endNode = nodeFromXPath(h.endXPath, root);
    if (!startNode || !endNode) return;
    const range = document.createRange();
    range.setStart(startNode, h.startOffset);
    range.setEnd(endNode, h.endOffset);
    wrapRange(range, h);
  } catch {
    /* skip broken highlight */
  }
}

function wrapRange(range: Range, h: Highlight) {
  const bg = colorBg(h.color);
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!range.intersectsNode(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );
  let n = walker.nextNode();
  while (n) {
    textNodes.push(n as Text);
    n = walker.nextNode();
  }
  textNodes.forEach((node) => {
    const isStart = node === range.startContainer;
    const isEnd = node === range.endContainer;
    const start = isStart ? range.startOffset : 0;
    const end = isEnd ? range.endOffset : node.length;
    if (end <= start) return;
    const before = node.nodeValue!.slice(0, start);
    const middle = node.nodeValue!.slice(start, end);
    const after = node.nodeValue!.slice(end);
    const mark = document.createElement("mark");
    mark.setAttribute("data-hl", h.id);
    mark.style.backgroundColor = bg;
    mark.style.color = "inherit";
    mark.style.padding = "0 1px";
    mark.style.borderRadius = "2px";
    mark.textContent = middle;
    const parent = node.parentNode!;
    if (before) parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(mark, node);
    if (after) parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
  });
}

export async function saveHighlight(
  articleId: string,
  range: Range,
  color: string,
  root: HTMLElement
): Promise<Highlight | null> {
  const ser = serializeRange(range, root);
  if (!ser) return null;
  const h: Highlight = {
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    articleId,
    color,
    text: range.toString(),
    ...ser,
    createdAt: Date.now(),
  };
  await db.highlights.put(h);
  return h;
}

export async function loadHighlights(articleId: string): Promise<Highlight[]> {
  return db.highlights.where("articleId").equals(articleId).sortBy("createdAt");
}
