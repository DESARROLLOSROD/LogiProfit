import { Outlet } from 'react-router-dom'
import { TruckIcon } from '@heroicons/react/24/solid'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <TruckIcon className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">LogiProfit</h1>
          <p className="text-primary-200 mt-2">Rentabilidad inteligente para fletes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Outlet />
        </div>

        <p className="text-center text-primary-200 text-sm mt-6">
          © 2025 LogiProfit. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
