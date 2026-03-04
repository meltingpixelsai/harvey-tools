import { callGrok } from "../lib/grok-client.js";

interface CodeIssue {
  severity: "critical" | "high" | "medium" | "low" | "info";
  line?: number;
  message: string;
  suggestion: string;
}

/** Review code for security, quality, and performance issues */
export async function reviewCode(
  code: string,
  language?: string,
  focus?: string
): Promise<{
  language: string;
  issues: CodeIssue[];
  summary: string;
  score: number;
}> {
  const focusArea = focus || "all";
  const focusInstruction =
    focusArea === "all"
      ? "Review for security vulnerabilities, code quality, performance, and best practices."
      : `Focus specifically on: ${focusArea}.`;

  const response = await callGrok(
    [
      {
        role: "system",
        content: `You are an expert code reviewer. ${focusInstruction}

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "language": "detected language",
  "issues": [
    {
      "severity": "critical|high|medium|low|info",
      "line": null,
      "message": "what's wrong",
      "suggestion": "how to fix it"
    }
  ],
  "summary": "brief overall assessment",
  "score": 85
}

Score from 0-100 where 100 is perfect. Be thorough but fair. If the code is good, say so.`,
      },
      {
        role: "user",
        content: `Review this ${language || ""}code:\n\n${code}`,
      },
    ],
    { temperature: 0.2, maxTokens: 4096 }
  );

  try {
    return JSON.parse(response.content);
  } catch {
    return {
      language: language || "unknown",
      issues: [],
      summary: response.content,
      score: 0,
    };
  }
}
