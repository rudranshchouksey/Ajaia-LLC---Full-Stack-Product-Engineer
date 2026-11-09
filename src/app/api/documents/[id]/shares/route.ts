import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { listSharesForOwner, shareDocument } from "@/lib/documents";
import { handler, parseJson } from "@/lib/http";
import { addShareSchema, idSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Owner only: list who has access. */
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const id = idSchema.parse((await params).id);
  return NextResponse.json({ shares: await listSharesForOwner(id, user.id) });
});

/** Owner only: share with a user by email ({ email, role }); upserts the role. */
export const POST = handler(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const id = idSchema.parse((await params).id);
  const { email, role } = await parseJson(req, addShareSchema);
  return NextResponse.json({ shares: await shareDocument(id, user.id, email, role) }, { status: 201 });
});
