import { BLOB_PREFIX } from "@/token-tracker/constants";
import type { UserReport } from "@/token-tracker/types";
import { get, list, put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

const localDir = process.env.TOKEN_TRACKER_LOCAL_BLOB_DIR;

function isValidUserReport(value: unknown): value is UserReport {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as UserReport).email === "string" &&
    (value as UserReport).email.includes("@") &&
    Array.isArray((value as UserReport).sources) &&
    typeof (value as UserReport).updatedAt === "string"
  );
}

async function readBlobText(pathname: string): Promise<string | null> {
  if (localDir) {
    try {
      return await fs.readFile(path.join(localDir, pathname), "utf8");
    } catch {
      return null;
    }
  }
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200) return null;
  return new Response(result.stream).text();
}

async function writeBlobText(pathname: string, body: string): Promise<void> {
  if (localDir) {
    const filePath = path.join(localDir, pathname);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body, "utf8");
    return;
  }
  await put(pathname, body, {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

async function listBlobPathnames(prefix: string): Promise<string[]> {
  if (localDir) {
    const dir = path.join(localDir, prefix);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile())
        .map((e) => path.posix.join(prefix.replace(/\/$/, ""), e.name));
    } catch {
      return [];
    }
  }
  const { blobs } = await list({ prefix });
  return blobs.map((b) => b.pathname);
}

async function getReportByPathname(
  pathname: string,
): Promise<UserReport | null> {
  const text = await readBlobText(pathname);
  if (!text) return null;
  const data: unknown = JSON.parse(text);
  return isValidUserReport(data) ? data : null;
}

export async function readReport(hashedId: string): Promise<UserReport | null> {
  return getReportByPathname(`${BLOB_PREFIX}/${hashedId}.json`);
}

export async function writeReport(
  pathname: string,
  report: UserReport,
): Promise<void> {
  await writeBlobText(pathname, JSON.stringify(report));
}

export async function listAllReports(): Promise<
  { report: UserReport; pathname: string }[]
> {
  const pathnames = await listBlobPathnames(`${BLOB_PREFIX}/`);

  const results = await Promise.allSettled(
    pathnames.map(async (pathname) => {
      const data = await getReportByPathname(pathname);
      if (!data) {
        console.warn(`[token-tracker] Skipping invalid blob: ${pathname}`);
        return null;
      }
      return { report: data, pathname };
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
