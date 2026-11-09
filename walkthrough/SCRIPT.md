# Loom walkthrough script (target 4:30, hard stop 5:00)

Everything below was checked against the real app. I ran the whole flow in a browser (production build, local SQLite) and ran `npm test`.
Strings in `monospace` are the exact UI text. Anything in **[FILL IN]** or **[LIVE URL]** needs you.

| # | Segment | Time | Spoken words |
|---|---|---|---|
| 1 | Intro and scope | 0:00–0:25 | 49 |
| 2 | Create, edit, format, autosave, refresh | 0:25–1:25 | 101 (the rest is typing and clicking) |
| 3 | File upload | 1:25–2:10 | 88 |
| 4 | Sharing and enforcement | 2:10–3:15 | 116 (plus waiting on clicks) |
| 5 | Code tour and `npm test` | 3:15–3:50 | 82 |
| 6 | Deprioritized + what's next | 3:50–4:08 | 46 |
| 7 | AI workflow | 4:08–4:30 | 44 + your two [FILL IN] sentences (~35 words) |

That's 526 scripted words, about 3:53 of speech at 135 words a minute. The rest of the 4:30 is on-screen action, `npm test` running, and your [FILL IN] lines. If you run long, cut the sentence marked *(cuttable)*. You have 30 seconds of slack before 5:00.

---

## 1. Intro and scope (0:00–0:25)

**SCREEN:** Browser tab 1: `[LIVE URL]/login` (or `http://localhost:3000/login` if recording locally). The login page shows the yellow `Demo login.` box and three accounts: Alice Anderson, Bob Brown, Carol Chen. Don't click anything yet.

**SAY:**
> Hi, I'm Rudransh. This is Collab Docs, a small Google-Docs-style editor I built for the take-home. It's Next.js and TypeScript, the TipTap editor, and a libsql database: SQLite locally, Turso in production, deployed on Vercel. I'll show the main flow, a quick code tour, and how I used AI.

**PROVE:** The `Demo login.` banner and the three seeded accounts are visible on screen. Click **Alice Anderson** as you finish the last sentence.

---

## 2. Create, rename, edit, autosave, refresh (0:25–1:25)

**SCREEN:** Dashboard at `/`, logged in as Alice. Then the editor at `/docs/<id>`. Click, in order:
1. Point at the two sections: `Owned by me` and `Shared with me`.
2. Click **`+ New document`**. The title input says `Untitled document`.
3. Click the title, select all, type `Launch plan`, press Enter.
4. Click in the page. Style dropdown (`Normal text`) → **`Heading 1`**. Type `Launch plan`, Enter.
5. Type `This is `, then **Ctrl+B** `bold` **Ctrl+B**, `, `, **Ctrl+I** `italic` **Ctrl+I**, ` and `, **Ctrl+U** `underline` **Ctrl+U**, Enter.
6. Dropdown → **`Heading 2`**, type `Goals`, Enter. Dropdown → **`Heading 3`**, type `Milestones`, Enter. Dropdown → **`Normal text`**.
7. Click the bulleted-list button (tooltip `Bulleted list`). Type `Ship the editor`, Enter, `Add sharing`, Enter, Enter (exits the list).
8. Click the numbered-list button (`Numbered list`). Type `Write tests`, Enter, `Record video`.
9. Stop typing for a second and point at the top-right indicator.
10. Press **F5**.

**SAY:**
> I'm logged in as Alice. This is a demo login, no passwords, on purpose. The dashboard has two sections: Owned by me, and Shared with me. I'll click New document and rename it right here: Launch plan. Heading 1 from this dropdown. Then bold, italic, and underline with shortcuts. Heading 2, Heading 3. A bulleted list, and a numbered list, from the toolbar. Now watch the top right. It says Unsaved changes, then Saving, then Saved. Autosave is debounced, so it doesn't hit the server on every key. Now I'll refresh. The title, headings, formatting, and both lists are still here.

