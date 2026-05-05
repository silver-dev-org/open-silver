# silver-token-tracker

Reads local logs from Claude Code, Codex CLI, and Gemini CLI and prints a terminal table showing token usage and estimated cost per model.

No account, no server, no network calls — everything runs locally.

## Install

```sh
npm install -g @ftaboadac/silver-token-tracker
```

Or run without installing:

```sh
npx -y @ftaboadac/silver-token-tracker run
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
  ┌────────────────────────────┬──────────┬──────────┬────────────┬─────────────┬────────────┐
  │ Model                      │    Input │   Output │ Cache Read │ Cache Write │ Cost (USD) │
  ├────────────────────────────┼──────────┼──────────┼────────────┼─────────────┼────────────┤
  │ claude-sonnet-4-6          │  124.5K  │   18.2K  │    890.1K  │      45.3K  │      $1.26 │
  │ claude-opus-4              │   12.1K  │    2.3K  │      5.0K  │       1.1K  │      $0.89 │
  └────────────────────────────┴──────────┴──────────┴────────────┴─────────────┴────────────┘

  Codex CLI
  ────────────────────────────────────────────────────────────────────────
  ┌────────────────────────────┬──────────┬──────────┬────────────┬─────────────┬────────────┐
  │ Model                      │    Input │   Output │ Cache Read │ Cache Write │ Cost (USD) │
  ├────────────────────────────┼──────────┼──────────┼────────────┼─────────────┼────────────┤
  │ gpt-4.1                    │   45.2K  │    6.8K  │        0   │           0 │      $0.15 │
  └────────────────────────────┴──────────┴──────────┴────────────┴─────────────┴────────────┘

  ────────────────────────────────────────────────────────────────────────
  TOTAL   2 sources · 1.1M tokens · $2.30
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
- This package is a reference implementation published under the author's personal scope (`@ftaboadac`). The maintainers of [silver-dev-org](https://github.com/silver-dev-org) will publish the official version under their repo with attribution. When that happens, this package will be deprecated in favor of the official one.
