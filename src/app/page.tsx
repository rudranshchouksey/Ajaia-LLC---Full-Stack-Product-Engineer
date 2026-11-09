import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDocumentsForUser } from "@/lib/documents";
import { AppHeader } from "@/components/AppHeader";
import { Dashboard } from "@/components/Dashboard";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { owned, shared } = await listDocumentsForUser(user.id);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Dashboard owned={owned} shared={shared} userName={user.name} />
      </main>
    </>
  );
}
