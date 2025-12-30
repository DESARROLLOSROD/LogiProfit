import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('¡Bienvenido!')
      navigate('/')
    } catch {
      // Error handled by api interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Iniciar sesión
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="tu@email.com"
            {...register('email', { required: 'El email es requerido' })}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="label">Contraseña</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            {...register('password', { required: 'La contraseña es requerida' })}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

    </>
  )
}
