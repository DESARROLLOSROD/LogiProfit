import { useAuthStore } from '../stores/authStore';
import { hasPermission, canPerformAny, canPerformAll, Modulo, Accion } from '../utils/permissions';

/**
 * Hook for checking user permissions
 * Usage:
 *   const { can, canAny, canAll } = usePermissions();
 *   if (can(Modulo.FLETES, Accion.CREAR)) { ... }
 */
export function usePermissions() {
  const { usuario } = useAuthStore();
  const userRole = usuario?.rol;

  return {
    /**
     * Check if user has a specific permission
     * @param modulo - Module to check
     * @param accion - Action to check
     * @returns true if user has permission
     */
    can: (modulo: Modulo, accion: Accion): boolean => {
      return hasPermission(userRole, modulo, accion);
    },

    /**
     * Check if user can perform any of the specified actions
     * @param modulo - Module to check
     * @param acciones - Array of actions to check (OR logic)
     * @returns true if user can perform at least one action
     */
    canAny: (modulo: Modulo, acciones: Accion[]): boolean => {
      return canPerformAny(userRole, modulo, acciones);
    },

    /**
     * Check if user can perform all of the specified actions
     * @param modulo - Module to check
     * @param acciones - Array of actions to check (AND logic)
     * @returns true if user can perform all actions
     */
    canAll: (modulo: Modulo, acciones: Accion[]): boolean => {
      return canPerformAll(userRole, modulo, acciones);
    },

    /**
     * Get the current user's role
     */
    role: userRole,

    /**
     * Check if user is admin
     */
    isAdmin: userRole === 'ADMIN',

    /**
     * Check if user is operador
     */
    isOperador: userRole === 'OPERADOR',

    /**
     * Check if user is chofer
     */
    isChofer: userRole === 'CHOFER',

    /**
     * Check if user is contabilidad
     */
    isContabilidad: userRole === 'CONTABILIDAD',

    /**
     * Check if user is direccion
     */
    isDireccion: userRole === 'DIRECCION',
  };
}
