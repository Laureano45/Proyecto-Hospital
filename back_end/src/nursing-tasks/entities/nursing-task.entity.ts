import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn
} from 'typeorm';

import { Admission } from '../../admissions/entities/admission.entity';
import { User } from '../../users/user.entity';
import { NursingTaskStatus } from './nursing-task-status.enum';
import { Doctor } from '../../doctors/Entities/doctor.entity';

@Entity('nursing_tasks')
export class NursingTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  admissionId: number;

  @ManyToOne(() => Admission, { nullable: false })
  @JoinColumn({ name: 'admissionId' })
  admission: Admission;

  @Column({ type: 'int', nullable: true })
  createdByDoctorId: number | null;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'createdByDoctorId' })
  createdByDoctor: Doctor | null;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  frequency: string | null;

  @Column({
    type: 'varchar',
    length: 30,
    default: NursingTaskStatus.PENDIENTE
  })
  status: NursingTaskStatus;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  completedByUserId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completedByUserId' })
  completedBy: User | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}