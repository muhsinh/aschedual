import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/app/sidebar";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/inbox");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto w-full max-w-content">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Aschedual</h1>
          <Link href="/api/auth/signout">
            <Button variant="secondary" size="sm">
              Sign out
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Sidebar />
          <div className="rounded-2xl border border-border bg-panel p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
