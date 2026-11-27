export interface Habitacion {
  id: number
  roomNumber: string
  capacity: number
  description: string | null
  isActive: boolean

  beds: Cama[]

  availableBeds: number
  occupiedBeds: number
}

export type EstadoCama = 'libre' | 'ocupada' | 'en_limpieza' | 'bloqueada'

export interface Cama {
  id: number
  roomId: number
  bedNumber: string
  status: EstadoCama
  blockReason: string | null
  cleanedAt: string | null
  cleanedByUserId: number | null
}

export function obtenerHabitaciones(): Promise<Habitacion[]>
export function obtenerHabitacionesDisponibles(): Promise<Habitacion[]>
export function obtenerMapaCamas(): Promise<Habitacion[]>
export function bloquearCama(id: number, reason: string): Promise<Cama>
export function desbloquearCama(id: number): Promise<Cama>

export interface CamaPendienteLimpieza extends Cama {
  room?: {
    id: number
    roomNumber: string
  }
}

export function obtenerCamasPendientesLimpieza(): Promise<CamaPendienteLimpieza[]>
export function confirmarLimpiezaCama(id: number): Promise<Cama>
