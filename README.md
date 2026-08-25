# NULL // Private Search

## Vercel deployment

The search endpoint is a native Vercel serverless function at `/api/search`.

1. Upload/replace the project files in GitHub.
2. Redeploy the Vercel project.
3. Test `/api/search?q=hello%20world`.
4. Then test the website search box.

The frontend remains the hacker/Matrix design.

### Privacy note
This MVP does not store search history in the app and does not require accounts. The server proxies queries to an upstream web-search page, so it is privacy-focused rather than a fully independent crawler/index. A future version can use a self-hosted index.
