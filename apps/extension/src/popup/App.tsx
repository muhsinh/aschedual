import { useEffect, useState } from "react";
import { Button, Card, Chip, Input, Select } from "@aschedual/ui";
import type { ParsedItem, ProposedPlan } from "@aschedual/shared";

type Step = "captured" | "parsed" | "destinations" | "plan" | "success";

type Capture = {
  title: string;
  url: string;
  selected_text?: string | null;
  context_snippet?: string | null;
  use_page_context: boolean;
};

type DestinationResponse = {
  calendars: { id: string; name: string; is_default: boolean; time_zone?: string }[];
  notion_databases: { id: string; name: string; is_default: boolean }[];
};

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getSelectionText(tabId: number) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => window.getSelection()?.toString() ?? ""
  });
  return result as string;
}

async function getContextSnippet(tabId: number) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => document.body?.innerText?.slice(0, 2000) ?? ""
  });
  return result as string;
}

export function App() {
  const [step, setStep] = useState<Step>("captured");
  const [token, setToken] = useState<string | null>(null);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [parsed, setParsed] = useState<ParsedItem | null>(null);
  const [destinations, setDestinations] = useState<DestinationResponse | null>(null);
  const [calendarId, setCalendarId] = useState<string>("");
  const [notionDbId, setNotionDbId] = useState<string>("");
  const [plan, setPlan] = useState<ProposedPlan | null>(null);
  const [status, setStatus] = useState<string>("");
  const [deadlineEventEnabled, setDeadlineEventEnabled] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get(["authToken"], async (res) => {
      setToken(res.authToken ?? null);
    });
  }, []);

  useEffect(() => {
    const loadCapture = async () => {
      const tab = await getActiveTab();
      if (!tab?.id) return;
      const selected = await getSelectionText(tab.id);
      setCapture({
        title: tab.title ?? "Untitled",
        url: tab.url ?? "",
        selected_text: selected || null,
        context_snippet: null,
        use_page_context: false
      });
    };
    loadCapture();
  }, []);

  const apiFetch = async (path: string, body?: any) => {
    if (!token) throw new Error("Missing extension token");
    const res = await fetch(`http://localhost:3000${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  };

  const connectExtension = async () => {
    await chrome.tabs.create({ url: "http://localhost:3000/extension/connect" });
  };

  const handleParse = async () => {
    if (!capture) return;
    if (!token) {
      setStatus("Connect extension first.");
      return;
    }
    setStatus("Parsing...");
    const data = await apiFetch("/api/parse", capture);
    setParsed(data);
    setDeadlineEventEnabled(data.type === "opportunity");
    setStep("parsed");
    setStatus("");
  };

  const handleLoadDestinations = async () => {
    const data = (await apiFetch("/api/destinations")) as DestinationResponse;
    setDestinations(data);
    const defaultCal = data.calendars.find((c) => c.is_default);
    if (defaultCal) setCalendarId(defaultCal.id);
    const defaultDb = data.notion_databases.find((n) => n.is_default);
    if (defaultDb) setNotionDbId(defaultDb.id);
    setStep("destinations");
  };

  const handleSuggest = async () => {
    if (!parsed || !calendarId) return;
    setStatus("Building plan...");
    const data = (await apiFetch("/api/schedule/suggest", {
      parsed,
      calendar_id: calendarId,
      overrides: {
        deadline_event_enabled: deadlineEventEnabled,
        effort_minutes: parsed.suggested_effort_minutes ?? undefined,
        block_minutes: parsed.suggested_block_minutes ?? undefined
      }
    })) as ProposedPlan;
    setPlan(data);
    setStep("plan");
    setStatus("");
  };

  const handleApprove = async () => {
    if (!parsed || !plan || !calendarId) return;
    setStatus("Creating events...");
    await apiFetch("/api/schedule/approve", {
      parsed,
      plan: { ...plan, deadline_event_enabled: deadlineEventEnabled },
      calendar_id: calendarId,
      notion_database_id: notionDbId || null
    });
    setStep("success");
    setStatus("");
  };

  const handleSaveOnly = async () => {
    if (!parsed || !plan || !calendarId) return;
    setStatus("Saving...");
    await apiFetch("/api/schedule/approve", {
      parsed,
      plan: { ...plan, deadline_event_enabled: deadlineEventEnabled },
      calendar_id: calendarId,
      notion_database_id: notionDbId || null,
      save_only: true
    });
    setStep("success");
    setStatus("");
  };

  if (!token) {
    return (
      <main className="min-h-[520px] w-[360px] bg-bg p-4 text-text">
        <Card className="space-y-3">
          <h1 className="text-lg font-semibold">Connect Aschedual</h1>
          <p className="text-sm text-text-muted">
            Connect the extension to your account to start capturing.
          </p>
          <Button onClick={connectExtension}>Connect extension</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[520px] w-[360px] bg-bg p-4 text-text">
      {status ? (
        <p className="mb-2 text-xs text-text-muted">{status}</p>
      ) : null}

      {step === "captured" && capture && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Captured</h1>
            <Chip>Draft</Chip>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-text">{capture.title}</p>
            <p className="truncate text-xs text-text-muted">{capture.url}</p>
          </div>
          {capture.selected_text ? (
            <p className="text-xs text-text-muted">
              Selection captured ({capture.selected_text.length} chars)
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              Select the requirements/deadline section for best results.
            </p>
          )}
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={capture.use_page_context}
              onChange={async (e) => {
                const checked = e.target.checked;
                let snippet = capture.context_snippet;
                if (checked) {
                  const tab = await getActiveTab();
                  if (tab?.id) {
                    snippet = await getContextSnippet(tab.id);
                  }
                }
                setCapture({
                  ...capture,
                  use_page_context: checked,
                  context_snippet: checked ? snippet : null
                });
              }}
            />
            Expand context (optional)
          </label>
          <Button onClick={handleParse}>Parse</Button>
        </Card>
      )}

      {step === "parsed" && parsed && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Parsed</h1>
            <Chip>{parsed.type}</Chip>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-text-muted">Deadline</label>
            <Input
              value={parsed.deadline ?? ""}
              onChange={(e) =>
                setParsed({ ...parsed, deadline: e.target.value || null })
              }
              placeholder="YYYY-MM-DDTHH:mm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs text-text-muted">Effort (min)</label>
              <Input
                type="number"
                value={parsed.suggested_effort_minutes ?? ""}
                onChange={(e) =>
                  setParsed({
                    ...parsed,
                    suggested_effort_minutes: e.target.value
                      ? Number(e.target.value)
                      : null
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-text-muted">Block size</label>
              <Input
                type="number"
                value={parsed.suggested_block_minutes ?? ""}
                onChange={(e) =>
                  setParsed({
                    ...parsed,
                    suggested_block_minutes: e.target.value
                      ? Number(e.target.value)
                      : null
                  })
                }
              />
            </div>
          </div>
          <Button onClick={handleLoadDestinations}>Continue</Button>
        </Card>
      )}

      {step === "destinations" && destinations && (
        <Card className="space-y-3">
          <h1 className="text-lg font-semibold">Destinations</h1>
          <div className="space-y-2">
            <label className="text-xs text-text-muted">Calendar</label>
            <Select value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
              {destinations.calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </Select>
          </div>
          {destinations.notion_databases.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-text-muted">Notion DB</label>
              <Select value={notionDbId} onChange={(e) => setNotionDbId(e.target.value)}>
                <option value="">None</option>
                {destinations.notion_databases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <Button onClick={handleSuggest}>Build plan</Button>
        </Card>
      )}

      {step === "plan" && plan && (
        <Card className="space-y-3">
          <h1 className="text-lg font-semibold">Plan</h1>
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={deadlineEventEnabled}
              onChange={(e) => setDeadlineEventEnabled(e.target.checked)}
            />
            Add deadline event
          </label>
          <ul className="space-y-2 text-xs text-text-muted">
            {plan.blocks.map((block) => (
              <li key={block.start}>
                {new Date(block.start).toLocaleString()}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button onClick={handleApprove}>Approve Plan</Button>
            <Button variant="secondary" onClick={() => setStep("parsed")}>
              Edit
            </Button>
            <Button variant="ghost" onClick={handleSaveOnly}>
              Save Only
            </Button>
          </div>
        </Card>
      )}

      {step === "success" && (
        <Card className="space-y-3">
          <h1 className="text-lg font-semibold">Saved + scheduled</h1>
          <p className="text-sm text-text-muted">
            Your item was saved and events were created.
          </p>
        </Card>
      )}
    </main>
  );
}
