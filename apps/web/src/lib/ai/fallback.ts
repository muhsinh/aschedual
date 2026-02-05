type FallbackInput = {
  title: string;
  selectedText: string;
  snippet?: string | null;
  timezone: string;
  durationMinutes: number;
};

function nextTopOfHour(date: Date) {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return next;
}

function extractDateHint(text: string) {
  const lowered = text.toLowerCase();

  if (lowered.includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  }

  const isoDateMatch = lowered.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoDateMatch) {
    const date = new Date(`${isoDateMatch[1]}T09:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

export function buildFallbackProposal(input: FallbackInput) {
  const content = `${input.selectedText}\n${input.snippet ?? ""}`.trim();
  const start = extractDateHint(content) ?? nextTopOfHour(new Date());
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);

  const parsedTitle = content
    ? content.split(/[\n.!?]/).map((line) => line.trim()).find(Boolean) || input.title
    : input.title;

  return {
    parsedTitle: parsedTitle.slice(0, 140),
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    location: null,
    notes: "Generated with deterministic fallback parser.",
    timezone: input.timezone
  };
}
