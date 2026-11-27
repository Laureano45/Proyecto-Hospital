<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { iniciarSesion } from '../services/authService'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

const login = async () => {
  error.value = ''
  cargando.value = true

  try {
    const usuario = await iniciarSesion(
      email.value,
      password.value
    )

    const rol = String(usuario.role || '').toLowerCase()

    const rutas: Record<string, string> = {
      admin: '/admin',
      recepcionista: '/recepcion',
      medico: '/medico',
      enfermero: '/enfermero',
      maestranza: '/maestranza',
    }

    const ruta = rutas[rol]

    if (ruta) {
      await router.push(ruta)
    } else {
      error.value = `El usuario tiene un rol no reconocido: ${rol || 'sin rol'}.`
    }

  } catch (err: unknown) {
    const axiosError = err as {
      response?: { data?: { message?: string } }
    }

    error.value =
      axiosError.response?.data?.message ||
      'No se pudo iniciar sesión. Verificá tus credenciales.'
  } finally {
    cargando.value = false
  }
}

</script>

<template>
  <div class="login-container">
    <form class="login-card" @submit.prevent="login">
      <h1>Turnos médicos</h1>
      <h2>Iniciar sesión</h2>

      <label for="email">Correo electrónico</label>
      <input
        id="email"
        v-model="email"
        type="email"
        required
        placeholder="correo@clinica.com"
        autocomplete="username"
      />

      <label for="password">Contraseña</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        placeholder="Ingresá tu contraseña"
        autocomplete="current-password"
      />

      <p v-if="error" class="error">
        {{ error }}
      </p>

      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f1f5f9;
}

.login-card {
  width: 350px;
  padding: 30px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 15px #0002;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h1 {
  text-align: center;
  color: #0f172a;
  font-size: 25px;
  font-weight: 700;
}

h2 {
  text-align: center;
  color: #334155;
  font-size: 19px;
  font-weight: 600;
  margin-bottom: 12px;
}

label {
  display: block;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 11px;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #94a3b8;
  border-radius: 6px;
  font-size: 14px;
}

input::placeholder {
  color: #94a3b8;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px #2563eb20;
}

button {
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

button:hover {
  background: #1d4ed8;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
}
</style>
