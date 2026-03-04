import { config } from "../config.js";

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokOptions {
  temperature?: number;
  maxTokens?: number;
}

interface GrokResponse {
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/** Call Grok API and return the assistant's response text */
export async function callGrok(
  messages: GrokMessage[],
  options?: GrokOptions
): Promise<GrokResponse> {
  if (!config.grok.apiKey) {
    throw new Error("XAI_API_KEY not configured");
  }

  const res = await fetch(config.grok.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.grok.apiKey}`,
    },
    body: JSON.stringify({
      model: config.grok.model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Grok API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Grok API returned empty response");
  }

  return {
    content,
    model: data.model,
    usage: data.usage,
  };
}
