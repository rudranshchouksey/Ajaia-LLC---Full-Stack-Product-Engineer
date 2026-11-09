import { getDb, newId } from "./db";
import { forbidden, notFound, badRequest } from "./http";
import { getAccess, canEdit, canManage, type Access, type ShareRole } from "./permissions";
import { DEFAULT_TITLE, MAX_TITLE_LENGTH } from "./limits";
import { getUserByEmail, normalizeEmail } from "./users";

/**
 * Document data layer. Every function takes the acting user's id and enforces
 * access itself, so API routes can't "forget" a permission check.
 */

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: number;
  owner: { id: string; name: string; email: string };
  access: Access;
};

export type DocumentDetail = DocumentSummary & {
  contentJson: unknown | null;
  contentHtml: string;
  createdAt: number;
};

export type Share = {
  userId: string;
  email: string;
  name: string;
  role: ShareRole;
};

export { DEFAULT_TITLE, MAX_TITLE_LENGTH };

type Row = Record<string, unknown>;

function rowToSummary(row: Row, access: Access): DocumentSummary {
  return {
    id: String(row.id),
    title: String(row.title),
    updatedAt: Number(row.updated_at),
    owner: { id: String(row.owner_id), name: String(row.owner_name), email: String(row.owner_email) },
    access,
  };
}

const SUMMARY_SELECT = `
  SELECT d.id, d.title, d.updated_at, d.owner_id, u.name AS owner_name, u.email AS owner_email
  FROM documents d JOIN users u ON u.id = d.owner_id`;

export async function listDocumentsForUser(
  userId: string,
): Promise<{ owned: DocumentSummary[]; shared: DocumentSummary[] }> {
  const db = await getDb();
  const owned = await db.execute({
    sql: `${SUMMARY_SELECT} WHERE d.owner_id = ? ORDER BY d.updated_at DESC`,
    args: [userId],
  });
  const shared = await db.execute({
    sql: `SELECT d.id, d.title, d.updated_at, d.owner_id, u.name AS owner_name, u.email AS owner_email, s.role
          FROM document_shares s
          JOIN documents d ON d.id = s.document_id
          JOIN users u ON u.id = d.owner_id
          WHERE s.user_id = ? ORDER BY d.updated_at DESC`,
    args: [userId],
  });
  return {
    owned: owned.rows.map((r) => rowToSummary(r, "owner")),
    shared: shared.rows.map((r) => rowToSummary(r, r.role as ShareRole)),
  };
}

async function loadShares(documentId: string): Promise<Share[]> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT s.user_id, s.role, u.email, u.name FROM document_shares s
          JOIN users u ON u.id = s.user_id
          WHERE s.document_id = ? ORDER BY s.created_at, u.email`,
    args: [documentId],
  });
  return res.rows.map((r) => ({
    userId: String(r.user_id),
    email: String(r.email),
    name: String(r.name),
    role: r.role as ShareRole,
  }));
}

/**
 * Load a document and the caller's access level.
 * Throws 404 if it doesn't exist OR the user has no access (no existence leak).
 */
export async function getDocumentForUser(documentId: string, userId: string): Promise<DocumentDetail> {
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT d.*, u.name AS owner_name, u.email AS owner_email
          FROM documents d JOIN users u ON u.id = d.owner_id WHERE d.id = ?`,
    args: [documentId],
  });
  const row = res.rows[0];
  if (!row) throw notFound("Document not found");

  const shares = await loadShares(documentId);
  const access = getAccess({ ownerId: String(row.owner_id), shares }, userId);
  if (access === "none") throw notFound("Document not found");

  let contentJson: unknown = null;
  if (typeof row.content_json === "string" && row.content_json) {
    try {
      contentJson = JSON.parse(row.content_json);
    } catch {
      contentJson = null; // fall back to HTML
    }
  }
  return {
    ...rowToSummary(row, access),
    contentJson,
    contentHtml: String(row.content_html ?? ""),
    createdAt: Number(row.created_at),
  };
}

export function cleanTitle(title: string | undefined | null): string {
  const t = (title ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TITLE_LENGTH);
  return t || DEFAULT_TITLE;
}

