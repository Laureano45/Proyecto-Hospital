export type RolPersonal = 'medico' | 'enfermero' | 'recepcionista' | 'maestranza'

export interface CrearUsuarioDto {
  email: string
  password: string
  firstName: string
  lastName: string
  role: RolPersonal
  specialty?: string
  licenseNumber?: string
}

export interface UsuarioCreado {
  id: number
  email: string
  firstName: string
  lastName: string
  role: RolPersonal
  doctor?: {
    id: number
    specialty: string
    licenseNumber: string
  } | null
  isActive: boolean
}

export function registrarUsuario(datos: CrearUsuarioDto): Promise<UsuarioCreado>
export function obtenerUsuarios(): Promise<UsuarioCreado[]>

export function desactivarUsuario(id: number): Promise<UsuarioCreado>
export function activarUsuario(id: number): Promise<UsuarioCreado>
