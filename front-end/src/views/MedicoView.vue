<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

import {
  obtenerAlergiasPaciente,
  registrarAlergiaPaciente
} from '../services/patientService'

import {
  obtenerAntecedentesFamiliares,
  registrarAntecedenteFamiliar
} from '../services/patientService'

import type {
  AntecedenteFamiliar,
  CrearAntecedenteFamiliarDTO
} from '../services/patientService'

import type {
  AlergiaPaciente,
  CrearAlergiaDTO
} from '../services/patientService'

import {
  cerrarSesion,
  obtenerUsuario
} from '../services/authService'

import {
  obtenerMisTurnos,
  obtenerMisPacientes,
  marcarComoAtendido
} from '../services/appointmentService'

import {
  obtenerMisInternacionesActivas,
  solicitarAltaMedica
} from '../services/admissionService'

import type { Internacion } from '../services/admissionService'

import type { Turno } from '../services/appointmentService'
import type { Paciente } from '../services/patientService'

import {
  obtenerHistorialClinico,
  registrarDiagnostico
} from '../services/clinicalHistoryService'

import type {
  RegistroClinico,
  CrearDiagnosticoDTO
} from '../services/clinicalHistoryService'

import {
  obtenerHistorialTareasMedicas,
  crearTareaMedica
} from '../services/nursingTaskService'

import type {
  TareaEnfermeriaMedica,
  CrearTareaMedicaDTO
} from '../services/nursingTaskService'

const router = useRouter()
const usuario = obtenerUsuario()

const turnos = ref<Turno[]>([])
const pacientes = ref<Paciente[]>([])

// Internaciones
const internaciones = ref<Internacion[]>([])
const internacionProcesando = ref<number | null>(null)

const cargando = ref(true)
const error = ref('')
const mensaje = ref('')
const turnoProcesando = ref<number | null>(null)

// Historial clínico
const historial = ref<RegistroClinico[]>([])
const pacienteSeleccionado = ref<Paciente | null>(null)
const cargandoHistorial = ref(false)
const errorHistorial = ref('')

//Alergias
const alergias = ref<AlergiaPaciente[]>([])
const cargandoAlergias = ref(false)
const errorAlergias = ref('')
const mensajeAlergias = ref('')

const mostrarFormularioAlergia = ref(false)
const guardandoAlergia = ref(false)
const nuevaAlergia = ref<CrearAlergiaDTO>({
  allergen: '',
  severity: 'leve'
})

//Historial familiar
const antecedentesFamiliares = ref<AntecedenteFamiliar[]>([])
const cargandoAntecedentes = ref(false)
const errorAntecedentes = ref('')
const mensajeAntecedentes = ref('')
const mostrarFormularioAntecedente = ref(false)
const guardandoAntecedente = ref(false)
const nuevoAntecedente = ref<CrearAntecedenteFamiliarDTO>({
  relative: '',
  condition: '',
  observations: ''
})

// Formulario de diagnóstico
const mostrarFormulario = ref(false)
const guardandoDiagnostico = ref(false)
const nuevoDiagnostico = ref('')
const nuevasObservaciones = ref('')
const modoRectificacion = ref(false)
const registroARectificar = ref<number | null>(null)
const motivoRectificacion = ref('')

// Historial y creación de tareas de enfermería
const tareasEnfermeria = ref<TareaEnfermeriaMedica[]>([])
const cargandoTareas = ref(false)
const errorTareas = ref('')
const mensajeTareas = ref('')
const filtroPacienteTarea = ref('')
const filtroEstadoTarea = ref('todos')

const tareasFiltradas = computed(() => {
  return tareasEnfermeria.value.filter(tarea => {
    const nombrePaciente =
      `${tarea.admission.patient.firstName} ${tarea.admission.patient.lastName}`
        .toLowerCase()

    const coincidePaciente = nombrePaciente.includes(
      filtroPacienteTarea.value.toLowerCase()
    )

    const coincideEstado =
      filtroEstadoTarea.value === 'todos' ||
      tarea.status === filtroEstadoTarea.value

    return coincidePaciente && coincideEstado
  })
})

const mostrarFormularioTarea = ref(false)
const guardandoTarea = ref(false)

const nuevaTarea = ref<CrearTareaMedicaDTO>({
  admissionId: 0,
  title: '',
  description: '',
  frequency: ''
})

const cargarAlergias = async (patientId: number) => {
  cargandoAlergias.value = true
  errorAlergias.value = ''

  try {
    alergias.value = await obtenerAlergiasPaciente(patientId)
  } catch {
    errorAlergias.value = 'No se pudieron cargar las alergias.'
  } finally {
    cargandoAlergias.value = false
  }
}

const guardarAlergia = async () => {
  if (!pacienteSeleccionado.value) return

  const allergen = nuevaAlergia.value.allergen.trim()

  if (!allergen) {
    errorAlergias.value = 'Ingresá el nombre de la sustancia o alérgeno.'
    return
  }

  guardandoAlergia.value = true
  errorAlergias.value = ''
  mensajeAlergias.value = ''

  try {
    await registrarAlergiaPaciente(
      pacienteSeleccionado.value.id,
      {
        allergen,
        severity: nuevaAlergia.value.severity
      }
    )

    mensajeAlergias.value = 'Alergia registrada correctamente.'
    nuevaAlergia.value = { allergen: '', severity: 'leve' }
    mostrarFormularioAlergia.value = false

    await cargarAlergias(pacienteSeleccionado.value.id)
  } catch {
    errorAlergias.value = 'No se pudo registrar la alergia.'
  } finally {
    guardandoAlergia.value = false
  }
}

