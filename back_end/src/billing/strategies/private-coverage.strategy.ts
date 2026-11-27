import {
  CoverageStrategy,
  BillingCalculation,
} from './coverage-strategy.interface';

export class PrivateCoverageStrategy
  implements CoverageStrategy {

  calculate(
    baseAmount: number,
    copayAmount: number
  ): BillingCalculation {

    return {
      baseAmount,
      patientAmount: baseAmount,
      payerAmount: 0,
    };
  }
}
