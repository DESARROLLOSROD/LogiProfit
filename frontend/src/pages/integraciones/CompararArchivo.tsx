import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useIntegracionesStore } from '../../stores/integracionesStore';
import FileDropzone from '../../components/integraciones/FileDropzone';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface DiferenciaFlete {
  folio: string;
  fleteId: number;
  campo: string;
  valorLogiProfit: any;
  valorArchivo: any;
  tipoConflicto: 'diferencia' | 'faltante_logiprofit' | 'faltante_archivo';
}

interface ComparacionResult {
  totalFletesArchivo: number;
  totalFletesLogiProfit: number;
  fletesCoincidentes: number;
  fletesConDiferencias: number;
  fletesSoloEnArchivo: string[];
  fletesSoloEnLogiProfit: string[];
  diferencias: DiferenciaFlete[];
  gastosPorFolio: Record<string, {
    totalGastos: number;
    cantidadGastos: number;
    gastos: any[];
  }>;
}

export default function CompararArchivo() {
  const navigate = useNavigate();
  const { configuraciones, fetchConfiguraciones } = useIntegracionesStore();

  const [configuracionId, setConfiguracionId] = useState<number | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ComparacionResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const handleComparar = async () => {
    if (!archivo || !configuracionId) {
      toast.error('Selecciona una configuración y un archivo');
      return;
    }

    setIsComparing(true);
    setResultado(null);

    try {
      const formData = new FormData();
      formData.append('file', archivo);
      formData.append('configuracionMapeoId', String(configuracionId));

      const response = await api.post('/integraciones/comparar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResultado(response.data);
      toast.success('Comparación completada');
    } catch (error: any) {
      console.error('Error al comparar:', error);
      toast.error(error.response?.data?.message || 'Error al comparar archivo');
    } finally {
      setIsComparing(false);
    }
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/integraciones')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Comparar Archivo</h1>
        <p className="text-gray-600 mt-1">
          Compara los folios del archivo con los registrados en LogiProfit y visualiza diferencias
        </p>
      </div>

      <div className="space-y-6">
        {/* Selección de Configuración */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Selecciona Configuración de Mapeo
          </h2>
          <select
            value={configuracionId || ''}
            onChange={(e) => setConfiguracionId(Number(e.target.value) || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Selecciona una configuración --</option>
            {configuraciones
              .filter((c: any) => c.activa)
              .map((config: any) => (
                <option key={config.id} value={config.id}>
                  {config.nombre} ({config.sistema} - {config.tipoArchivo})
                </option>
              ))}
          </select>
        </div>

        {/* Upload de Archivo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            2. Selecciona Archivo de Aspel/Microsip
          </h2>
          <FileDropzone file={archivo} onFileSelect={setArchivo} />
        </div>

        {/* Botón de Comparar */}
        {archivo && configuracionId && (
          <div className="flex justify-end">
            <button
              onClick={handleComparar}
              disabled={isComparing}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Scale className="h-5 w-5" />
              {isComparing ? 'Comparando...' : 'Comparar'}
            </button>
          </div>
        )}

        {/* Resultado de Comparación */}
        {resultado && (
          <div className="space-y-6">
            {/* Resumen */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen de Comparación
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">En Archivo</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {resultado.totalFletesArchivo}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Coincidentes</p>
                  <p className="text-2xl font-bold text-green-900">
                    {resultado.fletesCoincidentes}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Con Diferencias</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {resultado.fletesConDiferencias}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">En LogiProfit</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {resultado.totalFletesLogiProfit}
                  </p>
                </div>
              </div>
            </div>

            {/* Fletes con Diferencias */}
            {resultado.diferencias.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Diferencias Detectadas ({resultado.diferencias.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Folio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Campo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Aspel/Microsip
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          LogiProfit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Gastos Asociados
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resultado.diferencias.map((diff: DiferenciaFlete, idx: number) => {
                        const gastos = resultado.gastosPorFolio[diff.folio];
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {diff.folio}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {diff.campo === 'precioCliente' ? 'Precio' :
                               diff.campo === 'kmReales' ? 'Kilómetros' :
                               diff.campo}
                            </td>
                            <td className="px-4 py-3 text-sm text-blue-900 font-semibold">
                              {diff.campo === 'precioCliente'
                                ? formatMoney(diff.valorArchivo)
                                : diff.valorArchivo}
                            </td>
                            <td className="px-4 py-3 text-sm text-purple-900 font-semibold">
                              {diff.campo === 'precioCliente'
                                ? formatMoney(diff.valorLogiProfit)
                                : diff.valorLogiProfit}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {gastos ? (
                                <div className="text-gray-700">
                                  <span className="font-semibold">{formatMoney(gastos.totalGastos)}</span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({gastos.cantidadGastos} gastos)
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">Sin gastos</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Folios solo en Archivo */}
            {resultado.fletesSoloEnArchivo.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Folios Solo en Aspel/Microsip ({resultado.fletesSoloEnArchivo.length})
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Estos folios están en el archivo pero NO existen en LogiProfit
                </p>
                <div className="flex flex-wrap gap-2">
                  {resultado.fletesSoloEnArchivo.map((folio: string) => (
                    <span
                      key={folio}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                    >
                      {folio}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Folios solo en LogiProfit */}
            {resultado.fletesSoloEnLogiProfit.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Folios Solo en LogiProfit ({resultado.fletesSoloEnLogiProfit.length})
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Estos folios están en LogiProfit pero NO están en el archivo de Aspel/Microsip
                </p>
                <div className="flex flex-wrap gap-2">
                  {resultado.fletesSoloEnLogiProfit.map((folio: string) => (
                    <span
                      key={folio}
                      className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                    >
                      {folio}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Todo coincide */}
            {resultado.diferencias.length === 0 &&
             resultado.fletesSoloEnArchivo.length === 0 &&
             resultado.fletesSoloEnLogiProfit.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      ¡Perfecto! Todo coincide
                    </h3>
                    <p className="text-green-700 mt-1">
                      No se encontraron diferencias entre el archivo y LogiProfit
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón Nueva Comparación */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setResultado(null);
                  setArchivo(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Nueva Comparación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
