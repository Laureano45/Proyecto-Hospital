
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  Patch,
  Param,
} from '@nestjs/common';

import { CreateOverbookingDto } from './dto/create-overbooking.dto';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/Create-Appointment.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/roles.enum';

interface AuthenticatedRequest {
  user: {
    userId: number;
    email: string;
    role: Role;
    doctorId: number | null;
  };
}

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {

  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  // Horarios disponibles: solamente recepción
  @Get('availability')
  @Roles(Role.RECEPCIONISTA)
  getAvailableSlots(
    @Query('doctorId', ParseIntPipe) doctorId: number,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(
      doctorId,
      date,
    );
  }

  // Reservar turno: solamente recepción
  @Post()
  @Roles(Role.RECEPCIONISTA)
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  // Todos los turnos: solamente recepción
  @Get()
  @Roles(Role.RECEPCIONISTA)
  findAll() {
    return this.appointmentsService.findAll();
  }

  // Turnos del médico autenticado
  @Get('my-appointments')
  @Roles(Role.MEDICO)
  findMyAppointments(@Req() request: AuthenticatedRequest) {
    const doctorId = request.user.doctorId;

    if (!doctorId) {
      throw new ForbiddenException(
        'La cuenta no está vinculada a un médico',
      );
    }

    return this.appointmentsService.findByDoctor(doctorId);
  }

  // Pacientes del médico autenticado
  @Get('my-patients')
  @Roles(Role.MEDICO)
  findMyPatients(@Req() request: AuthenticatedRequest) {
    const doctorId = request.user.doctorId;

    if (!doctorId) {
      throw new ForbiddenException(
        'La cuenta no está vinculada a un médico',
      );
    }

    return this.appointmentsService.findPatientsByDoctor(doctorId);
  }

  // Confirmar un turno
  @Patch(':id/confirm')
  @Roles(Role.RECEPCIONISTA)
  confirmAppointment(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.appointmentsService.changeStatus(
      id,
      'confirm'
    );
  }

  // Registrar llegada del paciente
  @Patch(':id/check-in')
  @Roles(Role.RECEPCIONISTA)
  checkInAppointment(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.appointmentsService.changeStatus(
      id,
      'checkIn'
    );
  }

  // Marcar turno como atendido
  @Patch(':id/attend')
  @Roles(Role.MEDICO)
  attendAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: {
      user: {
        doctorId?: number;
      };
    }
  ) {
    const doctorId = req.user.doctorId;

    if (!doctorId) {
      throw new ForbiddenException(
        'El usuario no tiene un médico asociado'
      );
    }

    return this.appointmentsService.changeStatus(
      id,
      'attend',
      doctorId
    );
  }

  // Cancelar un turno
  @Patch(':id/cancel')
  @Roles(Role.RECEPCIONISTA)
  cancelAppointment(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.appointmentsService.changeStatus(
      id,
      'cancel'
    );
  }

  // Insertar un entreturno: solamente recepción
  @Post('overbooking')
  @Roles(Role.RECEPCIONISTA)
  createOverbooking(@Body() dto: CreateOverbookingDto) {
    return this.appointmentsService.createOverbooking(dto);
  }

}
