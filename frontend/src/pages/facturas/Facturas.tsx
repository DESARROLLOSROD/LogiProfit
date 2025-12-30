import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Pagination from '../../components/Pagination'

interface Factura {
  id: number
  numero: string
  serie?: string
  uuid: string
  fechaEmision: string
  fechaVencimiento?: string
  total: number
  estadoPago: string
  flete: {
    id: number
    folio: string
    cliente: {
      nombre: string
    }
  }
}

interface FletePendiente {
  id: number
  folio: string
  cliente: { nombre: string }
  precioCliente: number
  estado: string
  fechaFin: string
}

export default function Facturas() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [fletesPendientes, setFletesPendientes] = useState<FletePendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [vistaActual, setVistaActual] = useState<'facturas' | 'pendientes'>('facturas')

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
    pagadas: 0,
    vencidas: 0,
    montoPendiente: 0,
    montoPagado: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [facturasRes, pendientesRes, statsRes] = await Promise.all([
        api.get('/facturas'),
        api.get('/facturas/pendientes-facturacion'),
        api.get('/facturas/estadisticas'),
      ])

      setFacturas(facturasRes.data)
      setFletesPendientes(pendientesRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstadoPago = async (facturaId: number, nuevoEstado: string) => {
    try {
      await api.patch(`/facturas/${facturaId}/estado-pago`, {
        estadoPago: nuevoEstado,
      })
      toast.success('Estado actualizado correctamente')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar')
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      PENDIENTE: 'badge-warning',
      PAGADA_PARCIAL: 'badge-info',
      PAGADA: 'badge-success',
      VENCIDA: 'badge-danger',
      CANCELADA: 'badge-gray',
    }
    return badges[estado] || 'badge-gray'
  }

  // Filtrar facturas
  const facturasFiltradas = facturas.filter((f) => {
    const matchBusqueda =
      f.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.uuid.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.flete.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
      f.flete.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())

    const matchEstado = filtroEstado === 'TODOS' || f.estadoPago === filtroEstado

    return matchBusqueda && matchEstado
  })

  // Paginación
  const totalPaginas = Math.ceil(facturasFiltradas.length / itemsPorPagina)
  const indexInicio = (paginaActual - 1) * itemsPorPagina
  const indexFin = indexInicio + itemsPorPagina
  const facturasPaginadas = facturasFiltradas.slice(indexInicio, indexFin)

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
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500">
            {facturas.length} facturas | {fletesPendientes.length} pendientes
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Facturas</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold text-warning-600">{stats.pendientes}</p>
          <p className="text-sm text-gray-500 mt-1">{formatMoney(stats.montoPendiente)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Pagadas</p>
          <p className="text-2xl font-bold text-green-600">{stats.pagadas}</p>
          <p className="text-sm text-gray-500 mt-1">{formatMoney(stats.montoPagado)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Vencidas</p>
          <p className="text-2xl font-bold text-red-600">{stats.vencidas}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setVistaActual('facturas')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            vistaActual === 'facturas'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Facturas ({facturas.length})
        </button>
        <button
          onClick={() => setVistaActual('pendientes')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            vistaActual === 'pendientes'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Fletes Pendientes ({fletesPendientes.length})
        </button>
      </div>

      {vistaActual === 'facturas' ? (
        <>
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
                  placeholder="Buscar por número, UUID, folio o cliente..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="w-64">
                <label className="label flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-gray-500" />
                  Estado de Pago
                </label>
                <select
                  className="input"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="PAGADA_PARCIAL">Pagada Parcial</option>
                  <option value="PAGADA">Pagada</option>
                  <option value="VENCIDA">Vencida</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de Facturas */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Flete</th>
                  <th>Cliente</th>
                  <th>Fecha Emisión</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {facturasPaginadas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron facturas
                    </td>
                  </tr>
                ) : (
                  facturasPaginadas.map((factura) => (
                    <tr key={factura.id}>
                      <td className="font-medium">
                        {factura.serie ? `${factura.serie}-` : ''}
                        {factura.numero}
                      </td>
                      <td>
                        <Link
                          to={`/fletes/${factura.flete.id}`}
                          className="text-primary-600 hover:underline"
                        >
                          {factura.flete.folio}
                        </Link>
                      </td>
                      <td>{factura.flete.cliente.nombre}</td>
                      <td className="text-sm text-gray-500">
                        {new Date(factura.fechaEmision).toLocaleDateString('es-MX')}
                      </td>
                      <td className="font-semibold">{formatMoney(factura.total)}</td>
                      <td>
                        <span className={`badge ${getEstadoBadge(factura.estadoPago)}`}>
                          {factura.estadoPago.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {factura.estadoPago === 'PENDIENTE' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => cambiarEstadoPago(factura.id, 'PAGADA')}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Marcar como pagada"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => cambiarEstadoPago(factura.id, 'VENCIDA')}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Marcar como vencida"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </div>
                        )}
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
            totalItems={facturasFiltradas.length}
            itemsPorPagina={itemsPorPagina}
            onCambiarPagina={setPaginaActual}
          />
        </>
      ) : (
        /* Vista de Fletes Pendientes */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha Fin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fletesPendientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No hay fletes pendientes de facturación
                  </td>
                </tr>
              ) : (
                fletesPendientes.map((flete) => (
                  <tr key={flete.id}>
                    <td className="font-medium">{flete.folio}</td>
                    <td>{flete.cliente.nombre}</td>
                    <td className="font-semibold">{formatMoney(flete.precioCliente)}</td>
                    <td>
                      <span className="badge badge-success">{flete.estado}</span>
                    </td>
                    <td className="text-sm text-gray-500">
                      {flete.fechaFin ? new Date(flete.fechaFin).toLocaleDateString('es-MX') : '-'}
                    </td>
                    <td>
                      <Link
                        to={`/fletes/${flete.id}`}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Ver flete
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
