import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/24/outline'
import api from '../../lib/api'

interface Cotizacion {
  id: number
  folio: string
  cliente: { nombre: string }
  origen: string
  destino: string
  precioCotizado: number
  utilidadEsperada: number
  margenEsperado: number
  estado: string
  createdAt: string
}

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCotizaciones()
  }, [])

  const fetchCotizaciones = async () => {
    try {
      const response = await api.get('/cotizaciones')
      setCotizaciones(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      BORRADOR: 'badge-gray',
      ENVIADA: 'badge-info',
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      CONVERTIDA: 'badge-success',
      CANCELADA: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500">Gestiona tus cotizaciones y simula costos</p>
        </div>
        <Link to="/cotizaciones/nueva" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nueva Cotización
        </Link>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Ruta</th>
              <th>Precio</th>
              <th>Utilidad Esperada</th>
              <th>Margen</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cotizaciones.map((cot) => (
              <tr key={cot.id}>
                <td className="font-medium">{cot.folio}</td>
                <td>{cot.cliente.nombre}</td>
                <td className="text-sm text-gray-500">
                  {cot.origen} → {cot.destino}
                </td>
                <td>{formatMoney(cot.precioCotizado)}</td>
                <td className={cot.utilidadEsperada >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatMoney(cot.utilidadEsperada)}
                </td>
                <td>{cot.margenEsperado.toFixed(1)}%</td>
                <td>
                  <span className={`badge ${getEstadoBadge(cot.estado)}`}>
                    {cot.estado}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/cotizaciones/${cot.id}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
            {cotizaciones.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No hay cotizaciones. <Link to="/cotizaciones/nueva" className="text-primary-600 hover:underline">Crea una nueva</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
