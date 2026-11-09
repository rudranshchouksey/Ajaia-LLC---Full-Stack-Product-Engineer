import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { seedIfEmpty } from "./seed";

/**
 * Database access.
 *
 * - Dev / tests: a local SQLite file (default `file:./data/app.db`).
 * - Production: Turso, via DATABASE_URL (libsql://...) + DATABASE_AUTH_TOKEN.
 *
 * The same @libsql/client API works for both. The schema is created
 * idempotently on first use ("auto-migrate"), and demo users/documents are
 * seeded if the database is empty so a fresh deploy is immediately demoable.
 */

const DEFAULT_URL = "file:./data/app.db";

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_json TEXT,
    content_html TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id)`,
  `CREATE TABLE IF NOT EXISTS document_shares (
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
    created_at INTEGER NOT NULL,
    PRIMARY KEY (document_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_shares_user ON document_shares(user_id)`,
];

let client: Client | null = null;
let ready: Promise<void> | null = null;

function createDbClient(): Client {
  const url = process.env.DATABASE_URL || DEFAULT_URL;
  if (url.startsWith("file:")) {
    // Make sure the directory for the local SQLite file exists.
    const filePath = url.slice("file:".length);
    if (filePath && filePath !== ":memory:") {
      mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
    }
  }
  return createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
}

export async function migrate(c: Client): Promise<void> {
  for (const statement of SCHEMA) {
    await c.execute(statement);
  }
}

/**
 * Returns a ready-to-use client. Schema creation and first-run seeding happen
 * once per process (cached promise); a failure is retried on the next call.
 */
export async function getDb(): Promise<Client> {
  if (!client) client = createDbClient();
  if (!ready) {
    const c = client;
    ready = (async () => {
      await migrate(c);
      if (process.env.DISABLE_AUTO_SEED !== "1") await seedIfEmpty(c);
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
  return client;
}

/** Test helper: drop the cached client so a new DATABASE_URL takes effect. */
export function resetDbForTests(): void {
  client?.close();
  client = null;
  ready = null;
}

export function newId(): string {
  return crypto.randomUUID();
}
