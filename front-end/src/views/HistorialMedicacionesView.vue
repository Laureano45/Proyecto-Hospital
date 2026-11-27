
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import {
  obtenerHistorialAdministraciones
} from '../services/medicationService'

import type {
  HistorialAdministracionMedicamento
} from '../services/medicationService'

import { cerrarSesion } from '../services/authService'

const router = useRouter()

const administraciones = ref<HistorialAdministracionMedicamento[]>([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const fechaFiltro = ref('')

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

const cargarHistorial = async () => {
  cargando.value = true
  error.value = ''

  try {
    administraciones.value = await obtenerHistorialAdministraciones()
  } catch (err: unknown) {
    error.value =
      obtenerMensajeError(err) ||
      'No se pudo cargar el historial de administraciones.'
  } finally {
    cargando.value = false
  }
}

const historialFiltrado = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()

  return administraciones.value.filter(item => {
    const paciente = item.medicationOrder?.patient
    const medicamento = item.medicationOrder

    const nombrePaciente = paciente
      ? `${paciente.firstName} ${paciente.lastName}`.toLowerCase()
      : ''

    const nombreMedicamento = medicamento?.medicationName.toLowerCase() || ''
    const dni = paciente?.dni || ''

    const coincideBusqueda =
      !termino ||
      nombrePaciente.includes(termino) ||
      nombreMedicamento.includes(termino) ||
      dni.includes(termino)

    const fechaAdministracion = new Date(item.administeredAt)
    const fechaLocal = [
      fechaAdministracion.getFullYear(),
      String(fechaAdministracion.getMonth() + 1).padStart(2, '0'),
      String(fechaAdministracion.getDate()).padStart(2, '0')
    ].join('-')

    const coincideFecha =
      !fechaFiltro.value || fechaLocal === fechaFiltro.value

    return coincideBusqueda && coincideFecha
  })
})

const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleString('es-AR')
}

const volver = () => {
  router.push('/enfermero')
}

const salir = () => {
  cerrarSesion()
  router.push('/login')
}

onMounted(() => {
  cargarHistorial()
})
</script>

<template>
  <div class="contenedor-historial">

    <header class="encabezado">
      <div>
        <h1>Historial de medicamentos</h1>
        <p>Registro de administraciones realizadas a pacientes internados</p>
      </div>

      <div class="acciones-encabezado">
        <button class="boton-volver" @click="volver">
          Volver
        </button>

        <button class="boton-salir" @click="salir">
          Cerrar sesión
        </button>
      </div>
    </header>

    <section class="panel">

      <div class="titulo-seccion">
        <div>
          <h2>Administraciones registradas</h2>
          <p>Consultá el detalle de cada dosis administrada</p>
        </div>

        <button
          class="boton-actualizar"
          @click="cargarHistorial"
          :disabled="cargando"
        >
          {{ cargando ? 'Actualizando...' : 'Actualizar' }}
        </button>
      </div>

      <div class="filtros">
        <div class="campo">
          <label for="busqueda">Buscar paciente, DNI o medicamento</label>
          <input
            id="busqueda"
            v-model="busqueda"
            type="text"
            placeholder="Ingresar nombre, DNI o medicamento"
          />
        </div>

        <div class="campo">
          <label for="fecha">Fecha de administración</label>
          <input
            id="fecha"
            v-model="fechaFiltro"
            type="date"
          />
        </div>
      </div>

      <p v-if="cargando">
        Cargando historial de administraciones...
      </p>

      <p v-else-if="error" class="mensaje-error">
        {{ error }}
      </p>

      <p v-else-if="administraciones.length === 0">
        Todavía no hay administraciones registradas.
      </p>

      <p v-else-if="historialFiltrado.length === 0">
        No se encontraron administraciones con los filtros seleccionados.
      </p>

      <div v-else class="lista-administraciones">

        <article
          v-for="item in historialFiltrado"
          :key="item.id"
          class="tarjeta-administracion"
        >

          <div class="administracion-encabezado">
            <div>
              <h3>
                {{ item.medicationOrder?.medicationName || 'Medicamento no disponible' }}
              </h3>

              <p>
                {{ item.medicationOrder?.dosage || 'Dosis no disponible' }}
              </p>
            </div>

            <span class="estado-administrada">
              Administrada
            </span>
          </div>

          <div class="datos-administracion">

            <div>
              <h4>Paciente</h4>

              <p>
                <strong>Nombre:</strong>
                {{ item.medicationOrder?.patient
                  ? `${item.medicationOrder.patient.firstName} ${item.medicationOrder.patient.lastName}`
                  : 'No disponible'
                }}
              </p>

              <p>
                <strong>DNI:</strong>
                {{ item.medicationOrder?.patient?.dni || 'No disponible' }}
              </p>

              <p>
                <strong>Habitación:</strong>
                {{ item.medicationOrder?.admission?.room?.roomNumber || 'No disponible' }}
              </p>
            </div>

            <div>
              <h4>Administración</h4>

              <p>
                <strong>Horario programado:</strong>
                {{ formatearFecha(item.scheduledAt) }}
              </p>

              <p>
                <strong>Fecha de administración:</strong>
                {{ formatearFecha(item.administeredAt) }}
              </p>

              <p>
                <strong>Enfermero:</strong>
                {{ item.nurse
                  ? `${item.nurse.firstName} ${item.nurse.lastName}`
                  : 'No disponible'
                }}
              </p>

              <p>
                <strong>Médico responsable:</strong>
                {{ item.medicationOrder?.doctor
                  ? `${item.medicationOrder.doctor.firstName} ${item.medicationOrder.doctor.lastName}`
                  : 'No disponible'
                }}
              </p>
            </div>

          </div>

          <div class="observaciones">
            <strong>Observaciones:</strong>
            <p>{{ item.notes || 'Sin observaciones registradas.' }}</p>
          </div>

        </article>

      </div>

      <p
        v-if="!cargando && !error && administraciones.length > 0"
        class="contador"
      >
        Administraciones encontradas: {{ historialFiltrado.length }}
      </p>

    </section>
  </div>
