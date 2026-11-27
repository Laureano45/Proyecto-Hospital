import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MedicationOrder } from './entities/medication-order.entity';
import { MedicationAdministration } from './entities/medication-administration.entity';
import { InventoryModule } from '../inventory/inventory.module';

import { Patient } from '../patients/Entities/patient.entity';
import { Admission } from '../admissions/entities/admission.entity';
import { Doctor } from '../doctors/Entities/doctor.entity';

import { MedicationController } from './medication.controller';
import { MedicationService } from './medication.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicationOrder,
      MedicationAdministration,
      Patient,
      Admission,
      Doctor,
    ]),
    InventoryModule,
  ],
  controllers: [MedicationController],
  providers: [MedicationService],
  exports: [MedicationService],
})
export class MedicationModule {}
