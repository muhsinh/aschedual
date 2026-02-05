import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Aschedual Legal</h1>
          <Link href="/" className="text-sm text-muted hover:text-foreground">
            Back to home
          </Link>
        </div>
        <div className="space-y-4 text-sm leading-7 text-foreground/95">{children}</div>
      </div>
    </main>
  );
}
