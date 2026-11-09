/**
 * TipTap JSON -> Markdown (for "Export as Markdown").
 *
 * Covers the node/mark types the editor can produce. Underline has no
 * Markdown syntax, so it's emitted as inline HTML (<u>), which Markdown allows.
 */

export type JSONNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: JSONNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

const MARK_SYNTAX: Record<string, [string, string]> = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  strike: ["~~", "~~"],
  underline: ["<u>", "</u>"],
  code: ["`", "`"],
};
// Outer-to-inner order for stable output, e.g. ***bold italic***.
const MARK_ORDER = ["bold", "italic", "strike", "underline", "code"];

function escapeText(text: string): string {
  return text.replace(/([\\`*_[\]<>])/g, "\\$1");
}

function renderText(node: JSONNode): string {
  const raw = node.text ?? "";
  const marks = (node.marks ?? []).map((m) => m.type).filter((t) => t in MARK_SYNTAX);
  const isCode = marks.includes("code");
  let body = isCode ? raw : escapeText(raw);
  if (!marks.length || !raw.trim()) return body;

  // Markdown emphasis can't start/end with whitespace: move it outside the markers.
  const lead = body.match(/^\s*/)![0];
  const trail = body.match(/\s*$/)![0];
  body = body.slice(lead.length, body.length - trail.length);

  const ordered = MARK_ORDER.filter((m) => marks.includes(m));
  const open = ordered.map((m) => MARK_SYNTAX[m]![0]).join("");
  const close = ordered
    .slice()
    .reverse()
    .map((m) => MARK_SYNTAX[m]![1])
    .join("");
  return `${lead}${open}${body}${close}${trail}`;
}

function renderInline(nodes: JSONNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === "text") return renderText(n);
      if (n.type === "hardBreak") return "  \n";
      return renderInline(n.content);
    })
    .join("");
}

/** Escape characters that would otherwise turn a paragraph into another block. */
function escapeBlockStart(line: string): string {
  return line.replace(/^(\s*)(#{1,6}\s|[-+]\s|\d+\.\s|>)/, (_, ws: string, marker: string) => `${ws}\\${marker}`);
}

function indent(text: string, prefix: string, firstPrefix = prefix): string {
  return text
    .split("\n")
    .map((line, i) => (line ? (i === 0 ? firstPrefix : prefix) + line : line))
    .join("\n");
}

function renderList(node: JSONNode, ordered: boolean): string {
  const start = Number(node.attrs?.start ?? 1) || 1;
  return (node.content ?? [])
    .map((item, i) => {
      const marker = ordered ? `${start + i}. ` : "- ";
      const body = renderBlocks(item.content ?? [], "\n");
      return indent(body, " ".repeat(marker.length), marker);
    })
    .join("\n");
}

function renderBlock(node: JSONNode): string {
  switch (node.type) {
    case "paragraph":
      return escapeBlockStart(renderInline(node.content));
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6);
      return `${"#".repeat(level)} ${renderInline(node.content)}`;
    }
    case "bulletList":
      return renderList(node, false);
    case "orderedList":
      return renderList(node, true);
    case "blockquote":
      return indent(renderBlocks(node.content ?? []), "> ").replace(/^$/gm, ">");
    case "codeBlock": {
      const lang = typeof node.attrs?.language === "string" ? node.attrs.language : "";
      const code = (node.content ?? []).map((n) => n.text ?? "").join("");
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    default:
      return node.content ? renderBlocks(node.content) : renderInline([node]);
  }
}

function renderBlocks(nodes: JSONNode[], separator = "\n\n"): string {
  return nodes
    .map(renderBlock)
    .filter((s, i, all) => s.trim() !== "" || (i > 0 && i < all.length - 1)) // drop leading/trailing empty paragraphs
    .join(separator);
}

export function tiptapToMarkdown(doc: JSONNode): string {
  const out = renderBlocks(doc.content ?? []).replace(/\n{3,}/g, "\n\n").trim();
  return out ? `${out}\n` : "";
}

/** Safe file name for downloads: "My doc: v2?" -> "My doc v2". */
export function toFileName(title: string, ext: string): string {
  const base = title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) || "document";
  return `${base}.${ext}`;
}
