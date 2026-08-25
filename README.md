# NULL // Private Search — Vercel Fixed

## Deploy
Push the contents of this folder to the GitHub repository and redeploy the Vercel project.

The important fix is `api/search.js`. Vercel now has a real serverless `/api/search` endpoint instead of relying on `server.js` to run as a persistent Express server.

## Local
npm install
npx vercel dev

Then open the local URL shown by Vercel.

## Privacy
The app does not create an account or intentionally store local search history. The serverless endpoint proxies the query to DuckDuckGo HTML, so this is privacy-focused rather than a completely independent search index.
