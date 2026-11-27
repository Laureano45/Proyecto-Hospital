import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, IsNull } from 'typeorm';

import { Admission } from './entities/admission.entity';
import { AdmissionStatus } from './entities/admission-status.enum';
import { Room } from '../rooms/entities/room.entity';
import { Patient } from '../patients/Entities/patient.entity';
import { Doctor } from '../doctors/Entities/doctor.entity';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { AdmissionType } from './entities/admission-type.enum';
import { NursingTask } from '../nursing-tasks/entities/nursing-task.entity';
import { PreOpProtocolBuilder } from '../nursing-tasks/builders/pre-op-protocol.builder';
import { RespiratoryProtocolBuilder } from '../nursing-tasks/builders/respiratory-protocol.builder';
import { Bed, BedStatus } from '../rooms/entities/bed.entity';
import { RoomsGateway } from '../rooms/rooms.gateway';

@Injectable()
export class AdmissionsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Admission)
    private readonly admissionRepository: Repository<Admission>,

    private readonly preOpProtocolBuilder: PreOpProtocolBuilder,
    private readonly respiratoryProtocolBuilder: RespiratoryProtocolBuilder,

    private readonly roomsGateway: RoomsGateway
  ) {}

  async create(dto: CreateAdmissionDto) {
    const result = await this.dataSource.transaction(async manager => {
      const patient = await manager.findOne(Patient, {
        where: { id: dto.patientId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!patient) {
        throw new NotFoundException('Paciente no encontrado.');
      }

      const room = await manager.findOne(Room, {
        where: { id: dto.roomId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!room || !room.isActive) {
        throw new NotFoundException(
          'Habitación inexistente o inactiva.'
        );
      }

      let doctorId: number;

      if (dto.doctorId) {
        // Recepción seleccionó un médico
        const doctor = await manager.findOne(Doctor, {
          where: { id: dto.doctorId },
          relations: { user: true }
        });

        if (!doctor || !doctor.user) {
          throw new NotFoundException(
            'El médico seleccionado no existe o no tiene un usuario asociado.'
          );
        }

        doctorId = doctor.id;

      } else {
        // Buscar el médico con menos internaciones activas
        const medicoMenosAsignado = await manager
          .createQueryBuilder(Doctor, 'doctor')
          .innerJoin('doctor.user', 'user')
          .leftJoin(
            Admission,
            'admission',
            `admission.doctorId = doctor.id
            AND admission.status IN (:...estadosActivos)
            AND admission.dischargeDate IS NULL`,
            {
              estadosActivos: [
                AdmissionStatus.ACTIVA,
                AdmissionStatus.ALTA_MEDICA_SOLICITADA
              ]
            }
          )
          .select('doctor.id', 'doctorId')
          .addSelect('COUNT(admission.id)', 'cantidad')
          .groupBy('doctor.id')
          .orderBy('COUNT(admission.id)', 'ASC')
          .addOrderBy('doctor.id', 'ASC')
          .getRawOne<{ doctorId: number; cantidad: string }>();

        if (!medicoMenosAsignado) {
          throw new NotFoundException(
            'No hay médicos disponibles para asignar la internación.'
          );
        }

        doctorId = Number(medicoMenosAsignado.doctorId);
      }

      const internaciones = await manager.find(Admission, {
        where: {
          patientId: dto.patientId,
          status: In([
            AdmissionStatus.ACTIVA,
            AdmissionStatus.ALTA_MEDICA_SOLICITADA
          ]),
          dischargeDate: IsNull()
        }
      });

      if (internaciones.length > 0) {
        throw new ConflictException(
          'El paciente ya tiene una internación sin finalizar.'
        );
      }

      const camaLibre = await manager
        .getRepository(Bed)
        .createQueryBuilder('bed')
        .setLock('pessimistic_write')
        .where('bed.roomId = :roomId', { roomId: room.id })
        .andWhere('bed.status = :status', {
          status: BedStatus.LIBRE
        })
        .orderBy('bed.id', 'ASC')
        .getOne();

      if (!camaLibre) {
        throw new BadRequestException(
          'La habitación no tiene camas disponibles.'
        );
      }

      const admission = manager.create(Admission, {
        patientId: patient.id,
        roomId: room.id,
        bedId: camaLibre.id,
        doctorId,
        status: AdmissionStatus.ACTIVA,
        admissionType: dto.admissionType ?? AdmissionType.GENERAL,
        initialDiagnosis: dto.initialDiagnosis?.trim() || null,
        medicalDischargeDate: null,
        medicalDischargeDoctorId: null,
        dischargeDate: null
      });

      const savedAdmission = await manager.save(Admission, admission);
      camaLibre.status = BedStatus.OCUPADA;
      const savedBed = await manager.save(Bed, camaLibre);

      if (savedAdmission.admissionType === AdmissionType.PRE_QUIRURGICO) {
        const tasks = this.preOpProtocolBuilder.build(savedAdmission.id);

        const nursingTasks = manager.create(NursingTask, tasks);

        await manager.save(NursingTask, nursingTasks);
      }

      const diagnosis = (savedAdmission.initialDiagnosis ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

      if (diagnosis.includes('neumonia')) {
        const respiratoryTasks =
          this.respiratoryProtocolBuilder.build(savedAdmission.id);

        const nursingTasks = manager.create(
          NursingTask,
          respiratoryTasks
        );

        await manager.save(NursingTask, nursingTasks);
      }

      return {
        admission: savedAdmission,
        bed: savedBed,
      };
    });
    
    this.roomsGateway.emitBedUpdate('bed.occupied', {
      bedId: result.bed.id,
      roomId: result.bed.roomId,
      bedNumber: result.bed.bedNumber,
      status: result.bed.status,
      admissionId: result.admission.id,
      patientId: result.admission.patientId,
    });

    return result.admission;
  }

  async findAll() {
    return this.admissionRepository.find({
      relations: { patient: true, room: true },
      order: { admissionDate: 'DESC' }
    });
  }

  async findActive() {
    return this.admissionRepository.find({
      where: {
        status: In([
          AdmissionStatus.ACTIVA,
          AdmissionStatus.ALTA_MEDICA_SOLICITADA
        ]),
        dischargeDate: IsNull()
      },
      relations: { patient: true, room: true },
      order: { admissionDate: 'DESC' }
    });
  }

  async findActiveByDoctor(userId: number) {
    return this.admissionRepository
      .createQueryBuilder('admission')
      .leftJoinAndSelect('admission.patient', 'patient')
      .leftJoinAndSelect('admission.room', 'room')
      .innerJoin('admission.doctor', 'doctor')
      .innerJoin('doctor.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('admission.status IN (:...statuses)', {
        statuses: [
          AdmissionStatus.ACTIVA,
          AdmissionStatus.ALTA_MEDICA_SOLICITADA
        ]
      })
      .andWhere('admission.dischargeDate IS NULL')
      .orderBy('admission.admissionDate', 'DESC')
      .getMany()
  }

  async requestDischarge(
    admissionId: number,
    doctorId: number | null
  ) {
    if (!doctorId) {
      throw new BadRequestException(
        'El usuario autenticado no tiene un médico asociado.'
      );
    }

    return this.dataSource.transaction(async manager => {
      const admission = await manager.findOne(Admission, {
        where: { id: admissionId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!admission) {
        throw new NotFoundException(
          'Internación no encontrada.'
        );
      }

      if (
        admission.status !== AdmissionStatus.ACTIVA ||
        admission.dischargeDate !== null
      ) {
        throw new BadRequestException(
          'Solamente se puede solicitar el alta de una internación activa y sin egreso registrado.'
        );
      }

      admission.status = AdmissionStatus.ALTA_MEDICA_SOLICITADA;
      admission.medicalDischargeDate = new Date();
      admission.medicalDischargeDoctorId = doctorId;

      return manager.save(Admission, admission);
    });
  }

  async discharge(admissionId: number) {
    const result = await this.dataSource.transaction(async manager => {
      const admission = await manager.findOne(Admission, {
        where: { id: admissionId },
        relations: { patient: true, room: true },
        lock: { mode: 'pessimistic_write' }
      });

      if (!admission) {
        throw new NotFoundException(
          'Internación no encontrada.'
        );
      }

      if (
        admission.status !== AdmissionStatus.ALTA_MEDICA_SOLICITADA ||
        admission.dischargeDate !== null
      ) {
        throw new BadRequestException(
          'No se puede confirmar el egreso sin una solicitud de alta médica pendiente.'
        );
      }

      if (!admission.bedId) {
        throw new BadRequestException(
          'La internación no tiene una cama asignada.'
        );
      }

      const bed = await manager.findOne(Bed, {
        where: { id: admission.bedId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!bed || bed.status !== BedStatus.OCUPADA) {
        throw new BadRequestException(
          'La cama no existe o no se encuentra ocupada.'
        );
      }

      admission.status = AdmissionStatus.ALTA;
      admission.dischargeDate = new Date();

      bed.status = BedStatus.EN_LIMPIEZA;

      const savedBed = await manager.save(Bed, bed);
      const savedAdmission = await manager.save(Admission, admission);

      return {
        admission: savedAdmission,
        bed: savedBed,
      };
    });

    this.roomsGateway.emitBedUpdate('bed.cleaning', {
      bedId: result.bed.id,
      roomId: result.bed.roomId,
      bedNumber: result.bed.bedNumber,
      status: result.bed.status,
      admissionId: result.admission.id,
      patientId: result.admission.patientId,
    });

    return result.admission;
  }
}
