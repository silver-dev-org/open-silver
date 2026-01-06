import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CURRENCY_FORMAT } from "../constants";
import type { SalaryModel, YearlyData } from "../types";

export function YearlyCompensationChart({
  salaryModel,
  data,
  salary,
  heading,
  yDomain,
}: {
  salaryModel: SalaryModel;
  data: YearlyData[];
  salary: number;
  heading: string;
  yDomain?: [number, number];
}) {
  const employerLabel = "Employer pays";
  const workerLabel =
    salaryModel === "eor" ? "Employee gets" : "Contractor gets";
  const chartData = data.map((d) => ({
    year: `Year ${d.year}`,
    [employerLabel]: Math.round(d[salaryModel].employer),
    [workerLabel]: Math.round(d[salaryModel].worker),
  }));

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle>{heading}</CardTitle>
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
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--popover-foreground)",
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
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey={workerLabel}
              fill="var(--secondary)"
              radius={[4, 4, 0, 0]}
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
