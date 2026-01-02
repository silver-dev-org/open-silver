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

type ServiceModel = typeof CONTINGENCY | typeof STAFFING;

interface ContractProps {
  // Using single letters to keep the URL shorter
  [NUMBER_OF_HIRES]: number;
  [SALARY]: number;
  [PAYROLL]: boolean;
  [FAST_PROCESSING]: boolean;
  [MONTHLY_PAYMENT]: boolean;
  [SERVICE_MODEL]: ServiceModel;
}

const NUMBER_OF_HIRES = "n";
const SALARY = "s";
const PAYROLL = "p";
const FAST_PROCESSING = "fp";
const MONTHLY_PAYMENT = "m";
const SERVICE_MODEL = "sm";

const CONTINGENCY = "c";
const STAFFING = "s";

const BASE_FEE = 25;
const FAST_PROCESSING_FEE = 20;
const PAYROLL_COST = 500;
const CONTINGENCY_MONTHS_DURATION = 3;
const MONTHS_PER_YEAR = 12;
const MONTHLY_PAYMENT_MARKUP = 10;

const NUMBER_OF_HIRES_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3+" },
];
const SALARY_OPTIONS = [
  { value: "50000", label: "$50k" },
  { value: "75000", label: "$75k" },
  { value: "100000", label: "$100k+" },
];
const SERVICE_MODEL_OPTIONS = [
  { value: CONTINGENCY, label: "Contingency" },
  { value: STAFFING, label: "Staffing" },
];

const DEFAULT_CONTRACT_PROPS: ContractProps = {
  n: parseInt(NUMBER_OF_HIRES_OPTIONS[0].value),
  s: parseInt(SALARY_OPTIONS[0].value),
  sm: SERVICE_MODEL_OPTIONS[0].value as ServiceModel,
  p: false,
  fp: false,
  m: false,
};

const RADIO_FIELDS: CardRadioGroupProps[] = [
  {
    name: NUMBER_OF_HIRES,
    legend: "Expected headcount",
    options: NUMBER_OF_HIRES_OPTIONS,
  },
  {
    name: SALARY,
    legend: "Salary",
    options: SALARY_OPTIONS,
  },
  {
    name: SERVICE_MODEL,
    legend: "Service model",
    options: SERVICE_MODEL_OPTIONS,
  },
];
const CHECKBOX_FIELDS: CardCheckboxProps[] = [
  {
    name: PAYROLL,
    label: "Payroll",
    description: `We handle payments and contracts. You pay once per monthly cycle for all hired staff. $${PAYROLL_COST} per person per month.`,
  },
  {
    name: MONTHLY_PAYMENT,
    label: `Pay over ${MONTHS_PER_YEAR} months`,
    description: `Spread payments over ${MONTHS_PER_YEAR} months for smoother cash flow. ${MONTHLY_PAYMENT_MARKUP}% markup applies.`,
  },
  {
    name: FAST_PROCESSING,
    label: "Fast processing",
    description: `If you process the candidates in less than 3 weeks, ${FAST_PROCESSING_FEE}%. Otherwise, ${BASE_FEE}%.`,
  },
];

function calculateTotalCost(data: ContractProps) {
  const { p: hasPayroll } = data;
  let cost = calculateHiringCost(data);

  if (hasPayroll) {
    cost += PAYROLL_COST * MONTHS_PER_YEAR;
  }

  return Math.round(cost);
}

function calculateHiringCost(data: ContractProps) {
  const { n: numberOfHires, s: salary } = data;
  const fee = getFee(data) / 100;
  return Math.round(numberOfHires * fee * salary);
}

function getFee({
  fp: isFastProcessing,
  m: isMonthlyPayment,
  sm: serviceModel,
}: ContractProps) {
  let fee = isFastProcessing ? FAST_PROCESSING_FEE : BASE_FEE;

  if (serviceModel === CONTINGENCY && isMonthlyPayment) {
    fee *= 1 + MONTHLY_PAYMENT_MARKUP / 100;
  }

  return fee;
}

