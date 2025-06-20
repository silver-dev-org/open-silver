export const payrollCost = 300;

export interface ContractProps {
  n: number; // Number of hires
  f: number; // Fee
  s: number; // Salary
  h: boolean; //
  x: boolean; // Exclusivity
  p: boolean; // Payroll
  d: boolean; // Deferred payment
  g: boolean; // Pay as you go
  t: boolean; // Strong guarantee
  [key: string]: any;
}

export function getDiscountPercentage({ ...data }: ContractProps) {
  if (data.d) return 0;
  if (data.n >= 3 || data.x) return 0.25;
  return 0;
}

export function calculateContractCost(
  data: ContractProps,
  includePayroll: boolean = true,
  includeDiscounts: boolean = true
) {
  let value = data.n * (data.f / 100) * data.s;
  if (data.p && includePayroll) {
    value += payrollCost * 12;
  }
  if (includeDiscounts) {
    let discount = 0;
    if (data.n >= 3) discount = 0.15;
    if (data.x) discount = 0.25;
    if (data.d) discount = 0;
    value -= value * discount;
  }
  return value;
}
