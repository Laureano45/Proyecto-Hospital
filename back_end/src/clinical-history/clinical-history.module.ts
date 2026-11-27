import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClinicalHistoryController } from './clinical-history.controller';
import { ClinicalHistoryService } from './clinical-history.service';

import { ClinicalHistory } from './entities/clinical-history.entity';
import { Patient } from '../patients/Entities/patient.entity';
import { VitalSign } from '../vital-signs/entities/vital-sign.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClinicalHistory,
      Patient,
      VitalSign
    ]),
  ],
  controllers: [ClinicalHistoryController],
  providers: [ClinicalHistoryService],
  exports: [ClinicalHistoryService],
})
export class ClinicalHistoryModule {}