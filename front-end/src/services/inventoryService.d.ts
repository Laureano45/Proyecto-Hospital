export interface Insumo {
  id: number
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
}

export interface StockInsumo {
  id: number
  supplyId: number
  supply: Insumo
  floor: number
  quantity: number
  createdAt: string
  updatedAt: string
}

export interface MovimientoInventario {
  id: number
  supplyId: number
  supply: Insumo
  supplyStockId: number
  supplyStock: StockInsumo
  administrationId: number | null
  quantity: number
  previousStock: number
  resultingStock: number
  type: string
  createdAt: string
}

export interface CrearInsumoDTO {
  name: string
  description?: string
}

export interface ActualizarStockDTO {
  floor: number
  quantity: number
}

export function obtenerStocks(): Promise<StockInsumo[]>

export function obtenerMovimientos(): Promise<MovimientoInventario[]>

export function registrarInsumo(datos: CrearInsumoDTO): Promise<Insumo>

export function actualizarStock(supplyId: number, datos: ActualizarStockDTO): Promise<unknown>
