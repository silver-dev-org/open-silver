import { BLOB_PREFIX, PROVIDER_CONFIG } from "@/token-tracker/constants";
import { getTokenTrackerConfig } from "@/token-tracker/config";
import { fetchProviderUsage } from "@/token-tracker/fetchers";
import { readReport, writeReport } from "@/token-tracker/storage";
import type {
  ProviderData,
  SubmitRequest,
  SubmitResponse,
  UserReport,
} from "@/token-tracker/types";
import {
  hashEmail,
  normalizeEmail,
  validateEmail,
} from "@/token-tracker/utils";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const MAX_REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count += 1;
  return false;
}

function encryptKey(apiKey: string): string {
  const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export async function POST(req: NextRequest) {
  const { isConfigured } = getTokenTrackerConfig();
  if (!isConfigured) {
    return NextResponse.json(
      {
        error:
          "Token Tracker is not configured on this instance. Deploy your own instance to use this feature.",
      },
      { status: 503 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const { email, provider, apiKey, teamToken }: SubmitRequest = await req.json();

  if (!teamToken || teamToken !== process.env.SUBMIT_TOKEN) {
    return NextResponse.json(
      { error: "Invalid or missing team token." },
      { status: 401 },
    );
  }

  const normalizedEmail = normalizeEmail(email ?? "");
  if (!validateEmail(normalizedEmail)) {
    return NextResponse.json(
      { error: "A valid work email is required." },
      { status: 400 },
    );
  }

  if (!apiKey) {
    return NextResponse.json({ error: "apiKey is required." }, { status: 400 });
  }

  if (!provider || !(provider in PROVIDER_CONFIG)) {
    return NextResponse.json(
      { error: "Invalid or unsupported provider." },
      { status: 400 },
    );
  }

  const providerConfig = PROVIDER_CONFIG[provider];

  if (!providerConfig.hasUsageApi) {
    return NextResponse.json(
      {
        status: "not_supported",
        error:
          "noUsageApiMessage" in providerConfig
            ? providerConfig.noUsageApiMessage
            : "This provider does not support usage API.",
      },
      { status: 422 },
    );
  }

  try {
    const result = await fetchProviderUsage(provider, apiKey);
    const hashedId = hashEmail(normalizedEmail);

    const providerData: ProviderData = {
      encryptedKey: encryptKey(apiKey),
      models: result.models,
      fetchedAt: result.fetchedAt,
      lastSuccessfulFetchAt: result.fetchedAt,
    };

    const existing = await readReport(hashedId);

    const updatedReport: UserReport = {
      email: normalizedEmail,
      providers: {
        ...existing?.providers,
        [provider]: providerData,
      },
      updatedAt: new Date().toISOString(),
    };

    await writeReport(`${BLOB_PREFIX}/${hashedId}.json`, updatedReport);

    return NextResponse.json({
      email: normalizedEmail,
      result,
    } satisfies SubmitResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch usage data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
