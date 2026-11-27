<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import {
  obtenerInternacionesActivas
} from '../services/admissionService'

import type {
  Internacion
} from '../services/admissionService'

import {
  registrarSignosVitales
} from '../services/vitalSignService'

import type {
  CrearSignosVitalesDTO,
  SignosVitales
} from '../services/vitalSignService'

import {
  obtenerMedicamentosPendientes,
  obtenerMedicamentosVencidos,
  registrarAdministracion
} from '../services/medicationService'

import type {
  MedicamentoPendiente,
  MedicamentoVencido,
} from '../services/medicationService'

import { cerrarSesion } from '../services/authService'

import {
  obtenerTareasEnfermeria,
  iniciarTarea,
  completarTarea,
  cancelarTarea
} from '../services/nursingTaskService'

import type {
  TareaEnfermeria,
  EstadoTareaEnfermeria
} from '../services/nursingTaskService'

const router = useRouter()

// INTERNACIONES
const internaciones = ref<Internacion[]>([])
const internacionSeleccionada = ref<number>(0)

// SIGNOS VITALES
const cargando = ref(false)
const guardando = ref(false)

const mensaje = ref('')
const error = ref('')

const ultimoRegistro = ref<SignosVitales | null>(null)

// MEDICAMENTOS
const medicamentos = ref<MedicamentoPendiente[]>([])
const medicamentosVencidos = ref<MedicamentoVencido[]>([])
const cargandoMedicamentos = ref(false)
const administrandoId = ref<number | null>(null)

const mensajeMedicamento = ref('')
const errorMedicamento = ref('')

const formulario = ref({
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 75,
  temperature: 36.5
})

const obtenerMensajeError = (err: unknown): string | undefined => {
  if (typeof err !== 'object' || err === null || !('response' in err)) {
    return undefined
  }

  const response = err.response

  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return undefined
  }

  const data = response.data

  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return undefined
  }

  if (typeof data.message === 'string') {
    return data.message
  }

  if (Array.isArray(data.message)) {
    return data.message.join(', ')
  }

  return undefined
}

// INTERNACIÓN SELECCIONADA
const internacionActual = computed(() =>
  internaciones.value.find(
    item => item.id === internacionSeleccionada.value
  )
)

// CARGAR INTERNACIONES
const cargarInternaciones = async () => {
  cargando.value = true
  error.value = ''

  try {
    internaciones.value = await obtenerInternacionesActivas()
  } catch (err: unknown) {
    error.value =
      obtenerMensajeError(err) ||
      'No se pudieron cargar las internaciones.'
  } finally {
    cargando.value = false
  }
}

// CARGAR MEDICAMENTOS PENDIENTES Y VENCIDOS
const cargarMedicamentos = async () => {
  cargandoMedicamentos.value = true
  errorMedicamento.value = ''

  try {
    const [pendientes, vencidos] = await Promise.all([
      obtenerMedicamentosPendientes(),
      obtenerMedicamentosVencidos()
    ])

    medicamentos.value = pendientes
    medicamentosVencidos.value = vencidos
  } catch (err: unknown) {
    errorMedicamento.value =
      obtenerMensajeError(err) ||
      'No se pudieron cargar los medicamentos.'
  } finally {
    cargandoMedicamentos.value = false
  }
}

// VERIFICAR SI LA DOSIS ESTÁ DENTRO DEL MARGEN PERMITIDO
const puedeAdministrar = (medicamento: MedicamentoPendiente) => {
  if (medicamento.status !== 'pendiente') {
    return false
  }

  const horario = new Date(medicamento.scheduledAt).getTime()
  const ahora = Date.now()
  const margen = 30 * 60 * 1000

  return (
    ahora >= horario - margen &&
    ahora <= horario + margen
  )
}


const obtenerPiso = (roomNumber: string) => {
  const piso = Number(roomNumber.charAt(0))

  return Number.isInteger(piso) && piso > 0
    ? piso
    : null
}

