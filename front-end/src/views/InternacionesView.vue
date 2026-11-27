<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

import {
  obtenerInternacionesActivas,
  obtenerTodasLasInternaciones,
  crearInternacion,
  darAltaMedica
} from '../services/admissionService'

import type { Internacion } from '../services/admissionService'

import {
  obtenerHabitacionesDisponibles
} from '../services/roomService'

import type { Habitacion } from '../services/roomService'

import { obtenerPacientes } from '../services/patientService'
import type { Paciente } from '../services/patientService'

import { obtenerMedicos } from '../services/doctorService'
import type { Medico } from '../services/doctorService'

const pacientes = ref<Paciente[]>([])
const habitaciones = ref<Habitacion[]>([])
const internaciones = ref<Internacion[]>([])
const medicos = ref<Medico[]>([])
const medicoSeleccionado = ref<number | ''>('')

const pacienteSeleccionado = ref<number | ''>('')
const habitacionSeleccionada = ref<number | ''>('')

const historialInternaciones = ref<Internacion[]>([])

const cargando = ref(false)
const guardando = ref(false)
const dandoAltaId = ref<number | null>(null)

const mensaje = ref('')
const error = ref('')

function obtenerMensajeError(err: unknown): string {
  const respuesta = err as {
    response?: {
      data?: {
        message?: string | string[]
      }
    }
  }

  const detalle = respuesta.response?.data?.message

  if (Array.isArray(detalle)) {
    return detalle.join(', ')
  }

  return detalle || 'Ocurrió un error. Intentá nuevamente.'
}

async function cargarDatos() {
  cargando.value = true
  error.value = ''

  try {
    const [
      pacientesRecibidos,
      habitacionesRecibidas,
      internacionesRecibidas,
      historialRecibido,
      medicosRecibidos
    ] = await Promise.all([
      obtenerPacientes(),
      obtenerHabitacionesDisponibles(),
      obtenerInternacionesActivas(),
      obtenerTodasLasInternaciones(),
      obtenerMedicos()
    ])

    pacientes.value = pacientesRecibidos
    habitaciones.value = habitacionesRecibidas
    internaciones.value = internacionesRecibidas
    medicos.value = medicosRecibidos

    historialInternaciones.value = historialRecibido.filter(
      (internacion: Internacion) => internacion.status === 'alta'
    )
  } catch (err: unknown) {
    error.value = obtenerMensajeError(err)
  } finally {
    cargando.value = false
  }
}

async function registrarInternacion() {
  mensaje.value = ''
  error.value = ''

  if (pacienteSeleccionado.value === '' || habitacionSeleccionada.value === '') {
    error.value = 'Seleccioná un paciente y una habitación.'
    return
  }

  guardando.value = true

  try {
    await crearInternacion({
      patientId: Number(pacienteSeleccionado.value),
      roomId: Number(habitacionSeleccionada.value),
      ...(medicoSeleccionado.value !== ''
        ? { doctorId: Number(medicoSeleccionado.value) }
        : {})
    })

    mensaje.value = 'La internación se registró correctamente.'

    pacienteSeleccionado.value = ''
    habitacionSeleccionada.value = ''
    medicoSeleccionado.value = ''

    await cargarDatos()
  } catch (err: unknown) {
    error.value = obtenerMensajeError(err)
  } finally {
    guardando.value = false
  }
}

async function confirmarEgreso(internacion: Internacion) {
  const confirmar = window.confirm(
    `¿Confirmás el egreso de ${internacion.patient.firstName} ${internacion.patient.lastName}?`
  )

  if (!confirmar) return

  mensaje.value = ''
  error.value = ''
  dandoAltaId.value = internacion.id

  try {
    await darAltaMedica(internacion.id)

    mensaje.value = 'El egreso administrativo se confirmó correctamente.'

    await cargarDatos()
  } catch (err: unknown) {
    error.value = obtenerMensajeError(err)
  } finally {
    dandoAltaId.value = null
  }
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString('es-AR')
}

function volver() {
  router.push('/recepcion')
}

onMounted(cargarDatos)
</script>

