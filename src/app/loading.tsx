export default function LoadingDashboard() {
  return (
    <div className="flex flex-1 flex-col" aria-busy="true" aria-label="Loading">
      <div className="h-14 border-b border-slate-200 bg-white" />
      <div className="mx-auto w-full max-w-5xl animate-pulse space-y-4 px-4 py-8">
        <div className="h-7 w-40 rounded bg-slate-200" />
        <div className="h-40 rounded-xl bg-white ring-1 ring-slate-200" />
        <div className="h-28 rounded-xl bg-white ring-1 ring-slate-200" />
      </div>
    </div>
  );
}
