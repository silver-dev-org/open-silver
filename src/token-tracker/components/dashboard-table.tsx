import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROVIDER_CONFIG } from "@/token-tracker/constants";
import { ModelTable } from "@/token-tracker/components/model-table";
import { formatTokens } from "@/token-tracker/utils";
import type { Provider, UserReport } from "@/token-tracker/types";

const STALE_HOURS = 12;

interface DashboardTableProps {
  reports: UserReport[];
}

interface AggregateMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  activeUsers: number;
  activeProviders: number;
}

function computeAggregates(reports: UserReport[]): AggregateMetrics {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let activeProviders = 0;
  const userSet = new Set<string>();

  for (const report of reports) {
    for (const [, data] of Object.entries(report.providers)) {
      if (!data) continue;
      for (const m of data.models) {
        totalInputTokens += m.inputTokens;
        totalOutputTokens += m.outputTokens;
      }
      activeProviders += 1;
      userSet.add(report.email);
    }
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    activeUsers: userSet.size,
    activeProviders,
  };
}

function isStale(fetchedAt: string): boolean {
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  return ageMs > STALE_HOURS * 60 * 60 * 1000;
}

export function DashboardTable({ reports }: DashboardTableProps) {
  if (reports.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No reports submitted yet.
      </p>
    );
  }

  const metrics = computeAggregates(reports);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total input tokens"
          value={formatTokens(metrics.totalInputTokens)}
        />
        <MetricCard
          label="Total output tokens"
          value={formatTokens(metrics.totalOutputTokens)}
        />
        <MetricCard label="Active users" value={String(metrics.activeUsers)} />
        <MetricCard
          label="Active providers"
          value={String(metrics.activeProviders)}
        />
      </div>
      {reports.map((report) => (
        <UserCard key={report.email} report={report} />
      ))}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4 flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
    </div>
  );
}

function UserCard({ report }: { report: UserReport }) {
  const providers = Object.entries(report.providers) as [
    Provider,
    NonNullable<UserReport["providers"][Provider]>,
  ][];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-baseline">
          <span>{report.email}</span>
          <span className="text-sm text-muted-foreground font-normal">
            Updated {new Date(report.updatedAt).toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {providers.map(([provider, data]) => (
          <ProviderSection key={provider} provider={provider} data={data} />
        ))}
      </CardContent>
    </Card>
  );
}

interface ProviderSectionProps {
  provider: Provider;
  data: NonNullable<UserReport["providers"][Provider]>;
}

function ProviderSection({ provider, data }: ProviderSectionProps) {
  const label = PROVIDER_CONFIG[provider].label;
  const totalInput = data.models.reduce((s, m) => s + m.inputTokens, 0);
  const totalOutput = data.models.reduce((s, m) => s + m.outputTokens, 0);
  const stale = isStale(data.fetchedAt);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {stale && (
            <span className="text-xs text-warning bg-warning/10 border border-warning/30 rounded px-1.5 py-0.5">
              Stale
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatTokens(totalInput + totalOutput)} tokens · fetched{" "}
            {new Date(data.fetchedAt).toLocaleString()}
          </span>
        </div>
      </div>
      {data.lastError && (
        <div className="text-xs text-destructive mb-3 rounded border border-destructive/30 bg-destructive/5 px-3 py-2">
          <span className="font-medium">Last refresh failed:</span>{" "}
          {data.lastError}
          {data.lastSuccessfulFetchAt && (
            <span className="text-muted-foreground ml-1">
              · last success{" "}
              {new Date(data.lastSuccessfulFetchAt).toLocaleString()}
            </span>
          )}
        </div>
      )}
      {data.models.length === 0 ? (
        <p className="text-sm text-muted-foreground">No usage this month.</p>
      ) : (
        <ModelTable models={data.models} provider={provider} compact />
      )}
    </div>
  );
}
