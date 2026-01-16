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

export type Params = {
  salary: number;
  monthlyPrivateHealth: number;
  rsuTotalGrant: number;
  rsuVestingPeriod: 1 | 4;
};

export type Color = {
  var: string;
  border: string;
  text: string;
};
