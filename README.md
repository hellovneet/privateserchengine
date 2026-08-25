# NULL // Private Search — Vercel v3

This version keeps the hacker UI and fixes the search gateway strategy.

Search order:
1. Mojeek HTML results (independent search index)
2. DuckDuckGo Lite fallback
3. If both gateways fail, the UI returns a working direct Mojeek search link instead of a dead error.

Deploy:
- Replace the files in the GitHub repository with this ZIP's contents.
- Redeploy the Vercel project.
- Test `/api/search?q=what%20is%20ai`.

Privacy:
The app itself does not save search history or create accounts. The backend proxies the query to the selected upstream search provider. This is privacy-focused, not a fully independent crawler/index yet.
