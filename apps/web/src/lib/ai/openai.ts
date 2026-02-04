import type { CaptureInput } from "@aschedual/shared";

const MODEL = "gpt-4o-mini";

export async function openaiParse(
  input: CaptureInput,
  strict: boolean
): Promise<unknown> {
  const apiKey = process.env.AI_PROVIDER_KEY;
  if (!apiKey) {
    throw new Error("AI_PROVIDER_KEY is not set");
  }

  const system = `You are a strict JSON extraction engine. Return only valid JSON.
Schema:
{
  "type": "paper"|"opportunity"|"outreach",
  "title": string,
  "url": string,
  "deadline": string|null,
  "deadline_tz": string|null,
  "deadline_raw": string|null,
  "confidence": { "type": number, "deadline": number, "requirements": number, "effort": number },
  "requirements": string[],
  "deliverables": string[],
  "suggested_effort_minutes": number|null,
  "suggested_block_minutes": number|null,
  "summary": string,
  "notes": string[]
}`;

  const user = {
    capture: input,
    instructions: strict
      ? "Return valid JSON only. No markdown."
      : "Return JSON only."
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!res.ok) {
    throw new Error(`OpenAI error: ${res.status}`);
  }
  const json = await res.json();
  const content = json.output?.[0]?.content?.[0]?.text ?? json.output_text;
  if (!content) {
    throw new Error("No output from OpenAI");
  }
  return JSON.parse(content);
}
