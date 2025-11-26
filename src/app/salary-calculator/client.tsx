"use client";

import Spacer, { spaceSizes } from "@/components/spacer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type React from "react";
import { HTMLAttributes, useState } from "react";

const MIN_SALARY = 50000;
const MAX_SALARY = 150000;
const DEFAULT_SALARY = 100000;

type SalaryModel = "aor" | "eor";

type Persona = "worker" | "employer";

type Scenario = `${SalaryModel}-${Persona}`;

type Breakdown = {
  scenario: Scenario;
  title: string;
  description?: string;
  base: number;
  items: BreakdownItem[];
  total: number;
};

type BreakdownItem = {
  label: string;
  value: number;
};

export function SalaryCalculator() {
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [activeModal, setActiveModal] = useState<Scenario | null>(null);

  // EOR Calculations
  const eorStandardFee = 6000;
  const eorEmployerTaxRate = 0.26; // 12% + 6% + 6% + 2%
  const eorEmployerTaxes = salary * eorEmployerTaxRate;
  const eorTotalEmployerCost = salary + eorEmployerTaxes + eorStandardFee;

  // Employee deductions (17% total social security + income tax)
  const employeeSocialSecurity = salary * 0.17;
  const remainingAfterSS = salary - employeeSocialSecurity;

  // Progressive income tax for Argentina (simplified for this salary range)
  // Assuming ~12% effective rate for this income range after deductions and exemptions
  const incomeUnderTax = remainingAfterSS;
  const incomeMultiplier = salary / 75000; // normalize to base income
  const effectiveIncomeTaxRate = Math.max(
    0.05,
    Math.min(0.15, 0.12 * incomeMultiplier),
  );
  const incomeLevy = incomeUnderTax * effectiveIncomeTaxRate;
  const eorEmployeeTakeHome = remainingAfterSS - incomeLevy;

  // AOR Calculations (Contractor)
  const aorPlatformFee = 300 * 12;
  const aorContractorTaxRate = 0.15; // Monotributo simplified estimate for this income range
  const aorContractorTaxes = salary * aorContractorTaxRate;
  const aorTotalCompanyCost = salary + aorPlatformFee;
  const aorContractorTakeHome = salary - aorContractorTaxes;

  // Differences EOR vs AOR
  const employerCostDifference = eorTotalEmployerCost - aorTotalCompanyCost;
  const employeeTakeHomeDifference =
    eorEmployeeTakeHome - aorContractorTakeHome;

  const breakdowns: Breakdown[] = [
    {
      scenario: "eor-employer",
      title: "Employer pays",
      base: salary,
      total: eorTotalEmployerCost,
      items: [
        {
          label: "Taxes & Benefits",
          value: eorEmployerTaxes,
        },
        {
          label: "EOR Standard Fee",
          value: eorStandardFee,
        },
      ],
    },
    {
      scenario: "eor-worker",
      title: "Employee gets",
      base: salary,
      total: eorEmployeeTakeHome,
      items: [
        {
          label: "Social Security (17%)",
          value: -employeeSocialSecurity,
        },
        { label: "Income Tax", value: -incomeLevy },
      ],
    },
    {
      scenario: "aor-employer",
      title: "Employer pays",
      base: salary,
      total: aorTotalCompanyCost,
      items: [
        {
          label: "AOR Platform Fee",
          value: aorPlatformFee,
        },
      ],
    },
    {
      scenario: "aor-worker",
      title: "Contractor gets",
      base: salary,
      total: aorContractorTakeHome,
      items: [
        {
          label: "Contractor Taxes (18%)",
          value: -aorContractorTaxes,
        },
      ],
    },
  ];

  return (
    <>
      <div className={cn("grid grid-cols-2 relative", spaceSizes.lg.gap)}>
        <SalaryModelSection
          heading="Employer of Record (EOR)"
          salary={salary}
          setSalary={setSalary}
          breakdowns={breakdowns.filter((b) => b.scenario.startsWith("eor"))}
          onViewBreakdown={setActiveModal}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground transform -translate-x-1/2" />
        <SalaryModelSection
          heading="Agency of Record (AOR)"
          salary={salary}
          setSalary={setSalary}
          breakdowns={breakdowns.filter((s) => s.scenario.startsWith("aor"))}
          onViewBreakdown={setActiveModal}
        />
      </div>
      <BreakdownModal
        scenario={activeModal}
        salary={salary}
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}

function SalarySlider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  function handleSliderChange(newValue: number[]) {
    onChange(newValue[0]);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleanValue = e.target.value.replace(/\D/g, "");
    if (cleanValue.length <= 7) {
      const newValue = Number.parseInt(cleanValue, 10) || 0;
      onChange(newValue);
    }
  }

  return (
    <div className="space-y-6 text-nowrap">
      <div>
        <label className="text-sm font-medium">Annual Salary</label>
        <div className="flex items-baseline gap-1 mt-3">
          <span className="text-4xl font-bold">$</span>
          <input
            type="text"
            value={value.toLocaleString("en-US")}
            onChange={handleInputChange}
            className="text-4xl font-bold bg-transparent border-b border-input pb-1 focus:outline-none focus:ring-0 focus:border-primary"
            style={{ width: `${7 * 0.6 + 1}em` }}
          />
        </div>
      </div>

      <Slider
        value={[value]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${(min / 1000).toFixed(0)}k</span>
        <span>${(max / 1000).toFixed(0)}k</span>
      </div>
    </div>
  );
}

function SalaryModelSection({
  heading,
  salary,
  setSalary,
  breakdowns,
  onViewBreakdown,
}: {
  heading: string;
  salary: number;
  setSalary: (value: number) => void;
  breakdowns: Breakdown[];
  onViewBreakdown: (scenario: Scenario) => void;
}) {
  return (
    <div className={cn("flex flex-col", spaceSizes.sm.gap)}>
      <Card>
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <SalarySlider
            value={salary}
            onChange={setSalary}
            min={MIN_SALARY}
            max={MAX_SALARY}
            step={1000}
          />
        </CardContent>
      </Card>
      <div className={cn("flex flex-row size-full", spaceSizes.sm.gap)}>
        {breakdowns.map((breakdown) => (
          <BreakdownCard
            key={breakdown.scenario}
            breakdown={breakdown}
            onView={() => onViewBreakdown(breakdown.scenario)}
          />
        ))}
      </div>
    </div>
  );
}

function BreakdownCard({
  breakdown,
  onView,
}: {
  breakdown: Breakdown;
  onView: () => void;
}) {
  return (
    <Card className="flex flex-col size-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl text-center">
          {breakdown.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <div>
          <div className="flex items-baseline gap-2 justify-center">
            <div className="text-3xl font-bold text-primary">
              $
              {breakdown.total.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4 flex-1">
          {breakdown.items.map((item, idx) => (
            <BreakdownItem key={idx} {...item} />
          ))}
        </div>
        <Button
          variant="outline"
          onClick={onView}
          className="w-full bg-transparent mt-auto"
        >
          View Breakdown
        </Button>
      </CardContent>
    </Card>
  );
}

function BreakdownModal({
  scenario,
  salary,
  isOpen,
  onClose,
}: {
  scenario: Scenario | null;
  salary: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!scenario) return null;
  const breakdown = getBreakdown(scenario, salary);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{breakdown.title}</DialogTitle>
          <DialogDescription>{breakdown.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <BreakdownItem label="Gross Salary" value={breakdown.base} />
          {breakdown.items.map((item, idx) => (
            <BreakdownItem key={idx} {...item} />
          ))}
          <BreakdownItem
            label={
              scenario.endsWith("worker") ? "Net Salary" : "Total Employer Cost"
            }
            value={breakdown.total}
            className="text-base font-semibold border-t border-foreground pt-4"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getBreakdown(scenario: Scenario, salary: number): Breakdown {
  switch (scenario) {
    case "eor-employer":
      const eorStandardFee = 6000;
      const eorEmployerTaxRate = 0.26;
      const eorEmployerTaxes = salary * eorEmployerTaxRate;
      const eorTotalCost = salary + eorEmployerTaxes + eorStandardFee;
      return {
        scenario: scenario,
        title: "EOR Employer Cost Breakdown",
        base: salary,
        items: [
          {
            label: "Pension Fund Contribution (12%)",
            value: salary * 0.12,
          },
          {
            label: "Social Security (6%)",
            value: salary * 0.06,
          },
          {
            label: "Health Insurance (6%)",
            value: salary * 0.06,
          },
          {
            label: "Work Risk Insurance (2%)",
            value: salary * 0.02,
          },
          {
            label: "EOR Standard Fee",
            value: eorStandardFee,
          },
        ],
        total: eorTotalCost,
        description:
          "The EOR employer cost includes all mandatory employer contributions and benefits required by Argentine law, plus the EOR provider fee. These contributions are calculated as a percentage of the employee salary and cover retirement, healthcare, and workplace safety.",
      };

    case "eor-worker":
      const employeeSocialSecurity = salary * 0.17;
      const remainingAfterSS = salary - employeeSocialSecurity;
      const effectiveIncomeTaxRate = 0.12;
      const incomeLevy = remainingAfterSS * effectiveIncomeTaxRate;
      const eorTakeHome = remainingAfterSS - incomeLevy;
      return {
        scenario: scenario,
        title: "EOR Employee Take-Home Breakdown",
        base: salary,
        items: [
          {
            label: "Pension Fund Deduction (11%)",
            value: -(salary * 0.11),
          },
          {
            label: "Healthcare Deduction (3%)",
            value: -(salary * 0.03),
          },
          {
            label: "Social Services Deduction (3%)",
            value: -(salary * 0.03),
          },
          {
            label: "Income Tax (~12%)",
            value: -incomeLevy,
          },
        ],
        total: eorTakeHome,
        description:
          "Employee deductions include mandatory social security contributions (17% total) which provide pension and healthcare benefits. Progressive income tax applies based on the income level. These deductions are standard in Argentina and provide important social protections.",
      };

    case "aor-employer":
      const aorPlatformFee = 300 * 12;
      const aorTotalCost = salary + aorPlatformFee;
      return {
        scenario: scenario,
        title: "AOR Employer Cost Breakdown",
        base: salary,
        items: [
          {
            label: "AOR Platform Fee (Silver.dev)",
            value: aorPlatformFee,
          },
        ],
        total: aorTotalCost,
        description:
          "When using an Agent of Record (AOR), the company pays a fixed contractor rate with a minimal platform fee. The contractor is responsible for their own taxes and compliance. This model provides more flexibility but shifts responsibility to the contractor.",
      };

    case "aor-worker":
      const aorContractorTaxRate = 0.18;
      const aorContractorTaxes = salary * aorContractorTaxRate;
      const aorTakeHome = salary - aorContractorTaxes;
      return {
        scenario: scenario,
        title: "AOR Contractor Take-Home Breakdown",
        base: salary,
        items: [
          {
            label: "Monotributo Taxes (~18%)",
            value: -aorContractorTaxes,
          },
        ],
        total: aorTakeHome,
        description:
          "Contractors in Argentina typically use the Monotributo simplified tax regime when their annual income is under 95 million ARS (~$74.5k USD). This combines income tax, VAT, and social security into a single monthly payment. For higher earners, progressive income tax rates from 5-35% apply.",
      };
  }
}

function BreakdownItem({
  label,
  value,
  className,
  ...props
}: BreakdownItem & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-between text-sm", className)} {...props}>
      <span className="text-muted-foreground">{label}</span>
      <span>
        {value.toLocaleString("en-US", {
          maximumFractionDigits: 0,
          currency: "USD",
          currencyDisplay: "symbol",
          style: "currency",
          currencySign: "accounting",
        })}
      </span>
    </div>
  );
}
