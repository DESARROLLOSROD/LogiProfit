import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import api from '../lib/api';

interface Flete {
  id: number;
  folio: string;
  cliente: { nombre: string };
  origen: string;
  destino: string;
  estado: string;
  fechaInicio: Date | null;
}

interface Cotizacion {
  id: number;
  folio: string;
  cliente: { nombre: string };
  precioCotizado: number;
  validoHasta?: Date;
  diasRestantes: number;
}

interface Gasto {
  id: number;
  flete: {
    id: number;
    folio: string;
    cliente: { nombre: string };
  };
  tipo: string;
  monto: number;
  fecha: Date;
}

interface Pago {
  id: number;
  flete: {
    id: number;
    folio: string;
    cliente: { nombre: string };
  };
  fechaVencimiento?: Date;
  diasVencido: number;
}

interface PendientesData {
  fletesSinGastos: {
    sinGastosRegistrados: Flete[];
    total: number;
  };
  cotizacionesPorVencer: {
    cotizaciones: Cotizacion[];
    total: number;
  };
  xmlFaltantes: {
    gastos: Gasto[];
    total: number;
  };
  pagosVencidos: {
    pagos: Pago[];
    total: number;
  };
}

export default function Pendientes() {
  const [data, setData] = useState<PendientesData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPendientes = async () => {
    try {
      const response = await api.get('/dashboard/pendientes');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudieron cargar las tareas pendientes</p>
      </div>
    );
  }

  const totalPendientes =
    data.fletesSinGastos.total +
    data.cotizacionesPorVencer.total +
    data.xmlFaltantes.total +
    data.pagosVencidos.total;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tareas Pendientes</h1>
        <p className="text-gray-500">
          {totalPendientes > 0
            ? `Tienes ${totalPendientes} tarea${totalPendientes > 1 ? 's' : ''} pendiente${totalPendientes > 1 ? 's' : ''}`
            : 'No tienes tareas pendientes'}
        </p>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Fletes sin Gastos"
          count={data.fletesSinGastos.total}
          icon={TruckIcon}
          color="yellow"
        />
        <SummaryCard
          title="Cotizaciones por Vencer"
          count={data.cotizacionesPorVencer.total}
          icon={ClockIcon}
          color="orange"
        />
        <SummaryCard
          title="Comprobantes Faltantes"
          count={data.xmlFaltantes.total}
          icon={DocumentTextIcon}
          color="red"
        />
        <SummaryCard
          title="Pagos Vencidos"
          count={data.pagosVencidos.total}
          icon={ExclamationTriangleIcon}
          color="purple"
        />
      </div>

      <div className="space-y-6">
        {/* Fletes sin gastos registrados */}
        {data.fletesSinGastos.total > 0 && (
          <div className="card border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3 mb-4">
              <TruckIcon className="w-6 h-6 text-yellow-700" />
              <h2 className="text-lg font-semibold text-yellow-900">
                Fletes sin Gastos Registrados ({data.fletesSinGastos.total})
              </h2>
            </div>
            <p className="text-sm text-yellow-800 mb-4">
              Estos fletes están en curso o completados pero no tienen gastos registrados. Es importante
              registrar los gastos para calcular la utilidad real.
            </p>
            <div className="bg-white rounded-lg border border-yellow-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Folio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ruta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.fletesSinGastos.sinGastosRegistrados.map((flete) => (
                    <tr key={flete.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {flete.folio}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{flete.cliente.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {flete.origen} → {flete.destino}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-warning">{flete.estado}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/fletes/${flete.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          Ver Detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cotizaciones por vencer */}
        {data.cotizacionesPorVencer.total > 0 && (
          <div className="card border-orange-200 bg-orange-50">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="w-6 h-6 text-orange-700" />
              <h2 className="text-lg font-semibold text-orange-900">
                Cotizaciones por Vencer ({data.cotizacionesPorVencer.total})
              </h2>
            </div>
            <p className="text-sm text-orange-800 mb-4">
              Estas cotizaciones están próximas a vencer o ya vencieron. Considera hacer seguimiento
              con el cliente.
            </p>
            <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Folio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Válido Hasta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Días
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.cotizacionesPorVencer.cotizaciones.map((cot) => (
                    <tr key={cot.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cot.folio}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cot.cliente.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {formatMoney(Number(cot.precioCotizado))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(cot.validoHasta)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`badge ${
                            cot.diasRestantes < 0
                              ? 'badge-error'
                              : cot.diasRestantes <= 3
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {cot.diasRestantes < 0
                            ? `Vencida hace ${Math.abs(cot.diasRestantes)} días`
                            : `${cot.diasRestantes} día${cot.diasRestantes !== 1 ? 's' : ''}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/cotizaciones/${cot.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          Ver Detalles
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Comprobantes XML faltantes */}
        {data.xmlFaltantes.total > 0 && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-center gap-3 mb-4">
              <DocumentTextIcon className="w-6 h-6 text-red-700" />
              <h2 className="text-lg font-semibold text-red-900">
                Comprobantes Fiscales Faltantes ({data.xmlFaltantes.total})
              </h2>
            </div>
            <p className="text-sm text-red-800 mb-4">
              Estos gastos no tienen comprobante fiscal (XML). Es necesario subirlos para la
              contabilidad.
            </p>
            <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Flete
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo Gasto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.xmlFaltantes.gastos.map((gasto) => (
                    <tr key={gasto.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {gasto.flete.folio}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {gasto.flete.cliente.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{gasto.tipo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {formatMoney(Number(gasto.monto))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(gasto.fecha)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/fletes/${gasto.flete.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          Ver Flete
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagos vencidos */}
        {data.pagosVencidos.total > 0 && (
          <div className="card border-purple-200 bg-purple-50">
            <div className="flex items-center gap-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-purple-700" />
              <h2 className="text-lg font-semibold text-purple-900">
                Pagos Vencidos ({data.pagosVencidos.total})
              </h2>
            </div>
            <p className="text-sm text-purple-800 mb-4">
              Estos pagos están vencidos. Considera hacer seguimiento para el cobro.
            </p>
            <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Flete
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Días Vencido
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.pagosVencidos.pagos.map((pago) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {pago.flete.folio}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {pago.flete.cliente.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(pago.fechaVencimiento)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge badge-error">{pago.diasVencido} días</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          to={`/fletes/${pago.flete.id}`}
                          className="text-primary-600 hover:text-primary-900 font-medium"
                        >
                          Ver Flete
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No hay tareas pendientes */}
        {totalPendientes === 0 && (
          <div className="card text-center py-12">
            <div className="text-green-600 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Todo al día!
            </h3>
            <p className="text-gray-500">No tienes tareas pendientes en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'yellow' | 'orange' | 'red' | 'purple';
}

function SummaryCard({ title, count, icon: Icon, color }: SummaryCardProps) {
  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className={`card border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold">{count}</p>
        </div>
        <Icon className="w-12 h-12 opacity-20" />
      </div>
    </div>
  );
}
