import { Button, Card } from "@aschedual/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-text-muted">
            Aschedual
          </p>
          <h1 className="text-3xl font-semibold text-text">
            Capture, parse, and propose your next blocks of work.
          </h1>
          <p className="max-w-2xl text-text-muted">
            Privacy-first scheduling with Google Calendar as the source of truth.
          </p>
        </header>

        <Card className="space-y-4">
          <h2 className="text-lg font-medium text-text">Get started</h2>
          <p className="text-sm text-text-muted">
            Sign in with Google to connect your calendar and configure scheduling
            preferences.
          </p>
          <div className="flex gap-3">
            <Button>Sign in with Google</Button>
            <Button variant="secondary">Open Settings</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
