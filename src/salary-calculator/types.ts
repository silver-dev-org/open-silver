export type SalaryModel = "aor" | "eor";

export type Persona = "worker" | "employer";

export type Scenario = `${SalaryModel}-${Persona}`;

export type BreakdownItem = {
  label: string;
  value: number;
};

export type Breakdown = {
  sources: string[];
  title: string;
  description?: string;
  base: number;
  items: BreakdownItem[];
  total: number;
};

export type RSUGrant =
  | {
      mode: "units";
      amount?: number;
      vestingPeriod?: number;
    }
  | {
      mode: "dollars";
      dollarValue?: number;
      vestingPeriod?: number;
    };

export type Params = {
  salary: number;
  monthlyPrivateHealth: number;
  contractorTaxRate: number; // Monotributo
  discretionaryBudget?: number;
  shareFMV?: number;
  growthRate?: number;
  /**
   * Array of RSU grants with their calculation mode
   * Each grant can be either unit-based or dollar-based
   *
   * Stored like this in the URL:
   * - Unit-based: `u.1000-4` (1000 RSUs, 4 years)
   * - Dollar-based: `d.50000-4` ($50k, 4 years)
   * - Example: `u.1000-4_d.50000-2` -> [{ mode: "units", amount: 1000, vestingPeriod: 4 }, { mode: "dollars", dollarValue: 50000, vestingPeriod: 2 }]
   */
  grantedRSUs?: RSUGrant[];
};

export type Color = {
  var: string;
  border: string;
  text: string;
};
