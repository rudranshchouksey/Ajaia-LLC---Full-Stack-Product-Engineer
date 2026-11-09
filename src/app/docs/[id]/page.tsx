import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentForUser, type DocumentDetail } from "@/lib/documents";
import { HttpError } from "@/lib/http";
import { DocumentView } from "@/components/DocumentView";

async function load(id: string, userId: string): Promise<DocumentDetail> {
  try {
    return await getDocumentForUser(id, userId);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps<"/docs/[id]">): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Document" };
  try {
    const doc = await getDocumentForUser((await params).id, user.id);
    return { title: doc.title };
  } catch {
    return { title: "Document not found" };
  }
}

export default async function DocumentPage({ params }: PageProps<"/docs/[id]">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/docs/${id}`)}`);
  const doc = await load(id, user.id);
  return <DocumentView doc={doc} user={user} />;
}
