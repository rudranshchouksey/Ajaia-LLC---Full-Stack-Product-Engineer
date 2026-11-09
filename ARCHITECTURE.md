# Architecture & decisions

## What I prioritized, and why

I had a 4–6 hour timebox, so I went for **a polished, verifiably correct core** over breadth. A reviewer clicking
through for a few minutes should see every feature on the first screen: seeded users, a seeded doc
that's shared both ways, and role badges. The order of work matched the risk:

1. **Data model and access control first.** A sharing bug (a viewer who can write, or a stranger who can read) is
   the worst failure a document editor can have, so permissions live in one pure function plus a data layer
   that enforces them on every call. It's covered by unit tests and route-handler tests.
2. **Editing that doesn't lose work.** The editor needs a reliable autosave more than it needs many features:
   debounced saves, one request in flight, queued edits, retry on failure, and a warning before closing
   the tab with unsaved changes.
3. **Import, then polish** (empty, loading and error states, mobile layout, a11y labels), then a single stretch
   feature (Markdown export).

## Data model (SQLite / libsql)

```
users           (id PK, email UNIQUE, name, created_at)
sessions        (token PK, user_id → users, created_at, expires_at)
documents       (id PK, owner_id → users, title, content_json, content_html, created_at, updated_at)
document_shares (document_id → documents, user_id → users, role 'viewer'|'editor', created_at,
                 PRIMARY KEY (document_id, user_id))
```

- **Ownership is a column, not a share row.** There's always exactly one owner, and "owner" can't be granted
  or revoked by accident.
- **Content is TipTap JSON** (the canonical, lossless editor format) **plus HTML** (for export/interop
  and for imported docs). Imported and seeded docs start with HTML only. The editor loads either one,
  and the first save writes both.
- The schema is created idempotently at startup (`CREATE TABLE IF NOT EXISTS`). With 4 tables I chose that
  over a migration tool; a real project would use versioned migrations (for example Drizzle).

## Access-control model

`getAccess(doc, userId) → owner | editor | viewer | none` in `src/lib/permissions.ts` is a pure
function with no I/O. Capabilities are derived from it:

| | read | edit content | rename / delete / share |
| --- | :-: | :-: | :-: |
| owner | ✓ | ✓ | ✓ |
| editor | ✓ | ✓ | |
| viewer | ✓ | | |
| none | 404 | 404 | 404 |

- **Enforcement is in the data layer** (`src/lib/documents.ts`). Each function takes the acting user's id and
  checks access before touching data, so a new API route can't "forget" the check. Routes do only
  `requireUser()`, then zod validation, then the data-layer call.
- **No access returns 404, not 403.** That way the API doesn't confirm a private document exists. Insufficient
  role on a visible doc returns 403.
- The UI mirrors the rules: read-only editor and no toolbar for viewers, no title input or Share button for
  non-owners. **These UI checks are cosmetic only; the server is the source of truth.**
- Auth is a deliberately tiny demo layer (`src/lib/auth.ts`): random 256-bit session tokens in an httpOnly,
  SameSite=Lax cookie, stored server-side. Only `getCurrentUser()` / `requireUser()` are used elsewhere,
  so a real provider could replace it without touching the rest of the app.

## Why TipTap

TipTap is ProseMirror with a good React binding and a sane extension model. It gave me a schema-validated
document (so imported or pasted HTML gets normalized to what the editor supports, and scripts or styles are
dropped), JSON serialization, history (undo/redo), keyboard shortcuts and active-state queries for free. It's
also the natural path to real-time collaboration (`@tiptap/extension-collaboration` + Yjs), which is the
obvious next step.

## Why libsql / Turso

The same `@libsql/client` code talks to a **local SQLite file** in dev and tests (no Docker, no setup) and to
**Turso** in production (free tier, works from Vercel's serverless functions over HTTP). SQL stays simple
and portable. Each test file gets its own throwaway SQLite DB, so tests exercise real SQL rather than mocks.

## Notable trade-offs

- **Last-write-wins** for concurrent edits. That's acceptable for a single-editor-at-a-time demo and a known gap.
  The fix is CRDTs (below), not optimistic locking bolted onto whole-document saves.
- **Whole-document saves** (JSON + HTML) on each autosave. It's simple and fine at this size. Diff or patch sync
  only matters with real-time collaboration.
- **Server-rendered pages + client editor.** Pages load the document server-side (no loading spinner on
  navigation), and the editor is client-only (`immediatelyRender: false`) to avoid hydration mismatches.
- **Next 16's `cacheComponents` is turned off.** Every page is per-user and reads the session cookie, so
  there's no static shell to gain, and plain dynamic rendering keeps the auth code simple.
- **Export runs in the browser.** The editor already holds the canonical JSON, so no server round-trip or
  server-side DOM is needed.
- **Import converts to HTML on the server**, and the editor's schema parses it on the client. Unsupported
  constructs degrade to text rather than failing.

## What I deliberately cut

- **Real authentication** (passwords, OAuth, email verification). The demo login is clearly labelled.
- **Real-time collaboration / CRDT**, presence and live cursors.
- Comments, suggestions, version history and restore.
- Link sharing, public links, and email invites for users who haven't signed up.
- PDF and DOCX export, images and attachments, tables, and hyperlinks in the editor.
- Dashboard search and pagination, API rate limiting, and session cleanup jobs.
- A committed browser E2E suite. I verified browser flows with ad-hoc Playwright scripts during development,
  and the committed automated tests are Vitest (unit + route handler).

## What I'd build next with 2–4 more hours

1. **Real-time collaboration:** Yjs + `@tiptap/extension-collaboration` + collaboration cursors, via a
   y-websocket / Hocuspocus server (or Liveblocks), persisting Yjs updates and snapshots to the DB. This
   also removes last-write-wins.
2. **Version history:** periodic snapshots (doc JSON + author + timestamp), a history panel, and restore.
3. **Link sharing:** per-document share tokens with a role (`anyone with the link can view`), plus revocation.
4. **Proper auth:** Auth.js (email magic link or GitHub OAuth), keeping the same `requireUser()` seam.
5. A Playwright E2E suite in CI covering the "share → edit → read-only → revoke" journey.
