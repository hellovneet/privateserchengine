/**
 * NULL Search backend
 *
 * Preferred production mode:
 *   Set SEARXNG_URL in Vercel Environment Variables to your own
 *   self-hosted SearXNG instance, e.g. https://search.example.com
 *
 * The endpoint asks SearXNG for JSON results. If no private instance is
 * configured, it uses a public instance list as a temporary development mode.
 */

const PUBLIC_INSTANCES = [
  "https://searx.tiekoetter.com",
  "https://search.rhscz.eu",
  "https://search.wdpserver.com"
];

function clean(value) {
  return String(value ?? "").replace(/<[^>]*>/g, "").trim();
}

async function searchSearXNG(base, q) {
  const root = base.replace(/\/+$/, "");
  const endpoint =
    `${root}/search?q=${encodeURIComponent(q)}&format=json&language=en&categories=general`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "Accept": "application/json",
        "User-Agent": "NULLSearch/1.0"
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    return (Array.isArray(data.results) ? data.results : [])
      .filter(x => x && x.url && x.title)
      .slice(0, 20)
      .map(x => ({
        title: clean(x.title),
        url: String(x.url),
        snippet: clean(x.content || x.snippet || ""),
        engine: clean(x.engine || "web")
      }));
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const q = String(req.query?.q ?? "").trim();

  if (!q) return res.status(400).json({ error: "Enter a search query." });
  if (q.length > 300) return res.status(400).json({ error: "Query is too long." });

  const configured = String(process.env.SEARXNG_URL || "").trim();
  const instances = configured
    ? [configured]
    : PUBLIC_INSTANCES;

  try {
    const attempts = instances.map(async base => ({
      base,
      results: await searchSearXNG(base, q)
    }));

    // Use the first instance that returns actual results.
    const settled = await Promise.allSettled(attempts);
    const winner = settled.find(
      x => x.status === "fulfilled" && x.value.results.length > 0
    );

    if (!winner) {
      return res.status(503).json({
        error: configured
          ? "Your private SearXNG instance did not return results."
          : "No SearXNG gateway returned results. Configure SEARXNG_URL in Vercel for reliable production search.",
        mode: configured ? "private" : "development"
      });
    }

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      query: q,
      results: winner.value.results,
      source: configured ? "private-searxng" : "searxng-development"
    });
  } catch (error) {
    return res.status(502).json({
      error: "Search backend failed.",
      detail: String(error?.message || "unknown error")
    });
  }
}
