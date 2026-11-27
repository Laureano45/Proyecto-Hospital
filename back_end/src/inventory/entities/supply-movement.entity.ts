import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { Supply } from './supply.entity';
import { SupplyStock } from './supply-stock.entity';
import { MedicationAdministration } from '../../medication/entities/medication-administration.entity';

@Entity('supply_movements')
@Index(['administrationId'], { unique: true })
export class SupplyMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplyId: number;

  @ManyToOne(() => Supply, { nullable: false })
  @JoinColumn({ name: 'supplyId' })
  supply: Supply;

  @Column()
  supplyStockId: number;

  @ManyToOne(() => SupplyStock, { nullable: false })
  @JoinColumn({ name: 'supplyStockId' })
  supplyStock: SupplyStock;

  @Column({ nullable: true })
  administrationId: number | null;

  @ManyToOne(() => MedicationAdministration, {
    nullable: true,
  })
  @JoinColumn({ name: 'administrationId' })
  administration: MedicationAdministration | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  previousStock: number;

  @Column({ type: 'int' })
  resultingStock: number;

  @Column({ type: 'varchar', length: 20 })
  type: string;

  @CreateDateColumn()
  createdAt: Date;
}
