"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type DestinationPayload = {
  settings: {
    defaultCalendarId: string | null;
    defaultDurationMinutes: number;
    notionTargetType: "database" | "page" | null;
    notionTargetId: string | null;
    timezone: string;
  };
  calendars: Array<{
    id: string;
    summary: string;
    primary: boolean;
    timezone: string;
  }>;
  notionTargets: {
    databases: Array<{ id: string; title: string; type: "database" }>;
    pages: Array<{ id: string; title: string; type: "page" }>;
  };
};

export function DestinationsClient() {
  const [payload, setPayload] = useState<DestinationPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function load() {
    setError(null);
    const response = await fetch("/api/settings/destinations", { cache: "no-store" });
    const data = (await response.json()) as DestinationPayload & { error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Unable to load destinations");
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
    setSaved(null);

    try {
      const response = await fetch("/api/settings/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.settings)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save destinations");
      }

      setSaved("Saved");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-semibold tracking-tight">Destinations</h2>
        <p className="text-sm text-muted">
          Choose default calendar, Notion target, and scheduling duration.
        </p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {saved ? <p className="text-sm text-irish-highlight">{saved}</p> : null}

      {!payload ? (
        <p className="text-sm text-muted">Loading destination settings...</p>
      ) : (
        <Card className="space-y-4">
          <div className="space-y-2">
            <Label>Default calendar</Label>
            <Select
              value={payload.settings.defaultCalendarId ?? ""}
              onChange={(event) =>
                setPayload((current) =>
                  current
                    ? {
                        ...current,
                        settings: {
                          ...current.settings,
                          defaultCalendarId: event.target.value || null
                        }
                      }
                    : current
                )
              }
            >
              <option value="">Primary</option>
              {payload.calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary}
                  {calendar.primary ? " (primary)" : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default duration (minutes)</Label>
              <Input
                type="number"
                min={15}
                value={payload.settings.defaultDurationMinutes}
                onChange={(event) =>
                  setPayload((current) =>
                    current
                      ? {
                          ...current,
                          settings: {
                            ...current.settings,
                            defaultDurationMinutes: Number(event.target.value)
                          }
                        }
                      : current
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input
                value={payload.settings.timezone}
                onChange={(event) =>
                  setPayload((current) =>
                    current
                      ? {
                          ...current,
                          settings: {
                            ...current.settings,
                            timezone: event.target.value
                          }
                        }
                      : current
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Notion target type</Label>
              <Select
                value={payload.settings.notionTargetType ?? ""}
                onChange={(event) =>
                  setPayload((current) =>
                    current
                      ? {
                          ...current,
                          settings: {
                            ...current.settings,
                            notionTargetType:
                              (event.target.value as "database" | "page" | "") || null,
                            notionTargetId: null
                          }
                        }
                      : current
                  )
                }
              >
                <option value="">Not configured</option>
                <option value="database">Database</option>
                <option value="page">Page</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notion target</Label>
              <Select
                value={payload.settings.notionTargetId ?? ""}
                onChange={(event) =>
                  setPayload((current) =>
                    current
                      ? {
                          ...current,
                          settings: {
                            ...current.settings,
                            notionTargetId: event.target.value || null
                          }
                        }
                      : current
                  )
                }
              >
                <option value="">None</option>
                {payload.settings.notionTargetType === "database"
                  ? payload.notionTargets.databases.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.title}
                      </option>
                    ))
                  : payload.notionTargets.pages.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.title}
                      </option>
                    ))}
              </Select>
            </div>
          </div>

          <Button onClick={() => void save()} disabled={busy}>
            {busy ? "Saving..." : "Save destinations"}
          </Button>
        </Card>
      )}
    </section>
  );
}
