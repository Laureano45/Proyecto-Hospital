import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Admission } from './entities/admission.entity';
import { Room } from '../rooms/entities/room.entity';
import { Patient } from '../patients/Entities/patient.entity';
import { RoomsModule } from '../rooms/rooms.module';

import { AdmissionsService } from './admissions.service';
import { AdmissionsController } from './admissions.controller';
import { Doctor } from '../doctors/Entities/doctor.entity';

import { NursingTask } from '../nursing-tasks/entities/nursing-task.entity';
import { PreOpProtocolBuilder } from '../nursing-tasks/builders/pre-op-protocol.builder';
import { RespiratoryProtocolBuilder } from '../nursing-tasks/builders/respiratory-protocol.builder';

import { NursingTasksService } from '../nursing-tasks/nursing-tasks.service';
import { NursingTasksController } from '../nursing-tasks/nursing-tasks.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Admission,
      Room,
      Patient,
      NursingTask,
      Doctor
    ]),
    RoomsModule,
  ],
  controllers: [
    AdmissionsController,
    NursingTasksController
  ],
  providers: [
    AdmissionsService,
    PreOpProtocolBuilder,
    RespiratoryProtocolBuilder,
    NursingTasksService
  ],
  exports: [AdmissionsService]
})
export class AdmissionsModule {}
