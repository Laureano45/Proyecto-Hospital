import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Patient } from './patient.entity';

@Entity('patient_allergies')
export class PatientAllergy {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(
    () => Patient,
    patient => patient.allergies,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ type: 'varchar', length: 150 })
  allergen: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  severity: string;
}