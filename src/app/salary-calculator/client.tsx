"use client";

import {
  AnimatedDialogContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  useAnimatedDialog,
} from "@/components/animated-dialog";
import { Spacer, spacing } from "@/components/spacer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { Fragment, HTMLAttributes, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

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

type Params = {
  salary: number;
  monthlyPrivateHealth: number;
  contractorTaxRate: number; // Monotributo
};

const MIN_SALARY = 50000;
const MAX_SALARY = 150000;
const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  currency: "USD",
  currencyDisplay: "symbol",
  style: "currency",
  currencySign: "accounting",
};
const ARS_USD = 1415;
const MAX_TAXABLE_GROSS = (3505701.35 / ARS_USD) * 13;
const SCENARIOS: Scenario[] = [
  "eor-employer",
  "eor-worker",
  "aor-employer",
  "aor-worker",
];
const DEFAULT_PARAMS: Params = {
  salary: 100000,
  monthlyPrivateHealth: 100,
  contractorTaxRate: 15,
};
const SHORTENED_PARAM_KEYS: Record<keyof Params, string> = {
  salary: "s",
  monthlyPrivateHealth: "h",
  contractorTaxRate: "c",
};
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
    },
  },
} satisfies Record<SalaryModel, Record<Persona, Record<string, any>>>;

function getBreakdowns({
  salary,
  monthlyPrivateHealth,
  contractorTaxRate,
}: Params): Record<Scenario, Breakdown> {
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

  const privateHealth = monthlyPrivateHealth * 12;
  const pensionEmployer = totalGross * (FEES.eor.employer.pension / 100);
  const socialServicesEmployer =
    totalGross * (FEES.eor.employer.socialServices / 100);
  const employmentFund = totalGross * (FEES.eor.employer.employmentFund / 100);
  const publicHealth = totalGross * (FEES.eor.employer.health / 100);
  const lifeInsurance = totalGross * (FEES.eor.employer.lifeInsurance / 100);
  const accidentInsurance =
    totalGross * (FEES.eor.employer.accidentInsurance / 100);

  const totalEmployerCost =
    totalGross +
    privateHealth +
    pensionEmployer +
    socialServicesEmployer +
    publicHealth +
    employmentFund +
    lifeInsurance +
    accidentInsurance;

  const pensionWorker = taxableGrossEmployee * (FEES.eor.worker.pension / 100);
  const socialServicesWorker =
    taxableGrossEmployee * (FEES.eor.worker.socialServices / 100);
  const healthWorker = taxableGrossEmployee * (FEES.eor.worker.health / 100);
  const incomeTax = totalGross * (incomeTaxRate / 100);

  const totalWorkerNet =
    totalGross +
    privateHealth -
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
          label: "Private Health Insurance",
          value: privateHealth,
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
          label: `Public Health Insurance (+${FEES.eor.employer.health}%)`,
          value: publicHealth,
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
          label: "Private Health Insurance (not cash)",
          value: privateHealth,
        },
        {
          label: `Pension (-${FEES.eor.worker.pension}%*)`,
          value: -pensionWorker,
        },
        {
          label: `Public Health Insurance (-${FEES.eor.worker.health}%*)`,
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
          label: `Simplified tax regime (-${contractorTaxRate}%)`,
          value: salary * -(contractorTaxRate / 100),
        },
      ],
      total: salary * (1 - contractorTaxRate / 100),
    },
  };
}

function getBreakdown(scenario: Scenario, params: Params) {
  return getBreakdowns(params)[scenario];
}

