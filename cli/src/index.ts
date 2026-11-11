#!/usr/bin/env node
import pc from "picocolors";
import Table from "cli-table3";
import { collectUsage } from "./collector.js";
import type { SourceReport } from "./types.js";

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const helpMode = args.includes("--help") || args.includes("-h");
const command = args.find((a) => !a.startsWith("-")) ?? "run";

const SOURCE_LABELS: Record<string, string> = {
  "claude-code": "Claude Code",
  codex: "Codex CLI",
  "gemini-cli": "Gemini CLI",
};

const HELP = `
${pc.bold("silver-token-tracker")} — local AI token usage reporter

${pc.bold("Usage:")}
  silver-token-tracker [run] [--json] [--help]

${pc.bold("Commands:")}
  run           Read local logs and display token usage (default)

${pc.bold("Flags:")}
  --json        Output raw JSON instead of the visual table
  --help, -h    Show this help message

${pc.bold("Supported sources:")}
  • Claude Code   (~/.claude/projects/**/*.jsonl)
  • Codex CLI     (~/.codex/history/*.json)
  • Gemini CLI    (~/.gemini/logs/*.json)

  Cursor is not supported (usage schema changed in v3.1+).
`.trimStart();

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtCost(n: number): string {
  if (n >= 0.01) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function renderVisual(sources: SourceReport[]): void {
  const rule = pc.dim("─".repeat(72));

  let totalTokens = 0;
  let totalCost = 0;

  for (const { source, models } of sources) {
    const label = SOURCE_LABELS[source] ?? source;
    console.log();
    console.log(pc.cyan(pc.bold(`  ${label}`)));
    console.log(rule);

    const table = new Table({
      head: [
        pc.bold("Model"),
        pc.bold("Input"),
        pc.bold("Output"),
        pc.bold("Cache Read"),
        pc.bold("Cache Write"),
        pc.bold("Cost (USD)"),
      ],
      colAligns: ["left", "right", "right", "right", "right", "right"],
      style: { head: [], border: [], compact: true },
    });

    for (const m of models) {
      totalTokens += m.inputTokens + m.outputTokens + m.cacheReadTokens + m.cacheWriteTokens;
      totalCost += m.costUsd;
      table.push([
        m.model,
        fmtTokens(m.inputTokens),
        fmtTokens(m.outputTokens),
        fmtTokens(m.cacheReadTokens),
        fmtTokens(m.cacheWriteTokens),
        pc.yellow(fmtCost(m.costUsd)),
      ]);
    }

    console.log(table.toString());
  }

  console.log();
  console.log(rule);
  const sourcePart = `${sources.length} source${sources.length !== 1 ? "s" : ""}`;
  console.log(
    `  ${pc.bold("TOTAL")}   ${sourcePart} · ${pc.bold(fmtTokens(totalTokens) + " tokens")} · ${pc.yellow(pc.bold(fmtCost(totalCost)))}`,
  );
  console.log(rule);
  console.log();
}

async function main() {
  if (helpMode) {
    process.stdout.write(HELP + "\n");
    return;
  }

  if (command !== "run") {
    console.error(`Unknown command: ${command}`);
    console.error("Run silver-token-tracker --help for usage.");
    process.exit(1);
  }

  const sources = await collectUsage();

  if (sources.length === 0) {
    console.log(
      "No usage data found. Make sure you have used Claude Code, Codex CLI, or Gemini CLI on this machine.",
    );
    return;
  }

  if (jsonMode) {
    console.log(JSON.stringify(sources, null, 2));
    return;
  }

  renderVisual(sources);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
