import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSION_KEY } from './roles.decorator';
import { hasPermission, Modulo, Accion } from './permissions.config';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check for permission-based access control first (preferred)
    const permissionMetadata = this.reflector.getAllAndOverride<{ modulo: Modulo; accion: Accion }>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Fall back to role-based access control (deprecated)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permission or role requirement, allow access
    if (!permissionMetadata && !requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Permission-based check
    if (permissionMetadata) {
      const { modulo, accion } = permissionMetadata;
      const allowed = hasPermission(user.rol, modulo, accion);

      if (!allowed) {
        throw new ForbiddenException(
          `No tienes permiso para realizar la acción '${accion}' en el módulo '${modulo}'`,
        );
      }

      return true;
    }

    // Role-based check (deprecated but supported for backward compatibility)
    if (requiredRoles) {
      const hasRole = requiredRoles.includes(user.rol);

      if (!hasRole) {
        throw new ForbiddenException(
          `Requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
        );
      }

      return true;
    }

    return false;
  }
}
