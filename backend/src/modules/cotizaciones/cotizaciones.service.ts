import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCotizacionDto, UpdateCotizacionDto, SimularCostosDto } from './dto/cotizacion.dto';
import { EstadoCotizacion } from '@prisma/client';

@Injectable()
export class CotizacionesService {
  constructor(private prisma: PrismaService) {}

  // Parámetros de costos por defecto (basados en metodología real)
  private readonly COSTO_DIESEL_LITRO = 24.0; // MXN (actualizado)
  private readonly COSTO_CASETA_KM = 5.5; // MXN promedio (fallback si no se especifica)
  private readonly KM_POR_DIA = 400; // Promedio para calcular días

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

  // Defaults para viáticos detallados
  private readonly COSTO_COMIDA_DEFAULT = 120; // MXN
  private readonly COSTO_FEDERAL_DEFAULT = 100; // MXN
  private readonly COSTO_TELEFONO_DEFAULT = 100; // MXN
  private readonly IMPREVISTOS_VIATICOS_DEFAULT = 500; // MXN

  // Defaults para carro piloto
  private readonly COSTO_BASE_CARRO_PILOTO = 5000; // MXN
  private readonly COSTO_GASOLINA_CARRO_PILOTO_DIA = 4500; // MXN por día
  private readonly COSTO_CASETAS_CARRO_PILOTO_DIA = 2000; // MXN por día
  private readonly COSTO_ALIMENTACION_CARRO_PILOTO = 240; // MXN por día (21 comidas / día)

  // Porcentajes por defecto
  private readonly PORCENTAJE_MANTENIMIENTO = 25; // %
  private readonly PORCENTAJE_INDIRECTOS = 20; // %

  private async generarFolio(empresaId: number): Promise<string> {
    const count = await this.prisma.cotizacion.count({
      where: { empresaId },
    });
    const numero = (count + 1).toString().padStart(5, '0');
    return `COT-${numero}`;
  }

