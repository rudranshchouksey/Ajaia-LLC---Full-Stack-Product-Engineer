# Walkthrough video script (3–5 minutes)

> An outline, not a teleprompter: say it in your own words. Times are targets. Have two browser
> windows ready (normal + incognito) so you can be Alice and Bob/Carol side by side without logging out.

## 0:00–0:20 · Intro

- "This is Collab Docs, a lightweight Google-Docs-style editor: rich text, autosave, file import and
  role-based sharing. Next.js 16, TipTap, libsql/Turso, deployed on Vercel."
- Point out that the login is a **demo login**, deliberately passwordless to make review fast.

## 0:20–1:30 · Main flow as Alice

- Log in as **Alice**. On the dashboard, show **Owned by me** vs **Shared with me**, the owner names and the *Can edit* /
  *View only* badges. This is all seed data, so the first screen shows every feature.
- **New document** → rename it inline → type, then use the toolbar and keyboard shortcuts: heading, bold/italic/underline,
  a bullet list and a numbered list, undo/redo. Point at the **Saving… → Saved** indicator.
- **Refresh**: the formatting persists.
- **Import file** → `fixtures/sample.docx`. It opens as a new document with headings, lists and underline intact.
  Optionally show `corrupt.docx` producing a clear error toast.

## 1:30–2:45 · Sharing, enforced on the server

- **Share** → add Bob as **Editor** and Carol as **Viewer**.
- In the incognito window, log in as **Bob**: the doc is under *Shared with me*. Open it: the "Shared by Alice"
  banner shows, he can edit and it autosaves, and there's no rename or Share.
- Log in as **Carol**: **View only** banner, no toolbar, read-only editor.
- Show the server enforcement: run the `fetch(... PATCH ...)` from the README in Carol's console, and it returns **403**.
  Mention that users without access get **404**, so private docs aren't even confirmed to exist.
- Back as Alice, remove Carol, and Carol's refresh shows "Document not found".
- **Export .md** (works for viewers too).

## 2:45–3:45 · Key decisions

- **Permissions:** one pure `getAccess()` function, with enforcement inside the data layer so no route can skip it.
  Covered by unit tests and route-handler tests (viewer 403, editor 200).
- **Autosave:** debounced, a single request in flight, queued edits, retry, and a warning before losing work.
- **Storage:** TipTap JSON as the source of truth plus HTML for interop. libsql means the same code runs on a local SQLite
  file and on Turso in production.
- **Import:** server-side conversion, but the editor's schema sanitizes the result. Markdown raw HTML is disabled.

## 3:45–4:30 · What I deprioritized, and what's next

- Cut: real auth, real-time collaboration (concurrent edits are last-write-wins), comments, version history,
  link sharing, PDF export.
- Next with 2–4 hours: Yjs + TipTap Collaboration with presence, version snapshots, link sharing, and Auth.js.

## 4:30–5:00 · AI usage

- `TODO(me)`: summarize honestly from AI_WORKFLOW.md: what Claude Code did, what you reviewed and changed,
  and one example where running the app in a browser caught a bug the unit tests didn't (for example the Share-dialog
  race or the mammoth underline).
