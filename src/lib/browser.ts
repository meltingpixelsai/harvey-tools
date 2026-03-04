import { chromium, type Browser, type Page } from "playwright";
import { config } from "../config.js";

let browser: Browser | null = null;

/** Get or create the shared Playwright browser instance */
async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browser;
}

/** Create a new page with standard config. Caller MUST close the page when done. */
export async function createPage(options?: {
  blockMedia?: boolean;
  width?: number;
  height?: number;
}): Promise<Page> {
  const b = await getBrowser();
  const page = await b.newPage({
    viewport: {
      width: options?.width ?? 1280,
      height: options?.height ?? 720,
    },
    userAgent:
      "Mozilla/5.0 (compatible; HarveyTools/1.0; +https://tools.rugslayer.com) AppleWebKit/537.36 Chrome/120.0.0.0",
  });

  // Block heavy resources for scraping (faster + cheaper)
  if (options?.blockMedia !== false) {
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "font", "media", "stylesheet"].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });
  }

  page.setDefaultTimeout(config.browser.timeout);
  return page;
}

/** Navigate to URL and wait for content to settle */
export async function navigateTo(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle", timeout: config.browser.timeout });
}

/** Extract text content from the current page */
export async function extractText(page: Page, maxLength: number): Promise<{ title: string; content: string }> {
  const title = await page.title();
  const content = await page.evaluate(() => {
    // Remove script/style/nav/footer noise
    const remove = document.querySelectorAll("script, style, nav, footer, header, aside, [role=banner], [role=navigation]");
    remove.forEach((el) => el.remove());
    return document.body?.innerText?.trim() || "";
  });

  return {
    title,
    content: content.slice(0, maxLength),
  };
}

/** Gracefully close the browser (for cleanup) */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
