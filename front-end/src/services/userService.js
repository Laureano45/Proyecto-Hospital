import api from './api'

export const registrarUsuario = async (datos) => {
  const response = await api.post('/users', datos)
  return response.data
}

export const obtenerUsuarios = async () => {
  const response = await api.get('/users')
  return response.data
}

export const desactivarUsuario = async (id) => {
  const response = await api.patch(`/users/${id}/deactivate`)
  return response.data
}

export const activarUsuario = async (id) => {
  const response = await api.patch(`/users/${id}/activate`)
  return response.data
}
