import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from './Entities/patient.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PatientAllergy } from './Entities/patient-allergy.entity';
import { PatientFamilyHistory } from './Entities/patient-family-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, PatientAllergy, PatientFamilyHistory])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService]
})
export class PatientsModule {}