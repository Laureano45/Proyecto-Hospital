import {
  Injectable,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';

import { NursingTask } from './entities/nursing-task.entity';
import { NursingTaskStatus } from './entities/nursing-task-status.enum';
import { ForbiddenException } from '@nestjs/common';
import { Doctor } from '../doctors/Entities/doctor.entity';
import { Admission } from '../admissions/entities/admission.entity';

@Injectable()
export class NursingTasksService {
  constructor(
    @InjectRepository(NursingTask)
    private readonly nursingTaskRepository: Repository<NursingTask>,
    private readonly dataSource: DataSource
  ) {}

  async findActiveTasks() {
    return this.nursingTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.admission', 'admission')
      .leftJoinAndSelect('admission.patient', 'patient')
      .leftJoinAndSelect('admission.room', 'room')
      .where('admission.status IN (:...statuses)', {
        statuses: ['activa', 'alta_medica_solicitada']
      })
      .andWhere('admission.dischargeDate IS NULL')
      .orderBy('task.createdAt', 'ASC')
      .getMany();
  }

  private async findTaskForUpdate(
    manager: EntityManager,
    id: number
  ): Promise<NursingTask> {
    const task = await manager.findOne(NursingTask, {
      where: { id },
      relations: {
        admission: true
      },
      lock: {
        mode: 'pessimistic_write'
      }
    });

    if (!task) {
      throw new NotFoundException('La tarea de enfermería no existe.');
    }

    if (
      !task.admission ||
      !['activa', 'alta_medica_solicitada'].includes(
        task.admission.status
      ) ||
      task.admission.dischargeDate !== null
    ) {
      throw new BadRequestException(
        'No se pueden modificar tareas de una internación finalizada.'
      );
    }

    return task;
  }

  async start(id: number) {
    return this.dataSource.transaction(async manager => {
      const task = await this.findTaskForUpdate(manager, id);

      if (task.status !== NursingTaskStatus.PENDIENTE) {
        throw new BadRequestException(
          'Solo se pueden iniciar tareas pendientes.'
        );
      }

      task.status = NursingTaskStatus.EN_PROCESO;
      task.startedAt = new Date();

      return manager.save(NursingTask, task);
    });
  }

  async complete(id: number, nurseUserId: number) {
    return this.dataSource.transaction(async manager => {
      const task = await this.findTaskForUpdate(manager, id);

      if (task.status !== NursingTaskStatus.EN_PROCESO) {
        throw new BadRequestException(
          'Solo se pueden completar tareas que estén en proceso.'
        );
      }

      task.status = NursingTaskStatus.COMPLETADA;
      task.completedAt = new Date();
      task.completedByUserId = nurseUserId;

      return manager.save(NursingTask, task);
    });
  }

  async cancel(id: number, reason: string) {
    return this.dataSource.transaction(async manager => {
      const task = await this.findTaskForUpdate(manager, id);

      if (
        task.status !== NursingTaskStatus.PENDIENTE &&
        task.status !== NursingTaskStatus.EN_PROCESO
      ) {
        throw new BadRequestException(
          'Solo se pueden cancelar tareas pendientes o en proceso.'
        );
      }

      const justification = reason?.trim();

      if (!justification) {
        throw new BadRequestException(
          'Debe ingresar una justificación para cancelar la tarea.'
        );
      }

      if (justification.length > 1000) {
        throw new BadRequestException(
          'La justificación no puede superar los 1000 caracteres.'
        );
      }

      task.status = NursingTaskStatus.CANCELADA;
      task.reason = justification;

      return manager.save(NursingTask, task);
    });
  }
  async findTasksByDoctor(userId: number) {
    const doctor = await this.dataSource
      .getRepository(Doctor)
      .findOne({
        where: {
          user: { id: userId }
        },
        relations: {
          user: true
        }
      });

    if (!doctor) {
      throw new NotFoundException(
        'El usuario no tiene un médico asociado.'
      );
    }

    return this.nursingTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.admission', 'admission')
      .leftJoinAndSelect('admission.patient', 'patient')
      .leftJoinAndSelect('admission.room', 'room')
      .leftJoinAndSelect('task.createdByDoctor', 'createdByDoctor')
      .leftJoinAndSelect('task.completedBy', 'completedBy')
      .where('admission.doctorId = :doctorId', {
        doctorId: doctor.id
      })
      .orderBy('task.createdAt', 'DESC')
      .getMany();
  }

  async createByDoctor(
    userId: number,
    data: {
      admissionId: number;
      title: string;
      description: string;
      frequency?: string;
    }
  ) {
    const doctor = await this.dataSource
      .getRepository(Doctor)
      .findOne({
        where: {
          user: { id: userId }
        },
        relations: {
          user: true
        }
      });

    if (!doctor) {
      throw new NotFoundException(
        'El usuario no tiene un médico asociado.'
      );
    }

    const admission = await this.dataSource
      .getRepository(Admission)
      .findOne({
        where: {
          id: data.admissionId,
          doctorId: doctor.id
        }
      });

    if (!admission) {
      throw new ForbiddenException(
        'No podés crear tareas para una internación que no está asignada a tu usuario.'
      );
    }

    if (
      admission.status !== 'activa' &&
      admission.status !== 'alta_medica_solicitada'
    ) {
      throw new BadRequestException(
        'Solo se pueden crear tareas para internaciones activas.'
      );
    }

    if (admission.dischargeDate !== null) {
      throw new BadRequestException(
        'No se pueden crear tareas para una internación finalizada.'
      );
    }

    const title = data.title?.trim();
    const description = data.description?.trim();
    const frequency = data.frequency?.trim() || null;

    if (!title || title.length > 150) {
      throw new BadRequestException(
        'El título es obligatorio y no puede superar los 150 caracteres.'
      );
    }

    if (!description) {
      throw new BadRequestException(
        'La descripción de la tarea es obligatoria.'
      );
    }

    if (frequency && frequency.length > 50) {
      throw new BadRequestException(
        'La frecuencia no puede superar los 50 caracteres.'
      );
    }

    const task = this.nursingTaskRepository.create({
      admissionId: admission.id,
      title,
      description,
      frequency,
      status: NursingTaskStatus.PENDIENTE,
      createdByDoctorId: doctor.id,
      reason: null,
      startedAt: null,
      completedAt: null,
      completedByUserId: null
    });

    return this.nursingTaskRepository.save(task);
  }
}
