import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import api from '../../lib/api'

interface Cotizacion {
  id: number
  folio: string
  cliente: { nombre: string }
  origen: string
  destino: string
  precioCotizado: number
  utilidadEsperada: number
  margenEsperado: number
  estado: string
  createdAt: string
}

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [filteredCotizaciones, setFilteredCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODAS')

  useEffect(() => {
    fetchCotizaciones()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [cotizaciones, busqueda, filtroEstado])

  const fetchCotizaciones = async () => {
    try {
      const response = await api.get('/cotizaciones')
      setCotizaciones(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let resultado = [...cotizaciones]

    // Filtro por búsqueda (folio o cliente)
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      resultado = resultado.filter(
        (cot) =>
          cot.folio.toLowerCase().includes(termino) ||
          cot.cliente.nombre.toLowerCase().includes(termino) ||
          cot.origen.toLowerCase().includes(termino) ||
          cot.destino.toLowerCase().includes(termino)
      )
    }

    // Filtro por estado
    if (filtroEstado !== 'TODAS') {
      resultado = resultado.filter((cot) => cot.estado === filtroEstado)
    }

    setFilteredCotizaciones(resultado)
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      BORRADOR: 'badge-gray',
      ENVIADA: 'badge-info',
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      CONVERTIDA: 'badge-success',
      CANCELADA: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
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
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500">
            {filteredCotizaciones.length} de {cotizaciones.length} cotizaciones
          </p>
        </div>
        <Link to="/cotizaciones/nueva" className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nueva Cotización
        </Link>
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
              placeholder="Buscar por folio, cliente, origen o destino..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="w-64">
            <label className="label flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              Estado
            </label>
            <select
              className="input"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODAS">Todas</option>
              <option value="BORRADOR">Borrador</option>
              <option value="ENVIADA">Enviada</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
              <option value="CONVERTIDA">Convertida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Ruta</th>
              <th>Precio</th>
              <th>Utilidad</th>
              <th>Margen</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCotizaciones.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  {busqueda || filtroEstado !== 'TODAS'
                    ? 'No se encontraron cotizaciones con los filtros aplicados'
                    : 'No hay cotizaciones registradas'}
                </td>
              </tr>
            ) : (
              filteredCotizaciones.map((cotizacion) => (
                <tr key={cotizacion.id}>
                  <td className="font-medium">{cotizacion.folio}</td>
                  <td>{cotizacion.cliente.nombre}</td>
                  <td className="text-sm text-gray-600">
                    {cotizacion.origen} → {cotizacion.destino}
                  </td>
                  <td>{formatMoney(cotizacion.precioCotizado)}</td>
                  <td
                    className={
                      cotizacion.utilidadEsperada >= 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {formatMoney(cotizacion.utilidadEsperada)}
                  </td>
                  <td>{cotizacion.margenEsperado.toFixed(1)}%</td>
                  <td>
                    <span className={`badge ${getEstadoBadge(cotizacion.estado)}`}>
                      {cotizacion.estado}
                    </span>
                  </td>
                  <td className="text-sm text-gray-500">
                    {new Date(cotizacion.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td>
                    <Link
                      to={`/cotizaciones/${cotizacion.id}`}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