**PROVE:** The indicator moving `Unsaved changes` → `Saving…` → `Saved` (all three states were observed in testing; on localhost "Saving…" is brief, so pause typing and look). After F5, the same page with `Launch plan` as the title, one H1, H2, H3, bold/italic/underline, and both lists.

> Keep the typed text short exactly as above. This segment is the one most likely to run over.

---

## 3. File upload (1:25–2:10)

**SCREEN:** Click the logo or go to `/`. Note the grey text under the buttons: `Import supports .txt, .md and .docx files up to 2 MB.` Then:
1. Click **`Import file`** → choose `fixtures\sample.docx`. A toast appears: `Imported "sample"` and the new doc opens. Title input shows `sample`. Show: H1 `Quarterly report`, H2 `Highlights` and `Next steps`, **bold**, *italic*, underlined text, a bulleted and a numbered list.
2. Go back to `/`. Click **`Import file`** → choose `fixtures\corrupt.docx`. A red toast appears: `Import failed: Couldn't read this .docx file. It may be corrupt or password-protected.` You stay on the dashboard.

**SAY:**
> Back on the dashboard. Import file takes dot txt, dot md, or dot docx, up to two megabytes. It says so right here. I'll pick sample dot docx. It opens as a new document, titled from the file name, and the headings, bold, italic, underline, and both list types came through. Now the error case: corrupt dot docx. I get a clear message in a toast and I stay on the dashboard. Nothing gets created. Empty files, too-large files, and wrong file types get their own messages too. *(cuttable)*

**PROVE:** The green `Imported "sample"` toast plus a formatted document, then the red `Import failed:` toast and the dashboard unchanged. ("Nothing gets created" was verified: the owned-document count stayed the same after three failed uploads.)

> Optional if you have time (not in the timed script): `fixtures\sample.md` opens as `Project kickoff` (title field shows `sample`); `fixtures\sample.txt` opens as 3 paragraphs.

---

## 4. Sharing and server-side enforcement (2:10–3:15)

**SCREEN:** Use **two windows side by side**: normal window = Alice, incognito window = Bob (see checklist). Click, in order:
1. **Alice:** open `Launch plan` (click it under `Owned by me`). Click **`Share`** (top right). Dialog title: `Share "Launch plan"`.
2. In `Add people by email` type `bob@example.com`, set the role dropdown to **`Viewer`**, click **`Share`**. Green text under the form: `Shared with bob@example.com as viewer`. The list under `People with access` shows Bob Brown.
3. **Bob (incognito):** already logged in as Bob. Refresh the dashboard. `Launch plan` is under `Shared with me`: `Owned by Alice Anderson` and a `View only` badge. Open it.
4. Point at the blue banner: `Shared by Alice Anderson · View only. You can read this document but not edit it.` No toolbar, no Share button, the title is plain text, and typing does nothing.
5. **Bob:** open the browser console (F12) and paste the PATCH snippet from the checklist. It prints `403 {"error":"You have view-only access to this document"}`.
6. **Alice:** in the dialog change Bob's role dropdown to **`Editor`**. Green text: `Bob Brown is now an editor`. Close the dialog (Esc).
7. **Bob:** press F5. Banner now: `Shared by Alice Anderson · You can edit this document. Only the owner can rename or share it.` The toolbar appears. Click at the end of the text, press Enter, type `Bob added this line.` Wait for `Saved`.
8. **Alice:** press F5. `Bob added this line.` is there.

**SAY:**
> Now sharing. In Launch plan I click Share and add Bob as a Viewer. The dialog confirms it. In the incognito window I'm Bob. The doc is under Shared with me, owner Alice, with a View only badge. I open it: Shared by Alice, View only. No toolbar, I can't rename, and the editor is read-only. But that's not just the interface. If I call the API from the console as a viewer, the server answers 403: you have view-only access. Back as Alice, I change Bob to Editor. Bob refreshes, and now he can edit. He types a line, it autosaves, and when Alice refreshes, it's there. Only the owner can rename, delete, or share.

