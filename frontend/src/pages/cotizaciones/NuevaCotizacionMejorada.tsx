import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDownIcon, ChevronUpIcon, TruckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface FormData {
  // Básicos
  clienteId: string
  origen: string
  destino: string

  // Carga
  tipoCarga: string
  pesoCarga: string
  dimensiones: string

  // Kilometraje
  kmCargado: string
  kmVacio: string

  // Precio
  precioCotizado: string

  // Opcionales
  camionId: string
  choferId: string

  // Carro Piloto
  requiereCarroPiloto: boolean
  diasCarroPiloto: string
  costoBaseCarroPiloto: string

  // Casetas detalladas
  casetasCargado: string
  casetasVacio: string

  // Permiso
  permisoEstimado: string

  // Porcentajes
  porcentajeMantenimiento: string
  porcentajeIndirectos: string

  // Viáticos detallados
  comidasCantidad: string
  comidasPrecioUnitario: string
  federalCantidad: string
  federalPrecioUnitario: string
  telefonoCantidad: string
  telefonoPrecioUnitario: string
  imprevistosViaticos: string

  notas: string
}

interface Simulacion {
  kmCargado: number
  kmVacio: number
  kmTotal: number
  precioCotizado: number
  diasEstimados: number
  diesel: {
    litrosCargado: number
    litrosVacio: number
    litrosTotales: number
    precioLitro: number
    costo: number
  }
  casetas: {
    cargado: number
    vacio: number
    total: number
  }
  viaticos: {
    comidas: { cantidad: number; precioUnitario: number; total: number }
    federal: { cantidad: number; precioUnitario: number; total: number }
    telefono: { cantidad: number; precioUnitario: number; total: number }
    imprevistos: number
    total: number
  }
  salario: number
  permiso: number
  subtotalOperativo: number
  mantenimiento: { porcentaje: number; monto: number }
  indirectos: { porcentaje: number; monto: number }
  carroPiloto: {
    requiere: boolean
    dias: number
    costoBase: number
    gasolina: number
    casetas: number
    alimentacion: number
    imprevistos: number
    total: number
  }
  costoTotal: number
  utilidadEsperada: number
  margenEsperado: number
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO'
  desglosePorcentual: {
    diesel: number
    casetas: number
    viaticos: number
    salario: number
    permiso: number
    mantenimiento: number
    indirectos: number
    carroPiloto: number
  }
}

