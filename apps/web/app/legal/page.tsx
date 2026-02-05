import Link from "next/link";

export default function LegalIndexPage() {
  return (
    <section className="space-y-4">
      <p className="text-muted">Legal documents for Aschedual.</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <Link href="/legal/privacy" className="hover:text-irish-highlight">
            Privacy Policy
          </Link>
        </li>
        <li>
          <Link href="/legal/terms" className="hover:text-irish-highlight">
            Terms of Use
          </Link>
        </li>
      </ul>
    </section>
  );
}