const cargarAntecedentesFamiliares = async (patientId: number) => {
  cargandoAntecedentes.value = true
  errorAntecedentes.value = ''

  try {
    antecedentesFamiliares.value =
      await obtenerAntecedentesFamiliares(patientId)
  } catch {
    errorAntecedentes.value =
      'No se pudieron cargar los antecedentes familiares.'
  } finally {
    cargandoAntecedentes.value = false
  }
}

const guardarAntecedenteFamiliar = async () => {
  if (!pacienteSeleccionado.value) return

  const relative = nuevoAntecedente.value.relative.trim()
  const condition = nuevoAntecedente.value.condition.trim()

  if (!relative || !condition) {
    errorAntecedentes.value =
      'Completá el parentesco y la enfermedad o condición.'
    return
  }

  guardandoAntecedente.value = true
  errorAntecedentes.value = ''
  mensajeAntecedentes.value = ''

  try {
    await registrarAntecedenteFamiliar(
      pacienteSeleccionado.value.id,
      {
        relative,
        condition,
        observations: nuevoAntecedente.value.observations?.trim() || ''
      }
    )

    mensajeAntecedentes.value =
      'Antecedente familiar registrado correctamente.'

    nuevoAntecedente.value = {
      relative: '',
      condition: '',
      observations: ''
    }

    mostrarFormularioAntecedente.value = false

    await cargarAntecedentesFamiliares(
      pacienteSeleccionado.value.id
    )
  } catch {
    errorAntecedentes.value =
      'No se pudo registrar el antecedente familiar.'
  } finally {
    guardandoAntecedente.value = false
  }
}

// Cargar turnos y pacientes
const cargarDatos = async () => {
  cargando.value = true
  error.value = ''

  try {
    const [turnosData, pacientesData, internacionesData] = await Promise.all([
      obtenerMisTurnos(),
      obtenerMisPacientes(),
      obtenerMisInternacionesActivas()
    ])

    turnos.value = turnosData
    pacientes.value = pacientesData
    internaciones.value = internacionesData
  } catch (err: unknown) {
    const errorResponse = err as {
      response?: { data?: { message?: string | string[] } }
    }
    const detalle = errorResponse.response?.data?.message

    error.value = Array.isArray(detalle)
      ? detalle.join(', ')
      : detalle || 'No se pudieron cargar los datos del médico.'

  } finally {
    cargando.value = false
  }
}

const cargarHistorialTareas = async () => {
  cargandoTareas.value = true
  errorTareas.value = ''

  try {
    tareasEnfermeria.value = await obtenerHistorialTareasMedicas()

  } catch (err: unknown) {
    const errorResponse = err as {
      response?: { data?: { message?: string | string[] } }
    }

    const detalle = errorResponse.response?.data?.message

    errorTareas.value = Array.isArray(detalle)
      ? detalle.join(', ')
      : detalle || 'No se pudo cargar el historial de tareas de enfermería.'

  } finally {
    cargandoTareas.value = false
  }
}

const guardarTarea = async () => {
  errorTareas.value = ''
  mensajeTareas.value = ''

  if (!nuevaTarea.value.admissionId) {
    errorTareas.value = 'Debés seleccionar una internación.'
    return
  }

  if (!nuevaTarea.value.title.trim()) {
    errorTareas.value = 'El título de la tarea es obligatorio.'
    return
  }

  if (!nuevaTarea.value.description.trim()) {
    errorTareas.value = 'La descripción de la tarea es obligatoria.'
    return
  }

  guardandoTarea.value = true

  const datos: CrearTareaMedicaDTO = {
    admissionId: nuevaTarea.value.admissionId,
    title: nuevaTarea.value.title.trim(),
    description: nuevaTarea.value.description.trim(),
    frequency: nuevaTarea.value.frequency?.trim() || undefined
  }

  try {
    await crearTareaMedica(datos)

    mensajeTareas.value = 'La tarea de enfermería fue creada correctamente.'

    nuevaTarea.value = {
      admissionId: 0,
      title: '',
      description: '',
      frequency: ''
    }

    mostrarFormularioTarea.value = false

    await cargarHistorialTareas()

  } catch (err: unknown) {
    const errorResponse = err as {
      response?: { data?: { message?: string | string[] } }
    }

    const detalle = errorResponse.response?.data?.message

    errorTareas.value = Array.isArray(detalle)
      ? detalle.join(', ')
      : detalle || 'No se pudo crear la tarea de enfermería.'

  } finally {
    guardandoTarea.value = false
  }
}

// Marcar turno como atendido
const atenderTurno = async (id: number) => {
  turnoProcesando.value = id
  error.value = ''
  mensaje.value = ''

  try {
    await marcarComoAtendido(id)

    mensaje.value = 'El turno fue marcado como atendido correctamente.'

    await cargarDatos()

  } catch (err: unknown) {
    const errorResponse = err as {
      response?: { data?: { message?: string | string[] } }
    }

    const detalle = errorResponse.response?.data?.message

    error.value = Array.isArray(detalle)
      ? detalle.join(', ')
      : detalle || 'No se pudo actualizar el estado del turno.'

  } finally {
    turnoProcesando.value = null
  }
}

const solicitarAlta = async (internacion: Internacion) => {
  const confirmar = window.confirm(
    `¿Solicitás el alta médica de ${internacion.patient.firstName} ${internacion.patient.lastName}?`
  )

  if (!confirmar) return

  error.value = ''
  mensaje.value = ''
  internacionProcesando.value = internacion.id

  try {
    await solicitarAltaMedica(internacion.id)

    mensaje.value = 'La solicitud de alta médica fue registrada correctamente.'

    await cargarDatos()

  } catch (err: unknown) {
    const errorResponse = err as {
      response?: { data?: { message?: string | string[] } }
    }

    const detalle = errorResponse.response?.data?.message

    error.value = Array.isArray(detalle)
      ? detalle.join(', ')
      : detalle || 'No se pudo solicitar el alta médica.'

  } finally {
    internacionProcesando.value = null
  }
}

