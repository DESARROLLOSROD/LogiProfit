import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  CheckIcon,
  TruckIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Flete {
  id: number
  folio: string
  cliente: { nombre: string }
  origen: string
  destino: string
  precioCliente: number
  estado: string
  camiones: Array<{ id: number; camion: { id: number; placas: string; numeroEconomico?: string } }>
  choferes: Array<{
    id: number
    chofer: { id: number; nombre: string }
    tipoPago: string
    tarifaDia?: number
    tarifaKm?: number
    tarifaViaje?: number
    dias?: number
    kmReales?: number
    salarioCalculado: number
  }>
  gastos: Array<{
    id: number
    tipo: string
    concepto?: string
    monto: number
    fecha: string
    validado: boolean
  }>
  resumen: {
    precioCliente: number
    totalGastos: number
    utilidad: number
    margen: number
  }
}

interface Camion {
  id: number
  placas: string
  numeroEconomico?: string
  tipo: string
}

interface Chofer {
  id: number
  nombre: string
  tipoPago: 'POR_DIA' | 'POR_KM' | 'POR_VIAJE'
  tarifaDia?: number
  tarifaKm?: number
  tarifaViaje?: number
}

export default function FleteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [flete, setFlete] = useState<Flete | null>(null)
  const [loading, setLoading] = useState(true)

  // Modales
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [showCamionModal, setShowCamionModal] = useState(false)
  const [showChoferModal, setShowChoferModal] = useState(false)

  // Catálogos
  const [camionesDisponibles, setCamionesDisponibles] = useState<Camion[]>([])
  const [choferesDisponibles, setChoferesDisponibles] = useState<Chofer[]>([])

  // Forms
  const [nuevoGasto, setNuevoGasto] = useState({ tipo: 'DIESEL', monto: '', concepto: '' })
  const [camionSeleccionado, setCamionSeleccionado] = useState('')
  const [choferForm, setChoferForm] = useState({
    choferId: '',
    dias: '',
    kmReales: '',
  })

  useEffect(() => {
    fetchFlete()
  }, [id])

  const fetchFlete = async () => {
    try {
      const response = await api.get(`/fletes/${id}`)

      // Convertir campos Decimal de Prisma (vienen como strings) a números
      const data = response.data
      const fleteConvertido = {
        ...data,
        precioCliente: Number(data.precioCliente) || 0,
        choferes: data.choferes.map((ch: any) => ({
          ...ch,
          tarifaDia: Number(ch.tarifaDia) || 0,
          tarifaKm: Number(ch.tarifaKm) || 0,
          tarifaViaje: Number(ch.tarifaViaje) || 0,
          dias: Number(ch.dias) || 0,
          kmReales: Number(ch.kmReales) || 0,
          salarioCalculado: Number(ch.salarioCalculado) || 0,
        })),
        gastos: data.gastos.map((gasto: any) => ({
          ...gasto,
          monto: Number(gasto.monto) || 0,
        })),
        resumen: {
          precioCliente: Number(data.resumen.precioCliente) || 0,
          totalGastos: Number(data.resumen.totalGastos) || 0,
          utilidad: Number(data.resumen.utilidad) || 0,
          margen: Number(data.resumen.margen) || 0,
        },
      }

      setFlete(fleteConvertido)
    } catch {
      navigate('/fletes')
    } finally {
      setLoading(false)
    }
  }

  const fetchCamiones = async () => {
    try {
      const response = await api.get('/camiones')
      setCamionesDisponibles(response.data)
    } catch {
      toast.error('Error al cargar camiones')
    }
  }

  const fetchChoferes = async () => {
    try {
      const response = await api.get('/choferes')
      setChoferesDisponibles(response.data)
    } catch {
      toast.error('Error al cargar choferes')
    }
  }

  const cambiarEstado = async (nuevoEstado: string) => {
    try {
      await api.patch(`/fletes/${id}/estado?estado=${nuevoEstado}`)
      toast.success('Estado actualizado')
      fetchFlete()
    } catch {}
  }

  const validarGasto = async (gastoId: number) => {
    try {
      await api.patch(`/gastos/${gastoId}/validar`)
      toast.success('Gasto validado')
      fetchFlete()
    } catch {}
  }

  const agregarGasto = async () => {
    try {
      await api.post('/gastos', {
        fleteId: Number(id),
        tipo: nuevoGasto.tipo,
        monto: Number(nuevoGasto.monto),
        concepto: nuevoGasto.concepto,
        fecha: new Date().toISOString(),
      })
      toast.success('Gasto agregado')
      setShowGastoModal(false)
      setNuevoGasto({ tipo: 'DIESEL', monto: '', concepto: '' })
      fetchFlete()
    } catch {}
  }

  const asignarCamion = async () => {
    if (!camionSeleccionado) {
      toast.error('Selecciona un camión')
      return
    }

    try {
      await api.post(`/fletes/${id}/camiones`, {
        camionId: Number(camionSeleccionado),
      })
      toast.success('Camión asignado correctamente')
      setShowCamionModal(false)
      setCamionSeleccionado('')
      fetchFlete()
    } catch {}
  }

  const desasignarCamion = async (camionId: number) => {
    try {
      await api.delete(`/fletes/${id}/camiones/${camionId}`)
      toast.success('Camión desasignado')
      fetchFlete()
    } catch {}
  }

  const asignarChofer = async () => {
    if (!choferForm.choferId) {
      toast.error('Selecciona un chofer')
      return
    }

    const choferSeleccionado = choferesDisponibles.find(
      (c) => c.id === Number(choferForm.choferId)
    )

    if (!choferSeleccionado) return

    // Validar campos según tipo de pago
    if (choferSeleccionado.tipoPago === 'POR_DIA' && !choferForm.dias) {
      toast.error('Debes especificar los días trabajados')
      return
    }

    if (choferSeleccionado.tipoPago === 'POR_KM' && !choferForm.kmReales) {
      toast.error('Debes especificar los kilómetros recorridos')
      return
    }

    try {
      await api.post(`/fletes/${id}/choferes`, {
        choferId: Number(choferForm.choferId),
        dias: choferForm.dias ? Number(choferForm.dias) : undefined,
        kmReales: choferForm.kmReales ? Number(choferForm.kmReales) : undefined,
      })
      toast.success('Chofer asignado correctamente')
      setShowChoferModal(false)
      setChoferForm({ choferId: '', dias: '', kmReales: '' })
      fetchFlete()
    } catch {}
  }

  const desasignarChofer = async (choferId: number) => {
    try {
      await api.delete(`/fletes/${id}/choferes/${choferId}`)
      toast.success('Chofer desasignado')
      fetchFlete()
    } catch {}
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  if (!flete) return null

  const choferSeleccionadoTipo = choferesDisponibles.find(
    (c) => c.id === Number(choferForm.choferId)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{flete.folio}</h1>
          <p className="text-gray-500">{flete.cliente.nombre}</p>
        </div>
        <div className="flex gap-2">
          {flete.estado === 'PLANEADO' && (
            <button onClick={() => cambiarEstado('EN_CURSO')} className="btn-primary">
              Iniciar Viaje
            </button>
          )}
          {flete.estado === 'EN_CURSO' && (
            <button onClick={() => cambiarEstado('COMPLETADO')} className="btn-primary">
              Completar Viaje
            </button>
          )}
          {flete.estado === 'COMPLETADO' && (
            <button onClick={() => cambiarEstado('CERRADO')} className="btn-secondary">
              Cerrar Flete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Precio Cliente</p>
          <p className="text-xl font-bold">{formatMoney(flete.resumen.precioCliente)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Gastos</p>
          <p className="text-xl font-bold text-red-600">
            {formatMoney(flete.resumen.totalGastos)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Utilidad</p>
          <p
            className={`text-xl font-bold ${
              flete.resumen.utilidad >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatMoney(flete.resumen.utilidad)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Margen</p>
          <p className="text-xl font-bold text-blue-600">{flete.resumen.margen.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Información del Viaje */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Información del Viaje</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Origen</dt>
              <dd className="font-medium">{flete.origen}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Destino</dt>
              <dd className="font-medium">{flete.destino}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Estado</dt>
              <dd>
                <span className="badge badge-info">{flete.estado.replace('_', ' ')}</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Camiones Asignados */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-primary-600" />
              Camiones
            </h3>
            <button
              onClick={() => {
                fetchCamiones()
                setShowCamionModal(true)
              }}
              className="btn-sm btn-primary flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              Asignar
            </button>
          </div>
          <div className="space-y-2">
            {flete.camiones.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Sin camión asignado</p>
            ) : (
              flete.camiones.map((asignacion) => (
                <div
                  key={asignacion.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{asignacion.camion.placas}</p>
                    {asignacion.camion.numeroEconomico && (
                      <p className="text-sm text-gray-500">#{asignacion.camion.numeroEconomico}</p>
                    )}
                  </div>
                  <button
                    onClick={() => desasignarCamion(asignacion.camion.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Desasignar"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Choferes Asignados */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary-600" />
              Choferes
            </h3>
            <button
              onClick={() => {
                fetchChoferes()
                setShowChoferModal(true)
              }}
              className="btn-sm btn-primary flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              Asignar
            </button>
          </div>
          <div className="space-y-2">
            {flete.choferes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Sin chofer asignado</p>
            ) : (
              flete.choferes.map((asignacion) => (
                <div
                  key={asignacion.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{asignacion.chofer.nombre}</p>
                    <p className="text-sm text-gray-500">{asignacion.tipoPago.replace('_', ' ')}</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatMoney(asignacion.salarioCalculado)}
                    </p>
                  </div>
                  <button
                    onClick={() => desasignarChofer(asignacion.chofer.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Desasignar"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gastos */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Gastos del Viaje</h3>
          <button
            onClick={() => setShowGastoModal(true)}
            className="btn-primary flex items-center gap-1 text-sm py-1.5"
          >
            <PlusIcon className="w-4 h-4" />
            Agregar Gasto
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-500">Tipo</th>
                <th className="text-left py-2 font-medium text-gray-500">Concepto</th>
                <th className="text-right py-2 font-medium text-gray-500">Monto</th>
                <th className="text-center py-2 font-medium text-gray-500">Validado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {flete.gastos.map((gasto) => (
                <tr key={gasto.id} className="border-b">
                  <td className="py-2">{gasto.tipo}</td>
                  <td className="py-2 text-gray-500">{gasto.concepto || '-'}</td>
                  <td className="py-2 text-right font-medium">{formatMoney(gasto.monto)}</td>
                  <td className="py-2 text-center">
                    {gasto.validado ? (
                      <CheckIcon className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-yellow-600">Pendiente</span>
                    )}
                  </td>
                  <td className="py-2">
                    {!gasto.validado && (
                      <button
                        onClick={() => validarGasto(gasto.id)}
                        className="text-primary-600 hover:underline text-xs"
                      >
                        Validar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {flete.gastos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No hay gastos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Agregar Gasto */}
      {showGastoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Agregar Gasto</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Tipo</label>
                <select
                  className="input"
                  value={nuevoGasto.tipo}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, tipo: e.target.value })}
                >
                  <option value="DIESEL">Diesel</option>
                  <option value="CASETAS">Casetas</option>
                  <option value="VIATICOS">Viáticos</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="MULTA">Multa</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div>
                <label className="label">Monto</label>
                <input
                  type="number"
                  className="input"
                  value={nuevoGasto.monto}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">Concepto</label>
                <input
                  className="input"
                  value={nuevoGasto.concepto}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })}
                  placeholder="Descripción..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowGastoModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={agregarGasto} className="btn-primary flex-1">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Camión */}
      {showCamionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-primary-600" />
              Asignar Camión
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Selecciona un camión</label>
                <select
                  className="input"
                  value={camionSeleccionado}
                  onChange={(e) => setCamionSeleccionado(e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {camionesDisponibles.map((camion) => (
                    <option key={camion.id} value={camion.id}>
                      {camion.placas} {camion.numeroEconomico && `(#${camion.numeroEconomico})`} -{' '}
                      {camion.tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowCamionModal(false)
                  setCamionSeleccionado('')
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button onClick={asignarCamion} className="btn-primary flex-1">
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Chofer */}
      {showChoferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary-600" />
              Asignar Chofer
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Selecciona un chofer</label>
                <select
                  className="input"
                  value={choferForm.choferId}
                  onChange={(e) => setChoferForm({ ...choferForm, choferId: e.target.value })}
                >
                  <option value="">-- Seleccionar --</option>
                  {choferesDisponibles.map((chofer) => (
                    <option key={chofer.id} value={chofer.id}>
                      {chofer.nombre} - {chofer.tipoPago.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {choferSeleccionadoTipo && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-2">
                    Tipo de pago: {choferSeleccionadoTipo.tipoPago.replace('_', ' ')}
                  </p>
                  {choferSeleccionadoTipo.tipoPago === 'POR_DIA' && (
                    <p className="text-sm text-blue-800">
                      Tarifa: {formatMoney(choferSeleccionadoTipo.tarifaDia || 0)}/día
                    </p>
                  )}
                  {choferSeleccionadoTipo.tipoPago === 'POR_KM' && (
                    <p className="text-sm text-blue-800">
                      Tarifa: {formatMoney(choferSeleccionadoTipo.tarifaKm || 0)}/km
                    </p>
                  )}
                  {choferSeleccionadoTipo.tipoPago === 'POR_VIAJE' && (
                    <p className="text-sm text-blue-800">
                      Tarifa: {formatMoney(choferSeleccionadoTipo.tarifaViaje || 0)} fija
                    </p>
                  )}
                </div>
              )}

              {choferSeleccionadoTipo?.tipoPago === 'POR_DIA' && (
                <div>
                  <label className="label">Días trabajados *</label>
                  <input
                    type="number"
                    className="input"
                    value={choferForm.dias}
                    onChange={(e) => setChoferForm({ ...choferForm, dias: e.target.value })}
                    placeholder="Ej: 3"
                  />
                </div>
              )}

              {choferSeleccionadoTipo?.tipoPago === 'POR_KM' && (
                <div>
                  <label className="label">Kilómetros recorridos *</label>
                  <input
                    type="number"
                    className="input"
                    value={choferForm.kmReales}
                    onChange={(e) => setChoferForm({ ...choferForm, kmReales: e.target.value })}
                    placeholder="Ej: 450"
                  />
                </div>
              )}

              {choferSeleccionadoTipo && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-900 font-medium">Salario estimado:</p>
                  <p className="text-lg font-bold text-green-700">
                    {choferSeleccionadoTipo.tipoPago === 'POR_DIA' && choferForm.dias
                      ? formatMoney(
                          (choferSeleccionadoTipo.tarifaDia || 0) * Number(choferForm.dias)
                        )
                      : choferSeleccionadoTipo.tipoPago === 'POR_KM' && choferForm.kmReales
                      ? formatMoney(
                          (choferSeleccionadoTipo.tarifaKm || 0) * Number(choferForm.kmReales)
                        )
                      : choferSeleccionadoTipo.tipoPago === 'POR_VIAJE'
                      ? formatMoney(choferSeleccionadoTipo.tarifaViaje || 0)
                      : '-'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowChoferModal(false)
                  setChoferForm({ choferId: '', dias: '', kmReales: '' })
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button onClick={asignarChofer} className="btn-primary flex-1">
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
