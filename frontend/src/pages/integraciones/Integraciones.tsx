import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileUp, Edit, Trash2, Scale } from 'lucide-react';
import { useIntegracionesStore } from '../../stores/integracionesStore';

export default function Integraciones() {
  const navigate = useNavigate();
  const {
    configuraciones,
    logs,
    isLoading,
    fetchConfiguraciones,
    fetchLogs,
    eliminarConfiguracion,
  } = useIntegracionesStore();

  useEffect(() => {
    fetchConfiguraciones();
    fetchLogs();
  }, []);

  const handleEliminar = async (id: number, nombre: string) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar la configuración "${nombre}"?`,
      )
    ) {
      return;
    }

    try {
      await eliminarConfiguracion(id);
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const getBadgeColor = (sistema: string) => {
    const colors: Record<string, string> = {
      ASPEL: 'bg-blue-100 text-blue-800',
      MICROSIP: 'bg-green-100 text-green-800',
      OTRO: 'bg-gray-100 text-gray-800',
    };
    return colors[sistema] || colors.OTRO;
  };

  const getFormatoBadgeColor = (formato: string) => {
    const colors: Record<string, string> = {
      EXCEL: 'bg-emerald-100 text-emerald-800',
      CSV: 'bg-orange-100 text-orange-800',
      XML: 'bg-purple-100 text-purple-800',
    };
    return colors[formato] || colors.EXCEL;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Integraciones Externas
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona la sincronización con Aspel, Microsip y otros sistemas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/integraciones/comparar')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <Scale className="h-4 w-4" />
            Comparar Archivo
          </button>
          <button
            onClick={() => navigate('/integraciones/importar')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FileUp className="h-4 w-4" />
            Importar Archivo
          </button>
          <button
            onClick={() => navigate('/integraciones/nueva')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nueva Configuración
          </button>
        </div>
      </div>

      {/* Configuraciones de Mapeo */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Configuraciones de Mapeo
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : configuraciones.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              No hay configuraciones de mapeo creadas
            </p>
            <button
              onClick={() => navigate('/integraciones/nueva')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear primera configuración
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sistema
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Formato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Creada
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configuraciones.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {config.nombre}
                        </p>
                        {config.descripcion && (
                          <p className="text-sm text-gray-500">
                            {config.descripcion}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(config.sistema)}`}
                      >
                        {config.sistema}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFormatoBadgeColor(config.tipoArchivo)}`}
                      >
                        {config.tipoArchivo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          config.activa
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {config.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(config.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          navigate(`/integraciones/editar/${config.id}`)
                        }
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() =>
                          handleEliminar(config.id, config.nombre)
                        }
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historial de Operaciones */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Historial de Importaciones/Exportaciones
          </h2>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay operaciones registradas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Operación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Archivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Exitosos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Errores
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.tipoOperacion === 'IMPORTACION'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {log.tipoOperacion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.nombreArchivo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.totalRegistros}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">
                      {log.registrosExitosos + log.registrosActualizados}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 font-medium">
                      {log.registrosErrores}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
