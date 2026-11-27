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

import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { BlockBedDto } from './dto/block-bed.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../users/roles.decorator';
import { Role } from '../users/roles.enum';

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(Role.RECEPCIONISTA)
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  @Roles(Role.RECEPCIONISTA)
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('bed-map')
  @Roles(
    Role.ADMIN,
    Role.RECEPCIONISTA,
  )
  findBedMap() {
    return this.roomsService.findBedMap();
  }

  @Get('available')
  @Roles(Role.RECEPCIONISTA)
  findAvailable() {
    return this.roomsService.findAvailable();
  }

  @Get('beds/pending-cleaning')
  @Roles(Role.MAESTRANZA)
  findPendingCleaning() {
    return this.roomsService.findPendingCleaning();
  }

  @Patch('beds/:id/clean')
  @Roles(Role.MAESTRANZA)
  confirmCleaning(
    @Param('id', ParseIntPipe) bedId: number,
    @Req() req: Request & { user: { userId: number } }
  ) {
    return this.roomsService.confirmCleaning(
      bedId,
      req.user['userId']
    );
  }

  @Patch('beds/:id/block')
  @Roles(Role.ADMIN)
  blockBed(
    @Param('id', ParseIntPipe) bedId: number,
    @Body() dto: BlockBedDto
  ) {
    return this.roomsService.blockBed(
      bedId,
      dto.reason
    );
  }

  @Patch('beds/:id/unblock')
  @Roles(Role.ADMIN)
  unblockBed(
    @Param('id', ParseIntPipe) bedId: number
  ) {
    return this.roomsService.unblockBed(bedId);
  }
}
