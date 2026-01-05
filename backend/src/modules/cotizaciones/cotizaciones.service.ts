import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCotizacionDto, UpdateCotizacionDto } from './dto/cotizacion.dto';
import { EstadoCotizacion } from '@prisma/client';

@Injectable()
export class CotizacionesService {
  constructor(private prisma: PrismaService) { }

  // Helper para convertir Decimal a número de forma segura
  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  private async generarFolio(empresaId: number): Promise<string> {
    const count = await this.prisma.cotizacion.count({
      where: { empresaId },
    });
    const numero = (count + 1).toString().padStart(5, '0');
    return `COT-${numero}`;
  }

  /**
   * Calcula IVA, retención y total según el tipo de persona del cliente
   * Persona Física: Total = Subtotal + IVA (16%)
   * Persona Moral: Total = Subtotal + IVA (16%) - Retención (4%)
   */
  private async calcularImpuestos(clienteId: number, subtotal: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { tipoPersona: true },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);
    }

    const IVA_RATE = 0.16; // 16%
    const RETENCION_RATE = 0.04; // 4%

    const iva = subtotal * IVA_RATE;
    const retencion = cliente.tipoPersona === 'MORAL' ? subtotal * RETENCION_RATE : 0;
    const total = subtotal + iva - retencion;

    return {
      iva: Number(iva.toFixed(2)),
      retencion: Number(retencion.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  async create(empresaId: number, dto: CreateCotizacionDto) {
    const folio = await this.generarFolio(empresaId);

    // Calcular impuestos basados en el tipo de persona del cliente
    const { iva, retencion, total } = await this.calcularImpuestos(
      dto.clienteId,
      dto.subtotal,
    );

    // Si viene precioCotizado (legacy), usarlo como subtotal
    const subtotal = dto.subtotal || dto.precioCotizado || 0;

    return this.prisma.cotizacion.create({
      data: {
        empresaId,
        folio,
        clienteId: dto.clienteId,
        calculoId: dto.calculoId,
        origen: dto.origen,
        destino: dto.destino,
        tipoCarga: dto.tipoCarga,
        pesoCarga: dto.pesoCarga,
        dimensiones: dto.dimensiones,
        kmEstimado: dto.kmEstimado,
        subtotal,
        iva,
        retencion,
        total,
        precioCotizado: dto.precioCotizado || total, // Compatibilidad
        notas: dto.notas,
        validoHasta: dto.validoHasta,
        estado: EstadoCotizacion.BORRADOR,
      },
      include: {
        cliente: true,
        conceptos: true,
      },
    });
  }

  async findAll(empresaId: number, estado?: EstadoCotizacion) {
    const cotizaciones = await this.prisma.cotizacion.findMany({
      where: {
        empresaId,
        ...(estado && { estado }),
      },
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
    });

    // Convertir campos Decimal a números para el frontend
    return cotizaciones.map(cot => ({
      ...cot,
      kmEstimado: this.toNumber(cot.kmEstimado),
      subtotal: this.toNumber(cot.subtotal),
      iva: this.toNumber(cot.iva),
      retencion: this.toNumber(cot.retencion),
      total: this.toNumber(cot.total),
      precioCotizado: this.toNumber(cot.precioCotizado),
      pesoCarga: cot.pesoCarga ? this.toNumber(cot.pesoCarga) : null,
    }));
  }

  async findOne(id: number, empresaId: number) {
    const cotizacion = await this.prisma.cotizacion.findFirst({
      where: { id, empresaId },
      include: {
        cliente: true,
        calculo: true,
        fletes: true,
        conceptos: {
          orderBy: { orden: 'asc' }
        }
      },
    });

    if (!cotizacion) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    // Convertir campos Decimal a números para el frontend
    return {
      ...cotizacion,
      kmEstimado: this.toNumber(cotizacion.kmEstimado),
      subtotal: this.toNumber(cotizacion.subtotal),
      iva: this.toNumber(cotizacion.iva),
      retencion: this.toNumber(cotizacion.retencion),
      total: this.toNumber(cotizacion.total),
      precioCotizado: this.toNumber(cotizacion.precioCotizado),
      pesoCarga: cotizacion.pesoCarga ? this.toNumber(cotizacion.pesoCarga) : null,
      conceptos: cotizacion.conceptos.map(c => ({
        ...c,
        cantidad: this.toNumber(c.cantidad),
        precioUnit: this.toNumber(c.precioUnit),
        subtotal: this.toNumber(c.subtotal),
      })),
    };
  }

  async update(id: number, empresaId: number, dto: UpdateCotizacionDto) {
    const cotizacion = await this.findOne(id, empresaId);

    // Si se actualiza el subtotal, recalcular impuestos
    let updateData: any = { ...dto };

    if (dto.subtotal !== undefined) {
      const { iva, retencion, total } = await this.calcularImpuestos(
        cotizacion.clienteId,
        dto.subtotal,
      );
      updateData = {
        ...updateData,
        iva,
        retencion,
        total,
        precioCotizado: total, // Mantener compatibilidad
      };
    }

    return this.prisma.cotizacion.update({
      where: { id },
      data: updateData,
      include: { cliente: true, conceptos: true },
    });
  }

  async cambiarEstado(id: number, empresaId: number, estado: EstadoCotizacion) {
    await this.findOne(id, empresaId);

    return this.prisma.cotizacion.update({
      where: { id },
      data: { estado },
    });
  }

  async convertirAFlete(id: number, empresaId: number) {
    const cotizacion = await this.findOne(id, empresaId);

    if (cotizacion.estado === EstadoCotizacion.CONVERTIDA) {
      throw new BadRequestException('Esta cotización ya fue convertida a flete');
    }

    // Generar folio de flete
    const countFletes = await this.prisma.flete.count({ where: { empresaId } });
    const folioFlete = `F-${(countFletes + 1).toString().padStart(5, '0')}`;

    // Crear flete y actualizar cotización en transacción
    const [flete] = await this.prisma.$transaction([
      this.prisma.flete.create({
        data: {
          empresaId,
          cotizacionId: id,
          clienteId: cotizacion.clienteId,
          folio: folioFlete,
          origen: cotizacion.origen,
          destino: cotizacion.destino,
          precioCliente: cotizacion.precioCotizado,
        },
        include: { cliente: true, cotizacion: true },
      }),
      this.prisma.cotizacion.update({
        where: { id },
        data: { estado: EstadoCotizacion.CONVERTIDA },
      }),
    ]);

    return flete;
  }

  async delete(id: number, empresaId: number) {
    const cotizacion = await this.findOne(id, empresaId);

    // Verificar si hay fletes asociados
    if (cotizacion.fletes && cotizacion.fletes.length > 0) {
      // Verificar el estado de los fletes
      const fletesActivos = cotizacion.fletes.filter(
        f => f.estado !== 'PLANEADO' && f.estado !== 'CANCELADO'
      );

      if (fletesActivos.length > 0) {
        const estados = fletesActivos.map(f => f.estado).join(', ');
        throw new BadRequestException(
          `No se puede eliminar la cotización. Tiene ${fletesActivos.length} flete(s) ` +
          `en estado activo (${estados}). Solo se permite si todos los fletes están ` +
          `en estado PLANEADO o CANCELADO.`
        );
      }

      // Si todos los fletes están en PLANEADO o CANCELADO, eliminarlos primero
      await this.prisma.flete.deleteMany({
        where: { cotizacionId: id },
      });
    }

    // Los conceptos se eliminan automáticamente gracias a onDelete: Cascade
    return this.prisma.cotizacion.delete({ where: { id } });
  }

  // ==================== GESTIÓN DE CONCEPTOS ====================

  // NOTA: El precioCotizado NO se recalcula automáticamente al agregar conceptos.
  // El precioCotizado es el precio que se cotizó al cliente (valor fijo).
  // Los conceptos son un desglose informativo que puede o no coincidir con el precio cotizado.

  async addConcepto(cotizacionId: number, empresaId: number, data: any) {
    // Verificar que la cotización pertenece a la empresa
    await this.findOne(cotizacionId, empresaId);

    const subtotal = Number(data.cantidad) * Number(data.precioUnit);

    const concepto = await this.prisma.cotizacionConcepto.create({
      data: {
        cotizacionId,
        tipo: data.tipo,
        descripcion: data.descripcion,
        cantidad: data.cantidad,
        unidad: data.unidad,
        precioUnit: data.precioUnit,
        subtotal,
        orden: data.orden || 0,
      },
    });

    return concepto;
  }

  async updateConcepto(conceptoId: number, cotizacionId: number, empresaId: number, data: any) {
    // Verificar que la cotización pertenece a la empresa
    await this.findOne(cotizacionId, empresaId);

    // Verificar que el concepto pertenece a la cotización
    const concepto = await this.prisma.cotizacionConcepto.findFirst({
      where: { id: conceptoId, cotizacionId },
    });

    if (!concepto) {
      throw new NotFoundException('Concepto no encontrado');
    }

    // Recalcular subtotal si cambian cantidad o precio
    let subtotal = Number(concepto.subtotal);
    if (data.cantidad !== undefined || data.precioUnit !== undefined) {
      const cantidad = data.cantidad !== undefined ? Number(data.cantidad) : Number(concepto.cantidad);
      const precioUnit = data.precioUnit !== undefined ? Number(data.precioUnit) : Number(concepto.precioUnit);
      subtotal = cantidad * precioUnit;
    }

    const updated = await this.prisma.cotizacionConcepto.update({
      where: { id: conceptoId },
      data: {
        ...data,
        subtotal,
      },
    });

    return updated;
  }

  async deleteConcepto(conceptoId: number, cotizacionId: number, empresaId: number) {
    // Verificar que la cotización pertenece a la empresa
    await this.findOne(cotizacionId, empresaId);

    // Verificar que el concepto pertenece a la cotización
    const concepto = await this.prisma.cotizacionConcepto.findFirst({
      where: { id: conceptoId, cotizacionId },
    });

    if (!concepto) {
      throw new NotFoundException('Concepto no encontrado');
    }

    const deleted = await this.prisma.cotizacionConcepto.delete({
      where: { id: conceptoId },
    });

    return deleted;
  }
}
