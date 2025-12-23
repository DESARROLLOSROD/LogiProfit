import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCamionDto, UpdateCamionDto } from './dto/camion.dto';

@Injectable()
export class CamionesService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, dto: CreateCamionDto) {
    // Verificar placas únicas en la empresa
    const existente = await this.prisma.camion.findFirst({
      where: { empresaId, placas: dto.placas },
    });

    if (existente) {
      throw new ConflictException('Ya existe un camión con esas placas');
    }

    return this.prisma.camion.create({
      data: {
        empresaId,
        ...dto,
      },
    });
  }

  async findAll(empresaId: number, activo?: boolean) {
    return this.prisma.camion.findMany({
      where: {
        empresaId,
        ...(activo !== undefined && { activo }),
      },
      orderBy: { placas: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const camion = await this.prisma.camion.findFirst({
      where: { id, empresaId },
      include: {
        fletes: {
          include: {
            flete: {
              select: { folio: true, estado: true, cliente: { select: { nombre: true } } },
            },
          },
          take: 10,
          orderBy: { flete: { createdAt: 'desc' } },
        },
        gastos: {
          take: 10,
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!camion) {
      throw new NotFoundException('Camión no encontrado');
    }

    // Calcular estadísticas
    const totalGastos = camion.gastos.reduce((sum, g) => sum + Number(g.monto), 0);

    return {
      ...camion,
      estadisticas: {
        totalFletes: camion.fletes.length,
        totalGastos,
        ultimosGastos: camion.gastos,
      },
    };
  }

  async update(id: number, empresaId: number, dto: UpdateCamionDto) {
    await this.findOne(id, empresaId);

    return this.prisma.camion.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number, empresaId: number) {
    const camion = await this.findOne(id, empresaId);

    if (camion.fletes.length > 0) {
      throw new ConflictException('No se puede eliminar un camión con fletes asociados');
    }

    return this.prisma.camion.delete({ where: { id } });
  }

  async toggleActivo(id: number, empresaId: number) {
    const camion = await this.findOne(id, empresaId);

    return this.prisma.camion.update({
      where: { id },
      data: { activo: !camion.activo },
    });
  }
}
