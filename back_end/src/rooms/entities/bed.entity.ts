import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Room } from './room.entity';
import { Admission } from '../../admissions/entities/admission.entity';

export enum BedStatus {
  LIBRE = 'libre',
  OCUPADA = 'ocupada',
  EN_LIMPIEZA = 'en_limpieza',
  BLOQUEADA = 'bloqueada',
}

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomId: number;

  @ManyToOne(() => Room, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({ type: 'varchar', length: 30, unique: true })
  bedNumber: string;

  @Column({
    type: 'enum',
    enum: BedStatus,
    default: BedStatus.LIBRE,
  })
  status: BedStatus;

  @Column({ type: 'text', nullable: true })
  blockReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  cleanedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  cleanedByUserId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}