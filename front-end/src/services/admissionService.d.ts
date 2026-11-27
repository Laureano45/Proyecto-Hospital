import type { Paciente } from './patientService'

export interface HabitacionInternacion {
  id: number
  roomNumber: string
}

export interface Internacion {
  id: number
  patientId: number
  roomId: number
  patient: Paciente
  room: HabitacionInternacion
  admissionDate: string
  dischargeDate: string | null
  status: 'activa' | 'alta_medica_solicitada' | 'alta'
  medicalDischargeDate: string | null
  medicalDischargeDoctorId: number | null
}

export function obtenerInternacionesActivas(): Promise<Internacion[]>
export function obtenerTodasLasInternaciones(): Promise<Internacion[]>
export function darAltaMedica(admissionId: number): Promise<Internacion>
export function solicitarAltaMedica(admissionId: number): Promise<Internacion>
export function crearInternacion(datos: {
  patientId: number
  roomId: number
  doctorId?: number
}): Promise<Internacion>

export function obtenerMisInternacionesActivas(): Promise<Internacion[]>
