import { useMemo } from 'react'
import { useAuthStore } from '../stores/authStore'

export function usePermissions() {
  const { usuario } = useAuthStore()

  const hasPermission = useMemo(() => {
    return (modulo: string, accion: string): boolean => {
      if (!usuario) return false

      // Los ADMIN tienen todos los permisos
      if (usuario.rol === 'ADMIN') return true

      // Verificar permisos específicos del usuario
      if (usuario.permisos) {
        return usuario.permisos.some(
          (p: any) => p.permiso.modulo === modulo && p.permiso.accion === accion
        )
      }

      return false
    }
  }, [usuario])

  const canCreate = (modulo: string) => hasPermission(modulo, 'crear')
  const canRead = (modulo: string) => hasPermission(modulo, 'leer')
  const canUpdate = (modulo: string) => hasPermission(modulo, 'actualizar')
  const canDelete = (modulo: string) => hasPermission(modulo, 'eliminar')
  const canExport = (modulo: string) => hasPermission(modulo, 'exportar')

  const isAdmin = usuario?.rol === 'ADMIN'
  const isOperador = usuario?.rol === 'OPERADOR'
  const isContabilidad = usuario?.rol === 'CONTABILIDAD'
  const isDireccion = usuario?.rol === 'DIRECCION'

  return {
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canExport,
    isAdmin,
    isOperador,
    isContabilidad,
    isDireccion,
  }
}
