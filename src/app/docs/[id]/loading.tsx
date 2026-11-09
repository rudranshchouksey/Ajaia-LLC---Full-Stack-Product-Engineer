export default function LoadingDocument() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-label="Loading document">
      <div className="h-14 border-b border-slate-200 bg-white" />
      <div className="h-11 border-b border-slate-200 bg-white" />
      <div className="mx-auto mt-8 w-full max-w-[816px] px-4">
        <div className="animate-pulse rounded-sm bg-white px-8 py-12 shadow-sm ring-1 ring-slate-200 sm:px-16">
          <div className="h-8 w-2/3 rounded bg-slate-200" />
          <div className="mt-6 space-y-3">
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 w-11/12 rounded bg-slate-100" />
            <div className="h-4 w-4/5 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
