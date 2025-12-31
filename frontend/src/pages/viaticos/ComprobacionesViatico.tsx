import { useEffect, useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Pagination from '../../components/Pagination'
import { usePermissions } from '../../hooks/usePermissions'
import { Modulo, Accion } from '../../utils/permissions'

interface ArchivoComprobante {
  nombre: string
  url: string
  tipo: string
  tamano: number
  descripcion?: string
}

interface ComprobacionViatico {
  id: number
  solicitudId?: number
  fleteId: number
  archivos: ArchivoComprobante[]
  estado: string
  motivoRechazo?: string
  notas?: string
  createdAt: string
  validadoAt?: string
  flete: {
    folio: string
    cliente: {
      nombre: string
    }
  }
  operador: {
    nombre: string
  }
  solicitud?: {
    tipoGasto: string
    montoSolicitado: number
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

interface Solicitud {
  id: number
  fleteId: number
  tipoGasto: string
  montoSolicitado: number
}

export default function ComprobacionesViatico() {
  const { can } = usePermissions()
  const [comprobaciones, setComprobaciones] = useState<ComprobacionViatico[]>([])
  const [fletes, setFletes] = useState<Flete[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
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
    rechazadas: 0,
  })

  // Formulario nueva comprobación
  const [formData, setFormData] = useState({
    solicitudId: 0,
    fleteId: 0,
    archivos: [] as ArchivoComprobante[],
    notas: '',
  })
  const [guardando, setGuardando] = useState(false)

  // Modales de acción
  const [comprobacionSeleccionada, setComprobacionSeleccionada] = useState<number | null>(null)
  const [mostrarModalValidar, setMostrarModalValidar] = useState(false)
  const [aprobarValidacion, setAprobarValidacion] = useState(true)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [notasValidacion, setNotasValidacion] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [comprobacionesRes, fletesRes, statsRes] = await Promise.all([
        api.get('/viaticos/comprobaciones'),
        api.get('/viaticos/fletes-disponibles'),
        api.get('/viaticos/comprobaciones/estadisticas'),
      ])

      setComprobaciones(comprobacionesRes.data)
      setFletes(fletesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchSolicitudesPorFlete = async (fleteId: number) => {
    if (!fleteId) {
      setSolicitudes([])
      return
    }

    try {
      const res = await api.get(`/viaticos/solicitudes?fleteId=${fleteId}`)
      setSolicitudes(res.data.filter((s: Solicitud) => s.estado === 'DEPOSITADO'))
    } catch (error) {
      console.error('Error al cargar solicitudes:', error)
    }
  }

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Simular subida de archivos (en producción se subiría a S3 o similar)
    const nuevosArchivos: ArchivoComprobante[] = Array.from(files).map((file) => ({
      nombre: file.name,
      url: `https://example.com/uploads/${file.name}`, // URL simulada
      tipo: file.type,
      tamano: file.size,
      descripcion: '',
    }))

    setFormData({
      ...formData,
      archivos: [...formData.archivos, ...nuevosArchivos],
    })

    toast.success(`${files.length} archivo(s) agregado(s)`)
  }

  const handleEliminarArchivo = (index: number) => {
    setFormData({
      ...formData,
      archivos: formData.archivos.filter((_, i) => i !== index),
    })
  }

  const handleArchivoDescripcionChange = (index: number, descripcion: string) => {
    const nuevosArchivos = [...formData.archivos]
    nuevosArchivos[index] = { ...nuevosArchivos[index], descripcion }
    setFormData({ ...formData, archivos: nuevosArchivos })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.fleteId === 0) {
      toast.error('Debe seleccionar un flete')
      return
    }

    if (formData.archivos.length === 0) {
      toast.error('Debe agregar al menos un archivo comprobante')
      return
    }

    try {
      setGuardando(true)

      await api.post('/viaticos/comprobaciones', {
        solicitudId: formData.solicitudId || undefined,
        fleteId: formData.fleteId,
        archivos: formData.archivos,
        notas: formData.notas,
      })

      toast.success('Comprobación creada correctamente')
      setMostrarFormulario(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear comprobación')
    } finally {
      setGuardando(false)
    }
  }

  const resetForm = () => {
    setFormData({
      solicitudId: 0,
      fleteId: 0,
      archivos: [],
      notas: '',
    })
    setSolicitudes([])
  }

  const handleValidar = async () => {
    if (!comprobacionSeleccionada) return

    if (!aprobarValidacion && !motivoRechazo) {
      toast.error('Debe indicar el motivo del rechazo')
      return
    }

    try {
      await api.patch(`/viaticos/comprobaciones/${comprobacionSeleccionada}/validar`, {
        aprobado: aprobarValidacion,
        motivoRechazo: aprobarValidacion ? undefined : motivoRechazo,
        notas: notasValidacion || undefined,
      })

      toast.success(
        aprobarValidacion
          ? 'Comprobación aprobada correctamente'
          : 'Comprobación rechazada'
      )
      setMostrarModalValidar(false)
      setMotivoRechazo('')
      setNotasValidacion('')
      setComprobacionSeleccionada(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al validar')
    }
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta comprobación?')) return

    try {
      await api.delete(`/viaticos/comprobaciones/${id}`)
      toast.success('Comprobación eliminada')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX')
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      PENDIENTE_VALIDACION: 'badge-warning',
      APROBADO: 'badge-success',
      RECHAZADO: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
  }

  // Filtrar comprobaciones
  const comprobacionesFiltradas = comprobaciones.filter((c) => {
    const matchBusqueda =
      c.flete.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.flete.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.operador.nombre.toLowerCase().includes(busqueda.toLowerCase())

    const matchEstado = filtroEstado === 'TODOS' || c.estado === filtroEstado

    return matchBusqueda && matchEstado
  })

  // Paginación
  const totalPaginas = Math.ceil(comprobacionesFiltradas.length / itemsPorPagina)
  const indexInicio = (paginaActual - 1) * itemsPorPagina
  const indexFin = indexInicio + itemsPorPagina
  const comprobacionesPaginadas = comprobacionesFiltradas.slice(indexInicio, indexFin)

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
          <h1 className="text-3xl font-bold text-gray-900">Comprobaciones de Viáticos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona la comprobación de gastos de viáticos con archivos adjuntos
          </p>
        </div>
        {can(Modulo.VIATICOS, Accion.CREAR) && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Comprobación
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                <span className="text-yellow-600 font-semibold text-sm">{stats.pendientes}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pendientes</p>
                <p className="text-lg font-semibold text-yellow-600">{stats.pendientes}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Aprobadas</p>
                <p className="text-lg font-semibold text-green-600">{stats.aprobadas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rechazadas</p>
                <p className="text-lg font-semibold text-red-600">{stats.rechazadas}</p>
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
                  placeholder="Buscar por flete, cliente u operador..."
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
                <option value="PENDIENTE_VALIDACION">Pendiente Validación</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO">Rechazado</option>
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
                <th>Operador</th>
                <th>Archivos</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprobacionesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No hay comprobaciones
                  </td>
                </tr>
              ) : (
                comprobacionesPaginadas.map((comprobacion) => (
                  <tr key={comprobacion.id}>
                    <td>
                      <div>
                        <div className="font-medium">{comprobacion.flete.folio}</div>
                        <div className="text-sm text-gray-500">
                          {comprobacion.flete.cliente.nombre}
                        </div>
                      </div>
                    </td>
                    <td>{comprobacion.operador.nombre}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <span className="font-medium">{comprobacion.archivos.length}</span>
                        <span className="text-sm text-gray-500">archivo(s)</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getEstadoBadge(comprobacion.estado)}`}>
                        {comprobacion.estado === 'PENDIENTE_VALIDACION'
                          ? 'Pendiente'
                          : comprobacion.estado}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">{formatDate(comprobacion.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {comprobacion.estado === 'PENDIENTE_VALIDACION' &&
                          can(Modulo.VIATICOS, Accion.VALIDAR) && (
                            <button
                              onClick={() => {
                                setComprobacionSeleccionada(comprobacion.id)
                                setMostrarModalValidar(true)
                              }}
                              className="btn btn-sm btn-info"
                              title="Validar"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}

                        {(comprobacion.estado === 'PENDIENTE_VALIDACION' ||
                          comprobacion.estado === 'RECHAZADO') &&
                          can(Modulo.VIATICOS, Accion.ELIMINAR) && (
                            <button
                              onClick={() => handleEliminar(comprobacion.id)}
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
              currentPage={paginaActual}
              totalPages={totalPaginas}
              onPageChange={setPaginaActual}
            />
          </div>
        )}
      </div>

      {/* Modal Formulario Nueva Comprobación */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="modal-header">
              <h2 className="modal-title">Nueva Comprobación de Viáticos</h2>
              <button onClick={() => setMostrarFormulario(false)} className="modal-close">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Flete</label>
                  <select
                    className="input"
                    value={formData.fleteId}
                    onChange={(e) => {
                      const fleteId = Number(e.target.value)
                      setFormData({ ...formData, fleteId, solicitudId: 0 })
                      fetchSolicitudesPorFlete(fleteId)
                    }}
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

                {solicitudes.length > 0 && (
                  <div>
                    <label className="label">Solicitud Asociada (opcional)</label>
                    <select
                      className="input"
                      value={formData.solicitudId}
                      onChange={(e) =>
                        setFormData({ ...formData, solicitudId: Number(e.target.value) })
                      }
                    >
                      <option value={0}>Sin solicitud asociada</option>
                      {solicitudes.map((solicitud) => (
                        <option key={solicitud.id} value={solicitud.id}>
                          {solicitud.tipoGasto} - ${solicitud.montoSolicitado}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">Archivos Comprobantes</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <label className="btn btn-secondary cursor-pointer">
                      Seleccionar Archivos
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleArchivoChange}
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      PDF, JPG, JPEG, PNG (máximo 10MB por archivo)
                    </p>
                  </div>

                  {formData.archivos.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.archivos.map((archivo, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">{archivo.nombre}</span>
                              <button
                                type="button"
                                onClick={() => handleEliminarArchivo(index)}
                                className="btn btn-xs btn-danger ml-2"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500">{formatFileSize(archivo.tamano)}</p>
                            <input
                              type="text"
                              placeholder="Descripción del archivo (opcional)"
                              className="input input-sm mt-1 w-full"
                              value={archivo.descripcion || ''}
                              onChange={(e) =>
                                handleArchivoDescripcionChange(index, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Notas (opcional)</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Crear Comprobación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Validar */}
      {mostrarModalValidar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Validar Comprobación</h2>
              <button onClick={() => setMostrarModalValidar(false)} className="modal-close">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div className="flex gap-4">
                <button
                  className={`flex-1 p-4 border-2 rounded-lg ${
                    aprobarValidacion
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                  onClick={() => setAprobarValidacion(true)}
                >
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-center font-medium">Aprobar</p>
                </button>
                <button
                  className={`flex-1 p-4 border-2 rounded-lg ${
                    !aprobarValidacion
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                  onClick={() => setAprobarValidacion(false)}
                >
                  <XCircleIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-center font-medium">Rechazar</p>
                </button>
              </div>

              {!aprobarValidacion && (
                <div>
                  <label className="label">Motivo del Rechazo</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Indique el motivo del rechazo..."
                    required
                  />
                </div>
              )}

              <div>
                <label className="label">Notas de Validación (opcional)</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={notasValidacion}
                  onChange={(e) => setNotasValidacion(e.target.value)}
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setMostrarModalValidar(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidar}
                className={`btn ${aprobarValidacion ? 'btn-success' : 'btn-danger'}`}
              >
                {aprobarValidacion ? 'Aprobar Comprobación' : 'Rechazar Comprobación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
