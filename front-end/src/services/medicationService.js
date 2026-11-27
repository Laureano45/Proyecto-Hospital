import api from './api'

// Obtener las dosis programadas para el enfermero
export const obtenerMedicamentosPendientes = async (date) => {
  const params = date ? { date } : {}

  const response = await api.get('/medication/pending', { params })

  return response.data
}

// Registrar la administración de una dosis
export const registrarAdministracion = async (medicationOrderId, datos) => {
  const response = await api.post(`/medication/orders/${medicationOrderId}/administrations`, datos)

  return response.data
}

export const obtenerHistorialAdministraciones = async () => {
  const response = await api.get('/medication/administrations')
  return response.data
}

export const obtenerMedicamentosVencidos = async (date) => {
  const params = date ? { date } : {}
  const response = await api.get('/medication/overdue', { params })
  return response.data
}
