import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteDocument, getDocumentForUser, updateDocument } from "@/lib/documents";
import { handler, parseJson } from "@/lib/http";
import { idSchema, updateDocumentSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const id = idSchema.parse((await params).id);
  return NextResponse.json({ document: await getDocumentForUser(id, user.id) });
});

/** Body: { title? } (owner only) and/or { content: { json, html } } (owner/editor). */
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const id = idSchema.parse((await params).id);
  const patch = await parseJson(req, updateDocumentSchema);
  return NextResponse.json({ document: await updateDocument(id, user.id, patch) });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const id = idSchema.parse((await params).id);
  await deleteDocument(id, user.id);
  return new NextResponse(null, { status: 204 });
});
