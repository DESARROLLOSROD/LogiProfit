import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChoferDto, UpdateChoferDto } from './dto/chofer.dto';

@Injectable()
export class ChoferesService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, dto: CreateChoferDto) {
    return this.prisma.chofer.create({
      data: {
        empresaId,
        ...dto,
      },
    });
  }

  async findAll(empresaId: number, activo?: boolean) {
    return this.prisma.chofer.findMany({
      where: {
        empresaId,
        ...(activo !== undefined && { activo }),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const chofer = await this.prisma.chofer.findFirst({
      where: { id, empresaId },
      include: {
        fletes: {
          include: {
            flete: {
              select: { folio: true, estado: true, precioCliente: true },
            },
          },
          take: 10,
          orderBy: { fechaInicio: 'desc' },
        },
      },
    });

    if (!chofer) {
      throw new NotFoundException('Chofer no encontrado');
    }

    // Calcular estadísticas
    const totalSalarios = chofer.fletes.reduce(
      (sum, f) => sum + (Number(f.salarioCalculado) || 0),
      0,
    );

    return {
      ...chofer,
      estadisticas: {
        totalFletes: chofer.fletes.length,
        totalSalarios,
        ultimosFletes: chofer.fletes,
      },
    };
  }

  async update(id: number, empresaId: number, dto: UpdateChoferDto) {
    await this.findOne(id, empresaId);

    return this.prisma.chofer.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number, empresaId: number) {
    const chofer = await this.findOne(id, empresaId);

    if (chofer.fletes.length > 0) {
      throw new NotFoundException('No se puede eliminar un chofer con fletes asociados');
    }

    return this.prisma.chofer.delete({ where: { id } });
  }

  async toggleActivo(id: number, empresaId: number) {
    const chofer = await this.findOne(id, empresaId);

    return this.prisma.chofer.update({
      where: { id },
      data: { activo: !chofer.activo },
    });
  }
}
