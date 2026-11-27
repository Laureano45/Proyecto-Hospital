import { AppointmentStatus } from './appointment-status.enum'
import { AppointmentState } from './appointment-state.interface'

import { ProgramadoState } from './programado.state'
import { ConfirmadoState } from './confirmado.state'
import { EnSalaEsperaState } from './en-sala-espera.state'
import { AtendidoState } from './atendido.state'
import { CanceladoState } from './cancelado.state'

export class AppointmentStateFactory {
  static create(status: AppointmentStatus): AppointmentState {
    switch (status) {
      case AppointmentStatus.PROGRAMADO:
        return new ProgramadoState()

      case AppointmentStatus.CONFIRMADO:
        return new ConfirmadoState()

      case AppointmentStatus.EN_SALA_DE_ESPERA:
        return new EnSalaEsperaState()

      case AppointmentStatus.ATENDIDO:
        return new AtendidoState()

      case AppointmentStatus.CANCELADO:
        return new CanceladoState()

      default:
        throw new Error(`Estado de turno desconocido: ${status}`)
    }
  }
}
