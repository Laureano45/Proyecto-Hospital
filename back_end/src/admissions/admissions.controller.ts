import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe,
  Req
} from '@nestjs/common';

import { Request } from 'express';

import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/roles.enum';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    role: string;
    doctorId: number | null;
  };
}

@Controller('admissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdmissionsController {
  constructor(
    private readonly admissionsService: AdmissionsService
  ) {}

  @Post()
  @Roles(Role.RECEPCIONISTA)
  create(@Body() dto: CreateAdmissionDto) {
    return this.admissionsService.create(dto);
  }

  @Get()
  @Roles(Role.RECEPCIONISTA)
  findAll() {
    return this.admissionsService.findAll();
  }

  @Get('active')
  @Roles(Role.RECEPCIONISTA, Role.ENFERMERO, Role.MEDICO)
  findActive() {
    return this.admissionsService.findActive();
  }

  @Get('doctor/active')
  @Roles(Role.MEDICO)
  findActiveByDoctor(@Req() request: AuthenticatedRequest) {
    return this.admissionsService.findActiveByDoctor(request.user.userId);
  }

  @Patch(':id/request-discharge')
  @Roles(Role.MEDICO)
  requestDischarge(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest
  ) {
    return this.admissionsService.requestDischarge(
      id,
      request.user.doctorId
    );
  }

  @Patch(':id/discharge')
  @Roles(Role.RECEPCIONISTA)
  discharge(@Param('id', ParseIntPipe) id: number) {
    return this.admissionsService.discharge(id);
  }
}
