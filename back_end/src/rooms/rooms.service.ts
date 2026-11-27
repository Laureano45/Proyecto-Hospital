import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Room } from './entities/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { AdmissionStatus } from '../admissions/entities/admission-status.enum';
import { Bed, BedStatus } from './entities/bed.entity';
import { RoomsGateway } from './rooms.gateway';

@Injectable()
export class RoomsService {
  constructor(
  @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly dataSource: DataSource,

    private readonly roomsGateway: RoomsGateway
  ) {} 

  async create(dto: CreateRoomDto) {
    const existente = await this.roomRepository.findOne({
      where: { roomNumber: dto.roomNumber }
    });

    if (existente) {
      throw new ConflictException(
        'Ya existe una habitación con ese número.'
      );
    }

    return this.dataSource.transaction(async manager => {
      const roomRepository = manager.getRepository(Room);
      const bedRepository = manager.getRepository(Bed);

      const room = await roomRepository.save(
        roomRepository.create(dto)
      );

      const beds = Array.from(
        { length: room.capacity },
        (_, index) =>
          bedRepository.create({
            roomId: room.id,
            bedNumber: `${room.roomNumber}-${index + 1}`,
            status: BedStatus.LIBRE,
            blockReason: null,
          })
      );

      await bedRepository.save(beds);

      return {
        ...room,
        beds,
      };
    });
  }

  async findAll() {
    return this.roomRepository.find({
      order: { roomNumber: 'ASC' }
    });
  }

  async findAvailable() {
    const rooms = await this.roomRepository.find({
      where: { isActive: true },
      relations: { admissions: true },
      order: { roomNumber: 'ASC' }
    });

    return rooms.map(room => {
      const ocupacion = room.admissions.filter(
        admission =>
          (
            admission.status === AdmissionStatus.ACTIVA ||
            admission.status === AdmissionStatus.ALTA_MEDICA_SOLICITADA
          ) &&
          admission.dischargeDate === null
      ).length;

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        description: room.description,
        occupiedBeds: ocupacion,
        availableBeds: Math.max(0, room.capacity - ocupacion)
      };
    });
  }

  async findBedMap() {
    return this.dataSource.getRepository(Room).find({
      where: { isActive: true },
      relations: { beds: true },
      order: {
        roomNumber: 'ASC',
        beds: {
          bedNumber: 'ASC',
        },
      },
    });
  }

  async findPendingCleaning() {
    return this.dataSource
      .getRepository(Bed)
      .find({
        where: { status: BedStatus.EN_LIMPIEZA },
        relations: { room: true },
        order: { roomId: 'ASC', bedNumber: 'ASC' }
      });
  }

  async confirmCleaning(bedId: number, userId: number) {
    const bed = await this.dataSource.transaction(async manager => {
      const bed = await manager.findOne(Bed, {
        where: { id: bedId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!bed) {
        throw new NotFoundException('Cama no encontrada.');
      }

      if (bed.status !== BedStatus.EN_LIMPIEZA) {
        throw new BadRequestException(
          'Solamente se puede confirmar la limpieza de una cama en limpieza.'
        );
      }

      bed.status = BedStatus.LIBRE;
      bed.cleanedAt = new Date();
      bed.cleanedByUserId = userId;

      return manager.save(Bed, bed);
    });

    this.roomsGateway.emitBedUpdate('bed.cleaned', {
      bedId: bed.id,
      roomId: bed.roomId,
      bedNumber: bed.bedNumber,
      status: bed.status,
      cleanedAt: bed.cleanedAt,
      cleanedByUserId: bed.cleanedByUserId,
    });

    return bed;
  }

  async blockBed(bedId: number, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException(
        'Debe indicar el motivo del bloqueo.'
      );
    }

    const bed = await this.dataSource.transaction(async manager => {
      const bed = await manager.findOne(Bed, {
        where: { id: bedId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!bed) {
        throw new NotFoundException('Cama no encontrada.');
      }

      if (bed.status !== BedStatus.LIBRE) {
        throw new BadRequestException(
          'Solamente se pueden bloquear camas libres.'
        );
      }

      bed.status = BedStatus.BLOQUEADA;
      bed.blockReason = reason.trim();

      return manager.save(Bed, bed);
    });

    this.roomsGateway.emitBedUpdate('bed.blocked', {
      bedId: bed.id,
      roomId: bed.roomId,
      bedNumber: bed.bedNumber,
      status: bed.status,
      blockReason: bed.blockReason,
    });

    return bed;
  }

  async unblockBed(bedId: number) {
    const bed = await this.dataSource.transaction(async manager => {
      const bed = await manager.findOne(Bed, {
        where: { id: bedId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!bed) {
        throw new NotFoundException('Cama no encontrada.');
      }

      if (bed.status !== BedStatus.BLOQUEADA) {
        throw new BadRequestException(
          'Solamente se pueden desbloquear camas bloqueadas.'
        );
      }

      bed.status = BedStatus.LIBRE;
      bed.blockReason = null;

      return manager.save(Bed, bed);
    });

    this.roomsGateway.emitBedUpdate('bed.unblocked', {
      bedId: bed.id,
      roomId: bed.roomId,
      bedNumber: bed.bedNumber,
      status: bed.status,
    });

    return bed;
  }
}
