import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFleteDto } from './dto/create-flete.dto';
import { UpdateFleteDto } from './dto/update-flete.dto';
import { AsignarCamionDto } from './dto/asignar-camion.dto';
import { AsignarChoferDto } from './dto/asignar-chofer.dto';
import { UpdatePagoFleteDto } from './dto/update-pago-flete.dto';
import { EstadoFlete, EstadoPago, TipoPago } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FletesService {
  constructor(private prisma: PrismaService) {}

  // Generar folio único
  private async generarFolio(empresaId: number): Promise<string> {
    const count = await this.prisma.flete.count({
      where: { empresaId },
    });
    const numero = (count + 1).toString().padStart(5, '0');
    return `F-${numero}`;
  }

  async create(empresaId: number, createFleteDto: CreateFleteDto) {
    const folio = await this.generarFolio(empresaId);

    return this.prisma.flete.create({
      data: {
        empresaId,
        folio,
        clienteId: createFleteDto.clienteId,
        cotizacionId: createFleteDto.cotizacionId,
        origen: createFleteDto.origen,
        destino: createFleteDto.destino,
        precioCliente: createFleteDto.precioCliente,
        fechaInicio: createFleteDto.fechaInicio,
        notas: createFleteDto.notas,
      },
      include: {
        cliente: true,
        cotizacion: true,
      },
    });
  }

  async findAll(empresaId: number, options?: {
    estado?: EstadoFlete;
    clienteId?: number;
    fechaDesde?: Date;
    fechaHasta?: Date;
  }) {
    return this.prisma.flete.findMany({
      where: {
        empresaId,
        ...(options?.estado && { estado: options.estado }),
        ...(options?.clienteId && { clienteId: options.clienteId }),
        ...(options?.fechaDesde && { fechaInicio: { gte: options.fechaDesde } }),
        ...(options?.fechaHasta && { fechaInicio: { lte: options.fechaHasta } }),
      },
      include: {
        cliente: true,
        camiones: { include: { camion: true } },
        choferes: { include: { chofer: true } },
        gastos: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const flete = await this.prisma.flete.findFirst({
      where: { id, empresaId },
      include: {
        cliente: true,
        cotizacion: true,
        camiones: { include: { camion: true } },
        choferes: { include: { chofer: true } },
        gastos: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!flete) {
      throw new NotFoundException(`Flete con ID ${id} no encontrado`);
    }

    // Calcular totales
    const totalGastos = flete.gastos.reduce(
      (sum, gasto) => sum + Number(gasto.monto),
      0,
    );

    const utilidad = Number(flete.precioCliente) - totalGastos;
    const margen = Number(flete.precioCliente) > 0 
      ? (utilidad / Number(flete.precioCliente)) * 100 
      : 0;

    return {
      ...flete,
      resumen: {
        precioCliente: Number(flete.precioCliente),
        totalGastos,
        utilidad,
        margen: Math.round(margen * 100) / 100,
      },
    };
  }

  async update(id: number, empresaId: number, updateFleteDto: UpdateFleteDto) {
    await this.findOne(id, empresaId);

    return this.prisma.flete.update({
      where: { id },
      data: updateFleteDto,
      include: {
        cliente: true,
        camiones: { include: { camion: true } },
        choferes: { include: { chofer: true } },
      },
    });
  }

  async cambiarEstado(id: number, empresaId: number, estado: EstadoFlete) {
    const flete = await this.findOne(id, empresaId);

    // Validaciones de transición de estado
    if (estado === EstadoFlete.CERRADO) {
      // Verificar que haya gastos validados
      const gastosNoValidados = flete.gastos.filter(g => !g.validado);
      if (gastosNoValidados.length > 0) {
        throw new BadRequestException(
          `No se puede cerrar el flete. Hay ${gastosNoValidados.length} gastos sin validar.`
        );
      }
    }

    const updateData: any = { estado };

    if (estado === EstadoFlete.EN_CURSO && !flete.fechaInicio) {
      updateData.fechaInicio = new Date();
    }

    if (estado === EstadoFlete.CERRADO || estado === EstadoFlete.COMPLETADO) {
      updateData.fechaFin = new Date();
    }

    return this.prisma.flete.update({
      where: { id },
      data: updateData,
    });
  }

  // ==================== ASIGNACIONES ====================

  async asignarCamion(fleteId: number, empresaId: number, dto: AsignarCamionDto) {
    await this.findOne(fleteId, empresaId);

    // Verificar que el camión pertenezca a la empresa
    const camion = await this.prisma.camion.findFirst({
      where: { id: dto.camionId, empresaId },
    });

    if (!camion) {
      throw new NotFoundException('Camión no encontrado');
    }

    return this.prisma.fleteCamion.create({
      data: {
        fleteId,
        camionId: dto.camionId,
        principal: dto.principal || false,
        notas: dto.notas,
      },
      include: { camion: true },
    });
  }

  async desasignarCamion(fleteId: number, camionId: number, empresaId: number) {
    await this.findOne(fleteId, empresaId);

    return this.prisma.fleteCamion.deleteMany({
      where: { fleteId, camionId },
    });
  }

  async asignarChofer(fleteId: number, empresaId: number, dto: AsignarChoferDto) {
    const flete = await this.findOne(fleteId, empresaId);

    // Verificar que el chofer pertenezca a la empresa
    const chofer = await this.prisma.chofer.findFirst({
      where: { id: dto.choferId, empresaId },
    });

    if (!chofer) {
      throw new NotFoundException('Chofer no encontrado');
    }

    // Calcular salario según tipo de pago
    let salarioCalculado: number | null = null;

    if (dto.dias || dto.kmReales) {
      salarioCalculado = this.calcularSalarioChofer(
        chofer.tipoPago,
        Number(chofer.tarifa),
        dto.dias,
        dto.kmReales,
      );
    }

    const asignacion = await this.prisma.fleteChofer.create({
      data: {
        fleteId,
        choferId: dto.choferId,
        fechaInicio: dto.fechaInicio,
        fechaFin: dto.fechaFin,
        dias: dto.dias,
        kmReales: dto.kmReales,
        salarioCalculado,
        notas: dto.notas,
      },
      include: { chofer: true },
    });

    // Si hay salario calculado, crear el gasto automáticamente
    if (salarioCalculado && salarioCalculado > 0) {
      await this.prisma.gasto.create({
        data: {
          fleteId,
          tipo: 'SALARIO',
          concepto: `Salario chofer: ${chofer.nombre}`,
          monto: salarioCalculado,
          fecha: dto.fechaInicio,
          validado: false,
        },
      });
    }

    return asignacion;
  }

  private calcularSalarioChofer(
    tipoPago: TipoPago,
    tarifa: number,
    dias?: number,
    kmReales?: number,
  ): number {
    switch (tipoPago) {
      case TipoPago.POR_DIA:
        return dias ? tarifa * dias : 0;
      case TipoPago.POR_KM:
        return kmReales ? tarifa * kmReales : 0;
      case TipoPago.POR_VIAJE:
        return tarifa;
      default:
        return 0;
    }
  }

  async desasignarChofer(fleteId: number, choferId: number, empresaId: number) {
    await this.findOne(fleteId, empresaId);

    return this.prisma.fleteChofer.deleteMany({
      where: { fleteId, choferId },
    });
  }

  // ==================== UTILIDAD ====================

  async calcularUtilidad(fleteId: number, empresaId: number) {
    const flete = await this.findOne(fleteId, empresaId);
    return flete.resumen;
  }

  async getResumenMensual(empresaId: number, mes: number, anio: number) {
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    const fletes = await this.prisma.flete.findMany({
      where: {
        empresaId,
        fechaInicio: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        gastos: true,
      },
    });

    let totalIngresos = 0;
    let totalGastos = 0;
    let fletesConPerdida = 0;

    for (const flete of fletes) {
      const ingresos = Number(flete.precioCliente);
      const gastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0);

      totalIngresos += ingresos;
      totalGastos += gastos;

      if (gastos > ingresos) {
        fletesConPerdida++;
      }
    }

    return {
      mes,
      anio,
      totalFletes: fletes.length,
      totalIngresos,
      totalGastos,
      utilidadNeta: totalIngresos - totalGastos,
      margenPromedio: totalIngresos > 0
        ? ((totalIngresos - totalGastos) / totalIngresos) * 100
        : 0,
      fletesConPerdida,
    };
  }

  // ==================== PAGOS ====================

  async actualizarPago(
    fleteId: number,
    empresaId: number,
    updatePagoDto: UpdatePagoFleteDto,
  ) {
    // Verificar que el flete existe
    await this.findOne(fleteId, empresaId);

    const updateData: any = {
      estadoPago: updatePagoDto.estadoPago,
    };

    // Si se proporciona monto pagado, actualizarlo
    if (updatePagoDto.montoPagado !== undefined) {
      updateData.montoPagado = updatePagoDto.montoPagado;
    }

    // Si se proporciona fecha de pago, actualizarla
    if (updatePagoDto.fechaPago) {
      updateData.fechaPago = updatePagoDto.fechaPago;
    }

    // Si se proporciona fecha de vencimiento, actualizarla
    if (updatePagoDto.fechaVencimiento) {
      updateData.fechaVencimiento = updatePagoDto.fechaVencimiento;
    }

    // Si se marca como PAGADO y no hay fecha de pago, usar fecha actual
    if (updatePagoDto.estadoPago === EstadoPago.PAGADO && !updateData.fechaPago) {
      updateData.fechaPago = new Date();
    }

    return this.prisma.flete.update({
      where: { id: fleteId },
      data: updateData,
      include: {
        cliente: true,
      },
    });
  }

  // ==================== DUPLICAR FLETE ====================

  async duplicarFlete(
    fleteId: number,
    empresaId: number,
    options: { copyGastos: boolean; copyAsignaciones: boolean },
  ) {
    // Obtener flete original con todas sus relaciones
    const fleteOriginal = await this.findOne(fleteId, empresaId);

    // Generar nuevo folio
    const nuevoFolio = await this.generarFolio(empresaId);

    // Crear el nuevo flete con los datos base del original
    const nuevoFlete = await this.prisma.flete.create({
      data: {
        empresaId,
        folio: nuevoFolio,
        clienteId: fleteOriginal.clienteId,
        cotizacionId: fleteOriginal.cotizacionId,
        origen: fleteOriginal.origen,
        destino: fleteOriginal.destino,
        precioCliente: fleteOriginal.precioCliente,
        kmReales: fleteOriginal.kmReales,
        notas: fleteOriginal.notas
          ? `[COPIA] ${fleteOriginal.notas}`
          : '[COPIA] Flete duplicado',
        // Estado siempre es PLANEADO para un nuevo flete
        estado: EstadoFlete.PLANEADO,
        // No copiar fechas - el nuevo flete es independiente
      },
      include: {
        cliente: true,
        cotizacion: true,
      },
    });

    // Copiar gastos si se solicitó
    if (options.copyGastos && fleteOriginal.gastos.length > 0) {
      await Promise.all(
        fleteOriginal.gastos.map((gasto) =>
          this.prisma.gasto.create({
            data: {
              fleteId: nuevoFlete.id,
              tipo: gasto.tipo,
              concepto: gasto.concepto,
              monto: gasto.monto,
              fecha: new Date(), // Nueva fecha
              validado: false, // Gastos copiados siempre sin validar
              comprobanteUrl: gasto.comprobanteUrl,
            },
          }),
        ),
      );
    }

    // Copiar asignaciones si se solicitó
    if (options.copyAsignaciones) {
      // Copiar camiones
      if (fleteOriginal.camiones.length > 0) {
        await Promise.all(
          fleteOriginal.camiones.map((asignacion) =>
            this.prisma.fleteCamion.create({
              data: {
                fleteId: nuevoFlete.id,
                camionId: asignacion.camionId,
                principal: asignacion.principal,
                notas: asignacion.notas,
              },
            }),
          ),
        );
      }

      // Copiar choferes (sin salarios automáticos)
      if (fleteOriginal.choferes.length > 0) {
        await Promise.all(
          fleteOriginal.choferes.map((asignacion) =>
            this.prisma.fleteChofer.create({
              data: {
                fleteId: nuevoFlete.id,
                choferId: asignacion.choferId,
                fechaInicio: new Date(), // Nueva fecha de inicio
                dias: asignacion.dias,
                kmReales: asignacion.kmReales,
                notas: asignacion.notas,
                // No copiar salarios - se calculan en el nuevo flete
              },
            }),
          ),
        );
      }
    }

    // Retornar el flete completo con todas sus relaciones
    return this.findOne(nuevoFlete.id, empresaId);
  }
}
