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

/** Search the web via Serper API and return organic results */
export async function searchWeb(
  query: string,
  numResults: number = 10
): Promise<SearchResponse> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY not configured");
  }

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: numResults }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Serper API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    organic?: Array<{ title: string; link: string; snippet: string; position: number }>;
    answerBox?: { answer?: string; snippet?: string; title?: string };
    searchParameters?: { q: string };
  };

  return {
    query,
    results: (data.organic ?? []).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      position: r.position,
    })),
    answer_box: data.answerBox ?? null,
    total_results: data.organic?.length ?? 0,
    searched_at: new Date().toISOString(),
  };
}
