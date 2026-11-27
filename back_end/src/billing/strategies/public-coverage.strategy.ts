import {
  CoverageStrategy,
  BillingCalculation,
} from './coverage-strategy.interface';

export class PublicCoverageStrategy
  implements CoverageStrategy {

  calculate(
    baseAmount: number,
    copayAmount: number
  ): BillingCalculation {

    return {
      baseAmount,
      patientAmount: 0,
      payerAmount: baseAmount,
    };
  }
}