<template>
  <main class="internaciones">
    <header class="encabezado">
      <div>
        <h1>Gestión de internaciones</h1>
        <p>Registro de pacientes internados y gestión de altas médicas.</p>
      </div>

      <div class="acciones-encabezado">
        <button
          class="boton-volver"
          type="button"
          @click="volver"
        >
          Volver a recepción
        </button>

        <button
          class="boton-actualizar"
          type="button"
          :disabled="cargando"
          @click="cargarDatos"
        >
          {{ cargando ? 'Actualizando...' : 'Actualizar datos' }}
        </button>
      </div>
    </header>

    <div v-if="mensaje" class="mensaje">
      {{ mensaje }}
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <section class="panel">
      <h2>Registrar internación</h2>

      <form @submit.prevent="registrarInternacion">
        <div class="campos">
          <div class="campo">
            <label for="paciente">Paciente</label>

            <select
              id="paciente"
              v-model.number="pacienteSeleccionado"
              required
            >
              <option value="" disabled>
                Seleccionar paciente
              </option>

              <option
                v-for="paciente in pacientes"
                :key="paciente.id"
                :value="paciente.id"
              >
                {{ paciente.firstName }} {{ paciente.lastName }}
                — DNI: {{ paciente.dni }}
              </option>
            </select>
          </div>

          <div class="campo">
            <label for="habitacion">Habitación</label>

            <select
              id="habitacion"
              v-model.number="habitacionSeleccionada"
              required
            >
              <option value="" disabled>
                Seleccionar habitación
              </option>

              <option
                v-for="habitacion in habitaciones.filter(h => h.availableBeds > 0)"
                :key="habitacion.id"
                :value="habitacion.id"
              >
                Habitación {{ habitacion.roomNumber }}
                — {{ habitacion.availableBeds }} cama(s) disponible(s)
              </option>
            </select>
          </div>

          <div class="campo">
            <label for="medico">Médico responsable</label>

            <select
              id="medico"
              v-model.number="medicoSeleccionado"
            >
              <option value="">
                Asignación automática (médico con menos pacientes)
              </option>

              <option
                v-for="medico in medicos"
                :key="medico.id"
                :value="medico.id"
              >
                Dr. {{ medico.firstName }} {{ medico.lastName }}
                — {{ medico.specialty }}
              </option>
            </select>
          </div>
        </div>

        <p v-if="pacientes.length === 0 && !cargando" class="aviso">
          No hay pacientes registrados.
        </p>

        <p
          v-if="habitaciones.every(h => h.availableBeds === 0) && !cargando"
          class="aviso"
        >
          No hay habitaciones con camas disponibles.
        </p>

        <button
          class="boton-principal"
          type="submit"
          :disabled="guardando || cargando"
        >
          {{ guardando ? 'Registrando...' : 'Registrar internación' }}
        </button>
      </form>
    </section>

    <section class="panel">
      <h2>Historial de egresos</h2>

      <p v-if="!cargando && historialInternaciones.length === 0">
        Todavía no hay internaciones finalizadas.
      </p>

      <div v-else-if="historialInternaciones.length > 0" class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Habitación</th>
              <th>Fecha de ingreso</th>
              <th>Fecha de alta</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="internacion in historialInternaciones"
              :key="internacion.id"
            >
              <td>
                {{ internacion.patient.firstName }}
                {{ internacion.patient.lastName }}
              </td>

              <td>{{ internacion.patient.dni }}</td>

              <td>{{ internacion.room.roomNumber }}</td>

              <td>
                {{ formatearFecha(internacion.admissionDate) }}
              </td>

              <td>
                {{
                  internacion.dischargeDate
                    ? formatearFecha(internacion.dischargeDate)
                    : 'No registrada'
                }}
             </td>

              <td>
                <span class="estado-alta">Egreso confirmado</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <div class="titulo-seccion">
        <h2>Habitaciones disponibles</h2>
      </div>

      <p v-if="habitaciones.length === 0 && !cargando">
        No hay habitaciones disponibles para mostrar.
      </p>

      <div v-else class="habitaciones">
        <article
          v-for="habitacion in habitaciones"
          :key="habitacion.id"
          class="habitacion"
        >
          <h3>Habitación {{ habitacion.roomNumber }}</h3>
          <p>{{ habitacion.description || 'Sin descripción' }}</p>

          <div class="ocupacion">
            <span>Capacidad: {{ habitacion.capacity }}</span>
            <span>Ocupadas: {{ habitacion.occupiedBeds }}</span>
            <strong>Disponibles: {{ habitacion.availableBeds }}</strong>
          </div>
        </article>
      </div>
    </section>

    <section class="panel">
      <h2>Internaciones activas</h2>

      <p v-if="cargando">
        Cargando internaciones...
      </p>

      <p v-else-if="internaciones.length === 0">
        No hay pacientes internados actualmente.
      </p>

      <div v-else class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>DNI</th>
              <th>Habitación</th>
              <th>Fecha de ingreso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="internacion in internaciones"
              :key="internacion.id"
            >
              <td>
                {{ internacion.patient.firstName }}
                {{ internacion.patient.lastName }}
              </td>

              <td>{{ internacion.patient.dni }}</td>

              <td>{{ internacion.room.roomNumber }}</td>

              <td>{{ formatearFecha(internacion.admissionDate) }}</td>

              <td>
                <span
                  v-if="internacion.status === 'activa'"
                  class="estado-activo"
                >
                  Internación activa
                </span>

                <span
                  v-else-if="internacion.status === 'alta_medica_solicitada'"
                  class="estado-pendiente"
                >
                  Alta médica solicitada
                </span>
              </td>

              <td>
                <button
                  v-if="internacion.status === 'alta_medica_solicitada'"
                  class="boton-alta"
                  type="button"
                  :disabled="dandoAltaId === internacion.id"
                  @click="confirmarEgreso(internacion)"
                >
                  {{
                    dandoAltaId === internacion.id
                      ? 'Procesando...'
                      : 'Confirmar egreso'
                  }}
                </button>

                <span
                  v-else-if="internacion.status === 'activa'"
                  class="texto-espera"
                >
                  Esperando solicitud médica
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>


