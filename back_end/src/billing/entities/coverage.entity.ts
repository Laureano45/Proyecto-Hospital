
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';

import { Patient } from '../../patients/Entities/patient.entity';

export enum CoverageType {
  PUBLICA = 'publica',
  PREPAGA = 'prepaga',
  PARTICULAR = 'particular',
}

@Entity('coverages')
export class Coverage {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150, unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: CoverageType,
  })
  type: CoverageType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  fixedCopay: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(
    () => Patient,
    patient => patient.coverage
  )
  patients: Patient[];
}
