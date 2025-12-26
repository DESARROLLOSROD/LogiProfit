import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  TruckIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { generarPDFCotizacion } from '../../lib/pdfGenerator'
import Breadcrumbs from '../../components/Breadcrumbs'

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

  // Costos de combustible
  costoDieselCargado: number
  costoDieselVacio: number
  costoDieselTotal: number

  // Casetas
  casetasCargado?: number
  casetasVacio?: number
  costoCasetasTotal: number

  // Viáticos detallados
  diasViaje: number
  viaticosAlimentos?: number
  viaticosHospedaje?: number
  viaticosExtras?: number
  costoViaticosTotal: number

  // Salario
  salarioChofer: number

  // Permiso SCT
  permisoSCT?: number

  // Subtotal operativo
  subtotalOperativo: number

  // Costos porcentuales
  porcentajeMantenimiento: number
  costoMantenimiento: number
  porcentajeIndirectos: number
  costoIndirectos: number

  // Carro piloto
  requiereCarroPiloto: boolean
  diasCarroPiloto?: number
  costoBaseCarroPiloto?: number
  costoGasolinaCarroPiloto?: number
  costoCarroPilotoTotal?: number

  // Totales
  costoTotal: number
  precioCotizado: number
  utilidadEsperada: number
  margenEsperado: number

  estado: string
  notas?: string
  createdAt: string
}

