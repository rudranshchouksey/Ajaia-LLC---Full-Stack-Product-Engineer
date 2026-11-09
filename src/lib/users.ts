import { getDb, newId } from "./db";

export type User = { id: string; email: string; name: string };

function rowToUser(row: Record<string, unknown>): User {
  return { id: String(row.id), email: String(row.email), name: String(row.name) };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** "jane.doe@x.com" -> "Jane Doe" */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const words = local.split(/[._\-+]+/).filter(Boolean);
  if (!words.length) return email;
  return words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join(" ");
}

export async function listUsers(): Promise<User[]> {
  const db = await getDb();
  const res = await db.execute("SELECT id, email, name FROM users ORDER BY created_at, email");
  return res.rows.map(rowToUser);
}

export async function getUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT id, email, name FROM users WHERE id = ?", args: [id] });
  return res.rows[0] ? rowToUser(res.rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT id, email, name FROM users WHERE email = ?",
    args: [normalizeEmail(email)],
  });
  return res.rows[0] ? rowToUser(res.rows[0]) : null;
}

/** Demo login: unknown emails get a fresh account (no passwords in this app). */
export async function findOrCreateUserByEmail(email: string): Promise<User> {
  const normalized = normalizeEmail(email);
  const existing = await getUserByEmail(normalized);
  if (existing) return existing;
  const db = await getDb();
  const user: User = { id: newId(), email: normalized, name: nameFromEmail(normalized) };
  await db.execute({
    sql: "INSERT OR IGNORE INTO users (id, email, name, created_at) VALUES (?, ?, ?, ?)",
    args: [user.id, user.email, user.name, Date.now()],
  });
  // Re-read in case of a concurrent insert of the same email.
  return (await getUserByEmail(normalized)) ?? user;
}
