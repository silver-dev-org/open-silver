import type { Params, Persona, SalaryModel, Scenario } from "./types";

export const MIN_SALARY = 50000;
export const MAX_SALARY = 150000;
export const CURRENCY_FORMAT: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  currency: "USD",
  currencyDisplay: "symbol",
  style: "currency",
  currencySign: "accounting",
};
export const ARS_USD = 1415;
export const MAX_TAXABLE_GROSS = (3505701.35 / ARS_USD) * 13;
export const SCENARIOS: Scenario[] = [
  "eor-employer",
  "eor-worker",
  "aor-employer",
  "aor-worker",
];
export const DEFAULT_PARAMS: Params = {
  salary: 100000,
  monthlyPrivateHealth: 100,
  contractorTaxRate: 15,
  shareFMV: undefined,
  growthRate: undefined,
  grantedRSUs: undefined,
};
export const SHORTENED_PARAM_KEYS: Record<keyof Params, string> = {
  salary: "s",
  monthlyPrivateHealth: "h",
  contractorTaxRate: "c",
  shareFMV: "fmv",
  growthRate: "gr",
  grantedRSUs: "rsu",
};
export const ARRAY_SEP = "_";
export const ARRAY_ITEM_SEP = "-";
export const FEES = {
  eor: {
    employer: {
      sources: [
        "https://www.argentina.gob.ar/trabajo/buscastrabajo/conocetusderechos/salario",
        "https://www.srt.gob.ar/estadisticas/cf_boletin_art.php",
      ],
      pension: 16,
      socialServices: 2, // PAMI
      health: 6,
      employmentFund: 1.5,
      lifeInsurance: 0.3,
      accidentInsurance: 2, // Estimación ART
    },
    worker: {
      sources: [
        "https://www.argentina.gob.ar/trabajo/buscastrabajo/conocetusderechos/salario",
        "https://www.boletinoficial.gob.ar/detalleAviso/primera/330620/20250901",
        "https://servicioscf.afip.gob.ar/publico/abc/ABCpaso2.aspx?cat=743",
      ],
      pension: 11,
      health: 3,
      socialServices: 3, // PAMI
      incomeTax: {
        // Estimates in USD averaging married & single deductions
        // Based on Nov 2025 data
        50000: 13.5,
        55000: 15,
        60000: 16,
        65000: 17.5,
        70000: 19,
        75000: 20,
        80000: 21.5,
        85000: 23,
        90000: 24,
        95000: 24.5,
        100000: 26,
        105000: 27,
        110000: 27.5,
        115000: 28.5,
        120000: 29,
        125000: 29.5,
        130000: 29.5,
        135000: 30,
        140000: 31,
        145000: 31.5,
        150000: 31.5,
      },
    },
  },
  aor: {
    employer: {
      sources: ["https://silver.dev/aor#pricing"],
      aorMonthlyFee: 300,
    },
    worker: {
      sources: ["https://www.afip.gob.ar/monotributo/categorias.asp"],
    },
  },
} satisfies Record<SalaryModel, Record<Persona, Record<string, any>>>;
