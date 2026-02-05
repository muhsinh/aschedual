import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";

export default async function AccountSettingsPage() {
  const session = await auth();

  return (
    <section className="space-y-4">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Account</h2>
        <p className="text-sm text-muted">Signed in profile details.</p>
      </div>

      <Card className="space-y-2">
        <p className="text-sm text-muted">Email</p>
        <p className="text-base text-foreground">{session?.user?.email ?? "Unavailable"}</p>
        <p className="pt-3 text-sm text-muted">Name</p>
        <p className="text-base text-foreground">{session?.user?.name ?? "Unavailable"}</p>
      </Card>
    </section>
  );
}
