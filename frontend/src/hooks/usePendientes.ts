import { useEffect, useState } from 'react';
import api from '../lib/api';

interface PendientesCount {
  fletesSinGastos: number;
  cotizacionesPorVencer: number;
  xmlFaltantes: number;
  pagosVencidos: number;
  total: number;
}

export function usePendientes() {
  const [count, setCount] = useState<PendientesCount>({
    fletesSinGastos: 0,
    cotizacionesPorVencer: 0,
    xmlFaltantes: 0,
    pagosVencidos: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchPendientes = async () => {
    try {
      const response = await api.get('/dashboard/pendientes');
      const data = response.data;

      setCount({
        fletesSinGastos: data.fletesSinGastos.total,
        cotizacionesPorVencer: data.cotizacionesPorVencer.total,
        xmlFaltantes: data.xmlFaltantes.total,
        pagosVencidos: data.pagosVencidos.total,
        total:
          data.fletesSinGastos.total +
          data.cotizacionesPorVencer.total +
          data.xmlFaltantes.total +
          data.pagosVencidos.total,
      });
    } catch (error) {
      console.error('Error fetching pendientes count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchPendientes, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { count, loading, refresh: fetchPendientes };
}
