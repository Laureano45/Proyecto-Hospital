import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { MedicationService } from './medication.service';
import { CreateMedicationOrderDto } from './dto/create-medication-order.dto';
import { AdministerMedicationDto } from './dto/administer-medication.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/roles.enum';

@Controller('medication')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicationController {
  constructor(
    private readonly medicationService: MedicationService,
  ) {}

  @Post('orders')
  @Roles(Role.MEDICO)
  createOrder(
    @Body() dto: CreateMedicationOrderDto,
    @Req() req: any,
  ) {
    return this.medicationService.createOrder(
      dto,
      req.user.doctorId,
    );
  }
    @Get('pending')
    @Roles(Role.ENFERMERO)
    findPending(@Query('date') date?: string) {
    return this.medicationService.findPendingForNurse(date);
  }

  @Get('overdue')
  @Roles(Role.ENFERMERO)
  findOverdue(@Query('date') date?: string) {
    return this.medicationService.findOverdueForNurse(date);
  }

  @Post('orders/:id/administrations')
  @Roles(Role.ENFERMERO)
  administerDose(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdministerMedicationDto,
    @Req() req: any,
  ) {
    return this.medicationService.administerDose(
      id,
      dto,
      req.user.userId,
    );
  }

  @Get('administrations')
  @Roles(Role.ENFERMERO)
  findAdministrationHistory() {
    return this.medicationService.findAdministrationHistory();
  }
}
