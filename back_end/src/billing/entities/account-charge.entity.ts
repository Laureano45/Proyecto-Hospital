import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { StayAccount } from './stay-account.entity';
import { Supply } from '../../inventory/entities/supply.entity';

export enum AccountChargeCategory {
  FARMACIA = 'insumos_farmacia',
}

@Entity('account_charges')
@Index(['sourceAdministrationId'], { unique: true })
export class AccountCharge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  accountId: number;

  @Column()
  supplyId: number;

  @Column({
    type: 'enum',
    enum: AccountChargeCategory,
    default: AccountChargeCategory.FARMACIA,
  })
  category: AccountChargeCategory;

  @Column({ length: 200 })
  description: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  // ID de la administración de enfermería que originó el cargo.
  @Column({ unique: true })
  sourceAdministrationId: number;

  // Fecha real del consumo.
  @Column({ type: 'timestamp' })
  consumedAt: Date;

  @ManyToOne(() => StayAccount, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'accountId' })
  account: StayAccount;

  @ManyToOne(() => Supply, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplyId' })
  supply: Supply;

  @CreateDateColumn()
  createdAt: Date;
}
