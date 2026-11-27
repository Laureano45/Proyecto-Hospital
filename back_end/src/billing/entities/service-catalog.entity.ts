
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';

import { CoverageServicePrice } from './coverage-service-price.entity';

@Entity('service_catalog')
export class ServiceCatalog {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 30,
    unique: true,
  })
  code: string;

  @Column({
    length: 150,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  basePrice: number;

  @Column({
    default: true,
  })
  isActive: boolean;

  @OneToMany(
    () => CoverageServicePrice,
    price => price.service
  )
  coveragePrices: CoverageServicePrice[];
}
