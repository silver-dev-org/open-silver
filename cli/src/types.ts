export type UsageSource =
  | "claude-code"
  | "cursor"
  | "codex"
  | "gemini-cli"
  | "aider";

export type ModelUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
};

export type SourceReport = {
  source: UsageSource;
  models: ModelUsage[];
  lastSyncedAt: string;
};

export type UserReport = {
  email: string;
  sources: SourceReport[];
  updatedAt: string;
};
