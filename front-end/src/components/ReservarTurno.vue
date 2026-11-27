<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';

import type { Paciente } from '../services/patientService';
import type { Medico } from '../services/doctorService';
import type { HorarioDisponible } from '../services/appointmentService';

import { obtenerPacientes } from '../services/patientService';
import { obtenerMedicos } from '../services/doctorService';

import {
  obtenerHorariosDisponibles,
  reservarTurno as guardarTurno
} from '../services/appointmentService';

const pacientes = ref<Paciente[]>([]);
const medicos = ref<Medico[]>([]);

const pacienteSeleccionado = ref<number | ''>('');
const medicoSeleccionado = ref<number | ''>('');
const fechaSeleccionada = ref('');
const horarioSeleccionado = ref('');

const horariosDisponibles = ref<(string | HorarioDisponible)[]>([]);

const cargandoDatos = ref(false);
const cargandoHorarios = ref(false);
const guardando = ref(false);
const mensaje = ref('');
const error = ref('');

// Fecha y hora
const obtenerFechaActual = (): string => {
  const fecha = new Date();

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

const obtenerHora = (
  horario: string | HorarioDisponible
): string => {
  if (typeof horario === 'string') {
    return horario;
  }

  return horario.appointmentTime;
};

// Cargar pacientes y médicos
const cargarDatos = async () => {
  cargandoDatos.value = true;
  error.value = '';

  try {
    const [listaPacientes, listaMedicos] = await Promise.all([
      obtenerPacientes(),
      obtenerMedicos()
    ]);

    console.log('PACIENTES:', listaPacientes);
    console.log('MÉDICOS:', listaMedicos);

    pacientes.value = listaPacientes;
    medicos.value = listaMedicos;

  } catch {
    error.value = 'No se pudieron cargar los pacientes y médicos.';
  } finally {
    cargandoDatos.value = false;
  }
};

// Consultar horarios
let solicitudActual = 0;

const consultarHorarios = async () => {
  const solicitud = ++solicitudActual;

  horariosDisponibles.value = [];
  horarioSeleccionado.value = '';

  if (!medicoSeleccionado.value || !fechaSeleccionada.value) {
    cargandoHorarios.value = false;
    return;
  }

  cargandoHorarios.value = true;

  try {
    const horarios = await obtenerHorariosDisponibles(
      medicoSeleccionado.value,
      fechaSeleccionada.value
    );
    console.log('HORARIOS EN VUE:', horarios);

    if (solicitud === solicitudActual) {
      horariosDisponibles.value = horarios;
    }

  } catch {
    if (solicitud === solicitudActual) {
      error.value = 'Error al consultar los horarios disponibles.';
    }
  } finally {
    if (solicitud === solicitudActual) {
      cargandoHorarios.value = false;
    }
  }
};

// Actualizar disponibilidad al cambiar médico o fecha
watch(
  [medicoSeleccionado, fechaSeleccionada],
  consultarHorarios
);

// Confirmar reserva
const confirmarReserva = async () => {
  mensaje.value = '';
  error.value = '';

  if (
    !pacienteSeleccionado.value ||
    !medicoSeleccionado.value ||
    !fechaSeleccionada.value ||
    !horarioSeleccionado.value
  ) {
    error.value = 'Complete todos los campos.';
    return;
  }

  if (fechaSeleccionada.value < obtenerFechaActual()) {
    error.value = 'No puede reservar turnos en fechas pasadas.';
    return;
  }

  guardando.value = true;

  try {
    await guardarTurno({
      patientId: pacienteSeleccionado.value,
      doctorId: medicoSeleccionado.value,
      appointmentDate: fechaSeleccionada.value,
      appointmentTime: horarioSeleccionado.value
    });

    mensaje.value = '¡Turno reservado correctamente!';

    pacienteSeleccionado.value = '';
    medicoSeleccionado.value = '';
    fechaSeleccionada.value = '';
    horarioSeleccionado.value = '';

    horariosDisponibles.value = [];

  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 409) {
        error.value = 'El horario ya fue reservado. Seleccione otro.';
        await consultarHorarios();
      } else {
        error.value =
          e.response?.data?.message ||
          'Ocurrió un error al reservar el turno.';
      }
    } else {
      error.value = 'Ocurrió un error inesperado al reservar el turno.';
    }
  } finally {
    guardando.value = false;
  }
};

