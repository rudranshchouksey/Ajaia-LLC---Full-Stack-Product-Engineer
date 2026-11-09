"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";
import type { DocumentSummary } from "@/lib/documents";
import { formatDateTime, timeAgo } from "@/lib/format";
import { ImportButton } from "./ImportButton";
import { RoleBadge } from "./RoleBadge";

type Props = { owned: DocumentSummary[]; shared: DocumentSummary[]; userName: string };

export function Dashboard({ owned, shared, userName }: Props) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());

  async function createDocument() {
    setCreating(true);
    try {
      const { document } = await api<{ document: { id: string } }>("/api/documents", {
        method: "POST",
        body: JSON.stringify({}),
      });
      router.push(`/docs/${document.id}`);
    } catch (err) {
      toast.error(`Couldn't create document: ${errorMessage(err)}`);
      setCreating(false);
    }
  }

  async function deleteDocument(doc: DocumentSummary) {
    if (!window.confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    setDeleted((s) => new Set(s).add(doc.id));
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      toast.success(`Deleted "${doc.title}"`);
      router.refresh();
    } catch (err) {
      setDeleted((s) => {
        const next = new Set(s);
        next.delete(doc.id);
        return next;
      });
      toast.error(`Couldn't delete: ${errorMessage(err)}`);
    }
  }

  const visibleOwned = owned.filter((d) => !deleted.has(d.id));

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, {userName.split(" ")[0]}.</p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <ImportButton />
            <button
              type="button"
              onClick={createDocument}
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
            >
              <span aria-hidden className="text-base leading-none">+</span>
              {creating ? "Creating…" : "New document"}
            </button>
          </div>
          <p className="text-xs text-slate-500">Import supports .txt, .md and .docx files up to 2 MB.</p>
        </div>
      </div>

      <Section
        title="Owned by me"
        count={visibleOwned.length}
        empty={
          <>
            You don&apos;t own any documents yet. Click <strong>New document</strong> or import a file to get started.
          </>
        }
      >
        {visibleOwned.map((doc) => (
          <DocRow key={doc.id} doc={doc} onDelete={() => deleteDocument(doc)} />
        ))}
      </Section>

      <Section
        title="Shared with me"
        count={shared.length}
        empty="Nothing has been shared with you yet. When someone shares a document with your email, it shows up here."
      >
        {shared.map((doc) => (
          <DocRow key={doc.id} doc={doc} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{count}</span>
      </h2>
      {count === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-sm text-slate-500">
          {empty}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {children}
        </ul>
      )}
    </section>
  );
}

function DocRow({ doc, onDelete }: { doc: DocumentSummary; onDelete?: () => void }) {
  const isShared = doc.access !== "owner";
  return (
    <li className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
      <DocIcon />
      <div className="min-w-0 flex-1">
        <Link
          href={`/docs/${doc.id}`}
          className="block truncate font-medium text-slate-900 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          {doc.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {isShared && <>Owned by {doc.owner.name} · </>}
          <span title={formatDateTime(doc.updatedAt)} suppressHydrationWarning>
            Edited {timeAgo(doc.updatedAt)}
          </span>
        </p>
      </div>
      {isShared && <RoleBadge access={doc.access} />}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${doc.title}`}
          className="rounded-md p-1.5 text-slate-400 opacity-100 hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </li>
  );
}

function DocIcon() {
  return (
    <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h4" strokeLinecap="round" />
      </svg>
    </span>
  );
}