// REGISTRAR ADMINISTRACIÓN
const administrarMedicamento = async (
  medicamento: MedicamentoPendiente
) => {
  mensajeMedicamento.value = ''
  errorMedicamento.value = ''

  if (medicamento.status === 'administrada') {
    errorMedicamento.value = 'Esta dosis ya fue administrada.'
    return
  }

  if (!puedeAdministrar(medicamento)) {
    errorMedicamento.value =
      'La administración debe realizarse dentro de los 30 minutos anteriores o posteriores al horario programado.'
    return
  }

  administrandoId.value = medicamento.medicationOrderId

  try {
    await registrarAdministracion(
      medicamento.medicationOrderId,
      {
        scheduledAt: medicamento.scheduledAt,
        notes: 'Administración registrada desde el panel de enfermería.'
      }
    )

    mensajeMedicamento.value =
      `Se registró correctamente la administración de ${medicamento.medicationName}.`

    await cargarMedicamentos()
  } catch (err: unknown) {
    errorMedicamento.value =
      obtenerMensajeError(err) ||
      'No se pudo registrar la administración.'
  } finally {
    administrandoId.value = null
  }
}

// REGISTRAR SIGNOS VITALES
const guardarControl = async () => {
  mensaje.value = ''
  error.value = ''
  ultimoRegistro.value = null

  if (!internacionActual.value) {
    error.value = 'Seleccioná un paciente internado.'
    return
  }

  const datos: CrearSignosVitalesDTO = {
    patientId: internacionActual.value.patientId,
    admissionId: internacionActual.value.id,
    bloodPressureSystolic: formulario.value.bloodPressureSystolic,
    bloodPressureDiastolic: formulario.value.bloodPressureDiastolic,
    heartRate: formulario.value.heartRate,
    temperature: formulario.value.temperature
  }

  guardando.value = true

  try {
    ultimoRegistro.value = await registrarSignosVitales(datos)

    mensaje.value = 'Los signos vitales fueron registrados correctamente.'

    formulario.value = {
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 75,
      temperature: 36.5
    }
  } catch (err: unknown) {
    error.value =
      obtenerMensajeError(err) ||
      'No se pudieron registrar los signos vitales.'
  } finally {
    guardando.value = false
  }
}

// TAREAS DE ENFERMERÍA
const tareas = ref<TareaEnfermeria[]>([])
const cargandoTareas = ref(false)
const procesandoTareaId = ref<number | null>(null)

const mensajeTarea = ref('')
const errorTarea = ref('')

const filtroTareas = ref<'TODAS' | EstadoTareaEnfermeria>('TODAS')

const tareaCancelacion = ref<TareaEnfermeria | null>(null)
const motivoCancelacion = ref('')

const tareasFiltradas = computed(() => {
  if (filtroTareas.value === 'TODAS') {
    return tareas.value
  }

  return tareas.value.filter(
    tarea => tarea.status === filtroTareas.value
  )
})

// CARGAR TAREAS
const cargarTareas = async () => {
  cargandoTareas.value = true
  errorTarea.value = ''

  try {
    tareas.value = await obtenerTareasEnfermeria()
  } catch (err: unknown) {
    errorTarea.value =
      obtenerMensajeError(err) ||
      'No se pudieron cargar las tareas de enfermería.'
  } finally {
    cargandoTareas.value = false
  }
}

// INICIAR TAREA
const ejecutarInicioTarea = async (tarea: TareaEnfermeria) => {
  mensajeTarea.value = ''
  errorTarea.value = ''
  procesandoTareaId.value = tarea.id

  try {
    await iniciarTarea(tarea.id)
    mensajeTarea.value = 'La tarea se inició correctamente.'
    await cargarTareas()
  } catch (err: unknown) {
    errorTarea.value =
      obtenerMensajeError(err) || 'No se pudo iniciar la tarea.'
  } finally {
    procesandoTareaId.value = null
  }
}

