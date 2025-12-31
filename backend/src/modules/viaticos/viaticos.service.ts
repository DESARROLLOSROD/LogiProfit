import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSolicitudViaticoDto,
  UpdateSolicitudViaticoDto,
  AprobarSolicitudViaticoDto,
  DepositarSolicitudViaticoDto,
  CancelarSolicitudViaticoDto,
} from './dto/solicitud-viatico.dto';
import {
  CreateComprobacionViaticoDto,
  ValidarComprobacionDto,
} from './dto/comprobacion-viatico.dto';
import { EstadoSolicitudViatico, EstadoComprobacionViatico } from '@prisma/client';

@Injectable()
export class ViaticosService {
  constructor(private prisma: PrismaService) {}

  // Helper para convertir Decimal a número
  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  // ==================== SOLICITUDES ====================

  async createSolicitud(operadorId: number, dto: CreateSolicitudViaticoDto) {
    // Verificar que el flete existe
    const flete = await this.prisma.flete.findUnique({
      where: { id: dto.fleteId },
    });

    if (!flete) {
      throw new NotFoundException(`Flete con ID ${dto.fleteId} no encontrado`);
    }

    const solicitud = await this.prisma.solicitudViatico.create({
      data: {
        fleteId: dto.fleteId,
        operadorId,
        tipoGasto: dto.tipoGasto,
        periodoInicio: new Date(dto.periodoInicio),
        periodoFin: new Date(dto.periodoFin),
        montoSolicitado: dto.montoSolicitado,
        detalle: dto.detalle,
        notas: dto.notas,
      },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return this.convertirDecimalesSolicitud(solicitud);
  }

  async findAllSolicitudes(
    empresaId: number,
    estado?: EstadoSolicitudViatico,
    fleteId?: number,
  ) {
    const where: any = {
      flete: { empresaId },
    };

    if (estado) {
      where.estado = estado;
    }

    if (fleteId) {
      where.fleteId = fleteId;
    }

    const solicitudes = await this.prisma.solicitudViatico.findMany({
      where,
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return solicitudes.map((s) => this.convertirDecimalesSolicitud(s));
  }

  async findOneSolicitud(id: number, empresaId: number) {
    const solicitud = await this.prisma.solicitudViatico.findFirst({
      where: {
        id,
        flete: { empresaId },
      },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }

    return this.convertirDecimalesSolicitud(solicitud);
  }

  async updateSolicitud(
    id: number,
    empresaId: number,
    operadorId: number,
    dto: UpdateSolicitudViaticoDto,
  ) {
    const solicitud = await this.findOneSolicitud(id, empresaId);

    // Solo el operador puede editar su propia solicitud
    if (solicitud.operadorId !== operadorId) {
      throw new BadRequestException('No tienes permiso para editar esta solicitud');
    }

    // Solo se pueden editar solicitudes en estado SOLICITADO
    if (solicitud.estado !== EstadoSolicitudViatico.SOLICITADO) {
      throw new BadRequestException(
        `Solo se pueden editar solicitudes en estado SOLICITADO. Estado actual: ${solicitud.estado}`,
      );
    }

    const updated = await this.prisma.solicitudViatico.update({
      where: { id },
      data: {
        ...(dto.tipoGasto && { tipoGasto: dto.tipoGasto }),
        ...(dto.periodoInicio && { periodoInicio: new Date(dto.periodoInicio) }),
        ...(dto.periodoFin && { periodoFin: new Date(dto.periodoFin) }),
        ...(dto.montoSolicitado !== undefined && { montoSolicitado: dto.montoSolicitado }),
        ...(dto.detalle && { detalle: dto.detalle }),
        ...(dto.notas !== undefined && { notas: dto.notas }),
      },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return this.convertirDecimalesSolicitud(updated);
  }

  async aprobarSolicitud(
    id: number,
    empresaId: number,
    aprobadorId: number,
    dto?: AprobarSolicitudViaticoDto,
  ) {
    const solicitud = await this.findOneSolicitud(id, empresaId);

    if (solicitud.estado !== EstadoSolicitudViatico.SOLICITADO) {
      throw new BadRequestException(
        `Solo se pueden aprobar solicitudes en estado SOLICITADO`,
      );
    }

    const updated = await this.prisma.solicitudViatico.update({
      where: { id },
      data: {
        estado: EstadoSolicitudViatico.APROBADO,
        aprobadoPor: aprobadorId,
        aprobadoAt: new Date(),
        notas: dto?.notas || solicitud.notas,
      },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return this.convertirDecimalesSolicitud(updated);
  }

  async depositarSolicitud(
    id: number,
    empresaId: number,
    depositadorId: number,
    dto?: DepositarSolicitudViaticoDto,
  ) {
    const solicitud = await this.findOneSolicitud(id, empresaId);

    if (solicitud.estado !== EstadoSolicitudViatico.APROBADO) {
      throw new BadRequestException(
        `Solo se pueden depositar solicitudes en estado APROBADO`,
      );
    }

    const updated = await this.prisma.solicitudViatico.update({
      where: { id },
      data: {
        estado: EstadoSolicitudViatico.DEPOSITADO,
        depositadoPor: depositadorId,
        depositadoAt: new Date(),
        notas: dto?.notas || solicitud.notas,
      },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return this.convertirDecimalesSolicitud(updated);
  }

  async cancelarSolicitud(
    id: number,
    empresaId: number,
    canceladorId: number,
    dto: CancelarSolicitudViaticoDto,
  ) {
    const solicitud = await this.findOneSolicitud(id, empresaId);

    // No se pueden cancelar solicitudes ya depositadas
    if (solicitud.estado === EstadoSolicitudViatico.DEPOSITADO) {
      throw new BadRequestException(
        `No se pueden cancelar solicitudes en estado DEPOSITADO`,
      );
    }

    const updated = await this.prisma.solicitudViatico.update({
      where: { id },
      data: {
        estado: EstadoSolicitudViatico.CANCELADO,
        canceladoPor: canceladorId,
        canceladoAt: new Date(),
        motivoCancelacion: dto.motivoCancelacion,
      },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return this.convertirDecimalesSolicitud(updated);
  }

  async deleteSolicitud(id: number, empresaId: number, operadorId: number) {
    const solicitud = await this.findOneSolicitud(id, empresaId);

    // Solo el operador puede eliminar su propia solicitud
    if (solicitud.operadorId !== operadorId) {
      throw new BadRequestException('No tienes permiso para eliminar esta solicitud');
    }

    // Solo se pueden eliminar solicitudes SOLICITADO o CANCELADO
    if (
      solicitud.estado !== EstadoSolicitudViatico.SOLICITADO &&
      solicitud.estado !== EstadoSolicitudViatico.CANCELADO
    ) {
      throw new BadRequestException(
        `Solo se pueden eliminar solicitudes en estado SOLICITADO o CANCELADO. Estado actual: ${solicitud.estado}`,
      );
    }

    return this.prisma.solicitudViatico.delete({
      where: { id },
    });
  }

  async findMisSolicitudes(operadorId: number, estado?: EstadoSolicitudViatico) {
    const where: any = {
      operadorId,
    };

    if (estado) {
      where.estado = estado;
    }

    const solicitudes = await this.prisma.solicitudViatico.findMany({
      where,
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return solicitudes.map((s) => this.convertirDecimalesSolicitud(s));
  }

  // ==================== COMPROBACIONES ====================

  async createComprobacion(operadorId: number, dto: CreateComprobacionViaticoDto) {
    // Verificar que el flete existe
    const flete = await this.prisma.flete.findUnique({
      where: { id: dto.fleteId },
    });

    if (!flete) {
      throw new NotFoundException(`Flete con ID ${dto.fleteId} no encontrado`);
    }

    // Si hay solicitudId, verificar que existe y pertenece al operador
    if (dto.solicitudId) {
      const solicitud = await this.prisma.solicitudViatico.findUnique({
        where: { id: dto.solicitudId },
      });

      if (!solicitud) {
        throw new NotFoundException(
          `Solicitud con ID ${dto.solicitudId} no encontrada`,
        );
      }

      if (solicitud.operadorId !== operadorId) {
        throw new BadRequestException(
          'La solicitud no pertenece a este operador',
        );
      }
    }

    const comprobacion = await this.prisma.comprobacionViatico.create({
      data: {
        solicitudId: dto.solicitudId,
        fleteId: dto.fleteId,
        operadorId,
        archivos: dto.archivos as any,
        notas: dto.notas,
      },
      include: {
        solicitud: true,
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    return comprobacion;
  }

  async findAllComprobaciones(
    empresaId: number,
    estado?: EstadoComprobacionViatico,
    fleteId?: number,
  ) {
    const where: any = {
      flete: { empresaId },
    };

    if (estado) {
      where.estado = estado;
    }

    if (fleteId) {
      where.fleteId = fleteId;
    }

    const comprobaciones = await this.prisma.comprobacionViatico.findMany({
      where,
      include: {
        solicitud: true,
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        validador: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comprobaciones;
  }

  async findOneComprobacion(id: number, empresaId: number) {
    const comprobacion = await this.prisma.comprobacionViatico.findFirst({
      where: {
        id,
        flete: { empresaId },
      },
      include: {
        solicitud: true,
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        validador: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!comprobacion) {
      throw new NotFoundException(`Comprobación con ID ${id} no encontrada`);
    }

    return comprobacion;
  }

  async validarComprobacion(
    id: number,
    empresaId: number,
    validadorId: number,
    dto: ValidarComprobacionDto,
  ) {
    const comprobacion = await this.findOneComprobacion(id, empresaId);

    if (comprobacion.estado !== EstadoComprobacionViatico.PENDIENTE_VALIDACION) {
      throw new BadRequestException(
        `Solo se pueden validar comprobaciones en estado PENDIENTE_VALIDACION`,
      );
    }

    if (!dto.aprobado && !dto.motivoRechazo) {
      throw new BadRequestException(
        'Se requiere motivoRechazo cuando se rechaza una comprobación',
      );
    }

    const updated = await this.prisma.comprobacionViatico.update({
      where: { id },
      data: {
        estado: dto.aprobado
          ? EstadoComprobacionViatico.APROBADO
          : EstadoComprobacionViatico.RECHAZADO,
        validadorId,
        validadoAt: new Date(),
        motivoRechazo: dto.motivoRechazo,
        notas: dto.notas || comprobacion.notas,
      },
      include: {
        solicitud: true,
        flete: {
          include: {
            cliente: true,
          },
        },
        operador: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        validador: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return updated;
  }

  async deleteComprobacion(id: number, empresaId: number, operadorId: number) {
    const comprobacion = await this.findOneComprobacion(id, empresaId);

    // Solo el operador puede eliminar su propia comprobación
    if (comprobacion.operadorId !== operadorId) {
      throw new BadRequestException('No tienes permiso para eliminar esta comprobación');
    }

    // Solo se pueden eliminar comprobaciones pendientes o rechazadas
    if (
      comprobacion.estado !== EstadoComprobacionViatico.PENDIENTE_VALIDACION &&
      comprobacion.estado !== EstadoComprobacionViatico.RECHAZADO
    ) {
      throw new BadRequestException(
        `Solo se pueden eliminar comprobaciones en estado PENDIENTE_VALIDACION o RECHAZADO. Estado actual: ${comprobacion.estado}`,
      );
    }

    return this.prisma.comprobacionViatico.delete({
      where: { id },
    });
  }

  async findMisComprobaciones(
    operadorId: number,
    estado?: EstadoComprobacionViatico,
  ) {
    const where: any = {
      operadorId,
    };

    if (estado) {
      where.estado = estado;
    }

    const comprobaciones = await this.prisma.comprobacionViatico.findMany({
      where,
      include: {
        solicitud: true,
        flete: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comprobaciones;
  }

  // ==================== UTILIDADES ====================

  async getFletesDisponibles(empresaId: number) {
    return this.prisma.flete.findMany({
      where: {
        empresaId,
        estado: {
          in: ['EN_CURSO', 'COMPLETADO'],
        },
      },
      select: {
        id: true,
        folio: true,
        origen: true,
        destino: true,
        estado: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getEstadisticasSolicitudes(empresaId: number) {
    const solicitudes = await this.prisma.solicitudViatico.findMany({
      where: {
        flete: { empresaId },
      },
    });

    const total = solicitudes.length;
    const solicitados = solicitudes.filter(
      (s) => s.estado === EstadoSolicitudViatico.SOLICITADO,
    ).length;
    const aprobados = solicitudes.filter(
      (s) => s.estado === EstadoSolicitudViatico.APROBADO,
    ).length;
    const depositados = solicitudes.filter(
      (s) => s.estado === EstadoSolicitudViatico.DEPOSITADO,
    ).length;
    const cancelados = solicitudes.filter(
      (s) => s.estado === EstadoSolicitudViatico.CANCELADO,
    ).length;

    const montoTotal = solicitudes.reduce(
      (sum, s) => sum + this.toNumber(s.montoSolicitado),
      0,
    );
    const montoDepositado = solicitudes
      .filter((s) => s.estado === EstadoSolicitudViatico.DEPOSITADO)
      .reduce((sum, s) => sum + this.toNumber(s.montoSolicitado), 0);

    return {
      total,
      solicitados,
      aprobados,
      depositados,
      cancelados,
      montoTotal,
      montoDepositado,
    };
  }

  async getEstadisticasComprobaciones(empresaId: number) {
    const comprobaciones = await this.prisma.comprobacionViatico.findMany({
      where: {
        flete: { empresaId },
      },
    });

    const total = comprobaciones.length;
    const pendientes = comprobaciones.filter(
      (c) => c.estado === EstadoComprobacionViatico.PENDIENTE_VALIDACION,
    ).length;
    const aprobadas = comprobaciones.filter(
      (c) => c.estado === EstadoComprobacionViatico.APROBADO,
    ).length;
    const rechazadas = comprobaciones.filter(
      (c) => c.estado === EstadoComprobacionViatico.RECHAZADO,
    ).length;

    return {
      total,
      pendientes,
      aprobadas,
      rechazadas,
    };
  }

  private convertirDecimalesSolicitud(solicitud: any) {
    return {
      ...solicitud,
      montoSolicitado: this.toNumber(solicitud.montoSolicitado),
    };
  }
}
