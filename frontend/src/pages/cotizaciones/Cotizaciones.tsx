import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import api from '../../lib/api'
import Pagination from '../../components/Pagination'
import { exportarCotizacionesAExcel } from '../../lib/excelExport'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'

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

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  // Ordenamiento
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'folio' | 'precio' | 'margen'>('fecha')
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('desc')

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

    // Ordenamiento
    resultado.sort((a, b) => {
      let compareValue = 0

      switch (ordenarPor) {
        case 'fecha':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'folio':
          compareValue = a.folio.localeCompare(b.folio)
          break
        case 'precio':
          compareValue = a.precioCotizado - b.precioCotizado
          break
        case 'margen':
          compareValue = a.margenEsperado - b.margenEsperado
          break
      }

      return ordenDireccion === 'asc' ? compareValue : -compareValue
    })

    setFilteredCotizaciones(resultado)
    setPaginaActual(1) // Reset a página 1 cuando cambian filtros
  }

  const toggleOrden = (campo: 'fecha' | 'folio' | 'precio' | 'margen') => {
    if (ordenarPor === campo) {
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenarPor(campo)
      setOrdenDireccion('desc')
    }
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

  // Paginación
  const totalPaginas = Math.ceil(filteredCotizaciones.length / itemsPorPagina)
  const indexInicio = (paginaActual - 1) * itemsPorPagina
  const indexFin = indexInicio + itemsPorPagina
  const cotizacionesPaginadas = filteredCotizaciones.slice(indexInicio, indexFin)

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
        <div className="flex gap-3">
          <button
            onClick={() => exportarCotizacionesAExcel(filteredCotizaciones)}
            className="btn-secondary flex items-center gap-2"
            disabled={filteredCotizaciones.length === 0}
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Exportar Excel
          </button>
          <Link to="/cotizaciones/nueva" className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            Nueva Cotización
          </Link>
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
              <th
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => toggleOrden('folio')}
              >
                <div className="flex items-center gap-1">
                  Folio
                  {ordenarPor === 'folio' &&
                    (ordenDireccion === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    ))}
                </div>
              </th>
              <th>Cliente</th>
              <th>Ruta</th>
              <th
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => toggleOrden('precio')}
              >
                <div className="flex items-center gap-1">
                  Precio
                  {ordenarPor === 'precio' &&
                    (ordenDireccion === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    ))}
                </div>
              </th>
              <th>Utilidad</th>
              <th
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => toggleOrden('margen')}
              >
                <div className="flex items-center gap-1">
                  Margen
                  {ordenarPor === 'margen' &&
                    (ordenDireccion === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    ))}
                </div>
              </th>
              <th>Estado</th>
              <th
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => toggleOrden('fecha')}
              >
                <div className="flex items-center gap-1">
                  Fecha
                  {ordenarPor === 'fecha' &&
                    (ordenDireccion === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    ))}
                </div>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cotizacionesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  {busqueda || filtroEstado !== 'TODAS'
                    ? 'No se encontraron cotizaciones con los filtros aplicados'
                    : 'No hay cotizaciones registradas'}
                </td>
              </tr>
            ) : (
              cotizacionesPaginadas.map((cotizacion) => (
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

      {/* Paginación */}
      <Pagination
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        totalItems={filteredCotizaciones.length}
        itemsPorPagina={itemsPorPagina}
        onCambiarPagina={setPaginaActual}
      />
    </div>
  )
}
