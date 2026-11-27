<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { cerrarSesion } from '../services/authService'

import {
  obtenerStocks,
  obtenerMovimientos,
  registrarInsumo,
  actualizarStock
} from '../services/inventoryService'

import type {
  StockInsumo,
  MovimientoInventario,
  CrearInsumoDTO,
  ActualizarStockDTO
} from '../services/inventoryService'

const router = useRouter()

const stocks = ref<StockInsumo[]>([])
const movimientos = ref<MovimientoInventario[]>([])

const cargando = ref(false)
const guardando = ref(false)
const error = ref('')
const mensaje = ref('')

const busqueda = ref('')
const filtroPiso = ref('todos')

const mostrarFormularioInsumo = ref(false)
const mostrarFormularioStock = ref(false)

const nuevoInsumo = ref<CrearInsumoDTO>({
  name: '',
  description: ''
})

const stockSeleccionado = ref<StockInsumo | null>(null)
const cantidadStock = ref(0)
const pisoStock = ref(1)

const pisos = computed(() => {
  return [...new Set(stocks.value.map(stock => stock.floor))].sort(
    (a, b) => a - b
  )
})

const stocksFiltrados = computed(() => {
  return stocks.value.filter(stock => {
    const coincideNombre = stock.supply.name
      .toLowerCase()
      .includes(busqueda.value.toLowerCase())

    const coincidePiso =
      filtroPiso.value === 'todos' ||
      stock.floor === Number(filtroPiso.value)

    return coincideNombre && coincidePiso
  })
})

const totalUnidades = computed(() => {
  return stocks.value.reduce(
    (total, stock) => total + stock.quantity,
    0
  )
})

const insumosConStockBajo = computed(() => {
  return stocks.value.filter(stock => stock.quantity <= 5)
})

const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleString('es-AR')
}

const cargarDatos = async () => {
  cargando.value = true
  error.value = ''

  try {
    const [stocksData, movimientosData] = await Promise.all([
      obtenerStocks(),
      obtenerMovimientos()
    ])

    stocks.value = stocksData
    movimientos.value = movimientosData

  } catch {
    error.value = 'No se pudo cargar la información del inventario.'
  } finally {
    cargando.value = false
  }
}

const guardarInsumo = async () => {
  error.value = ''
  mensaje.value = ''

  if (!nuevoInsumo.value.name.trim()) {
    error.value = 'Ingresá el nombre del insumo.'
    return
  }

  guardando.value = true

  try {
    await registrarInsumo({
      name: nuevoInsumo.value.name.trim(),
      description: nuevoInsumo.value.description?.trim() || undefined
    })

    mensaje.value = 'Insumo registrado correctamente.'

    nuevoInsumo.value = {
      name: '',
      description: ''
    }

    mostrarFormularioInsumo.value = false
    await cargarDatos()

  } catch {
    error.value = 'No se pudo registrar el insumo. Verificá si ya existe.'
  } finally {
    guardando.value = false
  }
}

const abrirFormularioStock = (stock: StockInsumo) => {
  stockSeleccionado.value = stock
  pisoStock.value = stock.floor
  cantidadStock.value = stock.quantity
  mostrarFormularioStock.value = true
}

const guardarStock = async () => {
  if (!stockSeleccionado.value) return

  error.value = ''
  mensaje.value = ''

  if (
    !Number.isInteger(cantidadStock.value) ||
    cantidadStock.value < 0 ||
    !Number.isInteger(pisoStock.value) ||
    pisoStock.value < 1
  ) {
    error.value = 'Ingresá un piso y una cantidad válidos.'
    return
  }

  guardando.value = true

  try {
    const datos: ActualizarStockDTO = {
      floor: pisoStock.value,
      quantity: cantidadStock.value
    }

    await actualizarStock(stockSeleccionado.value.supplyId, datos)

    mensaje.value = 'Stock actualizado correctamente.'
    mostrarFormularioStock.value = false
    stockSeleccionado.value = null

    await cargarDatos()

  } catch {
    error.value = 'No se pudo actualizar el stock.'
  } finally {
    guardando.value = false
  }
}

const salir = () => {
  cerrarSesion()
  router.push('/login')
}