export async function createDocument(
  ownerId: string,
  input: { title?: string; contentHtml?: string; contentJson?: unknown } = {},
): Promise<DocumentDetail> {
  const db = await getDb();
  const id = newId();
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO documents (id, owner_id, title, content_json, content_html, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      ownerId,
      cleanTitle(input.title),
      input.contentJson ? JSON.stringify(input.contentJson) : null,
      input.contentHtml ?? "",
      now,
      now,
    ],
  });
  return getDocumentForUser(id, ownerId);
}

export type DocumentPatch = {
  title?: string;
  content?: { json: unknown; html: string };
};

/** Owners can rename + edit; editors can only edit content; viewers get 403. */
export async function updateDocument(
  documentId: string,
  userId: string,
  patch: DocumentPatch,
): Promise<{ id: string; title: string; updatedAt: number }> {
  const doc = await getDocumentForUser(documentId, userId);

  if (patch.title !== undefined && !canManage(doc.access)) {
    throw forbidden("Only the owner can rename this document");
  }
  if (patch.content !== undefined && !canEdit(doc.access)) {
    throw forbidden("You have view-only access to this document");
  }
  if (patch.title === undefined && patch.content === undefined) {
    throw badRequest("Nothing to update");
  }

  const sets: string[] = [];
  const args: (string | number)[] = [];
  let title = doc.title;
  if (patch.title !== undefined) {
    title = cleanTitle(patch.title);
    sets.push("title = ?");
    args.push(title);
  }
  if (patch.content !== undefined) {
    sets.push("content_json = ?", "content_html = ?");
    args.push(JSON.stringify(patch.content.json), patch.content.html);
  }
  const updatedAt = Date.now();
  sets.push("updated_at = ?");
  args.push(updatedAt);

  const db = await getDb();
  await db.execute({ sql: `UPDATE documents SET ${sets.join(", ")} WHERE id = ?`, args: [...args, documentId] });
  return { id: documentId, title, updatedAt };
}

export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  const doc = await getDocumentForUser(documentId, userId);
  if (!canManage(doc.access)) throw forbidden("Only the owner can delete this document");
  const db = await getDb();
  // Explicit cleanup: SQLite foreign-key cascades are off unless enabled per connection.
  await db.execute({ sql: "DELETE FROM document_shares WHERE document_id = ?", args: [documentId] });
  await db.execute({ sql: "DELETE FROM documents WHERE id = ?", args: [documentId] });
}

// ---------------------------------------------------------------- sharing

async function requireOwner(documentId: string, userId: string) {
  const doc = await getDocumentForUser(documentId, userId);
  if (!canManage(doc.access)) throw forbidden("Only the owner can manage sharing");
  return doc;
}

export async function listSharesForOwner(documentId: string, userId: string): Promise<Share[]> {
  await requireOwner(documentId, userId);
  return loadShares(documentId);
}

/** Add a share, or update the role if the user already has one. */
export async function shareDocument(
  documentId: string,
  ownerId: string,
  email: string,
  role: ShareRole,
): Promise<Share[]> {
  const doc = await requireOwner(documentId, ownerId);
  const target = await getUserByEmail(normalizeEmail(email));
  if (!target) {
    throw notFound(`No user with email ${normalizeEmail(email)}. They need to log in once first.`);
  }
  if (target.id === doc.owner.id) throw badRequest("You already own this document");

  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO document_shares (document_id, user_id, role, created_at) VALUES (?, ?, ?, ?)
          ON CONFLICT (document_id, user_id) DO UPDATE SET role = excluded.role`,
    args: [documentId, target.id, role, Date.now()],
  });
  return loadShares(documentId);
}

export async function updateShareRole(
  documentId: string,
  ownerId: string,
  targetUserId: string,
  role: ShareRole,
): Promise<Share[]> {
  await requireOwner(documentId, ownerId);
  const db = await getDb();
  const res = await db.execute({
    sql: "UPDATE document_shares SET role = ? WHERE document_id = ? AND user_id = ?",
    args: [role, documentId, targetUserId],
  });
  if (res.rowsAffected === 0) throw notFound("That user doesn't have access to this document");
  return loadShares(documentId);
}

export async function removeShare(documentId: string, ownerId: string, targetUserId: string): Promise<Share[]> {
  await requireOwner(documentId, ownerId);
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM document_shares WHERE document_id = ? AND user_id = ?",
    args: [documentId, targetUserId],
  });
  return loadShares(documentId);
}
