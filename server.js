import express from "express";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Enter a search query." });
  if (q.length > 300) return res.status(400).json({ error: "Query is too long." });

  try {
    const url = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(q);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PrivateSearch/1.0)",
        "Accept": "text/html"
      }
    });

    if (!response.ok) throw new Error(`Upstream search returned ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const results = [];

    $(".result").each((_, el) => {
      if (results.length >= 20) return false;

      const titleEl = $(el).find(".result__title a").first();
      const snippetEl = $(el).find(".result__snippet").first();
      const link = titleEl.attr("href");

      if (!titleEl.length || !link) return;

      results.push({
        title: titleEl.text().trim(),
        url: link,
        snippet: snippetEl.text().trim()
      });
    });

    res.json({ query: q, results });
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(502).json({
      error: "Search provider could not be reached. Try again."
    });
  }
});

app.get("*splat", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Private Search running on http://localhost:${PORT}`);
});