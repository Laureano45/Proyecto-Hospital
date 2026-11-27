import { Injectable, BadRequestException } from '@nestjs/common';

import { CoverageType } from '../entities/coverage.entity';

import { CoverageStrategy } from './coverage-strategy.interface';
import { PublicCoverageStrategy } from './public-coverage.strategy';
import { PrepaidCoverageStrategy } from './prepaid-coverage.strategy';
import { PrivateCoverageStrategy } from './private-coverage.strategy';

@Injectable()
export class CoverageStrategyFactory {

  getStrategy(type: CoverageType): CoverageStrategy {

    switch (type) {

      case CoverageType.PUBLICA:
        return new PublicCoverageStrategy();

      case CoverageType.PREPAGA:
        return new PrepaidCoverageStrategy();

      case CoverageType.PARTICULAR:
        return new PrivateCoverageStrategy();

      default:
        throw new BadRequestException(
          'Tipo de cobertura no válido.'
        );
    }
  }
}
