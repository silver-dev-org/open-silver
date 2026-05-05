const REQUIRED_VARS = ["DASHBOARD_PASSWORD"] as const;

export type RequiredVar =
  | (typeof REQUIRED_VARS)[number]
  | "BLOB_READ_WRITE_TOKEN";

export function getTokenTrackerConfig(): {
  isConfigured: boolean;
  missingVars: RequiredVar[];
} {
  const missingVars: RequiredVar[] = REQUIRED_VARS.filter(
    (key) => !process.env[key],
  );

  const hasStorage =
    !!process.env.BLOB_READ_WRITE_TOKEN ||
    !!process.env.TOKEN_TRACKER_LOCAL_BLOB_DIR;

  if (!hasStorage) {
    missingVars.push("BLOB_READ_WRITE_TOKEN");
  }

  return {
    isConfigured: missingVars.length === 0,
    missingVars,
  };
}
