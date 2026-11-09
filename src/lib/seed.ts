import type { Client } from "@libsql/client";

/**
 * Demo seed data. Designed so the very first login shows every feature:
 *
 *  alice  owns "Welcome to Collab Docs"  -> bob (editor), carol (viewer)
 *  alice  owns "Alice's private notes"   -> not shared (bob/carol get 404)
 *  bob    owns "Design sync - meeting notes" -> alice (editor)
 *  carol  owns "Reading list"            -> alice (viewer)
 */

export const SEED_USERS = [
  { id: "user_alice", email: "alice@example.com", name: "Alice Anderson" },
  { id: "user_bob", email: "bob@example.com", name: "Bob Brown" },
  { id: "user_carol", email: "carol@example.com", name: "Carol Chen" },
] as const;

const WELCOME_HTML = `
<h1>Welcome to Collab Docs 👋</h1>
<p>This is a <strong>lightweight collaborative editor</strong> built as a take-home exercise. Everything you see here is stored in the database and survives a refresh.</p>
<h2>Try the editor</h2>
<ul>
  <li><p>Format text with <strong>bold</strong>, <em>italic</em> and <u>underline</u> (Ctrl/⌘ + B, I, U).</p></li>
  <li><p>Use the style dropdown for <strong>Heading 1–3</strong>.</p></li>
  <li><p>Create bullet and numbered lists, then undo/redo with Ctrl/⌘ + Z / Shift + Z.</p></li>
</ul>
<h2>Try sharing</h2>
<ol>
  <li><p>This document is shared with <strong>Bob (editor)</strong> and <strong>Carol (viewer)</strong>.</p></li>
  <li><p>Log out, log in as Bob: he can edit this page.</p></li>
  <li><p>Log in as Carol: she sees it read-only, and the server rejects her writes.</p></li>
</ol>
<h3>Import</h3>
<p>Back on the dashboard, use <em>Import file</em> to turn a .txt, .md or .docx file (max 2 MB) into a new document.</p>
`.trim();

const PRIVATE_HTML = `
<h2>Private notes</h2>
<p>This document is <strong>not shared</strong> with anyone. If Bob or Carol open its URL directly, the server returns <em>404 Not Found</em>.</p>
`.trim();

const MEETING_HTML = `
<h1>Design sync: meeting notes</h1>
<p><em>Owner: Bob. Shared with Alice as an editor.</em></p>
<h2>Agenda</h2>
<ol>
  <li><p>Toolbar polish</p></li>
  <li><p>Share dialog copy</p></li>
  <li><p>Import edge cases (.docx tables)</p></li>
</ol>
<h2>Action items</h2>
<ul>
  <li><p><strong>Alice:</strong> review the empty states</p></li>
  <li><p><strong>Bob:</strong> write the release notes</p></li>
</ul>
`.trim();

const READING_HTML = `
<h2>Reading list</h2>
<p>Carol shared this with Alice as a <strong>viewer</strong>, so Alice gets a read-only editor here.</p>
<ul>
  <li><p><em>Designing Data-Intensive Applications</em> (Kleppmann)</p></li>
  <li><p><em>A Philosophy of Software Design</em> (Ousterhout)</p></li>
  <li><p>"Local-first software" (Ink &amp; Switch)</p></li>
</ul>
`.trim();

export async function seedIfEmpty(db: Client): Promise<boolean> {
  const res = await db.execute("SELECT COUNT(*) AS n FROM users");
  if (Number(res.rows[0]?.n ?? 0) > 0) return false;
  await insertSeedData(db);
  return true;
}

/** Destructive: wipes all data and re-inserts the demo dataset. */
export async function resetAndSeed(db: Client): Promise<void> {
  for (const table of ["document_shares", "documents", "sessions", "users"]) {
    await db.execute(`DELETE FROM ${table}`);
  }
  await insertSeedData(db);
}

async function insertSeedData(db: Client): Promise<void> {
  const now = Date.now();
  for (const u of SEED_USERS) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)",
      args: [u.id, u.email, u.name, now],
    });
  }

  const docs = [
    { id: "doc_welcome", owner: "user_alice", title: "Welcome to Collab Docs", html: WELCOME_HTML, age: 0 },
    { id: "doc_private", owner: "user_alice", title: "Alice's private notes", html: PRIVATE_HTML, age: 1 },
    { id: "doc_meeting", owner: "user_bob", title: "Design sync: meeting notes", html: MEETING_HTML, age: 2 },
    { id: "doc_reading", owner: "user_carol", title: "Reading list", html: READING_HTML, age: 3 },
  ];
  for (const d of docs) {
    const ts = now - d.age * 60 * 60 * 1000;
    await db.execute({
      sql: `INSERT OR IGNORE INTO documents (id, owner_id, title, content_json, content_html, created_at, updated_at)
            VALUES (?, ?, ?, NULL, ?, ?, ?)`,
      args: [d.id, d.owner, d.title, d.html, ts, ts],
    });
  }

  const shares = [
    { doc: "doc_welcome", user: "user_bob", role: "editor" },
    { doc: "doc_welcome", user: "user_carol", role: "viewer" },
    { doc: "doc_meeting", user: "user_alice", role: "editor" },
    { doc: "doc_reading", user: "user_alice", role: "viewer" },
  ];
  for (const s of shares) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO document_shares (document_id, user_id, role, created_at) VALUES (?, ?, ?, ?)",
      args: [s.doc, s.user, s.role, now],
    });
  }
}
