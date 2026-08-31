# silver-token-tracker

Reads local logs from Claude Code, Codex CLI, and Gemini CLI and prints a terminal table showing token usage and estimated cost per model.

No account, no server, no network calls — everything runs locally.

## Install

This package will be published to npm by the silver-dev-org maintainers. Install instructions will be added once the official package is live.

For now, you can run the CLI directly from this repo:

```sh
git clone https://github.com/silver-dev-org/open-silver.git
cd open-silver/cli
bun install && bun run build
node dist/index.js run
```

## Usage

```sh
silver-token-tracker run          # show the visual table (default when run with no args)
silver-token-tracker run --json   # output raw JSON (useful for piping into other tools)
silver-token-tracker --help       # show help and supported sources
```

## What it looks like

```
  Claude Code
  ────────────────────────────────────────────────────────────────────────
  ┌───────────────────────────┬───────┬────────┬────────────┬─────────────┬────────────┐
  │ Model                     │ Input │ Output │ Cache Read │ Cache Write │ Cost (USD) │
  ├───────────────────────────┼───────┼────────┼────────────┼─────────────┼────────────┤
  │ claude-sonnet-4-6         │  8.7K │   1.0M │      52.2M │        3.5M │     $44.57 │
  │ claude-haiku-4-5-20251001 │  4.4K │  67.6K │       5.2M │      571.3K │      $1.26 │
  └───────────────────────────┴───────┴────────┴────────────┴─────────────┴────────────┘

  ────────────────────────────────────────────────────────────────────────
  TOTAL   1 source · 62.6M tokens · $45.83
  ────────────────────────────────────────────────────────────────────────
```

Source headers and the cost column are color-highlighted in the terminal.

## Supported sources

| Source | Log location |
|--------|-------------|
| Claude Code | `~/.claude/projects/**/*.jsonl` |
| Codex CLI | `~/.codex/history/*.json` |
| Gemini CLI | `~/.gemini/logs/*.json` |

**Cursor is not supported.** The usage schema changed in Cursor v3.1+ and the new format does not expose per-model token counts in a stable way.

## Notes

- Token counts are aggregated across all sessions found on disk (all-time, not filtered by date).
- Costs are estimated using public API pricing — they may differ from what you are actually billed if you are on a subscription plan.

---

**Reference implementation:** A working build is published on npm under `@ftaboadac/silver-token-tracker` for early testing purposes. This is not the canonical install path — the official package will be published by the silver-dev-org maintainers once the repo is transferred.
