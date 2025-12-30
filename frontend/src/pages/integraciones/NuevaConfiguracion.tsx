import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useIntegracionesStore } from '../../stores/integracionesStore';
import MapeoColumnas from '../../components/integraciones/MapeoColumnas';
import toast from 'react-hot-toast';

export default function NuevaConfiguracion() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { crearConfiguracion, actualizarConfiguracion, configuraciones } =
    useIntegracionesStore();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sistema, setSistema] = useState<'ASPEL' | 'MICROSIP' | 'OTRO'>('ASPEL');
  const [tipoArchivo, setTipoArchivo] = useState<'EXCEL' | 'CSV' | 'XML'>('EXCEL');
  const [activa, setActiva] = useState(true);
  const [mapeos, setMapeos] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const config = configuraciones.find((c) => c.id === parseInt(id));
      if (config) {
        setNombre(config.nombre);
        setDescripcion(config.descripcion || '');
        setSistema(config.sistema);
        setTipoArchivo(config.tipoArchivo);
        setActiva(config.activa);
        setMapeos(config.mapeos);
      }
    }
  }, [id, configuraciones]);

  const validarFormulario = (): boolean => {
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return false;
    }

    // Validar que al menos el folio esté mapeado (único campo realmente obligatorio)
    if (!mapeos['folio']) {
      toast.error('El campo "folio" es obligatorio para identificar los registros');
      return false;
    }

    // Advertir sobre campos recomendados faltantes (pero no bloquear)
    const camposRecomendados = ['clienteNombre', 'origen', 'destino', 'precioCliente'];
    const faltantes = camposRecomendados.filter((campo) => !mapeos[campo]);

    if (faltantes.length > 0) {
      const mensaje = `Campos recomendados sin mapear: ${faltantes.join(', ')}. ¿Continuar de todos modos?`;
      if (!confirm(mensaje)) {
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    setIsSubmitting(true);

    try {
      const data = {
        nombre,
        descripcion: descripcion || undefined,
        sistema,
        tipoArchivo,
        activa,
        mapeos,
      };

      if (id) {
        await actualizarConfiguracion(parseInt(id), data);
      } else {
        await crearConfiguracion(data);
      }

      navigate('/integraciones');
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Editar' : 'Nueva'} Configuración de Mapeo
        </h1>
        <p className="text-gray-600 mt-1">
          Define cómo se mapearán las columnas entre el archivo externo y LogiProfit
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Información Básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Aspel SAE - Importación de Folios"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sistema Externo
              </label>
              <select
                value={sistema}
                onChange={(e) => setSistema(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ASPEL">Aspel</option>
                <option value="MICROSIP">Microsip</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Archivo
              </label>
              <select
                value={tipoArchivo}
                onChange={(e) => setTipoArchivo(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="EXCEL">Excel (.xlsx, .xls)</option>
                <option value="CSV">CSV (.csv)</option>
                <option value="XML">XML (.xml)</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activa}
                  onChange={(e) => setActiva(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Configuración activa
                </span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción opcional de la configuración..."
              />
            </div>
          </div>
        </div>

        {/* Mapeo de Columnas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Mapeo de Columnas
          </h2>
          <MapeoColumnas mapeos={mapeos} onChange={setMapeos} />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/integraciones')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Guardando...' : id ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
