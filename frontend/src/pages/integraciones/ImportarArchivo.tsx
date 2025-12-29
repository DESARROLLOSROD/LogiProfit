import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Upload, CheckCircle, XCircle } from 'lucide-react';
import { useIntegracionesStore } from '../../stores\integracionesStore';
import FileDropzone from '../../components/integraciones/FileDropzone';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ImportarArchivo() {
  const navigate = useNavigate();
  const { configuraciones, fetchConfiguraciones } = useIntegracionesStore();

  const [configuracionId, setConfiguracionId] = useState<number | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchConfiguraciones();
  }, []);

  const handlePreview = async () => {
    if (!archivo || !configuracionId) {
      toast.error('Selecciona una configuración y un archivo');
      return;
    }

    setIsLoadingPreview(true);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append('file', archivo);
      formData.append('configuracionMapeoId', String(configuracionId));

      const response = await api.post('/integraciones/importar/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPreview(response.data);
      toast.success('Vista previa generada');
    } catch (error: any) {
      console.error('Error al generar preview:', error);
      toast.error(error.response?.data?.message || 'Error al generar vista previa');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleImportar = async () => {
    if (!archivo || !configuracionId) {
      toast.error('Selecciona una configuración y un archivo');
      return;
    }

    setIsImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', archivo);
      formData.append('configuracionMapeoId', String(configuracionId));

      const response = await api.post('/integraciones/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResultado(response.data);
      toast.success('Importación completada');
      setPreview(null);
      setArchivo(null);
    } catch (error: any) {
      console.error('Error al importar:', error);
      toast.error(error.response?.data?.message || 'Error al importar archivo');
    } finally {
      setIsImporting(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Importar Archivo</h1>
        <p className="text-gray-600 mt-1">
          Importa folios de flete desde Aspel o Microsip
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
              .filter((c) => c.activa)
              .map((config) => (
                <option key={config.id} value={config.id}>
                  {config.nombre} ({config.sistema} - {config.tipoArchivo})
                </option>
              ))}
          </select>
        </div>

        {/* Upload de Archivo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            2. Selecciona Archivo
          </h2>
          <FileDropzone file={archivo} onFileSelect={setArchivo} />
        </div>

        {/* Botones de Acción */}
        {archivo && configuracionId && !resultado && (
          <div className="flex justify-end gap-3">
            <button
              onClick={handlePreview}
              disabled={isLoadingPreview || isImporting}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              {isLoadingPreview ? 'Cargando...' : 'Vista Previa'}
            </button>
            <button
              onClick={handleImportar}
              disabled={isLoadingPreview || isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importando...' : 'Confirmar Importación'}
            </button>
          </div>
        )}

        {/* Vista Previa */}
        {preview && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Vista Previa - Primeras 10 Filas
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Total de registros en archivo: <strong>{preview.totalRegistros}</strong>
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Línea
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Origen
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Destino
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Precio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.preview.map((row: any) => (
                    <tr key={row.linea}>
                      <td className="px-3 py-2 text-sm text-gray-500">{row.linea}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {row.datosMapeados.clienteId || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {row.datosMapeados.origen || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {row.datosMapeados.destino || 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        ${row.datosMapeados.precioCliente?.toLocaleString() || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultado de Importación */}
        {resultado && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Resultado de Importación
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">
                  {resultado.totalRegistros}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Exitosos</p>
                <p className="text-2xl font-bold text-green-900">
                  {resultado.exitosos}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Actualizados</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {resultado.actualizados}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Errores</p>
                <p className="text-2xl font-bold text-red-900">
                  {resultado.errores}
                </p>
              </div>
            </div>

            {resultado.detallesErrores && resultado.detallesErrores.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Detalles de Errores</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resultado.detallesErrores.map((error: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-900">
                        <strong>Línea {error.linea}</strong> - Campo: {error.campo} -{' '}
                        {error.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setResultado(null);
                  setArchivo(null);
                  setPreview(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Nueva Importación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
