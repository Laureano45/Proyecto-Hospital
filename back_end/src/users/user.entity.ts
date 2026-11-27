import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import { Doctor } from '../doctors/Entities/doctor.entity';
import { Role } from './roles.enum';
import { MedicationAdministration } from '../medication/entities/medication-administration.entity';

@Entity('users')
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true
  })
  firstName: string | null;

  @Column({ 
    type: 'varchar',
    length: 100,
    nullable: true
  })
  lastName: string | null;

  @Column({
    type: 'enum',
    enum: Role,
  })
  role: Role;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @OneToOne(
    () => Doctor,
    doctor => doctor.user,
    { nullable: true }
  )
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor | null;

  @OneToMany(
    () => MedicationAdministration,
    administration => administration.nurse
  )
  medicationAdministrations: MedicationAdministration[];
}
