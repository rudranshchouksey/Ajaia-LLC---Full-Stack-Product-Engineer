# Submission

- **Live URL:** `TODO(me): https://<project>.vercel.app`
- **Walkthrough video:** `TODO(me): <link>` (script: [walkthrough/SCRIPT.md](walkthrough/SCRIPT.md))
- **Repository / archive:** `TODO(me): link to the Google Drive folder or zip`

## Test accounts (demo login, no password)

| Email | Role in the demo |
| --- | --- |
| `alice@example.com` | Owner of "Welcome to Collab Docs" (shared with Bob as editor and Carol as viewer) |
| `bob@example.com` | Editor on Alice's doc |
| `carol@example.com` | Viewer on Alice's doc |

Any other email also works and creates a new empty account.

## What's included

| Path | Contents |
| --- | --- |
| `src/` | Next.js app: pages, API route handlers, components, `lib/` (db, auth, permissions, documents, import, markdown, validation) |
| `tests/` | Vitest suites: `permissions`, `documents`, `api`, `import`, `markdown` (48 tests) |
| `fixtures/` | `sample.txt`, `sample.md`, `sample.docx`, `corrupt.docx`, `not-a-docx.docx`, `empty.txt` |
| `scripts/` | `seed.ts` (`npm run seed`), `make-fixtures.mjs` |
| `README.md` | Setup, demo script, import limits, API, deployment (Vercel + Turso), limitations |
| `ARCHITECTURE.md` | Priorities, data model, access control, trade-offs, cuts, next steps |
| `AI_WORKFLOW.md` | How AI was used (author's sections marked `TODO(me)`) |
| `walkthrough/SCRIPT.md` | 3–5 minute video outline |
| `.env.example` | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` |

## Requirement status

| # | Requirement | Status | Notes |
| --- | --- | --- | --- |
| 1 | Create / rename / edit documents | ✅ Working | Inline title (owner), delete (owner) |
| 1 | Autosave with Saving… / Saved | ✅ Working | 800 ms debounce, ordered saves, retry, unload warning, Ctrl/⌘+S |
| 1 | Reopen after refresh | ✅ Working | Stored as TipTap JSON + HTML |
| 1 | Dashboard: Owned by me / Shared with me, owner + role badge | ✅ Working | |
| 2 | Toolbar: B / I / U, H1–H3, bullet/numbered lists, undo/redo, active states, shortcuts | ✅ Working | aria-labels, `aria-pressed`, shortcut hints |
| 2 | Paper-like page layout | ✅ Working | Responsive down to phone width |
| 3 | Import .txt / .md / .docx → new doc, 2 MB limit, error handling, toasts | ✅ Working | Images and tables in .docx are not carried over |
| 4 | Share by email (Viewer/Editor), change role, remove | ✅ Working | Target user must have signed in once |
| 4 | Server enforcement: viewer 403, no access 404, owner-only rename/delete/share | ✅ Working | Covered by lib and route-handler tests |
| 4 | "Shared by X / View only" banner | ✅ Working | |
| 5 | Persistence in DB, formatting visible to shared users | ✅ Working | SQLite locally, Turso in prod |
| 6 | Stretch: Export to Markdown | ✅ Working | Client-side, all roles |
| — | Mocked auth with httpOnly cookie, `requireUser()` | ✅ Working | Clearly labelled demo login |
| — | zod on every API route, `{ error }` shape | ✅ Working | |
| — | Tests: permissions, viewer-vs-editor update, txt/md import | ✅ Working | Plus docx, API status codes, export |
| — | ESLint / build passing, `.env.example`, `.gitignore` | ✅ Working | |
| — | Deployed to Vercel + Turso | ⏳ `TODO(me)` | Steps in README → Deploy |
| — | Real-time collaboration, comments, history, real auth | ❌ Not done (out of scope) | See ARCHITECTURE.md → cuts |
