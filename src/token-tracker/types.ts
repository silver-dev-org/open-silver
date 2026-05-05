export type Provider = "anthropic" | "openai" | "gemini" | "grok";

export type ModelUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

export type ProviderData = {
  encryptedKey: string;
  models: ModelUsage[];
  fetchedAt: string;
  lastSuccessfulFetchAt?: string;
  lastError?: string;
};

export type UserReport = {
  email: string;
  providers: Partial<Record<Provider, ProviderData>>;
  updatedAt: string;
};

export type UsageResult = {
  provider: Provider;
  models: ModelUsage[];
  fetchedAt: string;
};

export type SubmitRequest = {
  email: string;
  provider: Provider;
  apiKey: string;
  teamToken: string;
};

export type SubmitResponse = {
  email: string;
  result: UsageResult;
};

export type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; email: string; result: UsageResult }
  | { status: "error"; message: string };
