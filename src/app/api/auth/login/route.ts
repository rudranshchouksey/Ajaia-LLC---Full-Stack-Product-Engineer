import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { handler, parseJson } from "@/lib/http";
import { findOrCreateUserByEmail } from "@/lib/users";
import { loginSchema } from "@/lib/validation";

/** Demo login: no password. Unknown emails get a new account. */
export const POST = handler(async (req: Request) => {
  const { email } = await parseJson(req, loginSchema);
  const user = await findOrCreateUserByEmail(email);
  await createSession(user.id);
  return NextResponse.json({ user });
});
