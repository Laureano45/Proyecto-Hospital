import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Coverage } from './entities/coverage.entity';
import { ServiceCatalog } from './entities/service-catalog.entity';
import { CoverageServicePrice } from './entities/coverage-service-price.entity';
import { CoverageStrategyFactory } from './strategies/coverage-strategy.factory';
import { Invoice } from './entities/invoice.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { StayAccount } from './entities/stay-account.entity';
import { SupplyPrice } from './entities/supply-price.entity';
import { AccountCharge } from './entities/account-charge.entity';
import { MedicationBillingListener } from './listeners/medication-billing.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coverage,
      ServiceCatalog,
      CoverageServicePrice,
      Invoice,
      StayAccount,
      SupplyPrice,
      AccountCharge,  
    ]),
  ],
  providers: [ CoverageStrategyFactory, BillingService, MedicationBillingListener,],
  controllers: [ BillingController,],
  exports: [
    BillingService,
    TypeOrmModule,
  ],
})
export class BillingModule {}