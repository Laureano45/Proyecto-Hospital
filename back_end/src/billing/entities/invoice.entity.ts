import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Patient } from '../../patients/Entities/patient.entity';
import { Coverage } from './coverage.entity';
import { ServiceCatalog } from './service-catalog.entity';

export enum InvoiceStatus {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada',
  ANULADA = 'anulada',
}

@Entity('invoices')
export class Invoice {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  coverageId: number;

  @Column()
  serviceId: number;

  @Column({ length: 150 })
  patientNameSnapshot: string;

  @Column({ length: 150 })
  coverageNameSnapshot: string;

  @Column({ length: 150 })
  serviceNameSnapshot: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  baseAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  patientAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  payerAmount: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDIENTE,
  })
  status: InvoiceStatus;

  @CreateDateColumn()
  issuedAt: Date;

  @ManyToOne(() => Patient, { nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Coverage, { nullable: false })
  @JoinColumn({ name: 'coverageId' })
  coverage: Coverage;

  @ManyToOne(() => ServiceCatalog, { nullable: false })
  @JoinColumn({ name: 'serviceId' })
  service: ServiceCatalog;
}
