import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'

export default function Reportes() {
  const navigate = useNavigate()
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [reporte, setReporte] = useState<any>(null)
  const [tipoReporte, setTipoReporte] = useState('rentabilidad')
  const [loading, setLoading] = useState(false)

  const generarReporte = async () => {
    setLoading(true)
    try {
      const endpoint = tipoReporte === 'rentabilidad' ? 'rentabilidad' : tipoReporte === 'gastos' ? 'gastos-por-tipo' : 'por-cliente'
      const res = await api.get(`/reportes/${endpoint}?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`)
      setReporte(res.data)
    } catch {} finally { setLoading(false) }
  }

  const formatMoney = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500">Analiza la rentabilidad de tu operación</p>
        </div>
        <button
          onClick={() => navigate('/reportes/resumen-mensual')}
          className="btn-primary flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Resumen Mensual
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div><label className="label">Tipo de Reporte</label><select className="input" value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)}><option value="rentabilidad">Rentabilidad por Flete</option><option value="gastos">Gastos por Tipo</option><option value="cliente">Rentabilidad por Cliente</option></select></div>
          <div><label className="label">Desde</label><input type="date" className="input" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} /></div>
          <div><label className="label">Hasta</label><input type="date" className="input" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} /></div>
          <button onClick={generarReporte} className="btn-primary">{loading ? 'Generando...' : 'Generar Reporte'}</button>
        </div>
      </div>

      {reporte && tipoReporte === 'rentabilidad' && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="stat-card"><p className="text-sm text-gray-500">Total Ingresos</p><p className="text-xl font-bold">{formatMoney(reporte.totales.ingresos)}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500">Total Gastos</p><p className="text-xl font-bold text-red-600">{formatMoney(reporte.totales.gastos)}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500">Utilidad Neta</p><p className={`text-xl font-bold ${reporte.totales.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(reporte.totales.utilidad)}</p></div>
            <div className="stat-card"><p className="text-sm text-gray-500">Margen Promedio</p><p className="text-xl font-bold text-blue-600">{reporte.totales.margenPromedio.toFixed(1)}%</p></div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Detalle por Flete</h3>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Folio</th><th>Cliente</th><th>Ruta</th><th>Ingresos</th><th>Gastos</th><th>Utilidad</th><th>Margen</th></tr></thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporte.detalle.map((f: any) => (
                    <tr key={f.id}>
                      <td className="font-medium">{f.folio}</td>
                      <td>{f.cliente}</td>
                      <td className="text-sm text-gray-500">{f.origen} → {f.destino}</td>
                      <td>{formatMoney(f.precioCliente)}</td>
                      <td className="text-red-600">{formatMoney(f.totalGastos)}</td>
                      <td className={f.utilidad >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{formatMoney(f.utilidad)}</td>
                      <td>{f.margen.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reporte && tipoReporte === 'gastos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Distribución de Gastos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reporte.porTipo} dataKey="total" nameKey="tipo" cx="50%" cy="50%" outerRadius={80} label={({ tipo, porcentaje }) => `${tipo} ${porcentaje.toFixed(0)}%`}>
                    {reporte.porTipo.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatMoney(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Gastos por Tipo</h3>
            <div className="space-y-3">
              {reporte.porTipo.map((g: any, i: number) => (
                <div key={g.tipo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div><span className="font-medium">{g.tipo}</span></div>
                  <div className="text-right"><p className="font-semibold">{formatMoney(g.total)}</p><p className="text-sm text-gray-500">{g.cantidad} gastos</p></div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between font-semibold"><span>Total</span><span>{formatMoney(reporte.totalGeneral)}</span></div>
          </div>
        </div>
      )}

      {reporte && tipoReporte === 'cliente' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Rentabilidad por Cliente</h3>
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reporte.clientes.slice(0, 10)}>
                <XAxis dataKey="clienteNombre" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatMoney(value)} />
                <Bar dataKey="utilidad" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Cliente</th><th>Fletes</th><th>Ingresos</th><th>Gastos</th><th>Utilidad</th><th>Margen</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reporte.clientes.map((c: any) => (
                  <tr key={c.clienteId}>
                    <td className="font-medium">{c.clienteNombre}</td>
                    <td>{c.cantidadFletes}</td>
                    <td>{formatMoney(c.ingresos)}</td>
                    <td className="text-red-600">{formatMoney(c.gastos)}</td>
                    <td className={c.utilidad >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{formatMoney(c.utilidad)}</td>
                    <td>{c.margen.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
