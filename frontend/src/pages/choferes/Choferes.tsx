import { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Chofer { id: number; nombre: string; telefono?: string; tipo: string; tipoPago: string; tarifa: number; activo: boolean }

export default function Choferes() {
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '', tipo: 'FIJO', tipoPago: 'POR_DIA', tarifa: '600' })

  useEffect(() => { fetchChoferes() }, [])
  const fetchChoferes = async () => { try { const res = await api.get('/choferes'); setChoferes(res.data) } catch {} finally { setLoading(false) } }

  const crear = async () => {
    try {
      await api.post('/choferes', { ...form, tarifa: Number(form.tarifa) })
      toast.success('Chofer creado'); setShowModal(false); fetchChoferes()
    } catch {}
  }

  const toggleActivo = async (id: number) => { try { await api.patch(`/choferes/${id}/toggle-activo`); fetchChoferes() } catch {} }
  const formatMoney = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
  const getTipoPagoLabel = (tipo: string) => ({ POR_DIA: '/día', POR_KM: '/km', POR_VIAJE: '/viaje' }[tipo] || '')

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Choferes</h1><p className="text-gray-500">Gestiona tus operadores</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><PlusIcon className="w-5 h-5" />Nuevo Chofer</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Nombre</th><th>Teléfono</th><th>Tipo</th><th>Forma de Pago</th><th>Tarifa</th><th>Estado</th><th></th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {choferes.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.nombre}</td>
                <td>{c.telefono || '-'}</td>
                <td><span className={`badge ${c.tipo === 'FIJO' ? 'badge-info' : 'badge-gray'}`}>{c.tipo}</span></td>
                <td>{c.tipoPago.replace('_', ' ')}</td>
                <td>{formatMoney(c.tarifa)}{getTipoPagoLabel(c.tipoPago)}</td>
                <td><span className={`badge ${c.activo ? 'badge-success' : 'badge-gray'}`}>{c.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td><button onClick={() => toggleActivo(c.id)} className="text-primary-600 hover:underline text-sm">{c.activo ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo Chofer</h3>
            <div className="space-y-4">
              <div><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} /></div>
              <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Tipo</label><select className="input" value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})}><option value="FIJO">Fijo</option><option value="ROTATIVO">Rotativo</option></select></div>
                <div><label className="label">Forma de Pago</label><select className="input" value={form.tipoPago} onChange={(e) => setForm({...form, tipoPago: e.target.value})}><option value="POR_DIA">Por día</option><option value="POR_KM">Por km</option><option value="POR_VIAJE">Por viaje</option></select></div>
              </div>
              <div><label className="label">Tarifa</label><input type="number" className="input" value={form.tarifa} onChange={(e) => setForm({...form, tarifa: e.target.value})} /></div>
            </div>
            <div className="flex gap-2 mt-6"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={crear} className="btn-primary flex-1">Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
