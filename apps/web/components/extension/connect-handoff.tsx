"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export function ExtensionConnectHandoff() {
  const [status, setStatus] = useState("Requesting extension token...");

  useEffect(() => {
    let timeout: number | undefined;

    const run = async () => {
      try {
        const response = await fetch("/api/extension/token", {
          method: "POST"
        });

        if (response.status === 401) {
          window.location.assign("/api/auth/signin?callbackUrl=/extension/connect");
          return;
        }

        const data = (await response.json()) as { token?: string; error?: string };
        if (!response.ok || !data.token) {
          throw new Error(data.error ?? "Unable to issue token");
        }

        window.postMessage(
          {
            source: "aschedual-extension-connect",
            token: data.token
          },
          window.location.origin
        );

        setStatus("Connected. You can close this tab.");
        timeout = window.setTimeout(() => {
          window.close();
        }, 900);
      } catch (error) {
        setStatus(
          error instanceof Error
            ? `Connection failed: ${error.message}`
            : "Connection failed."
        );
      }
    };

    void run();

    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
      <Card className="w-full space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">Extension Connected</h1>
        <p className="text-sm text-muted">{status}</p>
      </Card>
    </main>
  );
}
