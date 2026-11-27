import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { Patient } from './patient.entity';

@Entity('patient_family_history')
export class PatientFamilyHistory {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(
    () => Patient,
    patient => patient.familyHistory,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'varchar', length: 100 })
  relative: string;

  @Column({ type: 'varchar', length: 150 })
  condition: string;

  @Column({ type: 'text', nullable: true })
  observations: string | null;
}