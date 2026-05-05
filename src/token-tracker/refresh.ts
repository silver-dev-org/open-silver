import { getTokenTrackerConfig } from "@/token-tracker/config";
import { PROVIDER_CONFIG } from "@/token-tracker/constants";
import { fetchProviderUsage } from "@/token-tracker/fetchers";
import { listAllReports, writeReport } from "@/token-tracker/storage";
import type { Provider, ProviderData, UserReport } from "@/token-tracker/types";
import crypto from "crypto";

export type RefreshOutcome = {
  email: string;
  provider: Provider;
  status: "ok" | "error";
  error?: string;
};

function decryptKey(encryptedKey: string): string {
  const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
  const combined = Buffer.from(encryptedKey, "base64");
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const ciphertext = combined.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext, undefined, "utf8") + decipher.final("utf8");
}

async function refreshReport(
  report: UserReport,
  blobPathname: string,
): Promise<RefreshOutcome[]> {
  const outcomes: RefreshOutcome[] = [];
  const updatedProviders: UserReport["providers"] = { ...report.providers };

  await Promise.allSettled(
    (Object.entries(report.providers) as [Provider, ProviderData][]).map(
      async ([provider, data]) => {
        if (!PROVIDER_CONFIG[provider].hasUsageApi) return;

        try {
          const apiKey = decryptKey(data.encryptedKey);
          const result = await fetchProviderUsage(provider, apiKey);

          const { lastError: _cleared, ...rest } = data;
          updatedProviders[provider] = {
            ...rest,
            models: result.models,
            fetchedAt: result.fetchedAt,
            lastSuccessfulFetchAt: result.fetchedAt,
          };
          outcomes.push({ email: report.email, provider, status: "ok" });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          updatedProviders[provider] = { ...data, lastError: message };
          outcomes.push({
            email: report.email,
            provider,
            status: "error",
            error: message,
          });
        }
      },
    ),
  );

  const anySuccess = outcomes.some((o) => o.status === "ok");

  const updatedReport: UserReport = {
    ...report,
    providers: updatedProviders,
    updatedAt: anySuccess ? new Date().toISOString() : report.updatedAt,
  };

  await writeReport(blobPathname, updatedReport);

  return outcomes;
}

export async function runRefreshAll(): Promise<RefreshOutcome[]> {
  const { isConfigured } = getTokenTrackerConfig();
  if (!isConfigured) return [];

  const reportEntries = await listAllReports();

  const results = await Promise.allSettled(
    reportEntries.map(({ report, pathname }) =>
      refreshReport(report, pathname),
    ),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<RefreshOutcome[]> =>
        r.status === "fulfilled",
    )
    .flatMap((r) => r.value);
}
