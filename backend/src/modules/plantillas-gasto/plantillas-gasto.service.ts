import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlantillaGastoDto, UpdatePlantillaGastoDto } from '../gastos/dto/plantilla-gasto.dto';
import { TipoGasto } from '@prisma/client';

@Injectable()
export class PlantillasGastoService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, createDto: CreatePlantillaGastoDto) {
    return this.prisma.plantillaGasto.create({
      data: {
        empresaId,
        nombre: createDto.nombre,
        tipo: createDto.tipo,
        concepto: createDto.concepto,
        montoEstimado: createDto.montoEstimado,
      },
    });
  }

  async findAll(empresaId: number, includeInactive = false) {
    return this.prisma.plantillaGasto.findMany({
      where: {
        empresaId,
        ...(includeInactive ? {} : { activa: true }),
      },
      orderBy: [
        { activa: 'desc' },
        { nombre: 'asc' },
      ],
    });
  }

  async findOne(id: number, empresaId: number) {
    const plantilla = await this.prisma.plantillaGasto.findFirst({
      where: { id, empresaId },
    });

    if (!plantilla) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada`);
    }

    return plantilla;
  }

  async update(id: number, empresaId: number, updateDto: UpdatePlantillaGastoDto) {
    await this.findOne(id, empresaId);

    return this.prisma.plantillaGasto.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);

    // Soft delete - marcar como inactiva
    return this.prisma.plantillaGasto.update({
      where: { id },
      data: { activa: false },
    });
  }

  async crearPlantillasPredeterminadas(empresaId: number) {
    const plantillasPredeterminadas = [
      {
        nombre: 'Diesel - Carga Completa',
        tipo: TipoGasto.DIESEL,
        concepto: 'Carga de diesel completa',
        montoEstimado: 5000,
      },
      {
        nombre: 'Casetas - Ruta Nacional',
        tipo: TipoGasto.CASETAS,
        concepto: 'Casetas promedio ruta nacional',
        montoEstimado: 1500,
      },
      {
        nombre: 'Mantenimiento Preventivo',
        tipo: TipoGasto.MANTENIMIENTO,
        concepto: 'Servicio de mantenimiento preventivo',
        montoEstimado: 2000,
      },
      {
        nombre: 'Comida Chofer',
        tipo: TipoGasto.OTRO,
        concepto: 'Viáticos de comida para chofer',
        montoEstimado: 500,
      },
    ];

    return Promise.all(
      plantillasPredeterminadas.map((plantilla) =>
        this.prisma.plantillaGasto.create({
          data: {
            empresaId,
            ...plantilla,
          },
        }),
      ),
    );
  }
}
