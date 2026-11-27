import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { InventoryService } from '../inventory.service';

interface MedicationAdministeredEvent {
  administrationId: number;
}

@Injectable()
export class MedicationAdministeredListener {
  private readonly logger = new Logger(
    MedicationAdministeredListener.name,
  );

  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @OnEvent('medication.administered', { async: true })
  async handleMedicationAdministered(
    event: MedicationAdministeredEvent,
  ) {
    try {
      const result =
        await this.inventoryService.consumeMedicationAdministration(
          event.administrationId,
        );

      this.logger.log(
        `Inventario actualizado para administración ${event.administrationId}. ${JSON.stringify(result)}`,
      );
    } catch (error) {
      this.logger.error(
        `No se pudo descontar el inventario para la administración ${event.administrationId}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
