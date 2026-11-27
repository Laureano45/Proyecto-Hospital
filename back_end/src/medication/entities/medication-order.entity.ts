import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Patient } from '../../patients/Entities/patient.entity';
import { Admission } from '../../admissions/entities/admission.entity';
import { Doctor } from '../../doctors/Entities/doctor.entity';

import { MedicationAdministration } from './medication-administration.entity';
import { MedicationOrderStatus } from './medication-status.enum';

@Entity('medication_orders')
export class MedicationOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  admissionId: number;

  @Column()
  doctorId: number;

  @ManyToOne(() => Patient, patient => patient.medicationOrders, {
    nullable: false,
  })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Admission, admission => admission.medicationOrders, {
    nullable: false,
  })
  @JoinColumn({ name: 'admissionId' })
  admission: Admission;

  @ManyToOne(() => Doctor, doctor => doctor.medicationOrders, {
    nullable: false,
  })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ length: 150 })
  medicationName: string;

  @Column({ length: 100 })
  dosage: string;

  @Column({ type: 'int' })
  frequencyHours: number;

  @Column({ type: 'timestamp' })
  startAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endAt: Date | null;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({
    type: 'enum',
    enum: MedicationOrderStatus,
    default: MedicationOrderStatus.ACTIVA,
  })
  status: MedicationOrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(
    () => MedicationAdministration,
    administration => administration.medicationOrder,
  )
  administrations: MedicationAdministration[];
}
