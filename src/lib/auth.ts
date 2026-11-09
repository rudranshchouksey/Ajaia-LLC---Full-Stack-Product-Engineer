import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import { unauthorized } from "./http";
import type { User } from "./users";

/**
 * DEMO AUTH, NOT REAL AUTHENTICATION.
 * Anyone can log in as any email (no password). A random session token is
 * stored in the DB and sent as an httpOnly cookie. Swapping this module for a
 * real provider (Auth.js, Clerk, ...) wouldn't touch the rest of the app, which only
 * uses `getCurrentUser()` / `requireUser()`.
 */

export const SESSION_COOKIE = "collab_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    args: [token, userId, now, now + SESSION_TTL_MS],
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.execute({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] });
  }
  store.delete(SESSION_COOKIE);
}

/** The logged-in user, or null. */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const res = await db.execute({
    sql: `SELECT u.id, u.email, u.name FROM sessions s
          JOIN users u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > ?`,
    args: [token, Date.now()],
  });
  const row = res.rows[0];
  if (!row) return null;
  return { id: String(row.id), email: String(row.email), name: String(row.name) };
}

/** For API routes: the logged-in user, or throw 401. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}
