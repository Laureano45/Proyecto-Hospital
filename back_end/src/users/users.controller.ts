import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from './roles.decorator';
import { Role } from './roles.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  desactivarUsuario(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.desactivarUsuario(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activarUsuario(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.activarUsuario(id);
  }
}
