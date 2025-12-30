import { useEffect, useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Usuario {
  id: number
  nombre: string
  email: string
  rol: 'ADMIN' | 'OPERADOR' | 'CHOFER' | 'CONTABILIDAD' | 'DIRECCION'
  activo: boolean
  createdAt: string
}

const ROLES = {
  ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
  OPERADOR: { label: 'Operador', color: 'bg-blue-100 text-blue-800' },
  CHOFER: { label: 'Chofer', color: 'bg-green-100 text-green-800' },
  CONTABILIDAD: { label: 'Contabilidad', color: 'bg-yellow-100 text-yellow-800' },
  DIRECCION: { label: 'Dirección', color: 'bg-red-100 text-red-800' },
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'OPERADOR' as Usuario['rol'],
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/usuarios')
      setUsuarios(res.data)
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setForm({ nombre: '', email: '', password: '', rol: 'OPERADOR' })
    setShowModal(true)
  }

  const openEditModal = (usuario: Usuario) => {
    setEditingId(usuario.id)
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        // Editar: no enviar password si está vacío
        const data = form.password
          ? form
          : { nombre: form.nombre, email: form.email, rol: form.rol }
        await api.patch(`/usuarios/${editingId}`, data)
        toast.success('Usuario actualizado')
      } else {
        // Crear: password obligatorio
        if (!form.password || form.password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres')
          return
        }
        await api.post('/usuarios', form)
        toast.success('Usuario creado')
      }
      setShowModal(false)
      fetchUsuarios()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar usuario')
    }
  }

  const toggleActivo = async (id: number) => {
    try {
      await api.patch(`/usuarios/${id}/toggle-activo`)
      toast.success('Estado actualizado')
      fetchUsuarios()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/usuarios/${id}`)
      toast.success('Usuario eliminado')
      setShowDeleteModal(null)
      fetchUsuarios()
    } catch (error) {
      toast.error('Error al eliminar usuario')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500">Gestiona los usuarios de tu empresa</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  <UserCircleIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="font-medium text-gray-900">{usuario.nombre}</td>
                  <td className="text-gray-600">{usuario.email}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ROLES[usuario.rol].color
                      }`}
                    >
                      {ROLES[usuario.rol].label}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActivo(usuario.id)}
                      className="focus:outline-none"
                    >
                      <span
                        className={`badge ${
                          usuario.activo ? 'badge-success' : 'badge-gray'
                        }`}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                  </td>
                  <td className="text-gray-600 text-sm">
                    {new Date(usuario.createdAt).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEditModal(usuario)}
                        className="text-primary-600 hover:text-primary-800 p-1"
                        title="Editar"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(usuario.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Nombre Completo *</label>
                <input
                  className="input"
                  placeholder="Juan Pérez García"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="juan@empresa.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  Contraseña {editingId && '(dejar vacío para no cambiar)'}
                  {!editingId && ' *'}
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder={editingId ? '••••••••' : 'Mínimo 6 caracteres'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Rol *</label>
                <select
                  className="input"
                  value={form.rol}
                  onChange={(e) =>
                    setForm({ ...form, rol: e.target.value as Usuario['rol'] })
                  }
                >
                  {Object.entries(ROLES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {form.rol === 'ADMIN' && 'Acceso total al sistema'}
                  {form.rol === 'OPERADOR' && 'Crear cotizaciones y gestionar fletes'}
                  {form.rol === 'CHOFER' && 'Registrar gastos de viaje'}
                  {form.rol === 'CONTABILIDAD' && 'Validar gastos y ver reportes'}
                  {form.rol === 'DIRECCION' && 'Ver todos los reportes y estadísticas'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button onClick={handleSubmit} className="btn-primary flex-1">
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2 text-red-600">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se
              puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
