import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, EyeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import api from '../../lib/api'
import { toast } from 'react-hot-toast'

export default function CalculosList() {
    const [calculos, setCalculos] = useState([])
    const [cargando, setCargando] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        cargarCalculos()
    }, [])

    const cargarCalculos = async () => {
        try {
            const { data } = await api.get('/calculos')
            setCalculos(data)
        } catch (error) {
            toast.error('Error al cargar cálculos')
        } finally {
            setCargando(false)
        }
    }

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount)
    }

    const convertirACotizacion = (calculo: any) => {
        // Navegar a crear cotización pasando el cálculo como estado o query params
        // Asumiremos que NuevoCotizacion puede leer el state de ubicación
        navigate('/cotizaciones/nueva', { state: { calculoOrigen: calculo } })
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Cálculos de Costos</h1>
                <Link
                    to="/calculos/nuevo"
                    className="btn btn-primary flex items-center gap-2"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Cálculo
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cargando ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center">Cargando...</td>
                                </tr>
                            ) : calculos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No hay cálculos registrados</td>
                                </tr>
                            ) : (
                                calculos.map((calculo: any) => (
                                    <tr key={calculo.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                                            {calculo.folio}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                            {calculo.cliente?.nombre || 'Cliente General'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-gray-400">ORIGEN: {calculo.origen}</span>
                                                <span className="text-xs font-medium text-gray-400">DESTINO: {calculo.destino}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                            {formatMoney(calculo.totalCosto)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                                            {formatMoney(calculo.precioVenta)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                            {new Date(calculo.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    title="Convertir a Cotización"
                                                    onClick={() => convertirACotizacion(calculo)}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <CurrencyDollarIcon className="h-5 w-5" />
                                                </button>
                                                <Link
                                                    to={`/calculos/${calculo.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
