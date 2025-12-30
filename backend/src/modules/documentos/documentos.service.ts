import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentoDto, UpdateDocumentoDto } from './dto/documento.dto';
import { EstadoDocumento } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DocumentosService {
  constructor(private prisma: PrismaService) {}

  // Helper para calcular el estado del documento basado en fecha de vencimiento
  private calcularEstado(fechaVencimiento: Date): EstadoDocumento {
    const hoy = new Date();
    const diasParaVencimiento = Math.ceil(
      (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasParaVencimiento < 0) {
      return EstadoDocumento.VENCIDO;
    } else if (diasParaVencimiento <= 30) {
      return EstadoDocumento.POR_VENCER;
    } else {
      return EstadoDocumento.VIGENTE;
    }
  }

  async create(dto: CreateDocumentoDto, archivoUrl: string) {
    const fechaVenc = new Date(dto.fechaVencimiento);
    const estado = this.calcularEstado(fechaVenc);

    return this.prisma.documentoVehiculo.create({
      data: {
        camionId: dto.camionId,
        tipo: dto.tipo,
        numero: dto.numero,
        archivoUrl,
        nombreArchivo: dto.nombreArchivo,
        fechaEmision: new Date(dto.fechaEmision),
        fechaVencimiento: fechaVenc,
        estado,
        notas: dto.notas,
      },
      include: {
        camion: {
          select: {
            id: true,
            placas: true,
            numeroEconomico: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });
  }

  async findAll(empresaId: number, camionId?: number) {
    const where: any = {
      camion: { empresaId },
    };

    if (camionId) {
      where.camionId = camionId;
    }

    return this.prisma.documentoVehiculo.findMany({
      where,
      include: {
        camion: {
          select: {
            id: true,
            placas: true,
            numeroEconomico: true,
            marca: true,
            modelo: true,
          },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const documento = await this.prisma.documentoVehiculo.findFirst({
      where: {
        id,
        camion: { empresaId },
      },
      include: {
        camion: {
          select: {
            id: true,
            placas: true,
            numeroEconomico: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });

    if (!documento) {
      throw new NotFoundException(`Documento con ID ${id} no encontrado`);
    }

    return documento;
  }

  async update(id: number, empresaId: number, dto: UpdateDocumentoDto) {
    const documento = await this.findOne(id, empresaId);

    const updateData: any = {};

    if (dto.tipo) updateData.tipo = dto.tipo;
    if (dto.numero !== undefined) updateData.numero = dto.numero;
    if (dto.fechaEmision) updateData.fechaEmision = new Date(dto.fechaEmision);
    if (dto.notas !== undefined) updateData.notas = dto.notas;

    // Si se actualiza la fecha de vencimiento, recalcular estado
    if (dto.fechaVencimiento) {
      const fechaVenc = new Date(dto.fechaVencimiento);
      updateData.fechaVencimiento = fechaVenc;
      updateData.estado = this.calcularEstado(fechaVenc);
    } else if (dto.estado) {
      updateData.estado = dto.estado;
    }

    return this.prisma.documentoVehiculo.update({
      where: { id },
      data: updateData,
      include: {
        camion: {
          select: {
            id: true,
            placas: true,
            numeroEconomico: true,
            marca: true,
            modelo: true,
          },
        },
      },
    });
  }

  async delete(id: number, empresaId: number) {
    const documento = await this.findOne(id, empresaId);

    // Eliminar el archivo del filesystem
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadsDir, path.basename(documento.archivoUrl));
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      // Continuar aunque falle la eliminación del archivo
    }

    return this.prisma.documentoVehiculo.delete({
      where: { id },
    });
  }

  // Obtener documentos próximos a vencer (alerta para dashboard)
  async getDocumentosPorVencer(empresaId: number, dias: number = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return this.prisma.documentoVehiculo.findMany({
      where: {
        camion: { empresaId },
        estado: {
          in: [EstadoDocumento.POR_VENCER, EstadoDocumento.VENCIDO],
        },
        fechaVencimiento: {
          lte: fechaLimite,
        },
      },
      include: {
        camion: {
          select: {
            id: true,
            placas: true,
            numeroEconomico: true,
            marca: true,
            modelo: true,
          },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  // Actualizar estados de todos los documentos (ejecutar periódicamente con cron)
  async actualizarEstados(empresaId: number) {
    const documentos = await this.prisma.documentoVehiculo.findMany({
      where: {
        camion: { empresaId },
      },
    });

    const updates = documentos.map((doc) => {
      const nuevoEstado = this.calcularEstado(doc.fechaVencimiento);
      if (nuevoEstado !== doc.estado) {
        return this.prisma.documentoVehiculo.update({
          where: { id: doc.id },
          data: { estado: nuevoEstado },
        });
      }
      return null;
    });

    await Promise.all(updates.filter((u) => u !== null));

    return { actualizados: updates.filter((u) => u !== null).length };
  }

  // Estadísticas de documentos por estado
  async getEstadisticas(empresaId: number) {
    const documentos = await this.prisma.documentoVehiculo.findMany({
      where: {
        camion: { empresaId },
      },
    });

    const stats = {
      total: documentos.length,
      vigentes: documentos.filter((d) => d.estado === EstadoDocumento.VIGENTE).length,
      porVencer: documentos.filter((d) => d.estado === EstadoDocumento.POR_VENCER).length,
      vencidos: documentos.filter((d) => d.estado === EstadoDocumento.VENCIDO).length,
    };

    return stats;
  }
}
