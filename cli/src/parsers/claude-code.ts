import type { Dirent } from "fs";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { aggregateToModelUsage } from "../pricing.js";
import type { ModelUsage } from "../types.js";

const CLAUDE_PROJECTS_DIR = path.join(os.homedir(), ".claude", "projects");
const SKIP_IF_MODIFIED_WITHIN_MS = 30_000;

type MessageUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

type AssistantMessage = {
  id: string;
  model: string;
  usage: MessageUsage;
};

type AssistantEntry = {
  type: "assistant";
  message: AssistantMessage;
};

function isAssistantEntry(value: unknown): value is AssistantEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v["type"] !== "assistant") return false;
  const msg = v["message"];
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as Record<string, unknown>;
  if (typeof m["id"] !== "string" || typeof m["model"] !== "string") return false;
  const usage = m["usage"];
  return typeof usage === "object" && usage !== null;
}

async function findJsonlFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await findJsonlFiles(fullPath);
        files.push(...nested);
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        files.push(fullPath);
      }
    }),
  );
  return files;
}

async function parseFile(
  filePath: string,
  seen: Map<string, AssistantMessage>,
): Promise<void> {
  try {
    const stat = await fs.stat(filePath);
    if (Date.now() - stat.mtimeMs < SKIP_IF_MODIFIED_WITHIN_MS) return;
  } catch {
    return;
  }

  let text: string;
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch {
    return;
  }

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (!isAssistantEntry(parsed)) continue;
    // Overwrite on duplicate id — last occurrence has the most complete usage snapshot
    seen.set(parsed.message.id, parsed.message);
  }
}

export async function parseClaudeCodeUsage(): Promise<ModelUsage[]> {
  const files = await findJsonlFiles(CLAUDE_PROJECTS_DIR);
  const seen = new Map<string, AssistantMessage>();

  await Promise.all(files.map((f) => parseFile(f, seen)));

  const rawUsages = Array.from(seen.values()).map((msg) => ({
    model: msg.model,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    cacheWriteTokens: msg.usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: msg.usage.cache_read_input_tokens ?? 0,
  }));

  return aggregateToModelUsage(rawUsages);
}
