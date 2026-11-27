import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ClinicalHistory } from './entities/clinical-history.entity'
import { Patient } from '../patients/Entities/patient.entity'
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto'
import { VitalSign } from '../vital-signs/entities/vital-sign.entity'

@Injectable()
export class ClinicalHistoryService {
  constructor(
    @InjectRepository(ClinicalHistory)
    private readonly clinicalHistoryRepository: Repository<ClinicalHistory>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(VitalSign)
    private readonly vitalSignRepository: Repository<VitalSign>,
  ) {}

  async create(dto: CreateClinicalRecordDto, doctorUserId: number) {
    const patient = await this.patientRepository.findOne({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    if (!dto.diagnosis?.trim()) {
      throw new BadRequestException('El diagnóstico es obligatorio.');
    }

    let originalRecord: ClinicalHistory | null = null;

    if (dto.correctsRecordId !== undefined) {
      if (!dto.correctionReason?.trim()) {
        throw new BadRequestException(
          'El motivo de la rectificación es obligatorio.',
        );
      }

      originalRecord = await this.clinicalHistoryRepository.findOne({
        where: {
          id: dto.correctsRecordId,
          patientId: dto.patientId,
        },
      });

      if (!originalRecord) {
        throw new NotFoundException(
          'No se encontró la evolución original para este paciente.',
        );
      }

      if (originalRecord.correctsRecordId !== null) {
        throw new BadRequestException(
          'No se puede rectificar una evolución que ya es una rectificación.',
        );
      }
    } else if (dto.correctionReason?.trim()) {
      throw new BadRequestException(
        'Debe indicar qué evolución desea rectificar.',
      );
    }

    const record = this.clinicalHistoryRepository.create({
      patientId: dto.patientId,
      doctorUserId,
      diagnosis: dto.diagnosis.trim(),
      observations: dto.observations?.trim() || null,
      correctsRecordId: originalRecord?.id ?? null,
      correctionReason: originalRecord
        ? dto.correctionReason!.trim()
        : null,
    });

    return this.clinicalHistoryRepository.save(record);
  }

  async findByPatient(patientId: number) {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    return this.getTimeline(patientId);
  }

  async findAll() {
    return this.getTimeline();
  }

  private async getTimeline(patientId?: number) {
    const where = patientId !== undefined
      ? { patientId }
      : {};

    const [clinicalRecords, vitalSigns] = await Promise.all([

      // Registros médicos
      this.clinicalHistoryRepository.find({
        where,
        relations: {
        patient: true,
          doctor: {doctor: true},
          correctsRecord: true,
        },

       select: {
          id: true,
          patientId: true,
          doctorUserId: true,
          diagnosis: true,
          observations: true,
          recordedAt: true,
          correctsRecordId: true,
          correctionReason: true,

          patient: {
            id: true,
            firstName: true,
            lastName: true,
          },

          doctor: {
            id: true,
            email: true,
            role: true,

            doctor: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
      }),

      // Controles de enfermería
      this.vitalSignRepository.find({
        where,
        relations: {
          patient: true,
          admission: {
            room: true,
          },
          nurse: true,
        },
        select: {
          id: true,
          patientId: true,
          admissionId: true,
          nurseUserId: true,
          bloodPressureSystolic: true,
          bloodPressureDiastolic: true,
          heartRate: true,
          temperature: true,
          recordedAt: true,
          nursingNote: true,

          patient: {
            id: true,
            firstName: true,
            lastName: true,
          },

          admission: {
            id: true,
            roomId: true,
            room: {
              id: true,
              roomNumber: true,
            },
          },

          nurse: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      }),
    ]);

    // Unificar registros médicos y controles de enfermería
    const timeline = [
      ...clinicalRecords.map(record => ({
        ...record,
        type: 'medical',
      })),

      ...vitalSigns.map(sign => ({
        ...sign,
        type: 'vital_sign',
      })),
    ];

    // Ordenar cronológicamente: más recientes primero
    return timeline.sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() -
        new Date(a.recordedAt).getTime()
    );
  }
}
