import { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Cliente { id: number; nombre: string; rfc?: string; email?: string; telefono?: string; activo: boolean }

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', rfc: '', email: '', telefono: '' })

  useEffect(() => { fetchClientes() }, [])
  const fetchClientes = async () => { try { const res = await api.get('/clientes'); setClientes(res.data) } catch {} finally { setLoading(false) } }

  const crear = async () => {
    try { await api.post('/clientes', form); toast.success('Cliente creado'); setShowModal(false); fetchClientes() } catch {}
  }

  const toggleActivo = async (id: number) => { try { await api.patch(`/clientes/${id}/toggle-activo`); fetchClientes() } catch {} }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Clientes</h1><p className="text-gray-500">Gestiona tu cartera de clientes</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><PlusIcon className="w-5 h-5" />Nuevo Cliente</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Nombre</th><th>RFC</th><th>Email</th><th>Teléfono</th><th>Estado</th><th></th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.nombre}</td>
                <td>{c.rfc || '-'}</td>
                <td>{c.email || '-'}</td>
                <td>{c.telefono || '-'}</td>
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
            <h3 className="text-lg font-semibold mb-4">Nuevo Cliente</h3>
            <div className="space-y-4">
              <div><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} /></div>
              <div><label className="label">RFC</label><input className="input" value={form.rfc} onChange={(e) => setForm({...form, rfc: e.target.value})} /></div>
              <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
              <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} /></div>
            </div>
            <div className="flex gap-2 mt-6"><button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button><button onClick={crear} className="btn-primary flex-1">Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
