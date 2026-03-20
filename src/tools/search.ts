interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer_box: { answer?: string; snippet?: string; title?: string } | null;
  total_results: number;
  searched_at: string;
}

/** Search the web via SerpAPI (Google) and return organic results */
export async function searchWeb(
  query: string,
  numResults: number = 10
): Promise<SearchResponse> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SERPAPI_KEY not configured");
  }

  const params = new URLSearchParams({
    q: query,
    api_key: apiKey,
    engine: "google",
    num: String(numResults),
  });

  const res = await fetch(`https://serpapi.com/search?${params.toString()}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SerpAPI error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    organic_results?: Array<{ title: string; link: string; snippet: string; position: number }>;
    answer_box?: { answer?: string; snippet?: string; title?: string };
    search_parameters?: { q: string };
  };

  return {
    query,
    results: (data.organic_results ?? []).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      position: r.position,
    })),
    answer_box: data.answer_box ?? null,
    total_results: data.organic_results?.length ?? 0,
    searched_at: new Date().toISOString(),
  };
}
