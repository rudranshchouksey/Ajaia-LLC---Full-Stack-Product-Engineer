import MarkdownIt from "markdown-it";
import mammoth from "mammoth";
import { ALLOWED_UPLOAD_EXTENSIONS, DEFAULT_TITLE, MAX_TITLE_LENGTH, MAX_UPLOAD_BYTES } from "./limits";

/**
 * File import: .txt / .md / .docx -> HTML that TipTap can load.
 *
 * The HTML is never rendered raw; it's parsed by the TipTap/ProseMirror schema
 * in the browser, which drops anything it doesn't understand (scripts, styles,
 * unknown tags). Markdown is rendered with raw HTML disabled.
 */

export class ImportError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ImportError";
  }
}

export type UploadedFile = { name: string; bytes: Uint8Array };
export type ImportResult = { title: string; html: string; format: "txt" | "md" | "docx" };

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

export function getExtension(filename: string): string {
  const match = /\.[^./\\]+$/.exec(filename.trim());
  return match ? match[0].toLowerCase() : "";
}

export function titleFromFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "";
  const withoutExt = base.replace(/\.[^.]+$/, "");
  const title = withoutExt.replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_LENGTH);
  return title || DEFAULT_TITLE;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function decodeText(bytes: Uint8Array): string {
  if (bytes.includes(0)) {
    throw new ImportError(422, "This file doesn't look like plain text (it contains binary data).");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    throw new ImportError(422, "This file isn't valid UTF-8 text.");
  }
}

/** Plain text: blank lines separate paragraphs, single newlines become <br>. */
export function textToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((para) => para.replace(/^\n+|\n+$/g, ""))
    .filter((para) => para.trim().length > 0)
    .map((para) => `<p>${para.split("\n").map(escapeHtml).join("<br>")}</p>`)
    .join("\n");
}

export function markdownToHtml(markdown: string): string {
  return md.render(markdown.replace(/\r\n?/g, "\n")).trim();
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04"

export async function docxToHtml(bytes: Uint8Array): Promise<string> {
  if (!ZIP_MAGIC.every((b, i) => bytes[i] === b)) {
    throw new ImportError(422, "This .docx file is corrupt or isn't really a Word document.");
  }
  try {
    // mammoth ignores underline by default; map it so it survives the import.
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) }, { styleMap: ["u => u"] });
    return result.value.trim();
  } catch {
    throw new ImportError(422, "Couldn't read this .docx file. It may be corrupt or password-protected.");
  }
}

function hasText(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}

export async function convertUpload(file: UploadedFile): Promise<ImportResult> {
  const ext = getExtension(file.name);
  if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ImportError(
      415,
      `Unsupported file type${ext ? ` "${ext}"` : ""}. Please upload a ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")} file.`,
    );
  }
  if (file.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new ImportError(413, `File is too large. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }
  if (file.bytes.byteLength === 0) {
    throw new ImportError(422, "This file is empty.");
  }

  let html: string;
  let format: ImportResult["format"];
  if (ext === ".docx") {
    format = "docx";
    html = await docxToHtml(file.bytes);
  } else {
    const text = decodeText(file.bytes);
    if (!text.trim()) throw new ImportError(422, "This file is empty.");
    format = ext === ".md" ? "md" : "txt";
    html = format === "md" ? markdownToHtml(text) : textToHtml(text);
  }

  if (!hasText(html)) throw new ImportError(422, "This file doesn't contain any text to import.");
  return { title: titleFromFilename(file.name), html, format };
}
