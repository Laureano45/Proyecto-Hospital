<template>
  <div class="historial-container">
    <h1>Historial de turnos</h1>
    <button
      class="boton-volver"
      @click="$router.push('/recepcion')">
        Volver al panel de recepción
    </button>
    <p class="descripcion">
      Consulta y filtra todos los turnos registrados en el sistema.
    </p>

    <div class="filtros">
      <input
        v-model="busqueda"
        type="text"
        placeholder="Buscar por paciente o médico..."
      />

      <select v-model="filtroEstado">
        <option value="">Todos los estados</option>
        <option value="PROGRAMADO">Programado</option>
        <option value="CONFIRMADO">Confirmado</option>
        <option value="EN_SALA_DE_ESPERA">En sala de espera</option>
        <option value="ATENDIDO">Atendido</option>
        <option value="CANCELADO">Cancelado</option>
      </select>
    </div>

    <p v-if="cargando">Cargando historial...</p>
    <p v-else-if="error" class="mensaje-error">{{ error }}</p>

    <template v-else>
      <p class="cantidad">
        Turnos encontrados: {{ turnosFiltrados.length }}
      </p>

      <div v-if="turnosFiltrados.length === 0" class="sin-resultados">
        No se encontraron turnos con esos filtros.
      </div>

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
              <th>Especialidad</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="turno in turnosFiltrados" :key="turno.id">
              <td>{{ formatearFecha(turno.appointmentDate) }}</td>
              <td>
                {{ turno.appointmentTime }}
                -
                {{ obtenerHoraFin(turno) }}
              </td>
              <td>{{ turno.durationMinutes ?? 30 }} min</td>
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
              <td>
                {{ turno.patient.firstName }}
                {{ turno.patient.lastName }}
              </td>
              <td>
                {{ turno.doctor.firstName }}
                {{ turno.doctor.lastName }}
              </td>
              <td>{{ turno.doctor.specialty }}</td>
              <td>
                <span
                  class="estado"
                  :class="claseEstado(turno.status)"
                >
                  {{ textoEstado(turno.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <button class="boton-actualizar" @click="cargarTurnos">
      Actualizar historial
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  obtenerTodosLosTurnos
} from '../services/appointmentService'
import type {
  Turno,
  EstadoTurno
} from '../services/appointmentService'

const turnos = ref<Turno[]>([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const filtroEstado = ref('')

const turnosFiltrados = computed(() => {
  return turnos.value
    .filter((turno) => {
      const paciente =
        `${turno.patient.firstName} ${turno.patient.lastName}`.toLowerCase()

      const medico =
        `${turno.doctor.firstName} ${turno.doctor.lastName}`.toLowerCase()

      const texto = busqueda.value.trim().toLowerCase()

      const coincideBusqueda =
        !texto ||
        paciente.includes(texto) ||
        medico.includes(texto)

      const coincideEstado =
        !filtroEstado.value ||
        turno.status === filtroEstado.value

      return coincideBusqueda && coincideEstado
    })
    .sort((a, b) => {
      const fechaA = `${a.appointmentDate}T${a.appointmentTime}`
      const fechaB = `${b.appointmentDate}T${b.appointmentTime}`

      return fechaB.localeCompare(fechaA)
    })
})

const cargarTurnos = async () => {
  cargando.value = true
  error.value = ''

  try {
    turnos.value = await obtenerTodosLosTurnos()
  } catch (err) {
    console.error('Error al cargar el historial:', err)
    error.value = 'No se pudo cargar el historial de turnos.'
  } finally {
    cargando.value = false
  }
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
const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

const textoEstado = (estado: EstadoTurno) => {
  const estados: Record<EstadoTurno, string> = {
    PROGRAMADO: 'Programado',
    CONFIRMADO: 'Confirmado',
    EN_SALA_DE_ESPERA: 'En sala de espera',
    ATENDIDO: 'Atendido',
    CANCELADO: 'Cancelado'
  }

  return estados[estado]
}

const claseEstado = (estado: EstadoTurno) => {
  return estado.toLowerCase().replaceAll('_', '-')
}

onMounted(cargarTurnos)
</script>


<style scoped>
.historial-container {
  max-width: 1200px;
  margin: 30px auto;
  padding: 24px;
  background: #ffffff !important;
  color: #1e293b !important;
  border-radius: 10px;
  box-shadow: 0 4px 15px #0002;
}

/* TÍTULO */

.historial-container h1 {
  margin-bottom: 8px;
  color: #0f172a !important;
  font-size: 28px;
  font-weight: 800;
  opacity: 1 !important;
}

/* DESCRIPCIÓN */

.descripcion {
  color: #475569 !important;
  margin-bottom: 24px;
}

/* BOTÓN VOLVER */

.boton-volver {
  padding: 10px 16px;
  margin-bottom: 15px;
  background-color: #475569;
  color: #ffffff !important;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.boton-volver:hover {
  background-color: #334155;
}

/* FILTROS */

.filtros {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.filtros input,
.filtros select {
  padding: 10px;
  border: 1px solid #94a3b8;
  border-radius: 6px;
  font-size: 14px;
  color: #0f172a !important;
  background: #ffffff !important;
}

.filtros input {
  flex: 1;
}

.filtros input::placeholder {
  color: #94a3b8 !important;
}

.filtros input:focus,
.filtros select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #2563eb20;
}

.filtros select option {
  color: #0f172a;
  background: #ffffff;
}

/* CANTIDAD */

.cantidad {
  margin-bottom: 12px;
  font-weight: 700;
  color: #1e293b !important;
}

/* TABLA */

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
  border-bottom: 1px solid #cbd5e1;
  text-align: left;
  white-space: nowrap;
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

/* ESTADOS */

.estado {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
}

.programado {
  background: #dbeafe !important;
  color: #1d4ed8 !important;
}

.confirmado {
  background: #dcfce7 !important;
  color: #166534 !important;
}

.en-sala-de-espera {
  background: #fef3c7 !important;
  color: #92400e !important;
}

.atendido {
  background: #ccfbf1 !important;
  color: #115e59 !important;
}

.cancelado {
  background: #fee2e2 !important;
  color: #991b1b !important;
}

/* TIPO DE TURNO */

.etiqueta-entreturno {
  background-color: #dcfce7 !important;
  color: #166534 !important;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 12px;
}

.etiqueta-modificado {
  background-color: #fef3c7 !important;
  color: #92400e !important;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 12px;
}

.etiqueta-normal {
  background-color: #e5e7eb !important;
  color: #374151 !important;
  padding: 5px 10px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 12px;
}

/* SIN RESULTADOS */

.sin-resultados {
  padding: 24px;
  text-align: center;
  color: #334155 !important;
  background: #f1f5f9 !important;
  border-radius: 6px;
}

/* ERRORES */

.mensaje-error {
  color: #b91c1c !important;
  font-weight: 600;
}

/* ACTUALIZAR */

.boton-actualizar {
  margin-top: 20px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: #ffffff !important;
  font-weight: 700;
  cursor: pointer;
}

.boton-actualizar:hover {
  background: #1d4ed8;
}

/* PROTECCIÓN CONTRA ESTILOS GLOBALES */

.historial-container h1,
.historial-container p,
.historial-container th,
.historial-container td,
.historial-container span {
  opacity: 1 !important;
  visibility: visible !important;
}

.historial-container h1 {
  text-shadow: none !important;
}

/* RESPONSIVE */

@media (max-width: 650px) {
  .historial-container {
    padding: 16px;
    margin: 15px;
  }

  .filtros {
    flex-direction: column;
  }
}
</style>
