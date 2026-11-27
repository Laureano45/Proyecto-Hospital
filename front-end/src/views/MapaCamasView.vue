<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { obtenerUsuario } from '../services/authService'

import { obtenerMapaCamas, bloquearCama, desbloquearCama } from '../services/roomService'
import type {
  Habitacion,
  EstadoCama
} from '../services/roomService'

import {
  roomsSocket,
  conectarRoomsSocket,
  desconectarRoomsSocket
} from '../services/roomsSocket'

const router = useRouter()

const usuario = obtenerUsuario()

const esAdmin = usuario?.role?.toLowerCase() === 'admin'

const habitaciones = ref<Habitacion[]>([])
const cargando = ref(false)
const error = ref('')
const ultimaActualizacion = ref<Date | null>(null)

interface ActualizacionCama {
  id?: number
  bedId?: number
  roomId: number
  bedNumber: string
  status: EstadoCama
  blockReason?: string | null
  cleanedAt?: string | null
  cleanedByUserId?: number | null
}

const cargarMapa = async () => {
  cargando.value = true
  error.value = ''

  try {
    habitaciones.value = await obtenerMapaCamas()
    ultimaActualizacion.value = new Date()
  } catch {
    error.value = 'No se pudo cargar el mapa de camas.'
  } finally {
    cargando.value = false
  }
}

const bloquear = async (camaId: number) => {
  const motivo = window.prompt(
    'Ingresá el motivo del bloqueo de la cama:'
  )

  if (!motivo || !motivo.trim()) return

  try {
    await bloquearCama(camaId, motivo.trim())
  } catch {
    error.value = 'No se pudo bloquear la cama.'
  }
}

const desbloquear = async (camaId: number) => {
  const confirmar = window.confirm(
    '¿Confirmás que querés desbloquear esta cama?'
  )

  if (!confirmar) return

  try {
    await desbloquearCama(camaId)
  } catch {
    error.value = 'No se pudo desbloquear la cama.'
  }
}

const actualizarCama = (datos: ActualizacionCama) => {
  const habitacion = habitaciones.value.find(
    room => room.id === datos.roomId
  )

  if (!habitacion) return

  const cama = habitacion.beds.find(
    bed => bed.id === (datos.bedId ?? datos.id)
  )

  if (!cama) return

  cama.status = datos.status

  if (datos.blockReason !== undefined) {
    cama.blockReason = datos.blockReason
  }

  if (datos.cleanedAt !== undefined) {
    cama.cleanedAt = datos.cleanedAt
  }

  if (datos.cleanedByUserId !== undefined) {
    cama.cleanedByUserId = datos.cleanedByUserId
  }

  ultimaActualizacion.value = new Date()
}

const eventos = [
  'bed.occupied',
  'bed.cleaning',
  'bed.cleaned',
  'bed.blocked',
  'bed.unblocked'
] as const

const escucharEvento = (datos: ActualizacionCama) => {
  actualizarCama(datos)
}

onMounted(async () => {
  await cargarMapa()

  eventos.forEach(evento => {
    roomsSocket.on(evento, escucharEvento)
  })

  conectarRoomsSocket()
})

onUnmounted(() => {
  eventos.forEach(evento => {
    roomsSocket.off(evento, escucharEvento)
  })

  desconectarRoomsSocket()
})

const etiquetaEstado = (estado: EstadoCama) => {
  const etiquetas: Record<EstadoCama, string> = {
    libre: 'Libre',
    ocupada: 'Ocupada',
    en_limpieza: 'En limpieza',
    bloqueada: 'Bloqueada'
  }

  return etiquetas[estado]
}

const iconoEstado = (estado: EstadoCama) => {
  const iconos: Record<EstadoCama, string> = {
    libre: '✓',
    ocupada: '●',
    en_limpieza: '↻',
    bloqueada: '!'
  }

  return iconos[estado]
}

const volver = () => {
  if (esAdmin) {
    router.push('/admin')
  } else {
    router.push('/recepcion')
  }
}
</script>

