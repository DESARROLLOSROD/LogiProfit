import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '../../lib/api'

interface FormData {
    clienteId: string
    origen: string
    destino: string
    tipoCarga: string
    pesoCarga: string
    dimensiones: string
    kmEstimado: string
    precioCotizado: string
    notas: string
    validoHasta: string
}

interface Cliente {
    id: number
    nombre: string
}

export default function EditarCotizacion() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState<FormData>({
        clienteId: '',
        origen: '',
        destino: '',
        tipoCarga: '',
        pesoCarga: '',
        dimensiones: '',
        kmEstimado: '',
        precioCotizado: '',
        notas: '',
        validoHasta: '',
    })

    useEffect(() => {
        const init = async () => {
            try {
                const [clientesRes, cotizacionRes] = await Promise.all([
                    api.get('/clientes'),
                    api.get(`/cotizaciones/${id}`)
                ])

                setClientes(clientesRes.data)
                const cot = cotizacionRes.data

                setFormData({
                    clienteId: String(cot.cliente.id),
                    origen: cot.origen,
                    destino: cot.destino,
                    tipoCarga: cot.tipoCarga || '',
                    pesoCarga: cot.pesoCarga ? String(cot.pesoCarga) : '',
                    dimensiones: cot.dimensiones || '',
                    kmEstimado: String(cot.kmEstimado),
                    precioCotizado: String(cot.precioCotizado),
                    notas: cot.notas || '',
                    validoHasta: cot.validoHasta ? cot.validoHasta.split('T')[0] : '',
                })
            } catch (error) {
                console.error('Error al cargar datos:', error)
                toast.error('Error al cargar los datos de la cotización')
                navigate('/cotizaciones')
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [id, navigate])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.clienteId || !formData.origen || !formData.destino || !formData.kmEstimado || !formData.precioCotizado) {
            toast.error('Por favor completa todos los campos obligatorios')
            return
        }

        setSaving(true)
        try {
            const payload = {
                clienteId: Number(formData.clienteId),
                origen: formData.origen,
                destino: formData.destino,
                tipoCarga: formData.tipoCarga || undefined,
                pesoCarga: formData.pesoCarga ? Number(formData.pesoCarga) : undefined,
                dimensiones: formData.dimensiones || undefined,
                kmEstimado: Number(formData.kmEstimado),
                precioCotizado: Number(formData.precioCotizado),
                notas: formData.notas || undefined,
                validoHasta: formData.validoHasta ? new Date(formData.validoHasta).toISOString() : undefined,
            }

            await api.put(`/cotizaciones/${id}`, payload)
            toast.success('Cotización actualizada exitosamente')
            navigate(`/cotizaciones/${id}`)
        } catch (error: any) {
            console.error('Error al actualizar cotización:', error)
            toast.error(error.response?.data?.message || 'Error al actualizar cotización')
        } finally {
            setSaving(false)
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
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(`/cotizaciones/${id}`)}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Volver al detalle
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Editar Cotización</h1>
                <p className="text-gray-600 mt-1">Modifica los datos de la cotización existente</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">

                {/* Cliente */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente *
                    </label>
                    <select
                        name="clienteId"
                        value={formData.clienteId}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Selecciona un cliente</option>
                        {clientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                                {cliente.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Ruta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Origen *
                        </label>
                        <input
                            type="text"
                            name="origen"
                            value={formData.origen}
                            onChange={handleChange}
                            required
                            placeholder="Ej: Ciudad de México"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destino *
                        </label>
                        <input
                            type="text"
                            name="destino"
                            value={formData.destino}
                            onChange={handleChange}
                            required
                            placeholder="Ej: Monterrey, NL"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Información de Carga */}
                <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de la Carga (Opcional)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Carga
                            </label>
                            <input
                                type="text"
                                name="tipoCarga"
                                value={formData.tipoCarga}
                                onChange={handleChange}
                                placeholder="Ej: Carga general"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Peso (Toneladas)
                            </label>
                            <input
                                type="number"
                                name="pesoCarga"
                                value={formData.pesoCarga}
                                onChange={handleChange}
                                step="0.01"
                                placeholder="Ej: 20"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dimensiones
                            </label>
                            <input
                                type="text"
                                name="dimensiones"
                                value={formData.dimensiones}
                                onChange={handleChange}
                                placeholder="Ej: 12 x 2.5 x 2.6 M"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Kilometraje y Precio */}
                <div className="border-t pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Kilometraje y Precio</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kilómetros Estimados *
                            </label>
                            <input
                                type="number"
                                name="kmEstimado"
                                value={formData.kmEstimado}
                                onChange={handleChange}
                                required
                                step="0.01"
                                placeholder="Ej: 1800"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio Cotizado (MXN) *
                            </label>
                            <input
                                type="number"
                                name="precioCotizado"
                                value={formData.precioCotizado}
                                onChange={handleChange}
                                required
                                step="0.01"
                                placeholder="Ej: 45000"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Notas y Validez */}
                <div className="border-t pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notas
                            </label>
                            <textarea
                                name="notas"
                                value={formData.notas}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Notas adicionales sobre la cotización..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Válido Hasta
                            </label>
                            <input
                                type="date"
                                name="validoHasta"
                                value={formData.validoHasta}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                        type="button"
                        onClick={() => navigate(`/cotizaciones/${id}`)}
                        className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <CheckIcon className="h-5 w-5" />
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    )
}
