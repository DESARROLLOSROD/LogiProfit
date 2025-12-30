import { useState, useEffect } from 'react'
import { DocumentTextIcon, PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../lib/api'

interface Factura {
  id: number
  numero: string
  serie?: string
  uuid: string
  fechaEmision: string
  fechaVencimiento?: string
  subtotal: number
  iva: number
  total: number
  metodoPago?: string
  formaPago?: string
  usoCFDI?: string
  xmlUrl?: string
  pdfUrl?: string
  estadoPago: string
  notas?: string
}

interface Props {
  fleteId: number
  precioCliente: number
  estadoFlete: string
}

export default function FacturacionFlete({ fleteId, precioCliente, estadoFlete }: Props) {
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    numero: '',
    serie: '',
    uuid: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    subtotal: 0,
    iva: 0,
    total: 0,
    metodoPago: 'PUE',
    formaPago: 'TRANSFERENCIA',
    usoCFDI: 'G03',
    notas: '',
  })

  useEffect(() => {
    fetchFactura()
  }, [fleteId])

  useEffect(() => {
    // Calcular subtotal, IVA y total basado en precio del cliente
    const subtotalCalc = precioCliente / 1.16
    const ivaCalc = subtotalCalc * 0.16
    setFormData(prev => ({
      ...prev,
      subtotal: Number(subtotalCalc.toFixed(2)),
      iva: Number(ivaCalc.toFixed(2)),
      total: precioCliente,
    }))
  }, [precioCliente])

  const fetchFactura = async () => {
    try {
      const response = await api.get(`/facturas/by-flete/${fleteId}`)
      setFactura(response.data)
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error al cargar factura:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.numero || !formData.uuid) {
      toast.error('Número de factura y UUID son requeridos')
      return
    }

    try {
      const dataToSend = new FormData()
      dataToSend.append('fleteId', fleteId.toString())
      dataToSend.append('numero', formData.numero)
      if (formData.serie) dataToSend.append('serie', formData.serie)
      dataToSend.append('uuid', formData.uuid)
      dataToSend.append('fechaEmision', formData.fechaEmision)
      if (formData.fechaVencimiento) dataToSend.append('fechaVencimiento', formData.fechaVencimiento)
      dataToSend.append('subtotal', formData.subtotal.toString())
      dataToSend.append('iva', formData.iva.toString())
      dataToSend.append('total', formData.total.toString())
      if (formData.metodoPago) dataToSend.append('metodoPago', formData.metodoPago)
      if (formData.formaPago) dataToSend.append('formaPago', formData.formaPago)
      if (formData.usoCFDI) dataToSend.append('usoCFDI', formData.usoCFDI)
      if (formData.notas) dataToSend.append('notas', formData.notas)

      await api.post('/facturas', dataToSend)
      toast.success('Factura creada correctamente')
      setShowModal(false)
      fetchFactura()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear factura')
    }
  }

  const cambiarEstadoPago = async (nuevoEstado: string) => {
    if (!factura) return

    try {
      await api.patch(`/facturas/${factura.id}/estado-pago`, {
        estadoPago: nuevoEstado,
      })
      toast.success('Estado de pago actualizado')
      fetchFactura()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar estado')
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

  const puedeFacturar = () => {
    return (estadoFlete === 'COMPLETADO' || estadoFlete === 'CERRADO') && !factura
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Facturación</h3>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
            Facturación
          </h3>
          {puedeFacturar() && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-sm btn-primary flex items-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              Crear Factura
            </button>
          )}
        </div>

        {!factura ? (
          <div className="text-center py-8">
            {puedeFacturar() ? (
              <>
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Sin factura asociada</p>
                <p className="text-sm text-gray-400 mt-1">
                  El flete está listo para facturarse
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                El flete debe estar COMPLETADO o CERRADO para facturarse
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Folio Fiscal (UUID)</p>
                <p className="font-mono text-sm">{factura.uuid}</p>
              </div>
              <span className={`badge ${getEstadoBadge(factura.estadoPago)}`}>
                {factura.estadoPago.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">Número</p>
                <p className="font-medium">
                  {factura.serie ? `${factura.serie}-` : ''}
                  {factura.numero}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha Emisión</p>
                <p className="font-medium">
                  {new Date(factura.fechaEmision).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatMoney(factura.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">IVA (16%)</span>
                <span>{formatMoney(factura.iva)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatMoney(factura.total)}</span>
              </div>
            </div>

            {factura.estadoPago === 'PENDIENTE' && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => cambiarEstadoPago('PAGADA')}
                  className="btn-sm btn-success flex-1 flex items-center justify-center gap-1"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Marcar Pagada
                </button>
                <button
                  onClick={() => cambiarEstadoPago('VENCIDA')}
                  className="btn-sm btn-danger flex-1 flex items-center justify-center gap-1"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Vencida
                </button>
              </div>
            )}

            {factura.notas && (
              <div className="bg-gray-50 p-3 rounded mt-3">
                <p className="text-sm text-gray-600">{factura.notas}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear Factura */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Crear Factura</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Serie (Opcional)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.serie}
                    onChange={(e) => setFormData({ ...formData, serie: e.target.value })}
                    placeholder="A, B, etc."
                  />
                </div>
                <div>
                  <label className="label">Número *</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="12345"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">UUID (Folio Fiscal) *</label>
                <input
                  type="text"
                  className="input font-mono text-sm"
                  value={formData.uuid}
                  onChange={(e) => setFormData({ ...formData, uuid: e.target.value })}
                  placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha Emisión *</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.fechaEmision}
                    onChange={(e) => setFormData({ ...formData, fechaEmision: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Fecha Vencimiento</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Subtotal</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.subtotal}
                    onChange={(e) => {
                      const sub = Number(e.target.value)
                      const iva = sub * 0.16
                      setFormData({
                        ...formData,
                        subtotal: sub,
                        iva: Number(iva.toFixed(2)),
                        total: Number((sub + iva).toFixed(2)),
                      })
                    }}
                  />
                </div>
                <div>
                  <label className="label">IVA (16%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.iva}
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">Total</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input font-semibold"
                    value={formData.total}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Método de Pago</label>
                  <select
                    className="input"
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                  >
                    <option value="PUE">PUE - Pago en una exhibición</option>
                    <option value="PPD">PPD - Pago en parcialidades</option>
                  </select>
                </div>
                <div>
                  <label className="label">Forma de Pago</label>
                  <select
                    className="input"
                    value={formData.formaPago}
                    onChange={(e) => setFormData({ ...formData, formaPago: e.target.value })}
                  >
                    <option value="EFECTIVO">01 - Efectivo</option>
                    <option value="CHEQUE">02 - Cheque</option>
                    <option value="TRANSFERENCIA">03 - Transferencia</option>
                    <option value="TARJETA_CREDITO">04 - Tarjeta de Crédito</option>
                    <option value="TARJETA_DEBITO">28 - Tarjeta de Débito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Uso de CFDI</label>
                <input
                  type="text"
                  className="input"
                  value={formData.usoCFDI}
                  onChange={(e) => setFormData({ ...formData, usoCFDI: e.target.value })}
                  placeholder="G03, P01, etc."
                />
              </div>

              <div>
                <label className="label">Notas</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
