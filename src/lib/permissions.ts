/**
 * Access-control model, as pure functions with no I/O, so it's trivially testable.
 *
 *   owner  : read, edit content, rename, delete, manage sharing
 *   editor : read, edit content
 *   viewer : read
 *   none   : nothing (API responds 404 so document existence isn't leaked)
 */

export type ShareRole = "viewer" | "editor";
export type Access = "owner" | ShareRole | "none";

export type AccessCheckDoc = {
  ownerId: string;
  shares: ReadonlyArray<{ userId: string; role: ShareRole }>;
};

export function getAccess(doc: AccessCheckDoc, userId: string | null | undefined): Access {
  if (!userId) return "none";
  if (doc.ownerId === userId) return "owner";
  const share = doc.shares.find((s) => s.userId === userId);
  return share ? share.role : "none";
}

export const canView = (a: Access) => a !== "none";
export const canEdit = (a: Access) => a === "owner" || a === "editor";
/** Rename, delete and share are owner-only. */
export const canManage = (a: Access) => a === "owner";
