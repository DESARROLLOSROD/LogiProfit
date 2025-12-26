import { useState } from 'react'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface FilterConfig {
  fechaDesde?: string
  fechaHasta?: string
  clienteId?: number
  margenMin?: number
  margenMax?: number
  precioMin?: number
  precioMax?: number
  estado?: string
}

interface AdvancedFiltersProps {
  onApplyFilters: (filters: FilterConfig) => void
  clientes?: Array<{ id: number; nombre: string }>
  showClientFilter?: boolean
  showMargenFilter?: boolean
  showPrecioFilter?: boolean
  showEstadoFilter?: boolean
  estadoOptions?: Array<{ value: string; label: string }>
}

export default function AdvancedFilters({
  onApplyFilters,
  clientes = [],
  showClientFilter = true,
  showMargenFilter = true,
  showPrecioFilter = true,
  showEstadoFilter = true,
  estadoOptions = [],
}: AdvancedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterConfig>({})

  const handleApply = () => {
    onApplyFilters(filters)
    setShowFilters(false)
  }

  const handleReset = () => {
    setFilters({})
    onApplyFilters({})
  }

  const activeFiltersCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="btn-secondary flex items-center gap-2"
      >
        <FunnelIcon className="w-5 h-5" />
        Filtros Avanzados
        {activeFiltersCount > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-primary-600 text-white rounded-full text-xs">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filtros Avanzados</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Rango de Fechas */}
            <div>
              <label className="label text-sm font-medium text-gray-700">Rango de Fechas</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Desde</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={filters.fechaDesde || ''}
                    onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Hasta</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={filters.fechaHasta || ''}
                    onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Filtro por Cliente */}
            {showClientFilter && clientes.length > 0 && (
              <div>
                <label className="label text-sm font-medium text-gray-700">Cliente</label>
                <select
                  className="input text-sm"
                  value={filters.clienteId || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, clienteId: e.target.value ? Number(e.target.value) : undefined })
                  }
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Estado */}
            {showEstadoFilter && estadoOptions.length > 0 && (
              <div>
                <label className="label text-sm font-medium text-gray-700">Estado</label>
                <select
                  className="input text-sm"
                  value={filters.estado || ''}
                  onChange={(e) => setFilters({ ...filters, estado: e.target.value || undefined })}
                >
                  <option value="">Todos los estados</option>
                  {estadoOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rango de Margen */}
            {showMargenFilter && (
              <div>
                <label className="label text-sm font-medium text-gray-700">Margen (%)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Mínimo</label>
                    <input
                      type="number"
                      className="input text-sm"
                      placeholder="0"
                      min="0"
                      max="100"
                      value={filters.margenMin || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, margenMin: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Máximo</label>
                    <input
                      type="number"
                      className="input text-sm"
                      placeholder="100"
                      min="0"
                      max="100"
                      value={filters.margenMax || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, margenMax: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Rango de Precio */}
            {showPrecioFilter && (
              <div>
                <label className="label text-sm font-medium text-gray-700">Precio (MXN)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Mínimo</label>
                    <input
                      type="number"
                      className="input text-sm"
                      placeholder="0"
                      min="0"
                      step="1000"
                      value={filters.precioMin || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, precioMin: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Máximo</label>
                    <input
                      type="number"
                      className="input text-sm"
                      placeholder="1000000"
                      min="0"
                      step="1000"
                      value={filters.precioMax || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, precioMax: e.target.value ? Number(e.target.value) : undefined })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <button onClick={handleReset} className="btn-secondary flex-1">
              Limpiar
            </button>
            <button onClick={handleApply} className="btn-primary flex-1">
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
