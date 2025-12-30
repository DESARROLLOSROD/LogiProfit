import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EstadoFlete, EstadoCotizacion } from '@prisma/client';

interface FletesPendientes {
  sinGastosRegistrados: Array<{
    id: number;
    folio: string;
    cliente: { nombre: string };
    origen: string;
    destino: string;
    estado: string;
    fechaInicio: Date | null;
  }>;
  total: number;
}

interface CotizacionesPorVencer {
  cotizaciones: Array<{
    id: number;
    folio: string;
    cliente: { nombre: string };
    precioCotizado: any;
    validoHasta?: Date;
    diasRestantes: number;
  }>;
  total: number;
}

interface XmlFaltantes {
  gastos: Array<{
    id: number;
    flete: {
      id: number;
      folio: string;
      cliente: { nombre: string };
    };
    tipo: string;
    monto: any;
    fecha: Date;
  }>;
  total: number;
}

interface PagosVencidos {
  pagos: Array<{
    id: number;
    flete: {
      id: number;
      folio: string;
      cliente: { nombre: string };
    };
    fechaVencimiento?: Date;
    diasVencido: number;
  }>;
  total: number;
}

export interface PendientesResponse {
  fletesSinGastos: FletesPendientes;
  cotizacionesPorVencer: CotizacionesPorVencer;
  xmlFaltantes: XmlFaltantes;
  pagosVencidos: PagosVencidos;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getPendientes(empresaId: number): Promise<PendientesResponse> {
    const hoy = new Date();
    const en7Dias = new Date();
    en7Dias.setDate(hoy.getDate() + 7);

    // 1. Fletes sin gastos registrados (estados que requieren gastos)
    const fletesSinGastos = await this.prisma.flete.findMany({
      where: {
        empresaId,
        estado: {
          in: [EstadoFlete.EN_CURSO, EstadoFlete.COMPLETADO],
        },
        gastos: {
          none: {},
        },
      },
      select: {
        id: true,
        folio: true,
        cliente: {
          select: {
            nombre: true,
          },
        },
        origen: true,
        destino: true,
        estado: true,
        fechaInicio: true,
      },
      orderBy: {
        fechaInicio: 'asc',
      },
      take: 20,
    });

    // 2. Cotizaciones próximas a vencer (siguientes 7 días) o ya vencidas
    const cotizacionesPorVencer = await this.prisma.cotizacion.findMany({
      where: {
        empresaId,
        estado: {
          in: [EstadoCotizacion.ENVIADA, EstadoCotizacion.BORRADOR],
        },
        validoHasta: {
          lte: en7Dias,
        },
      },
      select: {
        id: true,
        folio: true,
        cliente: {
          select: {
            nombre: true,
          },
        },
        precioCotizado: true,
        validoHasta: true,
      },
      orderBy: {
        validoHasta: 'asc',
      },
      take: 20,
    });

    const cotizacionesConDias = cotizacionesPorVencer.map((cot: any) => {
      const diasRestantes = cot.validoHasta
        ? Math.ceil((cot.validoHasta.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        ...cot,
        diasRestantes,
      };
    });

    // 3. Gastos sin comprobante (comprobante fiscal faltante)
    const gastosSinXml = await this.prisma.gasto.findMany({
      where: {
        flete: {
          empresaId,
        },
        comprobanteUrl: null,
      },
      select: {
        id: true,
        flete: {
          select: {
            id: true,
            folio: true,
            cliente: {
              select: {
                nombre: true,
              },
            },
          },
        },
        tipo: true,
        monto: true,
        fecha: true,
      },
      orderBy: {
        fecha: 'desc',
      },
      take: 20,
    });

    // 4. Pagos vencidos (lógica pendiente - requiere modelo de Pagos)
    // Por ahora retornamos vacío, se implementará cuando exista el modelo
    const pagosVencidos: any[] = [];

    return {
      fletesSinGastos: {
        sinGastosRegistrados: fletesSinGastos,
        total: fletesSinGastos.length,
      },
      cotizacionesPorVencer: {
        cotizaciones: cotizacionesConDias,
        total: cotizacionesConDias.length,
      },
      xmlFaltantes: {
        gastos: gastosSinXml,
        total: gastosSinXml.length,
      },
      pagosVencidos: {
        pagos: pagosVencidos,
        total: 0,
      },
    };
  }
}
