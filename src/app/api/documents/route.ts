import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createDocument, listDocumentsForUser } from "@/lib/documents";
import { handler, parseJson } from "@/lib/http";
import { createDocumentSchema } from "@/lib/validation";

export const GET = handler(async () => {
  const user = await requireUser();
  return NextResponse.json(await listDocumentsForUser(user.id));
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const input = await parseJson(req, createDocumentSchema);
  const document = await createDocument(user.id, { title: input.title });
  return NextResponse.json({ document }, { status: 201 });
});
