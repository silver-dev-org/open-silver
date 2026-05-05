import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROVIDER_CONFIG } from "@/token-tracker/constants";
import { ModelTable } from "@/token-tracker/components/model-table";
import { formatTokens } from "@/token-tracker/utils";
import type { UsageResult } from "@/token-tracker/types";

interface UsageSummaryProps {
  email: string;
  result: UsageResult;
}

export function UsageSummary({ email, result }: UsageSummaryProps) {
  const providerLabel = PROVIDER_CONFIG[result.provider].label;
  const totalInput = result.models.reduce((s, m) => s + m.inputTokens, 0);
  const totalOutput = result.models.reduce((s, m) => s + m.outputTokens, 0);

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      <p className="text-center text-muted-foreground">
        {providerLabel} usage for{" "}
        <span className="font-semibold text-foreground">{email}</span>
        {" — "}
        <span className="text-foreground">
          {formatTokens(totalInput + totalOutput)} tokens this month
        </span>
      </p>
      {result.models.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No usage found for this month.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{providerLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <ModelTable models={result.models} provider={result.provider} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
