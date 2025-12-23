import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PlusIcon, CheckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Flete {
  id: number
  folio: string
  cliente: { nombre: string }
  origen: string
  destino: string
  precioCliente: number
  estado: string
  camiones: Array<{ camion: { id: number; placas: string } }>
  choferes: Array<{ chofer: { id: number; nombre: string } }>
  gastos: Array<{
    id: number
    tipo: string
    concepto?: string
    monto: number
    fecha: string
    validado: boolean
  }>
  resumen: {
    precioCliente: number
    totalGastos: number
    utilidad: number
    margen: number
  }
}

export default function FleteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [flete, setFlete] = useState<Flete | null>(null)
  const [loading, setLoading] = useState(true)
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [nuevoGasto, setNuevoGasto] = useState({ tipo: 'DIESEL', monto: '', concepto: '' })

  useEffect(() => { fetchFlete() }, [id])

  const fetchFlete = async () => {
    try {
      const response = await api.get(`/fletes/${id}`)
      setFlete(response.data)
    } catch { navigate('/fletes') }
    finally { setLoading(false) }
  }

  const cambiarEstado = async (nuevoEstado: string) => {
    try {
      await api.patch(`/fletes/${id}/estado?estado=${nuevoEstado}`)
      toast.success('Estado actualizado')
      fetchFlete()
    } catch {}
  }

  const validarGasto = async (gastoId: number) => {
    try {
      await api.patch(`/gastos/${gastoId}/validar`)
      toast.success('Gasto validado')
      fetchFlete()
    } catch {}
  }

  const agregarGasto = async () => {
    try {
      await api.post('/gastos', {
        fleteId: Number(id),
        tipo: nuevoGasto.tipo,
        monto: Number(nuevoGasto.monto),
        concepto: nuevoGasto.concepto,
        fecha: new Date().toISOString(),
      })
      toast.success('Gasto agregado')
      setShowGastoModal(false)
      setNuevoGasto({ tipo: 'DIESEL', monto: '', concepto: '' })
      fetchFlete()
    } catch {}
  }

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!flete) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{flete.folio}</h1>
          <p className="text-gray-500">{flete.cliente.nombre}</p>
        </div>
        <div className="flex gap-2">
          {flete.estado === 'PLANEADO' && <button onClick={() => cambiarEstado('EN_CURSO')} className="btn-primary">Iniciar Viaje</button>}
          {flete.estado === 'EN_CURSO' && <button onClick={() => cambiarEstado('COMPLETADO')} className="btn-primary">Completar Viaje</button>}
          {flete.estado === 'COMPLETADO' && <button onClick={() => cambiarEstado('CERRADO')} className="btn-secondary">Cerrar Flete</button>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><p className="text-sm text-gray-500">Precio Cliente</p><p className="text-xl font-bold">{formatMoney(flete.resumen.precioCliente)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Total Gastos</p><p className="text-xl font-bold text-red-600">{formatMoney(flete.resumen.totalGastos)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Utilidad</p><p className={`text-xl font-bold ${flete.resumen.utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(flete.resumen.utilidad)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-500">Margen</p><p className="text-xl font-bold text-blue-600">{flete.resumen.margen.toFixed(1)}%</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Información del Viaje</h3>
          <dl className="space-y-3">
            <div className="flex justify-between"><dt className="text-gray-500">Origen</dt><dd className="font-medium">{flete.origen}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Destino</dt><dd className="font-medium">{flete.destino}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Estado</dt><dd><span className="badge badge-info">{flete.estado.replace('_', ' ')}</span></dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Camión</dt><dd className="font-medium">{flete.camiones[0]?.camion.placas || 'Sin asignar'}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Chofer</dt><dd className="font-medium">{flete.choferes[0]?.chofer.nombre || 'Sin asignar'}</dd></div>
          </dl>
        </div>

        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Gastos</h3>
            <button onClick={() => setShowGastoModal(true)} className="btn-primary flex items-center gap-1 text-sm py-1.5"><PlusIcon className="w-4 h-4" />Agregar</button>
          </div>
          <table className="min-w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 font-medium text-gray-500">Tipo</th><th className="text-left py-2 font-medium text-gray-500">Concepto</th><th className="text-right py-2 font-medium text-gray-500">Monto</th><th className="text-center py-2 font-medium text-gray-500">Validado</th><th></th></tr></thead>
            <tbody>
              {flete.gastos.map((gasto) => (
                <tr key={gasto.id} className="border-b">
                  <td className="py-2">{gasto.tipo}</td>
                  <td className="py-2 text-gray-500">{gasto.concepto || '-'}</td>
                  <td className="py-2 text-right font-medium">{formatMoney(gasto.monto)}</td>
                  <td className="py-2 text-center">{gasto.validado ? <CheckIcon className="w-5 h-5 text-green-600 mx-auto" /> : <span className="text-yellow-600">Pendiente</span>}</td>
                  <td className="py-2">{!gasto.validado && <button onClick={() => validarGasto(gasto.id)} className="text-primary-600 hover:underline text-xs">Validar</button>}</td>
                </tr>
              ))}
              {flete.gastos.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No hay gastos registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showGastoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Agregar Gasto</h3>
            <div className="space-y-4">
              <div><label className="label">Tipo</label><select className="input" value={nuevoGasto.tipo} onChange={(e) => setNuevoGasto({...nuevoGasto, tipo: e.target.value})}><option value="DIESEL">Diesel</option><option value="CASETAS">Casetas</option><option value="VIATICOS">Viáticos</option><option value="MANTENIMIENTO">Mantenimiento</option><option value="MULTA">Multa</option><option value="OTRO">Otro</option></select></div>
              <div><label className="label">Monto</label><input type="number" className="input" value={nuevoGasto.monto} onChange={(e) => setNuevoGasto({...nuevoGasto, monto: e.target.value})} placeholder="0.00" /></div>
              <div><label className="label">Concepto</label><input className="input" value={nuevoGasto.concepto} onChange={(e) => setNuevoGasto({...nuevoGasto, concepto: e.target.value})} placeholder="Descripción..." /></div>
            </div>
            <div className="flex gap-2 mt-6"><button onClick={() => setShowGastoModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={agregarGasto} className="btn-primary flex-1">Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
