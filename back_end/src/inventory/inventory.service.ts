import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import { Supply } from './entities/supply.entity';
import { SupplyStock } from './entities/supply-stock.entity';
import { SupplyMovement } from './entities/supply-movement.entity';

import { CreateSupplyDto } from './dto/create-supply.dto';
import { SetSupplyStockDto } from './dto/set-supply-stock.dto';

import { MedicationAdministration } from '../medication/entities/medication-administration.entity';

@Injectable()
export class InventoryService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async consumeMedicationAdministration(administrationId: number) {
    return this.dataSource.transaction(async manager => {

      const administration = await manager.findOne(
        MedicationAdministration,
        {
          where: { id: administrationId },
          relations: {
            medicationOrder: {
              admission: {
                room: true,
              },
            },
          },
        },
      );

      if (!administration) {
        throw new NotFoundException(
          'Administración de medicamento no encontrada.',
        );
      }

      const order = administration.medicationOrder;
      const medicationName = order.medicationName.trim();
      const roomNumber = order.admission.room.roomNumber;

      // El primer dígito del número de habitación identifica el piso.
      const floor = Number(roomNumber.charAt(0));

      if (!Number.isInteger(floor) || floor < 1) {
        throw new BadRequestException(
          'No se pudo identificar el piso de la habitación.',
        );
      }

      // Buscar el insumo por nombre, ignorando mayúsculas y espacios.
      const supply = await manager
        .getRepository(Supply)
        .createQueryBuilder('supply')
        .where('LOWER(TRIM(supply.name)) = LOWER(TRIM(:name))', {
          name: medicationName,
        })
        .andWhere('supply.isActive = :active', { active: true })
        .getOne();

      if (!supply) {
        throw new NotFoundException(
          `El insumo "${medicationName}" no está registrado en inventario.`,
        );
      }

      const stock = await manager.findOne(SupplyStock, {
        where: {
          supplyId: supply.id,
          floor,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!stock) {
        throw new NotFoundException(
          `No existe stock de ${medicationName} para el piso ${floor}.`,
        );
      }

      // Comprobar nuevamente después del bloqueo para evitar
      // descuentos duplicados ante eventos concurrentes.
      const existingMovement = await manager.findOne(
        SupplyMovement,
        {
          where: { administrationId },
        },
      );

      if (existingMovement) {
        return {
          message: 'Esta administración ya fue descontada del inventario.',
          duplicated: true,
          stock: stock.quantity,
        };
      }

      if (stock.quantity < 1) {
        throw new BadRequestException(
          `Stock insuficiente de ${medicationName} en el piso ${floor}.`,
        );
      }

      const previousStock = stock.quantity;

      // Descuento dentro de la misma transacción.
      stock.quantity -= 1;

      await manager.save(SupplyStock, stock);

      const movement = manager.create(SupplyMovement, {
        supplyId: supply.id,
        supplyStockId: stock.id,
        administrationId,
        quantity: -1,
        previousStock,
        resultingStock: stock.quantity,
        type: 'consumo',
      });

      await manager.save(SupplyMovement, movement);

      return {
        message: 'Stock descontado correctamente.',
        duplicated: false,
        medicationName,
        floor,
        previousStock,
        resultingStock: stock.quantity,
        administrationId,
      };
    });
  }

    async createSupply(dto: CreateSupplyDto) {
    const repository = this.dataSource.getRepository(Supply);

    const name = dto.name.trim();

    const existing = await repository
        .createQueryBuilder('supply')
        .where('LOWER(TRIM(supply.name)) = LOWER(TRIM(:name))', {
        name,
        })
        .getOne();

    if (existing) {
        throw new ConflictException(
        'Ya existe un insumo con ese nombre.',
        );
    }

    return repository.save(
        repository.create({
        name,
        description: dto.description?.trim() || null,
        }),
    );
    }

    async setStock(supplyId: number, dto: SetSupplyStockDto) {
    return this.dataSource.transaction(async manager => {
        const supply = await manager.findOne(Supply, {
        where: {
            id: supplyId,
            isActive: true,
        },
        });

        if (!supply) {
        throw new NotFoundException('Insumo no encontrado.');
        }

        let stock = await manager.findOne(SupplyStock, {
        where: {
            supplyId,
            floor: dto.floor,
        },
        lock: {
            mode: 'pessimistic_write',
        },
        });

        const previousStock = stock?.quantity ?? 0;

        if (!stock) {
        stock = manager.create(SupplyStock, {
            supplyId,
            floor: dto.floor,
            quantity: 0,
        });
        }

        stock.quantity = dto.quantity;

        const savedStock = await manager.save(SupplyStock, stock);

        const difference = dto.quantity - previousStock;

        if (difference > 0) {
        const movement = manager.create(SupplyMovement, {
            supplyId,
            supplyStockId: savedStock.id,
            administrationId: null,
            quantity: difference,
            previousStock,
            resultingStock: dto.quantity,
            type: 'entrada',
        });

        await manager.save(SupplyMovement, movement);
        }

        return {
        supply: supply.name,
        floor: dto.floor,
        previousStock,
        resultingStock: dto.quantity,
        };
    });
    }

    async findAllStocks() {
    return this.dataSource.getRepository(SupplyStock).find({
        relations: {
        supply: true,
        },
        order: {
        floor: 'ASC',
        supplyId: 'ASC',
        },
    });
    }

    async findMovements() {
    return this.dataSource.getRepository(SupplyMovement).find({
        relations: {
        supply: true,
        supplyStock: true,
        administration: true,
        },
        order: {
        createdAt: 'DESC',
        },
    });
    }

}
