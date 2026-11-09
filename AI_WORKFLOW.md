# AI workflow

> **Note to self:** everything marked `TODO(me)` must be filled in personally, from what actually
> happened. The "Session notes" section was drafted by the AI from its own build log. Check each point and
> delete anything you can't vouch for. Don't add claims you didn't observe.

## AI tools used

- **Claude Code** (Anthropic's CLI agent): scaffolding, implementation, tests, docs, and driving a
  headless browser to check the UI flows.
- `TODO(me)`: any other tools (editor autocomplete, ChatGPT, etc.), or "none".

## How I used it

- `TODO(me)`: describe the setup, for example: I gave it a detailed spec (stack, features, quality bar, process)
  and had it work in phases, with lint, tests and build plus a manual check after each phase.
- `TODO(me)`: how much you steered, reviewed or intervened between phases.

## Where AI sped me up

- `TODO(me)`: your own assessment. Candidates to consider (keep only what's true for you):
  - Boilerplate: Next.js route handlers, zod schemas, Tailwind UI states.
  - Test scaffolding (temp-DB setup, route-handler tests with a mocked session).
  - Fixture generation (a real `.docx` built with JSZip instead of committing a binary from Word).
  - Docs first drafts.

## What AI output I changed or rejected

- `TODO(me)`: list concrete things *you* changed after reviewing, for example wording, UI choices, scope cuts,
  or code you rewrote. If you changed nothing in some area, say so honestly.

## How I verified correctness, UX and reliability

- Automated: `npm test` (48 Vitest tests: permissions, data layer on a real SQLite DB, route handlers,
  import, Markdown export), `npm run lint`, `npm run typecheck`, `npm run build`.
- `TODO(me)`: your own manual pass, for example which flows you clicked through, browsers and devices, and the
  deployed URL check.
- `TODO(me)`: anything you double-checked in the code yourself (for example `src/lib/documents.ts` permission
  checks).

## Session notes (drafted by the AI from its build log; verify before keeping)

These are things that happened during the Claude Code session that may be worth mentioning:

- **The framework version differed from the model's training data.** The scaffold installed Next.js 16.4 with
  `cacheComponents` enabled, and the project's `AGENTS.md` warned that its APIs differ. The agent read the
  bundled Next docs before writing code, and as a result it turned `cacheComponents` off (session-driven pages), used
  `params: Promise<…>`, and used `retry` (not `reset`) in `error.tsx`.
- **The React Compiler lint rules rejected the first autosave hook** (a recursive `useCallback`, then ref and
  `useState` mutation patterns). The hook was restructured into a plain `AutosaveController` class wrapped
  by a thin hook.
- **Bugs found by actually running the UI in a headless browser** (Playwright driving local Chrome), not by
  the unit tests:
  - The Share dialog cleared the email field after a slow request finished, wiping an address the user had
    typed in the meantime. Fixed by clearing only if the field still holds the submitted email.
  - Toasts render underneath a modal `<dialog>` (top layer), so Share-dialog feedback was moved inline.
  - The toolbar looked disabled until the first click in the editor (`useEditorState` returns `null` before the
    first transaction).
  - mammoth drops underline by default. Fixed with a `u => u` style map, and a test now covers it.
- **Test flakiness that wasn't an app bug:** an undo/redo check failed because ProseMirror groups
  keystrokes typed within 500 ms into one history step, and the script typed faster than a human.
  The check was adjusted, and redo was confirmed to survive an autosave.
- The browser verification scripts lived outside the repo (scratchpad) and are **not committed**.

`TODO(me)`: add your own reflections: what worked well, what you'd do differently, where you didn't trust
the output and why.
