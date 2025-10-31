export interface ContractProps {
  // Using single letters to keep the URL shorter
  n: number; // Number of hires
  f: number; // Fee
  s: number; // Salary
  p: boolean; // Payroll
  fp: boolean; // Fast processing
  [key: string]: any;
}

export const defaultFee = 25;
export const fastProcessingFee = 20;
export const payrollCost = 500;
export const headcountOptions = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3+" },
];
export const salaryOptions = [
  { value: "50000", label: "$50k" },
  { value: "75000", label: "$75k" },
  { value: "100000", label: "$100k+" },
];
export const defaultContractProps: ContractProps = {
  n: parseInt(headcountOptions[0].value),
  f: defaultFee,
  s: parseInt(salaryOptions[0].value),
  p: false,
  fp: false,
};

export function getFinalFee({ fp: fastProcessing, f: fee }: ContractProps) {
  return fastProcessing ? fastProcessingFee : defaultContractProps.f;
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
