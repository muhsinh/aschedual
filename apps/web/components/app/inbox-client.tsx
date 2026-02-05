"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InboxItem = {
  capture: {
    id: string;
    url: string;
    title: string;
    selectedText: string;
    snippet: string | null;
    createdAt: string;
  };
  proposal: {
    id: string;
    parsedTitle: string;
    startAt: string;
    endAt: string;
    location: string | null;
    notes: string | null;
    status: "proposed" | "approved" | "failed";
    failureReason: string | null;
    timezone: string;
    createdAt: string;
  } | null;
  approval: {
    id: string;
    approvedAt: string;
    gcalEventId: string | null;
    notionPageId: string | null;
    notionStatus: "skipped" | "success" | "failed";
    notionError: string | null;
  } | null;
};

function toDatetimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string) {
  return new Date(value).toISOString();
}

export function InboxClient() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [edits, setEdits] = useState<
    Record<
      string,
      {
        title: string;
        startAt: string;
        endAt: string;
        location: string;
        notes: string;
      }
    >
  >({});

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/inbox", { cache: "no-store" });
      const data = (await response.json()) as { items: InboxItem[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load inbox");
      }

      setItems(data.items);

      const nextEdits: typeof edits = {};
      data.items.forEach((item) => {
        if (item.proposal) {
          nextEdits[item.proposal.id] = {
            title: item.proposal.parsedTitle,
            startAt: toDatetimeLocal(item.proposal.startAt),
            endAt: toDatetimeLocal(item.proposal.endAt),
            location: item.proposal.location ?? "",
            notes: item.proposal.notes ?? ""
          };
        }
      });
      setEdits(nextEdits);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load inbox");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInbox();
  }, [fetchInbox]);

  const pendingCount = useMemo(
    () => items.filter((item) => item.proposal?.status === "proposed").length,
    [items]
  );

  async function handlePropose(captureId: string) {
    setBusyId(captureId);
    setError(null);

    try {
      const response = await fetch("/api/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captureId })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to generate proposal");
      }
      await fetchInbox();
    } catch (proposeError) {
      setError(
        proposeError instanceof Error
          ? proposeError.message
          : "Unable to generate proposal"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleApprove(proposalId: string) {
    const edit = edits[proposalId];
    if (!edit) return;

    setBusyId(proposalId);
    setError(null);

    try {
      const response = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          title: edit.title,
          startAt: fromDatetimeLocal(edit.startAt),
          endAt: fromDatetimeLocal(edit.endAt),
          location: edit.location || null,
          notes: edit.notes || null,
          sendToNotion: true
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to approve proposal");
      }
      await fetchInbox();
    } catch (approveError) {
      setError(
        approveError instanceof Error ? approveError.message : "Unable to approve"
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Capture Inbox</h2>
          <p className="text-sm text-muted">{pendingCount} proposal(s) awaiting approval</p>
        </div>
        <Button variant="secondary" onClick={() => void fetchInbox()}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Loading captures...</p> : null}

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.capture.id} className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Capture</p>
              <h3 className="text-lg font-semibold">{item.capture.title}</h3>
              <a
                href={item.capture.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted underline-offset-2 hover:underline"
              >
                {item.capture.url}
              </a>
            </div>

            {!item.proposal ? (
              <Button
                onClick={() => void handlePropose(item.capture.id)}
                disabled={busyId === item.capture.id}
              >
                {busyId === item.capture.id ? "Creating proposal..." : "Create proposal"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={edits[item.proposal.id]?.title ?? ""}
                      onChange={(event) =>
                        setEdits((current) => ({
                          ...current,
                          [item.proposal!.id]: {
                            ...current[item.proposal!.id],
                            title: event.target.value
                          }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={edits[item.proposal.id]?.location ?? ""}
                      onChange={(event) =>
                        setEdits((current) => ({
                          ...current,
                          [item.proposal!.id]: {
                            ...current[item.proposal!.id],
                            location: event.target.value
                          }
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label>Start</Label>
                    <Input
                      type="datetime-local"
                      value={edits[item.proposal.id]?.startAt ?? ""}
                      onChange={(event) =>
                        setEdits((current) => ({
                          ...current,
                          [item.proposal!.id]: {
                            ...current[item.proposal!.id],
                            startAt: event.target.value
                          }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>End</Label>
                    <Input
                      type="datetime-local"
                      value={edits[item.proposal.id]?.endAt ?? ""}
                      onChange={(event) =>
                        setEdits((current) => ({
                          ...current,
                          [item.proposal!.id]: {
                            ...current[item.proposal!.id],
                            endAt: event.target.value
                          }
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={edits[item.proposal.id]?.notes ?? ""}
                    onChange={(event) =>
                      setEdits((current) => ({
                        ...current,
                        [item.proposal!.id]: {
                          ...current[item.proposal!.id],
                          notes: event.target.value
                        }
                      }))
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => void handleApprove(item.proposal!.id)}
                    disabled={busyId === item.proposal.id}
                  >
                    {busyId === item.proposal.id ? "Approving..." : "Approve"}
                  </Button>
                  <p className="text-xs text-muted">Status: {item.proposal.status}</p>
                  {item.proposal.failureReason ? (
                    <p className="text-xs text-red-300">{item.proposal.failureReason}</p>
                  ) : null}
                </div>

                {item.approval ? (
                  <p className="text-xs text-muted">
                    Approved {new Date(item.approval.approvedAt).toLocaleString()} | Notion: {" "}
                    {item.approval.notionStatus}
                    {item.approval.notionError
                      ? ` (${item.approval.notionError})`
                      : ""}
                  </p>
                ) : null}
              </div>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
