import fs from "fs/promises";
import os from "os";
import path from "path";
import { aggregateToModelUsage } from "../pricing.js";
import type { ModelUsage } from "../types.js";

// Cursor 3.1+ schema change — why this parser returns no data for modern installs:
//
// In Cursor ≤2.x, each assistant turn wrote real token counts to cursorDiskKV:
//   bubbleId:<conversationId>:<bubbleId> → { tokenCount: { inputTokens, outputTokens },
//                                            modelInfo: { modelName }, ... }
// The BUBBLE_QUERY below reads exactly those fields and still works for ≤2.x users.
//
// Starting in Cursor 3.1, conversation data was moved to per-composer AES-256-GCM
// encrypted blobs stored as agentKv:blob:<sha256> entries in the same table. The
// bubbleId rows are still written but tokenCount is always {inputTokens:0, outputTokens:0}
// and modelInfo is null. The plain-JSON agentKv entries (role/content pairs) only carry a
// requestId in providerOptions — no model name, no token counts. The encryption key lives
// in composerData.blobEncryptionKey but the key→blob mapping is not documented.
//
// Content-length estimation (~4 chars/token) was evaluated and rejected: ±30–50% error,
// no model attribution, and no cache read/write data would produce misleading figures when
// displayed alongside precise Claude Code numbers on the dashboard.
//
// When the DB is found but returns zero token rows (the 3.1+ case), this function throws
// so the CLI can emit a clear diagnostic rather than silently omitting Cursor from the report.
// The source remains in the UsageSource enum so support can be re-enabled if Cursor exposes
// local token data again.

function getDbPath(): string {
  const home = os.homedir();
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support", "Cursor", "User", "globalStorage", "state.vscdb");
  }
  if (process.platform === "win32") {
    return path.join(home, "AppData", "Roaming", "Cursor", "User", "globalStorage", "state.vscdb");
  }
  return path.join(home, ".config", "Cursor", "User", "globalStorage", "state.vscdb");
}

interface SqliteStatement {
  all(...params: (string | number | null)[]): Record<string, unknown>[];
}

interface SqliteDb {
  prepare(sql: string): SqliteStatement;
  close(): void;
}

async function openDb(dbPath: string): Promise<SqliteDb> {
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(dbPath, { readOnly: true });
    return {
      prepare(sql: string): SqliteStatement {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stmt = db.prepare(sql) as any;
        return {
          all(...params) {
            return stmt.all(...params) as Record<string, unknown>[];
          },
        };
      },
      close() {
        db.close();
      },
    };
  } catch {}

  const mod = await import("better-sqlite3");
  const BetterSqlite3 = mod.default;
  const db = new BetterSqlite3(dbPath, { readonly: true, fileMustExist: true });
  return {
    prepare(sql: string): SqliteStatement {
      const stmt = db.prepare(sql);
      return {
        all(...params) {
          return stmt.all(...params) as Record<string, unknown>[];
        },
      };
    },
    close() {
      db.close();
    },
  };
}

type KvRow = {
  input_tokens: number | null;
  output_tokens: number | null;
  model: string | null;
  created_at: string | null;
  conversation_id: string | null;
};

const BUBBLE_QUERY = `
  SELECT
    json_extract(value, '$.tokenCount.inputTokens')  AS input_tokens,
    json_extract(value, '$.tokenCount.outputTokens') AS output_tokens,
    json_extract(value, '$.modelInfo.modelName')     AS model,
    json_extract(value, '$.createdAt')               AS created_at,
    json_extract(value, '$.conversationId')          AS conversation_id
  FROM cursorDiskKV
  WHERE key LIKE 'bubbleId:%'
    AND json_valid(value)
`;

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  return 0;
}

function processRows(rows: Record<string, unknown>[], seen: Set<string>): {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
}[] {
  const usages = [];
  for (const row of rows) {
    const r = row as unknown as KvRow;
    const inputTokens = toNumber(r.input_tokens);
    const outputTokens = toNumber(r.output_tokens);

    if (inputTokens === 0 && outputTokens === 0) continue;

    const conversationId = r.conversation_id ?? "unknown";
    const createdAt = r.created_at ?? "";
    const dedupKey = `${conversationId}:${createdAt}:${inputTokens}:${outputTokens}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    const model = r.model ?? "cursor-auto";
    usages.push({ model, inputTokens, outputTokens, cacheWriteTokens: 0, cacheReadTokens: 0 });
  }
  return usages;
}

export async function parseCursorUsage(): Promise<ModelUsage[]> {
  const dbPath = getDbPath();

  try {
    await fs.access(dbPath);
  } catch {
    return [];
  }

  let db: SqliteDb;
  try {
    db = await openDb(dbPath);
  } catch {
    return [];
  }

  try {
    const seen = new Set<string>();
    const bubbleRows = db.prepare(BUBBLE_QUERY).all();
    const result = aggregateToModelUsage(processRows(bubbleRows, seen));

    if (result.length === 0) {
      throw new Error(
        "Cursor 3.1+ no longer exposes accurate token data locally — skipping. " +
        "Token counts in state.vscdb are zeroed out in this version; " +
        "usage lives server-side only at cursor.com/dashboard/usage."
      );
    }

    return result;
  } finally {
    db.close();
  }
}
