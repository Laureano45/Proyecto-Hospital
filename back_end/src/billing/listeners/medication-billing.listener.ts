import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { BillingService } from '../billing.service';

interface MedicationAdministeredEvent {
  administrationId: number;
}

@Injectable()
export class MedicationBillingListener {
  private readonly logger = new Logger(
    MedicationBillingListener.name,
  );

  constructor(
    private readonly billingService: BillingService,
  ) {}

  @OnEvent('medication.administered', { async: true })
  async handleMedicationAdministered(
    event: MedicationAdministeredEvent,
  ) {
    try {
      const result =
        await this.billingService.chargeMedicationAdministration(
          event.administrationId,
        );

      this.logger.log(
        `Facturación procesada para administración ${event.administrationId}. ${JSON.stringify(result)}`,
      );
    } catch (error) {
      this.logger.error(
        `No se pudo generar el cargo para la administración ${event.administrationId}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
