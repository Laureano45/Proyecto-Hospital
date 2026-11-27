import api from './api'

export const obtenerHorariosDisponibles = async (doctorId, date) => {
  const response = await api.get('/appointments/availability', {
    params: {
      doctorId,
      date,
    },
  })

  console.log('HORARIOS RECIBIDOS:', response.data)

  return response.data
}

export const reservarTurno = async (appointment) => {
  const response = await api.post('/appointments', appointment)

  return response.data
}

export const obtenerMisTurnos = async () => {
  const response = await api.get('/appointments/my-appointments')
  return response.data
}

export const obtenerMisPacientes = async () => {
  const response = await api.get('/appointments/my-patients')
  return response.data
}

// Confirmar un turno
export const confirmarTurno = async (id) => {
  const response = await api.patch(`/appointments/${id}/confirm`)
  return response.data
}

// Registrar la llegada del paciente
export const registrarLlegada = async (id) => {
  const response = await api.patch(`/appointments/${id}/check-in`)
  return response.data
}

// Marcar un turno como atendido
export const marcarComoAtendido = async (id) => {
  const response = await api.patch(`/appointments/${id}/attend`)
  return response.data
}

// Cancelar un turno
export const cancelarTurno = async (id) => {
  const response = await api.patch(`/appointments/${id}/cancel`)
  return response.data
}

export const obtenerTodosLosTurnos = async () => {
  const response = await api.get('/appointments')
  return response.data
}

export const insertarEntreturno = async (datos) => {
  const response = await api.post('/appointments/overbooking', datos)
  return response.data
}
