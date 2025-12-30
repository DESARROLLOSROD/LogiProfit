import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, Edit2, X, Check } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

interface ChecklistItem {
  id: number
  descripcion: string
  completado: boolean
  orden: number
}

interface FleteChecklistProps {
  fleteId: number
}

export default function FleteChecklist({ fleteId }: FleteChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    fetchChecklist()
  }, [fleteId])

  const fetchChecklist = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/fletes/${fleteId}/checklist`)
      setItems(res.data)
    } catch (error) {
      console.error('Error al cargar checklist:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (itemId: number, completado: boolean) => {
    try {
      await api.patch(`/fletes/${fleteId}/checklist/${itemId}`, { completado })
      setItems(items.map(item =>
        item.id === itemId ? { ...item, completado } : item
      ))
    } catch (error) {
      toast.error('Error al actualizar item')
    }
  }

  const addItem = async () => {
    if (!newItemText.trim()) return

    try {
      const res = await api.post(`/fletes/${fleteId}/checklist`, {
        descripcion: newItemText.trim(),
      })
      setItems([...items, res.data])
      setNewItemText('')
      setShowAddForm(false)
      toast.success('Item agregado')
    } catch (error) {
      toast.error('Error al agregar item')
    }
  }

  const startEdit = (item: ChecklistItem) => {
    setEditingId(item.id)
    setEditText(item.descripcion)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = async (itemId: number) => {
    if (!editText.trim()) {
      cancelEdit()
      return
    }

    try {
      await api.put(`/fletes/${fleteId}/checklist/${itemId}/descripcion`, {
        descripcion: editText.trim(),
      })
      setItems(items.map(item =>
        item.id === itemId ? { ...item, descripcion: editText.trim() } : item
      ))
      cancelEdit()
      toast.success('Descripción actualizada')
    } catch (error) {
      toast.error('Error al actualizar descripción')
    }
  }

  const deleteItem = async (itemId: number) => {
    if (!confirm('¿Eliminar este item?')) return

    try {
      await api.delete(`/fletes/${fleteId}/checklist/${itemId}`)
      setItems(items.filter(item => item.id !== itemId))
      toast.success('Item eliminado')
    } catch (error) {
      toast.error('Error al eliminar item')
    }
  }

  const completedCount = items.filter(i => i.completado).length
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Checklist de Flete</h3>
          <p className="text-sm text-gray-500">
            {completedCount} de {items.length} completados ({progress.toFixed(0)}%)
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-secondary flex items-center gap-2"
        >
          {showAddForm ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Agregar
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progress === 100 ? 'bg-green-600' :
                progress >= 50 ? 'bg-blue-600' :
                'bg-gray-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="Descripción del nuevo item..."
            className="input mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-primary flex-1">
              <Check className="h-4 w-4 mr-2" />
              Guardar
            </button>
            <button onClick={() => {
              setShowAddForm(false)
              setNewItemText('')
            }} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No hay items en el checklist
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                item.completado
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleItem(item.id, !item.completado)}
                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {item.completado ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                )}
              </button>

              {/* Text */}
              {editingId === item.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') saveEdit(item.id)
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  onBlur={() => saveEdit(item.id)}
                  className="input flex-1"
                  autoFocus
                />
              ) : (
                <span
                  className={`flex-1 ${
                    item.completado
                      ? 'line-through text-gray-500'
                      : 'text-gray-900'
                  }`}
                >
                  {item.descripcion}
                </span>
              )}

              {/* Actions */}
              {!item.completado && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === item.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(item.id)}
                        className="p-1 hover:bg-green-100 rounded text-green-600"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
