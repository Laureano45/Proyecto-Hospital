import {
  CoverageStrategy,
  BillingCalculation,
} from './coverage-strategy.interface';

export class PrepaidCoverageStrategy
  implements CoverageStrategy {

  calculate(
    baseAmount: number,
    copayAmount: number
  ): BillingCalculation {

    if (copayAmount < 0 || copayAmount > baseAmount) {
      throw new Error(
        'El copago debe estar entre cero y el valor base.'
      );
    }

    return {
      baseAmount,
      patientAmount: copayAmount,
      payerAmount: baseAmount - copayAmount,
    };
  }
}
