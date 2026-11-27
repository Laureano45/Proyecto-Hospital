
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Appointment } from './Entities/Appointment.entity';
import { Patient } from '../patients/Entities/patient.entity';
import { Doctor } from '../doctors/Entities/doctor.entity';
import { CreateAppointmentDto } from './dto/Create-Appointment.dto';

import { AppointmentStatus } from './states/appointment-status.enum';
import { AppointmentStateFactory } from './states/appointment-state.factory';
import { CreateOverbookingDto } from './dto/create-overbooking.dto';

type AppointmentAction =
  | 'confirm'
  | 'checkIn'
  | 'attend'
  | 'cancel';

@Injectable()
export class AppointmentsService {

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,

    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,

    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    private readonly dataSource: DataSource
  ) {}

  private readonly schedules = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '15:00',
    '16:00'
  ];

  // Estados que mantienen ocupado un horario
  private readonly activeStatuses = [
    AppointmentStatus.PROGRAMADO,
    AppointmentStatus.CONFIRMADO,
    AppointmentStatus.EN_SALA_DE_ESPERA
  ];

  // Consultar horarios disponibles
  async getAvailableSlots(doctorId: number, date: string) {

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Fecha inválida');
    }

    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId }
    });

    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    const reserved = await this.appointmentRepository.find({
      where: {
        doctorId,
        appointmentDate: date,
        status: In(this.activeStatuses)
      }
    });

    const occupiedHours = reserved.map(
      appointment => appointment.appointmentTime.substring(0, 5)
    );

    return this.schedules.filter(
      hour => !occupiedHours.includes(hour)
    );
  }

  // Registrar reserva
  
