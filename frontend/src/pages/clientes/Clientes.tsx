import { useEffect, useState } from 'react'
import { PlusIcon, PencilIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Cliente {
  id: number
  nombre: string
  rfc?: string
  email?: string
  telefono?: string
  direccion?: string
  activo: boolean
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    rfc: '',
    email: '',
    telefono: '',
    direccion: '',
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes')
      setClientes(res.data)
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setForm({
      nombre: '',
      rfc: '',
      email: '',
      telefono: '',
      direccion: '',
    })
    setShowModal(true)
  }

  const openEditModal = (cliente: Cliente) => {
    setEditingId(cliente.id)
    setForm({
      nombre: cliente.nombre,
      rfc: cliente.rfc || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.nombre) {
      toast.error('El nombre es obligatorio')
      return
    }

    const data = {
      nombre: form.nombre,
      rfc: form.rfc || undefined,
      email: form.email || undefined,
      telefono: form.telefono || undefined,
      direccion: form.direccion || undefined,
    }

    try {
      if (editingId) {
        await api.patch(`/clientes/${editingId}`, data)
        toast.success('Cliente actualizado')
      } else {
        await api.post('/clientes', data)
        toast.success('Cliente creado')
      }
      setShowModal(false)
      fetchClientes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar cliente')
    }
  }

  const toggleActivo = async (id: number) => {
    try {
      await api.patch(`/clientes/${id}/toggle-activo`)
      toast.success('Estado actualizado')
      fetchClientes()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gestiona tu cartera de clientes</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RFC</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  No hay clientes registrados
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="font-medium text-gray-900">{cliente.nombre}</td>
                  <td className="text-gray-600">{cliente.rfc || '-'}</td>
                  <td className="text-gray-600">{cliente.email || '-'}</td>
                  <td className="text-gray-600">{cliente.telefono || '-'}</td>
                  <td>
                    <button onClick={() => toggleActivo(cliente.id)} className="focus:outline-none">
                      <span className={`badge ${cliente.activo ? 'badge-success' : 'badge-gray'}`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => openEditModal(cliente)}
                      className="text-primary-600 hover:text-primary-800 p-1"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Nombre o Razón Social *</label>
                <input
                  className="input"
                  placeholder="Transportes del Norte S.A. de C.V."
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">RFC</label>
                  <input
                    className="input"
                    placeholder="TDN123456ABC"
                    value={form.rfc}
                    onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
                    maxLength={13}
                  />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="3312345678"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="contacto@cliente.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Dirección</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Calle, Número, Colonia, Ciudad, Estado"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={handleSubmit} className="btn-primary flex-1">
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
