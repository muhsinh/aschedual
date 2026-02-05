export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-4">
      <h2 className="text-3xl font-semibold tracking-tight">Privacy Policy</h2>
      <p className="text-muted">Last updated: 2026-02-05</p>

      <p>
        <strong>App:</strong> Aschedual (Chrome extension + web app)
      </p>
      <p>
        <strong>Contact:</strong> [your support email]
      </p>

      <h3 className="pt-2 text-xl font-semibold">What we collect</h3>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Account info: your email address and basic profile info provided by your login
          provider (e.g., Google).
        </li>
        <li>
          User content you submit: text you select or paste, and scheduling details you
          choose to save.
        </li>
        <li>
          Integration data: authorization tokens needed to connect to third-party services
          (e.g., Notion, Google Calendar).
        </li>
        <li>
          Basic technical data: logs needed to keep the service reliable and secure (e.g.,
          error logs).
        </li>
      </ul>

      <h3 className="pt-2 text-xl font-semibold">How we use data</h3>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          To provide the core functionality: parsing your input, proposing schedule items,
          and saving what you approve.
        </li>
        <li>
          To operate integrations you explicitly connect (e.g., writing approved items into
          Notion).
        </li>
        <li>To maintain security, prevent abuse, and debug issues.</li>
      </ul>

      <h3 className="pt-2 text-xl font-semibold">What we share</h3>
      <p>
        We do not sell your personal data. We share data only with service providers and
        integrations you choose to connect, as required to provide the app (e.g., Notion
        APIs, Google APIs, hosting/database providers).
      </p>

      <h3 className="pt-2 text-xl font-semibold">Data retention</h3>
      <p>
        We retain data as long as you maintain an account or until you delete it, except
        where we must keep certain records for security and legal compliance.
      </p>

      <h3 className="pt-2 text-xl font-semibold">Security</h3>
      <p>
        We use reasonable security measures to protect data, but no method of transmission
        or storage is 100% secure.
      </p>

      <h3 className="pt-2 text-xl font-semibold">Your choices</h3>
      <ul className="list-disc space-y-2 pl-6">
        <li>You can disconnect integrations at any time.</li>
        <li>
          You can request deletion of your data by contacting us at: [your support email].
        </li>
      </ul>

      <h3 className="pt-2 text-xl font-semibold">Changes</h3>
      <p>
        We may update this policy from time to time. We will update the “Last updated”
        date above.
      </p>
    </article>
  );
}
