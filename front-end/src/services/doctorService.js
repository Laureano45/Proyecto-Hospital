import api from './api'

export const obtenerMedicos = async () => {
  const response = await api.get('/doctors')

  return response.data
}

export const obtenerMedicoPorId = async (id) => {
  const response = await api.get(`/doctors/${id}`)

  return response.data
}
