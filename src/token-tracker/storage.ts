import { BLOB_PREFIX } from "@/token-tracker/constants";
import type { UserReport } from "@/token-tracker/types";
import { get, list, put } from "@vercel/blob";

function isValidUserReport(value: unknown): value is UserReport {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as UserReport).email === "string" &&
    (value as UserReport).email.includes("@") &&
    typeof (value as UserReport).providers === "object" &&
    typeof (value as UserReport).updatedAt === "string"
  );
}

async function getReportByPathname(pathname: string): Promise<UserReport | null> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  const data: unknown = JSON.parse(text);
  return isValidUserReport(data) ? data : null;
}

export async function readReport(hashedId: string): Promise<UserReport | null> {
  const pathname = `${BLOB_PREFIX}/${hashedId}.json`;
  return getReportByPathname(pathname);
}

export async function writeReport(
  pathname: string,
  report: UserReport,
): Promise<void> {
  await put(pathname, JSON.stringify(report), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function listAllReports(): Promise<
  { report: UserReport; pathname: string }[]
> {
  const { blobs } = await list({ prefix: `${BLOB_PREFIX}/` });

  const results = await Promise.allSettled(
    blobs.map(async (blob) => {
      const data = await getReportByPathname(blob.pathname);
      if (!data) {
        console.warn(`[token-tracker] Skipping invalid blob: ${blob.pathname}`);
        return null;
      }
      return { report: data, pathname: blob.pathname };
    }),
  );

  return results
    .filter(
      (
        r,
      ): r is PromiseFulfilledResult<{
        report: UserReport;
        pathname: string;
      } | null> => r.status === "fulfilled",
    )
    .map((r) => r.value)
    .filter((r): r is { report: UserReport; pathname: string } => r !== null);
}
