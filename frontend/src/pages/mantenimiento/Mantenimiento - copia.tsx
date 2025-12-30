import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import api from '../../lib/api'

interface Mantenimiento {
  id: number
  camion: {
    id: number
    placas: string
    numeroEconomico: string | null
    tipo: string
  }
  tipo: string
  descripcion: string
  kmProgramado: number | null
  fechaProgramada: string | null
  kmRealizado: number | null
  fechaRealizado: string | null
  costo: number | null
  proveedor: string | null
  estado: string
  createdAt: string
}

export default function Mantenimiento() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  useEffect(() => {
    fetchMantenimientos()
  }, [])

  const fetchMantenimientos = async () => {
    try {
      const response = await api.get('/mantenimiento')
      setMantenimientos(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMantenimientos = useMemo(() => {
    if (filtroEstado === 'TODOS') return mantenimientos
    return mantenimientos.filter((m) => m.estado === filtroEstado)
  }, [mantenimientos, filtroEstado])

  const stats = useMemo(() => {
    return {
      pendientes: mantenimientos.filter((m) => m.estado === 'PENDIENTE').length,
      enProceso: mantenimientos.filter((m) => m.estado === 'EN_PROCESO').length,
      completados: mantenimientos.filter((m) => m.estado === 'COMPLETADO').length,
      cancelados: mantenimientos.filter((m) => m.estado === 'CANCELADO').length,
    }
  }, [mantenimientos])

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; icon: any }> = {
      PENDIENTE: { class: 'badge-warning', icon: ClockIcon },
      EN_PROCESO: { class: 'badge-info', icon: WrenchScrewdriverIcon },
      COMPLETADO: { class: 'badge-success', icon: CheckCircleIcon },
      CANCELADO: { class: 'badge-danger', icon: XCircleIcon },
    }
    return badges[estado] || { class: 'badge-gray', icon: ClockIcon }
  }

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      PREVENTIVO: 'Preventivo',
      CORRECTIVO: 'Correctivo',
      CAMBIO_ACEITE: 'Cambio de Aceite',
      CAMBIO_LLANTAS: 'Cambio de Llantas',
      FRENOS: 'Frenos',
      SUSPENSION: 'Suspensión',
      ELECTRICO: 'Eléctrico',
      TRANSMISION: 'Transmisión',
      MOTOR: 'Motor',
      OTRO: 'Otro',
    }
    return tipos[tipo] || tipo
  }

  const formatMoney = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-gray-500">{filteredMantenimientos.length} mantenimientos</p>
        </div>
        <Link to="/mantenimiento/nuevo" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Programar Mantenimiento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.pendientes}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">En Proceso</p>
              <p className="text-2xl font-bold text-blue-700">{stats.enProceso}</p>
            </div>
            <WrenchScrewdriverIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Completados</p>
              <p className="text-2xl font-bold text-green-700">{stats.completados}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Cancelados</p>
              <p className="text-2xl font-bold text-red-700">{stats.cancelados}</p>
            </div>
            <XCircleIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="w-48">
            <label className="label">Estado</label>
            <select
              className="input"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Camión</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Fecha Programada</th>
              <th>KM Programado</th>
              <th>Costo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMantenimientos.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {filtroEstado !== 'TODOS'
                    ? `No hay mantenimientos ${filtroEstado.toLowerCase()}`
                    : 'No hay mantenimientos programados'}
                </td>
              </tr>
            ) : (
              filteredMantenimientos.map((mant) => {
                const badge = getEstadoBadge(mant.estado)
                const Icon = badge.icon
                return (
                  <tr key={mant.id}>
                    <td>
                      <div>
                        <div className="font-medium">{mant.camion.placas}</div>
                        {mant.camion.numeroEconomico && (
                          <div className="text-sm text-gray-500">
                            #{mant.camion.numeroEconomico}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{getTipoLabel(mant.tipo)}</span>
                    </td>
                    <td className="text-sm">{mant.descripcion}</td>
                    <td>
                      {mant.fechaProgramada
                        ? new Date(mant.fechaProgramada).toLocaleDateString('es-MX')
                        : '-'}
                    </td>
                    <td>
                      {mant.kmProgramado ? `${mant.kmProgramado.toLocaleString()} km` : '-'}
                    </td>
                    <td>{formatMoney(mant.costo)}</td>
                    <td>
                      <span className={`badge ${badge.class} flex items-center gap-1 w-fit`}>
                        <Icon className="w-4 h-4" />
                        {mant.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/mantenimiento/${mant.id}`}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
