import { BaseAppointmentState } from './base-appointment.state'
import { AppointmentStatus } from './appointment-status.enum'

export class ConfirmadoState extends BaseAppointmentState {
  readonly status = AppointmentStatus.CONFIRMADO

  checkIn(): AppointmentStatus {
    return AppointmentStatus.EN_SALA_DE_ESPERA
  }

  cancel(): AppointmentStatus {
    return AppointmentStatus.CANCELADO
  }
}
