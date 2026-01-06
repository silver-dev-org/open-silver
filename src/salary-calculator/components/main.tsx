"use client";

import { useAnimatedDialog } from "@/components/animated-dialog";
import { Spacer, spacing } from "@/components/spacer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { MAX_SALARY } from "../constants";
import type {
  Breakdown,
  Params,
  SalaryModel,
  Scenario,
  YearlyData,
} from "../types";
import {
  calculateYearlyBreakdown,
  getBreakdowns,
  parseParams,
  saveParams,
} from "../utils";
import { BreakdownCard } from "./breakdown-card";
import { BreakdownModal } from "./breakdown-modal";
import { ParamsDialog } from "./params-dialog";
import { SalarySlider } from "./salary-slider";
import { YearlyCompensationChart } from "./yearly-compensation-chart";

export function SalaryCalculator() {
  const searchParams = useSearchParams();
  const [isUpdatingParams, setIsUpdatingParams] = useState(false);
  const [params, setParams] = useState<Params>(() => parseParams(searchParams));
  const [activeModal, setActiveModal] = useState<Scenario | null>(null);
  const breakdowns = getBreakdowns(params);
  const yearlyData = calculateYearlyBreakdown(params);
  const hasRSUData = yearlyData.length > 0;
  const sharedYDomain: [number, number] | undefined = hasRSUData
    ? [
        0,
        Math.max(
          MAX_SALARY * 2,
          ...yearlyData.flatMap((d) => [
            d.eor.employer,
            d.eor.worker,
            d.aor.employer,
            d.aor.worker,
          ]),
        ),
      ]
    : undefined;

  const dialog = useAnimatedDialog();
  const buttonRefs = useRef<Record<Scenario, HTMLButtonElement | null>>({
    "eor-employer": null,
    "eor-worker": null,
    "aor-employer": null,
    "aor-worker": null,
  });

  useEffect(() => {
    if (isUpdatingParams) return;
    setIsUpdatingParams(true);
    setTimeout(() => {
      saveParams(params);
      setIsUpdatingParams(false);
    }, 1000);
  }, [params, searchParams]);

  function handleOpenModal(scenario: Scenario) {
    const button = buttonRefs.current[scenario];
    dialog.open(button);
    setActiveModal(scenario);
  }

  function handleNavigate(scenario: Scenario) {
    const button = buttonRefs.current[scenario];
    dialog.updateOrigin(button);
    setActiveModal(scenario);
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
        <SalaryModelSection
          salaryModel="eor"
          salary={params.salary}
          setSalary={setSalary}
          breakdowns={[breakdowns["eor-employer"], breakdowns["eor-worker"]]}
          onViewBreakdown={handleOpenModal}
          buttonRefs={buttonRefs}
          yearlyData={hasRSUData ? yearlyData : undefined}
          yDomain={sharedYDomain}
        />
        <SalaryModelSection
          salaryModel="aor"
          salary={params.salary}
          setSalary={setSalary}
          breakdowns={[breakdowns["aor-employer"], breakdowns["aor-worker"]]}
          onViewBreakdown={handleOpenModal}
          buttonRefs={buttonRefs}
          yearlyData={hasRSUData ? yearlyData : undefined}
          yDomain={sharedYDomain}
        />
      </div>
      <BreakdownModal
        scenario={activeModal}
        params={params}
        onNavigate={handleNavigate}
        originRect={dialog.originRect}
        {...dialog.dialogProps}
      />
    </>
  );
}

function SalaryModelSection({
  salaryModel,
  salary,
  setSalary,
  breakdowns,
  onViewBreakdown,
  buttonRefs,
  yearlyData,
  yDomain,
}: {
  salaryModel: SalaryModel;
  salary: number;
  setSalary: (value: number) => void;
  breakdowns: Breakdown[];
  onViewBreakdown: (scenario: Scenario) => void;
  buttonRefs: React.RefObject<Record<Scenario, HTMLButtonElement | null>>;
  yearlyData?: YearlyData[];
  yDomain?: [number, number];
}) {
  const heading =
    salaryModel === "eor" ? "Employer of Record (EOR)" : "Contractor";
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
      {yearlyData && yearlyData.length > 0 ? (
        <YearlyCompensationChart
          salaryModel={salaryModel}
          heading={heading}
          data={yearlyData}
          salary={salary}
          yDomain={yDomain}
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
            {breakdowns.map((breakdown) => (
              <BreakdownCard
                key={breakdown.scenario}
                breakdown={breakdown}
                onView={() => onViewBreakdown(breakdown.scenario)}
                buttonRef={(el) => {
                  buttonRefs.current[breakdown.scenario] = el;
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