async create(dto: CreateAppointmentDto) {
  return this.dataSource.transaction(async manager => {

    const doctor = await manager.findOne(Doctor, {
      where: { id: dto.doctorId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    const patient = await manager.findOne(Patient, {
      where: { id: dto.patientId }
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const selectedDate = new Date(
      `${dto.appointmentDate}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate < today
    ) {
      throw new BadRequestException(
        'No se pueden reservar turnos en fechas pasadas'
      );
    }

    if (!this.schedules.includes(dto.appointmentTime)) {
      throw new BadRequestException(
        'El horario seleccionado no es válido'
      );
    }

    const inicio = this.horaAMinutos(dto.appointmentTime);
    const fin = inicio + 30;

    const existentes = await manager.find(Appointment, {
      where: {
        doctorId: doctor.id,
        appointmentDate: dto.appointmentDate,
        status: In(this.activeStatuses)
      }
    });

    const conflicto = existentes.some(turno => {
      const inicioExistente = this.horaAMinutos(
        turno.appointmentTime
      );

      const finExistente =
        inicioExistente + turno.durationMinutes;

      return inicio < finExistente && fin > inicioExistente;
    });

    if (conflicto) {
      throw new ConflictException(
        'El horario se superpone con otro turno'
      );
    }

    const appointment = manager.create(Appointment, {
      patientId: patient.id,
      doctorId: doctor.id,
      patient,
      doctor,
      appointmentDate: dto.appointmentDate,
      appointmentTime: dto.appointmentTime,
      durationMinutes: 30,
      isOverbooking: false,
      status: AppointmentStatus.PROGRAMADO
    });

    return manager.save(Appointment, appointment);
  });
}


  // Consultar todos los turnos
  async findAll() {
    return this.appointmentRepository.find({
      relations: {
        patient: true,
        doctor: true
      },
      order: {
        appointmentDate: 'ASC',
        appointmentTime: 'ASC'
      }
    });
  }

  // Obtener los turnos del médico
  async findByDoctor(doctorId: number) {
    return this.appointmentRepository.find({
      where: {
        doctorId
      },
      relations: {
        patient: true,
        doctor: true
      },
      order: {
        appointmentDate: 'ASC',
        appointmentTime: 'ASC'
      }
    });
  }

  // Obtener pacientes con turnos activos del médico
  async findPatientsByDoctor(doctorId: number) {
    return this.patientRepository
      .createQueryBuilder('patient')
      .innerJoin('patient.appointments', 'appointment')
      .where('appointment.doctorId = :doctorId', {
        doctorId
      })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: this.activeStatuses
      })
      .select([
        'patient.id',
        'patient.firstName',
        'patient.lastName',
        'patient.dni',
        'patient.phone',
        'patient.email'
      ])
      .distinct(true)
      .orderBy('patient.lastName', 'ASC')
      .addOrderBy('patient.firstName', 'ASC')
      .getMany();
  }

// Cambiar el estado de un turno utilizando State
async changeStatus(
  appointmentId: number,
  action: AppointmentAction,
  doctorId?: number
) {
  const appointment = await this.appointmentRepository.findOne({
    where: {
      id: appointmentId
    },
    relations: {
      patient: true,
      doctor: true
    }
  });

  if (!appointment) {
    throw new NotFoundException('Turno no encontrado');
  }

  // Si la operación la realiza un médico,
  // comprobar que el turno le pertenece.
  if (
    action === 'attend' &&
    appointment.doctorId !== doctorId
  ) {
    throw new BadRequestException(
      'No podés atender un turno que pertenece a otro médico'
    );
  }

  const currentState = AppointmentStateFactory.create(
    appointment.status
  );

  switch (action) {
    case 'confirm':
      appointment.status = currentState.confirm();
      break;

    case 'checkIn':
      appointment.status = currentState.checkIn();
      break;

    case 'attend':
      appointment.status = currentState.attend();
      break;

    case 'cancel':
      appointment.status = currentState.cancel();
      break;

    default:
      throw new BadRequestException(
        'Acción de turno no válida'
      );
  }

  return this.appointmentRepository.save(appointment);
}

private horaAMinutos(hora: string): number {
  const [horas, minutos] = hora.substring(0, 5).split(':').map(Number);
  return horas * 60 + minutos;
}

private minutosAHora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  return `${String(horas).padStart(2, '0')}:${String(resto).padStart(2, '0')}:00`;
}

// Insertar un entreturno de urgencia menor
async createOverbooking(dto: CreateOverbookingDto) {
  return this.dataSource.transaction(async manager => {

    // Bloquear al médico para serializar operaciones
    // de inserción de entreturnos sobre su agenda.
    const doctor = await manager.findOne(Doctor, {
      where: { id: dto.doctorId },
      lock: { mode: 'pessimistic_write' }
    });

    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    const patient = await manager.findOne(Patient, {
      where: { id: dto.patientId }
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const fecha = new Date(`${dto.appointmentDate}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (Number.isNaN(fecha.getTime()) || fecha < hoy) {
      throw new BadRequestException(
        'No se pueden insertar entreturnos en fechas pasadas'
      );
    }

    if (
      dto.beforeAppointmentId === dto.afterAppointmentId
    ) {
      throw new BadRequestException(
        'Debés seleccionar dos turnos diferentes'
      );
    }

    const before = await manager.findOne(Appointment, {
      where: {
        id: dto.beforeAppointmentId,
        doctorId: dto.doctorId,
        appointmentDate: dto.appointmentDate
      },
      lock: { mode: 'pessimistic_write' }
    });

    const after = await manager.findOne(Appointment, {
      where: {
        id: dto.afterAppointmentId,
        doctorId: dto.doctorId,
        appointmentDate: dto.appointmentDate
      },
      lock: { mode: 'pessimistic_write' }
    });

    if (!before || !after) {
      throw new NotFoundException(
        'No se encontraron los dos turnos seleccionados para ese médico y fecha'
      );
    }

    // Solo se pueden comprimir turnos que todavía
    // no comenzaron a atenderse.
    const estadosPermitidos = [
      AppointmentStatus.PROGRAMADO,
      AppointmentStatus.CONFIRMADO
    ];

    if (
      !estadosPermitidos.includes(before.status) ||
      !estadosPermitidos.includes(after.status)
    ) {
      throw new BadRequestException(
        'Los turnos seleccionados deben estar programados o confirmados'
      );
    }

    if (
      before.durationMinutes !== 30 ||
      after.durationMinutes !== 30
    ) {
      throw new BadRequestException(
        'Los dos turnos deben tener una duración original de 30 minutos'
      );
    }

    const inicioBefore = this.horaAMinutos(before.appointmentTime);
    const inicioAfter = this.horaAMinutos(after.appointmentTime);

    // Los turnos deben ser consecutivos.
    if (inicioBefore + 30 !== inicioAfter) {
      throw new BadRequestException(
        'Los turnos seleccionados no son consecutivos o no tienen 30 minutos de separación'
      );
    }

    // Distribución: 22 + 15 + 23 = 60 minutos.
    const inicioUrgencia = inicioBefore + 22;
    const finUrgencia = inicioUrgencia + 15;
    const finAfter = inicioAfter + 30;

    // Comprobar que no existan otros turnos que se
    // superpongan con los nuevos intervalos.
    const otrosTurnos = await manager
      .createQueryBuilder(Appointment, 'appointment')
      .where('appointment.doctorId = :doctorId', {
        doctorId: dto.doctorId
      })
      .andWhere('appointment.appointmentDate = :date', {
        date: dto.appointmentDate
      })
      .andWhere('appointment.status IN (:...statuses)', {
        statuses: this.activeStatuses
      })
      .andWhere('appointment.id NOT IN (:...ids)', {
        ids: [before.id, after.id]
      })
      .getMany();

    const intervalos = [
      { inicio: inicioBefore, fin: inicioUrgencia },
      { inicio: inicioUrgencia, fin: finUrgencia },
      { inicio: finUrgencia, fin: finAfter }
    ];

    for (const turno of otrosTurnos) {
      const inicio = this.horaAMinutos(turno.appointmentTime);
      const fin = inicio + turno.durationMinutes;

      const haySuperposicion = intervalos.some(intervalo =>
        inicio < intervalo.fin && fin > intervalo.inicio
      );

      if (haySuperposicion) {
        throw new ConflictException(
          'No se puede insertar el entreturno porque existe otro turno en ese intervalo'
        );
      }
    }

    // Comprimir el primer turno.
    before.durationMinutes = 22;

    // Desplazar el segundo turno y reducirlo a 23 minutos.
    after.appointmentTime = this.minutosAHora(finUrgencia);
    after.durationMinutes = 23;

    // Crear el nuevo entreturno.
    const urgentAppointment = manager.create(Appointment, {
      patientId: patient.id,
      doctorId: doctor.id,
      patient,
      doctor,
      appointmentDate: dto.appointmentDate,
      appointmentTime: this.minutosAHora(inicioUrgencia),
      durationMinutes: 15,
      isOverbooking: true,
      status: AppointmentStatus.PROGRAMADO
    });

    // Guardar todo dentro de la misma transacción.
    await manager.save(Appointment, before);
    await manager.save(Appointment, after);

    return manager.save(Appointment, urgentAppointment);
  });
}

}
