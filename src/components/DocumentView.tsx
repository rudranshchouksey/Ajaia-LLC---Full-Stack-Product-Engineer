"use client";

import { EditorContent, useEditor, type Content } from "@tiptap/react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { useAutosave } from "@/hooks/useAutosave";
import type { DocumentDetail } from "@/lib/documents";
import { canEdit, canManage } from "@/lib/permissions";
import type { User } from "@/lib/users";
import { AccessBanner } from "./AccessBanner";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { getExtensions } from "./editor/extensions";
import { SaveIndicator } from "./editor/SaveIndicator";
import { TitleInput } from "./editor/TitleInput";
import { Toolbar } from "./editor/Toolbar";

export function DocumentView({ doc, user }: { doc: DocumentDetail; user: User }) {
  const editable = canEdit(doc.access);
  const isOwner = canManage(doc.access);
  // useEditor is created before useAutosave (which needs the editor), so the
  // change callback is wired through a ref.
  const onChangeRef = useRef<() => void>(() => {});

  const editor = useEditor({
    extensions: getExtensions(editable ? "Start writing…" : ""),
    // Prefer the canonical TipTap JSON; imported/seeded docs only have HTML until first edit.
    content: (doc.contentJson as Content) ?? doc.contentHtml,
    editable,
    immediatelyRender: false, // avoid SSR hydration mismatches
    editorProps: {
      attributes: {
        class: "ProseMirror",
        "aria-label": "Document content",
        ...(editable ? {} : { "aria-readonly": "true" }),
      },
    },
    onUpdate: () => onChangeRef.current(),
  });

  const getContent = useCallback(() => {
    if (!editor || editor.isDestroyed) return null;
    return { json: editor.getJSON(), html: editor.getHTML() };
  }, [editor]);

  const { status, error, markContentChanged, setTitle, flush, retry } = useAutosave(doc.id, getContent);

  useEffect(() => {
    onChangeRef.current = markContentChanged;
  }, [markContentChanged]);

  // Ctrl/Cmd+S saves immediately instead of opening the browser's save dialog.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void flush();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flush]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <Link
            href="/"
            onClick={() => void flush()}
            className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="Back to documents"
            title="Back to documents"
          >
            <Logo compact />
          </Link>
          <div className="min-w-0 flex-1">
            <TitleInput
              initialTitle={doc.title}
              editable={isOwner}
              onChange={setTitle}
              onCommit={() => void flush()}
            />
          </div>
          {editable && <SaveIndicator status={status} error={error} onRetry={retry} />}
          <div className="flex shrink-0 items-center gap-2 pl-1">
            <span title={`Signed in as ${user.email}`}>
              <Avatar name={user.name} size="sm" />
            </span>
          </div>
        </div>
        {editable && (
          <div className="flex justify-center overflow-x-auto border-t border-slate-100 px-3 py-1.5">
            <Toolbar editor={editor} />
          </div>
        )}
      </header>

      {!isOwner && <AccessBanner ownerName={doc.owner.name} access={doc.access} />}

      <main className="flex-1 px-2 py-6 sm:px-4 sm:py-10">
        <article
          className="doc-content mx-auto w-full max-w-[816px] rounded-sm bg-white px-6 py-10 shadow-[0_1px_3px_rgba(15,23,42,0.08),0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 sm:px-16 sm:py-16"
          onClick={() => editable && editor && !editor.isFocused && editor.commands.focus()}
        >
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="min-h-[60vh] animate-pulse space-y-3" aria-busy="true" aria-label="Loading editor">
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
