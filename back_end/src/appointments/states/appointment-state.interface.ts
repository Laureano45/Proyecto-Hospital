import { AppointmentStatus } from './appointment-status.enum'

export interface AppointmentState {
  readonly status: AppointmentStatus

  confirm(): AppointmentStatus

  checkIn(): AppointmentStatus

  attend(): AppointmentStatus

  cancel(): AppointmentStatus
}
