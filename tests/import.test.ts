import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { convertUpload, ImportError, textToHtml, titleFromFilename } from "@/lib/import";
import { MAX_UPLOAD_BYTES } from "@/lib/limits";

const fixture = (name: string) => new Uint8Array(readFileSync(path.join(__dirname, "..", "fixtures", name)));
const bytes = (s: string) => new TextEncoder().encode(s);

async function importError(name: string, data: Uint8Array): Promise<ImportError> {
  try {
    await convertUpload({ name, bytes: data });
  } catch (err) {
    if (err instanceof ImportError) return err;
    throw err;
  }
  throw new Error("expected import to fail");
}

describe("txt import", () => {
  it("converts the sample fixture into paragraphs with line breaks", async () => {
    const res = await convertUpload({ name: "sample.txt", bytes: fixture("sample.txt") });
    expect(res.format).toBe("txt");
    expect(res.title).toBe("sample");
    expect(res.html).toContain("<p>Meeting notes, plain text</p>");
    expect(res.html).toContain("This file was imported from a .txt file.<br>Single line breaks");
    expect(res.html.match(/<p>/g)).toHaveLength(3);
  });

  it("escapes HTML so it is shown literally", () => {
    expect(textToHtml('<script>alert("x")</script> & co')).toBe(
      "<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; co</p>",
    );
  });

  it("handles CRLF line endings and a UTF-8 BOM", async () => {
    const res = await convertUpload({ name: "win.TXT", bytes: bytes("\uFEFFone\r\ntwo\r\n\r\nthree") });
    expect(res.html).toBe("<p>one<br>two</p>\n<p>three</p>");
  });
});

describe("md import", () => {
  it("converts headings, emphasis and lists", async () => {
    const res = await convertUpload({ name: "sample.md", bytes: fixture("sample.md") });
    expect(res.format).toBe("md");
    expect(res.html).toContain("<h1>Project kickoff</h1>");
    expect(res.html).toContain("<strong>imported from Markdown</strong>");
    expect(res.html).toContain("<em>italic</em>");
    expect(res.html).toMatch(/<ul>\s*<li>Ship a polished editor<\/li>/);
    expect(res.html).toMatch(/<ol>\s*<li>Scaffold the app<\/li>/);
    expect(res.html).toContain("<h3>Notes</h3>");
  });

  it("does not pass raw HTML through", async () => {
    const res = await convertUpload({ name: "x.md", bytes: bytes("hi <script>alert(1)</script>") });
    expect(res.html).not.toContain("<script>");
    expect(res.html).toContain("&lt;script&gt;");
  });
});

describe("docx import", () => {
  it("converts headings, inline formatting and lists", async () => {
    const res = await convertUpload({ name: "Quarterly report.docx", bytes: fixture("sample.docx") });
    expect(res.format).toBe("docx");
    expect(res.title).toBe("Quarterly report");
    expect(res.html).toContain("<h1>Quarterly report</h1>");
    expect(res.html).toContain("<strong>imported from Word</strong>");
    expect(res.html).toContain("<em>italic</em>");
    expect(res.html).toContain("<u>underlined</u>");
    expect(res.html).toContain("<ul><li>Revenue up 12%</li>");
    expect(res.html).toContain("<ol><li>Finalize budget</li>");
  });

  it("rejects a corrupt docx (zip without Word content)", async () => {
    const err = await importError("corrupt.docx", fixture("corrupt.docx"));
    expect(err.status).toBe(422);
    expect(err.message).toMatch(/corrupt/i);
  });

  it("rejects a text file renamed to .docx", async () => {
    const err = await importError("not-a-docx.docx", fixture("not-a-docx.docx"));
    expect(err.status).toBe(422);
  });
});

describe("validation", () => {
  it("rejects unsupported types (415)", async () => {
    expect((await importError("report.pdf", bytes("%PDF"))).status).toBe(415);
    expect((await importError("noextension", bytes("hello"))).status).toBe(415);
  });

  it("rejects files over 2 MB (413)", async () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1).fill(97);
    expect((await importError("big.txt", big)).status).toBe(413);
  });

  it("rejects empty and whitespace-only files (422)", async () => {
    expect((await importError("empty.txt", fixture("empty.txt"))).message).toMatch(/empty/);
    expect((await importError("blank.md", bytes("  \n\n  "))).message).toMatch(/empty/);
  });

  it("rejects binary data in a text file (422)", async () => {
    expect((await importError("bin.txt", new Uint8Array([104, 0, 105]))).status).toBe(422);
  });
});

describe("titleFromFilename", () => {
  it("strips the extension and path, collapses whitespace", () => {
    expect(titleFromFilename("Q3  plan.final.md")).toBe("Q3 plan.final");
    expect(titleFromFilename("C:\\Users\\me\\notes.txt")).toBe("notes");
    expect(titleFromFilename(".md")).toBe("Untitled document");
  });
});
