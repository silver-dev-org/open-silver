import type { Config } from "./config.js";
import type { UserReport } from "./types.js";

export async function postReport(config: Config, report: UserReport): Promise<void> {
  const url = `${config.backendUrl}/token-tracker/api/report`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.submitToken}`,
      },
      body: JSON.stringify(report),
    });
  } catch (err) {
    const cause =
      err instanceof Error && err.cause instanceof Error
        ? ((err.cause as { code?: string }).code ?? err.cause.message) || err.message
        : err instanceof Error
        ? err.message
        : String(err);
    throw new Error(`Failed to POST to ${url}: ${cause}`);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`POST ${url} → ${response.status}: ${body}`);
  }
}
