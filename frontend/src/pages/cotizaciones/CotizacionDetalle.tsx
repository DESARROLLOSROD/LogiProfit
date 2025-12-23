import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Cotizacion {
  id: number
  folio: string
  cliente: { id: number; nombre: string }
  origen: string
  destino: string
  kmEstimados: number
  precioCotizado: number
  dieselEstimado: number
  casetasEstimado: number
  viaticosEstimado: number
  salarioEstimado: number
  utilidadEsperada: number
  margenEsperado: number
  estado: string
  notas?: string
  createdAt: string
}

export default function CotizacionDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCotizacion()
  }, [id])

  const fetchCotizacion = async () => {
    try {
      const response = await api.get(`/cotizaciones/${id}`)
      setCotizacion(response.data)
    } catch {
      navigate('/cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  const convertirAFlete = async () => {
    try {
      const response = await api.post(`/cotizaciones/${id}/convertir-flete`)
      toast.success('¡Flete creado exitosamente!')
      navigate(`/fletes/${response.data.id}`)
    } catch {
      // Error handled by interceptor
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!cotizacion) return null

  const totalCostos = cotizacion.dieselEstimado + cotizacion.casetasEstimado + 
                      cotizacion.viaticosEstimado + cotizacion.salarioEstimado

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cotizacion.folio}</h1>
          <p className="text-gray-500">{cotizacion.cliente.nombre}</p>
        </div>
        {cotizacion.estado !== 'CONVERTIDA' && (
          <button onClick={convertirAFlete} className="btn-primary">
            Convertir a Flete
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Información del Viaje</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Origen</dt>
              <dd className="font-medium">{cotizacion.origen}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Destino</dt>
              <dd className="font-medium">{cotizacion.destino}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Km estimados</dt>
              <dd className="font-medium">{cotizacion.kmEstimados} km</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Estado</dt>
              <dd>
                <span className={`badge ${cotizacion.estado === 'APROBADA' ? 'badge-success' : 'badge-gray'}`}>
                  {cotizacion.estado}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Costos Estimados</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Diesel</dt>
              <dd>{formatMoney(cotizacion.dieselEstimado)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Casetas</dt>
              <dd>{formatMoney(cotizacion.casetasEstimado)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Viáticos</dt>
              <dd>{formatMoney(cotizacion.viaticosEstimado)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Salario chofer</dt>
              <dd>{formatMoney(cotizacion.salarioEstimado)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold">
              <dt>Total</dt>
              <dd className="text-red-600">{formatMoney(totalCostos)}</dd>
            </div>
          </dl>
        </div>

        <div className="card md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Resumen Financiero</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Precio Cotizado</p>
              <p className="text-xl font-bold">{formatMoney(cotizacion.precioCotizado)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">Utilidad Esperada</p>
              <p className={`text-xl font-bold ${cotizacion.utilidadEsperada >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(cotizacion.utilidadEsperada)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">Margen</p>
              <p className="text-xl font-bold text-blue-600">{cotizacion.margenEsperado.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