  async simularCostos(empresaId: number, dto: SimularCostosDto) {
    const kmCargado = dto.kmCargado || 0;
    const kmVacio = dto.kmVacio || 0;
    const kmTotal = kmCargado + kmVacio;

    // ============= OBTENER RENDIMIENTO DEL CAMIÓN =============
    let rendimientoCargado = 2.5; // Default km/L
    let rendimientoVacio = 3.0; // Default km/L

    if (dto.camionId) {
      const camion = await this.prisma.camion.findFirst({
        where: { id: dto.camionId, empresaId },
      });
      if (camion) {
        rendimientoCargado = Number(camion.rendimientoKmLCargado);
        rendimientoVacio = Number(camion.rendimientoKmLVacio);
      }
    }

    // ============= 1. DIESEL =============
    const litrosCargado = kmCargado / rendimientoCargado;
    const litrosVacio = kmVacio / rendimientoVacio;
    const litrosTotales = litrosCargado + litrosVacio;
    const dieselEstimado = litrosTotales * this.COSTO_DIESEL_LITRO;

    // ============= 2. CASETAS =============
    let casetasEstimado = 0;
    if (dto.casetasCargado !== undefined && dto.casetasVacio !== undefined) {
      // Usar costos reales si se proporcionan
      casetasEstimado = dto.casetasCargado + dto.casetasVacio;
    } else {
      // Fallback: estimación por km
      casetasEstimado = kmTotal * this.COSTO_CASETA_KM;
    }

    // ============= 3. VIÁTICOS DETALLADOS =============
    const diasViaje = Math.ceil(kmTotal / this.KM_POR_DIA);

    const comidasCantidad = dto.comidasCantidad || (diasViaje * 3); // 3 comidas/día
    const comidasPU = dto.comidasPrecioUnitario || this.COSTO_COMIDA_DEFAULT;
    const costoComidas = comidasCantidad * comidasPU;

    const federalCantidad = dto.federalCantidad || diasViaje;
    const federalPU = dto.federalPrecioUnitario || this.COSTO_FEDERAL_DEFAULT;
    const costoFederal = federalCantidad * federalPU;

    const telefonoCantidad = dto.telefonoCantidad || Math.ceil(diasViaje / 3); // Cada 3 días
    const telefonoPU = dto.telefonoPrecioUnitario || this.COSTO_TELEFONO_DEFAULT;
    const costoTelefono = telefonoCantidad * telefonoPU;

    const imprevistosViaticos = dto.imprevistosViaticos || this.IMPREVISTOS_VIATICOS_DEFAULT;

    const viaticosEstimado = costoComidas + costoFederal + costoTelefono + imprevistosViaticos;

    // ============= 4. SALARIO DEL CHOFER =============
    let salarioEstimado = 0;
    if (dto.choferId) {
      const chofer = await this.prisma.chofer.findFirst({
        where: { id: dto.choferId, empresaId },
      });
      if (chofer) {
        switch (chofer.tipoPago) {
          case 'POR_DIA':
            salarioEstimado = Number(chofer.tarifa) * diasViaje;
            break;
          case 'POR_KM':
            salarioEstimado = Number(chofer.tarifa) * kmCargado;
            break;
          case 'POR_VIAJE':
            salarioEstimado = Number(chofer.tarifa);
            break;
          case 'POR_QUINCENA':
            // Prorratear quincena (15 días) según días de viaje
            salarioEstimado = (Number(chofer.tarifa) / 15) * diasViaje;
            break;
          case 'MENSUAL':
            // Prorratear mes (30 días) según días de viaje
            salarioEstimado = (Number(chofer.tarifa) / 30) * diasViaje;
            break;
        }
      }
    } else {
      // Estimación por defecto: $600/día
      salarioEstimado = 600 * diasViaje;
    }

    // ============= 5. PERMISO SCT =============
    const permisoEstimado = dto.permisoEstimado || 0;

    // ============= SUBTOTAL OPERATIVO =============
    const subtotalOperativo = dieselEstimado + casetasEstimado + viaticosEstimado + salarioEstimado + permisoEstimado;

    // ============= 6. COSTOS PORCENTUALES =============
    const porcentajeMantenimiento = dto.porcentajeMantenimiento || this.PORCENTAJE_MANTENIMIENTO;
    const montoMantenimiento = (subtotalOperativo * porcentajeMantenimiento) / 100;

    const porcentajeIndirectos = dto.porcentajeIndirectos || this.PORCENTAJE_INDIRECTOS;
    const montoIndirectos = (subtotalOperativo * porcentajeIndirectos) / 100;

    // ============= 7. CARRO PILOTO =============
    let carroPiloto = {
      requiere: dto.requiereCarroPiloto || false,
      dias: 0,
      costoBase: 0,
      gasolina: 0,
      casetas: 0,
      alimentacion: 0,
      imprevistos: 0,
      total: 0,
    };

    if (dto.requiereCarroPiloto) {
      const diasCP = dto.diasCarroPiloto || diasViaje;
      const costoBase = dto.costoBaseCarroPiloto || this.COSTO_BASE_CARRO_PILOTO;
      const gasolina = this.COSTO_GASOLINA_CARRO_PILOTO_DIA * diasCP;
      const casetas = this.COSTO_CASETAS_CARRO_PILOTO_DIA * diasCP;
      const alimentacion = this.COSTO_ALIMENTACION_CARRO_PILOTO * diasCP * 3; // 3 comidas/día
      const imprevistos = 500; // Fijo

      carroPiloto = {
        requiere: true,
        dias: diasCP,
        costoBase,
        gasolina,
        casetas,
        alimentacion,
        imprevistos,
        total: costoBase + gasolina + casetas + alimentacion + imprevistos,
      };
    }

    // ============= COSTO TOTAL =============
    const costoTotal = subtotalOperativo + montoMantenimiento + montoIndirectos + carroPiloto.total;

    // ============= UTILIDAD Y MARGEN =============
    const utilidadEsperada = dto.precioCotizado - costoTotal;
    const margenEsperado = dto.precioCotizado > 0
      ? (utilidadEsperada / dto.precioCotizado) * 100
      : 0;

    // Nivel de riesgo basado en margen
    let nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
    if (margenEsperado >= 25) {
      nivelRiesgo = 'BAJO';
    } else if (margenEsperado >= 10) {
      nivelRiesgo = 'MEDIO';
    } else {
      nivelRiesgo = 'ALTO';
    }

    // ============= RETORNO CON DESGLOSE COMPLETO =============
    return {
      // Información general
      kmCargado,
      kmVacio,
      kmTotal,
      precioCotizado: dto.precioCotizado,
      diasEstimados: diasViaje,

      // Desglose de costos operativos
      diesel: {
        litrosCargado: Math.round(litrosCargado * 100) / 100,
        litrosVacio: Math.round(litrosVacio * 100) / 100,
        litrosTotales: Math.round(litrosTotales * 100) / 100,
        precioLitro: this.COSTO_DIESEL_LITRO,
        costo: Math.round(dieselEstimado * 100) / 100,
      },

      casetas: {
        cargado: dto.casetasCargado || Math.round((kmCargado * this.COSTO_CASETA_KM) * 100) / 100,
        vacio: dto.casetasVacio || Math.round((kmVacio * this.COSTO_CASETA_KM) * 100) / 100,
        total: Math.round(casetasEstimado * 100) / 100,
      },

      viaticos: {
        comidas: { cantidad: comidasCantidad, precioUnitario: comidasPU, total: Math.round(costoComidas * 100) / 100 },
        federal: { cantidad: federalCantidad, precioUnitario: federalPU, total: Math.round(costoFederal * 100) / 100 },
        telefono: { cantidad: telefonoCantidad, precioUnitario: telefonoPU, total: Math.round(costoTelefono * 100) / 100 },
        imprevistos: Math.round(imprevistosViaticos * 100) / 100,
        total: Math.round(viaticosEstimado * 100) / 100,
      },

      salario: Math.round(salarioEstimado * 100) / 100,
      permiso: Math.round(permisoEstimado * 100) / 100,

      subtotalOperativo: Math.round(subtotalOperativo * 100) / 100,

      // Costos porcentuales
      mantenimiento: {
        porcentaje: porcentajeMantenimiento,
        monto: Math.round(montoMantenimiento * 100) / 100,
      },
      indirectos: {
        porcentaje: porcentajeIndirectos,
        monto: Math.round(montoIndirectos * 100) / 100,
      },

      // Carro piloto
      carroPiloto: {
        requiere: carroPiloto.requiere,
        dias: carroPiloto.dias,
        costoBase: Math.round(carroPiloto.costoBase * 100) / 100,
        gasolina: Math.round(carroPiloto.gasolina * 100) / 100,
        casetas: Math.round(carroPiloto.casetas * 100) / 100,
        alimentacion: Math.round(carroPiloto.alimentacion * 100) / 100,
        imprevistos: Math.round(carroPiloto.imprevistos * 100) / 100,
        total: Math.round(carroPiloto.total * 100) / 100,
      },

      // Totales
      costoTotal: Math.round(costoTotal * 100) / 100,
      utilidadEsperada: Math.round(utilidadEsperada * 100) / 100,
      margenEsperado: Math.round(margenEsperado * 100) / 100,
      nivelRiesgo,

      // Desglose porcentual
      desglosePorcentual: {
        diesel: Math.round((dieselEstimado / costoTotal) * 10000) / 100,
        casetas: Math.round((casetasEstimado / costoTotal) * 10000) / 100,
        viaticos: Math.round((viaticosEstimado / costoTotal) * 10000) / 100,
        salario: Math.round((salarioEstimado / costoTotal) * 10000) / 100,
        permiso: Math.round((permisoEstimado / costoTotal) * 10000) / 100,
        mantenimiento: Math.round((montoMantenimiento / costoTotal) * 10000) / 100,
        indirectos: Math.round((montoIndirectos / costoTotal) * 10000) / 100,
        carroPiloto: Math.round((carroPiloto.total / costoTotal) * 10000) / 100,
      },
    };
  }

