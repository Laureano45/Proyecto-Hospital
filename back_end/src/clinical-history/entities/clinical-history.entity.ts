import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Patient } from '../../patients/Entities/patient.entity';
import { User } from '../../users/user.entity';

@Entity('clinical_records')
export class ClinicalHistory {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  doctorUserId: number;

  @ManyToOne(() => Patient, { nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'doctorUserId' })
  doctor: User;

  @Column({ type: 'varchar', length: 255 })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  recordedAt: Date;

  @Column({ type: 'int', nullable: true })
  correctsRecordId: number | null;

  @ManyToOne(
    () => ClinicalHistory,
    { nullable: true }
  )
  @JoinColumn({ name: 'correctsRecordId' })
  correctsRecord: ClinicalHistory | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  correctionReason: string | null;
}
