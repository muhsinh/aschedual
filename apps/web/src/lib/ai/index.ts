import {
  captureInputSchema,
  parsedItemSchema,
  type CaptureInput,
  type ParsedItem
} from "@aschedual/shared";
import { heuristicParse } from "./heuristic";
import { openaiParse } from "./openai";

export async function parseCapture(input: CaptureInput): Promise<ParsedItem> {
  const validated = captureInputSchema.parse(input);
  const provider = process.env.AI_PROVIDER ?? "openai";

  let raw: unknown;
  if (provider === "openai" && process.env.AI_PROVIDER_KEY) {
    try {
      raw = await openaiParse(validated, false);
      return parsedItemSchema.parse(raw);
    } catch {
      raw = await openaiParse(validated, true);
      return parsedItemSchema.parse(raw);
    }
  }

  raw = heuristicParse(validated);
  return parsedItemSchema.parse(raw);
}
