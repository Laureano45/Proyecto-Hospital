
import {
  Injectable,
  ConflictException,
  BadRequestException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from './Entities/Appointment.entity';
import { CreateAppointmentDto } from './dto/Create-Appointment.dto';

@Injectable()
export class AppointmentsService {

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>
  ) {}

  // Horarios de atención
  private readonly schedules = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '15:00',
    '16:00'
  ];

  // Obtener horarios disponibles
  async getAvailableSlots(
    doctorId: number,
    date: string
  ) {

    if (!doctorId || !date) {
      throw new BadRequestException(
        'Debe indicar médico y fecha'
      );
    }

    const reservedAppointments =
      await this.appointmentRepository.find({
        where: {
          doctorId,
          appointmentDate: date,
          status: 'RESERVED'
        }
      });

    const reservedHours = reservedAppointments.map(
      appointment => appointment.appointmentTime.substring(0, 5)
    );

    return this.schedules.filter(
      hour => !reservedHours.includes(hour)
    );
  }

  // Crear una reserva
  async create(dto: CreateAppointmentDto) {

    const appointment = this.appointmentRepository.create({
      ...dto,
      status: 'RESERVED'
    });

    try {
      return await this.appointmentRepository.save(appointment);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'El horario seleccionado ya está reservado'
        );
      }

      throw error;
    }
  }
}
