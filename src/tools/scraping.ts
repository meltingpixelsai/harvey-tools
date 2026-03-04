import { createPage, navigateTo, extractText } from "../lib/browser.js";
import { callGrok } from "../lib/grok-client.js";

/** Scrape a URL and return cleaned text content */
export async function scrapeUrl(
  url: string,
  maxLength: number = 10_000
): Promise<{
  url: string;
  title: string;
  content: string;
  word_count: number;
  scraped_at: string;
}> {
  const page = await createPage({ blockMedia: true });
  try {
    await navigateTo(page, url);
    const { title, content } = await extractText(page, maxLength);
    return {
      url,
      title,
      content,
      word_count: content.split(/\s+/).filter(Boolean).length,
      scraped_at: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
}

/** Take a screenshot of a URL and return base64 PNG */
export async function screenshotUrl(
  url: string,
  fullPage: boolean = true,
  width: number = 1280,
  height: number = 720
): Promise<{
  url: string;
  image_base64: string;
  width: number;
  height: number;
  format: string;
}> {
  // Don't block images for screenshots
  const page = await createPage({ blockMedia: false, width, height });
  try {
    await navigateTo(page, url);
    const buffer = await page.screenshot({ fullPage, type: "png" });
    return {
      url,
      image_base64: buffer.toString("base64"),
      width,
      height,
      format: "png",
    };
  } finally {
    await page.close();
  }
}

/** Scrape URL then extract structured data via Grok */
export async function extractStructuredData(
  url: string,
  schemaDescription: string
): Promise<{
  url: string;
  data: unknown;
  model: string;
}> {
  // Scrape the page first
  const scraped = await scrapeUrl(url, 30_000);

  // Send to Grok for structured extraction
  const response = await callGrok(
    [
      {
        role: "system",
        content:
          "You are a data extraction assistant. Extract structured data from the provided webpage content. Return ONLY valid JSON - no markdown, no explanation, no code fences. If you cannot extract the requested data, return an empty object {}.",
      },
      {
        role: "user",
        content: `Extract structured data from this webpage content matching this schema:\n\n${schemaDescription}\n\nWebpage title: ${scraped.title}\nWebpage content:\n${scraped.content}`,
      },
    ],
    { temperature: 0.1, maxTokens: 4096 }
  );

  let data: unknown;
  try {
    data = JSON.parse(response.content);
  } catch {
    // If Grok didn't return valid JSON, wrap the raw text
    data = { raw_response: response.content };
  }

  return {
    url,
    data,
    model: response.model,
  };
}
