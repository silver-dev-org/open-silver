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
import Link from "next/link";
import type React from "react";
import { Fragment, HTMLAttributes, useState } from "react";

type SalaryModel = "aor" | "eor";

type Persona = "worker" | "employer";

type Scenario = `${SalaryModel}-${Persona}`;

type Breakdown = {
  scenario: Scenario;
  sources: string[];
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

const MIN_SALARY = 50000;
const MAX_SALARY = 150000;
const DEFAULT_SALARY = 100000;
const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  currency: "USD",
  currencyDisplay: "symbol",
  style: "currency",
  currencySign: "accounting",
};
const ARS_USD = 1415;
const MAX_TAXABLE_GROSS = (3505701.35 / ARS_USD) * 13;
const FEES = {
  eor: {
    employer: {
      sources: [
        "https://www.argentina.gob.ar/trabajo/buscastrabajo/conocetusderechos/salario",
        "https://www.srt.gob.ar/estadisticas/cf_boletin_art.php",
      ],
      pension: 16,
      socialServices: 2, // PAMI
      health: 6,
      employmentFund: 1.5,
      lifeInsurance: 0.3,
      accidentInsurance: 2, // Estimación ART
    },
    worker: {
      sources: [
        "https://www.argentina.gob.ar/trabajo/buscastrabajo/conocetusderechos/salario",
        "https://www.boletinoficial.gob.ar/detalleAviso/primera/330620/20250901",
        "https://servicioscf.afip.gob.ar/publico/abc/ABCpaso2.aspx?cat=743",
      ],
      pension: 11,
      health: 3,
      socialServices: 3, // PAMI
      incomeTax: {
        // Estimates in USD averaging married & single deductions
        // Based on Nov 2025 data
        50000: 13.5,
        55000: 15,
        60000: 16,
        65000: 17.5,
        70000: 19,
        75000: 20,
        80000: 21.5,
        85000: 23,
        90000: 24,
        95000: 24.5,
        100000: 26,
        105000: 27,
        110000: 27.5,
        115000: 28.5,
        120000: 29,
        125000: 29.5,
        130000: 29.5,
        135000: 30,
        140000: 31,
        145000: 31.5,
        150000: 31.5,
      },
    },
  },
  aor: {
    employer: {
      sources: ["https://silver.dev/aor#pricing"],
      aorMonthlyFee: 300,
    },
    worker: {
      sources: ["https://www.afip.gob.ar/monotributo/categorias.asp"],
      taxes: 15, // Monotributo estimado
    },
  },
} satisfies Record<SalaryModel, Record<Persona, Record<string, any>>>;

