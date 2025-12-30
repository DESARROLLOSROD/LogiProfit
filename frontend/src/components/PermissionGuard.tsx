import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'
import { Modulo, Accion } from '../utils/permissions'

interface PermissionGuardProps {
  children: ReactNode
  modulo: Modulo
  accion: Accion
  fallback?: ReactNode
  redirectTo?: string
}

export default function PermissionGuard({
  children,
  modulo,
  accion,
  fallback,
  redirectTo = '/dashboard',
}: PermissionGuardProps) {
  const { can } = usePermissions()

  if (!can(modulo, accion)) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