export function SalaryCalculator() {
  const searchParams = useSearchParams();
  const [isUpdatingParams, setIsUpdatingParams] = useState(false);
  const [params, setParams] = useState<Params>(() => {
    const params = DEFAULT_PARAMS;

    for (const key of Object.keys(params)) {
      const shortenedKey = SHORTENED_PARAM_KEYS[key as keyof Params];
      const strValue = searchParams?.get(shortenedKey);
      if (strValue) {
        params[key as keyof Params] = parseFloat(strValue);
      }
    }

    return params;
  });
  const [activeModal, setActiveModal] = useState<Scenario | null>(null);
  const breakdowns = getBreakdowns(params);
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
      const newSearchParams = new URLSearchParams(searchParams?.toString());
      for (const [key, value] of Object.entries(params)) {
        newSearchParams.set(
          SHORTENED_PARAM_KEYS[key as keyof Params],
          value.toString(),
        );
      }
      window.history.pushState(null, "", `?${newSearchParams.toString()}`);
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
              <SalarySlider
                value={params.salary}
                onChange={setSalary}
                min={MIN_SALARY}
                max={MAX_SALARY}
                step={1000}
              />
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
          heading="Employer of Record (EOR)"
          salary={params.salary}
          setSalary={setSalary}
          breakdowns={[breakdowns["eor-employer"], breakdowns["eor-worker"]]}
          onViewBreakdown={handleOpenModal}
          buttonRefs={buttonRefs}
        />
        <SalaryModelSection
          heading="Contractor"
          salary={params.salary}
          setSalary={setSalary}
          breakdowns={[breakdowns["aor-employer"], breakdowns["aor-worker"]]}
          onViewBreakdown={handleOpenModal}
          buttonRefs={buttonRefs}
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

function ParamsDialog({
  params,
  setParams,
}: {
  params: Params;
  setParams: (params: Params) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<Params>({
    defaultValues: params,
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  useEffect(() => {
    if (isOpen) {
      reset(params);
    }
  }, [isOpen, params, reset]);

  function onSubmit(data: Params) {
    setParams(data);
    setIsOpen(false);
  }

  function handleCancel() {
    reset(params);
    setIsOpen(false);
  }

  function handleReset() {
    reset(DEFAULT_PARAMS);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 />
          Edit additional parameters
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit additional parameters</DialogTitle>
            <DialogDescription>Money amounts are in USD.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-6 py-6">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="monthlyPrivateHealth"
                className="font-semibold flex flex-col"
              >
                <span className="md:text-base">
                  Monthly Private Health Contribution
                </span>
                <span className="text-xs text-muted-foreground">
                  Don&apos;t include the public health contribution here
                </span>
              </Label>
              <div className="flex items-center gap-1">
                <span>$</span>
                <Input
                  id="monthlyPrivateHealth"
                  type="number"
                  className="w-min"
                  min={0}
                  max={999999}
                  required
                  {...register("monthlyPrivateHealth", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Label
                htmlFor="contractorTaxRate"
                className="font-semibold flex flex-col"
              >
                <span className="md:text-base">Contractor Tax Rate</span>
                <span className="text-xs text-muted-foreground">
                  For the Simplified Tax Regime (Monotributo)
                </span>
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  id="contractorTaxRate"
                  type="number"
                  className="w-min"
                  min={0}
                  max={100}
                  step="0.01"
                  required
                  {...register("contractorTaxRate", {
                    valueAsNumber: true,
                  })}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col md:flex-row gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleReset}
              className="md:mr-auto order-last md:order-first"
            >
              Reset to defaults
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  buttonRefs,
}: {
  heading: string;
  salary: number;
  setSalary: (value: number) => void;
  breakdowns: Breakdown[];
  onViewBreakdown: (scenario: Scenario) => void;
  buttonRefs: React.RefObject<Record<Scenario, HTMLButtonElement | null>>;
}) {
  return (
    <div className={cn("flex flex-col", spacing.sm.gap)}>
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
        className={cn("flex flex-col md:flex-row size-full", spacing.sm.gap)}
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
    </div>
  );
}

function BreakdownCard({
  breakdown,
  onView,
  buttonRef,
}: {
  breakdown: Breakdown;
  onView: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
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
            <NumberFlow
              className="text-3xl font-bold text-primary"
              value={Math.round(breakdown.total)}
              prefix="$"
            />
          </div>
        </div>
        <Button
          ref={buttonRef}
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
  params,
  open,
  onOpenChange,
  onNavigate,
  originRect,
}: {
  scenario: Scenario | null;
  params: Params;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (scenario: Scenario) => void;
  originRect: DOMRect | null;
}) {
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [hasUsedArrowKeys, setHasUsedKeys] = useState(false);
  const currentIndex = scenario ? SCENARIOS.indexOf(scenario) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < SCENARIOS.length - 1;

  function handlePrevious() {
    if (hasPrevious) {
      setDirection("left");
      onNavigate(SCENARIOS[currentIndex - 1]);
    }
  }

  function handleNext() {
    if (hasNext) {
      setDirection("right");
      onNavigate(SCENARIOS[currentIndex + 1]);
    }
  }

  useEffect(() => {
    if (direction) {
      const timer = setTimeout(() => setDirection(null), 200);
      return () => clearTimeout(timer);
    }
  }, [direction, scenario]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowLeft" && hasPrevious) {
        handlePrevious();
        setHasUsedKeys(true);
      } else if (e.key === "ArrowRight" && hasNext) {
        handleNext();
        setHasUsedKeys(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasPrevious, hasNext, currentIndex]);

  if (!scenario) return null;

  const breakdown = getBreakdown(scenario, params);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <AnimatedDialogContent originRect={originRect}>
          <Tooltip
            delayDuration={0}
            open={hasUsedArrowKeys ? false : hasPrevious ? undefined : false}
          >
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                disabled={!hasPrevious}
                tabIndex={-1}
                className="absolute -left-16 top-1/2 -translate-y-1/2 hidden md:flex translate-none disabled:pointer-events-auto disabled:cursor-not-allowed"
                aria-label="Previous breakdown"
              >
                <ChevronLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="flex items-center gap-1">
                Try pressing <Kbd>←</Kbd>
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip
            delayDuration={0}
            open={hasUsedArrowKeys ? false : hasNext ? undefined : false}
          >
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={!hasNext}
                tabIndex={-1}
                className="absolute -right-16 top-1/2 -translate-y-1/2 hidden md:flex translate-none disabled:pointer-events-auto disabled:cursor-not-allowed"
                aria-label="Next breakdown"
              >
                <ChevronRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="flex items-center gap-1">
                Try pressing <Kbd>→</Kbd>
              </p>
            </TooltipContent>
          </Tooltip>
          <div
            key={scenario}
            className={cn(
              "animate-in duration-300",
              direction === "left" && "slide-in-from-left-4 fade-in-0",
              direction === "right" && "slide-in-from-right-4 fade-in-0",
              !direction && "fade-in",
            )}
          >
            <DialogHeader>
              <DialogTitle className="text-left">{breakdown.title}</DialogTitle>
              <DialogDescription className="text-left">
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
            <div className="flex flex-col gap-4 mt-4">
              <BreakdownItem label="Gross Salary" value={breakdown.base} />
              {breakdown.items.map((item, idx) => (
                <BreakdownItem key={idx} {...item} />
              ))}
              <BreakdownItem
                label={
                  scenario.endsWith("worker")
                    ? "Net Salary"
                    : "Total Employer Cost"
                }
                value={breakdown.total}
                className="text-base font-semibold border-t border-foreground pt-4"
              />
            </div>
          </div>
          <DialogFooter className="md:hidden flex-row items-center border-t pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground w-full text-center">
              {currentIndex + 1} / {SCENARIOS.length}
            </span>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={!hasNext}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight />
            </Button>
          </DialogFooter>
        </AnimatedDialogContent>
      </DialogPortal>
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
    <div className={cn("flex justify-between", className)} {...props}>
      <span>{label}</span>
      <span>{value.toLocaleString("en-US", CURRENCY_FORMAT)}</span>
    </div>
  );
}
