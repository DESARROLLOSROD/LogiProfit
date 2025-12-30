
interface Campo {
  key: string;
  label: string;
  obligatorio: boolean;
  descripcion?: string;
}

interface MapeoColumnasProps {
  mapeos: Record<string, string>;
  onChange: (mapeos: Record<string, string>) => void;
}

const CAMPOS_LOGIPROFIT: Campo[] = [
  {
    key: 'folio',
    label: 'Folio',
    obligatorio: false,
    descripcion: 'Número de folio del flete (ej: F-00001)',
  },
  {
    key: 'clienteNombre',
    label: 'Nombre del Cliente',
    obligatorio: true,
    descripcion: 'Nombre completo del cliente',
  },
  {
    key: 'origen',
    label: 'Origen',
    obligatorio: true,
    descripcion: 'Ciudad o ubicación de origen',
  },
  {
    key: 'destino',
    label: 'Destino',
    obligatorio: true,
    descripcion: 'Ciudad o ubicación de destino',
  },
  {
    key: 'precioCliente',
    label: 'Precio al Cliente',
    obligatorio: true,
    descripcion: 'Monto a cobrar al cliente',
  },
  {
    key: 'kmReales',
    label: 'Kilómetros Reales',
    obligatorio: false,
    descripcion: 'Kilómetros recorridos en el viaje',
  },
  {
    key: 'fechaInicio',
    label: 'Fecha de Inicio',
    obligatorio: false,
    descripcion: 'Fecha de inicio del viaje',
  },
  {
    key: 'fechaFin',
    label: 'Fecha de Fin',
    obligatorio: false,
    descripcion: 'Fecha de finalización del viaje',
  },
  {
    key: 'estado',
    label: 'Estado',
    obligatorio: false,
    descripcion: 'Estado del flete (PLANEADO, EN_CURSO, etc.)',
  },
  {
    key: 'notas',
    label: 'Notas',
    obligatorio: false,
    descripcion: 'Observaciones adicionales',
  },
];

export default function MapeoColumnas({ mapeos, onChange }: MapeoColumnasProps) {
  const handleChange = (key: string, value: string) => {
    onChange({
      ...mapeos,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Instrucciones:</strong> Mapea los campos de LogiProfit con los
          nombres de las columnas en tu archivo de Aspel/Microsip. Los campos
          marcados con <span className="text-red-600">*</span> son obligatorios.
        </p>
      </div>

      <div className="grid gap-4">
        {CAMPOS_LOGIPROFIT.map((campo) => (
          <div
            key={campo.key}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                {campo.label}
                {campo.obligatorio && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </label>
              {campo.descripcion && (
                <p className="text-xs text-gray-500">{campo.descripcion}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                value={mapeos[campo.key] || ''}
                onChange={(e) => handleChange(campo.key, e.target.value)}
                placeholder="Nombre de columna en archivo (ej: FOLIO, Cliente, etc.)"
                className={`
                  w-full px-3 py-2 border rounded-md shadow-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  ${
                    campo.obligatorio && !mapeos[campo.key]
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }
                `}
              />
              {campo.obligatorio && !mapeos[campo.key] && (
                <p className="mt-1 text-xs text-red-600">
                  Este campo es obligatorio
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Los nombres de las columnas deben coincidir
          exactamente con los del archivo (sin distinguir mayúsculas/minúsculas).
        </p>
      </div>
    </div>
  );
}
