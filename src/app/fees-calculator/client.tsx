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

interface ContractProps {
  // Using single letters to keep the URL shorter
  n: number; // Number of hires
  s: number; // Salary
  p: boolean; // Payroll
  fp: boolean; // Fast processing
  m: boolean; // Pay over 12 months
  [key: string]: any; // avoid errors
}

const BASE_FEE = 25;
const FAST_PROCESSING_FEE = 20;
const PAYROLL_COST = 500;
const CONTINGENCY_MONTHS_DURATION = 3;
const MONTHS_PER_YEAR = 12;
const HEADCOUNT_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3+" },
];
const SALARY_OPTIONS = [
  { value: "50000", label: "$50k" },
  { value: "75000", label: "$75k" },
  { value: "100000", label: "$100k+" },
];
const DEFAULT_CONTRACT_PROPS: ContractProps = {
  n: parseInt(HEADCOUNT_OPTIONS[0].value),
  s: parseInt(SALARY_OPTIONS[0].value),
  p: false,
  fp: false,
  m: false,
  c: true, // Contingency
};
const BOOLEAN_FIELDS = [
  {
    key: "c",
    label: "Contingency",
    description: `You pay only ${CONTINGENCY_MONTHS_DURATION} months after a successful hire.`,
    alwaysChecked: true,
  },
  {
    key: "p",
    label: "Payroll",
    description: `We handle payments and contracts. You pay once per monthly cycle for all hired staff. $${PAYROLL_COST} per person per month.`,
  },
  {
    key: "fp",
    label: "Fast processing",
    description: `If you process the candidates in less than 3 weeks, ${FAST_PROCESSING_FEE}%. Otherwise, ${BASE_FEE}%.`,
  },
  {
    key: "m",
    label: `Pay over ${MONTHS_PER_YEAR} months`,
    description: `Spread payments over ${MONTHS_PER_YEAR} months for smoother cash flow. 10% markup applies.`,
  },
];

function calculateTotalCost(data: ContractProps) {
  const { p: includePayroll } = data;
  let cost = calculateHiringCost(data);

  if (includePayroll) {
    cost += PAYROLL_COST * MONTHS_PER_YEAR;
  }

  return Math.round(cost);
}

function calculateHiringCost(data: ContractProps) {
  const { n: numberOfHires, s: salary } = data;
  const fee = getFee(data) / 100;
  return Math.round(numberOfHires * fee * salary);
}

function getFee({ fp: fastProcessing, m: payMonthly }: ContractProps) {
  let fee = fastProcessing ? FAST_PROCESSING_FEE : BASE_FEE;
  if (payMonthly) {
    fee += 10;
  }
  return fee;
}

export function FeesCalculator() {
  const searchParams = useSearchParams();
  const [chartData, setChartData] = useState<any[]>([]);
  const [cost, setCost] = useState<number>();
  const [fee, setFee] = useState(BASE_FEE);
  const [shareLink, setShareLink] = useState("");
  const [contractProps, setContractProps] = useState<ContractProps>(
    Object.fromEntries(
      Object.entries(DEFAULT_CONTRACT_PROPS).map(([key, defaultValue]) => [
        key,
        getParamOrDefault(key, defaultValue),
      ]),
    ) as ContractProps,
  );

  function getParamOrDefault(key: string, defaultValue: any) {
    const param = searchParams?.get(key);
    if (param === null) return defaultValue;
    if (param === "true") return true;
    return Number(param);
  }

  useEffect(() => processContractProps(contractProps), [contractProps]);

  function processContractProps(data: ContractProps) {
    const { m: payMonthly, p: includePayroll } = data;
    const chartData = [];
    const totalHiringCost = calculateHiringCost(data);
    const monthlyHiringCost = Math.round(totalHiringCost / MONTHS_PER_YEAR);
    const totalMonths = MONTHS_PER_YEAR + CONTINGENCY_MONTHS_DURATION;

    for (let monthNum = 0; monthNum < totalMonths; monthNum++) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthNum);
      chartData.push({
        yAxis: PAYROLL_COST + totalHiringCost,
        month: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        payroll: includePayroll ? PAYROLL_COST : 0,
        fee:
          payMonthly &&
          monthNum >= CONTINGENCY_MONTHS_DURATION &&
          monthNum < totalMonths
            ? monthlyHiringCost
            : monthNum === CONTINGENCY_MONTHS_DURATION
              ? totalHiringCost
              : 0,
      });
    }

    setChartData(chartData);
    setCost(calculateTotalCost(data));
    setFee(getFee(data));
  }

  function share() {
    const queryString = Object.entries(contractProps)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    const options: string[] = BOOLEAN_FIELDS.filter(
      ({ key }) => contractProps[key] === true,
    ).map(({ label }) => label);

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
              options={HEADCOUNT_OPTIONS}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <p>Expected Average Salary:</p>
            <CardRadioGroup
              name="s"
              onValueChange={(value) => setContractProp("s", value)}
              currentValue={contractProps.s.toString()}
              options={SALARY_OPTIONS}
            />
          </div>
          <div className="flex flex-col gap-2">
            {BOOLEAN_FIELDS.map(
              ({ key, label, description, alwaysChecked }) => {
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
              },
            )}
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
