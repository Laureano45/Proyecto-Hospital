import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ClinicalHistoryService } from './clinical-history.service';
import { CreateClinicalRecordDto } from './dto/create-clinical-record.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/roles.enum';

@Controller('clinical-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicalHistoryController {
  constructor(
    private readonly clinicalHistoryService: ClinicalHistoryService,
  ) {}

  @Post()
  @Roles(Role.MEDICO)
  create(
    @Body() dto: CreateClinicalRecordDto,
    @Req() req: any,
  ) {
    return this.clinicalHistoryService.create(
      dto,
      req.user.userId,
    );
  }

  @Get('patient/:patientId')
  @Roles(Role.MEDICO)
  findByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.clinicalHistoryService.findByPatient(patientId);
  }

  @Get()
  @Roles(Role.MEDICO)
  findAll() {
    return this.clinicalHistoryService.findAll();
  }
}
