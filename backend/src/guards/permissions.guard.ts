import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      { modulo: string; accion: string }[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Los ADMIN tienen todos los permisos
    if (user.rol === 'ADMIN') {
      return true;
    }

    // Obtener permisos del usuario
    const userPermissions = await this.prisma.usuarioPermiso.findMany({
      where: { usuarioId: user.id },
      include: { permiso: true },
    });

    const userPerms = userPermissions.map((up) => ({
      modulo: up.permiso.modulo,
      accion: up.permiso.accion,
    }));

    // Verificar si el usuario tiene todos los permisos requeridos
    const hasAllPermissions = requiredPermissions.every((required) =>
      userPerms.some(
        (perm) =>
          perm.modulo === required.modulo && perm.accion === required.accion,
      ),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }

    return true;
  }
}
