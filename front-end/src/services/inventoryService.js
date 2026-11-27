import api from './api'

export const obtenerStocks = async () => {
  const { data } = await api.get('/inventory/stocks')
  return data
}

export const obtenerMovimientos = async () => {
  const { data } = await api.get('/inventory/movements')
  return data
}

export const registrarInsumo = async (datos) => {
  const { data } = await api.post('/inventory/supplies', datos)
  return data
}

export const actualizarStock = async (supplyId, datos) => {
  const { data } = await api.put(`/inventory/supplies/${supplyId}/stock`, datos)
  return data
}
