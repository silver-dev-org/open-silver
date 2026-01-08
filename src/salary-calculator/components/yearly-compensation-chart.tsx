import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS_BY_PERSONA, CURRENCY_FORMAT } from "../constants";
import type { Breakdown, SalaryModel, Scenario } from "../types";
import { getOrdinal } from "@/lib/utils";

export function YearlyCompensationChart({
  salaryModel,
  yearlyBreakdowns,
  salary,
  heading,
  yDomain,
  onBarClick,
}: {
  salaryModel: SalaryModel;
  yearlyBreakdowns: Record<Scenario, Breakdown>[];
  salary: number;
  heading: string;
  yDomain?: [number, number];
  onBarClick?: (year: number, scenario: Scenario) => void;
}) {
  const employerLabel = "Employer pays";
  const workerLabel =
    salaryModel === "eor" ? "Employee gets" : "Contractor gets";
  const chartData = yearlyBreakdowns.map((breakdowns, index) => ({
    year: `${getOrdinal(index + 1)} year`,
    [employerLabel]: Math.round(breakdowns[`${salaryModel}-employer`].total),
    [workerLabel]: Math.round(breakdowns[`${salaryModel}-worker`].total),
  }));

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>{heading}</CardTitle>
        <CardDescription>
          Tip: click a bar to see its breakdown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="year"
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)" }}
              fontSize={12}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)" }}
              fontSize={12}
              tickFormatter={(value: number) =>
                value.toLocaleString("en-US", {
                  ...CURRENCY_FORMAT,
                  notation: "compact",
                })
              }
              domain={yDomain}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--popover-foreground)",
                fontWeight: "bold",
              }}
              formatter={(value: number) =>
                value.toLocaleString("en-US", CURRENCY_FORMAT)
              }
              cursor={{ fill: "var(--accent)", opacity: 0.5 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "24px", fontWeight: "bold" }}
              iconType="rect"
            />
            <Bar
              dataKey={employerLabel}
              fill={COLORS_BY_PERSONA.employer.var}
              radius={[4, 4, 0, 0]}
              style={{ cursor: onBarClick ? "pointer" : "default" }}
              onClick={(_data, index) => {
                onBarClick?.(index, `${salaryModel}-employer`);
              }}
            />
            <Bar
              dataKey={workerLabel}
              fill={COLORS_BY_PERSONA.worker.var}
              radius={[4, 4, 0, 0]}
              opacity={0.8}
              style={{ cursor: onBarClick ? "pointer" : "default" }}
              onClick={(_data, index) => {
                onBarClick?.(index, `${salaryModel}-worker`);
              }}
            />
            <ReferenceLine
              y={salary}
              stroke="var(--foreground)"
              strokeDasharray="3 3"
              label={{
                value: "Gross",
                fill: "var(--foreground)",
                fontSize: 14,
                fontWeight: "bold",
                position: "left",
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
