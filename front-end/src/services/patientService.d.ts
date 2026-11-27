export interface Paciente {
  id: number
  firstName: string
  lastName: string
  dni: string
  phone: string
  email: string
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

export interface AlergiaPaciente {
  id: number
  patientId: number
  allergen: string
  severity: 'leve' | 'moderada' | 'grave'
}

export interface CrearAlergiaDTO {
  allergen: string
  severity: 'leve' | 'moderada' | 'grave'
}

export function obtenerAlergiasPaciente(patientId: number): Promise<AlergiaPaciente[]>

export function registrarAlergiaPaciente(
  patientId: number,
  alergia: CrearAlergiaDTO,
): Promise<AlergiaPaciente>

export interface AntecedenteFamiliar {
  id: number
  patientId: number
  relative: string
  condition: string
  observations: string | null
}

export interface CrearAntecedenteFamiliarDTO {
  relative: string
  condition: string
  observations?: string
}

export function obtenerAntecedentesFamiliares(patientId: number): Promise<AntecedenteFamiliar[]>

export function registrarAntecedenteFamiliar(
  patientId: number,
  antecedente: CrearAntecedenteFamiliarDTO,
): Promise<AntecedenteFamiliar>
