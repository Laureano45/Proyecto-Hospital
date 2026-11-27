export interface CrearDiagnosticoDTO {
  patientId: number
  diagnosis: string
  observations?: string
  correctsRecordId?: number
  correctionReason?: string
}

export interface PacienteHistoria {
  id: number
  firstName: string
  lastName: string
}

export interface MedicoHistoria {
  id: number
  email: string
  role: string
  doctor: {
    id: number
    firstName: string
    lastName: string
    specialty: string
  } | null
}

export interface EnfermeroHistoria {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  role: string
}

export interface RegistroMedico {
  id: number
  patientId: number
  doctorUserId: number
  patient: PacienteHistoria
  doctor: MedicoHistoria
  diagnosis: string
  observations: string | null
  recordedAt: string

  // Datos de rectificación
  correctsRecordId: number | null
  correctionReason: string | null

  type: 'medical'
}

export interface RegistroSignosVitales {
  id: number
  patientId: number
  admissionId: number
  nurseUserId: number
  patient: PacienteHistoria
  nurse: EnfermeroHistoria
  admission: {
    id: number
    roomId: number
    room: {
      id: number
      roomNumber: string
    } | null
  }
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  temperature: number | string
  recordedAt: string
  nursingNote: string
  type: 'vital_sign'
}

export function registrarDiagnostico(datos: CrearDiagnosticoDTO): Promise<unknown>

export function obtenerHistorialClinico(patientId: number): Promise<RegistroClinico[]>

export type RegistroClinico = RegistroMedico | RegistroSignosVitales
