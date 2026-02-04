import type { CaptureInput } from "@aschedual/shared";

export function heuristicParse(input: CaptureInput) {
  const text = `${input.title}\n${input.selected_text ?? ""}\n${
    input.context_snippet ?? ""
  }`.toLowerCase();

  let type: "paper" | "opportunity" | "outreach" = "paper";
  if (text.includes("apply") || text.includes("deadline")) {
    type = "opportunity";
  } else if (text.includes("reach out") || text.includes("email")) {
    type = "outreach";
  }

  const summarySource = input.selected_text || input.context_snippet || input.title;
  const summary = summarySource.slice(0, 400);

  return {
    type,
    title: input.title,
    url: input.url,
    deadline: null,
    deadline_tz: null,
    deadline_raw: null,
    confidence: {
      type: 0.4,
      deadline: 0.1,
      requirements: 0.2,
      effort: 0.2
    },
    requirements: [],
    deliverables: [],
    suggested_effort_minutes: null,
    suggested_block_minutes: null,
    summary,
    notes: ["Heuristic fallback used"]
  };
}
