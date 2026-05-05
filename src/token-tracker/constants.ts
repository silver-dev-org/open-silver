import type { Provider } from "@/token-tracker/types";

export const METADATA = {
  title: "Token Tracker",
  description:
    "Submit your work email and API key to record this month's usage for your team. Keys are encrypted and refreshed automatically every few hours.",
};

export const BLOB_PREFIX = "token-tracker";

export const REQUIRED_ENV_VARS = [
  "ENCRYPTION_KEY",
  "DASHBOARD_PASSWORD",
  "SUBMIT_TOKEN",
  "CRON_SECRET",
] as const;

type ProviderConfig =
  | { label: string; hasUsageApi: true; placeholder: string }
  | { label: string; hasUsageApi: false; noUsageApiMessage: string };

export const PROVIDER_CONFIG: Record<Provider, ProviderConfig> = {
  anthropic: {
    label: "Anthropic",
    hasUsageApi: true,
    placeholder: "sk-ant-...",
  },
  openai: {
    label: "OpenAI",
    hasUsageApi: true,
    placeholder: "sk-...",
  },
  gemini: {
    label: "Gemini",
    hasUsageApi: false,
    noUsageApiMessage:
      "Google Gemini doesn't expose a usage API. Token counts are only available per-request inside the response metadata — there's no endpoint to query historical usage with an API key.",
  },
  grok: {
    label: "Grok",
    hasUsageApi: false,
    noUsageApiMessage:
      "xAI Grok doesn't expose a usage API. Token counts are only available per-request inside the response metadata — there's no endpoint to query historical usage with an API key.",
  },
};

export const PROVIDERS_WITH_USAGE_API = new Set<Provider>(
  (Object.entries(PROVIDER_CONFIG) as [Provider, ProviderConfig][])
    .filter(([, cfg]) => cfg.hasUsageApi)
    .map(([provider]) => provider),
);
