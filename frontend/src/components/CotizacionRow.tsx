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
}

const CotizacionRow = memo(({ cotizacion, formatMoney, getEstadoBadge }: CotizacionRowProps) => {
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
      <td>
        <Link
          to={`/cotizaciones/${cotizacion.id}`}
          className="text-primary-600 hover:underline text-sm"
        >
          Ver
        </Link>
      </td>
    </tr>
  )
})

CotizacionRow.displayName = 'CotizacionRow'

export default CotizacionRow
