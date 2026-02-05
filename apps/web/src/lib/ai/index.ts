import { z } from "zod";
import { buildFallbackProposal } from "./fallback";
import { parseWithOpenAI } from "./openai";

const parsedProposalSchema = z.object({
  parsedTitle: z.string().min(1).max(500),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().max(500).nullable().optional(),
  notes: z.string().max(5000).nullable().optional()
});

export async function generateProposalFromCapture(args: {
  title: string;
  url: string;
  selectedText: string;
  snippet?: string | null;
  timezone: string;
  durationMinutes: number;
}) {
  const provider = process.env.AI_PROVIDER ?? "openai";

  if (
    (provider === "openai" || provider === "openrouter") &&
    process.env.AI_PROVIDER_KEY
  ) {
    try {
      const parsed = await parseWithOpenAI(args);
      const valid = parsedProposalSchema.parse(parsed);
      return {
        ...valid,
        timezone: args.timezone
      };
    } catch {
      // deterministic fallback below
    }
  }

  return buildFallbackProposal({
    title: args.title,
    selectedText: args.selectedText,
    snippet: args.snippet,
    timezone: args.timezone,
    durationMinutes: args.durationMinutes
  });
}
