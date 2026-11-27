import api from './api'

export const obtenerPacientes = async () => {
  const response = await api.get('/patients')

  return response.data
}

export const obtenerPacientePorId = async (id) => {
  const response = await api.get(`/patients/${id}`)

  return response.data
}

export const crearPaciente = async (paciente) => {
  const response = await api.post('/patients', paciente)
  return response.data
}

// Obtener alergias de un paciente
export const obtenerAlergiasPaciente = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/allergies`)

  return response.data
}

// Registrar alergia de un paciente
export const registrarAlergiaPaciente = async (patientId, alergia) => {
  const response = await api.post(`/patients/${patientId}/allergies`, alergia)

  return response.data
}

// Obtener antecedentes familiares de un paciente
export const obtenerAntecedentesFamiliares = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/family-history`)

  return response.data
}

// Registrar antecedente familiar de un paciente
export const registrarAntecedenteFamiliar = async (patientId, antecedente) => {
  const response = await api.post(`/patients/${patientId}/family-history`, antecedente)

  return response.data
}
