export interface Usuario {
  id: number
  email: string
  role: 'recepcionista' | 'medico'
  firstName: string
  lastName: string
  doctorId: number | null
}

export function iniciarSesion(email: string, password: string): Promise<Usuario>

export function cerrarSesion(): void

export function obtenerUsuario(): Usuario | null

export function obtenerToken(): string | null
