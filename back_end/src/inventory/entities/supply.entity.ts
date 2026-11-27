import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { SupplyStock } from './supply-stock.entity';

@Entity('supplies')
export class Supply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => SupplyStock, stock => stock.supply)
  stocks: SupplyStock[];

  @CreateDateColumn()
  createdAt: Date;
}
