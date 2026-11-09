import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { vi } from "vitest";

// Each test file gets its own throwaway SQLite database.
const dir = mkdtempSync(path.join(tmpdir(), "collab-docs-test-"));
process.env.DATABASE_URL = `file:${path.join(dir, "test.db").replace(/\\/g, "/")}`;
process.env.DATABASE_AUTH_TOKEN = "";

// `server-only` throws outside a React Server Components bundle.
vi.mock("server-only", () => ({}));