// COMPLETAR TAREA
const ejecutarCompletarTarea = async (tarea: TareaEnfermeria) => {
  mensajeTarea.value = ''
  errorTarea.value = ''
  procesandoTareaId.value = tarea.id

  try {
    await completarTarea(tarea.id)
    mensajeTarea.value = 'La tarea se completó correctamente.'
    await cargarTareas()
  } catch (err: unknown) {
    errorTarea.value =
      obtenerMensajeError(err) || 'No se pudo completar la tarea.'
  } finally {
    procesandoTareaId.value = null
  }
}

// ABRIR FORMULARIO DE CANCELACIÓN
const abrirCancelacion = (tarea: TareaEnfermeria) => {
  tareaCancelacion.value = tarea
  motivoCancelacion.value = ''
  mensajeTarea.value = ''
  errorTarea.value = ''
}

// CANCELAR TAREA
const ejecutarCancelacion = async () => {
  if (!tareaCancelacion.value) return

  const reason = motivoCancelacion.value.trim()

  if (!reason) {
    errorTarea.value = 'Ingresá una justificación para cancelar la tarea.'
    return
  }

  const tareaId = tareaCancelacion.value.id

  procesandoTareaId.value = tareaId
  mensajeTarea.value = ''
  errorTarea.value = ''

  try {
    await cancelarTarea(tareaId, reason)

    tareaCancelacion.value = null
    motivoCancelacion.value = ''

    mensajeTarea.value = 'La tarea fue cancelada correctamente.'
    await cargarTareas()
  } catch (err: unknown) {
    errorTarea.value =
      obtenerMensajeError(err) || 'No se pudo cancelar la tarea.'
  } finally {
    procesandoTareaId.value = null
  }
}

// CERRAR FORMULARIO DE CANCELACIÓN
const cerrarCancelacion = () => {
  tareaCancelacion.value = null
  motivoCancelacion.value = ''
  errorTarea.value = ''
}

// TEXTO DE ESTADO
const obtenerTextoEstado = (estado: EstadoTareaEnfermeria) => {
  const estados: Record<EstadoTareaEnfermeria, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada'
  }

  return estados[estado]
}

// FORMATO DE FECHAS
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleString('es-AR')
}

const irHistorialMedicaciones = () => {
  router.push('/enfermero/historial-medicaciones')
}

// CERRAR SESIÓN
const salir = () => {
  cerrarSesion()
  router.push('/login')
}

// CARGA INICIAL
onMounted(() => {
  cargarInternaciones()
  cargarMedicamentos()
  cargarTareas()
})
</script>

