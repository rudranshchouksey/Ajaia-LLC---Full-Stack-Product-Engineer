/**
 * Generates binary fixtures used by tests and the demo:
 *   fixtures/sample.docx : a small valid Word document (headings, bold/italic/underline, lists)
 *   fixtures/corrupt.docx: a zip without Word content (should be rejected)
 *   fixtures/not-a-docx.docx: plain text with a .docx name (should be rejected)
 *   fixtures/empty.txt   : a zero-byte file (should be rejected)
 *
 * Run: node scripts/make-fixtures.mjs
 */
import JSZip from "jszip";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("fixtures", { recursive: true });

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

const run = (text, { b, i, u } = {}) =>
  `<w:r>${b || i || u ? `<w:rPr>${b ? "<w:b/>" : ""}${i ? "<w:i/>" : ""}${u ? '<w:u w:val="single"/>' : ""}</w:rPr>` : ""}<w:t xml:space="preserve">${text}</w:t></w:r>`;
const para = (runs, style) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}${runs}</w:p>`;
const listItem = (text, numId) =>
  `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr></w:pPr>${run(text)}</w:p>`;

const body = [
  para(run("Quarterly report"), "Heading1"),
  para(run("This document was ") + run("imported from Word", { b: true }) + run(". It has ") + run("italic", { i: true }) + run(" and ") + run("underlined", { u: true }) + run(" text.")),
  para(run("Highlights"), "Heading2"),
  listItem("Revenue up 12%", 1),
  listItem("Two new hires", 1),
  para(run("Next steps"), "Heading2"),
  listItem("Finalize budget", 2),
  listItem("Plan offsite", 2),
].join("");

const files = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`,
  "word/styles.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${W}>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/></w:style>
</w:styles>`,
  "word/numbering.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering ${W}>
  <w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum>
  <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`,
  "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${W}><w:body>${body}</w:body></w:document>`,
};

const zip = new JSZip();
for (const [path, content] of Object.entries(files)) zip.file(path, content);
const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
writeFileSync("fixtures/sample.docx", buf);

// A "docx" that is really a zip with garbage inside (passes the magic-number check, fails parsing)
const broken = new JSZip();
broken.file("hello.txt", "this is not a word document");
writeFileSync("fixtures/corrupt.docx", await broken.generateAsync({ type: "nodebuffer" }));

// Plain text renamed to .docx (fails the zip magic-number check)
writeFileSync("fixtures/not-a-docx.docx", "plain text pretending to be docx\n");

writeFileSync("fixtures/empty.txt", "");
console.log("Wrote fixtures/sample.docx, corrupt.docx, not-a-docx.docx, empty.txt");
