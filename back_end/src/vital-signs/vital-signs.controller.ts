import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  Request,
} from '@nestjs/common';

import { VitalSignsService } from './vital-signs.service';
import { CreateVitalSignDto } from './dto/create-vital-sign.dto';

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

@Controller('vital-signs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VitalSignsController {
  constructor(
    private readonly vitalSignsService: VitalSignsService
  ) {}

  @Post()
  @Roles(Role.ENFERMERO)
  create(
    @Body() dto: CreateVitalSignDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.vitalSignsService.create(
      dto,
      req.user.userId
    );
  }

  @Get('patient/:patientId')
  @Roles(Role.ENFERMERO, Role.MEDICO)
  findByPatient(
    @Param('patientId', ParseIntPipe) patientId: number
  ) {
    return this.vitalSignsService.findByPatient(patientId);
  }

  @Get('admission/:admissionId')
  @Roles(Role.ENFERMERO, Role.MEDICO)
  findByAdmission(
    @Param('admissionId', ParseIntPipe) admissionId: number
  ) {
    return this.vitalSignsService.findByAdmission(admissionId);
  }
}
