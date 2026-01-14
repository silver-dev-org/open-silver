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
import type { Params, Scenario, Breakdown, RSUGrant } from "./types";

function getBreakdownsByScenario(
  params: Params,
  rsuValue: number = 0,
): Record<Scenario, Breakdown> {
  const {
    salary,
    monthlyPrivateHealth,
    contractorTaxRate,
    discretionaryBudget = 0,
  } = params;

  const thirteenthSalary = salary / 12;
  const salaryWithRSUs = salary + rsuValue;
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
  const discretionaryBudgetAnnual = discretionaryBudget * 12;
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
    discretionaryBudgetAnnual +
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
    privateHealth +
    discretionaryBudgetAnnual -
    pensionWorker -
    healthWorker -
    socialServicesWorker -
    incomeTax;

  const rsuItem =
    rsuValue > 0
      ? [
          {
            label: "Vested RSUs Value",
            value: rsuValue,
          },
        ]
      : [];

  const discretionaryBudgetItem =
    discretionaryBudgetAnnual > 0
      ? [
          {
            label: "Discretionary Budget (not cash)",
            value: discretionaryBudgetAnnual,
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
        ...discretionaryBudgetItem,
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
        ...discretionaryBudgetItem,
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
        ...discretionaryBudgetItem,
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
          label: `Simplified Tax Regime (-${contractorTaxRate}%)`,
          value: salaryWithRSUs * -(contractorTaxRate / 100),
        },
        ...discretionaryBudgetItem,
      ],
      total: salaryWithRSUs * (1 - contractorTaxRate / 100),
    },
  };
}

/**
 * Normalize RSU grants to unit-based format for calculation
 * Converts dollar-based grants to units using current FMV
 */
function normalizeRSUGrants(
  grants: RSUGrant[],
  shareFMV: number,
): [number, number][] {
  return grants
    .filter((grant) => {
      if (grant.mode === "units") {
        return grant.amount !== undefined && grant.vestingPeriod !== undefined;
      } else {
        return (
          grant.dollarValue !== undefined && grant.vestingPeriod !== undefined
        );
      }
    })
    .map((grant) => {
      if (grant.mode === "units") {
        return [grant.amount!, grant.vestingPeriod!];
      } else {
        const numberOfRSUs = grant.dollarValue! / shareFMV;
        return [numberOfRSUs, grant.vestingPeriod!];
      }
    });
}

export function getYearlyBreakdowns(
  params: Params,
): Record<Scenario, Breakdown>[] {
  const { shareFMV, growthRate, grantedRSUs } = params;

  if (
    shareFMV == null ||
    growthRate == null ||
    !grantedRSUs ||
    grantedRSUs.length === 0
  ) {
    return [getBreakdownsByScenario(params)];
  }

  const normalizedGrants = normalizeRSUGrants(grantedRSUs, shareFMV);

  const maxYear = Math.max(
    ...normalizedGrants.map(([_, vesting], idx) => idx + vesting + 1),
  );
  const yearlyBreakdowns: Record<Scenario, Breakdown>[] = [];

  for (let year = 0; year < Math.ceil(maxYear); year++) {
    let rsuValueThisYear = 0;
    for (let grantYear = 0; grantYear < normalizedGrants.length; grantYear++) {
      const [amount, vestingPeriod] = normalizedGrants[grantYear];
      const vestingYear = grantYear + vestingPeriod;
      const yearsSinceGrant = year - grantYear;

      // For immediate vesting (vestingPeriod = 0), vest all in grant year
      if (vestingPeriod === 0) {
        if (year === grantYear) {
          const fmvAtVesting = shareFMV;
          rsuValueThisYear += amount * fmvAtVesting;
        }
        continue;
      }

      if (
        year < grantYear ||
        year >= vestingYear ||
        yearsSinceGrant >= vestingPeriod
      ) {
        continue;
      }

      const fmvAtVesting =
        shareFMV * Math.pow(1 + growthRate / 100, yearsSinceGrant);
      const annualVest = amount / vestingPeriod;

      rsuValueThisYear += annualVest * fmvAtVesting;
    }
    const breakdowns = getBreakdownsByScenario(params, rsuValueThisYear);
    yearlyBreakdowns.push(breakdowns);
  }

  return yearlyBreakdowns;
}

export function parseParams(searchParams?: URLSearchParams | null) {
  const params = DEFAULT_PARAMS;
  for (const key of Object.keys(params)) {
    const shortenedKey = SHORTENED_PARAM_KEYS[key as keyof Params];
    const strValue = searchParams?.get(shortenedKey);
    if (strValue) {
      if (key === "grantedRSUs") {
        params.grantedRSUs = strValue.split(ARRAY_SEP).map((item) => {
          const dotIndex = item.indexOf(".");

          if (dotIndex === -1) {
            // Backward compatibility: no prefix = units
            const [amountStr, vestingStr] = item.split(ARRAY_ITEM_SEP);
            return {
              mode: "units" as const,
              amount: Number(amountStr),
              vestingPeriod: Number(vestingStr),
            };
          }

          const prefix = item.substring(0, dotIndex);
          const rest = item.substring(dotIndex + 1);
          const [valueStr, vestingStr] = rest.split(ARRAY_ITEM_SEP);
          const vestingPeriod = Number(vestingStr);

          if (prefix === "u") {
            return {
              mode: "units" as const,
              amount: Number(valueStr),
              vestingPeriod,
            };
          } else if (prefix === "d") {
            return {
              mode: "dollars" as const,
              dollarValue: Number(valueStr),
              vestingPeriod,
            };
          }

          // Fallback to units
          return {
            mode: "units" as const,
            amount: Number(valueStr),
            vestingPeriod,
          };
        });
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
      strValue = (value as RSUGrant[])
        .map((grant) => {
          if (grant.mode === "units") {
            return `u.${grant.amount}${ARRAY_ITEM_SEP}${grant.vestingPeriod}`;
          } else {
            return `d.${grant.dollarValue}${ARRAY_ITEM_SEP}${grant.vestingPeriod}`;
          }
        })
        .join(ARRAY_SEP);
    } else {
      strValue = value.toString();
    }
    newSearchParams.set(shortenedKey, strValue);
  }
  window.history.pushState(null, "", `?${newSearchParams.toString()}`);
}
