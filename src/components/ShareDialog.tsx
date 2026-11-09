"use client";

import { useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api-client";
import type { Share } from "@/lib/documents";
import type { ShareRole } from "@/lib/permissions";
import type { User } from "@/lib/users";
import { Avatar } from "./Avatar";

type Props = { documentId: string; documentTitle: string; owner: User };

/** Owner-only share dialog: add by email, change role, remove access. */
export function ShareButton({ documentId, documentTitle, owner }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [shares, setShares] = useState<Share[] | null>(null);
  const [directory, setDirectory] = useState<User[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [busy, setBusy] = useState<string | null>(null); // which action is running
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const base = `/api/documents/${documentId}/shares`;

  async function open() {
    dialogRef.current?.showModal();
    emailRef.current?.focus();
    setLoadError(null);
    setNotice(null);
    try {
      const [s, u] = await Promise.all([
        api<{ shares: Share[] }>(base),
        api<{ users: User[] }>("/api/users").catch(() => ({ users: [] as User[] })),
      ]);
      setShares(s.shares);
      setDirectory(u.users);
    } catch (err) {
      setLoadError(errorMessage(err));
    }
  }

  // Feedback is shown inside the dialog: toasts would render underneath the
  // modal's top layer / backdrop.
  async function run(key: string, fn: () => Promise<{ shares: Share[] }>, success: string) {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fn();
      setShares(res.shares);
      setNotice({ ok: true, text: success });
      return true;
    } catch (err) {
      setNotice({ ok: false, text: errorMessage(err) });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    const target = email.trim().toLowerCase();
    if (!target) return;
    const existing = shares?.find((s) => s.email === target);
    const ok = await run(
      "add",
      () => api(base, { method: "POST", body: JSON.stringify({ email: target, role }) }),
      existing ? `Updated ${target} to ${role}` : `Shared with ${target} as ${role}`,
    );
    // Only clear if the user hasn't started typing another address meanwhile.
    if (ok) setEmail((current) => (current.trim().toLowerCase() === target ? "" : current));
  }

  const suggestions = directory.filter((u) => u.id !== owner.id && !shares?.some((s) => s.userId === u.id));

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Share"
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 sm:px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">Share</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="share-title"
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/40"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="share-title" className="text-lg font-semibold text-slate-900">
              Share &ldquo;<span className="break-all">{documentTitle}</span>&rdquo;
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
              className="-mr-2 -mt-1 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <form onSubmit={addShare} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="share-email" className="sr-only">
              Email address
            </label>
            <input
              ref={emailRef}
              id="share-email"
              type="email"
              required
              list="share-suggestions"
              autoComplete="off"
              placeholder="Add people by email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <datalist id="share-suggestions">
              {suggestions.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name}
                </option>
              ))}
            </datalist>
            <div className="flex gap-2">
              <label htmlFor="share-role" className="sr-only">
                Role
              </label>
              <select
                id="share-role"
                value={role}
                onChange={(e) => setRole(e.target.value as ShareRole)}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={busy !== null}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy === "add" ? "Sharing…" : "Share"}
              </button>
            </div>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            The person must have signed in at least once. Try{" "}
            {["bob@example.com", "carol@example.com"].map((e, i) => (
              <span key={e}>
                {i > 0 && " or "}
                <button type="button" className="font-medium text-blue-700 hover:underline" onClick={() => setEmail(e)}>
                  {e}
                </button>
              </span>
            ))}
            .
          </p>
          <p
            role="status"
            aria-live="polite"
            className={`mt-3 min-h-5 text-sm ${notice?.ok ? "text-emerald-700" : "text-red-600"}`}
          >
            {notice?.text}
          </p>

          <h3 className="mt-3 text-sm font-semibold text-slate-700">People with access</h3>
          <ul className="mt-2 divide-y divide-slate-100" aria-busy={shares === null && !loadError}>
            <li className="flex items-center gap-3 py-2.5">
              <Avatar name={owner.name} size="sm" />
              <PersonLabel name={`${owner.name} (you)`} email={owner.email} />
              <span className="text-sm text-slate-500">Owner</span>
            </li>
            {loadError && (
              <li role="alert" className="py-3 text-sm text-red-600">
                Couldn&apos;t load collaborators: {loadError}
              </li>
            )}
            {shares === null && !loadError && <li className="py-3 text-sm text-slate-400">Loading…</li>}
            {shares?.length === 0 && (
              <li className="py-3 text-sm text-slate-500">Not shared with anyone yet.</li>
            )}
            {shares?.map((s) => (
              <li key={s.userId} className="flex items-center gap-3 py-2.5">
                <Avatar name={s.name} size="sm" />
                <PersonLabel name={s.name} email={s.email} />
                <label htmlFor={`role-${s.userId}`} className="sr-only">
                  Role for {s.email}
                </label>
                <select
                  id={`role-${s.userId}`}
                  value={s.role}
                  disabled={busy !== null}
                  onChange={(e) => {
                    const next = e.target.value as ShareRole;
                    void run(
                      `role-${s.userId}`,
                      () => api(`${base}/${s.userId}`, { method: "PATCH", body: JSON.stringify({ role: next }) }),
                      `${s.name} is now ${next === "editor" ? "an editor" : "a viewer"}`,
                    );
                  }}
                  className="rounded-md border border-slate-200 px-1.5 py-1 text-sm"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="button"
                  aria-label={`Remove access for ${s.email}`}
                  title="Remove access"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(
                      `remove-${s.userId}`,
                      () => api(`${base}/${s.userId}`, { method: "DELETE" }),
                      `Removed ${s.name}`,
                    )
                  }
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}

function PersonLabel({ name, email }: { name: string; email: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-slate-900">{name}</span>
      <span className="block truncate text-xs text-slate-500">{email}</span>
    </span>
  );
}
