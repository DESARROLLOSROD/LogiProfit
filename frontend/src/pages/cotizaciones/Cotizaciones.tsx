import { useEffect, useState, useMemo, useCallback } from 'react'
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
import AdvancedFilters, { FilterConfig } from '../../components/AdvancedFilters'
import CotizacionRow from '../../components/CotizacionRow'
import { useDebounce } from '../../hooks/useDebounce'

interface Cotizacion {
  id: number
  folio: string
  cliente: { id: number; nombre: string }
  origen: string
  destino: string
  kmEstimado: number
  precioCotizado: number
  estado: string
  createdAt: string
}

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Array<{ id: number; nombre: string }>>([])

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const debouncedBusqueda = useDebounce(busqueda, 300)
  const [filtroEstado, setFiltroEstado] = useState('TODAS')
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({})

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  // Ordenamiento
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'folio' | 'precio'>('fecha')
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const fetchCotizaciones = async () => {
      try {
        const response = await api.get(`/cotizaciones?t=${Date.now()}`)
        // El backend ya convierte campos Decimal a números
        setCotizaciones(response.data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchClientes = async () => {
      try {
        const response = await api.get('/clientes')
        setClientes(response.data)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchCotizaciones()
    fetchClientes()
  }, [])

  // Memoizar cotizaciones filtradas y ordenadas
  const filteredCotizaciones = useMemo(() => {
    let resultado = [...cotizaciones]

    // Filtro por búsqueda (folio o cliente) - usando debounced
    if (debouncedBusqueda) {
      const termino = debouncedBusqueda.toLowerCase()
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

    // Filtros avanzados - Rango de fechas
    if (advancedFilters.fechaDesde) {
      const fechaDesde = new Date(advancedFilters.fechaDesde).getTime()
      resultado = resultado.filter((cot) => new Date(cot.createdAt).getTime() >= fechaDesde)
    }
    if (advancedFilters.fechaHasta) {
      const fechaHasta = new Date(advancedFilters.fechaHasta).getTime()
      resultado = resultado.filter((cot) => new Date(cot.createdAt).getTime() <= fechaHasta)
    }

    // Filtro por cliente
    if (advancedFilters.clienteId) {
      resultado = resultado.filter((cot) => cot.cliente.id === advancedFilters.clienteId)
    }

    // Filtro por precio
    if (advancedFilters.precioMin !== undefined) {
      resultado = resultado.filter((cot) => cot.precioCotizado >= advancedFilters.precioMin!)
    }
    if (advancedFilters.precioMax !== undefined) {
      resultado = resultado.filter((cot) => cot.precioCotizado <= advancedFilters.precioMax!)
    }

    // Filtro por estado avanzado
    if (advancedFilters.estado) {
      resultado = resultado.filter((cot) => cot.estado === advancedFilters.estado)
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
      }

      return ordenDireccion === 'asc' ? compareValue : -compareValue
    })

    return resultado
  }, [cotizaciones, debouncedBusqueda, filtroEstado, advancedFilters, ordenarPor, ordenDireccion])

  const toggleOrden = useCallback((campo: 'fecha' | 'folio' | 'precio') => {
    if (ordenarPor === campo) {
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenarPor(campo)
      setOrdenDireccion('desc')
    }
  }, [ordenarPor, ordenDireccion])

  const formatMoney = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }, [])

  const getEstadoBadge = useCallback((estado: string) => {
    const badges: Record<string, string> = {
      BORRADOR: 'badge-gray',
      ENVIADA: 'badge-info',
      APROBADA: 'badge-success',
      RECHAZADA: 'badge-danger',
      CONVERTIDA: 'badge-success',
      CANCELADA: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
  }, [])

  // Paginación - Memoizar valores derivados
  const totalPaginas = useMemo(
    () => Math.ceil(filteredCotizaciones.length / itemsPorPagina),
    [filteredCotizaciones.length, itemsPorPagina]
  )

  const cotizacionesPaginadas = useMemo(() => {
    const indexInicio = (paginaActual - 1) * itemsPorPagina
    const indexFin = indexInicio + itemsPorPagina
    return filteredCotizaciones.slice(indexInicio, indexFin)
  }, [filteredCotizaciones, paginaActual, itemsPorPagina])

  // Reset pagination cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1)
  }, [debouncedBusqueda, filtroEstado, advancedFilters])

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
          <div className="w-48">
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
          <div>
            <AdvancedFilters
              onApplyFilters={setAdvancedFilters}
              clientes={clientes}
              estadoOptions={[
                { value: 'BORRADOR', label: 'Borrador' },
                { value: 'ENVIADA', label: 'Enviada' },
                { value: 'APROBADA', label: 'Aprobada' },
                { value: 'RECHAZADA', label: 'Rechazada' },
                { value: 'CONVERTIDA', label: 'Convertida' },
                { value: 'CANCELADA', label: 'Cancelada' },
              ]}
            />
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
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  {busqueda || filtroEstado !== 'TODAS'
                    ? 'No se encontraron cotizaciones con los filtros aplicados'
                    : 'No hay cotizaciones registradas'}
                </td>
              </tr>
            ) : (
              cotizacionesPaginadas.map((cotizacion) => (
                <CotizacionRow
                  key={cotizacion.id}
                  cotizacion={cotizacion}
                  formatMoney={formatMoney}
                  getEstadoBadge={getEstadoBadge}
                />
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
