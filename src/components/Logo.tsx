export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" strokeLinecap="round" />
        </svg>
      </span>
      {!compact && <span className="text-lg tracking-tight">Collab Docs</span>}
    </span>
  );
}
