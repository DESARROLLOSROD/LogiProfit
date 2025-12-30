import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  TruckIcon,
  BanknotesIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { generarPDFCotizacion } from '../../lib/pdfGenerator'
import Breadcrumbs from '../../components/Breadcrumbs'

interface Concepto {
  id: number
  descripcion: string
  cantidad: number
  unidad: string
  precioUnit: number
  subtotal: number
  orden: number
}

interface Cotizacion {
  id: number
  folio: string
  cliente: { id: number; nombre: string }
  origen: string
  destino: string

  // Información de la carga
  tipoCarga?: string
  pesoCarga?: number
  largo?: number
  ancho?: number
  alto?: number

  // Kilometraje
  kmCargado: number
  kmVacio?: number
  kmTotal: number

  // Totales
  costoTotal: number
  precioCotizado: number
  utilidadEsperada: number
  margenEsperado: number

  // Costos desglosados
  costoDieselCargado?: number
  costoDieselVacio?: number
  costoCasetasTotal?: number
  costoViaticosTotal?: number
  costoMantenimiento?: number
  costoIndirectos?: number
  costoCarroPilotoTotal?: number
  requiereCarroPiloto?: boolean

  estado: string
  notas?: string
  createdAt: string
  conceptos?: Concepto[]
}

export default function CotizacionDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')

  // Conceptos state
  const [showConceptoModal, setShowConceptoModal] = useState(false)
  const [editingConcepto, setEditingConcepto] = useState<Concepto | null>(null)
  const [conceptoForm, setConceptoForm] = useState({
    descripcion: '',
    cantidad: 0,
    unidad: '',
    precioUnit: 0,
  })

  useEffect(() => {
    fetchCotizacion()
  }, [id])

  const fetchCotizacion = async () => {
    try {
      const response = await api.get(`/cotizaciones/${id}`)

      // Convertir campos Decimal de Prisma (vienen como strings) a números
      const data = response.data
      const cotizacionConvertida = {
        ...data,
        // Kilometraje
        kmCargado: Number(data.kmCargado) || 0,
        kmVacio: Number(data.kmVacio) || 0,
        kmTotal: Number(data.kmTotal) || 0,

        // Totales
        costoTotal: Number(data.costoTotal) || 0,
        precioCotizado: Number(data.precioCotizado) || 0,
        utilidadEsperada: Number(data.utilidadEsperada) || 0,
        margenEsperado: Number(data.margenEsperado) || 0,

        // Información de carga
        pesoCarga: Number(data.pesoCarga) || 0,

        // Conceptos
        conceptos: data.conceptos?.map((c: any) => ({
          ...c,
          cantidad: Number(c.cantidad) || 0,
          precioUnit: Number(c.precioUnit) || 0,
          subtotal: Number(c.subtotal) || 0,
        })) || [],
      }

      setCotizacion(cotizacionConvertida)
    } catch {
      navigate('/cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  const convertirAFlete = async () => {
    try {
      const response = await api.post(`/cotizaciones/${id}/convertir-flete`)
      toast.success('¡Flete creado exitosamente!')
      navigate(`/fletes/${response.data.id}`)
    } catch {
      // Error handled by interceptor
    }
  }

  const cambiarEstado = async () => {
    if (!nuevoEstado) {
      toast.error('Selecciona un estado')
      return
    }

    try {
      await api.patch(`/cotizaciones/${id}/estado?estado=${nuevoEstado}`)
      toast.success('Estado actualizado correctamente')
      setShowEstadoModal(false)
      setNuevoEstado('')
      fetchCotizacion()
    } catch {
      // Error handled by interceptor
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  }

  // Conceptos functions
  const openConceptoModal = (concepto?: Concepto) => {
    if (concepto) {
      setEditingConcepto(concepto)
      setConceptoForm({
        descripcion: concepto.descripcion,
        cantidad: concepto.cantidad,
        unidad: concepto.unidad,
        precioUnit: concepto.precioUnit,
      })
    } else {
      setEditingConcepto(null)
      setConceptoForm({
        descripcion: '',
        cantidad: 0,
        unidad: '',
        precioUnit: 0,
      })
    }
    setShowConceptoModal(true)
  }

  const closeConceptoModal = () => {
    setShowConceptoModal(false)
    setEditingConcepto(null)
    setConceptoForm({
      descripcion: '',
      cantidad: 0,
      unidad: '',
      precioUnit: 0,
    })
  }

  const saveConcepto = async () => {
    if (!conceptoForm.descripcion || !conceptoForm.unidad || conceptoForm.cantidad <= 0 || conceptoForm.precioUnit <= 0) {
      toast.error('Completa todos los campos correctamente')
      return
    }

    try {
      if (editingConcepto) {
        await api.patch(`/cotizaciones/${id}/conceptos/${editingConcepto.id}`, conceptoForm)
        toast.success('Concepto actualizado')
      } else {
        await api.post(`/cotizaciones/${id}/conceptos`, conceptoForm)
        toast.success('Concepto agregado')
      }
      closeConceptoModal()
      fetchCotizacion()
    } catch {
      // Error handled by interceptor
    }
  }

  const deleteConcepto = async (conceptoId: number) => {
    if (!confirm('¿Eliminar este concepto?')) return

    try {
      await api.delete(`/cotizaciones/${id}/conceptos/${conceptoId}`)
      toast.success('Concepto eliminado')
      fetchCotizacion()
    } catch {
      // Error handled by interceptor
    }
  }

  const exportarPDF = () => {
    if (!cotizacion) return

    generarPDFCotizacion({
      folio: cotizacion.folio,
      cliente: {
        nombre: cotizacion.cliente.nombre,
        rfc: undefined, // El backend no devuelve RFC del cliente en el detalle
        email: undefined,
      },
      origen: cotizacion.origen,
      destino: cotizacion.destino,
      kmIda: cotizacion.kmCargado,
      kmVuelta: cotizacion.kmVacio || 0,
      precioCotizado: cotizacion.precioCotizado,
      utilidadEsperada: cotizacion.utilidadEsperada,
      margenEsperado: cotizacion.margenEsperado,
      createdAt: cotizacion.createdAt,
      costoDieselIda: cotizacion.costoDieselCargado,
      costoDieselVuelta: cotizacion.costoDieselVacio,
      costoCasetas: cotizacion.costoCasetasTotal,
      costoViaticos: cotizacion.costoViaticosTotal,
      costoMantenimiento: cotizacion.costoMantenimiento,
      costosIndirectos: cotizacion.costoIndirectos,
      costoAutoPiloto: cotizacion.costoCarroPilotoTotal,
      costoTotal: cotizacion.costoTotal,
      requiereAutoPiloto: cotizacion.requiereCarroPiloto ?? false,
    })

    toast.success('PDF generado exitosamente')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!cotizacion) return null

  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Cotizaciones', path: '/cotizaciones' },
          { label: cotizacion.folio },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cotizacion.folio}</h1>
          <p className="text-gray-500">{cotizacion.cliente.nombre}</p>
        </div>
        <div className="flex gap-3">
          {cotizacion.estado !== 'CONVERTIDA' && cotizacion.estado !== 'CANCELADA' && (
            <>
              <button onClick={() => setShowEstadoModal(true)} className="btn-secondary">
                Cambiar Estado
              </button>
              {cotizacion.estado === 'APROBADA' && (
                <button onClick={convertirAFlete} className="btn-primary">
                  Convertir a Flete
                </button>
              )}
            </>
          )}
          <button onClick={exportarPDF} className="btn-secondary">
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Viaje */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TruckIcon className="w-5 h-5 text-primary-600" />
            Información del Viaje
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Origen</p>
              <p className="font-medium">{cotizacion.origen}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Destino</p>
              <p className="font-medium">{cotizacion.destino}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Km Cargado</p>
              <p className="font-medium">{cotizacion.kmCargado} km</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Km Vacío</p>
              <p className="font-medium">{cotizacion.kmVacio || 0} km</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Km Total</p>
              <p className="font-medium text-primary-600">{cotizacion.kmTotal} km</p>
            </div>
            {cotizacion.tipoCarga && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Tipo de Carga</p>
                  <p className="font-medium">{cotizacion.tipoCarga}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Peso</p>
                  <p className="font-medium">{cotizacion.pesoCarga} ton</p>
                </div>
              </>
            )}
            {cotizacion.largo && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Dimensiones</p>
                <p className="font-medium">
                  {cotizacion.largo}m × {cotizacion.ancho}m × {cotizacion.alto}m
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Estado y Resumen */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Estado</h3>
          <div className="space-y-4">
            <div>
              <span className={`badge text-lg px-4 py-2 ${
                cotizacion.estado === 'APROBADA' ? 'badge-success' :
                cotizacion.estado === 'CONVERTIDA' ? 'badge-primary' :
                'badge-gray'
              }`}>
                {cotizacion.estado}
              </span>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">Fecha de Creación</p>
              <p className="font-medium">
                {new Date(cotizacion.createdAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {cotizacion.requiereCarroPiloto && (
              <div className="pt-4 border-t">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Requiere Carro Piloto
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conceptos / Servicios */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BanknotesIcon className="w-5 h-5 text-primary-600" />
            Conceptos y Servicios
          </h3>
          {cotizacion.estado !== 'CONVERTIDA' && cotizacion.estado !== 'CANCELADA' && (
            <button onClick={() => openConceptoModal()} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Agregar Concepto
            </button>
          )}
        </div>

        {cotizacion.conceptos && cotizacion.conceptos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  {cotizacion.estado !== 'CONVERTIDA' && cotizacion.estado !== 'CANCELADA' && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cotizacion.conceptos.map((concepto) => (
                  <tr key={concepto.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{concepto.descripcion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{concepto.cantidad.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{concepto.unidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatMoney(concepto.precioUnit)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatMoney(concepto.subtotal)}</td>
                    {cotizacion.estado !== 'CONVERTIDA' && cotizacion.estado !== 'CANCELADA' && (
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openConceptoModal(concepto)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteConcepto(concepto.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Total Conceptos:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-primary-600 text-right">
                    {formatMoney(cotizacion.conceptos.reduce((sum, c) => sum + c.subtotal, 0))}
                  </td>
                  {cotizacion.estado !== 'CONVERTIDA' && cotizacion.estado !== 'CANCELADA' && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BanknotesIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No hay conceptos agregados</p>
            <p className="text-sm">Agrega servicios como diesel, casetas, viáticos, etc.</p>
          </div>
        )}
      </div>

      {/* Resumen Financiero */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-primary-600" />
          Resumen Financiero
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
            <p className="text-sm text-red-600 font-medium">Costo Total</p>
            <p className="text-2xl font-bold text-red-700">{formatMoney(cotizacion.costoTotal)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-sm text-gray-600 font-medium">Precio Cotizado</p>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(cotizacion.precioCotizado)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-sm text-green-600 font-medium">Utilidad Esperada</p>
            <p className={`text-2xl font-bold ${
              cotizacion.utilidadEsperada >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {formatMoney(cotizacion.utilidadEsperada)}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Margen</p>
            <p className="text-2xl font-bold text-blue-700">
              {(Number(cotizacion.margenEsperado) || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Notas */}
      {cotizacion.notas && (
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-2">Notas</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{cotizacion.notas}</p>
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {showEstadoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cambiar Estado de Cotización</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Estado Actual</label>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <span className={`badge text-base px-3 py-1 ${
                    cotizacion.estado === 'BORRADOR' ? 'badge-gray' :
                    cotizacion.estado === 'ENVIADA' ? 'badge-info' :
                    cotizacion.estado === 'APROBADA' ? 'badge-success' :
                    cotizacion.estado === 'RECHAZADA' ? 'badge-danger' :
                    'badge-warning'
                  }`}>
                    {cotizacion.estado}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Nuevo Estado</label>
                <select
                  className="input"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {cotizacion.estado === 'BORRADOR' && (
                    <>
                      <option value="ENVIADA">ENVIADA - Enviada al cliente</option>
                      <option value="CANCELADA">CANCELADA - Cancelar cotización</option>
                    </>
                  )}
                  {cotizacion.estado === 'ENVIADA' && (
                    <>
                      <option value="APROBADA">APROBADA - Cliente aprobó</option>
                      <option value="RECHAZADA">RECHAZADA - Cliente rechazó</option>
                      <option value="CANCELADA">CANCELADA - Cancelar cotización</option>
                    </>
                  )}
                  {cotizacion.estado === 'APROBADA' && (
                    <>
                      <option value="CANCELADA">CANCELADA - Cancelar cotización</option>
                    </>
                  )}
                  {cotizacion.estado === 'RECHAZADA' && (
                    <>
                      <option value="ENVIADA">ENVIADA - Reenviar al cliente</option>
                      <option value="CANCELADA">CANCELADA - Cancelar cotización</option>
                    </>
                  )}
                </select>
              </div>

              {nuevoEstado && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    {nuevoEstado === 'ENVIADA' && '📧 La cotización se marcará como enviada al cliente'}
                    {nuevoEstado === 'APROBADA' && '✅ La cotización se podrá convertir en flete'}
                    {nuevoEstado === 'RECHAZADA' && '❌ La cotización se marcará como rechazada'}
                    {nuevoEstado === 'CANCELADA' && '🚫 La cotización se cancelará permanentemente'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEstadoModal(false)
                  setNuevoEstado('')
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button onClick={cambiarEstado} className="btn-primary flex-1">
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar/Editar Concepto */}
      {showConceptoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingConcepto ? 'Editar Concepto' : 'Agregar Concepto'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Servicio / Descripción</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: Diesel, Casetas, Viáticos"
                  value={conceptoForm.descripcion}
                  onChange={(e) => setConceptoForm({ ...conceptoForm, descripcion: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Cantidad</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="100"
                    value={conceptoForm.cantidad || ''}
                    onChange={(e) => setConceptoForm({ ...conceptoForm, cantidad: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Unidad</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="litros, km, servicio"
                    value={conceptoForm.unidad}
                    onChange={(e) => setConceptoForm({ ...conceptoForm, unidad: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Precio Unitario</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="24.50"
                  value={conceptoForm.precioUnit || ''}
                  onChange={(e) => setConceptoForm({ ...conceptoForm, precioUnit: Number(e.target.value) })}
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  Subtotal estimado: {formatMoney((conceptoForm.cantidad || 0) * (conceptoForm.precioUnit || 0))}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={closeConceptoModal} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={saveConcepto} className="btn-primary flex-1">
                {editingConcepto ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
