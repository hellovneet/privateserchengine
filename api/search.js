import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const q = String(req.query?.q || "").trim();

  if (!q) return res.status(400).json({ error: "Enter a search query." });
  if (q.length > 300) return res.status(400).json({ error: "Query is too long." });

  try {
    const url = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      throw new Error(`Search provider returned ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];

    $(".result").each((_, el) => {
      if (results.length >= 20) return false;

      const title = $(el).find(".result__title a").first();
      const snippet = $(el).find(".result__snippet").first();
      let link = title.attr("href");

      if (!title.length || !link) return;

      // DDG can return redirect URLs; preserve them as-is if present.
      results.push({
        title: title.text().trim(),
        url: link,
        snippet: snippet.text().trim()
      });
    });

    return res.status(200).json({ query: q, results });
  } catch (error) {
    console.error(error);
    return res.status(502).json({
      error: "Search gateway is temporarily unavailable."
    });
  }
}