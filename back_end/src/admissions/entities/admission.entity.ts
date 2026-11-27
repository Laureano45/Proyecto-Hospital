import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany
} from 'typeorm';

import { Patient } from '../../patients/Entities/patient.entity';
import { Room } from '../../rooms/entities/room.entity';
import { AdmissionStatus } from './admission-status.enum';
import { MedicationOrder } from '../../medication/entities/medication-order.entity';
import { AdmissionType } from './admission-type.enum';
import { Doctor } from '../../doctors/Entities/doctor.entity';
import { Bed } from '../../rooms/entities/bed.entity';

@Entity('admissions')
export class Admission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  roomId: number;

  @Column({ type: 'int', nullable: true })
  bedId: number | null;

  @Column({ type: 'int', nullable: true })
  doctorId: number | null;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: AdmissionType.GENERAL,
  })
  admissionType: AdmissionType;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true
  })
  initialDiagnosis: string | null;

  @ManyToOne(() => Patient, { nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Room, room => room.admissions, {
    nullable: false
  })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @ManyToOne(() => Bed, { nullable: true })
  @JoinColumn({ name: 'bedId' })
  bed: Bed | null;

  @CreateDateColumn()
  admissionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  medicalDischargeDate: Date | null;

  @Column({ type: 'int', nullable: true })
  medicalDischargeDoctorId: number | null;

  @Column({ type: 'timestamp', nullable: true })
  dischargeDate: Date | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: AdmissionStatus.ACTIVA
  })
  status: AdmissionStatus;

  @OneToMany(
    () => MedicationOrder,
    medicationOrder => medicationOrder.admission
  )
  medicationOrders: MedicationOrder[];
}
