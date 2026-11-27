import api from './api'

export const registrarDiagnostico = async (datos) => {
  const response = await api.post('/clinical-history', datos)
  return response.data
}

export const obtenerHistorialClinico = async (patientId) => {
  const response = await api.get(`/clinical-history/patient/${patientId}`)
  return response.data
}
