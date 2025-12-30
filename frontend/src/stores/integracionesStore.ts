import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface ConfiguracionMapeo {
  id: number;
  empresaId: number;
  nombre: string;
  descripcion?: string;
  sistema: 'ASPEL' | 'MICROSIP' | 'OTRO';
  tipoArchivo: 'EXCEL' | 'CSV' | 'XML';
  activa: boolean;
  mapeos: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ImportacionLog {
  id: number;
  empresaId: number;
  usuarioId?: number;
  configuracionMapeoId?: number;
  nombreArchivo: string;
  tipoOperacion: 'IMPORTACION' | 'EXPORTACION';
  formato: 'EXCEL' | 'CSV' | 'XML';
  totalRegistros: number;
  registrosExitosos: number;
  registrosActualizados: number;
  registrosErrores: number;
  detallesErrores?: any;
  createdAt: string;
  configuracionMapeo?: {
    id: number;
    nombre: string;
  };
}

interface IntegracionesState {
  configuraciones: ConfiguracionMapeo[];
  configuracionActual: ConfiguracionMapeo | null;
  logs: ImportacionLog[];
  isLoading: boolean;

  // Actions
  fetchConfiguraciones: () => Promise<void>;
  crearConfiguracion: (data: any) => Promise<void>;
  actualizarConfiguracion: (id: number, data: any) => Promise<void>;
  eliminarConfiguracion: (id: number) => Promise<void>;
  setConfiguracionActual: (config: ConfiguracionMapeo | null) => void;

  fetchLogs: () => Promise<void>;
}

export const useIntegracionesStore = create<IntegracionesState>()(
  persist(
    (set) => ({
      configuraciones: [],
      configuracionActual: null,
      logs: [],
      isLoading: false,

      fetchConfiguraciones: async () => {
        try {
          set({ isLoading: true });
          const response = await api.get('/integraciones/mapeos');
          set({ configuraciones: response.data, isLoading: false });
        } catch (error: any) {
          console.error('Error al obtener configuraciones:', error);
          toast.error(
            error.response?.data?.message ||
              'Error al cargar configuraciones',
          );
          set({ isLoading: false });
        }
      },

      crearConfiguracion: async (data: any) => {
        try {
          set({ isLoading: true });
          const response = await api.post('/integraciones/mapeos', data);
          set((state) => ({
            configuraciones: [response.data, ...state.configuraciones],
            isLoading: false,
          }));
          toast.success('Configuración creada exitosamente');
        } catch (error: any) {
          console.error('Error al crear configuración:', error);
          toast.error(
            error.response?.data?.message || 'Error al crear configuración',
          );
          set({ isLoading: false });
          throw error;
        }
      },

      actualizarConfiguracion: async (id: number, data: any) => {
        try {
          set({ isLoading: true });
          const response = await api.patch(
            `/integraciones/mapeos/${id}`,
            data,
          );
          set((state) => ({
            configuraciones: state.configuraciones.map((c) =>
              c.id === id ? response.data : c,
            ),
            isLoading: false,
          }));
          toast.success('Configuración actualizada exitosamente');
        } catch (error: any) {
          console.error('Error al actualizar configuración:', error);
          toast.error(
            error.response?.data?.message ||
              'Error al actualizar configuración',
          );
          set({ isLoading: false });
          throw error;
        }
      },

      eliminarConfiguracion: async (id: number) => {
        try {
          set({ isLoading: true });
          await api.delete(`/integraciones/mapeos/${id}`);
          set((state) => ({
            configuraciones: state.configuraciones.filter((c) => c.id !== id),
            isLoading: false,
          }));
          toast.success('Configuración eliminada exitosamente');
        } catch (error: any) {
          console.error('Error al eliminar configuración:', error);
          toast.error(
            error.response?.data?.message ||
              'Error al eliminar configuración',
          );
          set({ isLoading: false });
          throw error;
        }
      },

      setConfiguracionActual: (config: ConfiguracionMapeo | null) => {
        set({ configuracionActual: config });
      },

      fetchLogs: async () => {
        try {
          set({ isLoading: true });
          const response = await api.get('/integraciones/logs');
          set({ logs: response.data, isLoading: false });
        } catch (error: any) {
          console.error('Error al obtener logs:', error);
          toast.error(
            error.response?.data?.message || 'Error al cargar historial',
          );
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'integraciones-storage',
      partialize: (state) => ({
        configuracionActual: state.configuracionActual,
      }),
    },
  ),
);