<template>
  <div class="mapa-container">
    <header class="mapa-header">
      <div>
        <h1>Mapa de camas</h1>
        <p>Estado y disponibilidad de las habitaciones</p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="refresh-button"
          @click="cargarMapa"
          :disabled="cargando"
        >
          {{ cargando ? 'Actualizando...' : 'Actualizar' }}
        </button>

        <button
          type="button"
          class="back-button"
          @click="volver"
        >
          Volver
        </button>
      </div>
    </header>

    <main>
      <section class="legend">
        <div class="legend-item">
          <span class="dot libre"></span>
          Libre
        </div>

        <div class="legend-item">
          <span class="dot ocupada"></span>
          Ocupada
        </div>

        <div class="legend-item">
          <span class="dot limpieza"></span>
          En limpieza
        </div>

        <div class="legend-item">
          <span class="dot bloqueada"></span>
          Bloqueada
        </div>
      </section>

      <p v-if="ultimaActualizacion" class="update-info">
        Última actualización:
        {{ ultimaActualizacion.toLocaleTimeString() }}
      </p>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <p v-if="cargando && habitaciones.length === 0">
        Cargando habitaciones...
      </p>

      <p v-else-if="!cargando && habitaciones.length === 0 && !error">
        No hay habitaciones activas registradas.
      </p>

      <section v-else class="rooms-grid">
        <article
          v-for="habitacion in habitaciones"
          :key="habitacion.id"
          class="room-card"
        >
          <div class="room-heading">
            <div>
              <h2>Habitación {{ habitacion.roomNumber }}</h2>
              <p>{{ habitacion.description || 'Sin descripción' }}</p>
            </div>

            <span class="capacity">
              {{ habitacion.beds.length }} camas
            </span>
          </div>

          <div class="beds-grid">
            <div
              v-for="cama in habitacion.beds"
              :key="cama.id"
              class="bed-card"
              :class="cama.status"
            >
              <span class="bed-icon">
                {{ iconoEstado(cama.status) }}
              </span>

              <strong>{{ cama.bedNumber }}</strong>

              <span class="bed-status">
                {{ etiquetaEstado(cama.status) }}
              </span>

              <small
                v-if="cama.status === 'bloqueada' && cama.blockReason"
                class="bed-reason"
              >
                {{ cama.blockReason }}
              </small>
              <div v-if="esAdmin" class="bed-actions">
                <button
                  v-if="cama.status === 'libre'"
                  type="button"
                  class="block-button"
                  @click="bloquear(cama.id)"
                >
                  Bloquear
                </button>

                <button
                  v-if="cama.status === 'bloqueada'"
                  type="button"
                  class="unblock-button"
                  @click="desbloquear(cama.id)"
                >
                  Desbloquear
                </button>
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.mapa-container {
  min-height: 100vh;
  background: #f1f5f9;
}

.mapa-header {
  background: white;
  padding: 25px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px #0001;
}

.mapa-header h1 {
  margin: 0;
  color: #1e293b;
}

.mapa-header p {
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 10px;
}

button {
  padding: 11px 16px;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
}

.refresh-button {
  background: #2563eb;
}

.back-button {
  background: #475569;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

main {
  padding: 25px 40px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  background: white;
  padding: 18px;
  border-radius: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-weight: 600;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.libre { background: #16a34a; }
.dot.ocupada { background: #dc2626; }
.dot.limpieza { background: #d97706; }
.dot.bloqueada { background: #64748b; }

.update-info {
  color: #64748b;
  font-size: 13px;
  margin: 18px 0;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.room-card {
  background: white;
  padding: 22px;
  border-radius: 12px;
  box-shadow: 0 3px 12px #0001;
}

.room-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
}

.room-heading h2 {
  margin: 0;
  color: #1e293b;
}

.room-heading p {
  color: #64748b;
  font-size: 13px;
}

.capacity {
  background: #e2e8f0;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  white-space: nowrap;
}

.beds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
  gap: 12px;
}

.bed-card {
  min-height: 105px;
  padding: 13px;
  border-radius: 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  text-align: center;
}

.bed-card.libre {
  background: #dcfce7;
  color: #166534;
}

.bed-card.ocupada {
  background: #fee2e2;
  color: #991b1b;
}

.bed-card.en_limpieza {
  background: #fef3c7;
  color: #92400e;
}

.bed-card.bloqueada {
  background: #e2e8f0;
  color: #334155;
}

.bed-icon {
  font-size: 20px;
  font-weight: bold;
}

.bed-status {
  font-size: 12px;
  font-weight: 600;
}

.bed-reason {
  font-size: 11px;
  overflow-wrap: anywhere;
}

.error {
  color: #dc2626;
  margin: 20px 0;
}

@media (max-width: 650px) {
  .mapa-header {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  main {
    padding: 20px;
  }

  .header-actions {
    width: 100%;
  }
}

.bed-actions {
  display: flex;
  gap: 6px;
  margin-top: 5px;
  flex-wrap: wrap;
  justify-content: center;
}

.block-button {
  background: #dc2626;
  font-size: 11px;
  padding: 7px 9px;
}

.block-button:hover {
  background: #b91c1c;
}

.unblock-button {
  background: #16a34a;
  font-size: 11px;
  padding: 7px 9px;
}

.unblock-button:hover {
  background: #15803d;
}
</style>
