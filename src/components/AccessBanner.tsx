import type { Access } from "@/lib/permissions";

/** Shown to non-owners: who shared the doc and what they can do. */
export function AccessBanner({ ownerName, access }: { ownerName: string; access: Access }) {
  const viewOnly = access === "viewer";
  return (
    <div
      role="note"
      className={`border-b px-4 py-2 text-center text-sm ${
        viewOnly ? "border-sky-200 bg-sky-50 text-sky-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      Shared by <strong className="font-semibold">{ownerName}</strong>
      {viewOnly ? (
        <>
          {" "}
          · <strong className="font-semibold">View only</strong>. You can read this document but not edit it.
        </>
      ) : (
        <> · You can edit this document. Only the owner can rename or share it.</>
      )}
    </div>
  );
}
