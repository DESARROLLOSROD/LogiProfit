import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import api from '../../lib/api'

interface Flete {
  id: number
  folio: string
  cliente: { nombre: string }
  origen: string
  destino: string
  precioCliente: number
  estado: string
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

  useEffect(() => {
    fetchFletes()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [fletes, busqueda, filtroEstado])

  const fetchFletes = async () => {
    try {
      const response = await api.get('/fletes')
      setFletes(response.data)
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

    setFilteredFletes(resultado)
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  const calcularUtilidad = (flete: Flete) => {
    const totalGastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0)
    return Number(flete.precioCliente) - totalGastos
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
              <th>Folio</th>
              <th>Cliente</th>
              <th>Ruta</th>
              <th>Precio</th>
              <th>Gastos</th>
              <th>Utilidad</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFletes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {busqueda || filtroEstado !== 'TODOS'
                    ? 'No se encontraron fletes con los filtros aplicados'
                    : 'No hay fletes registrados'}
                </td>
              </tr>
            ) : (
              filteredFletes.map((flete) => {
                const totalGastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0)
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
                      {flete.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/fletes/${flete.id}`}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Ver detalle
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
