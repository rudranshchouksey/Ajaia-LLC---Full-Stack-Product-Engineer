"use client";

import { useState } from "react";
import { MAX_TITLE_LENGTH } from "@/lib/limits";

/** Inline-editable document title (owner only; read-only text otherwise). */
export function TitleInput({
  initialTitle,
  editable,
  onChange,
  onCommit,
}: {
  initialTitle: string;
  editable: boolean;
  onChange: (title: string) => void;
  onCommit: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);

  if (!editable) {
    return (
      <h1 className="truncate px-2 py-1 text-lg font-medium text-slate-900" title={title}>
        {title}
      </h1>
    );
  }

  return (
    <input
      aria-label="Document title"
      value={title}
      maxLength={MAX_TITLE_LENGTH}
      placeholder="Untitled document"
      onChange={(e) => {
        setTitle(e.target.value);
        onChange(e.target.value);
        document.title = `${e.target.value.trim() || "Untitled document"} · Collab Docs`;
      }}
      onBlur={() => {
        if (!title.trim()) setTitle("Untitled document");
        onCommit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className="w-full min-w-0 truncate rounded-md border border-transparent px-2 py-1 text-lg font-medium text-slate-900 outline-none hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}