  async create(empresaId: number, dto: CreateCotizacionDto) {
    const folio = await this.generarFolio(empresaId);

    // Simular costos para guardar con todos los campos
    const simulacion = await this.simularCostos(empresaId, dto);

    return this.prisma.cotizacion.create({
      data: {
        empresaId,
        clienteId: dto.clienteId,
        folio,
        origen: dto.origen,
        destino: dto.destino,

        // Información de carga
        tipoCarga: dto.tipoCarga,
        pesoCarga: dto.pesoCarga,
        dimensiones: dto.dimensiones,

        // Kilometraje
        kmCargado: simulacion.kmCargado,
        kmVacio: simulacion.kmVacio,
        kmTotal: simulacion.kmTotal,

        precioCotizado: dto.precioCotizado,

        // Costos operativos directos
        dieselEstimado: simulacion.diesel.costo,
        casetasEstimado: simulacion.casetas.total,
        viaticosEstimado: simulacion.viaticos.total,
        salarioEstimado: simulacion.salario,
        permisoEstimado: simulacion.permiso,

        // Costos porcentuales
        porcentajeMantenimiento: simulacion.mantenimiento.porcentaje,
        montoMantenimiento: simulacion.mantenimiento.monto,
        porcentajeIndirectos: simulacion.indirectos.porcentaje,
        montoIndirectos: simulacion.indirectos.monto,

        // Carro piloto
        requiereCarroPiloto: simulacion.carroPiloto.requiere,
        diasCarroPiloto: simulacion.carroPiloto.dias || null,
        costoBaseCarroPiloto: simulacion.carroPiloto.costoBase || null,
        gasolinaCarroPiloto: simulacion.carroPiloto.gasolina || null,
        casetasCarroPiloto: simulacion.carroPiloto.casetas || null,
        alimentacionCarroPiloto: simulacion.carroPiloto.alimentacion || null,
        imprevistosCarroPiloto: simulacion.carroPiloto.imprevistos || null,
        totalCarroPiloto: simulacion.carroPiloto.total,

        // Viáticos detallados
        comidasCantidad: simulacion.viaticos.comidas.cantidad,
        comidasPrecioUnitario: simulacion.viaticos.comidas.precioUnitario,
        federalCantidad: simulacion.viaticos.federal.cantidad,
        federalPrecioUnitario: simulacion.viaticos.federal.precioUnitario,
        telefonoCantidad: simulacion.viaticos.telefono.cantidad,
        telefonoPrecioUnitario: simulacion.viaticos.telefono.precioUnitario,
        imprevistosViaticos: simulacion.viaticos.imprevistos,

        // Casetas detalladas
        casetasCargado: simulacion.casetas.cargado,
        casetasVacio: simulacion.casetas.vacio,

        // Totales
        costoTotal: simulacion.costoTotal,
        utilidadEsperada: simulacion.utilidadEsperada,
        margenEsperado: simulacion.margenEsperado,

        notas: dto.notas,
        validoHasta: dto.validoHasta,
      },
      include: { cliente: true },
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
      precioCotizado: this.toNumber(cot.precioCotizado),
      utilidadEsperada: this.toNumber(cot.utilidadEsperada),
      margenEsperado: this.toNumber(cot.margenEsperado),
      costoTotal: this.toNumber(cot.costoTotal),
      kmCargado: this.toNumber(cot.kmCargado),
      kmVacio: this.toNumber(cot.kmVacio),
      kmTotal: this.toNumber(cot.kmTotal),
      dieselEstimado: this.toNumber(cot.dieselEstimado),
      casetasEstimado: this.toNumber(cot.casetasEstimado),
      viaticosEstimado: this.toNumber(cot.viaticosEstimado),
      salarioEstimado: this.toNumber(cot.salarioEstimado),
      permisoEstimado: this.toNumber(cot.permisoEstimado),
    }));
  }

  async findOne(id: number, empresaId: number) {
    const cotizacion = await this.prisma.cotizacion.findFirst({
      where: { id, empresaId },
      include: { cliente: true, fletes: true },
    });

    if (!cotizacion) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    // Convertir campos Decimal a números para el frontend
    return {
      ...cotizacion,
      precioCotizado: this.toNumber(cotizacion.precioCotizado),
      utilidadEsperada: this.toNumber(cotizacion.utilidadEsperada),
      margenEsperado: this.toNumber(cotizacion.margenEsperado),
      costoTotal: this.toNumber(cotizacion.costoTotal),
      kmCargado: this.toNumber(cotizacion.kmCargado),
      kmVacio: this.toNumber(cotizacion.kmVacio),
      kmTotal: this.toNumber(cotizacion.kmTotal),
      dieselEstimado: this.toNumber(cotizacion.dieselEstimado),
      casetasEstimado: this.toNumber(cotizacion.casetasEstimado),
      viaticosEstimado: this.toNumber(cotizacion.viaticosEstimado),
      salarioEstimado: this.toNumber(cotizacion.salarioEstimado),
      permisoEstimado: this.toNumber(cotizacion.permisoEstimado),
      pesoCarga: cotizacion.pesoCarga ? this.toNumber(cotizacion.pesoCarga) : null,
      porcentajeMantenimiento: this.toNumber(cotizacion.porcentajeMantenimiento),
      montoMantenimiento: this.toNumber(cotizacion.montoMantenimiento),
      porcentajeIndirectos: this.toNumber(cotizacion.porcentajeIndirectos),
      montoIndirectos: this.toNumber(cotizacion.montoIndirectos),
      casetasCargado: cotizacion.casetasCargado ? this.toNumber(cotizacion.casetasCargado) : null,
      casetasVacio: cotizacion.casetasVacio ? this.toNumber(cotizacion.casetasVacio) : null,
      comidasPrecioUnitario: cotizacion.comidasPrecioUnitario ? this.toNumber(cotizacion.comidasPrecioUnitario) : null,
      federalPrecioUnitario: cotizacion.federalPrecioUnitario ? this.toNumber(cotizacion.federalPrecioUnitario) : null,
      telefonoPrecioUnitario: cotizacion.telefonoPrecioUnitario ? this.toNumber(cotizacion.telefonoPrecioUnitario) : null,
      imprevistosViaticos: cotizacion.imprevistosViaticos ? this.toNumber(cotizacion.imprevistosViaticos) : null,
      costoBaseCarroPiloto: cotizacion.costoBaseCarroPiloto ? this.toNumber(cotizacion.costoBaseCarroPiloto) : null,
      gasolinaCarroPiloto: cotizacion.gasolinaCarroPiloto ? this.toNumber(cotizacion.gasolinaCarroPiloto) : null,
      casetasCarroPiloto: cotizacion.casetasCarroPiloto ? this.toNumber(cotizacion.casetasCarroPiloto) : null,
      alimentacionCarroPiloto: cotizacion.alimentacionCarroPiloto ? this.toNumber(cotizacion.alimentacionCarroPiloto) : null,
      imprevistosCarroPiloto: cotizacion.imprevistosCarroPiloto ? this.toNumber(cotizacion.imprevistosCarroPiloto) : null,
      totalCarroPiloto: this.toNumber(cotizacion.totalCarroPiloto),
    };
  }

  async update(id: number, empresaId: number, dto: UpdateCotizacionDto) {
    const cotizacionActual = await this.findOne(id, empresaId);

    // Si cambian km o precio, recalcular costos
    if (dto.kmCargado !== undefined || dto.kmVacio !== undefined || dto.precioCotizado !== undefined) {
      const simulacion = await this.simularCostos(empresaId, {
        kmCargado: dto.kmCargado ?? Number(cotizacionActual.kmCargado),
        kmVacio: dto.kmVacio ?? Number(cotizacionActual.kmVacio),
        precioCotizado: dto.precioCotizado ?? Number(cotizacionActual.precioCotizado),
        requiereCarroPiloto: dto.requiereCarroPiloto ?? cotizacionActual.requiereCarroPiloto,
        porcentajeMantenimiento: dto.porcentajeMantenimiento ?? Number(cotizacionActual.porcentajeMantenimiento),
        porcentajeIndirectos: dto.porcentajeIndirectos ?? Number(cotizacionActual.porcentajeIndirectos),
      });

      return this.prisma.cotizacion.update({
        where: { id },
        data: {
          ...dto,
          kmCargado: simulacion.kmCargado,
          kmVacio: simulacion.kmVacio,
          kmTotal: simulacion.kmTotal,
          dieselEstimado: simulacion.diesel.costo,
          casetasEstimado: simulacion.casetas.total,
          viaticosEstimado: simulacion.viaticos.total,
          costoTotal: simulacion.costoTotal,
          utilidadEsperada: simulacion.utilidadEsperada,
          margenEsperado: simulacion.margenEsperado,
        },
        include: { cliente: true },
      });
    }

    return this.prisma.cotizacion.update({
      where: { id },
      data: dto,
      include: { cliente: true },
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

    if (cotizacion.fletes.length > 0) {
      throw new BadRequestException('No se puede eliminar una cotización con fletes asociados');
    }

    return this.prisma.cotizacion.delete({ where: { id } });
  }
}
