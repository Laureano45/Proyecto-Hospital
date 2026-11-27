import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';

import { Admission } from '../../admissions/entities/admission.entity';
import { Bed } from './bed.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  roomNumber: string;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @OneToMany(() => Bed, bed => bed.room)
  beds: Bed[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Admission, admission => admission.room)
  admissions: Admission[];
}