**PROVE:** (a) the `View only` badge and banner on Bob's screen with no toolbar; (b) the console output `403 {"error":"You have view-only access to this document"}`; (c) Bob's line `Bob added this line.` appearing on Alice's page after refresh.

> Heads up (verified): role changes are **not live**. Bob's open page stays read-only until he refreshes, so say "Bob refreshes". Don't wait for it to change by itself.

---

## 5. Code tour and `npm test` (3:15–3:50)

**SCREEN:** VS Code, files already open as tabs in this order. Keep each on screen 5 to 8 seconds:
1. `src\lib\permissions.ts`: `getAccess` (line 18) and the three helpers `canView` / `canEdit` / `canManage` (lines 25–28).
2. `src\lib\documents.ts`: `updateDocument` (line 157). The two 403 messages are at lines 165 and 168.
3. `src\lib\import.ts`: `convertUpload` (line 89). The 2 MB check is at line 97, and the mammoth call at line 78.
4. `tests\documents.test.ts`: the first test, `rejects content updates from a viewer with 403 and leaves the doc unchanged` (line 21).
5. Terminal in the project root: run `npm test`. It takes about 4 seconds.

**SAY:**
> Quick code tour. permissions dot ts is one pure function, getAccess, that returns owner, editor, viewer, or none. The checks live in documents dot ts, inside the data layer, so no API route can skip them. import dot ts checks type, size, and empty files, then converts docx with mammoth and markdown with markdown-it. Now the tests. [run `npm test`] Forty-eight tests across five files: permissions, the data layer against a real SQLite database, route handlers that return 403 for viewers, import, and Markdown export.

**PROVE:** The terminal ends with `Test Files  5 passed (5)` and `Tests  48 passed (48)`.

---

## 6. Deprioritized and what's next (3:50–4:08)

**SCREEN:** Open `ARCHITECTURE.md` and scroll to the headings **What I deliberately cut** and **What I'd build next with 2–4 more hours**. (Or just stay on the terminal.)

**SAY:**
> I cut real auth, real-time collaboration, comments, version history, and PDF export, to keep the core solid. Right now, two people editing at once is last-write-wins. With two to four more hours I'd add Yjs real-time collaboration with presence, version history, link sharing, and real auth.

**PROVE:** The two headings on screen, matching what you say.

---

## 7. AI workflow (4:08–4:30)

**SCREEN:** Open `AI_WORKFLOW.md`, scroll to the headings **AI tools used** and **How I verified correctness, UX and reliability**. Keep it on screen.

**SAY:**
> I used Claude Code for the scaffold, API routes, tests, and docs. **[FILL IN: one thing you reviewed and changed or rejected, e.g. a UI choice, a scope cut, or code you rewrote. Say what you saw and why you changed it.]** To verify, I ran lint, the tests, and the build, then clicked through every flow in a real browser. That caught bugs the tests missed, like docx underline being dropped on import. **[FILL IN: one sentence on where you did not trust the output and checked it yourself.]**

**PROVE:** `AI_WORKFLOW.md` on screen with the sections visible.

