import type { ModelUsage, Provider, UsageResult } from "@/token-tracker/types";

type AnthropicBucket = {
  results: {
    model: string | null;
    uncached_input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens: number;
    cache_creation: {
      ephemeral_1h_input_tokens: number;
      ephemeral_5m_input_tokens: number;
    };
  }[];
};

type AnthropicUsageResponse = {
  data: AnthropicBucket[];
  has_more: boolean;
};

type OpenAIBucket = {
  results: {
    model: string | null;
    input_tokens: number;
    output_tokens: number;
    input_cached_tokens: number;
  }[];
};

type OpenAIUsageResponse = {
  data: OpenAIBucket[];
  has_more: boolean;
};

function aggregateModels(map: Map<string, ModelUsage>): ModelUsage[] {
  return Array.from(map.values()).filter((m) => m.model);
}

async function fetchAnthropicUsage(apiKey: string): Promise<UsageResult> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const url = new URL(
    "https://api.anthropic.com/v1/organizations/usage_report/messages",
  );
  url.searchParams.set("starting_at", startOfMonth.toISOString());
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.append("group_by[]", "model");

  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body}`);
  }

  const data: AnthropicUsageResponse = await res.json();
  const modelMap = new Map<string, ModelUsage>();

  for (const bucket of data.data) {
    for (const r of bucket.results) {
      if (!r.model) continue;
      const existing = modelMap.get(r.model) ?? {
        model: r.model,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      };
      existing.inputTokens += r.uncached_input_tokens;
      existing.outputTokens += r.output_tokens;
      existing.cacheReadTokens += r.cache_read_input_tokens;
      existing.cacheWriteTokens +=
        r.cache_creation.ephemeral_1h_input_tokens +
        r.cache_creation.ephemeral_5m_input_tokens;
      modelMap.set(r.model, existing);
    }
  }

  return {
    provider: "anthropic",
    models: aggregateModels(modelMap),
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchOpenAIUsage(apiKey: string): Promise<UsageResult> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const startTime = Math.floor(startOfMonth.getTime() / 1000);

  const url = new URL(
    "https://api.openai.com/v1/organization/usage/completions",
  );
  url.searchParams.set("start_time", String(startTime));
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.append("group_by", "model");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API ${res.status}: ${body}`);
  }

  const data: OpenAIUsageResponse = await res.json();
  const modelMap = new Map<string, ModelUsage>();

  for (const bucket of data.data) {
    for (const r of bucket.results) {
      if (!r.model) continue;
      const existing = modelMap.get(r.model) ?? {
        model: r.model,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      };
      existing.inputTokens += r.input_tokens;
      existing.outputTokens += r.output_tokens;
      existing.cacheReadTokens += r.input_cached_tokens;
      modelMap.set(r.model, existing);
    }
  }

  return {
    provider: "openai",
    models: aggregateModels(modelMap),
    fetchedAt: new Date().toISOString(),
  };
}

const FETCHERS: Partial<Record<Provider, (key: string) => Promise<UsageResult>>> = {
  anthropic: fetchAnthropicUsage,
  openai: fetchOpenAIUsage,
};

export function fetchProviderUsage(
  provider: Provider,
  apiKey: string,
): Promise<UsageResult> {
  const fetcher = FETCHERS[provider];
  if (!fetcher) {
    throw new Error(`No usage API implemented for ${provider}.`);
  }
  return fetcher(apiKey);
}