function getBreakdowns(salary: number): Record<Scenario, Breakdown> {
  const roundedSalary = Math.round(salary / 5000) * 5000;
  const clampedSalary = Math.max(
    MIN_SALARY,
    Math.min(MAX_SALARY, roundedSalary),
  );
  const incomeTaxRate =
    roundedSalary < MIN_SALARY
      ? 0
      : roundedSalary > MAX_SALARY
        ? 35
        : FEES.eor.worker.incomeTax[
            clampedSalary as keyof typeof FEES.eor.worker.incomeTax
          ];
  const thirteenthSalary = salary / 12;
  const totalGross = salary + thirteenthSalary;
  const taxableGrossEmployee = Math.min(MAX_TAXABLE_GROSS, totalGross);

  const pensionEmployer = totalGross * (FEES.eor.employer.pension / 100);
  const socialServicesEmployer =
    totalGross * (FEES.eor.employer.socialServices / 100);
  const employmentFund = totalGross * (FEES.eor.employer.employmentFund / 100);
  const health = totalGross * (FEES.eor.employer.health / 100);
  const lifeInsurance = totalGross * (FEES.eor.employer.lifeInsurance / 100);
  const accidentInsurance =
    totalGross * (FEES.eor.employer.accidentInsurance / 100);

  const totalEmployerCost =
    totalGross +
    pensionEmployer +
    socialServicesEmployer +
    health +
    employmentFund +
    lifeInsurance +
    accidentInsurance;

  const pensionWorker = taxableGrossEmployee * (FEES.eor.worker.pension / 100);
  const socialServicesWorker =
    taxableGrossEmployee * (FEES.eor.worker.socialServices / 100);
  const healthWorker = taxableGrossEmployee * (FEES.eor.worker.health / 100);
  const incomeTax = totalGross * (incomeTaxRate / 100);

  const totalWorkerNet =
    totalGross -
    pensionWorker -
    healthWorker -
    socialServicesWorker -
    incomeTax;

  return {
    "eor-employer": {
      scenario: "eor-employer",
      title: "Employer pays",
      description: "EOR total employer cost including all contributions.",
      sources: FEES.eor.employer.sources,
      base: salary,
      items: [
        {
          label: "Gross 13th Salary",
          value: thirteenthSalary,
        },
        {
          label: `Pension (+${FEES.eor.employer.pension}%)`,
          value: pensionEmployer,
        },
        {
          label: `Social Services (+${FEES.eor.employer.socialServices}%)`,
          value: socialServicesEmployer,
        },
        {
          label: `Health (+${FEES.eor.employer.health}%)`,
          value: health,
        },
        {
          label: `Employment Fund (+${FEES.eor.employer.employmentFund}%)`,
          value: employmentFund,
        },
        {
          label: `Life Insurance (+${FEES.eor.employer.lifeInsurance}%)`,
          value: lifeInsurance,
        },
        {
          label: `Accident Insurance (+${FEES.eor.employer.accidentInsurance}%)`,
          value: accidentInsurance,
        },
      ],
      total: totalEmployerCost,
    },
    "eor-worker": {
      scenario: "eor-worker",
      title: "Employee gets",
      sources: FEES.eor.worker.sources,
      description: "EOR worker net salary after all deductions",
      base: salary,
      items: [
        {
          label: "Gross 13th Salary",
          value: thirteenthSalary,
        },
        {
          label: `Pension (-${FEES.eor.worker.pension}%*)`,
          value: -pensionWorker,
        },
        {
          label: `Health (-${FEES.eor.worker.health}%*)`,
          value: -healthWorker,
        },
        {
          label: `Social Services (-${FEES.eor.worker.socialServices}%*)`,
          value: -socialServicesWorker,
        },
        {
          label: `Income Tax (-${incomeTaxRate}%)`,
          value: -incomeTax,
        },
      ],
      total: totalWorkerNet,
    },
    "aor-employer": {
      scenario: "aor-employer",
      title: "Employer pays",
      description: "AOR total employer cost including monthly fee",
      sources: FEES.aor.employer.sources,
      base: salary,
      items: [
        {
          label: "Silver.dev AOR Fee (+$300/mo)",
          value: FEES.aor.employer.aorMonthlyFee * 12,
        },
      ],
      total: salary + FEES.aor.employer.aorMonthlyFee * 12,
    },
    "aor-worker": {
      scenario: "aor-worker",
      title: "Contractor gets",
      description: "AOR worker net income after taxes",
      sources: FEES.aor.worker.sources,
      base: salary,
      items: [
        {
          label: `Simplified taxes regime (-${FEES.aor.worker.taxes}%)`,
          value: salary * -(FEES.aor.worker.taxes / 100),
        },
      ],
      total: salary * (1 - FEES.aor.worker.taxes / 100),
    },
  };
}

function getBreakdown(scenario: Scenario, salary: number) {
  return getBreakdowns(salary)[scenario];
}

export function SalaryCalculator() {
  const [salary, setSalary] = useState(DEFAULT_SALARY);
  const [activeModal, setActiveModal] = useState<Scenario | null>(null);
  const breakdowns = getBreakdowns(salary);
  return (
    <>
      <div className="hidden md:block max-w-md mx-auto">
        <Card>
          <CardHeader>
            <SalarySlider
              value={salary}
              onChange={setSalary}
              min={MIN_SALARY}
              max={MAX_SALARY}
              step={1000}
            />
          </CardHeader>
        </Card>
      </div>
      <Spacer size="lg" />
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 relative",
          spaceSizes.lg.gap,
        )}
      >
        <SalaryModelSection
          heading="Employer of Record (EOR)"
          salary={salary}
          setSalary={setSalary}
          breakdowns={[breakdowns["eor-employer"], breakdowns["eor-worker"]]}
          onViewBreakdown={setActiveModal}
        />
        <SalaryModelSection
          heading="Contractor"
          salary={salary}
          setSalary={setSalary}
          breakdowns={[breakdowns["aor-employer"], breakdowns["aor-worker"]]}
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
      <Card className="md:hidden">
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
      <div className="hidden md:block">
        <h3 className="text-2xl font-semibold text-center">{heading}</h3>
      </div>
      <div
        className={cn("flex flex-col md:flex-row size-full", spaceSizes.sm.gap)}
      >
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
          <DialogDescription>
            {breakdown.description}
            {scenario === "eor-worker" && (
              <>
                <br />
                (*) Capped at max. taxable gross of{" "}
                {Math.round(MAX_TAXABLE_GROSS).toLocaleString(
                  "en-US",
                  CURRENCY_FORMAT,
                )}
              </>
            )}
            <br />
            Sources:{" "}
            {breakdown.sources.map((source, i) => (
              <Fragment key={i}>
                <Link className="link" target="_blank" href={source}>
                  {new URL(source).host.replace("www.", "")}
                </Link>
                {i < breakdown.sources.length - 1 && ", "}
              </Fragment>
            ))}
          </DialogDescription>
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

function BreakdownItem({
  label,
  value,
  className,
  ...props
}: BreakdownItem & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-between text-sm", className)} {...props}>
      <span>{label}</span>
      <span>{value.toLocaleString("en-US", CURRENCY_FORMAT)}</span>
    </div>
  );
}
