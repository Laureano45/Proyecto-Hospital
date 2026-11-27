import { BaseAppointmentState } from './base-appointment.state'
import { AppointmentStatus } from './appointment-status.enum'

export class EnSalaEsperaState extends BaseAppointmentState {
  readonly status = AppointmentStatus.EN_SALA_DE_ESPERA

  attend(): AppointmentStatus {
    return AppointmentStatus.ATENDIDO
  }

  cancel(): AppointmentStatus {
    return AppointmentStatus.CANCELADO
  }
}
