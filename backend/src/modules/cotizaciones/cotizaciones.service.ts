import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto';
import { SimularCostosDto } from './dto/simular-costos.dto';
import { EstadoCotizacion } from '@prisma/client';

@Injectable()
export class CotizacionesService {
  constructor(private prisma: PrismaService) {}

  // Parámetros de costos por defecto (pueden ser configurables por empresa)
  private readonly COSTO_DIESEL_LITRO = 23.5; // MXN
  private readonly COSTO_CASETA_KM = 5.5; // MXN promedio
  private readonly VIATICOS_DIARIOS = 500; // MXN
  private readonly KM_POR_DIA = 400; // Promedio

  private async generarFolio(empresaId: number): Promise<string> {
    const count = await this.prisma.cotizacion.count({
      where: { empresaId },
    });
    const numero = (count + 1).toString().padStart(5, '0');
    return `COT-${numero}`;
  }

  async simularCostos(empresaId: number, dto: SimularCostosDto) {
    // Obtener rendimiento del camión si se especifica
    let rendimiento = 3.5; // Default: 3.5 km/litro
    
    if (dto.camionId) {
      const camion = await this.prisma.camion.findFirst({
        where: { id: dto.camionId, empresaId },
      });
      if (camion) {
        rendimiento = Number(camion.rendimientoKmL);
      }
    }

    // Cálculos de costos estimados
    const litrosNecesarios = dto.kmEstimados / rendimiento;
    const dieselEstimado = litrosNecesarios * this.COSTO_DIESEL_LITRO;
    
    const casetasEstimado = dto.kmEstimados * this.COSTO_CASETA_KM;
    
    const diasViaje = Math.ceil(dto.kmEstimados / this.KM_POR_DIA);
    const viaticosEstimado = diasViaje * this.VIATICOS_DIARIOS;
    
    // Salario estimado basado en chofer o tarifa default
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
            salarioEstimado = Number(chofer.tarifa) * dto.kmEstimados;
            break;
          case 'POR_VIAJE':
            salarioEstimado = Number(chofer.tarifa);
            break;
        }
      }
    } else {
      // Estimación por defecto: $600/día
      salarioEstimado = 600 * diasViaje;
    }

    const totalCostos = dieselEstimado + casetasEstimado + viaticosEstimado + salarioEstimado;
    const utilidadEsperada = dto.precioCotizado - totalCostos;
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

    return {
      kmEstimados: dto.kmEstimados,
      precioCotizado: dto.precioCotizado,
      diasEstimados: diasViaje,
      costos: {
        diesel: Math.round(dieselEstimado * 100) / 100,
        casetas: Math.round(casetasEstimado * 100) / 100,
        viaticos: Math.round(viaticosEstimado * 100) / 100,
        salario: Math.round(salarioEstimado * 100) / 100,
        total: Math.round(totalCostos * 100) / 100,
      },
      utilidadEsperada: Math.round(utilidadEsperada * 100) / 100,
      margenEsperado: Math.round(margenEsperado * 100) / 100,
      nivelRiesgo,
    };
  }

  async create(empresaId: number, dto: CreateCotizacionDto) {
    const folio = await this.generarFolio(empresaId);

    // Simular costos para guardar
    const simulacion = await this.simularCostos(empresaId, {
      kmEstimados: dto.kmEstimados,
      precioCotizado: dto.precioCotizado,
      camionId: dto.camionId,
      choferId: dto.choferId,
    });

    return this.prisma.cotizacion.create({
      data: {
        empresaId,
        clienteId: dto.clienteId,
        folio,
        origen: dto.origen,
        destino: dto.destino,
        kmEstimados: dto.kmEstimados,
        precioCotizado: dto.precioCotizado,
        dieselEstimado: simulacion.costos.diesel,
        casetasEstimado: simulacion.costos.casetas,
        viaticosEstimado: simulacion.costos.viaticos,
        salarioEstimado: simulacion.costos.salario,
        utilidadEsperada: simulacion.utilidadEsperada,
        margenEsperado: simulacion.margenEsperado,
        notas: dto.notas,
        validoHasta: dto.validoHasta,
      },
      include: { cliente: true },
    });
  }

  async findAll(empresaId: number, estado?: EstadoCotizacion) {
    return this.prisma.cotizacion.findMany({
      where: {
        empresaId,
        ...(estado && { estado }),
      },
      include: { cliente: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const cotizacion = await this.prisma.cotizacion.findFirst({
      where: { id, empresaId },
      include: { cliente: true, fletes: true },
    });

    if (!cotizacion) {
      throw new NotFoundException(`Cotización con ID ${id} no encontrada`);
    }

    return cotizacion;
  }

  async update(id: number, empresaId: number, dto: UpdateCotizacionDto) {
    await this.findOne(id, empresaId);

    // Si cambian km o precio, recalcular costos
    if (dto.kmEstimados || dto.precioCotizado) {
      const cotizacionActual = await this.findOne(id, empresaId);
      const simulacion = await this.simularCostos(empresaId, {
        kmEstimados: dto.kmEstimados || Number(cotizacionActual.kmEstimados),
        precioCotizado: dto.precioCotizado || Number(cotizacionActual.precioCotizado),
      });

      return this.prisma.cotizacion.update({
        where: { id },
        data: {
          ...dto,
          dieselEstimado: simulacion.costos.diesel,
          casetasEstimado: simulacion.costos.casetas,
          viaticosEstimado: simulacion.costos.viaticos,
          salarioEstimado: simulacion.costos.salario,
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
