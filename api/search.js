import * as cheerio from "cheerio";

const SOURCES = [
  {
    name: "mojeek",
    url: q => `https://www.mojeek.com/search?q=${encodeURIComponent(q)}&s=0`,
    parse: html => {
      const $ = cheerio.load(html);
      const results = [];
      $("ul.results-standard > li").each((_, li) => {
        if (results.length >= 20) return false;
        const a = $(li).find("a.ob").first();
        const title = $(li).find("h2 a").first().text().trim();
        const url = a.attr("href") || $(li).find("h2 a").first().attr("href");
        const snippet = $(li).find("p.s").first().text().trim();
        if (title && url) results.push({ title, url, snippet });
      });
      return results;
    }
  },
  {
    name: "duckduckgo-lite",
    url: q => `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}`,
    parse: html => {
      const $ = cheerio.load(html);
      const results = [];
      $("a.result-link").each((_, a) => {
        if (results.length >= 20) return false;
        const title = $(a).text().trim();
        const url = $(a).attr("href");
        const row = $(a).closest("tr");
        const snippet = row.find("td").last().text().trim();
        if (title && url) results.push({ title, url, snippet });
      });
      return results;
    }
  }
];

export default async function handler(req, res) {
  const q = String(req.query?.q ?? "").trim();

  if (!q) return res.status(400).json({ error: "Enter a search query." });
  if (q.length > 300) return res.status(400).json({ error: "Query is too long." });

  const diagnostics = [];

  for (const source of SOURCES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(source.url(q), {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NULLSearch/1.0; +https://privateserchengine.vercel.app)",
          "Accept": "text/html,application/xhtml+xml"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const results = source.parse(html);

      if (results.length) {
        res.setHeader("Cache-Control", "no-store, max-age=0");
        return res.status(200).json({
          query: q,
          results,
          source: source.name
        });
      }

      diagnostics.push(`${source.name}: response received but no results parsed`);
    } catch (error) {
      diagnostics.push(
        `${source.name}: ${error?.name === "AbortError" ? "timeout" : error?.message || "request failed"}`
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // Never leave the user with a completely dead search box.
  // This fallback opens the query directly on an independent search engine.
  const fallback = `https://www.mojeek.com/search?q=${encodeURIComponent(q)}`;

  return res.status(200).json({
    query: q,
    source: "fallback",
    results: [{
      title: `Search "${q}" on Mojeek`,
      url: fallback,
      snippet: "The private gateway could not retrieve results right now. Open this search directly to continue."
    }],
    warning: "Gateway fallback used."
  });
}
