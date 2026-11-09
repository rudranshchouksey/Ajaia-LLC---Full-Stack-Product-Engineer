import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

/** An error with an HTTP status; serialized as `{ error: message }`. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (msg = "Bad request") => new HttpError(400, msg);
export const unauthorized = (msg = "You need to log in") => new HttpError(401, msg);
export const forbidden = (msg = "You don't have permission to do that") => new HttpError(403, msg);
export const notFound = (msg = "Not found") => new HttpError(404, msg);

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function describeZodError(err: ZodError): string {
  const issue = err.issues[0];
  if (!issue) return "Invalid request";
  const where = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return `${where}${issue.message}`;
}

/** Map any thrown value to a consistent `{ error }` JSON response. */
export function toErrorResponse(err: unknown) {
  if (err instanceof HttpError) return jsonError(err.status, err.message);
  if (err instanceof ZodError) return jsonError(400, describeZodError(err));
  console.error("[api] unexpected error", err);
  return jsonError(500, "Something went wrong. Please try again.");
}

/** Wrap a route handler so thrown HttpErrors / ZodErrors become JSON responses. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/** Parse a JSON request body with a zod schema (400 on malformed JSON). */
export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
  return schema.parse(body);
}