// Consultar historial de un paciente

const verHistorial = async (paciente: Paciente) => {
  pacienteSeleccionado.value = paciente
  alergias.value = []
  mensajeAlergias.value = ''
  mostrarFormularioAlergia.value = false
  await cargarAlergias(paciente.id)
  antecedentesFamiliares.value = []
  mensajeAntecedentes.value = ''
  mostrarFormularioAntecedente.value = false
  await cargarAntecedentesFamiliares(paciente.id)
  historial.value = []
  errorHistorial.value = ''
  mensaje.value = ''
  mostrarFormulario.value = false
  cargandoHistorial.value = true

  try {
    historial.value = await obtenerHistorialClinico(paciente.id)

  } catch (err: unknown) {
    const errorResponse = err as {
      response?: { data?: { message?: string | string[] } }
    }

    const detalle = errorResponse.response?.data?.message

    errorHistorial.value = Array.isArray(detalle)
      ? detalle.join(', ')
      : detalle || 'No se pudo cargar el historial clínico.'

  } finally {
    cargandoHistorial.value = false
  }
}

// Registrar un nuevo diagnóstico
const guardarDiagnostico = async () => {
  if (!pacienteSeleccionado.value) return

  if (!nuevoDiagnostico.value.trim()) {
    errorHistorial.value = 'El diagnóstico es obligatorio.'
    return
  }

  if (modoRectificacion.value) {
    if (!registroARectificar.value) {
      errorHistorial.value = 'Seleccioná la evolución que deseas rectificar.'
      return
    }

    if (!motivoRectificacion.value.trim()) {
      errorHistorial.value = 'El motivo de rectificación es obligatorio.'
      return
    }
  }

  guardandoDiagnostico.value = true
  errorHistorial.value = ''

  const datos: CrearDiagnosticoDTO = {
    patientId: pacienteSeleccionado.value.id,
    diagnosis: nuevoDiagnostico.value.trim(),
    observations: nuevasObservaciones.value.trim() || undefined,
    ...(modoRectificacion.value
      ? {
          correctsRecordId: registroARectificar.value!,
          correctionReason: motivoRectificacion.value.trim()
        }
      : {})
  }

  try {
    await registrarDiagnostico(datos)

    mensaje.value = modoRectificacion.value
      ? 'Rectificación registrada correctamente.'
      : 'Diagnóstico registrado correctamente.'

    nuevoDiagnostico.value = ''
    nuevasObservaciones.value = ''
    motivoRectificacion.value = ''
    registroARectificar.value = null
    modoRectificacion.value = false
    mostrarFormulario.value = false

    historial.value = await obtenerHistorialClinico(
      pacienteSeleccionado.value.id
    )

  } catch (err: unknown) {
    const errorResponse = err as {
      response?: { data?: { message?: string | string[] } }
    }

    const detalle = errorResponse.response?.data?.message

    errorHistorial.value = Array.isArray(detalle)
      ? detalle.join(', ')
      : detalle || 'No se pudo registrar el diagnóstico.'

  } finally {
    guardandoDiagnostico.value = false
  }
}

const cerrarHistorial = () => {
  pacienteSeleccionado.value = null
  historial.value = []
  mostrarFormulario.value = false
  nuevoDiagnostico.value = ''
  nuevasObservaciones.value = ''
  errorHistorial.value = ''
  mensaje.value = ''
  alergias.value = []
  errorAlergias.value = ''
  mensajeAlergias.value = ''
  mostrarFormularioAlergia.value = false
  nuevaAlergia.value = { allergen: '', severity: 'leve' }
  antecedentesFamiliares.value = []
  errorAntecedentes.value = ''
  mensajeAntecedentes.value = ''
  mostrarFormularioAntecedente.value = false
  nuevoAntecedente.value = {
    relative: '',
    condition: '',
    observations: ''
  }
}

const salir = () => {
  cerrarSesion()
  router.push('/login')
}

onMounted(async () => {
  await cargarDatos()
  await cargarHistorialTareas()
})
</script>