</template>

<style scoped>
.contenedor-historial {
  max-width: 1100px;
  margin: 0 auto;
  padding: 25px;
  min-height: 100vh;
  color: #1e293b;
  background: #f1f5f9;
  color-scheme: light;
  box-sizing: border-box;
}

.contenedor-historial * {
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

.encabezado p,
.titulo-seccion p {
  margin: 0;
  color: #475569;
  line-height: 1.5;
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
  margin: 0 0 5px;
  color: #0f172a;
  font-size: 21px;
}

.titulo-seccion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 22px;
}

.filtros {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 18px;
  margin-bottom: 25px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.campo label {
  color: #1e293b;
  font-weight: 600;
}

.campo input {
  width: 100%;
  min-height: 43px;
  padding: 11px 12px;
  border: 1px solid #94a3b8;
  border-radius: 7px;
  background: #ffffff;
  color: #0f172a;
  font-family: inherit;
  font-size: 15px;
}

.campo input::placeholder {
  color: #64748b;
  opacity: 1;
}

.campo input:focus {
  outline: 3px solid rgba(37, 99, 235, 0.2);
  border-color: #2563eb;
}

.boton-volver,
.boton-salir,
.boton-actualizar {
  padding: 11px 18px;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: background 0.2s ease;
}

.boton-volver {
  background: #e2e8f0;
  color: #1e293b;
}

.boton-volver:hover {
  background: #cbd5e1;
}

.boton-salir {
  background: #b91c1c;
  color: #ffffff;
}

.boton-salir:hover {
  background: #991b1b;
}

.boton-actualizar {
  background: #1d4ed8;
  color: #ffffff;
}

.boton-actualizar:hover:not(:disabled) {
  background: #1e40af;
}

.boton-actualizar:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.lista-administraciones {
  display: grid;
  gap: 18px;
}

.tarjeta-administracion {
  padding: 19px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
}

.administracion-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.administracion-encabezado h3 {
  margin: 0 0 5px;
  color: #0f172a;
  font-size: 18px;
}

.administracion-encabezado p {
  margin: 0;
  color: #475569;
}

.estado-administrada {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 20px;
  background: #dcfce7;
  color: #14532d;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.datos-administracion {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 17px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.datos-administracion > div {
  min-width: 0;
}

.datos-administracion h4 {
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #cbd5e1;
  color: #1e3a8a;
  font-size: 15px;
}

.datos-administracion p {
  margin: 9px 0;
  color: #334155;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.datos-administracion strong {
  color: #0f172a;
}

.observaciones {
  margin-top: 15px;
  padding: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e293b;
}

.observaciones strong {
  color: #1e3a8a;
}

.observaciones p {
  margin: 7px 0 0;
  color: #334155;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.mensaje-error {
  padding: 12px 14px;
  border: 1px solid #fca5a5;
  border-radius: 7px;
  background: #fef2f2;
  color: #991b1b;
  font-weight: 600;
}

.contador {
  margin-top: 20px;
  padding: 12px 14px;
  border-radius: 7px;
  background: #eff6ff;
  color: #1e3a8a;
  font-weight: 700;
}

@media (max-width: 700px) {
  .contenedor-historial {
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

  .filtros,
  .datos-administracion {
    grid-template-columns: 1fr;
  }

  .administracion-encabezado {
    align-items: flex-start;
    flex-direction: column;
  }

  .boton-actualizar {
    width: 100%;
  }
}
</style>
