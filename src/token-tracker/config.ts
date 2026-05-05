const REQUIRED_VARS = [
  "SUBMIT_TOKEN",
  "DASHBOARD_PASSWORD",
  "ENCRYPTION_KEY",
  "BLOB_READ_WRITE_TOKEN",
] as const;

export type RequiredVar = (typeof REQUIRED_VARS)[number];

export function getTokenTrackerConfig(): {
  isConfigured: boolean;
  missingVars: RequiredVar[];
} {
  const missingVars = REQUIRED_VARS.filter(
    (key) => !process.env[key],
  ) as RequiredVar[];

  return {
    isConfigured: missingVars.length === 0,
    missingVars,
  };
}
