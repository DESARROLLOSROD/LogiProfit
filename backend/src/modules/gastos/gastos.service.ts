import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';
import { TipoGasto } from '@prisma/client';

@Injectable()
export class GastosService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, dto: CreateGastoDto) {
    // Verificar que el flete pertenezca a la empresa
    const flete = await this.prisma.flete.findFirst({
      where: { id: dto.fleteId, empresaId },
    });

    if (!flete) {
      throw new NotFoundException('Flete no encontrado');
    }

    // Si se especifica camión, verificar que pertenezca a la empresa
    if (dto.camionId) {
      const camion = await this.prisma.camion.findFirst({
        where: { id: dto.camionId, empresaId },
      });
      if (!camion) {
        throw new NotFoundException('Camión no encontrado');
      }
    }

    return this.prisma.gasto.create({
      data: {
        fleteId: dto.fleteId,
        camionId: dto.camionId,
        tipo: dto.tipo,
        concepto: dto.concepto,
        monto: dto.monto,
        fecha: dto.fecha,
        comprobanteUrl: dto.comprobanteUrl,
        notas: dto.notas,
      },
      include: {
        flete: { select: { folio: true, cliente: { select: { nombre: true } } } },
        camion: { select: { placas: true } },
      },
    });
  }

  async findAllByFlete(fleteId: number, empresaId: number) {
    // Verificar acceso al flete
    const flete = await this.prisma.flete.findFirst({
      where: { id: fleteId, empresaId },
    });

    if (!flete) {
      throw new NotFoundException('Flete no encontrado');
    }

    const gastos = await this.prisma.gasto.findMany({
      where: { fleteId },
      include: {
        camion: { select: { placas: true } },
      },
      orderBy: { fecha: 'desc' },
    });

    // Calcular totales por tipo
    const totalesPorTipo = gastos.reduce((acc, gasto) => {
      const tipo = gasto.tipo;
      acc[tipo] = (acc[tipo] || 0) + Number(gasto.monto);
      return acc;
    }, {} as Record<string, number>);

    const totalGeneral = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

    return {
      gastos,
      resumen: {
        totalGeneral,
        porTipo: totalesPorTipo,
        cantidadGastos: gastos.length,
        gastosValidados: gastos.filter(g => g.validado).length,
        gastosPendientes: gastos.filter(g => !g.validado).length,
      },
    };
  }

  async findOne(id: number, empresaId: number) {
    const gasto = await this.prisma.gasto.findFirst({
      where: { id },
      include: {
        flete: {
          include: { cliente: true },
        },
        camion: true,
      },
    });

    if (!gasto) {
      throw new NotFoundException('Gasto no encontrado');
    }

    if (gasto.flete.empresaId !== empresaId) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return gasto;
  }

  async update(id: number, empresaId: number, dto: UpdateGastoDto) {
    await this.findOne(id, empresaId);

    return this.prisma.gasto.update({
      where: { id },
      data: dto,
    });
  }

  async validar(id: number, empresaId: number, usuarioId: number) {
    await this.findOne(id, empresaId);

    return this.prisma.gasto.update({
      where: { id },
      data: {
        validado: true,
        validadoPor: usuarioId,
        validadoAt: new Date(),
      },
    });
  }

  async invalidar(id: number, empresaId: number) {
    await this.findOne(id, empresaId);

    return this.prisma.gasto.update({
      where: { id },
      data: {
        validado: false,
        validadoPor: null,
        validadoAt: null,
      },
    });
  }

  async delete(id: number, empresaId: number) {
    const gasto = await this.findOne(id, empresaId);

    if (gasto.validado) {
      throw new BadRequestException('No se puede eliminar un gasto validado');
    }

    return this.prisma.gasto.delete({ where: { id } });
  }

  async getResumenPorPeriodo(empresaId: number, fechaDesde: Date, fechaHasta: Date) {
    const gastos = await this.prisma.gasto.findMany({
      where: {
        flete: { empresaId },
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
      include: {
        flete: { select: { folio: true } },
      },
    });

    const porTipo = gastos.reduce((acc, gasto) => {
      const tipo = gasto.tipo;
      acc[tipo] = (acc[tipo] || 0) + Number(gasto.monto);
      return acc;
    }, {} as Record<string, number>);

    return {
      fechaDesde,
      fechaHasta,
      totalGastos: gastos.reduce((sum, g) => sum + Number(g.monto), 0),
      cantidadGastos: gastos.length,
      porTipo,
    };
  }
}
