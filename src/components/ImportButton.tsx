"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";
import { ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_BYTES } from "@/lib/limits";

const ACCEPT = ALLOWED_UPLOAD_EXTENSIONS.join(",");

/** "Import file": upload .txt/.md/.docx (max 2 MB) -> new document. */
export function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    // Fast client-side checks; the server re-validates everything.
    const ext = file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() ?? "";
    if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
      toast.error(`Unsupported file type${ext ? ` "${ext}"` : ""}. Use .txt, .md or .docx.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(`"${file.name}" is too large. The limit is 2 MB.`);
      return;
    }
    if (file.size === 0) {
      toast.error(`"${file.name}" is empty.`);
      return;
    }

    setBusy(true);
    const toastId = toast.loading(`Importing "${file.name}"…`);
    try {
      const body = new FormData();
      body.append("file", file);
      const { document } = await api<{ document: { id: string; title: string } }>("/api/import", {
        method: "POST",
        body,
      });
      toast.success(`Imported "${document.title}"`, { id: toastId });
      router.push(`/docs/${document.id}`);
    } catch (err) {
      toast.error(`Import failed: ${errorMessage(err)}`, { id: toastId });
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // allow re-selecting the same file
          if (file) void upload(file);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        title="Supported: .txt, .md, .docx (max 2 MB)"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 15V3M7 8l5-5 5 5M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {busy ? "Importing…" : "Import file"}
      </button>
    </>
  );
}
