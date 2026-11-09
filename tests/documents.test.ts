import { beforeEach, describe, expect, it } from "vitest";
import {
  createDocument,
  deleteDocument,
  getDocumentForUser,
  listDocumentsForUser,
  listSharesForOwner,
  removeShare,
  shareDocument,
  updateDocument,
  updateShareRole,
} from "@/lib/documents";
import { ALICE, BOB, CAROL, httpStatusOf, resetDatabase, sampleContent } from "./helpers";

// Seed: doc_welcome owned by alice, shared with bob (editor) and carol (viewer).
const DOC = "doc_welcome";

beforeEach(resetDatabase);

describe("updateDocument permissions", () => {
  it("rejects content updates from a viewer with 403 and leaves the doc unchanged", async () => {
    const before = await getDocumentForUser(DOC, ALICE);
    expect(await httpStatusOf(updateDocument(DOC, CAROL, { content: sampleContent("hacked") }))).toBe(403);
    const after = await getDocumentForUser(DOC, ALICE);
    expect(after.contentHtml).toBe(before.contentHtml);
    expect(after.updatedAt).toBe(before.updatedAt);
  });

  it("allows an editor to update content, and the owner sees it", async () => {
    await updateDocument(DOC, BOB, { content: sampleContent("Bob was here") });
    const doc = await getDocumentForUser(DOC, ALICE);
    expect(doc.contentHtml).toBe("<p>Bob was here</p>");
    expect(doc.contentJson).toEqual(sampleContent("Bob was here").json);
  });

  it("allows the owner to update content and rename", async () => {
    const res = await updateDocument(DOC, ALICE, { title: "  New   title ", content: sampleContent("x") });
    expect(res.title).toBe("New title");
    expect((await getDocumentForUser(DOC, BOB)).title).toBe("New title");
  });

  it("does not let an editor rename (owner only)", async () => {
    expect(await httpStatusOf(updateDocument(DOC, BOB, { title: "mine now" }))).toBe(403);
  });

  it("returns 404 for users without access and for missing documents", async () => {
    const outsider = (await createDocument(BOB, { title: "Bob's" })).id;
    expect(await httpStatusOf(updateDocument(outsider, CAROL, { content: sampleContent("x") }))).toBe(404);
    expect(await httpStatusOf(getDocumentForUser(outsider, CAROL))).toBe(404);
    expect(await httpStatusOf(getDocumentForUser("nope", ALICE))).toBe(404);
  });

  it("falls back to the default title when renamed to blank", async () => {
    expect((await updateDocument(DOC, ALICE, { title: "   " })).title).toBe("Untitled document");
  });
});

describe("delete", () => {
  it("only the owner can delete; shares are cleaned up", async () => {
    expect(await httpStatusOf(deleteDocument(DOC, BOB))).toBe(403);
    expect(await httpStatusOf(deleteDocument(DOC, CAROL))).toBe(403);
    await deleteDocument(DOC, ALICE);
    expect(await httpStatusOf(getDocumentForUser(DOC, ALICE))).toBe(404);
    expect((await listDocumentsForUser(BOB)).shared.map((d) => d.id)).not.toContain(DOC);
  });
});

describe("sharing", () => {
  it("lists owned and shared documents separately with roles", async () => {
    const alice = await listDocumentsForUser(ALICE);
    expect(alice.owned.every((d) => d.access === "owner")).toBe(true);
    const bob = await listDocumentsForUser(BOB);
    const welcome = bob.shared.find((d) => d.id === DOC);
    expect(welcome?.access).toBe("editor");
    expect(welcome?.owner.name).toBe("Alice Anderson");
  });

  it("owner can share, change role and revoke; access follows", async () => {
    const doc = await createDocument(ALICE, { title: "Plan" });
    expect(await httpStatusOf(getDocumentForUser(doc.id, BOB))).toBe(404);

    await shareDocument(doc.id, ALICE, "BOB@example.com", "viewer");
    expect((await getDocumentForUser(doc.id, BOB)).access).toBe("viewer");
    expect(await httpStatusOf(updateDocument(doc.id, BOB, { content: sampleContent("x") }))).toBe(403);

    await updateShareRole(doc.id, ALICE, BOB, "editor");
    await updateDocument(doc.id, BOB, { content: sampleContent("now I can") });

    // Re-sharing upserts instead of duplicating
    await shareDocument(doc.id, ALICE, "bob@example.com", "viewer");
    expect(await listSharesForOwner(doc.id, ALICE)).toHaveLength(1);

    await removeShare(doc.id, ALICE, BOB);
    expect(await httpStatusOf(getDocumentForUser(doc.id, BOB))).toBe(404);
  });

  it("non-owners cannot manage sharing", async () => {
    expect(await httpStatusOf(shareDocument(DOC, BOB, "carol@example.com", "editor"))).toBe(403);
    expect(await httpStatusOf(listSharesForOwner(DOC, CAROL))).toBe(403);
    expect(await httpStatusOf(removeShare(DOC, BOB, CAROL))).toBe(403);
  });

  it("rejects sharing with unknown users or with yourself", async () => {
    expect(await httpStatusOf(shareDocument(DOC, ALICE, "ghost@example.com", "viewer"))).toBe(404);
    expect(await httpStatusOf(shareDocument(DOC, ALICE, "alice@example.com", "viewer"))).toBe(400);
  });
});
