import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'

export default function Configuracion() {
  const { usuario } = useAuthStore()
  const [empresa, setEmpresa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre: '', rfc: '' })

  useEffect(() => { fetchEmpresa() }, [])

  const fetchEmpresa = async () => {
    try {
      const res = await api.get('/empresas/mi-empresa')
      setEmpresa(res.data)
      setForm({ nombre: res.data.nombre, rfc: res.data.rfc || '' })
    } catch {} finally { setLoading(false) }
  }

  const guardar = async () => {
    try {
      await api.patch('/empresas/mi-empresa', form)
      toast.success('Datos actualizados')
      fetchEmpresa()
    } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Configuración</h1><p className="text-gray-500">Administra tu cuenta y empresa</p></div>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Datos de la Empresa</h3>
        <div className="space-y-4">
          <div><label className="label">Nombre de la empresa</label><input className="input" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} /></div>
          <div><label className="label">RFC</label><input className="input" value={form.rfc} onChange={(e) => setForm({...form, rfc: e.target.value})} /></div>
          <div><label className="label">Plan actual</label><div className="p-3 bg-primary-50 rounded-lg"><span className="badge badge-info">{empresa?.plan}</span></div></div>
        </div>
        <button onClick={guardar} className="btn-primary mt-6">Guardar Cambios</button>
      </div>

      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Tu Cuenta</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Nombre</span><span className="font-medium">{usuario?.nombre}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Email</span><span className="font-medium">{usuario?.email}</span></div>
          <div className="flex justify-between py-2"><span className="text-gray-500">Rol</span><span className="badge badge-info">{usuario?.rol}</span></div>
        </div>
      </div>

      {empresa && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Estadísticas de la Empresa</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-2xl font-bold text-primary-600">{empresa._count?.usuarios || 0}</p><p className="text-sm text-gray-500">Usuarios</p></div>
            <div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-2xl font-bold text-primary-600">{empresa._count?.clientes || 0}</p><p className="text-sm text-gray-500">Clientes</p></div>
            <div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-2xl font-bold text-primary-600">{empresa._count?.camiones || 0}</p><p className="text-sm text-gray-500">Camiones</p></div>
            <div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-2xl font-bold text-primary-600">{empresa._count?.fletes || 0}</p><p className="text-sm text-gray-500">Fletes</p></div>
          </div>
        </div>
      )}
    </div>
  )
}
