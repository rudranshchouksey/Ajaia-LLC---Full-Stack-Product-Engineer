import type { Access } from "@/lib/permissions";

const STYLES: Record<Exclude<Access, "none">, string> = {
  owner: "bg-slate-100 text-slate-700 ring-slate-200",
  editor: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  viewer: "bg-sky-50 text-sky-700 ring-sky-200",
};

const LABELS: Record<Exclude<Access, "none">, string> = {
  owner: "Owner",
  editor: "Can edit",
  viewer: "View only",
};

export function RoleBadge({ access }: { access: Access }) {
  if (access === "none") return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[access]}`}>
      {LABELS[access]}
    </span>
  );
}
