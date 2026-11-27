import { Injectable } from '@nestjs/common';

import { NursingTask } from '../entities/nursing-task.entity';
import { NursingTaskStatus } from '../entities/nursing-task-status.enum';

@Injectable()
export class PreOpProtocolBuilder {
  build(admissionId: number): Partial<NursingTask>[] {
    return [
      {
        admissionId,
        title: 'Verificar ayuno de 8 horas',
        description:
          'Verificar y registrar que el paciente haya cumplido un ayuno de 8 horas antes del procedimiento quirúrgico.',
        frequency: 'Una vez',
        status: NursingTaskStatus.PENDIENTE
      },
      {
        admissionId,
        title: 'Colocar vía intravenosa periférica',
        description:
          'Realizar la colocación de una vía intravenosa periférica y registrar su realización.',
        frequency: 'Una vez',
        status: NursingTaskStatus.PENDIENTE
      },
      {
        admissionId,
        title: 'Controlar signos vitales',
        description:
          'Realizar y registrar el control de signos vitales del paciente.',
        frequency: 'Cada 2 horas',
        status: NursingTaskStatus.PENDIENTE
      }
    ];
  }
}