export function FeesCalculator() {
  const searchParams = useSearchParams();
  const [chartData, setChartData] = useState<any[]>([]);
  const [cost, setCost] = useState<number>(0);
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
    const value = searchParams?.get(key);
    if (value === null) return defaultValue;
    if (isNaN(Number(value))) return value;
    if (value === "true") return true;
    return Number(value);
  }

  useEffect(() => {
    const {
      m: isMonthlyPayment,
      p: hasPayroll,
      sm: serviceModel,
    } = contractProps;

    const chartData = [];
    const yAxis =
      calculateHiringCost({
        ...contractProps,
        [FAST_PROCESSING]: false,
        [MONTHLY_PAYMENT]: false,
      }) + PAYROLL_COST;
    const totalHiringCost = calculateHiringCost(contractProps);
    const monthlyHiringCost = Math.round(totalHiringCost / MONTHS_PER_YEAR);
    const totalMonths =
      serviceModel === CONTINGENCY && isMonthlyPayment
        ? MONTHS_PER_YEAR + CONTINGENCY_MONTHS_DURATION
        : MONTHS_PER_YEAR;

    for (let monthNum = 0; monthNum < totalMonths; monthNum++) {
      const date = new Date();
      date.setMonth(date.getMonth() + monthNum);
      chartData.push({
        yAxis,
        month: date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        payroll: hasPayroll ? PAYROLL_COST : 0,
        fee:
          serviceModel === CONTINGENCY
            ? isMonthlyPayment &&
              monthNum >= CONTINGENCY_MONTHS_DURATION &&
              monthNum < totalMonths
              ? monthlyHiringCost
              : monthNum === CONTINGENCY_MONTHS_DURATION
                ? totalHiringCost
                : 0
            : monthlyHiringCost,
      });
    }

    setChartData(chartData);
    setCost(calculateTotalCost(contractProps));
    setFee(getFee(contractProps));
  }, [contractProps]);

  function share() {
    const queryString = Object.entries(contractProps)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    const options: string[] = CHECKBOX_FIELDS.filter(
      ({ name }) => contractProps[name] === true,
    ).map(({ label }) => label);

    const expectedAverageSalary = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(contractProps[SALARY]);

    const expectedContractCost = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cost || 0);

    const serviceModel = new Map(
      SERVICE_MODEL_OPTIONS.map(({ value, label }) => [value, label]),
    ).get(contractProps[SERVICE_MODEL]);

    const emailSubject = encodeURIComponent("Contract Details");
    const emailBody = encodeURIComponent(
      `Number of placements: ${contractProps[NUMBER_OF_HIRES]}
Expected average salary: ${expectedAverageSalary}
Service model: ${serviceModel}

Placement fee: ${fee}%
Expected contract cost: ${expectedContractCost}
${options.length > 0 ? "\nOptions:\n- " + options.join("\n- ") + "\n" : ""}
Link: ${window.location.origin}/${window.location.pathname}?${queryString}`,
    );

    const shareLink = `mailto:gabriel@silver.dev?subject=${emailSubject}&body=${emailBody}`;

    setShareLink(shareLink);
  }

  function setContractProp(key: keyof ContractProps, value: any) {
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
          {RADIO_FIELDS.map((field, i) => (
            <CardRadioGroup
              key={i}
              onValueChange={(value) => {
                if (field.name === SERVICE_MODEL) {
                  setContractProps({
                    ...contractProps,
                    [MONTHLY_PAYMENT]: false,
                    [FAST_PROCESSING]: false,
                    [PAYROLL]: false,
                  });
                }
                setContractProp(field.name, value);
              }}
              currentValue={contractProps[field.name].toString()}
              {...field}
            />
          ))}
          {CHECKBOX_FIELDS.map((field, i) => (
            <CardCheckbox
              key={i}
              onCheckedChange={(checked) => {
                setContractProp(field.name, checked);
              }}
              disabled={contractProps[SERVICE_MODEL] === STAFFING}
              checked={Boolean(contractProps[field.name])}
              {...field}
            />
          ))}
          {/*<Button asChild onClick={share}>
            <Link target="_blank" href={shareLink}>
              Share with Gabriel
            </Link>
          </Button>*/}
          <Button asChild>
            <Link target="_blank" href="https://silver.dev/companies">
              Book with Gabriel
            </Link>
          </Button>
        </div>
        <div className="flex flex-col flex-grow">
          <div className="flex gap-1.5 mb-12">
            <NumberCard
              label="Expected Contract Cost"
              value={cost}
              prefix="$"
            />
            <NumberCard label="Placement Fee" value={fee} suffix="%" />
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

interface CardRadioGroupProps {
  name: keyof ContractProps;
  legend: string;
  options: {
    value: string;
    label: string;
  }[];
  onValueChange?: (value: string) => void;
  currentValue?: string;
}

function CardRadioGroup({
  name,
  legend,
  options,
  onValueChange,
  currentValue,
}: CardRadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-0.5">
      <div>
        <legend>{legend}:</legend>
      </div>
      <RadioGroup
        value={currentValue || ""}
        onValueChange={onValueChange}
        className="flex gap-2"
      >
        {options.map(({ value, label }) => (
          <Label
            key={value}
            htmlFor={`${name}-${value}`}
            className={cn(
              "flex-grow flex items-center justify-center w-full gap-2 p-1 border rounded-lg cursor-pointer hover:bg-foreground/10 transition-all shadow",
              currentValue === value ? "border-foreground" : "border-border",
            )}
          >
            <RadioGroupItem
              className="hidden"
              value={value}
              id={`${name}-${value}`}
            />
            <span className="text-sm font-medium">{label}</span>
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

interface CardCheckboxProps {
  name: keyof ContractProps;
  label: string;
  description?: string;
  disabled?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function CardCheckbox({
  name,
  label,
  description,
  disabled,
  checked,
  onCheckedChange,
}: CardCheckboxProps) {
  return (
    <Label htmlFor={name}>
      <Card
        className={cn(
          "rounded-md border-border bg-transparent transition-colors",
          checked ? "border-foreground" : "",
          disabled
            ? "cursor-not-allowed opacity-75"
            : "cursor-pointer hover:bg-accent",
        )}
      >
        <CardHeader className="p-4">
          <CardTitle className="flex gap-1.5 text-base font-semibold items-center">
            <Checkbox
              id={name}
              onCheckedChange={onCheckedChange}
              checked={checked}
              className="border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background"
              disabled={disabled}
            />
            <span>{label}</span>
          </CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Label>
  );
}

interface NumberCardProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

function NumberCard({ value, label, prefix, suffix }: NumberCardProps) {
  return (
    <Card className="w-1/2 text-center rounded-md border-foreground bg-card">
      <CardHeader className="h-full">
        <CardTitle className="text-3xl sm:text-6xl my-auto font-[Georgia]">
          <NumberFlow prefix={prefix} suffix={suffix} value={value} />
        </CardTitle>
        <CardDescription className="text-muted-foreground flex items-center gap-1 justify-center">
          {label}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
