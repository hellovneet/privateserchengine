const INSTANCES = [
  "https://searx.tiekoetter.com",
  "https://search.rhscz.eu",
  "https://search.wdpserver.com",
  "https://metasearx.com"
];

async function queryInstance(base, q) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  try {
    const url = `${base}/search?q=${encodeURIComponent(q)}&format=json&language=en`;
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "NULLSearch/1.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const results = Array.isArray(data.results) ? data.results : [];
    return results
      .filter(x => x && x.title && x.url)
      .slice(0, 20)
      .map(x => ({
        title: String(x.title).replace(/<[^>]*>/g, ""),
        url: String(x.url),
        snippet: String(x.content || x.snippet || "").replace(/<[^>]*>/g, "")
      }));
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const q = String(req.query?.q ?? "").trim();

  if (!q) return res.status(400).json({ error: "Enter a search query." });
  if (q.length > 300) return res.status(400).json({ error: "Query is too long." });

  const attempts = INSTANCES.map(async (base) => {
    const results = await queryInstance(base, q);
    if (!results.length) throw new Error("No results");
    return { base, results };
  });

  try {
    const winner = await Promise.any(attempts);

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      query: q,
      results: winner.results,
      source: "SearXNG"
    });
  } catch {
    // Last-resort Wikipedia search. This still gives a real result rather
    // than returning a dead gateway message.
    try {
      const wikiUrl =
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}` +
        `&format=json&origin=*&srlimit=10`;
      const response = await fetch(wikiUrl, {
        headers: { "User-Agent": "NULLSearch/1.0" }
      });
      const data = await response.json();

      const results = (data.query?.search || []).map(item => ({
        title: item.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
        snippet: String(item.snippet || "").replace(/<[^>]*>/g, "")
      }));

      if (results.length) {
        return res.status(200).json({
          query: q,
          results,
          source: "Wikipedia",
          warning: "Web gateway unavailable; Wikipedia fallback used."
        });
      }
    } catch {}

    return res.status(503).json({
      error: "Search providers are temporarily unavailable. Please try again."
    });
  }
}
