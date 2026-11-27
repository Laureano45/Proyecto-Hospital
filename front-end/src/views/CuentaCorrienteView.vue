
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import {
  obtenerCuentas,
  obtenerCuentaPaciente
} from '../services/billingService'

import type {
  CuentaInternacion,
  DetalleCuentaPaciente
} from '../services/billingService'

const router = useRouter()

const cuentas = ref<CuentaInternacion[]>([])
const detalle = ref<DetalleCuentaPaciente | null>(null)

const busqueda = ref('')
const pacienteId = ref<number | null>(null)

const cargando = ref(false)
const error = ref('')
const vista = ref<'general' | 'paciente'>('general')

const cuentasFiltradas = computed(() => {
  const termino = busqueda.value.trim().toLowerCase()

  if (!termino) return cuentas.value

  return cuentas.value.filter(cuenta => {
    const paciente = cuenta.admission?.patient

    const nombre = `${paciente?.firstName ?? ''} ${paciente?.lastName ?? ''}`

    return (
      nombre.toLowerCase().includes(termino) ||
      String(cuenta.admissionId).includes(termino) ||
      String(cuenta.admission?.room?.roomNumber ?? '').includes(termino)
    )
  })
})

const dinero = (valor: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(Number(valor) || 0)

const fecha = (valor: string) =>
  new Date(valor).toLocaleString('es-AR')

function mensajeError(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return fallback
  }

  const response = error.response
  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return fallback
  }

  const data = response.data
  if (typeof data !== 'object' || data === null || !('message' in data)) {
    return fallback
  }

  return typeof data.message === 'string' ? data.message : fallback
}

async function cargarCuentas() {
  cargando.value = true
  error.value = ''

  try {
    cuentas.value = await obtenerCuentas()
  } catch (e: unknown) {
    error.value = mensajeError(e, 'No se pudieron cargar las cuentas.')
  } finally {
    cargando.value = false
  }
}

async function buscarPaciente() {
  if (!pacienteId.value || pacienteId.value <= 0) {
    error.value = 'Ingresá un ID de paciente válido.'
    return
  }

  cargando.value = true
  error.value = ''

  try {
    detalle.value = await obtenerCuentaPaciente(pacienteId.value)
    vista.value = 'paciente'
  } catch (e: unknown) {
    detalle.value = null
    error.value = mensajeError(e, 'No se pudo encontrar la cuenta del paciente.')
  } finally {
    cargando.value = false
  }
}

async function volverListado() {
  detalle.value = null
  vista.value = 'general'
  await cargarCuentas()
}

onMounted(cargarCuentas)
</script>

