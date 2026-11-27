import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  Req,
  Request
} from '@nestjs/common';

import { NursingTasksService } from './nursing-tasks.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/roles.enum';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    role: Role;
  };
}

@Controller('nursing-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NursingTasksController {
  constructor(
    private readonly nursingTasksService: NursingTasksService
  ) {}

  // ENFERMERÍA: consultar tareas activas
  @Get()
  @Roles(Role.ENFERMERO)
  findActiveTasks() {
    return this.nursingTasksService.findActiveTasks();
  }

  // MÉDICOS: consultar historial de sus internaciones
  @Get('doctor/history')
  @Roles(Role.MEDICO)
  findDoctorHistory(
    @Req() req: AuthenticatedRequest
  ) {
    return this.nursingTasksService.findTasksByDoctor(
      req.user.userId
    );
  }

  // MÉDICOS: crear tareas para sus internaciones
  @Post('doctor')
  @Roles(Role.MEDICO)
  createByDoctor(
    @Req() req: AuthenticatedRequest,
    @Body() body: {
      admissionId: number;
      title: string;
      description: string;
      frequency?: string;
    }
  ) {
    return this.nursingTasksService.createByDoctor(
      req.user.userId,
      body
    );
  }

  // ENFERMERÍA: iniciar tarea
  @Patch(':id/start')
  @Roles(Role.ENFERMERO)
  start(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.nursingTasksService.start(id);
  }

  // ENFERMERÍA: completar tarea
  @Patch(':id/complete')
  @Roles(Role.ENFERMERO)
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest
  ) {
    return this.nursingTasksService.complete(
      id,
      req.user.userId
    );
  }

  // ENFERMERÍA: cancelar tarea
  @Patch(':id/cancel')
  @Roles(Role.ENFERMERO)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string
  ) {
    return this.nursingTasksService.cancel(id, reason);
  }
}
