"use client";

import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { tiptapToMarkdown, toFileName, type JSONNode } from "@/lib/markdown";

/** Download the current document as Markdown (works for every role, including viewers). */
export function ExportButton({ editor, title }: { editor: Editor | null; title: string }) {
  return (
    <button
      type="button"
      disabled={!editor}
      onClick={() => {
        if (!editor) return;
        const markdown = tiptapToMarkdown(editor.getJSON() as JSONNode);
        const fileName = toFileName(title, "md");
        const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success(`Exported ${fileName}`);
      }}
      title="Export as Markdown (.md)"
      aria-label="Export as Markdown"
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="hidden md:inline">Export .md</span>
    </button>
  );
}
