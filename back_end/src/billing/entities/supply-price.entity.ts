import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { Supply } from '../../inventory/entities/supply.entity';

@Entity('supply_prices')
@Index(['supplyId', 'validFrom'])
export class SupplyPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplyId: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  unitPrice: number;

  @Column({ type: 'timestamp' })
  validFrom: Date;

  @Column({ type: 'timestamp', nullable: true })
  validUntil: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Supply, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplyId' })
  supply: Supply;

  @CreateDateColumn()
  createdAt: Date;
}
