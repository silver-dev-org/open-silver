"use client";

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
import type React from "react";
import { useState } from "react";

const MIN_SALARY = 50000;
const MAX_SALARY = 150000;
const DEFAULT_SALARY = 100000;

type Item = {
  label: string;
  value: number;
  isInitial?: boolean;
  isResult?: boolean;
};

type Breakdown = {
  title: string;
  description: string;
  items: Item[];
};

type Scenario = {
  id: "eor-employer" | "eor-employee" | "aor-employer" | "aor-contractor";
  title: string;
  subtitle: string;
  total: number;
  items: Item[];
};

export function HiringCostsCalculator() {
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [activeModal, setActiveModal] = useState<Scenario["id"] | null>(null);

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

  const scenarios: Scenario[] = [
    {
      id: "eor-employer",
      title: "Employer pays",
      subtitle: "Company Cost",
      total: eorTotalEmployerCost,
      items: [
        { label: "Gross Salary", value: salary, isInitial: true },
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
      id: "eor-employee",
      title: "Employee gets",
      subtitle: "Annual Take-Home",
      total: eorEmployeeTakeHome,
      items: [
        { label: "Gross Salary", value: salary, isInitial: true },
        {
          label: "Social Security (17%)",
          value: -employeeSocialSecurity,
        },
        { label: "Income Tax", value: -incomeLevy },
      ],
    },
    {
      id: "aor-employer",
      title: "Employer pays",
      subtitle: "Company Cost",
      total: aorTotalCompanyCost,
      items: [
        { label: "Contractor Rate", value: salary, isInitial: true },
        {
          label: "AOR Platform Fee",
          value: aorPlatformFee,
        },
      ],
    },
    {
      id: "aor-contractor",
      title: "Contractor gets",
      subtitle: "Annual Take-Home",
      total: aorContractorTakeHome,
      items: [
        { label: "Gross Income", value: salary, isInitial: true },
        {
          label: "Contractor Taxes (18%)",
          value: -aorContractorTaxes,
        },
      ],
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-24 relative">
        <ScenarioSection
          heading="Employer of Record (EOR)"
          salary={salary}
          setSalary={setSalary}
          scenarios={scenarios.filter((s) => s.id.startsWith("eor"))}
          onViewBreakdown={setActiveModal}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground transform -translate-x-1/2" />
        <ScenarioSection
          heading="Agency of Record (AOR)"
          salary={salary}
          setSalary={setSalary}
          scenarios={scenarios.filter((s) => s.id.startsWith("aor"))}
          onViewBreakdown={setActiveModal}
        />
      </div>

      <Card className="mt-12 border-2">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-xl font-semibold">
              Employer saves{" "}
              <span className="text-green-600">
                $
                {Math.abs(employerCostDifference).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </span>{" "}
              with AOR compared to EOR
            </p>
          </div>
        </CardContent>
        <CardContent>
          <div className="text-center">
            <p className="text-xl font-semibold">
              Employee takes{" "}
              <span className="text-green-600">
                $
                {Math.abs(employeeTakeHomeDifference).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </span>{" "}
              more with AOR compared to EOR
            </p>
          </div>
        </CardContent>
      </Card>

      <BreakdownModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        scenarioId={activeModal}
        salary={salary}
      />
    </>
  );
}

function ScenarioSection({
  heading,
  salary,
  setSalary,
  scenarios,
  onViewBreakdown,
}: {
  heading: string;
  salary: number;
  setSalary: (value: number) => void;
  scenarios: Scenario[];
  onViewBreakdown: (scenarioId: Scenario["id"]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
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
      <div className="flex flex-row gap-6 size-full">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onViewBreakdown={() => onViewBreakdown(scenario.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SalarySlider({
  value,
  onChange,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
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

function ScenarioCard({
  scenario,
  onViewBreakdown,
}: {
  scenario: Scenario;
  onViewBreakdown: () => void;
}) {
  return (
    <Card className="flex flex-col size-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl text-center">{scenario.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <div>
          <div className="flex items-baseline gap-2 justify-center">
            <div className="text-3xl font-bold text-primary">
              $
              {scenario.total.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4 flex-1">
          {scenario.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span
                className={
                  item.isInitial || item.isResult ? "" : "text-red-500"
                }
              >
                {item.value < 0 ? "−" : ""}$
                {Math.abs(item.value).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={onViewBreakdown}
          className="w-full bg-transparent mt-auto"
        >
          View Breakdown
        </Button>
      </CardContent>
    </Card>
  );
}

function BreakdownModal({
  isOpen,
  onClose,
  scenarioId,
  salary,
}: {
  isOpen: boolean;
  onClose: () => void;
  scenarioId: Scenario["id"] | null;
  salary: number;
}) {
  const breakdown = getBreakdown(scenarioId, salary);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{breakdown.title}</DialogTitle>
          <DialogDescription>{breakdown.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {breakdown.items.map((item, idx) => (
            <div
              key={idx}
              className={`flex justify-between ${item.isResult ? "font-bold text-base border-t pt-4" : "text-sm"}`}
            >
              <span>{item.label}</span>
              <span
                className={
                  item.isInitial || item.isResult ? "" : "text-red-500"
                }
              >
                {item.value < 0 ? "−" : ""}$
                {Math.abs(item.value).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getBreakdown(
  scenarioId: Scenario["id"] | null,
  salary: number,
): Breakdown {
  switch (scenarioId) {
    case "eor-employer":
      const eorStandardFee = 6000;
      const eorEmployerTaxRate = 0.26;
      const eorEmployerTaxes = salary * eorEmployerTaxRate;
      const eorTotalCost = salary + eorEmployerTaxes + eorStandardFee;
      return {
        title: "EOR Employer Cost Breakdown",
        items: [
          { label: "Base Salary", value: salary, isInitial: true },
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
          { label: "Total Annual Cost", value: eorTotalCost, isResult: true },
        ],
        description:
          "The EOR employer cost includes all mandatory employer contributions and benefits required by Argentine law, plus the EOR provider fee. These contributions are calculated as a percentage of the employee salary and cover retirement, healthcare, and workplace safety.",
      };

    case "eor-employee":
      const employeeSocialSecurity = salary * 0.17;
      const remainingAfterSS = salary - employeeSocialSecurity;
      const effectiveIncomeTaxRate = 0.12;
      const incomeLevy = remainingAfterSS * effectiveIncomeTaxRate;
      const eorTakeHome = remainingAfterSS - incomeLevy;
      return {
        title: "EOR Employee Take-Home Breakdown",
        items: [
          { label: "Gross Salary", value: salary, isInitial: true },
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
          { label: "Annual Take-Home", value: eorTakeHome, isResult: true },
        ],
        description:
          "Employee deductions include mandatory social security contributions (17% total) which provide pension and healthcare benefits. Progressive income tax applies based on the income level. These deductions are standard in Argentina and provide important social protections.",
      };

    case "aor-employer":
      const aorPlatformFee = 300 * 12;
      const aorTotalCost = salary + aorPlatformFee;
      return {
        title: "AOR Employer Cost Breakdown",
        items: [
          {
            label: "Contractor Rate (Annual)",
            value: salary,
            isInitial: true,
          },
          {
            label: "AOR Platform Fee (Silver.dev)",
            value: aorPlatformFee,
          },
          { label: "Total Annual Cost", value: aorTotalCost, isResult: true },
        ],
        description:
          "When using an Agent of Record (AOR), the company pays a fixed contractor rate with a minimal platform fee. The contractor is responsible for their own taxes and compliance. This model provides more flexibility but shifts responsibility to the contractor.",
      };

    case "aor-contractor":
      const aorContractorTaxRate = 0.18;
      const aorContractorTaxes = salary * aorContractorTaxRate;
      const aorTakeHome = salary - aorContractorTaxes;
      return {
        title: "AOR Contractor Take-Home Breakdown",
        items: [
          { label: "Gross Income", value: salary, isInitial: true },
          {
            label: "Monotributo Taxes (~18%)",
            value: -aorContractorTaxes,
          },
          {
            label: "Annual Take-Home",
            value: aorTakeHome,
            isResult: true,
          },
        ],
        description:
          "Contractors in Argentina typically use the Monotributo simplified tax regime when their annual income is under 95 million ARS (~$74.5k USD). This combines income tax, VAT, and social security into a single monthly payment. For higher earners, progressive income tax rates from 5-35% apply.",
      };
    default:
      return {
        title: "No Scenario Selected",
        description: "Please select a scenario to view the breakdown.",
        items: [],
      };
  }
}
