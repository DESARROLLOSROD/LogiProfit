import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, dto: CreateClienteDto) {
    return this.prisma.cliente.create({
      data: {
        empresaId,
        ...dto,
      },
    });
  }

  async findAll(empresaId: number, activo?: boolean) {
    return this.prisma.cliente.findMany({
      where: {
        empresaId,
        ...(activo !== undefined && { activo }),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, empresaId },
      include: {
        fletes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            gastos: true,
          },
        },
        cotizaciones: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Calcular estadísticas
    let totalFacturado = 0;
    let totalUtilidad = 0;

    for (const flete of cliente.fletes) {
      const gastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0);
      totalFacturado += Number(flete.precioCliente);
      totalUtilidad += Number(flete.precioCliente) - gastos;
    }

    return {
      ...cliente,
      estadisticas: {
        totalFletes: cliente.fletes.length,
        totalCotizaciones: cliente.cotizaciones.length,
        totalFacturado,
        totalUtilidad,
        margenPromedio: totalFacturado > 0 ? (totalUtilidad / totalFacturado) * 100 : 0,
      },
    };
  }

  async update(id: number, empresaId: number, dto: UpdateClienteDto) {
    await this.findOne(id, empresaId);

    return this.prisma.cliente.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number, empresaId: number) {
    const cliente = await this.findOne(id, empresaId);

    if (cliente.fletes.length > 0) {
      throw new NotFoundException('No se puede eliminar un cliente con fletes asociados');
    }

    return this.prisma.cliente.delete({ where: { id } });
  }

  async toggleActivo(id: number, empresaId: number) {
    const cliente = await this.findOne(id, empresaId);

    return this.prisma.cliente.update({
      where: { id },
      data: { activo: !cliente.activo },
    });
  }
}