> Facts available for you to draw on (from the session notes in `AI_WORKFLOW.md`, drafted from the build log, so confirm you're comfortable claiming them): the first autosave hook was rejected by the React lint rules and restructured into a plain `AutosaveController` class; the Share dialog had a bug where a slow response cleared an email typed meanwhile; and the toolbar looked disabled until the first click. `AI_WORKFLOW.md` still has `TODO(me)` placeholders in its personal sections, so fill those in before submitting. Don't claim anything you didn't see.

---

# Pre-recording checklist

**Run order (do these once, before pressing record):**

1. **Decide the target.** Best: the live Vercel URL. Otherwise record locally with the production build, which has no Next.js dev badge:
   ```powershell
   cd C:\Users\ad\Desktop\Ajiia
   npm run build
   npm run start        # http://localhost:3000
   ```
   If your `npm run dev` server is still running on port 3000, stop it first (Ctrl+C in its terminal).
2. **Reset the demo data** (this deletes ALL users, sessions, documents and shares in whichever database `.env.local` points to, which is your Turso database, then reloads the seed):
   ```powershell
   npm run seed
   ```
   Local-only database instead: `$env:DATABASE_URL="file:./data/app.db"; $env:DATABASE_AUTH_TOKEN=""; npm run seed`. The reset also deletes sessions, so **you will be logged out and must log in again**. Re-run it before every retake: it removes the `Launch plan` and `sample` docs.
3. **Browser:** a clean Chrome profile with no extensions (Grammarly and similar inject into pages). Zoom **110%** at 1080p. Hide the bookmarks bar. Close other tabs.
4. **Notifications off:** Windows Do Not Disturb / Focus Assist, and quit Slack, email and chat.
5. **Hide secrets:** never open `.env.local` on screen, the Turso dashboard or token page, or the Vercel environment variables page. In VS Code, close `.env.local` and collapse nothing else needed. Don't run `git remote -v` or `type .env.local` on camera.

**Windows and tabs, in order:**

| Window | Tab / file | Used in |
|---|---|---|
| Chrome (normal) | 1. `[LIVE URL]/login` (or `http://localhost:3000/login`) | 1–4 |
| Chrome **incognito** | `[LIVE URL]/login`, log in as **Bob Brown** now, then go to the dashboard | 4 |
| VS Code | `src\lib\permissions.ts`, `src\lib\documents.ts`, `src\lib\import.ts`, `tests\documents.test.ts` (open in this order) | 5 |
| VS Code | `ARCHITECTURE.md`, `AI_WORKFLOW.md` (as tabs, or switch via the file explorer) | 6, 7 |
| Terminal | in `C:\Users\ad\Desktop\Ajiia`, cleared, ready to type `npm test` | 5 |
| File dialog | pre-navigate once to `C:\Users\ad\Desktop\Ajiia\fixtures` so the picker opens there | 3 |

**Accounts:** **Alice** in the normal window (the main actor). **Bob** in the incognito window (separate cookies). Carol isn't needed for the timed script.

Put the normal and incognito windows side by side (Win+Left / Win+Right) so you never switch tabs while sharing.

**Console snippet for Bob (segment 4), saved in a text file or your clipboard:**
```js
fetch(location.pathname.replace('/docs/','/api/documents/'), {method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({content:{json:{type:'doc',content:[]},html:''}})}).then(async r => console.log(r.status, await r.text()))
```
Expected output: `403 {"error":"You have view-only access to this document"}`. If Chrome blocks pasting, type `allow pasting` in the console once, before recording. (Run it before upgrading Bob to Editor. As an editor the same call would succeed and **blank the document**.)

---

# Demo data cheat sheet

**Seeded users** (any other email also works and creates an empty account):

| User | Email |
|---|---|
| Alice Anderson | `alice@example.com` |
| Bob Brown | `bob@example.com` |
| Carol Chen | `carol@example.com` |

**Seeded documents and who can do what:**

| Document | Owner | Alice | Bob | Carol |
|---|---|---|---|---|
| Welcome to Collab Docs | Alice | owner | **Can edit** | **View only** |
| Alice's private notes | Alice | owner | no access (404) | no access (404) |
| Design sync: meeting notes | Bob | **Can edit** | owner | no access |
| Reading list | Carol | **View only** | no access | owner |

After the demo, Launch plan (created live) is owned by Alice and shared with Bob.

**Fixture files** (`C:\Users\ad\Desktop\Ajiia\fixtures\`):

| File | Use | What you should see |
|---|---|---|
| `sample.docx` | **Success case** | Toast `Imported "sample"`. H1 `Quarterly report`; H2 `Highlights` + bullets `Revenue up 12%`, `Two new hires`; H2 `Next steps` + numbered `Finalize budget`, `Plan offsite`; bold `imported from Word`, italic, underline |
| `corrupt.docx` | **Error case** | Red toast `Import failed: Couldn't read this .docx file. It may be corrupt or password-protected.`; no new document |
| `sample.md` | Optional | H1 `Project kickoff`; H2 `Goals`, `Plan`; 3 bullets; 3 numbered items; H3 `Notes`. The `<script>` text shows as literal text |
| `sample.txt` | Optional | 3 paragraphs, starting `Meeting notes, plain text` |
| `empty.txt` | Optional error | Toast `"empty.txt" is empty.` |
| `not-a-docx.docx` | Optional error | Server message `This .docx file is corrupt or isn't really a Word document.` (verified through the API) |

All three samples import with the title `sample`, so repeated imports pile up identically named documents. Reset between takes.

---

# If something breaks on camera

1. **Save indicator shows `Not saved: …` with a `Retry` link.** Click **Retry**. It also retries on its own every 5 seconds. If the database is unreachable (Turso/network), switch to localhost and say "I'll show this locally."
2. **The dashboard has leftover docs (`Launch plan`, several `sample`s) or you're logged out.** Stop recording or pause, run `npm run seed`, log in again (the reset clears sessions), and retake the segment.
3. **Bob's page is still read-only after you upgraded him.** Not a bug: role changes aren't live. Press **F5** in Bob's window. Say "he refreshes" and move on.
4. **A "Share" error `No user with email …`.** The target must have logged in once. Use the seeded `bob@example.com` exactly. You can also click the `bob@example.com` shortcut link under the email field.
5. **The file picker doesn't show the fixtures or the app shows `Something went wrong`.** In the picker, paste `C:\Users\ad\Desktop\Ajiia\fixtures\sample.docx` into the file name box. On the error page, click **Try again**; if it persists, check the database connection (offscreen) and fall back to localhost.

---

# Honest-scoping lines

1. "Two people editing the same document at once isn't real-time. The last save wins, and that's the first thing I'd fix with Yjs."
2. "The login is a demo login on purpose, so you can switch users in one click. Real auth would plug into the same `requireUser` helper."
3. "Import handles text, headings, and lists well. Images and tables inside Word files aren't carried over."

---

# After recording

1. Copy the Loom share link into **`walkthrough/video-url.txt`** (replace the placeholder line).
2. Put the same link in **`SUBMISSION.md`** on the `Walkthrough video:` line (line 4), replacing `TODO(me): <link>`.
3. Loom sharing settings: **Anyone with the link can view**, no password, no expiry. Comments on is fine. Turn off "Allow download" only if you prefer. Open the link in a **private window** to confirm it plays without logging in.
4. Also replace the live-URL placeholders in `README.md` (line 11) and `SUBMISSION.md` (line 3) once the Vercel deployment is up.
5. Commit and push:
   ```powershell
   git add walkthrough SUBMISSION.md README.md
   git commit -m "Add walkthrough video link"
   git push
   ```

---

# Issues found

Found while verifying (none of these needed an app code change; I did not modify any source files):

1. **Role changes aren't live.** After the owner upgrades Bob from Viewer to Editor, Bob's open page stays read-only until he refreshes. The script says "Bob refreshes."
2. **Duplicate `sample` titles.** `sample.docx`, `sample.md` and `sample.txt` all import with the title `sample`, so several imports create several identical rows. Reset between takes, or rename in the title field.
3. **Live URL not set.** `README.md` line 11 and `SUBMISSION.md` line 3 still have placeholders, so this script uses **[LIVE URL]**. I couldn't verify the deployed app, only a local production build.
4. **`AI_WORKFLOW.md` has `TODO(me)` placeholders** in its personal sections. Segment 7 has two **[FILL IN]** prompts for the same reason.
5. **Verification setup:** the flows were checked on a production build against a local SQLite file (not Turso, not the live site). Earlier in this project, API-level checks against your Turso database passed (create, save, share, 403, 404, import), but the full browser flow wasn't re-run there. On Turso each save is about 0.5–1 s slower (database region is Mumbai), so `Saving…` stays visible longer.
6. **Dev-mode noise:** `npm run dev` shows a Next.js badge in the corner. Record against `npm run start` or the live URL.
7. **`walkthrough/video-url.txt` didn't exist.** I created it with a placeholder.
