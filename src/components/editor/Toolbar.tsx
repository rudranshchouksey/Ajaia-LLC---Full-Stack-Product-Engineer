"use client";

import { useEditorState, type Editor } from "@tiptap/react";

type Level = 1 | 2 | 3;

export function Toolbar({ editor }: { editor: Editor | null }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null;
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        heading: ([1, 2, 3] as Level[]).find((level) => e.isActive("heading", { level })) ?? 0,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  // Note: `state` can be null until the editor's first transaction (e.g. right
  // after load), so only the editor's existence gates the buttons.
  const disabled = !editor;
  const chain = () => editor!.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
    >
      <ToolButton label="Undo" shortcut="Ctrl+Z" disabled={disabled || !state?.canUndo} onClick={() => chain().undo().run()}>
        <Icon d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
      </ToolButton>
      <ToolButton label="Redo" shortcut="Ctrl+Shift+Z" disabled={disabled || !state?.canRedo} onClick={() => chain().redo().run()}>
        <Icon d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
      </ToolButton>

      <Divider />

      <label htmlFor="text-style" className="sr-only">
        Text style
      </label>
      <select
        id="text-style"
        disabled={disabled}
        value={state?.heading ?? 0}
        onChange={(e) => {
          const level = Number(e.target.value) as 0 | Level;
          if (level === 0) chain().setParagraph().run();
          else chain().setHeading({ level }).run();
        }}
        title="Text style (Ctrl+Alt+0–3)"
        className="h-8 rounded-md border-0 bg-transparent px-2 text-sm text-slate-700 hover:bg-slate-200/70 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
      >
        <option value={0}>Normal text</option>
        <option value={1}>Heading 1</option>
        <option value={2}>Heading 2</option>
        <option value={3}>Heading 3</option>
      </select>

      <Divider />

      <ToolButton label="Bold" shortcut="Ctrl+B" active={state?.bold} disabled={disabled} onClick={() => chain().toggleBold().run()}>
        <span className="text-[15px] font-bold">B</span>
      </ToolButton>
      <ToolButton label="Italic" shortcut="Ctrl+I" active={state?.italic} disabled={disabled} onClick={() => chain().toggleItalic().run()}>
        <span className="font-serif text-[16px] italic">I</span>
      </ToolButton>
      <ToolButton label="Underline" shortcut="Ctrl+U" active={state?.underline} disabled={disabled} onClick={() => chain().toggleUnderline().run()}>
        <span className="text-[15px] underline underline-offset-2">U</span>
      </ToolButton>

      <Divider />

      <ToolButton label="Bulleted list" shortcut="Ctrl+Shift+8" active={state?.bulletList} disabled={disabled} onClick={() => chain().toggleBulletList().run()}>
        <Icon d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
      </ToolButton>
      <ToolButton label="Numbered list" shortcut="Ctrl+Shift+7" active={state?.orderedList} disabled={disabled} onClick={() => chain().toggleOrderedList().run()}>
        <Icon d="M10 6h10M10 12h10M10 18h10M4 4.5h1.5V9M4 9h3M4 14.5c.5-.7 2.8-.9 2.8.6 0 1-2.8 2.1-2.8 3.4h3" />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  label,
  shortcut,
  active = false,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      aria-keyshortcuts={shortcut?.replace(/Ctrl/g, "Control")}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      // Keep the editor selection when clicking toolbar buttons.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md text-slate-700 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-blue-100 text-blue-800" : "hover:bg-slate-200/70"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-slate-300" />;
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
