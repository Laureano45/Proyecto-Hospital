import { BaseAppointmentState } from './base-appointment.state'
import { AppointmentStatus } from './appointment-status.enum'

export class AtendidoState extends BaseAppointmentState {
  readonly status = AppointmentStatus.ATENDIDO
}
