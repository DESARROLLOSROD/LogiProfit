import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Concepto {
  id: number
  tipo?: string
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
  cliente: { id: number; nombre: string; tipoPersona?: 'FISICA' | 'MORAL' }
  calculo?: { id: number; folio: string } // Cálculo origen
  origen: string
  destino: string
  tipoCarga?: string
  pesoCarga?: number
  dimensiones?: string
  kmEstimado: number
  subtotal: number
  iva: number
  retencion: number
  total: number
  precioCotizado: number // DEPRECADO
  estado: string
  notas?: string
  validoHasta?: string
  createdAt: string
  conceptos?: Concepto[]
}

const estadoColors = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  ENVIADA: 'bg-blue-100 text-blue-800',
  APROBADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
  CONVERTIDA: 'bg-purple-100 text-purple-800',
}

export default function CotizacionDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [loading, setLoading] = useState(true)

  // Estado modal
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')

  // Concepto modal
  const [showConceptoModal, setShowConceptoModal] = useState(false)
  const [editingConcepto, setEditingConcepto] = useState<Concepto | null>(null)
  const [conceptoForm, setConceptoForm] = useState({
    tipo: '',
    descripcion: '',
    cantidad: '',
    unidad: '',
    precioUnit: '',
  })

  useEffect(() => {
    fetchCotizacion()
  }, [id])

  const fetchCotizacion = async () => {
    try {
      const response = await api.get(`/cotizaciones/${id}`)
      setCotizacion(response.data)
    } catch (error) {
      console.error('Error al cargar cotización:', error)
      toast.error('Error al cargar cotización')
      navigate('/cotizaciones')
    } finally {
      setLoading(false)
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado')
    }
  }

  const convertirAFlete = async () => {
    if (!confirm('¿Convertir esta cotización a flete?')) return

    try {
      const response = await api.post(`/cotizaciones/${id}/convertir-flete`)
      toast.success('¡Flete creado exitosamente!')
      navigate(`/fletes/${response.data.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al convertir a flete')
    }
  }

  const openConceptoModal = (concepto?: Concepto) => {
    if (concepto) {
      setEditingConcepto(concepto)
      setConceptoForm({
        tipo: concepto.tipo || '',
        descripcion: concepto.descripcion,
        cantidad: String(concepto.cantidad),
        unidad: concepto.unidad,
        precioUnit: String(concepto.precioUnit),
      })
    } else {
      setEditingConcepto(null)
      setConceptoForm({
        tipo: '',
        descripcion: '',
        cantidad: '',
        unidad: '',
        precioUnit: '',
      })
    }
    setShowConceptoModal(true)
  }

  const guardarConcepto = async () => {
    if (!conceptoForm.descripcion || !conceptoForm.cantidad || !conceptoForm.unidad || !conceptoForm.precioUnit) {
      toast.error('Completa todos los campos')
      return
    }

    try {
      const payload = {
        tipo: conceptoForm.tipo || undefined,
        descripcion: conceptoForm.descripcion,
        cantidad: Number(conceptoForm.cantidad),
        unidad: conceptoForm.unidad,
        precioUnit: Number(conceptoForm.precioUnit),
      }

      if (editingConcepto) {
        await api.put(`/cotizaciones/${id}/conceptos/${editingConcepto.id}`, payload)
        toast.success('Concepto actualizado')
      } else {
        await api.post(`/cotizaciones/${id}/conceptos`, payload)
        toast.success('Concepto agregado')
      }

      setShowConceptoModal(false)
      await fetchCotizacion()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar concepto')
    }
  }

  const eliminarConcepto = async (conceptoId: number) => {
    if (!confirm('¿Eliminar este concepto?')) return

    try {
      await api.delete(`/cotizaciones/${id}/conceptos/${conceptoId}`)
      toast.success('Concepto eliminado')
      await fetchCotizacion()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar concepto')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!cotizacion) return null

  const totalConceptos = cotizacion.conceptos?.reduce((sum, c) => sum + c.subtotal, 0) || 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/cotizaciones')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Volver a cotizaciones
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{cotizacion.folio}</h1>
            <p className="text-gray-600 mt-1">Cotización para {cotizacion.cliente.nombre}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${estadoColors[cotizacion.estado as keyof typeof estadoColors]}`}>
            {cotizacion.estado}
          </span>
        </div>
      </div>

      {/* Información Principal */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Información de la Cotización</h2>
          {cotizacion.calculo && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                📊 Desde Cálculo
              </span>
              <button
                onClick={() => navigate(`/calculos/${cotizacion.calculo.id}`)}
                className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors"
              >
                Ver {cotizacion.calculo.folio}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cliente y Ruta */}
          <div>
            <label className="block text-sm font-medium text-gray-500">Cliente</label>
            <p className="mt-1 text-gray-900">{cotizacion.cliente.nombre}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">Ruta</label>
            <p className="mt-1 text-gray-900">
              {cotizacion.origen} → {cotizacion.destino}
            </p>
          </div>

          {/* Carga */}
          {cotizacion.tipoCarga && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Tipo de Carga</label>
              <p className="mt-1 text-gray-900">{cotizacion.tipoCarga}</p>
            </div>
          )}

          {cotizacion.pesoCarga && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Peso</label>
              <p className="mt-1 text-gray-900">{cotizacion.pesoCarga} toneladas</p>
            </div>
          )}

          {cotizacion.dimensiones && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Dimensiones</label>
              <p className="mt-1 text-gray-900">{cotizacion.dimensiones}</p>
            </div>
          )}

          {/* Kilometraje */}
          <div>
            <label className="block text-sm font-medium text-gray-500">Kilómetros Estimados</label>
            <p className="mt-1 text-gray-900">{cotizacion.kmEstimado.toLocaleString()} km</p>
          </div>

          {/* Validez */}
          {cotizacion.validoHasta && (
            <div>
              <label className="block text-sm font-medium text-gray-500">Válido Hasta</label>
              <p className="mt-1 text-gray-900">
                {new Date(cotizacion.validoHasta).toLocaleDateString('es-MX')}
              </p>
            </div>
          )}
        </div>

        {/* Notas */}
        {cotizacion.notas && (
          <div className="mt-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-500 mb-2">Notas</label>
            <p className="text-gray-900 whitespace-pre-wrap">{cotizacion.notas}</p>
          </div>
        )}
      </div>

      {/* Conceptos / Servicios */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conceptos / Servicios</h2>
          {cotizacion.estado !== 'CONVERTIDA' && (
            <button
              onClick={() => openConceptoModal()}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              Agregar Concepto
            </button>
          )}
        </div>

        {cotizacion.conceptos && cotizacion.conceptos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unidad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  {cotizacion.estado !== 'CONVERTIDA' && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cotizacion.conceptos.map(concepto => (
                  <tr key={concepto.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{concepto.descripcion}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{concepto.cantidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{concepto.unidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${concepto.precioUnit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      ${concepto.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    {cotizacion.estado !== 'CONVERTIDA' && (
                      <td className="px-4 py-3 text-sm text-right">
                        <button
                          onClick={() => openConceptoModal(concepto)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => eliminarConcepto(concepto.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-sm text-gray-500">Total Conceptos (Desglose)</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${totalConceptos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {Math.abs(totalConceptos - cotizacion.precioCotizado) > 0.01 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Diferencia</p>
                    <p className={`text-lg font-semibold ${
                      totalConceptos > cotizacion.precioCotizado ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {totalConceptos > cotizacion.precioCotizado ? '+' : ''}
                      ${(totalConceptos - cotizacion.precioCotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
              {Math.abs(totalConceptos - cotizacion.precioCotizado) > 0.01 && (
                <p className="text-xs text-gray-500">
                  {totalConceptos > cotizacion.precioCotizado
                    ? '⚠️ Los conceptos suman más que el precio cotizado'
                    : '⚠️ Los conceptos suman menos que el precio cotizado'
                  }
                </p>
              )}
              {Math.abs(totalConceptos - cotizacion.precioCotizado) <= 0.01 && (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-sm font-medium">✓ Coincide con precio cotizado</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 text-center py-8">No hay conceptos agregados</p>
            <div className="mt-4 border-t pt-4 bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-800 text-center">
                💡 Agrega conceptos para desglosar el precio cotizado de ${cotizacion.precioCotizado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Desglose de la Cotización */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-blue-700 font-semibold">DESGLOSE DE LA COTIZACIÓN</p>
            <p className="text-xs text-gray-600 mt-1">
              Cliente: <span className="font-medium">{cotizacion.cliente.nombre}</span>
              {cotizacion.cliente.tipoPersona && (
                <span className="ml-2 px-2 py-0.5 bg-white rounded text-xs">
                  {cotizacion.cliente.tipoPersona === 'FISICA' ? 'Persona Física' : 'Persona Moral'}
                </span>
              )}
            </p>
          </div>
          <DocumentTextIcon className="h-12 w-12 text-blue-600 opacity-20" />
        </div>

        <div className="bg-white rounded-lg p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold text-gray-900">
              ${cotizacion.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-700">IVA (16%):</span>
            <span className="font-semibold text-blue-600">
              + ${cotizacion.iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {cotizacion.retencion > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Retención (4%):</span>
              <span className="font-semibold text-red-600">
                - ${cotizacion.retencion.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between">
            <span className="font-bold text-gray-900 text-lg">TOTAL:</span>
            <span className="font-bold text-green-700 text-2xl">
              ${cotizacion.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2 border-t pt-2">
            {cotizacion.cliente.tipoPersona === 'MORAL'
              ? '* Total = Subtotal + IVA (16%) - Retención (4%) para Persona Moral'
              : '* Total = Subtotal + IVA (16%) para Persona Física'}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        {cotizacion.estado !== 'CONVERTIDA' && (
          <button
            onClick={() => navigate(`/cotizaciones/editar/${id}`)}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
          >
            <PencilIcon className="h-5 w-5" />
            Editar Cotización
          </button>
        )}

        <button
          onClick={() => setShowEstadoModal(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          disabled={cotizacion.estado === 'CONVERTIDA'}
        >
          Cambiar Estado
        </button>

        {cotizacion.estado === 'APROBADA' && (
          <button
            onClick={convertirAFlete}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Convertir a Flete
          </button>
        )}
      </div>

      {/* Modal Cambiar Estado */}
      {showEstadoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cambiar Estado</h3>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4"
            >
              <option value="">Selecciona un estado</option>
              <option value="BORRADOR">BORRADOR</option>
              <option value="ENVIADA">ENVIADA</option>
              <option value="APROBADA">APROBADA</option>
              <option value="RECHAZADA">RECHAZADA</option>
            </select>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEstadoModal(false)
                  setNuevoEstado('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={cambiarEstado}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Concepto */}
      {showConceptoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingConcepto ? 'Editar Concepto' : 'Nuevo Concepto'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría (Para Comparativa)</label>
                <select
                  value={conceptoForm.tipo}
                  onChange={(e) => setConceptoForm({ ...conceptoForm, tipo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                >
                  <option value="">Opcional: Selecciona tipo</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="CASETAS">Casetas</option>
                  <option value="VIATICOS">Viáticos</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="MANIOBRAS">Maniobras</option>
                  <option value="SALARIO">Salario</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  value={conceptoForm.descripcion}
                  onChange={(e) => setConceptoForm({ ...conceptoForm, descripcion: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  placeholder="Ej: Diesel estimado"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                  <input
                    type="number"
                    value={conceptoForm.cantidad}
                    onChange={(e) => setConceptoForm({ ...conceptoForm, cantidad: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unidad</label>
                  <input
                    type="text"
                    value={conceptoForm.unidad}
                    onChange={(e) => setConceptoForm({ ...conceptoForm, unidad: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    placeholder="Ej: litros"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio Unitario</label>
                <input
                  type="number"
                  value={conceptoForm.precioUnit}
                  onChange={(e) => setConceptoForm({ ...conceptoForm, precioUnit: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  step="0.01"
                />
              </div>

              {conceptoForm.cantidad && conceptoForm.precioUnit && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${(Number(conceptoForm.cantidad) * Number(conceptoForm.precioUnit)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowConceptoModal(false)
                  setEditingConcepto(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarConcepto}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
