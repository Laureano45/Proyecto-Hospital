import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsGateway } from './rooms.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { Room } from './entities/room.entity';
import { Bed } from './entities/bed.entity';

import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([
      Room,
      Bed,
    ]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService, RoomsGateway],
})
export class RoomsModule {}