import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createDocument } from "@/lib/documents";
import { badRequest, handler, HttpError } from "@/lib/http";
import { convertUpload, ImportError } from "@/lib/import";
import { MAX_UPLOAD_BYTES } from "@/lib/limits";

const uploadSchema = z.object({
  file: z.instanceof(File, { message: "No file uploaded. Send multipart/form-data with a 'file' field." }),
});

/** Upload a .txt / .md / .docx file (max 2 MB) and create a new document from it. */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();

  // Reject obviously oversized bodies before buffering them.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    throw new HttpError(413, `File is too large. The limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw badRequest("Expected a multipart/form-data upload with a 'file' field.");
  }
  const { file } = uploadSchema.parse({ file: form.get("file") });

  try {
    const { title, html, format } = await convertUpload({
      name: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    const document = await createDocument(user.id, { title, contentHtml: html });
    return NextResponse.json({ document: { id: document.id, title: document.title }, format }, { status: 201 });
  } catch (err) {
    if (err instanceof ImportError) throw new HttpError(err.status, err.message);
    throw err;
  }
});
