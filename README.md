# NULL // Private Search — Vercel v4

## What changed

The previous version was reaching public HTML gateways that were not returning usable
results. v4 switches the primary search gateway to the SearXNG JSON API and races
several currently listed public instances. SearXNG officially supports `/search`
with `format=json`.

Search flow:
1. Multiple SearXNG public instances in parallel.
2. First healthy instance with results wins.
3. Wikipedia API as a last-resort fallback.
4. A clear 503 only if every provider fails.

The hacker UI is unchanged.

## Deploy

Replace the GitHub repository files with this ZIP, then redeploy the Vercel project.

Test:
`/api/search?q=what%20is%20ai`

## Privacy note

Your UI does not save search history or require an account. However, v4 uses public
SearXNG instances as upstream gateways. Their operators are outside your control.
For stronger privacy and reliability, the next production step is to run your own
SearXNG instance and point this API only to it.
