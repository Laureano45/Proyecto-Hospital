export interface CrearSignosVitalesDTO {
  patientId: number
  admissionId: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  temperature: number
}

export interface SignosVitales {
  id: number
  patientId: number
  admissionId: number
  nurseUserId: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  temperature: number | string
  recordedAt: string
  nursingNote: string

  admission?: {
    room?: {
      roomNumber: string
    }
  }

  nurse: {
    id: number
    firstName: string
    lastName: string
  }
}

export function registrarSignosVitales(datos: CrearSignosVitalesDTO): Promise<SignosVitales>

export function obtenerSignosVitalesPaciente(patientId: number): Promise<SignosVitales[]>

export function obtenerSignosVitalesInternacion(admissionId: number): Promise<SignosVitales[]>
