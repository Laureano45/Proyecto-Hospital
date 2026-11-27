<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import ReservarTurno from '../components/ReservarTurno.vue'
import type { Paciente } from '../services/patientService'

import {
  obtenerMedicos
} from '../services/doctorService'

import type {
  Medico
} from '../services/doctorService'

import {
  obtenerPacientes,
  crearPaciente
} from '../services/patientService'

import {
  obtenerTodosLosTurnos,
  confirmarTurno,
  registrarLlegada,
  cancelarTurno,
  insertarEntreturno
} from '../services/appointmentService'

import type { Turno } from '../services/appointmentService'

import {
  cerrarSesion,
} from '../services/authService'

const router = useRouter()

const pacientes = ref<Paciente[]>([])
const turnos = ref<Turno[]>([])

const medicos = ref<Medico[]>([])

const cargandoMedicos = ref(false)
const guardandoEntreturno = ref(false)

const mensajeEntreturno = ref('')
const errorEntreturno = ref('')

const nuevoEntreturno = ref({
  patientId: 0,
  doctorId: 0,
  appointmentDate: '',
  beforeAppointmentId: 0
})

const cargando = ref(false)
const cargandoTurnos = ref(false)
const guardando = ref(false)

const turnoProcesando = ref<number | null>(null)

const mensaje = ref('')
const error = ref('')

const mensajeTurno = ref('')
const errorTurno = ref('')

const nuevoPaciente = ref({
  firstName: '',
  lastName: '',
  dni: '',
  phone: '',
  email: ''
})

interface ApiError {
  response?: {
    data?: {
      message?: string | string[]
    }
  }
}

const obtenerMensajeError = (
  err: unknown,
  mensajePredeterminado: string
): string => {
  const apiError = err as ApiError
  const detalle = apiError.response?.data?.message

  if (Array.isArray(detalle)) {
    return detalle.join(', ')
  }

  return detalle || mensajePredeterminado
}

// Cargar pacientes
const cargarPacientes = async () => {
  cargando.value = true
  error.value = ''

  try {
    pacientes.value = await obtenerPacientes()
  } catch (err: unknown) {
    error.value = obtenerMensajeError(
      err,
      'No se pudieron cargar los pacientes.'
    )
  } finally {
    cargando.value = false
  }
}

// Cargar todos los turnos
const cargarTurnos = async () => {
  cargandoTurnos.value = true
  errorTurno.value = ''

  try {
    turnos.value = await obtenerTodosLosTurnos()
  } catch (err: unknown) {
    errorTurno.value = obtenerMensajeError(
      err,
      'No se pudieron cargar los turnos.'
    )
  } finally {
    cargandoTurnos.value = false
  }
}


interface ParTurnos {
  before: Turno
  after: Turno
}

const cargarMedicos = async () => {
  cargandoMedicos.value = true

  try {
    medicos.value = await obtenerMedicos()
  } catch (err: unknown) {
    errorEntreturno.value = obtenerMensajeError(
      err,
      'No se pudieron cargar los médicos.'
    )
  } finally {
    cargandoMedicos.value = false
  }
}

// Obtener los pares de turnos consecutivos disponibles.
const paresDisponibles = computed<ParTurnos[]>(() => {
  const { doctorId, appointmentDate } = nuevoEntreturno.value

  if (!doctorId || !appointmentDate) return []

  const agenda = turnos.value
    .filter(turno =>
      turno.doctorId === doctorId &&
      turno.appointmentDate === appointmentDate &&
      ['PROGRAMADO', 'CONFIRMADO'].includes(turno.status) &&
      turno.durationMinutes === 30
    )
    .sort((a, b) =>
      a.appointmentTime.localeCompare(b.appointmentTime)
    )

  const pares: ParTurnos[] = []

  for (let i = 0; i < agenda.length - 1; i++) {
    const before = agenda[i]
    const after = agenda[i + 1]

    if (!before || !after) continue

    const horaInicio = (hora: string) => {
      const partes = hora.substring(0, 5).split(':').map(Number)
      const h = partes[0] ?? 0
      const m = partes[1] ?? 0
      return h * 60 + m
    }

    if (horaInicio(before.appointmentTime) + 30 ===
        horaInicio(after.appointmentTime)) {
      pares.push({ before, after })
    }
  }

  return pares
})

