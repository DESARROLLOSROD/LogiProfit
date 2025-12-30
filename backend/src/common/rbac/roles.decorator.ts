import { SetMetadata } from '@nestjs/common';
import { Modulo, Accion } from './permissions.config';

export const ROLES_KEY = 'roles';
export const PERMISSION_KEY = 'permission';

/**
 * Decorator to specify which roles are allowed to access a route
 * @deprecated Use @RequirePermission instead for granular control
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to specify required permission for a route
 * Usage: @RequirePermission(Modulo.FLETES, Accion.CREAR)
 */
export const RequirePermission = (modulo: Modulo, accion: Accion) =>
  SetMetadata(PERMISSION_KEY, { modulo, accion });
