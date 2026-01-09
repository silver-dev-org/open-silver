"use client";

import { useAnimatedDialog } from "@/components/animated-dialog";
import { Spacer, spacing } from "@/components/spacer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { COLORS_BY_SCENARIO, MAX_SALARY } from "../constants";
import type { Breakdown, Params, SalaryModel, Scenario } from "../types";
import { getYearlyBreakdowns, parseParams, saveParams } from "../utils";
import { BreakdownCard } from "./breakdown-card";
import { BreakdownModal } from "./breakdown-modal";
import { ParamsDialog } from "./params-dialog";
import { SalarySlider } from "./salary-slider";
import { YearlyCompensationChart } from "./yearly-compensation-chart";
import posthog from "posthog-js";

export function SalaryCalculator() {
  const searchParams = useSearchParams();
  const [isUpdatingParams, setIsUpdatingParams] = useState(false);
  const [params, setParams] = useState<Params>(() => parseParams(searchParams));
  const [breakdownProps, setBreakdownProps] = useState<{
    scenario: Scenario;
    year: number;
  }>();
  const yearlyBreakdowns = getYearlyBreakdowns(params);
  const dialog = useAnimatedDialog();
  const buttonRefs = useRef<Record<Scenario, HTMLButtonElement | null>>({
    "eor-employer": null,
    "eor-worker": null,
    "aor-employer": null,
    "aor-worker": null,
  });
  const sharedSectionProps = {
    salary: params.salary,
    setSalary,
    buttonRefs,
    yearlyBreakdowns,
    yDomain: [
      0,
      Math.max(
        MAX_SALARY * 2,
        ...yearlyBreakdowns.flatMap((breakdowns) => [
          breakdowns["eor-employer"].total,
          breakdowns["eor-worker"].total,
          breakdowns["aor-employer"].total,
          breakdowns["aor-worker"].total,
        ]),
      ),
    ],
    onViewBreakdown(year, scenario: Scenario) {
      const button = buttonRefs.current[scenario];
      dialog.open(button);
      setBreakdownProps({ scenario, year });

      posthog.capture("salary_breakdown_viewed", {
        scenario,
        year,
        salary: params.salary,
      });
    },
  } as SalaryModelSectionProps;

  useEffect(() => {
    if (isUpdatingParams) return;
    setIsUpdatingParams(true);
    setTimeout(() => {
      saveParams(params);
      setIsUpdatingParams(false);
    }, 1000);
  }, [params, searchParams]);

  function handleNavigate(year: number, scenario: Scenario) {
    const button = buttonRefs.current[scenario];
    dialog.updateOrigin(button);
    setBreakdownProps({ scenario, year });
  }

  function setSalary(salary: number) {
    setParams({ ...params, salary });
  }

  return (
    <>
      <div className="mx-auto flex flex-col items-center">
        <div className="hidden md:block">
          <Card className="min-w-md">
            <CardHeader className="relative">
              <SalarySlider value={params.salary} onChange={setSalary} />
            </CardHeader>
          </Card>
          <Spacer />
        </div>
        <ParamsDialog params={params} setParams={setParams} />
      </div>
      <Spacer size="lg" />
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 relative",
          spacing.lg.gap,
        )}
      >
        <SalaryModelSection {...sharedSectionProps} salaryModel="eor" />
        <SalaryModelSection {...sharedSectionProps} salaryModel="aor" />
      </div>
      <BreakdownModal
        yearlyBreakdowns={yearlyBreakdowns}
        onNavigate={handleNavigate}
        originRect={dialog.originRect}
        {...breakdownProps}
        {...dialog.dialogProps}
      />
    </>
  );
}

interface SalaryModelSectionProps {
  salaryModel: SalaryModel;
  salary: number;
  setSalary: (value: number) => void;
  onViewBreakdown: (year: number, scenario: Scenario) => void;
  buttonRefs: React.RefObject<Record<Scenario, HTMLButtonElement | null>>;
  yDomain?: [number, number];
  yearlyBreakdowns: Record<Scenario, Breakdown>[];
}

function SalaryModelSection({
  salaryModel,
  salary,
  setSalary,
  onViewBreakdown,
  buttonRefs,
  yDomain,
  yearlyBreakdowns,
}: SalaryModelSectionProps) {
  const heading =
    salaryModel === "eor" ? "Employer of Record (EOR)" : "Contractor";
  const firstYearBreakdowns = Object.entries(yearlyBreakdowns[0]).filter(
    ([key]) => key.startsWith(salaryModel),
  );
  return (
    <div className={cn("flex flex-col", spacing.sm.gap)}>
      <Card className="md:hidden">
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
        </CardHeader>
        <CardContent>
          <SalarySlider value={salary} onChange={setSalary} />
        </CardContent>
      </Card>
      {yearlyBreakdowns && yearlyBreakdowns.length > 1 ? (
        <YearlyCompensationChart
          salaryModel={salaryModel}
          heading={heading}
          yearlyBreakdowns={yearlyBreakdowns}
          salary={salary}
          yDomain={yDomain}
          onBarClick={onViewBreakdown}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <h3 className="text-2xl font-semibold text-center">{heading}</h3>
          </div>
          <div
            className={cn(
              "flex flex-col md:flex-row size-full",
              spacing.sm.gap,
            )}
          >
            {firstYearBreakdowns.map(([scenario, breakdown]) => {
              return (
                <BreakdownCard
                  key={scenario}
                  breakdown={breakdown}
                  onView={() => onViewBreakdown(0, scenario as Scenario)}
                  buttonRef={(el) => {
                    buttonRefs.current[scenario as Scenario] = el;
                  }}
                  color={COLORS_BY_SCENARIO[scenario as Scenario]}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
