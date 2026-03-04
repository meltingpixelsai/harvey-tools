import { callGrok } from "../lib/grok-client.js";

const SYSTEM_PROMPTS: Record<string, string> = {
  blog_post:
    "You are a skilled blog writer. Write engaging, well-structured blog posts with clear headings, intro, body, and conclusion. Use markdown formatting.",
  product_description:
    "You are a conversion-focused copywriter. Write compelling product descriptions that highlight benefits, features, and include a call to action.",
  documentation:
    "You are a technical writer. Write clear, precise documentation with examples. Use markdown with code blocks where appropriate.",
  social_post:
    "You are a social media expert. Write concise, engaging posts optimized for engagement. Include a hook, value, and CTA. No hashtag spam.",
  email:
    "You are an email copywriter. Write professional emails with clear subject line suggestions, compelling body, and strong CTA.",
};

const LENGTH_TOKENS: Record<string, number> = {
  short: 1024,
  medium: 2048,
  long: 4096,
};

/** Generate content based on type, topic, and parameters */
export async function generateContent(
  type: string,
  topic: string,
  tone?: string,
  length?: string,
  keywords?: string
): Promise<{
  type: string;
  content: string;
  word_count: number;
  model: string;
}> {
  const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.blog_post;
  const toneStr = tone || "professional";
  const maxTokens = LENGTH_TOKENS[length || "medium"] ?? 2048;

  let userPrompt = `Write a ${type.replace(/_/g, " ")} about: ${topic}\n\nTone: ${toneStr}`;
  if (keywords) {
    userPrompt += `\nKeywords to include: ${keywords}`;
  }
  if (length) {
    userPrompt += `\nTarget length: ${length}`;
  }

  const response = await callGrok(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.7, maxTokens }
  );

  return {
    type,
    content: response.content,
    word_count: response.content.split(/\s+/).filter(Boolean).length,
    model: response.model,
  };
}
