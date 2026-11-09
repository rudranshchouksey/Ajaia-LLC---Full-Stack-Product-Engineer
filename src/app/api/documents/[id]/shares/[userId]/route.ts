import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { removeShare, updateShareRole } from "@/lib/documents";
import { handler, parseJson } from "@/lib/http";
import { idSchema, updateShareSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string; userId: string }> };

/** Owner only: change a collaborator's role ({ role }). */
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, userId } = await params;
  const { role } = await parseJson(req, updateShareSchema);
  return NextResponse.json({ shares: await updateShareRole(idSchema.parse(id), user.id, idSchema.parse(userId), role) });
});

/** Owner only: revoke a collaborator's access. */
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id, userId } = await params;
  return NextResponse.json({ shares: await removeShare(idSchema.parse(id), user.id, idSchema.parse(userId)) });
});
