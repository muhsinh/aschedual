"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type PrivacyPayload = {
  defaultSnippetEnabled: boolean;
  timezone: string;
  storedFields: string[];
};

export function PrivacyClient() {
  const [payload, setPayload] = useState<PrivacyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    const response = await fetch("/api/settings/privacy", { cache: "no-store" });
    const data = (await response.json()) as PrivacyPayload & { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Unable to load privacy settings");
    }
    setPayload(data);
  }

  useEffect(() => {
    void load().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load");
    });
  }, []);

  async function save() {
    if (!payload) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/settings/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultSnippetEnabled: payload.defaultSnippetEnabled,
          timezone: payload.timezone
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save privacy settings");
      }
      setPayload(data as PrivacyPayload);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Privacy</h2>
        <p className="text-sm text-muted">
          Keep snippet capture opt-in and transparent.
        </p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {!payload ? (
        <p className="text-sm text-muted">Loading privacy settings...</p>
      ) : (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default snippet capture</p>
              <p className="text-xs text-muted">Off by default. User can still opt in per capture.</p>
            </div>
            <Switch
              checked={payload.defaultSnippetEnabled}
              onCheckedChange={(checked) =>
                setPayload((current) =>
                  current ? { ...current, defaultSnippetEnabled: checked } : current
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input
              value={payload.timezone}
              onChange={(event) =>
                setPayload((current) =>
                  current ? { ...current, timezone: event.target.value } : current
                )
              }
            />
          </div>

          <div>
            <p className="text-sm font-medium">Stored fields</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {payload.storedFields.map((field) => (
                <li key={field}>- {field}</li>
              ))}
            </ul>
          </div>

          <Button onClick={() => void save()} disabled={busy}>
            {busy ? "Saving..." : "Save privacy settings"}
          </Button>
        </Card>
      )}
    </section>
  );
}
