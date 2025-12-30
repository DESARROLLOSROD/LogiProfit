import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Pagination from '../../components/Pagination'
import { exportarFletesAExcel } from '../../lib/excelExport'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { checkFleteUrgentes, checkFletesPerdida } from '../../lib/notifications'

interface Flete {
  id: number
  folio: string
  cliente: { nombre: string }
  origen: string
  destino: string
  precioCliente: number
  estado?: string
  fechaInicio?: string
  gastos: Array<{ monto: number }>
}

export default function Fletes() {
  const [fletes, setFletes] = useState<Flete[]>([])
  const [filteredFletes, setFilteredFletes] = useState<Flete[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  // Ordenamiento
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'folio' | 'precio'>('fecha')
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchFletes()

    // Verificar fletes urgentes cada 10 minutos
    const interval = setInterval(() => {
      if (fletes.length > 0) {
        checkFleteUrgentes(fletes)
        checkFletesPerdida(fletes)
      }
    }, 10 * 60 * 1000) // 10 minutos

    return () => clearInterval(interval)
  }, [fletes])

  useEffect(() => {
    aplicarFiltros()
  }, [fletes, busqueda, filtroEstado])

  const fetchFletes = async () => {
    try {
      const response = await api.get('/fletes')

      // Convertir campos Decimal de Prisma (vienen como strings) a números
      const fletesConvertidos = response.data.map((flete: any) => ({
        ...flete,
        precioCliente: Number(flete.precioCliente) || 0,
        gastos: flete.gastos.map((gasto: any) => ({
          ...gasto,
          monto: Number(gasto.monto) || 0,
        })),
      }))

      setFletes(fletesConvertidos)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let resultado = [...fletes]

    // Filtro por búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase()
      resultado = resultado.filter(
        (flete) =>
          flete.folio.toLowerCase().includes(termino) ||
          flete.cliente.nombre.toLowerCase().includes(termino) ||
          flete.origen.toLowerCase().includes(termino) ||
          flete.destino.toLowerCase().includes(termino)
      )
    }

    // Filtro por estado
    if (filtroEstado !== 'TODOS') {
      resultado = resultado.filter((flete) => flete.estado === filtroEstado)
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      let compareValue = 0

      switch (ordenarPor) {
        case 'fecha':
          const fechaA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0
          const fechaB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0
          compareValue = fechaA - fechaB
          break
        case 'folio':
          compareValue = a.folio.localeCompare(b.folio)
          break
        case 'precio':
          compareValue = a.precioCliente - b.precioCliente
          break
      }

      return ordenDireccion === 'asc' ? compareValue : -compareValue
    })

    setFilteredFletes(resultado)
    setPaginaActual(1)
  }

  const toggleOrden = (campo: 'fecha' | 'folio' | 'precio') => {
    if (ordenarPor === campo) {
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')
    } else {
      setOrdenarPor(campo)
      setOrdenDireccion('desc')
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const calcularUtilidad = (flete: Flete) => {
    const gastosArray = Array.isArray(flete.gastos) ? flete.gastos : []
    const totalGastos = gastosArray.reduce((sum, g) => sum + (Number(g.monto) || 0), 0)
    return Number(flete.precioCliente || 0) - totalGastos
  }

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      PLANEADO: 'badge-gray',
      EN_CURSO: 'badge-info',
      COMPLETADO: 'badge-success',
      CERRADO: 'badge-success',
      CANCELADO: 'badge-danger',
    }
    return badges[estado] || 'badge-gray'
  }

  const puedeEliminar = (estado: string | undefined) => {
    if (!estado) return false
    return estado === 'PLANEADO' || estado === 'CANCELADO'
  }

  const eliminarFlete = async (flete: Flete) => {
    if (!puedeEliminar(flete.estado)) {
      toast.error(
        `No se puede eliminar un flete en estado ${flete.estado}. Solo se pueden eliminar fletes en PLANEADO o CANCELADO.`
      )
      return
    }

    if (!confirm(`¿Estás seguro de eliminar el flete ${flete.folio}?`)) {
      return
    }

    try {
      await api.delete(`/fletes/${flete.id}`)
      toast.success('Flete eliminado correctamente')
      fetchFletes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar')
    }
  }

  // Paginación
  const totalPaginas = Math.ceil(filteredFletes.length / itemsPorPagina)
  const indexInicio = (paginaActual - 1) * itemsPorPagina
  const indexFin = indexInicio + itemsPorPagina
  const fletesPaginados = filteredFletes.slice(indexInicio, indexFin)

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
          <h1 className="text-2xl font-bold text-gray-900">Fletes</h1>
          <p className="text-gray-500">
            {filteredFletes.length} de {fletes.length} fletes
          </p>
        </div>
        <button
          onClick={() => exportarFletesAExcel(filteredFletes)}
          className="btn-secondary flex items-center gap-2"
          disabled={filteredFletes.length === 0}
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Exportar Excel
        </button>
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
              <option value="TODOS">Todos</option>
              <option value="PLANEADO">Planeado</option>
              <option value="EN_CURSO">En Curso</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CERRADO">Cerrado</option>
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
              <th className="cursor-pointer hover:bg-gray-100" onClick={() => toggleOrden('folio')}>
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
              <th className="cursor-pointer hover:bg-gray-100" onClick={() => toggleOrden('precio')}>
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
              <th>Gastos</th>
              <th>Utilidad</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fletesPaginados.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {busqueda || filtroEstado !== 'TODOS'
                    ? 'No se encontraron fletes con los filtros aplicados'
                    : 'No hay fletes registrados'}
                </td>
              </tr>
            ) : (
              fletesPaginados.map((flete) => {
                const gastosArray = Array.isArray(flete.gastos) ? flete.gastos : []
                const totalGastos = gastosArray.reduce((sum, g) => sum + (Number(g.monto) || 0), 0)
                const utilidad = calcularUtilidad(flete)
                return (
                <tr key={flete.id}>
                  <td className="font-medium">{flete.folio}</td>
                  <td>{flete.cliente.nombre}</td>
                  <td className="text-sm text-gray-500">
                    {flete.origen} → {flete.destino}
                  </td>
                  <td>{formatMoney(flete.precioCliente)}</td>
                  <td className="text-red-600">{formatMoney(totalGastos)}</td>
                  <td className={utilidad >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {formatMoney(utilidad)}
                  </td>
                  <td>
                    <span className={`badge ${getEstadoBadge(flete.estado)}`}>
                      {flete.estado ? flete.estado.replace('_', ' ') : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/fletes/${flete.id}`}
                        className="text-primary-600 hover:underline text-sm"
                      >
                        Ver detalle
                      </Link>
                      {puedeEliminar(flete.estado) && (
                        <button
                          onClick={() => eliminarFlete(flete)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar flete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
        totalItems={filteredFletes.length}
        itemsPorPagina={itemsPorPagina}
        onCambiarPagina={setPaginaActual}
      />
    </div>
  )
}
