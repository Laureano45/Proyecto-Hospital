import api from './api'

// Obtener todas las habitaciones
export const obtenerHabitaciones = async () => {
  const response = await api.get('/rooms')
  return response.data
}

// Obtener habitaciones con camas disponibles
export const obtenerHabitacionesDisponibles = async () => {
  const response = await api.get('/rooms/available')
  return response.data
}

export const obtenerMapaCamas = async () => {
  const response = await api.get('/rooms/bed-map')
  return response.data
}

export const bloquearCama = async (id, reason) => {
  const response = await api.patch(`/rooms/beds/${id}/block`, {
    reason,
  })

  return response.data
}

export const desbloquearCama = async (id) => {
  const response = await api.patch(`/rooms/beds/${id}/unblock`)

  return response.data
}

// Obtener camas pendientes de limpieza
export const obtenerCamasPendientesLimpieza = async () => {
  const response = await api.get('/rooms/beds/pending-cleaning')
  return response.data
}

// Confirmar limpieza de una cama
export const confirmarLimpiezaCama = async (id) => {
  const response = await api.patch(`/rooms/beds/${id}/clean`)
  return response.data
}
