import api from './api'

// Obtener internaciones activas
export const obtenerInternacionesActivas = async () => {
  const response = await api.get('/admissions/active')
  return response.data
}

// Obtener todas las internaciones, incluidas las dadas de alta
export const obtenerTodasLasInternaciones = async () => {
  const response = await api.get('/admissions')
  return response.data
}

// Registrar una nueva internación
export const crearInternacion = async (datos) => {
  const response = await api.post('/admissions', datos)
  return response.data
}

// Solicitar alta médica (acción del médico)
export const solicitarAltaMedica = async (admissionId) => {
  const response = await api.patch(`/admissions/${admissionId}/request-discharge`)
  return response.data
}

// Confirmar egreso administrativo (acción de recepción)
export const darAltaMedica = async (admissionId) => {
  const response = await api.patch(`/admissions/${admissionId}/discharge`)
  return response.data
}

export const obtenerMisInternacionesActivas = async () => {
  const response = await api.get('/admissions/doctor/active')
  return response.data
}
