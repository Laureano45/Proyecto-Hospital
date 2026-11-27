import type { Paciente } from './patientService'
import type { Medico } from './doctorService'

export interface Paciente {
  id: number
  firstName: string
  lastName: string
  dni: string
  phone: string
  email: string
}

export interface Turno {
  id: number
  patientId: number
  doctorId: number
  appointmentDate: string
  appointmentTime: string
  durationMinutes: number
  isOverbooking: boolean
  status: EstadoTurno

  patient: {
    id: number
    firstName: string
    lastName: string
    dni: string
    phone: string
    email: string
  }
  doctor: {
    id: number
    firstName: string
    lastName: string
    specialty: string
  }
}

export interface DatosReserva {
  patientId: number
  doctorId: number
  appointmentDate: string
  appointmentTime: string
}

export interface HorarioDisponible {
  appointmentTime: string
}

export function obtenerHorariosDisponibles(
  doctorId: number,
  date: string,
): Promise<HorarioDisponible[]>

export function reservarTurno(datos: DatosReserva): Promise<Turno>

export function obtenerMisTurnos(): Promise<Turno[]>

export function obtenerMisPacientes(): Promise<Paciente[]>

export type EstadoTurno =
  'PROGRAMADO' | 'CONFIRMADO' | 'EN_SALA_DE_ESPERA' | 'ATENDIDO' | 'CANCELADO'

export declare function confirmarTurno(id: number): Promise<Turno>

export declare function registrarLlegada(id: number): Promise<Turno>

export declare function marcarComoAtendido(id: number): Promise<Turno>

export declare function cancelarTurno(id: number): Promise<Turno>

export declare function obtenerTodosLosTurnos(): Promise<Turno[]>

export interface CrearEntreturnoDTO {
  patientId: number
  doctorId: number
  appointmentDate: string
  beforeAppointmentId: number
  afterAppointmentId: number
}

export function insertarEntreturno(datos: CrearEntreturnoDTO): Promise<Turno>