const parSeleccionado = computed(() =>
  paresDisponibles.value.find(
    par => par.before.id === nuevoEntreturno.value.beforeAppointmentId
  )
)

const limpiarSeleccionEntreturno = () => {
  nuevoEntreturno.value.beforeAppointmentId = 0
  mensajeEntreturno.value = ''
  errorEntreturno.value = ''
}

const registrarEntreturno = async () => {
  mensajeEntreturno.value = ''
  errorEntreturno.value = ''

  const { patientId, doctorId, appointmentDate, beforeAppointmentId } =
    nuevoEntreturno.value

  if (!patientId || !doctorId || !appointmentDate || !beforeAppointmentId) {
    errorEntreturno.value = 'Completá todos los campos.'
    return
  }

  const par = parSeleccionado.value

  if (!par) {
    errorEntreturno.value = 'Seleccioná dos turnos consecutivos válidos.'
    return
  }

  const confirmado = window.confirm(
    'Se modificarán los horarios de los dos turnos seleccionados. ¿Deseás insertar el entreturno?'
  )

  if (!confirmado) return

  guardandoEntreturno.value = true

  try {
    await insertarEntreturno({
      patientId,
      doctorId,
      appointmentDate,
      beforeAppointmentId: par.before.id,
      afterAppointmentId: par.after.id
    })

    mensajeEntreturno.value =
      'Entreturno insertado correctamente. La agenda fue actualizada.'

    nuevoEntreturno.value.patientId = 0
    nuevoEntreturno.value.beforeAppointmentId = 0

    await cargarTurnos()

  } catch (err: unknown) {
    errorEntreturno.value = obtenerMensajeError(
      err,
      'No se pudo insertar el entreturno.'
    )
  } finally {
    guardandoEntreturno.value = false
  }
}

// Registrar paciente
const registrarPaciente = async () => {
  mensaje.value = ''
  error.value = ''

  guardando.value = true

  try {
    await crearPaciente(nuevoPaciente.value)

    mensaje.value = 'Paciente registrado correctamente.'

    nuevoPaciente.value = {
      firstName: '',
      lastName: '',
      dni: '',
      phone: '',
      email: ''
    }

    await cargarPacientes()

  } catch (err: unknown) {
    error.value = obtenerMensajeError(
      err,
      'No se pudo registrar el paciente.'
    )
  } finally {
    guardando.value = false
  }
}

// Acciones de la máquina de estados
type AccionTurno = 'confirmar' | 'llegada' | 'cancelar'

const cambiarEstadoTurno = async (
  id: number,
  accion: AccionTurno
) => {
  mensajeTurno.value = ''
  errorTurno.value = ''

  if (accion === 'cancelar') {
    const confirmado = window.confirm(
      '¿Estás seguro de que querés cancelar este turno?'
    )

    if (!confirmado) return
  }

  turnoProcesando.value = id

  try {
    switch (accion) {
      case 'confirmar':
        await confirmarTurno(id)
        mensajeTurno.value = 'Turno confirmado correctamente.'
        break

      case 'llegada':
        await registrarLlegada(id)
        mensajeTurno.value = 'Llegada del paciente registrada correctamente.'
        break

      case 'cancelar':
        await cancelarTurno(id)
        mensajeTurno.value = 'Turno cancelado correctamente.'
        break
    }

    await cargarTurnos()

  } catch (err: unknown) {
    errorTurno.value = obtenerMensajeError(
      err,
      'No se pudo modificar el estado del turno.'
    )
  } finally {
    turnoProcesando.value = null
  }
}

const salir = () => {
  cerrarSesion()
  router.push('/login')
}
const obtenerHoraFin = (turno: Turno): string => {
  const partes = String(turno.appointmentTime ?? '00:00').split(':')

  const horas = Number(partes[0] ?? 0)
  const minutos = Number(partes[1] ?? 0)

  const inicio = horas * 60 + minutos
  const fin = inicio + (turno.durationMinutes ?? 30)

  const horaFin = Math.floor(fin / 60)
  const minutoFin = fin % 60

  return `${String(horaFin).padStart(2, '0')}:${String(minutoFin).padStart(2, '0')}`
}

