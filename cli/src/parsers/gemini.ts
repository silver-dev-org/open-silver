import fs from "fs/promises";
import os from "os";
import path from "path";
import { aggregateToModelUsage } from "../pricing.js";
import type { ModelUsage } from "../types.js";

const GEMINI_TMP_DIR = path.join(os.homedir(), ".gemini", "tmp");

type GeminiTokens = {
  input?: number;
  output?: number;
  cached?: number;
  thoughts?: number;
};

type GeminiMessage = {
  type: string;
  tokens?: GeminiTokens;
  model?: string;
};

type GeminiSession = {
  sessionId: string;
  messages: GeminiMessage[];
};

type SessionResult = {
  sessionId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
};

function extractSessionUsage(session: GeminiSession): SessionResult | null {
  const geminiMsgs = session.messages.filter(
    (m) => m.type === "gemini" && m.tokens != null && m.model,
  );
  if (geminiMsgs.length === 0) return null;

  let model = "";
  let totalInput = 0;
  let totalOutput = 0;
  let totalCached = 0;

  for (const msg of geminiMsgs) {
    const t = msg.tokens!;
    if (!model && msg.model) model = msg.model;
    totalInput += t.input ?? 0;
    // thoughts tokens are billed as output
    totalOutput += (t.output ?? 0) + (t.thoughts ?? 0);
    totalCached += t.cached ?? 0;
  }

  if (totalInput === 0 && totalOutput === 0) return null;

  // tokens.input includes cached tokens as a subset — subtract to avoid double-charging
  const freshInput = Math.max(0, totalInput - totalCached);

  return {
    sessionId: session.sessionId,
    model,
    inputTokens: freshInput,
    outputTokens: totalOutput,
    cacheWriteTokens: 0,
    cacheReadTokens: totalCached,
  };
}

function tryParseAsJson(raw: string): GeminiSession | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed["sessionId"] === "string" &&
      Array.isArray(parsed["messages"])
    ) {
      return parsed as unknown as GeminiSession;
    }
  } catch {
    // not valid JSON or wrong shape
  }
  return null;
}

function tryParseAsJsonl(raw: string): GeminiSession | null {
  const lines = raw.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return null;

  let sessionId = "";
  const messages: GeminiMessage[] = [];

  for (const line of lines) {
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }
    // skip MongoDB-style update operations that Gemini CLI may write
    if (obj["$set"] !== undefined) continue;
    if (typeof obj["sessionId"] === "string" && !sessionId) {
      sessionId = obj["sessionId"] as string;
    } else if (typeof obj["type"] === "string") {
      messages.push(obj as unknown as GeminiMessage);
    }
  }

  if (!sessionId) return null;
  return { sessionId, messages };
}

async function parseFile(filePath: string): Promise<SessionResult | null> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }

  // Try single JSON first (Gemini CLI <= 0.38), then JSONL (>= 0.39)
  const session = tryParseAsJson(raw) ?? tryParseAsJsonl(raw);
  if (!session) return null;

  return extractSessionUsage(session);
}

async function findSessionFiles(): Promise<string[]> {
  const files: string[] = [];
  let projectDirs: string[];
  try {
    const entries = await fs.readdir(GEMINI_TMP_DIR, { withFileTypes: true });
    projectDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return files;
  }

  for (const project of projectDirs) {
    const chatsDir = path.join(GEMINI_TMP_DIR, project, "chats");
    let chatFiles: string[];
    try {
      const entries = await fs.readdir(chatsDir);
      chatFiles = entries.filter(
        (f) =>
          f.startsWith("session-") &&
          (f.endsWith(".json") || f.endsWith(".jsonl")),
      );
    } catch {
      continue;
    }
    for (const file of chatFiles) {
      files.push(path.join(chatsDir, file));
    }
  }
  return files;
}

export async function parseGeminiUsage(): Promise<ModelUsage[]> {
  const files = await findSessionFiles();
  if (files.length === 0) return [];

  const allResults = await Promise.all(files.map(parseFile));

  // Deduplicate by sessionId in case both .json and .jsonl exist for the same session
  const seen = new Set<string>();
  const rawUsages: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheWriteTokens: number;
    cacheReadTokens: number;
  }[] = [];

  for (const result of allResults) {
    if (!result || seen.has(result.sessionId)) continue;
    seen.add(result.sessionId);
    rawUsages.push({
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cacheWriteTokens: result.cacheWriteTokens,
      cacheReadTokens: result.cacheReadTokens,
    });
  }

  return aggregateToModelUsage(rawUsages);
}
