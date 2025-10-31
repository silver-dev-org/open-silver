export const payrollCost = 500;
export const feeWithFastProcessing = 20;

// Using single letters to keep the URL shorter
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

export function getFinalFee({ fp: fastProcessing, f: fee }: ContractProps) {
  return fastProcessing ? feeWithFastProcessing : fee;
}

export function calculateContractCost(
  data: ContractProps,
  includePayroll: boolean = true,
) {
  const { n: numberOfHires, s: salary, p: payroll } = data;

  let value = numberOfHires * (getFinalFee(data) / 100) * salary;

  if (payroll && includePayroll) {
    value += payrollCost * 12;
  }

  return value;
}
