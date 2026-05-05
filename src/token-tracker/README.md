# Token Tracker

Token Tracker — Self-hosted AI token usage tracking for teams.

## Overview

Token Tracker gives engineering managers and team leads visibility into how much AI tooling their team is actually using, across Claude Code, Codex CLI, and Gemini CLI. Each developer runs a small local collector (CLI or MCP server) that reads the usage logs already written to their machine by those tools. No provider API keys or admin credentials are involved at any point.

Each organization deploys their own isolated instance to Vercel. Reports from team members are sent directly to that instance and stored in the project's own Vercel Blob store. The backend never processes data from other organizations, and Anthropic never sees it.

The key design tradeoff is that precision requires local log access. Token counts come from the actual log files written by each tool, not from provider usage APIs, which means numbers are exact (including cache tokens) and available immediately after a session ends — but they depend on those log files being present on the developer's machine.

## Architecture

```
[Developer's machine]
  local collector (CLI or MCP)
    → reads ~/.claude/, ~/.codex/, ~/.gemini/ session logs
    → POST /token-tracker/api/report  (Authorization: Bearer SUBMIT_TOKEN)

[Vercel — your project]
  /token-tracker/api/report
    → validates SUBMIT_TOKEN
    → writes token-tracker/{sha256(email)}.json to Vercel Blob

[Dashboard — password-protected]
  /token-tracker/dashboard
    → reads all blobs from Vercel Blob
    → renders per-user, per-model usage with aggregate team metrics
```

Each user's data is stored as a single JSON file keyed by a SHA-256 hash of their email. Submitting a new report overwrites the previous one.

## Supported sources

| Source | Status | Notes |
|---|---|---|
| Claude Code | ✅ Full support | Reads `~/.claude/projects/**/*.jsonl`; real token counts and cache data |
| Codex CLI | ✅ Full support | Reads `~/.codex/` session files |
| Gemini CLI | ✅ Full support | Reads `~/.gemini/` session files |
| Cursor | ⚠️ ≤2.x only | See below |

### Cursor 3.1+ limitation

Cursor **≤2.x** writes per-turn token counts and model names to `state.vscdb` (the `cursorDiskKV` table, `bubbleId:*` keys). The collector reads these correctly.

Cursor **3.1+** stopped writing token counts to local storage. Conversation data is now stored as AES-256-GCM encrypted blobs (`agentKv:blob:*` entries). The `bubbleId` rows remain but `tokenCount` is always `{inputTokens:0, outputTokens:0}` and `modelInfo` is null. As a result, the collector prints a warning and skips Cursor on 3.1+ installs:

```
Warning (cursor): Cursor 3.1+ no longer exposes accurate token data locally — skipping.
```

