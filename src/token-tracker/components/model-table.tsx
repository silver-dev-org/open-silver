import { formatTokens } from "@/token-tracker/utils";
import type { ModelUsage, Provider } from "@/token-tracker/types";

interface ModelTableProps {
  models: ModelUsage[];
  provider: Provider;
  compact?: boolean;
}

export function ModelTable({ models, provider, compact }: ModelTableProps) {
  const showCacheWrite = provider === "anthropic";
  const cell = compact ? "py-1" : "py-2";

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-muted-foreground border-b border-border">
          <th className="text-left pb-2 font-normal">Model</th>
          <th className="text-right pb-2 font-normal">Input</th>
          <th className="text-right pb-2 font-normal">Output</th>
          <th className="text-right pb-2 font-normal">Cache read</th>
          {showCacheWrite && (
            <th className="text-right pb-2 font-normal">Cache write</th>
          )}
        </tr>
      </thead>
      <tbody>
        {models.map((m) => (
          <tr key={m.model} className="border-b border-border/50 last:border-0">
            <td className={`${cell} font-mono text-xs`}>{m.model}</td>
            <td className={`${cell} text-right`}>
              {formatTokens(m.inputTokens)}
            </td>
            <td className={`${cell} text-right`}>
              {formatTokens(m.outputTokens)}
            </td>
            <td className={`${cell} text-right`}>
              {formatTokens(m.cacheReadTokens)}
            </td>
            {showCacheWrite && (
              <td className={`${cell} text-right`}>
                {formatTokens(m.cacheWriteTokens)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
