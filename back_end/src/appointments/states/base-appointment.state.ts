import { BadRequestException } from '@nestjs/common'
import { AppointmentState } from './appointment-state.interface'
import { AppointmentStatus } from './appointment-status.enum'

export abstract class BaseAppointmentState
  implements AppointmentState {

  abstract readonly status: AppointmentStatus

  confirm(): AppointmentStatus {
    throw new BadRequestException(
      `No se puede confirmar un turno en estado ${this.status}`
    )
  }

  checkIn(): AppointmentStatus {
    throw new BadRequestException(
      `No se puede registrar la llegada en estado ${this.status}`
    )
  }

  attend(): AppointmentStatus {
    throw new BadRequestException(
      `No se puede atender un turno en estado ${this.status}`
    )
  }

  cancel(): AppointmentStatus {
    throw new BadRequestException(
      `No se puede cancelar un turno en estado ${this.status}`
    )
  }
}
