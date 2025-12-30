import { memo } from 'react'
import { Link } from 'react-router-dom'

interface CotizacionRowProps {
  cotizacion: {
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
  formatMoney: (amount: number) => string
  getEstadoBadge: (estado: string) => string
  onDelete?: (id: number) => void
}

const CotizacionRow = memo(({ cotizacion, formatMoney, getEstadoBadge, onDelete }: CotizacionRowProps) => {
  const precioCotizado = Number(cotizacion.precioCotizado) || 0

  return (
    <tr>
      <td className="font-medium">{cotizacion.folio}</td>
      <td>{cotizacion.cliente.nombre}</td>
      <td className="text-sm text-gray-600">
        {cotizacion.origen} → {cotizacion.destino}
      </td>
      <td>{formatMoney(precioCotizado)}</td>
      <td>
        <span className={`badge ${getEstadoBadge(cotizacion.estado)}`}>
          {cotizacion.estado}
        </span>
      </td>
      <td className="text-sm text-gray-500">
        {new Date(cotizacion.createdAt).toLocaleDateString('es-MX')}
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        <Link
          to={`/cotizaciones/${cotizacion.id}`}
          className="text-primary-600 hover:text-primary-900 font-medium"
        >
          Ver
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(cotizacion.id)}
            className="text-red-600 hover:text-red-900 inline-block align-middle"
            title="Eliminar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  )
})

CotizacionRow.displayName = 'CotizacionRow'

export default CotizacionRow
