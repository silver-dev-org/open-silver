"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/contract/components/ui/chart";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/contract/components/ui/radio-group";
import NumberFlow from "@number-flow/react";

import { Button } from "@/contract/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/contract/components/ui/card";
import { Checkbox } from "@/contract/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ContractProps, getDiscountPercentage } from "./utils";

import { calculateContractCost, payrollCost } from "./utils";

export default function Page() {
  const searchParams = useSearchParams();
  const [chartData, setChartData] = useState<any[]>([]);
  const [cost, setCost] = useState<number>();
  const [shareLink, setShareLink] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [contractProps, setContractProps] = useState<ContractProps>({
    n: getParam("n", 1),
    f: getParam("f", 20),
    s: getParam("s", 75000),
    h: getParam("h", false),
    x: getParam("x", false),
    p: getParam("p", false),
    d: getParam("d", false),
    g: getParam("g", false),
    t: getParam("t", true),
  });
  function getParam(key: string, defaultValue: any) {
    const param = searchParams?.get(key);
    if (param === null) return defaultValue;
    if (param === "true") return true;
    return Number(param);
  }
  const booleanProps = [
    ["x", "Exclusivity", "Each role is handled by only one agency."],
    ["p", "Payroll", "We handle payments and contracts. You pay once."],
    ["d", "Deferred payment", "Pay 6 months after the hire was made."],
    ["g", "Pay as you go", "Pay the fee in monthly installments."],
    [
      "t",
      "Strong guarantee",
      "Fee will be due after the guarantee period is over.",
    ],
  ];

  useEffect(() => processContractProps(contractProps), [contractProps]);

  function processContractProps(props: ContractProps) {
    const startingMonth = props.d ? 6 : 3;
    const chartData = [];
    const yAxis = 1000 + calculateContractCost(props, false, false);
    for (let monthNum = 1; monthNum <= 12; monthNum++) {
      const month = new Date();
      month.setMonth(month.getMonth() + monthNum);
      const fee =
        monthNum == startingMonth ||
        (props.g && monthNum >= startingMonth && monthNum < startingMonth + 3)
          ? Math.round(calculateContractCost(props, false) / (props.g ? 3 : 1))
          : 0;
      const payroll = props.p ? payrollCost : 0;
      chartData.push({
        month: month.toLocaleString("default", { month: "long" }),
        fee: fee,
        payroll: payroll,
        yAxis: yAxis,
      });
    }
    setChartData(chartData);
    setDiscountPercentage(getDiscountPercentage(props));
    setCost(calculateContractCost(props));
  }

  function setContractProp(key: string, value: any) {
    setContractProps((params) => ({
      ...params,
      [key]: value,
    }));
  }

  return (
    <div className="flex flex-col h-screen">
      <main>
        <div className="text-center m-12 sm:m-24 space-y-12">
          <h1 className="text-6xl/snug font-serif">
            Agency Fees <span className="text-[#fa4529]">Explained</span>
          </h1>
          <p className="text-center text-balance max-w-prose mx-auto text-2xl sm:text-3xl">
            Adjust terms, explore options, and share your estimate with Silver.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-12 flex-grow p-4 sm:container sm:mx-auto">
          <div className="flex flex-col gap-4 lg:max-w-xs">
            <div className="flex flex-col gap-2">
              <p>Expected Headcount:</p>
              <CardRadioGroup
                name="n"
                onValueChange={(value) => setContractProp("n", value)}
                currentValue={contractProps.n.toString()}
                options={[
                  { value: "1", label: "1" },
                  { value: "2", label: "2" },
                  { value: "3", label: "3+" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p>Expected Average Salary:</p>
              <CardRadioGroup
                name="s"
                onValueChange={(value) => setContractProp("s", value)}
                currentValue={contractProps.s.toString()}
                options={[
                  { value: "50000", label: "$50k" },
                  { value: "75000", label: "$75k" },
                  { value: "100000", label: "$100k+" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              {booleanProps.map(([key, label, description]) => {
                return (
                  <Label key={key} htmlFor={key}>
                    <Card
                      className={`transition-colors hover:bg-primary/10 cursor-pointer ${
                        contractProps[key as keyof ContractProps] &&
                        "border-primary"
                      }`}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="flex gap-1.5">
                          <Checkbox
                            id={key}
                            onCheckedChange={(checked) =>
                              setContractProp(key, checked)
                            }
                            checked={contractProps[key as keyof ContractProps]}
                          />
                          {label}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Label>
                );
              })}
            </div>
            <Button
              asChild
              className="bg-gradient-to-br from-zinc-500 via-zinc-50 to-zinc-500 duration-300 transition-all hover:opacity-50 text-black"
              onClick={() => {
                const queryString = Object.entries(contractProps)
                  .filter(([key, value]) => value)
                  .map(([key, value]) => `${key}=${value}`)
                  .join("&");
                const options: string[] = booleanProps
                  .filter(([key]) => contractProps[key] === true)
                  .map(([key, label]) => label);
                const emailSubject = encodeURIComponent("Contract Details");
                const emailBody = encodeURIComponent(
                  `Number of placements: ${contractProps.n}
Expected average salary: ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(contractProps.s)}
Placement fee: ${contractProps.f * (1 - discountPercentage)}%
Expected contract cost: ${new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(cost || 0)}
${options.length > 0 ? "\nOptions:\n- " + options.join("\n- ") + "\n" : ""}
Link: ${window.location.origin}?${queryString}`
                );
                const shareLink = `mailto:gabriel@silver.dev?subject=${emailSubject}&body=${emailBody}`;
                setShareLink(shareLink);
              }}
            >
              <Link target="_blank" href={shareLink}>
                Share with Gabriel
              </Link>
            </Button>
          </div>
          <div className="flex flex-col flex-grow">
            <div className="flex gap-1.5 mb-12">
              <Card className="w-1/2 text-center">
                <CardHeader className="h-full">
                  <CardTitle className="text-3xl sm:text-6xl my-auto font-serif">
                    <NumberFlow prefix="$" value={cost || 0} />
                  </CardTitle>
                  <CardDescription>Expected contract cost</CardDescription>
                </CardHeader>
              </Card>
              <Card className="w-1/2 text-center">
                <CardHeader className="h-full">
                  <CardTitle className="text-3xl sm:text-6xl my-auto font-serif">
                    <NumberFlow
                      suffix="%"
                      value={contractProps.f * (1 - discountPercentage)}
                    />
                  </CardTitle>
                  <CardDescription>Placement fee</CardDescription>
                </CardHeader>
              </Card>
            </div>
            <ChartContainer
              config={{
                fee: {
                  label: "Fee",
                },
                payroll: {
                  label: "Payroll",
                },
              }}
              className="w-full min-h-80"
            >
              <BarChart accessibilityLayer data={chartData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="payroll" fill="#fa4529" stackId={1} />
                <Bar dataKey="fee" fill="white" stackId={1} />
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
      </main>
    </div>
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
            "flex-grow flex items-center justify-center gap-2 p-1 border rounded-lg cursor-pointer hover:bg-primary/10 transition-all",
            currentValue === value ? "border-primary" : "border-border"
          )}
          onClick={() => onValueChange(value)}
        >
          <RadioGroupItem
            className="hidden"
            value={value}
            id={`${name}-${value}`}
          />
          <Label htmlFor={`${name}-${value}`} className="cursor-pointer">
            {label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
