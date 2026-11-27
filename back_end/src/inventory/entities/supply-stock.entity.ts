import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Supply } from './supply.entity';

@Entity('supply_stocks')
@Index(['supplyId', 'floor'], { unique: true })
export class SupplyStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  supplyId: number;

  @ManyToOne(() => Supply, supply => supply.stocks, {
    nullable: false,
  })
  @JoinColumn({ name: 'supplyId' })
  supply: Supply;

  @Column({ type: 'int' })
  floor: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
