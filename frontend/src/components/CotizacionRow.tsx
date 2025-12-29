import { memo } from 'react'
import { Link } from 'react-router-dom'

interface CotizacionRowProps {
  cotizacion: {
    id: number
    folio: string
    cliente: { id: number; nombre: string }
    origen: string
    destino: string
    precioCotizado: number
    utilidadEsperada: number
    margenEsperado: number
    estado: string
    createdAt: string
  }
  formatMoney: (amount: number) => string
  getEstadoBadge: (estado: string) => string
}

const CotizacionRow = memo(({ cotizacion, formatMoney, getEstadoBadge }: CotizacionRowProps) => {
  // Convertir valores Decimal a números con validación
  const precioCotizado = Number(cotizacion.precioCotizado) || 0
  const utilidadEsperada = Number(cotizacion.utilidadEsperada) || 0
  const margenEsperado = Number(cotizacion.margenEsperado) || 0

  return (
    <tr>
      <td className="font-medium">{cotizacion.folio}</td>
      <td>{cotizacion.cliente.nombre}</td>
      <td className="text-sm text-gray-600">
        {cotizacion.origen} → {cotizacion.destino}
      </td>
      <td>{formatMoney(precioCotizado)}</td>
      <td className={utilidadEsperada >= 0 ? 'text-green-600' : 'text-red-600'}>
        {formatMoney(utilidadEsperada)}
      </td>
      <td>{isNaN(margenEsperado) ? '0.0' : margenEsperado.toFixed(1)}%</td>
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
