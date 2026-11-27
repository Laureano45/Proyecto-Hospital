import api from './api'

// Obtener tareas de enfermería de internaciones activas
export const obtenerTareasEnfermeria = async () => {
  const response = await api.get('/nursing-tasks')

  return response.data
}

// Consultar historial de tareas de las internaciones del médico
export const obtenerHistorialTareasMedicas = async () => {
  const response = await api.get('/nursing-tasks/doctor/history')
  return response.data
}

// Crear una tarea de enfermería desde el panel médico
export const crearTareaMedica = async (datos) => {
  const response = await api.post('/nursing-tasks/doctor', datos)
  return response.data
}

// Iniciar una tarea
export const iniciarTarea = async (taskId) => {
  const response = await api.patch(`/nursing-tasks/${taskId}/start`)

  return response.data
}

// Completar una tarea
export const completarTarea = async (taskId) => {
  const response = await api.patch(`/nursing-tasks/${taskId}/complete`)

  return response.data
}

// Cancelar una tarea con justificación
export const cancelarTarea = async (taskId, reason) => {
  const response = await api.patch(`/nursing-tasks/${taskId}/cancel`, { reason })

  return response.data
}
