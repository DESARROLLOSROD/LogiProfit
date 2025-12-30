import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFacturaDto, UpdateFacturaDto, UpdateEstadoPagoDto } from './dto/factura.dto';
import { EstadoPagoFactura, EstadoFlete } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FacturasService {
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

  async create(empresaId: number, dto: CreateFacturaDto, xmlFile?: Express.Multer.File, pdfFile?: Express.Multer.File) {
    // Verificar que el flete existe y pertenece a la empresa
    const flete = await this.prisma.flete.findFirst({
      where: { id: dto.fleteId, empresaId },
    });

    if (!flete) {
      throw new NotFoundException(`Flete con ID ${dto.fleteId} no encontrado`);
    }

    // Verificar que el flete está completado
    if (flete.estado !== EstadoFlete.COMPLETADO && flete.estado !== EstadoFlete.CERRADO) {
      throw new BadRequestException(
        `El flete debe estar en estado COMPLETADO o CERRADO para facturarlo. Estado actual: ${flete.estado}`
      );
    }

    // Verificar que no existe ya una factura para este flete
    const facturaExistente = await this.prisma.factura.findUnique({
      where: { fleteId: dto.fleteId },
    });

    if (facturaExistente) {
      throw new BadRequestException('Este flete ya tiene una factura asociada');
    }

    // URLs de archivos si fueron proporcionados
    const xmlUrl = xmlFile ? `/uploads/facturas/${xmlFile.filename}` : null;
    const pdfUrl = pdfFile ? `/uploads/facturas/${pdfFile.filename}` : null;

    const factura = await this.prisma.factura.create({
      data: {
        fleteId: dto.fleteId,
        numero: dto.numero,
        serie: dto.serie,
        uuid: dto.uuid,
        fechaEmision: new Date(dto.fechaEmision),
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        subtotal: dto.subtotal,
        iva: dto.iva,
        total: dto.total,
        metodoPago: dto.metodoPago,
        formaPago: dto.formaPago,
        usoCFDI: dto.usoCFDI,
        xmlUrl,
        pdfUrl,
        notas: dto.notas,
      },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
      },
    });

    return {
      ...factura,
      subtotal: this.toNumber(factura.subtotal),
      iva: this.toNumber(factura.iva),
      total: this.toNumber(factura.total),
    };
  }

  async findAll(empresaId: number, estadoPago?: EstadoPagoFactura) {
    const where: any = {
      flete: { empresaId },
    };

    if (estadoPago) {
      where.estadoPago = estadoPago;
    }

    const facturas = await this.prisma.factura.findMany({
      where,
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: { fechaEmision: 'desc' },
    });

    return facturas.map((f) => ({
      ...f,
      subtotal: this.toNumber(f.subtotal),
      iva: this.toNumber(f.iva),
      total: this.toNumber(f.total),
    }));
  }

  async findOne(id: number, empresaId: number) {
    const factura = await this.prisma.factura.findFirst({
      where: {
        id,
        flete: { empresaId },
      },
      include: {
        flete: {
          include: {
            cliente: true,
            gastos: true,
          },
        },
      },
    });

    if (!factura) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    }

    return {
      ...factura,
      subtotal: this.toNumber(factura.subtotal),
      iva: this.toNumber(factura.iva),
      total: this.toNumber(factura.total),
    };
  }

  async findByFlete(fleteId: number, empresaId: number) {
    const factura = await this.prisma.factura.findFirst({
      where: {
        fleteId,
        flete: { empresaId },
      },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
      },
    });

    if (!factura) {
      return null;
    }

    return {
      ...factura,
      subtotal: this.toNumber(factura.subtotal),
      iva: this.toNumber(factura.iva),
      total: this.toNumber(factura.total),
    };
  }

  async update(id: number, empresaId: number, dto: UpdateFacturaDto) {
    await this.findOne(id, empresaId);

    const updateData: any = {};

    if (dto.numero) updateData.numero = dto.numero;
    if (dto.serie !== undefined) updateData.serie = dto.serie;
    if (dto.uuid) updateData.uuid = dto.uuid;
    if (dto.fechaEmision) updateData.fechaEmision = new Date(dto.fechaEmision);
    if (dto.fechaVencimiento !== undefined) {
      updateData.fechaVencimiento = dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null;
    }
    if (dto.subtotal !== undefined) updateData.subtotal = dto.subtotal;
    if (dto.iva !== undefined) updateData.iva = dto.iva;
    if (dto.total !== undefined) updateData.total = dto.total;
    if (dto.metodoPago) updateData.metodoPago = dto.metodoPago;
    if (dto.formaPago) updateData.formaPago = dto.formaPago;
    if (dto.usoCFDI !== undefined) updateData.usoCFDI = dto.usoCFDI;
    if (dto.estadoPago) updateData.estadoPago = dto.estadoPago;
    if (dto.notas !== undefined) updateData.notas = dto.notas;

    const factura = await this.prisma.factura.update({
      where: { id },
      data: updateData,
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
      },
    });

    return {
      ...factura,
      subtotal: this.toNumber(factura.subtotal),
      iva: this.toNumber(factura.iva),
      total: this.toNumber(factura.total),
    };
  }

  async updateEstadoPago(id: number, empresaId: number, dto: UpdateEstadoPagoDto) {
    await this.findOne(id, empresaId);

    const factura = await this.prisma.factura.update({
      where: { id },
      data: { estadoPago: dto.estadoPago },
      include: {
        flete: {
          include: {
            cliente: true,
          },
        },
      },
    });

    return {
      ...factura,
      subtotal: this.toNumber(factura.subtotal),
      iva: this.toNumber(factura.iva),
      total: this.toNumber(factura.total),
    };
  }

  async delete(id: number, empresaId: number) {
    const factura = await this.findOne(id, empresaId);

    // Eliminar archivos XML y PDF si existen
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'facturas');

      if (factura.xmlUrl) {
        const xmlPath = path.join(uploadsDir, path.basename(factura.xmlUrl));
        await fs.unlink(xmlPath);
      }

      if (factura.pdfUrl) {
        const pdfPath = path.join(uploadsDir, path.basename(factura.pdfUrl));
        await fs.unlink(pdfPath);
      }
    } catch (error) {
      console.error('Error al eliminar archivos de factura:', error);
      // Continuar aunque falle la eliminación de archivos
    }

    return this.prisma.factura.delete({
      where: { id },
    });
  }

  // Obtener facturas pendientes de facturación (fletes completados sin factura)
  async getFletesPendientesFacturacion(empresaId: number) {
    const fletesCompletados = await this.prisma.flete.findMany({
      where: {
        empresaId,
        estado: {
          in: [EstadoFlete.COMPLETADO, EstadoFlete.CERRADO],
        },
        factura: null, // No tiene factura asociada
      },
      include: {
        cliente: true,
        gastos: true,
      },
      orderBy: { fechaFin: 'desc' },
    });

    return fletesCompletados.map((f) => ({
      ...f,
      precioCliente: this.toNumber(f.precioCliente),
      gastos: f.gastos.map((g) => ({
        ...g,
        monto: this.toNumber(g.monto),
      })),
    }));
  }

  // Estadísticas de facturación
  async getEstadisticas(empresaId: number) {
    const facturas = await this.prisma.factura.findMany({
      where: {
        flete: { empresaId },
      },
    });

    const totalFacturado = facturas.reduce((sum, f) => sum + this.toNumber(f.total), 0);
    const pendientes = facturas.filter((f) => f.estadoPago === EstadoPagoFactura.PENDIENTE).length;
    const pagadas = facturas.filter((f) => f.estadoPago === EstadoPagoFactura.PAGADA).length;
    const vencidas = facturas.filter((f) => f.estadoPago === EstadoPagoFactura.VENCIDA).length;

    const montoPendiente = facturas
      .filter((f) => f.estadoPago === EstadoPagoFactura.PENDIENTE)
      .reduce((sum, f) => sum + this.toNumber(f.total), 0);

    const montoPagado = facturas
      .filter((f) => f.estadoPago === EstadoPagoFactura.PAGADA)
      .reduce((sum, f) => sum + this.toNumber(f.total), 0);

    return {
      total: facturas.length,
      totalFacturado,
      pendientes,
      pagadas,
      vencidas,
      montoPendiente,
      montoPagado,
    };
  }
}
