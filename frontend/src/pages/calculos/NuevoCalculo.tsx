import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, CalculatorIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import api from '../../lib/api'

interface CalculoState {
    clienteId: number
    ruta: { origen: string; destino: string; kmsCargado: number; kmsVacio: number }
    diesel: { rendimientoCargado: number; rendimientoVacio: number; precio: number }
    gastos: { casetas: number; permisos: number; otros: number }
    viaticos: {
        comidasQty: number; precioComidas: number;
        federalesQty: number; precioFederales: number;
        telefono: number; imprevistos: number;
    }
    carroPiloto: { activo: boolean; gastos: number }
    factores: { mantenimiento: number; indirectos: number; utilidad: number }
}

export default function NuevoCalculo() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [clientes, setClientes] = useState<any[]>([])

    const [state, setState] = useState<CalculoState>({
        clienteId: 0,
        ruta: { origen: '', destino: '', kmsCargado: 0, kmsVacio: 0 },
        diesel: { rendimientoCargado: 1.9, rendimientoVacio: 2.1, precio: 24.00 },
        gastos: { casetas: 0, permisos: 0, otros: 0 },
        viaticos: {
            comidasQty: 0, precioComidas: 120,
            federalesQty: 0, precioFederales: 100,
            telefono: 0, imprevistos: 0
        },
        carroPiloto: { activo: false, gastos: 0 },
        factores: { mantenimiento: 25, indirectos: 20, utilidad: 25 }
    })

    // Computed Values
    const [results, setResults] = useState({
        litros: 0, costDiesel: 0, totalViaticos: 0, costPiloto: 0,
        subtotalDirecto: 0, montoMantenimiento: 0, montoIndirectos: 0,
        costoTotal: 0, precioVenta: 0
    })

    useEffect(() => {
        cargarClientes()
        if (id) cargarCalculo(id)
    }, [id])

    useEffect(() => {
        calcular()
    }, [state])

    const cargarClientes = async () => {
        try {
            const { data } = await api.get('/clientes')
            setClientes(data)
        } catch (e) { console.error(e) }
    }

    const cargarCalculo = async (calcId: string) => {
        try {
            const { data } = await api.get(`/calculos/${calcId}`)
            if (data.datos) {
                setState({ ...data.datos, clienteId: data.clienteId }) // Restore state from JSON
            }
        } catch (e) { toast.error("Error al cargar cálculo") }
    }

    const calcular = () => {
        const { ruta, diesel, gastos, viaticos, carroPiloto, factores } = state

        // 1. Diesel
        const litrosCargado = ruta.kmsCargado / (diesel.rendimientoCargado || 1)
        const litrosVacio = ruta.kmsVacio / (diesel.rendimientoVacio || 1)
        const totalLitros = litrosCargado + litrosVacio
        const costoDiesel = totalLitros * diesel.precio

        // 2. Viaticos
        const totalViaticos =
            (viaticos.comidasQty * viaticos.precioComidas) +
            (viaticos.federalesQty * viaticos.precioFederales) +
            viaticos.telefono + viaticos.imprevistos

        // 3. Subtotal Directo
        const subtotalDirecto = costoDiesel + gastos.casetas + gastos.permisos + gastos.otros + totalViaticos

        // 4. Indirectos
        const montoMantenimiento = subtotalDirecto * (factores.mantenimiento / 100)
        const montoIndirectos = subtotalDirecto * (factores.indirectos / 100)

        // 5. Carro Piloto (Gastos + 20% indirecto on top usually, matching PDF)
        // PDF says: (Gastos) + (20% of Gastos logic?) 
        // PDF logic: $38,040 (Casetas/Gastos) + $7,608 (20%) = $45,648 impact? 
        // Let's assume Piloto Total = Gastos * 1.20
        const costPiloto = carroPiloto.activo ? (carroPiloto.gastos * 1.20) : 0

        // 6. Costo Total
        const costoTotal = subtotalDirecto + montoMantenimiento + montoIndirectos + costPiloto

        // 7. Precio Venta
        const precioVenta = costoTotal * (1 + (factores.utilidad / 100))

        setResults({
            litros: totalLitros, costDiesel: costoDiesel, totalViaticos, costPiloto,
            subtotalDirecto, montoMantenimiento, montoIndirectos, costoTotal, precioVenta
        })
    }

    const handleSave = async () => {
        if (!state.clienteId) { toast.error("Seleccione un cliente"); return; }
        const payload = {
            clienteId: Number(state.clienteId),
            origen: state.ruta.origen,
            destino: state.ruta.destino,
            totalCosto: results.costoTotal,
            precioVenta: results.precioVenta,
            datos: state
        }

        try {
            if (id) {
                await api.patch(`/calculos/${id}`, payload)
                toast.success("Cálculo actualizado")
            } else {
                await api.post('/calculos', payload)
                toast.success("Cálculo guardado")
                navigate('/calculos')
            }
        } catch (e) { toast.error("Error al guardar") }
    }

    const formatMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

    // Handlers for nested state updates
    const update = (section: Exclude<keyof CalculoState, 'clienteId'>, field: string, value: any) => {
        setState(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: Number(value) || value } // simple number parsing
        }))
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to="/calculos" className="btn btn-ghost btn-sm">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-semibold text-gray-900">{id ? 'Editar Cálculo' : 'Nuevo Cálculo de Costos'}</h1>
                </div>
                <button onClick={handleSave} className="btn btn-primary flex gap-2">
                    <CheckCircleIcon className="h-5 w-5" /> Guardar
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-2 space-y-6">

                    {/* General */}
                    <div className="card bg-white p-4 shadow-sm space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Datos Generales</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="label">Cliente</label>
                                <select className="input" value={state.clienteId} onChange={e => setState({ ...state, clienteId: Number(e.target.value) })}>
                                    <option value={0}>Seleccione...</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Origen</label>
                                <input className="input" value={state.ruta.origen} onChange={e => update('ruta', 'origen', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Destino</label>
                                <input className="input" value={state.ruta.destino} onChange={e => update('ruta', 'destino', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Ruta y Diesel */}
                    <div className="card bg-white p-4 shadow-sm space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2 flex justify-between">
                            <span>Ruta y Combustible</span>
                            <span className="text-primary">{formatMoney(results.costDiesel)}</span>
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="label">Kms Cargado</label>
                                <input type="number" className="input" value={state.ruta.kmsCargado} onChange={e => update('ruta', 'kmsCargado', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Rend. Cargado</label>
                                <input type="number" className="input" value={state.diesel.rendimientoCargado} onChange={e => update('diesel', 'rendimientoCargado', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Kms Vacío</label>
                                <input type="number" className="input" value={state.ruta.kmsVacio} onChange={e => update('ruta', 'kmsVacio', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Rend. Vacío</label>
                                <input type="number" className="input" value={state.diesel.rendimientoVacio} onChange={e => update('diesel', 'rendimientoVacio', e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <label className="label">Precio Diesel / Lt</label>
                                <input type="number" className="input" value={state.diesel.precio} onChange={e => update('diesel', 'precio', e.target.value)} />
                            </div>
                            <div className="col-span-2 bg-gray-50 p-2 rounded text-right">
                                <div className="text-xs text-gray-500">Litros Estimados</div>
                                <div className="font-mono font-bold">{results.litros.toFixed(1)} L</div>
                            </div>
                        </div>
                    </div>

                    {/* Gastos y Viaticos */}
                    <div className="card bg-white p-4 shadow-sm space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2 flex justify-between">
                            <span>Gastos Directos</span>
                            <span className="text-gray-600 font-normal text-sm">
                                Peajes: {formatMoney(state.gastos.casetas)} | Viáticos: {formatMoney(results.totalViaticos)}
                            </span>
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label">Peajes / Casetas</label>
                                <input type="number" className="input" value={state.gastos.casetas} onChange={e => update('gastos', 'casetas', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Permisos</label>
                                <input type="number" className="input" value={state.gastos.permisos} onChange={e => update('gastos', 'permisos', e.target.value)} />
                            </div>
                            <div>
                                <label className="label">Otros Gastos</label>
                                <input type="number" className="input" value={state.gastos.otros} onChange={e => update('gastos', 'otros', e.target.value)} />
                            </div>
                        </div>

                        <div className="border-t pt-2">
                            <h4 className="font-medium text-sm mb-2 text-gray-600">Calculadora Viáticos</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                    <label>Cant. Comidas</label>
                                    <input type="number" className="input h-8" value={state.viaticos.comidasQty} onChange={e => update('viaticos', 'comidasQty', e.target.value)} />
                                </div>
                                <div>
                                    <label>Precio Comida</label>
                                    <input type="number" className="input h-8" value={state.viaticos.precioComidas} onChange={e => update('viaticos', 'precioComidas', e.target.value)} />
                                </div>
                                <div>
                                    <label>Cant. Federal</label>
                                    <input type="number" className="input h-8" value={state.viaticos.federalesQty} onChange={e => update('viaticos', 'federalesQty', e.target.value)} />
                                </div>
                                <div>
                                    <label>Precio Federal</label>
                                    <input type="number" className="input h-8" value={state.viaticos.precioFederales} onChange={e => update('viaticos', 'precioFederales', e.target.value)} />
                                </div>
                                <div>
                                    <label>Teléfono</label>
                                    <input type="number" className="input h-8" value={state.viaticos.telefono} onChange={e => update('viaticos', 'telefono', e.target.value)} />
                                </div>
                                <div>
                                    <label>Imprevistos</label>
                                    <input type="number" className="input h-8" value={state.viaticos.imprevistos} onChange={e => update('viaticos', 'imprevistos', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Carro Piloto */}
                    <div className={`card p-4 shadow-sm border ${state.carroPiloto.activo ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <input type="checkbox" className="toggle toggle-primary" checked={state.carroPiloto.activo} onChange={e => setState({ ...state, carroPiloto: { ...state.carroPiloto, activo: e.target.checked } })} />
                            <h3 className="font-semibold text-lg">Vehículo Piloto</h3>
                        </div>
                        {state.carroPiloto.activo && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Total Gastos Piloto</label>
                                    <input type="number" className="input" value={state.carroPiloto.gastos} onChange={e => update('carroPiloto', 'gastos', e.target.value)} />
                                    <span className="text-xs text-gray-500">Se agregará +20% indirecto</span>
                                </div>
                                <div className="text-right">
                                    <div className="label">Impacto Total</div>
                                    <div className="font-bold text-lg">{formatMoney(results.costPiloto)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Resumen & Factores */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card bg-gray-50 p-6 shadow-sm border border-gray-200 sticky top-4">
                        <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center gap-2">
                            <CalculatorIcon className="h-6 w-6" /> Resultados
                        </h3>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span>Combustible</span>
                                <span>{formatMoney(results.costDiesel)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Peajes y Permisos</span>
                                <span>{formatMoney(state.gastos.casetas + state.gastos.permisos + state.gastos.otros)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Viáticos</span>
                                <span>{formatMoney(results.totalViaticos)}</span>
                            </div>
                            <div className="border-t border-gray-300 pt-2 font-bold flex justify-between">
                                <span>Subtotal Directo</span>
                                <span>{formatMoney(results.subtotalDirecto)}</span>
                            </div>

                            <div className="pt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-gray-600">Mantenimiento (%)</label>
                                    <input type="number" className="input w-20 text-right h-8" value={state.factores.mantenimiento} onChange={e => update('factores', 'mantenimiento', e.target.value)} />
                                </div>
                                <div className="text-right text-gray-500 text-xs">{formatMoney(results.montoMantenimiento)}</div>

                                <div className="flex items-center justify-between">
                                    <label className="text-gray-600">Indirectos (%)</label>
                                    <input type="number" className="input w-20 text-right h-8" value={state.factores.indirectos} onChange={e => update('factores', 'indirectos', e.target.value)} />
                                </div>
                                <div className="text-right text-gray-500 text-xs">{formatMoney(results.montoIndirectos)}</div>

                                {state.carroPiloto.activo && (
                                    <div className="flex justify-between text-blue-600 font-medium">
                                        <span>+ Carro Piloto</span>
                                        <span>{formatMoney(results.costPiloto)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-300 pt-2 font-bold text-lg flex justify-between">
                                <span>Costo Total</span>
                                <span>{formatMoney(results.costoTotal)}</span>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="font-bold text-yellow-800">Margen Utilidad (%)</label>
                                    <input type="number" className="input w-20 text-right font-bold" value={state.factores.utilidad} onChange={e => update('factores', 'utilidad', e.target.value)} />
                                </div>
                                <div className="text-center">
                                    <div className="text-gray-600 text-sm mb-1">Precio Sugerido (sin IVA)</div>
                                    <div className="text-3xl font-bold text-green-700">{formatMoney(results.precioVenta)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