<style scoped>
.internaciones {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  color: #1e293b !important;
  background: #f1f5f9;
  min-height: 100vh;
}

/* ENCABEZADO */

.encabezado,
.titulo-seccion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.encabezado h1 {
  margin: 0 0 8px;
  color: #0f172a !important;
  font-size: 28px;
  font-weight: 800;
}

.encabezado p {
  color: #475569 !important;
  margin: 0;
}

/* PANELES */

.panel {
  background: #ffffff !important;
  color: #1e293b !important;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 24px;
}

.panel h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #0f172a !important;
  font-size: 21px;
  font-weight: 800;
}

/* FORMULARIOS */

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.campo label {
  color: #1e293b !important;
  font-weight: 700;
  font-size: 14px;
}

.campo select {
  padding: 11px;
  border: 1px solid #94a3b8;
  border-radius: 6px;
  background: #ffffff !important;
  color: #0f172a !important;
  font-size: 14px;
}

.campo select option {
  background: #ffffff;
  color: #0f172a;
}

.campo select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #2563eb20;
}

/* BOTONES */

.boton-principal,
.boton-actualizar,
.boton-alta,
.boton-volver {
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
}

.boton-principal {
  background: #2563eb;
  color: #ffffff !important;
}

.boton-principal:hover {
  background: #1d4ed8;
}

.boton-actualizar {
  background: #e2e8f0;
  color: #1e293b !important;
}

.boton-actualizar:hover {
  background: #cbd5e1;
}

.boton-alta {
  background: #0f766e;
  color: #ffffff !important;
}

.boton-alta:hover {
  background: #115e59;
}

.boton-volver {
  background: #475569;
  color: #ffffff !important;
}

.boton-volver:hover {
  background: #334155;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* HABITACIONES */

.habitaciones {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.habitacion {
  background: #ffffff !important;
  color: #1e293b !important;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 16px;
}

.habitacion h3 {
  margin-top: 0;
  color: #0f172a !important;
  font-weight: 800;
}

.habitacion p {
  color: #475569 !important;
}

.ocupacion {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #334155 !important;
  font-size: 14px;
}

.ocupacion strong {
  color: #166534 !important;
}

/* TABLAS */

.tabla-contenedor {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff !important;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #cbd5e1;
  color: #1e293b !important;
  background: #ffffff !important;
  font-size: 14px;
}

th {
  background: #e2e8f0 !important;
  color: #0f172a !important;
  font-weight: 800;
}

/* ESTADOS */

.estado-activo {
  color: #166534 !important;
  font-weight: 700;
}

.estado-alta {
  color: #1d4ed8 !important;
  font-weight: 700;
}

.estado-pendiente {
  color: #92400e !important;
  font-weight: 700;
}

.texto-espera {
  color: #475569 !important;
  font-size: 13px;
}

/* MENSAJES */

.mensaje,
.error,
.aviso {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-weight: 600;
}

.mensaje {
  background: #dcfce7 !important;
  color: #166534 !important;
}

.error {
  background: #fee2e2 !important;
  color: #991b1b !important;
}

.aviso {
  background: #fef3c7 !important;
  color: #92400e !important;
}

/* TEXTO GENERAL: PROTECCIÓN CONTRA CSS GLOBAL */

.internaciones h1,
.internaciones h2,
.internaciones h3,
.internaciones p,
.internaciones label,
.internaciones span,
.internaciones td,
.internaciones th {
  opacity: 1 !important;
  visibility: visible !important;
}

.internaciones h1,
.internaciones h2,
.internaciones h3 {
  text-shadow: none !important;
}

/* ENCABEZADO Y ACCIONES */

.acciones-encabezado {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* RESPONSIVE */

@media (max-width: 700px) {
  .internaciones {
    padding: 16px;
  }

  .campos {
    grid-template-columns: 1fr;
  }

  .encabezado {
    align-items: flex-start;
    flex-direction: column;
  }

  .acciones-encabezado {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
