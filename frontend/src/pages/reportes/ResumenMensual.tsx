import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Truck,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ArrowLeft
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'

interface ResumenMensual {
  mes: number
  anio: number
  totalFletes: number
  totalIngresos: number
  totalGastos: number
  utilidadNeta: number
  margenPromedio: number
  fletesConPerdida: number
}

export default function ResumenMensual() {
  const navigate = useNavigate()
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [resumen, setResumen] = useState<ResumenMensual | null>(null)
  const [loading, setLoading] = useState(false)

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  useEffect(() => {
    cargarResumen()
  }, [mes, anio])

  const cargarResumen = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/fletes/resumen-mensual?mes=${mes}&anio=${anio}`)
      setResumen(res.data)
    } catch (error) {
      console.error('Error al cargar resumen:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const cambiarMes = (delta: number) => {
    let nuevoMes = mes + delta
    let nuevoAnio = anio

    if (nuevoMes > 12) {
      nuevoMes = 1
      nuevoAnio++
    } else if (nuevoMes < 1) {
      nuevoMes = 12
      nuevoAnio--
    }

    setMes(nuevoMes)
    setAnio(nuevoAnio)
  }

  if (loading && !resumen) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando resumen...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reportes')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resumen Mensual</h1>
              <p className="text-gray-500">Vista completa del desempeño del mes</p>
            </div>
          </div>
        </div>

        {/* Selector de Mes/Año */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => cambiarMes(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="border-none bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              {meses.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="border-none bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => cambiarMes(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors rotate-180"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>

      {resumen && (
        <>
          {/* Cards de Estadísticas Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Fletes */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Fletes</p>
                  <p className="text-3xl font-bold text-gray-900">{resumen.totalFletes}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Total Ingresos */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatMoney(resumen.totalIngresos)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Total Gastos */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Gastos Totales</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatMoney(resumen.totalGastos)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Utilidad Neta */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Utilidad Neta</p>
                  <p className={`text-2xl font-bold ${resumen.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatMoney(resumen.utilidadNeta)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${resumen.utilidadNeta >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <DollarSign className={`h-8 w-8 ${resumen.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Cards Secundarias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Margen Promedio */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Margen de Utilidad</h3>
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>

              <div className="flex items-end gap-2 mb-2">
                <p className="text-4xl font-bold text-blue-600">
                  {resumen.margenPromedio.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mb-2">promedio</p>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${
                    resumen.margenPromedio >= 20 ? 'bg-green-600' :
                    resumen.margenPromedio >= 10 ? 'bg-yellow-500' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(resumen.margenPromedio, 100)}%` }}
                />
              </div>

              <p className="text-xs text-gray-500">
                {resumen.margenPromedio >= 20 ? 'Excelente margen' :
                 resumen.margenPromedio >= 10 ? 'Margen aceptable' :
                 'Margen bajo - revisar costos'}
              </p>
            </div>

            {/* Fletes con Pérdida */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Fletes con Pérdida</h3>
                <AlertTriangle className={`h-6 w-6 ${resumen.fletesConPerdida > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>

              <div className="flex items-end gap-2 mb-2">
                <p className={`text-4xl font-bold ${resumen.fletesConPerdida > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {resumen.fletesConPerdida}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  de {resumen.totalFletes} fletes
                </p>
              </div>

              {resumen.totalFletes > 0 && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="h-3 rounded-full bg-red-600 transition-all"
                      style={{ width: `${(resumen.fletesConPerdida / resumen.totalFletes) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    {((resumen.fletesConPerdida / resumen.totalFletes) * 100).toFixed(1)}% del total
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Análisis y Recomendaciones */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis del Mes</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Promedio por Flete */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Ingreso Promedio por Flete</p>
                <p className="text-2xl font-bold text-blue-600">
                  {resumen.totalFletes > 0
                    ? formatMoney(resumen.totalIngresos / resumen.totalFletes)
                    : '$0.00'}
                </p>
              </div>

              {/* Gasto Promedio por Flete */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Gasto Promedio por Flete</p>
                <p className="text-2xl font-bold text-orange-600">
                  {resumen.totalFletes > 0
                    ? formatMoney(resumen.totalGastos / resumen.totalFletes)
                    : '$0.00'}
                </p>
              </div>

              {/* Utilidad Promedio por Flete */}
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Utilidad Promedio por Flete</p>
                <p className={`text-2xl font-bold ${resumen.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {resumen.totalFletes > 0
                    ? formatMoney(resumen.utilidadNeta / resumen.totalFletes)
                    : '$0.00'}
                </p>
              </div>
            </div>

            {/* Recomendaciones */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">Recomendaciones:</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {resumen.margenPromedio < 10 && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>El margen de utilidad es bajo. Considera revisar costos operativos o ajustar precios.</span>
                  </li>
                )}
                {resumen.fletesConPerdida > 0 && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>Hay {resumen.fletesConPerdida} flete(s) con pérdida. Revisa los gastos asociados.</span>
                  </li>
                )}
                {resumen.margenPromedio >= 20 && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Excelente desempeño este mes. El margen de utilidad está en un nivel óptimo.</span>
                  </li>
                )}
                {resumen.totalFletes === 0 && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span>No hay fletes registrados para este mes.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => navigate('/reportes')}
              className="btn-secondary"
            >
              Ver Reportes Detallados
            </button>
            <button
              onClick={() => navigate('/fletes')}
              className="btn-primary"
            >
              Ver Todos los Fletes
            </button>
          </div>
        </>
      )}
    </div>
  )
}
