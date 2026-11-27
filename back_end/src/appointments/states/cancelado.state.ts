import { BaseAppointmentState } from './base-appointment.state'
import { AppointmentStatus } from './appointment-status.enum'

export class CanceladoState extends BaseAppointmentState {
  readonly status = AppointmentStatus.CANCELADO
}
