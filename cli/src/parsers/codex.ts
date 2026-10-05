import fs from "fs/promises";
import os from "os";
import path from "path";
import { aggregateToModelUsage } from "../pricing.js";
import type { ModelUsage } from "../types.js";

type CodexTokenUsage = {
  input_tokens?: number;
  cached_input_tokens?: number;
  output_tokens?: number;
  reasoning_output_tokens?: number;
  total_tokens?: number;
};

type CodexEntry = {
  type: string;
  timestamp?: string;
  payload?: {
    type?: string;
    model?: string;
    session_id?: string;
    originator?: string;
    info?: {
      model?: string;
      model_name?: string;
      last_token_usage?: CodexTokenUsage;
      total_token_usage?: CodexTokenUsage;
    };
  };
};

function getCodexSessionsDir(): string {
  const codexHome =
    process.env["CODEX_HOME"] ?? path.join(os.homedir(), ".codex");
  return path.join(codexHome, "sessions");
}

async function findRollupFiles(sessionsDir: string): Promise<string[]> {
  const files: string[] = [];
  let years: string[];
  try {
    years = await fs.readdir(sessionsDir);
  } catch {
    return files;
  }
  for (const year of years) {
    if (!/^\d{4}$/.test(year)) continue;
    const yearDir = path.join(sessionsDir, year);
    let months: string[];
    try {
      months = await fs.readdir(yearDir);
    } catch {
      continue;
    }
    for (const month of months) {
      if (!/^\d{2}$/.test(month)) continue;
      const monthDir = path.join(yearDir, month);
      let days: string[];
      try {
        days = await fs.readdir(monthDir);
      } catch {
        continue;
      }
      for (const day of days) {
        if (!/^\d{2}$/.test(day)) continue;
        const dayDir = path.join(monthDir, day);
        let dayFiles: string[];
        try {
          dayFiles = await fs.readdir(dayDir);
        } catch {
          continue;
        }
        for (const file of dayFiles) {
          if (file.startsWith("rollup-") && file.endsWith(".jsonl")) {
            files.push(path.join(dayDir, file));
          }
        }
      }
    }
  }
  return files;
}

type RawUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
};

async function parseFile(filePath: string): Promise<RawUsage[]> {
  let text: string;
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch {
    return [];
  }

  const entries: CodexEntry[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      entries.push(JSON.parse(trimmed) as CodexEntry);
    } catch {
      continue;
    }
  }

  // Pass 1: track the active model at each entry index.
  // Model info flows from session_meta and turn_context entries
  // (turn_context carries model at payload.model or payload.info.model).
  let currentModel: string | undefined;
  const modelAtIndex: (string | undefined)[] = new Array(entries.length);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.type === "session_meta" && e.payload?.model) {
      currentModel = e.payload.model;
    } else if (e.type === "turn_context") {
      const m =
        e.payload?.model ??
        e.payload?.info?.model ??
        e.payload?.info?.model_name;
      if (m) currentModel = m;
    }
    modelAtIndex[i] = currentModel;
  }

  // Pass 2: extract token counts from event_msg/token_count entries and
  // correlate them with the model context captured in pass 1.
  const usages: RawUsage[] = [];
  let prevCumulativeTotal = 0;
  let prevInput = 0;
  let prevCached = 0;
  let prevOutput = 0;
  let prevReasoning = 0;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.type !== "event_msg" || e.payload?.type !== "token_count") continue;

    const info = e.payload.info;
    if (!info) continue;

    // Skip intermediate duplicates — same cumulative total means no new tokens
    const cumulativeTotal = info.total_token_usage?.total_tokens ?? 0;
    if (cumulativeTotal > 0 && cumulativeTotal === prevCumulativeTotal) continue;
    prevCumulativeTotal = cumulativeTotal;

    const last = info.last_token_usage;
    let inputTokens = 0;
    let cachedInputTokens = 0;
    let outputTokens = 0;
    let reasoningTokens = 0;

    if (last) {
      // Per-turn delta is directly available
      inputTokens = last.input_tokens ?? 0;
      cachedInputTokens = last.cached_input_tokens ?? 0;
      outputTokens = last.output_tokens ?? 0;
      reasoningTokens = last.reasoning_output_tokens ?? 0;
    } else if (cumulativeTotal > 0) {
      // Derive delta from cumulative totals
      const total = info.total_token_usage;
      if (!total) continue;
      inputTokens = (total.input_tokens ?? 0) - prevInput;
      cachedInputTokens = (total.cached_input_tokens ?? 0) - prevCached;
      outputTokens = (total.output_tokens ?? 0) - prevOutput;
      reasoningTokens = (total.reasoning_output_tokens ?? 0) - prevReasoning;
    }

    // Advance cumulative baselines only when using the total_token_usage path
    if (!last) {
      const total = info.total_token_usage;
      if (total) {
        prevInput = total.input_tokens ?? 0;
        prevCached = total.cached_input_tokens ?? 0;
        prevOutput = total.output_tokens ?? 0;
        prevReasoning = total.reasoning_output_tokens ?? 0;
      }
    }

    if (inputTokens + cachedInputTokens + outputTokens + reasoningTokens === 0)
      continue;

    // Resolve model: try the token_count entry's own payload fields first,
    // then fall back to the context captured in pass 1
    const model =
      e.payload.model ??
      info.model ??
      info.model_name ??
      modelAtIndex[i] ??
      "gpt-5";

    // cached_input_tokens is a subset of input_tokens (same as Gemini)
    const freshInput = Math.max(0, inputTokens - cachedInputTokens);

    usages.push({
      model,
      inputTokens: freshInput,
      // reasoning tokens are billed at the output rate
      outputTokens: outputTokens + reasoningTokens,
      cacheWriteTokens: 0,
      cacheReadTokens: cachedInputTokens,
    });
  }

  return usages;
}

export async function parseCodexUsage(): Promise<ModelUsage[]> {
  const sessionsDir = getCodexSessionsDir();
  const files = await findRollupFiles(sessionsDir);
  if (files.length === 0) return [];

  const allResults = await Promise.all(files.map(parseFile));
  return aggregateToModelUsage(allResults.flat());
}
