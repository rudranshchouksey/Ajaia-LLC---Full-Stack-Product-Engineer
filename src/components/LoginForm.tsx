"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api-client";
import { Avatar } from "./Avatar";

type Props = { users: { email: string; name: string }[]; next: string };

export function LoginForm({ users, next }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(loginEmail: string) {
    setPending(loginEmail);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: loginEmail }) });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setPending(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <ul className="space-y-2" aria-label="Test accounts">
        {users.map((u) => (
          <li key={u.email}>
            <button
              type="button"
              onClick={() => login(u.email)}
              disabled={pending !== null}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60"
            >
              <Avatar name={u.name} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-slate-900">{u.name}</span>
                <span className="block truncate text-sm text-slate-500">{u.email}</span>
              </span>
              <span className="text-sm font-medium text-blue-600">
                {pending === u.email ? "Signing in…" : "Continue →"}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or use any email <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) login(email.trim());
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="login-email" className="sr-only">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          disabled={pending !== null}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {pending === email.trim() ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
