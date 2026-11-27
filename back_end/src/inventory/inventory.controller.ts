import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { InventoryService } from './inventory.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { SetSupplyStockDto } from './dto/set-supply-stock.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/roles.enum';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @Post('supplies')
  @Roles(Role.ADMIN)
  createSupply(@Body() dto: CreateSupplyDto) {
    return this.inventoryService.createSupply(dto);
  }

  @Put('supplies/:id/stock')
  @Roles(Role.ADMIN)
  setStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetSupplyStockDto,
  ) {
    return this.inventoryService.setStock(id, dto);
  }

  @Get('stocks')
  @Roles(Role.ADMIN)
  findAllStocks() {
    return this.inventoryService.findAllStocks();
  }

  @Get('movements')
  @Roles(Role.ADMIN)
  findMovements() {
    return this.inventoryService.findMovements();
  }
}
