import {
  DEFAULT_PARAMS,
  FEES,
  MAX_SALARY,
  MAX_TAXABLE_GROSS,
  MIN_SALARY,
  SHORTENED_PARAM_KEYS,
} from "./constants";
import type { Params, Scenario, Breakdown } from "./types";

function getBreakdownsByScenario(params: Params): Record<Scenario, Breakdown> {
  const { salary, monthlyPrivateHealth, rsuTotalGrant, rsuVestingPeriod } =
    params;

  const thirteenthSalary = salary / 12;
  const annualRsuValue = rsuTotalGrant / rsuVestingPeriod;
  const salaryWithRSUs = salary + annualRsuValue;
  const totalGross = salaryWithRSUs + thirteenthSalary;
  const roundedTotalGross = Math.round(totalGross / 5000) * 5000;
  const clampedSalary = Math.max(
    MIN_SALARY,
    Math.min(MAX_SALARY, roundedTotalGross),
  );
  const incomeTaxRate =
    roundedTotalGross < MIN_SALARY
      ? 0
      : roundedTotalGross > MAX_SALARY
        ? 35
        : FEES.eor.worker.incomeTax[
            clampedSalary as keyof typeof FEES.eor.worker.incomeTax
          ];
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

  const rsuItem =
    annualRsuValue > 0
      ? [
          {
            label: `RSU Grant ($${rsuTotalGrant.toLocaleString()} / ${rsuVestingPeriod}yr)`,
            value: annualRsuValue,
          },
        ]
      : [];

  return {
    "eor-employer": {
      title: "Employer pays",
      description: "EOR total employer cost including all contributions.",
      sources: FEES.eor.employer.sources,
      base: salary,
      items: [
        {
          label: "Gross Salary",
          value: salary,
        },
        ...rsuItem,
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
      title: "Employee gets",
      sources: FEES.eor.worker.sources,
      description: "EOR worker net salary after all deductions",
      base: salary,
      items: [
        {
          label: "Gross Salary",
          value: salary,
        },
        ...rsuItem,
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
      title: "Employer pays",
      description: "AOR total employer cost including monthly fee",
      sources: FEES.aor.employer.sources,
      base: salary,
      items: [
        {
          label: "Gross Salary",
          value: salary,
        },
        ...rsuItem,
        {
          label: "Silver.dev AOR Fee (+$300/mo)",
          value: FEES.aor.employer.aorMonthlyFee * 12,
        },
      ],
      total: salaryWithRSUs + FEES.aor.employer.aorMonthlyFee * 12,
    },
    "aor-worker": {
      title: "Contractor gets",
      description: "AOR worker net income after taxes",
      sources: FEES.aor.worker.sources,
      base: salary,
      items: [
        {
          label: "Gross Salary",
          value: salary,
        },
        ...rsuItem,
        {
          label: "Simplified Tax Regime (-15%)",
          value: -salaryWithRSUs * 0.15,
        },
      ],
      total: salaryWithRSUs * 0.85,
    },
  };
}

export function getBreakdowns(params: Params): Record<Scenario, Breakdown> {
  return getBreakdownsByScenario(params);
}

export function parseParams(searchParams?: URLSearchParams | null): Params {
  const params = { ...DEFAULT_PARAMS };
  for (const key of Object.keys(params) as (keyof Params)[]) {
    const shortenedKey = SHORTENED_PARAM_KEYS[key];
    const strValue = searchParams?.get(shortenedKey);
    if (strValue) {
      if (key === "rsuVestingPeriod") {
        const parsed = parseInt(strValue);
        params.rsuVestingPeriod = parsed === 1 ? 1 : 4;
      } else {
        (params[key] as number) = parseFloat(strValue);
      }
    }
  }
  return params;
}

export function saveParams(params: Params) {
  const newSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const shortenedKey = SHORTENED_PARAM_KEYS[key as keyof Params];
    newSearchParams.set(shortenedKey, value.toString());
  }
  window.history.pushState(null, "", `?${newSearchParams.toString()}`);
}
