import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../stores/authStore'
import toast from 'react-hot-toast'

interface RegisterForm {
  nombre: string
  email: string
  password: string
  confirmPassword: string
  empresaNombre: string
  empresaRfc?: string
}

export default function Register() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      await registerUser({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        empresaNombre: data.empresaNombre,
        empresaRfc: data.empresaRfc,
      })
      toast.success('¡Registro exitoso!')
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
        Crear cuenta
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Tu nombre</label>
          <input
            type="text"
            className="input"
            placeholder="Juan Pérez"
            {...register('nombre', { required: 'El nombre es requerido' })}
          />
          {errors.nombre && (
            <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>
          )}
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              {...register('password', { 
                required: 'La contraseña es requerida',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' }
              })}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="label">Confirmar</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              {...register('confirmPassword', { 
                required: 'Confirma tu contraseña',
                validate: value => value === password || 'Las contraseñas no coinciden'
              })}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <hr className="my-4" />

        <div>
          <label className="label">Nombre de tu empresa</label>
          <input
            type="text"
            className="input"
            placeholder="Transportes López S.A."
            {...register('empresaNombre', { required: 'El nombre de la empresa es requerido' })}
          />
          {errors.empresaNombre && (
            <p className="text-red-500 text-sm mt-1">{errors.empresaNombre.message}</p>
          )}
        </div>

        <div>
          <label className="label">RFC (opcional)</label>
          <input
            type="text"
            className="input"
            placeholder="TLO123456ABC"
            {...register('empresaRfc')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  )
}
