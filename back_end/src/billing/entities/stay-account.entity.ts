import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StayAccountStatus {
  ACTIVA = 'activa',
  CERRADA = 'cerrada',
}

@Entity('stay_accounts')
export class StayAccount {
  @PrimaryGeneratedColumn()
  id: number;

  // Una cuenta general por internación.
  @Column({ unique: true })
  admissionId: number;

  @Column({
    type: 'enum',
    enum: StayAccountStatus,
    default: StayAccountStatus.ACTIVA,
  })
  status: StayAccountStatus;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
