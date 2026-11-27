import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/roles.enum';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {

  constructor(
    private readonly billingService: BillingService,
  ) {}

  @Post('invoices')
  @Roles(Role.ADMIN, Role.RECEPCIONISTA)
  createInvoice(
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.billingService.createInvoice(dto);
  }

    @Get('accounts')
  @Roles(Role.ADMIN, Role.RECEPCIONISTA)
  findAccounts() {
    return this.billingService.findAccounts();
  }

  @Get('accounts/patient/:patientId')
  @Roles(Role.ADMIN, Role.RECEPCIONISTA)
  findPatientAccount(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.billingService.findPatientAccount(patientId);
  }
}
