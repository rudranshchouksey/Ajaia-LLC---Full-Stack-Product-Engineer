import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/http";
import { listUsers } from "@/lib/users";

/** Directory of known users, used for share-dialog suggestions. */
export const GET = handler(async () => {
  await requireUser();
  return NextResponse.json({ users: await listUsers() });
});
