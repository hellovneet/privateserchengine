# NULL // Private Search v5

## Goal

A hacker-style private search frontend backed by SearXNG.

### Production architecture

NULL Search
  -> Vercel /api/search
  -> YOUR self-hosted SearXNG instance
  -> multiple search engines
  -> web results

This is the recommended setup. It does not rely on Wikipedia for normal search.

## Configure your own SearXNG

Deploy SearXNG on a VPS/server or another service you control.

Then in Vercel:

Project -> Settings -> Environment Variables

Add:

SEARXNG_URL=https://YOUR-SEARXNG-DOMAIN

Redeploy.

The API will use only your configured SearXNG instance when this variable exists.

## Temporary development mode

If SEARXNG_URL is not configured, the API tries a small set of public SearXNG
instances. Public instances can be rate-limited or unavailable, so this mode is
not suitable for production.

## Important privacy note

The NULL UI does not save search history or require accounts. Once you connect
your own SearXNG instance, you control the upstream search gateway. You should
also configure that SearXNG instance not to retain logs if your privacy goal
requires that.

Developer: Vineet Sharma.
