import { parseClaudeCodeUsage } from "./parsers/claude-code.js";
import { parseCodexUsage } from "./parsers/codex.js";
import { parseGeminiUsage } from "./parsers/gemini.js";
import type { ModelUsage, SourceReport, UsageSource } from "./types.js";

const PARSERS: Array<{ source: UsageSource; parse: () => Promise<ModelUsage[]> }> = [
  { source: "claude-code", parse: parseClaudeCodeUsage },
  { source: "codex", parse: parseCodexUsage },
  { source: "gemini-cli", parse: parseGeminiUsage },
];

export async function collectUsage(): Promise<SourceReport[]> {
  const now = new Date().toISOString();
  const results = await Promise.allSettled(PARSERS.map(({ parse }) => parse()));
  const sources: SourceReport[] = [];

  for (let i = 0; i < PARSERS.length; i++) {
    const { source } = PARSERS[i];
    const result = results[i];

    if (result.status === "rejected") {
      const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`Warning (${source}): ${message}`);
      continue;
    }

    const models = result.value;
    if (models.length === 0) continue;

    sources.push({ source, models, lastSyncedAt: now });
  }

  return sources;
}