const obtenerTipoTurno = (turno: Turno): string => {
  if (turno.isOverbooking) {
    return 'Entreturno'
  }

  if ((turno.durationMinutes ?? 30) !== 30) {
    return 'Modificado'
  }

  return 'Normal'
}

onMounted(() => {
  cargarPacientes()
  cargarTurnos()
  cargarMedicos()
})
</script>

<template>
  <main class="contenedor">

    <header class="encabezado">
      <div>
        <h1>Panel de recepción</h1>
      </div>

      <div class="acciones-encabezado">
        <button
          class="boton-mapa"
          @click="router.push('/recepcion/camas')"
        >
          Mapa de camas
        </button>

        <button class="boton-salir" @click="salir">
          Cerrar sesión
        </button>

        <button
          class="boton-cuenta"
          @click="router.push('/admin/cuenta-corriente')"
        >
          Cuenta corriente
        </button>
      </div>
    </header>

    <button class="boton-historial"
      @click="$router.push('/recepcion/historial')">
        Ver historial de turnos
    </button>

    <button
      class="boton-internaciones"
      @click="router.push('/recepcion/internaciones')"
    >
      Gestión de internaciones
    </button>

    <!-- RESERVAR TURNOS -->
    <section class="seccion">
      <ReservarTurno />
    </section>

    <!-- INSERTAR ENTRETURNO -->
    <section class="seccion">
      <h2>Insertar entreturno de urgencia menor</h2>

      <p class="descripcion">
        Se insertará una consulta de 15 minutos entre dos turnos
        consecutivos, reduciendo sus duraciones a 22 y 23 minutos.
      </p>

      <form @submit.prevent="registrarEntreturno">

        <div class="campo">
          <label>Paciente</label>
          <select v-model.number="nuevoEntreturno.patientId" required>
            <option :value="0" disabled>Seleccionar paciente</option>
            <option
              v-for="paciente in pacientes"
              :key="paciente.id"
              :value="paciente.id"
            >
              {{ paciente.firstName }} {{ paciente.lastName }} - DNI: {{ paciente.dni }}
            </option>
          </select>
        </div>

        <div class="campo">
          <label>Médico</label>
          <select
            v-model.number="nuevoEntreturno.doctorId"
            @change="limpiarSeleccionEntreturno"
            required
          >
            <option :value="0" disabled>Seleccionar médico</option>
            <option
              v-for="medico in medicos"
              :key="medico.id"
              :value="medico.id"
            >
              {{ medico.firstName }} {{ medico.lastName }} - {{ medico.specialty }}
            </option>
          </select>
        </div>

        <div class="campo">
          <label>Fecha</label>
          <input
            type="date"
            v-model="nuevoEntreturno.appointmentDate"
            :min="new Date().toLocaleDateString('en-CA')"
            @change="limpiarSeleccionEntreturno"
            required
          />
        </div>

        <div class="campo">
          <label>Turnos entre los que se insertará la urgencia</label>

          <select
            v-model.number="nuevoEntreturno.beforeAppointmentId"
            :disabled="paresDisponibles.length === 0"
            required
          >
            <option :value="0" disabled>
              Seleccionar intervalo
            </option>

            <option
              v-for="par in paresDisponibles"
              :key="par.before.id"
              :value="par.before.id"
            >
              {{ par.before.appointmentTime.substring(0, 5) }}
              -
              {{ par.after.appointmentTime.substring(0, 5) }}
              (Turnos #{{ par.before.id }} y #{{ par.after.id }})
            </option>
          </select>

          <p v-if="nuevoEntreturno.doctorId && nuevoEntreturno.appointmentDate &&
            paresDisponibles.length === 0" class="aviso">
            No hay dos turnos consecutivos disponibles para insertar un entreturno.
          </p>
        </div>

        <div v-if="parSeleccionado" class="resumen-entreturno">
          <h3>Distribución de horarios</h3>

          <p>
            Turno #{{ parSeleccionado.before.id }}:
            {{ parSeleccionado.before.appointmentTime.substring(0, 5) }}
            — duración final: 22 minutos.
          </p>

          <p>
            Entreturno:
            {{ parSeleccionado.before.appointmentTime.substring(0, 5) }}
            + 22 minutos — duración: 15 minutos.
          </p>

          <p>
            Turno #{{ parSeleccionado.after.id }}:
            comenzará 37 minutos después del inicio del primer turno
            — duración final: 23 minutos.
          </p>
        </div>

        <p v-if="mensajeEntreturno" class="exito">
          {{ mensajeEntreturno }}
        </p>

        <p v-if="errorEntreturno" class="error">
          {{ errorEntreturno }}
        </p>

        <button
          type="submit"
          class="boton-entreturno"
          :disabled="
            guardandoEntreturno ||
            cargandoMedicos ||
            !parSeleccionado
          "
        >
          {{
            guardandoEntreturno
              ? 'Insertando entreturno...'
              : 'Confirmar entreturno'
          }}
        </button>

      </form>
    </section>

    <!-- GESTIÓN DE TURNOS -->
    <section class="seccion">
      <h2>Gestión de turnos</h2>

      <p v-if="cargandoTurnos">
        Cargando turnos...
      </p>

      <template v-else>

        <p v-if="errorTurno" class="error">
          {{ errorTurno }}
        </p>

        <p v-if="mensajeTurno" class="exito">
          {{ mensajeTurno }}
        </p>

        <p v-if="turnos.length === 0">
          No hay turnos registrados.
        </p>

        <div v-else class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Duración</th>
                <th>Tipo de turno</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="turno in turnos"
                :key="turno.id"
              >
                <td>
                  {{ turno.appointmentTime.substring(0, 5) }}
                  -
                  {{ obtenerHoraFin(turno) }}
                </td>

                <td>
                  {{ turno.durationMinutes ?? 30 }} minutos
                </td>

                <td>
                  <span
                  v-if="obtenerTipoTurno(turno) === 'Entreturno'"
                  class="etiqueta-entreturno">
                    Entreturno
                  </span>

                  <span
                  v-else-if="obtenerTipoTurno(turno) === 'Modificado'"
                  class="etiqueta-modificado">
                    Modificado
                  </span>

                  <span v-else class="etiqueta-normal">
                    Normal
                  </span>
                </td>

                <td>{{ turno.appointmentDate }}</td>

                <td>{{ turno.appointmentTime }}</td>

                <td>
                  {{ turno.patient?.firstName }}
                  {{ turno.patient?.lastName }}
                </td>

                <td>
                  {{ turno.doctor?.firstName }}
                  {{ turno.doctor?.lastName }}
                </td>

                <td>
                  <span
                    class="estado"
                    :class="turno.status.toLowerCase()"
                  >
                    {{ turno.status }}
                  </span>
                </td>

                <td class="acciones">

                  <button
                    v-if="turno.status === 'PROGRAMADO'"
                    class="boton-confirmar"
                    :disabled="turnoProcesando === turno.id"
                    @click="cambiarEstadoTurno(turno.id, 'confirmar')"
                  >
                    Confirmar
                  </button>

                  <button
                    v-if="turno.status === 'CONFIRMADO'"
                    class="boton-llegada"
                    :disabled="turnoProcesando === turno.id"
                    @click="cambiarEstadoTurno(turno.id, 'llegada')"
                  >
                    Registrar llegada
                  </button>

                  <button
                    v-if="
                      ['PROGRAMADO', 'CONFIRMADO', 'EN_SALA_DE_ESPERA']
                        .includes(turno.status)
                    "
                    class="boton-cancelar"
                    :disabled="turnoProcesando === turno.id"
                    @click="cambiarEstadoTurno(turno.id, 'cancelar')"
                  >
                    Cancelar
                  </button>

                  <span
                    v-if="turno.status === 'ATENDIDO'"
                    class="texto-finalizado"
                  >
                    Atendido
                  </span>

                  <span
                    v-if="turno.status === 'CANCELADO'"
                    class="texto-cancelado"
                  >
                    Cancelado
                  </span>

                  <span
                    v-if="turnoProcesando === turno.id"
                    class="procesando"
                  >
                    Procesando...
                  </span>

                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>

      <button
        class="boton-actualizar"
        @click="cargarTurnos"
        :disabled="cargandoTurnos"
      >
        Actualizar turnos
      </button>
    </section>

    <!-- REGISTRAR PACIENTES -->
    <section class="seccion">
      <h2>Registrar paciente</h2>

      <form @submit.prevent="registrarPaciente">

        <div class="campo">
          <label>Nombre</label>
          <input
            v-model="nuevoPaciente.firstName"
            required
            maxlength="100"
          />
        </div>

        <div class="campo">
          <label>Apellido</label>
          <input
            v-model="nuevoPaciente.lastName"
            required
            maxlength="100"
          />
        </div>

        <div class="campo">
          <label>DNI</label>
          <input
            v-model="nuevoPaciente.dni"
            required
            maxlength="20"
          />
        </div>

        <div class="campo">
          <label>Teléfono</label>
          <input
            v-model="nuevoPaciente.phone"
            required
            maxlength="30"
          />
        </div>

        <div class="campo">
          <label>Correo electrónico</label>
          <input
            v-model="nuevoPaciente.email"
            type="email"
            required
          />
        </div>

        <button type="submit" :disabled="guardando">
          {{ guardando ? 'Registrando...' : 'Registrar paciente' }}
        </button>

      </form>

      <p v-if="mensaje" class="exito">
        {{ mensaje }}
      </p>

      <p v-if="error" class="error">
        {{ error }}
      </p>
    </section>

    <!-- LISTADO DE PACIENTES -->
    <section class="seccion">
      <h2>Pacientes registrados</h2>

      <p v-if="cargando">
        Cargando pacientes...
      </p>

      <p v-else-if="pacientes.length === 0">
        No hay pacientes registrados.
      </p>

      <div v-else class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Correo</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="paciente in pacientes"
              :key="paciente.id"
            >
              <td>
                {{ paciente.firstName }}
                {{ paciente.lastName }}
              </td>

              <td>{{ paciente.dni }}</td>
              <td>{{ paciente.phone }}</td>
              <td>{{ paciente.email }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        class="boton-actualizar"
        @click="cargarPacientes"
        :disabled="cargando"
      >
        Actualizar listado
      </button>
    </section>

  </main>
</template>

<style scoped>
.contenedor {
  max-width: 1200px;
  margin: 30px auto;
  padding: 20px;
}

.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.boton-historial {
  padding: 10px 18px;
  margin: 15px 0;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.boton-historial:hover {
  background-color: #125ca3;
}

.seccion {
  margin-bottom: 35px;
  padding: 25px;
  background: #f5f5f5;
  border-radius: 10px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 15px;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.boton-salir,
.boton-cancelar {
  background: #dc2626;
}

.boton-confirmar {
  background: #2563eb;
}

.boton-llegada {
  background: #d97706;
}

.boton-actualizar {
  margin-top: 15px;
}

.tabla-contenedor {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th, td {
  padding: 12px;
  border: 1px solid #ddd;
  text-align: left;
}

th {
  background: #e2e8f0;
}

.acciones {
  min-width: 160px;
}

.acciones button {
  margin: 3px;
}

.estado {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: bold;
}

.estado.programado {
  background: #dbeafe;
  color: #1d4ed8;
}

.estado.confirmado {
  background: #e0e7ff;
  color: #4338ca;
}

.estado.en_sala_de_espera {
  background: #fef3c7;
  color: #92400e;
}

.estado.atendido {
  background: #dcfce7;
  color: #166534;
}

.estado.cancelado {
  background: #fee2e2;
  color: #991b1b;
}

.exito {
  color: #166534;
  font-weight: bold;
}

.error {
  color: #dc2626;
}

.texto-finalizado {
  color: #166534;
}

.texto-cancelado {
  color: #dc2626;
}

.procesando {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.campo select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background: white;
  font-size: 14px;
}

.descripcion {
  color: #64748b;
  margin-bottom: 20px;
}

.aviso {
  color: #b45309;
  font-size: 14px;
  margin-top: 8px;
}

.resumen-entreturno {
  margin: 18px 0;
  padding: 15px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
}

.resumen-entreturno h3 {
  margin-top: 0;
  color: #9a3412;
}

.resumen-entreturno p {
  margin: 8px 0;
}

.boton-entreturno {
  background: #15803d;
  margin-top: 10px;
}

.boton-entreturno:hover {
  background: #166534;
}

.etiqueta-entreturno {
  background-color: #dcfce7;
  color: #166534;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
}

.etiqueta-modificado {
  background-color: #fef3c7;
  color: #92400e;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
}

.etiqueta-normal {
  background-color: #e5e7eb;
  color: #374151;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 12px;
}

.acciones-encabezado {
  display: flex;
  align-items: center;
  gap: 10px;
}

.boton-mapa {
  background: #0f766e;
}

.boton-mapa:hover {
  background: #115e59;
}

.boton-internaciones {
  background: #0f766e;
  color: white;
  padding: 11px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-left: 10px;
}

.boton-internaciones:hover {
  background: #115e59;
}

.boton-cuenta {
  background: #2563eb;
  color: white;
}

.boton-cuenta:hover {
  background: #1d4ed8;
}

/* ================================
   CORRECCIÓN DE CONTRASTE Y TEXTOS
================================ */

/* Texto general */
.contenedor {
  color: #1e293b;
}

/* Títulos principales y secundarios */
.contenedor h1,
.contenedor h2,
.contenedor h3 {
  color: #0f172a !important;
  font-weight: 700;
}

/* Labels de formularios */
.contenedor label {
  color: #1e293b !important;
  font-size: 14px;
  font-weight: 700;
}

/* Descripciones y textos informativos */
.contenedor p {
  color: #334155;
}

/* Descripción de entreturnos */
.descripcion {
  color: #475569 !important;
}

/* Inputs */
.contenedor input,
.contenedor select {
  color: #0f172a !important;
  background-color: #ffffff !important;
  font-size: 14px;
}

/* Opciones de los select */
.contenedor select option {
  color: #0f172a;
  background-color: #ffffff;
}

/* Placeholders */
.contenedor input::placeholder {
  color: #94a3b8;
}

/* Encabezados de tablas */
.contenedor th {
  color: #0f172a !important;
  background-color: #e2e8f0;
  font-weight: 700;
}

/* Celdas */
.contenedor td {
  color: #1e293b !important;
  background-color: #ffffff;
}

/* Mensajes */
.contenedor .exito {
  color: #166534 !important;
}

.contenedor .error {
  color: #dc2626 !important;
}

.contenedor .aviso {
  color: #92400e !important;
}

/* Botones */
.contenedor button {
  color: #ffffff !important;
  font-weight: 600;
}

/* Estados y etiquetas */
.contenedor .estado,
.contenedor .etiqueta-entreturno,
.contenedor .etiqueta-modificado,
.contenedor .etiqueta-normal {
  font-weight: 700;
}

/* Texto de procesamiento */
.contenedor .procesando {
  color: #475569 !important;
}

/* Texto de acciones finalizadas */
.contenedor .texto-finalizado {
  color: #166534 !important;
}

.contenedor .texto-cancelado {
  color: #dc2626 !important;
}

/* CORRECCIÓN DEFINITIVA DEL ENCABEZADO */

.contenedor .encabezado {
  background-color: #d8d2d2 !important;
  padding: 20px;
  border-radius: 10px;
}

.contenedor .encabezado h1 {
  color: #0f172a !important;
  font-size: 28px !important;
  font-weight: 800 !important;
  opacity: 1 !important;
  visibility: visible !important;
  text-shadow: none !important;
}

.contenedor .encabezado div {
  color: #0f172a !important;
}

.contenedor .acciones-encabezado button {
  color: #ffffff !important;
  opacity: 1 !important;
  font-weight: 700 !important;
}

/* Títulos de todas las secciones */

.contenedor .seccion h2 {
  color: #0f172a !important;
  font-size: 22px !important;
  font-weight: 800 !important;
  opacity: 1 !important;
  visibility: visible !important;
}

/* Fondo y texto de las secciones */

.contenedor .seccion {
  background-color: #ced0d4 !important;
  color: #1e293b !important;
}

/* Evitar transparencia heredada */

.contenedor h1,
.contenedor h2,
.contenedor h3,
.contenedor label,
.contenedor p,
.contenedor th,
.contenedor td {
  opacity: 1 !important;
  visibility: visible !important;
}
</style>
