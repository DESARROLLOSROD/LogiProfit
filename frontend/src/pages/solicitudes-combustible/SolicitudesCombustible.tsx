import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Pagination from '../../components/Pagination'
import { usePermissions } from '../../hooks/usePermissions'
import { Modulo, Accion } from '../../utils/permissions'

interface Parada {
  id?: number
  orden?: number
  lugar: string
  litros: number
  precioLitro: number
  total: number
  notas?: string
}

interface Solicitud {
  id: number
  fleteId: number
  estado: string
  montoTotal: number
  notas?: string
  motivoRechazo?: string
  createdAt: string
  aprobadoAt?: string
  depositadoAt?: string
  rechazadoAt?: string
  flete: {
    folio: string
    cliente: {
      nombre: string
    }
  }
  operador: {
    nombre: string
  }
  paradas: Parada[]
}

interface Flete {
  id: number
  folio: string
  cliente: {
    nombre: string
  }
}

export default function SolicitudesCombustible() {
  const { can } = usePermissions()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [fletes, setFletes] = useState<Flete[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    depositadas: 0,
    rechazadas: 0,
    montoTotal: 0,
    montoDepositado: 0,
  })

  // Formulario nueva solicitud
  const [formData, setFormData] = useState({
    fleteId: 0,
    notas: '',
  })
  const [paradas, setParadas] = useState<Parada[]>([
    { lugar: '', litros: 0, precioLitro: 0, total: 0, notas: '' },
  ])
  const [guardando, setGuardando] = useState(false)

  // Modales de acción
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<number | null>(null)
  const [mostrarModalAprobar, setMostrarModalAprobar] = useState(false)
  const [mostrarModalRechazar, setMostrarModalRechazar] = useState(false)
  const [mostrarModalDepositar, setMostrarModalDepositar] = useState(false)
  const [notasAccion, setNotasAccion] = useState('')
  const [motivoRechazo, setMotivoRechazo] = useState('')

  useEffect(() => {
    fetchData()
  }, [])


  const fetchData = async () => {
    try {
      const [solicitudesRes, fletesRes, statsRes] = await Promise.all([
        api.get('/solicitudes-combustible'),
        api.get('/fletes'),
        api.get('/solicitudes-combustible/estadisticas'),
      ])

      setSolicitudes(solicitudesRes.data)
      setFletes(fletesRes.data.filter((f: any) => f.estado === 'EN_CURSO' || f.estado === 'COMPLETADO'))
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarParada = () => {
    setParadas([...paradas, { lugar: '', litros: 0, precioLitro: 0, total: 0, notas: '' }])
  }

  const handleEliminarParada = (index: number) => {
    if (paradas.length > 1) {
      setParadas(paradas.filter((_, i) => i !== index))
    }
  }

  const handleParadaChange = (index: number, field: keyof Parada, value: any) => {
    const nuevasParadas = [...paradas]
    nuevasParadas[index] = { ...nuevasParadas[index], [field]: value }

    // Calcular total automáticamente
    if (field === 'litros' || field === 'precioLitro') {
      nuevasParadas[index].total = nuevasParadas[index].litros * nuevasParadas[index].precioLitro
    }

    setParadas(nuevasParadas)
  }

  const calcularMontoTotal = () => {
    return paradas.reduce((sum, p) => sum + p.total, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.fleteId === 0) {
      toast.error('Debe seleccionar un flete')
      return
    }

    if (paradas.length === 0 || paradas.some((p) => !p.lugar || p.litros <= 0 || p.precioLitro <= 0)) {
      toast.error('Todas las paradas deben tener lugar, litros y precio válidos')
      return
    }

    try {
      setGuardando(true)

      await api.post('/solicitudes-combustible', {
        fleteId: formData.fleteId,
        paradas: paradas.map(({ lugar, litros, precioLitro, notas }) => ({
          lugar,
          litros,
          precioLitro,
          notas,
        })),
        notas: formData.notas,
      })

      toast.success('Solicitud creada correctamente')
      setMostrarFormulario(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear solicitud')
    } finally {
      setGuardando(false)
    }
  }

  const resetForm = () => {
    setFormData({ fleteId: 0, notas: '' })
    setParadas([{ lugar: '', litros: 0, precioLitro: 0, total: 0, notas: '' }])
  }

  const handleAprobar = async () => {
    if (!solicitudSeleccionada) return

    try {
      await api.patch(`/solicitudes-combustible/${solicitudSeleccionada}/aprobar`, {
        notas: notasAccion || undefined,
      })
      toast.success('Solicitud aprobada correctamente')
      setMostrarModalAprobar(false)
      setNotasAccion('')
      setSolicitudSeleccionada(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al aprobar')
    }
  }

  const handleRechazar = async () => {
    if (!solicitudSeleccionada || !motivoRechazo) {
      toast.error('Debe indicar el motivo del rechazo')
      return
    }

    try {
      await api.patch(`/solicitudes-combustible/${solicitudSeleccionada}/rechazar`, {
        motivoRechazo,
      })
      toast.success('Solicitud rechazada')
      setMostrarModalRechazar(false)
      setMotivoRechazo('')
      setSolicitudSeleccionada(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al rechazar')
    }
  }

  const handleDepositar = async () => {
    if (!solicitudSeleccionada) return

    try {
      await api.patch(`/solicitudes-combustible/${solicitudSeleccionada}/depositar`, {
        notas: notasAccion || undefined,
      })
      toast.success('Solicitud marcada como depositada')
      setMostrarModalDepositar(false)
      setNotasAccion('')
      setSolicitudSeleccionada(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al depositar')
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta solicitud?')) return

    try {
      await api.delete(`/solicitudes-combustible/${id}`)
      toast.success('Solicitud eliminada')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar')
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      PENDIENTE: 'badge-warning',
      APROBADA: 'badge-info',
      DEPOSITADA: 'badge-success',
      RECHAZADA: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
  }

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter((s) => {
    const matchBusqueda =
      s.flete.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.flete.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.operador.nombre.toLowerCase().includes(busqueda.toLowerCase())

    const matchEstado = filtroEstado === 'TODOS' || s.estado === filtroEstado

    return matchBusqueda && matchEstado
  })

  // Paginación
  const totalPaginas = Math.ceil(solicitudesFiltradas.length / itemsPorPagina)
  const indexInicio = (paginaActual - 1) * itemsPorPagina
  const indexFin = indexInicio + itemsPorPagina
  const solicitudesPaginadas = solicitudesFiltradas.slice(indexInicio, indexFin)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Combustible</h1>
          <p className="text-gray-500">{solicitudes.length} solicitudes registradas</p>
        </div>
        <button onClick={() => setMostrarFormulario(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nueva Solicitud
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Solicitudes</p>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500 mt-1">{formatMoney(stats.montoTotal)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Aprobadas</p>
          <p className="text-2xl font-bold text-blue-600">{stats.aprobadas}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Depositadas</p>
          <p className="text-2xl font-bold text-green-600">{stats.depositadas}</p>
          <p className="text-sm text-gray-500 mt-1">{formatMoney(stats.montoDepositado)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="label flex items-center gap-2">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
              Buscar
            </label>
            <input
              type="text"
              className="input"
              placeholder="Buscar por folio, cliente u operador..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="w-64">
            <label className="label flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              Estado
            </label>
            <select className="input" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADA">Aprobada</option>
              <option value="DEPOSITADA">Depositada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Flete</th>
              <th>Operador</th>
              <th>Cliente</th>
              <th>Paradas</th>
              <th>Monto Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {solicitudesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No se encontraron solicitudes
                </td>
              </tr>
            ) : (
              solicitudesPaginadas.map((solicitud) => (
                <tr key={solicitud.id}>
                  <td>
                    <Link to={`/fletes/${solicitud.fleteId}`} className="text-primary-600 hover:underline font-medium">
                      {solicitud.flete.folio}
                    </Link>
                  </td>
                  <td>{solicitud.operador.nombre}</td>
                  <td>{solicitud.flete.cliente.nombre}</td>
                  <td>
                    <details className="cursor-pointer">
                      <summary className="text-primary-600 hover:underline text-sm">
                        {solicitud.paradas.length} parada{solicitud.paradas.length > 1 ? 's' : ''}
                      </summary>
                      <div className="mt-2 space-y-1 text-xs">
                        {solicitud.paradas.map((parada, idx) => (
                          <div key={parada.id || idx} className="pl-2 border-l-2 border-gray-200">
                            <div className="font-medium">{parada.lugar}</div>
                            <div className="text-gray-500">
                              {parada.litros}L × {formatMoney(parada.precioLitro)} = {formatMoney(parada.total)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </td>
                  <td className="font-semibold">{formatMoney(solicitud.montoTotal)}</td>
                  <td>
                    <span className={`badge ${getEstadoBadge(solicitud.estado)}`}>{solicitud.estado}</span>
                    {solicitud.motivoRechazo && (
                      <p className="text-xs text-red-600 mt-1">{solicitud.motivoRechazo}</p>
                    )}
                  </td>
                  <td className="text-sm text-gray-500">
                    {new Date(solicitud.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {/* Aprobar (Mantenimiento/Operador/Direccion) */}
                      {solicitud.estado === 'PENDIENTE' && can(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.APROBAR) && (
                        <>
                          <button
                            onClick={() => {
                              setSolicitudSeleccionada(solicitud.id)
                              setMostrarModalAprobar(true)
                            }}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Aprobar"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSolicitudSeleccionada(solicitud.id)
                              setMostrarModalRechazar(true)
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Rechazar"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {/* Depositar (Contabilidad) */}
                      {solicitud.estado === 'APROBADA' && can(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.DEPOSITAR) && (
                        <button
                          onClick={() => {
                            setSolicitudSeleccionada(solicitud.id)
                            setMostrarModalDepositar(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Marcar como depositada"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      )}

                      {/* Eliminar (Admin only, solo pendientes/rechazadas) */}
                      {(solicitud.estado === 'PENDIENTE' || solicitud.estado === 'RECHAZADA') &&
                        can(Modulo.SOLICITUDES_COMBUSTIBLE, Accion.CREAR) && (
                          <button
                            onClick={() => handleEliminar(solicitud.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalItems={solicitudesFiltradas.length}
        itemsPorPagina={itemsPorPagina}
        onCambiarPagina={setPaginaActual}
      />

      {/* Modal Nueva Solicitud */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Nueva Solicitud de Combustible</h2>
              <button
                onClick={() => {
                  setMostrarFormulario(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Flete *</label>
                <select
                  className="input"
                  value={formData.fleteId}
                  onChange={(e) => setFormData({ ...formData, fleteId: parseInt(e.target.value) })}
                  required
                >
                  <option value={0}>Seleccionar flete...</option>
                  {fletes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.folio} - {f.cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Paradas de Combustible *</label>
                  <button type="button" onClick={handleAgregarParada} className="btn-secondary text-sm">
                    <PlusIcon className="w-4 h-4 inline mr-1" />
                    Agregar Parada
                  </button>
                </div>

                <div className="space-y-4">
                  {paradas.map((parada, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                      {paradas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleEliminarParada(index)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                      <p className="text-sm font-medium text-gray-700 mb-3">Parada {index + 1}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="label text-sm">Lugar *</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="Ej: Gasolinera Shell, Guadalajara"
                            value={parada.lugar}
                            onChange={(e) => handleParadaChange(index, 'lugar', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="label text-sm">Litros *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            placeholder="0.00"
                            value={parada.litros || ''}
                            onChange={(e) => handleParadaChange(index, 'litros', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div>
                          <label className="label text-sm">Precio por Litro *</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            placeholder="0.00"
                            value={parada.precioLitro || ''}
                            onChange={(e) =>
                              handleParadaChange(index, 'precioLitro', parseFloat(e.target.value) || 0)
                            }
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="label text-sm">Total</label>
                          <input
                            type="text"
                            className="input bg-gray-50"
                            value={formatMoney(parada.total)}
                            disabled
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="label text-sm">Notas</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="Notas adicionales..."
                            value={parada.notas || ''}
                            onChange={(e) => handleParadaChange(index, 'notas', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">Monto Total:</span>
                  <span className="text-2xl font-bold text-primary-600">{formatMoney(calcularMontoTotal())}</span>
                </div>
              </div>

              <div>
                <label className="label">Notas Generales</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Notas adicionales de la solicitud..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1" disabled={guardando}>
                  {guardando ? 'Creando...' : 'Crear Solicitud'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false)
                    resetForm()
                  }}
                  className="btn-secondary"
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aprobar */}
      {mostrarModalAprobar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Aprobar Solicitud</h3>
            <div className="mb-4">
              <label className="label">Notas (opcional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Notas de aprobación..."
                value={notasAccion}
                onChange={(e) => setNotasAccion(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleAprobar} className="btn-primary flex-1">
                Confirmar Aprobación
              </button>
              <button
                onClick={() => {
                  setMostrarModalAprobar(false)
                  setNotasAccion('')
                  setSolicitudSeleccionada(null)
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar */}
      {mostrarModalRechazar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rechazar Solicitud</h3>
            <div className="mb-4">
              <label className="label">Motivo del Rechazo *</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Indique el motivo del rechazo..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleRechazar} className="btn-primary flex-1 bg-red-600 hover:bg-red-700">
                Confirmar Rechazo
              </button>
              <button
                onClick={() => {
                  setMostrarModalRechazar(false)
                  setMotivoRechazo('')
                  setSolicitudSeleccionada(null)
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Depositar */}
      {mostrarModalDepositar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Marcar como Depositada</h3>
            <div className="mb-4">
              <label className="label">Notas (opcional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Notas del depósito..."
                value={notasAccion}
                onChange={(e) => setNotasAccion(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleDepositar} className="btn-primary flex-1">
                Confirmar Depósito
              </button>
              <button
                onClick={() => {
                  setMostrarModalDepositar(false)
                  setNotasAccion('')
                  setSolicitudSeleccionada(null)
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
