export const payrollCost = 500;

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
  fp: boolean; // Fast processing
  [key: string]: any;
}

export function getDiscountPercentage({ ...data }: ContractProps) {
  if (data.d) return 0;
  // Disabling volume discounts today discounts
  // if (data.n >= 3 || data.x) return 0.25;
  return 0;
}

export function calculateContractCost(
  data: ContractProps,
  includePayroll: boolean = true,
  includeDiscounts: boolean = true,
) {
  const fee = data.fp ? 20 : data.f;
  let value = data.n * (fee / 100) * data.s;
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
