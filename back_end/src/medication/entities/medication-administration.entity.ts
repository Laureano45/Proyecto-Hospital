import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { MedicationOrder } from './medication-order.entity';
import { User } from '../../users/user.entity';

@Entity('medication_administrations')
@Index(
  ['medicationOrderId', 'scheduledAt'],
  { unique: true },
)
export class MedicationAdministration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  medicationOrderId: number;

  @Column()
  nurseUserId: number;

  @ManyToOne(
    () => MedicationOrder,
    order => order.administrations,
    { nullable: false },
  )
  @JoinColumn({ name: 'medicationOrderId' })
  medicationOrder: MedicationOrder;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'nurseUserId' })
  nurse: User;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  administeredAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
