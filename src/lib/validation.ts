import { z } from "zod";
import { MAX_TITLE_LENGTH } from "./documents";

/** zod schemas for every API request body / param. */

export const emailSchema = z
  .string({ message: "Email is required" })
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const loginSchema = z.object({ email: emailSchema });

export const roleSchema = z.enum(["viewer", "editor"], { message: "Role must be viewer or editor" });

export const idSchema = z.string().min(1).max(100);

export const createDocumentSchema = z
  .object({ title: z.string().max(MAX_TITLE_LENGTH).optional() })
  .strict();

/** ~1.5 MB cap on stored content to keep rows (and Turso free-tier usage) sane. */
const MAX_CONTENT_CHARS = 1_500_000;

const tiptapDocSchema = z
  .object({ type: z.literal("doc"), content: z.array(z.unknown()).optional() })
  .loose()
  .refine((doc) => JSON.stringify(doc).length <= MAX_CONTENT_CHARS, "Document is too large");

export const updateDocumentSchema = z
  .object({
    title: z.string().max(MAX_TITLE_LENGTH, `Title must be at most ${MAX_TITLE_LENGTH} characters`).optional(),
    content: z
      .object({
        json: tiptapDocSchema,
        html: z.string().max(MAX_CONTENT_CHARS, "Document is too large"),
      })
      .optional(),
  })
  .strict()
  .refine((v) => v.title !== undefined || v.content !== undefined, "Nothing to update");

export const addShareSchema = z.object({ email: emailSchema, role: roleSchema }).strict();

export const updateShareSchema = z.object({ role: roleSchema }).strict();
