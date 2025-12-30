import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '../hooks/usePermissions'

interface PermissionGuardProps {
  children: ReactNode
  modulo: string
  accion: string
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
  const { hasPermission } = usePermissions()

  if (!hasPermission(modulo, accion)) {
    if (fallback) {
      return <>{fallback}</>
    }
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
