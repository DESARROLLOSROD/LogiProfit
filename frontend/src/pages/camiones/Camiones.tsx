import { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Camion { id: number; placas: string; numeroEconomico?: string; marca?: string; modelo?: string; tipo: string; rendimientoKmL: number; activo: boolean }

export default function Camiones() {
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ placas: '', numeroEconomico: '', marca: '', modelo: '', tipo: 'TRAILER', rendimientoKmL: '3.5' })

  useEffect(() => { fetchCamiones() }, [])

  const fetchCamiones = async () => {
    try { const res = await api.get('/camiones'); setCamiones(res.data) } 
    catch {} finally { setLoading(false) }
  }

  const crear = async () => {
    try {
      await api.post('/camiones', { ...form, rendimientoKmL: Number(form.rendimientoKmL) })
      toast.success('Camión creado'); setShowModal(false); fetchCamiones()
    } catch {}
  }

  const toggleActivo = async (id: number) => {
    try { await api.patch(`/camiones/${id}/toggle-activo`); fetchCamiones() } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Camiones</h1><p className="text-gray-500">Gestiona tu flota de vehículos</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><PlusIcon className="w-5 h-5" />Nuevo Camión</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Placas</th><th># Económico</th><th>Marca/Modelo</th><th>Tipo</th><th>Rendimiento</th><th>Estado</th><th></th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {camiones.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.placas}</td>
                <td>{c.numeroEconomico || '-'}</td>
                <td>{c.marca} {c.modelo}</td>
                <td>{c.tipo}</td>
                <td>{c.rendimientoKmL} km/L</td>
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
            <h3 className="text-lg font-semibold mb-4">Nuevo Camión</h3>
            <div className="space-y-4">
              <div><label className="label">Placas *</label><input className="input" value={form.placas} onChange={(e) => setForm({...form, placas: e.target.value})} /></div>
              <div><label className="label"># Económico</label><input className="input" value={form.numeroEconomico} onChange={(e) => setForm({...form, numeroEconomico: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Marca</label><input className="input" value={form.marca} onChange={(e) => setForm({...form, marca: e.target.value})} /></div>
                <div><label className="label">Modelo</label><input className="input" value={form.modelo} onChange={(e) => setForm({...form, modelo: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Tipo</label><select className="input" value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})}><option value="TRAILER">Trailer</option><option value="TORTON">Tortón</option><option value="RABON">Rabón</option><option value="CAMIONETA">Camioneta</option></select></div>
                <div><label className="label">Rendimiento (km/L)</label><input type="number" step="0.1" className="input" value={form.rendimientoKmL} onChange={(e) => setForm({...form, rendimientoKmL: e.target.value})} /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-6"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={crear} className="btn-primary flex-1">Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