Content-length estimation was considered and rejected: ±30–50% error, no model attribution, and no cache data would produce misleading numbers when mixed with precise Claude Code figures on the same dashboard. Cursor 3.1+ users should check their usage at [cursor.com/dashboard/usage](https://cursor.com/dashboard/usage) directly. If Cursor re-exposes local token data in a future version, the `cursor` source will be re-enabled without dashboard schema changes.

## Deploying your own instance

The public deployment at [open.silver](https://open.silver) is a reference implementation only — it is intentionally unconfigured and will display a setup-required screen.

### 1. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsilver-dev-org%2Fopen-silver)

Click the button above, or import `https://github.com/silver-dev-org/open-silver` manually from the Vercel dashboard.

### 2. Add a Vercel Blob store

In your Vercel project: **Storage → Create → Blob**. This automatically sets the `BLOB_READ_WRITE_TOKEN` environment variable. See [Vercel Blob docs](https://vercel.com/docs/storage/vercel-blob) for details.

### 3. Set environment variables

In **Settings → Environment Variables**, add:

| Variable | Description |
|---|---|
| `DASHBOARD_PASSWORD` | Password to unlock the `/token-tracker/dashboard` page |
| `SUBMIT_TOKEN` | Shared secret that team members use to authenticate report submissions |
| `BLOB_READ_WRITE_TOKEN` | Set automatically by Vercel when you add a Blob store |

Redeploy after setting all variables. If any required variable is missing, Token Tracker pages will display a setup-required screen and API routes will return `503`.

### 4. Share the submit token with your team

`SUBMIT_TOKEN` is a shared secret — it authorizes anyone who has it to submit usage. The recommended way to distribute it is as a URL parameter on the landing page:

```
https://yourapp.vercel.app/token-tracker?token=YOUR_SUBMIT_TOKEN
```

The install flow pre-fills the token field from the URL, so team members only need to paste their email and confirm.

## Installing for team members

Each developer installs the collector once. The MCP path is preferred because their AI agent can trigger a sync automatically; the CLI fallback works in any environment.

**Claude Code**
```sh
claude mcp add silver-tracker -- npx -y @ftaboadac/silver-tracker-mcp
```

**Codex CLI**
```sh
codex mcp add silver-tracker -- npx -y @ftaboadac/silver-tracker-mcp
```

**Cursor** — edit `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "silver-tracker": {
      "command": "npx",
      "args": ["-y", "@ftaboadac/silver-tracker-mcp"]
    }
  }
}
```

**Gemini CLI** — edit `~/.gemini/settings.json`:
```json
{
  "mcpServers": {
    "silver-tracker": {
      "command": "npx",
      "args": ["-y", "@ftaboadac/silver-tracker-mcp"]
    }
  }
}
```

**CLI fallback** (any environment without MCP support):
```sh
npx -y @ftaboadac/silver-tracker
```

### First-run setup

On first invocation, the CLI or MCP server will prompt for three values and save them to `~/.silver-tracker/config.json`:

- **Email** — the developer's work email (used as a unique identifier on the dashboard)
- **Backend URL** — your Vercel deployment URL, e.g. `https://yourapp.vercel.app`
- **Submit token** — the `SUBMIT_TOKEN` from your deployment

Subsequent runs use the saved config without prompting.

## Usage

### Via MCP

Tell your AI agent:

> Report my token usage

The MCP server will collect local usage data and submit it to the configured backend.

### Via CLI

```sh
# Collect and submit usage
silver-tracker

# or explicitly
silver-tracker sync

# Preview what would be submitted without sending
silver-tracker sync --dry-run
```

`--dry-run` prints the collected report as JSON to stdout and exits without making a network request. Useful for verifying what data will be sent before your first real submission.

## Local development

### Backend

```sh
# Set up a local blob store (skips Vercel Blob entirely)
export TOKEN_TRACKER_LOCAL_BLOB_DIR=/tmp/silver-tracker-blobs

bun dev
```

`TOKEN_TRACKER_LOCAL_BLOB_DIR` redirects all blob reads and writes to the local filesystem at the given path. This eliminates the need for a Vercel Blob token during development — set it alongside `DASHBOARD_PASSWORD` and you have a fully functional local backend.

### CLI / MCP against a local backend

Set the backend URL to your local server during first-run setup, or edit `~/.silver-tracker/config.json` directly:

```json
{
  "email": "you@example.com",
  "backendUrl": "http://localhost:3000",
  "submitToken": "any-local-value"
}
```

Then run `silver-tracker sync --dry-run` to verify collection without hitting the network, or drop `--dry-run` to test a full round-trip.

## Privacy and security

- **No provider API keys.** The collector reads local log files only — it never calls Anthropic, OpenAI, or Google APIs.
- **Data isolation.** Each organization's data lives in their own Vercel Blob store. There is no shared backend.
- **Authorized writes only.** The `/token-tracker/api/report` endpoint requires `Authorization: Bearer SUBMIT_TOKEN`. Without it, submissions are rejected with `401`.
- **Protected dashboard.** The dashboard requires `DASHBOARD_PASSWORD`. The session cookie is `httpOnly`, `sameSite: strict`, and `secure` in production. Password comparisons use `crypto.timingSafeEqual` to prevent timing attacks.
- **Local-only collection.** Collectors only read files that the developer's AI tools have already written to their own machine. Nothing is installed that intercepts or proxies tool traffic.

## Limitations and known issues

**Cursor 3.1+** — covered in [Supported sources](#supported-sources) above.

**Pricing data is hardcoded.** Cost estimates are calculated from a static table in [`cli/src/pricing.ts`](../../../cli/src/pricing.ts). If a provider changes their pricing or releases a new model that isn't in the table, cost figures will be wrong. Update the `MODEL_PRICES` object in that file when prices change. Unknown models fall back to a Sonnet-equivalent estimate.

**Token counts require local logs.** If a developer clears their tool's local history, or uses a tool on a machine other than the one running the collector, those sessions won't appear in their report.
