export interface BillingCalculation {
  baseAmount: number;
  patientAmount: number;
  payerAmount: number;
}

export interface CoverageStrategy {
  calculate(
    baseAmount: number,
    copayAmount: number
  ): BillingCalculation;
}
