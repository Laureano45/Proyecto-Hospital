import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Appointment } from '../../appointments/Entities/Appointment.entity';
import { ClinicalHistory } from '../../clinical-history/entities/clinical-history.entity';
import { MedicationOrder } from '../../medication/entities/medication-order.entity';
import { PatientAllergy } from './patient-allergy.entity';
import { PatientFamilyHistory } from './patient-family-history.entity';
import { Coverage } from '../../billing/entities/coverage.entity';

@Entity('patients')
export class Patient {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 20 })
  dni: string;

  @Column({ length: 30 })
  phone: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  birthDate: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  biologicalSex: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emergencyContactName: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  emergencyContactPhone: string | null;

  @OneToMany(
    () => Appointment,
    appointment => appointment.patient
  )
  appointments: Appointment[];

  @OneToMany(
    () => ClinicalHistory,
    clinicalHistory => clinicalHistory.patient
  )
  clinicalRecords: ClinicalHistory[];

  @OneToMany(
    () => MedicationOrder,
    medicationOrder => medicationOrder.patient
  )
  medicationOrders: MedicationOrder[];

  @OneToMany(
    () => PatientAllergy,
    allergy => allergy.patient,
  )
  allergies: PatientAllergy[];

  @OneToMany(
    () => PatientFamilyHistory,
    familyHistory => familyHistory.patient
  )
  familyHistory: PatientFamilyHistory[];  

  @ManyToOne(
    () => Coverage,
    coverage => coverage.patients,
    {
      nullable: true,
      eager: false,
    }
  )
  @JoinColumn({ name: 'coverageId' })
  coverage: Coverage | null;
}
