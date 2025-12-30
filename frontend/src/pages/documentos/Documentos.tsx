import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Pagination from '../../components/Pagination'

interface Documento {
  id: number
  camionId: number
  tipo: string
  numero?: string
  archivoUrl: string
  nombreArchivo: string
  fechaEmision: string
  fechaVencimiento: string
  estado: string
  notas?: string
  camion: {
    numeroEconomico: string
    placas: string
  }
}

interface Camion {
  id: number
  numeroEconomico: string
  placas: string
}

export default function Documentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroCamion, setFiltroCamion] = useState('TODOS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroTipo, setFiltroTipo] = useState('TODOS')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    vigentes: 0,
    porVencer: 0,
    vencidos: 0,
  })

  // Formulario
  const [formData, setFormData] = useState({
    camionId: 0,
    tipo: 'TARJETA_CIRCULACION',
    numero: '',
    fechaEmision: '',
    fechaVencimiento: '',
    notas: '',
  })
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [docsRes, camionesRes, statsRes] = await Promise.all([
        api.get('/documentos'),
        api.get('/camiones'),
        api.get('/documentos/estadisticas'),
      ])

      setDocumentos(docsRes.data)
      setCamiones(camionesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!archivo) {
      toast.error('Debe seleccionar un archivo')
      return
    }

    if (formData.camionId === 0) {
      toast.error('Debe seleccionar un vehículo')
      return
    }

    try {
      setGuardando(true)

      const formDataToSend = new FormData()
      formDataToSend.append('camionId', formData.camionId.toString())
      formDataToSend.append('tipo', formData.tipo)
      if (formData.numero) formDataToSend.append('numero', formData.numero)
      formDataToSend.append('fechaEmision', formData.fechaEmision)
      formDataToSend.append('fechaVencimiento', formData.fechaVencimiento)
      if (formData.notas) formDataToSend.append('notas', formData.notas)
      formDataToSend.append('archivo', archivo)

      await api.post('/documentos', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Documento registrado correctamente')
      setMostrarFormulario(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar documento')
    } finally {
      setGuardando(false)
    }
  }

  const resetForm = () => {
    setFormData({
      camionId: 0,
      tipo: 'TARJETA_CIRCULACION',
      numero: '',
      fechaEmision: '',
      fechaVencimiento: '',
      notas: '',
    })
    setArchivo(null)
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      VIGENTE: 'badge-success',
      POR_VENCER: 'badge-warning',
      VENCIDO: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      TARJETA_CIRCULACION: 'Tarjeta de Circulación',
      SEGURO: 'Seguro',
      VERIFICACION: 'Verificación',
      PERMISO_SCT: 'Permiso SCT',
      POLIZA_SEGURO: 'Póliza de Seguro',
      OTRO: 'Otro',
    }
    return labels[tipo] || tipo
  }

  const calcularDiasRestantes = (fechaVencimiento: string) => {
    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diff = vencimiento.getTime() - hoy.getTime()
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return dias
  }

  // Filtrar documentos
  const documentosFiltrados = documentos.filter((d) => {
    const matchBusqueda =
      d.camion.numeroEconomico.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.camion.placas.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
      ''

    const matchCamion = filtroCamion === 'TODOS' || d.camionId.toString() === filtroCamion
    const matchEstado = filtroEstado === 'TODOS' || d.estado === filtroEstado
    const matchTipo = filtroTipo === 'TODOS' || d.tipo === filtroTipo

    return matchBusqueda && matchCamion && matchEstado && matchTipo
  })

  // Paginación
  const totalPaginas = Math.ceil(documentosFiltrados.length / itemsPorPagina)
  const indexInicio = (paginaActual - 1) * itemsPorPagina
  const indexFin = indexInicio + itemsPorPagina
  const documentosPaginados = documentosFiltrados.slice(indexInicio, indexFin)

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
          <h1 className="text-2xl font-bold text-gray-900">Documentos de Vehículos</h1>
          <p className="text-gray-500">{documentos.length} documentos registrados</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Documento
        </button>
      </div>

      {/* Alertas de documentos por vencer o vencidos */}
      {(stats.porVencer > 0 || stats.vencidos > 0) && (
        <div className="mb-6 space-y-3">
          {stats.vencidos > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">
                  {stats.vencidos} documento{stats.vencidos > 1 ? 's' : ''} vencido
                  {stats.vencidos > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-red-700">Requieren renovación inmediata</p>
              </div>
            </div>
          )}
          {stats.porVencer > 0 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-900">
                  {stats.porVencer} documento{stats.porVencer > 1 ? 's' : ''} por vencer
                </p>
                <p className="text-sm text-yellow-700">Vencen en los próximos 30 días</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Documentos</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Vigentes</p>
          <p className="text-2xl font-bold text-green-600">{stats.vigentes}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Por Vencer</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.porVencer}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Vencidos</p>
          <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label flex items-center gap-2">
              <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
              Buscar
            </label>
            <input
              type="text"
              className="input"
              placeholder="Buscar por económico, placas, número..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              Vehículo
            </label>
            <select className="input" value={filtroCamion} onChange={(e) => setFiltroCamion(e.target.value)}>
              <option value="TODOS">Todos</option>
              {camiones.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.numeroEconomico} - {c.placas}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              Tipo
            </label>
            <select className="input" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="TARJETA_CIRCULACION">Tarjeta de Circulación</option>
              <option value="SEGURO">Seguro</option>
              <option value="VERIFICACION">Verificación</option>
              <option value="PERMISO_SCT">Permiso SCT</option>
              <option value="POLIZA_SEGURO">Póliza de Seguro</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              Estado
            </label>
            <select className="input" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="POR_VENCER">Por Vencer</option>
              <option value="VENCIDO">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Documentos */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Tipo</th>
              <th>Número</th>
              <th>Emisión</th>
              <th>Vencimiento</th>
              <th>Días Restantes</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documentosPaginados.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No se encontraron documentos
                </td>
              </tr>
            ) : (
              documentosPaginados.map((doc) => {
                const diasRestantes = calcularDiasRestantes(doc.fechaVencimiento)
                return (
                  <tr key={doc.id}>
                    <td>
                      <div className="font-medium">{doc.camion.numeroEconomico}</div>
                      <div className="text-sm text-gray-500">{doc.camion.placas}</div>
                    </td>
                    <td>{getTipoLabel(doc.tipo)}</td>
                    <td className="text-sm text-gray-600">{doc.numero || '-'}</td>
                    <td className="text-sm text-gray-500">
                      {new Date(doc.fechaEmision).toLocaleDateString('es-MX')}
                    </td>
                    <td className="text-sm text-gray-500">
                      {new Date(doc.fechaVencimiento).toLocaleDateString('es-MX')}
                    </td>
                    <td>
                      <span
                        className={`font-medium ${
                          diasRestantes < 0
                            ? 'text-red-600'
                            : diasRestantes <= 30
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {diasRestantes < 0 ? `${Math.abs(diasRestantes)} días vencido` : `${diasRestantes} días`}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getEstadoBadge(doc.estado)}`}>
                        {doc.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <a
                        href={doc.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Ver archivo
                      </a>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <Pagination
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalItems={documentosFiltrados.length}
        itemsPorPagina={itemsPorPagina}
        onCambiarPagina={setPaginaActual}
      />

      {/* Modal Formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Registrar Documento</h2>
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
                <label className="label">Vehículo *</label>
                <select
                  className="input"
                  value={formData.camionId}
                  onChange={(e) => setFormData({ ...formData, camionId: parseInt(e.target.value) })}
                  required
                >
                  <option value={0}>Seleccionar vehículo...</option>
                  {camiones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numeroEconomico} - {c.placas}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Tipo de Documento *</label>
                <select
                  className="input"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  required
                >
                  <option value="TARJETA_CIRCULACION">Tarjeta de Circulación</option>
                  <option value="SEGURO">Seguro</option>
                  <option value="VERIFICACION">Verificación</option>
                  <option value="PERMISO_SCT">Permiso SCT</option>
                  <option value="POLIZA_SEGURO">Póliza de Seguro</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div>
                <label className="label">Número de Documento</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: ABC123456"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha de Emisión *</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.fechaEmision}
                    onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Fecha de Vencimiento *</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Archivo del Documento *
                </label>
                <input
                  type="file"
                  className="input"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">PDF, JPG o PNG (máx. 10MB)</p>
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Notas adicionales..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar Documento'}
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
    </div>
  )
}
