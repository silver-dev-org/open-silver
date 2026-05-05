#!/usr/bin/env node
import { loadOrInitConfig } from "./config.js";
import { collectUsage } from "./collector.js";
import { postReport } from "./reporter.js";
import type { UserReport } from "./types.js";

const args = process.argv.slice(2);
const command = args.find((a) => !a.startsWith("-")) ?? "sync";
const dryRun = args.includes("--dry-run");

if (command !== "sync") {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: silver-tracker [sync] [--dry-run]");
  process.exit(1);
}

async function main() {
  const config = await loadOrInitConfig();
  const sources = await collectUsage();

  if (sources.length === 0) {
    console.log("No usage data found. Make sure you've used Claude Code, Cursor, Codex CLI, or Gemini CLI on this machine.");
    process.exit(1);
  }

  const report: UserReport = {
    email: config.email,
    sources,
    updatedAt: new Date().toISOString(),
  };

  if (dryRun) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  await postReport(config, report);
  const sourceNames = sources.map((s) => s.source).join(", ");
  console.log(`Reported usage from ${sources.length} source(s): ${sourceNames}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
