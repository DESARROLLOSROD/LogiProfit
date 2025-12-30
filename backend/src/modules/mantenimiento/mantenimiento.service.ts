import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MantenimientoService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.MantenimientoCreateInput) {
    return this.prisma.mantenimiento.create({
      data,
      include: { camion: true },
    });
  }

  async findAll(empresaId: number) {
    return this.prisma.mantenimiento.findMany({
      where: {
        camion: { empresaId },
      },
      include: {
        camion: true,
      },
      orderBy: { fechaProgramada: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const mantenimiento = await this.prisma.mantenimiento.findFirst({
      where: {
        id,
        camion: { empresaId },
      },
      include: { camion: true },
    });

    if (!mantenimiento) {
      throw new NotFoundException(`Mantenimiento #${id} no encontrado`);
    }

    return mantenimiento;
  }

  async findByEstado(empresaId: number, estado: string) {
    return this.prisma.mantenimiento.findMany({
      where: {
        camion: { empresaId },
        estado: estado as any,
      },
      include: { camion: true },
      orderBy: { fechaProgramada: 'asc' },
    });
  }

  async findPendientes(empresaId: number) {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    return this.prisma.mantenimiento.findMany({
      where: {
        camion: { empresaId },
        estado: 'PENDIENTE',
        OR: [
          {
            fechaProgramada: {
              lte: en30Dias,
              gte: hoy,
            },
          },
          {
            kmProgramado: { not: null },
          },
        ],
      },
      include: { camion: true },
      orderBy: { fechaProgramada: 'asc' },
    });
  }

  async update(id: number, empresaId: number, data: Prisma.MantenimientoUpdateInput) {
    await this.findOne(id, empresaId);

    return this.prisma.mantenimiento.update({
      where: { id },
      data,
      include: { camion: true },
    });
  }

  async completar(id: number, empresaId: number, data: {
    fechaRealizado: Date;
    kmRealizado?: number;
    costo?: number;
    proveedor?: string;
    comprobanteUrl?: string;
    notas?: string;
  }) {
    await this.findOne(id, empresaId);

    return this.prisma.mantenimiento.update({
      where: { id },
      data: {
        ...data,
        estado: 'COMPLETADO',
      },
      include: { camion: true },
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);

    return this.prisma.mantenimiento.delete({
      where: { id },
    });
  }

  async getProximosMantenimientos(empresaId: number) {
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(en7Dias.getDate() + 7);

    return this.prisma.mantenimiento.findMany({
      where: {
        camion: { empresaId },
        estado: 'PENDIENTE',
        fechaProgramada: {
          lte: en7Dias,
          gte: hoy,
        },
      },
      include: { camion: true },
      orderBy: { fechaProgramada: 'asc' },
    });
  }

  async getHistorialCamion(camionId: number, empresaId: number) {
    return this.prisma.mantenimiento.findMany({
      where: {
        camionId,
        camion: { empresaId },
      },
      include: { camion: true },
      orderBy: { fechaRealizado: 'desc' },
    });
  }
}