onMounted(cargarDatos);
</script>

<template>
  <div class="contenedor">

    <h1>Reservar turno médico</h1>

    <p v-if="cargandoDatos">
      Cargando pacientes y médicos...
    </p>

    <form v-else @submit.prevent="confirmarReserva">

      <!-- PACIENTE -->
      <div class="campo">
        <label>Paciente:</label>

        <select v-model="pacienteSeleccionado" required>
          <option value="" disabled>
            Seleccione un paciente
          </option>

          <option
            v-for="paciente in pacientes"
            :key="paciente.id"
            :value="paciente.id"
          >
            {{ paciente.firstName }} {{ paciente.lastName }}
            - DNI: {{ paciente.dni }}
          </option>
        </select>

        <small v-if="pacientes.length === 0">
          No hay pacientes registrados.
        </small>
      </div>

      <!-- MEDICO -->
      <div class="campo">
        <label>Médico:</label>

        <select v-model="medicoSeleccionado" required>
          <option value="" disabled>
            Seleccione un médico
          </option>

          <option
            v-for="medico in medicos"
            :key="medico.id"
            :value="medico.id"
          >
            {{ medico.firstName }} {{ medico.lastName }}
            - {{ medico.specialty }}
          </option>
        </select>

        <small v-if="medicos.length === 0">
          No hay médicos registrados.
        </small>
      </div>

      <!-- FECHA -->
      <div class="campo">
        <label>Fecha del turno:</label>

        <input
          type="date"
          v-model="fechaSeleccionada"
          :min="obtenerFechaActual()"
          required
        />
      </div>


      <!-- HORARIOS -->
      <div class="campo">
        <label>Horario disponible:</label>

        <select
          v-model="horarioSeleccionado"
          required
          :disabled="cargandoHorarios || horariosDisponibles.length === 0"
        >
        <option value="" disabled>
        Seleccione un horario
        </option>

        <option
        v-for="horario in horariosDisponibles"
        :key="obtenerHora(horario)"
        :value="obtenerHora(horario)"
        >
        {{ obtenerHora(horario) }}
        </option>
        </select>

        <small v-if="cargandoHorarios">
        Consultando horarios...
        </small>

        <small
        v-else-if="
         medicoSeleccionado &&
         fechaSeleccionada &&
         horariosDisponibles.length === 0
        "
        >
        No hay horarios disponibles para esta fecha.
        </small>
          </div>

      <!-- BOTON -->
      <button
        type="submit"
        :disabled="guardando || cargandoHorarios ||
          cargandoDatos || pacientes.length === 0 ||
          medicos.length === 0"
      >
        {{ guardando ? 'Reservando...' : 'Confirmar reserva' }}
      </button>

      <!-- NOTIFICACIÓN DE ÉXITO -->
      <div v-if="mensaje" class="notificacion exito">
        <span>✓</span>
        <p>{{ mensaje }}</p>
      </div>

      <!-- NOTIFICACIÓN DE ERROR -->
      <div v-if="error" class="notificacion error">
        <span>!</span>
        <p>{{ error }}</p>
      </div>

    </form>
  </div>
</template>

<style scoped>
.notificacion {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  margin-top: 20px;
  border-radius: 8px;
  font-weight: 500;
}

.notificacion p {
  margin: 0;
}

.exito {
  color: #166534;
  background-color: #dcfce7;
  border: 1px solid #86efac;
}

.error {
  color: #991b1b;
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
}

.notificacion span {
  font-size: 20px;
  font-weight: bold;
}
.contenedor {
  max-width: 500px;
  margin: 30px auto;
  padding: 25px;
  background: #f5f5f5;
  border-radius: 10px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
}

.campo {
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;
}

label {
  margin-bottom: 7px;
  font-weight: bold;
}

input, select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  width: 100%;
  padding: 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:disabled {
  background: #999;
  cursor: not-allowed;
}

.exito {
  color: green;
  font-weight: bold;
}

.error {
  color: red;
  font-weight: bold;
}

small {
  margin-top: 5px;
  color: #666;
}
</style>
