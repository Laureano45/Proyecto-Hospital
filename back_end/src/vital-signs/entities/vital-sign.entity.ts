import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';

import { Patient } from '../../patients/Entities/patient.entity';
import { Admission } from '../../admissions/entities/admission.entity';
import { User } from '../../users/user.entity';

@Entity('vital_signs')
export class VitalSign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  admissionId: number;

  // ID del usuario autenticado que realiza el control.
  @Column()
  nurseUserId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'nurseUserId' })
  nurse: User;

  @ManyToOne(() => Patient, { nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Admission, { nullable: false })
  @JoinColumn({ name: 'admissionId' })
  admission: Admission;

  @Column({ type: 'int' })
  bloodPressureSystolic: number;

  @Column({ type: 'int' })
  bloodPressureDiastolic: number;

  @Column({ type: 'int' })
  heartRate: number;

  @Column({ type: 'decimal', precision: 4, scale: 1 })
  temperature: number;

  @CreateDateColumn({ type: 'timestamp' })
  recordedAt: Date;

  @Column({ type: 'text' })
  nursingNote: string;
}
