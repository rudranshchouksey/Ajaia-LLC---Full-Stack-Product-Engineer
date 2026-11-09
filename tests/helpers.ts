import { getDb, resetDbForTests } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { resetAndSeed } from "@/lib/seed";

export const ALICE = "user_alice";
export const BOB = "user_bob";
export const CAROL = "user_carol";

/** Fresh DB with the demo seed: doc_welcome (alice) -> bob editor, carol viewer. */
export async function resetDatabase() {
  resetDbForTests();
  await resetAndSeed(await getDb());
}

/** Await a promise expected to reject with an HttpError; returns its status. */
export async function httpStatusOf(p: Promise<unknown>): Promise<number> {
  try {
    await p;
  } catch (err) {
    if (err instanceof HttpError) return err.status;
    throw err;
  }
  throw new Error("Expected the call to fail, but it succeeded");
}

export const sampleContent = (text: string) => ({
  json: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] },
  html: `<p>${text}</p>`,
});