<template>
  <main class="contenedor">

    <header>
      <div>
        <h1>Panel del médico</h1>
        <p>Bienvenido/a, {{ usuario?.email }}</p>
      </div>

      <button @click="salir">Cerrar sesión</button>
    </header>

    <p v-if="cargando">Cargando información...</p>

    <template v-else>

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <p v-if="mensaje" class="exito">
        {{ mensaje }}
      </p>

      <section>
        <h2>Mis próximos turnos</h2>

        <p v-if="turnos.length === 0">
          No tenés turnos registrados.
        </p>

        <div v-else class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Paciente</th>
                <th>DNI</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="turno in turnos" :key="turno.id">
                <td>{{ turno.appointmentDate }}</td>
                <td>{{ turno.appointmentTime }}</td>

                <td>
                  {{ turno.patient?.firstName }}
                  {{ turno.patient?.lastName }}
                </td>

                <td>{{ turno.patient?.dni }}</td>

                <td>
                  <span
                    class="estado"
                    :class="turno.status.toLowerCase()"
                  >
                    {{ turno.status }}
                  </span>
                </td>

                <td>
                  <button
                    v-if="turno.status === 'EN_SALA_DE_ESPERA'"
                    class="boton-atender"
                    :disabled="turnoProcesando === turno.id"
                    @click="atenderTurno(turno.id)"
                  >
                    {{
                      turnoProcesando === turno.id
                        ? 'Procesando...'
                        : 'Marcar atendido'
                    }}
                  </button>

                  <span
                    v-else-if="turno.status === 'ATENDIDO'"
                    class="texto-finalizado"
                  >
                    Consulta finalizada
                  </span>

                  <span
                    v-else-if="turno.status === 'CANCELADO'"
                    class="texto-cancelado"
                  >
                    Turno cancelado
                  </span>

                  <span v-else>
                    Esperando llegada
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Mis pacientes</h2>

        <p v-if="pacientes.length === 0">
          Todavía no tenés pacientes con turnos reservados.
        </p>

        <div v-else class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Teléfono</th>
                <th>Correo electrónico</th>
                <th>Historial clínico</th>
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

                <td>
                  <button
                    class="boton-historial"
                    @click="verHistorial(paciente)"
                  >
                    Ver historial
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Pacientes internados</h2>

        <p v-if="internaciones.length === 0">
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

                <td>
                  {{ new Date(internacion.admissionDate).toLocaleDateString('es-AR') }}
                </td>

                <td>
                  <span
                    v-if="internacion.status === 'activa'"
                    class="estado-internacion activa"
                  >
                    Internación activa
                  </span>

                  <span
                    v-else-if="internacion.status === 'alta_medica_solicitada'"
                    class="estado-internacion solicitada"
                  >
                    Alta solicitada
                  </span>
                </td>

                <td>
                  <button
                    class="boton-historial"
                    @click="verHistorial(internacion.patient)"
                  >
                    Ver historial
                  </button>

                  <button
                    v-if="internacion.status === 'activa'"
                    class="boton-solicitar-alta"
                    :disabled="internacionProcesando === internacion.id"
                    @click="solicitarAlta(internacion)"
                  >
                    {{
                      internacionProcesando === internacion.id
                        ? 'Procesando...'
                        : 'Solicitar alta médica'
                    }}
                  </button>

                  <span
                    v-else-if="internacion.status === 'alta_medica_solicitada'"
                    class="texto-pendiente"
                  >
                    Pendiente de recepción
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- HISTORIAL Y CREACION DE TAREAS DE ENFERMERIA -->
      <section class="panel-tareas">
        <header class="encabezado-tareas">
          <div>
            <h2>Seguimiento de enfermería</h2>
            <p>Historial de tareas de tus pacientes internados</p>
          </div>

          <button
            class="boton-nuevo"
            @click="mostrarFormularioTarea = !mostrarFormularioTarea"
          >
            {{ mostrarFormularioTarea ? 'Cancelar' : 'Crear nueva tarea' }}
          </button>
        </header>

        <p v-if="errorTareas" class="error">
          {{ errorTareas }}
        </p>

        <p v-if="mensajeTareas" class="exito">
          {{ mensajeTareas }}
        </p>

        <!-- FORMULARIO DE CREACION -->
        <form
          v-if="mostrarFormularioTarea"
          class="formulario-tarea"
          @submit.prevent="guardarTarea"
        >
          <h3>Nueva tarea de enfermería</h3>

          <label>Internación / Paciente</label>
          <select v-model.number="nuevaTarea.admissionId" required>
            <option :value="0" disabled>
              Seleccioná una internación
            </option>

            <option
              v-for="internacion in internaciones"
              :key="internacion.id"
              :value="internacion.id"
            >
              {{ internacion.patient.firstName }}
              {{ internacion.patient.lastName }}
              - Habitación {{ internacion.room.roomNumber }}
            </option>
          </select>

          <label>Título de la tarea</label>
          <input
            v-model="nuevaTarea.title"
            type="text"
            maxlength="150"
            placeholder="Ej.: Controlar signos vitales"
            required
          />

          <label>Descripción</label>
          <textarea
            v-model="nuevaTarea.description"
            rows="3"
            placeholder="Indicaciones para enfermería..."
            required
          ></textarea>

          <label>Frecuencia</label>
          <input
            v-model="nuevaTarea.frequency"
            type="text"
            maxlength="50"
            placeholder="Ej.: Cada 2 horas"
          />

          <button
            type="submit"
            class="boton-guardar"
            :disabled="guardandoTarea || internaciones.length === 0"
          >
            {{ guardandoTarea ? 'Guardando...' : 'Guardar tarea' }}
          </button>
        </form>

        <!-- HISTORIAL -->
        <div class="lista-tareas">
          <h3>Historial de tareas</h3>

          <div class="filtros-tareas">
            <input
              v-model="filtroPacienteTarea"
              type="text"
              placeholder="Buscar por paciente..."
            />

            <select v-model="filtroEstadoTarea">
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_proceso">En proceso</option>
              <option value="completada">Completadas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          <p v-if="cargandoTareas">
            Cargando tareas de enfermería...
          </p>

          <p v-else-if="tareasFiltradas.length === 0">
            No hay tareas que coincidan con los filtros seleccionados.
          </p>

          <article
            v-for="tarea in tareasFiltradas"
            :key="tarea.id"
            class="tarjeta-tarea"
          >
            <div class="registro-encabezado">
              <h4>{{ tarea.title }}</h4>

              <span
                class="estado-tarea"
                :class="tarea.status"
              >
                {{ tarea.status.replace('_', ' ') }}
              </span>
            </div>

            <p>
              <strong>Paciente:</strong>
              {{ tarea.admission.patient.firstName }}
              {{ tarea.admission.patient.lastName }}
            </p>

            <p>
              <strong>Habitación:</strong>
              {{ tarea.admission.room.roomNumber }}
            </p>

            <p>
              <strong>Descripción:</strong>
              {{ tarea.description }}
            </p>

            <p v-if="tarea.frequency">
              <strong>Frecuencia:</strong>
              {{ tarea.frequency }}
            </p>

            <p v-if="tarea.createdByDoctor">
              <strong>Indicada por:</strong>
              Dr. {{ tarea.createdByDoctor.firstName }}
              {{ tarea.createdByDoctor.lastName }}
            </p>

            <p v-if="tarea.completedBy">
              <strong>Completada por:</strong>
              {{ tarea.completedBy.firstName }}
              {{ tarea.completedBy.lastName }}
            </p>

            <p v-if="tarea.reason">
              <strong>Motivo de cancelación:</strong>
              {{ tarea.reason }}
            </p>

            <p>
              <strong>Creada:</strong>
              {{ new Date(tarea.createdAt).toLocaleString('es-AR') }}
            </p>

            <p v-if="tarea.completedAt">
              <strong>Finalizada:</strong>
              {{ new Date(tarea.completedAt).toLocaleString('es-AR') }}
            </p>
          </article>
        </div>
      </section>


      <!-- HISTORIAL CLINICO -->
      <section
        v-if="pacienteSeleccionado"
        class="panel-historial"
      >
        <header class="encabezado-historial">
          <div>
            <h2>Historial clínico</h2>
            <p>
              {{ pacienteSeleccionado.firstName }}
              {{ pacienteSeleccionado.lastName }}
            </p>
            <p>DNI: {{ pacienteSeleccionado.dni }}</p>
          </div>

          <button
            class="boton-cerrar"
            @click="cerrarHistorial"
          >
            Cerrar
          </button>
        </header>

        <section class="panel-alergias">
          <div class="encabezado-alergias">
            <h3>Alergias del paciente</h3>

            <button
              type="button"
              @click="mostrarFormularioAlergia = !mostrarFormularioAlergia"
            >
              {{ mostrarFormularioAlergia ? 'Cancelar' : 'Registrar alergia' }}
            </button>
          </div>

          <p v-if="cargandoAlergias">Cargando alergias...</p>
          <p v-if="errorAlergias" class="mensaje-error">
            {{ errorAlergias }}
          </p>
          <p v-if="mensajeAlergias" class="mensaje-exito">
            {{ mensajeAlergias }}
          </p>

          <form
            v-if="mostrarFormularioAlergia"
            @submit.prevent="guardarAlergia"
          >
            <label for="alergeno">Sustancia o alérgeno</label>
            <input
              id="alergeno"
              v-model="nuevaAlergia.allergen"
              type="text"
              maxlength="150"
              required
            />

            <label for="gravedad">Gravedad</label>
            <select id="gravedad" v-model="nuevaAlergia.severity">
              <option value="leve">Leve</option>
              <option value="moderada">Moderada</option>
              <option value="grave">Grave</option>
            </select>

            <button type="submit" :disabled="guardandoAlergia">
              {{ guardandoAlergia ? 'Guardando...' : 'Guardar alergia' }}
            </button>
          </form>

          <p v-if="!cargandoAlergias && alergias.length === 0">
            No hay alergias registradas para este paciente.
          </p>

          <div
            v-for="alergia in alergias"
            :key="alergia.id"
            class="tarjeta-alergia"
          >
            <strong>{{ alergia.allergen }}</strong>
            <span :class="['gravedad-alergia', alergia.severity]">
              {{ alergia.severity }}
            </span>
          </div>
        </section>

        <section class="panel-antecedentes">
          <div class="encabezado-antecedentes">
            <h3>Antecedentes familiares</h3>

            <button
              type="button"
              @click="mostrarFormularioAntecedente = !mostrarFormularioAntecedente"
            >
              {{ mostrarFormularioAntecedente ? 'Cancelar' : 'Registrar antecedente' }}
            </button>
          </div>

          <p v-if="cargandoAntecedentes">
            Cargando antecedentes familiares...
          </p>

          <p v-if="errorAntecedentes" class="mensaje-error">
            {{ errorAntecedentes }}
          </p>

          <p v-if="mensajeAntecedentes" class="mensaje-exito">
            {{ mensajeAntecedentes }}
          </p>

          <form
            v-if="mostrarFormularioAntecedente"
            @submit.prevent="guardarAntecedenteFamiliar"
          >
            <label for="parentesco">Parentesco</label>
            <select
              id="parentesco"
              v-model="nuevoAntecedente.relative"
              required
            >
              <option value="">Seleccionar familiar</option>
              <option value="Madre">Madre</option>
              <option value="Padre">Padre</option>
              <option value="Hermano/a">Hermano/a</option>
              <option value="Abuelo/a">Abuelo/a</option>
              <option value="Hijo/a">Hijo/a</option>
              <option value="Tío/a">Tío/a</option>
              <option value="Otro">Otro</option>
            </select>

            <label for="condicion-familiar">
              Enfermedad o condición
            </label>
            <input
              id="condicion-familiar"
              v-model="nuevoAntecedente.condition"
              type="text"
              maxlength="150"
              required
            />

            <label for="observaciones-familiares">
              Observaciones (opcional)
            </label>
            <textarea
              id="observaciones-familiares"
              v-model="nuevoAntecedente.observations"
              maxlength="2000"
              rows="3"
            />

            <button type="submit" :disabled="guardandoAntecedente">
              {{ guardandoAntecedente ? 'Guardando...' : 'Guardar antecedente' }}
            </button>
          </form>

          <p
            v-if="!cargandoAntecedentes && antecedentesFamiliares.length === 0"
          >
            No hay antecedentes familiares registrados.
          </p>

          <div
            v-for="antecedente in antecedentesFamiliares"
            :key="antecedente.id"
            class="tarjeta-antecedente"
          >
            <div>
              <strong>{{ antecedente.condition }}</strong>
              <span class="parentesco-antecedente">
                {{ antecedente.relative }}
              </span>
            </div>

            <p v-if="antecedente.observations">
              {{ antecedente.observations }}
            </p>
          </div>
        </section>

        <p v-if="cargandoHistorial">
          Cargando historial clínico...
        </p>

        <template v-else>

          <p v-if="errorHistorial" class="error">
            {{ errorHistorial }}
          </p>

          <div class="acciones-historial">
            <button
              class="boton-nuevo"
              @click="mostrarFormulario = !mostrarFormulario"
            >
              {{ mostrarFormulario
                ? 'Cancelar'
                : 'Registrar nuevo diagnóstico'
              }}
            </button>

            <button
              type="button"
              class="boton-secundario"
              @click="
                modoRectificacion = !modoRectificacion;
                registroARectificar = null;
                motivoRectificacion = '';
                nuevoDiagnostico = '';
                nuevasObservaciones = '';
                mostrarFormulario = true;
              "
            >
              {{ modoRectificacion ? 'Registrar evolución normal' : 'Rectificar evolución' }}
            </button>
          </div>

          <!-- FORMULARIO -->
          <form
            v-if="mostrarFormulario"
            class="formulario-diagnostico"
            @submit.prevent="guardarDiagnostico"
          >
            <h3>
              {{ modoRectificacion ? 'Rectificar evolución médica' : 'Nuevo diagnóstico' }}
            </h3>

            <template v-if="modoRectificacion">
              <label>Evolución que se desea rectificar</label>

              <select v-model="registroARectificar" required>
                <option :value="null" disabled>
                  Seleccioná una evolución
                </option>

                <option
                  v-for="registro in historial.filter(
                    item => item.type === 'medical' && !item.correctsRecordId
                  )"
                  :key="registro.id"
                  :value="registro.id"
                >
                  #{{ registro.id }} - {{ registro.type === 'medical' ? registro.diagnosis : '' }}
                </option>
              </select>

              <label>Motivo de rectificación</label>

              <textarea
                v-model="motivoRectificacion"
                rows="3"
                maxlength="1000"
                placeholder="Explicá por qué se rectifica la evolución..."
                required
              ></textarea>
            </template>

            <label>Diagnóstico</label>

            <input
              v-model="nuevoDiagnostico"
              type="text"
              maxlength="255"
              placeholder="Ingresá el diagnóstico"
              required
            />

            <label>Observaciones clínicas</label>

            <textarea
              v-model="nuevasObservaciones"
              rows="4"
              placeholder="Detalles, evolución y observaciones..."
            ></textarea>

            <button
              type="submit"
              class="boton-guardar"
              :disabled="guardandoDiagnostico"
            >
              {{
                guardandoDiagnostico
                  ? 'Guardando...'
                  : modoRectificacion
                    ? 'Guardar rectificación'
                    : 'Guardar diagnóstico'
              }}
            </button>
          </form>

        <!-- LINEA DE TIEMPO CLINICA -->
        <div class="lista-historial">
          <h3>Actividad clínica</h3>

          <p v-if="historial.length === 0">
            Este paciente todavía no tiene registros clínicos.
          </p>

          <article
            v-for="registro in historial"
            :key="`${registro.type}-${registro.id}`"
            class="registro-clinico"
            :class="{
              'registro-enfermeria': registro.type === 'vital_sign'
            }"
          >
            <div class="registro-encabezado">
              <h4>
                {{
                  registro.type === 'medical'
                  ? registro.diagnosis
                  : 'Control de signos vitales'
                }}
              </h4>

              <span>
                {{ new Date(registro.recordedAt).toLocaleString('es-AR') }}
              </span>
            </div>

            <!-- REGISTRO MEDICO -->
            <template v-if="registro.type === 'medical'">

              <span
                v-if="registro.correctsRecordId"
                class="etiqueta-rectificacion"
              >
                Rectificación de evolución #{{ registro.correctsRecordId }}
              </span>

              <span
                v-else
                class="etiqueta-evolucion"
              >
                Evolución médica
              </span>

              <p>
                <strong>Médico:</strong>
                {{ registro.doctor.doctor?.firstName || 'No disponible' }}
                {{ registro.doctor.doctor?.lastName || '' }}
              </p>

              <p v-if="registro.doctor.doctor?.specialty">
                <strong>Especialidad:</strong>
                {{ registro.doctor.doctor.specialty }}
              </p>

              <p v-if="registro.observations">
                <strong>Observaciones:</strong>
                {{ registro.observations }}
              </p>

              <div
                v-if="registro.correctsRecordId"
                class="detalle-rectificacion"
              >
                <p>
                  <strong>Registro rectificado:</strong>
                  #{{ registro.correctsRecordId }}
                </p>

                <p v-if="registro.correctionReason">
                  <strong>Motivo de rectificación:</strong>
                  {{ registro.correctionReason }}
                </p>
              </div>

            </template>

            <!-- CONTROL DE ENFERMERIA -->
            <template v-else>
              <p>
                <strong>Enfermero:</strong>
                {{ registro.nurse.firstName || 'No disponible' }}
                {{ registro.nurse.lastName || '' }}
              </p>

              <p>
                <strong>Presión arterial:</strong>
                {{ registro.bloodPressureSystolic }}/{{ registro.bloodPressureDiastolic }} mmHg
             </p>

              <p>
                <strong>Frecuencia cardíaca:</strong>
                {{ registro.heartRate }} lpm
              </p>

                <p>
                  <strong>Temperatura:</strong>
                  {{ registro.temperature }} °C
                </p>

                <p>
                  <strong>Habitación:</strong>
                  {{ registro.admission?.room?.roomNumber || 'No disponible' }}
                </p>

                <p>
                  <strong>Nota de enfermería:</strong>
                  {{ registro.nursingNote }}
                </p>
              </template>
            </article>
          </div>
        </template>
      </section>
    </template>
  </main>
