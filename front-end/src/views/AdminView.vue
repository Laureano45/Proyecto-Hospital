<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cerrarSesion, obtenerUsuario } from '../services/authService'

import {
  registrarUsuario,
  obtenerUsuarios,
  desactivarUsuario,
  activarUsuario
} from '../services/userService'

import type {
  CrearUsuarioDto,
  RolPersonal,
  UsuarioCreado
} from '../services/userService'

const router = useRouter()
const usuario = obtenerUsuario()

const rolSeleccionado = ref<RolPersonal>('medico')

const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
const specialty = ref('')
const licenseNumber = ref('')

const cargando = ref(false)
const mensaje = ref('')
const error = ref('')

const tituloFormulario = computed(() => {
  const titulos = {
    medico: 'Registrar médico',
    enfermero: 'Registrar enfermero',
    recepcionista: 'Registrar recepcionista',
    maestranza: 'Registrar personal de maestranza'
  }

  return titulos[rolSeleccionado.value]
})

const limpiarFormulario = () => {
  nombre.value = ''
  apellido.value = ''
  email.value = ''
  password.value = ''
  specialty.value = ''
  licenseNumber.value = ''
}

const cambiarRol = (rol: RolPersonal) => {
  rolSeleccionado.value = rol
  mensaje.value = ''
  error.value = ''
  limpiarFormulario()
}

const registrar = async () => {
  mensaje.value = ''
  error.value = ''

  if (
    !nombre.value.trim() ||
    !apellido.value.trim() ||
    !email.value.trim() ||
    !password.value
  ) {
    error.value = 'Completá todos los campos obligatorios.'
    return
  }

  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  if (
    rolSeleccionado.value === 'medico' &&
    (!specialty.value.trim() || !licenseNumber.value.trim())
  ) {
    error.value = 'Completá la especialidad y la matrícula del médico.'
    return
  }

  const datos: CrearUsuarioDto = {
    firstName: nombre.value.trim(),
    lastName: apellido.value.trim(),
    email: email.value.trim(),
    password: password.value,
    role: rolSeleccionado.value
  }

  if (rolSeleccionado.value === 'medico') {
    datos.specialty = specialty.value.trim()
    datos.licenseNumber = licenseNumber.value.trim()
  }

  cargando.value = true

  try {
    const nuevoUsuario = await registrarUsuario(datos)

    mensaje.value =
      `${nuevoUsuario.firstName} ${nuevoUsuario.lastName} fue registrado correctamente.`

    limpiarFormulario()
    await cargarUsuarios()
  } catch (err: unknown) {
    const axiosError = err as {
      response?: {
        data?: {
          message?: string | string[]
        }
      }
    }

    const respuesta = axiosError.response?.data?.message

    error.value = Array.isArray(respuesta)
      ? respuesta.join(', ')
      : respuesta || 'No se pudo registrar el usuario.'
  } finally {
    cargando.value = false
  }
}

const usuarios = ref<UsuarioCreado[]>([])
const filtroRol = ref<'todos' | RolPersonal>('todos')
const cargandoUsuarios = ref(false)
const errorListado = ref('')
const usuarioEnProcesoId = ref<number | null>(null)

const usuariosFiltrados = computed(() => {
  if (filtroRol.value === 'todos') {
    return usuarios.value
  }

  return usuarios.value.filter(
    usuario => usuario.role === filtroRol.value
  )
})

const cargarUsuarios = async () => {
  cargandoUsuarios.value = true
  errorListado.value = ''

  try {
    usuarios.value = await obtenerUsuarios()
  } catch {
    errorListado.value = 'No se pudo cargar el personal registrado.'
  } finally {
    cargandoUsuarios.value = false
  }
}

const cambiarEstado = async (personal: UsuarioCreado) => {
  mensaje.value = ''
  error.value = ''

  const accion = personal.isActive ? 'desactivar' : 'activar'

  const nombreCompleto =
    `${personal.firstName} ${personal.lastName}`

  const confirmado = window.confirm(
    `¿Estás seguro de que querés ${accion} la cuenta de ${nombreCompleto}?`
  )

  if (!confirmado) return

  usuarioEnProcesoId.value = personal.id

  try {
    if (personal.isActive) {
      await desactivarUsuario(personal.id)
      mensaje.value = `La cuenta de ${nombreCompleto} fue desactivada correctamente.`
    } else {
      await activarUsuario(personal.id)
      mensaje.value = `La cuenta de ${nombreCompleto} fue activada correctamente.`
    }

    await cargarUsuarios()

  } catch (err: unknown) {
    const axiosError = err as {
      response?: {
        data?: {
          message?: string | string[]
        }
      }
    }

    const respuesta = axiosError.response?.data?.message

    error.value = Array.isArray(respuesta)
      ? respuesta.join(', ')
      : respuesta || 'No se pudo modificar el estado del usuario.'

  } finally {
    usuarioEnProcesoId.value = null
  }
}

