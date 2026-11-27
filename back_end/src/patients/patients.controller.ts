import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  NotFoundException,
  UseGuards
} from '@nestjs/common'

import { PatientsService } from './patients.service'
import { CreatePatientDto } from './dto/create-patient.dto'
import { CreatePatientAllergyDto } from './dto/create-patient-allergy.dto'
import { CreatePatientFamilyHistoryDto } from './dto/create-patient-family-history.dto'

import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../users/roles.decorator'
import { Role } from '../users/roles.enum'

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECEPCIONISTA)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService
  ) {}

  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto)
  }

  @Get()
  findAll() {
    return this.patientsService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const patient = await this.patientsService.findOne(id)

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado')
    }

    return patient
  }

  @Post(':patientId/allergies')
  @Roles(Role.MEDICO)
  createAllergy(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreatePatientAllergyDto,
  ) {
    return this.patientsService.createAllergy(patientId, dto)
  }

  @Get(':patientId/allergies')
  @Roles(Role.MEDICO, Role.RECEPCIONISTA)
  findAllergies(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.patientsService.findAllergies(patientId)
  }

  @Post(':patientId/family-history')
  @Roles(Role.MEDICO)
  createFamilyHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreatePatientFamilyHistoryDto,
  ) {
    return this.patientsService.createFamilyHistory(patientId, dto)
  }

  @Get(':patientId/family-history')
  @Roles(Role.MEDICO, Role.RECEPCIONISTA)
  findFamilyHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.patientsService.findFamilyHistory(patientId)
  }
}