</template>


<style scoped>
/* =====================================
   PANEL DEL MÉDICO - ESTILOS GENERALES
===================================== */

.contenedor {
  max-width: 1100px;
  margin: 30px auto;
  padding: 20px;
  color: #1e293b !important;
  background: #f1f5f9;
  min-height: 100vh;
}

/* =====================================
   ENCABEZADOS
===================================== */

.contenedor > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 35px;
}

.contenedor h1,
.contenedor h2,
.contenedor h3,
.contenedor h4 {
  color: #0f172a !important;
  font-weight: 800;
  opacity: 1 !important;
  visibility: visible !important;
  text-shadow: none !important;
}

.contenedor h1 {
  font-size: 28px;
}

.contenedor h2 {
  font-size: 21px;
}

.contenedor h3 {
  font-size: 18px;
}

.contenedor p {
  color: #334155;
  opacity: 1 !important;
}

.contenedor > header p {
  color: #475569 !important;
}

/* =====================================
   SECCIONES
===================================== */

.contenedor > section {
  margin-bottom: 35px;
  padding: 22px;
  background: #ffffff !important;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #1e293b !important;
}

/* =====================================
   TABLAS
===================================== */

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
  border: 1px solid #cbd5e1;
  text-align: left;
  color: #1e293b !important;
  background: #ffffff !important;
  font-size: 14px;
}

