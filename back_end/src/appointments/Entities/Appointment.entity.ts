import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';

import { Patient } from '../../patients/Entities/patient.entity';
import { Doctor } from '../../doctors/Entities/doctor.entity';
import { AppointmentStatus } from '../states/appointment-status.enum';

@Entity('appointments')
@Index(
  'UQ_doctor_appointment_slot',
  ['doctorId', 'appointmentDate', 'appointmentTime'],
  {
    unique: true,
    where: `"status" IN ('PROGRAMADO', 'CONFIRMADO', 'EN_SALA_DE_ESPERA')`
  }
)
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  doctorId: number;

  @Column({ type: 'date' })
  appointmentDate: string;

  @Column({ type: 'time' })
  appointmentTime: string;

  @Column({
  type: 'int',
  default: 30
  })
  durationMinutes: number;

  @Column({
  type: 'boolean',
  default: false
  })
  isOverbooking: boolean;

  @Column({
    type: 'varchar',
    length: 30,
    default: AppointmentStatus.PROGRAMADO
  })
  status: AppointmentStatus;

  @ManyToOne(
    () => Patient,
    patient => patient.appointments,
    { nullable: false, onDelete: 'RESTRICT' }
  )
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(
    () => Doctor,
    doctor => doctor.appointments,
    { nullable: false, onDelete: 'RESTRICT' }
  )
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;
}
