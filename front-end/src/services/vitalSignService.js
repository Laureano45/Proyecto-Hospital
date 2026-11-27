import api from './api'

export const registrarSignosVitales = async (datos) => {
  const response = await api.post('/vital-signs', datos)
  return response.data
}

export const obtenerSignosVitalesPaciente = async (patientId) => {
  const response = await api.get(`/vital-signs/patient/${patientId}`)
  return response.data
}

export const obtenerSignosVitalesInternacion = async (admissionId) => {
  const response = await api.get(`/vital-signs/admission/${admissionId}`)
  return response.data
}