export default function CotizacionDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState({
    diesel: false,
    casetas: false,
    viaticos: false,
    porcentuales: false,
    carroPiloto: false,
  })
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')

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

        // Costos de combustible
        costoDieselCargado: Number(data.costoDieselCargado) || 0,
        costoDieselVacio: Number(data.costoDieselVacio) || 0,
        costoDieselTotal: Number(data.costoDieselTotal) || 0,

        // Casetas
        casetasCargado: Number(data.casetasCargado) || 0,
        casetasVacio: Number(data.casetasVacio) || 0,
        costoCasetasTotal: Number(data.costoCasetasTotal) || 0,

        // Viáticos
        diasViaje: Number(data.diasViaje) || 0,
        viaticosAlimentos: Number(data.viaticosAlimentos) || 0,
        viaticosHospedaje: Number(data.viaticosHospedaje) || 0,
        viaticosExtras: Number(data.viaticosExtras) || 0,
        costoViaticosTotal: Number(data.costoViaticosTotal) || 0,

        // Salario
        salarioChofer: Number(data.salarioChofer) || 0,

        // Permiso SCT
        permisoSCT: Number(data.permisoSCT) || 0,

        // Subtotal operativo
        subtotalOperativo: Number(data.subtotalOperativo) || 0,

        // Costos porcentuales
        porcentajeMantenimiento: Number(data.porcentajeMantenimiento) || 0,
        costoMantenimiento: Number(data.costoMantenimiento) || 0,
        porcentajeIndirectos: Number(data.porcentajeIndirectos) || 0,
        costoIndirectos: Number(data.costoIndirectos) || 0,

        // Carro piloto
        diasCarroPiloto: Number(data.diasCarroPiloto) || 0,
        costoBaseCarroPiloto: Number(data.costoBaseCarroPiloto) || 0,
        costoGasolinaCarroPiloto: Number(data.costoGasolinaCarroPiloto) || 0,
        costoCarroPilotoTotal: Number(data.costoCarroPilotoTotal) || 0,

        // Totales
        costoTotal: Number(data.costoTotal) || 0,
        precioCotizado: Number(data.precioCotizado) || 0,
        utilidadEsperada: Number(data.utilidadEsperada) || 0,
        margenEsperado: Number(data.margenEsperado) || 0,

        // Información de carga
        pesoCarga: Number(data.pesoCarga) || 0,
        largo: Number(data.largo) || 0,
        ancho: Number(data.ancho) || 0,
        alto: Number(data.alto) || 0,
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

  const toggleSection = (section: keyof typeof showDetails) => {
    setShowDetails(prev => ({ ...prev, [section]: !prev[section] }))
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
      requiereAutoPiloto: cotizacion.requiereCarroPiloto,
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
            <div>
              <p className="text-sm text-gray-500">Días de Viaje</p>
              <p className="font-medium">{cotizacion.diasViaje} días</p>
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

      {/* Desglose de Costos */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BanknotesIcon className="w-5 h-5 text-primary-600" />
          Desglose Detallado de Costos
        </h3>

        <div className="space-y-3">
          {/* 1. Diesel */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('diesel')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">1. Combustible (Diesel)</span>
                <span className="text-sm text-gray-500">
                  {((cotizacion.costoDieselTotal / cotizacion.costoTotal) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  {formatMoney(cotizacion.costoDieselTotal)}
                </span>
                {showDetails.diesel ?
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" /> :
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                }
              </div>
            </button>
            {showDetails.diesel && (
              <div className="px-4 pb-3 pt-2 bg-gray-50 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Diesel cargado ({cotizacion.kmCargado} km)</span>
                  <span>{formatMoney(cotizacion.costoDieselCargado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Diesel vacío ({cotizacion.kmVacio || 0} km)</span>
                  <span>{formatMoney(cotizacion.costoDieselVacio)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Casetas */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('casetas')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">2. Casetas</span>
                <span className="text-sm text-gray-500">
                  {((cotizacion.costoCasetasTotal / cotizacion.costoTotal) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  {formatMoney(cotizacion.costoCasetasTotal)}
                </span>
                {showDetails.casetas ?
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" /> :
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                }
              </div>
            </button>
            {showDetails.casetas && cotizacion.casetasCargado !== undefined && (
              <div className="px-4 pb-3 pt-2 bg-gray-50 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Casetas cargado</span>
                  <span>{formatMoney(cotizacion.casetasCargado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Casetas vacío</span>
                  <span>{formatMoney(cotizacion.casetasVacio || 0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Viáticos */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('viaticos')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">3. Viáticos ({cotizacion.diasViaje} días)</span>
                <span className="text-sm text-gray-500">
                  {((cotizacion.costoViaticosTotal / cotizacion.costoTotal) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  {formatMoney(cotizacion.costoViaticosTotal)}
                </span>
                {showDetails.viaticos ?
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" /> :
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                }
              </div>
            </button>
            {showDetails.viaticos && (
              <div className="px-4 pb-3 pt-2 bg-gray-50 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Alimentos</span>
                  <span>{formatMoney(cotizacion.viaticosAlimentos || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hospedaje</span>
                  <span>{formatMoney(cotizacion.viaticosHospedaje || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Extras</span>
                  <span>{formatMoney(cotizacion.viaticosExtras || 0)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Salario */}
          <div className="px-4 py-3 border rounded-lg flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <span className="font-medium">4. Salario del Chofer</span>
              <span className="text-sm text-gray-500">
                {((cotizacion.salarioChofer / cotizacion.costoTotal) * 100).toFixed(1)}%
              </span>
            </div>
            <span className="font-semibold text-gray-900">
              {formatMoney(cotizacion.salarioChofer)}
            </span>
          </div>

          {/* 5. Permiso SCT */}
          {cotizacion.permisoSCT && cotizacion.permisoSCT > 0 && (
            <div className="px-4 py-3 border rounded-lg flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <span className="font-medium">5. Permiso SCT</span>
                <span className="text-sm text-gray-500">
                  {((cotizacion.permisoSCT / cotizacion.costoTotal) * 100).toFixed(1)}%
                </span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatMoney(cotizacion.permisoSCT)}
              </span>
            </div>
          )}

          {/* Subtotal Operativo */}
          <div className="px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-blue-900">Subtotal Operativo</span>
            <span className="font-bold text-blue-900">
              {formatMoney(cotizacion.subtotalOperativo)}
            </span>
          </div>

          {/* 6. Costos Porcentuales */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('porcentuales')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">6. Costos Porcentuales</span>
                <span className="text-sm text-gray-500">
                  {(((cotizacion.costoMantenimiento + cotizacion.costoIndirectos) / cotizacion.costoTotal) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  {formatMoney(cotizacion.costoMantenimiento + cotizacion.costoIndirectos)}
                </span>
                {showDetails.porcentuales ?
                  <ChevronUpIcon className="w-5 h-5 text-gray-400" /> :
                  <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                }
              </div>
            </button>
            {showDetails.porcentuales && (
              <div className="px-4 pb-3 pt-2 bg-gray-50 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Mantenimiento ({cotizacion.porcentajeMantenimiento}% del subtotal)
                  </span>
                  <span>{formatMoney(cotizacion.costoMantenimiento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Costos Indirectos ({cotizacion.porcentajeIndirectos}% del subtotal)
                  </span>
                  <span>{formatMoney(cotizacion.costoIndirectos)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 7. Carro Piloto */}
          {cotizacion.requiereCarroPiloto && (
            <div className="border-2 border-yellow-300 rounded-lg">
              <button
                onClick={() => toggleSection('carroPiloto')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-yellow-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-yellow-900">7. Carro Piloto ({cotizacion.diasCarroPiloto} días)</span>
                  <span className="text-sm text-yellow-700">
                    {((cotizacion.costoCarroPilotoTotal || 0) / cotizacion.costoTotal * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-yellow-900">
                    {formatMoney(cotizacion.costoCarroPilotoTotal || 0)}
                  </span>
                  {showDetails.carroPiloto ?
                    <ChevronUpIcon className="w-5 h-5 text-yellow-600" /> :
                    <ChevronDownIcon className="w-5 h-5 text-yellow-600" />
                  }
                </div>
              </button>
              {showDetails.carroPiloto && (
                <div className="px-4 pb-3 pt-2 bg-yellow-50 border-t border-yellow-300 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Costo base</span>
                    <span>{formatMoney(cotizacion.costoBaseCarroPiloto || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Gasolina ({cotizacion.diasCarroPiloto} días)</span>
                    <span>{formatMoney(cotizacion.costoGasolinaCarroPiloto || 0)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
    </div>
  )
}
