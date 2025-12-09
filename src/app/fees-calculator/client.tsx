"use client";

import { Description } from "@/components/description";
import { Heading } from "@/components/heading";
import { Section } from "@/components/section";
import { Spacer } from "@/components/spacer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  calculateContractCost,
  ContractProps,
  defaultContractProps,
  getFinalFee,
  headcountOptions,
  payrollCost,
  salaryOptions,
} from "./utils";

const booleanFields = [
  {
    key: "c",
    label: "Contingency",
    description: `You pay only 3 months after a successful hire.`,
    alwaysChecked: true,
  },
  {
    key: "p",
    label: "Payroll",
    description: `We handle payments and contracts. You pay once per monthly cycle for all hired staff. $${payrollCost} per person per month.`,
  },
  {
    key: "fp",
    label: "Fast processing",
    description: `If you process the candidates in less than 3 weeks, 20%. Otherwise, 25%.`,
  },
];

const paymentAfterMonths = 3;

export function FeesCalculator() {
  const searchParams = useSearchParams();
  const [chartData, setChartData] = useState<any[]>([]);
  const [cost, setCost] = useState<number>();
  const [shareLink, setShareLink] = useState("");
  const [fee, setFee] = useState(defaultContractProps.f);
  const [contractProps, setContractProps] = useState<ContractProps>({
    n: getParamOrDefault("n", defaultContractProps.n),
    f: getParamOrDefault("f", defaultContractProps.f),
    s: getParamOrDefault("s", defaultContractProps.s),
    p: getParamOrDefault("p", defaultContractProps.p),
    fp: getParamOrDefault("fp", defaultContractProps.fp),
    c: true, // Contingency
  });

  function getParamOrDefault(key: string, defaultValue: any) {
    const param = searchParams?.get(key);
    if (param === null) return defaultValue;
    if (param === "true") return true;
    return Number(param);
  }

  useEffect(() => processContractProps(contractProps), [contractProps]);

  function processContractProps(data: ContractProps) {
    const chartData = [];
    const yAxis = 1000 + calculateContractCost(data, false);
    for (let monthNum = 1; monthNum <= 12; monthNum++) {
      const month = new Date();
      month.setMonth(month.getMonth() + monthNum);
      const fee =
        monthNum === paymentAfterMonths
          ? Math.round(calculateContractCost(data, false))
          : 0;
      const payroll = data.p ? payrollCost : 0;
      chartData.push({
        month: month.toLocaleString("default", { month: "long" }),
        fee,
        payroll,
        yAxis,
      });
    }
    setChartData(chartData);
    setCost(calculateContractCost(data));
    setFee(getFinalFee(data));
  }

  function share() {
    const queryString = Object.entries(contractProps)
      .filter(([key, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    const options: string[] = booleanFields
      .filter(({ key }) => contractProps[key] === true)
      .map(({ label }) => label);

    const expectedAverageSalary = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(contractProps.s);

    const expectedContractCost = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cost || 0);

    const emailSubject = encodeURIComponent("Contract Details");
    const emailBody = encodeURIComponent(
      `Number of placements: ${contractProps.n}
Expected average salary: ${expectedAverageSalary}
Placement fee: ${fee}%
Expected contract cost: ${expectedContractCost}
${options.length > 0 ? "\nOptions:\n- " + options.join("\n- ") + "\n" : ""}
Link: ${window.location.origin}/${window.location.pathname}?${queryString}`,
    );

    const shareLink = `mailto:gabriel@silver.dev?subject=${emailSubject}&body=${emailBody}`;

    setShareLink(shareLink);
  }

  function setContractProp(key: string, value: any) {
    setContractProps((params) => ({
      ...params,
      [key]: value,
    }));
  }

  return (
    <Section className="flex flex-col">
      <Heading center>
        Agency Fees <span className="text-primary">Explained</span>
      </Heading>
      <Spacer />
      <Description center>
        Adjust terms, explore options, and share your estimate with Silver.
      </Description>
      <Spacer size="lg" />
      <div className="flex flex-col lg:flex-row gap-12 flex-grow p-4 sm:container sm:mx-auto">
        <div className="flex flex-col gap-4 lg:max-w-xs">
          <div className="flex flex-col gap-2">
            <p>Expected Headcount:</p>
            <CardRadioGroup
              name="n"
              onValueChange={(value) => setContractProp("n", value)}
              currentValue={contractProps.n.toString()}
              options={headcountOptions}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <p>Expected Average Salary:</p>
            <CardRadioGroup
              name="s"
              onValueChange={(value) => setContractProp("s", value)}
              currentValue={contractProps.s.toString()}
              options={salaryOptions}
            />
          </div>
          <div className="flex flex-col gap-2">
            {booleanFields.map(({ key, label, description, alwaysChecked }) => {
              const isDisabled = alwaysChecked === true;
              return (
                <Label key={key} htmlFor={key}>
                  <Card
                    className={cn(
                      "rounded-md border-border bg-transparent transition-colors",
                      !isDisabled && "hover:bg-foreground/10 cursor-pointer",
                      contractProps[key as keyof ContractProps] &&
                        "border-foreground",
                    )}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="flex gap-1.5 text-base font-semibold items-center">
                        <Checkbox
                          id={key}
                          onCheckedChange={(checked) =>
                            !isDisabled && setContractProp(key, checked)
                          }
                          checked={contractProps[key as keyof ContractProps]}
                          disabled={isDisabled}
                          className="border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
                        />
                        <span>{label}</span>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Label>
              );
            })}
          </div>
          <Button asChild onClick={share}>
            <Link target="_blank" href={shareLink}>
              Share with Gabriel
            </Link>
          </Button>
        </div>
        <div className="flex flex-col flex-grow">
          <div className="flex gap-1.5 mb-12">
            <Card className="w-1/2 text-center rounded-md border-foreground bg-card">
              <CardHeader className="h-full">
                <CardTitle className="text-3xl sm:text-6xl my-auto font-[Georgia]">
                  <NumberFlow prefix="$" value={cost || 0} />
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Expected contract cost
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="w-1/2 text-center rounded-md border-foreground bg-card">
              <CardHeader className="h-full">
                <CardTitle className="text-3xl sm:text-6xl my-auto font-[Georgia]">
                  <NumberFlow suffix="%" value={fee} />
                </CardTitle>
                <CardDescription className="text-muted-foreground flex items-center gap-1 justify-center">
                  Placement fee
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          <ChartContainer
            config={{ fee: { label: "Fee" }, payroll: { label: "Payroll" } }}
            className="w-full min-h-80"
          >
            <BarChart accessibilityLayer data={chartData}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="payroll" fill="var(--primary)" stackId={1} />
              <Bar dataKey="fee" fill="var(--foreground)" stackId={1} />
              <YAxis
                tickLine={false}
                orientation="right"
                dataKey="yAxis"
                tickFormatter={
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format
                }
              />
              <XAxis
                dataKey="month"
                tickFormatter={(month) => month.slice(0, 3)}
                tickMargin={12}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </Section>
  );
}

function CardRadioGroup({
  options,
  name,
  onValueChange,
  currentValue,
}: {
  options: { value: string; label: string }[];
  name: string;
  onValueChange: (value: string) => void;
  currentValue?: string;
}) {
  return (
    <RadioGroup value={currentValue || ""} className="flex gap-2">
      {options.map(({ value, label }) => (
        <div
          key={value}
          className={cn(
            "flex-grow flex items-center justify-center gap-2 p-1 border rounded-lg cursor-pointer hover:bg-foreground/10 transition-all shadow",
            currentValue === value ? "border-foreground" : "border-border",
          )}
          onClick={() => onValueChange(value)}
        >
          <RadioGroupItem
            className="hidden"
            value={value}
            id={`${name}-${value}`}
          />
          <Label
            htmlFor={`${name}-${value}`}
            className="cursor-pointer text-sm font-medium"
          >
            {label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
