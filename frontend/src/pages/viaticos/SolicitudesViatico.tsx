import { useEffect, useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  TrashIcon,
  BanknotesIcon,
  TruckIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Pagination from '../../components/Pagination'
import { usePermissions } from '../../hooks/usePermissions'
import { Modulo, Accion } from '../../utils/permissions'

interface SolicitudViatico {
  id: number
  fleteId: number
  tipoGasto: string
  periodoInicio: string
  periodoFin: string
  montoSolicitado: number
  detalle: any
  estado: string
  notas?: string
  motivoCancelacion?: string
  createdAt: string
  aprobadoAt?: string
  depositadoAt?: string
  canceladoAt?: string
  flete: {
    folio: string
    cliente: {
      nombre: string
    }
  }
  operador: {
    nombre: string
  }
}

interface Flete {
  id: number
  folio: string
  origen: string
  destino: string
  cliente: {
    nombre: string
  }
}

const TIPOS_GASTO = [
  { value: 'ALIMENTOS', label: 'Alimentos' },
  { value: 'HOSPEDAJE', label: 'Hospedaje' },
  { value: 'CASETAS', label: 'Casetas' },
  { value: 'COMBUSTIBLE', label: 'Combustible' },
  { value: 'OTROS', label: 'Otros' },
]

export default function SolicitudesViatico() {
  const { can } = usePermissions()
  const [solicitudes, setSolicitudes] = useState<SolicitudViatico[]>([])
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
    solicitados: 0,
    aprobados: 0,
    depositados: 0,
    cancelados: 0,
    montoTotal: 0,
    montoDepositado: 0,
  })

  // Formulario nueva solicitud
  const [formData, setFormData] = useState({
    fleteId: 0,
    tipoGasto: 'ALIMENTOS',
    periodoInicio: '',
    periodoFin: '',
    montoSolicitado: 0,
    detalle: { conceptos: [{ concepto: '', monto: 0 }] },
    notas: '',
  })
  const [guardando, setGuardando] = useState(false)

  // Modales de acción
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<number | null>(null)
  const [mostrarModalAprobar, setMostrarModalAprobar] = useState(false)
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false)
  const [mostrarModalDepositar, setMostrarModalDepositar] = useState(false)
  const [notasAccion, setNotasAccion] = useState('')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [solicitudesRes, fletesRes, statsRes] = await Promise.all([
        api.get('/viaticos/solicitudes'),
        api.get('/viaticos/fletes-disponibles'),
        api.get('/viaticos/solicitudes/estadisticas'),
      ])

      setSolicitudes(solicitudesRes.data)
      setFletes(fletesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarConcepto = () => {
    setFormData({
      ...formData,
      detalle: {
        ...formData.detalle,
        conceptos: [...formData.detalle.conceptos, { concepto: '', monto: 0 }],
      },
    })
  }

  const handleEliminarConcepto = (index: number) => {
    if (formData.detalle.conceptos.length > 1) {
      const nuevosConceptos = formData.detalle.conceptos.filter((_: any, i: number) => i !== index)
      setFormData({
        ...formData,
        detalle: { ...formData.detalle, conceptos: nuevosConceptos },
      })
    }
  }

  const handleConceptoChange = (index: number, field: string, value: any) => {
    const nuevosConceptos = [...formData.detalle.conceptos]
    nuevosConceptos[index] = { ...nuevosConceptos[index], [field]: value }
    setFormData({
      ...formData,
      detalle: { ...formData.detalle, conceptos: nuevosConceptos },
      montoSolicitado: nuevosConceptos.reduce((sum: number, c: any) => sum + (Number(c.monto) || 0), 0),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.fleteId === 0) {
      toast.error('Debe seleccionar un flete')
      return
    }

    if (!formData.periodoInicio || !formData.periodoFin) {
      toast.error('Debe especificar el período')
      return
    }

    if (formData.montoSolicitado <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    try {
      setGuardando(true)

      await api.post('/viaticos/solicitudes', {
        fleteId: formData.fleteId,
        tipoGasto: formData.tipoGasto,
        periodoInicio: formData.periodoInicio,
        periodoFin: formData.periodoFin,
        montoSolicitado: formData.montoSolicitado,
        detalle: formData.detalle,
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
    setFormData({
      fleteId: 0,
      tipoGasto: 'ALIMENTOS',
      periodoInicio: '',
      periodoFin: '',
      montoSolicitado: 0,
      detalle: { conceptos: [{ concepto: '', monto: 0 }] },
      notas: '',
    })
  }

  const handleAprobar = async () => {
    if (!solicitudSeleccionada) return

    try {
      await api.patch(`/viaticos/solicitudes/${solicitudSeleccionada}/aprobar`, {
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

  const handleCancelar = async () => {
    if (!solicitudSeleccionada || !motivoCancelacion) {
      toast.error('Debe indicar el motivo de la cancelación')
      return
    }

    try {
      await api.patch(`/viaticos/solicitudes/${solicitudSeleccionada}/cancelar`, {
        motivoCancelacion,
      })
      toast.success('Solicitud cancelada')
      setMostrarModalCancelar(false)
      setMotivoCancelacion('')
      setSolicitudSeleccionada(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar')
    }
  }

  const handleDepositar = async () => {
    if (!solicitudSeleccionada) return

    try {
      await api.patch(`/viaticos/solicitudes/${solicitudSeleccionada}/depositar`, {
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
      await api.delete(`/viaticos/solicitudes/${id}`)
      toast.success('Solicitud eliminada')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar')
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX')
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      SOLICITADO: 'badge-warning',
      APROBADO: 'badge-info',
      DEPOSITADO: 'badge-success',
      CANCELADO: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
  }

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter((s) => {
    const matchBusqueda =
      s.flete.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.flete.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.operador.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.tipoGasto.toLowerCase().includes(busqueda.toLowerCase())

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Viáticos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las solicitudes de viáticos para los viajes
          </p>
        </div>
        {can(Modulo.VIATICOS, Accion.CREAR) && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Solicitud
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Solicitudes</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">{stats.solicitados}</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Solicitados</p>
                <p className="text-lg font-semibold text-yellow-600">{stats.solicitados}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-semibold">{stats.depositados}</span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Depositados</p>
                <p className="text-lg font-semibold text-green-600">{stats.depositados}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Monto Depositado</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatMoney(stats.montoDepositado)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por flete, cliente, operador o tipo..."
                  className="input pl-10 w-full"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                className="input w-full"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="TODOS">Todos los estados</option>
                <option value="SOLICITADO">Solicitado</option>
                <option value="APROBADO">Aprobado</option>
                <option value="DEPOSITADO">Depositado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Flete</th>
                <th>Tipo Gasto</th>
                <th>Período</th>
                <th>Operador</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No hay solicitudes
                  </td>
                </tr>
              ) : (
                solicitudesPaginadas.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td>
                      <div>
                        <div className="font-medium">{solicitud.flete.folio}</div>
                        <div className="text-sm text-gray-500">{solicitud.flete.cliente.nombre}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">
                        {TIPOS_GASTO.find((t) => t.value === solicitud.tipoGasto)?.label}
                      </span>
                    </td>
                    <td className="text-sm">
                      <div>{formatDate(solicitud.periodoInicio)}</div>
                      <div className="text-gray-500">al {formatDate(solicitud.periodoFin)}</div>
                    </td>
                    <td>{solicitud.operador.nombre}</td>
                    <td className="font-medium">{formatMoney(solicitud.montoSolicitado)}</td>
                    <td>
                      <span className={`badge ${getEstadoBadge(solicitud.estado)}`}>
                        {solicitud.estado}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{formatDate(solicitud.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {solicitud.estado === 'SOLICITADO' && can(Modulo.VIATICOS, Accion.APROBAR) && (
                          <button
                            onClick={() => {
                              setSolicitudSeleccionada(solicitud.id)
                              setMostrarModalAprobar(true)
                            }}
                            className="btn btn-sm btn-success"
                            title="Aprobar"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}

                        {solicitud.estado === 'APROBADO' && can(Modulo.VIATICOS, Accion.DEPOSITAR) && (
                          <button
                            onClick={() => {
                              setSolicitudSeleccionada(solicitud.id)
                              setMostrarModalDepositar(true)
                            }}
                            className="btn btn-sm btn-info"
                            title="Marcar como Depositado"
                          >
                            <BanknotesIcon className="h-4 w-4" />
                          </button>
                        )}

                        {(solicitud.estado === 'SOLICITADO' || solicitud.estado === 'APROBADO') &&
                          can(Modulo.VIATICOS, Accion.CANCELAR) && (
                            <button
                              onClick={() => {
                                setSolicitudSeleccionada(solicitud.id)
                                setMostrarModalCancelar(true)
                              }}
                              className="btn btn-sm btn-danger"
                              title="Cancelar"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          )}

                        {(solicitud.estado === 'SOLICITADO' || solicitud.estado === 'CANCELADO') &&
                          can(Modulo.VIATICOS, Accion.ELIMINAR) && (
                            <button
                              onClick={() => handleEliminar(solicitud.id)}
                              className="btn btn-sm btn-danger"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-4 w-4" />
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

        {totalPaginas > 1 && (
          <div className="card-footer">
            <Pagination
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              totalItems={solicitudesFiltradas.length}
              itemsPorPagina={itemsPorPagina}
              onCambiarPagina={setPaginaActual}
            />
          </div>
        )}
      </div>

      {/* Modal Formulario Nueva Solicitud */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <BanknotesIcon className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Nueva Solicitud de Viáticos</h2>
                </div>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                {/* Sección: Información General */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <TruckIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-700">Información General</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label flex items-center gap-2">
                        <TruckIcon className="h-4 w-4 text-gray-500" />
                        Flete
                      </label>
                      <select
                        className="input"
                        value={formData.fleteId}
                        onChange={(e) => setFormData({ ...formData, fleteId: Number(e.target.value) })}
                        required
                      >
                        <option value={0}>Seleccione un flete</option>
                        {fletes.map((flete) => (
                          <option key={flete.id} value={flete.id}>
                            {flete.folio} - {flete.cliente.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label flex items-center gap-2">
                        <BanknotesIcon className="h-4 w-4 text-gray-500" />
                        Tipo de Gasto
                      </label>
                      <select
                        className="input"
                        value={formData.tipoGasto}
                        onChange={(e) => setFormData({ ...formData, tipoGasto: e.target.value })}
                        required
                      >
                        {TIPOS_GASTO.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        Período Inicio
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={formData.periodoInicio}
                        onChange={(e) => setFormData({ ...formData, periodoInicio: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="label flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        Período Fin
                      </label>
                      <input
                        type="date"
                        className="input"
                        value={formData.periodoFin}
                        onChange={(e) => setFormData({ ...formData, periodoFin: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sección: Conceptos y Desglose */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-700">Conceptos y Desglose</h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleAgregarConcepto}
                      className="btn btn-sm btn-secondary flex items-center gap-1.5"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Agregar Concepto
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {formData.detalle.conceptos.map((concepto: any, index: number) => (
                      <div key={index} className="flex gap-3 items-start bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Descripción del concepto"
                            className="input"
                            value={concepto.concepto}
                            onChange={(e) => handleConceptoChange(index, 'concepto', e.target.value)}
                            required
                          />
                        </div>
                        <div className="w-40">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              className="input pl-7"
                              step="0.01"
                              min="0"
                              value={concepto.monto}
                              onChange={(e) =>
                                handleConceptoChange(index, 'monto', Number(e.target.value))
                              }
                              required
                            />
                          </div>
                        </div>
                        {formData.detalle.conceptos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleEliminarConcepto(index)}
                            className="btn btn-sm btn-danger"
                            title="Eliminar concepto"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Monto Total Solicitado:</span>
                      <span className="text-2xl font-bold text-blue-700">
                        {formatMoney(formData.montoSolicitado)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sección: Notas Adicionales */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-700">Notas Adicionales</h3>
                  </div>

                  <div>
                    <label className="label text-sm text-gray-600">
                      Agregue cualquier información adicional relevante para esta solicitud
                    </label>
                    <textarea
                      className="textarea"
                      rows={4}
                      placeholder="Ejemplo: Viaje a Monterrey del 15 al 18 de enero para entrega de mercancía..."
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t rounded-b-lg">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center gap-2"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      Crear Solicitud
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aprobar */}
      {mostrarModalAprobar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Aprobar Solicitud</h3>
              <p className="text-gray-600 mb-4">
                ¿Está seguro de aprobar esta solicitud de viáticos?
              </p>
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={notasAccion}
                  onChange={(e) => setNotasAccion(e.target.value)}
                  placeholder="Observaciones sobre la aprobación..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t">
              <button
                onClick={() => setMostrarModalAprobar(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleAprobar} className="btn btn-success">
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Depositar */}
      {mostrarModalDepositar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Marcar como Depositado</h3>
              <p className="text-gray-600 mb-4">
                ¿Confirma que el depósito fue realizado?
              </p>
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={notasAccion}
                  onChange={(e) => setNotasAccion(e.target.value)}
                  placeholder="Referencia del depósito, número de transferencia, etc..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t">
              <button
                onClick={() => setMostrarModalDepositar(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleDepositar} className="btn btn-info">
                Confirmar Depósito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {mostrarModalCancelar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Cancelar Solicitud</h3>
              <p className="text-gray-600 mb-4">
                Indique el motivo de la cancelación:
              </p>
              <textarea
                className="input"
                rows={3}
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                placeholder="Motivo de la cancelación..."
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t">
              <button
                onClick={() => setMostrarModalCancelar(false)}
                className="btn btn-secondary"
              >
                Cerrar
              </button>
              <button onClick={handleCancelar} className="btn btn-danger">
                Cancelar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
