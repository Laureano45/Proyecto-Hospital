import { Injectable } from '@nestjs/common';

import { NursingTask } from '../entities/nursing-task.entity';
import { NursingTaskStatus } from '../entities/nursing-task-status.enum';

@Injectable()
export class RespiratoryProtocolBuilder {
  build(admissionId: number): Partial<NursingTask>[] {
    return [
      {
        admissionId,
        title: 'Monitoreo de saturación de oxígeno continuo',
        description:
          'Realizar monitoreo continuo de la saturación de oxígeno del paciente y registrar los valores obtenidos.',
        frequency: 'Continuo',
        status: NursingTaskStatus.PENDIENTE
      },
      {
        admissionId,
        title: 'Indicación de aislamiento de contacto y gotas',
        description:
          'Verificar e implementar las precauciones de aislamiento de contacto y gotas según el protocolo institucional y la indicación médica.',
        frequency: 'Según indicación médica',
        status: NursingTaskStatus.PENDIENTE
      }
    ];
  }
}
