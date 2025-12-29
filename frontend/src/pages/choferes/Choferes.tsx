import { useEffect, useState } from 'react'
import { PlusIcon, PencilIcon, UserIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface Chofer {
  id: number
  nombre: string
  telefono?: string
  tipo: string
  tipoPago: string
  tarifa: number
  activo: boolean
}

const TIPOS_CHOFER = {
  FIJO: 'Fijo',
  ROTATIVO: 'Rotativo',
}

const TIPOS_PAGO = {
  POR_DIA: 'Por Día',
  POR_KM: 'Por Kilómetro',
  POR_VIAJE: 'Por Viaje',
  POR_QUINCENA: 'Por Quincena',
  MENSUAL: 'Mensual',
}

export default function Choferes() {
  const [choferes, setChoferes] = useState<Chofer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    tipo: 'FIJO',
    tipoPago: 'POR_DIA',
    tarifa: '600',
  })

  useEffect(() => {
    fetchChoferes()
  }, [])

  const fetchChoferes = async () => {
    try {
      const res = await api.get('/choferes')
      setChoferes(res.data)
    } catch {
      toast.error('Error al cargar choferes')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setForm({
      nombre: '',
      telefono: '',
      tipo: 'FIJO',
      tipoPago: 'POR_DIA',
      tarifa: '600',
    })
    setShowModal(true)
  }

  const openEditModal = (chofer: Chofer) => {
    setEditingId(chofer.id)
    setForm({
      nombre: chofer.nombre,
      telefono: chofer.telefono || '',
      tipo: chofer.tipo,
      tipoPago: chofer.tipoPago,
      tarifa: chofer.tarifa.toString(),
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!form.nombre) {
      toast.error('El nombre es obligatorio')
      return
    }

    if (!form.tarifa || Number(form.tarifa) <= 0) {
      toast.error('La tarifa es obligatoria y debe ser mayor a 0')
      return
    }

    const data = {
      nombre: form.nombre,
      telefono: form.telefono || undefined,
      tipo: form.tipo,
      tipoPago: form.tipoPago,
      tarifa: Number(form.tarifa),
    }

    try {
      if (editingId) {
        await api.patch(`/choferes/${editingId}`, data)
        toast.success('Chofer actualizado')
      } else {
        await api.post('/choferes', data)
        toast.success('Chofer creado')
      }
      setShowModal(false)
      fetchChoferes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar chofer')
    }
  }

  const toggleActivo = async (id: number) => {
    try {
      await api.patch(`/choferes/${id}/toggle-activo`)
      toast.success('Estado actualizado')
      fetchChoferes()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)

  const getTarifaDisplay = (chofer: Chofer) => {
    const tarifa = formatMoney(chofer.tarifa || 0)
    switch (chofer.tipoPago) {
      case 'POR_DIA':
        return `${tarifa}/día`
      case 'POR_KM':
        return `${tarifa}/km`
      case 'POR_VIAJE':
        return `${tarifa}/viaje`
      case 'POR_QUINCENA':
        return `${tarifa}/quincena`
      case 'MENSUAL':
        return `${tarifa}/mes`
      default:
        return tarifa
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
          <h1 className="text-2xl font-bold text-gray-900">Choferes</h1>
          <p className="text-gray-500">Gestiona tus operadores</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nuevo Chofer
        </button>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Tipo</th>
              <th>Forma de Pago</th>
              <th>Tarifa</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {choferes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  No hay choferes registrados
                </td>
              </tr>
            ) : (
              choferes.map((chofer) => (
                <tr key={chofer.id}>
                  <td className="font-medium text-gray-900">{chofer.nombre}</td>
                  <td className="text-gray-600">{chofer.telefono || '-'}</td>
                  <td>
                    <span
                      className={`badge ${
                        chofer.tipo === 'FIJO' ? 'badge-info' : 'badge-gray'
                      }`}
                    >
                      {TIPOS_CHOFER[chofer.tipo as keyof typeof TIPOS_CHOFER]}
                    </span>
                  </td>
                  <td className="text-gray-600">
                    {TIPOS_PAGO[chofer.tipoPago as keyof typeof TIPOS_PAGO]}
                  </td>
                  <td className="text-gray-900 font-medium">{getTarifaDisplay(chofer)}</td>
                  <td>
                    <button onClick={() => toggleActivo(chofer.id)} className="focus:outline-none">
                      <span className={`badge ${chofer.activo ? 'badge-success' : 'badge-gray'}`}>
                        {chofer.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => openEditModal(chofer)}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Editar Chofer' : 'Nuevo Chofer'}
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
                <label className="label">Teléfono</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="3312345678"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo de Chofer</label>
                  <select
                    className="input"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    {Object.entries(TIPOS_CHOFER).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Forma de Pago *</label>
                  <select
                    className="input"
                    value={form.tipoPago}
                    onChange={(e) => setForm({ ...form, tipoPago: e.target.value })}
                  >
                    {Object.entries(TIPOS_PAGO).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  Tarifa {form.tipoPago === 'POR_DIA' && 'por Día'}
                  {form.tipoPago === 'POR_KM' && 'por Kilómetro'}
                  {form.tipoPago === 'POR_VIAJE' && 'por Viaje'}
                  {form.tipoPago === 'POR_QUINCENA' && 'Quincenal'}
                  {form.tipoPago === 'MENSUAL' && 'Mensual'} *
                </label>
                <input
                  type="number"
                  min="0"
                  step={form.tipoPago === 'POR_KM' ? '0.5' : '50'}
                  className="input"
                  placeholder={
                    form.tipoPago === 'POR_DIA'
                      ? '600'
                      : form.tipoPago === 'POR_KM'
                        ? '5'
                        : form.tipoPago === 'POR_VIAJE'
                          ? '3000'
                          : form.tipoPago === 'POR_QUINCENA'
                            ? '9000'
                            : '18000'
                  }
                  value={form.tarifa}
                  onChange={(e) => setForm({ ...form, tarifa: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.tipoPago === 'POR_DIA' && 'Monto que se paga por día trabajado'}
                  {form.tipoPago === 'POR_KM' && 'Monto que se paga por km recorrido'}
                  {form.tipoPago === 'POR_VIAJE' && 'Monto fijo por viaje completado'}
                  {form.tipoPago === 'POR_QUINCENA' && 'Monto fijo pagado cada quincena (15 días)'}
                  {form.tipoPago === 'MENSUAL' && 'Monto fijo pagado mensualmente (30 días)'}
                </p>
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
