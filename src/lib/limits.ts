/** Constants shared by server and client code (no imports, safe for the browser). */

export const DEFAULT_TITLE = "Untitled document";
export const MAX_TITLE_LENGTH = 200;

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_UPLOAD_EXTENSIONS = [".txt", ".md", ".docx"] as const;
