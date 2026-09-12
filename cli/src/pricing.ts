import type { ModelUsage } from "./types.js";

type ModelPrice = {
  inputPerMTok: number;
  outputPerMTok: number;
};

// USD per million tokens — update when Anthropic/Google changes API pricing
const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-opus-4": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
  "claude-sonnet-4": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-haiku-4": { inputPerMTok: 0.8, outputPerMTok: 4.0 },
  "claude-3-5-sonnet": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-3-5-haiku": { inputPerMTok: 0.8, outputPerMTok: 4.0 },
  "claude-3-opus": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
  "claude-3-sonnet": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-3-haiku": { inputPerMTok: 0.25, outputPerMTok: 1.25 },
  // OpenAI (API pricing, May 2026)
  "gpt-5": { inputPerMTok: 1.25, outputPerMTok: 10.0 },
  "gpt-5-mini": { inputPerMTok: 0.25, outputPerMTok: 2.0 },
  "gpt-4.1": { inputPerMTok: 2.0, outputPerMTok: 8.0 },
  "gpt-4.1-mini": { inputPerMTok: 0.40, outputPerMTok: 1.60 },
  "gpt-4.1-nano": { inputPerMTok: 0.10, outputPerMTok: 0.40 },
  "gpt-4o": { inputPerMTok: 2.50, outputPerMTok: 10.0 },
  "gpt-4o-mini": { inputPerMTok: 0.15, outputPerMTok: 0.60 },
  "o3": { inputPerMTok: 2.0, outputPerMTok: 8.0 },
  "o4-mini": { inputPerMTok: 1.10, outputPerMTok: 4.40 },
  // Gemini (Google AI API pricing, May 2026)
  "gemini-2.5-pro": { inputPerMTok: 1.25, outputPerMTok: 10.0 },
  "gemini-2.5-flash": { inputPerMTok: 0.30, outputPerMTok: 2.50 },
  "gemini-2.0-flash": { inputPerMTok: 0.10, outputPerMTok: 0.40 },
  "gemini-1.5-pro": { inputPerMTok: 1.25, outputPerMTok: 5.0 },
  "gemini-1.5-flash": { inputPerMTok: 0.075, outputPerMTok: 0.30 },
  "gemini-1.0-pro": { inputPerMTok: 0.50, outputPerMTok: 1.50 },
  // Cursor-specific model names — dot-notation Claude variants and alternate families
  // Claude 3.x (Cursor uses dot notation; the existing entries use dash notation)
  "claude-3.5-sonnet": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-3.5-haiku": { inputPerMTok: 0.80, outputPerMTok: 4.0 },
  "claude-3.7-sonnet": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  // Claude 4 family (Cursor uses "claude-4-*" while Anthropic API uses "claude-*-4")
  "claude-4-sonnet": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-4-opus": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
  "claude-4.5-sonnet": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-4.5-opus": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
  // Cursor-native models (pricing not publicly disclosed; conservative estimates)
  "cursor-small": { inputPerMTok: 0.20, outputPerMTok: 0.80 },
  "cursor-fast": { inputPerMTok: 0.20, outputPerMTok: 0.80 },
  "cursor-auto": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  // Legacy GPT (may appear in older Cursor history)
  "gpt-4-turbo": { inputPerMTok: 10.0, outputPerMTok: 30.0 },
  "gpt-4": { inputPerMTok: 30.0, outputPerMTok: 60.0 },
};

const FALLBACK_PRICE: ModelPrice = { inputPerMTok: 3.0, outputPerMTok: 15.0 };

function priceForModel(model: string): ModelPrice {
  let best: ModelPrice | null = null;
  let bestLen = 0;
  for (const [prefix, price] of Object.entries(MODEL_PRICES)) {
    if (model.startsWith(prefix) && prefix.length > bestLen) {
      best = price;
      bestLen = prefix.length;
    }
  }
  return best ?? FALLBACK_PRICE;
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens: number,
  cacheReadTokens: number,
): number {
  const { inputPerMTok, outputPerMTok } = priceForModel(model);
  return (
    (inputTokens / 1_000_000) * inputPerMTok +
    (outputTokens / 1_000_000) * outputPerMTok +
    (cacheWriteTokens / 1_000_000) * inputPerMTok * 1.25 +
    (cacheReadTokens / 1_000_000) * inputPerMTok * 0.1
  );
}

type RawUsage = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
};

export function aggregateToModelUsage(usages: RawUsage[]): ModelUsage[] {
  const map = new Map<string, RawUsage>();
  for (const u of usages) {
    const existing = map.get(u.model);
    if (existing) {
      existing.inputTokens += u.inputTokens;
      existing.outputTokens += u.outputTokens;
      existing.cacheWriteTokens += u.cacheWriteTokens;
      existing.cacheReadTokens += u.cacheReadTokens;
    } else {
      map.set(u.model, { ...u });
    }
  }
  return Array.from(map.values())
    .filter((u) => u.inputTokens + u.outputTokens + u.cacheWriteTokens + u.cacheReadTokens > 0)
    .map((u) => ({
      ...u,
      costUsd: calculateCost(u.model, u.inputTokens, u.outputTokens, u.cacheWriteTokens, u.cacheReadTokens),
    }));
}
