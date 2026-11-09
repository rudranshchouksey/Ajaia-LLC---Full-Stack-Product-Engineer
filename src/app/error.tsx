"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">
          We couldn&apos;t load this page. It may be a temporary problem. Please try again.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Error ID: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try again
          </button>
          <Link href="/" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Back to documents
          </Link>
        </div>
      </div>
    </main>
  );
}
