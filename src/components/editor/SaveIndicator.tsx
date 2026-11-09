"use client";

import type { SaveStatus } from "@/hooks/useAutosave";

export function SaveIndicator({
  status,
  error,
  onRetry,
}: {
  status: SaveStatus;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs whitespace-nowrap">
      {status === "saving" && (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" aria-hidden />
          <span className="sr-only text-slate-500 sm:not-sr-only">Saving…</span>
        </>
      )}
      {status === "unsaved" && (
        <>
          <span className="h-2 w-2 rounded-full bg-amber-400 sm:hidden" aria-hidden />
          <span className="sr-only text-slate-500 sm:not-sr-only">Unsaved changes</span>
        </>
      )}
      {status === "saved" && (
        <>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only text-slate-500 sm:not-sr-only">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <span className="max-w-24 truncate text-red-600 sm:max-w-56" title={error ?? undefined}>
            Not saved: {error ?? "error"}
          </span>
          <button type="button" onClick={onRetry} className="font-medium text-blue-700 underline hover:text-blue-900">
            Retry
          </button>
        </>
      )}
    </div>
  );
}
