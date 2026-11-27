import api from './api'

export const iniciarSesion = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  })

  const { access_token, user } = response.data

  localStorage.setItem('token', access_token)
  localStorage.setItem('usuario', JSON.stringify(user))

  return user
}

export const cerrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}

export const obtenerUsuario = () => {
  const usuario = localStorage.getItem('usuario')

  return usuario ? JSON.parse(usuario) : null
}

export const obtenerToken = () => {
  return localStorage.getItem('token')
}
