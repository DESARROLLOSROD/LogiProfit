import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface CotizacionForm {
  clienteId: number
  origen: string
  destino: string
  kmEstimados: number
  precioCotizado: number
  camionId?: number
  choferId?: number
  notas?: string
}

interface Simulacion {
  kmEstimados: number
  precioCotizado: number
  diasEstimados: number
  costos: {
    diesel: number
    casetas: number
    viaticos: number
    salario: number
    total: number
  }
  utilidadEsperada: number
  margenEsperado: number
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO'
}

export default function NuevaCotizacion() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<Array<{ id: number; nombre: string }>>([])
  const [camiones, setCamiones] = useState<Array<{ id: number; placas: string }>>([])
  const [choferes, setChoferes] = useState<Array<{ id: number; nombre: string }>>([])
  const [simulacion, setSimulacion] = useState<Simulacion | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CotizacionForm>()
  const location = useLocation()

  const kmEstimados = watch('kmEstimados')
  const precioCotizado = watch('precioCotizado')
  const camionId = watch('camionId')
  const choferId = watch('choferId')

  useEffect(() => {
    fetchCatalogos()

    if (location.state?.calculoOrigen) {
      const calc = location.state.calculoOrigen
      setValue('clienteId', calc.clienteId)
      setValue('origen', calc.origen)
      setValue('destino', calc.destino)
      setValue('precioCotizado', calc.precioVenta)
      toast.success('Datos cargados desde el cálculo')
    }
  }, [location.state, setValue])

  useEffect(() => {
    if (kmEstimados && precioCotizado) {
      simularCostos()
    }
  }, [kmEstimados, precioCotizado, camionId, choferId])

  const fetchCatalogos = async () => {
    try {
      const [clientesRes, camionesRes, choferesRes] = await Promise.all([
        api.get('/clientes?activo=true'),
        api.get('/camiones?activo=true'),
        api.get('/choferes?activo=true'),
      ])
      setClientes(clientesRes.data)
      setCamiones(camionesRes.data)
      setChoferes(choferesRes.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const simularCostos = async () => {
    try {
      const response = await api.post('/cotizaciones/simular', {
        kmEstimados: Number(kmEstimados),
        precioCotizado: Number(precioCotizado),
        camionId: camionId ? Number(camionId) : undefined,
        choferId: choferId ? Number(choferId) : undefined,
      })
      setSimulacion(response.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const onSubmit = async (data: CotizacionForm) => {
    setLoading(true)
    try {
      const response = await api.post('/cotizaciones', {
        ...data,
        clienteId: Number(data.clienteId),
        kmEstimados: Number(data.kmEstimados),
        precioCotizado: Number(data.precioCotizado),
      })
      toast.success('Cotización creada exitosamente')
      navigate(`/cotizaciones/${response.data.id}`)
    } catch {
      // Error handled by interceptor
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

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'BAJO': return 'text-green-600 bg-green-50'
      case 'MEDIO': return 'text-yellow-600 bg-yellow-50'
      case 'ALTO': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
        <p className="text-gray-500">Simula costos y genera una cotización inteligente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select className="input" {...register('clienteId', { required: true })}>
              <option value="">Seleccionar cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.clienteId && <p className="text-red-500 text-sm mt-1">Requerido</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Origen *</label>
              <input
                className="input"
                placeholder="Ciudad de México"
                {...register('origen', { required: true })}
              />
            </div>
            <div>
              <label className="label">Destino *</label>
              <input
                className="input"
                placeholder="Monterrey, NL"
                {...register('destino', { required: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Km estimados *</label>
              <input
                type="number"
                className="input"
                placeholder="900"
                {...register('kmEstimados', { required: true, min: 1 })}
              />
            </div>
            <div>
              <label className="label">Precio cotizado *</label>
              <input
                type="number"
                className="input"
                placeholder="45000"
                {...register('precioCotizado', { required: true, min: 1 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Camión (opcional)</label>
              <select className="input" {...register('camionId')}>
                <option value="">Usar rendimiento promedio</option>
                {camiones.map((c) => (
                  <option key={c.id} value={c.id}>{c.placas}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Chofer (opcional)</label>
              <select className="input" {...register('choferId')}>
                <option value="">Usar salario promedio</option>
                {choferes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notas</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Observaciones..."
              {...register('notas')}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creando...' : 'Crear Cotización'}
          </button>
        </form>

        {/* Simulación */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Simulación de Costos
          </h3>

          {simulacion ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg text-center ${getRiskColor(simulacion.nivelRiesgo)}`}>
                <p className="text-sm font-medium">Nivel de Riesgo</p>
                <p className="text-2xl font-bold">{simulacion.nivelRiesgo}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Diesel estimado</span>
                  <span className="font-medium">{formatMoney(simulacion.costos.diesel)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Casetas</span>
                  <span className="font-medium">{formatMoney(simulacion.costos.casetas)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Viáticos ({simulacion.diasEstimados} días)</span>
                  <span className="font-medium">{formatMoney(simulacion.costos.viaticos)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Salario chofer</span>
                  <span className="font-medium">{formatMoney(simulacion.costos.salario)}</span>
                </div>
                <div className="flex justify-between py-2 border-b font-semibold">
                  <span>Total costos</span>
                  <span className="text-red-600">{formatMoney(simulacion.costos.total)}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Precio cotizado</span>
                  <span className="font-medium">{formatMoney(simulacion.precioCotizado)}</span>
                </div>
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>Utilidad esperada</span>
                  <span className={simulacion.utilidadEsperada >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatMoney(simulacion.utilidadEsperada)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Margen</span>
                  <span className="font-medium">{simulacion.margenEsperado.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Ingresa los km y precio para ver la simulación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
