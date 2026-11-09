import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handler } from "@/lib/http";

export const GET = handler(async () => {
  const user = await requireUser();
  return NextResponse.json({ user });
});
