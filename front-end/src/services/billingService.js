import api from './api'

export const obtenerCuentas = async () => {
  const { data } = await api.get('/billing/accounts')
  return data
}

export const obtenerCuentaPaciente = async (patientId) => {
  const { data } = await api.get(`/billing/accounts/patient/${patientId}`)
  return data
}
