import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
  empresa: {
    id: number
    nombre: string
  }
}

interface AuthState {
  token: string | null
  usuario: Usuario | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

interface RegisterData {
  nombre: string
  email: string
  password: string
  empresaNombre: string
  empresaRfc?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password })
        const { access_token, usuario } = response.data

        set({
          token: access_token,
          usuario,
          isAuthenticated: true,
        })

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      },

      register: async (data: RegisterData) => {
        const response = await api.post('/auth/register', data)
        const { access_token, usuario } = response.data

        set({
          token: access_token,
          usuario,
          isAuthenticated: true,
        })

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      },

      logout: () => {
        set({
          token: null,
          usuario: null,
          isAuthenticated: false,
        })

        delete api.defaults.headers.common['Authorization']
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false })
          return
        }

        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/me')
          set({
            usuario: response.data,
            isAuthenticated: true,
          })
        } catch {
          set({
            token: null,
            usuario: null,
            isAuthenticated: false,
          })
          delete api.defaults.headers.common['Authorization']
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