th {
  background: #e2e8f0 !important;
  color: #0f172a !important;
  font-weight: 800;
}

tbody tr:hover td {
  background: #f1f5f9 !important;
}

/* =====================================
   BOTONES
===================================== */

.contenedor button {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: #ffffff !important;
  font-weight: 700;
  cursor: pointer;
  font-size: 14px;
}

.contenedor button:hover {
  filter: brightness(0.92);
}

.contenedor button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.boton-atender {
  background: #15803d !important;
}

.boton-historial {
  background: #0f766e !important;
}

.boton-solicitar-alta {
  background: #0f766e !important;
}

.boton-cerrar {
  background: #475569 !important;
}

.boton-nuevo {
  background: #0f766e !important;
}

.boton-guardar {
  background: #2563eb !important;
  align-self: flex-start;
}

.boton-secundario {
  background: #475569 !important;
  margin-left: 8px;
}

/* =====================================
   ESTADOS DE TURNOS
===================================== */

.estado {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 800;
}

.estado.programado {
  background: #dbeafe !important;
  color: #1d4ed8 !important;
}

.estado.confirmado {
  background: #e0e7ff !important;
  color: #4338ca !important;
}

.estado.en_sala_de_espera {
  background: #fef3c7 !important;
  color: #92400e !important;
}

