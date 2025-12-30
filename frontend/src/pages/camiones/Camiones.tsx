import { useEffect, useState } from 'react'
import { PlusIcon, PencilIcon, TruckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { validations, mensajesError, formatters } from '../../lib/validations'

interface Camion {
  id: number
  placas: string
  numeroEconomico?: string
  marca?: string
  modelo?: string
  tipo: string
  rendimientoKmLCargado: number
  rendimientoKmLVacio: number
  activo: boolean
}

const TIPOS_CAMION = {
  TRAILER: 'Trailer',
  TORTON: 'Tortón',
  RABON: 'Rabón',
  CAMIONETA: 'Camioneta',
  LOWBOY: 'Lowboy (Cama Baja)',
}

export default function Camiones() {
  const [camiones, setCamiones] = useState<Camion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    placas: '',
    numeroEconomico: '',
    marca: '',
    modelo: '',
    tipo: 'TRAILER',
    rendimientoKmLCargado: '2.5',
    rendimientoKmLVacio: '3.0',
  })

  useEffect(() => {
    fetchCamiones()
  }, [])

  const fetchCamiones = async () => {
    try {
      const res = await api.get('/camiones')
      setCamiones(res.data)
    } catch {
      toast.error('Error al cargar camiones')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setForm({
      placas: '',
      numeroEconomico: '',
      marca: '',
      modelo: '',
      tipo: 'TRAILER',
      rendimientoKmLCargado: '2.5',
      rendimientoKmLVacio: '3.0',
    })
    setShowModal(true)
  }

  const openEditModal = (camion: Camion) => {
    setEditingId(camion.id)
    setForm({
      placas: camion.placas,
      numeroEconomico: camion.numeroEconomico || '',
      marca: camion.marca || '',
      modelo: camion.modelo || '',
      tipo: camion.tipo,
      rendimientoKmLCargado: camion.rendimientoKmLCargado.toString(),
      rendimientoKmLVacio: camion.rendimientoKmLVacio.toString(),
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    // Validaciones
    if (!form.placas) {
      toast.error(mensajesError.requerido)
      return
    }

    if (!validations.placas(form.placas)) {
      toast.error(mensajesError.placas)
      return
    }

    const rendCargado = Number(form.rendimientoKmLCargado)
    const rendVacio = Number(form.rendimientoKmLVacio)

    if (!validations.positivo(rendCargado) || !validations.positivo(rendVacio)) {
      toast.error('El rendimiento debe ser mayor a 0')
      return
    }

    if (rendCargado > rendVacio) {
      toast.error('El rendimiento cargado debe ser menor que el rendimiento vacío')
      return
    }

    const data = {
      placas: form.placas,
      numeroEconomico: form.numeroEconomico || undefined,
      marca: form.marca || undefined,
      modelo: form.modelo || undefined,
      tipo: form.tipo,
      rendimientoKmLCargado: Number(form.rendimientoKmLCargado),
      rendimientoKmLVacio: Number(form.rendimientoKmLVacio),
    }

    try {
      if (editingId) {
        await api.patch(`/camiones/${editingId}`, data)
        toast.success('Camión actualizado')
      } else {
        await api.post('/camiones', data)
        toast.success('Camión creado')
      }
      setShowModal(false)
      fetchCamiones()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar camión')
    }
  }

  const toggleActivo = async (id: number) => {
    try {
      await api.patch(`/camiones/${id}/toggle-activo`)
      toast.success('Estado actualizado')
      fetchCamiones()
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
          <h1 className="text-2xl font-bold text-gray-900">Camiones</h1>
          <p className="text-gray-500">Gestiona tu flota de vehículos</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Nuevo Camión
        </button>
      </div>

      {/* Tabla */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Placas</th>
              <th># Económico</th>
              <th>Marca/Modelo</th>
              <th>Tipo</th>
              <th>Rendimiento Cargado</th>
              <th>Rendimiento Vacío</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {camiones.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  <TruckIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  No hay camiones registrados
                </td>
              </tr>
            ) : (
              camiones.map((camion) => (
                <tr key={camion.id}>
                  <td className="font-medium text-gray-900">{camion.placas}</td>
                  <td className="text-gray-600">{camion.numeroEconomico || '-'}</td>
                  <td className="text-gray-600">
                    {camion.marca && camion.modelo
                      ? `${camion.marca} ${camion.modelo}`
                      : camion.marca || camion.modelo || '-'}
                  </td>
                  <td>
                    <span className="badge badge-info">{TIPOS_CAMION[camion.tipo as keyof typeof TIPOS_CAMION]}</span>
                  </td>
                  <td className="text-gray-600">{camion.rendimientoKmLCargado} km/L</td>
                  <td className="text-gray-600">{camion.rendimientoKmLVacio} km/L</td>
                  <td>
                    <button onClick={() => toggleActivo(camion.id)} className="focus:outline-none">
                      <span className={`badge ${camion.activo ? 'badge-success' : 'badge-gray'}`}>
                        {camion.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </button>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => openEditModal(camion)}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Editar Camión' : 'Nuevo Camión'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Placas *</label>
                  <input
                    className="input"
                    placeholder="ABC-123-D"
                    value={form.placas}
                    onChange={(e) => setForm({ ...form, placas: formatters.placas(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Número Económico</label>
                  <input
                    className="input"
                    placeholder="001"
                    value={form.numeroEconomico}
                    onChange={(e) => setForm({ ...form, numeroEconomico: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Marca</label>
                  <input
                    className="input"
                    placeholder="Kenworth"
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Modelo</label>
                  <input
                    className="input"
                    placeholder="T680"
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Tipo de Camión *</label>
                <select
                  className="input"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  {Object.entries(TIPOS_CAMION).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Rendimiento Cargado (km/L) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    placeholder="2.5"
                    value={form.rendimientoKmLCargado}
                    onChange={(e) => setForm({ ...form, rendimientoKmLCargado: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Consumo cuando va con carga</p>
                </div>
                <div>
                  <label className="label">Rendimiento Vacío (km/L) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    placeholder="3.0"
                    value={form.rendimientoKmLVacio}
                    onChange={(e) => setForm({ ...form, rendimientoKmLVacio: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Consumo cuando va sin carga</p>
                </div>
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
