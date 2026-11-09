# Collab Docs

A lightweight collaborative document editor inspired by Google Docs, built as a take-home assignment.
You can create and format documents, autosave them, import `.txt` / `.md` / `.docx` files, and share
them with other users as **Editor** or **Viewer**. Permissions are enforced on the server.

> **Demo login:** there are no passwords. Pick a seeded account (or type any email) on the login
> page to sign in as that user. This is deliberate, to make reviewing the sharing flow fast. See
> [Known limitations](#known-limitations).

- **Live demo:** `TODO: add Vercel URL`
- Architecture & trade-offs: [ARCHITECTURE.md](ARCHITECTURE.md)
- Submission checklist: [SUBMISSION.md](SUBMISSION.md)

## Features

| Area | What works |
| --- | --- |
| Documents | Create, rename (inline title, owner only), delete (owner only), edit, reopen after refresh |
| Autosave | Debounced (800 ms), "Saving… / Saved / Unsaved changes" indicator, automatic retry on network errors, warning before closing with unsaved changes, `Ctrl/⌘+S` saves immediately |
| Editor | TipTap: **Bold**, *Italic*, <u>Underline</u>, Normal/Heading 1/2/3, bulleted and numbered lists, undo/redo. Toolbar shows active states; all StarterKit keyboard shortcuts work |
| Dashboard | Separate **Owned by me** and **Shared with me** sections; shared items show the owner's name and a role badge |
| Import | "Import file" turns `.txt`, `.md` or `.docx` (max **2 MB**) into a new document, titled from the file name. Clear errors for unsupported, too-large, empty and corrupt files |
| Sharing | Owner-only Share dialog: add a user by email as Editor or Viewer, change role, remove access |
| Access control | Viewers get a read-only editor and a "Shared by X · View only" banner; the API rejects their writes with **403**. Users without access get **404**. Only owners can rename, delete or share |
| Export (stretch) | "Export .md" downloads the document as Markdown (available to every role) |

## Tech stack

- **Next.js 16** (App Router, Route Handlers) + **TypeScript** + **Tailwind CSS 4**
- **TipTap 3** (StarterKit + Underline + Placeholder); content stored as TipTap JSON, with HTML kept alongside
- **@libsql/client**: a local SQLite file in development, **Turso** in production (same code)
- **zod** validation on every API route; consistent `{ "error": "..." }` error responses
- **mammoth** (`.docx` → HTML), **markdown-it** (`.md` → HTML)
- **Vitest** for unit and route-handler tests
- Deploys to **Vercel** (free) + **Turso** (free)

## Local setup

Requirements: Node.js 20.9+ (developed on Node 24) and npm.

```bash
npm install
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
npm run seed                    # optional: creates/resets data/app.db with demo data
npm run dev                     # http://localhost:3000
```

You don't strictly need `npm run seed`. On first start the app creates the schema automatically, and it
seeds the demo data whenever the database is empty. `npm run seed` **resets** the database to the
demo state (it deletes all existing data).

Other scripts:

```bash
npm test          # Vitest (48 tests)
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
npm run build     # production build
node scripts/make-fixtures.mjs   # regenerate the binary fixtures in fixtures/
```

### Environment variables

| Variable | Dev | Production |
| --- | --- | --- |
| `DATABASE_URL` | `file:./data/app.db` (default if unset) | `libsql://<db>-<org>.turso.io` |
| `DATABASE_AUTH_TOKEN` | empty | Turso database token |

## Seeded test accounts

| User | Email | What they see on first login |
| --- | --- | --- |
| Alice Anderson | `alice@example.com` | Owns "Welcome to Collab Docs" (shared with Bob as editor and Carol as viewer) and "Alice's private notes" (not shared). Has "Design sync: meeting notes" shared from Bob (editor) and "Reading list" shared from Carol (viewer) |
| Bob Brown | `bob@example.com` | Owns "Design sync"; **can edit** Alice's "Welcome" doc |
| Carol Chen | `carol@example.com` | Owns "Reading list"; **view only** on Alice's "Welcome" doc |

## How to demo sharing (about 3 minutes)

1. Open the app and click **Alice Anderson** on the login page.
2. The dashboard shows **Owned by me** and **Shared with me**. Note the *Can edit* and *View only* badges.
3. Click **New document**, rename it inline (for example, "Launch plan"), and type some text. Use the toolbar
   or `Ctrl/⌘+B`, `I`, `U` and the style dropdown for headings, then add a list. Watch **Saving… → Saved**.
4. Refresh the page. The content and formatting are still there.
5. Click **Share**, add `bob@example.com` as **Editor** and `carol@example.com` as **Viewer**.
6. **Log out**, then log in as **Bob**. "Launch plan" appears under *Shared with me* with a *Can edit*
   badge. Open it: there's a "Shared by Alice Anderson" banner, Bob can edit (it autosaves), and he
   cannot rename it or see the Share button.
7. Log out, then log in as **Carol**. Open "Launch plan": it shows a **View only** banner, there's no
   toolbar, and the editor is read-only. Carol can still **Export .md**.
   - Optional proof that the server enforces this: in Carol's browser console, run
     `fetch(location.pathname.replace('/docs/','/api/documents/'), {method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({title:'x'})}).then(r => r.status)`
     and you get `403`.
8. Log back in as Alice, open **Share**, change Carol to Editor or remove her. If you remove her,
   Carol's next visit to the URL shows "Document not found".
9. Back on Alice's dashboard, click **Import file** and pick `fixtures/sample.docx` or `fixtures/sample.md`
   from this repo. A new formatted document opens. Try `fixtures/corrupt.docx` or `fixtures/empty.txt` to see the error toasts.

## File import: supported types and limits

- **Allowed:** `.txt`, `.md`, `.docx`. **Max size: 2 MB.** The UI states this next to the Import button.
- `.txt`: blank lines separate paragraphs; single line breaks are kept. HTML in the text is shown literally.
- `.md`: CommonMark via markdown-it, with raw HTML **disabled**. Headings, emphasis, lists, quotes and code are supported.
- `.docx`: converted with mammoth. Headings, bold, italic, underline and lists are supported. Images and tables
  are not carried over (table text is kept as plain paragraphs).
- Errors: unsupported type → 415, too large → 413, empty / binary / invalid UTF-8 / corrupt docx → 422,
  each with a human-readable message shown in a toast.
- The import always creates a **new** document owned by the uploader.

## API overview

All endpoints need a session cookie (except login) and return `{ "error": string }` on failure.

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` `{ email }` · `/api/auth/logout` | anyone |
| GET | `/api/me` · `/api/users` | logged in |
| GET / POST | `/api/documents` | logged in (lists own + shared / creates) |
| GET | `/api/documents/:id` | owner, editor, viewer |
| PATCH | `/api/documents/:id` `{ title?, content?: { json, html } }` | content: owner/editor · title: owner |
| DELETE | `/api/documents/:id` | owner |
| GET / POST | `/api/documents/:id/shares` `{ email, role }` | owner |
| PATCH / DELETE | `/api/documents/:id/shares/:userId` `{ role }` | owner |
| POST | `/api/import` (multipart `file`) | logged in |

## Deploy: Vercel + Turso (both free tiers)

**1. Create the Turso database** (install the CLI: `brew install tursodatabase/tap/turso` on macOS,
or `curl -sSfL https://get.tur.so/install.sh | bash` on Linux/WSL):

```bash
turso auth signup                     # or: turso auth login
turso db create collab-docs
turso db show collab-docs --url       # -> libsql://collab-docs-<org>.turso.io
turso db tokens create collab-docs    # -> long token string
```

**2. Deploy to Vercel:**

```bash
npm i -g vercel
vercel login
vercel link                                   # create/link the project
vercel env add DATABASE_URL production        # paste the libsql:// URL
vercel env add DATABASE_AUTH_TOKEN production # paste the token
vercel --prod
```

(Or import the Git repo in the Vercel dashboard and add the two env vars under *Settings → Environment Variables*.)

**3. Seed (optional).** The schema is created and demo data is seeded automatically on the first request
to an empty database. To reset production to the demo state later:

```bash
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run seed
# PowerShell: $env:DATABASE_URL="libsql://..."; $env:DATABASE_AUTH_TOKEN="..."; npm run seed
```

Shell variables take precedence over `.env.local`.

## Project structure

```
src/
  app/                       pages (/, /login, /docs/[id]) + API route handlers (app/api/**)
  components/                Dashboard, DocumentView, ShareDialog, ImportButton, ...
  components/editor/         Toolbar, TitleInput, SaveIndicator, ExportButton, TipTap extensions
  hooks/useAutosave.ts       debounced, ordered, retrying autosave controller
  lib/db.ts                  libsql client, schema auto-migration, first-run seed
  lib/auth.ts                demo session auth: getCurrentUser(), requireUser()
  lib/permissions.ts         pure getAccess(doc, userId) -> owner | editor | viewer | none
  lib/documents.ts           data layer; every function enforces access itself
  lib/import.ts              file -> HTML conversion + validation
  lib/markdown.ts            TipTap JSON -> Markdown (export)
  lib/validation.ts          zod schemas for every request
tests/                       Vitest: permissions, documents, api, import, markdown
fixtures/                    sample.txt / .md / .docx + corrupt and empty files
scripts/                     seed.ts, make-fixtures.mjs
```

## Known limitations

- **Demo auth only.** There are no passwords: anyone can sign in as any email. Sessions are real, random,
  httpOnly cookies stored in the DB, but the identity behind them isn't verified.
- **No real-time collaboration.** Two people editing the same document at the same time overwrite each
  other (last write wins). Refresh to see someone else's changes.
- You can only share with users who have signed in at least once (there are no email invites or share links).
- The editor has no links, images, tables or comments. `.docx` import drops images and flattens tables.
- Export is Markdown only (no PDF or DOCX).
- There's no pagination or search on the dashboard, and no rate limiting on the API.
- Expired sessions aren't garbage-collected; they're simply rejected.
