import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelTable } from "@/token-tracker/components/model-table";
import { formatTokens } from "@/token-tracker/utils";
import type { SourceReport, UserReport } from "@/token-tracker/types";

interface DashboardTableProps {
  reports: UserReport[];
}

interface AggregateMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  activeUsers: number;
}

const SOURCE_LABELS: Record<string, string> = {
  "claude-code": "Claude Code",
  cursor: "Cursor",
  codex: "Codex",
  "gemini-cli": "Gemini CLI",
  aider: "Aider",
};

function computeAggregates(reports: UserReport[]): AggregateMetrics {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const report of reports) {
    for (const source of report.sources) {
      for (const m of source.models) {
        totalInputTokens += m.inputTokens;
        totalOutputTokens += m.outputTokens;
      }
    }
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    activeUsers: reports.length,
  };
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total input tokens"
          value={formatTokens(metrics.totalInputTokens)}
        />
        <MetricCard
          label="Total output tokens"
          value={formatTokens(metrics.totalOutputTokens)}
        />
        <MetricCard label="Active users" value={String(metrics.activeUsers)} />
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
  const total = report.sources.reduce(
    (s, src) =>
      s +
      src.models.reduce((ms, m) => ms + m.inputTokens + m.outputTokens, 0),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-baseline">
          <span>{report.email}</span>
          <span className="text-sm text-muted-foreground font-normal">
            {formatTokens(total)} tokens · updated{" "}
            {new Date(report.updatedAt).toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {report.sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No usage recorded.</p>
        ) : (
          report.sources.map((src) => (
            <SourceSection key={src.source} source={src} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SourceSection({ source }: { source: SourceReport }) {
  const label = SOURCE_LABELS[source.source] ?? source.source;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          synced {new Date(source.lastSyncedAt).toLocaleString()}
        </span>
      </div>
      {source.models.length === 0 ? (
        <p className="text-sm text-muted-foreground">No usage recorded.</p>
      ) : (
        <ModelTable models={source.models} compact />
      )}
    </div>
  );
}
