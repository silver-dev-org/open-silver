import { readReport, writeReport } from "@/token-tracker/storage";
import { hashEmail, normalizeEmail } from "@/token-tracker/utils";
import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SourceReportSchema = z.object({
  source: z.enum(["claude-code", "cursor", "codex", "gemini-cli", "aider"]),
  models: z.array(
    z.object({
      model: z.string(),
      inputTokens: z.number(),
      outputTokens: z.number(),
      cacheReadTokens: z.number(),
      cacheWriteTokens: z.number(),
      costUsd: z.number(),
    }),
  ),
  lastSyncedAt: z.string().datetime(),
});

const UserReportSchema = z.object({
  email: z.string().email(),
  sources: z.array(SourceReportSchema),
  updatedAt: z.string().datetime(),
});

function checkAuth(request: NextRequest): boolean {
  const submitToken = process.env.SUBMIT_TOKEN;
  if (!submitToken) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(submitToken);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UserReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const incoming = parsed.data;
  const email = normalizeEmail(incoming.email);
  const hashedEmail = hashEmail(email);
  const pathname = `token-tracker/${hashedEmail}.json`;

  const existing = await readReport(hashedEmail);

  const mergedSourcesMap = new Map(
    (existing?.sources ?? []).map((s) => [s.source, s]),
  );
  const sourcesUpdated: string[] = [];

  for (const source of incoming.sources) {
    mergedSourcesMap.set(source.source, source);
    sourcesUpdated.push(source.source);
  }

  const updatedReport = {
    email,
    sources: Array.from(mergedSourcesMap.values()),
    updatedAt: new Date().toISOString(),
  };

  await writeReport(pathname, updatedReport);

  return NextResponse.json({ ok: true, email, sourcesUpdated });
}
