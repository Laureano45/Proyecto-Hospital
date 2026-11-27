export interface PacienteCuenta {
  id: number
  firstName: string
  lastName: string
  dni?: string
  coverage?: {
    id: number
    name: string
    type: string
  } | null
}

export interface CargoCuenta {
  id: number
  accountId: number
  supplyId: number
  category: string
  description: string
  quantity: number
  unitPrice: number
  totalAmount: number
  sourceAdministrationId: number
  consumedAt: string
  supply?: {
    id: number
    name: string
  }
}

export interface InternacionCuenta {
  id: number
  patientId: number
  roomId: number
  bedId: number | null
  admissionDate: string
  status: string

  patient?: {
    id: number
    firstName: string
    lastName: string
  }

  room?: {
    id: number
    roomNumber: string
  }

  bed?: {
    id: number
    bedNumber: string
  } | null
}

export interface CuentaInternacion {
  id: number
  admissionId: number
  status: 'activa' | 'cerrada'
  openedAt: string
  closedAt: string | null
  admission: InternacionCuenta | null
  charges: CargoCuenta[]
  totalCharges: number
}

export interface FacturaPaciente {
  id: number
  patientId: number
  patientNameSnapshot: string
  coverageNameSnapshot: string
  serviceNameSnapshot: string
  baseAmount: number
  patientAmount: number
  payerAmount: number
  status: 'pendiente' | 'pagada' | 'anulada'
  issuedAt: string
}

export interface ResumenCuenta {
  totalCharges: number
  totalInvoiced: number
  pendingPatientInvoices: number
  chargesCount: number
  invoicesCount: number
}

export interface DetalleCuentaPaciente {
  patient: PacienteCuenta
  accounts: CuentaInternacion[]
  invoices: FacturaPaciente[]
  summary: ResumenCuenta
}

export function obtenerCuentas(): Promise<CuentaInternacion[]>

export function obtenerCuentaPaciente(patientId: number): Promise<DetalleCuentaPaciente>
