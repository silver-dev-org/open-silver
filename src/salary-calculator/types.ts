export type SalaryModel = "aor" | "eor";

export type Persona = "worker" | "employer";

export type Scenario = `${SalaryModel}-${Persona}`;

export type Breakdown = {
  scenario: Scenario;
  sources: string[];
  title: string;
  description?: string;
  base: number;
  items: BreakdownItem[];
  total: number;
};

export type BreakdownItem = {
  label: string;
  value: number;
};

export type YearlyData = {
  year: number;
  aor: {
    employer: number;
    worker: number;
  };
  eor: {
    employer: number;
    worker: number;
  };
};

export type Params = {
  salary: number;
  monthlyPrivateHealth: number;
  contractorTaxRate: number; // Monotributo
  shareFMV?: number;
  growthRate?: number;
  /**
   * `[amount of granted RSUs, vesting period in years][]`
   *
   * Stored like this in the URL: `1000-4_200-2_200-2` -> `[ [1000, 4], [200, 2], [200, 2] ]`
   */
  grantedRSUs?: [number, number][];
};
