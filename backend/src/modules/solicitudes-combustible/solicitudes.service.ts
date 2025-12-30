import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSolicitudDto,
  AprobarSolicitudDto,
  RechazarSolicitudDto,
  DepositarSolicitudDto,
} from './dto/solicitud.dto';
import { EstadoSolicitud, RolUsuario } from '@prisma/client';

@Injectable()
export class SolicitudesService {
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

  async create(operadorId: number, dto: CreateSolicitudDto) {
    // Verificar que el flete existe
    const flete = await this.prisma.flete.findUnique({
      where: { id: dto.fleteId },
    });

    if (!flete) {
      throw new NotFoundException(`Flete con ID ${dto.fleteId} no encontrado`);
    }

    // Calcular el monto total de todas las paradas
    const montoTotal = dto.paradas.reduce((sum, p) => {
      return sum + p.litros * p.precioLitro;
    }, 0);

    // Crear solicitud con paradas en transacción
    const solicitud = await this.prisma.solicitudCombustible.create({
      data: {
        fleteId: dto.fleteId,
        operadorId,
        montoTotal,
        notas: dto.notas,
        paradas: {
          create: dto.paradas.map((p, index) => ({
            orden: index + 1,
            lugar: p.lugar,
            litros: p.litros,
            precioLitro: p.precioLitro,
            total: p.litros * p.precioLitro,
            notas: p.notas,
          })),
        },
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
        paradas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    return this.convertirDecimales(solicitud);
  }

  async findAll(empresaId: number, estado?: EstadoSolicitud) {
    const where: any = {
      flete: { empresaId },
    };

    if (estado) {
      where.estado = estado;
    }

    const solicitudes = await this.prisma.solicitudCombustible.findMany({
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
        paradas: {
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return solicitudes.map((s) => this.convertirDecimales(s));
  }

  async findOne(id: number, empresaId: number) {
    const solicitud = await this.prisma.solicitudCombustible.findFirst({
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
        paradas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }

    return this.convertirDecimales(solicitud);
  }

  async aprobar(id: number, empresaId: number, aprobadorId: number, dto?: AprobarSolicitudDto) {
    const solicitud = await this.findOne(id, empresaId);

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException(`Solo se pueden aprobar solicitudes en estado PENDIENTE`);
    }

    const updated = await this.prisma.solicitudCombustible.update({
      where: { id },
      data: {
        estado: EstadoSolicitud.APROBADA,
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
        paradas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    return this.convertirDecimales(updated);
  }

  async rechazar(id: number, empresaId: number, rechazadorId: number, dto: RechazarSolicitudDto) {
    const solicitud = await this.findOne(id, empresaId);

    if (solicitud.estado !== EstadoSolicitud.PENDIENTE) {
      throw new BadRequestException(`Solo se pueden rechazar solicitudes en estado PENDIENTE`);
    }

    const updated = await this.prisma.solicitudCombustible.update({
      where: { id },
      data: {
        estado: EstadoSolicitud.RECHAZADA,
        rechazadoPor: rechazadorId,
        rechazadoAt: new Date(),
        motivoRechazo: dto.motivoRechazo,
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
        paradas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    return this.convertirDecimales(updated);
  }

  async depositar(id: number, empresaId: number, depositadorId: number, dto?: DepositarSolicitudDto) {
    const solicitud = await this.findOne(id, empresaId);

    if (solicitud.estado !== EstadoSolicitud.APROBADA) {
      throw new BadRequestException(`Solo se pueden depositar solicitudes en estado APROBADA`);
    }

    const updated = await this.prisma.solicitudCombustible.update({
      where: { id },
      data: {
        estado: EstadoSolicitud.DEPOSITADA,
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
        paradas: {
          orderBy: { orden: 'asc' },
        },
      },
    });

    return this.convertirDecimales(updated);
  }

  async delete(id: number, empresaId: number) {
    const solicitud = await this.findOne(id, empresaId);

    // Solo se pueden eliminar solicitudes PENDIENTES o RECHAZADAS
    if (solicitud.estado !== EstadoSolicitud.PENDIENTE && solicitud.estado !== EstadoSolicitud.RECHAZADA) {
      throw new BadRequestException(
        `Solo se pueden eliminar solicitudes en estado PENDIENTE o RECHAZADA. Estado actual: ${solicitud.estado}`
      );
    }

    // Las paradas se eliminan automáticamente por CASCADE
    return this.prisma.solicitudCombustible.delete({
      where: { id },
    });
  }

  // Obtener solicitudes del operador actual
  async findMisSolicitudes(operadorId: number, estado?: EstadoSolicitud) {
    const where: any = {
      operadorId,
    };

    if (estado) {
      where.estado = estado;
    }

    const solicitudes = await this.prisma.solicitudCombustible.findMany({
      where,
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
        paradas: {
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return solicitudes.map((s) => this.convertirDecimales(s));
  }

  // Estadísticas de solicitudes
  async getEstadisticas(empresaId: number) {
    const solicitudes = await this.prisma.solicitudCombustible.findMany({
      where: {
        flete: { empresaId },
      },
    });

    const total = solicitudes.length;
    const pendientes = solicitudes.filter((s) => s.estado === EstadoSolicitud.PENDIENTE).length;
    const aprobadas = solicitudes.filter((s) => s.estado === EstadoSolicitud.APROBADA).length;
    const depositadas = solicitudes.filter((s) => s.estado === EstadoSolicitud.DEPOSITADA).length;
    const rechazadas = solicitudes.filter((s) => s.estado === EstadoSolicitud.RECHAZADA).length;

    const montoTotal = solicitudes.reduce((sum, s) => sum + this.toNumber(s.montoTotal), 0);
    const montoDepositado = solicitudes
      .filter((s) => s.estado === EstadoSolicitud.DEPOSITADA)
      .reduce((sum, s) => sum + this.toNumber(s.montoTotal), 0);

    return {
      total,
      pendientes,
      aprobadas,
      depositadas,
      rechazadas,
      montoTotal,
      montoDepositado,
    };
  }

  private convertirDecimales(solicitud: any) {
    return {
      ...solicitud,
      montoTotal: this.toNumber(solicitud.montoTotal),
      paradas: solicitud.paradas?.map((p: any) => ({
        ...p,
        litros: this.toNumber(p.litros),
        precioLitro: this.toNumber(p.precioLitro),
        total: this.toNumber(p.total),
      })),
    };
  }
}
