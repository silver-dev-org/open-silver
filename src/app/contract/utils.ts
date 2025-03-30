export const payrollCost = 300;

export interface ContractProps {
  n: number;
  f: number;
  s: number;
  h: boolean;
  x: boolean;
  p: boolean;
  d: boolean;
  g: boolean;
  t: boolean;
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
    value -= value * getDiscountPercentage(data);
  }
  return value;
}
