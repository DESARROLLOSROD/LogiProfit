import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CurrencyDollarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import api from '../lib/api'
import { exportarDashboardAExcel } from '../lib/excelExport'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import NotificationControl from '../components/NotificationControl'
import { runAllNotificationChecks } from '../lib/notifications'

interface DashboardData {
  periodo: { mes: number; anio: number }
  resumen: {
    utilidadMes: number
    ingresosMes: number
    gastosMes: number
    margenPromedio: number
    totalFletesMes: number
    fletesActivos: number
    fletesConPerdida: number
  }
  tendenciaMensual: Array<{
    mes: number
    anio: number
    ingresos: number
    gastos: number
    utilidad: number
    margen: number
  }>
  topRentables: Array<{
    id: number
    folio: string
    utilidad: number
  }>
  topPerdidas: Array<{
    id: number
    folio: string
    utilidad: number
  }>
  topClientes: Array<{
    id: number
    nombre: string
    utilidad: number
    margen: number
    cantidadFletes: number
  }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/reportes/dashboard')

      // Convertir campos Decimal de Prisma (vienen como strings) a números
      const rawData = response.data
      const dataConvertida = {
        ...rawData,
        resumen: {
          ...rawData.resumen,
          utilidadMes: Number(rawData.resumen.utilidadMes) || 0,
          ingresosMes: Number(rawData.resumen.ingresosMes) || 0,
          gastosMes: Number(rawData.resumen.gastosMes) || 0,
          margenPromedio: Number(rawData.resumen.margenPromedio) || 0,
        },
        tendenciaMensual: rawData.tendenciaMensual.map((item: any) => ({
          ...item,
          ingresos: Number(item.ingresos) || 0,
          gastos: Number(item.gastos) || 0,
          utilidad: Number(item.utilidad) || 0,
          margen: Number(item.margen) || 0,
        })),
        topRentables: rawData.topRentables.map((item: any) => ({
          ...item,
          utilidad: Number(item.utilidad) || 0,
        })),
        topPerdidas: rawData.topPerdidas.map((item: any) => ({
          ...item,
          utilidad: Number(item.utilidad) || 0,
        })),
        topClientes: rawData.topClientes.map((item: any) => ({
          ...item,
          utilidad: Number(item.utilidad) || 0,
          margen: Number(item.margen) || 0,
        })),
      }

      setData(dataConvertida)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    // Verificar notificaciones cada 5 minutos
    if (!data) return

    const notificationInterval = setInterval(() => {
      runAllNotificationChecks({ fletes: data.topPerdidas })
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(notificationInterval)
  }, [data?.topPerdidas])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudieron cargar los datos</p>
      </div>
    )
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  const chartData = [
    { name: 'Ingresos', valor: data.resumen.ingresosMes, fill: '#10b981' },
    { name: 'Gastos', valor: data.resumen.gastosMes, fill: '#ef4444' },
    { name: 'Utilidad', valor: data.resumen.utilidadMes, fill: '#3b82f6' },
  ]

  const mesesNombres = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]

  const tendenciaChartData = data.tendenciaMensual.map((item) => ({
    mes: `${mesesNombres[item.mes - 1]} ${item.anio}`,
    Ingresos: item.ingresos,
    Gastos: item.gastos,
    Utilidad: item.utilidad,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Resumen del mes actual</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationControl />
          <button
            onClick={() => exportarDashboardAExcel(data)}
            className="btn-secondary flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Utilidad del Mes"
          value={formatMoney(data.resumen.utilidadMes)}
          icon={CurrencyDollarIcon}
          trend={data.resumen.utilidadMes >= 0 ? 'up' : 'down'}
          color="blue"
        />
        <StatCard
          title="Fletes Activos"
          value={data.resumen.fletesActivos.toString()}
          icon={TruckIcon}
          color="green"
        />
        <StatCard
          title="Fletes con Pérdida"
          value={data.resumen.fletesConPerdida.toString()}
          icon={ExclamationTriangleIcon}
          color={data.resumen.fletesConPerdida > 0 ? 'red' : 'gray'}
        />
        <StatCard
          title="Margen Promedio"
          value={`${data.resumen.margenPromedio.toFixed(1)}%`}
          icon={data.resumen.margenPromedio >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon}
          color={data.resumen.margenPromedio >= 20 ? 'green' : 'yellow'}
        />
      </div>

      {/* Tendencia Mensual - 6 meses */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tendencia de Rentabilidad (Últimos 6 Meses)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tendenciaChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatMoney(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Ingresos"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              <Line
                type="monotone"
                dataKey="Utilidad"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Mes Actual</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Bar dataKey="valor" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Clientes Rentables (3 meses)
          </h3>
          {data.topClientes.length > 0 ? (
            <ul className="space-y-3">
              {data.topClientes.map((cliente) => (
                <li key={cliente.id} className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">{cliente.nombre}</span>
                    <span className="text-green-600 font-semibold text-sm">
                      {formatMoney(cliente.utilidad)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{cliente.cantidadFletes} fletes</span>
                    <span className="text-xs text-gray-600">{cliente.margen.toFixed(1)}% margen</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No hay datos disponibles</p>
          )}
        </div>

        {/* Top Rentables */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fletes Más Rentables (Mes Actual)
          </h3>
          {data.topRentables.length > 0 ? (
            <ul className="space-y-3">
              {data.topRentables.map((flete) => (
                <li key={flete.id}>
                  <Link
                    to={`/fletes/${flete.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{flete.folio}</span>
                    <span className="text-green-600 font-semibold">
                      {formatMoney(flete.utilidad)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No hay fletes este mes</p>
          )}
        </div>
      </div>

      {/* Fletes con Pérdida */}
      {data.topPerdidas.length > 0 && (
        <div className="mt-6 card border-red-200 bg-red-50">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Fletes con Pérdida
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topPerdidas.map((flete) => (
              <Link
                key={flete.id}
                to={`/fletes/${flete.id}`}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:border-red-400 transition-colors"
              >
                <span className="font-medium text-gray-900">{flete.folio}</span>
                <span className="text-red-600 font-semibold">
                  {formatMoney(flete.utilidad)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/cotizaciones/nueva"
          className="card hover:shadow-md transition-shadow text-center"
        >
          <div className="text-primary-600 mb-2">
            <CurrencyDollarIcon className="w-8 h-8 mx-auto" />
          </div>
          <h4 className="font-medium text-gray-900">Nueva Cotización</h4>
          <p className="text-sm text-gray-500">Simula costos y utilidad</p>
        </Link>

        <Link
          to="/fletes"
          className="card hover:shadow-md transition-shadow text-center"
        >
          <div className="text-green-600 mb-2">
            <TruckIcon className="w-8 h-8 mx-auto" />
          </div>
          <h4 className="font-medium text-gray-900">Ver Fletes</h4>
          <p className="text-sm text-gray-500">Gestiona tus viajes</p>
        </Link>

        <Link
          to="/reportes"
          className="card hover:shadow-md transition-shadow text-center"
        >
          <div className="text-purple-600 mb-2">
            <ArrowTrendingUpIcon className="w-8 h-8 mx-auto" />
          </div>
          <h4 className="font-medium text-gray-900">Reportes</h4>
          <p className="text-sm text-gray-500">Análisis de rentabilidad</p>
        </Link>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down'
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray'
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}
