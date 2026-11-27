import { BaseAppointmentState } from './base-appointment.state'
import { AppointmentStatus } from './appointment-status.enum'

export class ProgramadoState extends BaseAppointmentState {
  readonly status = AppointmentStatus.PROGRAMADO

  confirm(): AppointmentStatus {
    return AppointmentStatus.CONFIRMADO
  }

  cancel(): AppointmentStatus {
    return AppointmentStatus.CANCELADO
  }
}