const salir = () => {
  cerrarSesion()
  router.push('/login')
}

onMounted(cargarUsuarios)
</script>

<template>
  <div class="admin-container">
    <header class="admin-header">
      <div>
        <h1>Panel de administración</h1>
        <p>Gestión del personal de la clínica</p>
      </div>

      <button class="logout" @click="salir">
        Cerrar sesión
      </button>

      <router-link to="/admin/cuenta-corriente">
        Cuenta corriente
      </router-link>

      <button
        type="button"
        class="map-button"
        @click="router.push('/admin/camas')"
      >
        Mapa de camas
      </button>

      <button
        type="button"
        class="map-button"
        @click="router.push('/admin/inventario')"
      >
        Inventario
      </button>
    </header>

    <main>
      <section class="welcome">
        <h2>Bienvenido, {{ usuario?.firstName || 'Administrador' }}</h2>
        <p>Desde aquí podés gestionar las cuentas del personal.</p>
      </section>

      <section class="cards">
        <article
          class="card"
          :class="{ selected: rolSeleccionado === 'medico' }"
          @click="cambiarRol('medico')"
        >
          <h3>Médicos</h3>
          <p>Registrar médicos y sus datos profesionales.</p>
          <button type="button">Seleccionar</button>
        </article>

        <article
          class="card"
          :class="{ selected: rolSeleccionado === 'enfermero' }"
          @click="cambiarRol('enfermero')"
        >
          <h3>Enfermeros</h3>
          <p>Crear cuentas para el personal de enfermería.</p>
          <button type="button">Seleccionar</button>
        </article>

        <article
          class="card"
          :class="{ selected: rolSeleccionado === 'recepcionista' }"
          @click="cambiarRol('recepcionista')"
        >
          <h3>Recepcionistas</h3>
          <p>Crear cuentas para el personal de recepción.</p>
          <button type="button">Seleccionar</button>
        </article>

        <article
          class="card"
          :class="{ selected: rolSeleccionado === 'maestranza' }"
          @click="cambiarRol('maestranza')"
        >
          <h3>Maestranza</h3>
          <p>Crear cuentas para el personal de limpieza y mantenimiento de la clínica.</p>
          <button type="button">Seleccionar</button>
        </article>
      </section>

      <section class="form-section">
        <h2>{{ tituloFormulario }}</h2>

        <form @submit.prevent="registrar">
          <div class="form-grid">
            <div class="field">
              <label>Nombre</label>
              <input
                v-model="nombre"
                type="text"
                required
                placeholder="Ingresá el nombre"
              />
            </div>

            <div class="field">
              <label>Apellido</label>
              <input
                v-model="apellido"
                type="text"
                required
                placeholder="Ingresá el apellido"
              />
            </div>

            <div class="field">
              <label>Correo electrónico</label>
              <input
                v-model="email"
                type="email"
                required
                placeholder="correo@clinica.com"
              />
            </div>

            <div class="field">
              <label>Contraseña</label>
              <input
                v-model="password"
                type="password"
                required
                minlength="8"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <template v-if="rolSeleccionado === 'medico'">
              <div class="field">
                <label>Especialidad</label>
                <input
                  v-model="specialty"
                  type="text"
                  required
                  placeholder="Ej. Cardiología"
                />
              </div>

              <div class="field">
                <label>Matrícula profesional</label>
                <input
                  v-model="licenseNumber"
                  type="text"
                  required
                  placeholder="Número de matrícula"
                />
              </div>
            </template>
          </div>

          <p v-if="mensaje" class="success">
            {{ mensaje }}
          </p>

          <p v-if="error" class="error">
            {{ error }}
          </p>

          <button
            class="submit-button"
            type="submit"
            :disabled="cargando"
          >
            {{ cargando ? 'Registrando...' : 'Registrar personal' }}
          </button>
        </form>
      </section>
      <section class="list-section">
        <div class="list-header">
          <div>
            <h2>Personal registrado</h2>
            <p>Listado de usuarios de la clínica</p>
          </div>

          <button
            type="button"
            @click="cargarUsuarios"
            :disabled="cargandoUsuarios"
          >
            Actualizar
          </button>
        </div>

        <div class="filters">
          <label for="filtroRol">Filtrar por rol:</label>

          <select id="filtroRol" v-model="filtroRol">
            <option value="todos">Todos</option>
            <option value="medico">Médicos</option>
            <option value="enfermero">Enfermeros</option>
            <option value="recepcionista">Recepcionistas</option>
            <option value="maestranza">Maestranzas</option>
          </select>
        </div>

        <p v-if="cargandoUsuarios">
          Cargando personal...
        </p>

        <p v-else-if="errorListado" class="error">
          {{ errorListado }}
        </p>

        <p v-else-if="usuariosFiltrados.length === 0">
          No hay usuarios registrados para este filtro.
        </p>

        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre y apellido</th>
                <th>Correo electrónico</th>
                <th>Rol</th>
                <th>Especialidad</th>
                <th>Matrícula</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="personal in usuariosFiltrados"
                :key="personal.id"
              >
                <td>
                  {{ personal.firstName }} {{ personal.lastName }}
                </td>

                <td>{{ personal.email }}</td>

                <td>
                  {{ personal.role }}
                </td>

                <td>
                  {{ personal.doctor?.specialty || '-' }}
                </td>

                <td>
                  {{ personal.doctor?.licenseNumber || '-' }}
                </td>
                <td>
                  <span
                    :class="personal.isActive ? 'estado-activo' : 'estado-inactivo'"
                  >
                    {{ personal.isActive ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>

                <td>
                  <button
                    v-if="personal.isActive"
                    type="button"
                    class="action-button deactivate-button"
                    :disabled="usuarioEnProcesoId === personal.id"
                    @click="cambiarEstado(personal)"
                  >
                    {{
                      usuarioEnProcesoId === personal.id
                      ? 'Procesando...'
                      : 'Desactivar'
                    }}
                  </button>

                  <button
                    v-else
                    type="button"
                    class="action-button activate-button"
                    :disabled="usuarioEnProcesoId === personal.id"
                    @click="cambiarEstado(personal)"
                  >
                    {{
                      usuarioEnProcesoId === personal.id
                      ? 'Procesando...'
                      : 'Activar'
                    }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #f1f5f9;
}

.admin-header {
  background: white;
  padding: 25px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px #0001;
}

.admin-header h1 {
  margin: 0;
  color: #1e293b;
}

.admin-header p {
  color: #64748b;
}

.welcome {
  padding: 30px 40px 15px;
}

.welcome h2 {
  color: #1e293b;
}

.cards {
  padding: 10px 40px 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  padding: 22px;
  border-radius: 12px;
  box-shadow: 0 3px 12px #0001;
  cursor: pointer;
  border: 2px solid transparent;
}

.card.selected {
  border-color: #2563eb;
}

.card h3 {
  color: #2563eb;
}

.card p {
  color: #64748b;
  min-height: 45px;
}

.form-section {
  margin: 0 40px 40px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 3px 12px #0001;
}

.form-section h2 {
  color: #1e293b;
  margin-top: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-weight: 600;
  color: #334155;
}

input {
  padding: 11px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
}

button {
  padding: 11px 16px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #1d4ed8;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-button {
  margin-top: 22px;
}

.logout {
  background: #dc2626;
}

.logout:hover {
  background: #b91c1c;
}

.success {
  color: #15803d;
  margin-top: 18px;
}

.error {
  color: #dc2626;
  margin-top: 18px;
}

@media (max-width: 650px) {
  .admin-header {
    padding: 20px;
    gap: 15px;
  }

  .welcome {
    padding: 25px 20px 10px;
  }

  .cards {
    padding: 10px 20px 25px;
  }

  .form-section {
    margin: 0 20px 25px;
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

.list-section {
  margin: 0 40px 40px;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 3px 12px #0001;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.list-header h2 {
  color: #1e293b;
  margin-top: 0;
}

.list-header p {
  color: #64748b;
}

.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}

.filters select {
  padding: 9px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 650px;
}

th, td {
  padding: 13px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background: #f8fafc;
  color: #334155;
}

td {
  color: #475569;
}

@media (max-width: 650px) {
  .list-section {
    margin: 0 20px 25px;
    padding: 20px;
  }

  .list-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

.estado-activo {
  color: #15803d;
  background: #dcfce7;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
}

.estado-inactivo {
  color: #b91c1c;
  background: #fee2e2;
  padding: 5px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
}

.action-button {
  padding: 8px 12px;
  font-size: 13px;
  white-space: nowrap;
}

.deactivate-button {
  background: #dc2626;
}

.deactivate-button:hover {
  background: #b91c1c;
}

.activate-button {
  background: #15803d;
}

.activate-button:hover {
  background: #166534;
}

.map-button {
  background: #0f766e;
}

.map-button:hover {
  background: #115e59;
}
</style>
