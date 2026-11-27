<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cerrarSesion } from '../services/authService'

import {
  obtenerCamasPendientesLimpieza,
  confirmarLimpiezaCama
} from '../services/roomService'

import type {
  CamaPendienteLimpieza
} from '../services/roomService'

const router = useRouter()

const camas = ref<CamaPendienteLimpieza[]>([])
const cargando = ref(false)
const camaProcesando = ref<number | null>(null)
const error = ref('')
const mensaje = ref('')

const cargarCamasPendientes = async () => {
  cargando.value = true
  error.value = ''
  mensaje.value = ''

  try {
    camas.value = await obtenerCamasPendientesLimpieza()
  } catch {
    error.value = 'No se pudieron cargar las camas pendientes de limpieza.'
  } finally {
    cargando.value = false
  }
}

const confirmarLimpieza = async (cama: CamaPendienteLimpieza) => {
  const confirmar = window.confirm(
    `¿Confirmás que se realizó la limpieza de la cama ${cama.bedNumber}?`
  )

  if (!confirmar) return

  camaProcesando.value = cama.id
  error.value = ''
  mensaje.value = ''

  try {
    await confirmarLimpiezaCama(cama.id)

    camas.value = camas.value.filter(
      item => item.id !== cama.id
    )

    mensaje.value = `La limpieza de la cama ${cama.bedNumber} fue registrada correctamente.`
  } catch {
    error.value = 'No se pudo registrar la limpieza. Actualizá la lista e intentá nuevamente.'
  } finally {
    camaProcesando.value = null
  }
}

const CerrarSesion = () => {
  cerrarSesion()
  router.push('/login')
}

onMounted(() => {
  cargarCamasPendientes()
})
</script>

<template>
  <div class="maestranza-container">
    <header class="header">
      <div>
        <h1>Panel de maestranza</h1>
        <p>Gestión de limpieza de camas</p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="refresh-button"
          @click="cargarCamasPendientes"
          :disabled="cargando"
        >
          {{ cargando ? 'Actualizando...' : 'Actualizar' }}
        </button>

        <button
          type="button"
          class="back-button"
          @click="CerrarSesion"
        >
          Cerrar Sesion
        </button>
      </div>
    </header>

    <main>
      <section class="summary">
        <div>
          <span class="summary-label">Camas pendientes</span>
          <strong>{{ camas.length }}</strong>
        </div>
      </section>

      <p v-if="mensaje" class="success">
        {{ mensaje }}
      </p>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <p v-if="cargando && camas.length === 0">
        Cargando camas pendientes...
      </p>

      <section
        v-else-if="camas.length === 0"
        class="empty-state"
      >
        <h2>No hay camas pendientes de limpieza</h2>
        <p>
          Las camas que reciban el alta y pasen a estado
          "En limpieza" aparecerán aquí.
        </p>
      </section>

      <section v-else class="beds-grid">
        <article
          v-for="cama in camas"
          :key="cama.id"
          class="bed-card"
        >
          <div class="bed-icon">↻</div>

          <h2>Cama {{ cama.bedNumber }}</h2>

          <p>
            Habitación:
            {{ cama.room?.roomNumber ?? cama.roomId }}
          </p>

          <span class="status">
            En limpieza
          </span>

          <button
            type="button"
            class="confirm-button"
            :disabled="camaProcesando === cama.id"
            @click="confirmarLimpieza(cama)"
          >
            {{
              camaProcesando === cama.id
                ? 'Registrando...'
                : 'Confirmar limpieza'
            }}
          </button>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.maestranza-container {
  min-height: 100vh;
  background: #f1f5f9;
}

.header {
  background: white;
  padding: 25px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px #0001;
}

.header h1 {
  margin: 0;
  color: #1e293b;
}

.header p {
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

.summary {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 22px;
}

.summary div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-label {
  color: #64748b;
  font-size: 14px;
}

.summary strong {
  color: #1e293b;
  font-size: 30px;
}

.beds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}

.bed-card {
  background: white;
  padding: 22px;
  border-radius: 12px;
  box-shadow: 0 3px 12px #0001;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.bed-icon {
  font-size: 30px;
  color: #d97706;
}

.bed-card h2 {
  margin: 0;
  color: #1e293b;
}

.bed-card p {
  color: #64748b;
  margin: 0;
}

.status {
  background: #fef3c7;
  color: #92400e;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.confirm-button {
  background: #16a34a;
  width: 100%;
  margin-top: 5px;
}

.confirm-button:hover {
  background: #15803d;
}

.empty-state {
  background: white;
  padding: 35px;
  border-radius: 12px;
  text-align: center;
  color: #64748b;
}

.empty-state h2 {
  color: #1e293b;
}

.success {
  color: #15803d;
  margin-bottom: 18px;
}

.error {
  color: #dc2626;
  margin-bottom: 18px;
}

@media (max-width: 650px) {
  .header {
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header-actions {
    width: 100%;
  }

  main {
    padding: 20px;
  }
}
</style>