.estado.atendido {
  background: #dcfce7 !important;
  color: #166534 !important;
}

.estado.cancelado {
  background: #fee2e2 !important;
  color: #991b1b !important;
}

.estado-internacion {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 800;
}

.estado-internacion.activa {
  background: #dcfce7 !important;
  color: #166534 !important;
}

.estado-internacion.solicitada {
  background: #fef3c7 !important;
  color: #92400e !important;
}

.texto-finalizado {
  color: #166534 !important;
  font-weight: 600;
}

.texto-cancelado {
  color: #dc2626 !important;
  font-weight: 600;
}

.texto-pendiente {
  color: #92400e !important;
  font-weight: 700;
}

/* =====================================
   MENSAJES
===================================== */

.error {
  color: #b91c1c !important;
  font-weight: 600;
}

.exito {
  color: #166534 !important;
  font-weight: 700;
}

/* =====================================
   HISTORIAL CLÍNICO
===================================== */

.panel-historial {
  padding: 25px;
  background: #f8fafc !important;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
}

.encabezado-historial {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.encabezado-historial h2 {
  margin-bottom: 8px;
}

.encabezado-historial p {
  margin: 5px 0;
  color: #334155 !important;
}

.acciones-historial {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

/* =====================================
   FORMULARIOS
===================================== */

.formulario-diagnostico,
.formulario-tarea {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #ffffff !important;
  color: #1e293b !important;
  padding: 20px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  margin-bottom: 25px;
}

.formulario-diagnostico label,
.formulario-tarea label,
.panel-historial label {
  color: #1e293b !important;
  font-size: 14px;
  font-weight: 700;
}

.formulario-diagnostico input,
.formulario-diagnostico textarea,
.formulario-diagnostico select,
.formulario-tarea input,
.formulario-tarea textarea,
.formulario-tarea select,
.panel-historial input,
.panel-historial textarea,
.panel-historial select {
  padding: 11px;
  border: 1px solid #94a3b8;
  border-radius: 6px;
  font: inherit;
  font-size: 14px;
  color: #0f172a !important;
  background: #ffffff !important;
  width: 100%;
  box-sizing: border-box;
}

.formulario-diagnostico input::placeholder,
.formulario-diagnostico textarea::placeholder,
.formulario-tarea input::placeholder,
.formulario-tarea textarea::placeholder {
  color: #94a3b8 !important;
}

.formulario-diagnostico select option,
.formulario-tarea select option,
.panel-historial select option {
  color: #0f172a;
  background: #ffffff;
}

.formulario-diagnostico input:focus,
.formulario-diagnostico textarea:focus,
.formulario-diagnostico select:focus,
.formulario-tarea input:focus,
.formulario-tarea textarea:focus,
.formulario-tarea select:focus,
.panel-historial input:focus,
.panel-historial textarea:focus,
.panel-historial select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #2563eb20;
}

.formulario-diagnostico textarea,
.formulario-tarea textarea {
  resize: vertical;
}

/* =====================================
   EVOLUCIONES CLÍNICAS
===================================== */

.lista-historial h3,
.lista-tareas h3 {
  margin-bottom: 18px;
}

.registro-clinico {
  background: #ffffff !important;
  color: #1e293b !important;
  padding: 18px;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #0f766e;
  border-radius: 8px;
  margin-bottom: 15px;
}

.registro-clinico h4 {
  margin: 0;
  color: #0f172a !important;
}

.registro-clinico p {
  margin: 10px 0 0;
  color: #334155 !important;
}

.registro-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.registro-encabezado span {
  color: #475569 !important;
  font-size: 13px;
}

.registro-enfermeria {
  border-left-color: #2563eb;
}

.etiqueta-evolucion,
.etiqueta-rectificacion {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
}

.etiqueta-evolucion {
  background: #e0f2fe !important;
  color: #075985 !important;
}

.etiqueta-rectificacion {
  background: #fef3c7 !important;
  color: #92400e !important;
}

.detalle-rectificacion {
  margin-top: 12px;
  padding: 10px;
  border-left: 3px solid #d97706;
  background: #fffbeb !important;
  border-radius: 4px;
}

/* =====================================
   SEGUIMIENTO DE ENFERMERÍA
===================================== */

.panel-tareas {
  padding: 25px;
  background: #f8fafc !important;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
}

.encabezado-tareas {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.encabezado-tareas p {
  color: #475569 !important;
}

.filtros-tareas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.filtros-tareas input,
.filtros-tareas select {
  padding: 10px;
  border: 1px solid #94a3b8;
  border-radius: 6px;
  font: inherit;
  color: #0f172a !important;
  background: #ffffff !important;
}

.filtros-tareas input {
  flex: 1;
  min-width: 200px;
}

.filtros-tareas input::placeholder {
  color: #94a3b8 !important;
}

.tarjeta-tarea {
  background: #ffffff !important;
  color: #1e293b !important;
  padding: 18px;
  border: 1px solid #cbd5e1;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  margin-bottom: 15px;
}

.tarjeta-tarea h4 {
  margin: 0;
  color: #0f172a !important;
}

.tarjeta-tarea p {
  margin: 10px 0 0;
  color: #334155 !important;
}

.estado-tarea {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
}

.estado-tarea.pendiente {
  background: #fef3c7 !important;
  color: #92400e !important;
}

.estado-tarea.en_proceso {
  background: #dbeafe !important;
  color: #1d4ed8 !important;
}

.estado-tarea.completada {
  background: #dcfce7 !important;
  color: #166534 !important;
}

.estado-tarea.cancelada {
  background: #fee2e2 !important;
  color: #991b1b !important;
}

/* =====================================
   ALERGIAS
===================================== */

.panel-alergias,
.panel-antecedentes {
  margin: 20px 0;
  padding: 16px;
  background: #ffffff !important;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.encabezado-alergias,
.encabezado-antecedentes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.tarjeta-alergia {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-top: 8px;
  background: #ffffff !important;
  color: #1e293b !important;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.gravedad-alergia {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  text-transform: capitalize;
  font-weight: 700;
}

.gravedad-alergia.leve {
  background: #e5e7eb !important;
  color: #374151 !important;
}

.gravedad-alergia.moderada {
  background: #ffedd5 !important;
  color: #9a3412 !important;
}

.gravedad-alergia.grave {
  background: #fee2e2 !important;
  color: #991b1b !important;
}

/* =====================================
   ANTECEDENTES FAMILIARES
===================================== */

.tarjeta-antecedente {
  padding: 12px;
  margin-top: 8px;
  background: #ffffff !important;
  color: #1e293b !important;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.tarjeta-antecedente strong {
  color: #0f172a !important;
}

.tarjeta-antecedente p {
  color: #334155 !important;
  margin-bottom: 0;
}

.parentesco-antecedente {
  display: inline-block;
  margin-left: 10px;
  padding: 3px 9px;
  border-radius: 12px;
  background: #e5e7eb !important;
  color: #374151 !important;
  font-size: 0.85rem;
}

/* =====================================
   MENSAJES DE ALERGIAS Y ANTECEDENTES
===================================== */

.mensaje-error {
  color: #b91c1c !important;
  font-weight: 600;
}

.mensaje-exito {
  color: #166534 !important;
  font-weight: 600;
}

/* =====================================
   PROTECCIÓN CONTRA CSS GLOBAL
===================================== */

.contenedor h1,
.contenedor h2,
.contenedor h3,
.contenedor h4,
.contenedor p,
.contenedor label,
.contenedor th,
.contenedor td,
.contenedor span,
.contenedor strong {
  opacity: 1 !important;
  visibility: visible !important;
}

/* =====================================
   RESPONSIVE
===================================== */

@media (max-width: 700px) {
  .contenedor {
    padding: 16px;
  }

  .contenedor > header {
    align-items: flex-start;
    flex-direction: column;
  }

  .encabezado-historial {
    align-items: flex-start;
    flex-direction: column;
  }

  .acciones-historial {
    flex-direction: column;
  }

  .acciones-historial button {
    margin-left: 0;
  }

  .encabezado-alergias,
  .encabezado-antecedentes {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