export default function NuevaCotizacionMejorada() {
  const navigate = useNavigate()

  // Catálogos
  const [clientes, setClientes] = useState<Array<{ id: number; nombre: string }>>([])
  const [camiones, setCamiones] = useState<Array<{ id: number; placas: string; numeroEconomico?: string }>>([])
  const [choferes, setChoferes] = useState<Array<{ id: number; nombre: string }>>([])

  // Estado de UI
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [simulacion, setSimulacion] = useState<Simulacion | null>(null)
  const [loading, setLoading] = useState(false)
  const [simulating, setSimulating] = useState(false)

  // Formulario
  const [form, setForm] = useState<FormData>({
    clienteId: '',
    origen: '',
    destino: '',
    tipoCarga: '',
    pesoCarga: '',
    dimensiones: '',
    kmCargado: '',
    kmVacio: '',
    precioCotizado: '',
    camionId: '',
    choferId: '',
    requiereCarroPiloto: false,
    diasCarroPiloto: '',
    costoBaseCarroPiloto: '5000',
    casetasCargado: '',
    casetasVacio: '',
    permisoEstimado: '',
    porcentajeMantenimiento: '25',
    porcentajeIndirectos: '20',
    comidasCantidad: '',
    comidasPrecioUnitario: '120',
    federalCantidad: '',
    federalPrecioUnitario: '100',
    telefonoCantidad: '',
    telefonoPrecioUnitario: '100',
    imprevistosViaticos: '500',
    notas: '',
  })

  useEffect(() => {
    fetchCatalogos()
  }, [])

  // Auto-simular cuando cambian los campos clave
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (form.kmCargado && form.precioCotizado) {
        simularCostos()
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [
    form.kmCargado,
    form.kmVacio,
    form.precioCotizado,
    form.camionId,
    form.choferId,
    form.requiereCarroPiloto,
    form.diasCarroPiloto,
    form.casetasCargado,
    form.casetasVacio,
    form.permisoEstimado,
  ])

  const fetchCatalogos = async () => {
    try {
      const [clientesRes, camionesRes, choferesRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/camiones'),
        api.get('/choferes'),
      ])
      setClientes(clientesRes.data)
      setCamiones(camionesRes.data)
      setChoferes(choferesRes.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const simularCostos = async () => {
    setSimulating(true)
    try {
      const payload: any = {
        kmCargado: Number(form.kmCargado) || 0,
        kmVacio: Number(form.kmVacio) || 0,
        precioCotizado: Number(form.precioCotizado),
      }

      if (form.camionId) payload.camionId = Number(form.camionId)
      if (form.choferId) payload.choferId = Number(form.choferId)
      if (form.casetasCargado) payload.casetasCargado = Number(form.casetasCargado)
      if (form.casetasVacio) payload.casetasVacio = Number(form.casetasVacio)
      if (form.permisoEstimado) payload.permisoEstimado = Number(form.permisoEstimado)
      if (form.porcentajeMantenimiento) payload.porcentajeMantenimiento = Number(form.porcentajeMantenimiento)
      if (form.porcentajeIndirectos) payload.porcentajeIndirectos = Number(form.porcentajeIndirectos)

      payload.requiereCarroPiloto = form.requiereCarroPiloto
      if (form.requiereCarroPiloto) {
        if (form.diasCarroPiloto) payload.diasCarroPiloto = Number(form.diasCarroPiloto)
        if (form.costoBaseCarroPiloto) payload.costoBaseCarroPiloto = Number(form.costoBaseCarroPiloto)
      }

      const response = await api.post('/cotizaciones/simular', payload)
      setSimulacion(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSimulating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.clienteId || !form.origen || !form.destino || !form.kmCargado || !form.precioCotizado) {
      toast.error('Complete los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        clienteId: Number(form.clienteId),
        origen: form.origen,
        destino: form.destino,
        kmCargado: Number(form.kmCargado),
        kmVacio: Number(form.kmVacio) || 0,
        precioCotizado: Number(form.precioCotizado),
      }

      if (form.tipoCarga) payload.tipoCarga = form.tipoCarga
      if (form.pesoCarga) payload.pesoCarga = Number(form.pesoCarga)
      if (form.dimensiones) payload.dimensiones = form.dimensiones
      if (form.camionId) payload.camionId = Number(form.camionId)
      if (form.choferId) payload.choferId = Number(form.choferId)
      if (form.casetasCargado) payload.casetasCargado = Number(form.casetasCargado)
      if (form.casetasVacio) payload.casetasVacio = Number(form.casetasVacio)
      if (form.permisoEstimado) payload.permisoEstimado = Number(form.permisoEstimado)
      if (form.porcentajeMantenimiento) payload.porcentajeMantenimiento = Number(form.porcentajeMantenimiento)
      if (form.porcentajeIndirectos) payload.porcentajeIndirectos = Number(form.porcentajeIndirectos)
      if (form.notas) payload.notas = form.notas

      payload.requiereCarroPiloto = form.requiereCarroPiloto
      if (form.requiereCarroPiloto) {
        if (form.diasCarroPiloto) payload.diasCarroPiloto = Number(form.diasCarroPiloto)
        if (form.costoBaseCarroPiloto) payload.costoBaseCarroPiloto = Number(form.costoBaseCarroPiloto)
      }

      const response = await api.post('/cotizaciones', payload)
      toast.success('Cotización creada exitosamente')
      navigate(`/cotizaciones/${response.data.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear cotización')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'BAJO':
        return 'bg-green-100 text-green-800'
      case 'MEDIO':
        return 'bg-yellow-100 text-yellow-800'
      case 'ALTO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
        <p className="text-gray-500">Simula costos con metodología profesional</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-6">
            {/* Cliente y Ruta */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Cliente y Ruta</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Cliente *</label>
                  <select
                    className="input"
                    value={form.clienteId}
                    onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Origen *</label>
                    <input
                      className="input"
                      placeholder="Hermosillo, SON"
                      value={form.origen}
                      onChange={(e) => setForm({ ...form, origen: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Destino *</label>
                    <input
                      className="input"
                      placeholder="Coatzacoalcos, VER"
                      value={form.destino}
                      onChange={(e) => setForm({ ...form, destino: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Carga */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Información de Carga</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Tipo de Carga</label>
                  <input
                    className="input"
                    placeholder="TANQUE DE FIBRA, Carga general, etc."
                    value={form.tipoCarga}
                    onChange={(e) => setForm({ ...form, tipoCarga: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Peso (toneladas)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      placeholder="10.00"
                      value={form.pesoCarga}
                      onChange={(e) => setForm({ ...form, pesoCarga: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Dimensiones (L x A x H)</label>
                    <input
                      className="input"
                      placeholder="8.3 x 4.1 x 4.0 M"
                      value={form.dimensiones}
                      onChange={(e) => setForm({ ...form, dimensiones: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kilometraje y Precio */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Kilometraje y Precio</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">KM Cargado *</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="2500"
                      value={form.kmCargado}
                      onChange={(e) => setForm({ ...form, kmCargado: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">KM Vacío (regreso)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="2150"
                      value={form.kmVacio}
                      onChange={(e) => setForm({ ...form, kmVacio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">KM Total</label>
                    <input
                      type="number"
                      className="input bg-gray-50"
                      value={Number(form.kmCargado || 0) + Number(form.kmVacio || 0)}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Precio Cotizado al Cliente *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="218008.09"
                    value={form.precioCotizado}
                    onChange={(e) => setForm({ ...form, precioCotizado: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Camión y Chofer */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Asignaciones (Opcional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Camión</label>
                  <select
                    className="input"
                    value={form.camionId}
                    onChange={(e) => setForm({ ...form, camionId: e.target.value })}
                  >
                    <option value="">Sin asignar</option>
                    {camiones.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.placas} {c.numeroEconomico && `(${c.numeroEconomico})`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Para usar su rendimiento de combustible
                  </p>
                </div>
                <div>
                  <label className="label">Chofer</label>
                  <select
                    className="input"
                    value={form.choferId}
                    onChange={(e) => setForm({ ...form, choferId: e.target.value })}
                  >
                    <option value="">Sin asignar</option>
                    {choferes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Para calcular su salario</p>
                </div>
              </div>
            </div>

            {/* Carro Piloto */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Carro Piloto</h3>
                  <p className="text-sm text-gray-500">
                    Requerido para cargas sobredimensionadas
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiereCarroPiloto}
                    onChange={(e) =>
                      setForm({ ...form, requiereCarroPiloto: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {form.requiereCarroPiloto && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="label">Días</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="5"
                      value={form.diasCarroPiloto}
                      onChange={(e) =>
                        setForm({ ...form, diasCarroPiloto: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Costo Base</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="5000"
                      value={form.costoBaseCarroPiloto}
                      onChange={(e) =>
                        setForm({ ...form, costoBaseCarroPiloto: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Opciones Avanzadas */}
            <div className="border-t pt-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                {showAdvanced ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
                Opciones Avanzadas
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  {/* Casetas Detalladas */}
                  <div>
                    <h4 className="font-medium mb-3">Casetas (Real)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Cargado</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="14000"
                          value={form.casetasCargado}
                          onChange={(e) =>
                            setForm({ ...form, casetasCargado: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="label">Vacío</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="10500"
                          value={form.casetasVacio}
                          onChange={(e) =>
                            setForm({ ...form, casetasVacio: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Si se deja vacío, se estimará automáticamente
                    </p>
                  </div>

                  {/* Permiso SCT */}
                  <div>
                    <label className="label">Permiso SCT</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="2200"
                      value={form.permisoEstimado}
                      onChange={(e) =>
                        setForm({ ...form, permisoEstimado: e.target.value })
                      }
                    />
                  </div>

                  {/* Porcentajes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Mantenimiento (%)</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="25"
                        value={form.porcentajeMantenimiento}
                        onChange={(e) =>
                          setForm({ ...form, porcentajeMantenimiento: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Indirectos (%)</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="20"
                        value={form.porcentajeIndirectos}
                        onChange={(e) =>
                          setForm({ ...form, porcentajeIndirectos: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="label">Notas</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Notas adicionales sobre esta cotización..."
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/cotizaciones')}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creando...' : 'Crear Cotización'}
              </button>
            </div>
          </form>
        </div>

        {/* Panel de Simulación */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-primary-600" />
              Simulación de Costos
            </h3>

            {simulating && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Calculando...</p>
              </div>
            )}

            {!simulacion && !simulating && (
              <div className="text-center py-8 text-gray-500">
                <TruckIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  Ingresa KM y precio para simular costos
                </p>
              </div>
            )}

            {simulacion && !simulating && (
              <div className="space-y-4">
                {/* Totales */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Costo Total:</span>
                    <span className="font-semibold">
                      {formatMoney(simulacion.costoTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Precio Cliente:</span>
                    <span className="font-semibold text-green-600">
                      {formatMoney(simulacion.precioCotizado)}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Utilidad:</span>
                    <span
                      className={`font-semibold ${
                        simulacion.utilidadEsperada >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatMoney(simulacion.utilidadEsperada)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Margen:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        {simulacion.margenEsperado.toFixed(2)}%
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getRiskColor(
                          simulacion.nivelRiesgo
                        )}`}
                      >
                        {simulacion.nivelRiesgo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desglose */}
                <div>
                  <h4 className="font-medium mb-3 text-sm">Desglose de Costos</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diesel:</span>
                      <span>{formatMoney(simulacion.diesel.costo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Casetas:</span>
                      <span>{formatMoney(simulacion.casetas.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Viáticos:</span>
                      <span>{formatMoney(simulacion.viaticos.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salario:</span>
                      <span>{formatMoney(simulacion.salario)}</span>
                    </div>
                    {simulacion.permiso > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Permiso SCT:</span>
                        <span>{formatMoney(simulacion.permiso)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Subtotal Operativo:</span>
                      <span className="font-medium">
                        {formatMoney(simulacion.subtotalOperativo)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Mantenimiento ({simulacion.mantenimiento.porcentaje}%):
                      </span>
                      <span>{formatMoney(simulacion.mantenimiento.monto)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Indirectos ({simulacion.indirectos.porcentaje}%):
                      </span>
                      <span>{formatMoney(simulacion.indirectos.monto)}</span>
                    </div>
                    {simulacion.carroPiloto.requiere && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Carro Piloto ({simulacion.carroPiloto.dias}d):
                        </span>
                        <span>{formatMoney(simulacion.carroPiloto.total)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info adicional */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Días estimados:</span>
                    <span>{simulacion.diasEstimados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Litros diesel:</span>
                    <span>{simulacion.diesel.litrosTotales.toFixed(2)} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>KM total:</span>
                    <span>{simulacion.kmTotal.toLocaleString('es-MX')} km</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