<template>
  <main class="cuenta-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">ADMINISTRACIÓN</span>
        <h1>Cuenta corriente</h1>
        <p>Control de cargos de internación y facturación de pacientes.</p>
      </div>

      <button class="btn-secondary" @click="router.push('/admin')">
        Volver al panel
      </button>
    </header>

    <div class="tabs">
      <button
        :class="{ active: vista === 'general' }"
        @click="volverListado"
      >
        Cuentas de internación
      </button>

      <button
        :class="{ active: vista === 'paciente' }"
        @click="vista = 'paciente'"
      >
        Consulta por paciente
      </button>
    </div>

    <div v-if="error" class="alert-error">
      {{ error }}
    </div>

    <section v-if="vista === 'general'" class="panel">
      <div class="section-heading">
        <div>
          <h2>Cuentas registradas</h2>
          <p>Detalle económico de las internaciones.</p>
        </div>

        <span class="count">{{ cuentas.length }} cuentas</span>
      </div>

      <input
        v-model="busqueda"
        class="search"
        placeholder="Buscar paciente, internación o habitación..."
      />

      <div v-if="cargando" class="empty">
        Cargando cuentas...
      </div>

      <div v-else-if="cuentasFiltradas.length === 0" class="empty">
        No hay cuentas que coincidan con la búsqueda.
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Internación</th>
              <th>Habitación</th>
              <th>Estado</th>
              <th>Cargos</th>
              <th>Apertura</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="cuenta in cuentasFiltradas" :key="cuenta.id">
              <td>
                <strong>
                  {{ cuenta.admission?.patient?.firstName }}
                  {{ cuenta.admission?.patient?.lastName }}
                </strong>
              </td>

              <td>#{{ cuenta.admissionId }}</td>

              <td>
                {{ cuenta.admission?.room?.roomNumber ?? '—' }}
                <span v-if="cuenta.admission?.bed">
                  / Cama {{ cuenta.admission.bed.bedNumber }}
                </span>
              </td>

              <td>
                <span :class="['status', cuenta.status]">
                  {{ cuenta.status }}
                </span>
              </td>

              <td class="amount">
                {{ dinero(cuenta.totalCharges) }}
              </td>

              <td>{{ fecha(cuenta.openedAt) }}</td>

              <td>
                <button
                  class="btn-link"
                  @click="pacienteId = cuenta.admission?.patientId ?? null; buscarPaciente()"
                >
                  Ver cuenta
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="vista === 'paciente'" class="panel">
      <div class="section-heading">
        <div>
          <h2>Consulta individual</h2>
          <p>Ingresá el identificador del paciente.</p>
        </div>
      </div>

      <form class="search-form" @submit.prevent="buscarPaciente">
        <input
          v-model.number="pacienteId"
          type="number"
          min="1"
          placeholder="ID del paciente"
          required
        />

        <button class="btn-primary" type="submit" :disabled="cargando">
          Consultar
        </button>
      </form>

      <div v-if="detalle" class="patient-detail">
        <div class="patient-heading">
          <div>
            <span class="eyebrow">PACIENTE</span>
            <h2>
              {{ detalle.patient.firstName }}
              {{ detalle.patient.lastName }}
            </h2>
            <p>
              Cobertura:
              {{ detalle.patient.coverage?.name ?? 'Sin cobertura' }}
            </p>
          </div>
        </div>

        <div class="summary-grid">
          <article>
            <span>Cargos de internación</span>
            <strong>{{ dinero(detalle.summary.totalCharges) }}</strong>
          </article>

          <article>
            <span>Total facturado</span>
            <strong>{{ dinero(detalle.summary.totalInvoiced) }}</strong>
          </article>

          <article>
            <span>Facturas pendientes (parte paciente)</span>
            <strong class="pending">
              {{ dinero(detalle.summary.pendingPatientInvoices) }}
            </strong>
          </article>
        </div>

        <div class="subsection">
          <h3>Internaciones y cargos</h3>

          <div v-if="detalle.accounts.length === 0" class="empty">
            El paciente no tiene cuentas de internación registradas.
          </div>

          <article
            v-for="cuenta in detalle.accounts"
            :key="cuenta.id"
            class="account-card"
          >
            <div class="account-heading">
              <div>
                <strong>Internación #{{ cuenta.admissionId }}</strong>
                <p>
                  Habitación {{ cuenta.admission?.room?.roomNumber ?? '—' }}
                  <span v-if="cuenta.admission?.bed">
                    · Cama {{ cuenta.admission.bed.bedNumber }}
                  </span>
                </p>
              </div>

              <strong class="amount">{{ dinero(cuenta.totalCharges) }}</strong>
            </div>

            <div v-if="cuenta.charges.length" class="charge-list">
              <div
                v-for="cargo in cuenta.charges"
                :key="cargo.id"
                class="charge-row"
              >
                <div>
                  <strong>{{ cargo.description }}</strong>
                  <p>{{ fecha(cargo.consumedAt) }} · Cantidad: {{ cargo.quantity }}</p>
                </div>

                <strong>{{ dinero(cargo.totalAmount) }}</strong>
              </div>
            </div>

            <p v-else class="empty small">
              Todavía no hay cargos registrados.
            </p>
          </article>
        </div>

        <div class="subsection">
          <h3>Facturas</h3>

          <div v-if="detalle.invoices.length === 0" class="empty">
            No hay facturas emitidas para este paciente.
          </div>

          <div v-else class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Prestación</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Paciente</th>
                  <th>Cobertura</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="factura in detalle.invoices" :key="factura.id">
                  <td>{{ factura.serviceNameSnapshot }}</td>
                  <td>{{ fecha(factura.issuedAt) }}</td>
                  <td>{{ dinero(factura.baseAmount) }}</td>
                  <td>{{ dinero(factura.patientAmount) }}</td>
                  <td>{{ dinero(factura.payerAmount) }}</td>
                  <td>
                    <span :class="['status', factura.status]">
                      {{ factura.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.cuenta-page {
  min-height: 100vh;
  padding: 32px;
  background: #f3f6fa;
  color: #1e293b;
}

.page-header,
.section-heading,
.patient-heading,
.account-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.page-header {
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 5px 0;
  font-size: 30px;
}

.page-header p,
.section-heading p,
.patient-heading p,
.account-heading p {
  margin: 5px 0 0;
  color: #64748b;
}

.eyebrow {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.tabs button,
.btn-secondary,
.btn-primary,
.btn-link {
  border: 0;
  border-radius: 9px;
  padding: 11px 16px;
  cursor: pointer;
  font-weight: 700;
}

.tabs button {
  background: #e2e8f0;
  color: #475569;
}

.tabs button.active,
.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-secondary {
  background: white;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.btn-primary:disabled {
  opacity: .6;
  cursor: wait;
}

.panel {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  padding: 24px;
  box-shadow: 0 4px 16px #0f172a08;
}

.section-heading {
  margin-bottom: 20px;
}

.section-heading h2,
.patient-heading h2 {
  margin: 0;
}

.count {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 7px 11px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}

.search,
.search-form input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  font: inherit;
  margin-bottom: 18px;
}

.search-form {
  display: flex;
  gap: 10px;
  max-width: 520px;
}

.search-form input {
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

th,
td {
  text-align: left;
  padding: 13px 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}

th {
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
}

.amount {
  color: #0f766e;
  font-weight: 800;
}

.status {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}

.status.activa,
.status.pagada {
  background: #dcfce7;
  color: #166534;
}

.status.cerrada {
  background: #e2e8f0;
  color: #475569;
}

.status.pendiente {
  background: #fef3c7;
  color: #92400e;
}

.status.anulada {
  background: #fee2e2;
  color: #991b1b;
}

.btn-link {
  padding: 5px;
  background: transparent;
  color: #2563eb;
}

.empty {
  padding: 24px;
  text-align: center;
  color: #64748b;
}

.empty.small {
  padding: 12px;
}

.alert-error {
  padding: 13px 16px;
  margin-bottom: 18px;
  border-radius: 9px;
  background: #fee2e2;
  color: #991b1b;
}

.patient-detail {
  margin-top: 28px;
}

.patient-heading {
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0 30px;
}

.summary-grid article {
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.summary-grid span {
  display: block;
  color: #64748b;
  font-size: 12px;
  margin-bottom: 10px;
}

.summary-grid strong {
  font-size: 21px;
}

.pending {
  color: #b45309;
}

.subsection {
  margin-top: 30px;
}

.subsection h3 {
  margin-bottom: 15px;
}

.account-card {
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  padding: 17px;
  margin-bottom: 12px;
}

.charge-list {
  margin-top: 14px;
  border-top: 1px solid #e2e8f0;
}

.charge-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid #f1f5f9;
}

.charge-row p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 760px) {
  .cuenta-page {
    padding: 18px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .search-form {
    flex-direction: column;
  }

  .account-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