<template>
  <div class="contenedor-enfermeria">

    <header class="encabezado">
      <div>
        <h1>Panel de Enfermería</h1>
        <p>Registro y seguimiento de pacientes, signos vitales y medicamentos</p>
      </div>

      <div class="acciones-encabezado">
        <button
          class="boton-historial"
          @click="irHistorialMedicaciones"
        >
          Historial de medicamentos
        </button>

        <button class="boton-salir" @click="salir">
          Cerrar sesión
        </button>
      </div>
    </header>

    <!-- PACIENTES INTERNADOS -->
    <section class="panel">

      <h2>Pacientes internados</h2>

      <p v-if="cargando">
        Cargando pacientes internados...
      </p>

      <p v-else-if="internaciones.length === 0">
        No hay pacientes con internaciones activas.
      </p>

      <div v-else class="campo">
        <label for="paciente">Seleccionar paciente</label>

        <select
          id="paciente"
          v-model.number="internacionSeleccionada"
        >
          <option :value="0">
            Seleccionar paciente
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
      </div>

      <div
        v-if="internacionActual"
        class="datos-paciente"
      >
        <h3>Información del paciente</h3>

        <p>
          <strong>Paciente:</strong>
          {{ internacionActual.patient.firstName }}
          {{ internacionActual.patient.lastName }}
        </p>

        <p>
          <strong>DNI:</strong>
          {{ internacionActual.patient.dni }}
        </p>

        <p>
          <strong>Habitación:</strong>
          {{ internacionActual.room.roomNumber }}
        </p>

        <p>
          <strong>Fecha de ingreso:</strong>
          {{ formatearFecha(internacionActual.admissionDate) }}
        </p>
      </div>

    </section>

    <!-- REGISTRO DE SIGNOS VITALES -->
    <section
      v-if="internacionActual"
      class="panel"
    >
      <h2>Registrar signos vitales</h2>

      <form @submit.prevent="guardarControl">

        <div class="campo">
          <label>Presión arterial sistólica (mmHg)</label>
          <input
            v-model.number="formulario.bloodPressureSystolic"
            type="number"
            min="1"
            required
          />
        </div>

        <div class="campo">
          <label>Presión arterial diastólica (mmHg)</label>
          <input
            v-model.number="formulario.bloodPressureDiastolic"
            type="number"
            min="1"
            required
          />
        </div>

        <div class="campo">
          <label>Frecuencia cardíaca (latidos por minuto)</label>
          <input
            v-model.number="formulario.heartRate"
            type="number"
            min="1"
            required
          />
        </div>

        <div class="campo">
          <label>Temperatura (°C)</label>
          <input
            v-model.number="formulario.temperature"
            type="number"
            min="1"
            max="50"
            step="0.1"
            required
          />
        </div>

        <button
          type="submit"
          class="boton-guardar"
          :disabled="guardando"
        >
          {{ guardando ? 'Guardando...' : 'Guardar controles' }}
        </button>

      </form>

      <p v-if="mensaje" class="mensaje-exito">
        {{ mensaje }}
      </p>

      <p v-if="error" class="mensaje-error">
        {{ error }}
      </p>

      <div
        v-if="ultimoRegistro"
        class="nota-enfermeria"
      >
        <h3>Nota de enfermería generada</h3>

        <p>{{ ultimoRegistro.nursingNote }}</p>

        <p>
          <strong>Fecha y hora:</strong>
          {{ formatearFecha(ultimoRegistro.recordedAt) }}
        </p>
      </div>

    </section>

    <!-- ADMINISTRACIÓN DE MEDICAMENTOS -->
    <section class="panel">

      <div class="titulo-seccion">
        <div>
          <h2>Administración de medicamentos</h2>
          <p>Dosis pendientes para pacientes internados</p>
        </div>

        <button
          type="button"
          class="boton-actualizar"
          @click="cargarMedicamentos"
          :disabled="cargandoMedicamentos"
        >
          {{ cargandoMedicamentos ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>

      <p v-if="cargandoMedicamentos">
        Cargando medicamentos...
      </p>

      <p v-else-if="medicamentos.length === 0">
        No hay dosis pendientes para la fecha actual.
      </p>

      <div v-else class="lista-medicamentos">
        <article
          v-for="medicamento in medicamentos"
          :key="`${medicamento.medicationOrderId}-${medicamento.scheduledAt}`"
          class="tarjeta-medicamento"
        >
          <div class="medicamento-encabezado">
            <div>
              <h3>{{ medicamento.medicationName }}</h3>
              <p>{{ medicamento.dosage }}</p>
            </div>

            <span class="estado pendiente">
              Pendiente
            </span>
          </div>

          <div class="datos-medicamento">
            <p>
              <strong>Paciente:</strong>
              {{ medicamento.patient.firstName }}
              {{ medicamento.patient.lastName }}
            </p>

            <p>
              <strong>Habitación:</strong>
              {{ medicamento.admission.room.roomNumber }}
            </p>

            <p>
              <strong>Piso:</strong>
              {{
                obtenerPiso(medicamento.admission.room.roomNumber) ?? 'No identificado'
              }}
            </p>

            <p>
              <strong>Médico:</strong>
              {{ medicamento.doctor.firstName }}
              {{ medicamento.doctor.lastName }}
            </p>

            <p>
              <strong>Frecuencia:</strong>
              Cada {{ medicamento.frequencyHours }} horas
            </p>

            <p>
              <strong>Horario programado:</strong>
              {{ formatearFecha(medicamento.scheduledAt) }}
            </p>
          </div>

          <div class="acciones-medicamento">
            <button
              type="button"
              class="boton-administrar"
              :disabled="
                !puedeAdministrar(medicamento) ||
                administrandoId !== null
              "
              @click="administrarMedicamento(medicamento)"
            >
              {{
                administrandoId === medicamento.medicationOrderId
                  ? 'Registrando...'
                  : 'Registrar administración'
              }}
            </button>

            <p
              v-if="!puedeAdministrar(medicamento)"
              class="aviso-horario"
            >
              Disponible dentro del margen de 30 minutos del horario programado.
            </p>
          </div>
        </article>
      </div>

      <p v-if="mensajeMedicamento" class="mensaje-exito">
        {{ mensajeMedicamento }}
      </p>

      <p v-if="errorMedicamento" class="mensaje-error">
        {{ errorMedicamento }}
      </p>

    </section>

    <!-- DOSIS VENCIDAS -->
    <section class="panel panel-vencidas">

      <div class="titulo-seccion">
        <div>
          <h2>Dosis vencidas</h2>
          <p>Dosis que superaron el margen permitido de administración</p>
        </div>

        <span class="contador-vencidas">
          {{ medicamentosVencidos.length }}
        </span>
      </div>

      <p v-if="cargandoMedicamentos">
        Consultando dosis vencidas...
      </p>

      <p v-else-if="medicamentosVencidos.length === 0">
        No hay dosis vencidas para la fecha actual.
      </p>

      <div v-else class="lista-medicamentos">
        <article
          v-for="medicamento in medicamentosVencidos"
          :key="`${medicamento.medicationOrderId}-${medicamento.scheduledAt}`"
          class="tarjeta-medicamento tarjeta-vencida"
        >
          <div class="medicamento-encabezado">
            <div>
              <h3>{{ medicamento.medicationName }}</h3>
              <p>{{ medicamento.dosage }}</p>
            </div>

            <span class="estado vencida">
              Vencida
            </span>
          </div>

          <div class="datos-medicamento">
            <p>
              <strong>Paciente:</strong>
              {{ medicamento.patient.firstName }}
              {{ medicamento.patient.lastName }}
            </p>

            <p>
              <strong>Habitación:</strong>
              {{ medicamento.admission.room.roomNumber }}
            </p>

            <p>
              <strong>Piso:</strong>
              {{
                obtenerPiso(medicamento.admission.room.roomNumber) ?? 'No identificado'
              }}
            </p>

            <p>
              <strong>Médico:</strong>
              {{ medicamento.doctor.firstName }}
              {{ medicamento.doctor.lastName }}
            </p>

            <p>
              <strong>Frecuencia:</strong>
              Cada {{ medicamento.frequencyHours }} horas
            </p>

            <p>
              <strong>Horario programado:</strong>
              {{ formatearFecha(medicamento.scheduledAt) }}
            </p>
          </div>

          <p class="aviso-vencida">
            Esta dosis superó el margen permitido de administración.
            Consultá con el médico antes de proceder.
          </p>
        </article>
      </div>

    </section>


    <!-- TAREAS DE ENFERMERÍA -->
    <section class="panel">

      <div class="titulo-seccion">
        <div>
          <h2>Tareas de enfermería</h2>
          <p>Seguimiento de actividades y protocolos de internación</p>
        </div>

        <button
          type="button"
          class="boton-actualizar"
          @click="cargarTareas"
          :disabled="cargandoTareas"
        >
          {{ cargandoTareas ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>

      <div class="filtros-tareas">
        <label for="filtro-tareas">Filtrar tareas:</label>

        <select id="filtro-tareas" v-model="filtroTareas">
          <option value="TODAS">Todas</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="COMPLETADA">Completadas</option>
          <option value="CANCELADA">Canceladas</option>
        </select>
      </div>

      <p v-if="cargandoTareas">
        Cargando tareas de enfermería...
      </p>

      <p v-else-if="tareasFiltradas.length === 0">
        No hay tareas para el filtro seleccionado.
      </p>

      <div v-else class="lista-tareas">

        <article
          v-for="tarea in tareasFiltradas"
          :key="tarea.id"
          class="tarjeta-tarea"
        >

          <div class="tarea-encabezado">
            <h3>{{ tarea.title }}</h3>

            <span
              class="estado-tarea"
              :class="tarea.status.toLowerCase()"
            >
              {{ obtenerTextoEstado(tarea.status) }}
            </span>
          </div>

          <div class="datos-tarea">

            <p>
              <strong>Paciente:</strong>
              {{ tarea.admission?.patient?.firstName || 'No disponible' }}
              {{ tarea.admission?.patient?.lastName || '' }}
            </p>

            <p>
              <strong>Habitación:</strong>
              {{ tarea.admission?.room?.roomNumber || 'No disponible' }}
            </p>

            <p>
              <strong>Descripción:</strong>
              {{ tarea.description }}
            </p>

            <p v-if="tarea.frequency">
              <strong>Frecuencia:</strong>
              {{ tarea.frequency }}
            </p>

            <p v-if="tarea.startedAt">
              <strong>Inicio:</strong>
              {{ formatearFecha(tarea.startedAt) }}
            </p>

            <p v-if="tarea.completedAt">
              <strong>Finalización:</strong>
              {{ formatearFecha(tarea.completedAt) }}
            </p>

            <p v-if="tarea.reason">
              <strong>Justificación de cancelación:</strong>
              {{ tarea.reason }}
            </p>

          </div>

          <div
            v-if="tarea.status === 'PENDIENTE' || tarea.status === 'EN_PROCESO'"
            class="acciones-tarea"
          >

            <button
              v-if="tarea.status === 'PENDIENTE'"
              type="button"
              class="boton-iniciar-tarea"
              :disabled="procesandoTareaId !== null"
              @click="ejecutarInicioTarea(tarea)"
            >
              {{
                procesandoTareaId === tarea.id
                  ? 'Procesando...'
                  : 'Iniciar tarea'
              }}
            </button>

            <button
              v-if="tarea.status === 'EN_PROCESO'"
              type="button"
              class="boton-completar-tarea"
              :disabled="procesandoTareaId !== null"
              @click="ejecutarCompletarTarea(tarea)"
            >
              {{
                procesandoTareaId === tarea.id
                  ? 'Procesando...'
                  : 'Completar tarea'
              }}
            </button>

            <button
              type="button"
              class="boton-cancelar-tarea"
              :disabled="procesandoTareaId !== null"
              @click="abrirCancelacion(tarea)"
            >
              Cancelar tarea
            </button>

          </div>

        </article>

      </div>

      <!-- MENSAJES -->
      <p v-if="mensajeTarea" class="mensaje-exito">
        {{ mensajeTarea }}
      </p>

      <p v-if="errorTarea" class="mensaje-error">
        {{ errorTarea }}
      </p>

      <!-- FORMULARIO DE CANCELACIÓN -->
      <div
        v-if="tareaCancelacion"
        class="formulario-cancelacion"
      >
        <h3>Cancelar tarea</h3>

        <p>
          {{ tareaCancelacion.title }}
        </p>

        <div class="campo">
          <label for="motivo-cancelacion">
            Justificación de la cancelación
          </label>

          <textarea
            id="motivo-cancelacion"
            v-model="motivoCancelacion"
            rows="4"
            maxlength="1000"
            placeholder="Explicá por qué se cancela esta tarea..."
            required
          ></textarea>
        </div>

        <div class="acciones-cancelacion">
          <button
            type="button"
            class="boton-cancelar-tarea"
            :disabled="procesandoTareaId !== null"
            @click="ejecutarCancelacion"
          >
            Confirmar cancelación
          </button>

          <button
            type="button"
            class="boton-actualizar"
            :disabled="procesandoTareaId !== null"
            @click="cerrarCancelacion"
          >
            Volver
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.contenedor-enfermeria {
  max-width: 1100px;
  margin: 0 auto;
  padding: 25px;
  color: #1e293b;
  background: #f1f5f9;
  min-height: 100vh;
  color-scheme: light;
  box-sizing: border-box;
}

.contenedor-enfermeria * {
  box-sizing: border-box;
}

.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 25px;
  padding: 22px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
}

.encabezado h1 {
  margin: 0 0 7px;
  color: #0f172a;
  font-size: 26px;
}

.encabezado p {
  margin: 0;
  color: #475569;
}

.acciones-encabezado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.panel {
  padding: 25px;
  margin-bottom: 25px;
  background: #ffffff;
  color: #1e293b;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.panel h2 {
  margin: 0 0 18px;
  color: #0f172a;
  font-size: 21px;
}

.panel h3 {
  color: #1e293b;
}

.panel p {
  color: #334155;
  line-height: 1.5;
}

.panel strong {
  color: #0f172a;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.campo label,
.filtros-tareas label {
  color: #1e293b;
  font-weight: 600;
}

.campo input,
.campo select,
.campo textarea,
.filtros-tareas select {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #94a3b8;
  border-radius: 7px;
  background: #ffffff;
  color: #0f172a;
  font-size: 15px;
  font-family: inherit;
}

.campo input::placeholder,
.campo textarea::placeholder {
  color: #64748b;
  opacity: 1;
}

.campo input:focus,
.campo select:focus,
.campo textarea:focus,
.filtros-tareas select:focus {
  outline: 3px solid rgba(37, 99, 235, 0.2);
  border-color: #2563eb;
}

.campo select option,
.filtros-tareas select option {
  color: #0f172a;
  background: #ffffff;
}

.datos-paciente {
  margin-top: 20px;
  padding: 18px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
}

.datos-paciente h3 {
  margin-top: 0;
  color: #1e3a8a;
}

.datos-paciente p {
  margin: 8px 0;
  color: #1e293b;
}

.boton-guardar,
.boton-salir,
.boton-actualizar,
.boton-administrar,
.boton-historial,
.boton-iniciar-tarea,
.boton-completar-tarea,
.boton-cancelar-tarea {
  padding: 11px 18px;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.2s ease, transform 0.15s ease;
}

.boton-guardar,
.boton-administrar,
.boton-historial,
.boton-iniciar-tarea {
  background: #1d4ed8;
  color: #ffffff;
}

.boton-guardar:hover,
.boton-administrar:hover,
.boton-historial:hover,
.boton-iniciar-tarea:hover {
  background: #1e40af;
}

.boton-salir,
.boton-cancelar-tarea {
  background: #b91c1c;
  color: #ffffff;
}

.boton-salir:hover,
.boton-cancelar-tarea:hover {
  background: #991b1b;
}

.boton-completar-tarea {
  background: #15803d;
  color: #ffffff;
}

.boton-completar-tarea:hover {
  background: #166534;
}

.boton-actualizar {
  background: #e2e8f0;
  color: #1e293b;
}

.boton-actualizar:hover {
  background: #cbd5e1;
}

.boton-guardar:disabled,
.boton-actualizar:disabled,
.boton-administrar:disabled,
.boton-iniciar-tarea:disabled,
.boton-completar-tarea:disabled,
.boton-cancelar-tarea:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.mensaje-exito {
  margin-top: 15px;
  padding: 12px 14px;
  border: 1px solid #86efac;
  border-radius: 7px;
  background: #f0fdf4;
  color: #166534 !important;
  font-weight: 600;
}

.mensaje-error {
  margin-top: 15px;
  padding: 12px 14px;
  border: 1px solid #fca5a5;
  border-radius: 7px;
  background: #fef2f2;
  color: #991b1b !important;
  font-weight: 600;
}

.nota-enfermeria {
  margin-top: 20px;
  padding: 18px;
  border-left: 4px solid #16a34a;
  border-radius: 7px;
  background: #f0fdf4;
}

.nota-enfermeria h3 {
  color: #166534;
}

.nota-enfermeria p {
  color: #14532d;
}

.titulo-seccion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.titulo-seccion h2 {
  margin-bottom: 5px;
}

.titulo-seccion p {
  margin: 0;
  color: #475569;
}

.lista-medicamentos,
.lista-tareas {
  display: grid;
  gap: 18px;
}

.tarjeta-medicamento,
.tarjeta-tarea {
  padding: 18px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
}

.medicamento-encabezado,
.tarea-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.medicamento-encabezado h3,
.tarea-encabezado h3 {
  margin: 0 0 5px;
  color: #0f172a;
}

.medicamento-encabezado p {
  margin: 0;
  color: #475569;
}

.datos-medicamento,
.datos-tarea {
  padding: 13px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.datos-medicamento p,
.datos-tarea p {
  margin: 8px 0;
  color: #334155;
}

.datos-medicamento strong,
.datos-tarea strong {
  color: #0f172a;
}

.acciones-medicamento {
  margin-top: 15px;
}

.estado,
.estado-tarea {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.estado.pendiente,
.estado-tarea.pendiente {
  background: #fef3c7;
  color: #78350f;
}

.estado.administrada,
.estado-tarea.completada {
  background: #dcfce7;
  color: #14532d;
}

.estado.vencida {
  background: #fee2e2;
  color: #991b1b;
}

.estado-tarea.en_proceso {
  background: #dbeafe;
  color: #1e3a8a;
}

.estado-tarea.cancelada {
  background: #fee2e2;
  color: #991b1b;
}

.aviso-horario {
  margin-top: 9px;
  color: #475569;
  font-size: 13px;
}

.panel-vencidas {
  border-left: 4px solid #dc2626;
}

.tarjeta-vencida {
  border: 1px solid #fca5a5;
  background: #fffafa;
}

.contador-vencidas {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  border-radius: 50%;
  background: #fee2e2;
  color: #991b1b;
  font-weight: 700;
}

.aviso-vencida {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #fecaca;
  border-radius: 7px;
  background: #fff1f2;
  color: #991b1b !important;
  font-size: 13px;
  font-weight: 600;
}

.filtros-tareas {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.filtros-tareas select {
  width: auto;
  min-width: 190px;
}

.tarea-encabezado h3 {
  margin: 0;
}

.acciones-tarea,
.acciones-cancelacion {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.formulario-cancelacion {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  background: #fff7f7;
}

.formulario-cancelacion h3 {
  margin-top: 0;
  color: #991b1b;
}

.formulario-cancelacion textarea {
  min-height: 100px;
  resize: vertical;
}

.formulario-cancelacion > p {
  color: #334155;
  font-weight: 600;
}

@media (max-width: 700px) {
  .contenedor-enfermeria {
    padding: 12px;
  }

  .encabezado {
    align-items: stretch;
    flex-direction: column;
    padding: 18px;
  }

  .encabezado h1 {
    font-size: 22px;
  }

  .acciones-encabezado {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .acciones-encabezado button {
    width: 100%;
  }

  .panel {
    padding: 17px;
  }

  .titulo-seccion {
    align-items: flex-start;
    flex-direction: column;
  }

  .medicamento-encabezado,
  .tarea-encabezado {
    align-items: flex-start;
    flex-direction: column;
  }

  .filtros-tareas {
    align-items: stretch;
    flex-direction: column;
  }

  .filtros-tareas select {
    width: 100%;
  }

  .acciones-tarea,
  .acciones-cancelacion {
    flex-direction: column;
  }

  .acciones-tarea button,
  .acciones-cancelacion button {
    width: 100%;
  }
}
</style>
