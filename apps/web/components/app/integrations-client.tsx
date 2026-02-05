"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type IntegrationStatus = {
  provider: "google" | "notion";
  connected: boolean;
  expiresAt: string | null;
  scopes: string[];
};

export function IntegrationsClient() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load integrations");
      }
      setIntegrations(data.integrations ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function startConnect(provider: "google" | "notion") {
    setBusy(`${provider}:connect`);
    setError(null);
    try {
      const response = await fetch(`/api/integrations/${provider}/connect`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to start connect");
      }
      if (data.url) {
        window.location.assign(data.url as string);
      }
    } catch (connectError) {
      setError(
        connectError instanceof Error ? connectError.message : "Unable to connect"
      );
      setBusy(null);
    }
  }

  async function disconnect(provider: "google" | "notion") {
    setBusy(`${provider}:disconnect`);
    setError(null);
    try {
      const response = await fetch(`/api/integrations/${provider}/disconnect`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to disconnect");
      }
      await loadStatus();
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Unable to disconnect"
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Integrations</h2>
        <p className="text-sm text-muted">
          Connect providers, then set defaults under Destinations.
        </p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Loading integration status...</p> : null}

      {integrations.map((integration) => (
        <Card key={integration.provider} className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold capitalize">{integration.provider}</h3>
            <p className="text-sm text-muted">
              Status: {integration.connected ? "Connected" : "Not connected"}
            </p>
            {integration.expiresAt ? (
              <p className="text-xs text-muted">
                Expires: {new Date(integration.expiresAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            {!integration.connected ? (
              <Button
                onClick={() => void startConnect(integration.provider)}
                disabled={busy === `${integration.provider}:connect`}
              >
                Connect
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => void disconnect(integration.provider)}
                disabled={busy === `${integration.provider}:disconnect`}
              >
                Disconnect
              </Button>
            )}
          </div>
        </Card>
      ))}
    </section>
  );
}
