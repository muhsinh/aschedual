type OpenAIInput = {
  title: string;
  url: string;
  selectedText: string;
  snippet?: string | null;
  timezone: string;
  durationMinutes: number;
};

const MODEL = "gpt-4o-mini";

export async function parseWithOpenAI(input: OpenAIInput) {
  const apiKey = process.env.AI_PROVIDER_KEY;
  if (!apiKey) {
    throw new Error("AI_PROVIDER_KEY is not set");
  }

  const prompt = {
    task: "Extract a scheduling proposal from a captured webpage selection.",
    requirements: {
      parsedTitle: "short actionable title",
      startAt: "ISO timestamp",
      endAt: "ISO timestamp after startAt",
      location: "string or null",
      notes: "string or null"
    },
    constraints: {
      timezone: input.timezone,
      durationMinutes: input.durationMinutes,
      now: new Date().toISOString()
    },
    capture: {
      title: input.title,
      url: input.url,
      selectedText: input.selectedText,
      snippet: input.snippet ?? null
    }
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content:
            "Return strict JSON only. No markdown, no prose. Fields: parsedTitle,startAt,endAt,location,notes."
        },
        {
          role: "user",
          content: JSON.stringify(prompt)
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const json = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  const text =
    json.output_text ??
    json.output?.[0]?.content?.find((entry) => typeof entry.text === "string")
      ?.text;

  if (!text) {
    throw new Error("OpenAI returned an empty response");
  }

  return JSON.parse(text) as {
    parsedTitle: string;
    startAt: string;
    endAt: string;
    location?: string | null;
    notes?: string | null;
  };
}
