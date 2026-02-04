"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@aschedual/ui";

export default function ExtensionConnectPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState("Generating token...");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/extension/token", { method: "POST" });
        if (!res.ok) throw new Error("Token request failed");
        const data = (await res.json()) as { token: string };
        setToken(data.token);
        setStatus("Token ready. Finishing connection...");
        window.postMessage(
          { source: "aschedual-extension-connect", token: data.token },
          window.location.origin
        );
      } catch (err) {
        setStatus("Unable to generate token. Please try again.");
      }
    };
    run();
  }, []);

  return (
    <main className="min-h-screen bg-bg px-6 py-10 text-text">
      <Card className="mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-semibold">Connect Extension</h1>
        <p className="text-sm text-text-muted">{status}</p>
        {token ? (
          <Button onClick={() => window.close()}>Close</Button>
        ) : (
          <Button variant="secondary" disabled>
            Waiting...
          </Button>
        )}
      </Card>
    </main>
  );
}
