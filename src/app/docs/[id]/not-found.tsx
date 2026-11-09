import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function DocumentNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">Document not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          This document doesn&apos;t exist, was deleted, or hasn&apos;t been shared with you. Ask the owner to share it
          with your email address.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to documents
        </Link>
      </div>
    </main>
  );
}
