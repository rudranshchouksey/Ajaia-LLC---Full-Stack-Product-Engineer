import { describe, expect, it } from "vitest";
import { canEdit, canManage, canView, getAccess, type Access, type AccessCheckDoc } from "@/lib/permissions";

const doc: AccessCheckDoc = {
  ownerId: "alice",
  shares: [
    { userId: "bob", role: "editor" },
    { userId: "carol", role: "viewer" },
  ],
};

describe("getAccess", () => {
  it("returns owner for the document owner", () => {
    expect(getAccess(doc, "alice")).toBe("owner");
  });

  it("returns the share role for shared users", () => {
    expect(getAccess(doc, "bob")).toBe("editor");
    expect(getAccess(doc, "carol")).toBe("viewer");
  });

  it("returns none for users without a share", () => {
    expect(getAccess(doc, "mallory")).toBe("none");
  });

  it("returns none for anonymous users", () => {
    expect(getAccess(doc, null)).toBe("none");
    expect(getAccess(doc, undefined)).toBe("none");
    expect(getAccess(doc, "")).toBe("none");
  });

  it("owner wins even if the owner also appears in shares", () => {
    expect(getAccess({ ownerId: "alice", shares: [{ userId: "alice", role: "viewer" }] }, "alice")).toBe("owner");
  });

  it("returns none for a doc with no shares", () => {
    expect(getAccess({ ownerId: "alice", shares: [] }, "bob")).toBe("none");
  });
});

describe("capability helpers", () => {
  const matrix: [Access, { view: boolean; edit: boolean; manage: boolean }][] = [
    ["owner", { view: true, edit: true, manage: true }],
    ["editor", { view: true, edit: true, manage: false }],
    ["viewer", { view: true, edit: false, manage: false }],
    ["none", { view: false, edit: false, manage: false }],
  ];

  it.each(matrix)("%s -> %o", (access, expected) => {
    expect(canView(access)).toBe(expected.view);
    expect(canEdit(access)).toBe(expected.edit);
    expect(canManage(access)).toBe(expected.manage);
  });
});
