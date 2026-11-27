import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Supply } from './entities/supply.entity';
import { SupplyStock } from './entities/supply-stock.entity';
import { SupplyMovement } from './entities/supply-movement.entity';

import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { MedicationAdministeredListener } from './listeners/medication-administered.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supply,
      SupplyStock,
      SupplyMovement,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, MedicationAdministeredListener],
  exports: [InventoryService],
})
export class InventoryModule {}
