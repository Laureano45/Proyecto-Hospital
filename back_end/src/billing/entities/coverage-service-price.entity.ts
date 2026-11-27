
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

import { Coverage } from './coverage.entity';
import { ServiceCatalog } from './service-catalog.entity';

@Entity('coverage_service_prices')
@Unique(['coverageId', 'serviceId'])
export class CoverageServicePrice {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  coverageId: number;

  @Column()
  serviceId: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  copayAmount: number;

  @ManyToOne(
    () => Coverage,
    { nullable: false, onDelete: 'RESTRICT' }
  )
  @JoinColumn({ name: 'coverageId' })
  coverage: Coverage;

  @ManyToOne(
    () => ServiceCatalog,
    service => service.coveragePrices,
    { nullable: false, onDelete: 'RESTRICT' }
  )
  @JoinColumn({ name: 'serviceId' })
  service: ServiceCatalog;
}
