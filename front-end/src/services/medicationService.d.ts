export interface EnfermeroMedicamento {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
}

export interface AdministracionMedicamento {
  id: number
  administeredAt: string
  nurse: EnfermeroMedicamento | null
}

export interface MedicamentoPendiente {
  medicationOrderId: number
  patientId: number
  patient: {
    id: number
    firstName: string
    lastName: string
    dni: string
    phone: string
    email: string
  }
  admission: {
    id: number
    room: {
      roomNumber: string
    }
  }
  doctor: {
    id: number
    firstName: string
    lastName: string
    specialty: string
  }
  medicationName: string
  dosage: string
  frequencyHours: number
  scheduledAt: string
  status: 'pendiente' | 'administrada' | 'vencida'
  administration: AdministracionMedicamento | null
}

export interface MedicamentoVencido extends Omit<
  MedicamentoPendiente,
  'status' | 'administration'
> {
  status: 'vencida'
  administration: null
}

export interface RegistrarAdministracionDTO {
  scheduledAt: string
  notes?: string
}

export function obtenerMedicamentosPendientes(date?: string): Promise<MedicamentoPendiente[]>
export function obtenerMedicamentosVencidos(date?: string): Promise<MedicamentoVencido[]>

export function registrarAdministracion(
  medicationOrderId: number,
  datos: RegistrarAdministracionDTO,
): Promise<unknown>

export interface HistorialAdministracionMedicamento {
  id: number
  medicationOrderId: number
  scheduledAt: string
  administeredAt: string
  notes: string | null
  nurse: {
    id: number
    firstName: string
    lastName: string
  } | null
  medicationOrder: {
    id: number
    medicationName: string
    dosage: string
    patient: {
      id: number
      firstName: string
      lastName: string
      dni: string
    } | null
    doctor: {
      firstName: string
      lastName: string
    } | null
    admission: {
      id: number
      room: {
        roomNumber: string
      } | null
    } | null
  } | null
}

export function obtenerHistorialAdministraciones(): Promise<HistorialAdministracionMedicamento[]>
