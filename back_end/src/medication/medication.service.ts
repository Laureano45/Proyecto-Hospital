import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import {DataSource} from "typeorm";

import { MedicationOrder } from './entities/medication-order.entity';
import { MedicationOrderStatus } from './entities/medication-status.enum';
import { MedicationAdministration } from './entities/medication-administration.entity';
import { CreateMedicationOrderDto } from './dto/create-medication-order.dto';
import {AdministerMedicationDto} from "./dto/administer-medication.dto";

import { User } from '../users/user.entity';
import {Role} from "../users/roles.enum";

import { Patient } from '../patients/Entities/patient.entity';
import { Admission } from '../admissions/entities/admission.entity';
import { Doctor } from '../doctors/Entities/doctor.entity';
import { AdmissionStatus } from '../admissions/entities/admission-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MedicationService {
  constructor(
    @InjectRepository(MedicationOrder)
    private readonly medicationRepository: Repository<MedicationOrder>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(Admission)
    private readonly admissionRepository: Repository<Admission>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,

    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(
    dto: CreateMedicationOrderDto,
    doctorId: number | null,
  ) {
        if (!doctorId) {
        throw new ForbiddenException(
            'El usuario no tiene un médico asociado.',
        );
        }

        const doctor = await this.doctorRepository.findOne({
        where: { id: doctorId },
        });

        if (!doctor) {
        throw new NotFoundException('Médico no encontrado.');
        }

        const patient = await this.patientRepository.findOne({
        where: { id: dto.patientId },
        });

        if (!patient) {
        throw new NotFoundException('Paciente no encontrado.');
        }

        const admission = await this.admissionRepository.findOne({
        where: {
            id: dto.admissionId,
            patientId: dto.patientId,
            status: AdmissionStatus.ACTIVA,
        },
        });

        if (!admission) {
        throw new BadRequestException(
            'El paciente no tiene una internación activa correspondiente.',
        );
        }

        const startAt = new Date(dto.startAt);

        const endAt = dto.endAt
        ? new Date(dto.endAt)
        : null;

        if (
        endAt &&
        endAt.getTime() <= startAt.getTime()
        ) {
        throw new BadRequestException(
            'La fecha de finalización debe ser posterior al inicio.',
        );
        }

        const order = this.medicationRepository.create({
        patientId: dto.patientId,
        admissionId: dto.admissionId,
        doctorId,
        medicationName: dto.medicationName.trim(),
        dosage: dto.dosage.trim(),
        frequencyHours: dto.frequencyHours,
        startAt,
        endAt,
        instructions: dto.instructions?.trim() || null,
        });

        const savedOrder = await this.medicationRepository.save(order);

        return this.medicationRepository.findOne({
        where: { id: savedOrder.id },
        relations: {
            patient: true,
            doctor: true,
            admission: {
            room: true,
            },
        },
        });
    }


    async findPendingForNurse(date?: string) {
    const selectedDate = date || this.getLocalDate();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        throw new BadRequestException(
        'La fecha debe tener el formato YYYY-MM-DD.',
        );
    }

    const dayStart = new Date(`${selectedDate}T00:00:00`);
    const dayEnd = new Date(`${selectedDate}T23:59:59.999`);

    if (
        Number.isNaN(dayStart.getTime()) ||
        dayStart.toISOString().slice(0, 10) !== selectedDate
    ) {
        throw new BadRequestException('Fecha inválida.');
    }

    const orders = await this.medicationRepository.find({
        where: {
        status: MedicationOrderStatus.ACTIVA,
        admission: {
            status: In([
            AdmissionStatus.ACTIVA,
            AdmissionStatus.ALTA_MEDICA_SOLICITADA,
            ]),
            dischargeDate: IsNull(),
        },
        },
        relations: {
        patient: true,
        admission: {
            room: true,
        },
        doctor: true,
        administrations: {
            nurse: true,
        },
        },
        order: {
        startAt: 'ASC',
        },
    });

    const result: any[] = [];
    const now = Date.now();
    const tolerance = 30 * 60 * 1000;

    for (const order of orders) {
        const interval = order.frequencyHours * 60 * 60 * 1000;

        const start = new Date(order.startAt).getTime();
        const firstDay = dayStart.getTime();
        const lastDay = dayEnd.getTime();

        if (interval <= 0 || start > lastDay) {
        continue;
        }

        let occurrence = Math.max(
        0,
        Math.ceil((firstDay - start) / interval),
        );

        while (true) {
        const scheduledTime = start + occurrence * interval;

        if (scheduledTime > lastDay) {
            break;
        }

        const scheduledAt = new Date(scheduledTime);

        if (
            order.endAt &&
            scheduledTime > new Date(order.endAt).getTime()
        ) {
            break;
        }

        const administration = order.administrations.find(
            item =>
            new Date(item.scheduledAt).getTime() === scheduledTime,
        );

        // Excluir las dosis que ya fueron administradas.
        if (administration) {
            occurrence++;
            continue;
        }

        // Excluir las dosis cuyo horario venció.
        // Se conserva la tolerancia de 30 minutos.
        if (now > scheduledTime + tolerance) {
            occurrence++;
            continue;
        }

        result.push({
            medicationOrderId: order.id,
            patientId: order.patientId,
            patient: order.patient,
            admission: order.admission,
            doctor: order.doctor,
            medicationName: order.medicationName,
            dosage: order.dosage,
            frequencyHours: order.frequencyHours,
            scheduledAt,
            status: 'pendiente',
            administration: null,
        });

        occurrence++;
        }
    }

    return result.sort(
        (a, b) =>
        new Date(a.scheduledAt).getTime() -
        new Date(b.scheduledAt).getTime(),
    );
    }

    async findOverdueForNurse(date?: string) {
        const selectedDate = date || this.getLocalDate();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
            throw new BadRequestException(
            'La fecha debe tener el formato YYYY-MM-DD.',
            );
        }

        const dayStart = new Date(`${selectedDate}T00:00:00`);
        const dayEnd = new Date(`${selectedDate}T23:59:59.999`);

        if (
            Number.isNaN(dayStart.getTime()) ||
            dayStart.toISOString().slice(0, 10) !== selectedDate
        ) {
            throw new BadRequestException('Fecha inválida.');
        }

        const orders = await this.medicationRepository.find({
            where: {
            status: MedicationOrderStatus.ACTIVA,
            admission: {
                status: In([
                AdmissionStatus.ACTIVA,
                AdmissionStatus.ALTA_MEDICA_SOLICITADA,
                ]),
                dischargeDate: IsNull(),
            },
            },
            relations: {
            patient: true,
            admission: {
                room: true,
            },
            doctor: true,
            administrations: {
                nurse: true,
            },
            },
            order: {
            startAt: 'ASC',
            },
        });

        const result: any[] = [];
        const now = Date.now();
        const tolerance = 30 * 60 * 1000;

        for (const order of orders) {
            const interval = order.frequencyHours * 60 * 60 * 1000;
            const start = new Date(order.startAt).getTime();

            if (interval <= 0 || start > dayEnd.getTime()) {
            continue;
            }

            let occurrence = Math.max(
            0,
            Math.ceil((dayStart.getTime() - start) / interval),
            );

            while (true) {
            const scheduledTime = start + occurrence * interval;

            if (scheduledTime > dayEnd.getTime()) {
                break;
            }

            if (
                order.endAt &&
                scheduledTime > new Date(order.endAt).getTime()
            ) {
                break;
            }

            const administration = order.administrations.find(
                item =>
                new Date(item.scheduledAt).getTime() === scheduledTime,
            );

            // No incluir dosis que sí fueron administradas.
            if (administration) {
                occurrence++;
                continue;
            }

            // Solo incluir dosis que superaron la tolerancia.
            if (now <= scheduledTime + tolerance) {
                occurrence++;
                continue;
            }

            const scheduledAt = new Date(scheduledTime);

            result.push({
                medicationOrderId: order.id,
                patientId: order.patientId,
                patient: order.patient,
                admission: order.admission,
                doctor: order.doctor,
                medicationName: order.medicationName,
                dosage: order.dosage,
                frequencyHours: order.frequencyHours,
                scheduledAt,
                status: 'vencida',
                administration: null,
            });

            occurrence++;
            }
        }

        return result.sort(
            (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        );
    }


    private getLocalDate(): string {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    async administerDose(
    orderId: number,
    dto: AdministerMedicationDto,
    nurseUserId: number,
    ) {
    const result = await this.dataSource.transaction(async manager => {
        const orderRepository =
        manager.getRepository(MedicationOrder);

        const administrationRepository =
        manager.getRepository(MedicationAdministration);

        const userRepository =
        manager.getRepository(User);

        // Bloquear la prescripción durante la operación.
        const order = await orderRepository.findOne({
            where: { id: orderId },
            relations: {
                admission: true,
            },
            lock: {
                mode: 'pessimistic_write',
            },
        });

        if (!order) {
            throw new NotFoundException(
                'Prescripción médica no encontrada.',
            );
        }

        if (order.status !== MedicationOrderStatus.ACTIVA) {
            throw new BadRequestException(
                'La prescripción no se encuentra activa.',
            );
        }

        if (
          order.admission.status !== AdmissionStatus.ACTIVA ||
          order.admission.dischargeDate !== null
        ) {
            throw new BadRequestException(
                'La internación del paciente no se encuentra activa o ya tiene un egreso registrado.'
            );
        }

        const nurse = await userRepository.findOne({
            where: {
                id: nurseUserId,
                role: Role.ENFERMERO,
                isActive: true,
            },
        });

        if (!nurse) {
            throw new ForbiddenException(
                'El usuario no es un enfermero activo.',
            );
        }

        const scheduledAt = new Date(dto.scheduledAt);

        if (Number.isNaN(scheduledAt.getTime())) {
            throw new BadRequestException(
                'El horario programado no es válido.',
            );
        }

        const startTime = new Date(order.startAt).getTime();
        const scheduledTime = scheduledAt.getTime();
        const interval =
        order.frequencyHours * 60 * 60 * 1000;

        if (interval <= 0 || scheduledTime < startTime) {
            throw new BadRequestException(
                'La dosis no corresponde a la programación de esta prescripción.',
            );
        }

        const occurrence = Math.round(
            (scheduledTime - startTime) / interval,
        );

        const expectedTime = startTime + occurrence * interval;

        if (Math.abs(expectedTime - scheduledTime) > 1) {
            throw new BadRequestException(
                'El horario no corresponde a una dosis programada.',
            );
        }

        if (
            order.endAt &&
            scheduledTime > new Date(order.endAt).getTime()
        ) {
            throw new BadRequestException(
                'La dosis está fuera del período de la prescripción.',
            );
        }

        // Margen permitido: 30 minutos antes y después.
        const now = Date.now();
        const tolerance = 30 * 60 * 1000;

        if (
            now < scheduledTime - tolerance ||
            now > scheduledTime + tolerance
        ) {
            throw new BadRequestException(
                'La administración debe realizarse dentro de los 30 minutos anteriores o posteriores al horario programado.',
            );
        }

        // Evitar duplicados.
        const existing = await administrationRepository.findOne({
            where: {
                medicationOrderId: orderId,
                scheduledAt,
            },
        });

        if (existing) {
            throw new ConflictException(
                'Esta dosis ya fue administrada.',
            );
        }

        const administration = administrationRepository.create({
            medicationOrderId: orderId,
            nurseUserId,
            scheduledAt,
            notes: dto.notes?.trim() || null,
        });

        const saved = await administrationRepository.save(
            administration,
        );

        const savedAdministration = await administrationRepository.findOne({
            where: { id: saved.id },
            relations: {
                nurse: true,
                medicationOrder: {
                    patient: true,
                    doctor: true,
                },
            },
        });
    

        if (!savedAdministration) {
            throw new NotFoundException(
            'No se pudo recuperar la administración registrada.',
            );
        }

        return {
            id: savedAdministration.id,
            medicationOrderId: savedAdministration.medicationOrderId,
            scheduledAt: savedAdministration.scheduledAt,
            administeredAt: savedAdministration.administeredAt,
            notes: savedAdministration.notes,
            nurse: savedAdministration.nurse
            ? {
                id: savedAdministration.nurse.id,
                email: savedAdministration.nurse.email,
                firstName: savedAdministration.nurse.firstName,
                lastName: savedAdministration.nurse.lastName,
                role: savedAdministration.nurse.role,
            }
            : null,
            medicationOrder: savedAdministration.medicationOrder,
        };
    });
    this.eventEmitter.emit('medication.administered', {
      administrationId: result.id,
    });

    return result;
    }

    async findAdministrationHistory() {
  const repository = this.dataSource.getRepository(
    MedicationAdministration,
  );

  const administrations = await repository.find({
    relations: {
      nurse: true,
      medicationOrder: {
        patient: true,
        doctor: true,
        admission: {
          room: true,
        },
      },
    },
    order: {
      administeredAt: 'DESC',
    },
    });

    return administrations.map(item => ({
        id: item.id,
        medicationOrderId: item.medicationOrderId,
        scheduledAt: item.scheduledAt,
        administeredAt: item.administeredAt,
        notes: item.notes,

        nurse: item.nurse
        ? {
            id: item.nurse.id,
            firstName: item.nurse.firstName,
            lastName: item.nurse.lastName,
            }
        : null,

        medicationOrder: item.medicationOrder
        ? {
            id: item.medicationOrder.id,
            medicationName: item.medicationOrder.medicationName,
            dosage: item.medicationOrder.dosage,

            patient: item.medicationOrder.patient
                ? {
                    id: item.medicationOrder.patient.id,
                    firstName: item.medicationOrder.patient.firstName,
                    lastName: item.medicationOrder.patient.lastName,
                    dni: item.medicationOrder.patient.dni,
                }
                : null,

            doctor: item.medicationOrder.doctor
                ? {
                    firstName: item.medicationOrder.doctor.firstName,
                    lastName: item.medicationOrder.doctor.lastName,
                }
                : null,

            admission: item.medicationOrder.admission
                ? {
                    id: item.medicationOrder.admission.id,
                    room: item.medicationOrder.admission.room
                    ? {
                        roomNumber:
                            item.medicationOrder.admission.room.roomNumber,
                        }
                    : null,
                }
                : null,
            }
        : null,
        }));
    }
}
