
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from './Entities/Appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Doctor } from '../doctors/Entities/doctor.entity';
import { Patient } from '../patients/Entities/patient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment,
      Patient,
      Doctor])
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService]
})
export class AppointmentsModule {}
