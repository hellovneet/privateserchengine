const SOURCES = [
  {
    name: 'duckduckgo-lite',
    buildUrl: q => `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}`,
    parse(html) {
      const out = [];
      const re = /<a[^>]+class=["'][^"']*result-link[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = re.exec(html)) && out.length < 20) {
        const url = decodeEntities(stripTags(m[1])).trim();
        const title = decodeEntities(stripTags(m[2])).replace(/\s+/g, ' ').trim();
        if (!url || !title) continue;
        const after = html.slice(re.lastIndex, re.lastIndex + 1800);
        const sm = after.match(/class=["'][^"']*(?:result-snippet|result-snippet)[^"']*["'][^>]*>([\s\S]*?)<\//i);
        const snippet = sm ? decodeEntities(stripTags(sm[1])).replace(/\s+/g, ' ').trim() : '';
        out.push({ title, url, snippet });
      }
      return out;
    }
  },
  {
    name: 'duckduckgo-html',
    buildUrl: q => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
    parse(html) {
      const out = [];
      const re = /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = re.exec(html)) && out.length < 20) {
        let url = decodeEntities(stripTags(m[1])).trim();
        const title = decodeEntities(stripTags(m[2])).replace(/\s+/g, ' ').trim();
        if (url.includes('uddg=')) {
          try { url = decodeURIComponent(new URL(url, 'https://duckduckgo.com').searchParams.get('uddg') || url); } catch {}
        }
        if (!url || !title) continue;
        const after = html.slice(re.lastIndex, re.lastIndex + 1600);
        const sm = after.match(/class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\//i);
        const snippet = sm ? decodeEntities(stripTags(sm[1])).replace(/\s+/g, ' ').trim() : '';
        out.push({ title, url, snippet });
      }
      return out;
    }
  }
];

export default async function handler(req, res) {
  const q = String(req.query?.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Enter a search query.' });
  if (q.length > 300) return res.status(400).json({ error: 'Query is too long.' });

  const errors = [];
  for (const source of SOURCES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(source.buildUrl(q), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
      const html = await response.text();
      const results = source.parse(html);
      if (results.length) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ query: q, results, source: source.name });
      }
      errors.push(`${source.name}: no results parsed`);
    } catch (e) {
      errors.push(`${source.name}: ${e?.name === 'AbortError' ? 'timeout' : e.message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  return res.status(502).json({
    error: 'Search gateway is temporarily unavailable.',
    detail: errors.join(' | ')
  });
}

function stripTags(s) { return String(s).replace(/<[^>]*>/g, ''); }
function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}