onMounted(cargarDatos)
</script>

<template>
  <div class="inventory-container">
    <header class="inventory-header">
      <div>
        <h1>Inventario de la clínica</h1>
        <p>Control de insumos y existencias por piso</p>
      </div>

      <div class="header-actions">
        <button type="button" @click="router.push('/admin')">
          Volver al panel
        </button>

        <button type="button" class="logout" @click="salir">
          Cerrar sesión
        </button>
      </div>
    </header>

    <main class="inventory-main">
      <section class="summary">
        <article class="summary-card">
          <span>Registros de stock</span>
          <strong>{{ stocks.length }}</strong>
        </article>

        <article class="summary-card">
          <span>Unidades disponibles</span>
          <strong>{{ totalUnidades }}</strong>
        </article>

        <article class="summary-card warning-card">
          <span>Stocks bajos (≤ 5)</span>
          <strong>{{ insumosConStockBajo.length }}</strong>
        </article>
      </section>

      <div v-if="mensaje" class="success-message">
        {{ mensaje }}
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <section class="inventory-section">
        <div class="section-header">
          <div>
            <h2>Existencias</h2>
            <p>Consulta de insumos disponibles por piso</p>
          </div>

          <div class="header-actions">
            <button
              type="button"
              @click="mostrarFormularioInsumo = !mostrarFormularioInsumo"
            >
              Nuevo insumo
            </button>

            <button
              type="button"
              class="secondary-button"
              @click="cargarDatos"
              :disabled="cargando"
            >
              Actualizar
            </button>
          </div>
        </div>

        <div v-if="mostrarFormularioInsumo" class="form-panel">
          <h3>Registrar insumo</h3>

          <form @submit.prevent="guardarInsumo">
            <label>
              Nombre
              <input
                v-model="nuevoInsumo.name"
                required
                placeholder="Ej. Ibuprofeno 400 mg"
              />
            </label>

            <label>
              Descripción
              <input
                v-model="nuevoInsumo.description"
                placeholder="Descripción del insumo"
              />
            </label>

            <button type="submit" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Registrar' }}
            </button>
          </form>
        </div>

        <div class="filters">
          <input
            v-model="busqueda"
            placeholder="Buscar insumo..."
          />

          <select v-model="filtroPiso">
            <option value="todos">Todos los pisos</option>
            <option
              v-for="piso in pisos"
              :key="piso"
              :value="String(piso)"
            >
              Piso {{ piso }}
            </option>
          </select>
        </div>

        <p v-if="cargando">Cargando inventario...</p>

        <p v-else-if="stocksFiltrados.length === 0">
          No hay existencias para los filtros seleccionados.
        </p>

        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Piso</th>
                <th>Existencias</th>
                <th>Estado</th>
                <th>Última actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="stock in stocksFiltrados" :key="stock.id">
                <td>
                  <strong>{{ stock.supply.name }}</strong>
                  <small>{{ stock.supply.description || '-' }}</small>
                </td>

                <td>Piso {{ stock.floor }}</td>

                <td>{{ stock.quantity }}</td>

                <td>
                  <span
                    :class="stock.quantity <= 0
                      ? 'status-empty'
                      : stock.quantity <= 5
                        ? 'status-low'
                        : 'status-ok'"
                  >
                    {{
                      stock.quantity <= 0
                        ? 'Agotado'
                        : stock.quantity <= 5
                          ? 'Stock bajo'
                          : 'Disponible'
                    }}
                  </span>
                </td>

                <td>{{ formatearFecha(stock.updatedAt) }}</td>

                <td>
                  <button
                    type="button"
                    class="small-button"
                    @click="abrirFormularioStock(stock)"
                  >
                    Ajustar stock
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="mostrarFormularioStock" class="form-panel stock-panel">
        <h2>Ajustar existencias</h2>

        <p v-if="stockSeleccionado">
          {{ stockSeleccionado.supply.name }}
        </p>

        <form @submit.prevent="guardarStock">
          <label>
            Piso
            <input
              v-model.number="pisoStock"
              type="number"
              min="1"
              required
            />
          </label>

          <label>
            Cantidad final
            <input
              v-model.number="cantidadStock"
              type="number"
              min="0"
              required
            />
          </label>

          <div class="header-actions">
            <button type="submit" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar stock' }}
            </button>

            <button
              type="button"
              class="cancel-button"
              @click="mostrarFormularioStock = false"
            >
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <section class="inventory-section">
        <div class="section-header">
          <div>
            <h2>Movimientos de inventario</h2>
            <p>Ingresos y consumos registrados</p>
          </div>
        </div>

        <p v-if="movimientos.length === 0">
          Todavía no hay movimientos registrados.
        </p>

        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Insumo</th>
                <th>Piso</th>
                <th>Tipo</th>
                <th>Variación</th>
                <th>Stock anterior</th>
                <th>Stock resultante</th>
                <th>Administración</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="movimiento in movimientos" :key="movimiento.id">
                <td>{{ formatearFecha(movimiento.createdAt) }}</td>
                <td>{{ movimiento.supply.name }}</td>
                <td>Piso {{ movimiento.supplyStock.floor }}</td>
                <td>
                  {{ movimiento.type === 'consumo' ? 'Consumo' : 'Entrada' }}
                </td>
                <td :class="movimiento.quantity < 0 ? 'negative' : 'positive'">
                  {{ movimiento.quantity > 0 ? '+' : '' }}{{ movimiento.quantity }}
                </td>
                <td>{{ movimiento.previousStock }}</td>
                <td>{{ movimiento.resultingStock }}</td>
                <td>{{ movimiento.administrationId ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.inventory-container {
  min-height: 100vh;
  background: #f1f5f9;
}

.inventory-header {
  background: white;
  padding: 24px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px #0001;
}

.inventory-header h1 {
  margin: 0;
  color: #1e293b;
}

.inventory-header p,
.section-header p {
  color: #64748b;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 7px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #1d4ed8;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout {
  background: #dc2626;
}

.logout:hover {
  background: #b91c1c;
}

.inventory-main {
  padding: 30px 40px;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 25px;
}

.summary-card,
.inventory-section,
.form-panel {
  background: white;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 3px 12px #0001;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-card span {
  color: #64748b;
}

.summary-card strong {
  color: #1e293b;
  font-size: 28px;
}

.warning-card strong {
  color: #b45309;
}

.inventory-section {
  margin-bottom: 25px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.section-header h2,
.form-panel h2 {
  color: #1e293b;
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filters input,
.filters select,
.form-panel input {
  padding: 11px;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 14px;
}

.filters input {
  flex: 1;
}

.form-panel {
  margin-bottom: 22px;
}

.form-panel form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
  margin-top: 18px;
}

.form-panel label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #334155;
  font-weight: 600;
}

.stock-panel form {
  max-width: 600px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 850px;
}

th,
td {
  padding: 13px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
}

th {
  background: #f8fafc;
  color: #334155;
}

td small {
  display: block;
  color: #94a3b8;
  margin-top: 4px;
}

.status-ok,
.status-low,
.status-empty {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-ok {
  background: #dcfce7;
  color: #15803d;
}

.status-low {
  background: #fef3c7;
  color: #b45309;
}

.status-empty {
  background: #fee2e2;
  color: #b91c1c;
}

.small-button {
  padding: 7px 10px;
  font-size: 12px;
}

.secondary-button {
  background: #475569;
}

.secondary-button:hover {
  background: #334155;
}

.cancel-button {
  background: #64748b;
}

.positive {
  color: #15803d;
  font-weight: 600;
}

.negative {
  color: #dc2626;
  font-weight: 600;
}

.success-message {
  padding: 13px;
  background: #dcfce7;
  color: #166534;
  border-radius: 7px;
  margin-bottom: 18px;
}

.error-message {
  padding: 13px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 7px;
  margin-bottom: 18px;
}

@media (max-width: 700px) {
  .inventory-header {
    padding: 20px;
    align-items: flex-start;
    flex-direction: column;
  }

  .inventory-main {
    padding: 20px;
  }

  .summary {
    grid-template-columns: 1fr;
  }

  .section-header,
  .filters {
    align-items: stretch;
    flex-direction: column;
  }

  .form-panel form {
    grid-template-columns: 1fr;
  }
}
</style>
