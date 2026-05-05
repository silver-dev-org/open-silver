# Token Tracker

Token Tracker is a self-hosted internal team utility that collects LLM API usage (input/output tokens) from each team member and consolidates it into a shared dashboard. Each organization deploys their own isolated instance — no data leaves your Vercel project.

## Self-hosted only

The public Open Silver deployment at [open.silver](https://open.silver) is a **reference implementation only**. It is intentionally not configured and will display a setup-required screen.

To use Token Tracker, you must deploy your own instance. See [How to deploy](#how-to-deploy) below.

## What it does

- Team members submit their work email and provider API key through a simple form.
- The server fetches this month's token usage from the provider's usage API (Anthropic, OpenAI).
- API keys are **AES-256-GCM encrypted** before being written to private blob storage.
- A scheduled cron job (every 6 hours) re-fetches usage for all stored keys so the dashboard stays fresh without requiring manual re-submission.
- The dashboard is protected by a password and shows per-user, per-provider usage with aggregate team metrics.

## Self-hosted architecture

```
[Team member browser]
  → POST /token-tracker/api/submit  (requires SUBMIT_TOKEN)
      → fetches usage from provider API
      → encrypts API key
      → writes private blob: token-tracker/{sha256(email)}.json

[Vercel Cron, every 6h]
  → GET /token-tracker/api/refresh  (requires CRON_SECRET)
      → lists all blobs
      → decrypts keys, re-fetches usage
      → writes updated blobs

[Dashboard admin browser]
  → GET /token-tracker/dashboard    (requires DASHBOARD_PASSWORD)
      → lists all private blobs
      → renders per-user cards + aggregate metrics
```

## Required environment variables

| Variable | Description |
|---|---|
| `ENCRYPTION_KEY` | 32-byte hex string used for AES-256-GCM encryption of API keys |
| `DASHBOARD_PASSWORD` | Password to unlock the `/token-tracker/dashboard` page |
| `SUBMIT_TOKEN` | Shared token required to authorize usage submissions |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token (set automatically by Vercel when you add a Blob store) |
| `CRON_SECRET` | Secret used by Vercel to authenticate scheduled refresh calls |

### How to generate ENCRYPTION_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## How to deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fopen-silver%2Fopen-silver)

1. Click the button above or import the repository manually in Vercel.
2. Add a **Vercel Blob** store to your project (Storage → Create → Blob). This automatically sets `BLOB_READ_WRITE_TOKEN`.
3. Set the remaining environment variables in your project's Settings → Environment Variables:
   - `ENCRYPTION_KEY`
   - `DASHBOARD_PASSWORD`
   - `SUBMIT_TOKEN`
   - `CRON_SECRET`
4. Redeploy after setting all variables.

If any required variable is missing, Token Tracker pages will display a setup-required screen and API routes will return a `503` response instead of failing or exposing broken behavior.

## Dashboard auth

The dashboard uses a session cookie (`dashboard-auth`) that stores an SHA-256 hash of `DASHBOARD_PASSWORD`. The cookie is:

- `httpOnly` — not accessible to JavaScript
- `sameSite: strict` — CSRF-safe
- `secure: true` in production — HTTPS only
- Valid for 30 days

Password comparisons use `crypto.timingSafeEqual` to prevent timing attacks.

## Submit token flow

`SUBMIT_TOKEN` is a shared secret that authorizes team members to submit usage. Share it with your team (e.g., embed it as a URL parameter: `/token-tracker?token=YOUR_TOKEN`). The form auto-fills the team token field from the URL.

## Isolation

Each Vercel project is a fully isolated instance. Blobs are stored in that project's Blob store and cannot be accessed from other deployments. Deploy one instance per organization.
