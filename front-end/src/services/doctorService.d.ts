export interface Paciente {
  id: number
  firstName: string
  lastName: string
  dni: string
  phone: string
  email: string
}

export interface Medico {
  id: number
  firstName: string
  lastName: string
  specialty: string
  licenseNumber: string
}

export function obtenerPacientes(): Promise<Paciente[]>
export function obtenerPacientePorId(id: number): Promise<Paciente>

export function crearPaciente(paciente: {
  firstName: string
  lastName: string
  dni: string
  phone: string
  email: string
}): Promise<Paciente>

export function obtenerMedicos(): Promise<Medico[]>
export function obtenerMedicoPorId(id: number): Promise<Medico>
