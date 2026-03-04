import { callGrok } from "../lib/grok-client.js";

interface Entity {
  name: string;
  type: string;
  sentiment: "positive" | "negative" | "neutral";
}

/** Analyze sentiment of text with entity extraction */
export async function analyzeSentiment(text: string): Promise<{
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  confidence: number;
  entities: Entity[];
  summary: string;
  key_phrases: string[];
}> {
  const response = await callGrok(
    [
      {
        role: "system",
        content: `You are a sentiment analysis expert. Analyze the provided text and return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "sentiment": "positive|negative|neutral|mixed",
  "confidence": 0.95,
  "entities": [
    { "name": "entity name", "type": "person|organization|product|location|other", "sentiment": "positive|negative|neutral" }
  ],
  "summary": "brief sentiment summary in one sentence",
  "key_phrases": ["phrase1", "phrase2"]
}

Confidence is 0.0 to 1.0. Extract all named entities. Identify 3-5 key phrases.`,
      },
      {
        role: "user",
        content: `Analyze the sentiment of this text:\n\n${text}`,
      },
    ],
    { temperature: 0.1, maxTokens: 2048 }
  );

  try {
    return JSON.parse(response.content);
  } catch {
    return {
      sentiment: "neutral",
      confidence: 0,
      entities: [],
      summary: response.content,
      key_phrases: [],
    };
  }
}
