import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { Appointment } from '../../appointments/Entities/Appointment.entity';
import { User } from '../../users/user.entity';
import { MedicationOrder } from '../../medication/entities/medication-order.entity';

@Entity('doctors')
export class Doctor {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 100 })
  specialty: string;

  @Column({ unique: true, length: 50 })
  licenseNumber: string;

  @OneToMany(
    () => Appointment,
    appointment => appointment.doctor
  )
  appointments: Appointment[];

  @OneToOne(
    () => User,
    user => user.doctor
  )
  user: User | null;

  @OneToMany(
    () => MedicationOrder,
    medicationOrder => medicationOrder.doctor
  )
  medicationOrders: MedicationOrder[];
}
