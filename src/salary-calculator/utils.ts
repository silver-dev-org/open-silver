import {
  ARRAY_ITEM_SEP,
  ARRAY_SEP,
  DEFAULT_PARAMS,
  FEES,
  MAX_SALARY,
  MAX_TAXABLE_GROSS,
  MIN_SALARY,
  SHORTENED_PARAM_KEYS,
} from "./constants";
import type { Breakdown, Params, Scenario, YearlyData } from "./types";

export function getBreakdowns({
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
          label: `Simplified Tax Regime (-${contractorTaxRate}%)`,
          value: salary * -(contractorTaxRate / 100),
        },
      ],
      total: salary * (1 - contractorTaxRate / 100),
    },
  };
}

export function getBreakdown(scenario: Scenario, params: Params) {
  return getBreakdowns(params)[scenario];
}

export function calculateYearlyBreakdown(params: Params): YearlyData[] {
  const { shareFMV, growthRate, grantedRSUs } = params;
  if (!shareFMV || !growthRate || !grantedRSUs) {
    return [];
  }

  const maxYear = Math.max(
    ...grantedRSUs.map(([_, vesting], idx) => idx + vesting + 1),
  );
  const yearlyData: YearlyData[] = [];

  for (let year = 0; year < Math.ceil(maxYear); year++) {
    const breakdowns = getBreakdowns(params);

    let rsuValueThisYear = 0;
    grantedRSUs.forEach(([amount, vestingPeriod], grantYear) => {
      if (year >= grantYear && year < grantYear + vestingPeriod) {
        const annualVest = amount / vestingPeriod;
        const yearsSinceGrant = year - grantYear;
        const fmvAtVesting =
          shareFMV * Math.pow(1 + growthRate / 100, yearsSinceGrant);
        if (vestingPeriod && !yearsSinceGrant) return;
        rsuValueThisYear += annualVest * fmvAtVesting;
      }
    });

    yearlyData.push({
      year,
      aor: {
        employer: breakdowns["aor-employer"].total + rsuValueThisYear,
        worker: breakdowns["aor-worker"].total + rsuValueThisYear,
      },
      eor: {
        employer: breakdowns["eor-employer"].total + rsuValueThisYear,
        worker: breakdowns["eor-worker"].total + rsuValueThisYear,
      },
    });
  }

  return yearlyData;
}

export function parseParams(searchParams?: URLSearchParams | null) {
  const params = DEFAULT_PARAMS;
  for (const key of Object.keys(params)) {
    const shortenedKey = SHORTENED_PARAM_KEYS[key as keyof Params];
    const strValue = searchParams?.get(shortenedKey);
    if (strValue) {
      if (key === "grantedRSUs") {
        params.grantedRSUs = strValue
          .split(ARRAY_SEP)
          .map(
            (item) =>
              item.split(ARRAY_ITEM_SEP).map(Number) as [number, number],
          );
      } else {
        (params[key as keyof Params] as number) = parseFloat(strValue);
      }
    }
  }
  return params;
}

export function saveParams(params: Params) {
  const newSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    const shortenedKey = SHORTENED_PARAM_KEYS[key as keyof Params];
    let strValue;
    if (key === "grantedRSUs") {
      strValue = (value as [number, number][])
        .map(([amount, years]) => `${amount}${ARRAY_ITEM_SEP}${years}`)
        .join(ARRAY_SEP);
    } else {
      strValue = value.toString();
    }
    newSearchParams.set(shortenedKey, strValue);
  }
  window.history.pushState(null, "", `?${newSearchParams.toString()}`);
}
