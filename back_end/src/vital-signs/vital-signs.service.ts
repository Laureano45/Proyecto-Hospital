import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { VitalSign } from './entities/vital-sign.entity';
import { Admission } from '../admissions/entities/admission.entity';
import { AdmissionStatus } from '../admissions/entities/admission-status.enum';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';

@Injectable()
export class VitalSignsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(VitalSign)
    private readonly vitalSignRepository: Repository<VitalSign>
  ) {}

  async create(dto: CreateVitalSignDto, nurseUserId: number) {
    return this.dataSource.transaction(async manager => {
      const admission = await manager.findOne(Admission, {
        where: { id: dto.admissionId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!admission) {
        throw new NotFoundException(
          'Internación no encontrada.'
        );
      }

      if (
        admission.status !== AdmissionStatus.ACTIVA &&
        admission.status !== AdmissionStatus.ALTA_MEDICA_SOLICITADA
      ) {
        throw new BadRequestException(
          'No se pueden registrar controles en una internación finalizada.'
        );
      }

      if (admission.patientId !== dto.patientId) {
        throw new BadRequestException(
          'El paciente no corresponde a esta internación.'
        );
      }

      const nursingNote =
        `Control de signos vitales realizado correctamente. ` +
        `Paciente ID: ${dto.patientId}. ` +
        `Enfermero usuario ID: ${nurseUserId}.`;

      const vitalSign = manager.create(VitalSign, {
        ...dto,
        nurseUserId,
        nursingNote
      });

      return manager.save(VitalSign, vitalSign);
    });
  }

  async findByPatient(patientId: number) {
    return this.vitalSignRepository.find({
      where: { patientId },
      relations: {
        patient: true,
        admission: {
          room: true
        },
        nurse: true
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
          lastName: true
        },
        admission: {
          id: true,
          roomId: true,
          room: {
            id: true,
            roomNumber: true
          }
        },
        nurse: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      },
      order: { recordedAt: 'DESC' }
    });
  }

  async findByAdmission(admissionId: number) {
    return this.vitalSignRepository.find({
      where: { admissionId },
      relations: {
        patient: true,
        admission: {
          room: true
        },
        nurse: true
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
          lastName: true
        },
        admission: {
          id: true,
          roomId: true,
          room: {
            id: true,
            roomNumber: true
          }
        },
        nurse: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      },
      order: { recordedAt: 'DESC' }
    });
  }
}
