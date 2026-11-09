import { describe, expect, it } from "vitest";
import { tiptapToMarkdown, toFileName, type JSONNode } from "@/lib/markdown";

const t = (text: string, ...marks: string[]): JSONNode => ({
  type: "text",
  text,
  ...(marks.length ? { marks: marks.map((type) => ({ type })) } : {}),
});
const p = (...content: JSONNode[]): JSONNode => ({ type: "paragraph", content });
const li = (...content: JSONNode[]): JSONNode => ({ type: "listItem", content });
const doc = (...content: JSONNode[]): JSONNode => ({ type: "doc", content });

describe("tiptapToMarkdown", () => {
  it("renders headings, paragraphs and inline marks", () => {
    const md = tiptapToMarkdown(
      doc(
        { type: "heading", attrs: { level: 2 }, content: [t("Title")] },
        p(t("Plain "), t("bold", "bold"), t(" and "), t("italic", "italic"), t(" and "), t("under", "underline")),
      ),
    );
    expect(md).toBe("## Title\n\nPlain **bold** and *italic* and <u>under</u>\n");
  });

  it("moves whitespace outside emphasis markers", () => {
    expect(tiptapToMarkdown(doc(p(t("a"), t(" bold ", "bold"), t("b"))))).toBe("a **bold** b\n");
  });

  it("renders bullet and ordered lists, including nesting", () => {
    const md = tiptapToMarkdown(
      doc(
        { type: "bulletList", content: [li(p(t("one"))), li(p(t("two")), { type: "bulletList", content: [li(p(t("nested")))] })] },
        { type: "orderedList", attrs: { start: 1 }, content: [li(p(t("first"))), li(p(t("second")))] },
      ),
    );
    expect(md).toBe("- one\n- two\n  - nested\n\n1. first\n2. second\n");
  });

  it("escapes markdown syntax in plain text", () => {
    expect(tiptapToMarkdown(doc(p(t("# not a heading *or* [link]"))))).toBe("\\# not a heading \\*or\\* \\[link\\]\n");
  });

  it("handles blockquotes, code blocks, rules and hard breaks", () => {
    const md = tiptapToMarkdown(
      doc(
        { type: "blockquote", content: [p(t("quoted"))] },
        { type: "codeBlock", attrs: { language: "js" }, content: [t("const a = 1;")] },
        { type: "horizontalRule" },
        p(t("line1"), { type: "hardBreak" }, t("line2")),
      ),
    );
    expect(md).toBe("> quoted\n\n```js\nconst a = 1;\n```\n\n---\n\nline1  \nline2\n");
  });

  it("returns an empty string for an empty doc", () => {
    expect(tiptapToMarkdown(doc(p()))).toBe("");
  });
});

describe("toFileName", () => {
  it("strips characters that are invalid in file names", () => {
    expect(toFileName('Q3: plan / "draft"?', "md")).toBe("Q3 plan draft.md");
    expect(toFileName("   ", "md")).toBe("document.md");
  });
});
