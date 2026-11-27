export type EstadoTareaEnfermeria = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA'

export interface TareaEnfermeria {
  id: number
  admissionId: number
  title: string
  description: string
  frequency: string | null
  status: EstadoTareaEnfermeria
  reason: string | null
  startedAt: string | null
  completedAt: string | null
  completedByUserId: number | null
  createdAt: string

  admission?: {
    id: number
    patient?: {
      id: number
      firstName: string
      lastName: string
    }
    room?: {
      id: number
      roomNumber: string | number
    }
  }
}

export function obtenerTareasEnfermeria(): Promise<TareaEnfermeria[]>

export function iniciarTarea(taskId: number): Promise<TareaEnfermeria>

export function completarTarea(taskId: number): Promise<TareaEnfermeria>

export function cancelarTarea(taskId: number, reason: string): Promise<TareaEnfermeria>

export function obtenerHistorialTareasMedicas(): Promise<TareaEnfermeriaMedica[]>

export function crearTareaMedica(datos: CrearTareaMedicaDTO): Promise<TareaEnfermeriaMedica>

export interface TareaEnfermeriaMedica {
  id: number
  admissionId: number
  title: string
  description: string
  frequency: string | null
  status: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada'
  reason: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  createdByDoctorId: number | null
  createdByDoctor: {
    id: number
    firstName: string
    lastName: string
    specialty: string
  } | null
  completedBy: {
    id: number
    firstName: string | null
    lastName: string | null
  } | null
  admission: {
    id: number
    patient: {
      id: number
      firstName: string
      lastName: string
      dni: string
    }
    room: {
      roomNumber: string
    }
  }
}

export interface CrearTareaMedicaDTO {
  admissionId: number
  title: string
  description: string
  frequency?: string
}
