import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de respuesta para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Error de conexión'
    
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción')
    } else if (error.response?.status === 404) {
      toast.error('Recurso no encontrado')
    } else if (error.response?.status >= 500) {
      toast.error('Error del servidor. Intenta más tarde.')
    } else {
      toast.error(Array.isArray(message) ? message[0] : message)
    }
    
    return Promise.reject(error)
  }
)

export default api
