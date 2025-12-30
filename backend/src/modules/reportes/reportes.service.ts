import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EstadoFlete, TipoGasto } from '@prisma/client';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(empresaId: number) {
    // Obtener mes actual
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Obtener últimos 6 meses para tendencia
    const mesesAtras = 6;
    const tendenciaMensual = [];

    for (let i = mesesAtras - 1; i >= 0; i--) {
      const inicioMesTendencia = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const finMesTendencia = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 0);

      const fletesMes = await this.prisma.flete.findMany({
        where: {
          empresaId,
          createdAt: { gte: inicioMesTendencia, lte: finMesTendencia },
        },
        include: { gastos: true },
      });

      const ingresos = fletesMes.reduce((sum, f) => sum + Number(f.precioCliente), 0);
      const gastos = fletesMes.reduce(
        (sum, f) => sum + f.gastos.reduce((s, g) => s + Number(g.monto), 0),
        0
      );
      const utilidad = ingresos - gastos;

      tendenciaMensual.push({
        mes: inicioMesTendencia.getMonth() + 1,
        anio: inicioMesTendencia.getFullYear(),
        ingresos,
        gastos,
        utilidad,
        margen: ingresos > 0 ? (utilidad / ingresos) * 100 : 0,
      });
    }

    // Fletes del mes
    const fletesDelMes = await this.prisma.flete.findMany({
      where: {
        empresaId,
        createdAt: { gte: inicioMes, lte: finMes },
      },
      include: { gastos: true },
    });

    // Fletes activos
    const fletesActivos = await this.prisma.flete.count({
      where: {
        empresaId,
        estado: { in: [EstadoFlete.PLANEADO, EstadoFlete.EN_CURSO] },
      },
    });

    // Calcular utilidad del mes
    let utilidadMes = 0;
    let ingresosMes = 0;
    let gastosMes = 0;
    let fletesConPerdida = 0;

    for (const flete of fletesDelMes) {
      const ingresos = Number(flete.precioCliente);
      const gastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0);
      
      ingresosMes += ingresos;
      gastosMes += gastos;
      utilidadMes += ingresos - gastos;

      if (gastos > ingresos) {
        fletesConPerdida++;
      }
    }

    // Top 5 fletes más rentables del mes
    const fletesRentables = fletesDelMes
      .map(f => ({
        id: f.id,
        folio: f.folio,
        precioCliente: Number(f.precioCliente),
        gastos: f.gastos.reduce((sum, g) => sum + Number(g.monto), 0),
        utilidad: Number(f.precioCliente) - f.gastos.reduce((sum, g) => sum + Number(g.monto), 0),
      }))
      .sort((a, b) => b.utilidad - a.utilidad)
      .slice(0, 5);

    // Top 5 con pérdida
    const fletesConPerdidaLista = fletesDelMes
      .map(f => ({
        id: f.id,
        folio: f.folio,
        precioCliente: Number(f.precioCliente),
        gastos: f.gastos.reduce((sum, g) => sum + Number(g.monto), 0),
        utilidad: Number(f.precioCliente) - f.gastos.reduce((sum, g) => sum + Number(g.monto), 0),
      }))
      .filter(f => f.utilidad < 0)
      .sort((a, b) => a.utilidad - b.utilidad)
      .slice(0, 5);

    // Top 5 clientes más rentables (últimos 3 meses)
    const inicioTrimestre = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    const fletesRecentesConCliente = await this.prisma.flete.findMany({
      where: {
        empresaId,
        createdAt: { gte: inicioTrimestre },
      },
      include: {
        cliente: true,
        gastos: true,
      },
    });

    const clientesMap = fletesRecentesConCliente.reduce((acc, flete) => {
      const clienteId = flete.clienteId;
      if (!acc[clienteId]) {
        acc[clienteId] = {
          id: flete.cliente.id,
          nombre: flete.cliente.nombre,
          ingresos: 0,
          gastos: 0,
          utilidad: 0,
          cantidadFletes: 0,
        };
      }
      const gastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0);
      acc[clienteId].ingresos += Number(flete.precioCliente);
      acc[clienteId].gastos += gastos;
      acc[clienteId].utilidad += Number(flete.precioCliente) - gastos;
      acc[clienteId].cantidadFletes += 1;
      return acc;
    }, {} as Record<number, any>);

    const topClientes = Object.values(clientesMap)
      .map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        utilidad: c.utilidad,
        margen: c.ingresos > 0 ? (c.utilidad / c.ingresos) * 100 : 0,
        cantidadFletes: c.cantidadFletes,
      }))
      .sort((a, b) => b.utilidad - a.utilidad)
      .slice(0, 5);

    return {
      periodo: {
        mes: hoy.getMonth() + 1,
        anio: hoy.getFullYear(),
      },
      resumen: {
        utilidadMes,
        ingresosMes,
        gastosMes,
        margenPromedio: ingresosMes > 0 ? (utilidadMes / ingresosMes) * 100 : 0,
        totalFletesMes: fletesDelMes.length,
        fletesActivos,
        fletesConPerdida,
      },
      tendenciaMensual,
      topRentables: fletesRentables,
      topPerdidas: fletesConPerdidaLista,
      topClientes,
    };
  }

  async getReporteRentabilidad(
    empresaId: number,
    fechaDesde: Date,
    fechaHasta: Date,
  ) {
    const fletes = await this.prisma.flete.findMany({
      where: {
        empresaId,
        createdAt: { gte: fechaDesde, lte: fechaHasta },
      },
      include: {
        cliente: true,
        gastos: true,
        camiones: { include: { camion: true } },
        choferes: { include: { chofer: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const detalle = fletes.map(flete => {
      const gastosPorTipo = flete.gastos.reduce((acc, g) => {
        acc[g.tipo] = (acc[g.tipo] || 0) + Number(g.monto);
        return acc;
      }, {} as Record<string, number>);

      const totalGastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0);
      const utilidad = Number(flete.precioCliente) - totalGastos;
      const margen = Number(flete.precioCliente) > 0 
        ? (utilidad / Number(flete.precioCliente)) * 100 
        : 0;

      return {
        id: flete.id,
        folio: flete.folio,
        cliente: flete.cliente.nombre,
        origen: flete.origen,
        destino: flete.destino,
        fechaInicio: flete.fechaInicio,
        fechaFin: flete.fechaFin,
        estado: flete.estado,
        precioCliente: Number(flete.precioCliente),
        gastosPorTipo,
        totalGastos,
        utilidad,
        margen: Math.round(margen * 100) / 100,
        camiones: flete.camiones.map(c => c.camion.placas),
        choferes: flete.choferes.map(c => c.chofer.nombre),
      };
    });

    // Totales
    const totales = detalle.reduce(
      (acc, f) => ({
        ingresos: acc.ingresos + f.precioCliente,
        gastos: acc.gastos + f.totalGastos,
        utilidad: acc.utilidad + f.utilidad,
      }),
      { ingresos: 0, gastos: 0, utilidad: 0 },
    );

    return {
      periodo: { fechaDesde, fechaHasta },
      totales: {
        ...totales,
        margenPromedio: totales.ingresos > 0 
          ? (totales.utilidad / totales.ingresos) * 100 
          : 0,
        cantidadFletes: detalle.length,
      },
      detalle,
    };
  }

  async getReporteGastosPorTipo(
    empresaId: number,
    fechaDesde: Date,
    fechaHasta: Date,
  ) {
    const gastos = await this.prisma.gasto.findMany({
      where: {
        flete: { empresaId },
        fecha: { gte: fechaDesde, lte: fechaHasta },
      },
      include: {
        flete: { select: { folio: true } },
        camion: { select: { placas: true } },
      },
    });

    // Agrupar por tipo
    const porTipo = gastos.reduce((acc, g) => {
      if (!acc[g.tipo]) {
        acc[g.tipo] = { total: 0, cantidad: 0, gastos: [] };
      }
      acc[g.tipo].total += Number(g.monto);
      acc[g.tipo].cantidad += 1;
      acc[g.tipo].gastos.push({
        id: g.id,
        monto: Number(g.monto),
        fecha: g.fecha,
        flete: g.flete.folio,
        camion: g.camion?.placas,
        concepto: g.concepto,
      });
      return acc;
    }, {} as Record<string, { total: number; cantidad: number; gastos: any[] }>);

    const totalGeneral = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

    return {
      periodo: { fechaDesde, fechaHasta },
      totalGeneral,
      cantidadGastos: gastos.length,
      porTipo: Object.entries(porTipo).map(([tipo, data]) => ({
        tipo,
        total: data.total,
        cantidad: data.cantidad,
        porcentaje: totalGeneral > 0 ? (data.total / totalGeneral) * 100 : 0,
        detalle: data.gastos.slice(0, 10), // Solo los primeros 10
      })),
    };
  }

  async getReportePorCliente(
    empresaId: number,
    fechaDesde: Date,
    fechaHasta: Date,
  ) {
    const fletes = await this.prisma.flete.findMany({
      where: {
        empresaId,
        createdAt: { gte: fechaDesde, lte: fechaHasta },
      },
      include: {
        cliente: true,
        gastos: true,
      },
    });

    // Agrupar por cliente
    const porCliente = fletes.reduce((acc, flete) => {
      const clienteId = flete.clienteId;
      if (!acc[clienteId]) {
        acc[clienteId] = {
          cliente: flete.cliente,
          fletes: 0,
          ingresos: 0,
          gastos: 0,
          utilidad: 0,
        };
      }
      
      const gastos = flete.gastos.reduce((sum, g) => sum + Number(g.monto), 0);
      acc[clienteId].fletes += 1;
      acc[clienteId].ingresos += Number(flete.precioCliente);
      acc[clienteId].gastos += gastos;
      acc[clienteId].utilidad += Number(flete.precioCliente) - gastos;
      
      return acc;
    }, {} as Record<number, any>);

    const resultado = Object.values(porCliente)
      .map((c: any) => ({
        clienteId: c.cliente.id,
        clienteNombre: c.cliente.nombre,
        cantidadFletes: c.fletes,
        ingresos: c.ingresos,
        gastos: c.gastos,
        utilidad: c.utilidad,
        margen: c.ingresos > 0 ? (c.utilidad / c.ingresos) * 100 : 0,
      }))
      .sort((a, b) => b.utilidad - a.utilidad);

    return {
      periodo: { fechaDesde, fechaHasta },
      clientes: resultado,
    };
  }
}
