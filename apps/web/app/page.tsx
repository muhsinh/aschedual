import Link from "next/link";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "Drive real scheduling work",
    text: "Capture high-signal text from the web and turn it into clean scheduling proposals your team can trust."
  },
  {
    title: "Privacy-first capture",
    text: "By default we store only selected text, page URL, and title. Snippets stay opt-in per capture."
  },
  {
    title: "Integrations you control",
    text: "Google Calendar stays the source of truth. Notion is optional and configured destination-by-destination."
  },
  {
    title: "Approval workflow",
    text: "Every proposal is editable before approval. You can correct title, time, location, and notes before write."
  },
  {
    title: "Works with your extension",
    text: "Use short-lived extension tokens and explicit approvals so browser capture stays secure and predictable."
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-6">
          <p className="text-sm font-semibold tracking-wide">Aschedual</p>
          <div className="flex items-center gap-3">
            <Link href="/api/auth/signin">
              <Button variant="secondary" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/inbox">
              <Button size="sm">Open app</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="section-atmosphere px-6 py-24">
        <Reveal>
          <div className="mx-auto max-w-content">
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-muted">
              Capture. Propose. Approve.
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
              Keep scheduling work human, precise, and already in your calendar.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted">
              Aschedual turns selected page text into clean proposals you can edit and approve,
              then writes to Google Calendar with optional Notion follow-through.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/api/auth/signin">
                <Button size="lg">Get started</Button>
              </Link>
              <Link href="/settings/privacy">
                <Button size="lg" variant="secondary">
                  See privacy controls
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="subtle-divider" />

      {sections.map((section, index) => (
        <section
          key={section.title}
          className={index % 2 === 0 ? "px-6 py-24" : "section-atmosphere px-6 py-24"}
        >
          <Reveal delay={0.03 * index}>
            <div className="mx-auto grid max-w-content gap-6 md:grid-cols-2">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                {section.title}
              </h2>
              <Card>
                <p className="text-base leading-relaxed text-muted">{section.text}</p>
              </Card>
            </div>
          </Reveal>
        </section>
      ))}
    </main>
  );
}
