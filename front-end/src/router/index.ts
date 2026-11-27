import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import RecepcionView from '../views/RecepcionView.vue'
import MedicoView from '../views/MedicoView.vue'
import HistorialTurnos from '../views/HistorialTurnos.vue'
import EnfermeroView from '../views/EnfermeroView.vue'
import InternacionesView from '../views/InternacionesView.vue'
import HistorialMedicacionesView from '../views/HistorialMedicacionesView.vue'
import MaestranzaView from '../views/MaestranzaView.vue'

import { obtenerUsuario, obtenerToken } from '../services/authService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/camas',
      name: 'mapa-camas',
      component: () => import('../views/MapaCamasView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/inventario',
      name: 'inventario',
      component: () => import('../views/InventarioView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/cuenta-corriente',
      name: 'cuenta-corriente',
      component: () => import('../views/CuentaCorrienteView.vue'),
      meta: {
        requiresAuth: true,
        roles: ['admin', 'recepcionista'],
      },
    },
    {
      path: '/recepcion',
      name: 'recepcion',
      component: RecepcionView,
      meta: { requiresAuth: true, role: 'recepcionista' },
    },
    {
      path: '/recepcion/camas',
      name: 'mapa-camas-recepcion',
      component: () => import('../views/MapaCamasView.vue'),
      meta: { requiresAuth: true, role: 'recepcionista' },
    },
    {
      path: '/recepcion/historial',
      name: 'HistorialTurnos',
      component: HistorialTurnos,
      meta: { requiresAuth: true, role: 'recepcionista' },
    },
    {
      path: '/recepcion/internaciones',
      name: 'internaciones',
      component: InternacionesView,
      meta: { requiresAuth: true, role: 'recepcionista' },
    },
    {
      path: '/medico',
      name: 'medico',
      component: MedicoView,
      meta: { requiresAuth: true, role: 'medico' },
    },
    {
      path: '/enfermero',
      name: 'enfermero',
      component: EnfermeroView,
      meta: {
        requiresAuth: true,
        role: 'enfermero',
      },
    },
    {
      path: '/enfermero/historial-medicaciones',
      name: 'historial-medicaciones',
      component: HistorialMedicacionesView,
      meta: {
        requiresAuth: true,
        role: 'enfermero',
      },
    },
    {
      path: '/maestranza',
      name: 'maestranza',
      component: MaestranzaView,
      meta: {
        requiresAuth: true,
        role: 'maestranza',
      },
    },
  ],
})

const obtenerRutaPorRol = (role?: string) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return '/admin'

    case 'recepcionista':
      return '/recepcion'

    case 'medico':
      return '/medico'

    case 'enfermero':
      return '/enfermero'

    case 'maestranza':
      return '/maestranza'

    default:
      return null
  }
}

router.beforeEach((to) => {
  const token = obtenerToken()
  const usuario = obtenerUsuario()

  if (to.meta.requiresAuth && (!token || !usuario)) {
    return '/login'
  }

  if (to.meta.guestOnly && token && usuario) {
    const ruta = obtenerRutaPorRol(usuario.role)

    if (ruta) {
      return ruta
    }
  }

  const rolesPermitidos = to.meta.roles as string[] | undefined

  if (rolesPermitidos) {
    const rolUsuario = usuario?.role?.toLowerCase()

    if (!rolUsuario || !rolesPermitidos.includes(rolUsuario)) {
      const ruta = obtenerRutaPorRol(usuario?.role)
      return ruta || '/login'
    }
  }

  if (to.meta.role && usuario?.role?.toLowerCase() !== to.meta.role) {
    const ruta = obtenerRutaPorRol(usuario?.role)
    return ruta || '/login'
  }

  return true
})

export default router
