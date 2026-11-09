import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@/lib/users";
import { ALICE, BOB, CAROL, resetDatabase, sampleContent } from "./helpers";

/**
 * Route-handler tests: exercise the real handlers (validation, permission
 * checks, status codes, `{ error }` shape) with only the cookie session mocked.
 */
let currentUser: User | null = null;
vi.mock("@/lib/auth", async () => {
  const { unauthorized } = await import("@/lib/http");
  return {
    requireUser: async () => {
      if (!currentUser) throw unauthorized();
      return currentUser;
    },
    getCurrentUser: async () => currentUser,
  };
});

const { PATCH, GET } = await import("@/app/api/documents/[id]/route");
const sharesRoute = await import("@/app/api/documents/[id]/shares/route");

const as = (id: string) => {
  currentUser = { id, email: `${id}@test`, name: id };
};
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const patch = (id: string, body: unknown) =>
  PATCH(
    new Request(`http://test/api/documents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    ctx(id),
  );

beforeEach(async () => {
  currentUser = null;
  await resetDatabase();
});

describe("PATCH /api/documents/[id]", () => {
  it("401 when not logged in", async () => {
    const res = await patch("doc_welcome", { content: sampleContent("x") });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it("403 for a viewer, with an { error } body", async () => {
    as(CAROL);
    const res = await patch("doc_welcome", { content: sampleContent("x") });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "You have view-only access to this document" });
  });

  it("200 for an editor, and the change is persisted", async () => {
    as(BOB);
    const res = await patch("doc_welcome", { content: sampleContent("edited by bob") });
    expect(res.status).toBe(200);
    as(ALICE);
    const doc = await (await GET(new Request("http://test"), ctx("doc_welcome"))).json();
    expect(doc.document.contentHtml).toBe("<p>edited by bob</p>");
  });

  it("400 for invalid bodies", async () => {
    as(ALICE);
    expect((await patch("doc_welcome", {})).status).toBe(400);
    expect((await patch("doc_welcome", { content: { json: { type: "not-doc" }, html: "" } })).status).toBe(400);
    expect((await patch("doc_welcome", { title: "x".repeat(201) })).status).toBe(400);
    expect((await patch("doc_welcome", { unknownField: 1 })).status).toBe(400);
    const malformed = await PATCH(
      new Request("http://test", { method: "PATCH", body: "{not json" }),
      ctx("doc_welcome"),
    );
    expect(malformed.status).toBe(400);
  });

  it("404 for a document the user can't see", async () => {
    as(BOB);
    const res = await patch("doc_private", { content: sampleContent("x") });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/documents/[id]/shares", () => {
  const share = (id: string, body: unknown) =>
    sharesRoute.POST(
      new Request(`http://test/api/documents/${id}/shares`, { method: "POST", body: JSON.stringify(body) }),
      ctx(id),
    );

  it("owner can share; invalid role/email is a 400", async () => {
    as(ALICE);
    expect((await share("doc_private", { email: "bob@example.com", role: "viewer" })).status).toBe(201);
    expect((await share("doc_private", { email: "bob@example.com", role: "admin" })).status).toBe(400);
    expect((await share("doc_private", { email: "not-an-email", role: "viewer" })).status).toBe(400);
  });

  it("editor cannot share (403)", async () => {
    as(BOB);
    expect((await share("doc_welcome", { email: "carol@example.com", role: "editor" })).status).toBe(403);
  });
});
