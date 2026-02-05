type OpenAIInput = {
  title: string;
  url: string;
  selectedText: string;
  snippet?: string | null;
  timezone: string;
  durationMinutes: number;
};

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string }>;
    };
  }>;
};

function normalizeBaseUrl(value?: string) {
  if (!value) {
    return DEFAULT_BASE_URL;
  }
  return value.replace(/\/+$/, "");
}

function buildHeaders(provider: string, apiKey: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };

  if (provider === "openrouter") {
    if (process.env.OPENROUTER_SITE_URL) {
      headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
    }
    if (process.env.OPENROUTER_APP_NAME) {
      headers["X-Title"] = process.env.OPENROUTER_APP_NAME;
    }
  }

  return headers;
}

function extractContentText(content?: string | Array<{ text?: string }>) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const textPart = content.find((part) => typeof part?.text === "string");
    return textPart?.text;
  }
  return null;
}

export async function parseWithOpenAI(input: OpenAIInput) {
  const apiKey = process.env.AI_PROVIDER_KEY;
  if (!apiKey) {
    throw new Error("AI_PROVIDER_KEY is not set");
  }

  const provider = process.env.AI_PROVIDER ?? "openai";
  const baseUrl = normalizeBaseUrl(process.env.AI_BASE_URL);
  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;

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

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(provider, apiKey),
    body: JSON.stringify({
      model,
      messages: [
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

  const json = (await response.json()) as ChatCompletionResponse;
  const text = extractContentText(json.choices?.[0]?.message?.content);

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
